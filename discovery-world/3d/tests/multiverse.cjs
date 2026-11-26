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
    await p.goto(`file://${file}?test${process.env.DDW_FLAGS || ''}`, { timeout: 300000 }); await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await p.locator('#playBtn').tap(); await sleep(1500);
    // the rocket menu keeps its pictures (the dimensions are reached through wormholes)
    await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; __DDW3.G.openRocket(); }); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    check('the rocket menu still has its 12 pictures (no dimension in it)', await p.locator('#rocketPanel .rkT').count() === 12);
    await p.locator('#rocketPanel .rkT[data-id=deep]').tap();
    check('in open space', await until(() => __DDW3.G.deep.active(), null, 120000));
    await sleep(800); await p.locator('#deepMap').tap(); await sleep(600);
    check('the 🗺️ map has a 🌀 wormhole picture', await p.locator('#deepMapPanel .deepTile[data-id="wh:upside"]').count() === 1);
    await p.evaluate(() => { const m = document.getElementById('deepMapPanel'); if (m) m.style.display = 'none'; });
    { const y0 = await p.evaluate(() => __DDW3.G.deep.state().y); const btn = p.locator('#deepRise'); const box = await btn.boundingBox();
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await sleep(3000); await p.mouse.up(); const y1 = await p.evaluate(() => __DDW3.G.deep.state().y);
      check('in open space, holding ⏫ flies the rocket UP (to reach the wormholes without the map)', y1 > y0 + 10, JSON.stringify({ y0, y1 })); }
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
    await p.evaluate(X => { const P = __DDW3.player; __DDW3.G.gravSign = -1; P.x = X + 110 + 52 - 9; P.y = 10.5; P.vy = 0; P.grounded = true; P.facing = 1; }, X);
    await p.keyboard.down('ArrowRight'); const inC = await until(() => __DDW3.player.grounded && Math.abs(__DDW3.player.y - 10.48) < .03 && __DDW3.player.z < -3.5, null, 20000); await p.keyboard.up('ArrowRight');
    check('walking along the sky land into the upside-down castle, she steps inside it', inC, JSON.stringify(await p.evaluate(() => ({ y: __DDW3.player.y, z: __DDW3.player.z }))));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'upside-castle-inside.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 110 + 52 + 3; P.y = 7.4; P.vy = 2; P.grounded = false; }, X);
    check('inside, she hops up onto the shelf (the upper floor) where the treasure star is', await until(() => __DDW3.player.grounded && Math.abs(__DDW3.player.y - 8.1) < .05, null, 15000));
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
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 90; P.y = 0; localStorage.removeItem('ddw3-brickhouse'); }, TX);
    await p.evaluate(() => __DDW3.G.brickHouse.open()); await sleep(800);
    const cell = (r, c) => p.locator(`#brickPanel .brickCell[data-r="${r}"][data-c="${c}"]`), toolB = t => p.locator(`#brickPanel .brickTool[data-tool="${t}"]`);
    await toolB('1').tap(); for (let r = 0; r < 4; r++) for (const c of [0, 1, 2, 3, 6, 7, 8, 9, 10, 11]) await cell(r, c).tap();
    await toolB('7').tap(); await cell(2, 1).tap(); await cell(2, 9).tap();
    await toolB('3').tap(); for (const c of [4, 5]) for (const r of [2, 3]) await cell(r, c).tap();
    await toolB('8').tap(); await cell(0, 4).tap();
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'brick-builder.jpg'), type: 'jpeg', quality: 85 });
    await toolB('done').tap(); await sleep(800);
    const hb = await p.evaluate(() => ({ built: __DDW3.G.brickHouse.built(), door: __DDW3.G.brickHouse.grid().slice(0, 12).indexOf(8), saved: !!localStorage.getItem('ddw3-brickhouse') }));
    check('she builds her own brick house on the building screen (bricks, windows, her door), and it stands in the world', hb.built >= 40 && hb.door === 4 && hb.saved, JSON.stringify(hb));
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.action === 'Go inside'); __DDW3.player.x = it.x; it.run(); }); await sleep(2500);
    const inH = await p.evaluate(X => { const C = __DDW3.camera.position, R = __DDW3.G.roomCam; return { inside: __DDW3.G.brickHouse.inside(), z: __DDW3.player.z, room: !!R, camIn: !!R && C.x > X + 91 && C.x < X + 105 && C.z < 12 && C.z > -1 }; }, TX);
    check('through her door she goes INSIDE her house: a real room (build 149: the camera steps into the room, furnished; no see-through wall)', inH.inside && inH.z < -2.5 && inH.room && inH.camIn, JSON.stringify(inH));
    await p.evaluate(() => { document.getElementById('toast').textContent = ''; __DDW3.G.interact.find(i => i.action === 'Open the toy box').run(); });
    check('inside, the toy box pops its toys out', await p.waitForFunction(() => /Toys pop/.test(document.getElementById('toast').textContent), null, { timeout: 10000 }).then(() => true, () => false));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'brick-house-inside.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.action === 'Go outside' && i.layer === 'space'); it.run(); }); await sleep(1500);
    check('and back out through the door (the room camera lets go)', await p.evaluate(() => !__DDW3.G.brickHouse.inside() && __DDW3.player.z > -1 && !__DDW3.G.roomCam));
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 21; P.y = 0; P.vx = 0; P.facing = 1; }, TX); await sleep(500);
    await p.keyboard.down('ArrowRight'); const climbed = await until(() => __DDW3.player.y > 7.1 && __DDW3.player.grounded, null, 40000); await p.keyboard.up('ArrowRight');
    check('she climbs the giant block steps to the lookout on top (by walking: each block is a step)', climbed, 'y ' + await p.evaluate(() => __DDW3.player.y.toFixed(2)));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'toy-blocks.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 45; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; P.facing = 1; }, TX);
    // (build 139, the family's report: the balls blocked her way) walking into a ball hops her up onto it; it is still solid
    await p.evaluate(X => { window.__thru = 0; window.__maxX = 0; const balls = [[50, 1.4], [56, 2], [62.5, 1.6], [69, 2.4]]; const f = () => { const P = __DDW3.player, x = P.x - X; window.__maxX = Math.max(window.__maxX, x);
      for (const [bx, r] of balls) if (Math.abs(x - bx) < r * .6 && P.y < r * 2 - .8) window.__thru++; if (performance.now() < window.__untilB) requestAnimationFrame(f); }; window.__untilB = performance.now() + 20000; f(); }, TX);
    await p.keyboard.down('ArrowRight'); await until(X => __DDW3.player.x > X + 74, TX, 20000); await p.keyboard.up('ArrowRight');
    const walk = await p.evaluate(() => ({ maxX: +window.__maxX.toFixed(1), thru: window.__thru }));
    check('walking into the giant balls never stops her: she hops up onto them (never through them) and gets past the last one', walk.maxX > 74 && walk.thru === 0, JSON.stringify(walk));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 76; P.y = 0; P.vy = 0; P.vx = 0; P.hopX = 0; P.grounded = true; P.facing = -1; window.__minX = 99; window.__thru = 0; const balls = [[50, 1.4], [56, 2], [62.5, 1.6], [69, 2.4]]; const f = () => { const x = P.x - X; window.__minX = Math.min(window.__minX, x); for (const [bx, r] of balls) if (Math.abs(x - bx) < r * .6 && P.y < r * 2 - .8) window.__thru++; if (performance.now() < window.__untilC) requestAnimationFrame(f); }; window.__untilC = performance.now() + 40000; f(); }, TX);
    await p.keyboard.down('ArrowLeft'); await until(X => __DDW3.player.x < X + 46, TX, 40000); await p.keyboard.up('ArrowLeft');
    const back = await p.evaluate(() => ({ minX: +window.__minX.toFixed(1), thru: window.__thru }));
    check('walking BACK past the balls (◀) works too', back.minX < 46 && back.thru === 0, JSON.stringify(back));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 50; P.y = 5; P.vy = 0; P.vx = 0; P.hopX = 0; P.driftT = 0; P.grounded = false; }, TX); // (no hop or drift left over from the walk above)
    check('the giant bouncy balls bounce her from ball to ball, to the last one', await until(X => __DDW3.player.x > X + 66, TX, 40000), 'x ' + await p.evaluate(X => (__DDW3.player.x - X).toFixed(1), TX));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 117; P.y = 0; P.vy = 0; P.vx = 0; }, TX); await sleep(6000);
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.icon === '🚂'); __DDW3.player.x = it.x; it.run(); });
    const x0 = await p.evaluate(() => __DDW3.player.x); await p.keyboard.down('ArrowRight'); await sleep(5000); await p.keyboard.up('ArrowRight');
    const tr = await p.evaluate(() => ({ x: __DDW3.player.x, ride: __DDW3.player.ride && __DDW3.player.ride.type }));
    check('she drives the wind-up train with the arrows (▶ goes)', tr.ride === 'toytrain' && tr.x > x0 + 5, JSON.stringify({ x0, ...tr }));
    if (tr.ride === 'toytrain') { await p.keyboard.down('ArrowRight'); const t2 = await p.evaluate(async () => { let best = 0; for (let n = 0; n < 120; n++) { await new Promise(r => setTimeout(r, 100)); let c = 0; __DDW3.scene.traverse(o => { if (o.isGroup && o.userData.dynamic && o.children.length === 1 && Math.abs(o.rotation.z) > .05 && Math.abs(o.rotation.z) < .4 && o.position.y > .3) c++; }); best = Math.max(best, c); } return best; }); await p.keyboard.up('ArrowRight');
      check('on the block bridge the engine and wagons each tilt with the track (the train follows it)', t2 >= 2, 'cars tilted at once: ' + t2); }
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
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; P.x = X + 86 + 5; P.y = 0; P.vx = 0; P.vy = 0; P.grounded = true; P.facing = 1; }, BX);
    await p.keyboard.down('ArrowRight'); const f1 = await until(() => Math.abs(__DDW3.player.y - 3.6) < .05 && __DDW3.player.grounded, null, 20000); await p.keyboard.up('ArrowRight');
    await p.keyboard.down('ArrowLeft'); const f2 = f1 && await until(() => Math.abs(__DDW3.player.y - 7.2) < .05 && __DDW3.player.grounded, null, 30000); await p.keyboard.up('ArrowLeft');
    await p.keyboard.down('ArrowRight'); const f3 = f2 && await until(() => Math.abs(__DDW3.player.y - 10.8) < .05 && __DDW3.player.grounded, null, 30000); await p.keyboard.up('ArrowRight');
    check('the big bubble house: she walks in and climbs its stairs floor by floor to the lookout at the top', f1 && f2 && f3, JSON.stringify({ f1, f2, f3 }));
    await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'bubble-house.jpg'), type: 'jpeg', quality: 85 });
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
    // ===== (build 136) THE SQUISHY JELLY WORLD: a fourth wormhole =====
    await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; __DDW3.G.openRocket(); }); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    await p.locator('#rocketPanel .rkT[data-id=deep]').tap(); await until(() => __DDW3.G.deep.active(), null, 120000);
    await p.evaluate(() => __DDW3.G.deep.flyTo('wh:jelly'));
    check('a fourth wormhole leads to the Squishy Jelly World', await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'jelly', null, 300000));
    await sleep(1500); await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'jelly-arrive.jpg'), type: 'jpeg', quality: 85 });
    const JX = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1);
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 22; P.y = 4; P.vy = 0; P.vx = 0; P.grounded = false; }, JX);
    check('a jelly hill bounces her up', await until(() => __DDW3.player.vy > 5, null, 15000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 120; P.y = 0; P.vy = 0; }, JX); await sleep(6000);
    const sag = await p.evaluate(async X => { const P = __DDW3.player; P.x = X + 110 + 18; P.y = 3; P.vy = 0; P.grounded = false; await new Promise(r => setTimeout(r, 2500)); const ys = []; for (let n = 0; n < 20; n++) { await new Promise(r => setTimeout(r, 100)); ys.push(P.y); } return { lo: Math.min(...ys), g: P.grounded }; }, JX);
    check('the wobbly bridge sags under her (and carries her: she stays on it)', sag.g && sag.lo < 1.95 && sag.lo > 1.4, JSON.stringify(sag));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 110 + 44; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; P.facing = 1; }, JX);
    await p.evaluate(() => { window.__maxY = 0; window.__slid = false; const f = () => { const P = __DDW3.player; if (P.grounded && !P.ride) window.__maxY = Math.max(window.__maxY, P.y); if (P.ride) window.__slid = true; if (performance.now() < window.__untilT) requestAnimationFrame(f); }; window.__untilT = performance.now() + 14000; f(); });
    await p.keyboard.down('ArrowRight'); await sleep(14000); await p.keyboard.up('ArrowRight');
    const tw = await p.evaluate(() => ({ maxY: window.__maxY, slid: window.__slid }));
    check('she climbs the jelly tower step by step (walking) to the top, and walking on starts the jelly slide', tw.maxY >= 4.8 && tw.slid, JSON.stringify(tw)); // (the slide only starts when she stands on the 7.2 m top step, so `slid` proves she reached it; at 1–2 test frames a second the top is crossed in one or two frames)
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.icon === '🛝' && i.y > 7); if (it) { const P = __DDW3.player; P.x = it.x; P.y = it.y; P.grounded = true; it.run(); } });
    check('the jelly slide brings her down', await until(() => !__DDW3.player.ride && __DDW3.player.y < .6, null, 30000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 230; P.y = 0; }, JX); await sleep(6000);
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 220 + 38; P.y = 4; P.vy = 0; P.grounded = false; }, JX);
    check('the biggest jelly trampoline bounces her very high', await until(() => __DDW3.player.vy > 15, null, 15000));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 220 + 60; P.y = 0; P.vy = 0; P.grounded = true; const it = __DDW3.G.interact.find(i => i.action === 'Into the jelly house!'); it.run(); }, JX); await sleep(2500);
    check('she goes into the squishy jelly house', await p.evaluate(() => __DDW3.player.z < -2.5));
    await p.evaluate(() => { const it = __DDW3.G.interact.find(i => i.action === 'Go outside' && i.icon === '🚪' && Math.abs(i.x - __DDW3.player.x) < 8); it && it.run(); }); await sleep(1500);
    check('and back out', await p.evaluate(() => __DDW3.player.z > -1));
    check('the jelly pets live here (Gummy and Wiggle)', await p.evaluate(() => ['pet_gummybear', 'pet_jellyblob'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
    await p.evaluate(() => __DDW3.G.space.goHome()); await sleep(1500);
    check('home again from the jelly', await p.evaluate(() => __DDW3.player.layer === ''));
    // ===== (build 137) THE WACKY GRAVITY WORLD: a fifth wormhole; gravity changes from zone to zone =====
    await p.evaluate(() => { const P = __DDW3.player; P.x = 120; P.y = 0; P.z = 0; __DDW3.G.openRocket(); }); await until(() => document.querySelector('#rocketPanel.show'), null, 10000);
    await p.locator('#rocketPanel .rkT[data-id=deep]').tap(); await until(() => __DDW3.G.deep.active(), null, 120000);
    await p.evaluate(() => __DDW3.G.deep.flyTo('wh:wacky'));
    check('a fifth wormhole leads to the Wacky Gravity World', await until(() => __DDW3.player.layer === 'space' && __DDW3.G.space.here() === 'wacky', null, 300000));
    await sleep(1500); await p.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'wacky-arrive.jpg'), type: 'jpeg', quality: 85 });
    const WX = await p.evaluate(() => __DDW3.G.spaceBounds[0] - 1);
    await p.evaluate(X => { const P = __DDW3.player; P.ride = null; __DDW3.G.playerHidden = false; P.x = X + 18; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; }, WX); await sleep(1500);
    const moon = await p.evaluate(async () => { const P = __DDW3.player, s = __DDW3.G.gravScale; P.vy = 9; P.grounded = false; let top = 0; for (let n = 0; n < 40; n++) { await new Promise(r => setTimeout(r, 100)); top = Math.max(top, P.y); } return { s, top }; });
    check('the moon-bounce meadow has floaty gravity: the same jump goes much higher', moon.s < .3 && moon.top > 6, JSON.stringify(moon)); // (a 9 m/s jump: 1.7 m in normal gravity, about 7.7 m here)
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 52; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; }, WX);
    check('the anti-gravity lift floats her up onto the sky platform (and she stays there)', await until(() => { const P = __DDW3.player; return P.grounded && Math.abs(P.y - 12) < .05; }, null, 30000) && (await sleep(2500), await p.evaluate(() => __DDW3.player.grounded && Math.abs(__DDW3.player.y - 12) < .05)));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 110 + 2; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; }, WX); await sleep(6000);
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 110 + 13; }, WX); await sleep(800); await p.evaluate(X => { __DDW3.player.x = X + 110 + 15.5; }, WX);
    const fl = await until(() => __DDW3.G.gravSign === -1 && __DDW3.player.grounded && Math.abs(__DDW3.player.y - 8) < .05, null, 30000);
    check('an orange stripe in the flip corridor flips gravity: she falls UP and walks on the ceiling, head down', fl && await p.evaluate(() => __DDW3.G.flipK > .9), JSON.stringify(await p.evaluate(() => ({ y: __DDW3.player.y, s: __DDW3.G.gravSign, k: __DDW3.G.flipK }))));
    await p.evaluate(X => { __DDW3.player.x = X + 110 + 23; }, WX); await sleep(800); await p.evaluate(X => { __DDW3.player.x = X + 110 + 25.5; }, WX);
    check('the next stripe flips her back down to the floor', await until(() => __DDW3.G.gravSign === 1 && __DDW3.player.grounded && __DDW3.player.y < .5 && __DDW3.G.flipK < .05, null, 30000));
    const wheel = await p.evaluate(async () => { const it = __DDW3.G.interact.find(i => i.icon === '🎡' && i.action === 'Gravity wheel!'); if (!it) return -1; const P = __DDW3.player; P.x = it.x; P.y = 0; it.run(); let k = 0, top = 0; for (let n = 0; n < 400 && P.ride; n++) { await new Promise(r => setTimeout(r, 100)); k = Math.max(k, __DDW3.G.flipK); top = Math.max(top, P.y); } return { k, top, ride: !!P.ride }; });
    check('the gravity wheel takes her all the way round, upside down at the top', wheel.k > .8 && wheel.top > 11 && !wheel.ride, JSON.stringify(wheel));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 230; P.y = 0; P.vy = 0; P.grounded = true; }, WX); await sleep(6000);
    check('the floating obstacle course has low gravity', await p.evaluate(() => __DDW3.G.gravScale < .5));
    const carry = await p.evaluate(async X => { const pl = __DDW3.G.platforms.find(q => q.layer === 'space' && Math.abs((q.a + q.b) / 2 - (X + 220 + 12)) < 3 && Math.abs(q.y - 2) < .3 && q.b - q.a === 3); if (!pl) return -1; const P = __DDW3.player; P.x = (pl.a + pl.b) / 2; P.y = pl.y; P.vy = 0; P.grounded = true; let lo = P.x, hi = P.x, on = 0; for (let n = 0; n < 60; n++) { await new Promise(r => setTimeout(r, 100)); if (P.grounded && P.x >= pl.a - .01 && P.x <= pl.b + .01) on++; lo = Math.min(lo, P.x); hi = Math.max(hi, P.x); } return { moved: hi - lo, on }; }, WX);
    check('a moving platform carries her along', carry.moved > .5 && carry.on > 55, JSON.stringify(carry));
    await p.evaluate(X => { const P = __DDW3.player; P.x = X + 220 + 84; P.y = 2; P.vy = 0; P.vx = 0; P.grounded = false; }, WX);
    const well = await p.evaluate(async () => { const P = __DDW3.player; let top = 0, v = 0; for (let n = 0; n < 80; n++) { await new Promise(r => setTimeout(r, 100)); top = Math.max(top, P.y); v = Math.max(v, P.vy); } return { top, v }; });
    check('the gravity well launches her super high (and she floats down slowly)', well.v > 12 && well.top > 12, JSON.stringify(well));
    check('the wacky pets live here (Zoom and Floaty)', await p.evaluate(() => ['pet_zoomzoom', 'pet_floatyfox'].every(d => __DDW3.G.interact.some(i => i.disc === d))));
    await p.evaluate(() => __DDW3.G.space.goHome()); await sleep(1500);
    check('home again from the wacky world, with gravity back to normal', await p.evaluate(() => __DDW3.player.layer === '' && __DDW3.G.gravSign === 1 && (__DDW3.G.gravScale || 1) === 1 && !__DDW3.G.flipK));
    check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  } catch (e) { console.log('FAIL exception: ' + e.message); fail++; }
  finally { console.log(`${ok} checks passed`); await b.close(); process.exit(fail ? 1 : 0); }
})();
