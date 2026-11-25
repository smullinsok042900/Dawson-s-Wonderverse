// ===================================================================
// upside.js (build 131): THE UPSIDE-DOWN WORLD, the first dimension behind a wormhole (dimensions.js).
// Over the meadow, 10.5 m up, hangs a whole upside-down land: grass, trees, houses, a castle and a river, all hanging down.
// GRAVITY REALLY FLIPS: step on a glowing ⬆️ arrow and she falls UP, lands on the underside of the sky land and walks on
// it head-down (main.js: G.gravSign; landing on `ceil` surfaces from below). A ⬇️ arrow up there flips her back and she
// floats gently down. The camera stays upright and eases a little lower (no spinning world), and the voice explains, so
// a five-year-old is never lost. Areas (built as she walks near them, freed when she flies away):
//   landing: the rocket, the first arrows, the river that flows along the sky, a waterfall that falls UP
//   area 2:  UPSIDE-DOWN TOWN (hanging houses with ledges to hop between), the HANGING CASTLE (its towers point down;
//            hop down its ledges to the star at the tip) and TWO-WAY ISLANDS (stand on top OR underneath), and the
//            GRAVITY SLIDE from the sky land down to the meadow (she turns the right way up on the way)
//   area 3:  the FLIP COASTER (it climbs a loop up onto the sky land, races along it upside down, and dives home)
//            and the SKY PLAYGROUND (bouncy clouds on the sky land: bounce DOWN and fall back up)
// Each area is a few batched meshes; everything uses the shared materials. Nothing here runs when she is elsewhere.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { toy } from './creatures.js';
import { populate } from './planet-life.js';

export const CEIL = 10.5; // where the sky land's underside is
const CYL = new THREE.CylinderGeometry(1, 1, 1, 14), BALL = new THREE.SphereGeometry(1, 16, 12), BOX = new THREE.BoxGeometry(1, 1, 1), CONE = new THREE.ConeGeometry(1, 1, 12);
CYL.userData.shared = BALL.userData.shared = BOX.userData.shared = CONE.userData.shared = true;
const FLIP = Math.PI;

// ---------- the gravity rules (one small step a frame, only here) ----------
function gravityRules(c, pads, X, X2) {
  const { G, P, Sound, api, say } = c; const st = { k: 0, lift: false, cool: 0, told: {}, gentle: false };
  const flip = s => {
    if (G.gravSign === s) return; G.gravSign = s; P.grounded = false; P.jumps = 1; P.vy = s < 0 ? 3.5 : -2; st.cool = 1; st.gentle = s > 0;
    Sound.whoosh ? Sound.whoosh() : Sound.chime(); api.burst(P.x, P.y + (s < 0 ? .4 : -.4), P.z, ['#b07cff', '#4fe0e0', '#ffffff'], 16, 3);
    if (s < 0 && !st.told.up) { st.told.up = 1; say('🙃 Wheee! You fall UP! Now you can walk on the sky land, upside down!', true); api.discover && api.discover('flipup'); }
    if (s > 0 && !st.told.down) { st.told.down = 1; say('🙂 Floating gently back down to the meadow!', true); }
  };
  c.U.push(dt => {
    if (P.layer !== 'space' || P.x < X - 40 || P.x > X2 + 40) return;
    st.cool = Math.max(0, st.cool - dt);
    const gs = G.gravSign === -1 ? -1 : 1;
    if (!P.ride && st.cool <= 0 && P.grounded) for (const p of pads) if (Math.abs(P.x - p.x) < 1.1 && (p.up ? gs > 0 && P.y < 1 : gs < 0 && Math.abs(P.y - p.y) < .3)) { flip(p.up ? -1 : 1); break; }
    // help: a soft speed limit while falling up or floating down, and never lost off the ends of the sky land
    if (gs < 0 && P.vy > 7) P.vy = 7;
    if (st.gentle) { if (P.vy < -7) P.vy = -7; if (P.grounded) st.gentle = false; }
    if (gs < 0 && !P.ride && (P.x < X - 36 || P.x > X2 + 36 || P.y > CEIL + 2)) flip(1);
    // her figure turns over (main.js reads G.flipK); the camera eases a little lower to look up at her
    const want = P.ride && P.ride.flipK != null ? P.ride.flipK : gs < 0 ? 1 : 0; st.k += (want - st.k) * Math.min(1, dt * 7); if (Math.abs(st.k - want) < .002) st.k = want; G.flipK = st.k;
    if (st.k > .002) { G.camLift = -3.4 * st.k; st.lift = true; } else if (st.lift) { G.camLift = 0; st.lift = false; }
  });
  const prev = c.g.userData.leave; c.g.userData.leave = () => { prev && prev(); G.gravSign = 1; G.flipK = 0; if (st.lift) G.camLift = 0; st.lift = false; st.k = 0; };
  return flip;
}

