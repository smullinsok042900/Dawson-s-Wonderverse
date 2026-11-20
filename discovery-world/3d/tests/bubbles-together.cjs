// (build 106) MAGIC BUBBLES in Play Together, with two independent browsers in one room (the local test relay, 120 ms of
// network delay): A blows a bubble at B; B is trapped and floats up (A sees B inside the bubble, high up); B pops it with
// 💥; B falls and lands safely and can walk again; B cannot be bubbled again straight away; B blows one back at A, whose
// bubble pops by itself; no bubbles on a ride; the 🫧 switch in the room panel turns them off.
// usage: NODE_PATH=$(npm root -g) node tests/bubbles-together.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
(async () => {
  const PORT = 18799, relay = start(PORT, { latency: 120 }), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.setDefaultTimeout(120000); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500); return p; };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const A = await open(), B = await open();
  check('no 🫧 button outside a room', !(await A.locator('#bubbleBtn.show').count()));
  await A.locator('#mpBtn').tap(); await sleep(300); await A.locator('#mpPanel .mpBig[data-a=create]').tap();
  const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
  await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpBig[data-a=join]').tap(); await sleep(200);
  for (const i of [...room].map(ch => 'ABCDEFGHJKMN'.indexOf(ch))) { await B.locator(`#mpPanel .mpKey[data-k="${i}"]`).tap(); await sleep(150); }
  check('both players are in one room', await until(B, r => __DDW3.G.mp.room === r, room) && await until(A, () => __DDW3.G.mp.others.size === 1));
  for (const p of [A, B]) await p.evaluate(() => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); });
  for (const [p, x] of [[A, 20], [B, 26]]) await p.evaluate(x => { __DDW3.teleport(x); __DDW3.player.facing = x < 23 ? 1 : -1; }, x); await sleep(3000);
  check('in a room, both see the big 🫧 button', await A.locator('#bubbleBtn.show').isVisible() && await B.locator('#bubbleBtn.show').isVisible());
  // A blows at B
  await A.locator('#bubbleBtn').tap();
  const bIn = await until(B, () => __DDW3.G.bubbles.trapped, null, 20000);
  check('A taps 🫧: a bubble flies to B, and B is trapped inside it (with a big 💥 to pop it)', bIn && await B.locator('#bubbleEsc.show').isVisible());
  const rise = await B.evaluate(() => new Promise(res => { const P = __DDW3.player, y0 = 0; let top = 0; const t0 = performance.now(); const f = () => { top = Math.max(top, P.y); if (performance.now() - t0 > 3500 || !__DDW3.G.bubbles.trapped) return res(+top.toFixed(1)); requestAnimationFrame(f); }; f(); }));
  const aSees = await until(A, () => { const o = [...__DDW3.G.mp.others.values()][0]; return !!(o && o.bubM && o.bubM.visible && o.model.root.position.y > 2.5); }, null, 20000);
  check('B floats up high inside the bubble, and A sees B up there inside the bubble', rise > 4 && aSees, JSON.stringify({ rise, aSees }));
  await B.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'bubble-inside.jpg'), quality: 75, type: 'jpeg' });
  await A.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'bubble-friend.jpg'), quality: 75, type: 'jpeg' });
  // B pops it early with 💥
  await B.locator('#bubbleEsc').tap();
  const bDown = await until(B, () => !__DDW3.G.bubbles.trapped && !__DDW3.G.bubbles.inAir && __DDW3.player.grounded && !__DDW3.player.ride && __DDW3.player.y < .3, null, 30000);
  const aPop = await until(A, () => { const o = [...__DDW3.G.mp.others.values()][0]; return !!(o && !o.bubM); }, null, 20000);
  check('B taps 💥: the bubble pops (A sees it pop too), B falls, bounces and lands safely on the ground', bDown && aPop, JSON.stringify({ bDown, aPop }));
  const walk = await B.evaluate(() => new Promise(res => { const P = __DDW3.player, x0 = P.x; __DDW3.keys.right = true; setTimeout(() => { __DDW3.keys.right = false; res(+(P.x - x0).toFixed(1)); }, 1500); }));
  check('afterwards B walks normally', walk > .5, `moved ${walk} m`);
  // straight away again: B is safe for a while
  await sleep(3200); await A.locator('#bubbleBtn').tap(); await sleep(4000);
  check('B cannot be bubbled again straight away (the bubble just pops on B)', !(await B.evaluate(() => __DDW3.G.bubbles.trapped)));
  // B blows one back at A; A's bubble pops by itself after a few seconds
  await sleep(5000); await B.evaluate(() => { __DDW3.player.facing = -1; }); await B.locator('#bubbleBtn').tap();
  const aIn = await until(A, () => __DDW3.G.bubbles.trapped, null, 20000);
  const aDone = aIn && await until(A, () => !__DDW3.G.bubbles.trapped && !__DDW3.G.bubbles.inAir && __DDW3.player.grounded && !__DDW3.player.ride, null, 60000);
  check('B blows one back at A: A is trapped, floats, and the bubble pops by itself; A lands safely', aIn && aDone, JSON.stringify({ aIn, aDone }));
  // no bubbles on a ride: B on the train
  await sleep(9000); await B.evaluate(() => { const h = __DDW3.train.STATIONS.findIndex(s => s.e === '🏠'); __DDW3.teleport(__DDW3.train.STATIONS[h].x); }); await sleep(1500);
  await B.evaluate(() => { const h = __DDW3.train.STATIONS.findIndex(s => s.e === '🏠'); __DDW3.train.call(h); }); const bRide = await until(B, () => __DDW3.player.ride && __DDW3.player.ride.type === 'train', null, 60000);
  await A.evaluate(() => { const P = __DDW3.player; const o = [...__DDW3.G.mp.others.values()][0]; __DDW3.teleport(o.model.root.position.x - 5); P.facing = 1; }); await sleep(2000);
  await A.locator('#bubbleBtn').tap(); await sleep(4000);
  check('no bubbles while riding (B on the train stays on the train)', bRide && !(await B.evaluate(() => __DDW3.G.bubbles.trapped)) && await B.evaluate(() => !!(__DDW3.player.ride && __DDW3.player.ride.type === 'train')));
  await B.evaluate(() => __DDW3.train.hopOff()); await sleep(1500);
  // the switch: B turns bubbles off in the room panel
  await B.locator('#mpBtn').tap(); await sleep(400); await B.locator('#mpPanel [data-a=bubbles]').tap(); await sleep(300);
  const offNow = await B.evaluate(() => __DDW3.G.bubbles.off()); await B.evaluate(() => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); });
  await A.evaluate(() => { const o = [...__DDW3.G.mp.others.values()][0]; __DDW3.teleport(o.model.root.position.x - 5); __DDW3.player.facing = 1; }); await sleep(4000);
  await A.locator('#bubbleBtn').tap(); await sleep(5000);
  check('with 🫧 switched off in the room panel, B is never bubbled (and B\'s own 🫧 button is hidden)', offNow && !(await B.evaluate(() => __DDW3.G.bubbles.trapped)) && !(await B.locator('#bubbleBtn.show').count()));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close(); process.exit(fail ? 1 : 0);
})();
