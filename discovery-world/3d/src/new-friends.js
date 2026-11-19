// ===================================================================
// new-friends.js (build 101): MORE PLAYABLE FRIENDS, in the same hand-made style as Pip, Zuzu, Jelly and Sprout: each one a
// single smooth sculpted body on its own little skeleton (sculpt.js), with the same big shiny eyes, its own shape and its
// own way of moving. They are only sculpted when someone picks them (nothing is made at start-up).
//   • PUFFLE: a little cloud that floats instead of walking, with dangling raindrop feet and cloud-puff arms.
//   • LUNA: a round sleepy-happy moon with soft craters, a tiny star on an antenna and a crescent tail; hops softly.
//   • BLOOP: a squishy rainbow gumdrop with a curl on top; squishes and bounces as it goes.
//   • ZIP: a glowing comet with a long swept tail that streams behind it; leans into its zooms.
// ===================================================================
import * as THREE from 'three';
import { registerFriend } from './characters.js';
import { CREATURES } from './creatures.js';
import { FIT } from './accessories.js';

const mixC = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const smile = (y, z, w = .07) => [{ type: 'limb', a: [-w, y + .02, z - .01], b: [0, y, z], ra: .013, rb: .013, carve: true, k: .013 }, { type: 'limb', a: [0, y, z], b: [w, y + .02, z - .01], ra: .013, rb: .013, carve: true, k: .013 }];
const smileInk = (y, z, col, w = .07) => [{ type: 'limb', a: [-w, y + .02, z - .005], b: [0, y, z + .005], ra: .018, rb: .018, color: col, soft: .008 }, { type: 'limb', a: [0, y, z + .005], b: [w, y + .02, z - .005], ra: .018, rb: .018, color: col, soft: .008 }];
const blush = (y, z, x = .24) => [{ type: 'sphere', c: [x, y, z], r: .07, color: '#ffa8c8', soft: .035 }, { type: 'sphere', c: [-x, y, z], r: .07, color: '#ffa8c8', soft: .035 }];
const twoEyes = (P, B, h, bone, r, iris, x, y, z, ry = .25) => { P.eyes = [1, -1].map(sg => h.attach(B[bone], h.makeEye(r, iris, h.lidMat), sg * x, y, z)); P.eyes.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * ry; }); };

