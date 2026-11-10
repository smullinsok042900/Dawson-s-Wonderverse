// ===================================================================
// 49h_houses.js — build 11: REAL WALK-IN HOUSES.
// Going through a front door now takes you inside a full-sized house
// (a cut-away doll's house view): several rooms on each floor, staircases
// between floors, furniture you can bounce on and things to tap.
//   • Peekaboo House: 3 floors (hall, living room, playroom / landing,
//     bedroom, bathroom / attic).
//   • Fluffkin House: 2 floors (hall, family room / landing, nursery with
//     a little bed for every rescued Fluffkin).
// The insides live in their own space past the end of the world
// (x ≥ 20000), so outside things never mix with inside things.
// Stairs: tap the arrow bubble or press PAW at the bottom or top to step on,
// then walk them with the arrow buttons (one musical note per step).
// ===================================================================
const HOUSES = {
  peek: {
    ox: 20000, w: 2200, floors: [450, 116, -218], roof: -528, exit: 20180, name: 'Peekaboo House',
    stairs: [{ x0: 20380, f0: 0, x1: 20840, f1: 1 }, { x0: 21100, f0: 1, x1: 20600, f1: 2 }],
    // [from x, to x, floor, wall top colour, wall bottom colour, pattern]
    rooms: [
      [20030, 20900, 0, '#ffe3f1', '#ffc6e3', 'stripe'],   // front hall
      [20900, 21560, 0, '#fff0d6', '#ffd7a6', 'dots'],     // living room
      [21560, 22170, 0, '#dcf5ff', '#a9dcf6', 'stars'],    // playroom
      [20030, 21250, 1, '#efe2ff', '#d6bffb', 'stripe'],   // landing
      [21250, 21800, 1, '#ffe2f0', '#ffbedb', 'hearts'],   // bedroom
      [21800, 22170, 1, '#dcfff4', '#a6ead6', 'tiles'],    // bathroom
      [20030, 22170, 2, '#fff1d2', '#efd09a', 'planks'],   // attic
    ],
  },
  fluff: {
    ox: 23000, w: 1700, floors: [450, 116], roof: -194, exit: 23170, name: 'Fluffkin House',
    stairs: [{ x0: 23400, f0: 0, x1: 23860, f1: 1 }],
    rooms: [
      [23030, 23620, 0, '#fff4c9', '#ffdf90', 'dots'],     // front hall
      [23620, 24670, 0, '#ffe6d2', '#ffc8a0', 'stripe'],   // family room
      [23030, 23920, 1, '#e4f6ff', '#bde5fb', 'stars'],    // landing
      [23920, 24670, 1, '#f3e6ff', '#dbc5fb', 'hearts'],   // nursery
    ],
  },
};
const SLAB = 24;
// upper floors are solid floors (you go between floors on the stairs)
for (const id of Object.keys(HOUSES)) {
  const H = HOUSES[id];
  H.floors.forEach((fy, i) => { if (i) PLATFORMS.push({ a: H.ox + 20, b: H.ox + H.w - 20, y: fy, layer: 'in:' + id }); });
}
// furniture you can stand and bounce on
PLATFORMS.push(
  { a: 20950, b: 21150, y: 388, step: true, bounce: 640, layer: 'in:peek', drum: { x: 21050, y: 388, note: 2, sq: 0 }, onLand: drumLand },   // bouncy sofa
  { a: 21290, b: 21480, y: 60, step: true, bounce: 690, layer: 'in:peek', drum: { x: 21385, y: 60, note: 4, sq: 0 }, onLand: drumLand },     // bouncy bed
  { a: 21655, b: 21770, y: -4, layer: 'in:peek' },                                                                                         // high toy shelf (Star Baby)
  { a: 21950, b: 22090, y: -278, step: true, layer: 'in:peek' },                                                                           // old trunk in the attic
  { a: 23700, b: 23900, y: 392, step: true, bounce: 760, layer: 'in:fluff', drum: { x: 23800, y: 392, note: 6, sq: 0 }, onLand: drumLand }, // cushion pile
);
SECRET_STARS.push({ id: 'star11', x: 22020, y: -420 }); // above the trunk in the attic
// little bits of state for the things you can play with inside
const HS = { chand: 0, fire: 0, cup: 0, tower: 0, horse: 0, clock: 0, night: 0, teddy: 0, duck: 0, tub: [], scope: 0, chest: 0, music: 0, fdrum: 0, mobile: 0, wake: [0, 0, 0, 0, 0, 0], dark: {}, stepT: 0 };

function houseOf() { return HOUSES[player.inside]; }
function houseLevel() { const H = houseOf(), P = player; let l = 0; H.floors.forEach((f, i) => { if (i && P.y <= f + 2) l = i; }); return l; }
function houseCeiling() { const H = houseOf(), l = houseLevel(); return l + 1 < H.floors.length ? H.floors[l + 1] + SLAB : H.roof; }
function houseCamX() { const H = houseOf(); return H.w <= vw ? H.ox + (H.w - vw) / 2 : clamp(player.x - vw / 2 + world.lookAhead, H.ox, H.ox + H.w - vw); }
function snapCamera() {
  const P = player; world.lookAhead = 0;
  camera = P.inside ? houseCamX() : clamp(P.x - vw / 2, 0, Math.max(0, WORLD_W - vw));
  camY = clamp(P.y - 390, -950, P.under ? 340 : 540 - VH);
}
function enterHouse(id) {
  const P = player, H = HOUSES[id];
  P.inside = id; P.under = false; P.x = H.exit; P.y = GROUND; P.vx = P.vy = 0; P.grounded = true; P.jumps = 0; P.stair = null;
  world.doorFlash = .55; snapCamera();
  Sound.tone(520, .25, 'triangle', .05, 1.4); Sound.tone(780, .3, 'triangle', .04, 1.3, .12);
  burst(P.x, P.y - 80, 14, ['#fff', '#ffe36e', '#ff9fd8']);
  discover('door-' + id, `Welcome inside the ${H.name}! Find the stairs!`, P.x, P.y - 200);
}
function leaveHouse() {
  const P = player, B = BUILDINGS[P.inside];
  P.inside = null; P.stair = null; P.x = B.door; P.y = GROUND; P.vx = P.vy = 0; P.grounded = true;
  world.doorFlash = .45; snapCamera(); Sound.tone(440, .2, 'triangle', .05, .7); burst(B.door, 410, 8);
}

