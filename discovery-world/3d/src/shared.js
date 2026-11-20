// ===================================================================
// shared.js (build 56): the small rules of PLAY TOGETHER's shared world.
//
// Plain functions only: no page, no network, no Three.js. The Firebase transport, the test relay and the game side all
// follow the same limits from here, and tests/shared.test.mjs can check them without a browser.
//
// A room holds what the devices in it put into the WORLD (not just where the players are):
//   objects: something someone made (a Block Builder block, a batch of paint lines on the big wall, a cleared wall),
//   events:  a short moment (a wave), shown to the others for a couple of seconds,
//   players: where everyone is (see multiplayer.js).
// Everything is small and validated, so a room can never become a place for text or chat.
// ===================================================================
export const LIMITS = {
  blockCells: 200,   // a 10 x 5 Block Builder wall, with room to spare
  blockTypes: 11,    // BLOCKS.length in meadow.js (0..10); -1 means "erased"
  strokes: 60,       // paint batches kept in one room at once (the oldest is dropped first)
  segments: 24,      // lines inside one paint batch
  events: 40,        // moments kept (a wave is removed again after half a minute)
  pets: 5,           // the Pet Workshop's own limit
  remotePets: 2,     // a friend's pets drawn on your device (keeps phones smooth)
};

export const LETTERS = 'ABCDEFGHJKMN'; // (one letter per animal: the room code and the database key)
export const MAX_PLAYERS = 4;

export const isCode = code => typeof code === 'string' && /^[ABCDEFGHJKMN]{4}$/.test(code);
export const codeFromPics = idx => idx.map(i => LETTERS[i] || LETTERS[0]).join('');
export const picsFromCode = code => [...String(code)].map(ch => LETTERS.indexOf(ch));

const int = (v, lo, hi, dflt = lo) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt; };
const num = (v, lo, hi, dflt = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt; };

// A pet's recipe: the four pictures the Pet Workshop uses (colour, ears, tail, pattern).
export const petRecipe = rec => ({
  col: int(rec && rec.col, 0, 6),
  ears: int(rec && rec.ears, 0, 3),
  tail: int(rec && rec.tail, 0, 2),
  pat: int(rec && rec.pat, 0, 2),
});
export const petKey = rec => { const r = petRecipe(rec); return `${r.col}${r.ears}${r.tail}${r.pat}`; };
export const recipeFromKey = key => /^[0-6][0-3][0-2][0-2]$/.test(String(key)) ? petRecipe({ col: +key[0], ears: +key[1], tail: +key[2], pat: +key[3] }) : null;

// A colour we accept back from another device: a plain hex colour, the rainbow brush's hue, or the eraser.
export const paintColour = c => typeof c === 'string' && (/^#[0-9a-f]{6}$/i.test(c) || /^hsl\(\d{1,3},90%,60%\)$/i.test(c) || c === 'erase') ? c.toLowerCase() : '#ff4f9a';

// One line drawn on the big paint wall: from a to b in wall coordinates (0..1, exactly as the painting code uses them).
export function paintSegment(a, b, c, w) {
  if (!a || !b) return null;
  return {
    a: [num(a[0] ?? a.x, 0, 1), num(a[1] ?? a.y, 0, 1)],
    b: [num(b[0] ?? b.x, 0, 1), num(b[1] ?? b.y, 0, 1)],
    c: paintColour(c),
    w: int(w, 4, 60, 26),
  };
}

// Painting sends a batch of lines every third of a second (or when 20 are waiting), not one network write per move.
export function makePaintBatch(send, opts = {}) {
  const every = opts.every ?? 320, max = opts.max ?? LIMITS.segments;
  let segs = [], last = -1;
  const batch = {
    add(seg, now = 0) {
      const s = paintSegment(seg && seg.a, seg && seg.b, seg && seg.c, seg && seg.w);
      if (!s) return null;
      if (last < 0) last = now;
      segs.push(s);
      if (segs.length >= max || now - last >= every) batch.flush(now);
      return s;
    },
    flush(now = 0) {
      if (!segs.length) return null;
      const out = segs; segs = []; last = now;
      send(out);
      return out;
    },
    pending: () => segs.length,
  };
  return batch;
}

// What arrives from the database is never trusted: only these three small shapes are shown in the world.
export function sanitizeObject(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw.t;
  if (t === 'b') {
    const i = Number(raw.i), v = Number(raw.v);
    if (!Number.isInteger(i) || i < 0 || i >= LIMITS.blockCells) return null;
    if (!Number.isInteger(v) || v < -1 || v >= LIMITS.blockTypes) return null;
    return { t: 'b', i, v };
  }
  if (t === 's') {
    const segs = Array.isArray(raw.segs) ? raw.segs.slice(-LIMITS.segments).map(s => paintSegment(s && s.a, s && s.b, s && s.c, s && s.w)).filter(Boolean) : [];
    return segs.length ? { t: 's', segs } : null;
  }
  if (t === 'x') return { t: 'x' };
  return null;
}

// A wave: the only moment a room shares. Nothing else (and never any text) can arrive through this door.
// (build 106) ...and a magic bubble blown at a friend: who blew it and at whom (a player id, or '' for nobody).
export function sanitizeEvent(raw) {
  if (!raw || typeof raw !== 'object' || (raw.t !== 'wave' && raw.t !== 'bubble')) return null;
  const e = { t: raw.t, by: typeof raw.by === 'string' ? raw.by.slice(0, 60) : '', at: Number(raw.at) || 0 };
  if (raw.t === 'bubble') e.to = typeof raw.to === 'string' ? raw.to.slice(0, 60) : '';
  return e;
}
