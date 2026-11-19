// ===================================================================
// new-friends-2.js (build 102): FOUR MORE FRIENDS, the same hand-made way (one smooth sculpted body on a little skeleton,
// big shiny eyes, their own shape and way of moving); sculpted only when picked.
//   • GLIMMER: a soft lavender crystal friend with glowing crystal shards on its head and back; sparkles as it hops.
//   • POMPOM: a round fluffy ball on big floppy feet, with tiny arms and a tuft on top; bounces everywhere.
//   • BIBBLE: a tall bean with huge round dish ears and two curly antennae; waddles, ears flapping.
//   • COSMO: a tiny deep-blue cosmic friend painted with stars and a swirl, with a little planet ring round its middle.
// ===================================================================
import * as THREE from 'three';
import { registerFriend } from './characters.js';
import { CREATURES } from './creatures.js';
import { FIT } from './accessories.js';

const mixC = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const smile = (y, z, w = .07) => [{ type: 'limb', a: [-w, y + .02, z - .01], b: [0, y, z], ra: .013, rb: .013, carve: true, k: .013 }, { type: 'limb', a: [0, y, z], b: [w, y + .02, z - .01], ra: .013, rb: .013, carve: true, k: .013 }];
const smileInk = (y, z, col, w = .07) => [{ type: 'limb', a: [-w, y + .02, z - .005], b: [0, y, z + .005], ra: .018, rb: .018, color: col, soft: .008 }, { type: 'limb', a: [0, y, z + .005], b: [w, y + .02, z - .005], ra: .018, rb: .018, color: col, soft: .008 }];
const blush = (y, z, x = .24, col = '#ffa8c8') => [{ type: 'sphere', c: [x, y, z], r: .07, color: col, soft: .035 }, { type: 'sphere', c: [-x, y, z], r: .07, color: col, soft: .035 }];
const twoEyes = (P, B, h, bone, r, iris, x, y, z, ry = .25) => { P.eyes = [1, -1].map(sg => h.attach(B[bone], h.makeEye(r, iris, h.lidMat), sg * x, y, z)); P.eyes.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * ry; }); };
const walkLegs = (B, swing, run, air) => { if (B.legL) { B.legL.rotation.x = air ? -.4 : swing * .6 * run; B.legR.rotation.x = air ? -.4 : -swing * .6 * run; } };

