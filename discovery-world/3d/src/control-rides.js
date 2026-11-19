// ===================================================================
// control-rides.js (build 71): rides YOU control (the family: "not a character that just moves after one button").
//   NEPTUNE  • BUNGEE: ride up, then YOU press JUMP when ready; steer ◀ ▶ while you fall to catch stars; press JUMP at
//              the bottom of each bounce to bounce higher; then you are lowered down. Tap the tower to go again.
//            • THE BIG SKY DIVE: a balloon lifts you 70 m up; press JUMP to dive; steer with the joystick (◀ ▶ ▲ ▼) through
//              hoops and stars and clouds; press JUMP to open your parachute (it also opens by itself); land on the target.
//   MARS     • THE GIANT CLIMBING WALL (30 m, 10 m wide): climb with the joystick — up, down, left, right — grab the
//              gems; rest on two ledges (a little cave on the first); press JUMP to let go (you float down safely).
//              If you stop, after a while she keeps climbing slowly by herself.
//            • THE TRAMPOLINE PARK: three trampolines stepping down from the cliff top, each with a hoop to bounce
//              through; hold ▲ / JUMP as you land to bounce much higher (all the way back up to the cliff!).
// The JUMP button reaches a ride through ride.onJump (main.js); the joystick through api.stick().
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, glowMat } from './spacekit.js';
import { toy } from './creatures.js';

const RB = ['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fae'];
const GEO = () => ({ box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), ball: new THREE.SphereGeometry(1, 12, 9), lo: new THREE.SphereGeometry(1, 7, 5), torus: new THREE.TorusGeometry(1, .09, 6, 24), oct: new THREE.OctahedronGeometry(1) });
const stick = k => (k.api.stick ? k.api.stick() : { x: 0, y: 0 });
function ride(k, type, step, done) {
  const P = k.P, R = { type, t: 0, noExit: true }; P.ride = R; P.vx = P.vy = 0;
  k.U.push(dt => { if (R.over) return; if (P.ride !== R) { R.over = true; return; } R.t += dt; if (step(R, Math.min(dt, .1))) { R.over = true; if (P.ride === R) { P.ride = null; P.vy = 0; P.grounded = true; } done && done(R); } });
  return R;
}
// stars you collect by touching them (one shared material); returns { list, left() }
export function starField(k, pts, onAll) {
  const G0 = GEO(), mat = toy('#ffd23f', { em: '#ffb000', ei: .8, m: .3 }), list = pts.map(([x, y, z]) => { const m = new THREE.Mesh(G0.oct, mat); m.scale.set(.4, .52, .16); m.position.set(x, y, z ?? -.2); k.add(m); return { m, x, y, z: z ?? -.2, got: false }; });
  let n = 0;
  k.U.push((dt, t) => { const P = k.P; for (const s of list) { if (s.got) continue; s.m.rotation.y = t * 2;
    if (P.layer === 'space' && Math.abs(P.x - s.x) < 1 && Math.abs(P.y + .6 - s.y) < 1.2 && Math.abs((P.z || 0) - s.z) < 1.6) { s.got = true; s.m.visible = false; n++; k.Sound.tone(520 + n * 70, .15, 'sine', .07, 1.5); k.api.burst(s.x, s.y, s.z, ['#ffd23f', '#ffffff'], 10, 1.6);
      if (list.every(q => q.got)) { onAll && onAll(); setTimeout(() => { for (const q of list) { q.got = false; q.m.visible = true; } n = 0; }, 5000); } } } });
  return list;
}

