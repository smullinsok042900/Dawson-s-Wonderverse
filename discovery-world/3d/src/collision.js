// ===================================================================
// collision.js (build 75): the player's collision system.
//
// What was wrong before this: the game moved the player along x only and tested a short list of x-INTERVALS
// ({a, b, top}) that almost nothing registered. Houses, trees, rocks, the carousel and the Ferris wheel had no entry at
// all, so the player walked straight through them. There was also no depth: an interval blocked the player at every z.
//
// This module is a small, fast, testable box collider:
//  - boxes have a real x range, z range, top and bottom, and a layer (so the underground, the planets and the house do
//    not collide with the main world);
//  - boxes are bucketed into 12 m columns, so a test only looks at the few boxes the player can touch;
//  - movement is resolved against the boxes it would cross, stopping at the face, and reporting a hit so the game can
//    auto-hop onto low obstacles (the old behaviour) or stop;
//  - the player is a vertical cylinder (radius, height), so jumping over a low box and walking under a high one both
//    work correctly.
// Everything here is pure maths with no Three.js, so tests/collision.test.mjs can measure it directly.
// ===================================================================

export const PLAYER_R = 0.36;      // half the player's width
export const PLAYER_H = 1.55;      // the player's height, for ducking under things

export function makeCollision() {
  const boxes = [];
  const cells = new Map(); // x column → boxes, for fast lookup
  const CELL = 12;

  const key = x => Math.floor(x / CELL);
  const bucket = k => { let a = cells.get(k); if (!a) cells.set(k, a = []); return a; };

  function add(c) {
    const b = {
      x0: Math.min(c.x0, c.x1), x1: Math.max(c.x0, c.x1),
      z0: Math.min(c.z0 ?? -0.9, c.z1 ?? 0.9), z1: Math.max(c.z0 ?? -0.9, c.z1 ?? 0.9),
      top: c.top ?? 2, bottom: c.bottom ?? 0, layer: c.layer ?? '', tag: c.tag || '',
    };
    boxes.push(b);
    for (let k = key(b.x0); k <= key(b.x1); k++) bucket(k).push(b);
    return b;
  }

  /** remove every box with this tag (used when a streamed area is unloaded) */
  function removeTag(tag) {
    for (let i = boxes.length - 1; i >= 0; i--) if (boxes[i].tag === tag) boxes.splice(i, 1);
    for (const [k, a] of cells) { const keep = a.filter(b => b.tag !== tag); if (keep.length) cells.set(k, keep); else cells.delete(k); }
  }

  const near = x => cells.get(key(x)) || [];

  /** the box the player is overlapping right now, if any */
  function overlap(x, z, y, r = PLAYER_R, h = PLAYER_H, layer = '') {
    for (const b of near(x)) {
      if (b.layer !== layer) continue;
      if (z + r <= b.z0 || z - r >= b.z1) continue;
      if (y >= b.top - 0.02) continue;          // standing on top of it
      if (y + h <= b.bottom + 0.02) continue;   // ducked underneath it
      if (x + r > b.x0 && x - r < b.x1) return b;
    }
    return null;
  }

  /**
   * Move along x from `from` towards `to`. Stops at the face of the first box it would enter and returns it as `hit`.
   * Because the player only starts outside a box, a stuck position can never trap them: if they are already inside,
   * the box is ignored and they can walk out.
   */
  function moveX(from, to, z, y, r = PLAYER_R, h = PLAYER_H, layer = '') {
    let x = to, hit = null;
    if (to === from) return { x, hit };
    const dir = Math.sign(to - from);
    const seen = new Set();
    // check every column the sweep passes through, so a fast move cannot tunnel through a thin wall
    const k0 = key(Math.min(from, to)), k1 = key(Math.max(from, to));
    for (let k = k0; k <= k1; k++) {
      for (const b of cells.get(k) || []) {
        if (seen.has(b) || b.layer !== layer) continue; seen.add(b);
        if (z + r <= b.z0 || z - r >= b.z1) continue;
        if (y >= b.top - 0.02) continue;
        if (y + h <= b.bottom + 0.02) continue;
        if (dir > 0) {
          if (from + r <= b.x0 + 1e-4 && x + r > b.x0) { x = Math.min(x, b.x0 - r); hit = b; }
        } else {
          if (from - r >= b.x1 - 1e-4 && x - r < b.x1) { x = Math.max(x, b.x1 + r); hit = b; }
        }
      }
    }
    return { x, hit };
  }

  /**
   * Remove the boxes that stand under one platform: when a platform is registered at the same height and its x range
   * covers a box, that box is a step you are meant to walk up, not a wall. Called as each platform is added (so it works
   * for the streamed districts too, which build their platforms long after the world is built).
   */
  function uncover(p) {
    if (!p) return 0;
    const layer = p.layer || '';
    let killed = 0;
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (b.layer !== layer) continue;
      if (!(p.y >= b.top - .1 && p.y <= b.top + .1)) continue;
      if (!(p.a <= b.x0 + .05 && p.b >= b.x1 - .05)) continue;
      boxes.splice(i, 1); killed++;
    }
    if (killed) { cells.clear(); for (const b of boxes) for (let k = key(b.x0); k <= key(b.x1); k++) bucket(k).push(b); }
    return killed;
  }

  /** Drop boxes that are actually things you stand on (a bulk pass, for the end of a build) */
  function pruneStandable(platforms) {
    const keep = [];
    for (const b of boxes) {
      const covered = (platforms || []).some(p => (p.layer || '') === b.layer && p.y >= b.top - .1 && p.y <= b.top + .1 && p.a <= b.x0 + .05 && p.b >= b.x1 - .05);
      if (!covered) keep.push(b);
    }
    boxes.length = 0; cells.clear();
    for (const b of keep) { boxes.push(b); for (let k = key(b.x0); k <= key(b.x1); k++) bucket(k).push(b); }
    return boxes.length;
  }

  return { add, removeTag, overlap, moveX, pruneStandable, uncover, boxes, cells, count: () => boxes.length };
}
