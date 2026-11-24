// Nine of the family's outline drawings, made into round plush toys (build 124), including both pairs of twins.
// Each body is the drawing's own outline puffed into a soft round solid; the drawing's crayon colour becomes the toy's
// colour, with shiny 3D eyes, chunky arms and legs and the drawing's own mouth, ears and feet.
// Everything goes into the existing resident batch: one shared shiny material and one draw per creature.
import * as THREE from 'three';
import { puff, eye, limb, boot, drawOn, blush, shade } from './plush.js';

const PURPLE = '#684268', PINK = '#d779a7', BROWN = '#78615f', ORANGE = '#d3816b';
const BLUE = '#719ec6', PENCIL = '#81869c', OCHRE = '#c79a64';
const DOT = new THREE.SphereGeometry(1, 8, 5);
const CHEEK = '#ff8fb0';
// each drawing's crayon colour as a bright toy fabric
const TOY = { [PURPLE]: '#b483c9', [PINK]: '#f59ac8', [BROWN]: '#c99a78', [ORANGE]: '#f7a17a', [BLUE]: '#86bdf0', [PENCIL]: '#aeb5e6', [OCHRE]: '#f2bd6a' };

// the soft body: the outline puffed round, in a lighter shade of the drawing's crayon, with a darker stitched seam
let INK = '#000'; // the drawing's own crayon: its eyes' pupils, mouth and marks are drawn in it
function body(b, ink, points, depth = .42) {
  INK = ink;
  const zAt = puff(b, TOY[ink], points, depth, shade(TOY[ink], .4));
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true);
  const g = new THREE.TubeGeometry(curve, 28, .022, 3, true); b.put(g, 0, 0, 0, shade(ink, -.15)); g.dispose();
  return zAt;
}
// a closed crayon loop (the twins' loop feet and sled), now a chunky round runner
function loopTube(b, color, points, r = .045, segments = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), true);
  const g = new THREE.TubeGeometry(curve, segments, r, 6, true); b.put(g, 0, 0, 0, color); g.dispose();
}
const face = (b, zAt, x, y, r, opts) => eye(b, x, y, zAt(x, y) - r * .2, r, { iris: INK, core: INK === OCHRE ? '#3a2a1c' : null, ...opts });
const arm = (b, color, pts, r = .075, hand = .11) => limb(b, color, pts, r, r * .85, 10, hand);
function leg(b, color, top, footX, footZ = .04) {
  limb(b, color, [top, [(top[0] + footX) / 2, top[1] * .5 + .05, .02], [footX, .1, footZ]], .085, .075, 8);
  boot(b, shade(color, -.25), footX, 0, footZ, .13);
}

function antenna(b) {
  const c = TOY[PURPLE], zAt = body(b, PURPLE, [[-.44, .30], [-.44, .77], [-.32, 1.34], [-.10, 1.58], [.22, 1.57], [.44, 1.36], [.42, .76], [.29, .29]]);
  limb(b, PURPLE, [[-.11, 1.5, 0], [-.13, 1.75, .01], [-.14, 1.95, .015]], .03, .025, 6, .07);
  limb(b, PURPLE, [[.25, 1.5, 0], [.29, 1.7, .01], [.32, 1.87, .015]], .03, .025, 6, .07);
  face(b, zAt, -.14, 1.13, .095); face(b, zAt, .15, 1.15, .095);
  drawOn(b, PURPLE, zAt, [[-.20, .98], [-.13, .86], [0, .83], [.15, .89], [.20, 1.01]], .026);
  blush(b, CHEEK, zAt, -.3, .95); blush(b, CHEEK, zAt, .3, .97);
  arm(b, c, [[-.42, .85, 0], [-.62, .75, .05], [-.74, .6, .1]]); arm(b, c, [[.41, .85, 0], [.6, .74, .05], [.72, .6, .1]]);
  // This twin has two curved loop feet; her sibling has the longer, continuous sled runner.
  loopTube(b, PURPLE, [[-.24, .20, .08], [-.61, .23, .09], [-.96, .13, .10], [-.51, .06, .11], [-.17, .17, .10]], .045);
  loopTube(b, PURPLE, [[.22, .20, .08], [.50, .23, .09], [.83, .12, .10], [.47, .07, .11], [.14, .18, .10]], .043);
}

