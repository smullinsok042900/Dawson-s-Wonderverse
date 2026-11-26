// ===================================================================
// wacky.js (build 137): THE WACKY GRAVITY WORLD, the fifth dimension behind a wormhole (dimensions.js).
// Gravity changes from place to place (main.js: G.gravScale for how strong, G.gravSign for which way):
//   landing: MOON-BOUNCE MEADOW (gravity almost gone: giant floaty jumps between floating rocks) and the ANTI-GRAVITY LIFT
//            (a glowing column: inside it she floats UP to a sky platform with a star)
//   area 2:  the FLIP CORRIDOR (walk into a stripe and gravity flips: floor, ceiling, floor, ceiling...) and the GRAVITY WHEEL
//            (a giant ring she rides all the way round, upside down at the top)
//   area 3:  the FLOATING OBSTACLE COURSE (low gravity, moving platforms) up to a star, and the GRAVITY WELL launcher
// Each zone is shown by its colour (blue = floaty, purple = up, orange = flip), and the voice says what it does.
// Help: speeds are gently limited, she can never be lost, and leaving the world puts gravity back to normal.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { toy } from './creatures.js';
import { populate } from './planet-life.js';
import { tubeAlong, pathRide, star } from './upside.js';

const CYL = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true), DISC = new THREE.CylinderGeometry(1, 1, 1, 18), BALL = new THREE.SphereGeometry(1, 14, 10), BOX = new THREE.BoxGeometry(1, 1, 1), ROCK = new THREE.DodecahedronGeometry(1, 0);
for (const g of [CYL, DISC, BALL, BOX, ROCK]) g.userData.shared = true;
const TOYS = {}; const toyMat = col => TOYS[col] || (TOYS[col] = toy(col, { r: .6 })); // (one shared material per colour)
const TORUS = new THREE.TorusGeometry(1, .045, 6, 30); TORUS.userData.shared = true;
let ZONE_MAT = {}; const zoneMat = col => ZONE_MAT[col] || (ZONE_MAT[col] = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .35, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }));

// ---------- the zones (one small step a frame, only in this world) ----------
const ZONES = []; // { a, b, y0, y1, kind: 'floaty' | 'lift' | 'flip', ... }
function rules(c, X, X2) {
  const { G, P, say, Sound } = c; const st = { k: 0, lift: false, told: {}, inLift: false };
  c.U.push(dt => {
    if (P.layer !== 'space' || P.x < X - 40 || P.x > X2 + 40) return;
    let scale = 1, sign = 1;
    for (const z of ZONES) { if (P.x < z.a || P.x > z.b || P.y < z.y0 - 1 || P.y > z.y1) continue;
      if (z.kind === 'floaty') { scale = z.g; if (!st.told.floaty) { st.told.floaty = 1; say('🌙 Floaty gravity! Jump and you float up, up, up!', true); } }
      if (z.kind === 'lift') { scale = .35; if (P.y >= z.top) st.over = true; else if (P.grounded && P.y < z.top - 1.5) st.over = false; sign = st.over ? 1 : -1; /* (once she is up she drifts down onto the sky platform: no more push until she is back on the ground) */ if (!st.told.lift) { st.told.lift = 1; say('⬆️ The anti-gravity lift! It floats you up to the sky platform!', true); } } }
    if (st.over && !ZONES.some(z => z.kind === 'lift' && P.x >= z.a && P.x <= z.b)) st.over = false;
    if (G.wackyFlip) sign = G.wackyFlip;
    if (sign < 0 && G.gravSign !== -1 && P.grounded && !P.ride) { P.grounded = false; P.vy = 2; } // (lift her off the ground, as the upside-down arrows do)
    G.gravScale = scale; G.gravSign = sign;
    if (sign < 0 && P.vy > 6) P.vy = 6; if (scale < 1 && P.vy < -9) P.vy = -9;
    const want = P.ride && P.ride.flipK != null ? P.ride.flipK : G.wackyFlip === -1 ? 1 : 0; st.k += (want - st.k) * Math.min(1, dt * 7); if (Math.abs(st.k - want) < .002) st.k = want; G.flipK = st.k;
    if (st.k > .002) { G.camLift = -3 * st.k; st.lift = true; } else if (st.lift) { G.camLift = 0; st.lift = false; }
  });
  const prev = c.g.userData.leave; c.g.userData.leave = () => { prev && prev(); G.gravSign = 1; G.gravScale = 1; G.flipK = 0; G.wackyFlip = 0; if (st.lift) G.camLift = 0; st.lift = false; st.k = 0; };
}
/** a see-through coloured volume that shows a zone */
function zoneBox(add, a, b, y0, y1, col, z = -1) { const m = new THREE.Mesh(BOX, zoneMat(col)); m.scale.set(b - a, y1 - y0, 4); m.position.set((a + b) / 2, (y0 + y1) / 2, z); m.userData.dynamic = true; add(m); return m; }

