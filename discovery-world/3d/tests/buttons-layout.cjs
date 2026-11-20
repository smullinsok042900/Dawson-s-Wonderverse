// (build 111) THE BIG EXTRA BUTTONS DO NOT COVER OTHER BUTTONS: on three phone sizes, in a Play Together room, the 🫧 (blow
// a bubble), the 🏁 (off the coaster) and the 💥 (pop my bubble) sit just left of 🐾 and overlap no other button (before,
// 🏁 and 🫧 covered ⚙️ and 🔊 when the top buttons wrapped onto several rows). The voice button always shows a microphone.
// usage: NODE_PATH=$(npm root -g) node tests/buttons-layout.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('path'); const { start } = require('./mp-relay.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0; const check = (name, ok, info = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!ok) fail++; };
(async () => {
  const PORT = 18801, relay = start(PORT), file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`file://${file}?test&mp=ws://127.0.0.1:${PORT}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await p.locator('#playBtn').tap(); await sleep(1500);
  await p.locator('#mpBtn').tap(); await sleep(300); await p.locator('#mpPanel .mpBig[data-a=create]').tap(); await p.waitForFunction(() => !!__DDW3.G.mp.room, null, { timeout: 30000 });
  await p.evaluate(() => { const pn = document.getElementById('mpPanel'); pn && pn.classList.remove('show'); }); await sleep(800);
  // every other visible button, against one of ours
  const clash = id => p.evaluate(id => { const me = document.getElementById(id); if (!me) return { missing: true }; const r = me.getBoundingClientRect(); if (!r.width || getComputedStyle(me).display === 'none') return { hidden: true };
    const hit = []; for (const el of document.querySelectorAll('button, .pill, .ctrl')) { if (el === me || me.contains(el) || el.contains(me)) continue; if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue; const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || s.pointerEvents === 'none') continue; /* (only buttons she can see) */ const q = el.getBoundingClientRect(); if (!q.width || !q.height) continue;
      if (r.left < q.right - 2 && q.left < r.right - 2 && r.top < q.bottom - 2 && q.top < r.bottom - 2) hit.push(el.id || el.className || el.textContent.slice(0, 4)); }
    return { box: [r.left, r.top, r.width, r.height].map(Math.round), inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, hit }; }, id);
  for (const [name, w, h] of [['iphone', 844, 390], ['small-phone', 667, 375], ['android', 740, 360]]) {
    await p.setViewportSize({ width: w, height: h }); await sleep(800);
    const blow = await clash('bubbleBtn');
    // the coaster's 🏁 (shown as on a ride) and the bubble's 💥
    await p.evaluate(() => { document.getElementById('bubbleBtn').classList.add('riding'); }); await p.evaluate(() => { const b = document.getElementById('coasterSkip'); if (b) { b.classList.add('show'); __DDW3.G.besidePaw(b); } });
    let flag = await clash('coasterSkip'); if (flag.missing) { await p.evaluate(() => { const b = document.createElement('button'); b.id = 'coasterSkip'; b.className = 'pill show'; b.textContent = '🏁'; document.body.appendChild(b); __DDW3.G.besidePaw(b); }); flag = await clash('coasterSkip'); }
    await p.evaluate(() => { document.getElementById('coasterSkip').classList.remove('show'); const e = document.getElementById('bubbleEsc'); e.classList.add('show'); __DDW3.G.besidePaw(e); document.body.classList.add('inBubble'); });
    const esc = await clash('bubbleEsc');
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', `buttons-${name}.jpg`), quality: 70, type: 'jpeg' });
    await p.evaluate(() => { document.getElementById('bubbleEsc').classList.remove('show'); document.body.classList.remove('inBubble'); document.getElementById('bubbleBtn').classList.remove('riding'); });
    check(`${name} (${w}×${h}): 🫧, 🏁 and 💥 are on screen and cover no other button`, [blow, flag, esc].every(q => q.inView && !q.hit.length), JSON.stringify({ blow, flag, esc }));
  }
  await p.setViewportSize({ width: 844, height: 390 });
  const mic = await p.evaluate(() => { const b = document.getElementById('vcBtn'); return b ? b.querySelector('.vcIc').textContent : null; });
  check('the voice button shows a microphone (🎤), never the 🔇 speaker', mic === '🎤', String(mic));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); await b.close(); relay.close(); process.exit(fail ? 1 : 0);
})();