// ---------------------------------------------------------------- GLIMMER (a crystal friend)
registerFriend('glimmer', {
  body: '#d9c2ff',
  spec(body) { const c = body, belly = mixC(body, '#ffffff', .5), dark = shade(body, .78);
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .42, 0] }, { name: 'spine', parent: 'hips', pos: [0, .66, 0] }, { name: 'head', parent: 'spine', pos: [0, .95, 0] },
      { name: 'armL', parent: 'spine', pos: [.3, .78, .04] }, { name: 'armR', parent: 'spine', pos: [-.3, .78, .04] },
      { name: 'legL', parent: 'hips', pos: [.15, .36, 0] }, { name: 'legR', parent: 'hips', pos: [-.15, .36, 0] }];
    const parts = [
      { type: 'ellipsoid', c: [0, .6, 0], r: [.34, .3, .3], bone: 'spine', color: c, k: .1 },
      { type: 'ellipsoid', c: [0, 1.08, .02], r: [.4, .36, .35], bone: 'head', color: c, k: .12 },
      { type: 'limb', a: [.28, .78, .04], b: [.42, .6, .1], ra: .07, rb: .06, bone: 'armL', color: c, k: .05 }, { type: 'limb', a: [-.28, .78, .04], b: [-.42, .6, .1], ra: .07, rb: .06, bone: 'armR', color: c, k: .05 },
      { type: 'limb', a: [.15, .38, 0], b: [.16, .1, .03], ra: .1, rb: .09, bone: 'legL', color: dark, k: .07 }, { type: 'limb', a: [-.15, .38, 0], b: [-.16, .1, .03], ra: .1, rb: .09, bone: 'legR', color: dark, k: .07 },
      ...smile(.94, .37)];
    const paints = [{ type: 'ellipsoid', c: [0, .58, .24], r: [.2, .2, .1], color: belly, soft: .05 }, ...blush(.98, .32, .23), ...smileInk(.94, .375, '#5a3a8a')];
    return { voxel: .023, bones, parts, paints }; },
  material: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .35, sheen: .6, sheenColor: new THREE.Color('#f6eeff'), clearcoat: .8, clearcoatRoughness: .2, iridescence: .5, iridescenceIOR: 1.4 }),
  face(P, B, h) { twoEyes(P, B, h, 'head', .12, '#8a4ae0', .15, 1.1, .3, .25); P.mouth = h.attach(B.head, h.makeMouth(.06), 0, .94, .38);
    // glowing crystal shards: a crest on the head and a row down the back (one shared material)
    const cm = new THREE.MeshPhysicalMaterial({ color: '#c9f4ff', emissive: '#9fe6ff', emissiveIntensity: .5, roughness: .05, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, transparent: true, opacity: .9 }), og = new THREE.OctahedronGeometry(1, 0);
    P.shards = [[0, 1.46, -.05, .1, .2, 0], [.14, 1.4, -.08, .07, .15, -.35], [-.14, 1.4, -.08, .07, .15, .35], [0, .92, -.32, .07, .14, -.6], [0, .72, -.32, .06, .12, -.7]].map(([x, y, z, w, hh, rx]) => { const m = new THREE.Mesh(og, cm); m.scale.set(w, hh, w); m.rotation.x = rx; m.castShadow = true; return h.attach(y > 1.2 ? B.head : B.spine, m, x, y, z); }); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, act, ak, air } = e, B = P.B, t = A.t, sin = Math.sin, swing = sin(phase);
    B.hips.position.y = B.hips.userData.rest.y + Math.abs(sin(phase)) * .07 * run; B.spine.rotation.z = sin(phase) * .05 * run;
    B.head.rotation.z = sin(t * 1.1) * .04 + (r > 0 ? sin(t * 24) * .15 * r : 0); B.head.rotation.y = act === 'look' ? sin(ak * 3) * .5 : 0; B.head.rotation.x = act === 'look' ? -.12 : 0;
    walkLegs(B, swing, run, air); B.armL.rotation.z = .15 + (air ? .7 : 0) + (r > 0 ? 1 : 0); B.armR.rotation.z = -.15 - (air ? .7 : 0) - (r > 0 ? 1 : 0) - (act === 'wave' ? 1.1 + sin(ak * 12) * .3 : 0);
    if (P.shards) P.shards.forEach((m, i) => { m.rotation.y = t * (r > 0 ? 4 : .5) + i; }); if (P.shards && P.shards[0]) P.shards[0].material.emissiveIntensity = .4 + Math.abs(sin(t * 2)) * .4 + r * .6; },
});

