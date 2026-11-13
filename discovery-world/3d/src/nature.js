// ===================================================================
// nature.js: 3D build 13, real-looking surfaces and lots of little details.
//   • Procedural textures (drawn in code, no image files): lawn grass,
//     cobblestone path, leaves, tree bark and wall plaster, each with a
//     matching normal map so the light catches every bump.
//   • Scattered flowers and bushes (instanced, so they are cheap to draw).
// ===================================================================
import * as THREE from 'three';
import { USE_ASSETS, assetsReady } from './assets.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// (build 23) texture canvases are read back (normal maps), so they live in CPU memory: no slow GPU read-back stalls at start-up
const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })]; };
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
// (build 18) for grass and leaves: light both sides of a blade or leaf the same (three.js normally flips the
// normal on the back face, which turned half of all blades and leaves dark)
// (build 18) leafy surface for bushes and tree crowns: overlapping leaves (light) with shady gaps between them (dark),
// as a colour-detail texture plus matching gentle bumps (instead of a strong random-blob bump map)
let leafDetailCache = null;
export function leafDetail() {
  if (leafDetailCache) return leafDetailCache;
  const N = 256, [c, g] = canvas(N); g.fillStyle = '#5c5c5c'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 1100; i++) {
    const x = rnd() * N, y = rnd() * N, L = 6 + rnd() * 6, a = rnd() * Math.PI * 2;
    for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      if ((ox && Math.min(x, N - x) > L + 2) || (oy && Math.min(y, N - y) > L + 2)) continue; // (build 23: wrap copies only near the edge)
      g.save(); g.translate(x + ox, y + oy); g.rotate(a);
      const gr = g.createLinearGradient(0, -L * .5, 0, L * .5); const v = 200 + Math.floor(rnd() * 55); gr.addColorStop(0, `rgb(${v},${v},${v})`); gr.addColorStop(1, `rgb(${v - 70},${v - 70},${v - 70})`);
      g.fillStyle = gr; g.strokeStyle = 'rgba(40,40,40,.45)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * .55, L, 0); g.quadraticCurveTo(0, L * .55, -L, 0); g.fill(); g.stroke(); g.restore();
    }
  }
  const map = tex(c), normal = tex(normalFromCanvas(c, 1.6), false); map.repeat.set(2, 2); normal.repeat.set(2, 2);
  leafDetailCache = { map, normal }; return leafDetailCache;
}
const PHONE_GRASS = typeof navigator !== 'undefined' && (/iPhone|iPad|Android/.test(navigator.userAgent) || (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches));
export const LOD = []; // (build 22) things that are only drawn near the camera: { o, x, r }
const NO_FLIP = THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', '');

