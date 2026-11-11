// ===================================================================
// creatures.js: Pip, Zuzu and Jelly as real 3D models built from smooth
// shapes, with shiny "toy" materials and procedural animation:
// walking, squash and stretch, springy ears/tail/antennae, blinking,
// turning to face where they walk, and a happy wiggle when tickled.
// Also the baby Fluffkins.
// ===================================================================
import * as THREE from 'three';
import { plushNormal, microNormal } from './nature.js';
import { buildCharacter, animateCharacter, setLids } from './characters.js';
import { plush, bipedSpec } from './critterkit.js';

export const CREATURES = {
  pip: { name: 'Pip', jump: [9.4, 8.2], body: '#f2c2ff' },
  zuzu: { name: 'Zuzu', jump: [9.6, 8.4], body: '#ffd84a' },
  jelly: { name: 'Jelly', jump: [9.8, 8.6], body: '#7ef0c8' },
};
// build 17: softer, less glassy "toy" surfaces with a fine grain (painted wood / soft vinyl, not wet plastic)
const toy = (color, o = {}) => new THREE.MeshPhysicalMaterial({
  normalMap: o.opacity != null || o.ei > .6 ? null : microNormal(), normalScale: new THREE.Vector2(.22, .22),
  color, roughness: Math.max(o.r ?? .5, .3), metalness: o.m ?? 0, clearcoat: (o.cc ?? .7) * .45, clearcoatRoughness: Math.max(o.ccr ?? .3, .3),
  sheen: o.sheen ?? 0, sheenColor: new THREE.Color(o.sheenColor ?? '#ffffff'), sheenRoughness: .5,
  emissive: new THREE.Color(o.em ?? '#000000'), emissiveIntensity: o.ei ?? 1,
  transparent: o.opacity != null, opacity: o.opacity ?? 1, iridescence: o.irid ?? 0, iridescenceIOR: 1.3,
});
export { toy, ball, face };
const SPH = new THREE.SphereGeometry(1, 32, 22);
const SPH_LO = new THREE.SphereGeometry(1, 16, 12);
function ball(mat, r, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, lo) {
  const m = new THREE.Mesh(lo ? SPH_LO : SPH, mat); m.scale.set(r * sx, r * sy, r * sz); m.position.set(x, y, z); m.castShadow = true; return m;
}
// a spring for wobbly parts
const spring = () => ({ x: 0, v: 0 });
function stepSpring(s, target, k, damp, dt) { s.v += (target - s.x) * k * dt; s.v *= Math.exp(-damp * dt); s.x += s.v * dt; return s.x; }

