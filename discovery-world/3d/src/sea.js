// ===================================================================
// sea.js (build 43): THE DEEP POOL and THE UNDERWATER WORLD.
//   * Next to the beach there is a Splash Pool. Tap it (or PAW) and you dive in.
//   * The deep pool is a tall tiled pool: you swim down (you sink slowly; JUMP or ▲ swims up, ◀ ▶ paddle).
//   * At the bottom of the pool a rocky tunnel leads into the underwater world: fish schools, a sea turtle, an octopus,
//     glowing jellyfish, coral that says its colour, a shipwreck with a treasure chest of pearls (count them), a clam,
//     dolphins, a big whale far away, starfish, crabs and bubbles. Tap anything to hear its name.
//   * Swim back up to the top of the pool to climb out.
// Like the house and castle rooms it is its own place far away (x 3000+). It is built the first time you dive in and is
// hidden whenever you aren't there, so it costs nothing anywhere else. All materials are the world's shared toy
// materials and the sea animals are the game's 3D toy models (no new kinds of shader).
// ===================================================================
import * as THREE from 'three';
import { toy } from './creatures.js';
import { makeToyModel } from './toy-models.js';

export const SEA = { ox: 3000, w: 128, floor: -12, top: -.6, poolB: 3008, tunnelTop: -9.3, exitX: -8 };