/** a glowing gravity arrow: on the meadow (up) or on the sky land (down) */
function arrowPad(c, add, x, up) {
  const y = up ? .03 : CEIL - .03, g = new THREE.Group(); g.position.set(x, y, 0); add(g);
  const disc = new THREE.Mesh(CYL, toy(up ? '#b07cff' : '#4fe0e0', { em: up ? '#b07cff' : '#4fe0e0', ei: .9 })); disc.scale.set(1, .06, 1); g.add(disc);
  const arrow = new THREE.Mesh(CONE, toy('#ffffff', { em: '#ffffff', ei: .6 })); arrow.scale.set(.32, .6, .32); arrow.position.y = up ? .9 : -.9; if (!up) arrow.rotation.z = FLIP; g.add(arrow);
  const glow = K.glow(up ? '#d0a8ff' : '#a8fff4', 3, .5); g.add(glow);
  c.U.push((dt, t) => { arrow.position.y = (up ? 1 : -1) * (.9 + Math.sin(t * 3) * .18); glow.material.opacity = .4 + Math.sin(t * 3) * .15; });
  c.G.interact.push({ x, y: up ? 0 : CEIL, layer: 'space', icon: up ? '⬆️' : '⬇️', action: up ? 'Fall up!' : 'Float down!', hintY: up ? 2.4 : -2.4,
    run: () => { const P = c.P; if (up && (c.G.gravSign || 1) > 0) { P.x = x; P.y = 0; P.grounded = true; } else if (!up && c.G.gravSign === -1) { P.x = x; P.y = CEIL; P.grounded = true; } } });
  return { x, y, up };
}

/** a tree that grows DOWN from the sky land (or one standing on its head on the meadow) */
export function hangTree(b, x, z, s, down = true) {
  const sgn = down ? -1 : 1, y0 = down ? CEIL : 0;
  b.put(CYL, x, y0 + sgn * 1.1 * s, z, '#8a5a3a', [.18 * s, 2.2 * s, .18 * s]);
  b.put(BALL, x, y0 + sgn * 2.7 * s, z, '#ff9ad8', [1.1 * s, .9 * s, 1.1 * s]);
  b.put(BALL, x + .5 * s, y0 + sgn * 2.4 * s, z + .3, '#c58cff', [.7 * s, .6 * s, .7 * s]);
  b.put(BALL, x - .5 * s, y0 + sgn * 2.5 * s, z - .2, '#ffc0e8', [.6 * s, .55 * s, .6 * s]);
}
/** a little house hanging from the sky land: walls, a roof that points DOWN, a door and windows */
function hangHouse(b, x, z, w, h, col, roof) {
  b.put(BOX, x, CEIL - h / 2, z, col, [w, h, w * .8]);
  b.put(CONE, x, CEIL - h - .9, z, roof, [w * .75, 1.8, w * .65], [FLIP, Math.PI / 4, 0]);
  b.put(BOX, x, CEIL - .75, z + w * .4 + .01, '#7a4a2a', [.7, 1.4, .05]);
  for (const s of [-1, 1]) b.put(BOX, x + s * w * .28, CEIL - h * .55, z + w * .4 + .01, '#fff3a6', [.5, .5, .05]);
  b.put(CYL, x + w * .3, CEIL - h - .6, z - .2, '#c8a8ff', [.2, 1.2, .2]); // a chimney pointing down
}

