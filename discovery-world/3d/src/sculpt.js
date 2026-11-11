// ===================================================================
// sculpt.js: 3D build 14, a little digital-clay sculpting engine.
//
// A creature is described as smooth shapes (spheres, ellipsoids, tapered
// limbs...) that MELT together like clay ("smooth union" of signed distance
// fields). The surface is extracted as ONE seamless mesh (Surface Nets on a
// 3D grid, each vertex snapped exactly onto the surface), with smooth
// normals, soft colour regions (bellies, inner ears, paw pads) and SKIN
// WEIGHTS so the mesh bends with a real skeleton of bones.
// Everything is made in code: no model files to download. The friends and
// animals are sculpted in a background worker so the game never stutters.
// ===================================================================
import * as THREE from 'three';

// Self-contained (no outside references) so it can also run inside a Web Worker.
export function sculptCore(spec) {
  const { max, min, abs, sqrt, exp } = Math;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function sdEllipsoid(px, py, pz, r) {
    const k0 = sqrt((px / r[0]) ** 2 + (py / r[1]) ** 2 + (pz / r[2]) ** 2), k1 = sqrt((px / (r[0] * r[0])) ** 2 + (py / (r[1] * r[1])) ** 2 + (pz / (r[2] * r[2])) ** 2);
    return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -min(r[0], r[1], r[2]);
  }
  function sdRoundCone(px, py, pz, a, b, ra, rb) {
    const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], l2 = bax * bax + bay * bay + baz * baz;
    const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
    const t = clamp((pax * bax + pay * bay + paz * baz) / l2, 0, 1);
    const qx = pax - bax * t, qy = pay - bay * t, qz = paz - baz * t;
    return sqrt(qx * qx + qy * qy + qz * qz) - (ra + (rb - ra) * t);
  }
  const smin = (a, b, k) => { if (k <= 0) return min(a, b); const h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * .25; };
  const smax = (a, b, k) => -smin(-a, -b, k);
  function partDist(p, x, y, z) {
    if (p.type === 'ellipsoid') return sdEllipsoid(x - p.c[0], y - p.c[1], z - p.c[2], p.r);
    if (p.type === 'sphere') return sqrt((x - p.c[0]) ** 2 + (y - p.c[1]) ** 2 + (z - p.c[2]) ** 2) - p.r;
    if (p.type === 'limb') return sdRoundCone(x, y, z, p.a, p.b, p.ra, p.rb);
    return 1e9;
  }
  function partBox(p) {
    const pad = (p.k || 0) + .02;
    if (p.type === 'limb') { const r = max(p.ra, p.rb) + pad; return [min(p.a[0], p.b[0]) - r, min(p.a[1], p.b[1]) - r, min(p.a[2], p.b[2]) - r, max(p.a[0], p.b[0]) + r, max(p.a[1], p.b[1]) + r, max(p.a[2], p.b[2]) + r]; }
    const r = p.type === 'sphere' ? [p.r, p.r, p.r] : p.r;
    return [p.c[0] - r[0] - pad, p.c[1] - r[1] - pad, p.c[2] - r[2] - pad, p.c[0] + r[0] + pad, p.c[1] + r[1] + pad, p.c[2] + r[2] + pad];
  }
  const shapes = spec.parts.filter(p => !p.carve), carves = spec.parts.filter(p => p.carve), paints = spec.paints || [];
  for (const p of spec.parts) p.box = partBox(p);
  const field = (x, y, z) => {
    let d = 1e9;
    for (const p of shapes) { const b = p.box; if (x < b[0] - .1 || y < b[1] - .1 || z < b[2] - .1 || x > b[3] + .1 || y > b[4] + .1 || z > b[5] + .1) continue; d = smin(d, partDist(p, x, y, z), p.k || .05); }
    for (const p of carves) d = smax(d, -partDist(p, x, y, z), p.k || .02);
    return d;
  };
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const p of shapes) for (let i = 0; i < 3; i++) { lo[i] = min(lo[i], p.box[i]); hi[i] = max(hi[i], p.box[i + 3]); }
  const v = spec.voxel || .03;
  for (let i = 0; i < 3; i++) { lo[i] -= v * 2; hi[i] += v * 2; }
  const nx = Math.ceil((hi[0] - lo[0]) / v) + 1, ny = Math.ceil((hi[1] - lo[1]) / v) + 1, nz = Math.ceil((hi[2] - lo[2]) / v) + 1;
  const F = new Float32Array(nx * ny * nz), idx = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[idx(i, j, k)] = field(lo[0] + i * v, lo[1] + j * v, lo[2] + k * v);
  // Surface Nets: one vertex per cell the surface passes through
  const cellV = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), cidx = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const val = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { val[c] = F[idx(i + C[c][0], j + C[c][1], k + C[c][2])]; if (val[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) { const va = val[a], vb = val[b]; if ((va < 0) === (vb < 0)) continue; const t = va / (va - vb); sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++; }
    cellV[cidx(i, j, k)] = pos.length / 3;
    pos.push(lo[0] + (i + sx / n) * v, lo[1] + (j + sy / n) * v, lo[2] + (k + sz / n) * v);
  }
  const index = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (!flip) index.push(a, c, b, a, d, c); else index.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = F[idx(i, j, k)], b = F[idx(i + 1, j, k)]; if ((a < 0) === (b < 0)) continue; quad(cellV[cidx(i, j - 1, k - 1)], cellV[cidx(i, j, k - 1)], cellV[cidx(i, j, k)], cellV[cidx(i, j - 1, k)], a < 0); }
  for (let k = 1; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const a = F[idx(i, j, k)], b = F[idx(i, j + 1, k)]; if ((a < 0) === (b < 0)) continue; quad(cellV[cidx(i - 1, j, k - 1)], cellV[cidx(i - 1, j, k)], cellV[cidx(i, j, k)], cellV[cidx(i, j, k - 1)], a < 0); }
  for (let k = 0; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const a = F[idx(i, j, k)], b = F[idx(i, j, k + 1)]; if ((a < 0) === (b < 0)) continue; quad(cellV[cidx(i - 1, j - 1, k)], cellV[cidx(i, j - 1, k)], cellV[cidx(i, j, k)], cellV[cidx(i - 1, j, k)], a < 0); }
  // snap onto the true surface; smooth normals from the field
  const nv = pos.length / 3, position = new Float32Array(pos), normal = new Float32Array(nv * 3), color = new Float32Array(nv * 3), e = v * .5, g = [0, 0, 0];
  const grad = (x, y, z, out) => { out[0] = field(x + e, y, z) - field(x - e, y, z); out[1] = field(x, y + e, z) - field(x, y - e, z); out[2] = field(x, y, z + e) - field(x, y, z - e); const l = Math.hypot(out[0], out[1], out[2]) || 1; out[0] /= l; out[1] /= l; out[2] /= l; };
  for (let i = 0; i < nv; i++) {
    let x = position[i * 3], y = position[i * 3 + 1], z = position[i * 3 + 2];
    for (let it = 0; it < 2; it++) { const d = field(x, y, z); grad(x, y, z, g); x -= g[0] * d; y -= g[1] * d; z -= g[2] * d; }
    position[i * 3] = x; position[i * 3 + 1] = y; position[i * 3 + 2] = z;
    grad(x, y, z, g); normal[i * 3] = g[0]; normal[i * 3 + 1] = g[1]; normal[i * 3 + 2] = g[2];
  }
  // colours (soft regions) and skin weights (the 4 strongest bones)
  const furAmt = new Float32Array(nv), nb = spec.boneCount, skinIndex = new Uint16Array(nv * 4), skinWeight = new Float32Array(nv * 4), bw = new Float32Array(nb), ds = new Float32Array(shapes.length);
  for (let i = 0; i < nv; i++) {
    const x = position[i * 3], y = position[i * 3 + 1], z = position[i * 3 + 2];
    let r = 0, gg = 0, b = 0, ws = 0, bare = 0, dmin = 1e9; bw.fill(0);
    for (let k = 0; k < shapes.length; k++) { ds[k] = partDist(shapes[k], x, y, z); if (ds[k] < dmin) dmin = ds[k]; }
    for (let k = 0; k < shapes.length; k++) {
      const p = shapes[k], w = exp(-(ds[k] - dmin) / (p.soft || .035)), c = p.color;
      r += c[0] * w; gg += c[1] * w; b += c[2] * w; ws += w; if (p.bare) bare += w; bw[p.bone] += exp(-(ds[k] - dmin) / (p.wsoft || .05));
    }
    r /= ws; gg /= ws; b /= ws; furAmt[i] = 1 - bare / ws;
    for (const p of paints) { const d = partDist(p, x, y, z), s = p.soft || .025; let t = clamp(.5 - d / (2 * s), 0, 1); if (t > 0) { t = t * t * (3 - 2 * t); r += (p.color[0] - r) * t; gg += (p.color[1] - gg) * t; b += (p.color[2] - b) * t; } }
    color[i * 3] = r; color[i * 3 + 1] = gg; color[i * 3 + 2] = b;
    let tot = 0; const top = [];
    for (let n = 0; n < 4; n++) { let best = -1, bv = 0; for (let k = 0; k < nb; k++) if (bw[k] > bv && !top.includes(k)) { bv = bw[k]; best = k; } if (best < 0) break; top.push(best); tot += bv; }
    top.forEach((o, n) => { skinIndex[i * 4 + n] = o; skinWeight[i * 4 + n] = bw[o] / tot; });
    if (!top.length) skinWeight[i * 4] = 1;
  }
  const uv = new Float32Array(nv * 2); for (let i = 0; i < nv; i++) { const x = position[i * 3], y = position[i * 3 + 1], z = position[i * 3 + 2]; uv[i * 2] = (Math.atan2(x, z) / (Math.PI * 2) + .5) * 3; uv[i * 2 + 1] = y * 2.5; }
  return { position, normal, color, skinIndex, skinWeight, uv, furAmt, index: new Uint32Array(index) };
}

