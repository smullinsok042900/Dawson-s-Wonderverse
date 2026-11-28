// (build 172) CLIMB THE HEXAGON STORM on Saturn: tap it and she hops onto the bottom step; the steps turn and carry her;
// ◀ ▶ walk round a step, JUMP hops up, ▼ hops down; a star on each of the five steps; the top: "You climbed the six-sided storm!".
// usage: NODE_PATH=$(npm root -g) node tests/saturn-hexclimb.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'saturn'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 60); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'saturnhex'), null, 60000); await sleep(1000);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'saturnhex').run());
  check('a tap: she hops onto the bottom step of the storm', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'hexclimb' && __DDW3.player.y > .3, null, 10000));
  const p0 = await ev(() => ({ x: __DDW3.player.x, z: __DDW3.player.z })); await sleep(3000); const p1 = await ev(() => ({ x: __DDW3.player.x, z: __DDW3.player.z }));
  check('the step turns and carries her round', Math.hypot(p1.x - p0.x, p1.z - p0.z) > .05, JSON.stringify([p0, p1]));
  // walk round each step to its star (◀ ▶), then JUMP up to the next
  const SA = [.6, 2.6, 4.4, 1.5, 3.6]; let ys = [];
  for (let k = 0; k < 5; k++) {
    for (let n = 0; n < 400; n++) { const s = await ev(() => { const r = __DDW3.player.ride; return r ? { ra: r.ra, got: r.got, k: r.k } : null; }); if (!s || s.got[k]) break;
      let d = ((SA[k] - s.ra) % 6.283 + 6.283) % 6.283; const key = d < Math.PI ? 'ArrowLeft' : 'ArrowRight'; await page.keyboard.down(key); await sleep(150); await page.keyboard.up(key); await sleep(60); }
    ys.push(await ev(() => __DDW3.player.y)); await page.keyboard.press(' '); await sleep(900);
  }
  check('◀ ▶ walk her round each step to its star; JUMP hops her up step by step', ys.every((y, i) => i === 0 || y > ys[i - 1]) && await ev(() => __DDW3.world.disc.has('saturnhexstars')), JSON.stringify(ys.map(y => y.toFixed(2))));
  check('the top: she stands on the dark eye of the storm', await until(() => __DDW3.player.ride && __DDW3.player.ride.top && __DDW3.world.disc.has('saturnhextop'), null, 10000));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'saturn-hexclimb.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.down('ArrowDown'); await sleep(400); await page.keyboard.up('ArrowDown'); check('▼ hops back down a step', await until(() => __DDW3.player.ride && !__DDW3.player.ride.top && __DDW3.player.ride.k === 4, null, 10000));
  await sleep(800); await page.keyboard.press(' '); await sleep(900); await page.keyboard.press(' ');
  check('JUMP from the top hops her back onto the path', await until(() => !__DDW3.player.ride && __DDW3.player.z === 0 && __DDW3.player.y < .3, null, 10000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