// ---------------------------------------------------------------- POMPOM (a fluffy ball on big feet)
registerFriend('pompom', {
  body: '#ffb35c',
  spec(body) { const c = body, light = mixC(body, '#fff4e0', .55), foot = mixC(body, '#ff6fae', .4);
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'body', parent: 'root', pos: [0, .62, 0] }, { name: 'tuft', parent: 'body', pos: [0, 1.08, 0] },
      { name: 'armL', parent: 'body', pos: [.44, .62, .06] }, { name: 'armR', parent: 'body', pos: [-.44, .62, .06] },
      { name: 'footL', parent: 'root', pos: [.2, .1, .06] }, { name: 'footR', parent: 'root', pos: [-.2, .1, .06] }];
    const parts = [
      { type: 'sphere', c: [0, .64, 0], r: .46, bone: 'body', color: c, k: .1 },
      { type: 'limb', a: [0, 1.04, -.02], b: [.05, 1.24, -.05], ra: .07, rb: .03, bone: 'tuft', color: c, k: .04 }, { type: 'limb', a: [0, 1.04, -.02], b: [-.08, 1.2, -.02], ra: .06, rb: .025, bone: 'tuft', color: c, k: .04 },
      { type: 'sphere', c: [.48, .6, .07], r: .075, bone: 'armL', color: c, k: .04 }, { type: 'sphere', c: [-.48, .6, .07], r: .075, bone: 'armR', color: c, k: .04 },
      { type: 'ellipsoid', c: [.2, .07, .1], r: [.15, .08, .22], bone: 'footL', color: foot, k: .05 }, { type: 'ellipsoid', c: [-.2, .07, .1], r: [.15, .08, .22], bone: 'footR', color: foot, k: .05 },
      { type: 'limb', a: [.2, .18, .03], b: [.2, .1, .06], ra: .06, rb: .06, bone: 'footL', color: c, k: .06 }, { type: 'limb', a: [-.2, .18, .03], b: [-.2, .1, .06], ra: .06, rb: .06, bone: 'footR', color: c, k: .06 },
      ...smile(.56, .45)];
    const paints = [{ type: 'ellipsoid', c: [0, .5, .3], r: [.25, .2, .14], color: light, soft: .06 }, ...blush(.62, .4, .26), ...smileInk(.56, .455, '#8a3a1a')];
    return { voxel: .024, bones, parts, paints }; },
  material: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .8, sheen: 1, sheenRoughness: .4, sheenColor: new THREE.Color('#fff2dc') }),
  face(P, B, h) { twoEyes(P, B, h, 'body', .13, '#d06a1a', .16, .74, .39, .26); P.mouth = h.attach(B.body, h.makeMouth(.065), 0, .56, .46); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, act, ak, air } = e, B = P.B, t = A.t, sin = Math.sin;
    const b = Math.abs(sin(phase)); B.body.position.y = B.body.userData.rest.y + b * .16 * run + (air ? .04 : 0); /* (bounces everywhere) */
    const sq = 1 + (1 - b) * .07 * run + sin(t * 2.2) * .02; B.body.scale.set(sq, 2 - sq, sq); B.body.rotation.z = sin(phase) * .06 * run + (r > 0 ? sin(t * 22) * .2 * r : 0);
    B.footL.rotation.x = air ? -.3 : sin(phase) * .6 * run; B.footR.rotation.x = air ? -.3 : -sin(phase) * .6 * run;
    B.armL.position.y = B.armL.userData.rest.y + (air || r > 0 ? .12 : 0) + sin(t * 2) * .02; B.armR.position.y = B.armR.userData.rest.y + (air || r > 0 ? .12 : 0) + (act === 'wave' ? .14 + sin(ak * 12) * .05 : 0);
    const tf = stepSpring(A.earS, -(s.vy || 0) * .05 - b * run * .3, 90, 4, dt); B.tuft.rotation.x = tf * .5 + sin(t * 3) * .1; B.tuft.rotation.z = sin(t * 2.4) * .12; },
});