// =================== NEPTUNE: THE BUNGEE YOU CONTROL ===================
export function neptuneBungee2(k, X) {
  const P = k.P, G0 = GEO(), bx = X + 76, T = 24, b = makeBatch();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.put(G0.cyl, bx + sx * 1.3, T / 2, -4 + sz * 1.3, '#9b6cff', [.16, T, .16]);
  for (let y = 3; y < T; y += 3) for (const sz of [-1, 1]) b.put(G0.box, bx, y, -4 + sz * 1.3, '#c9a6ff', [2.6, .1, .1]);
  b.put(G0.box, bx, T, -4, '#ffd23f', [3.4, .3, 3.4]); b.put(G0.box, bx + 2.4, T, -3, '#ff6a3c', [2.2, .3, 1.4]); b.put(G0.box, bx - 2.4, T, -3, '#7fe0a0', [2.2, .3, 1.4]); // (build 76: the GENTLE board on the left, the BIG board on the right)          // the platform and a BIG jumping board
  for (const s of [-1, 1]) b.put(G0.cyl, bx + s * 1.6, T + .6, -2.4, '#ffffff', [.05, 1.2, .05]); b.put(G0.box, bx, T + 1.2, -2.4, '#ffffff', [3.2, .06, .06]);
  b.put(G0.cyl, bx + 3, .05, -3, '#5aa8ff', [3.4, .1, 3.4]); b.put(G0.cyl, bx + 3, .07, -3, '#ffffff', [2.2, .1, 2.2]); b.put(G0.cyl, bx + 3, .09, -3, '#ff4f6a', [1, .1, 1]); // a soft landing mat
  k.add(b.mesh(shinyMat()));
  const lift = new THREE.Mesh(new THREE.BoxGeometry(1.4, .2, 1.4), toy('#5aa8ff', { r: .3 })); lift.position.set(bx - 2.1, .1, -2.6); k.add(lift);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1, 6), toy('#ff4f9a', { r: .4 })); cord.visible = false; k.add(cord);
  const A = new THREE.Vector3(bx + 3, T + .1, -3), Bv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let Lc = 9, big = true;
  const stars = starField(k, [[bx + 3 - 2.4, T - 9, -3], [bx + 3 + 2.4, T - 12, -3], [bx + 3 - 1.8, T - 15, -3], [bx + 3 + 2, T - 18, -3], [bx + 3, T - 20.5, -3]], () => { k.Sound.chime(); k.say('⭐ You caught all the bungee stars!', true); k.disc('neptunebungeestars'); });
  // (build 92) THE REBOUND GAME: after the first bounce three balloons appear around the cord's end; steer ◀ ▶ and bounce to pop them
  const balMat = toy('#ff4f9a', { em: '#ff2f7a', ei: .35, r: .3 }), balloons = [[-1.8, -2.5], [1.8, 0], [0, 2.8]].map(([dx, dy]) => { const m = new THREE.Mesh(G0.ball, balMat); m.scale.set(.55, .7, .55); m.visible = false; k.add(m); return { m, dx, dy, got: false }; });
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - bx) > 9) return; k.fact('🪢 Bungee jump! Ride up to the top. When you are ready, press the JUMP button!', 'neptunebungee');
    let ph = 'lift', vy = 0, y = 0, sway = 0, vs = 0, wait = 0; for (const q of balloons) { q.got = false; q.m.visible = false; }
    const R = ride(k, 'bungee', (R, dt) => {
      if (ph === 'lift') { lift.position.y = Math.min(T, lift.position.y + dt * 5); P.x = bx - 2.1; P.z = -2.6; P.y = lift.position.y + .1; if (lift.position.y >= T) { ph = 'walk'; R.w = 0; } return false; }
      if (ph === 'walk') { R.w += dt; P.x = bx - 2.1 + Math.min(1, R.w / 1.2) * 5.1; P.y = T + .15; P.z = -3; P.facing = 1; if (R.w > 1.3) { ph = 'ready'; wait = 0; k.say('🪢 Big jump here! Or push ◀ for the gentle jump. Press JUMP when you are ready!', true); } return false; }
      if (ph === 'ready') { wait += dt; P.y = T + .15 + Math.abs(Math.sin(R.t * 3)) * .06; const sc = stick(k); if (sc.x < -.5 && big) { big = false; k.Sound.tone(392, .12, 'triangle', .05, 1); k.say('🪢 The gentle jump: a short cord.', false); } else if (sc.x > .5 && !big) { big = true; k.Sound.tone(587, .12, 'triangle', .05, 1); k.say('🪢 The BIG jump: a long cord!', false); }
        const bxT = big ? bx + 3 : bx - 3; P.x += (bxT - P.x) * Math.min(1, dt * 4); P.facing = big ? 1 : -1; A.x = bxT; Lc = big ? 9 : 5; R.big = big; if (wait > 12 || R.jumpNow) { ph = 'fall'; vy = 3.5; y = P.y; cord.visible = true; k.Sound.whoosh(); k.say('🪢 JUMP! Use ◀ ▶ to catch the stars! Press JUMP at the bottom to bounce higher!', true); R.t0 = R.t; } }
      if (ph === 'fall') { const st = stick(k); vs += (st.x * 5 - sway * 1.2) * dt; vs *= Math.exp(-dt * 1.2); sway = Math.max(-3, Math.min(3, sway + vs * dt));
        vy -= 11 * dt; const stretch = (A.y - (y + 1)) - Lc; if (stretch > 0) vy += 9 * stretch * dt; vy *= Math.exp(-dt * .45); y += vy * dt; y = Math.max(.6, y); R.minY = Math.min(R.minY ?? 99, y);
        if (stretch > 0 && vy > 0 && !R.boing) { R.boing = 1; R.bounces = (R.bounces || 0) + 1; k.Sound.boing(); } if (vy < 0) R.boing = 0;
        P.y = y; P.x = A.x + sway; P.z = A.z;
        if (R.bounces >= 1) { const ey = A.y - 1 - Lc; if (!R.balShown) { R.balShown = 1; R.pops = 0; for (const q of balloons) { q.m.position.set(A.x + q.dx, ey + q.dy, A.z); q.m.visible = true; } k.say('🎈 Balloons! Steer ◀ ▶ and bounce to pop them!', true); }
          for (const q of balloons) { if (q.got) continue; q.m.position.y = ey + q.dy + Math.sin(R.t * 2 + q.dx) * .15; if (Math.abs(P.x - q.m.position.x) < 1.1 && Math.abs(P.y - q.m.position.y) < 1.6) { q.got = true; q.m.visible = false; R.pops++; k.Sound.tone(700 + R.pops * 90, .12, 'square', .06, 2); k.api.burst(q.m.position.x, q.m.position.y, A.z, RB, 12, 2);
            if (R.pops === balloons.length) { k.Sound.chime(); k.say('🎈 You popped all the balloons!', true); k.disc('neptunebungeeballoons'); } } } }
        R.roll = y < T - .5 ? Math.PI + sway * .15 : 0; if (R.t - R.t0 > 14 && Math.abs(vy) < 6) { ph = 'down'; R.roll = Math.PI; } }
      if (ph === 'down') { y = Math.max(0, y - dt * 3); sway *= .97; P.x = A.x + sway; P.y = y; if (y <= .5) R.roll = 0; if (y <= 0) { cord.visible = false; lift.position.y = .1; for (const q of balloons) q.m.visible = false; return true; } }
      if (cord.visible) { Bv.set(P.x, P.y + (R.roll ? .2 : 1.2), P.z); cord.position.copy(A).add(Bv).multiplyScalar(.5); const d = Bv.clone().sub(A); cord.scale.set(1, d.length(), 1); cord.quaternion.setFromUnitVectors(up, d.normalize()); }
      return false; }, R => { P.x = bx + 5.5; P.y = 0; P.z = 0; k.api.burst(P.x, 1, 0, ['#ffffff', '#ff4f9a', '#ffd23f'], 16, 2.4); k.say(`🪢 ${R.bounces || 0} bounces! Tap the tower to jump again!`, true); k.disc('neptunebungeedone'); });
    R.onJump = () => { if (ph === 'ready') R.jumpNow = true; else if (ph === 'fall') { const stretch = (A.y - (y + 1)) - Lc; if (stretch > 0 && vy > -2) { vy += 5; k.Sound.tone(660, .12, 'triangle', .06, 2); k.api.burst(P.x, P.y, P.z, RB, 8, 1.6); } } };
    k.G.bungee = { R, balloons, get ph() { return ph; } }; };
  const tw = new THREE.Group(); tw.position.set(bx, 0, -4); k.add(tw); k.tapIt(lift, go, bx, 'neptunebungeego'); k.tapIt(tw, go);
}

