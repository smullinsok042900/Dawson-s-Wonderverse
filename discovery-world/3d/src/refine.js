// ===================================================================
// refine.js (build 18): a one-time quality pass over the finished world.
//   * GEOMETRY: sharp-edged boxes become softly bevelled boxes, so their edges
//     catch the light like real moulded or painted objects. Low-segment spheres,
//     cylinders and cones get enough segments for round silhouettes (more for
//     big ones, fewer for tiny ones, so the cost stays small).
//     A shape is only replaced if it is still exactly the untouched primitive
//     (same vertices), so nothing that was moved, bent or merged is affected.
//   * TEXTURES: sharp at glancing angles (anisotropic filtering), and colour
//     pictures are marked as sRGB (some were shown too light and washed out).
//   * MATERIALS: no wet-plastic gloss (a minimum roughness, a softer clearcoat).
// It returns counts so the result can be checked.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const same = (a, b) => {
  const p = a.attributes.position, q = b.attributes.position;
  if (!p || !q || p.count !== q.count) return false;
  const x = p.array, y = q.array; for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > 1e-5) return false;
  return true;
};

export function refineScene(scene, renderer, { exclude = new Set(), budget = 400000 } = {}) {
  const stats = { boxes: 0, spheres: 0, cylinders: 0, textures: 0, srgbFixed: 0, materials: 0, extraTris: 0 };
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cache = new Map(), checked = new Map(), seenTex = new Set(), seenMat = new Set();
  const V = new THREE.Vector3();
  const tris = g => (g.index ? g.index.count : g.attributes.position.count) / 3;

  // is this geometry still the untouched primitive it says it is?
  const pristine = g => {
    if (checked.has(g)) return checked.get(g);
    const P = g.parameters; let fresh = null;
    try {
      if (g.type === 'BoxGeometry') fresh = new THREE.BoxGeometry(P.width, P.height, P.depth, P.widthSegments, P.heightSegments, P.depthSegments);
      else if (g.type === 'SphereGeometry') fresh = new THREE.SphereGeometry(P.radius, P.widthSegments, P.heightSegments, P.phiStart, P.phiLength, P.thetaStart, P.thetaLength);
      else if (g.type === 'CylinderGeometry') fresh = new THREE.CylinderGeometry(P.radiusTop, P.radiusBottom, P.height, P.radialSegments, P.heightSegments, P.openEnded, P.thetaStart, P.thetaLength);
      else if (g.type === 'ConeGeometry') fresh = new THREE.ConeGeometry(P.radius, P.height, P.radialSegments, P.heightSegments, P.openEnded, P.thetaStart, P.thetaLength);
    } catch (e) { fresh = null; }
    const ok = !!fresh && same(g, fresh) && !g.morphAttributes.position && !g.attributes.skinIndex;
    fresh && fresh.dispose(); checked.set(g, ok); return ok;
  };

  const upgrade = (g, worldScale) => {
    const P = g.parameters;
    if (g.type === 'BoxGeometry') {
      const m = Math.min(P.width, P.height, P.depth); if (m < .05) return null; // (paper-thin panels stay as they are)
      const r = Math.min(.09, m * .14), key = `B${P.width}|${P.height}|${P.depth}|${r}`;
      if (!cache.has(key)) cache.set(key, new RoundedBoxGeometry(P.width, P.height, P.depth, 2, r));
      return cache.get(key);
    }
    if (g.type === 'SphereGeometry') {
      const size = P.radius * worldScale, ws = Math.round(Math.min(48, Math.max(P.widthSegments, size * 70))), hs = Math.round(Math.min(32, Math.max(P.heightSegments, ws * .7)));
      if (ws <= P.widthSegments + 2) return null;
      const key = `S${P.radius}|${ws}|${hs}|${P.phiStart}|${P.phiLength}|${P.thetaStart}|${P.thetaLength}`;
      if (!cache.has(key)) cache.set(key, new THREE.SphereGeometry(P.radius, ws, hs, P.phiStart, P.phiLength, P.thetaStart, P.thetaLength));
      return cache.get(key);
    }
    const isCone = g.type === 'ConeGeometry', rad = isCone ? P.radius : Math.max(P.radiusTop, P.radiusBottom);
    const rs = Math.round(Math.min(48, Math.max(P.radialSegments, rad * worldScale * 60)));
    if (rs <= P.radialSegments + 2) return null;
    const key = `${g.type}${isCone ? P.radius : P.radiusTop + '|' + P.radiusBottom}|${P.height}|${rs}|${P.heightSegments}|${P.openEnded}|${P.thetaStart}|${P.thetaLength}`;
    if (!cache.has(key)) cache.set(key, isCone ? new THREE.ConeGeometry(P.radius, P.height, rs, P.heightSegments, P.openEnded, P.thetaStart, P.thetaLength)
      : new THREE.CylinderGeometry(P.radiusTop, P.radiusBottom, P.height, rs, P.heightSegments, P.openEnded, P.thetaStart, P.thetaLength));
    return cache.get(key);
  };

  scene.updateMatrixWorld(true); const cands = [];
  scene.traverse(o => {
    if (!o.material || exclude.has(o)) return;
    // ---- geometry ----
    const g = o.geometry;
    if (o.isMesh && g && /^(Box|Sphere|Cylinder|Cone)Geometry$/.test(g.type) && pristine(g)) {
      o.getWorldScale(V); const ws = Math.max(Math.abs(V.x), Math.abs(V.y), Math.abs(V.z)), P = g.parameters;
      const size = ws * (P.radius ?? Math.max(P.radiusTop ?? 0, P.radiusBottom ?? 0, P.width ?? 0, P.height ?? 0));
      cands.push({ o, ws, size });
    }
    // ---- materials and textures ----
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || seenMat.has(m)) continue; seenMat.add(m);
      for (const k of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'alphaMap', 'sheenColorMap', 'clearcoatNormalMap', 'bumpMap', 'aoMap']) {
        const t = m[k]; if (!t || !t.isTexture || seenTex.has(t)) continue; seenTex.add(t);
        if (t.anisotropy < maxAniso) { t.anisotropy = maxAniso; t.needsUpdate = true; stats.textures++; }
        if ((k === 'map' || k === 'emissiveMap' || k === 'sheenColorMap') && t.colorSpace !== THREE.SRGBColorSpace && !t.isDataTexture && !t.isRenderTargetTexture) { t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; stats.srgbFixed++; }
      }
      if ((m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) && !m.transparent && !(m.transmission > 0) && !m.userData.glossy) {
        let ch = false;
        if (m.roughness < .3 && m.metalness < .5) { m.roughness = .3; ch = true; }
        if (m.clearcoat > .5) { m.clearcoat = .5; ch = true; }
        if (m.clearcoat > 0 && m.clearcoatRoughness < .15) { m.clearcoatRoughness = .15; ch = true; }
        if (ch) stats.materials++;
      }
    }
  });
  // the biggest (most visible) shapes get the extra detail first, within the triangle budget
  cands.sort((a, b) => b.size - a.size);
  for (const { o, ws } of cands) {
    const g = o.geometry, ng = upgrade(g, ws), copies = o.isInstancedMesh ? o.count : 1;
    if (!ng || ng === g) continue;
    const extra = (tris(ng) - tris(g)) * copies; if (stats.extraTris + extra > budget) continue;
    o.geometry = ng; stats.extraTris += extra;
    if (g.type === 'BoxGeometry') stats.boxes++; else if (g.type === 'SphereGeometry') stats.spheres++; else stats.cylinders++;
    if (o.isInstancedMesh) o.computeBoundingSphere();
  }
  return stats;
}

// -------------------------------------------------------------------
// (build 20) anti-tiling: a slow, soft change of tone across the world (two octaves of smooth
// value noise in world space), so a repeated texture never shows its repeat. amount = +/- tone.
// -------------------------------------------------------------------
export function macroVariation(mat, { scale = .11, amount = .1 } = {}) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev && prev.call(mat, sh, r);
    sh.uniforms.uMacro = { value: new THREE.Vector2(scale, amount) };
    sh.vertexShader = 'varying vec3 vMacroP;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n  vMacroP = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = `uniform vec2 uMacro; varying vec3 vMacroP;
float mHash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(mHash(i), mHash(i + vec3(1,0,0)), f.x), mix(mHash(i + vec3(0,1,0)), mHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(mHash(i + vec3(0,0,1)), mHash(i + vec3(1,0,1)), f.x), mix(mHash(i + vec3(0,1,1)), mHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
` + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  { float mn = mNoise(vMacroP * uMacro.x) * .65 + mNoise(vMacroP * uMacro.x * 3.7 + 11.) * .35;
    diffuseColor.rgb *= 1. + (mn - .5) * 2. * uMacro.y; }`);
  };
  mat.customProgramCacheKey = () => 'macro' + scale + '|' + amount;
  return mat;
}
