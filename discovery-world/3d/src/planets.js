// ===================================================================
// planets.js (build 50): BIGGER PLANETS. Each expanded place is 330 m long instead of 110: the landing area (built by
// space.js as before) plus two new areas, each built only when you walk near it, and the whole planet is freed from
// memory when you fly away. Shapes come from a few shared unit geometries (scaled), so new scenery adds almost no memory.
//
// Everything is pictures, sounds and short spoken sentences. Real facts are said as facts; the pretend parts (our
// friendly aliens, the pretend explorer stations) are said to be pretend.
//
// kit (from space.js): { X, s0 (where this area starts), add, sball, sbox, tapIt, fact, say, disc, Sound, U,
//   P, G, api, placeAlien, plat, rocketSign, setSkyColor }
// ===================================================================
import * as THREE from 'three';
import { toy } from './creatures.js';
import { makeBatch, shinyMat, glowMat } from './spacekit.js';
import { buildMoonCoaster } from './moon-coaster.js';
import { jupiterSkyArea2, jupiterSkyArea3, halfPipe, glass as seeThrough, painted } from './jupiter-world.js';
import { mercuryFunhouse, mercuryMazePlus } from './mercury-funhouse.js';
import { neptuneBungee2, neptuneSkyDive, marsClimbPark, starField } from './control-rides.js';
import { plutoInflatablePark, uranusIcePalace, uranusRinkFun, plutoMatchGame, uranusPalaceUpstairs } from './big-parks.js';

// (build 69) the giant Moon roller coaster lives in moon-coaster.js (its course in coaster-course.js)

// ---------- (build 68) 🧗 MARS: THE GIANT CLIMBING WALL and the GIANT TRAMPOLINE ----------
// A 22 m red rock cliff with colourful handholds. Tap it (or PAW): she climbs up the front of it, faster while you hold ▲.
// At the top she stands on the cliff; walk off the right edge and you fall onto a giant trampoline that bounces you high
// (Mars gravity is low, so the bounces are big). Walk off the trampoline to stop.
function marsClimbWall(k, X) {
  const P = k.P, wx = X + 92.5, H = 22, b = makeBatch(), box = new THREE.BoxGeometry(1, 1, 1);
  b.put(box, wx, H / 2, -2, '#b8573a', [5, H, 3.2]); b.put(box, wx, H + .15, -2, '#d06a44', [5.3, .3, 3.4]);
  for (let i = 0; i < 8; i++) b.put(box, wx - 2.2 + (i * 1.7) % 4.4, 1 + i * 2.7, -.38, '#8f3f28', [1.1, .9, .3], [0, 0, i * .7]); // rocky lumps
  const HC = ['#ff4f6a', '#ffd23f', '#3cc46e', '#2fa8ff', '#9b6cff', '#ff9a2e'];
  for (let i = 0; i < 36; i++) { const y = .8 + i * .6, x = wx + Math.sin(i * 2.3) * 1.3; b.put(new THREE.SphereGeometry(.2, 8, 6), x, y, -.38, HC[i % HC.length], [1.2, .9, .8]); }
  for (const s of [-1, 1]) b.put(new THREE.CylinderGeometry(.03, .03, H + 1.2, 6), wx + s * .25, (H + 1.2) / 2, -.3, '#ffffff'); // safety ropes
  const cliff = b.mesh(shinyMat()); cliff.castShadow = true; k.add(cliff);
  k.plat(wx - 2.5, wx + 2.5, H + .3, { z: -1.2 });
  const flag = k.sbox(wx - 1.8, H + .3, -2.6, .06, 1.6, .06, '#ffffff'); k.sbox(wx - 1.5, H + 1.5, -2.6, .6, .38, .03, '#ffd23f');
  // the giant trampoline, right of the cliff
  const tx0 = wx + 4, tx1 = wx + 16.5, tc = (tx0 + tx1) / 2, tb = makeBatch();
  for (const x of [tx0, tc, tx1]) for (const z of [-.2, -3]) tb.put(new THREE.CylinderGeometry(.12, .12, 1, 8), x, .5, z, '#5a6a8a');
  tb.put(box, tc, 1, -.2, '#2fa8ff', [tx1 - tx0 + .4, .25, .3]); tb.put(box, tc, 1, -3, '#2fa8ff', [tx1 - tx0 + .4, .25, .3]); for (const x of [tx0, tx1]) tb.put(box, x, 1, -1.6, '#2fa8ff', [.3, .25, 3]);
  for (let i = 0; i < 14; i++) tb.put(new THREE.CylinderGeometry(.05, .05, .35, 6), tx0 + .4 + i * (tx1 - tx0 - .8) / 13, 1, -.35, '#ffd23f', 1, [Math.PI / 2, 0, 0]);
  k.add(tb.mesh(shinyMat()));
  const mat = k.sbox(tc, .85, -1.6, tx1 - tx0 - .4, .1, 2.5, '#1d1d2b', { r: .5 }); let squash = 0, n = 0;
  k.U.push(dt => { squash = Math.max(0, squash - dt * 3); mat.position.y = .85 + .05 - Math.sin(squash * Math.PI) * .45; });
  k.plat(tx0 + .2, tx1 - .2, 1, { z: -1.2, pad: true, bounce: 14, onLand: () => { squash = 1; n++; if (n === 1) k.fact('🤸 BOING! A giant trampoline! Mars gravity is low, so you bounce super high!', 'marstramp'); if (n % 5 === 0) k.say(`🤸 ${n} bounces!`); } });
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - wx) > 6 || P.y > 2) return; k.say('🧗 Climb up the giant rock wall! Hold ▲ to climb faster!', true);
    jupiterRide(k, 'rockclimb', (R, dt) => { const fast = k.api.keysUp && k.api.keysUp(); const y0 = P.y; P.y = Math.min(H + .3, P.y + dt * (fast ? 2.6 : 1.2)); P.x = wx + Math.sin(P.y * 1.1) * .6; P.z = -.05; R.roll = Math.sin(P.y * 2.2) * .15; P.facing = Math.sin(P.y * 1.1 + 1.5) > 0 ? 1 : -1;
      if (Math.floor(P.y / 1.2) !== Math.floor(y0 / 1.2)) k.Sound.tone(300 + P.y * 25, .06, 'triangle', .03, 1); R.maxY = Math.max(R.maxY || 0, P.y); return P.y >= H + .3; },
      () => { P.y = H + .3; P.x = wx + .5; P.z = 0; P.vy = 0; P.grounded = true; k.api.burst(P.x, H + 1.5, -1, ['#ffd23f', '#ffffff', '#ff4f6a'], 24, 2.6); k.Sound.chime && k.Sound.chime(); k.say('🏔️ You made it to the top! Now walk off the edge onto the giant trampoline!', true); k.disc('marsclimbtop'); }, { noExit: true }); };
  k.tapIt(cliff, go, wx, 'marsclimbgo');
  k.tapIt(mat, () => k.fact('🤸 The giant trampoline! Climb the rock wall and jump off the top onto it!', 'marstrampoline'), tc, 'marstrampoline');
}

const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const Cap = s => s[0].toUpperCase() + s.slice(1);

