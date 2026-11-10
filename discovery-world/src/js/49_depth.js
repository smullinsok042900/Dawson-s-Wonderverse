// ===================================================================
// 49_depth.js — build 8: DEPTH. The same one world now has layers:
//   • UNDERGROUND: hatches in the floor drop you into cosy rooms joined by
//     low crawl tunnels (the creature scrunches down and crawls); ladders
//     climb back up. Rooms: Pet Workshop, Crystal Cave, Block-Builder Room,
//     Echo Cave, Gem Room.
//   • INSIDE BUILDINGS: tap a door behind the creature to go inside the
//     Peekaboo House or the Fluffkin House; the wall opens into a cutaway.
//   • STAR BABIES: a second rescue family that goes home to the Star Nest.
// ===================================================================
const UG = { slab: GROUND + 50, floor: 700, crawlCeil: 588, roomCeil: 510 };
const NETWORKS = [
  { id: 'A', a: 60, b: 2232, segs: [[60, 650, 'workshop'], [650, 1080, 'crawl'], [1080, 1420, 'crystal'], [1420, 1760, 'crawl'], [1760, 2232, 'build']] },
  { id: 'B', a: 6872, b: 8650, segs: [[6872, 7300, 'echo'], [7300, 7820, 'crawl'], [7820, 8650, 'gem']] },
];
const HATCHES = [{ x: 200, net: 'A', pit: true }, { x: 1104, net: 'A' }, { x: 1978, net: 'A' }, { x: 6930, net: 'B' }, { x: 8604, net: 'B' }];
HATCHES.forEach((h, i) => CLIMBS.push({ id: 'hatch' + i, x1: h.x - 20, x2: h.x + 20, top: GROUND, bottom: UG.floor + 2, land: h.x + (h.pit ? 0 : 40), layer: 'ug', exit: true }));
// buildings you can go inside (the front wall becomes a cutaway)
const BUILDINGS = {
  peek: { x1: 10560, x2: 10920, door: 10740, roof: 186, name: 'Peekaboo House' },
  fluff: { x1: 11132, x2: 11348, door: 11240, roof: 236, name: 'Fluffkin House' },
};
PLATFORMS.push({ a: 10840, b: 10912, y: 336, layer: 'in:peek' },                                  // high toy shelf
  { a: 10584, b: 10676, y: 418, step: true, bounce: 700, layer: 'in:peek', drum: { x: 10630, y: 418, note: 4, sq: 0 }, onLand: drumLand }); // bouncy bed

