// ===================================================================
// accessories.js (build 101): DRESS-UP. Cute things to wear, on every playable friend.
//
// Each accessory is made ONCE, as one small mesh with the shared painted material (one draw call, no new shader), at a
// standard size around its own fitting point (+y up, +z toward the camera). Each character has a FIT table: for each
// slot (head, face, neck, back) the bone it hangs from, where the point is on the character (at rest), how big, and a
// little tilt. Wearing = putting the shared mesh's clone on that bone, so it moves with every animation (walking,
// hopping, squashing, turning) and never floats away. One item per slot; all four slots can be worn together.
// A character without a sensible place for a slot (Zuzu the star has no neck) simply does not offer it.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat } from './spacekit.js';
import { attach } from './sculpt.js';
import { glass as glassMat } from './jupiter-world.js';

// where things sit on each friend (positions on the character at rest, as in characters.js)
export const FIT = {
  pip: { head: { b: 'head', p: [0, 1.57, -.02], s: .95 }, face: { b: 'head', p: [0, 1.345, .405], s: 1 }, neck: { b: 'spine', p: [0, .98, .02], s: 1 }, back: { b: 'spine', p: [0, .78, -.3], s: 1 } },
  sprout: { head: { b: 'head', p: [0, 1.53, -.02], s: 1 }, face: { b: 'head', p: [0, 1.23, .42], s: 1.05 }, neck: { b: 'spine', p: [0, .9, .02], s: 1.05 }, back: { b: 'spine', p: [0, .76, -.32], s: 1 } },
  zuzu: { head: { b: 'core', p: [.22, 1.5, .02], s: .78, rz: -.45 }, face: { b: 'core', p: [0, 1.0, .35], s: .82 }, back: { b: 'core', p: [0, .92, -.17], s: .85 } },
  jelly: { head: { b: 'body', p: [0, 1.17, .02], s: 1.05 }, face: { b: 'body', p: [0, .72, .6], s: 1.05 }, neck: { b: 'body', p: [0, .34, .05], s: 1.45 }, back: { b: 'body', p: [0, .62, -.58], s: 1.05 } },
};

// the collection: [id, slot, picture emoji (for the icon), builder]
const G = () => ({ box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 18), ball: new THREE.SphereGeometry(1, 16, 12), cone: new THREE.ConeGeometry(1, 1, 18), oct: new THREE.OctahedronGeometry(1), tor: new THREE.TorusGeometry(1, .14, 10, 28) });
const star = (r = 1, inner = .45, depth = .3) => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * .3, bevelSize: depth * .25, bevelSegments: 2 }); g.center(); return g; };
const heart = (s = 1, depth = .25) => { const sh = new THREE.Shape(); sh.moveTo(0, -.6 * s); sh.bezierCurveTo(-1.1 * s, .1 * s, -.6 * s, .9 * s, 0, .45 * s); sh.bezierCurveTo(.6 * s, .9 * s, 1.1 * s, .1 * s, 0, -.6 * s); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * .3, bevelSize: depth * .3, bevelSegments: 2 }); g.center(); return g; };
const glassesFrame = (b, g, col, lens, shape = 'round') => { for (const s of [-1, 1]) { if (shape === 'heart') { b.put(heart(.14, .04), s * .17, 0, 0, col); b.put(heart(.1, .02), s * .17, .005, .02, lens); } else if (shape === 'star') { b.put(star(.15, .5, .04), s * .17, 0, 0, col); b.put(star(.1, .5, .02), s * .17, 0, .02, lens); } else { b.put(g.tor, s * .17, 0, 0, col, [.13, .13, .5]); b.put(g.cyl, s * .17, 0, 0, lens, [.12, .015, .12], [Math.PI / 2, 0, 0]); } }
  b.put(g.box, 0, .02, 0, col, [.1, .025, .025]); for (const s of [-1, 1]) b.put(g.box, s * .31, .02, -.12, col, [.025, .025, .25]); };
