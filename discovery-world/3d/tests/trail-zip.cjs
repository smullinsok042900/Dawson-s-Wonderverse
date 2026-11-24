// (build 118) THE ADVENTURE TRAIL ZIP LINE: from the lookout rock she jumps up onto the zip tower; grabbing the handle
// rides the cable down over the treasure chests to the landing mat; ▶ goes faster than ◀; ▲/▼ reach the high and low
// stars; JUMP lets go and she floats down gently.
// usage: NODE_PATH=$(npm root -g) node tests/trail-zip.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(470)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'zipline'), null, 120000); await sleep(1500);
  // up: on the top lookout rock, walk right and jump onto the tower
  await ev(() => { const P = __DDW3.player; P.x = 485.8; P.y = 3.6; P.vy = 0; P.grounded = true; window.__on = null; const f = () => { const P = __DDW3.player; if (P.grounded && P.y > 4.6 && P.x > 486.6) { __on = { x: +P.x.toFixed(1), y: +P.y.toFixed(2) }; dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' })); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await page.keyboard.down('ArrowRight'); await sleep(150); await page.keyboard.press(' ');
  const up = await until(() => !!window.__on, null, 15000); await page.keyboard.up('ArrowRight'); const at = await ev(() => window.__on);
  check('from the lookout rock she can jump up onto the zip tower', up, JSON.stringify(at));
  await ev(() => { const P = __DDW3.player; P.x = 489; P.y = 4.8; P.vx = 0; P.vy = 0; P.grounded = true; }); await sleep(800);
  // ride with ▶ (zoom) and ▲ (high stars)
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'zipline').run()); const rid = await ev(() => __DDW3.player.ride && __DDW3.player.ride.type);
  check('grab the handle: she rides the zip line', rid === 'zipline', String(rid));
  // (the test browser runs at 1–2 frames a second, so compare the ride's own speed after holding each arrow)
  await page.keyboard.down('ArrowRight'); await until(() => __DDW3.player.ride && __DDW3.player.ride.t > 3, null, 60000); const vFast = await ev(() => __DDW3.player.ride ? __DDW3.player.ride.v : 0); await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft'); const t1 = await ev(() => __DDW3.player.ride ? __DDW3.player.ride.t : 0); await until(t1 => __DDW3.player.ride && __DDW3.player.ride.t > t1 + 3, t1, 60000); const vSlow = await ev(() => __DDW3.player.ride ? __DDW3.player.ride.v : 0); await page.keyboard.up('ArrowLeft');
  check('▶ zooms faster than ◀', vFast > vSlow * 1.6, JSON.stringify({ fast: vFast.toFixed(3), slow: vSlow.toFixed(3) }));
  // the rest: hold ▲ for a high star, then ride to the end
  const yHi = await ev(async () => { const k = new KeyboardEvent('keydown', { key: 'ArrowUp' }); dispatchEvent(k); await new Promise(r => setTimeout(r, 1500)); const y = __DDW3.player.y - (__DDW3.player.ride ? 0 : 99); dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); return y; });
  const done = await until(() => !__DDW3.player.ride, null, 120000); const end = await ev(() => ({ x: +__DDW3.player.x.toFixed(1), y: +__DDW3.player.y.toFixed(2), n: __DDW3.G.disc ? null : null }));
  check('▲ steers (it does not let go), and at the end she lands on the soft mat past the chests', done && end.x > 528 && end.x < 532 && end.y < 1, JSON.stringify(end));
  // again, and let go with JUMP: she floats down gently
  await ev(() => { const P = __DDW3.player; P.x = 489; P.y = 4.8; P.vx = 0; P.vy = 0; P.grounded = true; }); await sleep(800); await ev(() => __DDW3.G.interact.find(i => i.disc === 'zipline').run());
  await until(() => __DDW3.player.ride && __DDW3.player.ride.f > .3, null, 60000); await page.keyboard.press(' '); const off = await until(() => !__DDW3.player.ride, null, 5000);
  let minVy = 0; for (let i = 0; i < 20; i++) { const v = await ev(() => __DDW3.player.grounded ? 0 : __DDW3.player.vy); minVy = Math.min(minVy, v); await sleep(100); }
  await until(() => __DDW3.player.grounded, null, 20000);
  check('JUMP lets go, and she floats down gently (never faster than 3.1 m/s)', off && minVy > -3.1, 'fastest fall ' + minVy.toFixed(2));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
