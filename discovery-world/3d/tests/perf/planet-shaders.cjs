// Regression gate: travel and planet activities must reuse shaders prepared before play.
// Desktop SwiftShader measurements are not physical iPhone results.
// Usage: node tests/perf/planet-shaders.cjs [offline HTML path]
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__shaderWaits = [];
      const proto = WebGL2RenderingContext.prototype, get = proto.getProgramParameter;
      proto.getProgramParameter = function (...args) {
        const start = performance.now(), value = get.apply(this, args), ms = performance.now() - start;
        if (window.__measureShaders && ms > 30) __shaderWaits.push({ x: window.__DDW3?.player.x, ms: Math.round(ms), parameter: args[1] });
        return value;
      };
    });
    const file = process.argv[2] || path.resolve(__dirname, '../../index.html');
    await page.goto('file://' + path.resolve(file) + '?hq', { timeout: 300000 });
    await page.waitForFunction(() => document.querySelector('#loading').classList.contains('done'), null, { timeout: 600000 });
    await page.locator('#playBtn').tap();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const initial = await page.evaluate(() => { __measureShaders = true; return __DDW3.renderer.info.programs.map(p => p.cacheKey); });
    const known = new Set(initial), visits = [];
    for (let i = 0; i < 9; i++) {
      const arrival = await page.evaluate(i => {
        const start = performance.now(); return Promise.resolve(__DDW3.G.space.goTo(i)).then(() => ({ id: __DDW3.G.space.places[i][0], buildMs: Math.round(performance.now() - start) }));

      }, i);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const row = await page.evaluate(() => {
        const D = __DDW3, B = D.G.spaceBounds;
        // Rehearse expanded areas and hidden activities too, including flags, geysers and lightning.
        for (let x = B[0] + 30; x < B[1]; x += 35) {
          D.player.x = x; D.player.y = 0; D.player.grounded = true;
          for (let n = 0; n < 8; n++) D.G.space.update(1 / 60, n / 60);
        }
        D.G.interact.filter(t => t.layer === 'space' && t.x > B[0] - 2 && t.x < B[1] + 2 && t.disc && !t.disc.startsWith('space_')).forEach(t => t.run());
        for (let n = 0; n < 8; n++) D.G.space.update(1 / 60, n / 60);
        return { programs: D.renderer.info.programs.map(p => ({ key: p.cacheKey, name: p.name, uses: p.usedTimes })) };
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const late = await page.evaluate(() => __DDW3.renderer.info.programs.map(p => ({ key: p.cacheKey, name: p.name, uses: p.usedTimes })));
      const added = [...row.programs, ...late].filter((p, j, a) => !known.has(p.key) && a.findIndex(q => q.key === p.key) === j);
      visits.push({ ...arrival, newShaders: added });
      console.log(JSON.stringify(visits.at(-1)));
    }
    // Revisit private ring textures: cached shared skies may remain, private maps must not accumulate.
    const textureCounts = [];
    for (let round = 0; round < 2; round++) {
      for (const i of [5, 6]) {
        await page.evaluate(i => __DDW3.G.space.goTo(i), i);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      }
      await page.evaluate(() => __DDW3.G.space.goHome());
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      textureCounts.push(await page.evaluate(() => __DDW3.renderer.info.memory.textures));
    }
    console.log(JSON.stringify({ ringRevisitTextureCounts: textureCounts }));
    assert.equal(textureCounts[1], textureCounts[0], 'revisiting Saturn and Uranus must not leak private ring textures');
    const waits = await page.evaluate(() => __shaderWaits);
    console.log(JSON.stringify({ shaderWaits: waits, errors }));
    assert.deepEqual(errors, [], 'planet travel and activities have no page errors');
    assert.equal(visits.reduce((n, v) => n + v.newShaders.length, 0), 0, 'all planet shader variants must be prepared before play');
    assert.equal(waits.length, 0, 'planet travel must not block on shader readiness');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
