// ===================================================================
// Dawson's Discovery World 3D: main game.
// Three.js renderer + one connected world + creature control (move / jump /
// paw buttons and direct tapping), rides, bubbles, painting, star bits,
// Fluffkin rescue, the walk-in Fluffkin House with stairs, saving.
// No timers, no losing, no reading needed. Works offline (one HTML file).
// ===================================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { Sound, NOTES } from './audio.js';
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

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const SAVE_KEY = 'dawsons-discovery-world-3d-v1';
// ?test = light mode for the automated logic tests (software WebGL in the test browser is very slow)
const TEST = /[?&]test/.test(location.search);

// ---------------- renderer, scene, camera, light ----------------
const canvas = $('game');
// phones: start lighter (no MSAA at high pixel density, smaller shadow map, 1.5x resolution)
const MOBILE = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|Android/.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); window.__oops && window.__oops('The device reset the 3D graphics (it may be low on memory). Tap Try again.'); });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; // (filtered, with a blur radius below)
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
// reflections come from a soft sky (blue above, pink at the horizon, a bright sun) mixed with a toy-studio light,
// so shiny things reflect the world's own colours
{
  const envScene = new RoomEnvironment();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 top = vec3(.45,.62,1.05), hor = vec3(1.1,.78,.95), bot = vec3(.55,.42,.7); vec3 c = h > 0. ? mix(hor, top, pow(h, .6)) : mix(hor, bot, -h); gl_FragColor = vec4(c, 1.); }' }));
  envScene.add(dome);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.6, 4) })); sunBall.position.set(-14, 22, 18); envScene.add(sunBall);
  scene.environment = pmrem.fromScene(envScene, .03).texture; scene.environmentIntensity = .62;
}
scene.fog = new THREE.Fog('#f2d4f4', 26, 150); // build 17: atmospheric perspective (distance fades softly into the sky)
const camera = new THREE.PerspectiveCamera(38, 2, .1, 600);
const hemi = new THREE.HemisphereLight('#fff0ff', '#9a6ad8', .85); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1dc', 2.1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4; /* soft shadow edges */ Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 10, bottom: -5, near: 1, far: 50 }); // build 17: a tighter box = sharper shadows sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);
// a soft cool light from behind: it outlines everything with a gentle rim, so shapes look rounder and more real
const rim = new THREE.DirectionalLight('#d6e4ff', .6); rim.position.set(-6, 7, -12); scene.add(rim);
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
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('shown'); toastT = 3; }
function discover(id, msg) { if (world.disc.has(id)) return false; world.disc.add(id); if (msg) toast('✨ ' + msg); Sound.chime(); player.happy = 1.4; if (creature) creature.cheer(); burst(player.x, player.y + 2.2, player.z, undefined, 18); save(); return true; }
function updateCounters() {
  $('bitsCount').textContent = world.bits.size;
  $('fluffCount').textContent = `${fluffs.filter(f => f.state === 'home').length}/6`;
}