const EYE_WHITE = toy('#ffffff', { r: .2, cc: 1 }), IRIS = toy('#2a0f45', { r: .15, cc: 1 }), SHINE = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const MOUTH = new THREE.MeshStandardMaterial({ color: '#5a1a4a', roughness: .6 }), CHEEK = toy('#ff8fc4', { r: .6, cc: 0, opacity: .75 });
function makeEye(r, irisCol) {
  const g = new THREE.Group();
  const white = ball(EYE_WHITE, r, 0, 0, 0, 1, 1.15, .55); white.castShadow = false;
  const iris = ball(irisCol ? toy(irisCol, { r: .15, cc: 1 }) : IRIS, r * .72, 0, -r * .06, r * .32, 1, 1.12, .5); iris.castShadow = false;
  const pupil = ball(IRIS, r * .38, 0, -r * .06, r * .5, 1, 1.1, .4); pupil.castShadow = false;
  const s1 = ball(SHINE, r * .24, -r * .25, r * .28, r * .62); const s2 = ball(SHINE, r * .11, r * .22, -r * .3, r * .6);
  s1.castShadow = s2.castShadow = false;
  g.add(white, iris, pupil, s1, s2); return g;
}
function makeMouth(w) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(w, w * .22, 8, 20, Math.PI), MOUTH); m.rotation.z = Math.PI; return m;
}
function face(parent, { y, z, spread, eyeR, mouthY, irisCol, cheeks = true }) {
  const eyes = [-1, 1].map(s => { const e = makeEye(eyeR, irisCol); e.position.set(s * spread, y, z); e.rotation.y = s * .22; parent.add(e); return e; });
  const mouth = makeMouth(eyeR * .55); mouth.position.set(0, mouthY, z + .02); parent.add(mouth);
  if (cheeks) [-1, 1].forEach(s => { const c = ball(CHEEK, eyeR * .55, s * (spread + eyeR * .55), mouthY + eyeR * .2, z - .03, 1, .6, .3); c.castShadow = false; parent.add(c); });
  return { eyes, mouth };
}
// a glossy rounded star (Zuzu, star bits, decorations)
export function starShape(outer = 1, inner = .48, pts = 5) {
  const sh = new THREE.Shape();
  for (let i = 0; i < pts * 2; i++) { const a = Math.PI / 2 + i * Math.PI / pts, r = i % 2 ? inner : outer; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  sh.closePath(); return sh;
}
export function starGeometry(outer, inner, depth, bevel, seg = 3) {
  const g = new THREE.ExtrudeGeometry(starShape(outer, inner), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .9, bevelSegments: seg, curveSegments: 4 });
  g.center(); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- PIP
function buildPip(st) {
  const fur = toy(st.body || '#f2c2ff', { r: .55, cc: .35, sheen: 1, sheenColor: '#ffe6fb' });
  const cream = toy('#fff4fb', { r: .5, cc: .3, sheen: .8 }), pink = toy('#ff9fd2', { r: .5 });
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const torso = ball(fur, .42, 0, .6, 0, 1, 1.02, .92); body.add(torso);
  body.add(ball(cream, .3, 0, .56, .2, 1, 1.05, .7));
  const head = new THREE.Group(); head.position.set(0, 1.16, .02); body.add(head);
  head.add(ball(fur, .5, 0, 0, 0, 1.06, .95, .95));
  head.add(ball(cream, .26, 0, -.15, .33, 1.25, .8, .7)); // muzzle
  head.add(ball(pink, .055, 0, -.04, .5)); // nose
  const F = face(head, { y: .06, z: .38, spread: .19, eyeR: .14, mouthY: -.16, irisCol: '#7a3fd0' });
  // ears with pink insides (springy)
  const ears = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * .22, .36, -.04); piv.rotation.z = -s * .28; head.add(piv);
    const e = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .46, 6, 16), fur); e.position.y = .3; e.castShadow = true; piv.add(e);
    const inn = new THREE.Mesh(new THREE.CapsuleGeometry(.065, .36, 6, 12), pink); inn.position.set(0, .3, .06); piv.add(inn);
    return piv;
  });
  // flying goggles on the forehead
  const gold = toy('#ffc531', { r: .25, m: .6, cc: 1 }), lens = toy('#8fe3ff', { r: .05, opacity: .7, cc: 1 });
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.TorusGeometry(.1, .03, 10, 24), gold); r.position.set(s * .13, .3, .36); r.rotation.x = -.5; head.add(r); const l = ball(lens, .085, s * .13, .3, .36, 1, 1, .3); l.rotation.x = -.5; l.castShadow = false; head.add(l); });
  // arms / paws and feet
  const arms = [-1, 1].map(s => { const a = ball(fur, .13, s * .4, .62, .12, .9, 1.2, .9); body.add(a); return a; });
  const feet = [-1, 1].map(s => { const f = ball(cream, .15, s * .18, .1, .06, 1, .7, 1.35); root.add(f); return f; });
  // fairy wings (iridescent)
  const wingMat = toy('#e6f6ff', { r: .1, opacity: .7, irid: 1, cc: 1 });
  const wings = [-1, 1].map(s => { const piv = new THREE.Group(); piv.position.set(s * .2, .9, -.3); body.add(piv); const w = ball(wingMat, .3, s * .25, .12, 0, 1, .62, .12); w.rotation.z = s * .5; w.castShadow = false; piv.add(w); const w2 = ball(wingMat, .2, s * .22, -.2, 0, 1, .6, .1); w2.rotation.z = -s * .3; w2.castShadow = false; piv.add(w2); return piv; });
  // curly rainbow tail made of fluffy puffs
  const tail = new THREE.Group(); tail.position.set(0, .45, -.35); body.add(tail);
  const tcols = ['#ff7ab8', '#ffb35c', '#ffe066', '#7be08a', '#7fc8ff', '#b58cff'];
  const puffs = tcols.map((c, i) => { const p = ball(toy(c, { r: .5, sheen: 1 }), .16 - i * .012, 0, 0, 0); tail.add(p); return p; });
  return { root, body, head, F, ears, arms, feet, wings, tail, puffs, torso };
}
// --------------------------------------------------------------- ZUZU
function buildZuzu(st) {
  const gold = toy(st.body || '#ffd84a', { r: .3, cc: 1, em: '#ff9a2e', ei: .12 });
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const starM = new THREE.Mesh(starGeometry(.66, .38, .22, .14, 4), gold); starM.position.y = .98; starM.castShadow = true; body.add(starM);
  const head = new THREE.Group(); head.position.set(0, .98, .22); body.add(head);
  const F = face(head, { y: .06, z: .06, spread: .14, eyeR: .12, mouthY: -.13, irisCol: '#2f6fff' });
  // antenna with a glowing ball
  const ant = new THREE.Group(); ant.position.set(0, 1.58, 0); body.add(ant);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .3, 8), toy('#ffb35c')); stalk.position.y = .15; ant.add(stalk);
  const glowM = toy('#fff6b0', { em: '#ffe36e', ei: 1.4 }); ant.add(ball(glowM, .08, 0, .33, 0));
  const leg = toy('#ffb35c', { r: .35 });
  const feet = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .22, 4, 10), leg); l.position.set(s * .14, .3, 0); l.castShadow = true; body.add(l); const f = ball(toy('#ff7ab8', { r: .4 }), .12, s * .15, .09, .05, 1, .65, 1.3); root.add(f); return f; });
  // baby stars that orbit Zuzu
  const babyG = starGeometry(.12, .06, .05, .03, 2);
  const babies = ['#ff9fd2', '#9fe6ff', '#c9a6ff'].map(c => { const b = new THREE.Mesh(babyG, toy(c, { em: c, ei: .35 })); body.add(b); return b; });
  return { root, body, head, F, ears: [ant], arms: [], feet, wings: [], babies, starM };
}
// -------------------------------------------------------------- JELLY
function buildJelly(st) {
  const col = st.body || '#7ef0c8';
  const jm = toy(col, { r: .08, cc: 1, opacity: .82, irid: .5, em: col, ei: .08 });
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const geo = new THREE.SphereGeometry(.62, 40, 28); const base = geo.attributes.position.array.slice();
  const blob = new THREE.Mesh(geo, jm); blob.position.y = .58; blob.castShadow = true; body.add(blob);
  const core = ball(toy('#ffffff', { em: '#c9fff0', ei: .6, opacity: .5 }), .26, 0, .5, -.05); core.castShadow = false; body.add(core);
  const head = new THREE.Group(); head.position.set(0, .7, .5); body.add(head);
  const F = face(head, { y: .04, z: .04, spread: .18, eyeR: .135, mouthY: -.16, irisCol: '#1f8f6f' });
  const ants = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * .2, 1.12, .05); piv.rotation.z = -s * .3; body.add(piv);
    const st2 = new THREE.Mesh(new THREE.CylinderGeometry(.02, .028, .36, 8), jm); st2.position.y = .18; piv.add(st2);
    piv.add(ball(toy('#ff9fd2', { em: '#ff6fae', ei: .4 }), .075, 0, .38, 0)); return piv;
  });
  const frill = [0, 1, 2].map(i => { const f = ball(toy(['#ff9fd2', '#ffe066', '#9fe6ff'][i], { opacity: .9 }), .09, (i - 1) * .16, 1.16, -.12); body.add(f); return f; });
  return { root, body, head, F, ears: ants, arms: [], feet: [], wings: [], blob, base, frill };
}

