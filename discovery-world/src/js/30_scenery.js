// ===================================================================
// 30_scenery.js — layered parallax backdrop + all world props.
// The palette blends continuously across the world (no hard zone edges).
// ===================================================================
const PALETTES = [
  { sky: ['#7fd3ff', '#c4eeff', '#ffd6ef', '#ffe6c9'], hillA: '#ffc2e2', hillB: '#d0b1ff', floor: ['#ef87d9', '#8c55c4', '#5f3796'], light: '#ffe3f4' },
  { sky: ['#5fbaf2', '#b6e3ff', '#d9d0ff', '#c6ecff'], hillA: '#a8def7', hillB: '#bba1f7', floor: ['#c58cf0', '#7a55c4', '#4b358f'], light: '#e2f7ff' },
  { sky: ['#86d8ff', '#dcf6ff', '#fff1c8', '#ffe0b0'], hillA: '#ffe199', hillB: '#a6ead8', floor: ['#ff9fc8', '#b35aa8', '#6d3a8a'], light: '#fff6d8' },
  { sky: ['#6aa9ff', '#ffc6e6', '#ffbd9c', '#ffdfa8'], hillA: '#ffa6c4', hillB: '#ffd27e', floor: ['#ff8fb1', '#a24f9e', '#682e7e'], light: '#fff0dc' },
];
// ONE world: the colours drift and repeat every ~3200 units across the whole length,
// so no part of the world has "its own" colour scheme — the themes are mixed together.
const ZONES = [];
for (let i = 0; i <= 9; i++) ZONES.push({ x: i * 800 - 200, ...PALETTES[i % 4] });
let palette = null;
function blendPalette(x) {
  let i = 0; while (i < ZONES.length - 2 && x > ZONES[i + 1].x) i++;
  const A = ZONES[i], B = ZONES[i + 1], t = smooth(clamp((x - A.x) / (B.x - A.x), 0, 1));
  const m = (a, b) => mixHex(a, b, t);
  return { sky: A.sky.map((c, k) => m(c, B.sky[k])), hillA: m(A.hillA, B.hillA), hillB: m(A.hillB, B.hillB), floor: A.floor.map((c, k) => m(c, B.floor[k])), light: m(A.light, B.light) };
}
const px = (X, k) => vw / 2 + (X - (camera + vw / 2)) * k; // parallax screen x for a world X
const cull = (x, w = 200) => x + w > camera - 60 && x - w < camera + vw + 60;

