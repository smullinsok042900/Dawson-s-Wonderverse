// ===================================================================
// assets.js (build 19): real model and texture FILES, made offline with the
// Blender asset pipeline (tools/blender/build_assets.py) and the texture tool
// (tools/textures/make_cobble.py), packed into the game so it still works offline.
//   * 3 trees: one smooth organic trunk mesh with baked bark colour + normal maps,
//     and a crown of thousands of real leaf meshes with baked ambient occlusion
//   * 2 bushes made the same way
//   * a seamless cobblestone texture set (colour, normal, roughness)
// The GLB files are meshopt-compressed; three.js decodes them at start-up.
// In the light test mode (?test) the old lightweight procedural versions are used.
// ===================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import tree0 from './assets/tree_0.glb';
import tree1 from './assets/tree_1.glb';
import tree2 from './assets/tree_2.glb';
import bush0 from './assets/bush_0.glb';
import bush1 from './assets/bush_1.glb';
import cobCol from './assets/cobble_col.jpg';
import cobNrm from './assets/cobble_nrm.jpg';
import cobRough from './assets/cobble_rough.jpg';
import brCol from './assets/brick_col.jpg';
import castleGlb from './assets/castle.glb';
import castleAO from './assets/castle_ao.jpg';
import carBaseGlb from './assets/carousel_base.glb';
import carSpinGlb from './assets/carousel_spin.glb';
import carBaseAO from './assets/carousel_base_ao.jpg';
import carSpinAO from './assets/carousel_spin_ao.jpg';
import brNrm from './assets/brick_nrm.jpg';
import brRough from './assets/brick_rough.jpg';

export const USE_ASSETS = typeof location === 'undefined' || !/[?&](test|noassets)/.test(location.search);
export const windTime = { value: 0 };

// grass/leaves: light both sides of a leaf the same (no dark flipped backs)
const NO_FLIP = THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', '');
// one shared leaf material: baked colour + AO from the vertex colours, a soft sheen, and a gentle breeze
export const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .62, metalness: 0 });
leafMat.onBeforeCompile = sh => {
  sh.uniforms.uWind = windTime;
  sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    { vec4 wp = modelMatrix * vec4(transformed, 1.);
      #ifdef USE_INSTANCING
        wp = modelMatrix * instanceMatrix * vec4(transformed, 1.);
      #endif
      float k = clamp(transformed.y - .6, 0., 4.) * .012;
      transformed.x += sin(uWind * 1.6 + wp.x * .7 + wp.z * .5) * k + sin(uWind * 4.3 + wp.x * 3.1 + wp.y * 2.3) * k * .35;
      transformed.z += cos(uWind * 1.3 + wp.x * .6) * k * .6; }`);
  sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', NO_FLIP);
};

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const parse = bin => new Promise((res, rej) => loader.parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej));
const maxAniso = { v: 8 };
function prep(gltf) {
  const parts = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    const geo = new THREE.BufferGeometry(); // (compressed attributes are 16-bit integers: unpack to floats, then bake the node transform)
    for (const [name, at] of Object.entries(o.geometry.attributes)) {
      const n = at.itemSize, f = new Float32Array(at.count * n);
      for (let i = 0; i < at.count; i++) for (let c = 0; c < n; c++) f[i * n + c] = at.getComponent(i, c);
      geo.setAttribute(name, new THREE.BufferAttribute(f, n));
    }
    if (o.geometry.index) geo.setIndex(new THREE.BufferAttribute(new Uint32Array(o.geometry.index.array), 1));
    geo.applyMatrix4(o.matrixWorld);
    if (geo.attributes.color) { // (build 20) calmer foliage: pull each leaf 35% toward the crown's average colour (keeps the baked shading, removes confetti noise)
      const c = geo.attributes.color, n = c.count, m = [0, 0, 0];
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) m[k] += c.getComponent(i, k) / n;
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) c.setComponent(i, k, c.getComponent(i, k) * .65 + m[k] * .35 * (.75 + .25 * (c.getComponent(i, 1) / Math.max(1e-3, m[1]))));
    }
    let mat = o.material;
    if (geo.attributes.color) mat = leafMat;
    else { for (const k of ['map', 'normalMap']) if (mat[k]) mat[k].anisotropy = maxAniso.v; mat.roughness = .9; mat.metalness = 0; }
    geo.computeBoundingSphere(); parts.push({ geo, mat, leaves: !!geo.attributes.color });
  });
  return parts;
}

export const ASSETS = { trees: null, bushes: null };
export const assetsReady = USE_ASSETS
  ? Promise.all([tree0, tree1, tree2, bush0, bush1].map(parse)).then(g => { ASSETS.trees = g.slice(0, 3).map(prep); ASSETS.bushes = g.slice(3).map(prep); return ASSETS; })
    .catch(e => { console.log('assets failed, using the procedural versions', e); return null; })
  : Promise.resolve(null);

export function setMaxAnisotropy(n) { maxAniso.v = n; }

// texture sets made by tools/textures/*.py (seamless colour, normal and roughness maps)
const L = new THREE.TextureLoader(), mk = (u, srgb) => { const t = L.load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
let cobCache = null, brCache = null;
export function cobbleSet() { return cobCache || (cobCache = { map: mk(cobCol, true), normal: mk(cobNrm, false), rough: mk(cobRough, false) }); }
export function brickSet() { return brCache || (brCache = { map: mk(brCol, true), normal: mk(brNrm, false), rough: mk(brRough, false) }); }

// (build 22) landmark models: the Blender castle (and its baked ambient-occlusion lightmap, UV set 1)
export const landmarksReady = USE_ASSETS
  ? Promise.all([castleGlb, carBaseGlb, carSpinGlb].map(parse)).then(([c, cb, cs]) => {
      const aoTex = u => { const t = new THREE.TextureLoader().load(u); t.flipY = false; t.channel = 1; t.colorSpace = THREE.NoColorSpace; return t; };
      return { castle: c.scene, castleAO: aoTex(castleAO), carBase: cb.scene, carBaseAO: aoTex(carBaseAO), carSpin: cs.scene, carSpinAO: aoTex(carSpinAO) };
    }).catch(e => { console.log('landmarks failed, using the procedural versions', e); return null; })
  : Promise.resolve(null);
