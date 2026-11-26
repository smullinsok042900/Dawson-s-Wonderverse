// ===================================================================
// mercury-funhouse.js (build 71): THE GIANT CARNIVAL FUNHOUSE on Mercury, right after the mirror maze (area 3, x 220–330).
//
// A three-floor building, open at the front like a doll's house so you always see inside. Every room has something to do:
//   GROUND (y 0):   the HALL OF INFINITE MIRRORS · WOBBLY WALKWAYS (moving floors) · the SPINNING DISC · the BOUNCY
//                   FOAM ROOM with a ball pit · the SPINNING LIGHT TUNNEL · the PRIZE HALL (the funhouse star hunt).
//   FLOOR 2 (6.5):  FIND THE REAL DOOR · the GIANT-AND-TINY ROOM · the UPSIDE-DOWN ROOM · the LIGHT GAME (copy the
//                   lights) · the SHAPE GAME.
//   FLOOR 3 (13):   the ENDLESS CORRIDOR · the ROTATING MIRROR TUNNEL · the HIDDEN MIRROR DOOR to a secret room ·
//                   the top of the BIG TOP SLIDE, a giant spiral slide outside down to the ground.
//   Between floors: two lifts and a staircase (one tap each), and slides down.
// Mirrors: instead of extra cameras, a mirror shows a mirrored copy of the room and of your character behind the glass
// (one mesh plus one character, drawn only while you are in that room): it looks like a mirror and costs almost nothing.
// Speed: each part is one or two merged meshes with shaders prepared at start; per-frame work is a few distance checks.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, glowMat, col } from './spacekit.js';
import { toy } from './creatures.js';

const RB = ['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fae'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const GEO = () => ({ box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), ball: new THREE.SphereGeometry(1, 12, 9), lo: new THREE.SphereGeometry(1, 7, 5),
  cone: new THREE.ConeGeometry(1, 1, 14), torus: new THREE.TorusGeometry(1, .08, 6, 28), oct: new THREE.OctahedronGeometry(1), heart: heartGeo(), tri: new THREE.CylinderGeometry(1, 1, 1, 3) });
function heartGeo() { const s = new THREE.Shape(); s.moveTo(0, -.6); s.bezierCurveTo(-1.1, .1, -.6, .9, 0, .45); s.bezierCurveTo(.6, .9, 1.1, .1, 0, -.6); return new THREE.ExtrudeGeometry(s, { depth: .15, bevelEnabled: false, curveSegments: 8 }); }
const glass = (opacity = .3, color) => { const m = shinyMat().clone(); m.transparent = true; m.opacity = opacity; m.depthWrite = false; if (color) { m.vertexColors = true; } return m; };
const painted = (geo, hex) => { const b = makeBatch(); b.add(geo, null, hex); return b.geometry(); };
const mesh = (b, mat, shadow) => { const m = b.mesh(mat); if (shadow) m.castShadow = true; return m; };
const onPlanet = P => P.layer === 'space';
const near = (P, x, y, dx = 5, dy = 2) => onPlanet(P) && !P.ride && Math.abs(P.x - x) < dx && Math.abs(P.y - y) < dy;
function rideTo(k, type, step, done) {
  const P = k.P, R = { type, t: 0, noExit: true }; P.ride = R; P.vx = P.vy = 0;
  k.U.push(dt => { if (R.over) return; if (P.ride !== R) { R.over = true; return; } R.t += dt; if (step(R, dt)) { R.over = true; if (P.ride === R) { P.ride = null; P.vy = 0; P.grounded = true; } done && done(); } });
}
const F2 = 6.5, F3 = 13, BX0 = 224, BX1 = 320, ZB = -5;   // floors, the building's ends (from the planet's start X), the back wall

