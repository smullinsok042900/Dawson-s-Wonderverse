// ===================================================================
// 49x_create.js — build 8: things to CREATE.
//   • PET MAKER (Pet Workshop, underground near the start): five big
//     buttons change colour / ears / tail / pattern / eyes with a live
//     preview; pull the lever and your pet hatches and follows you
//     everywhere (saved). Tap your pet for a trick.
//   • BLOCK BUILDER (Build Room, underground under the Studio): tap squares
//     to place blocks, windows, doors, roofs, stars and hearts in your paint
//     colour. Solid blocks are real platforms you can climb. Saved.
// ===================================================================
const PET_COLORS = ['#ff9fd2', '#ffc46b', '#9fe6ff', '#c9a6ff', '#9ff0b0', '#ff7a7a', '#fff3a6', '#ffffff', '#7fb8ff', '#ffa6e9'];
const PET_PARTS = { ears: 5, tail: 4, pat: 5, eyes: 3 };
const PM = { x: 390, cap: [390, 575], btnY: 668, btns: [['col', 252], ['ears', 312], ['tail', 372], ['pat', 432], ['eyes', 492]], lever: [560, 640] };
Object.assign(world, { pet: null, petDraft: { col: 0, ears: 0, tail: 0, pat: 1, eyes: 0 }, petPos: { x: 0, y: 0 }, petTrick: 0, leverT: 0, build: new Array(9 * 4).fill(null) });
function petColor(d) { return d.col >= PET_COLORS.length ? (world.lastMix || PET_COLORS[0]) : PET_COLORS[d.col]; }
function cyclePet(part) {
  const d = world.petDraft;
  if (part === 'col') d.col = (d.col + 1) % (PET_COLORS.length + (world.lastMix ? 1 : 0)); else d[part] = (d[part] + 1) % PET_PARTS[part];
  world.petPop = .3; Sound.bell(NOTES[{ col: 0, ears: 2, tail: 4, pat: 5, eyes: 7 }[part]], .05); burst(PM.cap[0], PM.cap[1], 6, [petColor(d), '#fff'], 'star', .5);
  discover('petmaker', 'Design your very own pet! Then pull the lever.', PM.cap[0], 520);
}
function makePet() {
  const d = world.petDraft; world.leverT = 1;
  world.pet = { ...d, c: petColor(d) }; world.petPos = { x: PM.cap[0], y: UG.floor };
  confetti(PM.cap[0], PM.cap[1], 60, 420); Sound.chime(); Sound.giggle();
  toast('🐾 Your pet hatched! It will follow you everywhere.'); discover('pet', null, PM.cap[0], 520); save();
}
function drawPet(x, y, P, t, s = 1, mood = '') {
  const c = P.c || petColor(P), O = shade(c, -.45), hop = mood === 'still' ? 0 : -Math.abs(Math.sin(t * 7)) * 8 * s;
  ctx.save(); ctx.translate(x, y + hop); ctx.scale(s, s);
  ellipse(0, -hop / s + 2, 20, 5, 'rgba(60,25,110,.2)');
  // tail
  ctx.save(); ctx.translate(-20, -20); ctx.rotate(Math.sin(t * 6) * .3);
  if (P.tail === 0) ellipse(-6, -2, 9, 9, '#fff', O, 2);
  else if (P.tail === 1) { ctx.strokeStyle = O; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-8, -8, 8, 0, Math.PI * 1.6); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.stroke(); }
  else if (P.tail === 2) { ctx.beginPath(); starPath(-10, -8, 10, 5); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -6, -26, -24); ctx.quadraticCurveTo(-12, -14, 0, -6); ctx.closePath(); ctx.fillStyle = grad(0, 0, -26, -24, [[0, c], [1, '#fff']]); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
  // ears
  const ear = side => {
    ctx.save(); ctx.translate(side * 11, -38); ctx.rotate(side * (.25 + Math.sin(t * 4) * .06));
    if (P.ears === 0) ellipse(0, -12, 6, 15, c, O, 2), ellipse(0, -12, 3, 10, '#ffd1ec');
    else if (P.ears === 1) { ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(0, -16); ctx.lineTo(8, 4); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke(); }
    else if (P.ears === 2) ellipse(0, -2, 8, 8, c, O, 2), ellipse(0, -2, 4, 4, '#ffd1ec');
    else if (P.ears === 3) { ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(side * 4, -16); ctx.stroke(); ellipse(side * 4, -18, 5, 5, '#ffd23f', O, 1.5); }
    else { ctx.rotate(side * .9); ellipse(0, 8, 6, 14, shade(c, -.15), O, 2); }
    ctx.restore();
  };
  ear(-1); ear(1);
  // body
  ctx.beginPath(); fluffPath(0, -22, 22, 20, 12, .07, t); ctx.fillStyle = grad(0, -44, 0, 44, [[0, shade(c, .35)], [1, c]]); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.save(); ctx.beginPath(); fluffPath(0, -22, 22, 20, 12, .07, t); ctx.clip();
  if (P.pat === 1) [[-10, -30], [9, -12], [-4, -8], [12, -34]].forEach(([a, b]) => ellipse(a, b, 4, 3.5, 'rgba(255,255,255,.7)'));
  if (P.pat === 2) for (let i = -2; i <= 2; i++) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(i * 10 - 3, -44, 5, 44); }
  if (P.pat === 3) [[-11, -12], [11, -12]].forEach(([a, b]) => { ctx.beginPath(); heartPath(a, b, 5); ctx.fillStyle = '#ff4f9a'; ctx.fill(); });
  if (P.pat === 4) [[-10, -34], [12, -10], [-6, -10]].forEach(([a, b]) => star(a, b, 5, '#fff6b0'));
  ctx.restore();
  ellipse(0, -14, 11, 7, 'rgba(255,255,255,.55)');
  // eyes
  if (P.eyes === 0) { ellipse(-7, -26, 4.5, 5.5, '#2a0f45'); ellipse(7, -26, 4.5, 5.5, '#2a0f45'); ellipse(-8.5, -28, 1.8, 1.8, '#fff'); ellipse(5.5, -28, 1.8, 1.8, '#fff'); }
  else if (P.eyes === 1) { ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-7, -24, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(11, -24); ctx.arc(7, -24, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  else { star(-7, -26, 6, '#ffd23f'); star(7, -26, 6, '#ffd23f'); ellipse(-7, -26, 1.6, 1.6, '#2a0f45'); ellipse(7, -26, 1.6, 1.6, '#2a0f45'); }
  ellipse(-14, -17, 3.5, 2.2, '#ff7fb0aa'); ellipse(14, -17, 3.5, 2.2, '#ff7fb0aa');
  ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, -19, 3.2, .2, Math.PI - .2); ctx.stroke();
  ellipse(-8, -1, 5, 3.5, shade(c, -.1), O, 1.5); ellipse(8, -1, 5, 3.5, shade(c, -.1), O, 1.5);
  ctx.restore();
}
function updatePet(dt) {
  if (!world.pet) return;
  const P = player, tp = world.trail[Math.min(world.trail.length - 1, 9)] || [P.x, P.y], q = world.petPos;
  if (Math.hypot(tp[0] - q.x, tp[1] - q.y) > 500) { q.x = tp[0]; q.y = tp[1]; }
  q.x += (tp[0] - (P.facing * 30) - q.x) * Math.min(1, dt * 6); q.y += (tp[1] - q.y) * Math.min(1, dt * 6);
  world.petTrick = Math.max(0, world.petTrick - dt);
}
function petTapped() { world.petTrick = 1; Sound.giggle(); burst(world.petPos.x, world.petPos.y - 50, 8, ['#ff8fc8', '#ffd84a'], 'heart', .6); discover('pettrick', 'Your pet does a trick!', world.petPos.x, world.petPos.y - 60); }
function drawPetFollower(t) {
  if (!world.pet || player.ride && player.ride.type === 'tube') return;
  const q = world.petPos; if (!cull(q.x, 40)) return;
  ctx.save(); ctx.translate(q.x, q.y - 22); ctx.rotate(world.petTrick > 0 ? (1 - world.petTrick) * TAU : 0); ctx.translate(-q.x, -(q.y - 22));
  drawPet(q.x, q.y, world.pet, t, 1.15); ctx.restore();
}
function drawPetMaker(t) {
  if (!cull(PM.x + 60, 280) || camY + VH < UG.roomCeil) return;
  const [cx, cy] = PM.cap, d = world.petDraft, pop = (world.petPop = Math.max(0, (world.petPop || 0) - 1 / 60)) * 30;
  rounded(220, 520, 360, 190, 26, grad(0, 520, 0, 190, [[0, '#b58cff'], [1, '#7d45d8']]), '#e9a93a', 6);
  ellipse(cx, cy, 70, 52, 'rgba(225,245,255,.55)', '#fff', 5); glow(cx, cy, 70, petColor(d), .35);
  drawPet(cx, cy + 40, { ...d, c: petColor(d) }, t, 1.35 + pop / 60);
  ellipse(cx - 30, cy - 26, 14, 7, 'rgba(255,255,255,.8)', null, 0, -.5);
  text('PET MAKER', cx, 536, 16, '#fff', '#5a24a8');
  for (const [part, bx] of PM.btns) {
    ellipse(bx, PM.btnY + 4, 24, 10, '#4b2096'); ellipse(bx, PM.btnY, 23, 14, grad(0, PM.btnY - 14, 0, 28, [[0, '#fff'], [1, '#e9dcff']]), '#ffd36b', 3);
    ctx.save(); ctx.translate(bx, PM.btnY);
    if (part === 'col') ellipse(0, 0, 10, 8, petColor(d), '#fff', 2);
    else if (part === 'ears') { ellipse(-5, -1, 3.5, 8, '#c97bff'); ellipse(5, -1, 3.5, 8, '#c97bff'); }
    else if (part === 'tail') { ctx.strokeStyle = '#ff7ab8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 4.5); ctx.stroke(); }
    else if (part === 'pat') { ellipse(-4, -2, 3, 3, '#ff4f9a'); ellipse(4, 3, 3, 3, '#2fa8ff'); ellipse(3, -4, 2, 2, '#ffc21c'); }
    else { ellipse(-4, 0, 3, 4, '#2a0f45'); ellipse(4, 0, 3, 4, '#2a0f45'); }
    ctx.restore();
  }
  // MAKE lever
  const [lx, ly] = PM.lever, a = world.leverT > 0 ? .8 : -.6; world.leverT = Math.max(0, world.leverT - 1 / 60);
  rounded(lx - 16, ly + 8, 32, 30, 8, '#4b2096', '#fff', 2);
  ctx.save(); ctx.translate(lx, ly + 16); ctx.rotate(a); rounded(-4, -50, 8, 50, 4, '#e9e2ff'); ellipse(0, -52, 13, 13, '#ff4f9a', '#fff', 3); ctx.restore();
  if (!world.pet) sparkle(lx + 18, ly - 46, 5 + Math.sin(t * 6) * 2, '#fff6b0');
}
// ---------- BLOCK BUILDER ----------
const BB = { x0: 1806, y0: UG.floor - 4 * 44, cols: 9, rows: 4, cell: 44 };
const BLOCK_TYPES = [null, 'block', 'window', 'door', 'roofL', 'roofR', 'star', 'heart'];
const SOLID = new Set(['block', 'window', 'roofL', 'roofR']);
let builtPlatforms = [];
function rebuildBlockPlatforms() {
  builtPlatforms.forEach(z => { const i = PLATFORMS.indexOf(z); if (i >= 0) PLATFORMS.splice(i, 1); });
  builtPlatforms = [];
  for (let c = 0; c < BB.cols; c++) for (let r = 0; r < BB.rows; r++) {
    const b = world.build[r * BB.cols + c]; if (!b || !SOLID.has(b.t)) continue;
    const above = r > 0 ? world.build[(r - 1) * BB.cols + c] : null; if (above && SOLID.has(above.t)) continue;
    const z = { a: BB.x0 + c * BB.cell, b: BB.x0 + (c + 1) * BB.cell, y: BB.y0 + r * BB.cell, layer: 'ug', built: true };
    builtPlatforms.push(z); PLATFORMS.push(z);
  }
}
function tapBuild(p) {
  const c = Math.floor((p.x - BB.x0) / BB.cell), r = Math.floor((p.y - BB.y0) / BB.cell);
  if (c < 0 || r < 0 || c >= BB.cols || r >= BB.rows) return;
  const i = r * BB.cols + c, cur = world.build[i], k = cur ? BLOCK_TYPES.indexOf(cur.t) : 0, nt = BLOCK_TYPES[(k + 1) % BLOCK_TYPES.length];
  world.build[i] = nt ? { t: nt, c: paintColor } : null;
  rebuildBlockPlatforms(); Sound.bell(NOTES[(k + 1) % 8], .045); burst(BB.x0 + c * BB.cell + 22, BB.y0 + r * BB.cell + 22, 5, [paintColor, '#fff'], 'star', .4);
  discover('builder', 'Build anything! Tap squares to change the blocks.', p.x, BB.y0 - 20); save();
}
function drawBuilder(t) {
  if (!cull(BB.x0 + 200, 260) || camY + VH < UG.roomCeil) return;
  const W = BB.cols * BB.cell, H = BB.rows * BB.cell;
  ctx.strokeStyle = 'rgba(80,130,190,.35)'; ctx.lineWidth = 1.5;
  for (let c = 0; c <= BB.cols; c++) { ctx.beginPath(); ctx.moveTo(BB.x0 + c * BB.cell, BB.y0); ctx.lineTo(BB.x0 + c * BB.cell, BB.y0 + H); ctx.stroke(); }
  for (let r = 0; r <= BB.rows; r++) { ctx.beginPath(); ctx.moveTo(BB.x0, BB.y0 + r * BB.cell); ctx.lineTo(BB.x0 + W, BB.y0 + r * BB.cell); ctx.stroke(); }
  for (let r = 0; r < BB.rows; r++) for (let c = 0; c < BB.cols; c++) {
    const b = world.build[r * BB.cols + c], x = BB.x0 + c * BB.cell, y = BB.y0 + r * BB.cell, s = BB.cell;
    if (!b) { ellipse(x + s / 2, y + s / 2, 2, 2, 'rgba(80,130,190,.4)'); continue; }
    const col = b.c, dark = shade(col, -.3);
    if (b.t === 'block') { rounded(x + 1, y + 1, s - 2, s - 2, 5, grad(0, y, 0, s, [[0, shade(col, .2)], [1, col]]), dark, 2); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 6, y + 5, s - 12, 4); }
    else if (b.t === 'window') { rounded(x + 1, y + 1, s - 2, s - 2, 5, col, dark, 2); rounded(x + 9, y + 9, s - 18, s - 18, 4, '#bff0ff', '#fff', 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + s / 2, y + 9); ctx.lineTo(x + s / 2, y + s - 9); ctx.moveTo(x + 9, y + s / 2); ctx.lineTo(x + s - 9, y + s / 2); ctx.stroke(); }
    else if (b.t === 'door') { rounded(x + 7, y + 4, s - 14, s - 4, 12, col, dark, 2); ellipse(x + s - 14, y + s / 2 + 4, 2.5, 2.5, '#ffd36b'); }
    else if (b.t === 'roofL' || b.t === 'roofR') { ctx.beginPath(); if (b.t === 'roofL') { ctx.moveTo(x, y + s); ctx.lineTo(x + s, y); ctx.lineTo(x + s, y + s); } else { ctx.moveTo(x, y); ctx.lineTo(x + s, y + s); ctx.lineTo(x, y + s); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke(); }
    else if (b.t === 'star') { star(x + s / 2, y + s / 2, s * .42, col); sparkle(x + s - 8, y + 8, 3 + Math.sin(t * 5 + c) * 1.5, '#fff'); }
    else if (b.t === 'heart') { ctx.beginPath(); heartPath(x + s / 2, y + s / 2 + 4, s * .34); ctx.fillStyle = col; ctx.fill(); }
  }
  text('BUILD!', BB.x0 + W / 2, BB.y0 - 30, 18, '#fff', '#2f78c0');
}
// tap targets + hints (underground = layer 'ug'; inside buildings = 'in:<id>')
INTERACT.unshift(
  ...PM.btns.map(([part, bx]) => ({ box: [bx - 26, PM.btnY - 20, bx + 26, PM.btnY + 20], priority: true, layer: 'ug', hint: part === 'col' ? [bx, PM.btnY] : null, disc: 'petmaker', tap: () => cyclePet(part) })),
  { box: [PM.lever[0] - 26, PM.lever[1] - 60, PM.lever[0] + 26, PM.lever[1] + 40], priority: true, layer: 'ug', hint: PM.lever, disc: 'pet', force: () => !world.pet && world.discoveries.has('petmaker'), tap: makePet },
  { box: [BB.x0, BB.y0, BB.x0 + BB.cols * BB.cell, BB.y0 + BB.rows * BB.cell], priority: true, layer: 'ug', hint: [BB.x0 + 200, BB.y0 + 140], disc: 'builder', tap: tapBuild },
  ...HATCHES.map(h => ({ box: [h.x - 34, GROUND - 30, h.x + 34, GROUND + 20], priority: true, hint: [h.x, GROUND - 6], disc: 'underground', tap: () => dropIntoHatch(h) })),
  ...CRYSTALS.map(k => ({ box: [k.x - 26, k.y - k.h - 6, k.x + 26, k.y + 4], priority: true, layer: 'ug', tap: () => tapCrystal(k) })),
  { box: [PIANO.x - 6, PIANO.y - 6, PIANO.x + PIANO.w + 6, PIANO.y + 26], priority: true, layer: 'in:peek', hint: [PIANO.x + 50, PIANO.y + 8], disc: 'piano', tap: tapPiano },
  { box: [10790, 394, 10850, 452], priority: true, layer: 'in:peek', hint: [10820, 420], disc: 'toybox', tap: tapToybox },
  // doors: usable from outside AND from inside (layer 'any'); the box includes the door bubble above
  { box: [10710, 370, 10770, 452], priority: true, layer: 'any', hint: [10740, 410], disc: 'door-peek', force: () => player.inside === 'peek', tap: () => toggleDoor('peek') },
  { box: [11208, 358, 11272, 452], priority: true, layer: 'any', hint: [11240, 410], disc: 'door-fluff', force: () => player.inside === 'fluff', tap: () => toggleDoor('fluff') },
  { get box() { const d = nearDoor(); return d ? [d.x - 38, d.y - 272, d.x + 38, d.y - 200] : [0, 0, 0, 0]; }, priority: true, layer: 'any', tap: () => { const d = nearDoor(); if (d) d.go(); } }, // the door bubble
  ...PORTALS.map(d => { const y = d.under ? UG.floor : GROUND; return { box: [d.x - 26, y - 82, d.x + 26, y + 2], priority: true, layer: d.under ? 'ug' : '', hint: [d.x, y - 40], disc: 'secretdoor', tap: () => usePortal(d) }; }),
);
EXTRA_HINTS.push(
  ...FLUFFS.filter(f => f.kind === 'star').map(f => ({ get hint() { return [f.hx, f.hy - 40]; }, disc: 'star-' + f.id, layer: f.layer, need: () => f.state === 'wait' })),
  { hint: [NEST.x, NEST.y - 30], disc: 'nesthome', need: () => fluffFollowers().some(f => f.kind === 'star'), force: () => fluffFollowers().some(f => f.kind === 'star') });
