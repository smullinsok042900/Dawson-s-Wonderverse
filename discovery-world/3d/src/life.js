// ===================================================================
// life.js (build 23): makes every creature feel alive.
// One shared system drives every pet, buddy and critter:
//   * SPECIES profiles: how a creature moves (hop, trot, walk, waddle, fly, slide,
//     perch), how fast, how bouncy, how quickly it turns, and its personality.
//   * A small finite-state machine per creature: idle, look around, wander,
//     investigate, sit, sleep (and wake up with a stretch), get curious about the
//     player, react to jumps, get tapped, and follow the player.
//   * Steering: smooth acceleration, arrival, separation (no bunching or walking
//     through each other) and gentle turning (no snapping).
//   * Gaits driven by distance actually travelled (feet don't slide) that move the
//     real leg, head and tail bones of the sculpted creatures, on top of their own
//     breathing and blinking.
//   * Level of detail: creatures near the camera update every frame, further ones
//     every third frame, far ones not at all. No allocations per frame.
// ===================================================================
import * as THREE from 'three';

export const SPECIES = {
  //          gait       speed  bounce  stride  turn  wander  personality: curious, energy, sleepy
  dog:      { gait: 'trot',   v: 2.6, h: .05, stride: .9,  turn: 7, r: 2.2, cur: .9, en: .9, sl: .2, fwd: 'x', legs: 'quad' },
  lamb:     { gait: 'skip',   v: 2.0, h: .14, stride: .7,  turn: 6, r: 2.0, cur: .6, en: .7, sl: .4, fwd: 'x', legs: 'quad' },
  unicorn:  { gait: 'trot',   v: 2.2, h: .06, stride: 1.1, turn: 4, r: 1.6, cur: .5, en: .6, sl: .3, fwd: 'x', legs: 'quad' },
  pet:      { gait: 'hop',    v: 2.4, h: .26, stride: .55, turn: 8, r: 1.5, cur: 1,  en: 1,  sl: .3, fwd: 'z', legs: 'biped' },
  bunny:    { gait: 'hop',    v: 2.0, h: .3,  stride: .6,  turn: 8, r: 1.0, cur: .8, en: .8, sl: .3, fwd: 'z', legs: 'biped' },
  frog:     { gait: 'hop',    v: 1.8, h: .38, stride: .8,  turn: 9, r: 1.0, cur: .5, en: .7, sl: .4, fwd: 'z', legs: 'biped' },
  bear:     { gait: 'waddle', v: 1.2, h: .03, stride: .45, turn: 4, r: .7,  cur: .7, en: .4, sl: .6, fwd: 'z', legs: 'biped', roll: .07 },
  penguin:  { gait: 'waddle', v: 1.1, h: .04, stride: .3,  turn: 6, r: 1.0, cur: .8, en: .8, sl: .3, fwd: 'z', legs: 'biped', roll: .16 },
  beaver:   { gait: 'waddle', v: 1.3, h: .03, stride: .35, turn: 5, r: 1.0, cur: .6, en: .6, sl: .5, fwd: 'z', legs: 'biped', roll: .1 },
  hedgehog: { gait: 'walk',   v: 1.6, h: .02, stride: .25, turn: 8, r: 1.0, cur: .6, en: .8, sl: .5, fwd: 'z', legs: 'biped' },
  fox:      { gait: 'walk',   v: 2.0, h: .04, stride: .55, turn: 6, r: 1.0, cur: .9, en: .8, sl: .3, fwd: 'z', legs: 'biped' },
  person:   { gait: 'walk',   v: 1.3, h: .02, stride: .5,  turn: 5, r: .8,  cur: .7, en: .5, sl: 0,  fwd: 'z', legs: 'biped' },
  fairy:    { gait: 'fly',    v: 3.0, h: 0,   stride: 1,   turn: 6, r: 1.5, cur: 1,  en: 1,  sl: 0,  fwd: 'z', legs: 'none', hover: 1.2 },
  owl:      { gait: 'perch',  v: 0,   h: 0,   stride: 1,   turn: 3, r: 0,   cur: .4, en: .2, sl: .9, fwd: 'z', legs: 'none' },
  snail:    { gait: 'slide',  v: 0,   h: 0,   stride: 1,   turn: 2, r: 0,   cur: .2, en: .1, sl: .2, fwd: 'z', legs: 'none' },
};

