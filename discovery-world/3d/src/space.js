// ===================================================================
// space.js (build 45): THE SPACE ROCKET. From the launch pad in the Lab Gardens, Dawson flies to the Moon, Mercury,
// Venus, Mars, Jupiter, Saturn, Uranus, Neptune or Pluto, and back home to Earth.
//
// GRAVITY IS REAL (relative to Earth): each place uses its real surface gravity, so a jump goes as many times higher
// (and lasts as many times longer) as it really would: about 6x on the Moon, 16x on Pluto, and only 0.4x on Jupiter.
// The game's Earth gravity is tuned for play (24 units/s² with a 9.4 m/s jump), so each place multiplies it by
// (its gravity / Earth's 9.81 m/s²). Values: NASA planetary fact sheets (surface; for the gas giants, the cloud tops
// at 1 bar, where scientists measure their gravity).
//
// Jupiter, Saturn, Uranus and Neptune have no solid ground, so there you stand on a floating space platform in the
// clouds (and the voice says so). Everything is pictures and spoken words. Each place is built the first time you
// visit and hidden when you leave, so it costs nothing anywhere else; materials are the world's shared toy materials.
// ===================================================================
import * as THREE from 'three';
import { toy } from './creatures.js';

export const SPACE = { ox: 5000, gap: 200, w: 110 };
// [id, picture colours for the menu, gravity m/s², gas giant?, what the voice says when you arrive]
export const PLACES = [
  ['moon', ['#e8e8ec', '#9a9aa6'], 1.62, false, "The Moon! There's not much gravity here, so you can jump about six times higher. Look, there's Earth!"],
  ['mercury', ['#c9b8a6', '#7a6a5c'], 3.70, false, "Mercury, the planet closest to the Sun! It's small and rocky. Jump! You go about two and a half times higher."],
  ['venus', ['#ffe0a0', '#d9a24a'], 8.87, false, "Venus! It's covered in thick yellow clouds and it's very, very hot. Its gravity is almost like Earth's."],
  ['mars', ['#ff8a5c', '#b2462a'], 3.71, false, "Mars, the red planet! Its dust is red like rust. Jump! You go about two and a half times higher."],
  ['jupiter', ['#f0d2a8', '#c0763a'], 24.79, true, "Jupiter, the biggest planet! It's made of gas, so we're standing on a floating space platform in its clouds. The gravity is so strong you can only do tiny hops!"],
  ['saturn', ['#f5e2a8', '#cfa860'], 10.44, true, "Saturn, the planet with the beautiful rings! It's made of gas, so we're on a floating space platform. Its gravity is about like Earth's."],
  ['uranus', ['#b8f0f0', '#5ac8d8'], 8.69, true, "Uranus, the ice giant that spins on its side! We're on a floating space platform in its blue-green clouds."],
  ['neptune', ['#7fa8ff', '#2f4fd0'], 11.15, true, "Neptune, the windy blue planet, far, far away! We're on a floating space platform in its clouds."],
  ['pluto', ['#f0dcc8', '#a8806a'], 0.62, false, "Pluto, far out in the cold! It's tiny and icy, with a big heart shape. Jump! You go about sixteen times higher and float down slowly."],
];
export const EARTH_G = 9.81;

