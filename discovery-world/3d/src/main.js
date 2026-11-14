// ===================================================================
// Dawson's Discovery World 3D: main game.
// Three.js renderer + one connected world + creature control (move / jump /
// paw buttons and direct tapping), rides, bubbles, painting, star bits,
// Fluffkin rescue, the walk-in Fluffkin House with stairs, saving.
// No timers, no losing, no reading needed. Works offline (one HTML file).
// ===================================================================
import * as THREE from 'three';

import { Sound, NOTES } from './audio.js';
import { initAdventures, destinationArt } from './adventures.js';
import { initComfort } from './comfort.js';
import { ADVENTURES } from './adventure-state.js';
import { CREATURES, makeCreature, makeFluff, toy, starGeometry } from './creatures.js';
import { buildWorld, RAINBOW } from './world.js';
import { UG, inShaftX, buildUnderground } from './underground.js';
import { initFriends, PET_COLS, EARS, TAILS, PATS } from './friends.js';
import { SKY, buildSky } from './sky.js';
import { buildMeadow, BLOCKS, BUILD, ERASE } from './meadow.js';
import { initKarts, KART, KART_COLS } from './kart.js';
import { initTrain } from './train.js';
import { initMarbles } from './marble.js';
import { initKingdom, KINGDOM } from './kingdom.js';
import { makePost } from './post.js';
import { refineScene } from './refine.js';
import { initLearning } from './learn.js';
import { initPerf } from './perf.js';
import { initExpansion, EXP } from './expansion.js';
import { makeVoice } from './voice.js';
import { windTime, assetsReady, landmarksReady } from './assets.js';
import { LOD, makeTree } from './nature.js';
import { LOWSTATS } from './assets.js';
import { SCULPT_STATS } from './sculpt.js';
import { FUR } from './fur.js';

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const SAVE_KEY = 'dawsons-discovery-world-3d-v1';
// ?test = light mode for the automated logic tests (software WebGL in the test browser is very slow)
const TEST = /[?&]test/.test(location.search);
// build 18: one balanced light rig (key : fill about 3 : 1, so things have form and shadows, and
// sunlit pastels stay below white instead of clipping). Values were tuned against measured screenshots.
const LIGHT = { env: .55, hemi: .7, sun: 2.85, rim: .55, exposure: .95 };

// ---------------- renderer, scene, camera, light ----------------
const canvas = $('game');
// phones: start lighter (no MSAA at high pixel density, smaller shadow map, 1.5x resolution)
const MOBILE = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|Android/.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); window.__oops && window.__oops('The device reset the 3D graphics (it may be low on memory). Tap Try again.'); });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.debug.checkShaderErrors = TEST; // (build 24: the shader error check forces the browser to wait for each shader the first time it is used; on only in test mode)
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = LIGHT.exposure;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; // (filtered, with a blur radius below)
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
// build 18 (lighting audit): reflections and soft fill come from the SKY ONLY. (Before, a bright indoor
// studio environment lit everything from every direction, brighter than the sun and with no shadows,
// which flattened the picture and washed colours out to white.)
{
  const envScene = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 top = vec3(.36,.52,1.), hor = vec3(.95,.74,.92), bot = vec3(.30,.36,.22); vec3 c = h > 0. ? mix(hor, top, pow(h, .55)) : mix(hor, bot, pow(-h, .5)); gl_FragColor = vec4(c, 1.); }' }));
  envScene.add(dome);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8, 6.6) })); sunBall.position.set(-14, 22, 18); envScene.add(sunBall);
  scene.environment = pmrem.fromScene(envScene, .02).texture; scene.environmentIntensity = LIGHT.env;
}
scene.fog = new THREE.Fog('#e6d2f2', 55, 190); // build 18: atmospheric perspective only in the far distance (no haze over the play area)
const camera = new THREE.PerspectiveCamera(38, 2, .3, 600); // (build 20: near .3 instead of .1 = 3x the depth precision, no z-fighting on wall details)
const hemi = new THREE.HemisphereLight('#e4ecff', '#8f8a6a', LIGHT.hemi); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d8', LIGHT.sun); sun.castShadow = true;
sun.shadow.camera.layers.enable(1); /* (build 28) layer 1 = low-detail copies that only cast shadows */ sun.shadow.mapSize.set(MOBILE ? 1536 : 2048, MOBILE ? 1536 : 2048); /* (build 22: lighter on phones) */ sun.shadow.radius = 4; /* soft shadow edges */ Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 10, bottom: -5, near: 1, far: 50 }); /* build 17: a tighter box = sharper shadows */ sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);
// a soft cool light from behind: it outlines everything with a gentle rim, so shapes look rounder and more real
const rim = new THREE.DirectionalLight('#d6e4ff', LIGHT.rim); rim.position.set(-6, 7, -12); scene.add(rim);
// gradient sky dome + puffy clouds
const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#7fb2ff') }, mid: { value: new THREE.Color('#c9b8ff') }, bot: { value: new THREE.Color('#ffd6ec') } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > .15 ? mix(mid, top, smoothstep(.15,.7,h)) : mix(bot, mid, smoothstep(-.1,.15,h)); gl_FragColor = vec4(c,1.); }',
}));
scene.add(sky);
const cloudMat = toy('#ffffff', { r: .9, cc: 0, em: '#fff4fb', ei: .35 });
for (let i = 0; i < 16; i++) { const c = new THREE.Group(); for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), cloudMat); s.scale.setScalar(2 + (k % 3) * .8); s.position.set((k - 2) * 2.2, (k % 2) * 1.1, 0); c.add(s); } c.position.set(-20 + i * 16, 18 + (i % 3) * 4, -55 - (i % 2) * 15); scene.add(c); }

// ---------------- game state ----------------
const G = { scene, platforms: [], solids: [], taps: [], interact: [], camera };
const player = { groundZ: 0, x: 5, y: 0, z: 0, vx: 0, vy: 0, grounded: true, jumps: 0, facing: 1, ride: null, stair: null, layer: '', happy: 0, creature: 'pip' };
const world = { disc: new Set(), bits: new Set(), secret: false, bubbleColor: '#bfe8ff', lastBuckets: [], paintColor: '#ff4f9a', rainbowHue: 0, trail: [], flash: 0, drumT: 0, mobileT: 0, wake: [0, 0, 0, 0, 0, 0] };
let adventures = null;
let started = false;
buildWorld(G);
buildUnderground(G);
buildSky(G);
const IN = G.inside;
G.xylo.forEach(k => { k.key.userData.y0 = k.key.position.y; });
G.platforms.forEach(z => { if (z.top) z.top.userData.s0 = z.top.scale.y; });

// ---------------- particles (sparkles, hearts, splashes) ----------------
const PMAX = 500, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), parts = [];
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .32, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
pts.frustumCulled = false; scene.add(pts);
const tmpC = new THREE.Color();
function burst(x, y, z = 0, colors = ['#fff', '#ffe36e', '#ff9fd8'], n = 16, sp = 3) {
  if (world.comfort?.calm) n = Math.min(3, n);
  for (let i = 0; i < n; i++) { if (parts.length >= PMAX) parts.shift(); const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1; parts.push({ x, y, z, vx: Math.cos(a) * sp * Math.random(), vy: (Math.random() * 1.2 + .3) * sp, vz: Math.sin(a) * sp * Math.random() * .6, life: .6 + Math.random() * .6, c: tmpC.set(colors[i % colors.length]).toArray() }); }
}
function updateParticles(dt) {
  for (const p of parts) { p.life -= dt; p.vy -= 6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i];
    if (p) { pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z; const k = Math.min(1, p.life * 2); pCol[i * 3] = p.c[0] * k; pCol[i * 3 + 1] = p.c[1] * k; pCol[i * 3 + 2] = p.c[2] * k; }
    else { pPos[i * 3 + 1] = -999; }
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}

// ---------------- UI helpers ----------------
let toastT = 0;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('shown'); toastT = 3; speak(msg); }
// (build 23) every message is also SPOKEN (a friendly voice, emoji removed), so a child who can't read yet still knows
// what happened and what to try. Uses the phone's own speech voice; silent when the sound button is off.
// (build 27) one shared voice (voice.js) for the world and the learning games, unlocked by her first tap
let lastSpeak = 0;
const voice = makeVoice({ isOn: () => Sound.on && world.comfort?.speech !== false, TEST: TEST && !/[?&]voice/.test(location.search) }); G.voice = voice;
for (const ev of ['pointerdown', 'touchend', 'click']) addEventListener(ev, () => voice.unlock(), { capture: true, passive: true });
function speak(msg) {
  if (TEST || !Sound.on || world.comfort?.speech === false) return;
  if (world.comfort?.calm && performance.now() - lastSpeak < 6000) return;
  const text = msg.replace(/\(.*?\)/g, '');
  if (performance.now() - lastSpeak < 900) return; lastSpeak = performance.now();
  if (G.learning && G.learning.isOpen()) return; // (the learning games do their own talking)
  voice.speak(text);
}
function discover(id, msg) { if (id === 'fluffkin') adventures?.event({type:'activity',id:'fluff_found'}); if (id === 'fluffhome') adventures?.event({type:'activity',id:'fluff_home'}); if (world.disc.has(id)) return false; world.disc.add(id); if (msg) toast('✨ ' + msg); Sound.chime(); player.happy = 1.4; if (creature) creature.cheer(); burst(player.x, player.y + 2.2, player.z, undefined, 18); save(); return true; }
function updateCounters() {
  $('bitsCount').textContent = world.bits.size;
  $('fluffCount').textContent = `${fluffs.filter(f => f.state === 'home').length}/6`;
}

// ---------------- the player's creature ----------------
let creature = null;
// soft contact shadow on the ground under the creature (shrinks and fades as it jumps)
const shadowMat = new THREE.MeshBasicMaterial({ map: G.aoTex, transparent: true, depthWrite: false, opacity: 1, polygonOffset: true, polygonOffsetFactor: -4 });
const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), shadowMat); blob.rotation.x = -Math.PI / 2; blob.renderOrder = 3; blob.userData.dynamic = true; /* (build 33: it follows you; never part of a scenery slice) */ scene.add(blob);
function groundUnder(x, y) { let g = y > UG.ceil + .05 && !inShaftX(x) ? 0 : player.layer === 'in' ? 0 : UG.floor; if (player.layer === 'in' && y >= IN.f2 - .05) g = IN.f2; for (const z of G.platforms) if (z.layer === player.layer && x >= z.a && x <= z.b && z.y <= y + .01 && z.y > g) g = z.y; return g; }
function setCreature(kind) {
  if (creature) scene.remove(creature.root);
  player.creature = kind; creature = makeCreature(kind, { body: (world.styles || {})[kind] }); scene.add(creature.root);
  { const bb = new THREE.Box3().setFromObject(creature.root); G.headTop = bb.max.y - creature.root.position.y; } // (for the princess crown)
  document.querySelectorAll('.creatureChoice').forEach(b => b.classList.toggle('chosen', b.dataset.c === kind));
}

// ---------------- star bits (instanced, spinning) ----------------
const bitGeo = starGeometry(.24, .12, .08, .05, 2);
const bitMesh = new THREE.InstancedMesh(bitGeo, toy('#ffd84a', { r: .2, m: .3, cc: 1, em: '#ffb000', ei: .35 }), G.bitSpots.length);
bitMesh.castShadow = true; scene.add(bitMesh);
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), S0 = new THREE.Vector3(0, 0, 0), E = new THREE.Euler();
function updateBits(t) {
  const P = player;
  G.bitSpots.forEach(([x, y], i) => {
    const got = world.bits.has(i);
    if (!got && P.layer === '' && Math.abs(P.x - x) < .75 && Math.abs(P.y + .8 - y) < .95) { world.bits.add(i); Sound.bit(); burst(x, y, 0, ['#ffe36e', '#fff'], 8, 2); updateCounters(); if (world.bits.size % 10 === 0) { toast(`⭐ ${world.bits.size} star bits!`); Sound.chime(); } saveSoon(); }
    if (Math.abs(x - P.x) > 22 && !got) return;
    E.set(0, t * 2.4 + i, 0); Q.setFromEuler(E); V.set(x, y + Math.sin(t * 3 + i) * .08, 0);
    M4.compose(V, Q, got ? S0 : S1); bitMesh.setMatrixAt(i, M4);
  });
  bitMesh.instanceMatrix.needsUpdate = true;
}
// the secret star
const bigStar = new THREE.Mesh(starGeometry(.55, .26, .2, .1, 3), toy('#ffd84a', { r: .15, m: .4, cc: 1, em: '#ffc21c', ei: .6 }));
bigStar.position.set(G.secretStar[0], G.secretStar[1], 0); bigStar.castShadow = true; scene.add(bigStar);

// ---------------- the six baby Fluffkins ----------------
const FLUFF_COLS = ['#ff8fd0', '#8fd8ff', '#ffd45e', '#a98cff', '#7be08a', '#ffa36b'];
const fluffs = G.fluffSpots.map(([x, y, z = 0], i) => { const m = makeFluff(FLUFF_COLS[i]); scene.add(m.root); m.root.userData.dynamic = true; return { i, hx: x, hy: y, hz: z, state: 'wait', m, px: x, py: y, pz: z }; });
function updateFluffs(dt, t) {
  const P = player; world.trail.unshift([P.x, P.y, P.z]); if (world.trail.length > 200) world.trail.length = 200;
  let k = 0;
  for (const f of fluffs) {
    const m = f.m.root;
    if (f.state === 'wait') {
      m.position.set(f.hx, f.hy, f.hz); const nearF = Math.abs(f.hx - P.x) < 30; if (nearF !== !!m.parent) { if (nearF) scene.add(m); else scene.remove(m); } /* (build 25: far-away waiting Fluffkins leave the scene) */ if (nearF) f.m.update(dt, 'wait');
      if (m.visible && t % 1 < dt * 2) burst(f.hx, f.hy + .9, f.hz, ['#fff', '#ffe36e'], 3, 1);
      if (P.layer === '' && Math.abs(P.x - f.hx) < 1 && Math.abs(P.y - f.hy) < 1.2) {
        f.state = 'follow'; f.px = f.hx; f.py = f.hy; Sound.giggle(); burst(f.hx, f.hy + .6, 0, RAINBOW, 24, 3);
        const n = fluffs.filter(z => z.state !== 'wait').length;
        toast(`🐣 You found a baby Fluffkin! (${n} of 6) Take it home to the Fluffkin House!`); discover('fluffkin'); save();
      }
    } else if (f.state === 'follow') {
      k++; const tp = world.trail[Math.min(world.trail.length - 1, 10 + k * 14)] || [P.x, P.y, P.z];
      if (Math.abs(tp[0] - f.px) > 20) { f.px = tp[0]; f.py = tp[1]; }
      f.px += (tp[0] - f.px) * Math.min(1, dt * 7); f.py += (tp[1] - f.py) * Math.min(1, dt * 7); f.pz += (tp[2] + .9 - f.pz) * Math.min(1, dt * 5);
      m.position.set(f.px, f.py, f.pz); m.visible = true; f.m.update(dt, 'follow', Math.sign(P.x - f.px) || 1);
    } else { // home: asleep in its bed upstairs (or bouncing when woken)
      const b = G.beds[f.i]; b.slot.getWorldPosition(V); m.position.copy(V); m.position.y += world.wake[f.i] > 0 ? Math.abs(Math.sin(t * 9 + f.i)) * 1.1 : 0;
      if (world.drumT > 0) m.position.y += Math.abs(Math.sin(t * 8 + f.i)) * .6;
      m.visible = P.layer === 'in'; f.m.update(dt, world.wake[f.i] > 0 || world.drumT > 0 ? 'follow' : 'sleep');
    }
  }
}
function bringFluffsHome() {
  const fol = fluffs.filter(f => f.state === 'follow'); if (!fol.length) return;
  fol.forEach(f => { f.state = 'home'; });
  const home = fluffs.filter(f => f.state === 'home').length;
  setTimeout(() => { toast(home === 6 ? '🎉 All six Fluffkins are home! Thank you!' : `🏠 Welcome home, little Fluffkin! (${home} of 6) They sleep upstairs.`); Sound.chime(); for (let i = 0; i < 4; i++) burst(player.x + i - 2, 3, 0, RAINBOW, 20, 4); }, 400);
  discover('fluffhome'); updateCounters(); save();
}

// ---------------- friends: Pet Workshop, critters, balloon, sparkles ----------------
function paintStamp() { // the painter bunny paints a picture on the big wall
  const g = G.paint.ctx, W = G.paint.canvas.width, H = G.paint.canvas.height, x = 120 + Math.random() * (W - 240), y = 120 + Math.random() * (H - 240), k = Math.floor(Math.random() * 4);
  g.save(); g.translate(x, y); g.lineWidth = 14; g.lineCap = 'round';
  if (k === 0) { g.fillStyle = '#ff4f9a'; g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-90, -20, -40, -90, 0, -40); g.bezierCurveTo(40, -90, 90, -20, 0, 40); g.fill(); }
  else if (k === 1) { g.fillStyle = '#ffd23f'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 30 : 75; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); }
  else if (k === 2) { RAINBOW.slice(0, 6).forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(0, 50, 110 - i * 15, Math.PI, 0); g.stroke(); }); }
  else { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill(); g.fillStyle = '#3a2864'; g.beginPath(); g.arc(-24, -14, 9, 0, 7); g.arc(24, -14, 9, 0, 7); g.fill(); g.strokeStyle = '#3a2864'; g.lineWidth = 9; g.beginPath(); g.arc(0, 8, 34, .3, Math.PI - .3); g.stroke(); }
  g.restore(); G.paint.tex.needsUpdate = true; world.painted = true; saveSoon();
}
const meadow = buildMeadow(G, { scene, world, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), saveSoon: () => saveSoon(), tap: (obj, fn) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); } });
G.startKart = () => {
  const P = player; if (P.ride || P.layer !== '' || P.x < KART.garage - 5 || P.x > KART.flag + 5 || P.y > .5) { Sound.click(); return; }
  P.ride = { type: 'kart', u: 0, v: 2, lap: 0, hop: 0, hopV: 0 }; P.vx = P.vy = 0; Sound.whoosh(); Sound.tone(220, .5, 'sawtooth', .03, 2.2);
  discover('kart', 'Vroom! Hold ▶ to go faster, ◀ to slow down. JUMP hops, PAW parks.');
};
function parkKart() { const P = player; if (!P.ride || P.ride.type !== 'kart') return; karts.honk(); P.ride = null; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; P.groundZ = 0; burst(P.x, .5, P.z, ['#fff', '#ffd23f'], 10, 2); }
const karts = initKarts(G, { scene, world, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), saveSoon: () => saveSoon(), startKart: () => G.startKart(), tap: (obj, fn) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); } });
const tapApi = (obj, fn) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); };
const train = initTrain(G, { scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), player, tap: tapApi, arrived: i => trainArrived(i) });
const marbles = initMarbles(G, { scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), player, tap: tapApi });
const friends = initFriends(G, {
  scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), player, world, UG,
  tap: (obj, fn) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); }, save: () => save(), saveSoon: () => saveSoon(), paintStamp,
});
const kingdom = initKingdom(G, { scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), world, player, friends, saveSoon: () => saveSoon(), startSlide: path => { if (!player.ride) startSlide(path); }, snapCamera: () => snapCamera() });
// (build 29) the new neighbourhoods past the rainbow gate: streamed in as you come near
const expansion = initExpansion(G, { scene, Sound, world, player, MOBILE, event: e => adventures?.event(e), catch: () => adventures?.catch(), gallery: () => adventures?.gallery(), getKeys: () => keys, startSlide: path => { if (!player.ride) startSlide(path); }, makeTree, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), saveSoon: () => saveSoon(), compile: g => compileGroup(g), warm: g => warmGroup(g), goHome: () => travel(TRAVEL[0]), travelTo: (x, icon, name) => travel([icon, name, x]) });
G.expansion = expansion;

