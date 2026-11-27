// (build 169) RIDE THE ICY GEYSER on Neptune: a tap next to it and the fountain carries her up; HOLD ▲ higher (to 18 m), let
// go and it sinks; ◀ ▶ lean; four snowflake stars to catch; JUMP hops off and she floats gently down.
// usage: NODE_PATH=$(npm root -g) node tests/neptune-geyser.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'neptune'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 62); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'triton'), null, 60000); await sleep(1000);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'triton').run());
  check('next to the icy geyser, a tap: the fountain carries her up', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'geyser', null, 10000));
  await page.keyboard.down('ArrowUp'); await until(() => __DDW3.player.ride && __DDW3.player.ride.h > 6, null, 60000); await page.keyboard.up('ArrowUp');
  const h1 = await ev(() => __DDW3.player.ride.h); await until(h => __DDW3.player.ride && __DDW3.player.ride.h < h - 1, h1, 60000); const h2 = await ev(() => __DDW3.player.ride.h);
  check('HOLD ▲ shoots her higher; let go and it sinks', h1 > 5 && h2 < h1, `${h1.toFixed(1)} -> ${h2.toFixed(1)}`);
  // catch the four snowflake stars like she would: lean ◀ ▶ toward each, ▲ to its height
  const GS = [[-1.6, 4], [1.6, 8], [-1.8, 12], [1.4, 16.5]]; let held = {};
  const hold = async (k, on) => { if (!!held[k] === on) return; held[k] = on; if (on) await page.keyboard.down(k); else await page.keyboard.up(k); };
  for (let n = 0; n < 900; n++) { const s = await ev(() => { const r = __DDW3.player.ride; return r ? { y: __DDW3.player.y + .6, got: r.got, lean: r.lean } : null; }); if (!s) break;
    const q = s.got.findIndex(g => !g); if (q < 0) break; const [tl, ty] = GS[q];
    await hold('ArrowRight', s.lean < tl - .4); await hold('ArrowLeft', s.lean > tl + .4); await hold('ArrowUp', s.y < ty - .5); await sleep(60); }
  for (const k of Object.keys(held)) await hold(k, false);
  check('◀ ▶ lean and ▲ climb to catch all four snowflake stars', await ev(() => __DDW3.world.disc.has('geyserstars')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'neptune-geyser.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.press(' '); check('JUMP hops off and she floats gently down', await until(() => !__DDW3.player.ride && __DDW3.player.y < .3, null, 60000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