// ---------------- the player's creature ----------------
let creature = null;
// soft contact shadow on the ground under the creature (shrinks and fades as it jumps)
const shadowMat = new THREE.MeshBasicMaterial({ map: G.aoTex, transparent: true, depthWrite: false, opacity: 1, polygonOffset: true, polygonOffsetFactor: -4 });
const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), shadowMat); blob.rotation.x = -Math.PI / 2; blob.renderOrder = 3; scene.add(blob);
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
const fluffs = G.fluffSpots.map(([x, y, z = 0], i) => { const m = makeFluff(FLUFF_COLS[i]); scene.add(m.root); return { i, hx: x, hy: y, hz: z, state: 'wait', m, px: x, py: y, pz: z }; });
function updateFluffs(dt, t) {
  const P = player; world.trail.unshift([P.x, P.y, P.z]); if (world.trail.length > 200) world.trail.length = 200;
  let k = 0;
  for (const f of fluffs) {
    const m = f.m.root;
    if (f.state === 'wait') {
      m.position.set(f.hx, f.hy, f.hz); m.visible = Math.abs(f.hx - P.x) < 30; f.m.update(dt, 'wait');
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
const train = initTrain(G, { scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), player, tap: tapApi });
const marbles = initMarbles(G, { scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), player, tap: tapApi });
const friends = initFriends(G, {
  scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), player, world, UG,
  tap: (obj, fn) => { obj.traverse(m => { m.userData.tap = fn; }); G.taps.push(obj); }, save: () => save(), saveSoon: () => saveSoon(), paintStamp,
});
const kingdom = initKingdom(G, { scene, Sound, burst: (x, y, z, c, n, sp) => burst(x, y, z, c, n, sp), discover: (id, msg) => discover(id, msg), toast: m => toast(m), world, player, friends, saveSoon: () => saveSoon(), startSlide: path => { if (!player.ride) startSlide(path); }, snapCamera: () => snapCamera() });

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
G.playKey = k => { k.lit = 1; Sound.bell(NOTES[k.i], .06); burst(k.x, .5, 0, [RAINBOW[k.i], '#fff'], 8, 2); discover('xylophone', 'A giant xylophone! Walk and jump along it.'); };
G.tapTramp = () => { world.trampT = 1; Sound.boing(); const P = player; if (!P.ride && P.layer === '' && Math.abs(P.x - 34) < 3 && P.grounded) { P.vy = 13.5; P.grounded = false; P.jumps = 1; } discover('trampoline', 'Boing! Super bounce!'); };
G.zapOrb = o => { o.zap = 1; Sound.tone(1400, .25, 'sawtooth', .02, .4); Sound.twinkle(); burst(o.x, 1.9, -.8, ['#c9a6ff', '#fff', '#9fe6ff'], 24, 4); discover('orb', 'Zap! Sparkly glow orb!'); };
G.tapDrum = () => { world.drumT = 2; Sound.tone(110, .3, 'sine', .09, .4); Sound.tone(220, .15, 'triangle', .05, .5, .05); burst(1020, 1.2, -1.6, RAINBOW, 14, 3); discover('fluffdrum', 'Boom! Everybody jumps!'); };
G.tapMobile = () => { world.mobileT = 4; [4, 2, 0, 2, 4, 4, 4].forEach((n, i) => Sound.bell(NOTES[n], .03, i * .3)); discover('mobile', 'The twinkly mobile spins round.'); };
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
G.tapWhale = () => { const W = G.whale, P = player; if (!P.ride && P.layer === '' && P.y > SKY.y - .6 && Math.abs(P.x - W.g.position.x) < 10) { P.ride = { type: 'whale', u: 0 }; P.vx = P.vy = 0; Sound.whoosh(); discover('whaleride', 'You are riding the sky whale! JUMP to hop off.'); } W.spout = 2.4; [0, 4, 7, 4, 2, 0].forEach((n, i) => Sound.bell(NOTES[n % 8] / 2, .05, i * .22)); discover('whale', 'The sky whale sings you a song!'); };
G.bounceUp = () => { const P = player; if (P.ride || Math.abs(P.x - (UG.shaft[0] + UG.shaft[1]) / 2) > 2.5 || P.y > UG.floor + 1.5) return; P.x = (UG.shaft[0] + UG.shaft[1]) / 2; P.y = UG.floor + 1; P.vy = 13.5; P.grounded = false; Sound.boing(); discover('mushroomup', 'Boing! Back up into the ball pit. Swim to the top!'); };
G.singCrystal = k => { k.lit = 1; k.cd = 1; Sound.bell(NOTES[k.i % 8] / 2, .06); Sound.bell(NOTES[(k.i + 2) % 8], .025, .08); burst(k.x, UG.floor + 1.5, -1.4, [k.c, '#fff'], 10, 2); discover('crystal', 'Singing crystals! Tap them or walk past them.'); };
G.tapGem = k => { k.spin = 1.5; Sound.twinkle(); Sound.bell(NOTES[(k.i * 2) % 8], .04); burst(k.x, k.y + .5, -.6, [RAINBOW[k.i], '#fff'], 14, 2.5); discover('gem', 'Sparkly gems!'); };
DOORS.forEach(d => { d.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(d.kind), depthTest: false })); d.sprite.scale.set(1.2, 1.2, 1); d.sprite.renderOrder = 10; d.sprite.userData.tap = d.go; d.sprite.visible = false; scene.add(d.sprite); });
function nearDoor() { const P = player; if (P.ride || P.stair) return null; return DOORS.find(d => d.layer === P.layer && Math.abs(P.x - d.x) < 1.6 && Math.abs(P.y - d.y) < .3); }