export function initSpace(G, api) {
  const { scene, Sound, player: P } = api;
  const built = {}, groups = {}; let here = null, jumpTop = 0, jumpFrom = 0, told = {};
  const say = (m, speak) => api.toast(m, speak), disc = (id, m) => api.discover(id, m);
  const sky = new THREE.Mesh(new THREE.BoxGeometry(400, 300, .5), toy('#070a22', { em: '#070a22', ei: 1, r: 1 })); sky.material = sky.material.clone(); /* (its colour changes per place) */ sky.visible = false; sky.userData.dynamic = true; scene.add(sky);
  const starGeo = new THREE.SphereGeometry(.12, 6, 4), starMat = toy('#ffffff', { em: '#ffffff', ei: 1 });
  const stars = new THREE.InstancedMesh(starGeo, starMat, 260); { const m = new THREE.Matrix4(); for (let i = 0; i < 260; i++) { m.makeTranslation((Math.random() - .5) * 360, (Math.random() - .5) * 220, 0); stars.setMatrixAt(i, m); } } stars.visible = false; stars.userData.dynamic = true; stars.frustumCulled = false; scene.add(stars);
  const placeX = i => SPACE.ox + i * SPACE.gap;

  function build(i) {
    const [id, [c1, c2], , gas] = PLACES[i], X = placeX(i), g = new THREE.Group(); g.name = 'space:' + id; g.userData.dynamic = true; groups[id] = g; built[id] = true;
    const add = o => { g.add(o); return o; }, box = (x, y, z, w, h, d, c, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toy(c, o)); m.position.set(x, y + h / 2, z); return add(m); }, ball = (x, y, z, r, c, o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), toy(c, o)); m.position.set(x, y, z); return add(m); };
    if (!gas) {
      box(X + SPACE.w / 2, -8, -6, SPACE.w + 60, 8, 40, c1, { r: .95 });
      for (let k = 0; k < 14; k++) { const cr = ball(X + 6 + k * 7.7 + (k % 3), -.15, -3 - (k % 4) * 3.2, .9 + (k % 3) * .5, c2, { r: .95 }); cr.scale.y = .18; }
      for (let k = 0; k < 10; k++) { const r = ball(X + 10 + k * 10, .25, -5 - (k % 3) * 2.5, .35 + (k % 4) * .18, c2, { r: .9 }); r.scale.y = .7; }
    } else {
      // swirling cloud bands far below the platform, and the platform itself (with railings)
      for (let k = 0; k < 6; k++) box(X + SPACE.w / 2, -30 - k * 3, -20 + k * 2, 500, 3, 60, k % 2 ? c1 : c2, { r: .9 });
      box(X + SPACE.w / 2, -.6, -1, 44, .6, 8, '#c9d3df', { r: .4, m: .5 }); for (const s of [-1, 1]) box(X + SPACE.w / 2, 0, -1 + s * 3.6, 44, .9, .12, '#ffd23f', { r: .4 });
      for (let k = 0; k < 8; k++) { const lamp = ball(X + SPACE.w / 2 - 20 + k * 5.7, .15, 2.6, .18, '#9fe6ff', { em: '#9fe6ff', ei: 1 }); }
    }
    // the parked rocket (tap it to fly somewhere else, or home)
    const rk = new THREE.Group(); rk.position.set(gas ? X + SPACE.w / 2 - 18 : X + 8, 0, -2.4); add(rk); rocketModel(rk); rk.traverse(o => { if (o.isMesh) o.userData.tap = () => api.openPicker(); }); G.taps.push(rk);
    G.interact.push({ x: gas ? X + SPACE.w / 2 - 18 : X + 8, y: 0, layer: 'space', disc: 'space_' + id, run: () => api.openPicker(), hintY: 4.6 });
    // a tall measuring pole: stripes every metre, so you can see how high you jump
    for (let m = 0; m < 30; m++) box(gas ? X + SPACE.w / 2 - 4 : X + 20, m, -1.6, .25, 1, .25, m % 2 ? '#ffffff' : '#ff4f9a', { r: .5 });
    // what you see in the sky at each place
    if (id === 'moon') { const e = ball(X + 60, 26, -38, 6, '#3d7be0', { r: .5, em: '#1d4fa8', ei: .3 }); ball(X + 58, 28, -33, 2.6, '#5fbf6a', { r: .7 }); ball(X + 63, 24, -33, 2, '#5fbf6a', { r: .7 }); e.userData.spin = 1; box(X + 34, 0, -2.6, .08, 2.6, .08, '#ffffff'); box(X + 34.6, 1.9, -2.6, 1.1, .7, .04, '#ff4f6a'); }
    if (id === 'mercury') ball(X + 70, 22, -45, 11, '#fff3a6', { em: '#ffd23f', ei: 1 });
    if (id === 'mars') { const rv = new THREE.Group(); rv.position.set(X + 46, 0, -3); add(rv); const bd = new THREE.Mesh(new THREE.BoxGeometry(2, .6, 1.3), toy('#e8e8ec', { r: .4, m: .4 })); bd.position.y = .8; rv.add(bd); for (const [x, z] of [[-.8, -.7], [0, -.7], [.8, -.7], [-.8, .7], [0, .7], [.8, .7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .2, 12), toy('#3a3a46')); w.rotation.x = Math.PI / 2; w.position.set(x, .25, z); rv.add(w); } const ms = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 8), toy('#e8e8ec')); ms.position.set(.6, 1.6, 0); rv.add(ms); const cam = new THREE.Mesh(new THREE.BoxGeometry(.4, .25, .25), toy('#3a3a46')); cam.position.set(.6, 2.1, 0); rv.add(cam);
      rv.traverse(o => { if (o.isMesh) o.userData.tap = () => { Sound.tone(700, .1, 'square', .03, 1.2); say('🤖 A robot rover! It explores Mars and takes pictures.', true); disc('rover'); }; }); G.taps.push(rv); }
    if (id === 'jupiter') { const spot = ball(X + 70, -24, -60, 9, '#d8573a', { r: .8 }); spot.scale.set(1.6, .7, .3); }
    if (id === 'saturn') { const ring = new THREE.Mesh(new THREE.TorusGeometry(40, 4, 6, 64), toy('#e8d29a', { r: .7 })); ring.position.set(X + 55, 18, -70); ring.rotation.x = 1.25; add(ring); const ring2 = new THREE.Mesh(new THREE.TorusGeometry(48, 2, 6, 64), toy('#cfb07a', { r: .7 })); ring2.position.copy(ring.position); ring2.rotation.copy(ring.rotation); add(ring2); }
    if (id === 'pluto') { const h1 = ball(X + 52, -.12, -6, 3, '#ffffff', { r: .9 }), h2 = ball(X + 56, -.12, -6, 3, '#ffffff', { r: .9 }); h1.scale.y = h2.scale.y = .05; const tip = new THREE.Mesh(new THREE.ConeGeometry(4.2, 5, 4), toy('#ffffff', { r: .9 })); tip.rotation.set(-Math.PI / 2, 0, Math.PI / 4); tip.scale.set(1, 1, .02); tip.position.set(X + 54, -.1, -9.2); add(tip); ball(X + 75, 20, -40, 3.5, '#9a9aa6', { r: .9 }); }
    g.traverse(o => { if (o.isMesh) o.castShadow = false; });
    scene.add(g); api.compile && api.compile(g);
  }
  function rocketModel(rk) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1, 4.4, 28), toy('#ffffff', { r: .3 })); body.position.y = 2.6; rk.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.7, 28), toy('#ff4f9a')); nose.position.y = 5.65; rk.add(nose);
    for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.4, 1.1), toy('#2fa8ff')); const a = i * 2.09; f.position.set(Math.cos(a) * .95, .9, Math.sin(a) * .95); f.rotation.y = -a; rk.add(f); }
    const win = new THREE.Mesh(new THREE.SphereGeometry(.36, 16, 10), toy('#9fe6ff', { em: '#9fe6ff', ei: .5 })); win.position.set(0, 3.6, .78); rk.add(win);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.96, .96, .3, 28), toy('#ffd23f')); band.position.y = 1.6; rk.add(band);
  }

  // ---------- flying ----------
  function goTo(i) {
    if (!built[PLACES[i][0]]) build(i);
    const [id, , grav, gas, hello] = PLACES[i]; here = id; G.spaceG = grav / EARTH_G;
    G.spaceBounds = gas ? [placeX(i) + SPACE.w / 2 - 21, placeX(i) + SPACE.w / 2 + 21] : [placeX(i) + 1, placeX(i) + SPACE.w - 1];
    api.flash(); P.ride = null; P.layer = 'space'; P.x = gas ? placeX(i) + SPACE.w / 2 - 14 : placeX(i) + 12; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.jumps = 0; jumpTop = 0;
    show(); api.snap(); Sound.chime();
    say(`🚀 ${hello}`, true); disc('space_' + id); disc('space'); told = {};
  }
  function goHome() { here = null; G.spaceG = 1; api.home(); show(); }
  function show() {
    const on = P.layer === 'space';
    for (const k in groups) groups[k].visible = on && k === here;
    sky.visible = stars.visible = on;
    if (on) { sky.material.color.set(here === 'venus' ? '#c9922a' : here === 'mars' ? '#8a4a2a' : '#070a22'); sky.material.emissive.set(sky.material.color); stars.visible = here !== 'venus'; }
  }
  // the jump report: after each big jump, how high you went (the real gravity makes the difference)
  function update(dt, t) {
    if (P.layer !== 'space') { if (here) { here = null; G.spaceG = 1; show(); } return; }
    const i = PLACES.findIndex(p => p[0] === here); if (i < 0) return;
    const [, , grav, gas] = PLACES[i], X = placeX(i);
    sky.position.set(api.camX(), P.y, -45); stars.position.set(api.camX() * .9, P.y * .9, -44);
    if (gas && P.x > X + SPACE.w / 2 + 21) P.x = X + SPACE.w / 2 + 21; // (stay on the floating platform)
    if (gas && P.x < X + SPACE.w / 2 - 21) P.x = X + SPACE.w / 2 - 21;
    if (!P.grounded) jumpTop = Math.max(jumpTop, P.y);
    else if (jumpTop > .3) { const h = jumpTop; jumpTop = 0; if (!told[Math.round(h)]) { told[Math.round(h)] = 1; const m = Math.round(h * 10) / 10; say(m >= 1 ? `⭐ You jumped ${m >= 3 ? Math.round(m) : m} metres high!` : '⭐ A tiny hop! Gravity is very strong here!', true); disc('spacejump', 'Jump on each planet: the gravity is different everywhere!'); } }
    for (const k in groups) if (groups[k].visible) groups[k].traverse(o => { if (o.userData.spin) o.rotation.y += dt * .05; });
  }
  return { goTo, goHome, update, places: PLACES, here: () => here };
}