export function mercuryFunhouse(k) {
  const P = k.P, G = k.G, X = k.X, G0 = GEO(), S = k.Sound, x = v => X + v;
  const stars = [];          // the funhouse star hunt: six stars hidden round the building
  const prize = [];          // their places on the prize board
  // ---------------- THE BUILDING: floors, back walls, room arches, the towers, the roof and the lights ----------------
  { const b = makeBatch(), gb = makeBatch();
    for (const [y, a, c] of [[F2, BX0 + 2, BX1 - 7], [F3, 238, 312]]) { b.put(G0.box, x((a + c) / 2), y - .2, -2.5, '#fff0f8', [c - a, .4, 5]); b.put(G0.box, x((a + c) / 2), y - .45, -.05, '#ff4f9a', [c - a, .3, .3]); k.plat(x(a), x(c), y, { z: -1.2 }); }
    // the back wall, room by room (each room its own colour); the Hall of Mirrors (224–238) has a mirror instead
    const rooms = [[238, 254, '#ffe3f1'], [254, 268, '#e3f3ff'], [268, 284, '#fff3c4'], [284, 298, '#e8e0ff'], [298, BX1, '#e3ffe9']];
    for (const [a, c, cl] of rooms) b.put(G0.box, x((a + c) / 2), F2 / 2, ZB, cl, [c - a, F2, .3]);
    for (const [a, c, cl] of [[BX0, 244, '#e8e0ff'], [244, 262, '#fff3c4'], [262, 280, '#ffe3f1'], [280, 300, '#e3f3ff'], [300, BX1, '#e3ffe9']]) b.put(G0.box, x((a + c) / 2), F2 + (F3 - F2) / 2, ZB, cl, [c - a, F3 - F2, .3]);
    for (const [a, c, cl] of [[238, 240, '#e3f3ff'], [256, 287, '#e3f3ff'], [289, 312, '#e3f3ff']]) b.put(G0.box, x((a + c) / 2), F3 + 2.75, ZB, cl, [c - a, 5.5, .3]);
    // arches between rooms (striped posts and a curved top)
    for (const ax of [238, 254, 268, 284, 298]) for (const [y0, h] of [[0, F2], [F2, F3 - F2]]) { b.put(G0.box, x(ax), y0 + h / 2, ZB + .5, '#ffffff', [.5, h, .8]); gb.put(G0.torus, x(ax), y0 + h - 1.2, ZB + .9, RB[ax % 7], [1.4, 1, 1]); }
    // the outside: two striped towers with domes, a big-top roof, pennants, a giant sign with a star and a moon
    for (const tx of [BX0 - 2, BX1 + 2]) { for (let i = 0; i < 7; i++) b.put(G0.cyl, x(tx), i * 3 + 1.5, -3, i % 2 ? '#ffffff' : '#ff4f9a', [2, 3, 2]); b.put(G0.ball, x(tx), 21.5, -3, '#ffd23f', [2.3, 2, 2.3]); b.put(G0.cone, x(tx), 24, -3, '#9b6cff', [.6, 2.4, .6]); }
    for (let i = 0; i < 24; i++) { const xx = 240 + i * 3; b.put(G0.box, x(xx), 19.6, -2.9, i % 2 ? '#ffffff' : '#ff4f6a', [3, .3, 4.6], [.42, 0, 0]); }
    for (let i = 0; i < 40; i++) { const xx = BX0 + .5 + i * (BX1 - BX0 - 1) / 39; gb.put(G0.lo, x(xx), 18.7, -.4, RB[i % 7], .2); gb.put(G0.cone, x(xx + 1.2), F3 - .9, -.1, RB[(i + 3) % 7], [.35, .6, .05], [Math.PI, 0, 0]); }
    gb.put(G0.ball, x(276), 23.5, -3.4, '#ffd23f', 2.6); gb.put(G0.ball, x(272.5), 23.5, -3.2, '#9b6cff', [1.6, 2.2, 1]); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; gb.put(G0.lo, x(276) + Math.cos(a) * 4, 23.5 + Math.sin(a) * 4, -3.3, i % 2 ? '#ffffff' : '#ff4f6a', .35); }
    const bm = mesh(b, shinyMat(), true); k.add(bm); k.add(gb.mesh(glowMat()));
    k.tapIt(bm, () => k.fact('🎪 The giant carnival funhouse! Every room has a surprise. There are six funhouse stars hidden inside: can you find them all?', 'mercuryfunhouse2'), x(BX0 + 2), 'mercuryfunhouse2'); }
  const addStar = (sx, sy, hidden) => { const m = new THREE.Mesh(G0.oct, toy('#ffd23f', { em: '#ffb000', ei: .8, m: .3 })); m.scale.set(.42, .55, .18); m.position.set(x(sx), sy, -1); m.visible = !hidden; k.add(m); const s = { m, x: x(sx), y: sy, got: false, hidden }; stars.push(s); return s; };
  // ---------------- G1: THE HALL OF INFINITE MIRRORS (224–238): the back wall is a mirror ----------------
  { const a = BX0, c = 238, room = makeBatch();
    for (let i = 0; i < 4; i++) { const px = a + 1.5 + i * 3.8; room.put(G0.cyl, x(px), F2 / 2, -3.6, RB[(i * 2) % 7], [.35, F2, .35]); room.put(G0.ball, x(px), F2 - .6, -3.6, '#ffd23f', .45); }
    for (let i = 0; i < 7; i++) room.put(G0.box, x(a + 1 + i * 2), .03, -2.5, i % 2 ? '#2a1f4a' : '#ffffff', [2, .06, 5]);
    for (let i = 0; i < 7; i++) room.put(G0.lo, x(a + 1 + i * 2), F2 - .3, -.6, RB[i], .25);
    const real = mesh(room, shinyMat()); k.add(real); const geo = real.geometry;
    // the "reflection": the same room mirrored behind the glass, and again and again, each a little darker (infinity!)
    // (the room is z 0 … −5 and the mirror is at −5: its image is z −5 … −10, mirrored; then the image of the image
    //  (z −10 … −15, the right way round) and the next (z −15 … −20, mirrored), each behind a darker glass)
    const refl = new THREE.Group(); k.add(refl); const shadeG = painted(new THREE.PlaneGeometry(c - a, F2), '#3a2a6a');
    // (build 73 speed: one mirrored room, then a dark back wall, instead of three copies and two tinted panes)
    { const m = new THREE.Mesh(geo, shinyMat()); m.scale.z = -1; m.position.z = 2 * ZB; refl.add(m); }
    const back = makeBatch(); back.put(G0.box, x((a + c) / 2), F2 / 2, 2 * ZB - .2, '#1a1430', [c - a, F2, .2]); refl.add(back.mesh(shinyMat()));
    const pane = new THREE.Mesh(painted(new THREE.PlaneGeometry(c - a, F2), '#cfe8ff'), glass(.12)); pane.position.set(x((a + c) / 2), F2 / 2, ZB); k.add(pane);
    const frame = makeBatch(); frame.put(G0.box, x((a + c) / 2), F2 - .1, ZB, '#ffd23f', [c - a, .25, .3]); frame.put(G0.box, x((a + c) / 2), .1, ZB, '#ffd23f', [c - a, .25, .3]); k.add(mesh(frame, shinyMat()));
    // (build 73 speed) the mirror shows a PICTURE of you, refreshed every third frame by a little camera at the mirror that
    // sees only you (one draw call on screen, instead of a whole second character: about 55 draw calls)
    const MW = 2.2, MH = 2.6, rt = new THREE.WebGLRenderTarget(176, 208), mcam = new THREE.PerspectiveCamera(40, MW / MH, .2, 20), LAYER = 5;
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: rt.texture, fog: false, toneMapped: false })); pic.scale.x = -1; pic.visible = false; k.add(pic); mcam.layers.set(LAYER);
    let said = false, fno = 0, tagged = null; const bg = new THREE.Color('#cfe3ff');
    k.U.push(() => { const inRoom = onPlanet(P) && P.x > x(a) - 4 && P.x < x(c) + 4 && P.y < F2 - .5; refl.visible = inRoom; pic.visible = inRoom;
      if (!inRoom) return; if (!said) { said = true; k.fact('🪞 The Hall of Infinite Mirrors! The mirror shows you, and the mirror in the mirror, again and again, forever!', 'mercuryinfinite'); }
      pic.position.set(P.x, P.y + MH / 2, ZB + .03);
      if (fno++ % 3) return; const body = G.playerBody, R = G.renderer; if (!body || !R) return;
      if (tagged !== body) { body.traverse(o => o.layers.enable(LAYER)); tagged = body; }
      mcam.position.set(P.x, P.y + MH / 2, ZB); mcam.lookAt(P.x, P.y + MH / 2, P.z || 0);
      const prev = R.getRenderTarget(), pbg = G.scene.background, pc = R.getClearColor(new THREE.Color()), pa = R.getClearAlpha(), sm = R.shadowMap.autoUpdate;
      G.scene.background = null; R.shadowMap.autoUpdate = false; R.setClearColor(bg, 1); R.setRenderTarget(rt); R.clear(); R.render(G.scene, mcam); R.setRenderTarget(prev); R.setClearColor(pc, pa); G.scene.background = pbg; R.shadowMap.autoUpdate = sm; G.mirrorPics = (G.mirrorPics || 0) + 1; });
  }
  // ---------------- G2: WOBBLY WALKWAYS (238–254): two moving floors and a wobbly bridge ----------------
  { const belts = [[238.5, 243.5, 1.6, '#5aa8ff'], [243.8, 248.8, -1.1, '#ff9a2e']], bb = makeBatch(), stripes = [];
    for (const [a, c, , cl] of belts) bb.put(G0.box, x((a + c) / 2), .06, -1.2, cl, [c - a, .12, 2.4]); k.add(mesh(bb, shinyMat()));
    for (const [a, c] of belts) { const sb = makeBatch(); for (let s = a; s < c - .3; s += .6) sb.put(G0.box, x(s + .3), .13, -1.2, '#ffffff', [.12, .02, 2.3]); const m = sb.mesh(glowMat()); k.add(m); stripes.push(m); }
    const wob = new THREE.Group(); wob.position.set(x(251.5), .3, -1.2); k.add(wob); const wb = makeBatch(); wb.put(G0.box, 0, 0, 0, '#7fe0a0', [5, .25, 2.4]); for (const s of [-1, 1]) wb.put(G0.cyl, s * 2.6, -.15, 0, '#ffffff', [.3, .3, .3]); wob.add(mesh(wb, shinyMat()));
    k.plat(x(249), x(254), .42, { z: -1.2, step: true, stepMax: .6 }); let said = 0;
    k.U.push((dt, t) => { for (const [i, m] of stripes.entries()) m.position.x = ((t * belts[i][2]) % .6 + .6) % .6 - .3;
      if (!onPlanet(P) || P.ride || !P.grounded) { wob.rotation.z *= .95; return; }
      for (const [a, c, v] of belts) if (P.y < 1 && P.x > x(a) && P.x < x(c)) { P.x += v * dt; if (!(said & 1)) { said |= 1; k.fact('🚶 A moving floor! It carries you along. This one goes the other way: walk against it!', 'mercurybelts'); } }
      const onW = P.x > x(249) && P.x < x(254) && Math.abs(P.y - .42) < .2; wob.rotation.z = onW ? Math.sin(t * 3) * .12 : wob.rotation.z * .9; if (onW) { P.x += Math.sin(t * 3) * .5 * dt; if (!(said & 2)) { said |= 2; k.fact('〰️ A wobbly bridge! Wibble wobble!', 'mercurywobble'); } } }); }
  // ---------------- G3: THE SPINNING DISC (254–268): tap it and ride round and round; a star on the middle pole ----------------
  { const cx = x(261), disc = new THREE.Group(); disc.position.set(cx, 0, -2.2); k.add(disc); const db = makeBatch(); db.put(G0.cyl, 0, .12, 0, '#ffffff', [4.2, .24, 2.6]);
    for (let i = 0; i < 8; i++) db.put(G0.box, 0, .25, 0, RB[i % 7], [8.2, .02, .5], [0, i * Math.PI / 8, 0]); db.put(G0.cyl, 0, 1.4, 0, '#ff4f9a', [.15, 2.6, .15]); disc.add(mesh(db, shinyMat()));
    addStar(261, 3.2); let spin = .4;
    k.U.push(dt => { disc.rotation.y += spin * dt; spin = Math.max(.4, spin - dt * .5); });
    k.tapIt(disc, () => { if (!near(P, cx, 0, 6, 1)) return; spin = 3; S.whoosh(); k.fact('🌀 The spinning disc! Round and round!', 'mercurydisc');
      rideTo(k, 'mdisc', R => { const a = disc.rotation.y; P.x = cx + Math.cos(a) * 3; P.z = -2.2 - Math.sin(a) * 1.8; P.y = .3; P.facing = Math.sin(a) > 0 ? 1 : -1; spin = Math.max(spin, 2.6); R.roll = .12; return R.t > 6; }, () => { P.y = 0; P.z = 0; P.x = cx + 4.6; }); }, cx, 'mercurydisc'); }
  // ---------------- G4: THE BOUNCY FOAM ROOM (268–284): soft blocks to climb, a bouncy floor, a ball pit ----------------
  { const b = makeBatch(), gb = makeBatch(); [[269, 1], [271, 2], [273, 3], [275, 2]].forEach(([bx, h], i) => { b.put(G0.box, x(bx + .9), h / 2, -1.2, RB[(i * 2 + 1) % 7], [1.8, h, 2.4]); k.plat(x(bx), x(bx + 1.8), h, { z: -1.2, step: true, stepMax: 1.15 }); });
    b.put(G0.box, x(279.5), .1, -1.2, '#ff6fae', [4.4, .2, 2.4]); let sq = 0; const floorM = mesh(b, shinyMat(), true); k.add(floorM);
    k.plat(x(277.4), x(281.6), .2, { z: -1.2, pad: true, bounce: 9.5, onLand: () => { sq = 1; S.boing(); k.disc('mercurybounce', '🤸 A bouncy floor! On Mercury you bounce really high!'); } });
    for (let i = 0; i < 40; i++) gb.put(G0.lo, x(282 + (i * .37) % 1.8), .25 + (i % 3) * .15, -2.4 + (i * .53) % 2.4, RB[i % 7], .22); for (const z of [-3.7, 1]) b.put(G0.box, x(283), .4, z, '#5aa8ff', [2.2, .8, .2]);
    k.add(gb.mesh(glowMat())); addStar(279.5, 4.6);
    k.U.push(dt => { sq = Math.max(0, sq - dt * 3); if (onPlanet(P) && P.x > x(281.9) && P.x < x(284) && P.y < .6 && Math.abs(P.vx) > .5 && Math.random() < dt * 6) k.api.burst(P.x, .5, -1, RB, 2, 1); }); }
  // ---------------- G5: THE SPINNING LIGHT TUNNEL (284–298): striped rings turn round the path; lights follow you ----------------
  { const rings = new THREE.Group(); rings.position.set(0, 1.9, -1.2); k.add(rings); const rb = makeBatch();
    for (let i = 0; i < 13; i++) for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2 + i * .4; rb.put(G0.box, x(285 + i), Math.cos(a) * 2.4, Math.sin(a) * 2.4, RB[(i + j) % 7], [.25, .8, .25], [a, 0, 0]); }
    const rm = rb.mesh(glowMat()); rings.add(rm); const light = k.sbox(0, 0, -1.2, 1.2, .08, 2.6, '#ffffff', { ei: 1 }); light.visible = false; let said = false;
    k.U.push((dt, t) => { const inT = onPlanet(P) && P.x > x(284.5) && P.x < x(297.5) && P.y < 2; rings.rotation.x = t * (inT ? 1.4 : .5); light.visible = inT; if (inT) { light.position.set(Math.round(P.x - .5) + .5, .02, -1.2); if (!said) { said = true; k.fact('🌀 The spinning tunnel! Everything turns round and round... the floor stays still!', 'mercurytunnel'); } } }); }
  // ---------------- G6: THE PRIZE HALL (298–320): the star board; find all six funhouse stars for a big surprise ----------------
  { const b = makeBatch(), bx = x(309); b.put(G0.box, bx, 3.2, ZB + .3, '#4a2a6a', [8, 3.4, .2]); for (let i = 0; i < 6; i++) b.put(G0.cyl, bx - 3.1 + i * 1.24, 3.2, ZB + .45, '#2a1f4a', [.5, .1, .5], [Math.PI / 2, 0, 0]);
    k.add(mesh(b, shinyMat())); for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(G0.oct, toy('#ffd23f', { em: '#ffb000', ei: .8, m: .3 })); m.scale.set(.42, .55, .15); m.position.set(bx - 3.1 + i * 1.24, 3.2, ZB + .6); m.visible = false; k.add(m); prize.push(m); }
    const trophy = new THREE.Group(); trophy.position.set(bx, 0, -2.6); trophy.visible = false; k.add(trophy); const tb = makeBatch(); tb.put(G0.cyl, 0, .4, 0, '#ffd23f', [.8, .8, .8]); tb.put(G0.cone, 0, 1.6, 0, '#ffd23f', [.9, 1.6, .9], [Math.PI, 0, 0]); tb.put(G0.ball, 0, 2.6, 0, '#ff4f9a', .45); trophy.add(mesh(tb, shinyMat()));
    G.funhouse = { stars, trophy };
    k.tapIt(trophy, () => { k.api.burst(bx, 3, -2.6, RB, 30, 3); S.chime(); }, bx, null); }
  // ---------------- getting between floors: LIFT A (ground ↔ floor 2), LIFT B (ground ↔ floor 3), the STAIRS (floor 2 ↔ 3) ----------------
  const lift = (lx, y1, c, id) => { const car = new THREE.Group(); car.position.set(x(lx), 0, -2.6); k.add(car); const cb = makeBatch(); cb.put(G0.cyl, 0, .1, 0, c, [1.1, .2, 1.1]); for (let i = 0; i < 4; i++) cb.put(G0.cyl, Math.cos(i * 1.57) * 1, 1.3, Math.sin(i * 1.57) * 1, '#ffffff', [.05, 2.4, .05]); cb.put(G0.cyl, 0, 2.5, 0, c, [1.1, .1, 1.1]); car.add(mesh(cb, shinyMat()));
    const shaft = new THREE.Mesh(painted(new THREE.CylinderGeometry(1.25, 1.25, y1 + 3, 16, 1, true), '#d8f0ff'), glass(.18)); shaft.position.set(x(lx), (y1 + 3) / 2, -2.6); k.add(shaft);
    const go = () => { if (P.ride || !onPlanet(P) || Math.abs(P.x - x(lx)) > 3.5) return; const up = P.y < y1 / 2, from = up ? 0 : y1, to = up ? y1 : 0; if (Math.abs(P.y - from) > 1.2) return; S.chime(); k.say(up ? '🛗 Going up!' : '🛗 Going down!', true); k.disc(id);
      rideTo(k, 'mlift', (R, dt) => { const f = Math.min(1, R.t / 2.6), e = f * f * (3 - 2 * f); car.position.y = from + (to - from) * e; P.x = x(lx); P.z = -2.6; P.y = car.position.y + .2; return f >= 1; }, () => { P.y = to; P.z = 0; P.x = x(lx) + 1.8; P.grounded = true; }); };
    k.tapIt(car, go, x(lx), id); k.tapIt(shaft, go); G.interact.push({ x: x(lx), y: y1, layer: 'space', disc: id + 'top', run: go, hintY: 2.4 });
    k.U.push(() => { if (!P.ride || P.ride.type !== 'mlift') { const want = Math.abs(P.y - y1) < 1 && Math.abs(P.x - x(lx)) < 6 ? y1 : 0; car.position.y += (want - car.position.y) * .05; } }); };
  lift(BX0 + 3.5, F2, '#5aa8ff', 'mercurylift2'); lift(BX1 - 5, F3, '#ff4f9a', 'mercurylift3');
  { const sx0 = 240, b = makeBatch(); for (let i = 0; i < 12; i++) b.put(G0.box, x(sx0 + i * .6 + .3), F2 + (i + 1) * .54 / 2, -3.9, RB[i % 7], [.6, (i + 1) * .54, 1]); k.add(mesh(b, shinyMat()));
    const go = () => { if (P.ride || !onPlanet(P) || P.x < x(sx0 - 4) || P.x > x(sx0 + 10)) return; const up = Math.abs(P.y - F2) < .8, dn = Math.abs(P.y - F3) < .8; if (!up && !dn) return; k.disc('mercurystairs', '🪜 One tap and you go up or down the rainbow stairs!');
      rideTo(k, 'mstairs', (R) => { const f = Math.min(1, R.t / 2.4), g = up ? f : 1 - f; P.x = x(sx0 + g * 7.2); P.y = F2 + Math.min(F3 - F2, Math.ceil(g * 12) * .54); P.z = -3.9 * Math.min(1, R.t * 3) * (f < .97 ? 1 : 0); P.facing = up ? 1 : -1; return f >= 1; }, () => { P.y = up ? F3 : F2; P.x = x(up ? sx0 + 7.6 : sx0 - .6); P.z = 0; P.grounded = true; }); };
    G.interact.push({ x: x(sx0 + 3), y: F2, layer: 'space', disc: 'mercurystairsup', run: go, hintY: 2.4 }, { x: x(sx0 + 3), y: F3, layer: 'space', disc: 'mercurystairsdown', run: go, hintY: 2.4 });
    const tapper = new THREE.Mesh(new THREE.BoxGeometry(7.4, F3 - F2 + 1, 1.2), new THREE.MeshBasicMaterial({ visible: false })); tapper.position.set(x(sx0 + 3.6), (F2 + F3) / 2, -3.9); k.add(tapper); k.tapIt(tapper, go); }
  // ---------------- F2a: FIND THE REAL DOOR (226–240): a picture shows which door; the right one opens to a secret slide ----------------
  { const pics = ['star', 'heart', 'moon'], cols = ['#ffd23f', '#ff4f6a', '#9fd8ff'], doors = [], sym = (b, kind, px, py, pz, s = 1) => { if (kind === 'star') b.put(G0.oct, px, py, pz, cols[0], [.45 * s, .6 * s, .12]); else if (kind === 'heart') b.put(G0.heart, px, py, pz - .07, cols[1], .55 * s); else { b.put(G0.ball, px, py, pz, cols[2], [.5 * s, .5 * s, .1]); b.put(G0.ball, px + .22 * s, py + .1 * s, pz + .02, '#e8e0ff', [.42 * s, .45 * s, .1]); } };
    pics.forEach((p, i) => { const dx = x(229.5 + i * 3.6), piv = new THREE.Group(); piv.position.set(dx - .8, F2, ZB + .45); k.add(piv); const db = makeBatch(); db.put(G0.box, .8, 1.5, 0, ['#9b6cff', '#5aa8ff', '#7fe0a0'][i], [1.6, 3, .15]); db.put(G0.ball, 1.4, 1.5, .1, '#ffd23f', .1);
      sym(db, p, .8, 2.3, .1); piv.add(mesh(db, shinyMat())); doors.push({ piv, kind: p, open: 0, wob: 0 }); });
    const card = new THREE.Group(); card.position.set(x(233.1), F2 + 4.6, ZB + .5); k.add(card); const cards = pics.map(p => { const cb = makeBatch(); cb.put(G0.box, 0, 0, -.05, '#ffffff', [1.6, 1.4, .08]); sym(cb, p, 0, 0, .05, 1.4); const m = mesh(cb, shinyMat()); m.visible = false; card.add(m); return m; });
    let want = 0, started = false, solved = false; const secretStar = addStar(233.1, F2 + 1.2, true);
    const pick = () => { want = Math.floor(Math.random() * 3); cards.forEach((m, i) => { m.visible = i === want; }); k.say(`🚪 Find the door with the ${pics[want]}!`, true); };
    doors.forEach((d, i) => k.tapIt(d.piv, () => { if (!near(P, d.piv.position.x + .8, F2, 8, 2)) return; if (!started) { started = true; pick(); return; }
      if (i === want) { d.open = 1; S.chime(); k.api.burst(d.piv.position.x + .8, F2 + 1.6, ZB + 1, RB, 24, 2.4); k.disc('mercuryrealdoor', '🚪 You found the real door!');
        if (!solved) { solved = true; secretStar.m.visible = true; secretStar.hidden = false; k.say('🚪 The real door! And look: a funhouse star!', true); } setTimeout(() => { d.open = 0; pick(); }, 3500); }
      else { d.wob = 1; S.boing(); k.say('🚪 Boing! That one is painted on the wall! Try another door!', true); } }));
    G.interact.push({ x: x(233), y: F2, layer: 'space', disc: 'mercurydoorgame', run: () => doors[1].piv.children[0].userData.tap(), hintY: 2.4 });
    k.U.push((dt, t) => { for (const d of doors) { d.piv.rotation.y += ((d.open ? -1.7 : 0) - d.piv.rotation.y) * Math.min(1, dt * 5); d.wob = Math.max(0, d.wob - dt * 2); d.piv.rotation.z = Math.sin(t * 25) * .06 * d.wob; } card.rotation.y = Math.sin(t * 1.5) * .15; }); }
  // ---------------- F2b: THE GIANT-AND-TINY ROOM (244–262): walk right and you grow into a giant; left and you shrink ----------------
  { const a = 244, c = 262, b = makeBatch(); for (let i = 0; i < 9; i++) b.put(G0.box, x(a + 1 + i * 2), F2 + .02, -2.5, i % 2 ? '#2a1f4a' : '#ffe3f1', [2, .04, 5 - i * .3]);
    b.put(G0.box, x(a + 6), F2 + 1.2, ZB + .8, '#ff9a2e', [2.4, 2.4, .8]); b.put(G0.box, x(a + 6), F2 + 2.6, ZB + .8, '#ffffff', [1.6, .4, .6]);       // a GIANT chair at the tiny end
    b.put(G0.box, x(c - 2), F2 + .3, ZB + .8, '#ff9a2e', [.6, .6, .3]); b.put(G0.box, x(c - 2), F2 + .65, ZB + .8, '#ffffff', [.4, .1, .2]);          // a TINY chair at the giant end
    b.put(G0.ball, x(a + 9), F2 + 1, ZB + 1, '#5aa8ff', 1); b.put(G0.ball, x(c - 5), F2 + .25, ZB + 1, '#5aa8ff', .25); k.add(mesh(b, shinyMat())); let said = false;
    k.U.push(() => { const inR = onPlanet(P) && !P.ride && Math.abs(P.y - F2) < 1.5 && P.x > x(a) && P.x < x(c); if (!inR) { if (P.sizeMul && P.sizeMul !== 1 && !P.sizeHold) P.sizeMul = 1; return; }
      P.sizeMul = .55 + (P.x - x(a)) / (c - a) * 1.25; if (!said) { said = true; k.fact('🔍 The giant-and-tiny room! Walk this way and you grow into a giant... walk back and you shrink!', 'mercurygiant'); } }); }
  // ---------------- F2c: THE UPSIDE-DOWN ROOM (262–280): the furniture is on the ceiling! Tap it and it flips ----------------
  { const room = new THREE.Group(); room.position.set(x(271), F2 + (F3 - F2) / 2 - .2, ZB + 1.3); k.add(room); const b = makeBatch(), top = (F3 - F2) / 2 - .4;
    b.put(G0.box, -3, top - .6, 0, '#ff6fae', [1.6, 1.2, 1]); b.put(G0.box, -3, top - 1.4, -.3, '#ff6fae', [1.6, 1.2, .25]);                    // a sofa on the ceiling
    b.put(G0.cyl, 1, top - 1, 0, '#ffd23f', [1, .1, 1]); b.put(G0.cyl, 1, top - .5, 0, '#c98a4a', [.08, 1, .08]);                                 // a table
    b.put(G0.cone, 4, top - .4, 0, '#5aa8ff', [.6, .8, .6]); b.put(G0.cyl, 4, top - 1.2, 0, '#ffffff', [.05, 1, .05]); b.put(G0.ball, 4, top - 1.8, 0, '#fff3a6', .25); // a lamp standing up from the ceiling
    b.put(G0.box, 0, -top + .1, -.5, '#2a1f4a', [9, .1, 1.6]); room.add(mesh(b, shinyMat())); let flip = 0, want = 0;
    k.U.push(dt => { flip += (want - flip) * Math.min(1, dt * 3); room.rotation.z = flip * Math.PI; });
    k.tapIt(room, () => { want = want ? 0 : 1; S.whoosh(); k.fact(want ? '🙃 Flip! Now everything is the right way up!' : '🙃 The upside-down room! Everything is on the ceiling!', 'mercuryupside'); }, x(271), null);
    G.interact.push({ x: x(271), y: F2, layer: 'space', disc: 'mercuryupsidedown', run: () => room.children[0].userData.tap(), hintY: 2.4 }); }
  // ---------------- F2d: THE LIGHT GAME (280–300): four giant buttons and lamps. Copy the lights the lamps show ----------------
  { const cols = ['#ff4f6a', '#ffd23f', '#5aa8ff', '#7fe0a0'], notes = [330, 392, 494, 587], lamps = [], btns = [], x0 = 284;
    const lb = makeBatch(); // (build 138: the four lamp cords in one mesh, not four)
    cols.forEach((c, i) => { const lx = x(x0 + i * 3.6); lb.put(G0.cyl, lx, F2 + 4.4, ZB + .7, '#ffffff', [.08, 2, .08]); if (i === cols.length - 1) k.add(mesh(lb, shinyMat()));
      const lamp = new THREE.Mesh(G0.ball, toy(c, { em: c, ei: .05 })); lamp.position.set(lx, F2 + 3.2, ZB + .8); lamp.scale.setScalar(.6); k.add(lamp); lamps.push(lamp);
      const bt = new THREE.Group(); bt.position.set(lx, F2, -2.2); k.add(bt); const bb = makeBatch(); bb.put(G0.cyl, 0, .2, 0, '#ffffff', [.85, .4, .85]); bb.put(G0.cyl, 0, .48, 0, c, [.7, .16, .7]); bt.add(mesh(bb, shinyMat())); btns.push(bt); });
    let seq = [], pos = 0, show = -1, showT = 0, lit = [0, 0, 0, 0], round = 0, done = false; const reward = addStar(x0 + 5.4, F2 + 4.6, true);
    const flash = i => { lit[i] = 1; S.tone(notes[i], .3, 'triangle', .07, 1); };
    const start = () => { round++; seq = []; for (let n = 0; n < Math.min(4, 1 + round); n++) seq.push(Math.floor(Math.random() * 4)); pos = 0; show = 0; showT = .6; k.say('💡 Watch the lights... then press the same buttons!', true); };
    btns.forEach((bt, i) => k.tapIt(bt, () => { if (!near(P, bt.position.x, F2, 10, 2)) return; flash(i); bt.position.y = F2 - .15; setTimeout(() => { bt.position.y = F2; }, 180);
      if (show >= 0) return; if (!seq.length) { start(); return; }
      if (i === seq[pos]) { pos++; if (pos === seq.length) { S.chime(); k.api.burst(x(x0 + 5.4), F2 + 3, -2, RB, 26, 2.6); k.disc('mercurylights', '💡 The light game: copy the lights!');
          if (!done && round >= 2) { done = true; reward.m.visible = true; reward.hidden = false; k.say('💡 You did it! A funhouse star appeared!', true); } else k.say('💡 Yes! Now a longer one...', true); setTimeout(start, 1500); } }
      else { S.boing(); k.say('💡 Oops! Watch again...', true); pos = 0; show = 0; showT = .8; } }));
    G.interact.push({ x: x(x0 + 5.4), y: F2, layer: 'space', disc: 'mercurylightgame', run: () => { if (!seq.length) start(); }, hintY: 2.4 });
    G.funhouseLights = { get seq() { return seq; }, get showing() { return show >= 0; }, press: i => btns[i].children[0].userData.tap() };
    k.U.push(dt => { for (let i = 0; i < 4; i++) { lit[i] = Math.max(0, lit[i] - dt * 2.2); lamps[i].material.emissiveIntensity = .05 + lit[i] * 1.6; lamps[i].scale.setScalar(.6 + lit[i] * .15); }
      if (show >= 0 && (showT -= dt) <= 0) { if (show < seq.length) { flash(seq[show]); show++; showT = .75; } else show = -1; } }); }
  // ---------------- F2e: THE SHAPE GAME (300–318): a shape floats up; tap the hole with the same shape ----------------
  { const kinds = ['ball', 'box', 'tri'], cols = ['#ff4f6a', '#5aa8ff', '#ffd23f'], holes = [], x0 = 304, geoOf = { ball: G0.ball, box: G0.box, tri: G0.tri };
    const fl = new THREE.Group(); fl.position.set(x(x0 + 3.6), F2 + 3, -2.4); k.add(fl); const shapes = kinds.map((s, i) => { const m = new THREE.Mesh(geoOf[s], toy(cols[i], { r: .3, cc: .6 })); m.scale.setScalar(s === 'tri' ? .5 : .45); if (s === 'tri') m.rotation.x = Math.PI / 2; m.visible = false; fl.add(m); return m; });
    kinds.forEach((s, i) => { const h = new THREE.Group(); h.position.set(x(x0 + i * 3.6), F2, -2.6); k.add(h); const hb = makeBatch(); hb.put(G0.box, 0, .6, 0, '#ffffff', [1.6, 1.2, 1.2]);
      if (s === 'ball') hb.put(G0.cyl, 0, 1.21, 0, '#2a1f4a', [.45, .02, .45]); else if (s === 'box') hb.put(G0.box, 0, 1.21, 0, '#2a1f4a', [.8, .02, .8]); else hb.put(G0.tri, 0, 1.21, 0, '#2a1f4a', [.5, .02, .5]); h.add(mesh(hb, shinyMat())); holes.push(h); });
    let want = -1, wob = 0, got = 0;
    const next = () => { let n; do { n = Math.floor(Math.random() * 3); } while (n === want); want = n; shapes.forEach((m, i) => { m.visible = i === n; }); fl.position.y = F2 + 1.4; k.say('🔺 Where does this shape go? Tap its hole!', true); };
    holes.forEach((h, i) => k.tapIt(h, () => { if (!near(P, h.position.x, F2, 10, 2)) return; if (want < 0) { next(); return; }
      if (i === want) { got++; S.chime(); k.api.burst(h.position.x, F2 + 1.6, -2.4, [cols[i], '#ffffff'], 18, 2); k.disc('mercuryshapes', '🔺 The shape game: put the shape in its hole!'); setTimeout(next, 1000); } else { wob = 1; S.boing(); k.say('🔺 Hmm, that hole is a different shape. Try another!', true); } }));
    G.interact.push({ x: x(x0 + 3.6), y: F2, layer: 'space', disc: 'mercuryshapegame', run: () => holes[0].children[0].userData.tap(), hintY: 2.4 });
    G.funhouseShapes = { get want() { return want; }, tap: i => holes[i].children[0].userData.tap() };
    k.U.push((dt, t) => { if (!near(P, x(x0 + 3.6), F2, 20, 6)) return; fl.position.y += (F2 + 3 - fl.position.y) * Math.min(1, dt * 2); fl.rotation.y = t; wob = Math.max(0, wob - dt * 2); fl.rotation.z = Math.sin(t * 20) * .3 * wob; }); }
  // ---------------- F3a: THE ENDLESS CORRIDOR (240–256): arches going back and back and back (really they get smaller) ----------------
  { const b = makeBatch(), gb = makeBatch(); for (let n = 0; n < 9; n++) { const s = Math.pow(.78, n), z = ZB - 1 - n * 3.2 * s * 1.3, cx = x(248), y0 = F3; b.put(G0.box, cx - 3.5 * s, y0 + 2.6 * s, z, n % 2 ? '#ff4f9a' : '#ffffff', [.5 * s, 5.2 * s, .4 * s]); b.put(G0.box, cx + 3.5 * s, y0 + 2.6 * s, z, n % 2 ? '#ff4f9a' : '#ffffff', [.5 * s, 5.2 * s, .4 * s]);
      gb.put(G0.torus, cx, y0 + 5.2 * s, z, RB[n % 7], [3.5 * s, 1.6 * s, s], [0, 0, 0]); b.put(G0.box, cx, y0 - .05, z - 1.6 * s, n % 2 ? '#2a1f4a' : '#ffe3f1', [7 * s, .1, 3.2 * s * 1.3]); }
    k.add(mesh(b, shinyMat())); k.add(gb.mesh(glowMat())); addStar(248, F3 + 1.4); let said = false;
    k.U.push(() => { if (!said && near(P, x(248), F3, 6, 2)) { said = true; k.fact('🌀 The endless corridor! It looks like it goes on forever... but it is a trick: the arches just get smaller!', 'mercuryendless'); } }); }
  // ---------------- F3b: THE ROTATING MIRROR TUNNEL (256–276) ----------------
  { const tun = new THREE.Group(); tun.position.set(0, F3 + 2, -1.6); k.add(tun); const tb = makeBatch(); for (let i = 0; i < 18; i++) for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2 + i * .25; tb.put(G0.box, x(257 + i * 1.05), Math.cos(a) * 2.6, Math.sin(a) * 1.8, j % 2 ? '#dff1ff' : '#b8dcff', [.9, .08, 1.4], [a, 0, 0]); }
    const tm = new THREE.Mesh(tb.geometry(), toy('#ffffff', { r: .05, m: .5, cc: 1, em: '#bfe0ff', ei: .25 })); tun.add(tm); let said = false;
    k.U.push((dt, t) => { tun.rotation.x = t * .6; if (!said && near(P, x(266), F3, 9, 2)) { said = true; k.fact('🪞 A rotating mirror tunnel! The mirrors spin all around you!', 'mercurymirrortunnel'); } }); }
  // ---------------- F3c: THE HIDDEN MIRROR DOOR (276–300): four mirrors... one sparkles. Tap it: a secret room! ----------------
  { const mirrors = [], mMat = toy('#eef8ff', { r: .04, m: .15, cc: 1, em: '#bfe0ff', ei: .35 }); let secret = 2, opened = false;
    for (let i = 0; i < 4; i++) { const piv = new THREE.Group(); piv.position.set(x(279 + i * 4.5) - .9, F3, ZB + .5); k.add(piv); const fb = makeBatch(); fb.put(G0.box, .9, 1.7, -.05, '#ffd23f', [2, 3.6, .12]); piv.add(mesh(fb, shinyMat()));
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.2), mMat); gl.position.set(.9, 1.7, .02); piv.add(gl); mirrors.push(piv); }
    const room = makeBatch(); room.put(G0.box, x(288), F3 + 2, ZB - 2.5, '#9b6cff', [4, 4, .2]); room.put(G0.box, x(288), F3 - .05, ZB - 1.3, '#ffd23f', [4, .1, 2.6]); for (let i = 0; i < 8; i++) room.put(G0.lo, x(286.4 + (i % 4)), F3 + .3 + Math.floor(i / 4) * .4, ZB - 2, RB[i % 7], .2); k.add(mesh(room, shinyMat()));
    const sStar = addStar(288, F3 + 1.6, true); sStar.m.position.z = ZB - 1.5; let sp = 0, open = 0;
    k.U.push((dt, t) => { if (opened) { open = Math.min(1, open + dt * 1.5); mirrors[secret].rotation.y = -open * 1.8; } else if (near(P, mirrors[secret].position.x + .9, F3, 10, 2) && (sp -= dt) < 0) { sp = .5; const m = mirrors[secret]; k.api.burst(m.position.x + .9 + (Math.random() - .5) * 1.4, F3 + 1 + Math.random() * 2, ZB + .7, ['#ffffff', '#ffd23f'], 1, .5); } });
    mirrors.forEach((m, i) => k.tapIt(m, () => { if (!near(P, m.position.x + .9, F3, 10, 2)) return; if (i !== secret) { S.boing(); k.say('🪞 Just a mirror... Hello, you! Look for the one that sparkles!', true); return; }
      if (opened) return; opened = true; sStar.m.visible = true; sStar.hidden = false; S.twinkle(); k.api.burst(m.position.x + .9, F3 + 2, ZB, RB, 30, 2.8); k.fact('✨ A secret door! A hidden room behind the mirror, with a funhouse star inside!', 'mercurysecret'); }));
    G.interact.push({ x: x(288), y: F3, layer: 'space', disc: 'mercurysecretdoor', run: () => mirrors[secret].children[0].userData.tap(), hintY: 2.4 }); }
  // ---------------- F3d → ground: THE BIG TOP SLIDE, a giant spiral slide round the right-hand tower ----------------
  { const cx = x(BX1 + 2), cz = -3, r = 3.4, pts = [V3(x(309.5), F3 + .5, -1.2), V3(x(312.5), F3 + .3, -1.2)];
    for (let i = 0; i <= 44; i++) { const a = Math.PI + i / 44 * Math.PI * 5, rr = r; pts.push(V3(cx + Math.cos(a) * rr, F3 - .4 - i / 44 * 11.8, cz + Math.sin(a) * rr)); }
    pts.push(V3(cx - 2.6, .9, .4), V3(cx - 5, .75, .2));
    const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .3), segs = 300, geo = new THREE.TubeGeometry(path, segs, .9, 12, false), c = new THREE.Color(), cs = [];
    for (let i = 0; i <= segs; i++) { c.set(RB[Math.floor(i / segs * 21) % 7]); for (let j = 0; j < 13; j++) cs.push(c.r, c.g, c.b); } geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    const tube = new THREE.Mesh(geo, glass(.5)); tube.renderOrder = 2; k.add(tube);
    const go = () => { if (P.ride || !onPlanet(P) || Math.abs(P.y - F3) > 1 || P.x < x(306)) return false; P.x = x(309.5); P.y = F3; k.G.startSlide(path, { vmax: 11, acc: 6 }); k.say('🎪 The Big Top Slide! Wheeeee!', true); k.disc('mercurybigtop'); return true; };
    let cool = 0; k.U.push(dt => { cool = Math.max(0, cool - dt); if (!cool && onPlanet(P) && !P.ride && P.grounded && Math.abs(P.y - F3) < .1 && P.x > x(311.4) && P.vx > .5 && go()) cool = 2; });
    k.tapIt(tube, go); G.interact.push({ x: x(310), y: F3, layer: 'space', disc: 'mercurybigtopgo', run: go, hintY: 2.4 }); G.funhouseSlide = path; }
  // ---------------- (build 80) THE CRAWL TUNNEL (ground, 300–306): a low rainbow tunnel; she crawls through, the lights follow her ----------------
  { const a = 300.5, c = 306, tb = makeBatch(), lb = makeBatch(); for (let i = 0; i <= 8; i++) tb.put(G0.torus, x(a + i * (c - a) / 8), .1, -1.2, RB[i % 7], [1.05, 1.05, 2.2], [0, Math.PI / 2, 0]);
    tb.put(G0.box, x((a + c) / 2), 1.25, -1.2, '#c9a6ff', [c - a, .12, 2.4]); k.add(mesh(tb, shinyMat()));
    for (let i = 0; i < 10; i++) lb.put(G0.lo, x(a + .3 + i * .55), 1.05, -.2, RB[i % 7], .12); const lights = lb.mesh(glowMat()); k.add(lights);
    let inside = false, done = false; G.crawlZone = Q => Q.x > x(a) && Q.x < x(c) && Q.y < 1;
    k.U.push((dt, t) => { const now = onPlanet(P) && G.crawlZone(P); if (now && !inside) k.say('🐛 A tiny tunnel! Crawl through!', false); inside = now; lights.position.y = now ? Math.sin(t * 8) * .05 : 0;
      if (now && !done && P.x > x(c) - .8) { done = true; S.giggle(); k.api.burst(P.x + .5, 1, -1, RB, 26, 2.4); k.fact('🎉 You crawled all the way through the tiny tunnel!', 'mercurycrawl'); } if (!now && P.x < x(a) - 2) done = false; }); }
  // the star hunt: walk into a star to collect it; it flies to its place on the prize board
  let got = 0;
  k.U.push((dt, t) => { for (const s of stars) { if (s.got || s.hidden) continue; s.m.rotation.y = t * 2; s.m.position.y = s.y + Math.sin(t * 2 + s.x) * .15;
    if (onPlanet(P) && Math.abs(P.x - s.x) < .9 && Math.abs(P.y + .6 - s.y) < 1.3) { s.got = true; s.m.visible = false; prize[got] && (prize[got].visible = true); got++; S.tone(520 + got * 80, .2, 'sine', .07, 1.5); k.api.burst(s.x, s.y, -1, ['#ffd23f', '#ffffff'], 16, 2);
      if (got === stars.length) { S.chime(); G.funhouse.trophy.visible = true; k.api.burst(x(309), 4, -2.6, RB, 50, 3.4); k.fact('🏆 You found ALL SIX funhouse stars! You are a funhouse champion!', 'mercurychampion'); }
      else k.say(`⭐ A funhouse star! ${got} of ${stars.length}!`, true); } } });
}

