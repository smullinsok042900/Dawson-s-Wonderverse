// Family-made animal crafts and crayon creatures, built as rounded toy volumes.
// The unusual sticker eyes, hand-drawn additions and scribbles are painted geometry, never photographs.
// Each builder feeds one existing resident batch and reuses the world's shiny material.
import * as THREE from 'three';

const BALL = new THREE.SphereGeometry(1, 12, 8);
const SMALL = new THREE.SphereGeometry(1, 8, 6);
const DOT = new THREE.SphereGeometry(1, 6, 4);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const HANDLE = new THREE.TorusGeometry(1, .22, 4, 8);
const CONE = new THREE.ConeGeometry(1, 1, 8);
const UP = new THREE.Vector3(0, 1, 0);
const CREAM = '#fff5e7', DARK = '#513b46', PINK = '#ed88a9', CHEEK = '#e988aa';
const YELLOW = '#efc55f', ORANGE = '#e99656', BROWN = '#896b6d', PURPLE = '#9468c9';
const BLUE = '#5769b3', LILAC = '#be81c2', GREY = '#b3a6ac';

function ball(b, color, x, y, z, sx, sy = sx, sz = sx, detail = false) {
  b.put(detail ? BALL : SMALL, x, y, z, color, [sx, sy, sz]);
}
function rod(b, color, a, c, r = .024, caps = true) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...c), delta = q.clone().sub(p), center = p.clone().add(q).multiplyScalar(.5);
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, delta.clone().normalize()));
  b.put(CYL, center.x, center.y, center.z, color, [r, delta.length(), r], e.toArray());
  if (caps) for (const v of [a, c]) b.put(DOT, ...v, color, r);
}
function stroke(b, color, points, r = .022, segments = 8, closed = false, radial = 4) {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed), segments, r, radial, closed);
  b.put(g, 0, 0, 0, color); g.dispose();
  if (!closed) for (const p of [points[0], points.at(-1)]) b.put(DOT, ...p, color, r);
}
function plaque(b, color, points, z, depth = .035, bevel = .008) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, z - depth / 2); b.put(g, 0, 0, 0, color); g.dispose();
}
const headZ = (x, y, cy = 1.30, sx = .65, sy = .55, sz = .40) => sz * Math.sqrt(Math.max(.01, 1 - (x / sx) ** 2 - ((y - cy) / sy) ** 2));
function head(b, color, cy = 1.30) { ball(b, color, 0, cy, 0, .65, .55, .40, true); }
function torso(b, color, belly = CREAM, arms = true, feet = true) {
  ball(b, color, 0, .48, -.015, .29, .43, .25, true);
  ball(b, belly, 0, .47, .206, .22, .29, .055);
  for (const s of [-1, 1]) {
    if (arms) ball(b, color, s * .34, .55, -.005, .115, .235, .12);
    if (feet) ball(b, color, s * .18, .115, .045, .15, .115, .20);
  }
}
function ear(b, color, inner, s, top = 2.08, width = .76) {
  plaque(b, color, [[s * .32, 1.64], [s * width, top], [s * .66, 1.36]], -.005, .25, .035);
  plaque(b, inner, [[s * .40, 1.64], [s * (width - .035), top - .10], [s * .62, 1.49]], .152, .022, .008);
}
function eye(b, x, y, sx = .125, sy = .16, color = DARK, z = headZ(x, y) + .025) {
  ball(b, color, x, y, z, sx, sy, .052);
  b.put(DOT, x + .025, y + .055, z + .049, CREAM, [.040, .045, .018]);
  b.put(DOT, x - .035, y - .055, z + .047, CREAM, [.022, .026, .015]);
  return z + .055;
}
function cheeks(b, y = 1.08) {
  for (const s of [-1, 1]) ball(b, CHEEK, s * .43, y, headZ(s * .43, y) + .022, .072, .066, .025);
}
function smile(b, x, y, z, color = DARK, width = .16) {
  stroke(b, color, [[x - width, y + .05, z], [x - width * .55, y - .02, z + .012], [x, y - .035, z + .015], [x + width * .60, y - .015, z + .012], [x + width, y + .05, z]], .018, 8);
}
function heart(b, x, y, z, size = .1, color = PINK) {
  const p = [[0, -.9], [-.85, -.12], [-.90, .45], [-.55, .73], [0, .40], [.55, .73], [.90, .45], [.85, -.12]].map(([a, c]) => [x + a * size, y + c * size]);
  plaque(b, color, p, z, .028, .008);
}
function star(b, x, y, z, size, color) {
  plaque(b, color, Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? size * .43 : size; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; }), z, .02, .003);
}
function tail(b, color, side = 1, tip = CREAM) {
  stroke(b, color, [[side * .21, .32, -.12], [side * .58, .24, -.13], [side * .80, .45, -.09], [side * .91, .73, -.03]], .105, 10, false, 6);
  stroke(b, tip, [[side * .86, .61, -.07], [side * .91, .73, -.03], [side * 1.01, .79, .01]], .090, 5, false, 6);
}

