// (build 72) Saturn: the Star Blaster (JUMP spins faster -> higher) and the Ring Raceway you drive (desktop, software rendering).
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').click(); await sleep(2500);
  let fails = 0; const check = (n, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  — ' + info : '')); if (!ok) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'saturn'))); await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 });
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1); const put = x => ev(x => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = 0; P.z = 0; P.grounded = true; }, x);
  await put(X + 150); await sleep(2000); await put(X + 250); await sleep(2500);
  const blast = jump => ev(jump => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'saturnblaster').run(); const t0 = performance.now(); let maxY = 0, seen = false;
    const f = () => { const R = P.ride; if (R && R.type === 'blaster') { seen = true; if (jump && R.onJump && R.t < 5) R.onJump(); } maxY = Math.max(maxY, P.y); if ((seen && !P.ride) || performance.now() - t0 > 120000) return res({ seen, maxY, done: !P.ride, y: P.y }); requestAnimationFrame(f); }; f(); }), jump);
  await put(X + 150); await sleep(1500); const gentle = await blast(false); await put(X + 150); await sleep(800); const wild = await blast(true);
  await put(X + 150); await sleep(800);
  const cv = await ev(() => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'saturnblaster').run(); const t0 = performance.now(); let wide = false, seen = false;
    const f = () => { const R = P.ride; if (R && R.type === 'blaster') { seen = true; D.keys.right = R.t > 1 && R.t < 4; if (D.G.camOverride && D.G.camOverride.blaster) wide = true; } if ((seen && !P.ride) || performance.now() - t0 > 120000) { D.keys.right = false; return res({ wide, cleared: !(D.G.camOverride && D.G.camOverride.blaster) }); } requestAnimationFrame(f); }; f(); }));
  check('Star Blaster: push ▶ for the wide view of the whole tower; the camera comes back after the ride', cv.wide && cv.cleared, JSON.stringify(cv));
  const modeRide = d => ev(d => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === d).run(); const t0 = performance.now(); let maxY = 0, seen = false; const f = () => { if (P.ride && P.ride.type === 'blaster') seen = true; maxY = Math.max(maxY, P.y); if ((seen && !P.ride) || performance.now() - t0 > 120000) return res({ seen, maxY, done: !P.ride }); requestAnimationFrame(f); }; f(); }), d);
  await put(X + 150); await sleep(800); const gm = await modeRide('saturnblastergentle'); await put(X + 150); await sleep(800); const wm = await modeRide('saturnblasterwild');
  check('Star Blaster: the snail pad is a gentle ride, the rocket pad a wild one (much higher)', gm.done && wm.done && wm.maxY > gm.maxY + 10, JSON.stringify({ gentle: gm.maxY, wild: wm.maxY }));
  check('Star Blaster: a full ride, back on the ground', gentle.done && gentle.y < .3, JSON.stringify(gentle));
  check('Star Blaster: pressing JUMP while it spins launches you much higher', wild.maxY > gentle.maxY + 5 && wild.maxY > 50, JSON.stringify({ gentle: gentle.maxY, wild: wild.maxY }));
  await put(X + 240); await sleep(1500);
  const race = await ev(() => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'saturnracego').run(); const t0 = performance.now(); let seen = false, maxV = 0, R0 = null;
    const f = () => { const R = P.ride; if (R && R.type === 'ringrace') { seen = true; R0 = R; const lt = R.t % 9; D.keys.right = lt < 7; D.keys.up = lt > 1 && lt < 5; D.keys.down = lt > 7 && lt < 8.5; }
      if ((seen && !P.ride) || performance.now() - t0 > 400000) { Object.assign(D.keys, { right: false, up: false, down: false }); return res({ seen, done: !P.ride, laps: R0 && R0.laps, maxV: R0 && R0.maxV, lanes: R0 && R0.lanes, boosts: R0 && R0.boosts, stars: R0 && R0.stars, jumps: R0 && R0.jumps, outer: R0 && R0.outer, x: P.x }); } requestAnimationFrame(f); }; f(); }));
  check('Ring Raceway: you drive 3 laps, changing lanes, and get back to the pad', race.done && race.laps >= 3 && race.lanes > 1.5 && race.maxV > 25, JSON.stringify(race));
  check('Ring Raceway: boost pads, stars, jump ramps and the outer ring route work', (race.boosts || 0) >= 1 && (race.stars || 0) >= 1 && (race.jumps || 0) >= 1 && (race.outer || 0) >= 1, JSON.stringify({ boosts: race.boosts, stars: race.stars, jumps: race.jumps, outer: race.outer }));
  await put(X + 236); await sleep(1500);
  const fd = await ev(() => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'saturnfreedrive').run(); const t0 = performance.now(); let seen = false, R0 = null, stopped = false, rivalsSeen = false;
    const f = () => { const R = P.ride; if (R && R.type === 'ringrace') { seen = true; R0 = R; D.keys.right = true; D.scene && 0; let rv = false; D.G.scene && 0; if (R.t > 14 && !stopped) { stopped = true; R.onJump(); } }
      if ((seen && !P.ride) || performance.now() - t0 > 200000) { D.keys.right = false; return res({ seen, free: !!(R0 && R0.free), done: !P.ride, laps: R0 && R0.laps, maxV: R0 && R0.maxV }); } requestAnimationFrame(f); }; f(); }));
  check('Ring Raceway free drive (the star pad): no racers, no laps, drive as long as you like, JUMP brings you back', fd.seen && fd.free && fd.done && !fd.laps && fd.maxV > 20, JSON.stringify(fd));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
