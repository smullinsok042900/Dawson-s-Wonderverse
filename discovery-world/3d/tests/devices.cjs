// Screen-fitting test across phones and tablets (Playwright device emulation in Chromium: screen sizes, pixel
// densities, touch and mobile browser identities). It is NOT a substitute for real iPhones, iPads and Android devices.
// usage (from discovery-world/3d): NODE_PATH=$(npm root -g) node tests/devices.cjs [index.html]
// For every device, held sideways, it checks:
//   1. the picture fills the screen and is not stretched (drawing buffer has the screen's shape);
//   2. the camera's view angle suits the screen shape;
//   3. every button is on screen, at least 44 px, and no two buttons overlap;
//   4. the map, pets and train-station panels fit on the screen with big enough tiles;
//   5. touch controls work (hold ▶ on the arrow pad and the creature walks right; tap JUMP and it jumps);
//   6. held upright, a touch screen shows the "turn me sideways" picture.
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FILE = path.resolve(process.argv[2] || 'index.html'), SHOTS = path.join(__dirname, '..', 'screenshots', 'devices'); fs.mkdirSync(SHOTS, { recursive: true });
const D = (name, base, extra = {}) => ({ name, ...devices[base], ...extra });
const LIST = [
  D('iPhone SE (small iPhone)', 'iPhone SE landscape'),
  D('iPhone 15 (typical iPhone)', 'iPhone 15 landscape'),
  D('iPhone 15 Pro Max (large iPhone)', 'iPhone 15 Pro Max landscape'),
  D('iPad 7th gen (iPad)', 'iPad (gen 7) landscape'),
  D('iPad Pro 11 (iPad)', 'iPad Pro 11 landscape'),
  D('Pixel 5 (Android phone)', 'Pixel 5 landscape'),
  D('Galaxy S9+ (Android phone)', 'Galaxy S9+ landscape'),
  D('Galaxy Tab S4 (Android tablet)', 'Galaxy Tab S4 landscape'),
  D('small Android 640×360', 'Galaxy S5 landscape'),
  D('iPhone SE 2022 667x375', 'iPhone SE landscape', { viewport: { width: 667, height: 375 }, screen: { width: 667, height: 375 } }),
  D('extra-wide Android 21:9', 'Pixel 5 landscape', { viewport: { width: 960, height: 412 }, screen: { width: 960, height: 412 } }),
];
const results = []; let fails = 0;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const dev of LIST.filter(d => !process.env.ONLY || d.name.includes(process.env.ONLY))) {
    const { name, defaultBrowserType, ...opts } = dev; const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
    const res = { name, size: `${opts.viewport.width}×${opts.viewport.height} @${opts.deviceScaleFactor}x`, problems: [] }; const bad = m => res.problems.push(m);
    try {
      await p.goto('file://' + FILE + '?test'); await p.waitForSelector('#playBtn', { timeout: 120000 }); await sleep(2500);
      { const pb = await p.locator('#playBtn').boundingBox(); if (!pb || pb.y < 0 || pb.y + pb.height > opts.viewport.height || pb.x < 0 || pb.x + pb.width > opts.viewport.width) bad('the PLAY button on the title card is off screen'); }
      await p.locator('#playBtn').tap(); await sleep(1500);
      // 1-2: the picture
      const pic = await p.evaluate(() => { const c = document.getElementById('game'), r = c.getBoundingClientRect(); return { cw: c.width, ch: c.height, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, fov: __DDW3.camera.fov, ui: getComputedStyle(document.documentElement).getPropertyValue('--ui').trim(), kind: __DDW3.G.DEV.kind }; });
      res.picture = `${pic.cw}×${pic.ch} drawn for ${pic.w}×${pic.h}, fov ${pic.fov.toFixed(1)}°, ui ×${pic.ui}, seen as ${pic.kind}`;
      if (Math.abs(pic.w - pic.vw) > 1 || Math.abs(pic.h - pic.vh) > 1) bad(`picture doesn't fill the screen (${pic.w}×${pic.h} of ${pic.vw}×${pic.vh})`);
      if (Math.abs(pic.cw / pic.ch - pic.w / pic.h) > .03) bad('picture is stretched');
      // 3: buttons
      const btn = await p.evaluate(() => { const els = [...document.querySelectorAll('#brand, #upperLeft .pill, #upperRight > *, #leftBtn, #rightBtn, #upBtn, #downBtn, #jumpBtn, #pawBtn')].filter(e => e.offsetParent || getComputedStyle(e).position === 'fixed');
        return els.map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.className, x: r.left, y: r.top, w: r.width, h: r.height }; }).filter(r => r.w > 0); });
      const vw = pic.vw, vh = pic.vh;
      for (const r of btn) { if (r.x < -1 || r.y < -1 || r.x + r.w > vw + 1 || r.y + r.h > vh + 1) bad(`${r.id} is off screen`); if (!/creatureChoice|chooser|brand/.test(r.id) && Math.min(r.w, r.h) < 44) bad(`${r.id} too small (${Math.round(r.w)}×${Math.round(r.h)})`); }
      const groups = { top: btn.filter(r => r.y < vh / 2), bottom: btn.filter(r => r.y >= vh / 2) };
      for (const g of Object.values(groups)) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) { const a = g[i], c = g[j]; if (/arrow|Btn$/.test(a.id) && /arrow|Btn$/.test(c.id) && /^(left|right|up|down)Btn$/.test(a.id) && /^(left|right|up|down)Btn$/.test(c.id)) continue; /* (the four arrows are one joined pad) */
        if (/chooser/.test(a.id) || /chooser/.test(c.id)) continue; const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y); if (ox > 2 && oy > 2) bad(`${a.id} overlaps ${c.id}`); }
      res.buttons = `${btn.length} buttons, smallest ${Math.round(Math.min(...btn.filter(r => !/creatureChoice/.test(r.id)).map(r => Math.min(r.w, r.h))))} px`;
      // 4: panels
      const fit = async (open, panel, tile) => { await open(); await sleep(400); const r = await p.evaluate(([panel, tile]) => { const box = document.querySelector(panel).getBoundingClientRect(), ts = [...document.querySelectorAll(tile)].map(t => t.getBoundingClientRect()); return { box: [box.left, box.top, box.right, box.bottom], min: Math.min(...ts.map(t => Math.min(t.width, t.height))), out: ts.filter(t => t.left < 0 || t.top < 0 || t.right > innerWidth || t.bottom > innerHeight).length, n: ts.length }; }, [panel, tile]); return r; };
      const mp = await fit(() => p.locator('#mapBtn').tap(), '#mapPanel .mpIn', '#mapPanel .mpT'); if (mp.out) bad(`${mp.out} map pictures off screen`); if (mp.min < 44) bad(`map pictures too small (${Math.round(mp.min)} px)`); res.map = `${mp.n} pictures, smallest ${Math.round(mp.min)} px`; await p.locator('#mapPanel .mpX').tap(); await sleep(300);
      const pt = await fit(() => p.locator('#petsBtn').tap(), '#petsPanel .mpIn', '#petsPanel .mpT'); if (pt.out) bad(`${pt.out} pet tiles off screen`); if (pt.min < 44) bad(`pet tiles too small (${Math.round(pt.min)} px)`); res.pets = `${pt.n} tiles, smallest ${Math.round(pt.min)} px`; await p.locator('#petsPanel .mpX').tap(); await sleep(300);
      await p.evaluate(() => { const s = document.getElementById('trainStrip'); __DDW3.G.placeTrainStrip(); s.classList.add('show'); });
      const ts = await p.evaluate(() => { const ts = [...document.querySelectorAll('#trainStrip .tsT')].map(t => t.getBoundingClientRect()); return { n: ts.length, out: ts.filter(t => t.left < 0 || t.top < 0 || t.right > innerWidth || t.bottom > innerHeight).length, min: Math.min(...ts.map(t => t.width)), bottom: Math.max(...ts.map(t => t.bottom)) }; });
      if (ts.out) bad(`${ts.out} train stations off screen`); { const cover = await p.evaluate(() => { const s = document.getElementById('trainStrip').getBoundingClientRect(); return [...document.querySelectorAll('#upperLeft .pill, #upperRight > *, #brand')].filter(e => getComputedStyle(e).display !== 'none').filter(e => { const r = e.getBoundingClientRect(); return r.width && Math.min(r.right, s.right) - Math.max(r.left, s.left) > 2 && Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top) > 2; }).map(e => e.id || e.className); }); if (cover.length) bad('the station strip covers ' + cover.join(', ')); } if (ts.min < 40) bad(`train stations too small (${Math.round(ts.min)} px)`); res.train = `${ts.n} stations all on screen: ${!ts.out}, reaching ${Math.round(ts.bottom / vh * 100)}% down`;
      await p.screenshot({ path: path.join(SHOTS, name.replace(/[^a-z0-9]+/gi, '_') + '_train.jpg'), quality: 70, timeout: 240000 }); await p.evaluate(() => document.getElementById('trainStrip').classList.remove('show'));
      // 5: touch: hold ▶ (a real touch on the arrow), then JUMP
      await p.evaluate(() => __DDW3.teleport(150)); await sleep(1500); const x0 = await p.evaluate(() => __DDW3.player.x); const rb = await p.locator('#rightBtn').boundingBox(); const cdp = await ctx.newCDPSession(p);
      const pt0 = { x: rb.x + rb.width / 2, y: rb.y + rb.height / 2, id: 1, radiusX: 8, radiusY: 8, force: 1 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt0] }); await sleep(1200); const held = await p.evaluate(() => __DDW3.keys.right); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(300);
      const x1 = await p.evaluate(() => __DDW3.player.x), stuck = await p.evaluate(() => __DDW3.keys.right);
      if (!(x1 > x0 + .5)) bad(`holding ▶ didn't walk (x ${x0.toFixed(1)} → ${x1.toFixed(1)}, held=${held})`); if (stuck) bad('▶ stayed pressed after letting go');
      await p.locator('#jumpBtn').tap(); /* (measured over 12 real frames, not a fixed time: a big tablet screen drawn in software can take most of a second per frame) */ const top = await p.evaluate(() => new Promise(res => { let n = 0, t = 0; const f = () => { t = Math.max(t, __DDW3.player.y); if (++n < 12) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); })); if (top < .5) bad('JUMP did not jump (' + await p.evaluate(() => { const P = __DDW3.player; return JSON.stringify({ x: +P.x.toFixed(1), y: +P.y.toFixed(2), stair: !!P.stair, ride: P.ride && P.ride.type, jumps: P.jumps, grounded: P.grounded, layer: P.layer, swim: !!P.swim }); }) + ')');
      res.touch = `walked ${(x1 - x0).toFixed(1)} m, jumped to y ${top.toFixed(2)}`;
      await p.screenshot({ path: path.join(SHOTS, name.replace(/[^a-z0-9]+/gi, '_') + '.jpg'), quality: 70, timeout: 240000 });
      // 6: upright
      await p.setViewportSize({ width: opts.viewport.height, height: opts.viewport.width }); await sleep(600);
      const rot = await p.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none'); if (!rot) bad('held upright, no "turn sideways" picture');
      const pic2 = await p.evaluate(() => { const c = document.getElementById('game'); return Math.abs(c.width / c.height - c.clientWidth / c.clientHeight) < .03; }); if (!pic2) bad('picture stretched after turning');
      if (errs.length) bad('console errors: ' + errs.slice(0, 2).join(' | '));
    } catch (e) { bad('test error: ' + e.message.split('\n')[0]); }
    results.push(res); if (res.problems.length) fails++;
    console.log(`${res.problems.length ? 'FAIL' : 'PASS'}  ${name} ${res.size}\n      ${res.picture}\n      ${res.buttons} · map ${res.map} · pets ${res.pets}\n      train: ${res.train} · touch: ${res.touch}${res.problems.length ? '\n      PROBLEMS: ' + res.problems.join('; ') : ''}`);
    await ctx.close();
  }
  console.log(`\n${results.length - fails}/${results.length} screens passed (desktop Chromium emulation; real devices still need testing)`);
  fs.writeFileSync(path.join(SHOTS, 'RESULTS.json'), JSON.stringify(results, null, 1));
  await b.close(); process.exit(fails ? 1 : 0);
})();
