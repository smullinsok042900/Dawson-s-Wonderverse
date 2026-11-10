// ===================================================================
// 47_marble.js — Milestone 2 chain #2: the MARBLE MACHINE.
//   dispenser (or throw ANY ball into its glass top) → xylophone ramps that
//   play a real melody → paddle wheel → meshing gears → a LIFT that rises one
//   step per ball and carries the creature up to a balcony with a playable
//   xylophone and secret star 8.
// ===================================================================
const MARBLE = {
  disp: { x: 6190, top: 118, globe: [6190, 150], button: [6190, 382] },
  wheel: { x: 6476, y: 378, r: 40 },
  lift: { a: 6560, b: 6662, low: GROUND, high: 230 },
  balcony: { a: 6662, b: 6790, y: 230 },
};
// pentatonic notes (always sound nice together)
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
const BAR_COLS = ['#ff4f9a', '#ff9a2e', '#ffc21c', '#36c96b', '#2fa8ff', '#5b6cff', '#a15cff', '#ff7ad9'];
// Ramps are real line segments the balls roll on; bars on them are notes.
const RAMPS = [
  { x1: 6232, y1: 168, x2: 6400, y2: 208, bars: 6, n0: 7, dir: -1 },
  { x1: 6430, y1: 246, x2: 6292, y2: 280, bars: 5, n0: 0, dir: 1 },
  { x1: 6250, y1: 322, x2: 6430, y2: 358, bars: 6, n0: 2, dir: 1 },
];
const WALLS = [{ x1: 6440, y1: 190, x2: 6440, y2: 262 }, { x1: 6243, y1: 262, x2: 6243, y2: 318 }];
Object.assign(world, { liftLevel: 0, liftY: GROUND, liftIdle: 0, wheelA: 0, wheelV: 0, xyloHit: new Array(8).fill(0) });
const LIFT_PLATFORM = { a: MARBLE.lift.a, b: MARBLE.lift.b, y: GROUND, step: true, moving: true };
PLATFORMS.push(LIFT_PLATFORM, { a: MARBLE.balcony.a, b: MARBLE.balcony.b, y: MARBLE.balcony.y });
SECRET_STARS.push({ id: 'star8', x: 6745, y: 150 });

