// ===================================================================
// volcano-coaster.js (build 164, the family's request): THE VOLCANO ISLAND ROLLER COASTER, ridden in FIRST PERSON.
//
// One continuous track (volcano-course.js, built by coaster-course.js like the Moon coaster): from the station it spirals up
// round the OUTSIDE of the volcano (74 m up), dives in through a HOLE IN ITS SIDE, rides round and down inside the hollow
// LAVA CHAMBER (rock walls lit orange, a glowing lava lake, lava falls, hanging rocks, rock pillars), through a twisting
// LAVA TUNNEL and out through a hole on the far side, DROPS INTO THE LAGOON and runs under the water in a GLASS TUNNEL
// (a sandy seafloor, coral, sea plants, rocks, fish swimming, bubbles, sunbeams), climbs out, boosts into a LOOP, a
// CORKSCREW, and comes home to the station.
//
// The ride itself is the coaster ride in main.js (the same one as the Moon's: speed, the 🏁 button, riding together);
// this coaster asks it for the FIRST-PERSON camera (C.fp), its own words (C.says) and 🐾 to grab the six stars (C.onPaw).
//
// Speed: everything is painted in ONE shared unlit material (glowMat: no new shaders) and batched into a few meshes; the
// volcano's inside and the underwater world are drawn only when the camera is near them; the detailed rails stream in
// pieces near the camera; the one-time work is done a few milliseconds per frame.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, col, glowMat as sharedGlow } from './spacekit.js';
import { toy } from './creatures.js';
import { buildCourse } from './coaster-course.js';
import { VCOURSE, VSTATION, VOLCANO, LAGOON, volR } from './volcano-course.js';

const SECTION = 240, NEAR = 45, NEAR_RIDE = 90, MAX_PIECES = 2, MAX_RIDE = 3;

