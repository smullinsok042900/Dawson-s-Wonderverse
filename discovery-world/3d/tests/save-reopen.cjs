// Save lifecycle regression, real page closes/reloads; desktop software rendering.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const KEY = 'dawsons-discovery-world-3d-v1';
const URL = 'file://' + path.resolve(__dirname, '../index.html') + '?test';
const TIMEOUT = 240000;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const trace = [], errors = [];
  async function open(ctx, corrupt) {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.text().startsWith('SAVE_TRACE ')) trace.push(JSON.parse(m.text().slice(11))); });
    await page.addInitScript(({ key, corrupt }) => {
      const log = (kind, value) => console.log('SAVE_TRACE ' + JSON.stringify({ kind, value: String(value).slice(0, 100), at: performance.now(), stack: new Error().stack.split('\n').slice(2, 6) }));
      for (const method of ['getItem', 'setItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (k, ...args) {
          const value = original.call(this, k, ...args);
          if (k === key) log(method, method === 'getItem' ? value : args[0]);
          return value;
        };
      }
      for (const event of ['pagehide', 'pageshow', 'visibilitychange', 'storage']) addEventListener(event, () => log(event, document.visibilityState));
      if (corrupt) localStorage.setItem(key, '{broken');
    }, { key: KEY, corrupt });
    await page.goto(URL, { timeout: TIMEOUT });
    await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: TIMEOUT });
    return page;
  }
  const options = { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true };
  try {
    const ctx = await browser.newContext(options);
    let page = await open(ctx, false);
    await page.locator('#playBtn').tap();
    // Distinct progress survives a normal close/reload; corrupt JSON must not retain it.
    await page.evaluate(() => { const D = __DDW3; D.world.crown = true; D.world.wand = true; D.world.pets = [{ col: 2, ears: 1, tail: 1, pat: 2 }]; D.world.disc.add('save-reopen-marker'); D.save(); });
    await page.reload();
    await page.waitForFunction(() => window.__DDW3 && document.querySelector('#loading.done'), null, { timeout: TIMEOUT });
    assert.match(await page.locator('#playBtn').textContent(), /KEEP/);
    assert.equal(await page.evaluate(() => __DDW3.world.crown && __DDW3.world.wand && __DDW3.friends.petCount() === 1 && __DDW3.world.disc.has('save-reopen-marker')), true);
    console.log('PASS valid save survives reload with pets, crown and wand');
    await page.locator('#playBtn').tap();
    await page.close();
    page = await open(ctx, true);
    assert.match(await page.locator('#playBtn').textContent(), /LET'S/, 'closed previous game must not overwrite injected corrupt save before new boot');
    assert.equal(await page.evaluate(() => !__DDW3.world.crown && !__DDW3.world.wand && __DDW3.friends.petCount() === 0 && !__DDW3.world.disc.has('save-reopen-marker')), true, 'corrupted save starts fresh without stale progress');
    console.log('PASS close/corrupt/reopen ignores stale progress');
    await page.locator('#playBtn').tap();
    await page.evaluate(() => __DDW3.save());
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).v, KEY), 1, 'fresh game can save normally after ignoring invalid JSON');
    await ctx.close();
    const fresh = await browser.newContext(options);
    page = await open(fresh, true);
    assert.match(await page.locator('#playBtn').textContent(), /LET'S/, 'isolated corrupt save also starts fresh');
    await fresh.close();
    assert.deepEqual(errors, []);
    console.log('PASS valid reload preserves progress; close/corrupt/reopen and isolated corruption start fresh; saving recovers');
  } finally {
    console.log('SAVE_LIFECYCLE_TRACE', JSON.stringify(trace));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