// ---------- 🌕 THE MOON: crater valley and the explorer station; moon mountains and the hidden cave ----------
const moon = {
  all(k) { buildMoonCoaster(k); // (build 69) THE GIANT ROLLER COASTER: built with the Moon itself, so you see it from anywhere on it
 // footprints in the moon dust wherever you walk (one shared instanced mesh: 40 prints, the oldest fades away)
    const N = 40, prints = new THREE.InstancedMesh(new THREE.CircleGeometry(.16, 12), toy('#8a8a96', { r: 1 }), N); prints.count = 0; prints.frustumCulled = false; k.add(prints);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), s = new THREE.Vector3(1, 1.5, 1), v = new THREE.Vector3(); let last = null, n = 0, side = 1;
    k.U.push(() => { const P = k.P; if (!P.grounded || P.y > .05 || P.layer !== 'space') return; if (last === null) last = P.x; if (Math.abs(P.x - last) < .55) return; last = P.x; side = -side;
      v.set(P.x, .015, P.z + side * .14); m.compose(v, q, s); prints.setMatrixAt(n % N, m); n++; prints.count = Math.min(N, n); prints.instanceMatrix.needsUpdate = true; if (n === 12) k.fact('👣 Look! Your footprints stay in the moon dust. There is no wind on the Moon to blow them away.', 'moonsteps'); });
  },
  sections: [
    // ----- area 2: CRATER VALLEY and the EXPLORER STATION -----
    k => { const X = k.s0;
      // a giant crater: climb its rim, hop down inside, and land on the bouncy middle
      const cx = X + 20; k.sball(cx, -.2, -2.5, 9, .9, 4, '#b8b8c4', { r: .95 }); k.sball(cx, .05, -2.5, 6.5, .2, 3, '#8f8f9c', { r: 1 });
      for (const s of [-1, 1]) { k.sbox(cx + s * 7.5, 0, -1.2, 2.2, 1.2, 2, '#c9c9d4', { r: .9 }); k.plat(cx + s * 7.5 - 1.1, cx + s * 7.5 + 1.1, 1.2, { step: true, stepMax: 1.3 }); }
      const pad = k.sball(cx, .02, -1.2, 1.3, .12, 1.3, '#ffd23f', { em: '#ffb000', ei: .5 }); let cool = 0;
      k.tapIt(pad, () => k.fact('🌕 Stand on the yellow spot in the crater and you bounce up high!', 'moonbounce'), cx, 'moonbounce');
      k.U.push((dt, t) => { const P = k.P; cool = Math.max(0, cool - dt); pad.scale.y = .12 + Math.sin(t * 4) * .02; if (!cool && P.grounded && P.layer === 'space' && Math.abs(P.x - cx) < 1.2 && P.y < .2) { cool = .6; P.vy = 5.5; P.grounded = false; P.jumps = 2; k.Sound.boing(); k.disc('moonbounce'); } });
      // the explorer station (pretend): a dome, a blinking antenna dish that calls Earth, and a telescope
      const dome = k.sball(X + 40, 0, -5.5, 3.2, 2.6, 3.2, '#eef2ff', { r: .3, cc: .8 }); k.sbox(X + 40, 0, -3.2, 1.4, 1.8, .2, '#5a82f0', { r: .4 });
      for (let i = 0; i < 4; i++) { const w = k.sball(X + 38.2 + i * 1.2, 1.8, -2.75, .2, .2, .05, '#9fe6ff', { em: '#9fe6ff', ei: .6 }); k.U.push((dt, t) => { w.material.emissiveIntensity = .3 + (Math.sin(t * 3 + i * 1.7) > .6 ? .9 : 0); }); }
      const dishG = new THREE.Group(); dishG.position.set(X + 46, 0, -3.6); k.add(dishG); const mast = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.6, 10), toy('#c9c9d4', { m: .5, r: .4 })); mast.position.y = 1.3; dishG.add(mast);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.6), toy('#ffffff', { r: .3, side: THREE.DoubleSide })); dish.position.y = 2.8; dish.rotation.x = -1.1; dishG.add(dish); let call = 0;
      const callEarth = () => { if (call) return; call = .001; [0, .35, .7].forEach(d => k.Sound.tone(1200, .12, 'sine', .04, 1, d)); k.fact('📡 Beep beep! Calling planet Earth! A radio message takes about one second to get from the Moon to Earth.', 'moonradio'); };
      k.tapIt(dishG, callEarth, X + 46, 'moonradio'); k.U.push(dt => { if (!call) return; call += dt; dish.rotation.z = Math.sin(call * 3) * .5; if (call > 2.5) call = 0; });
      k.tapIt(dome, () => k.say('🏠 A pretend moon station! One day explorers might live in a home like this on the Moon.', true));
      // the moon phases toy: a big moon ball with a shadow cover; each tap moves the shadow: new, crescent, half, full
      const pm = k.sball(X + 58, 2.8, -4.6, 1.7, 1.7, 1.7, '#f4f4f8', { r: .8, em: '#f4f4f8', ei: .25 }); const shade = new THREE.Mesh(new THREE.SphereGeometry(1.73, 24, 14, 0, Math.PI), toy('#14142a', { r: 1 })); shade.position.copy(pm.position); k.add(shade); k.sbox(X + 58, 0, -4.6, .3, 1.1, .3, '#c9c9d4');
      const PH = [[Math.PI * 1.5, 'a new moon: we can hardly see it!'], [Math.PI * 1.25, 'a crescent moon: a thin smile!'], [Math.PI, 'a half moon!'], [Math.PI * .5, 'a full moon: big and round!']]; let ph = 3, phT = 0;
      const nextPhase = () => { ph = (ph + 1) % 4; phT = .001; k.Sound.tone(500 + ph * 120, .2, 'sine', .05, 1.3); k.fact(`🌙 This is ${PH[ph][1]} The Moon looks different as the Sun lights it from different sides.`, 'moonphases'); };
      shade.rotation.y = PH[ph][0]; k.tapIt(pm, nextPhase, X + 58, 'moonphases'); k.tapIt(shade, nextPhase);
      k.U.push(dt => { if (!phT) return; phT = Math.min(1, phT + dt * 2); const from = PH[(ph + 3) % 4][0], to = PH[ph][0]; shade.rotation.y = from + (((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * phT; if (phT >= 1) phT = 0; shade.visible = ph !== 3 || phT > 0; });
      k.placeAlien(X + 30, -2.4, 3); k.placeAlien(X + 66, -2, 4);
      // moon rocks to collect: a glowing sample box counts them
      let got = 0; const samples = []; const box = k.sbox(X + 80, 0, -2.6, 1.6, .9, 1.1, '#5a82f0', { r: .4 });
      for (let i = 0; i < 4; i++) { const r = k.sball(X + 70 + i * 3.4 + (i % 2), .25, -1.5 - (i % 2) * .8, .32, .26, .3, ['#d8d8e4', '#a8a8b8', '#e8e0d0', '#c0c8d8'][i], { r: .9 }); samples.push(r);
        k.tapIt(r, () => { if (!r.visible) return; r.visible = false; got++; k.Sound.tone(600 + got * 90, .12, 'triangle', .05, 1.2); k.say(`🪨 ${Cap(NUM[got])} moon rock${got > 1 ? 's' : ''} in the box!`, true); k.disc('moonsamples', '🪨 Collect moon rocks for the explorers!'); if (got === 4) setTimeout(() => { k.say('🎉 Four moon rocks! Thank you, little explorer! More rocks will roll out.', true); got = 0; for (const q of samples) q.visible = true; }, 900); }, i === 0 ? X + 70 : null, i === 0 ? 'moonsamples' : null); }
      k.tapIt(box, () => k.say(got ? `📦 ${Cap(NUM[got])} moon rock${got > 1 ? 's' : ''} so far!` : '📦 Find the moon rocks and tap them!', true));
      k.rocketSign(X + 4);
    },
    // ----- area 3: MOON MOUNTAINS and the HIDDEN CAVE -----
    k => { const X = k.s0;
      // a moon mountain to climb (big steps; a star waits at the top)
      const steps = [[X + 12, 1.4], [X + 15, 2.8], [X + 18, 4.2], [X + 21, 5.6], [X + 24, 7]] /* (no gaps between steps) */; for (const [x, h] of steps) { k.sbox(x, 0, -1.6, 3, h, 2.4, '#b4b4c0', { r: .9 }); k.plat(x - 1.5, x + 1.5, h, { step: true, stepMax: 1.5 }); }
      k.sball(X + 20, -2, -8, 12, 11, 6, '#a4a4b2', { r: .95 });
      const star = k.sball(X + 24, 8, -1.6, .45, .45, .15, '#ffd23f', { em: '#ffd23f', ei: .8 }); let won = false;
      k.U.push((dt, t) => { star.rotation.y += dt * 2; star.position.y = 8 + Math.sin(t * 2) * .1; const P = k.P; if (!won && P.layer === 'space' && P.y > 6.8 && Math.abs(P.x - (X + 24)) < 1.6) { won = true; k.Sound.chime(); k.api.burst && k.api.burst(X + 24, 8, -1.6, ['#ffd23f', '#ffffff'], 18, 3); k.fact('⛰️ You climbed a moon mountain! What a view!', 'moonpeak'); } });
      k.G.interact.push({ x: X + 12, y: 0, layer: 'space', disc: 'moonpeak', run: () => k.say('⛰️ Climb the big steps all the way to the star at the top!', true), hintY: 2.4 });
      // the hidden cave: walk in front of the dark opening and the crystals inside light up and sing
      const cvX = X + 44; k.sball(cvX, -.5, -4.6, 6, 4.6, 3.2, '#9a9aa8', { r: .95 }); const mouth = k.sball(cvX, 0, -2.2, 2.2, 2.2, .6, '#16162a', { r: 1 });
      const cr = [0, 1, 2, 3, 4].map(i => { const c = new THREE.Mesh(new THREE.OctahedronGeometry(.32), toy(['#9fe6ff', '#c9a8ff', '#ff9fd2', '#9fe6ff', '#fff3a6'][i], { em: ['#9fe6ff', '#c9a8ff', '#ff9fd2', '#9fe6ff', '#fff3a6'][i], ei: .1 })); c.position.set(cvX - 1.3 + i * .65, .6 + (i % 2) * .5, -1.8); c.scale.y = 1.6; k.add(c);
        k.tapIt(c, () => { c.userData.lit = 1; k.Sound.bell([523, 587, 659, 784, 880][i], .05); k.disc('mooncave'); }); return c; }); let found = false;
      k.U.push((dt, t) => { const near = k.P.layer === 'space' && Math.abs(k.P.x - cvX) < 3; if (near && !found) { found = true; k.Sound.twinkle(); k.fact('💎 A hidden moon cave, full of glowing crystals! Tap them to make them sing. (The crystals are pretend.)', 'mooncave'); }
        for (const c of cr) { c.userData.lit = Math.max(0, (c.userData.lit || 0) - dt); c.material.emissiveIntensity = (near ? .5 : .1) + c.userData.lit * 1.2 + Math.sin(t * 2 + c.position.x) * .1; c.rotation.y += dt; } });
      k.tapIt(mouth, () => { for (const c of cr) c.userData.lit = 1.5; k.Sound.twinkle(); k.fact('💎 A hidden moon cave, full of glowing crystals! Tap them to make them sing. (The crystals are pretend.)', 'mooncave'); }, cvX, 'mooncave'); /* (PAW at the cave lights it up, as walking up does) */
      // shape sorting: round, square and pointy moon rocks each go into their own hole
      const sx = X + 64; k.sbox(sx, 0, -3.2, 4.4, 1, 1.4, '#5a6aa8', { r: .5 }); const holes = [['circle', -1.4], ['square', 0], ['triangle', 1.4]];
      const shapeGeo = { circle: new THREE.CylinderGeometry(.42, .42, .3, 24), square: new THREE.BoxGeometry(.75, .3, .75), triangle: new THREE.CylinderGeometry(.5, .5, .3, 3) };
      for (const [s, dx] of holes) { const h = new THREE.Mesh(shapeGeo[s], toy('#1b1f3a', { r: 1 })); h.position.set(sx + dx, 1.02, -3.2); h.scale.y = .1; k.add(h); }
      let sorted = 0; const rocks = holes.map(([s, dx], i) => { const r = new THREE.Mesh(shapeGeo[s], toy(['#ff9fd2', '#9fe6ff', '#ffd23f'][i], { r: .6 })); const home = new THREE.Vector3(sx - 5 + i * 2.2 + (i === 2 ? 9 : 0), .2, -1.4); r.position.copy(home); r.rotation.x = Math.PI / 2; k.add(r); r.userData.fly = 0;
        k.tapIt(r, () => { if (r.userData.fly) return; r.userData.fly = .001; k.Sound.whoosh(); k.say(['⚪ The round rock goes in the round hole!', '⬜ The square rock goes in the square hole!', '🔺 The pointy triangle rock goes in the triangle hole!'][i], true); k.disc('moonshapes', '🔷 Match each moon rock to its shape!'); }); return { r, home, dx }; });
      k.G.interact.push({ x: sx, y: 0, layer: 'space', disc: 'moonshapes', run: () => { const q = rocks.find(q => !q.r.userData.fly); if (q) q.r.userData.tap(); }, hintY: 2.2 });
      k.U.push(dt => { for (const q of rocks) { const f = q.r.userData; if (!f.fly) continue; f.fly += dt; const kk = Math.min(1, f.fly / .8); q.r.position.set(q.home.x + (sx + q.dx - q.home.x) * kk, q.home.y + Math.sin(kk * Math.PI) * 2.4 + (1.05 - q.home.y) * kk, q.home.z + (-3.2 - q.home.z) * kk); q.r.rotation.x = Math.PI / 2 * (1 - kk);
        if (kk >= 1 && !f.done) { f.done = 1; sorted++; k.Sound.tone(700 + sorted * 120, .15, 'sine', .05, 1.2); k.api.burst && k.api.burst(sx + q.dx, 1.4, -3.2, ['#ffd23f', '#ffffff'], 8, 2); if (sorted === 3) { k.Sound.chime(); k.say('🎉 Every rock in its matching hole! Well done!', true); setTimeout(() => { sorted = 0; for (const p of rocks) { p.r.userData.fly = 0; p.r.userData.done = 0; p.r.position.copy(p.home); p.r.rotation.x = Math.PI / 2; } }, 3500); } } } });
      // the moon buggy: tap it and it drives off across the dust and back (astronauts really drove buggies on the Moon)
      const bug = new THREE.Group(); bug.position.set(X + 84, 0, -2); k.add(bug); const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, .3, 1.4), toy('#d9d9e2', { m: .4, r: .4 })); base.position.y = .7; bug.add(base); const seat = new THREE.Mesh(new THREE.BoxGeometry(.6, .6, 1), toy('#5a82f0')); seat.position.set(-.3, 1.1, 0); bug.add(seat);
      const wh = []; for (const [x, z] of [[-.85, -.75], [.85, -.75], [-.85, .75], [.85, .75]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 16), toy('#3a3a48', { r: .9 })); w.rotation.x = Math.PI / 2; w.position.set(x, .42, z); bug.add(w); wh.push(w); }
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 6), toy('#ffffff')); ant.position.set(.9, 1.4, .5); bug.add(ant); let drive = 0;
      k.tapIt(bug, () => { if (drive) return; drive = .001; k.Sound.tone(300, .3, 'square', .03, 1.2); k.fact('🚙 Vroom! Astronauts really drove a moon buggy like this on the Moon!', 'moonbuggy'); }, X + 84, 'moonbuggy');
      k.U.push(dt => { if (!drive) return; drive += dt; const kk = drive < 4 ? drive / 4 : drive < 8 ? 1 - (drive - 4) / 4 : 0; bug.position.x = X + 84 + Math.sin(kk * Math.PI / 2) * 14; bug.rotation.y = drive < 4 ? 0 : Math.PI; for (const w of wh) w.rotation.y += dt * 4; if (Math.random() < dt * 8) k.api.burst && k.api.burst(bug.position.x - 1, .3, -2, ['#c9c9d4', '#e4e4ee'], 2, 1.2); if (drive > 8) { drive = 0; bug.rotation.y = 0; bug.position.x = X + 84; } });
      k.placeAlien(X + 34, -2.2, 5); k.placeAlien(X + 96, -2.4, 6);
      k.rocketSign(X + 4);
    },
  ],
};

