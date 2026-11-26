// (build 144) HANDS-ON ACTIVITIES (the family's request): she really fishes (takes the rod, casts where she taps, waits for
// a bite, reels in), really throws snowballs (makes one, taps the target where to throw), the barn animals walk out on the
// ground (no hovering), the hollow-log critters stand on the ground, and the owl-path pictures are big and light up.
// usage: NODE_PATH=$(npm root -g) node tests/hands-on.cjs [index.html]   (desktop, software rendering)
const { chromium } = require('playwright'); const path = require('node:path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); if (!ok) fails++; };
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), until = (fn, a, ms = 30000) => page.waitForFunction(fn, a, { timeout: ms, polling: 50 }).then(() => true, () => false);
  await page.goto('file://' + file + '?test' + (process.env.DDW_FLAGS || ''), { timeout: 600000 }); await page.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 }); await page.locator('#playBtn').click(); await sleep(2500);
  // a tap on a tap-target found by a test, at a world point (like a finger on that spot)
  await ev(() => { window.__tapAt = (pred, p) => { let o = null; for (const t of __DDW3.G.taps) t.traverse(m => { if (!o && m.isMesh && pred(m)) o = m; }); if (!o) return false; o.userData.tap({ point: new __DDW3.THREE.Vector3(...p), object: o }); return true; }; });
  // ---------- FISHING ----------
  await ev(() => __DDW3.teleport(-551)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'fishing'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -551; P.y = 0; P.vx = 0; __DDW3.G.interact.find(i => i.disc === 'fishing').run(); });
  check('fishing: she takes the rod (it is in her hand)', await ev(() => !!__DDW3.G.holding));
  const water = m => m.geometry.type === 'PlaneGeometry' && m.geometry.parameters.width === 60;
  check('fishing: tap the water to cast: the bobber flies out to that spot', await ev(w => __tapAt(eval(w), [-548, .08, -12]), water.toString()) && await until(() => { let ok = false; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && Math.abs(o.position.z + 12) < .3 && Math.abs(o.position.x + 548) < .3 && o.position.y < .3) ok = true; }); return ok; }, null, 10000));
  const toastHas = s => until(s => (document.getElementById('toast').textContent || '').includes(s), s, 15000);
  check('fishing: wait... the bobber dips: "A bite!"', await toastHas('A bite'));
  await ev(w => __tapAt(eval(w), [-548, .08, -12]), water.toString());
  check('fishing: tap quickly and she reels it in: a catch flies out ("You caught...")', await toastHas('You caught'));
  // a slow one swims away
  await ev(w => __tapAt(eval(w), [-555, .08, -10]), water.toString()); await toastHas('A bite');
  check('fishing: too slow, and the fish swims away (cast again)', await toastHas('swam away'));
  await ev(() => { __DDW3.player.x = -540; }); await sleep(1500);
  check('fishing: walking away puts the rod back on its stand', await ev(() => !__DDW3.G.holding));
  // (build 148, the family's report: "it doesn't let you cast, it just puts the rod back") like a finger: 🐾 again casts, and a
  //  real tap on the screen far out on the sea casts there (it used to walk her away, and the rod went back on its stand)
  const bobOut = () => until(() => { let ok = false; __DDW3.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.type === 'SphereGeometry' && o.position.z < -6 && o.position.y < .3 && Math.abs(o.position.x + 552) < 12) ok = true; }); return ok; }, null, 10000);
  await ev(() => { const P = __DDW3.player; P.x = -551; P.y = 0; P.vx = 0; __DDW3.snap && __DDW3.snap(); __DDW3.G.interact.find(i => i.disc === 'fishing').run(); }); await sleep(800);
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'fishing').run());
  check('fishing: pressing 🐾 again casts the line (the rod stays in her hand)', await bobOut() && await ev(() => !!__DDW3.G.holding));
  await ev(() => { __DDW3.player.x = -540; }); await sleep(1500); await ev(() => { const P = __DDW3.player; P.x = -551; P.vx = 0; __DDW3.G.interact.find(i => i.disc === 'fishing').run(); }); await sleep(1500);
  const far = await ev(() => { const v = new __DDW3.THREE.Vector3(-549, .08, -40).project(__DDW3.camera), r = __DDW3.renderer.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
  await page.mouse.click(far.x, far.y); await sleep(500);
  check('fishing: a real tap far out on the sea casts there (she keeps the rod)', await bobOut() && await ev(() => !!__DDW3.G.holding && Math.abs(__DDW3.player.x + 551) < 1), JSON.stringify(far));
  await ev(() => { __DDW3.player.x = -540; }); await sleep(1500);
  // ---------- SNOWBALLS ----------
  await ev(() => __DDW3.teleport(-306)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'snowball'), null, 120000); await sleep(1500);
  await ev(() => { const P = __DDW3.player; P.x = -306; P.y = 0; P.vx = 0; __DDW3.G.interact.find(i => i.disc === 'snowball').run(); });
  check('snowball: tap the snow pile and she makes a snowball (in her hand)', await ev(() => !!__DDW3.G.holding) && await toastHas('tap the target'));
  const ring = m => m.geometry.type === 'CylinderGeometry' && Math.abs(m.geometry.parameters.radiusTop - 1) < .01 && Math.abs(m.position.x + 312) < .01;
  await ev(w => __tapAt(eval(w), [-312, 2, -3.8]), ring.toString());
  check('snowball: tap the middle of the target: it flies there, BULLSEYE', await until(() => __DDW3.world.disc.has('bullseye'), null, 15000) && await toastHas('BULLSEYE'));
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'snowball').run()); await toastHas('tap the target'); await ev(w => __tapAt(eval(w), [-311.2, 2.1, -3.8]), ring.toString());
  check('snowball: a throw at the edge lands there (not the middle)', await toastHas('On the target'));
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'snowball').run()); await toastHas('tap the target'); await ev(() => { document.getElementById('toast').textContent = ''; __DDW3.G.interact.find(i => i.disc === 'snowball').run(); });
  check('snowball: 🐾 again throws it at the middle of the target (build 148)', await toastHas('BULLSEYE') && await ev(() => !__DDW3.G.holding));
  // ---------- THE BARN ANIMALS ----------
  await ev(() => __DDW3.teleport(-420)); await until(() => !!__DDW3.G.taps.find(t => { let ok = false; t.traverse(m => { if (m.isMesh && Math.abs(m.position.x + 420.8) < .05 && Math.abs(m.position.z + 3.5) < .05) ok = true; }); return ok; }), null, 120000); await sleep(1500);
  await ev(() => __tapAt(m => Math.abs(m.position.x + 420.8) < .05 && Math.abs(m.position.z + 3.5) < .05, [-420.8, 1.4, -3.4]));
  await sleep(1800);
  const ani = await ev(() => { let r = null; __DDW3.scene.traverse(o => { if (!r && o.visible && o.userData.toySymbol && ['🐴', '🐄', '🐐', '🐑', '🐓'].includes(o.userData.toySymbol) && Math.abs(o.position.x + 420) < .1) { const bb = new __DDW3.THREE.Box3().setFromObject(o); r = { minY: +bb.min.y.toFixed(2), z: +o.position.z.toFixed(2) }; } }); return r; });
  check('barn: the animal walks out on the ground (its feet touch the ground: no hovering)', ani && ani.minY > -.05 && ani.minY < .12 && ani.z > -2.6, JSON.stringify(ani));
  // ---------- THE OWL PATH ----------
  await ev(() => __DDW3.teleport(-192)); await until(() => !!__DDW3.G.interact.find(i => i.disc === 'woods_listen'), null, 120000); await sleep(1500);
  const owls = () => ev(() => { const r = []; __DDW3.scene.traverse(o => { if ([-190, -194, -198].some(x => Math.abs(o.position.x - x) < .01) && Math.abs(o.position.y - 1.75) < .4 && Math.abs(o.position.z + 1.95) < .01) { const bb = new __DDW3.THREE.Box3().setFromObject(o); r.push(+(bb.max.y - bb.min.y).toFixed(2)); } }); return r; });
  const o1 = await owls();
  await ev(() => __DDW3.G.interact.find(i => i.disc === 'woods_listen').run()); await sleep(2500); const o2 = await owls();
  check('owl path: three big owl pictures on posts (about 1 m tall, not tiny)', o1.length === 3 && o1.every(h => h > .8), JSON.stringify(o1));
  check('owl path: after the owl call they light up (grow) one after another', o2.some((h, i) => h > o1[i] + .05), JSON.stringify({ o1, o2 }));
  // ---------- THE SEAGULLS: really flying ----------
  await ev(() => __DDW3.teleport(-85)); await sleep(5000);
  const fly = await ev(async () => { const birds = []; __DDW3.scene.traverse(o => { if (o.userData.fly) birds.push(o); }); if (!birds.length) return null; const g = birds[0], wing = g.children.find(c => c.isGroup), a = [], h = [];
    for (let n = 0; n < 24; n++) { const p0 = g.position.clone(); await new Promise(r => setTimeout(r, 120)); const d = g.position.clone().sub(p0); const fwd = new __DDW3.THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion); a.push(wing.rotation.x); if (d.length() > .01) h.push(fwd.x * d.x + fwd.z * d.z > 0); }
    return { n: birds.length, flap: +(Math.max(...a) - Math.min(...a)).toFixed(2), facing: h.filter(Boolean).length / Math.max(1, h.length) }; });
  check('the seagulls really fly: wings flap, and they face the way they are going', fly && fly.flap > .5 && fly.facing > .8, JSON.stringify(fly));
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