export function makeCreature(kind, style = {}) {
  // build 14: a sculpted, skinned character on a real skeleton (characters.js)
  const P = buildCharacter(kind, style);
  const A = { t: Math.random() * 9, phase: 0, run: 0, squash: spring(), turn: 0, blink: 2, earS: spring(), ear2: spring(), tailS: spring(), react: 0, prevGround: true, prevVy: 0, idle: 0, act: null, actT: 0, lastStep: 0 };
  const SQ = { pip: .2, zuzu: .16, jelly: .5 }[kind], SQX = SQ * .6;
  function update(dt, s) {
    A.t += dt; const speed = Math.abs(s.vx || 0);
    A.run += ((s.grounded && !s.seated ? Math.min(1, speed / 5) : 0) - A.run) * Math.min(1, dt * 10);
    A.phase += dt * (kind === 'jelly' ? 9 : 10) * (s.grounded ? Math.min(1.2, speed / 5) : 0);
    // landing squash (bigger fall = bigger squish) and take-off stretch
    if (!A.prevGround && s.grounded && A.prevVy < -2) A.squash.v -= Math.min(18, -A.prevVy * 1.4);
    if (A.prevGround && !s.grounded && (s.vy || 0) > 3) A.squash.v += 9;
    A.prevGround = s.grounded; A.prevVy = s.vy || 0;
    if (kind === 'jelly' && A.run > .2) { const st = Math.floor(A.phase / Math.PI); if (st !== A.lastStep) { A.lastStep = st; A.squash.v -= 4.5 * A.run; } }
    // idle actions after standing still for a while
    if (A.run < .05 && s.grounded && !s.seated && !A.act) { A.idle += dt; if (A.idle > 4.5) { A.idle = 0; A.act = { pip: ['wave', 'look', 'hop'], zuzu: ['twirl', 'look', 'hop'], jelly: ['jiggle', 'look', 'hop'] }[kind][Math.floor(Math.random() * 3)]; A.actT = 0; } } else if (A.run > .05 || !s.grounded) A.idle = 0;
    if (A.act) { A.actT += dt; if (A.actT > 1.6) A.act = null; }
    const act = A.act, ak = A.actT;
    if (act === 'hop' && ak < .05) A.squash.v += 7;
    if (act === 'jiggle' && Math.floor(ak * 8) !== Math.floor((ak - dt) * 8)) A.squash.v += (Math.floor(ak * 8) % 2 ? 6 : -6);
    const sq = stepSpring(A.squash, 0, kind === 'jelly' ? 120 : 170, kind === 'jelly' ? 5 : 8, dt);
    const sy = 1 + sq * SQ, sx = 1 - sq * SQX;
    P.body.scale.set(Math.max(.5, sx), Math.max(.35, sy), Math.max(.5, sx));
    const r = A.react, hopY = r > 0 ? Math.sin((1 - r) * Math.PI) * .55 : 0, actHop = act === 'hop' ? Math.max(0, Math.sin(ak * 4)) * .35 : 0;
    // face the way you walk, but keep the face toward the camera
    const look = act === 'look' ? 0 : null;
    const target = look ?? ((s.facing || 1) * (A.run > .15 || !s.grounded ? 1.05 : .5)) + (r > 0 && kind !== 'jelly' ? (1 - r) * Math.PI * 2 : 0) + (act === 'twirl' ? ak / 1.6 * Math.PI * 2 : 0);
    A.turn += (target - A.turn) * Math.min(1, dt * (r > 0 || act === 'twirl' ? 20 : 9)); P.root.rotation.y = A.turn;
    P.body.position.y = hopY + actHop; P.body.rotation.z = -Math.sin(A.phase) * (kind === 'jelly' ? .08 : .03) * A.run;
    animateCharacter(kind, P, A, s, dt, { run: A.run, phase: A.phase, sq, r, act, ak, air: !s.grounded });
    A.react = Math.max(0, A.react - dt * 1.1);
  }
  return {
    kind, root: P.root, parts: P, update,
    tickle() { A.react = 1; A.act = null; A.idle = 0; A.squash.v += kind === 'jelly' ? -16 : 8; },
    cheer() { A.squash.v += 8; A.react = Math.max(A.react, .6); },
  };
}

