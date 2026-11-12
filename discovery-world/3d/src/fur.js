// ===================================================================
// fur.js: 3D build 15, real fur for the furry characters ("shell fur").
// The body is drawn several extra times, each copy pushed a little further
// out along the surface. Each layer only keeps the tiny dots where a hair
// passes through, so together they build thousands of soft hairs that
// follow the skeleton (they bend and move with the body), get darker at the
// roots and lighter at the tips, and droop a little with gravity.
// ===================================================================
import * as THREE from 'three';

// (build 21) PLUSH FUR, texture-based. A tileable "fibre height" map (thousands of round strands, each
// tallest in its middle) is sampled in 3D (triplanar) on the creature's rest-pose surface. Each shell keeps
// only the strands taller than its own height, so strands taper towards the tips. Because the fibres come
// from a mipmapped texture, they average out smoothly with distance (no sparkle, no grain), and the edges
// are smoothed by alpha-to-coverage on the 4x anti-aliased picture (no sorting problems, no dark halos).
let fiberTex = null;
function fiberTexture() {
  if (fiberTex) return fiberTex;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, N, N); g.globalCompositeOperation = 'lighten';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * N, y = rnd() * N, r = 1.6 + rnd() * 1.6, h = Math.floor((.45 + rnd() * .55) * 255);
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, `rgb(${h},${h},${h})`); gr.addColorStop(1, 'rgb(0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill();
    }
  }
  fiberTex = new THREE.CanvasTexture(c); fiberTex.wrapS = fiberTex.wrapT = THREE.RepeatWrapping; fiberTex.colorSpace = THREE.NoColorSpace;
  fiberTex.minFilter = THREE.LinearMipmapLinearFilter; fiberTex.magFilter = THREE.LinearFilter; fiberTex.anisotropy = 4; fiberTex.generateMipmaps = true;
  return fiberTex;
}
function furMaterial(base, layer, o) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0, color: o.tint || '#ffffff', alphaToCoverage: true });
  m.userData.layer = layer;
  m.onBeforeCompile = sh => {
    sh.uniforms.uOff = { value: layer * o.length }; sh.uniforms.uLayer = { value: layer }; sh.uniforms.uScale = { value: o.density / 30 }; sh.uniforms.uDroop = { value: o.droop ?? .35 }; sh.uniforms.uFiber = { value: fiberTexture() };
    sh.vertexShader = 'uniform float uOff; uniform float uDroop; varying vec3 vFurP; varying vec3 vFurN; attribute float furAmt; varying float vFurAmt;\n' + sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n  vFurP = position; vFurN = normal; vFurAmt = furAmt;\n  transformed += normalize(objectNormal) * uOff * furAmt; transformed.y -= uOff * uOff * uDroop * 40.0;');
    sh.fragmentShader = 'uniform float uLayer; uniform float uScale; uniform sampler2D uFiber; varying vec3 vFurP; varying vec3 vFurN; varying float vFurAmt;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  { vec3 bw = pow(abs(normalize(vFurN)), vec3(4.)); bw /= dot(bw, vec3(1.)); vec3 q = vFurP * uScale;
    float f = texture2D(uFiber, q.yz).r * bw.x + texture2D(uFiber, q.xz + .37).r * bw.y + texture2D(uFiber, q.xy + .71).r * bw.z;
    float a = smoothstep(uLayer * .9 - .05, uLayer * .9 + .05, f) * step(.5, vFurAmt);
    diffuseColor.a = a; diffuseColor.rgb *= mix(.9, 1.04, uLayer); }`);
  };
  m.customProgramCacheKey = () => 'fur21';
  return m;
}
export const FUR = []; // (build 22) every furry creature's shells: drawn only near the camera
// add fur shells to a skinned mesh (shares its geometry and skeleton)
const PHONE = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || /iPhone|iPad|Android/.test(navigator.userAgent)); // (build 22: fewer fur layers on phones)
const LIGHT_TEST = typeof location !== 'undefined' && /[?&]test/.test(location.search); // (the automated tests' light mode skips fur)
export function addFur(mesh, o = {}) {
  if (LIGHT_TEST) return [];
  const n = Math.min(o.shells ?? 8, PHONE ? 5 : 99), opts = { length: o.length ?? .03, density: o.density ?? 260, droop: o.droop, tint: o.tint }, shells = [];
  for (let i = 1; i <= n; i++) {
    const s = new THREE.SkinnedMesh(mesh.geometry, furMaterial(mesh.material, i / n, opts));
    s.bind(mesh.skeleton, mesh.bindMatrix); s.frustumCulled = true; s.castShadow = false; s.receiveShadow = true; s.renderOrder = 1;
    s.userData.creature = mesh.userData.creature; s.raycast = () => {}; // (taps go to the body underneath)
    mesh.parent.add(s); shells.push(s);
  }
  FUR.push({ mesh, shells });
  return shells;
}
