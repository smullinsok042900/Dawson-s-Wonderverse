// ===================================================================
// toy.js (build 132): THE GIANT TOY UNIVERSE, the second dimension behind a wormhole (dimensions.js).
// She is the size of a toy mouse in a giant toy room: the ground is a huge play mat, and everything is an enormous toy.
//   landing: giant block towers to CLIMB (real steps, a lookout on top), GIANT BOUNCY BALLS that bounce her from ball to
//            ball, a giant WIND-UP KEY that starts a clockwork parade, crayons as tall as trees, the toy house far away
//   area 2:  the WIND-UP TOY TRAIN: she DRIVES it with the arrows (▶ faster, ◀ slower and backwards) round a toy track over a
//            block bridge, collecting stars; the BLOCK MOUNTAIN to climb, with a TOY SLIDE all the way down
//   area 3:  the WOODEN TOY COASTER (hills and a big drop), the SPINNING TOP (hop on and spin) and the JACK-IN-THE-BOX launcher
// All batched (a few meshes per area, the shared materials), built as she walks near, freed when she flies away.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { toy } from './creatures.js';
import { populate } from './planet-life.js';
import { tubeAlong, pathRide, star } from './upside.js';

const CYL = new THREE.CylinderGeometry(1, 1, 1, 16), BALL = new THREE.SphereGeometry(1, 18, 12), BOX = new THREE.BoxGeometry(1, 1, 1), CONE = new THREE.ConeGeometry(1, 1, 14);
CYL.userData.shared = BALL.userData.shared = BOX.userData.shared = CONE.userData.shared = true;
const BRIGHT = ['#ff4f6a', '#ffd23f', '#4fb0ff', '#5fd36a', '#ff9a2e', '#b07cff'];
const stick = k => (k.api.stick ? k.api.stick() : { x: 0, y: 0 });

/** a giant toy block with a letter-panel look (a darker inset on its front) */
function block(b, x, y, z, s, col) {
  b.put(BOX, x, y + s / 2, z, col, [s, s, s]);
  b.put(BOX, x, y + s / 2, z + s / 2 + .01, new THREE.Color(col).multiplyScalar(.8).getStyle(), [s * .7, s * .7, .04]);
  b.put(BOX, x, y + s / 2, z + s / 2 + .03, '#ffffff', [s * .3, s * .12, .03]); b.put(BOX, x, y + s / 2, z + s / 2 + .03, '#ffffff', [s * .12, s * .3, .03]); // (a plus sign)
}

