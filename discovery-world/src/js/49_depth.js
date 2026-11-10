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
// (build 11: the insides are now full-sized walk-in houses — see 49h_houses.js)

function layerKey() { const P = player; return P.under ? 'ug' : P.inside ? 'in:' + P.inside : ''; }
function netAt(x) { return NETWORKS.find(n => x >= n.a && x <= n.b); }
function segAt(x) { const n = netAt(x); return n && n.segs.find(s => x >= s[0] && x <= s[1]); }
function layerBounds() {
  const P = player;
  if (P.under) { const n = netAt(P.x) || NETWORKS[0]; return [n.a + 22, n.b - 22]; }
  if (P.inside) { const H = HOUSES[P.inside]; return [H.ox + 60, H.ox + H.w - 60]; }
  return [60, WORLD_W - 70];
}
const floorY = () => player.under ? UG.floor : GROUND;
function isCrawling() { const s = player.under && segAt(player.x); return !!s && s[2] === 'crawl'; }
function ceilingAt() {
  const P = player;
  if (P.under) { const s = segAt(P.x); return s && s[2] === 'crawl' ? UG.crawlCeil : UG.roomCeil; }
  if (P.inside) return houseCeiling();
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
  const P = player, B = BUILDINGS[id], H = HOUSES[id]; if (P.ride || P.stair) return;
  if (P.inside === id) { // from inside: walk out of the front door (only from the ground floor, near the door)
    if (Math.abs(P.x - H.exit) > 330 || Math.abs(P.y - GROUND) > 4) { burst(H.exit, GROUND - 100, 6); Sound.click(); return; }
    leaveHouse(); return;
  }
  if (P.inside || P.under || Math.abs(P.x - B.door) > 330) { burst(B.door, 410, 6); Sound.click(); return; }
  enterHouse(id);
}

// ---------- underground + interior interactives ----------
const CRYSTALS = [
  ...[1150, 1215, 1290, 1365].map((x, i) => ({ x, y: 700, h: 70 + (i % 2) * 30, c: ['#9fe6ff', '#ff9fd8', '#c9a6ff', '#9ff7e0'][i], note: i + 1, lit: 0 })),
  ...[7000, 7070, 7140, 7210, 7280].map((x, i) => ({ x, y: 700, h: 110 + Math.sin(i * 2) * 40, c: RAINBOW[i + 1], note: i + 3, lit: 0, big: true })),
];
function tapCrystal(k) { k.lit = 1; Sound.bell(NOTES[k.note % 8] / (k.big ? 2 : 1), .06); Sound.bell(NOTES[k.note % 8], .03, .05); burst(k.x, k.y - k.h * .7, 8, [k.c, '#fff'], 'star', .5); discover('crystal', 'Singing crystals! Tap them to play.', k.x, k.y - k.h); }
const PIANO = { x: 21390, w: 150, y: 336, keys: 8, lit: new Array(8).fill(0) };
function tapPiano(p) { const i = clamp(Math.floor((p.x - PIANO.x) / (PIANO.w / PIANO.keys)), 0, 7); PIANO.lit[i] = 1; Sound.bell(NOTES[i], .06); burst(p.x, PIANO.y - 10, 4, [RAINBOW[i], '#fff'], 'star', .4); discover('piano', 'Play the piano!', p.x, 260); }
function tapToybox() { world.toyT = 1.2; confetti(21642, 390, 24, 360); burst(21642, 390, 12, RAINBOW, 'heart', .8); Sound.giggle(); discover('toybox', 'Toys pop out of the toy box!', 21642, 300); }
const ROOMIES = [0, 1, 2, 3, 4].map(i => ({ x: 20960 + i * 110, dir: i % 2 ? 1 : -1, hop: 0, i }));

