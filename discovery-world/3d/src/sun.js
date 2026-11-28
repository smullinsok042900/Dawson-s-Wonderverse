// ===================================================================
// sun.js (build 126): THE SUN, a new rocket destination. The real Sun is a giant ball of super hot glowing gas with no
// ground at all, so here (clearly made-up, and the voice says so) magic golden platforms float safely high above its
// glowing surface. The place is 330 m long like the big planets: the landing area (space.js builds its ground, sky,
// prominences and Sunnies) and two areas built when she walks near them:
//   area 2: SUNSPOT BOUNCE PARK (giant sunspot trampolines, floating platforms, a secret bounce cloud, a twisty slide)
//           and the SOLAR FLARE COASTER (lift hill, big drop, a loop through a flare arch, a hill and home)
//   area 3: the SOLAR FLARE LAUNCH TOWER (gentle or BLAST mode; ▲ ▼ while riding), SOLAR WIND SURFING (a hoverboard
//           on two glowing wind streams: ▲ ▼ change stream, stars and rings to collect, the streams split and join),
//           and the SOLAR LIGHT LAB (rainbow prism, long and short shadows, a solar panel fan, ice that melts).
// Everything is pictures, sounds and the voice. Each area is a handful of meshes (batched), freed when she flies away.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, glowMat } from './spacekit.js';
import { toy } from './creatures.js';
import { buildSunCoaster } from './sun-coaster.js'; // (build 178) THE GIANT SUN COASTER

const CYL = new THREE.CylinderGeometry(1, 1, 1, 20), BALL = new THREE.SphereGeometry(1, 20, 14), BOX = new THREE.BoxGeometry(1, 1, 1);
CYL.userData.shared = BALL.userData.shared = BOX.userData.shared = true;
const GOLD = '#ffc83a', GOLD2 = '#ffb020', SPOT = '#7a2c10', RIM = '#ff8a2a';

/** a ride the place drives itself (main.js pauses walking while P.ride is set) */
function sunRide(k, type, step, done, o = {}) {
  const P = k.P, R = { type, t: 0, noExit: o.noExit ?? true, stick: true }; P.ride = R; P.vx = P.vy = 0;
  const f = dt => { if (P.ride !== R) return true; R.t += dt; if (step(R, dt)) { if (P.ride === R) { P.ride = null; P.vy = 0; P.grounded = false; } done && done(); return true; } };
  k.U.push(dt => { if (R.over) return; if (f(dt)) R.over = true; });
  return R;
}
const stick = k => (k.api.stick ? k.api.stick() : { x: 0, y: 0 });
const near = (k, x, d = 7) => k.P.layer === 'space' && !k.P.ride && Math.abs(k.P.x - x) < d;
/** a track or ribbon along a curve, as a tube */
const tube = (pts, r, seg) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 8, false);

