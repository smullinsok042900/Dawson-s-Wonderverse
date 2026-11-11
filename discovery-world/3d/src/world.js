// ===================================================================
// world.js: the ONE connected 3D world, left to right:
//   Mega Playhouse (ball pit, slide tower, trampoline, climbing blocks)
//   → Imagination Studio (giant paint wall, walk-on xylophone)
//   → Wonder Lab (bubble machine, colour buckets, spring pads, glow orbs)
//   → Adventure Park (carousel, Ferris wheel, bouncy mushroom, trees)
//   → the Fluffkin House (walk inside: two floors, stairs, a nursery).
// Gameplay runs along a lane at z = 0; everything else is real 3D scenery.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toy, starGeometry } from './creatures.js';
import { NOTES } from './audio.js';
import { STATIONS } from './train.js';
import { plush, quadSpec } from './critterkit.js';
import { lawnTextures, cobbleTextures, leafNormal, leafDetail, barkTextures, plasterNormal, scatterNature, grassField, makeTree, makeRock, terrainH } from './nature.js';
const STATION_XS = STATIONS.map(s => s.x);

export const RAINBOW = ['#ff4f9a', '#ff9a2e', '#ffc21c', '#36c96b', '#2fa8ff', '#5b6cff', '#a15cff', '#ff7ad9'];
const boxGeoCache = {};
function rbox(w, h, d, r = .12) { const k = [w, h, d, r].join(); return boxGeoCache[k] || (boxGeoCache[k] = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2))); }
const matCache = {};
const M = (c, o) => { const k = c + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = toy(c, o)); };

