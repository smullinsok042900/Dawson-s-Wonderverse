// ===================================================================
// characters.js: 3D build 14, Pip, Zuzu and Jelly REBUILT as proper
// characters: one seamless sculpted body each (sculpt.js) on a real
// skeleton, so arms, legs, ears, star points and feelers bend smoothly
// and always stay attached. Real eyes (white eyeball, patterned iris,
// glossy cornea that catches the light, eyelids that blink).
// Animation is driven bone by bone: walking legs and swinging arms,
// breathing, head turns, springy ears, wagging tail, waving, hopping,
// a wiggly tickle reaction, and squash and stretch on landing.
// ===================================================================
import * as THREE from 'three';
import { sculpt, makeSkeleton, attach, skin } from './sculpt.js';
import { plushNormal } from './nature.js';
import { addFur } from './fur.js';

const geoCache = new Map();
const cached = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const mixC = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

// ---------- eyes: eyeball + iris + glossy cornea + eyelids ----------
const irisTexCache = new Map();
function irisTexture(color) {
  if (irisTexCache.has(color)) return irisTexCache.get(color);
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
  // x = around the eye, y = from the pupil (top) out to the rim (bottom)
  const base = new THREE.Color(color), light = '#' + base.clone().lerp(new THREE.Color('#ffffff'), .45).getHexString(), dark = '#' + base.clone().multiplyScalar(.45).getHexString();
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#0b0614'); gr.addColorStop(.36, '#0b0614'); gr.addColorStop(.42, dark); gr.addColorStop(.6, light); gr.addColorStop(.85, color); gr.addColorStop(.93, dark); gr.addColorStop(1, '#1a0f2a');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 90; i++) { const x = Math.random() * 128; g.strokeStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '20,10,40'},${.12 + Math.random() * .18})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 26); g.lineTo(x + (Math.random() - .5) * 3, 54); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; irisTexCache.set(color, t); return t;
}
const SCLERA = new THREE.MeshPhysicalMaterial({ color: '#fbf8ff', roughness: .35, clearcoat: .4 });
const CORNEA = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0, metalness: 0, clearcoat: 1, clearcoatRoughness: 0, transparent: true, opacity: .18, depthWrite: false });
const SHINE = new THREE.MeshBasicMaterial({ color: '#ffffff' });
function makeEye(r, irisColor, lidMat) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(cached('eyeball', () => new THREE.SphereGeometry(1, 28, 20)), SCLERA); ball.scale.setScalar(r); g.add(ball);
  const iris = new THREE.Mesh(cached('iris', () => { const s = new THREE.SphereGeometry(1.012, 32, 10, 0, Math.PI * 2, 0, .78); s.rotateX(Math.PI / 2); return s; }), new THREE.MeshPhysicalMaterial({ map: irisTexture(irisColor), roughness: .3, clearcoat: .6 }));
  iris.scale.setScalar(r); g.add(iris);
  const cornea = new THREE.Mesh(cached('cornea', () => { const s = new THREE.SphereGeometry(1.05, 28, 12, 0, Math.PI * 2, 0, .9); s.rotateX(Math.PI / 2); return s; }), CORNEA); cornea.scale.setScalar(r); g.add(cornea);
  const s1 = new THREE.Mesh(cached('shine', () => new THREE.SphereGeometry(1, 10, 8)), SHINE); s1.scale.set(r * .2, r * .24, r * .06); s1.position.set(-r * .28, r * .3, r * .99); g.add(s1);
  const s2 = new THREE.Mesh(s1.geometry, SHINE); s2.scale.set(r * .09, r * .09, r * .04); s2.position.set(r * .25, -r * .22, r * 1.0); g.add(s2);
  // eyelids: an upper lid that slides down to blink (and half-closes when happy)
  const lidG = cached('lid', () => new THREE.SphereGeometry(1.09, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2));
  const upper = new THREE.Group(); g.add(upper); const lid = new THREE.Mesh(lidG, lidMat); lid.scale.setScalar(r); upper.add(lid);
  const lower = new THREE.Group(); g.add(lower); const lid2 = new THREE.Mesh(lidG, lidMat); lid2.scale.setScalar(r); lid2.rotation.x = Math.PI; lower.add(lid2);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  g.userData = { upper, lower, open: 1 };
  setLids(g, 1, 0);
  return g;
}
// open: 1 = wide open, 0 = closed. happy squints the lower lid up.
function setLids(eye, open, happy) {
  const U = eye.userData; U.upper.rotation.x = -1.3 * open + .34 * (1 - open) + happy * .25; U.lower.rotation.x = 1.3 - happy * .55;
}
// an open happy mouth (shown when laughing/tickled)
function makeMouth(w, lipMat) {
  const g = new THREE.Group();
  const inner = new THREE.Mesh(cached('mouthIn', () => { const s = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); return s; }), new THREE.MeshStandardMaterial({ color: '#5a1638', roughness: .6 }));
  inner.scale.set(w, w * .9, w * .4); g.add(inner);
  const tongue = new THREE.Mesh(cached('tongue', () => new THREE.SphereGeometry(1, 14, 10)), new THREE.MeshPhysicalMaterial({ color: '#ff7aa8', roughness: .4, clearcoat: .6 }));
  tongue.scale.set(w * .55, w * .3, w * .3); tongue.position.set(0, -w * .55, w * .05); g.add(tongue);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

