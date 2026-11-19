// (build 104) THE VENUS LOG RIDE TOGETHER, with two independent browsers in one Play Together room (the local test relay,
// 120 ms of network delay). Both fly to Venus and stand at the log station; A sets off; B, standing there, hops in behind A;
// on the way each sees the other in the log (B's log is where A is; A sees B in the seat behind); they get out together.
// usage: NODE_PATH=$(npm root -g) node tests/log-together.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
(async () => {
  const PORT = 18798, relay = start(PORT, { latency: 120 }), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.setDefaultTimeout(120000); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500); return p; };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const A = await open(), B = await open();
  await A.locator('#mpBtn').tap(); await sleep(300); await A.locator('#mpPanel .mpBig[data-a=create]').tap();
  const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
  await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpBig[data-a=join]').tap(); await sleep(200);
  for (const i of [...room].map(ch => 'ABCDEFGHJKMN'.indexOf(ch))) { await B.locator(`#mpPanel .mpKey[data-k="${i}"]`).tap(); await sleep(150); }
  check('both players are in one room', await until(B, r => __DDW3.G.mp.room === r, room) && await until(A, () => __DDW3.G.mp.others.size === 1));
  for (const p of [A, B]) await p.evaluate(() => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); });
  // both fly to Venus and stand at the log station
  for (const p of [A, B]) await p.evaluate(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(q => q[0] === 'venus')));
  for (const p of [A, B]) await until(p, () => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 300000);
  for (const p of [A, B]) { const X = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1); await p.evaluate(x => { __DDW3.player.x = x; }, X + 120); } // (walk near the log ride: it is built as she comes near)
  const there = (await Promise.all([A, B].map(p => until(p, () => __DDW3.G.venusLog && __DDW3.G.venusLog.alive(), null, 120000)))).every(Boolean);
  const st = await A.evaluate(() => __DDW3.G.venusLog.st);
  for (const [p, dx] of [[A, 0], [B, 1.5]]) await p.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.z = 0; P.vx = P.vy = 0; }, st + dx); await sleep(2500);
  check('both on Venus at the log station', there, JSON.stringify({ st }));
  await A.evaluate(() => __DDW3.G.interact.find(i => i.disc === 'venuslogride').run());
  const aOn = await until(A, () => __DDW3.player.ride && __DDW3.player.ride.type === 'logride', null, 20000);
  const bOn = await until(B, () => __DDW3.player.ride && __DDW3.player.ride.type === 'logride' && __DDW3.player.ride.passenger, null, 60000);
  check('A sets off in the log, and B (standing at the station) hops in behind A', aOn && bOn, JSON.stringify({ aOn, bOn }));
  await sleep(8000);
  // (each screen is compared with itself, in one frame: the two pages run at 1–2 fps, a second apart)
  const midB = await B.evaluate(() => { const L = __DDW3.G.venusLog, o = [...__DDW3.G.mp.others.values()][0], P = __DDW3.player;
    return { riding: !!(P.ride && P.ride.passenger), logToA: o ? +L.log.position.distanceTo(o.model.root.position).toFixed(2) : null, meToLog: +Math.hypot(P.x - L.log.position.x, P.z - L.log.position.z).toFixed(2), y: +P.y.toFixed(1) }; });
  const midA = await A.evaluate(() => { const L = __DDW3.G.venusLog, o = [...__DDW3.G.mp.others.values()][0], w = L.seatBehind([0, 0, 0]);
    return { riding: !!__DDW3.player.ride, snap: o && o.snap ? +Math.hypot(o.model.root.position.x - w[0], o.model.root.position.z - w[2]).toFixed(2) : null }; });
  check('on the way: on B\'s screen the log carries A, with B in the seat behind; on A\'s screen B sits behind A', midB.riding && midB.logToA != null && midB.logToA < 1.2 && midB.meToLog < 1.2 && midA.riding && midA.snap != null && midA.snap < .5, JSON.stringify({ midB, midA }));
  const aDone = await until(A, () => !__DDW3.player.ride, null, 300000), bDone = await until(B, () => !__DDW3.player.ride, null, 30000);
  const ends = await Promise.all([A, B].map(p => p.evaluate(s => +(__DDW3.player.x - s).toFixed(1), st)));
  const bLog = await B.evaluate(() => !__DDW3.G.venusLog.busy);
  check('they get out together at the end of the ride', aDone && bDone && Math.abs(ends[0] - ends[1]) < 3 && bLog, JSON.stringify({ aDone, bDone, ends, bLog }));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close(); process.exit(fail ? 1 : 0);
})();
