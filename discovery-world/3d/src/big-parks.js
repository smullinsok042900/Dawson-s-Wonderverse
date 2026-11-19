// ===================================================================
// big-parks.js (build 71): PLUTO'S GIANT INFLATABLE PARK and URANUS'S ICE PALACE (and a bigger skating rink).
//   PLUTO (area 3): musical bounce pads · an inflatable obstacle course · a 14 m inflatable tower (bounce up its bouncy
//     ledges, or tap it and climb its soft wall with the joystick) · the giant inflatable slide from the top into the
//     bounce pit with hoops · a puffy tunnel with a hidden star and a surprise room. Pluto's tiny gravity = huge floaty bounces.
//   URANUS (area 2, beside the castle): the ICE PALACE, open at the front: the throne room (sit on the throne), the crystal
//     hall (ring the crystals from small to big and a secret door opens to an ice tunnel with a treasure), the ballroom
//     (the snow dancers dance), the balcony upstairs (one tap: up the ice stairs) and an ice slide back down.
//   URANUS rink: hoops to skate through, stars, and musical ice.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, glowMat } from './spacekit.js';
import { toy } from './creatures.js';
import { launcher, slideTube, rideTo, glass, painted } from './jupiter-world.js';
import { starField } from './control-rides.js';

const RB = ['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fae'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const GEO = () => ({ box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), ball: new THREE.SphereGeometry(1, 14, 10), lo: new THREE.SphereGeometry(1, 8, 6), torus: new THREE.TorusGeometry(1, .28, 8, 24), ring: new THREE.TorusGeometry(1, .08, 6, 24), oct: new THREE.OctahedronGeometry(1), cone: new THREE.ConeGeometry(1, 1, 14) });
const near = (P, x, y, dx = 5, dy = 2) => P.layer === 'space' && !P.ride && Math.abs(P.x - x) < dx && Math.abs(P.y - y) < dy;

