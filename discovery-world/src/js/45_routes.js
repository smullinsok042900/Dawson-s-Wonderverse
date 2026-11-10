// ===================================================================
// 45_routes.js — Milestone 2: vertical routes and richer painting.
//   * climbing net + ladder that really climb (JUMP while touching them)
//   * high route: tower beam → wobbly sky bridge → glass-tube lookout
//     (secret star) → ZIPLINE swooping down to the paint mixer
//   * stickers (star / heart / rainbow) stamped on any paint surface
//   * wet paint: fresh strokes drip and sparkle
// ===================================================================
const CLIMBS = [
  { id: 'net', x1: 693, x2: 780, top: 213, bottom: 362, land: 735 },     // tower climbing net → pink beam
  { id: 'ladder', x1: 2688, x2: 2722, top: 300, bottom: 452, land: 2732 }, // ladder → Wonder Engine walkway
];
const ZIP = { x1: 1398, y1: 162, x2: 2012, y2: 326 };
const ZIP_HANG = 104; // creature hangs this far below the rope
const zipY = x => lerp(ZIP.y1, ZIP.y2, clamp((x - ZIP.x1) / (ZIP.x2 - ZIP.x1), 0, 1));

function climbZoneAt(x, y) { const lk = layerKey(); return CLIMBS.find(c => (c.layer || '') === lk && x > c.x1 && x < c.x2 && y > c.top + 6 && y <= c.bottom); }
function startClimb(c) {
  const P = player; P.ride = { type: 'climb', c }; P.vx = 0; P.vy = 0; P.jumps = 0;
  Sound.tone(520, .12, 'triangle', .04, 1.3);
  if (c.exit) return;
  discover(c.id === 'net' ? 'climbnet' : c.id === 'ladder' ? 'ladder' : 'towerclimb', c.id === 'net' ? 'Climb the net up to the high beam!' : c.id === 'ladder' ? 'Climb the ladder to the Wonder Engine walkway!' : 'Climb up, up, up the tower!', c.land, c.top - 60);
}
function tapClimb(c) {
  const P = player; if (P.ride) return;
  if (Math.abs(P.x - (c.x1 + c.x2) / 2) > 320) { burst((c.x1 + c.x2) / 2, c.bottom - 40, 8); Sound.click(); return; }
  P.x = (c.x1 + c.x2) / 2; P.y = Math.min(P.y, c.bottom); startClimb(c);
}
function startZip() {
  const P = player; if (P.ride) return;
  P.ride = { type: 'zip', u: 0, v: .18 }; P.vx = P.vy = 0; P.facing = 1; P.launched = false;
  Sound.whoosh(); discover('zipline', 'Wheee! Zoom down the zipline!', ZIP.x1 + 80, ZIP.y1 - 40);
}
function tapZip() {
  const P = player;
  if (!P.ride && Math.abs(P.x - ZIP.x1) < 130 && Math.abs(P.y - 213) < 6) { P.x = ZIP.x1; startZip(); return; }
  world.zipWiggle = 1; Sound.click(); burst(ZIP.x1, ZIP.y1, 8);
}
function updateClimbZip(dt) {
  const P = player, R = P.ride;
  if (R.type === 'climb') {
    const cx = (R.c.x1 + R.c.x2) / 2; P.x += (cx - P.x) * Math.min(1, dt * 10);
    P.y -= 175 * dt; P.vy = -175; P.vx = 0;
    if (Math.random() < dt * 5) Sound.tone(600 + Math.random() * 120, .05, 'sine', .025, 1.2);
    if (P.y <= R.c.top) { if (R.c.exit) { P.under = false; discover('upagain', null); } P.ride = null; P.y = R.c.top; P.x = R.c.land; P.vy = 0; P.grounded = true; burst(P.x, P.y - 10, 10); Sound.land(); }
    return true;
  }
  if (R.type === 'zip') {
    R.v = Math.min(.95, R.v + dt * .55); R.u += R.v * dt;
    const x = lerp(ZIP.x1, ZIP.x2, Math.min(1, R.u));
    P.vx = (x - P.x) / Math.max(dt, .001); P.x = x; P.y = zipY(x) + ZIP_HANG; P.vy = -260; P.facing = 1;
    if (Math.random() < .35) burst(P.x - 20, zipY(P.x) + 6, 1, ['#fff', '#ffe36e'], 'star', .3);
    if (R.u >= 1) { P.ride = null; P.vx = 200; P.vy = 0; P.grounded = false; P.jumps = 1; Sound.boing(); burst(P.x, P.y - 40, 16); }
    return true;
  }
  return false;
}
// ---------- drawing ----------
function drawRoutes(t) {
  // climbing-net highlight + engine ladder
  if (cull(737, 60)) { ctx.globalAlpha = .55 + Math.sin(t * 3) * .15; rounded(690, 236, 92, 122, 15, null, '#ffe36e', 3); ctx.globalAlpha = 1; }
  if (cull(2705, 30)) {
    for (const x of [2690, 2720]) rounded(x - 4, 296, 8, 156, 4, grad(x - 4, 0, 8, 0, [[0, '#ffd88f'], [1, '#d9962e']]), '#fff3c4', 1.5);
    for (let y = 312; y < 450; y += 22) rounded(2688, y, 34, 6, 3, '#ff9fd2', '#fff', 1.5);
  }
  if (!cull(1240, 420)) return;
  // the tower's pink beam is now walkable; the wobbly sky bridge continues from it
  const P = player, onBridge = !P.ride && P.grounded && P.y === 213 && P.x > 1085 && P.x < 1290;
  ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(1085, 186); ctx.quadraticCurveTo(1188, 200 + (onBridge ? 8 : 0), 1290, 186); ctx.stroke();
  for (let x = 1088; x < 1290; x += 17) {
    const dip = onBridge ? Math.max(0, 10 - Math.abs(x - P.x) / 12) : Math.sin(t * 2 + x) * 1.2;
    rounded(x, 211 + dip, 14, 10, 3, x % 34 < 17 ? '#ffb35c' : '#ff8fc5', '#fff3c4', 1.5);
    ctx.beginPath(); ctx.moveTo(x + 7, 213 + dip); ctx.lineTo(x + 7, 190 + dip * .4); ctx.stroke();
  }
  // glass-tube lookout tower with a railing and a flag
  glassTube(1342, 222, 446, '#7fd8ff', t);
  rounded(1288, 211, 110, 18, 8, grad(0, 211, 0, 18, [[0, '#ffd88f'], [1, '#e2a23a']]), '#fff3c4', 3);
  ctx.strokeStyle = '#ff9fd2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1290, 186); ctx.lineTo(1396, 186); ctx.stroke();
  for (let x = 1294; x < 1396; x += 17) { ctx.beginPath(); ctx.moveTo(x, 186); ctx.lineTo(x, 211); ctx.stroke(); }
  rounded(1296, 96, 6, 92, 3, '#fff3c4');
  ctx.beginPath(); ctx.moveTo(1302, 100); ctx.quadraticCurveTo(1325, 106 + Math.sin(t * 4) * 5, 1344, 102); ctx.lineTo(1302, 122); ctx.closePath(); ctx.fillStyle = '#ff6fae'; ctx.fill();
  star(1318, 110, 5, '#fff6b0');
  // zipline: posts, rope, pulley
  rounded(ZIP.x1 - 4, ZIP.y1 - 22, 9, 52, 4, '#d9962e', '#fff3c4', 2);
  rounded(ZIP.x2 - 6, ZIP.y2 - 20, 12, GROUND - ZIP.y2 + 20, 5, grad(ZIP.x2 - 6, 0, 12, 0, [[0, '#ffd88f'], [1, '#d9962e']]), '#fff3c4', 2);
  ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(ZIP.x1, ZIP.y1); ctx.lineTo(ZIP.x2, ZIP.y2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  const zx = P.ride && P.ride.type === 'zip' ? P.x : ZIP.x1 + 18 + Math.sin(t * 20) * (world.zipWiggle || 0) * 6, zy = zipY(zx);
  ellipse(zx, zy, 9, 9, '#ffd36b', '#7a4a1a', 2.5); ellipse(zx, zy, 3, 3, '#7a4a1a');
  rounded(zx - 16, zy + 8, 32, 8, 4, '#ff6fae', '#fff', 2); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(zx, zy); ctx.lineTo(zx, zy + 9); ctx.stroke();
}

// ---------- stickers ----------
const STICKERS = ['star', 'heart', 'rainbow'];
function drawSticker(k, x, y, size, rot, jig) {
  ctx.save(); ctx.translate(x, y + jig); ctx.rotate(rot + Math.sin(gameTime * 12) * jig * .03);
  ctx.lineJoin = 'round';
  if (k === 'star') {
    ctx.beginPath(); starPath(0, 0, size, 5, -Math.PI / 2, .5); ctx.strokeStyle = '#fff'; ctx.lineWidth = size * .3; ctx.stroke();
    ctx.fillStyle = grad(0, -size, 0, size * 2, [[0, '#fff1a0'], [1, '#ffb81f']]); ctx.fill();
    ellipse(-size * .25, -size * .25, size * .18, size * .12, 'rgba(255,255,255,.85)');
  } else if (k === 'heart') {
    ctx.beginPath(); heartPath(0, size * .15, size * .95); ctx.strokeStyle = '#fff'; ctx.lineWidth = size * .3; ctx.stroke();
    ctx.fillStyle = grad(0, -size, 0, size * 2, [[0, '#ff9fd2'], [1, '#ff3f8f']]); ctx.fill();
    ellipse(-size * .35, -size * .25, size * .18, size * .12, 'rgba(255,255,255,.85)');
  } else {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = size * .95; ctx.beginPath(); ctx.arc(0, size * .45, size * .75, Math.PI, TAU); ctx.stroke();
    ['#ff5aa5', '#ffc21c', '#36c96b', '#2fa8ff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = size * .17; ctx.beginPath(); ctx.arc(0, size * .45, size * (.95 - i * .17), Math.PI, TAU); ctx.stroke(); });
    ellipse(-size * .9, size * .5, size * .3, size * .2, '#fff'); ellipse(size * .9, size * .5, size * .3, size * .2, '#fff');
  }
  ctx.restore();
}
function drawStickersOn(si) {
  for (const k of world.stickers) if (k.s === si) {
    const d = Math.hypot(player.x - k.x, player.y - 80 - k.y), jig = world.stickerJig > 0 && d < 320 ? Math.sin(gameTime * 18 + k.x) * 4 * world.stickerJig : 0;
    drawSticker(k.k, k.x, k.y, si ? 14 : 21, k.r, jig);
  }
}
function addSticker(si, p, kind) {
  const R = PAINT_SURFACES[si];
  world.stickers.push({ s: si, x: Math.round(clamp(p.x, R.x1 + 12, R.x2 - 12)), y: Math.round(clamp(p.y, R.y1 + 12, R.y2 - 12)), k: kind, r: +rand(-.35, .35).toFixed(2), n: ++world.paintN });
  if (world.stickers.length > 80) world.stickers.shift();
  burst(p.x, p.y, 10, ['#fff', '#ffe36e', '#ff9fd2'], 'star', .6);
  Sound.tone(880, .1, 'triangle', .05, 1.6); Sound.pop();
  discover('sticker', 'Stamp stickers anywhere you paint!', p.x, p.y - 30);
  save();
}
// ---------- wet paint: drips + sparkle ----------
function addDrips(s) {
  const R = PAINT_SURFACES[s.s || 0], pts = s.points; if (!pts.length) return;
  s.drips = [];
  const n = Math.min(3, 1 + Math.floor(pts.length / 18));
  for (let i = 0; i < n; i++) {
    const p = pts[Math.floor(Math.random() * pts.length)], len = Math.round(Math.min(rand(8, 26), R.y2 - p[1] - 2));
    if (len > 4) s.drips.push([p[0], p[1], len]);
  }
  s.born = gameTime;
}
function drawDripsAndShine(s) {
  const age = s.born != null ? gameTime - s.born : 99, grow = clamp(age / 1.6, 0, 1), w = (s.w || 16) * .42;
  if (s.drips) for (const [x, y, len] of s.drips) {
    const L = len * grow;
    ctx.strokeStyle = s.color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + L); ctx.stroke();
    ellipse(x, y + L, w * .75, w * .9, s.color); ellipse(x - w * .2, y + L - w * .2, w * .22, w * .22, 'rgba(255,255,255,.6)');
  }
  if (age < 2.5 && s.points.length) for (let i = 0; i < 3; i++) { const p = s.points[Math.floor((gameTime * 7 + i * 13) % s.points.length)]; sparkle(p[0] + Math.sin(i * 5) * 5, p[1] - 3, 4 * (1 - age / 2.5) + 1, '#ffffff'); }
}