// =================== MARS: THE RAINBOW WALL AND ZIP LINE (build 92; area 3, x 53–76) ===================
// A second climbing wall (16 m, rainbow handholds). Climb with the joystick (she climbs on slowly by herself if you stop);
// at the top the bell rings, and she grabs the ZIP LINE and whizzes down the rope to the ground. JUMP lets go (float down).
export function marsZipWall(k) {
  const P = k.P, G0 = GEO(), X = k.s0, wx = X + 56, W = 3, H = 16, zx = X + 77, b = makeBatch();
  b.put(G0.box, wx, H / 2, -2.2, '#c86a48', [2 * W, H, 3.2]); b.put(G0.box, wx, H + .15, -2.2, '#e08a5a', [2 * W + .4, .3, 3.4]);
  for (let r = 0; r < 13; r++) for (let c = 0; c < 4; c++) { const x = wx - W + .7 + c * 1.5 + (r % 2) * .7; if (x > wx + W - .4) continue; b.put(G0.lo, x, .8 + r * 1.2, -.5, RB[(r + c) % 7], [.24, .19, .15]); } // (low-detail handholds)
  for (const s of [-1, 1]) b.put(G0.cyl, wx + W + .8 + s * .5, (H + 3) / 2, -1, '#d8e0ea', [.1, H + 3, .1]);           // the zip tower post
  b.put(G0.cyl, zx, 2, -1, '#d8e0ea', [.12, 4, .12]); b.put(G0.cyl, zx, .1, -1, '#7fe0a0', [1.6, .2, 1.6]);          // the low end post and a landing mat
  const top = new THREE.Vector3(wx + W + .8, H + 2.6, -1), bot = new THREE.Vector3(zx, 3.6, -1), d = bot.clone().sub(top);
  b.put(G0.cyl, (top.x + bot.x) / 2, (top.y + bot.y) / 2, -1, '#ffffff', [.04, d.length(), .04], [0, 0, Math.atan2(-d.x, d.y)]);
  b.put(G0.cyl, wx - W + .8, H + 1, -1.6, '#5a6a8a', [.05, 1.6, .05]);   // the bell post
  const cliff = b.mesh(shinyMat()); k.add(cliff); k.plat(wx - W, wx + W + 1.4, H + .3, { z: -1.2 });
  const bell = new THREE.Mesh(new THREE.ConeGeometry(.45, .7, 14, 1, true), toy('#ffd23f', { m: .6, r: .3, em: '#ffb000', ei: .2 })); bell.position.set(wx - W + .8, H + 1.6, -1.6); k.add(bell);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.3, .05, 6, 16), toy('#ff4f6a', { r: .3 })); handle.position.copy(top); handle.position.y -= .4; handle.userData.dynamic = true; k.add(handle);
  let ring = 0; k.U.push((dt, t) => { ring = Math.max(0, ring - dt); bell.rotation.z = Math.sin(t * 14) * ring * .35; });
  const zip = () => { k.say('🪢 Grab the zip line! WHEEE!', true); k.disc('marszip'); handle.position.copy(top); handle.position.y -= .4;
    ride(k, 'zipline', (R, dt) => { R.f = Math.min(1, (R.f || 0) + dt * (.06 + (R.f || 0) * .2)); handle.position.copy(top).addScaledVector(d, R.f); handle.position.y -= .4; P.x = handle.position.x; P.y = handle.position.y - 2.1; P.z = -1; P.facing = 1; R.roll = Math.sin(R.t * 3) * .1;
      if (Math.random() < dt * 6) k.api.burst(P.x, P.y + 2, -1, ['#ffffff', '#ffd23f'], 2, 1); return R.f >= 1 || R.letGo; },
      R => { P.z = 0; handle.position.copy(top); handle.position.y -= .4; if (R.letGo) { P.vy = 0; P.grounded = false; P.floatDown = true; } else { P.y = 0; P.x = zx + 1; k.api.burst(P.x, 1, 0, RB, 16, 2.2); k.Sound.boing(); k.say('🪢 What a zip! Climb the rainbow wall again!', true); } });
    P.ride.onJump = () => { if (P.ride && P.ride.type === 'zipline' && P.y < 6) P.ride.letGo = true; }; };
  const climb = () => { if (P.layer !== 'space' || P.ride || P.x < wx - W - 2 || P.x > wx + W + 2 || P.y > H - 1) return;
    k.say('🧗 The rainbow wall! Climb up to ring the bell!', true); k.disc('marszipwall'); let idle = 0; P.x = Math.max(wx - W + .5, Math.min(wx + W - .5, P.x)); P.y = Math.max(.3, P.y);
    const R = ride(k, 'rockclimb2', (R, dt) => { const st = stick(k), moving = Math.abs(st.x) > .2 || Math.abs(st.y) > .2; idle = moving ? 0 : idle + dt;
      let vy = st.y * 2.4, vx = st.x * 2; if (!moving && idle > 3) vy = .7;
      P.y = Math.max(0, Math.min(H + .3, P.y + vy * dt)); P.x = Math.max(wx - W + .4, Math.min(wx + W - .4, P.x + vx * dt)); P.z = -.05; R.reach = (R.reach || 0) + dt * 6; R.roll = Math.sin(R.reach) * .12; R.maxY = Math.max(R.maxY || 0, P.y);
      if (P.y >= H + .3) { R.end = 'top'; return true; } if (P.y <= 0 && st.y < -.2) { R.end = 'ground'; return true; } return !!R.end; },
      R => { P.z = 0; if (R.end === 'top') { P.y = H + .3; P.x = wx; P.grounded = true; ring = 2; k.Sound.chime(); k.api.burst(bell.position.x, bell.position.y, -1.6, ['#ffd23f', '#ffffff'], 20, 2.2); k.say('🔔 DING DONG! You rang the bell! Now the zip line!', true); k.disc('marszipbell'); setTimeout(() => { if (!P.ride && P.layer === 'space' && P.y > H - .5) zip(); }, 1600); }
        else if (R.end === 'let') { P.vy = 0; P.grounded = false; P.floatDown = true; } else P.y = 0; });
    R.onJump = () => { R.end = 'let'; }; };
  k.tapIt(cliff, climb, wx, 'marszipwallgo');
  k.G.interact.push({ x: wx + W + .8, y: H + .3, layer: 'space', disc: 'marszipgo', run: () => { if (!P.ride && Math.abs(P.y - H - .3) < 1) zip(); }, hintY: 2.4 });
  k.U.push(dt => { if (!P.floatDown) return; if (P.ride || P.grounded) { P.floatDown = false; return; } P.vy = Math.max(P.vy, -3); });
}