// =================== PLUTO: THE GIANT INFLATABLE PARK ===================
export function plutoInflatablePark(k) {
  const P = k.P, G = k.G, X0 = k.s0, G0 = GEO(), S = k.Sound, x = v => X0 + v, b = makeBatch(), gb = makeBatch();
  const puff = (px, py, pz, c, sx, sy, sz) => b.put(G0.ball, px, py, pz, c, [sx, sy, sz]);       // a soft, inflated shape
  // ---- musical bounce pads (8–20): each sings a note and bounces you up ----
  const notes = [262, 294, 330, 392, 440, 523];
  notes.forEach((f, i) => { const px = x(9 + i * 2); b.put(G0.cyl, px, .2, -1.2, RB[i], [.85, .4, .85]); puff(px, .42, -1.2, '#ffffff', .6, .12, .6);
    launcher(k, px - .8, px + .8, 0, 3.6, 0, () => { S.tone(f, .25, 'triangle', .07, 1); k.disc('plutomusicpads', '🎵 Musical bounce pads! Each one sings a note.'); }); });
  // ---- the inflatable obstacle course (22–40): soft pillars to hop along, and arches to go through ----
  [[23, .8], [25, 1.6], [27, 2.4], [29, 3.2], [31, 2.4], [33, 1.6], [35, .8]].forEach(([px, h], i) => { b.put(G0.cyl, x(px), h / 2, -1.2, RB[i % 7], [.85, h, .85]); puff(x(px), h, -1.2, '#ffffff', .75, .15, .75); k.plat(x(px - .85), x(px + .85), h, { z: -1.2, step: true, stepMax: 1 }); });
  for (const ax of [21, 37.5, 40]) b.put(G0.torus, x(ax), 2.2, -1.2, RB[ax % 7], [2.2, 2.2, 1.3]);
  // ---- the 14 m inflatable tower (44–56): bouncy ledges up the front, and a soft climbing wall ----
  const tx = x(51); for (let i = 0; i < 5; i++) puff(tx, 1.5 + i * 2.8, -4, i % 2 ? '#ff6fae' : '#9fd8ff', 4.2 - i * .3, 1.9, 2.4);
  puff(tx, 15, -4, '#ffd23f', 2.6, 1.4, 2); for (const s of [-1, 1]) { puff(tx + s * 3.6, 16, -4, '#ff4f6a', .7, 2, .7); b.put(G0.cone, tx + s * 3.6, 18.4, -4, '#ffd23f', [.7, 1.4, .7]); }
  b.put(G0.box, x(48), 6.9, -1.6, '#7fe0a0', [4, .6, 2.6]); b.put(G0.box, x(52.5), 13.7, -1.6, '#ffd23f', [6, .6, 2.8]);  // the bouncy ledge (7 m) and the top deck (14 m)
  k.plat(x(46), x(50), 7.2, { z: -1.2 }); k.plat(x(49.5), x(55.5), 14, { z: -1.2 });
  b.put(G0.cyl, x(44.5), .2, -1.2, '#ff4f6a', [.85, .4, .85]); b.put(G0.cyl, x(48.8), 7.4, -1.2, '#ff4f6a', [.75, .3, .75]);
  launcher(k, x(43.8), x(45.2), 0, 5.2, 1.6, () => { S.boing(); k.disc('plutotowerbounce', '🎈 Bounce up the giant inflatable tower!'); });   // ground → ledge
  launcher(k, x(48.2), x(49.4), 7.2, 5.2, 1.2, () => S.boing());                                                                               // ledge → top deck
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3, 13, .6), new THREE.MeshBasicMaterial({ visible: false })); wall.position.set(x(57.2), 6.5, -1.6); k.add(wall);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 2; c++) puff(x(56.5 + c * 1.3 + (r % 2) * .3), 1 + r * 1.3, -1.25, RB[(r + c) % 7], .28, .22, .18);  // soft handholds on the side wall
  b.put(G0.box, x(57.2), 6.5, -1.9, '#c9a6ff', [3, 13, .5]);
  k.tapIt(wall, () => { if (!near(P, x(57.2), 0, 4, 1.5)) return; k.say('🧗 Climb the soft wall! Push the joystick up.', true); k.disc('plutoclimb');
    const R = rideTo(k, 'plutoclimb', (R, dt) => { const st = k.api.stick ? k.api.stick() : { x: 0, y: 0 }; P.y = Math.max(0, Math.min(14, P.y + (Math.abs(st.y) > .2 ? st.y * 2.2 : R.t > 3 ? .7 : 0) * dt)); P.x = x(57.2) + st.x * .9; P.z = -1; R.roll = Math.sin(R.t * 5) * .12; return P.y >= 14 || (P.y <= 0 && st.y < -.2 && R.t > 1); },
      () => { if (P.y >= 14) { P.x = x(55); P.y = 14; k.say('🎈 The top! Take the giant slide down!', true); } P.z = 0; P.grounded = true; }); }, x(57.2), 'plutoclimbwall');
  // ---- the GIANT INFLATABLE SLIDE from the top deck down into the bounce pit (60–90) ----
  const path = new THREE.CatmullRomCurve3([[55.4, 14.5, -1.2], [58, 14, -2.5], [62, 12, -6], [66, 9.5, -8], [70, 8, -5.5], [72, 6.5, -2.5], [76, 4, -2], [79, 2, -3], [82, .9, -2], [84, .8, -1.2]].map(([a, y, z]) => V3(x(a), y, z)), false, 'catmullrom', .35);
  slideTube(k, path, { segs: 150, r: 1.2, cols: ['#ff6fae', '#ffd23f', '#5aa8ff', '#7fe0a0'], bands: 16, postEvery: .1 });
  let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && P.layer === 'space' && !P.ride && P.grounded && Math.abs(P.y - 14) < .2 && P.x > x(55.2) && P.vx > .3) { cool = 2; G.startSlide(path, { vmax: 9, acc: 4 }); k.say('🎈 Wheee! Down the giant inflatable slide!', true); k.disc('plutoslide'); } });
  G.interact.push({ x: x(53), y: 14, layer: 'space', disc: 'plutoslidego', run: () => { if (Math.abs(P.y - 14) < 1) { P.x = x(55.4); G.startSlide(path, { vmax: 9, acc: 4 }); k.disc('plutoslide'); } }, hintY: 2.4 });
  // ---- the BOUNCE PIT (82–92) with three hoops above it ----
  b.put(G0.box, x(87), .25, -1.2, '#ff4f6a', [10, .5, 3.2]); for (const z of [-2.9, .5]) puff(x(87), .7, z, '#ffd23f', 5.2, .5, .5);
  launcher(k, x(82.2), x(91.8), .5, 5.5, 0, () => S.boing());
  const hoops = [[84, 9], [87, 10.5], [90, 9]].map(([hx, hy], i) => { gb.put(G0.ring, x(hx), hy, -1.2, RB[i * 2], 1.1); return { x: x(hx), y: hy, hit: 0 }; });
  k.U.push(dt => { for (const h of hoops) { h.hit = Math.max(0, h.hit - dt); if (!h.hit && P.layer === 'space' && Math.abs(P.x - h.x) < 1 && Math.abs(P.y + .6 - h.y) < .8) { h.hit = 1.5; S.tone(700, .2, 'sine', .07, 1.5); k.api.burst(h.x, h.y, -1.2, RB, 14, 2); k.disc('plutohoops', '🎈 Bounce up through the hoops!'); } } });
  // ---- the PUFFY TUNNEL (94–106) with a hidden star, and the SURPRISE ROOM at its end ----
  for (let i = 0; i < 7; i++) b.put(G0.torus, x(94 + i * 2), 1.6, -1.2, RB[i % 7], [2.4, 2.4, 1.6], [0, Math.PI / 2, 0]);
  const dome = new THREE.Mesh(G0.ball, toy('#c9a6ff', { r: .7 })); dome.position.set(x(107), 0, -3.4); dome.scale.set(2.4, 2.8, 2.2); k.add(dome); let surprise = 0;
  const friend = new THREE.Mesh(G0.ball, toy('#7fe0a0', { r: .5 })); friend.scale.setScalar(.5); friend.position.set(x(107), -1, -1.4); k.add(friend);
  k.tapIt(dome, () => { surprise = 3; S.giggle(); k.api.burst(x(107), 3, -2, RB, 36, 3); k.fact('🎉 SURPRISE! A bouncy friend lives in the surprise room!', 'plutosurprise'); }, x(107), 'plutosurprise');
  k.U.push((dt, t) => { surprise = Math.max(0, surprise - dt); friend.position.y = surprise > 0 ? 1 + Math.abs(Math.sin(t * 4)) * 2 : -1; });
  starField(k, [[x(13), 4.5, -1.2], [x(29), 5, -1.2], [x(51), 16.5, -1.2], [x(70), 10, -1.2], [x(100), 1.3, -1.2], [x(87), 12.5, -1.2]], () => { S.chime(); k.say('⭐ All the bouncy park stars!', true); k.disc('plutostars'); });
  const park = b.mesh(shinyMat()); park.castShadow = true; k.add(park); k.add(gb.mesh(glowMat()));
  k.tapIt(park, () => k.fact('🎈 The giant inflatable park! On Pluto you bounce super high and float down slowly.', 'plutopark'), x(10), 'plutopark');
}

