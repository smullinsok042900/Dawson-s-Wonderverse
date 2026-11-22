// The family's decorated animal pictures and coloring pages, rounded into painted toy residents.
// Their colors, stickers and scribbles are geometry and vertex paint; no photographs, textures or lettering are used.
// Each builder feeds the existing one-mesh creature batch and its shared shiny paint.
import * as THREE from 'three';

const BALL = new THREE.SphereGeometry(1, 10, 8);
const SMALL = new THREE.SphereGeometry(1, 8, 6);
const DOT = new THREE.SphereGeometry(1, 6, 4);
const TINY = new THREE.SphereGeometry(1, 5, 3);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6);
// Separate latitude bands give bees crisp painted stripes without overlapping shells or another mesh.
const BEE_LATITUDES = [0, .24, .40, .56, .72, .86, 1];
const BEE_BANDS = BEE_LATITUDES.slice(0, -1).map((start, i) =>
  new THREE.SphereGeometry(1, 10, 2, 0, Math.PI * 2, start * Math.PI, (BEE_LATITUDES[i + 1] - start) * Math.PI));
const UP = new THREE.Vector3(0, 1, 0);
const CREAM = '#fff5dd', INK = '#3b3448', GREEN = '#719d72', GOLD = '#f2c343';
const PINK = '#ed93ad', RED = '#e9546f', BLUE = '#6d9fc4', YELLOW = '#f2ce68', LILAC = '#c982be';
const ORANGE = '#ed8e35', LEOPARD = '#edbf55', SPOTS = '#a96d4b', PURPLE = '#9474b6';

function ball(b, color, x, y, z, sx, sy = sx, sz = sx, detail = 'small', rotation) {
  b.put(detail === 'ball' ? BALL : detail === 'dot' ? DOT : detail === 'tiny' ? TINY : SMALL, x, y, z, color, [sx, sy, sz], rotation);
}
function rod(b, color, a, c, radius = .025) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...c), d = end.clone().sub(start);
  const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()));
  const center = start.add(end).multiplyScalar(.5);
  b.put(CYL, center.x, center.y, center.z, color, [radius, d.length(), radius], rotation.toArray());
}
function stroke(b, color, points, radius = .022, segments = 6) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, segments, radius, radius > .06 ? 6 : 4, false);
  b.put(geometry, 0, 0, 0, color); geometry.dispose();
  for (const p of [points[0], points.at(-1)]) ball(b, color, ...p, radius, radius, radius, radius > .06 ? 'dot' : 'tiny');
}
function solid(b, color, points, depth = .10, z = 0, bevel = .014) {
  const shape = new THREE.Shape(); shape.moveTo(...points[0]); for (const p of points.slice(1)) shape.lineTo(...p); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 2 });
  b.put(geometry, 0, 0, z - depth / 2, color); geometry.dispose();
}
function pupil(b, x, y, z, rx = .055, ry = rx * 1.2) {
  ball(b, INK, x, y, z, rx, ry, .026, 'dot');
  ball(b, CREAM, x - rx * .25, y + ry * .35, z + .025, rx * .30, rx * .30, .012, 'tiny');
}
function heart(b, color, x, y, z, size) {
  solid(b, color, [[0, -1], [-1, -.1], [-1.05, .45], [-.65, .95], [-.2, .88], [0, .60], [.2, .88], [.65, .95], [1.05, .45], [1, -.1]].map(([a, c]) => [x + a * size, y + c * size]), .035, z, .008);
}
function smile(b, x, y, z, width = .12, color = INK) {
  stroke(b, color, [[x - width, y + .04, z], [x - width * .55, y - .015, z + .012], [x, y - .035, z + .018], [x + width * .7, y - .005, z + .01], [x + width, y + .04, z]], .016, 7);
}