// ---------------------------------------------------------------- PUFFLE (a little cloud)
registerFriend('puffle', {
  body: '#f4f8ff',
  spec(body) { const c = body, under = mixC(body, '#bcd2ff', .45), drop = '#7fc8ff';
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'body', parent: 'root', pos: [0, .62, 0] }, { name: 'top', parent: 'body', pos: [0, .95, 0] },
      { name: 'armL', parent: 'body', pos: [.42, .66, .05] }, { name: 'armR', parent: 'body', pos: [-.42, .66, .05] },
      { name: 'dropL', parent: 'body', pos: [.16, .32, .05] }, { name: 'dropR', parent: 'body', pos: [-.16, .32, .05] }];
    const parts = [
      { type: 'ellipsoid', c: [0, .68, 0], r: [.44, .36, .38], bone: 'body', color: c, k: .14 },
      { type: 'sphere', c: [.28, .78, -.02], r: .25, bone: 'body', color: c, k: .12 }, { type: 'sphere', c: [-.28, .78, -.02], r: .25, bone: 'body', color: c, k: .12 },
      { type: 'sphere', c: [.1, .98, -.03], r: .26, bone: 'top', color: c, k: .12 }, { type: 'sphere', c: [-.14, 1.0, -.06], r: .22, bone: 'top', color: c, k: .12 },
      { type: 'sphere', c: [0, .5, .02], r: .3, bone: 'body', color: under, k: .12 },
      { type: 'sphere', c: [.46, .66, .06], r: .12, bone: 'armL', color: c, k: .06 }, { type: 'sphere', c: [-.46, .66, .06], r: .12, bone: 'armR', color: c, k: .06 },
      { type: 'limb', a: [.16, .34, .05], b: [.16, .22, .05], ra: .012, rb: .01, bone: 'dropL', color: under, k: .02 }, { type: 'ellipsoid', c: [.16, .17, .05], r: [.06, .08, .06], bone: 'dropL', color: drop, k: .02 },
      { type: 'limb', a: [-.16, .34, .05], b: [-.16, .22, .05], ra: .012, rb: .01, bone: 'dropR', color: under, k: .02 }, { type: 'ellipsoid', c: [-.16, .17, .05], r: [.06, .08, .06], bone: 'dropR', color: drop, k: .02 },
      ...smile(.6, .4)];
    const paints = [...blush(.66, .37, .26), ...smileInk(.6, .405, '#5a6a9a'), { type: 'sphere', c: [.12, 1.12, .1], r: .07, color: '#ffffff', soft: .05 }];
    return { voxel: .024, bones, parts, paints }; },
  material: body => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .85, sheen: 1, sheenRoughness: .6, sheenColor: new THREE.Color('#ffffff'), emissive: new THREE.Color(body), emissiveIntensity: .06 }),
  face(P, B, h) { twoEyes(P, B, h, 'body', .11, '#4a8aff', .15, .75, .37, .22); P.mouth = h.attach(B.body, h.makeMouth(.06), 0, .6, .41); },
  animate(P, A, s, dt, e, stepSpring) { const { run, r, act, ak, air } = e, B = P.B, t = A.t, sin = Math.sin;
    B.body.position.y = B.body.userData.rest.y + .18 + sin(t * 2.2) * .06 + (air ? .05 : 0); /* (floats above the ground) */
    B.body.rotation.z = -(s.vx || 0) * .03 * (s.facing || 1) + sin(t * 1.4) * .04 + (r > 0 ? sin(t * 22) * .2 * r : 0); B.body.rotation.x = run * .15;
    B.top.rotation.z = sin(t * 1.7) * .06; B.body.scale.set(1 + sin(t * 2.2) * .02, 1 - sin(t * 2.2) * .02, 1 + sin(t * 2.2) * .02);
    const wave = act === 'twirl' || act === 'wave'; B.armL.position.y = B.armL.userData.rest.y + sin(t * 2 + 1) * .03; B.armR.position.y = B.armR.userData.rest.y + sin(t * 2) * .03 + (wave ? .12 + sin(ak * 12) * .06 : 0) + (r > 0 ? .15 : 0);
    const sw = stepSpring(A.tailS, -(s.vx || 0) * .08 * (s.facing || 1), 50, 3, dt); B.dropL.rotation.x = sw * .6 + sin(t * 3) * .1; B.dropR.rotation.x = sw * .6 + sin(t * 3 + 1) * .1; },
});