// ---------------- area 2: SUNSPOT BOUNCE PARK + SOLAR FLARE COASTER ----------------
function bouncePark(k, X0) {
  const P = k.P, b = makeBatch();
  // six giant sunspot trampolines climbing up and back down, each on a golden pillar (nothing floats unattached)
  const PADS = [[X0 + 8, .5, 2.3], [X0 + 15, 2.6, 2.1], [X0 + 22, 4.8, 2.1], [X0 + 29, 7, 2.1], [X0 + 36, 4.8, 2.2], [X0 + 43, 2.4, 2.4]];
  for (const [x, y, r] of PADS) {
    b.put(CYL, x, y / 2, -2.2, GOLD2, [.35, y, .35]);
    b.put(CYL, x, y + .05, -1.6, RIM, [r, .22, r * .8]); b.put(CYL, x, y + .17, -1.6, SPOT, [r * .78, .06, r * .62]); b.put(CYL, x, y + .21, -1.6, '#4a1606', [r * .42, .04, r * .34]);
    k.plat(x - r * .8, x + r * .8, y + .2, { pad: true, bounce: y > 6 ? 15 : 13 });
  }
  // floating golden stepping discs between them, and a high SECRET cloud with a super trampoline and a star
  const DISCS = [[X0 + 11.5, 6.5], [X0 + 25.5, 10], [X0 + 32.5, 11.5]];
  for (const [x, y] of DISCS) { b.put(CYL, x, y, -1.4, GOLD, [1.3, .3, 1.1]); b.put(CYL, x, y - 1.2, -1.4, '#ffe9a0', [.12, 2.2, .12]); b.put(BALL, x, y - 2.4, -1.4, '#fff3c0', .35); k.plat(x - 1.3, x + 1.3, y + .15, { step: true, stepMax: .3 }); }
  const SX = X0 + 40, SY = 15; b.put(BALL, SX, SY - .6, -1.6, '#fff6d8', [3.2, 1, 2.4]); b.put(BALL, SX - 2, SY - .4, -1.4, '#fff6d8', [1.6, .8, 1.4]); b.put(BALL, SX + 2.2, SY - .5, -1.6, '#fff6d8', [1.7, .8, 1.4]);
  b.put(CYL, SX, SY + .25, -1.6, '#ff4f9a', [1.4, .18, 1.1]);
  k.plat(SX - 3, SX + 3, SY + .1, { step: true, stepMax: .4 }); k.plat(SX - 1.2, SX + 1.2, SY + .36, { pad: true, bounce: 19, onLand: () => { if (!found) { found = true; k.Sound.chime(); k.fact('🤫 A secret bounce cloud, high above the Sun! Super boing!', 'sunsecret'); } } });
  let found = false;
  const star = k.sball(SX, SY + 3.2, -1.6, .55, .55, .2, '#ffd23f', { em: '#ffb000', ei: .7 });
  // the TWISTY SLIDE back down from the tallest pad
  const slide = new THREE.CatmullRomCurve3([[X0 + 29, 7.8, -1.6], [X0 + 31, 7.2, -3.2], [X0 + 33.5, 5.8, -4.2], [X0 + 35.5, 4.4, -3.2], [X0 + 36.5, 3.2, -1.6], [X0 + 38.5, 2, -1.8], [X0 + 41, 1.1, -2.6], [X0 + 46, .6, -1.4], [X0 + 49, .6, 0]].map(p => new THREE.Vector3(...p)));
  const sg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(slide.points.map(p => p.clone().add(new THREE.Vector3(0, -.75, 0)))), 60, .55, 10, false); b.put(sg, 0, 0, 0, '#ff6fae'); sg.dispose();
  const startSlide = () => { if (P.ride) return; k.say('🛝 Wheeeee!', true); k.G.startSlide(slide, { vmax: 12, acc: 7 }); };
  k.G.interact.push({ x: X0 + 29, y: 7.2, layer: 'space', disc: 'sunslide', run: startSlide, hintY: 1.6 });
  const park = b.mesh(shinyMat()); park.castShadow = true; k.add(park);
  k.tapIt(park, () => { if (P.y > 6.5 && Math.abs(P.x - (X0 + 29)) < 3) startSlide(); else k.fact('☀️ Sunspot trampolines! Real sunspots are darker, cooler patches on the Sun, as big as the whole Earth!', 'sunspots'); }, X0 + 8, 'sunbounce');
  k.U.push((dt, t) => { star.rotation.y = t * 2; if (!star.userData.got && Math.abs(P.x - SX) < 1.2 && Math.abs(P.y - (SY + 2.6)) < 1.6) { star.userData.got = true; star.visible = false; k.Sound.chime(); k.say('⭐ You found the secret star!', true); k.disc('sunsecretstar'); } });
}

