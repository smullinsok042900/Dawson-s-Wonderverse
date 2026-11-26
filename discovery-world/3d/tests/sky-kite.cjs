// (build 143) THE SKY KINGDOM'S RAINBOW KITE: tap the kite on the cloud path and she rides it on its string; ◀ ▶ swing it
// across the sky, ▲ lets the string out (higher), ▼ pulls it in; she steers to all six stars; JUMP lets go and she floats
// gently down onto the clouds.
// usage: NODE_PATH=$(npm root -g) node tests/sky-kite.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(41, 9.5)); await sleep(3000);
  await ev(() => { const P = __DDW3.player; P.x = 41.5; P.y = 9.5; P.vx = P.vy = 0; P.grounded = true; __DDW3.G.interact.find(i => i.disc === 'skykite').run(); });
  check('tap the rainbow kite: she rides it', await ev(() => __DDW3.player.ride && __DDW3.player.ride.type === 'kite'));
  const pos = () => ev(() => ({ x: __DDW3.player.x, y: __DDW3.player.y }));
  const seg = async k => { const a = await pos(); await page.keyboard.down(k); await sleep(1500); await page.keyboard.up(k); const z = await pos(); return { dx: +(z.x - a.x).toFixed(2), dy: +(z.y - a.y).toFixed(2) }; };
  const up = await seg('ArrowUp'), right = await seg('ArrowRight'), down = await seg('ArrowDown');
  check('▲ lets the string out (higher), ▶ swings her across, ▼ pulls her back in', up.dy > .8 && right.dx > .8 && down.dy < -.8, JSON.stringify({ up, right, down }));
  // steer to each star (as she would): swing toward it, string out or in to reach it
  let held = new Set(); const want = async ks => { for (const k of [...held]) if (!ks.includes(k)) { await page.keyboard.up(k); held.delete(k); } for (const k of ks) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); } };
  for (let n = 0; n < 1500; n++) { const s = await ev(() => { const P = __DDW3.player, R = P.ride; if (!R || R.type !== 'kite' || R.n >= 6) return null; const AX = 41, AY = 10.9; let best = null; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'OctahedronGeometry' && o.geometry.parameters.radius === .3) { const d = Math.hypot(o.position.x - P.x, o.position.y - P.y - .7); if (!best || d < best.d) best = { d, x: o.position.x, y: o.position.y }; } }); if (!best) return null;
      const ta = Math.atan2(best.x - AX, best.y - AY), tl = Math.hypot(best.x - AX, best.y - AY), ca = Math.atan2(P.x - AX, P.y + .9 - AY), cl = Math.hypot(P.x - AX, P.y + .9 - AY); return { da: ta - ca, dl: tl + .2 - cl }; });
    if (!s) break; await want([...(s.da > .06 ? ['ArrowRight'] : s.da < -.06 ? ['ArrowLeft'] : []), ...(s.dl > .25 ? ['ArrowUp'] : s.dl < -.25 ? ['ArrowDown'] : [])]); await sleep(80); }
  await want([]);
  check('she catches all six kite stars', await ev(() => __DDW3.world.disc.has('kitestars')), String(await ev(() => __DDW3.player.ride && __DDW3.player.ride.n)));
  await page.keyboard.press(' '); const off = await until(() => !__DDW3.player.ride, null, 5000);
  let minVy = 0; for (let i = 0; i < 200; i++) { /* (she may let go 20 m up: floating down at 3 m/s takes a while) */ const v = await ev(() => __DDW3.player.grounded ? 0 : __DDW3.player.vy); minVy = Math.min(minVy, v); if (await ev(() => __DDW3.player.grounded)) break; await sleep(100); }
  const land = await ev(() => ({ g: __DDW3.player.grounded, y: +__DDW3.player.y.toFixed(2) }));
  check('JUMP lets go, and she floats gently down onto the clouds', off && minVy > -3.1 && land.g && land.y >= 9.4, JSON.stringify({ minVy: +minVy.toFixed(2), ...land }));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
