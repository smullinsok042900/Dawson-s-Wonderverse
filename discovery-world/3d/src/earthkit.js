// ===================================================================
// earthkit.js (build 53): better-looking scenery for the Earth neighbourhoods, made the cheap way the planets are:
// many painted shapes merged into ONE mesh (one draw call), using the painted materials that are already compiled
// while the loading screen shows (spacekit.js), so nothing here adds a shader or a wait.
//
//  - toyHouses: real little houses (walls, tiled roof, chimney, door, windows with shutters and flower boxes, awnings)
//    instead of plain coloured blocks with a pyramid on top;
//  - makeSea: a sea that really moves: rolling waves that catch the light, pale shallows at the shore, deep blue far out.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, roundBox, geo, col, sstep, noise2 } from './spacekit.js';

const C = new THREE.Color();
const BOX = new THREE.BoxGeometry(1, 1, 1); BOX.deleteAttribute('uv');
const DOT = new THREE.SphereGeometry(1, 6, 4); // (a very light ball for flowers and knobs: they are a few pixels big)
const shade = (hex, k) => '#' + C.set(hex).multiplyScalar(k).getHexString();
const tint = (hex, k) => '#' + C.set(hex).lerp(col('#ffffff'), k).getHexString();

/** one toy house into a batch. (x, z) is the middle of its floor; the front faces the camera (+z). */
function toyHouse(b, x, z, w, h, d, wall, roof, i) {
  const fz = z + d / 2, trim = '#fff8ee', dark = shade(wall, .78);
  b.put(roundBox(w + .36, .34, d + .36, .1, 1), x, .17, z, '#d9cfc4');
  // walls: a little darker near the ground, as if the paint had weathered
  b.put(roundBox(w, h, d, .16, 2), x, .3 + h / 2, z, (px, py, pz, nx, ny, nz, o) => { o.set(wall).multiplyScalar(.86 + .16 * sstep(.3, 2.2, py) + (noise2(px * 3, py * 3) - .5) * .04); });
  b.put(roundBox(w + .1, .16, d + .1, .06, 1), x, .3 + h - .05, z, trim); // the white band under the roof
  // the roof: a long ridge with overhanging eaves, painted in rows of tiles
  const rh = 2.1 + (i % 2) * .4, hw = d / 2 + .55, s = new THREE.Shape(); s.moveTo(-hw, 0); s.lineTo(0, rh); s.lineTo(hw, 0); s.lineTo(hw - .12, -.14); s.lineTo(-hw + .12, -.14);
  const rg = new THREE.ExtrudeGeometry(s, { depth: w + .9, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 1, curveSegments: 1 }); rg.deleteAttribute('uv'); rg.rotateY(Math.PI / 2); rg.translate(-(w + .9) / 2, 0, 0);
  const ry = .3 + h + .1;
  b.put(rg, x, ry, z, (px, py, pz, nx, ny, nz, o) => { const row = Math.floor((py - ry) * 3.2), u = px + (row % 2) * .32, tile = Math.abs(((u * 1.6) % 1 + 1) % 1 - .5); o.set(roof).multiplyScalar(ny > .2 ? (.82 + (row % 2) * .1 + tile * .2) : .7); });
  b.put(geo.cyl(8), x, ry + rh + .02, z, shade(roof, .72), [.1, w + 1, .1], [0, 0, Math.PI / 2]); // ridge cap
  // chimney with a cap
  const cx = x + (i % 2 ? 1 : -1) * w * .28; b.put(roundBox(.62, 1.5, .62, .06, 1), cx, ry + rh * .55 + .4, z - .5, '#c96a4a'); b.put(roundBox(.78, .16, .78, .05, 1), cx, ry + rh * .55 + 1.18, z - .5, '#f2e6da');
  // the door: frame, door, a little round window, a knob, a step, and a striped awning over it
  const dx = x + (i % 3 - 1) * .9, dc = ['#ff6a8a', '#3f8cff', '#ffb02e', '#7a5cff', '#2fb86a'][i % 5];
  b.put(roundBox(1.36, 2.16, .12, .08, 1), dx, .3 + 1.06, fz + .02, trim); b.put(roundBox(1.1, 1.95, .14, .1, 1), dx, .3 + .98, fz + .06, dc);
  b.put(DOT, dx, .3 + 1.45, fz + .13, '#bfe8ff', [.24, .24, .05]); b.put(DOT, dx + .38, .3 + .95, fz + .16, '#ffd23f', .07); b.put(roundBox(1.6, .16, .7, .06, 1), dx, .08, fz + .3, '#e6dccf');
  b.put(roundBox(1.7, .1, .8, .04, 1), dx, .3 + 2.42, fz + .34, (px, py, pz, nx, ny, nz, o) => { o.set(Math.floor((px - dx + 9) * 3.6) % 2 ? '#ffffff' : dc); }, 1, [.42, 0, 0]);
  // windows: white frame, glass, cross bars, shutters, and a flower box under the ground-floor ones
  const floors = h >= 5 ? 2 : 1, cols = [-1, 1].map(sd => dx + sd * 1.72).filter(wx => Math.abs(wx - x) < w / 2 - .7); if (!cols.length) cols.push(dx > x ? x - w * .28 : x + w * .28);
  for (let f = 0; f < floors; f++) for (const wx of cols) { const wy = .3 + 1.5 + f * 2.25;
    b.put(roundBox(1.06, 1.1, .1, .07, 1), wx, wy, fz + .02, trim); b.put(roundBox(.84, .88, .12, .05, 1), wx, wy, fz + .05, (px, py, pz, nx, ny, nz, o) => { o.set('#8fd4ff').lerp(col('#e8f8ff'), sstep(wy - .4, wy + .4, py + (px - wx) * .6)); });
    b.put(BOX, wx, wy, fz + .12, trim, [.06, .88, .03]); b.put(BOX, wx, wy, fz + .12, trim, [.84, .06, .03]);
    for (const sd of [-1, 1]) b.put(roundBox(.3, 1.04, .07, .03, 1), wx + sd * .7, wy, fz + .04, dark);
    if (f === 0) { b.put(roundBox(1.16, .2, .26, .05, 1), wx, wy - .68, fz + .16, '#a8683a'); for (let q = 0; q < 4; q++) { b.put(DOT, wx - .4 + q * .27, wy - .5, fz + .2, ['#ff6aa8', '#ffd23f', '#ff8a3c', '#ffffff'][(q + i) % 4], .1); b.put(DOT, wx - .27 + q * .2, wy - .56, fz + .14, '#3fae5a', [.12, .07, .1]); } } }
  // some houses fly a little flag, some have a round attic lamp
  if (i % 3 === 0) { b.put(geo.cyl(6), x, ry + rh + .55, z, '#f2f4fa', [.035, 1.1, .035]); b.put(roundBox(.6, .36, .04, .02, 1), x + .32, ry + rh + .9, z, dc); }
}
/** the row of Toy Town houses: ONE mesh for all of them */
export function toyHouses(list) {
  const b = makeBatch(); list.forEach(([x, z, w, h, d, wall, roof], i) => toyHouse(b, x, z, w, h, d, wall, roof, i));
  const m = b.mesh(shinyMat()); m.material = WALL(); m.castShadow = true; m.name = 'toyhouses'; return m;
}
let WALL_M = null; const WALL = () => WALL_M || (WALL_M = Object.assign(shinyMat().clone(), { roughness: .55, metalness: 0 })); // (the same shader as the other painted things: only two numbers differ)