function flareCoaster(k, X0) {
  const P = k.P, b = makeBatch();
  // the course: station, lift hill, big drop, a LOOP through a flare arch, a camel hill, and home
  const pts = [[X0 + 56, 1.4, -1.4], [X0 + 60, 1.6, -1.6], [X0 + 66, 9, -2.4], [X0 + 70, 17, -3], [X0 + 73, 17.4, -3.2], [X0 + 77, 9, -3.4], [X0 + 81, 2.6, -3.6]];
  const LC = [X0 + 86, 8.4], LR = 5.6; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + i / 16 * Math.PI * 2; pts.push([LC[0] + Math.cos(a) * LR * .9 + i * .12, LC[1] + Math.sin(a) * LR, -3.8 - i * .1]); }
  pts.push([X0 + 94, 3, -5.6], [X0 + 98, 9, -5.4], [X0 + 101, 10, -4.8], [X0 + 104, 5, -3.6], [X0 + 106, 1.4, -2], [X0 + 108, 1, -.6]);
  const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  // the visible track: two glowing rails (made from the same curve, just under where she rides) and golden supports
  const N = 260, rails = [[], []], up = new THREE.Vector3(0, 1, 0), pt = new THREE.Vector3(), tg = new THREE.Vector3(), side = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { path.getPointAt(i / N, pt); path.getTangentAt(i / N, tg); side.crossVectors(tg, up).normalize(); for (const [j, s] of [[0, -.55], [1, .55]]) rails[j].push(pt.clone().addScaledVector(side, s).add(new THREE.Vector3(0, -.85, 0))); }
  for (const r of rails) { const g = tube(r, .12, 300); b.put(g, 0, 0, 0, '#ff5a1a'); g.dispose(); }
  for (let i = 0; i <= N; i += 9) { path.getPointAt(i / N, pt); if (pt.y > 2.2) b.put(CYL, pt.x, (pt.y - .9) / 2, pt.z, GOLD2, [.14, pt.y - .9, .14]); }
  // the flare arch the loop rides through, and the station
  const ag = new THREE.TorusGeometry(8, .7, 12, 44, Math.PI); b.put(ag, LC[0], 0, -6.5, '#ff9a2a'); ag.dispose();
  b.put(BOX, X0 + 58, .4, -1.6, '#ffe08a', [7, .8, 2.6]); for (const s of [-1, 1]) b.put(CYL, X0 + 58 + s * 3, 2.2, -2.6, '#ffffff', [.12, 3.6, .12]); b.put(BOX, X0 + 58, 4, -2, '#ff4f9a', [7.4, .2, 3.4]);
  const track = b.mesh(shinyMat()); track.castShadow = true; k.add(track);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(8.6, .25, 8, 44, Math.PI), new THREE.MeshBasicMaterial({ color: '#ffd060', transparent: true, opacity: .7, fog: false })); glow.position.set(LC[0], 0, -6.5); k.add(glow);
  // the car she rides in (it follows her along the track, and waits at the station)
  const cb = makeBatch(); cb.put(BOX, 0, 0, 0, '#ff4f9a', [1.6, .5, 1.1]); cb.put(BOX, -.7, .35, 0, '#ffd23f', [.2, .6, 1.1]); cb.put(CYL, .55, -.3, .5, '#333344', [.18, .12, .18], [Math.PI / 2, 0, 0]); cb.put(CYL, .55, -.3, -.5, '#333344', [.18, .12, .18], [Math.PI / 2, 0, 0]); cb.put(CYL, -.55, -.3, .5, '#333344', [.18, .12, .18], [Math.PI / 2, 0, 0]); cb.put(CYL, -.55, -.3, -.5, '#333344', [.18, .12, .18], [Math.PI / 2, 0, 0]);
  const car = cb.mesh(shinyMat()); car.userData.dynamic = true; k.add(car); const home = () => { path.getPointAt(0, pt); car.position.set(pt.x, pt.y - .55, pt.z); car.rotation.set(0, 0, 0); }; home();
  const go = () => { if (P.ride || !near(k, X0 + 58, 8)) return; k.Sound.chime(); k.say('🎢 Hold on tight! Up the lift hill... and WHOOSH!', true); k.disc('suncoaster'); k.G.startSlide(path, { vmax: 22, acc: 11 }); };
  k.tapIt(car, go, X0 + 58, 'suncoaster'); k.tapIt(track, go);
  k.U.push((dt, t) => { glow.material.opacity = .55 + Math.sin(t * 2.4) * .2;
    const R = P.ride; if (R && R.type === 'slide' && R.path === path) { path.getPointAt(Math.min(1, R.u), pt); path.getTangentAt(Math.min(1, R.u), tg); car.position.set(pt.x, pt.y - .55, pt.z); car.rotation.set(0, Math.atan2(-tg.z, tg.x), Math.asin(Math.max(-1, Math.min(1, tg.y)))); } else if (car.position.x !== path.points[0].x) home(); });
}