// =================== the landing area (space.js calls this for its ground) ===================
export function* wackyLanding(c) {
  const { matte, props, X, PW, MID, add, U, G, P, tapIt, fact, Sound, api, say } = c;
  const kit = { add, Sound, api, tapIt, U, P, G, say, disc: id => api.discover && api.discover(id) };
  ZONES.length = 0; G.wackyFlip = 0;
  // the ground: swirly purple-and-teal grass with spiral patterns, floating boulders everywhere in the sky
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => (K.fbm2(x * .04, z * .04, 3) - .5) * 1 + K.sstep(-12, -40, z) * K.fbm2(x * .03 + 9, z * .03, 3) * 9,
    color: (x, z, h, ny, o) => { const sp = Math.sin(Math.hypot((x % 30) - 15, z + 20) * .8 + Math.atan2(z + 20, (x % 30) - 15) * 2); K.ramp(['#7a5ae0', '#4fd8c8', '#b0f0e0'], .4 + sp * .25 + K.fbm2(x * .2, z * .2, 2) * .3, o); o.multiplyScalar(.85 + .2 * ny); } });
  yield;
  for (let k = 0; k < 40; k++) props.put(ROCK, X - 30 + k * 10, 8 + Math.abs(Math.sin(k * 2.3)) * 14, -14 - (k % 5) * 6, ['#8a7ab0', '#6a8ab0', '#b08ac0'][k % 3], 1 + (k % 4) * .8, [k, k * 2, 0]); // floating boulders far back
  yield;
  // MOON-BOUNCE MEADOW: gravity almost gone; floating rocks to hop across (the rocks bob gently)
  ZONES.push({ a: X + 16, b: X + 42, y0: -1, y1: 30, kind: 'floaty', g: .22 }); zoneBox(add, X + 16, X + 42, 0, 14, '#4fb8ff');
  const rocks = []; for (const [j, [dx, y]] of [[20, 2.5], [25, 4.5], [30, 6.8], [35, 9], [39, 11.5]].entries()) { const m = new THREE.Mesh(ROCK, toyMat(['#b0a0e0', '#a0c0e0'][j % 2])); m.scale.set(1.6, .7, 1.3); m.position.set(X + dx, y, -.6); m.userData.dynamic = true; add(m);
    const p = { a: X + dx - 1.4, b: X + dx + 1.4, y: y + .5, layer: 'space', z: -.6 }; G.platforms.push(p); rocks.push({ m, p, y0: y, ph: j }); }
  U.push((dt, t) => { for (const r of rocks) { const on = P.grounded && !P.ride && Math.abs(P.y - r.p.y) < .06 && P.x >= r.p.a && P.x <= r.p.b; const y = r.y0 + Math.sin(t * .8 + r.ph) * .3; r.m.position.y = y; r.p.y = y + .5; if (on) P.y = r.p.y; } });
  const sb = K.makeBatch(); star(kit, sb, X + 39, 13.5, 'moonbounce');
  // THE ANTI-GRAVITY LIFT: walk into the purple column and float up to the sky platform
  const lx = X + 52, top = 12; ZONES.push({ a: lx - 1.3, b: lx + 1.3, y0: -1, y1: top + 1.5, kind: 'lift', top: top + .8 }); zoneBox(add, lx - 1.3, lx + 1.3, 0, top + 1.5, '#b07cff');
  props.put(DISC, lx, .05, -1, '#b07cff', [1.6, .1, 1.6]); props.put(BOX, lx + 4, top - .3, -1, '#c8b8ff', [7, .6, 2.4]); G.platforms.push({ a: lx - 1.2, b: lx + 7.5, y: top, layer: 'space', z: -1 });
  star(kit, sb, lx + 6, top + 1.2, 'antigravity'); add(sb.mesh(K.shinyMat()));
  // a slide back down from the sky platform
  const path = [[lx + 7.5, top], [lx + 10, top - 1.5], [lx + 14, 6], [lx + 18, 2], [lx + 21, .2]];
  const tb = K.makeBatch(); tubeAlong(tb, path.map(([x, y]) => [x, y - .3]), .5, '#4fd8c8', -1.2); add(tb.mesh(K.shinyMat()));
  let sliding = false; const slide = () => { if (sliding || P.ride) return; sliding = true; Sound.chime(); pathRide(kit, path, { z: -1.2, speed: 8, done: () => { sliding = false; kit.disc('wackyslide'); } }); };
  G.interact.push({ x: lx + 7.5, y: top, layer: 'space', icon: '🛝', action: 'Slide down!', hintY: 2.4, run: slide });
  U.push(() => { if (!sliding && P.grounded && !P.ride && Math.abs(P.y - top) < .1 && P.x > lx + 6.9 && P.vx > .5) slide(); });
  tapIt(rocks[0].m, () => fact('🌙 With less gravity, everything feels lighter, like on the Moon: your jumps go much higher!', 'lowgravity'), X + 20, 'lowgravity');
  rules(c, X, X + PW);
  return H;
}