function yellowCat(b) {
  torso(b, '#e6bb62'); tail(b, '#e6bb62'); head(b, '#e6bb62');
  for (const s of [-1, 1]) { ear(b, '#e6bb62', '#ee9bb9', s); ball(b, CREAM, s * .18, .085, .15, .15, .085, .14); }
  ball(b, CREAM, 0, 1.07, .365, .255, .17, .10);
  ball(b, PINK, 0, 1.14, .466, .070, .035, .025);
  smile(b, -.095, 1.04, .47, DARK, .10); smile(b, .095, 1.04, .47, DARK, .10);
  cheeks(b);
  const z = headZ(-.23, 1.35) + .04;
  ball(b, '#f1c6d3', -.23, 1.35, z, .145, .145, .042);
  ball(b, DARK, -.23, 1.35, z + .032, .115, .115, .030);
  for (const s of [-1, 1]) rod(b, CREAM, [-.23 - .06, 1.35 + s * .06, z + .066], [-.23 + .06, 1.35 - s * .06, z + .066], .014);
  const rz = eye(b, .23, 1.40, .13, .18);
  for (const [dx, dy] of [[-.08, .16], [0, .20], [.08, .17]]) rod(b, DARK, [.23 + dx * .7, 1.52, rz - .02], [.23 + dx, 1.40 + dy, rz - .02], .016);
  for (let i = 0; i < 3; i++) b.put(DOT, -.37 - i * .025, 1.57 + i * .065, headZ(-.37 - i * .025, 1.57 + i * .065) + .025, '#f1c6d3', .021 + i * .006);
  ball(b, '#e77f86', .26, 1.16, .397, .095, .046, .022);
  for (const s of [-1, 1]) for (const y of [1.08, 1.14]) rod(b, DARK, [s * .50, y, .27], [s * .58, y + .01, .19], .012, false);
}