function layerKey() { const P = player; return P.under ? 'ug' : P.inside ? 'in:' + P.inside : ''; }
function netAt(x) { return NETWORKS.find(n => x >= n.a && x <= n.b); }
function segAt(x) { const n = netAt(x); return n && n.segs.find(s => x >= s[0] && x <= s[1]); }
function layerBounds() {
  const P = player;
  if (P.under) { const n = netAt(P.x) || NETWORKS[0]; return [n.a + 22, n.b - 22]; }
  if (P.inside) { const B = BUILDINGS[P.inside]; return [B.x1 + 26, B.x2 - 26]; }
  return [60, WORLD_W - 70];
}
const floorY = () => player.under ? UG.floor : GROUND;
function isCrawling() { const s = player.under && segAt(player.x); return !!s && s[2] === 'crawl'; }
function ceilingAt() {
  const P = player;
  if (P.under) { const s = segAt(P.x); return s && s[2] === 'crawl' ? UG.crawlCeil : UG.roomCeil; }
  if (P.inside) return BUILDINGS[P.inside].roof;
  return null;
}
const creatureH = () => isCrawling() ? 104 : 168;
// called each frame from updatePlayer after physics
function depthPhysics() {
  const P = player, c = ceilingAt();
  if (c != null && P.y - creatureH() < c) { P.y = c + creatureH(); if (P.vy < 0) P.vy = 0; }
}
function dropIntoHatch(h) {
  const P = player; if (P.ride) return;
  if (Math.abs(P.x - h.x) > 320 && !P.under) { burst(h.x, GROUND, 8); Sound.click(); return; }
  if (P.under) { // tapped from below: climb up its ladder
    if (Math.abs(P.x - h.x) < 320) { P.x = h.x; startClimb(CLIMBS.find(c => c.id === 'hatch' + HATCHES.indexOf(h))); }
    return;
  }
  P.inside = null; P.under = true; P.x = h.x; P.y = UG.slab + 6; P.vy = 120; P.vx = 0; P.grounded = false; P.jumps = 1;
  Sound.whoosh(); Sound.tone(500, .35, 'sine', .05, .45); burst(h.x, GROUND, 14, ['#fff', '#ffe36e', '#9fe6ff']);
  if (h.pit) world.pitJiggle = 1.5;
  discover('underground', 'A secret tunnel under the floor! Crawl and explore!', h.x, GROUND + 80);
}
function toggleDoor(id) {
  const P = player, B = BUILDINGS[id]; if (P.ride) return;
  if (P.inside === id) { P.inside = null; P.x = B.door; Sound.tone(440, .2, 'triangle', .05, .7); burst(B.door, 410, 8); return; }
  if (P.under || Math.abs(P.x - B.door) > 330) { burst(B.door, 410, 6); Sound.click(); return; }
  P.inside = id; P.x = B.door; P.vx = 0; Sound.tone(520, .25, 'triangle', .05, 1.4); burst(B.door, 410, 12, ['#fff', '#ffe36e']);
  discover('door-' + id, `You went inside the ${B.name}!`, B.door, 300);
}

// ---------- underground + interior interactives ----------
const CRYSTALS = [
  ...[1150, 1215, 1290, 1365].map((x, i) => ({ x, y: 700, h: 70 + (i % 2) * 30, c: ['#9fe6ff', '#ff9fd8', '#c9a6ff', '#9ff7e0'][i], note: i + 1, lit: 0 })),
  ...[7000, 7070, 7140, 7210, 7280].map((x, i) => ({ x, y: 700, h: 110 + Math.sin(i * 2) * 40, c: RAINBOW[i + 1], note: i + 3, lit: 0, big: true })),
];
function tapCrystal(k) { k.lit = 1; Sound.bell(NOTES[k.note % 8] / (k.big ? 2 : 1), .06); Sound.bell(NOTES[k.note % 8], .03, .05); burst(k.x, k.y - k.h * .7, 8, [k.c, '#fff'], 'star', .5); discover('crystal', 'Singing crystals! Tap them to play.', k.x, k.y - k.h); }
const PIANO = { x: 10596, w: 104, y: 404, keys: 8, lit: new Array(8).fill(0) };
function tapPiano(p) { const i = clamp(Math.floor((p.x - PIANO.x) / (PIANO.w / PIANO.keys)), 0, 7); PIANO.lit[i] = 1; Sound.bell(NOTES[i], .06); burst(p.x, PIANO.y - 10, 4, [RAINBOW[i], '#fff'], 'star', .4); discover('piano', 'Play the piano!', p.x, 330); }
function tapToybox() { world.toyT = 1.2; confetti(10820, 400, 24, 360); burst(10820, 400, 12, RAINBOW, 'heart', .8); Sound.giggle(); discover('toybox', 'Toys pop out of the toy box!', 10820, 330); }
const ROOMIES = [0, 1, 2, 3, 4].map(i => ({ x: 10600 + i * 62, dir: i % 2 ? 1 : -1, hop: 0, i }));

