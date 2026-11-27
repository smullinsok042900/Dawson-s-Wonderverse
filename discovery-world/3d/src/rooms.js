// ===================================================================
// rooms.js (build 149, the family's request: "I want it to be like walking into an actual house"): REAL ROOMS INSIDE.
// Going in through the igloo's or the lighthouse's door takes her INTO A ROOM of its own (no see-through bubble any more):
// walls, a floor and a ceiling all round, things to tap, and the camera framing the room like standing in it. Walking
// out of the door (or 🐾 at the door) takes her back outside, right at the door.
//   🧊 the igloo: walls of ice blocks, ice windows, a crackling fire on a fur rug, a cup of hot cocoa, a baby penguin
//      asleep in its snow bed.
//   💡 the lighthouse: a tall round tower room with round windows on the sea; stairs climb back and forth up to the lamp
//      room at the top, where she taps the great lamp and its beam sweeps across the sea.
// Rooms are built only the first time she goes in (a few batched meshes in the shared paint: no new shaders), far from
// the world (x -5400 …), on their own layer 'room'; they are hidden while she is not in one.
// G.roomCam ({x0, x1, y0, y1, z}) asks main.js for the room camera: it fits the room and follows her inside it.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat } from './spacekit.js';

const LEAFG = new THREE.SphereGeometry(1, 8, 6), BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 12, 9), CYL = new THREE.CylinderGeometry(1, 1, 1, 16), CONE = new THREE.ConeGeometry(1, 1, 10);
const FRONT = 1.6; // the open front of every room (z); the back wall is at FRONT - depth

