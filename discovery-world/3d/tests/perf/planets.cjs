// Planet travel and exploration cost (build 50): fly to every place and back home, walking each place end to end.
// Records long tasks (with where they happened), the longest gap between frames, slow shader waits, and memory at the
// end (geometries, textures, shader programs, JS heap). usage: NODE_PATH=$(npm root -g) node tests/perf/planets.cjs OLD.html NEW.html
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] }); const out = {};
for (const f of process.argv.slice(2)) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1' }); const p = await ctx.newPage();
  await p.addInitScript(() => { window.__lt = []; window.__slow = []; window.__gap = 0; let last = 0; const tick = t => { if (last && window.__DDW3 && window.__meas) window.__gap = Math.max(window.__gap, t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (window.__DDW3 && window.__meas) __lt.push([__DDW3.player.layer, Math.round(__DDW3.player.x), Math.round(e.duration)]); }).observe({ type: 'longtask' });
    const P = WebGL2RenderingContext.prototype, orig = P.getProgramParameter; P.getProgramParameter = function (prog, pn) { const t = performance.now(); const r = orig.call(this, prog, pn); const d = performance.now() - t; if (d > 30 && window.__meas) __slow.push([Math.round(__DDW3.player.x), Math.round(d)]); return r; }; });
  await p.goto('file://' + require('path').resolve(f), { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(3000);
  const pad = await p.evaluate(() => { __DDW3.G.adaptFrozen = true; const r = __DDW3.G.rockets && __DDW3.G.rockets.earth; return r ? r.x : 698; }); await p.evaluate(x => { __DDW3.teleport(x + 2); __DDW3.G.expansion.buildNow(x + 2); }, pad); await sleep(3000);
  await p.evaluate(() => { window.__meas = true; window.__gap = 0; });
  const res = { trips: [] };
  for (const id of ['moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'earth']) {
    const t0 = Date.now(); await p.evaluate(id => __DDW3.G.launchTo(id), id);
    await p.waitForFunction(id => { const P = __DDW3.player; return !P.ride && P.layer === (id === 'earth' ? '' : 'space'); }, id, { timeout: 120000 }); await sleep(1500);
    // walk the whole place, end to end (the expanded places are longer: walking checks the areas built on the way)
    if (id !== 'earth') { const B = await p.evaluate(() => __DDW3.G.spaceBounds); for (let x = B[0] + 15; x < B[1] - 2; x += 18) { await p.evaluate(x => { const P = __DDW3.player; P.x = x; P.y = 0; P.vy = 0; }, x); await sleep(700); } }
    res.trips.push([id, Date.now() - t0]); }
  await sleep(2000);
  res.memory = await p.evaluate(() => { const i = __DDW3.renderer.info; return { geos: i.memory.geometries, tex: i.memory.textures, progs: i.programs.length, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, taps: __DDW3.G.taps.length, interact: __DDW3.G.interact.length, platforms: __DDW3.G.platforms.length }; });
  res.longTasks = await p.evaluate(() => __lt); res.longest = Math.max(0, ...res.longTasks.map(q => q[2])); res.longTaskCount = res.longTasks.length; res.slowShaders = await p.evaluate(() => __slow); res.maxFrameGapMs = Math.round(await p.evaluate(() => __gap));
  out[f] = res; console.log(f, JSON.stringify(res)); await ctx.close(); }
await b.close(); })();
