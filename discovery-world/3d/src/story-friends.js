// (build 128) The family asked for characters like the ones Dawson loves from shows and films. Those belong to other people,
// so these are ORIGINAL friends in the same spirit: a pop-star trio, a big grinning stripy cat, a snow family and a
// neighbourhood of puppies. Each is one painted solid in the creature batch (one shared material, no new shader), built
// from the same round toy parts as the drawing friends (plush.js).
import * as THREE from 'three';
import { limb, eye, boot, drawOn, blush } from './plush.js';

const BALL = new THREE.SphereGeometry(1, 12, 9);
const SMALL = new THREE.SphereGeometry(1, 8, 6);
const DOT = new THREE.SphereGeometry(1, 6, 4);
const CONE = new THREE.ConeGeometry(1, 1, 10);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 10);
const INK = '#2a2333';

const dot = (b, color, x, y, z, sx, sy = sx, sz = sx, rot) => b.put(DOT, x, y, z, color, [sx, sy, sz], rot);
const ball = (b, color, x, y, z, sx, sy = sx, sz = sx, large = false, rot) => b.put(large ? BALL : SMALL, x, y, z, color, [sx, sy, sz], rot);
// the front surface of an upright ball (centre c, radii r): where a face is drawn
const front = (c, r) => (x, y) => c[2] + r[2] * Math.sqrt(Math.max(0, 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2));

// ---------- people: the singers, the ice princess and the mountain guide ----------
function person(b, o) {
  const { skin = '#f1c6a6', hair, top, bottom, sleeve = top, shoes = '#ffffff', iris = '#4a3326', lips = '#d9567a' } = o;
  if (o.gown) {
    b.put(CONE, 0, .47, 0, o.gown, [.44, .94, .36]);                                  // a long gown down to the ground
    ball(b, o.gown, 0, .06, 0, .44, .06, .36);
    if (o.cape) ball(b, o.cape, 0, .78, -.16, .3, .62, .06);                          // a see-through-looking cape behind
  } else {
    for (const s of [-1, 1]) { limb(b, o.legs || skin, [[s * .09, .74, 0], [s * .1, .42, .02], [s * .1, .14, .02]], .065, .055, 6); boot(b, shoes, s * .1, 0, .0, .1); }
    ball(b, bottom, 0, .78, 0, .21, .14, .155);                                       // shorts or a skirt
    if (o.skirt) b.put(CONE, 0, .72, 0, bottom, [.27, .26, .2]);
  }
  ball(b, top, 0, 1.0, 0, .19, .25, .14, true);                                       // the body
  if (o.jacket) { for (const s of [-1, 1]) ball(b, o.jacket, s * .12, 1.03, .0, .11, .25, .155); ball(b, o.jacket, 0, 1.04, -.04, .2, .24, .12); }
  for (const s of [-1, 1]) {
    limb(b, o.jacket || sleeve, [[s * .19, 1.17, 0], [s * .29, .97, .03], [s * .31, .8, .07]], .055, .048, 6);
    dot(b, skin, s * .31, .76, .08, .05, .055, .05);                                  // hands
  }
  if (o.belt) ball(b, o.belt, 0, .84, 0, .2, .03, .15);
  dot(b, skin, 0, 1.27, 0, .05, .06, .05);                                           // neck
  const hc = [0, 1.44, 0], hr = [.18, .2, .18], face = front(hc, hr);
  ball(b, skin, ...hc, ...hr, true);
  // hair: a cap over the top and back, a fringe, then the style
  ball(b, hair, 0, 1.5, -.03, .2, .18, .19, true);
  ball(b, hair, 0, 1.59, .07, .16, .06, .1);
  for (const s of [-1, 1]) ball(b, hair, s * .16, 1.42, -.02, .05, .13, .1);
  if (o.style === 'pony') limb(b, hair, [[0, 1.6, -.14], [0, 1.52, -.3], [0, 1.15, -.34], [0, .72, -.3]], .09, .045, 10);
  if (o.style === 'braid' || o.style === 'sidebraid') {
    const side = o.style === 'sidebraid' ? 1 : 0;
    for (let i = 0; i < 9; i++) { const k = i / 8; dot(b, hair, side * (.17 + k * .04) + (i % 2 ? .018 : -.018), 1.5 - k * (side ? .55 : .8), side ? .06 + k * .06 : -.19 - Math.sin(k * 3) * .04, .065 - k * .02, .055, .06); }
    if (o.braidTop) ball(b, hair, 0, 1.66, -.08, .12, .1, .12);                       // the high crown the braid starts from
  }
  if (o.style === 'buns') for (const s of [-1, 1]) { ball(b, hair, s * .15, 1.56, -.1, .085, .085, .085); }
  if (o.style === 'hat') { ball(b, o.hat, 0, 1.6, -.01, .21, .13, .2); for (const s of [-1, 1]) ball(b, o.hat, s * .17, 1.43, -.01, .05, .1, .07); ball(b, o.hatBand || '#ffffff', 0, 1.53, .02, .21, .035, .2); }
  if (o.tiara) for (let i = -2; i <= 2; i++) b.put(CONE, i * .045, 1.66 - Math.abs(i) * .012, .1, o.tiara, [.022, .07 - Math.abs(i) * .012, .02]);
  // the face
  for (const s of [-1, 1]) eye(b, s * .068, 1.45, face(s * .068, 1.45) - .012, .042, { iris, tall: 1.25, core: INK });
  drawOn(b, lips, face, [[-.05, 1.355], [0, 1.34], [.05, 1.355]], .012, .006);
  for (const s of [-1, 1]) blush(b, '#ff9fb5', face, s * .11, 1.38, .032);
  if (o.mic) { b.put(CYL, .31, .86, .1, '#3b3b4a', [.018, .14, .018]); ball(b, o.mic, .31, .95, .1, .045); }
  if (o.wand) { b.put(CYL, -.31, .86, .1, '#d6f3ff', [.012, .2, .012]); ball(b, '#bff0ff', -.31, .98, .1, .04); }
  if (o.pack) ball(b, o.pack, 0, 1.0, -.2, .17, .2, .08);
}

