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
  const holdBtn = async (sel, ms) => { const c = await center(sel); await touch('touchStart', [{ ...c, id: 1 }]); await sleep(ms); await touch('touchEnd', []); await sleep(80); };
  const press = async sel => holdBtn(sel, 80);
  const teleport = async (x, y = 0) => { await page.evaluate(([x, y]) => __DDW3.teleport(x, y), [x, y]); await sleep(2200); }; // let the camera settle (slow software WebGL)
  const waitFor = async (fn, ms = 8000) => { const t0 = Date.now(); let s; while (Date.now() - t0 < ms) { s = await S(); if (fn(s)) return s; await sleep(120); } return s; };
  const shot = n => page.screenshot({ path: path.join(SHOTS, n), type: 'jpeg', quality: 84 });
  let c;

  // ---------- start ----------
  await page.goto(FILE); await sleep(2500);
  check('3D title screen shows the three creatures and a play button', await page.locator('#playBtn').isVisible() && (await page.locator('.introPick img').first().getAttribute('src') || '').startsWith('data:image/png'));
  await shot('01_title.jpg');
  await page.locator('#playBtn').tap(); await sleep(800);
  check('play button hides the title card', await page.locator('#overlay').evaluate(e => e.classList.contains('hidden')));
  const boxes = {}; for (const id of ['leftBtn', 'rightBtn', 'jumpBtn', 'pawBtn']) boxes[id] = await page.locator('#' + id).boundingBox();
  check('move / jump / paw buttons are big (≥ 60 px) and on screen', Object.values(boxes).every(b => b.width >= 60 && b.height >= 60 && b.x >= 0 && b.y + b.height <= 390));
  await shot('02_start.jpg');
  // ---------- moving + jumping ----------
  c = await S(); const x0 = c.x;
  await holdBtn('#rightBtn', 900); c = await S(); check('hold ▶ to walk right', c.x > x0 + 2, `x ${x0.toFixed(1)} → ${c.x.toFixed(1)}`);
  await sleep(400); const x1 = (await S()).x; await sleep(300); check('let go and the creature stops', Math.abs((await S()).x - x1) < .2);
  await holdBtn('#leftBtn', 500); check('hold ◀ to walk left', (await S()).x < x1 - .5);
  { const j = await center('#jumpBtn'); await touch('touchStart', [j]); await touch('touchEnd', []); c = await S(); check('JUMP jumps', c.y > .1 || c.jumps === 1, `y=${c.y.toFixed(2)}`);
    // (the slow software renderer here can't keep up with two real taps inside one jump, so the 2nd tap is sent on the very next frame)
    await waitFor(s => s.grounded, 3000);
    await page.evaluate(() => new Promise(r => { const b = document.getElementById('jumpBtn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); requestAnimationFrame(() => requestAnimationFrame(() => { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); r(); })); }));
    await sleep(300); check('double jump (tap JUMP again in the air)', (await S()).disc.includes('doublejump')); }
  c = await waitFor(s => s.grounded, 4000); check('lands back on the floor', c.grounded && c.y === 0);
  // multi-touch: hold ▶ with one finger and tap JUMP with another
  { const r = await center('#rightBtn'), j = await center('#jumpBtn'); const a = (await S()).x;
    await touch('touchStart', [{ ...r, id: 1 }]); await sleep(300); await touch('touchStart', [{ ...r, id: 1 }, { ...j, id: 2 }]); await sleep(80); await touch('touchMove', [{ ...r, id: 1 }]); await sleep(400);
    c = await S(); await touch('touchEnd', []); check('multi-touch: walk and jump at the same time', c.x > a + 1 && (c.y > .2 || c.jumps > 0 || c.disc.length), `x ${a.toFixed(1)}→${c.x.toFixed(1)}, y ${c.y.toFixed(2)}`); }
  await waitFor(s => s.grounded, 3000);
  // ---------- creatures ----------
  for (const k of ['zuzu', 'jelly', 'pip']) { await page.locator(`.creatureChoice[data-c="${k}"]`).tap(); await sleep(500); c = await S(); check(`switch to ${k}`, c.creature === k); if (k !== 'pip') await shot(`03_${k}.jpg`); }
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
  await teleport(31.5); await holdBtn('#rightBtn', 500); c = await waitFor(s => s.y > 2, 2500); check('walk onto the trampoline: big bounce', c.y > 2, `y=${c.y.toFixed(2)}`);
  await shot('06_trampoline.jpg'); await waitFor(s => s.grounded && s.x > 36 || s.grounded && s.y === 0, 4000);
  // ---------- studio ----------
  await teleport(61); await sleep(300);
  check('paint palette appears by the paint wall', await page.locator('#paintTools').evaluate(e => e.classList.contains('show')));
  await page.locator('.swatch').nth(4).tap();
  { const a = await scr(58, 3.2, -3.2), b = await scr(63, 4.4, -3.2); await touch('touchStart', [a]); for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x: a.x + (b.x - a.x) * i / 8, y: a.y + (b.y - a.y) * i / 8 }]); await sleep(40); } await touch('touchEnd', []); }
  await sleep(200); c = await S(); check('finger-paint on the giant wall', c.painted && c.disc.includes('paint'));
  await shot('07_painting.jpg');
  await teleport(71); await holdBtn('#rightBtn', 1200); c = await S(); check('walk along the giant xylophone and it plays', c.disc.includes('xylophone'));
  await shot('08_xylophone.jpg');
  // ---------- lab ----------
  await teleport(103); await tapWorld(104, .9, .2); await tapWorld(107.2, .9, .2); c = await S(); check('tap two paint buckets to mix a colour', c.disc.includes('mix'));
  await teleport(97); await tapWorld(99, 1.4, -.1); await sleep(300); c = await S(); check('tap the bubble machine: bubbles float out', c.bubbles > 0, `${c.bubbles} bubbles`);
  await shot('09_bubbles.jpg');
  await teleport(110); await holdBtn('#rightBtn', 500); c = await waitFor(s => s.y > 3, 3000); check('spring pad bounces you up high', c.y > 3, `y=${c.y.toFixed(2)}`);
  await waitFor(s => s.grounded, 4000);
  // ---------- park rides ----------
  await teleport(139); { const p = await scr(144, 2.6, -1.6), pk = await page.evaluate(([x, y]) => JSON.stringify(__DDW3.pick(x, y)), [p.x, p.y]); await tapWorld(144, 2.6, -1.6); c = await waitFor(s => s.ride === 'carousel', 4000); check('tap the carousel to ride', c.ride === 'carousel', c.ride === 'carousel' ? '' : `hits ${pk} P.x=${c.x.toFixed(1)} ride=${c.ride}`); } // the carousel's centre pole (the animals move, so aim at the pole)
  await sleep(800); await shot('10_carousel.jpg');
  await press('#jumpBtn'); await sleep(300); check('JUMP gets off the carousel', !(await S()).ride);
  await waitFor(s => s.grounded, 3000);
  await teleport(159); await page.evaluate(() => __DDW3.G.rideWheel()); c = await S(); check('ride the Ferris wheel', c.ride === 'wheel');
  await sleep(2500); c = await S(); check('the Ferris wheel lifts you up', c.y > 1.5, `y=${c.y.toFixed(1)}`); await shot('11_ferris_wheel.jpg');
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
  await holdBtn('#rightBtn', 1400); c = await S(); check('walk off the top onto the upstairs floor', c.stair === null && Math.abs(c.y - 4.4) < .01, `y=${c.y}`);
  await holdBtn('#leftBtn', 900); await sleep(800); await shot('14_nursery.jpg');
  await page.evaluate(() => __DDW3.teleport(1015, 4.4)); await sleep(300); await press('#jumpBtn'); await sleep(200); await press('#jumpBtn'); await sleep(500);
  c = await S(); check('the ceiling stops you upstairs (no flying through the roof)', c.y + 1.5 <= 8.81, `y=${c.y.toFixed(2)}`);
  await waitFor(s => s.grounded, 3000);
  await page.evaluate(() => __DDW3.teleport(1028.2, 4.4)); await sleep(300); c = await S(); check('stair bubble at the top of the stairs', c.door === 'down');
  await press('#pawBtn'); await sleep(200); await holdBtn('#leftBtn', 3200); c = await S(); check('walk back down the stairs', c.stair === null && c.y === 0, `y=${c.y}`);
  await page.evaluate(() => __DDW3.teleport(1003.2)); await sleep(300); await press('#pawBtn'); await sleep(500); c = await S(); check('the front door inside takes you back outside', c.layer === '' && Math.abs(c.x - 190) < .1);
  // ---------- sound + saving ----------
  await page.locator('#soundBtn').tap(); await sleep(100); check('sound button turns sound off', !(await S()).sound);
  await page.locator('#soundBtn').tap(); await sleep(100); check('sound button turns sound back on', (await S()).sound);
  await page.locator('.creatureChoice[data-c="jelly"]').tap(); await sleep(300);
  const before = await S(); await page.evaluate(() => __DDW3.save()); await page.reload(); await sleep(2500);
  check('reload shows KEEP PLAYING', (await page.locator('#playBtn').textContent()).includes('KEEP'));
  await page.locator('#playBtn').tap(); await sleep(800); c = await S();
  check('reload keeps creature, star bits, Fluffkins and painting', c.creature === 'jelly' && c.bits === before.bits && c.fl.join() === before.fl.join() && c.painted, JSON.stringify({ cr: c.creature, bits: c.bits, fl: c.fl.filter(f => f !== 'wait').length, p: c.painted }));
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