// ---------- stairs: the creature walks up / down by itself ----------
function stairEnds(s, H) { return { bot: [s.x0, H.floors[s.f0]], top: [s.x1, H.floors[s.f1]] }; }
// Build 12: the child walks the stairs herself. The arrow bubble (or PAW) puts the
// creature on the bottom (or top) step; then the arrow buttons walk along the stairs,
// she can stop or turn round, and stepping off either end puts her on that floor.
function startStairs(s, up) {
  const P = player, H = houseOf(); if (!H || P.ride || P.stair) return;
  const { bot, top } = stairEnds(s, H), from = up ? bot : top;
  if (Math.abs(P.y - from[1]) > 4 || !P.grounded) { burst(from[0], from[1] - 40, 6); Sound.click(); return; }
  P.stair = { s, k: up ? 0 : 1, step: -1, len: Math.hypot(top[0] - bot[0], top[1] - bot[1]) }; P.vy = 0; P.vx = 0;
  P.x = from[0]; P.y = from[1];
  burst(P.x, P.y - 20, 8, ['#fff', '#ffe36e']); Sound.tone(up ? 520 : 440, .15, 'triangle', .04, 1.2);
  discover(up ? 'stairs-up' : 'stairs-down', up ? 'Walk up the stairs with the arrow buttons!' : 'Walk down the stairs with the arrow buttons!', from[0], from[1] - 200);
}
function updateStairs(dt) {
  const P = player, S = P.stair, H = houseOf(); if (!H) { P.stair = null; return; }
  const { bot, top } = stairEnds(S.s, H), upDir = Math.sign(top[0] - bot[0]);
  const h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (h) P.facing = h;
  S.k += h * upDir * 250 / S.len * dt;
  if (S.k < 0 || S.k > 1) { // stepped off an end: back to normal walking on that floor
    const end = S.k > 1 ? top : bot; P.stair = null; P.x = end[0] + h * 4; P.y = end[1]; P.vx = h * 250; P.vy = 0; P.grounded = true; P.jumps = 0;
    burst(end[0], end[1], 5, ['#fff', '#ffe36e']); return;
  }
  P.x = lerp(bot[0], top[0], S.k); P.y = lerp(bot[1], top[1], S.k); P.vx = h * 250;
  const n = Math.round(S.k * 14); // musical steps: up the scale going up, down the scale going down
  if (n !== S.step) { if (S.step >= 0) Sound.bell(NOTES[n % 8] * (n >= 8 ? 2 : 1), .025); S.step = n; }
  P.grounded = true; P.vy = 0; P.jumps = 0;
}
// door + stair bubbles used by nearDoor()
function houseDoors() {
  const P = player, list = [];
  for (const id of Object.keys(HOUSES)) {
    const H = HOUSES[id], lk = 'in:' + id;
    list.push({ x: H.exit, y: GROUND, lk, go: () => toggleDoor(id), out: true });
    for (const s of H.stairs) {
      const { bot, top } = stairEnds(s, H);
      list.push({ x: bot[0], y: bot[1], lk, go: () => startStairs(s, true), icon: 'up' });
      list.push({ x: top[0], y: top[1], lk, go: () => startStairs(s, false), icon: 'down' });
    }
  }
  return P.inside ? list : [];
}

// ---------- things to play with ----------
function hs(key, v, disc, msg, x, y) { HS[key] = v; if (disc) discover(disc, msg, x, y); }
const tapChandelier = () => { hs('chand', 1.6, 'chandelier', 'Ting-a-ling! The sparkly lamp swings.', 20600, 220); [0, 2, 4].forEach((n, i) => Sound.bell(NOTES[n + 3], .04, i * .1)); };
const tapCupboard = () => { hs('cup', 2.4, 'cupboard', 'Peekaboo! Someone lives under the stairs!', 20720, 300); Sound.giggle(); burst(20720, 360, 10, ['#ffd84a', '#ff8fc8'], 'heart', .6); };
const tapFire = () => { hs('fire', 2, 'fireplace', 'Whoosh! A cosy, sparkly fire.', 21260, 300); Sound.noise(.6, 200, 1200, .04); burst(21260, 380, 18, ['#ffd84a', '#ff9a2e', '#fff3a6'], 'star', .6); };
const tapTower = () => { if (HS.tower > 0) return; hs('tower', 3, 'blocks', 'Crash! Tap again and the tower builds back up.', 21800, 300); Sound.boing(); Sound.giggle(); };
const tapHorse = () => { hs('horse', 2.5, 'rockinghorse', 'Rock-a-bye rocking horse!', 21980, 330); Sound.tone(520, .2, 'sine', .05, 1.6); Sound.tone(660, .25, 'sine', .04, .8, .18); };
const tapClock = () => { hs('clock', 1.8, 'cuckoo', 'Cuckoo! Cuckoo!', 20200, -40); Sound.tone(880, .14, 'sine', .06, .8); Sound.tone(700, .2, 'sine', .06, .8, .2); };
const tapNight = () => { HS.night = HS.night > 0 ? 0 : 8; Sound.chime(); discover('nightlight', 'Night-night! Stars glow on the ceiling.', 21560, -80); };
const tapTeddy = () => { hs('teddy', 1.2, 'teddy', 'A big teddy hug!', 21610, 40); Sound.giggle(); burst(21610, 50, 10, ['#ff8fc8', '#ff6fae'], 'heart', .7); };
const tapDuck = () => { hs('duck', 1, 'duck', 'Squeak! Rubber duck!', 22000, 20); Sound.tone(1200, .12, 'square', .03, .6); Sound.tone(900, .12, 'square', .03, .7, .12); };
const tapTub = () => { for (let i = 0; i < 9; i++) HS.tub.push({ x: 21900 + rand(0, 160), y: 60, vy: rand(-90, -50), r: rand(8, 18), life: rand(2, 4) }); Sound.pop(); discover('bubbles-tub', 'Bubble bath! Bubbles everywhere!', 21970, 0); };
const tapScope = () => { hs('scope', 3, 'telescope', 'Look! Shooting stars!', 21000, -380); Sound.twinkle(); Sound.chime(); };
const tapChest = () => { hs('chest', 3, 'chest', 'Treasure! The chest is full of sparkles!', 21400, -330); confetti(21400, -280, 30, 380); Sound.chime(); };
const tapMusic = () => { hs('music', 6, 'musicbox', 'A music box! Listen to it play.', 21700, -330); [0, 2, 4, 2, 0, 4, 7, 4].forEach((n, i) => Sound.bell(NOTES[n % 8] * (n > 7 ? 2 : 1), .035, i * .28)); };
const tapFDrum = () => { hs('fdrum', 1.6, 'fluffdrum', 'Boom! Everybody jumps!', 24050, 320); Sound.tone(110, .3, 'sine', .09, .4); Sound.tone(220, .15, 'triangle', .05, .5, .05); };
const tapMobile = () => { hs('mobile', 5, 'mobile', 'The twinkly mobile spins round.', 24290, -60); [4, 2, 0, 2, 4, 4, 4].forEach((n, i) => Sound.bell(NOTES[n], .03, i * .3)); };
function tapBed(j) {
  const f = FLUFF_FAMILY()[j]; HS.wake[j] = 1.8;
  if (f && f.state === 'home') { Sound.giggle(); burst(bedX(j), 60, 10, [f.c, '#fff'], 'heart', .6); discover('fluffbed', 'Wake up, little Fluffkin! Time to bounce!', bedX(j), -20); }
  else { Sound.click(); burst(bedX(j), 70, 6, ['#fff', '#e3b0ee']); discover('emptybed', 'This bed is waiting for a lost Fluffkin.', bedX(j), -20); }
}
const FLUFF_FAMILY = () => FLUFFS.filter(f => f.kind === 'fluff');
const bedX = j => 24010 + j * 108;
function toggleRoomLight(id, i) { const k = id + i; HS.dark[k] = !HS.dark[k]; Sound.click(); discover('lightswitch', 'Click! Lights on, lights off.', null, null); }

