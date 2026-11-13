const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
await page.goto('file://' + require('path').resolve(process.argv[2] || 'index.html') + '?test'); await sleep(3000); await page.locator('#playBtn').click(); await sleep(1500);
for (const x of [380, 60]) { await page.evaluate(x => __DDW3.teleport(x), x); await sleep(1500); }
console.log(await page.evaluate(() => { const T = __DDW3.THREE, out = []; let n = 0; for (const g of __DDW3.G.slices || []) for (const o of g.children) { n++; const c = new T.Box3().setFromObject(o).getCenter(new T.Vector3()); if (isFinite(c.x) && Math.abs(c.x - g.userData.x) > 30) out.push(o.type + '@' + c.x.toFixed(0)); } return n + ' checked; bad: ' + out.join(' '); }));
await b.close(); })();