// =================== the landing area (space.js calls this for its ground) ===================
export function* toyLanding(c) {
  const { matte, props, X, PW, MID, add, U, G, P, tapIt, fact, Sound, api } = c;
  // the play mat: big bright squares with stitched borders, and a road printed on it
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => K.sstep(-30, -60, z) * 3 + (K.fbm2(x * .02, z * .02, 2) - .5) * .2,
    color: (x, z, h, ny, o) => { const gx = Math.floor(x / 6), gz = Math.floor(z / 6), fx = x / 6 - gx, fz = z / 6 - gz; o.set(BRIGHT[((gx * 7 + gz * 3) % 6 + 6) % 6]); o.lerp(new THREE.Color('#fff8e8'), .12);
      if (fx < .04 || fz < .04) o.set('#fff3d0'); if (z < -3.2 && z > -5.2) o.set(Math.floor(x) % 3 ? '#5a5a6a' : '#fff07a'); o.multiplyScalar(.9 + .12 * ny); } });
  yield;
  // giant toys in the background: crayons standing like trees, a toy house, a teddy, stacked rings
  for (let k = 0; k < 18; k++) { const x = X - 20 + k * 21, z = -14 - (k % 3) * 6, col = BRIGHT[k % 6]; props.put(CYL, x, 6, z, col, [1.1, 12, 1.1]); props.put(CONE, x, 13, z, col, [1.1, 2, 1.1]); props.put(CYL, x, 10.3, z, '#ffffff', [1.12, .6, 1.12]); }
  props.put(BOX, X + 150, 9, -46, '#ffd0e0', [30, 18, 16]); props.put(CONE, X + 150, 24, -46, '#ff4f6a', [22, 12, 12], [0, Math.PI / 4, 0]); for (const dx of [-8, 8]) props.put(BOX, X + 150 + dx, 10, -37.9, '#9fd8ff', [5, 5, .3]); props.put(BOX, X + 150, 4.5, -37.9, '#8a5a3a', [5, 9, .3]);
  for (const [i, x] of [X + 70, X + 260].entries()) { const z = -24; props.put(BALL, x, 8, z, '#c58a5a', [6, 6.5, 5]); props.put(BALL, x, 16, z, '#c58a5a', 4.2); for (const s of [-1, 1]) { props.put(BALL, x + s * 3.4, 19, z, '#c58a5a', 1.6); props.put(BALL, x + s * 1.5, 16.6, z + 3.7, '#2a2333', .45); props.put(BALL, x + s * 5.5, 9, z + 1, '#c58a5a', [1.8, 2.6, 1.8]); } props.put(BALL, x, 15.4, z + 3.9, '#3a2a2a', .6); props.put(BALL, x, 8, z + 4.2, '#e8c49a', [3, 3.6, 1]); if (i) props.put(BOX, x, 13, z + 4.4, '#ff4f6a', [4, .6, .4]); }
  for (let k = 0; k < 6; k++) props.put(CYL, X + 200, .6 + k * 1.2, -30, BRIGHT[k], [6 - k * .8, 1.1, 6 - k * .8]); props.put(CYL, X + 200, 4, -30, '#c8a070', [.5, 8, .5]); // ring stacker
  yield;
  // GIANT BLOCK TOWERS to climb: each block is a real step (1.2 m: she hops up), with a lookout on top and a star
  const kk = { add, Sound, api, tapIt, U, P, G, disc: id => api.discover && api.discover(id) }; // (what star() needs)
  for (let j = 0; j < 6; j++) { const x = X + 24 + j * 2.4; for (let r = 0; r <= j; r++) for (const dx of [-.6, .6]) block(props, x + dx, r * 1.2, -.4, 1.2, BRIGHT[(j + r + (dx > 0 ? 1 : 0)) % 6]);
    c.G.platforms.push({ a: x - 1.2, b: x + 1.2, y: (j + 1) * 1.2, layer: 'space', z: -.4, step: true, stepMax: 1.3 }); }
  c.G.platforms.push({ a: X + 36, b: X + 41, y: 7.2, layer: 'space', z: -.4, step: true, stepMax: 1.3 }); // the lookout on top
  props.put(BOX, X + 38.5, 6.6, -.4, '#ffd23f', [5, 1.2, 2.4]); for (let k = 0; k < 5; k++) props.put(CYL, X + 36.5 + k, 7.7, .7, '#ff4f6a', [.06, 1, .06]); props.put(BOX, X + 38.5, 8.2, .7, '#ff4f6a', [5, .1, .1]);
  const tb = K.makeBatch(); star(kk, tb, X + 39.5, 8.2, 'blocktop'); add(tb.mesh(K.shinyMat()));
  // GIANT BOUNCY BALLS: land on one and it bounces you to the next (each one a different note)
  const balls = [[X + 50, 1.4, '#ff4f6a', 13], [X + 56, 2, '#ffd23f', 15], [X + 62.5, 1.6, '#4fb0ff', 14], [X + 69, 2.4, '#5fd36a', 16]];
  const ballMeshes = [];
  for (const [j, [x, r, col, bounce]] of balls.entries()) {
    const m = new THREE.Mesh(BALL, toy(col, { r: .35 })); m.scale.setScalar(r); m.position.set(x, r, -.5); m.userData.dynamic = true; add(m); ballMeshes.push({ m, r, squish: 0 });
    { const key = 'toyball' + j; for (let q = c.G.solids.length - 1; q >= 0; q--) if (c.G.solids[q].key === key) c.G.solids.splice(q, 1); c.G.solids.push({ a: x - r * .8, b: x + r * .8, top: r * 2 - .05, layer: 'space', key }); } // (build 135: solid: she can't walk through a ball, she jumps on it)
    c.G.platforms.push({ a: x - r * .7, b: x + r * .7, y: r * 2, layer: 'space', z: -.5, pad: true, bounce, nudge: j < balls.length - 1 ? (balls[j + 1][0] - x - .5) / 1.1 : 0, /* (the sideways push lasts 1.1 s: aimed at the next ball's middle) */ onLand: () => { ballMeshes[j].squish = 1; Sound.tone && Sound.tone(392 * Math.pow(1.26, j), .14, 'sine', .06, 1.4); if (j === balls.length - 1) kk.disc('bouncyballs'); } });
  }
  U.push(dt => { for (const o of ballMeshes) { if (o.squish > 0) o.squish = Math.max(0, o.squish - dt * 3); const q = Math.sin(o.squish * 9) * o.squish * .22; o.m.scale.set(o.r * (1 + q), o.r * (1 - q), o.r * (1 + q)); o.m.position.y = o.r * (1 - q); } });
  // THE GIANT WIND-UP KEY: tap it and the clockwork parade marches (a duck, a drum and a mouse waddle along the mat)
  const key = new THREE.Group(); key.position.set(X + 86, 0, -2.6); add(key);
  { const kb = K.makeBatch(); kb.put(BOX, 0, 2.8, 0, '#c8a070', [.5, 5.6, .5]); for (const s of [-1, 1]) kb.put(CYL, s * 1.5, 5.8, 0, '#ffd23f', [1.4, .4, 1.4], [Math.PI / 2, 0, 0]); kb.put(CYL, 0, 5.8, 0, '#ffd23f', [.5, .7, .5], [0, 0, Math.PI / 2]); key.add(kb.mesh(K.shinyMat())); }
  const parade = []; for (let k = 0; k < 3; k++) { const pb = K.makeBatch(), col = ['#ffd23f', '#ff4f6a', '#b0b0c0'][k];
    pb.put(BALL, 0, .7, 0, col, [.9, .7, .7]); pb.put(BALL, .7, 1.3, 0, col, .5); pb.put(BALL, .95, 1.4, .3, '#2a2333', .08); pb.put(BOX, -.1, 1.7, 0, '#c8a070', [.1, .6, .1]); pb.put(CYL, -.1, 2, 0, '#ffd23f', [.3, .1, .3], [Math.PI / 2, 0, 0]);
    if (k === 0) pb.put(CONE, 1.15, 1.25, 0, '#ff9a2e', [.15, .35, .15], [0, 0, -Math.PI / 2]); if (k === 1) pb.put(CYL, 0, 1.6, 0, '#ffffff', [.5, .3, .5]);
    const m = pb.mesh(K.shinyMat()); m.position.set(X + 90 + k * 3, 0, -2); m.userData.dynamic = true; add(m); parade.push(m); }
  let wound = 0; const wind = () => { if (wound > 1) return; wound = 9; Sound.chime(); c.say('🔑 Click, click, click! The wind-up toys march!', true); };
  tapIt(key, wind, X + 86, 'windkey');
  U.push((dt, t) => { key.rotation.z = wound > 0 ? t * 3 : 0; if (wound > 0) { wound -= dt; for (const [k, m] of parade.entries()) { m.position.x = X + 90 + k * 3 + Math.sin((9 - wound) * .5) * 4; m.position.y = Math.abs(Math.sin(t * 8 + k)) * .2; m.rotation.z = Math.sin(t * 8 + k) * .12; } } });
  c.tapIt(parade[0], () => fact('🦆 A wind-up duck as big as a car! In the Giant Toy Universe, all the toys are enormous.', 'giantduck'), X + 92, 'giantduck');
  return H;
}

