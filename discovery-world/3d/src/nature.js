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
