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
import { NOTES } from './audio.js';

export const PET_COLS = ['#ff8fd0', '#8fd8ff', '#ffd45e', '#a98cff', '#7be08a', '#ff9a6b', '#ffffff'];
export const EARS = ['bunny', 'cat', 'bear', 'antennae'], TAILS = ['puff', 'curly', 'star'], PATS = ['plain', 'spots', 'belly'];
const BALLOON_COLS = ['#ff4f9a', '#ffd23f', '#3d9bff', '#3cc46e', '#a15cff'];

// ---------- a pet built from its recipe ----------
export function buildPet(rec, scale = 1) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const c = PET_COLS[rec.col % PET_COLS.length], fur = toy(c, { r: .6, cc: .3, sheen: 1, sheenColor: '#ffffff' });
  const light = toy('#fff6ee', { r: .6, sheen: .8 });
  body.add(ball(fur, .3, 0, .32, 0, 1.05, .95, .95));
  const head = new THREE.Group(); head.position.set(0, .68, .05); body.add(head);
  head.add(ball(fur, .27));
  if (rec.pat === 1) for (let i = 0; i < 5; i++) { const a = i * 1.3; const s = ball(toy('#ffffff', { r: .6, opacity: .85 }), .06, Math.cos(a) * .24, .3 + Math.sin(a * 1.7) * .1, Math.sin(a) * .24, 1, 1, .4); s.castShadow = false; body.add(s); }
  if (rec.pat === 2) body.add(ball(light, .2, 0, .3, .16, 1, 1.1, .6));
  face(head, { y: .03, z: .22, spread: .1, eyeR: .085, mouthY: -.1 });
  const ears = [];
  const e = EARS[rec.ears % EARS.length];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * .13, .2, 0); head.add(piv); ears.push(piv);
    if (e === 'bunny') { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .26, 4, 10), fur); m.position.y = .18; m.castShadow = true; piv.add(m); piv.rotation.z = -s * .2; }
    else if (e === 'cat') { const m = new THREE.Mesh(new THREE.ConeGeometry(.09, .2, 10), fur); m.position.y = .08; m.castShadow = true; piv.add(m); piv.rotation.z = -s * .35; }
    else if (e === 'bear') { piv.add(ball(fur, .08, s * .02, .04, 0)); }
    else { const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .22, 6), fur); st.position.y = .11; piv.add(st); piv.add(ball(toy('#ffd84a', { em: '#ffd84a', ei: .5 }), .045, 0, .24, 0)); piv.rotation.z = -s * .25; }
  }
  const tail = new THREE.Group(); tail.position.set(0, .3, -.28); body.add(tail);
  const t = TAILS[rec.tail % TAILS.length];
  if (t === 'puff') tail.add(ball(light, .12));
  else if (t === 'curly') for (let i = 0; i < 5; i++) tail.add(ball(fur, .08 - i * .008, 0, i * .06, -Math.sin(i * .8) * .08));
  else { const st = new THREE.Mesh(starGeometry(.14, .07, .05, .03, 2), toy('#ffd84a', { em: '#ffb000', ei: .4 })); tail.add(st); }
  const feet = [-1, 1].map(s => { const f = ball(light, .07, s * .13, .05, .08, 1, .7, 1.3); root.add(f); return f; });
  root.scale.setScalar(scale);
  return { root, body, ears, tail, feet };
}

