// ===================================================================
// scene-audit.js (graphics & performance overhaul): automated geometry and placement checks.
//
// It answers, from the REAL built scene, the questions that used to need a manual walk-through:
//   * are two copies of the same mesh sitting in exactly the same place (double-drawn, z-fighting)?
//   * are two large flat surfaces coplanar and overlapping (flickering / z-fighting)?
//   * is a mesh completely buried below the play floor (sunk scenery)?
//   * do two collision entries overlap so heavily that one of them is a duplicate?
//   * are there malformed collision entries (NaN, zero or negative width)?
//
// It is deliberately CONSERVATIVE: intentional assemblies (a window in a wall, a roof on a house)
// are reported only when they are exactly coincident or exactly coplanar, which is never wanted.
// Everything is a CANDIDATE for a human/agent to confirm; nothing is moved automatically.
//
// Cost: this runs only when asked (window.__DDW3.audit(), or ?audit at start-up). It never runs
// inside the frame loop.
// ===================================================================
import * as THREE from 'three';
import { overlapFraction } from './spatial.js';

const TINY = 1e-4;
const COPLANAR = .0025;   // metres: closer than this on a horizontal plane and large areas = z-fighting risk

function keyForMatrix(m) {
  const e = m.elements;
  let s = '';
  for (let i = 0; i < 16; i++) s += (Math.round(e[i] * 1e4) / 1e4) + ',';
  return s;
}