export function buildWorld(G) {
  const { scene } = G;
  const add = (m, parent = scene) => { parent.add(m); return m; };
  // a soft dark patch on the floor where things stand (makes objects look grounded, like real contact shadows)
  const aoTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(40,10,60,.55)'); gr.addColorStop(.6, 'rgba(40,10,60,.22)'); gr.addColorStop(1, 'rgba(40,10,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const aoMat = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  function ao(x, z, w, d, y = 0, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), aoMat); m.rotation.x = -Math.PI / 2; m.position.set(x, y + .012, z); m.renderOrder = 1; add(m, parent); }
  G.aoTex = aoTex;
  function block(x, y, z, w, h, d, color, o = {}) { // y = bottom
    const m = new THREE.Mesh(rbox(w, h, d, o.r ?? .12), o.mat || M(color, o.m)); m.position.set(x, y + h / 2, z);
    m.castShadow = o.cast ?? true; m.receiveShadow = true; if ((y === 0 || o.aoY != null) && h > .3 && !o.noAO && !o.parent) ao(x, z, w * 1.5 + .4, d * 1.5 + .4, o.aoY ?? 0); return add(m, o.parent);
  }
  function cyl(x, y, z, r1, r2, h, color, o = {}) { if (y === 0 && h > .3 && !o.parent) ao(x, z, r2 * 3.2, r2 * 3.2); const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, o.seg || 32), o.mat || M(color, o.m)); m.position.set(x, y + h / 2, z); m.castShadow = o.cast ?? true; m.receiveShadow = true; return add(m, o.parent); }
  function sph(x, y, z, r, color, o = {}) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), o.mat || M(color, o.m)); m.position.set(x, y, z); m.castShadow = o.cast ?? true; return add(m, o.parent); }
  const plat = (a, b, y, o = {}) => { const p = { a, b, y, layer: o.layer || '', ...o }; G.platforms.push(p); return p; };
  // solid things in the creature's path: you can't walk through them (low ones you hop up onto by yourself)
  const solid = (a, b, top, o = {}) => { G.solids.push({ a, b, top, layer: o.layer || '' }); };
  const tap = (obj, fn, o = {}) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); if (o.paw) G.interact.push({ x: o.paw[0], y: o.paw[1], layer: o.layer || '', disc: o.disc, run: fn, hintY: o.hintY ?? 2 }); return obj; };

  // ---------- floor: glossy tiles, a different colour in each zone ----------
  const tileTex = (a, b) => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const tile = (x, y, col) => { const gr = g.createLinearGradient(x, y, x + 128, y + 128); gr.addColorStop(0, col); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(x, y, 128, 128); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 4, y + 4, 120, 5); g.fillRect(x + 4, y + 4, 5, 120); g.fillStyle = 'rgba(80,20,90,.10)'; g.fillRect(x + 4, y + 119, 120, 5); g.fillRect(x + 119, y + 4, 5, 120); };
    tile(0, 0, b); tile(128, 0, a); tile(0, 128, a); tile(128, 128, b);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${i % 2 ? '255,255,255' : '90,40,110'},${.03 + (i % 5) * .006})`; g.fillRect((i * 97) % 256, (i * 57) % 256, 2, 2); }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; for (const v of [0, 128, 256]) { g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 256); g.moveTo(0, v); g.lineTo(256, v); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const ZONES = [[-20, 51, '#ffb3dc', '#ff8fca'], [51, 92, '#ffe39a', '#ffcf6a'], [92, 135, '#cdb8ff', '#b39cff'], [135, 312, '#9fe8b4', '#7fdc9a'], [312, 356, '#c4e2ff', '#a9d3ff'], [356, 394, '#d9f2b4', '#c5e89c'], [394, 432, '#ffdcef', '#ffc9e4']];
  // floor holes: the deep part of the ball pit (a shaft down to the secret underground) and the glass lift
  const HOLES = [[10.8, 14.4, -1.2, 1.2], [52.6, 54.2, -3.2, -1.6]];
  // a normal map so each tile has softly rounded edges and grout lines that catch the light (made once, shared)
  const tileNormal = (() => {
    const N = 256, hgt = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const ex = Math.min(x % 128, 128 - x % 128), ey = Math.min(y % 128, 128 - y % 128), e = Math.min(ex, ey);
      const bevel = Math.min(1, Math.max(0, (e - 2) / 9)); // grout (0) rising over a rounded bevel to the tile top (1)
      hgt[y * N + x] = Math.sin(bevel * Math.PI / 2) + Math.sin(x * .31 + Math.sin(y * .23) * 2) * .012 + Math.sin(y * .37 + x * .05) * .01;
    }
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const h = (i, j) => hgt[((j + N) % N) * N + ((i + N) % N)], dx = (h(x + 1, y) - h(x - 1, y)) * 2.2, dy = (h(x, y + 1) - h(x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), k = (y * N + x) * 4;
      img.data[k] = (-dx / l * .5 + .5) * 255; img.data[k + 1] = (dy / l * .5 + .5) * 255; img.data[k + 2] = (1 / l * .5 + .5) * 255; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  })();
  const LAWN_FROM = 135, LAWN_TO = 394; // the outdoor part of the world is a real lawn (the castle courtyard keeps its tiles)
  function lawnPiece(x0, x1, z0, z1) {
    const L = lawnTextures(), map = L.map.clone(), nm = L.normal.clone();
    for (const t of [map, nm]) { t.repeat.set((x1 - x0) / 4, (z1 - z0) / 4); t.offset.set(x0 / 4, -z1 / 4); t.needsUpdate = true; }
    // build 16: the lawn follows the rolling meadow (a gently curved surface, not a flat sheet)
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.ceil(x1 - x0), Math.ceil((z1 - z0) * 1.5)); geo.rotateX(-Math.PI / 2); geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, terrainH(p.getX(i), p.getZ(i))); geo.computeVertexNormals(); }
    const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(.9, .9), roughness: .93 }));
    f.receiveShadow = true; add(f);
  }
  function floorPiece(x0, x1, z0, z1, c1, c2) {
    if (x0 >= LAWN_FROM && x1 <= LAWN_TO) return lawnPiece(x0, x1, z0, z1);
    const t = tileTex(c1, c2); t.repeat.set((x1 - x0) / 2.4, (z1 - z0) / 2.4); t.offset.set(x0 / 2.4, -z1 / 2.4);
    const nm = tileNormal.clone(); nm.repeat.copy(t.repeat); nm.offset.copy(t.offset);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshPhysicalMaterial({ map: t, normalMap: nm, normalScale: new THREE.Vector2(.9, .9), roughness: .35, clearcoat: .8, clearcoatRoughness: .15 }));
    f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); f.receiveShadow = true; add(f);
  }
  for (const [a, b, c1, c2] of ZONES) {
    const h = HOLES.find(([x0, x1]) => x0 > a && x1 < b);
    if (!h) { floorPiece(a, b, -12, 6, c1, c2); continue; }
    const [hx0, hx1, hz0, hz1] = h;
    floorPiece(a, hx0, -12, 6, c1, c2); floorPiece(hx1, b, -12, 6, c1, c2); floorPiece(hx0, hx1, -12, hz0, c1, c2); floorPiece(hx0, hx1, hz1, 6, c1, c2);
  }
  // a cobblestone path through the park, the meadow and the valley (where you walk)
  { const C = cobbleTextures(), x0 = LAWN_FROM, x1 = LAWN_TO, map = C.map, nm = C.normal; for (const t of [map, nm]) t.repeat.set((x1 - x0) / 3, 1);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 3), new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(1.1, 1.1), roughness: .82 }));
    path.rotation.x = -Math.PI / 2; path.position.set((x0 + x1) / 2, .006, 0); path.receiveShadow = true; add(path);
    for (const z of [-1.55, 1.55]) { const edge = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .07, .14), M('#fff6ea', { r: .6, cc: .2 })); edge.position.set((x0 + x1) / 2, .035, z); edge.receiveShadow = true; add(edge); } }
  // front edge of the floor (a rounded rail, so the world has a nice edge)
  block(144, -.6, 4.6, 328, .6, .8, '#ffb8de', { r: .3, cast: false }); block(370, -.6, 4.6, 124, .6, .8, '#ffb8de', { r: .3, cast: false });

  // ---------- back walls ----------
  const wallAO = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, map: (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(50,15,70,.32)'); gr.addColorStop(.45, 'rgba(50,15,70,.1)'); gr.addColorStop(1, 'rgba(50,15,70,0)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(c); })() });
  function wall(a, b, color, trim) {
    { const pm = toy(color, { r: .7, cc: .15 }), nm = plasterNormal().clone(); nm.repeat.set((b - a) / 3, 3); nm.needsUpdate = true; pm.normalMap = nm; pm.normalScale.set(.5, .5); block((a + b) / 2, 0, -6.6, b - a, 9, .6, color, { r: .2, cast: false, mat: pm }); }
    block((a + b) / 2, 0, -6.1, b - a, .8, .3, trim, { r: .12, cast: false });
    block((a + b) / 2, 8.6, -6.1, b - a, .5, .4, trim, { r: .2, cast: false });
    // soft shadow where the wall meets the floor (ambient occlusion), and under the ceiling trim
    const f = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 1.6), wallAO); f.rotation.x = -Math.PI / 2; f.position.set((a + b) / 2, .013, -5.15); f.renderOrder = 1; add(f);
    const u = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 1.4), wallAO); u.position.set((a + b) / 2, 7.9, -6.27); u.renderOrder = 1; add(u);
  }
  wall(-20, 51, '#ff9fd2', '#ffffff'); wall(51, 92, '#ffd98a', '#ff9fd2'); wall(92, 135, '#b89cff', '#ffd84a');
  // round windows + arches on the playhouse wall
  for (let x = -6; x < 50; x += 11) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.3, .18, 16, 40), M('#ffffff')); r.position.set(x, 5.6, -6.25); add(r); const g = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), new THREE.MeshBasicMaterial({ color: '#bfe8ff' })); g.position.set(x, 5.6, -6.28); add(g); }
  // paint splats on the studio wall, glass tubes in the lab
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(.5 + (i % 3) * .3, 20), new THREE.MeshBasicMaterial({ color: RAINBOW[i % 8] })); s.position.set(70 + i * 2.4, 7 - (i % 2) * .6, -6.28); add(s); }
  for (let x = 96; x < 134; x += 5) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 6, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: '#e6f8ff', transparent: true, opacity: .35, roughness: .05, clearcoat: 1, side: THREE.DoubleSide })); tube.position.set(x, 4, -5.8); add(tube); const liq = cyl(x, 1, -5.8, .3, .3, 2 + (x % 3), RAINBOW[(x / 5 | 0) % 8], { m: { em: RAINBOW[(x / 5 | 0) % 8], ei: .25, opacity: .8 }, cast: false }); liq.userData.bubble = x; }

  // ---------- party bulbs strung across (instanced, glowing) ----------
  const bulbPos = [];
  for (let a = -18; a < 420; a += 9) for (let i = 0; i <= 9; i++) { const k = i / 9, x = a + k * 9, y = 8.2 - Math.sin(k * Math.PI) * 1.2; bulbPos.push([x, y, -4.5]); }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.6 }), bulbPos.length);
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  bulbPos.forEach(([x, y, z], i) => { mtx.makeTranslation(x, y, z); bulbs.setMatrixAt(i, mtx); bulbs.setColorAt(i, col.set(['#ffe36e', '#ff9fd8', '#9fe6ff', '#c9a6ff'][i % 4])); });
  add(bulbs);
  const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  G.haloTex = haloTex;
  { const geo = new THREE.BufferGeometry(), pos = [], cols = []; bulbPos.forEach(([x, y, z], i) => { pos.push(x, y, z + .05); col.set(['#ffe36e', '#ff9fd8', '#9fe6ff', '#c9a6ff'][i % 4]); cols.push(col.r, col.g, col.b); });
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const halos = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.1, map: haloTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 })); add(halos); }

  // ---------- rainbow arches between zones ----------
  for (const x of [51, 92, 135]) {
    for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(5.6 - i * .32, .17, 12, 48, Math.PI), M(RAINBOW[i])); t.position.set(x, 0, -3.8); add(t); }
    cyl(x - 5.6, 0, -3.8, .5, .6, 1, '#ffffff'); cyl(x + 5.6, 0, -3.8, .5, .6, 1, '#ffffff');
  }
  // left boundary: a big playhouse wall
  block(-1.5, 0, -1, 1, 9, 12, '#ff9fd2', { r: .3 });

  // =================== MEGA PLAYHOUSE ===================
  // BALL PIT
  const PIT = { a: 8, b: 16 };
  block(8, 0, 0, .5, .9, 4.2, '#ff65b5', { r: .25 }); block(16, 0, 0, .5, .9, 4.2, '#ff65b5', { r: .25 });
  for (const x of [8, 16]) { solid(x - .25, x + .25, .9); plat(x - .25, x + .25, .9); }
  block(12, 0, -1.9, 8.5, .9, .5, '#ff65b5', { r: .25 }); block(12, 0, 1.9, 8.5, .55, .4, '#ffd84a', { r: .2 });
  const BALLS = 350, ballMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.24, 14, 10), toy('#ffffff', { r: .25, cc: 1 }), BALLS);
  ballMesh.castShadow = true; ballMesh.receiveShadow = true;
  const balls = [];
  for (let i = 0; i < BALLS; i++) { const deep = i >= 200; balls.push(deep ? { x: rand(11.1, 14.1), y: rand(-2.1, .5), z: rand(-.95, .95), vx: 0, vy: 0, vz: 0 } : { x: rand(8.5, 15.5), y: .24 + (i % 3) * .4, z: rand(-1.5, 1.5), vx: 0, vy: 0, vz: 0 }); ballMesh.setColorAt(i, col.set(['#65dcec', '#ffda68', '#b587ff', '#ff67ab', '#7be08a'][i % 5])); }
  add(ballMesh);
  G.pit = { a: PIT.a, b: PIT.b, balls, mesh: ballMesh };
  tap(ballMesh, () => G.splashPit(), { paw: [12, 0], disc: 'ballpit', hintY: 2.2 });
  // SLIDE TOWER (just behind the path, so you can always walk past it): jump up the steps to the top deck,
  // then walk off the deck into the big see-through TUBE SLIDE and whoosh down inside it
  const TZ = -1.9;
  [[18.4, 1.0], [19.7, 2.0], [21, 3.0]].forEach(([x, y], i) => { block(x, 0, TZ, 1.2, y, 1.6, ['#7fd8ff', '#ffd84a', '#b58cff'][i], { r: .18 }); plat(x - .66, x + .66, y, { z: TZ, step: true, stepMax: 1.1 }); }); // stairs you walk up by yourself (no jumping needed)
  block(22.4, 0, TZ, 1.8, 3.8, 2, '#ff9fd2', { r: .2 }); plat(21.5, 23.3, 3.8, { z: TZ, step: true, stepMax: 1.1 });
  for (const x of [21.6, 23.2]) cyl(x, 3.8, TZ - .8, .07, .07, 1.4, '#ffffff');
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 6), M('#a15cff')); roof.position.set(22.4, 5.9, TZ - .3); roof.castShadow = true; add(roof);
  G.slidePath = new THREE.CatmullRomCurve3([[23.2, 4.3, TZ], [24.4, 4.0, TZ - .4], [25.8, 3.3, TZ - 1.2], [26.6, 2.4, TZ - 2.0], [25.9, 1.6, TZ - 2.8], [26.9, .9, TZ - 3.0], [28.6, .55, TZ - 2.2], [30.2, .55, TZ - .9], [31.4, .55, TZ + .2]].map(p => new THREE.Vector3(...p)), false, 'catmullrom', .4);
  // the tube: see-through with rainbow stripes, so you can watch your creature whoosh down inside
  const stripeTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = 'rgba(190,240,255,.55)'; g.fillRect(0, 0, 256, 64); RAINBOW.slice(0, 6).forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 42 + 6, 0, 16, 64); }); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 1); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const slideMesh = new THREE.Mesh(new THREE.TubeGeometry(G.slidePath, 140, .95, 28, false), new THREE.MeshPhysicalMaterial({ map: stripeTex, transparent: true, opacity: .62, roughness: .08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  slideMesh.renderOrder = 2; add(slideMesh);
  for (const u of [0, 1]) { const p = G.slidePath.getPointAt(u), tg = G.slidePath.getTangentAt(u); const ring = new THREE.Mesh(new THREE.TorusGeometry(.98, .12, 12, 36), M('#ffd84a')); ring.position.copy(p); ring.lookAt(p.clone().add(tg)); ring.castShadow = true; add(ring); }
  for (let u = .12; u < .95; u += .16) { const p = G.slidePath.getPointAt(u); if (p.y > 1.2) cyl(p.x, 0, p.z, .09, .09, p.y - .9, '#ffffff'); }
  tap(slideMesh, () => G.startSlideTap(), { paw: [25.5, 0], disc: 'slide', hintY: 4.4 });
  // TRAMPOLINE
  cyl(34, 0, 0, 1.7, 1.8, .45, '#5b6cff'); const trampTop = cyl(34, .45, 0, 1.55, 1.55, .06, '#ff65b5', { m: { r: .3 } });
  plat(32.4, 35.6, .45, { tramp: true, step: true });
  G.tramp = trampTop;
  tap(trampTop, () => G.tapTramp(), { paw: [34, .5], disc: 'trampoline', hintY: 2.4 });
  // CLIMBING BLOCKS pyramid with a secret star on top
  [[38, 1.2], [39.6, 2.4], [41.2, 3.6], [42.8, 2.4], [44.4, 1.2]].forEach(([x, h], i) => { block(x, 0, -.4, 1.5, h, 2, RAINBOW[i * 2 % 8], { r: .2 }); plat(x - .75, x + .75, h); solid(x - .75, x + .75, h); });

  // =================== IMAGINATION STUDIO ===================
  // GIANT PAINT WALL (you paint on it with your finger)
  const pc = document.createElement('canvas'); pc.width = 1400; pc.height = 560; const pg = pc.getContext('2d');
  pg.fillStyle = '#fffaf2'; pg.fillRect(0, 0, 1400, 560);
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4;
  const paintMesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.6), new THREE.MeshStandardMaterial({ map: ptex, roughness: .8 }));
  paintMesh.position.set(61, 3.6, -3.2); paintMesh.receiveShadow = true; add(paintMesh);
  block(61, .6, -3.45, 14.8, 6.4, .3, '#ffc75a', { r: .15, cast: false });
  G.paint = { mesh: paintMesh, canvas: pc, ctx: pg, tex: ptex, x1: 53, x2: 69 };
  // paint pots
  RAINBOW.slice(0, 6).forEach((c, i) => { cyl(55 + i * 1.1, 0, -2.4, .32, .28, .5, '#ffffff'); cyl(55 + i * 1.1, .5, -2.4, .3, .3, .05, c, { cast: false }); });
  // WALK-ON XYLOPHONE (8 giant keys)
  G.xylo = [];
  for (let i = 0; i < 8; i++) {
    const x = 73 + i * 1.5, h = .22 + i * .03;
    const key = block(x, 0, 0, 1.36, h, 3.2 - i * .15, RAINBOW[i], { r: .1, m: { r: .2, em: RAINBOW[i], ei: 0 } });
    const k = { i, key, lit: 0, x };
    G.xylo.push(k);
    plat(x - .68, x + .68, h, { step: true, onLand: () => G.playKey(k), key: k });
    tap(key, () => G.playKey(k));
  }
  G.interact.push({ x: 78, y: 0, layer: '', disc: 'xylophone', run: () => G.playKey(G.xylo[2]), hintY: 1.6 });
  // a tall stack of paint jars (a Fluffkin waits on top)
  [[87, 0, 1.2, '#ff9fd2'], [87, 1.2, 1.0, '#9fe6ff'], [87, 2.2, .8, '#ffe066']].forEach(([x, y, h, c]) => cyl(x, y, -1.8, .75, .8, h, c));
  plat(86.3, 87.7, 3.0, { z: -1.7 });
  cyl(85.2, 0, -1.8, .5, .55, 1.3, '#c9a6ff'); plat(84.7, 85.7, 1.3, { z: -1.7 }); // (behind the path: jump up the jars)

  // =================== WONDER LAB ===================
  // BUBBLE MACHINE
  const bm = new THREE.Group(); bm.position.set(99, 0, -2.4); add(bm);
  block(0, 0, 0, 3, 2.6, 2.2, '#8a5ad8', { parent: bm, r: .35 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#dff6ff', transparent: true, opacity: .45, roughness: .02, clearcoat: 1, iridescence: 1 }));
  dome.position.y = 2.6; bm.add(dome);
  const wand = new THREE.Mesh(new THREE.TorusGeometry(.5, .08, 12, 32), M('#ffd84a')); wand.position.set(1.7, 2.2, .4); wand.rotation.y = Math.PI / 2; bm.add(wand);
  const btn = sph(0, 1.4, 1.15, .32, '#ff4f9a', { parent: bm, m: { em: '#ff4f9a', ei: .3 } });
  G.bubbleWand = wand;
  tap(bm, () => G.spawnBubbles(100.7, 2.2, -1), { paw: [99, 0], disc: 'bubbles', hintY: 3.6 });
  plat(97.5, 100.5, 2.6, { z: -2 }); // you can jump up and stand on the machine
  // three colour buckets: tap two to mix the bubble colour
  G.buckets = [['r', '#ff3b6b', 104], ['y', '#ffd23f', 105.6], ['b', '#3d9bff', 107.2]].map(([k, c, x]) => {
    const obj = add(new THREE.Group()); cyl(x, 0, -1.8, .55, .45, .8, '#ffffff', { parent: obj }); cyl(x, .8, -1.8, .5, .5, .06, c, { parent: obj, cast: false });
    tap(obj, () => G.tapBucket(k, c, x)); return { k, c, x, obj };
  });
  G.interact.push({ x: 105.6, y: 0, layer: '', disc: 'mix', run: () => G.tapBucket('y', '#ffd23f', 105.6), hintY: 1.8 });
  // spring pads up to a high shelf (Fluffkin + star bits up there)
  // (build 7) the second pad bounces higher and gently pushes you onto the shelf, so the purple Fluffkin is easy to reach
  for (const [x, b, nudge] of [[112, 15.5, 0], [115.4, 18, 2.4]]) { cyl(x, 0, 0, .8, .9, .3, '#36c96b'); const top = cyl(x, .3, 0, .7, .7, .08, '#9ff7c8', { m: { em: '#36c96b', ei: .3 } }); plat(x - .8, x + .8, .38, { pad: true, top, step: true, bounce: b, nudge }); }
  block(120.2, 4.6, -.6, 8, .4, 2.4, '#c9a6ff', { r: .18 }); plat(116.2, 124.2, 5.0);
  for (const x of [116.6, 123.8]) cyl(x, 0, -1.5, .12, .12, 4.6, '#ffffff');
  // glowing orbs that zap sparkles
  G.orbs = [127, 130.5].map(x => { cyl(x, 0, -2, .5, .7, 1.2, '#5b2f8a'); const o = sph(x, 1.85, -2, .65, '#c9a6ff', { m: { em: '#a15cff', ei: .8, opacity: .85, irid: 1 } }); const orb = { x, o, zap: 0 }; tap(o, () => G.zapOrb(orb), { paw: [x, 0], disc: 'orb', hintY: 2.8 }); return orb; });

  // =================== ADVENTURE PARK ===================
  // soft hills and trees in the back
  for (let i = 0; i < 29; i++) { const h = sph(140 + i * 10, -3, (i >= 12 ? -23 : -14) - (i % 3) * 3, 7 + (i % 3) * 2, ['#93cf9c', '#82c28e', '#a6dbb0'][i % 3], { cast: false, m: { r: .8, cc: .1 } }); h.scale.y = .6; }
  const BARK = barkTextures(), barkMat = new THREE.MeshStandardMaterial({ map: BARK.map, normalMap: BARK.normal, roughness: .85 });
  const leafMats = ['#5f9f50', '#6fae5a', '#548f4b', '#80b862'].map(c => new THREE.MeshPhysicalMaterial({ color: c, map: leafDetail().map, roughness: .8, sheen: .5, sheenColor: new THREE.Color('#e4f7c0'), normalMap: leafDetail().normal, normalScale: new THREE.Vector2(.7, .7) }));
  const tree = (x, z, s = 1) => makeTree(scene, x, z, s); // build 15: real branching trees
  [[138, -4.5], [152, -5], [170, -4.2], [178, -5.5], [200, -4.8], [223, -5.2], [238, -5.6], [249, -5], [256, -4.4], [262.5, -9], [274, -13.4], [283, -14], [292, -13.2], [300, -10.5], [270, -1.6], [312, -4.6], [319, -5.4], [345, -5], [351, -4.2], [308, -13], [338, -12]].forEach(([x, z], i) => tree(x, z, 1 + (i % 2) * .3));
  // GRASS (build 15): real blades in clumps, swaying in the wind (in chunks so off-screen grass isn't drawn)
  G.grassTime = { value: 0 };
  grassField(scene, { x0: 136, x1: 394, time: G.grassTime, ok: (x, z) => !(
    (Math.abs(x - 144) < 5.5 && z < -1 && z > -10.5) || (x > 271.5 && x < 300 && z < -2.4 && z > -11.4) || (x > 325.5 && x < 338.5 && z > -3.6) ||
    (z > 0 && STATION_XS.some(sx => Math.abs(x - sx) < 2.8)) || (x > 183.5 && x < 196.5 && z > -4.6) || (x > 260 && x < 271 && z > -6) || (Math.abs(x - 363.4) < 1.6 && z > -3.6)) });
  // natural rocks
  [[141, -9.5, .5], [168, -10.2, .7], [186, -8.8, .4], [214, -9.6, .6], [252, -10.4, .55], [305, -9.6, .7], [341, -8.9, .45], [359, -9.8, .6], [393, -9.2, .5], [181, 4.25, .22], [233, 4.2, .2], [318, 4.25, .24]].forEach(([x, z, sc]) => makeRock(scene, x, z, sc));
  // flowers and bushes everywhere on the lawns (kept off rides, paths and buildings)
  G.nature = scatterNature(scene, { x0: 136, x1: 393, ok: (x, z) => !(
    (Math.abs(x - 144) < 6 && z < -1 && z > -11) ||                // carousel
    (x > 156 && x < 165 && z < -3 && z > -11) ||                   // Ferris wheel
    (x > 183.5 && x < 196.5 && z > -4.8) ||                        // Fluffkin House
    (x > 260 && x < 301 && z < -1.8) ||                            // kart garage and race track
    (x > 206 && x < 236 && z > -4) ||                              // block builder and colouring corner
    (x > 325 && x < 339 && z > -3.8) ||                            // marble machine
    (x > 367 && x < 392 && z > -4.2) ||                            // Dottie and Tops
    (Math.abs(x - 363.4) < 1.8 && z > -3.8) ||                     // the dino nest
    (z > 0 && STATION_XS.some(sx => Math.abs(x - sx) < 2.8))) });  // train platforms
  // CAROUSEL
  const car = new THREE.Group(); car.position.set(144, 0, -5.4); add(car); // behind the path: tap it to ride
  cyl(0, 0, 0, 4.4, 4.6, .4, '#ff9fd2', { parent: car });
  const spin = new THREE.Group(); spin.position.y = .4; car.add(spin);
  cyl(0, 0, 0, .35, .35, 4.6, '#ffd84a', { parent: spin });
  const top = new THREE.Mesh(new THREE.ConeGeometry(5, 1.8, 32), M('#a15cff')); top.position.y = 5.5; top.castShadow = true; spin.add(top);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; sph(Math.cos(a) * 4.8, 4.62, Math.sin(a) * 4.8, .15, ['#ffe36e', '#ff9fd8'][i % 2], { parent: spin, m: { em: '#ffe36e', ei: 1 }, cast: false }); }
  const mounts = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, m = new THREE.Group(); m.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); m.rotation.y = -a; spin.add(m);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 4.6, 8), M('#ffffff')); pole.position.y = 2.3; m.add(pole);
    const ride = new THREE.Group(); m.add(ride);
    // build 16: sculpted carousel ponies (glossy painted, with a golden horn and a pastel mane)
    const c = ['#ff8fc8', '#ffb35c', '#ffd84a', '#6fd38c', '#6fb8ff', '#b28cff'][i], pony = new THREE.Group(); pony.position.y = .42; ride.add(pony);
    plush(pony, quadSpec({ scale: .82, body: '#fffafc', belly: '#fffafc', snoutCol: '#ffe6f2', hoof: '#ffd23f', horn: '#ffd23f', legLen: .42, neck: 1.05, tail: 'long', iris: '#8a4ae0', voxel: .03,
      extraPaints: (s2, hx2, hyy) => [{ type: 'limb', a: s2([hx2 - .35, hyy - .15, 0]), b: s2([hx2 - .02, hyy + .15, 0]), ra: .13 * .62, rb: .1 * .62, color: c, soft: .02 }, { type: 'sphere', c: s2([-.95, .75, 0]), r: .25 * .62, color: c, soft: .02 }] }),
      { fur: false, rough: .22, clearcoat: 1, lid: '#fffafc', iris: '#8a4ae0', mouth: false });
    const saddle = new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, .1, 20), M(c, { r: .4 })); saddle.scale.z = .75; saddle.position.set(-.05, 1.25, 0); ride.add(saddle);
    const seat = new THREE.Object3D(); seat.position.set(-.05, 1.36, 0); ride.add(seat);
    mounts.push({ m, ride, seat });
  }
  G.carousel = { group: car, spin, mounts, speed: .25 };
  tap(car, () => G.rideCarousel(), { paw: [144, 0], disc: 'carousel', hintY: 6.2 });
  // FERRIS WHEEL
  const fw = new THREE.Group(); fw.position.set(160, 7.5, -3.2); add(fw);
  for (const z of [-.6, .6]) { const leg = (s) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 8.6, 12), M('#ffffff')); l.position.set(s * 2.2, -3.9, z); l.rotation.z = s * .28; l.castShadow = true; fw.add(l); }; leg(-1); leg(1); }
  const wheel = new THREE.Group(); fw.add(wheel);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6.4, .16, 12, 80), M('#ff65b5')); wheel.add(rim);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(5.9, .08, 8, 80), M('#ffd84a')); wheel.add(rim2);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 6.4, 6), M('#ffffff')); s.rotation.z = i / 10 * Math.PI * 2; s.position.set(Math.sin(-i / 10 * Math.PI * 2) * 3.2, Math.cos(i / 10 * Math.PI * 2) * 3.2, 0); wheel.add(s); }
  sph(0, 0, 0, .6, '#ffd84a', { parent: wheel });
  const gondolas = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group(); fw.add(g);
    const cab = new THREE.Mesh(rbox(1.3, .9, 1.1, .25), M(RAINBOW[i % 8])); cab.position.y = -.75; cab.castShadow = true; g.add(cab);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(.7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#ffffff')); hood.position.y = .05; g.add(hood);
    const seat = new THREE.Object3D(); seat.position.set(0, -.35, .2); g.add(seat);
    gondolas.push({ g, seat, i });
  }
  G.wheel = { group: fw, wheel, gondolas, angle: 0, r: 6.4 };
  // build 16: a cute ticket kiosk (panelled walls, a framed window and counter, a striped scalloped awning, light bulbs)
  { const K = new THREE.Group(); K.position.set(167.5, 0, -2.4); add(K);
    const wall = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.9, 2, 4, .22), toy('#bfe6ff', { r: .55, cc: .3 })); wall.position.y = .95; wall.castShadow = wall.receiveShadow = true; K.add(wall);
    for (let i = 0; i < 6; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(.04, 1.5, .02), toy('#a8dbff', { r: .6 })); pl.position.set(-.9 + i * .36, .9, 1.005); K.add(pl); }
    const base = new THREE.Mesh(new RoundedBoxGeometry(2.4, .22, 2.2, 3, .08), toy('#ffffff', { r: .5 })); base.position.y = .11; K.add(base);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(1.3, .8, .12, 3, .06), toy('#ffffff', { r: .4 })); frame.position.set(0, 1.25, 1.0); K.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .62), new THREE.MeshPhysicalMaterial({ color: '#fff6c8', emissive: '#ffe08a', emissiveIntensity: .35, roughness: .1, clearcoat: 1 })); glass.position.set(0, 1.25, 1.065); K.add(glass);
    const counter = new THREE.Mesh(new RoundedBoxGeometry(1.5, .1, .4, 2, .04), toy('#ffd23f', { r: .35 })); counter.position.set(0, .82, 1.12); counter.castShadow = true; K.add(counter);
    // striped, scalloped awning
    const stripe = (() => { const cc = document.createElement('canvas'); cc.width = 256; cc.height = 64; const g = cc.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ff6fb5'; g.fillRect(i * 32, 0, 32, 64); } const t = new THREE.CanvasTexture(cc); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const awn = new THREE.Mesh(new THREE.CylinderGeometry(.2, 1.65, .7, 4, 1), new THREE.MeshStandardMaterial({ map: stripe, roughness: .7 })); awn.rotation.y = Math.PI / 4; awn.position.y = 2.25; awn.castShadow = true; K.add(awn);
    for (let i = 0; i < 12; i++) { const side = Math.floor(i / 3), k = (i % 3 - 1) * .7, sc = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toy(i % 2 ? '#ffffff' : '#ff6fb5', { r: .6 })); sc.rotation.x = Math.PI; const pos = [[k, 1.18], [1.18, k], [k, -1.18], [-1.18, k]][side]; sc.position.set(pos[0], 1.92, pos[1]); sc.scale.y = .6; K.add(sc); }
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), toy('#fff6b0', { em: '#ffd84a', ei: 1.1 })); b.position.set(-.9 + i * .3, 1.86, 1.25); K.add(b); }
    const sign = new THREE.Mesh(new THREE.CircleGeometry(.28, 28), new THREE.MeshBasicMaterial({ map: (() => { const cc = document.createElement('canvas'); cc.width = cc.height = 96; const g = cc.getContext('2d'); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(48, 48, 46, 0, 7); g.fill(); g.font = '60px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🎡', 48, 54); const t = new THREE.CanvasTexture(cc); t.colorSpace = THREE.SRGBColorSpace; return t; })() })); sign.position.set(0, 2.72, 0); sign.lookAt(167.5, 2.72, 10); K.add(sign); }
  plat(166.4, 168.6, 2.0, { z: -2.2 });
  tap(fw, () => G.rideWheel(), { paw: [160, 0], disc: 'wheel', hintY: 2.5 });
  // BOUNCY MUSHROOM up to a tree branch
  // build 16: a properly shaped toadstool: a curved stem with a skirt, a domed cap with gills underneath and raised spots
  { const stemPts = [[.0, 0], [.42, 0], [.36, .1], [.3, .4], [.28, .8], [.33, 1.05], [.0, 1.1]].map(([a, b]) => new THREE.Vector2(a, b)); const stem = new THREE.Mesh(new THREE.LatheGeometry(stemPts, 32), toy('#fff6ea', { r: .7, cc: .2, sheen: .5 })); stem.position.set(174, 0, -1.8); stem.castShadow = stem.receiveShadow = true; add(stem);
    const skirt = new THREE.Mesh(new THREE.TorusGeometry(.33, .05, 10, 32), toy('#fff6ea', { r: .7 })); skirt.rotation.x = Math.PI / 2; skirt.position.set(174, .78, -1.8); add(skirt);
    const gills = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), toy('#ffd9e8', { r: .8 })); gills.rotation.x = Math.PI / 2; gills.position.set(174, 1.1, -1.8); add(gills); }
  const capPts = [[0, .62], [.35, .6], [.7, .5], [.95, .32], [1.08, .12], [1.05, .02], [.9, 0]].map(([a, b]) => new THREE.Vector2(a, b));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 40), toy('#ff4f9a', { r: .32, cc: .9 })); cap.position.set(174, 1.08, -1.8); cap.castShadow = true; add(cap);
  for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = i < 1 ? 0 : .35 + (i % 3) * .2, sp = new THREE.Mesh(new THREE.SphereGeometry(.13 - (i % 3) * .02, 14, 8), toy('#ffffff', { r: .5 })); sp.scale.y = .45; const yy = 1.08 + .6 - rr * rr * .45; sp.position.set(174 + Math.cos(a) * rr, yy, -1.8 + Math.sin(a) * rr); add(sp); }
  plat(173, 175, 1.55, { pad: true, top: cap, bounce: 13, z: -1.6 });
  tree(178.5, -2.6, 1.25); block(178.6, 3.4, -1.8, 2.6, .25, 1.6, '#b06a32', { r: .1 }); plat(177.3, 179.9, 3.65, { z: -1.7 });

  // =================== FLUFFKIN HOUSE (outside) ===================
  const H = new THREE.Group(); H.position.set(190, 0, -2.2); add(H);
  block(0, 0, 0, 11, 6.5, 4, '#fff1b0', { parent: H, r: .4, m: { r: .5, cc: .4 } });
  const hroof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 3.6, 4), M('#ff65b5')); hroof.position.y = 8.3; hroof.rotation.y = Math.PI / 4; hroof.scale.z = .5; hroof.castShadow = true; H.add(hroof);
  const door = block(0, 0, 2.05, 1.9, 3.2, .3, '#a15cff', { parent: H, r: .5 });
  sph(.6, 1.6, 2.25, .1, '#ffd84a', { parent: H });
  for (const [x, y] of [[-3.4, 3.8], [3.4, 3.8], [-3.4, 1.4], [3.4, 1.4]]) { block(x, y, 2.02, 1.6, 1.3, .2, '#ffffff', { parent: H, r: .3 }); const g = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color: '#fff3a6', emissive: '#ffd76a', emissiveIntensity: .5 })); g.position.set(x, y + .65, 2.14); H.add(g); }
  G.houseWindows = H;
  tap(door, () => G.enterHouse(), {});
  // right edge of the world: a rainbow gate
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(3 - i * .3, .2, 12, 40, Math.PI), M(RAINBOW[i])); t.position.set(422, 0, -1.5); t.rotation.y = Math.PI / 2; add(t); }

  // =================== FLUFFKIN HOUSE (inside, at x 1000) ===================
  const IN = { ox: 1000, w: 30, f2: 4.4, slab: .3 };
  G.inside = { ...IN, exit: 1003, door: 190, ceil1: IN.f2 - IN.slab, ceil2: 8.8, stair: { x0: 1022.6, x1: 1028.2, y0: 0, y1: IN.f2, z: -2.4 } };
  const room = new THREE.Group(); add(room);
  block(1015, -4, -.6, 31.6, 4, 7.4, '#c98a5a', { parent: room, r: .1, cast: false }); // the house's foundations (no gap under the floor)
  const wallTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#ffe6f2'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#ffd1e8'; for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 14, 128); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 9), new THREE.MeshStandardMaterial({ map: wallTex, roughness: .8 })); backWall.position.set(1015, 4.5, -4.1); backWall.receiveShadow = true; room.add(backWall);
  block(1015, 0, -4, 30, 1.1, .2, '#ffffff', { parent: room, cast: false }); block(1015, IN.f2, -4, 30, 1.1, .2, '#ffffff', { parent: room, cast: false });
  for (const x of [999.6, 1030.4]) block(x, -.3, -1, .8, 9.4, 6.6, '#ffc6e6', { parent: room, r: .2 });
  const woodTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#e8a464'; g.fillRect(0, 0, 256, 64); g.fillStyle = 'rgba(150,80,30,.35)'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 16, 256, 2); for (let i = 0; i < 8; i++) g.fillRect(((i * 97) % 256), (i % 4) * 16, 2, 16); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const floor1 = new THREE.Mesh(new THREE.PlaneGeometry(30, 7), new THREE.MeshPhysicalMaterial({ map: woodTex, roughness: .35, clearcoat: .7 })); floor1.rotation.x = -Math.PI / 2; floor1.position.set(1015, 0, -.6); floor1.receiveShadow = true; room.add(floor1);
  // upstairs floor slab, with an opening at the back where the stairs come up
  const sx0 = G.inside.stair.x0 - .4, sx1 = 1030;
  block((1000 + sx0) / 2, IN.f2 - IN.slab, -.6, sx0 - 1000, IN.slab, 7, '#d48a4a', { parent: room, r: .06 });
  block((sx0 + sx1) / 2, IN.f2 - IN.slab, .6, sx1 - sx0, IN.slab, 4.6, '#d48a4a', { parent: room, r: .06 });
  const floor2 = new THREE.Mesh(new THREE.PlaneGeometry(30, 7), new THREE.MeshPhysicalMaterial({ map: woodTex, roughness: .35, clearcoat: .7 })); floor2.rotation.x = -Math.PI / 2; floor2.position.set(1015, IN.f2 + .005, -.6); floor2.receiveShadow = true; room.add(floor2);
  floor2.scale.x = 1; // (the opening is covered by the stairs' top step)
  block(1015, 8.8, -.6, 30, .3, 7, '#c98ae8', { parent: room, cast: false });
  plat(1000.5, 1029.5, IN.f2, { layer: 'in' });
  // the staircase (you walk it with the arrow buttons)
  const S = G.inside.stair, n = 14;
  for (let i = 0; i < n; i++) { const x = S.x0 + (S.x1 - S.x0) * (i + .5) / n, y = (S.y1) * (i + 1) / n; block(x, 0, S.z, (S.x1 - S.x0) / n + .02, y, 1.6, i % 2 ? '#f0b070' : '#e8a464', { parent: room, r: .04 }); block(x, y - .02, S.z + .1, (S.x1 - S.x0) / n - .04, .05, 1.2, '#ff6fae', { parent: room, r: .02, cast: false }); }
  for (let i = 0; i <= n; i += 2) { const x = S.x0 + (S.x1 - S.x0) * i / n, y = S.y1 * i / n; cyl(x, y, S.z + .8, .04, .04, 1.1, '#ffffff', { parent: room }); }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, Math.hypot(S.x1 - S.x0, S.y1), 10), M('#c8722e')); rail.position.set((S.x0 + S.x1) / 2, S.y1 / 2 + 1.1, S.z + .8); rail.rotation.z = -Math.atan2(S.x1 - S.x0, S.y1); room.add(rail);
  // ground floor: front door, sofa, fireplace, toy drum, rug
  block(1003, 0, -3.8, 2, 3.4, .3, '#a15cff', { parent: room, r: .5 }); sph(1003.6, 1.7, -3.6, .1, '#ffd84a', { parent: room });
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3, 40), M('#ffd45e', { r: .9, cc: 0 })); rug.rotation.x = -Math.PI / 2; rug.position.set(1012, .01, -1); rug.scale.y = .6; rug.receiveShadow = true; room.add(rug);
  block(1009.5, 0, -2.8, 3.6, .9, 1.4, '#a15cff', { parent: room, r: .35 }); block(1009.5, .9, -3.4, 3.6, 1, .4, '#b58cff', { parent: room, r: .2 });
  for (const x of [1008.4, 1010.6]) block(x, .9, -2.7, 1.4, .3, 1.1, '#c9a6ff', { parent: room, r: .15 });
  plat(1007.8, 1011.2, 1.1, { layer: 'in', step: true, bounce: 11, sofa: true, z: -2.4 });
  block(1015.5, 0, -3.5, 3, 3, .9, '#ff9fc0', { parent: room, r: .2 }); block(1015.5, .2, -3.05, 1.8, 1.6, .2, '#4a2a5a', { parent: room, r: .4, cast: false });
  G.fire = [0, 1, 2].map(i => { const f = new THREE.Mesh(new THREE.ConeGeometry(.28, .9, 12), new THREE.MeshStandardMaterial({ color: ['#ff9a2e', '#ffc21c', '#ff6fae'][i], emissive: ['#ff9a2e', '#ffc21c', '#ff6fae'][i], emissiveIntensity: 1.2 })); f.position.set(1015 + (i - 1) * .45, .65, -2.95); room.add(f); return f; });
  const drum = cyl(1020, 0, -1.6, .8, .8, 1, '#ff6fae'); room.add(drum); cyl(1020, 1, -1.6, .8, .8, .06, '#fff8ea', { parent: room, cast: false });
  tap(drum, () => G.tapDrum(), { paw: [1020, 0], layer: 'in', disc: 'fluffdrum', hintY: 2 });
  // upstairs: the nursery, a bed for each Fluffkin, and a spinning mobile
  G.beds = [];
  for (let j = 0; j < 6; j++) {
    const x = 1003.5 + j * 3, bed = new THREE.Group(); bed.position.set(x, IN.f2, -2.8); room.add(bed);
    block(0, 0, 0, 2.2, .6, 1.4, '#fff8ea', { parent: bed, r: .2 }); block(-1.05, 0, 0, .2, 1.4, 1.4, '#ffb35c', { parent: bed, r: .1 });
    const blanket = block(.25, .55, 0, 1.6, .18, 1.42, RAINBOW[j], { parent: bed, r: .08 });
    const slot = new THREE.Object3D(); slot.position.set(-.35, .65, .1); bed.add(slot);
    G.beds.push({ bed, slot, x: 1003.5 + j * 3, blanket });
    tap(bed, () => G.tapBed(j));
  }
  const mob = new THREE.Group(); mob.position.set(1011, 8.6, -1.6); room.add(mob);
  const mobArms = new THREE.Group(); mob.add(mobArms);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, s = new THREE.Mesh(starGeometry(.25, .12, .08, .04, 2), M(RAINBOW[i], { em: RAINBOW[i], ei: .3 })); s.position.set(Math.cos(a) * 1.1, -1, Math.sin(a) * 1.1); mobArms.add(s); }
  G.mobile = mobArms; tap(mob, () => G.tapMobile(), { paw: [1011, IN.f2], layer: 'in', disc: 'mobile', hintY: 3.4 });
  // windows with a view outside
  for (const [x, y] of [[1007, 2.4], [1024, 6.6], [1008, 6.6]]) { block(x, y - 1, -4, 2.6, 2, .15, '#ffffff', { parent: room, r: .2, cast: false }); const g = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: '#9fd8ff' })); g.position.set(x, y, -3.9); room.add(g); }
  // lamps: warm light inside
  for (const [x, y] of [[1008, 3.6], [1020, 3.6], [1012, 8]]) { const l = new THREE.PointLight('#ffe2b0', 18, 14, 1.6); l.position.set(x, y, 0); room.add(l); sph(x, y + .1, -1, .3, '#fff3a6', { parent: room, m: { em: '#ffe36e', ei: 1.2 }, cast: false }); }
  G.interiorGroup = room;

  // ---------- star bits ----------
  const bits = [];
  const line = (x0, x1, y, n) => { for (let i = 0; i < n; i++) bits.push([x0 + (x1 - x0) * i / (n - 1), y]); };
  const arc = (x0, x1, y0, h, n) => { for (let i = 0; i < n; i++) { const k = i / (n - 1); bits.push([x0 + (x1 - x0) * k, y0 + Math.sin(k * Math.PI) * h]); } };
  line(3, 7, 1, 4); arc(32.4, 35.6, 2.5, 2.5, 5); line(24, 30, 3.6, 5); arc(37, 45, 2, 3.2, 7); line(54, 68, 1.2, 9);
  line(73, 84, 1.6, 8); arc(110, 118, 2, 4.5, 7); line(118, 123.5, 6, 5); line(126, 132, 1, 5); arc(140, 148, 1.2, 1.5, 5);
  line(152, 168, 1, 9); arc(172, 179, 3, 3, 6); line(181, 186, 1, 4);
  G.bitSpots = bits;
  // where the six lost baby Fluffkins wait
  G.fluffSpots = [[22.4, 3.8, -1.9], [44, -6, -.3], [87, 3.0, -1.7], [121, 5.0, -.4], [167.5, 2.0, -2.2], [178.6, 3.65, -1.7]];
  G.secretStar = [12, 3.2];
}
function rand(a, b) { return a + Math.random() * (b - a); }
