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
import { toy, ball, face, starGeometry } from './creatures.js';
import { NOTES } from './audio.js';

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
  // smooth tapering tubes for the neck and the tail
  const taperTube = (pts, r0, r1, seg = 48) => {
    const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, seg, 1, 18, false), pos = geo.attributes.position, P0 = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) { const u = i / seg, c = curve.getPointAt(u), r = r0 + (r1 - r0) * u; for (let j = 0; j <= 18; j++) { const k = i * 19 + j; P0.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, P0.x, P0.y, P0.z); } }
    geo.computeVertexNormals(); return new THREE.Mesh(geo, skin);
  };
  const dottie = new THREE.Group(); add(dottie);
  const bx = K.dino, backY = 3.45;
  dottie.add(ball(skin, 1, bx, 2.1, Z, 2.4, 1.35, 1.15));
  dottie.add(ball(belly, 1, bx, 1.55, Z + .35, 2.0, .85, .85));
  for (const [dx, dy, r] of [[-1.2, 2.9, .28], [.2, 3.15, .34], [1.4, 2.8, .25], [-.4, 2.5, .2], [.9, 2.35, .22]]) dottie.add(ball(spot, r, bx + dx, dy, Z + .95, 1, 1, .35));
  for (const lx of [-1.4, 1.3]) for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.36, .42, 1.5, 20), skin); leg.position.set(bx + lx, .75, Z + s * .55); dottie.add(leg);
    dottie.add(ball(belly, .44, bx + lx, .14, Z + s * .55 + .08, 1, .35, 1));
  }
  // tail = little stairs (walk right onto it and you climb up by yourself)
  const steps = [];
  for (let k = 0; k < 7; k++) {
    const x = 369.95 + k * .85, y = .45 * (k + 1);
    steps.push(plat({ a: x - .43, b: x + .43, y, z: Z, step: true, dino: true }));
  }
  { const pts = [new THREE.Vector3(bx - 1.6, 2.35, Z)]; for (let k = 6; k >= 0; k--) pts.push(new THREE.Vector3(369.95 + k * .85, .45 * (k + 1) - .45, Z)); pts.push(new THREE.Vector3(368.6, .18, Z)); dottie.add(taperTube(pts, .72, .14)); }
  const back = plat({ a: 375.45, b: 379.7, y: backY, z: Z, step: true, dino: true });
  // the neck: a smooth curve from her shoulders down to her head in the flowers (you slide down it)
  const neckPath = new THREE.CatmullRomCurve3([[379.5, backY + .62, Z], [381.2, backY + .25, Z], [382.7, 2.3, Z], [383.9, 1.2, Z + .05], [384.9, .66, Z + .2]].map(p => new THREE.Vector3(...p)));
  (G.slideEdges = G.slideEdges || []).push({ y: backY, x: back.b - .25, path: neckPath, disc: 'dinoslide', msg: 'Wheee! Down Dottie\'s long neck!' });
  { const pts = []; for (let i = 0; i <= 10; i++) { const p = neckPath.getPointAt(i / 10); pts.push(new THREE.Vector3(p.x, p.y - .62 - .42, p.z)); } pts.unshift(new THREE.Vector3(bx + 1.2, 2.4, Z)); dottie.add(taperTube(pts, .78, .42)); }
  for (let i = 1; i < 6; i++) { const p = neckPath.getPointAt(i / 7); const pl = new THREE.Mesh(new THREE.ConeGeometry(.16, .32, 10), plate); pl.position.set(p.x, p.y - .55, p.z - .42); pl.rotation.x = -.5; dottie.add(pl); }
  const dHead = new THREE.Group(); dHead.position.set(385.75, .62, Z + .15); dottie.add(dHead);
  dHead.add(ball(skin, .62, 0, 0, 0, 1.25, .78, .95)); dHead.add(ball(belly, .38, .35, -.18, .2, 1.1, .6, .9));
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
    const bs = toy(kid, { r: .4, cc: .7, sheen: .4 });
    baby.add(ball(bs, .3, 0, .32, 0, 1.1, 1, 1)); const hd = new THREE.Group(); hd.position.set(.18, .72, .05); baby.add(hd); hd.add(ball(bs, .24, 0, 0, 0, 1.15, 1, 1));
    face(hd, { y: .03, z: .21, spread: .09, eyeR: .065, mouthY: -.08 });
    baby.add(ball(bs, .12, -.33, .2, 0, 1.6, .7, .8));
    for (const s of [-1, 1]) baby.add(ball(bs, .08, .06, .05, s * .16, 1, .7, 1.2));
    const shellBits = [0, 1].map(s => { const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 14, 8, 0, Math.PI * 2, s ? Math.PI / 2 : 0, Math.PI / 2), toy(shell, { r: .3, cc: 1, }).clone()); h.material.side = THREE.DoubleSide; h.position.set(x + (s ? .35 : -.35), .15, z + .25); h.scale.set(1, 1.2, 1); h.visible = false; add(h); return h; });
    const e = { i, egg, baby, shellBits, wob: 0, hop: 0, t: Math.random() * 5, x, z };
    egg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.tap = () => tapEgg(e); } }); G.taps.push(egg);
    baby.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.tap = () => tapBaby(e); } }); G.taps.push(baby);
    return e;
  });
  function showHatched(e) { e.egg.visible = false; e.baby.visible = true; e.shellBits.forEach(s => { s.visible = true; }); }
  function tapEgg(e) { if (world.dinoEggs[e.i] || e.wob > 0) return; e.wob = 1.3; Sound.tone(520, .1, 'triangle', .04, 1.2); Sound.tone(560, .1, 'triangle', .04, 1.2, .3); Sound.tone(600, .1, 'triangle', .04, 1.2, .6); discover('dinoegg', 'A dino egg! Tap it to see what is inside!'); }
  world.dinoFollow = Array.isArray(world.dinoFollow) && world.dinoFollow.length === 3 ? world.dinoFollow : [false, false, false];
  function followBaby(e) { e.f = friends.addFollower({ kind: 'dino', root: e.baby, orient: 'x' }); e.f.pos.copy(e.baby.position); }
  function tapBaby(e) {
    if (!world.dinoEggs[e.i]) { tapEgg(e); return; } // (the hidden baby sits inside the egg: a tap there means the egg)
    if (!e.f) { world.dinoFollow[e.i] = true; followBaby(e); Sound.chime(); toast('🦕💖 A baby dino wants to come with you!'); discover('dinofollow', 'Baby dinos follow you when you tap them!'); api.saveSoon(); }
    else friends.followerTrick(e.f);
    e.hop = .7; Sound.tone(900 + e.i * 120, .12, 'sine', .05, 1.5); Sound.tone(1100 + e.i * 120, .1, 'sine', .04, 1.4, .12); burst(e.baby.position.x, 1.1, e.baby.position.z, ['#ff8fc8', '#fff'], 6, 1.2); discover('babydino', 'Baby dinos! They squeak when you tap them.'); }
  G.interact.push({ x: K.nest, y: 0, layer: '', disc: 'dinoegg', run: () => { const e = eggs.find(e2 => !world.dinoEggs[e2.i]); if (e) tapEgg(e); else tapBaby(eggs[Math.floor(Math.random() * 3)]); }, hintY: 1.6 });

  // Tops, a little horned dino (a talking friend)
  friends.TALK.tops = ['🦖💚', '🌿😋', '🦕🎶', '💪😄']; friends.VOICE.tops = 240;
  friends.critter('tops', K.tops, 0, -2.4, r => {
    const sk = toy('#ffb35c', { r: .45, cc: .7, sheen: .3 }), fr = toy('#ff7a9a', { r: .35, cc: .8 }), horn = toy('#fff6e0', { r: .3, cc: 1 });
    r.add(ball(sk, .6, 0, .7, 0, 1.4, .95, 1)); r.add(ball(toy('#ffe2b8', { r: .5 }), .45, .15, .55, .3, 1.2, .7, .6));
    for (const lx of [-.5, .45]) for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.16, .19, .45, 12), sk); l.position.set(lx, .22, s * .38); r.add(l); }
    r.add(ball(sk, .2, -.95, .55, 0, 1.8, .7, .8));
    const head = new THREE.Group(); head.position.set(.95, .95, 0); r.add(head);
    const frill = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .1, 24, 1, false, 0, Math.PI), fr); frill.rotation.set(Math.PI / 2, 0, Math.PI / 2); frill.position.set(-.22, .2, 0); head.add(frill);
    head.add(ball(sk, .42, 0, 0, 0, 1.15, .95, 1));
    for (const [hx, hy, hz, rz] of [[.18, .42, .2, -.4], [.18, .42, -.2, -.4], [.42, .12, 0, -1.1]]) { const h = new THREE.Mesh(new THREE.ConeGeometry(.07, .32, 10), horn); h.position.set(hx, hy, hz); h.rotation.z = rz; head.add(h); }
    face(head, { y: .05, z: .38, spread: .15, eyeR: .085, mouthY: -.15 });
    return { head };
  }, c => { [0, .25].forEach(d => Sound.tone(70, .25, 'sine', .1, .6, d)); burst(c.x, .2, c.z + .4, ['#e8d2a8', '#fff'], 16, 2.5); G.shake = .35; }, 'tops', 'Stomp stomp! Tops the little dino says hi!');

  // a few palm-ish ferns and rocks to make it a valley
  const fern = toy('#4fbf7a', { r: .5, cc: .4, sheen: .4 });
  for (const [x, z, s] of [[358, -4.6, 1], [367.5, -4.8, 1.2], [372.5, -5.4, .9], [383, -5.2, 1.3], [392.5, -4.6, 1]]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.12 * s, .2 * s, 2.6 * s, 10), toy('#b8834e', { r: .7, cc: .1 })); tr.position.set(x, 1.3 * s, z); tr.castShadow = true; add(tr);
    for (let k = 0; k < 6; k++) { const leaf = new THREE.Mesh(new THREE.CapsuleGeometry(.14 * s, 1.1 * s, 4, 8), fern); const a = k / 6 * Math.PI * 2; leaf.position.set(x + Math.cos(a) * .55 * s, 2.55 * s, z + Math.sin(a) * .55 * s); leaf.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); leaf.castShadow = true; add(leaf); }
  }
  for (const [x, z, r] of [[360.5, -3.2, .5], [366.2, -3.6, .35], [388.2, -4, .6], [394.2, -3.3, .4]]) add(ball(toy('#c9b8d8', { r: .8, cc: .1 }), r, x, r * .5, z, 1.3, .8, 1));

  // =================== PRINCESS CASTLE ===================
  const C = new THREE.Group(); C.position.set(K.castle, 0, 0); add(C);
  const wallM = toy('#ffe0f0', { r: .55, cc: .4 }), trimM = toy('#ffffff', { r: .4, cc: .6 }), roofM = toy('#b28cff', { r: .3, cc: 1 }), goldM = toy('#ffd23f', { r: .2, cc: 1, m: .6 });
  { const keep = new THREE.Mesh(new RoundedBoxGeometry(12, 7, 3, 3, .25), wallM); keep.position.set(0, 3.5, -5.6); keep.receiveShadow = true; C.add(keep);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new RoundedBoxGeometry(.8, .7, 1, 2, .12), wallM); b.position.set(-5.4 + i * 1.35, 7.3, -4.6); b.castShadow = true; C.add(b); }
    for (const tx of [-6.6, 6.6]) {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, 9, 32), wallM); tw.position.set(tx, 4.5, -4.9); tw.castShadow = true; tw.receiveShadow = true; C.add(tw);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .14, 10, 32), trimM); ring.rotation.x = Math.PI / 2; ring.position.set(tx, 9, -4.9); C.add(ring);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.4, 32), roofM); roof.position.set(tx, 10.7, -4.9); roof.castShadow = true; C.add(roof);
      C.add(ball(goldM, .16, tx, 12.5, -4.9));
      for (const wy of [3, 6]) { const w = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .6 })); w.position.set(tx, wy, -3.4); C.add(w); }
    }
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 3, 28), wallM); mid.position.set(0, 8.4, -5.6); C.add(mid);
    const mroof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.8, 28), toy('#ff8fc8', { r: .3, cc: 1 })); mroof.position.set(0, 11.3, -5.6); mroof.castShadow = true; C.add(mroof);
    // the big front door (an arch) and glowing windows
    const door = new THREE.Group(); door.position.set(0, 0, -4.05); C.add(door);
    const leaf = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.6, .25, 2, .1), toy('#c870b0', { r: .45, cc: .6 })); leaf.position.y = 1.3; door.add(leaf);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .25, 28, 1, false, -Math.PI / 2, Math.PI), toy('#c870b0', { r: .45, cc: .6 })); arch.rotation.x = Math.PI / 2; arch.position.y = 2.6; door.add(arch);
    door.add(ball(goldM, .1, .8, 1.3, .16)); const hrt = new THREE.Mesh(starGeometry(.35, .17, .06, .02, 1), goldM); hrt.position.set(0, 2.85, .14); door.add(hrt);
    for (const [wx, wy] of [[-3.4, 4.6], [3.4, 4.6], [-3.4, 2], [3.4, 2], [0, 5.4]]) { const w = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.4, .1, 2, .4), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .55 })); w.position.set(wx, wy, -4.08); C.add(w); }
    G.castleDoor = door;
    tapObj(door, () => { door.userData.open = 1.6; Sound.chime(); burst(K.castle, 2, -3.5, ['#ffd23f', '#ff8fc8', '#fff', '#b28cff'], 24, 3); discover('castle', 'The Princess Castle! Dance on the shiny floor!'); });
  }
  // flags on the towers wave
  const flags = [];
  for (const tx of [-6.6, 6.6, 0]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.9, .5, 6, 1), new THREE.MeshStandardMaterial({ color: tx ? '#ff6fae' : '#ffd23f', side: THREE.DoubleSide })); const y = tx ? 13.1 : 13.4, z = tx ? -4.9 : -5.6; const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 6), trimM); pole.position.set(tx, y - .3, z); C.add(pole); f.position.set(tx + .45, y, z); C.add(f); flags.push(f); f.userData.p0 = f.geometry.attributes.position.array.slice(); }
  C.traverse(o => { if (o.isMesh && o.castShadow === false && o.geometry.type !== 'CircleGeometry') o.castShadow = true; });

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
    const prof = [[0, 0], [.72, 0], [.7, .08], [.6, .4], [.45, .8], [.3, 1.1], [.22, 1.25], [0, 1.27]].map(([a, b]) => new THREE.Vector2(a, b));
    const skirt = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), gown); r.add(skirt);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(.7, .05, 8, 32), trim); hem.rotation.x = Math.PI / 2; hem.position.y = .06; r.add(hem);
    const body = ball(gown, .26, 0, 1.38, 0, 1, 1.15, .85); r.add(body);
    for (const s of [-1, 1]) r.add(ball(gown, .14, s * .27, 1.55, 0));
    const head = new THREE.Group(); head.position.y = 1.95; r.add(head);
    head.add(ball(sk, .3, 0, 0, 0, 1, 1.05, 1));
    // hair: a soft round bob with a puff on top
    head.add(ball(hair, .33, 0, .06, -.07, 1.06, 1.05, 1)); head.add(ball(hair, .14, 0, .34, -.05));
    for (const s of [-1, 1]) head.add(ball(hair, .15, s * .26, -.18, -.02, 1, 1.4, 1));
    face(head, { y: 0, z: .27, spread: .11, eyeR: .07, mouthY: -.12 });
    // little crown
    const crown = new THREE.Group(); crown.position.set(0, .34, .02); head.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.17, .19, .09, 18, 1, true), goldM); band.material = goldM; crown.add(band);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(.04, .14, 6), goldM); sp.position.set(Math.cos(a) * .17, .1, Math.sin(a) * .17); crown.add(sp); }
    crown.add(ball(toy(trimC, { em: trimC, ei: .3 }), .05, 0, .02, .19));
    // arms (the right one waves; the left holds a wand or a rose)
    const arm = new THREE.Group(); arm.position.set(.3, 1.55, 0); r.add(arm); arm.add(ball(sk, .07, 0, .24, 0, 1, 3.2, 1)); arm.add(ball(sk, .07, 0, .48, 0));
    const larm = new THREE.Group(); larm.position.set(-.3, 1.5, .05); larm.rotation.z = -.5; r.add(larm); larm.add(ball(sk, .07, 0, -.22, 0, 1, 3, 1));
    if (wandOrRose === 'wand') { const w = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .5, 6), trim); w.position.set(-.05, -.5, .15); larm.add(w); const st = new THREE.Mesh(starGeometry(.12, .05, .03, .01, 1), toy('#fff3a6', { em: '#ffe36e', ei: .9 })); st.position.set(-.05, -.25, .15); larm.add(st); }
    else { larm.add(ball(toy('#ff4f6e', { r: .4, cc: .8 }), .09, 0, -.45, .1)); }
    return { head, arm, skirt };
  }, c => (kind === 'rosie' ? giveCrown(c) : (fountainSpray(), burst(c.x, 2, c.z + .4, ['#fff3a6', '#b28cff', '#fff'], 18, 2.5))), kind, kind === 'rosie' ? 'Princess Rosie gives you a golden crown!' : 'Princess Luna waves her magic wand!');
  friends.TALK.rosie = ['👑✨', '💖😊', '🌹👋', '💃🎶']; friends.VOICE.rosie = 760;
  friends.TALK.luna = ['🌙⭐', '✨🪄', '⛲💦', '💃🎶']; friends.VOICE.luna = 660;
  const rosie = princess('rosie', K.castle - 4.2, '#ff8fc8', '#ffd23f', '#f6d0b4', '#8a5530', 'rose');
  const luna = princess('luna', K.castle + 6.6, '#a98bff', '#9fe6ff', '#b97f5c', '#2b1d2c', 'wand');

  // the crown she gives you floats above your head (saved)
  const myCrown = new THREE.Group(); add(myCrown); myCrown.visible = false;
  { const band = new THREE.Mesh(new THREE.CylinderGeometry(.26, .29, .14, 22, 1, true), goldM); band.castShadow = true; myCrown.add(band);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 8), goldM); sp.position.set(Math.cos(a) * .26, .15, Math.sin(a) * .26); myCrown.add(sp); myCrown.add(ball(toy(['#ff4f9a', '#3d9bff', '#3cc46e', '#a15cff', '#ff9a2e'][k], { r: .1, cc: 1, em: '#ffffff', ei: .1 }), .05, Math.cos(a) * .27, .27, Math.sin(a) * .27)); } }
  function giveCrown(c) {
    const first = !world.crown; world.crown = true;
    Sound.chime(); burst(api.player.x, api.player.y + 2.4, api.player.z, ['#ffd23f', '#fff3a6', '#ff8fc8', '#fff'], 24, 3);
    if (first) { toast('👑 A crown for you!'); api.saveSoon(); }
  }

  // the dance floor in front of the castle (on the path)
  const tiles = [], TW = 1.5, T0 = K.castle - 7.5, TN = 11, TCOL = ['#ff6fae', '#ffd23f', '#3cc46e', '#3d9bff', '#a15cff', '#ff9a2e'];
  for (let i = 0; i < TN; i++) for (let j = 0; j < 2; j++) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(TW - .08, .06, 1.4, 1, .03), new THREE.MeshPhysicalMaterial({ color: '#fff2fb', roughness: .15, clearcoat: 1, emissive: TCOL[(i + j) % TCOL.length], emissiveIntensity: .05 }));
    m.position.set(T0 + TW * (i + .5), .03, -.75 + j * 1.5); m.receiveShadow = true; add(m); tiles.push({ m, i, j, glow: 0 });
  }
  let lastTile = -1, danceT = 0;

  // =================== per-frame ===================
  const V = new THREE.Vector3();
  function update(dt, t, P) {
    // Dottie breathes and hums; her neck slide starts when you walk off the front of her back
    dottie.scale.y = 1; dHead.rotation.z = Math.sin(t * .8) * .06 + (hum > 0 ? Math.sin(hum * 9) * .12 : 0); dHead.position.y = .62 + (hum > 0 ? Math.abs(Math.sin(hum * 4)) * .25 : Math.sin(t * 1.4) * .03); hum = Math.max(0, hum - dt);
    if (P.layer === '' && P.grounded && P.y > .3 && P.x > 369 && P.x < 380 && steps.concat(back).some(s => Math.abs(P.y - s.y) < .02 && P.x >= s.a && P.x <= s.b)) discover('dinoclimb', 'You climbed onto a dinosaur!');
    // eggs wobble and hatch; babies hop
    for (const e of eggs) {
      e.t += dt;
      if (world.dinoEggs[e.i]) { if (!e.baby.visible) showHatched(e); }
      else if (e.wob > 0) { e.wob -= dt; e.egg.rotation.z = Math.sin(e.wob * 30) * .25 * Math.min(1, e.wob * 2); if (e.wob <= 0) { world.dinoEggs[e.i] = true; showHatched(e); e.hop = .6; Sound.chime(); Sound.giggle(); burst(e.x, .7, e.z, ['#fff', '#ffd23f', '#ff8fc8', '#9ff7c8'], 22, 2.5); toast('🦕 A baby dino hatched!'); discover('hatch'); api.saveSoon(); } }
      if (e.baby.visible && world.dinoFollow[e.i] && !e.f) followBaby(e);
      if (e.baby.visible && !e.f) { e.hop = Math.max(0, e.hop - dt); const bob = Math.abs(Math.sin(e.t * 2.4 + e.i)) * .06 + (e.hop > 0 ? Math.sin(e.hop / .7 * Math.PI) * .6 : 0); e.baby.position.y = .05 + bob; e.baby.rotation.y = Math.sin(e.t * .9 + e.i * 2) * .6 + (Math.sign(P.x - e.x) || 1) * .4; }
    }
    // the castle door swings open when tapped
    if (G.castleDoor) { const o = G.castleDoor.userData.open || 0; G.castleDoor.userData.open = Math.max(0, o - dt * .6); G.castleDoor.scale.x = 1 - Math.sin(Math.min(1, o) * Math.PI / 2) * .6; }
    flags.forEach((f, k) => { const a = f.geometry.attributes.position, p0 = f.userData.p0; for (let i = 0; i < a.count; i++) { const x = p0[i * 3]; a.setZ(i, Math.sin(t * 5 + x * 5 + k) * .08 * (x + .45)); } a.needsUpdate = true; });
    // fountain sparkles (a gentle trickle, a big spray when Luna waves)
    spray = Math.max(0, spray - dt);
    if (Math.random() < dt * (spray > 0 ? 40 : 3)) burst(fx + (Math.random() - .5) * .3, 2 + (spray > 0 ? 1 : 0), fz, spray > 0 ? ['#9fe6ff', '#ffffff', '#fff3a6', '#b28cff'] : ['#9fe6ff', '#ffffff'], spray > 0 ? 3 : 1, spray > 0 ? 3.2 : 1);
    // crown above your head
    myCrown.visible = !!world.crown;
    if (world.crown) { myCrown.position.set(P.x, P.y + (G.headTop || 2) + .22 + Math.sin(t * 3) * .05, P.z); myCrown.rotation.y = t * .8; }
    // dance floor: the tile under you glows and plays a note; the princesses dance
    let on = -1;
    if (P.layer === '' && P.y < .2 && P.x > T0 && P.x < T0 + TW * TN && Math.abs(P.z) < 1.5) on = Math.floor((P.x - T0) / TW);
    if (on >= 0 && on !== lastTile) { const k = on % 8; Sound.bell(NOTES[k] * (on >= 8 ? 2 : 1), .035); tiles.filter(tl => tl.i === on).forEach(tl => { tl.glow = 1; }); discover('dance', 'A dance floor! Every step plays music!'); }
    lastTile = on; danceT = on >= 0 ? 1.2 : Math.max(0, danceT - dt);
    for (const tl of tiles) { tl.glow = Math.max(on === tl.i ? .6 : 0, tl.glow - dt * 1.5); tl.m.material.emissiveIntensity = .05 + tl.glow * 1.1 + (danceT > 0 ? (Math.sin(t * 6 + tl.i + tl.j * 2) * .5 + .5) * .25 : 0); }
    for (const c of [rosie, luna]) { if (danceT > 0 && c.act <= 0) { c.dance = (c.dance || 0) + dt; c.root.rotation.y = c.dance * 3; c.root.position.y = c.y + Math.abs(Math.sin(c.dance * 6)) * .12; } else c.dance = 0; if (c.parts.skirt) c.parts.skirt.scale.set(1 + (danceT > 0 ? .08 : 0), 1, 1 + (danceT > 0 ? .08 : 0)); }
  }
  return { update, eggs, rosie, luna, tiles, giveCrown, tapEgg, neckPath, back, steps, crown: myCrown };
}
