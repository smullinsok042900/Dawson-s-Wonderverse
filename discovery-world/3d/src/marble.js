// ===================================================================
// marble.js: 3D build 9, THE MARBLE MACHINE (a new area past the race track).
//   • Tap anywhere on the big board and a shiny marble drops from the top.
//     (PAW in front of it drops one too.)
//   • Tap a ramp to flip it, so the marbles roll a different way.
//   • Marbles bounce off golden pegs and land in the eight music bins
//     at the bottom: each bin plays its own note and lights up.
//   No winning or losing: it's a music toy you can design.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toy } from './creatures.js';
import { NOTES } from './audio.js';

export const MARBLE = { cx: 332, w: 10, top: 3.75, floor: .32, z: -2.05 };
const BIN_COLS = ['#ff4f6e', '#ff9a2e', '#ffd23f', '#3cc46e', '#35c9d8', '#3d9bff', '#8a6cff', '#ff6fd0'];
const MARBLE_COLS = ['#ff4f9a', '#3d9bff', '#ffd23f', '#3cc46e', '#a15cff', '#ff9a2e', '#5be0ff', '#ffffff'];

export function initMarbles(G, api) {
  const { scene, Sound, burst, discover } = api;
  const M = MARBLE, X0 = M.cx - M.w / 2, X1 = M.cx + M.w / 2;
  const root = new THREE.Group(); scene.add(root);
  // ---------- the board ----------
  const board = new THREE.Mesh(new RoundedBoxGeometry(M.w + .8, 4.2, .3, 3, .14), toy('#fff6e8', { r: .55, cc: .5 })); board.position.set(M.cx, 2.1, M.z - .4); board.receiveShadow = true; root.add(board);
  // a soft dotted pattern on the board
  { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, '#d9ecff'); gr.addColorStop(1, '#ffe3f3'); g.fillStyle = gr; g.fillRect(0, 0, 512, 300);
    for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${.25 + (i % 4) * .1})`; g.beginPath(); g.arc((i * 89) % 512, (i * 53) % 300, 3 + (i % 3) * 2, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(M.w, 3.9), new THREE.MeshPhysicalMaterial({ map: t, roughness: .4, clearcoat: .6 })); face.position.set(M.cx, 2.1, M.z - .24); face.receiveShadow = true; root.add(face); }
  for (const x of [X0 - .25, X1 + .25]) { const s = new THREE.Mesh(new RoundedBoxGeometry(.5, 4.5, .8, 2, .18), toy('#ff8fc8')); s.position.set(x, 2.25, M.z - .1); s.castShadow = true; root.add(s); }
  const crown = new THREE.Mesh(new RoundedBoxGeometry(M.w + 1.4, .45, .9, 2, .18), toy('#a15cff')); crown.position.set(M.cx, 4.4, M.z - .1); crown.castShadow = true; root.add(crown);
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), toy(MARBLE_COLS[i % 8], { em: MARBLE_COLS[i % 8], ei: .5 })); b.position.set(X0 + .1 + i * (M.w - .2) / 8, 4.7, M.z + .2); root.add(b); }

  // ---------- pieces: ramps (tap to flip), pegs, bins ----------
  const segs = [];   // {ax,ay,bx,by,th,e,kind}
  const ramps = [];
  const rampDef = [[-3.1, 3.1], [0.2, 3.2], [3.3, 3.05], [-1.7, 2.35], [1.8, 2.3], [-3.5, 1.6], [0, 1.55], [3.5, 1.6]];
  rampDef.forEach(([u, v], i) => {
    const ang = (i % 2 ? -1 : 1) * .3, len = 2.2;
    const m = new THREE.Mesh(new RoundedBoxGeometry(len, .14, .55, 2, .06), toy(MARBLE_COLS[(i + 2) % 7], { r: .25, cc: 1 })); m.castShadow = true;
    m.position.set(M.cx + u, v, M.z); m.rotation.z = ang; root.add(m);
    const r = { u, v, len, ang, target: ang, m, seg: { th: .07, e: .25, kind: 'ramp' } }; ramps.push(r); segs.push(r.seg);
    m.userData.tap = () => { r.target = -r.target; Sound.click(); Sound.tone(520 + i * 40, .1, 'triangle', .04, 1.5); burst(m.position.x, v + .2, M.z + .3, ['#fff', MARBLE_COLS[(i + 2) % 7]], 6, 1.4); discover('ramp', 'Flip the ramps to make the marbles go a new way!'); };
  });
  const pegs = [];
  for (const [u, v] of [[-4.3, 2.65], [-1.6, 2.8], [1.8, 2.75], [4.3, 2.65], [-1.75, 1.95], [1.75, 1.95], [-4.3, 1.08], [-3.0, .98], [-1.7, 1.08], [-.5, .98], [.7, 1.08], [1.95, .98], [3.2, 1.08], [4.4, .98]]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .55, 14), toy('#ffd23f', { m: .7, r: .18, cc: 1 })); m.rotation.x = Math.PI / 2; m.position.set(M.cx + u, v, M.z); m.castShadow = true; root.add(m);
    pegs.push({ x: M.cx + u, y: v, r: .11, m, glow: 0 });
  }
  // eight music bins along the bottom, with little walls between them
  const bins = [], bw = M.w / 8;
  for (let i = 0; i < 8; i++) {
    const x = X0 + bw * (i + .5);
    const pad = new THREE.Mesh(new RoundedBoxGeometry(bw - .1, .16, .55, 2, .06), toy(BIN_COLS[i], { em: BIN_COLS[i], ei: .1, r: .3, cc: 1 })); pad.position.set(x, M.floor - .08, M.z); pad.receiveShadow = true; root.add(pad);
    bins.push({ x, pad, glow: 0, note: NOTES[i] * .5 });
    if (i > 0) { const d = new THREE.Mesh(new RoundedBoxGeometry(.08, .5, .55, 1, .03), toy('#ffffff')); d.position.set(X0 + bw * i, M.floor + .25, M.z); root.add(d); segs.push({ ax: X0 + bw * i, ay: M.floor, bx: X0 + bw * i, by: M.floor + .5, th: .04, e: .3, kind: 'wall' }); }
  }
  // the floor of the bins and the side walls
  segs.push({ ax: X0, ay: M.floor, bx: X1, by: M.floor, th: .01, e: .35, kind: 'floor' });
  segs.push({ ax: X0, ay: 0, bx: X0, by: 7, th: .01, e: .4, kind: 'wall' }, { ax: X1, ay: 0, bx: X1, by: 7, th: .01, e: .4, kind: 'wall' });
  // a hint arrow at the top: marbles come from here
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(.5, .2, .5, 20, 1, true), toy('#ffffff', { opacity: .9 })); hopper.position.set(M.cx, M.top + .55, M.z); root.add(hopper);

  function placeRamps(dt) {
    for (const r of ramps) {
      r.ang += (r.target - r.ang) * Math.min(1, dt * 12); r.m.rotation.z = r.ang;
      const c = Math.cos(r.ang) * r.len / 2, s = Math.sin(r.ang) * r.len / 2, x = M.cx + r.u;
      Object.assign(r.seg, { ax: x - c, ay: r.v - s, bx: x + c, by: r.v + s });
    }
  }
  placeRamps(1);

  // ---------- marbles ----------
  const marbles = [], R = .17, geo = new THREE.SphereGeometry(R, 24, 16); let colI = 0;
  const mats = MARBLE_COLS.map(c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .04, metalness: .1, clearcoat: 1, clearcoatRoughness: .03, iridescence: .5, iridescenceIOR: 1.4, transparent: true }));
  function drop(x) {
    x = Math.max(X0 + .3, Math.min(X1 - .3, x));
    if (marbles.length >= 18) { const old = marbles.shift(); root.remove(old.m); }
    const mat = mats[colI++ % mats.length].clone(), m = new THREE.Mesh(geo, mat); m.castShadow = true; root.add(m);
    const b = { x, y: M.top, vx: (Math.random() - .5) * .3, vy: 0, m, life: 0, rest: 0, cd: new Map() }; m.position.set(x, b.y, M.z); marbles.push(b);
    Sound.pop(); discover('marbles', 'The Marble Machine! Tap the board to drop marbles. Tap a ramp to flip it.');
    return b;
  }
  // tapping the board (or a peg, a bin...) drops a marble above where you tapped; ramps have their own tap (flip)
  const dropTap = h => drop(h && h.point ? h.point.x : M.cx);
  root.traverse(o => { if (o.isMesh && !o.userData.tap) o.userData.tap = dropTap; });
  G.taps.push(root);
  G.interact.push({ x: M.cx, y: 0, layer: '', disc: 'marbles', run: () => drop(api.player.x + (Math.random() - .5) * .6), hintY: 1.6 });

  function collideSeg(b, s) {
    const dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy || 1e-6;
    let k = ((b.x - s.ax) * dx + (b.y - s.ay) * dy) / L2; k = Math.max(0, Math.min(1, k));
    const px = s.ax + dx * k, py = s.ay + dy * k; let nx = b.x - px, ny = b.y - py; const d = Math.hypot(nx, ny), min = R + s.th;
    if (d >= min || d < 1e-6) return 0;
    nx /= d; ny /= d; b.x += nx * (min - d); b.y += ny * (min - d);
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= (1 + s.e) * vn * nx; b.vy -= (1 + s.e) * vn * ny; b.vx *= .997; }
    return -vn;
  }
  function step(b, h) {
    b.vy -= 9 * h;
    b.x += b.vx * h; b.y += b.vy * h;
    for (const s of segs) { const imp = collideSeg(b, s); if (imp > 0 && s.kind === 'floor') { const i = Math.max(0, Math.min(7, Math.floor((b.x - X0) / bw))), bin = bins[i]; if (imp > .9 && !(b.cd.get(i) > 0)) { b.cd.set(i, .3); bin.glow = 1; Sound.bell(bin.note * 2, Math.min(.06, .02 + imp * .01)); discover('marblemusic', 'Ding! Every bin plays a different note.'); if (imp > 2) burst(bin.x, M.floor + .3, M.z + .3, ['#fff', BIN_COLS[i]], 6, 1.6); } } }
    for (const p of pegs) { let nx = b.x - p.x, ny = b.y - p.y; const d = Math.hypot(nx, ny), min = R + p.r; if (d < min && d > 1e-6) { nx /= d; ny /= d; b.x += nx * (min - d); b.y += ny * (min - d); const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.55 * vn * nx; b.vy -= 1.55 * vn * ny; if (vn < -1.2) { p.glow = 1; Sound.tone(1300 + Math.random() * 300, .05, 'sine', .025, 1.1); } } } }
  }
  function update(dt) {
    placeRamps(dt);
    const h = Math.min(dt, 1 / 30) / 4;
    for (let i = marbles.length - 1; i >= 0; i--) {
      const b = marbles[i]; b.life += dt; for (const [k, v] of b.cd) b.cd.set(k, v - dt);
      const ox = b.x; for (let s = 0; s < 4; s++) step(b, h);
      // marbles bump each other a little
      for (const o of marbles) if (o !== b) { const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy); if (d < R * 2 && d > 1e-6) { const p = (R * 2 - d) / 2; b.x += dx / d * p; b.y += dy / d * p; o.x -= dx / d * p; o.y -= dy / d * p; } }
      b.m.position.set(b.x, b.y, M.z); b.m.rotation.z -= (b.x - ox) / R;
      const slow = Math.hypot(b.vx, b.vy) < .3 && b.y < M.floor + .4; b.rest = slow ? b.rest + dt : 0;
      if (b.rest > 2.5 || b.life > 25 || b.y < -2) { b.m.material.opacity -= dt * 2; b.m.scale.setScalar(Math.max(.01, b.m.material.opacity)); if (b.m.material.opacity <= 0) { root.remove(b.m); b.m.material.dispose(); marbles.splice(i, 1); } }
    }
    for (const bin of bins) { bin.glow = Math.max(0, bin.glow - dt * 2.2); bin.pad.material.emissiveIntensity = .1 + bin.glow * 1.2; bin.pad.position.y = M.floor - .08 - bin.glow * .05; }
    for (const p of pegs) { p.glow = Math.max(0, p.glow - dt * 4); p.m.scale.setScalar(1 + p.glow * .3); }
  }
  return { update, drop, marbles, ramps, bins, flip: i => ramps[i].m.userData.tap() };
}
