// Nine of the family's outline drawings, rounded into solid painted toys, including both pairs of twins.
// Paper stays pale; raised crayon strokes preserve each drawing's face and unusual proportions.
// Everything goes into the existing resident batch: one shared shiny material and one draw per creature.
import * as THREE from 'three';

const PAPER = '#fff6df';
const PURPLE = '#684268', PINK = '#d779a7', BROWN = '#78615f', ORANGE = '#d3816b';
const BLUE = '#719ec6', PENCIL = '#81869c', OCHRE = '#c79a64';
const DOT = new THREE.SphereGeometry(1, 6, 4);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6);
const UP = new THREE.Vector3(0, 1, 0);
const FACE = .31;

function rod(b, ink, a, c, radius = .025) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...c), delta = q.clone().sub(p);
  const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, delta.clone().normalize()));
  const center = p.add(q).multiplyScalar(.5);
  b.put(CYL, center.x, center.y, center.z, ink, [radius, delta.length(), radius], rotation.toArray());
  b.put(DOT, ...a, ink, radius); b.put(DOT, ...c, ink, radius);
}
function stroke(b, ink, points, radius = .022, segments = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  const g = new THREE.TubeGeometry(curve, segments, radius, 4, closed);
  b.put(g, 0, 0, 0, ink); g.dispose();
  if (!closed) for (const p of [points[0], points.at(-1)]) b.put(DOT, ...p, ink, radius);
}
function line(b, ink, points, radius = .022, segments = 8) {
  stroke(b, ink, points.map(([x, y]) => [x, y, FACE]), radius, segments);
}
// Thick bevelled solids make the bodies round from the side as well as the front.
function body(b, ink, points, depth = .4, bevel = .09) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true);
  const rim = curve.getPoints(32).slice(0, -1), shape = new THREE.Shape(rim.map(p => new THREE.Vector2(p.x, p.y)));
  const solid = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, steps: 1 });
  solid.translate(0, 0, -depth / 2); b.put(solid, 0, 0, 0, PAPER); solid.dispose();
  const center = rim.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / rim.length);
  // The ink follows the rounded front edge, rather than being a separate flat drawing.
  stroke(b, ink, rim.map(p => [center.x + (p.x - center.x) * .93, center.y + (p.y - center.y) * .93, depth / 2 + bevel - .012]), .018, 32, true);
}

function antenna(b) {
  body(b, PURPLE, [[-.44, .30], [-.44, .77], [-.32, 1.34], [-.10, 1.58], [.22, 1.57], [.44, 1.36], [.42, .76], [.29, .29]]);
  rod(b, PURPLE, [-.11, 1.54, 0], [-.14, 1.95, .015], .028);
  rod(b, PURPLE, [.25, 1.53, 0], [.32, 1.87, .015], .026);
  line(b, PURPLE, [[-.14, 1.22], [-.13, 1.04]], .027, 4);
  line(b, PURPLE, [[.16, 1.24], [.13, 1.07]], .027, 4);
  line(b, PURPLE, [[-.20, .98], [-.13, .86], [0, .83], [.15, .89], [.20, 1.01]], .024, 10);
  // This twin has two curved loop feet; her sibling has the longer, continuous sled runner.
  stroke(b, PURPLE, [[-.24, .20, .08], [-.61, .23, .09], [-.96, .13, .10], [-.51, .06, .11], [-.17, .17, .10]], .031, 16, true);
  stroke(b, PURPLE, [[.22, .20, .08], [.50, .23, .09], [.83, .12, .10], [.47, .07, .11], [.14, .18, .10]], .029, 14, true);
}

function antennaTwin(b) {
  body(b, PURPLE, [[-.43, .31], [-.49, .75], [-.47, 1.43], [-.30, 1.73], [.13, 1.75], [.41, 1.51], [.45, .77], [.43, .30]]);
  rod(b, PURPLE, [-.22, 1.70, 0], [-.24, 2.10, .015], .028);
  rod(b, PURPLE, [.23, 1.68, 0], [.27, 2.02, .015], .026);
  line(b, PURPLE, [[-.14, 1.26], [-.13, 1.08]], .027, 4);
  line(b, PURPLE, [[.16, 1.28], [.13, 1.11]], .027, 4);
  line(b, PURPLE, [[-.20, 1.02], [-.13, .90], [0, .87], [.15, .93], [.20, 1.05]], .024, 10);
  // The second photo's taller, straighter body stands on a broad upturned skate/sled base.
  stroke(b, PURPLE, [[-1.0, .17, .04], [-.70, .075, .08], [0, .055, .10], [.72, .09, .08], [1.0, .20, .04]], .035, 14);
  stroke(b, PURPLE, [[-1.0, .17, .04], [-.40, .21, .07], [.40, .21, .07], [1.0, .20, .04]], .026, 10);
  for (const s of [-1, 1]) rod(b, PURPLE, [s * .31, .32, 0], [s * .40, .15, .07], .026);
}