function antennaTwin(b) {
  const c = TOY[PURPLE], zAt = body(b, PURPLE, [[-.43, .31], [-.49, .75], [-.47, 1.43], [-.30, 1.73], [.13, 1.75], [.41, 1.51], [.45, .77], [.43, .30]]);
  limb(b, PURPLE, [[-.22, 1.66, 0], [-.23, 1.9, .01], [-.24, 2.10, .015]], .03, .025, 6, .07);
  limb(b, PURPLE, [[.23, 1.64, 0], [.25, 1.84, .01], [.27, 2.02, .015]], .03, .025, 6, .07);
  face(b, zAt, -.14, 1.17, .095); face(b, zAt, .15, 1.19, .095);
  drawOn(b, PURPLE, zAt, [[-.20, 1.02], [-.13, .90], [0, .87], [.15, .93], [.20, 1.05]], .026);
  blush(b, CHEEK, zAt, -.31, .99); blush(b, CHEEK, zAt, .31, 1.01);
  arm(b, c, [[-.45, .9, 0], [-.64, .78, .05], [-.74, .62, .1]]); arm(b, c, [[.44, .9, 0], [.63, .78, .05], [.73, .62, .1]]);
  // The second photo's taller, straighter body stands on a broad upturned skate/sled base.
  limb(b, PURPLE, [[-1.0, .19, .04], [-.70, .085, .08], [0, .065, .10], [.72, .10, .08], [1.0, .22, .04]], .05, .05, 16);
  for (const s of [-1, 1]) limb(b, c, [[s * .28, .34, 0], [s * .36, .22, .04], [s * .40, .11, .08]], .05, .045, 4);
}

function bean(b) {
  const c = TOY[PINK], zAt = body(b, PINK, [[-.20, .68], [-.47, .91], [-.49, 1.42], [-.25, 1.74], [.18, 1.78], [.48, 1.49], [.48, 1.03], [.42, .68], [.17, .49], [-.04, .52]]);
  arm(b, c, [[-.42, 1.02, 0], [-.71, .90, .03], [-1.0, .69, .06]]);
  arm(b, c, [[.43, 1.22, 0], [.73, 1.19, .03], [1.0, 1.16, .06]]);
  leg(b, c, [-.10, .62, 0], -.42); leg(b, c, [.30, .6, 0], .46);
  face(b, zAt, -.14, 1.3, .1); face(b, zAt, .15, 1.28, .1);
  drawOn(b, PINK, zAt, [[-.20, 1.09], [-.10, .98], [.04, .94], [.17, .97]], .026);
  blush(b, CHEEK, zAt, -.33, 1.1); blush(b, CHEEK, zAt, .33, 1.1);
}

function wide(b) {
  const c = TOY[BROWN], zAt = body(b, BROWN, [[-.34, .48], [-.51, .84], [-.45, 1.40], [-.23, 1.67], [.05, 1.67], [.35, 1.50], [.44, 1.12], [.38, .83], [.45, .51], [.14, .38]]);
  // the drawing's long straight ears, now soft floppy plush ears
  limb(b, c, [[-.25, 1.56, 0], [-.62, 1.6, -.02], [-1.0, 1.61, -.02], [-1.17, 1.61, 0]], .075, .055, 10, .065);
  limb(b, c, [[.25, 1.52, 0], [.71, 1.6, -.02], [1.0, 1.61, -.02], [1.18, 1.61, 0]], .075, .055, 10, .065);
  arm(b, c, [[-.44, 1.11, 0], [-.83, 1.15, .04], [-1.18, 1.05, .07]]);
  arm(b, c, [[.40, 1.15, 0], [.83, 1.12, .04], [1.2, 1.09, .07]]);
  leg(b, c, [-.16, .48, 0], -.48); leg(b, c, [.26, .49, 0], .62);
  face(b, zAt, -.14, 1.33, .1); face(b, zAt, .15, 1.33, .095);
  // The original expression is downturned. A friendly voice need not erase the child's frown.
  drawOn(b, BROWN, zAt, [[-.16, .94], [0, 1.02], [.14, .93], [.12, .85]], .026);
}