// ---------- STAR BABIES (second rescue family) ----------
const NEST = { x: 1342, y: 213 };
[
  { id: 's1', x: 870, y: UG.floor, layer: 'ug' }, { id: 's2', x: 8420, y: UG.floor, layer: 'ug' }, { id: 's3', x: 7080, y: UG.floor, layer: 'ug' },
  { id: 's4', x: 10880, y: 336, layer: 'in:peek' }, { id: 's5', x: 4150, y: 410 }, { id: 's6', x: 13250, y: GROUND },
].forEach((s, i) => FLUFFS.push({ ...s, kind: 'star', c: RAINBOW[(i * 3) % 8], hx: s.x, hy: s.y, state: 'wait', px: s.x, py: s.y, enterT: 0 }));
FLUFFS.forEach(f => { f.kind = f.kind || 'fluff'; });
function drawStarBaby(x, y, c, t, k, mood) {
  const hop = -Math.abs(Math.sin(t * 6 + k)) * (mood === 'wait' ? 4 : 9), cy = y - 22 + hop;
  ellipse(x, y + 2, 13, 3.5, 'rgba(60,25,110,.2)');
  glow(x, cy, 30, '#fff3a6', .55);
  ctx.save(); ctx.translate(x, cy); ctx.rotate(Math.sin(t * 3 + k) * .2);
  ctx.beginPath(); roundedPoly([...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 20; return [Math.cos(a) * r, Math.sin(a) * r]; }));
  ctx.fillStyle = grad(0, -20, 0, 40, [[0, '#fff7b0'], [1, c]]); ctx.fill(); ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 2; ctx.stroke();
  ellipse(-4, -2, 2.4, 3, '#2a0f45'); ellipse(4, -2, 2.4, 3, '#2a0f45'); ellipse(-4.6, -3, .9, .9, '#fff'); ellipse(3.4, -3, .9, .9, '#fff');
  ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 2, 2.4, .2, Math.PI - .2); ctx.stroke();
  ctx.restore();
  if (mood === 'wait') { const b = Math.sin(t * 3 + k) * 3; ellipse(x + 20, y - 52 + b, 12, 10, 'rgba(255,255,255,.95)', '#e3b0ee', 2); star(x + 20, y - 52 + b, 6, '#ffc21c'); }
}

