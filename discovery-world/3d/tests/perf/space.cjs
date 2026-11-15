// before/after on the planets: identical scenarios on two builds (iPhone screen size; software rendering, NOT iPhone numbers)
// usage: node tests/perf/space.cjs old.html new.html
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
for (const f of process.argv.slice(2)) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: UA }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) __lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) { } });
  await p.goto('file://' + require('path').resolve(f) + '?hq'); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await p.locator('#playBtn').tap(); await sleep(2000);
  const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const ids = await p.evaluate(() => __DDW3.G.space.places.map(q => q[0])), out = {}; let sum = 0;
  for (let i = 0; i < ids.length; i++) {
    await p.evaluate(() => { __lt.length = 0; }); const progs0 = await p.evaluate(() => __DDW3.renderer.info.programs.length);
    await p.evaluate(i => __DDW3.G.space.goTo(i), i); await sleep(3500);
    const arrive = await p.evaluate(() => __lt.slice());
    const m0 = await metric(); await p.evaluate(() => { __lt.length = 0; window.__fc = 0; const loop = () => { __fc++; if (window.__fcOn) requestAnimationFrame(loop); }; window.__fcOn = 1; requestAnimationFrame(loop); __DDW3.keys.right = true; }); await sleep(6000);
    const r = await p.evaluate(() => { __DDW3.keys.right = false; window.__fcOn = 0; const n = __DDW3.info(); return { fc: __fc, lt: __lt.slice(), tris: n.tris, calls: n.calls, progs: __DDW3.renderer.info.programs.length }; }); const m1 = await metric();
    const ms = +((m1.ScriptDuration - m0.ScriptDuration) * 1000 / Math.max(1, r.fc)).toFixed(1); sum += ms;
    out[ids[i]] = { scriptMsPerFrame: ms, frames: r.fc, longTasksWalking: r.lt.length, longestWalking: Math.max(0, ...r.lt.map(x => x[1])), arriveLongest: Math.max(0, ...arrive.map(x => x[1])), tris: Math.round(r.tris / 1000) + 'k', calls: r.calls, newPrograms: r.progs - progs0 };
  }
  out.meanScriptMs = +(sum / ids.length).toFixed(1);
  out.memory = await p.evaluate(() => ({ heapMB: Math.round(performance.memory.usedJSHeapSize / 1e6), geos: __DDW3.renderer.info.memory.geometries, tex: __DDW3.renderer.info.memory.textures, progs: __DDW3.renderer.info.programs.length })); out.errors = errs;
  console.log('=== ' + f + '\n' + JSON.stringify(out, null, 1)); await ctx.close(); }
await b.close(); })();
