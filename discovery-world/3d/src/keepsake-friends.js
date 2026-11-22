// Seven unique family keepsakes become solid painted toys. The photographs stay private.
// Both pairs of paper twins are separate residents in doodle-friends.js.
import * as THREE from 'three';

const BALL = new THREE.SphereGeometry(1, 12, 9);
const SMALL = new THREE.SphereGeometry(1, 8, 6);
const DOT = new THREE.SphereGeometry(1, 6, 4);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6);
const CONE = new THREE.ConeGeometry(1, 1, 8);
const UP = new THREE.Vector3(0, 1, 0);
const PALE = '#fff6df', BLUE = '#354db0', GREEN = '#378e55', BROWN = '#856a4a', INK = '#375768';

function ball(b, color, x, y, z, sx, sy = sx, sz = sx, large = false, rot) {
  b.put(large ? BALL : SMALL, x, y, z, color, [sx, sy, sz], rot);
}
function rod(b, color, a, c, radius = .025) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...c), d = end.clone().sub(start);
  const rot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()));
  const p = start.add(end).multiplyScalar(.5);
  b.put(CYL, p.x, p.y, p.z, color, [radius, d.length(), radius], rot.toArray());
}
function stroke(b, color, points, radius = .022, segments = 7, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  const shape = new THREE.TubeGeometry(curve, segments, radius, 4, closed);
  b.put(shape, 0, 0, 0, color); shape.dispose();
  if (!closed) for (const p of [points[0], points.at(-1)]) b.put(DOT, ...p, color, radius);
}
function ellipse(b, color, cx, cy, rx, ry, surface, radius = .02, segments = 16) {
  const p = Array.from({ length: segments }, (_, i) => {
    const a = i / segments * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    return [x, y, typeof surface === 'function' ? surface(x, y) : surface];
  });
  stroke(b, color, p, radius, segments, true);
}
function solid(b, color, points, depth = .32, z = 0) {
  const s = new THREE.Shape(); s.moveTo(...points[0]); for (const p of points.slice(1)) s.lineTo(...p); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .025, bevelThickness: .025, curveSegments: 3 });
  b.put(g, 0, 0, z - depth / 2, color); g.dispose();
}
function star(b, color, x, y, radius, surface) {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + i * Math.PI / 5, r = radius * (i % 2 ? .43 : 1), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    return [px, py, surface(px, py)];
  });
  stroke(b, color, p, .016, 10, true);
}

function snow(b) {
  const white = '#f6f5e9', coal = '#4d473f';
  ball(b, white, 0, .42, 0, .48, .42, .35, true);
  ball(b, white, 0, .97, 0, .38, .39, .30, true);
  ball(b, white, 0, 1.48, 0, .31, .33, .27, true);
  for (const s of [-1, 1]) {
    ball(b, white, s * .38, 1.08, -.01, .18, .32, .17);
    ball(b, white, s * .46, 1.35, -.01, .15, .32, .15);
    ball(b, white, s * .50, 1.60, -.01, .125, .24, .125);
  }
  // The family's snow sculpture has a broad flat snow hat, no invented carrot nose or buttons.
  // Beveled snow slabs overlap the head and each other: a connected blocky hat, not floating discs.
  solid(b, white, [[-.40, 1.71], [.40, 1.71], [.38, 1.85], [-.39, 1.85]], .50);
  solid(b, white, [[-.30, 1.81], [.30, 1.81], [.26, 2.00], [-.28, 1.99]], .40);
  ball(b, coal, -.10, 1.55, .252, .026, .035, .023);
  ball(b, coal, .105, 1.565, .25, .035, .043, .025);
  stroke(b, coal, [[-.15, 1.40, .242], [0, 1.40, .277], [.15, 1.40, .242]], .012, 6);
}

