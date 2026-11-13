// long session: travel around the whole world many times; memory and per-frame work must not grow
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })).newPage();
await p.goto('file://' + require('path').resolve(process.argv[2]) + '?hq'); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(2000);
for (let cyc = 1; cyc <= 6; cyc++) {
  for (let i = 0; i < 10; i++) { await p.locator('#mapBtn').tap(); await sleep(200); await p.locator('.mpT').nth(i).tap(); await sleep(2500); }
  await p.locator('#homeBtn').tap(); await sleep(4000);
  const m = await p.evaluate(() => { if (window.gc) gc(); return { heapMB: Math.round(performance.memory.usedJSHeapSize / 1e6), geos: __DDW3.renderer.info.memory.geometries, tex: __DDW3.renderer.info.memory.textures, progs: __DDW3.renderer.info.programs.length, taps: __DDW3.G.taps.length, interact: __DDW3.G.interact.length, plats: __DDW3.G.platforms.length, stream: __DDW3.G.expansion.stats() }; });
  console.log('cycle', cyc, JSON.stringify(m)); }
await b.close(); })();