function crownPuppy(b) {
  ball(b, GREEN, 0, .53, 0, .31, .40, .26, 'ball');
  ball(b, CREAM, 0, .55, .237, .235, .30, .065);
  for (const s of [-1, 1]) {
    ball(b, GREEN, s * .30, .65, .015, .12, .24, .12, 'small', [0, 0, -s * .7]);
    ball(b, CREAM, s * .40, .51, .04, .095, .10, .10, 'dot');
    ball(b, GREEN, s * .20, .12, .035, .15, .13, .18);
    ball(b, CREAM, s * .20, .09, .16, .12, .075, .065, 'dot');
  }
  stroke(b, GREEN, [[.22, .35, -.08], [.48, .33, -.14], [.63, .53, -.15], [.64, .75, -.10]], .075, 8);
  ball(b, CREAM, .64, .75, -.10, .077, .09, .07, 'dot');
  ball(b, GREEN, 0, 1.32, 0, .56, .48, .36, 'ball');
  ball(b, CREAM, 0, 1.32, .285, .50, .435, .18, 'ball');
  for (const s of [-1, 1]) {
    solid(b, GREEN, [[s * .32, 1.76], [s * .49, 1.88], [s * .65, 1.70], [s * .62, 1.46], [s * .39, 1.47]], .16, .12, .025);
    ball(b, GREEN, s * .28, 1.48, .389, .24, .235, .075);
    ball(b, PINK, s * .40, 1.29, .407, .065, .065, .018, 'dot');
    for (const [dx, dy] of [[-.04, .04], [.035, .03], [0, -.025]]) ball(b, '#d79985', s * .49 + dx * s, 1.65 + dy, .225, .017, .017, .012, 'tiny');
    pupil(b, s * .24, 1.41, .480, .047, .065);
  }
  ball(b, INK, 0, 1.23, .477, .043, .032, .025, 'dot');
  for (const s of [-1, 1]) stroke(b, INK, [[0, 1.205, .49], [s * .07, 1.12, .49], [s * .14, 1.16, .476]], .013, 5);
  // A striped collar, a gold paw medal, and the yellow crown from the decorated picture.
  ball(b, '#487d6b', 0, .91, .075, .29, .055, .22);
  for (const s of [-1, 1]) rod(b, '#aac59a', [s * .10, .88, .255], [s * .18, .95, .23], .021);
  ball(b, GOLD, 0, .875, .306, .087, .087, .023, 'dot');
  ball(b, '#d28a40', 0, .86, .331, .030, .024, .008, 'tiny');
  for (const [x, y] of [[-.034, .892], [-.01, .906], [.018, .906], [.04, .89]]) ball(b, '#d28a40', x, y, .33, .012, .015, .008, 'tiny');
  solid(b, GOLD, [[-.26, 1.80], [-.28, 2.075], [-.12, 1.955], [0, 2.09], [.12, 1.955], [.28, 2.075], [.26, 1.80]], .12, 0, .012);
  ball(b, CREAM, 0, 1.80, .01, .29, .035, .10, 'small');
  for (const [x, y] of [[-.28, 2.075], [0, 2.09], [.28, 2.075]]) ball(b, '#76538f', x, y, .005, .026, .026, .025, 'tiny');
  // The little orange hamster is a held companion detail, not a second wandering resident.
  const hamster = '#df984d';
  ball(b, hamster, .65, .40, .15, .13, .15, .11);
  ball(b, hamster, .65, .55, .16, .17, .135, .12);
  for (const s of [-1, 1]) {
    ball(b, hamster, .65 + s * .12, .65, .15, .056, .056, .05, 'dot');
    ball(b, CREAM, .65 + s * .12, .65, .19, .033, .032, .015, 'tiny');
    pupil(b, .65 + s * .058, .56, .271, .023, .030);
  }
  ball(b, CREAM, .65, .45, .245, .10, .09, .028, 'dot');
  smile(b, .65, .505, .285, .045);
}