function droopy(b) {
  // The other brown drawing has a bean-like cheek notch and arching, unequal droopy ears.
  const c = TOY[BROWN], zAt = body(b, BROWN, [[-.28, .56], [-.47, .94], [-.44, 1.40], [-.29, 1.65], [.06, 1.62], [.35, 1.46], [.45, 1.18], [.31, 1.02], [.45, .85], [.52, .57], [.26, .41], [-.02, .43]]);
  limb(b, c, [[-.28, 1.52, 0], [-.58, 1.94, -.02], [-.87, 1.78, -.02], [-1.06, 1.45, 0]], .08, .065, 12, .075);
  limb(b, c, [[.26, 1.45, 0], [.65, 1.68, -.02], [.93, 1.6, -.02], [1.12, 1.41, 0]], .08, .065, 12, .075);
  arm(b, c, [[-.43, 1.04, 0], [-.77, .99, .04], [-1.16, .87, .07]]);
  arm(b, c, [[.40, 1.17, 0], [.83, 1.12, .04], [1.2, 1.06, .07]]);
  leg(b, c, [-.05, .48, 0], -.48); leg(b, c, [.36, .48, 0], .78);
  face(b, zAt, -.11, 1.3, .1); face(b, zAt, .17, 1.27, .095);
  drawOn(b, BROWN, zAt, [[-.16, .94], [0, 1.03], [.14, .95], [.12, .87]], .026);
  // A short crease emphasizes the little inward cheek of the original outline.
  drawOn(b, BROWN, zAt, [[.34, 1.12], [.28, 1.02], [.34, .94]], .018);
}

function taper(b) {
  const c = TOY[ORANGE], dark = ORANGE;
  const zAt = body(b, ORANGE, [[-.20, .14], [-.36, .54], [-.41, 1.01], [-.70, 1.58], [-.57, 1.87], [-.10, 2.01], [.44, 1.90], [.71, 1.62], [.64, 1.30], [.35, 1.10], [.17, .57], [.08, .16]]);
  arm(b, c, [[-.38, 1.02, 0], [-.64, .99, .04], [-.72, 1.23, .06], [-.72, 1.42, .07]], .05, .08);
  arm(b, c, [[.35, 1.09, 0], [.49, .84, .05], [.36, .8, .09]], .05, .07);
  // the drawing's sleepy dash eyes become big shiny eyes with soft lids
  face(b, zAt, -.25, 1.55, .1, { lid: c }); face(b, zAt, .29, 1.52, .095, { lid: c });
  drawOn(b, dark, zAt, [[.03, 1.31], [.10, 1.37], [.17, 1.33], [.11, 1.28], [.03, 1.31]], .02);
  drawOn(b, dark, zAt, [[-.32, 1.18], [-.18, 1.10], [-.01, 1.12], [.03, 1.24]], .026);
  drawOn(b, dark, zAt, [[-.10, 1.10], [-.09, .99], [-.18, .94], [-.22, 1.00], [-.10, 1.03]], .02);
  drawOn(b, dark, zAt, [[.01, 1.12], [.08, 1.00], [.05, .93]], .022);
  drawOn(b, dark, zAt, [[-.22, .53], [.12, .48], [0, .31], [-.22, .53]], .022);
  blush(b, CHEEK, zAt, -.45, 1.35); blush(b, CHEEK, zAt, .48, 1.33);
  for (const s of [-1, 1]) boot(b, shade(ORANGE, -.15), s * .24, 0, .05, .11);
}

function box(b) {
  const c = TOY[BLUE], zAt = body(b, BLUE, [[-.44, .58], [-.58, .86], [-.58, 1.43], [-.39, 1.72], [.16, 1.76], [.49, 1.59], [.58, 1.20], [.49, .70], [.10, .55]]);
  arm(b, c, [[-.51, 1.04, 0], [-.8, .98, .04], [-1.08, .93, .07]]);
  arm(b, c, [[.52, 1.05, 0], [.8, .98, .04], [1.08, .91, .07]]);
  for (const s of [-1, 1]) leg(b, c, [s * .16, .62, 0], s * .3);
  face(b, zAt, -.18, 1.3, .105); face(b, zAt, .19, 1.3, .105);
  drawOn(b, BLUE, zAt, [[-.16, .95], [0, .94], [.16, .98]], .024);
  blush(b, CHEEK, zAt, -.38, 1.08); blush(b, CHEEK, zAt, .4, 1.08);
}

