// ===================================================================
// jelly.js (build 136): THE SQUISHY JELLY WORLD, the fourth dimension behind a wormhole (dimensions.js).
// Everything is soft, shiny jelly: it SQUISHES and WOBBLES when she lands on it (each jelly piece squashes and jiggles back:
// a cheap scale wobble, not soft-body physics), and many pieces bounce her a little.
//   landing: JELLY HILLS to bounce across (each one wobbles under her), jelly-bean trees, a jam pond, gummy rocks
//   area 2:  the WOBBLY BRIDGE over the jam river (each piece sags under her and jiggles, carrying her), the JELLY TOWER to climb
//            (stacked jellies, each step wobbles) and the JELLY SLIDE all the way down
//   area 3:  the GIANT JELLY TRAMPOLINE PARK (higher and higher) and the SQUISHY JELLY HOUSE to walk into
// Jelly is one shiny, slightly see-through material per colour (shared); every piece is one small mesh that wobbles.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { populate } from './planet-life.js';
import { tubeAlong, pathRide, star } from './upside.js';

const BALL = new THREE.SphereGeometry(1, 20, 14), BOX = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), CYL = new THREE.CylinderGeometry(1, 1, 1, 18), DOT = new THREE.SphereGeometry(1, 6, 4);
const BEAN = new THREE.SphereGeometry(1, 8, 6); BEAN.userData.shared = true; // (decoration: 96 triangles, not 560)
BALL.userData.shared = BOX.userData.shared = CYL.userData.shared = DOT.userData.shared = true;
const JELLY = ['#ff4f8a', '#ffb02e', '#7fe05a', '#4fb8ff', '#b07cff', '#ff6f4f'];
const MATS = {}; // one jelly material per colour, shared by every piece of that colour
const jellyMat = col => MATS[col] || (MATS[col] = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .18, roughness: .12, metalness: 0, transparent: true, opacity: .86 }));

/** a wobbly jelly piece standing on y0: squishes when she lands (onLand) and jiggles back. Returns its wobble state. */
function jellyPiece(k, geo, col, x, y0, z, sx, sy, sz, plat) {
  const m = new THREE.Mesh(geo, jellyMat(col)); m.position.set(x, y0 + sy / 2, z); m.scale.set(sx, sy, sz); m.userData.dynamic = true; k.add(m);
  const hi = new THREE.Mesh(DOT, jellyMat('#ffffff')); hi.scale.set(.12, .16, .05); hi.position.set(-.28, .32, .5); m.add(hi); // a shiny highlight
  const w = { m, sx, sy, sz, y0, t: 0, amp: 0 };
  if (plat) { const p = { a: x - sx * .45, b: x + sx * .45, y: y0 + sy, layer: 'space', z: plat.z ?? z + .2, step: true, stepMax: plat.stepMax ?? 1.3, ...plat, onLand: () => { w.amp = 1; w.t = 0; k.Sound.boing && k.Sound.boing(); plat.land && plat.land(); } }; delete p.land; k.G.platforms.push(p); w.plat = p; }
  WOB.push(w); return w;
}
let WOB = []; // every wobbling piece of the place being built (reset per place)
function wobbleAll(k) { const list = WOB; WOB = []; k.U.push(dt => { for (const w of list) { if (w.amp <= 0) continue; w.t += dt; w.amp = Math.max(0, w.amp - dt * .9); const q = Math.sin(w.t * 14) * w.amp * .18; w.m.scale.set(w.sx * (1 + q), w.sy * (1 - q), w.sz * (1 + q)); w.m.position.y = w.y0 + w.sy * (1 - q) / 2; } }); }

