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

const TC = new THREE.Color(), TC2 = new THREE.Color();

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
  const nrm = g.attributes.normal, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { ridgePaint(o, p.getX(i), p.getY(i), p.getZ(i), nrm.getY(i), c); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, paintMat());
  m.name = 'ridge'; m.receiveShadow = true; m.castShadow = false; // (a whole range casting one shadow would paint the park dark)
  scene.add(m);
  return { mesh: m, H, h: o.h };
}

/** angular rock formations sitting on a range's slope, all painted into ONE mesh (one draw call) */
export function makeCrags(scene, H, { x0, x1, z0, z1, n = 12, seed = 0 } = {}) {
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
      ramp(['#8f968c', '#aab2a4', '#c6ccbe'], st, o).multiplyScalar(.74 + .32 * Math.max(0, ny));
      o.lerp(TC.set('#7fbf63'), sstep(.62, .96, ny) * .45); // a little moss on top
    }, [s * 1.1, s * (1.2 + fbm2(i, 4, 2) * .8), s * .95], [0, fbm2(i * 7.7, 3, 2) * 6.283, 0]);
  }
  if (!b.count()) return null;
  const m = b.mesh(paintMat()); m.name = 'crags'; m.castShadow = false; m.receiveShadow = true; scene.add(m);
  return m;
}