export function initRooms(k) {
  const { G, P, scene, Sound, say, disc } = k;
  const R = {}; let cur = null;
  const glowM = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

  // the room's shell: floor, back wall, side walls, ceiling, and a frame all round the open front (so nothing of the
  // world outside is ever seen from inside)
  function shell(b, W, H, D, wall, floor, ceil, frame) {
    const zb = FRONT - D, zc = (FRONT + zb) / 2;
    b.put(BOX, W / 2, -.1, zc, floor, [W, .2, D]);
    b.put(BOX, W / 2, H / 2, zb - .15, wall, [W + .6, H + .4, .3]);
    for (const x of [-.15, W + .15]) b.put(BOX, x, H / 2, zc, wall, [.3, H + .4, D]);
    b.put(BOX, W / 2, H + .15, zc, ceil, [W + .6, .3, D]);
    const z = FRONT + .25; // the frame: big walls around the opening
    b.put(BOX, -20.3, H / 2, z, frame, [40, H + 60, .3]); b.put(BOX, W + 20.3, H / 2, z, frame, [40, H + 60, .3]);
    b.put(BOX, W / 2, H + 20.3, z, frame, [W + 1, 40, .3]); b.put(BOX, W / 2, -20.3, z, frame, [W + 1, 40, .3]);
    b.put(BOX, W / 2, H - .1, FRONT + .05, frame, [W + .4, .5, .4]); // a beam along the top of the opening
  }
  function tapObj(o, fn) { o.traverse(m => { m.userData.tap = fn; }); G.taps.push(o); }

  // ---------- 🧊 THE IGLOO ----------
  function buildIgloo(g) {
    const W = 14, H = 5.2, D = 6.2, zb = FRONT - D, b = makeBatch();
    shell(b, W, H, D, '#dcecf8', '#f2f8fd', '#e6f1fa', '#cfe2f2');
    for (let r = 0; r < 5; r++) for (let c = -1; c < 11; c++) { const x = c * 1.4 + (r % 2 ? .7 : 0) + .7; if (x < .4 || x > W - .4) continue; b.put(BOX, x, r * 1.04 + .52, zb + .05, (r + c) % 3 ? '#eaf4fc' : '#d6e8f6', [1.32, .96, .2]); } // ice blocks
    for (let i = 0; i < 9; i++) { const a = (i + .5) / 9 * Math.PI / 2; b.put(BOX, W / 2, H - .9 + Math.sin(a) * .9, zb + .9 - Math.cos(a) * .9, '#e2eef9', [W, .3, .5], [a, 0, 0]); } // the dome curving into the ceiling
    b.put(BOX, 1.4, 1.2, zb + .2, '#9fd4f5', [1.7, 2.4, .1]); b.put(CYL, 1.4, 2.4, zb + .2, '#9fd4f5', [.85, .1, .85], [Math.PI / 2, 0, 0]); // the round doorway (bright snow outside)
    for (const x of [5, 10.5]) b.put(CYL, x, 3, zb + .2, '#bfe6ff', [.55, .12, .55], [Math.PI / 2, 0, 0]); // round ice windows
    b.put(CYL, 7, .03, -.6, '#c89a6a', [2.2, .05, 1.2]); b.put(CYL, 7, .06, -.6, '#e0b88a', [1.6, .05, .85]); // a fur rug
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; b.put(SPH, 7 + Math.cos(a) * .55, .14, -2.2 + Math.sin(a) * .4, '#8a8f98', .17); } // the fire's stones
    b.put(CYL, 7, .2, -2.2, '#7a4a2a', [.08, .9, .08], [0, 0, Math.PI / 2 - .3]); b.put(CYL, 7, .2, -2.2, '#6a3a1a', [.08, .9, .08], [0, .9, Math.PI / 2 + .3]); // logs
    b.put(BOX, 4, .45, -2.4, '#cfe6f6', [1.2, .9, .9]); b.put(CYL, 4, 1.05, -2.4, '#c8343a', [.16, .3, .16]); b.put(CYL, 4, 1.21, -2.4, '#6a3a1f', [.13, .02, .13]); // an ice table and a cup of cocoa
    b.put(BOX, 11.4, .35, -2.6, '#f6fbff', [2.4, .7, 1.4]); b.put(BOX, 11.7, .74, -2.6, '#ff9fc8', [1.7, .1, 1.3]); b.put(SPH, 10.5, .82, -2.6, '#ffffff', [.35, .16, .45]); // the snow bed, its blanket and pillow
    for (const x of [3, 12.4]) { b.put(CYL, x, 4.3, zb + .4, '#9a6a3a', [.04, .6, .04]); b.put(SPH, x, 3.95, zb + .5, '#ffd23f', .14); } // little lanterns
    const shellM = b.mesh(shinyMat()); g.add(shellM);
    const flames = new THREE.Group(); flames.position.set(7, .2, -2.2); g.add(flames);
    for (const [c, s, dx] of [['#ff7a1e', 1, 0], ['#ffb23f', .75, .12], ['#ffe36e', .5, -.08]]) { const f = new THREE.Mesh(CONE, glowM(c)); f.scale.set(.32 * s, .9 * s, .32 * s); f.position.set(dx, .45 * s, 0); flames.add(f); }
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: '#ffb84a', transparent: true, opacity: .25, depthWrite: false, toneMapped: false })); glow.position.set(7, 1.1, zb + .35); g.add(glow);
    for (const x of [3, 12.4]) { const l = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), glowM('#fff3b0')); l.position.set(x, 3.95, zb + .62); g.add(l); }
    // the baby penguin, asleep in its bed (tap: a sleepy peep)
    const chick = new THREE.Group(); chick.position.set(11.6, .8, -2.5); g.add(chick); const cb = makeBatch();
    cb.put(SPH, 0, .3, 0, '#2a2a38', [.32, .36, .3]); cb.put(SPH, 0, .26, .17, '#ffffff', [.22, .26, .16]); cb.put(SPH, 0, .7, 0, '#2a2a38', .22); cb.put(SPH, 0, .66, .13, '#ffffff', [.15, .13, .12]);
    cb.put(CONE, 0, .64, .25, '#ff9a2e', [.05, .12, .05], [Math.PI / 2, 0, 0]); for (const dx of [-.07, .07]) cb.put(BOX, dx, .74, .2, '#2a2a38', [.07, .015, .02]); // closed sleepy eyes
    chick.add(cb.mesh(shinyMat())); chick.rotation.z = -.25;
    const zz = new THREE.Mesh(new THREE.TorusGeometry(.09, .025, 6, 12), glowM('#ffffff')); zz.position.set(11.9, 1.9, -2.5); g.add(zz);
    const cocoa = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.5, 8), new THREE.MeshBasicMaterial({ visible: false })); cocoa.position.set(4, .75, -2.4); g.add(cocoa);
    const steam = new THREE.Mesh(new THREE.TorusGeometry(.08, .02, 6, 12), glowM('#ffffff')); steam.position.set(4, 1.4, -2.4); g.add(steam);
    const fireHit = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 1.6, 8), new THREE.MeshBasicMaterial({ visible: false })); fireHit.position.set(7, .8, -2.2); g.add(fireHit);
    let warm = 0, peep = 0;
    const sip = () => { Sound.giggle ? Sound.giggle() : Sound.chime(); say('☕ Hot cocoa in the igloo! Yum, yum!'); disc('cocoa'); };
    const hush = () => { peep = 1.2; Sound.tone ? Sound.tone(1400, .08, 'sine', .03, 1.3) : Sound.click(); say('🐧 Shh... the baby penguin is sleeping. Peep!'); disc('penguinchick'); };
    const warmUp = () => { warm = 3; Sound.whoosh ? Sound.whoosh() : Sound.click(); say('🔥 Ahh, the fire is so warm and cosy!'); disc('iglooFire'); };
    tapObj(cocoa, sip); tapObj(chick, hush); tapObj(fireHit, warmUp);
    return { W, H, D, door: 1.4, icon: '🧊', name: 'the igloo', out: 'the snow outside', hello: '🧊 Inside the igloo! A cosy fire, hot cocoa and a sleepy baby penguin!',
      inter: [{ x: 4, icon: '☕', action: 'Drink cocoa', run: sip }, { x: 7, icon: '🔥', action: 'Warm up', run: warmUp }, { x: 11, icon: '🐧', action: 'Baby penguin', run: hush }],
      update: (dt, t) => { const f = 1 + Math.sin(t * 14) * .1 + (warm > 0 ? .35 : 0); warm = Math.max(0, warm - dt); flames.scale.set(1, f, 1); flames.rotation.y += dt * 2;
        glow.material.opacity = .22 + Math.sin(t * 9) * .04 + (warm > 0 ? .15 : 0);
        peep = Math.max(0, peep - dt); chick.position.y = .8 + Math.abs(Math.sin(t * 1.4)) * .03 + (peep > 0 ? Math.abs(Math.sin(peep * 9)) * .15 : 0);
        zz.position.y = 1.6 + (t * .4 % 1) * .8; zz.scale.setScalar(1 + (t * .4 % 1)); steam.position.y = 1.35 + (t * .5 % 1) * .5; steam.scale.setScalar(1 + (t * .5 % 1)); } };
  }

  // ---------- 💡 THE LIGHTHOUSE ----------
  function buildLighthouse(g) {
    const W = 12, H = 17.5, D = 6, zb = FRONT - D, b = makeBatch(), plats = [];
    shell(b, W, H, D, '#fbf7f0', '#c8925a', '#f3ece0', '#e8ded0');
    for (const y of [4.2, 9.6, 15]) b.put(BOX, W / 2, y, zb + .02, '#ff4f6a', [W, .7, .1]); // red stripes round the tower
    for (const [x, y] of [[3, 2.6], [9, 7.2], [3, 12], [6, 16.2]]) { b.put(CYL, x, y, zb + .08, '#ffffff', [.85, .1, .85], [Math.PI / 2, 0, 0]); b.put(CYL, x, y, zb + .12, '#7fd0ff', [.7, .1, .7], [Math.PI / 2, 0, 0]); b.put(BOX, x, y - .3, zb + .14, '#3f9ae0', [1.3, .25, .05]); } // round windows on the sea
    b.put(BOX, 1.3, 1.15, zb + .05, '#c8102e', [1.3, 2.3, .12]); b.put(SPH, 1.75, 1.1, zb + .15, '#ffd23f', .07); // the door (inside)
    // the stairs: three flights back and forth, with landings, up to the lamp room
    const step = (x, y) => { b.put(BOX, x, y - .12, -1.1, '#b07a4a', [1.2, .24, 2.4]); b.put(BOX, x, (y - .24) / 2, -2.3, '#8a5a3a', [.14, Math.max(.05, y - .24), .14]); plats.push({ a: x - .6, b: x + .6, y, z: 0, layer: 'room', step: true, stepMax: .75 }); };
    for (let i = 0; i < 7; i++) step(2.6 + i * 1.2, .6 * (i + 1)); // flight 1, going right: up to 4.2
    b.put(BOX, 11.03, 4.8 - .12, -1.1, '#b07a4a', [1.65, .24, 2.4]); plats.push({ a: 10.2, b: 11.85, y: 4.8, z: 0, layer: 'room', step: true, stepMax: .75 }); // landing
    for (let i = 0; i < 7; i++) step(9.7 - i * 1.2, 5.4 + .6 * i); // flight 2, going left: up to 9 (its first stair overlaps the landing, so turning there never drops her)
    b.put(BOX, 1.1, 9.6 - .12, -1.1, '#b07a4a', [1.9, .24, 2.4]); plats.push({ a: .15, b: 2.05, y: 9.6, z: 0, layer: 'room', step: true, stepMax: .75 }); // landing
    for (let i = 0; i < 7; i++) step(2.6 + i * 1.2, 10.2 + .6 * i); // flight 3, going right: up to 13.8
    b.put(BOX, 11.1, 14.4 - .12, -1.1, '#b07a4a', [1.6, .24, 2.4]); plats.push({ a: 10.3, b: 11.85, y: 14.4, z: 0, layer: 'room', step: true, stepMax: .75 });
    b.put(BOX, 5.2, 14.4 - .12, -1.6, '#c8925a', [10.2, .24, 3.4]); plats.push({ a: .15, b: 10.3, y: 14.4, z: 0, layer: 'room', step: true, stepMax: .75 }); // the lamp-room floor
    for (let x = .6; x < 10; x += 1.1) b.put(CYL, x, 14.9, .05, '#ffffff', [.04, 1, .04]); b.put(BOX, 5.2, 15.4, .05, '#ffffff', [10, .08, .08]); // its railing
    b.put(BOX, 5.2, 16.4, zb + .06, '#7fd0ff', [9, 1.6, .08]); // the wide window up top, out over the sea
    b.put(CYL, 5.2, 14.7, -2.2, '#4a4a5a', [.7, .6, .7]); b.put(CYL, 5.2, 16.95, -2.2, '#4a4a5a', [.95, .2, .95]); // the lamp's base and cap
    g.add(b.mesh(shinyMat())); for (const p of plats) { p.a += cur0; p.b += cur0; G.platforms.push(p); }
    const lens = new THREE.Mesh(new THREE.SphereGeometry(.75, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff3a0', toneMapped: false })); lens.position.set(5.2, 15.8, -2.2); g.add(lens);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, 1.9, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#d8f2ff', transparent: true, opacity: .25, depthWrite: false })); glass.position.set(5.2, 15.85, -2.2); g.add(glass);
    const beam = new THREE.Group(); beam.position.copy(lens.position); g.add(beam); beam.visible = false;
    for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6b0', transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); c.rotation.z = s * Math.PI / 2; c.position.x = s * 4.5; beam.add(c); }
    let spin = 0;
    const shine = () => { if (P.y < 13.5) { say('💡 Climb the stairs all the way to the top to reach the lamp!'); return; } spin = 8; beam.visible = true; Sound.tone ? Sound.tone(110, 1.2, 'sawtooth', .03, 1) : Sound.chime(); say('💡 You lit the great lamp! Its light shines over the sea for the boats!'); disc('lighthousetop'); disc('lighthouse'); };
    tapObj(lens, shine);
    return { W, H, D, door: 1.3, icon: '💡', name: 'the lighthouse', out: 'the beach outside', hello: '💡 Inside the lighthouse! Climb the stairs all the way up to the great lamp!', plats,
      inter: [{ x: 5.2, y: 14.4, icon: '💡', action: 'Light the lamp', run: shine }],
      onTop: () => { if (P.y > 14.3 && !G._lhTop) { G._lhTop = 1; say('💡 The top of the lighthouse! Tap the great lamp to make it shine!'); } },
      update: (dt, t) => { lens.scale.setScalar(1 + Math.sin(t * 3) * .04); if (spin > 0) { spin -= dt; beam.rotation.y += dt * 2.2; if (spin <= 0) beam.visible = false; } } };
  }
  // ---------- 🌱 THE GREENHOUSE (build 157, the family's request) ----------
  //  glass walls and ceiling ribs, planter beds full of flowers, butterflies; THE WATERING CAN: tap it (or 🐾) and she
  //  carries it; tap a little sprout (or 🐾 beside it) and she waters it: it grows up into a big flower. All three blooming:
  //  "Your flowers are blooming!"
  function buildGreenhouse(g) {
    const W = 14, H = 6, D = 6.2, zb = FRONT - D, b = makeBatch();
    shell(b, W, H, D, '#dff3e6', '#c8b89a', '#e8f6ee', '#cfe3d4');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) b.put(BOX, .8 + c * 1.55, .9 + r * 1.75, zb + .02, (r + c) % 2 ? '#cdeedd' : '#d8f4e4', [1.45, 1.65, .05]); // glass panes
    for (let c = 0; c <= 9; c++) b.put(BOX, .05 + c * 1.55, H / 2, zb + .06, '#7fae8b', [.08, H, .06]); for (const y of [1.75, 3.5, 5.25]) b.put(BOX, W / 2, y, zb + .06, '#7fae8b', [W, .07, .06]); // the frame
    for (let i = 0; i < 6; i++) b.put(BOX, 1.2 + i * 2.3, H - .05, FRONT - D / 2, '#7fae8b', [.1, .12, D]); // ceiling ribs
    b.put(BOX, 1.3, 1, zb + .08, '#31423a', [1.4, 2, .08]); b.put(CYL, 1.3, 1.55, zb + .14, '#bfe9f2', [.2, .04, .2], [Math.PI / 2, 0, 0]); // the door (inside)
    const FLW = ['#ff4f8a', '#ffd23f', '#b07cff', '#ff9a2e', '#ff6f6f', '#4fb0ff'];
    for (const [x0, x1] of [[2.4, 6.6], [7.6, 13.2]]) { b.put(BOX, (x0 + x1) / 2, .4, zb + .9, '#8a5a3a', [x1 - x0, .8, 1.2]); b.put(BOX, (x0 + x1) / 2, .78, zb + .9, '#6b4a34', [x1 - x0 - .15, .06, 1.05]);
      for (let x = x0 + .4, i = 0; x < x1 - .2; x += .55, i++) { b.put(LEAFG, x, 1.05, zb + .9 + (i % 2 ? .25 : -.25), i % 2 ? '#3fbf5a' : '#5fd36a', [.3, .25, .25]); b.put(SPH, x, 1.3 + (i % 3) * .08, zb + .9 + (i % 2 ? .25 : -.25), FLW[i % 6], .11); } } // planter beds full of flowers
    for (const x of [.8, 13.2]) { b.put(CYL, x, .35, -.6, '#c8603a', [.35, .7, .35]); for (let i = 0; i < 5; i++) b.put(LEAFG, x + Math.cos(i * 1.3) * .3, 1.1 + (i % 2) * .3, -.6 + Math.sin(i * 1.3) * .25, '#3fbf5a', [.35, .5, .25]); } // tall potted plants
    b.put(BOX, 3, .3, -1.6, '#a8743a', [.7, .6, .7]); // the stool the watering can stands on
    g.add(b.mesh(shinyMat()));
    // the watering can (also the one she carries)
    const can = new THREE.Group(); { const cb = makeBatch(); cb.put(CYL, 0, .22, 0, '#4fb0ff', [.22, .4, .22]); cb.put(CYL, .3, .32, 0, '#4fb0ff', [.04, .45, .04], [0, 0, -1]); cb.put(CYL, .5, .45, 0, '#3a90df', [.07, .06, .07], [0, 0, -1]); cb.put(BOX, -.05, .48, 0, '#3a90df', [.35, .05, .06]); can.add(cb.mesh(shinyMat())); }
    can.position.set(3, .6, -1.6); g.add(can); const hand = new THREE.Group(); let carrying = false;
    // the three sprouts: each grows into a big flower when watered
    const sprouts = [5.2, 8.4, 11.6].map((x, i) => { const grp = new THREE.Group(); grp.position.set(x, 0, -1.4); g.add(grp); const pot = new THREE.Mesh(CYL, new THREE.MeshStandardMaterial({ color: '#c8603a', roughness: .8 })); pot.scale.set(.3, .45, .3); pot.position.y = .22; grp.add(pot);
      const plant = new THREE.Group(); plant.position.y = .45; grp.add(plant); const fb = makeBatch(); fb.put(CYL, 0, .7, 0, '#3f9a4a', [.05, 1.4, .05]); fb.put(LEAFG, .18, .5, 0, '#5fd36a', [.25, .1, .12]); fb.put(LEAFG, -.18, .85, 0, '#5fd36a', [.25, .1, .12]);
      for (let p = 0; p < 6; p++) fb.put(SPH, Math.cos(p / 6 * Math.PI * 2) * .26, 1.45 + Math.sin(p / 6 * Math.PI * 2) * .26, .02, FLW[i * 2], [.17, .17, .06]); fb.put(SPH, 0, 1.45, .06, '#ffd23f', .14); plant.add(fb.mesh(shinyMat())); plant.scale.setScalar(.15);
      return { x, grp, plant, grown: 0, grow: 0 }; });
    let bloomed = 0;
    const take = () => { if (carrying) { carrying = false; can.position.set(3, .6, -1.6); g.add(can); G.hold && G.hold(null); say('🪴 The watering can goes back on its stool.'); return; } carrying = true; hand.add(can); can.position.set(.1, -.4, 0); G.hold && G.hold(hand); Sound.click && Sound.click(); say('💧 You have the watering can! Water the little sprouts!'); disc('wateringcan'); };
    const water = q => { if (!carrying) { say('💧 Take the watering can first! It is on the stool by the door.'); return; } if (q.grown) { say('🌸 This flower is already blooming!'); return; } q.grown = 1; q.grow = 0; Sound.twinkle ? Sound.twinkle() : Sound.chime(); bloomed++;
      say(bloomed < 3 ? '💧 Splish splash! Look, it is growing into a big flower!' : '🌸 All three flowers are blooming! What a gardener!'); if (bloomed === 3) disc('greenhouseflowers'); };
    tapObj(can, () => { if (!carrying) take(); }); for (const q of sprouts) tapObj(q.grp, () => water(q));
    const bfM = ['#ff8fc8', '#ffd23f', '#9fe6ff'].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, toneMapped: false })), flies = bfM.map((m, i) => { const f = new THREE.Group(); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(.14, 10), m); w.position.x = s * .12; w.userData.s = s; f.add(w); } g.add(f); return { f, i }; });
    const drops = new THREE.Group(); g.add(drops); for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), new THREE.MeshBasicMaterial({ color: '#7fd0ff' })); d.visible = false; drops.add(d); }
    return { W, H, D, door: 1.3, icon: '🌱', name: 'the greenhouse', out: 'the garden outside', hello: '🌱 Inside the greenhouse! Take the watering can and water the little sprouts!',
      inter: [{ x: 3, icon: '💧', action: 'Watering can', run: take }, ...sprouts.map(q => ({ x: q.x, icon: '🌱', action: 'Water the sprout', run: () => water(q) }))],
      onLeave: () => { if (carrying) { carrying = false; can.position.set(3, .6, -1.6); g.add(can); if (G.holding === hand) G.hold(null); } },
      update: (dt, t) => { for (const q of sprouts) { if (q.grown && q.grow < 1) { q.grow = Math.min(1, q.grow + dt * .6); const d = drops.children; for (const [j, dd] of d.entries()) { dd.visible = q.grow < .5; dd.position.set(q.x + .1 + Math.sin(j) * .1, 1.6 - ((t * 2 + j * .17) % 1) * 1, -1.4); } }
          q.plant.scale.setScalar(.15 + q.grow * .85); q.plant.rotation.z = Math.sin(t * 1.5 + q.x) * .04; }
        if (!sprouts.some(q => q.grown && q.grow < .5)) for (const dd of drops.children) dd.visible = false;
        for (const { f, i } of flies) { const a = t * (.5 + i * .12) + i * 2; f.position.set(W / 2 + Math.sin(a) * (4.5 - i), 2.6 + Math.sin(a * 2.3) * .7 + i * .4, -1.5 - i * .6); for (const w of f.children) w.rotation.y = w.userData.s * (.4 + Math.abs(Math.sin(t * 14 + i)) * .9); } } };
  }
  let cur0 = 0; // (the x of the room being built)
  const DEF = { igloo: { x: -5400, build: buildIgloo }, lighthouse: { x: -5600, build: buildLighthouse }, greenhouse: { x: -5800, build: buildGreenhouse } };

  function get(id) {
    if (R[id]) return R[id];
    const d = DEF[id], g = new THREE.Group(); g.position.set(d.x, 0, 0); g.visible = false; scene.add(g); cur0 = d.x;
    const r = d.build(g); r.g = g; r.x0 = d.x; r.items = [];
    const doorIt = { x: d.x + r.door, y: 0, layer: 'room', icon: '🚪', action: 'Go outside', hintY: 2.4, run: () => leave() }; G.interact.push(doorIt);
    for (const it of r.inter) G.interact.push({ hintY: 2.4, layer: 'room', ...it, x: d.x + it.x, y: it.y || 0 });
    k.compile && k.compile(g);
    return (R[id] = r);
  }
  /** into a room; back: the x outside its door (she comes out there) */
  function enter(id, back) {
    const r = get(id); if (cur) cur.g.visible = false; cur = r; r.back = back; r.g.visible = true; G.outsideX = back;
    P.ride = null; P.stair = null; P.layer = 'room'; P.x = r.x0 + r.door + .9; P.y = 0; P.z = 0; P.groundZ = 0; P.vx = P.vy = 0; P.grounded = true; P.facing = 1;
    G.tunnelBounds = [r.x0 - .3, r.x0 + r.W - .5];
    G.roomCam = { x0: r.x0 - .1, x1: r.x0 + r.W + .1, y0: -.15, y1: r.H + .1, z: FRONT + .1 };
    k.world && (k.world.flash = 1); Sound.click && Sound.click(); Sound.chime && Sound.chime(); say(r.hello); disc(id + 'in'); k.snap && k.snap();
  }
  function leave() { if (!cur) return; const r = cur; cur = null; r.onLeave && r.onLeave(); r.g.visible = false; G.roomCam = null; k.travelTo(r.back, '🚪', r.out); }
  function update(dt, t) {
    if (!cur) return;
    if (P.layer !== 'room') { cur.onLeave && cur.onLeave(); cur.g.visible = false; cur = null; G.roomCam = null; return; } // (she left another way: the map, 🏠...)
    if (P.x < cur.x0 + .05) { leave(); return; } // walked out of the door
    cur.onTop && cur.onTop(); cur.update(dt, t);
  }
  return { enter, leave, update, active: () => cur, rooms: R };
}
