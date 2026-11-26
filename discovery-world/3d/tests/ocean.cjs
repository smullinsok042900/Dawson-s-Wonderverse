// (build 145) SAIL THE OCEAN TO JUNGLE ISLAND (the family's request): she climbs into the beach boat and sails the open
// ocean (◀ ▶ steer, ▲ faster), the 🗺️ map sails her to Jungle Island, ⚓ lands; on the island: the vine swings, through the
// waterfall into the cave and its treasure, the treehouses (rope ladder, rope bridge, zip line); the island's boat sails
// her back out to sea; Home Harbour (🏠) brings her back to the beach.
// usage: NODE_PATH=$(npm root -g) node tests/ocean.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  // board at the beach
  await ev(() => __DDW3.teleport(-114)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'ocean'), null, 120000); await sleep(1500);
  await ev(() => { __DDW3.player.x = -114.5; __DDW3.G.interact.find(i => i.disc === 'ocean').run(); });
  check('tap the beach boat: she climbs in and sails out onto the open ocean', await until(() => __DDW3.player.layer === 'ocean' && __DDW3.G.ocean.active(), null, 120000));
  await sleep(1500); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'ocean-sail.jpg'), type: 'jpeg', quality: 85 });
  const st = () => ev(() => __DDW3.G.ocean.state());
  const a = await st(); await page.keyboard.down('ArrowUp'); await sleep(2500); await page.keyboard.down('ArrowRight'); await sleep(1500); await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowUp'); const z = await st();
  check('▲ sails faster and ◀ ▶ steer: the boat moves across the sea', Math.hypot(z.x - a.x, z.z - a.z) > 5 && z.speed > 1, JSON.stringify({ a, z }));
  check('she sits in the boat, seen by the camera (not hidden)', await ev(() => !__DDW3.G.playerHidden && !!__DDW3.G.camOverride));
  await ev(() => __DDW3.G.ocean.sailTo('jungle'));
  check('the 🗺️ map sails her to Jungle Island by itself', await until(() => __DDW3.G.ocean.state() && __DDW3.G.ocean.state().near === 'jungle', null, 300000), JSON.stringify(await st()));
  await ev(() => __DDW3.G.ocean.land());
  check('⚓ lands her on Jungle Island', await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'jungle', null, 120000));
  await sleep(2000); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'jungle-arrive.jpg'), type: 'jpeg', quality: 85 });
  const JX = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  // the vine swings: grab the first vine, JUMP as she swings forward, three times, and she lands on the far stump
  await ev(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 32; P.y = 0; P.vx = 0; P.grounded = true; __DDW3.G.interact.find(i => i.disc === 'jungleswing').run(); }, JX);
  check('she grabs a vine and swings', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'vine', null, 10000));
  for (let n = 0; n < 400; n++) { const r = await ev(() => { const R = __DDW3.player.ride; return R ? { t: R.type, a: R.ang, w: R.w } : null; }); if (!r) { if (await ev(() => __DDW3.world.disc.has('jungleswing'))) break; } else if (r.t === 'vine' && r.w > .3 && r.a > 0) await page.keyboard.press(' '); await sleep(100); }
  check('JUMP as she swings forward leaps from vine to vine, all the way across the mud', await until(() => __DDW3.world.disc.has('jungleswing'), null, 20000), JSON.stringify(await ev(X => ({ x: __DDW3.player.x - X, y: __DDW3.player.y }), JX)));
  // the waterfall cave and its treasure
  await ev(X => { const P = __DDW3.player; P.ride = null; P.x = X + 110 + 52; P.y = 0; P.vx = 0; P.grounded = true; }, JX); await sleep(6000);
  await ev(() => __DDW3.G.interact.find(i => i.action === 'Through the waterfall!').run()); await sleep(1500);
  check('she walks right through the waterfall into the hidden cave', await ev(() => __DDW3.player.z < -4 && __DDW3.world.disc.has('watercave')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'jungle-cave.jpg'), type: 'jpeg', quality: 85 });
  await ev(() => __DDW3.G.interact.find(i => i.icon === '🧰').run());
  check('the treasure chest in the cave: gems and gold!', await ev(() => __DDW3.world.disc.has('jungletreasure')));
  await ev(() => __DDW3.G.interact.find(i => i.action === 'Go outside').run()); await sleep(1500);
  // the treehouses: up the ladder (walking), over the rope bridge, the zip line down
  await ev(X => { const P = __DDW3.player; P.x = X + 220 + 13; P.y = 0; P.vx = 0; P.grounded = true; P.z = 0; P.groundZ = 0; }, JX); await sleep(6000);
  await ev(() => { window.__top = 0; const f = () => { const P = __DDW3.player; if (P.grounded) window.__top = Math.max(window.__top, P.y); if (performance.now() < window.__tE) requestAnimationFrame(f); }; window.__tE = performance.now() + 40000; f(); });
  await page.keyboard.down('ArrowRight'); const zipped = await until(() => __DDW3.world.disc.has('junglezip'), null, 40000); await page.keyboard.up('ArrowRight');
  const top = await ev(() => window.__top);
  check('she climbs the rope ladder, crosses the rope bridge and rides the zip line down (all by walking)', zipped && top > 6.4, 'highest ' + top.toFixed(2));
  check('the jungle pets live here (Coco the monkey and Rio the parrot)', await ev(() => ['pet_jmonkey', 'pet_jparrot'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
  // back to the boat, out to sea, and home
  await ev(X => { const P = __DDW3.player; P.ride = null; P.x = X + 2; P.y = 0; P.grounded = true; }, JX); await sleep(3000);
  await ev(() => __DDW3.G.interact.find(i => i.icon === '⛵' && i.action === 'Sail away!').run());
  check("the island's boat sails her back out to sea", await until(() => __DDW3.player.layer === 'ocean' && __DDW3.G.ocean.active(), null, 60000));
  await ev(() => __DDW3.G.ocean.sailTo('home'));
  check('the map sails her back to Home Harbour', await until(() => __DDW3.G.ocean.state() && __DDW3.G.ocean.state().near === 'home', null, 300000));
  await ev(() => __DDW3.G.ocean.land());
  check('🏠 takes her home to the beach, by the boat', await until(() => __DDW3.player.layer === '' && Math.abs(__DDW3.player.x + 113) < 2, null, 60000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
