// bug sweep: walk the whole outdoor world in both directions; report where you get stuck, stalls, errors, and pet overlaps
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }); const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text().slice(0, 160)); });
await p.goto('file://' + require('path').resolve(process.argv[2]) + '?test'); await sleep(3000); await p.locator('#playBtn').tap(); await sleep(800);
// simulate the game faster than real time: step physics directly so the sweep covers the world quickly
const stuck = [];
for (const [from, to, dir] of [[2, 900, 1], [900, -266, -1]]) {
  await p.evaluate(([x]) => __DDW3.teleport(x), [from]); await sleep(1000);
  await p.evaluate(dir => { __DDW3.keys[dir > 0 ? 'right' : 'left'] = true; }, dir);
  let lastX = from, still = 0;
  for (let i = 0; i < 400; i++) { await sleep(700); const s = await p.evaluate(() => ({ x: __DDW3.player.x, y: __DDW3.player.y, ride: __DDW3.player.ride && __DDW3.player.ride.type, layer: __DDW3.player.layer, act: !!__DDW3.G.activityOpen }));
    if (s.y < -1) { await p.evaluate(([x, dir]) => __DDW3.teleport(x + dir * 5), [s.x, dir]); stuck.push(['underground (intended: lift/ball pit)', Math.round(s.x)]); lastX = s.x + dir * 5; continue; }
    if (s.ride || s.layer || s.act) { await p.evaluate(() => { const P = __DDW3.player; P.ride = null; P.layer = ''; if (__DDW3.G.learning.isOpen()) __DDW3.G.learning.close(); }); stuck.push(['detour', Math.round(s.x), s.ride || s.layer || 'activity']); }
    if (Math.abs(s.x - lastX) < .3) { still++; if (still === 3) { stuck.push(['STUCK', +s.x.toFixed(1), +s.y.toFixed(1)]); await p.evaluate(dir => { const P = __DDW3.player; P.vy = 9.4; P.grounded = false; P.jumps = 1; }, dir); } if (still > 6) { await p.evaluate(dir => { __DDW3.player.x += dir * 3; }, dir); still = 0; } } else still = 0;
    lastX = s.x; if ((dir > 0 && s.x >= to) || (dir < 0 && s.x <= to)) break; }
  await p.evaluate(() => { __DDW3.keys.left = __DDW3.keys.right = false; });
}
console.log('stuck/detours:', JSON.stringify(stuck));
console.log('errors:', JSON.stringify(errs.slice(0, 10)));
await b.close(); })();