// ---------- four-legged friends: the puppies and the reindeer ----------
function pup(b, o) {
  const { coat, belly = coat, ear = coat, len = 1, legH = .22, snout = 1, nose = INK, iris = '#3a2418' } = o;
  const by = legH + .18, hz = .3 * len + .12, hy = legH + .45;
  ball(b, coat, 0, by, 0, .2, .19, .32 * len, true);                                  // body
  ball(b, belly, 0, by - .06, .04, .15, .12, .27 * len);
  for (const [x, z] of [[-.11, .2], [.11, .2], [-.11, -.2], [.11, -.2]]) {
    limb(b, o.legs || coat, [[x, by - .04, z * len], [x, .06, z * len + .02]], .065, .052, 4);
    ball(b, o.paws || belly, x, .045, z * len + .05, .06, .045, .075);
  }
  ball(b, coat, 0, hy - .12, hz - .14, .13, .15, .13);                                // neck
  const hc = [0, hy, hz], hr = [.2, .19, .19];
  ball(b, coat, ...hc, ...hr, true);                                                  // head
  if (o.mask) for (const s of [-1, 1]) ball(b, o.mask, s * .09, hy + .05, hz + .06, .1, .1, .13);
  if (o.blaze) ball(b, o.blaze, 0, hy + .06, hz + .1, .05, .13, .1);
  const mc = [0, hy - .07, hz + .14], mr = [.11, .08, .1 * snout];
  ball(b, belly, ...mc, ...mr);                                                       // muzzle
  ball(b, nose, 0, hy - .04, mc[2] + mr[2] - .005, .042, .032, .03);
  drawOn(b, INK, front(mc, mr), [[-.05, hy - .1], [0, hy - .12], [.05, hy - .1]], .01, .004);
  const headFront = front(hc, hr);
  for (const s of [-1, 1]) eye(b, s * .085, hy + .05, headFront(s * .085, hy + .05) - .02, .05, { iris, tall: 1.2, core: INK });
  for (const s of [-1, 1]) {
    if (o.earType === 'up') b.put(CONE, s * .12, hy + .2, hz - .03, ear, [.075, .17, .045], [0, 0, -s * .3]);
    else if (o.earType === 'puff') ball(b, ear, s * .19, hy - .02, hz - .02, .09, .12, .09);
    else ball(b, ear, s * .19, hy - .02, hz - .01, .05, .14, .08, false, [0, 0, s * .25]); // floppy ears
  }
  const tz = -.32 * len;
  if (o.tail === 'curl') limb(b, o.tailColor || coat, [[0, by + .1, tz], [0, by + .26, tz - .05], [0, by + .3, tz + .06], [0, by + .22, tz + .08]], .045, .035, 8);
  else if (o.tail !== 'none') limb(b, o.tailColor || coat, [[0, by + .08, tz], [0, by + .2, tz - .1], [0, by + .32, tz - .12]], .04, .03, 6, o.tail === 'puff' ? .08 : 0);
  if (o.tailTip) ball(b, o.tailTip, 0, by + .32, tz - .12, .045);
  for (const [x, y, z, r, c] of o.spots || []) dot(b, c, x, y, z, r, r, r * .7);
  if (o.antlers) for (const s of [-1, 1]) {
    limb(b, o.antlers, [[s * .07, hy + .16, hz - .04], [s * .14, hy + .34, hz - .08], [s * .2, hy + .5, hz - .06]], .025, .018, 5);
    limb(b, o.antlers, [[s * .13, hy + .3, hz - .07], [s * .06, hy + .44, hz - .02]], .018, .014, 3);
  }
  if (o.collar) ball(b, o.collar, 0, hy - .2, hz - .12, .14, .035, .13);
  if (o.puffs) for (const [x, y, z, r] of o.puffs) ball(b, coat, x, y, z, r);
}

