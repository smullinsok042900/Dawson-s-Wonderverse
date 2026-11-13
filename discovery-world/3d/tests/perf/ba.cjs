// before/after: identical scenarios on two builds (iPhone screen size and identity; software rendering)
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
for (const f of process.argv.slice(2)) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: UA }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) __lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { } });
  const t0 = Date.now(); await p.goto('file://' + require('path').resolve(f) + '?hq'); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); const load = Date.now() - t0;
  const bootLong = await p.evaluate(() => { const l = __lt.slice(); return { n: l.length, max: Math.max(0, ...l.map(x => x[1])), sum: l.reduce((a, x) => a + x[1], 0) }; });
  await p.locator('#playBtn').tap(); await sleep(2000);
  const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const frames = () => p.evaluate(() => __DDW3.G.perfMon.stats().n + __DDW3.G.perfMon._f || 0);
  const out = { load: (load / 1000).toFixed(1) + 's', bootLongMax: bootLong.max, bootLongSum: bootLong.sum };
  // identical scenarios: walk 8 s in the park, the creature area and the castle; enter and leave the house
  for (const [name, x] of [['park', 150], ['creatures', 230], ['castle', 392]]) {
    await p.evaluate(x => __DDW3.teleport(x), x); await sleep(3000);
    const m0 = await metric(), f0 = await p.evaluate(() => { window.__fc = 0; const loop = () => { __fc++; if (window.__fcOn) requestAnimationFrame(loop); }; window.__fcOn = 1; requestAnimationFrame(loop); return 0; }); await p.evaluate(() => { __lt.length = 0; __DDW3.keys.right = true; }); await sleep(8000);
    const r = await p.evaluate(() => { __DDW3.keys.right = false; window.__fcOn = 0; const i = __DDW3.info(); return { fc: __fc, lt: __lt.slice(), tris: i.tris, calls: i.calls }; }); const m1 = await metric();
    out[name] = { scriptMsPerFrame: +((m1.ScriptDuration - m0.ScriptDuration) * 1000 / Math.max(1, r.fc)).toFixed(1), frames: r.fc, longTasks: r.lt.length, longestTask: Math.max(0, ...r.lt.map(x => x[1])), tris: Math.round(r.tris / 1000) + 'k', calls: r.calls };
  }
  for (const [name, x, back] of [['enter house', 190, 0], ['leave house', 1003.2, 1]]) {
    await p.evaluate(x => __DDW3.teleport(x), x); await sleep(2500); await p.evaluate(() => { __lt.length = 0; __DDW3.G.doAction(); }); await sleep(4000);
    const lt = await p.evaluate(() => __lt.slice()); out[name] = { longTasks: lt.length, longestTask: Math.max(0, ...lt.map(q => q[1])), layer: await p.evaluate(() => __DDW3.player.layer) };
  }
  if (await p.evaluate(() => !!__DDW3.G.expansion)) {
    // the new neighbourhoods: walk from the castle into them (streaming while walking), and jump there with the map
    await p.evaluate(() => __DDW3.teleport(392)); await sleep(2500); await p.evaluate(() => { __lt.length = 0; __DDW3.keys.right = true; }); await sleep(30000);
    const w = await p.evaluate(() => { __DDW3.keys.right = false; return { x: Math.round(__DDW3.player.x), lt: __lt.slice(), st: __DDW3.G.expansion.stats() }; });
    out['walk into new area'] = { reachedX: w.x, longTasks: w.lt.length, longestTask: Math.max(0, ...w.lt.map(q => q[1])), streaming: w.st };
    await p.evaluate(() => { __lt.length = 0; }); await p.locator('#mapBtn').tap(); await sleep(300); await p.locator('.mpT').nth(9).tap(); await sleep(5000);
    const lt = await p.evaluate(() => __lt.slice()); out['map jump to Art Plaza'] = { longestTask: Math.max(0, ...lt.map(q => q[1])), longTasks: lt.length };
    for (const [name, x] of [['trail', 470], ['toytown', 600], ['labgarden', 720], ['artplaza', 850]]) { await p.evaluate(x => { __DDW3.teleport(x); __DDW3.G.expansion.buildNow(x); }, x); await sleep(3000); const i = await p.evaluate(() => __DDW3.info()); out['new: ' + name] = { tris: Math.round(i.tris / 1000) + 'k', calls: i.calls }; }
  }
  const mem = await p.evaluate(() => ({ heapMB: Math.round(performance.memory.usedJSHeapSize / 1e6), geos: __DDW3.renderer.info.memory.geometries, tex: __DDW3.renderer.info.memory.textures, progs: __DDW3.renderer.info.programs.length }));
  out.memory = mem; console.log('=== ' + f + '\n' + JSON.stringify(out, null, 1));
  await ctx.close(); }
await b.close(); })();