// ---------------- far backdrop ----------------
function background(t) {
  const camC = camera + vw / 2; palette = blendPalette(camC);
  ctx.fillStyle = grad(0, 0, 0, VH, [[0, palette.sky[0]], [.4, palette.sky[1]], [.72, palette.sky[2]], [1, palette.sky[3]]]);
  ctx.fillRect(0, 0, vw, VH);
  // sun glow
  const sx = px(2600, .05);
  const sg = ctx.createRadialGradient(sx, 120, 10, sx, 120, 230); sg.addColorStop(0, 'rgba(255,253,225,.95)'); sg.addColorStop(.3, 'rgba(255,248,210,.45)'); sg.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = sg; ctx.fillRect(sx - 240, 0, 480, 360);
  // soft light rays
  ctx.save(); ctx.globalAlpha = .13; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) { const a = -1.1 + i * .38 + Math.sin(t * .2 + i) * .03; ctx.beginPath(); ctx.moveTo(sx, 120); ctx.lineTo(sx + Math.cos(a) * 900, 120 + Math.sin(a + 1.5) * 700); ctx.lineTo(sx + Math.cos(a + .1) * 900, 120 + Math.sin(a + 1.6) * 700); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // drifting far clouds
  for (let i = 0; i < 14; i++) {
    const X = i * 470 + 80, x = ((px(X, .1) + t * 6 + 400) % (vw + 600)) - 300, y = 70 + 40 * Math.sin(i * 2.2);
    ctx.globalAlpha = .9; ellipse(x, y, 62, 22, '#ffffff'); ellipse(x - 26, y - 12, 32, 24, '#ffffff'); ellipse(x + 18, y - 18, 36, 29, '#ffffff'); ctx.globalAlpha = 1;
  }
  // rolling hills (two depths)
  hills(.16, 330, 42, palette.hillB, .0042, 0);
  farProps(t);
  hills(.3, 372, 34, palette.hillA, .006, 2);
  midArchitecture(t);
}
function hills(k, base, amp, col, freq, seed) {
  ctx.beginPath(); ctx.moveTo(0, VH);
  for (let x = -20; x <= vw + 24; x += 24) {
    const X = (x - vw / 2) / k + camera + vw / 2;
    const y = base - amp * (Math.sin(X * freq + seed) * .6 + Math.sin(X * freq * 2.3 + seed * 3) * .3 + .5);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(vw + 24, VH); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, base - amp * .4, vw, 3);
}
// Distant landmarks of every theme, visible from neighbouring areas → one connected place.
function farProps(t) {
  const k = .34;
  const tower = (X, h, c, roof) => { const x = px(X, k); if (x < -120 || x > vw + 120) return; rounded(x - 26, 330 - h, 52, h, 10, c); ctx.beginPath(); ctx.moveTo(x - 36, 334 - h); ctx.lineTo(x, 286 - h); ctx.lineTo(x + 36, 334 - h); ctx.closePath(); ctx.fillStyle = roof; ctx.fill(); ellipse(x, 300 - h + 8, 10, 12, '#fff8', null); star(x, 280 - h, 8, '#fff3b0'); };
  [[150, 120, '#f6b2e6', '#b98af7'], [1750, 160, '#b9a2ff', '#ff9cc9'], [3350, 110, '#9de4ef', '#ffb7d9'], [4950, 140, '#ffc9e8', '#a98af7']].forEach(a => tower(...a));
  const pencil = (X, h, c) => { const x = px(X, k); if (x < -60 || x > vw + 60) return; rounded(x - 14, 330 - h, 28, h, 4, c); ctx.beginPath(); ctx.moveTo(x - 14, 332 - h); ctx.lineTo(x, 300 - h); ctx.lineTo(x + 14, 332 - h); ctx.closePath(); ctx.fillStyle = '#ffe2b8'; ctx.fill(); ellipse(x, 304 - h, 4, 5, c); };
  [[620, 150, '#ff86b9'], [670, 120, '#ffd25a'], [2250, 170, '#5ccff2'], [2300, 135, '#9b7cf5'], [3880, 140, '#6ee0a2'], [3930, 115, '#ff86b9'], [5600, 160, '#ffd25a'], [5650, 125, '#5ccff2']].forEach(a => pencil(...a));
  const flask = (X, s, c) => { const x = px(X, k); if (x < -80 || x > vw + 80) return; ctx.beginPath(); ctx.moveTo(x - 12 * s, 200); ctx.lineTo(x - 12 * s, 240); ctx.lineTo(x - 44 * s, 322); ctx.quadraticCurveTo(x, 340, x + 44 * s, 322); ctx.lineTo(x + 12 * s, 240); ctx.lineTo(x + 12 * s, 200); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 30 * s, 290); ctx.lineTo(x + 30 * s, 290); ctx.lineTo(x + 44 * s, 322); ctx.quadraticCurveTo(x, 340, x - 44 * s, 322); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); for (let i = 0; i < 3; i++) ellipse(x + Math.sin(t + i * 2) * 8, 190 - ((t * 30 + i * 30) % 90), 5 + i, 5 + i, 'rgba(255,255,255,.6)'); };
  flask(1100, 1, '#7fe3d5'); flask(2700, 1.3, '#d48cf5'); flask(4300, .9, '#ffb36b'); flask(6000, 1.1, '#7fe3d5');
  const tent = (X, c1, c2) => { const x = px(X, k); if (x < -130 || x > vw + 130) return; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x, 210); ctx.lineTo(x - 90 + i * 30, 330); ctx.lineTo(x - 60 + i * 30, 330); ctx.closePath(); ctx.fillStyle = i % 2 ? c1 : c2; ctx.fill(); } star(x, 204, 10, '#fff2a8'); };
  tent(400, '#ff8db8', '#fff1f6'); tent(2050, '#8fd5ff', '#fff6e0'); tent(3650, '#ff8db8', '#fff1f6'); tent(5300, '#8fd5ff', '#fff6e0');
  for (const WX of [1350, 4500]) { const xw = px(WX, k); if (xw > -150 && xw < vw + 150) { ctx.save(); ctx.translate(xw, 230); ctx.rotate(t * .12); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 80, 0, TAU); ctx.stroke(); for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 8) * 80, Math.sin(i * TAU / 8) * 80); ctx.stroke(); } ctx.restore(); } }
  [[900, 110, '#ff9ccd'], [2600, 90, '#ffd36b'], [4200, 120, '#9fe6ff'], [5800, 80, '#ff9ccd']].forEach(([X, y, c], i) => { const x = px(X, .3) + Math.sin(t * .4 + i) * 8, yy = y + Math.sin(t * .6 + i) * 6; if (x < -50 || x > vw + 50) return; ellipse(x, yy, 22, 26, c); ctx.strokeStyle = '#fff9'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 8, yy + 22); ctx.lineTo(x - 5, yy + 38); ctx.moveTo(x + 8, yy + 22); ctx.lineTo(x + 5, yy + 38); ctx.stroke(); rounded(x - 7, yy + 37, 14, 9, 3, '#c68b5e'); });
}
// Mid layer: the giant indoor/outdoor play-center frame (arches, beams, colored windows)
// Mid layer: a giant glass conservatory play-centre — arched windows, gold columns,
// a pink balcony walkway with railings, and hanging ivy.
function midArchitecture(t) {
  const k = .5;
  for (let i = -1; i < 20; i++) {
    const X = i * 360 + 120, x = px(X, k); if (x < -220 || x > vw + 220) continue;
    // window frame + lattice panes (sky shows through)
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - 140, 380); ctx.lineTo(x - 140, 170); ctx.quadraticCurveTo(x, 20, x + 140, 170); ctx.lineTo(x + 140, 380); ctx.closePath();
    ctx.fillStyle = 'rgba(235,248,255,.12)'; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
    for (let gx = x - 140; gx <= x + 140; gx += 35) { ctx.beginPath(); ctx.moveTo(gx, 20); ctx.lineTo(gx, 380); ctx.stroke(); }
    for (let gy = 60; gy < 380; gy += 40) { ctx.beginPath(); ctx.moveTo(x - 140, gy); ctx.lineTo(x + 140, gy); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = ['#c58bf0', '#ff9fd2', '#9fd4ff'][((i % 3) + 3) % 3]; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 140, 380); ctx.lineTo(x - 140, 170); ctx.quadraticCurveTo(x, 20, x + 140, 170); ctx.lineTo(x + 140, 380); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.stroke();
    // gold-capped column between windows
    rounded(x + 160, 120, 26, 270, 10, grad(x + 160, 0, 26, 0, [[0, '#d7a8f5'], [.5, '#f6dcff'], [1, '#b98ae6']]));
    ellipse(x + 173, 122, 18, 8, '#f2c35a'); star(x + 173, 104, 9, '#ffe27a');
    gear(x + 173, 240, 20, 8, t * (world.powered ? 1.2 : .25) * (i % 2 ? 1 : -1), i % 2 ? '#ffd16b' : '#9fe6ff');
    for (let j = 0; j < 5; j++) bulb(x - 110 + j * 55, 132 - Math.sin((j + .5) / 5 * Math.PI) * 70, Math.sin(t * 2 + i + j) > -.5, '#ffe3a0', .7);
  }
  // rich interior wall below the windows (zone tinted)
  const wallC = mixHex(palette.hillB, '#7a3fb0', .55);
  ctx.fillStyle = grad(0, 280, 0, 120, [[0, withAlpha(wallC, .55)], [1, withAlpha(shade(wallC, -.25), .85)]]); ctx.fillRect(0, 282, vw, 120);
  for (let i = -1; i < 30; i++) { const X = i * 150, x = px(X, .62); if (x < -60 || x > vw + 60) continue; rounded(x - 46, 300, 92, 70, 14, 'rgba(255,255,255,.07)', 'rgba(255,230,160,.35)', 2); star(x, 335, 8, 'rgba(255,230,140,.35)'); }
  // balcony walkway with railing (nearer than the windows)
  const kb = .72, y0 = 268;
  const xs = (camera + vw / 2) * (1 - kb);
  ctx.save(); ctx.translate(-((camera) * kb) % 48, 0);
  ctx.fillStyle = 'rgba(214,120,200,.55)'; ctx.fillRect(-60, y0, vw + 160, 18);
  ctx.fillStyle = 'rgba(255,214,107,.75)'; ctx.fillRect(-60, y0 - 4, vw + 160, 5);
  ctx.strokeStyle = 'rgba(255,170,220,.85)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-60, y0 - 30); ctx.lineTo(vw + 100, y0 - 30); ctx.stroke();
  for (let x = -48; x < vw + 100; x += 48) { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y0 - 30); ctx.lineTo(x, y0); ctx.stroke(); }
  ctx.restore();
  for (let i = -1; i < 40; i++) {
    const X = i * 230 + 60, x = px(X, kb); if (x < -40 || x > vw + 40) continue;
    vine(x, y0 + 16, 50 + (i * 37) % 60, t, i);
    if (i % 2 === 0) { glow(x + 60, y0 - 36, 18, '#fff3a6', .7); star(x + 60, y0 - 36, 9, '#ffe27a'); }
  }
}
// ---------------- ground ----------------
function ground(t) {
  // glossy tiled play-floor with light reflections
  const f = palette.floor, gy = GROUND - camY, h = VH - gy;
  ctx.fillStyle = grad(0, gy, 0, h, [[0, f[0]], [.25, f[1]], [1, f[2]]]); ctx.fillRect(0, gy, vw, h);
  const tw = 96, off = camera % tw;
  for (let r = 0; r < 2; r++) {
    const ty = gy + 12 + r * 36, th = r ? 50 : 32;
    for (let x = -off - tw + (r ? tw / 2 : 0); x < vw + tw; x += tw) {
      const n = Math.floor((x + camera) / tw) + r;
      rounded(x + 3, ty, tw - 6, th, 9, n % 2 ? 'rgba(255,255,255,.13)' : 'rgba(60,10,90,.12)');
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x + 10, ty + 3, tw - 26, 3);
      if (n % 3 === 0) star(x + tw / 2, ty + th / 2, 7, 'rgba(255,240,170,.5)');
    }
  }
  // long glossy sheen + reflected lights
  ctx.fillStyle = grad(0, gy, 0, 40, [[0, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, gy + 8, vw, 40);
  for (let i = Math.floor(camera / 220) - 1; i < (camera + vw) / 220 + 1; i++) { const x = i * 220 - camera + 60; glow(x, gy + 30, 34, ['#ff9fd8', '#ffe08a', '#9fe6ff', '#c9a6ff'][((i % 4) + 4) % 4], .35); }
  // gold edge
  ctx.fillStyle = '#ffd36b'; ctx.fillRect(0, gy - 1, vw, 8); ctx.fillStyle = '#fff4c8'; ctx.fillRect(0, gy - 1, vw, 2.5); ctx.fillStyle = 'rgba(140,70,20,.35)'; ctx.fillRect(0, gy + 7, vw, 2);
}
function foreground(t) {
  const k = 1.35;
  for (let i = -1; i < 40; i++) {
    const X = i * 330 + 140, x = vw / 2 + (X - (camera + vw / 2)) * k; if (x < -120 || x > vw + 120) continue;
    ctx.translate(0, -camY * 1.35 + 45);
    const kind = i % 4, c = ['#ff7fc0', '#7fd8f5', '#ffd15e', '#a98af7'][((i % 4) + 4) % 4];
    ctx.save(); ctx.globalAlpha = .92;
    if (kind === 0) { rounded(x - 46, 492, 92, 70, 18, shade(c, -.15), '#ffffffaa', 3); star(x, 520, 14, '#fff6c5'); }
    else if (kind === 1) { ellipse(x, 516, 46, 40, rg(x, 516, 46, [[0, '#ffffff'], [.25, c], [1, shade(c, -.3)]])); }
    else if (kind === 2) { rounded(x - 10, 470, 20, 80, 10, '#fff4e0'); ellipse(x, 470, 18, 18, c, '#fff', 3); }
    else { for (let j = 0; j < 3; j++) ellipse(x - 30 + j * 30, 520 - (j % 2) * 14, 24, 24, rg(x - 30 + j * 30, 520, 24, [[0, '#fff'], [.3, ['#ff9bd0', '#8fe6ff', '#ffe08a'][j]], [1, '#8a5cc9']])); }
    ctx.restore(); ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
}

// ---------------- shared prop helpers ----------------
function machineBox(x, y, w, h, c1, c2, r = 26, lights = true) {
  // glossy body + gold trim + marquee bulbs, like a toy-shop machine
  ellipse(x + w / 2, GROUND + 4, w * .55, 10, 'rgba(50,20,100,.22)');
  rounded(x, y, w, h, r, grad(x, y, 0, h, [[0, shade(c1, .12)], [.55, c1], [1, c2]]), '#e9a93a', 8);
  rounded(x + 3, y + 3, w - 6, h - 6, r - 3, null, '#fff2c4', 2.5);
  rounded(x + 12, y + 10, w - 24, 12, 6, 'rgba(255,255,255,.32)');
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x + 20, y + h - 10); ctx.lineTo(x + 50, y + 26); ctx.lineTo(x + 68, y + 26); ctx.lineTo(x + 38, y + h - 10); ctx.fill();
  for (const bx of [x + 16, x + w - 16]) ellipse(bx, y + h - 16, 4, 4, '#ffe08a', '#b07a20', 1.5);
  if (lights) for (let bx = x + 26; bx < x + w - 16; bx += 30) bulb(bx, y + 2, Math.sin(gameTime * 3 + bx) > -.6, '#ffd76a', .75);
}
function drawColumn(x, y, h, color) {
  rounded(x - 18, y, 36, h, 17, grad(x - 18, 0, 36, 0, [[0, shade(color, .25)], [1, shade(color, -.12)]]), '#fff5eb', 5);
  ellipse(x, y + 3, 30, 11, '#ffc65f', '#fff', 4); ellipse(x, y + h, 31, 12, '#ffa6d6', '#fff', 4);
}
function bunting(x, y, w, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#fff9ea'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w / 2, 34, w, 0); ctx.stroke();
  for (let i = 0; i < 10; i++) { const k = (i + .4) / 10, xx = k * w, yy = 26 * Math.sin(Math.PI * k), sw = Math.sin(t * 2 + i) * 3; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - 10 + sw, yy + 27); ctx.lineTo(xx + 13 + sw, yy + 27); ctx.closePath(); ctx.fillStyle = ['#ff6fae', '#ffe76e', '#69ddef', '#9c7bfe', '#6bdfb4'][i % 5]; ctx.fill(); }
  ctx.restore();
}
function platform(x, y, w) {
  rounded(x, y, w, 22, 10, grad(x, y, 0, 22, [[0, '#ffd58a'], [1, '#ffae5c']]), '#fff3d6', 4);
  rounded(x + 9, y + 9, w - 18, 9, 5, '#c87de5');
  for (let i = x + 24; i < x + w - 8; i += 35) sparkle(i, y + 11, 4, '#fff9d6');
}
function bez(p0, p1, p2, p3, u) { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; }
const SLIDE = [[902, 297], [942, 310], [966, 370], [1040, 392], [1070, 404], [1130, 433], [1170, 447]];
function slidePos(s) {
  const P = SLIDE, seg = s < .5 ? 0 : 3, u = s < .5 ? s * 2 : (s - .5) * 2;
  return [bez(P[seg][0], P[seg + 1][0], P[seg + 2][0], P[seg + 3][0], u), bez(P[seg][1], P[seg + 1][1], P[seg + 2][1], P[seg + 3][1], u)];
}