function bean(b) {
  body(b, PINK, [[-.20, .68], [-.47, .91], [-.49, 1.42], [-.25, 1.74], [.18, 1.78], [.48, 1.49], [.48, 1.03], [.42, .68], [.17, .49], [-.04, .52]]);
  stroke(b, PINK, [[-.42, 1.02, 0], [-.71, .90, .01], [-1.05, .69, .02]], .027, 6);
  rod(b, PINK, [.43, 1.22, 0], [1.03, 1.16, .02], .027);
  stroke(b, PINK, [[-.10, .66, 0], [-.47, .13, .025], [-.52, .28, .025]], .029, 5);
  stroke(b, PINK, [[.34, .64, 0], [.36, .13, .025], [.58, .28, .025]], .029, 5);
  line(b, PINK, [[-.14, 1.43], [-.15, 1.17]], .024, 4);
  line(b, PINK, [[.14, 1.42], [.16, 1.13]], .024, 4);
  line(b, PINK, [[-.20, 1.09], [-.10, .98], [.04, .94], [.17, .97]], .024, 8);
}

function wide(b) {
  body(b, BROWN, [[-.34, .48], [-.51, .84], [-.45, 1.40], [-.23, 1.67], [.05, 1.67], [.35, 1.50], [.44, 1.12], [.38, .83], [.45, .51], [.14, .38]]);
  stroke(b, BROWN, [[-.29, 1.59, 0], [-.62, 1.63, 0], [-1.17, 1.64, .01]], .027, 8);
  stroke(b, BROWN, [[.27, 1.54, 0], [.71, 1.63, 0], [1.18, 1.64, .01]], .027, 8);
  stroke(b, BROWN, [[-.44, 1.11, 0], [-.83, 1.15, .01], [-1.23, 1.05, .02]], .030, 7);
  rod(b, BROWN, [.40, 1.15, 0], [1.25, 1.09, .02], .030);
  stroke(b, BROWN, [[-.16, .48, 0], [-.29, .09, .02], [-.56, .13, .04]], .030, 5);
  stroke(b, BROWN, [[.26, .49, 0], [.60, .18, .02], [.80, .42, .04]], .030, 5);
  line(b, BROWN, [[-.12, 1.42], [-.16, 1.29]], .034, 4);
  line(b, BROWN, [[.16, 1.42], [.13, 1.26]], .030, 4);
  // The original expression is downturned. A friendly voice need not erase the child's frown.
  line(b, BROWN, [[-.16, .94], [0, 1.02], [.14, .93], [.12, .85]], .027, 8);
}

function droopy(b) {
  // The other brown drawing has a bean-like cheek notch and arching, unequal droopy ears.
  body(b, BROWN, [[-.28, .56], [-.47, .94], [-.44, 1.40], [-.29, 1.65], [.06, 1.62], [.35, 1.46], [.45, 1.18], [.31, 1.02], [.45, .85], [.52, .57], [.26, .41], [-.02, .43]]);
  stroke(b, BROWN, [[-.31, 1.56, 0], [-.58, 1.94, 0], [-.87, 1.78, .01], [-1.06, 1.45, .01]], .029, 10);
  stroke(b, BROWN, [[.29, 1.49, 0], [.65, 1.72, 0], [.93, 1.63, .01], [1.12, 1.43, .01]], .029, 10);
  stroke(b, BROWN, [[-.43, 1.04, 0], [-.77, .99, .01], [-1.16, .87, .02]], .030, 6);
  rod(b, BROWN, [.43, 1.17, 0], [1.25, 1.06, .02], .030);
  stroke(b, BROWN, [[-.05, .50, 0], [-.23, .08, .02], [-.53, .14, .04]], .030, 5);
  stroke(b, BROWN, [[.36, .50, 0], [.72, .18, .02], [.95, .47, .04]], .030, 5);
  line(b, BROWN, [[-.10, 1.37], [-.14, 1.24]], .035, 4);
  line(b, BROWN, [[.18, 1.35], [.15, 1.19]], .031, 4);
  line(b, BROWN, [[-.16, .94], [0, 1.03], [.14, .95], [.12, .87]], .027, 8);
  // A short crease emphasizes the little inward cheek of the original outline.
  line(b, BROWN, [[.36, 1.12], [.29, 1.02], [.36, .94]], .019, 6);
}

