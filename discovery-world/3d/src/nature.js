// ===================================================================
// nature.js: 3D build 13, real-looking surfaces and lots of little details.
//   • Procedural textures (drawn in code, no image files): lawn grass,
//     cobblestone path, leaves, tree bark and wall plaster, each with a
//     matching normal map so the light catches every bump.
//   • Scattered flowers and bushes (instanced, so they are cheap to draw).
// ===================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];

// turn a picture's brightness into bumps (a normal map)
export function normalFromCanvas(src, strength = 2) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, H = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) H[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255;
  const [c, g] = canvas(w, h), img = g.createImageData(w, h), at = (x, y) => H[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), k = (y * w + x) * 4;
    img.data[k] = (-dx / l * .5 + .5) * 255; img.data[k + 1] = (dy / l * .5 + .5) * 255; img.data[k + 2] = (1 / l * .5 + .5) * 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };

// ---------- lawn grass (one 4x4 m tile, repeated) ----------
let lawnCache = null;
export function lawnTextures() {
  if (lawnCache) return lawnCache;
  const N = 512, [c, g] = canvas(N);
  g.fillStyle = '#86d27c'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 260; i++) { g.fillStyle = pick(['#79c86f', '#93db87', '#6fbf68', '#a2e392', '#8ad57f']); g.globalAlpha = .18; const r = 12 + rnd() * 46, x = rnd() * N, y = rnd() * N; for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); } }
  g.globalAlpha = 1; g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) { const x = rnd() * N, y = rnd() * N, l = 3 + rnd() * 7, a = -Math.PI / 2 + (rnd() - .5) * .9; g.strokeStyle = pick(['#5aa957', '#6dbd65', '#9fe08f', '#b9ee9f', '#4f9d4f', '#80cf74']); g.lineWidth = 1 + rnd() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
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
    stems.setMatrixAt(n, m4); petals.setMatrixAt(n, m4); mids.setMatrixAt(n, m4); petals.setColorAt(n, cl.set(pick(FC))); n++;
  }
  for (const m of [stems, petals, mids]) { m.count = n; m.castShadow = false; m.receiveShadow = true; scene.add(m); }
  // bushes: soft leafy clumps along the back
  const clump = []; for (let i = 0; i < 7; i++) { const r = .35 + rnd() * .25, s = new THREE.SphereGeometry(r, 14, 10); s.translate((rnd() - .5) * .9, r * .8 + rnd() * .2, (rnd() - .5) * .6); clump.push(s); }
  const bushG = mergeGeometries(clump), lm = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .75, sheen: .6, sheenColor: new THREE.Color('#e8ffd8'), normalMap: leafNormal(), normalScale: new THREE.Vector2(1.2, 1.2) });
  const bush = new THREE.InstancedMesh(bushG, lm, bushes); let b = 0; tries = 0;
  while (b < bushes && tries++ < bushes * 40) {
    const x = x0 + rnd() * (x1 - x0), z = -10.8 + rnd() * 5; if (!ok(x, z) || !ok(x + .8, z) || !ok(x - .8, z)) continue;
    e.set(0, rnd() * 6.3, 0); q.setFromEuler(e); const s = .8 + rnd() * .9; m4.compose(V.set(x, 0, z), q, S.set(s, s * (.8 + rnd() * .4), s)); bush.setMatrixAt(b, m4); bush.setColorAt(b, cl.setHSL(.3 + rnd() * .07, .45 + rnd() * .2, .42 + rnd() * .12)); b++;
  }
  bush.count = b; bush.castShadow = true; bush.receiveShadow = true; scene.add(bush);
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
function bladeClump(n = 7) {
  const pos = [], col = [], hh = [], idx = []; let base = 0;
  for (let b = 0; b < n; b++) {
    const a = rnd() * Math.PI * 2, r = rnd() * .07, x0 = Math.cos(a) * r, z0 = Math.sin(a) * r, h = .22 + rnd() * .26, w = .022 + rnd() * .014, bend = .08 + rnd() * .12, rot = rnd() * Math.PI * 2;
    const dx = Math.cos(rot), dz = Math.sin(rot), px = -dz, pz = dx; // bend direction and blade width direction
    const tint = .85 + rnd() * .3;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4, y = t * h, off = bend * t * t, ww = w * (1 - t * .92);
      for (const sgn of [-1, 1]) { pos.push(x0 + dx * off + px * ww * sgn, y, z0 + dz * off + pz * ww * sgn); const k = (.42 + t * .7) * tint; col.push(k * .92, k, k * .78); hh.push(t); }
    }
    for (let i = 0; i < 4; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    base += 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('gh', new THREE.Float32BufferAttribute(hh, 1)); g.setIndex(idx);
  // normals mostly point up (soft, even lighting like a real lawn)
  const nrm = new Float32Array(pos.length); for (let i = 0; i < nrm.length; i += 3) { nrm[i] = 0; nrm[i + 1] = 1; nrm[i + 2] = 0; } g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}
export function grassField(scene, { x0, x1, ok, time, chunk = 24, perChunk = (typeof location !== 'undefined' && /[?&]test/.test(location.search)) ? 60 : 1100, bands = [[-11, -2.25], [3.6, 4.45]] }) {
  const geo = bladeClump(7);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = time;
    sh.vertexShader = 'uniform float uTime; attribute float gh;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 gw = instanceMatrix * vec4(0., 0., 0., 1.);
      float wind = sin(uTime * 1.7 + gw.x * .45 + gw.z * .3) * .7 + sin(uTime * 3.1 + gw.x * 1.3) * .3;
      transformed.x += wind * gh * gh * .11; transformed.z += wind * gh * gh * .04;`);
  };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), cl = new THREE.Color();
  const area = bands.reduce((a, [z0, z1]) => a + (z1 - z0), 0), meshes = [];
  for (let cx = x0; cx < x1; cx += chunk) {
    const im = new THREE.InstancedMesh(geo, mat, perChunk); let n = 0, tries = 0;
    while (n < perChunk && tries++ < perChunk * 4) {
      let zr = rnd() * area, z = 0; for (const [z0, z1] of bands) { if (zr < z1 - z0) { z = z0 + zr; break; } zr -= z1 - z0; }
      const x = cx + rnd() * Math.min(chunk, x1 - cx); if (!ok(x, z)) continue;
      e.set(0, rnd() * 6.3, 0); q.setFromEuler(e); const s = .75 + rnd() * .7; m4.compose(V.set(x, 0, z), q, S.set(s, s * (.8 + rnd() * .5), s));
      im.setMatrixAt(n, m4); im.setColorAt(n, cl.setHSL(.27 + rnd() * .07, .5 + rnd() * .2, .42 + rnd() * .12)); n++;
    }
    im.count = n; im.receiveShadow = true; im.castShadow = false; im.computeBoundingSphere(); scene.add(im); meshes.push(im);
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
    const gr = g.createLinearGradient(-L, 0, L, 0); const base = pick(['#4f9e4a', '#5fb352', '#6cc061', '#478f45', '#7ccc6a']); gr.addColorStop(0, base); gr.addColorStop(1, '#a8e08a');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * .45, L, 0); g.quadraticCurveTo(0, L * .45, -L, 0); g.fill();
    g.strokeStyle = 'rgba(30,70,30,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-L * .9, 0); g.lineTo(L * .9, 0); g.stroke();
    for (let v = -2; v <= 2; v++) { if (!v) continue; g.beginPath(); g.moveTo(v * L * .3, 0); g.lineTo(v * L * .3 + L * .18, v > 0 ? -L * .2 : L * .2); g.stroke(); }
    g.restore();
  }
  leafTexCache = new THREE.CanvasTexture(c); leafTexCache.colorSpace = THREE.SRGBColorSpace; leafTexCache.anisotropy = 4; return leafTexCache;
}
let leafMatCache = null, barkMatCache = null;
export function makeTree(scene, x, z, s = 1) {
  if (!barkMatCache) { const B = barkTextures(); B.map.repeat.set(1, 2); B.normal.repeat.set(1, 2); barkMatCache = new THREE.MeshStandardMaterial({ map: B.map, normalMap: B.normal, normalScale: new THREE.Vector2(1.5, 1.5), roughness: .92 }); }
  if (!leafMatCache) leafMatCache = new THREE.MeshStandardMaterial({ map: leafTexture(), alphaTest: .5, side: THREE.DoubleSide, roughness: .75, color: '#ffffff' });
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
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
  const perTip = (typeof location !== 'undefined' && /[?&]test/.test(location.search)) ? 3 : 16, cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(.95 * s, .95 * s), leafMatCache, tips.length * perTip), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cl = new THREE.Color();
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
  const m = new THREE.Mesh(geo, stoneMat); m.scale.set(s * (1 + rnd() * .4), s * (.55 + rnd() * .3), s); m.rotation.y = rnd() * 6; m.position.set(x, s * .12, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
}
