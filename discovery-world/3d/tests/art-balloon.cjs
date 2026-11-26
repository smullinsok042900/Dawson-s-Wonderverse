// (build 141) ART PLAZA'S PAINT-POT BALLOON: tap the balloon and it floats her up over the plaza; ▲ climbs, ▼ sinks; she
// steers to catch the six paint drops (each at its own height); at the far end she comes down softly; all six paint a
// rainbow across the sky; JUMP hops off and she floats down gently.
// usage: NODE_PATH=$(npm root -g) node tests/art-balloon.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(813)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'paintballoon'), null, 120000); await sleep(1500);
  const ride = async () => { await ev(() => { const P = __DDW3.player; P.x = 813; P.y = 0; P.vx = P.vy = 0; P.grounded = true; P.ride = null; }); await sleep(600); await ev(() => __DDW3.G.interact.find(i => i.disc === 'paintballoon').run()); };
  await ride(); const rid = await ev(() => __DDW3.player.ride && __DDW3.player.ride.type);
  check('tap the paint-pot balloon: she rides it', rid === 'paintballoon', String(rid));
  check('it floats her up', await until(() => __DDW3.player.ride && __DDW3.player.ride.y > 4.5, null, 20000));
  const seg = async key => { await page.keyboard.down(key); const a = await ev(() => __DDW3.player.ride.y); await sleep(1500); const z = await ev(() => __DDW3.player.ride ? __DDW3.player.ride.y : null); await page.keyboard.up(key); return z == null ? null : +(z - a).toFixed(2); };
  const upD = await seg('ArrowUp'), dnD = await seg('ArrowDown');
  check('▲ climbs and ▼ sinks', upD > .5 && dnD < -.5, JSON.stringify({ upD, dnD }));
  // steer to each paint drop's height in turn (like she would: up and down with the arrows)
  let held = null; const hold = async k => { if (held === k) return; if (held) await page.keyboard.up(held); held = k; if (k) await page.keyboard.down(k); };
  for (let n = 0; n < 900; n++) { const s = await ev(() => { const P = __DDW3.player, R = P.ride; if (!R || R.type !== 'paintballoon') return null; const want = [[829, 6.5], [842, 9.5], [855, 5.5], [868, 8.5], [880, 6], [892, 10]].find(([x]) => x > R.x - 1); return { y: R.y, want: want ? want[1] - 1.4 : null }; });
    if (!s) break; await hold(s.want == null ? null : s.y < s.want - .3 ? 'ArrowUp' : s.y > s.want + .3 ? 'ArrowDown' : null); await sleep(100); }
  await hold(null);
  const end = await ev(() => ({ ride: !!__DDW3.player.ride, x: +__DDW3.player.x.toFixed(1), y: +__DDW3.player.y.toFixed(2), rainbow: __DDW3.world.disc.has('paintrainbow') }));
  check('at the far end of the plaza she comes down softly', !end.ride && end.x > 896 && end.y < .6, JSON.stringify(end));
  check('she caught all six paint drops, and a rainbow is painted across the sky', end.rainbow, JSON.stringify(end));
  // again, and hop off with JUMP: she floats down gently
  await ride(); await until(() => __DDW3.player.ride && __DDW3.player.ride.y > 5, null, 20000); await sleep(1500); await page.keyboard.press(' '); const off = await until(() => !__DDW3.player.ride, null, 5000);
  let minVy = 0; for (let i = 0; i < 20; i++) { const v = await ev(() => __DDW3.player.grounded ? 0 : __DDW3.player.vy); minVy = Math.min(minVy, v); await sleep(100); }
  check('JUMP hops off, and she floats down gently', off && minVy > -3.1, 'fastest fall ' + minVy.toFixed(2));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
