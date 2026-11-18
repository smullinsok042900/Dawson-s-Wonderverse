// ===================================================================
// jupiter-world.js (build 70): THE JUPITER SKY PLAYGROUND, a whole playground world floating on Jupiter's clouds.
//
// It grows out of the build 66 playground (swings, merry-go-round, seesaw, rocket rider) and the super slide, which stay.
// Everything is placed along Jupiter (x from the planet's start, X) on several levels:
//   area 2 (x 110–220): the SUNRISE TOWER with stairs → a ROPE BRIDGE (6.6 m) over the playground → CLOUD ISLAND 1 with a
//     LAUNCH PAD → CLOUD ISLAND 2 (12 m) with a BUBBLE MACHINE and a SECRET CLOUD, a CLOUD ELEVATOR from the ground → the
//     CANDY TOWER SPIRAL SLIDE down → the MUSICAL FLOOR, the COLOUR GAME, the BALL PIT and the BOUNCE TARGETS.
//   area 3 (x 220–330): the FLOATY BUBBLE (low gravity, with stars to catch), the WIND FAN that blows you up to the
//     SKY LOOKOUT (18 m, a telescope to the Great Red Spot), and from there TWO slides: the TWISTER TUBE (enclosed, with
//     coloured lights) and the giant GREAT RED SPOT SLIDE that swoops behind everything through glowing hoops and clouds
//     all the way back to the ball pit. TRAVEL BALLOONS fly you between the parts.
// Speed: each part is one or two merged meshes (so parts off screen are skipped), all with materials whose shaders are
// prepared when the game starts (shinyMat, glowMat, a see-through shinyMat, toy colours). Per-frame work is a few
// distance checks. Built only when she walks near (planets.js areas), freed when she flies away.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, glowMat, col } from './spacekit.js';
import { toy } from './creatures.js';

const RB = ['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fae'];
const JUP = ['#f6e3c4', '#e8b98a', '#d98a5a', '#f2d2a8', '#c97a4a'];        // Jupiter's cloud bands
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const GEO = () => ({ box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), ball: new THREE.SphereGeometry(1, 12, 9), lo: new THREE.SphereGeometry(1, 7, 5),
  cone: new THREE.ConeGeometry(1, 1, 14), torus: new THREE.TorusGeometry(1, .09, 6, 24), oct: new THREE.OctahedronGeometry(1) });
// painted light for the glowing (unlit) things, so they still look round
const LD = new THREE.Vector3(.35, .85, .4).normalize(), litC = {};
const lit = (hex, lo = .55) => litC[hex + lo] || (litC[hex + lo] = (x, y, z, nx, ny, nz, out) => { const d = Math.max(0, nx * LD.x + ny * LD.y + nz * LD.z); out.copy(col(hex)).multiplyScalar(Math.min(1.08, lo + (1 - lo) * d + .1 * (ny * .5 + .5))); });
// a see-through material that uses a shader the game prepares at start (main.js warmPaint: the transparent shinyMat)
export const glass = (opacity = .45) => { const m = shinyMat().clone(); m.transparent = true; m.opacity = opacity; m.depthWrite = false; return m; };
export const painted = (geo, hex) => { const b = makeBatch(); b.add(geo, null, hex); return b.geometry(); }; // (gives a plain shape the colours the shared material reads)
const mesh = (b, mat, shadow) => { const m = b.mesh(mat); if (shadow) m.castShadow = true; return m; };
const onPlanet = P => P.layer === 'space';
const platOf = (k, a, b, y, o) => { k.plat(a, b, y, o); return k.G.platforms[k.G.platforms.length - 1]; };
const near = (P, x, y, dx = 6, dy = 2.5) => onPlanet(P) && !P.ride && Math.abs(P.x - x) < dx && Math.abs(P.y - y) < dy;
// a pad that throws you up (and along) when you walk onto it OR land on it (the game's own pads only fire on landing)
export function launcher(k, a, b, y, vy, vx, onGo) {
  const P = k.P; let cool = 0;
  k.U.push(dt => { cool = Math.max(0, cool - dt); if (cool || !onPlanet(P) || P.ride || !P.grounded || Math.abs(P.y - y) > .3 || P.x < a || P.x > b) return;
    cool = .4; P.y = y + .05; P.vy = vy; P.grounded = false; P.jumps = 1; if (vx) { P.vx = vx; P.driftT = 1.1; P.drift = vx; P.hopX = 0; } onGo && onGo(); });
}
export function rideTo(k, type, step, done, o) { // (the same as planets.js jupiterRide: the planet drives the ride, walking pauses)
  const P = k.P, R = { type, t: 0, noExit: o?.noExit ?? true }; P.ride = R; P.vx = P.vy = 0;
  k.U.push(dt => { if (R.over) return; if (P.ride !== R) { R.over = true; return; } R.t += dt; if (step(R, dt)) { R.over = true; if (P.ride === R) { P.ride = null; P.vy = 0; P.grounded = true; } done && done(); } });
}
// a slide tube along a path: see-through rainbow (or a solid tube with light rings), with posts down to the clouds
// (build 70 speed: an open, solid HALF-PIPE: the bottom of the tube only, painted inside and out. It is opaque (much cheaper
//  to draw than see-through glass), has fewer triangles, and she is always in view while she slides)
export function halfPipe(path, segs, r, cols, bands) {
  const RS = 10, tg = new THREE.TubeGeometry(path, segs, r, RS, false), c = new THREE.Color(), cs = [];
  for (let i = 0; i <= segs; i++) { c.set(cols[Math.floor(i / segs * bands) % cols.length]); for (let j = 0; j <= RS; j++) cs.push(c.r, c.g, c.b); }
  tg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); const g = tg.toNonIndexed(); tg.dispose();
  const P0 = g.attributes.position.array, N0 = g.attributes.normal.array, C0 = g.attributes.color.array, pos = [], nor = [], col = [];
  for (let t = 0; t < P0.length; t += 9) { if ((N0[t + 1] + N0[t + 4] + N0[t + 7]) / 3 > .2) continue;
    for (const side of [1, -1]) { const order = side > 0 ? [0, 1, 2] : [0, 2, 1]; for (const v of order) { const o = t + v * 3, sh = side > 0 ? 1 : .92; pos.push(P0[o], P0[o + 1], P0[o + 2]); nor.push(N0[o] * side, N0[o + 1] * side, N0[o + 2] * side); col.push(C0[o] * sh, C0[o + 1] * sh, C0[o + 2] * sh); } } }
  g.dispose(); const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); out.computeBoundingSphere(); return out;
}
export function slideTube(k, path, { segs = 300, r = .9, rings = 0, ringCols = RB, postEvery = 0, cols = RB, bands = 12 } = {}) {
  const tube = new THREE.Mesh(halfPipe(path, segs, r, cols, bands), shinyMat()); tube.castShadow = true; k.add(tube);
  const sb = makeBatch(), gb = makeBatch(), G0 = GEO(), q = new THREE.Quaternion(), e = new THREE.Euler(), Z = V3(0, 0, 1);
  if (postEvery) for (let u = .02; u < .98; u += postEvery) { const p = path.getPointAt(u); if (p.y > 1.8) sb.put(G0.cyl, p.x, (p.y - r) / 2, p.z, '#ffd23f', [.13, p.y - r, .13]); }
  for (let i = 1; i <= rings; i++) { const u = i / (rings + 1), p = path.getPointAt(u), t = path.getTangentAt(u); q.setFromUnitVectors(Z, t); e.setFromQuaternion(q);
    gb.put(G0.torus, p.x, p.y, p.z, ringCols[i % ringCols.length], r + .12, [e.x, e.y, e.z]); }
  if (sb.count()) k.add(mesh(sb, shinyMat(), true)); if (gb.count()) k.add(gb.mesh(glowMat()));
  return tube;
}

