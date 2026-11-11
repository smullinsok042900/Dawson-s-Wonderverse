// ===================================================================
// meadow.js: 3D build 7, THE CREATIVE MEADOW (past the Fluffkin House).
//   • BLOCK BUILDER: a 10 x 5 building wall. Pick a block in the tray at the
//     bottom (colours, window, door, roof, star, heart, or the sponge to
//     erase), then tap where it goes. Blocks are solid on top: build stairs
//     and towers and climb them. Saved.
//   • COLOURING CORNER: two big colouring pictures. Pick a colour and tap a
//     part of the picture to fill it. Saved.
// ===================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toy, starGeometry } from './creatures.js';

export const BUILD = { x0: 208.4, cols: 10, rows: 5, cw: 1.2, ch: 1.0, z: -1.7 };
export const BLOCKS = [
  { c: '#ff4f9a' }, { c: '#ffd23f' }, { c: '#3d9bff' }, { c: '#3cc46e' }, { c: '#a15cff' }, { c: '#ffffff' },
  { c: '#bfe8ff', kind: 'window', icon: '🪟' }, { c: '#c26ae8', kind: 'door', icon: '🚪' }, { c: '#ff6fae', kind: 'roof', icon: '🔺' },
  { c: '#ffd84a', kind: 'star', icon: '⭐' }, { c: '#ff8fc8', kind: 'heart', icon: '💗' },
];
export const ERASE = -2;
export const COLOR_X = [227.4, 233.6];

