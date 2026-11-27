// (build 159) THE FIREFLY JAR in the Whispering Woods, hands-on: tap the jar and six fireflies fly out along the path; she catches
// them by walking and jumping into them (or tapping them); each zips back into the jar, which glows brighter; all six: a lantern.
// usage: NODE_PATH=$(npm root -g) node tests/woods-fireflies.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(-240)); await until(() => !!__DDW3.G.interact.find(i => i.action === 'Let the fireflies out!'), null, 120000); await sleep(1500);
  const lit = () => ev(() => { let n = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === .11 && Math.abs(o.position.x + 240) > 1.2) n++; }); return n; });
  await ev(() => __DDW3.G.interact.find(i => i.action === 'Let the fireflies out!').run()); await sleep(2500);
  check('tap the jar: six fireflies fly out along the woods path', await lit() === 6, String(await lit()));
  const caughtN = () => ev(() => { const m = (document.getElementById('toast').textContent || '').match(/(one|two|three|four|five)!|all six/); return m ? m[0] : ''; });
  // walk along the path both ways, jumping now and then, like she would
  for (const [key, to] of [['ArrowLeft', -255], ['ArrowRight', -224], ['ArrowLeft', -240]]) { await page.keyboard.down(key); for (let n = 0; n < 60; n++) { const x = await ev(() => __DDW3.player.x); if (key === 'ArrowLeft' ? x <= to : x >= to) break; if (n % 4 === 0) await page.keyboard.press(' '); await sleep(150); } await page.keyboard.up(key); }
  const left = await lit(); check('walking and jumping into the fireflies catches them (they zip back into the jar)', left <= 3, `${6 - left} caught by walking and jumping`);
  await ev(() => { __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === .11 && Math.abs(o.position.x + 240) > 1.2 && o.userData.tap) o.userData.tap(); }); });
  check('the rest are caught by tapping them: all six, "the jar glows like a lantern!"', await until(() => __DDW3.world.disc.has('fireflyjar'), null, 10000), await caughtN());
  check('the jar glows', await until(() => { let g = 0; __DDW3.scene.traverse(o => { if (o.isMesh && o.material && o.material.emissiveIntensity > .8 && o.geometry.type === 'CylinderGeometry' && Math.abs(o.position.x + 240) < .05) g = 1; }); return g; }, null, 10000));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'woods-fireflies.jpg'), type: 'jpeg', quality: 85 });
  await ev(() => __DDW3.G.interact.find(i => i.action === 'Let the fireflies out!').run()); await sleep(2500);
  check('tap the jar again: out they fly for another go', await lit() === 6);
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