function heartLeopard(b) {
  ball(b, LEOPARD, 0, .53, 0, .30, .40, .26, 'ball');
  // A short solid neck overlaps both volumes; the big head must not balance on the torso's tip.
  ball(b, LEOPARD, 0, .94, 0, .16, .14, .16);
  ball(b, '#f6dfc0', 0, .52, .235, .22, .30, .055);
  for (const s of [-1, 1]) {
    ball(b, LEOPARD, s * .36, .67, 0, .12, .23, .12, 'small', [0, 0, s * .8]);
    ball(b, '#f6dfc0', s * .48, .55, .02, .09, .10, .105, 'dot');
    ball(b, LEOPARD, s * .24, .14, .02, .15, .14, .15);
    ball(b, '#f6dfc0', s * .25, .10, .145, .12, .075, .055, 'dot');
  }
  stroke(b, LEOPARD, [[.20, .32, -.04], [.52, .27, -.09], [.76, .40, -.07], [.88, .76, -.02]], .095, 9);
  ball(b, '#f6dfc0', .88, .76, -.02, .096, .095, .09, 'dot');
  for (const [x, y] of [[.49, .29], [.70, .36], [.82, .54]]) ball(b, SPOTS, x, y, .013, .032, .045, .028, 'tiny');
  ball(b, LEOPARD, 0, 1.40, 0, .56, .49, .35, 'ball');
  for (const s of [-1, 1]) {
    ball(b, LEOPARD, s * .43, 1.77, -.01, .21, .23, .16);
    ball(b, '#e79b57', s * .43, 1.79, .125, .145, .15, .038, 'dot');
    ball(b, PINK, s * .42, 1.25, .278, .075, .075, .026, 'dot');
    heart(b, PINK, s * .23, 1.48, .333, .15);
    heart(b, INK, s * .23, 1.48, .362, .126);
    heart(b, RED, s * .23, 1.48, .391, .108);
  }
  for (const [x, y] of [[-.35, 1.69], [-.18, 1.77], [0, 1.81], [.21, 1.76], [.37, 1.68], [-.48, 1.08], [.46, 1.08], [-.40, .98], [.39, .98]]) {
    const z = .35 * Math.sqrt(Math.max(0, 1 - (x / .56) ** 2 - ((y - 1.40) / .49) ** 2));
    ball(b, SPOTS, x, y, z + .006, .025, .032, .014, 'tiny');
  }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) ball(b, SPOTS, s * (.25 - i % 2 * .025), .29 + i * .13, .16, .026, .034, .018, 'tiny');
  ball(b, '#f6dfc0', 0, 1.20, .29, .25, .245, .10);
  ball(b, INK, 0, 1.13, .391, .09, .10, .027, 'dot');
  ball(b, INK, 0, 1.29, .386, .040, .032, .022, 'dot');
  // A second tongue-shaped sticker sits on the chest in the family's decorated picture.
  ball(b, INK, 0, .87, .275, .075, .095, .024, 'dot');
  ball(b, RED, 0, .827, .300, .052, .045, .015, 'tiny');
  rod(b, SPOTS, [0, 1.86, 0], [-.025, 1.95, 0], .011);
  rod(b, SPOTS, [0, 1.86, 0], [.035, 1.93, 0], .011);
}

function bucketGhost(b) {
  const profile = [[0, .08], [.26, .08], [.43, .20], [.43, .50], [.49, .88], [.52, 1.30], [.45, 1.62], [.28, 1.84], [0, 1.91]];
  const geometry = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 14);
  b.put(geometry, 0, 0, 0, CREAM, [1, 1, .76]); geometry.dispose();
  for (const x of [-.29, -.10, .11, .30]) ball(b, CREAM, x, .13, .015, .17, .13, .21, 'dot');
  for (const s of [-1, 1]) {
    ball(b, '#694da4', s * .19, 1.55, .340, .095, .105, .055, 'dot');
    ball(b, CREAM, s * .19 - .025, 1.59, .388, .021, .029, .012, 'tiny');
    rod(b, '#694da4', [s * .23, 1.61, .34], [s * .28, 1.66, .29], .014);
    ball(b, CREAM, s * .30, 1.02, .35, .18, .10, .11, 'small', [0, 0, -s * .4]);
  }
  ball(b, INK, 0, 1.29, .420, .22, .10, .030);
  ball(b, RED, 0, 1.245, .446, .085, .028, .015, 'dot');
  stroke(b, INK, [[-.22, .77, .44], [-.20, 1.0, .44], [0, 1.105, .44], [.20, 1.0, .44], [.22, .77, .44]], .016, 10);
  ball(b, ORANGE, 0, .65, .37, .28, .25, .20, 'ball');
  for (const x of [-.17, .17]) ball(b, '#df7931', x, .65, .38, .105, .23, .17, 'dot');
  for (const s of [-1, 1]) stroke(b, INK, [[s * .06, .73, .564], [s * .095, .75, .557], [s * .125, .72, .551]], .012, 4);
  ball(b, INK, 0, .60, .563, .13, .06, .018, 'dot');
  ball(b, ORANGE, 0, .64, .577, .035, .045, .012, 'tiny');
  for (const [x, y, color] of [[-.14, .885, LILAC], [0, .91, '#67a5ba'], [.13, .88, RED]]) {
    ball(b, color, x, y, .41, .065, .075, .065, 'dot');
    for (const s of [-1, 1]) solid(b, color, [[x + s * .045, y], [x + s * .11, y - .025], [x + s * .095, y + .045]], .07, .41, .004);
  }
}

