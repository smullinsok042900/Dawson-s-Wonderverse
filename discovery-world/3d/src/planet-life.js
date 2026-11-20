// ===================================================================
// planet-life.js (build 107): LIVING CREATURES ON THE PLANETS, and PETS to befriend there.
//
// One small species table for every destination: each creature is ONE mesh (its painted shape, made once and shared),
// with its own way of moving (hop, float, roll, slide, bounce), breathing, looking round, turning to her, waving when
// she comes near, and a reaction when tapped. Characters have a little activity she can join; PETS can be befriended
// with four big picture buttons (✋ pat, 🤗 hug, 🍓 treat, ⚽ play): one happy moment and the pet is hers for good. A
// befriended pet joins the 🐾 friends (the same collection as the Earth pals) and can follow her everywhere.
// Cheap: one draw call per creature, the shared painted material (no new shader); creatures are built with their planet
// and freed with it; only creatures near the camera move (a few per frame); nothing is sent between phones.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat } from './spacekit.js';

const GEO = { ball: new THREE.SphereGeometry(1, 11, 8), cone: new THREE.ConeGeometry(1, 1, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 8), tor: new THREE.TorusGeometry(1, .22, 6, 14) }; // (light: about 150 triangles a ball)
const starGeo = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: true, bevelThickness: .18, bevelSize: .14, bevelSegments: 2 }); g.center(); return g; })();
// two cute eyes with shines, at height y, spread s, looking toward +z, size r
const eyes = (b, y, s, z, r = .07, col = '#2b1d3d') => { for (const k of [-1, 1]) { b.put(GEO.ball, k * s, y, z, col, [r, r * 1.15, r * .6]); b.put(GEO.ball, k * s + r * .3, y + r * .35, z + r * .45, '#ffffff', r * .35); } };
const cheeks = (b, y, s, z) => { for (const k of [-1, 1]) b.put(GEO.ball, k * s, y, z, '#ff9fc8', [.05, .03, .02]); };
const smile = (b, y, z, w = .06) => b.put(GEO.tor, 0, y, z, '#2b1d3d', [w, w, .3], [0, 0, Math.PI]);