// tap targets and hints
INTERACT.unshift(
  ...Object.keys(HOUSES).flatMap(id => {
    const H = HOUSES[id], lk = 'in:' + id;
    return [
      { box: [H.exit - 56, GROUND - 236, H.exit + 56, GROUND], priority: true, layer: lk, tap: () => toggleDoor(id) },
      // light switches by each room's doorway
      ...H.rooms.map((r, i) => ({ box: [r[0] + 22, H.floors[r[2]] - 170, r[0] + 62, H.floors[r[2]] - 120], priority: true, layer: lk, tap: () => toggleRoomLight(id, i) })),
    ];
  }),
  { box: [20560, 140, 20640, 250], priority: true, layer: 'in:peek', hint: [20600, 215], disc: 'chandelier', tap: tapChandelier },
  { box: [20675, 300, 20765, 450], priority: true, layer: 'in:peek', hint: [20720, 380], disc: 'cupboard', tap: tapCupboard },
  { box: [21180, 280, 21340, 450], priority: true, layer: 'in:peek', hint: [21260, 400], disc: 'fireplace', tap: tapFire },
  { box: [21760, 300, 21860, 450], priority: true, layer: 'in:peek', hint: [21800, 380], disc: 'blocks', tap: tapTower },
  { box: [21920, 330, 22050, 450], priority: true, layer: 'in:peek', hint: [21985, 390], disc: 'rockinghorse', tap: tapHorse },
  { box: [20160, -110, 20240, 10], priority: true, layer: 'in:peek', hint: [20200, -50], disc: 'cuckoo', tap: tapClock },
  { box: [21530, 10, 21590, 116], priority: true, layer: 'in:peek', hint: [21560, 40], disc: 'nightlight', tap: tapNight },
  { box: [21585, 50, 21640, 116], priority: true, layer: 'in:peek', hint: [21612, 80], disc: 'teddy', tap: tapTeddy },
  { box: [21975, 10, 22030, 50], priority: true, layer: 'in:peek', hint: [22002, 30], disc: 'duck', tap: tapDuck },
  { box: [21870, 40, 22080, 116], priority: true, layer: 'in:peek', hint: [21930, 70], disc: 'bubbles-tub', tap: tapTub },
  { box: [20930, -400, 21080, -218], priority: true, layer: 'in:peek', hint: [21000, -300], disc: 'telescope', tap: tapScope },
  { box: [21340, -300, 21460, -218], priority: true, layer: 'in:peek', hint: [21400, -260], disc: 'chest', tap: tapChest },
  { box: [21660, -290, 21740, -218], priority: true, layer: 'in:peek', hint: [21700, -255], disc: 'musicbox', tap: tapMusic },
  { box: [24000, 360, 24100, 450], priority: true, layer: 'in:fluff', hint: [24050, 400], disc: 'fluffdrum', tap: tapFDrum },
  { box: [24230, -194, 24350, -60], priority: true, layer: 'in:fluff', hint: [24290, -90], disc: 'mobile', tap: tapMobile },
  ...[0, 1, 2, 3, 4, 5].map(j => ({ box: [bedX(j) - 48, 40, bedX(j) + 48, 116], priority: true, layer: 'in:fluff', hint: j ? null : [bedX(0), 70], disc: 'fluffbed', tap: () => tapBed(j) })),
);

// stairs start only from the arrow bubble or PAW: tapping the staircase itself does nothing (build 12)
EXTRA_HINTS.push(...Object.keys(HOUSES).flatMap(id => HOUSES[id].stairs.map(s => ({ get hint() { return [s.x0, HOUSES[id].floors[s.f0] - 238]; }, disc: 'stairs-up', layer: 'in:' + id }))));
function updateHouses(dt, t) {
  for (const k of ['chand', 'fire', 'cup', 'horse', 'clock', 'teddy', 'duck', 'scope', 'chest', 'music', 'fdrum', 'mobile']) HS[k] = Math.max(0, HS[k] - dt);
  if (HS.tower > 0) HS.tower = Math.max(0, HS.tower - dt);
  HS.night = Math.max(0, HS.night - dt);
  HS.wake = HS.wake.map(w => Math.max(0, w - dt));
  for (const b of HS.tub) { b.y += b.vy * dt; b.x += Math.sin(t * 2 + b.r) * 20 * dt; b.life -= dt; }
  HS.tub = HS.tub.filter(b => b.life > 0 && b.y > -180);
  if (player.inside === 'fluff' && world.partyT > 0 && Math.random() < dt * 6) confetti(player.x + rand(-300, 300), player.y - 250, 12, 160);
}

// ---------- drawing ----------
const wallTiles = {};
function wallPattern(kind, col) {
  const key = kind + col; if (wallTiles[key]) return wallTiles[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), o = ctx;
  ctx = g; g.scale(2, 2);
  const tint = 'rgba(255,255,255,.4)', deep = 'rgba(150,70,170,.10)';
  if (kind === 'stripe') { g.fillStyle = tint; g.fillRect(0, 0, 14, 64); g.fillStyle = deep; g.fillRect(30, 0, 3, 64); }
  else if (kind === 'dots') { [[16, 16], [48, 48]].forEach(([x, y]) => ellipse(x, y, 6, 6, tint)); [[48, 16], [16, 48]].forEach(([x, y]) => ellipse(x, y, 2.5, 2.5, deep)); }
  else if (kind === 'stars') { star(18, 18, 8, tint); star(48, 46, 5, tint); sparkle(50, 14, 3, 'rgba(255,255,255,.55)'); }
  else if (kind === 'hearts') { g.beginPath(); heartPath(18, 20, 10); g.fillStyle = tint; g.fill(); g.beginPath(); heartPath(48, 50, 7); g.fillStyle = deep; g.fill(); }
  else if (kind === 'tiles') { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.strokeRect(1, 1, 31, 31); g.strokeRect(33, 33, 30, 30); g.strokeRect(33, 1, 30, 31); g.strokeRect(1, 33, 31, 30); }
  else if (kind === 'planks') { g.fillStyle = 'rgba(160,100,40,.16)'; g.fillRect(0, 30, 64, 2); g.fillRect(0, 62, 64, 2); g.fillRect(20, 0, 2, 30); g.fillRect(44, 32, 2, 30); }
  ctx = o;
  const p = ctx.createPattern(c, 'repeat'); if (p && p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix().scale(.5));
  return (wallTiles[key] = p);
}
const vis = (a, b) => b > camera - 40 && a < camera + vw + 40;
const visY = (top, bot) => bot > camY - 40 && top < camY + VH + 40;
function roomTop(H, f) { return f + 1 < H.floors.length ? H.floors[f + 1] + SLAB : H.roof; }