// =================== PLUTO: THE RAINBOW TOWER (build 92; area 2, x 95–108) ===================
// A second inflatable tower: bounce pad → the 7 m ledge → bounce pad → the 14 m top deck with a star, then a TWISTY
// SPIRAL SLIDE that winds round and round behind the tower down to the ground. Walk off the deck (or tap) to slide.
export function plutoRainbowTower(k) {
  const P = k.P, G = k.G, S = k.Sound, G0 = GEO(), x = v => k.s0 + v, b = makeBatch();
  const puff = (px, py, pz, c, sx, sy, sz) => b.put(G0.ball, px, py, pz, c, [sx, sy, sz]);
  const tx = x(102.5); for (let i = 0; i < 5; i++) puff(tx, 1.5 + i * 2.8, -4.2, RB[i], 3.9 - i * .25, 1.9, 2.3);
  puff(tx, 15.2, -4.2, '#ffffff', 2.4, 1.3, 1.9); puff(tx, 17, -4.2, '#ff6fae', .8, .8, .8);
  b.put(G0.box, x(100), 6.9, -1.6, '#9fd8ff', [4.4, .6, 2.6]); b.put(G0.box, x(104.5), 13.7, -1.6, '#ff9a2e', [6.4, .6, 2.8]);   // the ledge (7 m) and the top deck (14 m)
  for (const s of [-1, 1]) puff(x(104.5) + s * 3, 14.6, -2.9, '#ffd23f', .5, .6, .5);
  k.plat(x(97.8), x(102.2), 7.2, { z: -1.2 }); k.plat(x(101.4), x(107.6), 14, { z: -1.2 });
  b.put(G0.cyl, x(96.5), .2, -1.2, '#7fe0a0', [.85, .4, .85]); b.put(G0.cyl, x(100.8), 7.4, -1.2, '#7fe0a0', [.75, .3, .75]);
  launcher(k, x(95.8), x(97.2), 0, 5.2, 1.6, () => { S.boing(); k.disc('plutotower2bounce', '🌈 Bounce up the rainbow tower!'); });
  launcher(k, x(100.2), x(101.4), 7.2, 5.2, 1.2, () => S.boing());
  // the spiral slide: two turns round behind the tower
  const pts = [[107.6, 14.5, -1.2], [109, 14, -2.6]]; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 4; pts.push([104.8 + 3.6 * Math.sin(a + 1.2), 13.2 - i * .72, -6 + 3.4 * Math.cos(a + 1.2)]); }
  pts.push([107.5, 1.3, -2.2], [109, .8, -1.2]);
  const path = new THREE.CatmullRomCurve3(pts.map(([a, y, z]) => V3(x(a), y, z)), false, 'catmullrom', .35);
  slideTube(k, path, { segs: 170, r: 1.1, cols: ['#9b6cff', '#5aa8ff', '#7fe0a0', '#ffd23f', '#ff6fae'], bands: 20, postEvery: .12 });
  const go = () => { G.startSlide(path, { vmax: 8, acc: 3.5 }); k.say('🌈 Round and round the spiral slide!', true); k.disc('plutospiralslide'); };
  let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && P.layer === 'space' && !P.ride && P.grounded && Math.abs(P.y - 14) < .2 && P.x > x(107.3) && P.vx > .3) { cool = 2; go(); } });
  G.interact.push({ x: x(105), y: 14, layer: 'space', disc: 'plutospiralgo', run: () => { if (Math.abs(P.y - 14) < 1) { P.x = x(107.6); go(); } }, hintY: 2.4 });
  starField(k, [[x(104.5), 16, -1.2], [x(98.5), 10, -1.2]], () => { S.chime(); k.say('⭐ The rainbow tower stars!', true); k.disc('plutotower2stars'); });
  const m = b.mesh(shinyMat()); m.castShadow = true; k.add(m);
  k.tapIt(m, () => k.fact('🌈 The rainbow tower! Bounce on the green pads to go up, then slide down the spiral!', 'plutotower2'), x(97), 'plutotower2');
}