function panda(b, seated) {
  if (seated) {
    ball(b, CREAM, 0, .43, -.015, .31, .37, .26, true);
    for (const s of [-1, 1]) {
      ball(b, BROWN, s * .27, .16, .12, .22, .16, .20);
      ball(b, '#e898b6', s * .27, .155, .307, .105, .088, .025);
      for (const dx of [-.085, 0, .085]) b.put(DOT, s * .27 + dx, .26 + (dx === 0 ? .025 : 0), .28, '#e898b6', [.037, .043, .020]);
      ball(b, BROWN, s * .13, .48, .24, .115, .14, .055);
    }
  } else {
    torso(b, CREAM, CREAM, false);
    for (const s of [-1, 1]) { ball(b, BROWN, s * .45, .66, -.02, .23, .115, .115); ball(b, BROWN, s * .18, .115, .045, .15, .115, .20); }
  }
  head(b, CREAM, 1.28);
  for (const s of [-1, 1]) {
    ball(b, BROWN, s * .46, 1.75, -.025, .22, .23, .14);
    ball(b, '#d79caa', s * .46, 1.76, .092, .13, .15, .038);
    ball(b, BROWN, s * .24, 1.31, .37, .165, .18, .045);
  }
  if (seated) {
    eye(b, -.24, 1.31, .11, .12, DARK, .42);
    // One eye deliberately stays a plain patch, as in the family's first panda craft.
    plaque(b, CREAM, [[-.035, 1.80], [.02, 1.94], [.07, 1.80]], -.025, .13, .012);
    ball(b, DARK, 0, 1.15, .414, .075, .05, .035);
  } else {
    for (const s of [-1, 1]) {
      const z = eye(b, s * .24, 1.31, .10, .16, DARK, .415);
      stroke(b, CREAM, [[s * .24 - .06, 1.46, z], [s * .24 - .10, 1.36, z + .005], [s * .24 + .015, 1.18, z]], .018, 7);
      stroke(b, DARK, [[s * .35, 1.17, .35], [s * .37, 1.12, .34]], .018, 4);
    }
    ball(b, DARK, 0, 1.17, .42, .085, .044, .035);
    ball(b, PINK, .015, 1.02, .403, .055, .077, .025);
    stroke(b, DARK, [[-.06, 1.00, .40], [-.02, 1.06, .42], [.03, 1.00, .43]], .016, 5);
  }
  cheeks(b, 1.10);
}

function dadDuck(b) {
  ball(b, CREAM, 0, .49, -.02, .30, .39, .25, true);
  // Pale wings carry his blue star decorations and his two favourite craft props.
  for (const s of [-1, 1]) {
    ball(b, '#f0d6ae', s * .50, .75, 0, .34, .15, .13);
    star(b, s * .52, .78, .132, .074, '#5d86ce');
    ball(b, '#e7a297', s * .20, .11, .07, .20, .11, .25);
    for (let i = 0; i < 3; i++) rod(b, DARK, [s * .20 - .075 + i * .055, .14, .31], [s * .20 - .075 + i * .055, .19, .19], .011, false);
  }
  head(b, PURPLE, 1.35);
  plaque(b, PURPLE, [[-.28, 1.81], [-.39, 2.03], [-.13, 1.96], [-.14, 2.13], [.08, 2.01], [.22, 1.90]], -.02, .26, .02);
  ball(b, '#efb29d', 0, 1.08, .35, .56, .245, .265, true);
  for (const s of [-1, 1]) {
    ball(b, '#d57791', s * .20, 1.18, .589, .044, .026, .016);
    ball(b, '#c6b8ac', s * .23, 1.48, .395, .072, .080, .035);
    ball(b, '#8b7a73', s * .23, 1.48, .429, .048, .055, .018);
    heart(b, s * .23, 1.48, .450, .021, '#e1b18e');
    stroke(b, '#674b45', [[s * .12, 1.68, .29], [s * .26, 1.70, .26], [s * .40, 1.67, .19]], .034, 5);
  }
  plaque(b, '#674b45', [[-.34, 1.13], [-.19, 1.17], [0, 1.13], [.19, 1.17], [.34, 1.13], [.33, .99], [.20, 1.02], [.15, .98], [.07, 1.02], [0, .98], [-.07, 1.02], [-.16, .99], [-.23, 1.02], [-.34, .99]], .616, .035, .008);
  ball(b, '#d96f91', .23, .94, .629, .080, .13, .042);
  plaque(b, '#674b45', [[-.13, .88], [.13, .88], [.12, .76], [.05, .70], [0, .73], [-.04, .69], [-.11, .76]], .421, .04, .008);
  plaque(b, '#d667a0', [[0, .78], [-.075, .69], [-.04, .60], [-.13, .39], [0, .26], [.13, .39], [.04, .60], [.075, .69]], .270, .04, .008);
  // No text is needed to recognize the little ramen packet and steaming coffee cup.
  b.put(BOX, -.91, .90, .04, '#f0d6ae', [.20, .27, .08], [0, 0, -.28]);
  for (let i = 0; i < 3; i++) stroke(b, '#c39469', [[-1.00, .96 - i * .055, .088], [-.94, .98 - i * .055, .089], [-.86, .95 - i * .055, .089]], .008, 4);
  // His wing actually touches the cup: keep all cup parts together as it sits against the raised wing tip.
  b.put(CYL, .82, .84, .045, '#f7f1df', [.10, .20, .10]);
  b.put(CYL, .82, .945, .045, '#6d5142', [.081, .012, .081]);
  b.put(HANDLE, .93, .85, .045, '#f7f1df', [.07, .075, .07]);
  stroke(b, '#e1d4cf', [[.81, .97, .04], [.77, 1.07, .04], [.83, 1.15, .04]], .012, 7);
}

