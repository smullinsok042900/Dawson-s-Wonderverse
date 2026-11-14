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


// ---------- ☀️ MERCURY (build 51): the crater fields and light and shadow; the sun-side rocks ----------
const mercury = {
  sections: [
    // ----- area 2: CRATER FIELDS and SHADOW PLAY -----
    k => { const X = k.s0;
      // the giant Caloris crater: rings in the ground; tap the middle
      for (let r = 0; r < 3; r++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(9 - r * 2.6, .35, 6, 40), toy(['#a8988a', '#8f8072', '#b8a898'][r], { r: .95 })); ring.rotation.x = Math.PI / 2; ring.scale.z = .4; ring.position.set(X + 22, .05, -6); k.add(ring); }
      const mid = k.sball(X + 22, .02, -3, 1.4, .1, 1.4, '#c9b8a6', { r: .9 });
      k.tapIt(mid, () => k.fact('🕳️ This is a pretend Caloris crater. The real one on Mercury is so big a whole country could fit inside!', 'caloris'), X + 22, 'caloris');
      // light and shadow: tap the little sun lamp to move it; the tall rock's shadow swings the other way
      const rock = k.sbox(X + 44, 0, -3, .9, 2.6, .9, '#8f8072', { r: .9 }); const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, .9), toy('#2a2230', { r: 1 })); shadow.rotation.x = -Math.PI / 2; shadow.position.set(X + 44, .02, -3); k.add(shadow);
      const lamp = k.sball(X + 44, 4.2, -3, .5, .5, .5, '#fff3a6', { em: '#ffd23f', ei: 1 }); const SP = [-4, 0, 4]; let at = 0, move = 0, from = -4;
      const shift = () => { from = SP[at]; at = (at + 1) % 3; move = .001; k.Sound.tone(500 + at * 100, .15, 'sine', .05, 1.2); k.say(at === 1 ? '☀️ The Sun is right on top: a tiny shadow!' : `☀️ The Sun moves ${at === 2 ? 'that way' : 'this way'}, and the shadow points the other way!`, true); k.disc('mercuryshadow', '☀️ Move the little sun and watch the shadow!'); };
      k.tapIt(lamp, shift, X + 44, 'mercuryshadow'); k.tapIt(rock, shift);
      k.U.push(dt => { if (move) { move = Math.min(1, move + dt * 1.5); if (move >= 1) move = 0; } const lx = move ? from + (SP[at] - from) * move : SP[at]; lamp.position.set(X + 44 + lx, 4.2 - Math.abs(lx) * .35, -3); const len = .3 + Math.abs(lx) * .9; shadow.scale.set(len, 1, 1); shadow.position.x = X + 44 - Math.sign(lx) * (len / 2 + .45); });
      // match the shadow: each rock slides onto the dark shape that matches it
      const sx = X + 66, shapes = [['round', new THREE.CylinderGeometry(.45, .45, .5, 24)], ['square', new THREE.BoxGeometry(.8, .5, .8)], ['pointy', new THREE.ConeGeometry(.55, .9, 4)]]; let matched = 0;
      const items = shapes.map(([n, geo], i) => { const spot = new THREE.Mesh(geo, toy('#2a2230', { r: 1 })); spot.scale.y = .05; spot.position.set(sx + i * 2.2, .02, -3.4); k.add(spot); const r = new THREE.Mesh(geo, toy(['#ff9a2e', '#d8a070', '#c9b8a6'][i], { r: .8 })); const home = new THREE.Vector3(sx - 4 + ((i + 1) % 3) * 1.6, .3, -1.4); r.position.copy(home); k.add(r); r.userData.go = 0;
        k.tapIt(r, () => { if (r.userData.go) return; r.userData.go = .001; k.Sound.whoosh(); k.say(['⚫ The round rock fits the round shadow!', '⬛ The square rock fits the square shadow!', '🔺 The pointy rock fits the pointy shadow!'][i], true); k.disc('mercurymatch', '🔍 Match each rock to its shadow!'); }); return { r, home, to: new THREE.Vector3(sx + i * 2.2, .3, -3.4) }; });
      k.G.interact.push({ x: sx, y: 0, layer: 'space', disc: 'mercurymatch', run: () => { const q = items.find(q => !q.r.userData.go); q && q.r.userData.tap(); }, hintY: 2.2 });
      k.U.push(dt => { for (const q of items) { const u = q.r.userData; if (!u.go || u.done) continue; u.go += dt; const kk = Math.min(1, u.go / .8); q.r.position.lerpVectors(q.home, q.to, kk); q.r.position.y += Math.sin(kk * Math.PI) * 1.4; if (kk >= 1) { u.done = 1; matched++; k.Sound.tone(700 + matched * 120, .15, 'sine', .05, 1.2); if (matched === 3) { k.Sound.chime(); k.say('🎉 Every rock found its shadow!', true); setTimeout(() => { matched = 0; for (const p of items) { p.r.userData.go = 0; p.r.userData.done = 0; p.r.position.copy(p.home); } }, 3500); } } } });
      // a secret tunnel through a rock wall: walk under it; something shiny waits inside
      const tx = X + 92; k.sbox(tx, 3, -1.2, 10, 3, 3.4, '#8f8072', { r: .95 }); k.sbox(tx - 5.3, 0, -2.6, .6, 3, 1.6, '#8f8072', { r: .95 }); k.sbox(tx + 5.3, 0, -2.6, .6, 3, 1.6, '#8f8072', { r: .95 }); /* (the side walls stand behind the path: she walks under the roof) */
      for (let i = 0; i < 6; i++) { const d = k.sball(tx - 4 + i * 1.6, 2.6, -2.6, .1, .1, .1, '#ffd23f', { em: '#ffd23f', ei: 1 }); k.U.push((dt, t) => { d.material.emissiveIntensity = .4 + Math.sin(t * 3 + i) * .4; }); }
      const gem = k.sball(tx, .9, -1.4, .35, .45, .35, '#9fe6ff', { em: '#9fe6ff', ei: .7 }); let inside = false;
      k.U.push((dt, t) => { gem.rotation.y += dt * 2; const P = k.P; const now = P.layer === 'space' && Math.abs(P.x - tx) < 4.6 && P.y < 2.5; if (now && !inside) { k.Sound.twinkle(); k.fact('🕳️ A secret tunnel! Something shiny is hiding in here.', 'mercurytunnel'); } inside = now; });
      k.tapIt(gem, () => { if (!gem.visible) return; gem.visible = false; k.Sound.chime(); k.api.burst && k.api.burst(tx, 1, -1.4, ['#9fe6ff', '#ffffff'], 14, 2.5); k.say('💎 You found the secret tunnel crystal!', true); k.disc('mercurygem'); setTimeout(() => { gem.visible = true; }, 20000); });
      k.G.interact.push({ x: tx, y: 0, layer: 'space', disc: 'mercurygem', run: () => gem.userData.tap && gem.userData.tap(), hintY: 2 });
      k.placeAlien(X + 32, -2.2, 3); k.placeAlien(X + 78, -2, 4);
      k.rocketSign(X + 4);
    },
    // ----- area 3: THE SUN-SIDE ROCKS -----
    k => { const X = k.s0;
      // sun-stones hidden in the craters: find all five
      let found = 0; const stones = [0, 1, 2, 3, 4].map(i => { const cx = X + 10 + i * 9; k.sball(cx, -.1, -2.4 - (i % 2), 1.5, .2, 1.1, '#7a6a5c', { r: .95 }); const st = k.sball(cx, .2, -2.4 - (i % 2), .26, .2, .26, '#ffb84a', { em: '#ff9a2e', ei: .6 });
        k.tapIt(st, () => { if (!st.visible) return; st.visible = false; found++; k.Sound.tone(600 + found * 100, .15, 'triangle', .05, 1.2); k.api.burst && k.api.burst(cx, .6, -2.4, ['#ffd23f', '#ff9a2e'], 8, 2); k.say(found === 5 ? '🌟 All five sun-stones! You are a super finder!' : `🌟 ${Cap(NUM[found])} sun-stone${found > 1 ? 's' : ''}!`, true); k.disc('sunstones', '🌟 Find the shiny sun-stones hiding in the craters!'); if (found === 5) setTimeout(() => { found = 0; for (const q of stones) q.visible = true; }, 4000); }); return st; });
      k.G.interact.push({ x: X + 10, y: 0, layer: 'space', disc: 'sunstones', run: () => { const q = stones.find(q => q.visible); q && q.userData.tap(); }, hintY: 2 });
      k.U.push((dt, t) => { for (const q of stones) if (q.visible) q.material.emissiveIntensity = .4 + Math.sin(t * 4 + q.position.x) * .3; });
      // hot in the sun, cold in the shade: a big cliff casts shade, and the thermometer follows you in and out of it
      const shadeA = X + 58, shadeB = X + 68; k.sbox((shadeA + shadeB) / 2, 0, -6, 10, 9, 3, '#6a5a4e', { r: .95 }); const shade = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), toy('#3a3040', { r: 1, opacity: .45 })); shade.rotation.x = -Math.PI / 2; shade.position.set((shadeA + shadeB) / 2, .03, -2); k.add(shade);
      const thX = X + 54; k.sbox(thX, 0, -2.6, .5, 3.2, .4, '#ffffff', { r: .3 }); const mer = k.sbox(thX, .15, -2.4, .3, 1, .3, '#ff2a2a', { em: '#ff2a2a', ei: .5 }); let lvl = 1, wasShade = null;
      k.U.push(dt => { const P = k.P; if (P.layer !== 'space') return; const inShade = P.x > shadeA && P.x < shadeB, near = Math.abs(P.x - (shadeA + thX) / 2) < 14; if (!near) return; lvl += ((inShade ? .1 : 1) - lvl) * Math.min(1, dt * 2); mer.scale.y = .3 + lvl * 2.6; mer.material.color.set(lvl > .5 ? '#ff2a2a' : '#4fa8ff'); mer.material.emissive.copy(mer.material.color);
        if (wasShade !== null && inShade !== wasShade) { k.Sound.tone(inShade ? 300 : 700, .2, 'sine', .04, inShade ? .7 : 1.4); k.fact(inShade ? '🥶 Brrr! In the shade on Mercury it is freezing cold!' : '🥵 Phew! In the sunshine on Mercury it is super hot!', 'mercurytemp'); } wasShade = inShade; });
      k.G.interact.push({ x: thX, y: 0, layer: 'space', disc: 'mercurytemp', run: () => k.fact('🌡️ Walk into the shade and back into the sun: watch the thermometer!', 'mercurytemp'), hintY: 2.4 });
      // a very long day: tap and little Mercury turns once, slowly, while little Earth spins round and round
      const mx = X + 84; k.sbox(mx, 0, -3, 4, .8, 1.4, '#5a4a6a', { r: .5 }); const me = k.sball(mx - 1, 1.6, -3, .6, .6, .6, '#c9b8a6', { r: .8 }), ea = k.sball(mx + 1, 1.6, -3, .45, .45, .45, '#3d7be0', { r: .5 });
      const mk = k.sbox(mx - 1, 1.5, -2.42, .14, .2, .06, '#ff4f6a'), ek = k.sbox(mx + 1, 1.5, -2.57, .12, .18, .06, '#ffd23f'); me.add(mk); mk.position.set(0, 0, .58); mk.scale.set(.24, .34, .1); ea.add(ek); ek.position.set(0, 0, .45); ek.scale.set(.25, .4, .13); let spin = 0;
      const go = () => { if (spin) return; spin = .001; k.Sound.tone(400, .3, 'sine', .04, 1.2); k.fact('🌍 Look! Earth spins round and round, but Mercury turns so slowly: one day on Mercury lasts as long as about 176 days on Earth!', 'mercuryday'); };
      k.tapIt(me, go, mx, 'mercuryday'); k.tapIt(ea, go);
      k.U.push(dt => { if (!spin) return; spin += dt; me.rotation.y = Math.min(1, spin / 8) * Math.PI * 2; ea.rotation.y += dt * 9; if (spin > 8.2) { spin = 0; me.rotation.y = 0; } });
      k.placeAlien(X + 36, -2.4, 5); k.placeAlien(X + 98, -2, 6);
      k.rocketSign(X + 4);
    },
  ],
};

