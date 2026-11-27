// (build 168) RIDE THE MARS DUST DEVIL: a tap next to it scoops her up into the whirl; ▲ spins higher, ▼ lower, ◀ ▶ steer it;
// four dust sparkles at different heights to twirl through; JUMP lets go and she floats gently down.
// usage: NODE_PATH=$(npm root -g) node tests/mars-dustdevil.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'mars'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 62); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'dustdevil'), null, 60000); await sleep(1000);
  await ev(() => { const i = __DDW3.G.interact.find(i => i.disc === 'dustdevil'); __DDW3.player.x = i.x - 1; i.run(); });
  check('next to the dust devil, a tap scoops her up into the whirl', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'dustdevil', null, 10000));
  const R = () => ev(() => { const r = __DDW3.player.ride; return r ? { h: r.h, got: r.got.filter(Boolean).length, x: __DDW3.G.interact.find(i => i.disc === 'dustdevil').x } : null; });
  await page.keyboard.down('ArrowUp'); await until(() => __DDW3.player.ride && __DDW3.player.ride.h > 5, null, 60000); await page.keyboard.up('ArrowUp');
  const up = await R(); check('▲ spins it faster and lifts her higher', up && up.h > 4, JSON.stringify(up));
  // fly through the four sparkles like she would: steer ◀ ▶ to each and go ▲ ▼ to its height (X+60, +67, +62, +68; 3.5, 6.5, 9.5, 12.2 m)
  const SP = [[-4, 3.5], [3, 6.5], [-2, 9.5], [4, 12.2]]; let held = {};
  const hold = async (k, on) => { if (!!held[k] === on) return; held[k] = on; if (on) await page.keyboard.down(k); else await page.keyboard.up(k); };
  for (let n = 0; n < 900; n++) { const s = await ev(() => { const r = __DDW3.player.ride; if (!r) return null; return { h: r.h, got: r.got, x: __DDW3.G.interact.find(i => i.disc === 'dustdevil').x }; }); if (!s) break;
    const q = s.got.findIndex(g => !g); if (q < 0) break; const tx = X + 64 + SP[q][0], ty = SP[q][1];
    await hold('ArrowRight', s.x < tx - .6); await hold('ArrowLeft', s.x > tx + .6); await hold('ArrowUp', s.h < ty - .5); await hold('ArrowDown', s.h > ty + .5); await sleep(60); }
  for (const k of Object.keys(held)) await hold(k, false);
  check('◀ ▶ ▲ ▼ steer her through all four dust sparkles: "What a whirl!"', await ev(() => __DDW3.world.disc.has('dustdevilstars')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'mars-dustdevil.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.press(' '); check('JUMP lets go and she floats gently down to the ground', await until(() => !__DDW3.player.ride && __DDW3.player.y < .3, null, 60000));
  await ev(x => { __DDW3.player.x = x; }, X + 150);
  check('the dust devil drifts back to its place', await until(x => Math.abs(__DDW3.G.interact.find(i => i.disc === 'dustdevil').x - x) < 2.2, X + 64, 60000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
