// Isolate the farm timing difference in the SAME scene; audit shaders in all seven areas.
// NPC logic, scenery, player and camera stay intact. Also audit shader creation from boot through each area.
// Usage: node tests/perf/drawing-cost.cjs OLD_URL_OR_HTML NEW_URL_OR_HTML
const { chromium } = require('playwright');
const path = require('node:path');
const inputs = process.argv.slice(2);
if (inputs.length !== 2) throw new Error('Pass old and new builds');
const median = a => { const s = [...a].sort((a, b) => a - b); return (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2; };
const homes = [['chalkgreen', 587], ['chalkpink', 827], ['drawingblue', -123], ['drawingwave', -486], ['drawinglonglegs', -789], ['drawingteal', -288], ['drawingscribble', 754]];
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const output = [];
    for (const [buildIndex, input] of inputs.entries()) {
      const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        window.__programPhase = 'loading'; window.__programCreations = [];
        const p = WebGL2RenderingContext.prototype, create = p.createProgram;
        p.createProgram = function (...args) { __programCreations.push({ phase: __programPhase, time: performance.now() }); return create.apply(this, args); };
      });
      const url = /^https?:/.test(input) ? input : 'file://' + path.resolve(input);
      await page.goto(url + '?hq', { timeout: 600000 });
      await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 });
      await page.locator('#playBtn').tap();
      const frames = n => page.evaluate(n => new Promise(resolve => { const f = () => --n <= 0 ? resolve() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
      const programs = () => page.evaluate(() => {
        const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16); };
        const gl = __DDW3.renderer.getContext();
        return __DDW3.renderer.info.programs.map(p => ({ name: p.name, key: p.cacheKey, sourceHash: hash((gl.getAttachedShaders(p.program) || []).map(s => gl.getShaderSource(s)).sort().join('\n')) }));
      });
      await frames(2); const boot = await programs(), rows = [];
      console.log(JSON.stringify({ input, phase: 'boot', programs: boot.length }));
      if (buildIndex === 1) for (const [kind, x] of homes) {
        await page.evaluate(([kind, x]) => { __programPhase = kind; __DDW3.teleport(x); __DDW3.G.expansion.buildNow(x); }, [kind, x]);
        await frames(10); const entryPrograms = await programs();
        const rounds = [];
        for (const visible of kind === 'drawingwave' ? [true, false, false, true] : []) {
          await page.evaluate(([kind, visible]) => {
            let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
            let g; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) g = o; });
            if (!g) throw new Error('Missing resident: ' + kind);
            g.userData.body.visible = visible;
          }, [kind, visible]);
          await frames(2);
          const sample = await page.evaluate(() => new Promise(resolve => {
            const times = [], calls = [], tris = []; let prev;
            const f = now => { if (prev !== undefined) { times.push(now - prev); const i = __DDW3.info(); calls.push(i.calls); tris.push(i.tris); } prev = now;
              if (times.length < 12) requestAnimationFrame(f); else resolve({ times, calls, tris }); }; requestAnimationFrame(f);
          }));
          rounds.push({ visible, frameMs: +median(sample.times).toFixed(1), calls: median(sample.calls), triangles: median(sample.tris) });
        }
        const row = { kind, x, entryPrograms: entryPrograms.length, newProgramHashes: entryPrograms.filter(p => !boot.some(b => b.sourceHash === p.sourceHash)).map(p => ({ name: p.name, sourceHash: p.sourceHash })), rounds };
        rows.push(row); console.log(JSON.stringify(row));
      }
      output.push({ input, bootPrograms: boot, finalPrograms: await programs(), rows, creations: await page.evaluate(() => __programCreations) });
      await ctx.close();
    }
    console.log('RESULTS ' + JSON.stringify(output));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