/**
 * A sea that moves. w × d metres, the shore along its near edge. Returns { mesh, update(t) }.
 * Waves are worked out for about a thousand points each frame (a fraction of a millisecond), only while you are near.
 */
let SEA_M = null, RIPPLE_SRC = null;
// (overhaul) a seamless fine-ripple normal map, generated once: the vertex waves are large and slow, this adds the
// small moving ripples that catch the sun and make the surface read as real water up close. Shared canvas, cloned
// per sea so each can scroll at its own speed.
function rippleSource() {
  if (RIPPLE_SRC) return RIPPLE_SRC;
  const N = 128, h = new Float32Array(N * N), TAU = Math.PI * 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N * TAU, v = y / N * TAU;
    h[y * N + x] = Math.sin(u * 3 + Math.sin(v * 2) * .7) * .5 + Math.sin(v * 4 + Math.cos(u * 3) * .5) * .32 + Math.sin((u + v) * 6) * .14 + Math.sin((u * 2 - v) * 9) * .06;
  }
  const c = document.createElement('canvas'); c.width = c.height = N; const g2 = c.getContext('2d'), img = g2.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h[((y + N) % N) * N + ((x + 1 + N) % N)] - h[((y + N) % N) * N + ((x - 1 + N) % N)], dy = h[((y + 1 + N) % N) * N + ((x + N) % N)] - h[((y - 1 + N) % N) * N + ((x + N) % N)], l = Math.hypot(dx * 2.6, dy * 2.6, 1), k = (y * N + x) * 4;
    img.data[k] = (-dx * 2.6 / l * .5 + .5) * 255; img.data[k + 1] = (dy * 2.6 / l * .5 + .5) * 255; img.data[k + 2] = (1 / l * .5 + .5) * 255; img.data[k + 3] = 255;
  }
  g2.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  RIPPLE_SRC = t; return t;
}

