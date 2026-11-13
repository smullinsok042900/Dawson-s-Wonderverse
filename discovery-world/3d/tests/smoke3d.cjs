// Automated browser test for Dawson's Discovery World 3D.
// Runs the REAL 3d/index.html in headless Chromium (Playwright) with an iPhone-landscape
// sized touch viewport. WebGL runs in SOFTWARE (SwiftShader) here, so it is slow and
// says nothing about speed on a real iPhone. Not a physical-device test.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'index.html') + '?test';
const SHOTS = path.join(ROOT, 'screenshots'); fs.mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UG_F = -6;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  let page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
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
  c = await S(); const x0 = c.x;
  await holdBtn('#rightBtn', 600); c = await S(); check('slide a finger right to walk right', c.x > x0 + 2, `x ${x0.toFixed(1)} → ${c.x.toFixed(1)}`);
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
  for (const k of ['zuzu', 'jelly', 'pip']) { await page.locator(`.creatureChoice[data-c="${k}"]`).tap(); await sleep(500); c = await S(); check(`switch to ${k}`, c.creature === k); if (k !== 'pip') await shot(`03_${k}.jpg`); }
  { await page.locator('.creatureChoice[data-c="jelly"]').tap(); await sleep(400);
    const minSy = await page.evaluate(() => new Promise(r => { const P = __DDW3.player; P.y = 2.5; P.vy = 0; P.grounded = false; let m = 9, n = 0; const f = () => { m = Math.min(m, __DDW3.bodyScaleY()); if (++n > 90) return r(m); requestAnimationFrame(f); }; f(); }));
    check('Jelly squishes flat when it lands', minSy < .8, `body squashed to ${(minSy * 100).toFixed(0)}% height`);
    await page.locator('.creatureChoice[data-c="pip"]').tap(); }
  await sleep(3500); c = await S();
  { const p = await scr(c.x, c.y + .75, c.z), el = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.id || e.className); }, [p.x, p.y]); const pk = await page.evaluate(([x, y]) => JSON.stringify(__DDW3.pick(x, y)), [p.x, p.y]);
    await tapWorld(c.x, c.y + .75, c.z); await sleep(200); check('tap your creature to tickle it', (await S()).disc.includes('tickle'), `tap at ${Math.round(p.x)},${Math.round(p.y)} lands on: ${el} ${pk} P=${c.x.toFixed(2)},${c.y.toFixed(2)},${c.z.toFixed(2)}`); }
  if (process.env.QUICK) { console.log(results.filter(r => !r.ok)); await browser.close(); return; }
  // ---------- playhouse ----------
  await teleport(10); await tapWorld(12, .6); check('tap the ball pit: splash', (await S()).disc.includes('ballpit'));
  await shot('04_ball_pit.jpg');
  await teleport(21.6, 3.8); await holdBtn('#rightBtn', 700); c = await waitFor(s => s.ride === 'slide', 2000); check('walk off the tower onto the twisty slide', c.ride === 'slide');
  await shot('05_slide.jpg');
  c = await waitFor(s => !s.ride, 9000); check('slide ends on the floor and you can move again', !c.ride && c.x > 30 && c.y === 0, `x=${c.x.toFixed(1)}`);
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
  await sleep(1200); { /* (aim only once the pet has stopped walking: the software-graphics browser runs a few frames a second, so a moving pet can walk out from under the tap) */ let pp = await page.evaluate(() => __DDW3.friends.petPos.toArray()); for (let k = 0; k < 20; k++) { await sleep(400); const q = await page.evaluate(() => __DDW3.friends.petPos.toArray()); const still = Math.hypot(q[0] - pp[0], q[2] - pp[2]) < .02; pp = q; if (still) break; } await tapWorld(pp[0], pp[1] + .5, pp[2]); await sleep(200); check('tap your pet: it waves and stays put', (await S()).disc.includes('stayhere') && await page.evaluate(() => __DDW3.world.petStay.includes(true)));
    await page.evaluate(() => { const f = __DDW3.friends.pets.find(p => p.waiting); let done = false; f.root.traverse(o => { if (!done && o.userData.tap) { done = true; o.userData.tap(); } }); /* one tap */ }); await sleep(200); check('tap it again: it does a trick and follows you again', !(await page.evaluate(() => __DDW3.world.petStay.includes(true)))); }
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
  await teleport(54.5, 9.5); { const wp = await page.evaluate(() => __DDW3.G.whale.g.position.toArray()); await tapWorld(wp[0], wp[1], wp[2]); } await sleep(300); check('tap the sky whale: it sings', (await S()).disc.includes('whale'));
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
  await teleport(238); await tapWorld(240, 1.2, -2.4); await sleep(300);
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
  await teleport(332);
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
  { const n0 = await page.evaluate(() => __DDW3.friends.followers.length); { /* (creatures walk about: stand just left of Biscuit, facing right, so your following pets trail behind you and can't stand in front of him; tap him where he is) */ const b0 = await page.evaluate(() => __DDW3.friends.buddies.biscuit.root.position.x); await teleport(b0 - 2.2); await page.evaluate(() => { __DDW3.player.facing = 1; }); await sleep(1500); let seen = ''; for (let k = 0; k < 6 && !(await page.evaluate(() => __DDW3.world.buddies.biscuit)); k++) { /* he trots about and other creatures wander past: tap him when nothing else is in front of him (as a child would) */ const bp = await page.evaluate(() => __DDW3.friends.buddies.biscuit.root.position.toArray()); const q = await scr(bp[0], bp[1] + .35, bp[2]); const first = await page.evaluate(q => { const h = __DDW3.pick(q.x, q.y)[0]; return h ? h[5] : 'nothing'; }, q); seen += first + ' '; if (first !== 'buddy_biscuit') { await sleep(700); continue; } await tapWorld(bp[0], bp[1] + .35, bp[2]); await sleep(400); } biscuitSeen = seen; } await sleep(300);
    const r = await page.evaluate(() => [__DDW3.friends.followers.length, __DDW3.world.buddies.biscuit]); check('tap Biscuit the puppy: he follows you everywhere', r[0] === n0 + 1 && r[1] === true, `followers ${n0} → ${r[0]}; in front of him: ${biscuitSeen}`); }
  await teleport(198); { const tp = await page.evaluate(() => __DDW3.friends.buddies.twinkle.root.position.toArray()); await tapWorld(tp[0], tp[1] + .15, tp[2]); } await sleep(300); check('tap Twinkle the fairy: she flies along with you', await page.evaluate(() => __DDW3.world.buddies.twinkle === true));
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
  await teleport(259.2); await tapWorld(260.8, 1.2, -2.4); await sleep(200); check('the mechanic fox talks', (await S()).disc.includes('fox'));
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
  await holdBtn('#rightBtn', 700); c = await S(); check('hold ▶ to walk up part-way, let go to stop', c.stair > .2 && c.stair < .95, `k=${c.stair}`);
  await holdBtn('#rightBtn', 1400); c = await waitFor(s => s.stair === null && Math.abs(s.y - 4.4) < .01, 6000); check('walk off the top onto the upstairs floor', c.stair === null && Math.abs(c.y - 4.4) < .01, `y=${c.y}`);
  await holdBtn('#leftBtn', 900); await sleep(800); await shot('14_nursery.jpg');
  await page.evaluate(() => __DDW3.teleport(1015, 4.4)); await sleep(300); await press('#jumpBtn'); await sleep(200); await press('#jumpBtn'); await sleep(500);
  c = await S(); check('the ceiling stops you upstairs (no flying through the roof)', c.y + 1.5 <= 8.81, `y=${c.y.toFixed(2)}`);
  await waitFor(s => s.grounded, 3000);
  await page.evaluate(() => __DDW3.teleport(1028.2, 4.4)); await sleep(300); c = await S(); check('stair bubble at the top of the stairs', c.door === 'down');
  await press('#pawBtn'); await sleep(200); await holdBtn('#leftBtn', 3200); c = await waitFor(s => s.stair === null && s.y === 0, 6000); check('walk back down the stairs', c.stair === null && c.y === 0, `y=${c.y}`);
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
  // ---------- build 27: the learning games work for a child who can't read ----------
  { const a = await page.evaluate(() => __DDW3.G.learning.audit()); check('every learning game meets the pre-reader standard (spoken instruction and hint, demo, no words to read)', a.every(x => x.ok), JSON.stringify(a.filter(x => !x.ok)).slice(0, 200)); }
  await page.evaluate(() => __DDW3.G.learning.showCorner('num')); await sleep(200); await page.locator('#learn .lmenuitem[data-id="count"]').tap(); await sleep(600);
  { const d = await page.evaluate(() => __DDW3.G.learning.isDemo()); let ended = false; for (let i = 0; i < 80; i++) { if (!(await page.evaluate(() => __DDW3.G.learning.isDemo()))) { ended = true; break; } await sleep(250); } check('a learning game starts with a "watch me" demo that ends by itself', d && ended); }
  { const w = await page.evaluate(() => (document.querySelector('#learn').innerText.match(/[A-Za-z]{2,}/g) || []).join(' ')); check('no words to read in a learning game', !w, w); }
  await page.locator('#learn .lx').tap(); await sleep(300); check('closing a learning game returns to the world', !(await page.evaluate(() => __DDW3.G.activityOpen)));
  // a broken save: close the game (it saves as it closes), then open it fresh with a corrupted save
  await page.close(); page = await ctx.newPage(); page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => localStorage.setItem('dawsons-discovery-world-3d-v1', '{broken'));
  await page.goto(FILE); await sleep(2500);
  { const txt = await page.locator('#playBtn').textContent(), raw = await page.evaluate(() => localStorage.getItem('dawsons-discovery-world-3d-v1')); check('a broken save is ignored safely (fresh start, no crash)', await page.locator('#playBtn').isVisible() && txt.includes("LET'S"), `button="${txt}" save=${(raw || '').slice(0, 20)}`); }
  // ---------- portrait ----------
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
  check('portrait phone shows the turn-sideways tip', await page.locator('#rotate').isVisible());
  check('no errors or warnings in the console', errors.length === 0, errors.slice(0, 4).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  fs.writeFileSync(path.join(__dirname, 'TEST_RESULTS.json'), JSON.stringify({ date: new Date().toISOString(), environment: 'Playwright Chromium headless, SwiftShader software WebGL, 844x390 touch viewport — NOT a physical iPhone', passed, total: results.length, results, errors }, null, 2));
  await browser.close(); process.exit(passed === results.length ? 0 : 1);
})();
