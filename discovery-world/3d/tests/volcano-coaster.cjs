// (build 164, the family's request) THE VOLCANO ISLAND ROLLER COASTER, ridden all the way round as ONE ride, in first person:
// board at the station → first-person camera; up round the OUTSIDE of the volcano; IN through the hole in its side, with the
// lava chamber drawn and the camera really inside; out again; UNDER THE WATER with the underwater world drawn and the camera
// under the surface; back up; home to the station; off → the normal camera back. 🐾 grabs the stars on the way.
// usage: NODE_PATH=$(npm root -g) node tests/volcano-coaster.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(q => q[0] === 'volcano'))); await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'volcano' && !__DDW3.player.ride, null, 240000);
  check('Volcano Island: the volcano coaster is built (one continuous track)', await until(() => __DDW3.G.volcanoCoaster && __DDW3.G.volcanoCoaster.ready, null, 120000), await ev(() => { const C = __DDW3.G.volcanoCoaster; return C ? `${Math.round(C.len)} m, ${C.holes.length} holes in the volcano, ${Math.round(C.time)} s` : 'none'; }));
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(X => { const P = __DDW3.player; P.x = X + 80; P.y = 0; P.vx = 0; P.grounded = true; __DDW3.G.interact.find(i => i.disc === 'volcanocoasterride').run(); }, X);
  check('she boards at the station', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'coaster' && __DDW3.player.ride.C === __DDW3.G.volcanoCoaster, null, 10000));
  check('the FIRST-PERSON camera: her eyes in the front seat (her creature hidden, the camera on the train)', await until(() => { const o = __DDW3.G.camOverride; return !!(o && o.fp && __DDW3.G.playerHidden); }, null, 10000));
  const seen = { lift: 0, inVolc: 0, insideDrawn: 0, camInside: 0, under: 0, seaDrawn: 0, camUnder: 0, maxY: 0, loopUp: 0 }; let shots = 0, last = -1, stuck = 0;
  for (let n = 0; n < 20000; n++) {
    const s = await ev(() => { const P = __DDW3.player, R = P.ride; if (!R || R.type !== 'coaster') return null; const C = R.C, j = Math.floor(R.i), cam = __DDW3.camera.position, VX = __DDW3.G.volcanoX;
      const rCam = Math.hypot(cam.x - VX, cam.z + 150), inC = cam.y < 54 && rCam < 14 + 44 * Math.max(0, Math.min(1, 1 - cam.y / 55)) - 4;
      let insideVis = false, seaVis = false; for (const g of C.cars[0].parent.children) { if (g.isGroup && g.children.length > 2 && g.visible) { if (g.children.some(m => m.geometry && m.geometry.type === 'CircleGeometry' && m.position.y > 2)) insideVis = true; if (g.children.some(m => m.isInstancedMesh)) seaVis = true; } }
      const near = C.stars.find(q => !q.got && R.i > q.i - 30 && R.i < q.i + 10);
      return { i: R.i, N: C.N, f: C.flag[j], inV: C.inVolc[j], uw: C.underW[j], y: C.pos[j * 3 + 1], up: __DDW3.camera.up.y, camIn: inC, camUnder: cam.y < -.5, insideVis, seaVis, star: !!near }; });
    if (!s) break;
    if (s.f === 'L') seen.lift = 1; if (s.inV) seen.inVolc = 1; if (s.inV && s.insideVis) seen.insideDrawn = 1; if (s.inV && s.camIn) seen.camInside = 1;
    if (s.uw) seen.under = 1; if (s.uw && s.seaVis) seen.seaDrawn = 1; if (s.uw && s.camUnder) seen.camUnder = 1; seen.maxY = Math.max(seen.maxY, s.y); if (s.up < -.3) seen.loopUp = 1;
    if (s.star) { await ev(() => __DDW3.G.doAction()); shots++; }
    if (s.i === last) { if (++stuck > 200) break; } else stuck = 0; last = s.i;
    await sleep(60);
  }
  check('it climbs high round the OUTSIDE of the volcano (a chain lift)', seen.lift && seen.maxY > 70, `top ${seen.maxY.toFixed(0)} m`);
  check('it goes INTO the volcano through the hole in its side, and the inside (the lava chamber) is drawn', seen.inVolc && seen.insideDrawn);
  check('...with the camera really inside the volcano (first person)', seen.camInside);
  check('it dives UNDER THE WATER, and the underwater world is drawn', seen.under && seen.seaDrawn);
  check('...with the camera really under the surface', seen.camUnder);
  check('the view turns over in the loop (the ride camera rolls with the track)', seen.loopUp);
  const stars = await ev(() => __DDW3.G.volcanoCoaster.stars.filter(q => q.got).length);
  check('🐾 grabs the stars on the way', stars >= 4, `${stars} of 6 (${shots} taps)`);
  check('the train comes home and she gets off at the station', await until(() => !__DDW3.player.ride, null, 60000) && await ev(X => Math.abs(__DDW3.player.x - (X + 83)) < 3, X));
  check('the normal third-person camera is back (not rolled, her creature shown)', await ev(() => !__DDW3.G.camOverride && !__DDW3.G.playerHidden && __DDW3.camera.up.y === 1));
  check('🔁 ride again is offered', await ev(() => document.getElementById('coasterReplay') && document.getElementById('coasterReplay').classList.contains('show')));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