// =================== AREA 2 ===================
export function jupiterSkyArea2(k) {
  const P = k.P, G = k.G, X = k.X, G0 = GEO(), S = k.Sound;
  // ---------- the SUNRISE TOWER: rainbow stairs up to a deck at 6.6 m, a striped roof and a big sun on top (a landmark) ----------
  { const b = makeBatch(), gb = makeBatch(), x0 = X + 112, top = 6.6;
    for (let i = 0; i < 12; i++) { const x = x0 + i * .9, h = (i + 1) * .55; b.put(G0.box, x + .45, h / 2, -2.1, RB[i % 7], [.9, h, 1.2]); } // (behind the path: walking along the ground passes in front; tap to climb)
    const dx0 = x0 + 10.8, dx1 = X + 126.5; b.put(G0.box, (dx0 + dx1) / 2, top - .15, -1.2, '#fff3d6', [dx1 - dx0, .3, 2.4]); k.plat(dx0, dx1, top, { z: -1.2 });
    for (const x of [dx0 + .2, dx1 - .2]) for (const z of [-2.3, -.1]) b.put(G0.cyl, x, top / 2, z, '#ff6fae', [.16, top, .16]);
    for (const x of [dx0 + .2, dx1 - .2]) b.put(G0.cyl, x, top + 2, -2.3, '#ffffff', [.1, 4, .1]);
    for (let i = 0; i < 8; i++) b.put(G0.box, dx0 + .2 + i * (dx1 - dx0 - .4) / 7, top + 4.1, -1.6, i % 2 ? '#ffffff' : '#ff9a2e', [(dx1 - dx0) / 7.5, .25, 2.2], [.35, 0, 0]);
    gb.put(G0.ball, (dx0 + dx1) / 2, top + 6.6, -2.3, '#ffd23f', 1.1); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; gb.put(G0.cone, (dx0 + dx1) / 2 + Math.cos(a) * 1.7, top + 6.6 + Math.sin(a) * 1.7, -2.3, '#ff9a2e', [.3, .7, .3], [0, 0, a - Math.PI / 2]); }
    const tw = mesh(b, shinyMat(), true); k.add(tw); k.add(gb.mesh(glowMat()));
    // one tap and she walks up the rainbow stairs by herself (each step sings a note), to the deck
    const climb = () => { if (P.ride || !onPlanet(P) || P.y > 1 || P.x < x0 - 6 || P.x > dx1 + 2) return; k.fact('☀️ Up the rainbow stairs to the Sunrise Tower! Then walk across the rope bridge to the cloud islands!', 'jupitertower'); const sx = P.x;
      rideTo(k, 'jstairs', (R, dt) => { const f = Math.min(1, R.t / 3.2), x = x0 + f * 11.4; P.x = R.t < .4 ? sx + (x0 - sx) * R.t / .4 : x; P.z = -2.1 * Math.min(1, R.t / .4) * (f < .97 ? 1 : 0); P.y = Math.min(top, Math.max(0, Math.ceil((P.x - x0) / .9)) * .55); P.facing = 1;
        const st = Math.floor((P.x - x0) / .9); if (st !== R.st && st >= 0 && st < 12) { R.st = st; S.tone(330 + st * 40, .1, 'triangle', .05, 1); } return f >= 1; }, () => { P.y = top; P.x = x0 + 11.6; P.z = 0; P.grounded = true; }); };
    k.tapIt(tw, climb, x0 + 3, 'jupitertower'); }
  // ---------- the ROPE BRIDGE at 6.6 m over the playground (it dips a little as you walk) ----------
  { const a = X + 126.5, b0 = X + 146, y = 6.6, b = makeBatch();
    for (let x = a + .25; x < b0; x += .5) b.put(G0.box, x, y - .1, -1.2, (Math.round((x - a) * 2) % 2) ? '#c98a4a' : '#e0a060', [.42, .12, 1.7]);
    for (const z of [-2.1, -.3]) { b.put(G0.cyl, (a + b0) / 2, y + .9, z, '#f6e3c4', [.05, b0 - a, .05], [0, 0, Math.PI / 2]); for (let x = a + 1; x < b0; x += 1) b.put(G0.cyl, x, y + .45, z, '#f6e3c4', [.025, .9, .025]); }
    for (const x of [a + 5, a + 10, a + 15]) for (const z of [-2.1, -.3]) b.put(G0.cyl, x, y / 2, z, '#ffffff', [.09, y, .09]);
    const br = mesh(b, shinyMat(), true); k.add(br); k.plat(a, b0, y, { z: -1.2 });
    let said = false; k.U.push((dt, t) => { const on = onPlanet(P) && P.grounded && Math.abs(P.y - y) < .2 && P.x > a && P.x < b0; br.position.y = on ? -.06 - Math.sin(t * 8) * .03 : br.position.y * .8;
      if (on && !said) { said = true; k.fact('🌉 A wobbly rope bridge, high above the playground!', 'jupiterbridge'); } }); }
  // ---------- CLOUD ISLANDS: puffy floating clouds with a launch pad, and a cloud elevator up from the ground ----------
  const cloud = (b, x0, x1, y, zc = -1.6) => { for (let x = x0 + .6; x < x1; x += 1.3) for (const [dz, s] of [[0, 1], [-1.1, .85], [1, .75]]) b.put(G0.lo, x + (dz * .3), y - .55 - s * .25, zc + dz, JUP[Math.floor(x * 7) % 5 === 2 ? 0 : 3], [1.15 * s, .7 * s, 1.1 * s]); };
  { const cb = makeBatch(); cloud(cb, X + 146, X + 152, 6.6); cloud(cb, X + 154, X + 166, 12); const cm = cb.mesh(glowMat()); k.add(cm);
    k.plat(X + 146, X + 152, 6.6, { z: -1.2 }); k.plat(X + 154, X + 166, 12, { z: -1.2 }); }
  { // the launch pad on island 1: it throws you up and over onto island 2
    const pb = makeBatch(), px = X + 151; pb.put(G0.cyl, px, 6.62, -1.2, '#ff4f6a', [.9, .12, .9]); pb.put(G0.torus, px, 6.7, -1.2, '#ffd23f', .95, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 3; i++) pb.put(G0.cone, px + .5 + i * .45, 6.8, -1.2, '#ffffff', [.12, .3, .12], [0, 0, -Math.PI / 2]);
    const pad = pb.mesh(glowMat()); k.add(pad); let sq = 0;
    launcher(k, px - .8, px + .8, 6.6, 29, 6.5, () => { sq = 1; S.boing(); k.disc('jupiterlaunch', '🚀 A launch pad! It throws you up to the next cloud island!'); });
    k.U.push(dt => { sq = Math.max(0, sq - dt * 3); pad.scale.y = 1 - Math.sin(sq * Math.PI) * .5; });
    k.tapIt(pad, () => k.fact('🚀 Step on the launch pad and it throws you up to the high cloud island!', 'jupiterlaunchpad'), px, null); }
  { // the cloud elevator: a little cloud that floats from the ground up to island 2 and back, again and again
    const eb = makeBatch(); cloud(eb, X + 152.4, X + 154.2, .55, -1.2); const ev = eb.mesh(glowMat()); k.add(ev);
    const pl = platOf(k, X + 152.3, X + 154.3, .5, { z: -1.2, step: true, stepMax: .7 }); let last = .5;
    k.U.push((dt, t) => { const c = t % 16, f = c < 3 ? 0 : c < 8 ? (c - 3) / 5 : c < 11 ? 1 : 1 - (c - 11) / 5, e = f * f * (3 - 2 * f), y = .5 + e * 11.5;
      const riding = onPlanet(P) && !P.ride && P.grounded && Math.abs(P.y - last) < .12 && P.x > pl.a - .2 && P.x < pl.b + .2;
      pl.y = y; ev.position.y = y - .5; if (riding) { P.y = y; P.vy = 0; } last = y; }); }
  // ---------- the BUBBLE MACHINE on island 2: tap the bubbles to pop them ----------
  { const mx = X + 157.5, my = 12, b = makeBatch(); b.put(G0.cyl, mx, my + .6, -2.4, '#5aa8ff', [.7, 1.2, .7]); b.put(G0.cone, mx, my + 1.5, -2.4, '#ffd23f', [.5, .6, .5], [Math.PI, 0, 0]); b.put(G0.torus, mx, my + 1.25, -2.4, '#ffffff', .62, [Math.PI / 2, 0, 0]);
    const m = mesh(b, shinyMat(), true); k.add(m); const mat = glass(.4), bubG = painted(G0.ball, '#dff6ff'), bubbles = [], burst = (p) => k.api.burst(p.x, p.y, p.z, ['#ffffff', '#9fe6ff', '#ff9fd2'], 10, 1.6); let popped = 0;
    const reset = (bb, t0) => { bb.t = -t0; bb.m.position.set(mx, my + 1.6, -2.4); bb.m.visible = false; bb.vx = (Math.random() - .5) * 1.6; bb.s = .35 + Math.random() * .25; };
    for (let i = 0; i < 4; i++) { const bm = new THREE.Mesh(bubG, mat); bm.renderOrder = 3; k.add(bm); const bb = { m: bm }; reset(bb, i * 1.3); bubbles.push(bb);
      k.tapIt(bm, () => { if (!bm.visible) return; burst(bm.position); S.pop(); popped++; reset(bb, .6); if (popped === 1) k.fact('🫧 Pop! Tap the bubbles to pop them!', 'jupiterbubbles'); else if (popped % 10 === 0) { k.say(`🫧 ${popped} bubbles! Hooray!`, true); S.chime(); k.api.burst(P.x, P.y + 2, -1, RB, 26, 2.6); } }); }
    k.U.push(dt => { if (!near(P, mx, my, 30, 14)) return; for (const bb of bubbles) { bb.t += dt; if (bb.t < 0) continue; const m2 = bb.m; m2.visible = true; m2.scale.setScalar(bb.s * Math.min(1, bb.t * 2));
      m2.position.x += bb.vx * dt; m2.position.y += dt * .9; m2.position.z = -2.4 + Math.sin(bb.t * 1.7) * .8; if (bb.t > 7) reset(bb, .5); } });
    k.tapIt(m, () => { for (const bb of bubbles) if (bb.t < 0) bb.t = 0; S.whoosh(); k.fact('🫧 The bubble machine! Pop as many bubbles as you can!', 'jupiterbubblemachine'); }, mx, null);
    G.interact.push({ x: mx, y: my, layer: 'space', disc: 'jupiterbubblemachine', run: () => k.say('🫧 Tap the bubbles to pop them!', true), hintY: 2.4 }); }
  // ---------- the SECRET CLOUD on island 2: tap the sparkly cloud and it puffs away, and a treasure chest opens ----------
  { const sx = X + 163.5, sy = 12, cb = makeBatch(); for (const [dx, dy, s] of [[0, .9, 1], [-.8, .6, .7], [.8, .6, .75], [0, 1.6, .7]]) cb.put(G0.lo, sx + dx, sy + dy, -2.6, '#ffffff', [s, s * .8, s]);
    const cl = cb.mesh(glowMat()); k.add(cl); const chest = new THREE.Group(); chest.position.set(sx, sy, -2.6); k.add(chest);
    const ch = makeBatch(); ch.put(G0.box, 0, .3, 0, '#b8742e', [1, .6, .7]); ch.put(G0.box, 0, .3, .36, '#ffd23f', [.18, .3, .04]); chest.add(mesh(ch, shinyMat()));
    const lid = new THREE.Group(); lid.position.set(0, .6, -.35); chest.add(lid); const lb = makeBatch(); lb.put(G0.box, 0, .1, .35, '#c98a4a', [1, .2, .7]); lid.add(mesh(lb, shinyMat()));
    let open = 0, found = false, sparkle = 0;
    k.U.push((dt, t) => { if (found) { open = Math.min(1, open + dt * 1.5); cl.scale.setScalar(Math.max(.001, 1 - open)); lid.rotation.x = -open * 1.9; }
      else if (near(P, sx, sy, 14, 5) && (sparkle -= dt) < 0) { sparkle = .7; k.api.burst(sx + (Math.random() - .5) * 2, sy + 1 + Math.random(), -2.4, ['#ffd23f', '#ffffff'], 1, .5); } });
    k.tapIt(cl, () => { if (found) return; found = true; S.twinkle(); k.api.burst(sx, sy + 1.4, -2.2, ['#ffd23f', '#ffffff', '#ff6fae', '#5aa8ff'], 30, 2.8); k.fact('✨ You found a SECRET! A treasure chest was hiding behind the cloud!', 'jupitersecret'); }, sx, null);
    G.interact.push({ x: sx, y: sy, layer: 'space', disc: 'jupitersecretcloud', run: () => cl.userData.tap && cl.userData.tap(), hintY: 2.4 }); }
  // ---------- the CANDY TOWER SPIRAL SLIDE from island 2 down to the clouds ----------
  { const cx = X + 173, cz = -2.6, r = 3, pts = [V3(X + 166.2, 12.5, -1.2)];
    for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI * 4.5; pts.push(V3(cx + Math.cos(a) * r, 12.1 - i / 40 * 11, cz + Math.sin(a) * r)); }
    pts.push(V3(X + 176.5, .9, -.3), V3(X + 179, .75, -.5));
    const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .3); slideTube(k, path, { segs: 170, cols: ['#ff6fae', '#ffffff'], bands: 18 });
    const b = makeBatch(); for (let i = 0; i < 4; i++) b.put(G0.cyl, cx, i * 3 + 1.5, cz, i % 2 ? '#ffffff' : '#ff6fae', [1.2, 3, 1.2]); b.put(G0.cone, cx, 13.4, cz, '#ff6fae', [1.6, 2, 1.6]); b.put(G0.ball, cx, 14.7, cz, '#ffd23f', .45);
    const tw = mesh(b, shinyMat(), true); k.add(tw);
    const go = () => { if (P.ride || !onPlanet(P) || Math.abs(P.y - 12) > 1 || Math.abs(P.x - (X + 166)) > 4) return false; P.x = X + 166.2; P.y = 12; k.G.startSlide(path, { vmax: 10, acc: 6 }); k.disc('jupiterspiral', '🍭 Round and round down the Candy Tower slide!'); return true; };
    let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && onPlanet(P) && !P.ride && P.grounded && Math.abs(P.y - 12) < .1 && P.x > X + 165.6 && P.vx > .5 && go()) cool = 2; });
    k.tapIt(tw, () => { if (!go()) k.fact('🍭 The Candy Tower slide starts up on the high cloud island. Ride the cloud elevator or the launch pad up!', 'jupitercandy'); }, cx, 'jupitercandy'); }
  // ---------- the MUSICAL FLOOR: big tiles that each sing a note when you step on them ----------
  { const x0 = X + 180, n = 7, w = 1.8, notes = [262, 294, 330, 349, 392, 440, 494], b = makeBatch();
    for (let i = 0; i < n; i++) b.put(G0.box, x0 + i * w + w / 2, .05, -1.2, RB[i], [w - .12, .1, 2.6]);
    const fl = b.mesh(glowMat()); k.add(fl); const hi = k.sbox(x0, .1, -1.2, w - .1, .06, 2.62, '#ffffff', { ei: .6 }); hi.visible = false; let cur = -1, glow = 0, count = 0;
    k.U.push(dt => { glow = Math.max(0, glow - dt * 2.5); hi.visible = glow > 0; hi.scale.y = .06 + glow * .2;
      const i = onPlanet(P) && !P.ride && P.y < .4 && P.x > x0 && P.x < x0 + n * w ? Math.floor((P.x - x0) / w) : -1;
      if (i >= 0 && i !== cur) { S.tone(notes[i], .3, 'triangle', .07, 1); hi.position.x = x0 + i * w + w / 2; glow = 1; count++; if (count === 1) k.fact('🎵 A musical floor! Every colour sings a different note. Walk up and down to play a song!', 'jupitermusic'); }
      cur = i; });
    k.tapIt(fl, () => k.fact('🎵 Walk on the colours to play music!', 'jupitermusicfloor'), x0 + n * w / 2, null); }
  // ---------- the COLOUR GAME: a balloon floats up; tap the button with the same colour ----------
  { const x0 = X + 193.5, cols = ['#ff4f6a', '#ffd23f', '#5aa8ff', '#7fe0a0'], names = ['red', 'yellow', 'blue', 'green'];
    const balloon = new THREE.Group(); balloon.position.set(x0 + 2.25, 3.4, -.5); k.add(balloon); const bm = new THREE.Mesh(G0.ball, toy(cols[0], { r: .3, cc: .8 })); bm.scale.set(.75, .9, .75); balloon.add(bm);
    const str = k.sbox(x0 + 2.25, 0, -.5, .02, 2.6, .02, '#ffffff');
    const bb = makeBatch(); cols.forEach((c, i) => { bb.put(G0.cyl, x0 + i * 1.5, .25, -2.4, '#ffffff', [.75, .5, .75]); bb.put(G0.ball, x0 + i * 1.5, .55, -2.4, c, [.6, .3, .6]); }); k.add(mesh(bb, shinyMat(), true)); // (one mesh for all four)
    const hit = new THREE.MeshBasicMaterial({ visible: false }), btns = cols.map((c, i) => { const g = new THREE.Group(); g.position.set(x0 + i * 1.5, 0, -2.4); k.add(g); const m = new THREE.Mesh(G0.box, hit); m.scale.set(1.4, 1.6, 1.4); m.position.y = .6; g.add(m); return g; });
    let want = 0, wob = 0, got = 0, said = false, bump = btns.map(() => 0);
    const newRound = () => { let n; do { n = Math.floor(Math.random() * 4); } while (n === want); want = n; bm.material.color.copy(col(cols[n])); balloon.position.y = 1.2; k.say(`🎈 Find the ${names[n]} one!`, true); };
    btns.forEach((g, i) => k.tapIt(g, () => { if (!said) { said = true; newRound(); return; } bump[i] = 1;
      if (i === want) { got++; S.chime(); k.api.burst(g.position.x, 1.4, -2.4, [cols[i], '#ffffff'], 20, 2.2); k.disc('jupitercolours', '🎈 The colour game: tap the button that matches the balloon!'); setTimeout(newRound, 900); if (got % 5 === 0) k.say(`🎈 ${got} right! You know your colours!`, true); }
      else { wob = 1; S.boing(); k.say('🎈 Not that one... try another colour!', true); } }, i === 1 ? x0 + 2.25 : undefined, i === 1 ? 'jupitercolourgame' : null));
    k.U.push((dt, t) => { if (!near(P, x0 + 2.25, 0, 25, 30)) return; balloon.position.y += (3.4 - balloon.position.y) * Math.min(1, dt * 1.5); wob = Math.max(0, wob - dt * 2); balloon.rotation.z = Math.sin(t * 2) * .08 + Math.sin(t * 20) * .25 * wob;
       }); }
  // ---------- the BALL PIT: wade in and the balls fly; tap it and they all jump ----------
  { const x0 = X + 199, x1 = X + 208, b = makeBatch(), gb = makeBatch();
    for (const z of [-3.6, .6]) b.put(G0.box, (x0 + x1) / 2, .45, z, '#ff6fae', [x1 - x0, .9, .3]); for (const x of [x0, x1]) b.put(G0.box, x, .45, -1.5, '#5aa8ff', [.3, .9, 4.5]);
    for (let i = 0; i < 44; i++) { const x = x0 + .4 + (i * 1.37) % (x1 - x0 - .8), z = -3.2 + (i * .91) % 3.5, y = .25 + (i % 3) * .16; gb.put(G0.lo, x, y, z, RB[i % 7], .27); }
    const pit = mesh(b, shinyMat(), true); k.add(pit); k.add(gb.mesh(glowMat())); let inside = false, puff = 0;
    k.U.push(dt => { const now = onPlanet(P) && P.x > x0 && P.x < x1 && P.y < 1; if (now && !inside) { k.api.burst(P.x, .6, -1, RB, 14, 2); S.pop(); k.disc('jupiterballpit', '🔴 Splash into the ball pit!'); }
      inside = now; if (now && Math.abs(P.vx) > .5 && (puff -= dt) < 0) { puff = .25; k.api.burst(P.x, .5, -1, RB, 3, 1.2); } });
    k.tapIt(pit, () => { k.api.burst((x0 + x1) / 2, .8, -1.5, RB, 40, 3); S.giggle(); k.fact('🔴🟡🔵 The ball pit! Jump in!', 'jupiterpit'); }, (x0 + x1) / 2, 'jupiterpit'); }
  // ---------- BOUNCE TARGETS: four pads, each bounces higher, up to a ring that rings like a bell ----------
  { const x0 = X + 211, g = 24 * 24.79 / 9.81, b = makeBatch(), gb = makeBatch(), rings = [];
    [13, 16, 19, 22].forEach((v, i) => { const x = x0 + i * 2.2, top = v * v / (2 * g); b.put(G0.cyl, x, .12, -1.2, RB[i * 2 % 7], [.8, .24, .8]); gb.put(G0.torus, x, top + .55, -1.2, RB[(i * 2 + 2) % 7], .7, [0, 0, 0]);
      rings.push({ x, y: top + .55, hit: 0 }); launcher(k, x - .7, x + .7, 0, v, 0, () => { S.tone(300 + i * 90, .12, 'triangle', .06, 2); }); });
    k.add(mesh(b, shinyMat(), true)); const rm = gb.mesh(glowMat()); k.add(rm); const flash = k.sbox(0, 0, -1.2, 1.5, 1.5, .1, '#ffffff', { ei: 1 }); flash.visible = false; let ft = 0;
    k.U.push(dt => { ft = Math.max(0, ft - dt * 2); flash.visible = ft > 0; flash.scale.setScalar(1.5 + (1 - ft) * .8); for (const [i, r] of rings.entries()) { r.hit = Math.max(0, r.hit - dt);
      if (!r.hit && onPlanet(P) && Math.abs(P.x - r.x) < .9 && Math.abs(P.y + .6 - r.y) < .7) { r.hit = 1; ft = 1; flash.position.set(r.x, r.y - .75, -1.25); S.bell ? S.bell(600 + i * 150) : S.chime(); k.disc('jupitertargets', '🔔 Bounce up and ring the rings!'); } } });
    k.tapIt(rm, () => k.fact('🔔 Hop on a pad and bounce up to ring the ring! Each one goes higher!', 'jupiterbounce'), x0 + 3.3, 'jupiterbounce'); }
  // ---------- a TRAVEL BALLOON at the start: tap it and float to the Floaty Bubble ----------
  travelBalloon(k, X + 109, X + 246, '#ff6fae', 'jupiterballoon1');
}

