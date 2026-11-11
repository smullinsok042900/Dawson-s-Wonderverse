// ===================================================================
// critterkit.js: 3D build 14, the friends and animals rebuilt as proper
// sculpted characters (see sculpt.js): one seamless body each on a real
// skeleton, with real eyes that blink, breathing, wiggling ears and wagging
// tails. Bodies are sculpted in a background worker; the skeleton and
// accessories exist straight away, the body appears a moment later.
//   plush(group, options, accessories) -> parts { head, arm, eyes, tick }
// ===================================================================
import * as THREE from 'three';
import { sculptAsync, makeSkeleton, attach, skin } from './sculpt.js';
import { makeEye, setLids, makeMouth } from './characters.js';
import { plushNormal } from './nature.js';

const L = (a, b, t) => a + (b - a) * t;
const v3 = (x, y, z) => [x, y, z];

// ---------- a two-legged plush animal (bear, bunny, fox, beaver, penguin, owl, frog, puppy, pets...) ----------
export function bipedSpec(o) {
  const S = o.scale || 1, s = p => p.map(n => n * S), hw = o.headW || 1, hy = o.headY ?? 1.16, body = o.body, belly = o.belly || o.body, muzzle = o.muzzle || belly, dark = o.dark || '#3a2030';
  const bones = [
    { name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: s([0, .44, 0]) }, { name: 'spine', parent: 'hips', pos: s([0, .7, 0]) }, { name: 'head', parent: 'spine', pos: s([0, hy - .14, .01]) },
    { name: 'earL', parent: 'head', pos: s([.2 * hw, hy + .22, -.02]) }, { name: 'earL2', parent: 'earL', pos: s([.24 * hw, hy + .4, -.04]) },
    { name: 'earR', parent: 'head', pos: s([-.2 * hw, hy + .22, -.02]) }, { name: 'earR2', parent: 'earR', pos: s([-.24 * hw, hy + .4, -.04]) },
    { name: 'armL', parent: 'spine', pos: s([.26, .84, .04]) }, { name: 'handL', parent: 'armL', pos: s([.4, .62, .1]) },
    { name: 'armR', parent: 'spine', pos: s([-.26, .84, .04]) }, { name: 'handR', parent: 'armR', pos: s([-.4, .62, .1]) },
    { name: 'legL', parent: 'hips', pos: s([.14, .4, 0]) }, { name: 'footL', parent: 'legL', pos: s([.15, .13, .03]) },
    { name: 'legR', parent: 'hips', pos: s([-.14, .4, 0]) }, { name: 'footR', parent: 'legR', pos: s([-.15, .13, .03]) },
    { name: 'tail', parent: 'hips', pos: s([0, .45, -.28]) }, { name: 'tail2', parent: 'tail', pos: s([0, .62, -.5]) },
  ];
  const br = o.bodyR || [.34, .38, .3];
  const parts = [
    { type: 'ellipsoid', c: s([0, .62, 0]), r: s(br), bone: 'spine', color: body, k: .08 * S },
    { type: 'ellipsoid', c: s([0, .48, .01]), r: s([br[0] * .97, .24, br[2] * .97]), bone: 'hips', color: body, k: .1 * S },
    { type: 'limb', a: s([0, .86, 0]), b: s([0, hy - .1, .01]), ra: .16 * S, rb: .18 * S, bone: 'head', color: body, k: .06 * S },
    { type: 'ellipsoid', c: s([0, hy, .02]), r: s([.34 * hw, .31 * (o.headH || 1), .3]), bone: 'head', color: o.headCol || body, k: .05 * S },
    { type: 'ellipsoid', c: s([.15 * hw, hy - .09, .15]), r: s([.13, .1, .12]), bone: 'head', color: o.headCol || body, k: .09 * S },
    { type: 'ellipsoid', c: s([-.15 * hw, hy - .09, .15]), r: s([.13, .1, .12]), bone: 'head', color: o.headCol || body, k: .09 * S },
    // arms, paws, legs, feet
    { type: 'limb', a: s([.24, .85, .03]), b: s([.38, .65, .09]), ra: .08 * S, rb: .066 * S, bone: 'armL', color: o.armCol || body, k: .06 * S },
    { type: 'sphere', c: s([.41, .59, .11]), r: .078 * S, bone: 'handL', color: o.pawCol || o.armCol || belly, k: .04 * S },
    { type: 'limb', a: s([-.24, .85, .03]), b: s([-.38, .65, .09]), ra: .08 * S, rb: .066 * S, bone: 'armR', color: o.armCol || body, k: .06 * S },
    { type: 'sphere', c: s([-.41, .59, .11]), r: .078 * S, bone: 'handR', color: o.pawCol || o.armCol || belly, k: .04 * S },
    { type: 'limb', a: s([.14, .42, 0]), b: s([.15, .16, .02]), ra: .11 * S, rb: .09 * S, bone: 'legL', color: o.legCol || body, k: .07 * S },
    { type: 'ellipsoid', c: s([.15, .065, .08]), r: s([.11, .07, .16]), bone: 'footL', color: o.footCol || belly, k: .05 * S },
    { type: 'limb', a: s([-.14, .42, 0]), b: s([-.15, .16, .02]), ra: .11 * S, rb: .09 * S, bone: 'legR', color: o.legCol || body, k: .07 * S },
    { type: 'ellipsoid', c: s([-.15, .065, .08]), r: s([.11, .07, .16]), bone: 'footR', color: o.footCol || belly, k: .05 * S },
  ];
  const paints = [{ type: 'ellipsoid', c: s([0, .58, .24]), r: s([br[0] * .65, br[1] * .7, .12]), color: belly, soft: .04 * S }];
  // muzzle / snout / beak
  if (o.beak) parts.push({ type: 'limb', a: s([0, hy - .03, .26]), b: s([0, hy - .08, .4]), ra: .06 * S, rb: .012 * S, bone: 'head', color: o.beak, k: .02 * S, soft: .006 });
  else if (o.snout !== false) {
    const sn = o.snout || 0;
    parts.push({ type: 'ellipsoid', c: s([0, hy - .09, .25 + sn * .5]), r: s([.13, .09, .1 + sn * .6]), bone: 'head', color: muzzle, k: .07 * S, soft: .02 });
    parts.push({ type: 'ellipsoid', c: s([0, hy - .045, .34 + sn * 1.05]), r: s([.05, .035, .035]), bone: 'head', color: o.nose || dark, k: .02 * S, soft: .008 });
    paints.push({ type: 'limb', a: s([-.05, hy - .135, .31 + sn]), b: s([0, hy - .15, .32 + sn]), ra: .013 * S, rb: .013 * S, color: dark, soft: .006 }, { type: 'limb', a: s([0, hy - .15, .32 + sn]), b: s([.05, hy - .135, .31 + sn]), ra: .013 * S, rb: .013 * S, color: dark, soft: .006 });
  }
  if (o.teeth) parts.push({ type: 'ellipsoid', c: s([0, hy - .2, .3 + (o.snout || 0)]), r: s([.045, .04, .015]), bone: 'head', color: '#ffffff', k: .01 * S, soft: .005 });
  // blush
  if (o.blush !== false) for (const x of [.21, -.21]) paints.push({ type: 'sphere', c: s([x * hw, hy - .1, .23]), r: .055 * S, color: '#ff9ec8', soft: .03 * S });
  // ears
  const E = o.ears || 'round', earC = o.earCol || body, inner = o.innerEar || '#ffb3cf';
  for (const [sg, e1, e2] of [[1, 'earL', 'earL2'], [-1, 'earR', 'earR2']]) {
    const x = sg * hw;
    if (E === 'round') { parts.push({ type: 'sphere', c: s([.22 * x, hy + .25, -.02]), r: .1 * S, bone: e1, color: earC, k: .04 * S }); paints.push({ type: 'sphere', c: s([.22 * x, hy + .25, .07]), r: .055 * S, color: inner, soft: .02 }); }
    else if (E === 'long') { parts.push({ type: 'limb', a: s([.15 * x, hy + .22, -.02]), b: s([.21 * x, hy + .48, -.05]), ra: .07 * S, rb: .085 * S, bone: e1, color: earC, k: .05 * S }, { type: 'limb', a: s([.21 * x, hy + .48, -.05]), b: s([.24 * x, hy + .64, -.07]), ra: .085 * S, rb: .05 * S, bone: e2, color: earC, k: .04 * S }); paints.push({ type: 'ellipsoid', c: s([.2 * x, hy + .44, .02]), r: s([.04, .17, .05]), color: inner, soft: .02 }); }
    else if (E === 'pointy') { parts.push({ type: 'limb', a: s([.18 * x, hy + .2, -.02]), b: s([.27 * x, hy + .46, -.05]), ra: .11 * S, rb: .02 * S, bone: e1, color: earC, k: .04 * S }); paints.push({ type: 'limb', a: s([.19 * x, hy + .22, .05]), b: s([.25 * x, hy + .38, .01]), ra: .055 * S, rb: .02 * S, color: inner, soft: .02 }); }
    else if (E === 'small') parts.push({ type: 'sphere', c: s([.25 * x, hy + .2, 0]), r: .065 * S, bone: e1, color: earC, k: .03 * S });
    else if (E === 'floppy') parts.push({ type: 'limb', a: s([.25 * x, hy + .12, 0]), b: s([.36 * x, hy - .14, .04]), ra: .07 * S, rb: .1 * S, bone: e1, color: earC, k: .04 * S });
    else if (E === 'tufts') parts.push({ type: 'limb', a: s([.18 * x, hy + .2, 0]), b: s([.27 * x, hy + .38, -.03]), ra: .07 * S, rb: .018 * S, bone: e1, color: earC, k: .04 * S });
    else if (E === 'cat') parts.push({ type: 'limb', a: s([.17 * x, hy + .2, -.02]), b: s([.23 * x, hy + .36, -.03]), ra: .09 * S, rb: .025 * S, bone: e1, color: earC, k: .04 * S });
    else if (E === 'antennae') parts.push({ type: 'limb', a: s([.1 * x, hy + .25, 0]), b: s([.18 * x, hy + .5, -.02]), ra: .02 * S, rb: .016 * S, bone: e1, color: earC, k: .02 * S }, { type: 'sphere', c: s([.18 * x, hy + .53, -.02]), r: .05 * S, bone: e2, color: o.antTip || '#ffd84a', k: .02 * S });
    if (o.eyeBumps) parts.push({ type: 'sphere', c: s([.15 * x, hy + .12, .1]), r: .12 * S, bone: 'head', color: o.headCol || body, k: .06 * S });
  }
  // tails
  const T = o.tail;
  if (T === 'puff') parts.push({ type: 'sphere', c: s([0, .5, -.31]), r: .1 * S, bone: 'tail', color: o.tailCol || belly, k: .05 * S });
  if (T === 'bushy') { parts.push({ type: 'limb', a: s([0, .42, -.25]), b: s([0, .62, -.52]), ra: .09 * S, rb: .15 * S, bone: 'tail', color: body, k: .06 * S }, { type: 'limb', a: s([0, .62, -.52]), b: s([0, .9, -.6]), ra: .15 * S, rb: .07 * S, bone: 'tail2', color: body, k: .05 * S }); paints.push({ type: 'sphere', c: s([0, .9, -.6]), r: .13 * S, color: o.tailTip || '#ffffff', soft: .04 }); }
  if (T === 'paddle') parts.push({ type: 'ellipsoid', c: s([0, .2, -.45]), r: s([.14, .04, .22]), bone: 'tail', color: o.tailCol || '#7a4a2a', k: .05 * S });
  if (T === 'wag') parts.push({ type: 'limb', a: s([0, .45, -.26]), b: s([0, .72, -.42]), ra: .05 * S, rb: .035 * S, bone: 'tail', color: body, k: .04 * S });
  if (T === 'curly') parts.push({ type: 'limb', a: s([0, .45, -.27]), b: s([0, .6, -.38]), ra: .045 * S, rb: .055 * S, bone: 'tail', color: body, k: .04 * S }, { type: 'sphere', c: s([0, .66, -.33]), r: .06 * S, bone: 'tail2', color: body, k: .04 * S });
  if (T === 'feathers') for (const x of [-.08, 0, .08]) parts.push({ type: 'limb', a: s([x * .5, .35, -.25]), b: s([x * 1.5, .22, -.45]), ra: .06 * S, rb: .02 * S, bone: 'tail', color: body, k: .04 * S });
  if (o.flippers) for (const sg of [1, -1]) parts.push({ type: 'ellipsoid', c: s([.34 * sg, .66, 0]), r: s([.06, .24, .13]), bone: sg > 0 ? 'armL' : 'armR', color: o.armCol || body, k: .05 * S });
  if (o.wool) for (let i = 0; i < 14; i++) { const a = i * 2.4, yy = .45 + (i % 4) * .1; parts.push({ type: 'sphere', c: s([Math.cos(a) * .3, yy, Math.sin(a) * .26]), r: .13 * S, bone: yy > .6 ? 'spine' : 'hips', color: body, k: .04 * S }); }
  if (o.extraParts) parts.push(...o.extraParts(s, hy, hw));
  if (o.extraPaints) paints.push(...o.extraPaints(s, hy, hw));
  return { voxel: (o.voxel || .026) * S, bones, parts, paints, eye: { x: .125 * hw * S, y: (hy + (o.eyeBumps ? .14 : .03)) * S, z: (o.eyeBumps ? .17 : .25) * S, r: (o.eyeR || .075) * S }, mouth: { y: (hy - .15) * S, z: (.33 + (o.snout || 0)) * S } };
}