// ---------- the species: shape (built facing +z, standing on y = 0), movement, sound, and what tapping does ----------
//   move: hop | float | roll | slide | bounce;  pet: befriendable;  where: spoken when it is still to be found
export const SPECIES = {
  // ---- THE MOON: characters ----
  rocky: { name: 'Rocky', planet: 'moon', move: 'roll', v: 1.4, r: 3, size: 1, voice: 'Rumble rumble!',
    build: b => { b.put(GEO.ball, 0, .55, 0, '#b4b4c2', [.58, .52, .55]); for (const [x, y, z, s] of [[-.32, .82, .2, .12], [.3, .4, .38, .1], [.12, .95, -.2, .14], [-.4, .35, -.2, .11]]) b.put(GEO.ball, x, y, z, '#9a9aa8', [s, s * .6, s]); eyes(b, .66, .17, .48, .085); cheeks(b, .5, .3, .46); smile(b, .47, .5, .07); } },
  lumi: { name: 'Lumi', planet: 'moon', move: 'float', v: 1.6, r: 4, size: .8, hover: 1.6, voice: 'Twinkle twinkle!',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#fff3a6', .42); b.put(GEO.ball, 0, 0, 0, '#ffd23f', .3); for (const k of [-1, 1]) b.put(GEO.ball, k * .42, .12, -.05, '#dff4ff', [.26, .12, .04], [0, k * .3, k * .5]); b.put(GEO.cone, 0, .5, 0, '#ffe36e', [.06, .2, .06]); b.put(GEO.ball, 0, .64, 0, '#ffffff', .06); eyes(b, .06, .13, .38, .07); smile(b, -.07, .4, .05); } },
  boing: { name: 'Boing', planet: 'moon', move: 'bounce', v: 1, r: 2, size: 1.1, voice: 'Boing boing!',
    build: b => { for (const k of [-1, 1]) { b.put(GEO.tor, k * .2, .14, 0, '#9fe6ff', [.12, .12, .5], [Math.PI / 2, 0, 0]); b.put(GEO.tor, k * .2, .28, 0, '#9fe6ff', [.12, .12, .5], [Math.PI / 2, 0, 0]); b.put(GEO.ball, k * .2, .04, .06, '#62b8e8', [.16, .06, .22]); }
      b.put(GEO.ball, 0, .78, 0, '#c9a6ff', [.42, .45, .4]); b.put(GEO.ball, 0, .64, .2, '#efe2ff', [.26, .24, .2]); for (const k of [-1, 1]) b.put(GEO.cone, k * .18, 1.24, 0, '#c9a6ff', [.07, .26, .07], [0, 0, -k * .2]); eyes(b, .9, .15, .36, .08); cheeks(b, .76, .28, .33); smile(b, .74, .39, .06); } },
  // ---- THE MOON: pets ----
  moonpup: { name: 'Moonpup', planet: 'moon', pet: true, move: 'hop', v: 2, r: 2.5, size: .92, voice: 'Arf arf!', where: 'on the Moon', emoji: '🐶',
    build: b => { b.put(GEO.ball, 0, .38, -.05, '#f4f1ff', [.32, .28, .4]); b.put(GEO.ball, 0, .68, .26, '#f4f1ff', [.28, .26, .26]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .25, .66, .2, '#c9b6ff', [.08, .2, .1], [0, 0, k * .4]); b.put(GEO.ball, k * .16, .1, .14, '#e6e0ff', .1); b.put(GEO.ball, k * .16, .1, -.22, '#e6e0ff', .1); }
      b.put(GEO.ball, 0, .62, .5, '#ffb3d0', [.06, .045, .04]); b.put(GEO.tor, 0, .6, -.48, '#ffe36e', [.16, .16, .6], [0, Math.PI / 2, 0]); eyes(b, .74, .1, .48, .06); cheeks(b, .62, .18, .46); } },
  craterhop: { name: 'Hopscotch', planet: 'moon', pet: true, move: 'hop', v: 2.2, r: 3, size: .86, hopH: .5, voice: 'Hop hop!', where: 'in the crater', emoji: '🐸',
    build: b => { b.put(GEO.ball, 0, .42, 0, '#b9b9c9', [.34, .3, .3]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .2, .08, .1, '#8a8a9c', [.16, .07, .26]); b.put(GEO.cyl, k * .1, .76, 0, '#8a8a9c', [.02, .2, .02]); b.put(GEO.ball, k * .1, .88, 0, '#ff9fc8', .06); }
      for (const [x, y] of [[-.15, .55], [.18, .3], [.05, .2]]) b.put(GEO.ball, x, y, .27, '#a2a2b4', .05); eyes(b, .5, .12, .27, .075); smile(b, .36, .3, .05); } },
  stardrop: { name: 'Stardrop', planet: 'moon', pet: true, move: 'float', v: 1.8, r: 3, size: .74, hover: 1.2, voice: 'Ting!', where: 'up in the sky', emoji: '⭐',
    build: b => { b.put(starGeo, 0, 0, 0, '#ffd23f', [.42, .42, .42]); eyes(b, .05, .12, .17, .055); cheeks(b, -.06, .2, .16); smile(b, -.06, .18, .04); } },
  dustbun: { name: 'Dustbun', planet: 'moon', pet: true, move: 'hop', v: 1.7, r: 2, size: .8, voice: 'Puff!', where: 'near the moon base', emoji: '🐰',
    build: b => { for (const [x, y, z, s] of [[0, .36, 0, .32], [-.18, .3, .1, .2], [.18, .3, .1, .2], [0, .5, -.05, .24], [-.14, .48, -.12, .18], [.15, .46, -.14, .18]]) b.put(GEO.ball, x, y, z, '#d9cdf2', s);
      for (const k of [-1, 1]) b.put(GEO.ball, k * .12, .82, -.02, '#e9dfff', [.07, .26, .06], [0, 0, -k * .25]); b.put(GEO.ball, 0, .42, .32, '#ffffff', .1); eyes(b, .5, .1, .3, .055); b.put(GEO.ball, 0, .43, .36, '#ff8fb8', .03); } },
  orbiter: { name: 'Orbit', planet: 'moon', pet: true, move: 'float', v: 1.5, r: 2, size: .74, hover: 1, voice: 'Wheee!', where: 'by the big telescope', emoji: '🪐',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#5aa8ff', .34); b.put(GEO.ball, 0, -.06, .1, '#9fd2ff', [.24, .2, .26]); b.put(GEO.tor, 0, 0, 0, '#ffd6f4', [.56, .56, .35], [Math.PI / 2 - .75, 0, .25]);
      for (const a of [0, 2.1, 4.2]) b.put(GEO.ball, Math.cos(a) * .56, Math.sin(a) * .38, Math.sin(a) * .38, ['#ffe36e', '#ff9fc8', '#c9a6ff'][Math.round(a / 2.1)], .07); eyes(b, .06, .12, .3, .06); smile(b, -.06, .32, .04); } },
  glowsnail: { name: 'Glimmer Snail', planet: 'moon', pet: true, move: 'slide', v: .35, r: 1.5, size: .82, voice: 'Hellooo!', where: 'in a quiet corner', emoji: '🐌',
    build: b => { b.put(GEO.ball, 0, .1, .05, '#d6ffe9', [.22, .1, .5]); b.put(GEO.ball, 0, .3, .42, '#d6ffe9', [.14, .16, .14]); for (const k of [-1, 1]) { b.put(GEO.cyl, k * .06, .5, .44, '#b8f0d4', [.015, .14, .015]); b.put(GEO.ball, k * .06, .58, .44, '#62f0c8', .03); }
      for (let i = 0; i < 4; i++) b.put(GEO.tor, 0, .38 - i * .02, -.08, ['#62f0ff', '#9fe6ff', '#c9a6ff', '#ff9fd8'][i], [.28 - i * .06, .28 - i * .06, 1.2], [0, Math.PI / 2, 0]); eyes(b, .34, .07, .55, .04); } },
};
export const PET_KINDS = Object.keys(SPECIES).filter(k => SPECIES[k].pet);

