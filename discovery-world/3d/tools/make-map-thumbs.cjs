// (build 64) Real pictures for the map: a small screenshot of every place you can travel to, built into the game as
// src/map-thumbs.js (about 8 KB each), so a child who cannot read sees WHERE each map button goes.
// Run after a place changes a lot:  NODE_PATH=$(npm root -g) node tools/make-map-thumbs.cjs   then  node build.mjs
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// the spot that shows each place best (the map still takes you to the place's own entrance)
const SHOW = { home: 190, 'the Playhouse': 21, 'the Studio': 70, 'the Wonder Lab': 104, 'the Adventure Park': 152, 'the castle': 402,
  'Balloon Hills': -688, 'Ocean Pier': -636, 'Happy Farm': -421, 'Frosty Peaks': -378, 'Whispering Woods': -262, 'Sunny Seaside': -98,
  'Adventure Trail': 451, 'Toy Town': 606, 'Lab Gardens': 692, 'Art Plaza': 812 };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 640, height: 300 }, deviceScaleFactor: 1 })).newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?hq', { timeout: 600000 });
  await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await p.locator('#playBtn').click(); await sleep(1500);
  await p.evaluate(() => { const s = document.createElement('style'); s.textContent = 'body>*:not(canvas):not(#c){visibility:hidden!important} canvas{visibility:visible!important}'; document.head.appendChild(s); __DDW3.G.adaptFrozen = true; });
  const names = await p.evaluate(() => (__DDW3.G.travelList || []).map(t => t[1]));
  const out = {};
  for (const name of names) {
    const x = SHOW[name]; if (x == null) { console.log('no spot for', name); continue; }
    await p.evaluate(x => { const D = __DDW3; D.teleport(x); D.G.expansion.buildNow(x); D.G.playerHidden = true; if (D.G.playerBody) D.G.playerBody.visible = false; }, x);
    await sleep(4000);
    const buf = await p.screenshot({ type: 'jpeg', quality: 72, clip: { x: 80, y: 20, width: 480, height: 270 } });
    out[name] = 'data:image/jpeg;base64,' + buf.toString('base64'); console.log(name, Math.round(buf.length / 1024) + ' KB');
  }
  await b.close();
  fs.writeFileSync(path.resolve(__dirname, '..', 'src', 'map-thumbs.js'), '// (build 64) made by tools/make-map-thumbs.cjs: a small real picture of every map place\nexport const MAP_THUMBS = ' + JSON.stringify(out) + ';\n');
  console.log('written', Object.keys(out).length, 'pictures');
})().catch(e => { console.error(e); process.exit(1); });