export function buildVolcanoCoaster(k) {
  const X = k.X, P = k.P, G = k.G;
  const C = buildCourse(X, { course: VCOURSE, station: VSTATION, h0: 180, vmax: 30 }), { N, pos, tan, up, flag } = C;
  const V = (i, arr = pos, o = new THREE.Vector3()) => o.set(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]);
  const VX = X + VOLCANO.cx, VZ = VOLCANO.cz, LX = X + LAGOON.cx, LZ = LAGOON.cz;
  const root = new THREE.Group(); root.name = 'volcanoCoaster'; root.userData.dynamic = true; k.add(root);
  const glowMat = sharedGlow();
  const jobs = [], hidden = [];
  const tA = new THREE.Vector3(), uA = new THREE.Vector3(), sA = new THREE.Vector3(), pA = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const frame = i => { V(i, tan, tA); V(i, up, uA); sA.crossVectors(tA, uA).normalize(); m4.makeBasis(tA, uA, sA); q.setFromRotationMatrix(m4); e.setFromQuaternion(q); return e; };
  const qY90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), qr = new THREE.Quaternion(), er = new THREE.Euler();
  const ringRot = i => { frame(i); qr.copy(q).multiply(qY90); er.setFromQuaternion(qr); return [er.x, er.y, er.z]; };
  const LD = new THREE.Vector3(.35, .85, .4).normalize(), litC = {};
  const lit = hex => litC[hex] || (litC[hex] = (x, y, z, nx, ny, nz, out) => { const d = Math.max(0, nx * LD.x + ny * LD.y + nz * LD.z), kk = Math.min(1.05, .4 + .52 * d + .12 * (ny * .5 + .5)); out.copy(col(hex)).multiplyScalar(kk); });
  const glow = makeBatch(), skel = { put: (g, x, y, z, c, s, r) => glow.put(g, x, y, z, lit(c), s, r), add: (g, m, c) => glow.add(g, m, lit(c)) };
  const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 6), ball = new THREE.SphereGeometry(1, 10, 7), cone = new THREE.ConeGeometry(1, 1, 8), oct = new THREE.OctahedronGeometry(1, 0);
  // where is a track point: inside the volcano's rock cone? under the water?
  const rOf = (x, z) => Math.hypot(x - VX, z - VZ), inVolc = i => { V(i, pos, pA); return pA.y < VOLCANO.h - .5 && rOf(pA.x, pA.z) < volR(pA.y); };
  const underW = i => pos[i * 3 + 1] < .2 && Math.hypot(pos[i * 3] - LX, pos[i * 3 + 2] - LZ) < LAGOON.r + 6;
  // the holes: where the track goes into the volcano and comes out of it
  const holes = []; { let was = inVolc(0); for (let i = 1; i < N; i++) { const now = inVolc(i); if (now !== was) holes.push(i); was = now; } }
  C.holes = holes; C.inVolc = new Uint8Array(N); C.underW = new Uint8Array(N); for (let i = 0; i < N; i++) { C.inVolc[i] = inVolc(i) ? 1 : 0; C.underW[i] = underW(i) ? 1 : 0; }

  // ---------- THE TRACK'S SPINE, beads and support towers (the always-on skeleton) ----------
  { const pts = []; for (let i = 0; i < N; i += 8) pts.push(V(i)); pts.push(V(N - 1));
    jobs.push(() => { skel.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), Math.ceil(pts.length * .6), .28, 3, false), null, '#3a2a2a'); }); }
  jobs.push(() => { const post = new THREE.CylinderGeometry(1, 1, 1, 6);
    for (let i = 0; i < N; i++) {
      if (i % 120 === 0) { V(i, pos, pA); glow.put(new THREE.TorusGeometry(.42, .08, 3, 6), pA.x, pA.y, pA.z, (i / 120) % 2 ? '#ffb23f' : '#ff4f2a', 1, ringRot(i)); }
      if (i % 96 !== 0 || flag[i] === 'S' || C.inVolc[i] || C.underW[i]) continue;
      V(i, pos, pA); V(i, up, uA); if (uA.y < .35 || pA.z > -9) continue;
      if (Math.hypot(pA.x - LX, pA.z - LZ) < LAGOON.r) continue;            // (no towers standing in the lagoon)
      const h = pA.y - .45; if (h < 1.2) continue; const r = .2 + Math.min(.5, h * .005);
      skel.put(post, pA.x, h / 2, pA.z, '#4a3a3a', [r, h, r]); skel.put(cyl, pA.x, .3, pA.z, '#2a2226', [r * 2.2, .6, r * 2.2]);
      for (let y = 18; y < h - 4; y += 30) glow.put(new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), pA.x, y, pA.z, '#ff7a2a', [r * 1.35, .18, r * 1.35]); } });

  // ---------- THE VOLCANO: a hollow cone with real holes where the track goes in and out ----------
  const cutHoles = (geo, rad) => { const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position.array, keep = [], c = new THREE.Vector3();
    const hp = holes.map(i => V(i)); for (let t = 0; t < p.length; t += 9) { c.set((p[t] + p[t + 3] + p[t + 6]) / 3, (p[t + 1] + p[t + 4] + p[t + 7]) / 3, (p[t + 2] + p[t + 5] + p[t + 8]) / 3); if (hp.some(h => h.distanceTo(c) < rad)) continue; for (let j = 0; j < 9; j++) keep.push(p[t + j]); }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); out.computeVertexNormals(); if (g !== geo) g.dispose(); return out; };
  jobs.push(() => { // the outside: dark rock, rougher and redder towards the glowing crater
    const prof = []; for (let i = 0; i <= 22; i++) { const y = -2 + i * (VOLCANO.h + 2) / 22; prof.push(new THREE.Vector2(volR(Math.max(0, y)) + (i % 2) * .6, y)); } prof.push(new THREE.Vector2(VOLCANO.rTop - 1.5, VOLCANO.h + .6));
    const lg = new THREE.LatheGeometry(prof, 56); lg.translate(VX, 0, VZ); const g = cutHoles(lg, 9.5); lg.dispose();
    const vb = makeBatch(); vb.add(g, null, (x, y, z, nx, ny, nz, out) => { const n = Math.sin(x * .31) * Math.sin(z * .27 + y * .2), hot = Math.max(0, (y - VOLCANO.h * .7) / (VOLCANO.h * .3)), a = Math.atan2(z - VZ, x - VX), streak = Math.sin(a * 9) > .93 && y > 12 ? 1 : 0; /* (lit brighter than the first try: from the shady side it looked almost black) and glowing lava streaks down the sides */ out.copy(col(n > .3 ? '#8a7a7e' : '#6e6266')).lerp(col('#c0502a'), hot * .6).lerp(col('#ff8a2e'), streak * .85).multiplyScalar(.78 + .3 * Math.max(0, nx * LD.x + ny * LD.y + nz * LD.z)); }); g.dispose();
    for (const i of holes) { V(i, pos, pA); vb.put(new THREE.TorusGeometry(7.4, 1.1, 6, 20), pA.x, pA.y, pA.z, lit('#2a2226'), 1, ringRot(i)); vb.put(new THREE.TorusGeometry(6.6, .25, 4, 20), pA.x, pA.y, pA.z, '#ff7a2a', 1, ringRot(i)); } // a rocky rim and a glowing ring round each hole
    const crater = new THREE.Mesh(new THREE.CircleGeometry(VOLCANO.rTop - 1.5, 24), new THREE.MeshBasicMaterial({ color: '#ff8a1e', toneMapped: false })); crater.rotation.x = -Math.PI / 2; crater.position.set(VX, VOLCANO.h - 2, VZ); root.add(crater); C.crater = crater;
    const m = vb.mesh(glowMat); m.receiveShadow = false; root.add(m); });
  // the inside: the lava chamber (drawn only when the camera is near the volcano)
  const inside = new THREE.Group(); inside.visible = false; root.add(inside); hidden.push({ grp: inside, c: new THREE.Vector3(VX, 25, VZ), r: VOLCANO.r0 + 4 });
  jobs.push(() => {
    const prof = []; for (let i = 0; i <= 18; i++) { const y = 1.5 + i * (VOLCANO.h - 3) / 18; prof.push(new THREE.Vector2(Math.max(4, volR(y) - VOLCANO.wall + Math.sin(i * 1.7) * .8), y)); }
    const lg = new THREE.LatheGeometry(prof, 48); lg.translate(VX, 0, VZ); const g = cutHoles(lg, 9); lg.dispose();
    const pa = g.attributes.position.array; for (let t = 0; t < pa.length; t += 9) for (let j = 0; j < 3; j++) { const a = t + 3 + j, b = t + 6 + j, w = pa[a]; pa[a] = pa[b]; pa[b] = w; } g.computeVertexNormals(); // (turned to face inwards)
    const ib = makeBatch(); ib.add(g, null, (x, y, z, nx, ny, nz, out) => { const glowK = Math.max(0, 1 - y / 26), vein = Math.sin(x * .7 + y * .9) * Math.sin(z * .6 - y * .4) > .55 ? 1 : 0; out.copy(col('#3a2228')).lerp(col('#c8501e'), glowK * .75).lerp(col('#ffb23f'), vein * .55); }); g.dispose();
    // hanging rocks (stalactites) from the upper walls, rock pillars standing in the lava, lava falls down the walls
    for (let n = 0; n < 26; n++) { const a = n * 2.4, y = 26 + (n % 5) * 4.5, r = volR(y) - VOLCANO.wall - 1.5, L = 3 + (n % 4) * 1.6; ib.put(cone, VX + Math.cos(a) * r, y - L / 2, VZ + Math.sin(a) * r, n % 3 ? '#4a3036' : '#6a3a2a', [.9 + (n % 3) * .3, L, .9 + (n % 3) * .3], [Math.PI, 0, 0]); }
    for (let n = 0; n < 7; n++) { const a = n * .9 + .4, r = 30 + (n % 3) * 5, h = 6 + (n % 4) * 3; ib.put(cone, VX + Math.cos(a) * r, h / 2 + 1.5, VZ + Math.sin(a) * r, '#3a2a2e', [2.2, h, 2.2]); }
    for (let n = 0; n < 6; n++) { const a = n * 1.05 + .2, y = 14, r = volR(y) - VOLCANO.wall - .3; ib.put(box, VX + Math.cos(a) * r, y / 2 + 2, VZ + Math.sin(a) * r, '#ffb23f', [1.6, y, .4], [0, -a + Math.PI / 2, 0]); }
    inside.add(ib.mesh(glowMat));
    // THE LAVA LAKE (gently glowing and moving) and a hot glow over it
    const lava = new THREE.Mesh(new THREE.CircleGeometry(volR(2) - VOLCANO.wall, 40), new THREE.MeshBasicMaterial({ color: '#ff6a1a', toneMapped: false })); lava.rotation.x = -Math.PI / 2; lava.position.set(VX, 2.2, VZ); inside.add(lava); C.lava = lava;
    const lavaB = makeBatch(); for (let n = 0; n < 40; n++) { const a = n * 2.39, r = 4 + (n * 1.13) % 38; lavaB.put(ball, VX + Math.cos(a) * r, 2.25, VZ + Math.sin(a) * r, n % 2 ? '#ffd23f' : '#ff9a2e', [1.2 + (n % 3), .08, .9 + (n % 2)]); } inside.add(lavaB.mesh(glowMat));
  });
  // THE LAVA TUNNEL: the part of the ride inside the chamber after the spiral, out to the far hole (a twisting tube)
  jobs.push(() => { let a = -1; for (let i = 0; i < N; i++) if (flag[i] === 'V') a = i; if (a < 0) return; const b = holes[holes.length - 1] || a; if (b - a < 20) return;
    const pts = []; for (let i = a - 20; i <= b - 6; i += 6) pts.push(V(i)); const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 5.2, 10, false), ia = tg.index.array, na = tg.attributes.normal.array;
    for (let t = 0; t < ia.length; t += 3) { const w = ia[t + 1]; ia[t + 1] = ia[t + 2]; ia[t + 2] = w; } for (let t = 0; t < na.length; t++) na[t] = -na[t];
    const tb = makeBatch(); tb.add(tg, null, (x, y, z, nx, ny, nz, out) => { const vein = Math.sin(x * 1.3 + z) * Math.sin(y * 1.7) > .5 ? 1 : 0; out.copy(col('#4a2a2a')).lerp(col('#ff7a2a'), vein * .8).multiplyScalar(.8 + .3 * Math.max(0, -ny)); }); tg.dispose();
    for (let i = a; i <= b; i += 24) { V(i, pos, pA); tb.put(new THREE.TorusGeometry(5, .25, 4, 18), pA.x, pA.y, pA.z, '#ffb23f', 1, ringRot(i)); }
    inside.add(tb.mesh(glowMat)); });

  // ---------- THE LAGOON and THE UNDERWATER WORLD (drawn only when the camera is near) ----------
  const sea = new THREE.Group(); sea.visible = false; root.add(sea); hidden.push({ grp: sea, c: new THREE.Vector3(LX, -6, LZ), r: LAGOON.r + 20 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(LAGOON.r, 40), new THREE.MeshBasicMaterial({ color: '#3fb4e8', transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false })); water.rotation.x = -Math.PI / 2; water.position.set(LX, .05, LZ); root.add(water); C.water = water;
  jobs.push(() => {
    const prof = [new THREE.Vector2(0, -LAGOON.depth)]; for (let i = 1; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(LAGOON.r * t + 2 * t, -LAGOON.depth * (1 - t * t) - .1)); }
    const lg = new THREE.LatheGeometry(prof, 40), pa = lg.attributes.position.array; lg.translate(LX, 0, LZ); // (seen from above: the bowl's inside)
    void pa; // (the bowl as the lathe makes it faces up and in: seen from the water)
    const sb = makeBatch(); sb.add(lg, null, (x, y, z, nx, ny, nz, out) => { const n = Math.sin(x * .8) * Math.sin(z * .7); out.copy(col(n > .2 ? '#f0d8a0' : '#e0c890')).lerp(col('#3fa0c8'), Math.min(.45, -y / 40)); }); lg.dispose();
    const COR = ['#ff6f9f', '#ffb23f', '#b07cff', '#ff4f6a', '#7dffb0', '#ffd23f'];
    for (let n = 0; n < 70; n++) { const a = n * 2.39, r = 4 + (n * 2.71) % (LAGOON.r - 6), x = LX + Math.cos(a) * r, z = LZ + Math.sin(a) * r, d = LAGOON.depth * (1 - (r / LAGOON.r) ** 2), y = -d;
      const kind = n % 5; if (kind === 0) sb.put(ball, x, y + .6, z, COR[n % 6], [1, .8, 1]);                 // round brain coral
      else if (kind === 1) { for (let j = 0; j < 4; j++) sb.put(cyl, x + Math.cos(j * 1.6) * .4, y + .9, z + Math.sin(j * 1.6) * .4, COR[(n + 2) % 6], [.16, 1.8 - j * .2, .16], [Math.cos(j) * .3, 0, Math.sin(j) * .3]); } // branch coral
      else if (kind === 2) { for (let j = 0; j < 5; j++) sb.put(box, x + j * .25 - .5, y + 1.4, z, j % 2 ? '#3fbf5a' : '#2f9a4a', [.12, 2.8 + (j % 3) * .6, .08], [0, 0, (j - 2) * .12]); } // sea plants (kelp)
      else if (kind === 3) sb.put(ball, x, y + .5, z, n % 2 ? '#7a7f88' : '#8a8f98', [2, 1.1, 1.6]);         // rocks
      else sb.put(cone, x, y + .5, z, '#ff9fd8', [.5, 1, .5]); }                                               // sea anemones
    for (let n = 0; n < 4; n++) { const a = n * 1.6; sb.put(ball, LX + Math.cos(a) * 20, -LAGOON.depth * .6, LZ + Math.sin(a) * 20, '#6a7078', [4, 3.5, 3], [0, a, 0]); } // big underwater rocks
    sea.add(sb.mesh(glowMat));
    // sunbeams through the water (soft, see-through)
    const rayM = new THREE.MeshBasicMaterial({ color: '#dff6ff', transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    for (let n = 0; n < 7; n++) { const r2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, LAGOON.depth), rayM); r2.position.set(LX - 25 + n * 8, -LAGOON.depth / 2, LZ - 10 + (n % 3) * 8); r2.rotation.set(0, n * .5, .25); sea.add(r2); }
    // THE GLASS TUNNEL round the track under the water, with rings every few metres
    const ui = []; for (let i = 0; i < N; i++) if (pos[i * 3 + 1] < .8 && Math.hypot(pos[i * 3] - LX, pos[i * 3 + 2] - LZ) < LAGOON.r + 4) ui.push(i);
    if (ui.length > 10) { const pts = []; for (let j = 0; j < ui.length; j += 6) pts.push(V(ui[j])); pts.push(V(ui[ui.length - 1]));
      const glass = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 3.3, 14, false), new THREE.MeshBasicMaterial({ color: '#bfeaff', transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false })); sea.add(glass);
      const rb = makeBatch(); for (let j = 0; j < ui.length; j += 10) { V(ui[j], pos, pA); rb.put(new THREE.TorusGeometry(3.3, .12, 4, 20), pA.x, pA.y, pA.z, '#ffffff', 1, ringRot(ui[j])); } sea.add(rb.mesh(glowMat)); }
  });
  // fish swimming round the lagoon (one instanced mesh; moved only while the underwater world is drawn)
  const FISH = 30, fishG = new THREE.SphereGeometry(.35, 8, 6); fishG.scale(1.6, .8, .5);
  const fish = new THREE.InstancedMesh(fishG, new THREE.MeshBasicMaterial({ color: '#ffffff' }), FISH); fish.frustumCulled = false; sea.add(fish);
  { const FC = ['#ff9a2e', '#ffd23f', '#4fb0ff', '#ff6f9f', '#7dffb0', '#b07cff'], cc = new THREE.Color(); for (let n = 0; n < FISH; n++) fish.setColorAt(n, cc.set(FC[n % 6])); }
  const FQ = new THREE.Quaternion(), FS = new THREE.Vector3(1, 1, 1), FP = new THREE.Vector3(), FY = new THREE.Vector3(0, 1, 0);
  // UNDER THE SURFACE: the water all round turns sea-blue (the scene's own fog, closer and blue, only while the camera is under the
  //  lagoon's water; no new shader: the same fog, other numbers)
  let fogSave = null; const fogOf = () => { let sc = root; while (sc.parent) sc = sc.parent; return sc.fog; };
  k.U.push(() => { const cam = G.camera ? G.camera.position : null, f = fogOf(); if (!cam || !f || !f.color) return; const under = cam.y < -.3 && Math.hypot(cam.x - LX, cam.z - LZ) < LAGOON.r;
    if (under && !fogSave) { fogSave = { c: f.color.clone(), n: f.near, fa: f.far }; f.color.set('#2a8ac8'); f.near = 4; f.far = 46; }
    else if (!under && fogSave) { f.color.copy(fogSave.c); f.near = fogSave.n; f.far = fogSave.fa; fogSave = null; } });
  k.U.push((dt, t) => { if (!sea.visible) return; for (let n = 0; n < FISH; n++) { const r = 8 + (n % 6) * 5, sp = .25 + (n % 4) * .06, a = t * sp * (n % 2 ? 1 : -1) + n * 1.7;
      FP.set(LX + Math.cos(a) * r, -3 - (n % 5) * 2.4 + Math.sin(t + n) * .4, LZ + Math.sin(a) * r * .8); FQ.setFromAxisAngle(FY, -a + (n % 2 ? -Math.PI / 2 : Math.PI / 2)); m4.compose(FP, FQ, FS); fish.setMatrixAt(n, m4); }
    fish.instanceMatrix.needsUpdate = true;
    if (k.api.burst && Math.random() < dt * 3) k.api.burst(LX + (Math.random() - .5) * 50, -LAGOON.depth * Math.random(), LZ + (Math.random() - .5) * 40, ['#ffffff', '#dff6ff'], 2, .8); });

  // (build 176) MORE SEA CREATURES, seen from the glass tunnel: three sea turtles gliding round with their flippers out, two big
  //  friendly manta rays flapping slowly, an octopus waving its arms on a rock, and five glowing jellyfish bobbing up and down.
  //  Each is ONE mesh with the same glow material as the coral (no new shader); they are in the underwater group, so they are
  //  drawn and moved only while the camera is near the lagoon.
  const critters = [];
  { const turtle = () => { const b = makeBatch(); b.put(ball, 0, 0, 0, '#3f8a3a', [1.3, .45, 1]); for (const x of [-.45, 0, .45]) b.put(ball, x, .32, 0, '#7ab84a', [.3, .1, .26]); b.put(ball, 1.35, .05, 0, '#8fcf6a', [.38, .3, .32]);
      for (const z of [-.14, .14]) { b.put(ball, 1.62, .15, z, '#ffffff', .1); b.put(ball, 1.69, .16, z, '#1a1a24', .055); }
      for (const [x, z, sc] of [[.55, 1.1, 1], [.55, -1.1, 1], [-.75, .8, .65], [-.75, -.8, .65]]) b.put(ball, x, -.05, z, '#8fcf6a', [.55 * sc, .08, .28 * sc], [0, z > 0 ? -.5 : .5, 0]); return b.mesh(glowMat); };
    const ray = () => { const b = makeBatch(); b.put(ball, 0, 0, 0, '#3a4a6a', [1.1, .25, 2.6]); b.put(ball, 0, .06, 0, '#4f6a9a', [.9, .2, 2.2]); b.put(ball, 0, -.08, 0, '#f2f6ff', [.8, .12, 1.6]);
      for (const z of [-.3, .3]) b.put(ball, .95, .12, z, '#ffffff', .12); b.put(cone, -1.9, 0, 0, '#3a4a6a', [.08, 1.8, .08], [0, 0, Math.PI / 2]); return b.mesh(glowMat); };
    const octo = () => { const b = makeBatch(); b.put(ball, 0, 1.3, 0, '#ff6f9f', [.9, 1.1, .9]); for (const z of [-.3, .3]) { b.put(ball, .75, 1.35, z, '#ffffff', .2); b.put(ball, .9, 1.35, z, '#1a1a24', .1); }
      for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; for (let q = 0; q < 4; q++) b.put(ball, Math.cos(a) * (.6 + q * .4), .55 - q * .12 + Math.sin(q * 1.4) * .15, Math.sin(a) * (.6 + q * .4), q % 2 ? '#ff8fb8' : '#ff6f9f', .26 - q * .04); } return b.mesh(glowMat); };
    const jelly = c => { const b = makeBatch(); b.put(ball, 0, 0, 0, c, [.7, .5, .7]); for (let j = 0; j < 5; j++) { const a = j * 1.26; b.put(cyl, Math.cos(a) * .35, -.8, Math.sin(a) * .35, c, [.04, 1.4, .04]); } return b.mesh(glowMat); };
    for (const [r, d, sp, ph] of [[13, -5, .16, 0], [21, -8, -.12, 2], [27, -4.5, .1, 4]]) { const m = turtle(); m.scale.setScalar(1.3); sea.add(m); critters.push({ m, kind: 't', r, d, sp, ph }); }
    for (const [r, d, sp, ph] of [[17, -3.5, .09, 1], [30, -6, -.07, 3.5]]) { const m = ray(); m.scale.setScalar(1.6); sea.add(m); critters.push({ m, kind: 'r', r, d, sp, ph }); }
    { const m = octo(), ox = LX + 9, oz = LZ - 5, od = LAGOON.depth * (1 - (Math.hypot(9, 5) / LAGOON.r) ** 2); m.position.set(ox, -od + .2, oz); m.rotation.y = -.6; sea.add(m); critters.push({ m, kind: 'o', y0: -od + .2 }); }
    ['#ffb3e6', '#b3e6ff', '#d9b3ff', '#ffe0b3', '#b3ffd9'].forEach((c, n) => { const m = jelly(c); const a = n * 1.25 + .4, r = 9 + n * 5; m.position.set(LX + Math.cos(a) * r, -3 - (n % 3) * 1.5, LZ + Math.sin(a) * r * .8); sea.add(m); critters.push({ m, kind: 'j', y0: m.position.y, ph: n }); }); }
  C.seaCritters = critters; // (for the tests)
  k.U.push((dt, t) => { if (!sea.visible) return; for (const c of critters) { const m = c.m;
      if (c.kind === 't' || c.kind === 'r') { const a = t * c.sp + c.ph; m.position.set(LX + Math.cos(a) * c.r, c.d + Math.sin(t * .5 + c.ph) * .6, LZ + Math.sin(a) * c.r * .8); m.rotation.y = -a + (c.sp > 0 ? -Math.PI / 2 : Math.PI / 2);
        m.rotation.z = Math.sin(t * .7 + c.ph) * .1; if (c.kind === 'r') m.scale.y = 1.6 * (1 + Math.sin(t * 1.6 + c.ph) * .35); }
      else if (c.kind === 'o') { m.rotation.y = -.6 + Math.sin(t * .6) * .3; m.scale.set(1 + Math.sin(t * 1.3) * .05, 1 - Math.sin(t * 1.3) * .05, 1 + Math.sin(t * 1.3) * .05); }
      else { m.position.y = c.y0 + Math.sin(t * .8 + c.ph) * .8; m.scale.set(1 - Math.sin(t * 1.6 + c.ph) * .12, 1 + Math.sin(t * 1.6 + c.ph) * .15, 1 - Math.sin(t * 1.6 + c.ph) * .12); } } });

  // ---------- the station: a platform under a striped roof, with glowing lava-orange arches ----------
  { const sx = X + VSTATION.dx; skel.put(box, sx - 4, .35, -.6, '#e8d8c8', [16, .7, 2.6]); k.plat(sx - 12, sx + 4, .7, { step: true, stepMax: .8 });
    for (let i = 0; i < 9; i++) skel.put(box, sx - 11.5 + i * 2, 4.4, -2.2, i % 2 ? '#ffffff' : '#ff6a1a', [2, .2, 4.4]);
    for (const dx of [-11.5, 3.5]) { skel.put(cyl, sx + dx, 2.2, -.4, '#ffffff', [.16, 4.4, .16]); skel.put(cyl, sx + dx, 2.2, -4, '#ffffff', [.16, 4.4, .16]); }
    for (const dx of [-12, 4]) glow.put(new THREE.TorusGeometry(3.4, .16, 6, 30, Math.PI), sx + dx, 0, -2.4, '#ff9a2e', 1, [0, Math.PI / 2, 0]); }

  // ---------- THE SIX STARS along the ride: 🐾 grabs the one right in front of the train ----------
  const STAR_AT = [.18, .3, .4, .5, .58, .78].map(f => Math.floor(N * f)), stars = [], starB = makeBatch(); starB.put(oct, 0, 0, 0, '#ffd23f', [.55, .75, .55]); const starGeo = starB.geometry();
  for (const [n, i] of STAR_AT.entries()) { const m = new THREE.Mesh(starGeo, shinyMat()); V(i, pos, pA); V(i, up, uA); m.position.copy(pA).addScaledVector(uA, 2.6); m.userData.dynamic = true; root.add(m); stars.push({ m, i, got: false, n, told: false }); }
  C.stars = stars;
  C.onPaw = R => { const s = stars.find(q => !q.got && Math.abs(R.i - q.i) < 40); if (!s) { k.say('⭐ Watch for the next star, then tap 🐾!', true); return; } s.got = true; s.m.visible = false; k.Sound.chime(); k.api.burst && k.api.burst(s.m.position.x, s.m.position.y, s.m.position.z, ['#ffd23f', '#ffffff'], 16, 2.4);
    const got = stars.filter(q => q.got).length; k.say(got < 6 ? `⭐ You grabbed a star! ${got} of 6!` : '⭐ ALL SIX STARS! You are a coaster star!', true); k.disc && k.disc(got < 6 ? 'vcoasterstar' : 'vcoasterstars'); };
  C.onTick = R => { for (const s of stars) { if (s.got) continue; s.m.rotation.y += .05; if (!s.told && R.i > s.i - 40 && R.i < s.i) { s.told = true; k.say('⭐ A star! Tap 🐾 to grab it!', true); } } };
  C.onStart = () => { for (const s of stars) { s.got = false; s.told = false; s.m.visible = true; } };

  // ---------- one-time work, a few milliseconds a frame; then the skeleton becomes one mesh ----------
  jobs.push(() => { const g2 = glow.mesh(glowMat); g2.receiveShadow = false; root.add(g2); try { k.api.compile && k.api.compile(root); } catch (err) { } check = 0; C.ready = true; });
  k.U.push(() => { const t0 = performance.now(); while (jobs.length && performance.now() - t0 < 4) jobs.shift()(); });

  // ---------- the detailed rails and ties, streamed in 120 m pieces near the camera ----------
  const pieces = new Map(), nP = Math.ceil(N / SECTION), cen = [];
  for (let s = 0; s < nP; s++) { const a = s * SECTION, b = Math.min(N - 1, a + SECTION); const c = new THREE.Vector3(); let n = 0; for (let i = a; i <= b; i += 10) { c.add(V(i)); n++; } c.multiplyScalar(1 / n); let r = 0; for (let i = a; i <= b; i += 10) r = Math.max(r, V(i).distanceTo(c)); cen.push({ c, r }); }
  function buildPiece(s) { const a = s * SECTION, b = Math.min(N - 1, a + SECTION), rb = makeBatch(), tie = new THREE.BoxGeometry(1, 1, 1);
    for (const sg of [-1, 1]) { const pts = []; for (let i = a; i <= b; i += 4) { V(i, tan, tA); V(i, up, uA); sA.crossVectors(tA, uA).normalize(); pts.push(V(i).addScaledVector(sA, .62 * sg).addScaledVector(uA, .12)); }
      rb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.ceil(pts.length * 1.5), .12, 4, false), null, lit('#ff6a1a')); }
    for (let i = a; i <= b; i += 4) { const f = frame(i); V(i, pos, pA); rb.put(tie, pA.x, pA.y, pA.z, lit('#2a2226'), [.18, .1, 1.45], [f.x, f.y, f.z]); }
    const m = rb.mesh(glowMat); m.receiveShadow = false; root.add(m); return m; }
  let check = 0; const wantNear = [];
  k.U.push((dt, t) => { if (C.lava) C.lava.material.color.setHSL(.05 + Math.sin(t * 1.3) * .012, 1, .52 + Math.sin(t * 2.1) * .04); if (C.crater) C.crater.material.color.setHSL(.06, 1, .5 + Math.sin(t * 1.7) * .05);
    if ((check -= dt) > 0) return; check = .2;
    const cam = G.camera ? G.camera.position : P, ride = P.ride && P.ride.type === 'coaster' && P.ride.C === C ? P.ride : null;
    for (const h of hidden) h.grp.visible = h.c.distanceTo(cam) < h.r + 25;
    wantNear.length = 0; const near = ride ? NEAR_RIDE : NEAR, max = ride ? MAX_RIDE : MAX_PIECES, dist = [];
    if (ride) { const s0 = Math.floor(ride.i / SECTION); for (const s of [s0, s0 + 1, s0 - 1]) if (s >= 0 && s < nP) wantNear.push(s); }
    for (let s = 0; s < nP; s++) dist.push([cen[s].c.distanceTo(cam) - cen[s].r, s]); dist.sort((a, b) => a[0] - b[0]);
    for (const [d, s] of dist) if (d < near && wantNear.length < max && !wantNear.includes(s)) wantNear.push(s);
    for (const [s, m] of pieces) if (!wantNear.includes(s)) { root.remove(m); m.geometry.dispose(); pieces.delete(s); }
    const next = wantNear.find(s => !pieces.has(s)); if (next != null) pieces.set(next, buildPiece(next)); });

  // ---------- the train: three cars, lava-red, and boarding ----------
  const cars = [0, 1, 2].map(n => { const g = new THREE.Group(), cb = makeBatch(), cbox = new THREE.BoxGeometry(1, 1, 1);
    cb.put(cbox, 0, .28, 0, n ? '#ff9a2e' : '#ff4f2a', [2, .5, 1.3]); cb.put(cbox, -.75, .7, 0, '#2a2226', [.32, .55, 1.25]);
    if (!n) { cb.put(new THREE.SphereGeometry(.55, 16, 10), .95, .32, 0, '#ff4f2a', [.75, .55, 1.15]); cb.put(new THREE.ConeGeometry(.3, .6, 8), 1.2, .75, 0, '#ffd23f'); }
    for (const z of [-.55, .55]) for (const x of [-.6, .6]) cb.put(new THREE.CylinderGeometry(.16, .16, .12, 12), x, 0, z, '#2a2226', 1, [Math.PI / 2, 0, 0]);
    g.add(cb.mesh(shinyMat())); g.userData.dynamic = true; root.add(g); return g; });
  const CAR_GAP = 2.4 / C.STEP;
  const placeTrain = i => { for (let n = 0; n < 3; n++) { const j = Math.max(0, Math.min(N - 1, i - n * CAR_GAP)), j0 = Math.floor(j), f = j - j0, j1 = Math.min(N - 1, j0 + 1);
    cars[n].position.set(pos[j0 * 3] + (pos[j1 * 3] - pos[j0 * 3]) * f, pos[j0 * 3 + 1] + (pos[j1 * 3 + 1] - pos[j0 * 3 + 1]) * f, pos[j0 * 3 + 2] + (pos[j1 * 3 + 2] - pos[j0 * 3 + 2]) * f); frame(j0); cars[n].quaternion.copy(q); } };
  placeTrain(2 * CAR_GAP);
  Object.assign(C, { placeTrain, cars, exitX: X + VSTATION.dx + 3, homeI: 2 * CAR_GAP, CAR_GAP, stationX: X + VSTATION.dx, fp: true, name: 'volcano',
    says: { L: '🌋 Up, up, round the OUTSIDE of the volcano!', V: '🔥 INSIDE THE VOLCANO! Look at the glowing lava!', W: '🐠 UNDER THE SEA! Look at the turtles, the fish and the coral!', B: '🚀 BOOST! Zoom!' },
    endSay: '🌋 WOW! Round the volcano, through the lava and under the sea!', disc: 'volcanocoaster' });
  const board = () => { if (P.ride || P.layer !== 'space' || Math.abs(P.x - (X + VSTATION.dx)) > 12) return; if (!C.ready) { k.say('🎢 The volcano coaster is getting ready... one moment!', true); return; }
    k.say('🌋 Hold on tight! Up round the volcano, into the lava, under the sea!', true); C.onStart(); G.startCoaster && G.startCoaster(C); };
  for (const c of cars) k.tapIt(c, board);
  k.tapIt(cars[0], board, X + VSTATION.dx, 'volcanocoasterride');
  G.coasters = G.coasters || {}; G.coasters.volcano = C; G.volcanoCoaster = C; G.volcanoX = VX;
  return C;
}