// =================== area 2: the FLIP CORRIDOR and the GRAVITY WHEEL ===================
function corridor(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P, G = k.G, CE = 8;
  // the corridor: a floor and a ceiling 8 m up; orange stripes flip gravity as she walks through them
  b.put(BOX, s + 30, CE + .3, -1.5, '#4fd8c8', [44, .6, 4]); G.platforms.push({ a: s + 8, b: s + 52, y: CE, layer: 'space', ceil: true, z: 0 });
  for (const [j, x] of [s + 14, s + 24, s + 34, s + 44].entries()) { zoneBox(k.add, x - .6, x + .6, 0, CE, '#ff9a2e', -1.2); b.put(BOX, x, .02, -1.2, '#ff9a2e', [1.2, .04, 4]); }
  let lastX = null; const stripes = [s + 14, s + 24, s + 34, s + 44];
  k.U.push(() => { if (P.ride || P.layer !== 'space') { lastX = P.x; return; } if (lastX != null) for (const x of stripes) if ((lastX - x) * (P.x - x) < 0 && P.x > s + 8 && P.x < s + 52) {
        G.wackyFlip = G.wackyFlip === -1 ? 0 : -1; P.grounded = false; P.vy = G.wackyFlip === -1 ? 3 : -2; k.Sound.whoosh ? k.Sound.whoosh() : k.Sound.chime(); k.api.burst(P.x, P.y + .5, P.z, ['#ff9a2e', '#ffffff'], 12, 3);
        if (!G._wfTold) { G._wfTold = 1; k.say('🔁 FLIP! Gravity changed: now you walk on the ceiling! The next stripe flips you back!', true); } k.disc && k.disc('flipcorridor'); }
      if ((P.x < s + 6 || P.x > s + 54) && G.wackyFlip) { G.wackyFlip = 0; } lastX = P.x; });
  // THE GRAVITY WHEEL: a giant ring; she rides all the way round (upside down at the top)
  const wx = s + 76, R = 6, cy = R + .6, ring = new THREE.TorusGeometry(R + .5, .35, 10, 48); b.put(ring, wx, cy, -1.6, '#b07cff'); ring.dispose();
  for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; b.put(BOX, wx + Math.cos(a) * R / 2, cy + Math.sin(a) * R / 2, -1.6, '#c8b8ff', [.2, R, .2], [0, 0, a + Math.PI / 2]); }
  b.put(BOX, wx, .3, -1.6, '#ffd23f', [2.4, .6, 2]);
  const pts = []; for (let j = 0; j <= 40; j++) { const a = -Math.PI / 2 - j / 40 * Math.PI * 2; pts.push([wx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  let spinning = false; const go = () => { if (spinning || P.ride) return; spinning = true; k.say('🎡 The gravity wheel! All the way round, upside down at the top!', true); k.Sound.chime();
    pathRide(k, [[wx - .5, .6], ...pts, [wx + .5, .6]], { z: -1.2, speed: 6, flipAt: (u, y) => K.sstep(cy, cy + R * .9, y), done: () => { spinning = false; k.disc && k.disc('gravitywheel'); } }); };
  k.G.interact.push({ x: wx, y: 0, layer: 'space', icon: '🎡', action: 'Gravity wheel!', hintY: 2.4, run: go });
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['zoomzoom', s + 90 - k.X, -2.6], ['floatyfox', s + 60 - k.X, -2.8]]);
  k.rocketSign(s + 2);
}