// turn a picture's brightness into bumps (a normal map)
export function normalFromCanvas(src, strength = 2) {
  // (build 23: a tight typed-array loop; the old version spent ~8 s of start-up in Math.hypot and wrap-around arithmetic)
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, n = w * h, H = new Float32Array(n);
  for (let i = 0, k = 0; i < n; i++, k += 4) H[i] = (d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11) * (strength / 255);
  const [c, g] = canvas(w, h), img = g.createImageData(w, h), o = img.data;
  for (let y = 0; y < h; y++) {
    const row = y * w, up = (y === 0 ? h - 1 : y - 1) * w, dn = (y === h - 1 ? 0 : y + 1) * w;
    for (let x = 0; x < w; x++) {
      const xl = x === 0 ? w - 1 : x - 1, xr = x === w - 1 ? 0 : x + 1;
      const dx = H[row + xr] - H[row + xl], dy = H[dn + x] - H[up + x], il = 1 / Math.sqrt(dx * dx + dy * dy + 1), k = (row + x) << 2;
      o[k] = (.5 - dx * il * .5) * 255; o[k + 1] = (dy * il * .5 + .5) * 255; o[k + 2] = (il * .5 + .5) * 255; o[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0); return c;
}
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };

// ---------- build 16: gently rolling meadow behind the path ----------
// (flat where rides and buildings stand, and along the path where you walk)
const FLAT = [[135, 151], [154, 166], [182, 198], [258, 303], [356, 400]];
export function terrainH(x, z) {
  if (z > -3.7 || x < 135 || x > 394) return 0;
  let m = 1; for (const [a, b] of FLAT) { const d = x < a ? a - x : x > b ? x - b : 0; m = Math.min(m, Math.min(1, d / 2.5)); }
  if (m <= 0) return 0;
  const zf = Math.min(1, (-3.7 - z) / 3.5), zs = zf * zf * (3 - 2 * zf);
  const n = Math.sin(x * .23 + 1.3) * .5 + Math.sin(x * .071 + z * .31) * .7 + Math.sin(z * .53 + x * .11) * .35;
  return Math.max(0, n * .5 + .5) * 1.25 * zs * m * m;
}

// ---------- (build 30) beach sand (one 4x4 m tile, repeated; drawn like the lawn, so it shares the lawn's shader) ----------
let sandCache = null;
export function sandTextures() {
  if (sandCache) return sandCache;
  const N = 256, [c, g] = canvas(N); g.fillStyle = '#efd9a7'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 5000; i++) { g.fillStyle = pick(['#e3c98f', '#f7e6bd', '#d8bd84', '#fff1cf', '#e9cf98']); g.globalAlpha = .55; g.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1 + rnd() * 2); }
  g.globalAlpha = .12; for (let i = 0; i < 30; i++) { g.fillStyle = pick(['#d6b97c', '#fff5d6']); g.beginPath(); g.ellipse(rnd() * N, rnd() * N, 20 + rnd() * 40, 6 + rnd() * 10, rnd() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1; sandCache = { map: tex(c), normal: tex(normalFromCanvas(c, 1.2), false) }; return sandCache;
}
let snowCache = null;
export function snowTextures() { // (build 31) soft snow, drawn like the lawn (same shader)
  if (snowCache) return snowCache;
  const N = 256, [c, g] = canvas(N); g.fillStyle = '#f3f8ff'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 3000; i++) { g.fillStyle = pick(['#e3eefc', '#ffffff', '#d8e6f8', '#f9fcff']); g.globalAlpha = .6; g.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1 + rnd() * 2); }
  g.globalAlpha = .15; for (let i = 0; i < 24; i++) { g.fillStyle = pick(['#cfdff5', '#ffffff']); g.beginPath(); g.ellipse(rnd() * N, rnd() * N, 24 + rnd() * 40, 8 + rnd() * 12, rnd() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1; snowCache = { map: tex(c), normal: tex(normalFromCanvas(c, .9), false) }; return snowCache;
}
// ---------- lawn grass (one 4x4 m tile, repeated) ----------
let lawnCache = null;
export function lawnTextures() {
  if (lawnCache) return lawnCache;
  const N = 512, [c, g] = canvas(N);
  g.fillStyle = '#74ad5f'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 260; i++) { g.fillStyle = pick(['#5f9b52', '#7cb565', '#679f58', '#8bbf6e', '#71a95e']); g.globalAlpha = .18; const r = 12 + rnd() * 46, x = rnd() * N, y = rnd() * N; for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) { if ((ox && Math.min(x, N - x) > r) || (oy && Math.min(y, N - y) > r)) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); } }
  g.globalAlpha = 1; g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) { const x = rnd() * N, y = rnd() * N, l = 3 + rnd() * 7, a = -Math.PI / 2 + (rnd() - .5) * .9; g.strokeStyle = pick(['#4d8a48', '#5f9b55', '#8ec275', '#a3cf86', '#457d43', '#6eaa5f']); g.lineWidth = 1 + rnd() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = pick(['#ffffff', '#fff3a6', '#ffd1ec']); g.beginPath(); g.arc(rnd() * N, rnd() * N, 1.6, 0, 7); g.fill(); }
  lawnCache = { map: tex(c), normal: tex(normalFromCanvas(c, 3.5), false) };
  return lawnCache;
}
// ---------- cobblestone path (3x3 m tile) ----------
export function cobbleTextures() {
  const N = 512, [c, g] = canvas(N), [hc, hg] = canvas(N);
  g.fillStyle = '#b8a493'; g.fillRect(0, 0, N, N); hg.fillStyle = '#000'; hg.fillRect(0, 0, N, N);
  const cells = 7, cw = N / cells;
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) {
    const cx = (i + .5 + (j % 2) * .5) * cw + (rnd() - .5) * 8, cy = (j + .5) * cw + (rnd() - .5) * 8, rx = cw * (.40 + rnd() * .06), ry = cw * (.38 + rnd() * .06), col = pick(['#f3e6d8', '#efdccb', '#f7ebe3', '#ecd8d0', '#f1e2c9', '#e9dbe8']);
    for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      const x = cx + ox, y = cy + oy;
      const gr = g.createRadialGradient(x - rx * .25, y - ry * .3, 2, x, y, Math.max(rx, ry)); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.35, col); gr.addColorStop(1, '#cdb9a6');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, rnd() * .4, 0, 7); g.fill();
      const hgr = hg.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry)); hgr.addColorStop(0, '#ffffff'); hgr.addColorStop(.7, '#bbbbbb'); hgr.addColorStop(1, '#222222');
      hg.fillStyle = hgr; hg.beginPath(); hg.ellipse(x, y, rx, ry, 0, 0, 7); hg.fill();
    }
  }
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${pick(['120,90,70', '255,255,255'])},.12)`; g.fillRect(rnd() * N, rnd() * N, 2, 2); }
  return { map: tex(c), normal: tex(normalFromCanvas(hc, 5), false) };
}
// ---------- leaves, bark, plaster ----------
let leafCache = null;
export function leafNormal() {
  if (leafCache) return leafCache;
  const N = 256, [c, g] = canvas(N); g.fillStyle = '#555'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 700; i++) { const x = rnd() * N, y = rnd() * N, r = 4 + rnd() * 9; const gr = g.createRadialGradient(x - r * .3, y - r * .3, 1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(40,40,40,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * .6, rnd() * 3, 0, 7); g.fill(); }
  leafCache = tex(normalFromCanvas(c, 3), false); return leafCache;
}
export function barkTextures() {
  const W = 128, H = 256, [c, g] = canvas(W, H); g.fillStyle = '#b37847'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { const x = rnd() * W; g.strokeStyle = pick(['#8e5a33', '#c58b58', '#9d673b', '#d39a66']); g.lineWidth = 1 + rnd() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= H; y += 16) g.lineTo(x + Math.sin(y * .05 + i) * 3, y); g.stroke(); }
  return { map: tex(c), normal: tex(normalFromCanvas(c, 4), false) };
}
let plasterCache = null;
export function plasterNormal() {
  if (plasterCache) return plasterCache;
  const N = 256, [c, g] = canvas(N); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${.05 + rnd() * .08})`; const r = 1 + rnd() * 5; g.beginPath(); g.arc(rnd() * N, rnd() * N, r, 0, 7); g.fill(); }
  plasterCache = tex(normalFromCanvas(c, 2), false); return plasterCache;
}