// ---------- 🔴 MARS: canyon country; the explorer station ----------
const mars = {
  sections: [
    // ----- area 2: CANYON COUNTRY -----
    k => { const X = k.s0;
      // two tall flat-topped rocks (mesas) with big steps, and a deep canyon between them
      for (const [mx, top] of [[X + 16, 6], [X + 34, 7.2]]) { k.sbox(mx, 0, -3.6, 8, top, 4, '#b8573a', { r: .95 }); }
      for (const [a, b, y] of [[X + 9, X + 11, 1.5], [X + 10.2, X + 12, 3], [X + 11.2, X + 13, 4.5], [X + 12, X + 20, 6]]) { k.sbox((a + b) / 2, 0, -1.2, b - a, y, 1.6, '#c8653f', { r: .9 }); k.plat(a, b, y, { step: true, stepMax: 1.6 }); }
      k.plat(X + 30, X + 38, 7.2, { z: -1.2 }); k.sbox(X + 34, 0, -1.2, 8, 7.2, 1.6, '#c8653f', { r: .9 });
      const flag = k.sbox(X + 19, 6, -1.4, .08, 1.8, .08, '#ffffff'); const cloth = k.sbox(X + 19.5, 7.2, -1.4, .9, .55, .04, '#2fa8ff'); let viewed = false;
      k.U.push((dt, t) => { cloth.rotation.y = Math.sin(t * 2) * .2; const P = k.P; if (!viewed && P.layer === 'space' && P.y > 5.8 && P.x > X + 12 && P.x < X + 20) { viewed = true; k.Sound.chime(); k.fact('🏜️ What a view! Mars has a giant canyon called Valles Marineris. It is much, much bigger than the Grand Canyon on Earth!', 'marscanyon'); } });
      k.G.interact.push({ x: X + 9, y: 0, layer: 'space', disc: 'marscanyon', run: () => k.say('🧗 Climb the big red steps to the top of the rock!', true), hintY: 2.2 });
      // rocks to look at: each kind says what it is
      const KINDS = [['#b2462a', '🔴 A red rock: Mars is red because its dust has rust in it!'], ['#d8a070', '🟤 A stripy rock: it was made in layers, a long, long time ago.'], ['#3a3a48', '⚫ A dark rock from an old volcano.'], ['#e8e8ec', '⚪ A white rock with ice inside! Mars has ice under the ground.'], ['#c08a5a', '🟠 A bumpy rock, round from rolling in old rivers. Mars had rivers long ago!']]; let seen = 0;
      KINDS.forEach(([c, msg], i) => { const r = k.sball(X + 44 + i * 3.2, .3, -1.4 - (i % 2) * .7, .42, .32, .38, c, { r: .85 }); if (i === 1) { for (let j = 0; j < 3; j++) k.sbox(X + 44 + i * 3.2, .14 + j * .16, -1.4 - (i % 2) * .7 + .36, .7, .05, .04, '#f0c898'); }
        k.tapIt(r, () => { r.userData.hop = .5; seen = Math.min(5, seen + 1); k.Sound.tone(420 + i * 90, .15, 'triangle', .05, 1.2); k.say(`🔍 ${msg}`, true); k.disc('marsrocks', '🔍 Tap the rocks to find out about them!'); }, i === 0 ? X + 44 : null, i === 0 ? 'marsrocks' : null);
        k.U.push(dt => { r.userData.hop = Math.max(0, (r.userData.hop || 0) - dt); r.position.y = .3 + Math.sin(r.userData.hop * Math.PI * 2) * r.userData.hop * .8; }); });
      // the ice cave
      const cvX = X + 66; k.sball(cvX, -.5, -4.8, 5.5, 4.4, 3, '#a8442a', { r: .95 }); k.sball(cvX, 0, -2.4, 2, 2.1, .6, '#2a1410', { r: 1 });
      const ice = [0, 1, 2].map(i => { const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .7, .7), toy('#cfefff', { r: .2, cc: .9, em: '#9fe6ff', ei: .2 })); b.position.set(cvX - .9 + i * .9, .45 + (i === 1 ? .4 : 0), -2); b.rotation.y = i * .6; k.add(b); return b; });
      k.tapIt(ice[1], () => { for (const b of ice) b.userData.glow = 1.5; k.Sound.twinkle(); k.fact('🧊 Ice in a Mars cave! Real Mars has lots of ice hiding under the ground and at its poles.', 'marsice'); }, cvX, 'marsice'); for (const b of [ice[0], ice[2]]) k.tapIt(b, () => ice[1].userData.tap && ice[1].userData.tap());
      k.U.push((dt, t) => { for (const b of ice) { b.userData.glow = Math.max(0, (b.userData.glow || 0) - dt); b.material.emissiveIntensity = .2 + b.userData.glow * .8 + Math.sin(t * 2 + b.position.x) * .05; } });
      // the blue sunset: tap the setting sun, and the sky around it turns blue (true on Mars!)
      const sun = k.sball(X + 86, 9, -40, 3, 3, 3, '#fff3d0', { em: '#ffe9a8', ei: 1 }); let dusk = 0;
      k.tapIt(sun, () => { dusk = 6; k.Sound.chime(); k.fact('🌅 On Mars the sunset looks BLUE, not orange! The red dust makes the sky look blue near the Sun.', 'marssunset'); });
      k.G.interact.push({ x: X + 86, y: 0, layer: 'space', disc: 'marssunset', run: () => sun.userData.tap && sun.userData.tap(), hintY: 2.4 });
      const red = new THREE.Color('#b8794a'), blue = new THREE.Color('#5f7fb8'), tmp = new THREE.Color();
      k.U.push(dt => { if (dusk <= 0) return; dusk = Math.max(0, dusk - dt); const a = Math.min(1, Math.min(dusk, 6 - dusk) / 1.2); tmp.copy(red).lerp(blue, a); k.setSkyColor(tmp); sun.position.y = 9 - a * 3; });
      k.placeAlien(X + 26, -2, 3); k.placeAlien(X + 76, -2.4, 4);
      marsClimbPark(k, X); // (build 71: the climbing wall you climb yourself, and the trampoline park; was marsClimbWall)
      k.rocketSign(X + 4);
    },
    // ----- area 3: THE EXPLORER STATION (pretend) -----
    k => { const X = k.s0;
      // a pretend Mars base: domes, a door that opens, and a greenhouse where plants grow
      k.sball(X + 18, 0, -6, 4, 3.4, 4, '#f4f4f8', { r: .3, cc: .8 }); k.sball(X + 27, 0, -6.4, 3, 2.6, 3, '#f4f4f8', { r: .3, cc: .8 }); k.sbox(X + 22.5, 0, -6.2, 5, 1.6, 1.6, '#e0e0ea', { r: .4 });
      const door = k.sbox(X + 18, 0, -2.5, 1.6, 2.2, .2, '#ff8a3c', { r: .4 }); let open = 0;
      k.tapIt(door, () => { open = 3; k.Sound.tone(300, .2, 'sine', .04, 1.6); k.Sound.tone(500, .2, 'sine', .04, 1.6, .2); k.fact('🏠 Pssh! The door opens. This is a pretend Mars base: one day people might live on Mars in homes like this!', 'marsbase'); }, X + 18, 'marsbase');
      k.U.push(dt => { open = Math.max(0, open - dt); door.position.y = Math.min(1, open) * 2.1; });
      const pots = [0, 1, 2].map(i => { const x = X + 32 + i * 2.4; k.sbox(x, 0, -2.4, 1, .7, 1, '#c8653f', { r: .7 }); const leaf = k.sball(x, .7, -2.4, .2, .2, .2, '#4fbf5a', { r: .7 }); const tom = k.sball(x + .25, 1.2, -2.2, .17, .17, .17, '#ff4a3a', { r: .4 }); tom.visible = false; return { x, leaf, tom, g: 0 }; });
      const grow = q => { q.g = q.g >= 3 ? 0 : q.g + 1; q.leaf.scale.set(.2 + q.g * .22, .2 + q.g * .35, .2 + q.g * .22); q.leaf.position.y = .7 + q.g * .3; q.tom.visible = q.g === 3; q.tom.position.y = .9 + q.g * .35; k.Sound.tone(400 + q.g * 120, .15, 'sine', .05, 1.2);
        k.say(q.g === 0 ? '🌱 Plant a new seed!' : q.g === 3 ? '🍅 A tomato! Plants could grow in a greenhouse on Mars one day.' : '🌱 It grows!', true); k.disc('marsgarden', '🌱 Tap the pots to grow plants on Mars!'); };
      pots.forEach(q => k.tapIt(q.leaf, () => grow(q))); k.G.interact.push({ x: X + 34.4, y: 0, layer: 'space', disc: 'marsgarden', run: () => grow(pots.find(q => q.g < 3) || pots[0]), hintY: 2.2 });
      // the little Mars helicopter (a real one flew on Mars!): tap and it flies up and around
      const heli = new THREE.Group(); heli.position.set(X + 48, 0, -2.2); k.add(heli); const hb = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .6), toy('#d9d9e2', { m: .4 })); hb.position.y = .55; heli.add(hb);
      for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .6, 6), toy('#9a9aa6')); leg.position.set(s * .3, .2, 0); leg.rotation.z = s * .4; heli.add(leg); }
      const rot = [1.2, 1.5].map(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(2, .04, .16), toy('#3a3a48')); b.position.y = y; heli.add(b); return b; }); let fly = 0;
      k.tapIt(heli, () => { if (fly) return; fly = .001; k.Sound.noise ? k.Sound.noise(1.6, 400, 900, .03) : k.Sound.whoosh(); k.fact('🚁 Whirr! A real little helicopter called Ingenuity flew on Mars!', 'marsheli'); }, X + 48, 'marsheli');
      k.U.push(dt => { rot[0].rotation.y += dt * (fly ? 40 : 2); rot[1].rotation.y -= dt * (fly ? 40 : 2); if (!fly) return; fly += dt; const kk = Math.min(1, fly / 6); heli.position.y = Math.sin(kk * Math.PI) * 5; heli.position.x = X + 48 + Math.sin(kk * Math.PI * 2) * 3; if (fly > 6) { fly = 0; heli.position.set(X + 48, 0, -2.2); } });
      // Mars's two little moons, Phobos and Deimos: count them
      const pm = [[X + 60, 16, '#9a8a7a', 1.4], [X + 78, 21, '#b8a898', .9]].map(([x, y, c, r]) => k.sball(x, y, -30, r * 1.3, r, r, c, { r: .9 })); let cnt = 0;
      pm.forEach((m, i) => k.tapIt(m, () => { cnt = cnt % 2 + 1; k.Sound.tone(500 + cnt * 150, .15, 'sine', .05, 1.2); k.say(cnt === 2 ? '🌑 Two! Mars has two little moons, Phobos and Deimos. They look like potatoes!' : '🌑 One!', true); k.disc('marsmoons'); }));
      k.G.interact.push({ x: X + 66, y: 0, layer: 'space', disc: 'marsmoons', run: () => pm[cnt % 2].userData.tap && pm[cnt % 2].userData.tap(), hintY: 2.2 });
      // a long rover track to follow: tap the flags in a row and the rover beeps at each one
      const flags = [0, 1, 2, 3].map(i => { const x = X + 84 + i * 5; k.sbox(x, 0, -1.6, .06, 1.4, .06, '#ffffff'); const f = k.sbox(x + .3, 1.1, -1.6, .55, .35, .03, ['#ff4f6a', '#ffd23f', '#3cc46e', '#2fa8ff'][i]); return f; }); let nextF = 0;
      flags.forEach((f, i) => k.tapIt(f, () => { if (i !== nextF) { k.say(`🚩 Find the ${['red', 'yellow', 'green', 'blue'][nextF]} flag first!`, true); return; } nextF = (nextF + 1) % 4; k.Sound.tone(600 + i * 120, .12, 'square', .03, 1.2); f.userData.wave = 1; k.say(nextF === 0 ? '🎉 All four flags! Great exploring!' : `🚩 ${['Red', 'Yellow', 'Green', 'Blue'][i]}!`, true); k.disc('marsflags', '🚩 Tap the flags in a row: red, yellow, green, blue!'); }));
      k.G.interact.push({ x: X + 84, y: 0, layer: 'space', disc: 'marsflags', run: () => flags[nextF].userData.tap && flags[nextF].userData.tap(), hintY: 2.2 });
      k.U.push((dt, t) => { for (const f of flags) { f.userData.wave = Math.max(0, (f.userData.wave || 0) - dt); f.rotation.y = Math.sin(t * 3 + f.position.x) * .15 + f.userData.wave * Math.sin(t * 20); } });
      k.placeAlien(X + 40, -2.4, 5); k.placeAlien(X + 102, -2, 6);
      k.rocketSign(X + 4);
    },
  ],
};


// ---------- (build 66) 🏰 PLUTO: SUPER BOUNCY BOUNCE CASTLES ----------
// Three inflatable castles, each bouncier than the last. Walk onto the floor and you bounce on your own, over and over;
// with Pluto's tiny gravity the bounces go very high (about 6 m, 11 m and 18 m) and you float down slowly.
// Walk off the edge to stop. Each castle's walls, towers and flags are one mesh; its floor squashes when you land.
function bounceCastle(k, cx, w, cols, v, big) {
  const b = makeBatch(), box = new THREE.BoxGeometry(1, 1, 1), ball = new THREE.SphereGeometry(1, 16, 12), cyl = new THREE.CylinderGeometry(1, 1, 1, 16), cone = new THREE.ConeGeometry(1, 1, 16);
  const d = 4.2, z = -2.6, H = big ? 3.4 : 2.6, h = w / 2;
  b.put(box, cx, .22, z, cols[0], [w + .6, .44, d + .6]);                                                   // the puffy base
  b.put(box, cx, .44 + H / 2, z - d / 2, cols[1], [w, H, .5]);                                              // back wall
  for (const s of [-1, 1]) b.put(box, cx + s * h, .44 + H * .32, z, cols[1], [.5, H * .64, d]);            // low side walls
  for (let i = 0; i < Math.round(w / 1.2); i++) b.put(ball, cx - h + .6 + i * 1.2, .44 + H, z - d / 2, i % 2 ? cols[2] : cols[3], [.38, .32, .32]); // puffy battlements
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const tx = cx + sx * h, tz = z + sz * d / 2, th = H + 1.4;
    b.put(cyl, tx, .44 + th / 2, tz, cols[sz < 0 ? 2 : 3], [.6, th, .6]); b.put(cone, tx, .44 + th + .55, tz, cols[0], [.75, 1.1, .75]); b.put(ball, tx, .44 + th + 1.2, tz, '#ffffff', .16);
    b.put(box, tx + .35, .44 + th + .85, tz, cols[2], [.5, .3, .04]); }                                   // little flags
  b.put(box, cx, .44 + H + .9, z - d / 2, cols[3], [1.6, 1, .5]); b.put(ball, cx, .44 + H + 1.5, z - d / 2, cols[2], [.5, .45, .45]); // the middle gable
  const m = b.mesh(shinyMat()); m.castShadow = true; k.add(m);
  const floor = k.sbox(cx, .3, z + .1, w - .4, .18, d - .4, cols[2], { r: .35, cc: .6 });                 // the bouncy floor (squashes)
  let squash = 0, n = 0;
  k.U.push(dt => { squash = Math.max(0, squash - dt * 3); floor.scale.y = .18 * (1 - Math.sin(squash * Math.PI) * .6); });
  k.plat(cx - h + .1, cx + h - .1, .48, { z: -1.2, step: true, stepMax: .6, pad: true, bounce: v, onLand: () => { squash = 1; n++; if (n === 1) k.fact('🏰 Boing! On Pluto you bounce super high, because Pluto\'s gravity is so tiny!', 'plutobounce'); if (n % 5 === 0) k.say(`🏰 ${n} bounces! Wheee!`); } });
  k.tapIt(m, () => k.fact('🏰 Hop on the bouncy floor and bounce!', 'plutocastle'), cx, big ? 'plutocastle' : null);
}
const pluto = {
  sections: [
    // ----- area 2: THE BOUNCE CASTLE PARK -----
    k => { const X = k.s0;
      bounceCastle(k, X + 22, 7, ['#ff9fd2', '#ff6fae', '#fff3a6', '#c9a6ff'], 4.3);
      bounceCastle(k, X + 46, 9, ['#9fd8ff', '#5aa8ff', '#fff3a6', '#ffb35c'], 5.8);
      bounceCastle(k, X + 74, 12, ['#ffd23f', '#ff6fae', '#7fe0a0', '#5aa8ff'], 7.4, true);
      plutoMatchGame(k); // (build 78) the puffy picture-matching game
      k.rocketSign(X + 4);
    },
    // ----- area 3: the icy plains beyond (sparkling ice spires, and the way back to the rocket) -----
    k => { const X = k.s0;
      for (let i = 0; i < 7; i++) { const x = X + 14 + i * 13 + (i % 2) * 3, hh = 2.5 + (i * 7 % 5); k.sball(x, hh * .45, -6 - (i % 3) * 3, .7, hh, .7, i % 2 ? '#dcecff' : '#bcd4f2', { r: .2, cc: .8 }); }
      plutoInflatablePark(k); // (build 71) the giant inflatable park
      k.rocketSign(X + 4);
    },
  ],
};

