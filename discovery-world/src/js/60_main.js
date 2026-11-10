// ===================================================================
// 60_main.js — resize, render order, hint hand, game loop, boot
// ===================================================================
// The soft far backdrop is drawn into a half-resolution buffer and scaled up
// (a quarter of the pixel work; keeps phones smooth). Characters & props stay sharp.
// Adaptive quality: if frames run slow for a while, lower the pixel density a step.
let quality = 1, slowTime = 0, frameEMA = 1 / 60;
function adaptQuality(rawDt) {
  frameEMA += (rawDt - frameEMA) * .05;
  if (frameEMA > 1 / 48 && quality > .55) { slowTime += rawDt; if (slowTime > 1.2) { quality = Math.max(.55, quality - .15); slowTime = 0; frameEMA = 1 / 60; resize(); } }
  else slowTime = Math.max(0, slowTime - rawDt * .5);
}
const BG_RES = .5, bgCanvas = document.createElement('canvas'), bgCtx = bgCanvas.getContext('2d', { alpha: false });
function resize() {
  const w = innerWidth, h = innerHeight;
  // Cap backing resolution so older iPhones stay smooth (≤ ~2.4M pixels)
  let dpr = Math.min(devicePixelRatio || 1, 2);
  if (w * h * dpr * dpr > 2.4e6) dpr = Math.sqrt(2.4e6 / (w * h));
  dpr = Math.max(.75, dpr * quality);
  canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
  vw = VH * w / h; scale = canvas.height / VH;
  bgCanvas.width = Math.ceil(canvas.width * BG_RES); bgCanvas.height = Math.ceil(canvas.height * BG_RES);
  camera = clamp(camera, 0, Math.max(0, WORLD_W - vw));
}

