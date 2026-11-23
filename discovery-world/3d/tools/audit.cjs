// Scene audit at one or more player x positions, using the in-game auditor.
//   node tools/audit.cjs -200 -250
//   node tools/audit.cjs --place moon 12 120    (audit a space place; x values are offsets from its start)
// Prints the audit summary per position (duplicates, z-fighting, buried objects,
// solids/platforms and any malformed entries). Run after `npm run build`.
const { chromium } = require('playwright');
const path = require('path');

const GAME = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(GAME, process.env.HTML || 'index.html');
const PLACE = process.env.PLACE || (() => { const i = process.argv.indexOf('--place'); return i >= 0 ? process.argv[i + 1] : ''; })();
const XS = process.argv.slice(2).map(Number).filter(n => Number.isFinite(n));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await page.waitForFunction(() => window.__DDW3 && window.__DDW3.audit, null, { timeout: 60000 });
  if (PLACE) {
    await page.evaluate(id => window.__DDW3.G.launchTo(id), PLACE);
    await page.waitForFunction(id => { const P = window.__DDW3.player; return P.layer === 'space' && !P.ride && window.__DDW3.G.spaceHere() === id; }, PLACE, { timeout: 240000 });
    await page.waitForTimeout(3000);
  }
  const out = {};
  for (const x of XS) {
    await page.evaluate(({ x, place }) => {
      const D = window.__DDW3, P = D.player;
      if (!place) return D.teleport(x);
      const B = D.G.spaceBounds; P.x = Math.min(B[1] - 4, B[0] + x); P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.jumps = 0;
    }, { x, place: PLACE });
    await page.waitForTimeout(3200);
    out[x] = await page.evaluate(() => {
      const a = window.__DDW3.audit();
      return { dups: a.duplicates?.length ?? a.dups ?? null, zfight: a.zFighting?.length ?? a.zfight ?? null, buried: a.buried?.length ?? null, solids: a.solids, platforms: a.platforms };
    });
  }
  console.log(JSON.stringify({ errors, audit: out }, null, 1));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