// ---------------- MEGA PLAYHOUSE ----------------
function drawBallPitBack() {
  rounded(120, 396, 490, 72, 30, grad(120, 396, 0, 72, [[0, '#ff9ad6'], [1, '#e2609f']]), '#fff7ef', 6);
  for (let i = 0; i < 34; i++) { const x = 141 + (i * 77) % 440, y = 404 + (i * 29) % 30 + Math.sin(gameTime * 6 + i) * world.pitJiggle * 4; ellipse(x, y, 15, 14, rg(x, y, 15, [[0, '#fff'], [.3, ['#65dcec', '#ffda68', '#b587ff', '#ff67ab'][i % 4]], [1, shade(['#65dcec', '#ffda68', '#b587ff', '#ff67ab'][i % 4], -.25)]])); }
}
function drawBallPitFront() {
  // front rim + a row of balls drawn OVER the player so they wade into the pit
  for (let i = 0; i < 16; i++) { const x = 140 + i * 30, y = 432 + Math.sin(gameTime * 5 + i * 2) * world.pitJiggle * 5 + (i % 2) * 4; const c = ['#ff67ab', '#65dcec', '#ffda68', '#b587ff'][i % 4]; ellipse(x, y, 16, 15, rg(x, y, 16, [[0, '#fff'], [.3, c], [1, shade(c, -.25)]])); }
  rounded(128, 440, 473, 30, 12, grad(128, 440, 0, 30, [[0, '#a874ee'], [1, '#7c4bc9']]), '#fff1cf', 4);
  text('BALL PIT', 365, 455, 15, '#fff', '#7a46b5');
}
function playStructure(t) {
  if (!cull(630, 700)) return;
  drawColumn(750, 204, 246, '#a06cef'); drawColumn(1000, 157, 293, '#57c9e7');
  // little house roof on the tower
  ctx.beginPath(); ctx.moveTo(950, 160); ctx.lineTo(1000, 92); ctx.lineTo(1050, 160); ctx.closePath(); ctx.fillStyle = grad(950, 92, 0, 70, [[0, '#ff8fc8'], [1, '#e65c9f']]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
  star(1000, 86, 12, '#ffe36e');
  rounded(685, 213, 400, 18, 10, '#ff98c8', '#fff0d0', 4); bunting(700, 199, 360, t);
  // climbing net
  rounded(690, 239, 92, 116, 15, 'rgba(229,198,255,.7)', '#ffffff', 5);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(700, 265 + i * 25); ctx.lineTo(772, 265 + i * 25); ctx.stroke(); }
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(712 + i * 24, 245); ctx.lineTo(712 + i * 24, 350); ctx.stroke(); }
  platform(675, 355, 190); platform(870, 319, 105); platform(1140, 376, 130);
  // the big rainbow slide (a real path the player rides)
  ctx.lineCap = 'round';
  const slideStroke = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...SLIDE[0]); ctx.bezierCurveTo(...SLIDE[1], ...SLIDE[2], ...SLIDE[3]); ctx.bezierCurveTo(...SLIDE[4], ...SLIDE[5], ...SLIDE[6]); ctx.stroke(); };
  slideStroke(34, '#6a43b8'); slideStroke(26, '#fff0a8'); slideStroke(16, '#ff75b6'); slideStroke(5, 'rgba(255,255,255,.7)');
  for (let i = 0; i < 6; i++) { const p = slidePos(.08 + i * .16); sparkle(p[0], p[1] - 4, 4 + Math.sin(t * 5 + i) * 1.5, '#ffffff'); }
  // trampoline with a mat that really dips
  const dip = world.tramp.x;
  rounded(638, 426, 195, 25, 13, '#6d45b4', '#fff', 5);
  ctx.beginPath(); ctx.moveTo(652, 430); ctx.quadraticCurveTo(735, 430 + dip * 2, 818, 430); ctx.quadraticCurveTo(735, 440 + dip * 2, 652, 430); ctx.fillStyle = '#26265e'; ctx.fill(); ctx.strokeStyle = '#ffcb75'; ctx.lineWidth = 6; ctx.stroke();
  for (let i = 0; i < 9; i++) { const x = 663 + i * 18; ctx.strokeStyle = '#e3cbff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 431 + dip * .6); ctx.lineTo(x + 4, 444); ctx.stroke(); }
  text('BOING!', 735, 386 + Math.sin(t * 4) * 4 - Math.max(0, dip) * .5, 24, '#fff16e', '#b858b3');
  // rainbow bridge
  for (let i = 0; i < 5; i++) { ctx.strokeStyle = ['#ff72bd', '#ffca67', '#93df8f', '#5ccafa', '#ba8cf5'][i]; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(1205, 376, 58 - i * 8, Math.PI, TAU); ctx.stroke(); }
}