// ---------- flowers and bushes scattered over the lawns ----------
export function scatterNature(scene, { ok, x0, x1, count = 520, bushes = 80 }) {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cl = new THREE.Color(), V = new THREE.Vector3(), S = new THREE.Vector3();
  // flowers: stems, coloured petals, yellow middles (three instanced meshes that share placements)
  const stemG = new THREE.CylinderGeometry(.012, .015, .3, 5); stemG.translate(0, .15, 0);
  const pet = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, p = new THREE.SphereGeometry(.05, 8, 6); p.scale(1, .45, 1.3); p.rotateY(-a); p.translate(Math.cos(a) * .055, .31, Math.sin(a) * .055); pet.push(p); }
  const petalG = mergeGeometries(pet), midG = new THREE.SphereGeometry(.035, 8, 6); midG.translate(0, .325, 0);
  const stems = new THREE.InstancedMesh(stemG, new THREE.MeshStandardMaterial({ color: '#4fae55', roughness: .8 }), count);
  const petals = new THREE.InstancedMesh(petalG, new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .5, sheen: .8, sheenColor: new THREE.Color('#ffffff') }), count);
  const mids = new THREE.InstancedMesh(midG, new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: .6, emissive: '#ffb000', emissiveIntensity: .15 }), count);
  const FC = ['#ff6fae', '#ffd23f', '#ffffff', '#b28cff', '#5bc8ff', '#ff9a2e', '#ff8fa3'];
  let n = 0, tries = 0;
  while (n < count && tries++ < count * 30) {
    const x = x0 + rnd() * (x1 - x0), z = rnd() < .9 ? -10.6 + rnd() * 7.7 : 4.02 + rnd() * .42;
    if (!ok(x, z)) continue;
    e.set(0, rnd() * 6.3, (rnd() - .5) * .2); q.setFromEuler(e); const s = .8 + rnd() * .7; m4.compose(V.set(x, 0, z), q, S.set(s, s * (.8 + rnd() * .5), s));
    m4.elements[13] += terrainH(x, z); stems.setMatrixAt(n, m4); petals.setMatrixAt(n, m4); mids.setMatrixAt(n, m4); petals.setColorAt(n, cl.set(pick(FC))); n++;
  }
  for (const m of [stems, petals, mids]) { m.count = n; m.castShadow = false; m.receiveShadow = true; scene.add(m); }
  // bushes: soft leafy clumps along the back
  const clump = []; for (let i = 0; i < 7; i++) { const r = .35 + rnd() * .25, s = new THREE.SphereGeometry(r, 14, 10); s.translate((rnd() - .5) * .9, r * .8 + rnd() * .2, (rnd() - .5) * .6); clump.push(s); }
  const bushG = mergeGeometries(clump), lm = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: leafDetail().map, roughness: .8, sheen: .5, sheenRoughness: .6, sheenColor: new THREE.Color('#e4f7c0'), normalMap: leafDetail().normal, normalScale: new THREE.Vector2(.7, .7) });
  const bush = new THREE.InstancedMesh(bushG, lm, bushes); let b = 0; tries = 0;
  while (b < bushes && tries++ < bushes * 40) {
    const x = x0 + rnd() * (x1 - x0), z = -10.8 + rnd() * 5; if (!ok(x, z) || !ok(x + .8, z) || !ok(x - .8, z)) continue;
    e.set(0, rnd() * 6.3, 0); q.setFromEuler(e); const s = .8 + rnd() * .9; m4.compose(V.set(x, 0, z), q, S.set(s, s * (.8 + rnd() * .4), s)); m4.elements[13] += terrainH(x, z); bush.setMatrixAt(b, m4); bush.setColorAt(b, cl.setHSL(.26 + rnd() * .06, .36 + rnd() * .14, .42 + rnd() * .1)); b++;
  }
  bush.count = b; bush.castShadow = true; bush.receiveShadow = true;
  if (!USE_ASSETS) scene.add(bush);
  else assetsReady.then(A => {
    if (!A) { scene.add(bush); return; }
    // the Blender bushes, in chunks along the world so off-screen ones aren't drawn
    const chunks = new Map(), M = new THREE.Matrix4(), P = new THREE.Vector3(), BUSH_FIT = new THREE.Matrix4().makeScale(1.6, 1.5, 1.6); // (the Blender bush is a little smaller than the old clump)
    for (let i = 0; i < b; i++) { bush.getMatrixAt(i, M); P.setFromMatrixPosition(M); const key = Math.floor(P.x / 24) * 2 + (i % 2); if (!chunks.has(key)) chunks.set(key, []); chunks.get(key).push(M.clone().multiply(BUSH_FIT)); }
    for (const [key, list] of chunks) for (const p of A.bushes[((key % 2) + 2) % 2]) {
      const im = new THREE.InstancedMesh(p.geo, p.mat, list.length); list.forEach((m, k) => im.setMatrixAt(k, m));
      im.castShadow = !p.lo; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); LOD.push({ o: im, x: Math.floor(key / 2) * 24 + 12, r: 52, parts: p.lo ? [{ m: im, hi: p.geo, lo: p.lo }] : null });
      if (p.lo) { const sh = new THREE.InstancedMesh(p.lo, p.mat, list.length); sh.instanceMatrix = im.instanceMatrix; sh.castShadow = true; sh.layers.set(1); sh.computeBoundingSphere(); im.add(sh); } // (build 28) low-detail shadow
    }
  });
  return { flowers: n, bushes: b };
}