// =================== the landing area (space.js calls this for its ground) ===================
export function* upsideLanding(c) {
  const { matte, props, soft, X, PW, MID, add, U } = c, X2 = X + PW;
  // the meadow: soft pastel hills, flowers, roots poking up (some trees here grow on their heads!)
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => (K.fbm2(x * .03, z * .03, 3) - .5) * 1.4 + K.sstep(-14, -40, z) * K.fbm2(x * .02 + 7, z * .02, 3) * 9,
    color: (x, z, h, ny, o) => { const n = K.fbm2(x * .4, z * .4, 3), fl = K.sstep(.72, .76, K.noise2(x * 1.3, z * 1.3)); K.ramp(['#7ad08a', '#a8e8a0', '#d8f5b8'], .3 + n * .5, o); if (fl > 0) o.lerp(new THREE.Color(['#ff9ad8', '#fff07a', '#b9a0ff'][Math.floor(K.hash2(x, z) * 3)]), fl * .8); o.multiplyScalar(.85 + .2 * ny); } });
  yield;
  // THE SKY LAND: its underside is a field of grass hanging over everything, with hanging hills further back
  const under = new THREE.PlaneGeometry(PW + 80, 64, 120, 32); under.rotateX(Math.PI / 2);
  { const p = under.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + MID, z = p.getZ(i) - 30; p.setXYZ(i, x, CEIL - K.sstep(-6, -26, z) * (K.fbm2(x * .025, z * .04, 3) * 9 + 1), z); } under.computeVertexNormals(); }
  matte.put(under, 0, 0, 0, (px, py, pz, nx, ny, nz, o) => { const n = K.fbm2(px * .5, pz * .5, 3); K.ramp(['#5fb878', '#8fd890', '#c8f0a8'], .3 + n * .5, o); if (K.noise2(px * 1.6, pz * 1.6) > .78) o.set(['#ff9ad8', '#fff07a'][Math.floor(K.hash2(px, pz) * 2)]); if (pz > 1) o.set('#8a6a4a'); });
  props.put(BOX, MID, CEIL + .35, 1.2, '#6fbf7a', [PW + 80, .7, 1.6]); props.put(BOX, MID, CEIL + .75, 1.2, '#8a6a4a', [PW + 80, .2, 1.5]); // the front rim of the sky land: grass and a strip of earth
  for (let k = 0; k < 40; k++) props.put(CYL, X - 38 + k * ((PW + 76) / 40), CEIL - .25, 2.6, '#6a4a2a', [.06, .5 + (k % 3) * .2, .06]); // dangling roots
  yield;
  // hanging trees all along the sky land, houses near the landing, and mountains hanging far back
  for (let k = 0; k < 46; k++) { const x = X - 30 + k * ((PW + 60) / 46) + Math.sin(k * 7.1) * 2, z = -4.5 - Math.abs(Math.sin(k * 3.7)) * 9; hangTree(props, x, z, .8 + Math.abs(Math.sin(k * 1.3)) * .6); }
  for (let k = 0; k < 9; k++) props.put(CONE, X - 20 + k * 45, CEIL + 6 - 18 - (k % 3) * 4, -48 - (k % 2) * 8, ['#b9a0ff', '#9a80e0', '#c8b0ff'][k % 3], [14 + (k % 3) * 4, 26 + (k % 2) * 8, 14], [FLIP, 0, 0]);
  hangHouse(props, X + 62, -5.5, 3.4, 3.2, '#ffd0e8', '#7a5ae0'); hangHouse(props, X + 70, -7, 2.8, 2.6, '#c8f0ff', '#ff6fa5');
  for (let k = 0; k < 6; k++) hangTree(props, X + 14 + k * 17, -7 - (k % 2) * 3, .7, false); // trees standing on their heads
  for (let k = 0; k < 14; k++) soft.put(BALL, X - 20 + k * 26, 8.5 + (k % 3) * 1.2, -12 - (k % 4) * 3, '#ffffff', [3 + (k % 3), 1.1, 2]);
  yield;
  // the river that flows along the sky land, and a waterfall that falls UP into it
  const wc = document.createElement('canvas'); wc.width = 128; wc.height = 16; { const g2 = wc.getContext('2d'); g2.fillStyle = '#5ac8ff'; g2.fillRect(0, 0, 128, 16); g2.fillStyle = '#c8f4ff'; for (let k = 0; k < 10; k++) g2.fillRect(k * 13 + (k % 3) * 2, 3 + (k % 4) * 3, 7, 2); }
  const wt = new THREE.CanvasTexture(wc); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set((PW + 80) / 8, 1);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(PW + 80, 3), new THREE.MeshBasicMaterial({ map: wt })); river.rotation.x = Math.PI / 2; river.position.set(MID, CEIL - .06, -9); add(river);
  const ft = wt.clone(); ft.repeat.set(2, 4); ft.needsUpdate = true;
  const fall = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, CEIL, 16, 1, true), new THREE.MeshBasicMaterial({ map: ft, transparent: true, opacity: .85 })); fall.position.set(X + 84, CEIL / 2, -9); add(fall);
  props.put(CYL, X + 84, .05, -9, '#5ac8ff', [3, .1, 3]); // the pond it rises from
  U.push(dt => { wt.offset.x -= dt * .25; ft.offset.y -= dt * .6; });
  c.tapIt(fall, () => c.fact('💧 A waterfall that falls UP! In the Upside-Down World, water flows up into the sky river.', 'upfall'), X + 84, 'upfall');
  // the gravity arrows near the landing, and the rules
  const pads = [arrowPad(c, add, X + 20, true), arrowPad(c, add, X + 46, false), arrowPad(c, add, X + 96, true), arrowPad(c, add, X + 104, false)];
  c.G.platforms.push({ a: X - 38, b: X2 + 38, y: CEIL, layer: 'space', ceil: true, z: 0 }); // the whole underside of the sky land is walkable
  KIT.flip = gravityRules(c, pads, X, X2); KIT.pads = pads;
  return H;
}
const KIT = { flip: null, pads: null };