// turn colours into linear RGB arrays and bone names into numbers
function prepare(spec) {
  const bi = new Map(spec.bones.map((b, i) => [b.name, i])), col = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
  return { voxel: spec.voxel, boneCount: spec.bones.length,
    parts: spec.parts.map(p => ({ ...p, color: p.carve ? [0, 0, 0] : col(p.color), bone: p.carve ? 0 : (bi.get(p.bone) ?? 0), box: undefined })),
    paints: (spec.paints || []).map(p => ({ ...p, color: col(p.color) })) };
}
function toGeometry(r) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(r.position, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(r.normal, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(r.color, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(r.uv, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(r.skinIndex, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(r.skinWeight, 4)); geo.setAttribute('furAmt', new THREE.BufferAttribute(r.furAmt, 1));
  geo.setIndex(new THREE.BufferAttribute(r.index, 1)); geo.computeBoundingSphere(); return geo;
}
export function sculpt(spec) { return toGeometry(sculptCore(prepare(spec))); }

// ---------- background sculpting (a small pool of Web Workers) ----------
let workers = null, jobId = 0; const jobs = new Map();
function pool() {
  if (workers) return workers;
  workers = [];
  try {
    const src = `const sculptCore = ${sculptCore.toString()};\nself.onmessage = e => { const r = sculptCore(e.data.spec); self.postMessage({ id: e.data.id, r }, [r.position.buffer, r.normal.buffer, r.color.buffer, r.skinIndex.buffer, r.skinWeight.buffer, r.uv.buffer, r.furAmt.buffer, r.index.buffer]); };`;
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) { const w = new Worker(url); w.busy = 0; w.onmessage = e => { w.busy--; const j = jobs.get(e.data.id); jobs.delete(e.data.id); j.resolve(toGeometry(e.data.r)); }; w.onerror = () => { workers.failed = true; }; workers.push(w); }
  } catch (e) { workers.failed = true; }
  return workers;
}
export function sculptAsync(spec) {
  const ws = pool();
  if (!ws.length || ws.failed) return new Promise(res => setTimeout(() => res(sculpt(spec)), 0)); // (no workers: do it on the main thread, a bit later)
  const id = ++jobId, w = ws.reduce((a, b) => (a.busy <= b.busy ? a : b)); w.busy++;
  return new Promise(resolve => { jobs.set(id, { resolve }); w.postMessage({ id, spec: prepare(spec) }); });
}

// ---------- skeletons ----------
// bind pose has no rotation: each bone sits at its model-space position
export function makeSkeleton(boneSpec) {
  const bones = {}, list = [];
  for (const b of boneSpec) {
    const bone = new THREE.Bone(); bone.name = b.name; bones[b.name] = bone; list.push(bone);
    const parent = b.parent ? boneSpec.find(x => x.name === b.parent) : null;
    bone.position.set(b.pos[0] - (parent ? parent.pos[0] : 0), b.pos[1] - (parent ? parent.pos[1] : 0), b.pos[2] - (parent ? parent.pos[2] : 0));
    bone.userData.rest = bone.position.clone(); bone.userData.world = b.pos;
    if (parent) bones[b.parent].add(bone);
  }
  return { bones, list, root: list[0], skeleton: new THREE.Skeleton(list) };
}
// put a skinned mesh on a skeleton (records the bind pose after the bones are in place)
export function skin(geo, mat, sk) {
  if (!geo.userData.padded) { geo.computeBoundingSphere(); geo.boundingSphere.radius *= 1.35; geo.userData.padded = true; } // (room for waving arms and tails)
  const mesh = new THREE.SkinnedMesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = true;
  mesh.add(sk.root); mesh.updateMatrixWorld(true); sk.skeleton.calculateInverses(); mesh.bind(sk.skeleton, mesh.matrixWorld);
  return mesh;
}
// attach a regular mesh to a bone, given the mesh's model-space position
export function attach(bone, obj, x, y, z) { const w = bone.userData.world; obj.position.set(x - w[0], y - w[1], z - w[2]); bone.add(obj); return obj; }
