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

const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 12, 9), CYL = new THREE.CylinderGeometry(1, 1, 1, 16), CONE = new THREE.ConeGeometry(1, 1, 10);
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
    b.put(BOX, 11.1, 4.8 - .12, -1.1, '#b07a4a', [1.6, .24, 2.4]); plats.push({ a: 10.3, b: 11.85, y: 4.8, z: 0, layer: 'room', step: true, stepMax: .75 }); // landing
    for (let i = 0; i < 7; i++) step(9.4 - i * 1.2, 5.4 + .6 * i); // flight 2, going left: up to 9
    b.put(BOX, .95, 9.6 - .12, -1.1, '#b07a4a', [1.6, .24, 2.4]); plats.push({ a: .15, b: 1.7, y: 9.6, z: 0, layer: 'room', step: true, stepMax: .75 }); // landing
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
  let cur0 = 0; // (the x of the room being built)
  const DEF = { igloo: { x: -5400, build: buildIgloo }, lighthouse: { x: -5600, build: buildLighthouse } };

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
  function leave() { if (!cur) return; const r = cur; cur = null; r.g.visible = false; G.roomCam = null; k.travelTo(r.back, '🚪', r.out); }
  function update(dt, t) {
    if (!cur) return;
    if (P.layer !== 'room') { cur.g.visible = false; cur = null; G.roomCam = null; return; } // (she left another way: the map, 🏠...)
    if (P.x < cur.x0 + .05) { leave(); return; } // walked out of the door
    cur.onTop && cur.onTop(); cur.update(dt, t);
  }
  return { enter, leave, update, active: () => cur, rooms: R };
}