// ---------------------------------------------------------------- BIBBLE (big round dish ears and curly antennae)
registerFriend('bibble', {
  body: '#7fe0c8',
  spec(body) { const c = body, inner = mixC(body, '#ff9fd2', .55), dark = shade(body, .75);
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .4, 0] }, { name: 'spine', parent: 'hips', pos: [0, .7, 0] }, { name: 'head', parent: 'spine', pos: [0, 1.0, 0] },
      { name: 'earL', parent: 'head', pos: [.4, 1.2, -.02] }, { name: 'earR', parent: 'head', pos: [-.4, 1.2, -.02] },
      { name: 'antL', parent: 'head', pos: [.08, 1.42, 0] }, { name: 'antR', parent: 'head', pos: [-.08, 1.42, 0] },
      { name: 'armL', parent: 'spine', pos: [.24, .78, .05] }, { name: 'armR', parent: 'spine', pos: [-.24, .78, .05] },
      { name: 'legL', parent: 'hips', pos: [.13, .34, 0] }, { name: 'legR', parent: 'hips', pos: [-.13, .34, 0] }];
    const parts = [
      { type: 'ellipsoid', c: [0, .72, 0], r: [.3, .42, .28], bone: 'spine', color: c, k: .12 },
      { type: 'ellipsoid', c: [0, 1.14, .02], r: [.32, .3, .3], bone: 'head', color: c, k: .12 },
      // the big round dish ears
      { type: 'ellipsoid', c: [.52, 1.24, -.02], r: [.06, .22, .22], bone: 'earL', color: c, k: .05 }, { type: 'ellipsoid', c: [-.52, 1.24, -.02], r: [.06, .22, .22], bone: 'earR', color: c, k: .05 },
      { type: 'limb', a: [.28, 1.18, -.02], b: [.48, 1.22, -.02], ra: .06, rb: .05, bone: 'earL', color: c, k: .05 }, { type: 'limb', a: [-.28, 1.18, -.02], b: [-.48, 1.22, -.02], ra: .06, rb: .05, bone: 'earR', color: c, k: .05 },
      // curly antennae
      { type: 'limb', a: [.08, 1.4, 0], b: [.14, 1.6, -.02], ra: .025, rb: .022, bone: 'antL', color: dark, k: .02 }, { type: 'limb', a: [.14, 1.6, -.02], b: [.24, 1.64, .02], ra: .022, rb: .02, bone: 'antL', color: dark, k: .02 }, { type: 'sphere', c: [.26, 1.62, .04], r: .05, bone: 'antL', color: '#ffd23f', k: .02 },
      { type: 'limb', a: [-.08, 1.4, 0], b: [-.14, 1.6, -.02], ra: .025, rb: .022, bone: 'antR', color: dark, k: .02 }, { type: 'limb', a: [-.14, 1.6, -.02], b: [-.24, 1.64, .02], ra: .022, rb: .02, bone: 'antR', color: dark, k: .02 }, { type: 'sphere', c: [-.26, 1.62, .04], r: .05, bone: 'antR', color: '#ffd23f', k: .02 },
      { type: 'limb', a: [.24, .8, .05], b: [.34, .58, .1], ra: .055, rb: .05, bone: 'armL', color: c, k: .05 }, { type: 'limb', a: [-.24, .8, .05], b: [-.34, .58, .1], ra: .055, rb: .05, bone: 'armR', color: c, k: .05 },
      { type: 'limb', a: [.13, .36, 0], b: [.15, .08, .04], ra: .085, rb: .08, bone: 'legL', color: dark, k: .06 }, { type: 'limb', a: [-.13, .36, 0], b: [-.15, .08, .04], ra: .085, rb: .08, bone: 'legR', color: dark, k: .06 },
      ...smile(1.02, .32, .06)];
    const paints = [{ type: 'ellipsoid', c: [.55, 1.24, .01], r: [.05, .17, .17], color: inner, soft: .03 }, { type: 'ellipsoid', c: [-.55, 1.24, .01], r: [.05, .17, .17], color: inner, soft: .03 },
      { type: 'ellipsoid', c: [0, .66, .22], r: [.18, .26, .1], color: mixC(body, '#ffffff', .5), soft: .05 }, ...blush(1.06, .27, .2), ...smileInk(1.02, .325, '#1f6a5a', .06)];
    return { voxel: .022, bones, parts, paints }; },
  material: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .6, sheen: .7, sheenColor: new THREE.Color('#eafff6'), clearcoat: .3 }),
  face(P, B, h) { twoEyes(P, B, h, 'head', .11, '#1f8f6f', .13, 1.16, .26, .24); P.mouth = h.attach(B.head, h.makeMouth(.055), 0, 1.02, .33); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, act, ak, air } = e, B = P.B, t = A.t, sin = Math.sin, swing = sin(phase);
    B.hips.position.y = B.hips.userData.rest.y + Math.abs(sin(phase)) * .04 * run; B.spine.rotation.z = sin(phase) * .1 * run; /* (a waddle) */
    B.head.rotation.z = -sin(phase) * .06 * run + sin(t * 1.2) * .04 + (r > 0 ? sin(t * 24) * .15 * r : 0); B.head.rotation.y = act === 'look' ? sin(ak * 3) * .5 : 0;
    walkLegs(B, swing, run, air); B.armL.rotation.z = .2 + (air ? .6 : 0) + (r > 0 ? .9 : 0); B.armR.rotation.z = -.2 - (air ? .6 : 0) - (r > 0 ? .9 : 0) - (act === 'wave' ? 1 + sin(ak * 12) * .3 : 0);
    const ear = stepSpring(A.earS, -(s.vy || 0) * .05 + run * .3 + (r > 0 ? sin(t * 22) * .6 : 0), 80, 5, dt);
    B.earL.rotation.z = -ear * .4 - sin(t * 2.4) * .06; B.earR.rotation.z = ear * .4 + sin(t * 2.4) * .06; /* (ears flap) */
    B.antL.rotation.z = -sin(t * 2.2) * .15; B.antR.rotation.z = sin(t * 2.2 + .8) * .15; },
});

