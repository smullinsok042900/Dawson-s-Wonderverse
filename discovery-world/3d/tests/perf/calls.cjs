// Draw-call breakdown at a spot: which objects cost the most draw calls in one real frame (main view + shadow).
// usage (from discovery-world/3d): NODE_PATH=$(npm root -g) node tests/perf/calls.cjs index.html 396 [150 ...]
const { chromium } = require('playwright'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })).newPage();
await p.goto('file://' + require('path').resolve(process.argv[2]) + '?hq'); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
await p.locator('#playBtn').tap(); await sleep(1500);
for (const x of process.argv.slice(3).map(Number)) { await p.evaluate(x => __DDW3.teleport(x), x); await sleep(5000);
  const r = await p.evaluate(async () => { const { renderer, G } = __DDW3, scene = G.scene, per = new Map(); let total = 0;
    const label = o => { let k = o, top = o; while (k.parent && k.parent !== scene && !k.parent.userData.slice) { top = k.parent; k = k.parent; } let n = 0; top.traverse(q => { if (q.isMesh) n++; }); const wp = new __DDW3.THREE.Vector3(); top.getWorldPosition(wp); return (top.name || top.type) + '@' + wp.x.toFixed(0) + ',' + wp.y.toFixed(0) + ',' + wp.z.toFixed(0) + ' (' + n + ' meshes' + (top.parent && top.parent.userData.slice ? ', in a scenery slice' : '') + ')' + (o.isInstancedMesh ? ' inst' : ''); };
    const hooks = []; scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) { const prev = o.onAfterRender; hooks.push([o, prev]); o.onAfterRender = function (...a) { if (!on) return; total++; const k = label(o); per.set(k, (per.get(k) || 0) + 1 / 6); }; } });
    let on = false; await new Promise(res => { let n = 0; const f = () => { if (n === 0) on = true; if (n === 6) { on = false; res(); return; } n++; requestAnimationFrame(f); }; requestAnimationFrame(f); });
    for (const [o, prev] of hooks) o.onAfterRender = prev; const calls = Math.round(total / 6);
    return { calls, hooked: total, top: [...per.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25) }; });
  console.log('x', x, 'draws per frame (main + shadow + post, averaged over 6 frames)', r.calls); for (const [k, n] of r.top) console.log('  ', n.toFixed(1), k); }
await b.close(); })();
