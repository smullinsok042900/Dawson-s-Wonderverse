// Renders a GLB with the game's light rig into a self-contained preview HTML (for checking assets).
//   node tools/glb-preview.mjs <file.glb> <out.html>
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const [glb, outp] = process.argv.slice(2);
const code = `
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const r = new THREE.WebGLRenderer({ antialias: true }); r.setSize(innerWidth, innerHeight); r.setPixelRatio(devicePixelRatio); document.body.appendChild(r.domElement);
r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = .95; r.shadowMap.enabled = true;
const sc = new THREE.Scene(); sc.background = new THREE.Color('#c9b8ff');
const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }', fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 top = vec3(.36,.52,1.), hor = vec3(.95,.74,.92), bot = vec3(.30,.36,.22); vec3 c = h > 0. ? mix(hor, top, pow(h, .55)) : mix(hor, bot, pow(-h, .5)); gl_FragColor = vec4(c, 1.); }' })));
sc.environment = new THREE.PMREMGenerator(r).fromScene(env, .02).texture; sc.environmentIntensity = .5;
sc.add(new THREE.HemisphereLight('#e4ecff', '#8f8a6a', .55)); const sun = new THREE.DirectionalLight('#fff0d8', 3.1); sun.position.set(-7, 16, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 8, bottom: -2 }); sc.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#74ad5f', roughness: .9 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
const cam = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
const q = new URLSearchParams(location.search), az = +(q.get('az') || 0), d = +(q.get('d') || 9), ly = +(q.get('ly') || 2);
cam.position.set(Math.sin(az) * d, ly + 1.2, Math.cos(az) * d); cam.lookAt(0, ly, 0);
const b64 = ${JSON.stringify(readFileSync(glb).toString('base64'))}; const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
L.parse(bin.buffer, '', g => { g.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (o.material.vertexColors || /leaf|bush/.test(o.name)) { o.material.side = THREE.DoubleSide; const NF = THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''); o.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', NF); }; } } }); sc.add(g.scene); setTimeout(() => { r.render(sc, cam); window.done = true; }, 300); }, e => { document.title = 'ERR ' + e; window.done = true; });
`;
const out = await build({ stdin: { contents: code, resolveDir: process.cwd() }, bundle: true, format: 'iife', write: false, minify: true });
writeFileSync(outp, `<!doctype html><html><body style="margin:0"><script>${out.outputFiles[0].text}</script></body></html>`);
console.log('ok', outp);