// ---------------------------------------------------------------- COSMO (a tiny cosmic friend with a planet ring)
registerFriend('cosmo', {
  body: '#3a3a9a',
  spec(body) { const c = body, swirl = mixC(body, '#c9a6ff', .55), glow = '#9fe6ff';
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .4, 0] }, { name: 'body', parent: 'hips', pos: [0, .72, 0] },
      { name: 'armL', parent: 'body', pos: [.36, .7, .05] }, { name: 'armR', parent: 'body', pos: [-.36, .7, .05] },
      { name: 'legL', parent: 'hips', pos: [.12, .3, 0] }, { name: 'legR', parent: 'hips', pos: [-.12, .3, 0] }, { name: 'ant', parent: 'body', pos: [0, 1.15, 0] }];
    const parts = [
      { type: 'ellipsoid', c: [0, .78, 0], r: [.4, .42, .38], bone: 'body', color: c, k: .12 },
      { type: 'limb', a: [.34, .7, .05], b: [.46, .54, .1], ra: .065, rb: .055, bone: 'armL', color: c, k: .05 }, { type: 'limb', a: [-.34, .7, .05], b: [-.46, .54, .1], ra: .065, rb: .055, bone: 'armR', color: c, k: .05 },
      { type: 'limb', a: [.12, .34, 0], b: [.13, .08, .03], ra: .08, rb: .075, bone: 'legL', color: c, k: .06 }, { type: 'limb', a: [-.12, .34, 0], b: [-.13, .08, .03], ra: .08, rb: .075, bone: 'legR', color: c, k: .06 },
      { type: 'limb', a: [0, 1.15, 0], b: [0, 1.32, 0], ra: .02, rb: .018, bone: 'ant', color: swirl, k: .02 }, { type: 'sphere', c: [0, 1.36, 0], r: .055, bone: 'ant', color: glow, k: .02 },
      ...smile(.66, .38)];
    // painted stars and a soft swirl (a galaxy on its tummy)
    const stars = [[.22, 1.0, .3], [-.18, 1.06, .3], [.3, .7, .26], [-.32, .64, .24], [.05, 1.12, .25], [-.06, .46, .32], [.2, .44, .3]].map(([x, y, z]) => ({ type: 'sphere', c: [x, y, z], r: .028, color: '#ffffff', soft: .012 }));
    const paints = [...stars, { type: 'ellipsoid', c: [0, .56, .3], r: [.2, .12, .1], color: swirl, soft: .08 }, { type: 'ellipsoid', c: [.08, .62, .32], r: [.1, .05, .06], color: '#ff9fd2', soft: .06 }, ...blush(.7, .34, .22, '#ff8fc8'), ...smileInk(.66, .385, '#ffffff')];
    return { voxel: .023, bones, parts, paints }; },
  material: body => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .3, clearcoat: 1, clearcoatRoughness: .15, emissive: new THREE.Color(body), emissiveIntensity: .25, iridescence: .6, iridescenceIOR: 1.4 }),
  lid: body => mixC(body, '#ffffff', .2),
  face(P, B, h) { twoEyes(P, B, h, 'body', .125, '#ffd23f', .15, .86, .34, .26); P.mouth = h.attach(B.body, h.makeMouth(.06), 0, .66, .39);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.56, .035, 8, 40), new THREE.MeshPhysicalMaterial({ color: '#ffd23f', emissive: '#ffb000', emissiveIntensity: .45, roughness: .3, clearcoat: 1 })); ring.rotation.x = Math.PI / 2 - .25; ring.castShadow = true; P.ring = h.attach(B.body, ring, 0, .72, 0); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, act, ak, air } = e, B = P.B, t = A.t, sin = Math.sin, swing = sin(phase);
    B.hips.position.y = B.hips.userData.rest.y + .06 + sin(t * 2) * .04 + Math.abs(sin(phase)) * .04 * run; /* (bobs, as if floating in space) */
    B.body.rotation.z = sin(t * 1.3) * .05 + (r > 0 ? sin(t * 20) * .2 * r : 0); B.body.rotation.y = act === 'twirl' ? ak / 1.6 * Math.PI * 2 : 0;
    walkLegs(B, swing, run, air); B.armL.rotation.z = .2 + (air ? .7 : 0) + (r > 0 ? 1 : 0); B.armR.rotation.z = -.2 - (air ? .7 : 0) - (r > 0 ? 1 : 0) - (act === 'wave' ? 1 + sin(ak * 12) * .3 : 0);
    if (P.ring) { P.ring.rotation.z = t * (r > 0 ? 5 : .9); P.ring.rotation.x = Math.PI / 2 - .25 + sin(t * 1.4) * .08; }
    B.ant.rotation.z = sin(t * 2.6) * .15; },
});