// ---------------- hint arrow (picture-only guidance) ----------------
const hint = new THREE.Group(); scene.add(hint);
{ const c = new THREE.Mesh(new THREE.ConeGeometry(.28, .55, 20), toy('#ffd84a', { em: '#ffb000', ei: .5 })); c.rotation.x = Math.PI; hint.add(c); const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 10, 24), toy('#ff6fae', { em: '#ff6fae', ei: .4 })); r.position.y = .45; r.rotation.x = Math.PI / 2; hint.add(r); }
function updateHint(t) {
  const P = player; let best = null, bd = 13;
  if (!P.ride && !P.stair) for (const it of G.interact) { if (it.layer !== P.layer || world.disc.has(it.disc) || Math.abs(it.y - P.y) > 4 || (it.need && !it.need())) continue; const d = Math.abs(it.x - P.x); if (d < bd) { bd = d; best = it; } }
  hint.visible = !!best;
  if (best) { hint.position.set(best.x, best.y + best.hintY + Math.sin(t * 4) * .15, .3); hint.rotation.y = t * 2; }
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
  const P = player; if (!started || P.stair) return;
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
function hold(id, key, onPress) {
  const el = $(id); const set = v => { if (keys[key] === v) return; keys[key] = v; el.classList.toggle('pressed', v); if (v && onPress) onPress(); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) { } Sound.unlocked = true; if (key === 'left' || key === 'right') keys.scale = 1; set(true); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, () => set(false)));
}
hold('leftBtn', 'left'); hold('rightBtn', 'right'); hold('upBtn', 'up', () => upAction()); hold('downBtn', 'down', () => downAction());
const press = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); Sound.unlocked = true; $(id).classList.add('pressed'); setTimeout(() => $(id).classList.remove('pressed'), 140); fn(); });
press('jumpBtn', jump); press('pawBtn', doAction);
addEventListener('keydown', e => { if (e.repeat) return; if (e.key === 'ArrowLeft') keys.left = true; if (e.key === 'ArrowRight') keys.right = true; if (e.key === ' ') jump(); if (e.key === 'ArrowUp') { keys.up = true; upAction(); } if (e.key === 'ArrowDown') { keys.down = true; downAction(); } if (e.key === 'e' || e.key === 'Enter') doAction(); });
addEventListener('keyup', e => { if (e.key === 'ArrowLeft') keys.left = false; if (e.key === 'ArrowRight') keys.right = false; if (e.key === 'ArrowUp') keys.up = false; if (e.key === 'ArrowDown') keys.down = false; });
addEventListener('blur', () => { if (stick) stickEnd(); keys.left = keys.right = keys.up = keys.down = false; document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed')); });

function jump() {
  const P = player; if (!started || P.stair) return;
  if (P.ride && P.ride.type === 'climb') { P.ride.boost = .25; return; }
  if (P.ride && P.ride.type === 'train') { train.whistle(); return; }
  if (P.ride && P.ride.type === 'kart') { if (P.ride.hop === 0) { P.ride.hopV = 7.5; Sound.boing(); discover('kartjump', 'Kart jump!'); } return; }
  if (P.ride) { if (P.ride.type === 'slide') return; P.y = Math.max(P.y, 0); const z = P.z; endRide(P.ride.type === 'carousel' ? 3 * P.facing : 0, 7); P.z = z; Sound.jump(1); return; }
  if (P.swim) { P.vy = 5.6; Sound.tone(420 + Math.random() * 120, .12, 'sine', .05, 1.6); burst(P.x, P.y + .3, P.z, ['#65dcec', '#ffda68', '#ff67ab', '#fff'], 6, 1.5); discover('swim', 'Swim, swim! Tap JUMP to swim up.'); return; }
  if (P.jumps < 2) { const J = CREATURES[P.creature].jump; P.vy = J[P.jumps]; P.jumps++; P.grounded = false; Sound.jump(P.jumps); burst(P.x, P.y + .1, P.z, ['#ffec83', '#fff', '#a9efff'], 8, 1.5); if (P.jumps === 2) discover('doublejump', 'Double jump! Reach the high places.'); }
}
function doAction() {
  const P = player; if (!started || P.stair) return;
  if (P.ride && P.ride.type === 'kart') { parkKart(); return; }
  if (P.ride && P.ride.type === 'train') { train.hopOff(); return; }
  if (P.ride) { jump(); return; }
  const d = nearDoor(); if (d) { d.go(); return; }
  let best = null, bd = 3.2;
  for (const it of G.interact) { if (it.layer !== P.layer || (it.need && !it.need())) continue; const dd = Math.abs(it.x - P.x); if (dd < bd && Math.abs(it.y - P.y) < 3) { bd = dd; best = it; } }
  if (best) { best.run(); return; }
  creature.tickle(); Sound.giggle(); burst(P.x, P.y + 2, P.z, ['#ff8fc8', '#ffd84a', '#ff6fae'], 10, 2);
}
// tapping / painting in the world
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let painting = null;
function pointerRay(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); }
function nearPaint() { const P = player; return P.layer === '' && P.y > -.5 && P.y < 3 && P.x > G.paint.x1 && P.x < G.paint.x2 && !P.ride; }
canvas.addEventListener('pointerdown', e => {
  if (!started) return; Sound.unlocked = true; pointerRay(e);
  if (nearPaint()) { const h = ray.intersectObject(G.paint.mesh)[0]; if (h && !ray.intersectObjects(DOORS.map(d => d.sprite).filter(s => s.visible)).length) { painting = { id: e.pointerId, last: h.uv.clone() }; paintAt(h.uv, h.uv); canvas.setPointerCapture(e.pointerId); discover('paint', 'Paint with your finger! Pick a colour below.'); return; } }
  if (false && !stick && e.clientX < innerWidth * .5) { stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), active: false, dx: 0, dy: 0, cx: e.clientX, cy: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (_) { } return; }
  worldTap(e);
});
function worldTap(e) {
  pointerRay(e);
  const targets = [creature.root, ...G.taps, ...bubbles.map(b => b.m), ...DOORS.filter(d => d.sprite.visible).map(d => d.sprite)];
  const hits = ray.intersectObjects(targets, true);
  // tapping your creature always tickles it, even when it stands behind balls or bubbles
  if (hits.some(h => h.object.userData.creature) && !hits.some(h => h.object.isSprite)) { creature.tickle(); Sound.giggle(); burst(player.x, player.y + 1.8, player.z, ['#ff8fc8', '#ffd84a', '#ff6fae'], 10, 2); discover('tickle', 'Hee hee! That tickles!'); return; }
  for (const h of hits) {
    let o = h.object; while (o && !o.userData.tap && !o.userData.creature) o = o.parent;
    if (!o) continue;
    if (o.userData.creature) { creature.tickle(); Sound.giggle(); burst(player.x, player.y + 1.8, player.z, ['#ff8fc8', '#ffd84a', '#ff6fae'], 10, 2); discover('tickle', 'Hee hee! That tickles!'); return; }
    o.userData.tap(h); return;
  }
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
function bounds() { const P = player; return P.layer === 'in' ? [IN.ox + .8, IN.ox + IN.w - .8] : P.layer === 'castle' ? [G.castleIn.ox + .8, G.castleIn.ox + G.castleIn.w - .8] : P.y < UG.ceil - .1 ? [UG.x0 + .6, UG.x1 - .6] : [.4, 419]; }
function updatePlayer(dt) {
  const P = player;
  if (P.stair) { updateStairs(dt); P.z += (IN.stair.z - P.z) * Math.min(1, dt * 8); return; }
  if (P.ride) { updateRide(dt); return; }
  const h = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); if (h) P.facing = h;
  // swimming in the deep part of the ball pit
  const swim = P.layer === '' && inShaftX(P.x) && P.y < .45 && P.y > UG.swimBottom;
  if (swim && !P.swim && P.vy <= 0) P.vy = -3.2; // plunge in with a splash
  if (swim && !P.swim) { Sound.tone(300, .25, 'sine', .05, .6); burst(P.x, Math.max(P.y, 0) + .6, 0, ['#65dcec', '#ffda68', '#b587ff', '#ff67ab'], 12, 2); discover('dive', 'The deep part! Swim down through the balls to a secret place. JUMP swims up!'); }
  P.swim = swim; if (swim) P.fromShaft = true;
  const crawl = P.layer === '' && P.y < UG.ceil - .1 && P.x > UG.tunnel[0] - .3 && P.x < UG.tunnel[1] + .3 && P.y < UG.tunnelCeil - .5;
  if (crawl && !P.crawl) discover('crawl', 'A tiny tunnel! Crawl through it.');
  P.crawl = crawl;
  const top = (swim ? 2.2 : crawl ? 3.4 : 5.2) * keys.scale, accel = P.grounded ? 40 : 22; if (P.driftT > 0 && !h && !P.grounded) { P.driftT -= dt; P.vx = P.drift; } else { P.driftT = 0; P.vx += clamp(h * top - P.vx, -accel * dt, accel * dt); }
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
  return P.layer === 'in' ? clamp(x, IN.ox + hw, IN.ox + IN.w - hw) : P.layer === 'castle' ? clamp(x, G.castleIn.ox + Math.min(hw, G.castleIn.w / 2), G.castleIn.ox + G.castleIn.w - Math.min(hw, G.castleIn.w / 2)) : clamp(x, -1 + hw, 423 - hw);
}
function snapCamera() { camT.look = player.ride ? 0 : player.facing * 1.8; camT.x = camTargetX(); camT.y = player.y; }
function updateCamera(dt) {
  const P = player;
  camT.look += ((P.ride ? (P.ride.type === 'train' ? P.facing * 2.6 : 0) : P.facing * 1.8) - camT.look) * Math.min(1, dt * 1.6);
  camT.x += (camTargetX() - camT.x) * Math.min(1, dt * 5);
  camT.y += (P.y - camT.y) * Math.min(1, dt * (P.grounded ? 4 : 2));
  const y = camT.y;
  // build 16: near the castle the camera steps back and looks up, so you can see the whole castle
  // (also a little at the Marble Machine, so its top ramps stay clear of the buttons)
  const castleK = P.layer === '' && !P.ride ? Math.max(Math.max(0, 1 - Math.abs(P.x - KINGDOM.castle) / 9), Math.max(0, 1 - Math.abs(P.x - 332) / 7) * .45) : 0; camT.cz = (camT.cz ?? 0) + (castleK - (camT.cz ?? 0)) * Math.min(1, dt * 1.5);
  const kz = P.ride && (P.ride.type === 'kart' || P.ride.type === 'train' || P.ride.type === 'whale') ? P.z : 0; camT.z = (camT.z ?? 0) + (kz - (camT.z ?? 0)) * Math.min(1, dt * 3);
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
  G.grassTime.value = t;
  G.diveRing.rotation.z = t * .8; G.diveRing.position.y = 1.05 + Math.sin(t * 3) * .08;
  bigStar.visible = !world.secret; bigStar.rotation.y = t * 1.6; bigStar.position.y = G.secretStar[1] + Math.sin(t * 2) * .12;
  // door/stair bubbles
  const near = nearDoor(); DOORS.forEach(d => { d.sprite.visible = d === near; if (d === near) d.sprite.position.set(d.x, d.y + 3.1 + Math.sin(t * 4) * .08, d.z); });
}