// ----------------------------------------------------------- FLUFFKIN
const fluffGeo = (() => {
  const g = new THREE.IcosahedronGeometry(.3, 4), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const n = 1 + (Math.sin(v.x * 40) * Math.sin(v.y * 37) * Math.sin(v.z * 43)) * .06; v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
})();
export function makeFluff(color) {
  // build 14: a sculpted baby Fluffkin (round, fluffy, long ears) on a skeleton
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const k = plush(body, bipedSpec({ scale: .42, body: color, belly: '#fff6ee', headW: 1.1, ears: 'long', snout: 0, nose: '#ff6fae', tail: 'puff', bodyR: [.38, .36, .34], iris: '#7a3fd0', voxel: .035 }), { lid: color, iris: '#7a3fd0' });
  let t = Math.random() * 9;
  return {
    root, update(dt, mood = 'wait', facing = 0) {
      t += dt; const hop = Math.abs(Math.sin(t * (mood === 'follow' ? 9 : mood === 'sleep' ? 0 : 5))) * (mood === 'wait' ? .1 : mood === 'sleep' ? 0 : .22);
      body.position.y = hop; body.scale.set(1 + (mood === 'sleep' ? Math.sin(t * 2) * .03 : 0), 1 - hop * .3, 1);
      k.tick(dt, t, mood === 'follow');
      if (mood === 'sleep') k.eyes.forEach(e => setLids(e, 0, 0));
      k.B.earL.rotation.z = -.2 - Math.sin(t * 6) * .12; k.B.earR.rotation.z = .2 + Math.sin(t * 6) * .12;
      root.rotation.y += ((facing ? facing * .8 : Math.sin(t * .7) * .4) - root.rotation.y) * Math.min(1, dt * 6);
    },
  };
}