function bonePanda(b) {
  ball(b, CREAM, 0, .43, 0, .31, .35, .25, 'ball');
  // Bridge the gap below the oversized head with a round cream neck, overlapping head and torso.
  ball(b, CREAM, 0, .84, 0, .17, .14, .17);
  for (const s of [-1, 1]) {
    ball(b, INK, s * .13, .56, .23, .08, .10, .085, 'dot');
    ball(b, INK, s * .22, .095, .08, .155, .095, .16);
    ball(b, PINK, s * .22, .075, .22, .082, .052, .015, 'dot');
    for (const dx of [-.075, 0, .075]) ball(b, PINK, s * .22 + dx, .143, .185, .025, .025, .017, 'tiny');
    ball(b, INK, s * .43, 1.74, -.035, .22, .22, .145);
    ball(b, RED, s * .43, 1.75, .09, .145, .145, .038, 'dot');
  }
  ball(b, CREAM, 0, 1.36, 0, .58, .48, .35, 'ball');
  for (const s of [-1, 1]) {
    ball(b, '#786576', s * .22, 1.47, .305, .137, .148, .063);
    ball(b, INK, s * .22, 1.47, .349, .105, .115, .035, 'dot');
    ball(b, CREAM, s * .22 - .028, 1.515, .38, .028, .030, .014, 'tiny');
    ball(b, PINK, s * .40, 1.30, .275, .07, .07, .027, 'dot');
  }
  ball(b, INK, 0, 1.31, .356, .036, .028, .024, 'dot');
  rod(b, RED, [-.20, 1.10, .36], [.20, 1.10, .36], .057);
  for (const s of [-1, 1]) for (const y of [1.052, 1.147]) ball(b, RED, s * .217, y, .36, .057, .054, .043, 'dot');
  for (const [x, y] of [[-.23, 1.16], [-.23, 1.045], [-.17, 1.09], [-.10, 1.14], [.10, 1.075], [.17, 1.12], [.23, 1.16], [.23, 1.045]]) ball(b, CREAM, x, y, .408, .010, .010, .006, 'tiny');
  ball(b, '#e8c19d', 0, 1.125, .41, .085, .074, .024, 'dot');
  ball(b, INK, 0, 1.13, .432, .059, .058, .016, 'dot');
  ball(b, CREAM, -.018, 1.15, .448, .014, .021, .006, 'tiny');
  rod(b, PINK, [-.03, 1.82, 0], [.025, 1.91, 0], .015);
}