// ---------------- bubbles ----------------
const bubbles = [], bubbleGeo = new THREE.SphereGeometry(1, 24, 16);
G.spawnBubbles = (x, y) => {
  world.wandT = 1; Sound.tone(500, .3, 'sine', .04, 1.6);
  for (let i = 0; i < 6; i++) {
    if (bubbles.length > 26) popBubble(bubbles[0], true);
    const r = .35 + Math.random() * .35, mat = new THREE.MeshPhysicalMaterial({ color: world.bubbleColor, transparent: true, opacity: .38, roughness: .02, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.3, depthWrite: false });
    const m = new THREE.Mesh(bubbleGeo, mat); m.scale.setScalar(r); m.position.set(x + Math.random() * .6, y + Math.random() * .4, Math.random() * .8 - .2);
    const b = { m, r, vx: .8 + Math.random() * 1.6, vy: .5 + Math.random() * .7, t: Math.random() * 6, life: 9 + Math.random() * 5 };
    m.userData.tap = () => popBubble(b); scene.add(m); bubbles.push(b);
  }
  discover('bubbles', 'Bubbles! Jump into them to pop them.');
};
function popBubble(b, quiet) {
  const i = bubbles.indexOf(b); if (i < 0) return; bubbles.splice(i, 1); scene.remove(b.m); b.m.material.dispose();
  if (!quiet) { Sound.pop(); burst(b.m.position.x, b.m.position.y, b.m.position.z, [b.m.material.color.getStyle(), '#fff'], 10, 2); }
}
function updateBubbles(dt) {
  const P = player;
  for (const b of [...bubbles]) {
    b.t += dt; b.life -= dt; b.vx *= Math.exp(-dt * .5);
    b.m.position.x += (b.vx + Math.sin(b.t * 1.7) * .4) * dt; b.m.position.y += b.vy * dt; b.m.position.z = Math.sin(b.t) * .3;
    if (b.life < 0 || b.m.position.y > 10) { popBubble(b); continue; }
    if (P.layer === '' && Math.hypot(P.x - b.m.position.x, P.y + .8 - b.m.position.y) < b.r + .55) { popBubble(b); world.popped = (world.popped || 0) + 1; if (world.popped === 3) discover('popbubble', 'Pop pop pop!'); }
  }
}
G.tapBucket = (k, c, x) => {
  world.lastBuckets = [c, ...world.lastBuckets].slice(0, 2); Sound.tone(300, .25, 'sine', .05, .7);
  const [a, b] = world.lastBuckets, pair = [a, b].sort().join();
  const MIX = { [['#3d9bff', '#ffd23f'].sort().join()]: '#3cc46e', [['#ff3b6b', '#ffd23f'].sort().join()]: '#ff8a2e', [['#3d9bff', '#ff3b6b'].sort().join()]: '#a15cff' };
  world.bubbleColor = b && MIX[pair] ? MIX[pair] : a;
  burst(x, 1.2, .2, [c, '#fff'], 14, 2.5);
  if (b && MIX[pair]) discover('mix', 'You mixed a new colour! Now make bubbles with it.'); else discover('bucket', 'Tap two colours to mix them.');
};

// ---------------- ball pit ----------------
const pitM = new THREE.Matrix4();
G.pit.balls.forEach(b => { b.hx = b.x; b.hz = b.z; b.hy = b.y; });
G.splashPit = () => { G.pit.balls.forEach(b => { b.vy += 2 + Math.random() * 4; b.vx += (Math.random() - .5) * 3; }); Sound.pop(); Sound.whoosh(); burst(12, 1, 0, ['#65dcec', '#ffda68', '#b587ff', '#ff67ab'], 20, 3); discover('ballpit', 'Splash! Jump into the ball pit!'); };
function updatePit(dt) {
  const P = player, near = P.layer === '' && P.x > 6 && P.x < 18;
  for (const b of G.pit.balls) {
    if (near) { const dx = b.x - P.x, dz = b.z - P.z, dy = b.y - (P.y + .6), d = Math.hypot(dx, dz, dy * .7); if (d < .9) { b.vx += dx / (d + .1) * 8 * dt; b.vz += dz / (d + .1) * 8 * dt; b.vy += (Math.abs(P.vx) > 1 ? 6 : 2) * dt; } }
    b.vy -= 9 * dt; b.vx += (b.hx - b.x) * .8 * dt; b.vz += (b.hz - b.z) * .8 * dt; b.vx *= Math.exp(-dt * 2); b.vz *= Math.exp(-dt * 2);
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.y < b.hy) { b.y = b.hy; b.vy = Math.abs(b.vy) > 1 ? -b.vy * .35 : 0; }
    b.x = clamp(b.x, 8.5, 15.5); b.z = clamp(b.z, -1.5, 1.5);
  }
  if (near || G.pit.balls.some(b => b.vy !== 0)) { G.pit.balls.forEach((b, i) => { pitM.makeTranslation(b.x, b.y, b.z); G.pit.mesh.setMatrixAt(i, pitM); }); G.pit.mesh.instanceMatrix.needsUpdate = true; }
}
G.pit.balls.forEach((b, i) => { pitM.makeTranslation(b.x, b.y, b.z); G.pit.mesh.setMatrixAt(i, pitM); });

// ---------------- music, trampoline, orbs, house toys ----------------
G.playKey = k => { k.lit = 1; Sound.withMusic(() => Sound.bell(NOTES[k.i], .06)); burst(k.x, .5, 0, [RAINBOW[k.i], '#fff'], 8, 2); discover('xylophone', 'A giant xylophone! Walk and jump along it.'); };
G.tapTramp = () => { world.trampT = 1; Sound.boing(); const P = player; if (!P.ride && P.layer === '' && Math.abs(P.x - 34) < 3 && P.grounded) { P.vy = 13.5; P.grounded = false; P.jumps = 1; } discover('trampoline', 'Boing! Super bounce!'); };
G.zapOrb = o => { o.zap = 1; Sound.tone(1400, .25, 'sawtooth', .02, .4); Sound.twinkle(); burst(o.x, 1.9, -.8, ['#c9a6ff', '#fff', '#9fe6ff'], 24, 4); discover('orb', 'Zap! Sparkly glow orb!'); };
G.tapDrum = () => { world.drumT = 2; Sound.withMusic(() => { Sound.tone(110, .3, 'sine', .09, .4); Sound.tone(220, .15, 'triangle', .05, .5, .05); }); burst(1020, 1.2, -1.6, RAINBOW, 14, 3); discover('fluffdrum', 'Boom! Everybody jumps!'); };
G.tapMobile = () => { world.mobileT = 4; Sound.withMusic(() => [4, 2, 0, 2, 4, 4, 4].forEach((n, i) => Sound.bell(NOTES[n], .03, i * .3))); discover('mobile', 'The twinkly mobile spins round.'); };
G.tapBed = j => { const f = fluffs[j]; if (f.state === 'home') { world.wake[j] = 2; Sound.giggle(); discover('fluffbed', 'Wake up, little Fluffkin! Bounce!'); } else { Sound.click(); burst(G.beds[j].x, IN.f2 + 1, -2.8, ['#fff', '#e3b0ee'], 8, 2); discover('emptybed', 'This bed is waiting for a lost Fluffkin.'); } };

// ---------------- rides: slide, carousel, Ferris wheel ----------------
function startSlide(path = G.slidePath) { const P = player; P.ride = { type: 'slide', u: 0, v: 1.5, path, len: path.getLength() }; P.vx = P.vy = 0; Sound.whoosh(); if (path === G.skySlide) discover('skyslide', 'The GIANT rainbow slide! Wheee!'); else discover('slide', 'Wheee! The twisty slide!'); }
G.startSkySlide = () => { const P = player; if (P.ride || Math.abs(P.x - SKY.b) > 3 || Math.abs(P.y - SKY.y) > 1) { Sound.click(); return; } P.x = SKY.b - .1; P.y = SKY.y; startSlide(G.skySlide); };
G.startSlideTap = () => { const P = player; if (P.ride || P.layer !== '' || Math.abs(P.x - 25) > 9) { Sound.click(); return; } P.x = 23.2; P.y = 3.8; P.z = -1.9; startSlide(); };
G.rideCarousel = () => {
  const P = player; if (P.ride || P.layer !== '' || Math.abs(P.x - 144) > 8) { Sound.click(); return; }
  let best = 0, bz = -9; G.carousel.mounts.forEach((m, i) => { m.seat.getWorldPosition(V); if (V.z > bz) { bz = V.z; best = i; } });
  P.ride = { type: 'carousel', i: best, t: 0 }; P.vx = P.vy = 0; Sound.chime(); discover('carousel', 'Round and round on the carousel!');
};
G.rideWheel = () => {
  const P = player; if (P.ride || P.layer !== '' || Math.abs(P.x - 160) > 8) { Sound.click(); return; }
  let best = 0, by = 1e9; G.wheel.gondolas.forEach((g, i) => { g.seat.getWorldPosition(V); if (V.y < by) { by = V.y; best = i; } });
  P.ride = { type: 'wheel', i: best, turned: 0 }; P.vx = P.vy = 0; Sound.chime(); discover('wheel', 'Up, up, up on the Ferris wheel!');
};
function endRide(vx = 0, vy = 5) { const P = player; P.ride = null; P.vx = vx; P.vy = vy; P.grounded = false; P.jumps = 1; }
function updateRide(dt) {
  const P = player, R = P.ride;
  if (R.type === 'slide') {
    // inside the tube: speed up as you go, sit on the bottom of the tube, face the way you slide
    const path = R.path || G.slidePath; R.v = Math.min(8.5, R.v + dt * 5); R.u += R.v / R.len * dt;
    if (R.u >= 1) { const e = path.getPointAt(1); P.x = e.x + .5; P.y = Math.max(0, e.y - .55); P.z = e.z; endRide(4.5, 3); P.facing = 1; burst(P.x, .5, P.z, ['#fff', '#ffe36e', '#9fe6ff'], 16, 2.5); Sound.boing(); return; }
    path.getPointAt(R.u, V); P.x = V.x; P.y = V.y - .62; P.z = V.z; const tg = path.getTangentAt(R.u); P.facing = tg.x >= 0 ? 1 : -1; P.vx = 6 * P.facing;
    if (Math.random() < dt * 25) burst(P.x - tg.x * .6, P.y + .3, P.z - tg.z * .6, ['#fff', '#ffe36e', '#9fe6ff'], 1, .6);
  } else if (R.type === 'kart' || R.type === 'train') {
    // (moved by kart.js / train.js)
  } else if (R.type === 'whale') {
    // riding the sky whale: one big loop over the Cloud Kingdom, then back home (JUMP hops off onto the clouds)
    const W = G.whale; R.u += dt / 20;
    if (R.u >= 1) { const g = W.g.position; P.x = g.x; P.y = g.y + 1.6; P.z = W.g.position.z; endRide(0, 2); return; }
    const a = R.u * Math.PI * 2, x = W.x + Math.sin(a) * 8, y = W.y + 1.4 + Math.sin(a * 2) * 1.2, vx = Math.cos(a);
    W.g.position.set(x, y, -7.5); W.g.rotation.y += ((vx >= 0 ? 0 : Math.PI) - W.g.rotation.y) * Math.min(1, dt * 2); W.g.rotation.z = Math.cos(a * 2) * .12 * (vx >= 0 ? 1 : -1);
    P.x = x; P.y = y + 1.55; P.z = -7.5; P.facing = vx >= 0 ? 1 : -1; P.vx = vx * 3; P.grounded = true;
    if (Math.random() < dt * .4) W.spout = 1.5;
  } else if (R.type === 'climb') {
    // climbing the rope ladder: slide your finger up/down (or arrow keys), or tap JUMP to climb a step
    const L = SKY.ladder; let v = 0;
    if (stick && stick.active) { if (stick.dy < -28) v = 3; else if (stick.dy > 28) v = -3; }
    if (keys.up) v = 3; if (keys.down) v = -3;
    if (R.boost > 0) { v = Math.max(v, 4.2); R.boost -= dt; }
    P.y += v * dt; P.x += (L.x - P.x) * Math.min(1, dt * 10); P.z += (L.z - P.z) * Math.min(1, dt * 10); P.vx = 0; P.vy = v;
    if (v) { R.t = (R.t || 0) + dt; if (R.t > .3) { R.t = 0; Sound.tone(v > 0 ? 500 + P.y * 40 : 700 - (L.top - P.y) * 30, .08, 'triangle', .03, 1.2); } }
    if ((stick && stick.active && Math.abs(stick.dx) > 50 && Math.abs(stick.dx) > Math.abs(stick.dy) * 1.5) || keys.left || keys.right) { endRide((keys.left ? -1 : keys.right ? 1 : Math.sign(stick.dx)) * 3, 2); return; } // let go sideways
    if (P.y >= L.top) { P.y = L.top; P.x = L.x + .8; P.ride = null; P.vy = 0; P.grounded = true; P.groundZ = SKY.z; discover('sky', 'The Cloud Kingdom! Bounce on the cloud puffs!'); burst(P.x, P.y + .5, P.z, ['#fff', '#ffe6fb', '#9fe6ff'], 16, 2); return; }
    if (P.y <= 0) { P.y = 0; P.ride = null; P.vy = 0; P.grounded = true; return; }
  } else if (R.type === 'carousel') {
    R.t += dt; const m = G.carousel.mounts[R.i]; m.seat.getWorldPosition(V); P.x = V.x; P.y = V.y; P.z = V.z; P.vx = 3;
    P.facing = Math.cos(G.carousel.spin.rotation.y + R.i / 6 * Math.PI * 2) > 0 ? 1 : -1;
    if (R.t > 12) { P.y = 0; P.z = 0; endRide(0, 4); }
  } else if (R.type === 'lift') {
    P.x += (UG.lift - P.x) * Math.min(1, dt * 8); P.z += (UG.liftZ - P.z) * Math.min(1, dt * 8);
    const d = R.to - P.y, st = Math.sign(d) * Math.min(Math.abs(d), 3.2 * dt); P.y += st; P.vx = 0;
    if (Math.abs(R.to - P.y) < .001) { P.y = R.to; P.ride = null; P.vy = 0; P.grounded = true; P.jumps = 0; burst(P.x, P.y + .2, P.z, ['#fff', '#9ff7e0'], 10, 2); }
  } else if (R.type === 'wheel') {
    const g = G.wheel.gondolas[R.i]; g.seat.getWorldPosition(V); P.x = V.x; P.y = V.y; P.z = V.z; P.vx = 0;
    R.turned += G.wheel.speedNow * dt;
    if (R.turned > Math.PI * 2 + .2 && P.y < 2) { P.z = 0; endRide(0, 4); }
  }
}

