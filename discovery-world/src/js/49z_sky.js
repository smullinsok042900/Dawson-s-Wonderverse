// ===================================================================
// 49z_sky.js — build 10:
//   • EASY WAY DOWN under the ball pit: a pink dive pipe at the far left you
//     just walk into, and diving straight through the ball pit (tap it / PAW).
//   • THE WORLD GOES UP: a Cloud Kingdom above the Playhouse, reached by a
//     rope ladder; bouncy cloud puffs, high clouds, a rainbow castle, a sky
//     whale, and a giant rainbow slide back down.
//   • FRIENDLY CRITTERS all over the world who wave, react and help.
// ===================================================================
const SKY = { y: -320, a: 250, b: 1950 };
// --- easy access under the ball pit ---
const DIVE_PIPE = { x: 96 };
HATCHES.push({ x: DIVE_PIPE.x, net: 'A', pipe: true });
CLIMBS.push({ id: 'hatch' + (HATCHES.length - 1), x1: DIVE_PIPE.x - 20, x2: DIVE_PIPE.x + 20, top: GROUND, bottom: UG.floor + 2, land: DIVE_PIPE.x + 50, layer: 'ug', exit: true });
const PIT_HATCH = HATCHES.find(h => h.pit);
function inPit() { const P = player; return !P.under && !P.inside && !P.ride && P.grounded && P.y === GROUND && P.x > LAYOUT.pit.a && P.x < LAYOUT.pit.b; }
function diveThroughPit() { const P = player, h = PIT_HATCH; P.x = clamp(P.x, h.x - 1, h.x + 1); dropIntoHatch(h); discover('pitdive', 'You dived right through the ball pit!', h.x, 380); }

// --- the Cloud Kingdom ---
PLATFORMS.push(
  { a: 580, b: 660, y: SKY.y - 2, bounce: 960, drum: { x: 620, y: SKY.y, note: 5, sq: 0 }, onLand: cloudBounce, puff: true },
  { a: 1240, b: 1320, y: SKY.y - 2, bounce: 960, drum: { x: 1280, y: SKY.y, note: 7, sq: 0 }, onLand: cloudBounce, puff: true },
  { a: SKY.a, b: SKY.b, y: SKY.y },                         // the long cloud path
  { a: 470, b: 780, y: -560 }, { a: 1090, b: 1430, y: -580 }, // high clouds
);
function cloudBounce(z) { drumLand(z); discover('cloudbounce', 'Bouncy clouds! Boing up to the high clouds!', z.drum.x, z.y - 60); }
CLIMBS.push({ id: 'skyladder', x1: 1042, x2: 1078, top: SKY.y, bottom: GROUND + 2, land: 1060, sky: true });
SECRET_STARS.push({ id: 'star10', x: 1260, y: -660 });
BIG_SLIDES.push({ pts: [[1950, SKY.y], [2100, SKY.y + 20], [2150, -60], [2200, 60], [2260, 200], [2330, 420], [2372, 447]], len: 980 });
const SKY_SLIDE = BIG_SLIDES.length - 1;
arcBits(300, SKY.y - 40, 1900, SKY.y - 40, 60, 24); arcBits(480, -600, 780, -600, 30, 6); arcBits(1090, -620, 1430, -620, 30, 7);
for (let y = GROUND - 60; y > SKY.y; y -= 70) bit(1060, y); // up the rope ladder

