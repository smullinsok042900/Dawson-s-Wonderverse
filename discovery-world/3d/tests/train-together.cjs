// (build 102) RIDING THE EARTH TRAIN TOGETHER, with two independent browsers in one Play Together room (the local test relay,
// 120 ms of network delay). A gets on and drives; B's train is the same train (it follows A); B hops on as a passenger in the
// seat behind; they ride to the 🌈 station together (each sees the other in their seat); A gets off and B gets off too.
// usage: NODE_PATH=$(npm root -g) node tests/train-together.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
(async () => {
  const PORT = 18797, relay = start(PORT, { latency: 120 }), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
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
  // both at the 🏠 station; A gets on
  const home = await A.evaluate(() => __DDW3.train.STATIONS.findIndex(s => s.e === '🏠')), hx = await A.evaluate(h => __DDW3.train.STATIONS[h].x, home);
  for (const [p, dx] of [[A, 0], [B, 1.5]]) await p.evaluate(x => __DDW3.teleport(x), hx + dx); await sleep(2500);
  await A.evaluate(h => __DDW3.train.call(h), home); const aOn = await until(A, () => __DDW3.player.ride && __DDW3.player.ride.type === 'train', null, 60000);
  const follows = await until(B, () => __DDW3.G.train.following, null, 30000);
  check('A gets on the train; on B\'s screen it is the same train (it follows A)', aOn && follows);
  // B hops on (taps the train)
  await sleep(1500); await B.evaluate(() => __DDW3.G.trainJoin()); const bOn = await until(B, () => __DDW3.player.ride && __DDW3.player.ride.passenger, null, 20000);
  const seatB = await B.evaluate(() => __DDW3.player.ride && __DDW3.player.ride.seat);
  check('B hops on as a passenger, in the seat behind A', bOn && seatB === 1, JSON.stringify({ bOn, seatB }));
  // A drives to the 🌈 station; on the way B stays in the same train, and each sees the other in their seat
  const rb = await A.evaluate(() => __DDW3.train.STATIONS.findIndex(s => s.e === '🌈')); await A.evaluate(i => __DDW3.train.goTo(i), rb);
  await sleep(6000);
  // (each screen is compared with itself, in one frame: the two pages run at 1–2 fps, so their own clocks differ by a second)
  const mid = await B.evaluate(() => { const TR = __DDW3.G.train, o = [...__DDW3.G.mp.others.values()][0], w = TR.seatWorld(__DDW3.player.ride ? __DDW3.player.ride.seat : 1, new __DDW3.THREE.Vector3());
    return { riding: !!(__DDW3.player.ride && __DDW3.player.ride.passenger), following: TR.following, inSeat: +Math.abs(__DDW3.player.x - w.x).toFixed(2), trainToA: o ? +Math.abs(TR.seatX() - o.model.root.position.x).toFixed(2) : null, moving: Math.abs(TR.state.vs) }; });
  const snapA = await A.evaluate(() => { const o = [...__DDW3.G.mp.others.values()][0], w = __DDW3.G.train.seatWorld(1, new __DDW3.THREE.Vector3()); return o && o.snap ? +Math.abs(o.model.root.position.x - w.x).toFixed(2) : null; });
  check('on the way, B rides in its seat on the same train as A (on B\'s screen the train is where A is), and A sees B in the seat behind', mid.riding && mid.following && mid.inSeat < .5 && mid.trainToA != null && mid.trainToA < 3 && snapA != null && snapA < .5, JSON.stringify({ ...mid, snapA }));
  const arrivedA = await until(A, i => Math.abs(__DDW3.train.seatX() - __DDW3.train.STATIONS[i].x) < .6, rb, 180000);
  await sleep(1500); await A.evaluate(() => __DDW3.train.hopOff());
  const bOff = await until(B, () => !__DDW3.player.ride, null, 20000), bx = await B.evaluate(() => __DDW3.player.x), sx = await A.evaluate(i => __DDW3.train.STATIONS[i].x, rb);
  check('A gets off at the 🌈 station, and B gets off there too', arrivedA && bOff && Math.abs(bx - sx) < 6, JSON.stringify({ arrivedA, bOff, dx: +(bx - sx).toFixed(1) }));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close(); process.exit(fail ? 1 : 0);
})();
