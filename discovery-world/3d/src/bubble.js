// ===================================================================
// bubble.js (build 133): THE BUBBLE UNIVERSE, the third dimension behind a wormhole (dimensions.js).
// A soft, floaty world (a very light pull) made of giant bubbles: foam hills, bubbles drifting in a pastel sky.
//   landing: the BUBBLE BLOWER (tap it: she floats INSIDE a giant bubble and steers it with the arrows; JUMP pops it and she
//            drifts gently down), BUBBLE TRAMPOLINES, stars to reach by bubble, bubbles drifting overhead
//   area 2:  the BUBBLE HOUSES: little houses on top of giant bubbles that bob up and down (their floors really move and
//            carry her) — hop from house to house up to the cloud, and the BUBBLE SLIDE back down
//   area 3:  the BUBBLE BUS (a giant bubble that floats her along a loopy route between floating islands) and the
//            BUBBLE POP GARDEN (touch the little bubbles to pop them: each pop a note)
// Bubbles share ONE see-through material and the static ones are batched; only a handful move on their own.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { toy } from './creatures.js';
import { populate } from './planet-life.js';
import { tubeAlong, pathRide, star } from './upside.js';

const CYL = new THREE.CylinderGeometry(1, 1, 1, 16), BALL = new THREE.SphereGeometry(1, 20, 14), BOX = new THREE.BoxGeometry(1, 1, 1), CONE = new THREE.ConeGeometry(1, 1, 12);
CYL.userData.shared = BALL.userData.shared = BOX.userData.shared = CONE.userData.shared = true;
let FILM = null; // the one see-through, softly shining bubble material (shared by every bubble)
const film = () => FILM || (FILM = new THREE.MeshStandardMaterial({ color: '#e8f6ff', emissive: '#a8d8ff', emissiveIntensity: .12, roughness: .08, metalness: .1, transparent: true, opacity: .32, depthWrite: false }));
const PASTEL = ['#ffc8e8', '#c8e8ff', '#d8ffc8', '#fff0b8', '#e0d0ff'];
const stick = k => (k.api.stick ? k.api.stick() : { x: 0, y: 0 });

/** a soft bubble the player rides inside: steer with the arrows, JUMP pops it */
function bubbleRide(k, x0, opt = {}) {
  const P = k.P, G = k.G, m = new THREE.Mesh(BALL, film()); m.scale.setScalar(1.3); m.userData.dynamic = true; k.add(m);
  const R = { type: 'bubble', t: 0, noExit: false, stick: true, vx: 0, vy: 0, onJump: () => pop() }; P.ride = R; P.vx = P.vy = 0; P.x = x0; P.y = Math.max(P.y, .2);
  let over = false; const pop = () => { if (over) return; over = true; m.visible = false; k.add && k.Sound.pop ? k.Sound.pop() : k.Sound.click(); k.api.burst(P.x, P.y + .6, P.z, ['#ffffff', '#c8e8ff', '#ffc8e8'], 16, 3); if (P.ride === R) { P.ride = null; P.vy = 0; P.grounded = false; P.floaty = true; } };
  k.U.push((dt, t) => { if (over) return; if (P.ride !== R) { pop(); return; }
    const st = stick(k); R.vx += (st.x * 4 - R.vx) * Math.min(1, dt * 2); R.vy += ((st.y * 3 + .45) - R.vy) * Math.min(1, dt * 2);
    P.x += R.vx * dt; P.y = Math.max(.2, Math.min(opt.top || 16, P.y + R.vy * dt)); P.z += (-.6 - P.z) * Math.min(1, dt * 2); P.facing = R.vx >= 0 ? 1 : -1;
    const [a, b] = G.spaceBounds || [-1e9, 1e9]; P.x = Math.max(a + 1, Math.min(b - 1, P.x));
    m.position.set(P.x, P.y + .65 + Math.sin(t * 3) * .05, P.z); m.scale.set(1.3 + Math.sin(t * 4) * .04, 1.3 - Math.sin(t * 4) * .04, 1.3);
    if ((R.t += dt) > 40) pop(); });
  return R;
}