function dispense() {
  const D = MARBLE.disp;
  const mine = balls.filter(b => b.mb); if (mine.length >= 6) balls.splice(balls.indexOf(mine[0]), 1);
  const c = BAR_COLS[Math.floor(Math.random() * BAR_COLS.length)];
  balls.push({ x: D.x + 56, y: D.top + 28, r: 15, c, vx: 45, vy: 0, mb: true });
  world.dispT = .3; Sound.tone(392, .12, 'triangle', .05, 1.5); Sound.pop();
  discover('dispenser', 'Push the button — watch the ball roll and play music!', D.x, D.top);
}
function playBar(i, loud = 1) {
  i = clamp(i, 0, 7); world.xyloHit[i] = 1;
  Sound.bell(NOTES[i], .05 * loud);
}
function tapXylo(p) {
  const i = clamp(Math.floor((p.x - 6676) / 13.5), 0, 7);
  playBar(i); burst(6683 + i * 13.5, 204, 4, [BAR_COLS[i], '#fff'], 'star', .4);
  discover('xylophone', 'Play the rainbow xylophone!', 6730, 180);
}
// ball ↔ segment collisions for the machine's ramps & walls
function segCollide(b, s, onHit) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy;
  const u = clamp(((b.x - s.x1) * dx + (b.y - s.y1) * dy) / L2, 0, 1);
  const px = s.x1 + dx * u, py = s.y1 + dy * u, ex = b.x - px, ey = b.y - py, d = Math.hypot(ex, ey);
  if (d >= b.r || d < .001) return;
  const nx = ex / d, ny = ey / d; b.x = px + nx * b.r; b.y = py + ny * b.r;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) { b.vx -= nx * vn * 1.35; b.vy -= ny * vn * 1.35; }
  onHit && onHit(u, Math.abs(vn));
}
function updateMarble(dt, t) {
  world.dispT = Math.max(0, (world.dispT || 0) - dt);
  world.xyloHit = world.xyloHit.map(v => Math.max(0, v - dt * 3));
  const D = MARBLE.disp, W = MARBLE.wheel;
  for (const b of balls) {
    if (b.dragged) continue;
    // any ball dropped into the glass top goes into the machine
    if (Math.hypot(b.x - D.globe[0], b.y - D.globe[1]) < 34 && !b.inMachine) { b.inMachine = true; b.x = D.x + 56; b.y = D.top + 28 - (b.r - 15); b.vx = 45; b.vy = 0; Sound.pop(); discover('feedball', 'Any ball can go into the marble machine!', D.x, D.top); }
    if (b.x < 6225 || b.x > 6460 || b.y > 380) continue;
    RAMPS.forEach((s, ri) => segCollide(b, s, (u, vn) => {
      const bar = Math.floor(u * s.bars), key = ri * 10 + bar;
      if (b.lastBar !== key && (Math.abs(b.vx) > 25 || vn > 40)) { b.lastBar = key; playBar(s.n0 + (s.dir > 0 ? bar : -bar) * (s.dir > 0 ? 1 : 1)); }
    }));
    WALLS.forEach(s => segCollide(b, s));
  }
  for (const b of balls) {
    if (b.dragged || b.wheeled) continue;
    if (Math.hypot(b.x - W.x, b.y - W.y) < W.r + b.r - 6) {
      b.wheeled = true; b.fade = 3.5;
      world.wheelV += 7; world.liftLevel = Math.min(1, world.liftLevel + .2); world.liftIdle = 0;
      Sound.bell(NOTES[4], .06); Sound.bell(NOTES[7], .04);
      burst(W.x, W.y, 14, [b.c, '#fff', '#ffe36e']);
      discover('marblerun', 'The ball turns the wheel, the gears lift the platform!', W.x, W.y - 60);
      if (world.liftLevel >= 1) discover('liftup', 'The lift is all the way up! Ride it to the balcony.', 6610, 200);
    }
  }
  for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i]; if (b.fade != null) { b.fade -= dt; if (b.fade <= 0) { burst(b.x, b.y, 8, [b.c, '#fff'], 'dot', .5); balls.splice(i, 1); } } }
  world.wheelV *= Math.exp(-dt * .8); world.wheelA += world.wheelV * dt;
  // lift: rises to the level the balls earned; sinks back slowly when idle
  world.liftIdle += dt; if (world.liftIdle > 10) world.liftLevel = Math.max(0, world.liftLevel - dt * .04);
  const L = MARBLE.lift, target = lerp(L.low, L.high, world.liftLevel), prev = world.liftY;
  world.liftY += clamp(target - world.liftY, -70 * dt, 70 * dt);
  LIFT_PLATFORM.y = Math.round(world.liftY * 10) / 10;
  // carry the creature standing on the lift
  const P = player;
  if (!P.ride && P.grounded && Math.abs(P.y - prev) < .6 && P.x > L.a && P.x < L.b) { P.y = LIFT_PLATFORM.y; }
}
// ---------- drawing ----------
function drawMarble(t) {
  if (!cull(6470, 340)) return;
  const D = MARBLE.disp, W = MARBLE.wheel, L = MARBLE.lift, B = MARBLE.balcony;
  // dispenser: gumball-machine globe on a gold stand
  ellipse(D.x, GROUND + 4, 50, 9, 'rgba(50,20,100,.2)');
  rounded(D.x - 34, 200, 68, 250, 18, grad(D.x - 34, 0, 68, 0, [[0, '#ff7ab8'], [.5, '#ffa6d4'], [1, '#e2459f']]), '#e9a93a', 6);
  for (let y = 230; y < 340; y += 38) star(D.x, y, 9, '#ffe27a');
  ctx.save(); ctx.beginPath(); ctx.arc(D.globe[0], D.globe[1] + 6, 44, 0, TAU); ctx.clip();
  ctx.fillStyle = 'rgba(225,245,255,.5)'; ctx.fillRect(D.x - 46, 100, 92, 100);
  for (let i = 0; i < 9; i++) ellipse(D.x - 26 + (i % 4) * 17, 186 - Math.floor(i / 4) * 15 + Math.sin(t * 3 + i) * world.dispT * 8, 8, 8, BAR_COLS[i % 8], 'rgba(255,255,255,.7)', 1.5);
  ctx.restore();
  ellipse(D.globe[0], D.globe[1] + 6, 44, 44, null, '#ffffff', 4); ellipse(D.x - 16, D.globe[1] - 14, 12, 7, 'rgba(255,255,255,.8)', null, 0, -.6);
  rounded(D.x - 10, D.top - 34, 20, 10, 4, '#ffd36b', '#fff', 2);
  rounded(D.x + 26, D.top + 34, 26, 10, 4, '#ffd36b', '#fff', 2); // chute onto the first ramp
  // a second "drop a ball" button right beside the lift, so you can call balls while riding it
  rounded(6524, 330, 30, 120, 8, grad(6524, 0, 30, 0, [[0, '#ff7ab8'], [1, '#e2459f']]), '#e9a93a', 3);
  ellipse(6539, 352 + (world.dispT > 0 ? 2 : 0), 12, 7, grad(0, 345, 0, 14, [[0, '#ffe57a'], [1, '#ffb01f']]), '#fff', 2.5);
  ellipse(6539, 385, 7, 7, BAR_COLS[Math.floor(t * 2) % 8], '#fff', 2);
  const [bx, by] = D.button, press = world.dispT > 0 ? 3 : 0;
  ellipse(bx, by + 6, 22, 9, '#8a1f52'); ellipse(bx, by + press, 20, 9, grad(0, by - 9, 0, 18, [[0, '#ffe57a'], [1, '#ffb01f']]), '#fff', 3);
  // xylophone ramps (rainbow bars that light up when they play)
  RAMPS.forEach(s => {
    ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s.x1, s.y1 + 9); ctx.lineTo(s.x2, s.y2 + 9); ctx.stroke();
    const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    for (let i = 0; i < s.bars; i++) {
      const u = (i + .5) / s.bars, x = lerp(s.x1, s.x2, u), y = lerp(s.y1, s.y2, u), n = clamp(s.n0 + (s.dir > 0 ? i : -i), 0, 7), lit = world.xyloHit[n];
      ctx.save(); ctx.translate(x, y + 4); ctx.rotate(ang);
      if (lit > 0) glow(0, 0, 22, BAR_COLS[n], lit);
      rounded(-13, -4, 26, 9, 3, BAR_COLS[n], '#fff', 2); ellipse(-8, 0, 1.6, 1.6, '#fff'); ellipse(8, 0, 1.6, 1.6, '#fff');
      ctx.restore();
    }
  });
  WALLS.forEach(s => rounded(s.x1 - 4, s.y1, 8, s.y2 - s.y1, 4, '#ffd36b', '#fff', 1.5));
  // paddle wheel + gear train to the lift
  ctx.save(); ctx.translate(W.x, W.y); ctx.rotate(world.wheelA);
  for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); rounded(-5, -W.r - 4, 10, 26, 4, BAR_COLS[i], '#fff', 2); }
  ellipse(0, 0, W.r * .62, W.r * .62, '#ffd36b', '#fff', 3); star(0, 0, 10, '#fff6c2');
  ctx.restore();
  gear(W.x + 52, W.y - 34, 22, 8, -world.wheelA * 1.6, '#9fe6ff');
  gear(W.x + 82, W.y - 70, 16, 6, world.wheelA * 2.1, '#ffd16b');
  // lift: rails with level lights + platform
  for (const x of [L.a - 6, L.b + 6]) rounded(x - 5, L.high - 30, 10, GROUND - L.high + 30, 5, grad(x - 5, 0, 10, 0, [[0, '#ffd88f'], [1, '#d9962e']]), '#fff3c4', 1.5);
  for (let i = 0; i < 5; i++) bulb(L.a - 6, GROUND - 30 - i * 40, world.liftLevel >= (i + 1) * .2 - .01, BAR_COLS[i * 2 % 8], .8);
  const ly = LIFT_PLATFORM.y;
  rounded(L.a, ly, L.b - L.a, 16, 7, grad(0, ly, 0, 16, [[0, '#b58cff'], [1, '#7d45d8']]), '#ffd36b', 3);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.a + 4, ly - 26); ctx.lineTo(L.b - 4, ly - 26); ctx.stroke();
  for (let x = L.a + 6; x < L.b; x += 24) { ctx.beginPath(); ctx.moveTo(x, ly - 26); ctx.lineTo(x, ly); ctx.stroke(); }
  // balcony + standing xylophone
  rounded(B.a, B.y, B.b - B.a, 18, 8, grad(0, B.y, 0, 18, [[0, '#ff9fd2'], [1, '#e2459f']]), '#ffd36b', 3);
  rounded(B.b - 14, B.y + 16, 12, GROUND - B.y - 16, 5, '#e9b8ff', '#fff', 2);
  for (let i = 0; i < 8; i++) {
    const h = 44 - i * 3.5, x = 6676 + i * 13.5, lit = world.xyloHit[i];
    if (lit > 0) glow(x + 6, B.y - h / 2, 18, BAR_COLS[i], lit);
    rounded(x, B.y - h - 4 - lit * 4, 11, h, 4, BAR_COLS[i], '#fff', 2);
  }
  ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6672, B.y - 6); ctx.lineTo(6786, B.y - 6); ctx.stroke();
  bulbString(B.a, B.y - 70, B.b, B.y - 70, 8, 5, t, world.liftLevel > .99, ['#ff9fd8', '#ffd76a', '#9fe6ff']);
}
