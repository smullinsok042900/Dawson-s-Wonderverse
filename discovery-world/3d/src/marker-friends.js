// Five of the daughter's marker drawings, filled out as solid painted toy residents.
// The pale surfaces interpret the unfilled drawings; the original marker colors and odd proportions stay visible.
import * as THREE from 'three';
import { limb, eye as shinyEye } from './plush.js';
// (build 124) arms, legs and antennae (the strokes beside the body, not the face lines) become chunky round plush limbs
const isLimb = (pts, r) => r >= .018 && r < .04 && pts.every(p => Math.abs(p[2]) < .06);
const fat = r => Math.max(.05, r * 2.2);

const BALL = new THREE.SphereGeometry(1, 12, 9);
const SMALL = new THREE.SphereGeometry(1, 8, 6);
const DOT = new THREE.SphereGeometry(1, 6, 4);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6);
const HALF = new THREE.TorusGeometry(1, .11, 4, 12, Math.PI);
const LOOP = new THREE.TorusGeometry(1, .13, 4, 12);
const WHITE = '#fff6df', NAVY = '#304eaa', GREEN = '#438e69', TEAL = '#356b70', OLIVE = '#788b3a', PINK = '#dc66aa';
const UP = new THREE.Vector3(0, 1, 0);

function ball(b, color, x, y, z, sx, sy = sx, sz = sx, small = true) {
  b.put(small ? SMALL : BALL, x, y, z, color, [sx, sy, sz]);
}
function rod(b, color, a, c, radius = .025) {
  if (isLimb([a, c], radius)) return limb(b, color, [a, c], fat(radius), fat(radius) * .9, 3, fat(radius) * (c[1] > a[1] + .15 ? .95 : 1.25)); // (an antenna gets a small round bobble, a hand or foot a bigger one)
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...c), delta = end.clone().sub(start);
  const turn = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, delta.clone().normalize()));
  const center = start.add(end).multiplyScalar(.5);
  b.put(CYL, center.x, center.y, center.z, color, [radius, delta.length(), radius], turn.toArray());
}
// Every curved stroke has real round caps. All parts are merged by the existing NPC batch, never separate draw calls.
function stroke(b, color, points, radius = .025, segments = 8) {
  if (isLimb(points, radius)) return limb(b, color, points, fat(radius), fat(radius) * .9, segments + 2, fat(radius) * 1.25);
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const shape = new THREE.TubeGeometry(curve, segments, radius, 4, false);
  b.put(shape, 0, 0, 0, color);
  for (const p of [points[0], points.at(-1)]) b.put(DOT, ...p, color, radius);
  shape.dispose();
}
function pupil(b, x, y, z, color, sx, sy = sx) {
  ball(b, color, x, y, z, sx, sy, .018);
  b.put(DOT, x - sx * .2, y + sy * .25, z + .017, '#ffffff', .009);
}
function outlinedEye(b, x, y, z, sx, sy, outline, iris, pupilSize = .025) {
  ball(b, outline, x, y, z, sx, sy, .035);
  ball(b, WHITE, x, y, z + .022, sx * .81, sy * .83, .026);
  pupil(b, x + sx * .06, y, z + .049, iris, pupilSize, pupilSize * 1.15);
}

function buildBlue(b) {
  const blue = '#99b9ee';
  ball(b, blue, 0, .97, 0, .65, .49, .32, false);
  // A second curved line crosses the domed head, just as in the blue marker drawing.
  stroke(b, NAVY, [[-.59, .94, .18], [-.38, 1.21, .27], [0, 1.36, .25], [.37, 1.27, .20], [.59, 1.09, .16]], .026, 12);
  for (const s of [-1, 1]) {
    rod(b, NAVY, [s * .54, .86, 0], [s * 1.04, .86, .01], .027);
    ball(b, NAVY, s * 1.04, .86, .01, .029);
    rod(b, NAVY, [s * .15, .55, 0], [s * .20, .07, .02], .033);
    ball(b, NAVY, s * .20, .07, .02, .035, .04, .035);
  }
  shinyEye(b, -.22, 1.02, .27, .085, { tall: 1.45, iris: NAVY });
  shinyEye(b, .18, 1.055, .26, .14, { tall: 1.2, iris: NAVY });
  b.put(HALF, -.025, .87, .333, NAVY, [.075, .085, .25], [0, 0, Math.PI]);
  stroke(b, NAVY, [[-.57, .73, .10], [-.43, .57, .13], [-.30, .63, .19], [-.23, .57, .17]], .022, 8);
}

