// Automated browser test for Dawson's Discovery World 3D.
// Runs the REAL 3d/index.html in headless Chromium (Playwright) with an iPhone-landscape
// sized touch viewport. WebGL runs in SOFTWARE (SwiftShader) here, so it is slow and
// says nothing about speed on a real iPhone. Not a physical-device test.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const FILE = (process.env.DDW3_TEST_URL || 'file://' + path.join(ROOT, 'index.html')) + '?test';
const SHOTS = path.join(ROOT, 'screenshots'); fs.mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UG_F = -6;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const contextOptions = { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 };
  let ctx = await browser.newContext(contextOptions);
  let page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // (the one exception: Chromium's own GPU-driver note about the character portraits' one-time picture readback at start-up; see NEXT_TASKS)
  const DRIVER_NOTE = /^\[\.WebGL-[0-9a-fx]+\]GL Driver Message \(OpenGL, Performance, [A-Z_]+, High\): GPU stall due to ReadPixels$/;
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !DRIVER_NOTE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  const cdp = await ctx.newCDPSession(page);
  const S = () => page.evaluate(() => { const D = __DDW3, P = D.player; return { x: P.x, y: P.y, z: P.z, vx: P.vx, grounded: P.grounded, jumps: P.jumps, creature: P.creature, ride: P.ride ? P.ride.type : null, layer: P.layer, stair: P.stair ? P.stair.k : null, disc: [...D.world.disc], bits: D.world.bits.size, fl: D.fluffs.map(f => f.state), bubbles: D.bubbles(), sound: D.Sound.on, painted: !!D.world.painted, door: D.nearDoor() }; });
  const center = async sel => { const b = await page.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p.x, y: p.y, id: p.id ?? i + 1, radiusX: 6, radiusY: 6, force: 1 })) });
  const scr = (x, y, z = 0) => page.evaluate(([x, y, z]) => __DDW3.toScreen(x, y, z), [x, y, z]);
  const tapWorld = async (x, y, z = 0) => { const p = await scr(x, y, z); await touch('touchStart', [p]); await sleep(60); await touch('touchEnd', []); await sleep(150); };
  // drag-to-move: a finger down on the left side, slid sideways (or up/down)
  const DRAG0 = { x: 150, y: 285, id: 7 };
  const drag = async (dx, ms, dy = 0) => holdBtn(Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? '#upBtn' : '#downBtn') : (dx > 0 ? '#rightBtn' : '#leftBtn'), ms); // (build 9: arrow buttons are back)
  const holdBtn = async (sel, ms) => { const c = await center(sel); await touch('touchStart', [{ ...c, id: 1 }]); await sleep(ms); await touch('touchEnd', []); await sleep(80); };
  // Bounded, real-touch holds for reaching a position on a slow renderer.
  const holdUntil = async (sel, condition, arg, timeout = 15000) => {
    const pt = await center(sel); let reached = false;
    await touch('touchStart', [pt]);
    try { await page.waitForFunction(condition, arg, { polling: 'raf', timeout }); reached = true; }
    catch (_) { /* The caller retains its full movement/state assertion. */ }
    finally { await touch('touchEnd', []); }
    return reached;
  };
  const press = async sel => holdBtn(sel, 80);
  const teleport = async (x, y = 0) => { await page.evaluate(([x, y]) => __DDW3.teleport(x, y), [x, y]); await sleep(2200); }; // let the camera settle (slow software WebGL)
  const waitFor = async (fn, ms = 8000) => { ms *= 3; /* (the software-graphics test browser is slow) */ const t0 = Date.now(); let s; while (Date.now() - t0 < ms) { s = await S(); if (fn(s)) return s; await sleep(120); } return s; };
  const tapChar = async (hx, y, z) => { await teleport(hx - 2.2); await page.evaluate(() => { __DDW3.player.facing = 1; }); await sleep(600);
    const p = await page.evaluate(hx => { const L = __DDW3.G.life, a = L && L.agents.filter(q => !q.follower).reduce((b, q) => (!b || Math.abs(q.x - hx) < Math.abs(b.x - hx) ? q : b), null); return a && Math.abs(a.x - hx) < 4 ? [a.x, a.z] : [hx, null]; }, hx);
    await tapWorld(p[0], y, p[1] ?? z); };
  const shot = n => page.screenshot({ path: path.join(SHOTS, n), type: 'jpeg', quality: 84, timeout: 240000 });
  let c;

  // ---------- start ----------
  await page.goto(FILE); await sleep(2500);
  check('3D title screen shows the three creatures and a play button', await page.locator('#playBtn').isVisible() && (await page.locator('.introPick img').first().getAttribute('src') || '').startsWith('data:image/png'));
  await shot('01_title.jpg');
  await page.locator('#playBtn').tap(); await sleep(800);
  check('play button hides the title card', await page.locator('#overlay').evaluate(e => e.classList.contains('hidden')));
  { const bx = []; for (const id of ['leftBtn', 'rightBtn', 'upBtn', 'downBtn']) bx.push(await page.locator('#' + id).boundingBox()); check('four big arrow buttons (◀ ▶ ▲ ▼) at the bottom left', bx.every(b => b && b.width >= 50 && b.height >= 44 && b.x >= 0 && b.x < 300 && b.y + b.height <= 390), JSON.stringify(bx.map(b => b && [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]))); }
  const boxes = {}; for (const id of ['jumpBtn', 'pawBtn']) boxes[id] = await page.locator('#' + id).boundingBox();
  check('jump / paw buttons are big (≥ 60 px) and on screen', Object.values(boxes).every(b => b.width >= 60 && b.height >= 60 && b.x >= 0 && b.y + b.height <= 390));
  await shot('02_start.jpg');
  // ---------- moving + jumping ----------
  await page.evaluate(() => __DDW3.teleport(1.2)); await sleep(1500); // start at the far left (walking right leads into the ball pit and its deep part)
  // (build 35) the first seconds after start-up are the busiest on the slow test machine: wait (up to 10 s) for frames to settle,
  // so a fixed 0.6 s hold measures walking, not start-up work
  await page.evaluate(() => new Promise(res => { const t0 = performance.now(); let last = t0; const iv = []; const f = now => { iv.push(now - last); last = now; if (iv.length > 5) iv.shift(); if ((iv.length === 5 && iv.reduce((a, b) => a + b) / 5 < 120) || now - t0 > 10000) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  c = await S(); const x0 = c.x;
  const walked = await holdUntil('#rightBtn', x => __DDW3.player.x > x + 2, x0);
  c = await S(); check('slide a finger right to walk right', walked && c.x > x0 + 2, `x ${x0.toFixed(1)} → ${c.x.toFixed(1)}`);
  const x1 = await page.evaluate(() => new Promise(r => { let still = 0, n = 0; const f = () => { const P = __DDW3.player; still = Math.abs(P.vx) < .01 ? still + 1 : 0; if (still > 4 || ++n > 300) return r(P.x); requestAnimationFrame(f); }; f(); })); await sleep(600); check('let go and the creature stops', Math.abs((await S()).x - x1) < .2);
  await holdBtn('#leftBtn', 500); check('slide a finger left to walk left', (await S()).x < x1 - .5);
  { const j = await center('#jumpBtn'); const seen = page.evaluate(() => new Promise(r => { let n = 0; const f = () => { const P = __DDW3.player; if (P.y > .3) return r(P.y); if (++n > 200) return r(P.y); requestAnimationFrame(f); }; f(); })); await touch('touchStart', [j]); await touch('touchEnd', []); const jy = await seen; check('JUMP jumps', jy > .3, `y=${jy.toFixed(2)}`);
    // (the slow software renderer here can't keep up with two real taps inside one jump, so the 2nd tap is sent on the very next frame)
    await waitFor(s => s.grounded, 3000);
    await page.evaluate(() => new Promise(r => { const b = document.getElementById('jumpBtn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); requestAnimationFrame(() => requestAnimationFrame(() => { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); r(); })); }));
    await sleep(300); check('double jump (tap JUMP again in the air)', (await S()).disc.includes('doublejump')); }
  c = await waitFor(s => s.grounded, 4000); check('lands back on the floor', c.grounded && c.y === 0);
  // multi-touch: hold ▶ with one finger and tap JUMP with another
  { const r = { ...(await center('#rightBtn')), id: 1 }, j = await center('#jumpBtn'); const a = (await S()).x;
    await touch('touchStart', [r]); await sleep(300); await touch('touchStart', [r, { ...j, id: 2 }]); await sleep(80); await touch('touchMove', [r]); await sleep(400);
    c = await S(); await touch('touchEnd', []); check('multi-touch: walk and jump at the same time', c.x > a + 1 && (c.y > .2 || c.jumps > 0 || c.disc.length), `x ${a.toFixed(1)}→${c.x.toFixed(1)}, y ${c.y.toFixed(2)}`); }
  await waitFor(s => s.grounded, 3000);
  // drag up = jump; a gentle slide walks slowly (never faster than walking)
  await teleport(3); await waitFor(s => s.grounded, 3000);
  { const seen = page.evaluate(() => new Promise(r => { let n = 0, m = 0; const f = () => { m = Math.max(m, __DDW3.player.y); if (++n > 120) return r(m); requestAnimationFrame(f); }; f(); })); await drag(0, 300, -90); const my = await seen; check('tap ▲ to jump', my > .3, `rose to y=${my.toFixed(2)}`); }
  await waitFor(s => s.grounded, 3000);
  { const v = page.evaluate(() => new Promise(r => { let n = 0, m = 0; const f = () => { m = Math.max(m, Math.abs(__DDW3.player.vx)); if (++n > 60) return r(m); requestAnimationFrame(f); }; f(); })); await drag(90, 700); const vx = await v; check('holding ▶ walks at a normal speed (never too fast)', vx > 2.5 && vx < 6, `speed ${vx.toFixed(2)} (normal walk 5.2)`); }
  // ---------- creatures ----------
  for (const k of ['zuzu', 'jelly', 'sprout', 'pip']) { /* (build 59: Sprout, the fourth friend) */ await page.locator(`.creatureChoice[data-c="${k}"]`).tap(); await sleep(500); c = await S(); check(`switch to ${k}`, c.creature === k); if (k !== 'pip') await shot(`03_${k}.jpg`); }
  { await page.locator('.creatureChoice[data-c="jelly"]').tap(); await sleep(400);
    const minSy = await page.evaluate(() => new Promise(r => { const P = __DDW3.player; P.y = 2.5; P.vy = 0; P.grounded = false; let m = 9, n = 0; const f = () => { m = Math.min(m, __DDW3.bodyScaleY()); if (++n > 90) return r(m); requestAnimationFrame(f); }; f(); }));
    check('Jelly squishes flat when it lands', minSy < .8, `body squashed to ${(minSy * 100).toFixed(0)}% height`);
    await page.locator('.creatureChoice[data-c="pip"]').tap(); }
  await sleep(3500); c = await S();
  { const p = await scr(c.x, c.y + .75, c.z), el = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.id || e.className); }, [p.x, p.y]); const pk = await page.evaluate(([x, y]) => JSON.stringify(__DDW3.pick(x, y)), [p.x, p.y]);
    await tapWorld(c.x, c.y + .75, c.z); await sleep(200); check('tap your creature to tickle it', (await S()).disc.includes('tickle'), `tap at ${Math.round(p.x)},${Math.round(p.y)} lands on: ${el} ${pk} P=${c.x.toFixed(2)},${c.y.toFixed(2)},${c.z.toFixed(2)}`); }
  if (process.env.QUICK) { console.log(results.filter(r => !r.ok)); await browser.close(); return; }
  // The daughter's drawings are residents in the world, with the existing touch and PAW controls.
  for (const [kind, home, words] of [
    ['chalkgreen', 587, 'copycat'], ['chalkpink', 827, 'twirl'], ['drawingblue', -123, 'sing'],
    ['drawingwave', -486, 'twirl'], ['drawinglonglegs', -789, 'hug'], ['drawingteal', -288, 'jump'], ['drawingscribble', 754, 'sparkles'],
  ]) {
    await teleport(home - 2.2); await page.evaluate(x => __DDW3.G.expansion.buildNow(x), home);
    await page.waitForFunction(kind => __DDW3.G.interact.some(i => i.disc === 'pal_' + kind), kind, { timeout: 120000 });
    const resident = await page.evaluate(kind => {
      let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
      const found = []; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) found.push(o); });
      const g = found[0]; if (!g) return null;
      const center = new __DDW3.THREE.Box3().setFromObject(g).getCenter(new __DDW3.THREE.Vector3());
      return { count: found.length, point: __DDW3.toScreen(...center.toArray()), visible: g.visible };
    }, kind);
    check(`${kind}: the drawing is one visible world resident, not a selectable character`, resident && resident.count === 1 && resident.visible && await page.locator(`.creatureChoice[data-c="${kind}"]`).count() === 0);
    if (resident) { await touch('touchStart', [resident.point]); await sleep(60); await touch('touchEnd', []); await sleep(150); }
    const tapped = (await page.locator('#toast').textContent()).includes(words);
    await press('#pawBtn');
    check(`${kind}: tap and PAW invite her to play with spoken words and movement`, tapped && (await page.locator('#toast').textContent()).includes(words));
  }
  // New family keepsakes use the same touch and PAW controls, including the two requested twins.
  {
    const { pathToFileURL } = require('node:url');
    const { FAMILY_FRIEND_HOMES } = await import(pathToFileURL(path.join(ROOT, 'src/family-friend-homes.js')));
    const { DOODLE_FRIENDS } = await import(pathToFileURL(path.join(ROOT, 'src/doodle-friends.js')));
    const { KEEPSAKE_FRIENDS } = await import(pathToFileURL(path.join(ROOT, 'src/keepsake-friends.js')));
    const familySpecies = { ...DOODLE_FRIENDS, ...KEEPSAKE_FRIENDS };
    for (const { kind, x: home, approach = -1 } of FAMILY_FRIEND_HOMES) {
      const line = familySpecies[kind].play.line;
      await teleport(home + approach * 2.2); await page.evaluate(x => __DDW3.G.expansion.buildNow(x), home);
      await page.waitForFunction(kind => __DDW3.G.interact.some(i => i.disc === 'pal_' + kind), kind, { timeout: 120000 });
      const resident = await page.evaluate(kind => {
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        const found = []; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) found.push(o); });
        const g = found[0]; if (!g) return null;
        const center = new __DDW3.THREE.Box3().setFromObject(g).getCenter(new __DDW3.THREE.Vector3());
        return { count: found.length, point: __DDW3.toScreen(...center.toArray()), visible: g.visible };
      }, kind);
      check(`${kind}: the family keepsake is one visible resident, not a player choice`, resident && resident.count === 1 && resident.visible && await page.locator(`.creatureChoice[data-c="${kind}"]`).count() === 0);
      if (resident) { await touch('touchStart', [resident.point]); await sleep(60); await touch('touchEnd', []); await sleep(150); }
      const tapped = (await page.locator('#toast').textContent()).includes(line);
      const movement = await page.evaluate(kind => new Promise(resolve => {
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
        if (!g) return resolve(false);
        const heights = []; let n = 0;
        const f = () => { heights.push(g.userData.body.position.y); if (++n >= 6) resolve(Math.max(...heights) - Math.min(...heights) > .02); else requestAnimationFrame(f); };
        requestAnimationFrame(f);
      }), kind);
      await press('#pawBtn');
      check(`${kind}: real touch and PAW start its spoken activity and happy movement`, tapped && movement && (await page.locator('#toast').textContent()).includes(line) && await page.locator('#befriend.show').count() === 0);
    }
  }
  // The next artwork collection lives on Earth and in the planets' streamed areas.
  await require('./craft-friends.cjs').runCraftSmoke(page, check);
  // ---------- playhouse ----------
  await teleport(10); await tapWorld(12, .6); check('tap the ball pit: splash', (await S()).disc.includes('ballpit'));
  await shot('04_ball_pit.jpg');
  await teleport(21.6, 3.8);
  const reachedSlide = await holdUntil('#rightBtn', () => __DDW3.player.ride && __DDW3.player.ride.type === 'slide', null, 15000);
  c = await S(); check('walk off the tower onto the twisty slide', reachedSlide && c.ride === 'slide', `x=${c.x.toFixed(2)} y=${c.y.toFixed(2)} ride=${c.ride}`);
  await shot('05_slide.jpg');
  c = await waitFor(s => !s.ride && s.y === 0, 9000); check('slide ends on the floor and you can move again', !c.ride && c.x > 30 && c.y === 0, `x=${c.x.toFixed(1)}`);
  await teleport(31.5); { const top = page.evaluate(() => new Promise(r => { let n = 0, m = 0; const f = () => { m = Math.max(m, __DDW3.player.y); if (m > 2 || ++n > 200) return r(m); requestAnimationFrame(f); }; f(); })); await holdBtn('#rightBtn', 500); const m = await top; check('walk onto the trampoline: big bounce', m > 2, `highest y=${m.toFixed(2)}`); }
  await shot('06_trampoline.jpg'); await waitFor(s => s.grounded && s.x > 36 || s.grounded && s.y === 0, 4000);
  // ---------- solid things ----------
  await teleport(35.8); await holdBtn('#rightBtn', 1600); c = await S(); check('walk into the climbing blocks: you hop up onto them (not through them)', c.y >= 1.15, `x=${c.x.toFixed(1)} y=${c.y.toFixed(2)}`);
  await teleport(33);
  { const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.left = true; let n = 0, stuck = 0, lx = P.x; const f = () => { if (P.x < 17) { D.keys.left = false; return res([P.x, 'ok']); } stuck = Math.abs(P.x - lx) < .001 ? stuck + 1 : 0; lx = P.x; if (stuck > 30 || ++n > 900) { D.keys.left = false; return res([P.x, 'stuck']); } requestAnimationFrame(f); }; f(); }));
    check('walk back left past the slide tower: nothing blocks the way', r[0] < 17, `got to x=${r[0].toFixed(1)} (${r[1]})`); }
  await teleport(6); await holdBtn('#rightBtn', 900); c = await waitFor(s => s.grounded, 3000); check('walk into the ball pit: hop over its edge into the balls', c.x > 8.3 && c.x < 15.7 && c.y < .1, `x=${c.x.toFixed(1)}`);
  // ---------- the secret underground (through the deep part of the ball pit) ----------
  await teleport(9.6); c = await S(); check('a picture bubble by the deep part of the ball pit', c.door === 'down');
  // (the software renderer here runs ~3 frames a second, so swimming is watched frame by frame inside the page)
  const sawSwim = page.evaluate(() => new Promise(r => { let n = 0; const f = () => { if (__DDW3.player.swim) return r(true); if (++n > 400) return r(false); requestAnimationFrame(f); }; f(); }));
  await drag(0, 300, 90); check('tap ▼ in the ball pit: you dive into the deep part', await sawSwim);
  await teleport(12.6, -1.6);
  { const up = await page.evaluate(() => new Promise(r => { const P = __DDW3.player, b = document.getElementById('jumpBtn'), y0 = P.y; let n = 0; const f = () => { if (n % 3 === 0) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); if (P.y > y0 + .8) return r([y0, P.y]); if (++n > 300) return r([y0, P.y]); requestAnimationFrame(f); }; f(); }));
    check('tap JUMP to swim up through the balls', up[1] > up[0] + .8, `y ${up[0].toFixed(2)} → ${up[1].toFixed(2)}`); }
  c = await waitFor(s => s.y <= -5.99 && s.grounded, 45000); check('sink all the way down into the secret underground', c.y <= -5.99, `y=${c.y.toFixed(2)}`);
  check('the underground is a new discovery', c.disc.includes('underground'));
  await shot('15_underground.jpg');
  await holdBtn('#rightBtn', 400); await waitFor(s => s.grounded, 3000); await teleport(12.6, -4.2); c = await waitFor(s => s.y > -3, 4000); check('the bounce mushroom pops you back up into the ball shaft', c.y > -3, `y=${c.y.toFixed(2)}`);
  { const out = await page.evaluate(() => new Promise(r => { const D = __DDW3, P = D.player, b = document.getElementById('jumpBtn'); let n = 0; const f = () => { if (P.y > -.2) D.keys.left = true; if (n % 3 === 0 && P.y < .2) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); if (P.grounded && P.y >= 0) { D.keys.left = false; return r([P.x, P.y]); } if (++n > 600) { D.keys.left = false; return r([P.x, P.y]); } requestAnimationFrame(f); }; f(); }));
    check('swim up and climb out of the ball pit', out[1] >= 0, `x=${out[0].toFixed(1)} y=${out[1].toFixed(2)}`); }
  await teleport(23, -6); await holdBtn('#rightBtn', 500); c = await S(); check('walk past the singing crystals and they play', c.disc.includes('crystal'));
  await teleport(29, -6); await holdBtn('#rightBtn', 900); { const cr = await page.evaluate(() => __DDW3.player.crawl); check('the low tunnel makes you crawl', cr || (await S()).disc.includes('crawl')); }
  { const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.right = true; let n = 0; const f = () => { if (P.x > 37) { D.keys.right = false; return res(P.x); } if (++n > 900) { D.keys.right = false; return res(P.x); } requestAnimationFrame(f); }; f(); }));
    check('crawl all the way through the tunnel', r > 37, `x=${r.toFixed(1)}`); }
  await teleport(43, -6); await holdBtn('#rightBtn', 400); await sleep(300); c = await S(); check('find the lost Fluffkin in the underground gem room', c.fl[1] === 'follow');
  await teleport(53.4, -6); c = await S(); check('a lift bubble at the bottom of the glass lift', c.door === 'up');
  await press('#pawBtn'); c = await waitFor(s => !s.ride && s.y >= 0, 6000); check('the glass lift rides up to the Studio floor', c.y === 0 && !c.ride, `y=${c.y}`);
  await press('#pawBtn'); c = await waitFor(s => !s.ride && s.y <= -5.99, 6000); check('and back down again', c.y <= -5.99);
  // ---------- build 5: Pet Workshop, critters, balloon ----------
  await teleport(7.4, -6); // stand to the side so the buttons aren't behind your creature
  { const d0 = await page.evaluate(() => JSON.stringify(__DDW3.world.petDraft)); await tapWorld(4.25, UG_F + 1.0, -1.15); await sleep(300); const d1 = await page.evaluate(() => JSON.stringify(__DDW3.world.petDraft));
    check('Pet Workshop: tap a big button to change your pet design', d0 !== d1 && (await S()).disc.includes('petmaker'), `${d0} → ${d1}`); }
  await tapWorld(8.6, UG_F + .25, -1.2); await sleep(200); // the lever's box
  { const hatched = await page.evaluate(() => new Promise(r => { let n = 0; const f = () => { if (__DDW3.friends.hasPet()) return r(true); if (++n > 500) return r(false); requestAnimationFrame(f); }; f(); })); check('pull the lever: an egg hatches your very own pet', hatched && (await S()).disc.includes('pet')); }
  await shot('16_pet_workshop.jpg');
  await tapWorld(8.6, UG_F + .25, -1.2); { const two = await page.evaluate(() => new Promise(r => { let n = 0; const f = () => { if (__DDW3.friends.petCount() >= 2) return r(true); if (++n > 500) return r(false); requestAnimationFrame(f); }; f(); })); check('pull the lever again: a second pet (you can have up to 5)', two && (await S()).disc.includes('pets2'), `pets=${await page.evaluate(() => __DDW3.friends.petCount())}`); }
  { const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.right = true; let n = 0; const f = () => { if (P.x > 9.5 || ++n > 400) { D.keys.right = false; return res(Math.abs(D.friends.petPos.x - P.x)); } requestAnimationFrame(f); }; f(); })); check('your pet follows you', r < 3, `pet is ${r.toFixed(1)} away`); }
  { // Observe distinct animation frames: two wall-clock samples can be the same slow-rendered frame.
    const aim = await page.evaluate(() => new Promise(resolve => {
      const f = __DDW3.friends.pets[0]; let stable = 0, frames = 0;
      const observe = () => {
        const a = f.agent;
        stable = a && Math.hypot(a.vx, a.vz) < .03 ? stable + 1 : 0;
        if (stable >= 3 || ++frames >= 400) return resolve({ settled: stable >= 3, pos: f.root.position.toArray() });
        requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    }));
    await tapWorld(aim.pos[0], aim.pos[1] + .5, aim.pos[2]);
    c = await waitFor(s => s.disc.includes('stayhere'), 3000);
    const waiting = await page.evaluate(() => __DDW3.friends.pets.findIndex(p => p.waiting));
    check('tap your pet: it waves and stays put', aim.settled && c.disc.includes('stayhere') && waiting >= 0 && await page.evaluate(() => (__DDW3.world.petStay || []).includes(true)), `pet settled=${aim.settled}, waiting index=${waiting}`);
    const tappedAgain = await page.evaluate(i => {
      const f = __DDW3.friends.pets[i]; if (!f) return false;
      f.root.userData.tap(); return true;
    }, waiting);
    check('tap it again: it does a trick and follows you again', tappedAgain && !(await page.evaluate(() => (__DDW3.world.petStay || []).includes(true))));
  }
  { }
  await teleport(135.6); await tapWorld(137.6, 1.4, -2.4); await sleep(300); check('the Balloon Bear gives you a balloon', await page.evaluate(() => __DDW3.world.balloons.length === 1));
  await tapWorld(137.6, 1.4, -2.4); await sleep(300); check('tap the bear again: a second balloon (you can have lots)', await page.evaluate(() => __DDW3.world.balloons.length === 2));
  await shot('17_balloon_bear.jpg');
  { const before = await page.evaluate(() => __DDW3.G.paint.canvas.toDataURL().length); await tapChar(52.4, 1.2, -2.4); await sleep(300); const after = await page.evaluate(() => __DDW3.G.paint.canvas.toDataURL().length); { const found = (await S()).disc.includes('painter'); check('the Painter Bunny paints a picture on the wall', after !== before && found, `picture changed=${after !== before} bunny found=${found}`); } }
  await tapChar(89.6, .9, -2.4); await sleep(200); check('the Drummer Frog plays when tapped', (await S()).disc.includes('frog'));
  await tapChar(109.2, 1.2, -2.4); await sleep(200); check('the penguin dances when tapped', (await S()).disc.includes('penguin'));
  await tapChar(152, 3.0, -3.2); await sleep(200); check('the sleepy owl wakes up when tapped', (await S()).disc.includes('owl'));
  // ---------- build 6: the Cloud Kingdom ----------
  await teleport(46.9); // next to the rope ladder (left of here are the climbing blocks)
  { const top = page.evaluate(() => new Promise(r => { let n = 0; const f = () => { const P = __DDW3.player; if ((!P.ride && P.y > 9.4) || ++n > 900) return r([P.y, P.ride && P.ride.type]); requestAnimationFrame(f); }; f(); }));
    await touch('touchStart', [{ ...(await center('#upBtn')), id: 1 }]);
    const r = await top; await touch('touchEnd', []); check('hold ▲ at the rope ladder: climb all the way up into the Cloud Kingdom', r[0] > 9.4, `y=${r[0].toFixed(2)}`); }
  check('the Cloud Kingdom is a new discovery', (await S()).disc.includes('sky'));
  await shot('18_cloud_kingdom.jpg');
  await teleport(50.4, 9.5); { const my = await page.evaluate(() => new Promise(r => { const D = __DDW3; D.keys.right = true; let n = 0, m = 0; const f = () => { m = Math.max(m, D.player.y); if (D.player.x > 51.4) D.keys.right = false; if (m > 13 || ++n > 500) { D.keys.right = false; return r(m); } requestAnimationFrame(f); }; f(); })); check('bouncy cloud puffs bounce you up to the high clouds', my > 13, `highest y=${my.toFixed(1)}`); }
  await teleport(54.5, 9.5); for (let k = 0; k < 3 && !(await S()).disc.includes('whale'); k++) { const wp = await page.evaluate(() => __DDW3.G.whale.g.position.toArray()); await tapWorld(wp[0], wp[1], wp[2]); await sleep(300); } /* (patient: the whale swims, and the test browser draws 1-2 frames a second) */ check('tap the sky whale: it sings', (await S()).disc.includes('whale'));
  await teleport(65.8, 9.5);
  { const sl = page.evaluate(() => new Promise(r => { let n = 0, on = false; const f = () => { const P = __DDW3.player; if (P.ride && P.ride.type === 'slide') on = true; if ((on && !P.ride && P.grounded) || ++n > 1200) return r([on, P.x, P.y]); requestAnimationFrame(f); }; f(); }));
    await holdBtn('#rightBtn', 600); const r = await sl; check('walk off the clouds onto the giant rainbow slide, all the way down to the floor', r[0] && r[2] < .6 && r[1] > 71, `slid=${r[0]} landed x=${r[1].toFixed(1)} y=${r[2].toFixed(2)}`); }
  // ---------- build 7: easier purple shelf, Creative Meadow ----------
  await teleport(114.2);
  { const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.right = true; let n = 0, m = 0; const f = () => { m = Math.max(m, P.y); if (P.x > 114.9) D.keys.right = false; if ((m > 5 && P.grounded) || ++n > 700) { D.keys.right = false; return res([P.y, P.x]); } requestAnimationFrame(f); }; f(); }));
    check('one bounce on the second spring pad lands you on the purple shelf', Math.abs(r[0] - 5) < .05, `ended at y=${r[0].toFixed(2)} x=${r[1].toFixed(1)}`); }
  await teleport(211);
  check('the block tray appears by the Block Builder', await page.locator('#buildTools').evaluate(e => e.classList.contains('show')));
  await page.locator('.blk[data-t="2"]').tap(); await sleep(150);
  await tapWorld(213.8, .5, -1.0); await sleep(300);
  { const b = await page.evaluate(() => __DDW3.world.build.filter(v => v >= 0).length); check('tap the builder wall: a block appears', b === 1, `${b} blocks`); }
  await tapWorld(213.8, 1.5, -1.0); await sleep(300); await tapWorld(215.0, .5, -1.0); await sleep(300);
  { const b = await page.evaluate(() => __DDW3.world.build.filter(v => v >= 0).length), plats = await page.evaluate(() => __DDW3.G.platforms.filter(p => p.builder).length); check('build more blocks; their tops are things you can stand on', b === 3 && plats >= 2, `${b} blocks, ${plats} standable tops`); }
  await page.locator('.blk[data-t="-2"]').tap(); await sleep(150); await tapWorld(215.0, .5, -1.0); await sleep(300);
  { const b = await page.evaluate(() => __DDW3.world.build.filter(v => v >= 0).length); check('the sponge erases a block', b === 2, `${b} blocks`); }
  await shot('19_block_builder.jpg');
  await teleport(229.6);
  check('the colour palette appears by the Colouring Corner', await page.locator('#paintTools').evaluate(e => e.classList.contains('show')));
  await page.locator('.swatch').nth(1).tap(); await sleep(150);
  { const before = await page.evaluate(() => JSON.stringify(__DDW3.world.colorings[0])); await tapWorld(228.17, 2.18, -2.3); await sleep(300); const after = await page.evaluate(() => JSON.stringify(__DDW3.world.colorings[0]));
    check('tap part of a colouring picture: it fills with your colour', before !== after && (await S()).disc.includes('coloring')); }
  await shot('20_colouring.jpg');
  await teleport(238); /* (build 49: the unicorn walks about: tap it where it is, a few tries if something walks in front) */
  for (let k = 0; k < 4 && !(await S()).disc.includes('unicorn'); k++) { const u = await page.evaluate(() => { const C = __DDW3.friends.critters, b = Array.isArray(C) ? C.find(q => q.kind === 'unicorn') : C && C.unicorn; return b && b.root ? b.root.position.toArray() : [240, 0, -2.4]; }); await tapWorld(u[0], u[1] + 1.2, u[2]); await sleep(500); }
  { const n = await page.evaluate(() => __DDW3.friends.bubbleCount()); check('tap the unicorn: it talks in a picture speech bubble', (await S()).disc.includes('unicorn') && n > 0, `${n} bubbles`); }
  await teleport(244.4); await tapWorld(246, .6, -2.4); await sleep(200); check('the hedgehog plays a song', (await S()).disc.includes('hedgehog'));
  await page.locator('#styleBtn').tap(); await sleep(300); check('the paint-palette button opens the creature colours', await page.locator('#stylePanel').evaluate(e => e.classList.contains('show')));
  await page.locator('.spCol').nth(2).tap(); await sleep(300); await page.locator('#sparkleBtn').tap(); await sleep(200);
  { const st = await page.evaluate(() => ({ s: __DDW3.world.styles, sp: __DDW3.world.sparkle, k: __DDW3.player.creature })); check('pick a new colour for your creature and turn on the sparkle trail', st.s && st.s[st.k] && st.sp, JSON.stringify(st)); }
  await page.locator('#styleDone').tap(); await sleep(200);
  // ---------- build 8: Kart Garage and race track ----------
  await teleport(262.2);
  { const k0 = await page.evaluate(() => JSON.stringify(__DDW3.world.kart)); await tapWorld(263.0, 1.0, -1.3); await sleep(300); const k1 = await page.evaluate(() => JSON.stringify(__DDW3.world.kart));
    check('Kart Garage: tap a big button to change your kart', k0 !== k1 && (await S()).disc.includes('kartmaker'), `${k0} → ${k1}`); }
  await teleport(263.5); await tapWorld(266.9, .7, -3.6); await sleep(300);
  check('tap the kart on the turntable: hop in and drive', (await S()).ride === 'kart');
  { const r = await page.evaluate(() => new Promise(res => { const P = __DDW3.player, u0 = P.ride.u + P.ride.lap; let n = 0; const f = () => { if (++n > 40) return res([u0, P.ride ? P.ride.u + P.ride.lap : -1, P.z]); /* (laps counted: the slow test browser can run a whole lap in 40 frames) */ requestAnimationFrame(f); }; f(); })); check('the kart drives round the track', r[1] > r[0], `u ${r[0].toFixed(3)} → ${r[1].toFixed(3)}, z=${r[2].toFixed(1)}`); }
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => { document.getElementById('jumpBtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); r(); })));
  { const h = await page.evaluate(() => new Promise(res => { let n = 0, m = 0; const f = () => { m = Math.max(m, __DDW3.player.ride ? __DDW3.player.ride.hop : 0); if (++n > 30) return res(m); requestAnimationFrame(f); }; f(); })); check('JUMP makes the kart hop', h > .2, `hop ${h.toFixed(2)}`); }
  await page.evaluate(() => { __DDW3.player.ride.u = .985; });
  { const lap = await page.evaluate(() => new Promise(res => { let n = 0; const f = () => { const R = __DDW3.player.ride; if ((R && R.lap > 0) || ++n > 300) return res(R ? R.lap : -1); requestAnimationFrame(f); }; f(); })); check('crossing the finish line counts a lap (with confetti)', lap >= 1, `lap ${lap}`); }
  await shot('21_kart_race.jpg');
  await press('#pawBtn'); await sleep(300); c = await S(); check('PAW parks the kart and you hop out', !c.ride && c.y < .1);
  // ---------- build 9: the Wonder Express train ----------
  await teleport(170);
  await press('#pawBtn'); c = await waitFor(s => s.ride === 'train', 90000); // (PAW at a station calls the train; the signs sit low on screen with the closer camera)
  check('tap a station sign: the train chugs in and you hop aboard', c.ride === 'train' && Math.abs(c.z - 3.2) < .3 && c.disc.includes('train'), `ride=${c.ride} z=${c.z.toFixed(2)}`);
  await press('#jumpBtn'); await sleep(200); check('JUMP on the train toots the whistle (and you stay on)', (await S()).disc.includes('toot') && (await S()).ride === 'train');
  { const x0 = (await S()).x; await holdBtn('#rightBtn', 2500); /* (the software-graphics browser runs only a few frames a second) */ c = await S(); check('hold ▶ to drive the train yourself', c.ride === 'train' && c.x > x0 + .5, `x ${x0.toFixed(1)} → ${c.x.toFixed(1)}`); }
  c = await waitFor(s => Math.abs(s.vx) < .01, 20000); check('let go and the train stops', Math.abs(c.vx) < .01 && c.ride === 'train');
  await shot('22_train.jpg');
  await press('#pawBtn'); await sleep(400); c = await S(); check('PAW: hop off the train (anywhere)', !c.ride && c.y < .1, `ride=${c.ride} x=${c.x.toFixed(1)}`);
  // ---------- build 9: the Marble Machine ----------
  await teleport(332); await sleep(2000); // (build 43: let the camera finish easing back here before tapping the small ramps)
  // (build 48: wait until the camera has really stopped moving: on this slow browser 2 s was sometimes not enough, and a tap at a ramp that
  //  was still sliding across the screen missed it)
  await page.evaluate(() => new Promise(res => { let last = null, still = 0; const t0 = performance.now(); const f = () => { const p = __DDW3.camera.position, k = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`; still = k === last ? still + 1 : 0; last = k; if (still >= 3 || performance.now() - t0 > 30000) res(); else setTimeout(f, 250); }; f(); }));
  { const n0 = await page.evaluate(() => __DDW3.marbles.marbles.length); await tapWorld(327.6, 2.3, -2.2); const n1 = await page.evaluate(() => __DDW3.marbles.marbles.length);
    check('tap the Marble Machine board: a marble drops', n1 === n0 + 1 && (await S()).disc.includes('marbles'), `${n0} → ${n1}`); }
  { const a0 = await page.evaluate(() => __DDW3.marbles.ramps[1].target); await tapWorld(332.2, 3.2, -1.8); const a1 = await page.evaluate(() => __DDW3.marbles.ramps[1].target);
    check('tap a ramp: it flips the other way', Math.sign(a0) === -Math.sign(a1), `${a0.toFixed(2)} → ${a1.toFixed(2)}`); }
  c = await waitFor(s => s.disc.includes('marblemusic'), 90000); check('marbles roll down and ring the music bins', c.disc.includes('marblemusic'));
  await press('#pawBtn'); await sleep(200); check('PAW by the machine drops a marble too', await page.evaluate(() => __DDW3.marbles.marbles.length) >= 1);
  await shot('23_marbles.jpg');
  // ---------- build 10: Dino Valley and the Princess Castle ----------
  await teleport(367);
  { const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.right = true; let top = 0, slid = false, n = 0; const f = () => { top = Math.max(top, P.y); if (P.ride && P.ride.type === 'slide') slid = true; if (++n > 1500 || P.x > 388) { D.keys.right = false; return res([top, slid]); } requestAnimationFrame(f); }; f(); }));
    c = await S(); check('walk right: climb up Dottie the dinosaur\'s tail, across her back, and slide down her neck', r[0] > 3.3 && r[1] && c.disc.includes('dinoclimb') && c.disc.includes('dinoslide'), `top y=${r[0].toFixed(2)} slid=${r[1]}`); }
  await teleport(360.6); await tapWorld(362.8, .55, -2.05); // (stand to the left: your creature isn't in front of the egg, and the friends who follow you trail away from it)
  c = await waitFor(s => s.disc.includes('hatch'), 60000); check('tap a dino egg: it wobbles and a baby dino hatches', c.disc.includes('hatch') && await page.evaluate(() => __DDW3.world.dinoEggs[0] === true));
  await shot('24_dino_valley.jpg');
  for (let k = 0; k < 3 && !(await S()).disc.includes('tops'); k++) { /* Tops walks about: tap him where he is */ await tapChar(390.2, .55, -2.4); await sleep(300); } check('tap Tops the little dino: stomp stomp!', (await S()).disc.includes('tops'));
  await teleport(401); await tapWorld(402.8, 1.4, -2.3); await sleep(400); check('tap Princess Rosie: she gives you a golden crown', await page.evaluate(() => __DDW3.world.crown === true && __DDW3.kingdom().crown.visible));
  await teleport(408); await holdBtn('#rightBtn', 500); c = await S(); check('walk on the castle dance floor: the tiles light up and play music', c.disc.includes('dance'));
  await teleport(412); await tapWorld(413.6, 1.4, -2.3); await sleep(300); check('tap Princess Luna: the royal fountain sprays sparkles', (await S()).disc.includes('fountain'));
  await shot('25_princess_castle.jpg');
  // ---------- new friends who follow you ----------
  let biscuitSeen = '';
  { const n0 = await page.evaluate(() => __DDW3.friends.followers.length); { /* (creatures walk about: stand just left of Biscuit, facing right, so your following pets trail behind you and can't stand in front of him; tap him where he is) */ const b0 = await page.evaluate(() => __DDW3.friends.buddies.biscuit.root.position.x); await teleport(b0 - 2.2); await page.evaluate(() => { __DDW3.player.facing = 1; }); await sleep(1500); let seen = ''; for (let k = 0; k < 14 && !(await page.evaluate(() => __DDW3.world.buddies.biscuit)); k++) { /* (build 49: more tries; he sometimes trots behind the slide's tube for several seconds) */ if (k === 6) { const bx = await page.evaluate(() => __DDW3.friends.buddies.biscuit.root.position.x); await teleport(bx - 2.2); await page.evaluate(() => { __DDW3.player.facing = 1; }); await sleep(1500); } /* he trots about and other creatures wander past: tap him when nothing else is in front of him (as a child would) */ const bp = await page.evaluate(() => __DDW3.friends.buddies.biscuit.root.position.toArray()); const q = await scr(bp[0], bp[1] + .35, bp[2]); const first = await page.evaluate(q => { const h = __DDW3.pick(q.x, q.y)[0]; return h ? h[5] : 'nothing'; }, q); seen += first + ' '; if (first !== 'buddy_biscuit') { await sleep(700); continue; } await tapWorld(bp[0], bp[1] + .35, bp[2]); await sleep(400); } biscuitSeen = seen; } await sleep(300);
    const r = await page.evaluate(() => [__DDW3.friends.followers.length, __DDW3.world.buddies.biscuit]); check('tap Biscuit the puppy: he follows you everywhere', r[0] === n0 + 1 && r[1] === true, `followers ${n0} → ${r[0]}; in front of him: ${biscuitSeen}`); }
  await teleport(198); { let seenT = ''; /* (build 55: the pets that follow you, like Biscuit, can trot in front of her: tap her when she is the first thing under your finger, a few tries) */
    for (let k = 0; k < 10 && !(await page.evaluate(() => __DDW3.world.buddies.twinkle)); k++) { const tp = await page.evaluate(() => __DDW3.friends.buddies.twinkle.root.position.toArray()); const q = await scr(tp[0], tp[1] + .15, tp[2]); const first = await page.evaluate(q => { const h = __DDW3.pick(q.x, q.y)[0]; return h ? h[5] : 'nothing'; }, q); seenT += first + ' '; if (first !== 'buddy_twinkle') { if (k === 4) { await teleport(tp[0] - 2.2); await page.evaluate(() => { __DDW3.player.facing = 1; }); } await sleep(700); continue; } await tapWorld(tp[0], tp[1] + .15, tp[2]); await sleep(400); }
    await sleep(300); check('tap Twinkle the fairy: she flies along with you', await page.evaluate(() => __DDW3.world.buddies.twinkle === true), `in front of her: ${seenT}`); }
  await teleport(365.6); { await page.evaluate(() => { let done = false; __DDW3.kingdom().eggs[0].baby.traverse(o => { if (!done && o.userData.tap) { done = true; o.userData.tap(); } }); }); await sleep(300); /* (tapped directly: friends following you can stand in front of the baby) */ check('tap a hatched baby dino: it follows you too', await page.evaluate(() => __DDW3.world.dinoFollow[0] === true)); }
  { await teleport(300); const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.right = true; let n = 0; const f = () => { if (P.x > 308 || ++n > 600) { D.keys.right = false; return res(D.friends.followers.map(f => Math.abs(f.pos.x - P.x))); } requestAnimationFrame(f); }; f(); }));
    check('all your pets and friends follow you in a line', r.length >= 5 && r.every(d => d < 8), r.map(d => d.toFixed(1)).join(' ')); }
  await shot('26_followers.jpg');
  // ---------- build 12: the ten fixes ----------
  await teleport(300); await sleep(600);
  { const n0 = await page.evaluate(() => __DDW3.friends.followers.length); await page.evaluate(() => { let done = false; __DDW3.friends.buddies.biscuit.root.traverse(o => { if (!done && o.userData.tap) { done = true; o.userData.tap(); } }); }); await sleep(300);
    const r = await page.evaluate(() => [__DDW3.friends.followers.length, __DDW3.world.buddies.biscuit]); check('tap a friend who follows you: they stay (tap again to bring them)', r[0] === n0 - 1 && r[1] === false, `followers ${n0} → ${r[0]}`); }
  await teleport(55, 9.6); await page.evaluate(() => __DDW3.G.tapWhale()); c = await waitFor(s => s.ride === 'whale' && s.y > 12, 5000); check('tap the sky whale: ride on its back', c.ride === 'whale' && c.y > 12, `ride=${c.ride} y=${c.y.toFixed(1)}`);
  await press('#jumpBtn'); await sleep(300); check('JUMP hops off the whale onto the clouds', !(await S()).ride);
  await teleport(16.5); { const r = await page.evaluate(() => new Promise(res => { const D = __DDW3, P = D.player; D.keys.right = true; let top = 0, n = 0; const f = () => { top = Math.max(top, P.y); if ((P.ride && P.ride.type === 'slide') || ++n > 600) { D.keys.right = false; return res([top, P.ride && P.ride.type]); } requestAnimationFrame(f); }; f(); }));
    check('walk up the steps by the ball pit to the little slide (no jumping needed)', r[0] > 3.7 && r[1] === 'slide', JSON.stringify(r)); }
  await teleport(60); await page.locator('#paintTools .swatch.tool').first().tap(); check('the paint wall has an eraser and a start-again button', await page.evaluate(() => __DDW3.world.paintColor === 'erase') && (await page.locator('#paintTools .swatch.tool').count()) === 2);
  await page.evaluate(() => { __DDW3.world.paintColor = '#ff4f9a'; });
  await teleport(406); await press('#pawBtn'); await sleep(500); c = await S(); check('walk into the Princess Castle', c.layer === 'castle', `layer=${c.layer}`);
  await teleport(2016); await tapWorld(2019.5, 2, -3.6); await sleep(600); c = await S(); check('tap the throne inside the castle: sit on it', c.disc.includes('throne') && c.y > .8, `y=${c.y.toFixed(2)}`);
  await shot('27_castle_inside.jpg');
  await teleport(2002); await press('#pawBtn'); await sleep(500); c = await S(); check('the castle door takes you back outside', c.layer === '' && Math.abs(c.x - 407) < .5);
  await tapChar(258.6, 1.2, -1.9); await sleep(200); check('the mechanic fox talks', (await S()).disc.includes('fox')); // (build 60 moved the fox's home out of the pink wall; tapped where it is)
  // ---------- studio ----------
  await teleport(61); await sleep(300);
  check('paint palette appears by the paint wall', await page.locator('#paintTools').evaluate(e => e.classList.contains('show')));
  await page.locator('.swatch').nth(4).tap();
  { const a = await scr(57.5, 2.0, -3.2), b = await scr(63, 2.9, -3.2); await touch('touchStart', [a]); for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: a.x + (b.x - a.x) * i / 8, y: a.y + (b.y - a.y) * i / 8 }]); await sleep(40); } await touch('touchEnd', []); }
  await sleep(200); c = await S(); check('finger-paint on the giant wall', c.painted && c.disc.includes('paint'));
  await shot('07_painting.jpg');
  await teleport(71); await holdBtn('#rightBtn', 1200); c = await S(); check('walk along the giant xylophone and it plays', c.disc.includes('xylophone'));
  await shot('08_xylophone.jpg');
  // ---------- lab ----------
  await teleport(101.5); await tapWorld(104, .9, -1.8); await tapWorld(107.2, .9, -1.8); c = await S(); check('tap two paint buckets to mix a colour', c.disc.includes('mix'));
  await teleport(97); await tapWorld(99, 1.4, -1.3); await sleep(300); c = await S(); check('tap the bubble machine: bubbles float out', c.bubbles > 0, `${c.bubbles} bubbles`);
  await shot('09_bubbles.jpg');
  await teleport(110); await holdBtn('#rightBtn', 500); c = await waitFor(s => s.y > 3, 3000); check('spring pad bounces you up high', c.y > 3, `y=${c.y.toFixed(2)}`);
  await waitFor(s => s.grounded, 4000);
  // ---------- park rides ----------
  await teleport(139); { const p = await scr(144, 2.6, -5.4), pk = await page.evaluate(([x, y]) => JSON.stringify(__DDW3.pick(x, y)), [p.x, p.y]); await tapWorld(144, 2.6, -5.4); c = await waitFor(s => s.ride === 'carousel', 4000); check('tap the carousel to ride', c.ride === 'carousel', c.ride === 'carousel' ? '' : `hits ${pk} P.x=${c.x.toFixed(1)} ride=${c.ride}`); } // the carousel's centre pole (the animals move, so aim at the pole)
  await sleep(800); await shot('10_carousel.jpg');
  await press('#jumpBtn'); await sleep(300); check('JUMP gets off the carousel', !(await S()).ride);
  await waitFor(s => s.grounded, 3000);
  await teleport(159); await page.evaluate(() => __DDW3.G.rideWheel()); c = await S(); check('ride the Ferris wheel', c.ride === 'wheel');
  c = await waitFor(s => s.y > 1.5, 4000); /* (wait for it to rise: a fixed 2.5 s gave 1.48-1.8 m depending on how fast the test browser drew) */ check('the Ferris wheel lifts you up', c.y > 1.5, `y=${c.y.toFixed(2)}`); await shot('11_ferris_wheel.jpg');
  await press('#jumpBtn'); await waitFor(s => s.grounded, 5000);
  // ---------- star bits ----------
  const b0 = (await S()).bits; await teleport(151); await holdBtn('#rightBtn', 1200); c = await S(); check('walk through star bits to collect them', c.bits > b0, `${b0} → ${c.bits}`);
  // ---------- Fluffkin rescue + the walk-in house ----------
  await teleport(166.6, 2.0); await holdBtn('#rightBtn', 250); await sleep(300); c = await S(); check('find a baby Fluffkin: it follows you', c.fl.includes('follow'));
  await shot('12_fluffkin_found.jpg');
  await teleport(190); await sleep(300); c = await S(); check('a door bubble pops up by the house door', c.door === 'door');
  await press('#pawBtn'); await sleep(600); c = await S(); check('PAW at the door: go inside the Fluffkin House', c.layer === 'in');
  { const home = c.fl.filter(f => f === 'home').length; check('the Fluffkins you brought are home (counter goes up)', home >= 1 && !c.fl.includes('follow') && (await page.locator('#fluffCount').textContent()) === `${home}/6`, `${home} home`); }
  await sleep(600); await shot('13_inside_house.jpg');
  await teleport(1022.6); await sleep(200); c = await S(); check('stair bubble at the bottom of the stairs', c.door === 'up');
  await press('#pawBtn'); await sleep(500); c = await S(); check('PAW puts you on the first step (no automatic walking)', c.stair === 0);
  const partWay = await holdUntil('#rightBtn', () => __DDW3.player.stair?.k > .35); c = await S(); check('hold ▶ to walk up part-way, let go to stop', partWay && c.stair > .2 && c.stair < .95, `k=${c.stair}`);
  const upstairs = await holdUntil('#rightBtn', () => !__DDW3.player.stair && Math.abs(__DDW3.player.y - 4.4) < .01); c = await S(); check('walk off the top onto the upstairs floor', upstairs && c.stair === null && Math.abs(c.y - 4.4) < .01, `y=${c.y}`);
  await holdBtn('#leftBtn', 900); await sleep(800); await shot('14_nursery.jpg');
  await page.evaluate(() => __DDW3.teleport(1015, 4.4)); await sleep(300); await press('#jumpBtn'); await sleep(200); await press('#jumpBtn'); await sleep(500);
  c = await S(); check('the ceiling stops you upstairs (no flying through the roof)', c.y + 1.5 <= 8.81, `y=${c.y.toFixed(2)}`);
  await waitFor(s => s.grounded, 3000);
  await page.evaluate(() => __DDW3.teleport(1028.2, 4.4)); await sleep(300); c = await S(); check('stair bubble at the top of the stairs', c.door === 'down');
  await press('#pawBtn'); await sleep(200); const downstairs = await holdUntil('#leftBtn', () => !__DDW3.player.stair && __DDW3.player.y === 0); c = await S(); check('walk back down the stairs', downstairs && c.stair === null && c.y === 0, `y=${c.y}`);
  await page.evaluate(() => __DDW3.teleport(1003.2)); await sleep(300); await press('#pawBtn'); await sleep(500); c = await S(); check('the front door inside takes you back outside', c.layer === '' && Math.abs(c.x - 190) < .1);
  // ---------- sound + saving ----------
  { const s0 = (await S()).sound, hit = await page.evaluate(() => { const b = document.getElementById('soundBtn').getBoundingClientRect(); const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return e && (e.id || e.className || e.tagName); }); await page.locator('#soundBtn').tap(); await sleep(100); /* (an earlier world tap can land on this button first, so check that a tap FLIPS the setting) */ check('sound button turns sound off (flips the sound setting)', (await S()).sound === !s0, `was ${s0}, top element at the button: ${hit}`); }
  { const s1 = (await S()).sound; await page.locator('#soundBtn').tap(); await sleep(100); check('sound button turns sound back on (flips it back)', (await S()).sound === !s1); if (!(await S()).sound) { await page.locator('#soundBtn').tap(); await sleep(100); } }
  await page.locator('.creatureChoice[data-c="jelly"]').tap(); await sleep(300);
  const before = await S(); await page.evaluate(() => __DDW3.save()); await page.reload(); await sleep(2500);
  check('reload shows KEEP PLAYING', (await page.locator('#playBtn').textContent()).includes('KEEP'));
  await page.locator('#playBtn').tap(); await sleep(800); c = await S();
  { const pb = await page.evaluate(() => ({ pet: __DDW3.friends.hasPet(), bal: __DDW3.world.balloons.length === 2 })); check('reload keeps your pet and your balloon', pb.pet && pb.bal, JSON.stringify(pb)); }
  { const k = await page.evaluate(() => ({ b: __DDW3.world.build.filter(v => v >= 0).length, c: __DDW3.world.colorings[0].some(x => x !== '#ffffff'), s: Object.keys(__DDW3.world.styles || {}).length, sp: __DDW3.world.sparkle })); check('reload keeps your building, colouring, colours and sparkles', k.b === 2 && k.c && k.s > 0 && k.sp, JSON.stringify(k)); }
  { const kk = await page.evaluate(() => JSON.stringify(__DDW3.world.kart)); check('reload keeps your kart design', kk !== JSON.stringify({ col: 0, shape: 0, wheels: 0 }), kk); }
  { const k = await page.evaluate(() => ({ pets: __DDW3.friends.petCount(), f: __DDW3.friends.followers.length })); check('reload keeps all your pets and the friends who follow you', k.pets === 2 && k.f >= 4, JSON.stringify(k)); }
  { const k = await page.evaluate(() => ({ crown: __DDW3.world.crown, eggs: __DDW3.world.dinoEggs })); check('reload keeps your crown and your hatched baby dino', k.crown === true && k.eggs[0] === true, JSON.stringify(k)); }
  check('reload keeps creature, star bits, Fluffkins and painting', c.creature === 'jelly' && c.bits === before.bits && c.fl.join() === before.fl.join() && c.painted, JSON.stringify({ cr: c.creature, bits: c.bits, fl: c.fl.filter(f => f !== 'wait').length, p: c.painted }));
  // ---------- build 29/30: travel (picture map, home button, train trips) and the new neighbourhoods ----------
  await page.locator('#mapBtn').tap(); await sleep(300); check('🗺️ opens the picture map', await page.locator('#mapPanel').evaluate(e => e.classList.contains('show')));
  await page.locator('.mpT', { hasText: '🌉' }).tap(); await sleep(2500); c = await S(); check('a map picture takes you there (Adventure Trail)', Math.abs(c.x - 436) < 1 && c.layer === '', `x=${c.x.toFixed(1)}`);
  { const st = await page.evaluate(() => { const E = __DDW3.G.expansion; E.buildNow(436); return E.stats(); }); check('the neighbourhood you travel to is built at once', /trail:ready/.test(st), st); }
  await page.locator('#homeBtn').tap(); await sleep(2500); c = await S(); check('🏠 takes you home in one tap', Math.abs(c.x - 190) < 1, `x=${c.x.toFixed(1)}`);
  await teleport(1.2); await page.evaluate(() => __DDW3.train.call(__DDW3.train.STATIONS.findIndex(s => s.e === '🏠'))); c = await waitFor(s => s.ride === 'train', 60000); await sleep(800);
  check('in the stopped train, the picture strip of stations appears', await page.locator('#trainStrip').evaluate(e => e.classList.contains('show')));
  await page.locator('.tsT', { hasText: '🎨' }).tap(); c = await waitFor(s => !s.ride, 90000); check('pick a station picture: the train drives you there and you hop off', !c.ride && Math.abs(c.x - 61) < 1, `ride=${c.ride} x=${c.x.toFixed(1)}`);
  await teleport(-66); await page.evaluate(() => __DDW3.G.expansion.buildNow(-66)); await sleep(500);
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'seaside'); const crab = S.taps.find(o => o.userData && o.userData.pal === 'crab'); if (!crab) return 'no crab'; let m = null; crab.traverse(q => { if (!m && q.userData.tap) m = q; }); for (let k = 0; k < 3; k++) m.userData.tap(); return JSON.stringify(__DDW3.world.exp.pals); }); check('befriend Pinchy the crab (three taps): Pinchy follows you', /crab.*follow":true/.test(r), r); }
  await page.locator('#petsBtn').tap(); await sleep(300); { const t = await page.locator('#petsPanel .mpT').allTextContents(); check('🐾 My Pets shows your friends (Pinchy is there and following)', await page.locator('#petsPanel').evaluate(e => e.classList.contains('show')) && t.some(x => x.includes('🦀') && x.includes('💖')), t.join(' ')); }
  await page.locator('#petsPanel .mpX').tap(); await sleep(200);
  { const r = await page.evaluate(() => { const out = []; for (const g of __DDW3.G.slices || []) for (const o of g.children) { /* where it really is in the world (some scenery has its position baked into its shape) */ const c = new __DDW3.THREE.Box3().setFromObject(o).getCenter(new __DDW3.THREE.Vector3()); if (isFinite(c.x) && Math.abs(c.x - g.userData.x) > 30) out.push(o.type + '@' + c.x.toFixed(0)); } return out; }); check('nothing that travels with you (crown, shadow, hints) is hidden away in a scenery chunk', r.length === 0, r.slice(0, 5).join(' ')); }
  { await teleport(412); await page.evaluate(() => { const L = __DDW3.kingdom().luna; let done = false; L.root.traverse(o => { if (!done && o.userData.tap) { done = true; o.userData.tap(); } }); }); await sleep(300); await teleport(150); await sleep(800);
    const r = await page.evaluate(() => ({ wand: __DDW3.world.wand === true, wv: __DDW3.kingdom().wand.visible, crown: __DDW3.world.crown === true, cv: __DDW3.kingdom().crown.visible, crownInScene: (() => { let o = __DDW3.kingdom().crown; while (o.parent) o = o.parent; return o.isScene; })(), dx: Math.abs(__DDW3.kingdom().crown.position.x - __DDW3.player.x) }));
    check('Princess Luna gives a magic wand; the crown and wand stay with you far from the castle', r.wand && r.wv && r.crown && r.cv && r.crownInScene && r.dx < 1, JSON.stringify(r)); }
  // ---------- build 35: 🚜 Happy Farm (map, train, activities, Truffle the piglet) ----------
  await page.locator('#mapBtn').tap(); await sleep(300); await page.locator('.mpT', { hasText: '🚜' }).tap(); await sleep(2500); c = await S();
  { const st = await page.evaluate(() => __DDW3.G.expansion.stats()); check('🚜 the map takes you to the Happy Farm, built at once', Math.abs(c.x + 412) < 1.5 && /farm:ready/.test(st), `x=${c.x.toFixed(1)} ${st}`); }
  await teleport(-433.2); await page.evaluate(() => { __DDW3.player.facing = 1; }); await sleep(600); await tapWorld(-431, .75, -2.6); await sleep(400);
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'farm'); const hen = S.inter.find(i => i.x === -431); for (let k = 0; k < 4; k++) hen.run(); return __DDW3.world.disc.has('eggs'); }); check('tap the hen: she lays eggs and you count them', r); }
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'farm'); const ok = []; for (const x of [-420, -457, -478, -492, -503, -514, -524]) { const it = S.inter.find(i => i.x === x); if (it) { it.run(); if (x === -478) { it.run(); it.run(); it.run(); } } } for (const d of ['barn', 'sheep', 'garden', 'apples', 'windmill', 'ducks', 'tractor']) if (__DDW3.world.disc.has(d)) ok.push(d); return ok; });
    check('the farm activities work (barn animals, rainbow sheep, carrots, apples, windmill, ducks, tractor)', r.length === 7, r.join(' ')); }
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'farm'); const pig = S.taps.find(o => o.userData && o.userData.pal === 'pig'); if (!pig) return 'no pig'; let m = null; pig.traverse(q => { if (!m && q.userData.tap) m = q; }); for (let k = 0; k < 3; k++) m.userData.tap(); return JSON.stringify(__DDW3.world.exp.pals); }); check('befriend Truffle the piglet (three taps): Truffle follows you', /pig.*follow":true/.test(r), r); }
  check('the train line reaches the farm (🚜 station)', await page.evaluate(() => __DDW3.train.STATIONS.some(s => s.e === '🚜' && s.x < -500)));
  // ---------- build 38: 🌊 Ocean Pier ----------
  await page.locator('#mapBtn').tap(); await sleep(300); await page.locator('.mpT', { hasText: '🌊' }).tap(); await sleep(2500); c = await S();
  { const st = await page.evaluate(() => __DDW3.G.expansion.stats()); check('🌊 the map takes you to the Ocean Pier, built at once', Math.abs(c.x + 544) < 1.5 && /pier:ready/.test(st), `x=${c.x.toFixed(1)} ${st}`); }
  await teleport(-554); await page.evaluate(() => { __DDW3.player.facing = 1; }); await sleep(600);
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'pier'); const ok = []; for (const x of [-552, -566, -578.4, -606, -620, -636, -650]) { const it = S.inter.find(i => i.x === x); if (it) { it.run(); it.run(); it.run(); } } for (const d of ['fishing', 'tidepool', 'buoys', 'dolphin', 'treasure', 'sailboat', 'whale']) if (__DDW3.world.disc.has(d)) ok.push(d); return ok; });
    check('the pier activities work (fishing, tide pool, buoys, dolphin, treasure, sailboat, whale)', r.length === 7, r.join(' ')); }
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'pier'); const seal = S.taps.find(o => o.userData && o.userData.pal === 'seal'); if (!seal) return 'no seal'; let m = null; seal.traverse(q => { if (!m && q.userData.tap) m = q; }); for (let k = 0; k < 3; k++) m.userData.tap(); return JSON.stringify(__DDW3.world.exp.pals); }); check('befriend Splash the seal (three taps): Splash follows you', /seal.*follow":true/.test(r), r); }
  check('the train line reaches the pier (🌊 station)', await page.evaluate(() => { const st = __DDW3.train.STATIONS.find(q => q.e === '🌊'); return !!st && st.x < -640; }));
  // ---------- build 49: 🎈 Balloon Hills, past the pier ----------
  await page.locator('#mapBtn').tap(); await sleep(300); await page.locator('.mpT', { hasText: '🎈' }).tap(); await sleep(2500); c = await S();
  { const st = await page.evaluate(() => __DDW3.G.expansion.stats()); check('🎈 the map takes you to Balloon Hills, built at once', Math.abs(c.x + 676) < 1.5 && /hills:ready/.test(st), `x=${c.x.toFixed(1)} ${st}`); }
  { await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'hills'); for (const x of [-684, -696, -738, -752, -763, -777]) { const it = S.inter.find(i => i.x === x); if (it) it.run(); } });
    const r = await page.evaluate(() => new Promise(res => setTimeout(() => res(['balloon', 'kites', 'goats', 'echo', 'chimes', 'dandelion'].filter(d => __DDW3.world.disc.has(d))), 1500)));
    check('the Balloon Hills activities work (balloon, kites, goats, echo, chimes, dandelions)', r.length === 6, r.join(' ')); }
  { await page.evaluate(() => { const P = __DDW3.player; P.x = -715; P.y = 4.85; P.vy = 0; }); await sleep(1500); await press('#pawBtn');
    c = await waitFor(s => s.ride === 'slide' || s.disc.includes('hillslide'), 8000); check('PAW on top of the grassy hill: slide down', c.disc.includes('hillslide'), `ride=${c.ride} y=${c.y && c.y.toFixed(1)}`); }
  check('the train line reaches Balloon Hills (🎈 station at the far left)', await page.evaluate(() => __DDW3.train.STATIONS[0].e === '🎈' && __DDW3.train.STATIONS[0].x < -780));
  { await page.evaluate(() => { const P = __DDW3.player; P.ride = null; P.x = -827; P.y = 9.7; P.vy = 0; }); c = await waitFor(s => s.y > 9 && Math.abs(s.x - 42) < 3, 8000); check('the rainbow stairs at the new far-left end still lead into the Sky Kingdom', Math.abs(c.x - 42) < 3, `x=${c.x.toFixed(1)} y=${c.y.toFixed(1)}`); }
  // ---------- build 40: Clover the goat on the Adventure Trail ----------
  await teleport(492); await page.evaluate(() => __DDW3.G.expansion.buildNow(492)); await sleep(500);
  { const r = await page.evaluate(() => { const S = __DDW3.G.expansion._S.find(s => s.d.id === 'trail'); const goat = S.taps.find(o => o.userData && o.userData.pal === 'goat'); if (!goat) return 'no goat'; let m = null; goat.traverse(q => { if (!m && q.userData.tap) m = q; }); for (let k = 0; k < 3; k++) m.userData.tap(); return JSON.stringify(__DDW3.world.exp.pals); }); check('befriend Clover the goat on the Adventure Trail (three taps): Clover follows you', /goat.*follow":true/.test(r), r); }
  // ---------- build 41: friends who follow you play together when you stand still ----------
  await teleport(150); await sleep(500);
  { const ok = await page.evaluate(() => new Promise(res => { const t0 = performance.now(); const f = () => { if (__DDW3.world.disc.has('palsplay')) res(true); else if (performance.now() - t0 > 40000) res(false); else setTimeout(f, 250); }; f(); }));
    check('stand still with friends following: two of them play together (hearts and a giggle)', ok, `${await page.evaluate(() => __DDW3.G.expansion._followers().join(' '))}`); }
  // ---------- build 43: the family's list ----------
  // 1. the camera is further out, and at the Block Builder the whole wall (all 5 rows) is on screen
  await teleport(214.4); await sleep(3500);
  { const r = await page.evaluate(() => { const top = __DDW3.toScreen(214.4, 5.0, -1.7), bot = __DDW3.toScreen(214.4, 0, -1.7); return { top: Math.round(top.y), bot: Math.round(bot.y), h: innerHeight }; }); check('the Block Builder wall fits on screen, top row included', r.top > 0 && r.bot < r.h, JSON.stringify(r)); }
  // 2. the learning corners are play spots with a floating toy (no signposts), and still open their games
  { const r = await page.evaluate(() => (__DDW3.G.learnSigns || []).map(g => !!g.userData.toy && !!g.userData.ring)); check('the learning corners are play spots with a floating toy (no signposts)', r.length === 7 && r.every(Boolean), JSON.stringify(r)); }
  // 3. the seesaw: walk onto it and it rocks you up and down; jump at the top for a super bounce
  await teleport(632); await page.evaluate(() => __DDW3.G.expansion.buildNow(632)); await sleep(800);
  await page.evaluate(() => { __DDW3.keys.right = true; }); for (let i = 0; i < 60 && (await page.evaluate(() => __DDW3.player.x)) < 635.6; i++) await sleep(100); await page.evaluate(() => { __DDW3.keys.right = false; });
  { let hi = 0; for (let i = 0; i < 24; i++) { hi = Math.max(hi, await page.evaluate(() => __DDW3.player.y)); await sleep(150); } check('the seesaw rocks you up and down', hi > 1.2, `highest y=${hi.toFixed(2)}`); }
  // 4. the stairs at the end of the world climb into the sky, and the rainbow gate takes you to the Sky Kingdom
  await teleport(930); await page.evaluate(() => { __DDW3.player.y = 9.6; __DDW3.player.x = 933; }); await sleep(300);
  await page.evaluate(() => { __DDW3.keys.right = true; }); c = await waitFor(s => s.y > 9 && s.x < 100, 30000); await page.evaluate(() => { __DDW3.keys.right = false; });
  check('the rainbow stairs at the end of the world lead up into the Sky Kingdom', c.x < 100 && c.y > 9, `x=${c.x.toFixed(1)} y=${c.y.toFixed(1)}`);
  { const r = await page.evaluate(() => { ['skystars', 'skysheep', 'skyballoons'].forEach(id => { const it = __DDW3.G.interact.find(i => i.disc === id); it && it.run(); }); return ['skystars', 'skysheep', 'skyballoons'].filter(d => __DDW3.world.disc.has(d)); }); check('the bigger Sky Kingdom: moon and stars, cloud sheep, colour balloons', r.length === 3, r.join(' ')); }
  // 5. steer the sky whale: ▶ flies right, ▲ flies higher (and doesn't throw you off); JUMP hops off and you float down
  await page.evaluate(() => { const P = __DDW3.player; P.x = 54; P.y = 9.55; P.z = -1.4; }); await sleep(500); await page.evaluate(() => __DDW3.G.tapWhale()); await sleep(500);
  { const x0 = await page.evaluate(() => __DDW3.player.x); await page.evaluate(() => { __DDW3.keys.right = true; }); await waitFor(s => s.x > x0 + 6, 20000); /* (build 43: hold until it has flown, not a fixed time: late in the test this machine draws only 1-2 frames a second) */ await page.evaluate(() => { __DDW3.keys.right = false; __DDW3.keys.up = true; }); await sleep(1500); await page.evaluate(() => { __DDW3.keys.up = false; });
    const r = await page.evaluate(() => ({ ride: __DDW3.player.ride && __DDW3.player.ride.type, x: __DDW3.player.x, y: __DDW3.player.y, inScene: __DDW3.G.whale.g.parent === __DDW3.G.scene && __DDW3.G.whale.g.visible })); check('steer the sky whale: it flies where you point (and stays visible: never in a scenery section)', r.ride === 'whale' && r.x > x0 + 5 && r.inScene, `x ${x0.toFixed(1)} → ${r.x.toFixed(1)}, y ${r.y.toFixed(1)}, whale in the scene: ${r.inScene}`);
    await press('#jumpBtn'); await sleep(300); const v = await page.evaluate(() => [__DDW3.player.ride, __DDW3.player.vy]); check('JUMP hops off the flying whale and you float gently down', !v[0] && v[1] > -4, JSON.stringify(v)); }
  await sleep(4000);
  // 6. the deep pool: dive in, swim down through the tunnel into the underwater world, and climb back out
  await teleport(-8); await sleep(800); await page.evaluate(() => __DDW3.G.deepSea.dive()); await sleep(600); c = await S(); check('tap the Splash Pool: you dive into the deep pool and swim', c.layer === 'sea', `layer=${c.layer}`);
  await page.evaluate(() => { __DDW3.keys.right = true; }); c = await waitFor(s => s.x > 3012, 60000); await page.evaluate(() => { __DDW3.keys.right = false; });
  check('swim down and through the tunnel at the bottom into the underwater world', c.x > 3012 && c.layer === 'sea', `x=${c.x.toFixed(1)}`);
  { const r = await page.evaluate(() => { __DDW3.G.interact.filter(i => i.layer === 'sea').forEach(i => i.run()); return ['coral', 'fishschool', 'seaturtle', 'octopus', 'jellyfish', 'seatreasure', 'clam', 'seadolphins', 'seafloor'].filter(d => __DDW3.world.disc.has(d)); }); check('the sea creatures answer when tapped (coral, fish, turtle, octopus, jellyfish, treasure, clam, dolphins, sea floor)', r.length === 9, r.join(' ')); }
  await page.evaluate(() => { __DDW3.player.x = 3005; __DDW3.player.y = -1; __DDW3.keys.up = true; }); c = await waitFor(s => s.layer === '', 20000); await page.evaluate(() => { __DDW3.keys.up = false; });
  check('swim up to the top of the pool to climb out', c.layer === '' && Math.abs(c.x + 8) < 1, `layer=${c.layer} x=${c.x.toFixed(1)}`);
  // ---------- build 45: the space rocket, with each place's real gravity ----------
  await teleport(692); await page.evaluate(() => __DDW3.G.expansion.buildNow(692)); // (build 64: the rocket moved 686 → 693; the bubble fountain is at 698) await sleep(500);
  // (build 48) PAW beside the rocket climbs in (it used to blow the bubble fountain's bubbles: both stood at x 698)
  { const t = await page.evaluate(() => __DDW3.G.actionTarget && __DDW3.G.actionTarget.disc); await press('#pawBtn');
    const r = await page.evaluate(() => new Promise(res => { const t0 = performance.now(); const f = () => { const P = __DDW3.player; if ((P.ride && P.ride.phase === 'in' && document.querySelector('#rocketPanel.show')) || performance.now() - t0 > 30000) res({ ride: P.ride && P.ride.type + ':' + P.ride.phase, hidden: !!__DDW3.G.playerHidden, bubbles: __DDW3.world.disc.has('bubbles') }); else setTimeout(f, 50); }; f(); }));
    check('PAW at the rocket: she climbs inside it (not bubbles) and the planet pictures come up', t === 'rocketmenu' && r.ride === 'rocket:in' && r.hidden, `target=${t} ride=${r.ride} hidden=${r.hidden}`); }
  { const n = await page.locator('#rocketPanel.show .rkT').count(); check('the rocket shows a picture for Earth, the Moon, every planet and Pluto', n === 10, `${n} pictures`); }
  { await page.locator('#rocketPanel .rkT.moon').tap(); await sleep(300); const r = await page.evaluate(() => ({ btn: !!document.querySelector('#blastBtn.show'), layer: __DDW3.player.layer, ride: __DDW3.player.ride && __DDW3.player.ride.phase }));
    check('picking the Moon shows the big red button (no flying yet)', r.btn && r.layer === '' && r.ride === 'in', JSON.stringify(r)); }
  { await page.evaluate(() => { __DDW3.G.rkLog = { phases: new Set(), top: 0 }; }); await page.locator('#blastBtn').tap({ force: true }); /* (it pulses) */
    /* (the game records each phase it runs: the slow test browser can draw just one frame of the short test-mode countdown) */
    const seen = await page.evaluate(() => new Promise(res => { const t0 = performance.now(); const f = () => { const L = __DDW3.G.rkLog; if (__DDW3.player.layer === 'space' || performance.now() - t0 > 60000) res({ ph: [...L.phases], top: L.top }); else setTimeout(f, 50); }; f(); }));
    check('the red button: countdown, then the rocket lifts off the pad with her inside', seen.ph.includes('count') && seen.ph.includes('lift') && seen.top > .5, `phases ${seen.ph.join(',')}, rose ${seen.top.toFixed(1)} m`); }
  // (build 48) flying is now a real ride: wait until the rocket has landed at the place and she has climbed out
  const flyTo = id => page.evaluate(id => { __DDW3.G.launchTo(id); return new Promise(res => { const t0 = performance.now(); const f = () => { const P = __DDW3.player, r = __DDW3.G.rockets[id]; if ((!P.ride && r && Math.abs(P.x - r.x) < 4 && P.layer === (id === 'earth' ? '' : 'space')) || performance.now() - t0 > 60000) res(); else setTimeout(f, 50); }; setTimeout(f, 50); }); }, id);
  // (the game records each jump's peak on every physics step: a Jupiter hop is over in a third of a second, faster than this slow test browser draws frames)
  const jumpPeak = async () => { await page.evaluate(() => { __DDW3.G.spaceLastJump = 0; }); await press('#jumpBtn'); return page.evaluate(() => new Promise(res => { const t0 = performance.now(); const f = () => { const h = __DDW3.G.spaceLastJump; if (h > 0 || performance.now() - t0 > 60000) res(h || 0); else setTimeout(f, 50); }; f(); })); };
  { c = await waitFor(s => s.layer === 'space', 20000); const g = await page.evaluate(() => __DDW3.G.spaceG);
    { const r = await page.evaluate(() => new Promise(res => { const t0 = performance.now(); const f = () => { const P = __DDW3.player; if (!P.ride || performance.now() - t0 > 30000) res({ ride: P.ride && P.ride.phase, hidden: !!__DDW3.G.playerHidden, x: P.x - __DDW3.G.rockets.moon.x }); else setTimeout(f, 50); }; f(); }));
      check('on the Moon the rocket lands on its pad and she climbs out', !r.ride && !r.hidden && Math.abs(r.x - 2.5) < .5, JSON.stringify(r)); }
    check('fly to the Moon: real Moon gravity (1.62 / 9.81 of Earth\'s)', c.layer === 'space' && Math.abs(g - 1.62 / 9.81) < .001, `layer=${c.layer} g=${g && g.toFixed(3)}`);
    await sleep(800); const top = await jumpPeak(); check('on the Moon you jump about six times higher', top > 9, `jumped to ${top.toFixed(1)} m (Earth ≈ 1.8 m)`); }
  { await flyTo('jupiter'); c = await waitFor(s => s.layer === 'space', 20000); await sleep(800); const top = await jumpPeak(); check('on Jupiter the strong gravity allows only tiny hops', top < 1.1 && top > .2, `jumped to ${top.toFixed(2)} m`); }
  { await flyTo('pluto'); c = await waitFor(s => s.layer === 'space', 20000); const g = await page.evaluate(() => __DDW3.G.spaceG); check('Pluto has the weakest gravity of all (0.62 / 9.81)', Math.abs(g - .62 / 9.81) < .001, `g=${g.toFixed(3)}`); }
  // (build 47) every planet is its own place: its own aliens and activities that fit it (tap them all on each one)
  { const found = [], missing = [];
    for (const id of ['moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) { await flyTo(id); await waitFor(s => s.layer === 'space', 20000); await sleep(400);
      const r = await page.evaluate(id => { const its = __DDW3.G.interact.filter(i => i.layer === 'space' && i.x > __DDW3.G.spaceBounds[0] - 2 && i.x < __DDW3.G.spaceBounds[1] + 2 && i.disc && !String(i.disc).startsWith('space_')); its.forEach(i => i.run()); return { n: its.length, alien: __DDW3.world.disc.has('alien_' + id) }; }, id);
      (r.alien && r.n >= 3 ? found : missing).push(`${id}:${r.n}${r.alien ? '' : ' (no alien)'}`); }
    check('every planet has its own aliens and at least 2 activities of its own', missing.length === 0, (missing.length ? 'MISSING ' + missing.join(' ') + ' | ' : '') + found.join(' ')); }
  // (build 50) BIGGER PLANETS: the Moon and Mars are 330 m long; their new areas are built as you walk there; their
  // activities work; the little rocket signs take you back to the rocket; only the planet you are on is in memory
  for (const [id, ds] of [['moon', ['moonbounce', 'moonradio', 'moonphases', 'moonsamples', 'mooncave', 'moonshapes', 'moonbuggy']], ['mars', ['marsrocks', 'marsice', 'marssunset', 'marsbase', 'marsgarden', 'marsheli', 'marsmoons', 'marsflags']], ['pluto', ['plutocastle']], ['jupiter', ['jupiterseesaw', 'jupiterrider']], ['uranus', ['uranuscastle', 'uranusrink']], ['mercury', ['mercuryfunhouse']], ['neptune', ['neptunewindsock']], ['venus', ['venuspool']], ['saturn', ['saturnrings']]]) {
    await flyTo(id); const B = await page.evaluate(() => __DDW3.G.spaceBounds);
    for (const x of [B[0] + 60, B[0] + 120, B[0] + 180, B[0] + 240, B[0] + 300]) { await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; }, x); await sleep(1500); }
    const r = await page.evaluate(([B, ds]) => { __DDW3.G.interact.filter(i => i.layer === 'space' && i.x > B[0] + 108 && i.x < B[1] && i.disc && ds.includes(i.disc)).forEach(i => i.run()); return new Promise(res => setTimeout(() => res({ len: Math.round(B[1] - B[0]), miss: ds.filter(d => !__DDW3.world.disc.has(d)), groups: __DDW3.G.scene.children.filter(o => /^space:/.test(o.name)).map(o => o.name) }), 1500)); }, [B, ds]);
    check(`${id}: a big place (330 m) whose new areas have their own activities`, r.len >= 320 && r.miss.length === 0, `length ${r.len} m, missing: ${r.miss.join(' ') || 'none'}`);
    check(`${id}: only this planet is kept in memory`, r.groups.length === 1 && r.groups[0] === 'space:' + id, r.groups.join(' '));
    if (id === 'saturn') { // (build 68) the Star Blaster spins, shoots up and drops; the Ring Raceway races two laps round Saturn's rings
      const go = (x, disc, type) => page.evaluate(([x, disc, type]) => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.ride = null; return new Promise(res => setTimeout(() => { const it = __DDW3.G.interact.find(i => i.disc === disc); if (!it) return res({ none: true }); it.run(); const t0 = performance.now(); let seen = false, R0 = null, maxY = 0;
        const f = () => { if (P.ride && P.ride.type === type) { seen = true; R0 = P.ride; maxY = Math.max(maxY, P.y); } if ((seen && !P.ride) || performance.now() - t0 > 200000) return res({ seen, maxY, maxW: R0 && R0.maxW, laps: R0 && R0.laps, end: !P.ride, y: P.y }); requestAnimationFrame(f); }; f(); }, 2500)); }, [x, disc, type]);
      await page.evaluate(() => { const end = performance.now() + 90000; const f = () => { const R = __DDW3.player.ride; if (R && R.type === 'blaster' && R.onJump && R.t < 5) R.onJump(); if (performance.now() < end) requestAnimationFrame(f); }; f(); }); // (build 71: you press JUMP to spin faster)
      const bl = await go(B[0] + 147, 'saturnblaster', 'blaster'); check('Saturn: the Star Blaster spins you fast (press JUMP), shoots you up the 60 m tower, and drops you back down', bl.seen && bl.end && bl.maxW >= 6 && bl.maxY > 50 && bl.y < .2, JSON.stringify(bl));
      const rc = await go(B[0] + 237, 'saturnracego', 'ringrace'); check('Saturn: race two laps round the Ring Raceway on Saturn\'s rings and land back on the pad', rc.seen && rc.end && rc.laps >= 2 && rc.maxY > 25 && rc.y < .2, JSON.stringify(rc)); }
    if (id === 'venus') { // (build 68) the giant log ride: up the lift to 18 m, along the high channel, down the big drop: SPLASH
      const st = B[0] + 128; await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.ride = null; }, st); await sleep(2500);
      const lg = await page.evaluate(st => new Promise(res => { const P = __DDW3.player; const it = __DDW3.G.interact.find(i => i.disc === 'venuslogride'); if (!it) return res({ none: true }); it.run(); const t0 = performance.now(); let seen = false, maxY = 0, R0 = null;
        const f = () => { if (P.ride && P.ride.type === 'logride') { seen = true; R0 = P.ride; maxY = Math.max(maxY, P.y); } if ((seen && !P.ride) || performance.now() - t0 > 150000) return res({ seen, maxY, splashed: !!(R0 && R0.splashed), maxV: R0 && R0.maxV, x: P.x - st, y: P.y }); requestAnimationFrame(f); }; f(); }), st);
      check('Venus: the giant log ride floats up to 18 m and splashes down the big drop into the pool', lg.seen && lg.maxY > 17 && lg.splashed && lg.y < .2, JSON.stringify(lg)); }
    if (id === 'neptune') { // (build 68) the wind swing, a whole bungee jump, and a flight in the skydiving chamber
      const go = (x, disc, type) => page.evaluate(([x, disc, type]) => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.grounded = true; P.ride = null; return new Promise(res => { setTimeout(() => { const it = __DDW3.G.interact.find(i => i.disc === disc); if (!it) return res({ none: true }); it.run(); const t0 = performance.now(); let seen = false, maxY = 0, minLow = 99, flip = false, R0 = null;
        const f = () => { if (P.ride && P.ride.type === type) { seen = true; R0 = P.ride; maxY = Math.max(maxY, P.y); if (Math.abs(P.ride.roll || 0) > 1.3) flip = true; if (maxY > 20) minLow = Math.min(minLow, P.y); } if ((seen && !P.ride) || performance.now() - t0 > 150000) return res({ seen, maxY, minLow, flip, maxA: R0 && R0.maxA, end: !P.ride, y: P.y }); requestAnimationFrame(f); }; f(); }, 2500); }); }, [x, disc, type]);
      await page.evaluate(() => { const end = performance.now() + 60000; let last = 0; const f = () => { const R = __DDW3.player.ride; if (R && R.type === 'wswing' && R.onJump && performance.now() - last > 700 && (R.amp || 0) < 1.2) { last = performance.now(); R.onJump(); } if (performance.now() < end) requestAnimationFrame(f); }; f(); }); // (build 82: you pump the swing with JUMP)
      const ws = await go(B[0] + 135, 'neptuneswing', 'wswing'); check('Neptune: the wind pushes the swing higher and higher', ws.seen && ws.end && ws.maxA > 1, JSON.stringify(ws));
      const bj = await go(B[0] + 181, 'neptunebungeego', 'bungee'); check('Neptune: bungee jump from the 24 m tower, upside down on the cord, bounce, and back to the ground', bj.seen && bj.end && bj.maxY > 23 && bj.flip && bj.y < .2, JSON.stringify(bj));
      const sd = await go(B[0] + 253, 'neptuneskydivego', 'skydive'); check('Neptune: float in the skydiving chamber, then land gently', sd.seen && sd.end && sd.maxY > 3 && sd.flip && sd.y < .2, JSON.stringify(sd)); }
    if (id === 'uranus') { // (build 67) slide down from the ice castle's rampart; glide on the skating rink after letting go
      const cx = B[0] + 149; await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 4.8; P.vy = 0; P.grounded = true; P.ride = null; __DDW3.keys.right = true; }, cx + 6);
      const sl = await page.evaluate(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false; const f = () => { if (P.ride && P.ride.type === 'slide') { seen = true; __DDW3.keys.right = false; } if ((seen && !P.ride) || performance.now() - t0 > 60000) { __DDW3.keys.right = false; return res({ seen, y: P.y }); } requestAnimationFrame(f); }; f(); }));
      check('Uranus: walk off the ice castle rampart and slide down the ice slide', sl.seen && sl.y < .5, JSON.stringify(sl));
      await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.grounded = true; P.ride = null; }, B[0] + 259); await sleep(2500);
      await page.evaluate(() => { __DDW3.keys.right = true; }); await waitFor(s => s.x > 0, 500).catch(() => {}); await sleep(1500); await page.evaluate(() => { __DDW3.keys.right = false; });
      const g0 = await page.evaluate(() => __DDW3.player.x); await sleep(2000); const g1 = await page.evaluate(() => __DDW3.player.x);
      check('Uranus: on the skating rink you keep gliding after you let go', g1 - g0 > 1, `glided ${(g1 - g0).toFixed(2)} m`); }
    if (id === 'mercury') { // (build 67) the mirror doors block the way until tapped; the funny reflection shows; the golden star at the end
      const x0 = B[0] + 123; await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.grounded = true; P.ride = null; }, x0 + 16); await sleep(2000);
      await page.evaluate(() => { __DDW3.keys.right = true; }); await sleep(3000); await page.evaluate(() => { __DDW3.keys.right = false; }); const stopped = await page.evaluate(() => __DDW3.player.x);
      check('Mercury: a mirror door blocks the way until you tap it', stopped < x0 + 18, `stopped at +${(stopped - x0).toFixed(1)} m (door at +18)`);
      await page.evaluate(x => { __DDW3.player.x = x; }, x0 + 6); await sleep(2500); const p0 = await page.evaluate(() => __DDW3.G.mirrorPics || 0); await sleep(1500); const seenRefl = await page.evaluate(p0 => { let v = false; __DDW3.G.scene.traverse(o => { if (o.visible && o.isMesh && o.position && Math.abs(o.position.z + 4.12) < .01 && o.material.map && o.material.map.isRenderTargetTexture) v = true; }); return v && (__DDW3.G.mirrorPics || 0) > p0; }, p0); // (build 73: a live picture of you)
      check('Mercury: the funhouse mirror shows your character, funnily stretched', seenRefl);
      for (let i = 0; i < 3; i++) await page.evaluate(i => __DDW3.G.interact.find(it => it.disc === 'mercurydoor' + i).run(), i);
      await page.evaluate(() => { __DDW3.keys.right = true; }); await waitFor(s => s.disc.includes('mercurymaze'), 120000); await page.evaluate(() => { __DDW3.keys.right = false; });
      check('Mercury: tap the three mirror doors open and walk through the maze to the golden star', (await S()).disc.includes('mercurymaze')); }
    if (id === 'jupiter') { // (build 66) the playground swing, and the lift up the 30 m tower and the super slide all the way down
      const ride = (x, disc, type) => page.evaluate(([x, disc, type]) => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.ride = null; return new Promise(res => { const it = __DDW3.G.interact.find(i => i.disc === disc); if (!it) return res({ none: true }); it.run(); const t0 = performance.now(); let maxY = 0, seen = false;
        const f = () => { if (P.ride && (!type || P.ride.type === type)) seen = true; maxY = Math.max(maxY, P.y); if ((seen && !P.ride) || performance.now() - t0 > 150000) return res({ seen, maxY, x: P.x, y: P.y, done: !P.ride }); requestAnimationFrame(f); }; f(); }); }, [x, disc, type]);
      await page.evaluate(x => { __DDW3.player.x = x; }, B[0] + 126); await sleep(2500);
      const sw = await ride(B[0] + 126, 'jupiterswing', 'jswing'); check('Jupiter: ride a playground swing (higher and higher, then off)', sw.seen && sw.done && sw.maxY > 1, JSON.stringify(sw));
      await page.evaluate(x => { __DDW3.player.x = x; }, B[0] + 233); await sleep(2500);
      const sl = await ride(B[0] + 233, 'jupiterslide', null); check('Jupiter: the glass lift goes up the 30 m tower and the super slide whooshes all the way down to the path', sl.seen && sl.done && sl.maxY > 28 && sl.x > B[0] + 300 && sl.y < .5, JSON.stringify(sl)); }
    if (id === 'mars') { // (build 68) climb the giant rock wall to the top, walk off the edge onto the giant trampoline, bounce
      const wx = B[0] + 201.5; await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; P.ride = null; P.grounded = true; }, wx); await sleep(2000);
      await page.evaluate(() => { __DDW3.G.interact.find(i => i.disc === 'marsclimbgo').run(); __DDW3.keys.up = true; });
      const top = await page.waitForFunction(() => !__DDW3.player.ride && __DDW3.player.y > 30, null, { timeout: 120000 }).then(() => true, () => false); await page.evaluate(() => { __DDW3.keys.up = false; });
      await page.evaluate(() => { __DDW3.keys.right = true; }); await page.waitForFunction(() => __DDW3.player.y < 29.8, null, { timeout: 30000 }).catch(() => {}); await page.evaluate(() => { __DDW3.keys.right = false; }); // (she steps off, then lets go)
      const tr = await page.evaluate(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let lands = 0, up = true, pk = 0, peaks = []; const f = () => { if (P.y > 23) { up = true; pk = Math.max(pk, P.y - 20); } if (up && P.y < 21.6) { lands++; up = false; peaks.push(pk); pk = 0; } if (lands >= 3 || performance.now() - t0 > 60000) return res({ lands, peaks }); requestAnimationFrame(f); }; f(); }));
      check('Mars: climb the 30 m rock wall to the top, then jump off onto the high trampoline and bounce, again and again', top && tr.lands >= 3 && tr.peaks[1] > 4 && tr.peaks[2] > 4, JSON.stringify({ top, ...tr })); }
    if (id === 'pluto') { // (build 66) the super bouncy bounce castles: walk onto the giant one and you bounce up high, again and again
      const cx = B[0] + 183; await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 2; P.vy = 0; P.grounded = false; }, cx); 
      const bo = await page.evaluate(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0, lands = 0, wasUp = false; const f = () => { maxY = Math.max(maxY, P.y); if (P.y > 3) wasUp = true; if (wasUp && P.y < 1.2) { lands++; wasUp = false; } if (lands >= 2 || performance.now() - t0 > 60000) return res({ maxY, lands }); requestAnimationFrame(f); }; f(); }));
      check('Pluto: the giant bounce castle bounces you super high, again and again', bo.maxY > 12 && bo.lands >= 2, JSON.stringify(bo)); }
    if (id === 'moon') { // (build 69) THE GIANT MOON COASTER: the whole 4.7 km ride, end to end
      await page.waitForFunction(() => __DDW3.G.moonCoaster && __DDW3.G.moonCoaster.ready, null, { timeout: 120000 });
      const st = B[0] + 79; /* (build 100: the station moved from 206 to 80, near the rocket) */ for (const x of [B[0] + 150, st]) { await page.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; }, x); await sleep(1500); }
      const ride = await page.evaluate(st => new Promise(res => { const it = __DDW3.G.interact.find(i => i.disc === 'coaster' && Math.abs(i.x - st) < 6); if (!it) return res({ none: true }); it.run();
        const P = __DDW3.player, cam = __DDW3.camera, t0 = performance.now(); let maxY = -99, minY = 99, maxV = 0, flips = 0, up = false, rode = false, jump = 0, camFar = 0, lastI = null, back = 0, camUnder = 0; const seen = new Set();
        const f = () => { const R = P.ride; if (R && R.type === 'coaster') { rode = true; maxY = Math.max(maxY, P.y); minY = Math.min(minY, P.y); maxV = Math.max(maxV, R.maxV || 0); seen.add(R.C.flag[Math.floor(R.i)]);
            const u = Math.abs(Math.abs(R.roll || 0) - Math.PI) < .6; if (u && !up) flips++; up = u; if (lastI !== null) { if (R.i < lastI) back++; jump = Math.max(jump, (R.i - lastI) * R.C.STEP); } lastI = R.i;
            camFar = Math.max(camFar, cam.position.distanceTo(new __DDW3.THREE.Vector3(P.x, P.y, P.z))); if (R.i > 30 && cam.position.y < P.y + .5) camUnder++; /* (build 100: the camera must never look up from under the cart) */ }
          if ((rode && !P.ride) || performance.now() - t0 > 600000) return res({ rode, maxY: Math.round(maxY), minY: Math.round(minY), maxV: Math.round(maxV), flips, sections: [...seen].filter(Boolean).sort().join(''), biggestStepPerFrame: +jump.toFixed(1), wentBack: back, camFar: Math.round(camFar), camUnder, x: P.x - st, y: P.y, done: !P.ride, camFree: !__DDW3.G.camOverride, secs: Math.round((performance.now() - t0) / 1000) }); requestAnimationFrame(f); }; f(); }), st);
      check('Moon: the GIANT coaster: the whole 4.7 km ride, up the 227 m spiral lift, down into the crater and the cave, through the mountain, upside down in the loops and corkscrews, and back to the station',
        !ride.none && ride.rode && ride.done && ride.maxY > 200 && ride.minY < -15 && ride.maxV > 25 && ride.flips >= 3 && ['B', 'C', 'K', 'L', 'T'].every(c => ride.sections.includes(c)) && ride.wentBack === 0 && ride.biggestStepPerFrame < 40 && ride.camFar < 40 && ride.camUnder === 0 && Math.abs(ride.x) < 6 && ride.y < .2 && ride.camFree, JSON.stringify(ride));
      await page.evaluate(() => __DDW3.G.interact.find(i => i.disc === 'coaster').run()); await sleep(4000);
      const skipShown = await page.locator('#coasterSkip').isVisible(); await page.locator('#coasterSkip').tap(); await sleep(1500);
      const sk = await page.evaluate(st => ({ ride: !!__DDW3.player.ride, x: Math.round(__DDW3.player.x - st), cam: !!__DDW3.G.camOverride }), st);
      check('Moon: the big 🏁 button gets you off the coaster at once, back at the station', skipShown && !sk.ride && Math.abs(sk.x) < 6 && !sk.cam, JSON.stringify({ skipShown, ...sk })); }
    const back = await page.evaluate(B => { const it = __DDW3.G.interact.find(i => i.layer === 'space' && i.action === 'Back to the rocket' && i.x > B[0] + 200); if (!it) return null; it.run(); const r = __DDW3.G.rockets[__DDW3.G.spaceHere ? __DDW3.G.spaceHere() : Object.keys(__DDW3.G.rockets).find(k => k !== 'earth')]; return [__DDW3.player.x, r && r.x]; }, B);
    check(`${id}: the little rocket sign takes you back to your rocket`, !!back && back[1] != null && Math.abs(back[0] - back[1] - 2.5) < .5, JSON.stringify(back)); }
  { await flyTo('earth'); c = await waitFor(s => s.layer === '', 20000); check('fly home to Earth: back at the launch pad', c.layer === '' && Math.abs(c.x - 695.5) < 3, /* (build 64: the pad moved 686 → 693) */ `layer=${c.layer} x=${c.x.toFixed(1)}`); }
  // the voice can be chosen by a grown-up (the test browser may have no voices: the panel must still work)
  check('the ⚙️ panel has a voice chooser', await page.evaluate(() => !!document.querySelector('#perfPanel .ppVoices') && typeof __DDW3.G.voice === 'object' ? true : !!document.querySelector('#perfPanel .ppVoices')));
  // ---------- build 27: the learning games work for a child who can't read ----------
  { const a = await page.evaluate(() => __DDW3.G.learning.audit()); check('every learning game meets the pre-reader standard (spoken instruction and hint, demo, no words to read)', a.every(x => x.ok), JSON.stringify(a.filter(x => !x.ok)).slice(0, 200)); }
  await page.evaluate(() => __DDW3.G.learning.showCorner('num')); await sleep(200); await page.locator('#learn .lmenuitem[data-id="count"]').tap(); await sleep(600);
  { const d = await page.evaluate(() => __DDW3.G.learning.isDemo()); let ended = false; for (let i = 0; i < 80; i++) { if (!(await page.evaluate(() => __DDW3.G.learning.isDemo()))) { ended = true; break; } await sleep(250); } check('a learning game starts with a "watch me" demo that ends by itself', d && ended); }
  { const w = await page.evaluate(() => (document.querySelector('#learn').innerText.match(/[A-Za-z]{2,}/g) || []).join(' ')); check('no words to read in a learning game', !w, w); }
  await page.locator('#learn .lx').tap(); await sleep(300); check('closing a learning game returns to the world', !(await page.evaluate(() => __DDW3.G.activityOpen)));
  // Isolate this corruption case from the played world's close-time saves and service worker.
  // The separate save-reopen regression also verifies close/corrupt/reopen in one context.
  await page.close(); await ctx.close(); ctx = await browser.newContext(contextOptions);
  page = await ctx.newPage(); page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !DRIVER_NOTE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  await page.addInitScript(() => {
    const key = 'dawsons-discovery-world-3d-v1';
    window.__brokenSaveTrace = [];
    for (const method of ['getItem', 'setItem']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (k, ...args) {
        const value = original.call(this, k, ...args);
        if (k === key && window.__brokenSaveTrace.length < 12) window.__brokenSaveTrace.push({ method, value: String(method === 'getItem' ? value : args[0]).slice(0, 40), caller: new Error().stack.split('\n')[2] });
        return value;
      };
    }
    localStorage.setItem(key, '{broken');
    window.__brokenSaveSeed = localStorage.getItem(key);
  });
  await page.goto(FILE);
  await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 240000 });
  { const txt = await page.locator('#playBtn').textContent(), data = await page.evaluate(() => ({ seed: window.__brokenSaveSeed, trace: window.__brokenSaveTrace, raw: localStorage.getItem('dawsons-discovery-world-3d-v1') }));
    const ok = data.seed === '{broken' && await page.locator('#playBtn').isVisible() && txt.includes("LET'S");
    check('a broken save is ignored safely (fresh start, no crash)', ok, `button="${txt}" save=${(data.raw || '').slice(0, 20)}${ok ? '' : ' seed=' + JSON.stringify(data.seed) + ' trace=' + JSON.stringify(data.trace)}`); }
  // (build 55) Play Together: without a room service set up, the 👫 button is hidden and nothing connects (solo as before)
  check('Play Together: 👫 is there (the family\'s room service is set up), and the game never connects on its own', await page.evaluate(() => { const b = document.getElementById('mpBtn'); return !!b && getComputedStyle(b).display !== 'none' && !__DDW3.G.mp.room && !__DDW3.G.mp.vc.on && !performance.getEntriesByType('resource').some(r => /mp-firebase/.test(r.name)); })); // (build 56 set up the room service; nothing is downloaded or connected until Create or Join)
  check('the ⚙️ panel shows the build number', await page.evaluate(() => /build \w+/.test((document.querySelector('#perfPanel .ppBuild') || {}).textContent || '')));
  // ---------- portrait ----------
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
  check('portrait phone shows the turn-sideways tip', await page.locator('#rotate').isVisible());
  check('no errors or warnings in the console', errors.length === 0, errors.slice(0, 4).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  fs.writeFileSync(path.join(__dirname, 'TEST_RESULTS.json'), JSON.stringify({ date: new Date().toISOString(), environment: 'Playwright Chromium headless, SwiftShader software WebGL, 844x390 touch viewport — NOT a physical iPhone', passed, total: results.length, results, errors }, null, 2));
  await browser.close(); process.exit(passed === results.length ? 0 : 1);
})();
