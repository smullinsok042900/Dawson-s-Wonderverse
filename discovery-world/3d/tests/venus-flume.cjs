// (build 71) Venus: the giant log flume, ridden from start to end, steering for stars (desktop, software rendering).
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').click(); await sleep(2500);
  let fails = 0; const check = (n, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  — ' + info : '')); if (!ok) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'venus'))); await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 });
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1); await ev(x => { const P = __DDW3.player; P.x = x; }, X + 120); await sleep(2500); await ev(x => { const P = __DDW3.player; P.x = x; }, X + 131); await sleep(1500);
  console.log('errs', errs.slice(0, 2).join(' | '), await ev(() => __DDW3.G.interact.filter(i => i.layer === 'space').map(i => i.disc).join(',')));
  const r = await ev(() => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'venuslogride').run(); const t0 = performance.now(); let seen = false, R0 = null, maxStep = 0, lx = P.x, ly = P.y, lz = P.z;
    const f = () => { const R = P.ride; if (R && R.type === 'logride') { seen = true; R0 = R; D.keys.right = true; D.keys.left = false; /* (keep right: the long way round) */ if (R.t > 3 && R.t < 3.2) R.onJump && R.onJump(); maxStep = Math.max(maxStep, Math.hypot(P.x - lx, P.y - ly, P.z - lz)); }
      lx = P.x; ly = P.y; lz = P.z; if ((seen && !P.ride) || performance.now() - t0 > 400000) { D.keys.left = D.keys.right = false; return res({ seen, done: !P.ride, s: R0 && R0.t, maxY: R0 && R0.maxY, maxV: R0 && R0.maxV, splashed: R0 && R0.splashed, stars: R0 && R0.stars, offMax: R0 && R0.offMax, splashes: R0 && R0.splashes, shortcut: !!(R0 && R0.shortcut), maxStep }); } requestAnimationFrame(f); }; f(); }));
  check('the log flume runs its whole route the long way round (two lifts, up to 30 m) and splashes down', r.done && !r.shortcut && r.maxY > 29 && r.splashed && r.s > 40, JSON.stringify(r));
  check('you steer the log ◀ ▶ and catch stars; JUMP makes a splash', r.offMax > .3 && (r.stars || 0) >= 1 && (r.splashes || 0) >= 1);
  await ev(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.ride = null; }, X + 131); await sleep(1500);
  const sc = await ev(() => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'venuslogride').run(); const t0 = performance.now(); let seen = false, R0 = null;
    const f = () => { const R = P.ride; if (R && R.type === 'logride') { seen = true; R0 = R; D.keys.left = true; } if ((seen && !P.ride) || performance.now() - t0 > 400000) { D.keys.left = false; return res({ done: !P.ride, shortcut: !!(R0 && R0.shortcut), s: R0 && R0.t, maxY: R0 && R0.maxY }); } requestAnimationFrame(f); }; f(); }));
  check('the waterfall shortcut: steer ◀ at the fork and the log drops down the waterfall chute, then rides on to the end', sc.done && sc.shortcut && sc.s < r.s && sc.maxY > 29, JSON.stringify({ ...sc, longRide: r.s, longShortcut: r.shortcut }));
  // (build 92) the rapids splash game: steer toward each target and press JUMP
  await ev(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.ride = null; }, X + 131); await sleep(1500);
  const sg = await ev(() => new Promise(res => { const D = __DDW3, P = D.player, T = D.G.venusSplash; D.G.interact.find(i => i.disc === 'venuslogride').run(); const t0 = performance.now(); let seen = false, R0 = null;
    const f = () => { const R = P.ride; if (R && R.type === 'logride') { seen = true; R0 = R; const u = R.pu || 0, q = T.find(q => !q.hit && u < q.u + .012);
        if (q && u > q.u - .03) { D.keys.left = q.sd < 0; D.keys.right = q.sd > 0; if (u > q.u - .02) R.onJump(); } else { D.keys.left = false; D.keys.right = true; } }
      if ((seen && !P.ride) || performance.now() - t0 > 400000) { D.keys.left = D.keys.right = false; return res({ done: !P.ride, hits: R0 && R0.hits, all: D.world.disc.has('venussplashgame'), shortcut: !!(R0 && R0.shortcut) }); } requestAnimationFrame(f); }; f(); }));
  check('the rapids splash game: steer toward the targets and press JUMP to splash them; all five wins', sg.done && sg.hits >= 4 && !sg.shortcut, JSON.stringify(sg));
  // (build 93) the crystal-cave fork: steer ◀ at the second arch (after the rapids) and the log goes through the crystal cave
  await ev(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.ride = null; }, X + 131); await sleep(1500);
  const cv = await ev(() => new Promise(res => { const D = __DDW3, P = D.player; D.G.interact.find(i => i.disc === 'venuslogride').run(); const t0 = performance.now(); let seen = false, R0 = null, minZ = 0;
    const f = () => { const R = P.ride; if (R && R.type === 'logride') { seen = true; R0 = R; const u = R.pu || 0; D.keys.left = u > .46; D.keys.right = u <= .46; minZ = Math.min(minZ, P.z); }
      if ((seen && !P.ride) || performance.now() - t0 > 400000) { D.keys.left = D.keys.right = false; return res({ done: !P.ride, cave: !!(R0 && R0.cave), shortcut: !!(R0 && R0.shortcut), minZ, splashed: !!(R0 && R0.splashed) }); } requestAnimationFrame(f); }; f(); }));
  check('the crystal-cave fork: steer ◀ at the second arch, ride through the crystal cave, and on to the splash pool', cv.done && cv.cave && !cv.shortcut && cv.minZ < -33 && cv.splashed, JSON.stringify(cv));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