function loop(b) {
  const c = TOY[PENCIL], dark = PENCIL;
  const zAt = body(b, PENCIL, [[-.37, .52], [-.57, .87], [-.54, 1.39], [-.29, 1.70], [.12, 1.76], [.45, 1.61], [.57, 1.26], [.46, .84], [.19, .56], [-.03, .61]]);
  arm(b, c, [[-.48, 1.09, 0], [-.77, 1.17, .04], [-1.0, 1.5, .07]]);
  arm(b, c, [[.50, 1.28, 0], [.86, 1.35, .04], [1.0, 1.53, .07]]);
  for (const s of [-1, 1]) leg(b, c, [s * .12, .58, 0], s * .26);
  drawOn(b, dark, zAt, [[-.33, 1.47], [-.20, 1.49]], .02);
  drawOn(b, dark, zAt, [[.11, 1.50], [.28, 1.49]], .02);
  drawOn(b, dark, zAt, [[-.12, 1.65], [-.30, 1.76], [-.42, 1.68]], .02);
  // the curly spiral eyes stay, exactly as drawn, on shiny white eye balls
  const balls = [[-.21, 1.23, .14, .14], [.19, 1.24, .2, .21]].map(([x, y, rx, ry]) => { const z = zAt(x, y) - .045; b.put(DOT, x, y, z, '#ffffff', [rx, ry, .07]); return [x, y, rx, ry, z]; });
  // each spiral sits just on top of whichever is in front there: the eye ball or the body
  const lift = (x, y) => Math.max(zAt(x, y) + .03, ...balls.map(([bx, by, rx, ry, bz]) => { const q = 1 - ((x - bx) / rx) ** 2 - ((y - by) / ry) ** 2; return q > 0 ? bz + .07 * Math.sqrt(q) + .012 : 0; }));
  drawOn(b, dark, lift, [[-.18, 1.15], [-.29, 1.15], [-.30, 1.28], [-.21, 1.32], [-.14, 1.25], [-.13, 1.19], [-.05, 1.27]], .02, 0);
  drawOn(b, dark, lift, [[.17, 1.12], [.05, 1.25], [.12, 1.40], [.29, 1.40], [.34, 1.28], [.27, 1.18], [.24, 1.08], [.31, .98]], .02, 0);
  drawOn(b, dark, zAt, [[-.21, .92], [0, .83], [.17, .87], [.23, 1.00]], .026);
}

function leaf(b) {
  const c = TOY[OCHRE], zAt = body(b, OCHRE, [[-.47, 1.87], [-.40, 1.46], [-.23, 1.15], [.11, 1.08], [.19, .76], [.49, 1.02], [.57, 1.33], [.34, 1.60], [-.01, 1.78]], .3);
  arm(b, c, [[-.23, 1.15, 0], [-.58, .96, .04], [-1.0, .68, .07]]);
  arm(b, c, [[.46, 1.47, 0], [.75, 1.42, .04], [1.0, 1.17, .07]]);
  // My long legs love a happy hop!
  limb(b, c, [[.02, 1.15, 0], [-.04, .6, .03], [-.09, .12, .05]], .07, .06, 8); boot(b, shade(OCHRE, -.2), -.09, 0, .05, .1);
  limb(b, c, [[.27, .9, 0], [.36, .5, .03], [.33, .12, .05]], .06, .055, 8); boot(b, shade(OCHRE, -.2), .33, 0, .05, .1);
  b.put(DOT, .07, .98, 0, c, [.26, .24, .22]); // a round hip where the long legs join the body (so the middle of the friend is solid to tap)
  face(b, zAt, -.18, 1.55, .085); face(b, zAt, .12, 1.52, .08);
  drawOn(b, OCHRE, zAt, [[-.10, 1.35], [.08, 1.31], [.24, 1.26]], .024);
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