// ---------- a four-legged animal side-on (unicorn, little dinos, horned dino) ----------
export function quadSpec(o) {
  const S = o.scale || 1, s = p => p.map(n => n * S), body = o.body, belly = o.belly || body, hoof = o.hoof || belly;
  const L2 = o.legLen ?? .5, by = .2 + L2, hx = .62 * (o.long || 1), nk = o.neck ?? 1;
  const bones = [
    { name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: s([-hx * .55, by, 0]) }, { name: 'chest', parent: 'hips', pos: s([hx * .55, by + .02, 0]) },
    { name: 'neck', parent: 'chest', pos: s([hx * .85, by + .15, 0]) }, { name: 'head', parent: 'neck', pos: s([hx * .85 + .25 * nk, by + .4 * nk, 0]) },
    { name: 'earL', parent: 'head', pos: s([hx * .85 + .25 * nk, by + .6 * nk, .1]) }, { name: 'earR', parent: 'head', pos: s([hx * .85 + .25 * nk, by + .6 * nk, -.1]) },
    { name: 'tail', parent: 'hips', pos: s([-hx - .05, by + .05, 0]) }, { name: 'tail2', parent: 'tail', pos: s([-hx - .35, by - .15, 0]) },
    ...[['FL', .55, .16], ['FR', .55, -.16], ['BL', -.55, .16], ['BR', -.55, -.16]].flatMap(([n, fx, z]) => [{ name: 'leg' + n, parent: fx > 0 ? 'chest' : 'hips', pos: s([fx * hx, by - .1, z]) }, { name: 'foot' + n, parent: 'leg' + n, pos: s([fx * hx, .12, z]) }]),
  ];
  const hx2 = hx * .85 + .25 * nk + .05, hyy = by + .42 * nk;
  const parts = [
    { type: 'ellipsoid', c: s([0, by + .05, 0]), r: s([hx, .27 * (o.fat || 1), .26 * (o.fat || 1)]), bone: 'hips', color: body, k: .1 * S },
    { type: 'ellipsoid', c: s([hx * .5, by + .08, 0]), r: s([hx * .55, .29 * (o.fat || 1), .27 * (o.fat || 1)]), bone: 'chest', color: body, k: .12 * S },
    { type: 'limb', a: s([hx * .7, by + .15, 0]), b: s([hx2 - .05, hyy - .05, 0]), ra: .16 * S, rb: .13 * S, bone: 'neck', color: body, k: .08 * S },
    { type: 'ellipsoid', c: s([hx2, hyy, 0]), r: s([.24, .2, .19]), bone: 'head', color: o.headCol || body, k: .07 * S },
    { type: 'ellipsoid', c: s([hx2 + .2, hyy - .07, 0]), r: s([.15, .12, .14]), bone: 'head', color: o.snoutCol || belly, k: .07 * S, soft: .03 },
    ...[['FL', .55, .16], ['FR', .55, -.16], ['BL', -.55, .16], ['BR', -.55, -.16]].flatMap(([n, fx, z]) => [
      { type: 'limb', a: s([fx * hx, by - .05, z * .9]), b: s([fx * hx, .14, z]), ra: .1 * S, rb: .075 * S, bone: 'leg' + n, color: o.legCol || body, k: .07 * S },
      { type: 'ellipsoid', c: s([fx * hx + .02, .06, z]), r: s([.09, .07, .085]), bone: 'foot' + n, color: hoof, k: .03 * S, soft: .015 }]),
  ];
  const paints = [{ type: 'ellipsoid', c: s([0, by - .14, 0]), r: s([hx * .8, .1, .24]), color: belly, soft: .05 }, { type: 'sphere', c: s([hx2 + .33, hyy - .03, 0]), r: .04 * S, color: o.nose || '#3a2030', soft: .015 }];
  if (o.ears !== false) for (const z of [.1, -.1]) parts.push({ type: 'limb', a: s([hx2 - .05, hyy + .14, z]), b: s([hx2 - .08, hyy + .32, z * 1.4]), ra: .065 * S, rb: .02 * S, bone: z > 0 ? 'earL' : 'earR', color: body, k: .04 * S });
  if (o.horn) parts.push({ type: 'limb', a: s([hx2 + .05, hyy + .15, 0]), b: s([hx2 + .12, hyy + .5, 0]), ra: .05 * S, rb: .006 * S, bone: 'head', color: o.horn, k: .02 * S, soft: .006 });
  if (o.tail === 'long') parts.push({ type: 'limb', a: s([-hx * .95, by + .05, 0]), b: s([-hx - .3, by - .12, 0]), ra: .1 * S, rb: .07 * S, bone: 'tail', color: body, k: .06 * S }, { type: 'limb', a: s([-hx - .3, by - .12, 0]), b: s([-hx - .55, by - .2, 0]), ra: .07 * S, rb: .03 * S, bone: 'tail2', color: body, k: .05 * S });
  if (o.frill) parts.push({ type: 'ellipsoid', c: s([hx2 - .15, hyy + .12, 0]), r: s([.06, .3, .32]), bone: 'head', color: o.frill, k: .05 * S });
  if (o.horns) for (const [dx, dy, dz, ex, ey] of [[0, .15, .1, -.05, .4], [0, .15, -.1, -.05, .4], [.3, .02, 0, .42, .2]]) parts.push({ type: 'limb', a: s([hx2 + dx, hyy + dy, dz]), b: s([hx2 + ex, hyy + ey, dz * 1.3]), ra: .045 * S, rb: .008 * S, bone: 'head', color: o.horns, k: .02 * S, soft: .006 });
  if (o.plates) for (let i = 0; i < 5; i++) parts.push({ type: 'limb', a: s([-hx * .7 + i * hx * .35, by + .25, 0]), b: s([-hx * .7 + i * hx * .35, by + .42, 0]), ra: .07 * S, rb: .015 * S, bone: i < 3 ? 'hips' : 'chest', color: o.plates, k: .04 * S });
  if (o.extraParts) parts.push(...o.extraParts(s, hx2, hyy, by, hx));
  if (o.extraPaints) paints.push(...o.extraPaints(s, hx2, hyy));
  return { voxel: (o.voxel || .028) * S, bones, parts, paints, eye: { x: (hx2 + .1) * S, y: (hyy + .05) * S, z: .14 * S, r: (o.eyeR || .065) * S, side: true } };
}