// =================== AREA 3 ===================
export function jupiterSkyArea3(k) {
  const P = k.P, G = k.G, X = k.X, G0 = GEO(), S = k.Sound;
  // ---------- the FLOATY BUBBLE: inside it Jupiter's strong gravity is switched off a lot, so you float, and catch stars ----------
  { const x0 = X + 249, x1 = X + 269, cx = (x0 + x1) / 2, dome = new THREE.Mesh(painted(G0.ball, '#9fdcff'), glass(.3)); dome.position.set(cx, 0, -1); dome.scale.set(10.5, 8.5, 3.6); dome.renderOrder = 3; k.add(dome);
    const rb = makeBatch(); rb.put(G0.torus, cx, .1, -1, '#9fe6ff', [10.5, 3.6, 1.5], [Math.PI / 2, 0, 0]); for (let i = 0; i < 9; i++) rb.put(G0.lo, x0 + 1 + i * 2.2, .2, .9 - (i % 2) * .4, '#cfefff', [.35, .2, .35]);
    for (const [h, rr] of [[3, .94], [5.6, .78], [7.4, .5]]) rb.put(G0.torus, cx, h, -1, '#bff0ff', [10.5 * Math.sqrt(1 - (h / 8.5) ** 2), 3.6 * Math.sqrt(1 - (h / 8.5) ** 2), 1.2], [Math.PI / 2, 0, 0]); // (glowing bands round the bubble) k.add(rb.mesh(glowMat()));
    const starMat = toy('#ffd23f', { r: .3, ei: .5 }), stars = []; for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(G0.oct, starMat); s.scale.set(.35, .45, .15); k.add(s); stars.push({ s, x: x0 + 2 + i * 2.2, y: 2.5 + (i * 3.7) % 5.5, on: true }); }
    let saved = null, got = 0, said = false, back = 0;
    k.U.push((dt, t) => { const inside = onPlanet(P) && !P.ride && P.x > x0 && P.x < x1;
      if (inside && saved === null) { saved = G.spaceG; G.spaceG = .3; if (!said) { said = true; k.fact('🫧 The Floaty Bubble! Inside, you are almost weightless. Jump and float up to catch the stars!', 'jupiterfloaty'); } }
      else if (!inside && saved !== null) { G.spaceG = saved; saved = null; }
      for (const st of stars) { if (!st.on) continue; st.s.position.set(st.x, st.y + Math.sin(t * 1.5 + st.x) * .25, -1); st.s.rotation.y = t * 2;
        if (inside && Math.abs(P.x - st.x) < .8 && Math.abs(P.y + .6 - st.y) < 1) { st.on = false; st.s.visible = false; got++; S.tone(500 + got * 60, .15, 'sine', .06, 1.5); k.api.burst(st.x, st.y, -1, ['#ffd23f', '#ffffff'], 10, 1.6);
          if (stars.every(q => !q.on)) { S.chime(); k.say('⭐ You caught ALL the stars! Amazing!', true); k.disc('jupiterstars', '⭐ Catch the floating stars in the Floaty Bubble!'); back = 4; } } }
      if (back > 0 && (back -= dt) <= 0) for (const st of stars) { st.on = true; st.s.visible = true; } });
    k.tapIt(dome, () => k.fact('🫧 Walk into the Floaty Bubble and jump: you float! Catch the stars!', 'jupiterbubble'), cx, 'jupiterbubble'); }
  // ---------- the WIND FAN blows you up to the SKY LOOKOUT (18 m) ----------
  const LX0 = X + 276, LX1 = X + 292, LY = 18;
  { const fx = X + 280, b = makeBatch(), spin = new THREE.Group(); b.put(G0.cyl, fx, .2, -1.2, '#9b6cff', [1.4, .4, 1.4]); b.put(G0.torus, fx, .45, -1.2, '#ffffff', 1.3, [Math.PI / 2, 0, 0]); k.add(mesh(b, shinyMat(), true));
    spin.position.set(fx, .5, -1.2); k.add(spin); const fb = makeBatch(); for (let i = 0; i < 4; i++) fb.put(G0.box, Math.cos(i * Math.PI / 2) * .6, 0, Math.sin(i * Math.PI / 2) * .6, '#ffd23f', [.9, .05, .35], [0, -i * Math.PI / 2, .4]); spin.add(mesh(fb, shinyMat()));
    // the wind column: faint rings going up (one mesh, it scrolls)
    const wb = makeBatch(); for (let i = 0; i < 9; i++) wb.put(G0.torus, 0, i * 2.2, 0, '#e6f7ff', .9 + (i % 3) * .2, [Math.PI / 2, 0, 0]); const wind = new THREE.Mesh(wb.geometry(), glass(.35)); wind.position.set(fx, 0, -1.2); k.add(wind);
    let boost = 0;
    k.U.push((dt, t) => { spin.rotation.y += dt * (3 + boost * 20); boost = Math.max(0, boost - dt * .3); wind.position.y = (t * (1 + boost * 4)) % 2.2; wind.visible = near(P, fx, 0, 40, 40); });
    const go = () => { if (!near(P, fx, 0, 4, 1.2)) return; boost = 1; S.whoosh(); k.fact('🌬️ Whoosh! The wind fan blows you all the way up to the Sky Lookout!', 'jupiterwind'); P.x = fx; P.z = -1.2;
      rideTo(k, 'jwind', (R, dt) => { P.y = Math.min(LY, P.y + dt * (2 + R.t * 2)); P.x = fx + Math.sin(R.t * 3) * .5; R.roll = Math.sin(R.t * 4) * .2; P.facing = Math.sin(R.t * 2) > 0 ? 1 : -1; if (Math.random() < dt * 8) k.api.burst(P.x, P.y - .5, -1.2, ['#ffffff', '#cfefff'], 1, .8); return P.y >= LY; },
        () => { P.y = LY; P.x = fx + 1.5; P.z = 0; P.grounded = true; k.say('🔭 The Sky Lookout! Look through the telescope, or pick a slide!', true); }); };
    k.tapIt(spin, go, fx, 'jupiterwind'); }
  // the lookout deck, railings, a telescope and two slide mouths
  { const b = makeBatch(), gb = makeBatch(); b.put(G0.box, (LX0 + LX1) / 2, LY - .2, -1.2, '#fff3d6', [LX1 - LX0, .4, 2.6]); k.plat(LX0, LX1, LY, { z: -1.2 });
    for (let x = LX0 + .5; x < LX1; x += 1.5) b.put(G0.cyl, x, LY + .5, -2.4, '#ffffff', [.05, 1, .05]); b.put(G0.cyl, (LX0 + LX1) / 2, LY + 1, -2.4, '#ff9a2e', [.06, LX1 - LX0, .06], [0, 0, Math.PI / 2]);
    for (const x of [LX0 + 1, LX1 - 1]) for (const z of [-2.3, -.1]) b.put(G0.cyl, x, LY / 2, z, '#9b6cff', [.25, LY, .25]);
    for (let y = 3; y < LY; y += 5) b.put(G0.box, (LX0 + LX1) / 2, y, -2.3, '#c9a6ff', [LX1 - LX0 - 2, .2, .2]);
    for (let i = 0; i < 12; i++) gb.put(G0.lo, LX0 + .7 + i * 1.3, LY - .5, .2, RB[i % 7], .18); // a string of lights
    k.add(mesh(b, shinyMat(), true)); k.add(gb.mesh(glowMat()));
    // the telescope: tap it and look at the Great Red Spot
    const tel = new THREE.Group(); tel.position.set(X + 284, LY, -2); k.add(tel); const tb = makeBatch(); tb.put(G0.cyl, 0, .5, 0, '#5a6a8a', [.06, 1, .06]); tb.put(G0.cyl, 0, 1.1, 0, '#ffd23f', [.18, 1.2, .18], [0, 0, 1.1]); tel.add(mesh(tb, shinyMat()));
    let look = 0;
    k.U.push(dt => { if (look <= 0) return; look -= dt; const w = Math.min(1, (4 - look) / 1, look / .8);
      G.camOverride = { pos: [P.x + w * 6, P.y + 3 + w * 10, 10 - w * 4], look: [P.x + w * 40, P.y + 2 + w * 20, -20 - w * 100] }; if (look <= 0) G.camOverride = null; });
    k.tapIt(tel, () => { if (!near(P, X + 284, LY, 5, 2) || look > 0) return; look = 4; S.twinkle(); k.fact('🔴 That is the Great Red Spot: a giant storm on Jupiter that is bigger than the whole Earth!', 'jupiterredspot'); }, X + 284, null);
    G.interact.push({ x: X + 284, y: LY, layer: 'space', disc: 'jupitertelescope', run: () => tel.children[0].userData.tap && tel.children[0].userData.tap(), hintY: 2.4 });
    // THE GREAT RED SPOT itself, painted big in the sky behind (one mesh)
    const rs = makeBatch(); for (let i = 0; i < 6; i++) rs.put(G0.lo, 0, 0, -i * .02, ['#c94a2e', '#e06a3e', '#f08a5a', '#c94a2e', '#a83a24', '#f6c8a0'][i], [26 - i * 4, 15 - i * 2.4, 1]);
    for (let i = 0; i < 7; i++) rs.put(G0.lo, -60 + i * 20, (i % 2 ? 22 : -20), .05, JUP[i % 5], [16, 3, 1]);
    const spot = rs.mesh(glowMat()); spot.position.set(X + 320, 60, -170); spot.renderOrder = -1; k.add(spot); }
  // ---------- the TWISTER TUBE: an enclosed corkscrew slide with coloured light rings, from the lookout's right end ----------
  { const cx = X + 297, cz = -2.2, r = 2.6, pts = [V3(LX1 + .2, LY + .5, -1.2)];
    for (let i = 0; i <= 54; i++) { const a = Math.PI + i / 54 * Math.PI * 6.5; pts.push(V3(cx + Math.cos(a) * r, LY - .3 - i / 54 * 16.4, cz + Math.sin(a) * r)); }
    pts.push(V3(X + 299.5, .9, 0), V3(X + 302, .75, 0));
    const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .3); slideTube(k, path, { segs: 210, rings: 14, cols: ['#9b6cff', '#5aa8ff'], bands: 26 });
    const mouth = new THREE.Mesh(G0.torus, toy('#ffd23f', { r: .3, ei: .4 })); mouth.position.set(LX1 - .2, LY + .9, -1.2); mouth.rotation.y = Math.PI / 2; mouth.scale.setScalar(1.1); k.add(mouth);
    const go = () => { if (!near(P, LX1, LY, 3.5, 1.2)) return false; P.x = LX1 + .2; P.y = LY; k.G.startSlide(path, { vmax: 11, acc: 6 }); k.disc('jupitertwister', '🌀 Round and round inside the Twister Tube!'); return true; };
    let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && onPlanet(P) && !P.ride && P.grounded && Math.abs(P.y - LY) < .1 && P.x > LX1 - .4 && P.vx > .5 && go()) cool = 2; });
    k.tapIt(mouth, go, LX1, null); }
  // ---------- THE GREAT RED SPOT SLIDE: the biggest one, from the lookout all the way back to the ball pit ----------
  { const pts = [[LX0 - .2, LY + .5, -1.2], [X + 272, 18, -5], [X + 268, 17.2, -13], [X + 258, 16, -19], [X + 244, 14, -20.5], [X + 232, 12.5, -19.5], [X + 220, 10.5, -18], [X + 209, 9.5, -14],
      [X + 200, 9, -16], [X + 191, 7.5, -12.5], [X + 186, 5.5, -7], [X + 191, 4.2, -4.6], [X + 197, 2.7, -3.3], [X + 203.5, .75, -1.4]].map(p => V3(...p));
    const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .35), tube = slideTube(k, path, { segs: 380, r: 1, postEvery: .05, bands: 21 });
    // glowing hoops to slide through (they ring as you pass), and clouds round the far part of the ride
    const hu = [.12, .24, .36, .48, .6, .72, .84], hoops = [], q = new THREE.Quaternion(), e = new THREE.Euler(), Z = V3(0, 0, 1), hb = makeBatch(), cb = makeBatch();
    for (const [i, u] of hu.entries()) { const p = path.getPointAt(u), t = path.getTangentAt(u); q.setFromUnitVectors(Z, t); e.setFromQuaternion(q); hb.put(G0.torus, p.x, p.y, p.z, RB[i % 7], 1.9, [e.x, e.y, e.z]); hoops.push(u); }
    for (let u = .25; u < .7; u += .035) { const p = path.getPointAt(u); for (const [dy, dz, s] of [[-2.2, -2.2, 1.6], [-1.6, 2.4, 1.2], [-2.8, .4, 1.9]]) cb.put(G0.lo, p.x + (u * 97 % 2), p.y + dy, p.z + dz, '#fff7ee', [s * 1.4, s * .7, s]); }
    k.add(hb.mesh(glowMat())); k.add(cb.mesh(glowMat()));
    const mouth = new THREE.Mesh(G0.torus, toy('#ff4f6a', { r: .3, ei: .4 })); mouth.position.set(LX0 + .2, LY + .9, -1.2); mouth.rotation.y = Math.PI / 2; mouth.scale.setScalar(1.15); k.add(mouth);
    let next = 0;
    const go = () => { if (!near(P, LX0, LY, 3.5, 1.2)) return false; P.x = LX0 - .2; P.y = LY; next = 0; G.jupiterHoops = 0; k.G.startSlide(path, { vmax: 13, acc: 5 }); k.say('🔴 The GREAT RED SPOT SLIDE! The biggest slide on Jupiter! Wheeeee!', true); k.disc('jupiterbigslide'); return true; };
    let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && onPlanet(P) && !P.ride && P.grounded && Math.abs(P.y - LY) < .1 && P.x < LX0 + .4 && P.vx < -.5 && go()) cool = 2;
      const R = P.ride; if (R && R.type === 'slide' && R.path === path && next < hoops.length && R.u >= hoops[next]) { S.tone(520 + next * 70, .18, 'sine', .07, 1.5); k.api.burst(P.x, P.y + .6, P.z, RB, 12, 2); next++; G.jupiterHoops = next; if (next === hoops.length) k.say('🎉 Through all the hoops!', true); } });
    k.tapIt(mouth, go, LX0, null);
    G.interact.push({ x: LX0 + 1, y: LY, layer: 'space', disc: 'jupiterbigslidego', run: go, hintY: 2.4 });
    G.jupiterBigSlide = path; }
  // ---------- TRAVEL BALLOONS: float from here to the lookout's foot, and from there back to the start ----------
  travelBalloon(k, X + 246, X + 274, '#5aa8ff', 'jupiterballoon2');
  travelBalloon(k, X + 305, X + 109, '#ffd23f', 'jupiterballoon3');
}

