const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const f of process.argv.slice(2)) for (let run = 0; run < 2; run++) {
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, userAgent: UA }); const p = await ctx.newPage();
  await p.addInitScript(() => { window.__lt = []; new PerformanceObserver(l => { for (const e of l.getEntries()) __lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); });
  const t0 = Date.now(); await p.goto('file://' + require('path').resolve(f) + '?hq'); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); const load = Date.now() - t0;
  await p.locator('#playBtn').tap(); await sleep(2000);
  const res = { load: (load / 1000).toFixed(1) };
  for (const [name, x, act] of [['enter house', 190, 1], ['upstairs view', 1012, 0], ['leave house', 1003.2, 1], ['castle inside', 406, 1], ['underground', 20, 0]]) {
    await p.evaluate(x => __DDW3.teleport(x), x); await sleep(2500); await p.evaluate(([act]) => { __lt.length = 0; if (act) __DDW3.G.doAction(); }, [act]); await sleep(4000);
    res[name] = Math.max(0, ...await p.evaluate(() => __lt)); }
  console.log(f, run, JSON.stringify(res)); await ctx.close(); }
await b.close(); })();
