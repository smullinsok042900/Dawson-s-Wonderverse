// Scene audit at one or more player x positions, using the in-game auditor.
//   node tools/audit.cjs -200 -250
// Prints the audit summary per position (duplicates, z-fighting, buried objects,
// solids/platforms and any malformed entries). Run after `npm run build`.
const { chromium } = require('playwright');
const path = require('path');

const GAME = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(GAME, process.env.HTML || 'index.html');
const XS = process.argv.slice(2).map(Number).filter(n => Number.isFinite(n));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await page.waitForFunction(() => window.__DDW3 && window.__DDW3.audit, null, { timeout: 60000 });
  const out = {};
  for (const x of XS) {
    await page.evaluate(x => window.__DDW3.teleport(x), x);
    await page.waitForTimeout(3200);
    out[x] = await page.evaluate(() => {
      const a = window.__DDW3.audit();
      return { dups: a.duplicates?.length ?? a.dups ?? null, zfight: a.zFighting?.length ?? a.zfight ?? null, buried: a.buried?.length ?? null, solids: a.solids, platforms: a.platforms };
    });
  }
  console.log(JSON.stringify({ errors, audit: out }, null, 1));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