// ---------- the big stripy cat ----------
function stripyCat(b) {
  const fur = '#6f6fe0', dark = '#2f2d7a', pale = '#b9b4ff';
  ball(b, fur, 0, .38, -.05, .44, .34, .55, true);                                    // a big round lying-down body
  ball(b, pale, 0, .3, .2, .3, .22, .3);
  for (const s of [-1, 1]) { ball(b, fur, s * .26, .1, .5, .14, .1, .2); ball(b, pale, s * .26, .07, .66, .09, .05, .06); ball(b, fur, s * .32, .14, -.42, .16, .13, .2); }
  const hc = [0, .78, .45], hr = [.38, .33, .3], face = front(hc, hr);
  ball(b, fur, ...hc, ...hr, true);                                                   // the big head
  for (const s of [-1, 1]) { b.put(CONE, s * .24, 1.12, .4, fur, [.11, .2, .07], [0, 0, -s * .35]); b.put(CONE, s * .235, 1.1, .44, '#ff9fd2', [.06, .12, .02], [0, 0, -s * .35]); }
  for (const s of [-1, 1]) eye(b, s * .15, .86, face(s * .15, .86) - .03, .1, { iris: '#f0a13a', tall: 1.05, core: INK, look: [-s * .3, 0] });
  ball(b, '#ff6fa5', 0, .76, face(0, .76) + .005, .045, .035, .03);                   // nose
  // the wide happy grin, with two little round teeth
  drawOn(b, INK, face, [[-.22, .7], [-.1, .63], [0, .62], [.1, .63], [.22, .7]], .016, .008);
  for (const s of [-1, 1]) b.put(CONE, s * .07, .6, face(s * .07, .62) + .005, '#ffffff', [.025, .05, .02], [0, 0, Math.PI]);
  for (const s of [-1, 1]) for (const k of [0, 1]) drawOn(b, dark, face, [[s * .28, .82 - k * .07], [s * .35, .83 - k * .08]], .012, .005); // cheek stripes
  for (const x of [-.1, 0, .1]) drawOn(b, dark, face, [[x, 1.05], [x, .97]], .014, .004);                                              // forehead stripes
  for (const z of [-.45, -.25, -.05, .15]) dot(b, dark, 0, .69, z, .32, .035, .05);                                  // back stripes
  for (const s of [-1, 1]) for (const z of [-.35, -.1, .12]) dot(b, dark, s * .41, .45, z, .04, .16, .045);
  const tail = [[0, .45, -.55], [.05, .65, -.75], [.02, .95, -.82], [-.06, 1.15, -.7]];
  limb(b, fur, tail, .075, .06, 10, .07);
  for (let i = 1; i <= 4; i++) { const k = i / 5, p = new THREE.CatmullRomCurve3(tail.map(q => new THREE.Vector3(...q))).getPointAt(k); dot(b, dark, p.x, p.y, p.z, .078, .03, .078); }
  // a tiny top hat, tipped a little
  b.put(CYL, .1, 1.16, .38, INK, [.1, .03, .1], [0, 0, -.2]); b.put(CYL, .115, 1.24, .38, INK, [.065, .14, .065], [0, 0, -.2]); b.put(CYL, .108, 1.2, .38, '#ffd23f', [.067, .025, .067], [0, 0, -.2]);
}

