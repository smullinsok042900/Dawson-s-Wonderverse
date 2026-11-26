// (build 146, rooms in build 149) GOING INSIDE (the family's request): into the lighthouse (a real room: she climbs the stairs
// to the lamp room at the top) and into the igloo (a room of ice: a fire, cocoa, a baby penguin), and the secret tunnel is a
// real tunnel she walks through (the mouth shows a picture of where it leads; no black hole).
// usage: NODE_PATH=$(npm root -g) node tests/insides.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 100 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  const run = (x, action) => ev(([x, a]) => { const it = __DDW3.G.interact.find(i => Math.abs(i.x - x) < .2 && i.action === a); if (!it) return false; it.run(); return true; }, [x, action]);
  const toast = () => ev(() => document.getElementById('toast').textContent || ''), clearToast = () => ev(() => { document.getElementById('toast').textContent = ''; });
  const roomView = () => ev(() => { const R = __DDW3.G.roomCam, C = __DDW3.camera.position; return { layer: __DDW3.player.layer, room: !!R, camIn: !!R && C.x >= R.x0 && C.x <= R.x1 && C.y >= R.y0 && C.y <= R.y1 + 1 && C.z > R.z && C.z < R.z + 14 }; });
  // ---------- THE LIGHTHOUSE (build 149: a real room inside) ----------
  await ev(() => __DDW3.teleport(-95)); await until(() => !!__DDW3.G.interact.find(i => Math.abs(i.x + 95) < .2 && i.action === 'Go inside!'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -95; P.y = 0; P.vx = 0; P.grounded = true; }); await run(-95, 'Go inside!'); await sleep(2000);
  const lv = await roomView();
  check('lighthouse: through the door she walks INTO the tower: a room of its own, the camera inside it (walls all round, no see-through)', lv.layer === 'room' && lv.room && lv.camIn, JSON.stringify(lv));
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'lighthouse-inside.jpg'), type: 'jpeg', quality: 85 });
  // climb like she would: the stairs go back and forth (right, left, right): walk that way and she steps up each stair
  let held = null; const hold = async k => { if (held === k) return; if (held) await page.keyboard.up(held); held = k; if (k) await page.keyboard.down(k); };
  for (let n = 0; n < 900; n++) { const y = await ev(() => __DDW3.player.grounded ? __DDW3.player.y : -1); if (y >= 14.3) break; if (y >= 0) await hold(y < 4.5 ? 'ArrowRight' : y < 9.3 ? 'ArrowLeft' : 'ArrowRight'); await sleep(100); }
  await hold(null); const top = await ev(() => __DDW3.player.y);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'lighthouse-top.jpg'), type: 'jpeg', quality: 85 });
  check('lighthouse: she climbs the stairs inside, back and forth, all the way up to the lamp room', top >= 14.3, 'at ' + top.toFixed(2));
  await clearToast(); await ev(() => __DDW3.G.interact.find(i => i.layer === 'room' && i.action === 'Light the lamp').run());
  check('lighthouse: at the top she lights the great lamp (its beam sweeps over the sea)', /lit the great lamp/.test(await toast()) && await ev(() => __DDW3.world.disc.has('lighthousetop')));
  await ev(() => __DDW3.G.interact.find(i => i.layer === 'room' && i.action === 'Go outside').run()); await sleep(1500);
  check('lighthouse: the door takes her back outside, right at the lighthouse', await ev(() => __DDW3.player.layer === '' && Math.abs(__DDW3.player.x + 95) < 1 && !__DDW3.G.roomCam));
  // ---------- THE IGLOO (build 149: a real room inside) ----------
  await ev(() => __DDW3.teleport(-380)); await until(() => !!__DDW3.G.interact.find(i => Math.abs(i.x + 380) < .2 && i.action === 'Go inside!'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -380; P.y = 0; P.vx = 0; P.grounded = true; }); await run(-380, 'Go inside!'); await sleep(2000);
  const iv = await roomView();
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'igloo-inside.jpg'), type: 'jpeg', quality: 85 });
  check('igloo: through the round door she walks INTO the igloo: a room of ice blocks, the camera inside it', iv.layer === 'room' && iv.room && iv.camIn, JSON.stringify(iv));
  const say = async a => { await clearToast(); await ev(a => __DDW3.G.interact.find(i => i.layer === 'room' && i.action === a).run(), a); return toast(); };
  const t1 = await say('Warm up'), t2 = await say('Drink cocoa'), t3 = await say('Baby penguin');
  check('igloo: a crackling fire to warm up by, hot cocoa, and a sleeping baby penguin (each can be tapped)', /fire/.test(t1) && /cocoa/.test(t2) && /penguin/.test(t3), [t1, t2, t3].join(' | '));
  await page.keyboard.down('ArrowLeft'); const outI = await until(() => __DDW3.player.layer === '', null, 30000); await page.keyboard.up('ArrowLeft');
  check('igloo: walking out of the door takes her back outside, at the igloo', outI && await ev(() => Math.abs(__DDW3.player.x + 380) < 1.5 && !__DDW3.G.roomCam), String(await ev(() => __DDW3.player.x)));
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