// ---------------- IMAGINATION STUDIO ----------------
function paintWall(t) {
  if (!cull(1680, 380)) return;
  ellipse(1683, GROUND + 4, 330, 12, 'rgba(50,20,100,.18)');
  rounded(1373, 114, 620, 295, 30, grad(1373, 114, 0, 295, [[0, '#b98af0'], [1, '#8a5fd0']]), '#fff4fb', 8);
  rounded(1406, 130, 550, 242, 15, '#fff9e7', '#e6d2ff', 8);
  ctx.save(); ctx.beginPath(); ctx.roundRect(1418, 137, 527, 226, 12); ctx.clip();
  ctx.fillStyle = '#fffdf6'; ctx.fillRect(1418, 137, 527, 226);
  ctx.globalAlpha = .15; star(1600, 221, 55, '#dca4ff'); star(1840, 292, 36, '#ffbd79'); ellipse(1500, 284, 42, 29, '#88dbe8'); ctx.globalAlpha = 1;
  for (const s of world.strokes) if (!s.s) drawStroke(s);
  drawStickersOn(0);
  ctx.restore();
  // easel legs + title banner
  rounded(1520, 98, 300, 42, 20, grad(1520, 98, 300, 0, [[0, '#ff89cb'], [1, '#a36df1']]), '#fff', 4);
  ellipse(1570, 119, 12, 12, '#ffe06e'); ellipse(1770, 119, 12, 12, '#6fe0ee');
  for (let i = 0; i < 4; i++) ellipse(1620 + i * 34, 119, 11, 11, ['#ff5aa5', '#ffd23f', '#3d9bff', '#7be08a'][i], '#fff', 3);
  // brush tray
  rounded(1410, 395, 550, 32, 9, '#ffc95a', '#fff5de', 4);
  for (let i = 0; i < 6; i++) { const x = 1520 + i * 55, c = ['#fe72b5', '#ffe071', '#6adce9', '#b58cfc', '#71e1a6', '#ffa472'][i]; rounded(x - 15, 371, 30, 31, 7, c, '#fff', 3); ctx.strokeStyle = '#7047af'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 5, 373); ctx.lineTo(x - 11, 346 + Math.sin(t * 2 + i) * 2); ctx.stroke(); ellipse(x - 11, 344 + Math.sin(t * 2 + i) * 2, 5, 7, c); }
  platform(1760, 344, 140);
}
function drawStroke(s) {
  if (!s.points.length) return;
  const w = s.w || 16;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = (dx, dy) => { ctx.beginPath(); s.points.forEach((p, i) => i ? ctx.lineTo(p[0] + dx, p[1] + dy) : ctx.moveTo(p[0] + dx, p[1] + dy)); if (s.points.length === 1) ctx.lineTo(s.points[0][0] + .1, s.points[0][1]); };
  path(0, 1.5); ctx.strokeStyle = shade(s.color, -.25); ctx.lineWidth = w + 2; ctx.stroke();
  path(0, 0); ctx.strokeStyle = s.color; ctx.lineWidth = w; ctx.stroke();
  path(-w * .15, -w * .18); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = w * .28; ctx.stroke();
  drawDripsAndShine(s);
}
// Color Mixer: 3 hanging buckets pour real paint into a glass bowl; the spinner stirs it
// and pumps the new color down the pipe into the bubble machine.
function mixerMachine(t) {
  if (!cull(2190, 260)) return;
  const M = LAYOUT.mixer;
  // rail with buckets
  drawColumn(2072, 150, 172, '#ffb35c'); drawColumn(2308, 150, 172, '#ffb35c');
  rounded(2060, 140, 260, 16, 8, '#ff8fc5', '#fff', 4);
  for (const k of ['r', 'y', 'b']) {
    const [bx, by] = LAYOUT.buckets[k], tilt = world.bucketTilt[k];
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, 156); ctx.lineTo(bx, by - 26); ctx.stroke();
    ctx.save(); ctx.translate(bx, by); ctx.rotate(tilt * (k === 'r' ? 1 : k === 'b' ? -1 : 1) * 1.1);
    ctx.beginPath(); ctx.arc(0, -16, 22, Math.PI, 0); ctx.strokeStyle = '#7a4bb0'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-26, -14); ctx.lineTo(26, -14); ctx.lineTo(20, 26); ctx.quadraticCurveTo(0, 32, -20, 26); ctx.closePath();
    ctx.fillStyle = grad(-26, 0, 52, 0, [[0, '#ffffff'], [1, '#d9e4f5']]); ctx.fill(); ctx.strokeStyle = '#7a4bb0'; ctx.lineWidth = 4; ctx.stroke();
    ellipse(0, -14, 26, 7, PAINTS[k].hex, '#7a4bb0', 3);
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -10, 6, 0); ctx.arc(0, 2, 6, 0, Math.PI); ctx.fillStyle = PAINTS[k].hex; ctx.fill();
    ctx.restore();
  }
  machineBox(M.x, M.top, M.w, GROUND - M.top - 2, '#a777e8', '#7444c4');
  // glass bowl with the current mixture
  const [bx, by] = M.bowl, fill = world.portions.length / 4, mix = mixPortions(world.portions);
  ctx.save(); ctx.beginPath(); ctx.moveTo(bx - 62, by - 20); ctx.quadraticCurveTo(bx - 60, by + 34, bx, by + 36); ctx.quadraticCurveTo(bx + 60, by + 34, bx + 62, by - 20); ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(220,245,255,.55)'; ctx.fillRect(bx - 70, by - 30, 140, 70);
  if (mix) {
    const level = by + 36 - 54 * fill;
    ctx.fillStyle = mix; ctx.beginPath(); ctx.moveTo(bx - 70, level);
    for (let x = -70; x <= 70; x += 10) ctx.lineTo(bx + x, level + Math.sin(x * .1 + t * 6) * (2 + world.stir * 5));
    ctx.lineTo(bx + 70, by + 40); ctx.lineTo(bx - 70, by + 40); ctx.closePath(); ctx.fill();
    if (world.stir > 0) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let a = 0; a < 12; a += .3) ctx.lineTo(bx + Math.cos(a + t * 12) * a * 3.5, level + 14 + Math.sin(a + t * 12) * a * 1); ctx.stroke(); }
  }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(bx - 62, by - 20); ctx.quadraticCurveTo(bx - 60, by + 34, bx, by + 36); ctx.quadraticCurveTo(bx + 60, by + 34, bx + 62, by - 20); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
  ellipse(bx, by - 20, 62, 8, null, '#ffffff', 4);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(bx - 30, by, 18, 2.2, 3.4); ctx.stroke();
  // little level dots (how many scoops)
  for (let i = 0; i < 4; i++) ellipse(bx - 27 + i * 18, by + 52, 6, 6, i < world.portions.length ? (mixPortions(world.portions.slice(0, i + 1)) || '#fff') : 'rgba(255,255,255,.3)', '#fff', 2);
  // the rainbow SPIN wheel (stirs + pumps)
  const [sx, sy] = M.spinner, wig = Math.sin(t * 20) * world.spinnerWiggle * .15;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(world.mixSpin + wig);
  const hues = ['#f66dac', '#6cdef0', '#ffcb58', '#a77bfa', '#75dfa8'];
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 36, i * TAU / 5, (i + 1) * TAU / 5); ctx.closePath(); ctx.fillStyle = hues[i]; ctx.fill(); }
  ellipse(0, 0, 36, 36, null, '#fff', 5); ellipse(0, 0, 11, 11, '#fff', '#8b64bc', 4);
  rounded(26, -6, 26, 12, 6, '#ffe07a', '#fff', 3); ellipse(52, 0, 9, 9, '#ff7fb8', '#fff', 3);
  ctx.restore();
  // valve light shows when paint is flowing
  ellipse(2328, 410, 9, 9, world.pipeBlobs.length ? '#7dff9c' : '#c3a6ec', '#fff', 3);
}
function drawPipe(t) {
  if (!cull(2400, 120)) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); PIPE.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
  path(); ctx.strokeStyle = '#5d7fc4'; ctx.lineWidth = 26; ctx.stroke();
  path(); ctx.strokeStyle = 'rgba(210,245,255,.92)'; ctx.lineWidth = 19; ctx.stroke();
  for (const b of world.pipeBlobs) { const p = pipePoint(b.s); ellipse(p[0], p[1], 9, 9, b.color, 'rgba(255,255,255,.7)', 2); }
  path(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.stroke();
  for (const p of PIPE.slice(1, -1)) ellipse(p[0], p[1], 15, 15, '#ffd36b', '#fff', 3);
}
let PIPE_LEN = 0; const PIPE_SEG = [];
PIPE.forEach((p, i) => { if (i) { const L = Math.hypot(p[0] - PIPE[i - 1][0], p[1] - PIPE[i - 1][1]); PIPE_SEG.push(L); PIPE_LEN += L; } });
function pipePoint(s) {
  let d = clamp(s, 0, 1) * PIPE_LEN;
  for (let i = 0; i < PIPE_SEG.length; i++) { if (d <= PIPE_SEG[i]) { const a = PIPE[i], b = PIPE[i + 1], u = d / PIPE_SEG[i]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } d -= PIPE_SEG[i]; }
  return PIPE[PIPE.length - 1];
}

