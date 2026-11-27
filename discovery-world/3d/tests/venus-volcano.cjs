// (build 167) PUMP THE VENUS VOLCANO: each tap builds the pressure (the lava rises in the crater); the fifth makes it ERUPT and
// throw five glowing lava stars that land beside the path; she walks to them to collect them; all five: a party.
// usage: NODE_PATH=$(npm root -g) node tests/venus-volcano.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'venus'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 40); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'venusvolcano'), null, 60000); await sleep(1000);
  const stars = () => ev(() => { const out = []; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'OctahedronGeometry' && o.geometry.parameters.radius === .42 && o.visible && o.parent && o.parent.visible) out.push({ x: o.position.x, y: o.position.y }); }); return out; });
  const crater = () => ev(() => { let y = null; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'CircleGeometry' && o.geometry.parameters.radius === .62 && o.parent && Math.abs(o.parent.position.z + 9.5) < .01 && y === null) y = o.position.y; }); return y; });
  const y0 = await crater(); const pump = () => ev(() => __DDW3.G.interact.find(i => i.disc === 'venusvolcano').run());
  for (let n = 0; n < 3; n++) { await pump(); await sleep(700); }
  const y3 = await crater();
  check('each tap pumps the volcano: the lava rises in the crater', y3 > y0 + .1 && (await stars()).length === 0, `${y0} -> ${y3}`);
  await pump(); await sleep(700); await pump(); await ev(x => { __DDW3.player.x = x; }, X + 22); // (she steps back to watch, so none lands on her)
  check('the fifth tap: it ERUPTS and throws five lava stars', await until(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'OctahedronGeometry' && o.geometry.parameters.radius === .42 && o.visible) n++; }); return n === 5; }, null, 10000));
  await sleep(4000); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'venus-volcano.jpg'), type: 'jpeg', quality: 85 });
  const s = await stars(); check('the stars land beside the path, near the ground', s.length === 5 && s.every(p => p.y < 4), JSON.stringify(s.map(p => p.y.toFixed(1))));
  for (const p of s) { await ev(x => { const P = __DDW3.player; P.x = x; P.vx = 0; }, p.x); await until(x => { let left = true; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'OctahedronGeometry' && o.geometry.parameters.radius === .42 && o.visible && Math.abs(o.position.x - x) < .01) left = false; }); return left; }, p.x, 15000); }
  check('she walks to each star and collects it; all five: "You caught all the lava stars!"', await until(() => __DDW3.world.disc.has('venuslavastars'), null, 15000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
