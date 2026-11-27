// (build 100) RIDING THE MOON COASTER TOGETHER, with two independent browsers in one Play Together room (the local test
// relay). B stands on the station platform; A starts the coaster: B hops on in the next seat, and each one sees the
// other sitting in their own seat on the same train (desktop, software rendering).
// (build 164) COASTER=volcano runs the same checks on the Volcano Island roller coaster (first person).
// usage: NODE_PATH=$(npm root -g) [COASTER=volcano] node tests/coaster-together.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
const PLACE = process.env.COASTER === 'volcano' ? 'volcano' : 'moon', CO = PLACE === 'volcano' ? 'volcanoCoaster' : 'moonCoaster', DISC = PLACE === 'volcano' ? 'volcanocoasterride' : 'coaster';
(async () => {
  const PORT = 18791, relay = start(PORT), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap({ timeout: 120000 }); /* (build 164: the start screen draws every character's picture since build 143: slow on this machine) */ await sleep(1500); return p; };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const A = await open(), B = await open();
  await A.locator('#mpBtn').tap(); await sleep(300); await A.locator('#mpPanel .mpBig[data-a=create]').tap();
  const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
  await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpBig[data-a=join]').tap(); await sleep(200);
  for (const i of [...room].map(ch => 'ABCDEFGHJKMN'.indexOf(ch))) { await B.locator(`#mpPanel .mpKey[data-k="${i}"]`).tap(); await sleep(150); }
  check('both players are in one room', await until(B, r => __DDW3.G.mp.room === r, room) && await until(A, () => __DDW3.G.mp.others.size === 1));
  for (const p of [A, B]) { await p.evaluate(pl => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(q => q[0] === pl)); }, PLACE); }
  for (const p of [A, B]) await p.waitForFunction(co => __DDW3.player.layer === 'space' && !__DDW3.player.ride && __DDW3.G[co] && __DDW3.G[co].ready, CO, { timeout: 400000 });
  const st = await A.evaluate(co => __DDW3.G[co].stationX, CO);
  if (PLACE === 'moon') check('the coaster station is close to the rocket (within 80 m)', await A.evaluate(() => { const r = __DDW3.G.rockets && __DDW3.G.rockets.moon; const S = __DDW3.G.moonCoaster.stationX; return r ? Math.abs(S - r.x) < 80 : Math.abs(S - __DDW3.G.spaceBounds[0]) < 90; }), `station at +${Math.round(st - await A.evaluate(() => __DDW3.G.spaceBounds[0]))}`);
  // B waits on the platform; A gets on and the train sets off
  await B.evaluate(x => { const P = __DDW3.player; P.x = x - 4; P.y = 0; P.z = 0; P.vx = 0; P.grounded = true; }, st);
  await A.evaluate(x => { const P = __DDW3.player; P.x = x - 2; P.y = 0; P.z = 0; }, st); await sleep(2500);
  await A.evaluate(d => __DDW3.G.interact.find(i => i.disc === d).run(), DISC);
  const hop = await until(B, () => __DDW3.player.ride && __DDW3.player.ride.type === 'coaster', null, 60000);
  const seatB = await B.evaluate(() => __DDW3.player.ride && __DDW3.player.ride.seat);
  check('standing on the platform, B hops on when A\'s train sets off, in the next seat', hop && seatB === 1, JSON.stringify({ hop, seatB }));
  await sleep(6000);
  const seen = async (p, who) => p.evaluate(([who, co]) => { const mp = __DDW3.G.mp, o = [...mp.others.values()][0], C = __DDW3.G[co], R = __DDW3.player.ride; if (!o || !R) return { none: true };
    const want = who, i = Math.max(0, R.i - Math.min(2, want) * C.CAR_GAP), j = Math.floor(i), sx = C.pos[j * 3] + C.up[j * 3] * .55, sy = C.pos[j * 3 + 1] + C.up[j * 3 + 1] * .55 - .25, sz = C.pos[j * 3 + 2] + C.up[j * 3 + 2] * .55, m = o.model.root.position;
    return { snapped: !!o.snap, d: +Math.hypot(m.x - sx, m.y - sy, m.z - sz).toFixed(2), visible: o.model.root.visible }; }, [who, CO]);
  const onA = await seen(A, 1), onB = await seen(B, 0);
  check('on A\'s screen, B sits in seat 1 of A\'s train; on B\'s screen, A sits in the front seat', onA.snapped && onA.d < 1.5 && onA.visible && onB.snapped && onB.d < 1.5 && onB.visible, JSON.stringify({ onA, onB }));
  for (const p of [A, B]) await p.evaluate(() => { const R = __DDW3.player.ride; if (R) R.skip = true; }); await sleep(3000);
  check('both get off safely', !(await A.evaluate(() => !!__DDW3.player.ride)) && !(await B.evaluate(() => !!__DDW3.player.ride)));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close && relay.close(); process.exit(fail ? 1 : 0);
})();
