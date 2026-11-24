// (build 126) THE SUN: the rocket flies there; golden platforms over the glowing surface; every attraction works:
// sunspot trampolines, the secret bounce cloud, the twisty slide, the Solar Flare Coaster, the Launch Tower (gentle and
// BLAST), Solar Wind Surfing (switching streams, collecting stars) and the Solar Light Lab. Desktop, software rendering.
// usage: NODE_PATH=$(npm root -g) node tests/sun.cjs [index.html]
const { chromium } = require('playwright'); const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HTML = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html')), SHOTS = path.join(__dirname, '..', 'screenshots');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })).newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  let ok = 0; const check = (name, cond, detail = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  — ' + detail : '')); if (cond) ok++; else process.exitCode = 1; };
  const ev = (f, a) => page.evaluate(f, a), until = (f, a, ms = 60000) => page.waitForFunction(f, a, { timeout: ms, polling: 200 });
  const P = () => ev(() => { const P = __DDW3.player; return { x: P.x, y: P.y, vy: P.vy, ride: P.ride && P.ride.type, layer: P.layer, g: P.grounded }; });
  const put = (x, y = 0) => ev(([x, y]) => { const P = __DDW3.player; P.ride = null; P.x = x; P.y = y; P.z = 0; P.vx = P.vy = 0; P.grounded = y === 0; }, [x, y]);
  const run = id => ev(id => { const it = __DDW3.G.interact.find(i => i.disc === id); if (!it) return false; it.run(); return true; }, id);
  try {
    await page.goto('file://' + HTML + '?test', { timeout: 600000 }); await until(() => document.getElementById('loading').classList.contains('done'), null, 600000);
    await page.locator('#playBtn').tap(); await sleep(1500);
    await ev(() => __DDW3.G.space.goTo(__DDW3.G.space.places.findIndex(p => p[0] === 'sun'))); await until(() => __DDW3.player.layer === 'space' && __DDW3.G.spaceHere() === 'sun', null, 240000);
    const X = await ev(() => __DDW3.G.spaceBounds[0] - 1); check('the rocket flies to the Sun', true, 'X ' + X);
    await sleep(1500); await page.screenshot({ path: path.join(SHOTS, 'sun-arrive.jpg'), type: 'jpeg', quality: 85 });
    check('the Sun has its Sunnies and its facts', await ev(() => !!__DDW3.G.interact.find(i => i.disc === 'alien_sun') && !!__DDW3.G.interact.find(i => i.disc === 'sunfacts')));
    // area 2
    await put(X + 112); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'suncoaster'), null, 120000); await sleep(800);
    await page.screenshot({ path: path.join(SHOTS, 'sun-bouncepark.jpg'), type: 'jpeg', quality: 85 });
    await put(X + 118, 3); await until(() => __DDW3.player.vy > 5, null, 20000); let p = await P(); check('a sunspot trampoline bounces her up', p.vy > 5, `vy ${p.vy.toFixed(1)}`);
    let top = 0; for (let i = 0; i < 40; i++) { p = await P(); top = Math.max(top, p.y); await sleep(100); } check('the bounce goes high (low, floaty pull)', top > 4, `top ${top.toFixed(1)}`);
    await put(X + 150, 17); await until(() => __DDW3.player.vy > 8, null, 20000); check('the secret bounce cloud high up gives a super bounce', (await P()).vy > 8);
    await put(X + 139, 8.3); await sleep(500); await run('sunslide'); await until(() => __DDW3.player.ride === null && __DDW3.player.y < 1, null, 60000);
    check('the twisty slide takes her back down', (await P()).y < 1);
    await put(X + 166); await sleep(300); await run('suncoaster'); p = await P(); check('the Solar Flare Coaster starts', p.ride === 'slide');
    let hi = 0; await until(() => { const P = __DDW3.player; window.__hi = Math.max(window.__hi || 0, P.y); return !P.ride; }, null, 180000);
    hi = await ev(() => window.__hi); check('the coaster climbs the lift hill and comes home', hi > 14, `highest ${hi.toFixed(1)} m`);
    await page.screenshot({ path: path.join(SHOTS, 'sun-coaster.jpg'), type: 'jpeg', quality: 85 });
    // area 3
    await put(X + 225); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'suntower'), null, 120000); await sleep(500);
    await put(X + 228); await run('suntower'); await until(() => __DDW3.player.y > 20, null, 90000); check('the Launch Tower carries her way up', (await P()).y > 20);
    await page.screenshot({ path: path.join(SHOTS, 'sun-tower.jpg'), type: 'jpeg', quality: 85 });
    await until(() => !__DDW3.player.ride, null, 120000); check('and brings her gently back down', (await P()).y < 1);
    await put(X + 228); await run('suntowerblast'); await until(() => __DDW3.player.y > 20, null, 60000); check('BLAST mode shoots up fast', true); await until(() => !__DDW3.player.ride, null, 120000);
    await put(X + 240); await sleep(300); await run('sunsurf'); p = await P(); check('Solar Wind Surfing starts on the hoverboard', p.ride === 'sunsurf');
    await page.keyboard.down('ArrowUp'); await sleep(2500); p = await P(); check('▲ switches to the higher (pink) wind stream', p.y > 5, `y ${p.y.toFixed(1)}`);
    await page.screenshot({ path: path.join(SHOTS, 'sun-surf.jpg'), type: 'jpeg', quality: 85 });
    await page.keyboard.up('ArrowUp'); await page.keyboard.down('ArrowDown'); await sleep(2500); await page.keyboard.up('ArrowDown'); p = await P(); check('▼ switches back down', p.y < 4.5, `y ${p.y.toFixed(1)}`);
    await until(() => !__DDW3.player.ride, null, 120000); check('the surf ride ends safely on the other side', (await P()).x > X + 310);
    const toast0 = await ev(() => document.getElementById('toast').textContent);
    for (const id of ['sunprism', 'sunshadow', 'sunpanel', 'sunice']) { await put(X + 320); await run(id); await sleep(400); }
    check('the Solar Light Lab: prism, shadow, solar panel and ice all answer', await ev(() => ['sunprism', 'sunshadow', 'sunpanel', 'sunice'].every(d => __DDW3.world.disc.has(d))));
    await page.screenshot({ path: path.join(SHOTS, 'sun-lab.jpg'), type: 'jpeg', quality: 85 });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.log('FAIL exception: ' + e.message); process.exitCode = 1; }
  finally { console.log(`${ok} checks passed`); await b.close(); }
})();
