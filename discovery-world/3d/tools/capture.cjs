#!/usr/bin/env node
// Screenshot + model-cost harness for the built game (index.html, one offline file).
//
// Setup once (playwright is a devDependency, so `npm ci` installs it):
//   cd discovery-world/3d
//   npm ci
//   npx playwright install chromium-headless-shell
//
// Capture (paths are relative to this folder's parent, discovery-world/3d):
//   node tools/capture.cjs docs/screenshots/stage9 '[["after-garden",676],["after-art",820]]'
//   node tools/capture.cjs docs/screenshots/stage9 '[["after-garden",676]]' --probes '{"wheel":"G.wheel.group"}'
//
// What it does: loads index.html, taps Play, waits for the loading screen, waits WARMUP ms so streamed
// landmark GLBs arrive, teleports to each x, waits until the camera stops easing (so a zoom-in camera cannot
// bias a pair), then screenshots 1280x720 and prints one renderer.info sample per shot.
//
// Environment:
//   HTML=/abs/path/index.html   capture another build (e.g. the previous commit, built into /tmp/before)
//   --place moon                fly to a space place first (moon, mars, …); shot x values are then offsets
//                               from where that place starts, so the planet-approach views can be captured
//   WARMUP=11000                ms to wait after the loading screen before the first shot
//   WIDTH=1280 HEIGHT=720       viewport
//   SETTLE=1200                 ms to wait after the camera stops before the screenshot
//   LOG=<path>                  JSON report (default <outDir>/capture.json; "-" prints only)
//
// Probes (--probes or PROBES env) map a name to a JS expression evaluated with `D` = window.__DDW3,
// e.g. '{"wheel":"D.G.wheel.group"}' or '{"dino":"D.scene.getObjectByName(\'dino-detail\')"}'. Each probe
// reports mesh count and triangle count, which is how geometry changes are measured without whole-scene
// totals (slice streaming moves those between runs). Probes run after every shot, because streamed details
// only exist once the player is near them.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GAME = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith('--'));
const flag = name => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : undefined; };

const OUT = path.resolve(GAME, positional[0] || 'docs/screenshots/capture');
const SHOTS = JSON.parse(positional[1] || '[]');
const URL = 'file://' + (process.env.HTML || path.join(GAME, 'index.html'));
const WARMUP = +process.env.WARMUP || 11000;
const SETTLE = process.env.SETTLE === undefined ? 1200 : +process.env.SETTLE;
const WIDTH = +process.env.WIDTH || 1280, HEIGHT = +process.env.HEIGHT || 720;
const PROBES = JSON.parse(flag('probes') || process.env.PROBES || '{}');
const PLACE = flag('place') || process.env.PLACE || '';
const LOG = process.env.LOG === '-' ? null : (process.env.LOG || path.join(OUT, 'capture.json'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); // (stage 12) page.screenshot times out when software WebGL saturates the compositor; CDP captures the last frame instead
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.locator('#playBtn').waitFor({ state: 'visible', timeout: 120000 });
  await page.evaluate(() => document.getElementById('playBtn').click());
  await page.waitForFunction(
    () => document.getElementById('loading') && document.getElementById('loading').classList.contains('done'),
    null, { timeout: 180000 });
  await sleep(WARMUP);
  if (PLACE) { // (stage 21) fly to a planet and wait until the rocket is gone and the place has been built
    await page.evaluate(id => window.__DDW3.G.launchTo(id), PLACE);
    await page.waitForFunction(id => { const P = window.__DDW3.player; return P.layer === 'space' && !P.ride && window.__DDW3.G.spaceHere() === id; }, PLACE, { timeout: 240000 });
    await sleep(3000);
  }
  const goShot = x => page.evaluate(({ x, place }) => {
    const D = window.__DDW3, P = D.player;
    if (!place) return D.teleport(x);
    const B = D.G.spaceBounds; P.x = Math.min(B[1] - 4, B[0] + x); P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.jumps = 0;
  }, { x, place: PLACE });

  const runProbes = () => page.evaluate(probes => {
    const D = window.__DDW3;
    const tri = g => !g ? 0 : (g.index ? g.index.count / 3 : g.attributes.position.count / 3);
    const cost = o => {
      if (!o) return null;
      let n = 0, t = 0;
      o.traverse(x => {
        if (x.isMesh && x.geometry) { n++; const tt = tri(x.geometry); t += x.isInstancedMesh ? tt * x.count : tt; }
      });
      return { meshes: n, tris: Math.round(t) };
    };
    const out = {};
    for (const [name, expr] of Object.entries(probes)) {
      try { out[name] = cost(new Function('D', 'return (' + expr + ')')(D)); }
      catch (e) { out[name] = { error: String(e.message) }; }
    }
    return out;
  }, PROBES);

  const out = { url: URL, shots: [], models: await runProbes(), errors, oops: false };
  out.oops = await page.evaluate(() => !(document.getElementById('oops') || { hidden: true }).hidden);

  for (const [name, x] of SHOTS) {
    await goShot(x);
    await page.evaluate(() => { delete window.__ddwCam; });
    await sleep(2600);
    await page.waitForFunction(() => {
      const c = window.__DDW3.camera.position;
      const p = window.__ddwCam || (window.__ddwCam = { x: c.x, y: c.y, z: c.z });
      const still = Math.abs(c.x - p.x) < .0015 && Math.abs(c.y - p.y) < .0015 && Math.abs(c.z - p.z) < .0015;
      p.x = c.x; p.y = c.y; p.z = c.z;
      return still;
    }, null, { timeout: 30000, polling: 500 });
    await sleep(SETTLE);
    const info = await page.evaluate(() => {
      const D = window.__DDW3;
      D.renderer.info.reset();
      D.renderer.render(D.scene, D.camera);
      const r = D.renderer.info.render;
      return { calls: r.calls, tris: r.triangles, geos: D.renderer.info.memory.geometries, progs: D.renderer.info.programs.length };
    });
    try {
      { const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(shot.data, 'base64')); }
      out.shots.push({ name, x, info, models: await runProbes() });
    } catch (e) {
      out.errors.push('shot ' + name + ': ' + e.message.split('\n')[0]);
      break;
    }
  }

  const text = JSON.stringify(out, null, 2) + '\n';
  if (LOG) fs.writeFileSync(LOG, text);
  console.log(text);
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch(e => { console.error('ERR', e); process.exit(1); });
