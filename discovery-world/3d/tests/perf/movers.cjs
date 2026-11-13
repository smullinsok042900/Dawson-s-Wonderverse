const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage();
await p.goto('file://' + require('path').resolve(process.argv[2] || 'index.html') + '?test'); await sleep(3000); await p.locator('#playBtn').tap(); await sleep(800);
await p.evaluate(() => { __DDW3.world.crown = true; window.__snap = new Map(); __DDW3.G.scene.children.filter(g => g.userData.slice).forEach(g => g.traverse(o => { if (o !== g && o.parent === g) __snap.set(o, o.position.toArray().join()); })); });
for (const x of [60, 200, 400, 30]) { await p.evaluate(x => __DDW3.teleport(x), x); await sleep(2500); }
console.log(JSON.stringify(await p.evaluate(() => { const out = []; for (const [o, s0] of __snap) { if (o.position.toArray().join() !== s0) { let n = o.type; o.traverse(q => { if (q.isMesh && n.length < 60) n += ' ' + (q.geometry.type || '') + '/' + (q.material.color ? q.material.color.getHexString() : ''); }); out.push(n.slice(0, 80) + ' @' + s0.split(',').map(v => (+v).toFixed(1)).join(',')); } } return out; }), null, 1));
await b.close(); })();
