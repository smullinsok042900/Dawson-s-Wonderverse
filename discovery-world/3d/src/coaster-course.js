// ===================================================================
// coaster-course.js (build 69): the course of the GIANT MOON ROLLER COASTER, worked out once and kept as plain arrays.
//
// The track is built like a turtle drawing: from the station, a list of pieces (straights, banked turns, a spiral lift,
// drops, camel hills, loop-the-loops, corkscrews, helixes, and the underground/mountain/crater stretches). Every piece
// starts where the last one ended and in the same direction, with a level start and end, so the whole track is one
// smooth, connected ride. Each piece also says which way is "up" for the car (towards the middle of a loop or a
// corkscrew, leaning into a turn), so the car turns over exactly where it should.
//
// The result is sampled every 0.5 m along the track: position, direction, the car's "up", a flag (station, lift, cave,
// tunnel, crater) and the ride speed at that point. The ride and the 3D model only ever read these arrays.
// ===================================================================
import * as THREE from 'three';

const sm = t => (1 - Math.cos(Math.PI * t)) / 2;          // 0 → 1 with a level start and end
const Y = new THREE.Vector3(0, 1, 0);
const dirOf = h => new THREE.Vector3(Math.cos(h), 0, -Math.sin(h));
const leftOf = h => new THREE.Vector3(-Math.sin(h), 0, -Math.cos(h));
const D2R = Math.PI / 180;

// the crater the track dives into (also added to the Moon's ground by space.js, so it is a real hole in the ground)
export const BIG_CRATER = { dx: 78, z: -125, r: 46, depth: .85, rim: .12 };

export const STATION = { dx: 80, z: -2.4, y: .9 };   // (build 100: moved from 206 to 80, close to the rocket (x 8))

// the course: pieces (lengths in m, angles in degrees, positive turns left) and ['AT', x, y, z, heading] anchors that the
// track reaches through one long smooth banked sweep (a curve that leaves and arrives level and in the right direction)
export const COURSE = [
  ['S', 5, 0, 'S'], ['T', 10, -90, 2.5], ['T', 10, 90, 4],        // leave the station, turn in behind the activities
  ['S', 4, 0],                                                     // (build 100: was 130 m when the station stood at 206) to the lunar spire
  ['H', 36, -2.5, 219.5, 'L'],   // (build 100: 5.5 m more, so everything after it keeps its height)                                     // THE GIGANTIC CLIMB: a spiral lift round the lunar spire
  ['S', 12, 0],                                                  // the crest: the whole Moon below
  ['S', 150, -195],                                              // THE BREATHTAKING FIRST DROP
  ['L', 17, -1], ['S', 24, 0],                                                 // LOOP-THE-LOOP 1
  ['K', 40, 16],                                                 // a camel hill
  ['AT', 312, 40, -122, 90],                                     // a long sweep out to the far corner
  ['T', 24, 90, 0, .5],                                          // round the corner
  ['S', 50, 0, 'T'], ['T', 30, 40, 0, .3, 'T'], ['S', 30, 0, 'T'], // THE TWISTING TUNNEL THROUGH THE LUNAR MOUNTAIN
  ['C', 55, 4],                                                  // CORKSCREW 1
  ['AT', 200, 120, -60, 0],                                      // up and round to a high ridge
  ['S', 30, 0, 'B'],                                             // BOOSTER
  ['T', 26, 180, 40, .4],                                        // a huge climbing U-turn
  ['S', 40, 0],                                                  // the high viewpoint
  ['S', 120, -175, 'K'],                                         // THE DROP INTO THE ENORMOUS CRATER
  ['T', 22, -180, 0, .55, 'K'],                                  // round the inside of the crater
  ['S', 80, 100, 'K'],                                           // and back up out of it
  ['L', 15, -1], ['S', 24, 0],                                                  // LOOP-THE-LOOP 2
  ['AT', 108, 62, -30, 180],                                     // a sweeping high-speed turn
  ['H', 18, -1.5, -40, '', .55],                                 // the spiral descent
  ['AT', 60, 5, -40, 90],
  ['S', 30, -27, 'C'], ['T', 20, -120, 0, .4, 'C'], ['S', 60, 0, 'C'], ['T', 22, 100, 0, .4, 'C'], ['S', 44, 42, 'C'], // THE GLOWING UNDERGROUND CAVE
  ['T', 20, 110, 6, .45],                                        // swing west, away from the mountain
  ['S', 30, 24, 'B'],                                            // BOOSTER, climbing out
  ['L', 14, -1], ['S', 24, 0],                                                 // LOOP-THE-LOOP 3
  ['AT', 140, 70, -150, 0],                                      // over the back, high above the craters
  ['C', 45, 3.5],                                                // CORKSCREW 2
  ['K', 40, 16], ['K', 34, 10],                                  // bunny hills
  ['S', 40, 0, 'B'],                                             // BOOSTER: the second giant climb
  ['T', 30, -150, 90, .45],                                      // up and round, high above the Moon
  ['AT', 200, 160, -132, 180],                                   // THE HUGE ELEVATED RUN right across the Moon
  ['AT', -20, 150, -132, 180],
  ['T', 14, -180, 0, .5],                                        // a giant banked turn, 150 m up
  ['AT', 300, 100, -62, 0],                                      // back across, coming down
  ['H', 22, -2.5, -95, '', .55],                                 // THE GRAND FINALE SPIRAL
  ['C', 45, 3.5],                                                // CORKSCREW 3
  ['AT', 100, 4, -16, 180],                                     // (build 100) sweep back across BEHIND the activities, to just behind the station
  ['GOHOME'],                                                    // the final run back to the station
];