// ===================================================================
// (build 74) THE MIRROR MAZE GROWS (area 2, beside the build 67 hall: x0 = X + 124 … x1 = X + 200):
//   • coloured light that changes in each section;
//   • the UPPER MIRROR GALLERY (4.6 m), a second route over the mirror doors (one tap: up the mirror stairs);
//   • the LIGHT-BEAM PUZZLE up there: tap the three mirrors to turn them; when all three point the right way, a beam of
//     light shines through them, the crystal lights up, and a HIDDEN MIRROR DOOR below slides open: a treasure chest!
//   • a path of lights from the maze to the carnival funhouse.
// ===================================================================
export function mercuryMazePlus(k) {
  const P = k.P, G = k.G, S = k.Sound, X = k.X, x0 = X + 124, G0 = GEO(), gb = makeBatch(), b = makeBatch(), GY = 4.6;
  // coloured light per section (top strip and floor edge)
  [[0, 18, '#ff6fd8'], [18, 39, '#62f0ff'], [39, 60, '#7dffb0'], [60, 76, '#ffd23f']].forEach(([a, c, cl]) => { gb.put(G0.box, x0 + (a + c) / 2, 5.45, -4.15, cl, [c - a - .4, .18, .1]); gb.put(G0.box, x0 + (a + c) / 2, .03, .08, cl, [c - a - .4, .04, .16]); });
  // the upper gallery: a mirrored walkway over the doors, with a railing
  b.put(G0.box, x0 + 39, GY - .15, -1.6, '#e8e0ff', [38, .3, 2.6]); k.plat(x0 + 20, x0 + 58, GY, { z: -1.2 });
  for (let gx = x0 + 20.5; gx < x0 + 58; gx += 2) b.put(G0.cyl, gx, GY + .45, -.35, '#ffd23f', [.04, .9, .04]); b.put(G0.box, x0 + 39, GY + .9, -.35, '#ffd23f', [38, .06, .06]);
  for (const sx of [x0 + 21, x0 + 57]) b.put(G0.cyl, sx, GY / 2, -2.8, '#ff9fd2', [.18, GY, .18]);
  // the mirror stairs (one tap: up or down)
  for (let i = 0; i < 8; i++) b.put(G0.box, x0 + 19 + i * .8, (i + 1) * GY / 16, -3.4, i % 2 ? '#dff1ff' : '#b8dcff', [.8, (i + 1) * GY / 8, 1]);
  const stairs = new THREE.Mesh(new THREE.BoxGeometry(6.6, GY, 1.4), new THREE.MeshBasicMaterial({ visible: false })); stairs.position.set(x0 + 22.2, GY / 2, -3.4); k.add(stairs);
  const climb = () => { if (P.ride || !onPlanet(P) || P.x < x0 + 13 || P.x > x0 + 30) return; const up = P.y < 1; if (!up && Math.abs(P.y - GY) > 1) return; k.disc('mercurygallery', '🪞 Up the mirror stairs to the gallery!');
    rideTo(k, 'mstairs2', R => { const f = Math.min(1, R.t / 2.2), g = up ? f : 1 - f; P.x = x0 + 18.6 + g * 6.8; P.y = Math.min(GY, Math.ceil(g * 8) * GY / 8); P.z = -3.4 * Math.min(1, R.t * 3) * (f < .97 ? 1 : 0); P.facing = up ? 1 : -1; return f >= 1; }, () => { P.y = up ? GY : 0; P.x = up ? x0 + 26 : x0 + 17.6; P.z = 0; P.grounded = true; }); };
  k.tapIt(stairs, climb, x0 + 20, 'mercurygalleryup'); G.interact.push({ x: x0 + 26, y: GY, layer: 'space', disc: 'mercurygallerydown', run: climb, hintY: 2.4 });
  // the light-beam puzzle: three turning mirrors (each tap turns 90°); all three at position 1 = solved
  const goal = 1, turn = [0, 2, 3], mirrors = [28, 38, 48].map((mx, i) => { const piv = new THREE.Group(); piv.position.set(x0 + mx, GY, -2.7); k.add(piv); const mb = makeBatch(); mb.put(G0.cyl, 0, .5, 0, '#ffd23f', [.5, .14, .5]); mb.put(G0.box, 0, 1.3, 0, '#ffd23f', [1.5, 1.5, .12]); mb.put(G0.box, 0, 1.3, .07, '#e6f4ff', [1.3, 1.3, .02]); piv.add(mb.mesh(shinyMat())); /* (frame and glass: one mesh) */ piv.rotation.y = turn[i] * Math.PI / 2; return piv; });
  const beam = makeBatch(); for (const [a, c] of [[20.5, 28], [28, 38], [38, 48], [48, 56]]) beam.put(G0.box, x0 + (a + c) / 2, GY + 1.3, -2.7, '#fff3a6', [c - a, .12, .12]); const beamM = beam.mesh(glowMat()); beamM.visible = false; k.add(beamM);
  gb.put(G0.oct, x0 + 56.5, GY + 1.3, -2.7, '#9fe6ff', [.4, .7, .4]); const crystal = new THREE.Mesh(G0.oct, toy('#ffffff', { em: '#9fe6ff', ei: 1.6 })); crystal.scale.set(.5, .85, .5); crystal.position.set(x0 + 56.5, GY + 1.3, -2.7); crystal.visible = false; k.add(crystal); /* (the bright one appears when solved) */
  let solved = false, open = 0, said = false;
  mirrors.forEach((piv, i) => k.tapIt(piv, () => { if (!onPlanet(P) || Math.abs(P.y - GY) > 1.5 || solved) return; turn[i] = (turn[i] + 1) % 4; S.tone(500 + turn[i] * 90, .12, 'triangle', .06, 1);
    if (!said) { said = true; k.say('🔦 Turn the mirrors so the light can shine all the way to the crystal!', true); }
    if (turn.every(t => t === goal)) { solved = true; beamM.visible = true; crystal.visible = true; chest.visible = true; S.twinkle(); k.fact('✨ The light shines through all the mirrors! Look down: a hidden mirror door is opening!', 'mercurybeam'); } }));
  G.interact.push({ x: x0 + 38, y: GY, layer: 'space', disc: 'mercurybeampuzzle', run: () => k.say('🔦 Tap the mirrors to turn them, until the light shines to the crystal!', true), hintY: 2.4 });
  G.mazePlus = { turn: i => mirrors[i].children[0].userData.tap(), get solved() { return solved; }, get turns() { return [...turn]; } };
  // the hidden mirror door (ground level, in the back wall) and its treasure chest
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.6, .12), toy('#eef8ff', { r: .04, m: .15, cc: 1, em: '#bfe0ff', ei: .35 })); door.position.set(x0 + 66, 1.8, -4.15); k.add(door);
  const chest = new THREE.Group(); chest.position.set(x0 + 66, 0, -4.6); chest.visible = false; k.add(chest); { const cb = makeBatch(); cb.put(G0.box, 0, .35, 0, '#b8742e', [1.2, .7, .8]); cb.put(G0.box, 0, .8, 0, '#c98a4a', [1.2, .25, .8]); cb.put(G0.box, 0, .5, .41, '#ffd23f', [.2, .3, .04]); chest.add(mesh(cb, shinyMat())); }
  let found = false;
  k.U.push((dt, t) => { mirrors.forEach((piv, i) => { piv.rotation.y += (turn[i] * Math.PI / 2 - piv.rotation.y) * Math.min(1, dt * 6); }); crystal.rotation.y = t;
    if (solved && open < 1) { open = Math.min(1, open + dt * .6); door.position.x = x0 + 66 + open * 2.6; chest.position.z = -4.6 + open * 2.4; if (open >= 1) door.visible = false; }
    if (open >= 1 && !found && onPlanet(P) && Math.abs(P.x - (x0 + 66)) < 1.5 && P.y < 1.5) { found = true; S.chime(); k.api.burst(x0 + 66, 1.4, -2.2, ['#ffd23f', '#ffffff', '#ff6fd8'], 34, 2.8); k.fact('💎 The hidden mirror door! You found the maze treasure!', 'mercurymazetreasure'); } });
  // the path of lights from the maze to the funhouse (x 200 → 224)
  for (let i = 0; i < 12; i++) { const px = X + 201 + i * 2; gb.put(G0.cone, px, .06, .6, RB[i % 7], [.35, .08, .25], [0, 0, -Math.PI / 2]); gb.put(G0.lo, px, 3.2 + Math.sin(i * .8) * .3, -1.8, RB[(i + 3) % 7], .18); }
  k.add(mesh(b, shinyMat(), true)); k.add(gb.mesh(glowMat()));
}