// one shared painted shape per species (made the first time it is needed, then reused)
const SHAPES = {};
export function creatureMesh(kind) {
  const sp = SPECIES[kind]; if (!sp) return null;
  if (!SHAPES[kind]) { const b = makeBatch(); sp.build(b); SHAPES[kind] = b.geometry ? b.geometry() : b.mesh(shinyMat()).geometry; }
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const m = new THREE.Mesh(SHAPES[kind], shinyMat()); m.castShadow = true; m.scale.setScalar(sp.size || 1); body.add(m);
  g.userData.body = body; g.userData.kind = kind; g.userData.dynamic = true; return g;
}
// how a pet moves while following her (the 🐾 friends call this every frame)
export function animate(kind, g, t, moving) {
  const sp = SPECIES[kind], body = g.userData.body; if (!sp || !body) return; const ph = (g.userData.ph ??= Math.random() * 6);
  const breathe = 1 + Math.sin(t * 2.2 + ph) * .03; body.scale.set(1 / Math.sqrt(breathe), breathe, 1 / Math.sqrt(breathe));
  if (sp.move === 'float') body.position.y = (sp.hover || 1) + Math.sin(t * 2 + ph) * .12;
  else if (sp.move === 'hop' || sp.move === 'bounce') body.position.y = moving ? Math.abs(Math.sin(t * (sp.move === 'bounce' ? 7 : 10) + ph)) * (sp.hopH || .25) : 0;
  else if (sp.move === 'roll') { body.rotation.x = moving ? body.rotation.x + .12 : body.rotation.x * .9; body.position.y = 0; }
  else body.position.y = 0;
  if (sp.move === 'float') body.rotation.z = Math.sin(t * 1.6 + ph) * .12;
}