// ---------------------------------------------------------------- LUNA (a little moon)
registerFriend('luna', {
  body: '#fff1b8',
  spec(body) { const c = body, crater = shade(body, .82), cheek = '#ffb8c8', leg = mixC(body, '#c9a6ff', .35);
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .38, 0] }, { name: 'head', parent: 'hips', pos: [0, .8, 0] },
      { name: 'ant', parent: 'head', pos: [.1, 1.25, -.02] }, { name: 'tail', parent: 'hips', pos: [0, .55, -.38] },
      { name: 'armL', parent: 'head', pos: [.42, .72, .05] }, { name: 'armR', parent: 'head', pos: [-.42, .72, .05] },
      { name: 'legL', parent: 'hips', pos: [.15, .3, 0] }, { name: 'footL', parent: 'legL', pos: [.16, .08, .03] },
      { name: 'legR', parent: 'hips', pos: [-.15, .3, 0] }, { name: 'footR', parent: 'legR', pos: [-.16, .08, .03] }];
    const parts = [
      { type: 'sphere', c: [0, .8, 0], r: .46, bone: 'head', color: c, k: .1 },
      { type: 'limb', a: [.08, 1.2, -.02], b: [.13, 1.42, -.03], ra: .025, rb: .02, bone: 'ant', color: leg, k: .02 },
      { type: 'limb', a: [.42, .72, .05], b: [.5, .58, .1], ra: .065, rb: .055, bone: 'armL', color: c, k: .05 }, { type: 'limb', a: [-.42, .72, .05], b: [-.5, .58, .1], ra: .065, rb: .055, bone: 'armR', color: c, k: .05 },
      { type: 'limb', a: [.15, .36, 0], b: [.16, .12, .02], ra: .08, rb: .07, bone: 'legL', color: leg, k: .06 }, { type: 'ellipsoid', c: [.16, .06, .07], r: [.1, .06, .13], bone: 'footL', color: leg, k: .05 },
      { type: 'limb', a: [-.15, .36, 0], b: [-.16, .12, .02], ra: .08, rb: .07, bone: 'legR', color: leg, k: .06 }, { type: 'ellipsoid', c: [-.16, .06, .07], r: [.1, .06, .13], bone: 'footR', color: leg, k: .05 },
      // a crescent tail curling up behind
      { type: 'limb', a: [0, .55, -.38], b: [0, .72, -.56], ra: .1, rb: .09, bone: 'tail', color: c, k: .05 }, { type: 'limb', a: [0, .72, -.56], b: [0, .98, -.54], ra: .09, rb: .02, bone: 'tail', color: c, k: .05 },
      ...smile(.64, .45)];
    const paints = [{ type: 'sphere', c: [.24, 1.02, .34], r: .08, color: crater, soft: .03 }, { type: 'sphere', c: [-.3, .92, .3], r: .06, color: crater, soft: .03 }, { type: 'sphere', c: [.32, .6, .3], r: .05, color: crater, soft: .03 }, { type: 'sphere', c: [-.08, 1.16, .3], r: .045, color: crater, soft: .025 },
      ...blush(.68, .4, .25).map(q => ({ ...q, color: cheek })), ...smileInk(.64, .455, '#8a6a3a')];
    return { voxel: .024, bones, parts, paints }; },
  material: body => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .55, sheen: .7, sheenRoughness: .5, sheenColor: new THREE.Color('#fff8e0'), emissive: new THREE.Color(body), emissiveIntensity: .12, clearcoat: .2 }),
  face(P, B, h) { twoEyes(P, B, h, 'head', .115, '#7a5ae0', .15, .82, .41, .24); P.mouth = h.attach(B.head, h.makeMouth(.06), 0, .64, .46);
    const sg = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? .05 : .11; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } const g = new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: true, bevelThickness: .015, bevelSize: .012, bevelSegments: 2 }); g.center(); return g; })();
    P.star = h.attach(B.ant, new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: '#ffd23f', emissive: '#ffb000', emissiveIntensity: .6, roughness: .3, clearcoat: 1 })), .14, 1.48, -.03); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, act, ak, air, sq } = e, B = P.B, t = A.t, sin = Math.sin, swing = sin(phase);
    B.hips.position.y = B.hips.userData.rest.y + Math.abs(sin(phase)) * .1 * run; /* (soft floaty hops) */
    B.head.rotation.z = sin(phase) * .07 * run + sin(t * 1.1) * .04 + (r > 0 ? sin(t * 22) * .15 * r : 0); B.head.rotation.x = run * .08 + (act === 'look' ? -.12 : 0);
    B.head.rotation.y = act === 'look' ? sin(ak * 3) * .5 : (act === 'twirl' ? ak / 1.6 * Math.PI * 2 : 0);
    B.legL.rotation.x = air ? -.4 : swing * .6 * run; B.legR.rotation.x = air ? -.4 : -swing * .6 * run;
    B.armL.rotation.z = .2 + (air ? .6 : 0) + (r > 0 ? .9 : 0); B.armR.rotation.z = -.2 - (air ? .6 : 0) - (r > 0 ? .9 : 0) - (act === 'wave' ? 1 + sin(ak * 12) * .3 : 0);
    const a = stepSpring(A.earS, -(s.vy || 0) * .04 - sq * .6, 110, 6, dt); B.ant.rotation.x = a * .6 + sin(t * 2.5) * .08; B.ant.rotation.z = sin(t * 1.9) * .12;
    if (P.star) P.star.rotation.z = t * (r > 0 ? 6 : .8);
    const tw = stepSpring(A.tailS, -(s.vx || 0) * .06 * (s.facing || 1), 80, 5, dt); B.tail.rotation.y = tw * .4 + sin(t * 2.4) * .1; },
});