// =================== the landing area (space.js calls this for its ground) ===================
export function* bubbleLanding(c) {
  const { matte, props, X, PW, MID, add, U, G, P, tapIt, fact, Sound, api, say } = c;
  c.kit = { add, Sound, api, tapIt, U, P, G, say, disc: id => api.discover && api.discover(id) }; // (what star() and bubbleRide() need)
  // foam hills: soft, lumpy, pastel
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => (K.fbm2(x * .05, z * .05, 3) - .5) * .8 + K.sstep(-10, -40, z) * K.fbm2(x * .025 + 3, z * .025, 3) * 8,
    color: (x, z, h, ny, o) => { const n = K.fbm2(x * .2, z * .2, 3); K.ramp(['#fff4fb', '#e8f4ff', '#fdf0ff'], .3 + n * .5, o); if (K.noise2(x * .9, z * .9) > .74) o.lerp(new THREE.Color(PASTEL[Math.floor(K.hash2(x, z) * 5)]), .5); o.multiplyScalar(.92 + .1 * ny); } });
  yield;
  // big still bubbles resting on the foam (one batched, see-through mesh) and soap-foam clumps
  const still = K.makeBatch();
  for (let k = 0; k < 26; k++) { const x = X - 20 + k * 14 + Math.sin(k * 5.3) * 4, z = -8 - (k % 4) * 6, r = 1.5 + Math.abs(Math.sin(k * 2.1)) * 3; still.put(BALL, x, r * .9, z, '#ffffff', r); }
  { const m = still.mesh(film()); m.receiveShadow = false; add(m); }
  for (let k = 0; k < 40; k++) props.put(BALL, X - 25 + k * 9.5, .2, -5 - (k % 5) * 1.6, '#ffffff', [.6 + (k % 3) * .3, .35, .5]);
  // bubbles drifting up through the sky (a few separate meshes that rise and come round again)
  const drift = []; for (let k = 0; k < 8; k++) { const m = new THREE.Mesh(BALL, film()); m.scale.setScalar(1 + (k % 3) * .7); m.userData.dynamic = true; add(m); drift.push({ m, x: X + 10 + k * 30, z: -6 - (k % 3) * 5, y: k * 2.2 }); }
  U.push((dt, t) => { for (const d of drift) { d.y += dt * (.6 + (d.x % 3) * .1); if (d.y > 22) d.y = -1; d.m.position.set(d.x + Math.sin(t * .5 + d.x) * 1.5, d.y, d.z); } });
  yield;
  // THE BUBBLE BLOWER: a big wand machine; tap it and she floats inside a giant bubble
  const bx = X + 20, blower = new THREE.Group(); blower.position.set(bx, 0, -1.8); add(blower);
  { const b = K.makeBatch(); b.put(CYL, 0, 1.2, 0, '#b07cff', [.9, 2.4, .9]); b.put(BOX, 0, .3, 0, '#ff9ad8', [2, .6, 2]); b.put(CYL, 0, 3, 0, '#c8a8ff', [.12, 1.6, .12]);
    const ring = new THREE.TorusGeometry(.9, .12, 8, 28); b.put(ring, 0, 4.4, 0, '#ffd23f'); ring.dispose(); blower.add(b.mesh(K.shinyMat())); }
  const ride = () => { if (P.ride) return; Sound.chime(); say('🫧 You are inside a giant bubble! Use the arrows to float around. Tap JUMP to pop it!', true); api.discover && api.discover('bubbleride'); P.x = bx + 1.8; bubbleRide(c.kit, bx + 1.8); };
  tapIt(blower, ride, bx, 'bubbleride');
  U.push((dt, t) => { blower.children[0].rotation.y = Math.sin(t) * .1; });
  // stars high up that only a bubble ride can reach, and BUBBLE TRAMPOLINES
  const sb = K.makeBatch(); for (let j = 0; j < 4; j++) star(c.kit, sb, bx + 6 + j * 5, 5 + j * 1.6, 'bubblestar' + j); add(sb.mesh(K.shinyMat()));
  const tramps = [];
  for (const [j, x] of [X + 48, X + 54, X + 60].entries()) { const m = new THREE.Mesh(BALL, film()); m.scale.set(1.6, .9, 1.4); m.position.set(x, .8, -.6); m.userData.dynamic = true; add(m); const o = { m, s: 0 }; tramps.push(o);
    G.platforms.push({ a: x - 1.3, b: x + 1.3, y: 1.6, layer: 'space', z: -.6, pad: true, bounce: 8 + j * 1.2, step: true, stepMax: 1.7, onLand: () => { o.s = 1; Sound.boing && Sound.boing(); if (j === 2) api.discover && api.discover('bubbletramp'); } }); }
  U.push(dt => { for (const o of tramps) { o.s = Math.max(0, o.s - dt * 2.5); const q = Math.sin(o.s * 10) * o.s * .25; o.m.scale.set(1.6 * (1 + q), .9 * (1 - q), 1.4 * (1 + q)); } });
  tapIt(drift[0].m, () => fact('🫧 Bubbles are a thin skin of soapy water with air inside. Here they are giant!', 'bubblefact'), X + 10, 'bubblefact');
  return H;
}

