// (build 142) LAB GARDENS' ROCKET RIDE: tap the rocket and she climbs on; JUMP pumps it (more pumps = higher); ▲ launches;
// up past three stars; the parachute opens and ◀ ▶ steer it to two side stars; a soft landing; the rocket glides back onto
// its pad; JUMP on the parachute hops off and she floats down gently.
// usage: NODE_PATH=$(npm root -g) node tests/lab-rocket.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  await ev(() => __DDW3.teleport(731)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'rocketride'), null, 120000); await sleep(1500);
  const board = async () => { await ev(() => { const P = __DDW3.player; P.x = 731; P.y = 0; P.vx = P.vy = 0; P.grounded = true; P.ride = null; }); await sleep(600); await ev(() => __DDW3.G.interact.find(i => i.disc === 'rocketride').run()); };
  await board(); check('tap the rocket: she climbs on', await ev(() => __DDW3.player.ride && __DDW3.player.ride.type === 'rocketride'));
  for (let i = 0; i < 3; i++) { await page.keyboard.press(' '); await sleep(250); }
  check('JUMP pumps it (three pumps)', await ev(() => __DDW3.player.ride && __DDW3.player.ride.pumps === 3));
  await page.keyboard.down('ArrowUp'); await sleep(400); await page.keyboard.up('ArrowUp');
  let top = 0; for (let n = 0; n < 200; n++) { const r = await ev(() => { const R = __DDW3.player.ride; return R ? { y: R.y, ph: R.phase } : null; }); if (!r) break; top = Math.max(top, r.y); if (r.ph === 'chute') break; await sleep(100); }
  check('▲ launches it high (three pumps: about 18 m), past the three stars', top > 16 && await ev(() => __DDW3.player.ride && __DDW3.player.ride.n >= 3), 'top ' + top.toFixed(1));
  // the parachute: steer to the left star (726, 11), then, once it is caught, to the right one (733, 6)
  let held = null; const hold = async k => { if (held === k) return; if (held) await page.keyboard.up(held); held = k; if (k) await page.keyboard.down(k); };
  for (let n = 0; n < 600; n++) { const r = await ev(() => { const R = __DDW3.player.ride; return R ? { x: R.x, y: R.y, n: R.n } : null; }); if (!r) break; const want = r.n < 4 ? 726 : 733; await hold(r.x < want - .4 ? 'ArrowRight' : r.x > want + .4 ? 'ArrowLeft' : null); await sleep(100); }
  await hold(null);
  const end = await ev(() => ({ ride: !!__DDW3.player.ride, y: +__DDW3.player.y.toFixed(2), stars: __DDW3.world.disc.has('rocketstars') }));
  check('the parachute brings her down softly, steering ◀ ▶ to the side stars (all five stars)', !end.ride && end.y < .6 && end.stars, JSON.stringify(end));
  check('the rocket glides back onto its pad', await until(() => { let ok = false; __DDW3.scene.traverse(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.height === 2.6 && Math.abs(o.parent.position.x - 730) < .05 && o.parent.position.y === 0) ok = true; }); return ok; }, null, 20000));
  // again: one pump, and hop off from the parachute with JUMP
  await board(); await page.keyboard.press(' '); await sleep(300); const launched = await until(() => __DDW3.player.ride && __DDW3.player.ride.phase === 'chute', null, 30000); await sleep(1200); await page.keyboard.press(' '); const off = await until(() => !__DDW3.player.ride, null, 5000);
  let minVy = 0; for (let i = 0; i < 20; i++) { const v = await ev(() => __DDW3.player.grounded ? 0 : __DDW3.player.vy); minVy = Math.min(minVy, v); await sleep(100); }
  check('one pump and a little wait launches it too; JUMP on the parachute hops off and she floats down gently', launched && off && minVy > -3.1, 'fastest fall ' + minVy.toFixed(2));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