function drawPours(t) {
  for (const p of world.pendingPours) {
    const [bx, by] = LAYOUT.buckets[p.k], side = p.k === 'b' ? -1 : 1, lipX = bx + side * 22, lipY = by - 4;
    const [tx, ty] = LAYOUT.mixer.bowl, k = clamp(p.t / .55, 0, 1);
    ctx.strokeStyle = PAINTS[p.k].hex; ctx.lineCap = 'round'; ctx.lineWidth = 9 * (1 - k * .4);
    ctx.beginPath(); ctx.moveTo(lipX, lipY);
    ctx.quadraticCurveTo(lipX + side * 10, lipY + 20, lerp(lipX, tx + (bx - tx) * .3, Math.min(1, k * 2)), lerp(lipY, ty, Math.min(1, k * 2)));
    ctx.stroke();
    for (let i = 0; i < 3; i++) ellipse(lerp(lipX, tx, (k + i * .2) % 1), lerp(lipY, ty, (k + i * .2) % 1) + Math.sin(t * 20 + i) * 2, 4, 5, PAINTS[p.k].hex);
  }
}
function drawBubble(b) {
  const col = b.color ? hexToRgb(b.color) : null;
  const edge = col ? `rgba(${col[0]},${col[1]},${col[2]},.62)` : `hsla(${b.hue},90%,75%,.5)`;
  const mid = col ? `rgba(${col[0]},${col[1]},${col[2]},.16)` : `hsla(${b.hue},90%,82%,.1)`;
  const wob = 1 + Math.sin(gameTime * 6 + b.seed) * .04;
  const g = ctx.createRadialGradient(b.x - b.r * .35, b.y - b.r * .4, 2, b.x, b.y, b.r);
  g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(.6, mid); g.addColorStop(1, edge);
  ellipse(b.x, b.y, b.r * wob, b.r / wob, g, 'rgba(255,255,255,.75)', b.ride ? 3 : 2);
  ellipse(b.x - b.r * .32, b.y - b.r * .38, b.r * .24, b.r * .13, 'rgba(255,255,255,.92)', null, 0, -.5);
  sparkle(b.x + b.r * .45, b.y - b.r * .2, b.ride ? 7 : 4, '#fff');
}
function drawBall(b) {
  ellipse(b.x + 3, GROUND + 4, b.r * clamp(1.2 - (GROUND - b.y) / 400, .4, 1.2), 5, 'rgba(60,25,110,.18)');
  ctx.save(); ctx.translate(b.x, b.y);
  if (b.metal) { ellipse(0, 0, b.r, b.r, rg(-6, -8, b.r * 1.8, [[0, '#ffffff'], [.25, '#dfe7f7'], [.7, '#8d9cc2'], [1, '#5d6b94']]), '#fff', 3); ctx.strokeStyle = '#6b7aa3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-b.r * .5, 0); ctx.lineTo(b.r * .5, 0); ctx.moveTo(0, -b.r * .5); ctx.lineTo(0, b.r * .5); ctx.stroke(); }
  else { ellipse(0, 0, b.r, b.r, rg(-6, -8, b.r * 1.8, [[0, '#ffffff'], [.14, b.c], [1, shade(b.c, -.45)]]), '#fff', 3); star(b.r * .3, b.r * .25, b.r * .22, '#fff7b8'); }
  ellipse(-b.r * .32, -b.r * .34, b.r * .26, b.r * .16, 'rgba(255,255,255,.75)');
  ctx.restore();
}
function drawHintHand(t) {
  const h = hintTarget(); if (!h || player.ride) return;
  let [x, y] = h; const k = (Math.sin(t * 4) + 1) / 2;
  if (Math.abs(x - player.x) < 70 && y > player.y - 190 && y < player.y + 10) y = player.y - 255; // never cover the creature's face
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${.85 - k * .6})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 22 + k * 16, 0, TAU); ctx.stroke();
  ctx.translate(x + 14, y + 16 + k * 8); ctx.rotate(-.45);
  ctx.lineJoin = 'round';
  const hand = () => { ctx.beginPath(); ctx.roundRect(-5, -26, 11, 30, 5.5); ctx.roundRect(-12, -2, 30, 26, 10); ctx.roundRect(4, -6, 9, 14, 4.5); ctx.roundRect(12, -2, 9, 14, 4.5); };
  hand(); ctx.strokeStyle = '#7a4bb0'; ctx.lineWidth = 6; ctx.stroke(); hand(); ctx.fillStyle = '#ffffff'; ctx.fill();
  ellipse(0, -21, 3, 3, '#ffd3ea');
  ctx.restore();
}
function drawPlayer(t) {
  const P = player, A = P.anim;
  if (P.ride && P.ride.type === 'tube') {
    // tiny capsule zipping through the tube with the creature inside
    ctx.save(); ctx.translate(P.x, P.y - 20);
    ellipse(0, 0, 30, 19, 'rgba(255,255,255,.75)', '#ff8fc8', 4);
    ctx.save(); ctx.scale(.2, .2); drawCreature(P.creature, A, 0, 80, { noShadow: true, noTrail: true }); ctx.restore();
    ctx.restore();
    burst(P.x - Math.sign(P.vx) * 30, P.y - 20, 1, ['#fff', '#ffe36e'], 'star', .2);
    return;
  }
  ctx.save();
  // riders shrink to fit their seat (bubble / gondola / coaster car), scaled about the feet
  const rs = P.ride ? ({ bubble: .78, wheel: .5, coaster: .58, carousel: .62, swing: .8, train: .58 }[P.ride.type] || 0) : 0;
  if (rs) { ctx.translate(P.x, P.y); ctx.scale(rs, rs); ctx.translate(-P.x, -P.y); }
  drawCreature(P.creature, A, P.x, P.y, { noShadow: !!P.ride, drop: P.grounded ? 0 : floorBelow(P.x, P.y) - P.y });
  ctx.restore();
}
function floorBelow(x, y) {
  let f = GROUND;
  for (const z of PLATFORMS) if (x > z.a && x < z.b && z.y >= y - 1 && z.y < f) f = z.y;
  return f;
}
function render(t) {
  bgCtx.setTransform(scale * BG_RES, 0, 0, scale * BG_RES, 0, 0);
  withCtx(bgCtx, () => background(t));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(bgCanvas, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ground(t);
  ctx.save(); ctx.translate(-camera, -camY);
  floorReflection(t);
  ceilingTube(t, false); hangingStars(t);
  glassTube(3118, 128, 446, '#b58cff', t); glassTube(5458, 160, 446, '#ff8fd0', t);
  if (cull(365, 260)) drawBallPitBack();
  weaveDecor(t);
  playStructure(t); paintWall(t); drawEasel(1, t); drawEasel(2, t); drawRoutes(t); drawMarble(t); drawBigBack(t); mixerMachine(t); drawPours(t); drawPipe(t);
  bubbleMachine(t); powerCable(t); wonderEngine(t); magnetMachine(t); launchPad(t);
  ferrisWheel(t); coasterTrack(t);
  decorLights(t);
  const rideType = player.ride && player.ride.type;
  if (rideType !== 'coaster' && cull(4870, 520)) coasterTrain(t);
  drawCarousel(t, rideType === 'carousel' ? player.ride.i : -1, () => drawPlayer(t));
  if (world.needPaintT > 0 && cull(2790, 80)) { ctx.globalAlpha = Math.min(1, world.needPaintT); paintDropIcon(LAYOUT.engine.funnel[0], 92); ctx.globalAlpha = 1; }
  secretStars(t);
  balls.forEach(b => { if (cull(b.x, 40)) drawBall(b); });
  world.bubbles.forEach(b => { if (!b.ride && cull(b.x, 40)) drawBubble(b); });
  if (rideType !== 'carousel') drawPlayer(t);
  // things that sit IN FRONT of the creature (so it is inside the ride / the pit)
  if (rideType === 'coaster') coasterTrain(t);
  if (rideType === 'wheel') { const W = LAYOUT.wheel, a = world.wheelAngle + player.ride.i * Math.PI / 5, x = W.cx + Math.cos(a) * W.r, y = W.cy + Math.sin(a) * W.r; rounded(x - 26, y + 24, 52, 18, 9, ['#ffbb68', '#7be1ed', '#ff85c2', '#a88af5', '#92e1a6'][player.ride.i % 5], '#fff', 3); }
  drawBigFront(t);
  world.bubbles.forEach(b => { if (b.ride && cull(b.x, 80)) drawBubble(b); });
  if (cull(365, 260)) drawBallPitFront();
  drawParticles();
  if (started) drawHintHand(t);
  ctx.restore();
  foreground(t);
}
function paintDropIcon(x, y) {
  rounded(x - 44, y - 22, 88, 44, 20, 'rgba(255,255,255,.94)', '#e3b0ee', 3);
  ['#ff4f9a', '#ffd23f', '#3d9bff'].forEach((c, i) => { const dx = x - 26 + i * 15; ctx.beginPath(); ctx.moveTo(dx, y - 12); ctx.quadraticCurveTo(dx + 8, y + 2, dx, y + 8); ctx.quadraticCurveTo(dx - 8, y + 2, dx, y - 12); ctx.fillStyle = c; ctx.fill(); });
  ctx.beginPath(); ctx.moveTo(x + 10, y - 6); ctx.lineTo(x + 18, y); ctx.lineTo(x + 10, y + 6); ctx.strokeStyle = '#8452b0'; ctx.lineWidth = 3; ctx.stroke();
  ellipse(x + 32, y, 10, 10, 'rgba(160,120,255,.35)', '#fff', 2);
}
function update(dt, t) {
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('shown'); }
  const nearWall = started && PAINT_SURFACES.some(R => camera + vw > R.x1 + Math.min(120, (R.x2 - R.x1) / 2) && camera < R.x2 - Math.min(120, (R.x2 - R.x1) / 2));
  const pt = $('paintTools'); if (pt.classList.contains('show') !== nearWall) pt.classList.toggle('show', nearWall);
  if (!started) { updateParticles(dt); return; }
  updatePlayer(dt); updateWorld(dt, t); updateCamera(dt);
  if (t - lastSave > 10) { lastSave = t; save(); }
}
let lastSave = 0, portraitClock = 0;
function loop(ms) {
  const t = ms / 1000;
  if (!lastFrame) lastFrame = t;
  const raw = t - lastFrame, dt = clamp(raw, 0, 1 / 30); lastFrame = t;
  if (started && !paused && raw > 0 && raw < .25) adaptQuality(raw);
  if (!paused) {
    gameTime += dt; frameCount++;
    update(dt, gameTime); render(gameTime);
    portraitClock += dt; if (portraitClock > 1 / 20) { renderPortraits(portraitClock); portraitClock = 0; }
  }
  requestAnimationFrame(loop);
}

