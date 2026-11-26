// ===================================================================
// jungle.js (build 145, the family's request): JUNGLE ISLAND, the first island of the open ocean (islands.js, ocean.js).
// She lands at its dock in her sailboat and explores on foot:
//   landing: the beach and the jungle's edge (tall trees, ferns, flowers) and THE VINE SWINGS over a mud pit: she grabs a
//            vine and swings; JUMP as she swings forward leaps to the next vine (no hurry: it keeps swinging); a star waits
//            on the far side
//   area 2:  THE RIVER (stepping stones across it) and THE WATERFALL: she walks right through the falling water into the
//            hidden cave behind it, where a treasure chest waits
//   area 3:  THE TREEHOUSES: a rope ladder up, a wobbly rope bridge between two treehouses, and a ZIP LINE back down
// Monkeys and parrots live here (planet-life.js). Everything is batched (a few meshes per area).
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { populate } from './planet-life.js';
import { pathRide, star, tubeAlong } from './upside.js';

const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), SPH = new THREE.SphereGeometry(1, 14, 10), CONE = new THREE.ConeGeometry(1, 1, 8), LEAF = new THREE.SphereGeometry(1, 8, 6);
for (const g of [BOX, CYL, SPH, CONE, LEAF]) g.userData.shared = true;
const GREENS = ['#2f9a4a', '#3fbf5a', '#1f7a3a', '#5fd36a'];

/** a big jungle tree into a batch: trunk, a few branches, big leaf clusters, hanging moss */
function jungleTree(b, x, z, h, seed = 0) {
  b.put(CYL, x, h / 2, z, '#6a4a2a', [.45, h, .45]); b.put(CYL, x, .3, z, '#5a3a20', [.8, .6, .8]);
  for (let i = 0; i < 5; i++) { const a = seed + i * 1.3, r = 1.6 + (i % 3) * .6; b.put(LEAF, x + Math.cos(a) * r, h + (i % 2) * 1.1, z + Math.sin(a) * r * .7, GREENS[(i + seed) % 4], [2.2, 1.4, 1.8]); }
  b.put(LEAF, x, h + 1.6, z, GREENS[seed % 4], [2.4, 1.6, 2]);
}
function fern(b, x, z, s = 1) { for (let i = 0; i < 6; i++) b.put(LEAF, x + Math.cos(i) * .4 * s, .35 * s, z + Math.sin(i) * .3 * s, GREENS[i % 4], [.7 * s, .18 * s, .25 * s], [0, i, .5]); }