function tuft(b) {
  ball(b, BROWN, 0, .80, 0, .43, .43, .28, true);
  ball(b, PALE, 0, .80, .018, .406, .406, .275, true);
  // Unequal green scribble tufts and a little beard, rather than a generic animal's ears.
  ball(b, GREEN, -.07, 1.26, -.025, .18, .19, .13, false, [0, 0, -.35]);
  ball(b, GREEN, .43, 1.03, -.015, .25, .15, .13, false, [0, 0, .45]);
  rod(b, GREEN, [.32, 1.08, 0], [.62, 1.30, 0], .023);
  rod(b, GREEN, [-.16, 1.19, 0], [-.11, 1.45, 0], .022);
  stroke(b, GREEN, [[-.09, .46, .04], [0, .29, .12], [.10, .44, .09]], .032, 5);
  for (const s of [-1, 1]) {
    stroke(b, GREEN, [[s * .1, .43, 0], [s * .18, .15, 0], [s * .39, .21, .02], [s * .50, .04, .02]], .023, 6);
    ball(b, BROWN, s * .11, .85, .287, .016, .017, .012);
  }
  stroke(b, BROWN, [[-.09, .66, .276], [0, .61, .285], [.08, .66, .276]], .018, 5);
  rod(b, BROWN, [-.38, .84, 0], [-.80, .87, 0], .025);
  rod(b, BROWN, [.38, .75, 0], [.81, .72, 0], .025);
  for (const [dx, dy] of [[-.075, 0], [.075, 0], [0, -.075], [0, .075]]) {
    ball(b, BROWN, -.88 + dx, .96 + dy, 0, .092, .092, .06);
    ball(b, PALE, -.88 + dx, .96 + dy, .018, .070, .070, .055);
  }
  rod(b, GREEN, [-.87, 1.0, .025], [-.86, 1.88, .025], .027);
  ball(b, GREEN, -.82, 1.66, .025, .075, .34, .07, false, [0, 0, -.18]);
  ball(b, GREEN, -.95, 1.61, .025, .065, .28, .06, false, [0, 0, -.32]);
}

function tall(b) {
  // A spun pear gives the narrow top and broad low belly real depth on every side.
  const g = new THREE.LatheGeometry([[.0, .27], [.24, .31], [.39, .52], [.43, .82], [.37, 1.20], [.26, 1.64], [.19, 1.95], [0, 1.98]].map(p => new THREE.Vector2(...p)), 14);
  b.put(g, 0, 0, 0, '#d5e0ef', [1, 1, .75]); g.dispose();
  stroke(b, BLUE, [[-.20, 1.91, .025], [-.28, 1.59, .025], [-.38, 1.13, .025], [-.42, .72, .025], [-.28, .36, .025], [0, .28, .025], [.29, .38, .025], [.43, .75, .025], [.35, 1.24, .025], [.19, 1.94, .025]], .024, 16);
  stroke(b, BLUE, [[-.35, 1.02, 0], [-.66, .97, 0], [-.92, .89, .01]], .024, 5);
  stroke(b, BLUE, [[.33, 1.23, 0], [.64, 1.39, 0], [.95, 1.45, .01]], .024, 5);
  for (const s of [-1, 1]) stroke(b, BLUE, [[s * .17, .36, 0], [s * .29, .15, 0], [s * .44, .08, .02]], .024, 5);
  ball(b, BLUE, -.13, 1.29, .274, .036, .064, .024);
  ball(b, BLUE, .13, 1.22, .285, .065, .088, .025, false, [0, 0, .35]);
  for (const x of [-.07, .08]) ball(b, BLUE, x, 1.01, .318, .025, .031, .022);
  ball(b, BLUE, -.035, .86, .327, .022, .036, .022);
  stroke(b, BLUE, [[-.16, .78, .307], [-.08, .70, .327], [0, .69, .334], [.10, .76, .318]], .023, 7);
}