export function buildMeadow(G, api) {
  const { scene, world, Sound, burst, discover } = api;
  const add = (o, p = scene) => { p.add(o); return o; };

  // ---------- signpost arch for the meadow ----------
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(4.6 - i * .28, .15, 12, 44, Math.PI), toy(['#ff9fd2', '#ffd45e', '#9fe6a8', '#9fd8ff', '#c9a6ff', '#ffb35c'][i])); t.position.set(202, 0, -3.8); add(t); }

  // ================= BLOCK BUILDER =================
  const B = BUILD, W = B.cols * B.cw, H = B.rows * B.ch;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: '#fff6ee', transparent: true, opacity: .55 }));
  board.position.set(B.x0 + W / 2, H / 2, B.z - .75); add(board);
  { const pts = []; for (let i = 0; i <= B.cols; i++) pts.push(B.x0 + i * B.cw, 0, B.z - .72, B.x0 + i * B.cw, H, B.z - .72); for (let j = 0; j <= B.rows; j++) pts.push(B.x0, j * B.ch, B.z - .72, B.x0 + W, j * B.ch, B.z - .72);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#c9a6ff' }))); }
  const frame = new THREE.Mesh(new RoundedBoxGeometry(W + .5, .35, 1.8, 2, .12), toy('#ffb35c')); frame.position.set(B.x0 + W / 2, -.12, B.z); frame.receiveShadow = true; add(frame);
  for (const x of [B.x0 - .25, B.x0 + W + .25]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, H + .6, 10), toy('#ffffff')); p.position.set(x, (H + .6) / 2, B.z - .75); p.castShadow = true; add(p); }
  // an invisible tapping surface in front of the building wall
  const tapPlane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ visible: false })); tapPlane.position.set(B.x0 + W / 2, H / 2, B.z + .72); add(tapPlane);
  const geoCube = new RoundedBoxGeometry(B.cw - .04, B.ch - .04, 1.4, 2, .1);
  const roofGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(-B.cw / 2, -B.ch / 2); sh.lineTo(B.cw / 2, -B.ch / 2); sh.lineTo(0, B.ch / 2); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2 }); g.translate(0, 0, -.7); return g; })();
  const mats = BLOCKS.map(b => toy(b.c, { r: .35, cc: .8 }));
  const blockMeshes = new Map(); world.build = world.build || new Array(B.cols * B.rows).fill(-1);
  function makeBlock(t) {
    const b = BLOCKS[t], g = new THREE.Group();
    if (b.kind === 'roof') { const m = new THREE.Mesh(roofGeo, mats[t]); m.castShadow = true; m.receiveShadow = true; g.add(m); return g; }
    const m = new THREE.Mesh(geoCube, b.kind ? toy(b.kind === 'window' || b.kind === 'door' ? '#fff1d2' : b.c, { r: .35, cc: .8 }) : mats[t]); m.castShadow = true; m.receiveShadow = true; g.add(m);
    if (b.kind === 'window') { const w = new THREE.Mesh(new THREE.PlaneGeometry(.7, .6), new THREE.MeshStandardMaterial({ color: '#bfe8ff', emissive: '#9fd8ff', emissiveIntensity: .3 })); w.position.z = .71; g.add(w); const cr = new THREE.Mesh(new THREE.PlaneGeometry(.06, .6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); cr.position.z = .72; g.add(cr); const cr2 = cr.clone(); cr2.rotation.z = Math.PI / 2; cr2.scale.x = 1.15; g.add(cr2); }
    if (b.kind === 'door') { const d = new THREE.Mesh(new THREE.PlaneGeometry(.62, .9), toy('#c26ae8')); d.position.set(0, -.04, .71); g.add(d); const k = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), toy('#ffd84a')); k.position.set(.18, -.04, .74); g.add(k); }
    if (b.kind === 'star') { const s = new THREE.Mesh(starGeometry(.34, .16, .08, .04, 2), toy('#ffffff', { em: '#fff3a6', ei: .5 })); s.position.z = .72; g.add(s); }
    if (b.kind === 'heart') { const sh = new THREE.Shape(); sh.moveTo(0, -.25); sh.bezierCurveTo(-.45, .05, -.2, .38, 0, .15); sh.bezierCurveTo(.2, .38, .45, .05, 0, -.25); const h = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .06, bevelEnabled: false }), toy('#ffffff', { em: '#ffd1ec', ei: .4 })); h.position.z = .7; g.add(h); }
    return g;
  }
  function cellPos(i) { const col = i % B.cols, row = Math.floor(i / B.cols); return [B.x0 + (col + .5) * B.cw, (row + .5) * B.ch, B.z]; }
  function rebuildBlocks(popI) {
    for (const [i, m] of blockMeshes) { scene.remove(m); blockMeshes.delete(i); }
    world.build.forEach((t, i) => { if (t < 0 || !BLOCKS[t]) return; const m = makeBlock(t); const [x, y, z] = cellPos(i); m.position.set(x, y, z); if (i === popI) m.scale.setScalar(.2); add(m); blockMeshes.set(i, m); });
    // the top of every block is something you can stand on
    for (let k = G.platforms.length - 1; k >= 0; k--) if (G.platforms[k].builder) G.platforms.splice(k, 1);
    world.build.forEach((t, i) => { if (t < 0) return; const col = i % B.cols, row = Math.floor(i / B.cols), above = world.build[i + B.cols]; if (row < B.rows - 1 && above >= 0) return; const x0 = B.x0 + col * B.cw; G.platforms.push({ a: x0 - .05, b: x0 + B.cw + .05, y: (row + 1) * B.ch - (BLOCKS[t].kind === 'roof' ? .45 : 0), layer: '', z: B.z + .3, builder: true }); });
  }
  world.buildType = world.buildType ?? 0;
  function tapBuild(h) {
    const p = h.point, col = Math.floor((p.x - B.x0) / B.cw), row = Math.floor(p.y / B.ch);
    if (col < 0 || col >= B.cols || row < 0 || row >= B.rows) return;
    const i = row * B.cols + col, cur = world.build[i], t = world.buildType;
    if (t === ERASE || cur === t) { if (cur < 0) return; world.build[i] = -1; Sound.pop(); burst(...cellPos(i), [BLOCKS[cur].c, '#fff'], 10, 2); }
    else { world.build[i] = t; Sound.tone(300 + row * 80 + col * 20, .12, 'triangle', .05, 1.5); burst(...cellPos(i), [BLOCKS[t].c, '#fff'], 8, 1.5); }
    rebuildBlocks(world.build[i] >= 0 ? i : -1);
    discover('builder', 'The Block Builder! Pick a block below and tap to build.');
    if (world.build.filter(v => v >= 0).length === 8) discover('builder8', 'Look what you built! You can climb on your blocks.');
    api.saveSoon();
  }
  api.tap(tapPlane, tapBuild);
  G.interact.push({ x: B.x0 + W / 2, y: 0, layer: '', disc: 'builder', run: () => tapBuild({ point: new THREE.Vector3(B.x0 + B.cw * 4.5, .5, 0) }), hintY: 5.6 });

  // ================= COLOURING CORNER =================
  const PW = 600, PH = 450;
  const P2 = (f) => { const p = new Path2D(); f(p); return p; };
  const ring = (cx, cy, r1, r2) => P2(p => { p.arc(cx, cy, r2, Math.PI, 0); p.arc(cx, cy, r1, 0, Math.PI, true); p.closePath(); });
  const PICTURES = [
    [ // rainbow castle
      P2(p => p.rect(0, 0, PW, PH)), P2(p => p.arc(500, 80, 50, 0, 7)), ring(170, 250, 95, 125), ring(170, 250, 125, 155), ring(170, 250, 155, 185),
      P2(p => p.ellipse(300, 470, 380, 120, 0, 0, 7)), P2(p => p.rect(310, 210, 180, 170)), P2(p => p.rect(280, 150, 60, 230)), P2(p => p.rect(460, 150, 60, 230)),
      P2(p => { p.moveTo(270, 150); p.lineTo(310, 70); p.lineTo(350, 150); p.closePath(); }), P2(p => { p.moveTo(450, 150); p.lineTo(490, 70); p.lineTo(530, 150); p.closePath(); }),
      P2(p => { p.moveTo(370, 380); p.lineTo(370, 320); p.arc(400, 320, 30, Math.PI, 0); p.lineTo(430, 380); p.closePath(); }), P2(p => p.arc(355, 250, 18, 0, 7)), P2(p => p.arc(445, 250, 18, 0, 7)),
      P2(p => { p.moveTo(310, 70); p.lineTo(310, 40); p.lineTo(345, 50); p.lineTo(310, 60); p.closePath(); }),
    ],
    [ // butterfly
      P2(p => p.rect(0, 0, PW, PH)), P2(p => { p.ellipse(110, 80, 70, 30, 0, 0, 7); }), P2(p => { p.ellipse(500, 110, 60, 26, 0, 0, 7); }),
      P2(p => p.ellipse(205, 165, 115, 95, -.4, 0, 7)), P2(p => p.ellipse(395, 165, 115, 95, .4, 0, 7)), P2(p => p.ellipse(225, 310, 85, 70, .4, 0, 7)), P2(p => p.ellipse(375, 310, 85, 70, -.4, 0, 7)),
      P2(p => p.arc(190, 160, 32, 0, 7)), P2(p => p.arc(410, 160, 32, 0, 7)), P2(p => p.arc(230, 315, 22, 0, 7)), P2(p => p.arc(370, 315, 22, 0, 7)),
      P2(p => p.ellipse(300, 245, 22, 120, 0, 0, 7)), P2(p => p.arc(300, 115, 30, 0, 7)),
    ],
  ];
  world.colorings = world.colorings || PICTURES.map(pic => pic.map(() => '#ffffff'));
  const pics = PICTURES.map((pic, n) => {
    const c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.45), new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }));
    mesh.position.set(COLOR_X[n], 2.75, -2.3); mesh.receiveShadow = true; add(mesh);
    const fr = new THREE.Mesh(new RoundedBoxGeometry(5.0, 3.85, .25, 2, .1), toy(['#ff9fd2', '#9fd8ff'][n])); fr.position.set(COLOR_X[n], 2.75, -2.45); fr.castShadow = true; add(fr);
    for (const dx of [-1.6, 1.6]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1.1, 8), toy('#b06a32')); leg.position.set(COLOR_X[n] + dx, .55, -2.4); add(leg); }
    const draw = () => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, PW, PH);
      pic.forEach((path, k) => { g.fillStyle = world.colorings[n][k] || '#ffffff'; g.fill(path); });
      g.strokeStyle = '#4a2a6a'; g.lineWidth = 6; g.lineJoin = 'round'; pic.forEach((path, k) => { if (k) g.stroke(path); });
      tex.needsUpdate = true;
    };
    draw();
    const tapColor = h => {
      if (!h || !h.uv) return;
      const x = h.uv.x * PW, y = (1 - h.uv.y) * PH;
      for (let k = pic.length - 1; k >= 0; k--) if (g.isPointInPath(pic[k], x, y)) {
        let col = world.paintColor; if (col === 'rainbow') col = ['#ff4f9a', '#ff9a2e', '#ffd23f', '#3cc46e', '#3d9bff', '#a15cff'][Math.floor(Math.random() * 6)];
        world.colorings[n][k] = col; draw(); Sound.tone(500 + k * 30, .12, 'sine', .05, 1.4); burst(h.point.x, h.point.y, h.point.z + .1, [col, '#fff'], 8, 1.5);
        discover('coloring', 'The Colouring Corner! Pick a colour, then tap the picture.'); api.saveSoon(); return;
      }
    };
    api.tap(mesh, tapColor);
    return { mesh, draw };
  });
  G.interact.push({ x: COLOR_X[0], y: 0, layer: '', disc: 'coloring', run: () => tapColorAt(0), hintY: 4.9 });
  function tapColorAt(n) { const m = pics[n].mesh; m.userData.tap({ uv: new THREE.Vector2(.83, .82), point: m.position.clone() }); }

  // signs: a block icon and a crayon icon (pictures, no reading)
  const sign = (x, emoji) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff8ea'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#ffb35c'; g.stroke(); g.font = '72px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 64, 70);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Mesh(new THREE.CircleGeometry(.55, 32), new THREE.MeshBasicMaterial({ map: t, transparent: true })); s.position.set(x, 6.1, -2.4); add(s);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .7, 6), toy('#ffffff')); post.position.set(x, 5.4, -2.45); add(post); };
  sign(B.x0 + W / 2, '🧱'); sign((COLOR_X[0] + COLOR_X[1]) / 2, '🖍️');

  function update(dt) { for (const m of blockMeshes.values()) if (m.scale.x < 1) m.scale.setScalar(Math.min(1, m.scale.x + dt * 5)); }
  function restored() { if (!Array.isArray(world.build) || world.build.length !== B.cols * B.rows) world.build = new Array(B.cols * B.rows).fill(-1); rebuildBlocks(-1); pics.forEach(p => p.draw()); }
  const near = P => P.layer === '' && P.y < 6 && P.y > -.5;
  return {
    update, restored, PICTURES,
    nearBuild: P => near(P) && P.x > B.x0 - 2.5 && P.x < B.x0 + W + 2.5,
    nearColor: P => near(P) && P.x > COLOR_X[0] - 4 && P.x < COLOR_X[1] + 4,
  };
}
