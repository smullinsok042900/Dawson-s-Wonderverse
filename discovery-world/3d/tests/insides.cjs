// (build 146) GOING INSIDE (the family's request): into the lighthouse (the front turns see-through, she climbs the winding
// stairs to the lamp room at the top) and into the igloo (a fire, a rug, cocoa, a baby penguin), and the secret tunnel is a
// real tunnel she walks through (the mouth shows a picture of where it leads; no black hole).
// usage: NODE_PATH=$(npm root -g) node tests/insides.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test', { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  const run = (x, action) => ev(([x, a]) => { const it = __DDW3.G.interact.find(i => Math.abs(i.x - x) < .2 && i.action === a); if (!it) return false; it.run(); return true; }, [x, action]);
  // ---------- THE LIGHTHOUSE ----------
  await ev(() => __DDW3.teleport(-95)); await until(() => !!__DDW3.G.interact.find(i => Math.abs(i.x + 95) < .2 && i.action === 'Go inside!'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -95; P.y = 0; P.vx = 0; P.grounded = true; }); await run(-95, 'Go inside!'); await sleep(2000);
  check('lighthouse: she goes in through the door (inside the tower; its front turns see-through)', await until(() => __DDW3.player.z < -4.5, null, 15000) && await ev(() => { let ok = false; __DDW3.scene.traverse(o => { if (o.isMesh && o.material && o.material.transparent && o.material.opacity < .5 && Math.abs(o.position.x + 95) < .05 && Math.abs(o.position.z + 5.2) < .05) ok = true; }); return ok; }));
  await ev(() => { window.__top = 0; const f = () => { const P = __DDW3.player; if (P.grounded) window.__top = Math.max(window.__top, P.y); if (performance.now() < window.__tE) requestAnimationFrame(f); }; window.__tE = performance.now() + 60000; f(); });
  // climb: walk back and forth across the stairs (they zig-zag), jumping up each one
  for (let n = 0; n < 60 && await ev(() => window.__top) < 6.9; n++) { const right = n % 2 === 0; await page.keyboard.down(right ? 'ArrowRight' : 'ArrowLeft'); await page.keyboard.press(' '); await sleep(700); await page.keyboard.up(right ? 'ArrowRight' : 'ArrowLeft'); await sleep(200); }
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'lighthouse-inside.jpg'), type: 'jpeg', quality: 85 });
  check('lighthouse: she climbs the winding stairs inside, all the way up to the lamp room', await ev(() => window.__top > 6.9), 'highest ' + (await ev(() => window.__top)).toFixed(2));
  await ev(() => { const P = __DDW3.player; P.y = 0; P.grounded = true; }); await sleep(500); await run(-95, 'Go outside'); await sleep(1500);
  check('lighthouse: and back outside', await ev(() => __DDW3.player.z > -1));
  // ---------- THE IGLOO ----------
  await ev(() => __DDW3.teleport(-380)); await until(() => !!__DDW3.G.interact.find(i => Math.abs(i.x + 380) < .2 && i.action === 'Go inside!'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -380; P.y = 0; P.vx = 0; P.grounded = true; }); await run(-380, 'Go inside!'); await sleep(2000);
  const ig = await ev(() => { let fire = false, chick = false; __DDW3.scene.traverse(o => { if (o.visible && o.userData.toySymbol === '🐧' && Math.abs(o.position.x + 379.2) < .1) chick = true; if (o.isMesh && o.visible && o.material && o.material.emissive && Math.abs(o.position.x + 381.4) < .05 && Math.abs(o.position.z + 5.2) < .05) fire = true; }); return { z: __DDW3.player.z, fire, chick }; });
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'igloo-inside.jpg'), type: 'jpeg', quality: 85 });
  check('igloo: she goes inside: a crackling fire and a sleeping baby penguin', ig.z < -3.5 && ig.fire && ig.chick, JSON.stringify(ig));
  await run(-380, 'Go outside'); await sleep(1000);
  // ---------- THE SECRET TUNNEL ----------
  await ev(() => __DDW3.teleport(-230)); await until(() => !!__DDW3.G.interact.find(i => Math.abs(i.x + 232) < .2 && i.action === 'Into the tunnel!'), null, 120000); await sleep(1500);
  const mouth = await ev(() => { let pic = false, hole = false; __DDW3.scene.traverse(o => { if (o.isMesh && Math.abs(o.position.x + 232) < .05 && o.position.z > -3.5 && o.position.z < -2.8) { if (o.geometry.type === 'CircleGeometry' && o.material.map) pic = true; if (o.material && o.material.color && o.material.color.getHexString() === '1c1520') hole = true; } }); return { pic, hole }; });
  check('tunnel: the mouth shows a picture of where it leads (no black hole)', mouth.pic && !mouth.hole, JSON.stringify(mouth));
  await ev(() => { __DDW3.player.x = -232; }); await run(-232, 'Into the tunnel!'); await sleep(1500);
  check('tunnel: she goes into the tunnel (a passage she walks through)', await ev(() => __DDW3.player.layer === 'tunnel'));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'tunnel-inside.jpg'), type: 'jpeg', quality: 85 });
  await page.keyboard.down('ArrowRight'); const out = await until(() => __DDW3.player.layer === '' && __DDW3.player.x > 600, null, 60000); await page.keyboard.up('ArrowRight');
  check('tunnel: she walks all the way through and comes out at the far end (Toy Town)', out, String(await ev(() => __DDW3.player.x)));
  await sleep(1500); await ev(() => { __DDW3.player.x = 612.4; }); await run(612.4, 'Into the tunnel!'); await sleep(1500);
  await page.keyboard.down('ArrowLeft'); const back = await until(() => __DDW3.player.layer === '' && Math.abs(__DDW3.player.x - 614.8) < 3, null, 30000); await page.keyboard.up('ArrowLeft');
  check('tunnel: walking back out the way she came takes her back out', back, String(await ev(() => __DDW3.player.x)));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