// ---------- (build 66) 🪐 JUPITER: A PLAYGROUND and the SUPER-DUPER TALL CRAZY SLIDE ----------
// Jupiter's gravity is strong (you can only hop a little), so everything here works by tapping: swings that go higher
// and higher, a merry-go-round, a seesaw with a teddy, a rocket spring-rider; and a 30 m tower with a glass lift up to a
// see-through rainbow slide that spirals three times round the tower, then drops, corkscrews and wiggles down to the path.
function jupiterRide(k, type, step, done, o = {}) { // a ride the planet drives itself (main.js just pauses walking while P.ride is set)
  const P = k.P, R = { type, t: 0, noExit: o.noExit ?? type === 'jlift' }; P.ride = R; P.vx = P.vy = 0;
  const f = dt => { if (P.ride !== R) return true; R.t += dt; if (step(R, dt)) { if (P.ride === R) { P.ride = null; P.vy = 0; P.grounded = true; } done && done(); return true; } };
  k.U.push((dt) => { if (R.over) return; if (f(dt)) R.over = true; });
}
function jupiterPlayground(k, X) {
  const P = k.P, near = x => P.layer === 'space' && !P.ride && Math.abs(P.x - x) < 7;
  // the swing set: two swings on a frame; tap one and you swing higher and higher (about 10 s)
  { const sx = X + 18, b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 10);
    for (const s of [-1, 1]) for (const z of [-.9, .9]) b.put(cyl, sx + s * 2.6 - s * .55, 1.6, -3 + z, '#ff6fae', [.09, 3.4, .09], [0, 0, s * .17]);
    b.put(cyl, sx, 3.2, -3, '#ffd23f', [.1, 5.6, .1], [0, 0, Math.PI / 2]); const fm = b.mesh(shinyMat()); fm.castShadow = true; k.add(fm);
    for (const dx of [-1.2, 1.2]) { const piv = new THREE.Group(); piv.position.set(sx + dx, 3.2, -3); k.add(piv); const sb = makeBatch();
      for (const z of [-.28, .28]) sb.put(cyl, 0, -1.3, z, '#c9c9d4', [.025, 2.6, .025]); sb.put(new THREE.BoxGeometry(1, 1, 1), 0, -2.6, 0, dx < 0 ? '#5aa8ff' : '#7fe0a0', [.8, .1, .62]); piv.add(sb.mesh(shinyMat()));
      const go = () => { if (!near(sx + dx)) return; k.fact('🛝 Whee! Swinging on Jupiter!', 'jupiterswing'); k.Sound.giggle && k.Sound.giggle();
        jupiterRide(k, 'jswing', (R, dt) => { const a = Math.min(.95, .15 + R.t * .12) * Math.sin(R.t * 2.1) * (R.t > 9 ? Math.max(0, 1 - (R.t - 9)) : 1); piv.rotation.z = a; P.x = piv.position.x + Math.sin(a) * 2.55; P.y = 3.2 - Math.cos(a) * 2.55 - .35; P.z = -3; P.facing = Math.cos(R.t * 2.1) >= 0 ? 1 : -1; return R.t > 10; }, () => { piv.rotation.z = 0; P.y = 0; P.z = 0; }); };
      k.tapIt(piv, go, sx + dx, dx < 0 ? 'jupiterswing' : null); } }
  // the merry-go-round: tap it and ride round and round
  { const mx = X + 34, g = new THREE.Group(); g.position.set(mx, 0, -3.2); k.add(g); const b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
    b.put(cyl, 0, .25, 0, '#ffd23f', [2.4, .16, 2.4]); for (let i = 0; i < 6; i++) b.put(new THREE.BoxGeometry(1, 1, 1), 0, .34, 0, ['#ff6fae', '#5aa8ff', '#7fe0a0'][i % 3], [4.6, .03, .5], [0, i * Math.PI / 6, 0]);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; b.put(cyl, Math.cos(a) * 1.8, .9, Math.sin(a) * 1.8, '#ffffff', [.06, 1.2, .06]); } b.put(cyl, 0, 1.4, 0, '#ff6fae', [.12, 2.2, .12]); b.put(new THREE.SphereGeometry(1, 16, 10), 0, 2.6, 0, '#ffd23f', .3);
    g.add(b.mesh(shinyMat())); let spin = .3; k.U.push(dt => { g.rotation.y += spin * dt; spin = Math.max(.3, spin - dt * .4); });
    const go = () => { if (!near(mx)) return; spin = 3; k.fact('🎠 Round and round on the merry-go-round!', 'jupiterspin');
      jupiterRide(k, 'jspin', R => { const a = g.rotation.y + .6; P.x = mx + Math.cos(a) * 1.9; P.z = -3.2 - Math.sin(a) * 1.9; P.y = .4; P.facing = Math.sin(a) > 0 ? 1 : -1; spin = Math.max(spin, 2.4); return R.t > 8; }, () => { P.z = 0; P.y = 0; P.x = mx + 2.6; }); };
    k.tapIt(g, go, mx, 'jupiterspin'); }
  // the seesaw, with a teddy on one end: tap it and it rocks
  { const sx2 = X + 48, base = k.sbox(sx2, 0, -2.6, .5, .7, .5, '#ff6fae', { r: .4 }); const pivot = new THREE.Group(); pivot.position.set(sx2, .75, -2.6); k.add(pivot);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(5, .16, .5), toy('#5aa8ff', { r: .4, cc: .5 })); pivot.add(plank); const teddy = new THREE.Mesh(new THREE.SphereGeometry(.35, 14, 10), toy('#b98a5a', { r: .8 })); teddy.position.set(2.2, .4, 0); pivot.add(teddy);
    let rock = 0; k.U.push((dt, t) => { rock = Math.max(0, rock - dt * .25); pivot.rotation.z = Math.sin(t * 3) * .28 * Math.min(1, rock); });
    k.tapIt(pivot, () => { rock = 2.5; k.Sound.boing && k.Sound.boing(); k.fact('🪅 Up and down! The teddy loves the seesaw!', 'jupiterseesaw'); }, sx2, 'jupiterseesaw'); }
  // a rocket spring-rider: tap it and it wobbles
  { const rx = X + 58, g = new THREE.Group(); g.position.set(rx, 0, -2.4); k.add(g); const b = makeBatch();
    b.put(new THREE.CylinderGeometry(.12, .12, .8, 10), 0, .4, 0, '#c9c9d4'); b.put(new THREE.CylinderGeometry(.35, .45, 1.3, 16), 0, 1.4, 0, '#ffffff'); b.put(new THREE.ConeGeometry(.35, .6, 16), 0, 2.35, 0, '#ff4f6a'); for (const s of [-1, 1]) b.put(new THREE.BoxGeometry(.08, .5, .4), s * .4, 1, 0, '#5aa8ff');
    g.add(b.mesh(shinyMat())); let wob = 0; k.U.push((dt, t) => { wob = Math.max(0, wob - dt * .5); g.rotation.z = Math.sin(t * 9) * .2 * wob; });
    k.tapIt(g, () => { wob = 1.5; k.Sound.boing && k.Sound.boing(); k.fact('🚀 Boing boing! A wobbly rocket ride!', 'jupiterrider'); }, rx, 'jupiterrider'); }
}
function jupiterSuperSlide(k, X) {
  const P = k.P, tx = X + 14, TOP = 30, V3 = (x, y, z) => new THREE.Vector3(x, y, z), pts = [];
  // three turns round the tower, then wild drops, a corkscrew and S-bends down to the path
  for (let i = 0; i <= 36; i++) { const a = Math.PI / 2 + i / 36 * Math.PI * 6, r = 4.2; pts.push(V3(tx + Math.cos(a) * r, TOP - .6 - i / 36 * 14, -6 + Math.sin(a) * r)); }
  for (const p of [[tx + 10, 14, -8], [tx + 16, 9, -10], [tx + 22, 13, -10.5], [tx + 28, 6, -9], [tx + 34, 10, -6.5], [tx + 40, 5, -8.5], [tx + 44, 7, -11], [tx + 46, 9, -8], [tx + 44, 7.5, -5.5], [tx + 48, 5, -4],
    [tx + 56, 4.5, -7], [tx + 62, 6, -10], [tx + 70, 3.5, -8], [tx + 76, 4.2, -4.5], [tx + 82, 2, -3], [tx + 86, 1, -2], [tx + 89, .7, -1.5]]) pts.push(V3(...p));
  const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .35);
  // (build 70: an open rainbow half-pipe with the shared material, instead of a see-through clearcoat tube: much cheaper to draw, no extra shader)
  const tube = new THREE.Mesh(halfPipe(path, 300, .9, ['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fae'], 14), shinyMat()); tube.castShadow = true; k.add(tube);
  // posts under the slide and the tower itself (one mesh), a glass lift tube, the lift car
  const b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 12);
  for (let u = .02; u < .98; u += .025) { const p = path.getPointAt(u); if (p.y > 1.6 && Math.hypot(p.x - tx, p.z + 6) > 3) b.put(cyl, p.x, (p.y - .9) / 2, p.z, '#ffd23f', [.12, p.y - .9, .12]); }
  for (let i = 0; i < 10; i++) b.put(cyl, tx, i * 3 + 1.5, -6, i % 2 ? '#ffffff' : '#ff6fae', [1.6, 3, 1.6]);
  b.put(cyl, tx, TOP + .15, -6, '#ffd23f', [2.6, .3, 2.6]); b.put(new THREE.ConeGeometry(1, 1, 20), tx, TOP + 2.4, -6, '#9b6cff', [2.4, 2.6, 2.4]); b.put(new THREE.SphereGeometry(1, 14, 10), tx, TOP + 3.9, -6, '#ffd23f', .35);
  for (const s of [-1, 1]) b.put(cyl, tx + s * .9, TOP + .9, -6 + 1.2, '#ffffff', [.06, 1.5, .06]);
  const tw = b.mesh(shinyMat()); tw.castShadow = true; k.add(tw);
  const glass = new THREE.Mesh(painted(new THREE.CylinderGeometry(1, 1, TOP + 1, 20, 1, true), '#cfefff'), seeThrough(.25)); glass.position.set(tx - 2.4, (TOP + 1) / 2, -2.6); k.add(glass);
  const car = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .25, 20), toy('#5aa8ff', { r: .3, cc: .8 })); car.position.set(tx - 2.4, .12, -2.6); k.add(car);
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - tx) > 9) return; k.fact('🛝 Up, up, up to the top of the super slide!', 'jupiterslide'); P.x = tx - 2.4; P.z = -2.6;
    jupiterRide(k, 'jlift', (R, dt) => { car.position.y = Math.min(TOP, car.position.y + dt * 5); P.y = car.position.y + .15; P.x = tx - 2.4; P.z = -2.6; if (R.t % .5 < dt) k.Sound.tone(300 + car.position.y * 15, .06, 'sine', .03, 1); return car.position.y >= TOP; },
      () => { k.say('🛝 Here we go! Wheeeee!', true); k.G.startSlide(path, { vmax: 13, acc: 6 }); setTimeout(() => { car.position.y = .12; }, 1500); }); };
  k.tapIt(tw, go, tx, 'jupiterslide'); k.tapIt(car, go); k.tapIt(glass, go);
  return path;
}
const jupiter = {
  sections: [
    k => { jupiterPlayground(k, k.s0); jupiterSkyArea2(k); k.rocketSign(k.s0 + 1); },   // area 2: the playground + (build 70) the Sky Playground's towers, islands and games
    k => { jupiterSuperSlide(k, k.s0); jupiterSkyArea3(k); k.rocketSign(k.s0 + 104); },  // area 3: the super slide + (build 70) the Floaty Bubble, the Sky Lookout and its slides
  ],
};

// ---------- (build 67) 🧊 URANUS: an ICE CASTLE and an ICE SKATING RINK ----------
const ICE_SLIDE_MAT = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, opacity: .55, roughness: .08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
function uranusIceCastle(k, cx) {
  const P = k.P, b = makeBatch(), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 18), cone = new THREE.ConeGeometry(1, 1, 18), ice = '#bfe6ff', pale = '#e8f6ff', deep = '#7fbde8';
  b.put(box, cx, 3, -6, ice, [16, 6, .9]);                                                       // the back wall
  for (const s of [-1, 1]) { b.put(cyl, cx + s * 8, 4.5, -5.6, pale, [1.3, 9, 1.3]); b.put(cone, cx + s * 8, 10.2, -5.6, deep, [1.6, 2.4, 1.6]); b.put(new THREE.OctahedronGeometry(1), cx + s * 8, 11.8, -5.6, '#ffffff', .3); }
  b.put(cyl, cx, 5.5, -6.3, pale, [1.7, 11, 1.7]); b.put(cone, cx, 12.4, -6.3, deep, [2, 2.8, 2]); b.put(new THREE.OctahedronGeometry(1), cx, 14.3, -6.3, '#ffffff', .45);
  b.put(box, cx, 1.6, -5.5, '#3f6f9e', [2.6, 3.2, .2]); b.put(new THREE.CylinderGeometry(1.3, 1.3, .2, 20, 1, false, 0, Math.PI), cx, 3.2, -5.5, '#3f6f9e', 1, [Math.PI / 2, 0, Math.PI / 2]); // the gate
  for (let i = 0; i < 12; i++) { const x = cx - 7 + i * 1.27; b.put(box, x, 6.35, -6, pale, [.7, .7, 1]); b.put(cone, x + .6, 5.6, -5.45, '#ffffff', [.12, .7, .12], [Math.PI, 0, 0]); } // battlements and icicles
  for (const x of [cx - 4.5, cx + 4.5]) for (const y of [2.2, 4.4]) b.put(box, x, y, -5.5, '#9fd8ff', [1.2, 1.2, .1]);  // frosty windows
  // stairs up on the left and a long rampart along the front, with an ice slide down on the right
  const steps = [[cx - 12, 1.2], [cx - 10.8, 2.4], [cx - 9.6, 3.6], [cx - 8.4, 4.8]];
  for (const [x, h] of steps) { b.put(box, x, h / 2, -1.6, i2c(h), [1.2, h, 1.6]); k.plat(x - .6, x + .6, h, { z: -1.2, step: true, stepMax: 1.3 }); }
  b.put(box, cx, 4.65, -1.6, pale, [15.2, .3, 1.6]); k.plat(cx - 7.6, cx + 7.6, 4.8, { z: -1.2 });
  for (let x = cx - 7.5; x <= cx + 7.5; x += 1.5) b.put(cyl, x, 4.8 + .45, -2.3, '#ffffff', [.06, .9, .06]); b.put(box, cx, 5.7, -2.3, ice, [15.2, .1, .1]);
  for (let x = cx - 6; x <= cx + 6; x += 4) b.put(cyl, x, 2.3, -1.6, pale, [.25, 4.6, .25]);
  const m = b.mesh(shinyMat()); m.castShadow = true; k.add(m);
  function i2c(h) { return ['#dff4ff', '#cfeeff', '#bfe6ff', '#afdcff'][Math.round(h / 1.2) - 1] || ice; }
  const path = new THREE.CatmullRomCurve3([[cx + 7.6, 5.4, -1.4], [cx + 10, 4.6, -1.6], [cx + 12.5, 2.8, -2.6], [cx + 13.5, 1.6, -4.4], [cx + 15.5, 1, -4.2], [cx + 17, .7, -2], [cx + 18.5, .6, -.6]].map(p => new THREE.Vector3(...p)), false, 'catmullrom', .4);
  const geo = new THREE.TubeGeometry(path, 90, .85, 14, false); { const cols = [], c = new THREE.Color(); for (let i = 0; i <= 90; i++) { c.set(i % 18 < 9 ? '#bfe6ff' : '#ffffff'); for (let j = 0; j < 15; j++) cols.push(c.r, c.g, c.b); } geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); }
  const tube = new THREE.Mesh(geo, ICE_SLIDE_MAT()); tube.renderOrder = 2; k.add(tube);
  let fired = 0; k.U.push(dt => { fired = Math.max(0, fired - dt); if (!fired && P.layer === 'space' && !P.ride && Math.abs(P.y - 4.8) < .1 && P.x > cx + 7.3 && P.x < cx + 8.5 && P.vx > .5) { fired = 2; k.G.startSlide(path, { vmax: 9 }); k.Sound.whoosh && k.Sound.whoosh(); } });
  k.tapIt(m, () => k.fact('🏰 An ice castle! Uranus is an ice giant: deep down it is full of icy water. Climb the steps and slide down!', 'uranuscastle'), cx, 'uranuscastle');
}
function uranusRink(k, cx) {
  const P = k.P, rx = 32, rz = 5, cz = -2.6, b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 64); /* (build 71: rx 32, was 22) */
  b.put(cyl, cx, .03, cz, '#8fd0ff', [rx, .06, rz]); b.put(cyl, cx, .035, cz, '#c9ecff', [rx - 1.2, .06, rz - .7]); /* (a blue rink with a pale centre: it stands out from the icy ground) */
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, x = cx + Math.cos(a) * (rx + .3), z = cz + Math.sin(a) * (rz + .25); if (z > .6) continue; b.put(new THREE.CylinderGeometry(1, 1, 1, 8), x, .4, z, i % 2 ? '#5aa8ff' : '#ffffff', [.09, .8, .09]); }
  b.put(new THREE.TorusGeometry(1, .03, 6, 64), cx, .82, cz, '#ffffff', [rx + .3, rz + .25, 1], [Math.PI / 2, 0, 0]);
  const rink = b.mesh(shinyMat()); rink.receiveShadow = true; k.add(rink);
  // three snowy skaters gliding round and round
  const skaters = [0, 1, 2].map(i => { const g = new THREE.Group(), sb = makeBatch(), ball = new THREE.SphereGeometry(1, 14, 10); sb.put(ball, 0, .5, 0, '#ffffff', .45); sb.put(ball, 0, 1.15, 0, '#ffffff', .32); sb.put(new THREE.TorusGeometry(.26, .07, 6, 14), 0, .92, 0, ['#ff4f6a', '#5aa8ff', '#ffd23f'][i], 1, [Math.PI / 2, 0, 0]);
    sb.put(new THREE.ConeGeometry(.06, .25, 8), .32, 1.15, 0, '#ff9a2e', 1, [0, 0, -Math.PI / 2]); for (const z of [-.1, .1]) sb.put(ball, .26, 1.24, z, '#1d1d2b', .04); g.add(sb.mesh(shinyMat())); k.add(g); return { g, a: i * 2.1 }; });
  let glide = 0, said = false;
  k.U.push((dt, t) => {
    for (const s of skaters) { s.a += dt * .35; const x = cx + Math.cos(s.a) * (rx - 4), z = cz + Math.sin(s.a) * (rz - 1.4); s.g.position.set(x, .06, z); s.g.rotation.y = -s.a - Math.PI / 2; s.g.rotation.z = Math.sin(t * 4 + s.a) * .08; }
    const on = P.layer === 'space' && P.grounded && !P.ride && Math.pow((P.x - cx) / rx, 2) + Math.pow((P.z - cz) / rz, 2) < 1;
    if (!on) { glide = 0; return; }
    if (!said) { said = true; k.fact('⛸️ Skating on Uranus! Walk, then let go: you glide on the ice!', 'uranusskate'); }
    const held = k.api.keysHeld && k.api.keysHeld();
    if (held && Math.abs(P.vx) > .5) glide = P.vx * 1.15; else if (Math.abs(glide) > .25) { const nx = P.x + glide * dt; if (Math.abs(nx - cx) < rx - 1) P.x = nx; else glide = 0; glide *= Math.exp(-dt * .35); P.facing = glide > 0 ? 1 : -1; if (Math.random() < dt * 10) k.api.burst(P.x - Math.sign(glide) * .4, .1, P.z, ['#ffffff', '#cfefff'], 1, .6); }
  });
  k.tapIt(rink, () => { k.Sound.twinkle && k.Sound.twinkle(); k.api.burst(P.x, 1.6, P.z, ['#ffffff', '#cfefff', '#ffd23f'], 16, 2); k.fact('⛸️ Wheee! Walk onto the ice and let go to glide!', 'uranusrink'); }, cx, 'uranusrink');
}
const uranus = {
  sections: [
    k => { uranusIceCastle(k, k.s0 + 40); uranusIcePalace(k); uranusPalaceUpstairs(k); k.rocketSign(k.s0 + 4); },   // area 2: the ice castle + (build 71) the Ice Palace
    k => { uranusRink(k, k.s0 + 50); uranusRinkFun(k, k.s0 + 50, 32); k.rocketSign(k.s0 + 100); },       // area 3: the (bigger) skating rink + hoops, stars, musical ice
  ],
};

