// (build 171) SURF THE GREAT RED SPOT on Jupiter: a tap and she rides a little cloud round the storm; ▲ in toward the eye,
// ▼ out to the rim; five storm stars at different distances; JUMP hops back to the path.
// usage: NODE_PATH=$(npm root -g) node tests/jupiter-stormsurf.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'jupiter'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 50); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'redspot'), null, 60000); await sleep(1000);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'redspot').run());
  check('a tap: she hops on a cloud and the storm carries her round', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'stormsurf' && __DDW3.player.z < -2, null, 10000));
  const a0 = await ev(() => __DDW3.player.ride.a); await until(a => __DDW3.player.ride && Math.abs(__DDW3.player.ride.a - a) > 1, a0, 60000);
  check('round and round the storm', Math.abs((await ev(() => __DDW3.player.ride.a)) - a0) > 1);
  await page.keyboard.down('ArrowUp'); const inw = await until(() => __DDW3.player.ride && __DDW3.player.ride.r < 1, null, 60000); await page.keyboard.up('ArrowUp');
  check('▲ steers her in toward the eye', inw);
  // catch the five stars like she would: ▲ ▼ to each star's distance as the storm carries her round
  const RST = [1.95, 1.0, 1.6, .62, 1.3]; let held = {};
  const hold = async (k, on) => { if (!!held[k] === on) return; held[k] = on; if (on) await page.keyboard.down(k); else await page.keyboard.up(k); };
  for (let n = 0; n < 1500; n++) { const s = await ev(() => { const r = __DDW3.player.ride; return r ? { r: r.r, a: r.a, got: r.got } : null; }); if (!s) break;
    const left = s.got.map((g, q) => g ? null : q).filter(q => q !== null); if (!left.length) break;
    const SA = [.9, 2.2, 3.4, 4.5, 5.6], wrap = d => ((d % 6.283) + 6.283) % 6.283, next = left.sort((p, q) => wrap(s.a - SA[p]) - wrap(s.a - SA[q]))[0], tr = RST[next];
    await hold('ArrowUp', s.r > tr + .05); await hold('ArrowDown', s.r < tr - .05); await sleep(60); }
  for (const k of Object.keys(held)) await hold(k, false);
  check('▲ ▼ steer her to all five storm stars', await ev(() => __DDW3.world.disc.has('redspotstars')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'jupiter-stormsurf.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.press(' '); check('JUMP hops her back onto the path', await until(() => !__DDW3.player.ride && __DDW3.player.z === 0 && __DDW3.player.y < .3, null, 10000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
