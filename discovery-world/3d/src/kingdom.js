// ===================================================================
// kingdom.js: 3D build 10, DINO VALLEY and the PRINCESS CASTLE
// (a new part of the world past the Marble Machine).
//   DINO VALLEY
//   • Dottie the giant long-neck dinosaur is grazing. Walk up her tail,
//     across her back, and slide down her long neck. Tap her: a happy hum.
//   • A nest of dino eggs: tap an egg and it wobbles and hatches a baby dino
//     that hops around the nest (they stay hatched).
//   • Tops, a little horned dino, stomps and says hi (a talking friend).
//   PRINCESS CASTLE
//   • Princess Rosie gives your creature a floating golden crown (saved).
//   • Princess Luna waves her wand: the royal fountain sprays sparkles.
//   • A light-up dance floor: every tile you step on glows and plays a note,
//     and the princesses dance while you're on it.
//   All the characters are original. No reading needed.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toy, ball, face, starGeometry } from './creatures.js';
import { NOTES } from './audio.js';
import { plush, quadSpec, personSpec } from './critterkit.js';
import { fabricMat, normalFromCanvas, leafDetail, plasterNormal } from './nature.js';
import { USE_ASSETS, brickSet, landmarksReady } from './assets.js';
import { macroVariation } from './refine.js';
import { buildCastleDetail, buildCastleInteriorDetail, buildDinoDetail, broadLeafGeometry } from './scenery-detail.js';

// (stage 8) merge helper for the sculpted parts below: bake a colour into a geometry so several
// pieces of different colours can share ONE mesh (and one draw call).
function painted(geo, hex) {
  const g = geo.clone(); const c = new THREE.Color(hex);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// pastel stone bricks with soft bumps (castle walls), and scalloped roof tiles
function brickMat(world) {
  if (USE_ASSETS) { // build 19: the tool-made brick set (rose bricks, recessed mortar, worn edges, AO)
    const B0 = brickSet(), B = world ? { map: B0.map.clone(), normal: B0.normal.clone(), rough: B0.rough.clone() } : B0; for (const t of [B.map, B.normal, B.rough]) { t.repeat.set(world ? 1 : 3, world ? 1 : 3); t.needsUpdate = true; }
    return macroVariation(new THREE.MeshStandardMaterial({ map: B.map, normalMap: B.normal, normalScale: new THREE.Vector2(.8, .8), roughnessMap: B.rough, roughness: 1 }), { scale: .2, amount: .07 });
  }
  const W = 256, c = document.createElement('canvas'); c.width = W; c.height = W; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#f4d4e6'; g.fillRect(0, 0, W, W);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const x = k * 64 + (r % 2) * 32, y = r * 32; const shade = 228 + Math.floor(Math.random() * 22); g.fillStyle = `rgb(255,${shade - 14},${shade})`; g.beginPath(); g.roundRect(x + 3, y + 3, 58, 26, 7); g.fill(); if (x + 64 > W) { g.beginPath(); g.roundRect(x + 3 - W, y + 3, 58, 26, 7); g.fill(); } }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(3, 3);
  const nm = new THREE.CanvasTexture(normalFromCanvas(c, 4)); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(3, 3);
  return new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(1, 1), roughness: .8 });
}
function roofTileMat(cA = '#9a76e8', cB = '#c9b0ff') {
  const W = 128, c = document.createElement('canvas'); c.width = W; c.height = W; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = cA; g.fillRect(0, 0, W, W);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 9; k++) { const x = k * 16 + (r % 2) * 8, y = r * 16; const gr = g.createRadialGradient(x, y + 4, 1, x, y + 8, 10); gr.addColorStop(0, cB); gr.addColorStop(1, cA); g.fillStyle = gr; g.beginPath(); g.arc(x, y + 8, 8, 0, Math.PI); g.fill(); }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(6, 3);
  const nm = new THREE.CanvasTexture(normalFromCanvas(c, 3)); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(6, 3);
  return new THREE.MeshPhysicalMaterial({ map, normalMap: nm, roughness: .4, clearcoat: .6 });
}

export const KINGDOM = { x0: 356, dino: 378, dz: -2.0, nest: 363.4, tops: 390, castle: 407, x1: 422 };