// ---------- (build 67) 🪞 MERCURY: THE FUNHOUSE MIRROR MAZE ----------
// A striped funhouse; inside, big mirrors on the back wall show YOUR character, funnily changed (tall, wide, tiny, giant,
// wobbly, upside down, squiggly). Three mirror doors stand across the way, at an angle like a maze: tap one and it spins
// open. At the end a golden star waits. One copy of your character is moved to whichever mirror you stand at.
function mercuryMirrorMaze(k, X) {
  const P = k.P, b = makeBatch(), box = new THREE.BoxGeometry(1, 1, 1), cone = new THREE.ConeGeometry(1, 1, 16), x0 = X + 14, x1 = X + 90;
  // the entrance arch (stripes and a pointed roof) and the hall: chequered floor, a back wall, posts
  for (let i = 0; i < 7; i++) b.put(box, x0 - 1.5 + i * .5, 3.5, -1.6, i % 2 ? '#ffffff' : '#ff4f9a', [.5, 7, .6]);
  b.put(cone, x0, 8.6, -1.6, '#ffd23f', [2.6, 2.4, 1.2]); b.put(new THREE.SphereGeometry(1, 12, 8), x0, 10, -1.6, '#ff4f9a', .3);
  for (let i = 0; i < 38; i++) b.put(box, x0 + 1 + i * 2, .02, -2.2, i % 2 ? '#ffe3f1' : '#e3f3ff', [2, .04, 4.4]);
  b.put(box, (x0 + x1) / 2, 2.8, -4.5, '#4a2a6a', [x1 - x0, 5.6, .3]); b.put(box, (x0 + x1) / 2, 5.75, -4.3, '#ffd23f', [x1 - x0, .3, .6]);
  for (let x = x0 + 4; x < x1; x += 8) b.put(box, x, 2.8, -4.2, '#ff9fd2', [.3, 5.6, .3]);
  const hall = b.mesh(shinyMat()); hall.castShadow = true; k.add(hall);
  // the wall mirrors, each with its own funny shape
  const SHAPES = [[.7, 1.55, .7], [1.55, .7, 1.4], [.55, .55, .55], [1.3, 1.3, 1.3], 'wobble', 'upside', 'squiggle'];
  const glassM = toy('#eef8ff', { r: .04, m: .15, cc: 1, em: '#bfe0ff', ei: .35 }), frameB = makeBatch(), mirrors = [];
  SHAPES.forEach((sh, i) => { const mx = x0 + 6 + i * 10.5; frameB.put(box, mx, 2.2, -4.25, '#ffd23f', [2.8, 4.2, .12]); frameB.put(new THREE.SphereGeometry(1, 10, 8), mx, 4.5, -4.2, ['#ff4f9a', '#5aa8ff', '#7fe0a0'][i % 3], .28);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.8), glassM); g.position.set(mx, 2.2, -4.18); k.add(g); mirrors.push({ x: mx, sh, g }); });
  k.add(frameB.mesh(shinyMat()));
  // three mirror doors across the way (solid until tapped), turned at an angle like a maze
  const doors = [x0 + 18, x0 + 39, x0 + 60].map((dx, i) => { const piv = new THREE.Group(); piv.position.set(dx, 0, -.6); piv.rotation.y = .7; k.add(piv);
    const db = makeBatch(); db.put(box, 0, 1.9, 0, '#ffd23f', [.18, 3.8, 2.8]); db.put(new THREE.SphereGeometry(1, 10, 8), 0, 4, 0, ['#ff4f9a', '#5aa8ff', '#7fe0a0'][i], .3); piv.add(db.mesh(shinyMat()));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.4), glassM); gl.rotation.y = Math.PI / 2; gl.position.set(.1, 1.9, 0); piv.add(gl); const gl2 = gl.clone(); gl2.rotation.y = -Math.PI / 2; gl2.position.x = -.1; piv.add(gl2);
    for (const o of k.G.solids.filter(s => s.key === 'mercdoor' + i)) k.G.solids.splice(k.G.solids.indexOf(o), 1);
    const solid = { a: dx - .3, b: dx + .3, top: 4.2, layer: 'space', key: 'mercdoor' + i }; k.G.solids.push(solid);
    const d = { piv, solid, open: 0, opened: false, x: dx };
    k.tapIt(piv, () => { if (d.opened) return; d.opened = true; const j = k.G.solids.indexOf(solid); if (j >= 0) k.G.solids.splice(j, 1); k.Sound.chime && k.Sound.chime(); k.say(['🪞 The mirror spins! Go through!', '🪞 Whoosh! Another mirror opens!', '🪞 The last mirror! Find the golden star!'][i], true); k.disc('mercurydoor' + i); }, dx, 'mercurydoor' + i);
    return d; });
  // the golden star at the end
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.6), toy('#ffd23f', { em: '#ffb000', ei: .8, m: .3 })); star.position.set(x1 - 3, 2, -2); k.add(star); let won = false;
  // your reflection (build 73): a live PICTURE of you on the mirror you stand at, funnily stretched; a little camera at the
  // mirror sees only you and refreshes it every third frame (one draw call, instead of a whole second character)
  const MW = 2.2, MH = 2.6, rt = new THREE.WebGLRenderTarget(176, 208), mcam = new THREE.PerspectiveCamera(40, MW / MH, .2, 20), LAYER = 5, mbg = new THREE.Color('#e6f4ff');
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: rt.texture, fog: false, toneMapped: false })); pic.visible = false; k.add(pic); mcam.layers.set(LAYER);
  let fno = 0, tagged = null;
  k.U.push((dt, t) => {
    for (const d of doors) if (d.opened && d.open < 1) { d.open = Math.min(1, d.open + dt * 1.6); d.piv.rotation.y = .7 + d.open * (Math.PI / 2 - .7) ; d.piv.position.y = d.open * 3.2; }
    star.rotation.y = t * 1.5; star.position.y = 2 + Math.sin(t * 2) * .2;
    if (!won && P.layer === 'space' && Math.abs(P.x - (x1 - 3)) < 1.5 && P.y < 3) { won = true; k.api.burst(x1 - 3, 2.2, -2, ['#ffd23f', '#ffffff', '#ff9fd2'], 30, 3); k.Sound.chime && k.Sound.chime(); k.fact('⭐ You found your way through the mirror maze! Mercury is the planet closest to the Sun.', 'mercurymaze'); }
    const mi = P.layer === 'space' && !P.ride ? mirrors.find(m => Math.abs(P.x - m.x) < 2.2) : null;
    if (!mi) { pic.visible = false; return; }
    let sx = 1, sy = 1, rz = 0;
    if (Array.isArray(mi.sh)) [sx, sy] = mi.sh; else if (mi.sh === 'wobble') { sx = 1 + Math.sin(t * 5) * .3; sy = 1 - Math.sin(t * 5) * .25; } else if (mi.sh === 'upside') rz = Math.PI; else if (mi.sh === 'squiggle') { sx = .8 + Math.sin(t * 9) * .15; sy = 1.25; rz = Math.sin(t * 3) * .35; }
    pic.visible = true; pic.position.set(mi.x, 2.2, -4.12); pic.scale.set(-Math.min(1.15, sx) * .95, Math.min(1.4, sy) * .95, 1); pic.rotation.set(0, 0, rz);
    if (fno++ % 3) return; const body = k.G.playerBody, R = k.G.renderer; if (!body || !R) return;
    if (tagged !== body) { body.traverse(o => o.layers.enable(LAYER)); tagged = body; }
    mcam.position.set(P.x, P.y + 1.2, -4.18); mcam.lookAt(P.x, P.y + 1.2, P.z || 0);
    const prev = R.getRenderTarget(), pbg = k.G.scene.background, pc = R.getClearColor(new THREE.Color()), pa = R.getClearAlpha(), sm = R.shadowMap.autoUpdate;
    k.G.scene.background = null; R.shadowMap.autoUpdate = false; R.setClearColor(mbg, 1); R.setRenderTarget(rt); R.clear(); R.render(k.G.scene, mcam); R.setRenderTarget(prev); R.setClearColor(pc, pa); k.G.scene.background = pbg; R.shadowMap.autoUpdate = sm; k.G.mirrorPics = (k.G.mirrorPics || 0) + 1;
  });
  k.tapIt(hall, () => k.fact('🪞 The funhouse mirror maze! Look in the mirrors, and tap the mirror doors to open them.', 'mercuryfunhouse'), x0, 'mercuryfunhouse');
}
const mercury = {
  sections: [
    k => { mercuryMirrorMaze(k, k.s0); mercuryMazePlus(k); k.rocketSign(k.s0 + 4); },     // area 2: the funhouse mirror maze + (build 74) the gallery, light-beam puzzle, hidden door
    k => { mercuryFunhouse(k); k.rocketSign(k.s0 + 108); }, // area 3: (build 71) the giant carnival funhouse (it replaces the rocks)
  ],
};