export function makeSea(w, d, nx = 56, nz = 16) {
  const g = new THREE.PlaneGeometry(w, d, nx, nz); g.rotateX(-Math.PI / 2); // (overhaul) keep UVs: the ripple normal map needs them
  const p = g.attributes.position, n = g.attributes.normal, cols = new Float32Array(p.count * 3), amp = new Float32Array(p.count), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const k = 1 - (p.getZ(i) + d / 2) / d; // 0 at the shore … 1 far out
    c.set('#8fe6f2').lerp(col('#3fa9e8'), sstep(0, .22, k)).lerp(col('#1f6fd6'), sstep(.25, 1, k)); c.lerp(col('#ffffff'), sstep(.035, 0, k) * .7); c.multiplyScalar(.92 + noise2(p.getX(i) * .15, p.getZ(i) * .3) * .16);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; amp[i] = .03 + sstep(0, .5, k) * .13; }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  SEA_M = SEA_M || Object.assign(shinyMat().clone(), { roughness: .1, metalness: .2 });
  // (overhaul) per-sea material: fine scrolling ripples, stronger sky reflection, sharper highlight
  const mat = SEA_M.clone(); const ripple = rippleSource().clone(); ripple.needsUpdate = true;
  ripple.wrapS = ripple.wrapT = THREE.RepeatWrapping; ripple.repeat.set(Math.max(2, w / 7), Math.max(2, d / 7));
  mat.normalMap = ripple; mat.normalScale = new THREE.Vector2(.55, .55);
  mat.envMapIntensity = 1.35; mat.roughness = .07; mat.metalness = .28;
  const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true; mesh.userData.dynamic = true;
  const pa = p.array, na = n.array;
  return { mesh, update(t) {
    ripple.offset.set(t * .05, t * .037); // the fine ripples drift across the big waves
    for (let i = 0, k = 0; i < p.count; i++, k += 3) { const x = pa[k], z = pa[k + 2], a = amp[i], p1 = x * .34 + t * 1.1, p2 = x * .12 - z * .4 + t * .7, p3 = z * .8 + t * 1.6;
      pa[k + 1] = a * (Math.sin(p1) * .5 + Math.sin(p2) * .5 + Math.sin(p3) * .3);
      const dx = a * (Math.cos(p1) * .17 + Math.cos(p2) * .06), dz = a * (Math.cos(p2) * -.2 + Math.cos(p3) * .24), l = 1 / Math.sqrt(dx * dx * 9 + 1 + dz * dz * 9); // (slopes exaggerated 3x, so the glints show from far)
      na[k] = -dx * 3 * l; na[k + 1] = l; na[k + 2] = -dz * 3 * l; }
    p.needsUpdate = true; n.needsUpdate = true; } };
}

