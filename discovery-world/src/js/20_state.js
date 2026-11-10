// ===================================================================
// 20_state.js — player, world state, layout, save/restore (with v1 migration)
// ===================================================================
const player = {
  x: 350, y: GROUND, vx: 0, vy: 0, grounded: true, jumps: 0, facing: 1, creature: 'pip',
  ride: null, launched: false, padTime: 0, anim: makeAnim(),
};

// Physical layout of the ONE continuous world (x grows left → right)
//  Mega Playhouse 0–1300 · Imagination Studio 1300–2380 · Wonder Lab 2380–3500 · Adventure Park 3500–6300
const LAYOUT = {
  pit: { a: 120, b: 610 },
  tramp: { a: 655, b: 815, y: 432, cx: 735 },
  wall: { x1: 1415, x2: 1944, y1: 135, y2: 367 },        // paintable area (unchanged from v1 so old paintings line up)
  mixer: { x: 2040, w: 300, top: 320, bowl: [2190, 292], spinner: [2190, 395] },
  buckets: { r: [2112, 196], y: [2190, 188], b: [2268, 196] },
  bubbler: { x: 2400, w: 240, top: 290, nozzle: [2606, 262], tank: [2414, 300, 50, 128] },
  engine: { x: 2720, w: 360, top: 300, funnel: [2790, 160], lever: [3046, 398], gear: [2985, 352] },
  magnet: { x: 3160, w: 300, c: [3310, 280] },
  launcher: { a: 3570, b: 3680, y: 420, cx: 3625 },
  wheel: { cx: 4060, cy: 262, r: 137 },
  coaster: { a: 4440, b: 5300 },
  carousel: { cx: 5700, r: 165 },
  tube: { y: 92, door: [6100, 6190], drop: 300, x: 6145 },
};
// Everything you can finger-paint on (the big wall + easels out in the park)
const PAINT_SURFACES = [
  { x1: 1415, x2: 1944, y1: 135, y2: 367 },   // the giant paint wall
  { x1: 4214, x2: 4322, y1: 230, y2: 334 },   // easel beside the Ferris wheel
  { x1: 5906, x2: 6056, y1: 214, y2: 336 },   // easel beside the carousel
];
const ROPE_BRIDGE = { a: 3080, b: 3172, y: 302 }; // Wonder Engine walkway → magnet deck
const PIPE = [[2340, 410], [2368, 410], [2368, 232], [2440, 232], [2440, 300]]; // mixer → bubble tank
const PLATFORMS = [
  { a: 675, b: 865, y: 355 }, { a: 870, b: 975, y: 319 }, { a: 1140, b: 1270, y: 376 },
  { a: 690, b: 1396, y: 213 },              // high route: tower beam → sky bridge → lookout
  { a: 1760, b: 1900, y: 344 },
  { a: 2400, b: 2640, y: 290 },             // bubble machine roof
  { a: 2720, b: 3080, y: 300 },             // Wonder Engine walkway (secret star)
  { a: 3080, b: 3172, y: 302 },             // rope bridge
  { a: 3170, b: 3460, y: 332 },             // magnet base
  { a: 3570, b: 3680, y: 420, step: true }, // launch pad
  { a: 3925, b: 4195, y: 410, step: true }, // Ferris wheel boarding deck
  { a: 4380, b: 4475, y: 396, step: true }, // coaster station
];
const SECRET_STARS = [
  { id: 'star1', x: 930, y: 250 }, { id: 'star2', x: 2560, y: 196 }, { id: 'star3', x: 3052, y: 246 },
  { id: 'star4', x: 4060, y: 92 }, { id: 'star5', x: 3000, y: 92 }, { id: 'star6', x: 4870, y: 138 },
  { id: 'star7', x: 1352, y: 142 },          // on the lookout at the end of the sky bridge
];

const world = {
  strokes: [], discoveries: new Set(), stars: new Set(),
  portions: [], lastMix: null, stir: 0, bucketTilt: { r: 0, y: 0, b: 0 }, pours: [], pipeBlobs: [],
  tank: { amount: 0, color: null },
  bubbles: [], battery: [],
  labOn: false, magnetOn: false, powered: false, powerT: 0,
  gearAngle: 0, gearSpeed: 0, wheelAngle: 0, coasterU: 0, coasterDir: 1,
  tramp: { x: 0, v: 0 }, pitJiggle: 0, funnelWiggle: 0, leverWiggle: 0, spinnerWiggle: 0, sleepyT: 0,
  wheelSpin: 0, mixSpin: 0, carRot: 0, musicT: 0, stickers: [], paintN: 0, stickerJig: 0, zipWiggle: 0,
};
const BALL_DEFAULTS = [
  [270, 375, 23, '#ff68bd'], [350, 400, 26, '#6bdcff'], [407, 375, 20, '#ffcf52'], [505, 406, 29, '#b17aff'],
  [1640, 421, 22, '#55dda0'], [2180, 420, 20, '#ff9f5a'], [3200, 420, 18, '#c9d6ee', true], [3420, 420, 20, '#c9d6ee', true], [3500, 420, 17, '#c9d6ee', true],
  [4700, 420, 24, '#ffbd40'],
];
const balls = BALL_DEFAULTS.map(([x, y, r, c, metal]) => ({ x, y, r, c, vx: 0, vy: 0, metal: !!metal }));

