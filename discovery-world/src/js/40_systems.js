// ===================================================================
// 40_systems.js — physics, rides and the connected cause→effect chain:
//   paint buckets → mixing bowl → (spin) → pipe → bubble machine tank →
//   colored bubbles drift into the Wonder Engine funnel → battery fills →
//   lever ON → power flows down the cable → Star Launcher wakes, wheel &
//   coaster light up, coaster train wears YOUR mixed color, magnet gets strong.
// ===================================================================
Object.assign(world, { blowT: 0, feedT: 0, feedColor: null, needPaintT: 0, pendingPours: [], lookAhead: 0 });

function discover(id, msg, x, y) {
  if (world.discoveries.has(id)) return false;
  world.discoveries.add(id); updateCounter();
  burst(x ?? player.x, y ?? player.y - 100, 22); Sound.chime();
  if (msg) toast('✨ ' + msg);
  player.anim.happy = 1.4; save(); return true;
}

// ---------------- color mixer ----------------
const COLOR_NAMES = { r: 'Pink', y: 'Yellow', b: 'Blue', ry: 'Orange', by: 'Green', br: 'Purple', bry: 'Muddy Brown' };
function mixName(portions) { const k = [...new Set(portions)].sort().join(''); return COLOR_NAMES[k] || 'Mystery'; }
function pour(k) {
  if (world.portions.length + world.pendingPours.length >= 4) { world.spinnerWiggle = 1; Sound.click(); return; }
  world.bucketTilt[k] = 1; world.pendingPours.push({ k, t: 0 }); Sound.pour();
}
function stirAndPump() {
  if (world.stir > 0) return;
  world.stir = 1; world.mixSpinV = 14; Sound.whoosh();
  if (!world.portions.length) { ['r', 'y', 'b'].forEach(k => world.bucketTilt[k] = .35); return; }
}
function finishMix() {
  const color = mixPortions(world.portions); if (!color) return;
  const uniq = [...new Set(world.portions)];
  const formula = uniq.length > 1 ? uniq.map(k => PAINTS[k].name[0].toUpperCase() + PAINTS[k].name.slice(1)).join(' + ') + ' = ' + mixName(world.portions) + '!' : mixName(world.portions) + ' paint!';
  world.portions.forEach((_, i) => world.pipeBlobs.push({ s: -i * .09, color }));
  world.lastMix = color; world.portions = [];
  updatePaintTools();
  toast('🎨 ' + formula);
  discover('mixpaint', null, 2190, 280);
  burst(2190, 280, 18, [color, '#fff', shade(color, .3)], 'drop');
  save();
}
// ---------------- bubbles ----------------
function blow() {
  world.blowT = .3;
  const B = LAYOUT.bubbler, [nx, ny] = B.nozzle;
  const colored = world.tank.amount > 0 && world.tank.color, color = colored ? world.tank.color : null;
  for (let i = 0; i < 6; i++) world.bubbles.push({ x: nx + 10 + rand(-8, 8), y: ny - 34 + rand(-6, 6), r: rand(13, 24), vx: rand(15, 90), vy: rand(-110, -40), life: rand(9, 13), color, hue: rand(170, 330), seed: rand(0, 9), ride: false });
  if (!world.bubbles.some(b => b.ride)) world.bubbles.push({ x: nx - 30, y: ny - 60, r: 64, vx: 20, vy: -30, life: 14, color, hue: rand(180, 320), seed: rand(0, 9), ride: true });
  if (colored) { world.tank.amount--; if (world.tank.amount <= 0) { world.tank.amount = 0; } }
  [0, 1, 2, 3].forEach(i => Sound.tone(500 + i * 120, .09, 'sine', .05, 1.6, i * .06));
  discover('bubbles', colored ? 'Painted bubbles! Watch where they float…' : 'Bubbles! Mix paint to color them!', nx, ny - 40);
  if (world.tank.amount === 0 && colored) world.tank.color = null;
  save();
}
function popBubble(b, quiet) {
  const i = world.bubbles.indexOf(b); if (i < 0) return;
  world.bubbles.splice(i, 1);
  burst(b.x, b.y, b.ride ? 16 : 8, b.color ? [b.color, '#fff'] : ['#fff', '#bdf3ff', '#ffd0f0'], 'dot', b.ride ? 1.2 : .7);
  if (!quiet) Sound.pop();
  if (player.ride && player.ride.b === b) { player.ride = null; player.vy = -250; player.jumps = 1; player.grounded = false; }
}
function feedEngine(b) {
  const i = world.bubbles.indexOf(b); if (i >= 0) world.bubbles.splice(i, 1);
  world.funnelWiggle = .6; world.feedT = 1; world.feedColor = b.color || '#ffffff';
  const [fx, fy] = LAYOUT.engine.funnel;
  if (b.color && world.battery.length < 6) {
    world.battery.push(b.color);
    Sound.tone(440 * 2 ** (world.battery.length / 6), .25, 'triangle', .06, 1.5);
    burst(fx, fy, 10, [b.color, '#fff'], 'dot');
    discover('feed', 'Colored bubbles charge the Wonder Engine!', fx, fy);
    if (world.battery.length === 6) {
      discover('charged', 'Battery full of color! Pull the lever!', 2900, 300);
      if (world.labOn) powerUp(); else world.leverWiggle = 2;
    }
    save();
  } else if (!b.color) {
    world.needPaintT = 3; burst(fx, fy, 8, ['#d9d2e6', '#ffffff'], 'dot', .6); Sound.tone(180, .2, 'sine', .05, .7);
  } else burst(fx, fy, 8, [b.color, '#fff36b'], 'star');
}
// ---------------- Wonder Engine / power ----------------
function toggleLever() {
  world.labOn = !world.labOn; world.leverWiggle = 0; Sound.hum(world.labOn); Sound.click();
  const [lx, ly] = LAYOUT.engine.lever; burst(lx, ly - 30, 10);
  discover('lever', 'Flip the Wonder Engine lever!', lx, ly - 40);
  if (world.labOn && world.battery.length >= 6) powerUp();
  else if (!world.labOn && world.powered) { world.powered = false; Sound.tone(400, .5, 'sine', .05, .3); }
  else if (world.labOn) world.funnelWiggle = 1.5, world.needPaintT = 3;
  save();
}
function powerUp() {
  if (world.powered) return;
  world.powered = true; world.powerT = 1;
  Sound.chime(); Sound.whoosh();
  burst(2900, 330, 30, world.battery.concat(['#fff', '#fff36b']));
  discover('power', 'POWER ON! The park lights up and the Star Launcher wakes up!', 2900, 260);
  save();
}
function tapEngine() {
  if (world.powered) { world.gearSpeed += 6; Sound.giggle(); burst(2985, 352, 10); return; }
  if (world.battery.length < 6) { world.funnelWiggle = 1.5; world.needPaintT = 3; Sound.tone(260, .15, 'sine', .05, .8); }
  else { world.leverWiggle = 2; Sound.click(); }
}
function toggleMagnet() {
  world.magnetOn = !world.magnetOn; Sound.hum(world.magnetOn);
  burst(LAYOUT.magnet.c[0], LAYOUT.magnet.c[1] + 30, 12);
  discover('magnet', 'The magnet pulls the shiny metal balls!', LAYOUT.magnet.c[0], 200);
  save();
}
// ---------------- launcher ----------------
function tapLauncher() {
  const L = LAYOUT.launcher;
  if (!world.powered) {
    world.sleepyT = 3.5; Sound.tone(420, .6, 'sine', .05, .45);
    discover('sleepy', 'The Star Launcher is asleep. It needs power from the Wonder Engine!', L.cx, 260);
    return;
  }
  if (player.ride || Math.abs(player.x - L.cx) > 420) { burst(L.cx, L.y, 10); Sound.click(); return; }
  player.x = L.cx; player.y = L.y; launch();
}
function launch() {
  const P = player; P.vx = 470; P.vy = -900; P.grounded = false; P.jumps = 1; P.launched = true; P.padTime = 0; P.facing = 1;
  Sound.whoosh(); Sound.boing(); burst(P.x, P.y, 26, ['#fff36b', '#ff6fae', '#6fe3ff', '#fff']);
  animJump(P.anim, P.creature, 2);
  discover('launch', '3, 2, 1… BLAST OFF across the park!', P.x, P.y - 120);
}
// ---------------- rides ----------------
function startSlide(path, k) { const P = player; P.ride = { type: 'slide', s: .02, path, k: k || 1 }; P.vy = 0; P.facing = 1; discover(path ? 'bigslide' : 'slide', path ? 'The GIANT slide! Wheee!' : 'Wheee! Ride the giant rainbow slide.', P.x, P.y - 100); }
function startSlideTap() { const P = player; P.x = SLIDE[0][0]; P.y = SLIDE[0][1]; startSlide(); }
function rideWheel() {
  const P = player; if (P.ride) return;
  // board the gondola nearest the bottom
  let best = 0, bd = 9;
  for (let i = 0; i < 10; i++) { const a = world.wheelAngle + i * Math.PI / 5, d = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))); if (d < bd) { bd = d; best = i; } }
  P.ride = { type: 'wheel', i: best, traveled: 0 }; P.vx = P.vy = 0;
  discover('wheel', 'Up, up, up on the giant wheel!', LAYOUT.wheel.cx, 150); Sound.click();
}
function rideCoaster() { const P = player; if (P.ride) return; P.ride = { type: 'coaster', u: 0 }; P.vx = P.vy = 0; discover('coaster', 'Zoom on the roller coaster!', 4600, 250); Sound.click(); }
function rideCarousel() {
  const P = player; if (P.ride) return;
  let best = 0, bd = -9; MOUNTS.forEach((_, i) => { const m = carouselMount(i); if (m.depth > bd) { bd = m.depth; best = i; } });
  P.ride = { type: 'carousel', i: best, turned: 0 }; P.vx = P.vy = 0; Sound.chime();
  discover('carousel', 'Round and round on the magic carousel!', LAYOUT.carousel.cx, 120);
}
// The big PAW button: do the most useful thing near the creature (no aiming needed)
function doAction() {
  const P = player; if (!started) return;
  if (P.ride) { jump(); return; }
  const door = nearDoor(); if (door) { door.go(); return; }
  let best = null, bd = 1e9;
  for (const it of INTERACT) {
    if ((it.need && !it.need()) || (it.layer !== 'any' && (it.layer || '') !== layerKey())) continue;
    const hx = it.hint ? it.hint[0] : (it.box[0] + it.box[2]) / 2, hy = it.hint ? it.hint[1] : (it.box[1] + it.box[3]) / 2;
    const d = Math.abs(hx - P.x) - (it.force && it.force() ? 400 : 0) - (it.hint ? 40 : 0);
    if (Math.abs(hx - P.x) < 240 && d < bd) { bd = d; best = { it, hx, hy }; }
  }
  if (best) { best.it.tap({ x: best.hx, y: best.hy }); return; }
  animReact(P.anim, P.creature); Sound.giggle(); burst(P.x, P.y - 130, 8, ['#ff8fc8', '#ffd84a', '#ff6fae'], 'heart', .7);
}
const TUBE_PATH = [[LAYOUT.tube.x, 430], [LAYOUT.tube.x, LAYOUT.tube.y], [300, LAYOUT.tube.y], [300, LAYOUT.tube.drop]];
function rideTube() { const P = player; if (P.ride) return; P.ride = { type: 'tube', d: 0 }; P.vx = P.vy = 0; Sound.whoosh(); discover('tube', 'Whoosh! The tube zooms all the way back to the ball pit!', LAYOUT.tube.x, 300); }
function tubePoint(d) {
  for (let i = 1; i < TUBE_PATH.length; i++) { const a = TUBE_PATH[i - 1], b = TUBE_PATH[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= L) return [lerp(a[0], b[0], d / L), lerp(a[1], b[1], d / L), i]; d -= L; }
  return null;
}
function tapTramp() {
  world.tramp.v += 420; Sound.boing();
  const P = player; if (!P.ride && Math.abs(P.x - LAYOUT.tramp.cx) < 260 && P.grounded) { P.x = clamp(P.x, LAYOUT.tramp.a + 10, LAYOUT.tramp.b - 10); bounce(930); }
  balls.forEach(b => { if (b.x > LAYOUT.tramp.a && b.x < LAYOUT.tramp.b) b.vy = -700; });
}
function tapPit(p) { if (inPit()) { diveThroughPit(); return; } world.pitJiggle = 1.2; burst(p.x, 420, 12, ['#65dcec', '#ffda68', '#b587ff', '#ff67ab'], 'dot'); Sound.pop(); discover('ballpit', 'Splash into the giant ball pit!', p.x, 380); }
function bounce(v) {
  const P = player; P.vy = -v; P.grounded = false; P.jumps = 1; P.y = LAYOUT.tramp.y - 1; world.tramp.v += 520;
  Sound.boing(); burst(P.x, LAYOUT.tramp.y, 12, ['#fff16e', '#fff', '#ff9bd2']); animJump(P.anim, P.creature, 1);
  discover('trampoline', 'Boing! Super-bounce on the trampoline!', P.x, 330);
}
function jump() {
  const P = player;
  if (!started || paused) return;
  if (P.ride) {
    if (jumpOffBigRide()) return;
    if (P.ride.type === 'tube' || P.ride.type === 'slide') return;
    if (P.ride.type === 'bubble') { popBubble(P.ride.b); return; }
    P.ride = null; P.vy = -560; P.jumps = 1; P.grounded = false; animJump(P.anim, P.creature, 1); Sound.jump(1); return;
  }
  const climb = climbZoneAt(P.x, P.y); // touching the net or a ladder: JUMP climbs it
  if (climb) { startClimb(climb); return; }
  if (P.jumps < 2) {
    const n = P.jumps + 1, J = CREATURES[P.creature].jump;
    P.vy = -J[n - 1]; P.jumps = n; P.grounded = false;
    Sound.jump(n); animJump(P.anim, P.creature, n);
    burst(P.x, P.y - (n === 2 ? 60 : 0), 8, ['#ffec83', '#fff', '#a9efff']);
    if (n === 2) discover('doublejump', 'Double jump! Reach the high places.', P.x, P.y - 160);
  }
}

