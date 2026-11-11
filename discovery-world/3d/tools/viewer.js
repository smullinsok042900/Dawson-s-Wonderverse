// Model viewer (developer tool, not part of the game): renders one character
// from several angles in a neutral studio, so models can be checked closely.
// Build: node tools/build-viewer.mjs  ->  tools/viewer.html?k=pip&walk=1
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeCreature } from '../src/creatures.js';
const q = new URLSearchParams(location.search), kind = q.get('k') || 'pip', walk = +(q.get('walk') || 0), happy = +(q.get('happy') || 0);
const W = 1200, H = 420, renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setScissorTest(true);
document.body.style.margin = 0; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#f4e6f4');
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .7;
scene.add(new THREE.HemisphereLight('#fff0ff', '#9a6ad8', .8));
const sun = new THREE.DirectionalLight('#fff1dc', 2.2); sun.position.set(-3, 6, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: '#f7d6ee', roughness: .8 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const t0 = performance.now(); const c = makeCreature(kind); window.ms = performance.now() - t0; scene.add(c.root);
const cam = new THREE.PerspectiveCamera(32, (W / 3) / H, .05, 50);
let t = 0; for (let i = 0; i < 90; i++) { t += 1 / 60; c.update(1 / 60, { vx: walk ? 4 : 0, vy: 0, grounded: true, facing: 1, happy }); }
c.root.rotation.y = 0;
[[0, 'front'], [.9, 'three-quarter'], [Math.PI / 2, 'side']].forEach(([a, n], i) => {
  const d = 3.6; cam.position.set(Math.sin(a) * d, 1.15, Math.cos(a) * d); cam.lookAt(0, .9, 0);
  renderer.setViewport(i * W / 3, 0, W / 3, H); renderer.setScissor(i * W / 3, 0, W / 3, H); renderer.render(scene, cam);
});
window.done = true;