Object.assign(CREATURES, {
  glimmer: { name: 'Glimmer', jump: [9.8, 8.6], body: '#d9c2ff', isNew: true },
  pompom: { name: 'Pompom', jump: [10.0, 8.8], body: '#ffb35c', isNew: true },
  bibble: { name: 'Bibble', jump: [9.6, 8.4], body: '#7fe0c8', isNew: true },
  cosmo: { name: 'Cosmo', jump: [10.1, 8.9], body: '#3a3a9a', isNew: true },
});
Object.assign(FIT, {
  glimmer: { head: { b: 'head', p: [0, 1.46, -.02], s: .95 }, face: { b: 'head', p: [0, 1.1, .4], s: .9 }, neck: { b: 'spine', p: [0, .88, .02], s: .95 }, back: { b: 'spine', p: [0, .7, -.3], s: .95 } },
  pompom: { head: { b: 'body', p: [0, 1.08, -.02], s: 1.05 }, face: { b: 'body', p: [0, .74, .5], s: 1.05 }, back: { b: 'body', p: [0, .66, -.46], s: 1.05 } },
  bibble: { head: { b: 'head', p: [0, 1.42, -.03], s: .85 }, face: { b: 'head', p: [0, 1.16, .36], s: .85 }, neck: { b: 'spine', p: [0, .96, .02], s: .85 }, back: { b: 'spine', p: [0, .76, -.28], s: .9 } },
  cosmo: { head: { b: 'body', p: [0, 1.18, -.02], s: .95 }, face: { b: 'body', p: [0, .86, .45], s: .95 }, back: { b: 'body', p: [0, .78, -.38], s: .95 } },
});