// ---------------- WONDER LAB ----------------
function bubbleMachine(t) {
  if (!cull(2520, 200)) return;
  const B = LAYOUT.bubbler, [tx, ty, tw, th] = B.tank;
  machineBox(B.x, B.top, B.w, GROUND - B.top - 2, '#5fc8e8', '#3c86c9');
  // paint tank (glass) shows how much colored paint is waiting
  rounded(tx, ty, tw, th, 16, 'rgba(225,248,255,.8)', '#fff', 4);
  if (world.tank.amount > 0 && world.tank.color) {
    const h = (th - 12) * world.tank.amount / 8;
    ctx.save(); ctx.beginPath(); ctx.roundRect(tx + 5, ty + 6, tw - 10, th - 12, 12); ctx.clip();
    ctx.fillStyle = world.tank.color; ctx.beginPath(); ctx.moveTo(tx, ty + th - 6 - h);
    for (let x = 0; x <= tw; x += 6) ctx.lineTo(tx + x, ty + th - 6 - h + Math.sin(x * .3 + t * 4) * 2);
    ctx.lineTo(tx + tw, ty + th); ctx.lineTo(tx, ty + th); ctx.fill();
    for (let i = 0; i < 3; i++) ellipse(tx + 14 + i * 11, ty + th - 14 - ((t * 25 + i * 20) % Math.max(10, h)), 3, 3, 'rgba(255,255,255,.7)');
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx + 12, ty + 16); ctx.lineTo(tx + 12, ty + th - 22); ctx.stroke();
  // window with swirling bubbles
  rounded(2478, 312, 140, 70, 28, 'rgba(190,245,255,.95)', '#fff', 5);
  for (let i = 0; i < 7; i++) ellipse(2496 + i * 18, 362 - 18 * Math.abs(Math.sin(t * 2 + i)), 8, 8, world.tank.color ? withAlpha(world.tank.color, .55) : 'rgba(255,255,255,.75)', 'rgba(255,255,255,.9)', 2);
  // the big BLOW button
  const press = world.blowT > 0 ? 4 : 0;
  ellipse(2548, 414, 34, 14, '#2e5f9d');
  ellipse(2548, 407 + press, 30, 14, world.tank.amount > 0 ? world.tank.color : '#ff8fc5', '#fff', 4);
  // bubble horn (nozzle)
  const [nx, ny] = B.nozzle;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(-.5 + Math.sin(t * 3) * .03);
  ctx.beginPath(); ctx.moveTo(-14, 40); ctx.lineTo(-10, 4); ctx.quadraticCurveTo(-34, -24, -10, -30); ctx.lineTo(10, -30); ctx.quadraticCurveTo(34, -24, 10, 4); ctx.lineTo(14, 40); ctx.closePath();
  ctx.fillStyle = grad(-30, 0, 60, 0, [[0, '#ffd36b'], [1, '#ff9a4d']]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
  ellipse(0, -30, 22, 7, '#ffeeb0', '#fff', 3);
  ctx.restore();
}
function wonderEngine(t) {
  if (!cull(2900, 260)) return;
  const E = LAYOUT.engine, [fx, fy] = E.funnel;
  // funnel on its pole (catches drifting colored bubbles)
  const wig = Math.sin(t * 25) * world.funnelWiggle * 5;
  rounded(fx - 11, fy + 60, 22, E.top - fy - 58, 8, 'rgba(220,250,255,.85)', '#fff', 4);
  if (world.feedT > 0) ellipse(fx, fy + 60 + (1 - world.feedT) * (E.top - fy - 60), 9, 9, world.feedColor || '#fff');
  ctx.beginPath(); ctx.moveTo(fx - 66 + wig, fy - 8); ctx.lineTo(fx + 66 + wig, fy - 8); ctx.lineTo(fx + 14, fy + 62); ctx.lineTo(fx - 14, fy + 62); ctx.closePath();
  ctx.fillStyle = grad(fx - 66, 0, 132, 0, [[0, '#ff9ccf'], [.5, '#ffd0ea'], [1, '#c58cff']]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
  ellipse(fx + wig, fy - 8, 66, 12, '#7a4bb0', '#fff', 4);
  // the engine body with a friendly face that wakes up when powered
  machineBox(E.x, E.top, E.w, GROUND - E.top - 2, '#9a66de', '#5d33a8');
  rounded(E.x - 6, E.top - 14, E.w + 12, 20, 9, grad(0, E.top - 14, 0, 20, [[0, '#ffd88f'], [1, '#ffad5c']]), '#fff3d6', 4);
  for (let x = E.x + 10; x < E.x + E.w; x += 40) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, E.top - 14); ctx.lineTo(x, E.top - 40); ctx.stroke(); }
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(E.x - 4, E.top - 40); ctx.lineTo(E.x + E.w + 4, E.top - 40); ctx.stroke();
  // battery: 6 cells filled with the colors of the bubbles you fed it
  rounded(2738, 324, 226, 70, 16, '#3b2580', '#fff', 4);
  for (let i = 0; i < 6; i++) {
    const c = world.battery[i], x = 2748 + i * 36;
    rounded(x, 334, 30, 50, 8, c ? c : 'rgba(255,255,255,.12)', c ? '#fff' : 'rgba(255,255,255,.35)', 2);
    if (c && world.powered) { ctx.globalAlpha = .4 + Math.sin(t * 6 + i) * .3; rounded(x, 334, 30, 50, 8, '#ffffff'); ctx.globalAlpha = 1; }
  }
  if (world.battery.length < 6) { // empty-cell hint: a little paint drop + bubble icon
    const x = 2748 + world.battery.length * 36 + 15; ellipse(x, 359, 9, 9, 'rgba(255,255,255,.0)', 'rgba(255,255,255,.7)', 2); ellipse(x - 3, 356, 2.5, 2.5, 'rgba(255,255,255,.8)');
  }
  // face
  const awake = world.powered, fx2 = 2850, fy2 = 420;
  if (awake) { ellipse(fx2 - 20, fy2 - 6, 7, 9, '#fff'); ellipse(fx2 + 20, fy2 - 6, 7, 9, '#fff'); ellipse(fx2 - 19, fy2 - 5, 4, 6, '#3a2160'); ellipse(fx2 + 21, fy2 - 5, 4, 6, '#3a2160'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx2, fy2 + 2, 9, .2, Math.PI - .2); ctx.stroke(); }
  else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx2 - 20, fy2 - 8, 6, .2, Math.PI - .2); ctx.moveTo(fx2 + 26, fy2 - 8); ctx.arc(fx2 + 20, fy2 - 8, 6, .2, Math.PI - .2); ctx.stroke(); ellipse(fx2, fy2 + 6, 4, 3, '#fff'); }
  // meshing gears (real ratio: big gear 12 teeth, small gear 8 teeth turning the other way)
  gear(2985, 352, 40, 12, world.gearAngle, '#ffd16b');
  gear(3046, 316, 27, 8, -world.gearAngle * 12 / 8 + .2, '#7fe0ee');
  // lever (big handle; up = off, down = on)
  const [lx, ly] = E.lever, ang = (world.labOn ? .75 : -.75) + Math.sin(t * 22) * world.leverWiggle * .15;
  rounded(lx - 22, ly + 8, 44, 30, 10, '#3b2580', '#fff', 3);
  ctx.save(); ctx.translate(lx, ly + 16); ctx.rotate(ang); rounded(-5, -52, 10, 52, 5, '#e9e2ff', '#fff', 2); ellipse(0, -54, 14, 14, world.labOn ? '#72f59d' : '#ff7fb8', '#fff', 4); ctx.restore();
}
function gear(x, y, r, teeth, a, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a0 = i * Math.PI / teeth, rr = i % 2 ? r * .82 : r; ctx.lineTo(Math.cos(a0 - .12) * rr, Math.sin(a0 - .12) * rr); ctx.lineTo(Math.cos(a0 + .12) * rr, Math.sin(a0 + .12) * rr); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  ellipse(0, 0, r * .45, r * .45, shade(col, -.2), '#fff', 2); ellipse(0, 0, r * .16, r * .16, '#5d33a8');
  ctx.restore();
}
function powerCable(t) {
  if (!cull(4300, 1300)) return;
  ctx.lineCap = 'round';
  const pathC = () => { ctx.beginPath(); ctx.moveTo(3082, 438); ctx.lineTo(5560, 438); };
  pathC(); ctx.strokeStyle = '#4b2d8a'; ctx.lineWidth = 9; ctx.stroke();
  if (world.powered) {
    ctx.setLineDash([18, 26]); ctx.lineDashOffset = -t * 160; pathC(); ctx.strokeStyle = '#fff36b'; ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]);
  }
  if (world.powerT > 0) { const x = lerp(3082, 5560, 1 - world.powerT); ellipse(x, 438, 18, 12, '#fffbd0'); sparkle(x, 430, 12, '#fff36b'); }
}
function magnetMachine(t) {
  if (!cull(3310, 220)) return;
  const M = LAYOUT.magnet, [cx, cy] = M.c, on = world.magnetOn;
  machineBox(M.x, 332, M.w, GROUND - 334, '#62bddf', '#3a7fbf', 22);
  platform(M.x + 10, 332, M.w - 20);
  // arm holding the magnet
  rounded(M.x + 26, 150, 22, 184, 10, '#ffd16b', '#fff', 4); rounded(M.x + 26, 140, 160, 20, 10, '#ffd16b', '#fff', 4); rounded(cx - 6, 150, 12, 24, 4, '#e9e2ff');
  ctx.save(); ctx.translate(cx, cy + Math.sin(t * 3) * (on ? 2 : 0));
  ctx.lineCap = 'butt'; ctx.strokeStyle = on ? '#ff5fb0' : '#ff9cc4'; ctx.lineWidth = 30; ctx.beginPath(); ctx.arc(0, 0, 44, Math.PI * 1.02, -.02 + TAU, false); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 50, Math.PI * 1.1, TAU - .1); ctx.stroke();
  rounded(-59, -2, 30, 26, 4, '#eef3ff', '#fff', 2); rounded(29, -2, 30, 26, 4, '#eef3ff', '#fff', 2);
  ctx.restore();
  if (on) { for (let i = 0; i < 3; i++) { const r = ((t * 60 + i * 30) % 90); ctx.strokeStyle = `rgba(255,240,140,${1 - r / 90})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy + 24, 20 + r, .3, Math.PI - .3); ctx.stroke(); } }
  text(on ? 'ON' : 'OFF', cx, 392, 22, '#fff', '#2f6aa6');
  ellipse(cx - 60, 392, 10, 10, on ? '#7dff9c' : '#ff9cc4', '#fff', 3);
}

// ---------------- ADVENTURE PARK ----------------
function launchPad(t) {
  if (!cull(3625, 160)) return;
  const L = LAYOUT.launcher, p = world.powered;
  // arch with countdown lights
  ctx.strokeStyle = p ? '#ffb3dc' : '#c6b6dd'; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(L.a - 6, 430); ctx.lineTo(L.a - 6, 280); ctx.quadraticCurveTo(L.cx, 210, L.b + 6, 280); ctx.lineTo(L.b + 6, 430); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i + .5) / 5 * Math.PI, x = L.cx + Math.cos(a) * 62, y = 268 + Math.sin(a) * 40;
    const lit = p && (player.padTime > i * .14 || Math.sin(t * 4 + i) > .6);
    ellipse(x, y, 9, 9, lit ? ['#ff6fae', '#ffd23f', '#6fe3ff', '#a98af7', '#7be08a'][i] : '#8d7fa6', '#fff', 2);
  }
  rounded(L.a, L.y, L.b - L.a, 30, 12, grad(0, L.y, 0, 30, [[0, p ? '#ff8fc5' : '#b9aac8'], [1, p ? '#d4569b' : '#8d7fa6']]), '#fff', 4);
  for (let i = 0; i < 3; i++) { const x = L.cx - 30 + i * 30, y = L.y + 14 - (p ? Math.abs(Math.sin(t * 5 + i)) * 4 : 0); ctx.beginPath(); ctx.moveTo(x - 9, y + 4); ctx.lineTo(x, y - 6); ctx.lineTo(x + 9, y + 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); }
  if (!p) { // sleepy launcher
    text('z', L.cx + 50 + Math.sin(t * 2) * 4, 240 - (t * 12 % 30), 16, '#fff', '#8d7fa6'); text('z', L.cx + 66, 220 - (t * 12 % 30), 12, '#fff', '#8d7fa6');
    if (world.sleepyT > 0) { ctx.globalAlpha = Math.min(1, world.sleepyT); bubbleIcon(L.cx, 190, '#ffd23f'); ctx.globalAlpha = 1; }
  } else star(L.cx, 214 + Math.sin(t * 4) * 4, 14, '#fff36b');
}
function bubbleIcon(x, y, c) { // "feed the engine colored bubbles" picture hint (no reading needed)
  rounded(x - 46, y - 24, 92, 48, 20, 'rgba(255,255,255,.92)', '#e3b0ee', 3);
  ellipse(x - 22, y, 13, 13, withAlpha(c, .5), '#fff', 2); ellipse(x - 26, y - 4, 4, 3, '#fff');
  ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x - 4, y + 6); ctx.strokeStyle = '#8452b0'; ctx.lineWidth = 3; ctx.stroke();
  gear(x + 24, y, 13, 8, gameTime, '#ffd16b');
}
function ferrisWheel(t) {
  if (!cull(4060, 240)) return;
  const W = LAYOUT.wheel, a0 = world.wheelAngle;
  ctx.strokeStyle = '#9971cc'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(W.cx - 40, 412); ctx.lineTo(W.cx, W.cy + 5); ctx.lineTo(W.cx + 40, 412); ctx.stroke();
  ctx.save(); ctx.translate(W.cx, W.cy); ctx.rotate(a0);
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; ctx.strokeStyle = i % 2 ? '#ffa4cb' : '#8be2e9'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * W.r, Math.sin(a) * W.r); ctx.stroke(); }
  ctx.strokeStyle = '#fff2c4'; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(0, 0, W.r, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#ef81c1'; ctx.lineWidth = 10; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, W.r * .55, 0, TAU); ctx.stroke();
  for (let i = 0; i < 20; i++) { const a = i * TAU / 20, on = world.powered ? Math.sin(t * 5 + i) > -.2 : i % 4 === 0; ellipse(Math.cos(a) * W.r, Math.sin(a) * W.r, 5, 5, on ? (world.battery[i % 6] || '#fff7b0') : '#c9b3e0'); }
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const a = a0 + i * Math.PI / 5, x = W.cx + Math.cos(a) * W.r, y = W.cy + Math.sin(a) * W.r, c = ['#ffbb68', '#7be1ed', '#ff85c2', '#a88af5', '#92e1a6'][i % 5];
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 26, y + 14); ctx.quadraticCurveTo(x, y - 2, x + 26, y + 14); ctx.closePath(); ctx.fillStyle = shade(c, .2); ctx.fill();
    rounded(x - 24, y + 14, 48, 26, 9, c, '#fff', 3);
  }
  ellipse(W.cx, W.cy, 23, 23, '#ffe78f', '#fff', 6); star(W.cx, W.cy, 15, '#ff9dd2');
  rounded(3925, 406, 270, 40, 16, grad(0, 406, 0, 40, [[0, '#b98af0'], [1, '#8a5fd0']]), '#fff4d9', 6);
  for (let i = 0; i < 6; i++) ellipse(3955 + i * 42, 426, 7, 7, world.powered ? ['#ff6fae', '#ffd23f', '#6fe3ff'][(i + Math.floor(t * 4)) % 3] : '#d7c6ef');
}
const COASTER_PEAK = 120;
function coasterY(x) {
  const C = LAYOUT.coaster, u = clamp((x - C.a) / (C.b - C.a), 0, 1), s = Math.sin(u * Math.PI);
  return 386 - s * COASTER_PEAK - Math.sin(u * Math.PI * 5) * 55 * s;
}
function coasterTrack(t) {
  if (!cull(4870, 520)) return;
  const C = LAYOUT.coaster;
  for (let x = C.a + 30; x < C.b; x += 70) { const y = coasterY(x); ctx.strokeStyle = '#c3a6ef'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, GROUND); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 2, y + 6); ctx.lineTo(x - 2, GROUND); ctx.stroke(); }
  const rail = (dy, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); for (let x = C.a - 50; x <= C.b + 50; x += 10) ctx.lineTo(x, coasterY(x) + dy); ctx.stroke(); };
  rail(4, 14, '#8457c4'); rail(0, 8, '#ff89c1'); rail(-4, 3, '#fff3fa');
  for (let x = C.a; x < C.b; x += 22) ellipse(x, coasterY(x) + 7, 3, 3, '#ffe9a0');
  // stations
  for (const sx of [C.a - 40, C.b + 40]) { rounded(sx - 55, 396, 110, 50, 14, '#ffcc6d', '#fff2d8', 5); ctx.beginPath(); ctx.moveTo(sx - 64, 330); ctx.lineTo(sx, 290); ctx.lineTo(sx + 64, 330); ctx.closePath(); ctx.fillStyle = '#ff7fb8'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); rounded(sx - 50, 330, 8, 70, 4, '#fff'); rounded(sx + 42, 330, 8, 70, 4, '#fff'); }
}
function coasterTrain(t, uOverride) {
  const C = LAYOUT.coaster, u = uOverride ?? world.coasterU, x0 = lerp(C.a, C.b, u);
  const col = world.lastMix || '#ff7fbf';
  for (let i = 2; i >= 0; i--) {
    const x = x0 - i * 54, y = coasterY(x), ang = Math.atan2(coasterY(x + 4) - coasterY(x - 4), 8);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ellipse(-14, -2, 8, 8, '#4b2d8a', '#fff', 2); ellipse(14, -2, 8, 8, '#4b2d8a', '#fff', 2);
    ctx.beginPath(); ctx.moveTo(-25, -8); ctx.lineTo(25, -8); ctx.quadraticCurveTo(30, -36, 18, -38); ctx.lineTo(-22, -38); ctx.quadraticCurveTo(-28, -30, -25, -8); ctx.closePath();
    ctx.fillStyle = grad(0, -38, 0, 30, [[0, shade(col, .25)], [1, shade(col, -.15)]]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    if (i === 0) star(10, -24, 8, '#fff6b0'); else ellipse(0, -24, 6, 6, 'rgba(255,255,255,.7)');
    ctx.restore();
  }
}
// The whoosh tube: a transparent pneumatic tube along the ceiling that links the far end of
// the park back to the Playhouse ball pit — one physical loop through the whole world.
function ceilingTube(t, front) {
  const y = LAYOUT.tube.y, a = 300, b = LAYOUT.tube.x;
  if (!front) {
    const x1 = Math.max(a, camera - 40), x2 = Math.min(b, camera + vw + 40); // a..b = whole ceiling run
    if (x2 > x1) {
      rounded(x1, y - 20, x2 - x1, 40, 20, 'rgba(210,245,255,.38)', 'rgba(255,255,255,.85)', 4);
      for (let x = Math.ceil(x1 / 300) * 300; x < x2; x += 300) rounded(x - 8, y - 24, 16, 48, 6, 'rgba(255,214,107,.85)', '#fff', 2);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x1, y - 12, x2 - x1, 4);
    }
    // drop chute above the ball pit and the shaft at the park end
    if (cull(a, 60)) { rounded(a - 22, y - 20, 44, LAYOUT.tube.drop - y + 20, 20, 'rgba(210,245,255,.4)', 'rgba(255,255,255,.85)', 4); ellipse(a, LAYOUT.tube.drop, 28, 10, 'rgba(255,255,255,.5)', '#fff', 3); }
    if (cull(b, 160)) {
      rounded(b - 22, y - 20, 44, GROUND - y, 20, 'rgba(210,245,255,.4)', 'rgba(255,255,255,.85)', 4);
      const [d1, d2] = LAYOUT.tube.door;
      ctx.beginPath(); ctx.moveTo(d1 - 8, GROUND); ctx.lineTo(d1 - 8, 330); ctx.quadraticCurveTo((d1 + d2) / 2, 260, d2 + 8, 330); ctx.lineTo(d2 + 8, GROUND); ctx.closePath();
      ctx.fillStyle = grad(d1, 280, 0, 170, [[0, '#ff9ccf'], [1, '#a96cf0']]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.moveTo(d1 + 6, GROUND); ctx.lineTo(d1 + 6, 338); ctx.quadraticCurveTo((d1 + d2) / 2, 282, d2 - 6, 338); ctx.lineTo(d2 - 6, GROUND); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#3d1f78'; ctx.fillRect(d1, 270, d2 - d1, 190);
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = ['#ff6fae', '#ffd23f', '#6fe3ff', '#a98af7', '#7be08a', '#fff'][i]; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc((d1 + d2) / 2, 380, 10 + ((i * 12 + t * 40) % 72), 0, TAU); ctx.stroke(); }
      ctx.restore();
      // arrow up the shaft
      for (let i = 0; i < 3; i++) { const yy = 250 - ((t * 60 + i * 50) % 150); ctx.beginPath(); ctx.moveTo(b - 9, yy + 6); ctx.lineTo(b, yy - 4); ctx.lineTo(b + 9, yy + 6); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke(); }
    }
  }
}
function hangingStars(t) {
  for (let x = 450; x < WORLD_W - 200; x += 300) {
    if (!cull(x, 60)) continue; const y = 150 + Math.sin(x * .007) * 26;
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, LAYOUT.tube.y + 20); ctx.lineTo(x, y); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + x) * .12); star(0, 0, 15, ['#ffd76d', '#fba3cd', '#89e9ef', '#ad97ff'][Math.floor(x / 300) % 4]); sparkle(-4, -4, 4); ctx.restore();
  }
}
function secretStars(t) {
  for (const s of SECRET_STARS) {
    if (world.stars.has(s.id) || !cull(s.x, 40)) continue;
    const y = s.y + Math.sin(t * 3 + s.x) * 5;
    const g = ctx.createRadialGradient(s.x, y, 4, s.x, y, 40); g.addColorStop(0, 'rgba(255,236,140,.75)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(s.x - 40, y - 40, 80, 80);
    ctx.save(); ctx.translate(s.x, y); ctx.rotate(Math.sin(t * 2) * .2); star(0, 0, 20, '#ffd84a'); star(0, 0, 13, '#fff3a6'); ctx.restore();
    sparkle(s.x + 18, y - 16, 5 + Math.sin(t * 7) * 2, '#fff');
  }
}

// Strings of party lights on the big structures (drawn after the props)
function decorLights(t) {
  const P = world.powered;
  if (cull(880, 260)) { bulbString(690, 205, 1080, 205, 14, 12, t); bulbString(950, 162, 1050, 162, 4, 4, t); }
  if (cull(1680, 340)) { bulbString(1373, 112, 1993, 112, 22, 18, t, true, ['#ffd76a', '#ff9fd8', '#9fe6ff']); }
  if (cull(2190, 160)) bulbString(2060, 142, 2320, 142, 8, 8, t);
  if (cull(2900, 200)) bulbString(2716, 258, 3084, 258, 6, 11, t, true);
  if (cull(3310, 160)) bulbString(3186, 142, 3346, 142, 5, 5, t, world.magnetOn);
  if (cull(4060, 200)) bulbString(3925, 400, 4195, 400, 4, 8, t, P);
  for (const sx of [LAYOUT.coaster.a - 40, LAYOUT.coaster.b + 40]) if (cull(sx, 80)) bulbString(sx - 62, 332, sx + 62, 332, 3, 5, t, P);
  if (cull(6145, 120)) bulbString(6092, 330, 6198, 330, -20, 7, t, true, ['#ff6fae', '#ffd23f', '#6fe3ff', '#a98af7']);
  for (const x of [700, 1000, 3200, 3600]) if (cull(x, 30)) vine(x + 10, x < 2000 ? 214 : 150, 60, t, x);
}

// ---------- weaving every theme through the whole world ----------
// Extra paintable easels out in the park (Studio theme everywhere).
function drawEasel(i, t) {
  const S = PAINT_SURFACES[i], w = S.x2 - S.x1, h = S.y2 - S.y1, cx = (S.x1 + S.x2) / 2;
  if (!cull(cx, w)) return;
  ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(S.x1 + 12, S.y2); ctx.lineTo(S.x1 - 4, GROUND); ctx.moveTo(S.x2 - 12, S.y2); ctx.lineTo(S.x2 + 4, GROUND); ctx.moveTo(cx, S.y1 - 10); ctx.lineTo(cx, GROUND - 10); ctx.stroke();
  rounded(S.x1 - 10, S.y1 - 10, w + 20, h + 20, 10, grad(0, S.y1, 0, h, [[0, '#ffd36b'], [1, '#e2a23a']]), '#fff3c4', 3);
  ctx.save(); ctx.beginPath(); ctx.rect(S.x1, S.y1, w, h); ctx.clip();
  ctx.fillStyle = '#fffdf6'; ctx.fillRect(S.x1, S.y1, w, h);
  ctx.globalAlpha = .14; star(cx, (S.y1 + S.y2) / 2, h * .32, '#dca4ff'); ctx.globalAlpha = 1;
  for (const s of world.strokes) if (s.s === i) drawStroke(s);
  drawStickersOn(i);
  ctx.restore();
  rounded(S.x1 - 14, S.y2 + 8, w + 28, 12, 6, '#c47a35', '#fff3c4', 2);
  ['#ff4f9a', '#ffd23f', '#3d9bff'].forEach((c, k) => { rounded(S.x1 + 6 + k * 24, S.y2 - 4, 16, 14, 4, c, '#fff', 2); });
  bulbString(S.x1 - 10, S.y1 - 12, S.x2 + 10, S.y1 - 12, 6, 5, t, true, ['#ff9fd8', '#ffd76a', '#9fe6ff']);
}
// Paint splats on the floor, party bunting, and a rope bridge from the Wonder Engine
// to the magnet: Playhouse / Studio / Park bits woven all along the world.
const SPLATS = [[260, '#ff4f9a'], [880, '#3d9bff'], [1500, '#ffd23f'], [2360, '#36c96b'], [2690, '#ff9a2e'], [3500, '#a15cff'], [4260, '#ff4f9a'], [4900, '#3d9bff'], [5480, '#ffd23f'], [6060, '#36c96b']];
function weaveDecor(t) {
  for (const [x, c] of SPLATS) {
    if (!cull(x, 60)) continue;
    ctx.globalAlpha = .85; ellipse(x, GROUND + 9, 36, 7, c); ellipse(x - 30, GROUND + 7, 9, 3, c); ellipse(x + 34, GROUND + 10, 7, 2.6, c); ellipse(x + 8, GROUND + 6, 10, 3, 'rgba(255,255,255,.45)'); ctx.globalAlpha = 1;
  }
  for (const [x1, x2, y] of [[1990, 2400, 150], [3460, 3920, 170], [4600, 5150, 150], [5880, 6080, 200]]) if (cull((x1 + x2) / 2, (x2 - x1) / 2 + 20)) bunting(x1, y, x2 - x1, t);
  if (cull(3125, 80)) {
    const B = ROPE_BRIDGE;
    ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(B.a, B.y - 30); ctx.quadraticCurveTo((B.a + B.b) / 2, B.y - 18, B.b, B.y - 30); ctx.stroke();
    for (let x = B.a; x <= B.b; x += 15) { rounded(x - 6, B.y - 2, 13, 10, 3, x % 30 ? '#ffb35c' : '#ff8fc5', '#fff3c4', 1.5); ctx.beginPath(); ctx.moveTo(x, B.y); ctx.lineTo(x, B.y - 26); ctx.stroke(); }
  }
}
