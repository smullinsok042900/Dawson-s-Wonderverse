// (build 119) TOY TOWN'S PAPER-PLANE GLIDER: she climbs the giant toy blocks (one step at a time), hops on the paper plane
// and glides back over Toy Town; ▲ flies up and slower, ▼ dives and faster; she lands softly; JUMP hops off and she floats down.
// usage: NODE_PATH=$(npm root -g) node tests/toy-glider.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(650)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'glider'), null, 120000); await sleep(1500);
  // climb: from each block, one hop left onto the next
  const hop = async (x, y, wantY) => { await ev(([x, y, w]) => { const P = __DDW3.player; P.x = x; P.y = y; P.vy = 0; P.vx = 0; P.grounded = true; window.__on = null; const f = () => { const P = __DDW3.player; if (P.grounded && P.y > w - .15 && P.y < w + .3) { __on = +P.y.toFixed(2); dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' })); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); }, [x, y, wantY]);
    await page.keyboard.down('ArrowLeft'); await sleep(120); await page.keyboard.press(' '); const ok = await until(() => window.__on != null, null, 12000); await page.keyboard.up('ArrowLeft'); return ok; };
  const steps = [await hop(669, 0, 1.2), await hop(665.4, 1.2, 2.4), await hop(662.2, 2.4, 3.6), await hop(659, 3.6, 4.8)];
  check('she can climb the giant toy blocks one hop at a time', steps.every(Boolean), JSON.stringify(steps));
  await ev(() => { const P = __DDW3.player; P.x = 656.6; P.y = 4.8; P.vx = P.vy = 0; P.grounded = true; }); await sleep(600);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'glider').run()); const rid = await ev(() => __DDW3.player.ride && __DDW3.player.ride.type);
  check('tap the paper plane: she flies', rid === 'glider', String(rid));
  const seg = async key => { if (key) await page.keyboard.down(key); const a = await ev(() => ({ x: __DDW3.player.ride.x, y: __DDW3.player.ride.y })); const t = Date.now(); await sleep(2500); const z = await ev(() => __DDW3.player.ride ? { x: __DDW3.player.ride.x, y: __DDW3.player.ride.y } : null); if (key) await page.keyboard.up(key); const s = (Date.now() - t) / 1000; return z && { vx: (a.x - z.x) / s, vy: (z.y - a.y) / s }; };
  const upS = await seg('ArrowUp'), dnS = await seg('ArrowDown');
  check('▲ flies up and slower; ▼ dives and faster', upS && dnS && upS.vy > 0 && dnS.vy < 0 && dnS.vx > upS.vx, JSON.stringify({ upS, dnS }));
  await page.keyboard.down('ArrowDown'); const landed = await until(() => !__DDW3.player.ride, null, 60000); await page.keyboard.up('ArrowDown');
  await until(() => __DDW3.player.grounded, null, 20000); const end = await ev(() => ({ x: +__DDW3.player.x.toFixed(1), y: +__DDW3.player.y.toFixed(2) }));
  check('she lands softly back in Toy Town', landed && end.y < .6 && end.x > 556 && end.x < 655, JSON.stringify(end));
  // again, and hop off with JUMP: she floats down gently
  await ev(() => { const P = __DDW3.player; P.x = 656.6; P.y = 4.8; P.vx = P.vy = 0; P.grounded = true; }); await sleep(600); await ev(() => __DDW3.G.interact.find(i => i.disc === 'glider').run());
  await page.keyboard.down('ArrowUp'); await sleep(2500); await page.keyboard.up('ArrowUp'); await page.keyboard.press(' '); const off = await until(() => !__DDW3.player.ride, null, 5000);
  let minVy = 0; for (let i = 0; i < 20; i++) { const v = await ev(() => __DDW3.player.grounded ? 0 : __DDW3.player.vy); minVy = Math.min(minVy, v); await sleep(100); }
  check('JUMP hops off, and she floats down gently', off && minVy > -3.1, 'fastest fall ' + minVy.toFixed(2));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