function taper(b) {
  body(b, ORANGE, [[-.20, .14], [-.36, .54], [-.41, 1.01], [-.70, 1.58], [-.57, 1.87], [-.10, 2.01], [.44, 1.90], [.71, 1.62], [.64, 1.30], [.35, 1.10], [.17, .57], [.08, .16]]);
  stroke(b, ORANGE, [[-.40, 1.02, 0], [-.64, .99, .01], [-.72, 1.23, .01], [-.72, 1.45, .01]], .024, 8);
  stroke(b, ORANGE, [[.37, 1.09, 0], [.51, .78, .02], [.36, .76, .04]], .024, 5);
  line(b, ORANGE, [[-.32, 1.53], [-.17, 1.55]], .023, 4);
  line(b, ORANGE, [[.23, 1.52], [.36, 1.49]], .021, 4);
  line(b, ORANGE, [[.03, 1.31], [.10, 1.37], [.17, 1.33], [.11, 1.28], [.03, 1.31]], .020, 8);
  line(b, ORANGE, [[-.32, 1.18], [-.18, 1.10], [-.01, 1.12], [.03, 1.24]], .024, 8);
  line(b, ORANGE, [[-.10, 1.10], [-.09, .99], [-.18, .94], [-.22, 1.00], [-.10, 1.03]], .020, 10);
  line(b, ORANGE, [[.01, 1.12], [.08, 1.00], [.05, .93]], .023, 6);
  line(b, ORANGE, [[-.22, .53], [.12, .48], [0, .31], [-.22, .53]], .023, 8);
  for (const s of [-1, 1]) stroke(b, ORANGE, [[s * .10, .17, 0], [s * .26, .10, .01], [s * .48, .10, .02]], .025, 5);
}

function box(b) {
  body(b, BLUE, [[-.44, .58], [-.58, .86], [-.58, 1.43], [-.39, 1.72], [.16, 1.76], [.49, 1.59], [.58, 1.20], [.49, .70], [.10, .55]]);
  rod(b, BLUE, [-.51, 1.04, 0], [-1.10, .93, .01], .023);
  rod(b, BLUE, [.52, 1.05, 0], [1.10, .91, .01], .023);
  for (const s of [-1, 1]) {
    rod(b, BLUE, [s * .14, .64, 0], [s * .20, .10, .02], .024);
    rod(b, BLUE, [s * .20, .10, .02], [s * .36, .12, .04], .022);
  }
  line(b, BLUE, [[-.19, 1.48], [-.15, 1.22], [-.18, 1.08]], .022, 6);
  line(b, BLUE, [[-.20, 1.38], [-.27, 1.47]], .017, 4);
  line(b, BLUE, [[.14, 1.49], [.19, 1.27], [.23, 1.11]], .022, 6);
  line(b, BLUE, [[-.16, .95], [0, .94], [.16, .98]], .019, 6);
}

function loop(b) {
  body(b, PENCIL, [[-.37, .52], [-.57, .87], [-.54, 1.39], [-.29, 1.70], [.12, 1.76], [.45, 1.61], [.57, 1.26], [.46, .84], [.19, .56], [-.03, .61]]);
  stroke(b, PENCIL, [[-.48, 1.09, 0], [-.77, 1.17, .01], [-1.03, 1.53, .02]], .022, 7);
  stroke(b, PENCIL, [[.50, 1.28, 0], [.86, 1.35, .01], [1.03, 1.56, .02]], .022, 7);
  for (const s of [-1, 1]) stroke(b, PENCIL, [[s * .10, .60, 0], [s * .13, .27, .02], [s * .22, .13, .03]], .026, 5);
  line(b, PENCIL, [[-.33, 1.47], [-.20, 1.49]], .019, 5);
  line(b, PENCIL, [[.11, 1.50], [.28, 1.49]], .019, 5);
  line(b, PENCIL, [[-.12, 1.65], [-.30, 1.76], [-.42, 1.68]], .019, 7);
  line(b, PENCIL, [[-.18, 1.15], [-.29, 1.15], [-.30, 1.28], [-.21, 1.32], [-.14, 1.25], [-.13, 1.19], [-.05, 1.27]], .019, 12);
  line(b, PENCIL, [[.17, 1.12], [.05, 1.25], [.12, 1.40], [.29, 1.40], [.34, 1.28], [.27, 1.18], [.24, 1.08], [.31, .98]], .019, 14);
  line(b, PENCIL, [[-.21, .92], [0, .83], [.17, .87], [.23, 1.00]], .022, 8);
}