const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

export function makeLife({ camera, emote = () => {}, chirp = () => {}, obstacles = [] }) {
  const agents = [];
  let frameNo = 0;

  // ---- a creature ----
  function add(o) {
    const sp = SPECIES[o.species] || SPECIES.pet;
    const a = {
      root: o.root, B: o.B || null, sp, kind: o.species, home: new THREE.Vector3().copy(o.home || o.root.position),
      radius: o.radius ?? sp.r, baseY: o.baseY ?? (o.home ? o.home.y : o.root.position.y), zMax: o.zMax ?? -1.0,
      x: o.root.position.x, z: o.root.position.z, y: o.baseY ?? o.root.position.y, vx: 0, vz: 0,
      yaw: o.root.rotation.y, yawOff: o.yawOff || 0, state: 'idle', timer: .5 + Math.random() * 2, tx: 0, tz: 0, arriveR: .25,
      phase: 0, landing: 0, lookX: 0, lookZ: 0, looking: 0, headYaw: 0, sit: 0, sleep: 0, stretch: 0, hopReact: 0, tapped: 0,
      follower: false, slot: 0, cool: 2 + Math.random() * 4, accum: 0, seed: Math.random() * 100,
      // personality: everyone's a little different
      cur: sp.cur * (.7 + Math.random() * .6), en: sp.en * (.7 + Math.random() * .6), sl: sp.sl * (.6 + Math.random() * .8),
      onLand: o.onLand, keepUpright: o.keepUpright, noTurn: !!o.noTurn, spin: 0, lastDir: 1,
    };
    agents.push(a); return a;
  }
  function remove(a) { const i = agents.indexOf(a); if (i >= 0) agents.splice(i, 1); }

  // ---- decisions (cheap; only when a timer runs out or something happens) ----
  function pickWander(a) {
    for (let k = 0; k < 5; k++) {
      const ang = Math.random() * TAU, r = a.radius * Math.sqrt(Math.random());
      const x = a.home.x + Math.cos(ang) * r, z = Math.min(a.zMax, a.home.z + Math.sin(ang) * r * .6);
      if (!obstacles.some(ob => (x - ob.x) ** 2 + (z - ob.z) ** 2 < ob.r * ob.r)) { a.tx = x; a.tz = z; return true; }
    }
    return false;
  }
  function decide(a, P, dPlayer) {
    if (a.sp.gait === 'perch' || a.sp.gait === 'slide') { a.state = Math.random() < a.sl * .5 ? 'sleep' : 'idle'; a.timer = 3 + Math.random() * 5; if (a.state === 'sleep') emote(a, '💤'); return; }
    const r = Math.random();
    if (dPlayer < 5.5 && a.cool <= 0 && r < a.cur * .5) { // curious: come and see the player
      a.state = 'curious'; a.timer = 6; a.cool = 8 + Math.random() * 8; emote(a, ['❓', '😊', '👋'][Math.floor(Math.random() * 3)]); chirp(a); return;
    }
    if (r < .45 * a.en && a.radius > 0 && pickWander(a)) { a.state = 'wander'; a.timer = 6; return; }
    if (r < .6) { a.state = 'look'; a.timer = 1.5 + Math.random() * 2.5; a.lookX = a.x + (Math.random() - .5) * 8; a.lookZ = a.z + 2 + Math.random() * 3; a.looking = 1; return; }
    if (r < .72 && a.sp.gait !== 'fly') { a.state = 'sit'; a.timer = 3 + Math.random() * 4; return; }
    if (r < .72 + .12 * a.sl && dPlayer > 6 && a.sp.gait !== 'fly') { a.state = 'sleep'; a.timer = 7 + Math.random() * 8; emote(a, '💤'); return; }
    if (r < .9) { a.state = 'play'; a.timer = 1.2 + Math.random(); return; }
    a.state = 'idle'; a.timer = 1.5 + Math.random() * 3;
  }

  // ---- the per-creature update ----
  function step(a, dt, t, P, ctx) {
    const dxP = P.x - a.x, dzP = (P.z ?? 0) - a.z, dPlayer = Math.hypot(dxP, dzP, (P.y - a.baseY) * .5);
    a.timer -= dt; a.cool -= dt; a.tapped = Math.max(0, a.tapped - dt); a.hopReact = Math.max(0, a.hopReact - dt); a.stretch = Math.max(0, a.stretch - dt);
    // reactions: the player jumped nearby / ran past / came close to a sleeper
    if (ctx.jumped && dPlayer < 6 && a.state !== 'sleep' && a.hopReact <= 0 && !a.tapped) { a.hopReact = .55 + (a.follower ? a.slot * .08 : Math.random() * .15); }
    if (a.state === 'sleep' && dPlayer < 2.6) { a.state = 'idle'; a.timer = 1.6; a.stretch = 1.2; emote(a, '❗'); chirp(a); }

    // where do I want to be?
    let tx = a.x, tz = a.z, speed = 0, maxV = a.sp.v;
    if (a.tapped > 0) { /* stay put and enjoy it */ }
    else if (a.follower) {
      const tp = ctx.trailAt(2 + a.slot * 3);
      const back = .85 + a.slot * .62, side = (a.slot % 2 ? .95 : .45);
      tx = tp[0] - P.facing * back; tz = tp[2] + side; a.baseY += (tp[1] - a.baseY) * Math.min(1, dt * 8);
      const far = Math.hypot(tx - a.x, tz - a.z);
      if (far > 16 || Math.abs(tp[1] - a.baseY) > 6) { a.x = tx; a.z = tz; a.baseY = tp[1]; emote(a, '✨'); }
      maxV = a.sp.v * (far > 2.5 ? 2.6 : far > 1 ? 1.6 : 1) + Math.abs(P.vx || 0) * 1.05; // catch up when you run
      a.state = far > .35 ? 'follow' : (ctx.playerStill > 1.5 ? (a.state === 'follow' || a.state === 'wander' ? 'idle' : a.state) : 'idle');
      if (a.state !== 'follow' && a.timer <= 0) { decideFollowerIdle(a); }
    } else {
      if (a.timer <= 0) decide(a, P, dPlayer);
      if (a.state === 'wander') { tx = a.tx; tz = a.tz; }
      if (a.state === 'curious') {
        const want = 1.7; if (dPlayer > want) { const k = (dPlayer - want) / dPlayer; tx = a.x + dxP * k; tz = Math.min(a.zMax, a.z + dzP * k * .5); }
        if (Math.hypot(a.x - a.home.x, a.z - a.home.z) > a.radius + 2.2 || a.timer <= 0) { a.state = 'wander'; a.tx = a.home.x; a.tz = a.home.z; a.timer = 6; }
      }
    }
    // steer: arrive at the target, keep apart from everyone, never through the player
    let ax = tx - a.x, az = tz - a.z; const dist = Math.hypot(ax, az);
    if (dist > a.arriveR) { const want = Math.min(maxV, dist * (a.follower ? 3.2 : 2.2)); ax = ax / dist * want; az = az / dist * want; speed = want; } else { ax = 0; az = 0; if (a.state === 'wander') { a.state = 'idle'; a.timer = .8 + Math.random() * 2; } }
    for (const b of agents) { if (b === a) continue; const sx = a.x - b.x, sz = a.z - b.z, d2 = sx * sx + sz * sz; if (d2 < .64 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (.8 - d) * 3.5; ax += sx / d * push; az += sz / d * push; } }
    { const sx = a.x - P.x, sz = a.z - (P.z ?? 0), d2 = sx * sx + sz * sz; if (d2 < .55 && d2 > 1e-6 && Math.abs(P.y - a.baseY) < 1.2) { const d = Math.sqrt(d2); ax += sx / d * (.75 - d) * 5; az += sz / d * (.75 - d) * 5; } }
    if (a.sp.gait === 'perch' || a.sp.gait === 'slide' || a.state === 'sit' || a.state === 'sleep' || a.tapped > 0) { ax = 0; az = 0; }
    // smooth acceleration (no instant starts or stops)
    const acc = Math.min(1, dt * (a.sp.gait === 'fly' ? 3 : 6)); a.vx += (ax - a.vx) * acc; a.vz += (az - a.vz) * acc;
    const v = Math.hypot(a.vx, a.vz);
    a.x += a.vx * dt; a.z += a.vz * dt;

    // turning: face where I'm going; otherwise the player (if near) or what I'm looking at; never snap
    let wantYaw = a.yaw;
    const yawOf = (dx, dz) => a.sp.fwd === 'x' ? Math.atan2(-dz, dx) : Math.atan2(dx, dz);
    if (Math.abs(a.vx) > .3) a.lastDir = Math.sign(a.vx);
    if (v > .25) wantYaw = yawOf(a.vx, a.vz);
    else if (a.tapped > 0 || a.state === 'curious' || (a.follower && dPlayer < 6) || dPlayer < 3.2) wantYaw = yawOf(dxP, dzP + 2.5); // toward the player, a little toward the camera too
    else if (a.state === 'look') wantYaw = yawOf(a.lookX - a.x, a.lookZ - a.z);
    else wantYaw = yawOf(a.lastDir * .9, 1); // resting: a three-quarter view towards the camera
    if (a.spin > 0) { a.spin -= dt; a.yaw += dt * 9; } else if (a.state !== 'sleep' && !a.noTurn) a.yaw += clamp(angDiff(a.yaw, wantYaw), -a.sp.turn * dt, a.sp.turn * dt);

    // the gait: phase advances with distance actually travelled (so feet don't slide)
    const g = a.sp.gait; let bob = 0, roll = 0, pitch = 0, sy = 1;
    const prevFrac = a.phase % 1;
    if (g === 'hop' || g === 'skip') {
      if (v > .2 || prevFrac > .05) a.phase += Math.max(v, 1.4) * dt / a.sp.stride;
      const f = a.phase % 1; if (f < prevFrac) { a.landing = .18; a.onLand && a.onLand(); }
      bob = a.sp.h * Math.sin(Math.PI * f) * (g === 'skip' ? (Math.floor(a.phase) % 2 ? .6 : 1) : 1); pitch = -Math.cos(Math.PI * f) * .18 * Math.min(1, v);
      a.landing = Math.max(0, a.landing - dt); sy = 1 - a.landing * .8 + Math.sin(Math.PI * f) * .06;
    } else if (g === 'trot' || g === 'walk' || g === 'waddle') {
      a.phase += v * dt / a.sp.stride; const s = Math.sin(TAU * a.phase); bob = Math.abs(s) * a.sp.h * Math.min(1, v); roll = g === 'waddle' ? s * a.sp.roll * Math.min(1, v * 1.5) : 0; pitch = -Math.min(.12, v * .03);
    } else if (g === 'fly') {
      bob = a.sp.hover + Math.sin(t * 2.6 + a.seed) * .16; roll = clamp(-a.vx * .08, -.3, .3);
    }
    // little reactions on top: a happy hop, a sit, a stretch, falling asleep
    if (a.hopReact > 0) bob += Math.sin((1 - a.hopReact / .55) * Math.PI) * .35;
    if (a.tapped > 0) { const k = 1 - a.tapped / 1.6; bob += Math.abs(Math.sin(k * Math.PI * 3)) * .4 * (1 - k); }
    if (a.state === 'play' && a.radius > 0) { bob += Math.abs(Math.sin((t + a.seed) * 7)) * .22; a.yaw += dt * 5; }
    a.sit += ((a.state === 'sit' || a.state === 'sleep' ? 1 : 0) - a.sit) * Math.min(1, dt * 3);
    a.sleep += ((a.state === 'sleep' ? 1 : 0) - a.sleep) * Math.min(1, dt * 2);
    if (a.stretch > 0) sy *= 1 + Math.sin((1 - a.stretch / 1.2) * Math.PI) * .12;
    sy *= 1 - a.sit * .08;

    // write the transform (base y + gait)
    a.y = a.baseY; a.root.position.set(a.x, a.baseY + bob - a.sit * .03, a.z);
    a.root.rotation.set(0, a.yaw + a.yawOff, 0);
    if (!a.keepUpright) { a.root.rotation.z = roll; if (a.sp.fwd === 'x') a.root.rotation.z += pitch; else a.root.rotation.x = -pitch + a.sleep * .15; }
    a.root.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    const sh = a.root.userData.shadow; if (sh) { const lift = a.root.position.y - a.baseY; sh.position.y = (.015 - lift) / sy; sh.scale.setScalar(Math.max(.45, 1 - lift * .8)); sh.material.opacity = .85 * Math.max(.4, 1 - lift); }

    // bones: legs swing with the gait, the head turns to what interests me, the tail wags when happy
    const B = a.B; if (!B) return;
    const amp = Math.min(1, v / Math.max(.5, a.sp.v)) * (a.sp.legs === 'quad' ? .55 : .6), s = Math.sin(TAU * a.phase);
    if (a.sp.legs === 'quad') {
      const set = (n, ang) => { if (B[n]) B[n].rotation.z = ang; };
      if (g === 'skip') { set('legFL', s * amp); set('legFR', s * amp); set('legBL', -s * amp); set('legBR', -s * amp); }
      else { set('legFL', s * amp); set('legBR', s * amp); set('legFR', -s * amp); set('legBL', -s * amp); }
    } else if (a.sp.legs === 'biped') {
      const hopFold = (g === 'hop') ? -Math.sin(Math.PI * (a.phase % 1)) * .5 * Math.min(1, v) : 0;
      if (B.legL) B.legL.rotation.x = g === 'hop' ? hopFold : s * amp - a.sit * .9;
      if (B.legR) B.legR.rotation.x = g === 'hop' ? hopFold : -s * amp - a.sit * .9;
      if (!ctx.armBusy(a)) { if (B.armL) B.armL.rotation.x = -s * amp * .6; if (B.armR) B.armR.rotation.x = s * amp * .6; }
    }
    // head: look at the player when near / curious / tapped, or at a point of interest; nod off when asleep
    let hy = 0;
    if (a.state === 'look' || a.state === 'curious' || a.tapped > 0 || dPlayer < 4 || a.follower) {
      const lx = a.state === 'look' ? a.lookX : P.x, lz = a.state === 'look' ? a.lookZ : (P.z ?? 0) + 2;
      hy = clamp(angDiff(a.yaw, yawOf(lx - a.x, lz - a.z)), -.7, .7);
    } else hy = Math.sin(t * .5 + a.seed) * .25;
    a.headYaw += (hy - a.headYaw) * Math.min(1, dt * 4);
    const head = B.head || B.neck;
    if (head) { head.rotation.y = a.headYaw; head.rotation.x = a.sleep * .35 + (a.state === 'look' ? Math.sin(t * 2 + a.seed) * .08 : 0); }
    if (B.tail && (a.tapped > 0 || a.state === 'curious' || a.state === 'play' || (a.follower && v > .3))) B.tail.rotation.y = Math.sin(t * 16 + a.seed) * .6;
  }
  function decideFollowerIdle(a) {
    const r = Math.random();
    if (r < .25 && a.sp.gait !== 'fly') { a.state = 'sit'; a.timer = 2.5 + Math.random() * 3; }
    else if (r < .45) { a.state = 'play'; a.timer = .9 + Math.random() * .6; }
    else if (r < .7) { a.state = 'look'; a.timer = 1.5 + Math.random() * 2; a.lookX = a.x + (Math.random() - .5) * 6; a.lookZ = a.z + 2; }
    else { a.state = 'idle'; a.timer = 1.5 + Math.random() * 2; }
    if (Math.random() < .25) emote(a, ['💖', '😊', '🎵'][Math.floor(Math.random() * 3)]);
  }

  // ---- the world calls this once per frame ----
  function update(dt, t, P, ctx) {
    frameNo++;
    const cx = camera.position.x, cz = camera.position.z;
    for (const a of agents) {
      const d = Math.hypot(a.x - cx, a.z - cz);
      // far away: no work at all, and (build 25) off the scene too, so its skeleton isn't updated every frame
      if (!a.follower && d > 60) { if (a.root.parent && !a.detached) { a.detached = a.root.parent; a.detached.remove(a.root); } continue; }
      if (a.detached) { a.detached.add(a.root); a.detached = null; }
      if (!a.follower && d > 48) continue;
      if (!a.follower && d > 22) { a.accum += dt; if ((frameNo + (a.seed | 0)) % 3) continue; step(a, a.accum, t, P, ctx); a.accum = 0; continue; } // mid-distance: every 3rd frame
      step(a, dt, t, P, ctx);
    }
  }
  return { add, remove, update, agents, tap(a, secs = 1.6, spin = 0) { a.tapped = secs; a.spin = spin; a.state = 'idle'; a.timer = secs + .5; a.sleep = 0; }, setFollower(a, on, slot = 0) { if (on && a.detached) { a.detached.add(a.root); a.detached = null; } a.follower = on; a.slot = slot; a.state = 'idle'; a.timer = .5; if (!on) { a.home.set(a.x, a.baseY, a.z); a.radius = Math.min(a.sp.r, 1); } } };
}