// =================== the landing area (space.js calls this for its ground) ===================
export function* jellyLanding(c) {
  const { matte, props, X, PW, MID, add, U, G, P, tapIt, fact, Sound, api, say } = c;
  const kit = { add, Sound, api, tapIt, U, P, G, say, disc: id => api.discover && api.discover(id) };
  // the ground: a glossy candy floor, strawberry-jam swirls, sugar sparkles
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => (K.fbm2(x * .05, z * .05, 3) - .5) * .7 + K.sstep(-12, -40, z) * K.fbm2(x * .03 + 5, z * .03, 3) * 7,
    color: (x, z, h, ny, o) => { const n = K.fbm2(x * .15, z * .15, 3); K.ramp(['#ffd6e8', '#ffe8c8', '#ffc0d8'], .3 + n * .5, o); if (Math.sin(x * .3 + Math.sin(z * .4) * 3) > .92) o.set('#ff4f8a'); if (K.noise2(x * 2, z * 2) > .82) o.set('#ffffff'); o.multiplyScalar(.9 + .12 * ny); } });
  yield;
  // jelly-bean trees, gummy rocks and a jam pond (batched)
  for (let k = 0; k < 24; k++) { const x = X - 20 + k * 15, z = -7 - (k % 4) * 4, col = JELLY[k % 6]; props.put(CYL, x, 1.8, z, '#ffffff', [.18, 3.6, .18]); for (let j = 0; j < 6; j++) props.put(BEAN, x + Math.cos(j * 1.1) * 1.1, 3.6 + Math.sin(j * 1.7) * .6, z + Math.sin(j * 1.1) * .8, JELLY[(k + j) % 6], [.55, .3, .3], [0, j, .5]); }
  for (let k = 0; k < 30; k++) props.put(BEAN, X - 25 + k * 12.5, .25, -4.5 - (k % 3) * 2, JELLY[(k * 5) % 6], [.6, .4, .5]);
  props.put(CYL, X + 96, .04, -7, '#c8102e', [6, .08, 3.5]);
  yield;
  // JELLY HILLS to bounce across: each one wobbles under her (and gives a little bounce)
  const hills = [[X + 22, 1.4, 2.6, '#ff4f8a', 8], [X + 29, 2.2, 2.6, '#ffb02e', 9], [X + 36, 3.2, 2.8, '#7fe05a', 10], [X + 43, 2.2, 2.6, '#4fb8ff', 9], [X + 50, 1.4, 2.6, '#b07cff', 8]];
  for (const [j, [x, h, w, col, b]] of hills.entries()) jellyPiece(kit, BALL, col, x, -h * .3, -.5, w * 2, h * 1.3, 2.2, { pad: true, bounce: b, z: -.5, stepMax: 1.4, land: j === 4 ? () => kit.disc('jellyhills') : null });
  // a giant jelly cube to push your face into (tap it: it wobbles and giggles)
  const cube = jellyPiece(kit, BOX, '#7fe05a', X + 70, 0, -3.2, 3, 3, 3, { z: -1.5, stepMax: 3.1, pad: true, bounce: 9 });
  tapIt(cube.m, () => { cube.amp = 1; cube.t = 0; Sound.boing && Sound.boing(); fact('🟩 A giant jelly cube! Jelly is wobbly because it is mostly water held in a soft net.', 'jellycube'); }, X + 70, 'jellycube');
  const sb = K.makeBatch(); star(kit, sb, X + 36, 9.5, 'jellyhilltop'); add(sb.mesh(K.shinyMat()));
  wobbleAll(kit);
  return H;
}

// =================== area 2: the WOBBLY BRIDGE, the JELLY TOWER and the JELLY SLIDE ===================
function bridge(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P;
  // the jam river under the bridge
  b.put(BOX, s + 24, -.05, -1.5, '#c8102e', [26, .1, 9]); for (let j = 0; j < 8; j++) b.put(DOT, s + 13 + j * 3, .02, -2 + (j % 2) * 1.5, '#ff6f8a', [.6, .05, .3]);
  // the wobbly bridge: each piece sags a little under her and jiggles (it carries her as it moves)
  const segs = [];
  for (let j = 0; j < 8; j++) { const x = s + 12 + j * 3, m = new THREE.Mesh(BOX, jellyMat(JELLY[j % 6])); m.scale.set(2.9, .5, 2); m.position.set(x, 1.8, -1); m.userData.dynamic = true; k.add(m);
    const p = { a: x - 1.45, b: x + 1.45, y: 2.05, layer: 'space', z: -1, step: true, stepMax: 1.3 }; k.G.platforms.push(p); segs.push({ m, p, x, sag: 0, v: 0 }); }
  for (const x of [s + 9.5, s + 37]) { b.put(BOX, x, 1, -1, '#ffffff', [2, 2, 2]); k.plat(x - 1, x + 1, 2.05, { z: -1, step: true, stepMax: 2.1 }); } // the two candy ends
  k.U.push((dt, t) => { for (const g of segs) { const on = P.grounded && !P.ride && Math.abs(P.y - g.p.y) < .08 && P.x >= g.p.a && P.x <= g.p.b;
      const want = on ? -.35 : 0; g.v += ((want - g.sag) * 40 - g.v * 4) * dt; g.sag += g.v * dt; const y = 2.05 + g.sag + Math.sin(t * 2 + g.x) * .02;
      g.p.y = y; g.m.position.y = y - .25; g.m.scale.set(2.9 * (1 - g.sag * .3), .5 * (1 + g.sag * .6), 2); if (on) P.y = y; }
    if (P.x > s + 36 && P.y > 1.9 && !k.G._jb) { k.G._jb = 1; k.disc && k.disc('jellybridge'); } });
  // THE JELLY TOWER: stacked jellies to climb (each step wobbles), a star on top
  const t0 = s + 46; for (let j = 0; j < 6; j++) { const w = jellyPiece(k, BOX, JELLY[j % 6], t0 + j * 2.6, 0, -.6, 2.6, 1.2 * (j + 1), 2.2, { z: -.6, stepMax: 2.5 }); w.plat.a = t0 + j * 2.6 - 1.3; w.plat.b = t0 + j * 2.6 + 1.3; } // (build 136: steps that touch, and each can lift her two steps: a slow frame never leaves her stuck at the bottom)
  const top = 7.2; star(k, b, t0 + 13.5, top + 1.3, 'jellytower');
  // THE JELLY SLIDE: a shiny jelly tube all the way down
  const sx = t0 + 13.6, path /* (on the top step itself: walking off the top always starts the slide, she never drops off) */ = [[sx, top], [sx + 3, top - 1], [sx + 8, 4], [sx + 13, 1.4], [sx + 17, .2]];
  tubeAlong(b, path.map(([x, y]) => [x, y - .3]), .55, '#ff4f8a', -1.2);
  let sliding = false; const slide = () => { if (sliding || P.ride) return; sliding = true; k.Sound.chime(); k.say('🛝 Down the jelly slide! Squish squish!', true); pathRide(k, path, { z: -1.2, speed: 8, done: () => { sliding = false; k.disc && k.disc('jellyslide'); } }); };
  k.G.interact.push({ x: sx, y: top, layer: 'space', icon: '🛝', action: 'Jelly slide!', hintY: 2.4, run: slide });
  k.U.push(() => { if (!sliding && P.grounded && !P.ride && Math.abs(P.y - top) < .1 && P.x > sx - .6 && P.x < sx + 1 && P.vx > .5) slide(); });
  k.add(b.mesh(K.shinyMat())); wobbleAll(k);
  populate(k, [['gummybear', s + 70 - k.X, -2.6], ['jellyblob', s + 40 - k.X, -4.4]]);
  k.rocketSign(s + 2);
}