export function initSea(G, api) {
  const { scene, Sound, player: P } = api;
  const root = new THREE.Group(); root.name = 'sea'; root.userData.dynamic = true; root.visible = false;
  let built = false; const ups = [], taps = [];
  const say = m => api.toast(m), disc = (id, m) => api.discover(id, m);
  const box = (x, y, z, w, h, d, c, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toy(c, o)); m.position.set(x, y + h / 2, z); root.add(m); return m; };
  const ball = (x, y, z, r, c, o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), toy(c, o)); m.position.set(x, y, z); root.add(m); return m; };
  const model = (e, s, x, y, z) => { const m = makeToyModel(e); m.scale.setScalar(s); m.position.set(x, y, z); root.add(m); return m; };
  const tap = (obj, fn, x, id, y = SEA.floor) => { obj.traverse(o => { if (o.isMesh) o.userData.tap = fn; }); G.taps.push(obj); taps.push(obj); if (id) G.interact.push({ x, y, layer: 'sea', disc: id, run: fn, hintY: 1.6 }); return obj; };

  function build() {
    built = true; const X = SEA.ox, F = SEA.floor;
    // the water all around: a deep-blue backdrop, a light surface far above, a sandy floor
    box(X + SEA.w / 2, F - 10, -16, SEA.w + 40, 25, .5, '#1d5fa8', { em: '#1d5fa8', ei: .55, r: .9 });
    box(X + SEA.w / 2, 0, -8, SEA.w + 40, .2, 20, '#7fd4ff', { em: '#9fe6ff', ei: .5, r: .3 });
    box(X + SEA.w / 2, F - 8, -6, SEA.w + 10, 8, 26, '#e9cf98', { r: .95 }); // (deep enough that the camera never sees past it)
    // THE DEEP POOL (x 3000-3008): tiled walls, a ladder line of lights; the wall on the right reaches down to the tunnel
    box(X - .5, F - .6, -2, 1, 12.6, 6, '#bfe6ff', { r: .3 });
    box(SEA.poolB + .5, SEA.tunnelTop, -2, 1, -SEA.tunnelTop + .2, 6, '#bfe6ff', { r: .3 });
    for (let y = F + 1; y < 0; y += 1.5) for (const x of [X + .2, SEA.poolB - .2]) ball(x, y, -1, .12, '#fff3a6', { em: '#ffe36e', ei: 1 });
    // the rocky tunnel at the bottom of the pool
    for (let i = 0; i < 7; i++) { const r = ball(SEA.poolB - 1 + i * 1.2, SEA.tunnelTop + .4 + Math.sin(i) * .2, -1.5, .9 + (i % 3) * .2, '#7a6f8a', { r: .95 }); r.scale.set(1.2, .7, 1); }
    // coral reef that says its colour
    const COR = [['#ff6fae', 'pink'], ['#ff9a2e', 'orange'], ['#ffd23f', 'yellow'], ['#a15cff', 'purple'], ['#3cc46e', 'green']];
    COR.forEach(([c, n], i) => { const x = X + 14 + i * 3.4; const g = new THREE.Group(); g.position.set(x, F, -2.4); root.add(g);
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 1 + k * .35, 8), toy(c, { r: .6 })); b.position.set((k - 1.5) * .25, (1 + k * .35) / 2, (k % 2) * .2); b.rotation.z = (k - 1.5) * .25; g.add(b); const tip = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), toy(c, { r: .5 })); tip.position.set((k - 1.5) * .25 + Math.sin((k - 1.5) * .25) * -.5 * (1 + k * .35), 1 + k * .35, (k % 2) * .2); g.add(tip); }
      tap(g, () => { Sound.tone(600 + i * 90, .25, 'sine', .05, 1.3); api.burst(x, F + 1.6, -2.4, [c, '#ffffff'], 10, 1.6); say(`${n[0].toUpperCase() + n.slice(1)} coral!`); disc('coral', 'Tap the coral: what colour is it?'); }, x, 'coral'); });
    // fish schools swimming back and forth (tap: they scatter, and you hear what they are)
    const FISH = [['🐟', 'blue fish'], ['🐠', 'stripy fish'], ['🐡', 'puffer fish']];
    for (let s = 0; s < 4; s++) { const [e, n] = FISH[s % 3], fish = []; const cx = X + 20 + s * 24, cy = F + 3 + (s % 2) * 3.5;
      for (let k = 0; k < 6; k++) { const f = model(e, .55, cx, cy, -2.5); f.userData.o = [(k % 3) * .9, Math.floor(k / 3) * .7, (k % 2) * .5]; fish.push(f); }
      let scat = 0; fish.forEach((f, k) => tap(f, () => { scat = 1.6; Sound.tone(900, .08, 'sine', .04, 1.4); say(`${e} A school of ${n}es! Swish!`); disc('fishschool', '🐟 Fish swim together in a school!'); }, cx, k === 0 ? 'fishschool' : null, cy - 1));
      ups.push((dt, t) => { scat = Math.max(0, scat - dt); const sx = cx + Math.sin(t * .35 + s) * 7, dir = Math.cos(t * .35 + s) >= 0 ? 0 : Math.PI;
        fish.forEach((f, k) => { const o = f.userData.o, sp = scat * 3; f.position.set(sx + o[0] + Math.sin(t * 3 + k) * sp, cy + o[1] + Math.sin(t * 2 + k) * .15 + Math.cos(t * 3 + k) * sp * .5, -2.5 - o[2]); f.rotation.y = dir; }); }); }
    // the sea turtle glides slowly; tap it to hear about it
    { const tur = model('🐢', 1.6, X + 30, F + 5, -3.2); tap(tur, () => { Sound.tone(220, .4, 'sine', .05, .9); say('🐢 A sea turtle! Turtles can swim for a very long time.'); disc('seaturtle', '🐢 Find the sea turtle!'); }, X + 30, 'seaturtle', F + 3);
      ups.push((dt, t) => { tur.position.set(X + 30 + Math.sin(t * .15) * 18, F + 5 + Math.sin(t * .5) * .8, -3.2); tur.rotation.y = Math.cos(t * .15) >= 0 ? 0 : Math.PI; }); }
    // the octopus on its rock: tap it, it squirts ink and hides, then peeks out again
    { const rock = ball(X + 46, F + .3, -3, 1.4, '#7a6f8a', { r: .95 }); rock.scale.set(1.3, .7, 1); const oc = model('🐙', 1.2, X + 46, F + 1.6, -2.6); let hide = 0;
      tap(oc, () => { if (hide) return; hide = 2.5; api.burst(X + 46, F + 1.5, -2.4, ['#2b1d3d', '#4a3a5a'], 22, 2.4); Sound.noise && Sound.noise(.5, 300, 900, .04); say('🐙 Squirt! The octopus hid in a cloud of ink!'); disc('octopus', '🐙 Tap the octopus!'); }, X + 46, 'octopus');
      ups.push((dt, t) => { if (hide > 0) { hide -= dt; oc.position.y += ((hide > .8 ? F + .4 : F + 1.6) - oc.position.y) * Math.min(1, dt * 5); } else oc.position.y = F + 1.6 + Math.sin(t * 1.5) * .1; oc.rotation.z = Math.sin(t) * .1; }); }
    // glowing jellyfish drift up and down; tap to make them glow bright
    { const jel = [0, 1, 2].map(i => { const j = model('🪼', .9, X + 56 + i * 4, F + 5 + i, -3); const glow = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 10), toy('#ff9fd8', { em: '#ff6fd0', ei: .3 })); glow.material = glow.material.clone(); glow.position.set(0, 0, -.3); j.add(glow); j.userData.glow = glow; return j; });
      let bright = 0; jel.forEach((j, i) => tap(j, () => { bright = 3; Sound.twinkle ? Sound.twinkle() : Sound.chime(); say('🪼 Jellyfish glow in the dark sea!'); disc('jellyfish', '🪼 Tap the jellyfish to make them glow!'); }, X + 60, i === 0 ? 'jellyfish' : null, F + 4));
      ups.push((dt, t) => { bright = Math.max(0, bright - dt); jel.forEach((j, i) => { j.position.y = F + 5 + i + Math.sin(t * .8 + i * 2) * 1.2; j.scale.y = .9 * (1 + Math.sin(t * 3 + i) * .08); j.userData.glow.material.emissiveIntensity = .3 + bright * .6 + Math.sin(t * 2 + i) * .1; }); }); }
    // the shipwreck with a treasure chest: tap the chest, it opens, and pearls come out one by one (count them)
    { const hull = box(X + 74, F, -4.2, 9, 2.2, 3, '#7a4a2a', { r: .8 }); hull.rotation.z = .12; const mast = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 6, 10), toy('#6a3e22')); mast.position.set(X + 73, F + 3.5, -4.2); mast.rotation.z = .35; root.add(mast);
      const chest = new THREE.Group(); chest.position.set(X + 79, F, -2.2); root.add(chest); const cb = new THREE.Mesh(new THREE.BoxGeometry(1.2, .7, .8), toy('#8a5a2a', { r: .6 })); cb.position.y = .35; chest.add(cb); const lid = new THREE.Mesh(new THREE.BoxGeometry(1.24, .22, .84), toy('#ffd23f', { r: .3, m: .5 })); lid.position.y = .81; chest.add(lid);
      let open = 0, n = 0; const pearls = [];
      tap(chest, () => { if (open) return; open = .001; n = 0; say('💰 A treasure chest! Let\'s count the pearls!'); disc('seatreasure', '💰 Find the treasure in the shipwreck!'); }, X + 79, 'seatreasure');
      ups.push((dt, t) => { if (!open) return; open += dt; lid.rotation.x = -Math.min(1.2, open * 2); lid.position.z = -Math.min(.3, open * .5);
        if (n < 5 && open > .8 + n * .7) { n++; const p2 = ball(X + 79 - 1.2 + n * .45, F + 1.2, -1.6, .16, '#ffffff', { r: .1, cc: 1 }); pearls.push(p2); Sound.tone(800 + n * 90, .12, 'sine', .05, 1.2); say(`⚪ ${['', 'one', 'two', 'three', 'four', 'five'][n]}!`); if (n === 5) setTimeout(() => say('⚪ Five shiny pearls!'), 600); }
        if (open > 9) { open = 0; lid.rotation.x = 0; lid.position.z = 0; for (const q of pearls) root.remove(q); pearls.length = 0; } }); }
    // the clam opens and shows its pearl
    { const clam = new THREE.Group(); clam.position.set(X + 88, F, -2); root.add(clam); const bot = new THREE.Mesh(new THREE.SphereGeometry(.6, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toy('#ffd1ec', { r: .5 })); bot.rotation.x = Math.PI; bot.position.y = .4; clam.add(bot);
      const top = new THREE.Group(); top.position.set(0, .4, -.55); clam.add(top); const tm = new THREE.Mesh(new THREE.SphereGeometry(.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toy('#ffb8dc', { r: .5 })); tm.position.z = .55; top.add(tm); const pearl = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), toy('#ffffff', { cc: 1 })); pearl.position.y = .5; clam.add(pearl); let op = 0;
      tap(clam, () => { op = 3; Sound.chime(); say('🐚 The clam opened! A shiny pearl!'); disc('clam', '🐚 Tap the clam!'); }, X + 88, 'clam');
      ups.push(dt => { op = Math.max(0, op - dt); top.rotation.x += ((op > 0 ? -.9 : 0) - top.rotation.x) * Math.min(1, dt * 4); }); }
    // dolphins swim loops; a big whale glides far behind; starfish and crabs on the sand
    { const dol = [0, 1].map(i => model('🐬', 1.3, X + 100, F + 6, -4)); tap(dol[0], () => { Sound.tone(1400, .12, 'sine', .04, 1.3); Sound.tone(1700, .1, 'sine', .04, 1.2, .12); say('🐬 Eee eee! Dolphins say hello!'); disc('seadolphins'); }, X + 100, 'seadolphins', F + 4);
      ups.push((dt, t) => dol.forEach((d, i) => { const a = t * .7 + i * Math.PI; d.position.set(X + 100 + Math.cos(a) * 6, F + 6 + Math.sin(a * 2) * 1.5, -4 - i); d.rotation.y = Math.sin(a) > 0 ? Math.PI : 0; })); }
    { const wh = model('🐳', 6, X + 60, F + 8, -13); ups.push((dt, t) => { wh.position.x = X + 64 + Math.sin(t * .05) * 40; wh.rotation.y = Math.cos(t * .05) >= 0 ? 0 : Math.PI; }); }
    for (const [x, e, n] of [[X + 22, '⭐', 'starfish'], [X + 38, '🦀', 'crab'], [X + 66, '⭐', 'starfish'], [X + 94, '🦐', 'shrimp'], [X + 110, '🦀', 'crab']]) { const m = model(e, .7, x, F + .35, -1.8); tap(m, () => { m.userData.hop = .5; Sound.pop ? Sound.pop() : Sound.click(); say(`${e} A ${n}!`); disc('seafloor', '⭐ Find the animals on the sea floor!'); }, x, 'seafloor'); ups.push(dt => { m.userData.hop = Math.max(0, (m.userData.hop || 0) - dt); m.position.y = F + .35 + Math.sin(m.userData.hop * 6) * m.userData.hop * .6; }); }
    // a back wall of rocks and seaweed at the far end
    for (let i = 0; i < 26; i++) { const x = X + 9 + i * 4.6; const w = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, 2 + (i % 4), 6), toy('#3cc46e', { r: .7 })); w.position.set(x, F + (2 + (i % 4)) / 2, -5 - (i % 3)); w.userData.ph = i; root.add(w); ups.push((dt, t) => { w.rotation.z = Math.sin(t * 1.2 + w.userData.ph) * .15; }); }
    box(X + SEA.w + .5, F - .6, -2, 1, 13, 8, '#7a6f8a', { r: .95 });
    // bubbles rising from the sand (the shared particle sparkles)
    ups.push(() => { if (Math.random() < .08) api.burst(P.x + (Math.random() - .5) * 10, F + .5, -2 - Math.random() * 2, ['#cfefff', '#ffffff'], 1, .4); });
    root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    scene.add(root); api.compile && api.compile(root);
  }

  // ---------- in and out ----------
  function dive() {
    if (P.ride || P.layer !== '') return; if (!built) build();
    api.flash(); P.layer = 'sea'; P.x = SEA.ox + 4; lastX = P.x; /* (a fresh dive starts in the pool: forget where you were last time) */ P.y = -.8; P.z = 0; P.vx = 0; P.vy = -2; P.grounded = false; root.visible = true;
    Sound.tone(300, .3, 'sine', .05, .6); Sound.whoosh && Sound.whoosh(); say('Splash! Swim down to the bottom of the deep pool!'); disc('deeppool', 'Dive into the deep pool!'); api.snap();
  }
  function climbOut() { api.flash(); P.layer = ''; P.x = SEA.exitX; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.swim = false; root.visible = false; Sound.tone(520, .2, 'triangle', .05, 1.2); say('💦 Out of the pool! Drip drip!'); api.snap(); }
  let lastX = 0;
  function update(dt, t) {
    if (P.layer !== 'sea') { if (root.visible) root.visible = false; return; }
    root.visible = true;
    // walls: the pool's right-hand wall only has an opening at the bottom (the tunnel)
    if (Math.abs(P.x - lastX) > 2) lastX = P.x; // (a jump to another place is not swimming through the wall)
    const wall = SEA.poolB; if (P.y > SEA.tunnelTop - .2 && ((lastX <= wall && P.x > wall) || (lastX >= wall && P.x < wall))) { P.x = lastX <= wall ? wall - .05 : wall + .05; P.vx = 0; }
    if (P.x > wall && P.y > SEA.top) { P.y = SEA.top; if (P.vy > 0) P.vy = 0; } // (out in the sea the water goes on above you: you can't climb out there)
    if (P.x > wall + 1 && lastX <= wall + 1) { say('🐠 The underwater world! So many sea creatures!'); disc('underwater', '🐠 Swim through the tunnel at the bottom of the pool into the underwater world!'); }
    if (P.x <= wall && P.y > -.15 && P.vy > 0) { climbOut(); return; }
    lastX = P.x;
    for (const u of ups) u(dt, t);
  }
  // the Splash Pool on the beach side of the Playhouse
  { const X0 = -12, X1 = -4, z = -3.4, cx = (X0 + X1) / 2;
    const rim = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 + 1, .35, 4.2), toy('#ffffff', { r: .4 })); rim.position.set(cx, .17, z); scene.add(rim);
    const water = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - .3, .1, 3.5), toy('#4fc3f7', { r: .1, cc: .8, em: '#39a9e6', ei: .25 })); water.position.set(cx, .33, z); scene.add(water);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, .15, .7), toy('#ff6fae', { r: .5 })); board.position.set(X1 - .4, .8, z + 1.6); scene.add(board);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .8, 8), toy('#ffffff')); leg.position.set(X1 + .5, .4, z + 1.6); scene.add(leg);
    for (const k of [water, rim, board]) { k.userData.tap = dive; G.taps.push(k); }
    G.interact.push({ x: cx, y: 0, layer: '', disc: 'deeppool', run: dive, hintY: 1.2 });
    G.seaWater = water; }
  return { update, dive, climbOut, isBuilt: () => built, root };
}
