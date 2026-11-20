// (build 110) LIVING CREATURES AND PETS ON VENUS: Nimbus, Puffo and Coral and six pets are there; Puffo plays
// hide-and-seek (vanishes and pops up somewhere else); a pet (Drip) is befriended with 🤗 and follows her on Venus and home.
// usage: NODE_PATH=$(npm root -g) node tests/venus-life.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'venus'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  for (const dx of [60, 150, 250, 320]) { await ev(x => { __DDW3.player.x = x; }, X + dx); await sleep(2500); } // (the areas are built as she walks)
  const find = k => ev(k => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g = null; s.traverse(o => { if (o.userData && o.userData.kind === k && o.userData.body && o.parent && o.parent.type !== 'Scene') g = o; }); return g ? { x: g.position.x, ry: g.rotation.y, by: g.userData.body.position.y } : null; }, k);
  const all = ['nimbus', 'puffo', 'coral', 'mistlamb', 'sunsetfly', 'cloudkit', 'airfish', 'dewdrop', 'puffbird'], there = {};
  for (const k of all) there[k] = !!(await find(k));
  check('Venus has Nimbus, Puffo and Coral, and six pets to befriend', all.every(k => there[k]), JSON.stringify(there));
  // Puffo: hide-and-seek
  await ev(x => { __DDW3.player.x = x; }, X + 86); await sleep(2000); const p0 = await find('puffo'); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pal_puffo').run()); await sleep(400);
  const hidden = await ev(() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g = null; s.traverse(o => { if (o.userData && o.userData.kind === 'puffo' && o.userData.body) g = o; }); return g ? g.visible : null; });
  await sleep(4000); const p1 = await find('puffo'); const back = await ev(() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g = null; s.traverse(o => { if (o.userData && o.userData.kind === 'puffo' && o.userData.body) g = o; }); return g ? g.visible : null; });
  check('tap Puffo: peekaboo! Puffo vanishes, then pops up somewhere else', hidden === false && back === true && p0 && p1 && Math.abs(p1.x - p0.x) > 1, JSON.stringify({ hidden, back, from: p0 && +p0.x.toFixed(1), to: p1 && +p1.x.toFixed(1) }));
  // Drip: 🤗 and she is a friend, following on Venus and home
  await ev(x => { __DDW3.player.x = x; }, X + 72); await sleep(2500); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pet_dewdrop').run()); await sleep(500);
  await page.locator('#befriend button[aria-label=hug]').tap(); await sleep(1800);
  const fr = await ev(() => ({ pal: __DDW3.G.expansion.isPal('dewdrop'), follows: __DDW3.G.expansion._followers().includes('dewdrop') }));
  await ev(x => { __DDW3.player.x = x; }, X + 120); await sleep(4000);
  const near = async () => ev(() => { const P = __DDW3.player; let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let m = null; s.traverse(o => { if (o.userData && o.userData.kind === 'dewdrop' && o.parent && o.parent.type === 'Scene') m = o; }); return m ? +Math.abs(m.position.x - P.x).toFixed(1) : null; });
  const onPlanet = await near(); await ev(() => __DDW3.teleport(190)); await sleep(4000); const home = await near();
  check('Drip is befriended with 🤗, follows her across Venus and comes home to Earth', fr.pal && fr.follows && onPlanet != null && onPlanet < 8 && home != null && home < 8, JSON.stringify({ ...fr, onPlanet, home }));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
