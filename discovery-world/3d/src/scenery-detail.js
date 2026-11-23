// ===================================================================
// scenery-detail.js (graphics overhaul, stage 2+3): extra real geometry for the busiest areas,
// built the same cheap way the planets are — instanced meshes and merged geometry, so a few
// hundred new objects cost a handful of draw calls.
//
//   Playhouse:    a woven play rug, bunting across the ceiling, hanging paper lanterns.
//   Park:         wildflower drifts, sculpted boulders, lamp posts along the path.
//   Castle:       formal parterre beds with roses, stone urns flanking the walk.
//   Dino Valley:  ferns, a mossy fallen log with mushrooms, boulders and footprints.
//
// Everything here is ADDITIVE and sits away from the walking lane (decorations go behind the
// path or in the near foreground). No collision entries are added, so movement, platforms,
// rides and saved progress are untouched. `?nodetail` turns all of it off for A/B measuring.
// ===================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { leafNormal, leafDetail, leafTexture } from './nature.js';

const C = new THREE.Color();

/**
 * (stage 8) A broad leaf with real form instead of a flat card: the blade is lofted through
 * rows of vertices so it arches up from the stalk, droops at the tip, cups along its edges and
 * carries a raised midrib. Vertex colours darken the base and brighten the tip, and the UVs let
 * the leaf normal map show veins. ~60 triangles per leaf, still instanced.
 */