const MANE = [BLUE, YELLOW, LILAC, '#a5c9a8'];
const rainbow = (x, y, z, nx, ny, nz, out) => out.set(MANE[Math.floor((x + y + 8) * 6) % MANE.length]);
function pony(b, winged) {
  const coat = winged ? CREAM : PINK, hoof = winged ? BLUE : RED;
  ball(b, coat, 0, .52, 0, .31, .43, .28, 'ball');
  for (const s of [-1, 1]) {
    ball(b, coat, s * .17, .30, .17, .14, .28, .14);
    ball(b, hoof, s * .17, .075, .19, .135, .065, .13, 'dot');
    ball(b, coat, s * .34, .14, -.04, .16, .14, .17);
    ball(b, hoof, s * .36, .10, .055, .135, .08, .055, 'dot');
  }
  stroke(b, rainbow, [[-.24, .40, -.11], [-.56, .34, -.14], [-.74, .55, -.13], [-.66, .84, -.07]], .115, 11);
  ball(b, coat, 0, 1.26, 0, .52, .48, .35, 'ball');
  for (const s of [-1, 1]) {
    solid(b, coat, [[s * .25, 1.58], [s * .52, 2.03], [s * .54, 1.74], [s * .45, 1.49]], .19, -.04, .022);
    solid(b, RED, [[s * .34, 1.64], [s * .49, 1.91], [s * .47, 1.70], [s * .42, 1.61]], .04, .071, .008);
    ball(b, RED, s * .40, 1.14, .251, .08, .075, .028, 'dot');
    ball(b, INK, s * .21, 1.28, .326, .15, .18, .072);
    ball(b, winged ? LEOPARD : '#498d76', s * .21, 1.28, .383, .12, .151, .037);
    ball(b, INK, s * .21 + .055, 1.235, .413, .050, .072, .024, 'dot');
    ball(b, CREAM, s * .21 - .035, 1.345, .420, .032, .040, .015, 'tiny');
  }
  // The swept forelock and the mane down the back are round, striped clumps of hair.
  ball(b, rainbow, -.045, 1.69, .14, .37, .19, .24, 'ball', [0, 0, -.2]);
  ball(b, BLUE, -.28, 1.58, .28, .27, .13, .12, 'small', [0, 0, -.17]);
  ball(b, YELLOW, .24, 1.67, .10, .16, .13, .19, 'dot');
  ball(b, LILAC, .15, 1.78, .03, .16, .10, .16, 'dot');
  for (const [x, y, color] of [[-.43, 1.33, BLUE], [-.43, 1.10, YELLOW], [-.38, .89, LILAC]]) ball(b, color, x, y, -.13, .16, .24, .19, 'small', [0, 0, -.2]);
  ball(b, '#f7c7b0', 0, 1.035, .325, .13, .10, .065, 'dot');
  ball(b, INK, 0, 1.025, .389, .054, .050, .020, 'dot');
  ball(b, RED, 0, 1.007, .409, .025, .018, .008, 'tiny');
  if (winged) {
    for (const s of [-1, 1]) {
      ball(b, BLUE, s * .57, .91, -.10, .38, .24, .12, 'small', [0, 0, s * .35]);
      for (let i = 0; i < 3; i++) ball(b, CREAM, s * (.56 + i * .13), .85 + i * .085, -.015, .12, .25, .10, 'dot', [0, 0, -s * .6]);
    }
    for (const [x, y, color] of [[-.25, 1.94, BLUE], [-.08, 2.01, RED], [.10, 2.015, ORANGE], [.27, 1.955, PURPLE]]) {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        ball(b, color, x + Math.cos(a) * .055, y + Math.sin(a) * .055, .12, .047, .047, .035, 'tiny');
      }
      ball(b, GOLD, x, y, .153, .024, .025, .012, 'tiny');
    }
  }
}