// =================== area 2: the BUBBLE HOUSES that bob up and down, and the BUBBLE SLIDE ===================
function houses(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P;
  // each house sits on a giant bubble that bobs; its floor is a real platform that moves (and carries her)
  const H = [[s + 10, 2.2, 0], [s + 17, 3.6, 1.3], [s + 24, 5, 2.6], [s + 31, 6.4, 3.9], [s + 38, 7.8, 5.2]].map(([x, y, ph], j) => {
    const g = new THREE.Group(); g.position.set(x, y, -.8); g.userData.dynamic = true; k.add(g);
    const hb = K.makeBatch(); hb.put(BOX, 0, .9, 0, PASTEL[j % 5], [2.4, 1.8, 2]); hb.put(CONE, 0, 2.3, 0, ['#ff6fa5', '#7a5ae0', '#4fb0ff', '#5fd36a', '#ff9a2e'][j], [1.8, 1.1, 1.6], [0, Math.PI / 4, 0]); hb.put(BOX, 0, .7, 1.01, '#ffffff', [.6, 1, .05]); hb.put(BOX, 0, -.05, 0, '#ffffff', [2.8, .1, 2.4]);
    g.add(hb.mesh(K.shinyMat())); const bub = new THREE.Mesh(BALL, film()); bub.scale.setScalar(1.6); bub.position.y = -1.6; g.add(bub);
    const plat = { a: x - 1.4, b: x + 1.4, y, layer: 'space', z: -.8, step: true, stepMax: 1.7 }; k.G.platforms.push(plat);
    return { g, plat, y0: y, ph };
  });
  k.U.push((dt, t) => { for (const h of H) { const ny = h.y0 + Math.sin(t * .9 + h.ph) * .5; const on = P.grounded && !P.ride && Math.abs(P.y - h.plat.y) < .06 && P.x >= h.plat.a && P.x <= h.plat.b; h.plat.y = ny; h.g.position.y = ny; if (on) P.y = ny; } });
  // the cloud at the top, a star, and the BUBBLE SLIDE (a soapy see-through tube) all the way down
  b.put(BALL, s + 46, 9, -1, '#ffffff', [3.6, 1, 2]); k.plat(s + 43, s + 49, 9.6, { z: -.8, step: true, stepMax: 1.7 });
  const sb = K.makeBatch(); star(k, sb, s + 47, 10.8, 'bubblecloud'); k.add(sb.mesh(K.shinyMat()));
  const sx = s + 49, path = [[sx, 9.6], [sx + 4, 8.6], [sx + 10, 5.6], [sx + 16, 2.4], [sx + 21, .6], [sx + 24, .2]];
  const tb = K.makeBatch(); tubeAlong(tb, path.map(([x, y]) => [x, y - .2]), .85, '#ffffff', -1.2); { const m = tb.mesh(film()); k.add(m); }
  tubeAlong(b, path.map(([x, y]) => [x, y - .9]), .14, '#ff9ad8', -1.2);
  let sliding = false; const slide = () => { if (sliding || P.ride) return; sliding = true; k.Sound.chime(); k.say('🫧 Wheee! Down the bubble slide!', true); pathRide(k, path, { z: -1.2, speed: 7, done: () => { sliding = false; k.disc && k.disc('bubbleslide'); } }); };
  k.G.interact.push({ x: sx, y: 9.6, layer: 'space', icon: '🛝', action: 'Bubble slide!', hintY: 2.4, run: slide });
  k.U.push(() => { if (!sliding && P.grounded && !P.ride && Math.abs(P.y - 9.6) < .1 && P.x > sx - .6 && P.x < sx + 1 && P.vx > .5) slide(); });
  // a second bubble blower out here, for floating up to the houses another way
  const bx = s + 4; b.put(CYL, bx, 1.2, -1.8, '#b07cff', [.9, 2.4, .9]); const ring = new THREE.TorusGeometry(.9, .12, 8, 28); b.put(ring, bx, 4.4, -1.8, '#ffd23f'); ring.dispose();
  k.G.interact.push({ x: bx, y: 0, layer: 'space', icon: '🫧', action: 'Bubble ride!', hintY: 2.4, run: () => { if (P.ride) return; k.say('🫧 Float up in a bubble! JUMP pops it.', true); bubbleRide(k, bx + 1.8); } });
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['bubblefish', s + 60 - k.X, -2.6], ['foamy', s + 82 - k.X, -2.8]]);
  k.rocketSign(s + 2);
}