export function initKingdom(G, api) {
  const { scene, Sound, burst, discover, toast, world, friends } = api;
  const add = (o, p = scene) => { p.add(o); return o; };
  const plat = o => { const p = { layer: '', ...o }; G.platforms.push(p); return p; };
  const tapObj = (obj, fn) => { obj.traverse(m => { if (m.isMesh) m.userData.tap = fn; }); G.taps.push(obj); };
  const K = KINGDOM, Z = K.dz;

  // =================== DINO VALLEY ===================
  // Dottie, the giant long-neck (she's grazing, so her neck curves down to the flowers)
  const skin = toy('#7fd6c2', { r: .45, cc: .6, sheen: .4 }), belly = toy('#dcfff4', { r: .5, cc: .4 }), spot = toy('#55bba6', { r: .5, cc: .5 }), plate = toy('#ff9fd2', { r: .3, cc: .9 });
  // (stage 6) a scaly skin normal map: soft pebbled bumps that catch the sun, so Dottie reads as a sculpted creature
  { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.fillStyle = '#8080ff'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 190; i++) { const x = (i * 53) % N, y = (i * 97) % N, r = 3 + (i % 4); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#b0b0ff'); gr.addColorStop(.7, '#8585ff'); gr.addColorStop(1, '#8080ff'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    const map = new THREE.CanvasTexture(normalFromCanvas(c, 4)); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(5, 4); skin.normalMap = map; skin.normalScale.set(.5, .5); skin.needsUpdate = true; }
  // smooth tapering tubes for the neck and the tail
  const taperTube = (pts, r0, r1, seg = 48) => {
    const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, seg, 1, 18, false), pos = geo.attributes.position, P0 = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) { const u = i / seg, c = curve.getPointAt(u), r = r0 + (r1 - r0) * u; for (let j = 0; j <= 18; j++) { const k = i * 19 + j; P0.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, P0.x, P0.y, P0.z); } }
    geo.computeVertexNormals(); return new THREE.Mesh(geo, skin);
  };
  const dottie = new THREE.Group(); add(dottie);
  const bx = K.dino, backY = 3.45;
  // (stage 8) Dottie's body is now lofted through ten cross-sections instead of being a squashed sphere:
  // heavy hips and chest, a narrower waist, a flat walkable back and a rounded belly. The cream belly
  // is blended into the teal flanks with vertex colour, so one mesh replaces the body + belly + five
  // stuck-on flavour spots, and there is a real silhouette from below and from the side.
  const skinVC = skin.clone(); skinVC.vertexColors = true; skinVC.color.set('#ffffff'); skinVC.needsUpdate = true; // white base: the vertex colours carry the skin tone, the pebbled normal map stays
  const dBody = (() => {
    const RINGS = [
      [-2.55, 2.06, .30, .26], [-2.15, 2.02, .58, .52], [-1.6, 1.99, .94, .82], [-.95, 2.0, 1.24, 1.02],
      [-.25, 1.99, 1.36, 1.10], [.5, 1.99, 1.38, 1.12], [1.2, 2.02, 1.28, 1.05], [1.8, 2.09, 1.04, .88],
      [2.25, 2.2, .76, .64], [2.52, 2.3, .52, .46],
    ];
    const rings = [], SUB = 3;
    for (let i = 0; i < RINGS.length - 1; i++) for (let s = 0; s < SUB; s++) {
      const t = s / SUB, a = RINGS[i], b = RINGS[i + 1];
      rings.push(a.map((v, k) => v + (b[k] - v) * t));
    }
    rings.push(RINGS[RINGS.length - 1]);
    const SEG = 26, pos = [], col = [], uvs = [], idx = [];
    const cBack = new THREE.Color('#5cbfa8'), cFlank = new THREE.Color('#86dcc9'), cBelly = new THREE.Color('#e8fff8');
    for (let i = 0; i < rings.length; i++) {
      const [lx, cy, ry, rz] = rings[i];
      for (let j = 0; j <= SEG; j++) {
        const a = j / SEG * Math.PI * 2, sy = Math.sin(a), cz = Math.cos(a);
        let y = cy + ry * sy;
        if (y > backY - .015) y = backY - .015 + (y - backY) * .05; // a broad, nearly flat back to walk on
        pos.push(bx + lx, y, Z + rz * cz);
        uvs.push(i / (rings.length - 1), j / SEG);
        const up = Math.max(0, sy), down = Math.max(0, -sy);
        const c = cFlank.clone().lerp(cBack, up * .9).lerp(cBelly, down * .92);
        c.multiplyScalar(.93 + .1 * Math.abs(cz) * (1 - up));
        col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < SEG; j++) {
      const p = i * (SEG + 1) + j, q2 = p + 1, r = p + SEG + 1, s = r + 1;
      idx.push(p, r, q2, q2, r, s);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  })();
  dottie.add(new THREE.Mesh(dBody, skinVC));
  // (stage 8) columnar legs with a knee bulge, a padded foot and three clawed toes (one merged mesh, one draw)
  { const legParts = [];
    for (const lx of [-1.45, 1.3]) for (const s of [-1, 1]) {
      const px = bx + lx, pz = Z + s * .58;
      const prof = [[.36, 0], [.46, .06], [.47, .3], [.37, .72], [.35, 1.0], [.44, 1.28], [.5, 1.52], [.52, 1.62]].map(([r, y]) => new THREE.Vector2(r, y));
      const leg = new THREE.LatheGeometry(prof, 20);
      { const p = leg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, p.getZ(i) + Math.sin(y * 2.1) * .05); } leg.computeVertexNormals(); }
      leg.translate(px, 0, pz); legParts.push(painted(leg, '#7fd6c2')); leg.dispose();
      const foot = new THREE.SphereGeometry(.42, 16, 12); foot.scale(1.06, .32, 1.2); foot.translate(px, .13, pz + .08);
      legParts.push(painted(foot, '#e2fff6')); foot.dispose();
      for (let t = 0; t < 3; t++) {
        const a = (t - 1) * .48, tx = px + Math.sin(a) * .32, tz = pz + Math.cos(a) * .36 + .12;
        const toe = new THREE.SphereGeometry(.15, 12, 9); toe.scale(1.45, .55, 1.15); toe.translate(tx, .115, tz);
        legParts.push(painted(toe, '#f4fffb')); toe.dispose();
        const claw = new THREE.ConeGeometry(.06, .17, 8); claw.rotateX(Math.PI / 2.15); claw.translate(tx, .12, tz + .18);
        legParts.push(painted(claw, '#fff6e8')); claw.dispose();
      }
    }
    const legs = new THREE.Mesh(mergeGeometries(legParts, false), skinVC);
    legs.castShadow = legs.receiveShadow = true; dottie.add(legs); legParts.forEach(g => g.dispose()); }
  // (stage 8) a row of dorsal scutes along her spine, and the old flank spots kept as raised bumps
  { const parts = [];
    for (let i = 0; i < 12; i++) {
      const lx = -1.85 + i * .36, y = backY - .12 - Math.max(0, Math.abs(lx + .35) - 1.35) * .3;
      const sc = new THREE.SphereGeometry(.14, 10, 7); sc.scale(1.45, .6, .85); sc.translate(bx + lx, y, Z - .88);
      parts.push(painted(sc, i % 2 ? '#4fb8a2' : '#5cc9b2')); sc.dispose();
    }
    for (const [dx, dy, r] of [[-1.0, 2.2, .24], [.35, 2.05, .28], [1.35, 2.15, .22]]) {
      const sp = new THREE.SphereGeometry(r, 12, 9); sp.scale(1, .8, .32); sp.translate(bx + dx, dy, Z + .98);
      parts.push(painted(sp, '#5cc9b2')); sp.dispose();
    }
    const ridge = new THREE.Mesh(mergeGeometries(parts, false), skinVC);
    ridge.castShadow = ridge.receiveShadow = true; dottie.add(ridge); parts.forEach(g => g.dispose()); }
  // tail = little stairs (walk right onto it and you climb up by yourself)
  const steps = [];
  for (let k = 0; k < 7; k++) {
    const x = 369.95 + k * .85, y = .45 * (k + 1);
    steps.push(plat({ a: x - .43, b: x + .43, y, z: Z, step: true, dino: true }));
  }
  { const pts = [new THREE.Vector3(bx - 1.6, 2.35, Z)]; for (let k = 6; k >= 0; k--) pts.push(new THREE.Vector3(369.95 + k * .85, .45 * (k + 1) - .45, Z)); pts.push(new THREE.Vector3(368.6, .18, Z)); dottie.add(taperTube(pts, .72, .14)); }
  const back = plat({ a: 375.45, b: 379.7, y: backY, z: Z, step: true, dino: true });
  // the neck: a smooth curve from her shoulders down to her head in the flowers (you slide down it)
  const neckPath = new THREE.CatmullRomCurve3([[379.5, backY + .62, Z], [381.2, backY + .25, Z], [382.7, 2.75, Z], [383.9, 1.95, Z + .05], [384.9, 1.62, Z + .1]].map(p => new THREE.Vector3(...p)));
  (G.slideEdges = G.slideEdges || []).push({ y: backY, x: back.b - .25, path: neckPath, disc: 'dinoslide', msg: 'Wheee! Down Dottie\'s long neck!' });
  { const pts = []; for (let i = 0; i <= 10; i++) { const p = neckPath.getPointAt(i / 10), r = .78 + (.42 - .78) * ((i + 1) / 11); pts.push(new THREE.Vector3(p.x, p.y - .62 - r, p.z)); } pts.unshift(new THREE.Vector3(bx + 1.2, 2.4, Z)); dottie.add(taperTube(pts, .78, .42)); }
  for (let i = 1; i < 6; i++) { const p = neckPath.getPointAt(i / 7); const pl = new THREE.Mesh(new THREE.ConeGeometry(.16, .32, 10), plate); pl.position.set(p.x, p.y - .55, p.z - .42); pl.rotation.x = -.5; dottie.add(pl); }
  const dHead = new THREE.Group(); dHead.position.set(385.75, .62, Z + .15); dottie.add(dHead);
  dHead.add(ball(skin, .62, 0, 0, 0, 1.25, .78, .95)); dHead.add(ball(belly, .38, .35, -.18, .2, 1.1, .6, .9));
  // (stage 8) a sculpted head: brow ridges over her eyes, a rounded jaw below the muzzle, nostril
  // bumps at the snout and a crest scute on top (one merged mesh, so it keeps the same draw cost)
  { const parts = [];
    for (const s of [-1, 1]) {
      const brow = new THREE.SphereGeometry(.13, 12, 9); brow.scale(1.5, .55, .95); brow.translate(s * .25, .33, .42);
      parts.push(painted(brow, '#6ccbb6')); brow.dispose();
      const nost = new THREE.SphereGeometry(.05, 10, 8); nost.scale(1, .75, 1.1); nost.translate(s * .11, .04, .63);
      parts.push(painted(nost, '#4aa896')); nost.dispose();
    }
    const jaw = new THREE.SphereGeometry(.3, 16, 11); jaw.scale(1.15, .42, .95); jaw.translate(.42, -.3, .22);
    parts.push(painted(jaw, '#dcfff4')); jaw.dispose();
    const crest = new THREE.SphereGeometry(.16, 12, 9); crest.scale(.8, .55, 1.5); crest.translate(-.02, .46, -.02);
    parts.push(painted(crest, '#5cc9b2')); crest.dispose();
    const det = new THREE.Mesh(mergeGeometries(parts, false), skinVC.clone());
    det.material.vertexColors = true; det.castShadow = true; dHead.add(det); parts.forEach(g => g.dispose()); }
  face(dHead, { y: .15, z: .56, spread: .24, eyeR: .12, mouthY: -.14 });
  // flowers she's nibbling
  const flowerCols = ['#ff6fae', '#ffd23f', '#ffffff', '#a15cff', '#5bc8ff'];
  for (let i = 0; i < 9; i++) {
    const fx = 384.5 + (i % 5) * .7, fz = Z + .9 + Math.floor(i / 5) * .5 - .2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .35, 5), toy('#3cc46e')); stem.position.set(fx + 1.6, .17, fz); add(stem);
    for (let p2 = 0; p2 < 5; p2++) { const a = p2 / 5 * Math.PI * 2; add(ball(toy(flowerCols[i % 5], { r: .5 }), .07, fx + 1.6 + Math.cos(a) * .08, .37, fz + Math.sin(a) * .08, 1, .5, 1, true)); }
    add(ball(toy('#ffd23f'), .05, fx + 1.6, .39, fz, 1, 1, 1, true));
  }
  dottie.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  let hum = 0;
  const humDottie = () => { hum = 1.4; Sound.tone(150, .7, 'sine', .07, 1.35); Sound.tone(225, .6, 'triangle', .03, 1.3, .1); burst(dHead.position.x, 1.6, Z + .6, ['#ff8fc8', '#ffffff', '#9ff7c8'], 14, 2); discover('dottie', 'Dottie the long-neck dinosaur! Climb her tail and slide down her neck!'); };
  tapObj(dottie, humDottie);
  G.interact.push({ x: 386.6, y: 0, layer: '', disc: 'dottie', run: humDottie, hintY: 2.2 });

  // the egg nest (tap an egg to hatch a baby dino)
  const nest = new THREE.Mesh(new THREE.TorusGeometry(1.15, .32, 12, 28), toy('#c48a52', { r: .85, cc: .1 })); nest.rotation.x = -Math.PI / 2; nest.position.set(K.nest, .22, -2.2); nest.receiveShadow = true; add(nest);
  { const bed = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), toy('#f1d39a', { r: .9, cc: 0 })); bed.rotation.x = -Math.PI / 2; bed.position.set(K.nest, .05, -2.2); add(bed); }
  const EGG_COLS = [['#bdf3e4', '#7fd6c2'], ['#ffd1ec', '#ff8fc8'], ['#e2d4ff', '#a98bff']];
  world.dinoEggs = Array.isArray(world.dinoEggs) && world.dinoEggs.length === 3 ? world.dinoEggs : [false, false, false];
  const eggs = EGG_COLS.map(([shell, kid], i) => {
    const x = K.nest - .6 + i * .6, z = -2.2 + (i === 1 ? -.25 : .15);
    const egg = new THREE.Group(); egg.position.set(x, .2, z); add(egg);
    egg.add(ball(toy(shell, { r: .3, cc: 1 }), .3, 0, .3, 0, 1, 1.3, 1));
    for (let s = 0; s < 4; s++) egg.add(ball(toy('#ffffff', { r: .4 }), .06, Math.cos(s * 1.7) * .22, .2 + s * .1, Math.sin(s * 1.7) * .22 + .05, 1, 1, .4));
    // the baby inside
    const baby = new THREE.Group(); baby.position.set(x, .05, z + .2); baby.visible = false; add(baby);
    plush(baby, quadSpec({ scale: .42, body: kid, belly: '#fff6ee', snoutCol: kid, hoof: kid, ears: false, tail: 'long', legLen: .32, long: .8, neck: 1.1, fat: 1.15, plates: '#ffffff', iris: '#6a3a9a', voxel: .032 }), { fur: false, rough: .4, clearcoat: .7, lid: kid, iris: '#6a3a9a' });
    const shellBits = [0, 1].map(s => { const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 14, 8, 0, Math.PI * 2, s ? Math.PI / 2 : 0, Math.PI / 2), toy(shell, { r: .3, cc: 1, }).clone()); h.material.side = THREE.DoubleSide; h.position.set(x + (s ? .35 : -.35), .15, z + .25); h.scale.set(1, 1.2, 1); h.visible = false; add(h); return h; });
    const e = { i, egg, baby, shellBits, wob: 0, hop: 0, t: Math.random() * 5, x, z };
    egg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.tap = () => tapEgg(e); } }); G.taps.push(egg);
    baby.userData.tap = () => tapBaby(e); G.taps.push(baby);
    return e;
  });
  function showHatched(e) { e.egg.visible = false; e.baby.visible = true; e.shellBits.forEach(s => { s.visible = true; }); }
  function tapEgg(e) { if (world.dinoEggs[e.i]) { tapBaby(e); return; } /* (the hidden egg still catches taps once hatched) */ if (e.wob > 0) return; e.wob = 1.3; Sound.tone(520, .1, 'triangle', .04, 1.2); Sound.tone(560, .1, 'triangle', .04, 1.2, .3); Sound.tone(600, .1, 'triangle', .04, 1.2, .6); discover('dinoegg', 'A dino egg! Tap it to see what is inside!'); }
  world.dinoFollow = Array.isArray(world.dinoFollow) && world.dinoFollow.length === 3 ? world.dinoFollow : [false, false, false];
  function followBaby(e) { e.f = friends.addFollower({ kind: 'dino', root: e.baby, orient: 'x' }); e.f.pos.copy(e.baby.position); }
  function tapBaby(e) {
    if (!world.dinoEggs[e.i]) { tapEgg(e); return; } // (the hidden baby sits inside the egg: a tap there means the egg)
    if (!e.f) { world.dinoFollow[e.i] = true; followBaby(e); Sound.chime(); toast('🦕💖 A baby dino wants to come with you!'); discover('dinofollow', 'Baby dinos follow you when you tap them!'); api.saveSoon(); }
    else { friends.waveBye(e.f); e.restY = e.f.pos.y; e.f = null; world.dinoFollow[e.i] = false; api.saveSoon(); return; }
    e.hop = .7; Sound.tone(900 + e.i * 120, .12, 'sine', .05, 1.5); Sound.tone(1100 + e.i * 120, .1, 'sine', .04, 1.4, .12); burst(e.baby.position.x, 1.1, e.baby.position.z, ['#ff8fc8', '#fff'], 6, 1.2); discover('babydino', 'Baby dinos! They squeak when you tap them.'); }
  G.interact.push({ x: K.nest, y: 0, layer: '', disc: 'dinoegg', run: () => { const e = eggs.find(e2 => !world.dinoEggs[e2.i]); if (e) tapEgg(e); else tapBaby(eggs[Math.floor(Math.random() * 3)]); }, hintY: 1.6 });

  // Tops, a little horned dino (a talking friend)
  friends.TALK.tops = ['🦖💚', '🌿😋', '🦕🎶', '💪😄']; friends.VOICE.tops = 240;
  friends.critter('tops', K.tops, 0, -2.4, r => {
    const k2 = plush(r, quadSpec({ scale: .95, body: '#ffb35c', belly: '#ffe2b8', snoutCol: '#ffd09a', hoof: '#e8904a', ears: false, tail: 'long', legLen: .32, long: .9, neck: .55, fat: 1.25, frill: '#ff7a9a', horns: '#fff6e0', iris: '#3a7ad0' }), { fur: false, rough: .45, clearcoat: .6, lid: '#ffb35c', iris: '#3a7ad0' });
    return { head: k2.B.head, tick: k2.tick, B: k2.B };
  }, c => { [0, .25].forEach(d => Sound.tone(70, .25, 'sine', .1, .6, d)); burst(c.x, .2, c.z + .4, ['#e8d2a8', '#fff'], 16, 2.5); G.shake = .35; }, 'tops', 'Stomp stomp! Tops the little dino says hi!');

  // (stage 8) palm ferns with real arching fronds: each palm is a ringed, tapered trunk plus a merged
  // crown of broad leaves (with midribs and drooping tips) — one draw per palm instead of six capsules.
  const palmMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7, metalness: 0, side: THREE.DoubleSide, normalMap: leafDetail().normal, normalScale: new THREE.Vector2(.6, .6) });
  for (const [x, z, s] of [[358, -4.6, 1], [367.5, -4.8, 1.2], [372.5, -5.4, .9], [383, -5.2, 1.3], [392.5, -4.6, 1]]) {
    const parts = [];
    const trunk = new THREE.CylinderGeometry(.12 * s, .2 * s, 2.6 * s, 12); trunk.translate(0, 1.3 * s, 0);
    parts.push(painted(trunk, '#b8834e')); trunk.dispose();
    for (let r = 0; r < 6; r++) { const ring = new THREE.CylinderGeometry(.2 * s - r * .012 * s, .21 * s - r * .012 * s, .05 * s, 12); ring.translate(0, (.4 + r * .42) * s, 0); parts.push(painted(ring, '#a4713f')); ring.dispose(); }
    const crown = new THREE.SphereGeometry(.2 * s, 14, 10); crown.scale(1.3, .7, 1.3); crown.translate(0, 2.62 * s, 0); parts.push(painted(crown, '#4f9f5a')); crown.dispose();
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * Math.PI * 2 + (k % 2) * .2;
      const leaf = broadLeafGeometry({ len: 1.7 * s, wid: .22 * s, rise: .3, droop: .62, cup: .07, rib: .03, seg: 6, across: 4, colA: '#3f8f4a', colB: '#7fd07a' });
      leaf.rotateX(-1.24 - (k % 3) * .08);
      leaf.rotateY(a);
      leaf.translate(0, 2.62 * s, 0);
      parts.push(leaf);
    }
    const palm = new THREE.Mesh(mergeGeometries(parts, false), palmMat);
    palm.position.set(x, 0, z); palm.castShadow = palm.receiveShadow = true; add(palm); parts.forEach(g => g.dispose());
  }
  for (const [x, z, r] of [[360.5, -3.2, .5], [366.2, -3.6, .35], [388.2, -4, .6], [394.2, -3.3, .4]]) add(ball(toy('#c9b8d8', { r: .8, cc: .1 }), r, x, r * .5, z, 1.3, .8, 1));

  if (!/[?&]nodetail/.test(location.search)) G.dinoDetail = buildDinoDetail({ add, dx: K.dino }); // (?nodetail = A/B measurement)

  // =================== PRINCESS CASTLE ===================
  const C = new THREE.Group(); C.position.set(K.castle, 0, 0); add(C);
  const LEG = new THREE.Group(); C.add(LEG); // (build 22: the old castle structure: the light test mode and the fallback; the Blender castle replaces it)
  const wallM = brickMat(), roofTiles = roofTileMat(), trimM = toy('#ffffff', { r: .4, cc: .6 }), roofM = roofTiles, goldM = toy('#ffd23f', { r: .2, cc: 1, m: .6 });
  { const keep = new THREE.Mesh(new RoundedBoxGeometry(12, 7, 3, 3, .25), wallM); keep.position.set(0, 3.5, -5.6); keep.receiveShadow = true; LEG.add(keep);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new RoundedBoxGeometry(.8, .7, 1, 2, .12), wallM); b.position.set(-5.4 + i * 1.35, 7.3, -4.6); b.castShadow = true; LEG.add(b); }
    for (const tx of [-6.6, 6.6]) {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, 9, 32), wallM); tw.position.set(tx, 4.5, -4.9); tw.castShadow = true; tw.receiveShadow = true; LEG.add(tw);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .14, 10, 32), trimM); ring.rotation.x = Math.PI / 2; ring.position.set(tx, 9, -4.9); LEG.add(ring);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.4, 32), roofM); roof.position.set(tx, 10.7, -4.9); roof.castShadow = true; LEG.add(roof);
      LEG.add(ball(goldM, .16, tx, 12.5, -4.9));
      for (const wy of [3, 6]) { const w = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .6 })); w.position.set(tx, wy, -3.4); LEG.add(w); }
    }
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 3, 28), wallM); mid.position.set(0, 8.4, -5.6); LEG.add(mid);
    const mroof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.8, 28), toy('#ff8fc8', { r: .3, cc: 1 })); mroof.position.set(0, 11.3, -5.6); mroof.castShadow = true; LEG.add(mroof);
    // the big front door (an arch) and glowing windows
    const door = new THREE.Group(); door.position.set(0, 0, -4.05); C.add(door);
    const leaf = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.6, .25, 2, .1), toy('#c870b0', { r: .45, cc: .6 })); leaf.position.y = 1.3; door.add(leaf);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .25, 28, 1, false, -Math.PI / 2, Math.PI), toy('#c870b0', { r: .45, cc: .6 })); arch.rotation.x = Math.PI / 2; arch.position.y = 2.6; door.add(arch);
    door.add(ball(goldM, .1, .8, 1.3, .16)); const hrt = new THREE.Mesh(starGeometry(.35, .17, .06, .02, 1), goldM); hrt.position.set(0, 2.85, .14); door.add(hrt);
    for (const [wx, wy] of [[-3.4, 4.6], [3.4, 4.6], [-3.4, 2], [3.4, 2], [0, 5.4]]) { const w = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.4, .1, 2, .4), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .55 })); w.position.set(wx, wy, -4.08); C.add(w); }
    G.castleDoor = door;
    if (USE_ASSETS) landmarksReady.then(A => { if (!A || !A.castle) return; // (build 22) the Blender-modelled castle
      const ao = A.castleAO, roofTex = (a, b) => { const t = roofTileMat(a, b); for (const k of ['map', 'normalMap']) { t[k].repeat.set(.34, .55); } return t; };
      const mats = { wall: (() => { const m = brickMat(true); m.aoMap = ao; return m; })(), stone: new THREE.MeshStandardMaterial({ color: '#fff1f4', roughness: .62, aoMap: ao }),
        roofA: roofTex('#9a76e8', '#c9b0ff'), roofB: roofTex('#ff7fbf', '#ffc4e4'), gold: goldM.clone(), glass: new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .55, roughness: .4 }),
        flag: fabricMat('#ff6fb5') };
      for (const k of ['roofA', 'roofB', 'gold']) mats[k].aoMap = ao; mats.flag.side = THREE.DoubleSide;
      A.castle.traverse(o => { if (!o.isMesh) return; const nm = (o.material && o.material.name) || ''; o.material = mats[nm] || mats.stone; o.castShadow = true; o.receiveShadow = true; });
      C.add(A.castle); LEG.visible = false; });
    tapObj(door, () => { door.userData.open = 1.6; Sound.chime(); burst(K.castle, 2, -3.5, ['#ffd23f', '#ff8fc8', '#fff', '#b28cff'], 24, 3); discover('castle', 'The Princess Castle! Dance on the shiny floor!'); setTimeout(() => enterCastle(), 350); });
  }
  // ---------- build 16: a magical castle front ----------
  const FRONT = []; // (build 37: every still part of the castle front, merged below)
  { const add2 = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; C.add(m); FRONT.push(m); return m; };
    // steps up to the door, and a golden arch around it
    for (let i = 0; i < 3; i++) add2(new THREE.Mesh(new RoundedBoxGeometry(3.6 - i * .4, .14, .9 - i * .25, 2, .05), toy('#fff4fa', { r: .6, cc: .2 })), 0, .07 + i * .14, -3.5 - i * .2);
    const archT = new THREE.Mesh(new THREE.TorusGeometry(1.38, .1, 12, 40, Math.PI), goldM); add2(archT, 0, 2.6, -3.98);
    for (const sx of [-1.38, 1.38]) add2(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2.6, 12), goldM), sx, 1.3, -3.98);
    // a balcony with a railing above the door (turned balusters, not plain sticks)
    const balc = add2(new THREE.Mesh(new RoundedBoxGeometry(3.4, .18, 1.1, 2, .06), trimM), 0, 4.05, -3.65);
    for (let i = 0; i <= 10; i++) {
      const prof = [[.052, 0], [.072, .03], [.046, .13], [.028, .21], [.052, .31], [.078, .39], [.062, .46], [.052, .5]].map(([r, y]) => new THREE.Vector2(r, y));
      add2(new THREE.Mesh(new THREE.LatheGeometry(prof, 10), trimM), -1.6 + i * .32, 4.14, -3.15);
    }
    add2(new THREE.Mesh(new RoundedBoxGeometry(3.4, .08, .12, 2, .03), trimM), 0, 4.66, -3.15);
    for (let i = 0; i < 4; i++) add2(new THREE.Mesh(new THREE.ConeGeometry(.12, .5, 10), trimM), -1.2 + i * .8, 3.8, -3.3).rotation.x = Math.PI;
    // (stage 8) REAL FACADE DEPTH: a moulded plinth and base course, engaged pilasters with caps and
    // bases, a ring of stone voussoirs and a keystone over the door, projecting window architraves with
    // sills, hoods and mullions, alternating corner quoins and a corbel table carrying a parapet ledge.
    // They are all still static, so the merge below folds them into the same handful of draw calls.
    const sbox = (w, h, d, r = .06) => new RoundedBoxGeometry(w, h, d, 1, r); // one bevel segment is plenty at this distance
    const stoneM = new THREE.MeshStandardMaterial({ color: '#fff8fb', roughness: .62, metalness: .02,
      normalMap: (() => { const n = plasterNormal().clone(); n.repeat.set(2.2, 2.2); n.needsUpdate = true; return n; })(), normalScale: new THREE.Vector2(.22, .22) });
    add2(new THREE.Mesh(sbox(12.9, .5, .7, .1), stoneM), 0, .25, -4.0);
    add2(new THREE.Mesh(sbox(12.6, .16, .84, .06), stoneM), 0, .58, -3.99);
    for (const px of [-5.0, -2.55, 2.55, 5.0]) {
      add2(new THREE.Mesh(sbox(.34, 3.3, .28, .07), stoneM), px, 2.28, -3.97);
      add2(new THREE.Mesh(sbox(.62, .28, .46, .07), stoneM), px, .72, -3.95);
      add2(new THREE.Mesh(sbox(.64, .26, .48, .07), stoneM), px, 4.06, -3.95);
      add2(new THREE.Mesh(sbox(.46, .09, .36, .03), stoneM), px, 3.86, -3.95);
    }
    // voussoirs: nine wedge stones stepping round the door arch, and the keystone at the crown
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (i + .5) / 9;
      add2(new THREE.Mesh(sbox(.3, .46, .3, .05), stoneM), Math.cos(a) * 1.5, 2.6 + Math.sin(a) * 1.5, -3.95).rotation.z = a - Math.PI / 2;
    }
    add2(new THREE.Mesh(sbox(.44, .62, .36, .07), stoneM), 0, 4.32, -3.95);
    // a slim string course at the top of the wall (it sits below the battlements, so they stay in view)
    add2(new THREE.Mesh(sbox(11.6, .12, .5, .05), stoneM), 0, 6.98, -3.95);
    // arched windows with frames, shutters and flower boxes
    for (const [wx, wy] of [[-3.4, 4.6], [3.4, 4.6], [-3.4, 2], [3.4, 2]]) {
      const jamb = 0.16, wh = 1.42, ww = 1.12;
      for (const s of [-1, 1])       add2(new THREE.Mesh(sbox(jamb, wh + .2, .26, .04), stoneM), wx + s * (ww / 2 + jamb / 2), wy + .1, -3.97);
      add2(new THREE.Mesh(sbox(ww + .6, .19, .42, .05), stoneM), wx, wy - wh / 2 - .06, -3.95);
      add2(new THREE.Mesh(sbox(ww + .62, .22, .4, .06), stoneM), wx, wy + wh / 2 + .22, -3.94);
      add2(new THREE.Mesh(sbox(.055, wh - .1, .06, .015), stoneM), wx, wy + .1, -3.99);
      add2(new THREE.Mesh(sbox(ww - .06, .055, .06, .015), stoneM), wx, wy + .1, -3.99);
      const fr = new THREE.Mesh(new THREE.TorusGeometry(.62, .07, 10, 24, Math.PI), trimM); add2(fr, wx, wy + .55, -4.02);
      for (const sx of [-.95, .95]) { const sh = add2(new THREE.Mesh(new RoundedBoxGeometry(.4, 1.3, .08, 2, .04), toy('#b28cff', { r: .5 })), wx + sx, wy + .2, -4.0); sh.rotation.y = sx > 0 ? -.3 : .3; }
      const box = add2(new THREE.Mesh(new RoundedBoxGeometry(1.4, .22, .32, 2, .06), toy('#ffffff', { r: .6 })), wx, wy - .55, -3.85);
      for (let k = 0; k < 7; k++) add2(new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), toy(['#ff4f8a', '#ffd23f', '#ff9fd2', '#ffffff'][k % 4], { r: .5 })), wx - .55 + k * .18, wy - .38, -3.82);
      for (let k = 0; k < 5; k++) add2(new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), toy('#5fc06a', { r: .7, sheen: .5 })), wx - .5 + k * .25, wy - .42, -3.9);
    }
    // a round rose window above the balcony
    const rose = new THREE.Mesh(new THREE.CircleGeometry(.6, 32), new THREE.MeshStandardMaterial({ color: '#ffe0f6', emissive: '#ff9fd8', emissiveIntensity: .5 })); add2(rose, 0, 5.9, -4.07);
    add2(new THREE.Mesh(new THREE.TorusGeometry(.62, .08, 10, 32), goldM), 0, 5.9, -4.04);
    for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.15, .02), goldM); sp.rotation.z = k / 8 * Math.PI; add2(sp, 0, 5.9, -4.03); }
    // hanging banners with a heart
    for (const bx of [-1.9, 1.9]) { const b = add2(new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.6, 1, 4), fabricMat('#ff6fb5')), bx, 5.3, -3.95); const h = new THREE.Mesh(starGeometry(.16, .08, .03, .01, 1), goldM); h.position.set(0, -.2, .03); b.add(h); }
    // lanterns either side of the door
    for (const lx of [-2.1, 2.1]) { add2(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 8), goldM), lx, 2.7, -3.85); const l = add2(new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff6c8', emissive: '#ffd76a', emissiveIntensity: 1.1 })), lx, 2.35, -3.85); l.castShadow = false; add2(new THREE.Mesh(new THREE.ConeGeometry(.2, .18, 12), goldM), lx, 2.56, -3.85); }
    // climbing roses up the towers (leafy vines with flowers)
    for (const tx of [-6.6, 6.6]) for (let i = 0; i < 26; i++) { const a = (tx > 0 ? -1 : 1) * .5 + Math.sin(i * .7) * .5 + Math.PI / 2, y = .3 + i * .25; const v = add2(new THREE.Mesh(new THREE.SphereGeometry(i % 3 ? .12 : .1, 10, 8), i % 3 ? toy('#5fc06a', { r: .7, sheen: .5 }) : toy('#ff6f9f', { r: .5 })), tx + Math.cos(a) * 1.55, y, -4.9 + Math.sin(a) * 1.55); v.castShadow = false; }
    // trimmed hedges and topiary balls in front
    const hedgeM = new THREE.MeshPhysicalMaterial({ color: '#7fbf68', map: leafDetail().map, roughness: .8, sheen: .5, sheenRoughness: .6, sheenColor: new THREE.Color('#e4f7c0'), normalMap: leafDetail().normal, normalScale: new THREE.Vector2(.7, .7) }); // (build 18: leafy detail)
    for (const hx of [-4.7, 4.7]) { add2(new THREE.Mesh(new RoundedBoxGeometry(2.6, .8, .8, 3, .3), hedgeM), hx, .4, -3.3); }
    for (const tx of [-3.1, 3.1]) { add2(new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .4, 16), toy('#ffffff', { r: .5 })), tx, .2, -3.2); add2(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .4, 8), toy('#8a5a3a')), tx, .6, -3.2); add2(new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16), hedgeM), tx, 1.1, -3.2); }
  }
  // flags on the towers wave
  const flags = [];
  for (const tx of [-6.6, 6.6, 0]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.9, .5, 6, 1), new THREE.MeshStandardMaterial({ color: tx ? '#ff6fae' : '#ffd23f', side: THREE.DoubleSide })); const y = tx ? 13.1 : 13.4, z = tx ? -4.9 : -5.6; const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 6), trimM); pole.position.set(tx, y - .3, z); C.add(pole); f.position.set(tx + .45, y, z); C.add(f); flags.push(f); f.userData.p0 = f.geometry.attributes.position.array.slice(); }
  C.traverse(o => { if (o.isMesh && o.castShadow === false && o.geometry.type !== 'CircleGeometry') o.castShadow = true; });
  // (build 37) FEWER DRAW CALLS: the castle front was about 175 separate little parts (steps, railings, flower boxes,
  // climbing roses, hedges...), each drawn on its own, twice when shadows update. None of them moves or is tapped, so the
  // parts that share a material are merged into ONE shape per material: the same picture, the same materials (no new
  // shaders), about 160 fewer draw calls whenever the castle is in view.
  // (materials made separately but looking exactly the same count as the same material)
  const matLook = M => { const c = v => v && v.isColor ? v.getHexString() : v && v.isVector2 ? v.x + '/' + v.y : v && v.uuid ? v.uuid : v; return [M.type, ...['color', 'emissive', 'emissiveIntensity', 'roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'sheen', 'sheenRoughness', 'sheenColor', 'map', 'normalMap', 'normalScale', 'emissiveMap', 'alphaMap', 'metalnessMap', 'aoMap', 'roughnessMap', 'transparent', 'opacity', 'side', 'vertexColors', 'flatShading', 'transmission', 'iridescence', 'envMapIntensity'].map(k => String(c(M[k])))].join(','); };
  { const groups = new Map();
    for (const m of FRONT) { if (!m.isMesh || m.children.length || m.parent !== C) continue; const g = m.geometry, key = matLook(m.material) + '|' + (g.index ? 'i' : 'n') + '|' + Object.keys(g.attributes).sort().join(',') + '|' + m.castShadow;
      if (!groups.has(key)) groups.set(key, []); groups.get(key).push(m); }
    let merged = 0;
    for (const list of groups.values()) { if (list.length < 2) continue;
      const geos = list.map(m => { m.updateMatrix(); const g = m.geometry.clone(); g.applyMatrix4(m.matrix); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g; });
      let one = null; try { one = mergeGeometries(geos, false); } catch (e) { one = null; } geos.forEach(g => g.dispose()); if (!one) continue;
      const mm = new THREE.Mesh(one, list[0].material); mm.castShadow = list[0].castShadow; mm.receiveShadow = true; C.add(mm);
      for (const m of list) { C.remove(m); m.geometry.dispose(); } merged += list.length; }
    G.castleMerged = merged; }
  if (!/[?&]nodetail/.test(location.search)) G.castleDetail = buildCastleDetail({ add, cx: K.castle }); // (?nodetail = A/B measurement)

  // the royal fountain
  const fx = K.castle + 9.5, fz = -2.6;
  { const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, .55, 32), trimM); basin.position.set(fx, .28, fz); basin.castShadow = true; add(basin);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, .05, 32), new THREE.MeshPhysicalMaterial({ color: '#9fe6ff', roughness: .05, clearcoat: 1, transparent: true, opacity: .85, emissive: '#5bc8ff', emissiveIntensity: .15 })); water.position.set(fx, .5, fz); add(water);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, 1.3, 16), trimM); col.position.set(fx, .9, fz); col.castShadow = true; add(col);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), trimM); bowl.position.set(fx, 1.75, fz); add(bowl);
    add(ball(goldM, .14, fx, 1.85, fz)); }
  let spray = 0;
  const fountainSpray = () => { spray = 2.4; Sound.tone(1200, .4, 'sine', .03, 1.6); discover('fountain', 'The royal fountain sprays sparkles!'); };

  // two princesses (original characters): Rosie and Luna
  const princess = (kind, x, gownC, trimC, skinC, hairC, wandOrRose) => friends.critter(kind, x, 0, -2.3, r => {
    const gown = toy(gownC, { r: .35, cc: .8, sheen: .6, sheenColor: '#ffffff' }), trim = toy(trimC, { r: .3, cc: 1, m: .2 }), sk = toy(skinC, { r: .55, cc: .2 }), hair = toy(hairC, { r: .5, cc: .4, sheen: .5 });
    const prof = [[0, 0], [.72, 0], [.7, .08], [.6, .4], [.45, .8], [.3, 1.1], [.2, 1.24], [0, 1.26]].map(([a, b]) => new THREE.Vector2(a, b));
    const skirt = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), gown); skirt.castShadow = true; r.add(skirt);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(.7, .05, 8, 40), trim); hem.rotation.x = Math.PI / 2; hem.position.y = .06; r.add(hem);
    // build 14: a sculpted princess (one smooth body, real eyes) on a skeleton
    const k2 = plush(r, personSpec({ skin: skinC, gown: gownC, hair: hairC }), { fur: false, rough: .5, clearcoat: .3, lid: skinC, iris: wandOrRose === 'wand' ? '#6a4ad0' : '#3a8a5a',
      accessories: (B, at) => {
        const crown = new THREE.Group(); const band = new THREE.Mesh(new THREE.CylinderGeometry(.13, .145, .07, 20, 1, true), goldM); crown.add(band);
        for (let q = 0; q < 5; q++) { const a = q / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(.03, .1, 6), goldM); sp.position.set(Math.cos(a) * .13, .07, Math.sin(a) * .13); crown.add(sp); }
        crown.add(ball(toy(trimC, { em: trimC, ei: .3 }), .035, 0, .01, .145)); crown.rotation.x = -.2; at(B.head, crown, 0, 2.27, .02);
        if (wandOrRose === 'wand') { const w = new THREE.Group(); const st2 = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .45, 6), trim); st2.position.y = .2; w.add(st2); const st = new THREE.Mesh(starGeometry(.1, .045, .03, .01, 1), toy('#fff3a6', { em: '#ffe36e', ei: .9 })); st.position.y = .45; w.add(st); at(B.handR, w, -.31, 1.18, .08); }
        else at(B.handR, ball(toy('#ff4f6e', { r: .4, cc: .8 }), .07, 0, 0, 0), -.31, 1.14, .1);
      } });
    const head = k2.B.head, arm = k2.B.armL;
    r.userData.tick = k2.tick;
    return { head, arm, skirt, tick: k2.tick };
  }, c => (kind === 'rosie' ? giveCrown(c) : (fountainSpray(), burst(c.x, 2, c.z + .4, ['#fff3a6', '#b28cff', '#fff'], 18, 2.5), giveWand())), kind, kind === 'rosie' ? 'Princess Rosie gives you a golden crown!' : 'Princess Luna waves her magic wand!');
  friends.TALK.rosie = ['👑✨', '💖😊', '🌹👋', '💃🎶']; friends.VOICE.rosie = 760;
  friends.TALK.luna = ['🌙⭐', '✨🪄', '⛲💦', '💃🎶']; friends.VOICE.luna = 660;
  const rosie = princess('rosie', K.castle - 4.2, '#ff8fc8', '#ffd23f', '#f6d0b4', '#8a5530', 'rose');
  const luna = princess('luna', K.castle + 6.6, '#a98bff', '#9fe6ff', '#b97f5c', '#2b1d2c', 'wand');

  // the crown she gives you floats above your head (saved)
  const myCrown = new THREE.Group(); myCrown.userData.dynamic = true; /* (build 33: it travels with you: never part of a scenery slice, which hid it once you were 50 m from the castle) */ add(myCrown); myCrown.visible = false;
  { const band = new THREE.Mesh(new THREE.CylinderGeometry(.26, .29, .14, 22, 1, true), goldM); band.castShadow = true; myCrown.add(band);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 8), goldM); sp.position.set(Math.cos(a) * .26, .15, Math.sin(a) * .26); myCrown.add(sp); myCrown.add(ball(toy(['#ff4f9a', '#3d9bff', '#3cc46e', '#a15cff', '#ff9a2e'][k], { r: .1, cc: 1, em: '#ffffff', ei: .1 }), .05, Math.cos(a) * .27, .27, Math.sin(a) * .27)); } }
  // (build 33) the magic wand Princess Luna gives you floats beside you and sparkles (saved)
  const myWand = new THREE.Group(); myWand.userData.dynamic = true; add(myWand); myWand.visible = false;
  { const stick = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .7, 8), toy('#ffffff', { r: .3 })); stick.position.y = .35; myWand.add(stick);
    const star = new THREE.Mesh(starGeometry(.17, .075, .05, .015, 1), toy('#fff3a6', { em: '#ffd23f', ei: .9 })); star.position.y = .78; myWand.add(star); myWand.userData.star = star; }
  function giveWand() {
    const first = !world.wand; world.wand = true;
    Sound.twinkle(); burst(api.player.x, api.player.y + 1.6, api.player.z, ['#b28cff', '#fff3a6', '#9fe6ff', '#fff'], 24, 3);
    if (first) { toast('🪄 A magic wand for you!'); api.saveSoon(); }
  }
  function giveCrown(c) {
    const first = !world.crown; world.crown = true;
    Sound.chime(); burst(api.player.x, api.player.y + 2.4, api.player.z, ['#ffd23f', '#fff3a6', '#ff8fc8', '#fff'], 24, 3);
    if (first) { toast('👑 A crown for you!'); api.saveSoon(); }
  }

  // the dance floor in front of the castle (on the path)
  const tiles = [], TW = 1.5, T0 = K.castle - 7.5, TN = 11, TCOL = ['#ff6fae', '#ffd23f', '#3cc46e', '#3d9bff', '#a15cff', '#ff9a2e'];
  for (let i = 0; i < TN; i++) for (let j = 0; j < 2; j++) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(TW - .08, .06, 1.4, 1, .03), new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#eadbe6').lerp(new THREE.Color(TCOL[(i + j) % TCOL.length]), .22), roughness: .3, clearcoat: .5, clearcoatRoughness: .15, emissive: TCOL[(i + j) % TCOL.length], emissiveIntensity: .05 }) /* (build 19: pearly tinted tiles, not glare-white) */);
    m.position.set(T0 + TW * (i + .5), .03, -.75 + j * 1.5); m.receiveShadow = true; add(m); tiles.push({ m, i, j, glow: 0 });
  }
  let lastTile = -1, danceT = 0;

  // =================== INSIDE THE PRINCESS CASTLE (a throne room, at x 2000) ===================
  const CI = { ox: 2000, w: 24 }; G.castleIn = CI;
  const IC = new THREE.Group(); IC.position.set(CI.ox, 0, 0); add(IC);
  const icTap = (obj, fn, x, disc, hintY = 2) => { tapObj(obj, fn); G.interact.push({ x: CI.ox + x, y: 0, layer: 'castle', disc, run: fn, hintY }); };
  { // checkered floor, carpet, walls, pillars, stained-glass windows
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#ffd1e8' : '#fffaf7'; g.fillRect(x * 64, y * 64, 64, 64); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(CI.w / 2, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(CI.w, 12), new THREE.MeshPhysicalMaterial({ map: t, roughness: .2, clearcoat: 1, clearcoatRoughness: .08 })); fl.rotation.x = -Math.PI / 2; fl.position.set(CI.w / 2, 0, 0); fl.receiveShadow = true; IC.add(fl);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(CI.w - 2, 1.5), toy('#e0457a', { r: .9, cc: 0, sheen: 1, sheenColor: '#ff9fc8' })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(CI.w / 2, .012, 0); carpet.receiveShadow = true; IC.add(carpet);
    // (stage 3: the trim sits 2 cm above the carpet; at 2 mm the two planes flickered)
    for (const z of [-.8, .8]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(CI.w - 2, .12), goldM); b.rotation.x = -Math.PI / 2; b.position.set(CI.w / 2, .022, z); IC.add(b); }
    const backW = new THREE.Mesh(new RoundedBoxGeometry(CI.w + .8, 9.5, .5, 2, .15), toy('#ffe3f1', { r: .6, cc: .3 })); backW.position.set(CI.w / 2, 4.75, -5.8); backW.receiveShadow = true; IC.add(backW);
    const skirting = new THREE.Mesh(new RoundedBoxGeometry(CI.w + .8, .6, .3, 2, .1), trimM); skirting.position.set(CI.w / 2, .3, -5.45); IC.add(skirting);
    for (const x of [-.25, CI.w + .25]) { const sw = new THREE.Mesh(new RoundedBoxGeometry(.5, 9.5, 12, 2, .15), toy('#ffd6ec', { r: .6, cc: .3 })); sw.position.set(x, 4.75, 0); sw.receiveShadow = true; IC.add(sw); }
    const front = new THREE.Mesh(new RoundedBoxGeometry(CI.w + 1, .6, .6, 2, .2), toy('#ffb8de')); front.position.set(CI.w / 2, -.25, 6); IC.add(front);
    for (const x of [3.5, 9, 15, 20.5]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 8.6, 24), trimM); pl.position.set(x, 4.3, -4.9); pl.castShadow = true; pl.receiveShadow = true; IC.add(pl); for (const y of [.2, 8.5]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .35, 24), goldM); cap.position.set(x, y, -4.9); IC.add(cap); } }
    const glass = (cols) => { const cc = document.createElement('canvas'); cc.width = 128; cc.height = 256; const gg = cc.getContext('2d'); gg.fillStyle = '#ffffff'; gg.fillRect(0, 0, 128, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { gg.fillStyle = cols[(x + y * 3) % cols.length]; gg.beginPath(); gg.moveTo(x * 32 + 16, y * 32 + 2); gg.lineTo(x * 32 + 30, y * 32 + 16); gg.lineTo(x * 32 + 16, y * 32 + 30); gg.lineTo(x * 32 + 2, y * 32 + 16); gg.fill(); } const tt = new THREE.CanvasTexture(cc); tt.colorSpace = THREE.SRGBColorSpace; return tt; };
    [[6.2, ['#ff6fae', '#ffd23f', '#9fe6ff', '#b28cff']], [12, ['#b28cff', '#ff8fc8', '#ffffff', '#5bc8ff']], [17.8, ['#3cc46e', '#ffd23f', '#ff6fae', '#9fe6ff']]].forEach(([x, cols]) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2, 4), new THREE.MeshStandardMaterial({ map: glass(cols), emissive: '#ffffff', emissiveMap: glass(cols), emissiveIntensity: .55 })); w.position.set(x, 4.6, -5.53); IC.add(w);
      const top = new THREE.Mesh(new THREE.CircleGeometry(1, 24, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .6 })); top.position.set(x, 6.6, -5.53); IC.add(top);
      const fr = new THREE.Mesh(new THREE.TorusGeometry(1.05, .08, 8, 24, Math.PI), goldM); fr.position.set(x, 6.6, -5.5); IC.add(fr);
    });
  }
  // the way out (a door at the left of the back wall)
  { const d = new THREE.Mesh(new RoundedBoxGeometry(1.7, 2.8, .2, 2, .1), toy('#c870b0', { r: .45, cc: .6 })); d.position.set(1.9, 1.4, -5.5); IC.add(d); IC.add(ball(goldM, .09, 2.5, 1.4, -5.38)); }
  // the throne on a little stage (tap it to sit on the throne)
  const throne = new THREE.Group(); throne.position.set(19.5, 0, -3.3); IC.add(throne);
  { const st1 = new THREE.Mesh(new RoundedBoxGeometry(4, .3, 2.6, 2, .08), toy('#e0457a', { r: .8, sheen: 1 })); st1.position.y = .15; throne.add(st1);
    const st2 = new THREE.Mesh(new RoundedBoxGeometry(3, .3, 2, 2, .08), toy('#e0457a', { r: .8, sheen: 1 })); st2.position.y = .45; throne.add(st2);
    const seat = new THREE.Mesh(new RoundedBoxGeometry(1.3, .35, 1.1, 2, .12), toy('#ff8fc8', { r: .6, sheen: 1 })); seat.position.set(0, .78, 0); throne.add(seat);
    const back = new THREE.Mesh(new RoundedBoxGeometry(1.4, 2.4, .25, 2, .12), goldM); back.position.set(0, 1.9, -.5); throne.add(back);
    const pad = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.9, .1, 2, .08), toy('#ff8fc8', { r: .6, sheen: 1 })); pad.position.set(0, 1.85, -.36); throne.add(pad);
    const tc = new THREE.Mesh(starGeometry(.3, .14, .08, .02, 1), toy('#fff3a6', { em: '#ffd84a', ei: .6 })); tc.position.set(0, 3.25, -.5); throne.add(tc);
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new RoundedBoxGeometry(.2, .6, 1, 2, .08), goldM); arm.position.set(s * .7, 1.15, 0); throne.add(arm); throne.add(ball(goldM, .13, s * .7, 1.5, .45)); }
    throne.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  plat({ a: CI.ox + 17.5, b: CI.ox + 21.5, y: .3, z: -3.3, layer: 'castle', step: true });
  plat({ a: CI.ox + 18, b: CI.ox + 21, y: .6, z: -3.3, layer: 'castle', step: true });
  plat({ a: CI.ox + 18.9, b: CI.ox + 20.1, y: .95, z: -3.3, layer: 'castle' });
  const sitThrone = () => { const P = api.player; if (P.layer !== 'castle' || P.ride) return; P.x = CI.ox + 19.5; P.y = 1.4; P.vx = 0; P.vy = 0; P.grounded = false; Sound.chime(); Sound.withMusic(() => [0, 4, 7, 12].forEach((n, i) => Sound.tone(NOTES[n % 8] * (n > 7 ? 2 : 1), .3, 'triangle', .04, 1, i * .15))); burst(CI.ox + 19.5, 3, -3, ['#ffd23f', '#fff3a6', '#ff8fc8', '#fff'], 26, 3); discover('throne', 'You sit on the royal throne!'); };
  icTap(throne, sitThrone, 19.5, 'throne', 3.9);
  // the crystal chandelier (tap it and it sparkles and spins)
  const chand = new THREE.Group(); chand.position.set(12, 7.3, -1.6); IC.add(chand);
  { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, .08, 8, 36), goldM); ring.rotation.x = Math.PI / 2; chand.add(ring);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.4, 6), goldM); chain.position.y = 1.2; chand.add(chain);
    chand.userData.crystals = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.13), new THREE.MeshPhysicalMaterial({ color: '#e6f8ff', roughness: .02, clearcoat: 1, iridescence: 1, emissive: '#bfe8ff', emissiveIntensity: .2 })); cr.position.set(Math.cos(a) * 1.2, -.3, Math.sin(a) * 1.2); cr.scale.y = 1.6; chand.add(cr); chand.userData.crystals.push(cr); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; chand.add(ball(toy('#fff6b0', { em: '#ffd84a', ei: 1.2 }), .08, Math.cos(a) * 1.2, .2, Math.sin(a) * 1.2)); } }
  let chandSpin = 0;
  icTap(chand, () => { chandSpin = 2.5; Sound.twinkle && Sound.twinkle(); Sound.withMusic(() => [7, 9, 11, 12, 14].forEach((n, i) => Sound.bell(NOTES[n % 8] * 2, .03, i * .1))); burst(CI.ox + 12, 6.5, -1.6, ['#ffffff', '#bfe8ff', '#fff3a6'], 26, 3); discover('chandelier', 'The sparkly chandelier!'); }, 12, 'chandelier', 1.2);
  // the royal party cake (tap: the candles light up; tap again: blow them out)
  const cake = new THREE.Group(); cake.position.set(6.5, 0, -2.8); IC.add(cake);
  const flames = [];
  { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.15, .25, 1, 12), goldM); leg.position.y = .5; cake.add(leg);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .12, 32), trimM); top.position.y = 1.06; cake.add(top);
    [[.8, .45, '#ffd1ec'], [.6, .4, '#ffffff'], [.4, .35, '#ffb8de']].reduce((y, [r, h, c]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), toy(c, { r: .5, cc: .5 })); t.position.y = y + h / 2; cake.add(t); const icing = new THREE.Mesh(new THREE.TorusGeometry(r, .05, 8, 32), toy('#ff6fae', { r: .4 })); icing.rotation.x = Math.PI / 2; icing.position.y = y + h; cake.add(icing); return y + h; }, 1.12);
    for (let i = 0; i < 3; i++) { const x = (i - 1) * .2; const cnd = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .3, 8), toy(['#3d9bff', '#ffd23f', '#3cc46e'][i])); cnd.position.set(x, 2.47, 0); cake.add(cnd); const fl = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffcf4a' })); fl.scale.y = 1.6; fl.position.set(x, 2.7, 0); fl.visible = false; cake.add(fl); flames.push(fl); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cake.add(ball(toy(['#ff4f6e', '#ffffff'][i % 2], { r: .3 }), .06, Math.cos(a) * .62, 1.6, Math.sin(a) * .62)); }
    cake.traverse(o => { if (o.isMesh && o.material.type !== 'MeshBasicMaterial') o.castShadow = true; }); }
  icTap(cake, () => { const lit = !flames[0].visible; flames.forEach(f => { f.visible = lit; }); if (lit) { Sound.withMusic(() => [0, 0, 1, 0, 3, 2].forEach((n, i) => Sound.tone(NOTES[n] , .25, 'triangle', .045, 1, i * .22))); burst(CI.ox + 6.5, 3, -2.8, ['#ff4f9a', '#ffd23f', '#3d9bff', '#3cc46e', '#fff'], 30, 3.5); } else { Sound.whoosh(); burst(CI.ox + 6.5, 2.8, -2.8, ['#ffffff', '#e9dcff'], 12, 1.5); } discover('cake', 'A royal party cake! Tap to light the candles.'); }, 6.5, 'cake', 3.2);
  // a music box with a tiny dancer (tap it: music, and she twirls)
  const mbox = new THREE.Group(); mbox.position.set(13.8, 0, -3.2); IC.add(mbox);
  let dancer, mlid, music = 0;
  { const stand = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .9, 24), trimM); stand.position.y = .45; mbox.add(stand);
    const box = new THREE.Mesh(new RoundedBoxGeometry(1.1, .55, .8, 2, .1), toy('#b28cff', { r: .3, cc: 1 })); box.position.y = 1.18; mbox.add(box);
    mlid = new THREE.Group(); mlid.position.set(0, 1.45, -.4); mbox.add(mlid); const lidM = new THREE.Mesh(new RoundedBoxGeometry(1.12, .12, .82, 2, .05), toy('#ff8fc8', { r: .3, cc: 1 })); lidM.position.z = .41; mlid.add(lidM);
    dancer = new THREE.Group(); dancer.position.set(0, 1.46, 0); mbox.add(dancer);
    const tutu = new THREE.Mesh(new THREE.ConeGeometry(.16, .12, 16), toy('#ffd1ec', { sheen: 1 })); tutu.position.y = .15; tutu.rotation.x = Math.PI; dancer.add(tutu);
    dancer.add(ball(toy('#ffd1ec'), .05, 0, .26, 0, 1, 1.4, 1)); dancer.add(ball(toy('#f6d0b4'), .05, 0, .37, 0)); dancer.add(ball(toy('#8a5530'), .035, 0, .42, -.01));
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .14, 6), toy('#f6d0b4')); leg.position.y = .07; dancer.add(leg);
    mbox.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
  icTap(mbox, () => { music = 4; const tune = [4, 2, 0, 2, 4, 4, 4, 2, 2, 2, 4, 7, 7]; Sound.withMusic(() => tune.forEach((n, i) => Sound.bell(NOTES[n % 8] * 2, .035, i * .28))); discover('musicbox', 'A music box with a tiny dancer!'); }, 13.8, 'musicbox', 2.4);
  // the royal toy chest (tap: the lid pops open and toys bounce out)
  const chest = new THREE.Group(); chest.position.set(23, 0, -2.6); IC.add(chest);
  let clid, toysOut = [];
  { const body = new THREE.Mesh(new RoundedBoxGeometry(1.4, .8, .9, 2, .1), toy('#c48a52', { r: .6, cc: .3 })); body.position.y = .4; chest.add(body);
    for (const x of [-.45, .45]) { const band = new THREE.Mesh(new THREE.BoxGeometry(.1, .82, .92), goldM); band.position.set(x, .4, 0); chest.add(band); }
    clid = new THREE.Group(); clid.position.set(0, .8, -.45); chest.add(clid); const l = new THREE.Mesh(new RoundedBoxGeometry(1.42, .25, .92, 2, .1), toy('#a96f3e', { r: .6, cc: .3 })); l.position.set(0, .12, .46); clid.add(l);
    chest.add(ball(goldM, .08, 0, .7, .47)); chest.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
  let chestOpen = 0;
  icTap(chest, () => { chestOpen = 2.5; Sound.boing(); Sound.giggle();
    for (let i = 0; i < 4; i++) { const kind = (Math.random() * 3) | 0, col = ['#ff4f9a', '#3d9bff', '#ffd23f', '#3cc46e', '#a15cff'][(Math.random() * 5) | 0];
      const m = kind === 0 ? ball(toy(col, { r: .2, cc: 1 }), .16) : kind === 1 ? new THREE.Mesh(starGeometry(.2, .09, .08, .02, 1), toy(col, { em: col, ei: .2 })) : new THREE.Mesh(new RoundedBoxGeometry(.28, .28, .28, 2, .06), toy(col)); m.castShadow = true;
      m.position.set(CI.ox + 23, 1, -2.6); add(m); toysOut.push({ m, vx: (Math.random() - .5) * 3, vy: 4 + Math.random() * 3, vz: 1 + Math.random() * 1.5, life: 3 }); }
    discover('toychest', 'A treasure chest full of toys!'); }, 22.5, 'toychest', 1.8);
  if (!/[?&]nodetail/.test(location.search)) G.castleInteriorDetail = buildCastleInteriorDetail({ add, ox: CI.ox }); // (?nodetail = A/B measurement)
  // getting in and out
  function enterCastle() { const P = api.player; if (P.ride || P.layer !== '' || Math.abs(P.x - K.castle) > 5) { Sound.click(); return; } world.flash = 1; P.layer = 'castle'; P.x = CI.ox + 2.8; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; api.snapCamera(); Sound.chime(); discover('castlein', 'Inside the Princess Castle! Tap the throne, the cake, the music box and the toy chest.'); }
  function leaveCastle() { const P = api.player; if (P.layer !== 'castle' || P.y > .7) { Sound.click(); return; } world.flash = 1; P.layer = ''; P.x = K.castle; P.y = 0; P.z = 0; P.vx = P.vy = 0; api.snapCamera(); Sound.tone(440, .2, 'triangle', .05, .7); }
  G.enterCastle = enterCastle;
  function updateInside(dt, t) {
    chandSpin = Math.max(0, chandSpin - dt); chand.rotation.y += dt * (.15 + chandSpin * 1.5); chand.userData.crystals.forEach((c, i) => { c.material.emissiveIntensity = .2 + (chandSpin > 0 ? (Math.sin(t * 12 + i) * .5 + .5) * 1.2 : 0); });
    flames.forEach((f, i) => { if (f.visible) f.scale.set(1 + Math.sin(t * 20 + i) * .15, 1.6 + Math.sin(t * 17 + i * 2) * .3, 1); });
    music = Math.max(0, music - dt); dancer.rotation.y += dt * (music > 0 ? 6 : 0); mlid.rotation.x += ((music > 0 ? -1.2 : 0) - mlid.rotation.x) * Math.min(1, dt * 6);
    chestOpen = Math.max(0, chestOpen - dt); clid.rotation.x += ((chestOpen > 0 ? -1.4 : 0) - clid.rotation.x) * Math.min(1, dt * 8);
    for (let i = toysOut.length - 1; i >= 0; i--) { const o = toysOut[i]; o.life -= dt; o.vy -= 12 * dt; o.m.position.x += o.vx * dt; o.m.position.z += o.vz * dt; o.m.position.y = Math.max(.16, o.m.position.y + o.vy * dt); if (o.m.position.y <= .16 && o.vy < 0) o.vy *= -.5; o.m.rotation.x += dt * 4; if (o.life <= 0) { o.m.scale.multiplyScalar(.85); if (o.m.scale.x < .05) { scene.remove(o.m); toysOut.splice(i, 1); } } }
  }

  // =================== per-frame ===================
  const V = new THREE.Vector3();
  function update(dt, t, P) {
    if (P.layer === 'castle') updateInside(dt, t);
    // Dottie breathes and hums; her neck slide starts when you walk off the front of her back
    dottie.scale.y = 1; dHead.rotation.z = Math.sin(t * .8) * .06 + (hum > 0 ? Math.sin(hum * 9) * .12 : 0); dHead.position.y = .62 + (hum > 0 ? Math.abs(Math.sin(hum * 4)) * .25 : Math.sin(t * 1.4) * .03); hum = Math.max(0, hum - dt);
    if (P.layer === '' && P.grounded && P.y > .3 && P.x > 369 && P.x < 380 && steps.concat(back).some(s => Math.abs(P.y - s.y) < .02 && P.x >= s.a && P.x <= s.b)) discover('dinoclimb', 'You climbed onto a dinosaur!');
    // eggs wobble and hatch; babies hop
    for (const e of eggs) {
      e.t += dt;
      if (world.dinoEggs[e.i]) { if (!e.baby.visible) showHatched(e); }
      else if (e.wob > 0) { e.wob -= dt; e.egg.rotation.z = Math.sin(e.wob * 30) * .25 * Math.min(1, e.wob * 2); if (e.wob <= 0) { world.dinoEggs[e.i] = true; showHatched(e); e.hop = .6; Sound.chime(); Sound.giggle(); burst(e.x, .7, e.z, ['#fff', '#ffd23f', '#ff8fc8', '#9ff7c8'], 22, 2.5); toast('🦕 A baby dino hatched!'); discover('hatch'); api.saveSoon(); } }
      if (e.baby.visible && world.dinoFollow[e.i] && !e.f) followBaby(e);
      if (e.baby.visible && !e.f) { e.hop = Math.max(0, e.hop - dt); const bob = Math.abs(Math.sin(e.t * 2.4 + e.i)) * .06 + (e.hop > 0 ? Math.sin(e.hop / .7 * Math.PI) * .6 : 0); e.baby.position.y = (e.restY ?? .05) + bob; e.baby.rotation.y = Math.sin(e.t * .9 + e.i * 2) * .6 + (Math.sign(P.x - e.x) || 1) * .4; }
    }
    // the castle door swings open when tapped
    if (G.castleDoor) { const o = G.castleDoor.userData.open || 0; G.castleDoor.userData.open = Math.max(0, o - dt * .6); G.castleDoor.scale.x = 1 - Math.sin(Math.min(1, o) * Math.PI / 2) * .6; }
    flags.forEach((f, k) => { const a = f.geometry.attributes.position, p0 = f.userData.p0; for (let i = 0; i < a.count; i++) { const x = p0[i * 3]; a.setZ(i, Math.sin(t * 5 + x * 5 + k) * .08 * (x + .45)); } a.needsUpdate = true; });
    // fountain sparkles (a gentle trickle, a big spray when Luna waves)
    spray = Math.max(0, spray - dt);
    if (Math.random() < dt * (spray > 0 ? 40 : 3)) burst(fx + (Math.random() - .5) * .3, 2 + (spray > 0 ? 1 : 0), fz, spray > 0 ? ['#9fe6ff', '#ffffff', '#fff3a6', '#b28cff'] : ['#9fe6ff', '#ffffff'], spray > 0 ? 3 : 1, spray > 0 ? 3.2 : 1);
    // crown above your head
    myCrown.visible = !!world.crown && !G.playerHidden; // (build 48: hidden while you sit inside the rocket)
    const pb = G.playerBody, by = pb ? pb.position.y : P.y, sy = pb ? pb.scale.y : 1; /* (build 48: on the whale she is drawn smaller, and the crown floated high above her) */
    if (world.crown) { myCrown.position.set(pb ? pb.position.x : P.x, by + (G.headTop || 2) * sy - .06 + Math.sin(t * 3) * .03, /* (build 62: sits ON the head, not floating above it) */ pb ? pb.position.z : P.z); myCrown.rotation.y = t * .8; }
    // the wand floats at your side and sprinkles a little sparkle as you go
    myWand.visible = !!world.wand && !G.playerHidden;
    if (world.wand) { const f = P.facing || 1; myWand.position.set((pb ? pb.position.x : P.x) - f * .42 * sy, by + .5 * sy + Math.sin(t * 2.4) * .04, (pb ? pb.position.z : P.z) + .3); /* (build 62: held at the side, not floating away) */ myWand.rotation.z = f * .35 + Math.sin(t * 1.7) * .1; myWand.userData.star.rotation.y = t * 2;
      if (Math.abs(P.vx) > 1 && Math.random() < dt * 6) burst(myWand.position.x, myWand.position.y + .8, myWand.position.z, ['#fff3a6', '#b28cff', '#9fe6ff'], 1, .6); }
    // dance floor: the tile under you glows and plays a note; the princesses dance
    let on = -1;
    if (P.layer === '' && P.y < .2 && P.x > T0 && P.x < T0 + TW * TN && Math.abs(P.z) < 1.5) on = Math.floor((P.x - T0) / TW);
    if (on >= 0 && on !== lastTile) { const k = on % 8; Sound.withMusic(() => Sound.bell(NOTES[k] * (on >= 8 ? 2 : 1), .035)); tiles.filter(tl => tl.i === on).forEach(tl => { tl.glow = 1; }); discover('dance', 'A dance floor! Every step plays music!'); }
    lastTile = on; danceT = on >= 0 ? 1.2 : Math.max(0, danceT - dt);
    for (const tl of tiles) { tl.glow = Math.max(on === tl.i ? .6 : 0, tl.glow - dt * 1.5); tl.m.material.emissiveIntensity = .05 + tl.glow * 1.1 + (danceT > 0 ? (Math.sin(t * 6 + tl.i + tl.j * 2) * .5 + .5) * .25 : 0); }
    for (const c of [rosie, luna]) { if (danceT > 0 && c.act <= 0) { c.dance = (c.dance || 0) + dt; c.root.rotation.y = c.dance * 3; c.root.position.y = c.y + Math.abs(Math.sin(c.dance * 6)) * .12; } else c.dance = 0; if (c.parts.skirt) c.parts.skirt.scale.set(1 + (danceT > 0 ? .08 : 0), 1, 1 + (danceT > 0 ? .08 : 0)); }
  }
  return { update, eggs, rosie, luna, tiles, giveCrown, giveWand, wand: myWand, tapEgg, neckPath, back, steps, crown: myCrown, enterCastle, leaveCastle, sitThrone, CI };
}