// ---------------- area 3: LAUNCH TOWER, SOLAR WIND SURFING, SOLAR LIGHT LAB ----------------
function launchTower(k, X0) {
  const P = k.P, b = makeBatch(), TX = X0 + 8, TOP = 26;
  b.put(CYL, TX, TOP / 2, -2.6, '#fff1c0', [.6, TOP, .6]); for (let y = 2; y < TOP; y += 2) b.put(CYL, TX, y, -2.6, y % 4 ? GOLD : RIM, [.75, .25, .75]);
  b.put(BALL, TX, TOP + .6, -2.6, '#ffd23f', .9); b.put(CYL, TX, .2, -2.6, GOLD2, [3, .4, 3]);
  const tower = b.mesh(shinyMat()); tower.castShadow = true; k.add(tower);
  const sb = makeBatch(); sb.put(CYL, 0, 0, 0, '#ff4f9a', [1.6, .35, 1.6]); sb.put(CYL, 0, .5, 1.2, '#ffd23f', [.9, .5, .25]); const seat = sb.mesh(shinyMat()); seat.position.set(TX, .4, -1.2); seat.userData.dynamic = true; k.add(seat);
  const btn = k.sball(TX + 3, .5, -1.4, .55, .45, .55, '#ff2a2a', { em: '#ff2a2a', ei: .4 });
  const ride = blast => { if (P.ride || !near(k, TX, 7)) return; k.Sound.chime(); k.disc('suntower');
    k.say(blast ? '🚀 BLAST mode! 3... 2... 1... ZOOM!' : '🗼 Up we go, gently! Hold ▲ to go faster, ▼ to come down.', true);
    let y = .4, v = 0, top = 0, bounces = 0;
    sunRide(k, 'suntower', (R, dt) => { const st = stick(k);
      if (blast) { if (R.t < 1.2) v = 0; else if (!top) { v = Math.min(30, v + 60 * dt); y += v * dt; if (y >= TOP - 1) { y = TOP - 1; top = R.t; k.say('🌞 WOW! Look how big the Sun is!', true); } }
        else if (R.t - top < 2.5) { y = TOP - 1 - Math.abs(Math.sin((R.t - top) * 4)) * (2.5 - (R.t - top)) * .8; } else { y -= 4.5 * dt; } }
      else { if (!top) { y += (4 + Math.max(0, st.y) * 6) * dt; if (y >= TOP - 1) { y = TOP - 1; top = R.t; k.say('🌞 Look! You can see the whole Sun station from up here!', true); } if (st.y < -.3) top = R.t - 99; }
        else { y -= (R.t - top < 2 && st.y > -.3 ? 0 : 3 + Math.max(0, -st.y) * 4) * dt; } }
      y = Math.max(.4, y); seat.position.y = y; P.x = TX; P.y = y + .35; P.z = -1.2; P.facing = 1;
      return top && y <= .41; }, () => { seat.position.y = .4; P.x = TX + 2.5; P.y = 0; P.z = 0; k.say('🗼 What a ride! Again? Tap the seat, or the red button for BLAST mode!', true); });
  };
  k.tapIt(seat, () => ride(false), TX, 'suntower'); k.tapIt(tower, () => ride(false)); k.tapIt(btn, () => ride(true));
  k.G.interact.push({ x: TX + 3, y: 0, layer: 'space', disc: 'suntowerblast', run: () => ride(true), hintY: 1.4 });
}

