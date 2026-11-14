// ===================================================================
// planets.js (build 50): BIGGER PLANETS. Each expanded place is 330 m long instead of 110: the landing area (built by
// space.js as before) plus two new areas, each built only when you walk near it, and the whole planet is freed from
// memory when you fly away. Shapes come from a few shared unit geometries (scaled), so new scenery adds almost no memory.
//
// Everything is pictures, sounds and short spoken sentences. Real facts are said as facts; the pretend parts (our
// friendly aliens, the pretend explorer stations) are said to be pretend.
//
// kit (from space.js): { X, s0 (where this area starts), add, ball, box, sball, sbox, tapIt, fact, say, disc, Sound, U,
//   P, G, api, placeAlien, plat, rocketSign, sky }
// ===================================================================
import * as THREE from 'three';
import { toy } from './creatures.js';

const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const Cap = s => s[0].toUpperCase() + s.slice(1);

// ---------- 🌕 THE MOON: crater valley and the explorer station; moon mountains and the hidden cave ----------
const moon = {
  all(k) { // footprints in the moon dust wherever you walk (one shared instanced mesh: 40 prints, the oldest fades away)
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
      k.tapIt(mouth, () => k.say('🕳️ A cave! Walk up to it and look inside.', true), cvX, 'mooncave');
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
      k.U.push(dt => { if (dusk <= 0) return; dusk = Math.max(0, dusk - dt); const a = Math.min(1, Math.min(dusk, 6 - dusk) / 1.2); tmp.copy(red).lerp(blue, a); k.sky.material.color.copy(tmp); k.sky.material.emissive.copy(tmp); sun.position.y = 9 - a * 3; });
      k.placeAlien(X + 26, -2, 3); k.placeAlien(X + 76, -2.4, 4);
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

export const PLANET_EXTRA = { moon, mars };
export const placeWidth = id => PLANET_EXTRA[id] ? 330 : 110;
export const SECTION = 110;
