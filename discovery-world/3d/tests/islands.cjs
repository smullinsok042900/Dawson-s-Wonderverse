// (build 156, the family's request: "create more islands") THREE MORE ISLANDS of the open ocean: Volcano Island, Turtle Beach and
// Treasure Cove. She sails to one with the 🗺️ map and lands (⚓); on each she plays its hands-on things:
//   🌋 the hot spring, the lookout's telescope (the volcano puffs rainbow smoke), the rock slide, the geyser that shoots her up
//   🐢 the three turtle nests (babies hatch and waddle to the sea), the big sea turtle ride, the sandcastle tower by tower
//   💎 the treasure map, and digging at the three red crosses (three taps each; the third is the big treasure)
// usage: NODE_PATH=$(npm root -g) node tests/islands.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const has = d => ev(d => __DDW3.world.disc.has(d), d);
  const run = (a, n = 1) => ev(([a, n]) => { const it = __DDW3.G.interact.find(i => i.layer === 'space' && i.action === a); if (!it) return false; for (let k = 0; k < n; k++) it.run(); return true; }, [a, n]);
  const runAll = (a, n = 1) => ev(([a, n]) => { const its = __DDW3.G.interact.filter(i => i.layer === 'space' && i.action === a); for (const it of its) for (let k = 0; k < n; k++) it.run(); return its.length; }, [a, n]);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  // sail there: the beach boat, the 🗺️ map to Turtle Beach, ⚓
  await ev(() => __DDW3.teleport(-114)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'ocean'), null, 120000); await sleep(1000);
  await ev(() => { __DDW3.player.x = -114.5; __DDW3.G.interact.find(i => i.disc === 'ocean').run(); }); await until(() => __DDW3.player.layer === 'ocean' && __DDW3.G.ocean.active(), null, 120000);
  const tiles = await ev(() => { document.getElementById('oceanMap')?.dispatchEvent(new Event('pointerdown')); return document.querySelectorAll('.oceanTile').length; });
  check('the 🗺️ sea map has the new islands (five places to sail: home and four islands)', tiles >= 5, String(tiles));
  await ev(() => __DDW3.G.ocean.sailTo('turtle')); check('the map sails her to Turtle Beach', await until(() => __DDW3.G.ocean.state() && __DDW3.G.ocean.state().near === 'turtle', null, 300000));
  await ev(() => __DDW3.G.ocean.land()); check('⚓ lands her on Turtle Beach', await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'turtle', null, 120000));
  await sleep(2000); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'turtle-beach.jpg'), type: 'jpeg', quality: 85 });
  let X = await ev(() => __DDW3.G.spaceBounds[0] - 1); const go = x => ev(x => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = 0; P.vx = 0; P.grounded = true; }, x);
  check('🐢 three turtle nests: babies hatch and waddle to the sea', await runAll('Turtle nest') === 3 && await until(() => __DDW3.world.disc.has('turtlehatch'), null, 15000));
  await go(X + 112); await until(() => !!__DDW3.G.interact.find(i => i.action === 'Ride the turtle!'), null, 60000); await go(X + 120); await run('Ride the turtle!');
  check('🐢 she rides the big sea turtle along the shore, past the starfish stars', await until(() => __DDW3.world.disc.has('turtleride'), null, 90000) && await has('starfish0'));
  await go(X + 225); await until(() => !!__DDW3.G.interact.find(i => i.action === 'Build the sandcastle'), null, 60000); await run('Build the sandcastle', 6);
  check('🏰 she builds the sandcastle, tower by tower, a flag on top', await has('sandcastle'));
  // Volcano Island and Treasure Cove: the same way in (the places engine), and their things to do
  for (const id of ['volcano', 'cove']) { await ev(id => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(q => q[0] === id)), id); await until(id => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === id && !__DDW3.player.ride, id, 240000); await sleep(1500);
    X = await ev(() => __DDW3.G.spaceBounds[0] - 1); await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', id + '-island.jpg'), type: 'jpeg', quality: 85 });
    if (id === 'volcano') {
      await go(X + 32); check('♨️ the warm hot spring (she walks into it)', await until(() => __DDW3.world.disc.has('hotspring'), null, 15000));
      await go(X + 135); await until(() => !!__DDW3.G.interact.find(i => i.action === 'Look at the volcano'), null, 60000); await run('Look at the volcano'); check('🔭 the telescope: the volcano puffs rainbow smoke', await has('volcanolook'));
      await ev(X => { const P = __DDW3.player; P.x = X + 140.5; P.y = 7; P.vx = 0; P.grounded = true; }, X); await run('Rock slide!'); check('🛝 the rock slide brings her down from the lookout', await until(() => __DDW3.world.disc.has('rockslide'), null, 30000));
      await go(X + 245); await until(() => !!__DDW3.G.interact.find(i => i.action === 'Geyser!'), null, 60000); await go(X + 248); await run('Geyser!');
      let top = 0; for (let n = 0; n < 40; n++) { top = Math.max(top, await ev(() => __DDW3.player.y)); await sleep(100); } check('💦 the geyser shoots her up high (to its star)', top > 8, 'top ' + top.toFixed(1));
    } else {
      await go(X + 30); await run('Treasure map'); check('🗺️ the treasure map (three red crosses)', await has('treasuremap'));
      await go(X + 130); await until(() => __DDW3.G.interact.filter(i => i.action === 'Dig here!').length === 3, null, 60000); const n = await runAll('Dig here!', 3);
      check('⛏️ she digs at the three red crosses (three times each): treasure chests, then the BIG treasure', n === 3 && await has('covetreasure'));
    } }
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
