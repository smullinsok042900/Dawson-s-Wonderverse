// (build 74) The Mercury mirror maze: the gallery, the light-beam puzzle and the hidden mirror door (desktop, software rendering).
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').click(); await sleep(2500);
  let fails = 0; const check = (n, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  — ' + info : '')); if (!ok) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'mercury'))); await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 });
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1), x0 = X + 124;
  const put = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = y; P.vx = P.vy = 0; P.z = 0; P.grounded = true; }, [x, y]);
  const run = d => ev(d => { const it = __DDW3.G.interact.find(i => i.disc === d); if (!it) return false; it.run(); return true; }, d);
  const has = d => ev(d => __DDW3.world.disc.has(d), d);
  await put(X + 120); await page.waitForFunction(() => !!__DDW3.G.mazePlus, null, { timeout: 60000 }).catch(() => {});
  check('the maze grows: gallery, puzzle and hidden door are built', await ev(() => !!__DDW3.G.mazePlus));
  await put(x0 + 20); await sleep(500); await run('mercurygalleryup'); await page.waitForFunction(() => !__DDW3.player.ride && __DDW3.player.y > 4, null, { timeout: 30000 }).catch(() => {});
  const gy = await ev(() => __DDW3.player.y); check('one tap: up the mirror stairs to the upper gallery (a second route)', Math.abs(gy - 4.6) < .3, `y ${gy.toFixed(2)}`);
  await put(x0 + 38, 4.6); await sleep(500);
  const pz = await ev(() => { const M = __DDW3.G.mazePlus; for (let i = 0; i < 3; i++) { let n = 0; while (M.turns[i] !== 1 && n++ < 4) M.turn(i); } return { solved: M.solved, turns: M.turns }; });
  check('the light-beam puzzle: turn the three mirrors and the light shines through', pz.solved && await has('mercurybeam'), JSON.stringify(pz));
  await sleep(3000); await put(x0 + 66); await sleep(1500); check('the hidden mirror door opens to the maze treasure', await has('mercurymazetreasure'));
  // (build 99) the rotating mirror walls: walk right along the ground route from x0+30; each wall blocks you while it faces you, then turns and lets you through
  await ev(() => { const it = __DDW3.G.interact.find(i => i.disc === 'mercurydoor1'); it && it.run(); }); /* (the mirror door at +39 opens only when tapped) */
  await put(x0 + 30); await sleep(800); await ev(() => { for (const w of __DDW3.G.mazeRot) w.passed = false; __DDW3.keys.right = true; });
  const rw = await ev(x0 => new Promise(res => { const P = __DDW3.player, W = __DDW3.G.mazeRot, t0 = performance.now(); let blocked = 0, lastX = P.x; const f = () => { const w = W.find(w => Math.abs(P.x - w.wx) < 1.2); if (w && w.closed && Math.abs(P.x - lastX) < .01) blocked++; lastX = P.x;
    if (P.x > x0 + 52 || performance.now() - t0 > 90000) { __DDW3.keys.right = false; return res({ x: P.x - x0, blocked, passed: W.map(w => w.passed), disc: __DDW3.world.disc.has('mercuryrotwalls') }); } requestAnimationFrame(f); }; f(); }), x0);
  check('the rotating mirror walls: they block you while they face you, then turn and let you through', rw.x > 52 && rw.passed.every(Boolean) && rw.disc, JSON.stringify(rw));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