// ---------- (build 68) 🌬️ NEPTUNE, the windiest planet: WIND SWINGS, BUNGEE JUMPING and a SKYDIVING CHAMBER ----------
function neptuneWindSwings(k, X) {
  const P = k.P, near = x => P.layer === 'space' && !P.ride && Math.abs(P.x - x) < 7, sx = X + 26, H = 4.6, L = 3.9;
  const b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 10);
  for (const s of [-1, 1]) for (const z of [-1, 1]) b.put(cyl, sx + s * 4.4 - s * .7, H / 2, -3 + z, '#5aa8ff', [.11, H + .3, .11], [0, 0, s * .16]);
  b.put(cyl, sx, H, -3, '#ffd23f', [.12, 9.4, .12], [0, 0, Math.PI / 2]);
  const sock = new THREE.Group(); sock.position.set(X + 12, 0, -3.5); k.add(sock); { const sb = makeBatch(); sb.put(cyl, 0, 2, 0, '#ffffff', [.06, 4, .06]); for (let i = 0; i < 4; i++) sb.put(new THREE.CylinderGeometry(.32 - i * .05, .27 - i * .05, .5, 12), .3 + i * .5, 3.8, 0, i % 2 ? '#ffffff' : '#ff6a3c', 1, [0, 0, -Math.PI / 2]); sock.add(sb.mesh(shinyMat())); }
  k.add(b.mesh(shinyMat()));
  { const cb = makeBatch(), lo = new THREE.SphereGeometry(1, 8, 6); for (let i = 0; i < 6; i++) cb.put(lo, sx + 9 + i * 1.3, .25, -1.4 + (i % 2) * .5, '#ffffff', [1.2, .45, 1.1]); k.add(cb.mesh(glowMat())); } // (build 82: the soft cloud cushion you fly onto)
  // white wind streaks blowing across
  const streakM = toy('#ffffff', { r: .2, em: '#ffffff', ei: .4 }), streaks = [...Array(10)].map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, .05, .05), streakM); m.position.set(X + Math.random() * 60, 1 + (i * 1.7) % 6, -2 - (i % 4)); k.add(m); return m; });
  let gust = 0; k.U.push((dt, t) => { gust = .5 + .5 * Math.sin(t * .6); for (const m of streaks) { m.position.x += dt * (8 + gust * 10); if (m.position.x > X + 70) m.position.x = X + 4; } sock.children[0].rotation.y = Math.sin(t * 2) * .2 * gust; });
  [-2.6, 0, 2.6].forEach((dx, i) => { const piv = new THREE.Group(); piv.position.set(sx + dx, H, -3); k.add(piv); const pb = makeBatch();
    for (const z of [-.3, .3]) pb.put(cyl, 0, -L / 2, z, '#d8e0ea', [.025, L, .025]); pb.put(new THREE.BoxGeometry(1, 1, 1), 0, -L, 0, ['#ff6fae', '#7fe0a0', '#ffd23f'][i], [.85, .1, .66]); piv.add(pb.mesh(shinyMat()));
    let idle = 0; k.U.push((dt, t) => { if (!(P.ride && P.ride.swing === piv)) { idle += dt; piv.rotation.z = Math.sin(t * 1.6 + i) * .12 * gust; } });
    const go = () => { if (!near(sx + dx)) return; k.fact('🌬️ Neptune has the fastest winds of all the planets! The wind pushes your swing!', 'neptunewind');
      // (build 82) YOU pump the swing: press JUMP and it goes higher (the wind helps a little). When it is really high,
      //  press JUMP at the top of a forward swing to LET GO and fly onto the soft cloud cushion.
      let amp = .25, th = 0, flew = false, idleT = 0;
      jupiterRide(k, 'wswing', (R, dt) => { th += dt * 1.9; idleT += dt; amp = Math.max(.2, Math.min(1.3, amp + gust * .012 * dt * 60 * .1 - (idleT > 4 ? dt * .03 : 0)));
        const a = amp * Math.sin(th); piv.rotation.z = a; R.swing = piv; R.amp = amp;
        P.x = piv.position.x + Math.sin(a) * (L - .05); P.y = H - Math.cos(a) * (L - .05) - .35; P.z = -3; P.facing = Math.cos(th) >= 0 ? 1 : -1; R.maxA = Math.max(R.maxA || 0, Math.abs(a));
        if (Math.random() < .08) k.api.burst(P.x - 1, P.y + .8, P.z, ['#ffffff', '#cfefff'], 2, 1.5);
        if (R.letGo) { flew = true; return true; } return idleT > 8; },
        () => { piv.rotation.z = 0; P.z = 0; if (flew) { P.vy = 7; P.vx = 7; P.drift = 7; P.driftT = 1.2; P.grounded = false; k.Sound.whoosh(); k.say('🌬️ WHEEE! You let go and flew!', true); k.disc('neptuneswingfly'); } else P.y = 0; });
      P.ride.onJump = () => { const R = P.ride; idleT = 0; if (amp > 1.1 && Math.cos(th) > 0 && Math.abs(Math.sin(th)) > .8 && Math.sin(th) > 0) { R.letGo = true; return; } amp = Math.min(1.3, amp + .14); k.Sound.tone(300 + amp * 300, .08, 'triangle', .05, 1.5); if (amp > 1.1) k.say('🌬️ So high! Press JUMP at the top to let go and fly!', false); };
      k.say('🌬️ Press JUMP to swing higher and higher!', true); };
    k.tapIt(piv, go, sx + dx, i === 1 ? 'neptuneswing' : null); });
  k.tapIt(sock, () => k.fact('🌬️ A windsock shows which way the wind blows. On Neptune the wind is super fast!', 'neptunewindsock'), X + 12, 'neptunewindsock');
}
function neptuneBungee(k, X) {
  const P = k.P, bx = X + 76, T = 24, Lc = 10, b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 12), box = new THREE.BoxGeometry(1, 1, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.put(cyl, bx + sx * 1.3, T / 2, -4 + sz * 1.3, '#9b6cff', [.16, T, .16]);
  for (let y = 3; y < T; y += 3) for (const sz of [-1, 1]) b.put(box, bx, y, -4 + sz * 1.3, '#c9a6ff', [2.6, .1, .1]);
  b.put(box, bx, T, -4, '#ffd23f', [3.4, .3, 3.4]); b.put(box, bx + 2.2, T, -3, '#ff6a3c', [1.6, .25, .9]);          // the platform and the jumping board
  for (const s of [-1, 1]) b.put(cyl, bx + s * 1.6, T + .6, -2.4, '#ffffff', [.05, 1.2, .05]); b.put(box, bx, T + 1.2, -2.4, '#ffffff', [3.2, .06, .06]);
  k.add(b.mesh(shinyMat()));
  const lift = new THREE.Mesh(new THREE.BoxGeometry(1.4, .2, 1.4), toy('#5aa8ff', { r: .3 })); lift.position.set(bx - 2.1, .1, -2.6); k.add(lift);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 6), toy('#ff4f9a', { r: .4 })); cord.visible = false; k.add(cord); const A = new THREE.Vector3(bx + 2.8, T + .1, -3), Bv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - bx) > 9) return; k.fact('🪢 Bungee jump! Up to the top, then jump: the stretchy cord catches you and bounces you!', 'neptunebungee');
    let ph = 'lift', vy = 0, y = 0;
    jupiterRide(k, 'bungee', (R, dt) => {
      if (ph === 'lift') { lift.position.y = Math.min(T, lift.position.y + dt * 5); P.x = bx - 2.1; P.z = -2.6; P.y = lift.position.y + .1; if (lift.position.y >= T) { ph = 'walk'; R.w = 0; } return false; }
      if (ph === 'walk') { R.w += dt; P.x = bx - 2.1 + Math.min(1, R.w / 1.2) * 5; P.y = T + .15; P.z = -3; P.facing = 1; if (R.w > 1.8) { ph = 'fall'; vy = 3; y = P.y; cord.visible = true; k.Sound.whoosh && k.Sound.whoosh(); k.say('🪢 Three, two, one... JUMP!', true); R.t0 = R.t; } return false; }
      if (ph === 'fall') { vy -= 11 * dt; const stretch = (A.y - (y + 1)) - Lc; if (stretch > 0) vy += 9 * stretch * dt; vy *= Math.exp(-dt * .55); y += vy * dt; R.minY = Math.min(R.minY ?? 99, y);
        if (stretch > 0 && vy > 0 && !R.boing) { R.boing = 1; k.Sound.boing && k.Sound.boing(); } if (vy < 0) R.boing = 0;
        P.y = y; P.x = A.x; P.z = A.z; R.roll = y < T - .5 ? Math.PI : 0; if (R.t - R.t0 > 9) { ph = 'down'; R.roll = Math.PI; } }
      if (ph === 'down') { y = Math.max(0, y - dt * 3); P.y = y; if (y <= .5) R.roll = 0; if (y <= 0) { cord.visible = false; lift.position.y = .1; return true; } }
      Bv.set(P.x, P.y + (R.roll ? .2 : 1.2), P.z); cord.position.copy(A).add(Bv).multiplyScalar(.5); const d = Bv.clone().sub(A); cord.scale.set(1, d.length(), 1); cord.quaternion.setFromUnitVectors(up, d.normalize());
      return false; }, () => { P.x = bx + 3.6; P.y = 0; P.z = 0; k.api.burst(P.x, 1, 0, ['#ffffff', '#ff4f9a', '#ffd23f'], 16, 2.4); k.say('🪢 What a jump! Tap the tower to go again!', true); }, { noExit: true });
  };
  const tw = new THREE.Group(); tw.position.set(bx, 0, -4); k.add(tw); k.tapIt(lift, go, bx, 'neptunebungeego'); k.tapIt(tw, go);
}
function neptuneSkydive(k, X) {
  const P = k.P, cx = X + 40, cz = -3, R0 = 2.4, Hc = 11, b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
  b.put(cyl, cx, .4, cz, '#5a6a8a', [R0 + .6, .8, R0 + .6]); b.put(cyl, cx, Hc + .3, cz, '#5a6a8a', [R0 + .6, .6, R0 + .6]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.put(new THREE.CylinderGeometry(1, 1, 1, 8), cx + Math.cos(a) * (R0 + .35), Hc / 2 + .4, cz + Math.sin(a) * (R0 + .35), '#c9d6e8', [.1, Hc, .1]); }
  b.put(new THREE.BoxGeometry(1, 1, 1), cx - R0 - .9, 1.2, cz + 1.2, '#ffd23f', [1.2, 2.4, .3]); k.add(b.mesh(shinyMat()));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, Hc, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: '#cfefff', transparent: true, opacity: .22, roughness: .05, side: THREE.DoubleSide, depthWrite: false })); glass.position.set(cx, Hc / 2 + .8, cz); k.add(glass);
  const fan = new THREE.Group(); fan.position.set(cx, .85, cz); k.add(fan); { const fb = makeBatch(); for (let i = 0; i < 5; i++) fb.put(new THREE.BoxGeometry(1, 1, 1), 0, 0, 0, '#2a3a5a', [2 * R0 - .4, .05, .4], [0, i / 5 * Math.PI, 0]); fb.put(new THREE.CylinderGeometry(.3, .3, .2, 14), 0, .05, 0, '#ffd23f'); fan.add(fb.mesh(shinyMat())); }
  const airM = toy('#ffffff', { r: .2, em: '#cfefff', ei: .6 }), air = [...Array(12)].map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.2, .05), airM); const a = i * 2.4; m.position.set(cx + Math.cos(a) * (R0 - .6) * ((i % 3) / 3 + .3), 1 + (i * 1.3) % Hc, cz + Math.sin(a) * 1.2); k.add(m); return m; });
  let on = false, boost = 0; k.U.push((dt) => { fan.rotation.y += dt * (on ? 22 : 6); for (const m of air) { m.position.y += dt * (on ? 9 : 3); if (m.position.y > Hc) m.position.y = 1; } });
  const go = () => { if (P.layer !== 'space') return; if (P.ride && P.ride.type === 'skydive') { boost = 1.2; k.Sound.whoosh && k.Sound.whoosh(); return; } if (P.ride || Math.abs(P.x - cx) > 8) return;
    k.fact('🪂 A skydiving chamber! A giant fan blows air up so you float, just like flying through the sky. Tap to zoom up!', 'neptuneskydive'); on = true; let y = .9;
    jupiterRide(k, 'skydive', (R, dt) => { const target = 3.2 + Math.sin(R.t * 1.3) * 1.2 + boost * 4; boost = Math.max(0, boost - dt * .7);
      if (R.t > 15) y = Math.max(.9, y - dt * 2.5); else y += (target - y) * Math.min(1, dt * 2.2); /* (the fan slows: float gently down to the floor) */ P.y = y; P.x = cx + Math.sin(R.t * .9) * .9; P.z = cz + Math.cos(R.t * .7) * .5; R.roll = R.t > 15 && y < 1.4 ? 0 : (Math.PI / 2) * (Math.sin(R.t * .5) > 0 ? 1 : -1) + Math.sin(R.t * 3) * .15; R.maxY = Math.max(R.maxY || 0, y);
        if (Math.random() < .1) k.api.burst(P.x, P.y - .4, P.z, ['#ffffff', '#cfefff'], 2, 1.2); return R.t > 15 && y <= .95; }, () => { on = false; P.x = cx - R0 - 1.6; P.y = 0; P.z = 0; k.say('🪂 You flew! Tap the chamber to fly again!', true); }, { noExit: true }); };
  k.tapIt(glass, go, cx, 'neptuneskydivego'); k.tapIt(fan, go);
}
const neptune = {
  sections: [
    k => { neptuneWindSwings(k, k.s0); neptuneBungee2(k, k.s0); k.rocketSign(k.s0 + 4); },  // (build 71: the bungee you control)   // area 2: the wind swings and the bungee tower
    k => { neptuneSkydive(k, k.s0); neptuneSkyDive(k, k.s0); k.rocketSign(k.s0 + 100); },  // (build 71: + the Big Sky Dive you steer)                             // area 3: the skydiving chamber
  ],
};

