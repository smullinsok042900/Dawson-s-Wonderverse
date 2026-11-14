// ===================================================================
// spacekit.js (build 49): the building kit for the planets.
//
// Everything here is made by code (no downloads): sculpted ground with real hills, craters and mountains, rocks,
// painted moons and planets for the sky, a sky dome with stars and haze, soft glows and drifting dust.
//
// PERFORMANCE RULES this kit follows:
//  - all the still scenery of one place is merged into ONE mesh with painted (vertex) colours = one draw call;
//  - one shared material for all painted scenery, one shared sky shader, one shared glow picture, one dust cloud;
//  - nothing here runs per frame except the dust (about a hundred points) and the sky's clock.
// ===================================================================
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------- repeatable noise (the same world every time) ----------
const fr = v => v - Math.floor(v);
export const hash2 = (x, y) => fr(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const hash3 = (x, y, z) => fr(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
const sm = t => t * t * (3 - 2 * t);
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
export function fbm2(x, y, oct = 4) { let s = 0, a = .5, n = 0; for (let i = 0; i < oct; i++) { s += a * noise2(x, y); n += a; a *= .5; x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; } return s / n; }
export function fbm3(x, y, z, oct = 4) { let s = 0, a = .5, n = 0; for (let i = 0; i < oct; i++) { s += a * noise3(x, y, z); n += a; a *= .5; x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; z = z * 2.03 + 4.7; } return s / n; }
export const ridge2 = (x, y, oct = 4) => 1 - Math.abs(fbm2(x, y, oct) * 2 - 1);
export const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// ---------- colours ----------
const CC = {};
export const col = h => CC[h] || (CC[h] = new THREE.Color(h));
const TMP = new THREE.Color();
/** mix several colours: ramp(['#a', '#b', '#c'], t) with t from 0 to 1 */
export function ramp(stops, t, out = TMP) {
  t = Math.min(.9999, Math.max(0, t)) * (stops.length - 1); const i = Math.floor(t);
  return out.copy(col(stops[i])).lerp(col(stops[i + 1]), t - i);
}

// ---------- the shared materials (one shader program each, for every planet) ----------
let PAINT_M = null, PAINT_SHINY = null, PAINT_SOFT = null;
/** matte painted scenery: ground, rocks, mountains */
export const paintMat = () => PAINT_M || (PAINT_M = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 }));
/** glossy painted things: ice, the rocket, machines */
export const shinyMat = () => PAINT_SHINY || (PAINT_SHINY = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .34, metalness: .08 }));
/** soft things: clouds, aliens */
export const softMat = () => PAINT_SOFT || (PAINT_SOFT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .62, metalness: 0 }));

// ---------- a batch: many shapes merged into one mesh with painted colours ----------
const V = new THREE.Vector3(), N = new THREE.Vector3(), NM = new THREE.Matrix3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S3 = new THREE.Vector3(), C2 = new THREE.Color();
export function makeBatch() {
  const pos = [], nor = [], colr = [], idx = [];
  const B = {
    /** add a geometry. color: '#hex' or (x, y, z, nx, ny, nz, out) => void (world position and normal) */
    add(geo, m, color) {
      const p = geo.attributes.position, n = geo.attributes.normal, base = pos.length / 3, fn = typeof color === 'function' ? color : null, vc = geo.attributes.color;
      if (m) NM.getNormalMatrix(m); if (!fn && !vc) C2.copy(col(color));
      for (let i = 0; i < p.count; i++) {
        V.fromBufferAttribute(p, i); if (m) V.applyMatrix4(m); N.fromBufferAttribute(n, i); if (m) N.applyMatrix3(NM).normalize();
        pos.push(V.x, V.y, V.z); nor.push(N.x, N.y, N.z);
        if (fn) fn(V.x, V.y, V.z, N.x, N.y, N.z, C2); else if (vc) C2.fromBufferAttribute(vc, i);
        colr.push(C2.r, C2.g, C2.b);
      }
      if (geo.index) { const a = geo.index.array; for (let i = 0; i < a.length; i++) idx.push(a[i] + base); } else for (let i = 0; i < p.count; i++) idx.push(base + i);
      return B;
    },
    /** place a geometry: position, scale (number or [x,y,z]), rotation [x,y,z] */
    put(geo, x, y, z, color, s = 1, rot) {
      if (rot) Q.setFromEuler(E.set(rot[0], rot[1], rot[2])); else Q.identity();
      if (typeof s === 'number') S3.set(s, s, s); else S3.set(s[0], s[1], s[2]);
      return B.add(geo, M4.compose(V.set(x, y, z).clone(), Q, S3), color);
    },
    count: () => idx.length / 3,
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere(); return g;
    },
    mesh(mat = paintMat()) { const m = new THREE.Mesh(B.geometry(), mat); m.receiveShadow = true; return m; },
  };
  return B;
}

