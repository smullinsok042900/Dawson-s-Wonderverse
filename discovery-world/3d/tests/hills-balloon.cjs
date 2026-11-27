// (build 162) FLY THE HOT-AIR BALLOON in Balloon Hills: next to it, a tap puts her in the basket; HOLD ▲ to fire the burner
// and rise, let go to sink gently, ◀ ▶ drift; three stars at different heights; a soft landing; JUMP hops out.
// usage: NODE_PATH=$(npm root -g) node tests/hills-balloon.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(-683)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'balloon' && i.x === -684), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -683; P.vx = 0; __DDW3.G.interact.find(i => i.disc === 'balloon' && i.x === -684).run(); });
  check('next to the balloon, a tap puts her in the basket', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'hotair', null, 10000));
  const y = () => ev(() => __DDW3.player.ride ? __DDW3.player.ride.y : -1);
  await page.keyboard.down('ArrowUp'); await sleep(2500); const up = await y(); await page.keyboard.up('ArrowUp'); await sleep(2500); const after = await y();
  check('HOLD ▲ fires the burner and the balloon rises; let go and it sinks gently', up > 1.5 && after < up && after > 0, `${up.toFixed(1)} -> ${after.toFixed(1)}`);
  // fly it like she would: burner on and off to reach each star's height, drifting right
  let held = null; const hold = async k => { if (held === k) return; if (held) await page.keyboard.up(held); held = k; if (k) await page.keyboard.down(k); };
  for (let n = 0; n < 600; n++) { const s = await ev(() => { const R = __DDW3.player.ride; if (!R) return null; const want = [[-688, 4], [-680, 7.5], [-672, 10.5]][Math.min(2, R.n)]; return { x: R.x, y: R.y, n: R.n, wx: want[0], wy: want[1] - 2.5 }; });
    if (!s || s.n >= 3) break; await hold(s.y < s.wy - .3 ? 'ArrowUp' : null); if (s.y > s.wy - 1.5) { const k2 = s.x < s.wx - .5 ? 'ArrowRight' : s.x > s.wx + .5 ? 'ArrowLeft' : null; if (k2) { await page.keyboard.down(k2); await sleep(120); await page.keyboard.up(k2); } } await sleep(80); }
  await hold(null);
  check('she flies it up to the three stars (low, middle, high): "What a balloon pilot!"', await ev(() => __DDW3.world.disc.has('balloonstars')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'hills-balloon.jpg'), type: 'jpeg', quality: 85 });
  check('letting go, it floats down to a soft landing', await until(() => __DDW3.player.ride && __DDW3.player.ride.y <= 0, null, 40000));
  await page.keyboard.press(' '); check('JUMP hops out', await until(() => !__DDW3.player.ride, null, 5000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
