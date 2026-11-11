// ===================================================================
// friends.js: 3D build 5.
//  • PET WORKSHOP (underground Cave Hall): tap the four big buttons to
//    choose colour, ears, tail and pattern; pull the lever, an egg wobbles
//    and hatches, and your pet follows you everywhere (tap it for a trick).
//  • FRIENDLY CRITTERS who wave when you come near and do something fun
//    when tapped: Balloon Bear (gives you a balloon that floats with you),
//    Painter Bunny (paints a picture on the big wall), Drummer Frog,
//    Dancing Penguin and Sleepy Owl.
//  • Floating magic sparkles in the air.
// ===================================================================
import * as THREE from 'three';
import { toy, ball, face, starGeometry } from './creatures.js';
import { plushNormal } from './nature.js';
import { plush, bipedSpec, quadSpec, personSpec } from './critterkit.js';
import { NOTES } from './audio.js';

export const PET_COLS = ['#ff8fd0', '#8fd8ff', '#ffd45e', '#a98cff', '#7be08a', '#ff9a6b', '#ffffff'];
export const EARS = ['bunny', 'cat', 'bear', 'antennae'], TAILS = ['puff', 'curly', 'star'], PATS = ['plain', 'spots', 'belly'];
const BALLOON_COLS = ['#ff4f9a', '#ffd23f', '#3d9bff', '#3cc46e', '#a15cff'];

// ---------- a pet built from its recipe ----------
export function buildPet(rec, scale = 1) {
  // build 14: a sculpted plush pet on a skeleton (critterkit.js)
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const c = PET_COLS[rec.col % PET_COLS.length], e = EARS[rec.ears % EARS.length], t = TAILS[rec.tail % TAILS.length], pat = PATS[rec.pat % PATS.length];
  const spots = pat === 'spots' ? (s2, hy) => [[.18, .7, .2], [-.2, .55, .18], [.1, .45, -.25], [-.15, .75, -.2], [.12, hy + .15, .2]].map(([x, y, z]) => ({ type: 'sphere', c: s2([x, y, z]), r: .07 * .55, color: '#ffffff', soft: .01 })) : null;
  const k = plush(body, bipedSpec({ scale: .55, body: c, belly: pat === 'belly' ? '#fff6ee' : c, muzzle: '#fff6ee', ears: { bunny: 'long', cat: 'cat', bear: 'round', antennae: 'antennae' }[e], snout: 0, nose: '#ff6fae', tail: t === 'star' ? 'none' : t, tailCol: '#fff6ee', iris: '#7a3fd0', voxel: .03, extraPaints: spots }),
    { lid: c, iris: '#7a3fd0', accessories: (B, at) => { if (t === 'star') { const st = new THREE.Mesh(starGeometry(.08, .04, .03, .02, 2), toy('#ffd84a', { em: '#ffb000', ei: .4 })); at(B.tail, st, 0, .3, -.2); } } });
  root.scale.setScalar(scale / .9 * 1.0);
  return { root, body, ears: [k.B.earL, k.B.earR], tail: k.B.tail, feet: [k.B.footL, k.B.footR], tick: k.tick };
}