function drawWindow(x, y, w, h, t, night) {
  rounded(x - 8, y - 8, w + 16, h + 16, 14, '#ffffff', '#e9a93a', 4);
  rounded(x, y, w, h, 10, grad(0, y, 0, h, night ? [[0, '#2a2470'], [1, '#6a4ab8']] : [[0, '#8fd0ff'], [1, '#d8f1ff']]));
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
  if (night) { for (let i = 0; i < 8; i++) sparkle(x + ((i * 37) % w), y + ((i * 23) % h), 2.5 + Math.sin(t * 3 + i) * 1.2, '#fff6b0'); }
  else { const cx = x + ((t * 8) % (w + 80)) - 40; ellipse(cx, y + h * .35, 26, 11, 'rgba(255,255,255,.9)'); ellipse(cx + 18, y + h * .3, 16, 10, 'rgba(255,255,255,.9)'); ellipse(x + w * .5, y + h + 30, w * .7, 46, '#9fe6a8'); }
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  // curtains
  for (const s of [-1, 1]) { const cx = s < 0 ? x - 6 : x + w + 6; ctx.beginPath(); ctx.moveTo(cx, y - 10); ctx.quadraticCurveTo(cx - s * 26, y + h * .5, cx - s * 4, y + h + 10); ctx.lineTo(cx + s * 14, y + h + 10); ctx.lineTo(cx + s * 14, y - 10); ctx.closePath(); ctx.fillStyle = '#ff9fd2'; ctx.fill(); ctx.strokeStyle = '#e46aa8'; ctx.lineWidth = 2; ctx.stroke(); }
  rounded(x - 16, y - 18, w + 32, 10, 5, '#e9a93a');
}
function drawFrame(x, y, w, h, inner) { rounded(x - 5, y - 5, w + 10, h + 10, 6, '#ffc75a', '#c8892a', 3); rounded(x, y, w, h, 4, '#fff8ea'); if (inner) inner(x + w / 2, y + h / 2); }
function drawLamp(x, y, on, t) { ctx.strokeStyle = '#c8892a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); if (on) glow(x, y + 46, 120, '#fff3c4', .35); ctx.beginPath(); ctx.moveTo(x - 26, y + 52); ctx.quadraticCurveTo(x, y + 18, x + 26, y + 52); ctx.closePath(); ctx.fillStyle = on ? '#fff3a6' : '#d8c6ea'; ctx.fill(); ctx.strokeStyle = '#e9a93a'; ctx.lineWidth = 2.5; ctx.stroke(); bulb(x, y + 54, on, '#ffd76a', .7); }

function drawRoom(id, H, r, i, t) {
  const [a, b, f, c1, c2, pat] = r, fy = H.floors[f], top = roomTop(H, f);
  if (!vis(a, b) || !visY(top, fy)) return;
  rounded(a, top, b - a, fy - top, 0, grad(0, top, 0, fy - top, [[0, c1], [1, c2]]));
  const p = wallPattern(pat, c1); if (p) { ctx.fillStyle = p; ctx.fillRect(a, top, b - a, fy - top); }
  // wainscot + skirting + crown moulding
  rounded(a, fy - 92, b - a, 92, 0, 'rgba(255,255,255,.28)'); ctx.fillStyle = 'rgba(160,80,160,.12)'; for (let x = a + 20; x < b - 30; x += 70) ctx.fillRect(x, fy - 80, 50, 64);
  rounded(a, fy - 94, b - a, 6, 3, '#ffffff'); rounded(a, fy - 16, b - a, 16, 0, '#ffffff'); rounded(a, top, b - a, 12, 0, 'rgba(255,255,255,.75)');
  // light switch by the doorway
  rounded(a + 32, fy - 160, 20, 30, 5, '#fff', '#c8892a', 2); rounded(a + 38, fy - (HS.dark[id + i] ? 140 : 154), 8, 10, 3, '#ff6fae');
  // ceiling lamp
  drawLamp((a + b) / 2, top + 4, !HS.dark[id + i], t);
}
function drawDivider(x, f, H) {
  const fy = H.floors[f], top = roomTop(H, f), dt = fy - 236;
  ctx.fillStyle = grad(x - 16, 0, 32, 0, [[0, '#f2c1e0'], [.5, '#ffe6f4'], [1, '#d99ac4']]);
  ctx.beginPath(); ctx.moveTo(x - 16, top); ctx.lineTo(x + 16, top); ctx.lineTo(x + 16, fy); ctx.lineTo(x + 10, fy); ctx.lineTo(x + 10, dt + 20); ctx.quadraticCurveTo(x, dt - 4, x - 10, dt + 20); ctx.lineTo(x - 10, fy); ctx.lineTo(x - 16, fy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e9a93a'; ctx.lineWidth = 3; ctx.stroke();
}
function drawStaircase(H, s, t) {
  const { bot, top } = stairEnds(s, H), n = 14, dir = Math.sign(top[0] - bot[0]);
  if (!vis(Math.min(bot[0], top[0]) - 40, Math.max(bot[0], top[0]) + 40)) return;
  const run = (top[0] - bot[0]) / n, rise = (bot[1] - top[1]) / n;
  // stringer (the side of the stairs) with a soft shadow
  ctx.beginPath(); ctx.moveTo(bot[0] - dir * 20, bot[1]); ctx.lineTo(top[0], top[1]); ctx.lineTo(top[0], top[1] + 46); ctx.lineTo(bot[0] + dir * 50, bot[1]); ctx.closePath();
  ctx.fillStyle = grad(0, top[1], 0, bot[1] - top[1], [[0, '#d48a4a'], [1, '#b06a32']]); ctx.fill();
  for (let i = 0; i < n; i++) {
    const x = bot[0] + run * i, y = bot[1] - rise * (i + 1), x2 = x + run;
    ctx.beginPath(); ctx.moveTo(x - dir * 20, y + rise); ctx.lineTo(x - dir * 20, y); ctx.lineTo(x2, y); ctx.lineTo(x2, y + rise); ctx.closePath();
    ctx.fillStyle = i % 2 ? '#f0b070' : '#e8a464'; ctx.fill();
    ctx.fillStyle = '#ff6fae'; ctx.fillRect(Math.min(x, x2) + 6, y, Math.abs(run) - 6, 5); // carpet runner
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.min(x - dir * 20, x2), y, Math.abs(run) + 20, 2);
  }
  // banister with balusters
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  for (let i = 0; i <= n; i += 2) { const x = bot[0] + run * i, y = bot[1] - rise * i; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 88); ctx.stroke(); }
  ctx.strokeStyle = '#c8722e'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bot[0], bot[1] - 92); ctx.lineTo(top[0], top[1] - 92); ctx.stroke(); ctx.lineCap = 'butt';
  for (const [x, y] of [bot, top]) { rounded(x - 7, y - 110, 14, 110, 5, '#d48a4a', '#fff', 2); ellipse(x, y - 114, 10, 10, '#ffc75a', '#fff', 2); }
  // picture-only sign: footprints + arrow
  ellipse(bot[0] + dir * 30, bot[1] - 130, 22, 22, 'rgba(255,255,255,.9)', '#ffc531', 3);
  ctx.beginPath(); ctx.moveTo(bot[0] + dir * 30 - 9 * dir, bot[1] - 122); ctx.lineTo(bot[0] + dir * 30 + 9 * dir, bot[1] - 140); ctx.lineTo(bot[0] + dir * 30 + 9 * dir, bot[1] - 126); ctx.strokeStyle = '#ff4f9a'; ctx.lineWidth = 4; ctx.stroke();
}
function drawSlabs(H, t) {
  H.floors.forEach((fy, i) => {
    if (!visY(fy - 10, fy + SLAB + 60)) return;
    rounded(H.ox, fy, H.w, SLAB, 0, grad(0, fy, 0, SLAB, [[0, '#e6a25c'], [1, '#a8642c']]));
    ctx.fillStyle = '#ffd08a'; ctx.fillRect(H.ox, fy, H.w, 4);
    ctx.fillStyle = 'rgba(120,60,20,.25)'; for (let x = H.ox + 40; x < H.ox + H.w; x += 120) ctx.fillRect(x, fy + 4, 2, SLAB - 4);
    if (i === 0) { rounded(H.ox - 40, fy + SLAB, H.w + 80, 120, 0, grad(0, fy + SLAB, 0, 120, [[0, '#a07ad0'], [1, '#6a4aa0']])); for (let x = H.ox; x < H.ox + H.w; x += 90) rounded(x, fy + SLAB + 18, 80, 34, 8, 'rgba(255,255,255,.12)'); }
    else ctx.fillStyle = 'rgba(80,30,80,.18)', ctx.fillRect(H.ox, fy + SLAB, H.w, 10); // shadow on the ceiling below
  });
  // roof + sky above, outer walls
  if (visY(H.roof - 300, H.roof)) {
    ctx.fillStyle = grad(0, H.roof - 300, 0, 300, [[0, '#7fb6ff'], [1, '#ffd1ec']]); ctx.fillRect(H.ox - 200, H.roof - 400, H.w + 400, 400);
    ctx.beginPath(); ctx.moveTo(H.ox - 60, H.roof + 4); ctx.lineTo(H.ox + H.w / 2, H.roof - 240); ctx.lineTo(H.ox + H.w + 60, H.roof + 4); ctx.closePath(); ctx.fillStyle = '#a15cff'; ctx.fill(); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 6; ctx.stroke();
    for (let y = H.roof - 30; y > H.roof - 230; y -= 34) { const k = (H.roof - y) / 240, hw = H.w / 2 + 60 - k * (H.w / 2 + 60); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(H.ox + H.w / 2 - hw, y); ctx.lineTo(H.ox + H.w / 2 + hw, y); ctx.stroke(); }
    rounded(H.ox, H.roof - SLAB, H.w, SLAB, 0, grad(0, H.roof - SLAB, 0, SLAB, [[0, '#c98ae8'], [1, '#8a4fc4']]));
  }
  for (const x of [H.ox, H.ox + H.w - 30]) { rounded(x, H.roof - SLAB, 30, GROUND + SLAB - H.roof + SLAB, 0, grad(x, 0, 30, 0, [[0, '#d99ac4'], [.5, '#ffd1ec'], [1, '#d99ac4']])); ctx.strokeStyle = '#e9a93a'; ctx.lineWidth = 3; ctx.strokeRect(x, H.roof - SLAB, 30, GROUND + 2 * SLAB - H.roof); }
}
function drawFrontDoorInside(H, t) {
  const x = H.exit, y = GROUND;
  if (!vis(x - 80, x + 80)) return;
  rounded(x - 62, y - 244, 124, 244, 50, '#fff', '#e9a93a', 4);
  rounded(x - 52, y - 232, 104, 232, 44, grad(0, y - 232, 0, 232, [[0, '#c26ae8'], [1, '#8a3fc4']]), '#ffd36b', 4);
  ellipse(x, y - 180, 26, 26, '#bff0ff', '#ffd36b', 3); ellipse(x + 34, y - 112, 6, 6, '#ffd36b');
  star(x, y - 180, 9, '#fff6b0');
  rounded(x - 70, y - 10, 140, 12, 6, '#ff9fd2'); // welcome mat
  glow(x, y - 120, 90, '#fff3c4', .18 + Math.sin(t * 3) * .06);
}
// --- Peekaboo House furniture ---
function drawPeekFurniture(t) {
  const H = HOUSES.peek;
  // FRONT HALL: coat pegs, chandelier, under-stairs cupboard
  if (vis(20220, 20800) && visY(140, 450)) {
    rounded(20250, 230, 90, 12, 6, '#c8722e'); [20265, 20295, 20325].forEach((x, i) => { ellipse(x, 246, 5, 5, '#ffd36b'); if (i !== 1) rounded(x - 14, 250, 28, 60, 12, ['#7fd8ff', '#ff9fd2', '#ffd45e'][i], '#fff', 2); });
    rounded(20232, 360, 30, 90, 8, '#5fd0c0', '#fff', 2); // umbrella stand
    const sw = Math.sin(t * 8) * HS.chand * .12;
    ctx.save(); ctx.translate(20600, 140); ctx.rotate(sw);
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.stroke();
    ellipse(0, 54, 34, 12, '#ffd36b', '#fff', 2); for (let i = 0; i < 5; i++) { const x = -28 + i * 14; ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 58); ctx.lineTo(x, 78 + (i % 2) * 8); ctx.stroke(); ellipse(x, 82 + (i % 2) * 8, 4, 6, '#e6f8ff', '#fff', 1.5); }
    for (const x of [-26, 0, 26]) bulb(x, 44, true, '#fff3a6', .7);
    ctx.restore(); if (HS.chand > 0) sparkle(20600 + Math.sin(t * 9) * 30, 210, 5, '#fff');
    // the cupboard under the stairs
    rounded(20675, 300, 90, 150, 14, grad(0, 300, 0, 150, [[0, '#ffb35c'], [1, '#d9862e']]), '#fff', 3); ellipse(20750, 380, 5, 5, '#fff3a6');
    if (HS.cup > 0) { const k = Math.min(1, HS.cup * 2, (2.4 - HS.cup) * 4); rounded(20675, 300, 90 * (1 - k * .8), 150, 14, '#c86a1e'); drawFluff(20725, 450 - 4, '#9fe6ff', t * 1.5, 7, 'party'); }
  }
  // LIVING ROOM: sofa, fireplace, piano, rug, the house critters
  if (vis(20900, 21560) && visY(140, 450)) {
    ellipse(21230, 450, 300, 14, '#ff9fd2'); ellipse(21230, 450, 240, 9, '#ffc4e2');
    drawFrame(21000, 196, 90, 70, (cx, cy) => { ellipse(cx, cy + 6, 30, 22, '#9fe6a8'); ellipse(cx + 18, cy - 18, 10, 10, '#ffd45e'); });
    // sofa (bouncy)
    const sq = PLATFORMS.find(z => z.a === 20950).drum.sq * 8;
    rounded(20940, 330 + sq, 220, 60, 26, grad(0, 330, 0, 60, [[0, '#b58cff'], [1, '#7d45d8']]), '#fff', 3);
    rounded(20930, 370 + sq * .6, 240, 66, 24, grad(0, 370, 0, 66, [[0, '#a15cff'], [1, '#6a32b8']]), '#fff', 3);
    for (const x of [20990, 21110]) rounded(x - 46, 378 + sq, 92, 22, 11, '#c9a6ff', '#fff', 2);
    rounded(20940, 436, 14, 14, 4, '#5b2f8a'); rounded(21146, 436, 14, 14, 4, '#5b2f8a');
    ellipse(20975, 362 + sq, 18, 14, '#ffd45e', '#fff', 2); // cushion
    // fireplace
    rounded(21180, 270, 160, 18, 6, '#fff', '#e9a93a', 3); rounded(21190, 288, 140, 162, 10, grad(0, 288, 0, 162, [[0, '#ff9fc0'], [1, '#e070a0']]), '#fff', 3);
    rounded(21215, 330, 90, 120, 40, '#4a2a5a');
    const fl = 1 + HS.fire * .6;
    for (let i = 0; i < 4; i++) { const x = 21235 + i * 17, h = (36 + Math.sin(t * 9 + i * 2) * 8) * fl; ctx.beginPath(); ctx.moveTo(x - 12, 448); ctx.quadraticCurveTo(x - 10, 448 - h * .6, x, 448 - h); ctx.quadraticCurveTo(x + 10, 448 - h * .6, x + 12, 448); ctx.fillStyle = ['#ff9a2e', '#ffc21c', '#ff6fae', '#ffd84a'][i]; ctx.fill(); }
    glow(21260, 410, 110 * fl, '#ffb35c', .35); rounded(21225, 438, 70, 10, 5, '#8a5a2a');
    [21205, 21315].forEach((x, i) => { rounded(x - 8, 244, 16, 26, 4, ['#9fe6ff', '#ffd45e'][i], '#fff', 2); });
    drawFrame(21230, 196, 60, 44, (cx, cy) => star(cx, cy, 14, '#ff6fae'));
    // upright piano
    rounded(PIANO.x - 10, PIANO.y - 110, PIANO.w + 20, 110, 12, grad(0, PIANO.y - 110, 0, 110, [[0, '#7a45b0'], [1, '#4a2280']]), '#ffd36b', 3);
    rounded(PIANO.x + 10, PIANO.y - 96, PIANO.w - 20, 50, 8, '#5b2f8a', '#ffd36b', 2); for (let i = 0; i < 3; i++) ctx.fillStyle = '#ffd36b', ctx.fillRect(PIANO.x + 30 + i * 40, PIANO.y - 80, 2, 20);
    for (let i = 0; i < PIANO.keys; i++) { const w = PIANO.w / PIANO.keys, lit = PIANO.lit[i] = Math.max(0, PIANO.lit[i] - 1 / 40); rounded(PIANO.x + i * w + 1, PIANO.y - 2 + lit * 3, w - 2, 30, 3, lit > 0 ? RAINBOW[i] : '#ffffff', '#5b2f8a', 1.5); }
    rounded(PIANO.x - 10, PIANO.y + 28, PIANO.w + 20, 86, 8, grad(0, PIANO.y + 28, 0, 86, [[0, '#6a35a0'], [1, '#4a2280']]), '#ffd36b', 2);
    rounded(PIANO.x + 30, 412, 90, 36, 10, '#ff9fd2', '#fff', 2); // stool
    // the critters who live here wander about
    for (const r of ROOMIES) {
      r.x += r.dir * 30 / 60; if (r.x < 20930 || r.x > 21540) r.dir *= -1;
      const c = RAINBOW[(r.i * 3) % 8], y = GROUND - Math.abs(Math.sin(t * 6 + r.i)) * 8;
      ellipse(r.x, GROUND, 14, 4, 'rgba(60,25,110,.18)');
      if (r.i % 2 === 0) { ellipse(r.x - 8, y - 38, 4, 10, c, '#fff', 1.5); ellipse(r.x + 8, y - 38, 4, 10, c, '#fff', 1.5); } else { ellipse(r.x - 11, y - 30, 6, 6, c, '#fff', 1.5); ellipse(r.x + 11, y - 30, 6, 6, c, '#fff', 1.5); }
      ellipse(r.x, y - 18, 16, 16, c, '#fff', 2); ellipse(r.x - 5 * -r.dir, y - 21, 2.6, 3.4, '#2a0f45'); ellipse(r.x + 5 * r.dir, y - 21, 2.6, 3.4, '#2a0f45');
      ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(r.x, y - 14, 4, .2, Math.PI - .2); ctx.stroke();
    }
  }
  // PLAYROOM: toy box, block tower, rocking horse, toy shelf, window
  if (vis(21560, 22170) && visY(140, 450)) {
    drawWindow(21640, 190, 150, 100, t, false);
    rounded(21940, 210, 180, 12, 5, '#ffb35c', '#fff', 2); [21960, 22010, 22060, 22100].forEach((x, i) => { if (i % 2) ellipse(x, 196, 13, 13, RAINBOW[i * 2], '#fff', 2); else rounded(x - 12, 186, 24, 24, 6, RAINBOW[i * 2 + 1], '#fff', 2); });
    // toy box
    rounded(21600, 392, 84, 58, 10, grad(0, 392, 0, 58, [[0, '#ff7ab8'], [1, '#d4569b']]), '#ffd36b', 3); star(21642, 420, 11, '#fff6b0');
    if (world.toyT > 0) { world.toyT -= 1 / 60; ctx.save(); ctx.translate(21642, 390); ctx.rotate(-.6); rounded(-42, -6, 84, 9, 4, '#ff9fd2', '#fff', 2); ctx.restore(); }
    else rounded(21596, 384, 92, 12, 6, '#ff9fd2', '#fff', 2);
    // block tower (tumbles when tapped, then stacks itself back up)
    const fall = HS.tower > 1.6 ? Math.min(1, (3 - HS.tower) * 2.5) : HS.tower > 0 ? HS.tower / 1.6 : 0;
    for (let i = 0; i < 6; i++) {
      const bx = 21800 + fall * (i - 2.5) * 34, by = 450 - 22 - i * 24 * (1 - fall) - (fall ? Math.abs(Math.sin(i)) * 4 : 0);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(fall * (i % 2 ? .6 : -.5)); rounded(-20, -11, 40, 22, 5, RAINBOW[i], '#fff', 2); ctx.restore();
    }
    // rocking horse
    const rock = Math.sin(t * 6) * Math.min(1, HS.horse) * .25;
    ctx.save(); ctx.translate(21985, 446); ctx.rotate(rock);
    ctx.beginPath(); ctx.arc(0, -150, 160, Math.PI * .36, Math.PI * .64); ctx.strokeStyle = '#c8722e'; ctx.lineWidth = 8; ctx.stroke();
    for (const x of [-34, 30]) rounded(x - 4, -40, 8, 34, 3, '#e9a93a');
    ellipse(0, -52, 46, 22, '#fff1b0', '#e9a93a', 3); rounded(26, -100, 22, 52, 10, '#fff1b0', '#e9a93a', 3); ellipse(48, -100, 22, 14, '#fff1b0', '#e9a93a', 3);
    ellipse(52, -104, 3, 3, '#2a0f45'); for (let i = 0; i < 4; i++) ellipse(22 - i * 2, -96 + i * 12, 7, 9, RAINBOW[i * 2]);
    ellipse(-48, -50, 10, 18, RAINBOW[6], null, 0, .6); rounded(-14, -78, 28, 12, 6, '#ff6fae', '#fff', 2);
    ctx.restore();
  }
  // LANDING (floor 2): cuckoo clock, window seat, family portraits
  if (vis(20030, 21250) && visY(-194, 116)) {
    rounded(20168, -96, 64, 96, 12, '#c8722e', '#fff', 3); ctx.beginPath(); ctx.moveTo(20160, -96); ctx.lineTo(20200, -128); ctx.lineTo(20240, -96); ctx.closePath(); ctx.fillStyle = '#a15cff'; ctx.fill();
    ellipse(20200, -56, 22, 22, '#fff', '#ffd36b', 3); ctx.strokeStyle = '#5b2f8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20200, -56); ctx.lineTo(20200 + Math.cos(t) * 14, -56 + Math.sin(t) * 14); ctx.moveTo(20200, -56); ctx.lineTo(20200 + Math.cos(t / 12) * 9, -56 + Math.sin(t / 12) * 9); ctx.stroke();
    const sw = Math.sin(t * 3) * 12; ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20200, 0); ctx.lineTo(20200 + sw, 40); ctx.stroke(); ellipse(20200 + sw, 46, 9, 9, '#ffd36b', '#fff', 2);
    if (HS.clock > 0) { const k = Math.min(1, HS.clock * 3); rounded(20188, -96, 24, 16, 4, '#4a2a5a'); ellipse(20200, -96 - k * 22, 10, 9, '#ffd45e', '#fff', 2); ctx.beginPath(); ctx.moveTo(20209, -98 - k * 22); ctx.lineTo(20220, -95 - k * 22); ctx.lineTo(20209, -92 - k * 22); ctx.fillStyle = '#ff9a2e'; ctx.fill(); }
    drawWindow(20320, -150, 170, 110, t, false); rounded(20300, 40, 210, 76, 18, grad(0, 40, 0, 76, [[0, '#ff9fd2'], [1, '#d4569b']]), '#fff', 3); [20350, 20460].forEach(x => ellipse(x, 40, 26, 14, '#fff1b0', '#fff', 2));
    [['#ff8fd0', 'pip'], ['#9fd8ff', 'zuzu'], ['#9ff7c8', 'jelly']].forEach(([c], i) => drawFrame(20620 + i * 90, -120, 64, 72, (cx, cy) => { ellipse(cx, cy + 6, 20, 20, c, '#fff', 2); ellipse(cx - 7, cy + 2, 3, 4, '#2a0f45'); ellipse(cx + 7, cy + 2, 3, 4, '#2a0f45'); ctx.strokeStyle = '#2a0f45'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy + 9, 5, .2, Math.PI - .2); ctx.stroke(); }));
  }
  // BEDROOM: bouncy bed, star-baby shelf, night light, teddy
  if (vis(21250, 21800) && visY(-194, 116)) {
    drawWindow(21330, -150, 120, 90, t, HS.night > 0);
    const sq = PLATFORMS.find(z => z.a === 21290).drum.sq * 8;
    rounded(21280, -10, 26, 126, 10, '#ff6fae', '#fff', 3); ellipse(21293, -12, 16, 16, '#ffd45e', '#fff', 2);   // headboard
    rounded(21284, 60 + sq, 202, 34, 12, '#a15cff', '#ffd36b', 3); rounded(21290, 46 + sq, 190, 22, 11, '#ffd1ec', '#fff', 2);
    ellipse(21318, 44 + sq, 22, 12, '#fff', '#ffd1ec', 2); rounded(21350, 50 + sq, 130, 24, 12, '#ffb35c', '#fff', 2); // pillow + duvet
    for (let x = 21362; x < 21470; x += 26) star(x, 62 + sq, 5, '#fff6b0');
    rounded(21290, 94, 10, 22, 3, '#5b2f8a'); rounded(21470, 94, 10, 22, 3, '#5b2f8a');
    rounded(21650, -4, 120, 12, 5, '#ffb35c', '#fff', 2); rounded(21700, 8, 8, 40, 3, '#d9962e'); // high shelf
    rounded(21535, 66, 50, 50, 8, '#ffd1ec', '#fff', 2); // bedside table + night light
    ellipse(21560, 50, 16, 18, HS.night > 0 ? '#fff3a6' : '#e6d6f6', '#ffd36b', 2); if (HS.night > 0) glow(21560, 50, 60, '#fff3a6', .6);
    const tb = HS.teddy > 0 ? Math.sin(t * 20) * 3 : 0;
    ellipse(21612, 96, 22, 20, '#d9a06a', '#a8662c', 2); ellipse(21612, 66 + tb, 18, 17, '#d9a06a', '#a8662c', 2); ellipse(21598, 52 + tb, 7, 7, '#d9a06a', '#a8662c', 2); ellipse(21626, 52 + tb, 7, 7, '#d9a06a', '#a8662c', 2);
    ellipse(21606, 64 + tb, 2.4, 2.8, '#2a0f45'); ellipse(21618, 64 + tb, 2.4, 2.8, '#2a0f45'); ellipse(21612, 72 + tb, 5, 3.5, '#f3d0a8'); ellipse(21612, 92, 8, 6, '#ff9fd2');
  }
  // BATHROOM: bubble bath, rubber duck, mirror
  if (vis(21800, 22170) && visY(-194, 116)) {
    rounded(22080, -130, 70, 90, 30, '#e6f8ff', '#ffd36b', 4); ellipse(22100, -100, 10, 18, 'rgba(255,255,255,.7)', null, 0, .4);
    rounded(21880, 40, 200, 64, 30, grad(0, 40, 0, 64, [[0, '#ffffff'], [1, '#cdeef8']]), '#9fd8ee', 3);
    for (let i = 0; i < 9; i++) ellipse(21900 + i * 22, 40 + Math.sin(t * 2 + i) * 3, 14, 11, 'rgba(255,255,255,.95)', '#bfe6f8', 1.5);
    rounded(21890, 104, 12, 12, 4, '#ffd36b'); rounded(22058, 104, 12, 12, 4, '#ffd36b'); rounded(21876, -6, 10, 46, 4, '#ffd36b'); ellipse(21880, -8, 12, 6, '#ffd36b');
    const dk = HS.duck > 0 ? Math.sin(t * 25) * 3 : 0;
    ellipse(22002, 26 + dk, 14, 11, '#ffd23f', '#e9a93a', 2); ellipse(22012, 14 + dk, 9, 8, '#ffd23f', '#e9a93a', 2); ellipse(22014, 12 + dk, 1.6, 1.6, '#2a0f45');
    ctx.beginPath(); ctx.moveTo(22020, 14 + dk); ctx.lineTo(22028, 17 + dk); ctx.lineTo(22020, 19 + dk); ctx.fillStyle = '#ff9a2e'; ctx.fill();
    for (const b of HS.tub) { ellipse(b.x, b.y, b.r, b.r, 'rgba(220,245,255,.35)', 'rgba(255,255,255,.85)', 2); ellipse(b.x - b.r * .35, b.y - b.r * .35, b.r * .25, b.r * .18, 'rgba(255,255,255,.9)'); }
    rounded(21830, 70, 30, 46, 8, '#9fe6ff', '#fff', 2); // towel
  }
  // ATTIC: telescope by the round window, treasure chest, music box, old trunk, bunting
  if (vis(20030, 22170) && visY(-528, -218)) {
    for (let x = 20200; x < 22100; x += 300) { ctx.fillStyle = 'rgba(160,100,40,.35)'; ctx.fillRect(x, -528, 16, 310); }
    bulbString(20100, -480, 22100, -480, 40, 26, t, true);
    ellipse(21000, -410, 66, 66, '#ffffff', '#e9a93a', 5);
    ctx.save(); ctx.beginPath(); ctx.arc(21000, -410, 58, 0, TAU); ctx.clip(); ctx.fillStyle = grad(0, -470, 0, 120, [[0, '#2a2470'], [1, '#7a5ac8']]); ctx.fillRect(20940, -470, 120, 120);
    for (let i = 0; i < 9; i++) sparkle(20950 + (i * 31) % 100, -460 + (i * 19) % 100, 2 + Math.sin(t * 4 + i) * 1.2, '#fff6b0');
    if (HS.scope > 0) { const k = 1 - HS.scope / 3; for (let j = 0; j < 3; j++) { const sx = 20950 + ((k * 3 + j * .33) % 1) * 140, sy = -455 + ((k * 3 + j * .33) % 1) * 70; star(sx, sy, 6, '#fff3a6'); ctx.strokeStyle = 'rgba(255,243,166,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 30, sy - 15); ctx.stroke(); } }
    ctx.restore(); ctx.strokeStyle = '#e9a93a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20942, -410); ctx.lineTo(21058, -410); ctx.moveTo(21000, -468); ctx.lineTo(21000, -352); ctx.stroke();
    ctx.strokeStyle = '#c8722e'; ctx.lineWidth = 4; for (const dx of [-24, 0, 24]) { ctx.beginPath(); ctx.moveTo(21000, -300); ctx.lineTo(21000 + dx, -220); ctx.stroke(); }
    ctx.save(); ctx.translate(21000, -300); ctx.rotate(-.6); rounded(-10, -12, 96, 24, 10, grad(0, -12, 0, 24, [[0, '#ffd36b'], [1, '#d9962e']]), '#fff', 2); rounded(80, -16, 16, 32, 6, '#a15cff', '#fff', 2); ctx.restore();
    // treasure chest
    const open = Math.min(1, HS.chest * 2);
    rounded(21345, -278, 110, 60, 10, grad(0, -278, 0, 60, [[0, '#c8722e'], [1, '#8a4a1a']]), '#ffd36b', 3); rounded(21392, -262, 16, 20, 4, '#ffd36b');
    if (open > 0) { glow(21400, -290, 90, '#fff3a6', .7 * open); for (let i = 0; i < 6; i++) ellipse(21360 + i * 16, -282, 8, 6, RAINBOW[i], '#fff', 1.5); }
    ctx.save(); ctx.translate(21345, -278); ctx.rotate(-open * .9); rounded(0, -34, 110, 34, 16, '#d9862e', '#ffd36b', 3); ctx.restore();
    // music box with a little dancer
    rounded(21665, -260, 70, 42, 8, '#ff9fd2', '#fff', 2); rounded(21660, -266, 80, 10, 5, '#ffd36b');
    ctx.save(); ctx.translate(21700, -268); ctx.scale(HS.music > 0 ? Math.cos(t * 6) : 1, 1); ellipse(0, -14, 10, 14, '#c9a6ff', '#fff', 2); ellipse(0, -32, 7, 7, '#ffe3cf', '#fff', 1.5); ctx.restore();
    if (HS.music > 0) for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; ctx.globalAlpha = 1 - k; text('♪', 21720 + k * 40 + i * 6, -300 - k * 70, 22, RAINBOW[i * 2], '#fff'); ctx.globalAlpha = 1; }
    // old trunk (step on it to reach the hidden star)
    rounded(21950, -278, 140, 60, 10, grad(0, -278, 0, 60, [[0, '#7fd8ff'], [1, '#3a9ad8']]), '#ffd36b', 3); for (const x of [21980, 22060]) rounded(x - 4, -278, 8, 60, 3, '#ffd36b');
    rounded(20160, -278, 120, 60, 18, '#ffd1ec', '#fff', 2); rounded(20180, -300, 80, 30, 14, '#fff1b0', '#fff', 2); // a cosy cushion nook
  }
}
// --- Fluffkin House furniture ---
function drawFluffFurniture(t) {
  const fam = FLUFF_FAMILY();
  // FRONT HALL
  if (vis(23030, 23620) && visY(140, 450)) {
    rounded(23250, 230, 70, 12, 6, '#c8722e'); [23265, 23305].forEach((x, i) => { ellipse(x, 246, 5, 5, '#ffd36b'); rounded(x - 12, 250, 24, 50, 10, ['#ff9fd2', '#9fe6ff'][i], '#fff', 2); });
    drawWindow(23460, 190, 110, 90, t, false);
  }
  // FAMILY ROOM: cushion pile, family photo wall, drum, the rescued Fluffkins playing
  if (vis(23620, 24670) && visY(140, 450)) {
    ellipse(24150, 450, 420, 14, '#ffd45e'); ellipse(24150, 450, 340, 9, '#fff1b0');
    const sq = PLATFORMS.find(z => z.a === 23700).drum.sq * 8;
    [[23730, '#ff9fd2'], [23800, '#9fe6ff'], [23870, '#c9a6ff'], [23765, '#ffd45e'], [23835, '#9ff7c8']].forEach(([x, c], i) => ellipse(x, (i < 3 ? 424 : 396) + sq, 44, 26, c, '#fff', 2.5));
    // family photo wall: a picture fills in for every Fluffkin who is home
    fam.forEach((f, i) => drawFrame(24170 + (i % 3) * 120, 190 + Math.floor(i / 3) * 100, 80, 70, (cx, cy) => {
      if (f.state === 'home') { ellipse(cx, cy, 34, 30, shade(f.c, .6)); drawFluff(cx, cy + 26, f.c, 0, i, 'home'); }
      else { ctx.globalAlpha = .35; drawFluff(cx, cy + 26, '#b8a8d0', 0, i, 'home'); ctx.globalAlpha = 1; }
    }));
    // toy drum
    const db = HS.fdrum > 0 ? Math.sin(t * 30) * 2 : 0;
    rounded(24005, 392 + db, 90, 58, 12, grad(0, 392, 0, 58, [[0, '#ff6fae'], [1, '#c8407e']]), '#ffd36b', 3); ellipse(24050, 392 + db, 45, 10, '#fff8ea', '#ffd36b', 3);
    for (let x = 24015; x < 24095; x += 18) { ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 400); ctx.lineTo(x + 9, 444); ctx.stroke(); }
    // rescued Fluffkins play here (every other one; the rest are upstairs in bed)
    fam.forEach((f, i) => {
      if (f.state !== 'home' || i % 2) return;
      const x = 23960 + ((i * 140 + Math.sin(t * .6 + i) * 120) % 640), jump = HS.fdrum > 0 ? Math.abs(Math.sin(t * 8 + i)) * 50 : 0;
      drawFluff(x, GROUND - 4 - jump, f.c, t * 1.3, i, world.partyT > 0 || HS.fdrum > 0 ? 'party' : 'home');
    });
  }
  // LANDING
  if (vis(23030, 23920) && visY(-194, 116)) {
    drawWindow(23180, -150, 150, 100, t, false);
    rounded(23440, 30, 120, 86, 14, '#9fe6ff', '#fff', 3); rounded(23450, 40, 100, 30, 10, '#ffd1ec'); // toy cupboard
    for (let i = 0; i < 4; i++) ellipse(23460 + i * 26, 20, 10, 10, RAINBOW[i * 2], '#fff', 2);
  }
  // NURSERY: six little beds, one for each Fluffkin; a spinning mobile; the night sky window
  if (vis(23920, 24670) && visY(-194, 116)) {
    drawWindow(24540, -150, 100, 80, t, true);
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(24290, -194); ctx.lineTo(24290, -140); ctx.stroke();
    const spin = t * (HS.mobile > 0 ? 3 : .4);
    rounded(24230, -142, 120, 6, 3, '#ffd36b');
    for (let i = 0; i < 5; i++) { const x = 24290 + Math.cos(spin + i * 1.26) * 56, z = Math.sin(spin + i * 1.26); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, -140); ctx.lineTo(x, -104); ctx.stroke(); if (i % 2) star(x, -96, 10 + z * 2, RAINBOW[i]); else { ctx.beginPath(); heartPath(x, -96, 10 + z * 2); ctx.fillStyle = RAINBOW[i]; ctx.fill(); } }
    fam.forEach((f, j) => {
      const x = bedX(j), home = f.state === 'home', wake = HS.wake[j], sleeping = home && j % 2 && !wake;
      rounded(x - 46, 50, 12, 66, 5, '#ffb35c', '#fff', 2); rounded(x + 34, 70, 12, 46, 5, '#ffb35c', '#fff', 2);
      rounded(x - 46, 82, 92, 26, 8, '#fff8ea', '#ffb35c', 2);
      ellipse(x - 26, 78, 14, 8, '#fff', '#ffd1ec', 1.5);
      if (home && (j % 2 || wake)) drawFluff(x - 4, 84 - (wake ? Math.abs(Math.sin(t * 9 + j)) * 46 : 0), f.c, sleeping ? 0 : t * 1.4, j, sleeping ? 'home' : 'party');
      rounded(x - 34, 84, 80, 24, 8, shade(f.c, .25), '#fff', 2); for (let k = 0; k < 3; k++) star(x - 16 + k * 22, 96, 4, '#fff');
      if (sleeping) for (let k = 0; k < 2; k++) { const q = (t * .5 + k * .5) % 1; ctx.globalAlpha = 1 - q; text('z', x + 10 + q * 20, 50 - q * 40, 16 + k * 4, '#fff', '#8a5ad0'); ctx.globalAlpha = 1; }
      if (!home) { ctx.beginPath(); heartPath(x - 4, 70, 12); ctx.strokeStyle = 'rgba(160,100,200,.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
    });
  }
}
function drawHouseDark(id, H, t) {
  H.rooms.forEach((r, i) => {
    const dark = HS.dark[id + i] || (id === 'peek' && i === 4 && HS.night > 0); if (!dark) return;
    const [a, b, f] = r, fy = H.floors[f], top = roomTop(H, f); if (!vis(a, b)) return;
    ctx.fillStyle = 'rgba(30,20,80,.5)'; ctx.fillRect(a, top, b - a, fy - top);
    for (let k = 0; k < 14; k++) sparkle(a + ((k * 97) % (b - a)), top + 20 + ((k * 53) % 120), 3 + Math.sin(t * 3 + k) * 1.5, '#fff6b0');
  });
}
function renderHouse(t) {
  const id = player.inside, H = HOUSES[id];
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = grad(0, 0, 0, VH, [[0, '#8fc3ff'], [1, '#ffd9ee']]); ctx.fillRect(0, 0, vw, VH);
  ctx.save(); ctx.translate(-camera, -camY);
  H.rooms.forEach((r, i) => drawRoom(id, H, r, i, t));
  for (const s of H.stairs) drawStaircase(H, s, t);
  drawFrontDoorInside(H, t);
  if (id === 'peek') drawPeekFurniture(t); else drawFluffFurniture(t);
  // doorways between rooms
  H.rooms.forEach((r, i) => { const nx = H.rooms[i + 1]; if (nx && nx[2] === r[2] && vis(r[1] - 20, r[1] + 20)) drawDivider(r[1], r[2], H); });
  drawHouseDark(id, H, t);
  drawSlabs(H, t);
  secretStars(t); drawWaiting(t);
  drawPlayer(t);
  drawBigFront(t); drawPetFollower(t); drawBalloon(t); drawDoorBubble(t);
  drawParticles();
  if (started) drawHintHand(t);
  ctx.restore();
  if (world.doorFlash > 0) { world.doorFlash -= 1 / 60; ctx.fillStyle = `rgba(255,250,235,${world.doorFlash * 1.6})`; ctx.fillRect(0, 0, vw, VH); }
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grad(0, 0, vw * .6, VH, [[0, 'rgba(255,236,200,.5)'], [.55, 'rgba(128,128,128,0)'], [1, 'rgba(70,20,110,.32)']]); ctx.fillRect(0, 0, vw, VH);
  ctx.restore();
}