// ---------- shared shapes (made once) ----------
const GEO = {};
export const geo = {
  /** a ball: 0 = smooth (for big near things), 2 = medium, 1 = light (for small or far things) */
  sph: (lo = 0) => GEO['s' + (+lo)] || (GEO['s' + (+lo)] = +lo === 1 ? new THREE.SphereGeometry(1, 10, 7) : +lo === 2 ? new THREE.SphereGeometry(1, 16, 11) : new THREE.SphereGeometry(1, 24, 16)),
  cyl: (seg = 16) => GEO['c' + seg] || (GEO['c' + seg] = new THREE.CylinderGeometry(1, 1, 1, seg)),
  cone: (seg = 16) => GEO['k' + seg] || (GEO['k' + seg] = new THREE.ConeGeometry(1, 1, seg)),
  box: () => GEO.b || (GEO.b = roundBox(1, 1, 1, .08, 2)),
  torus: (tube = .1, seg = 24) => GEO['t' + tube + '_' + seg] || (GEO['t' + tube + '_' + seg] = new THREE.TorusGeometry(1, tube, 8, seg)),
};
/** a box with rounded edges (so nothing looks like a plain block) */
export function roundBox(w, h, d, r = .1, seg = 3) {
  const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2), p = g.attributes.position, n = g.attributes.normal, hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    V.fromBufferAttribute(p, i); const cx = Math.max(-hw, Math.min(hw, V.x)), cy = Math.max(-hh, Math.min(hh, V.y)), cz = Math.max(-hd, Math.min(hd, V.z));
    N.set(V.x - cx, V.y - cy, V.z - cz); if (N.lengthSq() > 1e-9) { N.normalize(); p.setXYZ(i, cx + N.x * r, cy + N.y * r, cz + N.z * r); n.setXYZ(i, N.x, N.y, N.z); }
  }
  return g;
}
/** a lumpy rock (several different ones; pick with k) */
const ROCKS = [];
export function rockGeo(k = 0, sharp = 0, lo = 0) {
  const key = (k % 5) + (sharp ? 5 : 0) + (lo ? 10 : 0); if (ROCKS[key]) return ROCKS[key];
  let g = new THREE.IcosahedronGeometry(1, lo ? 1 : 2); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  const p = g.attributes.position, s = key * 7.3;
  for (let i = 0; i < p.count; i++) {
    V.fromBufferAttribute(p, i); const n = fbm3(V.x * 1.1 + s, V.y * 1.1 + s * .7, V.z * 1.1 - s, 3), n2 = noise3(V.x * 3.1 - s, V.y * 3.1, V.z * 3.1 + s);
    V.multiplyScalar(.72 + n * .62 + (sharp ? n2 * .3 : n2 * .08)); if (V.y < -.45) V.y = -.45 + (V.y + .45) * .25; // (a flat-ish bottom, so it sits on the ground)
    p.setXYZ(i, V.x, V.y, V.z);
  }
  g.computeVertexNormals(); return ROCKS[key] = g;
}
/** a shape spun round an axis from a side outline [[radius, height], ...] */
export function lathe(points, seg = 24) { const g = new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), seg); g.deleteAttribute('uv'); return g; }