// ---------------- house: doors and stairs ----------------
function enterHouse() {
  const P = player; if (P.ride || P.layer !== '' || Math.abs(P.x - IN.door) > 4) { Sound.click(); return; }
  world.flash = 1; P.layer = 'in'; P.x = IN.exit + .2; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true;
  Sound.tone(520, .25, 'triangle', .05, 1.4); Sound.tone(780, .3, 'triangle', .04, 1.3, .12); snapCamera();
  discover('house', 'Welcome to the Fluffkin House! The stairs go up to the nursery.');
  bringFluffsHome();
}
G.enterHouse = enterHouse;
function leaveHouse() {
  const P = player; if (P.layer !== 'in' || P.y > .1 || Math.abs(P.x - IN.exit) > 3) { Sound.click(); return; }
  world.flash = 1; P.layer = ''; P.stair = null; P.x = IN.door; P.y = 0; P.z = 0; P.vx = P.vy = 0; Sound.tone(440, .2, 'triangle', .05, .7); snapCamera();
}
function startStairs(up) {
  const P = player, S = IN.stair; if (P.stair || P.ride || P.layer !== 'in' || !P.grounded) return;
  P.stair = { k: up ? 0 : 1, step: -1 }; P.x = up ? S.x0 : S.x1; P.y = up ? S.y0 : S.y1; P.vx = P.vy = 0;
  Sound.tone(up ? 520 : 440, .15, 'triangle', .04, 1.2); burst(P.x, P.y + .2, P.z, undefined, 8, 1.5);
  discover(up ? 'stairs-up' : 'stairs-down', up ? 'Walk up the stairs with the arrow buttons!' : 'Walk down the stairs with the arrow buttons!');
}
function updateStairs(dt) {
  const P = player, S = IN.stair, St = P.stair, len = Math.hypot(S.x1 - S.x0, S.y1 - S.y0), upDir = Math.sign(S.x1 - S.x0);
  let h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (stick && stick.active && Math.abs(stick.dy) > 30 && Math.abs(stick.dy) > Math.abs(stick.dx)) h = stick.dy < 0 ? upDir : -upDir; // drag up / down walks the stairs
  if (keys.up) h = upDir; if (keys.down) h = -upDir; // ▲ ▼ walk the stairs too
  if (h) P.facing = h;
  St.k += h * 4 / len * dt;
  if (St.k < 0 || St.k > 1) { const top = St.k > 1; P.stair = null; P.x = (top ? S.x1 : S.x0) + h * .05; P.y = top ? S.y1 : S.y0; P.vx = h * 4; P.vy = 0; P.grounded = true; return; }
  P.x = lerp(S.x0, S.x1, St.k); P.y = lerp(S.y0, S.y1, St.k); P.vx = h * 4; P.grounded = true; P.vy = 0; P.jumps = 0;
  const n = Math.round(St.k * 14); if (n !== St.step) { if (St.step >= 0) Sound.bell(NOTES[n % 8] * (n >= 8 ? 2 : 1), .025); St.step = n; }
}
// door/stair "bubbles": big picture buttons that pop up when you are near
function bubbleTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.96)'; g.strokeStyle = '#ffc531'; g.lineWidth = 8; g.beginPath(); g.arc(64, 60, 52, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(52, 108); g.lineTo(64, 126); g.lineTo(76, 108); g.fill();
  if (kind === 'door' || kind === 'out') { g.fillStyle = '#a15cff'; g.beginPath(); g.roundRect(44, 28, 36, 58, 16); g.fill(); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(72, 60, 4, 0, 7); g.fill(); g.fillStyle = '#ff4f9a'; g.beginPath(); if (kind === 'out') { g.moveTo(104, 58); g.lineTo(86, 44); g.lineTo(86, 72); } else { g.moveTo(84, 58); g.lineTo(102, 44); g.lineTo(102, 72); } g.fill(); }
  else { g.fillStyle = '#e8a464'; for (let i = 0; i < 3; i++) g.fillRect(28 + i * 18, 76 - i * 16, 18, 16 + i * 16); g.fillStyle = '#ff4f9a'; g.beginPath(); const up = kind === 'up'; g.moveTo(96, up ? 26 : 86); g.lineTo(82, up ? 46 : 66); g.lineTo(110, up ? 46 : 66); g.fill(); g.fillRect(91, up ? 44 : 50, 10, 18); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const DOORS = [
  { kind: 'door', layer: '', x: IN.door, y: 0, z: .6, go: enterHouse },
  { kind: 'out', layer: 'in', x: IN.exit, y: 0, z: -2, go: leaveHouse },
  { kind: 'up', layer: 'in', x: IN.stair.x0, y: 0, z: -1.2, go: () => startStairs(true) },
  { kind: 'down', layer: 'in', x: IN.stair.x1, y: IN.f2, z: -1.2, go: () => startStairs(false) },
  { kind: 'down', layer: '', x: 10.2, y: 0, z: .6, go: () => dive() },
  { kind: 'up', layer: '', x: SKY.ladder.x, y: 0, z: .6, go: () => G.startClimb(true) },             // rope ladder up to the sky
  { kind: 'down', layer: '', x: SKY.ladder.x + .6, y: SKY.y, z: .6, go: () => G.startClimb(false) }, // and back down                 // the deep part of the ball pit
  { kind: 'down', layer: '', x: UG.lift, y: 0, z: .6, go: () => G.useLift() },         // glass lift down
  { kind: 'up', layer: '', x: UG.lift, y: UG.floor, z: .6, go: () => G.useLift() },    // glass lift up
  { kind: 'door', layer: '', x: KINGDOM.castle, y: 0, z: -2.6, go: () => kingdom.enterCastle() },          // into the Princess Castle
  { kind: 'out', layer: 'castle', x: 2001.9, y: 0, z: -3.6, go: () => kingdom.leaveCastle() },             // and back out
];
function dive() { const P = player; if (P.ride || P.layer !== '' || Math.abs(P.x - 12.6) > 4 || P.y > 1.5) return; P.x = 12.6; P.vy = -2; P.grounded = false; P.vx = 0; Sound.whoosh(); }
G.useLift = () => {
  const P = player; if (P.ride || P.layer !== '' || Math.abs(P.x - UG.lift) > 2) { Sound.click(); return; }
  const down = P.y > -1; if (!P.grounded) return;
  P.ride = { type: 'lift', to: down ? UG.floor : 0 }; P.vx = P.vy = 0; Sound.tone(down ? 520 : 400, .5, 'sine', .04, down ? .6 : 1.6);
  discover(down ? 'liftdown' : 'liftup', down ? 'Down, down in the glass lift!' : 'Up, up in the glass lift!');
};
G.startClimb = fromBottom => { const P = player, L = SKY.ladder; if (P.ride || P.layer !== '' || Math.abs(P.x - L.x) > 2) return; if (fromBottom && P.y > .5) return; if (!fromBottom && Math.abs(P.y - L.top) > .5) return; P.ride = { type: 'climb', boost: fromBottom ? .2 : 0 }; if (!fromBottom) P.y = L.top - .05; P.vx = P.vy = 0; Sound.tone(440, .15, 'triangle', .04, 1.3); discover('ladder', 'A rope ladder up to the sky! Hold ▲ to climb.'); };
G.tapWhale = () => { const W = G.whale, P = player; if (!P.ride && P.layer === '' && P.y > SKY.y - .6 && Math.abs(P.x - W.g.position.x) < 10) { P.ride = { type: 'whale', u: 0 }; P.vx = P.vy = 0; Sound.whoosh(); discover('whaleride', 'You are riding the sky whale! JUMP to hop off.'); } W.spout = 2.4; Sound.withMusic(() => [0, 4, 7, 4, 2, 0].forEach((n, i) => Sound.bell(NOTES[n % 8] / 2, .05, i * .22))); discover('whale', 'The sky whale sings you a song!'); };
G.bounceUp = () => { const P = player; if (P.ride || Math.abs(P.x - (UG.shaft[0] + UG.shaft[1]) / 2) > 2.5 || P.y > UG.floor + 1.5) return; P.x = (UG.shaft[0] + UG.shaft[1]) / 2; P.y = UG.floor + 1; P.vy = 13.5; P.grounded = false; Sound.boing(); discover('mushroomup', 'Boing! Back up into the ball pit. Swim to the top!'); };
G.singCrystal = k => { k.lit = 1; k.cd = 1; Sound.withMusic(() => { Sound.bell(NOTES[k.i % 8] / 2, .06); Sound.bell(NOTES[(k.i + 2) % 8], .025, .08); }); burst(k.x, UG.floor + 1.5, -1.4, [k.c, '#fff'], 10, 2); discover('crystal', 'Singing crystals! Tap them or walk past them.'); };
G.tapGem = k => { k.spin = 1.5; Sound.twinkle(); Sound.bell(NOTES[(k.i * 2) % 8], .04); burst(k.x, k.y + .5, -.6, [RAINBOW[k.i], '#fff'], 14, 2.5); discover('gem', 'Sparkly gems!'); };
DOORS.forEach(d => { d.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(d.kind), depthTest: false })); d.sprite.scale.set(1.2, 1.2, 1); d.sprite.renderOrder = 10; d.sprite.userData.tap = d.go; d.sprite.visible = false; scene.add(d.sprite); });
function nearDoor() { const P = player; if (P.ride || P.stair) return null; return DOORS.find(d => d.layer === P.layer && Math.abs(P.x - d.x) < (world.comfort?.relaxed ? 2.2 : 1.6) && Math.abs(P.y - d.y) < .3); }

// ---------------- hint arrow (picture-only guidance) ----------------
const hint = new THREE.Group(); hint.userData.dynamic = true; scene.add(hint); // (build 33: it moves to whatever you can use; never part of a scenery slice)
{ const c = new THREE.Mesh(new THREE.ConeGeometry(.28, .55, 20), toy('#ffd84a', { em: '#ffb000', ei: .5 })); c.rotation.x = Math.PI; hint.add(c); const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 10, 24), toy('#ff6fae', { em: '#ff6fae', ei: .4 })); r.position.y = .45; r.rotation.x = Math.PI / 2; hint.add(r); }
function updateHint(t) {
  const P = player; let best = null, bd = 13;
  if (!P.ride && !P.stair) for (const it of G.interact) { if (it.layer !== P.layer || world.disc.has(it.disc) || Math.abs(it.y - P.y) > 4 || (it.need && !it.need())) continue; const d = Math.abs(it.x - P.x); if (d < bd) { bd = d; best = it; } }
  const actionable = actionTarget(); G.actionTarget=actionable; if (actionable) best = { ...actionable, hintY: actionable.hintY || 2.4 };
  const door = nearDoor(); if (door) best = { x: door.x, y: door.y, hintY: 3.1 };
  hint.visible = !!best;
  if (best) { hint.position.set(best.x, best.y + best.hintY + (world.comfort?.calm ? 0 : Math.sin(t * 4) * .15), .3); hint.rotation.y = world.comfort?.calm ? 0 : t * 2; }
}

// ---------------- input ----------------
const keys = { left: false, right: false, scale: 1 };
let swimT = .38; // holding ▲ while swimming keeps swimming up
// ---- DRAG TO MOVE: put a finger down on the left side and slide it the way to go ----
// sideways = walk (a small slide walks slowly, a bigger slide walks normally; never faster),
// up = jump / go up the stairs or lift / swim up (hold to keep swimming), down = dive / go down.
// A quick tap without sliding still taps whatever is there.
let stick = null;
const STICK_R = 55;
function stickUI(show) { const st = $('stick'); st.classList.toggle('show', show); if (show) { st.style.left = stick.x0 + 'px'; st.style.top = stick.y0 + 'px'; } }
function stickMove(e) {
  const dx = e.clientX - stick.x0, dy = e.clientY - stick.y0, d = Math.hypot(dx, dy);
  if (!stick.active && d > 14) { stick.active = true; stickUI(true); $('dragHint').classList.add('gone'); discover('drag'); }
  if (!stick.active) return;
  stick.dx = dx; stick.dy = dy;
  const k = Math.min(1, STICK_R / Math.max(d, 1)); $('knob').style.transform = `translate(${dx * k}px,${dy * k}px)`;
  const ax = Math.abs(dx); keys.right = dx > 14; keys.left = dx < -14; keys.scale = clamp((ax - 14) / 45, .35, 1);
  if (dy < -45 && !stick.upFired && -dy > ax * .6) { stick.upFired = true; upAction(); }
  if (dy > -25) stick.upFired = false;
  if (dy > 45 && !stick.downFired && dy > ax * .6) { stick.downFired = true; downAction(); }
  if (dy < 25) stick.downFired = false;
}
function stickEnd() { keys.left = keys.right = false; keys.scale = 1; stickUI(false); $('knob').style.transform = ''; stick = null; }
function upAction() {
  const P = player; if (!started || G.activityOpen || P.stair) return;
  const d = nearDoor(); if (d && d.kind !== 'down') { d.go(); return; } // up at a door goes in/out; at the bottom of stairs or the lift goes up
  jump();
}
function downAction() {
  const P = player; if (P.ride && P.ride.type === 'kart') { parkKart(); return; }
  if (P.ride && P.ride.type === 'train') { train.hopOff(); return; }
  if (!started || P.stair || P.ride) return;
  const d = nearDoor(); if (d && d.kind === 'down') { d.go(); return; }
  if (P.layer === '' && P.grounded && P.y < .1 && P.x > 8.4 && P.x < 15.6) { dive(); return; } // anywhere in the ball pit: dive into the deep part
  creature.cheer(); // a little squat
}
// arrow buttons: hold ◀ ▶ to walk; ▲ ▼ do up/down things (go in, stairs, ladder, lift, swim up, dive)
// (build 23) the arrow pad steers like a joystick: put a thumb on any arrow and slide it around the pad to change
// direction without lifting. "Up" (go in / stairs) needs a clearly upward thumb, so a sideways slide never goes through a door.
const padSet = {}; let padPointer = null;
function padSteer(e) {
  const r = document.querySelector('.dpad').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, dead = r.width * .11;
  const H = Math.abs(dx) > dead && Math.abs(dx) > Math.abs(dy) * .6, V = Math.abs(dy) > dead && Math.abs(dy) > Math.abs(dx) * 1.2;
  padSet.left(H && dx < 0); padSet.right(H && dx > 0); padSet.up(V && dy < 0); padSet.down(V && dy > 0);
}
function hold(id, key, onPress) {
  const el = $(id); const set = v => { if (keys[key] === v) return; keys[key] = v; el.classList.toggle('pressed', v); if (v && onPress) onPress(); if (v) G.walkTo = null; };
  padSet[key] = set;
  el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) { } Sound.unlocked = true; if (key === 'left' || key === 'right') keys.scale = 1; padPointer = e.pointerId; set(true); });
  el.addEventListener('pointermove', e => { if (e.pointerId === padPointer) padSteer(e); }); // (follows the finger, even through the middle of the pad)
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, e => { if (e.pointerId !== padPointer) return; padPointer = null; for (const k of ['left', 'right', 'up', 'down']) padSet[k] && padSet[k](false); }));
}
hold('leftBtn', 'left'); hold('rightBtn', 'right'); hold('upBtn', 'up', () => upAction()); hold('downBtn', 'down', () => downAction());
const press = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlocked = true; $(id).classList.add('pressed'); setTimeout(() => $(id).classList.remove('pressed'), 140); fn(); });
press('jumpBtn', jump); press('pawBtn', doAction);
addEventListener('keydown', e => { if (e.repeat || G.activityOpen) return; if (e.key === 'ArrowLeft') keys.left = true; if (e.key === 'ArrowRight') keys.right = true; if (e.key === ' ') jump(); if (e.key === 'ArrowUp') { keys.up = true; upAction(); } if (e.key === 'ArrowDown') { keys.down = true; downAction(); } if (e.key === 'e' || e.key === 'Enter') doAction(); });
addEventListener('keyup', e => { if (e.key === 'ArrowLeft') keys.left = false; if (e.key === 'ArrowRight') keys.right = false; if (e.key === 'ArrowUp') keys.up = false; if (e.key === 'ArrowDown') keys.down = false; });
addEventListener('blur', () => { if (stick) stickEnd(); keys.left = keys.right = keys.up = keys.down = false; document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed')); });

function jump() {
  const P = player; if (!started || G.activityOpen || P.stair) return;
  if (P.ride && P.ride.type === 'climb') { P.ride.boost = .25; return; }
  if (P.ride && P.ride.type === 'train') { train.whistle(); return; }
  if (P.ride && P.ride.type === 'kart') { if (P.ride.hop === 0) { P.ride.hopV = 7.5; Sound.boing(); discover('kartjump', 'Kart jump!'); } return; }
  if (P.ride) { if (P.ride.type === 'slide') return; P.y = Math.max(P.y, 0); const z = P.z; endRide(P.ride.type === 'carousel' ? 3 * P.facing : 0, 7); P.z = z; Sound.jump(1); return; }
  if (P.swim) { P.vy = 5.6; Sound.tone(420 + Math.random() * 120, .12, 'sine', .05, 1.6); burst(P.x, P.y + .3, P.z, ['#65dcec', '#ffda68', '#ff67ab', '#fff'], 6, 1.5); discover('swim', 'Swim, swim! Tap JUMP to swim up.'); return; }
  if (P.jumps < 2) { const J = CREATURES[P.creature].jump; P.vy = J[P.jumps] * (world.comfort?.relaxed ? 1.08 : 1); P.jumps++; P.grounded = false; Sound.jump(P.jumps); burst(P.x, P.y + .1, P.z, ['#ffec83', '#fff', '#a9efff'], 8, 1.5); if (P.jumps === 2) discover('doublejump', 'Double jump! Reach the high places.'); }
}
function doAction() {
  const P = player; if (!started || G.activityOpen || P.stair) return;
  if (P.ride && P.ride.type === 'kart') { parkKart(); return; }
  if (P.ride && P.ride.type === 'train') { train.hopOff(); return; }
  if (P.ride) { jump(); return; }
  const d = nearDoor(); if (d) { d.go(); return; }
  const best = actionTarget();
  if (best) { best.run(); return; }
  creature.tickle(); Sound.giggle(); burst(P.x, P.y + 2, P.z, ['#ff8fc8', '#ffd84a', '#ff6fae'], 10, 2);
}
// The prompt and PAW share exactly the same target selection.
function actionTarget() {
 const P=player; let best=null, distance=world.comfort?.relaxed?4.4:3.2;
 if(P.ride||P.stair)return null;
 for(const it of G.interact){if(it.layer!==P.layer||(it.need&&!it.need()))continue;const d=Math.abs(it.x-P.x);if(d<distance&&Math.abs((it.y||0)-P.y)<3){distance=d;best=it;}}
 return best;
}
let pawPrompt='';
function updateActionPrompt(){
 const d=nearDoor(),it=G.actionTarget,ride=!!player.ride;
 const icon=ride?'⏏️':d?'🚪':it?.icon||(it?.disc?.startsWith('corner_')?'📖':it?.disc?.includes('pet')?'💖':it?.disc==='paint'?'🎨':'🐾');
 const label=ride?'Hop off':d?'Enter or use doorway':it?.action||it?.label||(it?.disc?.startsWith('corner_')?'Play a learning game':'Play with the nearby toy');
 if(pawPrompt!==label+icon){pawPrompt=label+icon;$('pawBtn').setAttribute('aria-label',label);$('pawLabel').textContent=icon;}
 G.actionTarget=it;
}
// tapping / painting in the world
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let painting = null;
function pointerRay(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); }
function nearPaint() { const P = player; return P.layer === '' && P.y > -.5 && P.y < 3 && P.x > G.paint.x1 && P.x < G.paint.x2 && !P.ride; }
canvas.addEventListener('pointerdown', e => {
  if (!started || G.activityOpen) return; Sound.unlocked = true; pointerRay(e);
  if (nearPaint()) { const h = ray.intersectObject(G.paint.mesh)[0]; if (h && !ray.intersectObjects(DOORS.map(d => d.sprite).filter(s => s.visible)).length) { painting = { id: e.pointerId, last: h.uv.clone() }; paintAt(h.uv, h.uv); canvas.setPointerCapture(e.pointerId); discover('paint', 'Paint with your finger! Pick a colour below.'); return; } }
  if (false && !stick && e.clientX < innerWidth * .5) { stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), active: false, dx: 0, dy: 0, cx: e.clientX, cy: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (_) { } return; }
  worldTap(e);
});
// (build 23) forgiving taps: if the finger misses, look around it (small fingers rarely hit the exact centre);
// every successful tap gets a little bounce, a sparkle and a pop. Tapping empty ground walks you there.
const bounces = [];
function bounceObj(o) { if (!o || !o.scale || bounces.some(b => b.o === o) || (G.life && G.life.agents.some(a => a.root === o))) return; bounces.push({ o, t: 0, s0: o.scale.clone() }); }
function tapAt(cx, cy, ring) {
  pointerRay({ clientX: cx, clientY: cy });
  const targets = [creature.root, ...G.taps, ...bubbles.map(b => b.m), ...DOORS.filter(d => d.sprite.visible).map(d => d.sprite)];
  const hits = ray.intersectObjects(targets, true);
  // tapping your creature always tickles it, even when it stands behind balls or bubbles
  if (!ring && hits.some(h => h.object.userData.creature) && !hits.some(h => h.object.isSprite)) { creature.tickle(); Sound.giggle(); burst(player.x, player.y + 1.8, player.z, ['#ff8fc8', '#ffd84a', '#ff6fae'], 10, 2); discover('tickle', 'Hee hee! That tickles!'); return true; }
  for (const h of hits) {
    let o = h.object; while (o && !o.userData.tap && !o.userData.creature) o = o.parent;
    if (!o || (ring && o.userData.creature)) continue;
    if (o.userData.creature) { creature.tickle(); Sound.giggle(); burst(player.x, player.y + 1.8, player.z, ['#ff8fc8', '#ffd84a', '#ff6fae'], 10, 2); discover('tickle', 'Hee hee! That tickles!'); return true; }
    o.userData.tap(h); bounceObj(o); burst(h.point.x, h.point.y, h.point.z, ['#ffffff', '#ffe36e', '#ff9fd8'], 5, 1.2); Sound.tone(880, .06, 'sine', .035, 1.5); return true;
  }
  return false;
}
function worldTap(e) {
  if (tapAt(e.clientX, e.clientY)) return;
  for (const r of [22, 44]) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; if (tapAt(e.clientX + Math.cos(a) * r, e.clientY + Math.sin(a) * r, true)) return; }
  walkToTap(e);
}
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), GP = new THREE.Vector3();
function walkToTap(e) {
  const P = player; if (!started || P.ride || P.stair || P.swim) return;
  pointerRay(e); groundPlane.constant = -(P.y + .05);
  if (!ray.ray.intersectPlane(groundPlane, GP) || Math.abs(GP.x - P.x) < .6 || Math.abs(GP.x - P.x) > 22) return;
  G.walkTo = GP.x; G.walkStuck = 0; G.walkLastX = P.x;
  burst(GP.x, P.y + .15, P.z + .3, ['#ffffff', '#9fe6ff'], 6, 1); Sound.tone(660, .05, 'sine', .03, 1.3);
}
canvas.addEventListener('pointermove', e => { if (stick && e.pointerId === stick.id) { stickMove(e); return; } if (!painting || e.pointerId !== painting.id) return; pointerRay(e); const h = ray.intersectObject(G.paint.mesh)[0]; if (h) { paintAt(painting.last, h.uv); painting.last = h.uv.clone(); } });
['pointerup', 'pointercancel'].forEach(n => canvas.addEventListener(n, e => {
  if (stick && e.pointerId === stick.id) { const tapped = !stick.active && performance.now() - stick.t0 < 1500 && n === 'pointerup'; /* a touch that didn't slide is a tap */ const at = { clientX: stick.cx, clientY: stick.cy }; stickEnd(); if (tapped) worldTap(at); return; }
  if (painting && e.pointerId === painting.id) { painting = null; saveSoon(); }
}));
function paintAt(a, b) {
  const g = G.paint.ctx, W = G.paint.canvas.width, H = G.paint.canvas.height;
  let c = world.paintColor; if (c === 'rainbow') { world.rainbowHue = (world.rainbowHue + 6) % 360; c = `hsl(${world.rainbowHue},90%,60%)`; }
  const erase = c === 'erase'; if (erase) c = '#fffaf2';
  g.strokeStyle = c; g.lineWidth = erase ? 60 : 26; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(a.x * W, (1 - a.y) * H); g.lineTo(b.x * W, (1 - b.y) * H); g.stroke();
  if (erase) { G.paint.tex.needsUpdate = true; return; }
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 7; g.beginPath(); g.moveTo(a.x * W - 5, (1 - a.y) * H - 5); g.lineTo(b.x * W - 5, (1 - b.y) * H - 5); g.stroke();
  G.paint.tex.needsUpdate = true; world.painted = true;
  if (Math.random() < .2) Sound.tone(300 + Math.random() * 300, .05, 'sine', .015, 1.2);
}
// paint palette (appears only by the paint wall)
const PAINTS = ['#ff4f9a', '#ff9a2e', '#ffd23f', '#3cc46e', '#3d9bff', '#a15cff', '#ffffff', 'rainbow', 'erase', 'clear'];
// (🧽 = eraser: rub out paint, or tap a coloured part to make it white again; 🗑️ = start the picture over)
function clearBoard() { if (nearPaint()) { const g = G.paint.ctx; g.fillStyle = '#fffaf2'; g.fillRect(0, 0, G.paint.canvas.width, G.paint.canvas.height); G.paint.tex.needsUpdate = true; world.painted = false; saveSoon(); } else if (meadow.nearColor(player)) meadow.clearColoring(player); Sound.whoosh(); discover('clearboard', 'A clean page to start again!'); }
PAINTS.forEach(c => { const b = document.createElement('button'); b.className = 'swatch' + (c === world.paintColor ? ' selected' : '') + (c === 'erase' || c === 'clear' ? ' tool' : ''); b.style.background = c === 'rainbow' ? 'conic-gradient(#ff4f9a,#ffd23f,#3cc46e,#3d9bff,#a15cff,#ff4f9a)' : c === 'erase' || c === 'clear' ? '#ffffff' : c; if (c === 'erase' || c === 'clear') b.textContent = c === 'erase' ? '🧽' : '🗑️'; b.setAttribute('aria-label', c); b.addEventListener('pointerdown', e => { e.preventDefault(); if (c === 'clear') { clearBoard(); b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 150); return; } world.paintColor = c; if (c === 'erase') discover('eraser', 'The eraser! Rub out what you drew.'); document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('selected', s === b)); Sound.click(); }); $('paintTools').appendChild(b); });