// ---------- helpers for the areas ----------
export const tubeAlong = (b, pts, r, col, z = 0) => { const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, z))); const g = new THREE.TubeGeometry(curve, Math.max(24, pts.length * 10), r, 6, false); b.put(g, 0, 0, 0, col); g.dispose(); };
/** a ride along a 2D path: she moves along it, seated; flipK turns her over where the path is upside down */
export function pathRide(k, pts, { z = -1.2, speed = 7, flipAt = null, done }) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, z))), L = curve.getLength(), P = k.P, G = k.G, v = new THREE.Vector3();
  const R = { type: 'upride', t: 0, noExit: true, stick: true, flipK: 0 }; P.ride = R; P.vx = P.vy = 0; let u = 0;
  k.U.push(dt => { if (R.over) return; if (P.ride !== R) { R.over = true; R.flipK = null; return; }
    u = Math.min(1, u + dt * speed / L); curve.getPointAt(u, v); P.x = v.x; P.y = v.y; P.z = z; P.facing = 1; R.flipK = flipAt ? flipAt(u, v.y) : 0;
    if (u >= 1) { R.over = true; P.ride = null; P.vy = 0; P.grounded = false; done && done(); } });
  return R;
}

// =================== area 2: UPSIDE-DOWN TOWN, the HANGING CASTLE, TWO-WAY ISLANDS, the GRAVITY SLIDE ===================
function town(k) {
  const s = k.s0, b = K.makeBatch(), glowB = K.makeBatch(), cp = (a, c2, y, o = {}) => k.plat(a, c2, y, { ceil: true, z: -.6, ...o });
  // three hanging houses, each with a porch ledge to hop down onto (head-down) and a star on the porch
  for (const [i, [x, w, h, col, roof]] of [[s + 10, 3.4, 3, '#ffe0a0', '#ff6fa5'], [s + 20, 3, 3.8, '#c8f0ff', '#7a5ae0'], [s + 30, 3.6, 2.6, '#ffd0f0', '#4fb0ff']].entries()) {
    hangHouse(b, x, -3.6, w, h, col, roof);
    const ly = CEIL - h + .2; b.put(BOX, x, ly + .25, -.6, '#c89a6a', [3.2, .5, 1.6]); cp(x - 1.6, x + 1.6, ly);
    star(k, glowB, x + .9, ly - 1.1, 'housestar' + i);
  }
  // THE HANGING CASTLE: towers point down; hop down its ledges (1.5, 3, 4.5 and 6 m below the sky land) to the star at the very tip
  const cx = s + 52; b.put(BOX, cx, CEIL - 1.6, -5, '#e8e0ff', [14, 3.2, 5]);
  for (const [dx, hh] of [[-5.5, 6], [0, 7.4], [5.5, 6]]) { b.put(CYL, cx + dx, CEIL - hh / 2, -5, '#f0eaff', [1.6, hh, 1.6]); b.put(CONE, cx + dx, CEIL - hh - 1.2, -5, '#7a5ae0', [1.9, 2.4, 1.9], [FLIP, 0, 0]); b.put(CYL, cx + dx, CEIL - hh - 2.6, -5, '#ffd23f', [.04, .8, .04]); }
  for (let w = 0; w < 7; w++) b.put(BOX, cx - 6 + w * 2, CEIL - 2.4, -2.45, '#fff3a6', [.6, .9, .05]);
  for (const [j, y] of [CEIL - 1.5, CEIL - 3, CEIL - 4.5, CEIL - 6].entries()) { const a = cx - 7 + j * 3.4, c2 = a + 3; b.put(BOX, (a + c2) / 2, y + .3, -.6, '#d8ccff', [3, .6, 1.8]); cp(a, c2, y); }
  star(k, glowB, cx + 5.9, CEIL - 7.3, 'castletip');
  KIT.pads && k.G.interact.push({ x: cx + 5.9, y: CEIL - 6, layer: 'space', icon: '⬇️', action: 'Float down!', hintY: -2.4, run: () => KIT.flip && KIT.flip(1) });
  // TWO-WAY ISLANDS: stand on top (normal gravity) or underneath (upside down). A bouncy pad on the meadow below.
  for (const [j, x] of [s + 70, s + 80].entries()) {
    const y = 4.6 + j * .5; b.put(BALL, x, y, -.8, '#a8e8a0', [3.2, .7, 2]); b.put(BALL, x, y - .5, -.8, '#8a6a4a', [2.6, .6, 1.7]); hangTree(b, x + 1.2, -1.4, .5, false); // (a little tree on top...)
    b.put(CYL, x - 1, y + .6 + .9, -1.4, '#8a5a3a', [.12, 1.8, .12]); b.put(BALL, x - 1, y + .6 + 2, -1.4, '#ffb0e0', .7); b.put(CYL, x + 1, y - 1.1 - .7, -1.4, '#8a5a3a', [.12, 1.4, .12]); b.put(BALL, x + 1, y - 1.1 - 1.6, -1.4, '#c58cff', .6); // (...and one hanging underneath)
    k.plat(x - 2.8, x + 2.8, y + .6, { z: -.6 }); cp(x - 2.4, x + 2.4, y - 1.1);
    b.put(CYL, x - 4.4, .12, -.6, '#ff6fd8', [1, .24, 1]); k.plat(x - 5.2, x - 3.6, .24, { pad: true, bounce: 13.6 + j * .8, z: -.6, step: true });
  }
  // THE GRAVITY SLIDE: from the sky land down to the meadow; she turns the right way up on the way down
  const sx = s + 92, path = [[sx, CEIL], [sx + 3, CEIL - 1.2], [sx + 7, 7], [sx + 11, 3.6], [sx + 15, 1.2], [sx + 18, .2]];
  tubeAlong(b, path.map(([x, y]) => [x, y - .25]), .5, '#ff6fd8', -1.2); tubeAlong(b, path.map(([x, y]) => [x, y - .2]), .12, '#ffffff', -.55); tubeAlong(b, path.map(([x, y]) => [x, y - .2]), .12, '#ffffff', -1.85);
  let sliding = false; const startSlide = () => { if (sliding || k.P.ride || k.G.gravSign !== -1) return; sliding = true; k.Sound.whoosh ? k.Sound.whoosh() : k.Sound.chime(); k.say('🛝 The GRAVITY SLIDE! Down you go, and you turn the right way up!', true);
    pathRide(k, path, { z: -1.2, speed: 8, flipAt: u => 1 - K.sstep(.25, .7, u), done: () => { k.G.gravSign = 1; sliding = false; k.disc && k.disc('gravityslide'); } }); };
  k.G.interact.push({ x: sx, y: CEIL, layer: 'space', icon: '🛝', action: 'Gravity slide!', hintY: -2.4, run: startSlide });
  k.U.push(() => { const P = k.P; if (!sliding && k.G.gravSign === -1 && P.grounded && !P.ride && Math.abs(P.y - CEIL) < .1 && P.x > sx - .3 && P.x < sx + 1 && P.vx > .5) startSlide(); });
  k.add(b.mesh(K.shinyMat())); k.add(glowB.mesh(K.shinyMat()));
  populate(k, [['flipbun', s + 40 - k.X, -2.8], ['dropsy', s + 64 - k.X, -2.6]]);
  k.rocketSign(s + 2);
}
/** a star to collect (it floats; tap it or touch it) */
export function star(k, b, x, y, id) {
  const m = new THREE.Mesh(BALL, toy('#ffd23f', { em: '#ffb000', ei: .8 })); m.scale.set(.35, .35, .12); m.position.set(x, y, -.6); k.add(m);
  let got = false; const take = () => { if (got) return; got = true; m.visible = false; k.Sound.chime(); k.api.burst(x, y, -.6, ['#ffd23f', '#ffffff'], 14, 3); k.disc && k.disc(id); };
  k.tapIt(m, take); k.U.push((dt, t) => { if (got) return; m.rotation.y = t * 2; const P = k.P; if (Math.abs(P.x - x) < .9 && Math.abs(P.y + (k.G.gravSign === -1 ? -.8 : .8) - y) < 1.2) take(); });
}