// ---------- sculpted ground ----------
/** a crater: returns how much it changes the height at (x, z), and writes shade (-1 dark floor … +1 bright rim) to cr.s */
export function craterH(cr, x, z) {
  const dx = x - cr.x, dz = z - cr.z, d = Math.sqrt(dx * dx + dz * dz) / cr.r; if (d > 2.2) { cr.s = 0; return 0; }
  const rim = Math.exp(-((d - 1) * (d - 1)) / .045), bowl = d < 1 ? (d * d - 1) : 0, mid = cr.peak ? Math.exp(-d * d / .03) * .35 : 0;
  cr.s = rim * .9 + bowl * .8 + (d > 1 ? Math.exp(-(d - 1) * 2.2) * .35 : 0) + (dx / cr.r) * Math.exp(-((d - .72) * (d - .72)) / .07) * 1.1; // (the wall facing away from the sun is dark, the one facing it bright: that is what makes a crater read as a hole)
  return cr.r * (cr.depth ?? .3) * (bowl + mid) + cr.r * (cr.rim ?? .12) * rim;
}
/**
 * The ground of one place: a big sheet that is dense near you and reaches far to the horizon, shaped by height(x, z) and
 * painted by color(x, z, h, ny, out). The strip you walk on (z > flatZ) stays exactly flat at 0, so the game's simple
 * ground rules still hold. Returns H(x, z): the height anywhere, for standing things on the ground.
 */
export function terrain(batch, { cx, height, color, flatZ = -4.6, blend = 4.5, nx = 128, nz = 54, zNear = 7.5, zFar = -175, wNear = 190, widen = 1.55 }) {
  const H = (x, z) => height(x, z) * sstep(flatZ, flatZ - blend, z);
  const g = new THREE.BufferGeometry(), pos = new Float32Array((nx + 1) * (nz + 1) * 3), idx = [];
  for (let j = 0, k = 0; j <= nz; j++) {
    const t = j / nz, z = zNear - (zNear - zFar) * Math.pow(t, 1.9), w = wNear + (zNear - z) * widen;
    for (let i = 0; i <= nx; i++) { const u = i / nx - .5, x = cx + (u * (.55 + Math.abs(u) * .9)) * w * 1.0; pos[k++] = x; pos[k++] = H(x, z); pos[k++] = z; } // (columns are closer together in the middle, where you look)
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); } // (winding: the top faces up, z shrinking with j)
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  batch.add(g, null, (x, y, z, nx2, ny, nz2, out) => color(x, z, y, ny, out));
  g.dispose(); return H;
}

// ---------- pictures for moons and planets in the sky (painted once, small) ----------
function paintSphere(w, h, fn) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d'), im = ctx.createImageData(w, h), d = im.data, c = new THREE.Color();
  for (let y = 0, k = 0; y < h; y++) {
    const lat = (.5 - (y + .5) / h) * Math.PI, cy = Math.sin(lat), cr = Math.cos(lat);
    for (let x = 0; x < w; x++, k += 4) { const lon = (x + .5) / w * Math.PI * 2; fn(Math.cos(lon) * cr, cy, Math.sin(lon) * cr, c); d[k] = Math.min(255, c.r * 255); d[k + 1] = Math.min(255, c.g * 255); d[k + 2] = Math.min(255, c.b * 255); d[k + 3] = 255; }
  }
  ctx.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const sRGB = (out, hex) => { const c = parseInt(hex.slice(1), 16); out.r = (c >> 16 & 255) / 255; out.g = (c >> 8 & 255) / 255; out.b = (c & 255) / 255; return out; };