// ---------------- block tray (Block Builder) ----------------
[...BLOCKS.map((b, i) => [i, b]), [ERASE, { icon: '🧽', c: '#ffffff' }]].forEach(([i, b]) => {
  const el = document.createElement('button'); el.className = 'blk' + (i === (world.buildType ?? 0) ? ' selected' : ''); el.dataset.t = i;
  if (b.icon) el.textContent = b.icon; else el.style.background = b.c;
  el.addEventListener('pointerdown', e => { e.preventDefault(); world.buildType = i; document.querySelectorAll('.blk').forEach(x => x.classList.toggle('selected', x === el)); Sound.click(); });
  $('buildTools').appendChild(el);
});
// ---------------- creature style panel (colours + sparkle trail) ----------------
const STYLE_COLS = ['#ff9fd2', '#9fe6ff', '#b58cff', '#ffd45e', '#7be08a', '#ff9a6b', '#ffffff'];
function renderStyle() {
  const row = $('styleCols'); row.innerHTML = ''; const k = player.creature, cur = (world.styles || {})[k] || CREATURES[k].body;
  [CREATURES[k].body, ...STYLE_COLS.filter(c => c !== CREATURES[k].body)].forEach(c => {
    const b = document.createElement('button'); b.className = 'spCol' + (c === cur ? ' selected' : ''); b.style.background = c;
    b.addEventListener('pointerdown', e => { e.preventDefault(); world.styles = world.styles || {}; world.styles[k] = c; setCreature(k); creature.cheer(); Sound.chime(); renderStyle(); discover('style', 'You changed your colour!'); save(); });
    row.appendChild(b);
  });
  $('sparkleBtn').classList.toggle('on', !!world.sparkle);
}
$('styleBtn').addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlocked = true; renderStyle(); $('stylePanel').classList.add('show'); Sound.click(); });
$('styleDone').addEventListener('pointerdown', e => { e.preventDefault(); $('stylePanel').classList.remove('show'); Sound.click(); });
$('sparkleBtn').addEventListener('pointerdown', e => { e.preventDefault(); world.sparkle = !world.sparkle; renderStyle(); Sound.twinkle(); discover('sparkle', 'A sparkle trail!'); save(); });

// ---------------- physics ----------------
const GRAV = 24;
function bounds() { const P = player; return P.layer === 'in' ? [IN.ox + .8, IN.ox + IN.w - .8] : P.layer === 'castle' ? [G.castleIn.ox + .8, G.castleIn.ox + G.castleIn.w - .8] : P.y < UG.ceil - .1 ? [UG.x0 + .6, UG.x1 - .6] : [EXP.xMin, EXP.x1]; }
function updatePlayer(dt) {
  const P = player;
  if (P.stair) { updateStairs(dt); P.z += (IN.stair.z - P.z) * Math.min(1, dt * 8); return; }
  if (P.ride) { updateRide(dt); return; }
  let h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (!h && G.walkTo != null) { // tap-to-walk: head for the tapped spot; stop on arrival or if something is in the way
    const d = G.walkTo - P.x; G.walkStuck = Math.abs(P.x - G.walkLastX) < dt * .5 ? G.walkStuck + dt : 0; G.walkLastX = P.x;
    if (Math.abs(d) < .3 || G.walkStuck > .5 || P.ride || P.stair) G.walkTo = null; else h = Math.sign(d);
  }
  if (h) P.facing = h;
  // swimming in the deep part of the ball pit
  const swim = P.layer === '' && inShaftX(P.x) && P.y < .45 && P.y > UG.swimBottom;
  if (swim && !P.swim && P.vy <= 0) P.vy = -3.2; // plunge in with a splash
  if (swim && !P.swim) { Sound.tone(300, .25, 'sine', .05, .6); burst(P.x, Math.max(P.y, 0) + .6, 0, ['#65dcec', '#ffda68', '#b587ff', '#ff67ab'], 12, 2); discover('dive', 'The deep part! Swim down through the balls to a secret place. JUMP swims up!'); }
  P.swim = swim; if (swim) P.fromShaft = true;
  const crawl = P.layer === '' && P.y < UG.ceil - .1 && P.x > UG.tunnel[0] - .3 && P.x < UG.tunnel[1] + .3 && P.y < UG.tunnelCeil - .5;
  if (crawl && !P.crawl) discover('crawl', 'A tiny tunnel! Crawl through it.');
  P.crawl = crawl;
  const top = (swim ? 2.2 : crawl ? 3.4 : 5.8) * keys.scale, accel = P.grounded ? 62 : 30; /* (build 25: snappier start and stop) */ if (P.driftT > 0 && !h && !P.grounded) { P.driftT -= dt; P.vx = P.drift; } else { P.driftT = 0; P.vx += clamp(h * top - P.vx, -accel * dt, accel * dt); }
  const [x1, x2] = bounds(); const ox = P.x; P.x = clamp(P.x + P.vx * dt, x1, x2); if (P.x <= x1 || P.x >= x2) P.vx = 0;
  // solid things: you can't walk through them. Low ones (up to 1.25 high) you hop up onto by yourself.
  for (const s of G.solids) {
    if (s.layer !== P.layer || P.y >= s.top - .02 || P.y + 1.4 <= (s.bottom ?? 0)) continue;
    const L = s.a - .35, Rr = s.b + .35;
    if (P.x > L && P.x < Rr) {
      const fromLeft = ox <= L + .001, fromRight = ox >= Rr - .001;
      if (!fromLeft && !fromRight) continue; // already inside (e.g. just landed): don't trap
      P.x = fromLeft ? L : Rr;
      if ((P.grounded || P.swim) && s.top - P.y <= 1.25 && Math.sign(P.vx) === (fromLeft ? 1 : -1)) { P.vy = Math.sqrt(2 * 24 * (s.top - P.y + .35)); P.grounded = false; P.jumps = 1; P.hopX = fromLeft ? 1 : -1; }
      else P.vx = 0;
    }
  }
  P.z += (P.groundZ - P.z) * Math.min(1, dt * 6);
  const oldY = P.y, wasG = P.grounded;
  if (swim) { P.vy -= 5 * dt; if (P.vy < -.95) P.vy += (-.95 - P.vy) * Math.min(1, dt * 2); } else P.vy -= GRAV * dt; // in the deep ball pit you sink slowly
  P.y += P.vy * dt; P.grounded = false;
  // land on the HIGHEST surface you reach (so a bouncy puff on top of a cloud wins over the cloud)
  let land = null, landStep = false;
  if (P.vy <= 0) for (const z of G.platforms) {
    if (z.layer !== P.layer || P.x < z.a || P.x > z.b) continue;
    const stepUp = z.step && wasG && z.y > oldY - .01 && z.y - oldY < (z.stepMax || .5);
    if (((oldY >= z.y - .02 && P.y <= z.y) || stepUp) && (!land || z.y > land.y)) { land = z; landStep = stepUp; }
  }
  if (land) {
    const z = land, stepUp = landStep;
    {
      const impact = -P.vy, fromShaft = P.fromShaft; P.y = z.y; P.vy = 0; P.grounded = true; P.groundZ = z.z || 0;
      if (z.onLand && (!wasG || stepUp)) z.onLand(z);
      if (z.tramp) { P.vy = 13.5; P.grounded = false; P.jumps = 1; world.trampT = 1; Sound.boing(); discover('trampoline', 'Boing! Super bounce!'); }
      else if (z.upShaft && P.fromShaft) { P.fromShaft = false; P.x = z.b + .45; P.vx = 2.5; P.vy = 3; P.grounded = false; P.facing = 1; Sound.land(); Sound.giggle(); discover('underground', 'A secret underground world! Explore the caves.'); } // soft landing when you sink in from the ball pit
      else if (z.pad) { if (z.upShaft) discover('mushroomup', 'Boing! Back up into the ball pit. Swim to the top!'); P.vy = z.bounce || 15.5; if (z.nudge) { P.vx = z.nudge; P.driftT = 1.1; P.drift = z.nudge; P.hopX = 0; } P.grounded = false; P.jumps = 1; Sound.boing(); burst(P.x, z.y + .2, 0, ['#9ff7c8', '#fff'], 10, 2); if (z.top) z.top.scale.y *= .7; discover('springpad', 'Boing! Spring pads bounce you up high!'); }
      else if (z.sofa && impact > 3) { P.vy = 9; P.grounded = false; P.jumps = 1; Sound.boing(); discover('sofa', 'A bouncy sofa!'); }
      else if (impact > 6) Sound.land();
    }
  }
  // the floor: normally y 0; under the floor (or down the deep shaft) it is the underground floor
  const gy = P.layer !== '' ? 0 : (P.y > UG.ceil + .05 && !inShaftX(P.x)) ? 0 : UG.floor;
  if (P.y <= gy) { if (!P.grounded && P.vy < -6) Sound.land(); P.y = gy; P.vy = 0; P.grounded = true; P.groundZ = 0; if (gy < 0) discover('underground', 'A secret underground world! Explore the caves.'); }
  if (P.layer === '' && P.y < UG.ceil - .05) { // underground ceilings (low in the crawl tunnel, open under the shaft)
    const tun = P.x > UG.tunnel[0] && P.x < UG.tunnel[1], c = tun ? UG.tunnelCeil : inShaftX(P.x) ? null : UG.ceil, Hh = tun ? .9 : 1.5;
    if (c != null && P.y + Hh > c) { P.y = c - Hh; P.vy = Math.min(P.vy, 0); }
  }
  if (P.hopX && !P.grounded) { P.vx = Math.max(P.vx * P.hopX, 3.2) * P.hopX; } else P.hopX = 0;
  if (P.layer === 'in') { const c = P.y < IN.f2 - .05 ? IN.ceil1 : IN.ceil2; if (P.y + 1.5 > c) { P.y = c - 1.5; P.vy = Math.min(P.vy, 0); } }
  if (P.grounded) { P.jumps = 0; P.fromShaft = false; }
  // walk off the top of the slide tower onto the slide
  if (P.layer === '' && P.grounded && Math.abs(P.y - 3.8) < .01 && P.x > 23.2 && P.vx > .5) startSlide();
  if (P.layer === '' && P.grounded && Math.abs(P.y - SKY.y) < .01 && P.x > SKY.b - .15 && P.vx > .5) startSlide(G.skySlide);
  for (const se of G.slideEdges || []) if (!P.ride && P.layer === '' && P.grounded && Math.abs(P.y - se.y) < .01 && P.x > se.x && P.vx > .5) { startSlide(se.path); if (se.disc) discover(se.disc, se.msg); }
  // secret star
  if (!world.secret && P.layer === '' && Math.hypot(P.x - G.secretStar[0], P.y + .8 - G.secretStar[1]) < 1.1) { world.secret = true; Sound.chime(); toast('🌟 You found the secret star!'); burst(G.secretStar[0], G.secretStar[1], 0, ['#ffd84a', '#fff'], 40, 4); save(); }
}

// ---------------- camera ----------------
const camT = { x: 5, y: 1.6, look: 0 };
function viewHalfW(dist) { return Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * camera.aspect; }
const CAM_DIST = 7.6; // build 16: a little closer, to show the characters
function camTargetX() {
  const P = player, hw = viewHalfW(CAM_DIST) * .92;
  const x = P.x + camT.look;
  return P.layer === 'in' ? clamp(x, IN.ox + hw, IN.ox + IN.w - hw) : P.layer === 'castle' ? clamp(x, G.castleIn.ox + Math.min(hw, G.castleIn.w / 2), G.castleIn.ox + G.castleIn.w - Math.min(hw, G.castleIn.w / 2)) : clamp(x, EXP.xMin - 4 + hw, EXP.x1 + 4 - hw);
}
function snapCamera() { camT.look = player.ride ? 0 : player.facing * 1.8; camT.x = camTargetX(); camT.y = player.y; if (G.life && G.life.wake) G.life.wake(camT.x); }
// build 17: frame-rate-independent smoothing (the same camera feel at 30, 60 or 120 frames a second)
const ease = (dt, rate) => 1 - Math.exp(-dt * rate);
function updateCamera(dt) {
  const P = player;
  camT.look += ((P.ride ? (P.ride.type === 'train' ? P.facing * 2.6 : 0) : P.facing * 1.8) - camT.look) * ease(dt, 3);
  camT.x += (camTargetX() - camT.x) * ease(dt, 8); // (build 25: the camera keeps up more tightly, so the controls don't feel delayed)
  camT.y += (P.y - camT.y) * ease(dt, (P.grounded ? 4 : 2));
  const y = camT.y;
  // build 16: near the castle the camera steps back and looks up, so you can see the whole castle
  // (also a little at the Marble Machine, so its top ramps stay clear of the buttons)
  const castleK = P.layer === '' && !P.ride ? Math.max(Math.max(0, 1 - Math.abs(P.x - KINGDOM.castle) / 9), Math.max(0, 1 - Math.abs(P.x - 332) / 7) * .45) : 0; camT.cz = (camT.cz ?? 0) + (castleK - (camT.cz ?? 0)) * ease(dt, 1.5);
  const kz = P.ride && (P.ride.type === 'kart' || P.ride.type === 'train' || P.ride.type === 'whale') ? P.z : 0; camT.z = (camT.z ?? 0) + (kz - (camT.z ?? 0)) * ease(dt, 3);
  camera.position.set(camT.x, y + 2.15 + Math.max(0, -camT.z) * .25 + camT.cz * 1.2, CAM_DIST + camT.z + camT.cz * 3.2); camera.lookAt(camT.x, y + 1.15 + camT.cz * 2.4, camT.z - camT.cz * 2);
  if (G.shake > 0) { G.shake = Math.max(0, G.shake - dt); camera.position.x += (Math.random() - .5) * G.shake * .5; camera.position.y += (Math.random() - .5) * G.shake * .5; } // a little stomp shake
  if (G.camOverride) { const o = G.camOverride; camera.position.set(...o.pos); camera.lookAt(...o.look); } // (close-up camera for checking models)
  sky.position.x = camT.x; // the sky dome travels with you (the world is wider than the dome now)
  { const tex = 26 / 2048, sx = Math.round(camT.x / tex) * tex, sy = Math.round(Math.max(0, camT.y) / tex) * tex; sun.position.set(sx - 7, 16 + sy, 10); sun.target.position.set(sx, sy, 0); } // (snapped to shadow texels: no shimmering)
}

