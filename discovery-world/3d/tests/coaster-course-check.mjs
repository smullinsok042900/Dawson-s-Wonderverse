// (build 69) Checks the giant Moon coaster's course without a browser: continuous, never runs into itself, stays over the
// Moon and clear of the ground and the activities, and every loop/corkscrew turns the car over. usage: node tests/coaster-course-check.mjs
import { buildCourse, BIG_CRATER } from '../src/coaster-course.js';
const X = 5000, C = buildCourse(X), { N, pos, up, flag, v, STEP } = C;
const at = i => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
let gaps = 0; for (let i = 1; i < N; i++) { const a = at(i - 1), b = at(i), d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (d > STEP * 1.6) gaps++; }
// self-intersection: any two points further than 30 m apart along the track but closer than 5 m in space
const cell = 6, grid = new Map(); let minSep = 1e9, worst = null;
for (let i = 0; i < N; i += 2) { const [x, y, z] = at(i), key = [Math.floor(x / cell), Math.floor(y / cell), Math.floor(z / cell)];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const j of grid.get([key[0] + a, key[1] + b, key[2] + c].join()) || []) {
    if (Math.abs(i - j) * STEP < 30 || (flag[i] === 'S' && flag[j] === 'S') || Math.min(i, j) * STEP < 25 && Math.max(i, j) > N - 120) continue; const q = at(j), d = Math.hypot(x - q[0], y - q[1], z - q[2]); if (d < minSep) { minSep = d; worst = [i * STEP, j * STEP, x - X, y, z]; } }
  const k = key.join(); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
// clearance from the ground (worst-case Moon ground: about 0 at the front, up to ~17 m far back), the front activities, the big crater
const bad = []; let maxY = -1e9, minY = 1e9, bx = [1e9, -1e9], bz = [1e9, -1e9], inv = 0;
for (let i = 0; i < N; i++) { const [x, y, z] = at(i), f = flag[i]; maxY = Math.max(maxY, y); minY = Math.min(minY, y); bx = [Math.min(bx[0], x - X), Math.max(bx[1], x - X)]; bz = [Math.min(bz[0], z), Math.max(bz[1], z)];
  if (up[i * 3 + 1] < -.5) inv++;
  const dc = Math.hypot(x - (X + BIG_CRATER.dx), z - BIG_CRATER.z) / BIG_CRATER.r;
  if (f === 'C' || f === 'S' || (f === 'K' && dc < 1.05)) continue;
  const ss = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t), groundMax = 1.5 + 17 * ss((-60 - z) / 90); // (the Moon's ground: flat at the front, hills up to ~17 m far back)
  const need = z > -12 ? (Math.abs(x - X - 206) < 32 ? 0 : 12) : dc < 1.4 ? 9 : groundMax + (z > -40 ? 1.2 : 3);
  if (y < need) bad.push(`${(i * STEP).toFixed(0)}m x${(x - X).toFixed(0)} y${y.toFixed(1)} z${z.toFixed(0)} needs ${need}`); }
// the mountain the tunnel runs through (balls round the tunnel, as moon-coaster.js builds them) must not swallow other track
let T0 = -1, T1 = -1; const balls = []; { const T = []; for (let i = 0; i < N; i++) if (flag[i] === 'T') T.push(i); T0 = T[0]; T1 = T[T.length - 1]; for (let j = 20; j < T.length - 20; j += 30) { const [x, y, z] = at(T[j]); balls.push([x, y - 8, z]); } }
let inMountain = 0; for (let i = 0; i < N; i += 2) { if (flag[i] === 'T' || (i > T0 - 64 && i < T1 + 64)) continue; const [x, y, z] = at(i); for (const [bx2, by, bz2] of balls) if (((x - bx2) / 20) ** 2 + ((y - by) / 24) ** 2 + ((z - bz2) / 20) ** 2 < 1.1) { inMountain++; break; } }
const out = { length_m: Math.round(C.len), ride_s: Math.round(C.time), maxY: +maxY.toFixed(1), minY: +minY.toFixed(1), x: bx.map(Math.round), z: bz.map(Math.round), gaps, minSep: +minSep.toFixed(2), worst, upsideDownSamples: inv, vmax: Math.max(...v), badClearance: bad.length, inMountain };
console.log(JSON.stringify(out)); if (process.argv[2] === '-v') { console.log(C.ends.map(e => `${e.k} x${e.x} y${e.y} z${e.z} h${e.h}`).join('\n')); console.log(bad.slice(0, 25).join('\n')); }
const ok = inMountain < 30 && gaps === 0 && minSep > 4 && bad.length === 0 && bx[0] > -45 && bx[1] < 375 && bz[0] > -173 && maxY > 150 && C.len > 4000 && inv > 50;
console.log(ok ? 'COURSE OK' : 'COURSE NOT OK'); process.exit(ok ? 0 : 1);