function patchPuppy(b) {
  torso(b, ORANGE, CREAM, false, false); head(b, CREAM);
  ball(b, ORANGE, -.41, .64, .005, .22, .105, .12);
  ball(b, CREAM, -.54, .64, .020, .09, .105, .125);
  ball(b, ORANGE, .34, .55, -.005, .115, .235, .12);
  ball(b, CREAM, .37, .41, .025, .105, .10, .11);
  // One little foot kicks outward while the other stays planted, as on this craft.
  b.put(SMALL, -.31, .23, .08, ORANGE, [.20, .115, .17], [0, 0, -.40]);
  b.put(SMALL, -.39, .25, .13, CREAM, [.13, .095, .14], [0, 0, -.40]);
  ball(b, ORANGE, .18, .115, .045, .15, .115, .20);
  ball(b, CREAM, .18, .085, .15, .15, .085, .14);
  // The orange patches wrap the eye sockets; the white blaze stays broad between them.
  for (const s of [-1, 1]) {
    ball(b, ORANGE, s * .40, 1.33, .185, .27, .40, .195);
    ball(b, ORANGE, s * .52, 1.70, .025, .255, .30, .15);
    for (let i = 0; i < 3; i++) b.put(DOT, s * (.47 + i * .055), 1.64 + (i % 2) * .07, .175, '#cc7859', .025);
    eye(b, s * .29, 1.32, .145, .18, DARK, .375);
    ball(b, CHEEK, s * .46, 1.08, .315, .075, .07, .022);
  }
  tail(b, ORANGE, 1);
  ball(b, '#8c9edb', 0, 1.00, .389, .225, .115, .10);
  smile(b, 0, .98, .491, DARK, .17);
  ball(b, PINK, 0, .90, .476, .085, .055, .022);
  for (const s of [-1, 1]) plaque(b, CREAM, [[s * .12 - .018, .965], [s * .12 + .018, .965], [s * .12, .908]], .503, .025, .004);
  for (const s of [-1, 1]) rod(b, '#5769b3', [s * .045, 1.035, .489], [s * .037, 1.055, .482], .009, false);
}