// ---------------- boot ----------------
if (!CanvasRenderingContext2D.prototype.roundRect) { // older Safari fallback
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { r = Math.min(typeof r === 'number' ? r : 8, Math.abs(w) / 2, Math.abs(h) / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
}
const restoreInfo = restore();
addEventListener('resize', resize); resize();
camera = clamp(player.x - vw * .4, 0, Math.max(0, WORLD_W - vw));
document.querySelectorAll('.creatureChoice canvas').forEach(c => registerPortrait(c, c.parentElement.dataset.creature, 46));
document.querySelectorAll('.introPick canvas').forEach(c => registerPortrait(c, c.parentElement.dataset.creature, 96));
initInput();
selectCreature(player.creature, true);
document.querySelectorAll('.introPick').forEach(z => z.classList.toggle('chosen', z.dataset.creature === player.creature));
setSound(Sound.on); updateCounter(); updatePaintTools(); updateBits();
if (restoreInfo.restored) $('playBtn').textContent = '▶ KEEP PLAYING!';
requestAnimationFrame(loop);

// Test/debug hook (used by the automated smoke tests; harmless for players)
window.__DDW = {
  player, world, balls, LAYOUT, keys, Sound, SECRET_STARS, get camera() { return camera; }, get vw() { return vw; }, VH,
  toScreen(x, y) { const r = canvas.getBoundingClientRect(); return { x: (x - camera) / VH * r.height + r.left, y: (y - camY) / VH * r.height + r.top }; },
  teleport(x, y = GROUND) { player.ride = null; player.x = x; player.y = y; player.vx = player.vy = 0; camera = clamp(x - vw / 2, 0, WORLD_W - vw); },
  get quality() { return quality; }, train: TRAIN, restoreInfo, activate: (x, y) => activate({ x, y }),
};