function leaf(b) {
  body(b, OCHRE, [[-.47, 1.87], [-.40, 1.46], [-.23, 1.15], [.11, 1.08], [.19, .76], [.49, 1.02], [.57, 1.33], [.34, 1.60], [-.01, 1.78]]);
  stroke(b, OCHRE, [[-.23, 1.15, 0], [-.58, .96, .01], [-1.03, .66, .02]], .025, 7);
  stroke(b, OCHRE, [[.46, 1.47, 0], [.75, 1.42, .01], [1.03, 1.15, .02]], .025, 7);
  rod(b, OCHRE, [-.10, 1.21, .03], [-.09, .08, .05], .028);
  stroke(b, OCHRE, [[.29, .97, 0], [.42, .24, .02], [.31, .17, .04]], .027, 5);
  line(b, OCHRE, [[-.23, 1.61], [-.15, 1.53], [-.14, 1.62]], .025, 5);
  line(b, OCHRE, [[.09, 1.57], [.13, 1.49]], .021, 4);
  line(b, OCHRE, [[-.10, 1.35], [.08, 1.31], [.24, 1.26]], .024, 6);
}

export const DOODLE_FRIENDS = {
  doodleantenna: { name: 'Antenna Drawing Twin', planet: 'earth', move: 'slide', v: .45, r: 1.1, size: 1, emoji: '🖍️',
    voice: 'Hello! I’m one of your drawing twins! Let’s spin together!', play: { line: 'Round and round on my little loop feet!', action: 'twirl', colors: [PURPLE, '#d9a9d3'] }, build: antenna },
  doodlebean: { name: 'Pink Bean Friend', planet: 'earth', move: 'bounce', v: .6, r: 1.1, size: 1, hopH: .12, emoji: '🖍️',
    voice: 'Hello! I’m your pink bean drawing! Bounce with me!', play: { line: 'Boing! Let’s do a happy bean bounce!', action: 'bounce', colors: [PINK, '#f4c2da'] }, build: bean },
  doodlewide: { name: 'Brown Long-Eared Twin', planet: 'earth', move: 'hop', v: .55, r: 1.1, size: 1, hopH: .09, emoji: '🖍️',
    voice: 'Hello! I’m a long-eared drawing twin! Let’s sing!', play: { line: 'La, la, la! A song for you and my twin!', action: 'sing', colors: [BROWN, '#dfc9ac'] }, build: wide },
  doodletaper: { name: 'Orange Big-Head Friend', planet: 'earth', move: 'hop', v: .5, r: 1.1, size: 1, hopH: .10, emoji: '🖍️',
    voice: 'Hello! I came from your big orange drawing! Here’s a hug!', play: { line: 'A big smile and a little hug for you!', action: 'hug', colors: [ORANGE, '#f6bea0'] }, build: taper },
  doodlebox: { name: 'Blue Square Friend', planet: 'earth', move: 'hop', v: .55, r: 1.1, size: 1, hopH: .09, emoji: '🖍️',
    voice: 'Hello! I’m your round-cornered blue drawing! Let’s dance!', play: { line: 'One, two, turn! Dance along with me!', action: 'twirl', colors: [BLUE, '#b9d9ed'] }, build: box },
  doodleloop: { name: 'Spiral-Eyed Friend', planet: 'earth', move: 'bounce', v: .55, r: 1.1, size: 1, hopH: .10, emoji: '🖍️',
    voice: 'Hello! Look at my curly eyes! Shall we make sparkles?', play: { line: 'Curly whirly sparkles, just for you!', action: 'sparkle', colors: [PENCIL, '#d3c1e5', '#f4d78a'] }, build: loop },
  doodleleaf: { name: 'Orange Leaf Friend', planet: 'earth', move: 'bounce', v: .5, r: 1.1, size: 1, hopH: .10, emoji: '🖍️',
    voice: 'Hello! I’m your pointy orange drawing! Let’s hop!', play: { line: 'My long legs love a happy hop!', action: 'bounce', colors: [OCHRE, '#f2d1a5'] }, build: leaf },
  doodleantennatwin: { name: 'Sled Drawing Twin', planet: 'earth', move: 'slide', v: .45, r: 1.1, size: 1, emoji: '🖍️',
    voice: 'Hello! I’m the taller drawing twin! My sled loves to twirl!', play: { line: 'Whee! Watch my curvy sled go round!', action: 'twirl', colors: [PURPLE, '#d9a9d3'] }, build: antennaTwin },
  doodledroopy: { name: 'Droopy-Eared Twin', planet: 'earth', move: 'hop', v: .5, r: 1.1, size: 1, hopH: .09, emoji: '🖍️',
    voice: 'Hello! I’m the droopy-eared drawing twin! Here’s a hug!', play: { line: 'My twin and I have long arms for a hug!', action: 'hug', colors: [BROWN, '#dfc9ac'] }, build: droopy },
};