function rainbowCorgi(b) {
  torso(b, BLUE, CREAM, false);
  for (const s of [-1, 1]) {
    ball(b, CREAM, s * .31, .13, .12, .18, .13, .18);
    ball(b, CHEEK, s * .31, .14, .285, .09, .08, .022);
    ball(b, CREAM, s * .13, .17, .21, .12, .17, .14);
  }
  head(b, '#e4ac91', 1.28);
  // Blue-to-purple ears, fluffy cream cheeks and a tiny striped horn.
  for (const s of [-1, 1]) {
    ear(b, BLUE, '#e8acc9', s, 2.10, .81);
    plaque(b, YELLOW, [[s * .44, 1.60], [s * .63, 1.92], [s * .63, 1.70], [s * .72, 1.74], [s * .61, 1.50]], .183, .025, .008);
    ball(b, CREAM, s * .28, 1.01, .30, .34, .17, .16);
    eye(b, s * .25, 1.35, .12, .14, DARK, .375);
    stroke(b, DARK, [[s * .11, 1.58, .29], [s * .28, 1.61, .28], [s * .43, 1.57, .22]], .041, 6);
  }
  ball(b, CREAM, 0, .53, .18, .31, .27, .10);
  for (const s of [-1, 1]) ball(b, CREAM, s * .22, .54, .16, .16, .20, .10);
  b.put(CONE, 0, 1.97, .02, LILAC, [.105, .32, .105]);
  stroke(b, '#dfb3d7', [[-.075, 1.91, .04], [0, 1.90, .105], [.075, 1.91, .04]], .012, 6);
  stroke(b, '#dfb3d7', [[-.045, 2.02, .03], [0, 2.01, .065], [.045, 2.02, .03]], .010, 6);
  plaque(b, PURPLE, [[0, 1.26], [-.074, 1.17], [0, 1.08], [.074, 1.17]], .468, .04, .009);
  stroke(b, DARK, [[-.18, 1.00, .477], [-.10, .96, .48], [0, 1.00, .49], [.11, .97, .48], [.19, 1.02, .47]], .025, 8);
  ball(b, PINK, .11, .91, .465, .070, .086, .025);
  for (const s of [-1, 1]) ball(b, CHEEK, s * .39, 1.06, .406, .075, .04, .020);
  rod(b, '#c4778b', [-.28, .80, .22], [.28, .80, .22], .030, false);
  ball(b, YELLOW, 0, .74, .32, .075, .075, .052);
  b.put(DOT, 0, .70, .372, DARK, .018);
  stroke(b, BLUE, [[-.22, .31, -.15], [-.64, .36, -.14], [-.80, .70, -.09]], .13, 8, false, 6);
  ball(b, YELLOW, -.80, .78, -.05, .14, .23, .12);
  ball(b, CREAM, -.82, .92, -.025, .13, .18, .10);
}

function sweetRaccoon(b) {
  torso(b, GREY, '#e1d8cf'); head(b, GREY);
  for (const s of [-1, 1]) ear(b, GREY, '#796b74', s, 1.99, .71);
  ball(b, '#e1d8cf', 0, 1.27, .17, .55, .43, .25, true);
  ball(b, '#97838c', 0, 1.17, .391, .25, .21, .075);
  ball(b, DARK, 0, 1.28, .466, .065, .044, .025);
  for (const s of [-1, 1]) {
    const z = eye(b, s * .28, 1.42, .105, .13, DARK, .39);
    ball(b, '#b3a6ac', s * .28, 1.49, z + .003, .108, .066, .024);
    rod(b, DARK, [s * .28 - .065, 1.50, z + .029], [s * .28 + .055, 1.52, z + .029], .015, false);
    ball(b, CHEEK, s * .43, 1.19, .375, .065, .065, .023);
    star(b, s * .43, 1.19, .404, .037, CREAM);
  }
  smile(b, 0, 1.10, .479, CREAM, .115);
  const stripe = (x, y, z, nx, ny, nz, out) => out.set(Math.floor((y + .03) * 12) % 2 ? '#796b74' : '#e1d8cf');
  stroke(b, stripe, [[-.25, .29, -.17], [-.67, .20, -.10], [-.86, .42, -.04], [-.83, .81, .02]], .13, 12, false, 6);
  plaque(b, PINK, [[-.10, .50], [.10, .50], [.075, .32], [-.075, .32]], .281, .03, .006);
  ball(b, YELLOW, 0, .54, .285, .13, .072, .055);
  ball(b, YELLOW, .025, .60, .28, .075, .055, .050);
  rod(b, '#e1d8cf', [.38, .67, .01], [.89, .77, .03], .035);
  stroke(b, CREAM, [[.88, .73, .10], [.94, 1.00, .10], [.91, 1.13, .10]], .016, 7);
  ball(b, YELLOW, .93, 1.29, .10, .13, .20, .10);
  rod(b, '#e1d8cf', [-.38, .65, .01], [-.86, .83, .03], .035);
  b.put(HANDLE, -.92, 1.01, .10, LILAC, [.11, .13, .12]);
  b.put(HANDLE, -1.05, .89, .11, '#db9bb3', [.095, .12, .12]);
  ball(b, '#e1d8cf', -.73, .95, .10, .085, .17, .065);
  ball(b, PINK, -.73, 1.07, .15, .087, .063, .035);
  rod(b, '#c79a64', [-.73, .72, .10], [-.73, .83, .10], .023, false);
}

