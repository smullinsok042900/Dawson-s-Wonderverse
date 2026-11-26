// (build 152) THE FARM TRACTOR, hands-on: tap it and she climbs into the driver's seat; ◀ ▶ drive it along the field; each of
// the four pumpkins she drives up to is scooped into the trailer; all four: "You harvested all the pumpkins!"; JUMP hops off
// and the tractor goes back home.
// usage: NODE_PATH=$(npm root -g) node tests/farm-tractor.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(-522)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'tractor'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -523; P.y = 0; P.vx = 0; P.grounded = true; __DDW3.G.interact.find(i => i.disc === 'tractor').run(); });
  check('tap the tractor: she climbs into the driver\'s seat', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'tractor' && __DDW3.player.y > 1, null, 10000));
  const drive = async (key, toX) => { await page.keyboard.down(key); const ok = await until(([toX, l]) => l ? __DDW3.player.ride.x <= toX : __DDW3.player.ride.x >= toX, [toX, key === 'ArrowLeft'], 60000); await page.keyboard.up(key); return ok; };
  const x0 = await ev(() => __DDW3.player.ride.x); await drive('ArrowLeft', -527.6); const x1 = await ev(() => __DDW3.player.ride.x);
  check('◀ drives it along the field (she drives it, with her in the seat)', x1 < x0 - 3 && await ev(() => Math.abs(__DDW3.player.x - __DDW3.player.ride.x) < 1), `${x0} -> ${x1}`);
  check('driving up to a pumpkin scoops it into the trailer', await until(() => __DDW3.player.ride.n === 1, null, 10000));
  await drive('ArrowRight', -508.5);
  check('▶ back across the field: all four pumpkins in the trailer, "You harvested all the pumpkins!"', await until(() => __DDW3.world.disc.has('pumpkins'), null, 10000) && await ev(() => __DDW3.player.ride.n === 4));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'farm-tractor.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.press(' '); check('JUMP hops off', await until(() => !__DDW3.player.ride, null, 5000));
  check('the tractor goes back home, and the pumpkins grow back', await until(() => { let ok = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && Math.abs(o.position.z + 5.4) < .01 && o.position.y === 0 && o.position.x < -505 && o.position.x > -530) ok++; }); return ok >= 4; }, null, 15000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
