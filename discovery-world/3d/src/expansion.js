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

export const EXP = { x0: 424, x1: 902 };
export const DISTRICTS = [
  { id: 'trail', icon: '🌉', name: 'Adventure Trail', x0: 428, x1: 548, home: 436 },
  { id: 'toytown', icon: '🧸', name: 'Toy Town', x0: 548, x1: 668, home: 554 },
  { id: 'labgarden', icon: '🔬', name: 'Lab Gardens', x0: 668, x1: 788, home: 674 },
  { id: 'artplaza', icon: '🖍️', name: 'Art Plaza', x0: 788, x1: 904, home: 794 },
];
const GEMS = [['g1', 484.5, 4.7], ['g2', 540, .9], ['g3', 600, 6.2], ['g4', 644, 2.8], ['g5', 690, 1], ['g6', 756, 1.1], ['g7', 830, 2.7], ['g8', 898, .9]];
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
const emoji = (e, s = 1, shadow) => { const sp = new THREE.Sprite(emojiMat(e, shadow)); sp.scale.setScalar(s); return sp; };

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
  // signposts with each neighbourhood's picture (and an arrow to the next one)
  for (const d of DISTRICTS) {
    const g = new THREE.Group(); g.position.set(d.x0 + 4, 0, -2.6); scene.add(g);
    const post = new THREE.Mesh(W.rbox(.22, 3.2, .22, .08), mat('#9a6a3a', { r: .8, cc: 0 })); post.position.y = 1.6; post.castShadow = true; g.add(post);
    const board = new THREE.Mesh(W.rbox(1.9, 1.5, .18, .2), mat('#ffffff', { r: .5, cc: .2 })); board.position.y = 3.1; board.castShadow = true; g.add(board);
    const pic = emoji(d.icon, 1.25); pic.position.set(0, 3.1, .2); g.add(pic);
    const ar = emoji('➡️', .6); ar.position.set(0, 2.05, .2); g.add(ar);
  }
  // the rainbow gate at 422 is now a gateway: a sign with the new places
  { const s = emoji('🌉', 1.1); s.position.set(426, 3.4, -1.5); scene.add(s); }

  // ---------- streaming ----------
  const S = DISTRICTS.map(d => ({ d, state: 'none', g: null, taps: [], inter: [], parts: null, step: 0, live: null, onceDone: false }));
  function makeCtx(st) {
    const g = st.g;
    const P2 = (o = {}) => ({ ...o, parent: g });
    const ctx = {
      g, mat, say, disc, Sound, P, world, X, emoji, burst: api.burst,
      block: (x, y, z, w, h, d, c, o) => W.block(x, y, z, w, h, d, c, P2(o)),
      cyl: (x, y, z, r1, r2, h, c, o) => W.cyl(x, y, z, r1, r2, h, c, P2(o)),
      sph: (x, y, z, r, c, o) => W.sph(x, y, z, r, c, P2(o)),
      add: o => { g.add(o); return o; },
      sprite: (e, s, x, y, z, shadow) => { const sp = emoji(e, s, shadow); sp.position.set(x, y, z); g.add(sp); return sp; },
      // a tappable thing (also usable with the PAW button when you stand next to it)
      tap: (obj, fn, pawX) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); st.taps.push(obj); if (pawX != null) { const it = { x: pawX, y: 0, layer: '', run: fn, hintY: 2.4 }; G.interact.push(it); st.inter.push(it); } return obj; },
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
    Promise.resolve(api.compile(st.g)).catch(() => { }).then(() => { if (st.state !== 'compiling') return; scene.add(st.g); st.state = 'ready'; });
  }
  function unload(st) {
    // (shapes from the world's shared cache and sprite shapes are kept; this neighbourhood's own shapes and pictures are freed)
    if (st.g) { scene.remove(st.g); st.g.traverse(o => { if (o.isSprite) return; if (o.geometry && !W.isShared(o.geometry)) o.geometry.dispose(); for (const m of [].concat(o.material || [])) if (m && !W.isSharedMat(m)) { m.map && m.map.dispose(); m.dispose(); } }); }
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

  // ---------- gems (8 hidden around the new neighbourhoods; walk into one to collect it) ----------
  const gemObjs = [];
  for (const [id, x, y] of GEMS) { if (X.gems.includes(id)) continue; const s = emoji('💎', .8); s.position.set(x, y, 0); scene.add(s); gemObjs.push({ id, x, y, s }); }
  function updateGems(t) {
    for (let i = gemObjs.length - 1; i >= 0; i--) { const gm = gemObjs[i]; gm.s.position.y = gm.y + Math.sin(t * 3 + i) * .12; gm.s.material.rotation = Math.sin(t * 2 + i) * .2;
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
        c.tap(g, () => { if (want) return; want = 1; Sound.chime(); X.chests++; c.disc('chest', '🎁 A treasure chest! What is inside?'); const e = pick(toys); prize = emoji(e, .01); prize.position.set(0, .9, 0); g.add(prize); pt = 0; c.say(`${e} A surprise!`); c.burst(x, 1.4, -2.2, ['#ffd23f', '#fff', '#ff9fd8'], 18, 3); api.saveSoon(); }, x);
        return (dt) => { open += ((want ? 1 : 0) - open) * Math.min(1, dt * 6); lid.rotation.x = -open * 1.9; if (prize) { pt += dt; prize.position.y = .9 + Math.min(1, pt) * 1.2; prize.scale.setScalar(Math.min(1, pt * 2) * 1.1); if (pt > 4) { g.remove(prize); prize = null; want = 0; } } };
      }).reduce((a, f) => (dt => { a && a(dt); f(dt); })); },
    // a crystal cave: walk through, tap the crystals to make them glow
    () => { c.block(539, 0, -4.4, 14, 4.2, 1.2, '#6a5a7a', { r: .5 }); c.block(539, 3.7, -2.6, 14, .7, 3.6, '#7d6a8f', { r: .4 }); // (a back wall and an overhanging roof: the camera can still see you inside)
      for (const x of [532.5, 545.5]) c.block(x, 0, -2.8, 1, 3.8, 2.4, '#6a5a7a', { r: .4 });
      for (let x = 533.5; x < 545; x += 1.6) { const st = new THREE.Mesh(new THREE.ConeGeometry(.22, .8 + (x % 3) * .2, 8), c.mat('#8a7a9a', { r: .9 })); st.rotation.x = Math.PI; st.position.set(x, 3.3, -1.4 - (x % 2)); c.add(st); }
      const crystals = [534, 536.5, 539, 541.5, 544].map((x, i) => { const m = mat(RB[i + 2], { r: .2, em: RB[i + 2], ei: .05 }).clone(); const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.45, 0), m); cr.scale.y = 1.8; cr.position.set(x, 1.1 + (i % 2) * .5, -2.4); c.add(cr); return { cr, m, on: false, x }; });
      for (const k of crystals) c.tap(k.cr, () => { k.on = !k.on; k.m.emissiveIntensity = k.on ? 1.6 : .05; Sound.tone(NOTE[crystals.indexOf(k) + 2] * 2, .5, 'sine', .05, 1); c.burst(k.x, 1.5, -2.2, [k.m.color.getStyle(), '#fff'], 8, 2);
        if (crystals.every(q => q.on)) { c.disc('cave', '✨ The whole cave is glowing!'); c.say('✨ The whole cave is glowing! You lit every crystal!'); } else c.say(k.on ? '💎 Glow!' : '💤 Sleepy crystal.'); }, k.x);
      return (dt, t) => { for (const k of crystals) k.cr.rotation.y = t * .6 + k.x; if (P.layer === '' && P.x > 533 && P.x < 545) c.disc('cavewalk', '🪨 A secret crystal cave! Tap the crystals!'); }; },
  ];

  // =================== 🧸 TOY TOWN ===================
  builders.toytown = c => [
    // toy houses behind
    () => { for (let i = 0; i < 9; i++) { const x = 554 + i * 13; const col = RB[i % 8]; c.block(x, 0, -8.5, 5, 4 + (i % 3), 4, col, { r: .4 }); const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), mat(RB[(i + 3) % 8])); roof.position.set(x, 4 + (i % 3) + 1.2, -8.5); roof.rotation.y = Math.PI / 4; roof.castShadow = true; c.add(roof); } },
    // a musical floor: every tile plays a note
    () => { const tiles = NOTE.map((f, i) => { const m = mat(RB[i], { r: .3, em: RB[i], ei: .05 }).clone(); const t = new THREE.Mesh(W.rbox(1.9, .08, 3, .04), m); t.position.set(557 + i * 2, .04, 0); t.receiveShadow = true; c.add(t); return { m, x: 557 + i * 2 }; });
      let last = -1; return dt => { for (const k of tiles) k.m.emissiveIntensity = Math.max(.05, k.m.emissiveIntensity - dt * 2.5);
        const i = P.layer === '' && P.y < .4 ? Math.floor((P.x - 556) / 2) : -1;
        if (i >= 0 && i < 8 && i !== last) { Sound.tone(NOTE[i], .4, 'triangle', .07, 1); tiles[i].m.emissiveIntensity = 1.4; c.burst(tiles[i].x, .3, 0, [RB[i], '#fff'], 4, 1.2); c.disc('musicfloor', '🎵 A musical floor! Every step plays a note!'); }
        last = i >= 0 && i < 8 ? i : -1; }; },
    // the block tower: press the button, a block drops; too tall and it tumbles down!
    () => { c.block(582, 0, -2.2, 3, .2, 3, '#ffffff', { r: .1 }); const btn = c.cyl(578.6, 0, -1.4, .45, .5, .5, '#ff4f9a', { m: { em: '#ff4f9a', ei: .3 } });
      const blocks = []; let tumble = 0;
      c.tap(btn, () => { if (tumble) return; const b = new THREE.Mesh(W.rbox(1.4, .7, 1.4, .12), mat(RB[blocks.length % 8], { r: .4 })); b.castShadow = true; b.position.set(582 + (Math.random() - .5) * .3, 9, -2.2); b.userData = { vy: 0, top: .2 + blocks.length * .7 }; c.add(b); blocks.push(b); Sound.click(); c.disc('tower', '🧱 Press the button to drop blocks. Build it tall!'); }, 578.6);
      return (dt, t) => { for (const b of blocks) { const u = b.userData; if (tumble) { b.position.x += u.vx * dt; b.position.y = Math.max(.35, b.position.y + u.vy * dt); u.vy -= 20 * dt; b.rotation.z += u.vx * dt * .5; continue; } if (b.position.y > u.top + .35) { u.vy -= 25 * dt; b.position.y = Math.max(u.top + .35, b.position.y + u.vy * dt); if (b.position.y <= u.top + .35) { Sound.tone(300 + blocks.indexOf(b) * 40, .1, 'sine', .06, .8); if (blocks.length >= 7 && b === blocks[6]) { tumble = 1; for (const q of blocks) { q.userData.vx = (Math.random() - .5) * 6; q.userData.vy = 4 + Math.random() * 4; } Sound.giggle(); c.say('💥 Wobble wobble... CRASH! Build it again!'); c.disc('towercrash'); } } } else b.rotation.z = Math.sin(t * 3 + blocks.indexOf(b)) * .02 * blocks.length; }
        if (tumble && (tumble += dt) > 3.5) { for (const b of blocks) c.g.remove(b); blocks.length = 0; tumble = 0; } }; },
    // the bounce park: three trampolines, the last one is super bouncy (a gem floats up high)
    () => { for (const [x, b] of [[592, 11], [597, 12.5], [602, 14]]) { c.cyl(x, 0, 0, .95, 1.05, .35, '#2fa8ff'); c.cyl(x, .35, 0, .85, .85, .06, '#9fe6ff', { m: { em: '#2fa8ff', ei: .3 } }); c.plat(x - .95, x + .95, .41, { pad: true, step: true, bounce: b, onLand: () => c.disc('bouncepark', '🦘 Boing! Bounce from one to the next!') }); } },
    // the ball cannon: tap it and a ball flies into the hoop. Swish!
    () => { const can = new THREE.Group(); can.position.set(616, 0, -2); c.add(can); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, 1.6, 20), mat('#5b6cff', { r: .4 })); barrel.rotation.z = -.9; barrel.position.y = 1; barrel.castShadow = true; can.add(barrel); for (const s of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .2, 20), mat('#ffd23f')); wh.rotation.x = Math.PI / 2; wh.position.set(0, .45, s * .45); can.add(wh); }
      c.cyl(625, 0, -2, .1, .1, 3.6, '#ffffff'); const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .07, 10, 30), mat('#ff4f9a')); ring.rotation.x = Math.PI / 2; ring.position.set(624.4, 3.5, -2); c.add(ring); c.block(625.15, 3.4, -2, .1, 1.4, 1.6, '#ffffff', { r: .05 });
      const balls = []; let swish = 0;
      c.tap(can, () => { const b = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 12), mat(pick(RB))); b.position.set(616.6, 1.6, -2); b.userData = { t: 0 }; c.add(b); balls.push(b); Sound.boing(); }, 616);
      return dt => { for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i], u = b.userData; u.t += dt; const k = Math.min(1, u.t / 1.1); b.position.set(616.6 + (624.4 - 616.6) * k, 1.6 + Math.sin(k * Math.PI) * 3.4 + (3.6 - 1.6) * k, -2); if (k >= 1) { b.position.y -= (u.t - 1.1) * 6; if (!u.s) { u.s = 1; swish++; Sound.chime(); c.burst(624.4, 3.5, -2, ['#ffd23f', '#fff'], 14, 2.5); c.say(swish % 5 === 0 ? `🏀 Swish! ${swish} baskets!` : '🏀 Swish!'); c.disc('cannon', '🏀 Tap the cannon to shoot a ball into the hoop!'); } if (u.t > 1.6) { c.g.remove(b); balls.splice(i, 1); } } } }; },
    // a seesaw (it tips toward you) with a gem above the high end
    () => { c.cyl(638, 0, -.2, .25, .35, .7, '#ff9a2e'); const plank = new THREE.Mesh(W.rbox(6, .18, 1.2, .08), mat('#ffc21c', { r: .5 })); plank.position.set(638, .8, -.2); plank.castShadow = true; c.add(plank);
      return dt => { const want = P.layer === '' && Math.abs(P.x - 638) < 3 && P.y < 1.5 ? Math.sign(P.x - 638) * -.28 : 0; plank.rotation.z += (want - plank.rotation.z) * Math.min(1, dt * 3); if (want) c.disc('seesaw', '🎢 A seesaw! It tips when you stand on it.'); }; },
    // catch the balloons floating up from the basket
    () => { c.cyl(656, 0, -2.4, .9, .7, .8, '#c87a2a', { r: .8 }); const list = []; const spawn = b => { b.position.set(654.5 + Math.random() * 3, .8, -2.4 + Math.random() * .8); b.material = emojiMat('🎈'); b.material.rotation = 0; b.userData.v = .8 + Math.random() * .6; };
      for (let i = 0; i < 6; i++) { const b = emoji('🎈', 1); spawn(b); b.position.y = Math.random() * 8; c.add(b); list.push(b); c.tap(b, () => { if (b.userData.pop) return; b.userData.pop = 1; Sound.pop ? Sound.pop() : Sound.click(); X.balloons++; c.burst(b.position.x, b.position.y, b.position.z, RB, 10, 2.5); c.disc('balloons', '🎈 Pop! Catch the balloons as they float up!'); if (X.balloons % 10 === 0) c.say(`🎈 ${X.balloons} balloons caught!`); setTimeout(() => { b.userData.pop = 0; spawn(b); }, 400); b.position.y = -20; api.saveSoon(); }); }
      return dt => { for (const b of list) { if (b.userData.pop) continue; b.position.y += b.userData.v * dt; b.position.x += Math.sin(b.position.y * 1.3) * dt * .3; if (b.position.y > 10) spawn(b); } }; },
  ];

  // =================== 🔬 LAB GARDENS ===================
  builders.labgarden = c => [
    // greenhouse domes behind
    () => { for (const x of [682, 724, 766]) { const d = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d9f6ff', { r: .1, cc: .6 })); d.position.set(x, 0, -11); d.scale.y = .8; c.add(d); } },
    // a colour-changing pond: tap the water, it changes colour, a fish jumps
    () => { const cols = [['blue', '#3b82f6'], ['pink', '#ff7ac8'], ['green', '#3cc45a'], ['purple', '#9b5cf6'], ['orange', '#ff9a1f'], ['yellow', '#ffd23f']]; const m = mat('#3b82f6', { r: .15, cc: .6 }).clone();
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .08, 40), m); pond.position.set(684, .03, -3.6); c.add(pond); const rim = new THREE.Mesh(new THREE.TorusGeometry(3, .25, 10, 40), mat('#b5ab9e', { r: .8 })); rim.rotation.x = Math.PI / 2; rim.position.set(684, .1, -3.6); c.add(rim);
      const fish = c.sprite('🐟', .9, 684, -1, -3.6); let k = 0, jt = 9;
      c.tap(pond, () => { k = (k + 1) % cols.length; m.color.set(cols[k][1]); c.say(`🎨 The pond is ${cols[k][0]}!`); jt = 0; Sound.tone(500 + k * 60, .3, 'sine', .05, 1.3); c.burst(684, .4, -3.6, [cols[k][1], '#fff'], 12, 2); c.disc('pond', '🎨 A magic pond! Tap it to change its colour!'); }, 684);
      return dt => { jt += dt; const j = Math.min(1, jt / 1.2); fish.position.set(682.5 + j * 3, j < 1 ? Math.sin(j * Math.PI) * 2 : -1, -3.6); }; },
    // the bubble fountain
    () => { c.cyl(698, 0, -2.2, .8, 1, .7, '#9fe6ff'); const sp = c.cyl(698, .7, -2.2, .15, .2, 1, '#ffffff'); const bubbles = [];
      c.tap(sp.parent ? sp : sp, () => { for (let i = 0; i < 10; i++) { const b = c.sprite('🫧', .5 + Math.random() * .5, 698, 1.8, -2.2); b.userData = { vx: (Math.random() - .5) * 1.6, vy: 1 + Math.random() * 1.5, t: 0 }; bubbles.push(b); } Sound.whoosh ? Sound.whoosh() : Sound.click(); c.say('🫧 Bubbles!'); c.disc('fountain', '🫧 The bubble fountain! Tap it for bubbles!'); }, 698);
      return dt => { for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i], u = b.userData; u.t += dt; b.position.x += u.vx * dt; b.position.y += u.vy * dt; if (u.t > 4) { c.g.remove(b); bubbles.splice(i, 1); } } }; },
    // light and shadow: tap the lamp and a new shadow animal appears on the wall
    () => { c.block(712, 0, -4.4, 6, 4.2, .3, '#fffaf0', { r: .1 }); const lamp = new THREE.Group(); lamp.position.set(709, 0, -1.4); c.add(lamp); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 10), mat('#5b6cff')); pole.position.y = 1.1; lamp.add(pole); const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 12), mat('#fff6b0', { em: '#ffe36e', ei: 1 })); head.position.y = 2.3; lamp.add(head);
      const animals = [['🐰', 'bunny'], ['🐦', 'bird'], ['🐶', 'dog'], ['🦋', 'butterfly'], ['🐢', 'turtle'], ['🦖', 'dinosaur']]; let k = -1; const sh = c.sprite('🐰', 2.6, 712.4, 2.2, -4.2, true); sh.visible = false;
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
    () => { c.cyl(762, 0, -3.2, .2, .25, 4.6, '#ffc21c'); c.block(764, 4.4, -3.2, 4.4, .35, .35, '#ffc21c', { r: .1 }); const mg = c.sprite('🧲', 1.1, 765.6, 3.4, -3.2); const can = c.sprite('🥫', .9, 765.6, .45, -3.2), apple = c.sprite('🍎', .9, 767.4, .45, -3.2); let t0 = -1;
      const go = () => { if (t0 >= 0) return; t0 = 0; Sound.tone(200, .4, 'sawtooth', .02, 1.5); c.disc('magnet2', '🧲 The magnet crane! Metal things jump up to it!'); };
      c.tap(mg, go, 765.6); c.tap(can, go); c.tap(apple, () => { c.say('🍎 The apple does not stick. It is not metal.'); Sound.click(); });
      return dt => { if (t0 < 0) return; t0 += dt; const down = t0 < 1 ? t0 : t0 < 3 ? 1 : Math.max(0, 4 - t0); mg.position.y = 3.4 - down * 1.6; can.position.y = t0 > 1 && t0 < 4 ? mg.position.y - .8 : .45; if (t0 > 1 && t0 - dt <= 1) { Sound.tone(900, .15, 'square', .03, 1); c.say('🧲 Click! The can is metal, so it sticks!'); } if (t0 > 4.2) t0 = -1; }; },
  ];

  // =================== 🖍️ ART PLAZA ===================
  builders.artplaza = c => [
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
      c.tap(drum, () => { Sound.tone(110, .3, 'sine', .12, .5); Sound.noise && Sound.noise(.12, 200, 900, .05); drum.scale.y = .9; setTimeout(() => { drum.scale.y = 1; }, 120); c.disc('drum', '🥁 Boom! The big drum!'); }, 834);
      [0, 1, 2].forEach(i => { const b = c.sph(838.5 + i * 1.1, 2.4, -2.4, .35, '#ffd23f', { m: { m: .6 } }); c.cyl(838.5 + i * 1.1, 0, -2.4, .05, .05, 2.1, '#9a9a9a'); c.tap(b, () => { Sound.bell ? Sound.bell([784, 988, 1175][i], .06) : Sound.tone(880, .8, 'sine', .05, 1); c.disc('bells', '🔔 Ding! Tap the bells!'); }); });
      NOTE.forEach((f, i) => { const bar = c.block(843 + i * .55, .8 - i * .03, -2.2, .45, .12, 1.4 - i * .08, RB[i], { r: .04 }); c.tap(bar, () => { Sound.tone(f * 2, .5, 'triangle', .07, 1); c.burst(843 + i * .55, 1.1, -2.2, [RB[i], '#fff'], 4, 1.2); c.disc('xylo2', '🎶 A rainbow xylophone!'); }); });
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
      c.tap(bowl, () => { if (eat) return; eat = .001; c.say('🍪 Yum yum! Thank you for feeding me!'); c.disc('feedfriend', '🍪 Tap the bowl to feed your friend!'); }, 879);
      return (dt, t) => { pet = Math.max(0, pet - dt); f.rotation.z = Math.sin(t * 20) * .08 * pet; body.scale.y = 1 + Math.sin(t * 3) * .03; if (eat) { eat += dt; const k = eat < 1 ? eat : eat < 3 ? 1 : Math.max(0, 4 - eat); f.position.x = 876 + k * 2.2; f.position.y = Math.abs(Math.sin(eat * 8)) * .2 * (eat < 1 || eat > 3 ? 1 : 0); if (eat > 1 && eat < 3 && Math.random() < .1) { Sound.tone(300, .06, 'square', .02, .7); c.burst(879, 1, -1.8, ['#ff7ad9'], 2, 1); } if (eat > 4) { eat = 0; f.position.set(876, 0, -2.2); } } }; },
    // hide and seek: the little friend hides behind one of the bushes
    () => { const bushes = [888, 891.5, 895].map(x => { const b = c.sph(x, .9, -2.6, 1, '#4caf50', { m: { r: .9 } }); b.scale.set(1.1, .9, .8); return b; }); const kid = c.sprite('🐣', 1.1, 888, -2, -3.4); let hide = rnd(3), found = 0;
      bushes.forEach((b, i) => c.tap(b, () => { b.userData.w = 1; Sound.tone(300 + i * 80, .1, 'sine', .04, 1); if (found) return; if (i === hide) { found = 1; kid.position.set(bushes[i].position.x, 2.2, -3); Sound.giggle(); c.say('🐣 Peekaboo! You found me!'); c.disc('hideseek', '🐣 Hide and seek! Tap the bushes to find the chick!'); setTimeout(() => { found = 0; hide = rnd(3); kid.position.y = -2; c.say('🙈 I am hiding again!'); }, 3000); } else c.say(pick(['🌿 Not here!', '🌿 Rustle rustle... nobody!'])); }));
      return (dt, t) => { for (const b of bushes) { b.userData.w = Math.max(0, (b.userData.w || 0) - dt * 2); b.rotation.z = Math.sin(t * 25) * .1 * b.userData.w; } if (found) kid.position.y = 2.2 + Math.abs(Math.sin(t * 6)) * .3; }; },
    // the rainbow portal home
    () => { for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.2 - i * .22, .14, 10, 36), mat(RB[i], { em: RB[i], ei: .2 })); r.position.set(900, 2.2, -1.5); r.rotation.y = Math.PI / 2; c.add(r); }
      const hm = c.sprite('🏠', 1.2, 900, 2.2, -1.4); c.tap(hm, () => api.goHome(), 900); },
  ];

  // ---------- per frame ----------
  function update(dt, t, camX) {
    stream(camX);
    if (camX > EXP.x0 - 30) updateGems(t);
    for (const st of S) if (st.state === 'ready' && st.updates) for (const u of st.updates) u(dt, t);
  }
  const stats = () => S.map(s => `${s.d.id}:${s.state}`).join(' ');
  return { update, buildNow, stats, districts: DISTRICTS, gemsFound: () => X.gems.length, gemsTotal: GEMS.length, _S: S };
}