// =================== area 2: the WIND-UP TOY TRAIN she drives, and the BLOCK MOUNTAIN with its TOY SLIDE ===================
function train(k) {
  const s = k.s0, b = K.makeBatch(), z = -2.8, x0 = s + 6, x1 = s + 70;
  // the toy track: wooden rails and sleepers, over a block bridge in the middle (the train climbs it)
  const trackY = x => .35 + Math.max(0, 1 - Math.abs(x - (x0 + x1) / 2) / 14) * 2.4;
  for (let x = x0; x <= x1; x += 1.2) { const y = trackY(x); b.put(BOX, x, y - .15, z, '#c8a070', [.4, .12, 2.2]); }
  for (const d of [-.6, .6]) { const pts = []; for (let x = x0; x <= x1; x += 2) pts.push([x, trackY(x) - .05]); tubeAlong(b, pts, .07, '#b0b0c0', z + d); }
  for (let x = x0 + 26; x <= x1 - 26; x += 3) block(b, x, 0, z, Math.max(.6, trackY(x) - .6), BRIGHT[(x | 0) % 6]);
  b.put(BOX, x0 - 1.5, .4, z, '#ffd23f', [2.4, .8, 3]); b.put(BOX, x1 + 1.5, .4, z, '#ffd23f', [2.4, .8, 3]); // the two stations
  // the train: an engine with a big wind-up key and two little wagons
  // (build 135) the engine and the two wagons are separate cars: each sits on the track where it is and tilts with it,
  // so the whole train climbs over the block bridge (before, it was one stiff piece that stayed straight)
  const car = (fn) => { const g = new THREE.Group(); g.userData.dynamic = true; k.add(g); const cb = K.makeBatch(); fn(cb); g.add(cb.mesh(K.shinyMat())); return g; };
  const wheels = (cb, w = .36) => { for (const dx of [-.7, .7]) for (const s2 of [-1, 1]) cb.put(CYL, dx, .4, s2 * .75, '#2a2333', [w, .12, w], [Math.PI / 2, 0, 0]); };
  const engine = car(tb => { tb.put(BOX, 0, .9, 0, '#ff4f6a', [2.2, 1.1, 1.5]); tb.put(BOX, -.6, 1.8, 0, '#ff4f6a', [1, .9, 1.4]); tb.put(CYL, .7, 1.8, 0, '#2a2333', [.28, .9, .28]); tb.put(CYL, .7, 2.3, 0, '#ffd23f', [.4, .2, .4]); wheels(tb);
    tb.put(BOX, -1.2, 1.8, 0, '#c8a070', [.12, .12, .8]); tb.put(CYL, -1.4, 1.8, 0, '#ffd23f', [.4, .1, .4], [0, 0, Math.PI / 2]); });
  const wagons = [1, 2].map(w => car(tb => { tb.put(BOX, 0, .9, 0, BRIGHT[w + 1], [2, .9, 1.4]); wheels(tb, .3); tb.put(BOX, 1.15, .6, 0, '#5a5a6a', [.3, .12, .12]); }));
  const cars = [engine, ...wagons], tr = engine;
  const place = x => { for (const [i, g] of cars.entries()) { const cx = Math.max(x0 - 5, x - i * 2.5); g.position.set(cx, trackY(cx) - .35, z); g.rotation.z = Math.atan2(trackY(cx + .6) - trackY(cx - .6), 1.2); } };
  place(x0);
  // the stars along the track (collected as the train passes them)
  const sb = K.makeBatch(); for (let j = 0; j < 6; j++) star(k, sb, x0 + 8 + j * 10, trackY(x0 + 8 + j * 10) + 2.4, 'trainstar' + j); k.add(sb.mesh(K.shinyMat()));
  let R = null;
  const board = () => { const P = k.P; if (P.ride || R) return; k.Sound.chime(); k.say('🚂 All aboard the wind-up train! ▶ goes faster, ◀ slows down and backs up. Collect the stars!', true);
    R = { type: 'toytrain', t: 0, noExit: false, stick: true, v: 0, x: engine.position.x }; P.ride = R; P.vx = P.vy = 0; k.disc && k.disc('toytrain'); };
  for (const g of cars) k.tapIt(g, board); k.G.interact.push({ x: x0, y: 0, layer: 'space', icon: '🚂', action: 'Drive the train!', hintY: 2.4, run: board });
  k.U.push((dt, t) => { const P = k.P;
    if (R && P.ride !== R) { R = null; return; } if (!R) return;
    const st = stick(k), want = st.x * 9; R.v += (want - R.v) * Math.min(1, dt * 1.6); R.x = Math.max(x0, Math.min(x1, R.x + R.v * dt)); if (R.x === x0 || R.x === x1) R.v *= .3;
    place(R.x);
    P.x = R.x - .6; P.y = trackY(R.x) + .8; P.z = z; P.facing = R.v >= 0 ? 1 : -1;
    if (Math.abs(R.v) > .5 && Math.random() < dt * 2) k.api.burst(R.x + .7, trackY(R.x) + 2.4, z, ['#ffffff', '#e8e8f0'], 3, 1); });
  // THE BLOCK MOUNTAIN: a big staircase of giant blocks to a summit, and the TOY SLIDE all the way down
  const m0 = s + 76; for (let j = 0; j < 6; j++) { const x = m0 + j * 2.4; for (let r = 0; r <= j; r++) for (const dx of [-.6, .6]) block(b, x + dx, r * 1.2, -.4, 1.2, BRIGHT[(j + r + (dx > 0 ? 1 : 0)) % 6]); k.plat(x - 1.2, x + 1.2, (j + 1) * 1.2, { z: -.4, step: true, stepMax: 1.3 }); }
  const top = 7.2, sx = m0 + 13.2, path = [[sx, top], [sx + 3, top - 1], [sx + 8, 3.6], [sx + 13, 1.2], [sx + 17, .2]];
  tubeAlong(b, path.map(([x, y]) => [x, y - .3]), .55, '#4fb0ff', -1.2); tubeAlong(b, path.map(([x, y]) => [x, y - .22]), .1, '#ffffff', -.55); tubeAlong(b, path.map(([x, y]) => [x, y - .22]), .1, '#ffffff', -1.85);
  let sliding = false; const slide = () => { if (sliding || k.P.ride) return; sliding = true; k.Sound.whoosh ? k.Sound.whoosh() : k.Sound.chime(); k.say('🛝 Wheee! Down the giant toy slide!', true); pathRide(k, path, { z: -1.2, speed: 9, done: () => { sliding = false; k.disc && k.disc('toyslide'); } }); };
  k.G.interact.push({ x: sx, y: top, layer: 'space', icon: '🛝', action: 'Slide!', hintY: 2.4, run: slide });
  k.U.push(() => { const P = k.P; if (!sliding && P.grounded && !P.ride && Math.abs(P.y - top) < .1 && P.x > sx - .6 && P.x < sx + 1 && P.vx > .5) slide(); });
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['windmouse', s + 74 - k.X, -2.6], ['blockpup', s + 30 - k.X, -4.6]]);
  k.rocketSign(s + 2);
}

