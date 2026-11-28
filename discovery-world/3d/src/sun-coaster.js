// ===================================================================
// sun-coaster.js (build 178): THE GIANT SUN COASTER (ATTRACTIONS row 20: "a Sun coaster at the Moon coaster's scale").
// One continuous 920 m track (the same track builder as the Moon and Volcano Island coasters, coaster-course.js), ridden in
// FIRST PERSON like the volcano coaster: from a golden station on the landing area, out over the edge of the golden
// platforms, a SPIRAL LIFT 54 m up above the boiling Sun, a huge drop, through FOUR GIANT FLARE ARCHES (glowing loops of
// sun-fire), a loop-the-loop, a booster, a long high run over the Sun's surface, a corkscrew and home.
// Six stars along the way (🐾 grabs the one in front of the train), 🏁 / 🔁 and riding together come from main.js and
// multiplayer.js exactly as for the other coasters (G.coasters.sun).
// It is clearly made-up (the voice says the platforms and the track are magic): nothing can really go near the Sun.
// Speed: the skeleton (spine, rings, arches, station) is one mesh; the detailed rails are streamed in pieces near the camera.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, col, glowMat as sharedGlow } from './spacekit.js';
import { buildCourse } from './coaster-course.js';

export const SUNSTATION = { dx: 92, z: -2.4, y: .9 };
export const SUNCOURSE = [
  ['S', 6, 0, 'S'], ['T', 9, -180, 1, .4],                 // leave the station, round behind it
  ['AT', 150, 8, -60, 90],                                 // out over the edge of the golden platforms
  ['H', 24, -1.25, 46, 'L', .2],                           // THE SPIRAL LIFT, 54 m above the boiling Sun
  ['S', 12, 0],                                            // the crest
  ['S', 60, -44],                                          // THE BIG DROP
  ['AT', 260, 12, -110, 90],                               // a long sweep through the first flare arches
  ['L', 14, -1], ['S', 20, 0],                             // LOOP-THE-LOOP
  ['T', 20, 90, 6, .5],                                    // round
  ['S', 30, 0, 'B'],                                       // BOOSTER
  ['AT', 160, 24, -150, 180],                              // high over the Sun's surface, through more flare arches
  ['C', 40, 3.5],                                          // CORKSCREW
  ['T', 16, 90, -10, .5],                                  // round towards home
  ['AT', 60, 6, -40, 0],
  ['GOHOME'],
];
const SECTION = 240, NEAR = 45, NEAR_RIDE = 90, MAX_PIECES = 2, MAX_RIDE = 3;

