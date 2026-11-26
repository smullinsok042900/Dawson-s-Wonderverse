// ===================================================================
// ocean.js (build 145, the family's request): SAIL THE OPEN OCEAN. She climbs into the little sailboat at the beach (the
// pier's boat) and sails out onto a big, open ocean: ◀ ▶ steer, ▲ sails faster, ▼ slower (or tap 🗺️ and pick a picture:
// the boat sails there by itself). Islands lie around the sea (islands.js); sail up to one and tap ⚓ to land and explore
// it on foot. Home Harbour (🏠) takes her back to the beach. Dolphins jump beside the boat.
// Like open space (deepspace.js) it is far away from the world (OCEAN.ox), built in small steps the first time, hidden when
// she is not sailing, and it owns the sky and the light while she sails.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { ISLANDS } from './islands.js';

export const OCEAN = { ox: 60000, oy: 0, oz: 0 };
const HOME = { id: 'home', icon: '🏠', name: 'Home Harbour', sea: [0, 0], r: 26 };
const SEA_R = 1100; // (how far she can sail from Home Harbour)
const LOOK = {
  sky: { top: '#4aa8ff', mid: '#8fd0ff', hor: '#e8f6ff', low: '#cfeaff', stars: 0, sunDir: [.4, .5, -.75], sunCol: '#fff4d0', glow: [6, .5, .2], band: '#ffffff', bandK: .2, wind: .03 },
  sun: ['#fff6e0', 2.6], hemi: ['#eaf6ff', '#5aa0d0', 1.35], fog: ['#d8efff', 160, 700], env: .35, rim: ['#ffffff', .6],
};

