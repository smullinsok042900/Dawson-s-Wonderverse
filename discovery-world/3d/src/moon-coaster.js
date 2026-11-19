// ===================================================================
// moon-coaster.js (build 69): THE GIANT MOON ROLLER COASTER, built on the Moon from coaster-course.js.
//
// What is always there (so you see how gigantic it is from anywhere on the Moon), all in very few meshes:
//   • the track's glowing SPINE along the whole 4.7 km, the SUPPORT TOWERS down to the real ground, the 240 m LUNAR SPIRE
//     the lift spirals round (with arms holding the track), the MOUNTAIN the track tunnels through, the glowing CAVE under
//     the ground, the station, and the three-car train.
// What is streamed (only near the camera): the detailed RAILS and TIES, in 120 m pieces. At most one piece is built per
// frame, and pieces far away are freed again.
// The heavy one-time work (the spine, the supports) is done in small slices over several frames, never in one go.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, col, glowMat as sharedGlow } from './spacekit.js';
import { toy } from './creatures.js';
import { buildCourse, STATION } from './coaster-course.js';

const SECTION = 240;             // samples per streamed piece (120 m)
const NEAR = 45, NEAR_RIDE = 90, FAR = 200, MAX_PIECES = 2, MAX_RIDE = 3; // (only the nearest few pieces have rails and ties)

