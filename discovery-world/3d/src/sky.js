// ===================================================================
// sky.js: 3D build 6, THE CLOUD KINGDOM above the Playhouse and Studio.
//   • A rope ladder (next to the climbing blocks) climbs up into the sky:
//     slide your finger up/down (or tap JUMP) to climb.
//   • A long fluffy cloud path, bouncy cloud puffs up to two high clouds,
//     a rainbow castle, a giant friendly sky whale and star bits.
//   • A giant corkscrew rainbow slide spirals all the way back down to the
//     floor by the xylophone.
// ===================================================================
import * as THREE from 'three';
import { toy, ball, face } from './creatures.js';
import { RAINBOW } from './world.js';

export const SKY = { y: 9.5, z: -1.4, a: 45.6, b: 66.8, ladder: { x: 46.2, z: -.75, top: 9.5 }, high: 13.5 };

export function buildSky(G) {
  const { scene } = G;
  const add = (o, p = scene) => { p.add(o); return o; };
  const plat = (a, b, y, o = {}) => { const p = { a, b, y, layer: '', ...o }; G.platforms.push(p); return p; };
  const cloudMat = toy('#ffffff', { r: .75, cc: .1, sheen: 1, sheenColor: '#ffe6fb', em: '#fff4fb', ei: .18 });
  const puffG = new THREE.SphereGeometry(1, 20, 14);
  function cloud(x0, x1, y, z, depth = 1.6, tint) {
    const mat = tint ? toy(tint, { r: .7, cc: .1, sheen: 1, em: tint, ei: .15 }) : cloudMat;
    const n = Math.max(3, Math.round((x1 - x0) / .9));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, r = .55 + ((i * 37) % 7) * .06;
      const m = new THREE.Mesh(puffG, mat); m.scale.set(r * 1.25, r * .8, depth * .6); m.position.set(x, y - r * .45, z + Math.sin(i * 1.7) * .2); m.receiveShadow = true; m.castShadow = true; add(m);
      if (i % 2) { const m2 = new THREE.Mesh(puffG, mat); m2.scale.set(r * .9, r * .6, depth * .45); m2.position.set(x + .3, y - r * .1, z - .5); add(m2); }
    }
  }

  // ---------- rope ladder ----------
  const L = SKY.ladder, rope = toy('#c8925a', { r: .8, cc: 0 }), rung = toy('#ffd84a', { r: .4 });
  for (const dx of [-.42, .42]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, L.top + .6, 8), rope); r.position.set(L.x + dx, (L.top + .6) / 2, L.z - .2); r.castShadow = true; add(r); }
  for (let y = .45; y < L.top + .3; y += .45) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .9, 8), rung); r.rotation.z = Math.PI / 2; r.position.set(L.x, y, L.z - .2); r.castShadow = true; add(r); }
  G.interact.push({ x: L.x, y: 0, layer: '', disc: 'ladder', run: () => G.startClimb(true), hintY: 3 });

  // ---------- the cloud path and high clouds ----------
  cloud(SKY.a, SKY.b, SKY.y, SKY.z, 1.8); plat(SKY.a, SKY.b, SKY.y, { z: SKY.z, sky: true });
  cloud(49.6, 54.2, SKY.high, -1.9, 1.5, '#fff0fb'); plat(49.6, 54.2, SKY.high, { z: -1.9 });
  cloud(57.6, 62.2, SKY.high, -1.9, 1.5, '#f0f7ff'); plat(57.6, 62.2, SKY.high, { z: -1.9 });
  // bouncy cloud puffs (pink and blue) bounce you up to the high clouds
  G.skyPuffs = [];
  for (const [x, c] of [[51.9, '#ffb8dc'], [59.9, '#b8e4ff']]) {
    const m = new THREE.Mesh(puffG, toy(c, { r: .6, sheen: 1, em: c, ei: .25 })); m.scale.set(.9, .45, .8); m.position.set(x, SKY.y + .25, SKY.z + .2); m.castShadow = true; add(m);
    plat(x - .8, x + .8, SKY.y + .45, { pad: true, top: m, bounce: 12.5, step: true, z: SKY.z }); G.skyPuffs.push(m);
  }
  // little floating clouds around for depth
  for (let i = 0; i < 10; i++) cloud(30 + i * 7, 32 + i * 7, 11 + (i % 3) * 2.5, -8 - (i % 2) * 3, 1.2);

  // ---------- rainbow castle ----------
  const cz = -3.6, castle = new THREE.Group(); add(castle);
  const wallM = toy('#ffe6f6', { r: .5, cc: .5 }), roofs = ['#a15cff', '#ff6fae', '#7fb8ff'];
  [[63.2, 2.2, .7], [65.2, 3.1, .85], [67.1, 2.4, .7]].forEach(([x, h, r], i) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 20), wallM); t.position.set(x, SKY.y + h / 2, cz); t.castShadow = true; castle.add(t);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.3, 1.3, 20), toy(roofs[i], { cc: .8 })); roof.position.set(x, SKY.y + h + .65, cz); roof.castShadow = true; castle.add(roof);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(.5, .3), new THREE.MeshStandardMaterial({ color: RAINBOW[i * 2], side: THREE.DoubleSide })); flag.position.set(x + .25, SKY.y + h + 1.55, cz); castle.add(flag);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .6, 6), toy('#ffd84a')); pole.position.set(x, SKY.y + h + 1.45, cz); castle.add(pole);
    for (let w = 0; w < 2; w++) { const win = new THREE.Mesh(new THREE.CircleGeometry(.16, 16), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .8 })); win.position.set(x, SKY.y + .9 + w * .9, cz + r + .01); castle.add(win); }
  });
  { const gate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, .9), wallM); gate.position.set(64.2, SKY.y + .8, cz + .3); castle.add(gate); const door = new THREE.Mesh(new THREE.CircleGeometry(.5, 20, 0, Math.PI), toy('#a15cff')); door.position.set(64.2, SKY.y + .02, cz + .76); castle.add(door); }
  for (let i = 0; i < 6; i++) { const arc = new THREE.Mesh(new THREE.TorusGeometry(3.4 - i * .22, .1, 10, 40, Math.PI), toy(RAINBOW[i], { em: RAINBOW[i], ei: .2 })); arc.position.set(65.2, SKY.y, cz - 1.2); add(arc); }

  // ---------- the friendly sky whale ----------
  const whale = new THREE.Group(); whale.position.set(56, SKY.y + 1.9, -7.5); /* (build 21: lower, between the cloud floor and the high clouds, so the whale swims in view instead of hiding behind the top of the screen) */ add(whale);
  const wm = toy('#8fb8ff', { r: .4, cc: .8 }), wb = toy('#e6f0ff', { r: .45 });
  whale.add(ball(wm, 2, 0, 0, 0, 1.6, .9, .9)); whale.add(ball(wb, 1.6, .3, -.45, .5, 1.5, .6, .6));
  const tail = new THREE.Group(); tail.position.set(-3.1, .2, 0); whale.add(tail);
  for (const s of [-1, 1]) tail.add(ball(wm, .6, -.3, .25 * s, 0, 1.1, .35, .9));
  for (const s of [-1, 1]) whale.add(ball(wm, .45, .6, -.9, s * 1.4, 1.2, .3, .7));
  const head = new THREE.Group(); head.position.set(2.2, .15, 1.1); whale.add(head);
  face(head, { y: .2, z: 0, spread: .45, eyeR: .22, mouthY: -.35 });
  whale.traverse(o => { if (o.isMesh) o.castShadow = true; });
  G.whale = { g: whale, tail, spout: 0, x: 56, y: SKY.y + 1.9 };
  whale.traverse(o => { if (o.isMesh) o.userData.tap = () => G.tapWhale(); }); G.taps.push(whale);
  G.interact.push({ x: 56, y: SKY.y, layer: '', disc: 'whale', run: () => G.tapWhale(), hintY: 3.2 });

  // ---------- the giant corkscrew rainbow slide back down ----------
  const pts = [[SKY.b - .1, SKY.y + .5, SKY.z], [68.2, SKY.y + .1, SKY.z - .5]];
  const cx = 70.6, cz2 = -2.8, R = 1.7, turns = 2.25, steps = 26;
  for (let i = 0; i <= steps; i++) { const k = i / steps, a = Math.PI + k * turns * Math.PI * 2; pts.push([cx + Math.cos(a) * R, SKY.y - .6 - k * (SKY.y - 1.4), cz2 + Math.sin(a) * R]); }
  pts.push([72.3, .55, -.9], [73.0, .5, -.4]);
  G.skySlide = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .3);
  const N = 260, geo = new THREE.TubeGeometry(G.skySlide, N, .85, 20, false);
  { const cols = [], c = new THREE.Color(), segs = 21; for (let i = 0; i <= N; i++) { c.set(RAINBOW[Math.floor(i / N * 7.999) % 8]); for (let j = 0; j < segs; j++) cols.push(c.r, c.g, c.b); } geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); }
  const slide = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, opacity: .55, roughness: .08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  slide.renderOrder = 2; add(slide);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, SKY.y + .6, 16), toy('#ffffff')); pole.position.set(cx, (SKY.y + .6) / 2, cz2); pole.castShadow = true; add(pole);
  slide.traverse(o => { o.userData.tap = () => G.startSkySlide(); }); G.taps.push(slide);
  G.interact.push({ x: SKY.b - .6, y: SKY.y, layer: '', disc: 'skyslide', run: () => G.startSkySlide(), hintY: 2.4 });

  // ---------- star bits in the sky ----------
  for (let i = 0; i < 10; i++) G.bitSpots.push([47 + i * 2, SKY.y + 1.1]);
  for (let i = 0; i < 4; i++) G.bitSpots.push([50.3 + i * 1.1, SKY.high + 1.1]);
  for (let i = 0; i < 4; i++) G.bitSpots.push([58.3 + i * 1.1, SKY.high + 1.1]);
  for (let i = 0; i < 5; i++) G.bitSpots.push([L.x, 2 + i * 1.5]);
}
