// ===================================================================
// 35_decor.js — the "premium storybook" layer: glowing bulbs, gold trim,
// vines, glass bubble tubes, glossy floor reflections and the CAROUSEL.
// ===================================================================
const glowCache = {};
function glowSprite(color) {
  if (glowCache[color]) return glowCache[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, withAlpha(color, .95)); gr.addColorStop(.22, withAlpha(color, .5)); gr.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (glowCache[color] = c);
}
function glow(x, y, r, color, a = 1) { ctx.globalAlpha = a; ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }
// Each bulb is a single pre-rendered sprite (glow + glass + highlight) → one drawImage per bulb.
const bulbCache = {};
function bulbSprite(color, on) {
  const key = color + on; if (bulbCache[key]) return bulbCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  withCtx(g, () => {
    ctx.setTransform(2, 0, 0, 2, 32, 32);
    if (on) glow(0, 0, 14, color, .9);
    ellipse(0, 0, 4.3, 4.3, on ? '#fffbe2' : '#cdb7a0');
    if (on) ellipse(-1.2, -1.2, 1.6, 1.6, '#ffffff');
  });
  return (bulbCache[key] = c);
}
function bulb(x, y, on = true, color = '#ffd76a', size = 1) {
  const s = 16 * size; ctx.drawImage(bulbSprite(color, !!on), x - s, y - s, s * 2, s * 2);
}
// A sagging string of party bulbs between two points.
function bulbString(x1, y1, x2, y2, sag, n, t, on = true, colors) {
  ctx.strokeStyle = 'rgba(90,50,30,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag * 2, x2, y2); ctx.stroke();
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u, x = v * v * x1 + 2 * v * u * (x1 + x2) / 2 + u * u * x2, y = v * v * y1 + 2 * v * u * (Math.max(y1, y2) + sag * 2) + u * u * y2;
    bulb(x, y + 4, on && Math.sin(t * 2.5 + i * 1.7) > -.75, colors ? colors[i % colors.length] : '#ffd76a', .9);
  }
}
// Hanging ivy (decorative leaves, not a garden)
function vine(x, y, len, t, seed = 0) {
  const sw = Math.sin(t * 1.2 + seed) * 5;
  ctx.strokeStyle = '#3f8f4a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * .5, y + len * .5, x + sw, y + len); ctx.stroke();
  for (let i = 1; i < len / 13; i++) {
    const u = i * 13 / len, lx = x + sw * u * u, ly = y + len * u, side = i % 2 ? 1 : -1;
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(side * .9 + Math.sin(t * 2 + i + seed) * .1);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 7, -6, side * 14, 0); ctx.quadraticCurveTo(side * 7, 6, 0, 0);
    ctx.fillStyle = i % 3 ? '#5cc26a' : '#82dc6f'; ctx.fill(); ctx.restore();
  }
}
// Tall glass tube with rising bubbles (background machinery like the Wonder Lab art)
function glassTube(x, top, bottom, liquid, t) {
  if (!cull(x, 40)) return;
  ellipse(x, GROUND + 3, 34, 8, 'rgba(50,20,100,.18)');
  rounded(x - 30, bottom - 22, 60, 26, 8, grad(0, bottom - 22, 0, 26, [[0, '#ffd66e'], [1, '#c98a2a']]), '#fff2c8', 3);
  rounded(x - 30, top - 4, 60, 24, 8, grad(0, top, 0, 24, [[0, '#ffd66e'], [1, '#c98a2a']]), '#fff2c8', 3);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x - 22, top + 18, 44, bottom - top - 40, 14); ctx.clip();
  ctx.fillStyle = 'rgba(225,245,255,.45)'; ctx.fillRect(x - 22, top, 44, bottom - top);
  ctx.fillStyle = grad(0, top, 0, bottom - top, [[0, withAlpha(liquid, .55)], [1, withAlpha(liquid, .9)]]); ctx.fillRect(x - 22, top + 40, 44, bottom - top);
  for (let i = 0; i < 7; i++) { const yy = bottom - 30 - ((t * (26 + i * 5) + i * 47) % (bottom - top - 60)); ellipse(x - 10 + (i * 7) % 22 + Math.sin(t * 2 + i) * 3, yy, 3 + (i % 3) * 2.5, 3 + (i % 3) * 2.5, 'rgba(255,255,255,.18)', 'rgba(255,255,255,.85)', 1.5); }
  ctx.restore();
  rounded(x - 22, top + 18, 44, bottom - top - 40, 14, null, 'rgba(255,255,255,.9)', 3);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x - 15, top + 26, 5, bottom - top - 58);
  glow(x, top + 60, 40, liquid, .25);
}
// Mirror image of the creature on the glossy floor
function floorReflection(t) {
  const P = player; if (P.ride || GROUND - P.y > 140) return;
  ctx.save(); ctx.beginPath(); ctx.rect(camera - 10, GROUND + 2, vw + 20, 120); ctx.clip();
  ctx.globalAlpha = .2 * clamp(1 - (GROUND - P.y) / 140, 0, 1);
  ctx.translate(0, GROUND * 2 + 4); ctx.scale(1, -1);
  drawCreature(P.creature, P.anim, P.x, P.y, { noShadow: true, noTrail: true });
  ctx.restore(); ctx.globalAlpha = 1;
}