export function broadLeafGeometry({ len = .46, wid = .3, rise = .2, droop = .1, cup = .05, rib = .022, seg = 8, across = 6, colA = '#5f9a52', colB = '#a7e29e' } = {}) {
  const pos = [], idx = [], uvs = [], cols = [];
  const a = new THREE.Color(colA), b = new THREE.Color(colB), c = new THREE.Color();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const w = wid * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .1)), .7) * (1 - .16 * u);
    const y0 = rise * Math.sin(u * Math.PI * .9) - droop * u * u;
    for (let j = 0; j <= across; j++) {
      const v = (j / across) * 2 - 1;
      // the blade cups up at its edges; the midrib stands proud along the centre line
      const y = y0 + cup * v * v * (1 - u * .45) + rib * Math.pow(1 - Math.abs(v), 2.2) * (1 - u * .3);
      pos.push(v * w, y, u * len);
      uvs.push(j / across, u);
      c.copy(a).lerp(b, u * .9).multiplyScalar(.86 + .2 * u);
      cols.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < across; j++) {
    const p = i * (across + 1) + j, q = p + 1, r = p + across + 1, s = r + 1;
    idx.push(p, r, q, q, r, s);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

function tinted(geo, hex) {
  const g = geo.clone();
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** merge indexed and non-indexed pieces (lathes are non-indexed) into one geometry */
function mergeMixed(parts) {
  if (!parts.length) return null;
  const nonIndexed = parts.some(g => !g.index);
  const made = [];
  const list = nonIndexed ? parts.map(g => { if (!g.index) return g; const n = g.toNonIndexed(); made.push(n); return n; }) : parts;
  let one = null;
  try { one = mergeGeometries(list, false); } catch (e) { one = null; }
  made.forEach(g => g.dispose()); parts.forEach(g => g.dispose());
  return one;
}

/** merge a list of geometries into one, disposing the pieces (null if they cannot merge) */
function mergeParts(parts) {
  if (!parts.length) return null;
  let one = null;
  try { one = mergeGeometries(parts, false); } catch (e) { one = null; }
  parts.forEach(g => g.dispose());
  return one;
}

/** play mat texture: soft concentric woven rings */
function rugTexture() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#ffd9ec'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9; i++) {
    g.beginPath(); g.arc(S / 2, S / 2, 118 - i * 12, 0, Math.PI * 2);
    g.strokeStyle = ['#ff9fd2', '#ffd84a', '#9fe6ff', '#c9a6ff'][i % 4]; g.lineWidth = 6; g.stroke();
  }
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(120,60,110,${.02 + (i % 4) * .012})`; g.fillRect((i * 71) % S, (i * 43) % S, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function buildPlayhouseDetail({ scene, add, rnd }) {
  const group = new THREE.Group(); group.name = 'playhouse-detail'; add(group);
  const r = rnd || Math.random;
  const box2 = (list, hex, w, h, d, x, y, z, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cyl2 = (list, hex, ra, rb, h, x, y, z, seg = 8) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };

  // --- the rug, flat on the floor in front of the ball pit (no collision, no shadow cast)
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.3, 56), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: .96, metalness: 0 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(12, .016, 5.55); rug.receiveShadow = true; group.add(rug); // (stage 6: clear of the train line at z 3.2)

  // --- bunting: 72 little flags on a sagging line across the ceiling
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute([-.13, 0, 0, .13, 0, 0, 0, -.26, 0], 3));
  flagGeo.setIndex([0, 1, 2]); flagGeo.computeVertexNormals();
  const flags = new THREE.InstancedMesh(flagGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .8, metalness: 0 }), 72);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < 72; i++) {
    const x = -17 + i * .92, sag = Math.sin((i / 71) * Math.PI * 3) * .18;
    m4.makeRotationZ(Math.sin(i * 1.7) * .06).setPosition(x, 7.35 + sag, -3.35);
    flags.setMatrixAt(i, m4);
    flags.setColorAt(i, col.set(['#ff9fd2', '#ffd84a', '#9fe6ff', '#c9a6ff', '#8ef2b0'][i % 5]));
  }
  flags.castShadow = false; group.add(flags);

  // --- three paper lanterns hanging from the ceiling
  const lanternGeo = new THREE.SphereGeometry(.42, 18, 12);
  const glyphs = [['#ffd9ec', '#ff5fa8'], ['#e8f6ff', '#57b7ff'], ['#fff4d6', '#ffb02e']];
  const cords = [];
  glyphs.forEach(([base, emit], i) => {
    const x = 3 + i * 8.5, y = 6.55, z = -3.9;
    const g = lanternGeo.clone(); g.scale(1, .82, 1);
    const lantern = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: base, emissive: emit, emissiveIntensity: .55, roughness: .62 }));
    lantern.position.set(x, y, z); group.add(lantern);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .9, 5), new THREE.MeshStandardMaterial({ color: '#8a6b55', roughness: .9 }));
    cord.position.set(x, y + .9, z); group.add(cord); cords.push(cord);
  });

  // --- soft play mats and a low toy shelf along the back wall (one merged mesh, no collision)
  const softParts = [];
  for (const [mx, mz, w, d, col] of [[-2.5, -2.2, 2.2, 1.5, '#9fe6ff'], [1.2, -2.4, 1.8, 1.4, '#ffd1ec'], [3.6, -3.0, 1.6, 1.6, '#fff3a6']]) {
    const mat = new THREE.BoxGeometry(w, .1, d); mat.translate(mx, .05, mz);
    softParts.push(tinted(mat, col)); mat.dispose();
  }
  const shelf = new THREE.BoxGeometry(4.4, .12, .5); shelf.translate(-9, .75, -4.35);
  const shelfBase = new THREE.BoxGeometry(4.4, .1, .5); shelfBase.translate(-9, .05, -4.35);
  softParts.push(tinted(shelf, '#c98a52'), tinted(shelfBase, '#b8723f')); shelf.dispose(); shelfBase.dispose();
  for (const sx of [-10.9, -9, -7.1]) { const post = new THREE.BoxGeometry(.14, 1.5, .5); post.translate(sx, .75, -4.35); softParts.push(tinted(post, '#a96f3e')); post.dispose(); }
  for (let i = 0; i < 14; i++) { const bk = new THREE.BoxGeometry(.18, .34 + (i % 3) * .05, .3); bk.translate(-10.7 + i * .27, .95, -4.4); softParts.push(tinted(bk, ['#ff5f8f', '#ffd23f', '#4fa8ff', '#57c97a', '#b07cff'][i % 5])); bk.dispose(); }
  const soft = new THREE.Mesh(mergeParts(softParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 }));
  soft.castShadow = true; soft.receiveShadow = true; group.add(soft);

  // --- (stage 18) a little stage in the back corner: rail, pleated curtains, valance and footlights
  const stageParts = [], lightParts = [], glowParts = [];
  const SX = -13.6, SZ = -3.55;
  for (let i = 0; i < 5; i++) box2(stageParts, '#8a2a4a', .34, 2.2, .18, SX - 3.0 + i * .38, 1.1, SZ + .06);   // left curtain
  for (let i = 0; i < 5; i++) box2(stageParts, '#8a2a4a', .34, 2.2, .18, SX + 1.5 + i * .38, 1.1, SZ + .06);   // right curtain
  box2(stageParts, '#bfe6ff', 3.0, 2.1, .1, SX - .4, 1.05, SZ - .18);                                          // backdrop in the gap
  box2(stageParts, '#b0395f', 6.6, .34, .3, SX + 1.5, 2.3, SZ + .06);                                          // valance
  box2(stageParts, '#d8c39a', 6.9, .1, .12, SX + 1.5, 2.52, SZ + .02);                                         // rail
  box2(stageParts, '#7a5a3c', 6.6, .14, 2.2, SX + 1.5, .07, SZ - .55);                                         // low platform
  for (let i = 0; i < 6; i++) {
    const x = SX - 1.1 + i * .62;
    cyl2(lightParts, '#5b4a3d', .07, .09, .18, x, .16, SZ + 1.15, 7);
    const b = new THREE.SphereGeometry(.1, 10, 8); b.translate(x, .3, SZ + 1.15); glowParts.push(tinted(b, '#ffd98a')); b.dispose();
  }

  // --- (stage 18) prop chest and a cushioned reading nook with a low book box
  const nookParts = [];
  box2(nookParts, '#8a5a2a', 1.5, .8, .9, 29.5, .4, -2.6);
  box2(nookParts, '#c9a24a', 1.56, .1, .96, 29.5, .84, -2.6);
  box2(nookParts, '#ffd23f', .18, .22, .1, 29.5, .52, -2.14);
  box2(nookParts, '#7fd8a0', 2.6, .28, 1.7, 33.5, .2, -2.5);                    // nook base
  box2(nookParts, '#9fe6ff', 2.3, .22, 1.4, 33.5, .44, -2.5);                    // cushion
  for (const [px, pz, col] of [[32.6, -2.1, '#ffb3dc'], [34.3, -2.2, '#ffe28a'], [33.5, -3.1, '#c9a6ff']]) box2(nookParts, col, .7, .34, .5, px, .62, pz, .2);
  box2(nookParts, '#c98a52', 1.4, .7, .5, 36.0, .35, -2.4);
  for (let i = 0; i < 4; i++) box2(nookParts, ['#ff5f8f', '#ffd23f', '#4fa8ff', '#57c97a'][i], .2, .26, .28, 35.55 + i * .26, .84, -2.4);

  // --- (stage 18) two lower lanterns over the new corners
  [[SX - .4, 3.1, SZ + .3], [33.5, 3.1, -2.2]].forEach(([lx, ly, lz], i) => {
    const g2 = new THREE.SphereGeometry(.34, 16, 10); g2.scale(1, .82, 1);
    const m2 = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ color: i ? '#fff4d6' : '#ffd9ec', emissive: i ? '#ffb02e' : '#ff5fa8', emissiveIntensity: .5, roughness: .6 }));
    m2.position.set(lx, ly, lz); group.add(m2);
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 3.3, 5), new THREE.MeshStandardMaterial({ color: '#8a6b55', roughness: .9 }));
    c2.position.set(lx, ly + 1.72, lz); group.add(c2);
  });

  const stageMesh = new THREE.Mesh(mergeParts(stageParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82, side: THREE.DoubleSide })); stageMesh.castShadow = true; group.add(stageMesh);
  const lights = new THREE.Mesh(mergeParts(lightParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5 })); group.add(lights);
  const glow = new THREE.Mesh(mergeParts(glowParts), new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#ffc85a', emissiveIntensity: .9, roughness: .35 })); group.add(glow);
  const nook = new THREE.Mesh(mergeParts(nookParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88 })); nook.castShadow = nook.receiveShadow = true; group.add(nook);

  return { group, added: { flags: 72, lanterns: glyphs.length + 2, cords: cords.length, mats: 3, books: 18, curtains: 18, footlights: 6, nook: 1, chest: 1 } };
}

export function buildParkDetail({ scene, add, terrainH, rnd }) {
  const group = new THREE.Group(); group.name = 'park-detail'; add(group);
  let seed = 1234567;
  const rr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  // --- wildflower drifts: stems are one instanced mesh, flower heads another (per-instance colour).
  const COUNT = 190;
  const stemGeo = new THREE.CylinderGeometry(.012, .018, .42, 5, 1); stemGeo.translate(0, .21, 0);
  const headParts = [];
  for (let p = 0; p < 5; p++) {
    const petal = new THREE.SphereGeometry(.055, 6, 4);
    const a = (p / 5) * Math.PI * 2;
    petal.scale(1.5, .5, 1); petal.translate(Math.cos(a) * .07, .43, Math.sin(a) * .07);
    headParts.push(petal);
  }
  const mid = new THREE.SphereGeometry(.032, 6, 4); mid.translate(0, .445, 0); headParts.push(mid);
  const headGeo = headParts.length === 1 ? headParts[0] : mergeParts(headParts);
  const stems = new THREE.InstancedMesh(stemGeo, new THREE.MeshStandardMaterial({ color: '#4f9f45', roughness: .85 }), COUNT);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: .65, metalness: 0, emissive: '#221100', emissiveIntensity: .08 }), COUNT);
  const palette = ['#ff5fa8', '#ffd23f', '#ffffff', '#b98bff', '#ff9a5a'];
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  let placed = 0;
  for (let guard = 0; guard < 3000 && placed < COUNT; guard++) {
    const x = 138 + rr() * 168;
    const z = rr() < .62 ? -(5.2 + rr() * 3.4) : (4.4 + rr() * 3.2); // behind the path, or in the near foreground
    const s = .8 + rr() * .8;
    pos.set(x, terrainH(x, z), z); q.setFromAxisAngle(up, rr() * 6.28); scl.set(s, s * (1 + rr() * .4), s);
    mtx.compose(pos, q, scl);
    stems.setMatrixAt(placed, mtx); heads.setMatrixAt(placed, mtx);
    heads.setColorAt(placed, C.set(palette[placed % palette.length]));
    placed++;
  }
  stems.castShadow = false; stems.receiveShadow = true; heads.castShadow = false;
  group.add(stems, heads);

  // --- three sculpted boulder clusters behind the path (merged into ONE mesh)
  const rockParts = [];
  const clusters = [[166, -7.6, 1.5], [228, -8.2, 1.9], [288, -7.4, 1.3]];
  for (let ci = 0; ci < clusters.length; ci++) {
    const [cx, cz, cs] = clusters[ci];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.SphereGeometry(.55 + rr() * .35, 14, 10);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const n = Math.sin(p.getX(i) * 6 + ci) * .06 + Math.sin(p.getY(i) * 5 + k) * .05 + Math.sin(p.getZ(i) * 7) * .04;
        const k2 = 1 + n; p.setXYZ(i, p.getX(i) * k2 * 1.25, Math.max(-.12, p.getY(i)) * k2, p.getZ(i) * k2);
      }
      g.computeVertexNormals();
      g.scale(cs, cs * .8, cs);
      g.translate(cx + (k - 1) * 1.1 * cs, terrainH(cx, cz) + .16 * cs, cz + (k % 2) * .7);
      rockParts.push(tinted(g, ['#9a958c', '#8a8478', '#a8a397'][k % 3]));
      g.dispose();
    }
  }
  const rocks = new THREE.Mesh(mergeParts(rockParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0 }));
  rocks.castShadow = true; rocks.receiveShadow = true; rocks.userData.grounded = true; // seated boulders: half buried on purpose
  group.add(rocks);

  // --- lamp posts along the path (merged posts + instanced glowing globes)
  const postParts = [], globeSpots = [];
  for (let i = 0; i < 6; i++) {
    const x = 150 + i * 28, z = i % 2 ? 5.15 : -2.9; // (stage 6: never inside the train corridor)
    const base = new THREE.CylinderGeometry(.16, .22, .24, 10); base.translate(x, terrainH(x, z) + .12, z);
    const pole = new THREE.CylinderGeometry(.055, .07, 2.25, 8); pole.translate(x, terrainH(x, z) + 1.25, z);
    postParts.push(tinted(base, '#4a4f60'), tinted(pole, '#565c70'));
    globeSpots.push([x, terrainH(x, z) + 2.5, z]);
    base.dispose(); pole.dispose();
  }
  const posts = new THREE.Mesh(mergeParts(postParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, metalness: .35 }));
  posts.castShadow = true; group.add(posts);

  const globeGeo = new THREE.SphereGeometry(.19, 12, 9);
  const globes = new THREE.InstancedMesh(globeGeo, new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#ffcf6a', emissiveIntensity: .9, roughness: .4 }), globeSpots.length);
  globeSpots.forEach(([x, y, z], i) => { mtx.makeTranslation(x, y, z); globes.setMatrixAt(i, mtx); });
  group.add(globes);

  return { group, added: { flowers: placed, boulderClusters: clusters.length, lamps: globeSpots.length } };
}

export function buildCastleDetail({ scene, add, cx = 407, rnd }) {
  const group = new THREE.Group(); group.name = 'castle-detail'; add(group);
  let seed = 987654;
  const rr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scl = new THREE.Vector3();

  // --- two formal parterre beds in the near foreground: gravel plate, trimmed hedge border,
  //     a rose bush and five blooms in each.
  const beds = [[cx - 4.4, 6.1, 3.0, 2.2], [cx + 4.4, 6.1, 3.0, 2.2]]; // (stage 6: beyond the train line)
  const gravelParts = [], hedgeParts = [];
  for (const [bx, bz, w, d] of beds) {
    const soil = new THREE.BoxGeometry(w, .1, d); soil.translate(bx, .05, bz); gravelParts.push(tinted(soil, '#e8dcc4')); soil.dispose();
    for (const [ox, oz, hw, hd] of [[0, -d / 2, w, .26], [0, d / 2, w, .26], [-w / 2, 0, .26, d], [w / 2, 0, .26, d]]) {
      const hedge = new THREE.BoxGeometry(hw, .38, hd); hedge.translate(bx + ox, .19, bz + oz); hedgeParts.push(tinted(hedge, '#4f8f4a')); hedge.dispose();
    }
  }
  group.add(new THREE.Mesh(mergeParts(gravelParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })));
  const hedges = new THREE.Mesh(mergeParts(hedgeParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, sheen: .3 }));
  hedges.castShadow = true; hedges.receiveShadow = true; group.add(hedges);

  // --- rose bushes (green mound) and blooms (per-instance colour) filling both beds
  const bushGeo = new THREE.SphereGeometry(.22, 10, 7); bushGeo.scale(1.25, .85, 1.25);
  const bloomGeo = new THREE.SphereGeometry(.075, 8, 6); bloomGeo.scale(1.15, .8, 1.15);
  const bushSpots = [], bloomSpots = [];
  for (const [bx, bz, w, d] of beds) {
    for (let i = 0; i < 12; i++) {
      const px = bx + (rr() - .5) * (w - .7), pz = bz + (rr() - .5) * (d - .7);
      bushSpots.push([px, .3, pz, .8 + rr() * .5]);
      for (let k = 0; k < 3; k++) bloomSpots.push([px + (rr() - .5) * .3, .46 + rr() * .12, pz + (rr() - .5) * .3]);
    }
  }
  const bushes = new THREE.InstancedMesh(bushGeo, new THREE.MeshStandardMaterial({ color: '#3f7f3f', roughness: .85 }), bushSpots.length);
  bushSpots.forEach(([x, y, z, s], i) => { pos.set(x, y, z); scl.set(s, s, s); mtx.compose(pos, q, scl); bushes.setMatrixAt(i, mtx); });
  bushes.castShadow = true; bushes.receiveShadow = true; group.add(bushes);
  const blooms = new THREE.InstancedMesh(bloomGeo, new THREE.MeshStandardMaterial({ roughness: .6 }), bloomSpots.length);
  const roseCols = ['#ff4f8a', '#ff9fd2', '#ffe6f2', '#ffd23f'];
  bloomSpots.forEach(([x, y, z], i) => { mtx.makeTranslation(x, y, z); blooms.setMatrixAt(i, mtx); blooms.setColorAt(i, C.set(roseCols[i % roseCols.length])); });
  blooms.castShadow = false; group.add(blooms);

  // --- four stone urns flanking the walk, each with a little flowering top
  const urnParts = [], urnTops = [];
  for (const ux of [cx - 8.2, cx - 2.4, cx + 2.4, cx + 8.2]) {
    const uz = 1.9; // (stage 6: before the rails)
    const foot = new THREE.CylinderGeometry(.18, .24, .16, 12); foot.translate(ux, .08, uz);
    const bowl = new THREE.CylinderGeometry(.34, .2, .34, 14); bowl.translate(ux, .33, uz);
    const rim = new THREE.TorusGeometry(.34, .045, 8, 16); rim.rotateX(Math.PI / 2); rim.translate(ux, .5, uz);
    urnParts.push(tinted(foot, '#cfc6b8'), tinted(bowl, '#ded5c6'), tinted(rim, '#e8e0d2'));
    foot.dispose(); bowl.dispose(); rim.dispose();
    urnTops.push([ux, .58, uz]);
  }
  const urns = new THREE.Mesh(mergeParts(urnParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 }));
  urns.castShadow = true; urns.receiveShadow = true; group.add(urns);
  const urnFlowers = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 10, 7), new THREE.MeshStandardMaterial({ roughness: .7 }), urnTops.length * 4);
  let fi = 0;
  for (const [ux, uy, uz] of urnTops) for (let k = 0; k < 4; k++) {
    mtx.makeTranslation(ux + (k - 1.5) * .11, uy + .12 + (k % 2) * .06, uz + (k % 2 ? .06 : -.06));
    urnFlowers.setMatrixAt(fi, mtx); urnFlowers.setColorAt(fi, C.set(['#ff6fae', '#ffd23f', '#a98bff', '#ffffff'][k]));
    fi++;
  }
  group.add(urnFlowers);

  // --- a string of warm lanterns along the castle front (instanced, one draw call)
  const lanternSpots = [];
  for (let i = 0; i < 11; i++) lanternSpots.push([cx - 10 + i * 2, 3.4 + Math.sin(i / 10 * Math.PI) * .55, -3.55]);
  const lanterns = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffc94a', emissiveIntensity: 1.0, roughness: .5 }), lanternSpots.length);
  lanternSpots.forEach(([x, y, z], i) => { mtx.makeTranslation(x, y, z); lanterns.setMatrixAt(i, mtx); });
  lanterns.castShadow = false; group.add(lanterns);

  return { group, added: { parterres: beds.length, roseBushes: bushSpots.length, blooms: bloomSpots.length, urns: urnTops.length, lanterns: lanternSpots.length } };
}

export function buildDinoDetail({ scene, add, dx = 378, rnd }) {
  const group = new THREE.Group(); group.name = 'dino-detail'; add(group);
  let seed = 24681357;
  const rr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scl = new THREE.Vector3();

  // --- lush broad-leaf plants: two rings of big, arching leaves on short stems (reads as jungle, not
  //     conifers). (stage 8) each leaf is now a lofted, cupped blade with a midrib and a drooping tip,
  //     not a flat painted circle, and the material carries the vein normal map so the surface catches light.
  const leafParts = [];
  const greens = [['#4f8f45', '#a7e29e'], ['#57994d', '#b4e8aa'], ['#478a40', '#98d994']];
  for (let ring = 0; ring < 2; ring++) {
    const count = ring ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2 + ring * .6;
      const len = .52 - ring * .09;
      const [colA, colB] = greens[(i + ring) % 3];
      const leaf = broadLeafGeometry({ len, wid: .31 - ring * .04, rise: .24, droop: .13, cup: .055, rib: .024, seg: 6, across: 4, colA, colB });
      leaf.rotateX(-1.06 - ring * .12);  // rise from the soil, then arch over
      leaf.rotateY(a);
      leaf.translate(0, .14 + ring * .2, .04);
      leafParts.push(leaf);
    }
  }
  for (const [sx, sz, tilt] of [[.12, .04, -.18], [-.1, -.06, .16]]) {
    const stem = new THREE.CylinderGeometry(.035, .075, .42, 6); stem.rotateZ(tilt); stem.rotateX(tilt * .6); stem.translate(sx, .21, sz);
    leafParts.push(tinted(stem, '#5f9a52')); stem.dispose();
  }
  const crown = new THREE.SphereGeometry(.12, 8, 6); crown.scale(1.3, .55, 1.3); crown.translate(0, .06, 0);
  leafParts.push(tinted(crown, '#4f8f45')); crown.dispose();
  const frondGeo = mergeParts(leafParts);
  const frondMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .62, metalness: 0, side: THREE.DoubleSide, normalMap: leafNormal(), normalScale: new THREE.Vector2(.75, .75) });
  const fernSpots = [];
  for (let i = 0; i < 95; i++) {
    const x = dx - 20 + rr() * 36;
    const z = rr() < .62 ? -(5.0 + rr() * 3.2) : (4.85 + rr() * 2.1); // (stage 6: foreground ferns moved off the rails)
    if (Math.abs(x - 363.4) < 2.2 && z < 0) continue; // keep the egg nest clear
    fernSpots.push([x, z, .8 + rr() * .9, rr() * 6.28]);
  }
  const ferns = new THREE.InstancedMesh(frondGeo, frondMat, fernSpots.length);
  fernSpots.forEach(([x, z, s, a], i) => {
    pos.set(x, 0, z); q.setFromAxisAngle(up, a); scl.set(s, s, s);
    mtx.compose(pos, q, scl); ferns.setMatrixAt(i, mtx);
  });
  ferns.castShadow = false; ferns.receiveShadow = true; group.add(ferns);

  // --- mossy boulders, merged into one mesh
  const rockParts = [];
  for (const [cx, cz, cs] of [[368, -6.8, 1.5], [386, -7.2, 1.2], [359, 4.6, 1.1]]) {
    for (let k = 0; k < 3; k++) {
      const g = new THREE.SphereGeometry(.5 + rr() * .3, 12, 8);
      g.scale(cs, cs * .78, cs);
      g.translate(cx + (k - 1) * .9 * cs, .2 * cs, cz + (k % 2) * .6);
      rockParts.push(tinted(g, ['#8f9a86', '#7f8a76', '#9aa593'][k % 3]));
      g.dispose();
    }
  }
  const rocks = new THREE.Mesh(mergeParts(rockParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }));
  rocks.castShadow = true; rocks.receiveShadow = true; rocks.userData.grounded = true;
  group.add(rocks);

  // --- a fallen log with moss and mushrooms, behind the path
  const logParts = [];
  const log = new THREE.CylinderGeometry(.32, .38, 3.4, 12); log.rotateZ(Math.PI / 2); log.translate(dx - 6.5, .38, -7.0);
  logParts.push(tinted(log, '#8a6242')); log.dispose();
  for (let k = 0; k < 5; k++) {
    const moss = new THREE.SphereGeometry(.24, 10, 6); moss.scale(1.4, .35, 1.1);
    moss.translate(dx - 8 + k * .8, .56 + (k % 2) * .05, -7.0 + (k % 2 ? .12 : -.1));
    logParts.push(tinted(moss, '#5f9a52')); moss.dispose();
  }
  const fallen = new THREE.Mesh(mergeParts(logParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }));
  fallen.castShadow = true; fallen.receiveShadow = true; fallen.userData.grounded = true;
  group.add(fallen);
  const mushroomGeo = new THREE.ConeGeometry(.1, .16, 10);
  const mushrooms = new THREE.InstancedMesh(mushroomGeo, new THREE.MeshStandardMaterial({ color: '#ff8f6a', roughness: .7 }), 6);
  for (let i = 0; i < 6; i++) { mtx.makeTranslation(dx - 7.7 + i * .6, .58, -7.0 + (i % 2 ? .35 : -.32)); mushrooms.setMatrixAt(i, mtx); }
  mushrooms.castShadow = false; group.add(mushrooms);

  // --- a trail of three-toed footprints along the near edge of the path
  const printGeo = new THREE.CircleGeometry(.2, 10); printGeo.rotateX(-Math.PI / 2); printGeo.scale(1, 1, .7);
  const prints = new THREE.InstancedMesh(printGeo, new THREE.MeshStandardMaterial({ color: '#6f9c6a', roughness: 1 }), 8);
  for (let i = 0; i < 8; i++) {
    mtx.makeTranslation(dx - 9 + i * 1.3, .012, 1.95 + (i % 2 ? .16 : -.1));
    mtx.multiply(new THREE.Matrix4().makeRotationY(i % 2 ? .3 : -.3));
    prints.setMatrixAt(i, mtx);
  }
  prints.receiveShadow = true; group.add(prints);

  return { group, added: { ferns: fernSpots.length, boulders: rockParts.length, mushrooms: 6, footprints: 8 } };
}

/** a cylinder between two points (used for the velvet ropes) */
function barBetween(ax, ay, az, bx, by, bz, r, hex, radial = 6) {
  const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
  const len = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(.5);
  const g = new THREE.CylinderGeometry(r, r, len, radial);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  g.translate(mid.x, mid.y, mid.z);
  return tinted(g, hex);
}

export function buildCastleInteriorDetail({ add, ox = 2000 }) {
  const group = new THREE.Group(); group.name = 'castle-interior-detail'; group.position.set(ox, 0, 0); add(group);
  let seed = 11235813;
  const rr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scl = new THREE.Vector3();

  // --- velvet ropes lining the carpet aisle: gold posts, sagging red rope (2 merged meshes)
  const postParts = [], ropeParts = [];
  const POST_X = [3.2, 6.4, 9.6, 12.8, 16];
  for (const z of [-1.55, 1.55]) {
    for (const x of POST_X) {
      const base = new THREE.CylinderGeometry(.14, .19, .12, 10); base.translate(x, .06, z);
      const post = new THREE.CylinderGeometry(.045, .055, .92, 8); post.translate(x, .56, z);
      const knob = new THREE.SphereGeometry(.1, 12, 9); knob.translate(x, 1.06, z);
      postParts.push(tinted(base, '#c9a24a'), tinted(post, '#e0bb62'), tinted(knob, '#f2d488'));
      base.dispose(); post.dispose(); knob.dispose();
    }
    for (let i = 0; i < POST_X.length - 1; i++) {
      const x0 = POST_X[i], x1 = POST_X[i + 1], y0 = .98, sag = .26;
      const N = 4;
      for (let s = 0; s < N; s++) {
        const u0 = s / N, u1 = (s + 1) / N;
        const y = u => y0 - Math.sin(u * Math.PI) * sag;
        ropeParts.push(barBetween(x0 + (x1 - x0) * u0, y(u0), z, x0 + (x1 - x0) * u1, y(u1), z, .035, '#c8325f', 6));
      }
    }
  }
  const posts = new THREE.Mesh(mergeParts(postParts), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .65, roughness: .3 }));
  posts.castShadow = true; group.add(posts);
  const ropes = new THREE.Mesh(mergeParts(ropeParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, sheen: .6 }));
  group.add(ropes);

  // --- potted palms beside the back wall (one merged mesh: terracotta pot + fronds + trunk)
  const palmParts = [];
  for (const [px, pz] of [[2.6, -4.25], [10.9, -4.25], [16.5, -4.25], [22.2, -4.25]]) {
    const pot = new THREE.CylinderGeometry(.26, .2, .52, 14); pot.translate(px, .26, pz);
    const lip = new THREE.TorusGeometry(.26, .045, 8, 18); lip.rotateX(Math.PI / 2); lip.translate(px, .52, pz);
    const trunk = new THREE.CylinderGeometry(.055, .075, .55, 8); trunk.translate(px, .8, pz);
    palmParts.push(tinted(pot, '#c97a52'), tinted(lip, '#b86743'), tinted(trunk, '#7a5a3a'));
    pot.dispose(); lip.dispose(); trunk.dispose();
    for (let f = 0; f < 7; f++) {
      const a = f / 7 * Math.PI * 2 + rr() * .2;
      const blade = new THREE.PlaneGeometry(.13, .78, 1, 2);
      blade.translate(0, .39, 0);
      blade.rotateX(-.75 - rr() * .25);
      blade.rotateY(a);
      blade.translate(px, 1.06, pz);
      palmParts.push(tinted(blade, f % 2 ? '#3f8f4a' : '#4f9f5a'));
      blade.dispose();
    }
  }
  const palms = new THREE.Mesh(mergeParts(palmParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, side: THREE.DoubleSide }));
  palms.castShadow = true; palms.receiveShadow = true; group.add(palms);

  // --- four velvet banners with gold rails, hung above the stained glass
  const bannerParts = [];
  for (const [bx, col] of [[3.4, '#b02a5a'], [9.1, '#7a3fb0'], [14.9, '#2a6fb0'], [20.2, '#b02a5a']]) {
    const rail = new THREE.CylinderGeometry(.045, .045, 1.1, 8); rail.rotateZ(Math.PI / 2); rail.translate(bx, 8.75, -5.5);
    const cloth = new THREE.PlaneGeometry(.9, 2.1, 4, 6);
    const cp = cloth.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setZ(i, Math.sin((x / .9 + .5) * Math.PI) * .06 + Math.sin((y / 2.1 + .5) * Math.PI * 2) * .03); }
    cloth.computeVertexNormals(); cloth.translate(bx, 7.7, -5.5);
    const crest = new THREE.CircleGeometry(.16, 18); crest.translate(bx, 8.05, -5.44);
    bannerParts.push(tinted(rail, '#e0bb62'), tinted(cloth, col), tinted(crest, '#f2d488'));
    rail.dispose(); cloth.dispose(); crest.dispose();
  }
  const banners = new THREE.Mesh(mergeParts(bannerParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, side: THREE.DoubleSide }));
  group.add(banners);

  // --- a pile of wrapped party gifts behind the cake (one merged mesh, ribbons included)
  const giftParts = [];
  const giftCols = ['#ff5f9a', '#5fb8ff', '#ffd23f', '#7fd6a0', '#b28cff', '#ff9a5a'];
  for (let i = 0; i < 6; i++) {
    const w = .28 + rr() * .26, h = .24 + rr() * .22, d = .28 + rr() * .22;
    const gx = 7.4 + (i % 3) * .62 + rr() * .1, gz = -4.05 + Math.floor(i / 3) * .5 + rr() * .06;
    const box = new THREE.BoxGeometry(w, h, d); box.translate(gx, h / 2, gz);
    const rib1 = new THREE.BoxGeometry(.05, h + .01, d + .01); rib1.translate(gx, h / 2, gz);
    const rib2 = new THREE.BoxGeometry(w + .01, h + .01, .05); rib2.translate(gx, h / 2, gz);
    const bow = new THREE.SphereGeometry(.07, 10, 7); bow.scale(1.4, .5, 1.1); bow.translate(gx, h + .03, gz);
    giftParts.push(tinted(box, giftCols[i % giftCols.length]), tinted(rib1, '#fff6cf'), tinted(rib2, '#fff6cf'), tinted(bow, '#fff6cf'));
    box.dispose(); rib1.dispose(); rib2.dispose(); bow.dispose();
  }
  const gifts = new THREE.Mesh(mergeParts(giftParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 }));
  gifts.castShadow = true; gifts.receiveShadow = true; group.add(gifts);

  // --- candle clusters on the throne steps (instanced flames, one draw call)
  const flameSpots = [];
  for (const [cx, cz] of [[17.9, -4.25], [21.1, -4.25], [17.9, -2.35], [21.1, -2.35]]) {
    for (let i = 0; i < 3; i++) flameSpots.push([cx + (i - 1) * .16 + rr() * .05, .42 + .18 * (i % 2), cz + (i % 2 ? .08 : -.05)]);
  }
  const flames = new THREE.InstancedMesh(new THREE.SphereGeometry(.055, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf6a' }), flameSpots.length);
  flameSpots.forEach(([x, y, z], i) => { pos.set(x, y, z); scl.set(1, 1.7, 1); mtx.compose(pos, q, scl); flames.setMatrixAt(i, mtx); });
  group.add(flames);

  return { group, added: { ropePosts: POST_X.length * 2, palms: 4, banners: 4, gifts: 6, candles: flameSpots.length } };
}

export function buildToyTownDetail({ add }) {
  const group = new THREE.Group(); group.name = 'toytown-detail'; add(group);
  let seed = 51505150;
  const rr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  const toyCols = ['#ff5f8f', '#ffd23f', '#4fa8ff', '#57c97a', '#b07cff', '#ff9a3f'];

  // --- an overturned toy box behind the path, spilling alphabet blocks (one merged mesh)
  const crateParts = [];
  const BX = 600, BZ = -5.4;
  const bottom = new THREE.BoxGeometry(1.9, .12, 1.3); bottom.translate(BX, .06, BZ);
  crateParts.push(tinted(bottom, '#c98a52'));
  bottom.dispose();
  for (const [ox, oz, w, d] of [[0, -.64, 1.9, .1], [0, .64, 1.9, .1], [-.94, 0, .1, 1.3], [.94, 0, .1, 1.3]]) {
    const side = new THREE.BoxGeometry(w, .78, d); side.translate(BX + ox, .45, BZ + oz);
    crateParts.push(tinted(side, '#b8723f')); side.dispose();
  }
  for (let i = 0; i < 8; i++) {
    const s = .34 + rr() * .2;
    const x = BX + 1.15 + (i % 4) * .55 + rr() * .12;
    const z = BZ + .55 - Math.floor(i / 4) * .7 + rr() * .15;
    const rot = (rr() - .5) * .5;
    const block = new THREE.BoxGeometry(s, s, s);
    block.rotateY(rot); block.rotateZ((rr() - .5) * .15); block.translate(x, s / 2, z);
    crateParts.push(tinted(block, toyCols[i % toyCols.length])); block.dispose();
    const band = new THREE.BoxGeometry(s + .005, s * .18, s + .005);
    band.rotateY(rot); band.translate(x, s / 2, z);
    crateParts.push(tinted(band, '#fff6df')); band.dispose();
  }
  const crate = new THREE.Mesh(mergeParts(crateParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75 }));
  crate.castShadow = true; crate.receiveShadow = true; group.add(crate);

  // --- giant toy balls along the near edge of the path (one instanced mesh, per-instance colour)
  const ballSpots = [];
  for (const x of [562, 574, 589, 604, 626, 641, 655]) ballSpots.push([x, .42 + rr() * .28, 5.75 + rr() * .55]); // (stage 6: the balls sat across the rails at z 3.2)
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ roughness: .28, metalness: 0, clearcoat: 1 }), ballSpots.length);
  ballSpots.forEach(([x, r, z], i) => { pos.set(x, r, z); scl.set(r, r, r); mtx.compose(pos, q, scl); balls.setMatrixAt(i, mtx); balls.setColorAt(i, C.set(toyCols[i % toyCols.length])); });
  balls.castShadow = true; balls.receiveShadow = true; group.add(balls);

  // --- spinning tops (one merged mesh: base disc, body, stem and knob for each)
  const topParts = [];
  for (const [x, z] of [[570, 5.9], [596, 6.0], [618, 5.8], [648, 5.9]]) {
    const base = new THREE.CylinderGeometry(.34, .38, .1, 18); base.translate(x, .05, z);
    const body = new THREE.ConeGeometry(.4, .62, 18); body.rotateX(Math.PI); body.translate(x, .41, z);
    const stem = new THREE.CylinderGeometry(.035, .045, .3, 8); stem.translate(x, .82, z);
    const knob = new THREE.SphereGeometry(.07, 10, 8); knob.translate(x, .99, z);
    topParts.push(tinted(base, '#ffd23f'), tinted(body, '#4fa8ff'), tinted(stem, '#ffffff'), tinted(knob, '#ff5f8f'));
    base.dispose(); body.dispose(); stem.dispose(); knob.dispose();
  }
  const tops = new THREE.Mesh(mergeParts(topParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .1 }));
  tops.castShadow = true; tops.receiveShadow = true; group.add(tops);

  return { group, added: { blocks: 8, balls: ballSpots.length, tops: 4 } };
}

// ===================================================================
// (stage 9) LAB GARDENS: the three greenhouses were bare glass half-spheres
// floating on the lawn, and the garden had no beds at all. Now each dome sits
// on a real drum wall with a door, a threshold and hoop ribs; raised planter
// beds (stone kerb, sunken soil, sprouting rows) fill the gaps between them and
// line the inside of every dome; a picket fence edges the beds; and a potting
// bench carries lathed glassware, a flask, a test-tube rack, a microscope and a
// copper supply pipe with elbows and a valve. Everything static is merged into
// four meshes (paint, glass, copper, leaves/blooms instanced), so the whole
// district gains four draw calls.
// ===================================================================
export function buildLabGardenDetail({ add }) {
  const group = new THREE.Group(); group.name = 'labgarden-detail'; add(group);
  const painted = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 });
  const glassM = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .05, metalness: 0, transparent: true, opacity: .34, clearcoat: 1, side: THREE.DoubleSide });
  const metalM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35, metalness: .55 });

  const DOMES = [682, 724, 766], DZ = -11, R = 5, DRUM = .92;
  const wallParts = [], glassParts = [], pipeParts = [];
  const leafSpots = [], bloomSpots = [];
  const BLOOMS = ['#ff8fc8', '#ffd23f', '#a98bff', '#ff6f6f', '#7fd8ff'];
  const addBox = (parts, hex, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); parts.push(tinted(g, hex)); g.dispose(); };
  const addCyl = (parts, hex, ra, rb, h, x, y, z, seg = 12, rot) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); if (rot) { g.rotateX(rot[0] || 0); g.rotateZ(rot[2] || 0); } g.translate(x, y, z); parts.push(tinted(g, hex)); g.dispose(); };
  const addBeam = (parts, hex, a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const g = new THREE.CylinderGeometry(r, r, len, 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    parts.push(tinted(g, hex)); g.dispose();
  };

  // ---- raised planter bed: stone kerb with real depth, soil sunk 9 cm below the rim, sprouting rows
  function bed(cx, cz, w, d, { top = .42, kerb = '#e2d8c9', rows = 2, tall = false } = {}) {
    addBox(wallParts, kerb, w + .26, top, .18, cx, top / 2, cz - d / 2);
    addBox(wallParts, kerb, w + .26, top, .18, cx, top / 2, cz + d / 2);
    addBox(wallParts, kerb, .18, top, d, cx - w / 2, top / 2, cz);
    addBox(wallParts, kerb, .18, top, d, cx + w / 2, top / 2, cz);
    addBox(wallParts, '#6b4a34', w, top - .09, d, cx, (top - .09) / 2, cz);
    // two soil ridges, so the bed reads as dug earth rather than a brown slab
    for (const oz of [-d * .22, d * .22]) addCyl(wallParts, '#7d5941', d * .09, d * .09, w - .3, cx, top - .02, cz + oz, 8, [0, 0, Math.PI / 2]);
    const per = tall ? Math.max(3, Math.round(w / .72)) : Math.max(3, Math.round(w / .5));
    for (let i = 0; i < per; i++) for (let r = 0; r < rows; r++) {
      const x = cx - w / 2 + .34 + (i + .5) * ((w - .68) / per), z = cz + (rows === 1 ? 0 : (r ? 1 : -1) * d * .21);
      leafSpots.push({ x, y: top - .03, z, s: tall ? 2.3 : 1, rot: (i * 2.4 + r * 1.1) % 6.283, tilt: (i % 3 - 1) * .12, col: i % 3 === 0 ? '#8fd47a' : i % 3 === 1 ? '#6dbb63' : '#a7e29e' });
      if ((i + r) % 2 === 0) bloomSpots.push({ x: x + .07, y: top + (tall ? .34 : .2), z: z + .04, col: BLOOMS[(i + r * 3) % BLOOMS.length] });
    }
  }

  // ---- greenhouses: drum wall with a door gap facing the path, threshold, door posts and lintel, hoop ribs
  const GAP = .34;
  for (const cx of DOMES) {
    const drum = new THREE.CylinderGeometry(R * .976, R * 1.004, DRUM, 48, 1, true, Math.PI / 2 + GAP / 2, Math.PI * 2 - GAP);
    drum.translate(cx, DRUM / 2, DZ); wallParts.push(tinted(drum, '#f6f8f4')); drum.dispose();
    // a stone footing course, slightly proud, so the wall does not grow out of the grass
    addCyl(wallParts, '#d8d2c6', R * 1.02, R * 1.05, .16, cx, .08, DZ, 44);
    // the door: an arched frame with a panelled leaf, a little round window and a brass handle, standing
    // just in front of the drum's opening (never through the glass: this spot is outside the dome)
    const pz = DZ + R + .07, px = .8;
    for (const s of [-1, 1]) addBox(wallParts, '#8fae94', .13, 1.82, .16, cx + s * px, .91, pz);
    { const arch = new THREE.TorusGeometry(px + .06, .075, 5, 20, Math.PI); arch.translate(cx, 1.82, pz); wallParts.push(tinted(arch, '#7fae8b')); arch.dispose(); }
    addBox(wallParts, '#31423a', px * 2 - .02, 1.76, .07, cx, .9, pz - .02);
    for (const oy of [-.42, 0, .42]) addBox(wallParts, '#3d5349', px * 2 - .26, .05, .03, cx, .9 + oy, pz + .02);
    { const win = new THREE.CylinderGeometry(.2, .2, .04, 16); win.rotateX(Math.PI / 2); win.translate(cx, 1.42, pz + .04); wallParts.push(tinted(win, '#bfe9f2')); win.dispose(); }
    addCyl(wallParts, '#ffd23f', .045, .045, .12, cx + px - .18, .92, pz + .06, 8, [Math.PI / 2, 0, 0]);
    addBox(wallParts, '#cfc6b7', px * 2 + .5, .1, .72, cx, .05, pz + .3);
    // ribs over the glass, a tie ring at the springing line and a brass finial
    for (let k = 0; k < 6; k++) {
      const arc = new THREE.TorusGeometry(R * 1.006, .045, 4, 22, Math.PI);
      arc.scale(1, .8, 1); arc.rotateY(k / 6 * Math.PI); arc.translate(cx, DRUM, DZ);
      wallParts.push(tinted(arc, '#7fae8b')); arc.dispose();
    }
    { const ring = new THREE.TorusGeometry(R * 1.006, .05, 4, 40); ring.rotateX(Math.PI / 2); ring.translate(cx, DRUM, DZ); wallParts.push(tinted(ring, '#8fae94')); ring.dispose(); }
    addCyl(wallParts, '#ffd23f', .1, .13, .16, cx, DRUM + R * .8 * 1.006 + .1, DZ, 10);
    // two long beds inside, visible through the glass above the drum wall
    bed(cx, DZ - 1.7, 6.4, 1.15, { top: 1.02, kerb: '#d8cdbb', tall: true });
    bed(cx, DZ + 2.1, 6.4, 1.15, { top: 1.02, kerb: '#d8cdbb', tall: true });
  }

  // ---- beds between the greenhouses (the gaps the domes leave along the back lawn)
  bed(703, -8.3, 5.6, 2.1);
  bed(712.4, -8.3, 5.2, 2.1, { kerb: '#e6dccd' });
  bed(745, -8.3, 6.2, 2.1);
  bed(699, -12.6, 3.4, 1.9, { kerb: '#e6dccd' });
  bed(749, -12.6, 3.4, 1.9);

  // ---- picket fence edging the beds (posts, two rails, pickets)
  function fence(x0, x1, z, hex = '#fffaf0') {
    for (let x = x0; x <= x1 + .01; x += 1.24) addBox(wallParts, hex, .1, .72, .1, x, .36, z);
    addBox(wallParts, hex, x1 - x0, .07, .06, (x0 + x1) / 2, .5, z);
    addBox(wallParts, hex, x1 - x0, .07, .06, (x0 + x1) / 2, .24, z);
    for (let x = x0 + .16; x < x1; x += .3) addBox(wallParts, hex, .055, .46, .035, x, .38, z);
  }
  fence(696.6, 709.4, -7.05);
  fence(710.6, 722.6, -7.05);
  fence(738.4, 751.6, -7.05);

  // ---- potting bench with real glassware, a flask, a test-tube rack, a microscope and a copper pipe
  const BX = 776.6, BZ = -3.2, TOP = .95;
  addBox(wallParts, '#c98a52', 2.7, .1, 1.0, BX, TOP, BZ);
  addBox(wallParts, '#b8723f', 2.5, .06, .82, BX, .38, BZ);
  for (const ox of [-1.18, 1.18]) for (const oz of [-.4, .4]) addBox(wallParts, '#a8642f', .09, .9, .09, BX + ox, .47, BZ + oz);
  // beakers: a lathe with a real wall, a lip and a pouring spout, plus coloured liquid inside
  const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const beaker = (x, r, h, hex) => {
    const g = lathe([[0, .02], [r * .92, .02], [r, .05], [r, h], [r * 1.08, h + .03], [r * .98, h + .035], [r * .9, h], [r * .9, .07], [0, .07]]);
    g.translate(x, TOP + .05, BZ - .12); glassParts.push(tinted(g, '#e8fbff')); g.dispose();
    const l = lathe([[0, .02], [r * .82, .02], [r * .82, h * .62], [0, h * .62]], 12);
    l.translate(x, TOP + .06, BZ - .12); wallParts.push(tinted(l, hex)); l.dispose();
  };
  beaker(BX - .92, .19, .36, '#ff8fc8');
  beaker(BX - .46, .14, .27, '#7fd8ff');
  { // conical flask
    const g = lathe([[0, .02], [.21, .02], [.085, .28], [.06, .34], [.075, .37], [0, .37]], 16);
    g.translate(BX + .02, TOP + .05, BZ - .1); glassParts.push(tinted(g, '#e8fbff')); g.dispose();
    const l = lathe([[0, .03], [.17, .03], [.075, .16], [0, .16]], 12);
    l.translate(BX + .02, TOP + .06, BZ - .1); wallParts.push(tinted(l, '#ffd23f')); l.dispose();
  }
  // test-tube rack: five tubes in a wooden block, each with its own colour
  { const rx = BX + .62, rz = BZ + .12; addBox(wallParts, '#a8642f', .62, .07, .2, rx, TOP + .09, rz);
    addBox(wallParts, '#c98a52', .64, .05, .22, rx, TOP + .3, rz);
    ['#ff8fc8', '#7fd8ff', '#ffd23f', '#a98bff', '#8fd47a'].forEach((hex, i) => {
      const tx = rx - .24 + i * .12;
      const g = new THREE.CylinderGeometry(.035, .035, .3, 10, 1, true); g.translate(tx, TOP + .27, rz); glassParts.push(tinted(g, '#e8fbff')); g.dispose();
      const l = new THREE.CylinderGeometry(.027, .027, .16, 8); l.translate(tx, TOP + .2, rz); wallParts.push(tinted(l, hex)); l.dispose();
    }); }
  // microscope: foot, arm, angled tube and eyepiece
  { const mx = BX + 1.02, mz = BZ - .18;
    addCyl(wallParts, '#5d6a7e', .16, .19, .08, mx, TOP + .07, mz, 16);
    addBox(wallParts, '#5d6a7e', .1, .42, .1, mx - .09, TOP + .27, mz);
    addBox(wallParts, '#7c8aa0', .12, .06, .3, mx - .01, TOP + .47, mz);
    { const tube = new THREE.CylinderGeometry(.055, .07, .34, 12); tube.rotateZ(.42); tube.translate(mx + .12, TOP + .58, mz); wallParts.push(tinted(tube, '#9aa8bd')); tube.dispose(); }
    addCyl(wallParts, '#2f3b4d', .05, .05, .07, mx + .19, TOP + .74, mz, 10);
    addCyl(wallParts, '#e8fbff', .06, .06, .03, mx + .04, TOP + .43, mz, 12); }
  // copper supply pipe: down the bench end, along the ground and up beside the last greenhouse, with elbows and a valve
  const PX = BX + 1.44;
  addBeam(pipeParts, '#c98a5a', [PX, TOP - .02, BZ + .3], [PX, .34, BZ + .3], .045);
  addBeam(pipeParts, '#c98a5a', [PX, .34, BZ + .3], [PX, .34, -5.6], .045);
  addBeam(pipeParts, '#c98a5a', [PX, .34, -5.6], [771.6, .34, -5.6], .045);
  addBeam(pipeParts, '#c98a5a', [771.6, .34, -5.6], [771.6, 1.4, -5.6], .045);
  addBeam(pipeParts, '#c98a5a', [771.6, 1.4, -5.6], [769.6, 1.7, -6.2], .045);
  for (const [x, y, z] of [[PX, .34, -5.6], [771.6, .34, -5.6], [771.6, 1.4, -5.6]]) addCyl(pipeParts, '#b8763f', .075, .075, .105, x, y, z, 10, [0, 0, 0]);
  // pipe stands, so the run reads as plumbing and not as a bar floating over the lawn
  for (const x of [774.2, 772.8]) addCyl(pipeParts, '#8a8f98', .032, .038, .34, x, .17, -5.6, 8);
  for (const z of [-4.2, -2.4]) addCyl(pipeParts, '#8a8f98', .032, .038, .34, PX, .17, z, 8);
  addCyl(pipeParts, '#8a8f98', .09, .11, .05, 771.6, .025, -5.6, 10);
  { const vx = BX + 1.44, vy = .78, vz = BZ - .55; addCyl(pipeParts, '#b8763f', .1, .1, .09, vx, vy, vz, 10, [Math.PI / 2, 0, 0]);
    const wheel = new THREE.TorusGeometry(.16, .028, 6, 18); wheel.rotateY(Math.PI / 2); wheel.translate(vx, vy, vz); pipeParts.push(tinted(wheel, '#ffd23f')); wheel.dispose();
    for (let i = 0; i < 3; i++) { const sp = new THREE.BoxGeometry(.02, .3, .022); sp.rotateX(i * Math.PI / 3); sp.translate(vx, vy, vz); pipeParts.push(tinted(sp, '#ffd23f')); sp.dispose(); } }

  const wall = new THREE.Mesh(mergeMixed(wallParts), painted);
  wall.castShadow = wall.receiveShadow = true; group.add(wall);
  const glass = new THREE.Mesh(mergeMixed(glassParts), glassM);
  glass.castShadow = false; glass.receiveShadow = false; glass.renderOrder = 2; group.add(glass);
  const copper = new THREE.Mesh(mergeMixed(pipeParts), metalM);
  copper.castShadow = true; copper.receiveShadow = true; group.add(copper);

  // ---- sprouting leaves and blooms: two instanced meshes for every bed in the district
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const leafGeo = broadLeafGeometry({ len: .27, wid: .16, rise: .12, droop: .04, cup: .04, rib: .014, seg: 4, across: 3 });
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .68, side: THREE.DoubleSide }), leafSpots.length * 3);
  let li = 0;
  for (const sp of leafSpots) for (let k = 0; k < 3; k++) {
    eu.set(-.34 + sp.tilt, sp.rot + k * 2.09, 0); q.setFromEuler(eu);
    v.set(sp.x, sp.y, sp.z); s.setScalar(sp.s); mtx.compose(v, q, s);
    leaves.setMatrixAt(li, mtx); leaves.setColorAt(li, C.set(sp.col)); li++;
  }
  leaves.castShadow = true; leaves.receiveShadow = true; group.add(leaves);
  const blooms = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.075, 0), new THREE.MeshStandardMaterial({ roughness: .42, clearcoat: .5 }), bloomSpots.length);
  bloomSpots.forEach((b, i) => { q.setFromEuler(eu.set(0, i * 1.7, 0)); v.set(b.x, b.y, b.z); s.setScalar(.8 + (i % 3) * .14); mtx.compose(v, q, s); blooms.setMatrixAt(i, mtx); blooms.setColorAt(i, C.set(b.col)); });
  blooms.castShadow = true; group.add(blooms);

  return { group, added: { domes: DOMES.length, beds: 5 + DOMES.length * 2, leaves: li, blooms: bloomSpots.length } };
}

// ===================================================================
// (stage 10) Art Plaza: the district was a flat chequered floor with its
// props standing in a row. This turns it into a gallery yard — paint-
// splattered paving underfoot, stone planters with flowers in the gaps
// between the activities, easels showing wet paintings, a rack of drying
// canvases, a jar of brushes and paint pots, and bunting strung between
// two poles above the props. Static pieces merge into two meshes (painted
// wood/stone, fabric), the flowers are two instanced meshes, and each
// painting is one small textured plane, so the whole yard costs about
// eight draw calls.
// ===================================================================
export function buildArtPlazaDetail({ add }) {
  const group = new THREE.Group(); group.name = 'artplaza-detail'; add(group);
  const painted = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .66 });
  const fabricM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .94, side: THREE.DoubleSide });
  const parts = [], fabric = [], leafSpots = [], bloomSpots = [];
  const ART = ['#ff8fc8', '#ffd23f', '#7fd8ff', '#a98bff', '#8fd47a', '#ff8f6f'];
  const box = (list, hex, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 12, rot) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); if (rot) { g.rotateX(rot[0] || 0); g.rotateZ(rot[2] || 0); } g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const beam = (list, hex, a, b, r = .045) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const g = new THREE.CylinderGeometry(r, r, len, 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    list.push(tinted(g, hex)); g.dispose();
  };

  // ---- paint-splattered paving: one soft decal in the open lane in front of the props
  const splat = (() => {
    const W = 1024, H = 192, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.clearRect(0, 0, W, H);
    for (let i = 0; i < 96; i++) {
      const x = 20 + ((i * 197) % (W - 40)), y = 22 + ((i * 61) % (H - 44));
      const rx = 6 + (i * 37 % 26), ry = rx * (.5 + (i % 5) * .09);
      g.fillStyle = ART[i % ART.length]; g.globalAlpha = .78 + (i % 3) * .07;
      g.beginPath(); g.ellipse(x, y, rx, ry, i * 1.7, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + Math.cos(i + k * 2.1) * rx * (1.3 + k * .3), y + Math.sin(i + k * 2.1) * ry * (1.5 + k * .3), 2 + (i + k) % 4, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  { const m = new THREE.MeshStandardMaterial({ map: splat, transparent: true, roughness: .9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    m.userData.own = true; const p = new THREE.Mesh(new THREE.PlaneGeometry(46, 2.0), m); p.rotation.x = -Math.PI / 2; p.position.set(848, .016, -.55); p.renderOrder = 1; p.receiveShadow = false; group.add(p); }

  // ---- a stone planter with real soil and a little planting
  const planter = (cx, cz, r = .62, h = .5) => {
    cyl(parts, '#e6dccd', r, r * 1.07, h, cx, h / 2, cz, 10);
    cyl(parts, '#f6f1e6', r * 1.02, r * 1.02, .08, cx, h + .01, cz, 10);
    cyl(parts, '#5b4230', r * .82, r * .82, .05, cx, h - .02, cz, 10);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05, rr = r * .46 * (i % 3 === 0 ? .35 : 1);
      leafSpots.push({ x: cx + Math.cos(a) * rr, y: h + .02, z: cz + Math.sin(a) * rr, s: .8, rot: a, tilt: (i % 3) * .1, col: i % 2 ? '#6dbb63' : '#8fd47a' });
      bloomSpots.push({ x: cx + Math.cos(a) * rr * .85, y: h + .24 + (i % 2) * .08, z: cz + Math.sin(a) * rr * .85, col: ART[i % ART.length] });
    }
  };
  planter(813.4, -3.0);
  planter(823.6, -3.7, .54, .46);
  planter(868.0, -2.5, .6, .52);
  planter(883.6, -3.35, .56, .48);

  // ---- paintings: a childlike abstract, painted procedurally, one texture each
  const paintingTexture = seed => {
    const S = 192, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.fillStyle = '#fffaf2'; g.fillRect(0, 0, S, S);
    g.fillStyle = ART[seed % ART.length] + '33'; g.fillRect(0, S * .64, S, S * .36);
    for (let i = 0; i < 7; i++) {
      const a = (i * 2.3 + seed) % 6.283, r = 26 + ((i * 31 + seed * 17) % 44);
      g.fillStyle = ART[(i + seed) % ART.length]; g.globalAlpha = .9;
      g.beginPath(); g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r * .8, 12 + (i * 7 + seed) % 15, 0, 7); g.fill();
    }
    g.globalAlpha = 1; g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(5, 5, S - 10, S - 10);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  const artMats = [0, 1, 2, 3].map(i => { const m = new THREE.MeshStandardMaterial({ map: paintingTexture(i), roughness: .78 }); m.userData.own = true; return m; });
  const painting = (cx, cy, cz, w, h, ry, mat, tilt = -.16) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(cx, cy, cz); m.rotation.set(tilt, ry, 0); m.castShadow = m.receiveShadow = true; group.add(m);
    return m;
  };

  // ---- an easel: two splayed front legs, a back leg, a ledge and a painting resting on it
  const easel = (cx, cz, ry, mat) => {
    const cs = Math.cos(ry), sn = Math.sin(ry), at = (x, z) => [cx + x * cs - z * sn, cz + x * sn + z * cs];
    for (const s of [-1, 1]) { const [ax, az] = at(s * .52, .34), [bx, bz] = at(s * .12, -.06); beam(parts, '#b9814a', [ax, .0, az], [bx, 1.58, bz], .045); }
    { const [ax, az] = at(0, .62), [bx, bz] = at(0, -.06); beam(parts, '#a9743f', [ax, .0, az], [bx, 1.5, bz], .042); }
    { const [ax, az] = at(-.56, .28), [bx, bz] = at(.56, .28); beam(parts, '#c98a52', [ax, .72, az], [bx, .72, bz], .05); }
    painting(cx, 1.2, cz, .94, 1.0, ry, mat, -.2);
  };
  easel(827.0, -4.45, .1, artMats[0]);
  easel(884.4, -4.55, -.12, artMats[1]);

  // ---- a drying rack: two posts, a rail, three small canvases pegged along it
  {
    const RX = 866.2, RZ = -4.45;
    for (const s of [-1, 1]) { box(parts, '#b9814a', .09, 1.6, .09, RX + s * 1.05, .8, RZ); box(parts, '#a9743f', .34, .07, .3, RX + s * 1.05, .035, RZ); }
    box(parts, '#c98a52', 2.28, .08, .08, RX, 1.56, RZ);
    for (let i = 0; i < 3; i++) {
      const px = RX - .68 + i * .68;
      box(parts, '#f6f1e6', .05, .13, .05, px, 1.47, RZ + .01);
      painting(px, 1.16, RZ + .03, .52, .46, 0, artMats[(i + 2) % 4], -.02);
    }
  }

  // ---- paint pots and a brush jar at the edge of the open lane
  {
    const PZ = -1.05;
    ['#ff8fc8', '#ffd23f', '#7fd8ff', '#a98bff'].forEach((hex, i) => {
      const px = 830.6 + i * .3; cyl(parts, '#ffffff', .11, .1, .2, px, .1, PZ, 10); cyl(parts, hex, .095, .095, .04, px, .2, PZ, 10);
      cyl(parts, '#c98a52', .018, .02, .34, px + .02, .27, PZ - .12, 6, [.2, 0, .1]);
    });
    cyl(parts, '#bfe9f2', .17, .15, .3, 833.1, .15, PZ, 12);
    for (let i = 0; i < 4; i++) beam(parts, ['#ff8fc8', '#ffd23f', '#7fd8ff', '#a98bff'][i], [832.98 + i * .07, .24, PZ], [833.06 + i * .1, .62, PZ - .06], .022);
  }

  // ---- bunting: two poles and a sagging line of flags above the props, clear of every tap target
  {
    const X0 = 811.6, X1 = 893.4, PZ = -4.15, TOP = 3.55;
    for (const x of [X0, X1]) { cyl(parts, '#f6f1e6', .06, .08, TOP, x, TOP / 2, PZ, 8); cyl(parts, '#ffd23f', .1, .1, .1, x, TOP + .02, PZ, 10); }
    const N = 26, flags = 14;
    let prev = [X0, TOP - .08, PZ];
    for (let i = 1; i <= flags; i++) { const u = i / flags, x = X0 + (X1 - X0) * u, y = TOP - .08 - Math.sin(u * Math.PI) * .42;
      beam(parts, '#7a6a58', prev, [x, y, PZ], .012); prev = [x, y, PZ]; }
    for (let i = 0; i < N; i++) {
      const u = (i + .5) / N, x = X0 + (X1 - X0) * u, y = TOP - .08 - Math.sin(u * Math.PI) * .42;
      const g = new THREE.BufferGeometry(); const w = .42;
      g.setAttribute('position', new THREE.Float32BufferAttribute([x - w, y, PZ, x + w, y, PZ, x, y - .62, PZ], 3));
      g.setIndex([0, 1, 2]); g.computeVertexNormals(); fabric.push(tinted(g, ART[i % ART.length])); g.dispose();
    }
  }

  const wood = new THREE.Mesh(mergeMixed(parts), painted); wood.castShadow = wood.receiveShadow = true; group.add(wood);
  const flags = new THREE.Mesh(mergeMixed(fabric), fabricM); flags.castShadow = true; group.add(flags);

  // ---- the flowers: two instanced meshes for every planter
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const leafGeo = broadLeafGeometry({ len: .26, wid: .15, rise: .11, droop: .04, cup: .04, rib: .014, seg: 4, across: 3 });
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .68, side: THREE.DoubleSide }), leafSpots.length * 3);
  let li = 0;
  for (const sp of leafSpots) for (let k = 0; k < 3; k++) {
    q.setFromEuler(eu.set(-.34 + sp.tilt, sp.rot + k * 2.09, 0)); v.set(sp.x, sp.y, sp.z); s.setScalar(sp.s);
    mtx.compose(v, q, s); leaves.setMatrixAt(li, mtx); leaves.setColorAt(li, C.set(sp.col)); li++;
  }
  leaves.castShadow = true; leaves.receiveShadow = true; group.add(leaves);
  const blooms = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.085, 0), new THREE.MeshStandardMaterial({ roughness: .42, clearcoat: .5 }), bloomSpots.length);
  bloomSpots.forEach((b, i) => { q.setFromEuler(eu.set(0, i * 1.7, 0)); v.set(b.x, b.y, b.z); s.setScalar(.85 + (i % 3) * .15); mtx.compose(v, q, s); blooms.setMatrixAt(i, mtx); blooms.setColorAt(i, C.set(b.col)); });
  blooms.castShadow = true; group.add(blooms);

  return { group, added: { planters: 4, easels: 2, paintings: 5, flags: 26, leaves: li, blooms: bloomSpots.length } };
}

// ===================================================================
// (stage 11) Sunny Seaside: the beach was flat sand with its activities in a
// row. This adds the things a beach has — five striped parasols with towels
// and beach balls, a band of dune grass along the back of the sand that stops
// clear of the lighthouse and the pier, and a piece of driftwood.
// Static wood, fabric, balls and grass are merged or instanced: four draw
// calls for the whole shoreline, no collision entries.
// ===================================================================
export function buildSeasideDetail({ add }) {
  const group = new THREE.Group(); group.name = 'seaside-detail'; add(group);
  const painted = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 });
  const fabricM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .93, side: THREE.DoubleSide });
  const ballM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .32, clearcoat: .6 });
  const woodParts = [], fabricParts = [], ballParts = [], grassSpots = [];
  const UMB = ['#ff8fc8', '#ffd23f', '#7fd8ff', '#a98bff', '#8fd47a'];
  const TOWEL = ['#ff9a7a', '#9fe6ff', '#ffe28a', '#ffb3dc', '#b6f0c0'];
  const box = (list, hex, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 10, rot) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); if (rot) { g.rotateX(rot[0] || 0); g.rotateZ(rot[2] || 0); } g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const beam = (list, hex, a, b, r = .05) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const g = new THREE.CylinderGeometry(r, r, len, 7);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    list.push(tinted(g, hex)); g.dispose();
  };

  // ---- a striped parasol, its towel and a ball: the beach furniture, spread along the sand
  const PARASOLS = [[-26, -4.2], [-43, -4.6], [-79, -4.4], [-106, -4.8], [-143, -4.5]];
  PARASOLS.forEach(([x, z], i) => {
    cyl(woodParts, '#f6f1e6', .045, .06, 2.35, x, 1.17, z, 8);
    cyl(woodParts, '#c98a52', .12, .12, .06, x, .03, z, 8);
    // canopy: a real cone of twelve panels, alternating its own colour and cream
    const canopy = new THREE.ConeGeometry(1.45, .64, 12, 1, true);
    const pos = canopy.attributes.position, cols = new Float32Array(pos.count * 3), cA = new THREE.Color(UMB[i % UMB.length]), cB = new THREE.Color('#fffaf0');
    for (let k = 0; k < pos.count; k++) {
      const a = Math.atan2(pos.getZ(k), pos.getX(k));
      const panel = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12);
      const c = panel % 2 ? cA : cB;
      cols[k * 3] = c.r; cols[k * 3 + 1] = c.g; cols[k * 3 + 2] = c.b;
    }
    canopy.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    canopy.translate(x, 2.28, z); fabricParts.push(canopy);
    const rim = new THREE.TorusGeometry(1.44, .045, 4, 24); rim.rotateX(Math.PI / 2); rim.translate(x, 1.97, z); fabricParts.push(tinted(rim, '#fffaf0')); rim.dispose();
    cyl(woodParts, '#ffd23f', .06, .08, .16, x, 2.66, z, 8);
    // towel laid out beside the pole
    box(fabricParts, TOWEL[i % TOWEL.length], 1.45, .04, 1.9, x + .95, .035, z + .75, .16);
    box(fabricParts, '#fffaf0', .16, .045, 1.92, x + .95, .04, z + .75, .16);
    // beach ball: six painted gores
    const ball = new THREE.SphereGeometry(.3, 18, 12);
    const bp = ball.attributes.position, bc = new Float32Array(bp.count * 3);
    for (let k = 0; k < bp.count; k++) {
      const a = Math.atan2(bp.getZ(k), bp.getX(k));
      const gore = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 6);
      const c = new THREE.Color(['#ff6f6f', '#fffaf0', '#ffd23f', '#7fd8ff', '#fffaf0', '#a98bff'][gore % 6]);
      bc[k * 3] = c.r; bc[k * 3 + 1] = c.g; bc[k * 3 + 2] = c.b;
    }
    ball.setAttribute('color', new THREE.BufferAttribute(bc, 3));
    ball.translate(x - 1.02, .3, z + 1.2); ballParts.push(ball);
  });

  // ---- dune grass along the back of the sand, skipping the lighthouse and the pier
  for (let x = -147; x <= -23; x += 1.55) {
    if (Math.abs(x + 95) < 2.8 || Math.abs(x + 115) < 3.6) continue;
    grassSpots.push({ x: x + ((x * 7) % 5) * .08, z: -7.25 + ((x * 3) % 7) * .07, rot: (x * 1.7) % 6.283, col: x % 3 ? '#7fb86a' : '#9ad07e' });
  }

  // ---- driftwood: a weathered trunk and a broken branch, clear of the crab walk
  beam(woodParts, '#b8a68f', [-58.6, .12, -5.4], [-55.2, .22, -5.9], .17);
  beam(woodParts, '#a89478', [-56.6, .2, -5.6], [-55.9, .1, -4.7], .07);
  beam(woodParts, '#c4b49c', [-57.8, .2, -5.4], [-57.3, .55, -5.1], .05);

  const wood = new THREE.Mesh(mergeMixed(woodParts), painted); wood.castShadow = wood.receiveShadow = true; group.add(wood);
  const cloth = new THREE.Mesh(mergeMixed(fabricParts), fabricM); cloth.castShadow = cloth.receiveShadow = true; group.add(cloth);
  const balls = new THREE.Mesh(mergeMixed(ballParts), ballM); balls.castShadow = true; group.add(balls);

  // ---- grass tufts: three blades per spot, one instanced mesh
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const blade = broadLeafGeometry({ len: .52, wid: .05, rise: .42, droop: .16, cup: .02, rib: .004, seg: 5, across: 2 });
  const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide }), grassSpots.length * 3);
  let gi = 0;
  for (const sp of grassSpots) for (let k = 0; k < 3; k++) {
    q.setFromEuler(eu.set(-.2, sp.rot + k * 2.09, (k - 1) * .18));
    v.set(sp.x, .01, sp.z); s.setScalar(.85 + (k % 2) * .25);
    mtx.compose(v, q, s); grass.setMatrixAt(gi, mtx); grass.setColorAt(gi, C.set(sp.col)); gi++;
  }
  grass.castShadow = true; group.add(grass);

  return { group, added: { parasols: PARASOLS.length, towels: PARASOLS.length, balls: PARASOLS.length, grass: gi } };
}

// ===================================================================
// (stage 12) Whispering Woods: the woods were a single row of trees behind a
// flat path. This adds real trees with tapered trunks, limbs and stacked crown
// layers, a fern understory along both sides of the path, and a cleared
// campfire circle with bench logs and a woodpile. The trees and campfire props
// keep clear of the hollow log, birdhouse, hidden owl and tunnel mouth.
// ===================================================================
export function buildWoodsDetail({ add }) {
  const group = new THREE.Group(); group.name = 'woods-detail'; add(group);
  const barkM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 });
  const leafM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86 });
  const fernM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide });
  const woodParts = [], leafParts = [], fernSpots = [];
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 9) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const beam = (list, hex, a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const g = new THREE.CylinderGeometry(r * .7, r, A.distanceTo(B), 7);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    list.push(tinted(g, hex)); g.dispose();
  };
  // (stage 12 fix) crowns are lumpy, leaf-textured blobs like the engine's own trees, not smooth
  // tinted spheres: same leaf-detail map and normal map, plus a fringe of leaf cards below
  const LD = leafDetail();
  const crownMat = new THREE.MeshPhysicalMaterial({ map: LD.map, normalMap: LD.normal, normalScale: new THREE.Vector2(.7, .7), vertexColors: true, roughness: .8, sheen: .6, sheenRoughness: .6, sheenColor: new THREE.Color('#e4f7c0') });
  const lumpy = r => {
    const g = new THREE.IcosahedronGeometry(r, 3), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + Math.sin(v.x * 4.1) * Math.sin(v.y * 3.7 + 1) * Math.sin(v.z * 4.3) * .13 + Math.sin(v.x * 9 + v.z * 7) * .03; v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g;
  };
  const clump = (list, hex, r, x, y, z, squash = .78) => {
    const g = lumpy(r); g.scale(1, squash, 1); g.translate(x, y, z);
    list.push(tinted(g, hex)); g.dispose();
  };

  // ---- nine real trees between the path and the back row: tapered trunk in two barks, three limbs,
  // three crown layers so neighbouring crowns overlap into a canopy
  const TREES = [[-157, -9.4], [-171.5, -8.6], [-196, -9.8], [-207, -8.2], [-217, -10.4], [-227, -8.8], [-244, -9.2], [-256, -10.6], [-266, -8.4]];
  TREES.forEach(([x, z], i) => {
    const s = .92 + (i % 3) * .14, h = 2.7 * s, lean = (i % 2 ? .1 : -.08);
    cyl(woodParts, '#5f452f', .17 * s, .26 * s, h * .55, x, h * .275, z);
    cyl(woodParts, '#76543a', .12 * s, .17 * s, h * .34, x + lean, h * .69, z);
    beam(woodParts, '#5f452f', [x, h * .52, z], [x + .95 * s, h * 1.02, z + .3 * s], .07 * s);
    beam(woodParts, '#6b4c34', [x, h * .6, z], [x - .85 * s, h * 1.08, z - .45 * s], .055 * s);
    beam(woodParts, '#6b4c34', [x + lean, h * .78, z], [x + .3 * s, h * 1.32, z - .95 * s], .045 * s);
    const c1 = i % 2 ? '#7cb968' : '#8ac474', c2 = i % 2 ? '#9ad483' : '#a8de91';
    // (stage 12 fix) the four crowns overlap heavily so no clump reads as floating: offsets stay
    // inside the lower crown's radius and the top sits directly on the stack
    clump(leafParts, c1, .98 * s, x, h * 1.0, z);
    clump(leafParts, c2, .8 * s, x + .34 * s, h * 1.2, z + .16 * s, .82);
    clump(leafParts, c1, .74 * s, x - .32 * s, h * 1.18, z - .22 * s, .8);
    clump(leafParts, c2, .6 * s, x + .04 * s, h * 1.34, z + .02 * s, .86);
  });

  // ---- understory ferns on both sides of the path, clear of the interactive props
  const KEEP = [[-165, 2.9], [-180, 2.4], [-187, 2.1], [-201, 2.6], [-232, 3.2], [-157, 2.2]];
  for (let x = -269; x <= -153; x += 1.7) for (const z of [-5.1, -5.9, -6.7]) {
    if (KEEP.some(([kx, kr]) => Math.hypot(x - kx, z + 2.6) < kr + .8)) continue;
    if (((x * 31 + z * 17) | 0) % 5 === 0) continue;
    fernSpots.push({ x: x + ((Math.abs(x * 13) | 0) % 7) * .07, z, rot: (x * 2.3) % 6.283, sc: .78 + ((Math.abs(x) | 0) % 4) * .12 });
  }

  // ---- the campfire clearing: a swept earth disc, two bench logs and a woodpile
  const earth = new THREE.CircleGeometry(2.35, 28); earth.rotateX(-Math.PI / 2); earth.translate(-165, .015, -2.6);
  const ground = new THREE.Mesh(earth, new THREE.MeshStandardMaterial({ color: '#9c7c55', roughness: .98 }));
  ground.receiveShadow = true; group.add(ground);
  [[-167.9, -4.35, .25], [-161.9, -4.45, -.2]].forEach(([x, z, ry]) => {
    const b = new THREE.CylinderGeometry(.24, .26, 1.5, 12); b.rotateZ(Math.PI / 2); b.rotateY(ry); b.translate(x, .25, z);
    woodParts.push(tinted(b, '#7d5a3c')); b.dispose();
    const top = new THREE.CylinderGeometry(.245, .245, .04, 12); top.rotateZ(Math.PI / 2); top.rotateY(ry); top.translate(x, .49, z);
    woodParts.push(tinted(top, '#b3906a')); top.dispose();
  });
  for (let k = 0; k < 4; k++) beam(woodParts, k % 2 ? '#6b4c34' : '#7d5a3c', [-168.9, .16 + k * .11, -2.2 - k * .04], [-167.9, .16 + k * .11, -2.9 + k * .05], .1);

  const timber = new THREE.Mesh(mergeMixed(woodParts), barkM); timber.castShadow = timber.receiveShadow = true; group.add(timber);
  const crowns = new THREE.Mesh(mergeMixed(leafParts), crownMat); crowns.castShadow = crowns.receiveShadow = true; group.add(crowns);
  // leaf-card fringe around each crown: the fuzz that makes the engine's trees read as leaves
  const cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(.42, .42), new THREE.MeshStandardMaterial({ map: leafTexture(), alphaTest: .5, side: THREE.DoubleSide, roughness: .78 }), TREES.length * 44);
  { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3(); let ci = 0;
    TREES.forEach(([x, z], i) => { const s = .92 + (i % 3) * .14, h = 2.7 * s, cy = h * 1.12, cr = 1.05 * s;
      for (let k = 0; k < 44; k++) {
        const a = (k * 2.399) % 6.283, yy = ((k * 0.618) % 1) * 2 - 1;
        pv.set(x + Math.cos(a) * cr * Math.sqrt(1 - yy * yy) * .95, cy + yy * cr * .75, z + Math.sin(a) * cr * Math.sqrt(1 - yy * yy) * .95);
        e.set((k % 3) * .7, a, (k % 2 ? 1 : -1) * .5); q.setFromEuler(e); sv.setScalar(.8 + (k % 4) * .12);
        m4.compose(pv, q, sv); cards.setMatrixAt(ci, m4); cards.setColorAt(ci, C.set(k % 2 ? '#8ac474' : '#a8de91')); ci++;
      } }); }
  cards.castShadow = true; cards.receiveShadow = true; group.add(cards);
  const fernGeo = broadLeafGeometry({ len: .44, wid: .19, rise: .3, droop: .2, cup: .05, rib: .012, seg: 5, across: 3 });
  const ferns = new THREE.InstancedMesh(fernGeo, fernM, fernSpots.length * 4);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  let fi = 0;
  for (const fp of fernSpots) for (let k = 0; k < 4; k++) {
    q.setFromEuler(eu.set(-.35, fp.rot + k * 1.34, (k % 2 ? 1 : -1) * .22));
    v.set(fp.x + Math.cos(k * 1.57) * .1, .02, fp.z + Math.sin(k * 1.57) * .1); sc.set(fp.sc, fp.sc * (1 + k * .12), fp.sc);
    mtx.compose(v, q, sc); ferns.setMatrixAt(fi, mtx); ferns.setColorAt(fi, C.set(k % 2 ? '#4e8f4a' : '#63ad57')); fi++;
  }
  ferns.castShadow = true; group.add(ferns);

  return { group, added: { trees: TREES.length, crowns: TREES.length * 4, fernTufts: fernSpots.length, benches: 2 } };
}

// ===================================================================
// (stage 13) Frosty Peaks: flat snow around the hill and the igloo. This adds a
// ridgeline of snow-capped rock behind the district, wind drifts along both
// sides of the path, snow-loaded pines between the ridge and the path, and a
// blue ice arch. Everything stays clear of the sledding steps, snowman, target,
// pond, igloo, star pole and penguins.
// ===================================================================
export function buildFrostyDetail({ add }) {
  const group = new THREE.Group(); group.name = 'frosty-detail'; add(group);
  const snowM = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .78, sheen: .5, sheenRoughness: .7, sheenColor: new THREE.Color('#eaf4ff') });
  const rockM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true });
  const iceM = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .16, metalness: 0, clearcoat: .9, clearcoatRoughness: .18, transmission: .12, thickness: .6 });
  const rockParts = [], snowParts = [], pineParts = [], iceParts = [], driftSpots = [];
  const ball = (list, hex, r, x, y, z, sx = 1, sy = 1) => { const g = new THREE.IcosahedronGeometry(r, 2); g.scale(sx, sy, 1); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cone = (list, hex, r, h, x, y, z, seg = 9) => { const g = new THREE.ConeGeometry(r, h, seg); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };

  // ---- ridgeline: four lumpy rock shoulders with snow caps, behind everything
  const RIDGE = [[-286, 2.6, 1.0], [-318, 3.5, 1.2], [-352, 2.9, 1.05], [-390, 3.7, 1.2]];
  RIDGE.forEach(([x, h, w], i) => {
    const z = -15.4, zz = ((i * 7) % 3) * .45 - .45;
    ball(rockParts, i % 2 ? '#8b9bb0' : '#7d8ea4', h * .6, x, h * .3, z + zz, w * 1.45, .95);
    ball(rockParts, '#93a4b8', h * .38, x + h * .7, h * .2, z + zz + .5, w * .95, .85);
    // a snow cap that actually sits on and over the shoulder, not a sliver
    ball(snowParts, '#f7fbff', h * .58, x - h * .08, h * .6, z + zz + .05, w * 1.3, .5);
    ball(snowParts, '#ffffff', h * .34, x + h * .66, h * .38, z + zz + .5, w * .82, .46);
    cone(snowParts, '#f7fbff', h * .3, h * .4, x + h * .1, h * .88, z + zz, 8);
  });

  // ---- snow-loaded pines between the ridge and the path
  const PINES = [[-283, -8.2, 1], [-293, -9.6, .85], [-307, -8.6, 1.1], [-336, -9.2, .95], [-349, -8.4, 1.05], [-375, -9.8, .9], [-396, -8.8, 1.0]];
  PINES.forEach(([x, z, s]) => {
    const trunk = new THREE.CylinderGeometry(.1 * s, .16 * s, 1.5 * s, 7); trunk.translate(x, .75 * s, z); pineParts.push(tinted(trunk, '#6d5138')); trunk.dispose();
    [[1.35, 1.5, 1.0], [1.05, 1.15, 1.75], [.72, .9, 2.4]].forEach(([r, h, y], k) => {
      cone(pineParts, k % 2 ? '#2f6b52' : '#357659', r * s, h * s, x, y * s, z, 9);
      cone(snowParts, '#f7fbff', r * .82 * s, h * .46 * s, x, (y + h * .3) * s, z, 9);
    });
  });

  // ---- ice arch over the path side, clear of the pond, igloo and penguins
  const AX = -372, AZ = -5.0, AW = 1.5, AH = 2.0;
  for (const side of [-1, 1]) {
    const pier = new THREE.CylinderGeometry(.24, .3, AH, 8); pier.translate(AX + side * AW, AH / 2, AZ); iceParts.push(tinted(pier, '#bfe6ff')); pier.dispose();
  }
  const apex = new THREE.TorusGeometry(AW, .24, 6, 18, Math.PI); apex.translate(AX, AH, AZ); iceParts.push(tinted(apex, '#cdeaff')); apex.dispose();
  const drip = new THREE.ConeGeometry(.09, .5, 6); drip.rotateX(Math.PI); drip.translate(AX + AW, AH + .1, AZ); iceParts.push(tinted(drip, '#e8f7ff')); drip.dispose();

  // ---- wind drifts along both sides of the path
  for (let x = -400; x <= -276; x += 2.3) for (const z of [-3.15, -5.75]) {
    if (x > -369 && x < -353) continue;                        // frozen pond
    if (x > -384 && x < -376 && z < -3.6) continue;            // igloo
    if (x > -334 && x < -315 && z < -3.6) continue;            // sledding hill and steps
    if (x > -304 && x < -294) continue;                        // snowman and snowpile
    if (Math.abs(x + 312) < 2.2) continue;                     // snowball target
    driftSpots.push({ x: x + ((Math.abs(x * 7) | 0) % 5) * .09, z, r: .42 + ((Math.abs(x) | 0) % 3) * .1 });
  }

  const rock = new THREE.Mesh(mergeMixed(rockParts), rockM); rock.castShadow = rock.receiveShadow = true; group.add(rock);
  const snow = new THREE.Mesh(mergeMixed(snowParts), snowM); snow.castShadow = snow.receiveShadow = true; group.add(snow);
  const pines = new THREE.Mesh(mergeMixed(pineParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86 })); pines.castShadow = pines.receiveShadow = true; group.add(pines);
  const ice = new THREE.Mesh(mergeMixed(iceParts), iceM); ice.castShadow = true; group.add(ice);
  const driftGeo = new THREE.IcosahedronGeometry(1, 2); driftGeo.scale(1, .38, .72);
  // (a plain white material: the instanced drift geometry has no vertex-colour attribute to tint)
  const drifts = new THREE.InstancedMesh(driftGeo, new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .8, sheen: .5, sheenRoughness: .7, sheenColor: new THREE.Color('#eaf4ff') }), driftSpots.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3();
  driftSpots.forEach((d, i) => {
    q.setFromEuler(eu.set(0, (d.x * 1.7) % 6.283, 0)); v.set(d.x, .02, d.z); sv.set(d.r * 1.6, d.r * .55, d.r);
    mtx.compose(v, q, sv); drifts.setMatrixAt(i, mtx);
  });
  drifts.receiveShadow = true; group.add(drifts);

  return { group, added: { ridges: RIDGE.length, pines: PINES.length, drifts: driftSpots.length, arch: 1 } };
}

// ===================================================================
// (stage 14) Happy Farm: the fields behind the barn and windmill were empty
// grass. This adds a fenced paddock along the back of the path (with gaps at the
// barn and the windmill), crop rows of cabbages and carrots, round hay bales in
// the far field, and a cupola with a weathervane on the barn roof. The
// interactive vegetable patch, haystack, animals and apple tree are untouched.
// ===================================================================
export function buildFarmDetail({ add }) {
  const group = new THREE.Group(); group.name = 'farm-detail'; add(group);
  const woodParts = [], cropParts = [], strawParts = [], whiteParts = [], metalParts = [];
  const box = (list, hex, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 10, rot) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); if (rot) { g.rotateX(rot[0] || 0); g.rotateZ(rot[2] || 0); } g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const beam = (list, hex, a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const g = new THREE.CylinderGeometry(r, r, A.distanceTo(B), 7);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    list.push(tinted(g, hex)); g.dispose();
  };
  const ball = (list, hex, r, x, y, z, sx = 1, sy = 1) => { const g = new THREE.IcosahedronGeometry(r, 1); g.scale(sx, sy, 1); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };

  // ---- fenced paddock along the back of the path, with gates at the barn and the windmill
  const ZF = -6.9;
  for (let x = -530; x <= -408; x += 2.6) {
    if (x > -426 && x < -414) continue;   // barn yard gate
    if (x > -507 && x < -499) continue;   // windmill gate
    box(woodParts, '#c9a26a', .12, 1.0, .12, x, .5, ZF);
    if (x > -528) { box(woodParts, '#dcb87e', 2.62, .08, .06, x - 1.3, .78, ZF); box(woodParts, '#dcb87e', 2.62, .08, .06, x - 1.3, .44, ZF); }
  }

  // ---- crop rows from x −529 to −410, behind the fence: cabbages and carrots
  for (let row = 0; row < 4; row++) {
    const z = -8.1 - row * .82;
    for (let x = -529; x <= -410; x += 1.15) {
      if (x > -426 && x < -414 && row < 2) continue;          // behind the barn
      if (((x * 13 + row * 7) | 0) % 5 === 0) continue;       // a few gaps, so rows are not mechanical
      if (row % 2 === 0) {
        ball(cropParts, '#79b45e', .3, x, .22, z, 1.15, .85);
        ball(cropParts, '#8ec972', .22, x + .1, .34, z - .05, 1, .75);
        ball(cropParts, '#6aa451', .16, x - .16, .2, z + .08, .9, .7);
      } else {
        cyl(cropParts, '#e8811f', .055, .085, .26, x, .13, z, 7);         // carrot shoulder
        for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + row; beam(cropParts, k % 2 ? '#4f9048' : '#62a857', [x, .2, z], [x + Math.cos(a) * .17, .52 + (k % 3) * .05, z + Math.sin(a) * .17], .022); }
      }
    }
  }

  // ---- round hay bales in the far field
  [[-521, -10.2, .2], [-515.5, -10.8, -.15], [-461, -10.4, .1], [-455, -11.0, -.2], [-442, -10.6, .05], [-434.5, -11.2, -.1]].forEach(([x, z, ry]) => {
    const b = new THREE.CylinderGeometry(1.05, 1.05, 1.5, 14); b.rotateZ(Math.PI / 2); b.rotateY(ry); b.translate(x, 1.05, z);
    strawParts.push(tinted(b, '#e0b866')); b.dispose();
    for (const s of [-1, 1]) { const cap = new THREE.CylinderGeometry(1.02, 1.02, .06, 14); cap.rotateZ(Math.PI / 2); cap.rotateY(ry); cap.translate(x + s * .75, 1.05, z); strawParts.push(tinted(cap, '#f0d495')); cap.dispose(); }
  });

  // ---- barn cupola with louvred vents and a weathervane (the barn roof peaks at y ≈ 6.4)
  const BX = -420, BZ = -5.6;
  box(whiteParts, '#f7f2e6', 1.5, .95, 1.5, BX, 6.75, BZ);
  box(whiteParts, '#efe6d4', 1.62, .1, 1.62, BX, 6.26, BZ);
  for (const s of [-1, 1]) box(woodParts, '#5d4633', .62, .6, .06, BX + s * .77, 6.8, BZ, 0);
  const cap = new THREE.ConeGeometry(1.16, .62, 8); cap.translate(BX, 7.5, BZ); whiteParts.push(tinted(cap, '#d8443c')); cap.dispose();
  cyl(metalParts, '#8d99a6', .035, .045, .55, BX, 8.02, BZ, 7);
  beam(metalParts, '#8d99a6', [BX - .34, 8.12, BZ], [BX + .34, 8.12, BZ], .022);
  beam(metalParts, '#8d99a6', [BX + .3, 8.12, BZ], [BX + .42, 8.24, BZ], .02);
  beam(metalParts, '#8d99a6', [BX + .3, 8.12, BZ], [BX + .42, 8.0, BZ], .02);

  const timber = new THREE.Mesh(mergeMixed(woodParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88 })); timber.castShadow = timber.receiveShadow = true; group.add(timber);
  const crops = new THREE.Mesh(mergeMixed(cropParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82 })); crops.castShadow = crops.receiveShadow = true; group.add(crops);
  const straw = new THREE.Mesh(mergeMixed(strawParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); straw.castShadow = straw.receiveShadow = true; group.add(straw);
  const paint = new THREE.Mesh(mergeMixed(whiteParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 })); paint.castShadow = true; group.add(paint);
  const metal = new THREE.Mesh(mergeMixed(metalParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .45, metalness: .7 })); group.add(metal);

  return { group, added: { fencePosts: 45, cropRows: 4, bales: 6, cupola: 1 } };
}

// ===================================================================
// (stage 15) Ocean Pier: the deck was one smooth block with four plain posts.
// This gives it real planking with seams and edge trim, pilings with rope wraps,
// brass mooring cleats, a striped bait shack on the shore and lamp posts. It
// keeps clear of the fishing rod, tide pool, buoys, seal rock, crates, dolphin
// hoop and treasure dig.
// ===================================================================
export function buildPierDetail({ add }) {
  const group = new THREE.Group(); group.name = 'pier-detail'; add(group);
  const woodParts = [], ropeParts = [], metalParts = [], clothParts = [];
  const box = (list, hex, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 10, rot) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); if (rot) { g.rotateX(rot[0] || 0); g.rotateZ(rot[2] || 0); } g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };

  // ---- deck: plank seams, edge trim and a kick rail (deck top is y .625, x −561.4…−558.6)
  const DX = -560, DZ0 = -5.2, DZ1 = -16.8, DXW = 1.34;
  for (let z = DZ0; z >= DZ1; z -= .42) box(woodParts, '#8a6240', 2.68, .012, .035, DX, .633, z);
  for (const s of [-1, 1]) {
    box(woodParts, '#9a7350', .12, .1, DZ0 - DZ1 + .1, DX + s * (DXW + .04), .68, (DZ0 + DZ1) / 2);
    for (let z = DZ0; z >= DZ1; z -= 1.16) box(woodParts, '#7d5836', .07, .26, .07, DX + s * (DXW + .04), .5, z);
  }

  // ---- pilings with rope wraps, two per side
  for (const z of [-6.4, -9.6, -12.8, -16.2]) for (const s of [-1, 1]) {
    const x = DX + s * (DXW + .1);
    cyl(woodParts, '#6d4b30', .13, .16, 1.9, x, .45, z, 8);
    cyl(woodParts, '#5d3f28', .17, .17, .08, x, 1.36, z, 8);           // cap
    for (const y of [1.02, .84]) { const r = new THREE.TorusGeometry(.155, .035, 5, 12); r.rotateX(Math.PI / 2); r.translate(x, y, z); ropeParts.push(tinted(r, '#d9c39a')); r.dispose(); }
  }

  // ---- brass mooring cleats along the outer edge
  for (const z of [-7.6, -11.2, -15.0]) {
    box(metalParts, '#c8a44a', .1, .08, .34, DX - DXW - .02, .68, z);
    for (const s of [-1, 1]) cyl(metalParts, '#b8953f', .045, .045, .1, DX - DXW - .02, .74, z + s * .15, 8);
  }

  // ---- bait shack on the shore, clear of the fishing rod and tide pool
  const SX = -545.5, SZ = -5.7;   // (stage 15 fix) set back off the walking lane: the counter and awning used to reach into it
  box(woodParts, '#b98a5c', 2.3, 1.9, 1.7, SX, .95, SZ);
  box(woodParts, '#a3754a', 2.42, .12, 1.82, SX, 1.96, SZ);
  for (const s of [-1, 1]) box(woodParts, '#8f6440', .12, 1.9, 1.72, SX + s * 1.14, .95, SZ);
  // counter and awning sit proud of the front face (z ≈ −3.65), not buried in the body
  box(woodParts, '#c99a6a', 2.1, .12, .52, SX, 1.05, SZ + 1.05);
  box(woodParts, '#a87b4c', 2.1, .06, .5, SX, .62, SZ + 1.05);
  for (let i = 0; i < 6; i++) box(clothParts, i % 2 ? '#fff6ea' : '#ff7a5c', .38, .05, .95, SX - 1.14 + .38 * i + .19, 1.94, SZ + 1.6);
  box(clothParts, '#fff6ea', 2.3, .05, .07, SX, 1.86, SZ + 2.05);
  for (const s of [-1, 1]) cyl(woodParts, '#8f6440', .035, .045, 1.86, SX + s * 1.05, .93, SZ + 2.0, 6);
  // a couple of bait buckets and a crate by the door
  cyl(woodParts, '#7fb8d8', .22, .19, .42, SX + 1.5, .21, SZ + .2, 10);
  cyl(woodParts, '#6aa8cc', .2, .17, .36, SX + 1.9, .18, SZ - .15, 10);
  box(woodParts, '#c9a26a', .5, .5, .5, SX - 1.5, .25, SZ + .35, .3);

  // ---- lamp posts: one on the shore, three down the deck edge
  const LAMPS = [[-549.6, -3.9, 0], [DX - DXW - .12, -8.2, 0], [DX - DXW - .12, -13.2, 0], [DX - DXW - .12, -16.4, 0]];
  LAMPS.forEach(([x, z]) => {
    cyl(woodParts, '#4a3d33', .055, .075, 2.5, x, 1.25, z, 8);
    box(metalParts, '#3b332c', .26, .1, .26, x, 2.54, z);
    cyl(metalParts, '#ffe7a8', .13, .16, .26, x, 2.72, z, 8);
    box(metalParts, '#3b332c', .3, .06, .3, x, 2.88, z);
    const cap = new THREE.ConeGeometry(.24, .16, 8); cap.translate(x, 2.99, z); metalParts.push(tinted(cap, '#3b332c')); cap.dispose();
  });

  const timber = new THREE.Mesh(mergeMixed(woodParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 })); timber.castShadow = timber.receiveShadow = true; group.add(timber);
  const ropes = new THREE.Mesh(mergeMixed(ropeParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98 })); ropes.castShadow = true; group.add(ropes);
  const metal = new THREE.Mesh(mergeMixed(metalParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .65 })); metal.castShadow = true; group.add(metal);
  const cloth = new THREE.Mesh(mergeMixed(clothParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide })); cloth.castShadow = true; group.add(cloth);

  return { group, added: { plankSeams: Math.round((DZ0 - DZ1) / .42) + 1, pilings: 8, cleats: 3, lamps: LAMPS.length, baitShack: 1 } };
}

// ===================================================================
// (stage 16) Balloon Hills: three tethered balloons with baskets and stakes,
// two bunting lines between poles, wildflower drifts along the path, and two
// pale terrace shelves behind the hills. Clear of the flyable balloon (x −684),
// kites (x −696), the grassy slide hill (x −705…−723), goats (x −736…−743),
// echo rock (x −752), wind chimes and the long-legs drawing (x −789).
// ===================================================================
export function buildHillsDetail({ add }) {
  const group = new THREE.Group(); group.name = 'hills-detail'; add(group);
  const woodParts = [], clothParts = [], ropeParts = [], stemParts = [], terraceParts = [], flowerSpots = [];
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 10) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const beam = (list, hex, a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const g = new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    list.push(tinted(g, hex)); g.dispose();
  };
  const blob = (list, hex, r, x, y, z, sx = 1, sy = 1) => { const g = new THREE.IcosahedronGeometry(r, 2); g.scale(sx, sy, 1); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const RB = ['#ff5a8a', '#ffd23f', '#2fa8ff', '#8fd88a', '#a98bff', '#ff8a3c'];

  // ---- terrace shelves behind the hills: two pale, flat-topped steps
  [[-730, 8.5, .34, '#a8e3a0'], [-762, 9.5, .3, '#b6e8ad']].forEach(([x, r, sy, col]) => {
    blob(terraceParts, col, r, x, r * sy * .35, -14.5, 1.5, sy);
    blob(terraceParts, '#bdeeb4', r * .62, x + 1.2, r * sy * .55, -14.2, 1.4, sy * .8);
  });

  // ---- three moored balloons, each with a basket, three ropes and a stake
  const MOORED = [[-747, -9.2, '#ff5a8a', '#ffd23f'], [-769, -9.8, '#2fa8ff', '#8fd88a'], [-792, -8.6, '#ffd23f', '#ff8a3c']];
  MOORED.forEach(([x, z, cA, cB]) => {
    const env = new THREE.SphereGeometry(1.15, 20, 14); env.scale(1, 1.16, 1); env.translate(x, 4.4, z);
    const pos = env.attributes.position, cols = new Float32Array(pos.count * 3), A = new THREE.Color(cA), B = new THREE.Color(cB);
    for (let i = 0; i < pos.count; i++) { const yy = (pos.getY(i) - 4.4) / 1.35, c = ((Math.round((yy + 1) * 3)) % 2) ? A : B; cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    env.setAttribute('color', new THREE.BufferAttribute(cols, 3)); clothParts.push(env);
    const basket = new THREE.CylinderGeometry(.38, .32, .46, 8); basket.translate(x, 1.5, z); woodParts.push(tinted(basket, '#b5793c')); basket.dispose();
    cyl(woodParts, '#8a5a2a', .4, .4, .05, x, 1.72, z, 8);
    for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + .4; beam(ropeParts, '#e8dcc4', [x + Math.cos(a) * .34, 1.7, z + Math.sin(a) * .34], [x + Math.cos(a) * .2, 3.55, z + Math.sin(a) * .2], .012); }
    beam(ropeParts, '#e8dcc4', [x, 1.46, z], [x + 1.5, .05, z + 1.1], .016);
    cyl(woodParts, '#7a5236', .045, .06, .55, x + 1.5, .27, z + 1.1, 6);
  });

  // ---- bunting lines between pairs of poles, clear of the goats and the echo rock
  [[-726.5, -4.9, -732.2, -4.9], [-757.5, -5.2, -763.8, -5.2]].forEach(([x0, z0, x1, z1]) => {
    for (const [x, z] of [[x0, z0], [x1, z1]]) { cyl(woodParts, '#e6d6bd', .07, .09, 2.5, x, 1.25, z, 8); cyl(woodParts, '#cfb896', .13, .15, .1, x, 2.48, z, 8); }
    const N = 12;
    for (let i = 1; i < N; i++) {
      const t = i / N, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = 2.42 - Math.sin(t * Math.PI) * .34;
      const f = new THREE.ConeGeometry(.12, .26, 4); f.rotateX(Math.PI); f.rotateY(.5); f.translate(x, y - .13, z);
      clothParts.push(tinted(f, RB[i % RB.length])); f.dispose();
    }
    beam(ropeParts, '#efe6d4', [x0, 2.44, z0], [x1, 2.44, z1], .012);
  });

  // ---- wildflower drifts along the path, stepping around the interactive pieces
  for (let x = -797; x <= -671; x += .9) for (const z of [-4.4, -5.1, -5.8]) {
    if (Math.abs(x + 684) < 3.4 || Math.abs(x + 696) < 3 || (x > -723 && x < -704) || (x > -744 && x < -735) || Math.abs(x + 752) < 3.2 || Math.abs(x + 789) < 2.2) continue;
    if (((x * 17 + z * 11) | 0) % 3 === 0) continue;
    flowerSpots.push({ x: x + ((Math.abs(x * 7) | 0) % 5) * .1, z, h: .18 + ((Math.abs(x) | 0) % 4) * .04, col: RB[(Math.abs(x) | 0) % RB.length] });
  }
  flowerSpots.forEach(f => beam(stemParts, '#5f9a52', [f.x, 0, f.z], [f.x + .03, f.h, f.z], .012));

  const wood = new THREE.Mesh(mergeMixed(woodParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88 })); wood.castShadow = wood.receiveShadow = true; group.add(wood);
  const cloth = new THREE.Mesh(mergeMixed(clothParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82, side: THREE.DoubleSide })); cloth.castShadow = true; group.add(cloth);
  const ropes = new THREE.Mesh(mergeMixed(ropeParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98 })); group.add(ropes);
  const stems = new THREE.Mesh(mergeMixed(stemParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 })); group.add(stems);
  const terraces = new THREE.Mesh(mergeMixed(terraceParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); terraces.receiveShadow = true; group.add(terraces);
  const bloom = new THREE.IcosahedronGeometry(.075, 0);
  // (no vertexColors here: the bloom geometry has no colour attribute, so instance colours must stand alone)
  const flowers = new THREE.InstancedMesh(bloom, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .6 }), flowerSpots.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, .7, 1);
  flowerSpots.forEach((f, i) => { v.set(f.x + .03, f.h + .02, f.z); mtx.compose(v, q, s); flowers.setMatrixAt(i, mtx); flowers.setColorAt(i, C.set(f.col)); });
  group.add(flowers);

  return { group, added: { mooredBalloons: MOORED.length, buntingLines: 2, flowers: flowerSpots.length, terraces: 2 } };
}

// ===================================================================
// (stage 17) Adventure Trail: the rope bridge had planks but no rails, the
// cliffs were bare, and the lookout rock had a telescope on nothing. This adds
// sagging handrails and rope ties on the bridge, stratified cliffs behind the
// path, a small waterfall with a plunge basin and mist, and a plank lookout deck
// with a rail. Clear of the stream crossing (x 444–456), stepping stones,
// lookout rocks (x 474–486.5) and the zip-line tower (x 487–490).
// ===================================================================
export function buildTrailDetail({ add }) {
  const group = new THREE.Group(); group.name = 'trail-detail'; add(group);
  const woodParts = [], ropeParts = [], stoneParts = [], waterParts = [], mistParts = [];
  const box = (list, hex, w, h, d, x, y, z, ry = 0, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const cyl = (list, hex, ra, rb, h, x, y, z, seg = 9) => { const g = new THREE.CylinderGeometry(ra, rb, h, seg); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };
  const beam = (list, hex, a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const g = new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    list.push(tinted(g, hex)); g.dispose();
  };
  const rock = (list, hex, r, x, y, z, sx, sy, ry) => { const g = new THREE.DodecahedronGeometry(r, 0); g.scale(sx, sy, 1); if (ry) g.rotateY(ry); g.translate(x, y, z); list.push(tinted(g, hex)); g.dispose(); };

  // ---- bridge handrails: posts at both ends, sagging rope, vertical ties (deck spans x 445–455, z −1.5…1.5)
  for (const x of [444.4, 455.6]) for (const z of [-1.5, 1.5]) {
    cyl(woodParts, '#8a5a2a', .09, .11, 1.15, x, .58, z, 8);
    cyl(woodParts, '#a8703f', .13, .13, .08, x, 1.16, z, 8);
  }
  for (const z of [-1.5, 1.5]) {
    for (let i = 0; i < 6; i++) {
      const t0 = i / 6, t1 = (i + 1) / 6, sag = t => 1.08 - Math.sin(t * Math.PI) * .18;
      beam(ropeParts, '#d9c39a', [444.4 + 11.2 * t0, sag(t0), z], [444.4 + 11.2 * t1, sag(t1), z], .028);
      beam(ropeParts, '#cbb488', [444.4 + 11.2 * t1, sag(t1), z], [444.4 + 11.2 * t1, .12, z], .018);
    }
  }

  // ---- cliff strata behind the path: two faces of stacked slabs with darker bands
  [[460, -11.6, 1], [508, -11.2, -1]].forEach(([cx, cz, dir]) => {
    // lumpy rock shoulders with a darker stratum line, not stacked boxes
    for (let k = 0; k < 3; k++) {
      const w = 3.0 - k * .55, y = 1.0 + k * 1.05;
      rock(stoneParts, k % 2 ? '#a89a8a' : '#96897a', w, cx + dir * (k * .45), y, cz + (k % 2 ? .15 : -.1), 1.9, .95, k * .5);
      rock(stoneParts, '#7f7466', w * .92, cx + dir * (k * .45), y - .55, cz + .05, 1.85, .18, k * .4);
    }
    rock(stoneParts, '#b3a595', .7, cx - dir * 2.6, .38, cz + 1.5, 1.2, .7, .4);
    rock(stoneParts, '#8a7f70', .55, cx + dir * 3.1, .3, cz + 1.6, 1.1, .65, 1.1);
  });

  // ---- waterfall: water sheet down the left cliff, plunge basin and mist puffs
  const WX = 459.4, WZ = -9.05;   // (proud of the cliff face; at z −10.15 the rock swallowed the water sheet)
  box(waterParts, '#bfe6ff', 1.0, 3.1, .12, WX, 1.7, WZ, 0, 0);
  box(waterParts, '#d8f1ff', .72, 2.7, .1, WX - .06, 1.55, WZ + .08, 0, 0);
  cyl(waterParts, '#a9dcf5', 1.15, 1.25, .1, WX, .05, WZ + 1.5, 16);
  cyl(stoneParts, '#8f8474', 1.35, 1.45, .18, WX, .02, WZ + 1.5, 14);
  for (let i = 0; i < 9; i++) {
    const a = (i * 2.1) % 6.283, r = .35 + (i % 3) * .28;
    const g = new THREE.IcosahedronGeometry(.28 + (i % 3) * .08, 1); g.translate(WX + Math.cos(a) * r, .35 + (i % 4) * .22, WZ + 1.5 + Math.sin(a) * r * .7);
    mistParts.push(g);
  }

  // ---- lookout deck on the top rock, behind the telescope (telescope is at 485.6, 3.6, −1.1)
  const DX = 484.6, DZ = -2.35, DY = 3.72;
  for (let i = 0; i < 6; i++) box(woodParts, i % 2 ? '#b98a5c' : '#a87b4c', .42, .07, 1.5, DX - 1.1 + i * .44, DY, DZ);
  for (const s of [-1, 1]) { box(woodParts, '#8a5a2a', 2.6, .1, .12, DX, DY - .06, DZ + s * .75); }
  for (const [x, z] of [[DX - 1.2, DZ - .72], [DX + 1.2, DZ - .72], [DX - 1.2, DZ + .72], [DX + 1.2, DZ + .72]]) cyl(woodParts, '#8a5a2a', .055, .07, 1.0, x, DY + .5, z, 6);
  beam(ropeParts, '#d9c39a', [DX - 1.2, DY + 1.0, DZ - .72], [DX + 1.2, DY + 1.0, DZ - .72], .03);
  beam(ropeParts, '#d9c39a', [DX + 1.2, DY + 1.0, DZ - .72], [DX + 1.2, DY + 1.0, DZ + .72], .03);

  const wood = new THREE.Mesh(mergeMixed(woodParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 })); wood.castShadow = wood.receiveShadow = true; group.add(wood);
  const ropes = new THREE.Mesh(mergeMixed(ropeParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98 })); group.add(ropes);
  const stone = new THREE.Mesh(mergeMixed(stoneParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, flatShading: true })); stone.castShadow = stone.receiveShadow = true; group.add(stone);
  const water = new THREE.Mesh(mergeMixed(waterParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .18, transparent: true, opacity: .82 })); group.add(water);
  const mistM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .9, transparent: true, opacity: .42, depthWrite: false });
  const mist = new THREE.Mesh(mergeMixed(mistParts), mistM); group.add(mist);

  return { group, added: { rails: 2, cliffs: 2, waterfall: 1, lookoutDeck: 1 } };
}

// ===================================================================
// (stage 7) The Adventure Park backdrop: the old skyline was 29 smooth
// pastel spheres squashed flat — soft blobs with a painted-on colour and
// no surface at all. These are now sculpted landforms: every hill is a
// displaced sphere (three octaves of ridge noise, flattened base) with
// baked vertex colours (grass, dry crown, rock scars) and a real normal
// map, all merged into ONE mesh so the whole range costs a single draw
// call instead of 29. Behind it sits a second, taller mountain ridge so
// the horizon has depth instead of ending at a row of blobs.
// ===================================================================
function ridgeNoise(x, z, oct = 4) {
  let n = 0, a = .5, f = 1;
  for (let o = 0; o < oct; o++) {
    n += a * Math.sin(x * f * 1.7 + Math.cos(z * f * 1.3) * 2.1) * Math.cos(z * f * 1.9 + Math.sin(x * f * .7) * 1.4);
    a *= .5; f *= 2.13;
  }
  return n;
}
let HILL_NRM = null;
function hillNormalMap() {
  if (HILL_NRM) return HILL_NRM;
  const S = 128, h = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) h[y * S + x] = ridgeNoise(x / S * 9, y / S * 9);
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = h[y * S + ((x + 1) % S)] - h[y * S + ((x - 1 + S) % S)];
    const dy = h[((y + 1) % S) * S + x] - h[((y - 1 + S) % S) * S + x];
    const l = Math.hypot(dx * 3, dy * 3, 1), k = (y * S + x) * 4;
    img.data[k] = (-dx * 3 / l * .5 + .5) * 255; img.data[k + 1] = (dy * 3 / l * .5 + .5) * 255;
    img.data[k + 2] = (1 / l * .5 + .5) * 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  t.repeat.set(7, 5); HILL_NRM = t; return t;
}

/** sculpted park hills + a hazy mountain range; one mesh each (2 draw calls total) */
export function buildParkHills({ add }) {
  const group = new THREE.Group(); group.name = 'park-hills'; add(group);
  const col = new THREE.Color();
  const hillParts = [];
  for (let i = 0; i < 29; i++) {
    const r = 7 + (i % 3) * 2, cx = 140 + i * 10, cz = (i >= 12 ? -31 : -21) - (i % 3) * 3;
    const base = ['#63ad72', '#559f66', '#74bb80'][i % 3];
    const g = new THREE.SphereGeometry(1, 34, 22);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const n = 1 + .16 * ridgeNoise(x * 2.4 + i, z * 2.4) + .07 * ridgeNoise(x * 5.6 - i, z * 5.6, 3);
      p.setXYZ(k, x * n, Math.max(y * n, -.22), z * n);
    }
    g.computeVertexNormals();
    const cols = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const grain = ridgeNoise(x * 6 + i * 3, z * 6);
      col.set(base).multiplyScalar(.9 + grain * .12);
      if (y > .6) col.lerp(new THREE.Color('#a8b98e'), Math.min(1, (y - .6) * 1.1)); // dry, stony crowns
      if (grain > .38 && y > .08) col.lerp(new THREE.Color('#8d9c8c'), .55);             // rock scars
      if (y < .02) col.multiplyScalar(.88);                                              // shaded foot
      cols[k * 3] = col.r; cols[k * 3 + 1] = col.g; cols[k * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.scale(r * 1.3, r * .62, r);
    g.translate(cx, -3, cz);
    hillParts.push(g);
  }
  const hills = new THREE.Mesh(mergeParts(hillParts), new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: .93, metalness: 0, normalMap: hillNormalMap(), normalScale: new THREE.Vector2(.55, .55),
  }));
  hills.name = 'park-hills-mesh'; hills.receiveShadow = false; group.add(hills);

  // the range behind: taller, cooler, softened by distance
  const mtnParts = [];
  for (let i = 0; i < 8; i++) {
    const r = 30 + (i % 3) * 9, cx = 96 + i * 46, cz = -136 - (i % 3) * 12, hgt = 15 + (i % 3) * 5;
    const g = new THREE.SphereGeometry(1, 32, 20);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const rd = Math.abs(ridgeNoise(x * 3.1 + i * 2, z * 3.1)) * .5 + Math.abs(ridgeNoise(x * 7.3, z * 7.3 + i)) * .22;
      const n = 1 + rd;
      p.setXYZ(k, x * n, Math.max(y * n, -.3), z * n);
    }
    g.computeVertexNormals();
    const cols = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      const t = (y + .3) / 1.3;
      col.set('#5d87a0').lerp(new THREE.Color('#a7c6d6'), Math.max(0, t));
      if (t > .62) col.lerp(new THREE.Color('#eff7fa'), (t - .62) * 1.7);             // snow-pale caps
      col.multiplyScalar(.92 + ridgeNoise(x * 4, z * 4 + i) * .09);
      cols[k * 3] = col.r; cols[k * 3 + 1] = col.g; cols[k * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.scale(r, hgt, r * .72);
    g.translate(cx, -2, cz);
    mtnParts.push(g);
  }
  const mtn = new THREE.Mesh(mergeParts(mtnParts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  mtn.name = 'park-mountains'; group.add(mtn);
  return { group, added: { hills: 29, mountains: 8 } };
}