// ---------------------------------------------------------------- PIP
// a fluffy fairy bunny: big head, round cheeks, long floppy-tipped ears,
// paws with pads, fluffy feet, goggles, fairy wings and a rainbow tail.
function pipSpec(body) {
  const fur = body, cream = '#fff3f8', pink = '#ff9fcc', deep = shade(body, .85);
  const bones = [
    { name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .5, 0] }, { name: 'spine', parent: 'hips', pos: [0, .78, 0] },
    { name: 'head', parent: 'spine', pos: [0, 1.06, .01] },
    { name: 'earL', parent: 'head', pos: [.16, 1.5, -.04] }, { name: 'earL2', parent: 'earL', pos: [.22, 1.8, -.07] },
    { name: 'earR', parent: 'head', pos: [-.16, 1.5, -.04] }, { name: 'earR2', parent: 'earR', pos: [-.22, 1.8, -.07] },
    { name: 'armL', parent: 'spine', pos: [.27, .92, .04] }, { name: 'handL', parent: 'armL', pos: [.42, .7, .1] },
    { name: 'armR', parent: 'spine', pos: [-.27, .92, .04] }, { name: 'handR', parent: 'armR', pos: [-.42, .7, .1] },
    { name: 'legL', parent: 'hips', pos: [.15, .44, 0] }, { name: 'footL', parent: 'legL', pos: [.16, .14, .03] },
    { name: 'legR', parent: 'hips', pos: [-.15, .44, 0] }, { name: 'footR', parent: 'legR', pos: [-.16, .14, .03] },
    { name: 'tail', parent: 'hips', pos: [0, .5, -.3] },
  ];
  const parts = [
    // body: a soft pear shape
    { type: 'ellipsoid', c: [0, .7, 0], r: [.34, .38, .31], bone: 'spine', color: fur, k: .08 },
    { type: 'ellipsoid', c: [0, .55, .01], r: [.33, .25, .3], bone: 'hips', color: fur, k: .1 },
    // head: round with chubby cheeks and a little muzzle
    { type: 'ellipsoid', c: [0, 1.2, .02], r: [.42, .38, .37], bone: 'head', color: fur, k: .12 },
    { type: 'ellipsoid', c: [.19, 1.08, .17], r: [.17, .13, .15], bone: 'head', color: fur, k: .1 },
    { type: 'ellipsoid', c: [-.19, 1.08, .17], r: [.17, .13, .15], bone: 'head', color: fur, k: .1 },
    { type: 'ellipsoid', c: [0, 1.08, .29], r: [.15, .1, .11], bone: 'head', color: cream, k: .08, soft: .02 },
    { type: 'ellipsoid', c: [0, 1.135, .385], r: [.055, .038, .035], bone: 'head', color: pink, k: .02, soft: .008, bare: true },
    // ears (two bones each so the tips flop)
    { type: 'limb', a: [.14, 1.45, -.03], b: [.21, 1.78, -.06], ra: .085, rb: .11, bone: 'earL', color: fur, k: .06 },
    { type: 'limb', a: [.21, 1.78, -.06], b: [.25, 2.0, -.08], ra: .11, rb: .07, bone: 'earL2', color: fur, k: .05 },
    { type: 'limb', a: [-.14, 1.45, -.03], b: [-.21, 1.78, -.06], ra: .085, rb: .11, bone: 'earR', color: fur, k: .06 },
    { type: 'limb', a: [-.21, 1.78, -.06], b: [-.25, 2.0, -.08], ra: .11, rb: .07, bone: 'earR2', color: fur, k: .05 },
    // arms with round paws
    { type: 'limb', a: [.25, .93, .03], b: [.4, .72, .09], ra: .085, rb: .07, bone: 'armL', color: fur, k: .06 },
    { type: 'sphere', c: [.43, .66, .11], r: .085, bone: 'handL', color: cream, k: .04 },
    { type: 'limb', a: [-.25, .93, .03], b: [-.4, .72, .09], ra: .085, rb: .07, bone: 'armR', color: fur, k: .06 },
    { type: 'sphere', c: [-.43, .66, .11], r: .085, bone: 'handR', color: cream, k: .04 },
    // legs and big fluffy feet
    { type: 'limb', a: [.15, .46, 0], b: [.16, .18, .02], ra: .12, rb: .1, bone: 'legL', color: fur, k: .08 },
    { type: 'ellipsoid', c: [.16, .07, .09], r: [.12, .075, .17], bone: 'footL', color: cream, k: .06 },
    { type: 'limb', a: [-.15, .46, 0], b: [-.16, .18, .02], ra: .12, rb: .1, bone: 'legR', color: fur, k: .08 },
    { type: 'ellipsoid', c: [-.16, .07, .09], r: [.12, .075, .17], bone: 'footR', color: cream, k: .06 },
    // a smile carved into the muzzle
    { type: 'limb', a: [-.06, 1.045, .375], b: [0, 1.025, .385], ra: .011, rb: .011, carve: true, k: .012 },
    { type: 'limb', a: [0, 1.025, .385], b: [.06, 1.045, .375], ra: .011, rb: .011, carve: true, k: .012 },
    { type: 'limb', a: [0, 1.1, .39], b: [0, 1.04, .39], ra: .008, rb: .008, carve: true, k: .01 },
  ];
  const paints = [
    { type: 'ellipsoid', c: [0, .64, .26], r: [.22, .27, .12], color: cream, soft: .04 },              // tummy
    { type: 'ellipsoid', c: [.19, 1.72, .02], r: [.05, .22, .06], color: pink, soft: .02 },            // inner ears
    { type: 'ellipsoid', c: [-.19, 1.72, .02], r: [.05, .22, .06], color: pink, soft: .02 },
    { type: 'ellipsoid', c: [.25, 1.05, .28], r: [.07, .05, .06], color: '#ff9ec8', soft: .035 },      // blush
    { type: 'ellipsoid', c: [-.25, 1.05, .28], r: [.07, .05, .06], color: '#ff9ec8', soft: .035 },
    { type: 'limb', a: [-.06, 1.045, .375], b: [0, 1.025, .385], ra: .016, rb: .016, color: '#7a2350', soft: .008 }, { type: 'limb', a: [0, 1.025, .385], b: [.06, 1.045, .375], ra: .016, rb: .016, color: '#7a2350', soft: .008 }, // smile line
    { type: 'ellipsoid', c: [.16, .015, .1], r: [.08, .03, .11], color: pink, soft: .015 },            // foot pads
    { type: 'ellipsoid', c: [-.16, .015, .1], r: [.08, .03, .11], color: pink, soft: .015 },
    { type: 'sphere', c: [0, 1.6, -.02], r: .12, color: deep, soft: .08 },                             // a darker tuft
  ];
  // a separate, slightly bigger head on a little neck: lift everything above the shoulders
  const HEAD = new Set(['head', 'earL', 'earL2', 'earR', 'earR2']), up = .09;
  for (const b of bones) if (HEAD.has(b.name)) b.pos = [b.pos[0], b.pos[1] + up, b.pos[2]];
  for (const p of [...parts, ...paints]) { if (p.carve || HEAD.has(p.bone) || (p.c && p.c[1] > 1.0) || (p.a && p.a[1] > 1.0)) { if (p.c) p.c = [p.c[0], p.c[1] + up, p.c[2]]; if (p.a) { p.a = [p.a[0], p.a[1] + up, p.a[2]]; p.b = [p.b[0], p.b[1] + up, p.b[2]]; } } }
  const head = parts.find(p => p.bone === 'head' && p.type === 'ellipsoid'); head.r = [.45, .41, .39]; head.k = .05;
  parts.push({ type: 'limb', a: [0, .98, 0], b: [0, 1.16, .01], ra: .17, rb: .2, bone: 'head', color: fur, k: .06 }); // neck
  return { voxel: .022, bones, parts, paints };
}
// ---------------------------------------------------------------- ZUZU
// a plump, puffy star: the lower points are its legs, the side points its
// arms, the top point a crest with a glowing antenna.
function zuzuSpec(body) {
  const gold = body, tip = mixC(body, '#ff9a2e', .45), cy = .95;
  const pt = (deg, len) => [Math.cos(deg * Math.PI / 180) * len, cy + Math.sin(deg * Math.PI / 180) * len, 0];
  const bones = [
    { name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .62, 0] }, { name: 'core', parent: 'hips', pos: [0, cy, 0] },
    { name: 'crest', parent: 'core', pos: [0, cy + .22, 0] }, { name: 'ant', parent: 'crest', pos: [0, cy + .62, 0] },
    { name: 'armL', parent: 'core', pos: pt(18, .22) }, { name: 'armR', parent: 'core', pos: pt(162, .22) },
    { name: 'legL', parent: 'hips', pos: pt(-54, .2) }, { name: 'legR', parent: 'hips', pos: pt(-126, .2) },
  ];
  const point = (deg, bone, len = .64) => ({ type: 'limb', a: pt(deg, .16), b: pt(deg, len), ra: .25, rb: .075, bone, color: gold, k: .14, wsoft: .06 });
  const parts = [
    { type: 'ellipsoid', c: [0, cy, 0], r: [.34, .34, .3], bone: 'core', color: gold, k: .14 },
    point(90, 'crest', .6), point(18, 'armL'), point(162, 'armR'), point(-54, 'legL', .66), point(-126, 'legR', .66),
    // tiny rounded tips so the points look soft
    { type: 'sphere', c: pt(90, .6), r: .07, bone: 'crest', color: tip, k: .05 },
    { type: 'sphere', c: pt(18, .64), r: .07, bone: 'armL', color: tip, k: .05 }, { type: 'sphere', c: pt(162, .64), r: .07, bone: 'armR', color: tip, k: .05 },
    { type: 'sphere', c: pt(-54, .66), r: .075, bone: 'legL', color: tip, k: .05 }, { type: 'sphere', c: pt(-126, .66), r: .075, bone: 'legR', color: tip, k: .05 },
    // the antenna stalk, part of the same body
    { type: 'limb', a: pt(90, .55), b: [0, cy + .9, -.02], ra: .025, rb: .018, bone: 'ant', color: tip, k: .03 },
    // a smile
    { type: 'limb', a: [-.075, cy - .085, .29], b: [0, cy - .115, .3], ra: .014, rb: .014, carve: true, k: .012 },
    { type: 'limb', a: [0, cy - .115, .3], b: [.075, cy - .085, .29], ra: .014, rb: .014, carve: true, k: .012 },
  ];
  const paints = [
    { type: 'sphere', c: [.2, cy - .05, .27], r: .06, color: '#ff9ec8', soft: .03 }, { type: 'sphere', c: [-.2, cy - .05, .27], r: .06, color: '#ff9ec8', soft: .03 },
    { type: 'limb', a: [-.075, cy - .085, .3], b: [0, cy - .115, .31], ra: .02, rb: .02, color: '#8a3a12', soft: .008 }, { type: 'limb', a: [0, cy - .115, .31], b: [.075, cy - .085, .3], ra: .02, rb: .02, color: '#8a3a12', soft: .008 },
    { type: 'ellipsoid', c: [0, cy - .02, .2], r: [.2, .2, .08], color: mixC(gold, '#ffffff', .25), soft: .08 },
  ];
  return { voxel: .021, bones, parts, paints };
}
// -------------------------------------------------------------- JELLY
// a wobbly see-through jelly with four little feet and two springy feelers.
function jellySpec(body) {
  const c = body, foot = shade(body, .82), tipC = '#ff8fc8';
  const ang = [45, 135, 225, 315].map(a => a * Math.PI / 180);
  const bones = [
    { name: 'root', pos: [0, 0, 0] }, { name: 'base', parent: 'root', pos: [0, .28, 0] }, { name: 'body', parent: 'base', pos: [0, .62, 0] }, { name: 'top', parent: 'body', pos: [0, .98, 0] },
    { name: 'antL', parent: 'top', pos: [.18, 1.08, .04] }, { name: 'antL2', parent: 'antL', pos: [.26, 1.34, .06] },
    { name: 'antR', parent: 'top', pos: [-.18, 1.08, .04] }, { name: 'antR2', parent: 'antR', pos: [-.26, 1.34, .06] },
    ...ang.map((a, i) => ({ name: 'foot' + i, parent: 'base', pos: [Math.cos(a) * .36, .2, Math.sin(a) * .36] })),
  ];
  const parts = [
    { type: 'ellipsoid', c: [0, .64, 0], r: [.58, .52, .54], bone: 'body', color: c, k: .18 },
    { type: 'ellipsoid', c: [0, .9, 0], r: [.42, .26, .4], bone: 'top', color: c, k: .2 },
    { type: 'ellipsoid', c: [0, .3, 0], r: [.6, .2, .58], bone: 'base', color: c, k: .2 },
    ...ang.map((a, i) => ({ type: 'limb', a: [Math.cos(a) * .32, .25, Math.sin(a) * .32], b: [Math.cos(a) * .52, .06, Math.sin(a) * .52], ra: .14, rb: .09, bone: 'foot' + i, color: foot, k: .1 })),
    { type: 'limb', a: [.16, 1.0, .03], b: [.25, 1.3, .06], ra: .03, rb: .022, bone: 'antL', color: c, k: .05 },
    { type: 'sphere', c: [.27, 1.37, .065], r: .075, bone: 'antL2', color: tipC, k: .03 },
    { type: 'limb', a: [-.16, 1.0, .03], b: [-.25, 1.3, .06], ra: .03, rb: .022, bone: 'antR', color: c, k: .05 },
    { type: 'sphere', c: [-.27, 1.37, .065], r: .075, bone: 'antR2', color: tipC, k: .03 },
    { type: 'limb', a: [-.08, .6, .535], b: [0, .575, .55], ra: .014, rb: .014, carve: true, k: .014 },
    { type: 'limb', a: [0, .575, .55], b: [.08, .6, .535], ra: .014, rb: .014, carve: true, k: .014 },
  ];
  const paints = [
    { type: 'sphere', c: [.24, .66, .48], r: .07, color: '#ff9ec8', soft: .035 }, { type: 'sphere', c: [-.24, .66, .48], r: .07, color: '#ff9ec8', soft: .035 },
    { type: 'limb', a: [-.08, .6, .54], b: [0, .575, .555], ra: .018, rb: .018, color: '#1d6a52', soft: .008 }, { type: 'limb', a: [0, .575, .555], b: [.08, .6, .54], ra: .018, rb: .018, color: '#1d6a52', soft: .008 },
  ];
  return { voxel: .025, bones, parts, paints };
}

