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
import { toy, starGeometry } from './creatures.js';
import { NOTES } from './audio.js';

export const RAINBOW = ['#ff4f9a', '#ff9a2e', '#ffc21c', '#36c96b', '#2fa8ff', '#5b6cff', '#a15cff', '#ff7ad9'];
const boxGeoCache = {};
function rbox(w, h, d, r = .12) { const k = [w, h, d, r].join(); return boxGeoCache[k] || (boxGeoCache[k] = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2))); }
const matCache = {};
const M = (c, o) => { const k = c + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = toy(c, o)); };

export function buildWorld(G) {
  const { scene } = G;
  const add = (m, parent = scene) => { parent.add(m); return m; };
  function block(x, y, z, w, h, d, color, o = {}) { // y = bottom
    const m = new THREE.Mesh(rbox(w, h, d, o.r ?? .12), o.mat || M(color, o.m)); m.position.set(x, y + h / 2, z);
    m.castShadow = o.cast ?? true; m.receiveShadow = true; return add(m, o.parent);
  }
  function cyl(x, y, z, r1, r2, h, color, o = {}) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, o.seg || 32), o.mat || M(color, o.m)); m.position.set(x, y + h / 2, z); m.castShadow = o.cast ?? true; m.receiveShadow = true; return add(m, o.parent); }
  function sph(x, y, z, r, color, o = {}) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), o.mat || M(color, o.m)); m.position.set(x, y, z); m.castShadow = o.cast ?? true; return add(m, o.parent); }
  const plat = (a, b, y, o = {}) => { const p = { a, b, y, layer: o.layer || '', ...o }; G.platforms.push(p); return p; };
  // solid things in the creature's path: you can't walk through them (low ones you hop up onto by yourself)
  const solid = (a, b, top, o = {}) => { G.solids.push({ a, b, top, layer: o.layer || '' }); };
  const tap = (obj, fn, o = {}) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); if (o.paw) G.interact.push({ x: o.paw[0], y: o.paw[1], layer: o.layer || '', disc: o.disc, run: fn, hintY: o.hintY ?? 2 }); return obj; };

  // ---------- floor: glossy tiles, a different colour in each zone ----------
  const tileTex = (a, b) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 128, 128); g.fillStyle = b; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.strokeRect(0, 0, 128, 128); g.strokeRect(0, 0, 64, 64); g.strokeRect(64, 64, 64, 64); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const ZONES = [[-20, 51, '#ffb3dc', '#ff8fca'], [51, 92, '#ffe39a', '#ffcf6a'], [92, 135, '#cdb8ff', '#b39cff'], [135, 230, '#9fe8b4', '#7fdc9a']];
  // floor holes: the deep part of the ball pit (a shaft down to the secret underground) and the glass lift
  const HOLES = [[10.8, 14.4, -1.2, 1.2], [52.8, 54, -1.2, 1.2]];
  function floorPiece(x0, x1, z0, z1, c1, c2) {
    const t = tileTex(c1, c2); t.repeat.set((x1 - x0) / 2.4, (z1 - z0) / 2.4); t.offset.set(x0 / 2.4, -z1 / 2.4);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshPhysicalMaterial({ map: t, roughness: .35, clearcoat: .8, clearcoatRoughness: .15 }));
    f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); f.receiveShadow = true; add(f);
  }
  for (const [a, b, c1, c2] of ZONES) {
    const h = HOLES.find(([x0, x1]) => x0 > a && x1 < b);
    if (!h) { floorPiece(a, b, -12, 6, c1, c2); continue; }
    const [hx0, hx1, hz0, hz1] = h;
    floorPiece(a, hx0, -12, 6, c1, c2); floorPiece(hx1, b, -12, 6, c1, c2); floorPiece(hx0, hx1, -12, hz0, c1, c2); floorPiece(hx0, hx1, hz1, 6, c1, c2);
  }
  // front edge of the floor (a rounded rail, so the world has a nice edge)
  block(105, -.6, 4.6, 250, .6, .8, '#ffb8de', { r: .3, cast: false });

  // ---------- back walls ----------
  function wall(a, b, color, trim) {
    block((a + b) / 2, 0, -6.6, b - a, 9, .6, color, { r: .2, cast: false, m: { r: .6, cc: .2 } });
    block((a + b) / 2, 0, -6.1, b - a, .8, .3, trim, { r: .12, cast: false });
    block((a + b) / 2, 8.6, -6.1, b - a, .5, .4, trim, { r: .2, cast: false });
  }
  wall(-20, 51, '#ff9fd2', '#ffffff'); wall(51, 92, '#ffd98a', '#ff9fd2'); wall(92, 135, '#b89cff', '#ffd84a');
  // round windows + arches on the playhouse wall
  for (let x = -6; x < 50; x += 11) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.3, .18, 16, 40), M('#ffffff')); r.position.set(x, 5.6, -6.25); add(r); const g = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), new THREE.MeshBasicMaterial({ color: '#bfe8ff' })); g.position.set(x, 5.6, -6.28); add(g); }
  // paint splats on the studio wall, glass tubes in the lab
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(.5 + (i % 3) * .3, 20), new THREE.MeshBasicMaterial({ color: RAINBOW[i % 8] })); s.position.set(70 + i * 2.4, 7 - (i % 2) * .6, -6.28); add(s); }
  for (let x = 96; x < 134; x += 5) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 6, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: '#e6f8ff', transparent: true, opacity: .35, roughness: .05, clearcoat: 1, side: THREE.DoubleSide })); tube.position.set(x, 4, -5.8); add(tube); const liq = cyl(x, 1, -5.8, .3, .3, 2 + (x % 3), RAINBOW[(x / 5 | 0) % 8], { m: { em: RAINBOW[(x / 5 | 0) % 8], ei: .25, opacity: .8 }, cast: false }); liq.userData.bubble = x; }

  // ---------- party bulbs strung across (instanced, glowing) ----------
  const bulbPos = [];
  for (let a = -18; a < 230; a += 9) for (let i = 0; i <= 9; i++) { const k = i / 9, x = a + k * 9, y = 8.2 - Math.sin(k * Math.PI) * 1.2; bulbPos.push([x, y, -4.5]); }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.6 }), bulbPos.length);
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  bulbPos.forEach(([x, y, z], i) => { mtx.makeTranslation(x, y, z); bulbs.setMatrixAt(i, mtx); bulbs.setColorAt(i, col.set(['#ffe36e', '#ff9fd8', '#9fe6ff', '#c9a6ff'][i % 4])); });
  add(bulbs);

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
  // SLIDE TOWER: steps you jump up, a top deck, a twisty slide down
  [[18.4, 1.0], [19.7, 2.0], [21, 3.0]].forEach(([x, y], i) => { block(x, 0, -.2, 1.2, y, 1.8, ['#7fd8ff', '#ffd84a', '#b58cff'][i], { r: .18 }); plat(x - .6, x + .6, y); solid(x - .6, x + .6, y); });
  block(22.4, 0, -.2, 1.8, 3.8, 2, '#ff9fd2', { r: .2 }); plat(21.5, 23.3, 3.8, { z: -.4 }); solid(21.5, 23.3, 3.8);
  for (const x of [21.6, 23.2]) cyl(x, 3.8, -1, .07, .07, 1.4, '#ffffff');
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 6), M('#a15cff')); roof.position.set(22.4, 5.9, -.6); roof.castShadow = true; add(roof);
  G.slidePath = new THREE.CatmullRomCurve3([[23.3, 3.8, -.6], [24.6, 3.4, -1.2], [26.2, 2.6, -1.9], [27.4, 1.6, -2.3], [28.6, .8, -2.3], [30.2, .25, -2], [31.2, 0, -1.8]].map(p => new THREE.Vector3(...p)));
  const slideMesh = new THREE.Mesh(new THREE.TubeGeometry(G.slidePath, 80, .55, 16, false), new THREE.MeshPhysicalMaterial({ color: '#ffd84a', roughness: .2, clearcoat: 1, side: THREE.DoubleSide }));
  slideMesh.scale.y = 1; slideMesh.castShadow = true; slideMesh.receiveShadow = true; add(slideMesh);
  tap(slideMesh, () => G.startSlideTap(), { paw: [26, 0], disc: 'slide', hintY: 3.4 });
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
  [[87, 0, 1.2, '#ff9fd2'], [87, 1.2, 1.0, '#9fe6ff'], [87, 2.2, .8, '#ffe066']].forEach(([x, y, h, c]) => cyl(x, y, -.2, .75, .8, h, c));
  plat(86.3, 87.7, 3.0); solid(86.25, 87.75, 3.0);
  cyl(85.2, 0, -.2, .5, .55, 1.3, '#c9a6ff'); plat(84.7, 85.7, 1.3); solid(84.7, 85.7, 1.3);

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
  for (const x of [112, 116]) { cyl(x, 0, 0, .8, .9, .3, '#36c96b'); const top = cyl(x, .3, 0, .7, .7, .08, '#9ff7c8', { m: { em: '#36c96b', ei: .3 } }); plat(x - .8, x + .8, .38, { pad: true, top, step: true }); }
  block(120.5, 4.6, -.6, 7, .4, 2.4, '#c9a6ff', { r: .18 }); plat(117, 124, 5.0);
  for (const x of [117.4, 123.6]) cyl(x, 0, -1.5, .12, .12, 4.6, '#ffffff');
  // glowing orbs that zap sparkles
  G.orbs = [127, 130.5].map(x => { cyl(x, 0, -2, .5, .7, 1.2, '#5b2f8a'); const o = sph(x, 1.85, -2, .65, '#c9a6ff', { m: { em: '#a15cff', ei: .8, opacity: .85, irid: 1 } }); const orb = { x, o, zap: 0 }; tap(o, () => G.zapOrb(orb), { paw: [x, 0], disc: 'orb', hintY: 2.8 }); return orb; });

  // =================== ADVENTURE PARK ===================
  // soft hills and trees in the back
  for (let i = 0; i < 9; i++) { const h = sph(140 + i * 10, -3, -14 - (i % 3) * 3, 7 + (i % 3) * 2, ['#9be7b0', '#7fd99a', '#b4f0c4'][i % 3], { cast: false, m: { r: .8, cc: .1 } }); h.scale.y = .6; }
  const tree = (x, z, s = 1) => { cyl(x, 0, z, .22 * s, .3 * s, 2.2 * s, '#b06a32', { m: { r: .7, cc: .1 } }); [[0, 2.6, 0, 1.2], [-.7, 2.2, .2, .85], [.7, 2.3, -.1, .9], [0, 3.3, 0, .8]].forEach(([dx, dy, dz, r]) => sph(x + dx * s, dy * s, z + dz * s, r * s, ['#6fd38c', '#8fe3a3', '#5cc97c'][Math.abs(Math.round(dx * 10)) % 3], { m: { r: .6, cc: .3, sheen: .5 } })); };
  [[138, -4.5], [152, -5], [170, -4.2], [178, -5.5], [200, -4.8], [208, -3.8]].forEach(([x, z], i) => tree(x, z, 1 + (i % 2) * .3));
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
    const c = RAINBOW[i];
    const bodyM = sph(0, 1.3, 0, .55, c, { parent: ride }); bodyM.scale.set(1.3, .8, .7);
    sph(.68, 1.7, 0, .32, c, { parent: ride }); // head
    const hornM = new THREE.Mesh(new THREE.ConeGeometry(.08, .36, 12), M('#ffd84a')); hornM.position.set(.8, 2.05, 0); hornM.rotation.z = -.4; ride.add(hornM);
    sph(-.7, 1.4, 0, .18, '#fff3a6', { parent: ride }); // tail puff
    const seat = new THREE.Object3D(); seat.position.set(0, 1.62, 0); ride.add(seat);
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
  const booth = block(167.5, 0, -2.4, 2.2, 2, 2, '#7fd8ff', { r: .3 }); plat(166.4, 168.6, 2.0, { z: -2.2 });
  const awn = new THREE.Mesh(new THREE.ConeGeometry(1.7, .8, 4), M('#ff65b5')); awn.position.set(167.5, 2.4, -2.4); awn.rotation.y = Math.PI / 4; add(awn);
  tap(fw, () => G.rideWheel(), { paw: [160, 0], disc: 'wheel', hintY: 2.5 });
  // BOUNCY MUSHROOM up to a tree branch
  cyl(174, 0, -1.8, .3, .4, 1.1, '#fff3e0'); const cap = sph(174, 1.1, -1.8, 1.1, '#ff4f9a', { m: { r: .3 } }); cap.scale.y = .5;
  for (let i = 0; i < 5; i++) sph(174 + Math.cos(i * 1.3) * .7, 1.45, -1.8 + Math.sin(i * 1.3) * .7, .14, '#ffffff', { cast: false });
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
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(3 - i * .3, .2, 12, 40, Math.PI), M(RAINBOW[i])); t.position.set(205, 0, -1.5); t.rotation.y = Math.PI / 2; add(t); }

  // =================== FLUFFKIN HOUSE (inside, at x 1000) ===================
  const IN = { ox: 1000, w: 30, f2: 4.4, slab: .3 };
  G.inside = { ...IN, exit: 1003, door: 190, ceil1: IN.f2 - IN.slab, ceil2: 8.8, stair: { x0: 1022.6, x1: 1028.2, y0: 0, y1: IN.f2, z: -2.4 } };
  const room = new THREE.Group(); add(room);
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
  G.fluffSpots = [[22.4, 3.8, -.2], [44, -6, -.3], [87, 3.0, -.2], [121, 5.0, -.4], [167.5, 2.0, -2.2], [178.6, 3.65, -1.7]];
  G.secretStar = [12, 3.2];
}
function rand(a, b) { return a + Math.random() * (b - a); }