// ---------- (build 54) the climbing stacks: real crates, hay bales and boulders instead of plain blocks ----------
// Every list entry is [x, yBottom, z, w, h, d]: the same boxes as before, so the steps you stand on have not moved.
const finish = (b, name, rough) => { const m = b.mesh(shinyMat()); m.material = MAT(rough); m.castShadow = true; m.name = name; return m; };
const MATS = {}; const MAT = r => MATS[r] || (MATS[r] = Object.assign(shinyMat().clone(), { roughness: r, metalness: 0 }));
/** wooden crates: planks with grooves, a frame round each face and a diagonal brace on the front */
export function crates(list) {
  const b = makeBatch();
  for (const [x, y, z, w, h, d] of list) { const cy = y + h / 2, fz = z + d / 2;
    b.put(roundBox(w, h, d, .05, 1), x, cy, z, (px, py, pz, nx, ny, nz, o) => { const plank = Math.abs(nz) > .5 || Math.abs(nx) > .5 ? ((py - y) * 4) % 1 : ((px - x + 50) * 4) % 1, groove = plank < .09 ? .62 : 1; o.set('#c8925a').multiplyScalar(groove * (.86 + noise2(px * 1.3, py * 9 + pz * 9) * .22)); });
    for (const sy of [-1, 1]) b.put(roundBox(w + .08, .16, d + .08, .04, 1), x, cy + sy * (h / 2 - .08), z, '#9c6a3c');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.put(roundBox(.16, h, .16, .04, 1), x + sx * (w / 2 - .06), cy, z + sz * (d / 2 - .06), '#9c6a3c');
    b.put(BOX, x, cy, fz + .02, '#a87444', [Math.hypot(w - .3, h - .3), .13, .05], [0, 0, Math.atan2(h - .3, w - .3)]);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) b.put(DOT, x + sx * (w / 2 - .08), cy + sy * (h / 2 - .08), fz + .06, '#5a5f6e', .035); }
  return finish(b, 'crates', .7);
}
/** hay bales: rounded golden blocks streaked like straw, tied with two cords, with loose straw sticking out */
export function hayBales(list) {
  const b = makeBatch();
  list.forEach(([x, y, z, w, h, d], i) => { const cy = y + h / 2;
    b.put(roundBox(w, h, d, .2, 2), x, cy, z, (px, py, pz, nx, ny, nz, o) => { const s = noise2(px * 1.2 + i, py * 14 + pz * 11); o.set('#e2b84a').lerp(col('#f6dc86'), s).multiplyScalar(.84 + .2 * Math.max(0, ny)); });
    for (const sx of [-.28, .28]) { for (const [ry, rz, sw, sh, sd] of [[h / 2 + .005, 0, .07, .03, d + .02], [-h / 2 - .005, 0, .07, .03, d + .02], [0, d / 2 + .005, .07, h + .02, .03], [0, -d / 2 - .005, .07, h + .02, .03]]) b.put(BOX, x + sx * w, cy + ry, z + rz, '#8a5a2a', [sw, sh, sd]); }
    for (let k = 0; k < 7; k++) { const a = k * 2.4 + i, sx = (k % 2 ? 1 : -1) * (w / 2 + .02), yy = y + .15 + (k * .37 % 1) * (h - .3), zz = z + (((k * .61) % 1) - .5) * (d - .3); b.put(BOX, x + sx, yy, zz, k % 2 ? '#f6dc86' : '#d9aa3c', [.3, .025, .025], [0, Math.sin(a) * .6, Math.cos(a) * .5]); } });
  return finish(b, 'hay', .85);
}
/** boulders to climb: lumpy rock sides, a flat mossy top exactly where you stand */
export function boulders(list) {
  const b = makeBatch();
  list.forEach(([x, y, z, w, h, d], i) => { const g = roundBox(w, h, d, Math.min(.42, h * .45), 3), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const px = p.getX(k), py = p.getY(k), pz = p.getZ(k), side = sstep(h / 2 - .02, h / 2 - .5, py), n = noise2(px * 1.6 + i * 7 + pz, py * 1.6 + pz * 1.3) - .5; p.setXYZ(k, px * (1 + n * .22 * side) + (py < 0 ? px * .08 : 0), py, pz * (1 + n * .26 * side)); }
    g.computeVertexNormals();
    b.put(g, x, y + h / 2, z, (px, py, pz, nx, ny, nz, o) => { const n = noise2(px * 2.2 + pz, py * 2.2 + pz * 2); o.set('#8f877c').lerp(col('#b9b0a2'), n).multiplyScalar(.8 + .25 * Math.max(0, ny)); o.lerp(col('#7fb85a'), sstep(.75, .98, ny) * sstep(.35, .7, noise2(px * 1.3, pz * 1.3 + 4)) * .8); if (Math.abs(((py * 1.7 + n) % 1) - .5) < .03 && ny < .5) o.multiplyScalar(.8); }); });
  return finish(b, 'boulders', .9);
}