// =================== URANUS: THE ICE PALACE ===================
export function uranusIcePalace(k) {
  const P = k.P, G = k.G, X0 = k.s0, G0 = GEO(), S = k.Sound, x = v => X0 + v, F2 = 6, b = makeBatch(), gb = makeBatch(), ice = '#bfe6ff', pale = '#e8f6ff', deep = '#7fbde8';
  // the palace: back wall, columns, an upper floor (balcony) with windows, towers and spires
  b.put(G0.box, x(85), 6, -5.6, pale, [46, 12, .5]); b.put(G0.box, x(85), F2 - .15, -3, ice, [44, .3, 5]); k.plat(x(63), x(107), F2, { z: -1.2 });
  for (let i = 0; i < 9; i++) { const cx = x(63 + i * 5.5); b.put(G0.cyl, cx, F2 / 2, -.6, pale, [.3, F2, .3]); b.put(G0.cyl, cx, F2 + 1.5, -.6, ice, [.2, 3, .2]); }
  for (let i = 0; i < 7; i++) b.put(G0.box, x(66 + i * 6), F2 + 3.2, -5.3, '#9fd8ff', [2.6, 3, .1]);                  // tall windows
  for (const tx of [62, 108]) { b.put(G0.cyl, x(tx), 8, -4.5, pale, [2, 16, 2]); b.put(G0.cone, x(tx), 18, -4.5, deep, [2.3, 4, 2.3]); gb.put(G0.oct, x(tx), 20.6, -4.5, '#ffffff', .5); }
  for (let i = 0; i < 22; i++) b.put(G0.cone, x(63 + i * 2), F2 - .55, -.5, '#ffffff', [.12, .7, .12], [Math.PI, 0, 0]);     // icicles along the balcony
  // ---- the THRONE ROOM (64–76): tap the throne and you sit on it ----
  b.put(G0.box, x(70), .8, -4.6, deep, [2.4, 1.6, 1.2]); b.put(G0.box, x(70), 2.6, -5.1, ice, [2.4, 3, .3]); gb.put(G0.oct, x(70), 4.4, -5, '#ffd23f', .5); b.put(G0.box, x(70), .05, -2.5, '#6aa8e8', [5, .1, 4]);
  const throne = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3, 1.4), new THREE.MeshBasicMaterial({ visible: false })); throne.position.set(x(70), 1.5, -4.6); k.add(throne);
  k.tapIt(throne, () => { if (!near(P, x(70), 0, 6, 1.5)) return; S.chime(); k.api.burst(x(70), 3, -4, ['#ffd23f', '#ffffff', '#9fd8ff'], 24, 2); k.fact('👑 You sit on the ice throne! You are the queen of the Ice Palace!', 'uranusthrone');
    rideTo(k, 'throne', R => { P.x = x(70); P.y = 1.6; P.z = -4.2; P.facing = 1; return R.t > 3; }, () => { P.y = 0; P.z = 0; P.x = x(72.5); }); }, x(70), 'uranusthrone');
  // ---- the CRYSTAL HALL (76–90): ring the crystals from the smallest to the biggest → a secret door opens ----
  const sizes = [.5, .7, .9, 1.1, 1.3], crys = sizes.map((s, i) => { const m = new THREE.Mesh(G0.oct, toy(['#9fe6ff', '#c9a6ff', '#ff9fd2', '#9fffd0', '#fff3a6'][i], { em: '#bfe6ff', ei: .3, cc: 1 })); m.scale.set(s * .6, s * 1.4, s * .6); m.position.set(x(78 + [2, 4.2, 0, 6.4, 8.6][i]), s * 1.4, -3.6); k.add(m); return m; });
  let order = 0, open = 0, glowT = crys.map(() => 0);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4, .3), toy(deep, { r: .2, cc: 1 })); door.position.set(x(88.5), 2, -5.25); k.add(door);
  crys.forEach((m, i) => k.tapIt(m, () => { glowT[i] = 1; S.tone(880 - i * 110, .4, 'sine', .07, 1); const want = sizes.indexOf([...sizes].sort((a, b) => a - b)[order]);
    if (open) return; if (i === want) { order++; if (order === sizes.length) { open = .001; S.twinkle(); k.fact('✨ You rang them all, from small to big! A secret door opens to an ice tunnel!', 'uranussecret'); } } else { order = i === sizes.indexOf(sizes[0]) ? 1 : 0; if (!order) k.say('🔔 Try from the smallest crystal to the biggest!', true); } }));
  G.interact.push({ x: x(82), y: 0, layer: 'space', disc: 'uranuscrystals', run: () => k.say('🔔 Ring the crystals, from the smallest to the biggest!', true), hintY: 2.4 });
  G.icePalace = { ring: i => crys[i].userData.tap(), sizes, get open() { return open > 0; } };
  const tun = makeBatch(); for (let i = 0; i < 6; i++) tun.put(G0.torus, x(88.5), 1.6, -6 - i * 1.6, '#9fe6ff', [1.7, 2, 1], [0, 0, 0]); k.add(tun.mesh(glowMat()));
  const treasure = new THREE.Mesh(G0.oct, toy('#ffd23f', { em: '#ffb000', ei: .9 })); treasure.scale.set(.5, .7, .25); treasure.position.set(x(88.5), 1.4, -13); k.add(treasure);
  // ---- the BALLROOM (90–106): snow dancers twirl; tap them and they dance faster; the floor glows where you walk ----
  b.put(G0.box, x(98), .04, -2.5, '#dff1ff', [15, .08, 4.4]); const dancers = [0, 1, 2, 3].map(i => { const g = new THREE.Group(); const db = makeBatch(); db.put(G0.ball, 0, .5, 0, '#ffffff', .45); db.put(G0.ball, 0, 1.15, 0, '#ffffff', .3); db.put(G0.cone, 0, .25, 0, RB[i * 2 % 7], [.6, .5, .6]); g.add(db.mesh(shinyMat())); k.add(g); return g; });
  let dance = 1; const hall = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 3), new THREE.MeshBasicMaterial({ visible: false })); hall.position.set(x(98), 1.5, -3); k.add(hall);
  k.tapIt(hall, () => { dance = 4; S.chime(); k.fact('💃 The snow dancers dance faster in the ballroom!', 'uranusballroom'); }, x(98), 'uranusballroom');
  k.U.push((dt, t) => { dance = Math.max(1, dance - dt * .5); dancers.forEach((g, i) => { const a = t * .6 * dance + i * Math.PI / 2; g.position.set(x(98) + Math.cos(a) * 4, 0, -2.8 + Math.sin(a) * 1.2); g.rotation.y = t * 3 * dance; });
    glowT = glowT.map(v => Math.max(0, v - dt * 2)); crys.forEach((m, i) => { m.material.emissiveIntensity = .3 + glowT[i] * 1.4 + (open ? .5 : 0); m.rotation.y = t * .5 + i; });
    if (open > 0 && open < 1) { open = Math.min(1, open + dt * .7); door.position.y = 2 + open * 4; }
    treasure.rotation.y = t * 2; if (open >= 1 && treasure.visible && Math.abs(P.x - treasure.position.x) < 1.6 && P.y < 2) { treasure.visible = false; S.chime(); k.api.burst(treasure.position.x, 1.6, -6, ['#ffd23f', '#ffffff'], 30, 2.6); k.fact('💎 The ice tunnel treasure! You found the palace secret!', 'uranustreasure'); } });
  // ---- the ICE STAIRS (one tap, up or down) and the ICE SLIDE from the balcony ----
  for (let i = 0; i < 10; i++) b.put(G0.box, x(63.5 + i * .6), (i + 1) * .3, -4.4, i % 2 ? pale : ice, [.6, (i + 1) * .6, 1.2]);
  const stairs = new THREE.Mesh(new THREE.BoxGeometry(6.4, 6, 1.6), new THREE.MeshBasicMaterial({ visible: false })); stairs.position.set(x(66.5), 3, -4.4); k.add(stairs);
  const climb = () => { if (P.ride || P.layer !== 'space' || P.x < x(60) || P.x > x(74)) return; const up = P.y < 1; if (!up && Math.abs(P.y - F2) > 1) return; k.disc('uranusstairs', '🧊 Up and down the ice stairs!');
    rideTo(k, 'icestairs', R => { const f = Math.min(1, R.t / 2.2), g = up ? f : 1 - f; P.x = x(63.5 + g * 6); P.y = Math.min(F2, Math.ceil(g * 10) * .6); P.z = -4.4 * Math.min(1, R.t * 3) * (f < .97 ? 1 : 0); P.facing = up ? 1 : -1; return f >= 1; }, () => { P.y = up ? F2 : 0; P.x = x(up ? 70.5 : 62.5); P.z = 0; }); };
  k.tapIt(stairs, climb, x(66), 'uranusstairsup'); G.interact.push({ x: x(68), y: F2, layer: 'space', disc: 'uranusstairsdown', run: climb, hintY: 2.4 });
  const path = new THREE.CatmullRomCurve3([[107.2, 6.4, -1.2], [109, 6, -2.5], [109.5, 4.5, -5], [108, 3, -7.5], [105, 1.8, -7.5], [104.5, 1, -4.5], [106.5, .7, -1.5], [108.5, .7, -.6]].map(([a, y, z]) => V3(x(a), y, z)), false, 'catmullrom', .35);
  slideTube(k, path, { segs: 90, r: .9, cols: ['#bfe6ff', '#ffffff'], bands: 14 });
  let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && P.layer === 'space' && !P.ride && P.grounded && Math.abs(P.y - F2) < .2 && P.x > x(106.6) && P.vx > .3) { cool = 2; G.startSlide(path, { vmax: 8 }); k.disc('uranusslide', '🧊 Down the ice slide!'); } });
  G.interact.push({ x: x(105), y: F2, layer: 'space', disc: 'uranusslidego', run: () => { if (Math.abs(P.y - F2) < 1) { P.x = x(107.2); G.startSlide(path, { vmax: 8 }); k.disc('uranusslide'); } }, hintY: 2.4 });
  const pal = b.mesh(shinyMat()); pal.castShadow = true; k.add(pal); k.add(gb.mesh(glowMat()));
  const front = new THREE.Mesh(painted(new THREE.PlaneGeometry(46, 12), '#dff4ff'), glass(.1)); front.position.set(x(85), 6, -5.3); k.add(front);
  k.tapIt(pal, () => k.fact('🏰 The Ice Palace! A throne room, a crystal hall with a secret, a ballroom, and a balcony upstairs.', 'uranuspalace'), x(64), 'uranuspalace');
}