const mixH = (out, a, b, t) => { const A = parseInt(a.slice(1), 16), Bc = parseInt(b.slice(1), 16); t = Math.min(1, Math.max(0, t)); out.r = lerp(A >> 16 & 255, Bc >> 16 & 255, t) / 255; out.g = lerp(A >> 8 & 255, Bc >> 8 & 255, t) / 255; out.b = lerp(A & 255, Bc & 255, t) / 255; return out; };
const spots = (x, y, z, f, thr) => { const n = noise3(x * f + 3.3, y * f + 7.7, z * f + 1.1); return sstep(thr, thr + .06, n); }; // (round-ish patches)
const T2 = new THREE.Color();
const BODY = {
  earth: (x, y, z, c) => {
    const n = fbm3(x * 1.9 + 4.2, y * 1.9 + 1.1, z * 1.9 + 8.3, 5), land = sstep(.5, .53, n), ice = sstep(.78, .86, Math.abs(y) + (n - .5) * .25);
    mixH(c, '#123f9a', '#2f7fe0', sstep(.3, .5, n)); // deep sea to shallow sea
    if (land > 0) { mixH(T2, '#3f9a48', '#c9a86a', sstep(.56, .68, n) * (1 - Math.abs(y) * .6) + (1 - Math.abs(y)) * .12); c.lerp(mixH(T2, '#2f8a3e', '#d2b070', sstep(.55, .7, n + (1 - Math.abs(y) * 1.4) * .08)), land); }
    c.lerp(sRGB(T2, '#ffffff'), ice);
    const cl = fbm3(x * 3.1 + 11, y * 5.2 + 3, z * 3.1 + 5, 4); c.lerp(sRGB(T2, '#ffffff'), sstep(.56, .72, cl) * .85);
  },
  grey: (x, y, z, c) => { const n = fbm3(x * 2.4, y * 2.4, z * 2.4, 4); mixH(c, '#6e6e7a', '#c4c4cc', n * 1.2 - .1); c.multiplyScalar(1 - spots(x, y, z, 5, .62) * .28 + spots(x, y, z, 9, .7) * .12); },
  charon: (x, y, z, c) => { const n = fbm3(x * 2.4, y * 2.4, z * 2.4, 4); mixH(c, '#77747a', '#c9c6c8', n * 1.2 - .1); c.multiplyScalar(1 - spots(x, y, z, 6, .64) * .22); c.lerp(sRGB(T2, '#8a4a3c'), sstep(.55, .85, y + (n - .5) * .3) * .85); },
  io: (x, y, z, c) => { const n = fbm3(x * 2.2, y * 2.2, z * 2.2, 4); mixH(c, '#e8c23a', '#fff0a0', n * 1.3 - .15); c.lerp(sRGB(T2, '#e0702a'), spots(x, y, z, 4, .6) * .8); c.lerp(sRGB(T2, '#3a2a22'), spots(x + 5, y, z, 7, .72)); c.lerp(sRGB(T2, '#fff8e0'), spots(x, y + 5, z, 6, .7) * .7); },
  europa: (x, y, z, c) => { const n = fbm3(x * 2, y * 2, z * 2, 3), cr = 1 - Math.abs(fbm3(x * 4 + 9, y * 4, z * 4, 3) * 2 - 1), cr2 = 1 - Math.abs(fbm3(x * 6, y * 6 + 4, z * 6, 2) * 2 - 1); mixH(c, '#d9d2c0', '#fbf8ee', n); c.lerp(sRGB(T2, '#9a5a3a'), sstep(.93, .985, cr) * .8 + sstep(.95, .99, cr2) * .5); },
  ganymede: (x, y, z, c) => { const n = fbm3(x * 2, y * 2, z * 2, 4); mixH(c, '#5e5348', '#b9ad9c', sstep(.4, .6, n)); c.lerp(sRGB(T2, '#f2efe6'), spots(x, y, z, 9, .74) * .8); },
  callisto: (x, y, z, c) => { const n = fbm3(x * 3, y * 3, z * 3, 4); mixH(c, '#3d362f', '#6a5f52', n); c.lerp(sRGB(T2, '#e8e2d2'), spots(x, y, z, 12, .72) * .9); },
  titan: (x, y, z, c) => { const n = fbm3(x * 1.2, y * 4, z * 1.2, 3); mixH(c, '#d98a2a', '#f2c060', n); c.lerp(sRGB(T2, '#b06a20'), sstep(.6, .9, Math.abs(y)) * .4); },
  triton: (x, y, z, c) => { const n = fbm3(x * 3, y * 3, z * 3, 4), cant = noise3(x * 14, y * 14, z * 14); mixH(c, '#8e9aa8', '#c6ccd2', n); c.multiplyScalar(.86 + cant * .22); c.lerp(mixH(T2, '#e8b8b0', '#f6dcd2', n), sstep(-.05, -.3, y + (n - .5) * .4)); c.lerp(sRGB(T2, '#4a4650'), spots(x, y, z, 10, .76) * sstep(0, -.3, y) * .7); },
  miranda: (x, y, z, c) => { const n = fbm3(x * 2.5, y * 2.5, z * 2.5, 4), ch = Math.abs(fr(x * 3 + Math.abs(z) * 3) - .5); mixH(c, '#8f9498', '#d4d8da', n); c.multiplyScalar(spots(x, y, z, 2.2, .55) > .5 ? .8 + ch * .5 : 1); },
  // a whole gas planet with stripes (for the rocket's destinations seen from far, and Saturn seen from its ring moons)
  sunface: (x, y, z, c) => { const n = fbm3(x * 5, y * 5, z * 5, 4); mixH(c, '#ffb42a', '#fff6c0', n * 1.4 - .1); },
};
const BT = {};
/** a ball with a painted surface, for the sky (lit by the scene's sun, so it shows a real day and night side) */
export function skyBody(kind, r, { size = 256, glow = 0, emissive = false } = {}) {
  const tex = BT[kind] || (BT[kind] = paintSphere(size, size / 2, BODY[kind]));
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 26), emissive ? new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, fog: false }));
  m.userData.dynamic = true; return m;
}