export const MAXPETS = 5;
export function initFriends(G, api) {
  const { scene, Sound, burst, discover, toast, player, world } = api;
  const add = o => { scene.add(o); return o; };
  const M = (c, o) => toy(c, o);
  const UGF = api.UG.floor;
  const fluffy = (c, o) => { const m = toy(c, { r: .6, cc: .2, sheen: 1, sheenColor: '#ffffff', ...o }); m.normalMap = plushNormal(); m.normalScale.set(.35, .35); return m; };

  // =================== PET WORKSHOP (underground, left end of the Cave Hall) ===================
  const PM = { x: 6.2, z: -2.6 };
  const mach = new THREE.Group(); mach.position.set(PM.x, UGF, PM.z); add(mach);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 1.1, 32), M('#a15cff')); base.position.y = .55; base.castShadow = true; base.receiveShadow = true; mach.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#e6f8ff', transparent: true, opacity: .32, roughness: .03, clearcoat: 1, iridescence: .6, depthWrite: false }));
  dome.position.y = 1.1; mach.add(dome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.48, .09, 10, 40), M('#ffd84a')); rim.rotation.x = Math.PI / 2; rim.position.y = 1.12; mach.add(rim);
  const sign = new THREE.Mesh(new THREE.TorusGeometry(.35, .07, 10, 28), M('#ff6fae', { em: '#ff6fae', ei: .4 })); sign.position.set(0, 3.1, 0); mach.add(sign);
  const heartIn = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), M('#ff6fae', { em: '#ff6fae', ei: .6 })); heartIn.position.set(0, 3.1, 0); mach.add(heartIn);
  const preview = new THREE.Group(); preview.position.y = 1.15; mach.add(preview);
  const glowL = new THREE.PointLight('#ffd9f4', 8, 6, 1.6); glowL.position.set(0, 2.2, .8); mach.add(glowL);
  // four big buttons in front, each showing what it changes
  const BTN = [['col', '#ff6fae'], ['ears', '#7fd8ff'], ['tail', '#ffd84a'], ['pat', '#9ff7c8']];
  const btns = BTN.map(([part, c], i) => {
    const g = new THREE.Group(); g.position.set(PM.x - 1.95 + i * 1.3, UGF, -1.15); add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .9, 12), M('#ffffff')); post.position.y = .45; post.castShadow = true; g.add(post);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .18, 24), M(c, { em: c, ei: .3 })); cap.position.y = 1.0; cap.rotation.x = .5; cap.castShadow = true; g.add(cap);
    const icon = part === 'col' ? new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), M('#ffffff')) : part === 'ears' ? new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 8), M('#ffffff')) : part === 'tail' ? new THREE.Mesh(starGeometry(.13, .06, .04, .02, 1), M('#ffffff')) : new THREE.Mesh(new THREE.TorusGeometry(.09, .035, 8, 16), M('#ffffff'));
    icon.position.set(0, 1.12, .16); icon.rotation.x = .5; g.add(icon);
    const b = { part, g, cap, press: 0 };
    api.tap(g, () => tapButton(b), {}); return b;
  });
  const lever = new THREE.Group(); lever.position.set(PM.x + 2.4, UGF, -1.2); add(lever);
  { const box = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .5), M('#5b2f8a')); box.position.y = .25; box.castShadow = true; lever.add(box); }
  const arm = new THREE.Group(); arm.position.y = .5; lever.add(arm);
  { const st = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1, 10), M('#c9c9d9', { m: .6, r: .3 })); st.position.y = .5; arm.add(st); arm.add(ball(M('#ff4f9a', { em: '#ff4f9a', ei: .3 }), .2, 0, 1.02, 0)); }
  arm.rotation.z = .5;
  api.tap(lever, () => pullLever());
  G.interact.push({ x: PM.x, y: UGF, layer: '', disc: 'petmaker', run: () => tapButton(btns[0]), hintY: 3.4 });
  G.interact.push({ x: PM.x + 2.4, y: UGF, layer: '', disc: 'pet', run: () => pullLever(), hintY: 2.2, need: () => (world.pets || []).length < MAXPETS && world.disc.has('petmaker') });
  world.petDraft = world.petDraft || { col: 0, ears: 0, tail: 0, pat: 0 };
  let previewPet = null;
  function rebuildPreview() { if (previewPet) preview.remove(previewPet.root); previewPet = buildPet(world.petDraft, 1.15); preview.add(previewPet.root); }
  rebuildPreview();
  function tapButton(b) {
    const P = player; if (P.y > UGF + 2 || Math.abs(P.x - PM.x) > 7) { Sound.click(); return; }
    const d = world.petDraft, n = { col: PET_COLS.length, ears: EARS.length, tail: TAILS.length, pat: PATS.length }[b.part];
    d[b.part] = (d[b.part] + 1) % n; b.press = 1; rebuildPreview();
    Sound.bell(NOTES[(d[b.part] * 2 + BTN.findIndex(x => x[0] === b.part)) % 8], .05); burst(PM.x, UGF + 1.8, PM.z + 1, ['#fff', PET_COLS[d.col]], 10, 2);
    discover('petmaker', 'The Pet Workshop! Tap the buttons to design a pet, then pull the lever.'); api.saveSoon();
  }
  let egg = null;
  function pullLever() {
    const P = player; if (egg || Math.abs(P.x - PM.x) > 7 || P.y > UGF + 2 || world.pets.length >= MAXPETS) { Sound.click(); return; }
    arm.rotation.z = -.5; Sound.tone(300, .4, 'sawtooth', .03, 2); Sound.whoosh();
    const e = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 18), M('#fff8ea', { cc: 1 })); e.scale.y = 1.25; e.position.set(PM.x + .2, UGF + 1.5, PM.z + 1.9); e.castShadow = true; add(e);
    for (let i = 0; i < 6; i++) { const sp = ball(M(['#ff9fd2', '#9fe6ff', '#ffd45e'][i % 3]), .07, Math.cos(i) * .3, Math.sin(i * 2) * .3, .34); sp.castShadow = false; e.add(sp); }
    egg = { m: e, t: 0 };
  }
  // ---------- your pets (up to 5) and every friend who follows you ----------
  // Everyone who follows you walks along your trail, one behind the other.
  const followers = [], pets = [], petPos = new THREE.Vector3();
  world.pets = world.pets || [];
  function addFollower(f) { f.pos = new THREE.Vector3(player.x - 1.2 - followers.length * .6, player.y, player.z + .7); f.trick = 0; f.root.position.copy(f.pos); followers.push(f); return f; }
  function removeFollower(f) { const i = followers.indexOf(f); if (i >= 0) followers.splice(i, 1); }
  // tap a friend who follows you and they stay put (they wave bye-bye); tap again and they come along
  function waveBye(f) { removeFollower(f); f.waiting = true; Sound.tone(620, .12, 'sine', .05, .8); Sound.tone(520, .16, 'sine', .04, .8, .12); burst(f.pos.x, f.pos.y + 1.1, f.pos.z, ['#ffffff', '#9fe6ff', '#ffd84a'], 10, 1.6); toast('👋 Bye-bye! Tap me to come along again.'); discover('stayhere', 'Tap a friend to make them stay. Tap again and they follow you!'); }
  function comeAlong(f) { if (!followers.includes(f)) followers.push(f); f.waiting = false; Sound.chime(); burst(f.pos.x, f.pos.y + 1.1, f.pos.z, ['#ff6fae', '#fff', '#ffd84a'], 12, 2); }
  function followerTrick(f) { f.trick = 1.2; Sound.giggle(); burst(f.pos.x, f.pos.y + 1, f.pos.z, ['#ff8fc8', '#ffd84a'], 12, 2); }
  function spawnPet(rec, x, y, z) {
    const p = buildPet(rec, .9); add(p.root);
    const f = addFollower({ kind: 'pet', root: p.root, pet: p }); if (x != null) f.pos.set(x, y, z);
    pets.push(f); const idx = pets.length - 1;
    p.root.userData.tap = () => p.root.children[0].userData.tapFn(); p.root.children[0].userData.tapFn = () => { world.petStay = world.petStay || []; if (f.waiting) { comeAlong(f); world.petStay[idx] = false; followerTrick(f); } else { waveBye(f); world.petStay[idx] = true; } discover('pettrick', 'Your pet does a trick!'); api.saveSoon(); }; G.taps.push(p.root);
    return f;
  }
  api.petTap = () => { if (pets[0]) followerTrick(pets[0]); };

  // ---------- new friends you can meet: tap them and they follow you everywhere (saved) ----------
  world.buddies = world.buddies || {};
  const buddies = {};
  function buddy(id, x, z, emoji, build, o = {}) {
    const root = new THREE.Group(); add(root); const parts = build(root) || {};
    root.traverse(m => { if (m.isMesh) m.castShadow = true; });
    const b = { id, home: new THREE.Vector3(x, 0, z), root, parts, emoji, fly: !!o.fly, f: null, t: Math.random() * 6 };
    root.position.copy(b.home);
    const tapB = () => {
      if (!b.f) { world.buddies[id] = true; follow(b); Sound.chime(); Sound.giggle(); burst(root.position.x, root.position.y + 1.2, root.position.z, ['#ff6fae', '#fff', '#ffd84a'], 18, 2.4); toast(emoji + '💖 ' + o.name + ' wants to come with you!'); discover('buddy_' + id, o.name + ' follows you now!'); discover('buddy'); api.saveSoon(); }
      else { waveBye(b.f); b.baseY = b.f.pos.y; b.f = null; world.buddies[id] = false; api.saveSoon(); }
    };
    root.userData.tap = tapB; root.traverse(m => { if (m.isMesh) m.userData.tap = tapB; }); G.taps.push(root);
    G.interact.push({ x, y: 0, layer: '', disc: 'buddy_' + id, run: tapB, hintY: 2, need: () => !b.f });
    buddies[id] = b; return b;
  }
  function follow(b) { b.f = addFollower({ kind: b.id, root: b.root, fly: b.fly, anim: b.parts.anim }); b.f.pos.copy(b.root.position); }
  // Biscuit the puppy (near the start, by the slide)
  buddy('biscuit', 30, -1.6, '🐶', r => {
    const k = plush(r, quadSpec({ scale: .55, body: '#e8b07a', belly: '#fff1dc', snoutCol: '#fff1dc', hoof: '#fff1dc', ears: false, tail: 'long', legLen: .42, long: .8, neck: .8, iris: '#8a5a2a', voxel: .032,
      extraParts: (s2, hx2, hyy) => [[.14, 'earL'], [-.14, 'earR']].map(([z, b]) => ({ type: 'limb', a: s2([hx2 - .08, hyy + .12, z]), b: s2([hx2 - .12, hyy - .14, z * 1.5]), ra: .06 * .55, rb: .09 * .55, bone: b, color: '#8a5a3a', k: .03 })) }),
      { lid: '#e8b07a', iris: '#8a5a2a' });
    return { anim: (t, moving) => { k.tick(1 / 60, t, moving); k.B.tail.rotation.y = Math.sin(t * 16) * .6; } };
  }, { name: 'Biscuit' });
  // Pom the fluffy lamb (in the park)
  buddy('pom', 176, -1.8, '🐑', r => {
    const k = plush(r, quadSpec({ scale: .55, body: '#ffffff', belly: '#ffffff', headCol: '#ffd9e6', snoutCol: '#ffe6ee', legCol: '#6a5470', hoof: '#4a3a50', tail: 'none', legLen: .4, long: .75, neck: .7, fat: 1.25, iris: '#6a4a8a', voxel: .03,
      extraParts: (s2, hx2, hyy, by, hx) => Array.from({ length: 16 }, (_, i) => { const a = i * 2.4; return { type: 'sphere', c: s2([Math.cos(a) * hx * .8, by + .12 + Math.sin(i * 1.7) * .14, Math.sin(a) * .24]), r: .14 * .55, bone: Math.cos(a) > 0 ? 'chest' : 'hips', color: '#ffffff', k: .03 }; }).concat([{ type: 'sphere', c: s2([hx2 - .02, hyy + .17, 0]), r: .12 * .55, bone: 'head', color: '#ffffff', k: .03 }]) }),
      { sheen: '#ffffff', lid: '#ffd9e6', iris: '#6a4a8a' });
    return { anim: (t, moving) => { k.tick(1 / 60, t, moving); k.B.head.rotation.z = Math.sin(t * (moving ? 9 : 2)) * .1; } };
  }, { name: 'Pom' });
  // Twinkle the little glowing fairy (by the Fluffkin House); she flies beside you
  buddy('twinkle', 199, -1.6, '🧚', r => {
    const glow = toy('#fff3a6', { em: '#ffd84a', ei: .9, r: .3 }), skin = toy('#ffe6d4', { r: .5 });
    r.position.y = 1.2;
    const body = new THREE.Group(); r.add(body); body.position.y = 1.1;
    body.add(ball(toy('#ff9fd2', { r: .3, cc: .8, sheen: .6 }), .14, 0, -.05, 0, 1, 1.4, 1));
    const head = new THREE.Group(); head.position.y = .22; body.add(head); head.add(ball(skin, .13)); head.add(ball(toy('#ffd23f', { r: .4, sheen: .6 }), .14, 0, .05, -.03, 1.05, 1, 1));
    face(head, { y: 0, z: .12, spread: .05, eyeR: .035, mouthY: -.06 });
    const halo = ball(glow, .07, 0, .26, 0); head.add(halo);
    const wingM = new THREE.MeshPhysicalMaterial({ color: '#dff6ff', transparent: true, opacity: .55, roughness: .05, iridescence: 1, side: THREE.DoubleSide, depthWrite: false });
    const wings = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.CircleGeometry(.22, 20), wingM); w.scale.set(1, 1.5, 1); w.position.set(s * .17, .05, -.08); w.rotation.y = s * .6; body.add(w); return w; });
    return { anim: t => { wings.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (.6 + Math.sin(t * 30) * .5); }); body.position.y = Math.sin(t * 3) * .12; } };
  }, { name: 'Twinkle', fly: true });

  // =================== FRIENDLY CRITTERS ===================
  const critters = [];
  function critter(kind, x, y, z, build, onTap, disc, msg) {
    const root = new THREE.Group(); root.position.set(x, y, z); add(root);
    const parts = build(root);
    const c = { kind, root, parts, x, y, z, t: Math.random() * 6, act: 0, near: 0, onTap, disc, msg };
    root.userData.tap = () => tapCritter(c); root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.tap = () => tapCritter(c); } }); G.taps.push(root);
    G.interact.push({ x, y, layer: '', disc, run: () => tapCritter(c), hintY: 2.6 });
    critters.push(c); return c;
  }
  // every critter TALKS: a picture speech bubble (emoji, no reading) and a babbling voice
  const TALK = {
    bear: ['🎈😊', '🎈❤️', '👋🐻'], bunny: ['🎨✨', '🖌️💖', '🌈😄'], frog: ['🥁🎶', '🐸😄', '🎵🎵'], penguin: ['💃🎵', '🐧❄️', '🕺✨'], owl: ['🦉💤', '🌙⭐', '😴💤'],
    beaver: ['🧱👉', '🏠✨', '🔨😊'], unicorn: ['🌈✨', '🦄💖', '⭐🌟'], hedgehog: ['🎸🎶', '🎵😊', '🎶💕'], snail: ['🐌💨', '🐚😴', '🍃😊'], fox: ['🏎️💨', '🏁😄', '🔧✨'],
  };
  const VOICE = { bear: 260, bunny: 620, frog: 300, penguin: 520, owl: 380, beaver: 340, unicorn: 700, hedgehog: 560, snail: 800, fox: 460 };
  const bubbles = [];
  function bubbleTex(text) { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.97)'; g.strokeStyle = '#c9a6ff'; g.lineWidth = 8; g.beginPath(); g.roundRect(8, 8, 240, 110, 46); g.fill(); g.stroke(); g.beginPath(); g.moveTo(100, 114); g.lineTo(128, 152); g.lineTo(150, 114); g.fill(); g.font = '64px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 66); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function say(c, text) {
    const old = bubbles.find(b => b.c === c); if (old) { scene.remove(old.s); bubbles.splice(bubbles.indexOf(old), 1); }
    const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(text), depthTest: false })); s2.scale.set(1.8, 1.12, 1); s2.renderOrder = 11; add(s2);
    bubbles.push({ c, s: s2, life: 2.8 });
    const base = VOICE[c.kind] || 500; for (let i = 0; i < 4 + Math.floor(Math.random() * 3); i++) Sound.tone(base * (.85 + Math.random() * .4), .08, i % 2 ? 'triangle' : 'sine', .045, .9 + Math.random() * .4, i * .1);
  }
  function tapCritter(c) { c.act = 1.6; c.onTap(c); discover(c.disc, c.msg); const lines = TALK[c.kind] || ['😊']; c.line = ((c.line ?? -1) + 1) % lines.length; say(c, lines[c.line]); }
  // Balloon Bear (park entrance)
  critter('bear', 137.6, 0, -2.4, r => {
    const S = 1.15, k = plush(r, bipedSpec({ scale: S, body: '#c98a55', belly: '#f3dcbc', muzzle: '#f3dcbc', ears: 'round', snout: .03, tail: 'puff', iris: '#a06a32' }), { lid: '#c98a55', iris: '#a06a32' });
    const bunch = new THREE.Group(); bunch.position.set(.55, 2.75, 0); r.add(bunch);
    BALLOON_COLS.forEach((c, i) => { const b = ball(M(c, { r: .15, cc: 1 }), .3, (i - 2) * .32, Math.abs(i - 2) * -.15, 0, 1, 1.15, 1); bunch.add(b); });
    const str = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 1.7, 4), M('#ffffff')); str.position.set(.52, 1.75, .1); r.add(str);
    return { head: k.B.head, arm: k.B.armL, bunch, tick: k.tick };
  }, c => { const B = world.balloons; if (B.length >= MAXBALLOONS) { letGo(); toast('🎈🎈🎈 Wheee! Up, up and away!'); } else { B.push(BALLOON_COLS[B.length % BALLOON_COLS.length]); Sound.giggle(); burst(c.x, 3, c.z, [B[B.length - 1], '#fff'], 14, 2); toast('🎈'.repeat(B.length) + (B.length === 1 ? ' A balloon for you! Tap the bear for more.' : '')); } api.saveSoon(); }, 'balloon', null);
  // Painter Bunny (studio, by the paint wall)
  critter('bunny', 52.4, 0, -2.4, r => {
    const k = plush(r, bipedSpec({ scale: 1.05, body: '#ffffff', belly: '#fff4f8', ears: 'long', snout: 0, nose: '#ff8fc0', tail: 'puff', iris: '#8a6ad0' }), { lid: '#ffffff', iris: '#8a6ad0',
      accessories: (B, at) => { const beret = ball(M('#ff4f9a', { r: .6, sheen: 1 }), .2, 0, 0, 0, 1.25, .38, 1.25); beret.rotation.z = -.25; at(B.head, beret, .06, 1.5, -.02); at(B.head, ball(M('#ff4f9a'), .03, 0, 0, 0), .1, 1.58, -.02);
        const brush = new THREE.Group(); const h = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .55, 8), M('#b06a32')); h.position.y = .2; brush.add(h); brush.add(ball(M('#3d9bff'), .055, 0, .5, 0, 1, 1.4, 1)); brush.rotation.z = -.3; at(B.handL, brush, .44, .6, .12); } });
    return { head: k.B.head, arm: k.B.armL, tick: k.tick };
  }, c => { api.paintStamp(); Sound.tone(600, .2, 'sine', .05, 1.4); burst(c.x, 1.6, c.z, ['#ff4f9a', '#3d9bff', '#ffd23f'], 14, 2); }, 'painter', 'The painter bunny paints a picture for you!');
  // Drummer Frog (end of the studio)
  critter('frog', 89.6, 0, -2.4, r => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .55, 32), M('#ff6fae')); drum.position.set(.85, .28, .3); r.add(drum); const top = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .04, 32), M('#fff8ea')); top.position.set(.85, .57, .3); r.add(top);
    for (const y2 of [.08, .5]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(.56, .03, 8, 32), M('#ffd23f', { m: .5 })); rim.rotation.x = Math.PI / 2; rim.position.set(.85, y2, .3); r.add(rim); }
    const k = plush(r, bipedSpec({ scale: 1, body: '#5fcf6a', belly: '#d8f7c0', headW: 1.35, headH: .82, headY: 1.0, ears: 'none', eyeBumps: true, snout: false, tail: 'none', bodyR: [.38, .34, .32], footCol: '#4fbf5a', iris: '#c8a020', eyeR: .085 }),
      { fur: false, rough: .35, lid: '#5fcf6a', iris: '#c8a020', mouth: false, accessories: (B, at) => { const sm = new THREE.Mesh(new THREE.TorusGeometry(.13, .018, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#2a5a1a' })); sm.rotation.z = Math.PI; at(B.head, sm, 0, .92, .27); } });
    return { head: k.B.head, arm: k.B.armL, drumTop: top, tick: k.tick };
  }, c => { [0, .18, .36, .54].forEach((d, i) => { Sound.tone(110 + i * 20, .2, 'sine', .08, .5, d); }); burst(c.x + .7, .8, c.z + .3, ['#fff', '#ff6fae'], 12, 2); }, 'frog', 'Boom boom! The drummer frog plays for you!');
  // Dancing Penguin (lab)
  critter('penguin', 109.2, 0, -2.4, r => {
    const k = plush(r, bipedSpec({ scale: 1.1, body: '#2c2c4a', belly: '#ffffff', headCol: '#2c2c4a', muzzle: '#ffffff', beak: '#ffb000', ears: 'none', flippers: true, tail: 'feathers', footCol: '#ffb000', legCol: '#2c2c4a', bodyR: [.36, .44, .32], iris: '#4a6ad0',
      extraPaints: (s, hy) => [{ type: 'ellipsoid', c: s([0, hy - .02, .2]), r: s([.2, .2, .12]), color: '#ffffff', soft: .02 }] }), { fur: false, rough: .45, clearcoat: .5, lid: '#2c2c4a', iris: '#4a6ad0',
      accessories: (B, at) => { const bow = new THREE.Group(); bow.add(ball(M('#ff4f9a'), .06, 0, 0, 0)); for (const x of [-.09, .09]) bow.add(ball(M('#ff4f9a'), .07, x, 0, 0, 1.2, .8, .5)); at(B.spine, bow, 0, .98, .3); } });
    return { head: k.B.head, arm: k.B.armL, tick: k.tick };
  }, c => { [0, 2, 4, 2, 0].forEach((n, i) => Sound.bell(NOTES[n], .04, i * .16)); burst(c.x, 1.5, c.z, ['#9fe6ff', '#fff'], 12, 2); }, 'penguin', 'The penguin does a happy dance!');
  // Sleepy Owl (on a tree in the park)
  critter('owl', 152, 2.1, -3.2, r => {
    const k = plush(r, bipedSpec({ scale: .95, body: '#b98a5a', belly: '#f3e0c0', headCol: '#b98a5a', beak: '#ffb347', ears: 'tufts', tail: 'feathers', bodyR: [.36, .36, .32], headW: 1.15, iris: '#c97a10', eyeR: .1,
      extraPaints: (s, hy) => [{ type: 'sphere', c: s([.13, hy + .03, .22]), r: .12, color: '#f3e0c0', soft: .02 }, { type: 'sphere', c: s([-.13, hy + .03, .22]), r: .12, color: '#f3e0c0', soft: .02 }] }), { lid: '#b98a5a', iris: '#c97a10' });
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.6, 10), M('#8a5a2a')); branch.rotation.z = Math.PI / 2; branch.position.y = -.02; r.add(branch);
    return { head: k.B.head, arm: k.B.armL, eyes: k.eyes, tick: k.tick };
  }, c => { Sound.tone(420, .35, 'sine', .05, .8); Sound.tone(360, .45, 'sine', .05, .8, .4); burst(c.x, c.y + 1.2, c.z, ['#fff3a6', '#fff'], 12, 2); }, 'owl', 'Hoo hoo! The sleepy owl woke up!');

  // ----- the Creative Meadow friends -----
  critter('beaver', 205.6, 0, -2.4, r => {
    const k = plush(r, bipedSpec({ scale: 1.05, body: '#b07a4a', belly: '#f0d0a8', muzzle: '#f0d0a8', ears: 'small', snout: .02, teeth: true, tail: 'paddle', iris: '#a06a32' }), { lid: '#b07a4a', iris: '#a06a32',
      accessories: (B, at) => { const hat = new THREE.Mesh(new THREE.SphereGeometry(.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#ffd23f', { r: .3 })); at(B.head, hat, 0, 1.4, 0); const brim = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .03, 24), M('#ffd23f', { r: .3 })); at(B.head, brim, 0, 1.41, .04);
        const blk = new THREE.Mesh(new THREE.BoxGeometry(.28, .28, .28), M('#ff4f9a')); at(B.handL, blk, .45, .8, .16); } });
    return { head: k.B.head, arm: k.B.armL, tick: k.tick };
  }, c => { Sound.tone(500, .1, 'square', .03, 1); burst(c.x, 1.6, c.z, ['#ff4f9a', '#ffd23f', '#3d9bff'], 12, 2); }, 'beaver', 'The builder beaver says: build something!');
  critter('unicorn', 240, 0, -2.4, r => {
    const k = plush(r, quadSpec({ scale: 1.15, body: '#ffffff', belly: '#fff4fa', snoutCol: '#ffd6ea', hoof: '#c9a6ff', horn: '#ffd84a', tail: 'none', legLen: .55, iris: '#7a3fd0' }), { lid: '#ffffff', iris: '#7a3fd0',
      accessories: (B, at) => { const cols = ['#ff4f9a', '#ff9a2e', '#ffd23f', '#3cc46e', '#3d9bff', '#a15cff'];
        cols.forEach((c2, i) => { const m = ball(M(c2, { r: .6, sheen: 1 }), .1, 0, 0, 0, 1, 1.4, .7); at(B.neck, m, .55 + i * .07, 1.25 - i * .05 + .25, 0); });
        cols.forEach((c2, i) => { const m = ball(M(c2, { r: .6, sheen: 1 }), .11, 0, 0, 0, 1, 1, .7); at(B.tail, m, -.78 - i * .05, .8 - i * .1, 0); }); } });
    return { head: k.B.head, arm: k.B.earL, tick: k.tick };
  }, c => { for (let i = 0; i < 4; i++) burst(c.x + .8, 2.2, c.z, ['#ff4f9a', '#ffd23f', '#3cc46e', '#3d9bff', '#a15cff'], 14, 3.5); Sound.chime(); }, 'unicorn', 'The rainbow unicorn sprinkles rainbow sparkles!');
  critter('hedgehog', 246, 0, -2.4, r => {
    const k = plush(r, bipedSpec({ scale: .95, body: '#f3d6b0', belly: '#fff0dc', headCol: '#f3d6b0', ears: 'small', snout: .06, nose: '#3a2030', tail: 'none', iris: '#8a5a32' }), { lid: '#f3d6b0', iris: '#8a5a32',
      accessories: (B, at) => { const spines = new THREE.InstancedMesh(new THREE.ConeGeometry(.045, .24, 6), toy('#8a5a3a', { r: .7 }), 46), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
        for (let i = 0; i < 46; i++) { const a = (i * 2.399) % (Math.PI * 2), h = -.2 + (i / 46) * 1.0; d.set(Math.cos(a) * .9, h, -Math.abs(Math.sin(a)) - .4).normalize(); q.setFromUnitVectors(up, d); m4.compose(new THREE.Vector3(d.x * .3, .6 + d.y * .35, d.z * .3 - .02), q, new THREE.Vector3(1, 1, 1)); spines.setMatrixAt(i, m4); }
        spines.castShadow = true; at(B.spine, spines, 0, .66, 0);
        const guitar = new THREE.Group(); guitar.rotation.z = .6; guitar.add(ball(M('#ff9a2e'), .17, 0, 0, 0, 1, 1.2, .4)); const neck = new THREE.Mesh(new THREE.BoxGeometry(.06, .45, .04), M('#7a4a2a')); neck.position.y = .3; guitar.add(neck); at(B.handR, guitar, -.2, .55, .3); } });
    return { head: k.B.head, arm: k.B.armL, tick: k.tick };
  }, c => { [0, 2, 4, 5, 4, 2, 0].forEach((n, i) => Sound.tone([262, 294, 330, 349, 392, 440, 494][n] * 2, .25, 'triangle', .05, 1, i * .14)); burst(c.x, 1.2, c.z, ['#ffd23f', '#fff'], 10, 2); }, 'hedgehog', 'The hedgehog plays a song on the guitar!');
  critter('snail', 251, 0, -2.0, r => {
    const body = new THREE.Group(); r.add(body);
    const skin = toy('#b9f0b0', { r: .3, cc: .9 }); const shell = new THREE.Mesh(new THREE.TorusGeometry(.25, .17, 12, 24), toy('#ff9fd2', { cc: 1 })); shell.position.set(-.05, .45, 0); body.add(shell);
    r.add(ball(skin, .2, .05, .12, 0, 2.2, .6, .8));
    const head = new THREE.Group(); head.position.set(.45, .32, 0); r.add(head); head.add(ball(skin, .16));
    for (const z of [-.06, .06]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .25, 6), skin); st.position.set(.03, .2, z); head.add(st); head.add(ball(M('#ffffff'), .05, .03, .33, z)); head.add(ball(M('#2a0f45'), .03, .06, .34, z)); }
    const arm = new THREE.Group(); r.add(arm);
    return { head, arm, body };
  }, c => { Sound.tone(900, .3, 'sine', .03, .5); }, 'snail', 'The little snail hides in its shell!');

  critter('fox', 260.8, 0, -2.4, r => {
    const k = plush(r, bipedSpec({ scale: 1.05, body: '#ff8a4a', belly: '#ffffff', muzzle: '#ffffff', ears: 'pointy', innerEar: '#ffffff', snout: .07, tail: 'bushy', tailTip: '#ffffff', legCol: '#5a3a3a', footCol: '#5a3a3a', armCol: '#ff8a4a', pawCol: '#5a3a3a', iris: '#d08a20' }), { lid: '#ff8a4a', iris: '#d08a20',
      accessories: (B, at) => { const cap = new THREE.Mesh(new THREE.SphereGeometry(.29, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#3d9bff')); at(B.head, cap, 0, 1.38, -.02);
        const wrench = new THREE.Mesh(new THREE.BoxGeometry(.05, .42, .04), M('#c9c9d9', { m: .6, r: .3 })); at(B.handL, wrench, .44, .78, .14); } });
    return { head: k.B.head, arm: k.B.armL, tick: k.tick };
  }, c => { Sound.tone(700, .08, 'square', .03, 1); Sound.tone(900, .08, 'square', .03, 1, .1); burst(c.x, 1.6, c.z, ['#ff9a5a', '#fff'], 10, 2); }, 'fox', 'The mechanic fox fixed up your kart!');

  // =================== balloons that float with you (up to 6) ===================
  const MAXBALLOONS = 6; world.balloons = world.balloons || [];
  const strMat = new THREE.LineBasicMaterial({ color: '#ffffff' });
  const balloons = [];
  function balloonMesh() {
    const mat = M('#ff4f9a', { r: .15, cc: 1 }), g = new THREE.Group(); add(g);
    g.add(ball(mat, .35, 0, 0, 0, 1, 1.18, 1)); const knot = new THREE.Mesh(new THREE.ConeGeometry(.07, .12, 8), mat); knot.position.y = -.42; knot.rotation.x = Math.PI; g.add(knot);
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(geo, strMat); line.frustumCulled = false; add(line);
    const b = { g, mat, line, pos: new THREE.Vector3(player.x, player.y + 3, player.z), vel: new THREE.Vector3(), free: 0 };
    g.traverse(o => { if (o.isMesh) o.userData.tap = () => { Sound.pop(); b.vel.y += 3; }; }); G.taps.push(g); return b;
  }
  // tap the bear when you have lots: they all float away into the sky (then you can start again)
  const flying = [];
  function letGo() { for (const b of balloons) { b.free = 4; b.line.visible = false; flying.push(b); } balloons.length = 0; world.balloons = []; Sound.whoosh(); Sound.chime(); discover('letgo', 'Your balloons float up into the sky!'); }
  // =================== floating magic sparkles in the air ===================
  const MN = 70, mGeo = new THREE.BufferGeometry(), mPos = new Float32Array(MN * 3), mSeed = [];
  for (let i = 0; i < MN; i++) mSeed.push([Math.random() * 30 - 15, Math.random() * 7, Math.random() * 8 - 5, Math.random() * 6]);
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({ size: .16, map: G.haloTex, color: '#fff3d0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .85 }));
  motes.frustumCulled = false; add(motes);

  // =================== per-frame ===================
  const V = new THREE.Vector3();
  function update(dt, t, P, trail) {
    // workshop
    btns.forEach(b => { b.press = Math.max(0, b.press - dt * 4); b.cap.position.y = 1.0 - b.press * .1; });
    arm.rotation.z += (.5 - arm.rotation.z) * Math.min(1, dt * 2);
    preview.rotation.y += dt * .8; heartIn.scale.setScalar(1 + Math.sin(t * 4) * .1);
    if (egg) {
      egg.t += dt; const e = egg.m;
      e.position.y = Math.max(UGF + .5, e.position.y - dt * 2.5); e.rotation.z = Math.sin(egg.t * 18) * .25 * Math.min(1, egg.t);
      if (egg.t > 2.2) {
        scene.remove(e); world.pets.push({ ...world.petDraft }); spawnPet(world.pets[world.pets.length - 1], e.position.x, UGF, e.position.z);
        burst(e.position.x, UGF + .8, e.position.z, ['#ff8fc8', '#ffd84a', '#9fe6ff', '#fff'], 30, 3); Sound.chime(); Sound.giggle();
        toast(world.pets.length === 1 ? '🐾 Your very own pet! It will follow you everywhere. Tap it for a trick!' : '🐾'.repeat(world.pets.length) + ' Another pet! Make up to 5.'); discover('pet'); if (world.pets.length > 1) discover('pets2'); api.save(); egg = null;
      }
    }
    // everyone who follows you walks along your trail, one behind the other
    followers.forEach((f, i) => {
      const tp = trail[Math.min(trail.length - 1, 5 + i * 4)] || [P.x, P.y, P.z];
      if (Math.abs(tp[0] - f.pos.x) > 15 || Math.abs(tp[1] - f.pos.y) > 6) f.pos.set(tp[0], tp[1], tp[2]);
      const tx = tp[0] - P.facing * (.9 + i * .5), k = Math.min(1, dt * 6), side = i % 2 ? .4 : -.1; // a little line of friends behind you
      f.pos.x += (tx - f.pos.x) * k; f.pos.y += (tp[1] - f.pos.y) * k; f.pos.z += (tp[2] + .7 + side - f.pos.z) * k;
      f.trick = Math.max(0, f.trick - dt);
      const moving = Math.abs(tx - f.pos.x) > .2, hop = f.fly ? 1.2 + Math.sin(t * 2.5 + i) * .15 : moving ? Math.abs(Math.sin(t * 10 + i)) * .15 : 0;
      f.root.position.set(f.pos.x, f.pos.y + hop + (f.trick > 0 ? Math.sin((1.2 - f.trick) / 1.2 * Math.PI) * .9 : 0), f.pos.z);
      const dir = Math.sign(P.x - f.pos.x) || 1;
      f.root.rotation.y = (f.trick > 0 ? (1.2 - f.trick) * 6 : 0) + (f.orient === 'x' || f.kind === 'biscuit' || f.kind === 'pom' ? (dir > 0 ? -.25 : Math.PI + .25) : dir * .7);
      if (f.pet && f.pet.tick) f.pet.tick(dt, t, f.trick > 0);
      if (f.pet) { f.pet.ears.forEach((e, n) => { e.rotation.x = Math.sin(t * 8 + n) * (moving ? .25 : .08); }); f.pet.tail.rotation.y = Math.sin(t * 10) * .5; }
      if (f.anim) f.anim(t, moving);
    });
    if (pets[0]) petPos.copy(pets[0].pos);
    // friends waiting to be met bob about at home
    for (const p of pets) if (p.waiting) { p.root.position.set(p.pos.x, p.pos.y + Math.abs(Math.sin(t * 2 + p.pos.x)) * .05, p.pos.z); p.root.rotation.y = Math.sin(t * .7 + p.pos.x) * .5; }
    for (const b of Object.values(buddies)) if (!b.f) { b.t += dt; b.root.position.y = (b.baseY || 0) + (b.fly ? 1.2 + Math.sin(b.t * 2) * .2 : Math.abs(Math.sin(b.t * 2)) * .05); b.root.rotation.y = Math.sin(b.t * .7) * .4; if (b.parts.anim) b.parts.anim(b.t, false); }
    // critters: bob, wave when you're near, act when tapped
    for (const c of critters) {
      c.t += dt; c.act = Math.max(0, c.act - dt);
      const near = Math.abs(P.x - c.x) < 3.5 && Math.abs(P.y - c.y) < 3; c.near += ((near ? 1 : 0) - c.near) * Math.min(1, dt * 4);
      if (near && !c.greeted) { c.greeted = true; say(c, '👋😊'); }
      const p = c.parts, a = c.act;
      if (c.kind === 'snail') { c.x += (c.dir || (c.dir = 1)) * dt * .25; if (c.x > 254 || c.x < 249.5) c.dir *= -1; c.root.position.x = c.x; c.root.scale.x = c.dir > 0 ? 1 : -1; if (p.body) p.body.scale.setScalar(a > 0 ? Math.max(.05, 1 - Math.sin(a / 1.6 * Math.PI) ) : 1); }
      c.root.position.y = c.y + Math.abs(Math.sin(c.t * 2)) * .03 + (a > 0 && c.kind !== 'owl' ? Math.abs(Math.sin(a * 8)) * .35 : 0);
      c.root.rotation.y = Math.sin(c.t * .7) * .2 + (c.near > .5 ? Math.sign(P.x - c.x) * .4 : 0) + ((c.kind === 'penguin' || c.kind === 'rosie' || c.kind === 'luna') && a > 0 ? (1.6 - a) * 8 : 0);
      if (p.arm) p.arm.rotation.z = c.near > .5 || a > 0 ? 1.8 + Math.sin(c.t * 12) * .5 : .2;
      if (p.head) p.head.rotation.z = Math.sin(c.t * 1.5) * .08;
      if (p.tick) p.tick(dt, c.t, c.near > .5 || a > 0);
      if (c.kind === 'owl' && p.eyes) p.eyes.forEach(e => { e.scale.y = c.near > .5 || a > 0 ? 1 : .12; });
      if (c.kind === 'frog' && p.drumTop) p.drumTop.position.y = .57 - (a > 0 ? Math.abs(Math.sin(a * 22)) * .05 : 0);
      if (c.kind === 'bear') p.bunch.position.y = 2.6 + Math.sin(c.t * 1.6) * .08;
    }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt; b.s.position.set(b.c.root.position.x, b.c.y + (b.c.kind === 'unicorn' ? 3.3 : 2.7) + Math.sin(t * 3) * .05, b.c.root.position.z + .4); b.s.material.opacity = Math.min(1, b.life * 2); if (b.life <= 0) { scene.remove(b.s); bubbles.splice(i, 1); } }
    // balloons float above you on strings, spread out like a bunch
    while (balloons.length < world.balloons.length) balloons.push(balloonMesh());
    const showB = !(P.ride && P.ride.type === 'slide');
    balloons.forEach((b, i) => {
      const n = balloons.length, spread = (i - (n - 1) / 2) * .42;
      b.mat.color.set(world.balloons[i] || '#ff4f9a'); b.g.visible = b.line.visible = showB;
      const hx = P.x - P.facing * .3, hy = P.y + 1.2, tx = hx + spread - P.vx * .08 + Math.sin(t * 1.3 + i) * .2, ty = hy + 1.9 + (i % 2) * .35;
      b.vel.x += (tx - b.pos.x) * 14 * dt; b.vel.y += (ty - b.pos.y) * 14 * dt; b.vel.z += (P.z - .3 - (i % 3) * .2 - b.pos.z) * 10 * dt; b.vel.multiplyScalar(Math.exp(-dt * 4));
      b.pos.addScaledVector(b.vel, dt); if (Math.abs(b.pos.x - hx) > 10) b.pos.set(hx, ty, P.z);
      b.g.position.copy(b.pos); b.g.rotation.z = -b.vel.x * .1;
      const pa = b.line.geometry.attributes.position; pa.setXYZ(0, hx, hy, P.z); pa.setXYZ(1, b.pos.x, b.pos.y - .45, b.pos.z); pa.needsUpdate = true;
    });
    for (let i = flying.length - 1; i >= 0; i--) { const b = flying[i]; b.free -= dt; b.pos.y += dt * (2 + (4 - b.free)); b.pos.x += Math.sin(t * 2 + i) * dt; b.g.position.copy(b.pos); if (b.free <= 0) { scene.remove(b.g); scene.remove(b.line); flying.splice(i, 1); } }
    // floating sparkles drift around the camera view
    const cx = G.camera.position.x, cy = G.camera.position.y - 2.4;
    for (let i = 0; i < MN; i++) { const s = mSeed[i]; let x = s[0] + Math.sin(t * .3 + s[3]) * 1.5, y = s[1] + ((t * .25 + s[3]) % 7); x = ((x - cx) % 30 + 45) % 30 - 15 + cx; mPos[i * 3] = x; mPos[i * 3 + 1] = cy + y - 1; mPos[i * 3 + 2] = s[2] + Math.cos(t * .4 + s[3]); }
    mGeo.attributes.position.needsUpdate = true;
  }
  function restored() { world.petDraft = world.petDraft || { col: 0, ears: 0, tail: 0, pat: 0 }; rebuildPreview(); world.pets.forEach((rec, i) => { const f = spawnPet(rec, player.x - 1.2 - i * .6, player.y, 0); if ((world.petStay || [])[i]) { removeFollower(f); f.waiting = true; f.pos.set(PM.x + 3.6 + i * .9, UGF, -1.4); } }); for (const [id, b] of Object.entries(buddies)) if (world.buddies[id] && !b.f) { b.root.position.set(player.x - 1, player.y, .7); follow(b); } }
  return { update, restored, hasPet: () => pets.length > 0, petCount: () => pets.length, waveBye, comeAlong, pets, petPos, addFollower, removeFollower, followerTrick, followers, buddies, critters, bubbleCount: () => bubbles.length, critter, say, TALK, VOICE };
}
