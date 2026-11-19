// (build 101) Play Together: friends see your friend AND your outfit. Two independent browsers in one room (the local test
// relay). A picks Bloop and puts on a crown and sunglasses; on B's screen, A's character is Bloop wearing exactly those.
// usage: NODE_PATH=$(npm root -g) node tests/dress-together.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
(async () => {
  const PORT = 18795, relay = start(PORT), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
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
  // A dresses up Bloop
  await A.locator('#dressBtn').tap(); await sleep(500); await A.locator('#dressPanel .dKid[aria-label="bloop"]').tap(); await sleep(800);
  await A.locator('#dressPanel .dTab[aria-label="head"]').tap(); await A.locator('#dressPanel button[aria-label="crown"]').tap(); await sleep(200);
  await A.locator('#dressPanel .dTab[aria-label="face"]').tap(); await A.locator('#dressPanel button[aria-label="sunglasses"]').tap(); await sleep(200);
  await A.locator('#dressPanel .dDone').tap();
  const seen = await until(B, () => { const o = [...__DDW3.G.mp.others.values()][0]; const w = o && o.model && o.model.parts && o.model.parts.worn; return !!(o && o.kind === 'bloop' && w && w.head && w.head.userData.acc === 'crown' && w.face && w.face.userData.acc === 'sunglasses'); }, null, 30000);
  check('on B\'s screen, A is Bloop wearing the crown and the sunglasses', seen, JSON.stringify(await B.evaluate(() => { const o = [...__DDW3.G.mp.others.values()][0]; const w = (o && o.model && o.model.parts && o.model.parts.worn) || {}; return { kind: o && o.kind, head: w.head && w.head.userData.acc, face: w.face && w.face.userData.acc }; })));
  // A takes the glasses off: B sees them go
  await A.locator('#dressBtn').tap(); await sleep(400); await A.locator('#dressPanel .dTab[aria-label="face"]').tap(); await A.locator('#dressPanel button[aria-label="sunglasses"]').tap(); await A.locator('#dressPanel .dDone').tap();
  check('A takes the sunglasses off: B sees them go (the crown stays)', await until(B, () => { const o = [...__DDW3.G.mp.others.values()][0], w = o && o.model && o.model.parts && o.model.parts.worn; return !!(w && !w.face && w.head); }, null, 30000));
  check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close(); process.exit(fail ? 1 : 0);
})();