// =================== NEPTUNE: THE BIG SKY DIVE ===================
export function neptuneSkyDive(k, X) {
  const P = k.P, G0 = GEO(), bx = X + 74, TOP = 70, tx = X + 84;   // the balloon at bx, the landing target at tx
  // the balloon and basket, the target, clouds, hoops (all made once; two meshes)
  const bal = new THREE.Group(); bal.position.set(bx, 0, -2.5); k.add(bal); { const b = makeBatch(); b.put(G0.ball, 0, 5, 0, '#5aa8ff', [2.2, 2.6, 2.2]); for (let i = 0; i < 8; i++) b.put(G0.box, Math.cos(i * .785) * 2, 5, Math.sin(i * .785) * 2, i % 2 ? '#ffffff' : '#ffd23f', [.12, 4.6, .12], [0, -i * .785, 0]);
    b.put(G0.box, 0, 1.1, 0, '#c98a4a', [1.6, 1, 1.6]); for (const s of [-1, 1]) for (const z of [-1, 1]) b.put(G0.cyl, s * .7, 2.2, z * .7, '#ffffff', [.03, 1.8, .03]); bal.add(b.mesh(shinyMat())); }
  const hoopPts = [[bx + 4, 58, -3], [bx - 3, 48, 1], [bx + 6, 39, -5], [bx + 1, 30, 2], [bx + 9, 22, -2]], gb = makeBatch();
  for (const [i, [x, y, z]] of hoopPts.entries()) gb.put(G0.torus, x, y, z, RB[i % 7], 2.6, [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 26; i++) { const x = bx - 14 + (i * 7.3) % 34, y = 18 + (i * 11.7) % 46, z = -9 + (i * 3.1) % 8; for (const [dx, s] of [[0, 1], [1.6, .75], [-1.5, .7]]) gb.put(G0.lo, x + dx, y, z, i % 4 ? '#ffffff' : '#cfe3ff', [2.2 * s, 1.2 * s, 1.6 * s]); }
  gb.put(G0.cyl, tx, .04, -1, '#ffffff', [4.5, .08, 4.5]); gb.put(G0.cyl, tx, .06, -1, '#ff4f6a', [3.2, .08, 3.2]); gb.put(G0.cyl, tx, .08, -1, '#ffffff', [2, .08, 2]); gb.put(G0.cyl, tx, .1, -1, '#ff4f6a', [.9, .08, .9]);
  // (build 79) three FLOATING CLOUD ISLANDS to land on (rest, then JUMP to dive on), and a second line of golden hoops
  const islands = [[bx - 8, 46, -3, 3.2], [bx + 9, 33, -1, 3.4], [bx - 4, 21, 1, 3.6]].map(([ix, iy, iz, ir]) => { for (const [dx, dz, s] of [[0, 0, 1], [-1.8, .6, .7], [1.7, -.5, .75], [.4, 1.4, .6], [-.6, -1.5, .65]]) gb.put(G0.lo, ix + dx, iy - .6, iz + dz, '#ffffff', [ir * .65 * s + .4, .9 * s, ir * .6 * s + .3]); return { x: ix, y: iy, z: iz, r: ir }; });
  // (build 93) WIND GUSTS: three bands of white wind streaks; diving through one pushes you sideways (steer against it!)
  const gusts = [[54, 1], [37, -1], [25, 1]].map(([gy, d]) => { for (let i = 0; i < 9; i++) gb.put(G0.box, bx - 12 + i * 3.4 + (i % 2) * 1.2, gy - 1.2 + (i % 3) * 1.2, -6 + (i % 4) * 2.5, '#ffffff', [2.4, .07, .07]); return { y: gy, d }; });
  const hoopPts2 = [[bx - 10, 55, 0], [bx - 12, 40, -4], [bx - 9, 27, 2]]; for (const [hx, hy, hz] of hoopPts2) gb.put(G0.torus, hx, hy, hz, '#ffd23f', 2.4, [Math.PI / 2, 0, 0]); hoopPts.push(...hoopPts2);
  const sky = gb.mesh(glowMat()); k.add(sky);
  const stars = starField(k, [[bx + 2, 63, -1], [bx - 5, 53, -2], [bx + 7, 44, 0], [bx - 1, 35, -4], [bx + 5, 26, 1], [bx + 10, 15, -2]].map(([x, y, z]) => [x, y, z]), () => { k.Sound.chime(); k.say('⭐ All the sky stars!', true); k.disc('neptuneskystars'); });
  // the parachute (a colourful dome over her when it opens)
  const chute = new THREE.Group(); chute.visible = false; k.add(chute); { const cb = makeBatch(); for (let i = 0; i < 8; i++) cb.put(new THREE.SphereGeometry(1, 6, 4, i * Math.PI / 4, Math.PI / 4, 0, Math.PI / 2), 0, 3, 0, RB[i % 7], [2.4, 1.3, 2.4]); for (let i = 0; i < 4; i++) cb.put(G0.cyl, Math.cos(i * 1.57) * 1.2, 2, Math.sin(i * 1.57) * 1.2, '#ffffff', [.02, 2.2, .02], [Math.sin(i * 1.57) * .5, 0, -Math.cos(i * 1.57) * .5]); chute.add(cb.mesh(shinyMat())); }
  const go = () => { if (P.layer !== 'space' || P.ride || Math.abs(P.x - bx) > 7) return; k.fact('🪂 The Big Sky Dive! The balloon takes you way up high. Press JUMP to dive!', 'neptuneskydiver');
    let ph = 'up', vx = 0, vz = 0, vy = 0, hoopsGot = 0, wait = 0, rest = null; const hit = hoopPts.map(() => false);
    const R = ride(k, 'skydrop', (R, dt) => {
      if (ph === 'up') { bal.position.y = Math.min(TOP, bal.position.y + dt * 12); P.x = bx; P.z = -2.5; P.y = bal.position.y + 1.6; if (bal.position.y >= TOP) { ph = 'ready'; wait = 0; k.say('🪂 So high! Press JUMP to dive!', true); } return false; }
      if (ph === 'ready') { wait += dt; if (wait > 8 || R.go) { ph = 'fall'; vy = 0; k.Sound.whoosh(); k.say('🪂 Wheee! Steer with the joystick through the hoops! Press JUMP to open your parachute!', true); } return false; }
      if (ph === 'rest') { const sr = stick(k); P.x = Math.max(rest.x - rest.r + .5, Math.min(rest.x + rest.r - .5, P.x + sr.x * 3 * dt)); P.z = Math.max(rest.z - rest.r + .5, Math.min(rest.z + rest.r - .5, P.z - sr.y * 2 * dt)); P.y = rest.y + Math.sin(R.t * 3) * .04; R.roll = 0; P.facing = sr.x >= 0 ? 1 : -1; chute.visible = false;
        if (R.go2) { R.go2 = false; ph = 'fall'; vy = 4; R.open = false; R.left = rest; R.leftT = R.t; k.Sound.whoosh(); } return false; }
      const st = stick(k), chuteOn = ph === 'chute', sp = chuteOn ? 3 : 7;
      vx += (st.x * sp - vx) * Math.min(1, dt * 2); vz += (-st.y * sp * .7 - vz) * Math.min(1, dt * 2);
      { const gu = gusts.find(g => Math.abs(P.y - g.y) < 2); if (gu) { vx += gu.d * 10 * dt; if (R.inG !== gu) { R.inG = gu; R.gusts = (R.gusts || 0) + 1; R.gustDx = 0; k.Sound.whoosh(); k.say('💨 A gust of wind! Steer against it!', false); } R.gustDx += vx * dt; } else R.inG = null; }
      vy += ((chuteOn ? -3 : -13) - vy) * Math.min(1, dt * (chuteOn ? 2.5 : .9));                    // gentle air resistance: a steady fall, then slow under the parachute
      P.x = Math.max(X + 20, Math.min(X + 108, P.x + vx * dt)); P.z = Math.max(-7, Math.min(4, P.z + vz * dt)); P.y += vy * dt;
      R.roll = chuteOn ? 0 : Math.PI / 2 * .9 + st.x * .25; P.facing = vx >= 0 ? 1 : -1;
      for (const [i, [hx, hy, hz]] of hoopPts.entries()) if (!hit[i] && Math.abs(P.y + .6 - hy) < 1.2 && Math.hypot(P.x - hx, P.z - hz) < 2.8) { hit[i] = true; hoopsGot++; k.Sound.tone(520 + hoopsGot * 80, .2, 'sine', .07, 1.5); k.api.burst(hx, hy, hz, RB, 16, 2.4); if (hoopsGot === hoopPts.length) k.say('🎉 Through every hoop!', true); }
      for (const isl of islands) if (!(isl === R.left && R.t - R.leftT < 2) && vy < 0 && P.y - vy * dt >= isl.y - .1 && P.y <= isl.y + .1 && Math.hypot(P.x - isl.x, P.z - isl.z) < isl.r) /* (her height before and after this step) */ { ph = 'rest'; rest = isl; P.y = isl.y; vy = 0; vx = vz = 0; R.rests = (R.rests || 0) + 1; k.Sound.boing(); k.api.burst(P.x, P.y, P.z, ['#ffffff'], 12, 1.6); k.say('☁️ A cloud island! Walk about, then press JUMP to dive again!', true); return false; }
      if (ph === 'fall' && (R.open || P.y < 18)) { ph = 'chute'; chute.visible = true; k.Sound.boing(); k.say('🪂 Parachute open! Steer to the red target!', true); }
      if (chute.visible) chute.position.set(P.x, P.y + .6, P.z);
      if (P.y <= 0) { P.y = 0; return true; } return false; },
      R => { chute.visible = false; bal.position.y = 0; P.vy = 0; const bull = Math.hypot(P.x - tx, (P.z || 0) + 1) < 3.3; P.z = 0; k.api.burst(P.x, .6, 0, RB, bull ? 30 : 12, 2.6); k.Sound.chime();
        k.say(bull ? '🎯 BULLSEYE! A perfect landing on the target!' : '🪂 You landed! Tap the balloon to dive again!', true); k.disc(bull ? 'neptunebullseye' : 'neptuneskydived'); G_last.hoops = hoopsGot; G_last.bull = bull; G_last.gusts = R.gusts || 0; });
    R.onJump = () => { if (ph === 'ready') R.go = true; else if (ph === 'rest') R.go2 = true; else if (ph === 'fall') R.open = true; };
    k.G.skyDive = { R, get ph() { return ph; }, hoops: hoopPts, tx }; };
  const G_last = k.G.skyDiveLast = {};
  k.tapIt(bal, go, bx, 'neptuneskydivego2');
}

// =================== MARS: THE GIANT CLIMBING WALL YOU CLIMB YOURSELF, AND THE TRAMPOLINE PARK ===================
export function marsClimbPark(k, X) {
  const P = k.P, G0 = GEO(), wx = X + 92.5, W = 5, H = 30, b = makeBatch(), HC = ['#ff4f6a', '#ffd23f', '#3cc46e', '#2fa8ff', '#9b6cff', '#ff9a2e'];
  b.put(G0.box, wx, H / 2, -2.2, '#b8573a', [2 * W, H, 3.6]); b.put(G0.box, wx, H + .15, -2.2, '#d06a44', [2 * W + .4, .3, 3.8]);
  for (let i = 0; i < 16; i++) b.put(G0.box, wx - W + 1 + (i * 3.7) % (2 * W - 2), 1.5 + i * 1.8, -.42, '#8f3f28', [1.6, 1.2, .4], [0, 0, i * .7]); // rocky lumps
  for (let r = 0; r < 24; r++) for (let c = 0; c < 6; c++) { const x = wx - W + .9 + c * 1.65 + (r % 2) * .8, y = .9 + r * 1.2; if (x > wx + W - .5) continue; b.put(G0.ball, x, y, -.36, HC[(r + c) % 6], [.26, .2, .16]); } // BIG handholds everywhere
  // two resting ledges (with a little cave on the first) and safety ropes
  b.put(G0.box, wx - W - 1.2, 10, -1.4, '#c8653f', [2.6, .5, 2.4]); b.put(G0.box, wx - W - 1.2, 20, -1.4, '#c8653f', [2.6, .5, 2.4]);
  b.put(G0.ball, wx - W - .3, 11.4, -2.6, '#2a1410', [1.1, 1.3, .6]);
  for (const s of [-1, 1]) b.put(G0.cyl, wx + s * W * .6, (H + 1.2) / 2, -.3, '#ffffff', [.03, H + 1.2, .03]);
  const cliff = b.mesh(shinyMat()); cliff.castShadow = true; k.add(cliff);
  k.plat(wx - W, wx + W, H + .3, { z: -1.2 }); k.plat(wx - W - 2.5, wx - W + .1, 10.25, { z: -1.2 }); k.plat(wx - W - 2.5, wx - W + .1, 20.25, { z: -1.2 });
  k.sbox(wx - W + .4, H + .3, -2.6, .06, 1.6, .06, '#ffffff'); k.sbox(wx - W + .7, H + 1.5, -2.6, .6, .38, .03, '#ffd23f');
  const crystal = new THREE.Mesh(G0.oct, toy('#9fe6ff', { em: '#9fe6ff', ei: .8 })); crystal.scale.set(.3, .45, .3); crystal.position.set(wx - W - .3, 10.8, -2.2); k.add(crystal);
  k.tapIt(crystal, () => { k.Sound.twinkle(); k.api.burst(crystal.position.x, 11, -2, ['#9fe6ff', '#ffffff'], 16, 1.6); k.fact('💎 A secret crystal in the little cave!', 'marscave'); });
  const gems = starField(k, [[wx - 3, 5, -.1], [wx + 3, 8, -.1], [wx - 1, 13, -.1], [wx + 4, 17, -.1], [wx - 4, 22, -.1], [wx + 1, 26, -.1]], () => { k.Sound.chime(); k.say('💎 All six climbing gems!', true); k.disc('marsclimbgems'); });
  // ---- climbing: joystick up/down/left/right; JUMP lets go; if you stop for a while she climbs on slowly by herself ----
  const climb = () => { if (P.layer !== 'space' || P.ride || P.x < wx - W - 3 || P.x > wx + W + 3 || P.y > H - 1) return;
    k.say('🧗 Climb! Push the joystick up, down, left and right. Press JUMP to let go.', true); k.disc('marsclimbgo2');
    let idle = 0, hinted = false; P.x = Math.max(wx - W + .5, Math.min(wx + W - .5, P.x)); P.y = Math.max(.3, P.y);
    const R = ride(k, 'rockclimb', (R, dt) => { const st = stick(k), moving = Math.abs(st.x) > .2 || Math.abs(st.y) > .2;
      idle = moving ? 0 : idle + dt; let vy = st.y * 2.4, vx = st.x * 2; if (!moving && idle > 3) { vy = .6; if (!hinted) { hinted = true; k.say('🧗 Push up to climb! (I will help you up slowly.)', true); } }
      const y0 = P.y; P.y = Math.max(0, Math.min(H + .3, P.y + vy * dt)); P.x = Math.max(wx - W + .4, Math.min(wx + W - .4, P.x + vx * dt)); P.z = -.05;
      if (moving || idle > 3) { R.reach = (R.reach || 0) + dt * 6; R.roll = Math.sin(R.reach) * .14; P.facing = Math.sin(R.reach * .5) > 0 ? 1 : -1; if (Math.floor(P.y / 1.2) !== Math.floor(y0 / 1.2)) k.Sound.tone(300 + P.y * 20, .05, 'triangle', .03, 1); }
      R.maxY = Math.max(R.maxY || 0, P.y);
      if (P.y >= H + .3) { R.end = 'top'; return true; } if (P.y <= 0 && st.y < -.2) { R.end = 'ground'; return true; } return !!R.end; },
      R => { P.z = 0; if (R.end === 'top') { P.y = H + .3; P.x = wx; P.grounded = true; k.api.burst(P.x, H + 1.5, -1, ['#ffd23f', '#ffffff', '#ff4f6a'], 24, 2.6); k.Sound.chime(); k.say('🏔️ You made it to the top! Walk off the right side onto the trampolines!', true); k.disc('marsclimbtop'); }
        else if (R.end === 'let') { const onL = (P.x < wx - W + 1.6 && P.y > 9 && P.y < 13) ? 10.25 : (P.x < wx - W + 1.6 && P.y > 19 && P.y < 23) ? 20.25 : null; if (onL) { P.y = onL; P.x += P.x < wx ? -1.4 : 1.4; P.grounded = true; k.say('🧗 A ledge! Have a rest. Tap the wall to climb again.', true); } else { P.vy = 0; P.grounded = false; P.floatDown = true; } }
        else P.y = 0; });
    R.onJump = () => { R.end = 'let'; };
    k.G.marsClimb = { R }; };
  // (build 83) THE CAVE TUNNEL: from the first ledge, tap the cave mouth and crawl right through the rock to a new ledge on
  //  the other side of the wall (a second way across, with a gem waiting inside)
  { const tb = makeBatch(); tb.put(G0.box, wx + W + 1.2, 10, -1.4, '#c8653f', [2.6, .5, 2.4]); tb.put(G0.ball, wx + W + .3, 11.4, -2.6, '#2a1410', [1.1, 1.3, .6]); k.add(tb.mesh(shinyMat()));
    k.plat(wx + W - .1, wx + W + 2.5, 10.25, { z: -1.2 });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(2, 2.4, 1.6), new THREE.MeshBasicMaterial({ visible: false })); mouth.position.set(wx - W - .3, 11.4, -2.4); k.add(mouth);
    const gem = new THREE.Mesh(G0.oct, toy('#ff6fd8', { em: '#ff6fd8', ei: .8 })); gem.scale.set(.3, .45, .3); gem.position.set(wx, 11, -3.4); k.add(gem);
    const crawl = () => { if (P.ride || P.layer !== 'space' || Math.abs(P.y - 10.25) > 1 || P.x > wx - W + 2 || P.x < wx - W - 4) return; k.say('🕳️ Into the cave tunnel! Crawl through the mountain!', true); k.disc('marscavetunnel');
      ride(k, 'cavetunnel', R => { const f = Math.min(1, R.t / 4.5); P.x = wx - W - .6 + f * (2 * W + 2.2); P.y = 10.25 + Math.sin(f * Math.PI) * .3; P.z = -2.6 * Math.min(1, R.t * 2) * (f < .95 ? 1 : 0); R.roll = Math.sin(R.t * 6) * .08; P.facing = 1;
        if (gem.visible && f > .48) { gem.visible = false; k.Sound.chime(); k.api.burst(wx, 11, -2.6, ['#ff6fd8', '#ffffff'], 16, 1.8); k.say('💎 A cave gem!', false); R.gem = true; } return f >= 1; }, R => { P.y = 10.25; P.z = 0; P.x = wx + W + 1.4; P.grounded = true; k.say('🧗 Out the other side! Climb on, or drop down to the trampoline!', true); if (R.gem) k.disc('marscavegem'); }); };
    k.tapIt(mouth, crawl); k.G.interact.push({ x: wx - W - 1, y: 10.25, layer: 'space', disc: 'marscavetunnelgo', run: crawl, hintY: 2.4 }); }
  // letting go away from a ledge: float down gently (never a hard fall)
  k.U.push(dt => { if (!P.floatDown) return; if (P.ride || P.grounded) { P.floatDown = false; return; } P.vy = Math.max(P.vy, -3); });
  k.tapIt(cliff, climb, wx, 'marsclimbgo');
  // ---- THE TRAMPOLINE PARK: ground, middle and high trampolines; hold ▲ / JUMP on landing to bounce higher; hoops ----
  const g = 24 * 3.71 / 9.81, hb = makeBatch(), tb = makeBatch(), rings = [];
  // (build 92) THE GENTLE / HIGH PICTURE SWITCH beside the ground trampoline: tap it to flip between a FEATHER (soft little
  //  bounces, for a calm play) and a ROCKET (the big bounces). It starts on the rocket.
  let soft = false; const sw = new THREE.Group(); sw.position.set(wx + 18.6, 0, -1.6); k.add(sw);
  { const pb = makeBatch(); pb.put(G0.cyl, 0, .9, 0, '#5a6a8a', [.08, 1.8, .08]); pb.put(G0.cyl, 0, 2.1, 0, '#ffffff', [.75, .1, .75], [Math.PI / 2, 0, 0]); sw.add(pb.mesh(shinyMat()));
    const fb = makeBatch(); fb.put(G0.ball, 0, 2.1, .1, '#9fe8b8', [.18, .5, .06], [0, 0, .5]); fb.put(G0.cyl, .1, 1.85, .12, '#ffffff', [.02, .5, .02], [0, 0, .5]); const feather = fb.mesh(shinyMat());
    const rb = makeBatch(); rb.put(G0.cyl, 0, 2.1, .1, '#ff6a3c', [.15, .55, .06]); rb.put(G0.ball, 0, 2.42, .1, '#ffd23f', [.15, .18, .06]); rb.put(G0.box, -.18, 1.88, .1, '#5aa8ff', [.12, .2, .05]); rb.put(G0.box, .18, 1.88, .1, '#5aa8ff', [.12, .2, .05]); const rocket = rb.mesh(shinyMat());
    feather.visible = false; sw.add(feather, rocket); sw.userData.set = s => { soft = s; feather.visible = s; rocket.visible = !s; }; }
  k.tapIt(sw, () => { if (P.layer !== 'space') return; sw.userData.set(!soft); k.Sound.tone(soft ? 392 : 660, .15, 'triangle', .06, 1.5); k.fact(soft ? '🪶 The feather: soft little bounces.' : '🚀 The rocket: BIG bounces!', soft ? 'marstrampsoft' : 'marstramphigh'); }, wx + 18.6, 'marstrampswitch');
  k.G.marsTrampSwitch = { get soft() { return soft; } };
  const tramp = (x0, x1, y, v, col) => { const tc = (x0 + x1) / 2; for (const x of [x0, x1]) for (const z of [-.2, -3]) tb.put(G0.cyl, x, y / 2, z, '#5a6a8a', [.12, Math.max(.3, y), .12]);
    for (const z of [-.2, -3]) tb.put(G0.box, tc, y, z, col, [x1 - x0 + .4, .25, .3]); for (const x of [x0, x1]) tb.put(G0.box, x, y, -1.6, col, [.3, .25, 3]);
    const mat = k.sbox(tc, y - .15, -1.6, x1 - x0 - .4, .1, 2.5, '#1d1d2b', { r: .5 }); let sq = 0, n = 0; const top = v * v / (2 * g);
    hb.put(G0.torus, tc, y + top * .8, -1.2, col, 1.1, [0, 0, 0]); const ring = { x: tc, y: y + top * .8, hit: 0 }; rings.push(ring);
    k.plat(x0 + .2, x1 - .2, y, { z: -1.2 }); let cool = 0;
    k.U.push(dt => { sq = Math.max(0, sq - dt * 3); mat.position.y = y - .1 - Math.sin(sq * Math.PI) * .45; cool = Math.max(0, cool - dt); ring.hit = Math.max(0, ring.hit - dt);
      if (!cool && P.layer === 'space' && !P.ride && P.grounded && Math.abs(P.y - y) < .3 && P.x > x0 + .2 && P.x < x1 - .2) { const big = !soft && k.api.keysUp && k.api.keysUp(); cool = .3; P.y = y + .05; P.vy = v * (soft ? .55 : big ? 1.4 : 1); P.grounded = false; P.jumps = 1; sq = 1; n++; k.Sound.boing();
        if (n === 1) k.fact('🤸 BOING! Hold ▲ (or JUMP) as you land to bounce MUCH higher!', 'marstramp'); if (big) k.api.burst(P.x, y + .3, -1, RB, 8, 1.8); }
      if (!ring.hit && P.layer === 'space' && Math.abs(P.x - ring.x) < 1 && Math.abs(P.y + .6 - ring.y) < .8) { ring.hit = 1.2; k.Sound.tone(700, .2, 'sine', .07, 1.5); k.api.burst(ring.x, ring.y, -1.2, RB, 14, 2); k.disc('marshoops', '🤸 Bounce up through the hoops!'); } });
    k.tapIt(mat, () => k.fact('🤸 A giant trampoline! Hold ▲ when you land to bounce higher!', 'marstrampoline'), tc, null); };
  tramp(wx + 6, wx + 16.5, 1, 14, '#2fa8ff');        // the big one on the ground (hold ▲: up to the middle one)
  tramp(wx + 5.3, wx + 14.2, 20, 10, '#ff6fae');      // the middle one, right of the cliff (hold ▲: back up to the cliff top!)
  tramp(wx + 14.6, wx + 17.4, 10, 11, '#ffd23f');    // the small high one
  k.add(tb.mesh(shinyMat())); k.add(hb.mesh(glowMat()));
  starField(k, [[wx + 9, 9, -1], [wx + 14.5, 16, -1], [wx + 8, 25, -1], [wx + 11, 14, -1]], () => { k.Sound.chime(); k.say('⭐ All the trampoline stars!', true); k.disc('marstrampstars'); });
}