export function initFriends(G, api) {
  const { scene, Sound, burst, discover, toast, player, world } = api;
  const add = o => { scene.add(o); return o; };
  const M = (c, o) => toy(c, o);
  const UGF = api.UG.floor;

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
  G.interact.push({ x: PM.x + 2.4, y: UGF, layer: '', disc: 'pet', run: () => pullLever(), hintY: 2.2, need: () => !world.pet && world.disc.has('petmaker') });
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
    const P = player; if (egg || Math.abs(P.x - PM.x) > 7 || P.y > UGF + 2) { Sound.click(); return; }
    arm.rotation.z = -.5; Sound.tone(300, .4, 'sawtooth', .03, 2); Sound.whoosh();
    const e = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 18), M('#fff8ea', { cc: 1 })); e.scale.y = 1.25; e.position.set(PM.x + .2, UGF + 1.5, PM.z + 1.9); e.castShadow = true; add(e);
    for (let i = 0; i < 6; i++) { const sp = ball(M(['#ff9fd2', '#9fe6ff', '#ffd45e'][i % 3]), .07, Math.cos(i) * .3, Math.sin(i * 2) * .3, .34); sp.castShadow = false; e.add(sp); }
    egg = { m: e, t: 0 };
  }
  // ---------- the pet that follows you ----------
  let pet = null; const petPos = new THREE.Vector3(), petState = { trick: 0, hop: 0 };
  function spawnPet(x, y, z) {
    if (pet) scene.remove(pet.root);
    pet = buildPet(world.pet, .9); add(pet.root); petPos.set(x, y, z); pet.root.position.copy(petPos);
    pet.root.traverse(o => { if (o.isMesh) o.userData.tap = () => petTrick(); }); G.taps.push(pet.root);
  }
  function petTrick() { petState.trick = 1.2; Sound.giggle(); burst(petPos.x, petPos.y + 1, petPos.z, ['#ff8fc8', '#ffd84a'], 12, 2); discover('pettrick', 'Your pet does a trick!'); }
  api.petTap = petTrick;

  // =================== FRIENDLY CRITTERS ===================
  const critters = [];
  function critter(kind, x, y, z, build, onTap, disc, msg) {
    const root = new THREE.Group(); root.position.set(x, y, z); add(root);
    const parts = build(root);
    const c = { kind, root, parts, x, y, z, t: Math.random() * 6, act: 0, near: 0, onTap, disc, msg };
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.tap = () => tapCritter(c); } }); G.taps.push(root);
    G.interact.push({ x, y, layer: '', disc, run: () => tapCritter(c), hintY: 2.6 });
    critters.push(c); return c;
  }
  function tapCritter(c) { c.act = 1.6; c.onTap(c); discover(c.disc, c.msg); }
  const fluffy = (c, o) => toy(c, { r: .6, cc: .2, sheen: 1, sheenColor: '#ffffff', ...o });
  // Balloon Bear (park entrance)
  critter('bear', 137.6, 0, -2.4, r => {
    const fur = fluffy('#d9a06a'), light = fluffy('#f3d6b0');
    r.add(ball(fur, .55, 0, .6, 0, 1, 1.05, .9)); r.add(ball(light, .35, 0, .55, .32, 1, 1, .5));
    const head = new THREE.Group(); head.position.y = 1.35; r.add(head); head.add(ball(fur, .42)); head.add(ball(light, .17, 0, -.08, .36, 1.2, .9, .7));
    head.add(ball(M('#3a2030'), .06, 0, -.02, .5)); for (const s of [-1, 1]) head.add(ball(fur, .14, s * .3, .32, 0));
    face(head, { y: .08, z: .34, spread: .15, eyeR: .09, mouthY: -.16 });
    const arm = new THREE.Group(); arm.position.set(.5, .85, 0); r.add(arm); arm.add(ball(fur, .16, .1, .2, 0, 1, 1.6, 1));
    const bunch = new THREE.Group(); bunch.position.set(.45, 2.6, 0); r.add(bunch);
    BALLOON_COLS.forEach((c, i) => { const b = ball(M(c, { r: .15, cc: 1 }), .3, (i - 2) * .32, Math.abs(i - 2) * -.15, 0, 1, 1.15, 1); bunch.add(b); });
    const str = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 1.5, 4), M('#ffffff')); str.position.set(.5, 1.75, 0); r.add(str);
    return { head, arm, bunch };
  }, c => { world.balloon = BALLOON_COLS[(BALLOON_COLS.indexOf(world.balloon) + 1) % BALLOON_COLS.length]; Sound.giggle(); burst(c.x, 3, c.z, [world.balloon, '#fff'], 14, 2); toast('🎈 A balloon for you! Tap the bear again for a new colour.'); api.saveSoon(); }, 'balloon', null);
  // Painter Bunny (studio, by the paint wall)
  critter('bunny', 52.4, 0, -2.4, r => {
    const fur = fluffy('#ffffff'), pink = fluffy('#ffb8dc');
    r.add(ball(fur, .45, 0, .5, 0, 1, 1.1, .9)); const head = new THREE.Group(); head.position.y = 1.15; r.add(head); head.add(ball(fur, .36));
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .4, 4, 10), fur); e.position.set(s * .14, .5, 0); e.rotation.z = -s * .15; head.add(e); const i2 = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .3, 4, 8), pink); i2.position.set(s * .14, .5, .05); i2.rotation.z = -s * .15; head.add(i2); }
    face(head, { y: .05, z: .3, spread: .13, eyeR: .08, mouthY: -.12 });
    const beret = ball(M('#ff4f9a'), .22, .05, .3, 0, 1.2, .4, 1.2); head.add(beret);
    const arm = new THREE.Group(); arm.position.set(.45, .75, .1); r.add(arm); arm.add(ball(fur, .12, 0, .15, 0, 1, 1.5, 1));
    const brush = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .6, 6), M('#b06a32')); brush.position.set(0, .45, 0); arm.add(brush); arm.add(ball(M('#3d9bff'), .07, 0, .78, 0));
    return { head, arm };
  }, c => { api.paintStamp(); Sound.tone(600, .2, 'sine', .05, 1.4); burst(c.x, 1.6, c.z, ['#ff4f9a', '#3d9bff', '#ffd23f'], 14, 2); }, 'painter', 'The painter bunny paints a picture for you!');
  // Drummer Frog (end of the studio)
  critter('frog', 89.6, 0, -2.4, r => {
    const skin = toy('#6fd36f', { r: .35, cc: .8 }), belly = toy('#d8f7c0', { r: .4 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .55, 24), M('#ff6fae')); drum.position.set(.7, .28, .3); r.add(drum); const top = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .04, 24), M('#fff8ea')); top.position.set(.7, .57, .3); r.add(top);
    r.add(ball(skin, .45, 0, .45, 0, 1.1, .85, 1)); r.add(ball(belly, .3, 0, .4, .25, 1, .9, .5));
    const head = new THREE.Group(); head.position.y = .95; r.add(head); head.add(ball(skin, .38, 0, 0, 0, 1.15, .8, 1));
    for (const s of [-1, 1]) head.add(ball(skin, .14, s * .2, .26, .05));
    face(head, { y: .26, z: .17, spread: .2, eyeR: .09, mouthY: -.08, cheeks: true });
    const arm = new THREE.Group(); arm.position.set(.4, .6, .2); r.add(arm); arm.add(ball(skin, .1, .1, 0, 0, 1.6, 1, 1));
    return { head, arm, drumTop: top };
  }, c => { [0, .18, .36, .54].forEach((d, i) => { Sound.tone(110 + i * 20, .2, 'sine', .08, .5, d); }); burst(c.x + .7, .8, c.z + .3, ['#fff', '#ff6fae'], 12, 2); }, 'frog', 'Boom boom! The drummer frog plays for you!');
  // Dancing Penguin (lab)
  critter('penguin', 109.2, 0, -2.4, r => {
    const black = toy('#2c2c4a', { r: .3, cc: .9 }), white = toy('#ffffff', { r: .35 });
    r.add(ball(black, .42, 0, .6, 0, 1, 1.3, .9)); r.add(ball(white, .3, 0, .55, .22, 1, 1.3, .55));
    const head = new THREE.Group(); head.position.y = 1.3; r.add(head); head.add(ball(black, .3)); head.add(ball(white, .2, 0, -.02, .16, 1.2, 1, .6));
    face(head, { y: .05, z: .26, spread: .1, eyeR: .07, mouthY: -.25, cheeks: true });
    const beak = new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 10), M('#ffb000')); beak.position.set(0, -.04, .33); beak.rotation.x = Math.PI / 2; head.add(beak);
    const arm = new THREE.Group(); arm.position.set(.4, .8, 0); r.add(arm); arm.add(ball(black, .12, .05, -.15, 0, .6, 1.6, .9));
    for (const s of [-1, 1]) r.add(ball(M('#ffb000'), .1, s * .15, .05, .12, 1.2, .5, 1.6));
    const bow = ball(M('#ff4f9a'), .08, 0, .95, .33); r.add(bow);
    return { head, arm };
  }, c => { [0, 2, 4, 2, 0].forEach((n, i) => Sound.bell(NOTES[n], .04, i * .16)); burst(c.x, 1.5, c.z, ['#9fe6ff', '#fff'], 12, 2); }, 'penguin', 'The penguin does a happy dance!');
  // Sleepy Owl (on a tree in the park)
  critter('owl', 152, 2.1, -3.2, r => {
    const brown = fluffy('#b98a5a'), light = fluffy('#f3e0c0');
    r.add(ball(brown, .38, 0, .4, 0, 1, 1.15, .9)); r.add(ball(light, .25, 0, .35, .2, 1, 1.2, .5));
    const head = new THREE.Group(); head.position.y = .9; r.add(head); head.add(ball(brown, .32, 0, 0, 0, 1.15, 1, 1));
    for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.ConeGeometry(.07, .18, 8), brown); t.position.set(s * .2, .3, 0); t.rotation.z = -s * .4; head.add(t); }
    const f = face(head, { y: .04, z: .26, spread: .13, eyeR: .1, mouthY: -.14, cheeks: false });
    const arm = new THREE.Group(); arm.position.set(.32, .5, 0); r.add(arm); arm.add(ball(brown, .14, .05, -.1, 0, .6, 1.3, .9));
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.6, 8), M('#8a5a2a')); branch.rotation.z = Math.PI / 2; branch.position.y = -.02; r.add(branch);
    return { head, arm, eyes: f.eyes };
  }, c => { Sound.tone(420, .35, 'sine', .05, .8); Sound.tone(360, .45, 'sine', .05, .8, .4); burst(c.x, c.y + 1.2, c.z, ['#fff3a6', '#fff'], 12, 2); }, 'owl', 'Hoo hoo! The sleepy owl woke up!');

  // =================== the balloon that floats with you ===================
  const balloon = new THREE.Group(); add(balloon);
  const bMat = M('#ff4f9a', { r: .15, cc: 1 });
  const bBall = ball(bMat, .35, 0, 0, 0, 1, 1.18, 1); balloon.add(bBall);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(.07, .12, 8), bMat); knot.position.y = -.42; knot.rotation.x = Math.PI; balloon.add(knot);
  const strGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const str = new THREE.Line(strGeo, new THREE.LineBasicMaterial({ color: '#ffffff' })); str.frustumCulled = false; add(str);
  const bPos = new THREE.Vector3(player.x, player.y + 3, 0), bVel = new THREE.Vector3();

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
        scene.remove(e); world.pet = { ...world.petDraft }; spawnPet(e.position.x, UGF, e.position.z);
        burst(e.position.x, UGF + .8, e.position.z, ['#ff8fc8', '#ffd84a', '#9fe6ff', '#fff'], 30, 3); Sound.chime(); Sound.giggle();
        toast('🐾 Your very own pet! It will follow you everywhere. Tap it for a trick!'); discover('pet'); api.save(); egg = null;
      }
    }
    // pet follows along the trail
    if (pet) {
      const tp = trail[Math.min(trail.length - 1, 10)] || [P.x, P.y, P.z];
      if (Math.abs(tp[0] - petPos.x) > 15 || Math.abs(tp[1] - petPos.y) > 6) petPos.set(tp[0], tp[1], tp[2]);
      const tx = tp[0] - P.facing * .9, k = Math.min(1, dt * 6);
      petPos.x += (tx - petPos.x) * k; petPos.y += (tp[1] - petPos.y) * k; petPos.z += (tp[2] + .7 - petPos.z) * k;
      petState.trick = Math.max(0, petState.trick - dt);
      const moving = Math.abs(tx - petPos.x) > .2, hop = moving ? Math.abs(Math.sin(t * 10)) * .15 : 0;
      pet.root.position.set(petPos.x, petPos.y + hop + (petState.trick > 0 ? Math.sin((1.2 - petState.trick) / 1.2 * Math.PI) * .9 : 0), petPos.z);
      pet.root.rotation.y = (petState.trick > 0 ? (1.2 - petState.trick) * 6 : 0) + (Math.sign(P.x - petPos.x) || 1) * .7;
      pet.ears.forEach((e, i) => { e.rotation.x = Math.sin(t * 8 + i) * (moving ? .25 : .08); });
      pet.tail.rotation.y = Math.sin(t * 10) * .5;
    }
    // critters: bob, wave when you're near, act when tapped
    for (const c of critters) {
      c.t += dt; c.act = Math.max(0, c.act - dt);
      const near = Math.abs(P.x - c.x) < 3.5 && Math.abs(P.y - c.y) < 3; c.near += ((near ? 1 : 0) - c.near) * Math.min(1, dt * 4);
      const p = c.parts, a = c.act;
      c.root.position.y = c.y + Math.abs(Math.sin(c.t * 2)) * .03 + (a > 0 && c.kind !== 'owl' ? Math.abs(Math.sin(a * 8)) * .35 : 0);
      c.root.rotation.y = Math.sin(c.t * .7) * .2 + (c.near > .5 ? Math.sign(P.x - c.x) * .4 : 0) + (c.kind === 'penguin' && a > 0 ? (1.6 - a) * 8 : 0);
      if (p.arm) p.arm.rotation.z = c.near > .5 || a > 0 ? 1.8 + Math.sin(c.t * 12) * .5 : .2;
      if (p.head) p.head.rotation.z = Math.sin(c.t * 1.5) * .08;
      if (c.kind === 'owl' && p.eyes) p.eyes.forEach(e => { e.scale.y = c.near > .5 || a > 0 ? 1 : .12; });
      if (c.kind === 'frog' && p.drumTop) p.drumTop.position.y = .57 - (a > 0 ? Math.abs(Math.sin(a * 22)) * .05 : 0);
      if (c.kind === 'bear') p.bunch.position.y = 2.6 + Math.sin(c.t * 1.6) * .08;
    }
    // balloon floats above you on a string
    balloon.visible = str.visible = !!world.balloon && !(P.ride && P.ride.type === 'slide');
    if (world.balloon) {
      bMat.color.set(world.balloon);
      const hx = P.x - P.facing * .3, hy = P.y + 1.2, tx = hx - P.vx * .08 + Math.sin(t * 1.3) * .2, ty = hy + 1.9;
      bVel.x += (tx - bPos.x) * 14 * dt; bVel.y += (ty - bPos.y) * 14 * dt; bVel.z += (P.z - .3 - bPos.z) * 10 * dt; bVel.multiplyScalar(Math.exp(-dt * 4));
      bPos.addScaledVector(bVel, dt); if (Math.abs(bPos.x - hx) > 10) bPos.set(hx, ty, P.z);
      balloon.position.copy(bPos); balloon.rotation.z = -bVel.x * .1;
      const pa = str.geometry.attributes.position; pa.setXYZ(0, hx, hy, P.z); pa.setXYZ(1, bPos.x, bPos.y - .45, bPos.z); pa.needsUpdate = true;
    }
    // floating sparkles drift around the camera view
    const cx = G.camera.position.x, cy = G.camera.position.y - 2.4;
    for (let i = 0; i < MN; i++) { const s = mSeed[i]; let x = s[0] + Math.sin(t * .3 + s[3]) * 1.5, y = s[1] + ((t * .25 + s[3]) % 7); x = ((x - cx) % 30 + 45) % 30 - 15 + cx; mPos[i * 3] = x; mPos[i * 3 + 1] = cy + y - 1; mPos[i * 3 + 2] = s[2] + Math.cos(t * .4 + s[3]); }
    mGeo.attributes.position.needsUpdate = true;
  }
  function restored() { world.petDraft = world.petDraft || { col: 0, ears: 0, tail: 0, pat: 0 }; rebuildPreview(); if (world.pet) spawnPet(player.x - 1.2, player.y, 0); }
  return { update, restored, hasPet: () => !!pet, petPos, critters };
}
