// (build 124) Soft toy parts for the family's drawing friends: the drawings' own outlines puffed into round plush bodies,
// shiny 3D eyes, chunky limbs with mitten hands and boots. Everything still goes into the creature's one batch
// (one shared material, one draw), so a rounder friend costs no extra draw calls and no new shader.
import * as THREE from 'three';

const DOT = new THREE.SphereGeometry(1, 6, 4);
const EYE = new THREE.SphereGeometry(1, 8, 6);
const UP = new THREE.Vector3(0, 1, 0);
const RINGS = 4, AROUND = 28;

/** a lighter (k > 0, toward white) or darker (k < 0) shade of a colour */
export function shade(hex, k) {
  const c = new THREE.Color(hex);
  return '#' + (k >= 0 ? c.lerp(new THREE.Color('#ffffff'), k) : c.multiplyScalar(1 + k)).getHexString();
}

/**
 * Puff a closed 2D outline (points [x, y] in the drawing's plane, z = 0) into a round, pillowy solid with exactly the
 * drawing's silhouette. Thin parts of the outline get thinner, so a narrow neck stays narrow from the side as well.
 * Returns zAt(x, y): how far the front surface stands out at that spot (0 outside), to draw a face on it.
 */
export function puff(b, color, outline, depth = .3, belly) {
  const curve = new THREE.CatmullRomCurve3(outline.map(([x, y]) => new THREE.Vector3(x, y, 0)), true);
  const rim = curve.getSpacedPoints(AROUND).slice(0, AROUND);
  // the middle the rings close in on: the outline's area centre (inside for the drawings' rounded shapes)
  let ax = 0, ay = 0, area = 0;
  for (let i = 0; i < AROUND; i++) {
    const p = rim[i], q = rim[(i + 1) % AROUND], cr = p.x * q.y - q.x * p.y;
    area += cr; ax += (p.x + q.x) * cr; ay += (p.y + q.y) * cr;
  }
  const cx = ax / (3 * area), cy = ay / (3 * area);
  const dist = rim.map(p => Math.hypot(p.x - cx, p.y - cy)), mean = dist.reduce((s, d) => s + d, 0) / AROUND;
  // each direction's own depth, a little smoothed so the sides flow
  const dep = dist.map((_, i) => {
    let s = 0; for (let k = -2; k <= 2; k++) s += dist[(i + k + AROUND) % AROUND];
    return depth * Math.min(1.08, Math.max(.45, s / 5 / mean));
  });
  const zOf = (i, t) => Math.sin(t) * (dep[i] + (depth - dep[i]) * (1 - Math.cos(t)));
  const pos = [], idx = [];
  // ring 0 is the shared outline (z 0); rings 1..RINGS-1 go up each side; one tip vertex per side
  for (let i = 0; i < AROUND; i++) pos.push(rim[i].x, rim[i].y, 0);
  const ringStart = [[0, 0]];
  for (const side of [1, -1]) {
    const starts = [0];
    for (let r = 1; r < RINGS; r++) {
      starts.push(pos.length / 3);
      const t = r / RINGS * Math.PI / 2, s = Math.cos(t);
      for (let i = 0; i < AROUND; i++) pos.push(cx + (rim[i].x - cx) * s, cy + (rim[i].y - cy) * s, side * zOf(i, t));
    }
    const tip = pos.length / 3; pos.push(cx, cy, side * depth);
    for (let r = 0; r < RINGS - 1; r++) {
      const a0 = starts[r], b0 = starts[r + 1];
      for (let i = 0; i < AROUND; i++) {
        const j = (i + 1) % AROUND, a = a0 + i, a1 = a0 + j, c = b0 + i, c1 = b0 + j;
        if (side < 0) idx.push(a, a1, c1, a, c1, c); else idx.push(a, c1, a1, a, c, c1); // (outward-facing on both sides)
      }
    }
    const last = starts[RINGS - 1];
    for (let i = 0; i < AROUND; i++) {
      const j = (i + 1) % AROUND;
      if (side < 0) idx.push(last + i, last + j, tip); else idx.push(last + i, tip, last + j);
    }
    ringStart.push(starts);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // a soft lighter tummy on the front, like a plush toy's patch (vertex colour: still one material)
  const base = new THREE.Color(color), light = new THREE.Color(belly || shade(color, .45));
  b.put(g, 0, 0, 0, belly === false ? color : (x, y, z, nx, ny, nz, out) => {
    const u = Math.hypot((x - cx) / (mean * .75), (y - cy) / (mean * .9));
    out.copy(base).lerp(light, Math.max(0, Math.min(1, (1 - u) * 1.3)) * .8 * Math.max(0, nz));
  });
  // the exact front surface height, found by a ray at build time (never while she plays)
  const probe = new THREE.Mesh(g, new THREE.MeshBasicMaterial()), ray = new THREE.Raycaster(), from = new THREE.Vector3(), down = new THREE.Vector3(0, 0, -1);
  return (x, y) => { ray.set(from.set(x, y, depth + 1), down); const h = ray.intersectObject(probe, false)[0]; return h ? h.point.z : 0; };
}

/** a shiny cartoon eye: white, a big dark pupil looking a little forward, and two sparkles */
export function eye(b, x, y, z, r = .09, opts = {}) {
  const { tall = 1.2, iris = '#2a2333', look = [0, 0], lid, core } = opts;
  b.put(EYE, x, y, z, '#ffffff', [r, r * tall, r * .55]);
  const px = x + look[0] * r * .3, py = y + look[1] * r * .3 - r * .08;
  b.put(EYE, px, py, z + r * .38, iris, [r * .68, r * .8 * tall, r * .3]);
  if (core) b.put(EYE, px, py, z + r * .52, core, [r * .24, r * .3 * tall, r * .2]); // a dark centre when the drawing's crayon is light
  b.put(DOT, px - r * .25, py + r * .32 * tall, z + r * .64, '#ffffff', r * .2);
  b.put(DOT, px + r * .22, py - r * .25 * tall, z + r * .62, '#ffffff', r * .09);
  if (lid) b.put(EYE, x, y + r * tall * .35, z + r * .06, lid, [r * 1.06, r * tall * .72, r * .54]);
}

/** a rounded tube through 3D points, thick at the start and narrowing to `r1` (a chunky arm, leg, ear or antenna) */
export function limb(b, color, points, r0 = .06, r1 = r0 * .8, segments = 10, end = 0) {
  // never below the ground: a limb that ends at the floor gets a foot no thicker than its height
  const floor = y => Math.max(.015, y); r0 = Math.min(r0, floor(points[0][1])); r1 = Math.min(r1, floor(points.at(-1)[1])); if (end) end = Math.min(end, floor(points.at(-1)[1]));
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, segments, 1, 6, false), p = g.attributes.position, c = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, r = r0 + (r1 - r0) * t; curve.getPointAt(t, c);
    for (let j = 0; j <= 6; j++) {
      const n = i * 7 + j; p.setXYZ(n, c.x + (p.getX(n) - c.x) * r, c.y + (p.getY(n) - c.y) * r, c.z + (p.getZ(n) - c.z) * r);
    }
  }
  g.computeVertexNormals(); b.put(g, 0, 0, 0, color); g.dispose();
  b.put(DOT, ...points[0], color, r0);
  // a round mitten / boot / bobble at the far end (end = its radius), or just a round cap
  const last = points.at(-1);
  b.put(DOT, ...last, color, end || r1);
}