// =================== the landing area (space.js calls this for its ground) ===================
export function* jungleLanding(c) {
  const { matte, props, X, PW, MID, add, U, G, P, tapIt, fact, Sound, api, say } = c;
  const kit = { add, Sound, api, tapIt, U, P, G, say, disc: id => api.discover && api.discover(id) };
  // the ground: golden sand by the sea at the start, then rich green jungle floor with mossy patches
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => (K.fbm2(x * .05, z * .05, 3) - .5) * .6 + K.sstep(-12, -40, z) * K.fbm2(x * .03 + 7, z * .03, 3) * 10,
    color: (x, z, h, ny, o) => { const sand = K.sstep(X + 14, X + 4, x); K.ramp(['#3a8a3a', '#5fa84a', '#7fbf5a'], .3 + K.fbm2(x * .2, z * .2, 3) * .5, o); if (sand > 0) o.lerp(K.col('#f0d8a0'), sand); o.multiplyScalar(.85 + .2 * ny); } });
  yield;
  // the sea at the start (behind her boat), palms on the beach, then the jungle: tall trees and ferns all along the back
  props.put(BOX, X - 30, -.05, -6, '#2f8fd8', [60, .1, 40]);
  for (const [x, z] of [[X + 2, -5], [X + 11, -7], [X + 15, -4.5]]) { props.put(CYL, x, 2.6, z, '#a07a4a', [.22, 5.2, .22], [0, 0, .12]); for (let i = 0; i < 6; i++) props.put(LEAF, x + .4 + Math.cos(i) * 1.2, 5.3, z + Math.sin(i), '#4fcf6a', [1.4, .2, .45], [0, i, -.35]); }
  for (let k = 0; k < 22; k++) { const x = X + 18 + k * 14 + (k % 3) * 3, z = -7 - (k % 4) * 4; jungleTree(props, x, z, 8 + (k % 5) * 2, k); }
  for (let k = 0; k < 40; k++) fern(props, X + 18 + k * 8 + (k % 3), -3.4 - (k % 3) * .8, .8 + (k % 3) * .3);
  for (let k = 0; k < 24; k++) props.put(SPH, X + 20 + k * 13, .25, -3 - (k % 2) * .6, ['#ff4f8a', '#ffd23f', '#ff9a2e', '#b07cff'][k % 4], .18); // jungle flowers
  yield;
  // THE VINE SWINGS over the mud pit (x +30 to +56): three vines; she grabs the first by walking into it (or tapping it)
  const VY = 9.5, VL = 5.6, VX = [X + 32, X + 40, X + 48], bar = K.makeBatch();
  bar.put(CYL, X + 40, VY, -1.2, '#6a4a2a', [.35, 22, .35], [0, 0, Math.PI / 2]); for (const x of [X + 29, X + 51]) bar.put(CYL, x, VY / 2, -1.6, '#6a4a2a', [.5, VY, .5]);
  bar.put(BOX, X + 40, -.02, -1, '#6a4a2a', [18, .06, 4]); // the mud pit (soft: she lands softly and can try again)
  for (const x of [X + 28, X + 52]) bar.put(BOX, x, .9, -1, '#7a5a3a', [3, 1.8, 2.4]); // a stump at each end
  const vineM = new THREE.MeshStandardMaterial({ color: '#4a8a2a', roughness: .8 }), vines = VX.map(x => { const piv = new THREE.Group(); piv.position.set(x, VY, -1); add(piv); const v = new THREE.Mesh(CYL, vineM); v.scale.set(.06, VL, .06); v.position.y = -VL / 2; piv.add(v); const lf = new THREE.Mesh(LEAF, vineM); lf.scale.set(.3, .15, .2); lf.position.y = -VL; piv.add(lf); piv.userData.dynamic = true; return piv; });
  for (const a of [X + 26.5, X + 50.5]) G.platforms.push({ a, b: a + 3, y: 1.8, layer: 'space', z: -1, step: true, stepMax: 1.9 }); // (the two stumps: she hops up onto them)
  let R = null; const grab = i => { if (P.ride || P.layer !== 'space') return; R = { type: 'vine', t: 0, noExit: true, stick: true, i, ang: -.7, w: 0 }; R.onJump = () => { if (R && R.w > .2 && R.ang > -.1) R.leap = true; else if (R) say('🌿 Wait for the swing forward... then JUMP!'); }; P.ride = R; P.vx = P.vy = 0; Sound.whoosh && Sound.whoosh(); if (i === 0) say('🌿 Hold on to the vine! Wheee! JUMP when you swing forward to reach the next one!'); };
  for (const [i, v] of vines.entries()) tapIt(v, () => grab(i), VX[i], i === 0 ? 'jungleswing' : undefined);
  const SG = K.makeBatch(); star(kit, SG, X + 52, 4.5, 'vinestar'); add(SG.mesh(K.shinyMat())); add(bar.mesh(K.shinyMat()));
  U.push((dt, t) => { for (const [i, v] of vines.entries()) if (!R || R.i !== i) v.rotation.z = Math.sin(t * 1.3 + i) * .12;
    if (!R) { if (P.layer === 'space' && P.grounded && !P.ride && Math.abs(P.x - (X + 30)) < .6 && P.vx > .5 && P.y > 1.7) grab(0); return; } // (walking off the first stump: she grabs the first vine)
    if (P.ride !== R) { R = null; return; } dt = Math.min(dt, .1); R.t += dt;
    R.w += -Math.sin(R.ang) * 2.2 * dt; if (Math.abs(R.ang) < 1 && Math.abs(R.w) < 1.4) R.w += Math.sign(R.w || 1) * .35 * dt; R.ang += R.w * dt; // (a pendulum that keeps swinging by itself)
    const v = vines[R.i]; v.rotation.z = R.ang; const hx = VX[R.i] + Math.sin(R.ang) * VL, hy = VY - Math.cos(R.ang) * VL;
    P.x = hx; P.y = hy - 1.2; P.z = -1; P.facing = 1; P.vx = P.vy = 0;
    if (R.leap) { const from = R.i, r = R; R = null; P.ride = null; if (from < 2) { pathRide(kit, [[hx, hy - 1.2], [(hx + VX[from + 1]) / 2, hy + .6], [VX[from + 1] + Math.sin(-.6) * VL, VY - Math.cos(-.6) * VL - 1.2]], { z: -1, speed: 9, done: () => grab(from + 1) }); Sound.boing && Sound.boing(); }
      else { pathRide(kit, [[hx, hy - 1.2], [X + 51, 4], [X + 52, 1.8]], { z: -1, speed: 8, done: () => { P.y = 1.8; P.grounded = true; say('🌿 You made it across the mud! What a swinger!'); kit.disc('jungleswing'); } }); }
      void r; } });
  tapIt(vines[0], () => fact('🌿 Jungle vines are strong climbing plants. Monkeys swing on them from tree to tree!', 'vines'), VX[0], 'vines');
  return H;
}

