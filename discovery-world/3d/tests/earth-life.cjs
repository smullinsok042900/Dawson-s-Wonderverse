// (build 117) LIVING CREATURES AND PETS ON EARTH: Puffy, Shroomy and Twiggy and five woodland pets are in the Whispering
// Woods, Sparkle the unicorn foal on Balloon Hills; Shroomy bounces high; Sparkle is befriended with 🍓 and follows her
// through the woods and to the park; walking far away and back frees the woods and builds them again with no errors.
// usage: NODE_PATH=$(npm root -g) node tests/earth-life.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').tap(); await sleep(2500);
  const all = ['puffball', 'shroomy', 'twiggy', 'hedgehog', 'fawn', 'ladybug', 'raccoonkit', 'otterpup'];
  const find = k => ev(k => { let g = null; (() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; return s; })().traverse(o => { if (o.userData && o.userData.kind === k && o.userData.body && o.parent && o.parent.type !== 'Scene') g = o; }); return g ? { x: g.position.x, by: g.userData.body.position.y } : null; }, k);
  await ev(() => __DDW3.teleport(-200)); const built = await until(() => !!__DDW3.G.interact.find(i => i.disc === 'pet_fawn'), null, 120000); await sleep(2000);
  const there = {}; for (const k of all) there[k] = !!(await find(k));
  check('the Whispering Woods have Puffy, Shroomy and Twiggy, and five pets to befriend', built && all.every(k => there[k]), JSON.stringify(there));
  // Shroomy bounces high
  await ev(() => { __DDW3.player.x = -162; }); await sleep(1500); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pal_shroomy').run());
  let hi = 0; for (let i = 0; i < 30; i++) { const s = await find('shroomy'); if (s) hi = Math.max(hi, s.by); await sleep(100); }
  check('tap Shroomy: boing! (Shroomy bounces high)', hi > .6, 'highest ' + hi.toFixed(2));
  // Sparkle on Balloon Hills: 🍓 and she is a friend
  await ev(() => __DDW3.teleport(-746)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'pet_unicornfoal'), null, 120000); await sleep(2500);
  check('Sparkle the unicorn foal is on Balloon Hills', !!(await find('unicornfoal'))); await ev(() => __DDW3.G.interact.find(i => i.disc === 'pet_unicornfoal').run()); await sleep(500);
  await page.locator('#befriend button[aria-label=treat]').tap(); await sleep(1800);
  const fr = await ev(() => ({ pal: __DDW3.G.expansion.isPal('unicornfoal'), follows: __DDW3.G.expansion._followers().includes('unicornfoal') }));
  const near = () => ev(() => { const P = __DDW3.player; let m = null; (() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; return s; })().traverse(o => { if (o.userData && o.userData.kind === 'unicornfoal' && o.parent && o.parent.type === 'Scene') m = o; }); return m ? +Math.abs(m.position.x - P.x).toFixed(1) : null; });
  await ev(() => __DDW3.teleport(-230)); await sleep(6000); const inWoods = await near(); await ev(() => __DDW3.teleport(190)); await sleep(4000); const park = await near();
  check('Sparkle is befriended with 🍓, follows her through the woods and to the park', fr.pal && fr.follows && inWoods != null && inWoods < 8 && park != null && park < 8, JSON.stringify({ ...fr, inWoods, park }));
  // far away (the woods are freed) and back (built again: Sparkle is not there twice, the others are)
  await ev(() => __DDW3.teleport(600)); await sleep(6000); await ev(() => __DDW3.teleport(-200)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'pet_hedgehog'), null, 120000); await sleep(2000);
  const again = await ev(() => { const n = {}; (() => { let s = __DDW3.G.me().root; while (s.parent) s = s.parent; return s; })().traverse(o => { if (o.userData && o.userData.kind && o.userData.body) n[o.userData.kind] = (n[o.userData.kind] || 0) + 1; }); return n; });
  check('after walking far away and back the woods are built again (Sparkle only once: she is with her)', again.hedgehog === 1 && again.shroomy === 1 && again.unicornfoal === 1, JSON.stringify(again));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