function ears(b) {
  ball(b, INK, -.46, 1.66, -.03, .17, .41, .14, false, [0, 0, .60]);
  ball(b, PALE, -.46, 1.66, -.007, .145, .385, .14, false, [0, 0, .60]);
  ball(b, INK, .49, 1.39, -.02, .245, .265, .16);
  ball(b, PALE, .49, 1.39, .002, .22, .24, .16);
  solid(b, INK, [[-.02, 1.47], [-.06, 1.80], [.10, 2.01], [.42, 2.03], [.58, 1.91], [.32, 1.91], [.20, 1.78], [.17, 1.48]], .14, -.02);
  solid(b, PALE, [[.015, 1.53], [-.018, 1.79], [.12, 1.97], [.41, 1.99], [.47, 1.95], [.30, 1.95], [.17, 1.80], [.13, 1.53]], .11, .017);
  ball(b, INK, 0, .89, 0, .51, .65, .29, true);
  ball(b, PALE, 0, .89, .017, .486, .626, .289, true);
  const left = [[-.38, .99], [-.36, 1.31], [-.12, 1.19], [-.11, 1.05]];
  solid(b, INK, left, .025, .29);
  solid(b, PALE, [[-.35, 1.02], [-.33, 1.27], [-.15, 1.17], [-.14, 1.07]], .022, .315);
  solid(b, INK, [[.0, .81], [.15, 1.19], [.30, 1.11], [.35, .98]], .025, .29);
  solid(b, PALE, [[.045, .86], [.16, 1.15], [.27, 1.09], [.31, .99]], .022, .315);
  rod(b, INK, [-.23, 1.15, .357], [-.23, 1.08, .357], .015);
  rod(b, INK, [.17, 1.03, .357], [.17, .96, .357], .015);
  stroke(b, INK, [[-.20, .67, .281], [-.06, .61, .303], [.04, .65, .299]], .019, 6);
  for (const s of [-1, 1]) {
    rod(b, INK, [s * .46, .89, 0], [s * 1.02, .96, .015], .022);
    stroke(b, INK, [[s * .15, .29, 0], [s * .25, .07, 0], [s * .46, .09, .025]], .023, 5);
  }
}

function flower(b) {
  const blue = '#6c9fc1';
  solid(b, blue, [[.20, .10], [-.32, .20], [-.57, .52], [-.39, .89], [.27, 1.03], [.27, .16]], .31);
  solid(b, PALE, [[.18, .14], [-.29, .24], [-.52, .52], [-.36, .85], [.23, .98], [.23, .19]], .28, .03);
  for (const p of [ [[-.42, .73, .20], [-.11, .69, .21], [.25, .61, .20]], [[-.50, .56, .20], [0, .52, .21], [.25, .43, .20]], [[-.32, .30, .20], [-.02, .28, .21], [.23, .19, .20]] ]) stroke(b, blue, p, .018, 6);
  // Each lobe is a rounded volume; the face bridges them as one soft flower toy.
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * 2 * i / 8, x = Math.cos(a) * .36, y = 1.43 + Math.sin(a) * .36, r = a - Math.PI / 2;
    ball(b, blue, x, y, -.01, .19, .24, .20, false, [0, 0, r]);
    ball(b, PALE, x, y, .014, .17, .22, .20, false, [0, 0, r]);
  }
  ball(b, PALE, 0, 1.43, .015, .38, .38, .235, true);
  rod(b, blue, [-.12, 1.56, .25], [-.10, 1.40, .26], .017);
  rod(b, blue, [.13, 1.56, .25], [.12, 1.40, .26], .017);
  stroke(b, blue, [[-.15, 1.35, .253], [-.03, 1.32, .265], [.09, 1.36, .261]], .017, 6);
}

function balloon(b) {
  const yellow = '#f3db25', purple = '#684185';
  ball(b, yellow, 0, 1.15, 0, .57, .71, .43, true);
  b.put(CONE, 0, .415, 0, yellow, [.078, .14, .07], [0, 0, Math.PI]);
  stroke(b, purple, [[0, .35, 0], [.03, .21, 0], [-.025, .09, 0], [.07, .025, 0]], .014, 7);
  const surface = (x, y) => .43 * Math.sqrt(Math.max(0, 1 - (x / .57) ** 2 - ((y - 1.15) / .71) ** 2)) + .023;
  ellipse(b, purple, -.24, 1.22, .095, .14, surface, .019, 14);
  ellipse(b, purple, .21, 1.12, .19, .22, surface, .021, 18);
  ball(b, purple, -.25, 1.25, surface(-.25, 1.25), .025, .030, .018);
  ellipse(b, purple, .21, 1.12, .047, .047, surface, .015, 12);
  ball(b, purple, .21, 1.12, surface(.21, 1.12), .013, .013, .018);
  ellipse(b, purple, -.01, 1.57, .34, .12, surface, .020, 18);
  star(b, purple, .30, 1.48, .055, surface);
  star(b, purple, .35, .95, .055, surface);
  const smile = [[-.25, .88], [-.12, .78], [0, .76], [.16, .79], [.25, .84]].map(([x, y]) => [x, y, surface(x, y)]);
  stroke(b, purple, smile, .023, 9);
}

