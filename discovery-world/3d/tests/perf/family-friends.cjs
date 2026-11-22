// Desktop Chromium/SwiftShader measurements, not physical iPhone results.
// Usage: node tests/perf/family-friends.cjs OLD_URL_OR_HTML NEW_URL_OR_HTML OUTPUT.json
// Run alone. Four fresh contexts use old/new/new/old order. The first new run also
// compares shown/hidden/hidden/shown in the SAME scene at every new resident's home.
// Global random seeding cannot match scenery across builds: Three.js UUIDs consume
// random values. The same-scene rounds therefore isolate drawing cost separately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const [oldInput, newInput, outputFile] = process.argv.slice(2);
if (!oldInput || !newInput || !outputFile || process.argv.length !== 5)
  throw new Error('Pass old build, new build and output JSON path');
const SAMPLES = 8, ENTRY_FRAMES = 4, WARM_FRAMES = 2;
const median = a => { const s = [...a].sort((a, b) => a - b); return (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2; };
const rounded = n => +n.toFixed(1);
const asUrl = input => /^https?:/.test(input) ? input : pathToFileURL(path.resolve(input)).href;
const withFlag = input => { const u = new URL(asUrl(input)); u.searchParams.set('hq', ''); return u.href; };
const taskSummary = a => ({ count: a.length, maxMs: rounded(Math.max(0, ...a.map(t => t.ms))) });

(async () => {
  const { FAMILY_FRIEND_HOMES: homes } = await import(pathToFileURL(path.resolve(__dirname, '../../src/family-friend-homes.js')));
  assert.equal(homes.length, 16, 'all sixteen new residents, including both sets of twins, must be measured');
  const kinds = homes.map(h => h.kind);
  const report = {
    generatedAt: new Date().toISOString(), environment: 'desktop Chromium/SwiftShader; mobile touch viewport; not an iPhone',
    samplesPerRound: SAMPLES, entryFrames: ENTRY_FRAMES, warmFrames: WARM_FRAMES,
    note: 'Cross-build scenery can differ despite seeded Math.random. Same-scene rounds hide only the sixteen new NPC bodies, leaving their logic, scenery, player and camera intact.',
    homes, runs: [], failures: [],
  };
  const save = () => fs.writeFileSync(path.resolve(outputFile), JSON.stringify(report, null, 2) + '\n');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const [runIndex, input] of [oldInput, newInput, newInput, oldInput].entries()) {
      const isNew = runIndex === 1 || runIndex === 2;
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        let seed = 121; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        window.__familyPerf = { phase: 'loading', tasks: [], shaderWaits: [], creations: [] };
        new PerformanceObserver(list => { for (const e of list.getEntries()) __familyPerf.tasks.push({ start: e.startTime, ms: e.duration }); }).observe({ type: 'longtask' });
        const p = WebGL2RenderingContext.prototype, create = p.createProgram, parameter = p.getProgramParameter;
        p.createProgram = function (...args) { __familyPerf.creations.push({ phase: __familyPerf.phase, start: performance.now() }); return create.apply(this, args); };
        p.getProgramParameter = function (...args) {
          const start = performance.now(), value = parameter.apply(this, args), ms = performance.now() - start;
          if (ms > 30) __familyPerf.shaderWaits.push({ phase: __familyPerf.phase, start, ms }); return value;
        };
      });
      const frames = n => page.evaluate(n => new Promise(resolve => { const step = () => --n <= 0 ? resolve() : requestAnimationFrame(step); requestAnimationFrame(step); }), n);
      const programSnapshot = () => page.evaluate(() => {
        const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16); };
        const gl = __DDW3.renderer.getContext();
        return __DDW3.renderer.info.programs.map(p => ({ name: p.name, sourceHash: hash((gl.getAttachedShaders(p.program) || []).map(s => gl.getShaderSource(s)).sort().join('\n')) }));
      });
      const sample = async phase => {
        await page.evaluate(phase => { __familyPerf.phase = phase; }, phase);
        await frames(WARM_FRAMES);
        const raw = await page.evaluate(samples => new Promise(resolve => {
          const start = performance.now(), times = [], calls = [], tris = [], programs = []; let prev;
          const step = now => {
            if (prev !== undefined) {
              times.push(now - prev); const i = __DDW3.info(); calls.push(i.calls); tris.push(i.tris); programs.push(i.progs);
            }
            prev = now;
            if (times.length < samples) requestAnimationFrame(step);
            else resolve({ start, end: performance.now(), times, calls, tris, programs, memory: { ...__DDW3.renderer.info.memory } });
          }; requestAnimationFrame(step);
        }), SAMPLES);
        const events = await page.evaluate(({ start, end }) => ({
          tasks: __familyPerf.tasks.filter(t => t.start >= start && t.start < end),
          waits: __familyPerf.shaderWaits.filter(t => t.start >= start && t.start < end),
        }), { start: raw.start, end: raw.end });
        return {
          phase, medianMs: rounded(median(raw.times)), meanMs: rounded(raw.times.reduce((a, b) => a + b, 0) / raw.times.length),
          maxFrameMs: rounded(Math.max(...raw.times)), calls: median(raw.calls), triangles: median(raw.tris),
          programs: Math.max(...raw.programs), geometries: raw.memory.geometries, textures: raw.memory.textures,
          longTasks: taskSummary(events.tasks), shaderWaits: taskSummary(events.waits), raw,
        };
      };
      try {
        await page.goto(withFlag(input), { timeout: 600000 });
        await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 });
        await page.locator('#playBtn').tap(); await frames(2);
        const bootPrograms = await programSnapshot();
        const bootTime = await page.evaluate(() => { __familyPerf.phase = 'post-boot'; return performance.now(); });
        const run = { runIndex, build: isNew ? 'new' : 'old', input, bootPrograms, spots: [], errors };
        report.runs.push(run); save();
        console.log(JSON.stringify({ runIndex, build: run.build, phase: 'boot', programs: bootPrograms.length }));
        for (const home of [...homes, { kind: 'unchanged-park', x: 190, district: 'park' }]) {
          const entry = await page.evaluate(({ home, kinds }) => {
            // Restore any hidden new residents before leaving the previous view.
            let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
            scene.traverse(o => { if (kinds.includes(o.userData.kind) && o.userData.body) o.userData.body.visible = true; });
            __familyPerf.phase = home.kind + ':entry';
            const start = performance.now(); __DDW3.teleport(home.x); __DDW3.G.expansion.buildNow(home.x);
            return { start, buildMs: performance.now() - start };
          }, { home, kinds });
          const entryTimes = await page.evaluate(n => new Promise(resolve => {
            const times = []; let prev;
            const step = now => { if (prev !== undefined) times.push(now - prev); prev = now; if (--n > 0) requestAnimationFrame(step); else resolve(times); }; requestAnimationFrame(step);
          }), ENTRY_FRAMES);
          const entryEnd = await page.evaluate(() => performance.now());
          const entryEvents = await page.evaluate(({ start, end }) => ({
            tasks: __familyPerf.tasks.filter(t => t.start >= start && t.start < end),
            waits: __familyPerf.shaderWaits.filter(t => t.start >= start && t.start < end),
          }), { start: entry.start, end: entryEnd });
          const programs = await programSnapshot();
          const row = {
            kind: home.kind, district: home.district, x: home.x,
            entry: { buildMs: rounded(entry.buildMs), maxFrameMs: rounded(Math.max(0, ...entryTimes)), longTasks: taskSummary(entryEvents.tasks), shaderWaits: taskSummary(entryEvents.waits), programs: programs.length,
              newProgramHashes: programs.filter(p => !bootPrograms.some(b => b.sourceHash === p.sourceHash)) },
            steady: await sample(home.kind + ':steady'), matched: [],
          };
          if (isNew && home.kind !== 'unchanged-park') {
            const loaded = await page.evaluate(kind => {
              let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
              let count = 0; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) count++; }); return count;
            }, home.kind);
            assert.equal(loaded, 1, 'measured resident must exist exactly once: ' + home.kind);
          }
          if (runIndex === 1 && home.kind !== 'unchanged-park') {
            for (const [round, visible] of [true, false, false, true].entries()) {
              const toggledKinds = await page.evaluate(({ kinds, visible }) => {
                let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
                const toggled = [];
                scene.traverse(o => { if (kinds.includes(o.userData.kind) && o.userData.body) { o.userData.body.visible = visible; toggled.push(o.userData.kind); } }); return toggled;
              }, { kinds, visible });
              row.matched.push({ visible, toggledKinds, ...await sample(home.kind + ':matched-' + round) });
            }
          }
          run.spots.push(row); save();
          console.log(JSON.stringify({ runIndex, kind: row.kind, x: row.x, medianMs: row.steady.medianMs, calls: row.steady.calls, triangles: row.steady.triangles, entryPrograms: row.entry.programs,
            matched: row.matched.map(r => ({ visible: r.visible, medianMs: r.medianMs, calls: r.calls, triangles: r.triangles })) }));
        }
        run.finalPrograms = await programSnapshot();
        run.shaderCreations = await page.evaluate(start => __familyPerf.creations.filter(c => c.start >= start), bootTime);
        run.bootCreationCount = await page.evaluate(start => __familyPerf.creations.filter(c => c.start < start).length, bootTime);
        if (isNew && run.shaderCreations.length) report.failures.push('New build linked shaders after boot in run ' + runIndex + ': ' + JSON.stringify(run.shaderCreations));
        if (isNew && run.spots.some(s => s.entry.newProgramHashes.length)) report.failures.push('New shader source appeared on area entry in run ' + runIndex);
        if (errors.length) report.failures.push('Game errors in run ' + runIndex + ': ' + errors.join('; '));
        save();
      } finally { await context.close(); }
    }
    report.finishedAt = new Date().toISOString(); save();
    console.log('RESULTS ' + JSON.stringify({ output: path.resolve(outputFile), runs: report.runs.length, homes: homes.length, failures: report.failures }));
    assert.deepEqual(report.failures, [], 'no errors or new shaders on entering the drawing residents’ areas');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