function orangeFox(b) {
  const fox = '#ce8055';
  torso(b, fox); tail(b, fox); head(b, fox);
  for (const s of [-1, 1]) {
    ear(b, '#896b6d', CREAM, s, 2.08, .79);
    ball(b, BROWN, s * .34, .49, .03, .11, .15, .12);
    ball(b, BROWN, s * .18, .105, .085, .15, .105, .20);
  }
  ball(b, CREAM, 0, 1.10, .36, .27, .20, .12);
  cheeks(b, 1.07);
  // One large spiral eye and the deliberately odd pig-nose sticker stay in the new toy.
  ball(b, CREAM, -.23, 1.40, .385, .14, .15, .045);
  ball(b, DARK, -.23, 1.40, .422, .12, .13, .030);
  const spiral = Array.from({ length: 21 }, (_, i) => { const t = i / 20, a = t * Math.PI * 3.8, r = .095 * (1 - t); return [-.23 + Math.cos(a) * r, 1.40 + Math.sin(a) * r, .460]; });
  stroke(b, '#efcbd5', spiral, .013, 20);
  eye(b, .23, 1.40, .12, .145, DARK, .39);
  ball(b, PINK, 0, 1.10, .503, .10, .075, .032);
  ball(b, PINK, 0, 1.18, .491, .055, .075, .029);
  for (const s of [-1, 1]) ball(b, DARK, s * .033, 1.10, .535, .010, .028, .012);
  heart(b, 0, .42, .276, .11, PINK);
}

function scribble(b, green) {
  const CY = .99, SX = .59, SY = .65, SZ = .39, ink = '#51434a', crayon = green ? '#598157' : '#dd9a5e', blue = '#433a8c';
  ball(b, CREAM, 0, CY, 0, SX, SY, SZ, true);
  const surface = (x, y, extra = .025) => SZ * Math.sqrt(Math.max(.02, 1 - (x / SX) ** 2 - ((y - CY) / SY) ** 2)) + extra;
  const rim = Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return [Math.cos(a) * .575, CY + Math.sin(a) * .63, .10]; });
  stroke(b, green ? blue : crayon, rim, .021, 28, true);
  // Thick, uneven raised crayon strokes follow the rounded surface rather than sitting on a flat panel.
  for (let i = 0; i < 7; i++) {
    const offset = -.42 + i * .14;
    const points = Array.from({ length: 7 }, (_, j) => {
      const t = j / 6, y = green ? .53 + t * .92 : .55 + t * .88;
      const x = THREE.MathUtils.clamp(offset + (green ? Math.sin(t * 5 + i) * .09 : .35 - t * .64), -.48, .48);
      const limit = SX * Math.sqrt(Math.max(.05, 1 - ((y - CY) / SY) ** 2)) * .86;
      const xx = THREE.MathUtils.clamp(x, -limit, limit);
      return [xx, y, surface(xx, y, .028)];
    });
    stroke(b, green && i % 2 ? blue : crayon, points, green ? .025 : .022, 8);
  }
  // Large dark loop eyes remain legible in front of the layered crayon marks.
  for (const s of [-1, 1]) {
    const x = s * .22, y = 1.15;
    const ring = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2, xx = x + Math.cos(a) * .095, yy = y + Math.sin(a) * .19; return [xx, yy, surface(xx, yy, .065)]; });
    stroke(b, ink, ring, .020, 14, true);
    rod(b, ink, [x - .025, 1.24, surface(x - .025, 1.24, .070)], [x + .018, 1.08, surface(x + .018, 1.08, .070)], .022);
  }
  const ySmile = green ? .65 : .72;
  const points = [[-.20, ySmile + .11], [-.12, ySmile + .01], [0, ySmile], [.15, ySmile + .03], [.23, ySmile + .14]].map(([x, y]) => [x, y, surface(x, y, .065)]);
  stroke(b, ink, points, .022, 10);
  if (green) {
    for (const s of [-1, 1]) stroke(b, crayon, [[s * .37, 1.44, 0], [s * .48, 1.82, .01], [s * .67, 1.75, .02], [s * .59, 1.45, .03]], .026, 9);
    rod(b, crayon, [-.11, .39, 0], [-.18, .03, .02], .027);
    rod(b, blue, [.12, .39, 0], [.20, .03, .02], .027);
  } else {
    stroke(b, crayon, [[-.24, 1.51, -.02], [-.35, 1.83, -.01], [-.45, 2.08, 0]], .024, 6);
    stroke(b, crayon, [[.20, 1.54, -.02], [.43, 1.82, -.01], [.67, 2.06, 0]], .024, 6);
    rod(b, crayon, [-.18, .43, 0], [-.29, .03, .02], .027);
    rod(b, crayon, [.18, .43, 0], [.34, .03, .02], .027);
  }
}

