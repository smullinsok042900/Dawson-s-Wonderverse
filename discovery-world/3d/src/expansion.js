// ===================================================================
// expansion.js (build 29): the world grows past the castle's rainbow gate (x 422) into four new connected
// neighbourhoods, one for each district, so the outdoor world is more than twice as long (to x 904):
//   🌉 Adventure Trail (430-548)  🧸 Toy Town (548-668)  🔬 Lab Gardens (668-788)  🖍️ Art Plaza (788-904)
// STREAMING: the ground, paths, trees and signposts are light and always there; each neighbourhood's toys and
// activities are BUILT only when you come near (one piece per frame, so the game never stalls), their shaders are
// prepared in the background before they appear (no first-sight freeze), and they are taken down again when you
// are far away. What you did there (gems, chests, stickers...) is kept in the save, not in the scene.
// Everything reuses the world's shared materials and shapes (no new shader programs).
// Every activity: one tap or one walk, a spoken line, a big reaction, nothing to read, no way to fail.
// ===================================================================
import { makeBatch, rocketParts, rocketGlass, shinyMat } from './spacekit.js';
import * as THREE from 'three';
import { toyHouses, makeSea, crates, hayBales, boulders } from './earthkit.js';
import { makeToyModel } from './toy-models.js';
import { SPECIES as LIFE, PET_KINDS as LIFE_PETS, creatureMesh, animate as lifeAnimate, populate } from './planet-life.js'; // (build 107) pets from the planets
import { PET_PICS } from './pet-pictures.js';
import { FAMILY_FRIEND_HOMES } from './family-friend-homes.js';
import { CRAFT_FRIEND_HOMES } from './craft-friend-homes.js';
import { STORY_FRIEND_HOMES } from './story-friends.js';
import { STORY_FRIEND_HOMES_2 } from './story-friends-2.js';
import { FAMILY_HOMES } from './family.js';
import { buildToyTownDetail, buildLabGardenDetail, buildArtPlazaDetail, buildSeasideDetail, buildWoodsDetail, buildFrostyDetail, buildFarmDetail, buildPierDetail, buildHillsDetail, buildTrailDetail } from './scenery-detail.js';

export const EXP = { x0: 424, x1: 940, xMin: -830 }; // (build 49: Balloon Hills, past the pier) // (build 43: both ends now lead up stairs into the sky) // (build 30: the world also grows to the LEFT of the Playhouse; build 35: on to the farm)
export const DISTRICTS = [
  { id: 'hills', icon: '🎈', name: 'Balloon Hills', x0: -800, x1: -668, home: -676, enter: -672, arrow: '⬅️' }, // (build 49)
  { id: 'pier', icon: '🌊', name: 'Ocean Pier', x0: -668, x1: -536, home: -544, enter: -540, arrow: '⬅️' }, // (build 38)
  { id: 'farm', icon: '🚜', name: 'Happy Farm', x0: -536, x1: -404, home: -412, enter: -408, arrow: '⬅️' }, // (build 35)
  { id: 'frosty', icon: '❄️', name: 'Frosty Peaks', x0: -404, x1: -272, home: -280, enter: -276, arrow: '⬅️' },
  { id: 'woods', icon: '🌲', name: 'Whispering Woods', x0: -272, x1: -150, home: -158, enter: -154, arrow: '⬅️' },
  { id: 'seaside', icon: '🏖️', name: 'Sunny Seaside', x0: -150, x1: -18, home: -30, enter: -26, arrow: '⬅️' },
  { id: 'trail', icon: '🌉', name: 'Adventure Trail', x0: 428, x1: 548, home: 436 },
  { id: 'toytown', icon: '🧸', name: 'Toy Town', x0: 548, x1: 668, home: 554 },
  { id: 'labgarden', icon: '🔬', name: 'Lab Gardens', x0: 668, x1: 788, home: 674 },
  { id: 'artplaza', icon: '🖍️', name: 'Art Plaza', x0: 788, x1: 904, home: 794 },
];
// (build 62: g10, g14 and g16 moved beside the pier, the igloo door and the tractor, not in front of them)
const GEMS = [['g1', 484.5, 4.7], ['g2', 540, .9], ['g3', 600, 6.2], ['g4', 644, 2.8], ['g5', 690, 1], ['g6', 756, 1.1], ['g7', 830, 2.7], ['g8', 898, .9], ['g9', -95, 5.4], ['g10', -120.6, 1], ['g11', -226, 1.9], ['g12', -259.5, .9], ['g13', -328, 6], ['g14', -384, .9], ['g15', -466, 4.6], ['g16', -518.5, .9], ['g17', -598, 3.4], ['g18', -652, .9], ['g19', -711, 6.1], ['g20', -771, .9]];
const NOTE = [262, 294, 330, 349, 392, 440, 494, 523];
const RB = ['#ff4f9a', '#ff9a2e', '#ffc21c', '#36c96b', '#2fa8ff', '#5b6cff', '#a15cff', '#ff7ad9'];
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];

// emoji pictures as sprites (one canvas texture per emoji, shared)
const emojiMats = new Map();
function emojiMat(e, shadow) {
  const k = e + (shadow ? '#s' : ''); if (emojiMats.has(k)) return emojiMats.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(e, 64, 72);
  if (shadow) { g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(40,30,62,.78)'; g.fillRect(0, 0, 128, 128); g.globalCompositeOperation = 'source-over'; } // (build 120: a real dark shadow on the iPhone too: Safari ignores canvas filters, so it showed the colour picture)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.SpriteMaterial({ map: t, depthWrite: false }); emojiMats.set(k, m); return m;
}
const pictureSign = (e, s = 1, shadow) => { const sp = new THREE.Sprite(emojiMat(e, shadow)); sp.scale.setScalar(s); return sp; };

// Physical toys keep cached mesh resources; picture signs and wall shadows stay decals.
const toyGeometries = new WeakSet(), toyMaterials = new WeakSet();
function setToySymbol(group, symbol) {
  const model = makeToyModel(symbol);
  model.traverse(o => { if (o.geometry) toyGeometries.add(o.geometry); for (const m of [].concat(o.material || [])) toyMaterials.add(m); });
  group.clear(); group.add(model); group.userData.toySymbol = symbol;
  return group;
}
// (build 144, the family's report: "weird animals that just hover") stand a toy model on the ground (or on y0): its lowest
// point touches it, wherever the model's own middle is
const _gb = new THREE.Box3();
function groundToy(o, y0 = 0) { const py = o.position.y; o.position.y = 0; o.updateMatrixWorld(true); _gb.setFromObject(o); const off = _gb.min.y - (o.parent ? o.parent.getWorldPosition(new THREE.Vector3()).y : 0); o.position.y = y0 - off; o.userData.groundY = o.position.y; return o; }
// (build 144, the family's request: "make the birds actually fly") A REAL FLYING BIRD: a body, head, beak and tail (one
// mesh) and two wings on hinges that really flap (bursts of flapping, then a glide with the wings held out). fly(x, y, z, dt)
// moves it there: it faces where it is going and leans (banks) into its turns, so it looks like it is flying, not sliding.
const BIRD_GEO = { body: new THREE.SphereGeometry(1, 12, 8), cone: new THREE.ConeGeometry(1, 1, 8), wing: new THREE.BoxGeometry(1, 1, 1) };
const BIRD_MATS = {}; const birdMat = col => BIRD_MATS[col] || (BIRD_MATS[col] = new THREE.MeshStandardMaterial({ color: col, roughness: .6 }));
function flyingBird(size = 1, col = '#ffffff', tip = '#3a3f4a') {
  const g = new THREE.Group(), b = makeBatch();
  b.put(BIRD_GEO.body, 0, 0, 0, col, [.34, .17, .16]); b.put(BIRD_GEO.body, .3, .08, 0, col, [.13, .12, .11]);
  b.put(BIRD_GEO.cone, .47, .07, 0, '#ffb02e', [.04, .12, .04], [0, 0, -Math.PI / 2]); b.put(BIRD_GEO.body, .36, .12, .07, '#22222a', .022); b.put(BIRD_GEO.body, .36, .12, -.07, '#22222a', .022);
  b.put(BIRD_GEO.cone, -.36, .02, 0, col, [.1, .22, .03], [0, 0, Math.PI / 2]);
  g.add(b.mesh(shinyMat()));
  const wings = [1, -1].map(sd => { const piv = new THREE.Group(); piv.position.set(.02, .06, sd * .1); const w = new THREE.Mesh(BIRD_GEO.wing, birdMat(col)); w.scale.set(.26, .025, .55); w.position.set(0, 0, sd * .29); piv.add(w);
    const t2 = new THREE.Mesh(BIRD_GEO.wing, birdMat(tip)); t2.scale.set(.18, .026, .16); t2.position.set(-.03, 0, sd * .5); piv.add(t2); g.add(piv); return { piv, sd }; });
  g.scale.setScalar(size); g.userData.dynamic = true;
  let ph = Math.random() * 10, bank = 0, yaw = 0; const last = new THREE.Vector3(NaN, 0, 0);
  g.userData.fly = (x, y, z, dt) => { ph += dt; const vx = x - last.x, vz = z - last.z, vy = y - last.y;
    if (last.x === last.x && (vx || vz)) { const ny = Math.atan2(-vz, vx); let d = ny - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); bank += (-d / Math.max(dt, .016) * .15 - bank) * Math.min(1, dt * 3); bank = Math.max(-.7, Math.min(.7, bank)); yaw += d; g.rotation.set(0, yaw, 0); g.rotateX(bank); g.rotateZ(Math.max(-.35, Math.min(.35, vy / Math.max(dt, .016) * .08))); }
    last.set(x, y, z); g.position.set(x, y, z);
    const flapping = (ph % 3.4) < 2, a = flapping ? Math.sin(ph * 13) * .75 : .18 + Math.sin(ph * 2) * .04; // (flap, flap, flap... then glide)
    for (const w of wings) w.piv.rotation.x = -w.sd * a; };
  return g;
}
function physicalToy(symbol, size = 1) {
  const group = setToySymbol(new THREE.Group(), symbol); group.scale.setScalar(size); return group;
}