// =================== (build 86) MARS: THE CANYON TRAMPOLINE ===================
// In the canyon between the two mesas (area 2): a big trampoline. Bounce, and hold ▲ (or JUMP) as you land to bounce
// right up and over onto either mesa top. Stars and a hoop above.
export function marsCanyonTramp(k) {
  const P = k.P, G0 = GEO(), X = k.s0, a = X + 21, c = X + 29, y = .6, v = 10, g = 24 * 3.71 / 9.81, tb = makeBatch();
  for (const xx of [a, c]) for (const z of [-.2, -2.8]) tb.put(G0.cyl, xx, y / 2, z, '#5a6a8a', [.12, y, .12]);
  for (const z of [-.2, -2.8]) tb.put(G0.box, (a + c) / 2, y, z, '#ff9a2e', [c - a + .4, .25, .3]); for (const xx of [a, c]) tb.put(G0.box, xx, y, -1.5, '#ff9a2e', [.3, .25, 2.8]);
  const top = v * 1.4 * v * 1.4 / (2 * g), hb = makeBatch(); hb.put(G0.torus, (a + c) / 2, y + top * .85, -1.2, '#ffd23f', 1.2, [0, 0, 0]);
  k.add(tb.mesh(shinyMat())); k.add(hb.mesh(glowMat()));
  const mat = k.sbox((a + c) / 2, y - .15, -1.5, c - a - .4, .1, 2.3, '#1d1d2b', { r: .5 }); let sq = 0, cool = 0, n = 0, ringHit = 0;
  k.plat(a + .2, c - .2, y, { z: -1.2 });
  k.U.push(dt => { sq = Math.max(0, sq - dt * 3); mat.position.y = y - .1 - Math.sin(sq * Math.PI) * .4; cool = Math.max(0, cool - dt); ringHit = Math.max(0, ringHit - dt);
    if (!cool && P.layer === 'space' && !P.ride && P.grounded && Math.abs(P.y - y) < .3 && P.x > a + .2 && P.x < c - .2) { const big = k.api.keysUp && k.api.keysUp(); cool = .3; P.y = y + .05; P.vy = v * (big ? 1.4 : 1); P.grounded = false; P.jumps = 1; sq = 1; n++; k.Sound.boing();
      if (n === 1) k.fact('🤸 The canyon trampoline! Hold ▲ as you land and bounce right up onto the mesas!', 'marscanyontramp'); }
    if (!ringHit && P.layer === 'space' && Math.abs(P.x - (a + c) / 2) < 1.1 && Math.abs(P.y + .6 - (y + top * .85)) < .9) { ringHit = 1.5; k.Sound.tone(720, .2, 'sine', .07, 1.5); k.api.burst((a + c) / 2, y + top * .85, -1.2, RB, 14, 2); k.disc('marscanyonhoop', '🤸 Through the canyon hoop!'); } });
  k.tapIt(mat, () => k.fact('🤸 Bounce on the canyon trampoline! Hold ▲ to bounce up onto the mesas!', 'marscanyontramp'), (a + c) / 2, 'marscanyontramp');
  starField(k, [[a + 1.5, 6, -1.2], [c - 1.5, 8, -1.2], [(a + c) / 2, 3.5, -1.2]], () => { k.Sound.chime(); k.say('⭐ All the canyon stars!', true); k.disc('marscanyonstars'); });
}