/** a foot: a round boot pointing forward */
export function boot(b, color, x, y, z, r = .1) {
  b.put(DOT, x, y + r * .55, z + r * .3, color, [r, r * .62, r * 1.3]);
}

/** a line drawn on a puffed surface (a smile, a brow): 2D points lifted onto the front */
export function drawOn(b, color, zAt, points, r = .022, lift = .02) {
  const pts = points.map(([x, y]) => new THREE.Vector3(x, y, zAt(x, y) + lift));
  const curve = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(curve, Math.max(5, points.length * 2), r, 4, false);
  b.put(g, 0, 0, 0, color); g.dispose();
  for (const p of [pts[0], pts.at(-1)]) b.put(DOT, p.x, p.y, p.z, color, r);
}

/** a soft round blush on a puffed surface */
export function blush(b, color, zAt, x, y, r = .07) {
  b.put(DOT, x, y, zAt(x, y) - r * .15, color, [r, r * .6, r * .35]);
}

/** a straight chunky rod between two points (for stiff arms) */
export function rodTo(b, color, a, c, r = .05) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...c), d = q.clone().sub(p);
  const g = new THREE.CylinderGeometry(r, r, d.length(), 8, 1, true);
  const rot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()));
  const m = p.add(q).multiplyScalar(.5); b.put(g, m.x, m.y, m.z, color, 1, rot.toArray()); g.dispose();
}
