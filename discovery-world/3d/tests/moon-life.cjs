// (build 107) LIVING CREATURES AND PETS ON THE MOON: the Moon's characters and pets are there and move; tapping a
// character starts its little game; a pet is befriended with one of four big picture buttons and then follows her on
// the Moon and back home to Earth; the 🐾 friends show its real picture (and still-to-find pets as silhouettes); after a
// reload it is still her friend (and not on the Moon twice); at most four friends follow at once.
// usage: NODE_PATH=$(npm root -g) node tests/moon-life.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const start = async () => { await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500); };
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await start();
  const toMoon = async () => { await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'moon'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000); return ev(() => __DDW3.G.spaceBounds[0] - 1); };
  const X = await toMoon();
  const kinds = () => ev(() => { const out = {}; let s = __DDW3.G.me().root; while (s.parent) s = s.parent; s.traverse(o => { if (o.userData && o.userData.kind && o.userData.body && o.parent && o.parent.type !== 'Scene') out[o.userData.kind] = (out[o.userData.kind] || 0) + 1; }); return out; });
  const k1 = await kinds();
  check('the Moon has its characters (Rocky, Lumi, Boing) and six pets to befriend', ['rocky', 'lumi', 'boing', 'moonpup', 'craterhop', 'stardrop', 'dustbun', 'orbiter', 'glowsnail'].every(k => k1[k] === 1), JSON.stringify(k1));
  // Rocky: near him he looks at her and waves; tap: "catch me!", and he rolls away
  await ev(x => { __DDW3.player.x = x; }, X + 27); await sleep(2500);
  const r0 = await ev(() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g; s.traverse(o => { if (o.userData && o.userData.kind === 'rocky') g = o; }); return g ? g.position.x : null; });
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'pal_rocky').run()); await sleep(3000);
  const r1 = await ev(() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let g; s.traverse(o => { if (o.userData && o.userData.kind === 'rocky') g = o; }); return g ? g.position.x : null; });
  check('tap Rocky: he plays catch-me and rolls away', r0 != null && Math.abs(r1 - r0) > 1.5, JSON.stringify({ r0, r1 }));
  // a pet: Moonpup. Tap: four big picture buttons; tap the hug: she is a friend and follows
  await ev(x => { __DDW3.player.x = x; }, X + 54); await sleep(2000);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'pet_moonpup').run()); await sleep(500);
  const shown = await page.locator('#befriend.show').isVisible(), btns = await page.locator('#befriend button').count();
  await page.locator('#befriend button[aria-label=hug]').tap(); await sleep(1800);
  const fr = await ev(() => ({ pal: __DDW3.G.expansion.isPal('moonpup'), follows: __DDW3.G.expansion._followers().includes('moonpup') }));
  check('tap Moonpup: four big picture buttons (✋ 🤗 🍓 ⚽ and ✖); a hug makes friends, and Moonpup follows her', shown && btns === 5 && fr.pal && fr.follows, JSON.stringify({ shown, btns, ...fr }));
  // it follows her on the Moon
  await ev(x => { __DDW3.player.x = x; }, X + 90); await sleep(4000);
  const onMoon = await ev(() => { const E = __DDW3.G.expansion, P = __DDW3.player; let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let m; s.traverse(o => { if (o.userData && o.userData.kind === 'moonpup' && o.parent && o.parent.type === 'Scene') m = o; }); return m ? { dx: +Math.abs(m.position.x - P.x).toFixed(1), vis: m.visible } : null; });
  check('Moonpup follows her across the Moon', onMoon && onMoon.dx < 8 && onMoon.vis, JSON.stringify(onMoon));
  // home to Earth: Moonpup comes too
  await ev(() => __DDW3.teleport(190)); await sleep(4000);
  const onEarth = await ev(() => { const P = __DDW3.player; let s = __DDW3.G.me().root; while (s.parent) s = s.parent; let m; s.traverse(o => { if (o.userData && o.userData.kind === 'moonpup' && o.parent && o.parent.type === 'Scene') m = o; }); return m ? { dx: +Math.abs(m.position.x - P.x).toFixed(1), vis: m.visible } : null; });
  check('back home on Earth, Moonpup is with her', onEarth && onEarth.dx < 8 && onEarth.vis, JSON.stringify(onEarth));
  // the 🐾 friends: Moonpup's real picture, still-to-find pets as silhouettes
  await page.locator('#petsBtn').tap(); await sleep(600);
  const panel = await ev(() => { const g = [...document.querySelectorAll('#petsPanel .mpT')]; const one = k => g.find(b => b.dataset.k === k); return { n: g.length, pup: !!(one('moonpup') && one('moonpup').querySelector('img.petPic') && one('moonpup').classList.contains('on')), shadow: !!(one('stardrop') && one('stardrop').querySelector('img.petPic.shadow')) }; });
  check('the 🐾 friends show Moonpup\'s picture (coming along), and the pets still to find as silhouettes', panel.pup && panel.shadow, JSON.stringify(panel));
  await page.locator('#petsPanel .mpX').tap(); await sleep(300);
  // reload: still her friend, and not waiting on the Moon a second time
  await ev(() => __DDW3.save()); await page.reload(); await start();
  const kept = await ev(() => ({ pal: __DDW3.G.expansion.isPal('moonpup'), follows: __DDW3.G.expansion._followers().includes('moonpup') }));
  await toMoon(); await sleep(1500); const k2 = await kinds();
  check('after a reload Moonpup is still her friend and follows; on the Moon there is no second Moonpup', kept.pal && kept.follows && !k2.moonpup, JSON.stringify({ kept, onMoon: k2.moonpup || 0 }));
  // four at most: befriend four more; the fifth waits in 🐾 (does not follow)
  const X2 = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  for (const [k, dx] of [['dustbun', 66], ['craterhop', 128], ['stardrop', 178], ['orbiter', 206]]) {
    await ev(x => { __DDW3.player.x = x; }, X2 + dx - 2); await sleep(2500);
    await ev(k => { const it = __DDW3.G.interact.find(i => i.disc === 'pet_' + k); it && it.run(); }, k); await sleep(400);
    if (await page.locator('#befriend.show').count()) await page.locator('#befriend button[aria-label=treat]').tap(); await sleep(1200); }
  const four = await ev(() => ({ n: __DDW3.G.expansion._followers().length, orbitFriend: __DDW3.G.expansion.isPal('orbiter'), orbitFollows: __DDW3.G.expansion._followers().includes('orbiter') }));
  check('at most four friends follow at once: the fifth (Orbit) is her friend but waits in 🐾', four.n <= 4 && four.orbitFriend && !four.orbitFollows, JSON.stringify(four));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'moon-pets.jpg'), quality: 75, type: 'jpeg' });
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