// a big balloon with a basket: tap it and you float in a high arc to another part of the playground
function travelBalloon(k, x, to, c, id) {
  const P = k.P, G0 = GEO(), g = new THREE.Group(); g.position.set(x, 0, -2.2); k.add(g); const b = makeBatch();
  b.put(G0.ball, 0, 4.2, 0, c, [1.3, 1.5, 1.3]); b.put(G0.cone, 0, 2.8, 0, c, [.55, .7, .55], [Math.PI, 0, 0]); b.put(G0.box, 0, 1.2, 0, '#c98a4a', [.9, .7, .9]);
  for (const s of [-1, 1]) b.put(G0.cyl, s * .4, 2, 0, '#ffffff', [.02, 1.6, .02]); const m = mesh(b, shinyMat(), true); g.add(m);
  k.U.push((dt, t) => { m.position.y = Math.sin(t * 1.3 + x) * .15; });
  const go = () => { if (P.ride || !onPlanet(P) || Math.abs(P.x - x) > 4 || P.y > 2) return; k.Sound.whoosh(); k.fact('🎈 Up, up and away! The balloon floats you to another part of the playground!', 'jupitertravel'); const x0 = P.x;
    rideTo(k, 'jballoon', (R, dt) => { const f = Math.min(1, R.t / 4), e = f * f * (3 - 2 * f); P.x = x0 + (to - x0) * e; P.y = Math.sin(f * Math.PI) * 16; P.z = -.5; R.roll = Math.sin(R.t * 2) * .08; return f >= 1; }, () => { P.y = 0; P.z = 0; P.x = to + 1.5; }); };
  k.tapIt(g, go, x, id);
}
