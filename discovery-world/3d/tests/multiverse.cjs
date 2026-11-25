// (build 131) THE MULTIVERSE: fly into the wormhole in open space, arrive in the Upside-Down World, fall UP onto the sky
// land and walk on it upside down, hop down the hanging castle, ride the gravity slide and the flip coaster, and fly home
// with everything back to normal. Desktop, software rendering.
// usage: NODE_PATH=$(npm root -g) node tests/multiverse.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fail = 0, ok = 0; const check = (name, good, info = '') => { console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (good) ok++; else fail++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const until = (fn, arg, ms = 60000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  try {
    await p.goto(`file://${file}?test`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500);
    // the rocket menu keeps its pictures (the dimensions are reached through wormholes)
    await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; __DDW3.G.openRocket(); }); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    check('the rocket menu still has its 12 pictures (no dimension in it)', await p.locator('#rocketPanel .rkT').count() === 12);
    await p.locator('#rocketPanel .rkT[data-id=deep]').tap();
    check('in open space', await until(() => __DDW3.G.deep.active(), null, 120000));
    await sleep(800); await p.locator('#deepMap').tap(); await sleep(600);
    check('the 🗺️ map has a 🌀 wormhole picture', await p.locator('#deepMapPanel .deepTile[data-id="wh:upside"]').count() === 1);
    await p.evaluate(() => { const m = document.getElementById('deepMapPanel'); if (m) m.style.display = 'none'; });
    await p.evaluate(() => __DDW3.G.deep.flyTo('wh:upside'));
    const arrived = await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'upside', null, 300000);
    check('the autopilot flies into the wormhole and she arrives in the Upside-Down World', arrived);
    await sleep(1500); await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'upside-arrive.jpg'), type: 'jpeg', quality: 85 });
    const X = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1);
    // fall UP: step on the first arrow
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; P.x = X + 19; P.y = 0; P.vx = 2; __DDW3.G.playerHidden = false; }, X);
    const up = await until(() => __DDW3.G.gravSign === -1 && __DDW3.player.grounded && Math.abs(__DDW3.player.y - 10.5) < .05, null, 30000);
    const flipped = await p.evaluate(() => ({ y: __DDW3.player.y, k: __DDW3.G.flipK }));
    check('a ⬆️ arrow flips gravity: she falls UP and stands on the sky land, head down', up && flipped.k > .9, JSON.stringify(flipped));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'upside-ceiling.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(() => { window.__minY = 99; const f = () => { const P = __DDW3.player; window.__minY = Math.min(window.__minY, P.y); if (performance.now() < window.__until) requestAnimationFrame(f); }; window.__until = performance.now() + 4000; f(); });
    await p.locator('#jumpBtn').tap(); await sleep(4200); const jump = await p.evaluate(() => window.__minY);
    check('jumping on the sky land goes DOWN (away from it), then she falls back up', jump < 9.5, 'lowest y ' + jump);
    await until(() => __DDW3.player.grounded && Math.abs(__DDW3.player.y - 10.5) < .05, null, 20000);
    // walk to the ⬇️ arrow: she floats gently back down
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 45; P.vx = 2; }, X);
    const down = await until(() => __DDW3.G.gravSign === 1 && __DDW3.player.grounded && __DDW3.player.y < .05 && __DDW3.G.flipK < .05, null, 30000);
    check('a ⬇️ arrow flips her back: she floats down to the meadow, the right way up', down);
    // area 2: the hanging castle's ledges and the gravity slide
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 150; P.y = 0; }, X); await sleep(6000);
    const ledges = await p.evaluate(() => __DDW3.G.platforms.filter(z => z.layer === 'space' && z.ceil && z.y < 14.9).length);
    check('Upside-Down Town and the hanging castle are built: ledges to stand on underneath', ledges >= 9, ledges + ' ledges');
    await p.evaluate(X => { const P = __DDW3.player; __DDW3.G.gravSign = -1; P.x = X + 110 + 52 - 7 + 1.5; P.y = 8.5; P.vy = 2; P.grounded = false; }, X);
    check('she lands on the underside of a castle ledge (1.5 m below the sky land)', await until(() => __DDW3.player.grounded && Math.abs(__DDW3.player.y - 9) < .05, null, 15000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 110 + 92; P.y = 10.5; P.grounded = true; P.vy = 0; const it = __DDW3.G.interact.find(i => i.icon === '🛝'); it && it.run(); }, X);
    const slid = await until(() => !__DDW3.player.ride && __DDW3.G.gravSign === 1 && __DDW3.player.y < 1 && __DDW3.G.flipK < .05, null, 30000);
    check('the gravity slide takes her from the sky land down to the meadow, the right way up', slid);
    // area 3: the flip coaster goes upside down along the sky land and comes home
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 226; P.y = 0; }, X); await sleep(6000);
    const top = await p.evaluate(async () => { const it = __DDW3.G.interact.find(i => i.icon === '🎢'); if (!it) return -1; __DDW3.player.x = it.x; it.run(); let best = 0, k = 0; for (let n = 0; n < 200 && __DDW3.player.ride; n++) { await new Promise(r => setTimeout(r, 100)); if (__DDW3.player.y > best) { best = __DDW3.player.y; k = __DDW3.G.flipK; } } return { best, k, ride: !!__DDW3.player.ride }; });
    check('the flip coaster climbs onto the sky land, upside down, and comes back', top.best > 9.3 && top.k > .8 && !top.ride, JSON.stringify(top));
    // the pets of this world
    check('the Upside-Down pets live here (Topsy and Dropsy)', await p.evaluate(() => ['pet_flipbun', 'pet_dropsy'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
    // fly home: everything back to normal
    await p.evaluate(() => { __DDW3.G.gravSign = -1; __DDW3.G.space.goHome(); });
    await sleep(1500);
    const home = await p.evaluate(() => ({ g: __DDW3.G.gravSign, k: __DDW3.G.flipK, layer: __DDW3.player.layer }));
    check('home again: gravity is normal and she is the right way up', home.g === 1 && !home.k && home.layer === '', JSON.stringify(home));
    // ===== (build 132) THE GIANT TOY UNIVERSE: a second wormhole =====
    await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; __DDW3.G.openRocket(); }); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    await p.locator('#rocketPanel .rkT[data-id=deep]').tap(); await until(() => __DDW3.G.deep.active(), null, 120000);
    await p.evaluate(() => __DDW3.G.deep.flyTo('wh:toy'));
    check('a second wormhole leads to the Giant Toy Universe', await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'toy', null, 300000));
    await sleep(1500); await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'toy-arrive.jpg'), type: 'jpeg', quality: 85 });
    const TX = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1);
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 21; P.y = 0; P.vx = 0; P.facing = 1; }, TX); await sleep(500);
    await p.keyboard.down('ArrowRight'); const climbed = await until(() => __DDW3.player.y > 7.1 && __DDW3.player.grounded, null, 40000); await p.keyboard.up('ArrowRight');
    check('she climbs the giant block steps to the lookout on top (by walking: each block is a step)', climbed, 'y ' + await p.evaluate(() => __DDW3.player.y.toFixed(2)));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'toy-blocks.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 50; P.y = 5; P.vy = 0; P.vx = 0; P.grounded = false; }, TX);
    check('the giant bouncy balls bounce her from ball to ball, to the last one', await until(X => __DDW3.player.x > X + 66, TX, 40000), 'x ' + await p.evaluate(X => (__DDW3.player.x - X).toFixed(1), TX));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 117; P.y = 0; P.vy = 0; P.vx = 0; }, TX); await sleep(6000);
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.icon === '🚂'); __DDW3.player.x = it.x; it.run(); });
    const x0 = await p.evaluate(() => __DDW3.player.x); await p.keyboard.down('ArrowRight'); await sleep(5000); await p.keyboard.up('ArrowRight');
    const tr = await p.evaluate(() => ({ x: __DDW3.player.x, ride: __DDW3.player.ride && __DDW3.player.ride.type }));
    check('she drives the wind-up train with the arrows (▶ goes)', tr.ride === 'toytrain' && tr.x > x0 + 5, JSON.stringify({ x0, ...tr }));
    await p.evaluate(() => { __DDW3.player.ride = null; });
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.icon === '🛝' && i.y > 7); const P = __DDW3.player; P.x = it.x; P.y = it.y; P.grounded = true; it.run(); });
    check('the giant toy slide takes her from the block mountain summit to the ground', await until(() => !__DDW3.player.ride && __DDW3.player.y < .5, null, 30000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 228; P.y = 0; }, TX); await sleep(6000);
    const tc = await p.evaluate(async () => { const it = __DDW3.G.interact.find(i => i.icon === '🎢'); if (!it) return -1; __DDW3.player.x = it.x; it.run(); let best = 0; for (let n = 0; n < 200 && __DDW3.player.ride; n++) { await new Promise(r => setTimeout(r, 100)); best = Math.max(best, __DDW3.player.y); } return { best, ride: !!__DDW3.player.ride }; });
    check('the wooden toy coaster goes up its big hill and back', tc.best > 8 && !tc.ride, JSON.stringify(tc));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 220 + 92; P.y = 3; P.vy = 0; P.vx = 0; P.grounded = false; }, TX);
    check('the jack-in-the-box bounces her up onto the shelf of giant toys', await until(() => __DDW3.player.grounded && Math.abs(__DDW3.player.y - 6.85) < .05, null, 20000));
    check('the toy pets live here (Clicky and Blocky)', await p.evaluate(() => ['pet_windmouse', 'pet_blockpup'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
    await p.evaluate(() => __DDW3.G.space.goHome()); await sleep(1500);
    check('home again from the toys', await p.evaluate(() => __DDW3.player.layer === '' && __DDW3.G.gravSign !== -1));
    // ===== (build 133) THE BUBBLE UNIVERSE: a third wormhole =====
    await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; __DDW3.G.openRocket(); }); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    await p.locator('#rocketPanel .rkT[data-id=deep]').tap(); await until(() => __DDW3.G.deep.active(), null, 120000);
    await p.evaluate(() => __DDW3.G.deep.flyTo('wh:bubble'));
    check('a third wormhole leads to the Bubble Universe', await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'bubble', null, 300000));
    await sleep(1500);
    const BX = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1);
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 20; P.y = 0; const it = __DDW3.G.interact.find(i => i.disc === 'bubbleride'); it.run(); }, BX);
    const inB = await p.evaluate(() => __DDW3.player.ride && __DDW3.player.ride.type); const y0 = await p.evaluate(() => __DDW3.player.y);
    await p.keyboard.down('ArrowUp'); await sleep(4000); await p.keyboard.up('ArrowUp'); const y1 = await p.evaluate(() => __DDW3.player.y);
    check('the bubble blower puts her inside a giant bubble, and ▲ floats it up', inB === 'bubble' && y1 > y0 + 2, JSON.stringify({ inB, y0, y1 }));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'bubble-ride.jpg'), type: 'jpeg', quality: 85 });
    await p.locator('#jumpBtn').tap();
    check('JUMP pops the bubble and she drifts gently down to the foam', await until(() => !__DDW3.player.ride && __DDW3.player.grounded && __DDW3.player.y < .3, null, 30000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 48; P.y = 3; P.vy = 0; P.grounded = false; }, BX);
    check('a bubble trampoline bounces her up', await until(() => __DDW3.player.vy > 5, null, 15000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 140; P.y = 0; P.vy = 0; P.vx = 0; }, BX); await sleep(6000);
    const ride = await p.evaluate(async X => { const P = __DDW3.player; const pl = __DDW3.G.platforms.find(z => z.layer === 'space' && Math.abs(z.a - (X + 110 + 17 - 1.4)) < .01); if (!pl) return { none: true }; P.x = X + 127; P.y = pl.y + .5; P.vy = 0; P.grounded = false;
      await new Promise(r => setTimeout(r, 1500)); let lo = 99, hi = -99, ok = true; for (let n = 0; n < 40; n++) { await new Promise(r => setTimeout(r, 100)); lo = Math.min(lo, P.y); hi = Math.max(hi, P.y); if (!P.grounded || Math.abs(P.y - pl.y) > .05) ok = false; } return { lo, hi, ok }; }, BX);
    check('a bubble house floor bobs up and down and carries her with it', ride.ok && ride.hi - ride.lo > .3, JSON.stringify(ride));
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.icon === '🛝' && i.y > 9); const P = __DDW3.player; P.x = it.x; P.y = it.y; P.grounded = true; it.run(); });
    check('the bubble slide brings her down from the cloud', await until(() => !__DDW3.player.ride && __DDW3.player.y < .6, null, 30000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 226; P.y = 0; }, BX); await sleep(6000);
    const bus = await p.evaluate(async () => { const it = __DDW3.G.interact.find(i => i.icon === '🚌'); if (!it) return -1; __DDW3.player.x = it.x; it.run(); let best = 0; for (let n = 0; n < 300 && __DDW3.player.ride; n++) { await new Promise(r => setTimeout(r, 100)); best = Math.max(best, __DDW3.player.y); } return { best, ride: !!__DDW3.player.ride, x: __DDW3.player.x - it.x }; });
    check('the bubble bus floats her over the islands to the far stop', bus.best > 8 && !bus.ride && bus.x > 55, JSON.stringify(bus));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 220 + 79; P.y = 0; P.vx = 0; }, BX); await p.keyboard.down('ArrowRight'); await sleep(5000); await p.keyboard.up('ArrowRight');
    check('walking through the bubble pop garden pops the bubbles', await p.evaluate(() => __DDW3.world.disc.has('bubblepop')));
    check('the bubble pets live here (Glub and Foamy)', await p.evaluate(() => ['pet_bubblefish', 'pet_foamy'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
    await p.evaluate(() => __DDW3.G.space.goHome()); await sleep(1500);
    check('home again from the bubbles', await p.evaluate(() => __DDW3.player.layer === '' && !__DDW3.player.ride));
    check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  } catch (e) { console.log('FAIL exception: ' + e.message); fail++; }
  finally { console.log(`${ok} checks passed`); await b.close(); process.exit(fail ? 1 : 0); }
})();