// ---------------------------------------------------------------- BLOOP (a squishy rainbow gumdrop)
registerFriend('bloop', {
  body: '#ff8fc8',
  spec(body) { const bands = [body, '#ffb35c', '#ffe066', '#7be08a', '#7fc8ff', '#b58cff'];
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'base', parent: 'root', pos: [0, .25, 0] }, { name: 'body', parent: 'base', pos: [0, .6, 0] }, { name: 'curl', parent: 'body', pos: [0, 1.12, 0] }];
    const parts = [
      { type: 'ellipsoid', c: [0, .5, 0], r: [.52, .46, .5], bone: 'base', color: bands[5], k: .18 },
      { type: 'ellipsoid', c: [0, .82, 0], r: [.38, .34, .37], bone: 'body', color: bands[0], k: .2 },
      { type: 'limb', a: [0, 1.08, 0], b: [.06, 1.28, -.02], ra: .09, rb: .05, bone: 'curl', color: bands[0], k: .06 }, { type: 'limb', a: [.06, 1.28, -.02], b: [-.06, 1.36, -.02], ra: .05, rb: .03, bone: 'curl', color: bands[0], k: .04 },
      ...smile(.6, .5)];
    // rainbow stripes painted round the body, from the bottom up
    const paints = [...[.12, .26, .4, .54, .68, .82, .96].map((y, i) => ({ type: 'ellipsoid', c: [0, y, 0], r: [.62, .075, .62], color: bands[(6 - i) % 6], soft: .04 })),
      ...blush(.64, .46, .27), ...smileInk(.6, .505, '#7a2a5a'), { type: 'sphere', c: [.18, 1.0, .3], r: .07, color: '#ffffff', soft: .05 }];
    return { voxel: .024, bones, parts, paints }; },
  material: () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .18, clearcoat: 1, clearcoatRoughness: .1, iridescence: .3, iridescenceIOR: 1.3 }),
  face(P, B, h) { twoEyes(P, B, h, 'body', .125, '#3a2a8a', .17, .78, .43, .26); P.mouth = h.attach(B.body, h.makeMouth(.065), 0, .6, .51); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, air } = e, B = P.B, t = A.t, sin = Math.sin;
    const hop = Math.abs(sin(phase * .9)) * run; B.base.position.y = B.base.userData.rest.y + hop * .14 + (air ? .05 : 0);
    const squish = 1 + (1 - hop) * .08 * run + sin(t * 2.4) * .025; B.base.scale.set(squish, 2 - squish, squish); /* (squish down, stretch up) */
    const wob = stepSpring(A.tailS, -(s.vx || 0) * .06 + (r > 0 ? sin(t * 18) * 1.2 : 0), 60, 3, dt);
    B.body.rotation.z = wob * .18 + sin(t * 3) * .03; B.curl.rotation.z = wob * .5 + sin(t * 3.3) * .15; B.curl.rotation.x = -(s.vy || 0) * .04; },
});