export function initOcean(G, api) {
  const { scene, Sound, player: P } = api; const say = (m, sp = true) => api.toast(m, sp);
  const SPOTS = [HOME, ...ISLANDS];
  let root = null, building = null, sky = null, seaTex = null, boat = null, sail = null, hud = null, mapPanel = null, S = null, dolphins = [];
  const V = new THREE.Vector3(), F = new THREE.Vector3();
  const spotPos = (s, v = new THREE.Vector3()) => v.set(OCEAN.ox + s.sea[0], 0, OCEAN.oz + s.sea[1]);

  // ---------- building the ocean (a few small steps, the first time she sails) ----------
  function* build() {
    root = new THREE.Group(); root.visible = false; scene.add(root);
    sky = K.makeSky(); sky.mesh.visible = false; scene.add(sky.mesh);
    // the sea: one big plane with painted waves that drift (a canvas texture, repeated; no new shader)
    { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#2f8fd8'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) { const x = (i * 97) % 256, y = (i * 61) % 256, w = 18 + (i % 5) * 8; g.strokeStyle = i % 3 ? 'rgba(255,255,255,.35)' : 'rgba(150,220,255,.5)'; g.lineWidth = 2 + (i % 2); g.beginPath(); g.arc(x, y, w, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      seaTex = new THREE.CanvasTexture(cv); seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(160, 160); seaTex.colorSpace = THREE.SRGBColorSpace;
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(SEA_R * 4, SEA_R * 4), new THREE.MeshStandardMaterial({ map: seaTex, roughness: .3, metalness: .05 })); sea.rotation.x = -Math.PI / 2; sea.position.set(OCEAN.ox, 0, OCEAN.oz); sea.receiveShadow = true; root.add(sea); }
    yield;
    // the islands as they look from the sea (low-poly: sand, a green hill, palms and trees; one mesh each)
    for (const s of SPOTS) {
      const b = K.makeBatch(), c = spotPos(s), r = s.r, cyl = new THREE.CylinderGeometry(1, 1, 1, 28), sph = new THREE.SphereGeometry(1, 20, 12), cone = new THREE.ConeGeometry(1, 1, 7);
      if (s === HOME) { // a harbour: a long pier, a little lighthouse and a flag
        b.put(new THREE.BoxGeometry(1, 1, 1), c.x, .5, c.z + 10, '#9a6a3a', [5, .4, 24]); b.put(cyl, c.x - 8, 4, c.z + 18, '#ffffff', [1.6, 8, 1.6]); for (const y of [2, 5]) b.put(cyl, c.x - 8, y, c.z + 18, '#ff4f6a', [1.65, 1, 1.65]); b.put(cone, c.x - 8, 9, c.z + 18, '#ff4f6a', [2, 2, 2]);
        b.put(cyl, c.x + 3, 3, c.z + 21, '#ffffff', [.12, 6, .12]); b.put(new THREE.BoxGeometry(1, 1, 1), c.x + 4, 5.5, c.z + 21, '#ffd23f', [2, 1.2, .05]);
      } else {
        b.put(cyl, c.x, .3, c.z, '#f4dca0', [r, .8, r]); b.put(sph, c.x, 0, c.z, '#3fbf5a', [r * .8, r * .32, r * .8]);
        for (let i = 0; i < 26; i++) { const a = i * 2.4, d = r * (.35 + (i % 5) * .1), x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d, h = 10 + (i % 4) * 3; b.put(cyl, x, h / 2 + 4, z, '#7a5236', [.4, h, .4]); b.put(sph, x, h + 5, z, ['#2f9a4a', '#3fbf5a', '#1f7a3a'][i % 3], [3.2, 2.2, 3.2]); }
        for (let i = 0; i < 10; i++) { const a = i * .63, x = c.x + Math.cos(a) * (r * .93), z = c.z + Math.sin(a) * (r * .93); b.put(cyl, x, 3, z, '#a07a4a', [.25, 5, .25], [0, 0, .15]); b.put(cone, x + .4, 5.6, z, '#4fcf6a', [2.4, .7, 2.4]); } // palms on the beach
        b.put(new THREE.BoxGeometry(1, 1, 1), c.x + r * .95, .5, c.z, '#9a6a3a', [10, .3, 2.4]); // its dock
      }
      const m = b.mesh(K.shinyMat()); root.add(m); cyl.dispose(); sph.dispose(); cone.dispose(); s.mesh = m; yield;
    }
    // the sailboat (her boat): a white hull, a wooden deck, a mast and a striped sail
    boat = new THREE.Group(); root.add(boat);
    { const b = K.makeBatch(), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 10), cone = new THREE.ConeGeometry(1, 1, 4);
      b.put(box, 0, .25, 0, '#ffffff', [1.6, .7, 3.6]); b.put(cone, 0, .25, -2.2, '#ffffff', [.8, 1, .4], [-Math.PI / 2, Math.PI / 4, 0]); b.put(box, 0, .62, .2, '#c8925a', [1.4, .08, 3]);
      b.put(box, 0, .45, 0, '#4fb0ff', [1.64, .14, 3.64]); b.put(cyl, 0, 2.6, -.4, '#8a5a3a', [.08, 4.2, .08]); b.put(cyl, 0, 1.2, .5, '#8a5a3a', [.06, 2, .06], [Math.PI / 2, 0, 0]);
      boat.add(b.mesh(K.shinyMat())); box.dispose(); cyl.dispose(); cone.dispose();
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 3.6); sh.lineTo(2.2, 0); sh.lineTo(0, 0); const sg = new THREE.ShapeGeometry(sh);
      const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const g = cv.getContext('2d'); ['#ff4f6a', '#ffffff', '#ffd23f', '#ffffff', '#4fb0ff', '#ffffff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 64 / 6, 8, 64 / 6 + 1); });
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const uv = sg.attributes.uv, p = sg.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, .5, p.getY(i) / 3.6);
      sail = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: .7 })); sail.position.set(0, .9, -.35); sail.rotation.y = Math.PI / 2; boat.add(sail); }
    // dolphins that leap beside the boat now and then
    for (let i = 0; i < 3; i++) { const b = K.makeBatch(), sph = new THREE.SphereGeometry(1, 12, 8), cone = new THREE.ConeGeometry(1, 1, 6);
      b.put(sph, 0, 0, 0, '#7f9fb8', [.35, .35, 1.1]); b.put(cone, 0, .35, .1, '#7f9fb8', [.15, .35, .3]); b.put(cone, 0, 0, 1.15, '#7f9fb8', [.35, .3, .1], [Math.PI / 2, 0, 0]); b.put(sph, 0, -.12, -.2, '#dfeaf2', [.3, .2, .8]); b.put(sph, .2, .1, -.8, '#22222a', .05); b.put(sph, -.2, .1, -.8, '#22222a', .05);
      const d = b.mesh(K.shinyMat()); d.visible = false; root.add(d); dolphins.push({ m: d, t: -1 - i * 3, side: i % 2 ? 1 : -1 }); sph.dispose(); cone.dispose(); }
  }
  function prepare() { if (!root && !building) { const it = build(); building = it; api.slices(it).then(() => { building = null; }); } return building ? api.slices(building) : Promise.resolve(); }

  // ---------- the buttons: 🗺️ the map, ⚓ land on the island she is next to ----------
  function button(id, icon, label, fn, place) {
    const b = document.createElement('button'); b.id = id; b.className = 'pill deepBtn'; b.textContent = icon; b.setAttribute('aria-label', label);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.unlocked = true; if (mapPanel && mapPanel.style.display !== 'none') return; fn(); });
    Object.assign(b.style, { position: 'fixed', fontSize: '30px', width: '62px', height: '62px', borderRadius: '20px', zIndex: 60, ...place }); return b;
  }
  function showHud(on) {
    if (on && !hud) { hud = document.createElement('div'); hud.id = 'oceanHud'; hud.append(button('oceanMap', '🗺️', 'picture map: where shall we sail?', openMap, { top: '116px', right: '18px' }), button('oceanLand', '⚓', 'land here', land, { top: '182px', right: '18px' })); document.body.appendChild(hud); }
    if (hud) hud.style.display = on ? '' : 'none';
  }
  function refreshHud() { if (!hud || !S) return; hud.querySelector('#oceanLand').style.display = S.near ? '' : 'none'; hud.querySelector('#oceanLand').textContent = S.near === HOME ? '🏠' : '⚓'; }
  function openMap() {
    if (!mapPanel) {
      mapPanel = document.createElement('div'); mapPanel.id = 'oceanMapPanel';
      Object.assign(mapPanel.style, { position: 'fixed', inset: '0', background: 'rgba(10,40,80,.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '14px', padding: '60px 20px' });
      for (const s of SPOTS) { const t = document.createElement('button'); t.className = 'oceanTile'; t.dataset.id = s.id; t.textContent = s.icon; t.setAttribute('aria-label', s.name);
        Object.assign(t.style, { width: '96px', height: '96px', borderRadius: '50%', border: '4px solid #fff', background: s === HOME ? '#ffd9a8' : 'radial-gradient(circle, #f4dca0 0 35%, #3fbf5a 36% 70%, #2f8fd8 71%)', fontSize: '46px' });
        t.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sailTo(s.id); mapPanel.style.display = 'none'; }); mapPanel.appendChild(t); }
      const x = document.createElement('button'); x.textContent = '✖'; x.className = 'pill'; Object.assign(x.style, { position: 'absolute', top: '14px', right: '14px', fontSize: '28px' });
      x.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); mapPanel.style.display = 'none'; }); mapPanel.appendChild(x); document.body.appendChild(mapPanel);
    }
    mapPanel.style.display = 'flex'; Sound.click(); api.speak('Where shall we sail? Tap a picture!');
  }
  function sailTo(id) { if (!S) return; const s = SPOTS.find(q => q.id === id); if (!s) return; S.auto = s; Sound.whoosh && Sound.whoosh(); say(`⛵ Sailing to ${s.name}!`); }

  // ---------- on and off the boat ----------
  async function enter(fromId = 'home') {
    await prepare();
    root.visible = true; sky.mesh.visible = true; sky.set(LOOK.sky); api.light(LOOK);
    const s = SPOTS.find(q => q.id === fromId) || HOME, c = spotPos(s);
    S = { pos: new THREE.Vector3(), yaw: 0, speed: 0, auto: null, near: null, t: 0, cam: new THREE.Vector3(), camYaw: 0, told: {} };
    if (s === HOME) { S.pos.set(c.x + 6, 0, c.z - 6); S.yaw = 0; } // (out of the harbour, heading out to sea)
    else { S.pos.set(c.x + s.r + 16, 0, c.z); S.yaw = -Math.PI / 2; } // (just off the island's dock, heading away)
    S.camYaw = S.yaw; S.cam.copy(S.pos).add(V.set(Math.sin(S.yaw) * 12, 5, Math.cos(S.yaw) * 12));
    P.layer = 'ocean'; P.ride = { type: 'ocean', stick: true, noExit: true, onJump: () => { } }; P.vx = P.vy = 0; G.playerHidden = false; G.oceanActive = true;
    showHud(true); S.near = null; refreshHud(); Sound.chime(); api.discover('ocean', '⛵ Climb into the boat at the beach and sail the ocean!');
    say(s === HOME ? '⛵ Off we sail! ◀ ▶ to steer, ▲ to go faster. Tap 🗺️ to pick an island!' : '⛵ Back on the boat! Where shall we sail next? Tap 🗺️!');
  }
  function leave() { if (root) root.visible = false; if (sky) sky.mesh.visible = false; showHud(false); if (mapPanel) mapPanel.style.display = 'none'; G.camOverride = null; G.deepFace = null; G.oceanActive = false; for (const d of dolphins) d.m.visible = false; }
  function land() {
    if (!S || !S.near) return; const s = S.near; leave(); S = null;
    if (s === HOME) { api.home(); say('🏠 Home again! What a voyage!'); } else api.land(s.id);
  }

  // ---------- sailing (each frame while she is in the boat) ----------
  function ride(dt) {
    if (!S) return; dt = Math.min(dt, .1); S.t += dt; const st = api.stick();
    if (S.auto) { const tp = spotPos(S.auto, V), want = Math.atan2(-(tp.x - S.pos.x), -(tp.z - S.pos.z)); let d = want - S.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); S.yaw += Math.sign(d) * Math.min(Math.abs(d), 1.2 * dt);
      const dist = Math.hypot(tp.x - S.pos.x, tp.z - S.pos.z) - S.auto.r - 18, v = Math.max(0, Math.min(40, dist * .6)) * (Math.abs(d) < .6 ? 1 : .3); S.speed += (v - S.speed) * Math.min(1, dt * 1.2);
      if (dist < 6) { S.auto = null; S.speed *= .3; } if (Math.abs(st.x) > .3 || Math.abs(st.y) > .3) S.auto = null; }
    else { S.yaw -= st.x * 1.1 * dt; if (st.y > .1) S.speed = Math.min(26, S.speed + 10 * dt * st.y); else if (st.y < -.1) S.speed = Math.max(0, S.speed - 14 * dt * -st.y); else S.speed *= Math.exp(-.08 * dt); }
    F.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw)); S.pos.addScaledVector(F, S.speed * dt);
    for (const s of SPOTS) { const c = spotPos(s, V), d = Math.hypot(S.pos.x - c.x, S.pos.z - c.z), min = s.r + 6; if (d < min) { S.pos.x = c.x + (S.pos.x - c.x) / d * min; S.pos.z = c.z + (S.pos.z - c.z) / d * min; S.speed *= .5; } } // (never onto an island's sand: a soft bump)
    const rr = Math.hypot(S.pos.x - OCEAN.ox, S.pos.z - OCEAN.oz); if (rr > SEA_R) { const k = SEA_R / rr; S.pos.x = OCEAN.ox + (S.pos.x - OCEAN.ox) * k; S.pos.z = OCEAN.oz + (S.pos.z - OCEAN.oz) * k; if (!S.told.edge) { S.told.edge = 1; say('🌊 That is far enough! Let’s sail back toward the islands.'); } }
    const bob = Math.sin(S.t * 1.6) * .12; boat.position.set(S.pos.x, bob, S.pos.z); boat.rotation.set(Math.sin(S.t * 1.1) * .04, S.yaw, Math.sin(S.t * 1.3) * .05 - st.x * .12);
    sail.scale.x = 1 + Math.min(.35, S.speed / 60); // (the sail fills with wind)
    P.x = S.pos.x; P.y = bob + .66; P.z = S.pos.z + .4 * Math.cos(S.yaw); P.x += .4 * Math.sin(S.yaw); P.facing = 1; G.deepFace = S.yaw + Math.PI; // (she sits in the boat, facing forward)
    let near = null; for (const s of SPOTS) { const c = spotPos(s, V); if (Math.hypot(S.pos.x - c.x, S.pos.z - c.z) < s.r + 40) near = s; }
    if (near !== S.near) { S.near = near; refreshHud(); if (near) say(near === HOME ? '🏠 Home Harbour! Tap 🏠 to go back to the beach.' : `${near.icon} ${near.name}! Tap ⚓ to land and explore!`); }
    let dy = S.yaw - S.camYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); S.camYaw += dy * Math.min(1, dt * 2);
    const want = V.set(Math.sin(S.camYaw) * 12, 4.6, Math.cos(S.camYaw) * 12).add(S.pos); S.cam.lerp(want, Math.min(1, dt * 4));
    G.camOverride = { pos: S.cam.toArray(), look: S.pos.clone().addScaledVector(F, 5).add(V.set(0, 1.2, 0)).toArray() };
  }
  function update(dt, t) {
    if (!root || !root.visible) return;
    if (P.layer !== 'ocean') { leave(); S = null; return; }
    if (seaTex) { seaTex.offset.x = t * .004; seaTex.offset.y = t * .006; }
    if (S) for (const d of dolphins) { d.t += dt; if (d.t > 0 && d.t < 1.4) { const k = d.t / 1.4, side = V.set(Math.cos(S.yaw), 0, -Math.sin(S.yaw)).multiplyScalar(d.side * 6); if (!d.m.visible) { d.m.visible = true; d.from = S.pos.clone().add(side).addScaledVector(F.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw)), 10); d.yaw = S.yaw; }
        d.m.position.copy(d.from).addScaledVector(F.set(-Math.sin(d.yaw), 0, -Math.cos(d.yaw)), k * 8); d.m.position.y = Math.sin(k * Math.PI) * 2.2 - .4; d.m.rotation.set(Math.cos(k * Math.PI) * .9, d.yaw, 0); if (d.t - dt <= 0) { Sound.tone(1400, .1, 'sine', .03, 1.6); if (!S.told.dolphin) { S.told.dolphin = 1; say('🐬 Dolphins! They are jumping beside the boat!'); } } }
      else if (d.t >= 1.4) { d.m.visible = false; d.t = -6 - Math.random() * 8; } }
  }
  return { enter, ride, update, prepare, sailTo, active: () => !!S, state: () => S && { x: S.pos.x - OCEAN.ox, z: S.pos.z - OCEAN.oz, near: S.near && S.near.id, speed: S.speed, auto: S.auto && S.auto.id }, land };
}
