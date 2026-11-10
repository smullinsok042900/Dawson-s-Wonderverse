// Automated browser test for Dawson's Discovery World.
// Runs the REAL index.html in Chromium (Playwright) with an iPhone-landscape sized touch viewport.
// Usage: node tests/smoke.cjs [path/to/index.html]
// Writes tests/TEST_RESULTS.json and screenshots/*.png.
// NOTE: this is desktop Chromium emulating a phone size + touch. It is NOT a real iPhone/Safari test.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const FILE = 'file://' + path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const SHOTS = path.join(ROOT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const GROUND_Y = 450;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const cdp = await ctx.newCDPSession(page);
  const S = () => page.evaluate(() => { const D = __DDW, P = D.player; return { x: P.x, y: P.y, vx: P.vx, vy: P.vy, grounded: P.grounded, jumps: P.jumps, creature: P.creature, ride: P.ride ? P.ride.type : null, launched: P.launched, disc: [...D.world.discoveries], strokes: D.world.strokes.length, portions: D.world.portions.slice(), lastMix: D.world.lastMix, tank: { ...D.world.tank }, battery: D.world.battery.length, labOn: D.world.labOn, powered: D.world.powered, bubbles: D.world.bubbles.length, colored: D.world.bubbles.filter(b => b.color).length, keys: { ...D.keys }, sound: D.Sound.on, stars: D.world.stars.size, bits: D.world.bits, hoops: D.world.hoops, fl: D.world.discoveries.has('fluffkin') ? 1 : 0, under: !!P.under, inside: P.inside || null, pet: !!D.world.pet, blocks: D.world.build.filter(Boolean).length }; });
  const scr = (x, y) => page.evaluate(([x, y]) => __DDW.toScreen(x, y), [x, y]);
  const center = async sel => { const b = await page.locator(sel).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p.x, y: p.y, id: p.id ?? i + 1, radiusX: 8, radiusY: 8, force: 1 })) });
  const tapWorld = async (x, y) => { const p = await scr(x, y); await page.touchscreen.tap(p.x, p.y); };
  const holdBtn = async (sel, ms) => { const c = await center(sel); await touch('touchStart', [{ ...c, id: 1 }]); await sleep(ms); await touch('touchEnd', []); };
  const teleport = async x => { await page.evaluate(x => __DDW.teleport(x), x); await sleep(450); };
  const waitFor = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await S(); if (fn(s)) return s; await sleep(100); } return S(); };

  // ---------- 1. launch ----------
  await page.goto(FILE); await sleep(700);
  check('title screen shows with play button', await page.locator('#playBtn').isVisible());
  await page.screenshot({ path: path.join(SHOTS, '01_title_screen.jpg'), type: 'jpeg', quality: 82 });
  await page.locator('#playBtn').tap(); await sleep(600);
  check('start button hides the overlay', await page.locator('#overlay').isHidden());
  // ---------- 2. layout: controls on screen, not overlapping each other ----------
  const boxes = {};
  for (const id of ['leftBtn', 'rightBtn', 'jumpBtn', 'pawBtn', 'chooser', 'soundBtn', 'discoveries']) boxes[id] = await page.locator('#' + id).boundingBox();
  const inView = Object.values(boxes).every(b => b.x >= 0 && b.y >= 0 && b.x + b.width <= 844 && b.y + b.height <= 390);
  const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const ids = Object.keys(boxes); let anyOverlap = false;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (ids[i] !== 'chooser' || ids[j] !== 'soundBtn') if (overlap(boxes[ids[i]], boxes[ids[j]])) anyOverlap = ids[i] + '/' + ids[j];
  check('HUD buttons fully on screen at 844x390', inView);
  check('HUD buttons do not overlap', !anyOverlap, anyOverlap || '');
  check('move/jump/paw buttons are big tap targets (≥ 60px)', ['leftBtn', 'rightBtn', 'jumpBtn', 'pawBtn'].every(k => boxes[k].width >= 60 && boxes[k].height >= 60), JSON.stringify(['leftBtn', 'rightBtn', 'jumpBtn', 'pawBtn'].map(k => [Math.round(boxes[k].width), Math.round(boxes[k].height)])));
  await page.screenshot({ path: path.join(SHOTS, '02_start_playhouse.jpg'), type: 'jpeg', quality: 82 });

  // ---------- 3. movement (real touch hold) ----------
  let s0 = await S(); await holdBtn('#rightBtn', 1200); let s1 = await S();
  check('hold RIGHT moves continuously', s1.x - s0.x > 250, `moved ${Math.round(s1.x - s0.x)} units`);
  await sleep(400); const s1b = await S();
  check('releasing RIGHT stops the creature', Math.abs(s1b.vx) < 5 && !s1b.keys.right, `vx=${s1b.vx.toFixed(1)}`);
  await teleport(1300);
  s0 = await S(); await holdBtn('#leftBtn', 900); s1 = await S();
  check('hold LEFT moves continuously', s0.x - s1.x > 180, `moved ${Math.round(s0.x - s1.x)} units`);
  // ---------- 4. jump + double jump ----------
  await teleport(1300);
  const jb = await center('#jumpBtn');
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(150);
  const sj1 = await S(); check('JUMP leaves the ground', sj1.y < 440 && sj1.jumps === 1, `y=${sj1.y.toFixed(0)} jumps=${sj1.jumps}`);
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(120);
  const sj2 = await S(); check('second JUMP in mid-air = double jump', sj2.jumps === 2 && sj2.disc.includes('doublejump'), `jumps=${sj2.jumps}`);
  await page.screenshot({ path: path.join(SHOTS, '03_double_jump.jpg'), type: 'jpeg', quality: 82 });
  const sj3 = await waitFor(s => s.grounded, 3000); check('lands again after jumping', sj3.grounded);
  // ---------- 5. multi-touch: hold RIGHT with one finger while tapping the world with another ----------
  await teleport(1200);
  const rb = await center('#rightBtn');
  await touch('touchStart', [{ ...rb, id: 1 }]); await sleep(300);
  const pit = await scr(LAYOUT_X(1300), 300);
  await touch('touchStart', [{ ...rb, id: 1 }, { ...pit, id: 2 }]); await sleep(60); await touch('touchMove', [{ ...rb, id: 1 }]);
  await sleep(300); const mt = await S(); await touch('touchEnd', []); await sleep(100);
  check('multi-touch: movement keeps going while another finger taps', mt.keys.right && mt.vx > 200, `vx=${mt.vx.toFixed(0)}`);
  // ---------- 6. creature selection + rigs in motion ----------
  for (const [i, kind] of ['zuzu', 'jelly', 'pip'].entries()) {
    await page.locator(`.creatureChoice[data-creature="${kind}"]`).tap(); await sleep(200);
    const s = await S(); check(`select ${kind}`, s.creature === kind);
    await teleport(560); const r = await center('#rightBtn'); await touch('touchStart', [{ ...r, id: 1 }]); await sleep(450);
    await page.screenshot({ path: path.join(SHOTS, `04_${kind}_running.jpg`), type: 'jpeg', quality: 82 });
    await touch('touchEnd', []);
    await sleep(500);
  }
  // ---------- 7. tickle the creature ----------
  await teleport(1300); let sp = await S();
  await tapWorld(sp.x, sp.y - 70); await sleep(200);
  check('tapping the creature makes it react', (await S()).disc.includes('tickle'));
  // ---------- 8. drag + throw a ball ----------
  await teleport(1550);
  const ball = await page.evaluate(() => { const b = __DDW.balls[4]; return { x: b.x, y: b.y }; });
  const bp = await scr(ball.x, ball.y), bp2 = await scr(ball.x + 120, ball.y - 160);
  await touch('touchStart', [{ ...bp, id: 5 }]);
  for (let k = 1; k <= 8; k++) { await touch('touchMove', [{ x: bp.x + (bp2.x - bp.x) * k / 8, y: bp.y + (bp2.y - bp.y) * k / 8, id: 5 }]); await sleep(16); }
  await touch('touchEnd', []); await sleep(50);
  const ballAfter = await page.evaluate(() => { const b = __DDW.balls[4]; return { x: b.x, y: b.y, vx: b.vx, vy: b.vy }; });
  check('dragging a ball moves it and throws it', ballAfter.x - ball.x > 80 && Math.hypot(ballAfter.vx, ballAfter.vy) > 100, `dx=${Math.round(ballAfter.x - ball.x)} v=${Math.round(Math.hypot(ballAfter.vx, ballAfter.vy))}`);
  // ---------- 9. painting ----------
  await teleport(1700); await sleep(300);
  check('paint palette appears near the wall', await page.locator('#paintTools').evaluate(e => e.classList.contains('show')));
  const strokesBefore = (await S()).strokes;
  const colors = ['#ffc544', '#49d6e6', '#9d73ff'];
  for (const [k, c] of colors.entries()) {
    await page.locator(`.swatch[data-color="${c}"]`).tap();
    const a = await scr(1460 + k * 150, 170 + k * 50);
    await touch('touchStart', [{ ...a, id: 6 }]);
    for (let i = 1; i <= 12; i++) { const q = await scr(1460 + k * 150 + i * 14, 170 + k * 50 + Math.sin(i / 2) * 40); await touch('touchMove', [{ ...q, id: 6 }]); }
    await touch('touchEnd', []);
  }
  const sPaint = await S();
  check('painting adds strokes on the wall', sPaint.strokes - strokesBefore === 3, `${sPaint.strokes - strokesBefore} new strokes`);
  await page.screenshot({ path: path.join(SHOTS, '05_painting_wall.jpg'), type: 'jpeg', quality: 82 });
  // painting is woven through the whole world: the easel out by the carousel works too
  await teleport(5900); await sleep(300);
  check('paint palette also appears at the park easel', await page.locator('#paintTools').evaluate(e => e.classList.contains('show')));
  { const a = await scr(5925, 250); await touch('touchStart', [{ ...a, id: 7 }]); for (let i = 1; i <= 10; i++) { const q = await scr(5925 + i * 11, 250 + Math.sin(i) * 30); await touch('touchMove', [{ ...q, id: 7 }]); } await touch('touchEnd', []); }
  const easelStrokes = await page.evaluate(() => __DDW.world.strokes.filter(s => s.s === 2).length);
  // stickers
  await page.locator('.stk[data-sticker="heart"]').tap(); await tapWorld(6010, 240);
  await page.locator('.stk[data-sticker="star"]').tap(); await tapWorld(5960, 300);
  let stk = await page.evaluate(() => __DDW.world.stickers.map(k => k.k).join(','));
  check('stamp heart + star stickers on the easel', stk === 'heart,star', stk);
  await page.locator('#undoBtn').tap(); await sleep(50);
  stk = await page.evaluate(() => __DDW.world.stickers.map(k => k.k).join(','));
  check('undo removes the most recent thing (the star sticker)', stk === 'heart', stk);
  await page.locator('.swatch[data-color="#fb5aaf"]').tap();
  check('finger-painting on the park easel', easelStrokes === 1, `${easelStrokes} stroke(s) on easel`);
  await page.screenshot({ path: path.join(SHOTS, '05b_painting_park_easel.jpg'), type: 'jpeg', quality: 82 });
  // ---------- 10. trampoline ----------
  await teleport(560);
  await holdBtn('#rightBtn', 550);
  const tr = await waitFor(s => s.disc.includes('trampoline'), 1500);
  check('walking onto the trampoline bounces you up', tr.disc.includes('trampoline'));
  await sleep(250); await page.screenshot({ path: path.join(SHOTS, '06_trampoline_bounce.jpg'), type: 'jpeg', quality: 82 });
  // ---------- 11. slide ----------
  await waitFor(s => s.grounded, 3000);
  await teleport(860); // (the trampoline can now land you on the high beam)
  await tapWorld(1000, 360); await sleep(150);
  let sl = await S(); check('tapping the slide starts a slide ride', sl.ride === 'slide');
  await sleep(500); await page.screenshot({ path: path.join(SHOTS, '07_slide_ride.jpg'), type: 'jpeg', quality: 82 });
  sl = await waitFor(s => !s.ride, 4000); check('slide ends and you can move again', !sl.ride && sl.x > 1150, `x=${Math.round(sl.x)}`);

  let c;
  // ---------- 11b. Milestone 2: climbing net → beam → sky bridge → lookout star → zipline ----------
  await teleport(760); await page.evaluate(() => { const P = __DDW.player; P.y = 355; P.vy = 0; }); await sleep(250);
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(120);
  c = await S(); check('JUMP while touching the climbing net climbs it', c.ride === 'climb');
  await sleep(500); await page.screenshot({ path: path.join(SHOTS, '07b_climbing_net.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => !s.ride && s.grounded, 3000); check('climbing ends standing on the high beam', Math.abs(c.y - 213) < 1, `y=${Math.round(c.y)}`);
  await page.evaluate(() => __DDW.world.stars.delete('star7')); // the double-jump test (x≈1300) can already grab it
  const starsBefore = (await S()).stars;
  await holdBtn('#rightBtn', 1900);
  c = await S(); check('walk the sky bridge to the lookout and find secret star 7', c.stars === starsBefore + 1 && Math.abs(c.y - 213) < 1, `stars ${starsBefore}→${c.stars}, x=${Math.round(c.x)}`);
  await holdBtn('#rightBtn', 300);
  c = await waitFor(s => s.ride === 'zip', 1500); check('walking off the lookout grabs the zipline', c.ride === 'zip');
  await sleep(500); await page.screenshot({ path: path.join(SHOTS, '07c_zipline.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => !s.ride && s.grounded, 4000); check('zipline drops you by the paint mixer', c.x > 1980 && c.x < 2120, `x=${Math.round(c.x)}`);
  await teleport(2650); await tapWorld(2705, 380); await sleep(100);
  c = await S(); check('tap the engine ladder to climb it', c.ride === 'climb');
  c = await waitFor(s => !s.ride && s.grounded, 3000); check('ladder ends on the Wonder Engine walkway', Math.abs(c.y - 300) < 1, `y=${Math.round(c.y)}`);

  // ---------- 12. THE CHAIN: mix paint → pipe → colored bubbles → engine → power ----------
  await teleport(2190); await sleep(300);
  await tapWorld(2268, 196); await sleep(800);   // blue
  await tapWorld(2190, 188); await sleep(800);   // yellow
  c = await S(); check('tapping buckets pours paint into the bowl', c.portions.join('') === 'by', c.portions.join(','));
  await page.screenshot({ path: path.join(SHOTS, '08_mixing_paint.jpg'), type: 'jpeg', quality: 82 });
  await tapWorld(2190, 395); await sleep(1300);
  c = await S(); check('SPIN mixes a real new color (blue + yellow → green)', c.lastMix && /^#/.test(c.lastMix) && (() => { const n = parseInt(c.lastMix.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return g > r && g > b; })(), c.lastMix);
  c = await waitFor(s => s.tank.amount >= 2, 5000);
  check('paint flows through the pipe into the bubble tank', c.tank.amount === 2 && c.tank.color, JSON.stringify(c.tank));
  await teleport(2560); await sleep(200);
  await tapWorld(2548, 405); await sleep(250);
  c = await S(); check('bubble machine blows bubbles in the mixed color', c.colored >= 6, `${c.colored} colored bubbles`);
  await page.screenshot({ path: path.join(SHOTS, '09_colored_bubbles.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => s.battery >= 4, 9000);
  check('colored bubbles float into the funnel and charge the battery', c.battery >= 4, `battery ${c.battery}/6`);
  if (c.battery < 6) { await tapWorld(2548, 405); c = await waitFor(s => s.battery >= 6, 9000); }
  check('battery fills to 6', c.battery === 6, `battery ${c.battery}/6`);
  await teleport(2950); await sleep(200);
  await tapWorld(3046, 400); await sleep(400);
  c = await S(); check('lever ON with full battery = POWER', c.labOn && c.powered);
  await sleep(500); await page.screenshot({ path: path.join(SHOTS, '10_engine_powered.jpg'), type: 'jpeg', quality: 82 });
  // magnet
  await teleport(3310); await tapWorld(3310, 225); await sleep(1500);
  const mag = await page.evaluate(() => __DDW.balls.filter(b => b.metal).map(b => Math.hypot(b.x - 3310, b.y - 342)));
  check('magnet ON pulls the metal balls to it', mag.every(d => d < 90), mag.map(Math.round).join(','));
  await page.screenshot({ path: path.join(SHOTS, '11_magnet.jpg'), type: 'jpeg', quality: 82 });
  // launcher (only works when powered)
  await teleport(3450); await holdBtn('#rightBtn', 500);
  c = await waitFor(s => s.launched, 2500); check('powered Star Launcher launches you', c.launched);
  await sleep(350); await page.screenshot({ path: path.join(SHOTS, '12_launch.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => s.grounded && !s.launched, 3000); check('launch flies you across the park', c.x > 3950, `landed at x=${Math.round(c.x)}`);

  // ---------- 13. rides ----------
  await teleport(4060); await tapWorld(4060, 262); await sleep(200);
  c = await S(); check('tap the Ferris wheel to ride', c.ride === 'wheel');
  await sleep(2500); await page.screenshot({ path: path.join(SHOTS, '13_ferris_wheel.jpg'), type: 'jpeg', quality: 82 });
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(80);
  c = await S(); check('JUMP gets you off the wheel', c.ride === null);
  await waitFor(s => s.grounded, 3000);
  await teleport(4500); await tapWorld(4440, 360); await sleep(200);
  c = await S(); check('tap the coaster to ride', c.ride === 'coaster');
  await sleep(2600); await page.screenshot({ path: path.join(SHOTS, '14_coaster.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => !s.ride, 12000); check('coaster ride finishes and drops you off', !c.ride && c.x > 5300 && c.grounded, `x=${Math.round(c.x)}`);
  await page.screenshot({ path: path.join(SHOTS, '14b_after_coaster.jpg'), type: 'jpeg', quality: 82 });
  // carousel (new in build 3)
  await teleport(5700); await tapWorld(5700, 300); await sleep(200);
  c = await S(); check('tap the carousel to ride a unicorn/bunny/pony', c.ride === 'carousel');
  await sleep(1800); await page.screenshot({ path: path.join(SHOTS, '15b_carousel.jpg'), type: 'jpeg', quality: 82 });
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(80);
  c = await S(); check('JUMP hops off the carousel', c.ride === null);
  await waitFor(s => s.grounded, 3000);
  // paw button = do the nearest thing (here: board the Ferris wheel)
  await teleport(4060); const pw = await center('#pawBtn'); await touch('touchStart', [{ ...pw, id: 4 }]); await touch('touchEnd', []); await sleep(150);
  c = await S(); check('PAW button plays with the nearest thing (boards the wheel)', c.ride === 'wheel');
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await waitFor(s => s.grounded, 3000);
  // tube back to the ball pit
  // marble machine (build 6): dispense balls → xylophone ramps → paddle wheel → gears → lift
  await teleport(6300); await sleep(300);
  for (let i = 0; i < 5; i++) { await tapWorld(6190, 382); await sleep(900); }
  c = await waitFor(s => s.disc.includes('liftup'), 9000);
  const lift = await page.evaluate(() => ({ lvl: __DDW.world.liftLevel, xy: __DDW.world.xyloHit }));
  check('dispenser balls roll down the xylophone ramps into the paddle wheel', c.disc.includes('marblerun'));
  check('5 balls raise the lift all the way', lift.lvl > .99, `level ${lift.lvl.toFixed(2)}`);
  await page.screenshot({ path: path.join(SHOTS, '15c_marble_machine.jpg'), type: 'jpeg', quality: 82 });
  await page.evaluate(() => { __DDW.world.liftLevel = 0; __DDW.world.liftY = 450; }); await sleep(200);
  await page.evaluate(() => __DDW.teleport(6610)); await sleep(300);
  for (let i = 0; i < 5; i++) { await tapWorld(6539, 352); await sleep(700); }  // the button beside the lift
  c = await waitFor(s => s.y < 240, 12000); check('the lift carries the creature up', c.y < 240 && c.grounded, `y=${Math.round(c.y)}`);
  const sb = (await S()).stars;
  await holdBtn('#rightBtn', 380);
  c = await S(); check('walk onto the balcony and find secret star 8', c.stars === sb + 1 && Math.abs(c.y - 230) < 1, `stars ${sb}→${c.stars}, y=${Math.round(c.y)}`);
  await tapWorld(6700, 200); await sleep(80);
  check('tap the balcony xylophone to play it', (await S()).disc.includes('xylophone'));
  await page.screenshot({ path: path.join(SHOTS, '15d_balcony_xylophone.jpg'), type: 'jpeg', quality: 82 });
  // ---------- build 7: the big new stretch ----------
  await teleport(6950); const b0 = (await S()).bits; await holdBtn('#rightBtn', 1700);
  c = await S(); check('hop across the music drums', c.disc.includes('drums'));
  check('star bits get collected while playing', c.bits > b0, `${b0} → ${c.bits}`);
  await page.screenshot({ path: path.join(SHOTS, '19_music_drums.jpg'), type: 'jpeg', quality: 82 });
  await teleport(7880); await sleep(200);
  for (let i = 0; i < 5; i++) { await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(100); await waitFor(s => !s.ride && s.grounded, 2500); }
  c = await S(); check('JUMP-JUMP-JUMP climbs all 5 levels of the Sky Tower', Math.abs(c.y + 60) < 1, `y=${Math.round(c.y)}`);
  await page.screenshot({ path: path.join(SHOTS, '20_sky_tower_top.jpg'), type: 'jpeg', quality: 82 });
  await holdBtn('#rightBtn', 900);
  c = await S(); check('find a lost baby Fluffkin at the top (it follows you)', c.disc.includes('fluff-f1'));
  c = await waitFor(s => s.ride === 'slide', 1500); check('walk off the top onto the GIANT slide', c.ride === 'slide');
  await sleep(700); await page.screenshot({ path: path.join(SHOTS, '21_giant_slide.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => !s.ride && s.grounded, 5000); check('giant slide lands you by the swings', c.x > 8500, `x=${Math.round(c.x)}`);
  await teleport(8740); await tapWorld(8740, 300); await sleep(1600);
  c = await S(); check('tap the swing to ride it', c.ride === 'swing');
  await page.screenshot({ path: path.join(SHOTS, '22_swing.jpg'), type: 'jpeg', quality: 82 });
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(60);
  c = await S(); check('JUMP flings you off the swing', !c.ride && c.launched, `vx=${Math.round(c.vx)} vy=${Math.round(c.vy)}`);
  await waitFor(s => s.grounded, 3000);
  await teleport(9300); const h0 = (await S()).hoops; await tapWorld(9150, 410);
  c = await waitFor(s => s.hoops > h0, 3500); check('the seesaw shoots its ball through the hoop', c.hoops > h0, `baskets ${h0} → ${c.hoops}`);
  await page.screenshot({ path: path.join(SHOTS, '23_seesaw_hoop.jpg'), type: 'jpeg', quality: 82 });
  await teleport(10600); await tapWorld(10620, 232); await sleep(500);
  check('tap a peekaboo window to meet who lives there', (await S()).disc.includes('peek'));
  await page.screenshot({ path: path.join(SHOTS, '24_peekaboo.jpg'), type: 'jpeg', quality: 82 });
  await teleport(10950); await holdBtn('#rightBtn', 1000); await sleep(1200);
  c = await S(); check('bring the Fluffkin home to the Fluffkin House', c.disc.includes('fluffhome'));
  await page.screenshot({ path: path.join(SHOTS, '25_fluffkin_home.jpg'), type: 'jpeg', quality: 82 });
  await page.evaluate(() => { const T = __DDW.train; T.x = 10010; T.dir = 1; T.wait = 1; }); await teleport(10050); await tapWorld(10010, 410); await sleep(150);
  c = await S(); check('tap the train to ride it', c.ride === 'train');
  await sleep(3000); await page.screenshot({ path: path.join(SHOTS, '26_train_ride.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => !s.ride, 20000); check('the train carries you to the far station', c.x > 13000, `x=${Math.round(c.x)}`);
  await teleport(13480); await tapWorld(13480, 380); await sleep(450);
  c = await S(); check('the confetti cannon blasts you sky-high', c.y < 150, `y=${Math.round(c.y)}`);
  await page.screenshot({ path: path.join(SHOTS, '27_confetti_cannon.jpg'), type: 'jpeg', quality: 82 });
  await waitFor(s => s.grounded, 4000);
  await teleport(12960); await sleep(300); await holdBtn('#rightBtn', 1300);
  check('walk on the dance floor to light it up', (await S()).disc.includes('dance'));
  // ---------- build 8: underground tunnels, going inside, creating, Star Babies ----------
  await teleport(1040); await tapWorld(1104, 445); c = await waitFor(s => s.grounded && s.under, 2500);
  check('tap a floor hatch to drop into the secret tunnels', c.under && Math.abs(c.y - 700) < 1, `y=${Math.round(c.y)}`);
  await page.evaluate(() => { __DDW.player.x = 400; }); await sleep(700);
  await tapWorld(252, 668); await tapWorld(312, 668); await tapWorld(432, 668);
  const draft = await page.evaluate(() => __DDW.world.petDraft);
  check('Pet Maker buttons change the pet design', draft.col === 1 && draft.ears === 1, JSON.stringify(draft));
  await tapWorld(560, 600); await sleep(300); c = await S();
  check('pull the lever: your pet hatches', c.pet);
  await page.screenshot({ path: path.join(SHOTS, '28_pet_maker.jpg'), type: 'jpeg', quality: 82 });
  await holdBtn('#rightBtn', 1700); c = await S();
  const petPos = await page.evaluate(() => __DDW.world.petPos);
  check('walk into the low tunnel: the creature crawls (and the pet follows)', c.under && c.x > 700 && Math.abs(petPos.x - c.x) < 160, `x=${Math.round(c.x)} pet=${Math.round(petPos.x)}`);
  await page.screenshot({ path: path.join(SHOTS, '29_crawl_tunnel.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => s.disc.includes('star-s1'), 1500); check('find a lost Star Baby in the tunnel', c.disc.includes('star-s1'));
  await page.evaluate(() => { __DDW.player.x = 2000; }); await sleep(700);
  await tapWorld(1828, 680); await tapWorld(1872, 680); await tapWorld(1872, 636); await tapWorld(1872, 636); await sleep(100);
  c = await S(); check('Block Builder: tap squares to build', c.blocks === 3, `${c.blocks} blocks`);
  const plat = await page.evaluate(() => __DDW.blockPlatforms());
  check('built blocks become platforms you can stand on', plat >= 2, `${plat} platforms`);
  await page.screenshot({ path: path.join(SHOTS, '30_block_builder.jpg'), type: 'jpeg', quality: 82 });
  await page.evaluate(() => { __DDW.player.x = 1978; }); await sleep(200);
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(100);
  c = await waitFor(s => !s.ride && s.grounded && !s.under, 3000); check('JUMP climbs the ladder back up to the surface', !c.under && Math.abs(c.y - GROUND_Y) < 1, `y=${Math.round(c.y)}`);
  await teleport(1300); await page.evaluate(() => { const P = __DDW.player; P.y = 213; }); await holdBtn('#rightBtn', 250); await sleep(1500);
  c = await S(); check('bring the Star Baby to the Star Nest', c.disc.includes('nesthome'));
  await teleport(10700); await tapWorld(10740, 410); await sleep(200);
  c = await S(); check('tap the door to go inside the Peekaboo House', c.inside === 'peek');
  await tapWorld(10620, 410); await sleep(100); check('play the piano inside', (await S()).disc.includes('piano'));
  await page.screenshot({ path: path.join(SHOTS, '31_inside_house.jpg'), type: 'jpeg', quality: 82 });
  await tapWorld(10740, 410); await sleep(100); check('tap the door again to go back outside', (await S()).inside === null);
  const pawB = await center('#pawBtn');
  await touch('touchStart', [{ ...pawB, id: 4 }]); await touch('touchEnd', []); await sleep(100);
  check('PAW at a door goes inside', (await S()).inside === 'peek');
  await touch('touchStart', [{ ...pawB, id: 4 }]); await touch('touchEnd', []); await sleep(100);
  check('PAW inside at the door comes back OUT (never stuck inside)', (await S()).inside === null);
  await teleport(1120); await holdBtn('#rightBtn', 320); await sleep(150);
  await touch('touchStart', [{ ...pawB, id: 4 }]); await touch('touchEnd', []); await sleep(200);
  c = await S(); check('the door under the rainbow bridge leads down a secret staircase to the caves', c.under && Math.abs(c.x - 1250) < 2, `x=${Math.round(c.x)} under=${c.under}`);
  await page.screenshot({ path: path.join(SHOTS, '33_secret_door_cave.jpg'), type: 'jpeg', quality: 82 });
  await touch('touchStart', [{ ...pawB, id: 4 }]); await touch('touchEnd', []); await sleep(200);
  c = await S(); check('the cave door leads back up', !c.under && Math.abs(c.x - 1215) < 2, `x=${Math.round(c.x)}`);
  // ---------- build 9: creature style panel ----------
  await page.locator('#styleBtn').tap(); await sleep(250);
  check('the paint-brush button opens the Creature Style panel', await page.locator('#stylePanel').isVisible());
  await page.locator('.sp-opt[data-f="body"][data-v="#9fe6ff"]').tap();
  await page.locator('.sp-opt[data-f="pattern"][data-v="stars"]').tap();
  await page.locator('.sp-opt[data-f="goggles"]').tap(); await sleep(200);
  const sty = await page.evaluate(() => __DDW.style.pip);
  check('style buttons change colour, pattern and extras', sty.body === '#9fe6ff' && sty.pattern === 'stars' && sty.goggles === false, JSON.stringify(sty));
  await page.screenshot({ path: path.join(SHOTS, '32_style_panel.jpg'), type: 'jpeg', quality: 82 });
  await page.locator('#styleDone').tap(); await sleep(200);
  check('the ✓ button closes the panel', await page.locator('#stylePanel').isHidden());
  await teleport(13700); await holdBtn('#rightBtn', 1100);
  c = await waitFor(s => s.ride === 'tube', 1500); check('walking into the rainbow door enters the whoosh tube', c.ride === 'tube');
  await sleep(1200); await page.screenshot({ path: path.join(SHOTS, '15_whoosh_tube.jpg'), type: 'jpeg', quality: 82 });
  c = await waitFor(s => !s.ride && s.grounded, 6000); check('tube carries you all the way back to the ball pit', c.x < 640, `x=${Math.round(c.x)}`);
  // bubble ride
  await teleport(2470); await tapWorld(2548, 405); await sleep(150);
  const rideB = await page.evaluate(() => { const b = __DDW.world.bubbles.find(b => b.ride); return b && { x: b.x, y: b.y }; });
  if (rideB) { await page.evaluate(b => { __DDW.player.x = b.x; __DDW.player.y = b.y + 70; __DDW.player.vy = 0; }, rideB); }
  c = await waitFor(s => s.ride === 'bubble', 1500); check('touching the giant bubble lets you float in it', c.ride === 'bubble');
  await sleep(900); await page.screenshot({ path: path.join(SHOTS, '16_bubble_ride.jpg'), type: 'jpeg', quality: 82 });
  await touch('touchStart', [{ ...jb, id: 3 }]); await touch('touchEnd', []); await sleep(80);
  c = await S(); check('JUMP pops the bubble and you drop out', c.ride === null);

  // ---------- 14. sound toggle ----------
  await page.locator('#soundBtn').tap(); await sleep(100);
  c = await S(); check('sound button turns sound off', c.sound === false && await page.locator('#soundBtn').evaluate(e => e.classList.contains('muted')));
  await page.locator('#soundBtn').tap(); await sleep(100);
  c = await S(); check('sound button turns sound back on', c.sound === true);
  // ---------- 15. focus loss never leaves movement held ----------
  const r2 = await center('#rightBtn'); await touch('touchStart', [{ ...r2, id: 1 }]); await sleep(200);
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await sleep(100);
  c = await S(); check('losing focus releases held movement', !c.keys.right, JSON.stringify(c.keys));
  await touch('touchEnd', []);
  // ---------- 16. save + reload ----------
  await page.locator('.creatureChoice[data-creature="jelly"]').tap(); await sleep(200);
  const before = await S();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.reload(); await sleep(600);
  check('reload shows KEEP PLAYING', (await page.locator('#playBtn').textContent()).includes('KEEP'));
  await page.locator('#playBtn').tap(); await sleep(400);
  const after = await S();
  check('reload keeps creature', after.creature === 'jelly');
  check('reload keeps paintings', after.strokes === before.strokes, `${after.strokes} strokes`);
  check('reload keeps your pet and your building', after.pet && after.blocks === 3);
  check('reload keeps your creature style', await page.evaluate(() => __DDW.style.pip.body === '#9fe6ff' && __DDW.style.pip.pattern === 'stars'));
  check('reload keeps stickers', await page.evaluate(() => __DDW.world.stickers.length) === 1);
  check('reload keeps the easel painting on the easel', await page.evaluate(() => __DDW.world.strokes.filter(s => s.s === 2).length) === 1);
  check('reload keeps discoveries', after.disc.length === before.disc.length, `${after.disc.length} discoveries`);
  check('reload keeps machine/power state', after.powered && after.labOn && after.battery === 6 && after.lastMix === before.lastMix);
  check('reload keeps position (approx.)', Math.abs(after.x - before.x) < 2, `x ${Math.round(before.x)} → ${Math.round(after.x)}`);
  // ---------- 17. corrupt save + v1 migration ----------
  // inject data AFTER the old page's save-on-pagehide, i.e. at the start of the next load
  await ctx.addInitScript(() => { const j = sessionStorage.getItem('__inject'); if (j) { sessionStorage.removeItem('__inject'); const o = JSON.parse(j); for (const k in o) { if (o[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); } } });
  await page.evaluate(() => sessionStorage.setItem('__inject', JSON.stringify({ 'dawsons-discovery-world-v2': '{not json!!' }))); await page.reload(); await sleep(500);
  await page.locator('#playBtn').tap(); await sleep(300);
  c = await S(); check('corrupt save data is ignored safely', c.creature === 'pip' && c.strokes === 0);
  await page.evaluate(() => sessionStorage.setItem('__inject', JSON.stringify({ 'dawsons-discovery-world-v2': null, 'dawsons-discovery-world-v1': JSON.stringify({ x: 2000, creature: 'zuzu', strokes: [{ color: '#fb5aaf', points: [[1500, 200], [1600, 250]] }, { color: 'bad', points: 'x' }], discoveries: ['slide'], labOn: true, magnetOn: true, colorMix: 2 }) })));
  await page.reload(); await sleep(500); await page.locator('#playBtn').tap(); await sleep(300);
  c = await S(); check('old Prototype 01 save migrates (creature, painting, discoveries)', c.creature === 'zuzu' && c.strokes === 1 && c.disc.includes('slide') && Math.abs(c.x - 2000) < 2, JSON.stringify({ cr: c.creature, st: c.strokes, sl: c.disc.includes('slide'), x: Math.round(c.x), y: Math.round(c.y) }));
  // ---------- 18. frame timing (headless desktop Chromium — NOT an iPhone measurement) ----------
  await sleep(4000); // let adaptive resolution settle
  const q = await page.evaluate(() => __DDW.quality);
  const ft = await page.evaluate(() => new Promise(res => { const ts = []; const f = t => { ts.push(t); if (ts.length < 180) requestAnimationFrame(f); else { const d = ts.slice(1).map((t, i) => t - ts[i]); d.sort((a, b) => a - b); res({ median: d[d.length >> 1], p95: d[Math.floor(d.length * .95)] }); } }; requestAnimationFrame(f); }));
  check('frame time after adaptive resolution (headless Chromium — software rendering, NOT an iPhone)', ft.median < 25, `median ${ft.median.toFixed(1)}ms, p95 ${ft.p95.toFixed(1)}ms, quality ${q.toFixed(2)}`);
  // ---------- 19. portrait phone ----------
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(500);
  check('portrait shows the turn-sideways tip', await page.locator('#rotateTip').isVisible());
  await page.screenshot({ path: path.join(SHOTS, '17_portrait.jpg'), type: 'jpeg', quality: 82 });
  await page.setViewportSize({ width: 932, height: 430 }); await sleep(300);
  await page.screenshot({ path: path.join(SHOTS, '18_landscape_932x430.jpg'), type: 'jpeg', quality: 82 });

  check('no runtime errors in the console', errors.length === 0, errors.slice(0, 5).join(' | '));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  fs.writeFileSync(path.join(__dirname, 'TEST_RESULTS.json'), JSON.stringify({ date: new Date().toISOString(), environment: 'Playwright Chromium (headless, Linux), 844x390 touch viewport, DPR 2 — NOT a physical iPhone', passed, total: results.length, results, errors }, null, 2));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
function LAYOUT_X(x) { return x; }
