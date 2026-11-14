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
import * as THREE from 'three';
import { makeToyModel } from './toy-models.js';

export const EXP = { x0: 424, x1: 902, xMin: -662 }; // (build 30: the world also grows to the LEFT of the Playhouse; build 35: on to the farm)
export const DISTRICTS = [
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
const GEMS = [['g1', 484.5, 4.7], ['g2', 540, .9], ['g3', 600, 6.2], ['g4', 644, 2.8], ['g5', 690, 1], ['g6', 756, 1.1], ['g7', 830, 2.7], ['g8', 898, .9], ['g9', -95, 5.4], ['g10', -118, 1], ['g11', -226, 1.9], ['g12', -263, .9], ['g13', -328, 6], ['g14', -380, .9], ['g15', -466, 4.6], ['g16', -522, .9], ['g17', -598, 3.4], ['g18', -652, .9]];
const NOTE = [262, 294, 330, 349, 392, 440, 494, 523];
const RB = ['#ff4f9a', '#ff9a2e', '#ffc21c', '#36c96b', '#2fa8ff', '#5b6cff', '#a15cff', '#ff7ad9'];
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];

// emoji pictures as sprites (one canvas texture per emoji, shared)
const emojiMats = new Map();
function emojiMat(e, shadow) {
  const k = e + (shadow ? '#s' : ''); if (emojiMats.has(k)) return emojiMats.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (shadow) g.filter = 'brightness(0) opacity(.75)'; g.fillText(e, 64, 72);
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
function physicalToy(symbol, size = 1) {
  const group = setToySymbol(new THREE.Group(), symbol); group.scale.setScalar(size); return group;
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
  for (const [a, b] of [[432, 546], [672, 786]]) for (let x = a + 4; x < b; x += 9 + rnd(6)) api.makeTree(scene, x, -8.5 - rnd(3), .9 + Math.random() * .3);
  for (let x = -268; x < -152; x += 6 + rnd(4)) api.makeTree(scene, x, -7.5 - rnd(4), 1 + Math.random() * .35); // (the woods: a real forest behind the path)
  for (let x = -532; x < -410; x += 13 + rnd(5)) api.makeTree(scene, x, -12 - rnd(3), 1 + Math.random() * .3); // (build 35: a few trees behind the farm fields)
  // the sea behind the beach (one big shared plane; it gently bobs)
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 60, 1, 1), mat('#3fa9e8', { r: .12, cc: .7 })); sea.rotation.x = -Math.PI / 2; sea.position.set(-86, .02, -38); sea.receiveShadow = true; scene.add(sea); G.sea = sea;
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(140, .9, 1, 1), mat('#ffffff', { r: .6, cc: 0 })); foam.rotation.x = -Math.PI / 2; foam.position.set(-86, .03, -8.2); scene.add(foam); G.foam = foam;
  // signposts with each neighbourhood's picture (and an arrow to the next one)
  for (const d of DISTRICTS) {
    const g = new THREE.Group(); g.position.set(d.enter ?? d.x0 + 4, 0, -2.6); scene.add(g);
    const post = new THREE.Mesh(W.rbox(.22, 3.2, .22, .08), mat('#9a6a3a', { r: .8, cc: 0 })); post.position.y = 1.6; post.castShadow = true; g.add(post);
    const board = new THREE.Mesh(W.rbox(1.9, 1.5, .18, .2), mat('#ffffff', { r: .5, cc: .2 })); board.position.y = 3.1; board.castShadow = true; g.add(board);
    const pic = pictureSign(d.icon, 1.25); pic.position.set(0, 3.1, .2); g.add(pic);
    const ar = pictureSign(d.arrow || '➡️', .6); ar.position.set(0, 2.05, .2); g.add(ar);
  }
  // the rainbow gate at 422 is now a gateway: a sign with the new places
  { const s = pictureSign('🌉', 1.1); s.position.set(426, 3.4, -1.5); scene.add(s); }

  function removeOwned(object) {
    object.removeFromParent();
    object.traverse(o => {
      if (o.isSprite) return;
      if (o.geometry && !W.isShared(o.geometry) && !toyGeometries.has(o.geometry)) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) if (m && !W.isSharedMat(m) && !toyMaterials.has(m)) { if (m.map) m.map.dispose(); m.dispose(); }
    });
  }

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
  function makePalMesh(kind) {
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
  for (const k of Object.keys(PALS)) if (X.pals[k] && X.pals[k].follow) setFollow(k, true);
  function updateFollowers(dt, t) {
    let slot = 0; for (const k of Object.keys(followers)) { const f = followers[k], m = f.m; slot++;
      const tx = P.layer === '' ? P.x - (P.facing || 1) * (1.6 + slot * 1.3) : m.position.x, ty = P.layer === '' ? Math.max(0, P.y - .1) : m.position.y;
      if (Math.abs(tx - m.position.x) > 25) m.position.x = tx; // (after a jump somewhere else, it arrives with you)
      const dx = tx - m.position.x; m.position.x += dx * Math.min(1, dt * 3); m.position.y += (ty - m.position.y) * Math.min(1, dt * 6); m.position.z += (1.5 + slot * .45 - m.position.z) * Math.min(1, dt * 3);
      const moving = Math.abs(dx) > .3; m.userData.body.position.y = moving ? Math.abs(Math.sin(t * 12 + slot)) * .12 : 0;
      if (k === 'crab') m.rotation.y = 0; else m.rotation.y = dx >= 0 ? 0 : Math.PI; if (k === 'penguin') { m.userData.body.rotation.z = moving ? Math.sin(t * 10) * .12 : 0; } if (k === 'parrot') { m.userData.body.position.y = .7 + Math.sin(t * 5) * .15; if (m.userData.wing1) { m.userData.wing1.rotation.x = Math.sin(t * 18) * .6; m.userData['wing-1'].rotation.x = -Math.sin(t * 18) * .6; } } if (m.userData.curl) m.userData.curl.rotation.y = t * 6; if (k === 'robot' && m.userData.bulb) m.userData.bulb.material.emissiveIntensity = .5 + Math.abs(Math.sin(t * 4)) * .8;
      if (f.play > 0) { f.play -= dt; m.userData.body.position.y = Math.abs(Math.sin(t * 11)) * .3; m.rotation.y = f.face; } // (build 41: playing with a friend)
      if (m.userData.tail) m.userData.tail.rotation.y = Math.sin(t * 6) * .4; m.visible = P.layer === '' || P.layer === 'in'; }
    // (build 41) PALS PLAY TOGETHER: when two or more friends follow you and you stand still for a moment, now and then two
    // friends next to each other turn to face each other and hop about, with a little burst of hearts and a giggle.
    const ks = Object.keys(followers); still = P.layer === '' && Math.abs(P.vx) < .3 && !P.ride ? still + dt : 0;
    if (ks.length >= 2 && still > 2.5 && (playAt -= dt) <= 0) { playAt = 9 + Math.random() * 6; const i = rnd(ks.length - 1), a = followers[ks[i]], b = followers[ks[i + 1]];
      const right = a.m.position.x < b.m.position.x; a.face = right ? 0 : Math.PI; b.face = right ? Math.PI : 0; a.play = b.play = 1.6;
      api.burst((a.m.position.x + b.m.position.x) / 2, 1.1, (a.m.position.z + b.m.position.z) / 2, ['#ff8fc8', '#ffd1ec', '#fff'], 10, 1.6); Sound.giggle(); disc('palsplay', `💕 ${PAL_EMOJI[ks[i]]} and ${PAL_EMOJI[ks[i + 1]]} are playing together!`); }
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
    // a stream across the path, with a wooden bridge (walk across, or splash through the water)
    () => { const w = new THREE.Mesh(new THREE.BoxGeometry(12, .06, 18), mat('#4fb3ff', { r: .15, cc: .6 })); w.position.set(450, .0, -3); w.receiveShadow = true; c.add(w);
      for (const x of [446, 449.5, 453]) c.block(x, 0, -3.6, 1.1, .3, 1.1, '#9a9a9a', { r: .4 });
      c.block(450, .02, 0, 10, .1, 3, '#b07a4a', { r: .05 }); for (const z of [-1.6, 1.6]) { for (let x = 445.5; x <= 454.5; x += 1.5) c.cyl(x, 0, z, .07, .07, 1, '#8a5a2a'); c.block(450, .95, z, 10, .12, .14, '#b07a4a', { r: .05 }); }
      let splash = 0; return dt => { const inW = P.layer === '' && P.x > 444 && P.x < 456 && P.y < 1.5; if (inW && Math.abs(P.vx) > 1 && (splash -= dt) < 0) { splash = .35; c.burst(P.x, .3, 1.5, ['#9fe6ff', '#ffffff'], 4, 1.4); } if (inW) disc('stream', 'A little stream with a wooden bridge!'); }; },
    // climbing rocks up to a lookout with a telescope
    () => { for (const [a, b, y, col] of [[474, 477, 1.2, '#a39a8f'], [478.5, 481.5, 2.4, '#8f8579'], [483, 486.5, 3.6, '#b5ab9e']]) { c.block((a + b) / 2, 0, -1.3, b - a, y, 1.8, col, { r: .45 }); c.plat(a, b, y, { z: -1.2 }); }
      const tele = new THREE.Group(); tele.position.set(485.6, 3.6, -1.1); c.add(tele);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, 1.2, 20), mat('#ffd23f', { r: .4 })); tube.rotation.z = 1.1; tube.position.y = 1.1; tube.castShadow = true; tele.add(tube);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 8), mat('#7a5230')); leg.position.y = .45; tele.add(leg);
      c.tap(tele, () => { if (P.y < 3) { c.say('🔭 Climb the rocks to look through the telescope!'); return; } c.disc('lookout'); c.say('🔭 What a view! I can see so far away!'); c.burst(485.6, 5, -1, ['#ffd23f', '#fff', '#9fe6ff'], 24, 3); Sound.chime(); }, 485.6); },
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
    () => palAtHome(c, 'robot'), // (build 32) Bolt the toy robot waits here
    () => tunnelMouth(c, 612, -3.6, 'woods'), // (build 32) a secret tunnel to the Whispering Woods
    // toy houses behind
    () => { for (let i = 0; i < 9; i++) { const x = 554 + i * 13; const col = RB[i % 8]; c.block(x, 0, -8.5, 5, 4 + (i % 3), 4, col, { r: .4 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), mat(RB[(i + 3) % 8])); roof.position.set(x, 4 + (i % 3) + 1.2, -8.5); roof.rotation.y = Math.PI / 4; roof.castShadow = true; c.add(roof); } },
    // a musical floor: every tile plays a note
    () => { const tiles = NOTE.map((f, i) => { const m = mat(RB[i], { r: .3, em: RB[i], ei: .05 }).clone(); const t = new THREE.Mesh(W.rbox(1.9, .08, 3, .04), m); t.position.set(557 + i * 2, .04, 0); t.receiveShadow = true; c.add(t); return { m, x: 557 + i * 2 }; });
      let last = -1; return dt => { for (const k of tiles) k.m.emissiveIntensity = Math.max(.05, k.m.emissiveIntensity - dt * 2.5);
        const i = P.layer === '' && P.y < .4 ? Math.floor((P.x - 556) / 2) : -1;
        if (i >= 0 && i < 8 && i !== last) { Sound.withMusic(() => Sound.tone(NOTE[i], .4, 'triangle', .07, 1)); tiles[i].m.emissiveIntensity = 1.4; c.burst(tiles[i].x, .3, 0, [RB[i], '#fff'], 4, 1.2); c.disc('musicfloor', '🎵 A musical floor! Every step plays a note!'); }
        last = i >= 0 && i < 8 ? i : -1; }; },
    // the block tower: press the button, a block drops; too tall and it tumbles down!
    () => { c.block(582, 0, -2.2, 3, .2, 3, '#ffffff', { r: .1 }); const btn = c.cyl(578.6, 0, -1.4, .45, .5, .5, '#ff4f9a', { m: { em: '#ff4f9a', ei: .3 } });
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
    // a seesaw (it tips toward you) with a gem above the high end
    () => { c.cyl(638, 0, -.2, .25, .35, .7, '#ff9a2e'); const plank = new THREE.Mesh(W.rbox(6, .18, 1.2, .08), mat('#ffc21c', { r: .5 })); plank.position.set(638, .8, -.2); plank.castShadow = true; c.add(plank);
      return dt => { const want = P.layer === '' && Math.abs(P.x - 638) < 3 && P.y < 1.5 ? Math.sign(P.x - 638) * -.28 : 0; plank.rotation.z += (want - plank.rotation.z) * Math.min(1, dt * 3); if (want) c.disc('seesaw', '🎢 A seesaw! It tips when you stand on it.'); }; },
    // catch the balloons floating up from the basket
    () => { c.cyl(656, 0, -2.4, .9, .7, .8, '#c87a2a', { r: .8 }); const list = []; const spawn = b => { b.position.set(654.5 + Math.random() * 3, .8, -2.4 + Math.random() * .8); b.rotation.z = 0; b.userData.v = .8 + Math.random() * .6; };
      for (let i = 0; i < 6; i++) { const b = physicalToy('🎈', 1); spawn(b); b.position.y = Math.random() * 8; c.add(b); list.push(b); c.tap(b, () => { if (b.userData.pop) return; b.userData.pop = 1; Sound.pop ? Sound.pop() : Sound.click(); X.balloons++; c.burst(b.position.x, b.position.y, b.position.z, RB, 10, 2.5); c.disc('balloons', '🎈 Pop! Catch the balloons as they float up!'); if (X.balloons % 10 === 0) c.say(`🎈 ${X.balloons} balloons caught!`); setTimeout(() => { b.userData.pop = 0; spawn(b); }, 400); b.position.y = -20; api.saveSoon(); }); }
      return dt => { for (const b of list) { if (b.userData.pop) continue; b.position.y += b.userData.v * dt; b.position.x += Math.sin(b.position.y * 1.3) * dt * .3; if (b.position.y > 10) spawn(b); } }; },
  ];

  // =================== 🔬 LAB GARDENS ===================
  builders.labgarden = c => [
    () => { const flowers = [-1, 0, 1].map(dx => c.toy('🌷', .7, 676 + dx * .7, .55, -2)); let grown; flowers.forEach(f => { f.visible = false; });
      return () => { const events = world.adventures?.events || []; const next = (events.includes('learn_count') && events.includes('learn_plant')) || world.adventures?.completed?.includes('science') === true; if (next === grown) return; grown = next; flowers.forEach(f => { f.visible = grown; }); };
    },
    () => palAtHome(c, 'frog'), // (build 32) Hoppy the frog waits by the pond
    // greenhouse domes behind
    () => { for (const x of [682, 724, 766]) { const d = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d9f6ff', { r: .1, cc: .6 })); d.position.set(x, 0, -11); d.scale.y = .8; c.add(d); } },
    // a colour-changing pond: tap the water, it changes colour, a fish jumps
    () => { const cols = [['blue', '#3b82f6'], ['pink', '#ff7ac8'], ['green', '#3cc45a'], ['purple', '#9b5cf6'], ['orange', '#ff9a1f'], ['yellow', '#ffd23f']]; const m = mat('#3b82f6', { r: .15, cc: .6 }).clone();
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .08, 40), m); pond.position.set(684, .03, -3.6); c.add(pond); const rim = new THREE.Mesh(new THREE.TorusGeometry(3, .25, 10, 40), mat('#b5ab9e', { r: .8 })); rim.rotation.x = Math.PI / 2; rim.position.set(684, .1, -3.6); c.add(rim);
      const fish = c.toy('🐟', .9, 684, -1, -3.6); let k = 0, jt = 9;
      c.tap(pond, () => { k = (k + 1) % cols.length; m.color.set(cols[k][1]); c.say(`🎨 The pond is ${cols[k][0]}!`); jt = 0; Sound.tone(500 + k * 60, .3, 'sine', .05, 1.3); c.burst(684, .4, -3.6, [cols[k][1], '#fff'], 12, 2); c.disc('pond', '🎨 A magic pond! Tap it to change its colour!'); }, 684);
      return dt => { jt += dt; const j = Math.min(1, jt / 1.2); fish.position.set(682.5 + j * 3, j < 1 ? Math.sin(j * Math.PI) * 2 : -1, -3.6); }; },
    // the bubble fountain
    () => { c.cyl(698, 0, -2.2, .8, 1, .7, '#9fe6ff'); const sp = c.cyl(698, .7, -2.2, .15, .2, 1, '#ffffff'); const bubbles = [];
      c.tap(sp.parent ? sp : sp, () => { for (let i = 0; i < 10; i++) { const b = c.toy('🫧', .5 + Math.random() * .5, 698, 1.8, -2.2); b.userData = { vx: (Math.random() - .5) * 1.6, vy: 1 + Math.random() * 1.5, t: 0 }; bubbles.push(b); } Sound.whoosh ? Sound.whoosh() : Sound.click(); c.say('🫧 Bubbles!'); c.disc('fountain', '🫧 The bubble fountain! Tap it for bubbles!'); }, 698);
      return dt => { for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i], u = b.userData; u.t += dt; b.position.x += u.vx * dt; b.position.y += u.vy * dt; if (u.t > 4) { c.remove(b); bubbles.splice(i, 1); } } }; },
    // light and shadow: tap the lamp and a new shadow animal appears on the wall
    () => { c.block(712, 0, -4.4, 6, 4.2, .3, '#fffaf0', { r: .1 }); const lamp = new THREE.Group(); lamp.position.set(709, 0, -1.4); c.add(lamp); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 10), mat('#5b6cff')); pole.position.y = 1.1; lamp.add(pole); const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 12), mat('#fff6b0', { em: '#ffe36e', ei: 1 })); head.position.y = 2.3; lamp.add(head);
      const animals = [['🐰', 'bunny'], ['🐦', 'bird'], ['🐶', 'dog'], ['🦋', 'butterfly'], ['🐢', 'turtle'], ['🦖', 'dinosaur']]; let k = -1; const sh = c.sign('🐰', 2.6, 712.4, 2.2, -4.2, true); sh.visible = false;
      c.tap(lamp, () => { k = (k + 1) % animals.length; sh.material = emojiMat(animals[k][0], true); sh.visible = true; c.say(`🔦 A ${animals[k][1]} shadow!`); Sound.twinkle(); c.disc('shadow', '🔦 Tap the lamp to make shadow animals!'); }, 709);
      return (dt, t) => { if (sh.visible) sh.position.x = 712.4 + Math.sin(t * 1.5) * .3; }; },
    // the rocket: press the big button
    () => { const rk = new THREE.Group(); rk.position.set(730, 0, -2.6); c.add(rk); const body = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, 2.6, 24), mat('#ffffff', { r: .3 })); body.position.y = 1.7; body.castShadow = true; rk.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 24), mat('#ff4f9a')); nose.position.y = 3.5; rk.add(nose); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(W.rbox(.12, .8, .7, .04), mat('#2fa8ff')); const a = i * 2.09; f.position.set(Math.cos(a) * .55, .6, Math.sin(a) * .55); f.rotation.y = -a; rk.add(f); } const win = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), mat('#9fe6ff', { em: '#9fe6ff', ei: .5 })); win.position.set(0, 2.2, .45); rk.add(win);
      c.cyl(730, 0, -2.6, 1.2, 1.3, .2, '#9a9a9a'); const btn = c.cyl(727, 0, -1.2, .45, .5, .5, '#ff4f9a', { m: { em: '#ff4f9a', ei: .3 } }); let flying = 0;
      c.tap(btn, () => { if (flying) return; flying = .001; Sound.whoosh ? Sound.whoosh() : Sound.boing(); c.say('🚀 3... 2... 1... Blast off!'); c.disc('rocket', '🚀 Press the button to launch the rocket!'); }, 727);
      return dt => { if (!flying) return; flying += dt; const t = flying; rk.position.y = t < 3 ? t * t * 3 : t < 7 ? 27 - (t - 3) * 6.7 : 0; if (t < 3 && Math.random() < .6) c.burst(730, rk.position.y, -2.6, ['#ffd23f', '#ff9a2e', '#ffffff'], 2, 1.5); if (t >= 7) { flying = 0; rk.position.y = 0; Sound.boing(); c.say('🚀 The rocket is home again!'); } }; },
    // water jets: press the button, fountains splash up
    () => { const jets = [742, 744, 746, 748, 750].map(x => { c.cyl(x, 0, -2.6, .25, .3, .15, '#9a9a9a'); const j = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 1, 12), mat('#9fe6ff', { r: .1, cc: .6 })); j.position.set(x, 0, -2.6); j.scale.y = .01; c.add(j); return j; });
      const btn = c.cyl(740, 0, -1.2, .45, .5, .5, '#2fa8ff', { m: { em: '#2fa8ff', ei: .3 } }); let on = 0;
      c.tap(btn, () => { on = 4; c.say('💦 Splash! Water fountains!'); Sound.whoosh ? Sound.whoosh() : Sound.click(); c.disc('jets', '💦 Press the blue button for water fountains!'); }, 740);
      return (dt, t) => { on = Math.max(0, on - dt); jets.forEach((j, i) => { const h = on ? 2 + Math.sin(t * 6 + i) * 1.2 : .01; j.scale.y += (h - j.scale.y) * Math.min(1, dt * 8); j.position.y = j.scale.y / 2; if (on && Math.random() < .2) c.burst(742 + i * 2, j.scale.y, -2.6, ['#9fe6ff', '#ffffff'], 1, 1); }); }; },
    // the magnet crane: metal things jump up to the magnet, others stay
    () => { c.cyl(762, 0, -3.2, .2, .25, 4.6, '#ffc21c'); c.block(764, 4.4, -3.2, 4.4, .35, .35, '#ffc21c', { r: .1 }); const mg = c.toy('🧲', 1.1, 765.6, 3.4, -3.2); const can = c.toy('🥫', .9, 765.6, .45, -3.2), apple = c.toy('🍎', .9, 767.4, .45, -3.2); let t0 = -1;
      const go = () => { if (t0 >= 0) return; t0 = 0; Sound.tone(200, .4, 'sawtooth', .02, 1.5); c.disc('magnet2', '🧲 The magnet crane! Metal things jump up to it!'); };
      c.tap(mg, go, 765.6); c.tap(can, go); c.tap(apple, () => { c.say('🍎 The apple does not stick. It is not metal.'); Sound.click(); });
      return dt => { if (t0 < 0) return; t0 += dt; const down = t0 < 1 ? t0 : t0 < 3 ? 1 : Math.max(0, 4 - t0); mg.position.y = 3.4 - down * 1.6; can.position.y = t0 > 1 && t0 < 4 ? mg.position.y - .8 : .45; if (t0 > 1 && t0 - dt <= 1) { Sound.tone(900, .15, 'square', .03, 1); c.say('🧲 Click! The can is metal, so it sticks!'); } if (t0 > 4.2) t0 = -1; }; },
  ];

  // =================== 🖍️ ART PLAZA ===================
  builders.artplaza = c => [
    () => { const frame = c.toy('🖼️', 1.3, 798, 2, -2); c.tap(frame, () => api.gallery?.(), 798, { icon: '🖼️', label: 'Gallery', action: 'Open gallery', disc: 'gallery' }); },
    // the sticker wall: tap anywhere on it to stick a picture there (they're remembered)
    () => { const STK = ['⭐', '❤️', '🌈', '🦄', '🐱', '🌸', '🚀', '🍦', '🐞', '🌙', '🎈', '🦋'];
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const g = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const draw = () => { g.fillStyle = '#fffaf2'; g.fillRect(0, 0, 1024, 512); g.lineWidth = 18; g.strokeStyle = '#ff9fd2'; g.strokeRect(9, 9, 1006, 494); g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const [u, v, i] of X.stickers) g.fillText(STK[i % STK.length], u * 1024, (1 - v) * 512); tex.needsUpdate = true; };
      draw(); const wallM = new THREE.MeshBasicMaterial({ map: tex }); wallM.userData.own = true; const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallM); wall.position.set(804, 3.4, -4.3); c.add(wall); c.block(804, 0, -4.5, 12.6, 6.8, .3, '#ffffff', { r: .1 });
      c.tap(wall, h => { if (!h || !h.uv) { Sound.click(); return; } const i = rnd(STK.length); X.stickers.push([+h.uv.x.toFixed(3), +h.uv.y.toFixed(3), i]); if (X.stickers.length > 80) X.stickers.shift(); draw(); Sound.pop ? Sound.pop() : Sound.click(); c.disc('stickers', '⭐ The sticker wall! Tap to add stickers. They stay there!'); api.saveSoon(); }); },
    // spin art: tap the wheel, it spins and paint splats fly onto it
    () => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .12, 40), [mat('#ffffff'), Object.assign(new THREE.MeshBasicMaterial({ map: tex }), { userData: { own: true } }), mat('#ffffff')]); disk.position.set(820, 1.3, -2.2); disk.rotation.x = 1.25; c.add(disk); c.cyl(820, 0, -2.6, .2, .3, 1.2, '#a15cff');
      let spin = 0;
      c.tap(disk, () => { spin = 2.5; const col = pick(RB); for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, r = Math.random() * 100; g.fillStyle = col; g.beginPath(); g.ellipse(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 10 + Math.random() * 18, 6 + Math.random() * 10, a, 0, 7); g.fill(); } tex.needsUpdate = true; Sound.twinkle(); c.say('🎨 Whirl! Spin art!'); c.disc('spinart', '🎨 Spin art! Tap the wheel to splash paint!'); }, 820);
      return dt => { spin = Math.max(0, spin - dt); disk.rotation.y += dt * (1 + spin * 8); }; },
    // the instrument circle: a big drum, bells and a xylophone
    () => { const drum = c.cyl(834, 0, -2, .9, .9, 1.1, '#ff4f9a'); c.cyl(834, 1.1, -2, .92, .92, .06, '#fffaf0');
      c.tap(drum, () => { Sound.withMusic(() => { Sound.tone(110, .3, 'sine', .12, .5); Sound.noise && Sound.noise(.12, 200, 900, .05); }); drum.scale.y = .9; setTimeout(() => { drum.scale.y = 1; }, 120); c.disc('drum', '🥁 Boom! The big drum!'); }, 834);
      [0, 1, 2].forEach(i => { const b = c.sph(838.5 + i * 1.1, 2.4, -2.4, .35, '#ffd23f', { m: { m: .6 } }); c.cyl(838.5 + i * 1.1, 0, -2.4, .05, .05, 2.1, '#9a9a9a'); c.tap(b, () => { Sound.withMusic(() => Sound.bell ? Sound.bell([784, 988, 1175][i], .06) : Sound.tone(880, .8, 'sine', .05, 1)); c.disc('bells', '🔔 Ding! Tap the bells!'); }); });
      NOTE.forEach((f, i) => { const bar = c.block(843 + i * .55, .8 - i * .03, -2.2, .45, .12, 1.4 - i * .08, RB[i], { r: .04 }); c.tap(bar, () => { Sound.withMusic(() => Sound.tone(f * 2, .5, 'triangle', .07, 1)); c.burst(843 + i * .55, 1.1, -2.2, [RB[i], '#fff'], 4, 1.2); c.disc('xylo2', '🎶 A rainbow xylophone!'); }); });
      c.block(845, 0, -2.2, 4.8, .7, 1.2, '#9a6a3a', { r: .1 }); },
    // the light mixer: three coloured lamps shine on a white statue
    () => { const statue = c.sph(860, 1.6, -2.8, 1.1, '#ffffff', { m: { r: .5, em: '#000000', ei: 1 } }); const sm = statue.material = statue.material.clone(); c.cyl(860, 0, -2.8, .7, .8, .6, '#e6e0f0');
      const L = [['red', '#ff2a2a', 856.5], ['green', '#2aff4a', 860], ['blue', '#2a5aff', 863.5]], on = [0, 0, 0];
      const name = () => { const k = on.join(''); return { '000': 'no light', '100': 'red', '010': 'green', '001': 'blue', '110': 'yellow', '101': 'pink', '011': 'light blue', '111': 'white' }[k]; };
      L.forEach(([n, col, x], i) => { const b = c.cyl(x, 0, -1.2, .45, .5, .5, col, { m: { em: col, ei: .2 } }); c.tap(b, () => { on[i] = 1 - on[i]; sm.emissive.setRGB(on[0] * .9, on[1] * .9, on[2] * .9); Sound.tone(400 + i * 120, .2, 'sine', .05, on[i] ? 1.4 : .7); const nm = name(); c.say(on.reduce((a, b) => a + b, 0) >= 2 ? `💡 Mixed light makes ${nm}!` : `💡 ${nm}!`); c.disc('lightmix', '💡 Mix coloured lights on the statue!'); }, x); }); },
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
    // the rainbow portal home
    () => { for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.2 - i * .22, .14, 10, 36), mat(RB[i], { em: RB[i], ei: .2 })); r.position.set(900, 2.2, -1.5); r.rotation.y = Math.PI / 2; c.add(r); }
      const hm = c.sign('🏠', 1.2, 900, 2.2, -1.4); c.tap(hm, () => api.goHome(), 900); },
  ];

  // a pal waiting at home (inside its neighbourhood): tap it three times to make friends
  function palAtHome(c, kind) {
    if (followers[kind]) return null; const m = makePalMesh(kind), [x, y, z] = PALS[kind].home; m.position.set(x, y, z); m.userData.pal = kind; c.add(m); let taps = 0;
    c.tap(m, () => { if (followers[kind]) return; taps++; boingIt(m); Sound.giggle(); if (X.pals[kind]) { c.remove(m); setFollow(kind, true); say(`${PAL_EMOJI[kind]} ${PAL_NAME[kind]} is coming with you!`); return; }
      if (taps < 3) say(taps === 1 ? `${PAL_EMOJI[kind]} ${{ crab: 'Snap snap', fox: 'Yip', penguin: 'Squeak', robot: 'Beep boop', frog: 'Ribbit', parrot: 'Squawk', pig: 'Oink oink', seal: 'Ar ar', goat: 'Maa' }[kind]}! Hello!` : `${PAL_EMOJI[kind]} ${PAL_NAME[kind]} likes you! One more tap!`);
      else { c.remove(m); setFollow(kind, true); disc('pal_' + kind); say(PALS[kind].hello); c.burst(x, 1.5, z, ['#ff8fc8', '#fff', '#ffd23f'], 24, 3); Sound.chime(); } }, x);
    return (dt, t) => { if (!m.parent) return; m.position.x = x + Math.sin(t * .9) * (kind === 'crab' ? 1.5 : .6); m.userData.body.position.y = Math.abs(Math.sin(t * 5)) * .05; if (kind === 'fox') m.rotation.y = Math.cos(t * .9) > 0 ? 0 : Math.PI; };
  }
  const boingIt = o => { o.userData.bt = 1; };
  // (build 32) SECRET TUNNELS: a cave mouth half-hidden behind bushes; tap it (or PAW next to it) and you whoosh through
  // the hill to the tunnel at the other side of the world (a shortcut; the place you arrive at is built at once)
  const TUNNELS = { woods: { x: -232, back: 'toytown' }, toytown: { x: 612, back: 'woods' } };
  function tunnelMouth(c, x, z, to) {
    const rock = c.sph(x, 0, z, 1.9, '#8a7f74', { m: { r: .95, cc: 0 } }); rock.scale.set(1.2, .9, .7);
    const hole = c.sph(x, .6, z + 1.25, .95, '#1c1520', { m: { r: 1, cc: 0 } }); hole.scale.set(1, 1, .2);
    for (const dx of [-1.6, 1.6]) { const b = c.sph(x + dx, .5, z + 1.1, .7, '#3f8f4a', { m: { r: .9 } }); b.scale.y = .8; }
    const sign = c.sign('🕳️', .8, x, 2.2, z + 1.3);
    const go = () => { const dest = TUNNELS[to]; c.disc('tunnel', '🕳️ A secret tunnel! It is a shortcut across the world!'); api.travelTo(dest.x + 2, '🕳️', 'the other end of the secret tunnel'); };
    c.tap(rock, go, x); c.tap(hole, go); c.tap(sign, go);
    return (dt, t) => { sign.position.y = 2.2 + Math.sin(t * 2) * .12; };
  }

  // =================== 🏖️ SUNNY SEASIDE (x -150 to -20) ===================
  builders.seaside = c => [
    // the ice cream stand: tap the tubs to stack scoops, tap the cone to eat it
    () => { c.block(-35, 0, -3.4, 3.4, 1.1, 1.2, '#ffffff', { r: .2 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 4), mat('#ff7ac8')); roof.position.set(-35, 3.2, -3.4); roof.rotation.y = Math.PI / 4; roof.scale.z = .6; c.add(roof); for (const x of [-36.6, -33.4]) c.cyl(x, 0, -3.4, .07, .07, 2.6, '#ffffff');
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
      const boat = new THREE.Group(); boat.position.set(-115, 0, -11); c.add(boat); const hull = new THREE.Mesh(W.rbox(3, .7, 1.3, .3), mat('#ff7a5c')); hull.position.y = .3; hull.castShadow = true; boat.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.4, 8), mat('#9a6a3a')); mast.position.y = 1.6; boat.add(mast); const sail = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.9, 3), mat('#ffffff')); sail.position.set(.35, 1.7, 0); sail.scale.z = .1; boat.add(sail);
      const gull = c.toy('🕊️', .8, -115, 4, -11); let trip = 0;
      const go = () => { if (trip) return; trip = .001; Sound.bell ? Sound.bell(880, .06) : Sound.chime(); c.say('⛵ Ding ding! The boat is sailing!'); c.disc('boat', '⛵ Ring the bell on the pier and the boat sails away!'); };
      c.tap(bell, go, -115); c.tap(boat, go);
      return (dt, t) => { boat.rotation.z = Math.sin(t * 1.4) * .06; boat.position.y = Math.sin(t * 1.1) * .08; gull.position.set(boat.position.x + Math.sin(t) * 2, 4 + Math.sin(t * 2) * .3, boat.position.z - 1);
        if (trip) { trip += dt; const k = trip < 6 ? trip / 6 : trip < 12 ? 1 - (trip - 6) / 6 : 0; boat.position.x = -115 - Math.sin(k * Math.PI / 2) * 22; boat.position.z = -11 - Math.sin(k * Math.PI) * 6; boat.rotation.y = trip < 6 ? Math.PI : 0; if (trip > 12) { trip = 0; boat.position.set(-115, 0, -11); boat.rotation.y = 0; } } }; },
    // the kite: tap it and it flies up high, looping in the wind
    () => { const kite = c.toy('🪁', 1.2, -132, 1.2, -2.6); c.cyl(-132, 0, -2.6, .05, .05, .8, '#9a6a3a'); let fly = 0;
      c.tap(kite, () => { fly = fly ? 0 : .001; c.say(fly ? '🪁 Whee! The kite is flying!' : '🪁 The kite comes down to rest.'); Sound.whoosh ? Sound.whoosh() : Sound.click(); c.disc('kite', '🪁 Tap the kite and it flies up into the sky!'); }, -132);
      return (dt, t) => { const h = fly ? Math.min(1, (fly += dt) / 2) : 0; kite.position.set(-132 + Math.sin(t * 1.3) * 2.5 * h, 1.2 + h * (7 + Math.sin(t * 2.1) * 1.2), -2.6 - h * 3); kite.rotation.z = h ? Math.sin(t * 2) * .5 : 0; }; },
    // seagulls flying over the beach (tap one: squawk!)
    () => { const gulls = [0, 1, 2].map(i => { const g2 = c.toy('🕊️', .9, -60 - i * 30, 6, -6); c.tap(g2, () => { Sound.tone(1200, .12, 'sawtooth', .02, .6); Sound.tone(1000, .12, 'sawtooth', .02, .6, .15); c.say('🕊️ Squawk! A seagull!'); c.disc('gulls'); }); return { g2, i }; });
      return (dt, t) => { for (const { g2, i } of gulls) { g2.position.x = -85 + Math.sin(t * .25 + i * 2) * 55; g2.position.y = 6 + Math.sin(t * 1.7 + i) * .8; } }; },
  ];

  // =================== 🌲 WHISPERING WOODS (x -272 to -150) ===================
  builders.woods = c => [
    () => tunnelMouth(c, -232, -4.4, 'toytown'), // (build 32) a secret tunnel to Toy Town
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
      c.tap(lg, () => { k = (k + 1) % ANI.length; setToySymbol(who, ANI[k][0]); who.visible = true; show = 2.5; Sound.giggle(); c.say(`🪵 Peekaboo! It's ${ANI[k][1]}!`); c.disc('log', '🪵 Who is in the hollow log? Tap it to see!'); }, -180);
      return dt => { if (show > 0) { show -= dt; who.position.x = -178.4 + Math.min(1, (2.5 - show) * 3) * .9; if (show <= 0) who.visible = false; } }; },
    // A sound clue always has matching pictures, so the search works with sound off.
    () => { const listen = c.sign('👂', 1, -187, 1.4, -2); const owl = c.toy('🦉', 1.2, -201, 2.2, -3); owl.visible = false; let listening = world.adventures?.events.includes('woods_listen') || false;
      [-190, -194, -198].forEach(x => c.sign('🦉', .45, x, .7, -1.4));
      c.tap(listen, () => { listening = true; api.event?.({ type: 'activity', id: 'woods_listen' }); Sound.tone(420, .3, 'sine', .05, 1); Sound.tone(340, .4, 'sine', .05, 1, .4); c.say('🦉 Hoo hoo! Follow the owl pictures to the hidden owl!'); }, -187, { icon: '👂', label: 'Owl call', action: 'Listen', disc: 'woods_listen' });
      const reveal = () => { if (!listening) { c.say('👂 Tap the ear picture, then follow the owl pictures!'); return; } owl.visible = true; api.event?.({ type: 'activity', id: 'woods_found' }); Sound.giggle(); c.say('🦉 You found the owl! Hoo hoo!'); };
      const hiding = c.sph(-201, .8, -3, .8, '#3f8f4a', { m: { r: .9 } }); c.tap(hiding, reveal, -201, { icon: '🦉', label: 'Hidden owl', action: 'Find owl', disc: 'woods_found' }); c.tap(owl, reveal);
    },
    // berry bushes: tap a bush, berries drop into the basket, and we count them
    () => { const bush = c.sph(-195, .9, -3, 1.1, '#3f8f4a', { m: { r: .9 } }); bush.scale.set(1.3, .9, .9); const berries = []; for (let i = 0; i < 6; i++) berries.push(c.sph(-195.8 + (i % 3) * .8, 1.2 + Math.floor(i / 3) * .5, -2.2, .13, '#c2185b', { m: { r: .4 } }));
      c.cyl(-192.4, 0, -2, .5, .4, .5, '#c8925a', { r: .8 }); let n = 0;
      c.tap(bush, () => { const b = berries.find(q => q.visible); if (!b) { berries.forEach(q => { q.visible = true; q.position.set(q.userData.x0 ?? q.position.x, q.userData.y0 ?? q.position.y, -2.2); }); n = 0; c.say('🫐 The berries grew back!'); return; } b.userData.x0 = b.userData.x0 ?? b.position.x; b.userData.y0 = b.userData.y0 ?? b.position.y; b.visible = false; n++; c.say(['', 'one', 'two', 'three', 'four', 'five', 'six'][n] + '!'); Sound.tone(500 + n * 60, .1, 'triangle', .05, 1.2); c.burst(-192.4, .6, -2, ['#c2185b'], 4, 1); if (n === 6) c.say('🧺 Six berries in the basket! Yummy!'); c.disc('berries', '🧺 Pick berries! Tap the bush and count them.'); }, -195); },
    // leaf piles on the path: run through them and the leaves fly everywhere
    () => { const piles = [-207, -212, -217].map(x => { const p2 = c.sph(x, 0, 0, .9, pick(['#e8902a', '#d9682a', '#f2b23a']), { m: { r: .9 } }); p2.scale.y = .35; return { p2, x, t: 0 }; });
      return (dt) => { for (const q of piles) { q.t = Math.max(0, q.t - dt); if (q.t <= 0 && P.layer === '' && Math.abs(P.x - q.x) < 1 && P.y < .8 && Math.abs(P.vx) > 1) { q.t = 2; c.burst(q.x, .5, 0, ['#e8902a', '#d9682a', '#f2b23a', '#8a5a2a'], 22, 3.5); Sound.whoosh ? Sound.whoosh() : Sound.click(); c.disc('leaves', '🍂 Crunch! Run through the leaf piles!'); } q.p2.scale.y = .35 * (q.t > 0 ? .4 + (2 - q.t) * .3 : 1); } }; },
    // the creek: stepping logs across (jump from log to log), with a gem on the tall one
    () => { const w = new THREE.Mesh(new THREE.BoxGeometry(7, .05, 16), mat('#4fb3ff', { r: .15, cc: .6 })); w.position.set(-226, .02, -3); c.add(w);
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
      const home = c.sign('🏠', 1, -268, 2.2, -1.4); c.tap(home, () => api.goHome(), -268);
      return (dt, t) => { pal && pal(dt, t); }; },
  ];

  // =================== ❄️ FROSTY PEAKS (x -404 to -272) ===================
  builders.frosty = c => [
    // the sledding hill: climb the snowy steps, tap the sled at the top and whoosh down the other side
    () => { const hill = c.sph(-328, -2.2, -5.5, 8, '#f3f8ff', { m: { r: .9, cc: 0 } }); hill.scale.set(1, .9, .55);
      for (const [a, b, y] of [[-318.5, -320.5, 1.2], [-321, -323, 2.4], [-323.5, -325.5, 3.6], [-326, -331, 4.8]]) { c.block((a + b) / 2, 0, -1.3, Math.abs(b - a), y, 1.6, '#e8f1fd', { r: .3 }); c.plat(Math.min(a, b), Math.max(a, b), y, { z: -1.2 }); }
      const sled = new THREE.Group(); sled.position.set(-330, 4.8, -1.2); c.add(sled); const base = new THREE.Mesh(W.rbox(1.3, .18, .7, .08), mat('#ff4f6a')); base.position.y = .25; sled.add(base); for (const z of [-.3, .3]) { const run = new THREE.Mesh(W.rbox(1.5, .06, .06, .03), mat('#ffd23f', { m: .5 })); run.position.set(0, .08, z); sled.add(run); }
      const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-331, 5.4, -1.2), new THREE.Vector3(-334, 4.6, -1), new THREE.Vector3(-338, 2.6, -.6), new THREE.Vector3(-342, 1, -.2), new THREE.Vector3(-346, .6, 0)]);
      c.tap(sled, () => { if (P.y < 4.3) { c.say('🛷 Climb up the snowy steps to the sled!'); return; } api.startSlide(path); c.disc('sled', '🛷 Wheee! Sledding down the hill!'); c.say('🛷 Wheee!'); }, -330); },
    // build a snowman: each tap adds a part, then a carrot nose and a hat
    () => { const pile = c.sph(-300, 0, -2.6, .9, '#ffffff', { m: { r: .9, cc: 0 } }); pile.scale.y = .4; const parts = []; let k = 0;
      const STEPS = [() => c.sph(-297, .8, -2.6, .8, '#ffffff', { m: { r: .9, cc: 0 } }), () => c.sph(-297, 2, -2.6, .6, '#ffffff', { m: { r: .9, cc: 0 } }), () => c.sph(-297, 2.95, -2.6, .45, '#ffffff', { m: { r: .9, cc: 0 } }),
        () => { const n = new THREE.Mesh(new THREE.ConeGeometry(.09, .5, 10), mat('#ff8a1f')); n.rotation.z = -Math.PI / 2; n.position.set(-296.5, 2.95, -2.2); n.rotation.y = -.6; c.add(n); return n; }, () => c.toy('🎩', .8, -297, 3.55, -2.6)];
      if (world.adventures?.events?.includes('snow_built')) { for (const build of STEPS) parts.push(build()); k = STEPS.length; }
      const roll = c.sph(-302, .35, -1.5, .35, '#ffffff', { m: { r: .9, cc: 0 } });
      c.tap(roll, () => { roll.rotation.z -= 1; api.event?.({ type: 'activity', id: 'snow_rolled' }); Sound.boing(); c.say('⚪ Roll roll! A snowball for your snow friend!'); }, -302, { icon: '⚪', label: 'Snowball', action: 'Roll snowball', disc: 'snow_rolled' });
      c.tap(pile, () => { if (k < STEPS.length) { parts.push(STEPS[k]()); k++; Sound.tone(400 + k * 70, .12, 'sine', .05, 1.2); c.say(['⛄ A big snowball!', '⛄ Now the middle!', '⛄ And the head!', '🥕 A carrot nose!', '🎩 A hat! Hello, Mister Snowman!'][k - 1]); c.disc('snowman', '⛄ Tap the snow to build a snowman!'); if (k === STEPS.length) { api.event?.({ type: 'activity', id: 'snow_built' }); Sound.giggle(); c.burst(-297, 3.5, -2.6, ['#ffffff', '#9fe6ff'], 20, 3); } }
        else { for (const q of parts) c.remove(q); parts.length = 0; k = 0; c.say('☀️ The sun melted the snowman! Build a new one!'); } }, -300, { icon: '⛄', label: 'Snow friend', action: 'Build snow friend', disc: 'snowman' }); },
    // snowball toss at a target: tap the snow pile, the snowball flies and splats
    () => { c.cyl(-312, 0, -4, .08, .08, 2, '#9a6a3a'); const tgt = c.cyl(-312, 2, -3.95, 1, 1, .12, '#ff4f6a'); tgt.rotation.x = Math.PI / 2; const t2 = c.cyl(-312, 2.01, -3.9, .6, .6, .12, '#ffffff'); t2.rotation.x = Math.PI / 2; const t3 = c.cyl(-312, 2.02, -3.85, .25, .25, .12, '#ff4f6a'); t3.rotation.x = Math.PI / 2;
      const pile = c.sph(-306.5, 0, -1.6, .55, '#ffffff', { m: { r: .9, cc: 0 } }); pile.scale.y = .5; const balls = []; let hits = 0;
      c.tap(pile, () => { const s2 = c.sph(-306.5, .6, -1.6, .2, '#ffffff', { m: { r: .9, cc: 0 } }); s2.userData.t = 0; balls.push(s2); Sound.whoosh ? Sound.whoosh() : Sound.click(); }, -306.5);
      return dt => { for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i]; b.userData.t += dt; const k = Math.min(1, b.userData.t / .8); b.position.set(-306.5 - 5.5 * k, .6 + Math.sin(k * Math.PI) * 2.4 + 1.4 * k, -1.6 - 2.2 * k); if (k >= 1) { c.remove(b); balls.splice(i, 1); hits++; Sound.tone(200, .15, 'square', .03, .6); c.burst(-312, 2, -3.7, ['#ffffff', '#dff3ff'], 12, 2); c.say(hits % 5 === 0 ? `❄️ Splat! ${hits} snowballs!` : '❄️ Splat!'); c.disc('snowball', '❄️ Tap the snow pile to throw snowballs at the target!'); } } }; },
    // the frozen pond: step on the ice and you glide along (slippery!)
    () => { const ice = new THREE.Mesh(new THREE.BoxGeometry(14, .06, 7), mat('#bfe6ff', { r: .08, cc: .8 })); ice.position.set(-361, .03, -.6); ice.receiveShadow = true; c.add(ice); let glide = 0, was = false;
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
    // the end of the line: a 🏠 sign that takes you home
    () => { const home = c.sign('🏠', 1, -397, 2.2, -1.4); c.tap(home, () => api.goHome(), -397); },
  ];

  // =================== 🚜 HAPPY FARM (x -536 to -404) — build 35 ===================
  // Every activity is picture + sound + spoken words only, and teaches something small: counting (eggs, carrots, apples,
  // ducklings), colours (the rainbow sheep), animal names and sounds (the barn), growing (seed → sprout → carrot).
  const COLOURS = [['#ff6fae', 'pink'], ['#4fa8ff', 'blue'], ['#ffd23f', 'yellow'], ['#3cc46e', 'green'], ['#a15cff', 'purple'], ['#ff8a1f', 'orange'], ['#ffffff', 'white']];
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
  builders.farm = c => [
    // the red barn: tap the doors and an animal comes out to say hello (a different one each time)
    () => { c.block(-420, 0, -5.6, 7, 4.2, 4, '#d8443c', { r: .15 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 4), mat('#8a2a24', { r: .8 })); roof.rotation.y = Math.PI / 4; roof.scale.z = .62; roof.position.set(-420, 5.3, -5.6); c.add(roof);
      c.block(-420, 4.2, -3.55, 7.2, .25, .2, '#ffffff', { r: .05 }); const doors = [-1, 1].map(s2 => { const d = c.block(-420 + s2 * .8, 0, -3.5, 1.6, 2.8, .16, '#b8322c', { r: .08 }); c.block(-420 + s2 * .8, 1.4, -3.4, 1.4, .14, .06, '#ffffff', { r: .02 }); return d; });
      const who = c.toy('🐴', 1.4, -420, 1.1, -3.1); who.visible = false; const ANI = [['🐴', 'a horse', 'Neigh!', 520], ['🐄', 'a cow', 'Moo!', 140], ['🐐', 'a goat', 'Maa!', 600], ['🐑', 'a sheep', 'Baa!', 480], ['🐓', 'a rooster', 'Cock-a-doodle-doo!', 900]]; let k = -1, show = 0;
      const open = () => { k = (k + 1) % ANI.length; setToySymbol(who, ANI[k][0]); who.visible = true; show = 3; Sound.tone(ANI[k][3], .25, 'sawtooth', .025, .7); Sound.tone(ANI[k][3] * .8, .3, 'sawtooth', .02, .7, .25); c.say(`${ANI[k][0]} ${ANI[k][2]} It's ${ANI[k][1]}!`); c.disc('barn', '🏚️ Tap the barn doors: who lives inside?'); };
      for (const d of doors) c.tap(d, open); c.tap(who, open); c.tap(c.sign('🚪', .7, -420, 3.3, -3.3), open, -420);
      return dt => { if (show > 0) { show -= dt; const o = Math.min(1, (3 - show) * 3, show * 3); doors[0].position.x = -420.8 - o * 1.4; doors[1].position.x = -419.2 + o * 1.4; who.position.z = -3.1 + o * 1.4; if (show <= 0) who.visible = false; } }; },
    // the hen house: tap the hen and she lays an egg in the basket; count to five and the chicks hatch
    () => { c.block(-432, 0, -4.4, 2.6, 1.8, 2, '#f2c27a', { r: .1 }); const rf = new THREE.Mesh(new THREE.ConeGeometry(2, 1, 4), mat('#d8443c')); rf.rotation.y = Math.PI / 4; rf.scale.z = .7; rf.position.set(-432, 2.3, -4.4); c.add(rf);
      const hen = c.toy('🐔', 1.1, -431, .7, -2.6); c.cyl(-433.4, 0, -2.4, .55, .45, .45, '#c8925a', { r: .8 }); const eggs = []; const chicks = []; let hatch = 0;
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
    () => { for (const [x, y, w] of [[-464, 0, 3], [-466, 1, 3], [-467.5, 2, 2.2]]) c.block(x, y, -1.4, w, 1, 1.6, '#e8c45a', { r: .12 }); c.sph(-468, 3, -1.4, .9, '#f0d070', { m: { r: .95, cc: 0 } }).scale.set(1.4, .5, 1);
      c.plat(-465.5, -462.5, 1, { z: -1.2, step: true, stepMax: 1.05 }); c.plat(-467.5, -464.5, 2, { z: -1.2, step: true, stepMax: 1.05 }); c.plat(-468.6, -466.4, 3.05, { z: -1.2, pad: true, bounce: 12.5, onLand: () => c.disc('hay', '🌾 Boing! Bounce on the haystack!') }); },
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
    () => { const tr = new THREE.Group(); tr.position.set(-524, 0, -5); c.add(tr); const bd = new THREE.Mesh(W.rbox(2, .9, 1.2, .15), mat('#3cc46e', { r: .4 })); bd.position.y = .9; bd.castShadow = true; tr.add(bd); const cab = new THREE.Mesh(W.rbox(.9, 1, 1.1, .1), mat('#ffd23f', { r: .4 })); cab.position.set(-.4, 1.75, 0); tr.add(cab);
      const wheels = []; for (const [x, r] of [[-.6, .6], [.7, .38]]) for (const z of [-.65, .65]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 16), mat('#2b2d42', { r: .9 })); w.rotation.x = Math.PI / 2; w.position.set(x, r, z); tr.add(w); wheels.push(w); }
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .6, 8), mat('#666')); pipe.position.set(.6, 1.6, 0); tr.add(pipe); let drive = 0;
      c.tap(tr, () => { if (drive) return; drive = .001; Sound.tone(90, 1.2, 'sawtooth', .03, 1); c.say('🚜 Vroom vroom! The tractor drives across the field!'); c.disc('tractor', '🚜 Tap the tractor and watch it drive!'); }, -524);
      return (dt, t) => { if (!drive) { bd.position.y = .9 + Math.sin(t * 20) * .01; return; } drive += dt; const k = drive < 4 ? drive / 4 : drive < 8 ? 1 - (drive - 4) / 4 : 0; tr.position.x = -524 + Math.sin(k * Math.PI / 2) * 14; tr.rotation.y = drive < 4 ? 0 : Math.PI; for (const w of wheels) w.rotation.y += dt * 6; if (Math.random() < dt * 4) c.burst(tr.position.x + .6, 2, -5, ['#cccccc', '#ffffff'], 1, .6); if (drive > 8) { drive = 0; tr.position.x = -524; tr.rotation.y = 0; } }; },
    // cows grazing in the far field (tap one: moo!)
    () => { const cows = [[-438, -9], [-485, -10], [-510, -9.5]].map(([x, z]) => { const s = c.toy('🐄', 1.8, x, .9, z); c.tap(s, () => { Sound.tone(140, .5, 'sawtooth', .03, .6); c.say('🐄 Moooo!'); c.disc('cows'); }); return { s, x }; });
      for (let x = -410; x > -534; x -= 3) c.block(x, 0, -7, .14, 1, .14, '#ffffff', { r: .03 }); c.block(-472, .7, -7, 124, .12, .08, '#ffffff', { r: .02 }); c.block(-472, .35, -7, 124, .12, .08, '#ffffff', { r: .02 });
      return (dt, t) => { for (const q of cows) q.s.position.x = q.x + Math.sin(t * .15 + q.x) * 1.5; }; },
    // the end of the line: a 🏠 sign that takes you home
    () => { const home = c.sign('🏠', 1, -530, 2.2, -1.4); c.tap(home, () => api.goHome(), -530); },
  ];

  // =================== 🌊 OCEAN PIER (x -668 to -536) — build 38 ===================
  // Picture + sound + voice only: counting (fish, coins), colours (fish), sea-creature names (tide pool), high and low
  // notes (musical buoys), cause and effect (whistle → dolphin, dig → treasure, tap → whale spout).
  const FISH = [['🐟', 'a blue fish'], ['🐠', 'a yellow fish'], ['🐡', 'a puffer fish'], ['🐟', 'another blue fish'], ['🐠', 'a stripy fish']];
  builders.pier = c => [
    // the sea behind the pier (one shared-material plane), a foam line and the wooden pier going out over the water
    () => { const sea = new THREE.Mesh(new THREE.PlaneGeometry(134, 40, 1, 1), mat('#3fa9e8', { r: .12, cc: .7 })); sea.rotation.x = -Math.PI / 2; sea.position.set(-602, .02, -26); sea.receiveShadow = true; c.add(sea);
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(134, .8, 1, 1), mat('#ffffff', { r: .6, cc: 0 })); foam.rotation.x = -Math.PI / 2; foam.position.set(-602, .03, -6.2); c.add(foam);
      c.block(-560, .5, -11, 3, .25, 12, '#b07a4a', { r: .04 }); for (const z of [-6, -10, -14, -17]) for (const dx of [-1.3, 1.3]) c.cyl(-560 + dx, 0, z, .14, .14, .8, '#7a5236');
      return (dt, t) => { foam.position.z = -6.2 + Math.sin(t * .8) * .3; }; },
    // fishing: tap the rod, wait for the bobber to dip, and a fish jumps into the bucket (count to five, then let them go)
    () => { c.cyl(-552, 0, -3.2, .06, .06, 1.6, '#7a5236'); const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, 2.6, 8), mat('#3b2b30')); rod.position.set(-552, 2, -4); rod.rotation.x = -.7; c.add(rod);
      const bob = c.sph(-552, .15, -6.8, .16, '#ff4f6a', { m: { r: .4 } }); const bucket = c.cyl(-550, 0, -2.2, .4, .32, .55, '#4fa8ff', { r: .5 }); let wait = 0, n = 0, fishCount = 0; const caught = []; let catchCycle = 0;
      c.tap(rod, () => { if (wait) return; wait = 1.4; c.say('🎣 Shhh... wait for a fish!'); c.disc('fishing', '🎣 Tap the fishing rod and catch a fish!'); }, -552, { icon: '🎣', label: 'Fishing rod', action: 'Catch something', disc: 'fishing' }); c.tap(bob, () => { if (!wait) { wait = 1.4; c.say('🎣 Shhh... wait for a fish!'); } }); c.tap(bucket, () => { c.say(fishCount ? `🪣 ${NUM[Math.min(6, fishCount)]} fish in the bucket!` : '🪣 The bucket is empty. Catch a fish!'); });
      return (dt, t) => { bob.position.y = .15 + Math.sin(t * 2) * .04; if (wait > 0) { wait -= dt; if (wait < .5) bob.position.y = -.05; if (wait <= 0) { wait = 0; const kind = api.catch?.() ?? ['fish', 'boot', 'shell', 'bottle'][catchCycle++ % 4]; const fishIndex = n % FISH.length; const [e, name] = kind === 'fish' ? FISH[fishIndex] : ({ boot: ['🥾', 'an old boot'], shell: ['🐚', 'a shiny shell'], bottle: ['📜', 'a message bottle with a treasure clue'] }[kind] || FISH[fishIndex]); if (kind === 'fish') { fishCount++; api.event?.({ type: 'activity', id: 'fish_caught' }); api.event?.({ type: 'sea', id: ['bluefish', 'yellowfish', 'puffer', 'bluefish', 'yellowfish'][fishIndex] }); } n++; const f = c.toy(e, .7, -552, .6, -6.8); caught.push({ f, t: 0 }); if (caught.length > 5) c.remove(caught.shift().f); Sound.pop ? Sound.pop() : Sound.click(); c.say(`${e} ${NUM[Math.min(6, n)]}! It's ${name}!`); c.burst(-552, .4, -6.8, ['#9fdcff', '#fff'], 10, 2);
            if (n === 5) { setTimeout(() => { for (const q of caught) c.remove(q.f); caught.length = 0; n = 0; fishCount = 0; c.say('🌊 The fish swim home. Your other finds go in the beach basket!'); }, 2500); } } }
        for (const q of caught) { q.t += dt; const k = Math.min(1, q.t / .8); q.f.position.set(-552 + 2 * k, .6 + Math.sin(k * Math.PI) * 1.6 + .2 * k, -6.8 + 4.6 * k); } }; },
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
    () => { const rock = c.sph(-584, 0, -2.4, .9, '#8a7f74', { m: { r: .9 } }); rock.scale.set(1.4, .45, .9); const pal = palAtHome(c, 'seal'); return (dt, t) => { pal && pal(dt, t); }; },
    // stacked crates (a gem waits on top) next to the dolphin show
    () => { for (const [x, y, w] of [[-594.5, 0, 2], [-596.5, 1, 2], [-598, 2, 1.6]]) c.block(x, y, -1.4, w, 1, 1.4, '#c8925a', { r: .06 }); c.plat(-595.5, -593.5, 1, { z: -1.2, step: true, stepMax: 1.05 }); c.plat(-597.5, -595.5, 2, { z: -1.2, step: true, stepMax: 1.05 }); c.plat(-598.8, -597.2, 2.98, { z: -1.2, onLand: () => c.disc('crates', '📦 You climbed the crates!') }); },
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
    () => { const boat = new THREE.Group(); boat.position.set(-636, 0, -12); c.add(boat); const hull = new THREE.Mesh(W.rbox(3.4, .8, 1.4, .3), mat('#4fa8ff')); hull.position.y = .3; hull.castShadow = true; boat.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.8, 8), mat('#7a5236')); mast.position.y = 1.8; boat.add(mast);
      const sail = new THREE.Mesh(new THREE.ConeGeometry(1, 2.2, 3), mat('#ffffff')); sail.position.set(.4, 1.9, 0); sail.scale.z = .1; boat.add(sail); const flag = new THREE.Mesh(W.rbox(.5, .3, .04, .02), mat('#ff4f9a')); flag.position.set(.25, 3.2, 0); boat.add(flag); let trip = 0;
      const go = () => { if (trip) return; trip = .001; Sound.tone(300, .3, 'square', .03, 1); Sound.tone(300, .3, 'square', .03, 1, .4); c.say('⛵ Toot toot! Off we sail!'); c.disc('sailboat', '⛵ Tap the sailboat and it sails around!'); };
      c.tap(boat, go, -636);
      return (dt, t) => { boat.rotation.z = Math.sin(t * 1.3) * .05; flag.rotation.y = Math.sin(t * 6) * .3; if (!trip) return; trip += dt; const a = Math.min(1, trip / 10) * Math.PI * 2; boat.position.set(-636 + Math.sin(a) * 9, Math.sin(t * 1.1) * .08, -12 - (1 - Math.cos(a)) * 5); boat.rotation.y = -a; if (trip > 10) { trip = 0; boat.position.set(-636, 0, -12); boat.rotation.y = 0; } }; },
    // the friendly whale: tap its back and a big water spout shoots up
    () => { const back = c.sph(-650, -.6, -16, 2.6, '#5a6f8f', { m: { r: .5, cc: .3 } }); back.scale.set(1.8, .6, .9); const eye = c.sph(-646.2, .2, -15.2, .14, '#ffffff'); let spout = 0;
      c.tap(back, () => { spout = 1.4; api.event?.({ type: 'sea', id: 'whale' }); Sound.noise ? Sound.noise(.6, 300, 1400, .05) : Sound.whoosh(); c.say('🐳 Whoosh! The whale says hello!'); c.disc('whale', '🐳 Tap the whale and it spouts water!'); }, -650);
      return (dt, t) => { back.position.y = -.6 + Math.sin(t * .7) * .12; if (spout > 0) { spout -= dt; if (Math.random() < dt * 30) c.burst(-650.6, 1 + Math.random() * 3, -16, ['#cfefff', '#ffffff'], 2, 1.2); } }; },
    // the end of the line: a 🏠 sign that takes you home
    () => { const home = c.sign('🏠', 1, -662, 2.2, -1.4); c.tap(home, () => api.goHome(), -662); },
  ];

  // ---------- per frame ----------
  function update(dt, t, camX) {
    stream(camX);
    if (camX > EXP.x0 - 30 || camX < -10) updateGems(t); // (build 30: gems on both sides of the world)
    for (const st of S) if (st.state === 'ready' && st.updates) for (const u of st.updates) u(dt, t);
    updateFollowers(dt, t);
    if (G.sea && camX < 0) { G.sea.position.y = .02 + Math.sin(t * .8) * .04; G.foam.position.z = -8.2 + Math.sin(t * .8) * .35; }
  }
  // (build 31) the pets panel
  const palList = () => Object.keys(PALS).map(k => ({ kind: k, emoji: PAL_EMOJI[k], found: !!X.pals[k], follow: !!(X.pals[k] && X.pals[k].follow) }));
  const togglePal = k => { if (!X.pals[k]) return null; const on = !X.pals[k].follow; setFollow(k, on); return on ? `${PAL_EMOJI[k]} ${PAL_NAME[k]} is coming with you!` : `${PAL_EMOJI[k]} ${PAL_NAME[k]} will wait ${PAL_WHERE[k]}!`; };
  const palHint = k => `Somebody is waiting to be your friend ${PAL_WHERE[k]}! Tap them three times.`;
  // (build 30) after the save is loaded: hide the gems already found and bring back the friends who follow you
  function restored() {
    for (let i = gemObjs.length - 1; i >= 0; i--) if (X.gems.includes(gemObjs[i].id)) { scene.remove(gemObjs[i].s); gemObjs.splice(i, 1); }
    for (const k of Object.keys(PALS)) setFollow(k, !!(X.pals[k] && X.pals[k].follow));
    for (const k of Object.keys(PALS)) if (X.pals[k] && !X.pals[k].follow) X.pals[k] = { follow: false };
  }
  const stats = () => S.map(s => `${s.d.id}:${s.state}`).join(' ');
  return { palList, togglePal, palHint, _followers: () => Object.keys(followers), _X: () => X, update, buildNow, restored, stats, districts: DISTRICTS, gemsFound: () => X.gems.length, gemsTotal: GEMS.length, _S: S };
}
