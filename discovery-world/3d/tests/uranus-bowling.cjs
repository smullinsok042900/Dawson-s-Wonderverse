// (build 170) UPSIDE-DOWN BOWLING on Uranus: tap the planet ball (or 🐾 beside it) and she kicks it down the ice lane to five
// ice pins; each pin it reaches falls over; all five: "STRIKE!"; the ball rolls itself home and the pins stand up again.
// usage: NODE_PATH=$(npm root -g) node tests/uranus-bowling.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'uranus'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 42); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'uranusroll'), null, 60000); await sleep(1000);
  const bx = () => ev(() => __DDW3.G.interact.find(i => i.disc === 'uranusroll').x);
  const pinsDown = () => ev(() => { let m = null; __DDW3.scene.traverse(o => { if (o.isInstancedMesh && o.count === 5 && o.geometry.type === 'LatheGeometry') m = o; }); if (!m) return -1; const M = new __DDW3.THREE.Matrix4(), e = new __DDW3.THREE.Euler(); let n = 0; for (let q = 0; q < 5; q++) { m.getMatrixAt(q, M); e.setFromRotationMatrix(M); if (Math.abs(e.z) > 1) n++; } return n; });
  const x0 = await bx(); check('five ice pins stand at the end of the lane', (await pinsDown()) === 0);
  await ev(() => { __DDW3.player.x = __DDW3.G.interact.find(i => i.disc === 'uranusroll').x - 1.5; __DDW3.G.interact.find(i => i.disc === 'uranusroll').run(); });
  check('a tap kicks the ball: it rolls down the lane away from her', await until(x => __DDW3.G.interact.find(i => i.disc === 'uranusroll').x > x + 10, x0, 60000));
  check('it knocks all five pins over: "STRIKE!"', await until(() => __DDW3.world.disc.has('uranusstrike'), null, 90000));
  await sleep(1500); const down = await pinsDown(); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'uranus-bowling.jpg'), type: 'jpeg', quality: 85 });
  check('the pins really lie on the ice', down === 5, `${down} down`);
  check('the ball rolls itself home', await until(x => Math.abs(__DDW3.G.interact.find(i => i.disc === 'uranusroll').x - x) < .05, x0, 90000));
  check('and the pins stand up again', await until(() => { let m = null; __DDW3.scene.traverse(o => { if (o.isInstancedMesh && o.count === 5 && o.geometry.type === 'LatheGeometry') m = o; }); const M = new __DDW3.THREE.Matrix4(), e = new __DDW3.THREE.Euler(); for (let q = 0; q < 5; q++) { m.getMatrixAt(q, M); e.setFromRotationMatrix(M); if (Math.abs(e.z) > .05) return false; } return true; }, null, 30000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