export function buildSunCoaster(k) {
  const X = k.X, P = k.P, G = k.G;
  const C = buildCourse(X, { course: SUNCOURSE, station: SUNSTATION, h0: 180, vmax: 30 }), { N, pos, tan, up, flag } = C;
  const V = (i, arr = pos, o = new THREE.Vector3()) => o.set(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]);
  const root = new THREE.Group(); root.name = 'sunCoaster'; root.userData.dynamic = true; k.add(root);
  const glowMat = sharedGlow(), jobs = [];
  const tA = new THREE.Vector3(), uA = new THREE.Vector3(), sA = new THREE.Vector3(), pA = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const frame = i => { V(i, tan, tA); V(i, up, uA); sA.crossVectors(tA, uA).normalize(); m4.makeBasis(tA, uA, sA); q.setFromRotationMatrix(m4); e.setFromQuaternion(q); return e; };
  const qY90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), qr = new THREE.Quaternion(), er = new THREE.Euler();
  const ringRot = i => { frame(i); qr.copy(q).multiply(qY90); er.setFromQuaternion(qr); return [er.x, er.y, er.z]; };
  const LD = new THREE.Vector3(.35, .85, .4).normalize(), litC = {};
  const lit = hex => litC[hex] || (litC[hex] = (x, y, z, nx, ny, nz, out) => { const d = Math.max(0, nx * LD.x + ny * LD.y + nz * LD.z), kk = Math.min(1.05, .55 + .45 * d + .12 * (ny * .5 + .5)); out.copy(col(hex)).multiplyScalar(kk); });
  const glow = makeBatch(), skel = { put: (g, x, y, z, c, s, r) => glow.put(g, x, y, z, lit(c), s, r), add: (g, m, c) => glow.add(g, m, lit(c)) };
  const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 6), oct = new THREE.OctahedronGeometry(1, 0);

  // ---------- the track's golden spine and glowing rings (the always-on skeleton; magic: no towers) ----------
  { const pts = []; for (let i = 0; i < N; i += 8) pts.push(V(i)); pts.push(V(N - 1));
    jobs.push(() => { skel.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), Math.ceil(pts.length * .6), .28, 3, false), null, '#c88a20'); }); }
  jobs.push(() => { for (let i = 0; i < N; i += 60) { V(i, pos, pA); glow.put(new THREE.TorusGeometry(.5, .09, 3, 8), pA.x, pA.y, pA.z, (i / 60) % 2 ? '#fff0a0' : '#ff9a2e', 1, ringRot(i)); } });
  // ---------- FOUR GIANT FLARE ARCHES: glowing loops of sun-fire the train flies through ----------
  const ARCH_AT = [.36, .44, .64, .72].map(f => Math.floor(N * f)); C.arches = ARCH_AT;
  jobs.push(() => { for (const [n, i] of ARCH_AT.entries()) { V(i, pos, pA); const rr = ringRot(i);
    glow.put(new THREE.TorusGeometry(6.2, .9, 8, 32), pA.x, pA.y, pA.z, ['#ff7a1a', '#ffb23f', '#ff5a1a', '#ffd23f'][n], 1, rr);
    glow.put(new THREE.TorusGeometry(7.4, .3, 4, 32), pA.x, pA.y, pA.z, '#fff0a0', 1, rr); } });

  // ---------- the station: a golden platform under a striped sun-roof ----------
  { const sx = X + SUNSTATION.dx; skel.put(box, sx - 4, .35, -.6, '#fff0c0', [16, .7, 2.6]); k.plat(sx - 12, sx + 4, .7, { step: true, stepMax: .8 });
    for (let i = 0; i < 9; i++) skel.put(box, sx - 11.5 + i * 2, 4.4, -2.2, i % 2 ? '#ffffff' : '#ffb020', [2, .2, 4.4]);
    for (const dx of [-11.5, 3.5]) { skel.put(cyl, sx + dx, 2.2, -.4, '#ffffff', [.16, 4.4, .16]); skel.put(cyl, sx + dx, 2.2, -4, '#ffffff', [.16, 4.4, .16]); }
    for (const dx of [-12, 4]) glow.put(new THREE.TorusGeometry(3.4, .16, 6, 30, Math.PI), sx + dx, 0, -2.4, '#ffd23f', 1, [0, Math.PI / 2, 0]); }

  // ---------- THE SIX STARS along the ride: 🐾 grabs the one right in front of the train ----------
  const STAR_AT = [.2, .3, .4, .52, .62, .8].map(f => Math.floor(N * f)), stars = [], starB = makeBatch(); starB.put(oct, 0, 0, 0, '#ffffff', [.55, .75, .55]); const starGeo = starB.geometry();
  for (const [n, i] of STAR_AT.entries()) { const m = new THREE.Mesh(starGeo, shinyMat()); m.material.color.set('#9fe6ff'); V(i, pos, pA); V(i, up, uA); m.position.copy(pA).addScaledVector(uA, 2.6); m.userData.dynamic = true; root.add(m); stars.push({ m, i, got: false, n, told: false }); }
  C.stars = stars;
  C.onPaw = R => { const s = stars.find(q2 => !q2.got && Math.abs(R.i - q2.i) < 40); if (!s) { k.say('⭐ Watch for the next star, then tap 🐾!', true); return; } s.got = true; s.m.visible = false; k.Sound.chime(); k.api.burst && k.api.burst(s.m.position.x, s.m.position.y, s.m.position.z, ['#9fe6ff', '#ffffff'], 16, 2.4);
    const got = stars.filter(q2 => q2.got).length; k.say(got < 6 ? `⭐ You grabbed a star! ${got} of 6!` : '⭐ ALL SIX STARS! You are a Sun coaster star!', true); k.disc && k.disc(got < 6 ? 'scoasterstar' : 'scoasterstars'); };
  // the flare arches: a whoosh and a shower of sparks as the train flies through each one
  let archN = 0; C.archesPassed = () => archN;
  C.onTick = R => { for (const s of stars) { if (s.got) continue; s.m.rotation.y += .05; if (!s.told && R.i > s.i - 40 && R.i < s.i) { s.told = true; k.say('⭐ A star! Tap 🐾 to grab it!', true); } }
    while (archN < ARCH_AT.length && R.i >= ARCH_AT[archN]) { const i = ARCH_AT[archN]; archN++; k.Sound.whoosh && k.Sound.whoosh(); k.api.burst && k.api.burst(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], ['#ffd23f', '#ff7a1a', '#ffffff'], 24, 3.4);
      if (archN === 1) k.say('🔥 Through the SOLAR FLARE! WHOOSH!', true); } };
  C.onStart = () => { archN = 0; for (const s of stars) { s.got = false; s.told = false; s.m.visible = true; } };

  // ---------- one-time work, a few milliseconds a frame; then the skeleton becomes one mesh ----------
  jobs.push(() => { const g2 = glow.mesh(glowMat); g2.receiveShadow = false; root.add(g2); try { k.api.compile && k.api.compile(root); } catch (err) { } check = 0; C.ready = true; });
  k.U.push(() => { const t0 = performance.now(); while (jobs.length && performance.now() - t0 < 4) jobs.shift()(); });

  // ---------- the detailed rails and ties, streamed in 120 m pieces near the camera ----------
  const pieces = new Map(), nP = Math.ceil(N / SECTION), cen = [];
  for (let s = 0; s < nP; s++) { const a = s * SECTION, b = Math.min(N - 1, a + SECTION); const c = new THREE.Vector3(); let n = 0; for (let i = a; i <= b; i += 10) { c.add(V(i)); n++; } c.multiplyScalar(1 / n); let r = 0; for (let i = a; i <= b; i += 10) r = Math.max(r, V(i).distanceTo(c)); cen.push({ c, r }); }
  function buildPiece(s) { const a = s * SECTION, b = Math.min(N - 1, a + SECTION), rb = makeBatch(), tie = new THREE.BoxGeometry(1, 1, 1);
    for (const sg of [-1, 1]) { const pts = []; for (let i = a; i <= b; i += 4) { V(i, tan, tA); V(i, up, uA); sA.crossVectors(tA, uA).normalize(); pts.push(V(i).addScaledVector(sA, .62 * sg).addScaledVector(uA, .12)); }
      rb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.ceil(pts.length * 1.5), .12, 4, false), null, lit('#ffb020')); }
    for (let i = a; i <= b; i += 4) { const f = frame(i); V(i, pos, pA); rb.put(tie, pA.x, pA.y, pA.z, lit('#8a5a20'), [.18, .1, 1.45], [f.x, f.y, f.z]); }
    const m = rb.mesh(glowMat); m.receiveShadow = false; root.add(m); return m; }
  let check = 0; const wantNear = [];
  k.U.push(dt => { if ((check -= dt) > 0) return; check = .2;
    const cam = G.camera ? G.camera.position : P, ride = P.ride && P.ride.type === 'coaster' && P.ride.C === C ? P.ride : null;
    wantNear.length = 0; const near = ride ? NEAR_RIDE : NEAR, max = ride ? MAX_RIDE : MAX_PIECES, dist = [];
    if (ride) { const s0 = Math.floor(ride.i / SECTION); for (const s of [s0, s0 + 1, s0 - 1]) if (s >= 0 && s < nP) wantNear.push(s); }
    for (let s = 0; s < nP; s++) dist.push([cen[s].c.distanceTo(cam) - cen[s].r, s]); dist.sort((a, b) => a[0] - b[0]);
    for (const [d, s] of dist) if (d < near && wantNear.length < max && !wantNear.includes(s)) wantNear.push(s);
    for (const [s, m] of pieces) if (!wantNear.includes(s)) { root.remove(m); m.geometry.dispose(); pieces.delete(s); }
    const next = wantNear.find(s => !pieces.has(s)); if (next != null) pieces.set(next, buildPiece(next)); });

  // ---------- the train: three golden cars, and boarding ----------
  const cars = [0, 1, 2].map(n => { const g = new THREE.Group(), cb = makeBatch(), cbox = new THREE.BoxGeometry(1, 1, 1);
    cb.put(cbox, 0, .28, 0, n ? '#ffd23f' : '#ffb020', [2, .5, 1.3]); cb.put(cbox, -.75, .7, 0, '#ff7a1a', [.32, .55, 1.25]);
    if (!n) { cb.put(new THREE.SphereGeometry(.55, 16, 10), .95, .32, 0, '#ffb020', [.75, .55, 1.15]); for (let r = 0; r < 8; r++) cb.put(new THREE.ConeGeometry(.08, .3, 6), 1.2 + Math.cos(r * .785) * .04, .75 + Math.sin(r * .785) * .3, Math.cos(r * .785) * .3, '#fff0a0', 1, [r * .785, 0, -Math.PI / 2]); } // (a little sun face of rays on the front)
    for (const z of [-.55, .55]) for (const x of [-.6, .6]) cb.put(new THREE.CylinderGeometry(.16, .16, .12, 12), x, 0, z, '#5a3a20', 1, [Math.PI / 2, 0, 0]);
    g.add(cb.mesh(shinyMat())); g.userData.dynamic = true; root.add(g); return g; });
  const CAR_GAP = 2.4 / C.STEP;
  const placeTrain = i => { for (let n = 0; n < 3; n++) { const j = Math.max(0, Math.min(N - 1, i - n * CAR_GAP)), j0 = Math.floor(j), f = j - j0, j1 = Math.min(N - 1, j0 + 1);
    cars[n].position.set(pos[j0 * 3] + (pos[j1 * 3] - pos[j0 * 3]) * f, pos[j0 * 3 + 1] + (pos[j1 * 3 + 1] - pos[j0 * 3 + 1]) * f, pos[j0 * 3 + 2] + (pos[j1 * 3 + 2] - pos[j0 * 3 + 2]) * f); frame(j0); cars[n].quaternion.copy(q); } };
  placeTrain(2 * CAR_GAP);
  Object.assign(C, { placeTrain, cars, exitX: X + SUNSTATION.dx + 3, homeI: 2 * CAR_GAP, CAR_GAP, stationX: X + SUNSTATION.dx, fp: true, name: 'sun',
    says: { L: '☀️ Up, up, high above the boiling Sun! (It\'s a magic track: nothing can really go this close!)', B: '🚀 BOOST! Zoom over the Sun!' },
    endSay: '☀️ WOW! Up above the Sun and through the solar flares!', disc: 'sunbigcoaster' });
  const board = () => { if (P.ride || P.layer !== 'space' || Math.abs(P.x - (X + SUNSTATION.dx)) > 12) return; if (!C.ready) { k.say('🎢 The Sun coaster is getting ready... one moment!', true); return; }
    k.say('☀️ Hold on tight! Up above the Sun and through the solar flares!', true); archN = 0; C.onStart(); G.startCoaster && G.startCoaster(C); };
  for (const c of cars) k.tapIt(c, board);
  k.tapIt(cars[0], board, X + SUNSTATION.dx, 'sunbigcoasterride');
  G.coasters = G.coasters || {}; G.coasters.sun = C; G.sunCoaster = C;
  return C;
}