// ---------- build the dense centre line (about 1 m apart) with each point's flag and wanted "up" ----------
export function draw(X, course = COURSE, ST = STATION, h0 = 180) { // (build 164: another coaster can have its own station and first heading)
  const p = new THREE.Vector3(X + ST.dx, ST.y, ST.z); let h = h0 * D2R;
  const out = []; const push = (q, up, f) => out.push({ p: q.clone(), up: up.clone().normalize(), f: f || '' });
  push(p, Y, 'S'); const ends = [];
  for (const el of course) {
    const k = el[0];
    if (k === 'S') { const [, len, dy, f] = el, d = dirOf(h), y0 = p.y, n = Math.max(2, Math.ceil(len)); for (let i = 1; i <= n; i++) { const t = i / n; const q = p.clone().addScaledVector(d, len * t); q.y = y0 + dy * sm(t); push(q, Y, f); } p.copy(out[out.length - 1].p); }
    else if (k === 'T' || k === 'H') {
      const isH = k === 'H'; const r = el[1], ang = (isH ? el[2] * 360 : el[2]) * D2R, dy = el[3] || 0, f = isH ? el[4] : el[5], bank = (isH ? el[5] : el[4]) ?? (isH ? .15 : .5);
      const sg = Math.sign(ang) || 1, c = p.clone().addScaledVector(leftOf(h), r * sg), y0 = p.y, h0 = h, n = Math.max(4, Math.ceil(Math.abs(ang) * r));
      for (let i = 1; i <= n; i++) { const t = i / n, hh = h0 + ang * t, q = c.clone().addScaledVector(leftOf(hh), -r * sg); q.y = y0 + dy * (isH ? t - Math.sin(2 * Math.PI * t) / (2 * Math.PI) : sm(t));
        const b = bank * (isH ? Math.min(1, t * 6, (1 - t) * 6) : Math.sin(Math.PI * t)); const up = Y.clone().multiplyScalar(Math.cos(b)).addScaledVector(leftOf(hh), Math.sin(b) * sg); push(q, up, f); }
      h = h0 + ang; p.copy(out[out.length - 1].p);
    }
    else if (k === 'L') { const [, R, side] = el, d = dirOf(h), lat = leftOf(h), p0 = p.clone(), w = 5.2 * side, n = Math.ceil(2 * Math.PI * R);
      for (let i = 1; i <= n; i++) { const th = 2 * Math.PI * i / n, s = sm(i / n), q = p0.clone().addScaledVector(d, R * Math.sin(th)).addScaledVector(Y, R * (1 - Math.cos(th))).addScaledVector(lat, w * s);
        const cen = p0.clone().addScaledVector(Y, R).addScaledVector(lat, w * s); push(q, cen.sub(q)); } p.copy(out[out.length - 1].p); }
    else if (k === 'C') { const [, len, r] = el, d = dirOf(h), lat = leftOf(h), p0 = p.clone(), n = Math.ceil(len);
      for (let i = 1; i <= n; i++) { const s = len * i / n, ph = 2 * Math.PI * sm(i / n), axis = p0.clone().addScaledVector(d, s).addScaledVector(Y, r), q = p0.clone().addScaledVector(d, s).addScaledVector(lat, r * Math.sin(ph)).addScaledVector(Y, r * (1 - Math.cos(ph)));
        push(q, axis.sub(q)); } p.copy(out[out.length - 1].p); }
    else if (k === 'K') { const [, len, hgt] = el, d = dirOf(h), y0 = p.y, n = Math.ceil(len); for (let i = 1; i <= n; i++) { const t = i / n, q = p.clone().addScaledVector(d, len * t); q.y = y0 + hgt * (1 - Math.cos(2 * Math.PI * t)) / 2; push(q, Y); } p.copy(out[out.length - 1].p); }
    else if (k === 'AT') { const q = new THREE.Vector3(X + el[1], el[2], el[3]), h2 = el[4] * D2R, L = p.distanceTo(q), y0 = p.y;
      const c1 = p.clone().addScaledVector(dirOf(h), L * .4), c2 = q.clone().addScaledVector(dirOf(h2), -L * .4), bez = new THREE.CubicBezierCurve3(p.clone(), c1, c2, q), n = Math.ceil(bez.getLength());
      let hp = h; for (let i = 1; i <= n; i++) { const t = i / n, pt = bez.getPoint(t); pt.y = y0 + (q.y - y0) * sm(t); const tg = bez.getTangent(t), hh = Math.atan2(-tg.z, tg.x);
        let dh = hh - hp; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; hp = hh; const b = Math.max(-.7, Math.min(.7, dh / (bez.getLength() / n) * 12));
        push(pt, Y.clone().multiplyScalar(Math.cos(b)).addScaledVector(leftOf(hh), Math.sin(b))); } p.copy(q); h = h2; }
    else if (k === 'GOHOME') { // a smooth curve back into the station, arriving level and heading -x along the platform
      const end = new THREE.Vector3(X + ST.dx, ST.y, ST.z), endDir = dirOf(h0 * D2R), L = p.distanceTo(end);
      const c1 = p.clone().addScaledVector(dirOf(h), L * .45), c2 = end.clone().addScaledVector(endDir, -L * .4); c1.y = p.y; c2.y = Math.max(ST.y, c2.y);
      const bez = new THREE.CubicBezierCurve3(p.clone(), c1, c2, end), n = Math.ceil(bez.getLength());
      for (let i = 1; i <= n; i++) { const t = i / n, q = bez.getPoint(t); q.y = p.y + (ST.y - p.y) * sm(t); push(q, Y, t > .97 ? 'S' : ''); }
      p.copy(end); h = h0 * D2R; }
    ends.push({ k, x: +(p.x - X).toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1), h: Math.round(((h / D2R) % 360 + 360) % 360) });
  }
  return { pts: out, ends };
}