function windSurf(k, X0) {
  const P = k.P, b = makeBatch(), A = X0 + 22, Z = X0 + 92, LANES = [2.6, 7.4];
  // two glowing wind streams; in the middle they split apart (the upper one swoops higher) and join again
  const laneY = (lane, x) => { const u = (x - A) / (Z - A); return LANES[lane] + (lane ? Math.sin(Math.min(1, Math.max(0, (u - .35) / .35)) * Math.PI) * 4 : -Math.sin(Math.min(1, Math.max(0, (u - .4) / .3)) * Math.PI) * 1.4); };
  const ribbonMat = new THREE.MeshBasicMaterial({ color: '#fff0a0', transparent: true, opacity: .45, fog: false, depthWrite: false });
  for (const lane of [0, 1]) { const pts = []; for (let x = A; x <= Z; x += 2) pts.push(new THREE.Vector3(x, laneY(lane, x) - .35, -1.6)); const m = new THREE.Mesh(tube(pts, .35, 80), ribbonMat.clone()); m.material.color.set(lane ? '#ffb0f0' : '#a0f0ff'); m.userData.ribbon = lane; k.add(m); }
  // stars along both streams, and energy rings to fly through
  const stars = [], rings = [];
  for (let x = A + 6; x < Z - 2; x += 5) { const lane = Math.floor((x - A) / 5) % 2; const s = k.sball(x, laneY(lane, x) + .4, -1.6, .35, .35, .12, '#ffd23f', { em: '#ffb000', ei: .7 }); s.userData.lane = lane; stars.push(s); }
  for (const [x, lane] of [[A + 18, 0], [A + 30, 1], [A + 44, 0], [A + 52, 1], [A + 62, 1]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.3, .14, 8, 28), toy(lane ? '#ff6fd8' : '#4fe0ff', { em: lane ? '#ff6fd8' : '#4fe0ff', ei: .5 })); r.position.set(x, laneY(lane, x) + .4, -1.6); r.rotation.y = Math.PI / 2; k.add(r); rings.push(r); }
  // the hoverboard waiting at the start, on a little golden dock
  b.put(BOX, A - 2, .5, -1.6, GOLD, [3, 1, 2.4]); k.plat(A - 3.5, A - .5, 1, { step: true, stepMax: 1.1 });
  const dock = b.mesh(shinyMat()); k.add(dock);
  const hb = makeBatch(); hb.put(BALL, 0, 0, 0, '#62f0ff', [1.1, .14, .45]); hb.put(BALL, 0, -.12, 0, '#ffffff', [.9, .06, .3]); const board = hb.mesh(shinyMat()); board.userData.dynamic = true; k.add(board);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), new THREE.MeshBasicMaterial({ color: '#9ff7ff', transparent: true, opacity: .5, fog: false })); glow.scale.set(1.6, .25, .7); board.add(glow); glow.position.y = -.25;
  const home = () => { board.position.set(A - 2, 1.25, -1.6); board.rotation.set(0, 0, 0); }; home();
  const go = () => { if (P.ride || !(P.layer === 'space' && Math.abs(P.x - (A - 2)) < 6)) return; k.Sound.whoosh && k.Sound.whoosh(); k.disc('sunsurf');
    k.say('🏄 Solar wind surfing! ▲ for the pink wind, ▼ for the blue wind. Catch the stars!', true);
    for (const s of stars) s.visible = true; let lane = 0, y = laneY(0, A), n = 0, rn = 0, x = A;
    sunRide(k, 'sunsurf', (R, dt) => { const st = stick(k); if (st.y > .4) lane = 1; else if (st.y < -.4) lane = 0;
      x += 7 * dt; const want = laneY(lane, Math.min(Z, x)); y += (want - y) * Math.min(1, dt * 3.5);
      board.position.set(x, y, -1.6); board.rotation.z = (want - y) * .15; board.rotation.x = Math.sin(R.t * 3) * .05;
      P.x = x; P.y = y + .15; P.z = -1.6; P.facing = 1;
      for (const s of stars) if (s.visible && Math.abs(s.position.x - x) < .9 && Math.abs(s.position.y - (y + .4)) < 1) { s.visible = false; n++; k.Sound.tone(600 + n * 50, .12, 'sine', .06, 1.5); }
      for (const r of rings) if (!r.userData.done && Math.abs(r.position.x - x) < .7) { r.userData.done = true; if (Math.abs(r.position.y - (y + .4)) < 1.2) { rn++; k.Sound.chime(); k.api.burst(x, y + .4, -1.6, ['#ffffff', '#ffd23f', '#ff6fd8'], 10, 2); } }
      if (Math.random() < dt * 10) k.api.burst(x - .8, y - .1, -1.6, ['#fff3a6', '#ffffff'], 1, .5);
      return x >= Z; }, () => { for (const r of rings) r.userData.done = false; P.x = Z + 1.5; P.y = 0; P.z = 0; home();
      k.say(n >= stars.length - 1 ? `🌟 Amazing surfing! You caught ${n} stars!` : `🏄 Wheee! You caught ${n} star${n === 1 ? '' : 's'}! Surf again for more!`, true); });
  };
  k.tapIt(board, go, A - 2, 'sunsurf'); k.tapIt(dock, go);
  k.U.push((dt, t) => { if (!P.ride || P.ride.type !== 'sunsurf') board.position.y = 1.25 + Math.sin(t * 2) * .08; for (const r of rings) r.rotation.x = t; for (const s of stars) s.rotation.y = t * 2; });
}

