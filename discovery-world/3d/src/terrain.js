// ===================================================================
// terrain.js (build 66): REAL MOUNTAINS for the outdoor world.
//
// Before this, the hills behind the park and behind Balloon Hills were rows of squashed spheres: smooth, round blobs
// with no peaks, ridges, valleys or rock faces. Now each range is one displaced mesh, built from a height field:
//
//  - a wandering RIDGELINE (ridged noise), so a range has several separate peaks instead of one lump;
//  - STEEP faces (the height climbs fast behind the flat ground of the world, then eases);
//  - EROSION GULLIES: narrow channels cut down the face, where the ridge noise folds;
//  - LEDGES: the middle of the face is pulled part of the way to shelf heights, so cliffs step instead of sliding;
//  - SNOW on the tops (optional), rock strata painted by height and slope, and darker folds (cheap ambient occlusion);
//  - CRAGS: angular boulders with strata and moss sitting on the slope, so the range has real rock formations.
//
// PERFORMANCE: one range is one mesh with one shared material (the painted ground material the planets already use), so
// it is ONE draw call. The park's range is about 12,000 triangles. The 3 m strip at the front of every range is exactly
// flat at y = 0, so every tree, ride and activity that stood there before stands in exactly the same place.
//
// The height function is exported on its own (ridgeField), so tests/terrain.test.mjs can MEASURE the relief: the peak
// height, the peak-to-valley difference, and how many separate summits a range has.
// ===================================================================
import * as THREE from 'three';
import { fbm2, noise2, sstep, ramp, makeBatch, paintMat, rockGeo } from './spacekit.js';

const TC = new THREE.Color(), TC2 = new THREE.Color(), CAVE_GLOW = new THREE.Color('#9fe6ff');

// ---------- (build 70) surface micro-detail: a rock normal map, made in code, and the shared mountain material --------
// The range mesh already has real height, but its faces are large triangles. A normal map adds cracks, pebbles and
// erosion grooves to the LIGHTING without adding any triangles, so it is the cheapest way to stop a big face looking
// smooth. It is a normal map (not a picture), so it is kept in linear colour space and tiles across the world position.
let ROCK_T = null, RIDGE_M = null;
function rockNormalMap() {
  if (ROCK_T) return ROCK_T;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N), H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    H[y * N + x] = fbm2(u * 7, v * 7, 4) * .72 + noise2(u * 26, v * 26) * .28; // broad lumps plus grit
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const l = H[y * N + ((x + N - 1) % N)], r = H[y * N + ((x + 1) % N)];
    const u = H[((y + N - 1) % N) * N + x], d = H[((y + 1) % N) * N + x];
    const dx = (r - l) * 3, dy = (d - u) * 3, il = 1 / Math.sqrt(dx * dx + dy * dy + 1), k = (y * N + x) * 4;
    img.data[k] = (dx * il * .5 + .5) * 255; img.data[k + 1] = (dy * il * .5 + .5) * 255; img.data[k + 2] = (il * .5 + .5) * 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return ROCK_T = t;
}
/** the shared material for mountain ranges: painted vertex colours plus the rock normal map (one shader program) */
export function ridgeMaterial() {
  if (RIDGE_M) return RIDGE_M;
  return RIDGE_M = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0, normalMap: rockNormalMap(), normalScale: new THREE.Vector2(.55, .55) });
}

/**
 * The height of a mountain range at (x, z), in metres. y is 0 in front of the range (the ground the world stands on)
 * and rises to about `h` at the highest summit.
 */
export function ridgeField({ x0, x1, zFront = -12, zBack = -50, h = 20, seed = 0, flatBand = 3.2 }) {
  const W = Math.max(1, x1 - x0), span = Math.max(1, flatBand + zFront - zBack);
  return (x, z) => {
    const d = zFront - z;
    if (d <= flatBand) return 0; // (the flat strip: the park's trees and rides stand exactly where they always did)
    const u = (x - x0) / W;
    const along = sstep(-.02, .12, u) * sstep(1.02, .9, u); // the range fades out at both ends
    const t = Math.min(1, (d - flatBand) / span);
    const front = sstep(0, .1, t); // it climbs steeply just behind the flat strip
    // a ridgeline that wanders: two scales of ridged noise, so there are big summits and smaller shoulders
    const warp = x * .004 + fbm2(x * .006 + seed * 7.7, 2.3, 2) * 3.1;
    const r1 = 1 - Math.abs(fbm2(warp, z * .0095 + seed * 1.7, 4) * 2 - 1);
    const r2 = 1 - Math.abs(fbm2(warp * 2.4 + 4.3, z * .024 + seed * 3.1, 3) * 2 - 1);
    const ridge = Math.pow(r1, 1.5) * .8 + Math.pow(r2, 2.2) * .34;
    const broad = fbm2(x * .0075 + seed * 2.9, z * .008 + 1.1, 3);
    let y = (ridge * .82 + broad * .36) * h * front * along;
    y += (fbm2(x * .05 + seed, z * .05, 3) - .5) * 2.6 * sstep(1.5, 5, y); // rough surface, only where it is high
    // erosion: narrow gullies cut down the face where the noise folds
    const cut = Math.abs(noise2(x * .06 + seed * 5, z * .012) - .5);
    y -= Math.pow(sstep(.075, 0, cut), 1.3) * Math.min(y, 11) * .5;
    // ledges: pull part of the way to a shelf height, so a cliff steps instead of sliding
    const shelf = 2.4;
    y += (Math.round(y / shelf) * shelf - y) * .2 * sstep(2.5, 8, y);
    return Math.max(0, y);
  };
}