// ---------- the snow buddy (a classic snowman with a scarf and a bobble hat) ----------
function snowBuddy(b) {
  const snow = '#f7fbff';
  ball(b, snow, 0, .36, 0, .38, .36, .36, true); ball(b, snow, 0, .9, 0, .28, .26, .27, true);
  const hc = [0, 1.32, 0], hr = [.21, .21, .21], face = front(hc, hr); ball(b, snow, ...hc, ...hr, true);
  for (const s of [-1, 1]) eye(b, s * .075, 1.37, face(s * .075, 1.37) - .015, .04, { iris: INK, tall: 1.1 });
  b.put(CONE, 0, 1.3, face(0, 1.3) + .09, '#ff8a2a', [.04, .2, .04], [Math.PI / 2, 0, 0]); // a carrot nose
  drawOn(b, INK, face, [[-.08, 1.24], [0, 1.21], [.08, 1.24]], .014, .006);
  for (const y of [.98, .86, .5, .36]) ball(b, INK, 0, y, front([0, y > .7 ? .9 : .36, 0], y > .7 ? [.28, .26, .27] : [.38, .36, .36])(0, y) - .01, .035);
  ball(b, '#e3344a', 0, 1.12, 0, .22, .05, .21);                                     // scarf
  limb(b, '#e3344a', [[.12, 1.1, .17], [.17, .95, .22], [.2, .82, .2]], .045, .04, 4);
  ball(b, '#3d7bd9', 0, 1.47, -.01, .2, .12, .2); ball(b, '#ffffff', 0, 1.62, -.01, .06);                          // bobble hat
  for (const s of [-1, 1]) { limb(b, '#7a5230', [[s * .26, .98, 0], [s * .46, 1.12, .04], [s * .58, 1.3, .06]], .025, .02, 4); limb(b, '#7a5230', [[s * .46, 1.12, .04], [s * .56, 1.14, .08]], .016, .014, 2); }
}

const person0 = { skin: '#f1c6a6' };
const resident = (name, voice, build, action, line, colors, move = 'hop', extra = {}) => ({
  name, planet: 'earth', move, v: .55, r: 1.1, size: 1, hopH: .1, emoji: '⭐', voice, build, play: { action, line, colors }, ...extra,
});
const dog = (name, voice, o, action = 'bounce', line = 'Woof woof! Let’s play!') => resident(name, voice, b => pup(b, o), action, line, [o.coat, o.belly || o.coat], 'hop', { emoji: '🐶', hopH: .14 });