// ---------- STAR BABIES (second rescue family) ----------
const NEST = { x: 1342, y: 213 };
[
  { id: 's1', x: 870, y: UG.floor, layer: 'ug' }, { id: 's2', x: 8420, y: UG.floor, layer: 'ug' }, { id: 's3', x: 7080, y: UG.floor, layer: 'ug' },
  { id: 's4', x: 21712, y: -4, layer: 'in:peek' }, { id: 's5', x: 4150, y: 410 }, { id: 's6', x: 13250, y: GROUND },
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
  if (cull(10740, 60)) {
    rounded(10712, 372, 56, 80, 26, grad(0, 372, 0, 80, [[0, '#c26ae8'], [1, '#8a3fc4']]), '#ffd36b', 4);
    ellipse(10756, 414, 4, 4, '#ffd36b'); star(10740, 392, 7, '#fff6b0');
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

// ---------- DOORS everywhere you'd expect them (build 9b) ----------
// Every usable door shows a big "door bubble" when you're near; tap the door/bubble or press PAW.
// Tower-trunk doors lead down a secret staircase into the caves (and cave doors lead back up).
const PORTALS = [
  { id: 'bridge', x: 1215, under: false, to: { under: true, x: 1250 }, c: '#a15cff' },   // door under the rainbow bridge
  { id: 'cave1', x: 1250, under: true, to: { under: false, x: 1215 }, c: '#ff6fae' },
  { id: 'tower2', x: 8010, under: false, to: { under: true, x: 7040 }, c: '#ff6fae' },   // door in the Sky Tower base
  { id: 'cave2', x: 7040, under: true, to: { under: false, x: 8010 }, c: '#a15cff' },
];
function usePortal(d) {
  const P = player; if (P.ride) return;
  if (!!P.under !== d.under || P.inside || Math.abs(P.x - d.x) > 330) { burst(d.x, (d.under ? UG.floor : GROUND) - 40, 6); Sound.click(); return; }
  world.doorFlash = .5; P.under = d.to.under; P.inside = null; P.x = d.to.x; P.y = d.to.under ? UG.floor : GROUND; P.vx = P.vy = 0; P.grounded = true;
  Sound.tone(520, .25, 'triangle', .05, 1.4); Sound.tone(780, .3, 'triangle', .04, 1.3, .12);
  burst(P.x, P.y - 60, 16, ['#fff', '#ffe36e', '#ff9fd8']);
  discover('secretdoor', d.under ? 'Back up the secret stairs!' : 'A secret door! It leads down to the crystal caves!', P.x, P.y - 160);
}
// all doors in one list: [x, groundY, layer it is used from, action, isInside]
function allDoors() {
  const P = player, list = PORTALS.map(d => ({ x: d.x, y: d.under ? UG.floor : GROUND, lk: d.under ? 'ug' : '', go: () => usePortal(d) }));
  for (const id of Object.keys(BUILDINGS)) { const B = BUILDINGS[id]; list.push({ x: B.door, y: GROUND, lk: '', go: () => toggleDoor(id) }); }
  return list.concat(houseDoors());
}
function nearDoor() { const P = player, lk = layerKey(); return allDoors().find(d => d.lk === lk && Math.abs(P.x - d.x) < 110 && Math.abs(P.y - d.y) < 6); }
function drawPortalDoors(t) {
  for (const d of PORTALS) {
    const y = d.under ? UG.floor : GROUND; if (!cull(d.x, 40)) continue;
    rounded(d.x - 24, y - 78, 48, 78, 24, grad(0, y - 78, 0, 78, [[0, shade(d.c, .15)], [1, shade(d.c, -.25)]]), '#ffd36b', 4);
    rounded(d.x - 16, y - 66, 32, 30, 15, 'rgba(255,255,255,.18)'); ellipse(d.x + 13, y - 36, 3.5, 3.5, '#ffd36b'); star(d.x, y - 56, 7, '#fff6b0');
    glow(d.x, y - 40, 50, '#fff3a6', .25 + Math.sin(t * 3) * .1);
  }
}
function drawDoorBubble(t) {
  const d = nearDoor(); if (!d || player.ride || player.stair) return;
  const y = d.y - 238 + Math.sin(t * 4) * 4; // above the creature's head, never over its face
  ellipse(d.x, y, 30, 26, 'rgba(255,255,255,.96)', '#ffc531', 3);
  rounded(d.x - 9, y - 14, 18, 26, 9, '#a15cff', '#fff', 2); ellipse(d.x + 5, y, 1.8, 1.8, '#ffd36b');
  if (d.icon) { // stairs: footsteps going up or down
    ellipse(d.x, y, 30, 26, 'rgba(255,255,255,.96)', '#ffc531', 3);
    for (let i = 0; i < 3; i++) { const sx = d.x - 24 + i * 12, sy = y + 4 - i * 9; rounded(sx, sy, 12, y + 16 - sy, 2, '#e8a464', '#c8722e', 1.5); }
    const u = d.icon === 'up' ? -1 : 1, ax = d.x + 18, ay = y + (u < 0 ? -12 : 4);
    ctx.beginPath(); ctx.moveTo(ax, ay + u * 10); ctx.lineTo(ax - 8, ay); ctx.lineTo(ax + 8, ay); ctx.closePath(); ctx.fillStyle = '#ff4f9a'; ctx.fill(); rounded(ax - 3, u < 0 ? ay : ay - 8, 6, 8, 2, '#ff4f9a');
    ctx.beginPath(); ctx.moveTo(d.x - 7, y + 26); ctx.lineTo(d.x, y + 36); ctx.lineTo(d.x + 7, y + 26); ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fill();
    return;
  }
  ctx.beginPath(); if (d.out) { ctx.moveTo(d.x + 22, y); ctx.lineTo(d.x + 12, y - 7); ctx.lineTo(d.x + 12, y + 7); } else { ctx.moveTo(d.x + 12, y); ctx.lineTo(d.x + 22, y - 7); ctx.lineTo(d.x + 22, y + 7); }
  ctx.closePath(); ctx.fillStyle = '#ff4f9a'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(d.x - 7, y + 26); ctx.lineTo(d.x, y + 36); ctx.lineTo(d.x + 7, y + 26); ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fill();
}