function boxInfo(o, box) {
  const size = new THREE.Vector3(); box.getSize(size);
  const c = new THREE.Vector3(); box.getCenter(c);
  return { size, center: c, minY: box.min.y, maxY: box.max.y, minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
}

/**
 * Audit the built scene. Returns a plain, JSON-serialisable report.
 * @param {{scene: THREE.Object3D, solids?: Array, platforms?: Array, maxSamples?: number}} o
 */
export function auditScene({ scene, solids = [], platforms = [], maxSamples = 6 }) {
  const max = maxSamples;
  const box = new THREE.Box3();
  const meshes = [];
  let hidden = 0;

  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
    if (!o.visible) { hidden++; }
    // (overhaul) shadow-only proxies live on layer 1 and are never drawn into the colour picture:
    // they are deliberate, not duplicate geometry.
    if ((o.layers.mask & 1) === 0) return;
    box.setFromObject(o);
    if (box.isEmpty()) return;
    const info = boxInfo(o, box);
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    // transparent decals (contact shadows, glows, water) overlap by design
    const opaque = !(mat && (mat.transparent || mat.depthWrite === false));
    meshes.push({
      o, info, instanced: !!o.isInstancedMesh, skinned: !!o.isSkinnedMesh, sprite: !!o.isSprite, points: !!o.isPoints, line: !!o.isLine,
      name: o.name || (mat && mat.name) || (o.geometry && o.geometry.type) || o.type,
      geometryKey: o.geometry ? (o.geometry.uuid || '') : '',
      matrixKey: keyForMatrix(o.matrixWorld),
      materialKey: mat ? (mat.uuid || '') : '',
      // (stage 3) only truly flat surfaces: sliced scenery merges neighbouring slabs into one
      // mesh, and two merged slabs at the same height have overlapping BOXES while their
      // actual tops never touch, which used to be reported as z-fighting.
      horizontal: opaque && info.size.y < .02 && info.size.x * info.size.z > .035,
      dynamic: !!o.userData.dynamic, opaque,
    });
  });

  // ---- 1. the same geometry at exactly the same transform (double placement) ----
  const transformSeen = new Map();
  const duplicateTransforms = [];
  for (const m of meshes) {
    // InstancedMesh places its copies inside instanceMatrix, not in matrixWorld: two instanced sets sharing
    // one geometry at the origin are normal, so they are not compared here.
    // Skinned meshes deliberately share one geometry between fur shells; sprites/points/lines share their geometry
    // by design; the off-world shader rehearsal group sits at y=-60.
    if (!m.geometryKey || m.instanced || m.skinned || m.sprite || m.points || m.line) continue;
    if (m.info.center.y < -30) continue;
    const k = m.geometryKey + '|' + m.matrixKey;
    const prev = transformSeen.get(k);
    if (prev) { if (duplicateTransforms.length < max) duplicateTransforms.push({ name: m.name, at: [+m.info.center.x.toFixed(2), +m.info.center.y.toFixed(2), +m.info.center.z.toFixed(2)] }); }
    else transformSeen.set(k, m);
  }

  // ---- 2. coplanar, overlapping horizontal surfaces (z-fighting candidates) ----
  const planes = meshes.filter(m => m.horizontal).map(m => ({ y: m.info.center.y, name: m.name, minX: m.info.minX, maxX: m.info.maxX, minZ: m.info.minZ, maxZ: m.info.maxZ, area: m.info.size.x * m.info.size.z }));
  planes.sort((a, b) => a.y - b.y);
  const zfight = [];
  for (let i = 0; i < planes.length; i++) {
    const a = planes[i];
    for (let j = i + 1; j < planes.length && planes[j].y - a.y <= COPLANAR; j++) {
      const b = planes[j];
      if (Math.abs(b.y - a.y) > COPLANAR) continue;
      const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
      const oz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
      if (ox > TINY && oz > TINY && ox * oz > .02) {
        if (zfight.length < max) zfight.push({ a: a.name, b: b.name, y: +((a.y + b.y) / 2).toFixed(3), overlap: +(ox * oz).toFixed(2) });
      }
    }
  }

  // ---- 3. a prop cutting into the floor (partly above, partly below) ----
  // (Everything that lives wholly underground is legitimate content: the game has a real underground layer.)
  const buried = [];
  let buriedCount = 0;
  for (const m of meshes) {
    if (!(m.info.minY < -.3 && m.info.maxY > .4)) continue;
    // Wide, flat-topped masses are the rolling hills/headlands: deliberate terrain, not props in the floor.
    if (m.info.size.x > m.info.size.y * 2 || m.info.size.z > m.info.size.y * 2) continue;
    if (m.skinned || m.sprite || m.points || m.line) continue;
    let p = m.o.parent, underground = false;
    while (p) { const n = (p.name || '').toLowerCase(); if (n.includes('under') || n.includes('sea') || n.includes('cave')) { underground = true; break; } p = p.parent; }
    if (underground || m.dynamic || !m.opaque) continue;
    if (m.o.userData && m.o.userData.grounded) continue; // deliberately seated props (rocks, roots)
    buriedCount++;
    if (buried.length < max) buried.push({ name: m.name, minY: +m.info.minY.toFixed(2), x: +m.info.center.x.toFixed(1) });
  }

  // ---- 4. collision entries: malformed, duplicate, and heavy overlaps ----
  const badSolids = [], dupSolids = [], overlapSolids = [];
  const seenSolid = new Set();
  for (const s of solids) {
    if (!s || !Number.isFinite(s.a) || !Number.isFinite(s.b) || !Number.isFinite(s.top) || s.b <= s.a) {
      if (badSolids.length < max) badSolids.push({ a: s && s.a, b: s && s.b, top: s && s.top, layer: s && s.layer });
      continue;
    }
    const k = [s.a, s.b, s.top, s.layer || '', s.bottom ?? 0].map(v => Math.round(v * 1e3) / 1e3).join('|');
    if (seenSolid.has(k)) { if (dupSolids.length < max) dupSolids.push({ a: s.a, b: s.b, top: s.top, layer: s.layer || '', key: s.key }); }
    else seenSolid.add(k);
  }
  for (let i = 0; i < solids.length; i++) {
    const a = solids[i]; if (!a || !Number.isFinite(a.a)) continue;
    for (let j = i + 1; j < solids.length; j++) {
      const b = solids[j]; if (!b || !Number.isFinite(b.a)) continue;
      if ((a.layer || '') !== (b.layer || '')) continue;
      const f = overlapFraction(a.a, a.b, b.a, b.b);
      if (f > .9 && Math.abs((a.top || 0) - (b.top || 0)) < .02) {
        if (overlapSolids.length < max) overlapSolids.push({ a: { a: a.a, b: a.b, top: a.top }, b: { a: b.a, b: b.b, top: b.top }, overlap: +f.toFixed(2) });
        break; // one example per entry is enough
      }
    }
  }

  const badPlatforms = [];
  for (const p of platforms) {
    if (!p || !Number.isFinite(p.a) || !Number.isFinite(p.b) || !Number.isFinite(p.y) || p.b <= p.a) {
      if (badPlatforms.length < max) badPlatforms.push({ a: p && p.a, b: p && p.b, y: p && p.y, layer: p && p.layer });
    }
  }

  return {
    scene: { meshes: meshes.length, hidden },
    duplicates: { count: duplicateTransforms.length, samples: duplicateTransforms },
    zfight: { count: zfight.length, samples: zfight },
    buried: { count: buriedCount, samples: buried },
    solids: { total: solids.length, malformed: badSolids, duplicates: dupSolids, heavyOverlaps: overlapSolids },
    platforms: { total: platforms.length, malformed: badPlatforms },
  };
}
