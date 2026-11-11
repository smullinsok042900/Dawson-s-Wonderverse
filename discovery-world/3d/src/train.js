// ===================================================================
// train.js: 3D build 9, THE WONDER EXPRESS. A little steam train runs
// along the front of the whole world, with a station at every area.
//   • Tap a station sign (or PAW by it) and the train chugs in; you hop in.
//   • It drives itself from station to station, stopping at each one.
//     While it's stopped: slide right or left to go that way,
//     PAW (or slide down) to hop off. JUMP toots the whistle.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toy, ball } from './creatures.js';

export const TRAIN = { z: 3.2, x0: -2, x1: 352, seat: 2.25 };
export const STATIONS = [
  { x: 1.2, e: '🏠' }, { x: 61, e: '🎨' }, { x: 113, e: '🧪' }, { x: 170, e: '🎠' },
  { x: 222, e: '🧱' }, { x: 277, e: '🏎️' }, { x: 320, e: '🔮' },
];

const emojiTex = (e, bg) => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.stroke();
  g.font = '72px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

function buildTrain() {
  const T = new THREE.Group();
  const red = toy('#ff4f9a', { r: .25, cc: 1, m: .1 }), gold = toy('#ffd23f', { r: .2, cc: 1, m: .5 }), navy = toy('#4b3c8f', { r: .4, cc: .6 }), white = toy('#ffffff', { r: .3, cc: 1 });
  // the engine (local +x is forwards)
  const chassis = new THREE.Mesh(new RoundedBoxGeometry(2.1, .3, 1.05, 2, .1), navy); chassis.position.set(0, .38, 0); T.add(chassis);
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, 1.2, 24), red); boiler.rotation.z = Math.PI / 2; boiler.position.set(.3, .78, 0); T.add(boiler);
  for (const x of [-.05, .4, .82]) { const band = new THREE.Mesh(new THREE.TorusGeometry(.345, .03, 8, 28), gold); band.rotation.y = Math.PI / 2; band.position.set(x, .78, 0); T.add(band); }
  const cab = new THREE.Mesh(new RoundedBoxGeometry(.7, .62, 1.0, 2, .1), red); cab.position.set(-.62, .82, 0); T.add(cab);
  const roof = new THREE.Mesh(new RoundedBoxGeometry(.9, .1, 1.15, 2, .04), navy); roof.position.set(-.62, 1.18, 0); T.add(roof);
  for (const z of [-.51, .51]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(.4, .3), new THREE.MeshPhysicalMaterial({ color: '#cfefff', roughness: .05, clearcoat: 1, emissive: '#9fdcff', emissiveIntensity: .25 })); w.position.set(-.62, .9, z); w.rotation.y = z > 0 ? 0 : Math.PI; T.add(w); }
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .32, 16), navy); chimney.position.set(.72, 1.25, 0); T.add(chimney);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(.19, .15, .1, 16), gold); lip.position.set(.72, 1.43, 0); T.add(lip);
  const dome = ball(gold, .14, .25, 1.12, 0); T.add(dome);
  // a happy face on the front of the boiler
  const faceDisc = new THREE.Mesh(new THREE.CircleGeometry(.3, 28), toy('#fff3dc', { r: .5 })); faceDisc.rotation.y = Math.PI / 2; faceDisc.position.set(.905, .78, 0); T.add(faceDisc);
  for (const z of [-.11, .11]) { T.add(ball(toy('#2a1a40', { r: .2, cc: 1 }), .045, .915, .84, z)); T.add(ball(toy('#ff8fc0', { r: .6 }), .04, .91, .7, z * 1.9)); }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.09, .018, 6, 16, Math.PI), toy('#2a1a40')); smile.rotation.set(Math.PI, Math.PI / 2, 0); smile.position.set(.915, .73, 0); T.add(smile);
  const lamp = ball(toy('#fff6b0', { em: '#ffe36e', ei: 1.2 }), .07, .62, 1.1, 0); lamp.position.set(.92, .5, 0); T.add(lamp);
  // cow-catcher
  const cc = new THREE.Mesh(new THREE.ConeGeometry(.45, .4, 4), gold); cc.rotation.set(0, Math.PI / 4, -Math.PI / 2); cc.scale.set(.6, 1, 1.6); cc.position.set(1.12, .28, 0); T.add(cc);
  // two open carriages behind (the first one is where you sit)
  const cars = [['#3d9bff', -TRAIN.seat], ['#ffd23f', -4.35]];
  for (const [c, x] of cars) {
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.75, .5, 1.0, 3, .14), toy(c, { r: .25, cc: 1, m: .1 })); body.position.set(x, .62, 0); T.add(body);
    const rim = new THREE.Mesh(new RoundedBoxGeometry(1.85, .08, 1.08, 2, .04), white); rim.position.set(x, .9, 0); T.add(rim);
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.9, .18, 1.0, 2, .06), navy); base.position.set(x, .34, 0); T.add(base);
    const hitch = new THREE.Mesh(new THREE.BoxGeometry(.4, .08, .12), navy); hitch.position.set(x + 1.1, .36, 0); T.add(hitch);
  }
  // wheels (they spin)
  T.userData.wheels = [];
  const tyre = toy('#2a1a40', { r: .5, cc: .3 }), hubM = toy('#ffd23f', { r: .2, cc: 1, m: .6 });
  for (const x of [.65, .05, -.6, -TRAIN.seat + .5, -TRAIN.seat - .5, -4.35 + .5, -4.35 - .5]) for (const z of [-.5, .5]) {
    const w = new THREE.Group(); w.position.set(x, .2, z); T.add(w); T.userData.wheels.push(w);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .1, 18), tyre); t.rotation.x = Math.PI / 2; w.add(t);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .12, 6), hubM); h.rotation.x = Math.PI / 2; w.add(h);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(.34, .04, .13), hubM); w.add(spoke);
  }
  const seat = new THREE.Object3D(); seat.position.set(-TRAIN.seat, .62, 0); T.add(seat); T.userData.seat = seat;
  T.userData.chimneyTop = new THREE.Vector3(.72, 1.5, 0);
  T.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return T;
}