// =================== area 3: the FLIP COASTER and the SKY PLAYGROUND ===================
function coaster(k) {
  const s = k.s0, b = K.makeBatch(), z = -2.4;
  const T = CEIL - .9, path = [[s + 6, .7], [s + 14, .9], [s + 22, 3], [s + 27, 6.5], [s + 30, T - 1.2], [s + 34, T], [s + 42, T], [s + 56, T - .2], [s + 66, T], [s + 72, T - 1.4], [s + 76, 6], [s + 81, 2.8], [s + 88, 1], [s + 94, .7]];
  tubeAlong(b, path.map(([x, y]) => [x, y - .35]), .16, '#ff6fd8', z - .45); tubeAlong(b, path.map(([x, y]) => [x, y - .35]), .16, '#ff6fd8', z + .45);
  for (let j = 0; j < path.length; j += 1) { const [x, y] = path[j]; if (y < CEIL / 2) b.put(CYL, x, (y - .4) / 2, z, '#b07cff', [.12, Math.max(.1, y - .4), .12]); else b.put(CYL, x, (CEIL + y) / 2, z, '#4fe0e0', [.12, Math.max(.1, CEIL - y), .12]); }
  b.put(BOX, s + 6, .3, z, '#ffd23f', [3, .6, 2.4]); // the station
  const cart = new THREE.Mesh(BOX, toy('#ff4f9a', { r: .4 })); cart.scale.set(1.3, .5, 1); cart.userData.dynamic = true; k.add(cart); cart.position.set(s + 6, .9, z);
  let riding = false; const go = () => { if (riding || k.P.ride || k.G.gravSign === -1) return; riding = true; k.say('🎢 The FLIP COASTER! Up the loop and along the sky land, UPSIDE DOWN! Hold on!', true); k.Sound.chime();
    const R = pathRide(k, path, { z, speed: 9, flipAt: (u, y) => K.sstep(CEIL - 5, CEIL - 1.4, y), done: () => { riding = false; cart.position.set(s + 6, .9, z); cart.rotation.z = 0; k.disc && k.disc('flipcoaster'); } });
    k.U.push(() => { if (k.P.ride !== R) return; cart.position.set(k.P.x, k.P.y + (R.flipK > .5 ? .45 : -.45), z); cart.rotation.z = R.flipK * Math.PI; }); };
  k.tapIt(cart, go); k.G.interact.push({ x: s + 6, y: 0, layer: 'space', icon: '🎢', action: 'Flip coaster!', hintY: 2.4, run: go });
  // the SKY PLAYGROUND: bouncy clouds on the sky land (bounce DOWN, then fall back up) and hanging swings
  for (const [j, x] of [s + 98, s + 103].entries()) { b.put(BALL, x, CEIL - .3, -.6, '#ffffff', [1.6, .5, 1.2]); k.plat(x - 1.4, x + 1.4, CEIL - .55, { ceil: true, pad: true, bounce: 12 + j * 2, z: -.6 }); }
  for (const x of [s + 100.5, s + 107]) { for (const d of [-.6, .6]) b.put(CYL, x + d, CEIL - 2.2, -4, '#c8a8ff', [.04, 4.4, .04]); b.put(BOX, x, CEIL - 4.4, -4, '#ff6fd8', [1.6, .15, .7]); b.put(BOX, x, 0, -4, '#8a6a4a', [2.6, .06, .2]); }
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['flipbun', s + 100 - k.X, -2.8]]);
  k.rocketSign(s + 108.6);
}

export const upside = { sections: [k => town(k), k => coaster(k)] };