// ---------------------------------------------------------------- build
export function buildCharacter(kind, style = {}) {
  const def = { pip: '#f2c2ff', zuzu: '#ffd84a', jelly: '#7ef0c8' }[kind], body = style.body || def;
  const spec = kind === 'pip' ? pipSpec(body) : kind === 'zuzu' ? zuzuSpec(body) : jellySpec(body);
  const geo = cached(kind + body, () => sculpt(spec));
  const sk = makeSkeleton(spec.bones), B = sk.bones;
  const mat = kind === 'pip' ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .78, sheen: 1, sheenRoughness: .45, sheenColor: new THREE.Color('#fff0fb'), normalMap: plushNormal(), normalScale: new THREE.Vector2(.45, .45) })
    : kind === 'zuzu' ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .28, metalness: .15, clearcoat: 1, clearcoatRoughness: .12, iridescence: .25, iridescenceIOR: 1.4, emissive: new THREE.Color(body).multiplyScalar(.08) })
      : new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .06, clearcoat: 1, clearcoatRoughness: .02, transparent: true, opacity: .84, iridescence: .6, iridescenceIOR: 1.35, emissive: new THREE.Color(body).multiplyScalar(.1), depthWrite: true });
  const mesh = new THREE.SkinnedMesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  mesh.add(sk.root); mesh.updateMatrixWorld(true); sk.skeleton.calculateInverses(); mesh.bind(sk.skeleton, mesh.matrixWorld); // (record the bind pose after the bones are in place)
  const root = new THREE.Group(), bodyG = new THREE.Group(); root.add(bodyG); bodyG.add(mesh);
  if (kind === 'pip') addFur(mesh, { shells: 9, length: .02, density: 250 }); // build 15: real fur
  const lidMat = new THREE.MeshPhysicalMaterial({ color: kind === 'jelly' ? shade(body, .9) : body, roughness: kind === 'pip' ? .8 : .3, sheen: kind === 'pip' ? 1 : 0, clearcoat: kind === 'pip' ? 0 : .8, transparent: kind === 'jelly', opacity: kind === 'jelly' ? .95 : 1 });
  const P = { root, body: bodyG, mesh, B, eyes: [], extras: {} };
  if (kind === 'pip') {
    P.eyes = [1, -1].map(s => attach(B.head, makeEye(.11, '#7a3fd0', lidMat), s * .16, 1.35, .32));
    P.eyes.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * .28; e.rotation.x = -.05; });
    P.mouth = attach(B.head, makeMouth(.07), 0, 1.125, .375);
    // flying goggles on the forehead
    const gold = new THREE.MeshPhysicalMaterial({ color: '#ffc531', roughness: .22, metalness: .85, clearcoat: 1 }), lens = new THREE.MeshPhysicalMaterial({ color: '#9fe8ff', roughness: .02, transparent: true, opacity: .55, clearcoat: 1, iridescence: .7 });
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.085, .025, 12, 28), gold); r.rotation.x = -.6; attach(B.head, r, s * .125, 1.56, .3); const l = new THREE.Mesh(new THREE.SphereGeometry(.075, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lens); l.rotation.x = Math.PI / 2 - .6; attach(B.head, l, s * .125, 1.56, .3); }
    { const br = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .09, 10), gold); br.rotation.z = Math.PI / 2; attach(B.head, br, 0, 1.56, .33); }
    // fairy wings: thin iridescent membranes with veins
    const wc = document.createElement('canvas'); wc.width = wc.height = 128; const wg = wc.getContext('2d'); const wgr = wg.createRadialGradient(20, 64, 4, 40, 64, 120); wgr.addColorStop(0, 'rgba(255,255,255,.95)'); wgr.addColorStop(1, 'rgba(210,235,255,.55)'); wg.fillStyle = wgr; wg.fillRect(0, 0, 128, 128); wg.strokeStyle = 'rgba(160,140,255,.7)'; wg.lineWidth = 2; for (let i = 0; i < 6; i++) { wg.beginPath(); wg.moveTo(0, 64); wg.quadraticCurveTo(60, 64 + (i - 2.5) * 10, 128, 64 + (i - 2.5) * 30); wg.stroke(); }
    const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
    const wm = new THREE.MeshPhysicalMaterial({ map: wt, transparent: true, side: THREE.DoubleSide, roughness: .15, iridescence: 1, iridescenceIOR: 1.5, depthWrite: false });
    const wingShape = (big) => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.15 * big, .35 * big, .55 * big, .45 * big, .62 * big, .2 * big); sh.bezierCurveTo(.66 * big, 0, .4 * big, -.08 * big, 0, 0); const g = new THREE.ShapeGeometry(sh, 16); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (.66 * big), .5 + p.getY(i) / (.9 * big)); return g; };
    P.wings = [1, -1].map(s => { const piv = new THREE.Group(); attach(B.spine, piv, s * .12, .9, -.25); for (const [big, rz] of [[1, .25], [.62, -.55]]) { const w = new THREE.Mesh(wingShape(big), wm); w.rotation.z = rz; w.scale.x = s; w.castShadow = false; piv.add(w); } piv.rotation.y = s * -.5; return piv; });
    // the rainbow tail: soft fluffy puffs on the tail bone
    const tcols = ['#ff7ab8', '#ffb35c', '#ffe066', '#7be08a', '#7fc8ff', '#b58cff'];
    const puffG = new THREE.IcosahedronGeometry(1, 3); { const p = puffG.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + Math.sin(v.x * 9) * Math.sin(v.y * 8) * Math.sin(v.z * 10) * .08); p.setXYZ(i, v.x, v.y, v.z); } puffG.computeVertexNormals(); }
    P.puffs = tcols.map((c, i) => { const m = new THREE.Mesh(puffG, new THREE.MeshPhysicalMaterial({ color: c, roughness: .8, sheen: 1, sheenColor: new THREE.Color('#ffffff'), normalMap: plushNormal(), normalScale: new THREE.Vector2(.5, .5) })); m.scale.setScalar(.13 - i * .012); m.castShadow = true; attach(B.tail, m, 0, .5, -.3); return m; });
  } else if (kind === 'zuzu') {
    P.eyes = [1, -1].map(s => attach(B.core, makeEye(.1, '#2f6fff', lidMat), s * .12, 1.0, .25));
    P.eyes.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * .22; });
    P.mouth = attach(B.core, makeMouth(.06), 0, .84, .3);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.075, 20, 14), new THREE.MeshPhysicalMaterial({ color: '#fff6b0', emissive: '#ffe36e', emissiveIntensity: 1.6, roughness: .2, clearcoat: 1 })); attach(B.ant, glow, 0, .95 + .92, -.02);
    // baby stars that orbit Zuzu
    const sg = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .055 : .12; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: true, bevelThickness: .025, bevelSize: .02, bevelSegments: 3, curveSegments: 3 }); g.center(); return g; })();
    P.babies = ['#ff9fd2', '#9fe6ff', '#c9a6ff'].map(c => { const b = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: .3, roughness: .25, clearcoat: 1 })); bodyG.add(b); return b; });
  } else {
    P.eyes = [1, -1].map(s => attach(B.body, makeEye(.12, '#1f8f6f', lidMat), s * .18, .72, .47));
    P.eyes.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * .25; });
    P.mouth = attach(B.body, makeMouth(.07), 0, .58, .55);
    // a glowing heart-shaped core you can see through the jelly
    const core = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#c9fff0', emissiveIntensity: .7, transparent: true, opacity: .55 })); attach(B.body, core, 0, .6, -.08); P.core = core;
  }
  P.mouth.scale.setScalar(.001);
  root.traverse(o => { if (o.isMesh) o.userData.creature = true; });
  return P;
}