// =================== area 3: the BUBBLE BUS and the BUBBLE POP GARDEN ===================
function bus(k) {
  const s = k.s0, b = K.makeBatch(), P = k.P, z = -1.6;
  // floating islands along the route
  for (const [x, y] of [[s + 24, 5], [s + 40, 8], [s + 56, 6]]) { b.put(BALL, x, y, -4, '#d8ffc8', [3, .8, 2.2]); b.put(BALL, x, y - .7, -4, '#fff0f8', [2.4, .7, 1.8]); for (const d of [-1, 1]) b.put(BALL, x + d * 1.4, y + .9, -4, PASTEL[(x | 0) % 5], .5); }
  b.put(CYL, s + 8, 1.4, z, '#ff9ad8', [.12, 2.8, .12]); b.put(CYL, s + 8, 2.9, z, '#ffffff', [.6, .1, .6]); b.put(CYL, s + 70, 1.4, z, '#ff9ad8', [.12, 2.8, .12]); b.put(CYL, s + 70, 2.9, z, '#ffffff', [.6, .1, .6]); // the two bus stops
  const route = [[s + 8, .3], [s + 14, 2], [s + 22, 6.5], [s + 30, 8], [s + 38, 10], [s + 46, 9], [s + 52, 7.5], [s + 60, 8.5], [s + 66, 4], [s + 70, .3]];
  const busBubble = new THREE.Mesh(BALL, film()); busBubble.scale.setScalar(2); busBubble.position.set(s + 8, 1.6, z); busBubble.userData.dynamic = true; k.add(busBubble);
  let riding = false; const go = () => { if (riding || P.ride) return; riding = true; k.Sound.chime(); k.say('🚌 All aboard the bubble bus! It floats you over the islands!', true);
    const R = pathRide(k, route, { z, speed: 4.5, done: () => { riding = false; busBubble.position.set(s + 8, 1.6, z); k.disc && k.disc('bubblebus'); } });
    k.U.push(() => { if (P.ride === R) busBubble.position.set(P.x, P.y + .9, z); }); };
  k.tapIt(busBubble, go); k.G.interact.push({ x: s + 8, y: 0, layer: 'space', icon: '🚌', action: 'Bubble bus!', hintY: 2.4, run: go });
  // THE BUBBLE POP GARDEN: little bubbles float over the flowers; touch one to pop it (each a note), they come back
  const pops = []; for (let j = 0; j < 12; j++) { const m = new THREE.Mesh(BALL, film()); m.scale.setScalar(.4 + (j % 3) * .1); m.userData.dynamic = true; k.add(m); pops.push({ m, x: s + 80 + j * 1.6, y0: .7 + (j % 3) * .3, gone: 0 }); b.put(CYL, s + 80 + j * 1.6, .3, -1.6, '#5fd36a', [.04, .6, .04]); b.put(BALL, s + 80 + j * 1.6, .65, -1.6, PASTEL[j % 5], .22); }
  let popped = 0, lastX = null;
  k.U.push((dt, t) => { const x0 = lastX == null ? P.x : lastX, lo = Math.min(x0, P.x) - .55, hi = Math.max(x0, P.x) + .55; lastX = P.x; /* (swept: a fast step on a slow phone never skips a bubble) */ for (const [j, o] of pops.entries()) { if (o.gone > 0) { o.gone -= dt; o.m.visible = o.gone <= 0; continue; }
      const y = o.y0 + Math.sin(t * 1.4 + j) * .25; o.m.position.set(o.x + Math.sin(t * .7 + j) * .3, y, -.4);
      if (o.m.position.x >= lo && o.m.position.x <= hi && Math.abs(P.y + .7 - y) < .8) { o.gone = 4; o.m.visible = false; k.Sound.tone && k.Sound.tone(523 * Math.pow(1.122, j % 8), .1, 'sine', .05, 1.6); k.api.burst(o.m.position.x, y, -.4, ['#ffffff', '#c8e8ff'], 6, 1.5); if (++popped === 6) k.disc && k.disc('bubblepop'); } } });
  k.G.interact.push({ x: s + 88, y: 0, layer: 'space', icon: '🫧', action: 'Pop the bubbles!', hintY: 2.4, run: () => k.say('🫧 Walk into the little bubbles to pop them! Pop, pop, pop!', true) });
  k.add(b.mesh(K.shinyMat()));
  populate(k, [['bubblefish', s + 50 - k.X, -2.6]]);
  k.rocketSign(s + 108.6);
}

export const bubbleworld = { sections: [k => houses(k), k => bus(k)] };
