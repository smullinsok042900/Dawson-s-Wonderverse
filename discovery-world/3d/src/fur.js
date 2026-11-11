// ===================================================================
// fur.js: 3D build 15, real fur for the furry characters ("shell fur").
// The body is drawn several extra times, each copy pushed a little further
// out along the surface. Each layer only keeps the tiny dots where a hair
// passes through, so together they build thousands of soft hairs that
// follow the skeleton (they bend and move with the body), get darker at the
// roots and lighter at the tips, and droop a little with gravity.
// ===================================================================
import * as THREE from 'three';

const furProgramCache = new Map();
function furMaterial(base, layer, o) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, color: o.tint || '#ffffff' });
  m.userData.layer = layer;
  m.onBeforeCompile = sh => {
    sh.uniforms.uOff = { value: layer * o.length }; sh.uniforms.uLayer = { value: layer }; sh.uniforms.uDensity = { value: o.density }; sh.uniforms.uDroop = { value: o.droop ?? .35 };
    sh.vertexShader = 'uniform float uOff; uniform float uDroop; varying vec3 vFurP; attribute float furAmt; varying float vFurAmt;\n' + sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n  vFurP = position; vFurAmt = furAmt;\n  transformed += normalize(objectNormal) * uOff * furAmt; transformed.y -= uOff * uOff * uDroop * 40.0;');
    sh.fragmentShader = 'uniform float uLayer; uniform float uDensity; varying vec3 vFurP; varying float vFurAmt;\nfloat furHash(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n' + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  vec3 fp = vFurP * uDensity + vec3(sin(vFurP.y * 37.0), sin(vFurP.z * 41.0), sin(vFurP.x * 43.0)) * .35; vec3 cell = floor(fp);
  vec3 jit = vec3(furHash(cell + 7.1), furHash(cell + 13.7), furHash(cell + 21.3)) - .5; vec3 f = fract(fp) - .5 - jit * .5; // hairs scattered, not on a grid
  float h = furHash(cell), thick = (1.0 - uLayer) * (.55 + .35 * h);
  if (h < uLayer * .92 || length(f) > thick * .55 + .03) discard;`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n  if (vFurAmt < .5) discard; // (no fur on bare parts: noses, paw pads)\n  diffuseColor.rgb *= mix(.62, 1.12, uLayer) * (.92 + .16 * furHash(cell + 3.1));');
  };
  m.customProgramCacheKey = () => 'fur';
  return m;
}
// add fur shells to a skinned mesh (shares its geometry and skeleton)
const LIGHT_TEST = typeof location !== 'undefined' && /[?&]test/.test(location.search); // (the automated tests' light mode skips fur)
export function addFur(mesh, o = {}) {
  if (LIGHT_TEST) return [];
  const n = o.shells ?? 10, opts = { length: o.length ?? .03, density: o.density ?? 260, droop: o.droop, tint: o.tint }, shells = [];
  for (let i = 1; i <= n; i++) {
    const s = new THREE.SkinnedMesh(mesh.geometry, furMaterial(mesh.material, i / n, opts));
    s.bind(mesh.skeleton, mesh.bindMatrix); s.frustumCulled = true; s.castShadow = false; s.receiveShadow = true; s.renderOrder = 1;
    s.userData.creature = mesh.userData.creature; s.raycast = () => {}; // (taps go to the body underneath)
    mesh.parent.add(s); shells.push(s);
  }
  return shells;
}
