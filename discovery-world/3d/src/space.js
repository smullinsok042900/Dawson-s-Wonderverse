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
// Jupiter, Saturn, Uranus and Neptune are really made of gas. At the family's request (build 47) you land on each one's
// own walkable swirly clouds, in its own colours; the voice still says, kindly, that the planet is really made of gas.
// Their gravity is the real value at the cloud tops (1 bar). Every place has its own sky, its own activities that fit the
// planet, and its own kind of alien. Everything is pictures and spoken words. Each place is built the first time you
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
  ['jupiter', ['#f0d2a8', '#c0763a'], 24.79, true, "Jupiter, the biggest planet! Jupiter is really made of gas, but in our game you can walk on its swirly clouds. The gravity is so strong you can only do tiny hops!"],
  ['saturn', ['#f5e2a8', '#cfa860'], 10.44, true, "Saturn, the planet with the beautiful rings! Saturn is really made of gas, but in our game you can walk on its golden clouds. Its gravity is about like Earth's."],
  ['uranus', ['#b8f0f0', '#5ac8d8'], 8.69, true, "Uranus, the ice giant that spins on its side! It's really made of gas and ice, but in our game you can walk on its blue-green clouds."],
  ['neptune', ['#7fa8ff', '#2f4fd0'], 11.15, true, "Neptune, the windy blue planet, far, far away! It's really made of gas and ice, but in our game you can walk on its deep blue clouds."],
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

  // ---------- (build 47) each place is its own world: its own ground (the gas giants: walkable swirly clouds), its own
  // sky, things to do that fit that planet, and its own kind of alien ----------
  const ups = {}; // per place: little animations, run only while you're there
  const SKYCOL = { moon: '#06071a', mercury: '#0a0710', venus: '#c9922a', mars: '#b8794a', jupiter: '#2a1608', saturn: '#2a2410', uranus: '#0a2e34', neptune: '#06143d', pluto: '#05050f' };
  function build(i) {
    const [id, [c1, c2], , gas] = PLACES[i], X = placeX(i), MID = X + SPACE.w / 2, g = new THREE.Group(); g.name = 'space:' + id; g.userData.dynamic = true; groups[id] = g; built[id] = true; const U = ups[id] = [];
    const add = o => { g.add(o); return o; }, box = (x, y, z, w, h, d, c, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toy(c, o)); m.position.set(x, y + h / 2, z); return add(m); }, ball = (x, y, z, r, c, o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), toy(c, o)); m.position.set(x, y, z); return add(m); };
    const tapIt = (obj, fn, x, id2) => { obj.traverse(o => { if (o.isMesh) o.userData.tap = fn; }); G.taps.push(obj); if (id2) G.interact.push({ x, y: 0, layer: 'space', disc: id2, run: fn, hintY: 2.4 }); return obj; };
    // THE GROUND: rocky planets get craters and rocks; the gas giants get soft swirly cloud ground in their own colours
    box(MID, -8, -6, SPACE.w + 60, 8, 40, c1, { r: .95 });
    if (!gas) {
      for (let k = 0; k < 14; k++) { const cr = ball(X + 6 + k * 7.7 + (k % 3), -.15, -3 - (k % 4) * 3.2, .9 + (k % 3) * .5, c2, { r: .95 }); cr.scale.y = .18; }
      for (let k = 0; k < 10; k++) { const r = ball(X + 10 + k * 10, .25, -5 - (k % 3) * 2.5, .35 + (k % 4) * .18, c2, { r: .9 }); r.scale.y = .7; }
    } else {
      const BANDS = { jupiter: ['#f0d2a8', '#c0763a', '#e8b07a', '#fff0dc'], saturn: ['#f5e2a8', '#e8c97a', '#fff3d0', '#d9b46a'], uranus: ['#b8f0f0', '#8fe0e8', '#d8fbfb', '#6fcfd8'], neptune: ['#7fa8ff', '#2f4fd0', '#5a82f0', '#a8c4ff'] }[id];
      for (let k = 0; k < 8; k++) box(MID, -.05, 3 - k * 3.2, SPACE.w + 60, .1, 3.2, BANDS[k % 4], { r: .9 });
      for (let k = 0; k < 22; k++) { const puff = ball(X + 3 + k * 5, .1, -4 - (k % 4) * 3, 1 + (k % 3) * .5, BANDS[(k + 1) % 4], { r: .9 }); puff.scale.y = .35; U.push((dt, t) => { puff.position.x += Math.sin(t * .3 + k) * dt * .3; }); }
    }
    // the parked rocket (tap it to fly somewhere else, or home) and the striped metre pole
    const rk = new THREE.Group(); rk.position.set(X + 8, 0, -2.4); add(rk); rocketModel(rk); rk.traverse(o => { if (o.isMesh) o.userData.tap = () => api.openPicker(); }); G.taps.push(rk);
    G.interact.push({ x: X + 8, y: 0, layer: 'space', disc: 'space_' + id, run: () => api.openPicker(), hintY: 4.6 });
    for (let m = 0; m < 30; m++) box(X + 20, m, -1.6, .25, 1, .25, m % 2 ? '#ffffff' : '#ff4f9a', { r: .5 });
    // ---------- the ALIENS: a different kind on every planet; tap one and it says hello in its own voice ----------
    const AL = {
      moon: { name: 'Moonbeams', body: '#f4f6ff', eye: 1, ant: 0, shape: 'blob', move: 'hop', note: 900, hi: 'Bloop bloop! We hop SO high on the Moon!' },
      mercury: { name: 'Sizzlers', body: '#ff9a2e', eye: 2, ant: 2, shape: 'spiky', move: 'scurry', note: 700, hi: 'Tsss tsss! It is hot here, so we wear sunglasses!', shades: 1 },
      venus: { name: 'Floaties', body: '#ffe36e', eye: 2, ant: 0, shape: 'jelly', move: 'float', note: 520, hi: 'Wooo! We float in the thick yellow clouds!' },
      mars: { name: 'Marslings', body: '#5fd36a', eye: 3, ant: 2, shape: 'classic', move: 'walk', note: 640, hi: 'Greetings, Earthling! Welcome to the red planet!' },
      jupiter: { name: 'Bloonies', body: '#ff9a5c', eye: 2, ant: 1, shape: 'balloon', move: 'float', note: 300, hi: 'Boom boom! We are big balloons from the biggest planet!' },
      saturn: { name: 'Ringlets', body: '#c9a6ff', eye: 2, ant: 0, shape: 'ringed', move: 'spin', note: 760, hi: 'Wheee! We spin like Saturn\'s rings!' },
      uranus: { name: 'Rollers', body: '#4fd8d0', eye: 2, ant: 1, shape: 'cube', move: 'roll', note: 580, hi: 'Roll roll! On Uranus everything rolls on its side!' },
      neptune: { name: 'Windies', body: '#5a82f0', eye: 2, ant: 0, shape: 'wisp', move: 'swoosh', note: 450, hi: 'Whoosh! The wind is so fast on Neptune!' },
      pluto: { name: 'Heartlings', body: '#ff9fd2', eye: 2, ant: 2, shape: 'heart', move: 'hop', note: 1000, hi: 'Hello, friend! We love our big icy heart!' },
    }[id];
    for (let k = 0; k < 3; k++) { const a = alien(AL); const x0 = X + 30 + k * 22, z0 = -2 - (k % 2) * 1.5; a.position.set(x0, 0, z0); add(a); let boing = 0;
      tapIt(a, () => { boing = 1; Sound.tone(AL.note, .12, 'sine', .05, 1.4); Sound.tone(AL.note * 1.25, .12, 'sine', .05, 1.3, .14); say(`👽 ${AL.hi}`, true); disc('alien_' + id, `Meet the aliens on every planet!`); }, x0, k === 0 ? 'alien_' + id : null);
      U.push((dt, t) => { boing = Math.max(0, boing - dt * 1.5); const ph = t * 1.3 + k * 2, b = a.userData.body;
        if (AL.move === 'hop') a.position.y = Math.abs(Math.sin(ph * 1.5)) * (id === 'moon' ? 1.6 : 1.2);
        if (AL.move === 'float') a.position.y = 1 + Math.sin(ph) * .4;
        if (AL.move === 'walk' || AL.move === 'scurry') { a.position.x = x0 + Math.sin(ph * (AL.move === 'scurry' ? 1.6 : .5)) * 2.5; b.position.y = Math.abs(Math.sin(ph * 6)) * .08; }
        if (AL.move === 'spin') a.rotation.y += dt * 3;
        if (AL.move === 'roll') { a.position.x = x0 + Math.sin(ph * .6) * 3; b.rotation.z = -a.position.x * 1.2; }
        if (AL.move === 'swoosh') { a.position.x = x0 + Math.sin(ph * .9) * 4; a.position.y = .8 + Math.sin(ph * 2) * .3; }
        a.scale.setScalar(1 + Math.sin(boing * 12) * boing * .25); }); }
    // ---------- things to do that fit each planet ----------
    const fact = (m, d) => { say(m, true); disc(d); };
    if (id === 'moon') {
      const e = ball(X + 60, 26, -38, 6, '#3d7be0', { r: .5, em: '#1d4fa8', ei: .3 }); ball(X + 58, 28, -33, 2.6, '#5fbf6a', { r: .7 }); ball(X + 63, 24, -33, 2, '#5fbf6a', { r: .7 }); U.push(dt => { e.rotation.y += dt * .05; });
      tapIt(e, () => fact('🌍 That blue planet is Earth: our home! Wave hello!', 'moonearth'));
      const pole = box(X + 40, 0, -2.6, .08, .1, .08, '#ffffff'), flag = box(X + 40.55, 0, -2.6, 1, .6, .04, '#ff4f6a'); flag.visible = false; let up = 0;
      tapIt(pole, () => { if (up) return; up = .001; fact('🚩 You planted a flag on the Moon!', 'moonflag'); }, X + 40, 'moonflag');
      U.push(dt => { if (!up || up > 1) return; up = Math.min(1.01, up + dt); pole.scale.y = 1 + up * 25; pole.position.y = up * 1.3; flag.visible = up > .6; flag.position.y = .1 + up * 1.9; });
      let rocks = 0; for (let k = 0; k < 5; k++) { const r = ball(X + 48 + k * 3.2, .3, -1.4, .3, '#c9c9d4', { r: .9 }); tapIt(r, () => { if (!r.visible) return; r.visible = false; rocks++; Sound.pop ? Sound.pop() : Sound.click(); say(`🪨 ${['', 'One', 'Two', 'Three', 'Four', 'Five'][rocks]} moon rock${rocks > 1 ? 's' : ''}!`, true); disc('moonrocks'); if (rocks === 5) setTimeout(() => { rocks = 0; g.traverse(o => { if (o.userData.rock) o.visible = true; }); }, 6000); }, k === 0 ? X + 48 : null, k === 0 ? 'moonrocks' : null); r.userData.rock = 1; }
    }
    if (id === 'mercury') {
      const sun = ball(X + 70, 22, -45, 11, '#fff3a6', { em: '#ffd23f', ei: 1 }); let hot = 0; tapIt(sun, () => { hot = 2; Sound.noise && Sound.noise(.8, 1200, 300, .04); fact('☀️ Sizzle! The Sun looks HUGE from Mercury: it\'s the closest planet to the Sun!', 'mercurysun'); }, X + 58, 'mercurysun');
      U.push((dt, t) => { hot = Math.max(0, hot - dt); sun.scale.setScalar(1 + Math.sin(t * 2) * .02 + hot * .08); });
      const btn = box(X + 44, 0, -2.4, 1, .6, 1, '#ff9a2e', { em: '#ff6a00', ei: .4 }); let night = 0;
      tapIt(btn, () => { night = night ? 0 : 1; sky.material.color.set(night ? '#000000' : SKYCOL.mercury); sun.visible = !night; fact(night ? '🌙 Night on Mercury: it gets VERY cold!' : '☀️ Day on Mercury: it gets VERY hot!', 'mercurynight'); }, X + 44, 'mercurynight');
    }
    if (id === 'venus') {
      for (const [x, k] of [[X + 40, 0], [X + 66, 1]]) { const v = new THREE.Mesh(new THREE.ConeGeometry(4, 5, 16), toy('#8a5a3a', { r: .9 })); v.position.set(x, 2.5, -7); add(v); const top = ball(x, 5, -7, .9, '#ff6a2a', { em: '#ff4a00', ei: .8 }); let erupt = 0;
        tapIt(v, () => { erupt = 3; Sound.noise && Sound.noise(1, 120, 600, .06); fact('🌋 Boom! Venus has lots of volcanoes!', 'venusvolcano'); }, x, k === 0 ? 'venusvolcano' : null);
        U.push(dt => { if (erupt <= 0) return; erupt -= dt; if (Math.random() < dt * 30) api.burst && api.burst(x, 5.5, -7, ['#ff6a2a', '#ffd23f', '#ff3a00'], 3, 3); }); }
      const th = box(X + 52, 0, -2.2, .4, 3, .4, '#ffffff', { r: .3 }), red = box(X + 52, .1, -2, .25, .3, .25, '#ff2a2a', { em: '#ff2a2a', ei: .6 }); let heat = 0;
      tapIt(th, () => { heat = .001; fact('🌡️ Venus is the hottest planet: even hotter than an oven!', 'venusheat'); }, X + 52, 'venusheat');
      U.push(dt => { if (!heat) return; heat = Math.min(1, heat + dt * .5); red.scale.y = 1 + heat * 8; red.position.y = .1; });
    }
    if (id === 'mars') {
      const mons = new THREE.Mesh(new THREE.ConeGeometry(30, 14, 24), toy('#a8442a', { r: .95 })); mons.position.set(X + 70, 7, -45); add(mons); tapIt(mons, () => fact('🌋 That\'s Olympus Mons: the biggest volcano in the whole solar system!', 'marsvolcano'));
      const rv = new THREE.Group(); rv.position.set(X + 46, 0, -3); add(rv); const bd = new THREE.Mesh(new THREE.BoxGeometry(2, .6, 1.3), toy('#e8e8ec', { r: .4, m: .4 })); bd.position.y = .8; rv.add(bd); const wheels = []; for (const [x, z] of [[-.8, -.7], [0, -.7], [.8, -.7], [-.8, .7], [0, .7], [.8, .7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .2, 12), toy('#3a3a46')); w.rotation.x = Math.PI / 2; w.position.set(x, .25, z); rv.add(w); wheels.push(w); } const ms = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 8), toy('#e8e8ec')); ms.position.set(.6, 1.6, 0); rv.add(ms); const cam = new THREE.Mesh(new THREE.BoxGeometry(.4, .25, .25), toy('#3a3a46')); cam.position.set(.6, 2.1, 0); rv.add(cam); let drive = 0;
      tapIt(rv, () => { if (drive) return; drive = .001; Sound.tone(500, .3, 'square', .03, 1.4); fact('🤖 Beep beep! The rover drives across Mars to explore!', 'rover'); }, X + 46, 'rover');
      U.push(dt => { if (!drive) return; drive += dt; const k = drive < 4 ? drive / 4 : drive < 8 ? 1 - (drive - 4) / 4 : 0; rv.position.x = X + 46 + Math.sin(k * Math.PI / 2) * 12; rv.rotation.y = drive < 4 ? 0 : Math.PI; for (const w of wheels) w.rotation.y += dt * 5; if (Math.random() < dt * 8) api.burst && api.burst(rv.position.x, .3, -3, ['#c86a40', '#e89a6a'], 1, .8); if (drive > 8) { drive = 0; rv.rotation.y = 0; } });
      const dd = new THREE.Group(); dd.position.set(X + 64, 0, -2.6); add(dd); for (let k = 0; k < 5; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.3 + k * .18, .07, 6, 20), toy('#d88a5a', { r: .9 })); ring.rotation.x = Math.PI / 2; ring.position.y = .4 + k * .5; dd.add(ring); } let swirl = 0;
      tapIt(dd, () => { swirl = 4; Sound.noise && Sound.noise(1.2, 300, 900, .04); fact('🌪️ A dust devil! Twirly winds blow the red dust around on Mars.', 'dustdevil'); }, X + 64, 'dustdevil');
      U.push((dt, t) => { dd.rotation.y += dt * (1 + swirl * 4); swirl = Math.max(0, swirl - dt); dd.position.x = X + 64 + Math.sin(t * .4) * 2; });
    }
    if (id === 'jupiter') {
      const spot = ball(X + 52, .05, -6, 3, '#d8573a', { r: .8 }); spot.scale.set(1.6, .06, 1); let spin = 0;
      tapIt(spot, () => { spin = 4; Sound.noise && Sound.noise(1.2, 200, 700, .05); fact('🌀 The Great Red Spot: a giant storm bigger than our whole Earth!', 'redspot'); }, X + 52, 'redspot');
      U.push(dt => { spot.rotation.y += dt * (.3 + spin * 3); spin = Math.max(0, spin - dt); });
      const cloud = ball(X + 66, 6, -4, 1.6, '#5a4a6a', { r: .9 }); cloud.scale.set(1.6, .7, 1); const bolt = box(X + 66, 0, -3.8, .25, 5.6, .1, '#fff6a0', { em: '#fff3a0', ei: 1.4 }); bolt.visible = false; let zap = 0;
      tapIt(cloud, () => { zap = .4; bolt.visible = true; Sound.noise && Sound.noise(.4, 2000, 200, .06); fact('⚡ Zap! Jupiter has huge lightning storms!', 'jupiterzap'); }, X + 66, 'jupiterzap');
      U.push(dt => { if (zap > 0) { zap -= dt; if (zap <= 0) bolt.visible = false; } });
      const moons = [['#ffd84a', 1.1], ['#e8d8c0', 1.3], ['#9a8a7a', 1.6], ['#5a5a6a', 1.4]].map(([c, r], k) => { const m = ball(X + 30 + k * 7, 14 + (k % 2) * 3, -25, r, c, { r: .9 }); return m; }); let counted = 0;
      moons.forEach((m, k) => tapIt(m, () => { counted = counted % 4 + 1; Sound.tone(500 + counted * 100, .15, 'sine', .05, 1.2); say(`🌕 ${['', 'One', 'Two', 'Three', 'Four'][counted]}!${counted === 4 ? ' Jupiter\'s four big moons!' : ''}`, true); disc('jupitermoons'); }, k === 0 ? X + 34 : null, k === 0 ? 'jupitermoons' : null));
    }
    if (id === 'saturn') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(40, 4, 6, 64), toy('#e8d29a', { r: .7 })); ring.position.set(X + 55, 26, -70); ring.rotation.x = 1.35; add(ring); const ring2 = new THREE.Mesh(new THREE.TorusGeometry(48, 2, 6, 64), toy('#cfb07a', { r: .7 })); ring2.position.copy(ring.position); ring2.rotation.copy(ring.rotation); add(ring2);
      tapIt(ring, () => fact('💍 Saturn\'s rings are made of millions of pieces of ice and rock!', 'saturnrings'));
      let hops = 0; for (let k = 0; k < 5; k++) { const ice = new THREE.Mesh(new THREE.DodecahedronGeometry(.55), toy('#e6f6ff', { r: .3, cc: .8 })); const x = X + 38 + k * 2.6; ice.position.set(x, .6 + (k % 2) * .5, -1.2); add(ice); G.platforms.push({ a: x - .5, b: x + .5, y: 1.1 + (k % 2) * .5, layer: 'space', z: -1.2 });
        tapIt(ice, () => { hops++; Sound.tone(800 + k * 100, .1, 'triangle', .04, 1.3); say(`🧊 Ice from Saturn's rings! ${['', 'One', 'Two', 'Three', 'Four', 'Five'][Math.min(5, k + 1)]}!`, true); disc('saturnice'); }, k === 0 ? x : null, k === 0 ? 'saturnice' : null); U.push((dt, t) => { ice.rotation.y += dt; }); }
      const hex = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, .08, 6), toy('#d9b46a', { r: .7 })); hex.position.set(X + 62, .05, -5); add(hex); tapIt(hex, () => fact('⬡ A six-sided storm! Saturn has a hexagon-shaped storm at its top.', 'saturnhex'), X + 62, 'saturnhex');
    }
    if (id === 'uranus') {
      const roll = ball(X + 44, .7, -2, .7, '#8fe0e8', { r: .4 }); const band = new THREE.Mesh(new THREE.TorusGeometry(.72, .06, 6, 20), toy('#ffffff')); roll.add(band); let rv2 = 0;
      tapIt(roll, () => { rv2 = 6; Sound.boing(); fact('🎳 Uranus spins tipped over on its side, so it rolls like a ball!', 'uranusroll'); }, X + 44, 'uranusroll');
      U.push(dt => { if (rv2 > 0) { rv2 = Math.max(0, rv2 - dt * 1.2); roll.position.x = Math.min(X + 90, roll.position.x + rv2 * dt); roll.rotation.z -= rv2 * dt / .7; } });
      const dc = ball(X + 62, 6, -3, 1.5, '#d8fbfb', { r: .8 }); dc.scale.set(1.6, .7, 1); let rain = 0;
      tapIt(dc, () => { rain = 3; Sound.twinkle ? Sound.twinkle() : Sound.chime(); fact('💎 Sparkle! Scientists think it might rain diamonds deep inside Uranus!', 'diamondrain'); }, X + 62, 'diamondrain');
      U.push(dt => { if (rain > 0) { rain -= dt; if (Math.random() < dt * 25) api.burst && api.burst(X + 61 + Math.random() * 2, 5.4, -3, ['#ffffff', '#cfefff', '#e6f6ff'], 1, .5); } });
    }
    if (id === 'neptune') {
      const sock = new THREE.Group(); sock.position.set(X + 44, 0, -2.4); add(sock); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.4, 8), toy('#ffffff')); pole.position.y = 1.2; sock.add(pole); const cone = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.4, 12), toy('#ff8a3c')); cone.rotation.z = Math.PI / 2; cone.position.set(.7, 2.2, 0); sock.add(cone); let gust = 0;
      tapIt(sock, () => { gust = 3; Sound.noise && Sound.noise(1.5, 300, 1200, .05); fact('💨 Whoosh! Neptune has the fastest winds of any planet!', 'neptunewind'); }, X + 44, 'neptunewind');
      U.push((dt, t) => { cone.rotation.x = Math.sin(t * 8) * (.1 + gust * .2); if (gust > 0) { gust -= dt; if (P.grounded) P.x = Math.min(X + SPACE.w - 2, P.x + dt * 2.5); if (Math.random() < dt * 20) api.burst && api.burst(P.x - 3, 1 + Math.random() * 2, 0, ['#ffffff', '#cfe0ff'], 1, 2); } });
      const gy = box(X + 64, 0, -3, 1.2, .3, 1.2, '#cfe3f7', { r: .6 }); let spout = 0;
      tapIt(gy, () => { spout = 3; Sound.noise && Sound.noise(1, 600, 2400, .04); fact('⛲ An icy geyser! On Neptune\'s moon Triton, icy fountains shoot up.', 'triton'); }, X + 64, 'triton');
      U.push(dt => { if (spout > 0) { spout -= dt; if (Math.random() < dt * 30) api.burst && api.burst(X + 64, .5 + Math.random() * 4, -3, ['#ffffff', '#cfefff'], 2, 1.5); } });
    }
    if (id === 'pluto') {
      for (let k = 0; k < 4; k++) { const h = ball(X + 40 + k * 3, -.12, -3, 2.6, '#ffffff', { r: .3, cc: .8 }); h.scale.y = .05; }
      const heart = (dt) => { const on = P.layer === 'space' && P.grounded && P.x > X + 37.5 && P.x < X + 51.5; if (on && Math.abs(P.vx) > 1 && !(api.keysHeld && api.keysHeld())) { P.x += P.vx * dt * .6; if (!told.slide) { told.slide = 1; fact('⛸️ Wheee! Pluto\'s big heart is made of ice: it\'s slippery!', 'plutoheart'); } } }; U.push(heart);
      G.interact.push({ x: X + 44, y: 0, layer: 'space', disc: 'plutoheart', run: () => fact('💗 Pluto\'s big heart is a giant plain of ice. Run across and slide!', 'plutoheart'), hintY: 1 });
      const charon = ball(X + 75, 20, -40, 3.5, '#9a9aa6', { r: .9 }); tapIt(charon, () => fact('🌑 That\'s Charon, Pluto\'s moon! They dance around each other.', 'charon'), X + 70, 'charon');
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = false; });
    scene.add(g); api.compile && api.compile(g);
  }
  // an alien built from round toy shapes (each planet's kind looks and moves differently)
  function alien(A) {
    const a = new THREE.Group(), body = new THREE.Group(); a.add(body); a.userData.body = body; const m = toy(A.body, { r: .45, cc: .5 }), white = toy('#ffffff'), dark = toy('#2b1d3d');
    const S = (r, x, y, z, mat2 = m) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat2); s.position.set(x, y, z); body.add(s); return s; };
    let headY = .9;
    if (A.shape === 'blob' || A.shape === 'heart') { const b = S(.55, 0, .55, 0); b.scale.y = .85; if (A.shape === 'heart') { S(.32, -.22, .95, 0); S(.32, .22, .95, 0); } headY = .7; }
    else if (A.shape === 'spiky') { S(.45, 0, .45, 0); for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.08, .3, 6), m); const ang = k / 8 * Math.PI * 2; sp.position.set(Math.cos(ang) * .45, .45 + Math.sin(ang) * .45, 0); sp.rotation.z = ang - Math.PI / 2; body.add(sp); } headY = .55; }
    else if (A.shape === 'jelly') { const b = S(.5, 0, .9, 0); b.scale.y = .7; for (let k = 0; k < 5; k++) { const t2 = new THREE.Mesh(new THREE.CylinderGeometry(.04, .02, .7, 6), m); t2.position.set(-.3 + k * .15, .4, 0); body.add(t2); } headY = .95; }
    else if (A.shape === 'classic') { const b = S(.35, 0, .55, 0); b.scale.y = 1.4; S(.4, 0, 1.25, 0); for (const s2 of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .4, 8), m); leg.position.set(s2 * .15, .15, 0); body.add(leg); } headY = 1.3; }
    else if (A.shape === 'balloon') { const b = S(.7, 0, 1, 0); for (let k = 0; k < 3; k++) { const st = new THREE.Mesh(new THREE.TorusGeometry(.7, .04, 6, 24), toy('#ffffff')); st.rotation.x = Math.PI / 2; st.position.y = .75 + k * .25; st.scale.setScalar(Math.cos((k - 1) * .4)); body.add(st); } headY = 1.1; }
    else if (A.shape === 'ringed') { S(.45, 0, .6, 0); const r = new THREE.Mesh(new THREE.TorusGeometry(.7, .06, 6, 24), toy('#ffd23f')); r.rotation.x = 1.3; r.position.y = .6; body.add(r); headY = .7; }
    else if (A.shape === 'cube') { const c = new THREE.Mesh(new THREE.BoxGeometry(.8, .8, .8), m); c.position.y = .45; body.add(c); headY = .55; }
    else if (A.shape === 'wisp') { S(.4, 0, .5, 0); for (let k = 0; k < 3; k++) { const t2 = S(.25 - k * .06, -.4 - k * .3, .45 - k * .05, 0); t2.scale.x = 1.4; } headY = .6; }
    const ex = A.eye === 1 ? [0] : A.eye === 2 ? [-.15, .15] : [-.22, 0, .22];
    for (const x of ex) { S(A.eye === 1 ? .2 : .11, x, headY, .42, white); S(A.eye === 1 ? .1 : .055, x, headY, .52, dark); }
    if (A.shades) { const sh = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .05), dark); sh.position.set(0, headY, .5); body.add(sh); }
    for (let k = 0; k < A.ant; k++) { const x = A.ant === 1 ? 0 : (k ? .15 : -.15); const st = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .35, 6), m); st.position.set(x, headY + .45, 0); body.add(st); S(.07, x, headY + .65, 0, toy('#ffd23f', { em: '#ffd23f', ei: .6 })); }
    return a;
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
    G.spaceBounds = [placeX(i) + 1, placeX(i) + SPACE.w - 1];
    api.flash(); P.ride = null; P.layer = 'space'; P.x = placeX(i) + 12; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.jumps = 0; jumpTop = 0;
    show(); api.snap(); Sound.chime();
    say(`🚀 ${hello}`, true); disc('space_' + id); disc('space'); told = {};
  }
  function goHome() { here = null; G.spaceG = 1; api.home(); show(); }
  function show() {
    const on = P.layer === 'space';
    for (const k in groups) groups[k].visible = on && k === here;
    sky.visible = stars.visible = on;
    if (on) { sky.material.color.set(SKYCOL[here] || '#070a22'); sky.material.emissive.set(sky.material.color); stars.visible = here !== 'venus' && here !== 'mars'; }
  }
  // the jump report: after each big jump, how high you went (the real gravity makes the difference)
  function update(dt, t) {
    if (P.layer !== 'space') { if (here) { here = null; G.spaceG = 1; show(); } return; }
    const i = PLACES.findIndex(p => p[0] === here); if (i < 0) return;
    const [, , grav, gas] = PLACES[i], X = placeX(i);
    sky.position.set(api.camX(), P.y, -45); stars.position.set(api.camX() * .9, P.y * .9, -44);
    if (!P.grounded) jumpTop = Math.max(jumpTop, P.y);
    else if (jumpTop > .05) { const h = jumpTop; jumpTop = 0; G.spaceLastJump = h; /* (measured every physics step: a Jupiter hop lasts a third of a second) */ if (h < .3) return; if (!told[Math.round(h)]) { told[Math.round(h)] = 1; const m = Math.round(h * 10) / 10; say(m >= 1 ? `⭐ You jumped ${m >= 3 ? Math.round(m) : m} metres high!` : '⭐ A tiny hop! Gravity is very strong here!', true); disc('spacejump', 'Jump on each planet: the gravity is different everywhere!'); } }
    for (const u of ups[here] || []) u(dt, t);
  }
  return { goTo, goHome, update, places: PLACES, here: () => here };
}