// =================== area 2: THE RIVER and THE WATERFALL (with a hidden cave behind it) ===================
function river(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P;
  // the river runs across the path (s+10 to s+26): blue water, foam, and stepping stones to hop across
  b.put(BOX, s + 18, -.04, -2, '#3aa8e8', [16, .1, 12]); for (let j = 0; j < 10; j++) b.put(SPH, s + 11 + j * 1.6, .02, -1 + (j % 3) * -.6, '#ffffff', [.4, .03, .15]);
  for (const [j, x] of [s + 12, s + 15.2, s + 18.4, s + 21.6, s + 24.8].entries()) { b.put(CYL, x, .25 + (j % 2) * .1, -1, '#8a8f98', [1.1, .5 + (j % 2) * .2, 1]); k.plat(x - 1.1, x + 1.1, .5 + (j % 2) * .2, { z: -1, step: true, stepMax: .8 }); }
  // THE WATERFALL: a cliff with water pouring down in front of a cave; she walks right through the water into the cave
  const wx = s + 52, cliff = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: '#7a7f88', roughness: .9 })); cliff.scale.set(16, 12, 4); cliff.position.set(wx, 6, -6.5); k.add(cliff);
  b.put(SPH, wx, 0, -4.2, '#3aa8e8', [6, .1, 2.4]); // the plunge pool
  const fallM = new THREE.MeshStandardMaterial({ color: '#bfe8ff', transparent: true, opacity: .55, roughness: .1, depthWrite: false }), fall = new THREE.Mesh(new THREE.PlaneGeometry(4, 11, 1, 8), fallM); fall.position.set(wx, 5.5, -4.45); k.add(fall);
  const cave = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: '#2a2630', roughness: 1 })); cave.scale.set(5, 3.6, .2); cave.position.set(wx, 1.8, -4.4); k.add(cave); // (the dark doorway behind the water)
  const inside = K.makeBatch(); inside.put(BOX, wx, 1.8, -6.5, '#4a4450', [5.4, 3.8, .2]); inside.put(BOX, wx, .02, -5.5, '#6a6470', [5, .04, 2.4]); for (let j = 0; j < 7; j++) inside.put(CONE, wx - 2 + j * .7, 3.4, -5.6, '#9fe6ff', [.15, .5, .15], [Math.PI, 0, 0]); // crystals hanging from the cave roof
  inside.put(BOX, wx + 1.4, .35, -5.8, '#b8742e', [1, .7, .7]); inside.put(BOX, wx + 1.4, .35, -5.44, '#ffd23f', [.2, .3, .04]); // the treasure chest
  const inM = inside.mesh(K.shinyMat()); inM.visible = false; k.add(inM);
  let inCave = false, found = false; const enter = () => { inCave = !inCave; if (inCave) { k.Sound.whoosh && k.Sound.whoosh(); k.say('💦 Splash! You walked right through the waterfall... a secret cave! Is that a treasure chest?', true); k.disc && k.disc('watercave'); } else { P.groundZ = 0; k.say('🌿 Back out through the waterfall!', true); } };
  k.G.interact.push({ x: wx, y: 0, layer: 'space', get icon() { return inCave ? '🌿' : '💦'; }, get action() { return inCave ? 'Go outside' : 'Through the waterfall!'; }, hintY: 3, run: enter });
  k.tapIt(fall, enter, wx);
  k.G.interact.push({ x: wx + 1.4, y: 0, layer: 'space', icon: '🧰', action: 'Open the treasure!', hintY: 2, need: () => inCave, run: () => { if (found) { k.say('💎 Shiny jungle gems!', true); return; } found = true; k.Sound.chime(); k.api.burst(wx + 1.4, 1.2, -5.4, ['#ffd23f', '#9fe6ff', '#ff4f8a', '#ffffff'], 30, 2.6); k.say('💎 TREASURE! Gems and gold coins from long ago!', true); k.disc && k.disc('jungletreasure'); } });
  k.U.push((dt, t) => { fall.material.opacity = .45 + Math.sin(t * 9) * .08; if (Math.random() < .3) k.api.burst(wx + (Math.random() - .5) * 3.6, .3, -4, ['#ffffff', '#bfe8ff'], 1, 1.2);
    if (inCave) { P.groundZ = -5.4; P.x = Math.max(wx - 2.2, Math.min(wx + 2.2, P.x)); inM.visible = true; fall.material.opacity = .25; } else inM.visible = false; });
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['jparrot', s + 34 - k.X, -2.8], ['jmonkey', s + 70 - k.X, -2.6]]);
  k.rocketSign(s + 2);
}

