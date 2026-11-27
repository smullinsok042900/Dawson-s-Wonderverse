// (build 161) THE BALL CANNON in Toy Town, hands-on: by the cannon, ▲ ▼ tilt the barrel and a dotted line shows where the ball
// will fly; 🐾 (or a tap) fires. Like a child: fire, listen ("Too short! Aim higher" / "Too far! Aim lower"), adjust, fire again,
// until three swishes. A miss bounces off the board or the ground.
// usage: NODE_PATH=$(npm root -g) node tests/toytown-cannon.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(614.5)); await until(() => !!__DDW3.G.interact.find(i => i.action === 'Fire!'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = 614.5; P.vx = 0; });
  const dots = () => ev(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === .07) n++; }); return n; });
  check('by the cannon a dotted line shows where the ball will fly', await dots() >= 8, String(await dots()));
  const barrel = () => ev(() => { let r = null; __DDW3.scene.traverse(o => { if (o.isGroup && o.children.length === 1 && o.children[0].geometry && o.children[0].geometry.type === 'CylinderGeometry' && o.children[0].geometry.parameters.height === 1.6 && Math.abs(o.parent.position.x - 616) < .01) r = o.rotation.z; }); return r; });
  const r0 = await barrel(); await page.keyboard.down('ArrowUp'); await sleep(1200); await page.keyboard.up('ArrowUp'); const r1 = await barrel();
  check('▲ tilts the barrel up', r1 > r0 + .05, `${r0 && r0.toFixed(2)} -> ${r1 && r1.toFixed(2)}`);
  let swish = 0, shots = 0, hints = new Set();
  for (; shots < 30 && swish < 3; shots++) {
    await ev(() => { document.getElementById('toast').textContent = ''; __DDW3.G.interact.find(i => i.action === 'Fire!').run(); });
    await until(() => /Swish|SWISH|higher|lower/.test(document.getElementById('toast').textContent), null, 15000);
    const msg = await ev(() => document.getElementById('toast').textContent);
    if (/Swish|SWISH/.test(msg)) { swish++; continue; } hints.add(/higher/.test(msg) ? 'higher' : 'lower');
    const key = /higher/.test(msg) ? 'ArrowUp' : 'ArrowDown'; await page.keyboard.down(key); await sleep(200); await page.keyboard.up(key);
  }
  check('aiming with ▲ ▼ and firing, she gets three swishes ("You are a super shooter!")', swish >= 3 && await ev(() => __DDW3.world.disc.has('cannon3')), `${swish} swishes in ${shots} shots; hints heard: ${[...hints].join(', ')}`);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'toytown-cannon.jpg'), type: 'jpeg', quality: 85 });
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