// =================== area 3: the FLOATING OBSTACLE COURSE and the GRAVITY WELL ===================
function course(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P;
  ZONES.push({ a: s + 6, b: s + 70, y0: -1, y1: 40, kind: 'floaty', g: .35 }); zoneBox(k.add, s + 6, s + 70, 0, 16, '#4fb8ff', -2.4);
  // moving platforms (side to side and up and down) up to a star
  const mov = [];
  for (const [j, [x, y, ax, ay]] of [[s + 12, 2, 2, 0], [s + 20, 4, 0, 1.5], [s + 28, 6, 2.5, 0], [s + 36, 8, 0, 2], [s + 44, 10.5, 2, 0], [s + 52, 13, 0, 0]].entries()) {
    const m = new THREE.Mesh(BOX, toyMat(['#ff9a2e', '#4fd8c8', '#b07cff'][j % 3])); m.scale.set(3, .5, 2); m.userData.dynamic = true; k.add(m);
    const p = { a: x - 1.5, b: x + 1.5, y, layer: 'space', z: -.6 }; k.G.platforms.push(p); mov.push({ m, p, x, y, ax, ay, ph: j }); }
  k.U.push((dt, t) => { for (const o of mov) { const on = P.grounded && !P.ride && Math.abs(P.y - o.p.y) < .06 && P.x >= o.p.a && P.x <= o.p.b;
      const nx = o.x + Math.sin(t * .6 + o.ph) * o.ax, ny = o.y + Math.sin(t * .7 + o.ph) * o.ay, dx = nx - (o.p.a + 1.5);
      o.p.a = nx - 1.5; o.p.b = nx + 1.5; o.p.y = ny; o.m.position.set(nx, ny - .25, -.6); if (on) { P.x += dx; P.y = ny; } } });
  star(k, b, s + 52, 14.6, 'floatcourse');
  // THE GRAVITY WELL: a swirly pad: step on it and it launches you super high (then you float down slowly)
  const gx = s + 84; b.put(DISC, gx, .1, -.6, '#7a5ae0', [1.8, .2, 1.8]); for (let j = 0; j < 3; j++) b.put(TORUS, gx, .25, -.6, '#4fd8c8', 1.4 - j * .4, [Math.PI / 2, 0, 0]);
  ZONES.push({ a: gx - 6, b: gx + 6, y0: -1, y1: 40, kind: 'floaty', g: .3 }); zoneBox(k.add, gx - 2, gx + 2, 0, 20, '#4fb8ff', -2.4);
  k.plat(gx - 1.6, gx + 1.6, .2, { z: -.6, pad: true, bounce: 16, step: true, stepMax: .3, onLand: () => { k.disc && k.disc('gravitywell'); } });
  for (let j = 0; j < 4; j++) star(k, b, gx, 8 + j * 4, 'wellstar' + j);
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['floatyfox', s + 96 - k.X, -2.8]]);
  k.rocketSign(s + 108.6);
}

export const wackyworld = { sections: [k => corridor(k), k => course(k)] };
