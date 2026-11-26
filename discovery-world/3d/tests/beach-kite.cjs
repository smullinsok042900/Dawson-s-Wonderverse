// (build 153) THE SUNNY BEACH KITE, hands-on: tap it and she takes the string; running along the beach lifts the kite higher and
// higher past the three stars (low, middle, high); standing still it drifts down gently; tap it again and it goes back on its pole.
// usage: NODE_PATH=$(npm root -g) node tests/beach-kite.cjs [index.html]   (desktop, software rendering; DDW_FLAGS=\&norender for speed)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(-131)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'kite' && i.action === 'Fly the kite!'), null, 120000); await sleep(1500);
  const kiteY = () => ev(() => { let y = null; __DDW3.scene.traverse(o => { if (o.userData && o.userData.toySymbol === '🪁' && o.position.x < -50 && o.position.x > -180 && (y == null || o.position.y > y)) y = o.position.y; }); return y; });
  await ev(() => { const P = __DDW3.player; P.x = -132; P.vx = 0; __DDW3.G.interact.find(i => i.disc === 'kite' && i.action === 'Fly the kite!').run(); });
  check('tap the kite: she takes the string (the spool is in her hand)', await until(() => !!__DDW3.G.holding, null, 10000));
  await page.keyboard.down('ArrowRight'); const got = await until(() => __DDW3.world.disc.has('kitestars') || __DDW3.player.x > -70, null, 120000); const top = await kiteY(); const px = await ev(() => __DDW3.player.x); await page.keyboard.up('ArrowRight');
  check('running along the beach lifts the kite high, past all three stars ("Your kite touched all three stars!")', got && await ev(() => __DDW3.world.disc.has('kitestars')) && top > 8, `kite at ${top && top.toFixed(1)} m, she ran to ${px.toFixed(0)}`);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'beach-kite.jpg'), type: 'jpeg', quality: 85 });
  await sleep(4000); const lower = await kiteY();
  check('standing still, it drifts down gently (it stays up in the air)', lower < top && lower > 2, `${top.toFixed(1)} -> ${lower.toFixed(1)}`);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'kite' && i.action === 'Fly the kite!').run());
  check('tap it again: the kite goes back on its pole', await until(() => !__DDW3.G.holding, null, 10000) && Math.abs(await kiteY() - 1.2) < .05);
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
