// (build 175) MOON EXPLORER: tap the flag pole and the big flag goes up; tap it again and it changes colour; 🐾 in each of
// the four glowing rings plants a little flag in her colour; all four: "You explored the Moon!".
// usage: NODE_PATH=$(npm root -g) node tests/moon-flags.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'moon'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 38); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'moonflag'), null, 60000); await sleep(1000);
  const flagCol = () => ev(() => { let c = null; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.geometry.parameters.width - 1.15) < 1e-6) c = o.material.color.getHexString(); }); return c; });
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'moonflag').run()); check('a tap plants the big flag', await until(() => __DDW3.world.disc.has('moonflag'), null, 10000));
  await sleep(1500); const c0 = await flagCol(); await ev(() => __DDW3.G.interact.find(i => i.disc === 'moonflag').run()); await sleep(300); const c1 = await flagCol();
  check('another tap gives the flag a new colour', c0 && c1 && c0 !== c1, `${c0} -> ${c1}`);
  for (const dx of [26, 54, 68, 100]) { await ev(x => { const P = __DDW3.player; P.x = x; P.vx = 0; }, X + dx); await sleep(700); await page.keyboard.press('e'); await sleep(700); }
  const minis = await ev(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.position && Math.abs(o.position.z + 1.6) < 1e-6 && o.geometry.attributes.position.count < 200 && o.material.side === 2) n++; }); return n; });
  check('🐾 in each glowing ring plants a little flag: "You explored the Moon!"', await until(() => __DDW3.world.disc.has('moonexplorer'), null, 10000), `${minis} little flags`);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'moon-flags.jpg'), type: 'jpeg', quality: 85 });
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