function bee(b, variant) {
  const head = variant === 0 ? '#375a62' : variant === 1 ? LEOPARD : CREAM;
  const body = variant === 0 ? ORANGE : variant === 1 ? '#a678bf' : CREAM;
  const legs = variant === 0 ? LILAC : variant === 1 ? '#679577' : CREAM;
  const tips = variant === 0 ? ORANGE : variant === 1 ? '#375a62' : YELLOW;
  BEE_BANDS.forEach((shape, i) => b.put(shape, 0, .63, 0, i % 2 ? INK : body, [.37, .46, .29]));
  for (const s of [-1, 1]) {
    stroke(b, legs, [[s * .20, .40, .02], [s * .29, .16, .04], [s * .46, .10, .06]], .039, 5);
    stroke(b, legs, [[s * .30, .81, .02], [s * .43, .64, .06], [s * .58, .68, .08]], .035, 5);
    const wingPaint = variant === 0 ? (x, y, z, nx, ny, nz, out) => out.set(Math.floor((x + y + 5) * 14) % 3 === 0 ? '#99b58a' : '#b4b6d0') : CREAM;
    ball(b, wingPaint, s * .44, 1.40, -.12, .22, .43, .095, 'small', [0, 0, -s * .43]);
    for (const dx of [-.10, .06]) stroke(b, INK, [[s * .36, 1.12, -.025], [s * (.47 + dx), 1.42, -.015], [s * (.54 + dx), 1.64, -.04]], .011, 5);
    stroke(b, INK, [[s * .17, 1.53, .04], [s * .23, 1.76, .02], [s * .32, 1.93, .01]], .025, 6);
    ball(b, INK, s * .32, 1.93, .01, .075, .075, .055, 'dot');
    ball(b, tips, s * .32, 1.93, .057, .047, .047, .016, 'dot');
  }
  ball(b, head, 0, 1.23, .065, .43, .40, .31, 'ball');
  for (const s of [-1, 1]) {
    pupil(b, s * .145, 1.31, .347, .058, .073);
    ball(b, variant === 0 ? ORANGE : PINK, s * .29, 1.17, .296, .059, .055, .024, 'dot');
    for (let i = 0; i < 3; i++) ball(b, INK, s * .29 + (i - 1) * .023, 1.17 + (i % 2) * .015, .319, .006, .010, .005, 'tiny');
  }
  smile(b, 0, 1.155, .377, .11);
  if (variant === 0) {
    // Blue-green crosshatching follows the daughter's colored first bee.
    for (const y of [1.05, 1.45]) stroke(b, '#4a7582', [[-.25, y, .28], [0, y + .03, .365], [.24, y + .05, .285]], .011, 5);
  } else if (variant === 1) {
    for (const y of [1.10, 1.45]) stroke(b, ORANGE, [[-.25, y, .29], [.05, y + .08, .365], [.25, y + .11, .27]], .012, 5);
  } else {
    // Keep the third bee mostly unfilled, including its pale legs and wings.
    stroke(b, PINK, [[-.27, 1.06, .28], [0, 1.02, .35], [.26, 1.08, .28]], .011, 6);
  }
}

function scribbleShark(b) {
  const blue = '#354ea0', gray = '#526371';
  // An original round toy shark: a curved three-dimensional body, small forked tail and broad low side fins.
  ball(b, CREAM, 0, 1.035, 0, .61, .64, .42, 'ball');
  ball(b, CREAM, 0, .34, -.015, .18, .26, .15);
  for (const s of [-1, 1]) {
    solid(b, blue, [[s * .48, 1.00], [s * 1.00, .72], [s * .69, .60], [s * .45, .73]], .25, -.015, .018);
    solid(b, blue, [[0, .22], [s * .37, .045], [s * .10, .055], [0, .13]], .16, -.02, .010);
  }
  solid(b, blue, [[-.17, 1.53], [-.23, 1.94], [.14, 1.54]], .23, -.06, .015);
  // Colorful loose strokes stay on the actual curved skin, underneath the eyes and the joyful mouth.
  const skin = (x, y) => .42 * Math.sqrt(Math.max(0, 1 - (x / .61) ** 2 - ((y - 1.035) / .64) ** 2)) + .018;
  const scribbles = [
    ['#60a9c6', [[-.44, 1.39], [.12, 1.52], [.43, 1.28], [-.35, 1.20], [.47, 1.12]]],
    ['#dfba4f', [[-.47, 1.18], [.31, 1.31], [-.37, .98], [.43, 1.02]]],
    ['#649469', [[-.43, .96], [.39, 1.16], [-.18, .72], [.30, .65]]],
    ['#cf84a7', [[-.39, 1.29], [.30, 1.20], [-.43, 1.04], [.38, .88]]],
    ['#60a9c6', [[-.44, .84], [.09, .98], [.39, .77], [-.20, .62]]],
    ['#dfba4f', [[-.32, .65], [.32, .79], [-.26, 1.16], [.27, 1.43]]],
    ['#649469', [[-.37, 1.48], [.27, 1.35], [-.29, 1.01], [.36, .92]]],
    ['#cf84a7', [[-.20, .52], [.22, .66], [-.35, .82], [.36, 1.03]]],
  ];
  for (const [color, points] of scribbles) stroke(b, color, points.map(([x, y]) => [x, y, skin(x, y)]), .010, 10);
  for (const [x, y, sx, sy] of [[-.225, 1.245, .117, .148], [.225, 1.30, .156, .191]]) {
    ball(b, gray, x, y, .383, sx + .018, sy + .018, .052);
    ball(b, CREAM, x, y, .416, sx, sy, .042);
    ball(b, INK, x + .012, y - .014, .450, sx * .71, sy * .76, .028, 'small');
    ball(b, CREAM, x - sx * .25, y + sy * .35, .475, .025, .032, .013, 'tiny');
  }
  ball(b, INK, 0, .85, .429, .29, .16, .045);
  for (const x of [-.17, -.055, .065, .18]) solid(b, CREAM, [[x - .032, .986], [x + .032, .986], [x, .928]], .020, .476, .003);
  for (const x of [-.12, .02, .15]) solid(b, CREAM, [[x - .031, .722], [x + .031, .722], [x, .775]], .018, .474, .003);
}