// ---------- soft glow (one small picture, tinted) ----------
let GLOW_T = null, DOT_T = null;
function radial(stops, size = 128) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const ctx = cv.getContext('2d'), g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, a] of stops) g.addColorStop(o, `rgba(255,255,255,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function glow(color, size, opacity = 1, additive = true) {
  GLOW_T = GLOW_T || radial([[0, 1], [.18, .62], [.42, .2], [.72, .05], [1, 0]]);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_T, color, transparent: true, opacity, depthWrite: false, fog: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  s.scale.set(size, size, 1); s.userData.dynamic = true; return s;
}

// ---------- the sky dome: colours, a soft sun glow, twinkling stars and drifting haze, all in one small shader ----------
export function makeSky() {
  const U = { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uLow: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, .2, -1) }, uSunCol: { value: new THREE.Color(0, 0, 0) }, uGlow: { value: new THREE.Vector3(8, .5, 0) },
    uStars: { value: 0 }, uTime: { value: 0 }, uBand: { value: new THREE.Color() }, uBandK: { value: 0 }, uWind: { value: .02 }, uAurora: { value: new THREE.Color(0, 0, 0) } };
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `precision highp float;
      uniform vec3 uTop, uMid, uHor, uLow, uSunDir, uSunCol, uGlow, uBand, uAurora; uniform float uStars, uTime, uBandK, uWind; varying vec3 vP;
      float h1(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1., 0.)), f.x), mix(h1(i + vec2(0., 1.)), h1(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vP); float h = d.y;
        vec3 c = mix(uHor, uMid, smoothstep(0., .16, h)); c = mix(c, uTop, smoothstep(.12, .62, h)); c = mix(c, uLow, smoothstep(0., -.05, h));
        float sd = max(dot(d, normalize(uSunDir)), 0.);
        c += uSunCol * (pow(sd, uGlow.x) * uGlow.y + pow(sd, 90.) * uGlow.z);
        float az = atan(d.x, -d.z);
        if (uBandK > 0.) { float n = vn(vec2(az * 5. + uTime * uWind, h * 22.)) * .65 + vn(vec2(az * 13. - uTime * uWind * 1.7, h * 55.)) * .35; c = mix(c, uBand, uBandK * smoothstep(.35, .8, n) * smoothstep(-.02, .1, h)); }
        if (uStars > 0.) { vec2 g = vec2(az, asin(clamp(h, -1., 1.))) * 46.; vec2 id = floor(g), f = fract(g) - .5; float r = h1(id);
          vec2 o = (vec2(h1(id + 3.1), h1(id + 9.7)) - .5) * .7; float m = smoothstep(.05 + r * .07, 0., length(f - o));
          c += uStars * m * step(.72, r) * (.55 + .45 * sin(uTime * (1. + r * 4.) + r * 60.)) * smoothstep(-.01, .06, h) * mix(vec3(1., .9, .8), vec3(.8, .9, 1.), h1(id + 1.7)); }
        if (uAurora.r + uAurora.g + uAurora.b > 0.) { float a = vn(vec2(az * 6. + uTime * .05, 1.)) * smoothstep(.06, .2, h) * smoothstep(.55, .2, h) * (.6 + .4 * sin(az * 40. + uTime * .7)); c += uAurora * a; }
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 20), mat); mesh.renderOrder = -10; mesh.frustumCulled = false; mesh.userData.dynamic = true; mesh.visible = false;
  return { mesh, U,
    set(s) {
      U.uTop.value.set(s.top); U.uMid.value.set(s.mid); U.uHor.value.set(s.hor); U.uLow.value.set(s.low ?? s.hor); U.uStars.value = s.stars ?? 0;
      U.uSunDir.value.set(...(s.sunDir ?? [0, .2, -1])); U.uSunCol.value.set(s.sunCol ?? '#000000'); U.uGlow.value.set(...(s.glow ?? [8, .5, 0]));
      U.uBand.value.set(s.band ?? '#000000'); U.uBandK.value = s.bandK ?? 0; U.uWind.value = s.wind ?? .02; U.uAurora.value.set(s.aurora ?? '#000000');
    } };
}

