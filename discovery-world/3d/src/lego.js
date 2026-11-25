// ===================================================================
// lego.js (build 135): DAWSON'S OWN GIANT BRICK HOUSE in the Giant Toy Universe. She designs it herself:
//   🧱 opens the building screen: a big grid (the front of her house). Picture buttons choose a brick colour, a 🪟 window,
//   the 🚪 door (she puts it on herself, anywhere along the bottom) or the 🧽 eraser; she taps squares to place bricks. ✅
//   closes it and the house in the world is rebuilt from her design: the front wall, the back wall (the same pattern, so
//   from inside she sees her own colours and windows), side walls in her favourite colour and a roof on top.
//   With a door, 🚪 takes her inside: the front wall turns see-through (like a dollhouse) so she can walk around in there
//   and look around; 🚪 again takes her out. The design is kept on this device (it is still there next time).
// Every brick of a wall is ONE instanced mesh (two draws for both walls), so even a big house costs almost nothing.
// ===================================================================
import * as THREE from 'three';
import { toy } from './creatures.js';

export const COLS = 12, ROWS = 7, CW = 1, CH = .9;
const KEY = 'ddw3-brickhouse';
const COLORS = ['#ff3b4f', '#ffd23f', '#2f7bff', '#3fc65a', '#ff8a1e', '#ffffff'];
const WIN = 7, DOOR = 8; // cell values: 0 empty, 1..6 a colour, 7 a window, 8 the door (it fills two rows)
const BOX = new THREE.BoxGeometry(1, 1, 1), STUD = new THREE.CylinderGeometry(.16, .16, .12, 10); BOX.userData.shared = STUD.userData.shared = true;

const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (Array.isArray(v) && v.length === COLS * ROWS) return v.map(n => (n | 0) % 9); } catch (e) { } return new Array(COLS * ROWS).fill(0); };
const keep = g => { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch (e) { } };