// ---------------- save / restore ----------------
const STORE = 'dawsons-discovery-world-v2', STORE_V1 = 'dawsons-discovery-world-v1';
function snapshot() {
  return {
    v: 2, x: Math.round(player.x), creature: player.creature, soundOn: Sound.on,
    strokes: world.strokes.slice(-140).map(({ born, ...s }) => s), stickers: world.stickers, discoveries: [...world.discoveries], stars: [...world.stars],
    portions: world.portions, lastMix: world.lastMix, tank: world.tank, battery: world.battery,
    labOn: world.labOn, magnetOn: world.magnetOn, powered: world.powered,
  };
}
let saveFailed = false;
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(snapshot())); saveFailed = false; }
  catch (e) { saveFailed = true; }
}
function cleanStrokes(arr) {
  const out = [];
  if (!Array.isArray(arr)) return out;
  for (const s of arr.slice(-140)) {
    if (!s || !Array.isArray(s.points) || typeof s.color !== 'string') continue;
    const color = isHex(s.color) ? s.color : '#fb5aaf';
    const si = Number.isInteger(s.s) && s.s >= 0 && s.s < PAINT_SURFACES.length ? s.s : 0, R = PAINT_SURFACES[si];
    const pts = s.points.filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map(p => [clamp(Math.round(p[0]), R.x1, R.x2), clamp(Math.round(p[1]), R.y1, R.y2)]).slice(0, 500);
    const drips = Array.isArray(s.drips) ? s.drips.filter(d => Array.isArray(d) && d.length === 3 && d.every(Number.isFinite)).slice(0, 4).map(([x, y, l]) => [clamp(x, R.x1, R.x2), clamp(y, R.y1, R.y2), clamp(l, 0, 30)]) : undefined;
    if (pts.length) out.push({ color, points: pts, w: Number.isFinite(s.w) ? clamp(s.w, 8, 30) : 16, s: si, n: Number.isFinite(s.n) ? s.n : 0, drips });
  }
  return out;
}
function restore() {
  let d = null, migrated = false;
  try { d = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { d = null; }
  if (!d || typeof d !== 'object') {
    try { d = JSON.parse(localStorage.getItem(STORE_V1) || 'null'); migrated = !!d; } catch (e) { d = null; }
  }
  if (!d || typeof d !== 'object') return { restored: false };
  try {
    player.x = clamp(Number(d.x) || 350, 90, WORLD_W - 260);
    player.creature = Object.hasOwn(CREATURES, d.creature) ? d.creature : 'pip';
    world.strokes = cleanStrokes(d.strokes);
    if (Array.isArray(d.discoveries)) d.discoveries.slice(0, 200).forEach(v => world.discoveries.add(String(v).slice(0, 40)));
    if (Array.isArray(d.stars)) d.stars.forEach(v => { if (SECRET_STARS.some(s => s.id === v)) world.stars.add(v); });
    if (Array.isArray(d.portions)) world.portions = d.portions.filter(p => p === 'r' || p === 'y' || p === 'b').slice(0, 4);
    world.lastMix = isHex(d.lastMix) ? d.lastMix : null;
    if (Array.isArray(d.stickers)) world.stickers = d.stickers.filter(k => k && STICKERS.includes(k.k) && Number.isInteger(k.s) && PAINT_SURFACES[k.s] && Number.isFinite(k.x) && Number.isFinite(k.y))
      .slice(-80).map(k => { const R = PAINT_SURFACES[k.s]; return { s: k.s, k: k.k, x: clamp(k.x, R.x1, R.x2), y: clamp(k.y, R.y1, R.y2), r: Number.isFinite(k.r) ? clamp(k.r, -1, 1) : 0, n: Number.isFinite(k.n) ? k.n : 0 }; });
    world.paintN = Math.max(0, ...world.strokes.map(s => s.n || 0), ...world.stickers.map(k => k.n || 0));
    if (d.tank && typeof d.tank === 'object') world.tank = { amount: clamp(Math.round(Number(d.tank.amount) || 0), 0, 8), color: isHex(d.tank.color) ? d.tank.color : null };
    if (!world.tank.color) world.tank.amount = 0;
    if (Array.isArray(d.battery)) world.battery = d.battery.filter(isHex).slice(0, 6);
    world.labOn = !!d.labOn; world.magnetOn = !!d.magnetOn;
    world.powered = !!d.powered && world.labOn && world.battery.length >= 6;
    if (typeof d.soundOn === 'boolean') Sound.on = d.soundOn;
  } catch (e) { /* corrupt fields fall back to defaults above */ }
  return { restored: true, migrated };
}