export const ITEMS = [
  // ---- head ----
  ['crown', 'head', '👑', (b, g) => { b.put(g.cyl, 0, .05, 0, '#ffd23f', [.2, .1, .2]); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.put(g.cone, Math.sin(a) * .18, .16, Math.cos(a) * .18, '#ffd23f', [.05, .14, .05]); b.put(g.ball, Math.sin(a) * .19, .06, Math.cos(a) * .19, ['#ff4f6a', '#5aa8ff', '#7fe0a0', '#ff6fd8', '#ffffff'][i], .03); } }],
  ['tiara', 'head', '💎', (b, g) => { b.put(g.tor, 0, .02, 0, '#e8e8f4', [.2, .2, .7], [Math.PI / 2, 0, 0]); b.put(g.oct, 0, .12, .17, '#ff9fd2', [.06, .09, .03]); for (const s of [-1, 1]) b.put(g.oct, s * .1, .08, .15, '#9fd8ff', [.035, .055, .02]); }],
  ['bow', 'head', '🎀', (b, g) => { for (const s of [-1, 1]) b.put(g.ball, s * .1, .06, .05, '#ff6fae', [.11, .07, .04], [0, 0, s * .4]); b.put(g.ball, 0, .06, .07, '#ff4f9a', .045); }],
  ['partyhat', 'head', '🥳', (b, g) => { b.put(g.cone, 0, .16, 0, '#5aa8ff', [.13, .32, .13]); for (let i = 0; i < 3; i++) b.put(g.tor, 0, .05 + i * .09, 0, ['#ffd23f', '#ff6fae', '#7fe0a0'][i], [.13 - i * .035, .13 - i * .035, .35], [Math.PI / 2, 0, 0]); b.put(g.ball, 0, .34, 0, '#ffd23f', .045); }],
  ['flowers', 'head', '🌸', (b, g) => { b.put(g.tor, 0, .03, 0, '#7fe0a0', [.2, .2, .45], [Math.PI / 2, 0, 0]); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, x = Math.sin(a) * .2, z = Math.cos(a) * .2; for (let q = 0; q < 5; q++) { const qa = q / 5 * Math.PI * 2; b.put(g.ball, x + Math.cos(qa) * .03, .06, z + Math.sin(qa) * .03, ['#ff9fd2', '#ffd23f', '#c9a6ff', '#ffffff', '#ff6fae', '#9fd8ff', '#ffb35c'][i], [.025, .018, .025]); } b.put(g.ball, x, .07, z, '#ffe36e', .018); } }],
  ['tophat', 'head', '🎩', (b, g) => { b.put(g.cyl, 0, .02, 0, '#3a2a5a', [.22, .03, .22]); b.put(g.cyl, 0, .14, 0, '#3a2a5a', [.13, .22, .13]); b.put(g.cyl, 0, .07, 0, '#ff6fae', [.135, .04, .135]); b.put(star(.04, .5, .02), .08, .1, .11, '#ffd23f'); }],
  ['starband', 'head', '⭐', (b, g) => { b.put(g.tor, 0, .02, 0, '#9b6cff', [.2, .2, .5], [Math.PI / 2, 0, 0]); for (const s of [-1, 1]) { b.put(g.cyl, s * .1, .14, .05, '#9b6cff', [.012, .2, .012], [0, 0, s * .25]); b.put(star(.06, .5, .03), s * .13, .25, .05, '#ffd23f'); } }],
  ['unicorn', 'head', '🦄', (b, g) => { b.put(g.cone, 0, .16, .12, '#fff3a6', [.05, .28, .05], [-.25, 0, 0]); for (let i = 0; i < 3; i++) b.put(g.tor, 0, .07 + i * .07, .135 - i * .02, '#ff9fd2', [.048 - i * .012, .048 - i * .012, .3], [Math.PI / 2 - .25, 0, 0]); }],
  ['helmet', 'head', '👩‍🚀', (b, g) => { b.put(g.tor, 0, -.32, 0, '#e8e8f4', [.36, .36, .6], [Math.PI / 2, 0, 0]); b.put(g.ball, 0, .05, -.05, '#dfe8ff', [.12, .07, .12]); b.put(g.cyl, .2, -.05, -.18, '#ff6a3c', [.03, .12, .03]); b.put(g.ball, .2, .03, -.18, '#ff6a3c', .035); }, { bubble: true }],
  // ---- face ----
  ['sunglasses', 'face', '😎', (b, g) => { for (const s of [-1, 1]) b.put(g.box, s * .17, 0, 0, '#1c1c2a', [.24, .14, .03]); b.put(g.box, 0, .03, 0, '#1c1c2a', [.12, .03, .03]); for (const s of [-1, 1]) b.put(g.box, s * .31, .02, -.12, '#1c1c2a', [.025, .025, .25]); }],
  ['heartglasses', 'face', '💗', (b, g) => glassesFrame(b, g, '#ff4f9a', '#ffc4e4', 'heart')],
  ['starglasses', 'face', '🌟', (b, g) => glassesFrame(b, g, '#ffd23f', '#fff6c8', 'star')],
  ['roundglasses', 'face', '👓', (b, g) => glassesFrame(b, g, '#5aa8ff', '#e8f6ff')],
  ['goggles', 'face', '🥽', (b, g) => { for (const s of [-1, 1]) { b.put(g.tor, s * .16, 0, 0, '#ff9a2e', [.12, .12, .8]); b.put(g.cyl, s * .16, 0, .01, '#9fe8ff', [.11, .02, .11], [Math.PI / 2, 0, 0]); } b.put(g.box, 0, 0, -.02, '#3a3a4a', [.62, .05, .04]); }],
  ['mask', 'face', '🎭', (b, g) => { for (const s of [-1, 1]) b.put(g.ball, s * .15, 0, 0, '#9b6cff', [.15, .1, .04]); b.put(g.box, 0, 0, 0, '#9b6cff', [.12, .07, .04]); for (const s of [-1, 1]) b.put(g.ball, s * .15, 0, .025, '#1c1c2a', [.07, .045, .02]); }],
  // ---- neck ----
  ['scarf', 'neck', '🧣', (b, g) => { b.put(g.tor, 0, 0, 0, '#ff6a3c', [.27, .27, .9], [Math.PI / 2, 0, 0]); b.put(g.box, .12, -.12, .22, '#ff6a3c', [.09, .22, .04], [0, 0, .15]); for (let i = 0; i < 3; i++) b.put(g.box, .13 + .005 * i, -.06 - i * .07, .245, '#ffd23f', [.09, .02, .005]); }],
  ['necklace', 'neck', '📿', (b, g) => { for (let i = 0; i < 16; i++) { const a = -Math.PI * .1 + i / 15 * Math.PI * 1.2, x = Math.sin(a - Math.PI * .5) * .24, z = Math.cos(a - Math.PI * .5) * .24; b.put(g.ball, x, -.03 - Math.sin(i / 15 * Math.PI) * .06, -z, '#fff6f0', .028); } b.put(heart(.06, .03), 0, -.12, .25, '#ff4f6a'); }],
  ['bowtie', 'neck', '🎀', (b, g) => { for (const s of [-1, 1]) b.put(g.cone, s * .07, -.02, .26, '#5aa8ff', [.06, .12, .04], [0, 0, s * Math.PI / 2]); b.put(g.ball, 0, -.02, .27, '#2f6fd0', .03); }],
  ['medal', 'neck', '🏅', (b, g) => { for (const s of [-1, 1]) b.put(g.box, s * .06, -.06, .24, '#5aa8ff', [.04, .14, .02], [0, 0, s * .3]); b.put(g.cyl, 0, -.16, .26, '#ffd23f', [.07, .02, .07], [Math.PI / 2, 0, 0]); b.put(star(.04, .5, .02), 0, -.16, .275, '#ff9a2e'); }],
  // ---- back ----
  ['wings', 'back', '🦋', (b, g) => { for (const s of [-1, 1]) { b.put(g.ball, s * .22, .1, -.02, '#c9a6ff', [.22, .16, .02], [0, s * .35, s * .5]); b.put(g.ball, s * .17, -.12, -.02, '#ff9fd2', [.14, .1, .02], [0, s * .35, -s * .4]); b.put(g.ball, s * .24, .12, 0, '#ffffff', [.06, .045, .02], [0, s * .35, s * .5]); } }, { flap: true }],
  ['cape', 'back', '🦸', (b, g) => { b.put(g.box, 0, -.12, -.04, '#ff4f6a', [.5, .5, .025], [.12, 0, 0]); b.put(g.box, 0, .13, .02, '#ffd23f', [.42, .04, .05]); b.put(star(.07, .5, .02), 0, -.1, -.06, '#ffd23f'); }],
  ['backpack', 'back', '🎒', (b, g) => { b.put(g.ball, 0, 0, -.08, '#7fe0a0', [.2, .22, .12]); b.put(g.ball, 0, -.06, -.18, '#5fd08a', [.12, .1, .05]); for (const s of [-1, 1]) b.put(g.tor, s * .13, .02, .04, '#3a8a5a', [.1, .16, .4], [0, Math.PI / 2, 0]); }],
  ['rocketpack', 'back', '🚀', (b, g) => { for (const s of [-1, 1]) { b.put(g.cyl, s * .09, 0, -.08, '#e8e8f4', [.07, .3, .07]); b.put(g.cone, s * .09, .2, -.08, '#ff4f6a', [.07, .1, .07]); b.put(g.cone, s * .09, -.2, -.08, '#ffd23f', [.05, .1, .05], [Math.PI, 0, 0]); } }],
];
export const SLOTS = [['head', '🎩'], ['face', '👓'], ['neck', '🧣'], ['back', '🦋']];
// special ones are found on the planets (planet id -> item); found items are kept in world.wearFound
export const FOUND = { moon: 'helmet', saturn: 'starband', pluto: 'flowers', neptune: 'wings', mars: 'rocketpack' };

