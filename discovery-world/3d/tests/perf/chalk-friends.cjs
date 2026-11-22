// Compare old/new builds at the two new residents and adjacent unchanged views.
// Usage: node tests/perf/chalk-friends.cjs OLD.html NEW.html
// Inputs may also be local HTTP URLs. Desktop software rendering, not iPhone measurements.
const { chromium } = require('playwright');
const path = require('node:path');
const inputs = process.argv.slice(2);
if (inputs.length !== 2) throw new Error('Pass the old and new HTML paths or URLs');
const median = values => { const a = [...values].sort((a, b) => a - b); return (a[Math.floor((a.length - 1) / 2)] + a[Math.ceil((a.length - 1) / 2)]) / 2; };
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const results = [];
    // Both orders reduce bias from machine/renderer warm-up.
    for (const input of [inputs[0], inputs[1], inputs[1], inputs[0]]) {
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.addInitScript(() => {
        let seed = 120; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        window.__drawingLongTasks = []; window.__drawingShaderWaits = [];
        new PerformanceObserver(list => { for (const e of list.getEntries()) __drawingLongTasks.push(e.duration); }).observe({ type: 'longtask' });
        const proto = WebGL2RenderingContext.prototype, original = proto.getProgramParameter;
        proto.getProgramParameter = function (...args) { const start = performance.now(), result = original.apply(this, args), ms = performance.now() - start; if (ms > 30 && window.__DDW3) __drawingShaderWaits.push(ms); return result; };
      });
      const url = /^https?:/.test(input) ? input : 'file://' + path.resolve(input);
      await page.goto(url + '?hq', { timeout: 600000 });
      await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 });
      await page.locator('#playBtn').tap();
      const spots = [];
      for (const x of [587, 827, -123, -486, -789, -288, 754, 190]) {
        const buildMs = await page.evaluate(x => {
          __drawingLongTasks.length = 0; __drawingShaderWaits.length = 0;
          const start = performance.now(); __DDW3.teleport(x); __DDW3.G.expansion.buildNow(x);
          return performance.now() - start;
        }, x);
        const result = await page.evaluate(() => new Promise(resolve => {
          let warm = 8, n = 0, prev = 0, entryTasks = [], entryShaderWaits = [];
          const times = [], calls = [], tris = [], programs = [], entryTimes = [];
          const sample = now => {
            if (warm > 0) {
              if (prev) entryTimes.push(now - prev); prev = now;
              if (--warm === 0) {
                entryTasks = __drawingLongTasks.slice(); entryShaderWaits = __drawingShaderWaits.slice();
                __drawingLongTasks.length = 0; __drawingShaderWaits.length = 0;
              }
              requestAnimationFrame(sample); return;
            }
            times.push(now - prev); prev = now;
            const info = __DDW3.info(); calls.push(info.calls); tris.push(info.tris); programs.push(info.progs);
            if (++n < 12) requestAnimationFrame(sample);
            else resolve({ times, calls, tris, programs, memory: __DDW3.renderer.info.memory, entryTimes, entryTasks, entryShaderWaits, longTasks: __drawingLongTasks.slice(), shaderWaits: __drawingShaderWaits.slice() });
          }; requestAnimationFrame(sample);
        }));
        const row = { x, buildMs: +buildMs.toFixed(1), entryLongestFrameMs: +Math.max(0, ...result.entryTimes).toFixed(1), entryLongTaskCount: result.entryTasks.length, entryLongestTaskMs: +Math.max(0, ...result.entryTasks).toFixed(1), entryShaderWaitCount: result.entryShaderWaits.length, frameMedianMs: +median(result.times).toFixed(1), frameMeanMs: +(result.times.reduce((a, b) => a + b, 0) / result.times.length).toFixed(1), calls: median(result.calls), triangles: median(result.tris), programs: Math.max(...result.programs), geometries: result.memory.geometries, textures: result.memory.textures, longTaskCount: result.longTasks.length, longestTaskMs: +Math.max(0, ...result.longTasks).toFixed(1), shaderWaitCount: result.shaderWaits.length };
        spots.push(row); console.log(JSON.stringify({ input, ...row }));
      }
      results.push({ input, spots }); await context.close();
    }
    console.log('RESULTS ' + JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