// ---------- 💗 PLUTO (build 51): ice mountains and the icicle cave; the frozen valley ----------
const pluto = {
  sections: [
    // ----- area 2: ICE MOUNTAINS and the ICICLE CAVE -----
    k => { const X = k.s0;
      // mountains of water ice (real!): big steps up to a snowflake
      const steps = [[X + 12, 1.4], [X + 15, 2.8], [X + 18, 4.2], [X + 21, 5.6]]; for (const [x, h] of steps) { k.sbox(x, 0, -1.6, 3, h, 2.4, '#e6f2ff', { r: .3, cc: .8 }); k.plat(x - 1.5, x + 1.5, h, { step: true, stepMax: 1.5 }); }
      k.sball(X + 18, -2, -9, 13, 12, 6, '#d8e8f8', { r: .4, cc: .7 });
      const flake = new THREE.Group(); flake.position.set(X + 21, 6.8, -1.6); k.add(flake); for (let i = 0; i < 3; i++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(.9, .1, .1), toy('#ffffff', { em: '#cfefff', ei: .8 })); arm.rotation.z = i * Math.PI / 3; flake.add(arm); } let top = false;
      k.U.push((dt, t) => { flake.rotation.z += dt; flake.rotation.y = Math.sin(t) * .5; const P = k.P; if (!top && P.layer === 'space' && P.y > 5.4 && Math.abs(P.x - (X + 21)) < 1.8) { top = true; k.Sound.chime(); k.api.burst && k.api.burst(X + 21, 7, -1.6, ['#ffffff', '#cfefff'], 18, 3); k.fact('🏔️ You climbed a mountain made of ice! Pluto really has mountains of frozen water.', 'plutopeak'); } });
      k.G.interact.push({ x: X + 12, y: 0, layer: 'space', disc: 'plutopeak', run: () => k.say('🏔️ Climb the icy steps up to the snowflake!', true), hintY: 2.4 });
      // the icicle cave: tap an icicle and it grows longer (drip, drip)
      const cx = X + 44; k.sball(cx, -.5, -5, 6, 4.8, 3.2, '#c8dcf0', { r: .5, cc: .6 }); k.sball(cx, 0, -2.6, 2.4, 2.4, .6, '#1a2a44', { r: 1 });
      const ics = [0, 1, 2, 3, 4].map(i => { const ic = new THREE.Mesh(new THREE.ConeGeometry(.16, 1, 8), toy('#e6f6ff', { r: .2, cc: .9, em: '#9fe6ff', ei: .15 })); ic.rotation.x = Math.PI; ic.position.set(cx - 1.6 + i * .8, 3.2, -2.2); ic.userData.len = .5; ic.scale.y = .5; ic.position.y = 3.2 - .25; k.add(ic);
        k.tapIt(ic, () => { ic.userData.len = ic.userData.len >= 1.8 ? .5 : ic.userData.len + .45; k.Sound.bell([1047, 988, 880, 784, 698][Math.min(4, Math.round((ic.userData.len - .5) / .45))], .04); k.api.burst && k.api.burst(ic.position.x, 3.2 - ic.userData.len, -2.2, ['#cfefff', '#ffffff'], 3, .8); k.say(ic.userData.len === .5 ? '🧊 Snap! A new little icicle.' : '💧 Drip, drip! The icicle grows longer.', true); k.disc('plutoicicles', '🧊 Tap the icicles in the cave and they grow!'); }); return ic; });
      k.G.interact.push({ x: cx, y: 0, layer: 'space', disc: 'plutoicicles', run: () => ics[2].userData.tap(), hintY: 2.2 });
      k.U.push(dt => { for (const ic of ics) { ic.scale.y += (ic.userData.len - ic.scale.y) * Math.min(1, dt * 4); ic.position.y = 3.2 - ic.scale.y / 2; } });
      // texture matching: the smooth ice cube, the bumpy rock and the fluffy snowball each go to their own patch
      const tx = X + 68, TEX = [['smooth', '#bfe6ff', new THREE.BoxGeometry(.7, .7, .7), '🧊 Smooth and slippery ice goes on the smooth ice!'], ['bumpy', '#8a7a6a', new THREE.DodecahedronGeometry(.45), '🪨 The bumpy rock goes on the bumpy rocks!'], ['fluffy', '#ffffff', new THREE.SphereGeometry(.42, 12, 8), '⛄ The fluffy snowball goes on the fluffy snow!']]; let done = 0;
      TEX.forEach(([, c], i) => { const patch = k.sbox(tx + i * 2.6, 0, -3.6, 2, .12, 1.6, ['#cfefff', '#6a5a4e', '#ffffff'][i], { r: [.1, 1, .9][i], cc: [1, 0, 0][i] }); if (i === 1) for (let j = 0; j < 5; j++) k.sball(tx + 2.6 - .7 + (j % 3) * .7, .14, -3.6 - .4 + (j % 2) * .8, .18, .12, .18, '#8a7a6a'); if (i === 2) for (let j = 0; j < 4; j++) k.sball(tx + 5.2 - .5 + j * .35, .15, -3.6 + (j % 2) * .3, .3, .16, .3, '#ffffff', { r: .9 }); });
      const objs = TEX.map(([, c, geo, msg], i) => { const o = new THREE.Mesh(geo, toy(c, { r: [.1, .95, .9][i], cc: [1, 0, 0][i] })); const home = new THREE.Vector3(tx - 4 + ((i + 2) % 3) * 1.4, .45, -1.4); o.position.copy(home); k.add(o); o.userData.go = 0;
        k.tapIt(o, () => { if (o.userData.go) return; o.userData.go = .001; k.Sound.whoosh(); k.say(msg, true); k.disc('plutotextures', '✋ Smooth, bumpy, fluffy: put each one on its matching patch!'); }); return { o, home, to: new THREE.Vector3(tx + i * 2.6, .5, -3.6) }; });
      k.G.interact.push({ x: tx, y: 0, layer: 'space', disc: 'plutotextures', run: () => { const q = objs.find(q => !q.o.userData.go); q && q.o.userData.tap(); }, hintY: 2.2 });
      k.U.push(dt => { for (const q of objs) { const u = q.o.userData; if (!u.go || u.done) continue; u.go += dt; const kk = Math.min(1, u.go / .8); q.o.position.lerpVectors(q.home, q.to, kk); q.o.position.y += Math.sin(kk * Math.PI) * 1.6; if (kk >= 1) { u.done = 1; done++; k.Sound.tone(600 + done * 140, .15, 'sine', .05, 1.2); if (done === 3) { k.Sound.chime(); k.say('🎉 Smooth, bumpy and fluffy: all matched!', true); setTimeout(() => { done = 0; for (const p of objs) { p.o.userData.go = 0; p.o.userData.done = 0; p.o.position.copy(p.home); } }, 3500); } } } });
      k.placeAlien(X + 32, -2.2, 3); k.placeAlien(X + 84, -2, 4);
      k.rocketSign(X + 4);
    },
    // ----- area 3: THE FROZEN VALLEY -----
    k => { const X = k.s0;
      // a frozen lake: run onto it and you glide
      const la = X + 10, lb = X + 34; k.sbox((la + lb) / 2, -.04, -1, lb - la, .1, 5, '#cfefff', { r: .1, cc: 1 }); let told = false;
      k.U.push(dt => { const P = k.P; const on = P.layer === 'space' && P.grounded && P.x > la && P.x < lb; if (on && Math.abs(P.vx) > 1 && !(k.api.keysHeld && k.api.keysHeld())) { P.x = Math.min(lb + 2, P.x + P.vx * dt * .7); if (!told) { told = true; k.fact('⛸️ Wheee! A frozen lake: you glide across the ice!', 'plutolake'); } } });
      k.G.interact.push({ x: la + 2, y: 0, layer: 'space', disc: 'plutolake', run: () => k.say('⛸️ Run onto the ice, then let go and glide!', true), hintY: 1.4 });
      // frozen bubbles drifting by: tap them to pop
      let pops = 0; const bubs = [0, 1, 2, 3, 4].map(i => { const b = k.sball(X + 44 + i * 3, 1.5 + (i % 3) * .6, -2, .4, .4, .4, ['#cfefff', '#ffd1ec', '#e6f6ff', '#d8ffe0', '#fff3c4'][i], { r: .1, cc: 1, opacity: .75 }); b.userData.home = b.position.clone();
        k.tapIt(b, () => { if (!b.visible) return; b.visible = false; pops++; k.Sound.tone(900 + pops * 80, .08, 'sine', .05, 1.6); k.api.burst && k.api.burst(b.position.x, b.position.y, b.position.z, ['#ffffff', '#cfefff'], 8, 1.8); k.say(`🫧 Pop! ${Cap(NUM[Math.min(8, pops)])}!`, true); k.disc('plutobubbles', '🫧 Pop the frozen bubbles!'); setTimeout(() => { b.visible = true; }, 6000); }); return b; });
      k.G.interact.push({ x: X + 50, y: 0, layer: 'space', disc: 'plutobubbles', run: () => { const q = bubs.find(q => q.visible); q && q.userData.tap(); }, hintY: 2.4 });
      k.U.push((dt, t) => { for (const b of bubs) { b.position.y = b.userData.home.y + Math.sin(t * .8 + b.userData.home.x) * .3; b.position.x = b.userData.home.x + Math.sin(t * .5 + b.userData.home.x) * .4; } });
      // a possible ice volcano: tap it and icy slush bubbles up
      const vx = X + 72; const v = new THREE.Mesh(new THREE.ConeGeometry(4.5, 4.4, 20, 1, true), toy('#d8e0ec', { r: .6 })); v.position.set(vx, 2.2, -7); k.add(v); const top = k.sball(vx, 4.3, -7, 1.1, .3, 1.1, '#9fd8ff', { em: '#9fe6ff', ei: .4 }); let ooze = 0;
      k.tapIt(v, () => { ooze = 3; k.Sound.noise ? k.Sound.noise(1, 200, 800, .04) : k.Sound.whoosh(); k.fact('🌋 Scientists think this kind of mountain on Pluto might be an ICE volcano that oozes icy slush instead of hot lava!', 'plutovolcano'); }, vx, 'plutovolcano'); k.tapIt(top, () => v.userData.tap());
      k.U.push(dt => { if (ooze <= 0) return; ooze -= dt; if (Math.random() < dt * 25) k.api.burst && k.api.burst(vx + (Math.random() - .5), 4.6, -7, ['#cfefff', '#ffffff', '#9fd8ff'], 2, 1.4); });
      // the New Horizons spacecraft (real, 2015): tap the little dish on the ground and it zooms past overhead
      const nh = new THREE.Group(); nh.visible = false; k.add(nh); const body = new THREE.Mesh(new THREE.BoxGeometry(1, .7, .7), toy('#ffd23f', { m: .5, r: .3 })); nh.add(body); const dish = new THREE.Mesh(new THREE.CylinderGeometry(.9, .2, .25, 20), toy('#ffffff', { r: .3 })); dish.rotation.z = Math.PI / 2; dish.position.x = .7; nh.add(dish);
      const pad = k.sbox(X + 90, 0, -2.4, 1.2, .4, 1.2, '#5a6aa8', { r: .4 }); const mini = k.sball(X + 90, .6, -2.4, .4, .12, .4, '#ffffff'); let fly = 0;
      const go = () => { if (fly) return; fly = .001; nh.visible = true; k.Sound.whoosh(); k.fact('🛰️ Zoom! A real spacecraft called New Horizons flew past Pluto and took the first close pictures of its big heart!', 'newhorizons'); };
      k.tapIt(pad, go, X + 90, 'newhorizons'); k.tapIt(mini, go);
      k.U.push(dt => { if (!fly) return; fly += dt; const kk = Math.min(1, fly / 5); nh.position.set(X + 70 + kk * 45, 9 - Math.sin(kk * Math.PI) * 2, -6); nh.rotation.x += dt; if (kk >= 1) { fly = 0; nh.visible = false; } });
      k.placeAlien(X + 40, -2.4, 5); k.placeAlien(X + 100, -2, 6);
      k.rocketSign(X + 4);
    },
  ],
};

export const PLANET_EXTRA = { moon, mars, mercury, pluto };
export const placeWidth = id => PLANET_EXTRA[id] ? 330 : 110;
export const SECTION = 110;