function buildWave(b) {
  const green = '#74b788', yellow = '#f2d765';
  ball(b, NAVY, 0, 1.0, 0, .54, .54, .28, false);
  ball(b, WHITE, 0, 1.0, .027, .505, .505, .27, false);
  // Two stalks, unequal eyes and the original green pupils.
  rod(b, NAVY, [.10, 1.48, 0], [.16, 1.77, 0], .023);
  rod(b, NAVY, [.36, 1.39, 0], [.49, 1.68, 0], .023);
  outlinedEye(b, -.22, 1.13, .266, .10, .12, NAVY, green, .023);
  outlinedEye(b, .17, 1.09, .277, .165, .195, NAVY, green, .029);
  stroke(b, NAVY, [[-.18, .85, .278], [.02, .83, .293], [.15, .87, .292], [.17, .94, .300]], .019, 8);
  for (const s of [-1, 1]) {
    rod(b, NAVY, [s * .20, .55, 0], [s * .23, .10, .02], .026);
    ball(b, NAVY, s * .31, .06, .035, .14, .055, .07);
  }
  stroke(b, NAVY, [[-.46, 1.17, 0], [-.70, 1.31, 0], [-.82, 1.50, 0]], .026, 6);
  ball(b, WHITE, -.92, 1.51, .015, .17, .105, .075);
  for (let i = 0; i < 3; i++) {
    const x = -1.07 + i * .13;
    b.put(LOOP, x, 1.66, .005, green, [.064, .15, .30]);
    rod(b, NAVY, [x, 1.51, .055], [x - .015, 1.75, .055], .018);
  }
  rod(b, NAVY, [.47, .99, 0], [.91, .96, 0], .026);
  ball(b, WHITE, .96, .95, .015, .11, .105, .075);
  for (let i = 0; i < 3; i++) {
    const y = 1.08 - i * .14;
    b.put(LOOP, 1.065, y, .005, yellow, [.15, .064, .30]);
    rod(b, NAVY, [.96, .95 + (1 - i) * .05, .055], [1.18, y, .055], .018);
  }
}

function buildLongLegs(b) {
  ball(b, '#a7d8ad', 0, 1.46, 0, .36, .35, .24, false);
  // The drawing's legs are nearly as long as the rest of the character.
  for (const s of [-1, 1]) {
    rod(b, GREEN, [s * .105, 1.23, 0], [s * .13, .038, 0], .029);
    b.put(DOT, s * .13, .038, 0, GREEN, .03);
  }
  stroke(b, GREEN, [[-1.15, 1.43, .02], [-.77, 1.46, .03], [-.39, 1.40, .10], [0, 1.44, .265], [.41, 1.48, .10], [.78, 1.41, .03], [1.15, 1.44, .02]], .022, 14);
  outlinedEye(b, -.115, 1.55, .239, .075, .10, GREEN, GREEN, .017);
  outlinedEye(b, .09, 1.55, .245, .09, .08, GREEN, GREEN, .017);
  stroke(b, GREEN, [[-.12, 1.30, .213], [.03, 1.25, .215], [.20, 1.35, .205]], .018, 8);
}

function buildTeal(b) {
  const mint = '#b5dacc', yellow = '#e7cf69';
  ball(b, mint, 0, .62, 0, .13, .49, .10, false);
  ball(b, mint, 0, 1.44, 0, .43, .46, .27, false);
  for (const s of [-1, 1]) {
    rod(b, TEAL, [s * .06, .22, 0], [s * .06, .03, .01], .024);
    b.put(DOT, s * .06, .03, .01, TEAL, .025);
  }
  for (const [x, a, h] of [[-.16, -.23, 2.04], [.08, .11, 2.01], [.27, .32, 1.99]]) rod(b, TEAL, [x, 1.80, 0], [a, h, 0], .018);
  outlinedEye(b, -.13, 1.58, .25, .073, .105, TEAL, '#7eb5a5', .036);
  outlinedEye(b, .15, 1.55, .255, .09, .14, TEAL, '#7eb5a5', .043);
  stroke(b, TEAL, [[-.12, 1.37, .276], [0, 1.29, .282], [.12, 1.20, .25]], .018, 6);
  stroke(b, TEAL, [[.12, 1.37, .276], [0, 1.29, .282], [-.12, 1.20, .25]], .018, 6);
  stroke(b, TEAL, [[-.34, 1.39, 0], [-.62, 1.45, 0], [-.72, 1.72, 0]], .023, 7);
  stroke(b, TEAL, [[.34, 1.30, 0], [.68, 1.08, 0], [.76, .85, 0]], .023, 7);
  stroke(b, yellow, [[-.10, .50, .03], [-.30, .46, .03], [-.47, .56, .03]], .018, 7);
  stroke(b, yellow, [[.10, .49, .03], [.31, .46, .03], [.54, .57, .03]], .018, 7);
  // The tiny smiling doodle stays a tummy design on this one resident, rather than inventing a separate character.
  ball(b, TEAL, 0, .65, .106, .087, .105, .024);
  ball(b, mint, 0, .65, .123, .073, .088, .018);
  for (const s of [-1, 1]) b.put(DOT, s * .028, .675, .143, TEAL, .009);
  b.put(HALF, 0, .631, .145, TEAL, [.034, .025, .12], [0, 0, Math.PI]);
  rod(b, TEAL, [0, .55, .118], [0, .40, .118], .012);
  for (const s of [-1, 1]) {
    rod(b, TEAL, [0, .50, .118], [s * .075, .53, .118], .011);
    rod(b, TEAL, [0, .40, .118], [s * .032, .29, .118], .011);
  }
  rod(b, TEAL, [-.013, .74, .12], [.02, .81, .12], .014);
}