// --- friendly background critters ---
const NPCS = [
  { id: 'painter', x: 1520, y: GROUND, kind: 'bunny', c: '#ffb3d9', prop: 'brush', range: 90 },
  { id: 'owl', x: 905, y: 213, kind: 'owl', c: '#c79b6b', range: 0 },
  { id: 'frog', x: 2450, y: 290, kind: 'frog', c: '#7be08a', range: 0 },   // sits on the bubble machine roof
  { id: 'robot', x: 3520, y: GROUND, kind: 'robot', c: '#c9d6ee', range: 30 },
  { id: 'balloon', x: 3830, y: GROUND, kind: 'bear', c: '#ffc46b', prop: 'balloons', range: 30 },
  { id: 'penguin', x: 4280, y: GROUND, kind: 'penguin', c: '#5b6cff', range: 50 },
  { id: 'drummer', x: 7560, y: GROUND, kind: 'bear', c: '#ff9fd2', prop: 'sticks', range: 20 },
  { id: 'juggler', x: 13395, y: GROUND, kind: 'bunny', c: '#c9a6ff', prop: 'juggle', range: 0 },
  { id: 'mole', x: 8320, y: UG.floor, kind: 'mole', c: '#b58660', prop: 'lamp', range: 60, layer: 'ug' },
  { id: 'sheep1', x: 760, y: SKY.y, kind: 'sheep', c: '#ffffff', range: 160 },
  { id: 'sheep2', x: 1560, y: SKY.y, kind: 'sheep', c: '#fff0fa', range: 140 },
  { id: 'whale', x: 1150, y: -800, kind: 'whale', c: '#9fd8ff', range: 0 },
].map((n, i) => ({ ...n, hx: n.x, ph: i * 1.7, react: 0, greet: 0, wasNear: false, dir: 1 }));
Object.assign(world, { balloon: null, balloonSway: { x: 0, v: 0 } });
const BALLOON_COLS = ['#ff4f9a', '#ffc21c', '#2fa8ff', '#36c96b', '#a15cff', '#ff9a2e'];
function tapNpc(n) {
  n.react = 1.4; const P = player;
  if (!world.discoveries.has('npc-' + n.id)) { world.bits += 2; updateBits(); burst(n.x, n.y - 70, 10, ['#ffd23f', '#fff'], 'star'); }
  discover('npc-' + n.id, null, n.x, n.y - 90); discover('friends', 'Make friends! Tap the critters to play.', n.x, n.y - 90);
  const say = (notes, wave = 'triangle') => notes.forEach((f, i) => Sound.tone(f, .16, wave, .045, 1.05, i * .1));
  switch (n.id) {
    case 'painter': addSticker(0, { x: rand(1450, 1900), y: rand(165, 330) }, ['heart', 'star', 'rainbow'][Math.floor(Math.random() * 3)]); say([660, 880]); break;
    case 'owl': say([392, 330], 'sine'); break;
    case 'frog': say([200, 260], 'square'); for (let i = 0; i < 5; i++) world.bubbles.push({ x: n.x + rand(-10, 30), y: n.y - 60, r: rand(10, 18), vx: rand(10, 60), vy: rand(-120, -60), life: 8, color: null, hue: rand(150, 330), seed: rand(0, 9), ride: false }); break;
    case 'robot': [880, 660, 990, 1320].forEach((f, i) => Sound.tone(f, .08, 'square', .03, 1, i * .09)); break;
    case 'balloon': world.balloon = BALLOON_COLS[(BALLOON_COLS.indexOf(world.balloon) + 1) % BALLOON_COLS.length]; toast('🎈 A balloon for you! Tap the bear again for a new colour.'); Sound.giggle(); save(); break;
    case 'penguin': say([700, 600, 500]); break;
    case 'drummer': [0, 1, 2, 3, 4, 5].forEach(i => { Sound.tone(120 + i * 20, .12, 'sine', .07, .5, i * .08); }); DRUMS.forEach(d => d.sq = 1); break;
    case 'juggler': confetti(n.x, n.y - 120, 30, 380); say([523, 659, 784]); break;
    case 'mole': world.bits += 3; updateBits(); burst(n.x + 20, n.y - 20, 14, RAINBOW, 'star'); say([300, 450]); toast('💎 The mole dug up gems! (+3 star bits)'); break;
    case 'sheep1': case 'sheep2': Sound.tone(520, .35, 'sawtooth', .025, .7); burst(n.x, n.y - 90, 12, ['#fff', '#ffe36e', '#9fe6ff'], 'star', .6); break;
    case 'whale': for (let i = 0; i < 4; i++) Sound.bell(NOTES[i] / 2, .05, i * .15); confetti(n.x + 60, n.y - 60, 40, 420); break;
  }
}
function updateSky(dt, t) {
  const P = player, lk = layerKey();
  // walking left into the dive pipe
  if (lk === '' && !P.ride && P.grounded && P.y === GROUND && P.x < DIVE_PIPE.x + 6 && P.vx < -20) dropIntoHatch(HATCHES.find(h => h.pipe));
  // walking off the right end of the cloud path onto the rainbow slide
  if (lk === '' && !P.ride && P.grounded && P.y === SKY.y && P.x > SKY.b - 8 && P.vx > 30) { startBigSlide(SKY_SLIDE); discover('skyslide', 'The giant rainbow slide back down!', P.x, P.y - 120); }
  if (lk === '' && P.y < SKY.y + 5 && P.grounded) discover('sky', 'You climbed up to the Cloud Kingdom!', P.x, P.y - 160);
  for (const n of NPCS) {
    n.react = Math.max(0, n.react - dt); n.greet = Math.max(0, n.greet - dt);
    const nx = n.hx + Math.sin(t * .35 + n.ph) * n.range; n.dir = nx >= n.x ? 1 : -1; n.x = nx;
    const near = (n.layer || '') === lk && Math.abs(P.x - n.x) < 170 && Math.abs(P.y - n.y) < 140;
    if (near && !n.wasNear) n.greet = 2.2;
    n.wasNear = near;
  }
  spring(world.balloonSway, clamp(-P.vx / 300, -1, 1) * .5, 30, 3, dt);
}
// ---------- drawing ----------
function drawNpc(n, t) {
  if (!cull(n.x, 120)) return;
  if (n.kind === 'whale') return drawWhale(n, t);
  const r = n.react, hop = r > 0 ? -Math.abs(Math.sin(r * 9)) * 16 : -Math.abs(Math.sin(t * 3 + n.ph)) * (n.range ? 4 : 1.5);
  const s = 1.25, x = n.x, y = n.y, happy = r > 0 || n.greet > 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(n.dir * s, s);
  ellipse(0, 3 - hop / s, 22, 5, 'rgba(60,25,110,.22)');
  ctx.translate(0, hop / s);
  if (n.id === 'owl' && r > 0) ctx.translate(Math.sin(r * 5) * 24, -Math.sin(r * 2.2) * 60);
  if (n.id === 'penguin' && r > 0) ctx.rotate(Math.sin(r * 8) * .3);
  if (n.id === 'robot' && r > 0) ctx.scale(Math.cos(r * 10), 1);
  const O = shade(n.c, -.5), c = n.c;
  // ears / top features (behind the body)
  if (n.kind === 'bunny') { ellipse(-9, -60, 6, 17, c, O, 2); ellipse(9, -62, 6, 17, c, O, 2); ellipse(-9, -60, 3, 11, '#ffd1ec'); ellipse(9, -62, 3, 11, '#ffd1ec'); }
  if (n.kind === 'bear' || n.kind === 'mole') { ellipse(-15, -48, 8, 8, c, O, 2); ellipse(15, -48, 8, 8, c, O, 2); }
  if (n.kind === 'owl') { ctx.beginPath(); ctx.moveTo(-18, -44); ctx.lineTo(-14, -58); ctx.lineTo(-8, -46); ctx.moveTo(18, -44); ctx.lineTo(14, -58); ctx.lineTo(8, -46); ctx.fillStyle = shade(c, -.2); ctx.fill(); }
  if (n.kind === 'robot') { ctx.strokeStyle = '#8a9cc0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, -62); ctx.stroke(); ellipse(0, -64, 4.5, 4.5, r > 0 ? '#ff4f9a' : '#ffd23f'); }
  // body
  if (n.kind === 'robot') { rounded(-22, -50, 44, 48, 12, grad(0, -50, 0, 48, [[0, '#ffffff'], [1, c]]), '#7a8cb0', 2.5); rounded(-15, -42, 30, 18, 6, '#2a2f5a'); }
  else if (n.kind === 'sheep') { ctx.beginPath(); fluffPath(0, -26, 26, 22, 10, .18, t * .3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#c9b8e0'; ctx.lineWidth = 2; ctx.stroke(); ellipse(16, -30, 11, 12, '#6b5a7a'); }
  else if (n.kind === 'frog') { ellipse(0, -18, 26, 18, grad(0, -36, 0, 36, [[0, shade(c, .25)], [1, c]]), O, 2.5); ellipse(-11, -34, 9, 9, c, O, 2); ellipse(11, -34, 9, 9, c, O, 2); }
  else if (n.kind === 'penguin') { ellipse(0, -26, 21, 27, grad(0, -52, 0, 52, [[0, shade(c, .2)], [1, shade(c, -.2)]]), O, 2.5); ellipse(0, -20, 13, 18, '#ffffff'); ctx.beginPath(); ctx.moveTo(-5, -32); ctx.lineTo(5, -32); ctx.lineTo(0, -26); ctx.fillStyle = '#ffb01f'; ctx.fill(); }
  else { ctx.beginPath(); fluffPath(0, -26, 22, 24, 12, .06, 0); ctx.fillStyle = grad(0, -50, 0, 48, [[0, shade(c, .3)], [1, c]]); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.stroke(); ellipse(0, -18, 12, 11, 'rgba(255,255,255,.55)'); }
  if (n.kind === 'owl') { ellipse(-22, -22, 7, 15, shade(c, -.15), O, 2, -.3); ellipse(22, -22, 7, 15, shade(c, -.15), O, 2, .3); }
  // face
  const ex = n.kind === 'sheep' ? 16 : 0, ey = n.kind === 'frog' ? -35 : n.kind === 'robot' ? -33 : n.kind === 'sheep' ? -32 : -32, eg = n.kind === 'frog' ? 11 : n.kind === 'sheep' ? 4 : 8;
  if (n.kind === 'robot') { if (r > 0) { ctx.beginPath(); heartPath(0, -33, 6); ctx.fillStyle = '#ff4f9a'; ctx.fill(); } else { ellipse(-6, -34, 3, 3.5, '#7fe6ff'); ellipse(6, -34, 3, 3.5, '#7fe6ff'); } }
  else if (happy) { ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(ex - eg, ey + 2, 3.5, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(ex + eg + 3.5, ey + 2); ctx.arc(ex + eg, ey + 2, 3.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  else { ellipse(ex - eg, ey, 3.4, 4.2, '#2a0f45'); ellipse(ex + eg, ey, 3.4, 4.2, '#2a0f45'); ellipse(ex - eg - 1, ey - 1.5, 1.3, 1.3, '#fff'); ellipse(ex + eg - 1, ey - 1.5, 1.3, 1.3, '#fff'); }
  if (n.kind !== 'robot') { ellipse(ex - eg - 5, ey + 7, 3.5, 2.2, '#ff7fb0aa'); ellipse(ex + eg + 5, ey + 7, 3.5, 2.2, '#ff7fb0aa'); ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ex, ey + 7, happy ? 4.5 : 3, .2, Math.PI - .2); ctx.stroke(); }
  // feet
  ellipse(-9, -1, 7, 4, shade(c, -.15), O, 1.5); ellipse(9, -1, 7, 4, shade(c, -.15), O, 1.5);
  // props
  const wave = Math.sin(t * (r > 0 ? 16 : 3) + n.ph) * (r > 0 || n.greet > 0 ? .7 : .2);
  if (n.prop === 'brush') { ctx.save(); ctx.translate(20, -24); ctx.rotate(-.8 + wave); rounded(-2, -26, 4, 26, 2, '#a8662c'); ellipse(0, -28, 4, 6, '#ff4f9a'); ctx.restore(); }
  if (n.prop === 'sticks') for (const s2 of [-1, 1]) { ctx.save(); ctx.translate(s2 * 18, -24); ctx.rotate(s2 * (-.6 + wave)); rounded(-1.5, -22, 3, 22, 1.5, '#e9b36b'); ellipse(0, -23, 3.5, 3.5, '#ff9fd2'); ctx.restore(); }
  if (n.prop === 'lamp') { rounded(-12, -54, 24, 8, 4, '#ffc21c', O, 1.5); glow(0, -56, 18, '#fff3a6', .8); }
  if (n.prop === 'juggle') for (let i = 0; i < 3; i++) { const a = t * (r > 0 ? 9 : 4) + i * TAU / 3; ellipse(Math.cos(a) * 20, -78 + Math.sin(a) * 14, 5, 5, RAINBOW[i * 2], '#fff', 1.5); }
  if (n.prop === 'balloons') { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; [[-16, '#ff4f9a'], [0, '#ffc21c'], [16, '#2fa8ff']].forEach(([bx, bc], i) => { const sw = Math.sin(t * 1.5 + i) * 4; ctx.beginPath(); ctx.moveTo(18, -30); ctx.quadraticCurveTo(18 + bx * .5, -70, 18 + bx + sw, -96); ctx.stroke(); ellipse(18 + bx + sw, -106, 10, 12, bc, '#fff', 1.5); ellipse(14 + bx + sw, -110, 3, 4, 'rgba(255,255,255,.7)'); }); }
  ctx.restore();
  // greeting bubble
  if (n.greet > 0 || r > 0) { const by = n.y - 110 * s + Math.sin(t * 4) * 3; ellipse(n.x + 26, by, 15, 13, 'rgba(255,255,255,.95)', '#e3b0ee', 2); if (r > 0) star(n.x + 26, by, 7, '#ffc21c'); else { ctx.beginPath(); heartPath(n.x + 26, by + 1, 6); ctx.fillStyle = '#ff4f9a'; ctx.fill(); } }
}
function drawWhale(n, t) {
  const x = n.x + Math.sin(t * .3) * 60, y = n.y + Math.sin(t * .7) * 14, r = n.react;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-110, 0); ctx.bezierCurveTo(-110, -70, 90, -80, 120, -10); ctx.bezierCurveTo(130, 30, 40, 50, -60, 40); ctx.bezierCurveTo(-100, 34, -120, 20, -110, 0); ctx.closePath();
  ctx.fillStyle = grad(0, -70, 0, 120, [[0, '#d6f2ff'], [.6, n.c], [1, '#6fb0e8']]); ctx.fill(); ctx.strokeStyle = '#4f86c4'; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.rotate(Math.sin(t * 1.4) * .2); ctx.beginPath(); ctx.moveTo(-108, 4); ctx.quadraticCurveTo(-150, -40, -170, -28); ctx.quadraticCurveTo(-150, 0, -166, 30); ctx.quadraticCurveTo(-140, 24, -108, 12); ctx.closePath(); ctx.fillStyle = n.c; ctx.fill(); ctx.stroke(); ctx.restore();
  ellipse(10, 20, 70, 16, 'rgba(255,255,255,.45)');
  for (let i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(79,134,196,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20 + i * 18, 22); ctx.lineTo(26 + i * 18, 38); ctx.stroke(); }
  if (r > 0) ctx.strokeStyle = '#2a0f45', ctx.lineWidth = 3, ctx.beginPath(), ctx.arc(70, -14, 7, Math.PI * 1.1, Math.PI * 1.9), ctx.stroke();
  else { ellipse(70, -16, 7, 8, '#2a0f45'); ellipse(68, -19, 2.5, 2.5, '#fff'); }
  ellipse(86, 2, 9, 5, '#ff9fd2aa'); ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(96, -2, 12, .4, 1.6); ctx.stroke();
  // spout
  const sp = r > 0 ? 1 : .3 + Math.sin(t * 2) * .1;
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .25; ellipse(20 + Math.cos(a) * 30 * sp, -64 + Math.sin(a) * 40 * sp - 10, 5, 5, ['#9fe6ff', '#ffffff', '#ffd1ec'][i % 3]); }
  ctx.restore();
}
function drawCloudBand(a, b, y, t) {
  for (let x = a; x < b; x += 46) { const r = 30 + ((x * 7) % 17); ellipse(x + 20, y + 12, r, r * .62, '#ffffff'); }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(a, y, b - a, 22);
  ctx.fillStyle = 'rgba(200,180,255,.35)'; ctx.fillRect(a, y + 22, b - a, 8);
  for (let x = a + 30; x < b; x += 120) sparkle(x, y + 6, 3 + Math.sin(t * 3 + x) * 1.5, '#ffe9a6');
}
function drawSky(t) {
  if (camY > -60 && camera > SKY.b + 200) return;
  // rope ladder from the floor, past the beam, up into the clouds
  if (cull(1060, 40)) {
    ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 4; for (const x of [1044, 1076]) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x + Math.sin(t) * 2, SKY.y); ctx.stroke(); }
    for (let y = GROUND - 20; y > SKY.y; y -= 26) rounded(1042, y, 36, 6, 3, '#ffd88f', '#a8662c', 1.5);
  }
  if (camY > -60) return;
  // sun with a friendly face + rainbow arches
  const sx = 420 + (camera - 300) * .15;
  glow(sx, -900, 120, '#fff3a6', .7); ellipse(sx, -900, 54, 54, grad(sx, -950, 0, 100, [[0, '#fff6b0'], [1, '#ffc21c']]), '#fff', 4);
  ellipse(sx - 16, -906, 4, 5, '#7a4a1a'); ellipse(sx + 16, -906, 4, 5, '#7a4a1a'); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, -896, 14, .3, Math.PI - .3); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.strokeStyle = RAINBOW[i]; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(1300, SKY.y + 10, 260 - i * 10, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
  // rainbow castle on the clouds
  const cx = 1780;
  rounded(cx - 90, SKY.y - 150, 180, 150, 10, grad(0, SKY.y - 150, 0, 150, [[0, '#ffe9f6'], [1, '#ffc2e2']]), '#ffd36b', 4);
  for (const [tx, h, c] of [[cx - 90, 210, '#ff9fd2'], [cx + 90, 230, '#9fe6ff'], [cx, 260, '#c9a6ff']]) {
    rounded(tx - 24, SKY.y - h, 48, h, 8, grad(tx - 24, 0, 48, 0, [[0, shade(c, .3)], [1, c]]), '#ffd36b', 3);
    ctx.beginPath(); ctx.moveTo(tx - 32, SKY.y - h + 4); ctx.lineTo(tx, SKY.y - h - 50); ctx.lineTo(tx + 32, SKY.y - h + 4); ctx.closePath(); ctx.fillStyle = shade(c, -.2); ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.stroke();
    star(tx, SKY.y - h - 56, 9, '#ffe36e'); rounded(tx - 8, SKY.y - h + 40, 16, 22, 8, '#5b3a9a', '#ffd36b', 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, SKY.y - h - 60); ctx.lineTo(tx, SKY.y - h - 84); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx, SKY.y - h - 84); ctx.lineTo(tx + 20 + Math.sin(t * 4) * 3, SKY.y - h - 78); ctx.lineTo(tx, SKY.y - h - 72); ctx.fillStyle = RAINBOW[(tx | 0) % 8]; ctx.fill();
  }
  rounded(cx - 22, SKY.y - 60, 44, 60, 22, '#a15cff', '#ffd36b', 3); bulbString(cx - 90, SKY.y - 150, cx + 90, SKY.y - 150, 8, 7, t, true);
  // clouds: the long path, high clouds, bouncy puffs
  drawCloudBand(SKY.a, SKY.b, SKY.y, t);
  drawCloudBand(470, 780, -560, t); drawCloudBand(1090, 1430, -580, t);
  for (const z of PLATFORMS) if (z.puff) { const sq = z.drum.sq * 8; ellipse(z.drum.x, z.y + 4 + sq, 48, 20 - sq * .4, grad(0, z.y - 16, 0, 40, [[0, '#ffe1f4'], [1, '#ff9fd2']]), '#fff', 3); star(z.drum.x, z.y + 2 + sq, 7, '#fff6b0'); }
  drawSlidePath(BIG_SLIDES[SKY_SLIDE].pts, t);
}
function drawPitHelpers(t) {
  // the dive pipe at the far left
  if (cull(DIVE_PIPE.x, 60)) {
    const x = DIVE_PIPE.x;
    rounded(x - 30, 330, 60, 120, 18, grad(x - 30, 0, 60, 0, [[0, '#ff9fd2'], [.5, '#ffd1ec'], [1, '#e2459f']]), '#ffd36b', 4);
    ellipse(x, 332, 30, 10, '#5a2f78', '#ffd36b', 3);
    for (let i = 0; i < 3; i++) { const yy = 360 + ((t * 40 + i * 25) % 70); ctx.beginPath(); ctx.moveTo(x - 9, yy - 6); ctx.lineTo(x, yy + 4); ctx.lineTo(x + 9, yy - 6); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3.5; ctx.stroke(); }
  }
  // bouncing "dive here" arrow over the ball pit
  if (cull(PIT_HATCH.x, 60) && !player.under) {
    const y = 330 + Math.abs(Math.sin(t * 3)) * -10;
    ellipse(PIT_HATCH.x, y, 22, 20, 'rgba(255,255,255,.95)', '#ffc531', 3);
    ctx.beginPath(); ctx.moveTo(PIT_HATCH.x - 9, y - 4); ctx.lineTo(PIT_HATCH.x, y + 8); ctx.lineTo(PIT_HATCH.x + 9, y - 4); ctx.strokeStyle = '#a15cff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PIT_HATCH.x, y - 10); ctx.lineTo(PIT_HATCH.x, y + 6); ctx.stroke();
  }
}
function drawNpcs(t) { for (const n of NPCS) if (!(n.layer && n.layer !== layerKey() && camY < 200)) drawNpc(n, t); }
function drawBalloon(t) {
  const P = player; if (!world.balloon || (P.ride && P.ride.type === 'tube')) return;
  const crawl = isCrawling(), hx = P.x + P.facing * 22, hy = P.y - (crawl ? 60 : 120), sw = world.balloonSway.x * 30 + Math.sin(t * 1.3) * 6;
  const bx = hx + sw, by = hy - (crawl ? 60 : 120);
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + sw * .3, (hy + by) / 2, bx, by + 22); ctx.stroke();
  ellipse(bx, by, 20, 24, grad(bx - 20, by - 24, 40, 48, [[0, shade(world.balloon, .45)], [1, world.balloon]]), '#fff', 2);
  ctx.beginPath(); ctx.moveTo(bx - 4, by + 24); ctx.lineTo(bx + 4, by + 24); ctx.lineTo(bx, by + 30); ctx.fillStyle = world.balloon; ctx.fill();
  ellipse(bx - 7, by - 9, 5, 8, 'rgba(255,255,255,.7)', null, 0, -.4);
}
INTERACT.unshift(...NPCS.map(n => ({ get box() { return n.kind === 'whale' ? [n.x - 180, n.y - 90, n.x + 140, n.y + 60] : [n.x - 40, n.y - 92, n.x + 40, n.y + 6]; }, priority: true, layer: n.layer || '', get hint() { return [n.x, n.y - 60]; }, disc: 'npc-' + n.id, tap: () => tapNpc(n) })));
INTERACT.push({ box: [1040, SKY.y, 1080, GROUND], hint: [1060, 300], disc: 'sky', tap: () => { const P = player, c = CLIMBS.find(k => k.id === 'skyladder'); if (!P.ride && Math.abs(P.x - 1060) < 320 && P.y > SKY.y + 5) { P.x = 1060; startClimb(c); } } });