/** how a mountain is painted: grass at the bottom, rock on the steep faces (in strata), snow on the tops */
export function ridgePaint({ h = 20, snow = false, seed = 0 }, x, y, z, ny, out) {
  const slope = 1 - Math.max(0, Math.min(1, ny));
  const n = fbm2(x * .3 + seed, y * .42 + z * .18, 3);
  const strata = .5 + .5 * Math.sin(y * 1.15 + n * 3.2 + x * .04);
  const rock = sstep(.28, .6, slope + (n - .5) * .3);
  ramp(['#79bd63', '#8ccb73', '#a6d488'], .25 + n * .55 + y * .01, out);
  if (rock > 0) { ramp(['#98a096', '#b4bcae', '#cdd3c4', '#8b9188'], strata, TC2); out.lerp(TC2, rock); }
  if (snow) { const cap = sstep(h * .66, h * .84, y) * sstep(.92, .5, slope + (n - .5) * .4); if (cap > 0) out.lerp(TC.set('#ffffff'), Math.min(1, cap * 1.1)); }
  out.multiplyScalar(.78 + .3 * Math.max(0, ny)); // darker folds: cheap ambient occlusion, so the gullies read as cuts
  return out;
}

/**
 * Build one mountain range. Returns { mesh, H, h }: H(x, z) is the surface height, for standing rocks on it.
 * opts: { x0, x1, zFront, zBack, h, seed, segX, segZ, snow }
 */