function buildScribble(b) {
  const pale = '#c7d398';
  ball(b, pale, -.08, 1.11, 0, .50, .58, .30, false);
  ball(b, pale, .35, 1.02, -.005, .23, .39, .25, false);
  for (const s of [-1, 1]) rod(b, OLIVE, [s * .20, .71, 0], [s * .20, .09, .015], .026);
  ball(b, OLIVE, -.20, .055, .015, .055, .05, .07);
  ball(b, OLIVE, .29, .08, .045, .26, .08, .18);
  rod(b, OLIVE, [.40, 1.35, 0], [.49, 1.68, 0], .019);
  stroke(b, OLIVE, [[.48, 1.09, 0], [.66, .88, 0], [.68, .66, 0]], .022, 6);
  outlinedEye(b, -.25, 1.22, .282, .17, .24, OLIVE, PINK, .035);
  outlinedEye(b, .18, 1.25, .286, .20, .25, PINK, PINK, .035);
  outlinedEye(b, -.015, .98, .306, .09, .062, OLIVE, PINK, .023);
  const surface = (x, y) => {
    const main = .30 * Math.sqrt(Math.max(0, 1 - ((x + .08) / .50) ** 2 - ((y - 1.11) / .58) ** 2));
    const side = .25 * Math.sqrt(Math.max(0, 1 - ((x - .35) / .23) ** 2 - ((y - 1.02) / .39) ** 2));
    return Math.max(main, side) + .025;
  };
  for (let i = 0; i < 8; i++) {
    const endX = -.20 + i * .078, endY = .64 + (i % 3) * .065, midX = (-.015 + endX) / 2, midY = (.95 + endY) / 2;
    stroke(b, PINK, [[-.015 + (i % 2) * .025, .945, .325], [midX, midY, surface(midX, midY)], [endX, endY, surface(endX, endY)]], .016, 6);
  }
}

export const MARKER_FRIENDS = {
  drawingblue: { name: 'Blue Drawing Friend', planet: 'earth', move: 'hop', v: .65, r: 1.1, size: 1, hopH: .10, emoji: '🖍️',
    voice: 'Hello! Your drawing came to life! Let’s sing together!', build: buildBlue },
  drawingwave: { name: 'Waving Drawing Friend', planet: 'earth', move: 'hop', v: .65, r: 1.1, size: 1, hopH: .10, emoji: '🖍️',
    voice: 'Hello! Wave your hands and dance with me!', build: buildWave },
  drawinglonglegs: { name: 'Long-Legged Drawing Friend', planet: 'earth', move: 'slide', v: .45, r: 1.0, size: 1, emoji: '🖍️',
    voice: 'Hello! My long arms have a big hug for you!', build: buildLongLegs },
  drawingteal: { name: 'Teal Drawing Friend', planet: 'earth', move: 'bounce', v: .6, r: 1.1, size: 1, hopH: .14, emoji: '🖍️',
    voice: 'Hello! Let’s jump together! Boing, boing!', build: buildTeal },
  drawingscribble: { name: 'Scribble Drawing Friend', planet: 'earth', move: 'hop', v: .6, r: 1.1, size: 1, hopH: .12, emoji: '🖍️',
    voice: 'Hello! Let’s make happy pink sparkles!', build: buildScribble },
};
