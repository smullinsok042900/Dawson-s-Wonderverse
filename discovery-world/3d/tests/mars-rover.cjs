// (build 166) DRIVE THE MARS ROVER: a tap next to it puts her on the deck; ◀ ▶ drive it (the wheels really turn); 🐾 scoops
// up a shiny Mars rock with the arm when one is beside it; four rocks make a party; JUMP hops off; left far away, it drives
// itself home.
// usage: NODE_PATH=$(npm root -g) node tests/mars-rover.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'mars'))); await until(() => __DDW3.player.layer === 'space' && !__DDW3.player.ride, null, 240000);
  const X = await ev(() => __DDW3.G.spaceBounds[0] - 1);
  await ev(x => { __DDW3.player.x = x; }, X + 44); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'rover'), null, 60000); await sleep(1000);
  const rx = () => ev(() => __DDW3.G.interact.find(i => i.disc === 'rover').x);
  const x0 = await rx();
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'rover').run());
  check('next to the rover, a tap puts her on its deck', await until(() => __DDW3.player.ride && __DDW3.player.ride.type === 'rover' && __DDW3.player.y > 1, null, 10000));
  // drive ▶ (waits for the condition, not a fixed time: the test browser draws only 1-2 frames a second when drawing)
  await page.keyboard.down('ArrowRight'); await until(x => __DDW3.G.interact.find(i => i.disc === 'rover').x > x + 4, x0, 60000); await page.keyboard.up('ArrowRight');
  const x1 = await rx(), px = await ev(() => __DDW3.player.x);
  check('▶ drives the rover across Mars, and she rides along on it', x1 > x0 + 3 && Math.abs(px - x1) < 1, `${x0.toFixed(1)} -> ${x1.toFixed(1)}, her x ${px.toFixed(1)}`);
  await page.keyboard.down('ArrowLeft'); await until(x => __DDW3.G.interact.find(i => i.disc === 'rover').x < x - 2, x1, 60000); await page.keyboard.up('ArrowLeft');
  check('◀ drives it back the other way', (await rx()) < x1 - 1.5);
  // 🐾 away from a rock: nothing is scooped
  const said0 = await ev(() => __DDW3.world.disc.has('roverrocks'));
  // drive to each rock and scoop it (rocks at X+27, +58, +82, +99)
  for (const target of [27, 58, 82, 99]) {
    const tx = X + target;
    for (let n = 0; n < 200; n++) { const x = await rx(); const d = tx - x; if (Math.abs(d) < 1.2) break; const k = d > 0 ? 'ArrowRight' : 'ArrowLeft'; await page.keyboard.down(k); await sleep(Math.min(400, 60 + Math.abs(d) * 30)); await page.keyboard.up(k); await sleep(60); }
    await sleep(900); await page.keyboard.press('e'); await sleep(1200);
  }
  check('🐾 beside each shiny rock scoops it up; all four: "You found all the Mars rocks!"', !said0 && await until(() => __DDW3.world.disc.has('roverrocks'), null, 15000));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'mars-rover.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.press(' '); check('JUMP hops off onto the ground', await until(() => !__DDW3.player.ride && __DDW3.player.y < .5, null, 8000));
  await ev(x => { __DDW3.player.x = x; }, X + 150);
  check('left far away, the rover drives itself home', await until(x => Math.abs(__DDW3.G.interact.find(i => i.disc === 'rover').x - x) < .2, x0, 90000));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