function lightLab(k, X0) {
  const P = k.P, b = makeBatch(), LX = X0 + 100;
  b.put(BOX, LX, .15, -2.6, '#fff3d6', [14, .3, 4]); for (const s of [-1, 1]) b.put(BOX, LX + s * 7, 1.6, -4.4, '#ffe6a0', [.3, 3.2, .3]); b.put(BOX, LX, 3.3, -4.4, '#ff9a2a', [14.6, .4, .5]);
  // 1. the prism: tap it and sunlight spreads into a rainbow
  b.put(new THREE.ConeGeometry(.7, 1.3, 3), LX - 5, 1.05, -2.6, '#dff6ff'); b.put(CYL, LX - 5, .35, -2.6, '#ffffff', [.25, .4, .25]);
  const fan = new THREE.Group(); fan.position.set(LX - 5, 1.1, -2.6); fan.visible = false; k.add(fan);
  ['#ff3b3b', '#ff9a2e', '#ffd23f', '#4fd46a', '#3d9bff', '#7a4bff'].forEach((c, i) => { const r = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .8, fog: false })); r.scale.set(2.6, .1, .05); r.position.set(1.4, 0, 0); const arm = new THREE.Group(); arm.rotation.z = -.35 + i * .14; arm.add(r); fan.add(arm); });
  // 2. the shadow lamp: tap it, the sun moves, and the shadow gets long or short
  b.put(CYL, LX - 1.5, .7, -3.2, '#a0522d', [.12, 1, .12]); b.put(BALL, LX - 1.5, 1.35, -3.2, '#4fd46a', [.45, .5, .45]);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#3a2a20', transparent: true, opacity: .45, fog: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.set(LX - 1.5, .32, -3.2); k.add(shadow);
  const lamp = k.sball(LX - 1.5, 3.2, -2.4, .4, .4, .4, '#fff3a6', { em: '#ffd23f', ei: 1 }); let lampA = 0;
  // 3. the solar panel: tap it, sunlight becomes electricity, and the fan spins
  b.put(BOX, LX + 2.2, 1, -3, '#2a3f9a', [1.8, .08, 1.2], [-.6, 0, 0]); b.put(CYL, LX + 2.2, .5, -3, '#c9cdd8', [.08, .8, .08]); b.put(CYL, LX + 3.8, .8, -3, '#c9cdd8', [.07, 1.2, .07]);
  const blades = new THREE.Group(); blades.position.set(LX + 3.8, 1.45, -2.9); k.add(blades); for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(BOX, toy('#ff6fae')); bl.scale.set(.12, .6, .04); bl.position.y = .3; const a = new THREE.Group(); a.rotation.z = i * 2.09; a.add(bl); blades.add(a); }
  let spin = 0;
  // 4. the ice cube under a magnifying glass: tap, sunlight warms it and it melts (and comes back later)
  const ice = k.sbox(LX + 5.6, .3, -2.6, .8, .8, .8, '#cfefff', { r: .1 }); b.put(CYL, LX + 5.6, 2, -2.6, '#c98a52', [.06, 1.4, .06]); b.put(new THREE.TorusGeometry(.45, .06, 8, 24), LX + 5.6, 2.9, -2.6, '#c98a52'); let melt = 0;
  const lab = b.mesh(shinyMat()); lab.castShadow = true; k.add(lab);
  const prism = () => { fan.visible = true; fan.userData.t = 4; k.Sound.chime(); k.fact('🌈 Sunlight looks white, but it is really made of ALL the colours of the rainbow!', 'sunprism'); };
  const shade = () => { lampA = (lampA + 1) % 3; k.Sound.click(); k.fact(['🌞 The Sun is high: the shadow is short!', '🌅 The Sun is low: the shadow is long!', '🌞 Shadows point away from the Sun!'][lampA], 'sunshadow'); };
  const panel = () => { spin = 6; k.Sound.tone(500, .3, 'sine', .05, 1.6); k.fact('🔋 Solar panels turn sunlight into electricity. Look, the fan spins!', 'sunpanel'); };
  const melty = () => { if (melt > 0) return; melt = 1; k.Sound.tone(800, .4, 'sine', .04, .5); k.fact('🧊 The Sun\'s light warms things up. The ice is melting!', 'sunice'); };
  k.tapIt(lab, () => k.fact('🔬 The Solar Light Lab! Tap the rainbow prism, the lamp, the solar panel and the ice!', 'sunlab'), LX, 'sunlab');
  k.G.interact.push({ x: LX - 5, y: 0, layer: 'space', disc: 'sunprism', run: prism, hintY: 1.8 }, { x: LX - 1.5, y: 0, layer: 'space', disc: 'sunshadow', run: shade, hintY: 2 }, { x: LX + 2.6, y: 0, layer: 'space', disc: 'sunpanel', run: panel, hintY: 2 }, { x: LX + 5.6, y: 0, layer: 'space', disc: 'sunice', run: melty, hintY: 2 });
  for (const [o, f] of [[fan, prism], [lamp, shade], [blades, panel], [ice, melty]]) k.tapIt(o, f);
  k.U.push((dt, t) => {
    if (fan.visible && (fan.userData.t -= dt) < 0) fan.visible = false;
    const la = [.3, 1.2, -.9][lampA]; lamp.position.x += (LX - 1.5 + Math.sin(la) * 2.6 - lamp.position.x) * Math.min(1, dt * 3); lamp.position.y += (.6 + Math.cos(la) * 2.6 - lamp.position.y) * Math.min(1, dt * 3);
    const len = 1.2 / Math.max(.25, (lamp.position.y - .3) / 2.6); shadow.scale.set(len, .45, 1); shadow.position.x = LX - 1.5 - (lamp.position.x - (LX - 1.5)) * .35 * len;
    spin = Math.max(0, spin - dt); blades.rotation.z -= dt * (1 + spin * 3);
    if (melt > 0) { melt += dt; const k2 = Math.max(.15, 1 - (melt - 1) / 3); ice.scale.y = .8 * k2; ice.position.y = .3 + ice.scale.y / 2; if (melt > 9) { melt = 0; ice.scale.y = .8; ice.position.y = .7; } }
  });
}

export const sun = {
  all(k) { buildSunCoaster(k); }, // (build 178) the giant first-person coaster above the Sun, station on the landing area
  sections: [
    k => { bouncePark(k, k.s0); flareCoaster(k, k.s0); k.rocketSign(k.s0 + 2); },
    k => { launchTower(k, k.s0); windSurf(k, k.s0); lightLab(k, k.s0); k.rocketSign(k.s0 + 108.6); },
  ],
};
