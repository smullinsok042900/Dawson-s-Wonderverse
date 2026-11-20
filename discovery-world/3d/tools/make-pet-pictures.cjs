// (build 107) A real picture of every planet pet, made from its OWN 3D shape (planet-life.js), for the 🐾 friends panel.
// Built into the game as src/pet-pictures.js; nothing is drawn while she plays. Run after adding or changing a pet:
//   node build.mjs && NODE_PATH=$(npm root -g) node tools/make-pet-pictures.cjs && node build.mjs
// It also writes a contact sheet to screenshots/pet-pictures.png, to check them by eye.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 2100 }, deviceScaleFactor: 1 })).newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test', { timeout: 600000 });
  await p.waitForFunction(() => document.getElementById('loading').classList.contains('done'), null, { timeout: 600000 });
  const out = await p.evaluate(() => {
    const { THREE, G } = __DDW3, S = 192, res = {};
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setSize(S, S); r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    const s = new THREE.Scene(); s.add(new THREE.HemisphereLight('#ffffff', '#c9a6ff', 2.2)); s.add(new THREE.AmbientLight('#ffffff', .6));
    const l = new THREE.DirectionalLight('#ffffff', 2.4); l.position.set(2, 4, 5); s.add(l); const l2 = new THREE.DirectionalLight('#ffffff', 1.2); l2.position.set(-3, 2, -4); s.add(l2);
    const cam = new THREE.PerspectiveCamera(26, 1, .01, 50), box = new THREE.Box3(), c = new THREE.Vector3(), sz = new THREE.Vector3();
    // the side each thing is best seen from: things for the back from behind, everything else from the front, a little from above
    for (const id of G.lifePets) {
      const m = G.lifeMesh(id); s.add(m); m.rotation.y = { glowsnail: 1.15, orbiter: .2, sandsnake: 1.2, pebbleturtle: .8, marsmoth: .2, sparkmouse: .9, airfish: .8, sunsetfly: .2, windkite: 0, sealpup: .9, snowflake: 0, icefly: .6 }[id] ?? .45; /* (the snail from the side, so its shell shows) */ m.updateMatrixWorld(true);
      box.setFromObject(m); box.getCenter(c); box.getSize(sz); const rad = Math.max(sz.x, sz.y, sz.z) * .52 + .02;
      const v = new THREE.Vector3(.25, .3, 1).normalize(), d = rad / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2));
      cam.position.copy(c).addScaledVector(v, d); cam.lookAt(c); cam.updateMatrixWorld();
      r.render(s, cam); res[id] = r.domElement.toDataURL('image/webp', .88); s.remove(m);
    }
    r.dispose(); return res;
  });
  // a contact sheet (each picture on the panel's white card, with its name for the grown-ups)
  await p.setContent(`<body style="margin:0;background:#f2e8ff;font:14px sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px">${Object.entries(out).map(([id, u]) => `<div style="width:120px;text-align:center"><div style="width:110px;height:110px;margin:auto;background:#fff;border-radius:22px;display:flex;align-items:center;justify-content:center"><img src="${u}" style="width:96px;height:96px"></div>${id}</div>`).join('')}</body>`);
  await p.waitForTimeout(500); await p.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'pet-pictures.png'), fullPage: true });
  await b.close();
  fs.writeFileSync(path.resolve(__dirname, '..', 'src', 'pet-pictures.js'), "// (build 107) made by tools/make-pet-pictures.cjs from each pet's own 3D shape: do not edit by hand\nexport const PET_PICS = " + JSON.stringify(out, null, 0).replace(/","/g, '",\n  "') + ';\n');
  console.log('written', Object.keys(out).length, 'pictures,', Math.round(JSON.stringify(out).length / 1024), 'KB');
})().catch(e => { console.error(e); process.exit(1); });