export function makeRidge(scene, opts = {}) {
  const o = { x0: -100, x1: 100, zFront: -12, zBack: -50, h: 20, seed: 0, segX: 132, segZ: 44, snow: false, ...opts };
  const H = ridgeField(o);
  const g = new THREE.PlaneGeometry(o.x1 - o.x0, o.zFront - o.zBack, o.segX, o.segZ);
  g.rotateX(-Math.PI / 2);
  g.translate((o.x0 + o.x1) / 2, 0, (o.zFront + o.zBack) / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const nrm = g.attributes.normal, cols = new Float32Array(p.count * 3), uvs = new Float32Array(p.count * 2), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    ridgePaint(o, p.getX(i), p.getY(i), p.getZ(i), nrm.getY(i), c);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    // (build 70) UVs from the world position, so a rock normal map tiles the whole face and the light picks out cracks,
    // pebbles and erosion grooves that are too small to model in the mesh
    uvs[i * 2] = p.getX(i) / 3.5; uvs[i * 2 + 1] = p.getZ(i) / 3.5;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  const m = new THREE.Mesh(g, ridgeMaterial());
  m.name = 'ridge'; m.receiveShadow = true; m.castShadow = false; // (a whole range casting one shadow would paint the park dark)
  scene.add(m);
  return { mesh: m, H, h: o.h };
}

/** angular rock formations sitting on a range's slope, all painted into ONE mesh (one draw call) */
export function makeCrags(scene, H, { x0, x1, z0, z1, n = 12, seed = 0, snowy = false } = {}) {
  if (typeof H !== 'function' || !(n > 0)) return null;
  const b = makeBatch();
  for (let i = 0; i < n; i++) {
    const f = (i + .5) / n;
    const jit = (fbm2(i * 3.1 + seed, .5, 2) - .5) * (x1 - x0) / n * .9;
    const x = x0 + (x1 - x0) * f + jit;
    const z = z0 + (z1 - z0) * fbm2(i * 1.7 + seed * 2, 1.3, 2);
    const s = .9 + fbm2(i * 5.3 + seed, 2.1, 2) * 2.3;
    b.put(rockGeo(i + seed, 1), x, H(x, z) + s * .12, z, (px, py, pz, nx, ny, nz, o) => {
      const st = .5 + .5 * Math.sin(py * 2.1 + fbm2(px * .6, pz * .6, 2) * 3);
      ramp(snowy ? ['#b9c4d0', '#d8e2ec', '#f2f7ff'] : ['#8f968c', '#aab2a4', '#c6ccbe'], st, o).multiplyScalar(.74 + .32 * Math.max(0, ny));
      o.lerp(TC.set(snowy ? '#ffffff' : '#7fbf63'), sstep(snowy ? .35 : .62, snowy ? .8 : .96, ny) * (snowy ? .6 : .45)); // snow caps, or a little moss on top
    }, [s * 1.1, s * (1.2 + fbm2(i, 4, 2) * .8), s * .95], [0, fbm2(i * 7.7, 3, 2) * 6.283, 0]);
  }
  if (!b.count()) return null;
  const m = b.mesh(paintMat()); m.name = 'crags'; m.castShadow = false; m.receiveShadow = true; scene.add(m);
  return m;
}


/**
 * (build 68) REAL CAVE ROCK for the underground: a rough ceiling sheet (it faces down, so the light picks out its bumps)
 * with stalactites hanging from it and stalagmites growing at the back, all painted into ONE mesh. The stalactites and
 * stalagmites keep to the back of the cave (z −5.8 … −3.4), so nothing hangs over the ball shaft, the lift or the
 * crawl tunnel, and nothing stands in the walking lane.
 */
export function makeCaveRock(scene, { x0 = 0, x1 = 40, ceil = -1.6, floor = -6, zBack = -5.8, zFront = -3.4, nA = 44, nB = 20, seed = 0 } = {}) {
  const b = makeBatch(), W = Math.max(1, x1 - x0);
  const paint = (px, py, pz, nx, ny, nz, out) => {
    const n = fbm2(px * .8 + seed, pz * .8 + py * .5, 3), strata = .5 + .5 * Math.sin(py * 2.3 + n * 3);
    ramp(['#4a2a70', '#6a4a90', '#8a6aa8', '#b0a0c0'], .2 + n * .6, out);
    out.multiplyScalar(.7 + .35 * Math.max(0, -ny) + .1 * strata); // the ceiling catches the lantern light on its underside
    if (fbm2(px * 3.1 + 7 + seed, pz * 3.1 + py * 2, 2) > .74) out.lerp(CAVE_GLOW, .35); // faint glowing flecks
    return out;
  };
  // the ceiling itself: a rough sheet just under the flat ceiling, so it reads as rock instead of a painted lid
  const g = new THREE.PlaneGeometry(W, zFront - zBack, Math.round(W * 1.6), 10);
  g.rotateX(Math.PI / 2); g.translate((x0 + x1) / 2, ceil - .02, (zBack + zFront) / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const n = fbm2(p.getX(i) * .9 + seed, p.getZ(i) * .9, 3) - .5; p.setY(i, ceil - .02 - Math.abs(n) * .45); }
  g.computeVertexNormals(); b.add(g, null, paint);
  // stalactites hanging from the ceiling, and stalagmites growing from the floor at the back
  const cone = new THREE.ConeGeometry(1, 1, 8, 3);
  for (let i = 0; i < nA + nB; i++) {
    const up = i >= nA, k = up ? i - nA : i;
    const x = x0 + W * ((k + .5) / (up ? nB : nA)) + (fbm2(k * 2.1 + seed, 3.3, 2) - .5) * 1.2;
    const z = up ? zBack + .4 + (zFront - zBack) * .35 * fbm2(k * 4.3 + seed, 1.9, 2)
      : zBack + .3 + (zFront - zBack - .6) * fbm2(k * 3.7 + seed, 1.7, 2);
    const len = (up ? .3 : .45) + fbm2(k * 5.1 + seed, 2.9, 2) * (up ? .9 : 1.5);
    const rad = .1 + fbm2(k * 7.3 + seed, 4.1, 2) * .22;
    const cg = cone.clone(), cp = cg.attributes.position;
    for (let q = 0; q < cp.count; q++) { const s = 1 + (fbm2(cp.getX(q) * 2 + k, cp.getY(q) * 2 + seed, 2) - .5) * .5; cp.setXYZ(q, cp.getX(q) * s, cp.getY(q), cp.getZ(q) * s); }
    cg.computeVertexNormals();
    b.put(cg, x, up ? floor + len / 2 : ceil - .02 - len / 2, z, paint, [rad, len, rad], [up ? Math.PI : 0, fbm2(k, 1, 2) * 6.283, 0]);
    cg.dispose();
  }
  g.dispose(); cone.dispose();
  const m = b.mesh(paintMat()); m.name = 'caverock'; m.castShadow = false; m.receiveShadow = true; scene.add(m);
  return m;
}