const built = new Map(); let G0 = null;
function itemMesh(id) { if (built.has(id)) return built.get(id); const it = ITEMS.find(q => q[0] === id); if (!it) return null; G0 = G0 || G();
  const b = makeBatch(); it[3](b, G0); const m = b.mesh(shinyMat()); m.castShadow = true; m.userData.acc = id; m.userData.opts = it[4] || {};
  if (it[4] && it[4].bubble) { const gb = makeBatch(); gb.put(new THREE.SphereGeometry(.46, 24, 16), 0, 0, 0, '#dff4ff'); const glass = gb.mesh(glassMat(.22)); /* (the shared see-through material the game prepares at start: no shader pause) */ glass.position.y = -.32; m.add(glass); }
  built.set(id, m); return m; }
export const slotOf = id => (ITEMS.find(q => q[0] === id) || [])[1] || null;
export const fits = (kind, id) => { const sl = slotOf(id); return !!(sl && FIT[kind] && FIT[kind][sl]); };

// put on / take off: returns the worn objects; call again whenever the outfit changes (cheap: shared geometry)
export function wear(P, kind, outfit = {}) {
  if (!P || !P.B) return; const fit = FIT[kind]; if (!fit) return;
  P.worn = P.worn || {};
  for (const [slot] of SLOTS) { const want = outfit[slot] && fits(kind, outfit[slot]) ? outfit[slot] : null, have = P.worn[slot];
    if (have && have.userData.acc === want) continue;
    if (have) { have.parent && have.parent.remove(have); P.worn[slot] = null; }
    if (!want) continue; const src = itemMesh(want); if (!src) continue; const f = fit[slot], bone = P.B[f.b]; if (!bone) continue;
    const m = src.clone(); m.userData = { ...src.userData }; m.scale.setScalar(f.s || 1); m.rotation.set(f.rx || 0, f.ry || 0, f.rz || 0); attach(bone, m, f.p[0], f.p[1], f.p[2]); P.worn[slot] = m; }
}
// a little life: wings flap; the cape and scarf ends sway a bit when running (only what is worn, only while visible)
export function tickWorn(P, t, run = 0) { if (!P || !P.worn) return; const w = P.worn.back; if (w && w.userData.opts && w.userData.opts.flap) w.scale.x = (w.userData.s0 || (w.userData.s0 = w.scale.x)) * (1 + Math.sin(t * (6 + run * 8)) * .12); }
// a compact code for an outfit (for Play Together): "crown.sunglasses..wings" (head.face.neck.back)
export const outfitCode = o => SLOTS.map(([s]) => (o && o[s]) || '').join('.');
export const outfitFrom = code => { const o = {}; if (typeof code !== 'string' || code.length > 60) return o; code.split('.').forEach((id, i) => { if (id && ITEMS.some(q => q[0] === id && q[1] === SLOTS[i][0])) o[SLOTS[i][0]] = id; }); return o; };

