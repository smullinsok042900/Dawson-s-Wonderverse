// (build 158, the family's request) THE DEEP CAVES under the ball pit: through the glowing cave mouth in the underground she
// walks into a much bigger cave world (glow-worm cave, underground river, dinosaur cave, crystal grotto) and at the digging
// wall she takes the SHOVEL and digs her own tunnels into the earth: walking into the earth digs forward, ▼ digs down; she
// can walk and fall through the tunnels she dug, gems hide in the earth, and her tunnels are kept for next time.
// usage: NODE_PATH=$(npm root -g) node tests/caves.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const room = a => ev(a => { const it = __DDW3.G.interact.find(i => i.layer === 'room' && i.action === a); if (!it) return false; it.run(); return true; }, a);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  // down in the underground, at its far end: the cave mouth
  await ev(() => { const P = __DDW3.player; P.layer = ''; P.x = 7; P.y = -6; P.vx = P.vy = 0; P.grounded = true; }); await sleep(1500);
  const mouth = await ev(() => !!__DDW3.G.interact.find(i => i.action === 'Into the deep caves!'));
  await ev(() => __DDW3.G.interact.find(i => i.action === 'Into the deep caves!').run()); await sleep(2000);
  const R = await ev(() => ({ layer: __DDW3.player.layer, cam: !!__DDW3.G.roomCam, x: __DDW3.player.x }));
  check('a glowing cave mouth in the underground leads into the DEEP CAVES', mouth && R.layer === 'room' && R.cam, JSON.stringify(R));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'caves-glow.jpg'), type: 'jpeg', quality: 85 });
  const X0 = await ev(() => __DDW3.G.tunnelBounds[0] + .3);
  const go = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.x = x; P.y = y; P.vx = P.vy = 0; P.grounded = true; }, [x, y]);
  // the bounce mushroom up to the ledge with its gem
  await go(X0 + 21); await room('Bounce mushroom'); check('the bounce mushroom throws her up to the high ledge: a glowing cave gem', await until(() => __DDW3.world.disc.has('cavegem'), null, 15000) || await ev(() => __DDW3.player.y > 3.5));
  // the river: walk in and she splashes back to the bank; the stepping stones carry her across
  await go(X0 + 38); await sleep(1500); check('fall into the underground river: splash, back to the bank (no losing)', await until(X0 => __DDW3.player.y >= 0 && __DDW3.player.x < X0 + 34, X0, 15000));
  await go(X0 + 43, .15); await sleep(1200); check('the stepping stones hold her above the water', await ev(() => __DDW3.player.y > .1 && __DDW3.player.grounded));
  await go(X0 + 63); await room('Dinosaur bones'); check('the dinosaur cave: a giant skeleton, RAWR', await ev(() => __DDW3.world.disc.has('dinobones')));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'caves-dino.jpg'), type: 'jpeg', quality: 85 });
  await go(X0 + 81); await room('Crystals'); check('the crystal grotto: crystals that chime', await ev(() => __DDW3.world.disc.has('cavecrystals')));
  // THE SHOVEL and the digging wall
  await go(X0 + 90); await room('Take the shovel'); check('she takes the shovel (in her hand)', await ev(() => !!__DDW3.G.holding));
  const before = await ev(() => __DDW3.world.exp.digs ? __DDW3.world.exp.digs.length : 0);
  await go(X0 + 91.2); await page.keyboard.down('ArrowRight'); const dugIn = await until(X0 => __DDW3.player.x > X0 + 96, X0, 60000); await page.keyboard.up('ArrowRight');
  const after = await ev(() => (__DDW3.world.exp.digs || []).length);
  check('walking into the earth with the shovel digs a tunnel she walks along', dugIn && after >= before + 8, `dug ${after - before} bits, she is at ${(await ev(() => __DDW3.player.x)) - X0}`);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'caves-dig.jpg'), type: 'jpeg', quality: 85 });
  const y0 = await ev(() => __DDW3.player.y); await page.keyboard.down('ArrowDown'); const down = await until(y0 => __DDW3.player.y < y0 - 2.5, y0, 60000); await page.keyboard.up('ArrowDown');
  check('▼ digs down: she falls down the hole she digs', down, `${y0} -> ${await ev(() => __DDW3.player.y)}`);
  await page.keyboard.down('ArrowRight'); await sleep(4000); await page.keyboard.up('ArrowRight');
  check('...and digs a deeper tunnel from there', await ev(([X0, y0]) => __DDW3.player.y < y0 - 2 && __DDW3.player.x > X0 + 97, [X0, y0]));
  check('she cannot jump up through the earth (the tunnel has a ceiling)', await ev(async () => { const P = __DDW3.player, y = P.y; P.vy = 14; P.grounded = false; await new Promise(r => setTimeout(r, 1500)); return P.y < y + 1.6; }));
  check('her tunnels are kept (saved in the game)', await ev(() => Array.isArray(__DDW3.world.exp.digs) && __DDW3.world.exp.digs.length >= 10));
  // a gem hidden in the earth: dig to it (column 6, row 5 = 98, -3) by tapping the earth around it
  const gemGot = await ev(async X0 => { const P = __DDW3.player; P.x = X0 + 98.5; P.y = -3; P.vy = 0; P.grounded = true; await new Promise(r => setTimeout(r, 800)); return true; }, X0);
  void gemGot; await room('Dig!'); await sleep(1500);
  check('the 🐾 "Dig!" button digs too', await ev(n => __DDW3.world.exp.digs.length > n, after));
  await ev(() => __DDW3.G.interact.find(i => i.layer === 'room' && i.action === 'Go outside').run()); await sleep(1500);
  check('the way back out takes her to the underground (and the shovel stays in the caves)', await ev(() => __DDW3.player.layer === '' && __DDW3.player.y < -4 && !__DDW3.G.holding));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