// (build 125) a real little boat hull: a side profile with a raised, curved bow and a sloped stern, given width and rounded
// edges (the boats used to sit on plain rounded boxes, which looked like slabs on the water)
function boatHull(len, h, w) {
  const L = len / 2, sh = new THREE.Shape();
  sh.moveTo(-L, h); sh.lineTo(-L + .3, 0); sh.lineTo(L - .8, 0); sh.quadraticCurveTo(L - .05, 0, L + .25, h + .2); sh.lineTo(-L, h);
  const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelSize: .12, bevelThickness: .14, bevelSegments: 3, steps: 1, curveSegments: 8 });
  g.translate(0, 0, -w / 2); return g;
}
// (build 125) a slide CHUTE under a ride path: a U-shaped trough (with real thickness) swept along the path, its floor where
// her feet are (.62 under the path), held up by posts down to the ground. The sled run and the hill slide used to send her
// down through the empty air.
function chuteGeometry(path, R = .55, N = 48) {
  const prof = [], K = 9, open = 1.25, th = .07;
  for (let k = 0; k <= K; k++) { const a = -open + 2 * open * k / K; prof.push([Math.sin(a) * R, (1 - Math.cos(a)) * R]); }
  for (let k = K; k >= 0; k--) { const a = -open + 2 * open * k / K; prof.push([Math.sin(a) * (R + th), (1 - Math.cos(a)) * (R + th) - th]); }
  const M = prof.length, pos = [], idx = [], p = new THREE.Vector3(), t = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const u = i / N; path.getPointAt(u, p); path.getTangentAt(u, t); side.set(-t.z, 0, t.x).normalize(); if (side.lengthSq() < .5) side.set(0, 0, 1);
    up.crossVectors(side, t).normalize(); if (up.y < 0) up.negate();
    for (const [sx, sy] of prof) pos.push(p.x + side.x * sx + up.x * sy, p.y - .62 + side.y * sx + up.y * sy - .02, p.z + side.z * sx + up.z * sy);
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M, c2 = a + M, d = b + M; idx.push(a, c2, b, b, c2, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function chute(c, mat, path, color, postColor) {
  // one painted mesh (the shared shiny material: no new shader, no heavy glossy coat over a big part of the screen) and no
  // shadow: the trough and all its posts are a single draw
  const b = makeBatch(), g = chuteGeometry(path); b.put(g, 0, 0, 0, color); g.dispose();
  const p = new THREE.Vector3(), cyl = new THREE.CylinderGeometry(1, 1, 1, 8);
  for (let u = .12; u < .95; u += .2) { path.getPointAt(u, p); const h = p.y - .64; if (h < .5) continue; b.put(cyl, p.x, h / 2, p.z - .1, postColor, [.09, h, .09]); }
  cyl.dispose(); const m = b.mesh(shinyMat()); m.receiveShadow = true; c.add(m); return m;
}
export function initExpansion(G, api) {
  const { scene, Sound, world, player: P } = api, W = G.W;
  world.exp = world.exp || {}; const X = world.exp; X.gems = X.gems || []; X.stickers = X.stickers || []; X.chests = X.chests || 0; X.balloons = X.balloons || 0;
  const PHONE = api.MOBILE;
  // materials: the world's shared toy materials (with the same phone simplification the start-up pass applies)
  const mat = (c, o) => { const m = W.M(c, o); if (PHONE && m.isMeshPhysicalMaterial && m.clearcoat > 0 && m.clearcoat <= .4 && !(m.sheen > 0)) m.clearcoat = 0; return m; };
  const say = t => api.toast(t), disc = (id, msg) => api.discover(id, msg);

  // ---------- permanent, light scenery for the whole new stretch (ground is built by world.js) ----------
  // big soft hills far behind, so the new land doesn't end in nothing
  for (let x = 430; x < 910; x += 46) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mat(pick(['#9fdc9a', '#8fd18f', '#b1e3a3']), { r: .95, cc: 0 })); h.scale.set(28 + rnd(10), 10 + rnd(8), 14); h.position.set(x + rnd(20), -3, -42 - rnd(10)); h.receiveShadow = true; scene.add(h); }
  // trees along the back of the outdoor neighbourhoods
  for (const [a, b] of [[432, 546], [672, 786]]) for (let x = a + 4; x < b; x += 9 + rnd(6)) { const z = -8.5 - rnd(3); if (a === 672 && [682, 724, 766].some(gx => Math.hypot(x - gx, z + 11) < 7.5)) continue; /* (build 125: no tree growing through a greenhouse) */ api.makeTree(scene, x, z, .9 + Math.random() * .3); }
  for (let x = -268; x < -152; x += 6 + rnd(4)) api.makeTree(scene, x, -7.5 - rnd(4), 1 + Math.random() * .35); // (the woods: a real forest behind the path)
  for (let x = -532; x < -410; x += 13 + rnd(5)) api.makeTree(scene, x, -12 - rnd(3), 1 + Math.random() * .3); // (build 35: a few trees behind the farm fields)
  // the sea behind the beach (one big shared plane; it gently bobs)
  const seaW = makeSea(140, 60, 60, 18), sea = seaW.mesh; /* (build 53: rolling waves instead of a flat blue sheet) */ sea.position.set(-86, .02, -38); scene.add(sea); G.sea = sea; { const head = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), mat('#7fcf7a', { r: .95, cc: 0 })); head.scale.set(9, 2.6, 22); head.position.set(-158, -1.2, -30); head.receiveShadow = true; scene.add(head); } /* (build 60: a grassy headland where the beach meets the woods, so the sea tucks behind it instead of ending in a straight cut) */
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(140, .9, 1, 1), mat('#ffffff', { r: .6, cc: 0 })); foam.rotation.x = -Math.PI / 2; foam.position.set(-86, .03, -8.2); scene.add(foam); G.foam = foam;
  // (build 43: the neighbourhood signposts were removed at the family's request: they overlapped activities, and the picture map
  //  and the train already show every place)

  function removeOwned(object) {
    object.removeFromParent();
    object.traverse(o => {
      if (o.isSprite) return;
      if (o.geometry && !W.isShared(o.geometry) && !toyGeometries.has(o.geometry) && !o.geometry.userData?.shared) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) if (m && !W.isSharedMat(m) && !toyMaterials.has(m) && m !== shinyMat()) { /* (build 117: never the shared paint, used by many things: freeing it rebuilt its shader on the way back) */ if (m.map) m.map.dispose(); m.dispose(); }
    });
  }

  // ---------- (build 43) RAINBOW CLOUD STAIRS at both ends of the world, up to a gate into the Sky Kingdom ----------
  // The world used to just stop. Now the path climbs a staircase of rainbow cloud steps (small enough to walk up, 0.4 m
  // each); at the top a rainbow arch takes you to the Sky Kingdom.
  const SKYGATE = [];
  for (const [start, dir] of [[908, 1], [-798, -1]]) { // (build 49: the left stairs moved out past Balloon Hills)
    for (let i = 0; i < 24; i++) { const x = start + dir * (i + .5), y = (i + 1) * .4; W.block(x, 0, 0, 1, y, 2.2, RB[i % RB.length], { r: .3, cast: false }); G.platforms.push({ a: x - .5, b: x + .5, y, layer: '', step: true, stepMax: .45, z: 0 }); }
    const top = start + dir * 24, land = [Math.min(top, top + dir * 8), Math.max(top, top + dir * 8)];
    W.block((land[0] + land[1]) / 2, 0, 0, 8, 9.6, 2.6, '#ffffff', { r: .5, cast: false }); G.platforms.push({ a: land[0], b: land[1], y: 9.6, layer: '', z: 0 });
    const gx = top + dir * 5;
    for (let i = 0; i < 6; i++) { const arc = new THREE.Mesh(new THREE.TorusGeometry(2.4 - i * .2, .12, 10, 36, Math.PI), mat(RB[i], { em: RB[i], ei: .3 })); arc.position.set(gx, 9.6, 0); arc.rotation.y = Math.PI / 2; scene.add(arc); }
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .1, 32), mat('#fff3a6', { em: '#ffd76a', ei: .8 })); pad.position.set(gx, 9.65, 0); scene.add(pad);
    SKYGATE.push({ x: gx, dir });
    G.interact.push({ x: start + dir * 2, y: 0, layer: '', disc: 'skystairs', run: () => say('🌈 Climb the rainbow stairs up into the sky!'), hintY: 1.4 });
  }
  function updateSkyGate() { if (P.layer !== '' || P.ride || P.y < 9) return; for (const g of SKYGATE) if (Math.abs(P.x - g.x) < .8) { disc('skystairs'); api.toSky && api.toSky(); return; } }

  // ---------- streaming ----------
  const S = DISTRICTS.map(d => ({ d, state: 'none', g: null, taps: [], inter: [], parts: null, step: 0, live: null, onceDone: false }));
  function makeCtx(st) {
    const g = st.g;
    const P2 = (o = {}) => ({ ...o, parent: g });
    const ctx = {
      g, mat, say, disc, Sound, P, world, X, burst: api.burst,
      block: (x, y, z, w, h, d, c, o) => W.block(x, y, z, w, h, d, c, P2(o)),
      cyl: (x, y, z, r1, r2, h, c, o) => W.cyl(x, y, z, r1, r2, h, c, P2(o)),
      sph: (x, y, z, r, c, o) => W.sph(x, y, z, r, c, P2(o)),
      add: o => { g.add(o); return o; },
      toy: (e, s, x, y, z) => { const sp = physicalToy(e, s); sp.position.set(x, y, z); g.add(sp); return sp; },
      sign: (e, s, x, y, z, shadow) => { const sp = pictureSign(e, s, shadow); sp.position.set(x, y, z); g.add(sp); return sp; },
      remove: removeOwned,
      // a tappable thing (also usable with the PAW button when you stand next to it)
      tap: (obj, fn, pawX, meta = {}) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); st.taps.push(obj); if (pawX != null) { const it = { x: pawX, y: 0, layer: '', run: fn, hintY: 2.4, icon: st.d.icon, label: st.d.name, ...meta }; G.interact.push(it); st.inter.push(it); } return obj; },
      // floor data (stays registered: it's tiny, and the ground must exist even before the toys appear)
      plat: (a, b, y, o) => { if (!st.onceDone) G.platforms.push({ a, b, y, layer: '', ...o }); },
    };
    return ctx;
  }
  const builders = {};
  // One small build part per resident keeps their shapes inside the district's normal frame budget.
  const familyParts = (c, district) => [...FAMILY_FRIEND_HOMES, ...STORY_FRIEND_HOMES, ...STORY_FRIEND_HOMES_2, ...FAMILY_HOMES, ...CRAFT_FRIEND_HOMES.filter(home => home.planet === 'earth')].filter(home => home.district === district)
    .map(home => () => lifeHere(c, [[home.kind, home.x, home.z]]));
  function startBuild(st) {
    st.g = new THREE.Group(); st.g.name = 'district:' + st.d.id; st.taps = []; st.inter = []; st.step = 0; st.state = 'building';
    const ctx = makeCtx(st); st.ctx = ctx; st.parts = builders[st.d.id](ctx); st.updates = [];
  }
  function finishBuild(st) {
    st.onceDone = true; st.g.updateMatrixWorld(true); st.state = 'compiling';
    Promise.resolve(api.compile(st.g)).catch(() => { }).then(() => { if (st.state !== 'compiling') return; scene.add(st.g); st.state = 'ready'; if (api.warm) setTimeout(() => api.warm(st.g), 0); });
  }
  function unload(st) {
    // (shapes from the world's shared cache and sprite shapes are kept; this neighbourhood's own shapes and pictures are freed)
    if (st.g) removeOwned(st.g);
    for (const o of st.taps) { const i = G.taps.indexOf(o); if (i >= 0) G.taps.splice(i, 1); }
    for (const o of st.inter) { const i = G.interact.indexOf(o); if (i >= 0) G.interact.splice(i, 1); }
    st.g = null; st.taps = []; st.inter = []; st.state = 'none'; st.updates = [];
  }
  const NEAR = 95, FAR = 190;
  function stream(camX) {
    let busy = performance.now() + 3.5; // at most ~3.5 ms of building per frame
    for (const st of S) {
      const d = st.d, dist = camX < d.x0 ? d.x0 - camX : camX > d.x1 ? camX - d.x1 : 0;
      if (st.state === 'none' && dist < NEAR) startBuild(st);
      if (st.state !== 'none' && dist > FAR && st.state !== 'compiling') unload(st);
      while (st.state === 'building' && performance.now() < busy) { const part = st.parts[st.step++]; if (!part) { finishBuild(st); break; } const u = part(st.ctx); if (typeof u === 'function') st.updates.push(u); }
    }
  }
  // build the nearest neighbourhood completely right now (when you travel straight into it)
  function buildNow(camX) { for (const st of S) { const d = st.d; if (camX >= d.x0 - 30 && camX <= d.x1 + 30 && st.state !== 'ready') { if (st.state === 'none') startBuild(st); while (st.state === 'building') { const part = st.parts[st.step++]; if (!part) { st.onceDone = true; st.g.updateMatrixWorld(true); scene.add(st.g); st.state = 'ready'; api.compile(st.g); break; } const u = part(st.ctx); if (typeof u === 'function') st.updates.push(u); } } } }

  // ---------- (build 30) PALS: creatures you befriend and keep (a crab at the seaside, a fox cub in the woods) ----------
  X.pals = X.pals || {};
  const PALS = { crab: { home: [-66, 0, -2.4], hello: '🦀 Pinchy the crab is your friend now! Tap Pinchy to stay or to follow.' }, fox: { home: [-262, 0, -2.6], hello: '🦊 Rusty the fox cub is your friend now! Tap Rusty to stay or to follow.' }, penguin: { home: [-372, 0, -2.4], hello: '🐧 Pebble the penguin is your friend now! Tap Pebble to stay or to follow.' }, robot: { home: [646, 0, -2.4], hello: '🤖 Bolt the toy robot is your friend now! Beep boop!' }, frog: { home: [678, 0, -2.2], hello: '🐸 Hoppy the frog is your friend now! Ribbit!' }, parrot: { home: [868, 0, -2.4], hello: '🦜 Kiwi the parrot is your friend now! Hello, hello!' }, pig: { home: [-448, 0, -2.4], hello: '🐷 Truffle the piglet is your friend now! Oink oink!' }, seal: { home: [-584, .36, -2.3], hello: '🦭 Splash the seal is your friend now! Ar ar!' }, goat: { home: [494, 0, -2.4], hello: '🐐 Clover the goat is your friend now! Maa!' } };
  const PAL_EMOJI = { crab: '🦀', fox: '🦊', penguin: '🐧', robot: '🤖', frog: '🐸', parrot: '🦜', pig: '🐷', seal: '🦭', goat: '🐐' }, PAL_NAME = { crab: 'Pinchy', fox: 'Rusty', penguin: 'Pebble', robot: 'Bolt', frog: 'Hoppy', parrot: 'Kiwi', pig: 'Truffle', seal: 'Splash', goat: 'Clover' }, PAL_WHERE = { crab: 'at the beach', fox: 'in the woods', penguin: 'in the snow', robot: 'in Toy Town', frog: 'by the pond in the Lab Gardens', parrot: 'in the Art Plaza', pig: 'on the farm', seal: 'at the ocean pier', goat: 'on the Adventure Trail' };
  // (build 107) PETS FROM THE PLANETS join the same friends: befriended where they live (planet-life.js), then they can
  // follow her everywhere, like the Earth pals. At most 4 friends follow at once (to keep the game quick).
  const MAX_FOLLOW = 4;
  for (const k of LIFE_PETS) { const sp = LIFE[k]; PALS[k] = { home: null, planet: sp.planet === 'earth' ? null : sp.planet, hello: `${sp.emoji} ${sp.name} is your friend now!` }; PAL_EMOJI[k] = sp.emoji; PAL_NAME[k] = sp.name; PAL_WHERE[k] = sp.where; }
  function makePalMesh(kind) {
    if (LIFE[kind]) return creatureMesh(kind);
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    if (kind === 'crab') { const sh = new THREE.Mesh(new THREE.SphereGeometry(.38, 18, 12), mat('#ff5a3c', { r: .5 })); sh.scale.set(1.25, .62, 1); sh.position.y = .32; sh.castShadow = true; body.add(sh);
      for (const s2 of [-1, 1]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .26, 6), mat('#ff5a3c')); st.position.set(s2 * .14, .62, .18); body.add(st); const e = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), mat('#ffffff')); e.position.set(s2 * .14, .77, .18); body.add(e); const pp = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), mat('#2b1d3d')); pp.position.set(s2 * .14, .78, .25); body.add(pp);
        const cl = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), mat('#ff7a5c', { r: .5 })); cl.scale.set(1, .7, .7); cl.position.set(s2 * .58, .38, .18); body.add(cl); g.userData['claw' + s2] = cl;
        for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.03, .025, .32, 6), mat('#e0432a')); leg.position.set(s2 * .42, .14, -.15 + k * .15); leg.rotation.z = s2 * .9; body.add(leg); } } }
    else if (kind === 'robot') { const b = new THREE.Mesh(W.rbox(.55, .5, .45, .1), mat('#9fb8d8', { r: .35, m: .4 })); b.position.y = .45; b.castShadow = true; body.add(b);
      const h = new THREE.Mesh(W.rbox(.45, .35, .4, .1), mat('#c9d8ec', { r: .35, m: .4 })); h.position.y = .9; body.add(h); const scr = new THREE.Mesh(W.rbox(.04, .2, .3, .03), mat('#3b82f6', { em: '#7fd3ff', ei: .8 })); scr.position.set(.23, .9, 0); body.add(scr);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .25, 6), mat('#666')); ant.position.y = 1.18; body.add(ant); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), mat('#ff4f6a', { em: '#ff4f6a', ei: .8 })); bulb.position.y = 1.32; body.add(bulb); g.userData.bulb = bulb;
      for (const s2 of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 14), mat('#2b2d42')); w.rotation.x = Math.PI / 2; w.position.set(0, .14, s2 * .24); body.add(w); } }
    else if (kind === 'frog') { const b = new THREE.Mesh(new THREE.SphereGeometry(.32, 18, 12), mat('#4caf50', { r: .5 })); b.scale.set(1.2, .75, 1); b.position.y = .26; b.castShadow = true; body.add(b);
      for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), mat('#ffffff')); e.position.set(.16, .52, s2 * .16); body.add(e); const pp = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), mat('#2b1d3d')); pp.position.set(.24, .54, s2 * .16); body.add(pp); const lg = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), mat('#3e9142')); lg.scale.set(1.4, .5, .8); lg.position.set(-.18, .07, s2 * .26); body.add(lg); }
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(.12, .02, 6, 16, Math.PI), mat('#2b1d3d')); mouth.rotation.set(Math.PI / 2, 0, Math.PI / 2); mouth.position.set(.37, .27, 0); body.add(mouth); }
    else if (kind === 'parrot') { const b = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 12), mat('#2fbf4f', { r: .5 })); b.scale.set(1, 1.3, .9); b.position.y = .55; b.castShadow = true; body.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), mat('#ff4f4f', { r: .5 })); h.position.set(.08, .93, 0); body.add(h); const bk = new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 10), mat('#ffd23f')); bk.rotation.z = -Math.PI / 2; bk.position.set(.26, .9, 0); body.add(bk);
      for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), mat('#2b1d3d')); e.position.set(.18, .98, s2 * .1); body.add(e); const wg = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), mat('#3b82f6', { r: .5 })); wg.scale.set(.5, 1.2, .3); wg.position.set(-.04, .58, s2 * .24); body.add(wg); g.userData['wing' + s2] = wg; }
      const tl = new THREE.Mesh(new THREE.ConeGeometry(.08, .5, 8), mat('#ffd23f')); tl.rotation.z = Math.PI * .75; tl.position.set(-.25, .3, 0); body.add(tl); }
    else if (kind === 'penguin') { const b = new THREE.Mesh(new THREE.SphereGeometry(.34, 18, 12), mat('#2b2d42', { r: .6 })); b.scale.set(.9, 1.25, .9); b.position.y = .48; b.castShadow = true; body.add(b);
      const belly = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 12), mat('#ffffff', { r: .7 })); belly.scale.set(.75, 1.15, .6); belly.position.set(.13, .44, 0); body.add(belly);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(.07, .2, 10), mat('#ff9a1f')); beak.rotation.z = -Math.PI / 2; beak.position.set(.36, .74, 0); body.add(beak);
      for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), mat('#ffffff')); e.position.set(.27, .82, s2 * .11); body.add(e); const pp = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), mat('#2b1d3d')); pp.position.set(.31, .82, s2 * .11); body.add(pp);
        const ft = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), mat('#ff9a1f')); ft.scale.set(1.4, .4, .9); ft.position.set(.1, .04, s2 * .13); body.add(ft); const fl = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), mat('#2b2d42')); fl.scale.set(.5, 1.4, .3); fl.position.set(0, .5, s2 * .3); body.add(fl); g.userData['fl' + s2] = fl; } }
    else if (kind === 'goat') { const wt = '#f4efe6'; const b = new THREE.Mesh(new THREE.SphereGeometry(.32, 18, 12), mat(wt, { r: .85 })); b.scale.set(1.35, .95, .9); b.position.y = .55; b.castShadow = true; body.add(b); // (build 40) Clover the mountain goat
      const h = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 12), mat(wt, { r: .85 })); h.scale.set(1.2, 1, .9); h.position.set(.44, .82, 0); body.add(h); const sn = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), mat('#e8c9b8', { r: .7 })); sn.position.set(.62, .76, 0); body.add(sn);
      const beard = new THREE.Mesh(new THREE.ConeGeometry(.05, .18, 8), mat('#d9d2c4')); beard.rotation.x = Math.PI; beard.position.set(.56, .6, 0); body.add(beard);
      for (const s2 of [-1, 1]) { const horn = new THREE.Mesh(new THREE.ConeGeometry(.04, .2, 8), mat('#a8916f')); horn.position.set(.4, 1.02, s2 * .08); horn.rotation.z = .5; body.add(horn); const ear = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), mat('#e8dccb')); ear.scale.set(1.6, .5, .8); ear.position.set(.34, .9, s2 * .19); body.add(ear);
        const e = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), mat('#2b1d3d')); e.position.set(.58, .88, s2 * .09); body.add(e); }
      for (const [x, z] of [[.26, .14], [.26, -.14], [-.26, .14], [-.26, -.14]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .4, 8), mat(wt)); leg.position.set(x, .2, z); body.add(leg); const hoof = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .06, 8), mat('#5a4a3a')); hoof.position.set(x, .02, z); body.add(hoof); }
      const tail = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 8), mat(wt)); tail.rotation.z = 1.9; tail.position.set(-.44, .7, 0); body.add(tail); g.userData.tail = tail; }
    else if (kind === 'seal') { const gy = '#8f9fb3'; const b = new THREE.Mesh(new THREE.SphereGeometry(.32, 18, 12), mat(gy, { r: .35, cc: .6 })); b.scale.set(1.6, .8, .9); b.position.y = .28; b.castShadow = true; body.add(b); // (build 38) Splash the seal
      const h = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 12), mat(gy, { r: .35, cc: .6 })); h.position.set(.42, .58, 0); body.add(h); const sn = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), mat('#c9d3df', { r: .5 })); sn.position.set(.62, .52, 0); body.add(sn);
      const no = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), mat('#2b1d3d')); no.position.set(.71, .56, 0); body.add(no);
      for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), mat('#2b1d3d')); e.position.set(.56, .68, s2 * .1); body.add(e); const fl = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), mat('#7a8a9e')); fl.scale.set(1.2, .3, .7); fl.position.set(.1, .12, s2 * .3); body.add(fl); g.userData['fl' + s2] = fl; }
      const tail = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), mat('#7a8a9e')); tail.scale.set(.6, .3, 1.4); tail.position.set(-.55, .1, 0); body.add(tail); }
    else if (kind === 'pig') { const pk = '#ffa8c4'; const b = new THREE.Mesh(new THREE.SphereGeometry(.34, 18, 12), mat(pk, { r: .7 })); b.scale.set(1.3, 1, 1); b.position.y = .45; b.castShadow = true; body.add(b); // (build 35) Truffle the piglet
      const sn = new THREE.Mesh(new THREE.CylinderGeometry(.11, .12, .1, 14), mat('#ff86ac', { r: .6 })); sn.rotation.z = Math.PI / 2; sn.position.set(.47, .5, 0); body.add(sn);
      for (const s2 of [-1, 1]) { const ns = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), mat('#2b1d3d')); ns.position.set(.52, .5, s2 * .045); body.add(ns); const e = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), mat('#2b1d3d')); e.position.set(.38, .66, s2 * .13); body.add(e);
        const ear = new THREE.Mesh(new THREE.ConeGeometry(.09, .18, 10), mat('#ff86ac')); ear.position.set(.22, .82, s2 * .17); ear.rotation.x = s2 * .5; body.add(ear); }
      for (const [x, z] of [[.22, .16], [.22, -.16], [-.22, .16], [-.22, -.16]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .2, 8), mat(pk)); leg.position.set(x, .1, z); body.add(leg); }
      const tail = new THREE.Mesh(new THREE.TorusGeometry(.07, .022, 6, 14), mat('#ff86ac')); tail.position.set(-.46, .55, 0); body.add(tail); g.userData.curl = tail; }
    else { const b = new THREE.Mesh(new THREE.SphereGeometry(.32, 18, 12), mat('#ff8a3c', { r: .7 })); b.scale.set(1.35, .9, .9); b.position.y = .42; b.castShadow = true; body.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(.25, 18, 12), mat('#ff8a3c', { r: .7 })); h.position.set(.42, .7, 0); body.add(h); const sn = new THREE.Mesh(new THREE.ConeGeometry(.12, .25, 12), mat('#fff3e6', { r: .7 })); sn.rotation.z = -Math.PI / 2; sn.position.set(.68, .66, 0); body.add(sn);
      const no = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), mat('#2b1d3d')); no.position.set(.8, .67, 0); body.add(no);
      for (const s2 of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.09, .22, 10), mat('#ff8a3c')); ear.position.set(.38, .95, s2 * .13); body.add(ear); const e = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), mat('#2b1d3d')); e.position.set(.6, .76, s2 * .1); body.add(e); }
      const tail = new THREE.Mesh(new THREE.SphereGeometry(.18, 14, 10), mat('#ff8a3c', { r: .7 })); tail.scale.set(1.6, .7, .7); tail.position.set(-.55, .55, 0); body.add(tail); g.userData.tail = tail;
      const tip = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), mat('#fff3e6')); tip.position.set(-.82, .6, 0); body.add(tip);
      for (const [x, z] of [[.25, .14], [.25, -.14], [-.25, .14], [-.25, -.14]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .25, 6), mat('#4a2a1a')); leg.position.set(x, .13, z); body.add(leg); } }
    g.userData.body = body; return g;
  }
  // a friend that follows you lives outside the streamed neighbourhoods (so it can travel everywhere with you)
  const followers = {};
  function setFollow(kind, on) {
    if (on || X.pals[kind]) { X.pals[kind] = { follow: on }; api.saveSoon(); }
    if (on && !followers[kind]) { const m = makePalMesh(kind); m.position.set(P.x - 2, 0, .9); scene.add(m); followers[kind] = { m, hop: 0 }; G.taps.push(m); m.traverse(o => { o.userData.tap = () => { setFollow(kind, false); say(`${PAL_EMOJI[kind]} ${PAL_NAME[kind]} will wait ${PAL_WHERE[kind]}!`); }; }); }
    if (!on && followers[kind]) { scene.remove(followers[kind].m); const i = G.taps.indexOf(followers[kind].m); if (i >= 0) G.taps.splice(i, 1); delete followers[kind]; }
  }
  G.setPalFollow = setFollow; G.followerMeshes = () => Object.values(followers).map(f => f.m); // (tests)
  for (const k of Object.keys(PALS)) if (X.pals[k] && X.pals[k].follow) setFollow(k, true);
  G.followerCount = () => Object.keys(followers).length;
  let petBubble = null; // (build 127) the bubble her first friend floats in on a spacewalk (made once, kept)
  function updateFollowers(dt, t) {
    if (P.layer === 'deep') { // (build 127) OPEN SPACE: her first friend floats beside her on a spacewalk (in a bubble of its own); the others wait
      const W = G.deepWalk; let first = true;
      for (const k of Object.keys(followers)) { const m = followers[k].m;
        if (first && W) { first = false; const yaw = W.yaw || 0, tx = W.pos.x - Math.cos(yaw) * 1.6 - Math.sin(yaw) * .8, tz = W.pos.z + Math.sin(yaw) * 1.6 - Math.cos(yaw) * .8, ty = W.pos.y + .6 + Math.sin(t * 1.6) * .25;
          if (m.position.distanceTo(W.pos) > 12) m.position.set(tx, ty, tz); // (never lost: if it is far behind, it pops right back beside her)
          m.position.x += (tx - m.position.x) * Math.min(1, dt * 2.5); m.position.y += (ty - m.position.y) * Math.min(1, dt * 2.5); m.position.z += (tz - m.position.z) * Math.min(1, dt * 2.5);
          m.rotation.y = yaw + Math.sin(t * .7) * .4; m.rotation.z = Math.sin(t * 1.1) * .15; m.visible = true;
          if (!petBubble) { petBubble = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: '#cfeeff', transparent: true, opacity: .2, roughness: .05, depthWrite: false })); petBubble.userData.dynamic = true; scene.add(petBubble); }
          petBubble.visible = true; petBubble.position.copy(m.position).add(new THREE.Vector3(0, .5, 0)); petBubble.scale.setScalar(.95 + Math.sin(t * 3) * .03);
          if (LIFE[k]) lifeAnimate(k, m, t, false); }
        else m.visible = false; }
      if (first && petBubble) petBubble.visible = false; return; }
    if (petBubble) petBubble.visible = false;
    let slot = 0; for (const k of Object.keys(followers)) { const f = followers[k], m = f.m; slot++;
      const out = (P.layer === '' || P.layer === 'space') && !G.playerHidden && !(P.ride && P.ride.type === 'rocket'), aboard = !!(P.ride && P.ride.type !== 'rocket') /* (build 120: on a ride — the Ferris wheel, the zip line, a plane — they wait on the ground and run after her when she gets off; they used to float in the air beside her) */, tx = out && !aboard ? P.x - (P.facing || 1) * (1.6 + slot * 1.3) : m.position.x, ty = out && !aboard ? (P.grounded || f.lastGround == null ? (f.lastGround = Math.max(P.layer === 'space' ? -50 : 0, P.y - .1)) : f.lastGround) /* (build 120: when she jumps they stay where she last stood; they used to rise into the air under her) */ : (aboard && P.layer === '' ? 0 : m.position.y); /* (build 107: they come along to the planets too, riding in the rocket with her) */ /* (build 48: pets wait on the ground while you fly off in the rocket) */
      if (Math.abs(tx - m.position.x) > 25) m.position.x = tx; // (after a jump somewhere else, it arrives with you)
      const dx = tx - m.position.x; m.position.x += dx * Math.min(1, dt * 3); m.position.y += (ty - m.position.y) * Math.min(1, dt * 6); m.position.z += (1.5 + slot * .45 - m.position.z) * Math.min(1, dt * 3);
      const moving = Math.abs(dx) > .3; m.userData.body.position.y = moving ? Math.abs(Math.sin(t * 12 + slot)) * .12 : 0;
      if (k === 'crab') m.rotation.y = 0; else m.rotation.y = dx >= 0 ? 0 : Math.PI; if (k === 'penguin') { m.userData.body.rotation.z = moving ? Math.sin(t * 10) * .12 : 0; } if (k === 'parrot') { m.userData.body.position.y = .7 + Math.sin(t * 5) * .15; if (m.userData.wing1) { m.userData.wing1.rotation.x = Math.sin(t * 18) * .6; m.userData['wing-1'].rotation.x = -Math.sin(t * 18) * .6; } } if (m.userData.curl) m.userData.curl.rotation.y = t * 6; if (k === 'robot' && m.userData.bulb) m.userData.bulb.material.emissiveIntensity = .5 + Math.abs(Math.sin(t * 4)) * .8;
      if (f.play > 0) { f.play -= dt; m.userData.body.position.y = Math.abs(Math.sin(t * 11)) * .3; m.rotation.y = f.face; } // (build 41: playing with a friend)
      if (m.userData.tail) m.userData.tail.rotation.y = Math.sin(t * 6) * .4; if (LIFE[k]) lifeAnimate(k, m, t, moving); m.visible = (P.layer === '' || P.layer === 'in' || P.layer === 'space') && !(P.ride && P.ride.type === 'rocket'); }
    // (build 41) PALS PLAY TOGETHER: when two or more friends follow you and you stand still for a moment, now and then two
    // friends next to each other turn to face each other and hop about, with a little burst of hearts and a giggle.
    const ks = Object.keys(followers); still = P.layer === '' && Math.abs(P.vx) < .3 && !P.ride ? still + dt : 0;
    if (ks.length >= 2 && still > 2.5 && (playAt -= dt) <= 0) { playAt = 9 + Math.random() * 6; const i = rnd(ks.length - 1), a = followers[ks[i]], b = followers[ks[i + 1]];
      const right = a.m.position.x < b.m.position.x; a.face = right ? 0 : Math.PI; b.face = right ? Math.PI : 0; a.play = b.play = 1.6;
      api.burst((a.m.position.x + b.m.position.x) / 2, 1.1, (a.m.position.z + b.m.position.z) / 2, ['#ff8fc8', '#ffd1ec', '#fff'], 10, 1.6); Sound.giggle(); disc('palsplay', `💖 ${PAL_EMOJI[ks[i]]} and ${PAL_EMOJI[ks[i + 1]]} are playing together!`); }
  }
  let still = 0, playAt = 4;

  // ---------- gems (8 hidden around the new neighbourhoods; walk into one to collect it) ----------
  const gemObjs = [];
  for (const [id, x, y] of GEMS) { if (X.gems.includes(id)) continue; const s = physicalToy('💎', .8); s.position.set(x, y, 0); scene.add(s); gemObjs.push({ id, x, y, s }); }
  function updateGems(t) {
    for (let i = gemObjs.length - 1; i >= 0; i--) { const gm = gemObjs[i]; gm.s.position.y = gm.y + Math.sin(t * 3 + i) * .12; gm.s.rotation.z = Math.sin(t * 2 + i) * .2;
      if (Math.abs(P.x - gm.x) < .9 && P.layer === '' && P.y + .9 > gm.y - .8 && P.y < gm.y + .6) { scene.remove(gm.s); gemObjs.splice(i, 1); X.gems.push(gm.id); api.burst(gm.x, gm.y, 0, ['#9fe6ff', '#ffffff', '#c9a6ff'], 20, 3); Sound.twinkle(); Sound.chime();
        say(X.gems.length === GEMS.length ? '💎 You found ALL the gems! Amazing!' : `💎 A sparkly gem! ${X.gems.length} of ${GEMS.length}!`); disc('gem_' + gm.id); api.saveSoon(); } }
  }

  // =================== 🌉 ADVENTURE TRAIL ===================
  builders.trail = c => [
    ...familyParts(c, 'trail'),
    // (stage 17) bridge handrails, cliff strata, a waterfall with mist and a lookout deck
    () => { G.trailDetail = buildTrailDetail({ add: c.add }); },
    // a stream across the path, with a wooden bridge (walk across, or splash through the water)
    () => { const stream = makeSea(10.2, 13.6, 10, 14), w = stream.mesh; w.position.set(450, .035, -5.35); /* (build 62: ends at z 1.6, clear of the track) (build 64: as wide as the bridge, so no water shows on the path beside it) */ c.add(w); /* (build 60: the stream stops before the train track, z up to 2.3) */ /* (build 54: the stream ripples) */
      for (const x of [446.5, 449.5, 452.5]) c.block(x, 0, -6, 1.1, .3, 1.1, '#9a9a9a', { r: .4 }); /* (build 64: stepping stones further upstream, not under the railing) */
      { const b = makeBatch(), bx = new THREE.BoxGeometry(1, 1, 1); for (let i = 0; i < 20; i++) b.put(bx, 445.25 + i * .5, .07, 0, i % 2 ? '#a8703f' : '#bf8650', [.47, .12, 3.05]); for (const z of [-1.45, 1.45]) b.put(bx, 450, .14, z, '#8a5a2a', [10.1, .1, .14]); c.add(b.mesh(shinyMat())); } /* (build 64: a planked wooden bridge with edge beams, one mesh; it was a flat brown slab) */ for (const z of [-1.6]) { for (let x = 445.5; x <= 454.5; x += 1.5) c.cyl(x, 0, z, .07, .07, 1, '#8a5a2a'); c.block(450, .95, z, 10, .12, .14, '#b07a4a', { r: .05 }); } /* (build 62: one railing at the back; the front one stood over the track on screen) */
      let splash = 0; return (dt, t) => { if (Math.abs(P.x - 450) < 60) stream.update(t); const inW = P.layer === '' && P.x > 444 && P.x < 456 && P.y < 1.5; if (inW && Math.abs(P.vx) > 1 && (splash -= dt) < 0) { splash = .35; c.burst(P.x, .3, 1.5, ['#9fe6ff', '#ffffff'], 4, 1.4); } if (inW) disc('stream', 'A little stream with a wooden bridge!'); }; },
    // climbing rocks up to a lookout with a telescope
    () => { const RK = [[474, 477, 1.2], [478.5, 481.5, 2.4], [483, 486.5, 3.6]]; c.add(boulders(RK.map(([a, b, y]) => [(a + b) / 2, 0, -2.05, b - a, y, 1.8]))); for (const [a, b, y] of RK) c.plat(a, b, y, { z: -1.9 }); /* (build 124: the steps stand just behind her path, so she walks in front of them, never through them; she steps back onto them as she climbs) */
      const tele = new THREE.Group(); tele.position.set(485.6, 3.6, -1.8); c.add(tele);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, 1.2, 20), mat('#ffd23f', { r: .4 })); tube.rotation.z = 1.1; tube.position.y = 1.1; tube.castShadow = true; tele.add(tube);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 8), mat('#7a5230')); leg.position.y = .45; tele.add(leg);
      c.tap(tele, () => { if (P.y < 3) { c.say('🔭 Climb the rocks to look through the telescope!'); return; } c.disc('lookout'); c.say('🔭 What a view! I can see so far away!'); c.burst(485.6, 5, -1, ['#ffd23f', '#fff', '#9fe6ff'], 24, 3); Sound.chime(); }, 485.6); },
    // (build 118) THE ZIP LINE: from a wooden tower beside the lookout rocks, a long cable down over the treasure chests to a
    //  soft landing mat. Hold ▶ to zoom, ◀ to slow down; ▲ lifts your legs for the high stars, ▼ stretches down for the low
    //  ones; JUMP lets go (you float down gently). Five stars to catch on the way.
    () => { const T0 = new THREE.Vector3(489, 8.2, -1), T1 = new THREE.Vector3(528.5, 2.9, -1), D = T1.clone().sub(T0), b = makeBatch(), bx = new THREE.BoxGeometry(1, 1, 1), cy = new THREE.CylinderGeometry(1, 1, 1, 8);
      for (const [x, z] of [[487.2, -.2], [490.2, -.2], [487.2, -2], [490.2, -2]]) b.put(cy, x, 3.6, z, '#8a5a2a', [.13, 7.2, .13]);          // the tower's four legs
      b.put(bx, 488.7, 4.7, -1.1, '#bf8650', [3.4, .2, 2.2]); // the platform (one rock-step above the lookout)
      b.put(bx, 488.7, 5.75, -2.15, '#a8703f', [3.4, .1, .1]); b.put(bx, 488.7, 7.4, -2.15, '#e8902a', [3.8, .2, .4]); b.put(cy, 489, 8.4, -1, '#d8e0ea', [.09, .5, .09]);
            b.put(cy, T1.x + .3, 1.6, -1, '#d8e0ea', [.12, 3.2, .12]); b.put(cy, 529.5, .12, 0, '#7fe0a0', [1.9, .24, 1.9]); b.put(cy, 529.5, .26, 0, '#b8f5c8', [1.6, .06, 1.6]); // low post and the soft landing mat
      b.put(cy, (T0.x + T1.x) / 2, (T0.y + T1.y) / 2, -1, '#ffffff', [.035, D.length(), .035], [0, 0, Math.atan2(-D.x, D.y)]);              // the cable
      c.add(b.mesh(shinyMat())); c.plat(486.5, 490.9, 4.8, { z: -1.1 });                                                                   // the platform
      const handle = new THREE.Mesh(new THREE.TorusGeometry(.3, .06, 6, 16), mat('#ff4f6a', { r: .3 })); handle.userData.dynamic = true; c.add(handle);
      const home = () => { handle.position.copy(T0); handle.position.y -= .45; }; home();
      const starG = new THREE.OctahedronGeometry(.32, 0);
      const stars = [[.18, 1], [.34, -1], [.5, 1], [.66, -1], [.82, 1]].map(([f, hi]) => { const sb = makeBatch(); sb.put(starG, 0, 0, 0, '#ffd23f', [1, 1.3, 1]); const m = sb.mesh(shinyMat()); /* (build 118: the shared paint: no new shader) */ m.userData.dynamic = true; const p = T0.clone().addScaledVector(D, f); m.position.set(p.x, p.y - .8 + hi * .55, -1); c.add(m); return { m, f, hi, got: false }; });
      let R = null, floatDown = false, ready = 0;
      const start = () => { if (P.layer !== '' || P.ride || Math.abs(P.x - 489) > 2.2 || P.y < 4.5) { if (!P.ride) c.say('🪜 Climb up the tower beside the lookout rocks, then grab the zip line!'); return; }
        c.disc('zipline', '🪢 The zip line! Climb the tower and grab the handle!'); c.say('🪢 Hold on! ▶ to zoom, ◀ to slow down, ▲ ▼ to catch the stars, JUMP to let go!'); Sound.whoosh && Sound.whoosh();
        R = { type: 'zipline', t: 0, noExit: true, stick: true, f: 0, v: .035, lift: 0, n: 0 }; R.onJump = () => { if (R && R.f > .08) R.letGo = true; }; P.ride = R; P.vx = P.vy = 0; for (const q of stars) { q.got = false; q.m.visible = true; } };
      c.tap(handle, start, 489, { y: 4.8, icon: '🪢', label: 'Zip line', action: 'Zip!', disc: 'zipline' });
      return (dt, t) => { for (const q of stars) if (!q.got) q.m.rotation.y = t * 2;
        if (floatDown) { if (P.ride || P.grounded || P.layer !== '') floatDown = false; else P.vy = Math.max(P.vy, -3); }
        if (!R) return; if (P.ride !== R) { R = null; home(); return; }
        const st = api.stick ? api.stick() : { x: 0, y: 0 }; dt = Math.min(dt, .1); R.t += dt;
        R.v += ((st.x > .3 ? .075 : st.x < -.3 ? .018 : .04) - R.v) * Math.min(1, dt * 2); R.f = Math.min(1, R.f + R.v * dt);                 // (▶ zoom, ◀ slow; it never stops)
        R.lift += ((st.y > .3 ? .9 : st.y < -.3 ? -.9 : 0) - R.lift) * Math.min(1, dt * 6);
        handle.position.copy(T0).addScaledVector(D, R.f); handle.position.y -= .45; P.x = handle.position.x; P.y = handle.position.y - 1.45 + R.lift * .6; /* (build 120: her hands on the handle; it was a metre above her head) */ P.z = -1; P.facing = 1; P.vx = R.v * D.x;
        if (Math.random() < dt * (4 + R.v * 80)) c.burst(handle.position.x, handle.position.y + .3, -1, ['#ffffff', '#ffd23f'], 1, .8);
        for (const q of stars) if (!q.got && Math.abs(q.f - R.f) < .03 && Math.abs((P.y + 1.1) - q.m.position.y) < .45) { q.got = true; q.m.visible = false; R.n++; Sound.tone(520 + R.n * 70, .15, 'sine', .07, 1.5); c.burst(q.m.position.x, q.m.position.y, -1, ['#ffd23f', '#ffffff'], 10, 1.6); }
        if (R.f >= 1 || R.letGo) { const r = R; R = null; P.ride = null; P.z = 0; home();
          if (r.letGo) { P.vy = 0; P.grounded = false; floatDown = true; c.say('🪂 You let go! Float down gently...'); }
          else { P.y = .3; P.x = 530; P.vy = 0; P.grounded = true; c.burst(529.5, 1, 0, RB, 18, 2.4); Sound.boing(); c.say(r.n === 5 ? '🌟 WOW! All five stars on the zip line!' : `🪢 What a zip! You caught ${NUM[r.n] || r.n} star${r.n === 1 ? '' : 's'}! Climb up again!`); if (r.n === 5) c.disc('zipstars', '🌟 Catch all five stars on the zip line!'); } } }; },
    // three treasure chests: tap to open, a surprise pops out
    () => { const toys = ['🧸', '🎈', '🍭', '👑', '🦄', '🌟', '🎁', '🐣', '🪀', '🍓'];
      return [500, 512, 524].map(x => { const g = new THREE.Group(); g.position.set(x, 0, -2.2); c.add(g);
        const box = new THREE.Mesh(W.rbox(1.4, .8, .9, .12), mat('#b5651d', { r: .6 })); box.position.y = .4; box.castShadow = true; g.add(box);
        const band = new THREE.Mesh(W.rbox(1.45, .14, .95, .05), mat('#ffd23f', { r: .3, m: .6 })); band.position.y = .55; g.add(band);
        const lid = new THREE.Group(); lid.position.set(0, .8, -.45); g.add(lid); const lm = new THREE.Mesh(W.rbox(1.4, .3, .9, .12), mat('#c87a2a', { r: .6 })); lm.position.set(0, .15, .45); lm.castShadow = true; lid.add(lm);
        let open = 0, want = 0, prize = null, pt = 0;
        c.tap(g, () => { if (want) return; want = 1; Sound.chime(); X.chests++; c.disc('chest', '🎁 A treasure chest! What is inside?'); const e = pick(toys); prize = physicalToy(e, .01); prize.position.set(0, .9, 0); g.add(prize); pt = 0; c.say(`${e} A surprise!`); c.burst(x, 1.4, -2.2, ['#ffd23f', '#fff', '#ff9fd8'], 18, 3); api.saveSoon(); }, x);
        return (dt) => { open += ((want ? 1 : 0) - open) * Math.min(1, dt * 6); lid.rotation.x = -open * 1.9; if (prize) { pt += dt; prize.position.y = .9 + Math.min(1, pt) * 1.2; prize.scale.setScalar(Math.min(1, pt * 2) * 1.1); if (pt > 4) { g.remove(prize); prize = null; want = 0; } } };
      }).reduce((a, f) => (dt => { a && a(dt); f(dt); })); },
    // a crystal cave: walk through, tap the crystals to make them glow
    () => { c.block(539, 0, -4.4, 14, 4.2, 1.2, '#6a5a7a', { r: .5 }); c.block(539, 3.7, -2.6, 14, .7, 3.6, '#7d6a8f', { r: .4 }); // (a back wall and an overhanging roof: the camera can still see you inside)
      for (const x of [532.5, 545.5]) c.block(x, 0, -2.8, 1, 3.8, 2.4, '#6a5a7a', { r: .4 });
      for (let x = 533.5; x < 545; x += 1.6) { const st = new THREE.Mesh(new THREE.ConeGeometry(.22, .8 + (x % 3) * .2, 8), c.mat('#8a7a9a', { r: .9 })); st.rotation.x = Math.PI; st.position.set(x, 3.3, -1.4 - (x % 2)); c.add(st); }
      const crystals = [534, 536.5, 539, 541.5, 544].map((x, i) => { const m = mat(RB[i + 2], { r: .2, em: RB[i + 2], ei: .05 }).clone(); const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.45, 0), m); cr.scale.y = 1.8; cr.position.set(x, 1.1 + (i % 2) * .5, -2.4); c.add(cr); return { cr, m, on: false, x }; });
      for (const k of crystals) c.tap(k.cr, () => { k.on = !k.on; k.m.emissiveIntensity = k.on ? 1.6 : .05; Sound.withMusic(() => Sound.tone(NOTE[crystals.indexOf(k) + 2] * 2, .5, 'sine', .05, 1)); c.burst(k.x, 1.5, -2.2, [k.m.color.getStyle(), '#fff'], 8, 2);
        if (crystals.every(q => q.on)) { c.disc('cave', '✨ The whole cave is glowing!'); c.say('✨ The whole cave is glowing! You lit every crystal!'); } else c.say(k.on ? '💎 Glow!' : '💤 Sleepy crystal.'); }, k.x);
      return (dt, t) => { for (const k of crystals) k.cr.rotation.y = t * .6 + k.x; if (P.layer === '' && P.x > 533 && P.x < 545) c.disc('cavewalk', '🪨 A secret crystal cave! Tap the crystals!'); }; },
    // (build 40) Clover the mountain goat waits on the trail (the only neighbourhood without a pal)
    () => { const pal = palAtHome(c, 'goat'); return (dt, t) => { pal && pal(dt, t); }; },
  ];

  // =================== 🧸 TOY TOWN ===================
  builders.toytown = c => [
    ...familyParts(c, 'toytown'),
    () => lifeHere(c, [['chalkgreen', 587, -4.2]]), // The daughter's green chalk creature: a resident who plays copycat.
    () => palAtHome(c, 'robot'), // (build 32) Bolt the toy robot waits here
    () => tunnelMouth(c, 612.4, -3.4, 'woods') /* (build 62: centred in the gap between the houses at 606 and 619) */, // (build 32) a secret tunnel to the Whispering Woods
    // toy houses behind
    () => { const list = []; for (let i = 0; i < 9; i++) list.push([554 + i * 13, -8.5, 5, 4 + (i % 3), 4, ['#ffd9e6', '#ffe9b8', '#cfe9ff', '#d9f5d0', '#e8dcff', '#ffe0c8'][i % 6], RB[(i + 3) % 8]]); c.add(toyHouses(list)); /* (build 53: real little houses, all nine in one mesh) */
      let puff = 0; return dt => { if (Math.abs(P.x - 608) > 75) return; puff -= dt; if (puff < 0) { puff = .5; const i = Math.floor(Math.random() * 9), x = 554 + i * 13 + (i % 2 ? 1 : -1) * 1.4; c.burst(x, 4 + (i % 3) + 3.3, -9, ['#ffffff', '#e6e6ee'], 1, .5); } }; }, // (a little smoke from the chimneys)
    // a musical floor: every tile plays a note
    () => { const tiles = NOTE.map((f, i) => { const m = mat(RB[i], { r: .3, em: RB[i], ei: .05 }).clone(); const t = new THREE.Mesh(W.rbox(1.9, .08, 3, .04), m); t.position.set(557 + i * 2, .04, 0); t.receiveShadow = true; c.add(t); return { m, x: 557 + i * 2 }; });
      let last = -1; return dt => { for (const k of tiles) k.m.emissiveIntensity = Math.max(.05, k.m.emissiveIntensity - dt * 2.5);
        const i = P.layer === '' && P.y < .4 ? Math.floor((P.x - 556) / 2) : -1;
        if (i >= 0 && i < 8 && i !== last) { Sound.withMusic(() => Sound.tone(NOTE[i], .4, 'triangle', .07, 1)); tiles[i].m.emissiveIntensity = 1.4; c.burst(tiles[i].x, .3, 0, [RB[i], '#fff'], 4, 1.2); c.disc('musicfloor', '🎵 A musical floor! Every step plays a note!'); }
        last = i >= 0 && i < 8 ? i : -1; }; },
    // the block tower: press the button, a block drops; too tall and it tumbles down!
    () => { c.block(582, 0, -2.2, 3, .2, 3, '#ffffff', { r: .1 }); const btn = c.cyl(578.6, 0, -1.55, .45, .5, .5, '#ff4f9a', { m: { em: '#ff4f9a', ei: .3 } });
      const blocks = []; let tumble = 0;
      c.tap(btn, () => { if (tumble) return; const b = new THREE.Mesh(W.rbox(1.4, .7, 1.4, .12), mat(RB[blocks.length % 8], { r: .4 })); b.castShadow = true; b.position.set(582 + (Math.random() - .5) * .3, 9, -2.2); b.userData = { vy: 0, top: .2 + blocks.length * .7 }; c.add(b); blocks.push(b); Sound.click(); c.disc('tower', '🧱 Press the button to drop blocks. Build it tall!'); }, 578.6);
      return (dt, t) => { for (const b of blocks) { const u = b.userData; if (tumble) { b.position.x += u.vx * dt; b.position.y = Math.max(.35, b.position.y + u.vy * dt); u.vy -= 20 * dt; b.rotation.z += u.vx * dt * .5; continue; } if (b.position.y > u.top + .35) { u.vy -= 25 * dt; b.position.y = Math.max(u.top + .35, b.position.y + u.vy * dt); if (b.position.y <= u.top + .35) { Sound.tone(300 + blocks.indexOf(b) * 40, .1, 'sine', .06, .8); if (blocks.length >= 7 && b === blocks[6]) { tumble = 1; for (const q of blocks) { q.userData.vx = (Math.random() - .5) * 6; q.userData.vy = 4 + Math.random() * 4; } Sound.giggle(); c.say('💥 Wobble wobble... CRASH! Build it again!'); c.disc('towercrash'); } } } else b.rotation.z = Math.sin(t * 3 + blocks.indexOf(b)) * .02 * blocks.length; }
        if (tumble && (tumble += dt) > 3.5) { for (const b of blocks) c.remove(b); blocks.length = 0; tumble = 0; } }; },
    // the bounce park: three trampolines, the last one is super bouncy (a gem floats up high)
    () => { for (const [x, b] of [[592, 11], [597, 12.5], [602, 14]]) { c.cyl(x, 0, 0, .95, 1.05, .35, '#2fa8ff'); c.cyl(x, .35, 0, .85, .85, .06, '#9fe6ff', { m: { em: '#2fa8ff', ei: .3 } }); c.plat(x - .95, x + .95, .41, { pad: true, step: true, bounce: b, onLand: () => c.disc('bouncepark', '🦘 Boing! Bounce from one to the next!') }); } },
    // the ball cannon: tap it and a ball flies into the hoop. Swish!
    () => { const can = new THREE.Group(); can.position.set(616, 0, -2); c.add(can); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, 1.6, 20), mat('#5b6cff', { r: .4 })); barrel.rotation.z = -.9; barrel.position.y = 1; barrel.castShadow = true; can.add(barrel); for (const s of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .2, 20), mat('#ffd23f')); wh.rotation.x = Math.PI / 2; wh.position.set(0, .45, s * .45); can.add(wh); }
      c.cyl(625, 0, -2, .1, .1, 3.6, '#ffffff'); const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .07, 10, 30), mat('#ff4f9a')); ring.rotation.x = Math.PI / 2; ring.position.set(624.4, 3.5, -2); c.add(ring); c.block(625.15, 3.4, -2, .1, 1.4, 1.6, '#ffffff', { r: .05 });
      const balls = []; let swish = 0;
      c.tap(can, () => { const b = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 12), mat(pick(RB))); b.position.set(616.6, 1.6, -2); b.userData = { t: 0 }; c.add(b); balls.push(b); Sound.boing(); }, 616);
      return dt => { for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i], u = b.userData; u.t += dt; const k = Math.min(1, u.t / 1.1); b.position.set(616.6 + (624.4 - 616.6) * k, 1.6 + Math.sin(k * Math.PI) * 3.4 + (3.6 - 1.6) * k, -2); if (k >= 1) { b.position.y -= (u.t - 1.1) * 6; if (!u.s) { u.s = 1; swish++; Sound.chime(); c.burst(624.4, 3.5, -2, ['#ffd23f', '#fff'], 14, 2.5); c.say(swish % 5 === 0 ? `🏀 Swish! ${swish} baskets!` : '🏀 Swish!'); c.disc('cannon', '🏀 Tap the cannon to shoot a ball into the hoop!'); } if (u.t > 1.6) { c.remove(b); balls.splice(i, 1); } } } }; },
    // (build 43) A REAL SEESAW: stand on either end and it rocks you up and down (a teddy friend rides the other end).
    // Press JUMP as your end rises for a super bounce. A gem floats above the high end.
    () => { const SZ = -1.5; /* (build 120: behind the path, so she walks past it instead of through the plank; on it, she steps back onto it) */ c.cyl(638, 0, SZ, .25, .35, .7, '#ff9a2e'); const pivot = new THREE.Group(); pivot.position.set(638, .8, SZ); c.add(pivot);
      const plank = new THREE.Mesh(W.rbox(6, .18, 1.2, .08), mat('#ffc21c', { r: .5 })); plank.castShadow = true; pivot.add(plank);
      for (const s2 of [-1, 1]) { const seat = new THREE.Mesh(W.rbox(.7, .12, 1.1, .05), mat('#ff4f9a', { r: .5 })); seat.position.set(s2 * 2.6, .15, 0); pivot.add(seat); const hd = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .7, 8), mat('#ffffff')); hd.position.set(s2 * 2.2, .45, 0); pivot.add(hd); }
      const teddy = c.toy('🧸', 1, 0, 0, 0); let ph = 0, on = 0, side = 0, rides = 0;
      const endY = (sd, a) => .8 + .24 + Math.sin(a) * 2.6 * sd; // (height of the seat at side sd: -1 left, 1 right; a positive tilt lifts the right end)
      return dt => {
        const near = P.layer === '' && !P.ride && Math.abs(P.x - 638) > .6 && Math.abs(P.x - 638) < 3.2 && P.z > SZ - .6 && P.z < .8;
        const sd = Math.sign(P.x - 638), a0 = pivot.rotation.z;
        if (!on && near && P.vy <= 0 && P.y <= endY(sd, a0) + .35 && Math.abs(a0 + sd * .34) < .06) { on = 1; side = sd; rides++; ph = side < 0 ? Math.PI / 2 : -Math.PI / 2; /* (starts from the low end, where you stepped on) */ c.disc('seesaw', '🎢 Up and down on the seesaw! Jump at the top for a big bounce!'); Sound.boing(); }
        if (on) { if (!near || Math.sign(P.x - 638) !== side || P.vy > .5) { on = 0; P.groundZ = 0; if (P.vy > .5 && Math.sin(pivot.rotation.z) * side > .2) { P.vy += 5; Sound.whoosh ? Sound.whoosh() : Sound.boing(); c.say('🚀 Super bounce!'); } }
          else { ph += dt * 2.6; pivot.rotation.z = Math.sin(ph) * .34; P.y = endY(side, pivot.rotation.z); P.groundZ = SZ; P.vy = 0; P.grounded = true; P.jumps = 0; if (Math.abs(Math.cos(ph)) > .99 && Math.sin(pivot.rotation.z) * side < 0) Sound.tone(300, .05, 'triangle', .03, 1); } }
        else { const want = near ? -sd * .34 : 0; pivot.rotation.z += (want - pivot.rotation.z) * Math.min(1, dt * 4); } // (the near end dips down to the ground so you can step on)
        const tx = 638 - (on ? side : 1) * 2.6 * Math.cos(pivot.rotation.z); teddy.position.set(tx, .8 + .7 + Math.sin(pivot.rotation.z) * 2.6 * -(on ? side : 1), SZ); }; },
    // (build 119) THE PAPER-PLANE GLIDER: climb the giant toy blocks at the end of Toy Town, hop on the big paper plane and
    //  glide back over the town. ▲ pulls up (slower), ▼ dives (faster), nothing held = a gentle glide down; catch the stars at
    //  different heights; land anywhere soft (the musical floor plays you in), or JUMP to hop off and float down.
    () => { const b = makeBatch(), bx = new THREE.BoxGeometry(1, 1, 1), STEPS = [[664.6, 667.8, 1.2], [661.4, 664.6, 2.4], [658.2, 661.4, 3.6], [655, 658.2, 4.8]]; /* (3.2 m wide, like the lookout rocks: easy hops) */
      STEPS.forEach(([a, z2, y], i) => { b.put(bx, (a + z2) / 2, y / 2, -1.9, RB[(i * 2 + 1) % 8], [z2 - a, y, 1.6]); b.put(bx, (a + z2) / 2, y - .02, -1.09, '#ffffff', [z2 - a - .2, .06, .06]); });  // the toy-block stairs (build 124: just behind her path, so she walks in front of them, never through them; she steps back onto each block as she hops up)
      c.add(b.mesh(shinyMat())); for (const [a, z2, y] of STEPS) c.plat(a, z2, y, { z: -1.8 });
      const PL = (() => { const pb = makeBatch(), cn = new THREE.ConeGeometry(1, 1, 4); pb.put(bx, -.1, 0, 0, '#ffffff', [2.6, .14, .3]); pb.put(cn, 1.55, 0, 0, '#ffffff', [.22, .7, .16], [0, 0, -Math.PI / 2]); /* (a paper plane: a long body, a pointed nose, V wings, a pink tail) */
        for (const k of [-1, 1]) { pb.put(bx, -.15, .18, k * .75, '#f4faff', [2.3, .04, 1.3], [k * .32, 0, 0]); pb.put(bx, -.15, .21, k * 1.05, '#5aa8ff', [2, .045, .16], [k * .32, 0, 0]); }
        pb.put(bx, -1.2, .32, 0, '#ff9fc8', [.5, .5, .05]); return pb.mesh(shinyMat()); })();
      const plane = new THREE.Group(); plane.add(PL); PL.rotation.y = Math.PI; plane.userData.dynamic = true; c.add(plane); const home = () => { plane.position.set(656.4, 4.95, -1.8); plane.rotation.set(0, 0, 0); }; home();
      const starG = new THREE.OctahedronGeometry(.32, 0), stars = [[638, 7.6], [626, 4.4], [612, 8.2], [598, 5], [586, 3], [574, 6.4]].map(([x, y]) => { const sb = makeBatch(); sb.put(starG, 0, 0, 0, '#ffd23f', [1, 1.3, 1]); const m = sb.mesh(shinyMat()); m.userData.dynamic = true; m.position.set(x, y, -1.1); c.add(m); return { m, got: false }; });
      let R = null, floatDown = false;
      const start = () => { if (P.layer !== '' || P.ride || Math.abs(P.x - 656.6) > 2.2 || P.y < 4.5) { if (!P.ride) c.say('🧱 Climb up the giant toy blocks, then hop on the paper plane!'); return; }
        c.disc('glider', '✈️ The paper plane! Climb the toy blocks and fly over Toy Town!'); c.say('✈️ Wheee! ▲ to fly up, ▼ to dive, catch the stars, JUMP to hop off!'); Sound.whoosh && Sound.whoosh();
        R = { type: 'glider', t: 0, noExit: true, stick: true, x: 656.4, y: 6.2, v: 3.5, n: 0 }; R.onJump = () => { if (R && R.t > .6) R.hop = true; }; P.ride = R; P.vx = P.vy = 0; for (const q of stars) { q.got = false; q.m.visible = true; } };
      c.tap(plane, start, 656.6, { y: 4.8, icon: '✈️', label: 'Paper plane', action: 'Fly!', disc: 'glider' });
      return (dt, t) => { for (const q of stars) if (!q.got) q.m.rotation.y = t * 2;
        if (floatDown) { if (P.ride || P.grounded || P.layer !== '') floatDown = false; else P.vy = Math.max(P.vy, -3); }
        if (!R) return; if (P.ride !== R) { R = null; home(); return; }
        const st = api.stick ? api.stick() : { x: 0, y: 0 }; dt = Math.min(dt, .1); R.t += dt; const up = st.y > .3, dn = st.y < -.3;
        R.v += ((up ? 3.6 : dn ? 9 : 6) - R.v) * Math.min(1, dt * 1.5); const vy = up ? 1.6 : dn ? -3.4 : -.9;               // (▲ climbs and slows, ▼ dives and speeds up)
        R.x -= R.v * dt; R.y = Math.min(11, R.y + vy * dt); const pitch = up ? -.25 : dn ? .3 : .06;
        plane.position.set(R.x, R.y, -1.8); plane.rotation.z += (pitch - plane.rotation.z) * Math.min(1, dt * 4); plane.rotation.x = Math.sin(R.t * 2) * .06;
        P.x = R.x; P.y = R.y + .1; P.z = -1.8; P.facing = -1; P.vx = -R.v;
        if (Math.random() < dt * 8) c.burst(R.x + 1.3, R.y, -1.1, ['#ffffff', '#cfefff'], 1, .6);
        for (const q of stars) if (!q.got && Math.abs(q.m.position.x - R.x) < 1 && Math.abs(q.m.position.y - (R.y + .7)) < 1.1) { q.got = true; q.m.visible = false; R.n++; Sound.tone(520 + R.n * 70, .15, 'sine', .07, 1.5); c.burst(q.m.position.x, q.m.position.y, -1.1, ['#ffd23f', '#ffffff'], 10, 1.6); }
        const landed = R.y <= .35 || R.x < 557;
        if (landed || R.hop) { const r = R; R = null; P.ride = null; P.z = 0; home();
          if (r.hop) { P.vy = 0; P.grounded = false; floatDown = true; c.say('🪂 You hopped off! Float down gently...'); }
          else { P.y = Math.max(0, r.y); P.vy = 0; P.grounded = P.y < .4; if (!P.grounded) floatDown = true; c.burst(P.x, .8, 0, RB, 16, 2.2); Sound.boing(); c.say(r.n === 6 ? '🌟 WOW! All six stars on the paper plane!' : `✈️ What a flight! You caught ${NUM[r.n] || r.n} star${r.n === 1 ? '' : 's'}! Fly again from the toy blocks!`); if (r.n === 6) c.disc('gliderstars', '🌟 Catch all six stars on the paper plane!'); } } }; },
    // catch the balloons floating up from the basket
    () => { c.cyl(651.5, 0, -2.4, .9, .7, .8, '#c87a2a', { r: .8 }); /* (build 64: in the gap between the houses; at 656 the balloons rose up a house wall) */ const list = []; const spawn = b => { b.position.set(650 + Math.random() * 3, .8, -2.4 + Math.random() * .8); b.rotation.z = 0; b.userData.v = .8 + Math.random() * .6; };
      for (let i = 0; i < 6; i++) { const b = physicalToy('🎈', 1); spawn(b); b.position.y = Math.random() * 8; c.add(b); list.push(b); c.tap(b, () => { if (b.userData.pop) return; b.userData.pop = 1; Sound.pop ? Sound.pop() : Sound.click(); X.balloons++; c.burst(b.position.x, b.position.y, b.position.z, RB, 10, 2.5); c.disc('balloons', '🎈 Pop! Catch the balloons as they float up!'); if (X.balloons % 10 === 0) c.say(`🎈 ${X.balloons} balloons caught!`); setTimeout(() => { b.userData.pop = 0; spawn(b); }, 400); b.position.y = -20; api.saveSoon(); }); }
      return dt => { for (const b of list) { if (b.userData.pop) continue; b.position.y += b.userData.v * dt; b.position.x += Math.sin(b.position.y * 1.3) * dt * .3; if (b.position.y > 10) spawn(b); } }; },
    // (stage 5) toy-box spill, giant balls and spinning tops along the path
    () => { G.toyTownDetail = buildToyTownDetail({ add: c.add }); },
  ];

  // =================== 🔬 LAB GARDENS ===================
  builders.labgarden = c => [
    ...familyParts(c, 'labgarden'),
    () => lifeHere(c, [['drawingscribble', 754, -3.6]]),
    () => { const flowers = [-1, 0, 1].map(dx => c.toy('🌷', .7, 676 + dx * .7, .55, -2)); let grown; flowers.forEach(f => { f.visible = false; });
      return () => { const events = world.adventures?.events || []; const next = (events.includes('learn_count') && events.includes('learn_plant')) || world.adventures?.completed?.includes('science') === true; if (next === grown) return; grown = next; flowers.forEach(f => { f.visible = grown; }); };
    },
    () => palAtHome(c, 'frog'), // (build 32) Hoppy the frog waits by the pond
    // greenhouse domes behind: raised onto the drum walls and ribs the detail builder adds (stage 9), and now
    // really glazed, so the raised beds and tall planting inside are visible through the panes
    () => { const pane = new THREE.MeshPhysicalMaterial({ color: '#eafcff', roughness: .05, metalness: 0, transparent: true, opacity: .26, clearcoat: 1, clearcoatRoughness: .08, side: THREE.DoubleSide, depthWrite: false });
      for (const x of [682, 724, 766]) { const d = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), pane); d.position.set(x, .92, -11); d.scale.y = .8; d.renderOrder = 3; c.add(d); } },
    // (stage 9) planter beds, greenhouse walls/ribs/doors, edging fences and the potting bench
    () => { G.labGardenDetail = buildLabGardenDetail({ add: c.add }); },
    // a colour-changing pond: tap the water, it changes colour, a fish jumps
    () => { const cols = [['blue', '#3b82f6'], ['pink', '#ff7ac8'], ['green', '#3cc45a'], ['purple', '#9b5cf6'], ['orange', '#ff9a1f'], ['yellow', '#ffd23f']]; const m = mat('#3b82f6', { r: .15, cc: .6 }).clone();
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .08, 40), m); pond.position.set(684, .03, -4.9); /* (build 64: back from the path) */ c.add(pond); const rim = new THREE.Mesh(new THREE.TorusGeometry(3, .25, 10, 40), mat('#b5ab9e', { r: .8 })); rim.rotation.x = Math.PI / 2; rim.position.set(684, .1, -4.9); c.add(rim);
      const fish = c.toy('🐟', .9, 684, -1, -4.9); let k = 0, jt = 9;
      c.tap(pond, () => { k = (k + 1) % cols.length; m.color.set(cols[k][1]); c.say(`🎨 The pond is ${cols[k][0]}!`); jt = 0; Sound.tone(500 + k * 60, .3, 'sine', .05, 1.3); c.burst(684, .4, -4.9, [cols[k][1], '#fff'], 12, 2); c.disc('pond', '🎨 A magic pond! Tap it to change its colour!'); }, 684);
      return dt => { jt += dt; const j = Math.min(1, jt / 1.2); fish.position.set(682.5 + j * 3, j < 1 ? Math.sin(j * Math.PI) * 2 : -1, -4.9); }; },
    // the bubble fountain
    () => { c.cyl(698, 0, -2.2, .8, 1, .7, '#9fe6ff'); const sp = c.cyl(698, .7, -2.2, .15, .2, 1, '#ffffff'); const bubbles = [];
      c.tap(sp.parent ? sp : sp, () => { for (let i = 0; i < 10; i++) { const b = c.toy('🫧', .5 + Math.random() * .5, 698, 1.8, -2.2); b.userData = { vx: (Math.random() - .5) * 1.6, vy: 1 + Math.random() * 1.5, t: 0 }; bubbles.push(b); } Sound.whoosh ? Sound.whoosh() : Sound.click(); c.say('🫧 Bubbles!'); c.disc('fountain', '🫧 The bubble fountain! Tap it for bubbles!'); }, 698);
      return dt => { for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i], u = b.userData; u.t += dt; b.position.x += u.vx * dt; b.position.y += u.vy * dt; if (u.t > 4) { c.remove(b); bubbles.splice(i, 1); } } }; },
    // light and shadow: tap the lamp and a new shadow animal appears on the wall
    () => { c.block(712, 0, -4.55, 6.5, 4.6, .2, '#a15cff', { r: .12 }); c.block(712, .2, -4.4, 6, 4.2, .3, '#fffaf0', { r: .1 }); /* (build 64: a purple frame) */ const lamp = new THREE.Group(); lamp.position.set(709, 0, -1.4); c.add(lamp); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 10), mat('#5b6cff')); pole.position.y = 1.1; lamp.add(pole); const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 12), mat('#fff6b0', { em: '#ffe36e', ei: 1 })); head.position.y = 2.3; lamp.add(head);
      const animals = [['🐰', 'bunny'], ['🐦', 'bird'], ['🐶', 'dog'], ['🦋', 'butterfly'], ['🐢', 'turtle'], ['🦖', 'dinosaur']]; let k = 0; const sh = c.sign('🐰', 2.6, 712.4, 2.4, -4.2, true); /* (build 64: a bunny shadow shows from the start: the wall was blank) */
      c.tap(lamp, () => { k = (k + 1) % animals.length; sh.material = emojiMat(animals[k][0], true); sh.visible = true; c.say(`🔦 A ${animals[k][1]} shadow!`); Sound.twinkle(); c.disc('shadow', '🔦 Tap the lamp to make shadow animals!'); }, 709);
      return (dt, t) => { if (sh.visible) sh.position.x = 712.4 + Math.sin(t * 1.5) * .3; }; },
    // (build 45) THE SPACE ROCKET on its launch pad: tap it (or PAW) and pick a planet to fly to
    () => { const X = 693, RZ = -4.2, /* (build 48: it stood on top of the bubble fountain at 698, so PAW there blew bubbles instead) (build 64: 686 → 693 and further back: its pad sat on the colour pond and on the path) */ pad = c.cyl(X, 0, RZ, 2.2, 2.4, .35, '#9a9aa6', { r: .6, m: .3 }); const rk = new THREE.Group(); rk.position.set(X, .35, RZ); c.add(rk);
      // (build 49) the same smooth rocket as on the planets: a curved hull, swept fins, a framed window, an engine bell.
      // It is merged into ONE mesh with painted colours (one draw call instead of seven).
      { const b = makeBatch(); for (const [g2, c2, x, y, z, s3, rot] of rocketParts()) b.put(g2, x, y - .42, z, c2, s3, rot); const hull = b.mesh(shinyMat()); hull.castShadow = true; rk.add(hull); }
      const win = new THREE.Mesh(rocketGlass(), mat('#9fe6ff', { em: '#9fe6ff', ei: .5 })); win.position.set(0, 3.18, .72); win.scale.z = .6; rk.add(win);
      for (const s2 of [-1, 1]) c.cyl(X + s2 * 2.6, 0, RZ, .12, .12, 4, '#ff9a2e');
      api.registerRocket && api.registerRocket('earth', rk, win, X, '', .35);
      c.tap(rk, () => api.rocket && api.rocket(), X, { icon: '🚀', label: 'Space rocket', action: 'Get in the rocket', disc: 'rocketmenu' }); c.tap(pad, () => api.rocket && api.rocket());
      return (dt, t) => { win.material.emissiveIntensity = .4 + Math.sin(t * 3) * .2; }; },
    // the rocket: press the big button
    () => { const rk = new THREE.Group(); rk.position.set(730, 0, -2.6); c.add(rk); const body = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, 2.6, 24), mat('#ffffff', { r: .3 })); body.position.y = 1.7; body.castShadow = true; rk.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 24), mat('#ff4f9a')); nose.position.y = 3.5; rk.add(nose); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(W.rbox(.12, .8, .7, .04), mat('#2fa8ff')); const a = i * 2.09; f.position.set(Math.cos(a) * .55, .6, Math.sin(a) * .55); f.rotation.y = -a; rk.add(f); } const win = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), mat('#9fe6ff', { em: '#9fe6ff', ei: .5 })); win.position.set(0, 2.2, .45); rk.add(win);
      c.cyl(730, 0, -2.6, 1.2, 1.3, .2, '#9a9a9a'); const btn = c.cyl(727, 0, -1.55, .45, .5, .5, '#ff4f9a', { m: { em: '#ff4f9a', ei: .3 } }); let flying = 0;
      c.tap(btn, () => { if (flying || R) return; flying = .001; Sound.whoosh ? Sound.whoosh() : Sound.boing(); c.say('🚀 3... 2... 1... Blast off!'); c.disc('rocket', '🚀 Press the button to launch the rocket!'); }, 727);
      // (build 142) RIDE THE ROCKET: tap the rocket itself and she climbs on. Each JUMP pumps it (up to three: the more pumps,
      //  the higher it flies); ▲ (or a little wait) launches. Up it goes past three stars, then the parachute opens and she
      //  steers it down with ◀ ▶ to catch two side stars, landing softly; the rocket glides back onto its pad.
      const chute = (() => { const b = makeBatch(); const dome = new THREE.SphereGeometry(1.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); ['#ff4f9a', '#ffd23f', '#2fa8ff'].forEach((col, i) => b.put(new THREE.SphereGeometry(1.8, 6, 8, i * Math.PI * 2 / 3, Math.PI * 2 / 3, 0, Math.PI / 2), 0, 0, 0, col)); dome.dispose();
        const cyl = new THREE.CylinderGeometry(1, 1, 1, 6); for (const a of [0, 1.57, 3.14, 4.71]) b.put(cyl, Math.cos(a) * .9, -1.1, Math.sin(a) * .9, '#ffffff', [.02, 2.3, .02], [Math.sin(a) * .38, 0, -Math.cos(a) * .38]);
        const m = b.mesh(shinyMat()); m.position.y = 6; m.visible = false; rk.add(m); return m; })();
      const RSG = new THREE.OctahedronGeometry(.34, 0), rstars = [[730, 6.5], [730, 11.5], [730, 16.5], [726, 11], [733, 6]].map(([x, y]) => { const sb = makeBatch(); sb.put(RSG, 0, 0, 0, '#ffd23f', [1, 1.3, 1]); const m = sb.mesh(shinyMat()); m.userData.dynamic = true; m.position.set(x, y, -1.6); m.visible = false; c.add(m); return { m, got: false }; });
      const TOPS = [8.5, 13.5, 18.5]; let R = null, floatDown = false;
      const ride = () => { if (flying || P.layer !== '' || P.ride || Math.abs(P.x - 730) > 3 || P.y > 1) return;
        R = { type: 'rocketride', t: 0, noExit: true, stick: true, phase: 'pump', pumps: 0, idle: 0, x: 730, y: 0, vy: 0, n: 0 };
        R.onJump = () => { if (!R) return; if (R.phase === 'pump') { if (R.pumps < 3) { R.pumps++; R.idle = 0; Sound.tone(220 + R.pumps * 110, .2, 'square', .04, 1.5); c.burst(730, .5, -2.2, ['#9fe6ff', '#ffffff'], 6 + R.pumps * 3, 1.5); c.say(['💦 Pump!', '💦 Pump, pump!', '💦 Full power! Here we go...'][R.pumps - 1]); } } else if (R.phase === 'chute' && R.t > .8) R.hop = true; };
        P.ride = R; P.vx = P.vy = 0; for (const q of rstars) { q.got = false; q.m.visible = true; }
        c.disc('rocketride', '🚀 Ride the rocket! Pump it with JUMP, then fly up and float down!'); c.say('🚀 All aboard! Press JUMP to pump it up: the more you pump, the higher you fly! ▲ to launch!'); };
      c.tap(body, ride, 730, { y: 2.4, icon: '🚀', label: 'Rocket ride', action: 'Climb on!', disc: 'rocketride' });
      const old = dt => { if (!flying) return; flying += dt; const t = flying; rk.position.y = t < 3 ? t * t * 3 : t < 7 ? 27 - (t - 3) * 6.7 : 0; if (t < 3 && Math.random() < .6) c.burst(730, rk.position.y, -2.6, ['#ffd23f', '#ff9a2e', '#ffffff'], 2, 1.5); if (t >= 7) { flying = 0; rk.position.y = 0; Sound.boing(); c.say('🚀 The rocket is home again!'); } };
      return (dt, tt) => { old(dt); if (floatDown) { if (P.ride || P.grounded || P.layer !== '') floatDown = false; else P.vy = Math.max(P.vy, -3); } for (const q of rstars) if (!q.got && q.m.visible) q.m.rotation.y = tt * 2;
        if (!R) { if (rk.position.x !== 730 && !flying) { rk.position.x += (730 - rk.position.x) * Math.min(1, dt * 2); if (Math.abs(rk.position.x - 730) < .02) rk.position.x = 730; } return; }
        if (P.ride !== R) { R = null; chute.visible = false; rk.position.y = 0; for (const q of rstars) q.m.visible = false; return; }
        dt = Math.min(dt, .1); R.t += dt; const st = api.stick ? api.stick() : { x: 0, y: 0 };
        if (R.phase === 'pump') { R.idle += dt; if ((R.pumps && (st.y > .3 || R.idle > 2.5)) || (!R.pumps && st.y > .3)) { if (!R.pumps) R.pumps = 1; R.phase = 'up'; R.top = TOPS[R.pumps - 1]; R.vy = Math.sqrt(2 * 14 * R.top); Sound.whoosh ? Sound.whoosh() : Sound.boing(); c.say('🚀 3... 2... 1... Blast off!'); } }
        else if (R.phase === 'up') { R.vy -= 14 * dt; R.y = Math.max(0, R.y + R.vy * dt); if (Math.random() < .7) c.burst(R.x, R.y, -2.6, ['#9fe6ff', '#ffffff', '#ffd23f'], 2, 1.5); if (R.vy <= 0) { R.phase = 'chute'; R.t = 0; chute.visible = true; Sound.chime(); c.say('🪂 The parachute! ◀ ▶ to steer and catch the stars!'); } }
        else { R.x = Math.max(721, Math.min(739, R.x + (st.x > .3 ? 3.2 : st.x < -.3 ? -3.2 : 0) * dt)); R.y = Math.max(0, R.y - 1.6 * dt); chute.rotation.z = (st.x > .3 ? -.12 : st.x < -.3 ? .12 : 0); }
        rk.position.set(R.x, R.y, -2.6); P.x = R.x; P.y = R.y + .2; P.z = -1.75; P.facing = 1; P.vx = 0; P.vy = 0;
        for (const q of rstars) if (!q.got && Math.abs(q.m.position.x - R.x) < 1.2 && Math.abs(q.m.position.y - (R.y + 1.2)) < 1.4) { q.got = true; q.m.visible = false; R.n++; Sound.tone(520 + R.n * 80, .15, 'sine', .07, 1.5); c.burst(q.m.position.x, q.m.position.y, -1.6, ['#ffd23f', '#ffffff'], 10, 1.6); }
        if ((R.phase === 'chute' && R.y <= 0) || R.hop) { const r = R; R = null; P.ride = null; P.z = 0; chute.visible = false; rk.position.y = 0; for (const q of rstars) q.m.visible = false;
          if (r.hop) { P.y = r.y + .2; P.vy = 0; P.grounded = false; floatDown = true; c.say('🪂 You hopped off! Float down gently...'); }
          else { P.y = 0; P.vy = 0; P.grounded = true; Sound.boing(); c.burst(P.x, .8, 0, ['#ffd23f', '#ff4f9a', '#2fa8ff'], 16, 2.2); c.say(r.n === 5 ? '🌟 WOW! All five rocket stars!' : `🚀 What a flight! You caught ${NUM[r.n] || r.n} star${r.n === 1 ? '' : 's'}!`); if (r.n === 5) c.disc('rocketstars', '🌟 Catch all five stars on the rocket ride!'); } } }; },
    // water jets: press the button, fountains splash up
    () => { const jets = [742, 744, 746, 748, 750].map(x => { c.cyl(x, 0, -2.6, .25, .3, .15, '#9a9a9a'); const j = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 1, 12), mat('#9fe6ff', { r: .1, cc: .6 })); j.position.set(x, 0, -2.6); j.scale.y = .01; c.add(j); return j; });
      const btn = c.cyl(740, 0, -1.55, .45, .5, .5, '#2fa8ff', { m: { em: '#2fa8ff', ei: .3 } }); let on = 0;
      c.tap(btn, () => { on = 4; c.say('💦 Splash! Water fountains!'); Sound.whoosh ? Sound.whoosh() : Sound.click(); c.disc('jets', '💦 Press the blue button for water fountains!'); }, 740);
      return (dt, t) => { on = Math.max(0, on - dt); jets.forEach((j, i) => { const h = on ? 2 + Math.sin(t * 6 + i) * 1.2 : .01; j.scale.y += (h - j.scale.y) * Math.min(1, dt * 8); j.position.y = j.scale.y / 2; if (on && Math.random() < .2) c.burst(742 + i * 2, j.scale.y, -2.6, ['#9fe6ff', '#ffffff'], 1, 1); }); }; },
    // the magnet crane: metal things jump up to the magnet, others stay
    () => { c.cyl(762, 0, -3.2, .2, .25, 4.6, '#ffc21c'); c.block(764, 4.4, -3.2, 4.4, .35, .35, '#ffc21c', { r: .1 }); const mg = c.toy('🧲', 1.1, 765.6, 3.4, -3.2); const rope = c.cyl(765.6, 0, -3.2, .035, .035, 1, '#5a4a3a'); /* (build 120: the magnet hangs on a rope; it floated under the arm) */ const hang = () => { const top = 4.4, bot = mg.position.y + .45; const L = Math.max(.05, top - bot); rope.scale.y = L; rope.position.y = bot + L / 2; }; hang(); const can = c.toy('🥫', .9, 765.6, .45, -3.2), apple = c.toy('🍎', .9, 767.4, .45, -3.2); let t0 = -1;
      const go = () => { if (t0 >= 0) return; t0 = 0; Sound.tone(200, .4, 'sawtooth', .02, 1.5); c.disc('magnet2', '🧲 The magnet crane! Metal things jump up to it!'); };
      c.tap(mg, go, 765.6); c.tap(can, go); c.tap(apple, () => { c.say('🍎 The apple does not stick. It is not metal.'); Sound.click(); });
      return dt => { if (t0 < 0) return; t0 += dt; const down = t0 < 1 ? t0 : t0 < 3 ? 1 : Math.max(0, 4 - t0); mg.position.y = 3.4 - down * 1.6; hang(); can.position.y = t0 > 1 && t0 < 4 ? mg.position.y - .8 : .45; if (t0 > 1 && t0 - dt <= 1) { Sound.tone(900, .15, 'square', .03, 1); c.say('🧲 Click! The can is metal, so it sticks!'); } if (t0 > 4.2) t0 = -1; }; },
  ];

  // =================== 🖍️ ART PLAZA ===================
  builders.artplaza = c => [
    ...familyParts(c, 'artplaza'),
    // (stage 10) the gallery yard: painted paving, planters, easels, a drying rack and bunting
    () => { G.artPlazaDetail = buildArtPlazaDetail({ add: c.add }); },
    () => lifeHere(c, [['chalkpink', 827, -2.7]]), // The daughter's pink chalk creature: tap to twirl and dance.
    () => { const frame = c.toy('🖼️', 1.3, 798, 2, -2); c.tap(frame, () => api.gallery?.(), 798, { icon: '🖼️', label: 'Gallery', action: 'Open gallery', disc: 'gallery' }); },
    // the sticker wall: tap anywhere on it to stick a picture there (they're remembered)
    () => { const STK = ['⭐', '❤️', '🌈', '🦄', '🐱', '🌸', '🚀', '🍦', '🐞', '🌙', '🎈', '🦋'];
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const g = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const draw = () => { g.fillStyle = '#fffaf2'; g.fillRect(0, 0, 1024, 512); for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 16; xx++) { g.fillStyle = ['#ffe3f1', '#e3f3ff', '#fff4c9', '#e6ffe9'][(xx + yy) % 4]; g.beginPath(); g.arc(32 + xx * 64 + (yy % 2) * 32, 32 + yy * 64, 18, 0, 7); g.fill(); } /* (build 64: soft polka dots, so the wall is never blank) */ g.lineWidth = 18; g.strokeStyle = '#ff9fd2'; g.strokeRect(9, 9, 1006, 494); g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const [u, v, i] of X.stickers) g.fillText(STK[i % STK.length], u * 1024, (1 - v) * 512); tex.needsUpdate = true; };
      draw(); const wallM = new THREE.MeshBasicMaterial({ map: tex }); wallM.userData.own = true; const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallM); wall.position.set(804, 3.4, -4.3); c.add(wall); c.block(804, 0, -4.5, 12.6, 6.8, .3, '#ffffff', { r: .1 });
      c.tap(wall, h => { if (!h || !h.uv) { Sound.click(); return; } const i = rnd(STK.length); X.stickers.push([+h.uv.x.toFixed(3), +h.uv.y.toFixed(3), i]); if (X.stickers.length > 80) X.stickers.shift(); draw(); Sound.pop ? Sound.pop() : Sound.click(); c.disc('stickers', '⭐ The sticker wall! Tap to add stickers. They stay there!'); api.saveSoon(); }); },
    // spin art: tap the wheel, it spins and paint splats fly onto it
    () => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); for (let n = 0; n < 26; n++) { const a = n * 2.39, r = 20 + (n * 37 % 90); g.fillStyle = RB[n % RB.length]; g.beginPath(); g.ellipse(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 9 + n % 12, 5 + n % 7, a, 0, 7); g.fill(); } /* (build 64: some paint from the start, not a plain white disc) */ const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .12, 40), [mat('#ffffff'), Object.assign(new THREE.MeshBasicMaterial({ map: tex }), { userData: { own: true } }), mat('#ffffff')]); disk.position.set(820, 1.3, -2.2); disk.rotation.x = 1.25; c.add(disk); { const rim = new THREE.Mesh(new THREE.TorusGeometry(1.62, .09, 10, 48), mat('#ff4f9a', { r: .4 })); rim.rotation.x = 1.25 - Math.PI / 2; rim.position.copy(disk.position); c.add(rim); disk.userData.rim = rim; } c.cyl(820, 0, -2.6, .2, .3, 1.2, '#a15cff');
      let spin = 0;
      c.tap(disk, () => { spin = 2.5; const col = pick(RB); for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, r = Math.random() * 100; g.fillStyle = col; g.beginPath(); g.ellipse(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 10 + Math.random() * 18, 6 + Math.random() * 10, a, 0, 7); g.fill(); } tex.needsUpdate = true; Sound.twinkle(); c.say('🎨 Whirl! Spin art!'); c.disc('spinart', '🎨 Spin art! Tap the wheel to splash paint!'); }, 820);
      return dt => { spin = Math.max(0, spin - dt); disk.rotation.y += dt * (1 + spin * 8); }; },
    // the instrument circle: a big drum, bells and a xylophone
    () => { const drum = c.cyl(834, 0, -2, .9, .9, 1.1, '#ff4f9a'); c.cyl(834, 1.1, -2, .92, .92, .06, '#fffaf0');
      c.tap(drum, () => { Sound.withMusic(() => { Sound.tone(110, .3, 'sine', .12, .5); Sound.noise && Sound.noise(.12, 200, 900, .05); }); drum.scale.y = .9; setTimeout(() => { drum.scale.y = 1; }, 120); c.disc('drum', '🥁 Boom! The big drum!'); }, 834);
      [0, 1, 2].forEach(i => { const b = c.sph(838.5 + i * 1.1, 2.4, -2.4, .35, '#ffd23f', { m: { m: .6 } }); c.cyl(838.5 + i * 1.1, 0, -2.4, .05, .05, 2.1, '#9a9a9a'); c.tap(b, () => { Sound.withMusic(() => Sound.bell ? Sound.bell([784, 988, 1175][i], .06) : Sound.tone(880, .8, 'sine', .05, 1)); c.disc('bells', '🔔 Ding! Tap the bells!'); }); });
      NOTE.forEach((f, i) => { const bar = c.block(843 + i * .55, .8 - i * .03, -2.2, .45, .12, 1.4 - i * .08, RB[i], { r: .04 }); c.tap(bar, () => { Sound.withMusic(() => Sound.tone(f * 2, .5, 'triangle', .07, 1)); c.burst(843 + i * .55, 1.1, -2.2, [RB[i], '#fff'], 4, 1.2); c.disc('xylo2', '🎶 A rainbow xylophone!'); }); });
      c.block(845, 0, -2.2, 4.8, .7, 1.2, '#9a6a3a', { r: .1 }); },
    // (build 141) THE PAINT-POT BALLOON: tap it (between the sticker wall and the spin art) and it floats her up over the plaza,
    //  drifting along to the far end. ▲ climbs, ▼ sinks, JUMP hops off (she floats down gently). Six paint drops float at
    //  different heights; each one she catches sings a note, and all six paint a big rainbow across the sky.
    () => { const BX = 813, END = 899, ZB = -1.8, sph = new THREE.SphereGeometry(1, 18, 12), cy = new THREE.CylinderGeometry(1, 1, 1, 16), PAINT = ['#ff4f6a', '#ff9a2e', '#ffd23f', '#5fd36a', '#4fb0ff', '#b07cff'];
      const bal = new THREE.Group(); bal.userData.dynamic = true; c.add(bal);
      { const b = makeBatch();
        PAINT.forEach((col, i) => b.put(new THREE.SphereGeometry(1, 4, 12, i * Math.PI / 3, Math.PI / 3), 0, 3.4, 0, col, [1.7, 1.95, 1.7])); // the envelope: six coloured wedges
        b.put(sph, 0, 1.75, 0, '#ffffff', [.35, .25, .35]);
        b.put(cy, 0, .45, 0, '#ffffff', [.75, .9, .75]); b.put(cy, 0, .92, 0, '#4fb0ff', [.8, .1, .8]); // the paint-pot basket and its rim
        for (let i = 0; i < 5; i++) b.put(sph, Math.cos(i * 1.26) * .74, .7 - (i % 2) * .15, Math.sin(i * 1.26) * .74, PAINT[i], [.12, .22, .12]); // paint drips down the pot
        for (const [dx, dz] of [[.6, .6], [-.6, .6], [.6, -.6], [-.6, -.6]]) b.put(cy, dx * .9, 1.4, dz * .9, '#8a6a4a', [.025, 1, .025]); // ropes
        bal.add(b.mesh(shinyMat())); }
      const home = () => { bal.position.set(BX, 0, ZB); bal.rotation.set(0, 0, 0); }; home();
      const dropG = new THREE.SphereGeometry(.38, 14, 10); dropG.scale(1, 1.25, 1);
      const drops = [[829, 6.5], [842, 9.5], [855, 5.5], [868, 8.5], [880, 6], [892, 10]].map(([x, y], i) => { const db = makeBatch(); db.put(dropG, 0, 0, 0, PAINT[i]); db.put(sph, -.12, .18, .3, '#ffffff', .09); const m = db.mesh(shinyMat()); m.userData.dynamic = true; m.position.set(x, y, -1.1); c.add(m); return { m, got: false, y }; });
      const rb = (() => { const b = makeBatch(); PAINT.forEach((col, i) => b.put(new THREE.TorusGeometry(15 - i * .7, .36, 6, 40, Math.PI), 856, 3, -14, col)); const m = b.mesh(shinyMat()); m.visible = false; c.add(m); return m; })();
      let R = null, floatDown = false;
      const start = () => { if (P.layer !== '' || P.ride || Math.abs(P.x - BX) > 2.6 || P.y > 1) return;
        c.disc('paintballoon', '🎈 The paint-pot balloon! Float over Art Plaza and catch the paint drops!'); c.say('🎈 Up we go! ▲ to go higher, ▼ to go lower, catch the paint drops! JUMP to hop off.'); Sound.whoosh && Sound.whoosh();
        R = { type: 'paintballoon', t: 0, noExit: true, stick: true, x: BX, y: 0, n: 0 }; R.onJump = () => { if (R && R.t > 1) R.hop = true; }; P.ride = R; P.vx = P.vy = 0; for (const q of drops) { q.got = false; q.m.visible = true; } };
      c.tap(bal, start, BX, { y: 3, icon: '🎈', label: 'Paint balloon', action: 'Float up!', disc: 'paintballoon' });
      return (dt, t) => { for (const [i, q] of drops.entries()) if (!q.got) { q.m.position.y = q.y + Math.sin(t * 1.5 + i) * .25; q.m.rotation.y = t; }
        if (floatDown) { if (P.ride || P.grounded || P.layer !== '') floatDown = false; else P.vy = Math.max(P.vy, -3); }
        if (!R) { bal.rotation.z = Math.sin(t * .8) * .03; return; } if (P.ride !== R) { R = null; home(); return; }
        dt = Math.min(dt, .1); R.t += dt; const st = api.stick ? api.stick() : { x: 0, y: 0 }, up = st.y > .3, dn = st.y < -.3;
        if (R.x >= END) R.y = Math.max(0, R.y - 2.4 * dt); // (the far end: down she comes, gently)
        else if (R.t < 2.5) R.y = Math.min(5.5, R.y + 2.4 * dt); // (lift-off)
        else { R.x = Math.min(END, R.x + 2.4 * dt); R.y = Math.max(3, Math.min(11, R.y + (up ? 2 : dn ? -2 : -.15) * dt)); }
        bal.position.set(R.x, R.y, ZB); bal.rotation.z = Math.sin(R.t * 1.3) * .05;
        P.x = R.x; P.y = R.y + .55; P.z = ZB + .9; P.facing = 1; /* (in front of the basket, holding on: easy to see) */ P.vx = 0; P.vy = 0;
        for (const [i, q] of drops.entries()) if (!q.got && Math.abs(q.m.position.x - R.x) < 1.4 && Math.abs(q.m.position.y - (R.y + 1.4)) < 1.6) { q.got = true; q.m.visible = false; R.n++; Sound.tone([523, 587, 659, 698, 784, 880][i], .3, 'triangle', .07, 1.5); c.burst(q.m.position.x, q.m.position.y, -1.1, [PAINT[i], '#ffffff'], 14, 2); }
        const landed = R.x >= END && R.y <= 0;
        if (landed || R.hop) { const r = R; R = null; P.ride = null; P.z = 0; home();
          if (r.hop) { P.y = r.y + .55; P.vy = 0; P.grounded = false; floatDown = true; c.say('🪂 You hopped off! Float down gently...'); }
          else { P.y = 0; P.vy = 0; P.grounded = true; Sound.boing(); c.burst(P.x, .8, 0, RB, 16, 2.2); }
          if (r.n === 6) { rb.visible = true; Sound.chime(); c.say('🌈 All six paint drops! You painted a RAINBOW across the sky!'); c.disc('paintrainbow', '🌈 Catch all six paint drops on the paint-pot balloon!'); }
          else if (!r.hop) c.say(`🎈 What a ride! You caught ${NUM[r.n] || r.n} paint drop${r.n === 1 ? '' : 's'}! Ride again from the paint balloon!`); } }; },
    // the light mixer: three coloured lamps shine on a white statue
    () => { const statue = c.sph(860, 1.6, -2.8, 1.1, '#ffffff', { m: { r: .5, em: '#000000', ei: 1 } }); const sm = statue.material = statue.material.clone(); c.cyl(860, 0, -2.8, .7, .8, .6, '#e6e0f0');
      const L = [['red', '#ff2a2a', 856.5], ['green', '#2aff4a', 860], ['blue', '#2a5aff', 863.5]], on = [0, 0, 0];
      const name = () => { const k = on.join(''); return { '000': 'no light', '100': 'red', '010': 'green', '001': 'blue', '110': 'yellow', '101': 'pink', '011': 'light blue', '111': 'white' }[k]; };
      L.forEach(([n, col, x], i) => { const b = c.cyl(x, 0, -1.55, .45, .5, .5, col, { m: { em: col, ei: .2 } }); c.tap(b, () => { on[i] = 1 - on[i]; sm.emissive.setRGB(on[0] * .9, on[1] * .9, on[2] * .9); Sound.tone(400 + i * 120, .2, 'sine', .05, on[i] ? 1.4 : .7); const nm = name(); c.say(on.reduce((a, b) => a + b, 0) >= 2 ? `💡 Mixed light makes ${nm}!` : `💡 ${nm}!`); c.disc('lightmix', '💡 Mix coloured lights on the statue!'); }, x); }); },
    // a hungry friend: tap the bowl to feed it, tap the friend to pet it
    () => { const f = new THREE.Group(); f.position.set(876, 0, -2.2); c.add(f); const body = new THREE.Mesh(new THREE.SphereGeometry(.8, 24, 16), mat('#ffb3dc', { r: .7 })); body.position.y = .8; body.castShadow = true; f.add(body);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), mat('#ffffff')); e.position.set(s * .28, 1.05, .66); f.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), mat('#2b1d3d')); p.position.set(s * .28, 1.05, .8); f.add(p); const ear = new THREE.Mesh(new THREE.ConeGeometry(.2, .45, 12), mat('#ff8fc8')); ear.position.set(s * .45, 1.55, 0); ear.rotation.z = -s * .4; f.add(ear); }
      const bowl = c.cyl(879, 0, -1.8, .5, .35, .3, '#5b6cff'); let eat = 0, pet = 0;
      c.tap(f, () => { pet = 1; Sound.giggle(); c.say('💖 Hee hee! It loves being petted!'); c.disc('petfriend', '💖 Tap the friend to pet it!'); c.burst(876, 2, -2.2, ['#ff7ad9', '#fff'], 8, 1.5); }, 876);
      c.tap(bowl, () => { if (eat) return; eat = .001; api.event?.({ type: 'activity', id: 'feed_friend' }); c.say('🍪 Yum yum! Thank you for feeding me!'); c.disc('feedfriend', '🍪 Tap the bowl to feed your friend!'); }, 879, { icon: '🍪', label: 'Hungry friend', action: 'Feed friend', disc: 'feedfriend' });
      return (dt, t) => { pet = Math.max(0, pet - dt); f.rotation.z = Math.sin(t * 20) * .08 * pet; body.scale.y = 1 + Math.sin(t * 3) * .03; if (eat) { eat += dt; const k = eat < 1 ? eat : eat < 3 ? 1 : Math.max(0, 4 - eat); f.position.x = 876 + k * 2.2; f.position.y = Math.abs(Math.sin(eat * 8)) * .2 * (eat < 1 || eat > 3 ? 1 : 0); if (eat > 1 && eat < 3 && Math.random() < .1) { Sound.tone(300, .06, 'square', .02, .7); c.burst(879, 1, -1.8, ['#ff7ad9'], 2, 1); } if (eat > 4) { eat = 0; f.position.set(876, 0, -2.2); } } }; },
    // hide and seek: the little friend hides behind one of the bushes
    () => { const bushes = [888, 891.5, 895].map(x => { const b = c.sph(x, .9, -2.6, 1, '#4caf50', { m: { r: .9 } }); b.scale.set(1.1, .9, .8); return b; }); const kid = c.toy('🐣', 1.1, 888, -2, -3.4); let hide = rnd(3), found = 0;
      bushes.forEach((b, i) => c.tap(b, () => { b.userData.w = 1; Sound.tone(300 + i * 80, .1, 'sine', .04, 1); if (found) return; if (i === hide) { found = 1; kid.position.set(bushes[i].position.x, 2.2, -3); Sound.giggle(); c.say('🐣 Peekaboo! You found me!'); c.disc('hideseek', '🐣 Hide and seek! Tap the bushes to find the chick!'); setTimeout(() => { found = 0; hide = rnd(3); kid.position.y = -2; c.say('🙈 I am hiding again!'); }, 3000); } else c.say(pick(['🌿 Not here!', '🌿 Rustle rustle... nobody!'])); }));
      return (dt, t) => { for (const b of bushes) { b.userData.w = Math.max(0, (b.userData.w || 0) - dt * 2); b.rotation.z = Math.sin(t * 25) * .1 * b.userData.w; } if (found) kid.position.y = 2.2 + Math.abs(Math.sin(t * 6)) * .3; }; },
    // Kiwi the parrot waits here to be befriended
    () => palAtHome(c, 'parrot'),
    // (build 62b: the rainbow 🏠 portal is gone: the family asked; the 🏠 button and the map take you home)
  ];

  // a pal waiting at home (inside its neighbourhood): tap it three times to make friends
  function palAtHome(c, kind) {
    if (followers[kind]) return null; const m = makePalMesh(kind), [x, y, z] = PALS[kind].home; m.position.set(x, y, z); m.userData.pal = kind; c.add(m); let taps = 0;
    c.tap(m, () => { if (followers[kind]) return; taps++; boingIt(m); Sound.giggle(); if (X.pals[kind]) { c.remove(m); setFollow(kind, true); say(`${PAL_EMOJI[kind]} ${PAL_NAME[kind]} is coming with you!`); return; }
      if (taps < 3) say(taps === 1 ? `${PAL_EMOJI[kind]} ${{ crab: 'Snap snap', fox: 'Yip', penguin: 'Squeak', robot: 'Beep boop', frog: 'Ribbit', parrot: 'Squawk', pig: 'Oink oink', seal: 'Ar ar', goat: 'Maa' }[kind]}! Hello!` : `${PAL_EMOJI[kind]} ${PAL_NAME[kind]} likes you! One more tap!`);
      else { c.remove(m); setFollow(kind, true); disc('pal_' + kind); say(PALS[kind].hello); c.burst(x, 1.5, z, ['#ff8fc8', '#fff', '#ffd23f'], 24, 3); Sound.chime(); } }, x);
    const upd = (dt, t) => { if (!m.parent) return; m.position.x = x + Math.sin(t * .9) * (kind === 'crab' ? 1.5 : .6); m.userData.body.position.y = Math.abs(Math.sin(t * 5)) * .05; if (kind === 'fox') m.rotation.y = Math.cos(t * .9) > 0 ? 0 : Math.PI; }; upd.mesh = m; return upd;
  }
  const boingIt = o => { o.userData.bt = 1; };
  // (build 32) SECRET TUNNELS: a cave mouth half-hidden behind bushes; tap it (or PAW next to it) and you whoosh through
  // the hill to the tunnel at the other side of the world (a shortcut; the place you arrive at is built at once)
  const TUNNELS = { woods: { x: -232, back: 'toytown' }, toytown: { x: 612.4, back: 'woods' } };
  function tunnelMouth(c, x, z, to) {
    const rock = c.sph(x, 0, z, 1.9, '#8a7f74', { m: { r: .95, cc: 0 } }); rock.scale.set(1.2, .9, .7);
    const hole = c.sph(x, .6, z + 1.25, .95, '#1c1520', { m: { r: 1, cc: 0 } }); hole.scale.set(1, 1, .2);
    for (const dx of [-1.6, 1.6]) { const b = c.sph(x + dx, .5, z + 1.1, .7, '#3f8f4a', { m: { r: .9 } }); b.scale.y = .8; }
    const go = () => { const dest = TUNNELS[to]; c.disc('tunnel', '🕳️ A secret tunnel! It is a shortcut across the world!'); api.travelTo(dest.x + 2, '🕳️', 'the other end of the secret tunnel'); };
    c.tap(rock, go, x); c.tap(hole, go); /* (build 62: no floating 🕳️ sign: it showed as a black blob over the cave) */
  }

  // =================== 🏖️ SUNNY SEASIDE (x -150 to -20) ===================
  builders.seaside = c => [
    ...familyParts(c, 'seaside'),
    // (stage 11) parasols, towels, beach balls, dune grass and driftwood along the sand
    () => { G.seasideDetail = buildSeasideDetail({ add: c.add }); },
    () => lifeHere(c, [['drawingblue', -123, -3.7]]),
    // the ice cream stand: tap the tubs to stack scoops, tap the cone to eat it
    () => { c.block(-35, 0, -3.4, 3.4, 1.1, 1.2, '#ffffff', { r: .2 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 4).rotateY(Math.PI / 4), mat('#ff7ac8')); roof.position.set(-35, 3.2, -3.4); roof.scale.z = .6; /* (build 48: turned in its shape, then squashed: straight, not crooked) */ c.add(roof); for (const x of [-36.6, -33.4]) c.cyl(x, 0, -3.4, .07, .07, 2.6, '#ffffff');
      const flav = [['strawberry', '#ff8fb8'], ['vanilla', '#fff3d6'], ['mint', '#9ff0c8'], ['chocolate', '#8a5a3a']]; const cone = new THREE.Mesh(new THREE.ConeGeometry(.28, .8, 16), mat('#e8b06a', { r: .7 })); cone.rotation.x = Math.PI; cone.position.set(-35, 1.6, -2.5); c.add(cone); const scoops = [];
      flav.forEach(([n, col], i) => { const tub = c.cyl(-36.3 + i * .85, 1.1, -3.1, .3, .3, .3, col, { r: .6 }); c.tap(tub, () => { if (scoops.length >= 4) { c.say('🍦 That is a very tall ice cream! Tap the cone to eat it!'); return; } const sc = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), mat(col, { r: .7 })); sc.position.set(-35, 2.1 + scoops.length * .42, -2.5); c.add(sc); scoops.push(sc); c.say(`🍦 ${n}!`); Sound.pop ? Sound.pop() : Sound.click(); c.disc('icecream', '🍦 The ice cream stand! Tap the tubs to stack scoops.'); }); });
      c.tap(cone, () => { if (!scoops.length) { c.say('🍦 Tap a tub to add a scoop!'); return; } for (const sc of scoops) c.remove(sc); c.say(`😋 Yum! ${scoops.length} scoops! Delicious!`); Sound.giggle(); c.burst(-35, 2.4, -2.5, ['#ff8fb8', '#fff', '#9ff0c8'], 16, 2.5); scoops.length = 0; }, -35); },
    // the sandcastle: tap the sand pile and the castle grows; when it's finished a wave washes it away to build again
    () => { const pile = c.sph(-50, 0, -2.6, 1.1, '#e9cf98', { m: { r: .95, cc: 0 } }); pile.scale.y = .45; const parts = []; let stage = 0, wash = 0;
      const PART = [[0, .5, 0, 1.8, 1, 1.4], [-.9, .9, .6, .5, 1.8, .5], [.9, .9, .6, .5, 1.8, .5], [-.9, .9, -.6, .5, 1.8, .5], [.9, .9, -.6, .5, 1.8, .5], [0, 1.6, 0, .9, 1.2, .9]];
      c.tap(pile, () => { if (wash) return; if (stage < PART.length) { const [x, y, z, w, h, d] = PART[stage]; const b = c.block(-50 + x, y - .5, -2.6 + z, w, h, d, '#e3c98f', { r: .08 }); parts.push(b); stage++; Sound.tone(300 + stage * 60, .12, 'triangle', .05, 1.1); c.burst(-50, 1, -2.6, ['#e3c98f', '#fff'], 6, 1.5); c.say(stage === PART.length ? '🏰 Your sandcastle is finished! Here comes a wave!' : '🪣 Pat pat! It is growing!'); c.disc('sandcastle', '🏰 Tap the sand to build a sandcastle!'); if (stage === PART.length) { const fl = c.toy('🚩', .7, -50, 3.4, -2.6); parts.push(fl); wash = .001; } } }, -50);
      return dt => { if (!wash) return; wash += dt; if (wash > 3) { for (const p2 of parts) { p2.position.y -= dt * 2; } if (wash > 4.5) { for (const p2 of parts) c.remove(p2); parts.length = 0; stage = 0; wash = 0; c.say('🌊 Whoosh! The wave washed it away. Build it again!'); } } }; },
    // crabs scuttling sideways on the beach (tap them: they dance), and Pinchy, who wants to be your friend
    () => { const crabs = [[-60, -1.6], [-70, -3.2], [-76, -1.8]].map(([x, z], i) => { const m = makePalMesh('crab'); m.scale.setScalar(.75); m.position.set(x, 0, z); c.add(m); c.tap(m, () => { m.userData.dance = 1.5; Sound.tone(900, .05, 'square', .03, 1); Sound.tone(900, .05, 'square', .03, 1, .1); c.say('🦀 Snap snap! A crab dance!'); c.disc('crabs', '🦀 Crabs! Tap them to see them dance.'); }); return { m, x, ph: i * 2 }; });
      const pal = palAtHome(c, 'crab');
      return (dt, t) => { for (const k of crabs) { k.m.position.x = k.x + Math.sin(t * .7 + k.ph) * 2.2; const d = k.m.userData.dance || 0; k.m.userData.dance = Math.max(0, d - dt); k.m.rotation.y = d > 0 ? Math.sin(t * 20) * .5 : 0; k.m.userData.body.position.y = d > 0 ? Math.abs(Math.sin(t * 14)) * .2 : 0; } pal && pal(dt, t); }; },
    // seashells half-buried in the sand: tap to collect them (each is remembered)
    () => { X.shells = X.shells || []; const SH = [['s1', -84, -1.2], ['s2', -91, -3], ['s3', -104, -1.6], ['s4', -122, -2.6], ['s5', -129, -1.3], ['s6', -140, -2.4]];
      for (const [id, x, z] of SH) { if (X.shells.includes(id)) continue; const sp = c.toy(pick(['🐚', '🐚', '🦪']), .7, x, .3, z); c.tap(sp, () => { if (!sp.parent) return; c.remove(sp); X.shells.push(id); Sound.twinkle(); c.burst(x, .5, z, ['#ffd1e0', '#fff'], 10, 2); c.say(X.shells.length === SH.length ? '🐚 You found all six shells!' : `🐚 A pretty shell! ${X.shells.length} of ${SH.length}!`); c.disc('shells', '🐚 Seashells! Find all six on the beach.'); api.event?.({ type: 'activity', id: 'beach_clue' }); api.saveSoon(); }); } },
    () => { const clue = c.toy('🐚', .85, -106, .55, -1.4); c.tap(clue, () => { api.event?.({ type: 'activity', id: 'beach_clue' }); Sound.twinkle(); c.say('🐚 A shell clue! Look for the red cross at Ocean Pier. Dig there for treasure!'); }, -106, { icon: '🐚', label: 'Shell clue', action: 'Look at shell', disc: 'shells' }); },
    // the lighthouse: steps up to the balcony (a gem waits there); tap the lamp to make the light spin
    () => { c.cyl(-95, 0, -5.2, 1.5, 1.8, 7, '#ffffff', { seg: 28 }); for (let k = 0; k < 3; k++) c.cyl(-95, 1 + k * 2.2, -5.2, 1.55 + (2 - k) * .1, 1.6 + (2 - k) * .1, .7, '#ff4f6a', { seg: 28 }); const top = c.cyl(-95, 7, -5.2, 1.1, 1.1, 1.2, '#fff6b0', { m: { em: '#ffe36e', ei: .6 } }); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.2, 20), mat('#ff4f6a')); roof.position.set(-95, 8.8, -5.2); c.add(roof);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(14, .5, .5), mat('#fff6b0', { em: '#fff3a0', ei: .9 })); beam.position.set(-95, 7.6, -5.2); beam.visible = false; c.add(beam);
      for (const [a, b, y] of [[-89, -87.4, 1.1], [-91.4, -89.8, 2.2], [-93.8, -92.2, 3.3], [-97.6, -92.6, 4.4]]) { c.block((a + b) / 2, y - .25, -1.9, b - a, .3, 1.2, '#9a6a3a', { r: .06 }); c.plat(a, b, y, { z: -1.6 }); }
      let spin = 0; c.tap(top, () => { spin = 6; beam.visible = true; Sound.tone(110, 1.2, 'sawtooth', .03, 1); c.say('💡 The lighthouse light is shining for the boats!'); c.disc('lighthouse', '💡 Tap the lighthouse lamp! Climb the steps for a gem.'); }, -95);
      return dt => { if (spin > 0) { spin -= dt; beam.rotation.y += dt * 2; if (spin <= 0) beam.visible = false; } }; },
    // the little boat: ring the bell on the pier and it sails across the sea and back
    () => { c.block(-115, .15, -6, 2.2, .3, 8, '#9a6a3a', { r: .05 }); const bellPost = c.cyl(-115, 0, -2.2, .06, .06, 1.6, '#9a6a3a'); const bell = c.sph(-115, 1.7, -2.2, .25, '#ffd23f', { m: { m: .6 } });
      const boat = new THREE.Group(); boat.position.set(-115, 0, -12.6); /* (build 62: moored clear of the pier's end, not in its boards) */ c.add(boat); const hull = new THREE.Mesh(boatHull(3, .75, 1.05), mat('#ff7a5c')); hull.position.y = -.05; { const rim = new THREE.Mesh(W.rbox(2.6, .1, 1.3, .05), mat('#ffffff')); rim.position.y = .74; boat.add(rim); } hull.castShadow = true; boat.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.4, 8), mat('#9a6a3a')); mast.position.y = 1.6; boat.add(mast); const sail = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.9, 3), mat('#ffffff')); sail.position.set(.35, 1.7, 0); sail.scale.z = .1; boat.add(sail);
      const gull = flyingBird(1.3); gull.position.set(-115, 4, -12.6); c.add(gull); let trip = 0; /* (build 144: a real flying gull circles the boat) */
      const go = () => { if (trip) return; trip = .001; Sound.bell ? Sound.bell(880, .06) : Sound.chime(); c.say('⛵ Ding ding! The boat is sailing!'); c.disc('boat', '⛵ Ring the bell on the pier and the boat sails away!'); };
      c.tap(bell, go, -115); c.tap(boat, () => { if (G.sail) G.sail('home'); }, -115.1, { icon: '⛵', label: 'Sailboat', action: 'Sail the ocean!', disc: 'ocean' }); /* (build 145, the family's request) tap the boat: she climbs in and sails the open ocean to the islands */
      return (dt, t) => { boat.rotation.z = Math.sin(t * 1.4) * .06; boat.position.y = Math.sin(t * 1.1) * .08; gull.userData.fly(boat.position.x + Math.sin(t * .8) * 3, 4.2 + Math.sin(t * 1.6) * .5, boat.position.z - 1 + Math.cos(t * .8) * 2.2, Math.min(dt, .1));
        if (trip) { trip += dt; const k = trip < 6 ? trip / 6 : trip < 12 ? 1 - (trip - 6) / 6 : 0; boat.position.x = -115 - Math.sin(k * Math.PI / 2) * 22; boat.position.z = -12.6 - Math.sin(k * Math.PI) * 6; boat.rotation.y = trip < 6 ? Math.PI : 0; if (trip > 12) { trip = 0; boat.position.set(-115, 0, -11); boat.rotation.y = 0; } } }; },
    // the kite: tap it and it flies up high, looping in the wind
    () => { const kite = c.toy('🪁', 1.2, -132, 1.2, -2.6); c.cyl(-132, 0, -2.6, .05, .05, .8, '#9a6a3a'); let fly = 0;
      c.tap(kite, () => { fly = fly ? 0 : .001; c.say(fly ? '🪁 Whee! The kite is flying!' : '🪁 The kite comes down to rest.'); Sound.whoosh ? Sound.whoosh() : Sound.click(); c.disc('kite', '🪁 Tap the kite and it flies up into the sky!'); }, -132);
      return (dt, t) => { const h = fly ? Math.min(1, (fly += dt) / 2) : 0; kite.position.set(-132 + Math.sin(t * 1.3) * 2.5 * h, 1.2 + h * (7 + Math.sin(t * 2.1) * 1.2), -2.6 - h * 3); kite.rotation.z = h ? Math.sin(t * 2) * .5 : 0; }; },
    // seagulls flying over the beach (tap one: squawk!)
    () => { const gulls = [0, 1, 2].map(i => { const g2 = flyingBird(1.5); g2.position.set(-60 - i * 30, 6, -6); c.add(g2); c.tap(g2, () => { Sound.tone(1200, .12, 'sawtooth', .02, .6); Sound.tone(1000, .12, 'sawtooth', .02, .6, .15); c.say('🕊️ Squawk! A seagull!'); c.disc('gulls'); }); return { g2, i }; });
      return (dt, t) => { for (const { g2, i } of gulls) { const a = t * (.11 + i * .015) + i * 2.1; /* (build 144) a big loop over the beach and out over the sea, rising and dipping */ g2.userData.fly(-85 + Math.sin(a) * 50, 6.5 + Math.sin(a * 3 + i) * 1.2 + i * .6, -9 + Math.cos(a) * 3.5, Math.min(dt, .1)); } }; },
  ];

  // =================== 🌲 WHISPERING WOODS (x -272 to -150) ===================
  // (build 117) creatures of planet-life.js living in a district (the district's kit stands in for a planet's)
  const lifeHere = (c, spots) => { const fns = [], who = id2 => LIFE[id2.replace(/^(pet|pal)_/, '')];
    populate({ P, G, X: 0, layer: '', add: c.add, U: fns, Sound, say: c.say, disc: id => disc(id), api: { burst: api.burst },
      tapIt: (o, fn, x, id2) => c.tap(o, fn, x, id2 ? { disc: id2, icon: who(id2)?.emoji || '🌲', label: who(id2)?.name } : {}) }, spots);
    return (dt, t) => { for (const f of fns) f(dt, t); }; };
  builders.woods = c => [
    () => tunnelMouth(c, -232, -4.4, 'toytown'), // (build 32) a secret tunnel to Toy Town
    // (stage 12) real trees, a fern understory and a cleared campfire circle
    () => { G.woodsDetail = buildWoodsDetail({ add: c.add }); },
    // the campfire: tap the fire for flames; tap the marshmallow to toast it golden
    () => { for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const st = c.sph(-165 + Math.cos(a) * .9, .15, -2.6 + Math.sin(a) * .9, .25, '#9a9a9a', { m: { r: .9 } }); st.scale.y = .6; } const logs = [0, 1.2].map(r => { const lg = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.4, 8), mat('#7a4a2a')); lg.rotation.set(Math.PI / 2, r, 0); lg.position.set(-165, .15, -2.6); c.add(lg); return lg; });
      const fire = c.toy('🔥', 1.4, -165, .9, -2.6); fire.visible = false; let lit = 0, toast2 = 0;
      const mm = c.sph(-163.6, 1.2, -2.2, .18, '#ffffff', { m: { r: .8 } }); mm.material = mm.material.clone(); c.cyl(-163.1, .6, -2.2, .02, .02, 1.6, '#9a6a3a');
      for (const lg of logs) c.tap(lg, () => { lit = lit ? 0 : 1; fire.visible = !!lit; Sound.noise && Sound.noise(.6, 200, 900, .04); c.say(lit ? '🔥 Whoosh! A cosy campfire!' : '💨 The fire goes out.'); c.disc('campfire', '🔥 Tap the logs to light the campfire!'); }, -165);
      c.tap(mm, () => { if (!lit) { c.say('🔥 Light the fire first, then toast the marshmallow!'); return; } toast2++; mm.material.color.set(toast2 === 1 ? '#f5d38a' : toast2 === 2 ? '#c98a3a' : '#ffffff'); c.say(toast2 === 1 ? '🍡 Toasty and golden!' : toast2 === 2 ? '😋 Yum! A perfect marshmallow!' : '🍡 A fresh marshmallow!'); if (toast2 > 2) toast2 = 0; Sound.giggle(); c.disc('marshmallow'); });
      return (dt, t) => { if (lit) { fire.scale.setScalar(1.3 + Math.sin(t * 10) * .12); if (Math.random() < dt * 6) c.burst(-165, 1.4, -2.6, ['#ffb23f', '#ff6a2a'], 1, 1); } }; },
    // the hollow log: tap it and a different woodland animal peeks out each time
    () => { const lg = new THREE.Mesh(new THREE.CylinderGeometry(.7, .75, 3, 18), mat('#7a4a2a', { r: .9 })); lg.rotation.z = Math.PI / 2; lg.position.set(-180, .7, -2.8); c.add(lg); const holeEnd = new THREE.Mesh(new THREE.CircleGeometry(.5, 18), mat('#3a2a1a', { r: 1 })); holeEnd.rotation.y = Math.PI / 2; holeEnd.position.set(-178.48, .7, -2.8); c.add(holeEnd); // (a closed log with a dark hole: no double-sided shader needed)
      const who = c.toy('🦔', 1, -178.4, .7, -2.8); who.visible = false; const ANI = [['🦔', 'a hedgehog'], ['🐰', 'a bunny'], ['🐿️', 'a squirrel'], ['🦉', 'an owl'], ['🐸', 'a frog'], ['🦡', 'a badger']]; let k = -1, show = 0;
      c.tap(lg, () => { k = (k + 1) % ANI.length; setToySymbol(who, ANI[k][0]); groundToy(who); who.visible = true; show = 2.5; Sound.giggle(); c.say(`🪵 Peekaboo! It's ${ANI[k][1]}!`); c.disc('log', '🪵 Who is in the hollow log? Tap it to see!'); }, -180);
      return (dt, t) => { if (show > 0) { show -= dt; const w = Math.min(1, (2.5 - show) * 3); who.position.x = -178.4 + w * .9; who.position.y = who.userData.groundY + (w < 1 ? Math.abs(Math.sin(t * 14)) * .12 : 0); if (show <= 0) who.visible = false; } }; }, /* (build 144: it stands and hops on the ground, not in the air) */
    // A sound clue always has matching pictures, so the search works with sound off.
    () => { /* (build 64: a little birdhouse on a post, not a floating ear picture) */ const listen = new THREE.Group(); listen.position.set(-187, 0, -2.2); c.add(listen);
      { const b = makeBatch(); b.put(new THREE.CylinderGeometry(.07, .09, 1.5, 10), 0, .75, 0, '#8a5a3a'); b.put(W.rbox(.6, .6, .5, .08), 0, 1.75, 0, '#ffd9a8');
        b.put(new THREE.ConeGeometry(.55, .4, 4).rotateY(Math.PI / 4), 0, 2.25, 0, '#ff7a9a', [1, 1, .85]); b.put(new THREE.CylinderGeometry(.12, .12, .02, 20), 0, 1.8, .26, '#3a2a1a', 1, [Math.PI / 2, 0, 0]);
        b.put(new THREE.CylinderGeometry(.025, .025, .22, 6), 0, 1.6, .32, '#8a5a3a', 1, [Math.PI / 2, 0, 0]); listen.add(b.mesh(shinyMat())); } /* (one mesh) */ const owl = c.toy('🦉', 1.2, -201, 2.2, -3); owl.visible = false; let listening = world.adventures?.events.includes('woods_listen') || false;
      /* (build 144, the family's report: the little owl pictures were too small to see) big owl pictures on posts along the path; after the owl call they light up one after another, pointing the way */ const owlSigns = [-190, -194, -198].map(x => { c.cyl(x, 0, -2, .06, .07, 1.3, '#8a5a3a'); return c.sign('🦉', 1.05, x, 1.75, -1.95); });
      c.tap(listen, () => { listening = true; api.event?.({ type: 'activity', id: 'woods_listen' }); Sound.tone(420, .3, 'sine', .05, 1); Sound.tone(340, .4, 'sine', .05, 1, .4); c.say('🦉 Hoo hoo! Follow the owl pictures to the hidden owl!'); }, -187, { icon: '👂', label: 'Owl call', action: 'Listen', disc: 'woods_listen' });
      const reveal = () => { if (!listening) { c.say('🏠 Tap the little birdhouse, then follow the owl pictures!'); return; } owl.visible = true; api.event?.({ type: 'activity', id: 'woods_found' }); Sound.giggle(); c.say('🦉 You found the owl! Hoo hoo!'); };
      const hiding = c.sph(-201, .8, -3, .8, '#3f8f4a', { m: { r: .9 } }); c.tap(hiding, reveal, -201, { icon: '🦉', label: 'Hidden owl', action: 'Find owl', disc: 'woods_found' }); c.tap(owl, reveal);
      return (dt, t) => { const on = listening && !owl.visible; owlSigns.forEach((sg, i) => { const k = on ? Math.max(0, Math.sin(t * 3 - i * 1.1)) : 0; sg.scale.setScalar(1 + k * .25); sg.position.y = 1.75 + k * .15; }); }; },
    // berry bushes: tap a bush, berries drop into the basket, and we count them
    () => { const bush = c.sph(-195, .9, -3, 1.1, '#3f8f4a', { m: { r: .9 } }); bush.scale.set(1.3, .9, .9); const berries = []; for (let i = 0; i < 6; i++) berries.push(c.sph(-195.8 + (i % 3) * .8, 1.2 + Math.floor(i / 3) * .5, -2.2, .13, '#c2185b', { m: { r: .4 } }));
      c.cyl(-192.4, 0, -2, .5, .4, .5, '#c8925a', { r: .8 }); let n = 0;
      c.tap(bush, () => { const b = berries.find(q => q.visible); if (!b) { berries.forEach(q => { q.visible = true; q.position.set(q.userData.x0 ?? q.position.x, q.userData.y0 ?? q.position.y, -2.2); }); n = 0; c.say('🫐 The berries grew back!'); return; } b.userData.x0 = b.userData.x0 ?? b.position.x; b.userData.y0 = b.userData.y0 ?? b.position.y; b.visible = false; n++; c.say(['', 'one', 'two', 'three', 'four', 'five', 'six'][n] + '!'); Sound.tone(500 + n * 60, .1, 'triangle', .05, 1.2); c.burst(-192.4, .6, -2, ['#c2185b'], 4, 1); if (n === 6) c.say('🧺 Six berries in the basket! Yummy!'); c.disc('berries', '🧺 Pick berries! Tap the bush and count them.'); }, -195); },
    // leaf piles on the path: run through them and the leaves fly everywhere
    () => { const piles = [-207, -212, -217].map(x => { const p2 = c.sph(x, 0, 0, .9, pick(['#e8902a', '#d9682a', '#f2b23a']), { m: { r: .9 } }); p2.scale.y = .35; return { p2, x, t: 0 }; });
      return (dt) => { for (const q of piles) { q.t = Math.max(0, q.t - dt); if (q.t <= 0 && P.layer === '' && Math.abs(P.x - q.x) < 1 && P.y < .8 && Math.abs(P.vx) > 1) { q.t = 2; c.burst(q.x, .5, 0, ['#e8902a', '#d9682a', '#f2b23a', '#8a5a2a'], 22, 3.5); Sound.whoosh ? Sound.whoosh() : Sound.click(); c.disc('leaves', '🍂 Crunch! Run through the leaf piles!'); } q.p2.scale.y = .35 * (q.t > 0 ? .4 + (2 - q.t) * .3 : 1); } }; },
    // the creek: stepping logs across (jump from log to log), with a gem on the tall one
    () => { const w = new THREE.Mesh(new THREE.BoxGeometry(7, .05, 13.3), mat('#4fb3ff', { r: .15, cc: .6 })); w.position.set(-226, .02, -4.35); c.add(w); /* (build 60: the creek stops before the train track; it used to run over the rails) */
      for (const [x, y] of [[-223.5, .5], [-226, 1.0], [-228.5, .5]]) { c.cyl(x, 0, -.4, .45, .5, y, '#8a5a2a', { r: .9 }); c.plat(x - .5, x + .5, y, { z: -.4, step: true, stepMax: .6, onLand: () => c.disc('logs', '🪵 Hop across the stepping logs!') }); } },
    // a jar of fireflies: tap it and they swirl out, glowing
    () => { const jar = c.cyl(-240, .6, -2.4, .35, .35, .8, '#cfefff', { m: { r: .1, cc: .6 } }); c.block(-240, 0, -2.4, 1, .6, 1, '#9a6a3a', { r: .1 }); const flies = []; let out = 0;
      for (let i = 0; i < 10; i++) { const f = c.sph(-240, 1, -2.4, .06, '#fff58a', { m: { em: '#fff58a', ei: 2 } }); f.visible = false; flies.push({ f, ph: i * .7 }); }
      c.tap(jar, () => { out = 8; flies.forEach(q => { q.f.visible = true; }); Sound.twinkle(); c.say('✨ The fireflies are dancing!'); c.disc('fireflies', '✨ Tap the jar to let the fireflies dance!'); }, -240);
      return (dt, t) => { if (out <= 0) return; out -= dt; for (const q of flies) { const r = Math.min(1, (8 - out)) * 2.2; q.f.position.set(-240 + Math.cos(t * 1.5 + q.ph) * r, 1.6 + Math.sin(t * 2.3 + q.ph) * .8, -2.4 + Math.sin(t * 1.5 + q.ph) * r * .5); } if (out <= 0) flies.forEach(q => { q.f.visible = false; }); }; },
    // paw prints on the path lead to the fox den, where Rusty the fox cub lives
    () => { for (let i = 0; i < 8; i++) { const pr = c.sign('🐾', .45, -247 - i * 1.6, .03, (i % 2) * .4 - .2);  }
      const den = c.sph(-263, 0, -4.4, 2, '#8a6a4a', { m: { r: .95 } }); den.scale.set(1.3, .7, 1); const hole = c.sph(-263, .4, -2.7, .7, '#3a2a1a', { m: { r: 1 } }); hole.scale.set(1, .8, .3);
      const pal = palAtHome(c, 'fox'); c.tap(den, () => { c.say(X.pals.fox ? '🦊 This is Rusty\'s den!' : '🦊 Somebody lives here... tap the little fox to say hello!'); Sound.click(); });
      return (dt, t) => { pal && pal(dt, t); }; },
    // (build 117) THE WOODS ARE ALIVE: woodland friends and pets to befriend (planet-life.js), built and freed with the woods;
    //  15 m apart, so at most two are on screen at once (three in view measured slower)
    () => lifeHere(c, [['shroomy', -160, -5.6], ['hedgehog', -175, -5.6], ['puffball', -190, -5.6], ['ladybug', -205, -5.4], ['otterpup', -220, -5.6], ['raccoonkit', -235, -5.6], ['twiggy', -250, -5.6], ['fawn', -268, -6.8]]),
  ];

  // =================== ❄️ FROSTY PEAKS (x -404 to -272) ===================
  builders.frosty = c => [
    ...familyParts(c, 'frosty'),
    // (stage 13) snow-capped ridgeline, drifts, snow-loaded pines and an ice arch
    () => { G.frostyDetail = buildFrostyDetail({ add: c.add }); },
    () => lifeHere(c, [['drawingteal', -288, -3.6]]),
    // the sledding hill: climb the snowy steps, tap the sled at the top and whoosh down the other side
    () => { const hill = c.sph(-328, -2.2, -5.5, 8, '#f3f8ff', { m: { r: .9, cc: 0 } }); hill.scale.set(1, .9, .55);
      for (const [a, b, y] of [[-318.5, -320.5, 1.2], [-321, -323, 2.4], [-323.5, -325.5, 3.6], [-326, -331, 4.8]]) { c.block((a + b) / 2, 0, -2.0, Math.abs(b - a), y, 1.6, '#b9dcf5', { r: .3 }); /* (build 62: icy blue steps, not grey boxes against the snow) */ c.plat(Math.min(a, b), Math.max(a, b), y, { z: -1.9 }); } /* (build 124: the steps stand just behind her path, so she walks in front of them, never through them; she steps back onto them as she climbs) */
      const sled = new THREE.Group(); sled.position.set(-330, 4.8, -1.9); c.add(sled); const base = new THREE.Mesh(W.rbox(1.3, .18, .7, .08), mat('#ff4f6a')); base.position.y = .25; sled.add(base); for (const z of [-.3, .3]) { const run = new THREE.Mesh(W.rbox(1.5, .06, .06, .03), mat('#ffd23f', { m: .5 })); run.position.set(0, .08, z); sled.add(run); }
      const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-331, 5.4, -1.9), new THREE.Vector3(-334, 4.6, -1.4), new THREE.Vector3(-338, 2.6, -.6), new THREE.Vector3(-342, 1, -.2), new THREE.Vector3(-346, .6, 0)]);
      chute(c, mat, path, '#cfe9ff', '#ffffff'); /* (build 125) the icy run the sled slides down */
      c.tap(sled, () => { if (P.y < 4.3) { c.say('🛷 Climb up the snowy steps to the sled!'); return; } api.startSlide(path); c.disc('sled', '🛷 Wheee! Sledding down the hill!'); c.say('🛷 Wheee!'); }, -330, { y: 4.8, hintY: 1.4 }); }, // (build 49: PAW works at the top: the sled sits 4.8 m up, and PAW only reaches things near her height)
    // build a snowman: each tap adds a part, then a carrot nose and a hat
    () => { const pile = c.sph(-300, 0, -2.6, .9, '#ffffff', { m: { r: .9, cc: 0 } }); pile.scale.y = .4; const parts = []; let k = 0;
      const STEPS = [() => c.sph(-297, .8, -2.6, .8, '#ffffff', { m: { r: .9, cc: 0 } }), () => c.sph(-297, 2, -2.6, .6, '#ffffff', { m: { r: .9, cc: 0 } }), () => c.sph(-297, 2.95, -2.6, .45, '#ffffff', { m: { r: .9, cc: 0 } }),
        () => { const n = new THREE.Mesh(new THREE.ConeGeometry(.09, .5, 10), mat('#ff8a1f')); n.rotation.z = -Math.PI / 2; n.position.set(-296.5, 2.95, -2.2); n.rotation.y = -.6; c.add(n); return n; }, () => c.toy('🎩', .8, -297, 3.55, -2.6)];
      if (world.adventures?.events?.includes('snow_built')) { for (const build of STEPS) parts.push(build()); k = STEPS.length; }
      const roll = c.sph(-302, .35, -1.5, .35, '#ffffff', { m: { r: .9, cc: 0 } });
      c.tap(roll, () => { roll.rotation.z -= 1; api.event?.({ type: 'activity', id: 'snow_rolled' }); Sound.boing(); c.say('⚪ Roll roll! A snowball for your snow friend!'); }, -302, { icon: '⚪', label: 'Snowball', action: 'Roll snowball', disc: 'snow_rolled' });
      c.tap(pile, () => { if (k < STEPS.length) { parts.push(STEPS[k]()); k++; Sound.tone(400 + k * 70, .12, 'sine', .05, 1.2); c.say(['⛄ A big snowball!', '⛄ Now the middle!', '⛄ And the head!', '🥕 A carrot nose!', '🎩 A hat! Hello, Mister Snowman!'][k - 1]); c.disc('snowman', '⛄ Tap the snow to build a snowman!'); if (k === STEPS.length) { api.event?.({ type: 'activity', id: 'snow_built' }); Sound.giggle(); c.burst(-297, 3.5, -2.6, ['#ffffff', '#9fe6ff'], 20, 3); } }
        else { for (const q of parts) c.remove(q); parts.length = 0; k = 0; c.say('☀️ The sun melted the snowman! Build a new one!'); } }, -300, { icon: '⛄', label: 'Snow friend', action: 'Build snow friend', disc: 'snowman' }); },
    // (build 144, the family's request: really throw snowballs) SNOWBALL TOSS: tap the snow pile and she scoops and packs a
    //  snowball (it grows in her hand). Then tap the target exactly where you want it to go: the snowball flies there and
    //  leaves a splat. The middle is a bullseye! The splats melt away after a while.
    () => { const TX = -312, TY = 2, TZ = -3.95; c.cyl(TX, 0, -4, .08, .08, 2, '#9a6a3a'); const rings = [[1, '#ff4f6a', 0], [.6, '#ffffff', .05], [.25, '#ff4f6a', .1]].map(([r, col, dz]) => { const m = c.cyl(TX, TY + dz * .1, TZ + dz, r, r, .12, col); m.rotation.x = Math.PI / 2; return m; });
      const pile = c.sph(-306.5, 0, -1.6, .55, '#ffffff', { m: { r: .9, cc: 0 } }); pile.scale.y = .5;
      const ballM = mat('#ffffff', { r: .9, cc: 0 }), held = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), ballM); held.scale.setScalar(.01);
      let st = 'none', t0 = 0, hits = 0; const flying = [], splats = [];
      const make = () => { if (st !== 'none' || P.layer !== '' || Math.abs(P.x + 306.5) > 4) return; st = 'make'; t0 = 0; G.hold(held); held.scale.setScalar(.05); Sound.noise ? Sound.noise(.5, 300, 1200, .04) : Sound.click(); c.say('❄️ Scoop, pat, pat... making a snowball!'); };
      const throwAt = h => { if (st === 'none') { c.say('❄️ Make a snowball first: tap the snow pile!'); return; } if (st !== 'ready') return;
        const from = new THREE.Vector3(); held.getWorldPosition(from); G.hold(null); st = 'none';
        const to = h ? h.point.clone() : new THREE.Vector3(TX, TY, TZ + .12); to.z = TZ + .14; const b = new THREE.Mesh(held.geometry, ballM); b.scale.setScalar(.22); b.position.copy(from); c.add(b); flying.push({ b, from, to, t: 0 }); Sound.whoosh ? Sound.whoosh() : Sound.click(); };
      c.tap(pile, make, -306.5, { icon: '⚪', label: 'Snow pile', action: 'Make a snowball', disc: 'snowball' }); for (const r of rings) c.tap(r, throwAt);
      return dt => {
        if (st !== 'none' && (P.layer !== '' || Math.abs(P.x + 306.5) > 12 || G.holding !== held)) { st = 'none'; if (G.holding === held) G.hold(null); }
        if (st === 'make') { t0 += dt; held.scale.setScalar(.05 + Math.min(1, t0 / .9) * .17); if (t0 >= .9) { st = 'ready'; Sound.tone(520, .1, 'sine', .05, 1.2); c.say('❄️ A snowball! Now tap the target where you want to throw it!'); } }
        for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i]; f.t += dt; const k = Math.min(1, f.t / .7); f.b.position.lerpVectors(f.from, f.to, k); f.b.position.y += Math.sin(k * Math.PI) * 1.6;
          if (k >= 1) { c.remove(f.b); flying.splice(i, 1); hits++; const d = Math.hypot(f.to.x - TX, f.to.y - TY), where = d < .3 ? 0 : d < .65 ? 1 : 2;
            const sp = c.cyl(f.to.x, f.to.y, f.to.z + .02, .16, .16, .03, '#ffffff'); sp.rotation.x = Math.PI / 2; sp.scale.set(1.4, 1, 1.1); splats.push({ m: sp, life: 6 });
            Sound.tone([880, 520, 300][where], .18, 'square', .03, .6); c.burst(f.to.x, f.to.y, f.to.z + .2, where ? ['#ffffff', '#dff3ff'] : ['#ffd23f', '#ffffff', '#ff4f6a'], where ? 12 : 26, 2);
            c.say(['🌟 BULLSEYE! Right in the middle!', '❄️ Splat! Close to the middle!', '❄️ Splat! On the target!'][where] + (hits % 5 === 0 ? ` ${NUM[5]} snowballs!` : ''));
            c.disc('snowball', '❄️ Make a snowball and throw it at the target!'); if (!where) c.disc('bullseye', '🌟 Hit the middle of the snowball target!'); } }
        for (let i = splats.length - 1; i >= 0; i--) { const sp = splats[i]; sp.life -= dt; if (sp.life < 1) sp.m.scale.setScalar(Math.max(.01, sp.life) * 1.2); if (sp.life <= 0) { c.remove(sp.m); splats.splice(i, 1); } } }; },
    // the frozen pond: step on the ice and you glide along (slippery!)
    () => { const ice = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .06, 48), mat('#bfe6ff', { r: .08, cc: .8 })); ice.scale.set(7.2, 1, 2.68); /* (build 64: an oval pond, not a hard-edged rectangle) */ ice.position.set(-361, .03, -1.22); /* (build 62: ends at the path's front edge, never past it) */ /* (build 60: the pond stops before the train track) */ ice.receiveShadow = true; c.add(ice); let glide = 0, was = false;
      return dt => { const keys = api.getKeys(), on = P.layer === '' && P.grounded && P.y < .3 && P.x > -368 && P.x < -354 && !P.ride, held = keys.left || keys.right;
        if (on && Math.abs(P.vx) > 1 && held) glide = P.vx; if (on && !held && Math.abs(glide) > .3) { P.x = Math.max(-367.5, Math.min(-354.5, P.x + glide * dt)); glide *= Math.max(0, 1 - dt * .7); if (!was) { c.say('⛸️ Wheee! Slippery ice!'); c.disc('ice', '⛸️ Slide across the frozen pond!'); } was = true; } else if (!on) { glide = 0; was = false; } }; },
    // the igloo: tap it, it glows warm inside
    () => { const ig = c.sph(-380, 0, -4.4, 2.4, '#f3f8ff', { m: { r: .6, cc: 0 } }); ig.scale.y = .8; const door = c.sph(-380, 0, -2.3, .9, '#cfe3f7', { m: { r: .6, cc: 0 } }); door.scale.set(1, 1.1, .8); const glow = c.sph(-380, .2, -2.05, .55, '#ffcf6a', { m: { em: '#ffb23f', ei: .05 } }); glow.material = glow.material.clone(); let warm = 0;
      c.tap(ig, () => { warm = 5; c.say('🔥 The igloo is cosy and warm inside!'); Sound.chime(); c.disc('igloo', '🏠 An igloo! Tap it to warm it up.'); }, -380); c.tap(door, () => { warm = 5; c.say('☕ Hot cocoa in the igloo! Yum!'); Sound.giggle(); });
      return (dt, t) => { warm = Math.max(0, warm - dt); glow.material.emissiveIntensity = warm > 0 ? 1.2 + Math.sin(t * 6) * .3 : .05; }; },
    // northern lights: tap the star pole and coloured ribbons dance in the sky
    () => { c.cyl(-345, 0, -3.4, .07, .07, 2.6, '#c9a6ff'); const star = c.toy('🌟', 1, -345, 3, -3.4); const rib = [['#3cf0b5', 0], ['#7a7cff', 1.4], ['#ff7ad9', 2.8]].map(([col, k]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(60, 4, .2), mat(col, { em: col, ei: .9 })); r.position.set(-340, 26 + k * 2, -70); r.visible = false; c.add(r); return r; }); let on = 0;
      c.tap(star, () => { on = 10; rib.forEach(r => { r.visible = true; }); Sound.twinkle(); Sound.chime(); c.say('🌌 The northern lights are dancing in the sky!'); c.disc('aurora', '🌌 Tap the star to make the northern lights!'); }, -345);
      return (dt, t) => { if (on <= 0) return; on -= dt; rib.forEach((r, i) => { r.rotation.z = Math.sin(t * .6 + i) * .15; r.position.y = 26 + i * 2.2 + Math.sin(t * .9 + i * 2) * 1.5; r.visible = on > 0; }); }; },
    // Pebble the penguin waits by the igloo; little penguins waddle about
    () => { const pens = [-366, -386].map(x => { const m = makePalMesh('penguin'); m.scale.setScalar(.8); m.position.set(x, 0, -3.4); c.add(m); c.tap(m, () => { m.userData.flap = 1.2; Sound.tone(1000, .08, 'sine', .04, 1.3); c.say('🐧 Squeak squeak! A happy penguin!'); c.disc('penguins'); }); return { m, x }; });
      const pal = palAtHome(c, 'penguin');
      return (dt, t) => { for (const q of pens) { q.m.position.x = q.x + Math.sin(t * .5 + q.x) * 1.6; q.m.userData.body.rotation.z = Math.sin(t * 8 + q.x) * .1; const f = q.m.userData.flap || 0; q.m.userData.flap = Math.max(0, f - dt); if (q.m.userData['fl-1']) { q.m.userData['fl-1'].rotation.x = f > 0 ? Math.sin(t * 20) * .8 : 0; q.m.userData.fl1.rotation.x = f > 0 ? -Math.sin(t * 20) * .8 : 0; } } pal && pal(dt, t); }; },
    // gently falling snow around you while you're here (a small pool of flakes that follows the camera)
    () => { const flakes = []; for (let i = 0; i < 28; i++) { const f = c.toy('❄️', .25 + Math.random() * .2, 0, 0, 0); f.userData.o = [Math.random() * 30 - 15, Math.random() * 10, -Math.random() * 8 + 1]; flakes.push(f); }
      return (dt, t) => { const here = P.x > -406 && P.x < -270; for (const f of flakes) f.visible = here; if (!here) return; /* (build 35: snow only falls in Frosty Peaks, not on the farm next door) */ for (const f of flakes) { const o = f.userData.o; o[1] -= dt * .9; if (o[1] < 0) o[1] += 10; f.position.set(P.x + o[0] + Math.sin(t + o[2]) * .4, o[1], o[2]); } }; },
  ];

  // =================== 🚜 HAPPY FARM (x -536 to -404) — build 35 ===================
  // Every activity is picture + sound + spoken words only, and teaches something small: counting (eggs, carrots, apples,
  // ducklings), colours (the rainbow sheep), animal names and sounds (the barn), growing (seed → sprout → carrot).
  const COLOURS = [['#ff6fae', 'pink'], ['#4fa8ff', 'blue'], ['#ffd23f', 'yellow'], ['#3cc46e', 'green'], ['#a15cff', 'purple'], ['#ff8a1f', 'orange'], ['#ffffff', 'white']];
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
  builders.farm = c => [
    ...familyParts(c, 'farm'),
    // (stage 14) fenced paddock, crop rows, round bales and a barn cupola
    () => { G.farmDetail = buildFarmDetail({ add: c.add }); },
    () => lifeHere(c, [['drawingwave', -486, -4.5]]),
    // the red barn: tap the doors and an animal comes out to say hello (a different one each time)
    () => { c.block(-420, 0, -5.6, 7, 4.2, 4, '#d8443c', { r: .15 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 4).rotateY(Math.PI / 4), mat('#8a2a24', { r: .8 })); roof.scale.z = .62; /* (build 48: the barn roof was crooked, like the house's was) */ roof.position.set(-420, 5.3, -5.6); c.add(roof);
      c.block(-420, 4.2, -3.55, 7.2, .25, .2, '#ffffff', { r: .05 }); const rails = [], doors = [-1, 1].map(s2 => { const d = c.block(-420 + s2 * .8, 0, -3.5, 1.6, 2.8, .16, '#b8322c', { r: .08 }); rails.push(c.block(-420 + s2 * .8, 1.4, -3.4, 1.4, .14, .06, '#ffffff', { r: .02 })); return d; }); /* (build 124: each door's white rail slides with its door, so the animal never stands behind a rail floating in the doorway) */
      { const hb = makeBatch(), bx = new THREE.BoxGeometry(1, 1, 1); hb.put(bx, -420, 2.95, -3.55, '#8a2a24', [1.5, 1.05, .12]); hb.put(bx, -420, 2.95, -3.47, '#ffffff', [1.6, .1, .06]); hb.put(bx, -420, 2.95, -3.47, '#ffffff', [.1, 1.1, .06]); c.add(hb.mesh(shinyMat())); bx.dispose(); } /* a real hayloft door with a white cross (one mesh), instead of the little door picture that floated on the wall */
      const who = c.toy('🐴', 1.4, -420, 1.1, -3.1); who.visible = false; const ANI = [['🐴', 'a horse', 'Neigh!', 520], ['🐄', 'a cow', 'Moo!', 140], ['🐐', 'a goat', 'Maa!', 600], ['🐑', 'a sheep', 'Baa!', 480], ['🐓', 'a rooster', 'Cock-a-doodle-doo!', 900]]; let k = -1, show = 0;
      const open = () => { k = (k + 1) % ANI.length; setToySymbol(who, ANI[k][0]); who.position.z = -3.4; groundToy(who); who.visible = true; show = 4.2; Sound.tone(ANI[k][3], .25, 'sawtooth', .025, .7); Sound.tone(ANI[k][3] * .8, .3, 'sawtooth', .02, .7, .25); c.say(`${ANI[k][0]} ${ANI[k][2]} It's ${ANI[k][1]}!`); c.disc('barn', '🏚️ Tap the barn doors: who lives inside?'); };
      c.tap(doors[0], open, -420); c.tap(doors[1], open); c.tap(who, open);
      return (dt, t) => { if (show > 0) { show -= dt; const o = Math.min(1, (4.2 - show) * 3, show * 3), w = Math.min(1, (4.2 - show) / 1.2, show / 1.2); doors[0].position.x = -420.8 - o * 1.4; doors[1].position.x = -419.2 + o * 1.4; rails[0].position.x = doors[0].position.x; rails[1].position.x = doors[1].position.x;
        /* (build 144) it WALKS out on the ground, step by step (a little waddle), says hello, and walks back in: it no longer floats */ const walking = w < 1; who.position.z = -3.4 + w * 2.2; who.position.y = who.userData.groundY + (walking ? Math.abs(Math.sin(t * 12)) * .08 : 0); who.rotation.z = walking ? Math.sin(t * 12) * .1 : 0; who.rotation.y = show < 1.2 ? Math.PI : 0; if (show <= 0) { who.visible = false; who.rotation.y = 0; } } }; },
    // the hen house: tap the hen and she lays an egg in the basket; count to five and the chicks hatch
    () => { c.block(-432, 0, -4.4, 2.6, 1.8, 2, '#f2c27a', { r: .1 }); const rf = new THREE.Mesh(new THREE.ConeGeometry(2, 1, 4).rotateY(Math.PI / 4), mat('#d8443c')); rf.scale.z = .7; /* (build 48: straight coop roof) */ rf.position.set(-432, 2.3, -4.4); c.add(rf);
      const hen = groundToy(c.toy('🐔', 1.1, -431, .7, -2.6)); /* (build 144: on the ground) */ c.cyl(-433.4, 0, -2.4, .55, .45, .45, '#c8925a', { r: .8 }); const eggs = []; const chicks = []; let hatch = 0;
      c.tap(hen, () => { if (hatch) return; const n = eggs.length; const e = c.sph(-433.6 + (n % 3) * .22, .55 + Math.floor(n / 3) * .14, -2.4 + (n % 2) * .1, .11, '#fff6e6', { m: { r: .6 } }); e.scale.y = 1.25; eggs.push(e); Sound.pop ? Sound.pop() : Sound.click(); hen.position.y = 1;
        c.say(`🥚 ${NUM[eggs.length]}!`); c.disc('eggs', '🐔 Tap the hen! Count her eggs.'); if (eggs.length === 5) { hatch = .001; c.say('🥚 Five eggs! Crack crack... the chicks are hatching!'); } }, -431);
      return (dt, t) => { hen.position.y += (.7 - hen.position.y) * Math.min(1, dt * 6); hen.rotation.z = Math.sin(t * 3) * .08;
        if (hatch) { hatch += dt; if (hatch > 1.5 && eggs.length) { for (const e of eggs) c.remove(e); eggs.length = 0; for (let i = 0; i < 5; i++) chicks.push(c.toy('🐥', .5, -433.4, .3, -2.2)); Sound.giggle(); c.burst(-433.4, .6, -2.2, ['#ffe36e', '#fff'], 16, 2); }
          chicks.forEach((ch, i) => { ch.position.x = -433.4 - Math.sin(t * 2 + i) * (1 + i * .4); ch.position.z = -1.6 + Math.cos(t * 1.6 + i * 1.3) * .5; ch.position.y = .3 + Math.abs(Math.sin(t * 9 + i)) * .12; });
          if (hatch > 9) { for (const ch of chicks) c.remove(ch); chicks.length = 0; hatch = 0; } } }; },
    // Truffle the piglet lives by the mud puddle; little piglets splash in it
    () => { const mud = c.cyl(-446, 0, -3.6, 2.2, 2.2, .06, '#7a5236', { r: .2, cc: .5 }); mud.scale.z = .55; const pigs = [-444.6, -447.6].map((x, i) => { const m = makePalMesh('pig'); m.scale.setScalar(.7); m.position.set(x, 0, -3.8); c.add(m); c.tap(m, () => { m.userData.sp = 1.2; Sound.tone(220, .12, 'sawtooth', .03, .8); Sound.tone(180, .14, 'sawtooth', .03, .8, .13); c.say('🐷 Oink oink! Splish splash in the mud!'); c.burst(m.position.x, .3, -3.6, ['#7a5236', '#a07a56'], 10, 2.2); c.disc('mud', '🐷 The piglets love the mud! Tap them.'); }); return { m, x, i }; });
      const pal = palAtHome(c, 'pig');
      return (dt, t) => { for (const q of pigs) { const sp = q.m.userData.sp || 0; q.m.userData.sp = Math.max(0, sp - dt); q.m.position.x = q.x + Math.sin(t * .6 + q.i * 2) * .8; q.m.userData.body.position.y = sp > 0 ? Math.abs(Math.sin(t * 14)) * .25 : 0; q.m.rotation.y = Math.cos(t * .6 + q.i * 2) > 0 ? 0 : Math.PI; if (q.m.userData.curl) q.m.userData.curl.rotation.y = t * 5; } pal && pal(dt, t); }; },
    // the rainbow sheep: tap her and her fluffy wool changes colour (and she says the colour)
    () => { const sheep = new THREE.Group(); sheep.position.set(-457, 0, -2.6); c.add(sheep); const wool = new THREE.Mesh(new THREE.SphereGeometry(.7, 18, 12), mat('#ffffff', { r: .95, cc: 0 })); wool.scale.set(1.35, .95, 1); wool.position.y = 1; wool.castShadow = true; sheep.add(wool);
      const puffs = [[-.6, 1.3], [0, 1.55], [.6, 1.3]].map(([x, y]) => { const p2 = new THREE.Mesh(new THREE.SphereGeometry(.38, 14, 10), wool.material); p2.position.set(x, y, 0); sheep.add(p2); return p2; });
      const head = new THREE.Mesh(new THREE.SphereGeometry(.32, 14, 10), mat('#3b2b30', { r: .8 })); head.position.set(1.05, 1.15, 0); sheep.add(head); for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), mat('#ffffff')); e.position.set(1.3, 1.25, s2 * .12); sheep.add(e); const lg = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .6, 8), mat('#3b2b30')); lg.position.set(.5, .3, s2 * .3); sheep.add(lg); const lg2 = lg.clone(); lg2.position.x = -.5; sheep.add(lg2); }
      let k = -1, bounce = 0;
      c.tap(sheep, () => { k = (k + 1) % COLOURS.length; const m2 = mat(COLOURS[k][0], { r: .95, cc: 0 }); wool.material = m2; puffs.forEach(p2 => { p2.material = m2; }); bounce = 1; Sound.tone(480, .2, 'sawtooth', .02, .7); c.say(`🐑 Baa! Now I am ${COLOURS[k][1]}!`); c.burst(-457, 1.8, -2.6, [COLOURS[k][0], '#fff'], 14, 2.4); c.disc('sheep', '🐑 Tap the sheep to change the colour of her wool!'); }, -457);
      return (dt, t) => { bounce = Math.max(0, bounce - dt * 1.5); sheep.position.y = Math.abs(Math.sin(bounce * 9)) * bounce * .5; head.rotation.z = Math.sin(t * 1.5) * .1; }; },
    // the haystack: climb the bales and bounce on the top (a gem floats above it)
    () => { c.add(hayBales([[-464, 0, 3], [-466, 1, 3], [-467.5, 2, 2.2]].map(([x, y, w]) => [x, y, -2.05, w, 1, 1.6]))); /* (build 124: the steps stand just behind her path, so she walks in front of them, never through them; she steps back onto them as she climbs) */ /* (build 54: tied straw bales, one mesh) */ c.sph(-467.5, 2.95, -2.05, .9, '#f0d070', { m: { r: .95, cc: 0 } }).scale.set(1.15, .55, .85); /* (build 125: a straw mound sitting on the top bale; it hung off the side like a flat floating disc) */
      c.plat(-465.5, -462.5, 1, { z: -1.9, step: true, stepMax: 1.05 }); c.plat(-467.5, -464.5, 2, { z: -1.9, step: true, stepMax: 1.05 }); c.plat(-468.6, -466.4, 3.05, { z: -1.9, pad: true, bounce: 12.5, onLand: () => c.disc('hay', '🌾 Boing! Bounce on the haystack!') }); },
    // the vegetable patch: tap a mound to plant a seed, again for a sprout, again for a carrot, then pull it up
    () => { let pulled = 0; for (let i = 0; i < 4; i++) { const x = -476 - i * 1.6; const mound = c.sph(x, 0, -2.2, .55, '#8a5a3a', { m: { r: .95, cc: 0 } }); mound.scale.y = .35; let st2 = 0; const leaf = c.sph(x, .3, -2.2, .15, '#3cc46e', { m: { r: .7 } }); leaf.scale.set(.6, 1.6, .6); leaf.visible = false; const car = c.toy('🥕', .8, x, .9, -2.2); car.visible = false;
        c.tap(mound, () => { st2++; if (st2 === 1) { api.event?.({ type: 'activity', id: 'seed_planted' }); c.say('🌱 Plant a seed!'); Sound.tone(500, .08, 'sine', .04, 1); leaf.visible = true; leaf.scale.set(.3, .5, .3); }
          else if (st2 === 2) { c.say('🌿 It is growing!'); leaf.scale.set(.7, 1.8, .7); Sound.tone(600, .08, 'sine', .04, 1); }
          else if (st2 === 3) { c.say('🥕 A carrot! Tap again to pull it up!'); car.visible = true; car.position.y = .45; Sound.tone(760, .1, 'sine', .04, 1); }
          else { api.event?.({ type: 'activity', id: 'carrot_harvest' }); pulled++; c.say(`🥕 Pop! ${NUM[Math.min(6, pulled)] || pulled} carrot${pulled > 1 ? 's' : ''}!`); Sound.pop ? Sound.pop() : Sound.click(); c.burst(x, .6, -2.2, ['#ff8a1f', '#3cc46e'], 10, 2); leaf.visible = false; car.visible = false; st2 = 0; if (pulled >= 4) pulled = 0; }
          c.disc('garden', '🥕 Plant a seed, watch it grow, and pull up a carrot!'); }, i === 0 ? -478 : undefined, { icon: '🥕', label: 'Vegetable patch', action: 'Grow a carrot', disc: 'garden' }); } },
    // the apple tree: tap it and an apple drops into the basket; count to five
    () => { c.cyl(-492, 0, -3.4, .35, .45, 2.6, '#7a4a2a', { r: .9 }); const crown = c.sph(-492, 3.6, -3.4, 2, '#3f9f4a', { m: { r: .9 } }); crown.scale.y = .8; const apples = []; for (let i = 0; i < 5; i++) { const a = c.sph(-493.2 + i * .6, 3 + (i % 2) * .5, -2, .17, '#e8352e', { m: { r: .4 } }); a.userData.home = a.position.clone(); apples.push(a); }
      c.cyl(-489.6, 0, -2, .55, .45, .45, '#c8925a', { r: .8 }); let n = 0; const falling = [];
      c.tap(crown, () => { const a = apples.find(q => !q.userData.down); if (!a) { apples.forEach(q => { q.userData.down = false; q.position.copy(q.userData.home); }); n = 0; c.say('🍎 New apples grew on the tree!'); return; } a.userData.down = true; falling.push({ a, t: 0, x0: a.position.x, y0: a.position.y }); n++; c.say(`🍎 ${NUM[n]}!`); Sound.tone(400 + n * 70, .1, 'triangle', .05, 1.2); c.disc('apples', '🍎 Tap the apple tree and count the apples!'); if (n === 5) setTimeout(() => c.say('🧺 Five apples in the basket!'), 900); }, -492);
      return dt => { for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.t += dt; const k = Math.min(1, f.t / .7); f.a.position.set(f.x0 + (-489.6 - f.x0) * k, f.y0 + (.55 - f.y0) * k * k + Math.sin(k * Math.PI) * .6, -2); if (k >= 1) falling.splice(i, 1); } }; },
    // the windmill: its sails turn slowly; tap it and they whizz round
    () => { c.cyl(-503, 0, -5.4, 1.1, 1.5, 6.5, '#f3e6cf', { seg: 16 }); const cap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.4, 16), mat('#d8443c')); cap.position.set(-503, 7.2, -5.4); c.add(cap);
      const hub = new THREE.Group(); hub.position.set(-503, 5.8, -4.1); c.add(hub); for (let i = 0; i < 4; i++) { const sail = new THREE.Mesh(W.rbox(.7, 3.4, .08, .05), mat('#ffffff', { r: .7 })); sail.position.y = 1.8; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(sail); hub.add(arm); }
      let fast = 0; c.tap(hub, () => { fast = 5; Sound.whoosh ? Sound.whoosh() : Sound.click(); c.say('🌬️ Whoosh! The windmill spins in the wind!'); c.disc('windmill', '🌬️ Tap the windmill to make it spin!'); }, -503);
      return dt => { fast = Math.max(0, fast - dt); hub.rotation.z += dt * (.4 + fast * 1.6); }; },
    // the duck pond: tap the mother duck and her ducklings swim after her in a line (one, two, three!)
    () => { const pond = c.cyl(-514, 0, -3.8, 2.6, 2.6, .05, '#4fb3ff', { r: .15, cc: .6 }); pond.scale.z = .6; const mom = c.toy('🦆', 1, -514, .45, -3.8); const kids = [0, 1, 2].map(() => c.toy('🐤', .5, -514, .3, -3.8)); let swim = 0;
      c.tap(mom, () => { swim = 8; Sound.tone(700, .1, 'square', .02, .7); Sound.tone(650, .1, 'square', .02, .7, .12); c.say('🦆 Quack quack! Follow me! One, two, three ducklings!'); c.disc('ducks', '🦆 Tap the mother duck and the ducklings follow her!'); }, -514); c.tap(pond, () => { c.say('💧 Splash!'); Sound.pop ? Sound.pop() : Sound.click(); c.burst(-514, .3, -3.6, ['#9fdcff', '#fff'], 10, 2); });
      return (dt, t) => { swim = Math.max(0, swim - dt); const sp = swim > 0 ? 1.3 : .3, a = t * sp; mom.position.set(-514 + Math.cos(a) * 1.7, .45, -3.8 + Math.sin(a) * .9); kids.forEach((k2, i) => { const b = a - (i + 1) * .45; k2.position.set(-514 + Math.cos(b) * 1.7, .3 + Math.abs(Math.sin(t * 6 + i)) * .05, -3.8 + Math.sin(b) * .9); }); }; },
    // the toy tractor: tap it and it drives across the field and back (vroom!)
    () => { const tr = new THREE.Group(); tr.position.set(-524, 0, -4.1); /* (build 64: further from the fence, which crossed it on screen) */ c.add(tr); const bd = new THREE.Mesh(W.rbox(2, .9, 1.2, .15), mat('#3cc46e', { r: .4 })); bd.position.y = .9; bd.castShadow = true; tr.add(bd); const cab = new THREE.Mesh(W.rbox(.9, 1, 1.1, .1), mat('#ffd23f', { r: .4 })); cab.position.set(-.4, 1.75, 0); tr.add(cab);
      const wheels = []; for (const [x, r] of [[-.6, .6], [.7, .38]]) for (const z of [-.65, .65]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 16), mat('#2b2d42', { r: .9 })); w.rotation.x = Math.PI / 2; w.position.set(x, r, z); tr.add(w); wheels.push(w); }
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .6, 8), mat('#666')); pipe.position.set(.6, 1.6, 0); tr.add(pipe); let drive = 0;
      c.tap(tr, () => { if (drive) return; drive = .001; Sound.tone(90, 1.2, 'sawtooth', .03, 1); c.say('🚜 Vroom vroom! The tractor drives across the field!'); c.disc('tractor', '🚜 Tap the tractor and watch it drive!'); }, -524);
      return (dt, t) => { if (!drive) { bd.position.y = .9 + Math.sin(t * 20) * .01; return; } drive += dt; const k = drive < 4 ? drive / 4 : drive < 8 ? 1 - (drive - 4) / 4 : 0; tr.position.x = -524 + Math.sin(k * Math.PI / 2) * 14; tr.rotation.y = drive < 4 ? 0 : Math.PI; for (const w of wheels) w.rotation.y += dt * 6; if (Math.random() < dt * 4) c.burst(tr.position.x + .6, 2, -5, ['#cccccc', '#ffffff'], 1, .6); if (drive > 8) { drive = 0; tr.position.x = -524; tr.rotation.y = 0; } }; },
    // cows grazing in the far field (tap one: moo!)
    () => { const cows = [[-438, -9], [-485, -10], [-510, -9.5]].map(([x, z]) => { const s = c.toy('🐄', 1.8, x, .9, z); c.tap(s, () => { Sound.tone(140, .5, 'sawtooth', .03, .6); c.say('🐄 Moooo!'); c.disc('cows'); }); return { s, x }; });
      for (let x = -410; x > -534; x -= 3) c.block(x, 0, -7, .14, 1, .14, '#ffffff', { r: .03 }); c.block(-472, .7, -7, 124, .12, .08, '#ffffff', { r: .02 }); c.block(-472, .35, -7, 124, .12, .08, '#ffffff', { r: .02 });
      return (dt, t) => { for (const q of cows) q.s.position.x = q.x + Math.sin(t * .15 + q.x) * 1.5; }; },
  ];

  // =================== 🌊 OCEAN PIER (x -668 to -536) — build 38 ===================
  // Picture + sound + voice only: counting (fish, coins), colours (fish), sea-creature names (tide pool), high and low
  // notes (musical buoys), cause and effect (whistle → dolphin, dig → treasure, tap → whale spout).
  const FISH = [['🐟', 'a blue fish'], ['🐠', 'a yellow fish'], ['🐡', 'a puffer fish'], ['🐟', 'another blue fish'], ['🐠', 'a stripy fish']];
  builders.pier = c => [
    ...familyParts(c, 'pier'),
    // (stage 15) deck planking, pilings with rope, cleats, bait shack and lamps
    () => { G.pierDetail = buildPierDetail({ add: c.add }); },
    // the sea behind the pier (one shared-material plane), a foam line and the wooden pier going out over the water
    () => { const pierSea = makeSea(134, 40, 56, 14), sea = pierSea.mesh; sea.position.set(-602, .02, -26); c.add(sea); /* (build 61: soft grassy headlands hide the sea's straight ends) */ for (const hx of [-671, -533]) { const hd = c.sph(hx, -1.2, -28, 1, '#7fcf7a', { m: { r: .95, cc: 0 } }); hd.scale.set(9, 2.6, 22); hd.castShadow = false; }
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(134, .8, 1, 1), mat('#ffffff', { r: .6, cc: 0 })); foam.rotation.x = -Math.PI / 2; foam.position.set(-602, .03, -6.2); c.add(foam);
      c.block(-560, .5, -11, 3, .25, 12, '#b07a4a', { r: .04 }); for (const z of [-6, -10, -14, -17]) for (const dx of [-1.3, 1.3]) c.cyl(-560 + dx, 0, z, .14, .14, .8, '#7a5236');
      return (dt, t) => { foam.position.z = -6.2 + Math.sin(t * .8) * .3; pierSea.update(t); }; },
    // (build 144, the family's request: really fish) FISHING: tap the rod on its stand and she takes it (it is in her hand).
    //  Tap the water where you want to cast: the bobber flies out on its line and lands there. Wait... when the bobber dips
    //  and splashes (and the voice says "A bite!"), tap quickly to reel it in: the catch flies into the bucket. Too slow, and
    //  the fish swims away: cast again. Tap the stand to put the rod back (or just walk away).
    () => { const RX = -552, WZ0 = -6.5; c.cyl(RX, 0, -3.2, .06, .06, 1.6, '#7a5236');
      const rodGeo = () => { const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.CylinderGeometry(.025, .04, 2.4, 8), mat('#3b2b30')); r.position.set(.55, 1.05, 0); r.rotation.z = -.5; g.add(r); const reel = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .08, 12), mat('#ffd23f', { m: { m: .5 } })); reel.rotation.x = Math.PI / 2; reel.position.set(.08, .1, .06); g.add(reel); return g; };
      const rackRod = rodGeo(); rackRod.position.set(RX - .2, .6, -3.25); rackRod.rotation.y = -Math.PI / 2; c.add(rackRod);
      const hand = rodGeo(); hand.scale.setScalar(.8); hand.position.set(-.3, -.5, 0); const handG = new THREE.Group(); handG.add(hand); const TIP = new THREE.Vector3(1.15, 2.1, 0); // (the rod tip, in the rod's own space)
      const bob = c.sph(RX, .15, WZ0, .14, '#ff4f6a', { m: { r: .4 } }); bob.visible = false;
      const line = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1, 4), new THREE.MeshBasicMaterial({ color: '#f4f4f4' })); line.visible = false; c.add(line);
      const water = new THREE.Mesh(new THREE.PlaneGeometry(26, 10), new THREE.MeshBasicMaterial({ visible: false })); water.rotation.x = -Math.PI / 2; water.position.set(RX, .08, -11.5); c.add(water);
      const bucket = c.cyl(-550, 0, -2.2, .4, .32, .55, '#4fa8ff', { r: .5 });
      let st = 'idle', t0 = 0, wait = 0, n = 0, fishCount = 0, catchCycle = 0; const caught = [], from = new THREE.Vector3(), to = new THREE.Vector3(), tip = new THREE.Vector3(), dir = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
      const tipWorld = () => { hand.updateWorldMatrix(true, false); return tip.copy(TIP).applyMatrix4(hand.matrixWorld); };
      const take = () => { if (st !== 'idle') { put(); return; } if (P.layer !== '' || Math.abs(P.x - RX) > 4) return; st = 'hold'; rackRod.visible = false; G.hold(handG); Sound.click(); c.say('🎣 You have the fishing rod! Tap the water to cast it out!'); c.disc('fishing', '🎣 Take the fishing rod, cast it into the water and catch a fish!'); };
      const put = () => { st = 'idle'; rackRod.visible = true; if (G.holding === handG) G.hold(null); bob.visible = line.visible = false; };
      const cast = h => { if (st !== 'hold') return; to.set(h ? Math.max(RX - 11, Math.min(RX + 11, h.point.x)) : P.x + 1.5, .1, h ? Math.min(WZ0, h.point.z) : -9); from.copy(tipWorld()); st = 'fly'; t0 = 0; bob.visible = line.visible = true; Sound.whoosh ? Sound.whoosh() : Sound.click(); };
      const reel = () => { if (st !== 'bite') return; st = 'reel'; t0 = 0; from.copy(bob.position); Sound.tone(660, .1, 'square', .03, 1.2); };
      c.tap(rackRod, take, RX, { icon: '🎣', label: 'Fishing rod', action: 'Take the rod', disc: 'fishing' }); c.tap(water, h => { if (st === 'hold') cast(h); else if (st === 'bite') reel(); else if (st === 'idle') c.say('🎣 Take the fishing rod from its stand first!'); }); c.tap(bob, reel);
      c.tap(bucket, () => { c.say(fishCount ? `🪣 ${NUM[Math.min(6, fishCount)]} fish in the bucket!` : '🪣 The bucket is empty. Catch a fish!'); });
      const land = () => { const kind = api.catch?.() ?? ['fish', 'boot', 'shell', 'bottle'][catchCycle++ % 4]; const fishIndex = n % FISH.length; const [e, name] = kind === 'fish' ? FISH[fishIndex] : ({ boot: ['🥾', 'an old boot'], shell: ['🐚', 'a shiny shell'], bottle: ['📜', 'a message bottle with a treasure clue'] }[kind] || FISH[fishIndex]);
        if (kind === 'fish') { fishCount++; api.event?.({ type: 'activity', id: 'fish_caught' }); api.event?.({ type: 'sea', id: ['bluefish', 'yellowfish', 'puffer', 'bluefish', 'yellowfish'][fishIndex] }); } n++;
        const f = c.toy(e, .7, bob.position.x, .6, bob.position.z); caught.push({ f, t: 0, x: bob.position.x, z: bob.position.z }); if (caught.length > 5) c.remove(caught.shift().f); Sound.pop ? Sound.pop() : Sound.click(); c.say(`${e} ${NUM[Math.min(6, n)]}! You caught ${name}!`); c.burst(bob.position.x, .4, bob.position.z, ['#9fdcff', '#fff'], 14, 2.2);
        if (n === 5) setTimeout(() => { for (const q of caught) c.remove(q.f); caught.length = 0; n = 0; fishCount = 0; c.say('🌊 The fish swim home. Your other finds go in the beach basket!'); }, 2500); };
      return (dt, t) => {
        if (st !== 'idle' && (P.layer !== '' || Math.abs(P.x - RX) > 9 || G.holding !== handG)) put(); // (she walked away: the rod goes back on its stand)
        if (st !== 'idle') { const tw = tipWorld();
          if (st === 'hold') { bob.position.copy(tw).y -= .5; bob.visible = line.visible = true; }
          else if (st === 'fly') { t0 += dt; const k = Math.min(1, t0 / .7); bob.position.lerpVectors(from, to, k); bob.position.y += Math.sin(k * Math.PI) * 2.2; if (k >= 1) { st = 'wait'; wait = 1.6 + Math.random() * 2; c.burst(to.x, .15, to.z, ['#9fdcff', '#ffffff'], 6, 1); Sound.tone(300, .1, 'sine', .04, .8); c.say('🎣 Plop! Now wait... watch the bobber!'); } }
          else if (st === 'wait') { bob.position.y = .12 + Math.sin(t * 2.5) * .04; wait -= dt; if (wait <= 0) { st = 'bite'; t0 = 0; Sound.tone(880, .12, 'square', .04, 1.4); c.say('🐟 A bite! Quick, tap to reel it in!'); } }
          else if (st === 'bite') { t0 += dt; bob.position.y = -.08 + Math.sin(t * 22) * .07; if (Math.random() < dt * 12) c.burst(bob.position.x, .1, bob.position.z, ['#9fdcff', '#ffffff'], 2, 1.2); if (t0 > 3) { st = 'hold'; c.say('🐟 Oh! It swam away. Cast again!'); } }
          else if (st === 'reel') { t0 += dt; const k = Math.min(1, t0 / .6); bob.position.lerpVectors(from, tw, k); if (k >= 1) { st = 'hold'; land(); } }
          line.position.addVectors(tw, bob.position).multiplyScalar(.5); line.scale.y = tw.distanceTo(bob.position); line.quaternion.setFromUnitVectors(UP, dir.copy(bob.position).sub(tw).normalize()); }
        for (const q of caught) { q.t += dt; const k = Math.min(1, q.t / .8); q.f.position.set(q.x + (-550 - q.x) * k, .6 + Math.sin(k * Math.PI) * 1.8 + .2 * k, q.z + (-2.2 - q.z) * k); } }; },
    // the tide pool: tap the rocks and a sea creature appears (and is named)
    () => { for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const r = c.sph(-566 + Math.cos(a) * 1.3, .1, -3 + Math.sin(a) * .8, .38, '#8a7f74', { m: { r: .9 } }); r.scale.y = .55; } const pool = c.cyl(-566, 0, -3, 1.05, 1.05, .08, '#5fc0f0', { r: .1, cc: .7 }); pool.scale.z = .62;
      const who = c.toy('⭐', .8, -566, .45, -3); who.visible = false; const SEA = [['⭐', 'a starfish'], ['🐌', 'a sea snail'], ['🦀', 'a little crab'], ['🐙', 'an octopus'], ['🦐', 'a shrimp'], ['🪼', 'a jellyfish']]; let k = -1, show = 0;
      const peek = () => { k = (k + 1) % SEA.length; setToySymbol(who, SEA[k][0]); who.visible = true; show = 3; api.event?.({ type: 'activity', id: 'tide_found' }); api.event?.({ type: 'sea', id: ['starfish', 'snail', 'crab', 'octopus', 'shrimp', 'jellyfish'][k] }); Sound.twinkle(); c.say(`${SEA[k][0]} Look! It's ${SEA[k][1]}!`); c.disc('tidepool', '🌊 Tap the tide pool to find sea creatures!'); };
      c.tap(pool, peek, -566, { icon: '🐙', label: 'Tide pool', action: 'Look in pool', disc: 'tidepool' }); c.tap(who, peek);
      return (dt, t) => { if (show > 0) { show -= dt; who.position.y = .45 + Math.min(1, (3 - show) * 3) * .4 + Math.sin(t * 4) * .05; if (show <= 0) who.visible = false; } }; },
    // musical buoys: five floating buoys play low to high notes
    () => { const buoys = RB.slice(0, 5).map((col, i) => { const x = -574 - i * 2.2; const b = c.sph(x, .35, -7.5, .45, col, { m: { r: .4, cc: .6 } }); b.scale.y = .8; const tp = c.cyl(x, .6, -7.5, .06, .06, .5, '#ffffff'); c.tap(b, () => { Sound.withMusic(() => Sound.tone(NOTE[i * 1 + 1], .35, 'sine', .07, 1)); b.userData.hop = .5; c.burst(x, .9, -7.5, [col, '#fff'], 6, 1.5); c.say(['🎵 Low!', '🎵', '🎵', '🎵', '🎵 High!'][i]); c.disc('buoys', '🎵 Tap the buoys to play music, from low to high!'); }, i === 2 ? -578.4 : undefined); return { b, tp, i }; });
      return (dt, t) => { for (const q of buoys) { q.b.userData.hop = Math.max(0, (q.b.userData.hop || 0) - dt); const y = .35 + Math.sin(t * 1.6 + q.i) * .08 + q.b.userData.hop * .6; q.b.position.y = y; q.tp.position.y = y + .25; } }; },
    // Splash the seal waits on a rock by the water
    () => { const rock = c.sph(-584, 0, -2.4, 1, '#8a7f74', { m: { r: .9 } }); rock.scale.set(1.7, .55, 1.15); const pal = palAtHome(c, 'seal'); /* (build 144, the family's report: the seal hovered above its rock) it lies ON the rock: its height follows the rock's rounded top wherever it wiggles */
      const top = x => .55 * Math.sqrt(Math.max(0, 1 - ((x + 584) / 1.7) ** 2)); return (dt, t) => { if (!pal) return; pal(dt, t); const m = pal.mesh; if (m.parent) m.position.y = top(m.position.x) - .06; }; },
    // stacked crates (a gem waits on top) next to the dolphin show
    () => { c.add(crates([[-594.5, 0, 2], [-596.5, 1, 2], [-598, 2, 1.6]].map(([x, y, w]) => [x, y, -2.0, w, 1, 1.4]))); /* (build 124: the steps stand just behind her path, so she walks in front of them, never through them; she steps back onto them as she climbs) */ /* (build 54: planked crates, one mesh) */ c.plat(-595.5, -593.5, 1, { z: -1.9, step: true, stepMax: 1.05 }); c.plat(-597.5, -595.5, 2, { z: -1.9, step: true, stepMax: 1.05 }); c.plat(-598.8, -597.2, 2.98, { z: -1.9, onLand: () => c.disc('crates', '📦 You climbed the crates!') }); },
    // the dolphin show: tap the whistle and a dolphin leaps through the hoop
    () => { c.cyl(-606, 0, -3, .06, .06, 1.4, '#ffffff'); const wh = c.toy('📯', .8, -606, 1.7, -3); const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.2, .1, 10, 32), mat('#ff4f9a', { r: .4 })); hoop.position.set(-606, 2.6, -10); c.add(hoop);
      const dol = c.toy('🐬', 1.6, -611, -1, -10); dol.visible = false; let jump = 0, jumps = 0;
      const go = () => { api.event?.({ type: 'sea', id: 'dolphin' }); if (jump) return; jump = .001; jumps++; Sound.tone(1400, .15, 'sine', .04, 1.3); Sound.tone(1700, .12, 'sine', .04, 1.2, .15); c.say(jumps % 3 === 0 ? `🐬 ${NUM[Math.min(6, jumps)]} jumps! What a clever dolphin!` : '🐬 Wheee! The dolphin jumps through the hoop!'); c.disc('dolphin', '🐬 Tap the whistle and the dolphin jumps!'); };
      c.tap(wh, go, -606); c.tap(hoop, go);
      return dt => { if (!jump) return; jump += dt; const k = Math.min(1, jump / 1.8); dol.visible = true; dol.position.set(-611 + 10 * k, -1 + Math.sin(k * Math.PI) * 4.6, -10); dol.rotation.z = .9 - k * 1.8; if (k >= 1) { c.burst(-601, .2, -10, ['#9fdcff', '#fff'], 14, 2.6); jump = 0; dol.visible = false; } }; },
    // treasure dig: tap the ✖ in the sand three times; a chest pops up full of coins (count them)
    () => { const x0 = -620; const mark = c.sign('❌', .7, x0, .05, -2.4); const mound = c.sph(x0, 0, -2.4, .6, '#e9cf98', { m: { r: .95, cc: 0 } }); mound.scale.y = .25; const chest = new THREE.Group(); chest.position.set(x0, -1, -2.4); c.add(chest);
      const box = new THREE.Mesh(W.rbox(1, .6, .7, .08), mat('#8a5a2a', { r: .6 })); box.position.y = .3; chest.add(box); const lid = new THREE.Mesh(W.rbox(1.04, .2, .74, .08), mat('#ffd23f', { r: .3, m: .5 })); lid.position.y = .7; chest.add(lid); let digs = 0, up = 0;
      const dig = () => { if (up) return; digs++; Sound.tone(220 + digs * 40, .1, 'triangle', .05, .8); c.burst(x0, .4, -2.4, ['#e9cf98', '#d9b878'], 8, 2); mound.scale.y = .25 + digs * .12; c.say(['', '⛏️ Dig!', '⛏️ Dig dig!', '💰 Treasure!'][digs]); c.disc('treasure', '❌ X marks the spot! Tap it to dig for treasure.');
        if (digs >= 3) { api.event?.({ type: 'activity', id: 'treasure_dug' }); up = .001; digs = 0; let k = 0; const coin = () => { k++; c.burst(x0, 1.2, -2.4, ['#ffd23f', '#fff3a6'], 6, 2); Sound.tone(900 + k * 80, .08, 'square', .025, 1.2); c.say(`🪙 ${NUM[k]}!`); if (k < 5) setTimeout(coin, 500); else setTimeout(() => c.say('🪙 Five gold coins! Hooray!'), 500); }; setTimeout(coin, 900); } };
      c.tap(mark, dig, x0, { icon: '❌', label: 'Treasure spot', action: 'Dig', disc: 'treasure' }); c.tap(mound, dig); c.tap(box, dig); c.tap(lid, dig);
      return dt => { if (!up) { chest.position.y += (-1 - chest.position.y) * Math.min(1, dt * 4); return; } up += dt; chest.position.y += (0 - chest.position.y) * Math.min(1, dt * 4); lid.rotation.x = -Math.min(1.1, up * 1.5); lid.position.z = -Math.min(.3, up * .4); if (up > 7) { up = 0; lid.rotation.x = 0; lid.position.z = 0; mound.scale.y = .25; } }; },
    // the sailboat: tap it, toot toot, and it sails a loop on the sea
    () => { const boat = new THREE.Group(); boat.position.set(-636, 0, -12); c.add(boat); const hull = new THREE.Mesh(boatHull(3.4, .85, 1.15), mat('#4fa8ff')); hull.position.y = -.05; { const rim = new THREE.Mesh(W.rbox(3, .1, 1.42, .05), mat('#ffffff')); rim.position.y = .84; boat.add(rim); } hull.castShadow = true; boat.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.8, 8), mat('#7a5236')); mast.position.y = 1.8; boat.add(mast);
      const sail = new THREE.Mesh(new THREE.ConeGeometry(1, 2.2, 3), mat('#ffffff')); sail.position.set(.4, 1.9, 0); sail.scale.z = .1; boat.add(sail); const flag = new THREE.Mesh(W.rbox(.5, .3, .04, .02), mat('#ff4f9a')); flag.position.set(.25, 3.2, 0); boat.add(flag); let trip = 0;
      const go = () => { if (trip) return; trip = .001; Sound.tone(300, .3, 'square', .03, 1); Sound.tone(300, .3, 'square', .03, 1, .4); c.say('⛵ Toot toot! Off we sail!'); c.disc('sailboat', '⛵ Tap the sailboat and it sails around!'); };
      c.tap(boat, go, -636);
      return (dt, t) => { boat.rotation.z = Math.sin(t * 1.3) * .05; flag.rotation.y = Math.sin(t * 6) * .3; if (!trip) return; trip += dt; const a = Math.min(1, trip / 10) * Math.PI * 2; boat.position.set(-636 + Math.sin(a) * 9, Math.sin(t * 1.1) * .08, -12 - (1 - Math.cos(a)) * 5); boat.rotation.y = -a; if (trip > 10) { trip = 0; boat.position.set(-636, 0, -12); boat.rotation.y = 0; } }; },
    // the friendly whale: tap its back and a big water spout shoots up
    () => { /* (build 64: a real friendly whale: blue, with a pale belly line, eyes and a tail fluke out of the water; it was a flat grey blob) */
      const back = new THREE.Group(); back.position.set(-650, -.35, -16); c.add(back); let spout = 0;
      { const b = makeBatch(); b.put(new THREE.SphereGeometry(2.4, 28, 18), 0, 0, 0, '#5b9be6', [1.7, .72, .85]); b.put(new THREE.SphereGeometry(2.4, 24, 12), .3, -.55, .1, '#cfe7ff', [1.55, .4, .8]);
        for (const z of [-.95, .95]) { b.put(new THREE.SphereGeometry(.2, 14, 10), 3, .45, z, '#ffffff'); b.put(new THREE.SphereGeometry(.11, 12, 8), 3.12, .47, z * 1.08, '#1d1d2b'); }
        back.add(b.mesh(shinyMat()));
        const tail = new THREE.Group(); tail.position.set(-3.9, .4, 0); tail.rotation.z = .5; back.add(tail); const tb = makeBatch();
        for (const z of [-.55, .55]) tb.put(new THREE.SphereGeometry(.7, 16, 10), 0, .3, z, '#5b9be6', [.45, .18, 1], [z * .6, 0, 0]);
        tb.put(new THREE.CylinderGeometry(.22, .35, 1, 12), 0, -.2, 0, '#5b9be6'); tail.add(tb.mesh(shinyMat())); back.userData.tail = tail; } /* (two meshes: body, and the tail that waves) */
      c.tap(back, () => { spout = 1.4; api.event?.({ type: 'sea', id: 'whale' }); Sound.noise ? Sound.noise(.6, 300, 1400, .05) : Sound.whoosh(); c.say('🐳 Whoosh! The whale says hello!'); c.disc('whale', '🐳 Tap the whale and it spouts water!'); }, -650);
      return (dt, t) => { back.position.y = -.35 + Math.sin(t * .7) * .12; back.userData.tail.rotation.x = Math.sin(t * 1.1) * .15; if (spout > 0) { spout -= dt; if (Math.random() < dt * 30) c.burst(-650.6, 1 + Math.random() * 3, -16, ['#cfefff', '#ffffff'], 2, 1.2); } }; },
  ];

  // =================== 🎈 BALLOON HILLS (x -800 to -668) — build 49 ===================
  // Picture + sound + voice only: up and down (the balloon), loop the loop (kites), counting hops (goats), loud and soft
  // (the echo), long tubes play low notes and short tubes high notes (wind chimes), blow and watch (dandelions), and a
  // grassy hill to climb and slide down.
  builders.hills = c => [
    ...familyParts(c, 'hills'),
    // (stage 16) moored balloons, bunting, wildflower drifts and terrace shelves
    () => { G.hillsDetail = buildHillsDetail({ add: c.add }); },
    () => lifeHere(c, [['drawinglonglegs', -789, -3.5]]),
    // rolling green hills behind (a few big shared-material bumps) and a soft lawn colour
    () => { for (const [x, z, r, sy, col] of [[-690, -22, 16, .45, '#8fd88a'], [-722, -26, 20, .55, '#7fcf7a'], [-756, -21, 15, .5, '#9be096'], [-788, -25, 18, .5, '#86d482']]) { const h = c.sph(x, -3, z, r, col, { m: { r: .95, cc: 0 } }); h.scale.y = sy; h.castShadow = false; } },
    // the hot-air balloon: tap the burner, the balloon puffs up into the sky and floats back down
    () => { const X = -684, bal = new THREE.Group(); bal.position.set(X, 0, -4.2); c.add(bal);
      const basket = new THREE.Mesh(W.rbox(1.4, 1, 1.4, .12), mat('#b5793c', { r: .8 })); basket.position.y = .5; basket.castShadow = true; bal.add(basket);
      const env = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 16), mat('#ff5a8a', { r: .35, cc: .6 })); env.position.y = 4.4; env.scale.y = 1.15; env.castShadow = true; bal.add(env);
      RB.slice(1, 5).forEach((col, i) => { const band = new THREE.Mesh(new THREE.TorusGeometry(1.9 * Math.cos((i - 1.5) * .32), .14, 8, 32), mat(col)); band.rotation.x = Math.PI / 2; band.position.y = 4.4 + (i - 1.5) * .7; bal.add(band); });
      for (const [dx, dz] of [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]]) { const rope = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.4, 6), mat('#7a5236')); rope.position.set(dx * 1.1, 2.1, dz * 1.1); rope.rotation.z = -dx * .35; rope.rotation.x = dz * .35; bal.add(rope); }
      let up = 0, flights = 0;
      const go = () => { if (up) return; up = .001; flights++; Sound.whoosh(); Sound.tone(160, .8, 'sawtooth', .03, 1.4); c.burst(X, 2.2, -4.2, ['#ffd23f', '#ff9a2e', '#ffffff'], 16, 2); c.say(flights % 2 ? '🎈 Whoosh! Up, up, up goes the balloon!' : '🎈 Up high! Now gently down again.'); c.disc('balloon', '🎈 Tap the hot-air balloon and it floats up into the sky!'); api.event?.({ type: 'activity', id: 'balloon_up' }); };
      c.tap(bal, go, X, { icon: '🎈', label: 'Hot-air balloon', action: 'Fly it up', disc: 'balloon' });
      return (dt, t) => { const bob = Math.sin(t * 1.2) * .08; if (!up) { bal.position.y = bob; return; } up += dt; const k = Math.min(1, up / 9), h = Math.sin(k * Math.PI) * 5.5; /* (stays on screen) */ bal.position.y = h + bob; bal.rotation.y = Math.sin(up * .6) * .4; { const near = Math.abs(P.x - X) < 10 && !P.ride && P.layer === ''; if (near) { G.camLift = h * .22; G.camPull = 1; G.balloonCam = true; } else if (G.balloonCam) { G.camLift = 0; G.camPull = 0; G.balloonCam = false; } } /* (the camera looks up with the balloon while you watch) */ if (up < 2.5 && Math.random() < dt * 12) c.burst(X, bal.position.y + 2.4, -4.2, ['#ffd23f', '#ff9a2e'], 2, 1.2); if (k >= 1) { up = 0; bal.rotation.y = 0; if (G.balloonCam) { G.camLift = 0; G.camPull = 0; G.balloonCam = false; } } }; },
    // kites on long strings: tap one and it loops the loop
    () => { const X = -696; c.cyl(X, 0, -2.6, .08, .1, 1.2, '#7a5236'); const kites = [['#ff4f9a', -1.4, 4.4], ['#2fa8ff', 1.4, 5.4]] /* (low enough to stay on screen) */.map(([col, dx, h], i) => { const k = new THREE.Group(); c.add(k); const sail = new THREE.Mesh(new THREE.ConeGeometry(.8, 1.6, 4), mat(col)); sail.scale.z = .12; k.add(sail); const cross = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.4, 6), mat('#ffffff')); cross.rotation.z = Math.PI / 2; k.add(cross);
        for (let j = 0; j < 4; j++) { const bow = c.sph(0, 0, 0, .1, RB[(j + i * 2) % 8]); g2(bow, k, 0, -1 - j * .35); }
        const str = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 4), mat('#ffffff')); c.add(str); return { k, str, dx, h, loop: 0, i }; });
      function g2(m, parent, x, y) { m.parent && m.parent.remove(m); parent.add(m); m.position.set(x, y, 0); }
      const loop = q => { if (q.loop) return; q.loop = .001; Sound.whoosh(); c.say(q.i ? '🪁 The blue kite loops the loop!' : '🪁 Whee! The pink kite does a loop!'); c.disc('kites', '🪁 Tap a kite and it loops the loop!'); api.event?.({ type: 'activity', id: 'kite_loop' }); };
      kites.forEach(q => c.tap(q.k, () => loop(q))); // (the post below gets the PAW: it loops whichever kite is resting)
      const post = c.cyl(X, 1.2, -2.6, .16, .16, .2, '#ffd23f'); c.tap(post, () => loop(kites.find(q => !q.loop) || kites[0]), X, { icon: '🪁', label: 'Kites', action: 'Loop a kite', disc: 'kites' });
      const A = new THREE.Vector3(), B = new THREE.Vector3();
      return (dt, t) => { for (const q of kites) { let x = X + q.dx + Math.sin(t * .8 + q.i * 2) * .8, y = q.h + Math.sin(t * 1.3 + q.i) * .4, rz = Math.sin(t * 1.1 + q.i) * .25; if (q.loop) { q.loop += dt; const a = Math.min(1, q.loop / 1.6) * Math.PI * 2; x += Math.sin(a) * 1.6; y += (1 - Math.cos(a)) * 1.6; rz = -a; if (q.loop > 1.6) q.loop = 0; }
          q.k.position.set(x, y, -6); q.k.rotation.z = rz; A.set(X, 1.3, -2.6); B.set(x, y - .6, -6); q.str.position.copy(A).add(B).multiplyScalar(.5); q.str.scale.y = A.distanceTo(B); q.str.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize()); } }; },
    // the grassy hill: climb the steps, tap the rainbow mat at the top and slide down the other side
    () => { const hill = c.sph(-713, -3.2, -5.2, 8.5, '#86d482', { m: { r: .95, cc: 0 } }); hill.scale.set(1, .95, .55);
      for (const [a, b, y] of [[-704.5, -706.5, 1.2], [-707, -709, 2.4], [-709.5, -711.5, 3.6], [-712, -716, 4.8]]) { c.block((a + b) / 2, 0, -2.0, Math.abs(b - a), y, 1.6, '#c98b5a', { r: .3 }); c.plat(Math.min(a, b), Math.max(a, b), y, { z: -1.9 }); } /* (build 124: the steps stand just behind her path, so she walks in front of them, never through them; she steps back onto them as she climbs) */ /* (build 62: wooden steps up the hill; green boxes in front of the green hill looked like broken scenery) */
      const matG = new THREE.Group(); matG.position.set(-715, 4.8, -1.9); c.add(matG); RB.slice(0, 6).forEach((col, i) => { const st = new THREE.Mesh(W.rbox(1.4, .1, .16, .04), mat(col)); st.position.set(0, .06, -.4 + i * .16); matG.add(st); });
      const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-716, 5.4, -1.9), new THREE.Vector3(-719, 4.6, -1.4), new THREE.Vector3(-723, 2.6, -.6), new THREE.Vector3(-727, 1, -.2), new THREE.Vector3(-731, .6, 0)]);
      chute(c, mat, path, '#ff8fc8', '#ffffff'); /* (build 125) the slide down the hill */
      c.tap(matG, () => { if (P.y < 4.3) { c.say('🌈 Climb up the grassy steps to the rainbow mat!'); return; } api.startSlide(path); c.disc('hillslide', '🌈 Wheee! Sliding down the grassy hill!'); c.say('🌈 Wheee!'); api.event?.({ type: 'activity', id: 'hill_slide' }); }, -715, { y: 4.8, hintY: 1.4 }); },
    // mountain goats: tap the goat and it hops up the rocks, counting each hop
    () => { const X = -738, ROCKS = [[-736, .6], [-738.4, 1.4], [-740.8, 2.3], [-743, 3.3]]; c.add(boulders(ROCKS.map(([x, h]) => [x, 0, -3.4, 2, h, 1.6]))); /* (build 54: lumpy mossy boulders, one mesh) */
      const goat = c.toy('🐐', 1.1, ROCKS[0][0], ROCKS[0][1] + .55, -3.4); let at = 0, hop = 0, from = 0;
      const go = () => { if (hop) return; from = at; at = at >= ROCKS.length - 1 ? 0 : at + 1; hop = .001; Sound.boing(); c.say(at === 0 ? '🐐 Down we go! Again?' : `🐐 Hop! ${NUM[at][0].toUpperCase() + NUM[at].slice(1)}!`); if (at === ROCKS.length - 1) setTimeout(() => c.say('🐐 Three hops to the top! Clever goat!'), 700); c.disc('goats', '🐐 Tap the goat and count its hops up the rocks!'); api.event?.({ type: 'activity', id: 'goat_hop' }); };
      c.tap(goat, go, X, { icon: '🐐', label: 'Mountain goat', action: 'Make it hop', disc: 'goats' });
      return (dt, t) => { if (!hop) { goat.position.y = ROCKS[at][1] + .55 + Math.abs(Math.sin(t * 2)) * .05; return; } hop += dt; const k = Math.min(1, hop / .55), [x0, y0] = ROCKS[from], [x1, y1] = ROCKS[at]; goat.position.x = x0 + (x1 - x0) * k; goat.position.y = y0 + (y1 - y0) * k + .55 + Math.sin(k * Math.PI) * 1.2; goat.rotation.y = x1 < x0 ? -.6 : .6; if (k >= 1) hop = 0; }; },
    // the echo rocks: tap the big rock and hear your hello come back, softer and softer
    () => { const X = -752, rock = c.sph(X, 0, -4, 2.6, '#9a9087', { m: { r: .9 } }); rock.scale.set(1.3, 1, .8); const cave = c.sph(X, .2, -2.05, 1, '#3b3340', { m: { r: 1 } }); cave.scale.set(1, 1, .25);
      let t0 = 0;
      const go = () => { if (t0) return; t0 = .001; c.say('🪨 Hello! ...hello ...hello'); [0, .55, 1.1, 1.65].forEach((d, i) => Sound.tone(523 - i * 2, .32, 'sine', .07 * Math.pow(.5, i), 1.25, d)); c.disc('echo', '🪨 Tap the big rock and listen to the echo!'); api.event?.({ type: 'activity', id: 'echo' }); };
      c.tap(rock, go, X, { icon: '🪨', label: 'Echo rock', action: 'Say hello', disc: 'echo' }); c.tap(cave, go);
      return dt => { if (!t0) return; t0 += dt; cave.scale.x = 1 + Math.max(0, Math.sin(t0 * 11)) * .08 * Math.max(0, 1 - t0 / 2); if (t0 > 2.2) { t0 = 0; cave.scale.x = 1; } }; },
    // wind chimes: long tubes sing low, short tubes sing high
    () => { const X = -763; c.cyl(X - 2.2, 0, -3, .08, .08, 3.6, '#7a5236'); c.cyl(X + 2.2, 0, -3, .08, .08, 3.6, '#7a5236'); const bar = c.block(X, 3.5, -3, 4.8, .16, .16, '#7a5236', { r: .05 });
      const PITCH = [NOTE[0], NOTE[2], NOTE[4], NOTE[5], NOTE[7]]; // (longest tube: lowest note)
      const rings = [], tubes = [1.9, 1.6, 1.3, 1, .75].map((len, i) => { const x = X - 1.6 + i * .8, g = new THREE.Group(); g.position.set(x, 3.45, -3); c.add(g); const tube = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, len, 12), mat(RB[i], { r: .25, m: .6 })); tube.position.y = -len / 2 - .15; g.add(tube); const str = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .15, 4), mat('#ffffff')); str.position.y = -.07; g.add(str);
        const ring = (quiet) => { g.userData.sw = 1; Sound.withMusic(() => Sound.bell(PITCH[i], .06)); c.burst(x, 3.4 - len, -2.8, [RB[i], '#ffffff'], 5, 1.2); if (!quiet) c.say(i === 0 ? '🔔 The long one sings low!' : i === 4 ? '🔔 The short one sings high!' : '🔔'); c.disc('chimes', '🔔 Long chimes sing low, short chimes sing high!'); };
        rings.push(ring); c.tap(g, () => ring()); return g; });
      c.tap(bar, () => { rings.forEach((ring, i) => setTimeout(() => ring(true), i * 220)); c.say('🔔 Low to high: ding, ding, ding!'); api.event?.({ type: 'activity', id: 'chimes' }); }, X, { icon: '🔔', label: 'Wind chimes', action: 'Ring them', disc: 'chimes' });
      return (dt, t) => { for (const g of tubes) { g.userData.sw = Math.max(0, (g.userData.sw || 0) - dt * .8); g.rotation.z = Math.sin(t * 6 + g.position.x) * .25 * g.userData.sw + Math.sin(t * 1.3 + g.position.x) * .03; } }; },
    // dandelion puffs: tap one and its seeds blow away on the wind; it grows back
    () => { const X = -777, puffs = [-2.4, -1.2, 0, 1.2, 2.4].map((dx, i) => { const x = X + dx, z = -2.6 - (i % 2) * .7; c.cyl(x, 0, z, .03, .03, .9 + (i % 3) * .15, '#6cbf5a'); const h = .9 + (i % 3) * .15, ball = c.sph(x, h + .25, z, .3, '#ffffff', { m: { r: .9, cc: 0 } }); return { ball, x, z, h, gone: 0 }; });
      const blow = q => { if (q.gone) return; q.gone = 4; Sound.whoosh(); for (let k = 0; k < 4; k++) setTimeout(() => c.burst(q.x + k * .4, q.h + .3 + k * .15, q.z, ['#ffffff', '#f4f4ff'], 6, 1.6), k * 120); c.say('💨 Whoosh! The seeds fly away on the wind!'); c.disc('dandelion', '💨 Tap the fluffy dandelions and the seeds blow away!'); api.event?.({ type: 'activity', id: 'dandelion' }); };
      puffs.forEach(q => c.tap(q.ball, () => blow(q))); c.tap(c.add(new THREE.Group()), () => blow(puffs.find(q => !q.gone) || puffs[0]), X, { icon: '💨', label: 'Dandelions', action: 'Blow the seeds', disc: 'dandelion' }); // (PAW: the next fluffy one)
      return dt => { for (const q of puffs) { if (q.gone > 0) { q.gone = Math.max(0, q.gone - dt); const k = q.gone > 3 ? 0 : Math.min(1, (3 - q.gone) / 3); q.ball.scale.setScalar(Math.max(.05, k)); } } }; },
    () => lifeHere(c, [['unicornfoal', -748, -5.6]]), // (build 117) Sparkle the unicorn foal lives on Balloon Hills
  ];

  // ---------- per frame ----------
  function update(dt, t, camX) {
    stream(camX); updateSkyGate();
    if (camX > EXP.x0 - 30 || camX < -10) updateGems(t); // (build 30: gems on both sides of the world)
    for (const st of S) if (st.state === 'ready' && st.updates) for (const u of st.updates) u(dt, t);
    updateFollowers(dt, t);
    if (G.sea && camX < 0) { if (camX > -190) seaW.update(t); G.sea.position.y = .02 + Math.sin(t * .8) * .04; G.foam.position.z = -8.2 + Math.sin(t * .8) * .35; }
  }
  // (build 31) the pets panel
  const palList = () => Object.keys(PALS).map(k => ({ kind: k, emoji: PAL_EMOJI[k], pic: PET_PICS[k] || null, planet: PALS[k].planet || 'earth', found: !!X.pals[k], follow: !!(X.pals[k] && X.pals[k].follow) }));
  const befriend = k => { const on = Object.keys(followers).length < MAX_FOLLOW; X.pals[k] = { follow: on }; if (on) setFollow(k, true); api.saveSoon(); return on; };
  const isPal = k => !!X.pals[k];
  const togglePal = k => { if (!X.pals[k]) return null; const on = !X.pals[k].follow; if (on && Object.keys(followers).length >= MAX_FOLLOW) return `🐾 ${MAX_FOLLOW} friends are with you already! Send one home first.`; setFollow(k, on); return on ? `${PAL_EMOJI[k]} ${PAL_NAME[k]} is coming with you!` : `${PAL_EMOJI[k]} ${PAL_NAME[k]} will wait ${PAL_WHERE[k]}!`; };
  const palHint = k => PALS[k].planet ? `Somebody is waiting to be your friend ${PAL_WHERE[k]}! Fly there in the rocket and tap them.` : `Somebody is waiting to be your friend ${PAL_WHERE[k]}! Tap them three times.`;
  // (build 30) after the save is loaded: hide the gems already found and bring back the friends who follow you
  function restored() {
    for (let i = gemObjs.length - 1; i >= 0; i--) if (X.gems.includes(gemObjs[i].id)) { scene.remove(gemObjs[i].s); gemObjs.splice(i, 1); }
    for (const k of Object.keys(PALS)) setFollow(k, !!(X.pals[k] && X.pals[k].follow));
    for (const k of Object.keys(PALS)) if (X.pals[k] && !X.pals[k].follow) X.pals[k] = { follow: false };
  }
  const stats = () => S.map(s => `${s.d.id}:${s.state}`).join(' ');
  return { pictureSign, palList, togglePal, palHint, befriend, isPal, _followers: () => Object.keys(followers), _X: () => X, update, buildNow, restored, stats, districts: DISTRICTS, gemsFound: () => X.gems.length, gemsTotal: GEMS.length, _S: S };
}