const species = (name, voice, build, action, line, colors, move = 'hop') => ({
  name, planet: 'earth', move: action === 'bounce' ? 'bounce' : move, v: .5, r: 1.1, size: 1, hopH: .10, emoji: '🖍️',
  ...(move === 'float' ? { hover: .18 } : {}),
  voice, play: { line, action, colors }, build,
});
export const CRAFT_COLORING = {
  craftcrownpuppy: species('Crowned Puppy Friend', 'Hello! A royal puppy hello! My little hamster friend says hello too!', crownPuppy, 'hug', 'A gentle puppy cuddle for you and my tiny friend!', [GREEN, CREAM, GOLD]),
  craftheartleopard: species('Heart-Eyed Spotted Friend', 'Hello! My heart eyes are happy to see you! Dance with me!', heartLeopard, 'twirl', 'Happy hearts! Let’s turn and dance together!', [LEOPARD, RED, PINK]),
  craftbucketghost: species('Pumpkin Bucket Ghost', 'Hello! Peekaboo! I’m a friendly ghost with a colorful candy bucket!', bucketGhost, 'sparkle', 'Peekaboo! A sweet rainbow of sparkles for you!', [ORANGE, LILAC, CREAM], 'float'),
  craftbonepanda: species('Pink-Bone Panda', 'Hello! Look at my pink paws and my spotty bone! Bounce with me!', bonePanda, 'bounce', 'Boing, boing! Happy panda paws!', [RED, PINK, CREAM]),
  craftpinkpony: species('Pink Rainbow Pony', 'Hello! My rainbow mane is ready for a happy pony dance!', b => pony(b, false), 'twirl', 'Swish, swish! My rainbow mane loves to dance!', [PINK, BLUE, YELLOW]),
  craftflowerpegasus: species('Flower-Crown Pegasus', 'Hello! My flowers and little wings are ready to twirl with you!', b => pony(b, true), 'twirl', 'Flutter, flowers! Let’s do a gentle wing dance!', [CREAM, BLUE, RED, PURPLE]),
  craftbeeorange: species('Orange Coloring Bee', 'Hello! Buzz buzz! You colored my orange stripes and pink legs!', b => bee(b, 0), 'sing', 'Buzzy buzz, la la! Let’s sing an orange bee song!', [ORANGE, LILAC, '#375a62']),
  craftbeepurple: species('Purple Coloring Bee', 'Hello! Buzz buzz! My purple stripes and green feet say hello!', b => bee(b, 1), 'bounce', 'Buzz and boing! My green feet love a little hop!', ['#a678bf', '#679577', LEOPARD]),
  craftbeepale: species('Pale Coloring Bee', 'Hello! I’m the little pale bee with yellow antenna tips! Wave with me!', b => bee(b, 2), 'twirl', 'Buzz round and round! A little pale bee dance!', [CREAM, YELLOW, PINK]),
  craftscribbleshark: species('Rainbow Scribble Shark', 'Hello! Your rainbow colors make my fins so happy! Let’s sing!', scribbleShark, 'sing', 'Swish, splash, la la! A rainbow ocean song!', ['#60a9c6', '#dfba4f', '#649469', '#cf84a7']),
};
