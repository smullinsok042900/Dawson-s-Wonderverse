// (build 70) The Jupiter Sky Playground, end to end in a real browser (desktop, software rendering; not an iPhone result).
// Usage: NODE_PATH=$(npm root -g) node tests/jupiter-world.cjs [index.html]
const { chromium } = require('playwright'); const path = require('node:path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  await page.locator('#playBtn').click(); await sleep(2500);
  let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'jupiter')));
  await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 });
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  const put = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = y; P.vx = P.vy = 0; P.z = 0; P.grounded = true; }, [x, y]);
  const has = d => ev(d => __DDW3.world.disc.has(d), d);
  const run = d => ev(d => { const it = __DDW3.G.interact.find(i => i.disc === d); if (!it) return false; it.run(); return true; }, d);
  // walk in so both areas get built
  await put(X + 100); await sleep(2500); await put(X + 190); await page.waitForFunction(() => __DDW3.G.interact.some(i => i.disc === 'jupiterbigslidego'), null, { timeout: 60000 }).catch(() => {});
  check('both playground areas are built', await ev(() => ['jupitertower', 'jupitercandy', 'jupiterbigslidego', 'jupiterwind'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
  // 1. THE BIG WALK: from the stairs, hold → : up the rainbow stairs, over the rope bridge, the launch pad onto the high
  //    island, off its edge into the Candy Tower slide, then on along the musical floor, the colour game and into the ball pit
  await put(X + 113); await sleep(1500);
  const under = await ev(X => new Promise(res => { const D = __DDW3, P = D.player, t0 = performance.now(); let maxY = 0; D.keys.right = true; const f = () => { maxY = Math.max(maxY, P.y); if (P.x > X + 140 || performance.now() - t0 > 60000) { D.keys.right = false; return res({ maxY, x: P.x - X }); } requestAnimationFrame(f); }; f(); }), X);
  check('walking along the ground still takes you to the old playground (under the bridge)', under.maxY < 1 && under.x > 140, JSON.stringify(under));
  await put(X + 113); await sleep(1000); await run('jupitertower');
  await page.waitForFunction(() => !__DDW3.player.ride && __DDW3.player.y > 6, null, { timeout: 30000 }).catch(() => {});
  const walk = await ev(X => new Promise(res => { const D = __DDW3, P = D.player, t0 = performance.now(); let maxY = 0, top = 0, islands = 0, slid = false, deck = false; D.keys.right = true;
    const f = () => { maxY = Math.max(maxY, P.y); if (P.y > 6.4 && P.x > X + 123 && P.x < X + 126.5) deck = true; if (P.grounded && Math.abs(P.y - 12) < .2 && P.x > X + 154) islands = 1; if (P.ride && P.ride.type === 'slide') slid = true;
      if (P.x > X + 200 || performance.now() - t0 > 240000) { D.keys.right = false; return res({ maxY, deck, islands, slid, x: P.x, y: P.y }); } requestAnimationFrame(f); }; f(); }), X);
  check('walk up the rainbow stairs to the Sunrise Tower deck (6.6 m)', walk.deck, JSON.stringify(walk));
  check('over the rope bridge, the launch pad throws you onto the high cloud island (12 m)', walk.islands === 1 && await has('jupiterbridge') && await has('jupiterlaunch'));
  check('walk off the high island into the Candy Tower spiral slide, down to the clouds', walk.slid && await has('jupiterspiral'));
  check('the musical floor plays as you walk over it', await has('jupitermusic'));
  check('walk on into the ball pit', await has('jupiterballpit'), `ended at +${(walk.x - X).toFixed(1)} y ${walk.y.toFixed(2)}`);
  // 2. the cloud elevator carries you from the ground up to the high island
  await put(X + 153.3, .5); const el = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0; const f = () => { maxY = Math.max(maxY, P.y); if (maxY > 11.5 || performance.now() - t0 > 40000) return res({ maxY, x: P.x }); requestAnimationFrame(f); }; f(); }));
  check('the cloud elevator carries you up to the high island', el.maxY > 11.5, JSON.stringify(el));
  // 3. bubbles: start the machine, then pop one
  await put(X + 158, 12); await sleep(800); await run('jupiterbubblemachine'); await ev(() => { const m = __DDW3.G.taps.find(t => t.renderOrder === 3 && t.isMesh && t.material && t.material.transparent && t.scale.x < 1); });
  await sleep(2500);
  const popped = await ev(() => { let n = 0; __DDW3.G.taps.forEach(t => { if (t.isMesh && t.renderOrder === 3 && t.visible && t.userData.tap && t.scale.x < .7 && t.material && t.material.transparent) { t.userData.tap(); n++; } }); return n; });
  check('the bubble machine blows bubbles you can pop', popped > 0 && await has('jupiterbubbles'), `popped ${popped}`);
  // 4. the secret cloud hides a treasure chest
  await put(X + 163, 12); await sleep(500); await run('jupitersecretcloud'); check('tap the sparkly cloud: a secret treasure chest', await has('jupitersecret'));
  // 5. the colour game: one tap starts it, then the right colour wins
  await put(X + 195.5); await sleep(1000);
  const cg = await ev(X => { const btns = __DDW3.G.taps.filter(t => t.isGroup && Math.abs(t.position.z + 2.4) < .01 && t.position.x >= X + 193.4 && t.position.x <= X + 198.1); const tap = g => { let m = null; g.traverse(o => { if (!m && o.userData.tap) m = o; }); m && m.userData.tap(); };
    if (btns.length !== 4) return { n: btns.length }; tap(btns[0]); for (const g of btns) tap(g); return { n: btns.length, ok: __DDW3.world.disc.has('jupitercolours') }; }, X);
  check('the colour game: tap the button that matches the balloon', cg.ok, JSON.stringify(cg));
  // 6. bounce targets: land on the highest pad and ring its ring
  await put(X + 217.6, 1); const bt = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0; const f = () => { maxY = Math.max(maxY, P.y); if (__DDW3.world.disc.has('jupitertargets') || performance.now() - t0 > 20000) return res({ maxY, ok: __DDW3.world.disc.has('jupitertargets') }); requestAnimationFrame(f); }; P.grounded = false; P.vy = -1; f(); }));
  check('bounce pads throw you up to ring the rings', bt.ok && bt.maxY > 3, JSON.stringify(bt));
  // 7. the Floaty Bubble: almost no gravity inside, you jump high and catch the stars
  await put(X + 252); await sleep(1500);
  const fl = await ev(X => new Promise(res => { const D = __DDW3, P = D.player, g = D.G.spaceG; P.vy = 8; P.grounded = false; const t0 = performance.now(); let maxY = 0; const f = () => { maxY = Math.max(maxY, P.y); if (performance.now() - t0 > 2500 && P.grounded || performance.now() - t0 > 20000) return res({ g, maxY }); requestAnimationFrame(f); }; f(); }), X);
  const stars = await ev(X => new Promise(async res => { const D = __DDW3, P = D.player; for (let i = 0; i < 8; i++) { const x = X + 251 + i * 2.2, y = 2.5 + (i * 3.7) % 5.5; P.x = x; P.y = y - .6; P.vy = 0; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); } res(D.world.disc.has('jupiterstars')); }), X);
  await put(X + 240); await sleep(800); const gOut = await ev(() => __DDW3.G.spaceG);
  check('the Floaty Bubble switches Jupiter\'s strong gravity way down inside, and back outside', fl.g < .5 && fl.maxY > 3 && gOut > 2, JSON.stringify({ ...fl, gOut }));
  check('catch all the floating stars in the Floaty Bubble', stars);
  // 8. the wind fan blows you up to the Sky Lookout (18 m)
  await put(X + 280); await sleep(1500); await run('jupiterwind');
  const wd = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false; const f = () => { if (P.ride) seen = true; if ((seen && !P.ride) || performance.now() - t0 > 60000) return res({ seen, y: P.y, x: P.x }); requestAnimationFrame(f); }; f(); }));
  check('the wind fan blows you up to the Sky Lookout', wd.seen && Math.abs(wd.y - 18) < .3, JSON.stringify(wd));
  // 9. the telescope shows the Great Red Spot
  await run('jupitertelescope'); await sleep(600); const cam = await ev(() => !!__DDW3.G.camOverride); check('the lookout telescope shows the Great Red Spot', cam && await has('jupiterredspot'));
  await page.waitForFunction(() => !__DDW3.G.camOverride, null, { timeout: 30000 }).catch(() => {});
  // 10. the GREAT RED SPOT SLIDE: from the lookout through all the hoops back to the ball pit
  await put(X + 277, 18); await sleep(800); await run('jupiterbigslidego');
  const big = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false, minY = 99, maxStep = 0, lx = P.x, ly = P.y; const f = () => { if (P.ride && P.ride.type === 'slide') { seen = true; maxStep = Math.max(maxStep, Math.hypot(P.x - lx, P.y - ly)); } lx = P.x; ly = P.y;
    if ((seen && !P.ride) || performance.now() - t0 > 180000) return res({ seen, x: P.x, y: P.y, hoops: __DDW3.G.jupiterHoops, maxStep, s: (performance.now() - t0) / 1000 }); requestAnimationFrame(f); }; f(); }));
  check('the Great Red Spot Slide goes from the lookout through all 7 hoops back down into the ball pit', big.seen && big.hoops === 7 && big.x > X + 198 && big.x < X + 212 && big.y < 1, JSON.stringify({ ...big, x: big.x - X }));
  // 11. the TWISTER TUBE: back up with the wind, then walk off the right end of the lookout
  await put(X + 290, 18); await sleep(800);
  const tw = await ev(X => new Promise(res => { const D = __DDW3, P = D.player, t0 = performance.now(); let seen = false; D.keys.right = true; const f = () => { if (P.ride && P.ride.type === 'slide') { seen = true; D.keys.right = false; } if ((seen && !P.ride) || performance.now() - t0 > 90000) { D.keys.right = false; return res({ seen, x: P.x - X, y: P.y }); } requestAnimationFrame(f); }; f(); }), X);
  check('walk off the lookout\'s right end into the Twister Tube, down to the clouds', tw.seen && tw.y < 1 && tw.x > 299 && await has('jupitertwister'), JSON.stringify(tw));
  // 12. travel balloons
  await put(X + 109); await sleep(1500); await run('jupiterballoon1');
  const tb = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false, maxY = 0; const f = () => { if (P.ride) seen = true; maxY = Math.max(maxY, P.y); if ((seen && !P.ride) || performance.now() - t0 > 60000) return res({ seen, x: P.x, maxY }); requestAnimationFrame(f); }; f(); }));
  check('a travel balloon floats you across the playground', tb.seen && tb.x - X > 246 && tb.maxY > 10, JSON.stringify({ ...tb, x: tb.x - X }));
  // 13. the old playground still works (swing)
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
