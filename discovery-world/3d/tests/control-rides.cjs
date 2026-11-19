// (build 71) Rides you control: Neptune bungee + Big Sky Dive, Mars climbing wall + trampoline park (desktop, software rendering).
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').click(); await sleep(2500);
  let fails = 0; const check = (n, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  — ' + info : '')); if (!ok) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  const fly = async id => { await ev(id => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === id)), id); await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 }); return ev(() => __DDW3.G.spaceBounds[0] - 1); };
  const put = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = y; P.vx = P.vy = 0; P.z = 0; P.grounded = true; }, [x, y]);
  const run = d => ev(d => { const it = __DDW3.G.interact.find(i => i.disc === d); if (!it) return false; it.run(); return true; }, d);
  const keys = (o) => ev(o => Object.assign(__DDW3.keys, o), o);
  // ---- NEPTUNE ----
  let X;
  if (process.env.ONLY !== 'mars') {
  X = await fly('neptune'); await put(X + 150); await sleep(2000); await put(X + 250); await sleep(2500);
  await put(X + 136); await sleep(1500); await run('neptuneswing');
  const sw = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxA = 0, last = 0, flew = false; const f = () => { const R = P.ride;
    if (R && R.type === 'wswing') { maxA = Math.max(maxA, R.maxA || 0); if (performance.now() - last > 500) { last = performance.now(); R.onJump(); } }
    if (__DDW3.world.disc.has('neptuneswingfly')) flew = true; if ((!P.ride && performance.now() - t0 > 1000) || performance.now() - t0 > 90000) return res({ maxA, flew: flew || __DDW3.world.disc.has('neptuneswingfly') }); requestAnimationFrame(f); }; f(); }));
  check('wind swings: press JUMP to pump the swing higher, then let go at the top and fly onto the cloud cushion', sw.maxA > 1 && sw.flew, JSON.stringify(sw));
  await put(X + 186); await sleep(1500); await run('neptunebungeego');
  await page.waitForFunction(() => __DDW3.G.bungee && __DDW3.G.bungee.ph === 'ready', null, { timeout: 60000 }).catch(() => {});
  const waited = await ev(() => __DDW3.G.bungee.ph); await sleep(1500); const still = await ev(() => __DDW3.G.bungee.ph);
  await ev(() => __DDW3.player.ride.onJump()); await keys({ right: true });
  const bj = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let minY = 99, minYfall = 99, maxDx = 0, x0 = null, bounces = 0; const f = () => { const R = P.ride; if (R && R.type === 'bungee') { minY = Math.min(minY, P.y); if (__DDW3.G.bungee.ph === 'fall') minYfall = Math.min(minYfall, P.y); if (x0 == null) x0 = P.x; maxDx = Math.max(maxDx, Math.abs(P.x - x0)); bounces = R.bounces || 0; if (R.boing) R.onJump(); }
    if (!P.ride || performance.now() - t0 > 120000) return res({ minY, minYfall, maxDx, bounces, y: P.y, done: !P.ride }); requestAnimationFrame(f); }; f(); }));
  await keys({ right: false });
  check('bungee: waits on the board until YOU press JUMP', waited === 'ready' && still === 'ready');
  check('bungee: you fall on the cord, steer sideways, bounce, and are lowered to the ground', bj.done && bj.minY < 12 && bj.maxDx > 1 && bj.bounces >= 1 && bj.y < .3, JSON.stringify(bj));
  await put(X + 186); await sleep(1000); await run('neptunebungeego'); await page.waitForFunction(() => __DDW3.G.bungee && __DDW3.G.bungee.ph === 'ready', null, { timeout: 60000 }).catch(() => {});
  await keys({ left: true }); await sleep(800); await keys({ left: false }); const isGentle = await ev(() => __DDW3.player.ride && __DDW3.player.ride.big === false); await ev(() => __DDW3.player.ride.onJump());
  const gj = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let minY = 99, falling = true; const f = () => { const R = P.ride; if (R && R.type === 'bungee' && __DDW3.G.bungee.ph === 'fall') minY = Math.min(minY, P.y); if (!P.ride || performance.now() - t0 > 120000) return res({ minY, done: !P.ride, y: P.y }); requestAnimationFrame(f); }; f(); }));
  check('bungee: push ◀ for the GENTLE board: a shorter cord, a smaller fall, and back down', isGentle && gj.done && gj.minY > bj.minYfall + 2 && gj.y < .3, JSON.stringify({ isGentle, ...gj, bigMinY: bj.minYfall }));
  await put(X + 294); await sleep(1500); await run('neptuneskydivego2');
  await page.waitForFunction(() => __DDW3.G.skyDive && __DDW3.G.skyDive.ph === 'ready', null, { timeout: 60000 }).catch(() => {});
  await ev(() => { window.__rests = 0; const end = performance.now() + 900000; let t0 = 0; const f = () => { const S = __DDW3.G.skyDive, R = __DDW3.player.ride; if (S && R && S.ph === 'rest') { if (!t0) { t0 = performance.now(); window.__rests++; } else if (performance.now() - t0 > 1500) { R.onJump(); t0 = 0; } } if (performance.now() < end) requestAnimationFrame(f); }; f(); }); // (build 79: rest on a cloud island, then dive on)
  const top = await ev(() => __DDW3.player.y); await ev(() => __DDW3.player.ride.onJump()); await keys({ left: true });
  await page.waitForFunction(() => __DDW3.player.y < 50, null, { timeout: 60000 }).catch(() => {}); const xa = await ev(() => __DDW3.player.x); await keys({ left: false, right: true });
  await page.waitForFunction(() => __DDW3.player.y < 35, null, { timeout: 60000 }).catch(() => {}); const xb = await ev(() => __DDW3.player.x); await keys({ right: false });
  await ev(() => __DDW3.player.ride && __DDW3.player.ride.onJump()); await sleep(800); const chute = await ev(() => __DDW3.G.skyDive.ph);
  const tx = await ev(() => __DDW3.G.skyDive.tx);
  const land = await ev(tx => new Promise(res => { const D = __DDW3, P = D.player, t0 = performance.now(); const f = () => { D.keys.left = P.x > tx + .5; D.keys.right = P.x < tx - .5; if (!P.ride || performance.now() - t0 > 90000) { D.keys.left = D.keys.right = false; return res({ y: P.y, dx: P.x - tx, done: !P.ride }); } requestAnimationFrame(f); }; f(); }), tx);
  check('sky dive: the balloon takes you up high and waits for JUMP', top > 60, `top ${top.toFixed(1)}`);
  check('sky dive: you steer left and right while falling', xb - xa > 2, `moved ${(xb - xa).toFixed(1)} m right after going left`);
  check('sky dive: JUMP opens the parachute', chute === 'chute');
  check('sky dive: you steer to the target and land', land.done && land.y < .2 && Math.abs(land.dx) < 3.5 && await ev(() => __DDW3.world.disc.has('neptunebullseye')), JSON.stringify(land));
  await put(X + 294); await sleep(1500); await run('neptuneskydivego2'); await page.waitForFunction(() => __DDW3.G.skyDive && __DDW3.G.skyDive.ph === 'ready', null, { timeout: 60000 }).catch(() => {});
  const restOk = await ev(() => new Promise(res => { const S = __DDW3.G.skyDive, P = __DDW3.player; P.x = S.tx - 18; P.z = -3; S.R.onJump(); const t0 = performance.now(); let rested = false, tr = 0;
    const f = () => { if (S.ph === 'rest' && !rested) { rested = true; tr = performance.now(); } if (rested && S.ph === 'rest' && performance.now() - tr > 1500) S.R.onJump(); if ((rested && !P.ride) || performance.now() - t0 > 150000) return res({ rested, ride: !!P.ride, ph: S.ph, y: +P.y.toFixed(1), x: +(P.x - S.tx).toFixed(1) }); requestAnimationFrame(f); }; f(); }));
  check('sky dive: land on a floating cloud island, rest, then JUMP to dive on and land', restOk.rested && !restOk.ride && restOk.y < .3, JSON.stringify(restOk));
  }
  // ---- MARS ----
  X = await fly('mars'); await put(X + 150); await sleep(2000); await put(X + 250); await sleep(2500);
  const wx = X + 110 + 92.5; await put(wx); await sleep(1200); await run('marsclimbgo'); await keys({ up: true });
  await page.waitForFunction(() => __DDW3.player.y > 6, null, { timeout: 60000 }).catch(() => {}); await keys({ up: false, right: true }); await sleep(1500); const xr = await ev(() => __DDW3.player.x); await keys({ right: false, left: true }); await sleep(1500); const xl = await ev(() => __DDW3.player.x); await keys({ left: false, down: true }); const ya = await ev(() => __DDW3.player.y); await sleep(1200); const yb = await ev(() => __DDW3.player.y); await keys({ down: false });
  check('climbing: the joystick moves you up, down, left and right on the wall', xr - xl > .8 && yb < ya - .5, JSON.stringify({ xr: xr - wx, xl: xl - wx, ya, yb }));
  await keys({ up: true }); const ct = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); const f = () => { if (!P.ride || performance.now() - t0 > 90000) return res({ y: P.y, ride: !!P.ride }); requestAnimationFrame(f); }; f(); })); await keys({ up: false });
  check('climbing: climb all the way to the 30 m cliff top and stand on it', ct.y > 30, JSON.stringify(ct));
  await put(wx - 3); await sleep(500); await run('marsclimbgo'); await keys({ up: true }); await page.waitForFunction(() => __DDW3.player.y > 10.6, null, { timeout: 60000 }).catch(() => {}); await keys({ up: false, left: true }); await sleep(1500); await keys({ left: false });
  await ev(() => __DDW3.player.ride && __DDW3.player.ride.onJump()); await sleep(2500); const ledge = await ev(() => [__DDW3.player.y, __DDW3.player.grounded]);
  check('climbing: let go near the ledge and you rest on it', Math.abs(ledge[0] - 10.25) < .3, JSON.stringify(ledge));
  await put(wx - 6, 10.25); await sleep(500); await run('marscavetunnelgo'); await page.waitForFunction(() => __DDW3.player.ride, null, { timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => !__DDW3.player.ride, null, { timeout: 60000 }).catch(() => {}); const tun = await ev(() => [__DDW3.player.x, __DDW3.player.y]);
  check('the cave tunnel: from the first ledge, crawl through the rock to the new ledge on the other side, and find the cave gem', tun[0] > wx + 5 && Math.abs(tun[1] - 10.25) < .3 && await ev(() => __DDW3.world.disc.has('marscavegem')), JSON.stringify({ x: tun[0] - wx, y: tun[1] }));
  await put(wx + 10, 3); await ev(() => { __DDW3.player.grounded = false; __DDW3.player.vy = -1; __DDW3.keys.up = true; });
  const tr = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0; const f = () => { maxY = Math.max(maxY, P.y); if (performance.now() - t0 > 12000) return res({ maxY, y: P.y }); requestAnimationFrame(f); }; f(); })); await keys({ up: false });
  check('trampolines: hold ▲ to bounce much higher, up onto the high trampoline', tr.maxY > 19, JSON.stringify(tr));
  await put(wx, 30.3); await sleep(800); await keys({ right: true }); await page.waitForFunction(() => __DDW3.player.y < 29.8, null, { timeout: 30000 }).catch(() => {}); await keys({ right: false });
  const wo = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let lands = 0, up = true, pk = 0, peaks = []; const f = () => { if (P.y > 23) { up = true; pk = Math.max(pk, P.y - 20); } if (up && P.y < 21.6) { lands++; up = false; peaks.push(pk); pk = 0; } if (lands >= 3 || performance.now() - t0 > 60000) return res({ lands, peaks }); requestAnimationFrame(f); }; f(); }));
  check('walk off the cliff top onto the high trampoline and keep bouncing', wo.lands >= 3 && wo.peaks[1] > 4 && wo.peaks[2] > 4, JSON.stringify(wo));
  await put(X + 135, 2); await ev(() => { __DDW3.player.grounded = false; __DDW3.player.vy = -1; __DDW3.keys.up = true; });
  const ctr = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0; const f = () => { maxY = Math.max(maxY, P.y); if (performance.now() - t0 > 9000) return res({ maxY }); requestAnimationFrame(f); }; f(); })); await keys({ up: false });
  check("the canyon trampoline: hold ▲ to bounce high enough for the mesas, through the hoop", ctr.maxY > 9 && await ev(() => __DDW3.world.disc.has("marscanyonhoop")), JSON.stringify(ctr));
  await put(X + 110 + 45); await sleep(600); await keys({ right: true });
  const br = await ev(() => new Promise(res => { const t0 = performance.now(); const f = () => { if (__DDW3.world.disc.has('marsbouncewin') || performance.now() - t0 > 40000) return res({ won: __DDW3.world.disc.has('marsbouncewin'), next: __DDW3.G.bounceRace && __DDW3.G.bounceRace.next, x: __DDW3.player.x }); requestAnimationFrame(f); }; f(); })); await keys({ right: false });
  check('the bounce race: hold ▶ and bounce along all five trampolines, one each bounce, to win', br.won, JSON.stringify(br));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
