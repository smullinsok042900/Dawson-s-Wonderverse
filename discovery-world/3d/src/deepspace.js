// ===================================================================
// deepspace.js (build 126): OPEN SPACE. From any launch pad Dawson can choose 🌌 and fly her rocket herself among the
// Sun, the planets, the Moon, Pluto and the asteroid belt; stop anywhere; climb out in a bubble helmet with a little jetpack
// and float about; and land on any planet she flies up to.
//
// HOW IT STAYS FAST AND SIMPLE
//  * A scaled, flat-ish solar system: the Sun in the middle and each planet on its own circle (hundreds of metres apart,
//    not millions of kilometres), so a trip takes seconds, never minutes. The autopilot flies faster the farther away
//    the goal is.
//  * The camera keeps its normal 600 m far plane. Anything farther than SKY_R is drawn as a "sky body": in the right
//    direction, but pulled in to SKY_R and shrunk in proportion, so it looks exactly the same size from where she is
//    (the classic skybox trick). No huge coordinates in the depth buffer, no far-plane change, no precision problems.
//  * The asteroid belt is 32 sectors; only the few near the rocket are built (one painted mesh each) and the rest are
//    freed, so the belt costs the same anywhere.
//  * Everything is built when she first flies out (in small slices during the blast-off) and freed when she lands.
//    Planet pictures are small canvas paintings, made once and kept.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';

import { DIMENSIONS } from './dimensions.js';
export const DEEP = { ox: 30000, oy: 0, oz: 0 };
const SKY_R = 430;
// [id, radius, orbit radius, angle, picture colours, what the voice says, landable]
export const BODIES = [
  ['sun', 120, 0, 0, ['#fff3b0', '#ff9a1a'], 'The Sun! A giant star of super hot glowing gas. Magic golden platforms float above it. Tap 🛬 to land!', true],
  ['mercury', 9, 330, .4, ['#c9b9a8', '#7d6e62'], 'Mercury, the smallest planet, closest to the Sun.', true],
  ['venus', 16, 470, 1.5, ['#ffe39a', '#d9a24a'], 'Venus, wrapped in thick yellow clouds.', true],
  ['earth', 17, 640, 2.6, ['#4aa8ff', '#1d5fc0'], 'Earth, our home! Blue oceans and green land.', true],
  ['moon', 5, 0, 0, ['#e8e8ee', '#9a9aa8'], 'The Moon goes round and round the Earth.', true],
  ['mars', 12, 820, 3.7, ['#ff8a5c', '#b2432a'], 'Mars, the red planet!', true],
  ['jupiter', 60, 1350, 4.9, ['#f3d9b0', '#c58e5a'], 'Jupiter, the biggest planet of all!', true],
  ['saturn', 50, 1800, .9, ['#f6e3b0', '#caa465'], 'Saturn and its beautiful rings!', true],
  ['uranus', 30, 2200, 2.1, ['#a8f0f2', '#5cc4cc'], 'Uranus, the planet that rolls on its side.', true],
  ['neptune', 29, 2550, 3.2, ['#6d8dff', '#2a3fb8'], 'Neptune, the windy blue planet, far away.', true],
  ['pluto', 4, 2900, 4.3, ['#f0dcc8', '#a8806a'], 'Little icy Pluto, with a big heart!', true],
];
export const BELT = { r0: 1020, r1: 1160, sectors: 32 };
const posOf = (id, out = new THREE.Vector3()) => {
  const b = BODIES.find(q => q[0] === id); if (!b) return null;
  if (id === 'moon') { posOf('earth', out); return out.add(new THREE.Vector3(Math.cos(.8) * 42, 4, Math.sin(.8) * 42)); }
  return out.set(DEEP.ox + Math.cos(b[3]) * b[2], DEEP.oy + (id === 'sun' ? 0 : Math.sin(b[3] * 3) * 12), DEEP.oz + Math.sin(b[3]) * b[2]);
};
export const bodyPos = posOf;

// a planet painted as a small map (canvas drawing, not per-pixel maths: a few milliseconds, once per planet)
const TEX = {};
function planetTex(id) {
  if (TEX[id]) return TEX[id];
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const b = BODIES.find(q => q[0] === id), [c0, c1] = b[4];
  let s = id.length * 977 + id.charCodeAt(0) * 31; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, c1); gr.addColorStop(.5, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  const blob = (x, y, rx, ry, col) => { for (const dx of [-256, 0, 256]) { g.fillStyle = col; g.beginPath(); g.ellipse(x + dx, y, rx, ry, 0, 0, 7); g.fill(); } };
  if (['jupiter', 'saturn', 'uranus', 'neptune', 'venus'].includes(id)) {
    const bands = { jupiter: ['#c9875a', '#f0d6b4', '#b8714a', '#e8c49a'], saturn: ['#e2c58e', '#f3e2bc', '#d8b77c'], uranus: ['#bff3f6', '#9ae4ea'], neptune: ['#5a7cf0', '#3048c0', '#8aa8ff'], venus: ['#fff0c0', '#e8b860'] }[id];
    for (let y = 0; y < 128; y += 6 + rnd() * 8) { g.globalAlpha = .45 + rnd() * .3; g.fillStyle = bands[Math.floor(rnd() * bands.length)]; g.fillRect(0, y, 256, 3 + rnd() * 7); }
    g.globalAlpha = 1; if (id === 'jupiter') blob(170, 82, 16, 9, '#c4553a'); if (id === 'neptune') blob(90, 70, 12, 6, '#1b2a8a');
  } else if (id === 'earth') {
    for (let k = 0; k < 9; k++) blob(rnd() * 256, 25 + rnd() * 78, 14 + rnd() * 24, 8 + rnd() * 16, k % 3 ? '#4fbf5a' : '#c9a86a');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 9); g.fillRect(0, 119, 256, 9); g.globalAlpha = .55; for (let k = 0; k < 14; k++) blob(rnd() * 256, rnd() * 128, 18 + rnd() * 20, 3 + rnd() * 4, '#ffffff'); g.globalAlpha = 1;
  } else if (id === 'sun') {
    for (let k = 0; k < 120; k++) { g.globalAlpha = .25; blob(rnd() * 256, rnd() * 128, 4 + rnd() * 10, 3 + rnd() * 8, rnd() < .5 ? '#fff8d0' : '#ff8a1a'); } g.globalAlpha = 1;
  } else {
    for (let k = 0; k < 26; k++) { const x = rnd() * 256, y = rnd() * 128, r = 3 + rnd() * 9; g.globalAlpha = .25; blob(x, y, r, r * .8, '#000000'); blob(x - 1, y - 1, r * .6, r * .5, '#ffffff'); }
    g.globalAlpha = 1; if (id === 'mars') { blob(128, 4, 140, 7, '#ffffff'); } if (id === 'pluto') blob(150, 70, 22, 18, '#fff4e6');
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (TEX[id] = t);
}