// ---------------- world animation ----------------
function updateWorldAnim(dt, t) {
  const C = G.carousel, riding = player.ride && player.ride.type === 'carousel';
  C.speed += ((riding ? 1.1 : .25) - C.speed) * Math.min(1, dt * .8); C.spin.rotation.y += C.speed * dt;
  C.mounts.forEach((m, i) => { m.ride.position.y = Math.sin(t * 2.2 + i * 1.3) * .35 + .2; });
  const W = G.wheel, wr = player.ride && player.ride.type === 'wheel'; W.speedNow = wr ? .55 : .12; W.angle += W.speedNow * dt; W.wheel.rotation.z = W.angle;
  W.gondolas.forEach((g, i) => { const a = W.angle + i / 10 * Math.PI * 2; g.g.position.set(Math.sin(a) * W.r, -Math.cos(a) * W.r, .9); });
  if (world.trampT > 0) { world.trampT -= dt; G.tramp.scale.y = 1 - Math.sin(world.trampT * 20) * world.trampT * .8; }
  G.xylo.forEach(k => { k.lit = Math.max(0, k.lit - dt * 2); k.key.material.emissiveIntensity = k.lit * .8; k.key.position.y = k.key.userData.y0 - k.lit * .06; });
  G.orbs.forEach(o => { o.zap = Math.max(0, o.zap - dt); o.o.material.emissiveIntensity = .8 + Math.sin(t * 3) * .2 + o.zap * 2; o.o.scale.setScalar(1 + o.zap * .15); });
  if (world.wandT > 0) { world.wandT -= dt; G.bubbleWand.rotation.x = world.wandT * 6; }
  G.fire.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 9 + i * 2) * .25; f.scale.x = 1 - Math.sin(t * 9 + i * 2) * .1; });
  world.drumT = Math.max(0, world.drumT - dt); world.mobileT = Math.max(0, world.mobileT - dt); world.wake = world.wake.map(w => Math.max(0, w - dt));
  G.mobile.rotation.y += dt * (world.mobileT > 0 ? 3 : .3);
  G.platforms.forEach(z => { if (z.top) z.top.scale.y += (z.top.userData.s0 - z.top.scale.y) * Math.min(1, dt * 8); });
  const P0 = player;
  for (const k of G.crystals) { if (P0.y < UG.ceil && Math.abs(P0.x - k.x) < .45 && k.cd <= 0 && P0.grounded) G.singCrystal(k); k.cd = Math.max(0, k.cd - dt); k.lit = Math.max(0, k.lit - dt * 1.5); k.m.material.emissiveIntensity = .25 + k.lit * 1.2; k.m.rotation.y += dt * (.3 + k.lit * 6); }
  for (const g of G.gems) { g.spin = Math.max(0, g.spin - dt); g.g.rotation.y += dt * (1 + g.spin * 10); g.g.position.y = g.y + .45 + Math.sin(t * 2 + g.i) * .08 + g.spin * .3; }
  if (!(P0.ride && P0.ride.type === 'lift')) { const target = P0.y < -1 ? UG.floor : 0; G.liftPad.position.y += (target - .07 - G.liftPad.position.y) * Math.min(1, dt * 3); } else G.liftPad.position.y = P0.y - .07;
  { const W = G.whale; W.spout = Math.max(0, W.spout - dt); if (!(player.ride && player.ride.type === 'whale')) { const k = Math.min(1, dt * 2); W.g.position.y += (W.y + Math.sin(t * .8) * .35 - W.g.position.y) * k; W.g.position.x += (W.x + Math.sin(t * .23) * 2 - W.g.position.x) * k; W.g.rotation.z = Math.sin(t * .8) * .05; W.g.rotation.y *= 1 - k; } W.tail.rotation.y = Math.sin(t * 2.2) * .4;
    if (W.spout > 0 && Math.random() < dt * 30) burst(W.g.position.x + 1.4, W.g.position.y + 1.8, W.g.position.z, ['#bfe8ff', '#ffffff', '#9fe6ff'], 3, 2.5); }
  G.skyPuffs.forEach(m => { m.position.y = SKY.y + .25 + Math.sin(t * 2 + m.position.x) * .04; });
  G.grassTime.value = t; windTime.value = t;
  for (let i = bounces.length - 1; i >= 0; i--) { const b = bounces[i]; b.t += dt; const k = b.t / .32; if (k >= 1) { b.o.scale.copy(b.s0); bounces.splice(i, 1); } else b.o.scale.copy(b.s0).multiplyScalar(1 + Math.sin(k * Math.PI) * .1 * (1 - k * .4)); } // (build 23: a little bounce on every tap)
  // (build 22) performance: lights only where you are (underground / indoor room), and far-away grass,
  // bushes and trees are not drawn at all
  poolDt += dt; if (++poolTick % 4 === 0) { updateLightPool(poolDt); poolDt = 0; }
  updateSlices(); // (every frame: cheap, and a jump into the house shows its room at once)
  expansion.update(dt, t, player.layer === '' ? camT.x : -999); // (build 29: stream the new neighbourhoods)
  if (G.updateTrainStrip) G.updateTrainStrip();
  if ((lodTick = (lodTick + 1) % 8) === 0) { for (const it of LOD) { const d = Math.abs(it.x - camT.x); it.o.visible = d < it.r; if (MOBILE && it.parts) { const far = d > 16; if (it.far !== far) { it.far = far; for (const q of it.parts) q.m.geometry = far ? q.lo : q.hi; } } } // (build 28: phones show trees and bushes further than 16 m low-detail)
    for (const f of FUR) { f.mesh.getWorldPosition(V); const near = V.distanceTo(camera.position) < 14; if (f.shells[0] && f.shells[0].visible !== near) for (const s of f.shells) s.visible = near; } }
  G.diveRing.rotation.z = t * .8; G.diveRing.position.y = 1.05 + Math.sin(t * 3) * .08;
  bigStar.visible = !world.secret; bigStar.rotation.y = t * 1.6; bigStar.position.y = G.secretStar[1] + Math.sin(t * 2) * .12;
  // door/stair bubbles
  const near = nearDoor(); DOORS.forEach(d => { d.sprite.visible = d === near; if (d === near) d.sprite.position.set(d.x, d.y + 3.1 + Math.sin(t * 4) * .08, d.z); });
}

// ---------------- save / load ----------------
let saveTimer = 0;
function saveSoon() { saveTimer = 1.2; }
function save() {
  if (G.perfTest || G.erasing) return; // (build 26: the performance test never saves)
  try {
    const d = { adventures: world.adventures, comfort: world.comfort, v: 1, creature: player.creature, x: player.layer === 'in' ? IN.door : player.layer === 'castle' ? KINGDOM.castle : Math.round(player.x * 10) / 10, disc: [...world.disc], bits: [...world.bits], secret: world.secret, fluffs: fluffs.map(f => f.state), sound: Sound.on, learn: world.learn || {}, learnTier: world.learnTier || 1, exp: world.exp || {}, pet: (world.pets || [])[0] || null, pets: world.pets || [], buddies: world.buddies || {}, petStay: world.petStay || [], dinoFollow: world.dinoFollow || [false, false, false], petDraft: world.petDraft || null, balloons: world.balloons || [], build: world.build, colorings: world.colorings, styles: world.styles || {}, sparkle: !!world.sparkle, kart: world.kart, crown: !!world.crown, wand: !!world.wand, dinoEggs: world.dinoEggs };
    if (world.painted) d.paint = G.paint.canvas.toDataURL('image/jpeg', .82);
    else { const old = load(); if (old && old.paint) d.paint = old.paint; }
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
  } catch (e) { }
}
function load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
function restore(d) {
  if (!d) return;
  world.adventures = d.adventures; world.comfort = d.comfort;
  if (CREATURES[d.creature]) player.creature = d.creature;
  if (d.learn && typeof d.learn === 'object' && !Array.isArray(d.learn)) { world.learn = {}; for (const [k, v] of Object.entries(d.learn)) if (v && Number.isFinite(v.level) && Number.isFinite(v.stars)) { const o = world.learn[k] = { level: Math.max(1, Math.min(9, v.level | 0)), stars: Math.max(0, v.stars | 0) }; for (const f of ['s1', 's2', 's3', 'd1', 'd2', 'd3']) if (Number.isFinite(v[f])) o[f] = Math.max(0, Math.min(9, v[f] | 0)); } } // (build 25: learning progress; build 27: per-level ramps)
  if (d.exp && typeof d.exp === 'object') { const e = d.exp, num = v => Number.isFinite(v) ? Math.max(0, Math.min(1e6, v | 0)) : 0; world.exp = Object.assign(world.exp || {}, { gems: Array.isArray(e.gems) ? e.gems.filter(g => /^g\d{1,2}$/.test(g)).slice(0, 40) : [], stickers: Array.isArray(e.stickers) ? e.stickers.filter(q => Array.isArray(q) && q.length === 3 && q.every(Number.isFinite)).slice(-80) : [], chests: num(e.chests), balloons: num(e.balloons), shells: Array.isArray(e.shells) ? e.shells.filter(v => /^s\d$/.test(v)).slice(0, 12) : [], pals: e.pals && typeof e.pals === 'object' ? Object.fromEntries(['crab', 'fox', 'penguin', 'robot', 'frog', 'parrot', 'pig', 'seal'].filter(k => e.pals[k]).map(k => [k, { follow: !!e.pals[k].follow }])) : {} }); } // (build 29; build 30: fill in the SAME object the new areas already hold, never a new one)
  world.learnTier = [1, 2, 3].includes(d.learnTier) ? d.learnTier : 1; // (build 27: learning level, chosen by a grown-up; Super Easy by default)
  const okRec = r => r && typeof r === 'object' && [['col', PET_COLS.length], ['ears', EARS.length], ['tail', TAILS.length], ['pat', PATS.length]].every(([k, n]) => Number.isInteger(r[k]) && r[k] >= 0 && r[k] < n);
  const cleanRec = r => ({ col: r.col, ears: r.ears, tail: r.tail, pat: r.pat });
  if (Array.isArray(d.pets) && d.pets.length <= 5 && d.pets.every(okRec)) world.pets = d.pets.map(cleanRec);
  else if (okRec(d.pet)) world.pets = [cleanRec(d.pet)]; // (saves from before build 10 had one pet)
  if (Array.isArray(d.petStay) && d.petStay.length <= 5) world.petStay = d.petStay.map(v => v === true);
  if (d.buddies && typeof d.buddies === 'object') { world.buddies = {}; for (const k of ['biscuit', 'pom', 'twinkle']) if (d.buddies[k] === true) world.buddies[k] = true; }
  if (Array.isArray(d.dinoFollow) && d.dinoFollow.length === 3 && d.dinoFollow.every(v => typeof v === 'boolean')) world.dinoFollow = d.dinoFollow.slice();
  if (okRec(d.petDraft)) world.petDraft = { col: d.petDraft.col, ears: d.petDraft.ears, tail: d.petDraft.tail, pat: d.petDraft.pat };
  const okCol = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  if (Array.isArray(d.balloons) && d.balloons.length <= 6 && d.balloons.every(okCol)) world.balloons = d.balloons.slice(); else if (okCol(d.balloon)) world.balloons = [d.balloon]; // (older saves had one balloon)
  const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  if (Array.isArray(d.build) && d.build.length === BUILD.cols * BUILD.rows && d.build.every(v => Number.isInteger(v) && v >= -1 && v < BLOCKS.length)) world.build = d.build.slice();
  if (Array.isArray(d.colorings) && d.colorings.length === meadow.PICTURES.length && d.colorings.every((a, n) => Array.isArray(a) && a.length === meadow.PICTURES[n].length && a.every(hex))) world.colorings = d.colorings.map(a => a.slice());
  if (d.styles && typeof d.styles === 'object') { world.styles = {}; for (const k of Object.keys(CREATURES)) if (hex(d.styles[k])) world.styles[k] = d.styles[k]; }
  world.sparkle = d.sparkle === true;
  if (d.kart && [['col', KART_COLS.length], ['shape', 3], ['wheels', 3]].every(([k, n]) => Number.isInteger(d.kart[k]) && d.kart[k] >= 0 && d.kart[k] < n)) world.kart = { col: d.kart.col, shape: d.kart.shape, wheels: d.kart.wheels };
  if (d.crown === true) world.crown = true;
  if (d.wand === true) world.wand = true; // (build 33)
  if (Array.isArray(d.dinoEggs) && d.dinoEggs.length === 3 && d.dinoEggs.every(v => typeof v === 'boolean')) world.dinoEggs = d.dinoEggs.slice();
  if (typeof d.x === 'number' && isFinite(d.x)) player.x = d.x > EXP.x0 + 6 ? clamp(d.x, EXP.x0 + 6, EXP.x1 - 2) : d.x < -6 ? clamp(d.x, EXP.xMin + 2, -6) : clamp(d.x, .5, 301); // (build 29: you can also wake up in the new neighbourhoods)
  (Array.isArray(d.disc) ? d.disc : []).forEach(x => typeof x === 'string' && world.disc.add(x));
  (Array.isArray(d.bits) ? d.bits : []).forEach(i => Number.isInteger(i) && i >= 0 && i < G.bitSpots.length && world.bits.add(i));
  world.secret = d.secret === true;
  if (Array.isArray(d.fluffs)) d.fluffs.forEach((s, i) => { if (fluffs[i] && ['wait', 'follow', 'home'].includes(s)) { fluffs[i].state = s; fluffs[i].px = player.x - 1; fluffs[i].py = 0; } });
  if (d.sound === false) setSound(false);
  if (typeof d.paint === 'string' && d.paint.startsWith('data:image/')) { const img = new Image(); img.onload = () => { G.paint.ctx.drawImage(img, 0, 0, G.paint.canvas.width, G.paint.canvas.height); G.paint.tex.needsUpdate = true; world.painted = true; }; img.src = d.paint; }
}
function setSound(on) { Sound.on = on; $('soundBtn').classList.toggle('muted', !on); }
$('soundBtn').addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlocked = true; setSound(!Sound.on); if (Sound.on) Sound.click(); save(); });

// ---------------- creature portraits (rendered once, in 3D) ----------------
function renderPortraits() {
  // drawn with the main renderer into a corner of the canvas, then copied (no second WebGL context)
  const s = new THREE.Scene(); s.environment = scene.environment; s.environmentIntensity = .7; s.background = new THREE.Color('#fff6ee');
  s.add(new THREE.HemisphereLight('#ffffff', '#c9a6ff', 1.4)); const l = new THREE.DirectionalLight('#fff', 2); l.position.set(2, 4, 5); s.add(l);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 50); cam.position.set(0, 1.3, 4.6); cam.lookAt(0, .95, 0);
  const pr = renderer.getPixelRatio(), css = 128 / pr, px = Math.round(css * pr), out = {};
  const c2 = document.createElement('canvas'); c2.width = c2.height = 128; const g2 = c2.getContext('2d');
  renderer.setScissorTest(true); renderer.setViewport(0, 0, css, css); renderer.setScissor(0, 0, css, css);
  const was = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
  for (const k of Object.keys(CREATURES)) {
    const c = makeCreature(k); s.add(c.root); c.update(.016, { grounded: true, facing: 1, vx: 0, vy: 0 }); c.root.rotation.y = .35;
    renderer.render(s, cam); g2.clearRect(0, 0, 128, 128); g2.drawImage(canvas, 0, canvas.height - px, px, px, 0, 0, 128, 128); out[k] = c2.toDataURL(); s.remove(c.root);
  }
  renderer.shadowMap.enabled = was; renderer.setScissorTest(false); renderer.setViewport(0, 0, canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);
  return out;
}
document.querySelectorAll('.creatureChoice').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlocked = true; setCreature(b.dataset.c); Sound.giggle(); save(); }));
document.querySelectorAll('.introPick').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.introPick').forEach(x => x.classList.toggle('picked', x === b)); setCreature(b.dataset.c); }));

// ---------------- resize + adaptive quality ----------------
let quality = TEST ? .4 : MOBILE ? .75 : 1, slow = 0, ema = 1 / 60;
if (TEST) renderer.shadowMap.enabled = false;
// soft "ambient occlusion" shadows (post.js); off in the light test mode and with ?nopost
const post = makePost(renderer, scene, camera, { mobile: MOBILE }); post.enabled = !TEST && !/[?&]nopost/.test(location.search);
// (build 34b) the picture is sized from the canvas's REAL size on screen. On iPhone (especially the Home Screen app),
// innerWidth/innerHeight can still hold the old, upright size when the phone turns, which drew a tall picture and
// stretched it sideways ("squished"). A cheap check every frame also catches any size change that sent no event.
let sizeW = 0, sizeH = 0;
function screenSize() { const r = canvas.getBoundingClientRect(); return [Math.round(r.width) || innerWidth, Math.round(r.height) || innerHeight]; }
// (build 36) ONE GAME FOR EVERY SCREEN. What kind of device this is (for sensible defaults only; the measured frame
// times still decide the quality): iPadOS reports itself as a Mac, so a Mac with a touch screen is an iPad.
const DEV = (() => { const ua = navigator.userAgent, ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), ios = /iPhone|iPod/.test(ua) || ipad, android = /Android/.test(ua);
  const short = Math.min(screen.width || innerWidth, screen.height || innerHeight), tablet = ipad || (android && !/Mobile/.test(ua)) || (MOBILE && short >= 600);
  const standalone = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches));
  return { ios, android, ipad, tablet, phone: MOBILE && !tablet, standalone, kind: tablet ? 'tablet' : MOBILE ? 'phone' : 'desktop' }; })();
