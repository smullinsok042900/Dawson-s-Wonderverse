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
    const f = () => { const R = P.ride; if (R && R.type === 'logride') { seen = true; R0 = R; const s = Math.floor(R.t / 2.5) % 2; D.keys.left = s === 0; D.keys.right = s === 1; if (R.t > 3 && R.t < 3.2) R.onJump && R.onJump(); maxStep = Math.max(maxStep, Math.hypot(P.x - lx, P.y - ly, P.z - lz)); }
      lx = P.x; ly = P.y; lz = P.z; if ((seen && !P.ride) || performance.now() - t0 > 400000) { D.keys.left = D.keys.right = false; return res({ seen, done: !P.ride, s: R0 && R0.t, maxY: R0 && R0.maxY, maxV: R0 && R0.maxV, splashed: R0 && R0.splashed, stars: R0 && R0.stars, offMax: R0 && R0.offMax, splashes: R0 && R0.splashes, maxStep }); } requestAnimationFrame(f); }; f(); }));
  check('the log flume runs its whole route (two lifts, up to 30 m) and splashes down', r.done && r.maxY > 29 && r.splashed && r.s > 40, JSON.stringify(r));
  check('you steer the log ◀ ▶ and catch stars; JUMP makes a splash', r.offMax > .3 && (r.stars || 0) >= 1 && (r.splashes || 0) >= 1);
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