// ---------------- save / load ----------------
let saveTimer = 0;
function saveSoon() { saveTimer = 1.2; }
function save() {
  try {
    const d = { v: 1, creature: player.creature, x: player.layer === 'in' ? IN.door : player.layer === 'castle' ? KINGDOM.castle : Math.round(player.x * 10) / 10, disc: [...world.disc], bits: [...world.bits], secret: world.secret, fluffs: fluffs.map(f => f.state), sound: Sound.on, pet: (world.pets || [])[0] || null, pets: world.pets || [], buddies: world.buddies || {}, petStay: world.petStay || [], dinoFollow: world.dinoFollow || [false, false, false], petDraft: world.petDraft || null, balloons: world.balloons || [], build: world.build, colorings: world.colorings, styles: world.styles || {}, sparkle: !!world.sparkle, kart: world.kart, crown: !!world.crown, dinoEggs: world.dinoEggs };
    if (world.painted) d.paint = G.paint.canvas.toDataURL('image/jpeg', .82);
    else { const old = load(); if (old && old.paint) d.paint = old.paint; }
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
  } catch (e) { }
}
function load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
function restore(d) {
  if (!d) return;
  if (CREATURES[d.creature]) player.creature = d.creature;
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
  if (Array.isArray(d.dinoEggs) && d.dinoEggs.length === 3 && d.dinoEggs.every(v => typeof v === 'boolean')) world.dinoEggs = d.dinoEggs.slice();
  if (typeof d.x === 'number' && isFinite(d.x)) player.x = clamp(d.x, .5, 301);
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
let quality = TEST ? .4 : MOBILE ? .85 : 1, slow = 0, ema = 1 / 60;
if (TEST) renderer.shadowMap.enabled = false;
// soft "ambient occlusion" shadows (post.js); off in the light test mode and with ?nopost
const post = makePost(renderer, scene, camera, { mobile: MOBILE }); post.enabled = !TEST && !/[?&]nopost/.test(location.search);
function resize() {
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2) * quality;
  renderer.setPixelRatio(Math.max(.75, dpr)); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  post.setSize(w, h, renderer.getPixelRatio());
}
addEventListener('resize', resize); resize();
let portraits = {};
try { portraits = renderPortraits(); } catch (e) { }
document.querySelectorAll('[data-c]').forEach(el => { const img = el.querySelector('img'); if (img && portraits[el.dataset.c]) img.src = portraits[el.dataset.c]; });
function adapt(dt) {
  ema += (dt - ema) * .05;
  if (ema > 1 / 45 && (quality > .55 || post.enabled)) { slow += dt; if (slow > 1.5 && post.enabled && quality > .76) { quality -= .1; slow = 0; ema = 1 / 60; resize(); return; } /* first a little less resolution */ if (slow > 1.5 && post.enabled) { post.enabled = false; slow = 0; ema = 1 / 60; return; } /* then the post effects */ if (slow > 1.5) { quality -= .15; slow = 0; ema = 1 / 60; resize(); if (quality < .8 && sun.shadow.mapSize.x > 1024) { sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null; } } }
  else slow = Math.max(0, slow - dt * .5);
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
  // fixed 1/60 s physics steps: the game runs at the same speed on fast and slow devices
  timer.update(); const raw = Math.min(timer.getDelta(), .25); acc += raw;
  let n = 0; while (acc >= 1 / 60 && n < 15) { step(1 / 60); acc -= 1 / 60; n++; }
  if (n === 15) acc = 0;
  const dt = Math.max(1 / 60, n / 60);
  if (started) updateBits(T); updateHint(T);
  const P = player;
  // build 17: draw the creature between the last two physics steps (smooth on 60/90/120 Hz screens), and move the camera every frame
  const a = Math.min(1, acc * 60), far = Math.abs(P.x - prevP.x) > 2 || Math.abs(P.y - prevP.y) > 2; // (no blending across teleports)
  const ix = far ? P.x : prevP.x + (P.x - prevP.x) * a, iy = far ? P.y : prevP.y + (P.y - prevP.y) * a, iz = far ? P.z : prevP.z + (P.z - prevP.z) * a;
  { const sx = P.x, sy = P.y, sz = P.z; P.x = ix; P.y = iy; P.z = iz; updateCamera(Math.min(raw, .05)); P.x = sx; P.y = sy; P.z = sz; }
  creature.root.position.set(ix, iy, iz);
  { const gy = P.ride ? P.y : groundUnder(P.x, P.y), hgt = Math.max(0, P.y - gy), k = Math.max(.25, 1 - hgt / 4); blob.visible = !(P.ride && (P.ride.type === 'slide')) && !P.swim; blob.position.set(P.x, gy + .015, P.z); blob.scale.setScalar(k); shadowMat.opacity = k; }
  { const sliding = P.ride && (P.ride.type === 'slide' || P.ride.type === 'kart' || P.ride.type === 'train' || P.ride.type === 'whale'), k = Math.min(1, dt * 10), sy = P.crawl ? .6 : sliding ? .62 : 1, sx = P.crawl ? 1.15 : sliding ? .62 : 1; creature.root.scale.set(lerp(creature.root.scale.x, sx, k), lerp(creature.root.scale.y, sy, k), lerp(creature.root.scale.z, sx, k)); }
  creature.update(dt, { vx: P.vx, vy: P.vy, grounded: P.grounded || !!P.ride, seated: !!P.ride && P.ride.type !== 'slide', facing: P.facing, happy: P.happy });
  P.happy = Math.max(0, P.happy - dt);
  $('paintTools').classList.toggle('show', started && (nearPaint() || meadow.nearColor(player)));
  $('buildTools').classList.toggle('show', started && meadow.nearBuild(player));
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('shown'); }
  if (saveTimer > 0) { saveTimer -= dt; if (saveTimer <= 0) save(); }
  if (world.flash > 0) { world.flash -= dt * 2.5; $('flash').style.opacity = Math.max(0, world.flash); }
  if (post.enabled) post.render(); else renderer.render(scene, camera);
  if (!TEST && !/[?&]hq/.test(location.search)) adapt(raw);
  requestAnimationFrame(frame);
}