// ---------- a soft plush/velvet texture for furry characters ----------
let plushCache = null;
export function plushNormal() {
  if (plushCache) return plushCache;
  const N = 256, [c, g] = canvas(N); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N); g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) { const x = rnd() * N, y = rnd() * N, a = rnd() * 6.3, l = 1.5 + rnd() * 3; g.strokeStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},.18)`; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  plushCache = tex(normalFromCanvas(c, 2.5), false); plushCache.repeat.set(3, 3); return plushCache;
}

// ---------- fabric (woven) and brushed metal ----------
let weaveCache = null;
function weaveNormal() {
  if (weaveCache) return weaveCache;
  const N = 128, [c, g] = canvas(N); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
  for (let y = 0; y < N; y += 4) for (let x = 0; x < N; x += 4) { const over = ((x + y) / 4) % 2; g.fillStyle = over ? '#b0b0b0' : '#505050'; g.fillRect(x, y, over ? 4 : 2, over ? 2 : 4); }
  weaveCache = tex(normalFromCanvas(c, 2), false); weaveCache.repeat.set(6, 6); return weaveCache;
}
export function fabricMat(color) { return new THREE.MeshPhysicalMaterial({ color, roughness: .85, sheen: .8, sheenRoughness: .6, sheenColor: new THREE.Color('#ffffff'), normalMap: weaveNormal(), normalScale: new THREE.Vector2(.6, .6) }); }
let brushCache = null;
export function metalMatOf(color) {
  if (!brushCache) { const [c, g] = canvas(128); g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},.08)`; g.fillRect(0, rnd() * 128, 128, 1); } brushCache = tex(c, false); }
  return new THREE.MeshPhysicalMaterial({ color, roughness: .35, metalness: .9, roughnessMap: brushCache });
}

