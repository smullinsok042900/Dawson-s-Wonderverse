// ===================================================================
// kart.js: 3D build 8, THE KART GARAGE and RACE TRACK (past the Creative Meadow).
//   • Kart Maker: three big buttons change the kart's colour, shape
//     (bug, rocket, bubble) and wheels; the kart spins on a turntable.
//   • Tap the checkered flag (or PAW by it) to drive! The kart zooms round
//     a big oval track: slide right to go faster, left to slow down,
//     JUMP hops, PAW honks and parks. Confetti every lap. Saved.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toy, ball, starGeometry } from './creatures.js';

export const KART_COLS = ['#ff4f9a', '#3d9bff', '#ffd23f', '#3cc46e', '#a15cff', '#ff9a2e', '#ffffff'];
export const KART_SHAPES = ['bug', 'rocket', 'bubble'], KART_WHEELS = ['round', 'star', 'big'];
export const KART = { garage: 265.6, flag: 269.4, cx: 285.5, cz: -6.9, rx: 12.2, rz: 3.6 };

export function buildKart(rec) {
  const g = new THREE.Group(), c = KART_COLS[rec.col % KART_COLS.length], shape = KART_SHAPES[rec.shape % 3], wh = KART_WHEELS[rec.wheels % 3];
  const paint = toy(c, { r: .22, cc: 1, m: .1 }), white = toy('#ffffff', { r: .3, cc: 1 });
  if (shape === 'bug') {
    const b = new THREE.Mesh(new RoundedBoxGeometry(1.7, .5, 1.0, 3, .22), paint); b.position.y = .45; g.add(b);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(.45, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), paint); hood.scale.set(1.3, .8, 1); hood.position.set(.45, .68, 0); g.add(hood);
    for (const z of [-.3, .3]) g.add(ball(toy('#fff3a6', { em: '#ffe36e', ei: .8 }), .09, .86, .5, z));
  } else if (shape === 'rocket') {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(.36, 1.2, 6, 16), paint); b.rotation.z = Math.PI / 2; b.position.y = .5; g.add(b);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.36, .5, 16), white); nose.rotation.z = -Math.PI / 2; nose.position.set(1.05, .5, 0); g.add(nose);
    for (const [y, z, rx] of [[.85, 0, 0], [.5, .4, Math.PI / 2], [.5, -.4, -Math.PI / 2]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.4, .3, .05), white); f.position.set(-.65, y, z); f.rotation.x = rx; g.add(f); }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.2, .4, 12), new THREE.MeshBasicMaterial({ color: '#ffb000' })); flame.rotation.z = Math.PI / 2; flame.position.set(-1.05, .5, 0); g.add(flame); g.userData.flame = flame;
  } else {
    const b = new THREE.Mesh(new RoundedBoxGeometry(1.5, .45, 1.0, 3, .2), paint); b.position.y = .42; g.add(b);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#dff6ff', transparent: true, opacity: .35, roughness: .02, clearcoat: 1, depthWrite: false })); dome.position.set(-.05, .64, 0); g.add(dome);
  }
  const wr = wh === 'big' ? .3 : .22, tyre = toy('#3a3050', { r: .7, cc: .1 });
  g.userData.wheels = [];
  for (const [x, z] of [[.55, .52], [.55, -.52], [-.55, .52], [-.55, -.52]]) {
    const w = new THREE.Group(); w.position.set(x, wr, z); g.add(w); g.userData.wheels.push(w);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, .2, 18), tyre); t.rotation.x = Math.PI / 2; w.add(t);
    const hub = wh === 'star' ? new THREE.Mesh(starGeometry(wr * .7, wr * .32, .05, .02, 1), toy('#ffd84a', { em: '#ffd84a', ei: .3 })) : new THREE.Mesh(new THREE.CylinderGeometry(wr * .5, wr * .5, .22, 12), white);
    if (wh !== 'star') hub.rotation.x = Math.PI / 2; hub.position.z = z > 0 ? .11 : -.11; w.add(hub);
  }
  const seat = new THREE.Object3D(); seat.position.set(-.1, .55, 0); g.add(seat); g.userData.seat = seat;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function initKarts(G, api) {
  const { scene, world, Sound, burst, discover, toast } = api;
  const add = (o, p = scene) => { p.add(o); return o; };
  world.kart = world.kart || { col: 0, shape: 0, wheels: 0 };

  // ---------- the garage ----------
  const gx = KART.garage;
  { const back = new THREE.Mesh(new RoundedBoxGeometry(7, 4.2, .5, 2, .2), toy('#ffe6c4', { r: .6, cc: .2 })); back.position.set(gx, 2.1, -5.2); back.receiveShadow = true; add(back);
    for (const x of [gx - 3.4, gx + 3.4]) { const p = new THREE.Mesh(new RoundedBoxGeometry(.5, 4.2, 3, 2, .15), toy('#ff9fd2')); p.position.set(x, 2.1, -3.7); p.castShadow = true; add(p); }
    const roof = new THREE.Mesh(new RoundedBoxGeometry(7.8, .45, 3.6, 2, .18), toy('#3d9bff')); roof.position.set(gx, 4.4, -3.7); roof.castShadow = true; add(roof);
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.45, .5, .05), toy(i % 2 ? '#ffffff' : '#ff4f9a')); s.position.set(gx - 3.15 + i * .9, 4.0, -1.88); add(s); }
    // tools on the wall
    for (const [x, c] of [[gx - 2.2, '#ffd23f'], [gx - 1.4, '#3cc46e'], [gx + 1.6, '#a15cff']]) { const t = new THREE.Mesh(new RoundedBoxGeometry(.18, .9, .1, 1, .05), toy(c)); t.position.set(x, 2.6, -4.9); add(t); }
    const turn = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, .2, 32), toy('#c9a6ff', { m: .3 })); turn.position.set(gx + 1.3, .1, -3.6); turn.receiveShadow = true; add(turn); G.kartTurn = turn;
  }
  const preview = new THREE.Group(); preview.position.set(gx + 1.3, .2, -3.6); add(preview);
  let previewKart = null; function rebuildPreview() { if (previewKart) preview.remove(previewKart); previewKart = buildKart(world.kart); preview.add(previewKart); }
  rebuildPreview();
  // tap the kart on the turntable (or the turntable) to hop in and drive
  preview.userData.tap = () => api.startKart(); G.taps.push(preview); G.kartTurn.userData.tap = () => api.startKart(); G.taps.push(G.kartTurn);
  const BTN = [['col', '#ff4f9a', '🎨'], ['shape', '#3d9bff', '🚗'], ['wheels', '#ffd23f', '⚙️']];
  const iconTex = e => { const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.font = '68px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 48, 54); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  BTN.forEach(([part, c, e], i) => {
    const g = new THREE.Group(); g.position.set(gx - 2.8 + i * 1.0, 0, -1.3); add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .9, 12), toy('#ffffff')); post.position.y = .45; post.castShadow = true; g.add(post);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .18, 24), toy(c, { em: c, ei: .3 })); cap.position.y = 1.0; cap.rotation.x = .5; cap.castShadow = true; g.add(cap);
    const ic = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ map: iconTex(e), transparent: true })); ic.position.set(0, 1.2, .2); ic.rotation.x = -.4; g.add(ic);
    api.tap(g, () => { const n = { col: KART_COLS.length, shape: 3, wheels: 3 }[part]; world.kart[part] = (world.kart[part] + 1) % n; rebuildPreview(); Sound.tone(500 + i * 120, .12, 'triangle', .05, 1.4); burst(gx, 1.4, -3, ['#fff', KART_COLS[world.kart.col]], 10, 2); discover('kartmaker', 'The Kart Garage! Design your kart, then tap the flag to drive.'); api.saveSoon(); });
  });
  G.interact.push({ x: gx, y: 0, layer: '', disc: 'kartmaker', run: () => { discover('kartmaker', 'The Kart Garage! Tap the buttons to design your kart.'); api.startKart(); }, hintY: 2.4 });
  // the checkered "go" flag
  const flagTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 80; const g = c.getContext('2d'); for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#2a1a40' : '#ffffff'; g.fillRect(x * 16, y * 16, 16, 16); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const flag = new THREE.Group(); flag.position.set(KART.flag, 0, -1.4); add(flag);
  { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.4, 8), toy('#ffffff')); pole.position.y = 1.2; pole.castShadow = true; flag.add(pole);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .7, 8, 1), new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide })); cloth.position.set(.58, 2.0, 0); flag.add(cloth); G.kartFlag = cloth; }
  api.tap(flag, () => api.startKart());
  G.interact.push({ x: KART.flag, y: 0, layer: '', disc: 'kart', run: () => api.startKart(), hintY: 2.8 });

  // ---------- the race track (a big oval behind the path) ----------
  const pts = []; for (let i = 0; i < 28; i++) { const a = Math.PI / 2 + i / 28 * Math.PI * 2; pts.push(new THREE.Vector3(KART.cx + Math.cos(a) * KART.rx * (1 + .06 * Math.sin(a * 3)), 0, KART.cz + Math.sin(a) * KART.rz)); }
  const track = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .5); G.kartTrack = track;
  { const N = 220, W = 1.25, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const u = i / N, p = track.getPointAt(u % 1), t = track.getTangentAt(u % 1), nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1; pos.push(p.x + nx / l * W, .03, p.z + nz / l * W, p.x - nx / l * W, .03, p.z - nz / l * W); uv.push(0, u * 40, 1, u * 40); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tc = document.createElement('canvas'); tc.width = 64; tc.height = 64; const g = tc.getContext('2d'); g.fillStyle = '#7a62b8'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffffff'; g.fillRect(29, 6, 6, 26); g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 60; i++) g.fillRect((i * 37) % 64, (i * 23) % 64, 2, 2);
    const tt = new THREE.CanvasTexture(tc); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.colorSpace = THREE.SRGBColorSpace;
    const road = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tt, roughness: .55, clearcoat: .3, side: THREE.DoubleSide })); road.receiveShadow = true; add(road);
    // red and white kerbs along both edges
    const M = 160, kerb = new THREE.InstancedMesh(new RoundedBoxGeometry(.5, .14, .3, 1, .05), toy('#ffffff', { r: .4 }), M * 2), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cl = new THREE.Color();
    for (let i = 0; i < M; i++) { const u = i / M, p = track.getPointAt(u), t = track.getTangentAt(u), nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1; q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-t.z, t.x));
      for (const s of [1, -1]) { m4.compose(new THREE.Vector3(p.x + nx / l * (W + .2) * s, .07, p.z + nz / l * (W + .2) * s), q, new THREE.Vector3(1, 1, 1)); const k = i * 2 + (s > 0 ? 0 : 1); kerb.setMatrixAt(k, m4); kerb.setColorAt(k, cl.set(i % 2 ? '#ff4f9a' : '#ffffff')); } }
    kerb.receiveShadow = true; add(kerb);
    // start / finish arch with a checkered banner
    const sp = track.getPointAt(0);
    for (const dz of [-1.7, 1.7]) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 3, 10), toy('#ffffff')); p2.position.set(sp.x, 1.5, sp.z + dz); p2.castShadow = true; add(p2); }
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(.6, 3.6), new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide })); banner.rotation.z = Math.PI / 2; banner.rotation.y = Math.PI / 2; banner.position.set(sp.x, 3.0, sp.z); add(banner);
    // cheering cones and a little grandstand of balloons
    for (let i = 0; i < 7; i++) { const cone = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 12), toy(i % 2 ? '#ff9a2e' : '#ffffff')); cone.position.set(KART.cx - 6 + i * 2, .25, KART.cz); cone.castShadow = true; add(cone); }
  }

  // ---------- the kart you drive ----------
  let kart = null;
  function makeRideKart() { if (kart) scene.remove(kart); kart = buildKart(world.kart); add(kart); return kart; }
  const V = new THREE.Vector3();
  function update(dt, t, P, stick, keys) {
    if (G.kartTurn) { G.kartTurn.rotation.y += dt * .6; preview.rotation.y += dt * .6; }
    if (G.kartFlag) G.kartFlag.rotation.y = Math.sin(t * 3) * .15;
    const R = P.ride;
    if (R && R.type === 'kart') {
      if (!kart) makeRideKart();
      let target = 6;
      if (stick && stick.active) { if (stick.dx > 25) target = 9.5; else if (stick.dx < -25) target = 3; }
      if (keys.right) target = 9.5; if (keys.left) target = 3;
      R.v += (target - R.v) * Math.min(1, dt * 2); const len = G.kartTrack.getLength();
      R.u += R.v / len * dt;
      if (R.u >= 1) { R.u -= 1; R.lap++; Sound.chime(); for (let i = 0; i < 3; i++) burst(V.x, 1.5, V.z, ['#ff4f9a', '#ffd23f', '#3d9bff', '#3cc46e', '#fff'], 18, 4); toast(`🏁 Lap ${R.lap}!`); discover('lap', 'You finished a lap! Keep racing!'); }
      R.hopV -= 22 * dt; R.hop = Math.max(0, R.hop + R.hopV * dt); if (R.hop === 0) R.hopV = 0;
      G.kartTrack.getPointAt(R.u, V); const tg = G.kartTrack.getTangentAt(R.u);
      kart.position.set(V.x, R.hop, V.z); kart.rotation.y = Math.atan2(-tg.z, tg.x); kart.rotation.z = R.hop > 0 ? .12 : Math.sin(t * 20) * .01;
      kart.userData.wheels.forEach(w => { w.rotation.z -= R.v * dt / .25; });
      if (kart.userData.flame) kart.userData.flame.scale.set(1 + Math.sin(t * 40) * .2, 1 + R.v / 10, 1);
      kart.userData.seat.getWorldPosition(V); P.x = V.x; P.y = V.y - .05; P.z = V.z; P.facing = tg.x >= 0 ? 1 : -1; P.vx = R.v * P.facing;
      if (Math.random() < dt * R.v * 2) burst(kart.position.x - tg.x, .25, kart.position.z - tg.z, ['#ffffff', '#e9dcff'], 1, .6);
    } else if (kart) { scene.remove(kart); kart = null; }
  }
  function honk() { Sound.tone(520, .12, 'square', .04, 1); Sound.tone(660, .16, 'square', .04, 1, .12); }
  return { update, rebuildPreview, makeRideKart, honk };
}