// ---------------- CAROUSEL (Adventure Park centrepiece, rideable) ----------------
const MOUNTS = [
  { kind: 'unicorn', body: '#ffffff', mane: ['#ff7ac6', '#b98bff', '#7fe6ff'], saddle: '#c26ae8' },
  { kind: 'bunny', body: '#f4c9ff', mane: ['#d9a3ff'], saddle: '#ff7ab8' },
  { kind: 'pony', body: '#9ff0dc', mane: ['#ffd45e', '#ff8fc8', '#7fb8ff'], saddle: '#ffb347' },
  { kind: 'unicorn', body: '#ffd9ef', mane: ['#ffd45e', '#ff9ec9'], saddle: '#6fb8ff' },
];
function carouselMount(i) {
  const C = LAYOUT.carousel, a = world.carRot + i * TAU / MOUNTS.length, depth = Math.sin(a);
  const x = C.cx + Math.cos(a) * (C.r - 44), y = 318 + depth * 22 + Math.sin(world.carRot * 5 + i * 1.7) * 13;
  return { x, y, depth, s: .8 + .2 * (depth + 1) / 2, facing: depth >= 0 ? 1 : -1, a };
}
function drawMount(m, M, t) {
  ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.s * m.facing, m.s);
  const OUT = '#8a4fb8', gallop = Math.sin(world.carRot * 5 + m.a) * .35;
  // tail
  ctx.lineCap = 'round'; M.mane.forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 9 - k * 2; ctx.beginPath(); ctx.moveTo(-34, -6); ctx.quadraticCurveTo(-58, 0 + k * 4, -52, 22 + k * 3); ctx.stroke(); });
  const legs = [[-20, 8, -.5 - gallop], [-12, 9, -.2 - gallop], [18, 8, .9 + gallop], [26, 6, 1.2 + gallop]];
  inked([
    ...legs.map(([lx, ly, la]) => ({ path: () => limbPath(lx, ly, lx + Math.sin(la) * 22, ly + Math.cos(la) * 22, 5.5, 4.5), fill: M.body })),
    { path: () => ctx.ellipse(0, 0, 36, 19, 0, 0, TAU), fill: M.body },
    { path: () => limbPath(24, -6, 36, -30, 10, 9), fill: M.body },
    { path: () => ctx.ellipse(44, -34, 17, 12, .35, 0, TAU), fill: M.body },
    ...(M.kind === 'bunny' ? [{ path: () => limbPath(40, -42, 34, -70, 5, 4), fill: M.body }, { path: () => limbPath(46, -42, 48, -72, 5, 4), fill: M.body }] : [{ path: () => { ctx.moveTo(34, -42); ctx.lineTo(38, -54); ctx.lineTo(42, -42); ctx.closePath(); }, fill: M.body }]),
  ], OUT, 4);
  legs.forEach(([lx, ly, la]) => ellipse(lx + Math.sin(la) * 22, ly + Math.cos(la) * 22, 5, 4, '#e7a83c'));
  // mane
  M.mane.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(26 - k * 3, -38 + k * 6); ctx.quadraticCurveTo(14 - k * 4, -30 + k * 8, 18 - k * 2, -8 + k * 4); ctx.quadraticCurveTo(28, -22, 30, -40); ctx.closePath(); ctx.fill(); });
  if (M.kind === 'unicorn') { ctx.beginPath(); ctx.moveTo(46, -44); ctx.lineTo(54, -66); ctx.lineTo(52, -42); ctx.closePath(); ctx.fillStyle = grad(46, -66, 0, 24, [[0, '#fff3b0'], [1, '#e2a23a']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke(); }
  if (M.kind === 'pony') star(-6, -2, 7, '#ffffff');
  // happy closed eye + cheek
  ctx.strokeStyle = '#3a1a5c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(47, -36, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ellipse(52, -28, 4, 2.5, '#ff8fb8aa');
  // saddle + star
  ctx.beginPath(); ctx.moveTo(-14, -16); ctx.quadraticCurveTo(0, -24, 14, -16); ctx.lineTo(16, 4); ctx.quadraticCurveTo(0, 10, -16, 4); ctx.closePath(); ctx.fillStyle = M.saddle; ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.stroke();
  star(0, -5, 6, '#ffe57a');
  ctx.restore();
}
function carouselPole(m, t) {
  const yTop = 170, yBot = 392 + m.depth * 22;
  ctx.lineCap = 'butt'; ctx.strokeStyle = '#d9962e'; ctx.lineWidth = 7 * m.s; ctx.beginPath(); ctx.moveTo(m.x, yTop); ctx.lineTo(m.x, yBot); ctx.stroke();
  ctx.strokeStyle = '#fff1b0'; ctx.lineWidth = 2.5 * m.s;
  for (let y = yTop; y < yBot; y += 12) { ctx.beginPath(); ctx.moveTo(m.x - 3 * m.s, y); ctx.lineTo(m.x + 3 * m.s, y + 6); ctx.stroke(); }
}
function drawCarousel(t, riderIndex, drawRider) {
  const C = LAYOUT.carousel, cx = C.cx, r = C.r, p = world.powered, topY = 392;
  if (!cull(cx, r + 40)) return;
  ellipse(cx, GROUND + 4, r * 1.05, 13, 'rgba(50,20,100,.22)');
  // drum + floor disc
  rounded(cx - r, topY, r * 2, 46, 18, grad(0, topY, 0, 46, [[0, '#ff7fc2'], [1, '#b64fb0']]), '#ffd36b', 4);
  for (let i = 0; i < 9; i++) { const x = cx - r + 20 + i * (r * 2 - 40) / 8; star(x, topY + 25, 7, '#ffe27a'); }
  ellipse(cx, topY, r, 28, grad(cx - r, 0, r * 2, 0, [[0, '#e8a2ff'], [.5, '#ffd1f1'], [1, '#e8a2ff']]), '#ffd36b', 5);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = cx + Math.cos(a) * r, y = topY + Math.sin(a) * 28; if (Math.sin(a) > -.2) bulb(x, y, p ? Math.sin(t * 5 + i) > -.3 : i % 3 === 0, '#ffd76a', .8); }
  const ms = MOUNTS.map((M, i) => ({ M, i, m: carouselMount(i) })).sort((a, b) => a.m.depth - b.m.depth);
  const drawOne = o => { carouselPole(o.m, t); drawMount(o.m, o.M, t); if (o.i === riderIndex) drawRider(); };
  ms.filter(o => o.m.depth < 0).forEach(drawOne);
  // centre column with mirror panels
  rounded(cx - 26, 168, 52, topY - 168, 18, grad(cx - 26, 0, 52, 0, [[0, '#c068d8'], [.5, '#ffb2e6'], [1, '#c068d8']]), '#ffd36b', 4);
  for (let y = 186; y < topY - 20; y += 44) { rounded(cx - 14, y, 28, 32, 10, grad(0, y, 0, 32, [[0, '#e9f9ff'], [1, '#9fd2ff']]), '#fff', 2); }
  ms.filter(o => o.m.depth >= 0).forEach(drawOne);
  // canopy
  ctx.beginPath(); ctx.moveTo(cx - r - 18, 176); ctx.quadraticCurveTo(cx - r * .4, 96, cx, 66); ctx.quadraticCurveTo(cx + r * .4, 96, cx + r + 18, 176); ctx.closePath();
  ctx.fillStyle = grad(0, 66, 0, 110, [[0, '#ff9fd8'], [1, '#e2459f']]); ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 5; ctx.stroke();
  ctx.save(); ctx.clip(); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(cx, 60); ctx.lineTo(cx + i * 46 - 12, 180); ctx.lineTo(cx + i * 46 + 12, 180); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill(); } ctx.restore();
  // scalloped valance with bulbs
  const n = 9, w = (r * 2 + 36) / n;
  for (let i = 0; i < n; i++) {
    const x = cx - r - 18 + i * w;
    ctx.beginPath(); ctx.moveTo(x, 172); ctx.lineTo(x + w, 172); ctx.quadraticCurveTo(x + w / 2, 208, x, 172); ctx.fillStyle = i % 2 ? '#ffd36b' : '#c34fd0'; ctx.fill(); ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2; ctx.stroke();
    bulb(x + w / 2, 194, p ? Math.sin(t * 6 - i) > -.4 : i % 2 === 0, '#ffd76a', .9);
  }
  rounded(cx - r - 22, 164, r * 2 + 44, 14, 7, '#ffd36b', '#fff', 2);
  for (let i = 0; i < 12; i++) bulb(cx - r - 10 + i * (r * 2 + 20) / 11, 171, p || i % 2 === 0, '#fff3a6', .7);
  // star emblem shield + finial
  ctx.beginPath(); ctx.moveTo(cx - 34, 108); ctx.quadraticCurveTo(cx, 80, cx + 34, 108); ctx.quadraticCurveTo(cx + 30, 146, cx, 156); ctx.quadraticCurveTo(cx - 30, 146, cx - 34, 108); ctx.closePath();
  ctx.fillStyle = grad(0, 84, 0, 72, [[0, '#ffe9a6'], [1, '#e59a2f']]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  glow(cx, 122, 40, '#fff1a0', p ? .8 : .35); star(cx, 122, 20, '#fff6c2'); star(cx, 122, 13, '#ffd23f');
  rounded(cx - 4, 44, 8, 26, 4, '#ffd36b'); star(cx, 42, 12 + Math.sin(t * 4), '#ffe36e'); glow(cx, 42, 22, '#fff3a6', .7);
}
