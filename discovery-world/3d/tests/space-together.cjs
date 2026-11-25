// (build 127) OPEN SPACE TOGETHER: two independent browsers in one Play Together room (the local test relay, 120 ms of
// network delay). Both fly up into open space; each sees the other's ROCKET out there (moving smoothly), and when one goes
// on a spacewalk the other sees them floating, as themselves. Desktop, software rendering.
// usage: NODE_PATH=$(npm root -g) node tests/space-together.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0, ok = 0; const check = (name, good, info = '') => { console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (good) ok++; else fail++; };
(async () => {
  const PORT = 18795, relay = start(PORT, { latency: 120 }), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async () => { const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500); return p; };
  const until = (p, fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  try {
    const A = await open(), B = await open();
    await A.locator('#mpBtn').tap(); await sleep(300); await A.locator('#mpPanel .mpBig[data-a=create]').tap();
    const room = await A.evaluate(() => new Promise(res => { const f = () => __DDW3.G.mp.room ? res(__DDW3.G.mp.room) : setTimeout(f, 100); f(); }));
    await B.locator('#mpBtn').tap(); await sleep(300); await B.locator('#mpPanel .mpBig[data-a=join]').tap(); await sleep(200);
    for (const i of [...room].map(ch => 'ABCDEFGHJKMN'.indexOf(ch))) { await B.locator(`#mpPanel .mpKey[data-k="${i}"]`).tap(); await sleep(150); }
    check('both players are in one room', await until(B, r => __DDW3.G.mp.room === r, room) && await until(A, () => __DDW3.G.mp.others.size === 1));
    for (const p of [A, B]) await p.evaluate(() => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); });
    // both fly up into open space (the 🌌 picture), then both fly to Mars
    for (const p of [A, B]) { await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; }); await p.evaluate(() => __DDW3.G.openRocket()); await until(p, () => document.querySelector('#rocketPanel.show'), null, 10000);
      await p.locator('#rocketPanel .rkT[data-id=deep]').tap(); }
    check('both are in open space', await until(A, () => __DDW3.G.deep.active(), null, 120000) && await until(B, () => __DDW3.G.deep.active(), null, 120000));
    for (const p of [A, B]) await p.evaluate(() => __DDW3.G.deep.flyTo('mars'));
    await until(A, () => __DDW3.G.deep.state()?.near === 'mars', null, 240000); await until(B, () => __DDW3.G.deep.state()?.near === 'mars', null, 240000); await sleep(1500);
    const seen = p => p.evaluate(() => { const o = [...__DDW3.G.mp.others.values()][0]; const P = __DDW3.player, r = o && o.deepRk; return { rk: !!(r && r.visible), d: r ? Math.hypot(r.position.x - P.x, r.position.y - P.y, r.position.z - P.z) : -1, avatar: !!(o && o.model && o.model.root.visible) }; });
    // (build 134) what a player sends from open space must pass the database rules the family already has (the relay used
    // here accepts anything; Firebase does not): only the fields of the rules published before build 128, no `dk`
    const sent = await A.evaluate(() => { const s = __DDW3.G.mp._state(); return Object.keys(s).filter(k => s[k] != null); });
    const OLD_RULES = ['x', 'y', 'z', 't', 'f', 'g', 'r', 'h', 'l', 'c', 'k', 'ps', 'a', 'b'];
    const ps = await A.evaluate(() => __DDW3.G.mp._state().ps);
    check('from open space she sends only fields the existing database rules accept (the rocket rides in the pets text)', sent.every(k => OLD_RULES.includes(k)) && /^~[-\d.]+,[-\d.]+,[-\d.]+,[-\d.]+$/.test(ps) && ps.length < 60, JSON.stringify({ sent, ps }));
    let a = await seen(A), bb = await seen(B);
    check('each sees the other\'s rocket out in space, close by at Mars', a.rk && bb.rk && a.d < 200 && bb.d < 200, JSON.stringify({ a, bb }));
    await A.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'space-together.jpg'), type: 'jpeg', quality: 85 });
    // B goes on a spacewalk: A sees B floating (as themselves), not just the rocket
    await B.evaluate(() => __DDW3.G.deep.startWalk()); await sleep(2500); a = await seen(A);
    check('when B floats outside, A sees B on the spacewalk', a.avatar, JSON.stringify(a));
    await B.evaluate(() => __DDW3.G.deep.back()); await until(B, () => __DDW3.G.deep.state()?.mode === 'fly', null, 30000); await sleep(2500); a = await seen(A);
    check('and back in the rocket, A sees just the rocket again', !a.avatar && a.rk, JSON.stringify(a));
    check('no page errors', !A.errs.length && !B.errs.length, [...A.errs, ...B.errs].slice(0, 3).join(' | '));
  } catch (e) { console.log('FAIL exception: ' + e.message); fail++; }
  finally { console.log(`${ok} checks passed`); await b.close(); relay.close && relay.close(); process.exit(fail ? 1 : 0); }
})();