// ---------- drawing ----------
function drawUnderground(t) {
  if (camY + VH < UG.slab - 5) return;
  for (const n of NETWORKS) {
    if (n.b < camera - 40 || n.a > camera + vw + 40) continue;
    for (const [a, b, kind] of n.segs) {
      if (b < camera - 40 || a > camera + vw + 40) continue;
      const top = kind === 'crawl' ? UG.crawlCeil : UG.roomCeil, h = UG.floor + 14 - top;
      const wall = { workshop: ['#ffd1ec', '#e69ad4'], crystal: ['#5a3a9a', '#3a2070'], build: ['#c9f2ff', '#8fcbe8'], echo: ['#4a2f8a', '#2a1a5a'], gem: ['#6a3a8a', '#3a1f5a'], crawl: ['#ffb8dc', '#c86aa8'] }[kind];
      rounded(a, top, b - a, h, kind === 'crawl' ? 50 : 30, grad(0, top, 0, h, [[0, wall[0]], [1, wall[1]]]));
      if (kind === 'crawl') { for (let x = a + 30; x < b; x += 46) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, (top + UG.floor) / 2 + 6, 10, (UG.floor - top) / 2, 0, 0, TAU); ctx.stroke(); } }
      if (kind === 'workshop' || kind === 'build') { for (let x = a + 40; x < b; x += 80) for (let y = top + 34; y < UG.floor - 40; y += 70) star(x + ((y / 70) % 2) * 40, y, 6, 'rgba(255,255,255,.45)'); }
      if (kind === 'crystal' || kind === 'echo' || kind === 'gem') {
        for (let x = a + 20; x < b; x += 37) { const hh = 14 + ((x * 7) % 23); ctx.beginPath(); ctx.moveTo(x - 8, top); ctx.lineTo(x, top + hh); ctx.lineTo(x + 8, top); ctx.closePath(); ctx.fillStyle = ['#9fe6ff', '#ff9fd8', '#c9a6ff', '#fff3a6'][(x / 37 | 0) % 4]; ctx.globalAlpha = .7; ctx.fill(); ctx.globalAlpha = 1; }
        for (let i = 0; i < 6; i++) glow(a + (b - a) * (i + .5) / 6, top + 60 + Math.sin(t + i) * 10, 40, ['#9fe6ff', '#ff9fd8', '#c9a6ff'][i % 3], .3);
      }
      // warm lanterns + floor
      for (let x = a + 60; x < b - 20; x += 160) { ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + 22); ctx.stroke(); bulb(x, top + 30, true, '#ffd76a', 1.2); }
      rounded(a, UG.floor, b - a, 14, 6, grad(0, UG.floor, 0, 14, [[0, '#ffd36b'], [1, '#d9962e']]));
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a + 10, UG.floor + 2); ctx.lineTo(b - 10, UG.floor + 2); ctx.stroke();
    }
  }
  // ladders up out of each hatch
  for (const h of HATCHES) if (cull(h.x, 30)) {
    for (const x of [h.x - 16, h.x + 16]) rounded(x - 3, GROUND + 4, 6, UG.floor - GROUND - 4, 3, '#ffd36b', '#fff', 1);
    for (let y = GROUND + 30; y < UG.floor; y += 24) rounded(h.x - 18, y, 36, 5, 2, '#ff9fd2', '#fff', 1);
  }
  // crystals
  for (const k of CRYSTALS) {
    if (!cull(k.x, 40)) continue; k.lit = Math.max(0, k.lit - 1 / 60);
    if (k.lit > 0) glow(k.x, k.y - k.h / 2, k.h, k.c, k.lit);
    ctx.beginPath(); ctx.moveTo(k.x - k.h * .22, k.y); ctx.lineTo(k.x - k.h * .28, k.y - k.h * .6); ctx.lineTo(k.x, k.y - k.h); ctx.lineTo(k.x + k.h * .28, k.y - k.h * .6); ctx.lineTo(k.x + k.h * .22, k.y); ctx.closePath();
    ctx.fillStyle = grad(k.x - 20, 0, 40, 0, [[0, shade(k.c, -.15)], [.5, shade(k.c, .45)], [1, shade(k.c, -.25)]]); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k.x, k.y - k.h); ctx.lineTo(k.x, k.y); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
  }
  // gem room sparkles
  if (cull(8230, 420)) for (let i = 0; i < 14; i++) { const x = 7840 + i * 56, y = 560 + Math.sin(i * 2.3) * 50; ctx.save(); ctx.translate(x, y); ctx.rotate(.785); rounded(-7, -7, 14, 14, 3, RAINBOW[i % 8], '#fff', 1.5); ctx.restore(); sparkle(x + 8, y - 8, 3 + Math.sin(t * 5 + i) * 2, '#fff'); }
}
function drawHatches(t) {
  for (const h of HATCHES) {
    if (!cull(h.x, 40)) continue;
    const open = player.under && Math.abs(player.x - h.x) < 200;
    ellipse(h.x, GROUND + 3, 30, 9, '#2a1640', '#ffd36b', 3);
    if (!open) { ctx.save(); ctx.translate(h.x, GROUND + 2); for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2 + t * .6); ctx.strokeStyle = RAINBOW[i * 2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 8 + i * 4, 0, 1.6); ctx.stroke(); } ctx.restore(); }
    sparkle(h.x + 22, GROUND - 14, 4 + Math.sin(t * 6 + h.x) * 2, '#fff6b0');
  }
}
function drawBuildingDoors(t) {
  // the Peekaboo House gets a front door (the Fluffkin House already has one)
  if (cull(10740, 60) && player.inside !== 'peek') {
    rounded(10712, 372, 56, 80, 26, grad(0, 372, 0, 80, [[0, '#c26ae8'], [1, '#8a3fc4']]), '#ffd36b', 4);
    ellipse(10756, 414, 4, 4, '#ffd36b'); star(10740, 392, 7, '#fff6b0');
  }
}
function drawInteriors(t) {
  const P = player;
  if (P.inside === 'peek' && cull(10740, 200)) {
    const B = BUILDINGS.peek;
    rounded(B.x1 + 6, B.roof - 10, B.x2 - B.x1 - 12, GROUND - B.roof + 10, 18, grad(0, B.roof, 0, GROUND - B.roof, [[0, '#fff1f8'], [1, '#ffd1ec']]));
    for (let x = B.x1 + 30; x < B.x2; x += 52) { ctx.fillStyle = 'rgba(255,170,220,.35)'; ctx.fillRect(x, B.roof, 18, GROUND - B.roof); }
    rounded(10760, 214, 90, 70, 10, '#bff0ff', '#ffd36b', 4); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10805, 214); ctx.lineTo(10805, 284); ctx.moveTo(10760, 249); ctx.lineTo(10850, 249); ctx.stroke(); // window
    // bouncy bed
    rounded(10584, 418, 92, 32, 10, '#a15cff', '#ffd36b', 3); rounded(10588, 404, 84, 18, 9, '#ffd1ec', '#fff', 2); ellipse(10600, 400, 14, 9, '#fff', '#ffd1ec', 2);
    // high shelf + toy box + piano
    rounded(10840, 336, 72, 12, 5, '#ffb35c', '#fff', 2); rounded(10876, 348, 6, 30, 3, '#d9962e');
    rounded(10790, 394, 60, 56, 10, grad(0, 394, 0, 56, [[0, '#ff7ab8'], [1, '#d4569b']]), '#ffd36b', 3); star(10820, 420, 10, '#fff6b0');
    if (world.toyT > 0) { world.toyT -= 1 / 60; ctx.save(); ctx.translate(10820, 392); ctx.rotate(-.5); rounded(-30, -6, 60, 8, 4, '#ff9fd2', '#fff', 2); ctx.restore(); }
    rounded(PIANO.x - 6, PIANO.y - 40, PIANO.w + 12, 40, 8, '#5b2f8a', '#ffd36b', 3);
    for (let i = 0; i < PIANO.keys; i++) { const w = PIANO.w / PIANO.keys, lit = PIANO.lit[i] = Math.max(0, PIANO.lit[i] - 1 / 40); rounded(PIANO.x + i * w + 1, PIANO.y - 2 + lit * 3, w - 2, 26, 3, lit > 0 ? RAINBOW[i] : '#ffffff', '#5b2f8a', 1.5); }
    rounded(PIANO.x, PIANO.y + 24, 8, 22, 3, '#5b2f8a'); rounded(PIANO.x + PIANO.w - 8, PIANO.y + 24, 8, 22, 3, '#5b2f8a');
    // the critters who live here wander about
    for (const r of ROOMIES) {
      r.x += r.dir * 30 / 60; if (r.x < B.x1 + 40 || r.x > B.x2 - 40) r.dir *= -1;
      const c = RAINBOW[(r.i * 3) % 8], y = GROUND - Math.abs(Math.sin(t * 6 + r.i)) * 8;
      ellipse(r.x, GROUND, 14, 4, 'rgba(60,25,110,.18)');
      if (r.i % 2 === 0) { ellipse(r.x - 8, y - 38, 4, 10, c, '#fff', 1.5); ellipse(r.x + 8, y - 38, 4, 10, c, '#fff', 1.5); } else { ellipse(r.x - 11, y - 30, 6, 6, c, '#fff', 1.5); ellipse(r.x + 11, y - 30, 6, 6, c, '#fff', 1.5); }
      ellipse(r.x, y - 18, 16, 16, c, '#fff', 2); ellipse(r.x - 5 * -r.dir, y - 21, 2.6, 3.4, '#2a0f45'); ellipse(r.x + 5 * r.dir, y - 21, 2.6, 3.4, '#2a0f45');
      ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(r.x, y - 14, 4, .2, Math.PI - .2); ctx.stroke();
    }
    // cutaway frame (shows we're inside)
    rounded(B.x1, B.roof - 16, B.x2 - B.x1, GROUND - B.roof + 16, 22, null, '#e9a93a', 8);
    rounded(B.door - 28, 372, 56, 80, 26, 'rgba(160,90,220,.35)', '#ffd36b', 3);
  }
  if (P.inside === 'fluff' && cull(11240, 140)) {
    const B = BUILDINGS.fluff;
    ctx.save(); ctx.beginPath(); ctx.moveTo(B.x1 + 6, GROUND); ctx.lineTo(B.x1 + 6, 300); ctx.quadraticCurveTo(B.door, 150, B.x2 - 6, 300); ctx.lineTo(B.x2 - 6, GROUND); ctx.closePath(); ctx.clip();
    ctx.fillStyle = grad(0, 160, 0, 290, [[0, '#fff6d8'], [1, '#ffd89a']]); ctx.fillRect(B.x1, 150, B.x2 - B.x1, 300);
    for (let i = 0; i < 9; i++) bulb(B.x1 + 20 + i * 22, 250 + Math.sin(i) * 12, true, RAINBOW[i % 8], .8);
    [[11170, '#ff9fd2'], [11240, '#9fe6ff'], [11310, '#c9a6ff']].forEach(([x, c]) => { ellipse(x, 438, 32, 14, c, '#fff', 2); });
    const home = FLUFFS.filter(f => f.kind === 'fluff' && f.state === 'home');
    home.forEach((f, i) => drawFluff(B.x1 + 34 + (i * 31 + Math.sin(t * .7 + i) * 18) % (B.x2 - B.x1 - 60), GROUND - 6, f.c, t * 1.3, i, 'home'));
    if (!home.length) { text('?', B.door, 330, 40, '#e9a93a', '#fff'); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(B.x1, GROUND); ctx.lineTo(B.x1, 300); ctx.quadraticCurveTo(B.door, 140, B.x2, 300); ctx.lineTo(B.x2, GROUND); ctx.strokeStyle = '#e9a93a'; ctx.lineWidth = 7; ctx.stroke();
  }
}
function drawNest(t) {
  if (!cull(NEST.x, 80)) return;
  const home = FLUFFS.filter(f => f.kind === 'star' && f.state === 'home');
  glow(NEST.x, NEST.y - 30, 60, '#fff3a6', .4 + home.length * .08);
  ellipse(NEST.x + 20, NEST.y - 6, 38, 14, '#c98a4a', '#7a4a1a', 2.5);
  for (let i = 0; i < 7; i++) { ctx.strokeStyle = '#e9b36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(NEST.x + 20, NEST.y - 2, 30 - i * 2, Math.PI * 1.05 + i * .1, Math.PI * 1.9 - i * .05); ctx.stroke(); }
  home.forEach((f, i) => drawStarBaby(NEST.x - 4 + i * 9, NEST.y - 10, f.c, t, i, 'home'));
}
function drawMotes(t) {
  // floating magic sparkles in the air (screen space, gentle parallax)
  for (let i = 0; i < 26; i++) {
    const sp = .3 + (i % 5) * .12, x = ((i * 157 - camera * sp + t * (8 + i % 7)) % (vw + 60) + vw + 60) % (vw + 60) - 30;
    const y = ((i * 89 + Math.sin(t * .5 + i) * 20 - t * (6 + i % 4) * 2) % VH + VH) % VH;
    const a = .35 + Math.sin(t * 2 + i) * .25;
    if (a > .1) glow(x, y, 6 + (i % 3) * 3, ['#fff6c8', '#ffd1f0', '#c9f2ff'][i % 3], a);
  }
}