// ---------- a person (the princesses) ----------
export function personSpec(o) {
  const skinC = o.skin, gown = o.gown, hair = o.hair;
  const bones = [
    { name: 'root', pos: [0, 0, 0] }, { name: 'hips', parent: 'root', pos: [0, 1.12, 0] }, { name: 'spine', parent: 'hips', pos: [0, 1.4, 0] }, { name: 'head', parent: 'spine', pos: [0, 1.72, 0] },
    { name: 'armL', parent: 'spine', pos: [.22, 1.6, 0] }, { name: 'handL', parent: 'armL', pos: [.3, 1.2, .05] }, { name: 'armR', parent: 'spine', pos: [-.22, 1.6, 0] }, { name: 'handR', parent: 'armR', pos: [-.3, 1.2, .05] },
    { name: 'earL', parent: 'head', pos: [.1, 2.2, 0] }, { name: 'earR', parent: 'head', pos: [-.1, 2.2, 0] },
  ];
  const parts = [
    { type: 'limb', a: [0, 1.15, 0], b: [0, 1.52, 0], ra: .17, rb: .15, bone: 'spine', color: gown, k: .06 },
    { type: 'ellipsoid', c: [0, 1.56, .0], r: [.21, .1, .13], bone: 'spine', color: gown, k: .06 },
    { type: 'limb', a: [0, 1.6, 0], b: [0, 1.78, .01], ra: .06, rb: .065, bone: 'head', color: skinC, k: .04, soft: .015 },
    { type: 'ellipsoid', c: [0, 1.95, .02], r: [.22, .25, .22], bone: 'head', color: skinC, k: .04, soft: .015 },
    // hair: a soft bob with a bun on top and side curls
    { type: 'ellipsoid', c: [0, 2.0, -.04], r: [.25, .27, .25], bone: 'head', color: hair, k: .03, soft: .012 },
    { type: 'sphere', c: [0, 2.24, -.06], r: .11, bone: 'head', color: hair, k: .04 },
    { type: 'ellipsoid', c: [.2, 1.86, -.02], r: [.08, .14, .09], bone: 'head', color: hair, k: .04 }, { type: 'ellipsoid', c: [-.2, 1.86, -.02], r: [.08, .14, .09], bone: 'head', color: hair, k: .04 },
    { type: 'ellipsoid', c: [0, 1.88, .21], r: [.04, .03, .03], bone: 'head', color: skinC, k: .02, soft: .01 },
    // arms with puffy sleeves and hands
    { type: 'sphere', c: [.22, 1.55, 0], r: .09, bone: 'armL', color: gown, k: .04 }, { type: 'limb', a: [.24, 1.5, 0], b: [.3, 1.24, .05], ra: .045, rb: .04, bone: 'armL', color: skinC, k: .03, soft: .01 }, { type: 'sphere', c: [.31, 1.2, .06], r: .05, bone: 'handL', color: skinC, k: .02 },
    { type: 'sphere', c: [-.22, 1.55, 0], r: .09, bone: 'armR', color: gown, k: .04 }, { type: 'limb', a: [-.24, 1.5, 0], b: [-.3, 1.24, .05], ra: .045, rb: .04, bone: 'armR', color: skinC, k: .03, soft: .01 }, { type: 'sphere', c: [-.31, 1.2, .06], r: .05, bone: 'handR', color: skinC, k: .02 },
  ];
  // the hair stays off the face: a fringe line above the eyes
  const paints = [
    { type: 'ellipsoid', c: [0, 1.97, .19], r: [.15, .05, .07], color: skinC, soft: .015 },
    { type: 'sphere', c: [.11, 1.86, .19], r: .04, color: '#ff9ec8', soft: .025 }, { type: 'sphere', c: [-.11, 1.86, .19], r: .04, color: '#ff9ec8', soft: .025 },
    { type: 'limb', a: [-.045, 1.81, .205], b: [0, 1.795, .212], ra: .011, rb: .011, color: '#c23d6a', soft: .006 }, { type: 'limb', a: [0, 1.795, .212], b: [.045, 1.81, .205], ra: .011, rb: .011, color: '#c23d6a', soft: .006 },
  ];
  return { voxel: .018, bones, parts, paints, eye: { x: .08, y: 1.955, z: .195, r: .05 }, mouth: { y: 1.81, z: .2 } };
}

