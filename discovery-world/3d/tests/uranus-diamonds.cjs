// (build 173) CATCH THE DIAMOND RAIN on Uranus: tap the cloud and it drifts over the path raining twelve diamonds; she runs
// under them to catch them; eight in one shower: "a diamond collector!".
// usage: NODE_PATH=$(npm root -g) node tests/uranus-diamonds.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
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
  await ev(x => { __DDW3.player.x = x; }, X + 56); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'diamondrain'), null, 60000); await sleep(1000);
  const gems = () => ev(() => { const out = []; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'OctahedronGeometry' && Math.abs(o.geometry.parameters.radius - .16) < 1e-6 && o.parent && o.parent.visible) out.push({ x: o.position.x, y: o.position.y, z: o.position.z }); }); return out; });
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'diamondrain').run());
  check('a tap: diamonds start to rain from the cloud', await until(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'OctahedronGeometry' && Math.abs(o.geometry.parameters.radius - .16) < 1e-6) n++; }); return n > 0; }, null, 15000));
  // run under the lowest diamond, like she would (she walks: the test sets her place, as the arrows would)
  for (let n = 0; n < 600; n++) { if (await ev(() => __DDW3.world.disc.has('diamondcatch'))) break; const g = (await gems()).sort((p, q) => p.y - q.y)[0]; if (g) await ev(x => { const P = __DDW3.player; P.x = x; P.vx = 0; }, g.x); await sleep(80); }
  check('she runs under them and catches eight: "You are a diamond collector!"', await ev(() => __DDW3.world.disc.has('diamondcatch')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'uranus-diamonds.jpg'), type: 'jpeg', quality: 85 });
  check('the shower ends by itself, and a tap starts another', await until(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'OctahedronGeometry' && Math.abs(o.geometry.parameters.radius - .16) < 1e-6) n++; }); return n === 0; }, null, 60000)
    && (await sleep(1500), await ev(() => __DDW3.G.interact.find(i => i.disc === 'diamondrain').run()), await until(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'OctahedronGeometry' && Math.abs(o.geometry.parameters.radius - .16) < 1e-6) n++; }); return n > 0; }, null, 15000)));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