// ---------- creatures living on a planet (called from that planet's builder: built and freed with it) ----------
// spots: [[kind, x, z], ...] (x from the planet's start). k: the planet kit (add, U, tapIt, say, Sound, P, G, api, X, ground)
export function populate(k, spots) {
  const P = k.P, G = k.G, list = [];
  for (const [kind, dx, z] of spots) {
    const sp = SPECIES[kind]; if (!sp) continue;
    if (sp.pet && G.expansion && G.expansion.isPal && G.expansion.isPal(kind)) continue; // (already her friend: it is with her, or waits in 🐾)
    const g = creatureMesh(kind), x0 = k.X + dx; g.position.set(x0, 0, z); k.add(g);
    const c = { kind, sp, g, x0, z0: z, x: x0, z, tx: x0, tz: z, rest: 1 + Math.random() * 3, greeted: false, act: 0, look: 0, gone: false };
    k.tapIt(g, () => tapped(c), x0, sp.pet ? 'pet_' + kind : 'pal_' + kind); list.push(c);
  }
  const gY = (x, z) => (k.ground ? k.ground(x, z) : 0);
  function tapped(c) {
    if (c.gone) return; c.act = 1.2; k.Sound.giggle && k.Sound.giggle(); k.api.burst(c.g.position.x, c.g.position.y + 1, c.g.position.z, ['#ffffff', '#ffe36e', '#ff9fd8'], 12, 2);
    if (c.sp.pet) { befriend(k, c); return; }
    // the characters' little games
    if (c.kind === 'rocky') { k.say(`🪨 ${c.sp.voice} Catch me if you can!`, true); c.tx = c.x + (P.x < c.x ? 8 : -8); c.run = 3; }
    else if (c.kind === 'lumi') { k.say('✨ Lumi lights up the stars for you!', true); for (let i = 0; i < 8; i++) k.api.burst(c.x + (i - 4) * 1.4, 3 + Math.sin(i) * 1.5, c.z - 1, ['#fff3a6', '#ffffff', '#9fe6ff'], 6, 1.4); k.Sound.chime && k.Sound.chime();
      const hidden = list.find(q => q.sp.pet && !q.gone && Math.abs(q.x - c.x) < 60); if (hidden) { c.tx = hidden.x - 1.5; c.lead = hidden; setTimeout(() => k.say(`✨ Look! ${hidden.sp.name} is over here!`, true), 1600); } }
    else if (c.kind === 'boing') { k.say('🦘 Boing boing! Jump with me!', true); c.bounceBig = 2.2; }
    else k.say(`😊 ${c.sp.voice}`, true);
  }
  // only creatures near the camera move; a few at a time
  k.U.push((dt, t) => {
    for (const c of list) {
      if (c.gone) continue; const far = Math.abs(c.x - P.x) > 45 || P.layer !== 'space'; c.g.visible = !far; if (far) continue;
      const sp = c.sp, near = Math.abs(P.x - c.x) < 4 && Math.abs(P.y - (c.g.position.y)) < 3;
      if (near && !c.greeted) { c.greeted = true; c.act = Math.max(c.act, .8); k.say(sp.pet ? `${sp.emoji || '💖'} ${sp.name} waves at you! Tap to make friends!` : `👋 ${sp.name}: ${sp.voice}`, false); }
      if (!near && Math.abs(P.x - c.x) > 10) c.greeted = false;
      c.act = Math.max(0, c.act - dt); c.run = Math.max(0, (c.run || 0) - dt);
      // wander: pick a new spot near home now and then (or run / lead when asked)
      if (!c.run && !c.lead && (c.rest -= dt) < 0) { c.rest = 2 + Math.random() * 4; c.tx = c.x0 + (Math.random() - .5) * 2 * sp.r; c.tz = c.z0 + (Math.random() - .5) * .8; }
      if (c.lead && Math.abs(c.x - c.tx) < .4 && Math.abs(P.x - c.x) < 4) { c.lead = null; c.x0 = c.x; }
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz), v = sp.v * (c.run ? 2.5 : 1), moving = d > .15 && sp.move !== 'none';
      if (moving) { const s = Math.min(d, v * dt) / d; c.x += dx * s; c.z += dz * s; }
      const face = near && !moving ? Math.atan2(P.x - c.x, 2.5 - c.z) : moving ? Math.atan2(dx, dz) : c.yaw ?? 0; c.yaw = (c.yaw ?? 0) + (((face - (c.yaw ?? 0) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 5);
      const g = c.g; g.position.set(c.x, gY(c.x, c.z), c.z); g.rotation.y = c.yaw;
      animate(c.kind, g, t, moving);
      if (sp.move === 'bounce') { const hb = c.bounceBig > 0 ? 1.6 : .25; if (c.bounceBig > 0) c.bounceBig -= dt; g.userData.body.position.y = Math.abs(Math.sin(t * (c.bounceBig > 0 ? 4 : 6))) * hb; if (c.bounceBig > 0 && P.vy > 3 && near) { c.bounceBig = 2.2; } }
      if (c.act > 0) { g.userData.body.position.y += Math.abs(Math.sin(c.act * 9)) * .35; g.rotation.y += Math.sin(c.act * 14) * .4; } // (a happy wiggle and hop)
      else if (near) g.userData.body.rotation.z = Math.sin(t * 9) * .1; // (a little wave)
    }
  });
  return list;
}

// ---------- making friends with a pet: four big picture buttons ----------
let panel = null, cur = null;
function befriend(k, c) {
  if (!panel) {
    const st = document.createElement('style'); st.textContent = `#befriend{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(140%);transition:transform .22s;z-index:34;display:flex;gap:12px;padding:12px 14px;background:linear-gradient(160deg,#fffdf6,#ffe8f6);border:5px solid #fff;border-radius:30px;box-shadow:0 8px 0 #c26a9a55,0 18px 40px #29104c66}
#befriend.show{transform:translateX(-50%) translateY(0)}#befriend button{border:none;width:clamp(64px,17vh,86px);height:clamp(64px,17vh,86px);border-radius:24px;background:#fff;box-shadow:0 5px 0 #f0b6d6;font-size:clamp(36px,10vh,50px);padding:0}
#befriend button.x{background:#efe4ff;box-shadow:0 5px 0 #c9b6e8;font-size:30px;width:56px}`; document.head.appendChild(st);
    panel = document.createElement('div'); panel.id = 'befriend'; panel.innerHTML = ['✋', '🤗', '🍓', '⚽'].map((e, i) => `<button data-a="${i}" aria-label="${['pat', 'hug', 'treat', 'play'][i]}">${e}</button>`).join('') + '<button class="x" data-a="x" aria-label="not now">✖</button>'; document.body.appendChild(panel);
    panel.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (cur) cur(b.dataset.a); }));
  }
  const sp = c.sp; k.say(`${sp.emoji || '💖'} ${sp.name}! Pat it, hug it, give it a treat, or play!`, true);
  panel.classList.add('show');
  cur = a => {
    panel.classList.remove('show'); cur = null; if (a === 'x') return;
    const g = c.g, x = g.position.x, y = g.position.y, z = g.position.z;
    if (a === '2') k.api.burst(x, y + 1, z + .3, ['#ff4f6a', '#7fe0a0', '#ffffff'], 14, 1.6); // (a strawberry treat)
    if (a === '3') { for (let i = 0; i < 4; i++) setTimeout(() => k.api.burst(x + (i - 1.5) * .6, .5 + (i % 2) * .8, z + .5, ['#ffffff', '#ff6a3c'], 6, 1.2), i * 180); } // (a bouncing ball)
    k.api.burst(x, y + 1.2, z, ['#ff6fae', '#ffd1ec', '#ffffff', '#ffe36e'], 26, 2.6); k.Sound.chime && k.Sound.chime(); k.Sound.giggle && k.Sound.giggle(); c.act = 2;
    const E = k.G.expansion, on = E && E.befriend ? E.befriend(c.kind) : false;
    k.say(`💖 ${sp.name} loves you! ${on ? 'It is coming with you everywhere!' : 'It is waiting in your 🐾 friends: tap 🐾 to bring it along!'}`, true); k.disc && k.disc('pet_' + c.kind);
    setTimeout(() => { c.gone = true; if (c.g.parent) c.g.parent.remove(c.g); }, 900); // (it goes to her: the follower appears beside her)
  };
}