// ---------- (build 68) 🪵 VENUS: THE GIANT LOG RIDE ----------
// Sit in a hollow log at the station; it floats up a lift to 18 m, winds along a high water channel, then plunges down
// a giant drop into the splash pool: SPLASH! (pretend water: real Venus is far too hot for water)
function venusLogRide(k, X) {
  const P = k.P, st = X + 20, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // (build 71) a route about three times longer: lift 1 (22 m), a high channel, a drop, the jungle rapids, a crystal tunnel
  //  through a mountain, lift 2 (30 m), a high water bridge and a giant final drop into the splash pool
  const pts = [[st, .6, -2.4], [st + 5, .6, -3], [st + 9, 2, -5], [st + 14, 9, -7], [st + 19, 16, -8.5], [st + 23, 22, -9.5], [st + 28, 22.3, -11], [st + 32, 22, -15], [st + 28, 21.5, -19], [st + 20, 21, -20],
    [st + 14, 19, -23], [st + 12, 15, -27], [st + 18, 10.5, -29], [st + 26, 10, -27], [st + 34, 9, -24], [st + 42, 7, -26], [st + 48, 5, -23], [st + 54, 4, -26], [st + 60, 4, -29], [st + 68, 4.2, -27],
    [st + 74, 10, -24], [st + 78, 18, -21], [st + 82, 26, -18], [st + 86, 30, -15], [st + 88, 30, -11], [st + 84, 29.6, -8], [st + 76, 29.3, -7], [st + 70, 22, -8], [st + 66, 10, -8.5], [st + 62, 2, -9], [st + 58, .5, -7], [st + 60, .4, -5], [st + 63, .4, -3.2]].map(p => V3(...p));
  const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .4), len = path.getLength();
  let uTop = 0, yTop = -1; for (let u = 0; u < .4; u += .002) { const y = path.getPointAt(u).y; if (y > yTop) { yTop = y; uTop = u; } }
  // the flume: a water ribbon between two wooden walls, on posts (one mesh for the wood, one for the water)
  const N = Math.ceil(len / .7), wb = makeBatch(), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 8), tg = V3(), side = V3(), wpos = [], widx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, p = path.getPointAt(u); path.getTangentAt(u, tg); side.set(-tg.z, 0, tg.x).normalize(); const yaw = Math.atan2(-tg.z, tg.x), pitch = Math.asin(Math.max(-1, Math.min(1, tg.y)));
    for (const sg of [-1, 1]) wb.put(box, p.x + side.x * .85 * sg, p.y + .15, p.z + side.z * .85 * sg, i % 2 ? '#a8703f' : '#bf8650', [.75, .5, .12], [0, yaw, pitch]);
    wb.put(box, p.x, p.y - .12, p.z, '#8a5a2a', [.75, .1, 1.8], [0, yaw, pitch]);
    if (i % 3 === 0 && p.y > 1.2) for (const sg of [-1, 1]) wb.put(cyl, p.x + side.x * .8 * sg, (p.y - .2) / 2, p.z + side.z * .8 * sg, '#7a4a22', [.09, p.y - .2, .09]);
    for (const sg of [-1, 1]) wpos.push(p.x + side.x * .78 * sg, p.y - .02, p.z + side.z * .78 * sg); if (i < N) { const a = i * 2; widx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const wood = wb.mesh(shinyMat()); wood.castShadow = true; k.add(wood);
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3)); wg.setIndex(widx); wg.computeVertexNormals();
  const water = new THREE.Mesh(wg, new THREE.MeshPhysicalMaterial({ color: '#4fb8ff', roughness: .1, clearcoat: 1, transparent: true, opacity: .85, side: THREE.DoubleSide })); k.add(water);
  // the splash pool with a rocky rim, and the station with a striped roof
  const pc = path.getPointAt(.965); const pool = k.sball(pc.x, -.25, pc.z - 1, 6.5, .35, 4.2, '#3f9fe8', { r: .1, cc: .8 });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; k.sball(pc.x + Math.cos(a) * 6.6, .1, pc.z - 1 + Math.sin(a) * 4.3, .7, .45, .6, '#d8a060', { r: .9 }); }
  k.sbox(st, 0, -2.6, 4, .5, 2.2, '#e8c89a', { r: .5 }); for (const dx of [-1.8, 1.8]) k.sbox(st + dx, .5, -3.4, .14, 2.5, .14, '#ffffff', { r: .4 });
  for (let i = 0; i < 5; i++) k.sbox(st - 1.7 + i * .85, 3, -2.9, .85, .16, 1.6, i % 2 ? '#ffffff' : '#ff9a2e', { r: .4 });
  // (build 71) the mountain the flume tunnels through (with glowing crystals inside), jungle plants along the rapids
  { const mb = makeBatch(), ball = new THREE.SphereGeometry(1, 12, 9), oct = new THREE.OctahedronGeometry(1); mb.put(ball, st + 57, 4, -31, '#c98a4a', [9, 9, 6]); mb.put(ball, st + 63, 3, -32.5, '#b87a3a', [7, 7.5, 5]);
    const cb = makeBatch(); for (let i = 0; i < 14; i++) { const x = st + 52 + i * 1.2, z = -27.5 + (i % 2 ? -1.6 : 1.6) * .9; cb.put(oct, x, 5.6 + (i % 3) * .5, z, ['#b07bff', '#62f0ff', '#ff6fd8', '#7dffb0'][i % 4], [.25, .6, .25]); }
    for (let i = 0; i < 16; i++) { const x = st + 30 + i * 1.6, z = -22 + (i % 2) * -6.5; cb.put(ball, x, 6 + (i % 3) * .6, z, ['#3cc46e', '#7fe0a0', '#ff6fae', '#ffd23f'][i % 4], [.9, 1.4, .9]); cb.put(new THREE.CylinderGeometry(1, 1, 1, 6), x, 3, z, '#6a8a2a', [.12, 6, .12]); }
    k.add(mb.mesh(shinyMat())); k.add(cb.mesh(glowMat())); }
  const flumeStars = []; { const sm = toy('#ffd23f', { em: '#ffb000', ei: .8 }); for (const [u, off] of [[.2, -.4], [.27, .4], [.36, -.4], [.43, .4], [.5, -.35], [.58, .4], [.75, -.4], [.82, .4]]) { const p = path.getPointAt(u); path.getTangentAt(u, tg); side.set(-tg.z, 0, tg.x).normalize(); const m = new THREE.Mesh(new THREE.OctahedronGeometry(.3), sm); m.position.set(p.x + side.x * off, p.y + 1.1, p.z + side.z * off); k.add(m); flumeStars.push({ u, off, m, got: false }); } }
  // the log: hollow with lighter ends and a seat (modelled along +x)
  const log = new THREE.Group(); { const lb = makeBatch(); lb.put(new THREE.CylinderGeometry(.62, .62, 2.6, 18, 1, true), 0, .35, 0, '#8a5a3a', 1, [0, 0, Math.PI / 2]); for (const sx of [-1.3, 1.3]) lb.put(new THREE.CylinderGeometry(.62, .62, .08, 18), sx, .35, 0, '#e8c08a', 1, [0, 0, Math.PI / 2]);
    lb.put(new THREE.BoxGeometry(1, 1, 1), 0, .2, 0, '#6a4024', [2.4, .12, 1.1]); lb.put(new THREE.SphereGeometry(.2, 10, 8), 1.4, .9, 0, '#7fe0a0', [1, .6, 1]); log.add(lb.mesh(shinyMat())); }
  log.position.copy(path.getPointAt(0)); log.userData.dynamic = true; k.add(log);
  // (build 77) THE WATERFALL SHORTCUT: at the fork (a glowing arch on the high channel), steer ◀ and the log takes a short
  //  waterfall chute straight down to the rapids; go straight on for the long way round
  const nearU = (x, y, z) => { let bu = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const q = path.getPointAt(i / 600), d = (q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2; if (d < bd) { bd = d; bu = i / 600; } } return bu; };
  const uF = nearU(st + 28, 21.5, -19), uJ = nearU(st + 34, 9, -24), PF = path.getPointAt(uF), PJ = path.getPointAt(uJ);
  const pathB = new THREE.CatmullRomCurve3([PF.clone(), V3(st + 29.5, 20.5, -21), V3(st + 31, 15, -22.5), V3(st + 32.5, 11, -23.5), PJ.clone()], false, 'catmullrom', .4), lenB = pathB.getLength();
  { const hp = new THREE.Mesh(halfPipe(pathB, 70, .95, ['#4fb8ff', '#cfefff'], 8), shinyMat()); k.add(hp); const fb = makeBatch(); for (let i = 0; i < 8; i++) { const q = pathB.getPointAt(.25 + i * .08); fb.put(new THREE.BoxGeometry(1, 1, 1), q.x + 1.2, q.y - 1.2, q.z, i % 2 ? '#ffffff' : '#9fd8ff', [.15, 2.4, 1.6]); }
    fb.put(new THREE.TorusGeometry(1.8, .2, 6, 20, Math.PI), PF.x, PF.y, PF.z, '#62f0ff', 1, [0, Math.atan2(-(PJ.z - PF.z), PJ.x - PF.x) + Math.PI / 2, 0]); k.add(fb.mesh(glowMat())); }
  const place = (u, pth = path) => { const p = pth.getPointAt(u); pth.getTangentAt(u, tg); log.position.copy(p); log.rotation.set(0, Math.atan2(-tg.z, tg.x), 0); log.rotateZ(Math.asin(Math.max(-1, Math.min(1, tg.y)))); return p; };
  place(0);
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - st) > 8) return; k.say('🪵 All aboard the log! Hold on tight!', true);
    let u = 0, v = 3, splashed = false, crest = .6, off = 0, onB = false, ub = 0, vb = 0; for (const f of flumeStars) { f.got = false; f.m.visible = true; }
    k.say('🪵 Steer the log with ◀ ▶ to catch the stars! Press JUMP to SPLASH!', true);
    jupiterRide(k, 'logride', (R, dt) => {
      if (onB) { vb = Math.min(16, vb + dt * 9); ub = Math.min(1, ub + vb / lenB * dt); const pb = place(ub, pathB); P.x = pb.x; P.y = pb.y + .25; P.z = pb.z; R.roll = -.5; if (Math.random() < dt * 12) k.api.burst(pb.x, pb.y, pb.z, ['#ffffff', '#cfefff'], 2, 1.4);
        if (ub >= 1) { onB = false; u = uJ; v = vb; crest = PJ.y + vb * vb / 18; k.api.burst(pb.x, pb.y + .4, pb.z, ['#ffffff', '#4fb8ff'], 20, 3); k.Sound.boing(); } return false; }
      if (!R.forked && u >= uF - .002 && u <= uF + .01) { R.forked = true; if (off < -.2) { onB = true; ub = 0; vb = v; R.shortcut = true; k.Sound.whoosh(); k.say('💦 The waterfall shortcut! SPLOOSH!', true); return false; } }
      path.getTangentAt(u, tg); const lift = tg.y > .12 && u < .9, y0 = path.getPointAt(u).y;
      if (lift) { v = 3.2; crest = y0; if (R.t % .4 < dt) k.Sound.tone(220, .05, 'square', .02, 1); }
      else { crest = Math.max(y0, crest - dt * .35); v = Math.max(2.6, Math.min(17, Math.sqrt(7 + 2 * 9 * Math.max(0, crest - y0)))); if (splashed) v = Math.max(2.2, v - dt * 14); }
      u = Math.min(1, u + v / len * dt); const p = place(u); R.maxY = Math.max(R.maxY || 0, p.y); R.maxV = Math.max(R.maxV || 0, v);
      const sx = k.api.stick ? k.api.stick().x : 0; off = Math.max(-.45, Math.min(.45, off + sx * dt * 1.6 * (lift ? 0 : 1))); if (lift || u > .95) off *= .9;
      side.set(-tg.z, 0, tg.x).normalize(); log.position.x += side.x * off; log.position.z += side.z * off; p.x += side.x * off; p.z += side.z * off; R.offMax = Math.max(R.offMax || 0, Math.abs(off));
      for (const f of flumeStars) if (!f.got && Math.abs(u - f.u) < .006 && Math.abs(off - f.off) < .3) { f.got = true; f.m.visible = false; R.stars = (R.stars || 0) + 1; k.Sound.tone(560 + R.stars * 60, .15, 'sine', .07, 1.5); k.api.burst(f.m.position.x, f.m.position.y, f.m.position.z, ['#ffd23f', '#ffffff'], 10, 1.6); }
      if (u > .4 && u < .55 && Math.random() < dt * 4) k.api.burst(p.x + (Math.random() - .5), p.y + .2, p.z, ['#ffffff', '#cfefff'], 3, 1.2);   // foam on the rapids
      if (!splashed && u > .93 && p.y < 1 && v > 6) { splashed = true; R.splashed = true; for (let i = 0; i < 4; i++) k.api.burst(p.x + (Math.random() - .5) * 2, .6 + i * .5, p.z, ['#ffffff', '#cfefff', '#4fb8ff'], 30, 5); k.Sound.whoosh && k.Sound.whoosh(); k.say('💦 SPLAAASH!', true); }
      if (!R.whee && u > .6 && v > 10) { R.whee = 1; k.Sound.whoosh && k.Sound.whoosh(); }
      P.x = p.x; P.y = p.y + .25; P.z = p.z; P.facing = tg.x >= 0 ? 1 : -1; R.roll = Math.max(-.6, Math.min(.6, Math.asin(Math.max(-1, Math.min(1, tg.y))) * (tg.x >= 0 ? 1 : -1)));
      return u >= 1; }, () => { P.x = st + 66; P.y = 0; P.z = 0; place(0); k.say('🪵 What a ride! Tap the log to ride again!', true); }, { noExit: true });
    if (P.ride) P.ride.onJump = () => { k.api.burst(P.x, P.y + .6, P.z, ['#ffffff', '#cfefff', '#4fb8ff'], 18, 3); k.Sound.pop && k.Sound.pop(); P.ride.splashes = (P.ride.splashes || 0) + 1; }; };
  k.tapIt(log, go, st, 'venuslogride');
  k.tapIt(pool, () => k.fact('🌊 The splash pool! Real Venus is far too hot for water, so this water is pretend!', 'venuspool'), pc.x, 'venuspool');
}
const venus = {
  sections: [
    k => { venusLogRide(k, k.s0); k.rocketSign(k.s0 + 4); },   // area 2: the giant log ride
    k => { const X = k.s0; for (let i = 0; i < 6; i++) k.sball(X + 14 + i * 15, .4, -7 - (i % 3) * 2, 2 + (i % 2), 1.2, 1.6, '#d8a060', { r: .9 }); k.rocketSign(X + 100); },
  ],
};