G.DEV = DEV;
// FULL SCREEN where the browser allows it (Android Chrome, iPad Safari, desktop). An iPhone's Safari does not allow it
// for a game (only for videos): there the Home Screen app is the full-screen way to play. Never needed when already
// running as an installed app. Turning the screen sideways is locked only where the browser allows that (in full screen).
function fsAvailable() { const d = document; return !DEV.standalone && !!(d.fullscreenEnabled || d.webkitFullscreenEnabled) && !(d.fullscreenElement || d.webkitFullscreenElement); }
function goFullscreen() {
  const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen; if (!rq) return;
  const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => { }); } catch (e) { } };
  try { const p = rq.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(lock, () => { }); else lock(); } catch (e) { }
}
G.goFullscreen = goFullscreen;
// A PIXEL BUDGET: high-density screens (an iPad is about 2700×2000 real pixels) would make the graphics chip draw several
// times more pixels than a phone for a picture nobody can tell apart at arm's length. The picture is drawn at most at this
// many pixels and scaled up smoothly; phones are already under it, so they look exactly as before.
const PIX_BUDGET = TEST ? 1e9 : DEV.phone ? 1.0e6 : DEV.tablet ? 1.6e6 : 3.0e6;
let budgetScale = 1; // (the Performance mode lowers it)
// The 3D CAMERA follows the screen's shape: the view was tuned for a wide phone (about 2:1). On a squarer screen
// (an iPad is 4:3) a fixed vertical angle would show much less of the world to the sides, so it would look zoomed in.
// The angle opens up (part of the way) to keep the sides in view, so the framing feels the same on every device.
const FOV0 = 38, ASPECT0 = 1.95;
function fovFor(a) { return a >= ASPECT0 ? FOV0 : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV0 / 2)) * Math.pow(ASPECT0 / Math.max(.5, a), .75))); }
// The buttons scale with the screen: bigger on a tablet (up to 1.35×), but NEVER smaller than normal on a phone, so every
// button stays at least 44 px for small fingers. (A narrow phone wraps the top buttons onto two rows instead: style.css.)
function uiScale(w, h) { return Math.max(1, Math.min(1.35, Math.min(h / 390, w / 720))); }
function resize() {
  const [w, h] = screenSize(); sizeW = w; sizeH = h;
  const want = Math.min(devicePixelRatio || 1, 2) * quality, cap = Math.sqrt(PIX_BUDGET * budgetScale / Math.max(1, w * h));
  renderer.setPixelRatio(Math.max(.6, Math.min(want, cap))); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = fovFor(camera.aspect); camera.updateProjectionMatrix();
  post.setSize(w, h, renderer.getPixelRatio());
  document.documentElement.style.setProperty('--ui', uiScale(w, h).toFixed(3));
}
// (build 36) the browser tells us when the canvas changes size (ResizeObserver: no cost per frame); as a safety net the
// size is also compared twice a second (reading it every frame could force the page layout to be redone each frame).
let sizeCheckAt = 0;
function checkSize(now) { if (now - sizeCheckAt < 500) return; sizeCheckAt = now; const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (w !== sizeW || h !== sizeH)) resize(); }
if (window.ResizeObserver) try { new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (w !== sizeW || h !== sizeH)) resize(); }).observe(canvas); } catch (e) { }
addEventListener('resize', resize); addEventListener('orientationchange', () => { resize(); setTimeout(resize, 300); setTimeout(resize, 1000); });
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
resize();
// (build 23) the title pictures never change: they are drawn once, saved on the device, and shown instantly on
// every later start. On the very first start they are drawn just after the game becomes playable.
const PORTRAIT_KEY = 'ddw3-portraits-b23';
let portraits = {};
try { portraits = JSON.parse(localStorage.getItem(PORTRAIT_KEY) || '{}'); } catch (e) { portraits = {}; }
const applyPortraits = () => document.querySelectorAll('[data-c]').forEach(el => { const img = el.querySelector('img'); if (img && portraits[el.dataset.c]) img.src = portraits[el.dataset.c]; });
const needPortraits = Object.keys(CREATURES).some(k => !portraits[k]);
if (!needPortraits) applyPortraits();
// (build 26) AUTOMATIC QUALITY, a ladder of steps. None of them recompiles shaders (no freeze when it changes):
//   0 full  ·  1 lighter shadows (1024 px, drawn every 3rd frame)  ·  2 lite effects (no 4x AA buffer, no glow)
//   3 resolution -12%  ·  4 resolution -24%  ·  5 smallest shadows (512 px, every 4th frame), resolution -30%
// It only steps down after SUSTAINED slowness (about 2.5 s under ~48 fps, and at least 4 s between changes), steps
// back up after 30 s of smooth play, never retries a level that failed in the last minute, and ignores a steady
// 30 fps cap (iPhone Low Power Mode), which is not lag. The level is remembered on the device.
const GFX_KEY = 'ddw3-gfx-b33', /* (build 33: a new key, so a level that got stuck at the lowest in an older build is forgotten) */ QMAX = quality, SM0 = sun.shadow.mapSize.x;
const gfx = { level: 0, since: 0, slow: 0, fast: 0, cap: 0, work: 4, failed: -1, failedAt: -1e9, var: 0, changes: [] }; G.gfx = gfx;
let shadowEvery = 2;
function applyGfx(L, why) {
  L = Math.max(0, Math.min(5, L)); const prev = gfx.level; gfx.level = L; gfx.since = 0; gfx.slow = gfx.fast = 0;
  shadowEvery = L >= 5 ? 4 : L >= 1 ? 3 : 2;
  const sm = L >= 5 ? 512 : L >= 1 ? Math.min(1024, SM0) : SM0; if (sun.shadow.mapSize.x !== sm) { sun.shadow.mapSize.set(sm, sm); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  post.lite = L >= 2; quality = QMAX - (L >= 5 ? .3 : L >= 4 ? .24 : L >= 3 ? .12 : 0); resize();
  if (why) { gfx.changes.push(`${prev}→${L} (${why})`); if (gfx.changes.length > 12) gfx.changes.shift(); try { localStorage.setItem(GFX_KEY, JSON.stringify({ level: L })); } catch (e) { } }
}
if (!TEST && !/[?&]hq/.test(location.search)) { try { const g = JSON.parse(localStorage.getItem(GFX_KEY) || 'null'); if (g && Number.isFinite(g.level)) applyGfx(g.level); else if (MOBILE) applyGfx(1); } catch (e) { } } // (build 28: a phone starts on lighter shadows, so lag never comes first)
G.applyGfx = applyGfx; G.resetGfx = () => { applyGfx(MOBILE ? 1 : 0); gfx.changes.push('reset'); gfx.failed = -1; };
// (build 36) GRAPHICS MODE for grown-ups (⚙️): Auto (the measured frame times choose, as before), or a fixed choice:
// Quality (best picture), Balanced, Performance (smallest picture and shadows, for older or warm devices).
const GFX_MODES = { auto: null, quality: 0, balanced: 2, performance: 5 }, MODE_KEY = 'ddw3-gfxmode';
gfx.mode = 'auto';
function setGfxMode(m, save = true) {
  if (!(m in GFX_MODES)) m = 'auto'; gfx.mode = m; budgetScale = m === 'performance' ? .6 : 1;
  if (m === 'auto') { let L = MOBILE ? 1 : 0; try { const g = JSON.parse(localStorage.getItem(GFX_KEY) || 'null'); if (g && Number.isFinite(g.level)) L = g.level; } catch (e) { } applyGfx(L); }
  else applyGfx(GFX_MODES[m]);
  gfx.changes.push('mode ' + m); if (save) try { localStorage.setItem(MODE_KEY, m); } catch (e) { }
}
if (!TEST && !/[?&]hq/.test(location.search)) { try { const m = localStorage.getItem(MODE_KEY); if (m && m !== 'auto') setGfxMode(m, false); } catch (e) { } }
G.setGfxMode = setGfxMode; G.adapt = dt => adapt(dt); // (a test can freeze the real timing, G.adaptFrozen, and feed adapt() recorded frame times)
function adapt(dt) {
  ema += (dt - ema) * .05; gfx.var += ((dt - ema) * (dt - ema) - gfx.var) * .05; gfx.since += dt;
  if (gfx.mode !== 'auto') return; // (a fixed graphics mode chosen by a grown-up)
  // (build 39) A 30 fps CAP (iPhone Low Power Mode) is not lag. A steady one is recognised at once; an uneven one (1% lows of
  // 20-26 fps, seen on the real iPhone) is recognised by TRYING: after stepping down at about 30 fps, if 8 s later the frame
  // rate hasn't improved, lowering the quality didn't help, so the step is undone and, while the cap lasts, the game stops
  // lowering the picture at about 30 fps. (On the real iPhone it went 4→5→4 under the cap: a worse picture for nothing.)
  const near30 = ema > .028 && ema < .038, capped30 = !gfx.notCap && ((near30 && Math.sqrt(gfx.var) < .004) || (gfx.capLock && near30)); // (notCap: the test showed lowering DOES help here)
  if (gfx.capLock && ema < 1 / 50) gfx.capLock = false; // (the cap is gone: e.g. Low Power Mode was switched off)
  // The test is decisive: for 6 s the picture drops to the LOWEST level. If even that isn't faster, it is a cap: back to the
  // level it was, and no more lowering under the cap. If it IS faster, the device really was slow: one level lower than before.
  if (gfx.probe) { gfx.probe.t += dt; if (gfx.probe.t > 6) { const p = gfx.probe; gfx.probe = null; if (ema > p.ema0 * .85 && ema > .028) { gfx.capLock = true; applyGfx(p.from, '30 fps cap: lower quality didn\'t help'); } else { gfx.notCap = true; applyGfx(Math.min(5, p.from + 1), 'faster when lowered'); } gfx.since = 0; } return; }
  if (ema > 1 / 48 && !capped30) { gfx.fast = 0; gfx.slow += dt;
    if (gfx.slow > 2.5 && gfx.since > 4 && gfx.level < 5 && !gfx.probe) { if (gfx.since < 60 && gfx.changes.length && gfx.changes[gfx.changes.length - 1].includes('smooth')) { gfx.failed = gfx.level; gfx.failedAt = performance.now(); } const from = gfx.level, e0 = ema; if (near30 && from < 4 && !gfx.notCap) { applyGfx(5, 'is it a 30 fps cap? testing'); gfx.probe = { from, ema0: e0, t: 0 }; } else applyGfx(gfx.level + 1, Math.round(1 / ema) + ' fps'); } }
  else { gfx.slow = Math.max(0, gfx.slow - dt * .5);
    // (build 33) a steady 30 fps cap (iPhone Low Power Mode) hides how much headroom there is. If each frame's own work is
    // small (well under the 33 ms the cap allows) for 20 s, step the picture quality back UP a level. A level that then
    // makes frames uneven is caught by the slow check above, which steps back down and won't retry it for a minute.
    if (capped30 && gfx.work < 9 && gfx.level > 0 && !(gfx.failed === gfx.level - 1 && performance.now() - gfx.failedAt < 60000)) { gfx.cap += dt; if (gfx.cap > 20) { gfx.cap = 0; applyGfx(gfx.level - 1, 'room to spare at 30 fps'); } } else gfx.cap = 0;
    if (ema < 1 / 57) { gfx.fast += dt; if (gfx.fast > 30 && gfx.level > 0 && !(gfx.failed === gfx.level - 1 && performance.now() - gfx.failedAt < 60000)) applyGfx(gfx.level - 1, 'smooth'); } else gfx.fast = 0; }
}

// ---------------- main loop ----------------
const timer = new THREE.Timer(); let T = 0;
let acc = 0;
const prevP = { x: 0, y: 0, z: 0 };
function step(dt) {
  T += dt; prevP.x = player.x; prevP.y = player.y; prevP.z = player.z;
  if (((stick && stick.active && stick.dy < -45) || keys.up) && player.swim) { swimT -= dt; if (swimT <= 0) { swimT = .38; jump(); } } else swimT = .38;
  if (started) { updatePlayer(dt); updateFluffs(dt, T); updateBubbles(dt); }
  karts.update(dt, T, player, stick, keys); train.update(dt, T, player, stick, keys); marbles.update(dt); friends.update(dt, T, player, world.trail); kingdom.update(dt, T, player); meadow.update(dt);
  if (world.sparkle && started && (Math.abs(player.vx) > 1 || !player.grounded) && Math.random() < dt * 14) { const c = (world.styles || {})[player.creature] || CREATURES[player.creature].body; burst(player.x - player.facing * .3, player.y + .3 + Math.random() * .6, player.z, [c, '#ffffff', '#ffe36e'], 2, .8); }
  updatePit(dt); updateWorldAnim(dt, T); updateParticles(dt);
}
function frame() {
  const frameT0 = performance.now(); checkSize(frameT0);
  { const now = performance.now(); if (lastFrameAt && perfMon && !G.activityOpen) perfMon.frame(now - lastFrameAt, now); lastFrameAt = now; } // (build 26: monitor: a few numbers per frame)
  if (G.activityOpen) { requestAnimationFrame(frame); return; } // (build 25: a learning game is open: the 3D world sleeps)
  // fixed 1/60 s physics steps: the game runs at the same speed on fast and slow devices
  timer.update(); const raw = Math.min(timer.getDelta(), .25); acc += raw;
  let n = 0; while (acc >= 1 / 60 && n < 15) { step(1 / 60); acc -= 1 / 60; n++; }
  if (n === 15) acc = 0; // (a physics step costs ~0.2-0.4 ms, so catching up keeps the game at real speed even when frames drop)
  const dt = Math.max(1 / 60, n / 60);
  if (started) updateBits(T); updateHint(T); updateActionPrompt();
  if (started) adventures?.update();
  const P = player;
  // build 17: draw the creature between the last two physics steps (smooth on 60/90/120 Hz screens), and move the camera every frame
  const a = Math.min(1, acc * 60), far = Math.abs(P.x - prevP.x) > 2 || Math.abs(P.y - prevP.y) > 2; // (no blending across teleports)
  const ix = far ? P.x : prevP.x + (P.x - prevP.x) * a, iy = far ? P.y : prevP.y + (P.y - prevP.y) * a, iz = far ? P.z : prevP.z + (P.z - prevP.z) * a;
  { const sx = P.x, sy = P.y, sz = P.z; P.x = ix; P.y = iy; P.z = iz; updateCamera(raw); P.x = sx; P.y = sy; P.z = sz; }
  creature.root.position.set(ix, iy, iz);
  { const gy = P.ride ? P.y : groundUnder(P.x, P.y), hgt = Math.max(0, P.y - gy), k = Math.max(.25, 1 - hgt / 4); blob.visible = !(P.ride && (P.ride.type === 'slide')) && !P.swim; blob.position.set(P.x, gy + .015, P.z); blob.scale.setScalar(k); shadowMat.opacity = k; }
  { const sliding = P.ride && (P.ride.type === 'slide' || P.ride.type === 'kart' || P.ride.type === 'train' || P.ride.type === 'whale'), k = Math.min(1, dt * 10), sy = P.crawl ? .6 : sliding ? .62 : 1, sx = P.crawl ? 1.15 : sliding ? .62 : 1; creature.root.scale.set(lerp(creature.root.scale.x, sx, k), lerp(creature.root.scale.y, sy, k), lerp(creature.root.scale.z, sx, k)); }
  creature.update(dt, { vx: P.vx, vy: P.vy, grounded: P.grounded || !!P.ride, seated: !!P.ride && P.ride.type !== 'slide', facing: P.facing, happy: P.happy });
  P.happy = Math.max(0, P.happy - dt);
  $('paintTools').classList.toggle('show', started && (nearPaint() || meadow.nearColor(player)));
  $('buildTools').classList.toggle('show', started && meadow.nearBuild(player));
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('shown'); }
  if (saveTimer > 0) { saveTimer -= dt; if (saveTimer <= 0) save(); }
  if (world.comfort?.calm) world.flash = 0;
  if (world.flash > 0) { world.flash -= dt * 2.5; $('flash').style.opacity = Math.max(0, world.flash); }
  renderer.shadowMap.needsUpdate = (++shadowTick % shadowEvery) === 0; // (build 24: the sun never moves and most shadow casters stand still: redraw the shadow map every other frame)
  renderer.info.reset(); // (build 26: count every pass of the frame, not just the last one)
  if (post.enabled) post.render(); else renderer.render(scene, camera);
  if (!TEST && !/[?&]hq/.test(location.search) && !G.adaptFrozen) { gfx.work += (performance.now() - frameT0 - gfx.work) * .05; adapt(raw); }
  requestAnimationFrame(frame);
}