// ---------- drifting dust, snow, embers or sparkles: one small cloud of points that stays around the camera ----------
export function makeDust(n = 110) {
  DOT_T = DOT_T || radial([[0, 1], [.35, .7], [1, 0]], 32);
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), seed = new Float32Array(n); for (let i = 0; i < n; i++) seed[i] = Math.random();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const mat = new THREE.PointsMaterial({ map: DOT_T, size: .2, transparent: true, opacity: .8, depthWrite: false, sizeAttenuation: true, fog: false });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.userData.dynamic = true; pts.visible = false; pts.renderOrder = 5;
  let cfg = null, live = n;
  return { points: pts,
    /** cfg: { color, size, opacity, add (glow), box [w, h, d], vel [x, y, z], sway, n (how many, up to the pool size) } */
    set(c, cx, cy) {
      cfg = c; pts.visible = !!c; if (!c) return; live = Math.min(n, c.n ?? n); g.setDrawRange(0, live);
      mat.color.set(c.color); mat.size = c.size ?? .2; mat.opacity = c.opacity ?? .8; mat.blending = c.add ? THREE.AdditiveBlending : THREE.NormalBlending; mat.needsUpdate = false;
      const [w, h, d] = c.box; for (let i = 0; i < n; i++) { p[i * 3] = cx + (Math.random() - .5) * w; p[i * 3 + 1] = (c.y0 ?? 0) + Math.random() * h; p[i * 3 + 2] = (c.z0 ?? -8) + (Math.random() - .5) * d; }
      g.attributes.position.needsUpdate = true;
    },
    update(dt, t, cx, cy) {
      if (!cfg) return; const [w, h, d] = cfg.box, [vx, vy, vz] = cfg.vel, sw = cfg.sway ?? 0, y0 = (cfg.y0 ?? 0) + (cfg.follow ? cy : 0);
      for (let i = 0; i < live; i++) { const k = i * 3, s = seed[i];
        p[k] += (vx * (.5 + s) + Math.sin(t * (.6 + s) + s * 40) * sw) * dt; p[k + 1] += (vy * (.5 + s) + Math.cos(t * (.5 + s * .7) + s * 20) * sw * .5) * dt; p[k + 2] += vz * dt;
        if (p[k] > cx + w / 2) p[k] -= w; else if (p[k] < cx - w / 2) p[k] += w;
        if (p[k + 1] > y0 + h) p[k + 1] -= h; else if (p[k + 1] < y0) p[k + 1] += h; }
      g.attributes.position.needsUpdate = true;
    } };
}