// ---------- (build 68) 🪐 SATURN: THE STAR BLASTER (spin, shoot up, drop) and the RING RACEWAY ----------
function saturnStarBlaster(k, X) {
  const P = k.P, cx = X + 40, cz = -5, T = 60, b = makeBatch(), cyl = new THREE.CylinderGeometry(1, 1, 1, 20); /* (build 71: 60 m, was 38) */
  for (let i = 0; i < 20; i++) b.put(cyl, cx, i * 3 + 1.5, cz, i % 2 ? '#ffffff' : '#9b6cff', [.9, 3, .9]);
  b.put(new THREE.ConeGeometry(1, 1, 20), cx, T + 2.2, cz, '#ffd23f', [1.6, 3, 1.6]); b.put(new THREE.SphereGeometry(1, 14, 10), cx, T + 4, cz, '#ff4f9a', .5);
  b.put(cyl, cx, .25, cz, '#5a4a8a', [5.5, .5, 5.5]); const tw = b.mesh(shinyMat()); tw.castShadow = true; k.add(tw);
  // the spinning ring of seats (one mesh), lights chasing round
  const rig = new THREE.Group(); rig.position.set(cx, 1.2, cz); k.add(rig); { const rb = makeBatch(); rb.put(new THREE.TorusGeometry(3.2, .18, 10, 40), 0, 0, 0, '#ffd23f', 1, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 3.2, z = Math.sin(a) * 3.2; rb.put(new THREE.BoxGeometry(1, 1, 1), x, .3, z, ['#ff4f6a', '#5aa8ff', '#7fe0a0', '#ff9a2e'][i % 4], [.8, .6, .8], [0, -a, 0]); rb.put(new THREE.BoxGeometry(1, 1, 1), x * 1.08, .8, z * 1.08, '#ffffff', [.12, .9, .7], [0, -a, 0]); }
    for (let i = 0; i < 4; i++) rb.put(new THREE.BoxGeometry(1, 1, 1), 0, 0, 0, '#c9a6ff', [6.4, .12, .2], [0, i * Math.PI / 4, 0]); rig.add(rb.mesh(shinyMat())); }
  let idle = .4; k.U.push(dt => { if (!(P.ride && P.ride.type === 'blaster')) { rig.rotation.y += dt * idle; rig.position.y += (1.2 - rig.position.y) * Math.min(1, dt * 3); } });
  starField(k, [...Array(10)].map((_, i) => { const a = i / 10 * Math.PI * 2; return [cx + Math.cos(a) * 3.2, 30 + (i % 3) * 11, cz - Math.sin(a) * 3.2]; }), () => { k.Sound.chime(); k.say('⭐ You caught all the Star Blaster stars!', true); k.disc('saturnblasterstars'); });
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - cx) > 9) return; k.say('🌀 Buckle up! Press JUMP to spin faster: the faster you spin, the higher you BLAST OFF!', true);
    let ph = 'spin', w = 0, y = 1.2, vy = 0, wMax = 5;
    const RR = jupiterRide(k, 'blaster', (R, dt) => {
      if (ph === 'spin') { w = Math.min(wMax, w + dt * 2.2); if (R.t > 5.5) { ph = 'up'; vy = 14 + w * 3; R.wLaunch = w; k.Sound.whoosh && k.Sound.whoosh(); k.say('🚀 WHOOOOSH! Up we go!', true); } }
      else if (ph === 'up') { y += vy * dt; vy = vy - dt * 9; if (y >= T - 3 || vy <= 0) { y = Math.min(y, T - 3); ph = 'hang'; R.h = R.t; } }
      else if (ph === 'hang') { w = Math.max(w, 3); if (R.t - R.h > 2.2) { ph = 'drop'; vy = 0; k.say('😮 Uh oh... DOWN!', true); } }
      else if (ph === 'drop') { vy -= 22 * dt; y += vy * dt; if (y <= 2.2) { y = 2.2; ph = 'bounce'; vy = 6; k.Sound.boing && k.Sound.boing(); } }
      else if (ph === 'bounce') { vy -= 14 * dt; y += vy * dt; if (y <= 1.2) { y = 1.2; ph = 'slow'; } }
      else if (ph === 'slow') { w = Math.max(0, w - dt * 2.5); if (w <= .2) return true; }
      rig.rotation.y += w * dt; rig.position.y = y; R.maxY = Math.max(R.maxY || 0, y); R.maxW = Math.max(R.maxW || 0, w);
      const a = -rig.rotation.y; P.x = cx + Math.cos(a) * 3.2; P.z = cz + Math.sin(a) * 3.2; P.y = y + .3; P.facing = Math.sin(a) > 0 ? -1 : 1; R.roll = Math.min(.5, w * .07);
      if (w > 4 && Math.random() < .15) k.api.burst(P.x, P.y + .5, P.z, ['#ffffff', '#ffd23f', '#c9a6ff'], 2, 1.5); return false;
    }, () => { P.x = cx + 4.6; P.y = 0; P.z = 0; k.say('🌀 Wow! Tap the Star Blaster to go again!', true); }, { noExit: true });
    const RP = P.ride; if (RP) RP.onJump = () => { if (ph === 'spin') { wMax = Math.min(10, wMax + 1.2); w = Math.min(wMax, w + .8); k.Sound.tone(300 + wMax * 40, .1, 'triangle', .05, 2); k.api.burst(P.x, P.y + .5, P.z, ['#ffd23f', '#c9a6ff'], 6, 1.4); } }; };
  k.tapIt(rig, go, cx, 'saturnblaster'); k.tapIt(tw, go);
}
function saturnRingRace(k, X) {
  const P = k.P, pad = X + 20, C = new THREE.Vector3(X + 60, 34, -64), RR = 40, tilt = .22;
  // a giant Saturn in the sky, with its real-looking rings, and the raceway running round on the rings
  const sat = k.sball(C.x, C.y, C.z, 16, 15, 16, '#f0d9a8', { r: .7 });
  const ringG = new THREE.Group(); ringG.position.copy(C); ringG.rotation.x = tilt; k.add(ringG);
  [['#e8d29a', 22, 28], ['#cfb37a', 28.5, 33], ['#f3e6c0', 33.5, 37.5], ['#b89a68', 43, 50]].forEach(([c, r0, r1]) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), new THREE.MeshPhysicalMaterial({ color: c, roughness: .6, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; ringG.add(m); });
  { const rb = makeBatch(); rb.put(new THREE.TorusGeometry(RR, 2.2, 3, 120), 0, -.05, 0, '#5a4a8a', [1, 1, .06], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 2; for (const r of [RR - 2.3, RR + 2.3]) rb.put(new THREE.BoxGeometry(1, 1, 1), Math.cos(a) * r, .12, Math.sin(a) * r, i % 2 ? '#ff4f9a' : '#ffffff', [.5, .22, .5], [0, -a, 0]); }
    for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 24 + (i * 37 % 26); rb.put(new THREE.IcosahedronGeometry(.4 + (i % 4) * .25, 0), Math.cos(a) * r, (i % 3 - 1) * .6, Math.sin(a) * r, i % 2 ? '#ffffff' : '#dce6f0'); }
    rb.put(new THREE.BoxGeometry(1, 1, 1), RR, 2.2, 0, '#1d1d2b', [4.6, .5, .3]); for (let i = 0; i < 6; i++) rb.put(new THREE.BoxGeometry(1, 1, 1), RR - 2 + i * .8, 2.2, .2, i % 2 ? '#ffffff' : '#1d1d2b', [.8, .5, .05]);
    ringG.add(rb.mesh(shinyMat())); }
  // the launch pad on the ground, and the racer (a rocket kart)
  k.sball(pad, .1, -2.8, 2.6, .2, 2, '#ff4f9a', { em: '#ff4f9a', ei: .3 }); const arrow = k.sball(pad, 1.4, -2.8, .5, .9, .5, '#ffd23f', { em: '#ffb000', ei: .5 });
  const kart = new THREE.Group(); { const kb = makeBatch(), box = new THREE.BoxGeometry(1, 1, 1); kb.put(box, 0, .25, 0, '#5aa8ff', [2, .4, 1.1]); kb.put(new THREE.ConeGeometry(.4, .9, 12), 1.2, .3, 0, '#ffd23f', 1, [0, 0, -Math.PI / 2]); kb.put(box, -.7, .65, 0, '#ffffff', [.3, .5, 1]);
    for (const z of [-.6, .6]) for (const x of [-.6, .6]) kb.put(new THREE.CylinderGeometry(.24, .24, .16, 12), x, .1, z, '#2b2d42', 1, [Math.PI / 2, 0, 0]); kb.put(new THREE.ConeGeometry(.22, .7, 10), -1.2, .3, 0, '#ff6a3c', 1, [0, 0, Math.PI / 2]); kart.add(kb.mesh(shinyMat())); }
  kart.position.set(pad, .3, -2.8); kart.userData.dynamic = true; k.add(kart); k.U.push((dt, t) => { arrow.position.y = 1.4 + Math.sin(t * 3) * .2; });
  const on = (a, h, l = 0) => { const v = new THREE.Vector3(Math.cos(a) * (RR + l), h, Math.sin(a) * (RR + l)).applyEuler(ringG.rotation).add(C); return v; };
  // (build 71) boost pads and stars on the track (by angle and lane), and two friendly racers
  const pads = [], stars = [], tb = makeBatch(); for (let i = 0; i < 8; i++) { const pa = (i / 8) * Math.PI * 2 + .3, l = [-1.5, 0, 1.5][i % 3]; pads.push({ a: pa, l }); tb.put(new THREE.BoxGeometry(1, 1, 1), Math.cos(-pa) * (RR + l), .2, Math.sin(-pa) * (RR + l), '#3cf0ff', [1.6, .08, 1.2], [0, pa, 0]); }
  ringG.add(tb.mesh(shinyMat())); const smat = toy('#ffd23f', { em: '#ffb000', ei: .8 });
  for (let i = 0; i < 12; i++) { const sa = (i / 12) * Math.PI * 2 + .12, l = [1.6, -1.6, 0, .8][i % 4], m = new THREE.Mesh(new THREE.OctahedronGeometry(.45), smat); m.position.set(Math.cos(-sa) * (RR + l), 1.1, Math.sin(-sa) * (RR + l)); ringG.add(m); stars.push({ a: sa, l, m }); }
  const rivals = [['#ff4f6a', -1.6], ['#7fe0a0', 1.6]].map(([c, l]) => { const m = new THREE.Group(); const rb2 = makeBatch(); rb2.put(new THREE.BoxGeometry(1, 1, 1), 0, .25, 0, c, [2, .4, 1.1]); rb2.put(new THREE.ConeGeometry(.4, .9, 10), 1.2, .3, 0, '#ffffff', 1, [0, 0, -Math.PI / 2]); m.add(rb2.mesh(shinyMat())); m.visible = false; m.userData.dynamic = true; k.add(m); return { m, l, a: 0, v: 14 }; });
  // (build 72) two JUMP RAMPS on the outside lane: drive over them (▲ to the outside) and the kart flies through the air
  const ramps = [Math.PI * .55, Math.PI * 1.45], rb3 = makeBatch(); for (const ra of ramps) rb3.put(new THREE.BoxGeometry(1, 1, 1), Math.cos(-ra) * (RR + 1.6), .35, Math.sin(-ra) * (RR + 1.6), '#ffd23f', [2.6, .7, 1.4], [0, ra, .25]);
  ringG.add(rb3.mesh(shinyMat()));
  // (build 75) THE OUTER RING ROUTE: at the fork (a glowing gate), stay on the OUTSIDE lane and you swing out onto a second ring
  //  for half a lap: through a starry tunnel, past its own stars, then back onto the main track
  const OA = Math.PI * .2, OB = Math.PI * 1.2, OR = 8, ob = makeBatch(), og = makeBatch();
  { const arc = new THREE.TorusGeometry(RR + OR, 2.2, 3, 70, OB - OA - .3); ob.put(arc, 0, -.05, 0, '#3a6a9a', [1, 1, .06], [Math.PI / 2, 0, -(OA + .15)]);
    for (let i = 0; i < 9; i++) { const ta = OA + .35 + i * .08; og.put(new THREE.TorusGeometry(3, .2, 4, 16, Math.PI), Math.cos(-ta) * (RR + OR), 0, Math.sin(-ta) * (RR + OR), i % 2 ? '#62f0ff' : '#ff6fd8', 1, [0, ta, 0]); }
    for (const fa of [OA, OB]) og.put(new THREE.TorusGeometry(3.4, .25, 6, 20), Math.cos(-fa) * (RR + 3), 1, Math.sin(-fa) * (RR + 3), '#ffd23f', 1, [0, fa, 0]); }
  ringG.add(ob.mesh(shinyMat())); ringG.add(og.mesh(glowMat()));
  for (let i = 0; i < 4; i++) { const sa = OA + .9 + i * .45, m = new THREE.Mesh(new THREE.OctahedronGeometry(.45), smat); m.position.set(Math.cos(-sa) * (RR + OR), 1.1, Math.sin(-sa) * (RR + OR)); ringG.add(m); stars.push({ a: sa, l: OR, m, outer: true }); }
  let lane = 0, boost = 0, hop = 0, hv = 0, outer = 0, onOuter = false;
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - pad) > 7) return; k.fact('🏁 The Ring Raceway! YOU drive: ► to go faster, ◄ to slow down, ▲ ▼ to change lanes. Drive over the blue pads to BOOST and catch the stars!', 'saturnrace');
    let ph = 'up', a = 0, laps = 0, v = 0; const start = kart.position.clone(), top = on(0, .4);
    jupiterRide(k, 'ringrace', (R, dt) => {
      if (ph === 'up') { if (R.t < .05) { lane = 0; boost = 0; outer = 0; onOuter = false; for (const s of stars) { s.got = false; s.m.visible = true; } for (const o of rivals) { o.a = .02 * (o.l > 0 ? 1 : -1); o.m.visible = true; } } const q = Math.min(1, R.t / 3.5), e = q * q * (3 - 2 * q); kart.position.lerpVectors(start, top, e); kart.position.y += Math.sin(q * Math.PI) * 10; if (q >= 1) { ph = 'race'; k.say('🏁 Three, two, one... GO!', true); k.Sound.chime && k.Sound.chime(); } }
      else if (ph === 'race') { // (build 71) YOU DRIVE: ► faster, ◄ brake (no input: a gentle cruise), ▲ ▼ change lane; boost pads and stars
        const st = k.api.stick ? k.api.stick() : { x: 0, y: 0 }, want = st.x > .2 ? 32 : st.x < -.2 ? 4 : 13; v += (want + boost - v) * Math.min(1, dt * (st.x < -.2 ? 2.5 : 1.2)); boost = Math.max(0, boost - dt * 6);
        lane = Math.max(-2, Math.min(2, lane + st.y * dt * 3)); const da = v / (RR + lane) * dt; a -= da; R.maxV = Math.max(R.maxV || 0, v); R.lanes = Math.max(R.lanes || 0, Math.abs(lane));
        for (const p of pads) if (Math.abs((((-a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - p.a) < .03 && Math.abs(lane - p.l) < .9 && R.t - (p.t || -9) > 2) { p.t = R.t; boost = 16; R.boosts = (R.boosts || 0) + 1; k.Sound.whoosh(); k.say('⚡ BOOST!', false); }
        for (const s of stars) if (!s.got && Math.abs((((-a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - s.a) < .025 && Math.abs(lane + outer - s.l) < .9) { s.got = true; s.m.visible = false; R.stars = (R.stars || 0) + 1; k.Sound.tone(600 + R.stars * 50, .15, 'sine', .07, 1.5); }
        for (const o of rivals) { o.a -= o.v / (RR + o.l) * dt; o.v = 14 + Math.sin(R.t * .7 + o.l) * 4 + (o.a > a ? 3 : -2); o.m.position.copy(on(o.a, .4, o.l)); o.m.lookAt(on(o.a - .05, .4, o.l)); o.m.rotateY(-Math.PI / 2); }
        if (a <= -(laps + 1) * Math.PI * 2) { laps++; R.laps = laps; k.Sound.chime && k.Sound.chime(); k.say(laps < 3 ? `🏁 Lap ${laps}! Keep going!` : `🏆 You finished the race around Saturn's rings${R.stars ? ' with ' + R.stars + ' stars' : ''}! Everybody wins!`, true); if (laps >= 3) { ph = 'down'; R.d = R.t; } }
        const na = ((((-a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)); if (!hop) for (const ra of ramps) if (Math.abs(na - ra) < .02 && lane > 1 && v > 10) { hop = .001; hv = 7 + v * .15; R.jumps = (R.jumps || 0) + 1; k.Sound.whoosh(); k.api.burst(kart.position.x, kart.position.y, kart.position.z, ['#ffd23f', '#ffffff'], 12, 2); }
        if (hop) { hv -= 14 * dt; hop += hv * dt; if (hop <= 0) { hop = 0; k.Sound.boing(); } }
        const nb = ((((-a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
        if (!onOuter && Math.abs(nb - OA) < .03 && lane > 1.2) { onOuter = true; R.outer = (R.outer || 0) + 1; k.Sound.chime(); k.say('🌌 The outer ring route! Through the star tunnel!', false); }
        if (onOuter && nb > OB - .02 && nb < OB + .3) onOuter = false;
        outer += ((onOuter ? OR - lane : 0) - outer) * Math.min(1, dt * 1.5);
        kart.position.copy(on(a, .4 + hop, lane + outer)); const ahead = on(a - .05, .4 + hop, lane + outer); kart.lookAt(ahead); kart.rotateY(-Math.PI / 2); if (Math.random() < .3) k.api.burst(kart.position.x, kart.position.y + .3, kart.position.z, ['#ff9a2e', '#ffd23f', '#ffffff'], 1, .8); }
      else if (ph === 'down') { for (const o of rivals) o.m.visible = false; const q = Math.min(1, (R.t - R.d) / 3.5), e = q * q * (3 - 2 * q); kart.position.lerpVectors(top, start, e); kart.position.y += Math.sin(q * Math.PI) * 8; if (q >= 1) { kart.rotation.set(0, 0, 0); return true; } }
      P.x = kart.position.x; P.y = kart.position.y + .35; P.z = kart.position.z; P.facing = 1; R.maxY = Math.max(R.maxY || 0, P.y); return false;
    }, () => { P.x = pad + 3; P.y = 0; P.z = 0; kart.position.copy(start); k.say('🏆 What a race! Tap the rocket kart to race again!', true); }, { noExit: true }); };
  k.tapIt(kart, go, pad, 'saturnracego'); k.tapIt(sat, () => k.fact('🪐 Saturn\'s rings are so wide that the Earth could roll along them... many times over!', 'saturnrings'), C.x, 'saturnrings');
}
const saturn = {
  sections: [
    k => { saturnStarBlaster(k, k.s0); k.rocketSign(k.s0 + 4); },   // area 2: the Star Blaster
    k => { saturnRingRace(k, k.s0); k.rocketSign(k.s0 + 104); },    // area 3: the Ring Raceway
  ],
};

export const PLANET_EXTRA = { moon, mars, pluto, jupiter, uranus, mercury, neptune, venus, saturn }; // (build 68: + Saturn's Star Blaster and Ring Raceway) // (build 68: Neptune's wind rides; Venus's log ride)   // (build 66: Jupiter's playground and super slide) 
export const placeWidth = id => PLANET_EXTRA[id] ? 330 : 110;
export const SECTION = 110;