// ---------------- boot ----------------
const saved = load();
restore(saved);
setCreature(player.creature);
document.querySelectorAll('.introPick').forEach(x => x.classList.toggle('picked', x.dataset.c === player.creature));
friends.restored(); meadow.restored(); karts.rebuildPreview(); expansion.restored();
updateCounters(); snapCamera(); updateBits(0);
// (build 9: arrow buttons are back, so there is no drag hint)
if (saved) $('playBtn').textContent = 'KEEP PLAYING ▶';
$('playBtn').addEventListener('click', () => { if (MOBILE && !TEST && fsAvailable()) goFullscreen(); /* (build 36: a phone or tablet in the browser plays full screen where allowed) */ Sound.unlocked = true; started = true; $('overlay').classList.add('hidden'); document.body.classList.add('playing'); adventures?.intro(); Sound.chime(); if (!saved) toast('✨ Find the 6 lost baby Fluffkins and take them home!'); });
addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { lastFrameAt = 0; /* (build 39: time spent in the background, e.g. while copying the test results, is not a 10-second 'freeze') */ if (document.hidden) { save(); /* (build 36: iPhone may not send 'blur' when the app is switched away: let go of every button, so nothing is stuck when she comes back) */ if (stick) stickEnd(); keys.left = keys.right = keys.up = keys.down = false; padPointer = null; document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed')); } else resize(); });
// (build 24) the lamps of the house and the underground: a FIXED pool of 3 point lights that is always in the scene.
// Switching lights on and off (build 22) changed the number of lights, which forces every material in the game to
// recompile its shader: that was the freeze when entering the house. Now the light count never changes; the pool
// moves to the nearest lamps of the area you are in (fading smoothly) and is dark outdoors.
const zoneLights = [], lightPool = [];
{ const P0 = new THREE.Vector3(); const found = []; scene.traverse(o => { if (o.isPointLight && o.userData.zone) found.push(o); });
  for (const o of found) { o.updateWorldMatrix(true, false); o.getWorldPosition(P0); zoneLights.push({ zone: o.userData.zone, pos: P0.clone(), color: o.color.clone(), intensity: o.intensity, distance: o.distance, decay: o.decay }); o.parent.remove(o); }
  for (let i = 0; i < 3; i++) { const l = new THREE.PointLight('#ffffff', 0, 10, 1.6); l.userData.src = null; l.userData.k = 0; scene.add(l); lightPool.push(l); } }
function updateLightPool(dt) {
  const P = player, z = P.layer === 'in' ? 'in' : P.y < -1.5 ? 'under' : '';
  const want = zoneLights.filter(L => L.zone === z).sort((a, b) => Math.abs(a.pos.x - P.x) - Math.abs(b.pos.x - P.x)).slice(0, lightPool.length);
  for (const l of lightPool) {
    const keep = l.userData.src && want.includes(l.userData.src);
    if (!keep) { l.userData.k = Math.max(0, l.userData.k - dt * 5); if (l.userData.k === 0) { const free = want.find(w => !lightPool.some(o => o.userData.src === w)); l.userData.src = free || null; if (free) { l.position.copy(free.pos); l.color.copy(free.color); l.distance = free.distance; l.decay = free.decay; } } }
    else l.userData.k = Math.min(1, l.userData.k + dt * 4);
    l.intensity = l.userData.src ? l.userData.src.intensity * l.userData.k : 0;
  }
}
let lodTick = 0, poolTick = 0, poolDt = 0, shadowTick = 0;
// ---------------- build 25: the Learning Corners ----------------
// Seven signposts in the park and valley (numbers, letters, colors & shapes, thinking, science, music & art,
// feelings). Tap one (or PAW next to it) to open its learning games; the games are a light 2D layer and the
// 3D world pauses while they're open.
const learning = initLearning({ Sound, voice, setSound: on => { setSound(on); save(); }, world, save: () => save(), discover: id => { if (id.startsWith('learn_')) adventures?.event({type:'learn',id:id.slice(6)}); if (!world.disc.has(id)) { world.disc.add(id); saveSoon(); } }, pause: on => { G.releaseInputs?.(); G.activityOpen = on; if (!on) { timer.update(); acc = 0; } }, TEST, event: e => adventures?.event(e) });
G.learning = learning;
{ const signTex = e => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff6fb'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#c9a6ff'; g.stroke(); g.font = '72px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const wood = toy('#c98a5a', { r: .7, cc: .1 }), glow = toy('#fff3a6', { em: '#ffd76a', ei: .9, r: .4 });
  const PREF = { num: 118, abc: 158, art: 214, think: 236, sci: 306, music: 344, me: 384 };
  const taken = () => [...G.interact.filter(i => (i.layer || '') === '' && (i.y || 0) < 2).map(i => i.x), ...DOORS.map(d => d.x)];
  for (const [cat, [icon]] of Object.entries(learning.corners)) {
    let x = PREF[cat]; const busy = taken(); for (let k = 0; k < 40 && busy.some(b => Math.abs(b - x) < 3.2); k++) x += (k % 2 ? -1 : 1) * (k + 1) * .8;
    const g = new THREE.Group(), z = -1.95; g.position.set(x, 0, z); scene.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 1.7, 12), wood); post.position.y = .85; g.add(post);
    const sign = new THREE.Mesh(new THREE.CircleGeometry(.48, 40), new THREE.MeshStandardMaterial({ map: signTex(icon), roughness: .6 })); sign.position.set(0, 1.95, .06); g.add(sign);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(.53, .53, .08, 40), toy('#b28cff', { r: .5 })); back.rotation.x = Math.PI / 2; back.position.set(0, 1.95, 0); g.add(back);
    const star = new THREE.Mesh(starGeometry(.16, .08, .05, .02, 5), glow); star.position.set(0, 2.62, 0); g.add(star); g.userData.star = star;
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.tap = () => learning.showCorner(cat); } }); G.taps.push(g);
    G.interact.push({ x, y: 0, layer: '', disc: 'corner_' + cat, run: () => learning.showCorner(cat), hintY: 2.9 });
    (G.learnSigns = G.learnSigns || []).push(g);
  } }
// build 18: one quality pass over the finished world (bevelled edges, round silhouettes, sharp textures, no wet-plastic gloss)
try { const ex = new Set(); if (G.paint && G.paint.mesh) ex.add(G.paint.mesh); G.refine = refineScene(scene, renderer, { exclude: ex, budget: MOBILE ? 120000 : 400000, phone: MOBILE }); } catch (e) { console.log('refine skipped', e); }
// compile all the shaders first (in the background where the browser allows it), then start
let begun = false;
// (build 25) SCENERY SLICES: the world is long (from the studio to the castle, plus the house and castle rooms far
// away). Still scenery is grouped into 24 m slices, and slices out of view are taken off the scene, so three.js no
// longer walks ~3,600 objects (positions, culling, shadows) every frame. Things that move about are never sliced.
const slices = [];
// (build 26) instanced groups spread over the WHOLE world (520 flowers, 490 party bulbs, 471 train sleepers) were
// drawn in full every frame, off-screen or not (an instanced group is culled as one): about 300k triangles at the
// park. They are cut into 24 m chunks (same geometry and material, so no new shaders) that are culled and sliced.
function chunkInstanced() {
  let made = 0; const M = new THREE.Matrix4(), P = new THREE.Vector3(), C = new THREE.Color();
  for (const im of [...scene.children]) {
    if (!im.isInstancedMesh || im.count < 40 || im === bitMesh || (im.morphTexture)) continue;
    if (!im.boundingSphere) im.computeBoundingSphere(); if (im.boundingSphere.radius < 30) continue;
    const groups = new Map();
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, M); P.setFromMatrixPosition(M); const k = Math.floor(P.x / 24); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); }
    for (const list of groups.values()) {
      const c = new THREE.InstancedMesh(im.geometry, im.material, list.length);
      list.forEach((i, j) => { im.getMatrixAt(i, M); c.setMatrixAt(j, M); if (im.instanceColor) { im.getColorAt(i, C); c.setColorAt(j, C); } });
      c.castShadow = im.castShadow; c.receiveShadow = im.receiveShadow; c.renderOrder = im.renderOrder; Object.assign(c.userData, im.userData); c.name = im.name;
      c.computeBoundingSphere(); scene.add(c); made++;
    }
    scene.remove(im); im.dispose();
  }
  G.chunked = made;
}
function sliceScenery() {
  const skip = new Set([creature.root, ...LOD.map(i => i.o), ...(G.life ? G.life.agents.map(a => a.root) : [])]);
  const box = new THREE.Box3(), sph = new THREE.Sphere(), byKey = new Map();
  for (const o of [...scene.children]) {
    if (o.isLight || o.isCamera || o.isPoints || o.isSprite || o.userData.dynamic || skip.has(o) || o === sky) continue;
    box.setFromObject(o); if (box.isEmpty()) continue; box.getBoundingSphere(sph); if (sph.radius > 18) continue;
    const key = Math.floor(sph.center.x / 24); let g = byKey.get(key);
    if (!g) { g = new THREE.Group(); g.userData.slice = true; g.userData.x = key * 24 + 12; byKey.set(key, g); slices.push(g); scene.add(g); }
    g.add(o); // (the scene has no transform, so the object stays exactly where it is)
  }
  G.sliced = slices.reduce((n, g) => n + g.children.length, 0);
  G.slices = slices;
}
G.unslice = o => { if (o && o.parent && o.parent.userData.slice) scene.attach(o); }; // (something that starts to follow you leaves its slice)
function updateSlices() { for (const g of slices) { const near = Math.abs(g.userData.x - camT.x) < 52; if (near && !g.parent) scene.add(g); else if (!near && g.parent) scene.remove(g); } }
const begin = () => { if (begun) return; begun = true; G.startupMs = Math.round(performance.now()); try { chunkInstanced(); sliceScenery(); updateSlices(); } catch (e) { console.log('slices skipped', e); } renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; requestAnimationFrame(frame); if (needPortraits) setTimeout(() => { try { portraits = renderPortraits(); localStorage.setItem(PORTRAIT_KEY, JSON.stringify(portraits)); } catch (e) { } applyPortraits(); }, 60); setTimeout(() => $('loading').classList.add('done'), 250); };
// (build 24) shaders: compile everything in the scene before play starts (the light count is now fixed, so these stay
// valid), then compile the model files' materials as soon as they arrive (in the background where the phone supports
// parallel compiling), so nothing compiles the first time it comes into view.
const compileAll = () => {
  // things hidden only because they are far away (grass, bushes, trees, fur) are compiled too
  const shown = []; for (const it of LOD) if (!it.o.visible) { it.o.visible = true; shown.push(it.o); } for (const f of FUR) for (const sh of f.shells) if (!sh.visible) { sh.visible = true; shown.push(sh); }
  const back = []; if (G.life) for (const a of G.life.agents) if (a.detached) { a.detached.add(a.root); back.push(a); } // (build 29) far-away creatures (off the scene) are compiled too
  // (compile for where the world is really drawn: into the post-processing picture, not straight to the screen;
  //  the shader for each is different, so compiling for the wrong one did nothing)
  const prevRT = renderer.getRenderTarget(); if (post.enabled) renderer.setRenderTarget(post.target);
  let r; try { r = renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera)); } catch (e) { r = Promise.resolve(); }
  renderer.setRenderTarget(prevRT);
  for (const o of shown) o.visible = false; for (const a of back) a.detached.remove(a.root); return r;
};
// (build 29) prepare one newly built neighbourhood's shaders before it appears (in the background where supported)
function warmGroup(g) { // (build 29) one rehearsal draw of a newly streamed neighbourhood, into the real buffer, before you can see it
  try { const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()), cam = camera.clone(); cam.position.set(c.x, 2.15, CAM_DIST); cam.lookAt(c.x, 1.15, 0); cam.updateMatrixWorld();
    const prev = renderer.getRenderTarget(), sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; if (post.enabled && !post.lite) { G.warmRT = G.warmRT || new THREE.WebGLRenderTarget(64, 32, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(64, 32), depthBuffer: true }); renderer.setRenderTarget(G.warmRT); renderer.render(scene, cam); } renderer.setRenderTarget(prev); renderer.shadowMap.autoUpdate = sm; } catch (e) { }
}
G.warmGroup = warmGroup;
function compileGroup(g) { const prev = renderer.getRenderTarget(); if (post.enabled) renderer.setRenderTarget(post.target); let r; try { r = renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(g, camera, scene) : Promise.resolve(renderer.compile(g, camera, scene)); } catch (e) { r = Promise.resolve(); } renderer.setRenderTarget(prev); return r; }
// creatures are sculpted in the background and appear a moment later: compile their materials as they arrive
// (build 29) ...and then draw just those new creatures once, out of sight, into a tiny buffer of the real kind:
// the graphics driver finishes a shader the first time it is used, so this moves that wait (2 s on the test machine,
// in the middle of a walk into the Dino Kingdom) to a moment when nothing is on screen there.
const WARM_LAYER = 5, warmCam = new THREE.PerspectiveCamera(45, 2, .1, 60); warmCam.layers.set(WARM_LAYER);
scene.traverse(o => { if (o.isLight) o.layers.enable(WARM_LAYER); }); // (lights are seen on every layer, so the shaders are the real ones)
function warmObjects(list) {
  if (!list.length || !(post.enabled && !post.lite)) return;
  G.warmRT = G.warmRT || new THREE.WebGLRenderTarget(64, 32, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(64, 32), depthBuffer: true });
  const prev = renderer.getRenderTarget(), sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; const V0 = new THREE.Vector3();
  for (const o of list) {
    let root = o; while (root.parent && root.parent !== scene && !root.parent.isScene) root = root.parent;
    const agent = G.life && G.life.agents.find(a => a.root === root && a.detached); if (agent) agent.detached.add(root);
    o.traverse(q => q.layers.enable(WARM_LAYER)); o.getWorldPosition(V0); warmCam.position.set(V0.x, V0.y + 1, V0.z + 5); warmCam.lookAt(V0.x, V0.y + .6, V0.z); warmCam.updateMatrixWorld();
    try { renderer.setRenderTarget(G.warmRT); renderer.render(scene, warmCam); } catch (e) { }
    o.traverse(q => q.layers.disable(WARM_LAYER)); if (agent) agent.detached.remove(root);
  }
  renderer.setRenderTarget(prev); renderer.shadowMap.autoUpdate = sm;
}
const fresh = [];
let compileTimer = 0; globalThis.__ddwCompile = obj => { if (obj) fresh.push(obj); clearTimeout(compileTimer); compileTimer = setTimeout(() => { Promise.resolve(compileAll()).then(() => warmObjects(fresh.splice(0)), () => { }); }, 300); };
// PRELOAD THE AREAS: while the loading screen shows, draw each area once into a tiny invisible picture (the house
// upstairs and downstairs, the underground, the clouds, the castle, the park), with the sun's shadow over it. That
// makes the graphics driver finish every shader and upload every texture and mesh NOW, not the first time you walk in.
function warmAreas() { const warmT0 = performance.now();
  // (build 29) rehearse into the SAME picture buffer the game really draws into (4x anti-aliased, with a depth texture,
  // or the lite one). The graphics driver prepares a separate drawing setup for each kind of buffer; rehearsing into a
  // plain small buffer (builds 24-28) left the real setups to be made on first sight: the stall when entering the house.
  const full = post.enabled && !post.lite, rt = new THREE.WebGLRenderTarget(64, 32, full ? { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(64, 32), depthBuffer: true } : { type: THREE.HalfFloatType }), /* (tiny, but exactly the same kind of buffer: the setups depend on the kind, not the size) */ cam = camera.clone(), shadowAuto = renderer.shadowMap.autoUpdate;
  const sp = sun.position.clone(), st = sun.target.position.clone();
  try {
    let first = true;
    for (const [x, y] of [[1008, 0], [1012, 4.4], [1020, 0], [20, UG.floor], [45, UG.floor], [54, SKY.y], [406, 0], [2010, 0]]) {
      cam.position.set(x, y + 2.15, CAM_DIST); cam.lookAt(x, y + 1.15, 0); cam.updateMatrixWorld();
      sun.position.set(x - 7, y + 16, 10); sun.target.position.set(x, y, 0); sun.target.updateMatrixWorld();
      renderer.setRenderTarget(rt); renderer.render(scene, cam); if (first) { renderer.shadowMap.autoUpdate = false; first = false; } // (shadow shaders only need one pass)
    }
    // (build 29) then draw EVERY object in the world once (things only shown when near, fur, far-away characters too),
    // with wide straight-on cameras over the outdoor world, the house, the castle rooms and the underground, so no
    // first-time drawing (driver setup, texture and shape uploads) is left for the middle of play
    // (only ONE of each kind of hidden thing is shown for it: the driver's setups depend on the kind, not the number,
    //  and drawing every far tree at once made loading much longer on slow devices)
    const sig = o => { const k = []; o.traverse(q => { if (q.isMesh) k.push(q.material.uuid || '', q.geometry.attributes.uv ? 'u' : '', q.isSkinnedMesh ? 's' : '', q.isInstancedMesh ? 'i' : ''); }); return k.join(','); };
    const shown = [], kinds = new Set(); for (const it of LOD) if (!it.o.visible) { const k = sig(it.o); if (kinds.has(k)) continue; kinds.add(k); it.o.visible = true; shown.push(it.o); } for (const f of FUR) for (const sh of f.shells) if (!sh.visible) { sh.visible = true; shown.push(sh); }
    const back = []; if (G.life) for (const a of G.life.agents) if (a.detached) { a.detached.add(a.root); back.push(a); }
    const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 120);
    for (const [x0, x1, y0, y1] of /[?&]noortho/.test(location.search) ? [] : [[-25, 120, -14, 16], [120, 260, -2, 16], [260, 430, -2, 22], [995, 1035, -1, 11], [1990, 2045, -1, 14]]) {
      oc.left = -(x1 - x0) / 2; oc.right = (x1 - x0) / 2; oc.top = (y1 - y0) / 2; oc.bottom = -(y1 - y0) / 2; oc.position.set((x0 + x1) / 2, (y0 + y1) / 2, 40); oc.lookAt((x0 + x1) / 2, (y0 + y1) / 2, 0); oc.updateProjectionMatrix(); oc.updateMatrixWorld();
      // (shadows too: each kind of shadow-casting thing has its own shadow shader; the sun's shadow box is stretched over the region for this one draw)
      const sc = sun.shadow.camera, keep = [sc.left, sc.right, sc.top, sc.bottom, sc.far];
      sun.position.set((x0 + x1) / 2 - 7, y1 + 16, 10); sun.target.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); sun.target.updateMatrixWorld();
      Object.assign(sc, { left: -(x1 - x0) / 2 - 10, right: (x1 - x0) / 2 + 10, top: (y1 - y0) + 10, bottom: -(y1 - y0) - 10, far: 120 }); sc.updateProjectionMatrix();
      renderer.shadowMap.needsUpdate = true; renderer.setRenderTarget(rt); renderer.render(scene, oc);
      [sc.left, sc.right, sc.top, sc.bottom, sc.far] = keep; sc.updateProjectionMatrix();
    }
    for (const o of shown) o.visible = false; for (const a of back) a.detached.remove(a.root);
    G.warmed = (G.warmed || 0) + 1; G.warmMs = Math.round(performance.now() - warmT0);
  } catch (e) { G.warmErr = String(e); }
  renderer.shadowMap.autoUpdate = shadowAuto; renderer.shadowMap.needsUpdate = true;
  renderer.setRenderTarget(null); if (rt.depthTexture) rt.depthTexture.dispose(); rt.dispose(); sun.position.copy(sp); sun.target.position.copy(st); sun.target.updateMatrixWorld();
}
Promise.race([Promise.all([assetsReady, landmarksReady]), new Promise(r => setTimeout(r, 6000))])
  .then(() => compileAll()).then(() => { warmAreas(); begin(); }, begin);
setTimeout(begin, 15000);

// debug/test hook (used by the automated tests only)
window.__DDW3 = { THREE,
  player, world, keys, fluffs, G, camera, Sound, save, IN, renderer, FR: THREE.Frustum, LOWSTATS, SCULPT_STATS,
  teleport(x, y = 0) { player.ride = null; player.stair = null; player.layer = x >= 2000 ? 'castle' : x >= 1000 ? 'in' : ''; player.x = x; player.y = y; player.vx = player.vy = 0; player.grounded = y === 0; snapCamera(); },
  toScreen(x, y, z = 0) { V.set(x, y, z).project(camera); const r = canvas.getBoundingClientRect(); return { x: (V.x + 1) / 2 * r.width + r.left, y: (1 - V.y) / 2 * r.height + r.top }; },
  pick(cx, cy) { pointerRay({ clientX: cx, clientY: cy }); return ray.intersectObjects([creature.root, ...G.taps], true).slice(0, 4).map(h => { let o = h.object, n = 0; while (o && !o.userData.tap && !o.userData.creature) { o = o.parent; n++; } return [h.object.type, h.distance.toFixed(2), o ? (o.userData.creature ? 'creature' : 'tap') : 'none', h.object.position.x.toFixed(1), o ? (o.name || Object.keys(o.userData).join('/')) : '', (() => { let r = h.object; while (r.parent && r.parent !== scene && !r.parent.userData.slice) r = r.parent; return r.name || r.type + '@' + r.position.x.toFixed(1); })()]; }); },
  bodyScaleY: () => creature.parts.body.scale.y, friends, meadow, karts, train, marbles, kingdom: () => kingdom, meadowRestore: () => meadow.restored(),
  bubbles: () => bubbles.length, info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, progs: renderer.info.programs.length }), post, quality: () => quality, nearDoor: () => nearDoor() && nearDoor().kind,
};

