// ===================================================================
// spatial.js (graphics & performance overhaul): a small uniform-grid index for the game's
// 1-D collision volumes (G.solids and G.platforms are x-intervals on a layer).
//
// Before: every physics step (60 per second) walked ALL solids and ALL platforms to find the
// few that overlap the creature. With the world now several hundred entries long that is a
// few thousand needless comparisons every second, on every device.
//
// After: static entries are filed into 4-metre x-buckets once (and refreshed at most every
// 750 ms, or immediately when the list length changes). Entries that change at runtime — the
// spinning Mercury doors, squish-maze walls and anything else that carries a `key` — are always
// returned, so doors that open and walls that flatten stay correct. Querying is O(buckets + k),
// usually 1-3 buckets, and returns the SAME objects the caller already used.
//
// The index never owns or clones the entries: it only holds references, so existing code that
// pushes to / splices from G.solids keeps working untouched.
// ===================================================================

const PAD = .4; // covers the .35 collision padding used for solids
const MAX_WIDE_BUCKETS = 256; // a very long entry (a whole valley) is kept in a "wide" list instead

export function makeIntervalIndex({ bucket = 4, rebuildMs = 750 } = {}) {
  const layers = new Map(); // layer -> Map(bucketIndex -> entries[])
  let wide = [];            // very long static entries, always candidates
  let keyed = [];           // runtime-changing entries, always candidates
  let builtAt = -1e9, builtCount = -1, built = false;
  let out = [];             // reused result array (no per-query allocation)
  const stats = { rebuilds: 0, queries: 0, candidates: 0, entries: 0 };

  function bucketRange(lo, hi) {
    let b0 = Math.floor(lo / bucket), b1 = Math.floor(hi / bucket);
    if (!Number.isFinite(b0) || !Number.isFinite(b1)) return null;
    if (b0 > b1) { const t = b0; b0 = b1; b1 = t; }
    // Guard against a corrupt / absurd span: fall back to the always-returned list.
    if (b1 - b0 > MAX_WIDE_BUCKETS || b0 < -1e6 || b1 > 1e6) return null;
    return [b0, b1];
  }

  function rebuild(list, now) {
    layers.clear(); wide = []; keyed = [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (!it || !Number.isFinite(it.a) || !Number.isFinite(it.b)) continue;
      if (it.key) { keyed.push(it); continue; } // changes at runtime: never cached
      const lo = Math.min(it.a, it.b) - PAD, hi = Math.max(it.a, it.b) + PAD;
      const r = bucketRange(lo, hi);
      if (!r) { wide.push(it); continue; }
      const layer = it.layer || '';
      let m = layers.get(layer); if (!m) { m = new Map(); layers.set(layer, m); }
      for (let b = r[0]; b <= r[1]; b++) { let arr = m.get(b); if (!arr) { arr = []; m.set(b, arr); } arr.push(it); }
    }
    builtAt = now; builtCount = list.length; built = true; stats.rebuilds++;
    stats.entries = list.length;
  }

  /** Candidates that may overlap point x on this layer. The returned array is reused: read it immediately. */
  function query(list, x, layer = '', now = 0) {
    if (!built || list.length !== builtCount || now - builtAt > rebuildMs) rebuild(list, now);
    stats.queries++;
    out.length = 0;
    const m = layers.get(layer || '');
    if (m && Number.isFinite(x)) {
      const r = bucketRange(x - PAD, x + PAD);
      if (r) for (let b = r[0]; b <= r[1]; b++) { const arr = m.get(b); if (arr) for (let i = 0; i < arr.length; i++) out.push(arr[i]); }
    }
    for (let i = 0; i < wide.length; i++) out.push(wide[i]);
    for (let i = 0; i < keyed.length; i++) if ((keyed[i].layer || '') === (layer || '')) out.push(keyed[i]);
    stats.candidates += out.length;
    return out;
  }

  return { query, rebuild, stats, get size() { return builtCount; } };
}

/** Pure helper used by the audit + tests: do two closed intervals overlap? */
export function intervalsOverlap(a0, a1, b0, b1) {
  if (![a0, a1, b0, b1].every(Number.isFinite)) return false;
  const al = Math.min(a0, a1), ah = Math.max(a0, a1), bl = Math.min(b0, b1), bh = Math.max(b0, b1);
  return al <= bh && bl <= ah;
}

/** How much of the smaller interval is shared (0…1). Used to tell real overlaps from touching. */
export function overlapFraction(a0, a1, b0, b1) {
  if (![a0, a1, b0, b1].every(Number.isFinite)) return 0;
  const al = Math.min(a0, a1), ah = Math.max(a0, a1), bl = Math.min(b0, b1), bh = Math.max(b0, b1);
  const shared = Math.min(ah, bh) - Math.max(al, bl);
  const smaller = Math.min(ah - al, bh - bl);
  return shared <= 0 || smaller <= 0 ? 0 : shared / smaller;
}