// ---------- building one ----------
// opts: { spec (from the builders above), fur (true = soft plush), gloss, accessories(B, att) }
export function plush(group, spec, opts = {}) {
  const sk = makeSkeleton(spec.bones), B = sk.bones;
  const holder = new THREE.Group(); group.add(holder); holder.add(sk.root);
  const mat = opts.fur !== false ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .8, sheen: 1, sheenRoughness: .45, sheenColor: new THREE.Color(opts.sheen || '#fff6f0'), normalMap: plushNormal(), normalScale: new THREE.Vector2(.4, .4) })
    : new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: opts.rough ?? .3, clearcoat: opts.clearcoat ?? 1, clearcoatRoughness: .15 });
  // eyes (one each side; side-on animals show them on both sides of the head)
  const E = spec.eye, lidMat = new THREE.MeshPhysicalMaterial({ color: opts.lid || '#d8b090', roughness: .7, sheen: opts.fur !== false ? 1 : 0 });
  const eyes = E.side
    ? [1, -1].map(sg => { const e = attach(B.head, makeEye(E.r, opts.iris || '#3a2a1a', lidMat), E.x, E.y, sg * E.z); e.rotation.y = sg > 0 ? .5 : Math.PI - .5; return e; })
    : [1, -1].map(sg => { const e = attach(B.head, makeEye(E.r, opts.iris || '#4a2a14', lidMat), sg * E.x, E.y, E.z); e.rotation.y = sg * .25; return e; });
  let mouth = null; if (spec.mouth && opts.mouth !== false) { mouth = attach(B.head, makeMouth(spec.eye.r * .65), 0, spec.mouth.y, spec.mouth.z); mouth.scale.setScalar(.001); }
  if (opts.accessories) opts.accessories(B, (bone, obj, x, y, z) => attach(bone, obj, x, y, z));
  sculptAsync(spec).then(geo => { const mesh = skin(geo, mat, sk); holder.add(mesh); mesh.traverse(o => { if (o.isMesh) o.userData.tap = group.userData.tapAll; }); if (group.userData.onReady) group.userData.onReady(mesh); });
  // breathing, blinking, ears and tail
  let blink = 1 + Math.random() * 3, t0 = Math.random() * 10, happyT = 0;
  const tick = (dt, t, excited) => {
    t += t0; blink -= dt; if (blink < 0) blink = 2 + Math.random() * 3;
    if (excited) happyT = .6; happyT = Math.max(0, happyT - dt);
    const closed = blink < .12, happy = happyT > 0 ? 1 : 0;
    eyes.forEach(e => setLids(e, closed ? 0 : 1 - happy * .2, happy));
    if (mouth) { const m = happy ? 1 : .001; mouth.scale.setScalar(mouth.scale.x + (m - mouth.scale.x) * Math.min(1, dt * 10)); }
    const br = Math.sin(t * 2.1);
    (B.spine || B.chest).scale.set(1 + br * .015, 1 + br * .02, 1 + br * .015);
    for (const [n, sg] of [['earL', 1], ['earR', -1]]) if (B[n]) { B[n].rotation.z = sg * Math.sin(t * 1.7 + sg) * .08 + (excited ? sg * Math.sin(t * 20) * .15 : 0); B[n].rotation.x = Math.sin(t * 1.3) * .05; }
    if (B.tail) B.tail.rotation.y = Math.sin(t * (excited ? 14 : 3)) * (excited ? .5 : .2);
    if (B.tail2) B.tail2.rotation.y = Math.sin(t * (excited ? 14 : 3) - .8) * .3;
    if (B.head && !spec.eye.side) B.head.rotation.y = Math.sin(t * .6) * .15;
  };
  return { B, eyes, mouth, tick, holder };
}