// =================== area 3: THE TREEHOUSES: a rope ladder, a rope bridge, a zip line ===================
function treehouses(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P, T1 = s + 20, T2 = s + 44, TY = 7;
  b.put(BOX, T2 + 3.6, TY - .15, -1.4, '#a8743a', [1.2, .3, 3.2]); k.plat(T2 + 3, T2 + 4.2, TY, { z: -1.4 }); /* (the second deck reaches the zip line's start, so she cannot step off before it) */ for (const x of [T1, T2]) { b.put(CYL, x, TY / 2, -2.6, '#6a4a2a', [.7, TY + 2, .7]); b.put(BOX, x, TY - .15, -1.4, '#a8743a', [6, .3, 3.2]); b.put(BOX, x, TY + 1.5, -2.6, '#c8925a', [4, 3, .2]); b.put(CONE, x, TY + 3.8, -1.8, '#3fbf5a', [3.8, 1.8, 2.8], [0, Math.PI / 4, 0]);
    for (let j = 0; j < 5; j++) b.put(LEAF, x + Math.cos(j * 1.3) * 3, TY + 5 + (j % 2), -2.6 + Math.sin(j * 1.3), GREENS[j % 4], [2.4, 1.6, 2]); k.plat(x - 3, x + 3, TY, { z: -1.4, step: true, stepMax: .6 }); }
  // the rope ladder up to the first treehouse: rungs she climbs by walking into them (each a little step)
  for (let j = 0; j < 9; j++) { const x = T1 - 6 + j * .38, y = .8 + j * .78; b.put(CYL, x, y - .1, -1.3, '#c8925a', [.06, 1.1, .06], [Math.PI / 2, 0, 0]); k.plat(x - .3, x + .3, y, { z: -1.3, step: true, stepMax: .9 }); }
  for (const dz of [-1.85, -.75]) b.put(CYL, T1 - 4.5, 3.7, dz, '#a8743a', [.04, 8, .04], [0, 0, -.45]); // (the ladder's two side ropes)
  // the rope bridge between them: planks that sag a little as she walks
  const planks = []; for (let j = 0; j < 9; j++) { const x = T1 + 3.6 + j * 1.9, m = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: '#b07a4a', roughness: .8 })); m.scale.set(1.7, .14, 1.8); m.position.set(x, TY - .1, -1.4); m.userData.dynamic = true; k.add(m); const p = { a: x - .95, b: x + .95, y: TY, layer: 'space', z: -1.4, step: true, stepMax: .6 }; k.G.platforms.push(p); planks.push({ m, p, x }); } // (step: the planks sag in a curve, so on the way up each one is a little higher)
  for (const dz of [-2.3, -.5]) b.put(CYL, (T1 + T2) / 2, TY + .9, dz, '#c8925a', [.04, T2 - T1 - 6, .04], [0, 0, Math.PI / 2]);
  k.U.push((dt, t) => { for (const [j, q] of planks.entries()) { const sag = -Math.sin((j + 1) / 10 * Math.PI) * .45 + Math.sin(t * 2 + j) * .03, on = P.grounded && !P.ride && Math.abs(P.y - q.p.y) < .1 && P.x >= q.p.a && P.x <= q.p.b; q.p.y = TY + sag; q.m.position.y = TY + sag - .1; if (on) P.y = q.p.y; } });
  // THE ZIP LINE from the second treehouse down to the jungle floor
  const zx0 = T2 + 4.2, zpath = [[zx0, TY + .2], [zx0 + 8, TY - 2], [zx0 + 18, 3], [zx0 + 26, .2]]; tubeAlong(b, zpath.map(([x, y]) => [x, y + 2.1]), .03, '#8a8f98', -1.4);
  let zipping = false; const zip = () => { if (zipping || P.ride) return; zipping = true; k.Sound.whoosh ? k.Sound.whoosh() : k.Sound.chime(); k.say('🌴 Zip line! Wheeee! Over the jungle!', true); pathRide(k, zpath, { z: -1.4, speed: 9, done: () => { zipping = false; k.disc && k.disc('junglezip'); } }); };
  k.G.interact.push({ x: zx0, y: TY, layer: 'space', icon: '🌴', action: 'Zip line!', hintY: 2.4, run: zip });
  k.U.push(() => { if (!zipping && P.grounded && !P.ride && Math.abs(P.y - TY) < .15 && P.x > zx0 - 1.5 && P.vx > .5) zip(); }); // (a wide start: at a slow frame rate she must not step past it)
  star(k, b, T1, TY + 1.4, 'treehousestar'); star(k, b, (T1 + T2) / 2, TY + 1.6, 'bridgestar');
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['jmonkey', s + 32 - k.X, -2.8], ['jparrot', s + 90 - k.X, -2.8]]);
  k.rocketSign(s + 108.6);
}

export const jungleworld = { sections: [k => river(k), k => treehouses(k)] };
