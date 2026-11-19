// (build 100) THE SHARED ROCKET, with two independent browsers in one Play Together room (the local test relay, with
// 120 ms of network delay on every message). A climbs in and picks the Moon; B climbs into the same rocket: different
// seats, both faces in the windows; B says ready, A presses the button: one countdown, the same launch, both land on the
// Moon together, side by side. Then a seat that disconnects goes away by itself (desktop, software rendering).
// usage: NODE_PATH=$(npm root -g) node tests/rocket-together.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
(async () => {
  const PORT = 18793, relay = start(PORT, { latency: 120 }), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500); return p; };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const A = await open(), B = await open();
  await A.locator('#mpBtn').tap(); await sleep(300); await A.locator('#mpPanel .mpBig[data-a=create]').tap();
  const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
  await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpBig[data-a=join]').tap(); await sleep(200);
  for (const i of [...room].map(ch => 'ABCDEFGHJKMN'.indexOf(ch))) { await B.locator(`#mpPanel .mpKey[data-k="${i}"]`).tap(); await sleep(150); }
  check('both players are in one room', await until(B, r => __DDW3.G.mp.room === r, room) && await until(A, () => __DDW3.G.mp.others.size === 1));
  for (const p of [A, B]) await p.evaluate(() => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); });
  // both walk up to the launch pad on Earth
  for (const p of [A, B]) { await p.evaluate(() => { __DDW3.teleport(692); __DDW3.G.expansion.buildNow(692); }); await until(p, () => !!(__DDW3.G.rockets && __DDW3.G.rockets.earth), null, 60000); } /* (the rocket's district is built when you come near) */
  const rx = await A.evaluate(() => __DDW3.G.rockets.earth.x);
  for (const [p, dx] of [[A, -2], [B, 2]]) await p.evaluate(([x]) => { const P = __DDW3.player; P.layer = ''; P.x = x; P.y = 0; P.z = 0; P.vx = 0; P.grounded = true; }, [rx + dx]);
  await sleep(2500);
  // A climbs in and picks the Moon (the planet pictures)
  await A.evaluate(() => __DDW3.G.openRocket()); await until(A, () => __DDW3.player.ride && __DDW3.player.ride.phase === 'in', null, 20000);
  await until(A, () => document.querySelector('#rocketPanel.show'), null, 10000); await A.locator('#rocketPanel .rkT[data-id=moon]').tap(); await sleep(800);
  // B climbs into the SAME rocket: the Moon is already picked, a different seat
  await B.evaluate(() => __DDW3.G.openRocket()); const bIn = await until(B, () => __DDW3.player.ride && __DDW3.player.ride.phase === 'in' && __DDW3.player.ride.passenger, null, 20000);
  const seats = { A: await A.evaluate(() => __DDW3.player.ride.seat), B: await B.evaluate(() => __DDW3.player.ride && __DDW3.player.ride.seat), dB: await B.evaluate(() => __DDW3.player.ride && __DDW3.player.ride.dest) };
  check('B climbs into the same rocket, sees the planet A picked (the Moon), and takes a different seat', bIn && seats.A === 0 && seats.B === 1 && seats.dB === 'moon', JSON.stringify(seats));
  await sleep(1200);
  const faces = async p => p.evaluate(() => { const r = __DDW3.G.rockets.earth, w = r.g.userData.wins || []; return w.filter(q => q.f.visible).length; });
  const fA = await faces(A), fB = await faces(B);
  check('both faces show in the rocket\'s windows, on both screens', fA === 2 && fB === 2, JSON.stringify({ fA, fB }));
  // B says ready; A presses the big button: one countdown for both
  await B.evaluate(() => __DDW3.G.blastOff()); await sleep(800); await A.evaluate(() => __DDW3.G.blastOff());
  const rec = p => p.evaluate(() => new Promise(res => { const out = {}; const f = () => { const R = __DDW3.player.ride; if (R && R.type === 'rocket' && R.phase === 'lift' && !out.lift) out.lift = Date.now(); if (R && R.type === 'rocket' && R.phase === 'land' && !out.land) out.land = Date.now(); if (out.land && !R) { out.here = __DDW3.G.spaceHere(); out.x = __DDW3.player.x - __DDW3.G.spaceBounds[0]; out.ride = !!R; return res(out); } if (Date.now() - (window.__t0 || (window.__t0 = Date.now())) > 300000) return res({ ...out, timeout: true }); requestAnimationFrame(f); }; f(); }));
  const [ra, rb] = await Promise.all([rec(A), rec(B)]);
  check('one countdown: both rockets lift off at the same moment (within 0.5 s)', ra.lift && rb.lift && Math.abs(ra.lift - rb.lift) < 500, JSON.stringify({ dLift: rb.lift - ra.lift }));
  check('both land on the Moon together (within 2 s), and climb out side by side, not on top of each other', ra.here === 'moon' && rb.here === 'moon' && Math.abs(ra.land - rb.land) < 2000 && Math.abs(ra.x - rb.x) > 1, JSON.stringify({ A: ra, B: rb }));
  // a seat that disconnects: both climb in again; B loses the connection; A's rocket shows only A
  await sleep(2000); for (const p of [A, B]) await p.evaluate(() => __DDW3.G.openRocket());
  await until(A, () => __DDW3.player.ride && __DDW3.player.ride.phase === 'in', null, 20000); await until(B, () => __DDW3.player.ride && __DDW3.player.ride.phase === 'in', null, 20000); await sleep(1500);
  const before = await A.evaluate(() => [...__DDW3.G.mpLive.all().keys()].filter(k => k.startsWith('s_')).length);
  await B.evaluate(() => __DDW3.G.mp._drop()); await sleep(2500);
  const after = await A.evaluate(() => [...__DDW3.G.mpLive.all().keys()].filter(k => k.startsWith('s_')).length);
  check('a passenger who disconnects frees their seat (nobody is stuck waiting for them)', before === 2 && after === 1, JSON.stringify({ before, after }));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close(); process.exit(fail ? 1 : 0);
})();