// ---------------- build 26: grown-ups' settings (performance monitor and test) ----------------
// The ⚙️ button must be HELD for a second (so little fingers don't open it by accident). The panel switches the small
// monitor on/off, runs the repeatable Performance Test and copies its report to the clipboard.
renderer.info.autoReset = false;
let lastFrameAt = 0;
G.doAction = doAction; G.soundOn = () => Sound.on;
const GAME_BUILD = '40'; G.build = GAME_BUILD;
const perfMon = initPerf({ renderer, G, world, player, keys, fluffs, post, sun, doAction, build: GAME_BUILD }); G.perfMon = perfMon;
{
  const btn = document.createElement('button'); btn.className = 'pill'; btn.id = 'gearBtn'; btn.setAttribute('aria-label', 'settings for grown-ups (hold)'); btn.textContent = '⚙️';
  $('soundBtn').after(btn);
  const pan = document.createElement('div'); pan.id = 'perfPanel';
  pan.innerHTML = `<div class="pp"><div class="ppHead">Grown-ups: performance <button data-a="close" aria-label="close">✖</button></div>
    <button data-a="mon">📊 Monitor: <b>off</b></button><button data-a="test">▶ Performance Test (about 30 s)</button><button data-a="copy">📋 Copy Test Results</button><button data-a="voice">🗣️ Test the voice</button><div class="ppTier">Learning games: <button data-a="t1">1 Super easy</button><button data-a="t2">2 Learning more</button><button data-a="t3">3 Kindergarten ready</button></div>
    <div class="ppInfo"></div><textarea readonly rows="7" placeholder="Run the test, then Copy Test Results and paste them into the chat."></textarea>
    <div class="ppTier ppMode">Graphics: <button data-a="m-auto">Auto</button><button data-a="m-quality">Quality</button><button data-a="m-balanced">Balanced</button><button data-a="m-performance">Performance</button></div>
    <button data-a="full" class="small fsOnly">⛶ Full screen</button>
    <button data-a="reset" class="small">↺ Reset automatic graphics</button><button data-a="wipe" class="small danger">🗑️ Start over (erase all progress)</button></div>`;
  document.body.appendChild(pan);
  const block = document.createElement('div'); block.id = 'perfBlock'; block.innerHTML = '<div>⏱️ <span></span></div>'; document.body.appendChild(block);
  const ta = pan.querySelector('textarea'), info = pan.querySelector('.ppInfo'), monB = pan.querySelector('[data-a=mon] b');
  const refresh = () => { pan.querySelectorAll('.ppTier button').forEach(b => b.classList.toggle('on', /^m-/.test(b.dataset.a) ? b.dataset.a === 'm-' + (G.gfx || {}).mode : +b.dataset.a[1] === learning.tier())); pan.querySelector('.fsOnly').style.display = fsAvailable() ? '' : 'none'; monB.textContent = perfMon.isShown() ? 'on' : 'off'; const g = G.gfx || {}; info.textContent = `Graphics level ${g.level ?? '?'} of 5 (0 = best; ${g.mode === 'auto' ? 'changes by itself if the game runs slowly' : 'fixed: ' + g.mode}) · ${DEV.kind}${DEV.ios ? ' (Apple)' : DEV.android ? ' (Android)' : ''}${DEV.standalone ? ', Home Screen app' : ''} · picture ${canvas.width}×${canvas.height}${g.changes && g.changes.length ? ' · ' + g.changes.slice(-3).join(', ') : ''}`; ta.value = perfMon.report(); };
  // (build 28) iPhone: a long press makes Safari start its own gesture, which CANCELS the touch (pointercancel) even
  // though the finger is still down. So only a real lift ends the hold; a quick tap shows a small "hold me" hint.
  let holdT = null, downAt = 0, opened = false;
  const openPanel = () => { opened = true; refresh(); pan.classList.add('show'); Sound.click && Sound.click(); };
  const hint = document.createElement('div'); hint.id = 'gearHint'; hint.textContent = '✋ Hold ⚙️ (grown-ups)'; document.body.appendChild(hint);
  btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); clearTimeout(holdT); opened = false; downAt = performance.now(); holdT = setTimeout(openPanel, 700); });
  btn.addEventListener('pointerup', () => { clearTimeout(holdT); if (!opened && performance.now() - downAt < 700) { hint.classList.add('show'); setTimeout(() => hint.classList.remove('show'), 2200); } });
  btn.addEventListener('contextmenu', e => e.preventDefault());
  pan.addEventListener('pointerdown', e => e.stopPropagation());
  pan.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
    if (a === 'close') pan.classList.remove('show');
    if (a === 'wipe') { // two taps, so it can't happen by accident
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = '⚠️ Tap again to erase everything'; setTimeout(() => { b.dataset.armed = ''; b.textContent = '🗑️ Start over (erase all progress)'; }, 4000); return; }
      G.erasing = true; try { localStorage.removeItem(SAVE_KEY); } catch (err) { } location.reload(); return; }
    if (/^t[123]$/.test(a)) { learning.setTier(+a[1]); refresh(); }
    if (/^m-/.test(a)) { setGfxMode(a.slice(2)); refresh(); }
    if (a === 'full') { goFullscreen(); pan.classList.remove('show'); }
    if (a === 'voice') { if (!Sound.on) setSound(true); voice.unlock(); voice.speak('Hello! Can you hear me? Let\'s play and learn!'); setTimeout(() => { info.textContent = 'Voice: ' + perfMon.voiceLine(); }, 2500); }
    if (a === 'mon') { perfMon.show(!perfMon.isShown()); refresh(); }
    if (a === 'reset') { try { localStorage.removeItem(GFX_KEY); localStorage.removeItem(MODE_KEY); } catch (err) { } gfx.mode = 'auto'; budgetScale = 1; if (G.resetGfx) G.resetGfx(); refresh(); }
    if (a === 'copy') {
      const txt = perfMon.report() || 'No test has been run yet. Press ▶ Performance Test first.';
      let ok = false; try { await navigator.clipboard.writeText(txt); ok = true; } catch (err) { }
      if (!ok) { ta.value = txt; ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length); try { ok = document.execCommand('copy'); } catch (err) { } }
      b.textContent = ok ? '✅ Copied! Paste it into the chat' : '👆 Select the text below and copy it'; setTimeout(() => { b.textContent = '📋 Copy Test Results'; }, 3000);
    }
    if (a === 'test') {
      pan.classList.remove('show'); block.classList.add('show'); const was = Sound.on; Sound.on = false; if (window.speechSynthesis) speechSynthesis.cancel();
      const wasStarted = started; started = true;
      let i = 0; try { await perfMon.runTest(name => { block.querySelector('span').textContent = `Performance test ${++i}/7: ${name}`; }); }
      finally { Sound.on = was; started = wasStarted; block.classList.remove('show'); refresh(); pan.classList.add('show'); }
    }
  });
}

// ---------------- build 29: the picture map (fast travel) and the one-tap home button ----------------
// Big pictures only: tap one and you are there (with a sparkle and its name spoken). 🏠 always takes you home.
const TRAVEL = [['🏠', 'home', 190], ['🎪', 'the Playhouse', 8], ['🎨', 'the Studio', 62], ['🔬', 'the Wonder Lab', 100], ['🎡', 'the Adventure Park', 160], ['🏰', 'the castle', 398], ...expansion.districts.map(d => [d.icon === '🔬' ? '🚀' : d.icon, d.name, d.home])];
function travel([icon, name, x]) {
  const P = player; if (P.ride && P.ride.type === 'kart') parkKart(); if (P.ride && P.ride.type === 'train') train.hopOff();
  P.ride = null; P.stair = null; P.layer = ''; P.x = x; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.groundZ = 0; P.swim = false;
  expansion.buildNow(x); snapCamera(); world.flash = 1; Sound.twinkle(); Sound.chime(); burst(x, 1.5, 0, ['#fff', '#ffe36e', '#9fe6ff'], 24, 3);
  toast(`${icon} Welcome to ${name}!`); saveSoon();
}
{
  const left = document.createElement('div'); left.id = 'upperLeft';
  left.innerHTML = '<button class="pill" id="mapBtn" aria-label="map">🗺️</button><button class="pill" id="homeBtn" aria-label="go home">🏠</button>';
  $('top').insertBefore(left, $('top').firstChild);
  const mp = document.createElement('div'); mp.id = 'mapPanel';
  mp.innerHTML = `<div class="mpIn"><button class="mpX" aria-label="close">✖</button><div class="mpGrid">${TRAVEL.map((t, i) => `<button class="mpT" data-i="${i}">${destinationArt(t[0], i)}<small>${t[1]}</small><span class="mapDiscovery"></span></button>`).join('')}</div></div>`;
  document.body.appendChild(mp);
  const tapEl = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  tapEl($('mapBtn'), () => { if (G.activityOpen) return; const P = player, here = P.layer === '' ? TRAVEL.reduce((b, t, i) => Math.abs(t[2] - P.x) < Math.abs(TRAVEL[b][2] - P.x) ? i : b, 1) : -1; mp.querySelectorAll('.mpT').forEach((b, i) => { b.classList.toggle('here', i === here); b.setAttribute('aria-label','Visit '+TRAVEL[i][1]); const id=expansion.districts.find(d=>d.home===TRAVEL[i][2])?.id; const questId=({frosty:'snow',labgarden:'science',artplaza:'art'})[id]||id; const found=(ADVENTURES[questId]?.steps||[]).filter(st=>world.adventures?.events.includes(st.event)).map(st=>st.icon).slice(0,2).join(''); b.querySelector('.mapDiscovery').textContent=found||(world.adventures?.events.includes('visit_'+(id||['home','playhouse','studio','lab','park','castle'][i]))?'⭐':''); }); mp.classList.add('show'); Sound.click(); voice.speak('Where do you want to go? Tap a picture!'); });
  tapEl(mp.querySelector('.mpX'), () => { mp.classList.remove('show'); Sound.click(); });
  mp.querySelectorAll('.mpT').forEach(b => tapEl(b, () => { mp.classList.remove('show'); travel(TRAVEL[+b.dataset.i]); }));
  tapEl($('homeBtn'), () => { if (G.activityOpen) return; travel(TRAVEL[0]); });
}

// ---------------- build 30: the train's picture strip (pick a station, the train drives you there) ----------------
// It appears at the top whenever you sit in the train and it isn't moving; tap a picture and off you go. When the
// train arrives you hop off onto the platform by yourself. (Holding ▶ or ◀ still lets you drive it yourself.)
function trainArrived(i) {
  const P = player, st = train.STATIONS[i]; train.hopOff(); P.x = st.x; snapCamera(); Sound.chime(); burst(st.x, 1.4, 0, ['#fff', '#ffd23f', '#ff8fc8', '#9fe6ff'], 18, 2.5);
  toast(`${st.e} We're here!`); discover('trainride', 'You rode the train to a new place!'); saveSoon();
}
{
  const strip = document.createElement('div'); strip.id = 'trainStrip';
  strip.innerHTML = train.STATIONS.map((s, i) => `<button class="tsT" data-i="${i}">${s.e}</button>`).join('');
  document.body.appendChild(strip);
  strip.querySelectorAll('.tsT').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; train.goTo(+b.dataset.i); Sound.click(); }));
  let shown = false, lastAt = -1;
  // (build 36) the strip starts just below the top buttons, however tall they are (on a narrow phone they wrap onto two rows)
  const placeStrip = () => { let b = 0; for (const el of document.querySelectorAll('#upperLeft, #upperRight')) b = Math.max(b, el.getBoundingClientRect().bottom); strip.style.top = Math.round(b + 6) + 'px'; };
  G.placeTrainStrip = placeStrip; addEventListener('resize', () => { if (shown) placeStrip(); });
  G.updateTrainStrip = () => {
    const P = player, T = train.state, show = !!(P.ride && P.ride.type === 'train' && T.mode === 'driving' && T.dest < 0 && Math.abs(T.vs) < .05);
    if (show !== shown) { shown = show; if (show) placeStrip(); strip.classList.toggle('show', show); if (show) voice.speak('Where shall we go? Tap a picture!'); }
    if (show && T.at !== lastAt) { lastAt = T.at; strip.querySelectorAll('.tsT').forEach((b, i) => b.classList.toggle('here', i === T.at)); }
  };
}

// ---------------- build 31: my pets (the friends you've made, and who follows you) ----------------
{
  const btn = document.createElement('button'); btn.className = 'pill'; btn.id = 'petsBtn'; btn.setAttribute('aria-label', 'my pets'); btn.textContent = '🐾';
  $('upperLeft').appendChild(btn);
  const pn = document.createElement('div'); pn.id = 'petsPanel'; pn.innerHTML = '<div class="mpIn"><button class="mpX" aria-label="close">✖</button><div class="mpGrid pets"></div></div>'; document.body.appendChild(pn);
  const grid = pn.querySelector('.mpGrid');
  const draw = () => { grid.innerHTML = expansion.palList().map(q => `<button class="mpT pet ${q.found ? (q.follow ? 'on' : '') : 'unknown'}" data-k="${q.kind}">${q.found ? q.emoji : '❓'}<span class="pf">${q.found ? (q.follow ? '💖' : '🏠') : ''}</span></button>`).join('');
    grid.querySelectorAll('.mpT').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const r = expansion.togglePal(b.dataset.k); if (r) toast(r); else voice.speak(expansion.palHint(b.dataset.k)); draw(); })); };
  const tapEl = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; fn(e); });
  tapEl(btn, () => { if (G.activityOpen) return; draw(); pn.classList.add('show'); Sound.click(); voice.speak('Your pet friends! Tap one to bring it along, or to send it home.'); });
  tapEl(pn.querySelector('.mpX'), () => { pn.classList.remove('show'); Sound.click(); });
}

// ---------------- Build 40: connected adventures ----------------
G.started = () => started;
G.releaseInputs = () => {
 keys.left=keys.right=keys.up=keys.down=false; keys.scale=1; G.walkTo=null; painting=null; padPointer=null;
 if(stick)stickEnd(); document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));
};
G.setModalOpen = on => { G.activityOpen=on; G.releaseInputs(); if(!on){timer.update();acc=0;lastFrameAt=0;} };
G.closePanels = () => { adventures?.close(); for(const id of ['mapPanel','petsPanel','stylePanel'])$(id)?.classList.remove('show'); };
const comfort = initComfort({world,Sound,voice,G,save}); G.comfort=comfort;
$('pawBtn').insertAdjacentHTML('beforeend','<span id="pawLabel" aria-hidden="true">🐾</span>');
let reactionAt=0;
G.reactCompanions = e => {
 if(G.perfTest||performance.now()-reactionAt<1500)return;
 if(!['sea','learn'].includes(e.type)&&!['fish_caught','fluff_home','treasure_dug','furnish','gallery_visit'].includes(e.id))return;
 reactionAt=performance.now();for(const a of G.life?.agents||[])if(a.follower&&Math.abs(a.x-player.x)<15)G.life.tap(a,1.4,e.id==='whale'?1:0);
};
adventures=initAdventures({world,player,G,voice,Sound,save,saveSoon,travel,learning,fluffs,comfort,release:G.releaseInputs,pause:G.setModalOpen,cheer:()=>{creature.cheer();player.happy=1.4;}});
G.adventures=adventures;
// Shared-shape home decorations are only shown after earning them. No extra shaders or textures.
{
 const W=G.W,group=new THREE.Group();group.name='adventure-home';group.userData.dynamic=true;group.visible=true;group.position.set(0,0,0);scene.add(group);
 const rewardObjects=new Map();
 const shape=(parent,x,y,z,w,h,d,color)=>W.block(x,y,z,w,h,d,color,{parent,r:.08});
 for(const [i,id]of ['nest','cushion','rainbow','garden','train','basket','owl','snow','flower','frame','pirate'].entries()){
  const item=new THREE.Group();group.add(item);item.visible=false;
  const x=1007+(i%6)*1.35,y=i<6?1.7:2.8;
  shape(item,x,y,-4.35,.72,.3,.55,RAINBOW[i%RAINBOW.length]);
  if(id==='pirate'){shape(item,x,y+.3,-4.35,.07,.9,.07,'#9a6a3a');shape(item,x+.2,y+.85,-4.35,.45,.3,.06,'#ff4f9a');}
  if(id==='rainbow')for(let k=0;k<5;k++)shape(item,x-.3+k*.15,y+.25+Math.sin(k/4*Math.PI)*.4,-4.35,.13,.15,.15,RAINBOW[k]);
  if(id==='garden'||id==='flower')for(let k=0;k<3;k++){shape(item,x-.25+k*.25,y+.25,-4.35,.06,.4,.06,'#36c96b');shape(item,x-.25+k*.25,y+.65,-4.35,.18,.15,.15,RAINBOW[k]);}
  if(id==='train'){shape(item,x,y+.3,-4.35,.45,.4,.35,'#2fa8ff');shape(item,x+.3,y+.2,-4.35,.22,.24,.35,'#ff4f9a');}
  rewardObjects.set(id,item);
 }
 G.updateAdventureWorld=()=>{
  if(player.layer==='in'){if(!group.parent){scene.add(group);group.updateMatrixWorld(true);}if(!G.taps.includes(frame))G.taps.push(frame);const trainToy=rewardObjects.get('train');if(trainToy?.visible)trainToy.position.x=world.comfort?.calm?0:Math.sin(T*.8)*.35;}
  else {if(group.parent)scene.remove(group);const tapIndex=G.taps.indexOf(frame);if(tapIndex>=0)G.taps.splice(tapIndex,1);}
 };
 G.refreshAdventureWorld=()=>{for(const[id,item]of rewardObjects)item.visible=world.adventures?.rewards.includes(id)||false;const cushion=rewardObjects.get('cushion');if(cushion?.children[0])cushion.children[0].material=W.M(({pink:'#ff9acb',blue:'#91cfff',green:'#a5e6b5'})[world.adventures?.cushion]||'#ff9acb');};
 // A permanent picture on the wall opens the saved gallery without needing to read.
 const frame=W.block(1015.7,2.2,-4.4,1,.8,.12,'#ffd23f',{parent:group,r:.1});
 const openGallery=()=>adventures.gallery();frame.userData.tap=openGallery;G.taps.push(frame);G.interact.push({x:1015.7,y:0,layer:'in',icon:'🖼️',action:'Open home gallery',run:openGallery,hintY:2.5});
 G.refreshAdventureWorld(); G.updateAdventureWorld();
}
