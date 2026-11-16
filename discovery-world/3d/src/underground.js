// ===================================================================
// underground.js: the SECRET UNDERGROUND under the Playhouse.
// Part of the ball pit is a deep shaft full of balls: walk in (or press
// PAW / the arrow bubble) and you sink; JUMP swims up. At the bottom it
// opens into the underground:
//   Cave Hall (a glowing bounce-mushroom pops you back up into the shaft)
//   → Crystal Cave (singing crystals) → a low Crawl Tunnel (you crawl!)
//   → Gem Room (a lost Fluffkin, sparkly gems, rocky ledges)
//   → the Glass Lift, which rides up to the Studio floor (and back down).
// It is the same world (directly below the floor), seen as a cut-away.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toy } from './creatures.js';
import { NOTES } from './audio.js';
import { RAINBOW } from './world.js';

export const UG = {
  ceil: -1.6, floor: -6, x0: 2, x1: 57,
  shaft: [10.8, 14.4], shaftZ: 1.2, swimBottom: -2.4,
  tunnel: [30, 36.5], tunnelCeil: -4.75,
  lift: 53.4, liftZ: -2.4,
};
export const inShaftX = x => x > UG.shaft[0] && x < UG.shaft[1];

export function buildUnderground(G) {
  const { scene } = G;
  const add = (m, parent = scene) => { parent.add(m); return m; };
  const mats = {};
  const M = (c, o) => mats[c + JSON.stringify(o || {})] || (mats[c + JSON.stringify(o || {})] = toy(c, o));
  function box(x0, x1, y0, y1, z0, z1, color, o = {}) {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const m = new THREE.Mesh(o.round ? new RoundedBoxGeometry(w, h, d, 2, Math.min(o.round, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), o.mat || M(color, o.m || { r: .8, cc: .1 }));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = !!o.cast; return add(m, o.parent);
  }
  const sph = (x, y, z, r, color, o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), o.mat || M(color, o.m)); m.position.set(x, y, z); m.castShadow = !!o.cast; return add(m); };
  const plat = (a, b, y, o = {}) => { const p = { a, b, y, layer: '', ...o }; G.platforms.push(p); return p; };
  const solid = (a, b, top, bottom) => G.solids.push({ a, b, top, bottom, layer: '' });
  const tap = (obj, fn, o = {}) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); if (o.paw) G.interact.push({ x: o.paw[0], y: o.paw[1], layer: '', disc: o.disc, run: fn, hintY: o.hintY ?? 2 }); return obj; };

  // ---------- the earth between the floor and the underground (cut away at the front) ----------
  const earth = M('#8a4f9e', { r: .9, cc: 0 }), earthTop = M('#6b3a80', { r: .9, cc: 0 });
  const [s0, s1] = UG.shaft, L = UG.lift;
  const slab = (x0, x1, z0, z1) => box(x0, x1, UG.ceil, -.02, z0, z1, '', { mat: earth });
  slab(-2, s0, -6.5, UG.shaftZ); slab(s1, L - .8, -6.5, UG.shaftZ); slab(L + .8, 58, -6.5, UG.shaftZ);
  slab(s0, s1, -6.5, -UG.shaftZ); slab(L - .8, L + .8, -6.5, -3.2); slab(L - .8, L + .8, -1.6, UG.shaftZ);
  // a band of soil along the front edge, so the ground has thickness (stripes of rock)
  for (let i = 0; i < 4; i++) box(-2, 58, UG.ceil + i * .4, UG.ceil + i * .4 + .2, UG.shaftZ - .02, UG.shaftZ, '', { mat: M(['#a8669e', '#9a5a92', '#b57aa8', '#8f4f88'][i], { r: .9, cc: 0 }) });
  // floor, back wall, end walls
  box(UG.x0 - 1, UG.x1 + 1, UG.floor - .6, UG.floor, -6.5, 4, '', { mat: M('#6a3f8f', { r: .6, cc: .4 }) });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(UG.x1 - UG.x0 + 2, 10.5), new THREE.MeshPhysicalMaterial({ color: '#8d62c4', roughness: .45, clearcoat: .6 }));
  fl.rotation.x = -Math.PI / 2; fl.position.set((UG.x0 + UG.x1) / 2, UG.floor + .005, -1.25); fl.receiveShadow = true; add(fl);
  box(UG.x0 - 1, UG.x1 + 1, UG.floor, UG.ceil, -6.5, -5.9, '', { mat: M('#4a2a70', { r: .9, cc: .1 }) });
  // thick earth at both ends (so you never see out of the caves)
  box(UG.x0 - 12, UG.x0, UG.floor - .6, -.02, -6.5, UG.shaftZ, '', { mat: earth }); box(UG.x1, UG.x1 + 12, UG.floor - .6, -.02, -6.5, UG.shaftZ, '', { mat: earth });
  box(UG.x0 - 12, UG.x1 + 12, UG.floor - 3, UG.floor - .6, -6.5, 4, '', { mat: earth });
  // glowing pebbles and dots on the back wall
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.2 }), 140);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < 140; i++) { m4.makeTranslation(UG.x0 + (i * 7.31) % (UG.x1 - UG.x0), UG.floor + .5 + (i * 2.17) % 3.8, -5.85); dots.setMatrixAt(i, m4); dots.setColorAt(i, col.set(['#9fe6ff', '#ff9fd8', '#c9a6ff', '#fff3a6'][i % 4])); }
  add(dots);
  // warm lanterns + coloured lights
  for (const [x, c] of [[6, '#ffd9a0'], [16, '#ff9fd8'], [24, '#9fe6ff'], [33, '#ffe2a0'], [43, '#c9a6ff'], [53, '#9ff7e0']]) {
    const l = new THREE.PointLight(c, 22, 13, 1.6); l.userData.zone = 'under'; l.position.set(x, UG.floor + 3.2, 1); add(l);
    const lantern = sph(x, UG.ceil - .5, -1.5, .25, '#fff3a6', { m: { em: c, ei: 1.4 } });
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .4, 6), M('#5b2f8a')); cord.position.set(x, UG.ceil - .2, -1.5); add(cord);
    void lantern;
  }

  // ---------- the deep ball shaft ----------
  const pink = M('#ff65b5', { r: .4, cc: .6 });
  box(s0 - .2, s0, UG.swimBottom, 0, -UG.shaftZ, UG.shaftZ, '', { mat: pink }); box(s1, s1 + .2, UG.swimBottom, 0, -UG.shaftZ, UG.shaftZ, '', { mat: pink });
  box(s0, s1, UG.swimBottom, 0, -UG.shaftZ - .2, -UG.shaftZ, '', { mat: M('#ff9fd2', { r: .5, cc: .4 }) });
  solid(s0 - .2, s0, 0, UG.swimBottom); solid(s1, s1 + .2, 0, UG.swimBottom);
  // a sparkly ring marks the deep part from above
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .07, 10, 48), M('#ffd84a', { em: '#ffd84a', ei: .9 })); ring.rotation.x = Math.PI / 2; ring.position.set((s0 + s1) / 2, 1.05, 0); add(ring);
  G.diveRing = ring;
  // ---------- CAVE HALL: a pile of spilled balls and the bounce mushroom back up ----------
  const sx = (s0 + s1) / 2;
  for (let i = 0; i < 26; i++) sph(sx - 2.2 + (i * .53) % 4.4, UG.floor + .22 + (i % 3) * .18, -1.4 + (i * .37) % 1.2, .22, ['#65dcec', '#ffda68', '#b587ff', '#ff67ab', '#7be08a'][i % 5], { m: { r: .25, cc: 1 } });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, .7, 16), M('#fff3e0')); stem.position.set(sx, UG.floor + .35, 0); add(stem);
  const cap = sph(sx, UG.floor + .75, 0, .95, '#7fe0ff', { m: { em: '#3fb8e0', ei: .5, r: .3 } }); cap.scale.y = .45;
  for (let i = 0; i < 6; i++) sph(sx + Math.cos(i) * .6, UG.floor + .95, Math.sin(i) * .6, .12, '#ffffff', { m: { em: '#ffffff', ei: .6 } });
  plat(sx - .95, sx + .95, UG.floor + 1.0, { pad: true, top: cap, bounce: 13.5, step: false, upShaft: true });
  solid(sx - .95, sx + .95, UG.floor + 1.0, UG.floor);
  G.interact.push({ x: sx, y: UG.floor, layer: '', disc: 'mushroomup', run: () => G.bounceUp(), hintY: 2.2 });

  // ---------- CRYSTAL CAVE: crystals that sing ----------
  G.crystals = [];
  const cg = new THREE.OctahedronGeometry(1, 0);
  [[19.5, 1.4, '#9fe6ff'], [21, 2.1, '#ff9fd8'], [22.6, 1.6, '#c9a6ff'], [24.2, 2.6, '#9ff7c8'], [25.8, 1.8, '#ffe066'], [27.4, 2.3, '#ff9a6b'], [28.9, 1.5, '#7fb8ff']].forEach(([x, h, c], i) => {
    const m = new THREE.Mesh(cg, new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: .25, roughness: .05, clearcoat: 1, transparent: true, opacity: .85, iridescence: .8 }));
    m.scale.set(.42, h / 2, .42); m.position.set(x, UG.floor + h / 2, -1.6 + (i % 2) * .4); m.castShadow = true; add(m);
    const k = { x, m, i, lit: 0, cd: 0, c };
    G.crystals.push(k); tap(m, () => G.singCrystal(k));
  });
  G.interact.push({ x: 24.2, y: UG.floor, layer: '', disc: 'crystal', run: () => G.singCrystal(G.crystals[3]), hintY: 3 });

  // ---------- CRAWL TUNNEL: a low ceiling, so you crawl ----------
  const [t0, t1] = UG.tunnel;
  box(t0, t1, UG.tunnelCeil, UG.ceil, -6.5, UG.shaftZ, '', { mat: earth });
  solid(t0, t1, UG.ceil, -4.55); // you can't jump into the tunnel roof; on the floor you crawl in
  box(t0 - .1, t1 + .1, UG.tunnelCeil - .2, UG.tunnelCeil, -2, UG.shaftZ + .1, '', { mat: M('#ffb8dc', { r: .5, cc: .4 }), round: .1 });
  for (let x = t0 + .5; x < t1; x += 1.3) { const r = new THREE.Mesh(new THREE.TorusGeometry(.75, .06, 8, 24, Math.PI), M('#ffd84a', { em: '#ffb000', ei: .4 })); r.position.set(x, UG.floor, -1.3); add(r); }
  // ---------- GEM ROOM: sparkly gems on rock ledges ----------
  G.gems = [];
  const gemG = new THREE.OctahedronGeometry(.32, 0);
  [[39, UG.floor + 1.2], [40.6, UG.floor + 1.2], [46.5, UG.floor + 2.2], [48, UG.floor + 2.2], [42.5, UG.floor + .5], [50, UG.floor + .5]].forEach(([x, y], i) => {
    const g = new THREE.Mesh(gemG, new THREE.MeshPhysicalMaterial({ color: RAINBOW[i], emissive: RAINBOW[i], emissiveIntensity: .45, roughness: .05, clearcoat: 1 }));
    g.position.set(x, y + .45, -.6); g.castShadow = true; add(g); const k = { g, x, y, i, spin: 0 }; G.gems.push(k); tap(g, () => G.tapGem(k));
  });
  // rock ledges (hop up the low one, jump to the high one)
  box(38.2, 41.4, UG.floor, UG.floor + 1.2, -2, .6, '', { mat: M('#b57ad8', { r: .5, cc: .3 }), round: .2, cast: true }); plat(38.2, 41.4, UG.floor + 1.2, { z: -.4 }); solid(38.2, 41.4, UG.floor + 1.2, UG.floor);
  box(45.6, 48.8, UG.floor + 1.8, UG.floor + 2.2, -2, .6, '', { mat: M('#c99ae8', { r: .5, cc: .3 }), round: .15, cast: true }); plat(45.6, 48.8, UG.floor + 2.2, { z: -.4 });
  G.interact.push({ x: 42.5, y: UG.floor, layer: '', disc: 'gem', run: () => G.tapGem(G.gems[4]), hintY: 1.8 });

  // ---------- GLASS LIFT up to the Studio ----------
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, -UG.floor + 2.6, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: '#e6f8ff', transparent: true, opacity: .22, roughness: .03, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  tube.position.set(L, (UG.floor + 2.6) / 2, UG.liftZ); add(tube);
  for (const y of [UG.floor + .05, 2.55]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.88, .08, 10, 32), M('#ffd84a')); r.rotation.x = Math.PI / 2; r.position.set(L, y, UG.liftZ); add(r); }
  const liftPad = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .14, 28), M('#ff65b5', { em: '#ff65b5', ei: .25 })); liftPad.position.set(L, -.07, UG.liftZ); liftPad.castShadow = true; add(liftPad);
  G.liftPad = liftPad;
  tap(liftPad, () => G.useLift());
  G.interact.push({ x: L, y: 0, layer: '', disc: 'liftdown', run: () => G.useLift(), hintY: 3 });
  G.interact.push({ x: L, y: UG.floor, layer: '', disc: 'liftup', run: () => G.useLift(), hintY: 2.6 });

  // ---------- star bits down here ----------
  const bits = [];
  for (let i = 0; i < 5; i++) bits.push([4 + i * 1.1, UG.floor + 1]);
  for (let i = 0; i < 6; i++) bits.push([t0 + .6 + i * 1.1, UG.floor + .5]); // through the crawl tunnel
  for (let i = 0; i < 4; i++) bits.push([45.9 + i * .9, UG.floor + 3.0]);
  for (let i = 0; i < 4; i++) bits.push([19 + i * 3.3, UG.floor + 3.2]);
  G.bitSpots.push(...bits);
}
export function ugHelpers() { return { NOTES }; }