export const STORY_FRIENDS = {
  // the pop-star trio (Art Plaza stage)
  singerjuno: resident('Juno the Singer', 'Hi! I am Juno! Let’s sing a sparkly song together!', b => person(b, { ...person0, hair: '#9b5cf0', top: '#efe6ff', bottom: '#2c2d4a', jacket: '#ffc928', style: 'braid', braidTop: true, mic: '#c9c9d6', belt: '#ff6f9f', shoes: '#ffffff' }), 'sing', 'La la la! Sing with me!', ['#9b5cf0', '#ffc928']),
  singerrosa: resident('Rosa the Singer', 'Hello! I am Rosa! Let’s dance to the music!', b => person(b, { ...person0, skin: '#f6d2bd', hair: '#ff5c8a', top: '#2a2333', bottom: '#ffd23f', skirt: true, style: 'pony', shoes: '#2a2333', belt: '#c9c9d6', iris: '#5a3a2a' }), 'twirl', 'Spin and twirl! You dance so well!', ['#ff5c8a', '#ffd23f']),
  singermina: resident('Mina the Singer', 'Hi there! I am Mina! Let’s clap to the beat!', b => person(b, { ...person0, skin: '#efc3a0', hair: '#24203a', top: '#2ec4c4', bottom: '#5865c9', style: 'buns', shoes: '#f7f7ff', belt: '#2ec4c4' }), 'bounce', 'Clap, clap, jump! Great beat!', ['#2ec4c4', '#5865c9']),
  // the big grinning stripy cat (Toy Town)
  stripycat: resident('Grinny the Stripy Cat', 'Hello! I am Grinny! Look at my big happy smile!', stripyCat, 'bounce', 'Purr purr! Pounce, pounce!', ['#6f6fe0', '#f0a13a'], 'slide', { v: .25, r: .6 }),
  // the snow family (Frosty Peaks)
  iceprincess: resident('Princess Crystal', 'Hello! I am Princess Crystal! Let’s make snowflakes sparkle!', b => person(b, { ...person0, skin: '#f8dccb', hair: '#f6edc4', top: '#a9e4f7', gown: '#7fd3ef', cape: '#d6f3ff', style: 'sidebraid', tiara: '#bff0ff', wand: true, iris: '#2f78b8', lips: '#e0708f' }), 'sparkle', 'Sparkle, sparkle! Snowflakes everywhere!', ['#7fd3ef', '#ffffff']),
  snowbuddy: resident('Snowball Buddy', 'Hi! I am Snowball Buddy! I love warm hugs!', snowBuddy, 'hug', 'A big snowy hug!', ['#f7fbff', '#e3344a'], 'slide', { v: .3 }),
  reindeerpal: dog('Pinecone the Reindeer', 'Hello! I am Pinecone! Let’s gallop in the snow!', { coat: '#9a6a43', belly: '#e7cfa8', ear: '#9a6a43', legH: .42, len: 1.15, snout: 1.4, antlers: '#d9c29a', tail: 'puff', tailColor: '#f4ead8', nose: '#4a2a1a' }, 'bounce', 'Gallop, gallop! Jump with me!'),
  mountainguide: resident('Rowan the Mountain Guide', 'Hello, explorer! I am Rowan! Let’s climb the snowy hill!', b => person(b, { ...person0, skin: '#e8b996', hair: '#c88a4a', top: '#3f8a5a', jacket: '#3f8a5a', bottom: '#6b4a2e', legs: '#6b4a2e', shoes: '#4a3020', style: 'hat', hat: '#8a5a33', hatBand: '#e8dcc8', pack: '#b5452f', lips: '#b0605a' }), 'twirl', 'Up the mountain! Hooray!', ['#3f8a5a', '#8a5a33']),
  // the puppy neighbourhood (Happy Farm and Toy Town)
  pupskipper: dog('Skipper the Blue Pup', 'Woof! I am Skipper! Let’s play a running game!', { coat: '#6d8fd4', belly: '#e9d6a8', ear: '#2f3e80', earType: 'up', mask: '#2f3e80', paws: '#e9d6a8', tailTip: '#2f3e80', spots: [[.0, .58, -.12, .1, '#2f3e80']] }),
  pupginger: dog('Ginger the Red Pup', 'Woof woof! I am Ginger! Can you catch me?', { coat: '#f0954a', belly: '#f6e3c2', ear: '#d06a2a', earType: 'up', paws: '#f6e3c2', tailTip: '#f6e3c2' }),
  pupdotty: dog('Dotty the Spotty Pup', 'Hello! I am Dotty! Count my spots with me!', { coat: '#fbfbfb', belly: '#fbfbfb', ear: INK, earType: 'flop', spots: [[.14, .5, .1, .05, INK], [-.12, .46, -.15, .05, INK], [.05, .6, -.22, .04, INK], [-.1, .56, .12, .04, INK], [.16, .42, -.08, .04, INK]] }),
  pupfluffy: dog('Fluffy the Pink Poodle', 'Hi hi! I am Fluffy! Let’s fluff up and dance!', { coat: '#ff9fd0', ear: '#ff9fd0', earType: 'puff', legH: .28, tail: 'puff', nose: '#7a2a52', puffs: [[0, .82, .28, .13], [0, .4, -.32, .14], [0, .45, .26, .13]] }, 'twirl', 'Fluffy twirl! Round we go!'),
  pupwaffles: dog('Waffles the Pug', 'Snort snort! I am Waffles! I love belly rubs!', { coat: '#e9c98f', belly: '#e9c98f', ear: '#3b2c26', earType: 'flop', snout: .55, mask: '#5a4436', tail: 'curl', len: .85 }),
  pupnoodle: dog('Noodle the Long Pup', 'Hello! I am Noodle! I am long and wiggly!', { coat: '#8a4a26', belly: '#c98a5a', ear: '#6a3418', earType: 'flop', legH: .12, len: 1.6, snout: 1.4 }),
  pupblizzard: dog('Blizzard the Husky', 'Awoo! I am Blizzard! I love the snow!', { coat: '#7d8494', belly: '#f7f7fb', ear: '#5b6272', earType: 'up', mask: '#f7f7fb', blaze: '#f7f7fb', tail: 'curl', iris: '#3f9bd9' }),
  pupsunny: dog('Sunny the Golden Pup', 'Woof! I am Sunny! Let’s fetch the ball!', { coat: '#f3cf6e', belly: '#fbe7b0', ear: '#e7b852', earType: 'flop', collar: '#e3344a' }),
  puppepper: dog('Pepper the Beagle', 'Sniff sniff! I am Pepper! I can smell treats!', { coat: '#fbf5ea', belly: '#fbf5ea', ear: '#a2612e', earType: 'flop', mask: '#a2612e', blaze: '#fbf5ea', tailTip: '#ffffff', spots: [[0, .58, -.12, .16, INK], [0, .52, .08, .1, '#a2612e']] }),
  puppatch: dog('Patch the Sheep Pup', 'Hello! I am Patch! Let’s round up the sheep!', { coat: INK, belly: '#fbfbfb', ear: INK, earType: 'up', blaze: '#fbfbfb', paws: '#fbfbfb', tailTip: '#fbfbfb', collar: '#2ec4c4' }),
};

