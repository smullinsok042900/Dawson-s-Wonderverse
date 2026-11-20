// (build 109) LIVING CREATURES AND PETS ON MERCURY: Mo, Sunny and Pip-Pebble and six pets are there; Mo copies her walking
// and jumping; Sunny spins and shines; a pet (Quartz) is befriended with ✋ and follows her on Mercury and home to Earth.
// usage: NODE_PATH=$(npm root -g) node tests/mercury-life.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'mercury'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  for (const dx of [60, 150, 250, 320]) { await ev(x => { __DDW3.player.x = x; }, X + dx); await sleep(2500); } // (the areas are built as she walks)
  const find = k => ev(k => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g = null; s.traverse(o => { if (o.userData && o.userData.kind === k && o.userData.body && o.parent && o.parent.type !== 'Scene') g = o; }); return g ? { x: g.position.x, ry: g.rotation.y, by: g.userData.body.position.y } : null; }, k);
  const all = ['mirrormo', 'sunny', 'pebblefolk', 'cinderpuff', 'quartzkit', 'glowpebble', 'flicker', 'sparkmouse', 'lanternowl'], there = {};
  for (const k of all) there[k] = !!(await find(k));
  check('Mercury has Mo, Sunny and Pip-Pebble, and six pets to befriend', all.every(k => there[k]), JSON.stringify(there));
  // Mo copies her: tap, then she walks one way and Mo walks the other way (mirrored)
  await ev(x => { __DDW3.player.x = x; }, X + 25); await sleep(2000); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pal_mirrormo').run()); await sleep(500);
  const m0 = await find('mirrormo'); await ev(x => { __DDW3.player.x = x; }, X + 22); await sleep(4000); const m1 = await find('mirrormo');
  check('tap Mo: Mo copies her (she goes left, Mo goes right, like a mirror)', m0 && m1 && m1.x - m0.x > 1, JSON.stringify({ m0: m0 && +m0.x.toFixed(1), m1: m1 && +m1.x.toFixed(1) }));
  // Sunny spins and shines
  await ev(x => { __DDW3.player.x = x; }, X + 56); await sleep(2000); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pal_sunny').run()); await sleep(700);
  const sun = await ev(() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g = null; s.traverse(o => { if (o.userData && o.userData.kind === 'sunny' && o.userData.body) g = o; }); return g ? +g.userData.body.rotation.z.toFixed(2) : null; });
  check('tap Sunny: she spins and shines', sun != null && Math.abs(sun) > .5, `rotation ${sun}`);
  // Quartz: ✋ and she is a friend, following on Mercury and home
  await ev(x => { __DDW3.player.x = x; }, X + 42); await sleep(2500); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pet_quartzkit').run()); await sleep(500);
  await page.locator('#befriend button[aria-label=pat]').tap(); await sleep(1800);
  const fr = await ev(() => ({ pal: __DDW3.G.expansion.isPal('quartzkit'), follows: __DDW3.G.expansion._followers().includes('quartzkit') }));
  await ev(x => { __DDW3.player.x = x; }, X + 120); await sleep(4000);
  const near = async () => ev(() => { const P = __DDW3.player; let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let m = null; s.traverse(o => { if (o.userData && o.userData.kind === 'quartzkit' && o.parent && o.parent.type === 'Scene') m = o; }); return m ? +Math.abs(m.position.x - P.x).toFixed(1) : null; });
  const onPlanet = await near(); await ev(() => __DDW3.teleport(190)); await sleep(4000); const home = await near();
  check('Quartz is befriended with ✋, follows her across Mercury and comes home to Earth', fr.pal && fr.follows && onPlanet != null && onPlanet < 8 && home != null && home < 8, JSON.stringify({ ...fr, onPlanet, home }));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
