// Desktop Chromium/SwiftShader measurements, not physical iPhone results.
// Usage: node tests/perf/family-friends.cjs OLD_URL_OR_HTML NEW_URL_OR_HTML OUTPUT.json
// Run alone. Old/new/new/old fixed-view comparisons cover all 46 added residents.
// First-new-run shown/hidden/hidden/shown comparisons keep the SAME scene, camera,
// player and NPC logic; only the new residents' bodies are hidden. Twins stay paired.
// Global random seeding cannot match scenery across builds: Three.js UUIDs consume
// random values. Cross-build readings and same-scene drawing cost are kept separate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const [oldInput, newInput, outputFile] = process.argv.slice(2);
if (!oldInput || !newInput || !outputFile || process.argv.length !== 5)
  throw new Error('Pass old build, new build and output JSON path');
const SAMPLES = 8, ENTRY_FRAMES = 4, WARM_FRAMES = 2;
const PLACE_ORDER = ['earth', 'moon', 'mercury', 'venus', 'mars', 'saturn', 'uranus', 'neptune', 'pluto'];
const median = a => { const s = [...a].sort((a, b) => a - b); return (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2; };
const rounded = n => +n.toFixed(1);
const withFlag = input => {
  const u = new URL(/^https?:/.test(input) ? input : pathToFileURL(path.resolve(input)).href); u.searchParams.set('hq', ''); return u.href;
};
const taskSummary = a => ({ count: a.length, maxMs: rounded(Math.max(0, ...a.map(t => t.ms))) });
const uniqueHashes = programs => [...new Set(programs.map(p => p.sourceHash))].sort();
const addedPrograms = (programs, baseline) => programs.filter(p => !baseline.some(b => b.sourceHash === p.sourceHash));
const areaPhase = phase => /^(area|matched|revisit):/.test(phase);

(async () => {
  // The home lists are ES modules inside a CommonJS package; bundle them the same way
  // tests/family-friends.cjs does, so the script loads on every supported Node version.
  const os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'discovery-family-perf-'));
  let homes;
  try {
    const bundle = path.join(temp, 'homes.mjs');
    await require('esbuild').build({
      stdin: {
        contents: `export { FAMILY_FRIEND_HOMES } from './src/family-friend-homes.js';\nexport { CRAFT_FRIEND_HOMES } from './src/craft-friend-homes.js';`,
        resolveDir: path.resolve(__dirname, '../..'),
      },
      bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'silent',
    });
    const loaded = await import(pathToFileURL(bundle));
    homes = [...loaded.FAMILY_FRIEND_HOMES, ...loaded.CRAFT_FRIEND_HOMES].map(h => ({ ...h, planet: h.planet || 'earth' }));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  assert.equal(homes.length, 46, 'all 46 added residents must be measured');
  assert.equal(new Set(homes.map(h => h.kind)).size, homes.length, 'every resident has a distinct kind');
  assert.ok(homes.every(h => PLACE_ORDER.includes(h.planet) && Number.isFinite(h.x)), 'homes have valid planets and coordinates');
  const kinds = homes.map(h => h.kind);
  const groups = PLACE_ORDER.map(planet => ({ planet, homes: homes.filter(h => h.planet === planet) })).filter(g => g.homes.length);
  const report = {
    generatedAt: new Date().toISOString(), environment: 'desktop Chromium/SwiftShader; mobile touch viewport; not an iPhone',
    samplesPerRound: SAMPLES, entryFrames: ENTRY_FRAMES, warmFrames: WARM_FRAMES,
    camera: { position: '[playerX,3.15,12]', look: '[playerX,2,0]', playerOffset: '(home.approach or -1) * 2.2 metres' },
    note: 'Cross-build scenery can differ despite seeded Math.random. Same-scene rounds hide only the 46 added NPC bodies while their logic, scenery, player and camera remain intact. A separate shader baseline is captured after each planet landing; transition creations are reported separately from area-entry and revisit creations.',
    homes, runs: [], landingComparisons: [], summary: [], failures: [],
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
        let seed = 122; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
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
      const eventsBetween = (start, end) => page.evaluate(({ start, end }) => ({
        tasks: __familyPerf.tasks.filter(t => t.start >= start && t.start < end),
        waits: __familyPerf.shaderWaits.filter(t => t.start >= start && t.start < end),
        creations: __familyPerf.creations.filter(t => t.start >= start && t.start < end),
      }), { start, end });
      const setBodies = visible => page.evaluate(({ kinds, visible }) => {
        let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
        const toggled = [];
        scene.traverse(o => { if (kinds.includes(o.userData.kind) && o.userData.body) { o.userData.body.visible = visible; toggled.push(o.userData.kind); } });
        return toggled;
      }, { kinds, visible });
      const sample = async phase => {
        await page.evaluate(phase => { __familyPerf.phase = phase; }, phase); await frames(WARM_FRAMES);
        const raw = await page.evaluate(samples => new Promise(resolve => {
          const start = performance.now(), times = [], calls = [], tris = [], programs = []; let prev;
          const step = now => {
            if (prev !== undefined) { times.push(now - prev); const i = __DDW3.info(); calls.push(i.calls); tris.push(i.tris); programs.push(i.progs); }
            prev = now;
            if (times.length < samples) requestAnimationFrame(step);
            else resolve({ start, end: performance.now(), times, calls, tris, programs, memory: { ...__DDW3.renderer.info.memory } });
          }; requestAnimationFrame(step);
        }), SAMPLES);
        const events = await eventsBetween(raw.start, raw.end);
        return {
          phase, medianMs: rounded(median(raw.times)), meanMs: rounded(raw.times.reduce((a, b) => a + b, 0) / raw.times.length),
          maxFrameMs: rounded(Math.max(...raw.times)), calls: median(raw.calls), triangles: median(raw.tris),
          programs: Math.max(...raw.programs), geometries: raw.memory.geometries, textures: raw.memory.textures,
          longTasks: taskSummary(events.tasks), shaderWaits: taskSummary(events.waits), raw,
        };
      };
      const enterHome = async (home, revisit = false) => {
        await setBodies(true);
        const entry = await page.evaluate(({ home, revisit }) => {
          const D = __DDW3, P = D.player, planet = home.planet;
          __familyPerf.phase = (revisit ? 'revisit:' : 'area:') + planet + ':' + home.kind + ':entry';
          const start = performance.now(), baseX = planet === 'earth' ? 0 : D.G.spaceBounds[0] - 1;
          const worldX = baseX + home.x, playerX = worldX + (home.approach ?? -1) * 2.2;
          D.keys.left = D.keys.right = false;
          if (planet === 'earth') { D.teleport(playerX); D.G.expansion.buildNow(home.x); }
          else {
            if (D.G.space.here() !== planet) throw new Error('Wrong active planet: ' + D.G.space.here());
            Object.assign(P, { layer: 'space', x: playerX, y: 0, z: 0, vx: 0, vy: 0, grounded: true, ride: null, stair: null });
            // A section is scheduled near its entrance, then built in four existing
            // update slices. Twelve updates finish both sections if jumping far ahead.
            for (let n = 0; n < 12; n++) D.G.space.update(1 / 60, n / 60);
          }
          D.G.camOverride = { pos: [playerX, 3.15, 12], look: [playerX, 2, 0] };
          return { start, buildMs: performance.now() - start, worldX, playerX };
        }, { home, revisit });
        const entryTimes = await page.evaluate(n => new Promise(resolve => {
          const times = []; let prev;
          const step = now => { if (prev !== undefined) times.push(now - prev); prev = now; if (--n > 0) requestAnimationFrame(step); else resolve(times); }; requestAnimationFrame(step);
        }), ENTRY_FRAMES);
        const end = await page.evaluate(() => performance.now()), events = await eventsBetween(entry.start, end);
        if (isNew && home.kind !== 'unchanged-park') {
          const loaded = await page.evaluate(kind => {
            let scene = __DDW3.G.me().root; while (scene.parent) scene = scene.parent;
            let count = 0; scene.traverse(o => { if (o.userData.kind === kind && o.userData.body) count++; }); return count;
          }, home.kind);
          assert.equal(loaded, 1, 'measured resident must exist exactly once: ' + home.kind);
        }
        return { worldX: entry.worldX, playerX: entry.playerX, buildMs: rounded(entry.buildMs), maxFrameMs: rounded(Math.max(0, ...entryTimes)),
          longTasks: taskSummary(events.tasks), shaderWaits: taskSummary(events.waits), shaderCreations: events.creations };
      };
      try {
        await page.goto(withFlag(input), { timeout: 600000 });
        await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 });
        await page.locator('#playBtn').tap(); await frames(2);
        const bootPrograms = await programSnapshot();
        const bootTime = await page.evaluate(() => { __familyPerf.phase = 'post-boot'; return performance.now(); });
        const run = { runIndex, build: isNew ? 'new' : 'old', input, bootPrograms, landings: [], spots: [], revisits: [], errors };
        report.runs.push(run); save();
        console.log(JSON.stringify({ runIndex, build: run.build, phase: 'boot', programs: bootPrograms.length }));
        for (const group of groups) {
          const transition = await page.evaluate(async planet => {
            const D = __DDW3; __familyPerf.phase = 'transition:' + planet; delete D.G.camOverride;
            const start = performance.now();
            if (planet === 'earth') { if (D.G.space.here()) D.G.space.goHome(); }
            else {
              const index = D.G.space.places.findIndex(p => p[0] === planet);
              if (index < 0) throw new Error('Unknown planet: ' + planet);
              const arrived = await D.G.space.goTo(index);
              if (arrived === false || D.G.space.here() !== planet || D.player.layer !== 'space' || D.player.ride)
                throw new Error('Planet landing did not finish: ' + planet);
            }
            return { start, buildMs: performance.now() - start, baseX: planet === 'earth' ? 0 : D.G.spaceBounds[0] - 1 };
          }, group.planet);
          await frames(4); // Planet preparation and landing remain a separately reported phase.
          const programs = await programSnapshot(), landingEnd = await page.evaluate(() => performance.now());
          const transitionEvents = await eventsBetween(transition.start, landingEnd);
          const landing = { planet: group.planet, baseX: transition.baseX, buildMs: rounded(transition.buildMs), programs,
            shaderCreations: transitionEvents.creations, longTasks: taskSummary(transitionEvents.tasks), shaderWaits: taskSummary(transitionEvents.waits) };
          run.landings.push(landing); save();
          console.log(JSON.stringify({ runIndex, planet: group.planet, phase: 'landing', programs: programs.length, transitionShaderCreations: transitionEvents.creations.length }));
          const spots = group.planet === 'earth' ? [...group.homes, { kind: 'unchanged-park', planet: 'earth', district: 'park', x: 190 }] : group.homes;
          for (const home of spots) {
            const entry = await enterHome(home), entryPrograms = await programSnapshot();
            const row = { kind: home.kind, planet: home.planet, district: home.district, x: home.x, worldX: entry.worldX,
              entry: { ...entry, programs: entryPrograms.length, newProgramHashes: addedPrograms(entryPrograms, landing.programs) },
              steady: await sample('area:' + home.planet + ':' + home.kind + ':steady'), matched: [] };
            if (runIndex === 1 && home.kind !== 'unchanged-park') {
              for (const [round, visible] of [true, false, false, true].entries()) {
                const toggledKinds = await setBodies(visible);
                row.matched.push({ visible, toggledKinds, ...await sample('matched:' + home.planet + ':' + home.kind + ':' + round) });
              }
            }
            run.spots.push(row); save();
            console.log(JSON.stringify({ runIndex, planet: row.planet, kind: row.kind, x: row.x, worldX: row.worldX, medianMs: row.steady.medianMs, calls: row.steady.calls,
              triangles: row.steady.triangles, entryPrograms: row.entry.programs,
              matched: row.matched.map(r => ({ visible: r.visible, medianMs: r.medianMs, calls: r.calls, triangles: r.triangles })) }));
          }
          if (runIndex === 1) for (const home of [...group.homes].reverse()) {
            const entry = await enterHome(home, true), programs = await programSnapshot();
            run.revisits.push({ kind: home.kind, planet: home.planet, x: home.x, ...entry, programs: programs.length,
              newProgramHashes: addedPrograms(programs, landing.programs) }); save();
          }
          await setBodies(true);
        }
        run.finalPrograms = await programSnapshot();
        run.shaderCreations = await page.evaluate(start => __familyPerf.creations.filter(c => c.start >= start), bootTime);
        run.areaShaderCreations = run.shaderCreations.filter(c => areaPhase(c.phase));
        run.transitionShaderCreations = run.shaderCreations.filter(c => c.phase.startsWith('transition:'));
        run.bootCreationCount = await page.evaluate(start => __familyPerf.creations.filter(c => c.start < start).length, bootTime);
        if (errors.length) report.failures.push('Game errors in run ' + runIndex + ': ' + errors.join('; '));
        save();
      } catch (error) {
        report.failures.push('Run ' + runIndex + ' stopped: ' + error.message); save(); throw error;
      } finally { await context.close(); }
    }
    // Gate shader work on the difference between the builds. The preserved build-120 bundle also
    // builds planet sections lazily, so a creation the old build makes at the same entry is
    // pre-existing section work, reported on its own instead of blamed on the new residents.
    const oldSpots = report.runs.filter(r => r.build === 'old').flatMap(r => r.spots);
    const oldEntries = (planet, kind) => oldSpots.filter(s => s.planet === planet && s.kind === kind);
    const oldCreationCounts = (planet, kind) => oldEntries(planet, kind).map(s => (s.entry.shaderCreations || []).length);
    report.preExistingShaderCreations = [];
    for (const run of report.runs.filter(r => r.build === 'new')) {
      const fresh = [];
      for (const creation of run.areaShaderCreations) {
        const [, planet, kind] = creation.phase.split(':');
        const counts = planet && kind ? oldCreationCounts(planet, kind) : [];
        if (counts.length && counts.every(n => n > 0)) report.preExistingShaderCreations.push({ runIndex: run.runIndex, phase: creation.phase });
        else fresh.push(creation);
      }
      if (fresh.length) report.failures.push('New build linked shaders on area entry, matched sampling or revisit in run ' + run.runIndex + ': ' + JSON.stringify(fresh));
      save();
    }
    // What the rule is really about: does build 122 need a shader program source that the preserved
    // build-120 bundle never created during its own full tour? Planet sections can link the same
    // program at a different spot in different runs, so the per-entry source timings stay in the
    // report as diagnostics (each spot's newProgramHashes) instead of being gated by position.
    const oldSources = new Set(report.runs.filter(r => r.build === 'old').flatMap(r => uniqueHashes(r.finalPrograms)));
    for (const run of report.runs.filter(r => r.build === 'new')) {
      const addedSources = uniqueHashes(run.finalPrograms).filter(h => !oldSources.has(h));
      if (addedSources.length) report.failures.push('New build needs shader sources the old build never created, in run ' + run.runIndex + ': ' + addedSources.join(', '));
    }
    // Compare source sets at the same landing across builds. Raw program counts can
    // vary because multiple cache keys share a source; they are retained, not gated.
    for (const planet of PLACE_ORDER.filter(p => groups.some(g => g.planet === p))) {
      const old = report.runs.filter(r => r.build === 'old').map(r => r.landings.find(l => l.planet === planet));
      const oldHashes = [...new Set(old.flatMap(l => uniqueHashes(l.programs)))].sort();
      for (const run of report.runs.filter(r => r.build === 'new')) {
        const landing = run.landings.find(l => l.planet === planet), newHashes = uniqueHashes(landing.programs);
        const addedHashes = newHashes.filter(h => !oldHashes.includes(h)), absentHashes = oldHashes.filter(h => !newHashes.includes(h));
        report.landingComparisons.push({ planet, runIndex: run.runIndex, oldProgramCounts: old.map(l => l.programs.length), newProgramCount: landing.programs.length,
          oldSourceCount: oldHashes.length, newSourceCount: newHashes.length, addedHashes, absentHashes });
      }
    }
    const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
    for (const home of [...homes, { kind: 'unchanged-park', planet: 'earth', x: 190 }]) {
      const oldRows = report.runs.filter(r => r.build === 'old').map(r => r.spots.find(s => s.kind === home.kind));
      const newRows = report.runs.filter(r => r.build === 'new').map(r => r.spots.find(s => s.kind === home.kind));
      const matched = newRows[0].matched, shown = matched.filter(r => r.visible), hidden = matched.filter(r => !r.visible);
      const oldMedianMs = mean(oldRows.map(r => r.steady.medianMs)), newMedianMs = mean(newRows.map(r => r.steady.medianMs));
      report.summary.push({ kind: home.kind, planet: home.planet, x: home.x,
        oldMedianMs: rounded(oldMedianMs), newMedianMs: rounded(newMedianMs), crossBuildPercent: rounded((newMedianMs / oldMedianMs - 1) * 100),
        oldRunMedians: oldRows.map(r => r.steady.medianMs), newRunMedians: newRows.map(r => r.steady.medianMs),
        matchedShownMedians: shown.map(r => r.medianMs), matchedHiddenMedians: hidden.map(r => r.medianMs),
        matchedCallDifference: matched.length ? mean(shown.map(r => r.calls)) - mean(hidden.map(r => r.calls)) : null,
        matchedTriangleDifference: matched.length ? mean(shown.map(r => r.triangles)) - mean(hidden.map(r => r.triangles)) : null,
      });
    }
    report.finishedAt = new Date().toISOString(); save();
    console.log('RESULTS ' + JSON.stringify({ output: path.resolve(outputFile), runs: report.runs.length, homes: homes.length, planets: groups.map(g => g.planet),
      landingSourceDifferences: report.landingComparisons.filter(c => c.addedHashes.length || c.absentHashes.length).length, failures: report.failures }));
    assert.deepEqual(report.failures, [], 'no errors, no area-entry shader work beyond the old build and no shader sources the old build never created');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
