// (build 178) THE GIANT SUN COASTER, ridden all the way round in first person: board at the station on the Sun's landing
// area → first-person camera; the spiral lift 54 m up; through all four flare arches; the loop; the booster; home; off → the
// normal camera back. 🐾 grabs the stars on the way.
// usage: NODE_PATH=$(npm root -g) node tests/sun-coaster.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(q => q[0] === 'sun'))); await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'sun' && !__DDW3.player.ride, null, 240000);
  check('the Sun: the giant coaster is built (one continuous track)', await until(() => __DDW3.G.sunCoaster && __DDW3.G.sunCoaster.ready, null, 120000), await ev(() => { const C = __DDW3.G.sunCoaster; return C ? `${Math.round(C.len)} m, ${Math.round(C.time)} s` : ''; }));
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(X => { const P = __DDW3.player; P.x = X + 92; P.y = 0; P.vx = 0; P.grounded = true; __DDW3.G.interact.find(i => i.disc === 'sunbigcoasterride').run(); }, X);
  check('she boards at the station on the landing area', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'coaster' && __DDW3.player.ride.C === __DDW3.G.sunCoaster, null, 10000));
  check('the FIRST-PERSON camera', await until(() => { const o = __DDW3.G.camOverride; return !!(o && o.fp && __DDW3.G.playerHidden); }, null, 10000));
  const seen = { lift: 0, maxY: 0, loopUp: 0, boost: 0 }; let shots = 0, last = -1, stuck = 0, shot = 0;
  for (let n = 0; n < 20000; n++) {
    const s = await ev(() => { const R = __DDW3.player.ride; if (!R || R.type !== 'coaster') return null; const C = R.C, j = Math.floor(R.i); const near = C.stars.find(q => !q.got && R.i > q.i - 30 && R.i < q.i + 10);
      return { i: R.i, N: C.N, f: C.flag[j], y: C.pos[j * 3 + 1], up: __DDW3.camera.up.y, star: !!near, arch: C.archesPassed() }; });
    if (!s) break;
    if (s.f === 'L') seen.lift = 1; if (s.f === 'B') seen.boost = 1; seen.maxY = Math.max(seen.maxY, s.y); if (s.up < -.3) seen.loopUp = 1;
    if (!shot && s.arch >= 1) { shot = 1; await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'sun-coaster-flare.jpg'), type: 'jpeg', quality: 85 }); }
    if (shot === 1 && s.f === 'L' && s.y > 35) { shot = 2; await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'sun-coaster-lift.jpg'), type: 'jpeg', quality: 85 }); }
    if (s.star) { await ev(() => __DDW3.G.doAction()); shots++; }
    if (s.i === last) { if (++stuck > 200) break; } else stuck = 0; last = s.i;
    await sleep(60);
  }
  check('the spiral lift takes her high above the Sun', seen.lift && seen.maxY > 50, `top ${seen.maxY.toFixed(0)} m`);
  check('she flies through all four flare arches (a whoosh and sparks each)', (await ev(() => __DDW3.G.sunCoaster.archesPassed())) === 4);
  check('the view turns over in the loop', seen.loopUp);
  check('a booster on the way', seen.boost);
  const stars = await ev(() => __DDW3.G.sunCoaster.stars.filter(q => q.got).length);
  check('🐾 grabs the stars on the way', stars >= 4, `${stars} of 6 (${shots} taps)`);
  check('the train comes home and she gets off at the station', await until(() => !__DDW3.player.ride, null, 60000) && await ev(X => Math.abs(__DDW3.player.x - (X + 95)) < 3, X));
  check('the normal third-person camera is back', await ev(() => !__DDW3.G.camOverride && !__DDW3.G.playerHidden && __DDW3.camera.up.y === 1));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