// =================== URANUS: the skating rink gets hoops, stars and musical ice ===================
export function uranusRinkFun(k, cx, rx) {
  const P = k.P, S = k.Sound, gb = makeBatch(), G0 = GEO(), hoops = [];
  for (let i = 0; i < 6; i++) { const hx = cx - rx + 6 + i * (2 * rx - 12) / 5; gb.put(G0.ring, hx, 1.3, -1, RB[i % 7], [1.3, 1.6, 1]); hoops.push({ x: hx, side: 0 }); }
  const notes = [262, 330, 392, 523]; for (let i = 0; i < 4; i++) gb.put(new THREE.CylinderGeometry(1, 1, .02, 16), cx - 9 + i * 6, .08, -3.6, RB[i * 2 % 7], [1.4, 1, .9]);
  k.add(gb.mesh(glowMat())); let n = 0, lastTile = -1;
  k.U.push(() => { if (P.layer !== 'space' || P.ride) return; for (const h of hoops) { const s = Math.sign(P.x - h.x); if (h.side && s !== h.side && P.y < 1.5) { n++; S.tone(500 + (n % 6) * 70, .2, 'sine', .07, 1.5); k.api.burst(h.x, 1.3, -1, RB, 10, 1.6); if (n === 6) { S.chime(); k.say('⛸️ Through six hoops! You are a skating star!', true); k.disc('uranushoops'); } } h.side = s; }
    const ti = P.y < .5 && Math.abs(P.z + 3.6) < 1.5 ? Math.round((P.x - (cx - 9)) / 6) : -1; if (ti >= 0 && ti < 4 && ti !== lastTile) S.tone(notes[ti], .3, 'triangle', .06, 1); lastTile = ti; });
  starField(k, [[cx - rx + 9, 1.1, -.6], [cx - 3, 1.1, -.6], [cx + 6, 1.1, -.6], [cx + rx - 8, 1.1, -.6]], () => { S.chime(); k.say('⭐ All the rink stars!', true); k.disc('uranusrinkstars'); });
  // (build 85) STEER ACROSS THE ICE: on the rink, ▲ glides you away across the ice and ▼ back (with a gentle glide), so you
  //  can skate round the whole oval, not only along it
  let vz = 0, onIce = false, gz = 0; const czc = -2.6, rzi = 4;
  k.U.push(dt => { const now = P.layer === 'space' && !P.ride && P.y < 2 && Math.abs(P.x - cx) < rx - 1;
    if (!now) { if (onIce) { k.G.iceZ = null; P.groundZ = 0; onIce = false; vz = 0; gz = 0; } return; } onIce = true;
    const st = k.api.stick ? k.api.stick() : { y: 0 }; vz += (-st.y * 3.2 - vz) * Math.min(1, dt * (Math.abs(st.y) > .2 ? 2.5 : .6));
    const half = rzi * Math.sqrt(Math.max(0, 1 - ((P.x - cx) / rx) ** 2)); const z0 = czc - half, z1 = Math.min(1, czc + half);
    gz = Math.max(z0, Math.min(z1, gz + vz * dt)); if (gz <= z0 || gz >= z1) vz *= -.3; k.G.iceZ = gz; P.groundZ = gz; k.G.rinkZ = gz; });
}