// ---------- the rocket, with a smooth hull, swept fins, a round window frame, an engine bell and landing legs ----------
/** parts: [geometry, colour, x, y, z, scale, rotation]. Used merged (one mesh, on the planets) or as toy parts (on Earth). */
export function rocketParts() {
  const hull = lathe([[0, 6.75], [.16, 6.62], [.4, 6.2], [.64, 5.6], [.82, 4.9], [.92, 4.2], [.96, 3.4], [.96, 1.5], [.9, .95], [.78, .62], [.5, .5], [0, .5]], 32);
  const noseTop = 5.02, parts = [];
  // the hull is painted in bands by height: pink nose, white body, a yellow belt
  parts.push([hull, (x, y, z, nx, ny, nz, o) => { const yy = y; o.copy(col(yy > noseTop ? '#ff4f9a' : yy > noseTop - .16 ? '#ffd23f' : yy > 1.78 ? '#ffffff' : yy > 1.42 ? '#ffd23f' : yy > .98 ? '#ffffff' : '#c9cdd8')); if (yy > 1.78 && yy < noseTop - .16 && Math.abs(fr(yy * 1.25) - .5) > .47) o.multiplyScalar(.9); }, 0, 0, 0, 1]);
  parts.push([lathe([[.34, .56], [.42, .4], [.56, .18], [.66, .04], [.6, .04], [.5, .2], [.36, .4]], 20), '#6a7080', 0, 0, 0, 1]); // engine bell
  // three swept fins
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(0, 1.9); fs.quadraticCurveTo(.5, 1.3, 1.0, .25); fs.lineTo(1.05, -.55); fs.quadraticCurveTo(.5, -.1, 0, 0);
  const fin = new THREE.ExtrudeGeometry(fs, { depth: .12, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2, curveSegments: 8 }); fin.translate(0, 0, -.06); fin.deleteAttribute('uv');
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + .52; parts.push([fin, '#2fa8ff', Math.cos(a) * .88, .75, -Math.sin(a) * .88, 1, [0, a, 0]]); }
  // the window frame (the glass is its own part, so it can glow and show her face)
  const ring = new THREE.TorusGeometry(.42, .075, 10, 28); ring.deleteAttribute('uv'); parts.push([ring, '#ffd23f', 0, 3.6, .9, 1]);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; parts.push([geo.sph(1), '#fff3c0', Math.cos(a) * .42, 3.6 + Math.sin(a) * .42, .98, .035]); } // rivets
  // a little door outline and a stripe of rivets
  const door = roundBox(.62, 1.15, .06, .05, 2); parts.push([door, '#e6eaf2', -.0, 2.35, .955, 1]); parts.push([geo.sph(1), '#ff4f9a', .2, 2.3, 1.0, .05]);
  return parts;
}
export function rocketGlass() { return new THREE.SphereGeometry(.36, 20, 12); }