// ---------- the DRESS-UP panel: pictures only (no reading), one tap to wear or take off ----------
// api: { world, save(), kinds: () => [[kind, pictureURL]], kind: () => current, setKind(k), rewear(), Sound, speak(text), spin(dx) }
export function initDressUp(api) {
  const css = `#dressPanel{position:fixed;left:max(10px,env(safe-area-inset-left));top:50%;transform:translateY(-50%) translateX(-110%);transition:transform .25s;z-index:31;width:min(48vw,440px);max-height:88vh;overflow-y:auto;background:linear-gradient(160deg,#fffdf6,#f2e8ff);border:5px solid #fff;border-radius:28px;padding:10px;box-shadow:0 10px 0 #47216c55,0 24px 50px #29104c88;display:grid;gap:8px;touch-action:pan-y}
#dressPanel.show{transform:translateY(-50%) translateX(0)}
#dressPanel .dRow{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
#dressPanel button{border:none;border-radius:18px;background:#fff;box-shadow:0 4px 0 #c9b6e8;min-width:62px;min-height:62px;font-size:34px;padding:4px;line-height:1}
#dressPanel button.on{background:#ffe36e;box-shadow:0 4px 0 #e0a800,0 0 0 4px #ff9fd2 inset}
#dressPanel button.no{opacity:.28}
#dressPanel .dKid img{width:54px;height:54px;border-radius:50%;display:block}
#dressPanel .dKid.on{background:#c9f0ff;box-shadow:0 4px 0 #5aa8ff,0 0 0 4px #5aa8ff inset}
#dressPanel .dTab{font-size:30px;min-width:56px;min-height:56px;background:#f4ecff}
#dressPanel .dTab.on{background:#c9a6ff}
#dressPanel .dDone{background:#7fe0a0;box-shadow:0 4px 0 #3a9a5a;font-size:36px;min-width:88px}
#dressSpin{position:fixed;right:0;top:0;bottom:0;width:50vw;z-index:30;display:none;touch-action:none}
#dressSpin.show{display:block}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const panel = document.createElement('div'); panel.id = 'dressPanel'; document.body.appendChild(panel);
  const spin = document.createElement('div'); spin.id = 'dressSpin'; document.body.appendChild(spin);
  let slot = 'head', lastX = null;
  const W = () => { const w = api.world; w.wear = w.wear || {}; w.wearFound = w.wearFound || {}; return w; };
  const outfit = () => { const w = W(), k = api.kind(); return (w.wear[k] = w.wear[k] || {}); };
  const found = id => { const locked = Object.values(FOUND).includes(id); return !locked || !!W().wearFound[id]; };
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  function render() {
    const k = api.kind(), o = outfit(); panel.innerHTML = '';
    const kids = document.createElement('div'); kids.className = 'dRow';
    for (const [kind, pic] of api.kinds()) { const b = document.createElement('button'); b.className = 'dKid' + (kind === k ? ' on' : ''); b.setAttribute('aria-label', kind); b.innerHTML = pic ? `<img src="${pic}" alt="">` : '❔'; tap(b, () => { api.setKind(kind); api.Sound && api.Sound.chime && api.Sound.chime(); render(); }); kids.appendChild(b); }
    panel.appendChild(kids);
    const tabs = document.createElement('div'); tabs.className = 'dRow';
    for (const [s, icon] of SLOTS) { const b = document.createElement('button'); b.className = 'dTab' + (s === slot ? ' on' : '') + (FIT[k] && FIT[k][s] ? '' : ' no'); b.textContent = icon; b.setAttribute('aria-label', s); tap(b, () => { if (!(FIT[k] && FIT[k][s])) { api.speak && api.speak('That one does not fit this friend. Try another!'); return; } slot = s; api.Sound && api.Sound.click && api.Sound.click(); render(); }); tabs.appendChild(b); }
    const off = document.createElement('button'); off.className = 'dTab'; off.textContent = '🧺'; off.setAttribute('aria-label', 'take everything off'); tap(off, () => { for (const [s] of SLOTS) delete o[s]; api.rewear(); api.save(); api.Sound && api.Sound.whoosh && api.Sound.whoosh(); render(); }); tabs.appendChild(off);
    panel.appendChild(tabs);
    const grid = document.createElement('div'); grid.className = 'dRow';
    for (const [id, s, icon] of ITEMS) { if (s !== slot) continue; const b = document.createElement('button'), have = found(id), ok = fits(k, id); b.className = (o[s] === id ? 'on' : '') + (ok ? '' : ' no'); b.textContent = have ? icon : '🎁'; b.setAttribute('aria-label', id);
      tap(b, () => { if (!have) { api.speak && api.speak('A surprise! Find it on a planet!'); api.Sound && api.Sound.twinkle && api.Sound.twinkle(); return; } if (!ok) return; if (o[s] === id) delete o[s]; else o[s] = id; api.rewear(); api.save(); api.Sound && api.Sound.tone && api.Sound.tone(o[s] ? 660 : 440, .12, 'triangle', .05, 1.4); render(); });
      grid.appendChild(b); }
    panel.appendChild(grid);
    const done = document.createElement('div'); done.className = 'dRow'; const d = document.createElement('button'); d.className = 'dDone'; d.textContent = '✓'; d.setAttribute('aria-label', 'done'); tap(d, close); done.appendChild(d); panel.appendChild(done);
  }
  function open() { render(); panel.classList.add('show'); spin.classList.add('show'); api.Sound && api.Sound.click && api.Sound.click(); api.speak && api.speak('Dress up! Tap a picture to wear it.'); }
  function close() { panel.classList.remove('show'); spin.classList.remove('show'); api.spin && api.spin(null); api.Sound && api.Sound.click && api.Sound.click(); }
  spin.addEventListener('pointerdown', e => { lastX = e.clientX; spin.setPointerCapture(e.pointerId); });
  spin.addEventListener('pointermove', e => { if (lastX == null) return; const dx = e.clientX - lastX; lastX = e.clientX; api.spin && api.spin(dx); });
  spin.addEventListener('pointerup', () => { lastX = null; });
  return { open, close, render, get isOpen() { return panel.classList.contains('show'); },
    find(planet) { const id = FOUND[planet]; if (!id) return null; const w = W(); if (w.wearFound[id]) return null; w.wearFound[id] = true; api.save(); return id; } };
}
