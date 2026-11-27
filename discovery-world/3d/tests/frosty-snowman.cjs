// (build 160) ROLL THE SNOWBALLS for the snowman in Frosty Peaks: tap the little snowball and she pushes it along the snow; it
// grows as it rolls; big enough, she pushes it to the snowman and it goes on (bottom, middle, head); then nose and hat.
// usage: NODE_PATH=$(npm root -g) node tests/frosty-snowman.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(-303)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'snow_rolled'), null, 120000); await sleep(1500);
  const parts = () => ev(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && Math.abs(o.position.x + 297) < .05 && Math.abs(o.position.z + 2.6) < .05) n++; }); return n; });
  const walk = async (key, to) => { await page.keyboard.down(key); await until(([l, to]) => l ? __DDW3.player.x <= to : __DDW3.player.x >= to, [key === 'ArrowLeft', to], 40000); await page.keyboard.up(key); };
  const ballR = () => ev(() => { let r = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === .35 && Math.abs(o.position.z + .7) < .05) r = o.scale.x * .35; }); return r; });
  for (let n = 0; n < 3; n++) {
    await ev(() => { const P = __DDW3.player; P.x = -303; P.vx = 0; P.facing = -1; __DDW3.G.interact.find(i => i.disc === 'snow_rolled').run(); }); await sleep(500);
    const r0 = await ballR(); await walk('ArrowLeft', -322); const r1 = await ballR();
    if (n === 0) check('tap the little snowball: she pushes it along the snow, and it grows as it rolls', r1 > r0 + .3, `${r0.toFixed(2)} -> ${r1.toFixed(2)}`);
    await walk('ArrowRight', -299.5); await until(n => { let c = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && Math.abs(o.position.x + 297) < .05 && Math.abs(o.position.z + 2.6) < .05) c++; }); return c > n; }, n, 10000);
  }
  check('big enough, she pushes each one to the snowman and it goes on: bottom, middle and head', await parts() >= 3 && await ev(() => __DDW3.world.disc.has('snowrolled3')), String(await parts()));
  await ev(() => { const P = __DDW3.player; P.x = -300; const it = __DDW3.G.interact.find(i => i.disc === 'snowman' && i.action === 'Build snow friend'); it.run(); it.run(); });
  check('then a carrot nose and a hat', await ev(() => __DDW3.world.adventures.events.includes('snow_built')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'frosty-snowman.jpg'), type: 'jpeg', quality: 85 });
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