// =================== (build 78) PLUTO: THE PUFFY PICTURE-MATCHING GAME (area 2, after the bounce castles) ===================
// Six puffy cards. Tap one: it turns round and shows a picture. Tap another: the same picture? They stay turned, hooray!
// Not the same? They turn back (try again, as often as you like). All three pairs → a party, then the cards are shuffled.
export function plutoMatchGame(k) {
  const P = k.P, G = k.G, S = k.Sound, G0 = GEO(), x0 = k.s0 + 87, pics = ['star', 'heart', 'moon'], cols = ['#ffd23f', '#ff4f6a', '#9fd8ff'];
  const heart = (() => { const sh = new THREE.Shape(); sh.moveTo(0, -.6); sh.bezierCurveTo(-1.1, .1, -.6, .9, 0, .45); sh.bezierCurveTo(.6, .9, 1.1, .1, 0, -.6); return new THREE.ExtrudeGeometry(sh, { depth: .12, bevelEnabled: false, curveSegments: 6 }); })();
  const symbol = (sb, j) => { sb.put(G0.ball, 0, 0, -.25, '#ffffff', [.9, .9, .2]); if (j === 0) sb.put(G0.oct, 0, 0, -.45, cols[0], [.42, .55, .12]); else if (j === 1) sb.put(heart, 0, 0, -.53, cols[1], .5); else { sb.put(G0.ball, 0, 0, -.45, cols[2], [.45, .45, .1]); sb.put(G0.ball, .2, .08, -.49, '#ffffff', [.38, .4, .1]); } };
  // (each card is ONE mesh: the puffy back and its picture; it is remade when the cards are dealt)
  const cardGeo = j => { const b = makeBatch(); b.put(G0.ball, 0, 0, 0, '#c9a6ff', [1, 1, .35]); b.put(G0.ball, 0, 0, -.05, '#ffffff', [.75, .75, .3]); symbol(b, j); return b.geometry(); };
  const cards = [], deal = () => { const order = [0, 0, 1, 1, 2, 2].sort(() => Math.random() - .5); cards.forEach((c, i) => { c.kind = order[i]; c.open = false; c.done = false; const old = c.m.geometry; c.m.geometry = cardGeo(c.kind); old.dispose(); }); };
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.set(x0 + (i % 3) * 2.6, 1.3 + Math.floor(i / 3) * 2.3, -2.4); k.add(g);
    const m = new THREE.Mesh(cardGeo(0), shinyMat()); g.add(m); cards.push({ g, m, kind: 0, open: false, done: false, turn: 0 }); }
  deal(); let first = null, busy = 0, pairs = 0, rounds = 0;
  cards.forEach(c => k.tapIt(c.g, () => { if (busy > 0 || c.open || c.done || P.layer !== 'space' || Math.abs(P.x - (x0 + 2.6)) > 9) return; c.open = true; S.tone(520, .1, 'triangle', .05, 1);
    if (!first) { first = c; if (!rounds && !pairs) k.say('🎴 Find two the same! Tap another card.', true); return; }
    const a = first; first = null;
    if (a.kind === c.kind) { a.done = c.done = true; pairs++; S.chime(); k.api.burst(c.g.position.x, c.g.position.y, -2, [cols[c.kind], '#ffffff'], 18, 2); k.say(['⭐ Two stars!', '❤️ Two hearts!', '🌙 Two moons!'][c.kind], false);
      if (pairs === 3) { rounds++; pairs = 0; k.api.burst(x0 + 2.6, 3, -2, ['#ffd23f', '#ff4f6a', '#9fd8ff', '#ffffff'], 40, 3); k.fact('🎉 You matched them all! You have a great memory!', 'plutomatch'); busy = 3; setTimeout(deal, 3000); } }
    else { busy = 1; S.boing(); setTimeout(() => { a.open = false; c.open = false; }, 1000); } }));
  k.G.interact.push({ x: x0 + 2.6, y: 0, layer: 'space', disc: 'plutomatchgame', run: () => k.say('🎴 Tap two cards to find the same pictures!', true), hintY: 2.4 });
  G.plutoMatch = { cards, tap: i => cards[i].g.children[0].userData.tap(), get pairs() { return pairs; }, get rounds() { return rounds; } };
  k.U.push((dt, t) => { busy = Math.max(0, busy - dt); for (const c of cards) { const want = c.open || c.done ? Math.PI : 0; c.turn += (want - c.turn) * Math.min(1, dt * 8); c.g.rotation.y = c.turn; c.g.position.z = -2.4 + Math.sin(t * 2 + c.g.position.x) * .05; } });
}