// ---------- resample every 0.5 m; smooth the "up"s; work out the speed everywhere ----------
export function buildCourse(X, opts = {}) {
  const { pts, ends } = draw(X, opts.course, opts.station, opts.h0);
  const STEP = .5, P = [], F = [], U = []; let carry = 0;
  P.push(pts[0].p.clone()); U.push(pts[0].up.clone()); F.push(pts[0].f);
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], seg = a.p.distanceTo(b.p); let s = STEP - carry;
    while (s <= seg) { const t = s / seg; P.push(a.p.clone().lerp(b.p, t)); U.push(a.up.clone().lerp(b.up, t)); F.push(t < .5 ? a.f : b.f); s += STEP; } carry = seg - (s - STEP); }
  const N = P.length, pos = new Float32Array(N * 3), tan = new Float32Array(N * 3), up = new Float32Array(N * 3), flag = new Array(N);
  const T = new THREE.Vector3(), Uu = new THREE.Vector3(), W = 6;
  for (let i = 0; i < N; i++) {
    T.subVectors(P[Math.min(N - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
    Uu.set(0, 0, 0); for (let j = -W; j <= W; j++) Uu.add(U[Math.min(N - 1, Math.max(0, i + j))]);   // smooth the wanted up a little
    Uu.addScaledVector(T, -Uu.dot(T)).normalize(); if (!Number.isFinite(Uu.x)) Uu.copy(Y);
    pos.set([P[i].x, P[i].y, P[i].z], i * 3); tan.set([T.x, T.y, T.z], i * 3); up.set([Uu.x, Uu.y, Uu.z], i * 3); flag[i] = F[i];
  }
  // speed: a steady chain lift; after it, the speed comes from how far below the "energy height" you are (which slowly
  // falls with friction, and boosters lift it again). Never below VMIN, so the car can never stall or roll back.
  const G7 = 7, VMIN = 11, VMAX = opts.vmax || 34, LIFT = 14, v = new Float32Array(N); let Hc = pos[1];
  for (let i = 0; i < N; i++) { const y = pos[i * 3 + 1];
    if (flag[i] === 'L') { v[i] = LIFT; Hc = y; continue; }
    if (flag[i] === 'S') { v[i] = 4; continue; }
    if (flag[i] === 'B') Hc = Math.max(Hc, y + 70);
    Hc -= .006 * STEP;
    v[i] = Math.max(VMIN, Math.min(VMAX, Math.sqrt(VMIN * VMIN + 2 * G7 * Math.max(0, Hc - y))));
  }
  // gentle braking into the station
  for (let i = N - 1, lim = 4; i >= 0 && lim < VMAX; i--, lim += .05) v[i] = Math.min(v[i], lim);
  let time = 0; for (let i = 1; i < N; i++) time += STEP / Math.max(1, (v[i] + v[i - 1]) / 2);
  return { N, STEP, len: (N - 1) * STEP, pos, tan, up, flag, v, time, ends };
}
