// (build 71) The Mercury carnival funhouse, every room, in a real browser (desktop, software rendering; not an iPhone result).
// Usage: NODE_PATH=$(npm root -g) node tests/mercury-funhouse.cjs [index.html]
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
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'mercury')));
  await page.waitForFunction(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, { timeout: 240000 });
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  const put = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = y; P.vx = P.vy = 0; P.z = 0; P.grounded = true; }, [x, y]);
  const has = d => ev(d => __DDW3.world.disc.has(d), d);
  const run = d => ev(d => { const it = __DDW3.G.interact.find(i => i.disc === d); if (!it) return false; it.run(); return true; }, d);
  const rideEnd = (ms = 60000) => ev(ms => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let seen = false, maxY = 0; const f = () => { if (P.ride) seen = true; maxY = Math.max(maxY, P.y); if ((seen && !P.ride) || performance.now() - t0 > ms) return res({ seen, x: P.x, y: P.y, maxY }); requestAnimationFrame(f); }; f(); }), ms);
  const frames = n => ev(n => new Promise(r => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); f(); }), n);
  await put(X + 160); await sleep(2000); await put(X + 228); await page.waitForFunction(() => __DDW3.G.funhouse, null, { timeout: 60000 }).catch(() => {});
  check('the funhouse is built when you walk near', await ev(() => !!__DDW3.G.funhouse && __DDW3.G.funhouse.stars.length === 6));
  // the Hall of Infinite Mirrors: your mirrored copy appears behind the glass
  await put(X + 231); await frames(4); const hall = await ev(() => __DDW3.world.disc.has('mercuryinfinite'));
  check('the Hall of Infinite Mirrors shows you in the mirror', hall);
  // moving floors carry you
  await put(X + 239.5); const x0 = await ev(() => __DDW3.player.x); await frames(25); const x1 = await ev(() => __DDW3.player.x);
  check('a moving floor carries you along', x1 - x0 > .8, `moved ${(x1 - x0).toFixed(2)} m`);
  // the spinning disc
  await put(X + 258); await sleep(500); await run('mercurydisc'); const dk = await rideEnd(); check('ride the spinning disc round and round', dk.seen && !!(await ev(() => !__DDW3.player.ride)), JSON.stringify(dk));
  // the bouncy floor (and the star above it)
  await put(X + 279.5, 1.5); await ev(() => { __DDW3.player.grounded = false; __DDW3.player.vy = -1; });
  const bo = await ev(() => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let maxY = 0; const f = () => { maxY = Math.max(maxY, P.y); if (performance.now() - t0 > 6000) return res({ maxY }); requestAnimationFrame(f); }; f(); }));
  check('the bouncy floor bounces you high', bo.maxY > 3 && await has('mercurybounce'), JSON.stringify(bo));
  // lift A up to floor 2
  await put(X + 227.5); await sleep(400); await run('mercurylift2'); const la = await rideEnd(); check('lift A takes you up to floor 2', la.seen && Math.abs(la.y - 6.5) < .3, JSON.stringify(la));
  // find the real door
  await put(X + 233, 6.5); await sleep(400);
  const dr = await ev(() => { const doors = __DDW3.G.taps.filter(t => t.isGroup && Math.abs(t.position.z + 4.55) < .05 && Math.abs(t.position.y - 6.5) < .05); const tap = g => { let m = null; g.traverse(o => { if (!m && o.userData.tap) m = o; }); m && m.userData.tap(); };
    if (doors.length !== 3) return { n: doors.length }; tap(doors[0]); for (const d of doors) tap(d); return { n: 3, ok: __DDW3.world.disc.has('mercuryrealdoor') }; });
  check('find the real door: the right picture door opens', dr.ok, JSON.stringify(dr));
  // the giant-and-tiny room
  await put(X + 260, 6.5); await frames(3); const big = await ev(() => __DDW3.player.sizeMul); await put(X + 245, 6.5); await frames(3); const small = await ev(() => __DDW3.player.sizeMul);
  await put(X + 266, 6.5); await frames(3); const after = await ev(() => __DDW3.player.sizeMul);
  check('the giant-and-tiny room: you grow at one end and shrink at the other, then back to normal', big > 1.5 && small < .7 && after === 1, JSON.stringify({ big, small, after }));
  // the upside-down room
  await put(X + 271, 6.5); await run('mercuryupsidedown'); check('tap the upside-down room and it flips', await has('mercuryupside'));
  // the light game: two rounds of copying the lights
  await put(X + 289, 6.5); await sleep(300); await run('mercurylightgame');
  for (let r = 0; r < 2; r++) { await page.waitForFunction(() => !__DDW3.G.funhouseLights.showing && __DDW3.G.funhouseLights.seq.length, null, { timeout: 30000 }).catch(() => {});
    await ev(() => { const L = __DDW3.G.funhouseLights, s = [...L.seq]; for (const i of s) L.press(i); }); await sleep(1800); }
  check('the light game: copy the lights the lamps show', await has('mercurylights'));
  // the shape game
  await put(X + 307, 6.5); await sleep(300); await run('mercuryshapegame'); await ev(() => __DDW3.G.funhouseShapes.tap(__DDW3.G.funhouseShapes.want)); check('the shape game: tap the hole with the same shape', await has('mercuryshapes'));
  // the stairs up to floor 3
  await put(X + 242, 6.5); await sleep(300); await run('mercurystairsup'); const st = await rideEnd(); check('one tap: up the rainbow stairs to floor 3', st.seen && Math.abs(st.y - 13) < .3, JSON.stringify(st));
  // the hidden mirror door
  await put(X + 288, 13); await sleep(300); await run('mercurysecretdoor'); check('the sparkly mirror is a secret door to a hidden room', await has('mercurysecret'));
  // the Big Top Slide all the way down
  await put(X + 310, 13); await sleep(300); await run('mercurybigtopgo'); const sl = await rideEnd(90000); check('the Big Top Slide spirals from floor 3 down to the ground', sl.seen && sl.y < 1 && sl.maxY > 12, JSON.stringify({ ...sl, x: sl.x - X }));
  // lift B to floor 3
  await put(X + 315); await sleep(300); await run('mercurylift3'); const lb = await rideEnd(); check('lift B takes you from the ground up to floor 3', lb.seen && Math.abs(lb.y - 13) < .3, JSON.stringify(lb));
  await put(X + 299); await sleep(400); await ev(() => { __DDW3.keys.right = true; });
  const cr = await ev(X => new Promise(res => { const P = __DDW3.player, t0 = performance.now(); let crawled = false; const f = () => { if (P.crawl) crawled = true; if (P.x > X + 307 || performance.now() - t0 > 30000) { __DDW3.keys.right = false; return res({ crawled, x: P.x - X }); } requestAnimationFrame(f); }; f(); }), X);
  check('the crawl tunnel: she crawls through it to the surprise at the end', cr.crawled && cr.x > 307 && await has('mercurycrawl'), JSON.stringify(cr));
  // collect all six funhouse stars → the trophy
  const sts = await ev(() => __DDW3.G.funhouse.stars.map(s => ({ x: s.x, y: s.y, hidden: s.hidden, got: s.got })));
  for (const s of sts) if (!s.got) { await ev(s => { const P = __DDW3.player; P.ride = null; P.x = s.x; P.y = s.y - .6; P.vy = 0; }, s); await frames(2); }
  check('find all six funhouse stars: the trophy appears', await has('mercurychampion') && await ev(() => __DDW3.G.funhouse.trophy.visible), JSON.stringify(sts.map(s => s.hidden)));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