function chalk(b) {
  const hair = '#ac866e', chalk = '#edf5eb', shirt = '#a791d6', shorts = '#48bce2', face = '#d4b69e', blue = '#8dbbd6';
  // Long hair remains behind the face and falls beside both sleeves.
  ball(b, hair, 0, 1.64, -.065, .31, .36, .19, true);
  for (const s of [-1, 1]) ball(b, hair, s * .245, 1.31, -.04, .085, .40, .14);
  ball(b, face, 0, 1.68, .035, .217, .24, .17, true);
  solid(b, shirt, [[-.31, 1.40], [.31, 1.40], [.27, .81], [-.27, .81]], .30);
  for (const s of [-1, 1]) {
    rod(b, shirt, [s * .23, 1.31, 0], [s * .43, 1.28, .01], .10);
    rod(b, face, [s * .43, 1.28, .01], [s * .76, 1.23, .025], .052);
    rod(b, chalk, [s * .46, 1.315, .05], [s * .77, 1.265, .065], .009);
    ball(b, face, s * .79, 1.22, .025, .085, .06, .065);
    ball(b, shorts, s * .15, .66, 0, .17, .20, .16);
    rod(b, face, [s * .16, .53, 0], [s * .23, .12, .02], .055);
    rod(b, chalk, [s * .205, .52, .045], [s * .275, .13, .065], .009);
    ball(b, face, s * .28, .065, .065, .14, .06, .085);
    ball(b, chalk, s * .074, 1.73, .196, .048, .032, .016);
    ball(b, blue, s * .074, 1.73, .210, .019, .018, .011);
  }
  solid(b, '#db95be', [[-.17, .94], [.17, .94], [.17, 1.25], [-.17, 1.25]], .015, .179);
  solid(b, '#eadc70', [[-.125, .98], [.125, .98], [.125, 1.21], [-.125, 1.21]], .014, .201);
  ball(b, '#eadc70', .19, .61, .153, .04, .09, .015);
  stroke(b, blue, [[-.035, 1.69, .211], [0, 1.66, .220], [.025, 1.69, .213]], .011, 5);
  stroke(b, chalk, [[-.10, 1.65, .195], [0, 1.62, .218], [.10, 1.65, .195]], .014, 6);
}

const species = (name, voice, build, action, line, colors, move = 'hop') => ({
  name, planet: 'earth', move, v: .55, r: 1.1, size: 1, hopH: .10, emoji: '🖍️', voice, build,
  play: { action, line, colors },
});
export const KEEPSAKE_FRIENDS = {
  keepsakesnow: species('Snow Sculpture Friend', 'Hello! I am your snow sculpture friend! Let’s wave our snowy arms!', snow, 'twirl', 'Snowy arms up! Let’s dance!', ['#f6f5e9', '#a7d8ee']),
  doodletuft: species('Green Tuft Friend', 'Hello! My green brush is ready! Let’s make little green sparkles!', tuft, 'sparkle', 'Swish, swish! Green sparkles!', [GREEN, '#d5eb8c']),
  doodletall: species('Tall Blue Friend', 'Hello down there! Let’s sing a tall, happy song!', tall, 'sing', 'La, la, la! Sing along!', [BLUE, '#bed7ef']),
  doodleears: species('Big-Eared Friend', 'Hello! My big ears can hear your happy song!', ears, 'sing', 'I hear you! Let’s sing together!', ['#6aa59b', '#d6e9c1']),
  doodleflower: species('Flower Drawing Friend', 'Hello! My petals are ready for a flower dance!', flower, 'twirl', 'Round and round! Petal dance!', ['#6c9fc1', '#f5d4df']),
  keepsakeballoon: species('Yellow Balloon Friend', 'Hello! A sunny balloon hug is floating your way!', balloon, 'hug', 'A big sunny balloon hug!', ['#f3db25', '#684185'], 'float'),
  keepsakechalk: species('Chalk Person Friend', 'Hello! Your chalk drawing came to life! Let’s jump together!', chalk, 'bounce', 'Ready, steady, jump!', ['#a791d6', '#48bce2', '#eadc70'], 'bounce'),
};