// ===================================================================
// build 15: REAL GRASS (thousands of curved blades that sway in the wind)
// ===================================================================
function bladeClump(n = 9) {
  // short, soft, rounded blades in a little tuft (stylized, bright, varied)
  const pos = [], col = [], hh = [], idx = []; let base = 0;
  for (let b = 0; b < n; b++) {
    const a = rnd() * Math.PI * 2, r = rnd() * .09, x0 = Math.cos(a) * r, z0 = Math.sin(a) * r, h = .12 + rnd() * .16, w = .03 + rnd() * .022, bend = .03 + rnd() * .07, rot = a + (rnd() - .5) * 1.2;
    const dx = Math.cos(rot), dz = Math.sin(rot), px = -dz, pz = dx;
    const hue = rnd(); // some blades a little yellow, some a little blue-green
    for (let i = 0; i <= 3; i++) {
      const t = i / 3, y = t * h, off = bend * t * t, ww = w * Math.sin((1 - t * .85) * Math.PI / 2 + .2);
      for (const sgn of [-1, 1]) { pos.push(x0 + dx * off + px * ww * sgn, y, z0 + dz * off + pz * ww * sgn); const k = .6 + t * .4; col.push(k * (.94 + hue * .1 + t * .05), k, k * (.78 + (1 - hue) * .08)); hh.push(t); /* (build 20: softer root-to-tip shading) */ }
    }
    for (let i = 0; i < 3; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    base += 8;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('gh', new THREE.Float32BufferAttribute(hh, 1)); g.setIndex(idx);
  // (build 18) normals: mostly up (soft, even light like a real lawn) with a little lean along each blade, so blades differ gently
  const nrm = new Float32Array(pos.length); for (let b = 0, v = 0; b < n; b++) { const a = (b * 2.399) % 6.283; for (let i = 0; i < 8; i++, v++) { const nx = Math.cos(a) * .35, nz = Math.sin(a) * .35, l = Math.hypot(nx, 1, nz); nrm[v * 3] = nx / l; nrm[v * 3 + 1] = 1 / l; nrm[v * 3 + 2] = nz / l; } }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}
export function grassField(scene, { x0, x1, ok, time, chunk = 24, perChunk = (typeof location !== 'undefined' && /[?&]test/.test(location.search)) ? 60 : (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) ? 1150 : 1700, bands = [[-11, -2.2], [3.6, 4.45]] }) {
  const geo = bladeClump(9);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = time; sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', NO_FLIP);
    sh.vertexShader = 'uniform float uTime; attribute float gh;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 gw = instanceMatrix * vec4(0., 0., 0., 1.);
      float wind = sin(uTime * 1.7 + gw.x * .45 + gw.z * .3) * .7 + sin(uTime * 3.1 + gw.x * 1.3) * .3;
      transformed.x += wind * gh * gh * .11; transformed.z += wind * gh * gh * .04;
      // (build 20) far away, clumps sink smoothly into the lawn instead of becoming shimmering noise
      float camD = distance(gw.xyz, cameraPosition); transformed.y *= 1. - smoothstep(26., 44., camD);`);
  };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), cl = new THREE.Color();
  const area = bands.reduce((a, [z0, z1]) => a + (z1 - z0), 0), meshes = [];
  for (let cx = x0; cx < x1; cx += chunk) {
    const im = new THREE.InstancedMesh(geo, mat, perChunk); let n = 0, tries = 0;
    while (n < perChunk && tries++ < perChunk * 4) {
      let zr = rnd() * area, z = 0; for (const [z0, z1] of bands) { if (zr < z1 - z0) { z = z0 + zr; break; } zr -= z1 - z0; }
      const x = cx + rnd() * Math.min(chunk, x1 - cx); if (!ok(x, z)) continue;
      e.set(0, rnd() * 6.3, 0); q.setFromEuler(e); const near = z > -5.5 && z < 0 ? 1 : 0, s = (.8 + rnd() * .6) * (near ? .85 : 1.1); m4.compose(V.set(x, terrainH(x, z), z), q, S.set(s, s * (.8 + rnd() * .5), s));
      im.setMatrixAt(n, m4); const dry = rnd() < .05; im.setColorAt(n, dry ? cl.setHSL(.17 + rnd() * .03, .38, .42) : cl.setHSL(.25 + rnd() * .04, .36 + rnd() * .08, .37 + rnd() * .05)); n++; /* (build 20: close to the lawn colour, less clump-to-clump contrast) */
    }
    im.count = PHONE_GRASS ? Math.round(n * .6) : n; /* (build 28) phones: 40% fewer grass clumps (they are in random order, so the rest stay evenly spread) */ im.receiveShadow = true; im.castShadow = false; im.computeBoundingSphere(); scene.add(im); meshes.push(im); LOD.push({ o: im, x: cx + chunk / 2, r: 44 });
  }
  return meshes;
}

// ===================================================================
// build 15: REAL TREES (a trunk that splits into branches and twigs, bark,
// and layered clusters of leaf shapes)
// ===================================================================
let leafTexCache = null;
function leafTexture() {
  if (leafTexCache) return leafTexCache;
  const N = 256, [c, g] = canvas(N);
  g.clearRect(0, 0, N, N);
  for (let i = 0; i < 46; i++) {
    const x = 20 + rnd() * (N - 40), y = 20 + rnd() * (N - 40), a = rnd() * Math.PI * 2, L = 22 + rnd() * 18;
    g.save(); g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(-L, 0, L, 0); const base = pick(['#4a8e44', '#58a04c', '#63a955', '#437f40', '#6eb25c']); gr.addColorStop(0, base); gr.addColorStop(1, '#9cc97c');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * .45, L, 0); g.quadraticCurveTo(0, L * .45, -L, 0); g.fill();
    g.strokeStyle = 'rgba(30,70,30,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-L * .9, 0); g.lineTo(L * .9, 0); g.stroke();
    for (let v = -2; v <= 2; v++) { if (!v) continue; g.beginPath(); g.moveTo(v * L * .3, 0); g.lineTo(v * L * .3 + L * .18, v > 0 ? -L * .2 : L * .2); g.stroke(); }
    g.restore();
  }
  leafTexCache = new THREE.CanvasTexture(c); leafTexCache.generateMipmaps = true; leafTexCache.colorSpace = THREE.SRGBColorSpace; leafTexCache.anisotropy = 4; return leafTexCache;
}
let leafMatCache = null, barkMatCache = null, canopyMats = null, canopyCache = null;
// a lumpy cloud-like blob for tree tops
function canopyGeo() { if (canopyCache) return canopyCache; const g = new THREE.IcosahedronGeometry(1, 4), p = g.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + Math.sin(v.x * 4.1) * Math.sin(v.y * 3.7 + 1) * Math.sin(v.z * 4.3) * .13 + Math.sin(v.x * 9 + v.z * 7) * .03; v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals();
  // (build 18) soften: lean every normal toward the round crown, so the lumps read as soft clusters, not facets
  { const nn = g.attributes.normal, w = new THREE.Vector3(); for (let i = 0; i < nn.count; i++) { w.fromBufferAttribute(p, i).normalize().multiplyScalar(.65); v.fromBufferAttribute(nn, i).multiplyScalar(.35).add(w).normalize(); nn.setXYZ(i, v.x, v.y, v.z); } }
  canopyCache = g; return g; }
// build 19: trees and bushes come from the Blender asset pipeline (real model files); the
// procedural versions below stay as the light test mode and as a fallback
export function makeTree(scene, x, z, s = 1) {
  if (!USE_ASSETS) return makeTreeProc(scene, x, z, s);
  const g = new THREE.Group(); g.position.set(x, terrainH(x, z) - .03, z); g.rotation.y = rnd() * 6.283; scene.add(g); const entry = { o: g, x, z, r: 60, tree: true }; LOD.push(entry);
  const v = Math.abs(Math.round(x * 7.3)) % 3, sc = s * (.9 + rnd() * .18);
  assetsReady.then(A => {
    if (!A) { scene.remove(g); makeTreeProc(scene, x, z, s); return; }
    const parts = [];
    for (const p of A.trees[v]) { const m = new THREE.Mesh(p.geo, p.mat); m.scale.setScalar(sc); m.castShadow = !p.lo; m.receiveShadow = true; g.add(m);
      // (build 28) the shadow comes from the low-detail copy, which is only drawn into the shadow map (layer 1)
      if (p.lo) { const sh = new THREE.Mesh(p.lo, p.mat); sh.scale.setScalar(sc); sh.castShadow = true; sh.receiveShadow = false; sh.layers.set(1); g.add(sh); parts.push({ m, hi: p.geo, lo: p.lo }); } }
    entry.parts = parts;
  });
  return g;
}
function makeTreeProc(scene, x, z, s = 1) {
  if (!barkMatCache) { const B = barkTextures(); B.map.repeat.set(1, 2); B.normal.repeat.set(1, 2); barkMatCache = new THREE.MeshStandardMaterial({ map: B.map, normalMap: B.normal, normalScale: new THREE.Vector2(1.5, 1.5), roughness: .92 }); }
  if (!leafMatCache) { leafMatCache = new THREE.MeshStandardMaterial({ map: leafTexture(), alphaTest: .5, side: THREE.DoubleSide, roughness: .75, color: '#ffffff' });
    // (build 18) each leaf card is lit as part of a round crown: its normal points out from the middle of the tree, never flipped
    leafMatCache.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n#ifdef USE_INSTANCING\n vec3 crown = instanceMatrix[3].xyz - vec3(0., 2.1, 0.); objectNormal = inverse(mat3(instanceMatrix)) * normalize(normalize(crown) + vec3(0., .55, 0.));\n#endif'); sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', NO_FLIP); }; }
  const g = new THREE.Group(); g.position.set(x, terrainH(x, z), z); scene.add(g);
  const segs = [], tips = [], up = new THREE.Vector3(0, 1, 0);
  // grow: each branch is a tapered cylinder pointing along dir
  function grow(p0, dir, len, r0, depth) {
    const r1 = r0 * .62, p1 = p0.clone().addScaledVector(dir, len);
    const cyl = new THREE.CylinderGeometry(r1, r0, len, depth ? 7 : 10, 3); cyl.translate(0, len / 2, 0);
    // gentle wobble so it isn't a perfect cylinder
    const pa = cyl.attributes.position; for (let i = 0; i < pa.count; i++) { const yy = pa.getY(i); pa.setX(i, pa.getX(i) + Math.sin(yy * 7 + depth) * r0 * .12); }
    const qq = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()); cyl.applyQuaternion(qq); cyl.translate(p0.x, p0.y, p0.z); segs.push(cyl);
    if (depth >= 3) { tips.push(p1); return; }
    const kids = depth === 0 ? 3 : 2 + (rnd() < .5 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const a = (k / kids) * Math.PI * 2 + rnd() * .8, tilt = .45 + rnd() * .35 + depth * .1;
      const nd = new THREE.Vector3(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt)).lerp(dir, .35).normalize();
      grow(p1, nd, len * (.62 + rnd() * .15), r1, depth + 1);
    }
    if (depth >= 1) tips.push(p1);
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3((rnd() - .5) * .1, 1, (rnd() - .5) * .1).normalize(), 1.5 * s, .2 * s, 0);
  const wood = new THREE.Mesh(mergeGeometries(segs), barkMatCache); wood.castShadow = true; wood.receiveShadow = true; g.add(wood);
  // root flare at the base
  const flare = new THREE.Mesh(new THREE.ConeGeometry(.42 * s, .35 * s, 12, 1, true), barkMatCache); flare.position.y = .12 * s; g.add(flare);
  // leaves: clusters of leaf cards around every branch tip, in layers
  // soft, full canopy: big leafy blobs around the branch tips (build 16), with a fringe of leaf cards
  if (!canopyMats) canopyMats = ['#74b65c', '#84c266', '#69a957', '#93cb70'].map(c => new THREE.MeshPhysicalMaterial({ color: c, map: leafDetail().map, roughness: .8, sheen: .6, sheenRoughness: .6, sheenColor: new THREE.Color('#e4f7c0'), normalMap: leafDetail().normal, normalScale: new THREE.Vector2(.7, .7) }));
  const blobG = canopyGeo();
  tips.forEach((t, i) => { if (i % 2) return; const m = new THREE.Mesh(blobG, canopyMats[(i + Math.round(x)) % 4]); const r = (.55 + rnd() * .3) * s; m.scale.set(r, r * .85, r); m.position.copy(t).add(new THREE.Vector3(0, .15 * s, 0)); m.rotation.y = rnd() * 6; m.castShadow = true; m.receiveShadow = true; g.add(m); });
  const perTip = (typeof location !== 'undefined' && /[?&]test/.test(location.search)) ? 3 : 10, cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(.95 * s, .95 * s), leafMatCache, tips.length * perTip), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cl = new THREE.Color();
  let n = 0;
  for (const t of tips) for (let i = 0; i < perTip; i++) {
    const v = new THREE.Vector3(rnd() - .5, rnd() * .8 - .2, rnd() - .5).normalize().multiplyScalar(rnd() * .55 * s);
    e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e); const sc = .7 + rnd() * .6;
    m4.compose(t.clone().add(v), q, new THREE.Vector3(sc, sc, sc)); cards.setMatrixAt(n, m4);
    const shade = .7 + (v.y / (.55 * s) + .5) * .35; cards.setColorAt(n, cl.setRGB(shade * (.9 + rnd() * .15), shade, shade * (.85 + rnd() * .1))); n++;
  }
  cards.count = n; cards.castShadow = true; cards.receiveShadow = true; g.add(cards);
  return g;
}

// ===================================================================
// build 15: natural rocks (lumpy, with stone texture)
// ===================================================================
let stoneMat = null;
export function makeRock(scene, x, z, s = 1) {
  if (!stoneMat) { const [c, g] = canvas(256); g.fillStyle = '#a99fb0'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2500; i++) { g.fillStyle = pick(['#8f8698', '#c0b8c6', '#9a90a3', '#b3abbb', '#7f7789']); g.globalAlpha = .4; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 4, 0, 7); g.fill(); } g.globalAlpha = 1; stoneMat = new THREE.MeshStandardMaterial({ map: tex(c), normalMap: tex(normalFromCanvas(c, 3), false), roughness: .95 }); }
  const geo = new THREE.IcosahedronGeometry(1, 3), p = geo.attributes.position, v = new THREE.Vector3(), k = rnd() * 10;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + Math.sin(v.x * 2.3 + k) * Math.sin(v.y * 2.9 + k) * Math.sin(v.z * 2.1) * .22 + Math.sin(v.x * 7 + v.z * 5) * .04; v.multiplyScalar(n); v.y = Math.max(v.y, -.25); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, stoneMat); m.scale.set(s * (1 + rnd() * .4), s * (.55 + rnd() * .3), s); m.rotation.y = rnd() * 6; m.position.set(x, s * .12 + terrainH(x, z), z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}

// ---------- build 17: a very fine surface grain for painted and moulded things (no more glassy plastic) ----------
let microCache = null;
export function microNormal() {
  if (microCache) return microCache;
  const N = 128, [c, g] = canvas(N); g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${.05 + rnd() * .07})`; g.beginPath(); g.arc(rnd() * N, rnd() * N, .6 + rnd() * 1.8, 0, 7); g.fill(); }
  microCache = tex(normalFromCanvas(c, 1.6), false); microCache.repeat.set(4, 4); return microCache;
}
