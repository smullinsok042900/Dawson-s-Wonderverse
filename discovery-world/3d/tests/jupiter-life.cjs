// (build 112) LIVING CREATURES AND PETS ON JUPITER: Zappy, Swirly and Big Puff and six pets are there; Swirly spins;
// a pet (Bolt) is befriended with 🍓 and follows her on Jupiter and home to Earth.
// usage: NODE_PATH=$(npm root -g) node tests/jupiter-life.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'jupiter'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  for (const dx of [60, 150, 250, 320]) { await ev(x => { __DDW3.player.x = x; }, X + dx); await sleep(2500); } // (the areas are built as she walks)
  const find = k => ev(k => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g = null; s.traverse(o => { if (o.userData && o.userData.kind === k && o.userData.body && o.parent && o.parent.type !== 'Scene') g = o; }); return g ? { x: g.position.x, ry: g.rotation.y, by: g.userData.body.position.y } : null; }, k);
  const all = ['zappy', 'swirly', 'bigpuff', 'balloonpup', 'jellyfloat', 'thunderchick', 'cloudcub', 'windkite', 'windbunny'], there = {};
  for (const k of all) there[k] = !!(await find(k));
  check('Jupiter has Zappy, Swirly and Big Puff, and six pets to befriend', all.every(k => there[k]), JSON.stringify(there));
  // Swirly spins
  await ev(x => { __DDW3.player.x = x; }, X + 55); await sleep(2000); const d0 = await find('swirly'); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pal_swirly').run()); await sleep(900); const d1 = await find('swirly');
  check('tap Swirly: round and round (Swirly spins)', d0 && d1 && Math.abs(d1.ry - d0.ry) > .5, JSON.stringify({ d0: d0 && d0.ry, d1: d1 && d1.ry }));
  // Bolt: 🍓 and she is a friend, following on Jupiter and home
  await ev(x => { __DDW3.player.x = x; }, X + 100); await sleep(2500); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pet_thunderchick').run()); await sleep(500);
  await page.locator('#befriend button[aria-label=treat]').tap(); await sleep(1800);
  const fr = await ev(() => ({ pal: __DDW3.G.expansion.isPal('thunderchick'), follows: __DDW3.G.expansion._followers().includes('thunderchick') }));
  await ev(x => { __DDW3.player.x = x; }, X + 60); await sleep(4000);
  const near = async () => ev(() => { const P = __DDW3.player; let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let m = null; s.traverse(o => { if (o.userData && o.userData.kind === 'thunderchick' && o.parent && o.parent.type === 'Scene') m = o; }); return m ? +Math.abs(m.position.x - P.x).toFixed(1) : null; });
  const onPlanet = await near(); await ev(() => __DDW3.teleport(190)); await sleep(4000); const home = await near();
  check('Bolt is befriended with 🍓, follows her across Jupiter and comes home to Earth', fr.pal && fr.follows && onPlanet != null && onPlanet < 8 && home != null && home < 8, JSON.stringify({ ...fr, onPlanet, home }));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