// the toy rocket as one painted mesh lying along its flight direction (+ -z is forward); friends' rockets use it too
let ROCKET_GEO = null;
export function rocketMesh() {
  if (!ROCKET_GEO) { const rb = K.makeBatch(); for (const [g2, c, x = 0, y = 0, z = 0, sc = 1, rot] of K.rocketParts()) rb.put(g2, x, y, z, c, sc, rot); ROCKET_GEO = rb.mesh(K.shinyMat()).geometry; ROCKET_GEO.userData.shared = true; }
  const hull = new THREE.Mesh(ROCKET_GEO, K.shinyMat()); hull.rotation.x = -Math.PI / 2; hull.position.z = 3.4; const g = new THREE.Group(); g.add(hull); g.userData.dynamic = true; return g;
}

export function initDeep(G, api) {
  const { scene, Sound, player: P } = api;
  const say = (m, speak = true) => api.toast(m, speak);
  let root = null, S = null, belt = new Map(), hud = null, mapPanel = null;
  const sky = K.makeSky(); scene.add(sky.mesh);
  const V = new THREE.Vector3(), V2 = new THREE.Vector3(), F = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const LOOK = { sun: ['#fff2dc', 2.6], hemi: ['#8090c0', '#202030', .55], fog: ['#000006', 900, 2000], env: .15, rim: ['#9ab4ff', .6] };

  // ---------- building (in slices, during the blast-off) ----------
  function* build() {
    root = new THREE.Group(); root.name = 'deepspace'; root.userData.dynamic = true; scene.add(root); root.visible = false;
    const bodies = [];
    for (const b of BODIES) {
      const [id, r] = b, emissive = id === 'sun';
      const mat = emissive ? new THREE.MeshBasicMaterial({ map: planetTex(id), fog: false }) : new THREE.MeshStandardMaterial({ map: planetTex(id), roughness: 1, metalness: 0, fog: false });
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), mat); m.userData.dynamic = true; root.add(m);
      const extra = [];
      if (id === 'saturn' || id === 'uranus') { const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 2.2, 64), new THREE.MeshBasicMaterial({ color: id === 'saturn' ? '#e8d29a' : '#d8fbfc', transparent: true, opacity: id === 'saturn' ? .75 : .35, side: THREE.DoubleSide, fog: false, depthWrite: false })); ring.rotation.x = id === 'saturn' ? -1.2 : -.2; ring.rotation.y = id === 'uranus' ? 1.3 : 0; m.add(ring); extra.push(ring); }
      const halo = id === 'sun' ? K.glow('#ffb040', 1, .55) : id === 'earth' ? K.glow('#6ab0ff', 1, .25) : null; if (halo) { root.add(halo); halo.userData.k = id === 'sun' ? 3.3 : 2.5; }
      bodies.push({ id, r, m, halo, pos: posOf(id).clone(), label: b[5], land: b[6] });
      yield;
    }
    // the rocket she flies: the same toy rocket, merged into one painted mesh, lying along its flight direction
    const rocket = rocketMesh(); root.add(rocket);
    const glass = new THREE.Mesh(K.rocketGlass(), new THREE.MeshStandardMaterial({ color: '#9fe6ff', emissive: '#3a7fb0', emissiveIntensity: .4, roughness: .1 })); glass.position.set(0, .9, 3.4 - 3.6); rocket.add(glass);
    const flame = K.glow('#ffb040', 3.2, .9); flame.position.set(0, 0, 3.6); rocket.add(flame);
    S = { bodies, rocket, flame, glass, pos: new THREE.Vector3(), yaw: 0, speed: 0, auto: null, mode: 'fly', near: null, walk: null, t: 0, cam: new THREE.Vector3(), camYaw: 0, told: {}, got: { stars: 0, hoops: 0, crystals: 0 } };
    yield* buildPlaces();
  }


  // ---------- (build 126, phase 3) places to visit in open space ----------
  const SPOTS = {}; // id -> world position the autopilot flies to
  function* buildPlaces() {
    const E = S.bodies.find(b => b.id === 'earth').pos, M = S.bodies.find(b => b.id === 'mars').pos;
    // STAR STATION: a big spinning ring with spokes, a hub, solar panels and a glowing docking bay
    const st = new THREE.Group(); st.position.copy(E).add(V.set(70, 8, 52)); st.userData.dynamic = true; root.add(st); SPOTS.station = st.position.clone();
    const sb = K.makeBatch(), tor = new THREE.TorusGeometry(16, 2.2, 12, 48), cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
    sb.put(tor, 0, 0, 0, '#e8ecf6', 1, [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; sb.put(K.geo.box(), Math.cos(a) * 16.2, .9, Math.sin(a) * 16.2, k % 2 ? '#7fd0ff' : '#ffd23f', [1.2, .5, 1.2], [0, -a, 0]); } // windows all round
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4; sb.put(cyl, Math.cos(a) * 8, 0, Math.sin(a) * 8, '#c9cdd8', [.5, 16, .5], [0, -a, Math.PI / 2]); }
    sb.put(K.geo.sph(1), 0, 0, 0, '#ffffff', [4.5, 3.2, 4.5]); sb.put(cyl, 0, 4, 0, '#c9cdd8', [.8, 6, .8]);
    for (const s2 of [-1, 1]) sb.put(K.geo.box(), s2 * 11, 7, 0, '#2a3f9a', [12, .2, 4.5]); sb.put(cyl, 0, 7, 0, '#c9cdd8', [.3, 28, .3], [0, 0, Math.PI / 2]); // solar panels
    sb.put(K.geo.box(), 0, -3.8, 0, '#ff4f9a', [6, 2, 6]); // the docking bay
    const stm = sb.mesh(K.shinyMat()); st.add(stm); tor.dispose(); cyl.dispose();
    const bay = K.glow('#9ff7ff', 9, .55); bay.position.set(0, -5.5, 0); st.add(bay);
    SPOTS.dock = st.position.clone().add(V.set(0, -9, 0));
    yield;
    // floating stars round the station to collect on a spacewalk
    S.stars = []; const starGeo = new THREE.OctahedronGeometry(.7, 0), starMat = new THREE.MeshStandardMaterial({ color: '#ffd84a', emissive: '#ffb000', emissiveIntensity: .7, roughness: .3 });
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = 22 + (k % 3) * 6; const m = new THREE.Mesh(starGeo, starMat); m.position.copy(st.position).add(V.set(Math.cos(a) * r, -6 + (k % 4) * 4, Math.sin(a) * r)); m.userData.dynamic = true; root.add(m); S.stars.push(m); }
    // star jellies: gentle glowing space creatures (clearly made-up!) that drift round the station
    S.jellies = [];
    for (let k = 0; k < 5; k++) {
      const jb = K.makeBatch(), col = ['#ff9fe8', '#9ff7ff', '#c9a6ff', '#ffe08a', '#9fffc8'][k];
      jb.put(K.geo.sph(1), 0, 0, 0, col, [1, .75, 1]); jb.put(K.geo.sph(1), -.32, .1, .82, '#2a2333', .13); jb.put(K.geo.sph(1), .32, .1, .82, '#2a2333', .13);
      for (let t = 0; t < 6; t++) { const a = t / 6 * Math.PI * 2; jb.put(K.geo.cyl(6), Math.cos(a) * .55, -1, Math.sin(a) * .55, col, [.08, 1.3, .08]); }
      const j = jb.mesh(K.shinyMat()); j.userData.dynamic = true; j.userData.home = st.position.clone().add(V.set(Math.cos(k * 1.3) * 28, 4 - k * 2, Math.sin(k * 1.3) * 28)); j.position.copy(j.userData.home); root.add(j); S.jellies.push(j);
    }
    yield;
    // THE HOOP TRAIL near Mars: eight giant glowing hoops to fly the rocket through
    S.hoops = []; const hoopGeo = new THREE.TorusGeometry(7, .5, 8, 36);
    for (let k = 0; k < 8; k++) {
      const m = new THREE.Mesh(hoopGeo, new THREE.MeshStandardMaterial({ color: ['#ff4f9a', '#ffd23f', '#4fe07a', '#4fa8ff', '#b07cff', '#ff8a3d', '#4fe0e0', '#ff6fd8'][k], emissive: '#ffffff', emissiveIntensity: .18, roughness: .4 }));
      m.position.copy(M).add(V.set(60 + k * 26, Math.sin(k * .9) * 8, -50 - Math.sin(k * .6) * 30)); m.rotation.y = Math.PI / 2 - .3; m.userData.dynamic = true; root.add(m); S.hoops.push({ m, got: false });
    }
    SPOTS.hoops = S.hoops[0].m.position.clone().add(V.set(-40, 0, 10));
    // A COMET with a long glowing tail, slowly going round the Sun
    const comet = new THREE.Group(); comet.userData.dynamic = true; root.add(comet);
    comet.add(new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), new THREE.MeshStandardMaterial({ color: '#dff6ff', emissive: '#6ab8ff', emissiveIntensity: .5, roughness: .6 })));
    const tail = []; for (let k = 0; k < 7; k++) { const g = K.glow(k % 2 ? '#bfe8ff' : '#ffffff', 14 + k * 7, .5 - k * .06); comet.add(g); tail.push(g); }
    S.comet = { g: comet, tail, a: 2.2 };
    yield;
    // (build 131) THE WORMHOLES: a giant swirl for each dimension (dimensions.js). One small animated shader each (a soft
    // spiral, no flashing); it never draws the other world, so it costs the same as one big disc. Fly in to travel there.
    S.worm = [];
    for (const d of DIMENSIONS) {
      const [a, r, h] = d.wormhole.at, [c1, c2, c3] = d.wormhole.colors, R = 26, g = new THREE.Group(); g.userData.dynamic = true; root.add(g);
      g.position.set(DEEP.ox + Math.cos(a) * r, DEEP.oy + h, DEEP.oz + Math.sin(a) * r); g.lookAt(DEEP.ox, DEEP.oy + h, DEEP.oz);
      const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
        uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(c1) }, uB: { value: new THREE.Color(c2) }, uC: { value: new THREE.Color(c3) } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `precision mediump float; uniform float uT; uniform vec3 uA, uB, uC; varying vec2 vP;
          void main(){ float r = length(vP) / ${R.toFixed(1)}, a = atan(vP.y, vP.x); float sw = sin(a * 3. + log(r + .02) * 7. - uT * 1.6) * .5 + .5;
            vec3 c = mix(mix(uA, uB, sw), uC, smoothstep(.55, 1., sin(a * 5. - log(r + .02) * 4. + uT) * .5 + .5) * .6);
            c = mix(vec3(1.), c, smoothstep(.0, .28, r)); float alpha = smoothstep(1., .82, r) * .92; gl_FragColor = vec4(c, alpha); }` });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 72), mat); g.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 1.6, 10, 72), new THREE.MeshStandardMaterial({ color: c2, emissive: c1, emissiveIntensity: .6, roughness: .4 })); g.add(rim);
      const halo = K.glow(c1, R * 3.2, .35); g.add(halo);
      const pts = new Float32Array(240 * 3); for (let k2 = 0; k2 < 240; k2++) { const q = k2 / 240, ang = q * 30, rad = R * (1.1 + q * .9); pts.set([Math.cos(ang) * rad, Math.sin(ang) * rad, (Math.sin(k2) * 4)], k2 * 3); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const sparks = new THREE.Points(pg, new THREE.PointsMaterial({ color: c3, size: 1.6, transparent: true, opacity: .85, depthWrite: false })); g.add(sparks);
      g.traverse(o => { o.userData.dynamic = true; });
      S.worm.push({ d, g, mat, sparks, R }); SPOTS['wh:' + d.id] = g.position.clone();
    }
    yield;
  }
  const ROUND = new THREE.Vector3();
  function updatePlaces(dt, near) {
    const t = S.t;
    for (const w of S.worm || []) { w.mat.uniforms.uT.value = t; w.sparks.rotation.z = -t * .25; const dist = S.pos.distanceTo(w.g.position);
      if (S.mode === 'fly' && !S.warping && dist < w.R * .7) warp(w.d);
      else if (dist < 160 && !S.told['wh' + w.d.id]) { S.told['wh' + w.d.id] = 1; say(`🌀 A WORMHOLE! It goes to ${w.d.name}! Fly right into it!`); api.discover && api.discover('wormhole'); } }
    // the comet: round the Sun, its tail always pointing away from it
    const c = S.comet; c.a += dt * .006; c.g.position.set(DEEP.ox + Math.cos(c.a) * 1500, DEEP.oy + 30, DEEP.oz + Math.sin(c.a) * 1500); SPOTS.comet = c.g.position.clone().add(V.set(0, 0, 30));
    const away = V2.copy(c.g.position).sub(V.set(DEEP.ox, DEEP.oy, DEEP.oz)).normalize(); c.tail.forEach((g, k) => g.position.copy(away).multiplyScalar(6 + k * 9));
    // star jellies bob and drift; they swim a little toward her when she floats near
    for (const [k, j] of S.jellies.entries()) { const h = j.userData.home; ROUND.copy(h).add(V.set(Math.sin(t * .3 + k) * 4, Math.sin(t * .8 + k * 2) * 1.5, Math.cos(t * .25 + k) * 4));
      if (S.walk && S.walk.pos.distanceTo(j.position) < 14) ROUND.lerp(S.walk.pos, .55); j.position.lerp(ROUND, Math.min(1, dt * .8)); j.scale.set(1, 1 + Math.sin(t * 3 + k) * .08, 1); }
    // stars round the station: collect them by floating (or flying) into them
    for (const m of S.stars) { if (!m.visible) continue; m.rotation.y += dt * 1.5; if (near.distanceTo(m.position) < 2.2) { m.visible = false; S.got.stars++; Sound.tone(660 + S.got.stars * 40, .15, 'sine', .07, 1.5); say(S.got.stars === S.stars.length ? '🌟 You found ALL the stars round Star Station!' : '⭐ ' + S.got.stars, S.got.stars === S.stars.length); } }
    // the hoop trail: fly the rocket through every hoop
    if (S.mode === 'fly') for (const [k, h] of S.hoops.entries()) { if (h.got) continue; const d = ROUND.copy(S.pos).sub(h.m.position); if (d.length() < 6.5) { h.got = true; h.m.material.emissiveIntensity = .9; S.got.hoops++; Sound.tone(520 + k * 80, .18, 'sine', .07, 1.5); if (S.got.hoops === S.hoops.length) { say('🎉 Through every hoop! What a pilot!'); api.discover('hoops'); } } }
    // the comet: fly close for a fact
    if (!S.told.comet && near.distanceTo(c.g.position) < 60) { S.told.comet = 1; say('☄️ A comet! It is a big ball of ice and dust. Near the Sun its ice glows into a long, long tail!'); api.discover('comet'); }
    // docking at Star Station
    const atDock = S.mode === 'fly' && S.pos.distanceTo(SPOTS.dock) < 26; if (atDock !== !!S.atDock) { S.atDock = atDock; refreshHud(); if (atDock) say('🛰️ Star Station! Tap 🛰️ to dock and float around it!'); }
  }
  function dock() {
    if (!S.atDock) return; S.auto = null; S.speed = 0; S.pos.copy(SPOTS.dock); S.yaw = 0; Sound.chime(); say('🛰️ Docked at Star Station! Float out and collect the stars!'); api.discover('station'); S.atDock = false; startWalk();
  }

  // the asteroid belt: sector k is built only while the rocket is near it
  let CRYSTAL_G = null; const crystalsGot = new Set(); const CRYSTAL_M = ['#9ff7ff', '#ff9fe8', '#c9a6ff'].map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .45, roughness: .15 }));
  const sectorAngle = k => (k + .5) / BELT.sectors * Math.PI * 2;
  function buildSector(k) {
    const b = K.makeBatch(), a0 = k / BELT.sectors * Math.PI * 2, a1 = (k + 1) / BELT.sectors * Math.PI * 2;
    let s = k * 7919 + 13; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {
      const a = a0 + rnd() * (a1 - a0), r = BELT.r0 + rnd() * (BELT.r1 - BELT.r0), sz = .8 + Math.pow(rnd(), 3) * 9, y = (rnd() - .5) * 40;
      const c0 = K.ramp(['#6d6058', '#9a8c80', '#b8a894'], rnd(), new THREE.Color());
      b.put(K.rockGeo(i + k * 50, .3, sz < 3), DEEP.ox + Math.cos(a) * r, DEEP.oy + y, DEEP.oz + Math.sin(a) * r, (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.7 + .4 * Math.max(0, ny)); }, [sz * (.8 + rnd() * .6), sz * (.6 + rnd() * .5), sz * (.8 + rnd() * .5)], [rnd() * 6, rnd() * 6, 0]);
    }
    const m = b.mesh(K.shinyMat()); m.userData.dynamic = true; root.add(m);
    // sparkly crystals floating among the rocks: fly or float into one to collect it (each crystal only once)
    m.userData.crystals = [];
    for (let i = 0; i < 4; i++) { const a = a0 + rnd() * (a1 - a0), r = BELT.r0 + 25 + rnd() * (BELT.r1 - BELT.r0 - 50), key = k * 10 + i; if (crystalsGot.has(key)) continue;
      const cm = new THREE.Mesh(CRYSTAL_G || (CRYSTAL_G = new THREE.OctahedronGeometry(1.1, 0)), CRYSTAL_M[i % 3]); cm.scale.set(.8, 1.6, .8); cm.position.set(DEEP.ox + Math.cos(a) * r, DEEP.oy + (rnd() - .5) * 16, DEEP.oz + Math.sin(a) * r); cm.userData.key = key; cm.userData.dynamic = true; root.add(cm); m.userData.crystals.push(cm); }
    return m;
  }
  function updateBelt(p) {
    const rr = Math.hypot(p.x - DEEP.ox, p.z - DEEP.oz), want = new Set();
    if (rr > BELT.r0 - 420 && rr < BELT.r1 + 420) { const a = Math.atan2(p.z - DEEP.oz, p.x - DEEP.ox); for (let k = 0; k < BELT.sectors; k++) { let d = Math.abs(sectorAngle(k) - a); d = Math.min(d, Math.PI * 2 - d); if (d * rr < 520) want.add(k); } }
    let made = 0;
    for (const k of want) if (!belt.has(k) && made++ < 1) belt.set(k, buildSector(k)); // one new sector a frame at most
    for (const [k, m] of belt) if (!want.has(k)) { root.remove(m); m.geometry.dispose(); for (const cm of m.userData.crystals) root.remove(cm); belt.delete(k); }
    for (const [, m] of belt) for (const cm of m.userData.crystals) { if (!cm.visible) continue; cm.rotation.y += .02; if (p.distanceTo(cm.position) < (S.mode === 'fly' ? 7 : 2.4)) { cm.visible = false; crystalsGot.add(cm.userData.key); S.got.crystals++; Sound.tone(880, .12, 'sine', .07, 1.6); say('💎 ' + S.got.crystals, false); if (S.got.crystals === 1) say('💎 A space crystal! Asteroids are rocks left over from when the planets were made.'); } }
  }

  // ---------- picture buttons ----------
  function button(id, icon, label, fn, place) {
    const b = document.createElement('button'); b.id = id; b.className = 'pill deepBtn'; b.textContent = icon; b.setAttribute('aria-label', label);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; if (performance.now() < quietUntil || (mapPanel && mapPanel.style.display !== 'none')) return; fn(); });
    Object.assign(b.style, { position: 'fixed', fontSize: '30px', width: '62px', height: '62px', borderRadius: '20px', zIndex: 60, ...place }); return b;
  }
  function showHud(on) {
    if (on && !hud) {
      hud = document.createElement('div'); hud.id = 'deepHud';
      hud.append(button('deepMap', '🗺️', 'picture map: where shall we fly?', openMap, { top: '116px', right: '18px' }),
        button('deepWalk', '🧑‍🚀', 'float outside the rocket', () => S.mode === 'fly' ? startWalk() : backToRocket(), { top: '182px', right: '18px' }),
        button('deepLand', '🛬', 'land here', land, { top: '248px', right: '18px' }),
        button('deepDock', '🛰️', 'dock at Star Station', () => dock(), { top: '248px', right: '86px' }),
        button('deepDown', '⬇️', 'float down', () => { if (S.walk) S.walk.down = .9; }, { bottom: '22px', right: '210px' }));
      document.body.appendChild(hud);
    }
    if (hud) hud.style.display = on ? '' : 'none';
  }
  function refreshHud() {
    if (!hud) return; const w = S.mode !== 'fly';
    hud.querySelector('#deepWalk').textContent = w ? '🚀' : '🧑‍🚀'; hud.querySelector('#deepWalk').setAttribute('aria-label', w ? 'back into the rocket' : 'float outside the rocket');
    hud.querySelector('#deepLand').style.display = !w && S.near && S.near.land ? '' : 'none';
    hud.querySelector('#deepDown').style.display = w ? '' : 'none';
    hud.querySelector('#deepDock').style.display = !w && S.atDock ? '' : 'none';
    hud.querySelector('#deepMap').style.display = w ? 'none' : '';
  }
  // the map closes a moment after the finger lifts, and the buttons under it ignore that same touch (a tap on a planet
  // picture must never also press 🛬 underneath it)
  let quietUntil = 0;
  function closeMap() { quietUntil = performance.now() + 600; setTimeout(() => { if (mapPanel) mapPanel.style.display = 'none'; }, 250); }
  function openMap() {
    if (!mapPanel) {
      mapPanel = document.createElement('div'); mapPanel.id = 'deepMapPanel';
      Object.assign(mapPanel.style, { position: 'fixed', inset: '0', background: 'rgba(10,8,40,.72)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', padding: '60px 20px' });
      for (const b of [...BODIES.map(q => q[0]), 'belt', 'station', 'hoops', 'comet', ...DIMENSIONS.map(d => 'wh:' + d.id)]) {
        const t = document.createElement('button'); t.className = 'deepTile'; t.dataset.id = b; t.setAttribute('aria-label', b);
        Object.assign(t.style, { width: '84px', height: '84px', borderRadius: '50%', border: '4px solid #fff', backgroundSize: 'cover', backgroundColor: '#22184a', fontSize: '40px' });
        if (b.startsWith('wh:')) { const d = DIMENSIONS.find(q => 'wh:' + q.id === b); t.textContent = '🌀'; t.style.background = `radial-gradient(circle, #fff 0 12%, ${d.wormhole.colors[0]} 40%, ${d.wormhole.colors[1]} 75%)`; t.setAttribute('aria-label', 'wormhole to ' + d.name); } else if (b === 'belt' || b === 'station' || b === 'hoops' || b === 'comet') t.textContent = { belt: '🪨', station: '🛰️', hoops: '⭕', comet: '☄️' }[b]; else if (b === 'sun') { t.textContent = '☀️'; t.style.backgroundColor = '#ffb040'; } else t.style.backgroundImage = `url(${api.art(b)})`;
        t.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); flyTo(b); closeMap(); }); mapPanel.appendChild(t);
      }
      const x = document.createElement('button'); x.textContent = '✖'; x.className = 'pill'; Object.assign(x.style, { position: 'absolute', top: '14px', right: '14px', fontSize: '28px' });
      x.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); closeMap(); }); mapPanel.appendChild(x);
      document.body.appendChild(mapPanel);
    }
    mapPanel.style.display = 'flex'; Sound.click(); api.speak('Where shall we fly? Tap a picture!');
  }
  function flyTo(id) {
    S.auto = id; Sound.chime();
    const name = id.startsWith('wh:') ? 'the wormhole' : id === 'station' ? 'Star Station' : id === 'hoops' ? 'the hoop trail' : id === 'comet' ? 'the comet' : id === 'belt' ? 'the asteroid belt' : id === 'sun' ? 'the Sun' : id === 'moon' ? 'the Moon' : id[0].toUpperCase() + id.slice(1);
    say(`🚀 Off we go to ${name}!`);
  }
  const targetPos = (id, out) => {
    if (SPOTS[id === 'station' ? 'dock' : id]) return out.copy(SPOTS[id === 'station' ? 'dock' : id]);
    if (id === 'belt') { const a = Math.atan2(S.pos.z - DEEP.oz, S.pos.x - DEEP.ox); return out.set(DEEP.ox + Math.cos(a) * (BELT.r0 - 30), DEEP.oy, DEEP.oz + Math.sin(a) * (BELT.r0 - 30)); }
    return out.copy(S.bodies.find(b => b.id === id).pos);
  };

  // ---------- entering and leaving ----------
  let building = null;
  function prepare() { if (!root && !building) { const it = build(); building = it; api.slices(it).then(() => { building = null; }); } return building ? api.slices(building) : Promise.resolve(); }
  async function enter(padKey) {
    if (!root) { const it = build(); await api.slices(it); }
    root.visible = true; sky.mesh.visible = true;
    sky.set({ top: '#01010a', mid: '#03031a', hor: '#070826', low: '#020210', stars: 1, sunDir: [0, .05, -1], sunCol: '#000000', glow: [8, 0, 0] });
    api.light(LOOK);
    S.pad = padKey; S.mode = 'fly'; S.speed = 0; S.auto = null; S.near = null;
    const from = padKey && padKey !== 'earth' && BODIES.find(b => b[0] === padKey) ? padKey : 'earth';
    const fp = S.bodies.find(b => b.id === from).pos; S.pos.copy(fp).add(V.set(-1, 0, .3).normalize().multiplyScalar(S.bodies.find(b => b.id === from).r + 26)); S.yaw = Math.atan2(-(DEEP.ox - S.pos.x), -(DEEP.oz - S.pos.z)) + .9;
    S.cam.copy(S.pos).add(V.set(0, 4, 14)); S.camYaw = S.yaw;
    P.layer = 'deep'; P.ride = { type: 'deep', stick: true, noExit: true, onJump: () => jump() }; P.vx = P.vy = 0; G.playerHidden = true; G.deepActive = true;
    for (const b of S.bodies) if (S.pos.distanceTo(b.pos) < b.r + 45) S.near = b; // (which planet she starts beside, from the very first moment)
    showHud(true); refreshHud();
    say('🌌 Open space! ◀ ▶ to steer, ▲ to go faster, ▼ to slow down. Tap the map to pick a planet!');
    api.discover('deepspace');
  }
  function free() {
    if (!root) return; for (const [, m] of belt) m.geometry.dispose(); belt.clear(); CRYSTAL_G = null;
    root.traverse(o => { if (o.isMesh && o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && !o.material.map?.isCanvasTexture && o.material !== K.shinyMat()) o.material.dispose?.(); });
    scene.remove(root); root = null; S = null;
  }
  function leave() { G.deepRocket = null; G.deepWalk = null; showHud(false); if (mapPanel) mapPanel.style.display = 'none'; sky.mesh.visible = false; G.camOverride = null; G.deepFace = null; G.deepActive = false; endSuit(); api.light(null); free(); }
  let warpDiv = null;
  function warp(d) {
    S.warping = true; S.auto = null; Sound.whoosh ? Sound.whoosh() : Sound.chime(); say(`🌀 Whoooosh! Through the wormhole to ${d.name}!`, true);
    if (!warpDiv) { warpDiv = document.createElement('div'); warpDiv.id = 'warpFx'; document.body.appendChild(warpDiv);
      const css = document.createElement('style'); css.textContent = '#warpFx{position:fixed;inset:-50%;z-index:80;pointer-events:none;opacity:0;transition:opacity .5s;border-radius:50%;animation:warpSpin 1.6s linear infinite}#warpFx.on{opacity:1}@keyframes warpSpin{to{transform:rotate(360deg) scale(1.15)}}'; document.head.appendChild(css); }
    const [c1, c2, c3] = d.wormhole.colors; warpDiv.style.background = `repeating-conic-gradient(from 0deg, ${c1} 0 12deg, ${c2} 12deg 24deg, ${c3} 24deg 36deg)`; warpDiv.style.webkitMaskImage = warpDiv.style.maskImage = 'radial-gradient(circle, transparent 0, #000 70%)';
    requestAnimationFrame(() => warpDiv.classList.add('on'));
    setTimeout(() => { leave(); api.land(d.id, null); }, 1300);
    setTimeout(() => warpDiv && warpDiv.classList.remove('on'), 2600);
  }
  function land() {
    if (!S || !S.near || !S.near.land) return; const id = S.near.id; Sound.chime(); say(`🛬 Landing on ${id === 'earth' ? 'Earth, home' : id === 'moon' ? 'the Moon' : id[0].toUpperCase() + id.slice(1)}!`);
    const pad = S.pad; leave(); api.land(id, pad);
  }

  // ---------- spacewalk: out of the rocket in a bubble helmet with a little jetpack ----------
  let suit = null;
  function wearSuit() {
    const c = api.creatureRoot(); if (!c || suit) return;
    suit = new THREE.Group(); suit.name = 'spacesuit';
    const bub = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: '#cfeeff', transparent: true, opacity: .22, roughness: .05, metalness: 0, depthWrite: false }));
    bub.scale.setScalar(.72); bub.position.y = 1.35; suit.add(bub);
    const jb = K.makeBatch(); for (const s of [-1, 1]) { jb.put(K.geo.cyl(10), s * .16, 1.0, -.42, '#c9cdd8', [.12, .55, .12]); jb.put(K.geo.sph(1), s * .16, 1.28, -.42, '#ff4f9a', .12); }
    jb.put(K.roundBox(.5, .5, .18, .06), 0, 1.05, -.36, '#ffd23f');
    suit.add(jb.mesh(K.shinyMat())); const jet = K.glow('#9fe6ff', .9, .8); jet.position.set(0, .62, -.42); suit.add(jet); suit.userData.jet = jet;
    suit.traverse(o => { o.userData.dynamic = true; }); c.add(suit);
  }
  function endSuit() { if (suit) { suit.parent && suit.parent.remove(suit); suit.traverse(o => { if (o.isMesh) { if (o.geometry) o.geometry.dispose(); } }); suit = null; } }
  function startWalk() {
    if (S.mode !== 'fly') return; S.speed = 0; S.auto = null; S.mode = 'walk';
    const side = V.set(Math.cos(S.yaw), 0, -Math.sin(S.yaw)); // the rocket's right side
    S.walk = { pos: S.pos.clone().addScaledVector(side, 2.4).add(V2.set(0, -.6, 0)), vel: side.clone().multiplyScalar(1.5), yaw: S.camYaw, up: 0, down: 0, far: 0 };
    G.playerHidden = false; wearSuit(); Sound.whoosh && Sound.whoosh(); refreshHud(); if (api.hasPet && api.hasPet() && !S.told.pet) { S.told.pet = 1; setTimeout(() => say('🐾 Your friend floats with you, in a little bubble of its own!', true), 3500); }
    say('🧑‍🚀 Floating in space! Your bubble helmet keeps you safe. Arrows to float, JUMP to go up, ⬇️ to go down. 🚀 takes you back!');
    api.discover('spacewalk');
  }
  function backToRocket() { if (S.mode === 'walk') { S.mode = 'back'; S.backT = 0; S.backFrom = S.walk.pos.clone(); Sound.chime(); refreshHud(); } }
  function jump() { if (S && S.walk && S.mode === 'walk') S.walk.up = .9; }

  // ---------- every frame while she is out here ----------
  function ride(dt) {
    if (!S) return; S.t += dt; const st = api.stick();
    if (S.mode === 'fly') {
      if (S.auto) { // autopilot: turn toward the goal, faster the farther it is, and slow down on arrival
        const tp = targetPos(S.auto, V2), want = Math.atan2(-(tp.x - S.pos.x), -(tp.z - S.pos.z)); let d = want - S.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); S.yaw += Math.sign(d) * Math.min(Math.abs(d), 1.6 * dt);
        const goal = S.auto.startsWith('wh:') ? -40 /* (build 131: glide right in) */ : ['belt', 'station', 'hoops', 'comet'].includes(S.auto) ? (S.auto === 'comet' ? 12 : 0) : S.bodies.find(b => b.id === S.auto).r, dist = S.pos.distanceTo(tp) - goal;
        const v = Math.max(0, Math.min(420, (dist - 22) * .9)) * (Math.abs(d) < .6 ? 1 : .3); S.speed += (v - S.speed) * Math.min(1, dt * 1.5);
        S.pos.y += (tp.y - S.pos.y) * Math.min(1, dt * .6);
        if (dist < 30) { S.auto = null; S.speed *= .3; }
        if (Math.abs(st.x) > .3 || Math.abs(st.y) > .3) S.auto = null; // touching the arrows takes over
      } else {
        S.yaw -= st.x * 1.3 * dt;
        const top = 90; if (st.y > .1) S.speed = Math.min(top, S.speed + 40 * dt * st.y); else if (st.y < -.1) S.speed = Math.max(-12, S.speed - 60 * dt * -st.y); else S.speed *= Math.exp(-.25 * dt);
      }
      F.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw)); S.pos.addScaledVector(F, S.speed * dt);
      // never inside a planet: a soft push back out
      for (const b of S.bodies) { const d = S.pos.distanceTo(b.pos), min = b.r + 7; if (d < min) S.pos.add(V.copy(S.pos).sub(b.pos).normalize().multiplyScalar(min - d)); }
      // stay inside the solar system
      const rr = Math.hypot(S.pos.x - DEEP.ox, S.pos.z - DEEP.oz); if (rr > 3150) { const k = 3150 / rr; S.pos.x = DEEP.ox + (S.pos.x - DEEP.ox) * k; S.pos.z = DEEP.oz + (S.pos.z - DEEP.oz) * k; if (!S.told.edge) { S.told.edge = 1; say('🌟 That is the edge of our solar system! Let us turn back.'); } }
      S.rocket.position.copy(S.pos); S.rocket.rotation.set(Math.sin(S.t * 1.3) * .03, S.yaw, -st.x * .25);
      S.flame.scale.setScalar(1.2 + Math.abs(S.speed) / 40 + Math.random() * .4); S.flame.visible = Math.abs(S.speed) > 1;
      P.x = S.pos.x; P.y = S.pos.y; P.z = S.pos.z;
      // which planet is she next to?
      let near = null; for (const b of S.bodies) if (S.pos.distanceTo(b.pos) < b.r + 45) near = b;
      if (near !== S.near) { S.near = near; refreshHud(); if (near) { say((near.land ? '🛬 ' : '☀️ ') + near.label + (near.land ? ' Tap 🛬 to land!' : '')); } }
      // the chase camera: behind and a little above the rocket, swinging gently with its turns
      let dy = S.yaw - S.camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); S.camYaw += dy * Math.min(1, dt * 2.2);
      const want = V.set(Math.sin(S.camYaw) * 15, 5, Math.cos(S.camYaw) * 15).add(S.pos); S.cam.lerp(want, Math.min(1, dt * 4));
      G.camOverride = { pos: S.cam.toArray(), look: S.pos.clone().addScaledVector(F, 6).toArray() };
    } else {
      const W = S.walk; S.rocket.rotation.set(Math.sin(S.t * .8) * .03, S.yaw, Math.sin(S.t * .6) * .03);
      if (S.mode === 'back') { // a gentle glide back to the rocket's door, then in she goes
        S.backT += dt; const k = Math.min(1, S.backT / 1.6), e = k * k * (3 - 2 * k), door = V.set(Math.cos(S.yaw), 0, -Math.sin(S.yaw)).multiplyScalar(1).add(S.pos);
        W.pos.lerpVectors(S.backFrom, door, e); if (k >= 1) { S.mode = 'fly'; S.walk = null; G.playerHidden = true; G.deepFace = null; endSuit(); refreshHud(); Sound.boing && Sound.boing(); say('🚀 Back in the rocket!', false); return; }
      } else {
        // floating with the jetpack: arrows move her (relative to the camera), JUMP goes up, ⬇️ goes down; she slows by herself
        const fw = V.set(-Math.sin(S.camYaw), 0, -Math.cos(S.camYaw)), rt = V2.set(Math.cos(S.camYaw), 0, -Math.sin(S.camYaw)), acc = 7;
        W.vel.addScaledVector(fw, st.y * acc * dt).addScaledVector(rt, st.x * acc * dt);
        if (W.up > 0) { W.up -= dt; W.vel.y += 6 * dt; } if (W.down > 0) { W.down -= dt; W.vel.y -= 6 * dt; }
        W.vel.multiplyScalar(Math.exp(-1.3 * dt)); if (W.vel.length() > 6) W.vel.setLength(6);
        // a kind invisible tether: far from the rocket she drifts back toward it; very far, she is brought back
        const away = W.pos.distanceTo(S.pos); if (away > 55) { W.vel.addScaledVector(V.copy(S.pos).sub(W.pos).normalize(), (away - 55) * .4 * dt); if (!S.told.far) { S.told.far = 1; say('🧑‍🚀 Let us stay close to our rocket!'); } }
        if (away > 110) { backToRocket(); return; }
        W.pos.addScaledVector(W.vel, dt);
        for (const b of S.bodies) { const d = W.pos.distanceTo(b.pos), min = b.r + 2; if (d < min) W.pos.add(V.copy(W.pos).sub(b.pos).normalize().multiplyScalar(min - d)); }
        const sp = Math.hypot(W.vel.x, W.vel.z); if (sp > .4) { let d = Math.atan2(W.vel.x, W.vel.z) - W.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); W.yaw += d * Math.min(1, dt * 4); }
        if (suit) suit.userData.jet.scale.setScalar(.6 + Math.min(1.4, W.vel.length() / 3) + Math.random() * .2);
      }
      P.x = W.pos.x; P.y = W.pos.y + Math.sin(S.t * 1.7) * .08; P.z = W.pos.z; P.facing = 1; G.deepFace = W.yaw;
      // the camera floats behind her, close enough to see her clearly
      const want = V.set(Math.sin(S.camYaw) * 7, 2.4, Math.cos(S.camYaw) * 7).add(W.pos); S.cam.lerp(want, Math.min(1, dt * 3));
      G.camOverride = { pos: S.cam.toArray(), look: [W.pos.x, W.pos.y + 1, W.pos.z] };
    }
    const r2 = n => Math.round(n * 100) / 100; G.deepRocket = [r2(S.pos.x), r2(S.pos.y), r2(S.pos.z), r2(S.yaw)]; // (build 127) friends in the room see my rocket
    G.deepWalk = S.walk && S.mode !== 'fly' ? S.walk : null;                                                     // (build 127) my pet floats beside me
    const here = S.mode === 'fly' ? S.pos : S.walk.pos; updateBelt(here); updatePlaces(dt, here);
  }

  // drawn every frame: far bodies are pulled in to the sky distance and shrunk, so they look right and never clip
  function update(dt, t) {
    if (!S || !root || !root.visible) return;
    const cam = G.camera.position;
    for (const b of S.bodies) {
      const d = cam.distanceTo(b.pos), k = d > SKY_R ? SKY_R / d : 1; b.m.position.copy(cam).lerp(b.pos, k); b.m.scale.setScalar(b.r * k); b.m.rotation.y += dt * .05;
      if (b.halo) { b.halo.position.copy(b.m.position); const s = b.r * k * b.halo.userData.k; b.halo.scale.set(s, s, 1); }
    }
    sky.mesh.position.copy(cam); sky.U.uTime.value = t;
  }
  return { enter, leave, ride, update, jump, prepare, active: () => !!(S && root && root.visible), state: () => S && { mode: S.mode, x: S.pos.x, y: S.pos.y, z: S.pos.z, speed: S.speed, auto: S.auto, near: S.near && S.near.id, belt: belt.size, got: { ...S.got }, atDock: !!S.atDock, walk: S.walk && S.walk.pos.toArray() }, flyTo: id => S && flyTo(id), dock: () => S && dock(),
    /** test hooks: where things are, and putting her somewhere */ _t: { stars: () => S.stars.filter(m => m.visible).map(m => m.position.toArray()), hoops: () => S.hoops.map(h => h.m.position.toArray()), place: (x, y, z) => { if (S.walk) S.walk.pos.set(x, y, z); else S.pos.set(x, y, z); } }, startWalk: () => S && startWalk(), back: () => S && backToRocket(), land: () => land() };
}
