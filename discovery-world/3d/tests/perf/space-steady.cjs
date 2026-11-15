// Fixed-view planet diagnostic: desktop SwiftShader, not physical iPhone results.
// Usage: node tests/perf/space-steady.cjs before.html after.html
// SPACE_PLACES=mars,saturn,uranus,neptune SPACE_FRAMES=32
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const places = (process.env.SPACE_PLACES || 'mars,saturn,uranus,neptune').split(',').map(s => s.trim()).filter(Boolean);
const frames = Number(process.env.SPACE_FRAMES || 32), files = process.argv.slice(2);
assert.ok(files.length && Number.isInteger(frames) && frames > 0, 'provide HTML files and a positive integer SPACE_FRAMES');
const signature = r => `${r.calls}/${r.tris}/${r.shadow ? 'shadow' : 'plain'}`;
const within = (promise, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Planet view exceeded 180 seconds')), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
const stats = rows => {
  const ms = rows.map(r => r.ms).sort((a, b) => a - b), n = ms.length;
  return { frames: n, mean: n ? ms.reduce((a, b) => a + b, 0) / n : null,
    median: n ? (ms[Math.floor((n - 1) / 2)] + ms[Math.floor(n / 2)]) / 2 : null,
    p95: n ? ms[Math.ceil(n * .95) - 1] : null };
};
const groups = rows => Object.groupBy(rows, signature);
function compare(before, after, place) {
  const a = groups(before.views[place].rows), b = groups(after.views[place].rows);
  const common = Object.keys(a).filter(key => b[key]);
  const matched = common.map(key => ({ signature: key, before: stats(a[key]), after: stats(b[key]), ratio: stats(b[key]).mean / stats(a[key]).mean }));
  let weight = 0, oldCost = 0, newCost = 0;
  for (const row of matched) { const n = Math.min(row.before.frames, row.after.frames); weight += n; oldCost += n * row.before.mean; newCost += n * row.after.mean; }
  return { before: before.file, after: after.file, place, commonCoverage: {
    before: common.reduce((n, key) => n + a[key].length, 0) / before.views[place].rows.length,
    after: common.reduce((n, key) => n + b[key].length, 0) / after.views[place].rows.length,
  }, matchedFramesPerBuild: weight, matchedCostRatio: weight ? newCost / oldCost : null, matched };
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = [];
  try {
    for (const file of files) {
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' });
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => {
          const S = window.__spaceSteady = { collect: false, rows: [], programSets: [], longTasks: [], active: null };
          new PerformanceObserver(list => { for (const e of list.getEntries()) S.longTasks.push({ start: e.startTime, ms: e.duration }); }).observe({ type: 'longtask', buffered: false });
          const raf = window.requestAnimationFrame.bind(window);
          window.requestAnimationFrame = fn => raf(t => {
            const D = window.__DDW3, renderer = D?.renderer;
            if (renderer && S.renderer !== renderer) {
              S.renderer = renderer;
              const shadowRender = renderer.shadowMap.render;
              renderer.shadowMap.render = function (...args) {
                if (S.active && this.enabled && (this.autoUpdate || this.needsUpdate) && args[0]?.length) S.active.shadow = true;
                return shadowRender.apply(this, args);
              };
            }
            const before = renderer?.info.render.frame, row = { shadow: false }, start = performance.now();
            S.active = row;
            try { fn(t); } finally {
              const ms = performance.now() - start;
              S.active = null;
              if (S.collect && renderer && before !== renderer.info.render.frame) {
                if (S.warm > 0) { S.warm--; } else {
                const keys = renderer.info.programs.map(p => p.cacheKey).sort();
                let programSet = S.programSets.findIndex(set => set.length === keys.length && set.every((key, i) => key === keys[i]));
                if (programSet < 0) { programSet = S.programSets.length; S.programSets.push(keys); }
                // Program keys are interned once per set instead of repeating large strings in every row.
                S.rows.push({ start, ms, shadow: row.shadow, calls: renderer.info.render.calls,
                  tris: renderer.info.render.triangles, x: D.player.x, y: D.player.y, here: D.G.space.here(),
                  camera: D.camera.position.toArray(), programSet });
                if (S.rows.length >= S.frames) { S.collect = false; S.done = true; }
                }
              }
            }
          });
        });
        await page.goto('file://' + path.resolve(file) + '?hq', { timeout: 300000 });
        await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: 600000 });
        await page.locator('#playBtn').tap();
        const result = { file: path.resolve(file), framesRequested: frames, views: {}, errors };
        for (const place of places) {
          const viewStarted = Date.now();
          const setup = await within(page.evaluate(async place => {
            const D = __DDW3, space = D.G.space, index = space.places.findIndex(p => p[0] === place);
            if (index < 0) throw new Error('Unknown planet: ' + place);
            delete D.G.camOverride;
            D.keys.left = D.keys.right = false;
            await space.goTo(index); // Supports the synchronous baseline and asynchronous fixed build.
            const X = 5000 + index * 400, group = () => space.groups?.[place] || D.G.scene.getObjectByName('space:' + place);
            const sections = place === 'moon' || place === 'mars' ? [1, 2] : [];
            for (const section of sections) {
              D.player.x = X + section * 110 - 69;
              for (let n = 0; n < 12; n++) space.update(1 / 60, n / 60);
            }
            const ready = sections.every(s => !!group()?.getObjectByName(`space:${place}:${s}`));
            if (!ready) throw new Error('Expanded planet sections did not attach: ' + place);
            const x = X + 50;
            Object.assign(D.player, { x, y: 0, z: 0, vx: 0, vy: 0, grounded: true, ride: null });
            D.G.camOverride = { pos: [x, 3.15, 12], look: [x, 2, 0] };
            return { x, sections, allAreasReady: ready, quality: D.quality(), postEnabled: D.post.enabled, postLite: D.post.lite };
          }, place), 180000);
          await page.evaluate(frames => {
            const S = __spaceSteady; S.rows = []; S.programSets = []; S.warm = 8; S.frames = frames; S.done = false; S.collect = true;
          }, frames);
          await page.waitForFunction(() => __spaceSteady.done, null, { timeout: Math.max(1, 180000 - (Date.now() - viewStarted)), polling: 500 });
          const sample = await page.evaluate(() => {
            const S = __spaceSteady, start = S.rows[0].start, last = S.rows.at(-1), end = last.start + last.ms;
            return { rows: S.rows, programSets: S.programSets, longTasks: S.longTasks.filter(task => task.start >= start && task.start <= end) };
          });
          assert.equal(sample.rows.length, frames, place + ': complete rendered-frame samples');
          assert.ok(sample.rows.every(r => Number.isFinite(r.ms) && r.ms >= 0 && r.calls > 0 && r.tris > 0), place + ': valid frame metrics');
          assert.ok(sample.rows.every(r => r.here === place && Math.abs(r.x - setup.x) < 1e-6 && Math.abs(r.y) < 1e-6), place + ': player remains in the fixed view');
          assert.ok(sample.rows.every(r => r.camera.every((v, i) => Math.abs(v - [setup.x, 3.15, 12][i]) < 1e-6)), place + ': fixed camera');
          const bySignature = Object.fromEntries(Object.entries(groups(sample.rows)).map(([key, rows]) => [key, stats(rows)]));
          result.views[place] = { ...setup, ...stats(sample.rows), bySignature, ...sample };
        }
        assert.deepEqual(errors, [], 'no page errors');
        results.push(result);
        console.log(JSON.stringify({ type: 'page', ...result }));
      } finally { await context.close(); }
    }
    for (const after of results.slice(1)) for (const place of places) console.log(JSON.stringify({ type: 'matched-work', ...compare(results[0], after, place) }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