export function initTrain(G, api) {
  const { scene, Sound, burst, discover, toast } = api;
  const add = o => { scene.add(o); return o; };
  // ---------- the rails along the front of the world ----------
  { const len = TRAIN.x1 - TRAIN.x0, mx = (TRAIN.x0 + TRAIN.x1) / 2, steel = toy('#d8d2f0', { r: .22, cc: .6, m: .85 });
    for (const dz of [-.5, .5]) { const r = new THREE.Mesh(new THREE.BoxGeometry(len, .07, .07), steel); r.position.set(mx, .1, TRAIN.z + dz); r.receiveShadow = true; add(r); }
    const N = Math.floor(len / .9), sl = new THREE.InstancedMesh(new RoundedBoxGeometry(.24, .07, 1.35, 1, .03), toy('#c98b5a', { r: .75, cc: .1 }), N), m4 = new THREE.Matrix4(), cl = new THREE.Color();
    for (let i = 0; i < N; i++) { m4.makeTranslation(TRAIN.x0 + .45 + i * .9, .04, TRAIN.z); sl.setMatrixAt(i, m4); sl.setColorAt(i, cl.setHSL(.07, .45, .5 + (i * 37 % 11) / 90)); }
    sl.receiveShadow = true; add(sl);
    // buffers at both ends
    for (const [x, s] of [[TRAIN.x0, -1], [TRAIN.x1, 1]]) { const b = new THREE.Mesh(new RoundedBoxGeometry(.4, .6, 1.4, 2, .12), toy('#ff4f9a')); b.position.set(x + s * .2, .3, TRAIN.z); b.castShadow = true; add(b); }
  }
  // ---------- the stations ----------
  STATIONS.forEach((st, i) => {
    const g = new THREE.Group(); g.position.set(st.x, 0, 0); add(g);
    const plat = new THREE.Mesh(new RoundedBoxGeometry(4.2, .22, .8, 2, .08), toy('#fff1dc', { r: .5, cc: .4 })); plat.position.set(0, .11, TRAIN.z + .95); plat.receiveShadow = true; g.add(plat);
    for (let k = 0; k < 6; k++) { const t = new THREE.Mesh(new THREE.BoxGeometry(.6, .03, .12), toy(k % 2 ? '#ff4f9a' : '#ffd23f')); t.position.set(-1.75 + k * .7, .235, TRAIN.z + .6); g.add(t); }
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.1, 10), toy('#ffffff')); post.position.set(-2.4, .55, TRAIN.z + .9); post.castShadow = true; g.add(post);
    const sign = new THREE.Mesh(new THREE.CircleGeometry(.42, 32), new THREE.MeshBasicMaterial({ map: emojiTex(st.e, ['#ff6fae', '#3d9bff', '#a15cff', '#3cc46e', '#ff9a2e', '#ffd23f', '#5bc8ff'][i % 7]), transparent: true }));
    sign.position.set(-2.4, 1.35, TRAIN.z + .95); g.add(sign);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toy('#ffd23f', { m: .7, r: .2 })); bell.position.set(-2.4, .95, TRAIN.z + 1.05); bell.rotation.x = Math.PI; g.add(bell);
    st.bell = bell;
    api.tap(g, () => call(i));
    G.interact.push({ x: st.x, y: 0, layer: '', disc: 'train', run: () => call(i), hintY: 1.8 });
  });

  // ---------- the train itself ----------
  const train = buildTrain(); add(train);
  api.tap(train, () => { const P = api.player; if (P.ride && P.ride.type === 'train') { whistle(); return; } const i = nearestStation(P.x); if (Math.abs(STATIONS[i].x - P.x) < 6) call(i); });
  // T.x is the engine's position; the seat is TRAIN.seat behind it
  const T = { x: STATIONS[0].x + TRAIN.seat, dir: 1, v: 0, mode: 'parked', at: 0, target: 0, wait: 0, pending: -1 };
  const seatX = () => T.x - T.dir * TRAIN.seat;
  function nearestStation(x) { let b = 0; STATIONS.forEach((s, i) => { if (Math.abs(s.x - x) < Math.abs(STATIONS[b].x - x)) b = i; }); return b; }
  function face(dir) { if (dir === T.dir) return; const sx = seatX(); T.dir = dir; T.x = sx + dir * TRAIN.seat; puff(6); }
  function whistle() { Sound.tone(880, .35, 'sine', .05, 1.02); Sound.tone(1100, .35, 'sine', .035, 1.02); Sound.tone(880, .3, 'sine', .04, 1.0, .4); puff(3); discover('toot', 'Toot toot!'); }
  // big soft smoke puffs from the chimney
  const puffs = [], puffMat = toy('#ffffff', { r: .95, cc: 0, em: '#ffffff', ei: .25, opacity: .85 });
  for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), puffMat.clone()); p.material.transparent = true; p.visible = false; add(p); puffs.push({ m: p, life: 0 }); }
  let puffI = 0; const V = new THREE.Vector3();
  function puff(n = 1) { for (let k = 0; k < n; k++) { const p = puffs[puffI++ % puffs.length]; V.copy(train.userData.chimneyTop); train.localToWorld(V); p.m.position.copy(V); p.m.position.x += (Math.random() - .5) * .2; p.life = 1; p.m.visible = true; p.vx = -T.dir * T.v * .25 + (Math.random() - .5) * .4; } }

  function call(i) {
    const P = api.player; if (P.ride || P.layer !== '' || P.y > 1) { if (!(P.ride && P.ride.type === 'train')) Sound.click(); return; }
    const st = STATIONS[i];
    st.bell.rotation.z = .6; Sound.bell(1318, .05); Sound.bell(1046, .04, .18);
    discover('train', 'All aboard the Wonder Express! It stops at every station.');
    if (T.mode !== 'arriving' && Math.abs(seatX() - st.x) < 1.2) { board(i); return; }
    // the train chugs in from the side (it then carries on that way)
    const dir = i === STATIONS.length - 1 ? -1 : 1;
    T.dir = dir; T.x = st.x + dir * TRAIN.seat - dir * 26; T.v = 11; T.mode = 'arriving'; T.target = i; T.pending = i; whistle();
  }
  function board(i) {
    const P = api.player; if (P.ride || Math.abs(P.x - STATIONS[i].x) > 6 || P.layer !== '' || P.y > 1.5) { T.mode = 'parked'; T.at = i; return; }
    P.ride = { type: 'train' }; P.vx = P.vy = 0; T.mode = 'stopped'; T.at = i; T.wait = 1.6; T.v = 0;
    Sound.chime(); burst(STATIONS[i].x, 1.2, TRAIN.z, ['#fff', '#ffd23f', '#ff8fc8'], 12, 2);
    if (i === STATIONS.length - 1) face(-1); else if (i === 0) face(1);
  }
  function hopOff() {
    const P = api.player; if (!P.ride || P.ride.type !== 'train') return false;
    if (T.mode !== 'stopped') { whistle(); return true; }
    P.ride = null; P.x = STATIONS[T.at].x; P.y = 0; P.vy = 0; P.vx = 0; P.grounded = true; P.groundZ = 0; T.mode = 'parked';
    Sound.boing(); burst(P.x, .5, P.z, ['#fff', '#ffd23f'], 10, 2); return true;
  }
  function depart(dir) {
    const next = T.at + dir; if (next < 0 || next >= STATIONS.length) return;
    face(dir); T.mode = 'running'; T.target = next; whistle();
  }

  const ACC = 8, VMAX = 18;
  function update(dt, t, P, stick, keys) {
    const riding = P.ride && P.ride.type === 'train';
    STATIONS.forEach(s => { s.bell.rotation.z *= Math.max(0, 1 - dt * 3); s.bell.rotation.z = Math.sin(t * 18) * Math.abs(s.bell.rotation.z); });
    if (T.mode === 'arriving' || T.mode === 'running') {
      const goal = STATIONS[T.target].x + T.dir * TRAIN.seat, dist = (goal - T.x) * T.dir;
      const want = Math.min(VMAX, Math.sqrt(Math.max(0, 2 * ACC * dist)) + .4);
      T.v = Math.min(want, T.v + ACC * dt);
      T.x += T.dir * T.v * dt;
      if (dist <= .02 || (goal - T.x) * T.dir <= 0) {
        T.x = goal; T.v = 0;
        if (T.mode === 'arriving') { board(T.target); }
        else { T.mode = 'stopped'; T.at = T.target; T.wait = 2.6; Sound.chime(); toast(STATIONS[T.at].e + ' Ding ding!'); burst(STATIONS[T.at].x, 1.4, TRAIN.z, ['#fff', '#ffd23f', '#ff8fc8', '#9fe6ff'], 14, 2.4); STATIONS[T.at].bell.rotation.z = .6; discover('station' + T.at, 'Next stop!'); if (T.at === STATIONS.length - 1 || T.at === 0) face(T.at === 0 ? 1 : -1); }
      }
      if (Math.random() < dt * (2 + T.v)) puff();
    } else if (T.mode === 'stopped' && riding) {
      let d = 0;
      if (stick && stick.active) { if (stick.dx > 30) d = 1; else if (stick.dx < -30) d = -1; }
      if (keys.right) d = 1; if (keys.left) d = -1;
      T.wait -= dt;
      if (d && P.ride) depart(d); else if (T.wait <= 0 && P.ride) depart(T.dir);
      if (Math.random() < dt * 1.2) puff();
    } else if (Math.random() < dt * .5) puff();
    // place the train and the rider
    train.position.set(T.x, 0, TRAIN.z); train.rotation.y = T.dir > 0 ? 0 : Math.PI;
    const bob = T.v > .5 ? Math.sin(t * 22) * .012 : 0; train.position.y = bob;
    train.userData.wheels.forEach(w => { w.rotation.z -= T.v * dt / .2; });
    for (const p of puffs) if (p.life > 0) { p.life -= dt * 1.05; p.m.position.y += dt * (1.6 + (1 - p.life) * 1.4); p.m.position.x += p.vx * dt; p.m.scale.setScalar(1 + (1 - p.life) * 2.4); p.m.material.opacity = Math.max(0, p.life) * .8; if (p.life <= 0) p.m.visible = false; }
    if (riding) { train.updateMatrixWorld(true); train.userData.seat.getWorldPosition(V); P.x = V.x; P.y = V.y - .05; P.z = V.z; P.facing = T.dir; P.vx = T.v * T.dir; P.grounded = true; }
  }
  return { update, call, hopOff, whistle, state: T, train, STATIONS };
}