// ---------------- boot ----------------
const saved = load();
restore(saved);
setCreature(player.creature);
document.querySelectorAll('.introPick').forEach(x => x.classList.toggle('picked', x.dataset.c === player.creature));
friends.restored(); meadow.restored(); karts.rebuildPreview();
updateCounters(); snapCamera(); updateBits(0);
// (build 9: arrow buttons are back, so there is no drag hint)
if (saved) $('playBtn').textContent = 'KEEP PLAYING ▶';
$('playBtn').addEventListener('click', () => { Sound.unlocked = true; started = true; $('overlay').classList.add('hidden'); document.body.classList.add('playing'); Sound.chime(); if (!saved) toast('✨ Find the 6 lost baby Fluffkins and take them home!'); });
addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
// compile all the shaders first (in the background where the browser allows it), then start
let begun = false;
const begin = () => { if (begun) return; begun = true; requestAnimationFrame(frame); setTimeout(() => $('loading').classList.add('done'), 250); };
try { if (renderer.extensions.has('KHR_parallel_shader_compile')) renderer.compileAsync(scene, camera).then(begin, begin); else begin(); } catch (e) { begin(); }
setTimeout(begin, 8000);

// debug/test hook (used by the automated tests only)
window.__DDW3 = {
  player, world, keys, fluffs, G, camera, Sound, save, IN,
  teleport(x, y = 0) { player.ride = null; player.stair = null; player.layer = x >= 2000 ? 'castle' : x >= 1000 ? 'in' : ''; player.x = x; player.y = y; player.vx = player.vy = 0; player.grounded = y === 0; snapCamera(); },
  toScreen(x, y, z = 0) { V.set(x, y, z).project(camera); const r = canvas.getBoundingClientRect(); return { x: (V.x + 1) / 2 * r.width + r.left, y: (1 - V.y) / 2 * r.height + r.top }; },
  pick(cx, cy) { pointerRay({ clientX: cx, clientY: cy }); return ray.intersectObjects([creature.root, ...G.taps], true).slice(0, 4).map(h => { let o = h.object, n = 0; while (o && !o.userData.tap && !o.userData.creature) { o = o.parent; n++; } return [h.object.type, h.distance.toFixed(2), o ? (o.userData.creature ? 'creature' : 'tap') : 'none', h.object.position.x.toFixed(1)]; }); },
  bodyScaleY: () => creature.parts.body.scale.y, friends, meadow, karts, train, marbles, kingdom: () => kingdom, meadowRestore: () => meadow.restored(),
  bubbles: () => bubbles.length, info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, progs: renderer.info.programs.length }), post, quality: () => quality, nearDoor: () => nearDoor() && nearDoor().kind,
};