/** the brick house at x0 (its left edge), its front wall at zf; k: the place kit (add, U, G, P, tapIt, say, Sound, disc) */
export function brickHouse(k, x0, zf = -1) {
  const { G, P } = k, zb = zf - 4.2, zi = (zf + zb) / 2; let grid = load(), inside = false;
  const frontMat = toy('#ffffff', { r: .45 }); frontMat.transparent = true; // (it fades when she is inside)
  const backMat = toy('#ffffff', { r: .45 });
  const mk = (mat, n) => { const m = new THREE.InstancedMesh(BOX, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.userData.dynamic = true; m.frustumCulled = false; k.add(m); return m; };
  const front = mk(frontMat, COLS * ROWS + 4), back = mk(backMat, COLS * ROWS + 4), studs = new THREE.InstancedMesh(STUD, toy('#ffffff', { r: .45 }), COLS * 2 + 4); studs.userData.dynamic = true; studs.frustumCulled = false; k.add(studs);
  const sides = new THREE.Mesh(BOX, toy('#ff3b4f', { r: .5 })), roof = new THREE.Mesh(BOX, toy('#ff3b4f', { r: .5 })), floor = new THREE.Mesh(BOX, toy('#d8c8a8', { r: .7 }));
  sides.userData.dynamic = roof.userData.dynamic = floor.userData.dynamic = true; k.add(sides); k.add(roof); k.add(floor);
  const sideL = sides, sideR = sides.clone(); k.add(sideR);
  floor.scale.set(COLS * CW, .12, 4.2); floor.position.set(x0 + COLS * CW / 2, .06, zi);
  // the building site: a pile of giant bricks to tap
  const pile = new THREE.Group(); pile.position.set(x0 - 2, 0, zf - .6); k.add(pile);
  for (const [i, [dx, dy, dz]] of [[0, .4, 0], [.9, .4, .3], [.45, 1.2, .1], [-.5, .4, -.4]].entries()) { const m = new THREE.Mesh(BOX, toy(COLORS[i], { r: .45 })); m.scale.set(.9, .8, .9); m.position.set(dx, dy, dz); pile.add(m); }
  const M = new THREE.Matrix4(), C = new THREE.Color(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
  const doorCol = () => { for (let c = 0; c < COLS; c++) if (grid[c] === DOOR) return c; return -1; };

  function rebuild() {
    let n = 0, top = 0; const count = {};
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const v = grid[r * COLS + c]; if (!v) continue; if (v === DOOR && r > 0) continue; top = Math.max(top, v === DOOR ? 2 : r + 1); if (v <= 6) count[v] = (count[v] || 0) + 1; }
    const fav = +(Object.entries(count).sort((a, b) => b[1] - a[1])[0] || [1])[0];
    const put = (mesh, i, x, y, z, w, h, d, col) => { M.compose(V.set(x, y, z), Q, S.set(w, h, d)); mesh.setMatrixAt(i, M); mesh.setColorAt(i, C.set(col)); };
    let nb = 0, ns = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const v = grid[r * COLS + c]; if (!v || (v === DOOR && r > 0)) continue;
      const x = x0 + c * CW + CW / 2, y = r * CH + CH / 2, h = v === DOOR ? CH * 2 : CH, yy = v === DOOR ? CH : y;
      const col = v === WIN ? '#bfe8ff' : v === DOOR ? '#8a5a3a' : COLORS[v - 1];
      put(front, n, x, yy, zf, CW * .98, h * .98, v === WIN ? .12 : .5, col); put(back, n, x, yy, zb, CW * .98, h * .98, v === WIN ? .12 : .5, v === DOOR ? COLORS[fav - 1] : col); n++;
      const above = r + 1 < ROWS ? grid[(r + 1) * COLS + c] : 0; if (!above && v !== DOOR && ns < COLS * 2) { M.compose(V.set(x - .25, (r + 1) * CH + .06, zf), Q, S.set(1, 1, 1)); studs.setMatrixAt(ns, M); studs.setColorAt(ns++, C.set(col)); M.compose(V.set(x + .25, (r + 1) * CH + .06, zf), Q, S.set(1, 1, 1)); studs.setMatrixAt(ns, M); studs.setColorAt(ns++, C.set(col)); }
      nb++; }
    const dc = doorCol(); if (dc >= 0) { put(front, n, x0 + dc * CW + .8, CH * .9, zf + .3, .12, .12, .12, '#ffd23f'); n++; } // the door knob
    front.count = back.count = n; studs.count = ns; for (const m of [front, back, studs]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    const H = Math.max(top, 0) * CH; sideL.visible = sideR.visible = roof.visible = H > 0;
    if (H > 0) { sideL.material.color.set(COLORS[fav - 1]); for (const [s, x] of [[sideL, x0 - .25], [sideR, x0 + COLS * CW + .25]]) { s.scale.set(.5, H, 4.7); s.position.set(x, H / 2, zi); }
      roof.scale.set(COLS * CW + 1.2, .5, 5.4); roof.position.set(x0 + COLS * CW / 2, H + .25, zi); roof.material.color.set(fav === 1 ? '#2f7bff' : '#ff3b4f'); }
    built = nb;
  }
  let built = 0; rebuild();

  // ---------- the building screen ----------
  let panel = null, tool = 1;
  function openBuilder() {
    if (inside) return; G.activityOpen = true; k.Sound.chime(); k.say('🧱 Build your house! Pick a colour, then tap the squares. Put the door 🚪 on the bottom. Tap ✅ when you are done!', true);
    if (!panel) {
      panel = document.createElement('div'); panel.id = 'brickPanel';
      Object.assign(panel.style, { position: 'fixed', inset: '0', zIndex: 90, background: 'rgba(255,248,232,.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', touchAction: 'none' });
      const gridEl = document.createElement('div'); gridEl.id = 'brickGrid'; Object.assign(gridEl.style, { display: 'grid', gridTemplateColumns: `repeat(${COLS}, 34px)`, gridTemplateRows: `repeat(${ROWS}, 30px)`, gap: '3px', padding: '8px', background: '#c8a070', borderRadius: '14px' });
      for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) { const b = document.createElement('button'); b.className = 'brickCell'; b.dataset.r = r; b.dataset.c = c; b.setAttribute('aria-label', `square ${c + 1}, ${r + 1}`);
        Object.assign(b.style, { width: '34px', height: '30px', border: '2px solid rgba(0,0,0,.15)', borderRadius: '6px', padding: 0 });
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); paint(r, c); }); gridEl.appendChild(b); }
      const tools = document.createElement('div'); Object.assign(tools.style, { display: 'grid', gridTemplateColumns: 'repeat(2, 58px)', gap: '8px' });
      const tb = (id, label, fill, fn) => { const b = document.createElement('button'); b.className = 'brickTool'; b.dataset.tool = id; b.setAttribute('aria-label', label); b.textContent = fill.startsWith('#') ? '' : fill; Object.assign(b.style, { width: '58px', height: '50px', borderRadius: '14px', border: '4px solid #fff', fontSize: '28px', background: fill.startsWith('#') ? fill : '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }); b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }); tools.appendChild(b); return b; };
      COLORS.forEach((col, i) => tb(String(i + 1), 'brick colour ' + (i + 1), col, () => pick(i + 1)));
      tb('7', 'window', '🪟', () => pick(WIN)); tb('8', 'door', '🚪', () => pick(DOOR)); tb('0', 'eraser', '🧽', () => pick(0)); tb('done', 'done', '✅', closeBuilder);
      panel.append(gridEl, tools); document.body.appendChild(panel);
    }
    panel.style.display = 'flex'; pick(tool); show();
  }
  function pick(t) { tool = t; for (const b of panel.querySelectorAll('.brickTool')) b.style.borderColor = b.dataset.tool === String(t) ? '#2a2333' : '#fff'; k.Sound.click && k.Sound.click(); if (t === DOOR) k.say('🚪 Tap a square on the bottom row for the door!', true); }
  function paint(r, c) {
    if (tool === DOOR) { if (r > 1) { k.say('🚪 The door goes on the bottom!', true); return; } for (let i = 0; i < grid.length; i++) if (grid[i] === DOOR) grid[i] = 0; grid[c] = DOOR; grid[COLS + c] = DOOR; k.Sound.chime(); }
    else { const i = r * COLS + c; if (grid[i] === DOOR) { grid[c] = grid[COLS + c] = 0; } grid[i] = tool; k.Sound.tone ? k.Sound.tone(392 + r * 50, .08, 'square', .04, 1.2) : k.Sound.click(); }
    keep(grid); show(); rebuild();
  }
  function show() { if (!panel) return; for (const b of panel.querySelectorAll('.brickCell')) { const v = grid[b.dataset.r * COLS + +b.dataset.c]; b.style.background = !v ? '#f4ead8' : v === WIN ? '#bfe8ff' : v === DOOR ? '#8a5a3a' : COLORS[v - 1]; b.textContent = v === WIN ? '🪟' : v === DOOR && b.dataset.r === '0' ? '🚪' : ''; } }
  function closeBuilder() { panel.style.display = 'none'; G.activityOpen = false; rebuild(); k.disc && k.disc('brickhouse');
    k.say(doorCol() >= 0 ? '🏠 What a house! Walk to your door and tap 🚪 to go inside!' : (built ? '🏠 Lovely! Put a door 🚪 on so you can go inside!' : '🧱 Tap 🧱 to build your house!'), true); }
  k.tapIt(pile, openBuilder, x0 - 2, 'brickbuild');
  G.interact.push({ x: x0 - 2, y: 0, layer: 'space', icon: '🧱', action: 'Build your house!', hintY: 2.4, run: openBuilder, need: () => !inside });

  // ---------- going in and out through her door ----------
  const doorX = () => x0 + doorCol() * CW + CW / 2;
  const go = () => { if (doorCol() < 0) return; inside = !inside; k.Sound.chime(); P.x = doorX(); P.vx = 0; if (inside) { k.say('🏠 You are inside your house! Look around!', true); k.disc && k.disc('brickinside'); } else { P.groundZ = 0; k.say('🚪 Back outside!', false); } };
  G.interact.push({ get x() { return doorCol() >= 0 ? doorX() : -1e9; }, y: 0, layer: 'space', get icon() { return inside ? '🚪' : '🚪'; }, get action() { return inside ? 'Go outside' : 'Go inside'; }, hintY: 2.6, run: go, need: () => doorCol() >= 0 });
  k.U.push(dt => {
    if (inside && (P.layer !== 'space' || P.ride || Math.abs(P.x - (x0 + COLS * CW / 2)) > COLS * CW)) inside = false; // (she flew away or rode off)
    if (inside) { P.groundZ = zi; P.x = Math.max(x0 + .5, Math.min(x0 + COLS * CW - .5, P.x)); }
    const want = inside ? .18 : 1; frontMat.opacity += (want - frontMat.opacity) * Math.min(1, dt * 6); frontMat.depthWrite = frontMat.opacity > .9; studs.visible = frontMat.opacity > .5;
  });
  return { open: openBuilder, grid: () => grid.slice(), inside: () => inside, go, rebuild, built: () => built };
}