// ---------------- interactable registry (tap targets, in priority order) ----------------
const INTERACT = [
  { box: [2084, 160, 2140, 236], hint: [2112, 196], disc: 'pour', priority: true, tap: () => pour('r') },
  { box: [2162, 150, 2218, 228], hint: [2190, 188], disc: 'pour', priority: true, tap: () => pour('y') },
  { box: [2240, 160, 2296, 236], hint: [2268, 196], disc: 'pour', priority: true, tap: () => pour('b') },
  { box: [2150, 355, 2245, 440], priority: true, tap: stirAndPump },
  { box: [2508, 386, 2590, 428], priority: true, tap: () => blow() },
  { box: [3020, 340, 3078, 440], priority: true, tap: () => toggleLever() },
  { box: [2120, 255, 2262, 340], disc: 'mixpaint', tap: stirAndPump },
  { box: [2140, 345, 2255, 450], hint: [2190, 395], disc: 'mixpaint', force: () => world.portions.length > 0 && !world.stir, tap: stirAndPump },
  { box: [2040, 320, 2340, 450], tap: stirAndPump },
  { box: [2400, 225, 2645, 450], hint: [2548, 400], disc: 'bubbles', force: () => world.tank.amount > 0, tap: blow },
  { box: [3008, 325, 3084, 450], hint: [3046, 345], disc: 'lever', force: () => !world.labOn && world.battery.length >= 6, tap: toggleLever },
  { box: [2715, 135, 2870, 240], tap: tapEngine },
  { box: [2720, 300, 3008, 450], tap: tapEngine },
  { box: [3160, 140, 3462, 450], hint: [3310, 225], disc: 'magnet', tap: toggleMagnet },
  { box: [3545, 200, 3705, 452], hint: [3625, 410], disc: 'launch', need: () => world.powered, tap: tapLauncher },
  { box: [3900, 105, 4222, 452], hint: [4060, 262], disc: 'wheel', tap: rideWheel },
  { box: [4380, 200, 5360, 452], hint: [4440, 360], disc: 'coaster', tap: rideCoaster },
  { box: [5520, 40, 5880, 452], hint: [5700, 300], disc: 'carousel', tap: rideCarousel },
  { box: [6166, 362, 6214, 402], hint: [6190, 382], disc: 'dispenser', priority: true, tap: dispense },
  { box: [6672, 150, 6790, 232], hint: [6730, 200], disc: 'xylophone', priority: true, tap: tapXylo },
  { box: [6150, 100, 6232, 450], tap: dispense },
  { box: [6520, 330, 6558, 400], priority: true, tap: dispense },
  { box: [6775, 270, 6915, 452], hint: [6845, 390], disc: 'tube', tap: rideTube },
  { box: [688, 236, 784, 360], hint: [737, 300], disc: 'climbnet', tap: () => tapClimb(CLIMBS[0]) },
  { box: [2682, 296, 2728, 452], hint: [2705, 380], disc: 'ladder', tap: () => tapClimb(CLIMBS[1]) },
  { box: [1378, 136, 1446, 204], hint: [1416, 176], disc: 'zipline', tap: tapZip },
  { box: [880, 280, 1180, 452], hint: [990, 345], disc: 'slide', tap: startSlideTap },
  { box: [630, 380, 835, 452], hint: [735, 428], disc: 'trampoline', tap: tapTramp },
  { box: [110, 380, 615, 472], hint: [365, 425], disc: 'ballpit', tap: tapPit },
];
const EXTRA_HINTS = [
  { hint: [1680, 250], disc: 'paint' }, { hint: [430, 370], disc: 'balls' },
];
// Small machine buttons win even if a loose ball has rolled in front of them.
function activatePriority(p) {
  for (const it of INTERACT) { if (!it.priority) continue; const [x1, y1, x2, y2] = it.box; if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) { it.tap(p); return true; } }
  return false;
}
function activate(p) {
  for (const it of INTERACT) { const [x1, y1, x2, y2] = it.box; if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) { it.tap(p); return true; } }
  return false;
}
function hintTarget() {
  // Picture-only guidance: point at the nearest thing not yet tried, or at the next
  // step of the paint→bubble→power chain when it is ready ("force").
  let best = null, bd = 1e9;
  for (const it of INTERACT.concat(EXTRA_HINTS)) {
    if (!it.hint || (it.need && !it.need()) || (it.layer !== 'any' && (it.layer || '') !== layerKey())) continue;
    if (!(it.force && it.force()) && world.discoveries.has(it.disc)) continue;
    if (!cull(it.hint[0], 0)) continue;
    const d = Math.abs(it.hint[0] - player.x); if (d < bd) { bd = d; best = it.hint; }
  }
  return best;
}
// ---------------- per-frame update ----------------
function updatePlayer(dt) {
  const P = player;
  if (P.ride && P.ride.type !== 'climb' && (P.under || P.inside)) { P.under = false; P.inside = null; } // rides are above ground
  if (P.ride) updateRide(dt);
  else {
    const h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (h) P.facing = h;
    // after a launch, keep the flight momentum unless the child steers
    if (!P.launched || h) { const accel = P.launched ? 420 : P.grounded ? 2600 : 1600; P.vx += clamp(h * 310 - P.vx, -accel * dt, accel * dt); }
    const lk = layerKey(), [lx1, lx2] = layerBounds();
    P.x = clamp(P.x + P.vx * dt, lx1, lx2);
    if (P.x <= lx1 || P.x >= lx2) P.vx = 0;
    const oldY = P.y, wasGrounded = P.grounded;
    P.vy = Math.min(P.vy + GRAV * dt, 1400); P.y += P.vy * dt; P.grounded = false;
    if (P.vy >= 0) {
      for (const z of PLATFORMS) {
        if (P.x < z.a || P.x > z.b || (z.layer || '') !== lk) continue;
        const stepUp = z.step && wasGrounded && P.y >= z.y && P.y - z.y <= 58;
        if ((oldY <= z.y + 2 && P.y >= z.y) || stepUp) { const impact = P.vy; P.y = z.y; P.vy = 0; P.grounded = true; if (z.onLand) z.onLand(z, impact); break; }
      }
    }
    const fy = floorY(); if (P.y >= fy) { P.y = fy; P.vy = 0; P.grounded = true; }
    depthPhysics();
    const T = LAYOUT.tramp;
    if (lk === '' && P.x > T.a && P.x < T.b && P.y >= T.y - 2 && P.vy >= 0 && P.y <= GROUND) bounce(clamp(Math.max(930, (P.vy || 0) * 1.02), 930, 1040));
    if (P.grounded) { P.jumps = 0; P.launched = false; }
    // walking off the top of the Sky Tower / slide tower 2 onto the giant slides
    if (P.grounded && P.y === -60 && P.x > 8058 && P.vx > 30) startBigSlide(0);
    if (P.grounded && P.y === 150 && P.x > 12318 && P.x < 12340 && P.vx > 30) startBigSlide(1);
    // walking off the top of the tower onto the slide
    if (P.grounded && P.y === 319 && P.x > 962 && P.vx > 30) startSlide();
    // walking off the lookout onto the zipline
    if (P.grounded && P.y === 213 && P.x > 1386 && P.vx > 30) startZip();
    // walking into the tube door
    const [d1, d2] = LAYOUT.tube.door;
    if (lk === '' && P.grounded && P.y === GROUND && P.x > d1 + 12 && P.x < d2) rideTube();
    // standing on the powered launch pad
    const L = LAYOUT.launcher;
    if (world.powered && P.grounded && P.y === L.y && P.x > L.a && P.x < L.b) { P.padTime += dt; if (P.padTime > .75) launch(); }
    else P.padTime = 0;
    if (P.grounded && P.x > LAYOUT.pit.a && P.x < LAYOUT.pit.b && P.y === GROUND && Math.abs(P.vx) > 40) world.pitJiggle = Math.max(world.pitJiggle, .6);
  }
  // secret stars (collectable while walking, jumping, or riding)
  for (const s of SECRET_STARS) {
    if (world.stars.has(s.id)) continue;
    if (Math.hypot(P.x - s.x, P.y - 75 - s.y) < 62) {
      world.stars.add(s.id); burst(s.x, s.y, 30, ['#ffd84a', '#fff3a6', '#fff']); Sound.chime();
      toast(`🌟 Secret star ${world.stars.size} of ${SECRET_STARS.length}!`); world.discoveries.add('secret-' + s.id); updateCounter(); P.anim.happy = 1.5; save();
    }
  }
  const hanging = !!P.ride && (P.ride.type === 'climb' || P.ride.type === 'zip');
  const seated = !!P.ride && P.ride.type !== 'bubble' && !hanging;
  updateAnim(P.anim, P.creature, dt, {
    vx: P.vx, vy: P.vy, grounded: P.grounded || (!!P.ride && !hanging), seated, facing: P.facing, x: P.x, y: P.y,
    onLand: v => { Sound.land(); world.stickerJig = 1; burst(P.x, P.y - 4, Math.min(12, v / 70), ['#ffffff', '#ffe9f6'], 'dot', .5); },
  });
}
function updateRide(dt) {
  if (updateClimbZip(dt) || updateBigRide(dt)) return;
  const P = player, R = P.ride;
  if (R.type === 'slide') {
    R.s += dt * (.42 + R.s * 1.15) * R.k;
    const p = slidePos(Math.min(1, R.s), R.path); P.x = p[0]; P.y = p[1] - 8; P.vx = 320; P.vy = 0;
    if (Math.random() < .3) burst(P.x - 20, P.y, 1, ['#fff', '#ffe36e'], 'star', .3);
    if (R.s >= 1) { P.ride = null; P.y = GROUND; P.vx = 330; P.grounded = true; burst(P.x, GROUND - 10, 18); Sound.land(); }
  } else if (R.type === 'wheel') {
    const W = LAYOUT.wheel, a = world.wheelAngle + R.i * Math.PI / 5;
    R.traveled += world.wheelSpin * dt;
    P.x = W.cx + Math.cos(a) * W.r; P.y = W.cy + Math.sin(a) * W.r + 36; P.vx = 0; P.vy = 0;
    if (R.traveled > TAU && Math.sin(a) > .97) { P.ride = null; P.x = W.cx + 110; P.y = 410; P.grounded = true; }
  } else if (R.type === 'coaster') {
    const C = LAYOUT.coaster, x = lerp(C.a, C.b, R.u), slope = (coasterY(x + 6) - coasterY(x - 6)) / 12;
    R.u += dt * (.1 + clamp(slope, -1, 1) * .05);
    world.coasterU = Math.min(1, R.u);
    const nx = lerp(C.a, C.b, world.coasterU); P.vx = (nx - P.x) / Math.max(dt, .001); P.x = nx; P.y = coasterY(nx) - 14; P.facing = 1;
    if (R.u >= 1) { P.ride = null; P.x = C.b + 110; P.y = GROUND; P.vx = 0; P.grounded = true; burst(P.x, GROUND - 60, 30); Sound.chime(); }
  } else if (R.type === 'bubble') {
    const b = R.b; P.x = b.x; P.y = b.y + b.r * .62; P.vx = b.vx; P.vy = 0;
    const h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); if (h) P.facing = h;
  } else if (R.type === 'carousel') {
    const m = carouselMount(R.i); R.turned += world.carSpeed * dt;
    P.x = m.x; P.y = m.y + 6; P.vx = m.facing * 120; P.vy = 0; P.facing = m.facing;
    if (R.turned > TAU * 1.5 && m.depth > .92) { P.ride = null; P.y = GROUND; P.vx = 0; P.grounded = true; P.x = m.x; }
  } else if (R.type === 'tube') {
    R.d += dt * 1900;
    const p = tubePoint(R.d);
    if (!p) { P.ride = null; P.x = 300; P.y = LAYOUT.tube.drop; P.vx = 60; P.vy = 0; P.grounded = false; P.jumps = 1; world.pitJiggle = 1.5; Sound.boing(); }
    else { P.vx = (p[0] - P.x) / Math.max(dt, .001); P.x = p[0]; P.y = p[1] + 20; P.facing = P.vx < 0 ? -1 : 1; }
  }
}
function updateWorld(dt, t) {
  // mixer
  for (const k of ['r', 'y', 'b']) world.bucketTilt[k] = Math.max(0, world.bucketTilt[k] - dt * 1.6);
  for (let i = world.pendingPours.length - 1; i >= 0; i--) {
    const p = world.pendingPours[i]; p.t += dt;
    if (p.t > .55) { world.pendingPours.splice(i, 1); world.portions.push(p.k); Sound.pop(); discover('pour', 'Pour paint into the mixing bowl!', 2190, 260); save(); }
  }
  world.mixSpinV = (world.mixSpinV || 0) * Math.exp(-dt * 1.4); world.mixSpin += (world.mixSpinV + .3) * dt;
  if (world.stir > 0) { world.stir -= dt; if (world.stir <= 0) { world.stir = 0; finishMix(); } }
  world.spinnerWiggle = Math.max(0, world.spinnerWiggle - dt * 1.5);
  // pipe → tank
  for (let i = world.pipeBlobs.length - 1; i >= 0; i--) {
    const b = world.pipeBlobs[i]; b.s += dt * 280 / PIPE_LEN;
    if (b.s >= 1) {
      world.pipeBlobs.splice(i, 1);
      world.tank.color = world.tank.amount > 0 && world.tank.color ? mixHex(world.tank.color, b.color, .5) : b.color;
      world.tank.amount = Math.min(8, world.tank.amount + 1);
      const [tx, ty, tw] = LAYOUT.bubbler.tank; burst(tx + tw / 2, ty + 6, 6, [b.color, '#fff'], 'drop', .5); Sound.pop();
      discover('pipe', 'Your paint flowed into the bubble machine! Press its button!', 2470, 280); save();
    }
  }
  world.blowT = Math.max(0, world.blowT - dt);
  // bubbles
  const [fx, fy] = LAYOUT.engine.funnel;
  for (let i = world.bubbles.length - 1; i >= 0; i--) {
    const b = world.bubbles[i]; if (b.dragged) continue;
    b.life -= dt;
    if (b.ride) {
      const carrying = player.ride && player.ride.b === b;
      if (carrying) { const h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); b.vx += (h * 150 + 45 - b.vx) * 1.4 * dt; b.vy += ((205 - b.y) * .9 - b.vy) * 1.3 * dt; }
      else { b.vx += (35 - b.vx) * dt; b.vy += (-26 - b.vy) * dt; }
      const d = Math.hypot(b.x - fx, b.y - fy); if (d < 150) { b.vx += (b.x - fx) / d * 160 * dt; b.vy += (b.y - fy) / d * 160 * dt; }
      b.x += b.vx * dt + Math.sin(t * 2 + b.seed) * .3; b.y += b.vy * dt;
      if (!player.ride && !carrying && Math.hypot(player.x - b.x, player.y - 70 - b.y) < b.r + 8) {
        player.ride = { type: 'bubble', b }; player.launched = false; Sound.tone(600, .3, 'sine', .05, 1.6);
        discover('ridebubble', 'You are floating inside a giant bubble! Jump to pop it.', b.x, b.y - 80);
      }
      if (b.life <= 0 || b.y < 120 || b.x > 3480) popBubble(b);
    } else {
      b.vx += (35 + Math.sin(t * .8 + b.seed) * 25 - b.vx) * .8 * dt; b.vy += (-38 - b.vy) * .8 * dt;
      const dx = fx - b.x, dy = fy - b.y, d = Math.hypot(dx, dy);
      if (d < 155 && b.y > fy - 120) { b.vx += dx * 3.2 * dt; b.vy += dy * 3.2 * dt; }
      b.x += b.vx * dt + Math.sin(t * 3 + b.seed) * .25; b.y += b.vy * dt;
      if (d < 28) { feedEngine(b); continue; }
      if (!player.ride && Math.hypot(player.x - b.x, player.y - 120 - b.y) < b.r + 20 && !player.grounded) { popBubble(b); discover('pop', 'Pop! Bump bubbles with your head!', b.x, b.y); continue; }
      if (b.life <= 0 || b.y < 30) popBubble(b, true);
    }
  }
  world.funnelWiggle = Math.max(0, world.funnelWiggle - dt * 1.2);
  world.feedT = Math.max(0, world.feedT - dt * 1.8);
  world.needPaintT = Math.max(0, world.needPaintT - dt);
  world.leverWiggle = Math.max(0, world.leverWiggle - dt * .7);
  world.sleepyT = Math.max(0, world.sleepyT - dt);
  world.powerT = Math.max(0, world.powerT - dt / 1.4);
  // gears
  const gTarget = world.labOn ? (world.powered ? 3.2 : .5) : 0;
  world.gearSpeed += (gTarget - world.gearSpeed) * Math.min(1, dt * 1.5); world.gearAngle += world.gearSpeed * dt;
  // rides
  world.wheelSpin = world.powered ? .5 : .3; world.wheelAngle += world.wheelSpin * dt;
  world.carSpeed = world.powered ? .9 : .55; world.carRot -= world.carSpeed * dt;
  // a little carousel tune while riding
  if (player.ride && player.ride.type === 'carousel') { world.musicT -= dt; if (world.musicT <= 0) { const tune = [0, 4, 7, 12, 7, 4, 9, 7]; world.musicN = ((world.musicN || 0) + 1) % tune.length; Sound.tone(523.25 * 2 ** (tune[world.musicN] / 12), .22, 'triangle', .035, 1); world.musicT = .27; } }
  if (!(player.ride && player.ride.type === 'coaster')) {
    if (world.powered) { world.coasterU += world.coasterDir * dt / 9; if (world.coasterU > 1) { world.coasterU = 1; world.coasterDir = -1; } if (world.coasterU < 0) { world.coasterU = 0; world.coasterDir = 1; } }
    else world.coasterU = Math.max(0, world.coasterU - dt * .15);
  }
  spring(world.tramp, 0, 260, 7, dt);
  world.pitJiggle = Math.max(0, world.pitJiggle - dt);
  world.stickerJig = Math.max(0, world.stickerJig - dt * 1.4); world.zipWiggle = Math.max(0, world.zipWiggle - dt * 1.5);
  updateBalls(dt);
  updateMarble(dt, t);
  updateBig(dt, t);
  updateSky(dt, t);
  updateParticles(dt);
}
function updateBalls(dt) {
  const P = player, T = LAYOUT.tramp, [mx, my] = LAYOUT.magnet.c;
  for (const b of balls) {
    if (b.dragged) continue;
    b.vy += GRAV * .7 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (!(b.kickCD > 0)) b.vx *= Math.pow(.985, dt * 60); // a launched seesaw ball flies true
    if (b.y > GROUND - b.r) { b.y = GROUND - b.r; b.vy = -Math.abs(b.vy) * .62; if (Math.abs(b.vy) < 40) b.vy = 0; b.vx *= .92; }
    if (b.x > T.a && b.x < T.b && b.y + b.r > T.y && b.vy > 0) { b.vy = -760; world.tramp.v += 160; Sound.tone(300, .12, 'sine', .03, 2); }
    if (b.x < b.r + 20 || b.x > WORLD_W - b.r - 20) { b.x = clamp(b.x, b.r + 20, WORLD_W - b.r - 20); b.vx *= -.7; }
    // players kick balls (collision with the creature's body circle)
    if (b.kickCD > 0) b.kickCD -= dt;
    if (!P.ride && !(b.kickCD > 0)) {
      const cx = P.x, cy = P.y - 64, dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), min = b.r + 46;
      if (d < min && d > .01) {
        const nx = dx / d, ny = dy / d; b.x = cx + nx * min; b.y = cy + ny * min;
        const rel = (P.vx - b.vx) * nx + (P.vy - b.vy) * ny;
        if (rel > 0) { b.vx += nx * rel * 1.3; b.vy += ny * rel * 1.3 - 120; if (rel > 160) Sound.tone(260 + b.r * 4, .07, 'sine', .04, 1.4); }
      }
    }
    // magnet: metal balls always feel it; with POWER it pulls everything nearby
    if (world.magnetOn && (b.metal || world.powered)) {
      const range = world.powered ? 700 : 380, tx = mx, ty = my + 62, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
      if (d < range) { const f = (b.metal ? 1 : .55) * (1 - d / range) * 2600; b.vx += dx / Math.max(d, 1) * f * dt; b.vy += dy / Math.max(d, 1) * f * dt - GRAV * .7 * dt * .9; b.vx *= Math.pow(.9, dt * 60); b.vy *= Math.pow(.9, dt * 60); }
    }
  }
  // ball ↔ ball collisions (equal masses)
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
    const a = balls[i], c = balls[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = a.r + c.r;
    if (d >= min || d < .01) continue;
    const nx = dx / d, ny = dy / d, push = (min - d) / 2;
    if (!a.dragged) { a.x -= nx * push; a.y -= ny * push; } if (!c.dragged) { c.x += nx * push; c.y += ny * push; }
    const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
    if (rel > 0) { a.vx -= nx * rel * .9; a.vy -= ny * rel * .9; c.vx += nx * rel * .9; c.vy += ny * rel * .9; }
  }
}
function updateCamera(dt) {
  const P = player, fast = P.ride && (P.ride.type === 'tube') ? 14 : 5.3;
  const focusY = P.ride && P.ride.type === 'carousel' ? GROUND : P.y;
  camY += (clamp(focusY - 390, -950, P.under ? 340 : 540 - VH) - camY) * Math.min(1, dt * 5);
  world.lookAhead += ((P.ride ? 0 : P.facing * vw * .1) - world.lookAhead) * Math.min(1, dt * 1.6);
  const target = clamp(P.x - vw / 2 + world.lookAhead, 0, Math.max(0, WORLD_W - vw));
  camera += (target - camera) * Math.min(1, dt * fast);
}