// =================== (build 99) MERCURY MIRROR MAZE: TWO ROTATING MIRROR WALLS on the ground route ===================
// Big mirror walls that turn slowly round and round. While a wall faces you it is closed (you cannot walk through); when
// it turns side-on there is a gap: walk through! (No timer, no losing: it opens again every few seconds.)
export function mercuryRotatingWalls(k) {
  const P = k.P, G = k.G, S = k.Sound, X = k.X, x0 = X + 124, G0 = GEO(), walls = [];
  for (const [i, dx] of [[0, 33], [1, 48.5]]) { const wx = x0 + dx, piv = new THREE.Group(); piv.position.set(wx, 0, -1.2); piv.userData.dynamic = true; k.add(piv);
    const b = makeBatch(); b.put(G0.box, 0, 1.9, 0, '#ffd23f', [.2, 3.8, 3.2]); b.put(G0.box, .12, 1.9, 0, '#dff1ff', [.04, 3.4, 2.8]); b.put(G0.box, -.12, 1.9, 0, '#dff1ff', [.04, 3.4, 2.8]);
    b.put(G0.cyl, 0, 1.9, 0, '#ff9fd2', [.12, 4.2, .12]); b.put(G0.ball, 0, 4.15, 0, ['#ff6fd8', '#62f0ff'][i], .3); piv.add(b.mesh(shinyMat()));
    for (const o of G.solids.filter(s => s.key === 'mercrot' + i)) G.solids.splice(G.solids.indexOf(o), 1);
    walls.push({ piv, wx, solid: { a: wx - .35, b: wx + .35, top: 4.2, layer: 'space', key: 'mercrot' + i }, closed: false, passed: false, i }); }
  let hinted = 0, px = null;
  k.U.push((dt, t) => { const x0p = px ?? P.x; px = P.x; for (const w of walls) { const th = t * .7 + w.i * 1.3; w.piv.rotation.y = th; const closed = Math.abs(Math.cos(th)) > .7;
      if (closed !== w.closed) { w.closed = closed; const j = G.solids.indexOf(w.solid); if (closed && j < 0) G.solids.push(w.solid); else if (!closed && j >= 0) G.solids.splice(j, 1); }
      if (P.layer === 'space' && !w.passed && P.y < 2 && x0p <= w.wx + .6 && P.x > w.wx + .6 && P.x - x0p < 3) { /* (walked through it from the left this frame, not teleported past) */ w.passed = true; S.tone(660 + w.i * 120, .2, 'sine', .06, 1.5); k.api.burst(w.wx, 2, -1, ['#dff1ff', '#ffffff', '#ff6fd8'], 10, 1.6); if (walls.every(q => q.passed)) k.disc('mercuryrotwalls', '🪞 You got past the turning mirror walls!'); }
      if (closed && P.layer === 'space' && P.y < 2 && Math.abs(P.x - (w.wx - .8)) < .6 && t - hinted > 8) { hinted = t; k.say('🪞 The mirror is turning... wait for the gap, then walk through!', true); } } });
  G.mazeRot = walls;
}