// =================== area 3: the WOODEN TOY COASTER, the SPINNING TOP and the JACK-IN-THE-BOX ===================
function coaster(k) {
  const s = k.s0, b = K.makeBatch(), z = -2.6;
  const path = [[s + 6, .9], [s + 12, 1.2], [s + 20, 7], [s + 24, 9], [s + 28, 8], [s + 34, 1.6], [s + 40, 1.2], [s + 46, 5], [s + 50, 5.4], [s + 54, 3], [s + 60, 1], [s + 66, .9]];
  tubeAlong(b, path.map(([x, y]) => [x, y - .35]), .14, '#ff4f6a', z - .45); tubeAlong(b, path.map(([x, y]) => [x, y - .35]), .14, '#ff4f6a', z + .45);
  for (const [x, y] of path) b.put(BOX, x, (y - .4) / 2, z, '#c8a070', [.3, Math.max(.1, y - .4), .3]);
  b.put(BOX, s + 6, .3, z, '#ffd23f', [3, .6, 2.6]);
  const cart = new THREE.Mesh(BOX, toy('#4fb0ff', { r: .4 })); cart.scale.set(1.3, .5, 1); cart.userData.dynamic = true; cart.position.set(s + 6, .9, z); k.add(cart);
  let riding = false; const go = () => { if (riding || k.P.ride) return; riding = true; k.say('🎢 The wooden toy coaster! Up, up, up... and WHEEE!', true); k.Sound.chime();
    const R = pathRide(k, path, { z, speed: 8, done: () => { riding = false; cart.position.set(s + 6, .9, z); k.disc && k.disc('toycoaster'); } });
    k.U.push(() => { if (k.P.ride === R) cart.position.set(k.P.x, k.P.y - .45, z); }); };
  k.tapIt(cart, go); k.G.interact.push({ x: s + 6, y: 0, layer: 'space', icon: '🎢', action: 'Toy coaster!', hintY: 2.4, run: go });
  // THE SPINNING TOP: hop on, it spins her round and round (she can jump off whenever she likes)
  const tx = s + 78, top = new THREE.Group(); top.position.set(tx, 0, -1.4); top.userData.dynamic = true; k.add(top);
  { const tb = K.makeBatch(); tb.put(CONE, 0, .7, 0, '#ff9a2e', [1.6, 1.4, 1.6], [Math.PI, 0, 0]); tb.put(CYL, 0, 1.5, 0, '#ffd23f', [1.7, .3, 1.7]); for (let j = 0; j < 6; j++) tb.put(BOX, Math.cos(j) * 1.2, 1.66, Math.sin(j) * 1.2, BRIGHT[j], [.4, .05, .4]); tb.put(CYL, 0, 2.1, 0, '#b07cff', [.15, .9, .15]); top.add(tb.mesh(K.shinyMat())); }
  k.plat(tx - 1.4, tx + 1.4, 1.66, { z: -1.4, step: true, stepMax: 1.8, onLand: () => { k.disc && k.disc('spintop'); k.Sound.chime(); } });
  k.U.push((dt, t) => { top.rotation.y = t * 4; top.rotation.z = Math.sin(t * 1.3) * .06; const P = k.P; if (!P.ride && P.grounded && Math.abs(P.y - 1.66) < .05 && Math.abs(P.x - tx) < 1.4) P.facing = Math.sin(t * 6) > 0 ? 1 : -1; });
  // THE JACK-IN-THE-BOX: stand on the lid, tap it, and BOING! up to the shelf of giant toys
  const jx = s + 92; b.put(BOX, jx, .9, -.6, '#4fb0ff', [2.2, 1.8, 2.2]); b.put(BOX, jx, 1.85, -.6, '#ff4f6a', [2.3, .1, 2.3]); b.put(CYL, jx + 1.25, 1.1, -.6, '#ffd23f', [.12, .6, .12], [0, 0, Math.PI / 2]);
  k.plat(jx - 1.1, jx + 1.1, 1.9, { z: -.6, step: true, stepMax: 1.95, pad: true, bounce: 14, nudge: 4.6, onLand: () => { k.disc && k.disc('jackbox'); } });
  b.put(BOX, jx + 8.3, 6.6, -1.2, '#c8a070', [9.4, .5, 3]); k.plat(jx + 3.6, jx + 13, 6.85, { z: -1.2 }); for (let j = 0; j < 4; j++) block(b, jx + 6.5 + j * 1.8, 6.85, -2, 1.2, BRIGHT[j]);
  const sb = K.makeBatch(); star(k, sb, jx + 11.5, 8, 'toyshelf'); k.add(sb.mesh(K.shinyMat()));
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['windmouse', s + 70 - k.X, -2.8]]);
  k.rocketSign(s + 108.6);
}

export const toyworld = { sections: [k => train(k), k => coaster(k)] };