// =================== (build 89) MARS: THE BOUNCE RACE ===================
// Five little trampolines in a row (area 2, x 47–60). Bounce along them: each one you land on lights its ring. Light all
// five in a row (left to right) and the stars burst out. Then they reset, so you can bounce the row again.
export function marsBounceRace(k) {
  const P = k.P, G0 = GEO(), X = k.s0, v = 6, tb = makeBatch(), xs = [47.5, 50.5, 53.5, 56.5, 59.5].map(d => X + d), gr = k.ground || (() => 0), ys = xs.map(tx => Math.max(0, gr(tx, -1.2)) + .4); /* (on the real ground) */
  for (const [i, tx] of xs.entries()) { const y = ys[i]; tb.put(G0.cyl, tx, y / 2, -1.2, '#5a6a8a', [.95, y, .95]); tb.put(G0.cyl, tx, y + .02, -1.2, RB[i % 7], [.8, .05, .8]); }
  k.add(tb.mesh(shinyMat()));
  const ringMat = toy('#ffffff', { em: '#ffffff', ei: .1 }), rings = xs.map((tx, i) => { const m = new THREE.Mesh(G0.torus, ringMat.clone()); m.position.set(tx, ys[i] + 2.4, -1.4); m.scale.setScalar(.7); m.material.emissive.set(RB[i % 7]); k.add(m); return m; });
  let next = 0, cool = 0, wins = 0, airX0 = null;
  const reset = () => { next = 0; rings.forEach(r => { r.material.emissiveIntensity = .1; }); };
  for (const [i, tx] of xs.entries()) k.plat(tx - .9, tx + .9, ys[i], { z: -1.2, step: true, stepMax: .6 });
  k.U.push(dt => { cool = Math.max(0, cool - dt); if (airX0 != null) { if (P.grounded || P.ride) airX0 = null; else P.x = Math.max(airX0 - 3, Math.min(airX0 + 3, P.x)); } /* (each bounce takes you at most to the next trampoline) */
    if (cool || P.layer !== 'space' || P.ride || !P.grounded) return; const i = xs.findIndex(tx => Math.abs(P.x - tx) < .9); if (i < 0 || Math.abs(P.y - ys[i]) > .3) return;
    cool = .3; airX0 = xs[i]; P.y = ys[i] + .05; P.vy = v; P.grounded = false; P.jumps = 1; { const dir = Math.sign(P.vx || 0) || (k.api.stick ? Math.sign(k.api.stick().x) : 0); P.vx = dir * 2.25; P.drift = dir * 2.25; P.driftT = 1.3; P.hopX = 0; } /* (one trampoline per bounce) */ k.Sound.tone(392 + i * 60, .12, 'triangle', .06, 1.5);
    if (i === next) { rings[i].material.emissiveIntensity = 1.4; next++; if (next === 1 && !wins) k.fact('🤸 The bounce race! Bounce along all five trampolines to light their rings!', 'marsbouncerace');
      if (next === 5) { wins++; k.Sound.chime(); for (const [j, tx] of xs.entries()) k.api.burst(tx, ys[j] + 2.4, -1.4, RB, 12, 2.2); k.say('⭐ All five! You won the bounce race!', true); k.disc('marsbouncewin'); setTimeout(reset, 2500); } }
    else if (i < next - 1 || i > next) reset(); });
  k.G.bounceRace = { get next() { return next; }, get wins() { return wins; }, xs };
}