const species = (name, voice, action, line, colors, build, move = 'hop') => ({ name, planet: 'earth', move: action === 'bounce' ? 'bounce' : move, v: .5, r: 1.1, size: 1, hopH: .10, emoji: '🖍️', voice, play: { action, line, colors }, build });
export const CRAFT_ANIMALS = {
  craftorangescribble: species('Orange Scribble Friend', 'Hello! Your orange crayon drawing came to life! Let’s twirl!', 'twirl', 'Swishy orange crayons, round and round!', ['#dd9a5e', CREAM], b => scribble(b, false)),
  craftyellowcat: species('Yellow Sticker Cat', 'Hello! I’m your yellow craft cat! Let’s make happy sparkles!', 'sparkle', 'A sparkly hello from your little craft cat!', [YELLOW, PINK], yellowCat),
  craftseatedpanda: species('Sitting Craft Panda', 'Hello! I’m your sitting panda! Come and have a hug!', 'hug', 'A soft panda cuddle, just for you!', [CREAM, PINK, BROWN], b => panda(b, true)),
  craftdadduck: species('Dad Duck', 'Hello! I’m Dad Duck! I brought a warm cup and a silly song!', 'sing', 'Quack, quack! A silly Dad Duck song for you!', [PURPLE, '#efb29d', YELLOW], dadDuck),
  craftgreenscribble: species('Green and Blue Scribble Friend', 'Hello! Your green and blue crayons made me! Let’s bounce!', 'bounce', 'Boing! Green and blue crayons bounce too!', ['#598157', '#433a8c'], b => scribble(b, true)),
  craftpatchpuppy: species('Orange Patch Puppy', 'Hello! I’m your orange patch puppy! Let’s jump together!', 'bounce', 'Woof! Let’s do a happy puppy bounce!', [ORANGE, '#8c9edb', CREAM], patchPuppy),
  craftrainbowcorgi: species('Rainbow Horn Corgi', 'Hello! I’m your rainbow craft friend! Watch my colors sparkle!', 'sparkle', 'A rainbow of happy sparkles for you!', [BLUE, LILAC, YELLOW, PINK], rainbowCorgi),
  craftstandingpanda: species('Standing Craft Panda', 'Hello! I’m your standing panda! Let’s dance together!', 'twirl', 'Panda paws go round and round!', [CREAM, PINK, BROWN], b => panda(b, false)),
  craftsweetraccoon: species('Sweet Craft Raccoon', 'Hello! I’m your sweet craft raccoon! Shall we sing?', 'sing', 'A sweet little song and a balloon for you!', [GREY, PINK, YELLOW], sweetRaccoon),
  craftorangefox: species('Orange Sticker Fox', 'Hello! I’m your orange craft fox! My heart has a hug for you!', 'hug', 'A little fox hug from my big pink heart!', ['#ce8055', PINK, CREAM], orangeFox),
};