// =================== (build 81) URANUS: THE ICE PALACE UPSTAIRS ===================
// On the balcony (6 m): the SNOWFLAKE WORKSHOP (tap the machine: snowflakes swirl out), the FROZEN BOOKCASE (tap the
// glowing snowflake switch and it slides aside) and, behind it, the SECRET MUSIC ROOM with five ice bells to play.
export function uranusPalaceUpstairs(k) {
  const P = k.P, G = k.G, S = k.Sound, G0 = GEO(), x = v => k.s0 + v, F2 = 6, b = makeBatch(), gb = makeBatch();
  const up = () => P.layer === 'space' && Math.abs(P.y - F2) < 1.5;
  // the snowflake workshop (x 74–80): a machine with a funnel
  b.put(G0.cyl, x(76), F2 + .6, -4.2, '#9fd8ff', [.8, 1.2, .8]); b.put(G0.cone, x(76), F2 + 1.6, -4.2, '#e8f6ff', [.6, .8, .6], [Math.PI, 0, 0]); b.put(G0.torus, x(76), F2 + 1.2, -4.2, '#ffffff', [.7, .7, 1], [Math.PI / 2, 0, 0]);
  const machine = new THREE.Mesh(new THREE.BoxGeometry(2, 2.4, 2), new THREE.MeshBasicMaterial({ visible: false })); machine.position.set(x(76), F2 + 1.2, -4.2); k.add(machine);
  let made = 0; k.tapIt(machine, () => { if (!up()) return; made++; S.twinkle(); for (let i = 0; i < 3; i++) k.api.burst(x(76) + (Math.random() - .5) * 2, F2 + 2 + i * .5, -3.5, ['#ffffff', '#cfefff', '#9fd8ff'], 14, 2.2); if (made === 1) k.fact('❄️ The snowflake machine! Every snowflake is different, just like on Uranus where it is icy cold.', 'uranussnowflakes'); }, x(76), null);
  G.interact.push({ x: x(76), y: F2, layer: 'space', disc: 'uranussnowmachine', run: () => machine.userData.tap(), hintY: 2.4 });
  // the frozen bookcase (x 84–88) and its snowflake switch (x 90)
  const shelf = new THREE.Group(); shelf.position.set(x(86), F2, -4.6); k.add(shelf); const sb = makeBatch(); sb.put(G0.box, 0, 1.6, 0, '#bfe6ff', [3.4, 3.2, .5]);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) sb.put(G0.box, -1.4 + i * .35, .6 + r * 1, .28, ['#ff6fae', '#5aa8ff', '#ffd23f', '#7fe0a0', '#9b6cff'][(i + r) % 5], [.26, .8, .2]); shelf.add(sb.mesh(shinyMat()));
  const sw = new THREE.Mesh(G0.oct, toy('#ffffff', { em: '#9fe6ff', ei: .9 })); sw.scale.set(.35, .35, .1); sw.position.set(x(90), F2 + 1.6, -4.3); k.add(sw);
  // the secret music room behind it: five ice bells
  b.put(G0.box, x(86), F2 + 1.6, -5.25, '#2a4a7a', [3.6, 3.2, .1]); /* (the dark recess behind the bookcase) */
  const notes = [523, 587, 659, 784, 880], bells = notes.map((f, i) => { const m = new THREE.Mesh(G0.cone, toy(['#cfefff', '#bfe6ff', '#afdcff', '#9fd2ff', '#8fc8ff'][i], { cc: 1, em: '#bfe6ff', ei: .2 })); m.scale.set(.26 + i * .02, .42 + i * .04, .26 + i * .02); m.position.set(x(84.4 + i * .8), F2 + 1.3, -4.95); m.visible = false; k.add(m); return { m, f, ring: 0 }; });
  let open = 0, opened = false, played = 0;
  k.tapIt(sw, () => { if (!up() || opened) return; opened = true; S.chime(); k.api.burst(x(90), F2 + 1.6, -4, ['#ffffff', '#9fe6ff'], 16, 1.8); k.fact('📚 The snowflake switch! The frozen bookcase slides away... a secret music room!', 'uranusbookcase'); bells.forEach(bl => { bl.m.visible = true; }); }, x(90), null);
  G.interact.push({ x: x(90), y: F2, layer: 'space', disc: 'uranussecretswitch', run: () => sw.userData.tap(), hintY: 2.4 });
  bells.forEach((bl, i) => k.tapIt(bl.m, () => { if (!opened || !up()) return; bl.ring = 1; S.tone(bl.f, .6, 'sine', .07, 1); played++; if (played === 5) k.fact('🔔 Ice bells! You played a song in the secret music room!', 'uranusbells'); }));
  G.icePalaceUp = { bell: i => bells[i].m.userData.tap(), get opened() { return opened; } };
  k.U.push((dt, t) => { if (opened && open < 1) { open = Math.min(1, open + dt * .7); shelf.position.x = x(86) + open * 3.6; } sw.rotation.z = t * (opened ? 3 : .8);
    for (const bl of bells) { bl.ring = Math.max(0, bl.ring - dt * 2); bl.m.rotation.z = Math.sin(t * 20) * .2 * bl.ring; } });
  k.add(b.mesh(shinyMat())); if (gb.count()) k.add(gb.mesh(glowMat()));
}