// =================== area 3: the GIANT JELLY TRAMPOLINE PARK and the SQUISHY JELLY HOUSE ===================
function park(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P;
  // jelly trampolines, each bouncier than the last, and stars higher and higher
  for (let j = 0; j < 5; j++) { const x = s + 10 + j * 7; jellyPiece(k, CYL, JELLY[j], x, 0, -.6, 2.6, .9, 2.2, { z: -.6, stepMax: 1, pad: true, bounce: 10 + j * 2, land: j === 4 ? () => k.disc && k.disc('jellytramps') : null }); star(k, b, x, 5 + j * 1.8, 'jellystar' + j); }
  // THE SQUISHY JELLY HOUSE: walk in through the door: wobbly walls, a jelly sofa and a jelly bed to bounce on
  const hx = s + 60, zi = -3.4;
  const walls = [[hx - 6, 4, '#ff4f8a', .5, 4.4], [hx + 6, 4, '#ff4f8a', .5, 4.4], [hx, 4, '#ffb02e', 12.5, .5]];
  for (const [x, h, col, w, d] of walls) jellyPiece(k, BOX, col, x, 0, d > 1 ? zi : zi - 2.1, w, h, d > 1 ? d : .5);
  jellyPiece(k, BOX, '#4fb8ff', hx, 4, zi, 13, .5, 4.6); // the roof
  b.put(BOX, hx, .05, zi, '#ffe8f0', [12, .1, 4.4]);
  const furn = [jellyPiece(k, BOX, '#b07cff', hx - 3, 0, zi - 1, 3, .8, 1.4, { z: zi, stepMax: .9, sofa: true }), jellyPiece(k, BOX, '#7fe05a', hx + 3, 0, zi - 1, 3, .7, 1.8, { z: zi, stepMax: .8, pad: true, bounce: 7 })];
  for (const f of furn) f.plat.layer = 'off'; // (only there while she is inside: walking past outside never catches on them)
  let inside = false;
  k.G.interact.push({ x: hx, y: 0, layer: 'space', get icon() { return '🚪'; }, get action() { return inside ? 'Go outside' : 'Into the jelly house!'; }, hintY: 2.6,
    run: () => { inside = !inside; k.Sound.chime(); if (inside) { k.say('🏠 The squishy jelly house! Bounce on the jelly bed!', true); k.disc && k.disc('jellyhouse'); } else P.groundZ = 0; } });
  k.U.push(() => { if (inside && (P.ride || Math.abs(P.x - hx) > 8)) inside = false; for (const f of furn) f.plat.layer = inside ? 'space' : 'off'; if (inside) { P.groundZ = zi; P.x = Math.max(hx - 5.5, Math.min(hx + 5.5, P.x)); } });
  k.add(b.mesh(K.shinyMat())); wobbleAll(k);
  populate(k, [['gummybear', s + 90 - k.X, -2.8]]);
  k.rocketSign(s + 108.6);
}

export const jellyworld = { sections: [k => bridge(k), k => park(k)] };