// ---------------------------------------------------------------- animation
const spring = () => ({ x: 0, v: 0 });
function stepSpring(s, target, k, damp, dt) { s.v += (target - s.x) * k * dt; s.v *= Math.exp(-damp * dt); s.x += s.v * dt; return s.x; }

export function animateCharacter(kind, P, A, s, dt, extra) {
  const { run, phase, sq, r, act, ak, air } = extra, B = P.B, sin = Math.sin, t = A.t;
  const swing = sin(phase), lift = Math.max(0, Math.cos(phase));
  const breathe = sin(t * 2.2);
  if (kind === 'pip') {
    B.hips.position.y = B.hips.userData.rest.y + Math.abs(sin(phase)) * .03 * run;
    B.hips.rotation.y = swing * .12 * run; B.spine.rotation.y = -swing * .1 * run;
    B.spine.rotation.x = run * .12 + (air ? -.1 : 0); B.spine.scale.set(1 + breathe * .015, 1 + breathe * .02, 1 + breathe * .015);
    B.head.rotation.x = -run * .1 + sin(t * 1.3) * .03 + (act === 'look' ? -.15 : 0); B.head.rotation.z = sin(t * .9) * .04 + (r > 0 ? sin(t * 30) * .15 * r : 0);
    B.head.rotation.y = act === 'look' ? sin(ak * 3) * .6 : swing * .06 * run;
    // legs walk; feet stay flat; tuck when jumping
    for (const [leg, foot, sgn] of [[B.legL, B.footL, 1], [B.legR, B.footR, -1]]) {
      const ph = swing * sgn; leg.rotation.x = air ? -.55 : ph * .6 * run; foot.rotation.x = air ? .5 : -ph * .5 * run + (sgn * Math.cos(phase) > 0 ? -.3 * run : 0);
    }
    // arms swing opposite the legs; wave; reach up when happy
    const wave = act === 'wave';
    B.armL.rotation.x = -swing * .7 * run; B.armR.rotation.x = swing * .7 * run;
    B.armL.rotation.z = .1 + (air ? .9 : 0) + (r > 0 ? 1.4 : 0) + breathe * .03;
    B.armR.rotation.z = -.1 - (air ? .9 : 0) - (r > 0 ? 1.4 : 0) - (wave ? 2.3 + sin(ak * 14) * .35 : 0) - breathe * .03;
    B.handR.rotation.z = wave ? sin(ak * 14) * .4 : 0;
    // springy ears: the tips flop after the base
    const ear = stepSpring(A.earS, -(s.vy || 0) * .04 - sq * .6 + (r > 0 ? sin(t * 25) * .6 : 0), 110, 6, dt), ear2 = stepSpring(A.ear2, ear * 1.4, 70, 5, dt);
    for (const [e1, e2, sgn] of [[B.earL, B.earL2, 1], [B.earR, B.earR2, -1]]) { e1.rotation.x = ear * .5 + sin(t * 2.5 + sgn) * .04; e1.rotation.z = sgn * ear * .25 - sgn * .05; e2.rotation.x = ear2 * .6 + .1; e2.rotation.z = sgn * (.15 + ear2 * .2); }
    const tw = stepSpring(A.tailS, -(s.vx || 0) * .06 * (s.facing || 1) + (r > 0 ? sin(t * 20) : 0), 90, 5, dt);
    B.tail.rotation.y = tw * .4 + sin(t * 3) * .15; B.tail.rotation.x = -.2;
    P.puffs.forEach((p, i) => { const sway = tw * .02 * i + sin(t * 3 + i * .6) * .008 * i; p.position.set(sway, .02 + i * .035 + Math.sin(i * .9) * .02, -.05 - i * .03 + Math.max(0, i - 3) * .02); }); // a short curl up the back
    P.wings.forEach((w, i) => { const fast = air || r > 0; w.rotation.y = (i ? 1 : -1) * -(.5 + sin(t * (fast ? 26 : 3.5)) * (fast ? .6 : .12)); });
  } else if (kind === 'zuzu') {
    B.hips.position.y = B.hips.userData.rest.y + Math.abs(sin(phase)) * .04 * run;
    B.core.rotation.z = sin(phase) * .08 * run + sin(t * 2) * .05 + (r > 0 ? sin(t * 22) * .2 * r : 0); B.core.rotation.x = run * .1;
    B.core.scale.setScalar(1 + breathe * .02);
    B.legL.rotation.x = air ? -.4 : swing * .55 * run; B.legR.rotation.x = air ? -.4 : -swing * .55 * run;
    B.legL.rotation.z = air ? .3 : 0; B.legR.rotation.z = air ? -.3 : 0;
    const wave = act === 'wave' || act === 'twirl';
    B.armL.rotation.z = .1 + (air ? .5 : 0) + (r > 0 ? .7 : 0) + sin(t * 2.3) * .05; B.armR.rotation.z = -.1 - (air ? .5 : 0) - (r > 0 ? .7 : 0) - (wave ? .8 + sin(ak * 12) * .3 : 0);
    B.armL.rotation.x = -swing * .4 * run; B.armR.rotation.x = swing * .4 * run;
    const ant = stepSpring(A.earS, -(s.vy || 0) * .04 - sq * .6 + (r > 0 ? sin(t * 25) * .6 : 0), 120, 6, dt);
    B.crest.rotation.x = ant * .3; B.ant.rotation.x = ant * .7 + sin(t * 3) * .1; B.ant.rotation.z = sin(t * 2.2) * .15;
    P.babies.forEach((b, i) => { const a = t * (r > 0 ? 7 : 2) + i * 2.1; b.position.set(Math.cos(a) * .78, 1.05 + sin(a * 1.3) * .25, sin(a) * .55); b.rotation.z = t * 3; });
  } else {
    // Jelly: everything wobbles a little behind everything else
    const wob = stepSpring(A.tailS, -(s.vx || 0) * .05 + (r > 0 ? sin(t * 18) * 1.2 : 0), 60, 3, dt);
    B.body.rotation.z = wob * .15 + sin(t * 3) * .03; B.body.rotation.x = run * .08;
    B.top.rotation.z = wob * .3 + sin(t * 3.2 + 1) * .05; B.top.position.x = B.top.userData.rest.x + wob * .03;
    const jig = 1 + breathe * .03 + sin(t * 7) * .015 * (1 + run);
    B.body.scale.set(jig, 2 - jig, jig);
    const ant = stepSpring(A.earS, -(s.vy || 0) * .05 - sq * .8 + (r > 0 ? sin(t * 25) * .8 : 0), 90, 4, dt), ant2 = stepSpring(A.ear2, ant * 1.3, 60, 4, dt);
    for (const [a1, a2, sgn] of [[B.antL, B.antL2, 1], [B.antR, B.antR2, -1]]) { a1.rotation.x = ant * .5 + sin(t * 2 + sgn) * .06; a1.rotation.z = -sgn * ant * .2; a2.rotation.x = ant2 * .6; }
    for (let i = 0; i < 4; i++) { const f = B['foot' + i], ph = phase + (i % 2 ? Math.PI : 0); f.rotation.x = sin(ph) * .4 * run; f.position.y = f.userData.rest.y + Math.max(0, sin(ph)) * .06 * run; }
    if (P.core) P.core.scale.setScalar(1 + sin(t * 3) * .08 + r * .3);
  }
  // eyes: blink, happy squint, look a little toward where you're going
  A.blink -= dt; const closed = A.blink < .12; if (A.blink < 0) A.blink = 2 + Math.random() * 3;
  const happy = (s.happy > 0 || r > 0) ? 1 : 0;
  P.eyes.forEach(e => setLids(e, closed ? 0 : 1 - happy * .25, happy));
  const ms = happy ? 1 : act ? .55 : .001; P.mouth.scale.setScalar(P.mouth.scale.x + (ms - P.mouth.scale.x) * Math.min(1, dt * 10));
}
export { spring, stepSpring };
export { pipSpec, zuzuSpec, jellySpec, makeEye, setLids, makeMouth };
