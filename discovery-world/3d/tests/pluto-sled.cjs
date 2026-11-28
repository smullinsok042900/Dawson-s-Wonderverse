// (build 174) THE HEART SLED on Pluto's ice plain: tap it and she sits in a heart sled; ◀ ▶ ▲ ▼ push it and it glides on the
// ice (and bumps gently off the edge); five pink ice hearts to collect; JUMP hops out.
// usage: NODE_PATH=$(npm root -g) node tests/pluto-sled.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'pluto'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 44); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'plutoheart'), null, 60000); await sleep(1000);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'plutoheart').run());
  check('a tap: she sits in the heart sled on the ice', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'heartsled', null, 10000));
  // a push, then let go: it keeps gliding on the ice
  await page.keyboard.down('ArrowRight'); await until(() => __DDW3.player.ride && __DDW3.player.ride.vx > 1.2, null, 30000); await page.keyboard.up('ArrowRight');
  const x1 = await ev(() => __DDW3.player.ride.x); await until(x => __DDW3.player.ride && __DDW3.player.ride.x > x + .3, x1, 30000); const x2 = await ev(() => __DDW3.player.ride.x); // (waits for frames, not a fixed time: 1-2 frames a second when drawing)
  check('a push, then let go: it keeps gliding on the ice', x2 > x1 + .3, `${x1.toFixed(1)} -> ${x2.toFixed(1)}`);
  // steer to each heart like she would (◀ ▶ ▲ ▼ nudges toward it)
  const HPOS = [[-5, -.3], [-2.2, -2.5], [1.4, 1.7], [3.6, -2.2], [5.3, .6]].map(([dx, dz]) => [X + 44.5 + dx, -.6 + dz]); let held = {};
  const hold = async (k, on) => { if (!!held[k] === on) return; held[k] = on; if (on) await page.keyboard.down(k); else await page.keyboard.up(k); };
  for (let n = 0; n < 1500; n++) { const s = await ev(() => { const r = __DDW3.player.ride; return r ? { x: r.x, z: r.z, vx: r.vx, vz: r.vz, got: r.got } : null; }); if (!s) break;
    const q = s.got.findIndex(g => !g); if (q < 0) break; const [tx, tz] = HPOS[q], wantVx = Math.max(-2, Math.min(2, (tx - s.x) * 1.2)), wantVz = Math.max(-2, Math.min(2, (tz - s.z) * 1.2));
    await hold('ArrowRight', s.vx < wantVx - .3); await hold('ArrowLeft', s.vx > wantVx + .3); await hold('ArrowDown', s.vz < wantVz - .3); await hold('ArrowUp', s.vz > wantVz + .3); await sleep(60); }
  for (const k of Object.keys(held)) await hold(k, false);
  check('◀ ▶ ▲ ▼ steer her to all five pink hearts: "Pluto loves you!"', await ev(() => __DDW3.world.disc.has('plutohearts')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'pluto-sled.jpg'), type: 'jpeg', quality: 85 });
  const inside = await ev(x => { const r = __DDW3.player.ride; return Math.hypot((r.x - x) / 6.6, (r.z + .6) / 3.1) <= 1.001; }, X + 44.5); check('the sled stays on the ice plain', inside);
  await page.keyboard.press(' '); check('JUMP hops her out onto the path', await until(() => !__DDW3.player.ride && __DDW3.player.z === 0 && __DDW3.player.y < .3, null, 10000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