export function buildMoonCoaster(k) {
  const X = k.X, P = k.P, G = k.G, ground = k.ground || (() => 0);
  const C = buildCourse(X), { N, pos, tan, up, flag } = C;
  const V = (i, arr = pos, o = new THREE.Vector3()) => o.set(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]);
  const root = new THREE.Group(); root.name = 'moonCoaster'; root.userData.dynamic = true; k.add(root);
  const glowMat = sharedGlow(); // (shared, and prepared when the game starts: no shader pause on the Moon)
  { // (a tiny mesh with that material is there from the start, so the rocket flight already prepares its shader: no pause on landing)
    const wg = new THREE.BufferGeometry(); for (const n of ['position', 'normal', 'color']) wg.setAttribute(n, new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    const w = new THREE.Mesh(wg, glowMat); w.frustumCulled = false; w.receiveShadow = false; root.add(w); }
  // (build 105) for the riding camera: is this track point (solid: the train) / the point 3.4 m above it (solidCam: where the
  //  camera rides) inside the mountain's rock or below the ground? The camera never stays outside while the train is inside.
  C.solid = new Uint8Array(N); C.solidCam = new Uint8Array(N); const camPt = (i, o) => V(i, pos, o).addScaledVector(V(i, up, uA).normalize(), 3.4);
  const jobs = [];                // slices of one-time work, done a few milliseconds per frame
  const tA = new THREE.Vector3(), uA = new THREE.Vector3(), sA = new THREE.Vector3(), pA = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const frame = i => { V(i, tan, tA); V(i, up, uA); sA.crossVectors(tA, uA).normalize(); m4.makeBasis(tA, uA, sA); q.setFromRotationMatrix(m4); e.setFromQuaternion(q); return e; };
  const qY90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), qr = new THREE.Quaternion(), er = new THREE.Euler();
  const ringRot = i => { frame(i); qr.copy(q).multiply(qY90); er.setFromQuaternion(qr); return [er.x, er.y, er.z]; }; // (a ring standing across the track)
  const ringCyl = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), torusT = new THREE.TorusGeometry(6.2, .2, 4, 20), torusC = new THREE.TorusGeometry(8, .45, 4, 22), spireRing = new THREE.TorusGeometry(1, .14, 3, 12);

  // ---------- the always-on skeleton: spine + glowing beads + supports (built in slices) ----------
  // (the whole structure is drawn with ONE cheap unlit material: its light and shade are painted into the colours once, here,
  //  instead of being worked out for every pixel of every frame. It looks lit, and costs far less to draw.)
  const glow = makeBatch(), LD = new THREE.Vector3(.35, .85, .4).normalize(), litC = {};
  const lit = hex => litC[hex] || (litC[hex] = (x, y, z, nx, ny, nz, out) => { const d = Math.max(0, nx * LD.x + ny * LD.y + nz * LD.z), k = Math.min(1.05, .4 + .52 * d + .12 * (ny * .5 + .5)); out.copy(col(hex)).multiplyScalar(k); });
  const skel = { put: (g, x, y, z, c, s, r) => glow.put(g, x, y, z, lit(c), s, r), add: (g, m, c) => glow.add(g, m, lit(c)) }, box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 6), bead = new THREE.TorusGeometry(.42, .08, 3, 6), post = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), oct = new THREE.OctahedronGeometry(1);
  { const spinePts = []; for (let i = 0; i < N; i += 8) spinePts.push(V(i)); spinePts.push(V(N - 1));
    const curve = new THREE.CatmullRomCurve3(spinePts.map(p => p.clone().addScaledVector(Y0(), 0)), false, 'catmullrom', .1);
    jobs.push(() => { skel.add(new THREE.TubeGeometry(curve, Math.ceil(spinePts.length * .55), .28, 3, false), null, '#dfe6f6'); }); } // (3 sides: from a distance it is a thin line; the streamed rails show the detail near her)
  for (let i0 = 0; i0 < N; i0 += 600) jobs.push(() => {
    for (let i = i0; i < Math.min(N, i0 + 600); i++) {
      if (i % 120 === 0) { V(i, pos, pA); glow.put(bead, pA.x, pA.y, pA.z, (i / 120) % 3 ? '#62f0ff' : '#ff6fd8', 1, ringRot(i)); }
      if (i % 128 !== 0 || flag[i] === 'C' || flag[i] === 'T' || flag[i] === 'L' || flag[i] === 'S') continue;
      V(i, pos, pA); V(i, up, uA); if (uA.y < .35) continue;                        // (no posts under upside-down track)
      if (pA.z > -9) continue;                                                       // (never on the path or the activities)
      const g = ground(pA.x, pA.z), h = pA.y - .45 - g; if (h < 1.2) continue;
      const r = .18 + Math.min(.6, h * .004);
      skel.put(post, pA.x, g + h / 2, pA.z, '#eef2ff', [r, h, r]);
      skel.put(cyl, pA.x, g + .3, pA.z, '#8a93a8', [r * 2.2, .6, r * 2.2]);                     // the foot
      for (let y = 24; y < h - 6; y += 60) glow.put(ringCyl, pA.x, g + y, pA.z, '#62f0ff', [r * 1.35, .18, r * 1.35]); // glowing rings up the tall towers
      // (no diagonal braces: long slanted shapes are slow to draw on some phones)
    } });
  // ---------- THE LUNAR SPIRE in the middle of the spiral lift, with arms holding the track ----------
  { let sx = 0, sz = 0, n = 0, top = 0; for (let i = 0; i < N; i++) if (flag[i] === 'L') { sx += pos[i * 3]; sz += pos[i * 3 + 2]; n++; top = Math.max(top, pos[i * 3 + 1]); }
    if (n) { sx /= n; sz /= n; const H = top + 14;
      jobs.push(() => {
        for (let y = 0; y < H; y += 12) skel.put(post, sx, y + 6, sz, (y / 12) % 2 ? '#e8ecf8' : '#b8c2e8', [3.2 - y * .006, 12, 3.2 - y * .006]);
        for (let y = 10; y < H; y += 24) glow.put(spireRing, sx, y, sz, '#62f0ff', 3.35 - y * .006, [Math.PI / 2, 0, 0]);
        skel.put(new THREE.ConeGeometry(1, 1, 16), sx, H + 6, sz, '#ff6fd8', [3, 12, 3]); glow.put(oct, sx, H + 14, sz, '#ffe36e', 2.4);
        for (let i = 0; i < N; i += 30) if (flag[i] === 'L') { V(i, pos, pA); const dx = pA.x - sx, dz = pA.z - sz, L = Math.hypot(dx, dz);
          skel.put(box, sx + dx / 2, pA.y - .5, sz + dz / 2, '#c9d2e6', [L, .35, .5], [0, -Math.atan2(dz, dx), 0]); } }); } }
  // ---------- THE LUNAR MOUNTAIN the track tunnels through, and the tunnel inside ----------
  const tubeAround = (f, r, colr, ext = 0) => { const idx = []; let a = -1, b = -1; for (let i = 0; i < N; i++) if (flag[i] === f) { if (a < 0) a = i; b = i; } if (a < 0 || b - a < 10) return null; for (let i = Math.max(0, a - ext); i <= Math.min(N - 1, b + ext); i++) idx.push(i);
    const pts = []; for (let j = 0; j < idx.length; j += 6) pts.push(V(idx[j])); pts.push(V(idx[idx.length - 1]));
    // (the walls face inwards: the tube is turned inside out once here, and painted with the same unlit material as the
    //  rest of the coaster, so the tunnel and the cave need no new shader when you ride into them)
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.ceil(pts.length * 1.5), r, 8, false), ia = tg.index.array, na = tg.attributes.normal.array;
    for (let t = 0; t < ia.length; t += 3) { const w = ia[t + 1]; ia[t + 1] = ia[t + 2]; ia[t + 2] = w; } for (let t = 0; t < na.length; t++) na[t] = -na[t];
    const wb = makeBatch(); wb.add(tg, null, (x, y, z, nx, ny, nz, out) => { out.copy(col(colr)).multiplyScalar(.75 + .35 * Math.max(0, -ny) + .15 * Math.max(0, nx)); }); tg.dispose();
    const m = wb.mesh(glowMat); m.receiveShadow = false;
    const grp = new THREE.Group(); grp.add(m); root.add(grp); m.geometry.computeBoundingSphere(); hidden.push({ grp, c: m.geometry.boundingSphere.center.clone(), r: m.geometry.boundingSphere.radius }); idx.grp = grp; return idx; };
  const hidden = []; // (the tunnel's inside and the cave are only drawn when the camera is near them)
  // (build 100) TUNNEL MOUTHS: the tunnel and the cave are drawn from the inside only, so from outside the train used to
  //  dive straight into solid rock or solid ground. Now a stone mouth leads in: an outward-facing tube round the track from
  //  its open end to just past where the track meets the rock (or the ground), with a ring round the opening.
  const mouth = (a, b, r, colr, openAt) => { if (a < 0 || b <= a + 4) return; const pts = []; for (let i = a; i <= b; i += 4) pts.push(V(i)); if ((b - a) % 4) pts.push(V(b));
    skel.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, pts.length * 2), r, 10, false), null, colr);
    V(openAt, pos, pA); skel.put(new THREE.TorusGeometry(r + .15, .4, 6, 22), pA.x, pA.y, pA.z, '#8a8a98', 1, ringRot(openAt)); };
  const darkOut = new THREE.CircleGeometry(1, 22), darkIn = new THREE.CircleGeometry(1, 22).rotateY(Math.PI);
  const darkB = makeBatch(); /* (build 105: their own mesh, hidden while you ride: the riding camera follows the train through the mouth, and the darkness would cover the screen) */
  const dark = (i, r, facingIn) => { V(i, pos, pA); darkB.put(facingIn ? darkIn : darkOut, pA.x, pA.y, pA.z, lit('#0b0812'), r, ringRot(i)); }; /* (the darkness inside the mouth, seen from outside only) */
  jobs.push(() => { const idx = tubeAround('T', 6.5, '#55556e', 64); if (!idx) return; const ball = new THREE.SphereGeometry(1, 12, 8);
    const rocks = []; for (let j = 64 + 20; j < idx.length - 64 - 20; j += 30) { V(idx[j], pos, pA); skel.put(ball, pA.x, pA.y - 8, pA.z, j % 60 ? '#9a9aa8' : '#b4b4c0', [20, 24, 20]); rocks.push([pA.x, pA.y - 8, pA.z]); }
    { const inR = i => { V(i, pos, pA); return rocks.some(([x, y, z]) => ((pA.x - x) / 20) ** 2 + ((pA.y - y) / 24) ** 2 + ((pA.z - z) / 20) ** 2 < .985); };
      const i0 = idx[0], i1 = idx[idx.length - 1]; let inI = -1, outI = -1; for (let i = i0; i <= i1; i++) if (inR(i)) { if (inI < 0) inI = i; outI = i; }
      { const inP = p => rocks.some(([x, y, z]) => ((p.x - x) / 20) ** 2 + ((p.y - y) / 24) ** 2 + ((p.z - z) / 20) ** 2 < .985), cp = new THREE.Vector3(); for (let i = i0; i <= i1; i++) { if (inR(i)) C.solid[i] = 1; if (inP(camPt(i, cp))) C.solidCam[i] = 1; } }
      if (inI > 0) { mouth(i0, Math.min(i1, inI + 12), 6.85, '#7a7a88', i0); mouth(Math.max(i0, outI - 12), i1, 6.85, '#7a7a88', i1); dark(inI + 4, 6.4, true); dark(outI - 4, 6.4, false); C.tunnelMouths = [i0, inI, outI, i1]; } }
    const tg = makeBatch(); for (let j = 0; j < idx.length; j += 20) { V(idx[j], pos, pA); tg.put(torusT, pA.x, pA.y, pA.z, j % 40 ? '#ffe36e' : '#62f0ff', 1, ringRot(idx[j])); } idx.grp.add(tg.mesh(glowMat));
  });
  // ---------- THE GLOWING UNDERGROUND CAVE: a purple cave lit by crystals ----------
  jobs.push(() => { const idx = tubeAround('C', 7.5, '#4a2a86'); if (!idx) return; const cg = makeBatch();
    { const i0 = idx[0], i1 = idx[idx.length - 1]; let dn = -1, upI = -1; for (let i = i0; i <= i1; i++) { V(i, pos, pA); if (pA.y < ground(pA.x, pA.z) - .4) { if (dn < 0) dn = i; upI = i; } }
      { const cp = new THREE.Vector3(); for (let i = i0; i <= i1; i++) { V(i, pos, pA); if (pA.y < ground(pA.x, pA.z) - .4) C.solid[i] = 1; camPt(i, cp); if (cp.y < ground(cp.x, cp.z) - .2) C.solidCam[i] = 1; } }
      if (dn > 0) { mouth(i0, Math.min(i1, dn + 14), 7.85, '#6a5a7a', i0); mouth(Math.max(i0, upI - 14), i1, 7.85, '#6a5a7a', i1); dark(dn + 4, 7.4, true); dark(upI - 4, 7.4, false); C.caveMouths = [i0, dn, upI, i1]; } }
    for (let j = 0; j < idx.length; j += 7) { V(idx[j], pos, pA); const a = j * 2.39, r = 6.6; cg.put(oct, pA.x + Math.cos(a) * r, pA.y + 1 + Math.sin(a) * r * .8, pA.z + Math.sin(a * 1.7) * 2, ['#b07bff', '#62f0ff', '#ff6fd8', '#7dffb0'][j % 4], [.5, 1.3, .5], [a, a * .5, 0]); }
    idx.grp.add(cg.mesh(glowMat)); for (const j of [0, idx.length - 1]) { V(idx[j], pos, pA); glow.put(torusC, pA.x, pA.y, pA.z, '#b07bff', 1, ringRot(idx[j])); } });
  // ---------- the station: a long platform with a striped roof and big glowing arches ----------
  { const sx = X + STATION.dx, sb = skel;
    sb.put(box, sx - 4, .35, -.6, '#e8e0ff', [16, .7, 2.6]); for (let i = 0; i < 9; i++) sb.put(box, sx - 11.5 + i * 2, 4.4, -2.2, i % 2 ? '#ffffff' : '#ff4f9a', [2, .2, 4.4]);
    for (const dx of [-11.5, 3.5]) { sb.put(cyl, sx + dx, 2.2, -.4, '#ffffff', [.16, 4.4, .16]); sb.put(cyl, sx + dx, 2.2, -4, '#ffffff', [.16, 4.4, .16]); }
    for (const dx of [-12, 4]) glow.put(new THREE.TorusGeometry(3.4, .16, 6, 30, Math.PI), sx + dx, 0, -2.4, '#62f0ff', 1, [0, Math.PI / 2, 0]); }
  // when all slices are done, the skeleton becomes two meshes
  jobs.push(() => { const g2 = glow.mesh(glowMat); g2.name = 'coasterSkeleton'; g2.receiveShadow = false; root.add(g2); if (darkB.count === undefined || darkB.count) { const dm = darkB.mesh(glowMat); dm.name = 'coasterMouthDark'; dm.receiveShadow = false; root.add(dm); C.mouthDark = dm; } for (const h of hidden) h.grp.visible = true; try { k.api.compile && k.api.compile(root); } catch (e) { } check = 0; C.ready = true; });
  k.U.push(() => { const t0 = performance.now(); while (jobs.length && performance.now() - t0 < 4) jobs.shift()(); });

  // ---------- the detailed rails and ties, streamed in 120 m pieces near the camera ----------
  const railMat = toy('#ff4f9a', { r: .3, cc: .7 }), pieces = new Map(), nP = Math.ceil(N / SECTION), cen = [];
  for (let s = 0; s < nP; s++) { const a = s * SECTION, b = Math.min(N - 1, a + SECTION); let cx = 0, cy = 0, cz = 0, n = 0; for (let i = a; i <= b; i += 10) { cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; n++; } const c = new THREE.Vector3(cx / n, cy / n, cz / n); let r = 0; for (let i = a; i <= b; i += 10) r = Math.max(r, c.distanceTo(V(i))); cen.push({ c, r }); }
  function buildPiece(s) {
    const a = s * SECTION, b = Math.min(N - 1, a + SECTION), rb = makeBatch(), tie = new THREE.BoxGeometry(1, 1, 1);
    for (const sg of [-1, 1]) { const pts = []; for (let i = a; i <= b; i += 4) { V(i, tan, tA); V(i, up, uA); sA.crossVectors(tA, uA).normalize(); pts.push(V(i).addScaledVector(sA, .62 * sg).addScaledVector(uA, .12)); }
      rb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.ceil(pts.length * 1.5), .12, 4, false), null, lit('#ff4f9a')); }
    for (let i = a; i <= b; i += 4) { const f = frame(i); V(i, pos, pA); V(i, up, uA); rb.put(tie, pA.x + uA.x * .02, pA.y + uA.y * .02, pA.z + uA.z * .02, lit('#ffffff'), [.18, .1, 1.45], [f.x, f.y, f.z]); }
    const m = rb.mesh(glowMat); m.receiveShadow = false; root.add(m); return m;
  }
  let check = 0;
  const wantNear = [];
  function stream(dt) {
    if ((check -= dt) > 0) return; check = .2;
    const cam = G.camera ? G.camera.position : P, ride = P.ride && P.ride.type === 'coaster' ? P.ride : null;
    for (const h of hidden) h.grp.visible = h.c.distanceTo(cam) < h.r + 25;
    wantNear.length = 0; const near = ride ? NEAR_RIDE : NEAR, max = ride ? MAX_RIDE : MAX_PIECES, dist = [];
    if (ride) { const s0 = Math.floor(ride.i / SECTION); for (const s of [s0, s0 + 1, s0 - 1]) if (s >= 0 && s < nP) wantNear.push(s); } // (the train's own piece and the next one first)
    for (let s = 0; s < nP; s++) dist.push([cen[s].c.distanceTo(cam) - cen[s].r, s]); dist.sort((a, b) => a[0] - b[0]);
    for (const [d, s] of dist) if (d < near && wantNear.length < max && !wantNear.includes(s)) wantNear.push(s);
    for (const [s, m] of pieces) if (!wantNear.includes(s)) { root.remove(m); m.geometry.dispose(); pieces.delete(s); }
    const next = wantNear.find(s => !pieces.has(s)); if (next != null) pieces.set(next, buildPiece(next)); // (one piece at a time)
  }
  k.U.push(dt => stream(dt));

  // ---------- the train: three cars (one mesh each), and boarding ----------
  const cars = [0, 1, 2].map(n => { const g = new THREE.Group(), cb = makeBatch(), cbox = new THREE.BoxGeometry(1, 1, 1);
    cb.put(cbox, 0, .28, 0, n ? '#5aa8ff' : '#ff4f9a', [2, .5, 1.3]); cb.put(cbox, -.75, .7, 0, '#ffffff', [.32, .55, 1.25]);
    if (!n) { cb.put(new THREE.SphereGeometry(.55, 16, 10), .95, .32, 0, '#ff4f9a', [.75, .55, 1.15]); cb.put(new THREE.OctahedronGeometry(.25), 1.35, .62, 0, '#ffe36e'); }
    for (const z of [-.55, .55]) for (const x of [-.6, .6]) cb.put(new THREE.CylinderGeometry(.16, .16, .12, 12), x, 0, z, '#3a2a6a', 1, [Math.PI / 2, 0, 0]);
    g.add(cb.mesh(shinyMat())); g.userData.dynamic = true; root.add(g); return g; });
  const CAR_GAP = 2.4 / C.STEP;
  const placeTrain = (i) => { for (let n = 0; n < 3; n++) { const j = Math.max(0, Math.min(N - 1, i - n * CAR_GAP)), j0 = Math.floor(j), f = j - j0, j1 = Math.min(N - 1, j0 + 1);
    const c = cars[n]; c.position.set(pos[j0 * 3] + (pos[j1 * 3] - pos[j0 * 3]) * f, pos[j0 * 3 + 1] + (pos[j1 * 3 + 1] - pos[j0 * 3 + 1]) * f, pos[j0 * 3 + 2] + (pos[j1 * 3 + 2] - pos[j0 * 3 + 2]) * f);
    frame(j0); c.quaternion.copy(q); } };
  const stationI = 0; placeTrain(stationI + 2 * CAR_GAP);
  C.placeTrain = placeTrain; C.cars = cars; C.exitX = X + STATION.dx + 3; C.homeI = 2 * CAR_GAP; C.CAR_GAP = CAR_GAP; C.stationX = X + STATION.dx; /* (build 100: for riding together) */
  const board = () => { if (P.ride || P.layer !== 'space' || Math.abs(P.x - (X + STATION.dx)) > 12) return; if (!C.ready) { k.say('🎢 The giant coaster is still getting ready... one moment!', true); return; }
    k.say('🎢 Hold on tight! Up, up, up to the top of the giant coaster!', true); G.startCoaster && G.startCoaster(C); };
  for (const c of cars) k.tapIt(c, board);
  k.tapIt(cars[0], board, X + STATION.dx, 'coaster');
  // ---------- the first time you land on the Moon (each time the game is opened): a 6 s camera sweep shows the whole coaster ----------
  let show = -1;
  k.U.push(dt => {
    if (show < 0) { if (C.ready && !G.coasterShown && (!/[?&]test/.test(location.search) || /[?&]showcase/.test(location.search)) && P.layer === 'space' && !P.ride && !G.camOverride) { G.coasterShown = true; show = 0; k.say('🎢 WOW! Look at the GIANT roller coaster!', true); } return; }
    if (P.ride && P.ride.type === 'coaster') { show = -2; return; }
    show += dt; const T = 6.5, a = Math.min(1, show / 1.6), b = Math.min(1, Math.max(0, (T - show) / 1.6)), w = Math.min(a, b), e2 = w * w * (3 - 2 * w), pan = show / T;
    const from = G.camera.position, px = P.x, py = P.y + 2.9, pz = 12.5;
    const cx = X + 120 + pan * 90, cy = 150, cz = 230, lx = X + 150, ly = 70, lz = -80;
    G.camOverride = { showcase: true, pos: [px + (cx - px) * e2, py + (cy - py) * e2, pz + (cz - pz) * e2], look: [P.x + (lx - P.x) * e2, P.y + 2 + (ly - P.y - 2) * e2, (lz) * e2] };
    if (show >= T) { G.camOverride = null; show = -2; }
  });
  G.moonCoaster = C;
  return C;
}
function Y0() { return new THREE.Vector3(0, 1, 0); }