// where each one lives (streamed with its district, like the family's drawing friends)
export const STORY_FRIEND_HOMES = [
  { kind: 'singerjuno', district: 'artplaza', x: 853, z: -4.4 },
  { kind: 'singerrosa', district: 'artplaza', x: 851.5, z: -4.6 },
  { kind: 'singermina', district: 'artplaza', x: 854.5, z: -4.6 },
  { kind: 'stripycat', district: 'toytown', x: 600, z: -4.6 },
  { kind: 'iceprincess', district: 'frosty', x: -330, z: -4.2 },
  { kind: 'snowbuddy', district: 'frosty', x: -340, z: -4.0 },
  { kind: 'reindeerpal', district: 'frosty', x: -362, z: -4.2 },
  { kind: 'mountainguide', district: 'frosty', x: -372, z: -4.0 },
  { kind: 'pupskipper', district: 'farm', x: -425, z: -3.8 },
  { kind: 'pupginger', district: 'farm', x: -428, z: -4.2 },
  { kind: 'pupdotty', district: 'farm', x: -450, z: -3.9 },
  { kind: 'pupfluffy', district: 'toytown', x: 570, z: -3.9 },
  { kind: 'pupwaffles', district: 'toytown', x: 590, z: -3.8 },
  { kind: 'pupnoodle', district: 'farm', x: -455, z: -4.2 },
  { kind: 'pupblizzard', district: 'frosty', x: -345, z: -3.8 },
  { kind: 'pupsunny', district: 'hills', x: -730, z: -3.8 },
  { kind: 'puppepper', district: 'hills', x: -745, z: -3.9 },
  { kind: 'puppatch', district: 'farm', x: -470, z: -3.9 },
];