// ---------------------------------------------------------------- ZIP (a little comet)
registerFriend('zip', {
  body: '#9fe6ff',
  spec(body) { const c = body, glow = mixC(body, '#ffffff', .6), t1 = mixC(body, '#c9a6ff', .4), t2 = mixC(body, '#ff9fd2', .5);
    const bones = [{ name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, .45, 0] }, { name: 'head', parent: 'hips', pos: [0, .75, 0] },
      { name: 'tail1', parent: 'head', pos: [0, .8, -.4] }, { name: 'tail2', parent: 'tail1', pos: [0, .92, -.8] }, { name: 'tail3', parent: 'tail2', pos: [0, 1.0, -1.15] },
      { name: 'armL', parent: 'head', pos: [.38, .62, .08] }, { name: 'armR', parent: 'head', pos: [-.38, .62, .08] },
      { name: 'footL', parent: 'hips', pos: [.14, .14, .05] }, { name: 'footR', parent: 'hips', pos: [-.14, .14, .05] }];
    const parts = [
      { type: 'sphere', c: [0, .75, .02], r: .42, bone: 'head', color: c, k: .1 },
      // the swept tail: three soft lobes, thinner and further back, lifting a little
      { type: 'limb', a: [0, .82, -.25], b: [0, .92, -.8], ra: .34, rb: .2, bone: 'tail1', color: t1, k: .12 },
      { type: 'limb', a: [.12, .92, -.75], b: [.18, 1.02, -1.15], ra: .18, rb: .07, bone: 'tail2', color: t2, k: .08 }, { type: 'limb', a: [-.12, .92, -.75], b: [-.2, .98, -1.12], ra: .16, rb: .06, bone: 'tail3', color: t1, k: .08 },
      { type: 'limb', a: [.36, .64, .08], b: [.46, .5, .14], ra: .06, rb: .05, bone: 'armL', color: c, k: .05 }, { type: 'limb', a: [-.36, .64, .08], b: [-.46, .5, .14], ra: .06, rb: .05, bone: 'armR', color: c, k: .05 },
      { type: 'limb', a: [.13, .36, .03], b: [.14, .16, .05], ra: .065, rb: .055, bone: 'footL', color: t1, k: .05 }, { type: 'ellipsoid', c: [.14, .08, .1], r: [.08, .05, .11], bone: 'footL', color: t1, k: .04 },
      { type: 'limb', a: [-.13, .36, .03], b: [-.14, .16, .05], ra: .065, rb: .055, bone: 'footR', color: t1, k: .05 }, { type: 'ellipsoid', c: [-.14, .08, .1], r: [.08, .05, .11], bone: 'footR', color: t1, k: .04 },
      ...smile(.58, .43)];
    const paints = [{ type: 'sphere', c: [0, .82, .3], r: .2, color: glow, soft: .15 }, ...blush(.64, .38, .24), ...smileInk(.58, .435, '#2a4a8a'), { type: 'sphere', c: [0, 1.0, -.9], r: .18, color: '#ffffff', soft: .15 }];
    return { voxel: .024, bones, parts, paints }; },
  material: body => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .25, clearcoat: 1, clearcoatRoughness: .15, emissive: new THREE.Color(body), emissiveIntensity: .35, iridescence: .4, iridescenceIOR: 1.35 }),
  face(P, B, h) { twoEyes(P, B, h, 'head', .115, '#2f6fff', .15, .78, .36, .24); P.mouth = h.attach(B.head, h.makeMouth(.06), 0, .58, .44); },
  animate(P, A, s, dt, e, stepSpring) { const { run, phase, r, act, ak, air } = e, B = P.B, t = A.t, sin = Math.sin, swing = sin(phase);
    B.hips.position.y = B.hips.userData.rest.y + Math.abs(sin(phase)) * .05 * run + (air ? .06 : 0);
    B.head.rotation.x = run * .22 + (air ? .15 : 0); /* (leans into its zooms) */ B.head.rotation.z = sin(t * 1.6) * .04 + (r > 0 ? sin(t * 24) * .2 * r : 0);
    B.footL.rotation.x = air ? -.5 : swing * .7 * run; B.footR.rotation.x = air ? -.5 : -swing * .7 * run;
    B.armL.rotation.z = .3 + (air ? .5 : 0) + (r > 0 ? .8 : 0); B.armR.rotation.z = -.3 - (air ? .5 : 0) - (r > 0 ? .8 : 0) - (act === 'wave' ? .9 + sin(ak * 12) * .3 : 0);
    const st = stepSpring(A.tailS, -(s.vx || 0) * .08 * (s.facing || 1) - (s.vy || 0) * .03, 50, 3, dt), st2 = stepSpring(A.ear2, st * 1.4, 35, 3, dt);
    B.tail1.rotation.y = st * .3 + sin(t * 2.6) * .08; B.tail1.rotation.x = -(s.vy || 0) * .03 - run * .1; B.tail2.rotation.y = st2 * .4 + sin(t * 2.6 - .8) * .12; B.tail3.rotation.y = st2 * .5 + sin(t * 2.6 - 1.6) * .16; },
});

// the four new friends join the list (names for the voice; how high they jump), and where accessories sit on them
Object.assign(CREATURES, {
  puffle: { name: 'Puffle', jump: [9.9, 8.7], body: '#f4f8ff', isNew: true },
  luna: { name: 'Luna', jump: [10.2, 9.0], body: '#fff1b8', isNew: true },
  bloop: { name: 'Bloop', jump: [9.7, 8.5], body: '#ff8fc8', isNew: true },
  zip: { name: 'Zip', jump: [9.8, 8.6], body: '#9fe6ff', isNew: true },
});
Object.assign(FIT, {
  puffle: { head: { b: 'top', p: [0, 1.2, -.02], s: 1.0 }, face: { b: 'body', p: [0, .75, .47], s: .95 }, back: { b: 'body', p: [0, .72, -.4], s: 1.05 } },
  luna: { head: { b: 'head', p: [-.05, 1.22, -.02], s: 1.05 }, face: { b: 'head', p: [0, .82, .49], s: .95 }, back: { b: 'head', p: [0, .78, -.45], s: 1 } },
  bloop: { head: { b: 'curl', p: [0, 1.2, -.02], s: 1.05 }, face: { b: 'body', p: [0, .78, .52], s: 1.05 }, back: { b: 'body', p: [0, .7, -.48], s: 1.05 } },
  zip: { head: { b: 'head', p: [0, 1.15, -.05], s: 1 }, face: { b: 'head', p: [0, .78, .45], s: .95 }, back: { b: 'head', p: [0, .62, -.38], s: .9 } },
});
