// (build 129) The family's second set of favourite-show pictures. Those characters belong to other companies, so these are
// ORIGINAL friends in the same spirit: fuzzy neighbourhood monsters, a rescue pup team, sea explorers, seaside friends,
// a pig family, a toy doctor with her plush patients, a little wheel robot and a rainbow of fluffy bunnies.
// Each is one painted solid in the creature batch (the same shared material, no new shader).
import * as THREE from 'three';
import { limb, eye, boot, drawOn, blush } from './plush.js';
import { BALL, SMALL, DOT, CONE, CYL, INK, dot, ball, front, person, pup, resident, dog } from './story-friends.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const face2 = (b, f, y, s, z0, r, o = {}) => { for (const k of [-1, 1]) eye(b, k * s, y, f(k * s, y) - z0, r, { iris: INK, tall: 1.15, ...o }); };

// ---------- fuzzy neighbourhood monsters ----------
function monster(b, o) {
  const { fur, h = 1, belly = fur } = o, cy = .55 * h, c = [0, cy, 0], r = [.36, .5 * h, .32], f = front(c, r);
  ball(b, fur, ...c, ...r, true);
  ball(b, belly, 0, cy - .12 * h, .1, .26, .3 * h, .24);
  // fluffy tufts all over (small, so the fur reads without a fur shader)
  for (let i = 0; i < 16; i++) { const a = i * 2.4, y = cy + Math.sin(i * 1.7) * .4 * h, rr = Math.sqrt(Math.max(.05, 1 - ((y - cy) / (r[1] * 1.02)) ** 2)); dot(b, fur, Math.cos(a) * .35 * rr, y, Math.sin(a) * .31 * rr, .07, .06, .07); }
  for (let i = 0; i < 6; i++) dot(b, fur, (i - 2.5) * .06, cy + r[1] - .02, (i % 2) * .05, .05, .12, .05, [0, 0, (i - 2.5) * .25]);  // a messy fringe on top
  const ey = cy + .2 * h;
  for (const s of [-1, 1]) eye(b, s * .12, ey + .06, f(s * .12, ey) + .02, o.eye || .085, { iris: INK, tall: 1.05 });  // big googly eyes standing out
  if (o.nose) ball(b, o.nose, 0, ey - .1, f(0, ey - .1) + .03, .07, .065, .06);
  const my = ey - .26;
  ball(b, '#5a1d2e', 0, my, f(0, my) - .04, .17, .09, .06);                            // the big happy open mouth
  dot(b, '#ff7f9e', 0, my - .04, f(0, my - .04) - .02, .09, .04, .03);
  for (const s of [-1, 1]) { limb(b, fur, [[s * .32, cy + .05, .02], [s * .48, cy - .15, .08], [s * .5, cy - .32, .12]], .07, .06, 6, .08); boot(b, o.feet || fur, s * .14, 0, .04, .12); limb(b, fur, [[s * .14, cy - .35 * h, 0], [s * .14, .08, .02]], .08, .07, 3); }
  if (o.horns) for (const s of [-1, 1]) b.put(CONE, s * .16, cy + r[1] + .05, -.02, o.horns, [.05, .16, .05], [0, 0, -s * .3]);
  if (o.antennae) for (const s of [-1, 1]) { limb(b, fur, [[s * .1, cy + r[1] - .04, 0], [s * .16, cy + r[1] + .18, .02], [s * .2, cy + r[1] + .3, .05]], .025, .02, 4); ball(b, o.antennae, s * .2, cy + r[1] + .32, .05, .055); }
  if (o.bow) for (const s of [-1, 1]) dot(b, o.bow, s * .07, cy + r[1] + .03, .1, .07, .05, .04, [0, 0, s * .4]);
  if (o.flower) { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; dot(b, o.flower, .5 + Math.cos(a) * .05, cy - .26 + Math.sin(a) * .05, .2, .04, .04, .02); } dot(b, '#ffd23f', .5, cy - .26, .21, .03); }
}

// ---------- upright animal friends (sea explorers, plush patients, the pig family) ----------
function critter(b, o) {
  const { fur, top = fur, legs = fur, belly = fur, h = 1, ears = 'round', iris = INK } = o;
  for (const s of [-1, 1]) { limb(b, legs, [[s * .1, .42 * h, 0], [s * .11, .1, .02]], .075, .065, 3); boot(b, o.feet || legs, s * .11, 0, .03, .1); }
  ball(b, top, 0, .62 * h, 0, .24, .3 * h, .2, true);
  if (o.belly) ball(b, belly, 0, .58 * h, .1, .16, .2 * h, .12);
  if (o.dress) b.put(CONE, 0, .5 * h, 0, o.dress, [.3, .4 * h, .24]);
  for (const s of [-1, 1]) limb(b, o.arms || top, [[s * .22, .78 * h, 0], [s * .34, .62 * h, .05], [s * .36, .5 * h, .1]], .06, .05, 5, .065);
  const hy = .98 * h + (o.neck || 0), hc = [0, hy, .02], hr = o.head || [.24, .22, .22], f = front(hc, hr);
  if (o.neck) { limb(b, fur, [[0, .8 * h, 0], [0, hy - .1, .02]], .08, .07, 4); for (const [x, y, z] of [[.06, .95, .06], [-.05, 1.1, .07], [.05, 1.22, .06]]) dot(b, o.spots || '#b8742f', x, y * h, z, .04, .04, .02); }
  ball(b, fur, ...hc, ...hr, true);
  if (ears === 'round') for (const s of [-1, 1]) ball(b, fur, s * .2, hy + .17, -.02, .08, .08, .05);
  if (ears === 'big') for (const s of [-1, 1]) ball(b, o.earColor || fur, s * .28, hy, -.04, .18, .2, .04);
  if (ears === 'pig') for (const s of [-1, 1]) b.put(CONE, s * .13, hy + .21, 0, fur, [.07, .12, .04], [0, 0, -s * .3]);
  if (ears === 'horns') for (const s of [-1, 1]) { limb(b, '#d9a24a', [[s * .07, hy + .18, 0], [s * .08, hy + .3, 0]], .02, .018, 2, .035); }
  const mz = f(0, hy - .06);
  if (o.snout === 'pig') { b.put(CYL, 0, hy - .04, mz + .04, o.snoutColor || fur, [.08, .1, .07], [Math.PI / 2, 0, 0]); for (const s of [-1, 1]) dot(b, '#b0506a', s * .03, hy - .04, mz + .095, .018, .022, .01); }
  else if (o.snout === 'trunk') limb(b, fur, [[0, hy - .04, mz - .02], [0, hy - .16, mz + .1], [0, hy - .2, mz + .18]], .06, .04, 6);
  else if (o.snout === 'long') { ball(b, o.snoutColor || fur, 0, hy - .06, mz + .06, .13, .09, .13); dot(b, INK, .05, hy - .02, mz + .17, .015); dot(b, INK, -.05, hy - .02, mz + .17, .015); }
  else if (o.snout === 'beak') b.put(CONE, 0, hy - .05, mz + .06, '#ff9a2a', [.05, .12, .04], [Math.PI / 2, 0, 0]);
  else { ball(b, o.snoutColor || '#ffffff', 0, hy - .07, mz - .02, .1, .07, .06); dot(b, o.nose || INK, 0, hy - .04, mz + .03, .035, .028, .025); }
  if (o.tusks) for (const s of [-1, 1]) b.put(CONE, s * .05, hy - .18, mz + .02, '#fffbea', [.018, .12, .018], [Math.PI, 0, 0]);
  if (o.whiskers) for (const s of [-1, 1]) drawOn(b, INK, f, [[s * .06, hy - .1], [s * .16, hy - .08]], .007, .004);
  face2(b, f, hy + .06, .085, .02, .048, { iris });
  drawOn(b, INK, f, [[-.045, hy - .13], [0, hy - .15], [.045, hy - .13]], .01, .005);
  for (const s of [-1, 1]) blush(b, '#ff9fb5', f, s * .13, hy - .05, .03);
  if (o.glasses) for (const s of [-1, 1]) { b.put(CYL, s * .085, hy + .06, f(s * .085, hy + .06) + .02, o.glasses, [.06, .01, .06], [Math.PI / 2, 0, 0]); }
  if (o.hat === 'sailor') { b.put(CYL, 0, hy + .19, 0, o.hatColor, [.17, .07, .17]); b.put(CYL, 0, hy + .15, .12, INK, [.12, .012, .08]); dot(b, '#ffffff', 0, hy + .2, .16, .04, .04, .015); }
  if (o.hat === 'bow') { dot(b, o.hatColor, -.08, hy + .2, .05, .07, .045, .03, [0, 0, .5]); dot(b, o.hatColor, .02, hy + .2, .05, .07, .045, .03, [0, 0, -.5]); }
  if (o.shell) { ball(b, o.shell, 0, .66 * h, -.16, .28, .32 * h, .14); for (const [x, y] of [[0, .7], [-.12, .55], [.12, .55], [-.12, .82], [.12, .82]]) dot(b, o.shellSpots || '#4f7d3a', x, y * h, -.29, .06, .06, .02); }
  if (o.tail === 'curl') limb(b, fur, [[0, .5 * h, -.18], [.05, .58 * h, -.28], [-.02, .64 * h, -.3], [0, .58 * h, -.24]], .02, .015, 6);
  if (o.tail === 'dino') { limb(b, fur, [[0, .45 * h, -.15], [0, .3, -.4], [0, .15, -.62]], .1, .03, 6); for (let i = 0; i < 4; i++) b.put(CONE, 0, hy + .2 - i * .2, -.15 - i * .05, o.spikes || '#ffd23f', [.04, .1, .03]); }
  if (o.tail === 'long') limb(b, fur, [[0, .5 * h, -.15], [.1, .4, -.35], [.2, .5, -.5]], .05, .03, 6);
  if (o.cap) ball(b, o.cap, 0, hy + .2, 0, .15, .07, .15);
  if (o.stetho) { limb(b, '#ff6fa5', [[-.12, .88 * h, .12], [0, .78 * h, .2], [.12, .88 * h, .12]], .015, .015, 5); dot(b, '#c9c9d6', 0, .74 * h, .21, .04, .04, .015); }
  if (o.stripes) for (const y of [.5, .62, .74]) ball(b, o.stripes, 0, y * h, .005, .245, .025, .205);
}

// ---------- seaside friends ----------
function starfish(b) {
  const c = '#ff8fb6';
  ball(b, c, 0, .45, 0, .2, .2, .12, true);
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * Math.PI * 2 / 5; limb(b, c, [[Math.cos(a) * .12, .45 + Math.sin(a) * .12, 0], [Math.cos(a) * .48, .45 + Math.sin(a) * .48, .02]], .13, .05, 4, .05); }
  for (let i = 0; i < 7; i++) dot(b, '#ffd0e0', Math.cos(i * 2.1) * .3, .45 + Math.sin(i * 2.1) * .3, .08, .025, .025, .015);
  const f = (x, y) => .12 + .01;
  for (const s of [-1, 1]) eye(b, s * .07, .5, .1, .05, { iris: INK });
  drawOn(b, INK, f, [[-.06, .39], [0, .36], [.06, .39]], .012, 0);
}
function crab(b) {
  const c = '#ff7a3d', c2 = '#ffb38a';
  ball(b, c, 0, .3, 0, .36, .2, .26, true); ball(b, c2, 0, .26, .1, .26, .12, .18);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) limb(b, c, [[s * .28, .26, -.1 + k * .1], [s * .46, .22, -.12 + k * .12], [s * .52, .02, -.12 + k * .12]], .035, .025, 3);
    limb(b, c, [[s * .3, .34, .12], [s * .44, .5, .22], [s * .42, .62, .3]], .05, .045, 4);
    ball(b, c, s * .42, .7, .32, .12, .1, .08); b.put(CONE, s * .48, .78, .34, c, [.05, .12, .05], [0, 0, -s * .4]);   // big round claws
    limb(b, c, [[s * .1, .44, .1], [s * .12, .62, .12]], .025, .02, 2);
    eye(b, s * .12, .68, .14, .06, { iris: INK });
  }
  drawOn(b, INK, front([0, .3, 0], [.36, .2, .26]), [[-.1, .3], [0, .27], [.1, .3]], .012, .005);
}
function octopus(b) {
  const c = '#c58cff', c2 = '#e8d0ff', hc = [0, .78, 0], hr = [.32, .34, .3], f = front(hc, hr);
  ball(b, c, ...hc, ...hr, true);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a), z = Math.sin(a); limb(b, c, [[x * .2, .5, z * .2], [x * .36, .28, z * .36], [x * .46, .08, z * .46], [x * .58, .1, z * .58]], .07, .035, 6); }
  for (const [x, y] of [[-.18, .98], [.2, .95], [0, 1.06]]) dot(b, c2, x, y, f(x, y) - .01, .045, .045, .02);
  face2(b, f, .82, .11, .02, .065);
  drawOn(b, INK, f, [[-.07, .66], [0, .63], [.07, .66]], .013, .005);
  b.put(CYL, 0, 1.08, 0, '#ffd23f', [.34, .02, .34]); ball(b, '#ffd23f', 0, 1.12, 0, .2, .1, .2); ball(b, '#ff6f9f', 0, 1.1, 0, .205, .03, .205);  // a sunhat
}
function snail(b) {
  const body = '#bfe86a', shell = '#ffb03a';
  ball(b, body, 0, .12, .05, .2, .12, .45, true);
  const hc = [0, .42, .38], hr = [.15, .17, .14], f = front(hc, hr); ball(b, body, ...hc, ...hr);
  for (const s of [-1, 1]) { limb(b, body, [[s * .06, .55, .36], [s * .1, .72, .38]], .025, .02, 2); dot(b, body, s * .1, .74, .38, .035); }
  face2(b, f, .45, .06, .01, .04); drawOn(b, INK, f, [[-.04, .36], [0, .34], [.04, .36]], .009, .004);
  ball(b, shell, 0, .45, -.08, .1, .34, .32, true);
  for (const [y, z, r] of [[.58, 0, .07], [.38, -.2, .06], [.62, -.24, .05], [.3, .08, .05]]) for (const s of [-1, 1]) dot(b, '#ff6f9f', s * .1, y, z, r * .4, r, r);
}

// ---------- a little wheel robot ----------
function wheelBot(b) {
  const shell = '#fff4e6', trim = '#ff8a3d';
  b.put(CYL, 0, .12, 0, INK, [.12, .1, .12], [0, 0, Math.PI / 2]); b.put(CYL, 0, .12, 0, trim, [.06, .105, .06], [0, 0, Math.PI / 2]);  // one wheel
  ball(b, shell, 0, .62, 0, .3, .44, .28, true);
  ball(b, trim, 0, .3, 0, .22, .06, .2);
  dot(b, INK, 0, .78, .2, .22, .15, .08);                                             // the screen face
  for (const s of [-1, 1]) b.put(BOX, s * .08, .8, .28, '#5cf2c4', [.06, .06, .02]);  // glowing square eyes
  b.put(BOX, 0, .72, .28, '#5cf2c4', [.08, .015, .02]);
  for (const s of [-1, 1]) { const pts = [[s * .28, .62, 0], [s * .38, .5, .06], [s * .42, .38, .1]]; limb(b, shell, pts, .045, .04, 6, .06); for (let k = 1; k < 4; k++) dot(b, '#d8cfc4', s * (.3 + k * .035), .62 - k * .06, k * .03, .05, .015, .05); }
  limb(b, shell, [[0, 1.05, 0], [0, 1.18, 0]], .015, .012, 2, .04); dot(b, trim, 0, 1.2, 0, .04);
}

// ---------- fluffy round bunnies ----------
function fluffBunny(b, o) {
  const c = o.fur, cc = [0, .4, 0], r = [.36, .38, .34], f = front(cc, r);
  ball(b, c, ...cc, ...r, true);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = .4 + Math.sin(i * 1.9) * .3, rr = Math.sqrt(Math.max(.05, 1 - ((y - .4) / .4) ** 2)); dot(b, c, Math.cos(a) * .34 * rr, y, Math.sin(a) * .32 * rr, .07, .07, .07); }
  for (const s of [-1, 1]) {
    const tip = o.floppy ? [[s * .14, .74, -.02], [s * .28, .82, 0], [s * .38, .7, .02]] : [[s * .1, .74, -.02], [s * .12, .98, -.04], [s * .14, 1.18, -.04]];
    limb(b, c, tip, .07, .05, 5, .06);
    boot(b, c, s * .14, 0, .1, .09);
  }
  face2(b, f, .48, .12, .02, .07, { iris: o.iris || '#4a3a5a' });
  drawOn(b, INK, f, [[-.06, .32], [0, .29], [.06, .32]], .012, .005);
  dot(b, '#ff8fb6', 0, .38, f(0, .38) + .01, .03, .025, .02);
  if (o.bow) for (const s of [-1, 1]) dot(b, o.bow, s * .07, .8, .12, .07, .05, .04, [0, 0, s * .4]);
}

const R = resident;
export const STORY_FRIENDS_2 = {
  // fuzzy neighbourhood monsters (Toy Town)
  monfuzzle: R('Fuzzle the Monster', 'Hi hi! I am Fuzzle! I am fuzzy and friendly!', b => monster(b, { fur: '#2fbfb0', horns: '#fff3c4', feet: '#1d8a80' }), 'bounce', 'Fuzzy jump! Boing!', ['#2fbfb0', '#fff3c4']),
  monbopsy: R('Bopsy the Monster', 'Hello! I am Bopsy! Will you play with me?', b => monster(b, { fur: '#e8384f', h: .8, nose: '#ff9a2a', eye: .09 }), 'twirl', 'Spin, spin, Bopsy spin!', ['#e8384f', '#ff9a2a']),
  monziggy: R('Ziggy the Monster', 'Hi! I am Ziggy! Look how tall I am!', b => monster(b, { fur: '#ff9a2a', h: 1.35, antennae: '#7cf26a', nose: '#c95a12' }), 'sing', 'Doo-wop! Sing along!', ['#ff9a2a', '#7cf26a']),
  monplum: R('Plum the Monster', 'Hello! I am Plum! I love flowers and hugs!', b => monster(b, { fur: '#b46ae8', belly: '#e3c4ff', bow: '#ff6fa5', flower: '#ff6fa5' }), 'hug', 'A big fuzzy hug!', ['#b46ae8', '#ff6fa5']),
  // the rescue pup team (Happy Farm)
  rescuesparky: dog('Sparky the Fire Pup', 'Woof! I am Sparky! I help put out fires!', { coat: '#e9a24a', belly: '#fbecd0', ear: '#e9a24a', earType: 'up', legH: .16, len: 1.15, hat: 'helmet', hatColor: '#e3344a', vest: '#e3344a', badge: '#ffd23f' }),
  rescuedigger: dog('Digger the Builder Pup', 'Woof woof! I am Digger! I build and fix things!', { coat: '#fbf5ea', belly: '#fbf5ea', ear: '#8a5a33', earType: 'flop', mask: '#8a5a33', hat: 'hard', hatColor: '#ff9a2a', vest: '#ff9a2a', badge: '#2a2333' }),
  rescuezoom: dog('Zoom the Pilot Pup', 'Hi! I am Zoom! I fly up high to help!', { coat: '#f4f4fa', belly: '#f4f4fa', ear: '#f4f4fa', earType: 'puff', hat: 'goggles', hatColor: '#3d7bd9', vest: '#3d7bd9', badge: '#ffffff' }),
  rescuemo: dog('Medic Mo the Pup', 'Hello! I am Mo! I help when someone is hurt!', { coat: '#6b4226', belly: '#9a6a43', ear: '#5a3418', earType: 'flop', hat: 'cap', hatColor: '#ffffff', badge: '#e3344a', vest: '#ffffff' }),
  rescuesplash: dog('Splash the Water Pup', 'Woof! I am Splash! I rescue friends in the water!', { coat: '#3f4a5a', belly: '#c9d2dc', ear: '#3f4a5a', earType: 'up', vest: '#ffd23f', badge: '#3d7bd9', hat: 'cap', hatColor: '#2ec4c4' }),
  // sea explorers (Sunny Seaside)
  explorerwalrus: R('Captain Wally', 'Ahoy! I am Captain Wally! Let’s explore the sea!', b => critter(b, { fur: '#b98a6a', top: '#2f5fa8', legs: '#2f5fa8', feet: '#1d2f55', snoutColor: '#e8cdb3', tusks: true, whiskers: true, ears: 'none', hat: 'sailor', hatColor: '#2f5fa8', head: [.28, .24, .24], h: 1.05 }), 'bounce', 'Anchors up! Hooray!', ['#2f5fa8', '#ffffff']),
  explorerotter: R('Pip the Otter', 'Hi! I am Pip! I can swim super fast!', b => critter(b, { fur: '#8a5a33', top: '#2ec4c4', legs: '#2ec4c4', feet: '#1d8a80', snoutColor: '#d9b48a', whiskers: true, hat: 'sailor', hatColor: '#2ec4c4', tail: 'long', h: .85 }), 'twirl', 'Swim and spin!', ['#8a5a33', '#2ec4c4']),
  explorerturtle: R('Shelly the Turtle', 'Hello! I am Shelly! I carry my home on my back!', b => critter(b, { fur: '#7cc96a', top: '#7cc96a', legs: '#7cc96a', ears: 'none', snoutColor: '#a6e091', shell: '#3f8a5a', shellSpots: '#7cc96a', hat: 'sailor', hatColor: '#ff9a2a', h: .9 }), 'hug', 'A slow, warm turtle hug!', ['#7cc96a', '#3f8a5a']),
  // seaside friends (Sunny Seaside)
  seastar: R('Twinkle the Starfish', 'Hi! I am Twinkle! I am a happy starfish!', starfish, 'twirl', 'Twinkle twirl!', ['#ff8fb6', '#ffd0e0'], 'slide', { v: .25 }),
  seacrab: R('Pinchy the Crab', 'Hello! I am Pinchy! I walk sideways! Click clack!', crab, 'bounce', 'Click clack, dance with me!', ['#ff7a3d', '#ffb38a'], 'slide', { v: .4 }),
  seaocto: R('Ollie the Octopus', 'Hi there! I am Ollie! I have eight arms to wave!', octopus, 'sing', 'Wave, wave, wave, with all eight arms!', ['#c58cff', '#ffd23f'], 'slide', { v: .3 }),
  seasnail: R('Shimmer the Snail', 'Hello! I am Shimmer! I go slow and steady!', snail, 'sparkle', 'Slow and sparkly!', ['#bfe86a', '#ffb03a'], 'slide', { v: .15 }),
  // the pig family (Happy Farm)
  pigpapa: R('Papa Pig', 'Hello! I am Papa Pig! Let’s jump in muddy puddles!', b => critter(b, { fur: '#ffb3c8', top: '#3fae7a', legs: '#ffb3c8', feet: '#7a4a3a', ears: 'pig', snout: 'pig', snoutColor: '#ff9ab5', glasses: INK, tail: 'curl' }), 'bounce', 'Splash! Muddy puddle jump!', ['#ffb3c8', '#3fae7a'], 'hop', { size: 1.25 }),
  pigmama: R('Mama Pig', 'Hello! I am Mama Pig! I love a family hug!', b => critter(b, { fur: '#ffb3c8', top: '#ff9a2a', legs: '#ffb3c8', feet: '#7a4a3a', ears: 'pig', snout: 'pig', snoutColor: '#ff9ab5', dress: '#ff9a2a', tail: 'curl' }), 'hug', 'A big family hug!', ['#ffb3c8', '#ff9a2a'], 'hop', { size: 1.15 }),
  pigpoppy: R('Poppy Pig', 'Hi! I am Poppy! Do you like jumping too?', b => critter(b, { fur: '#ffb3c8', top: '#e3344a', legs: '#ffb3c8', feet: '#7a4a3a', ears: 'pig', snout: 'pig', snoutColor: '#ff9ab5', dress: '#e3344a', tail: 'curl', hat: 'bow', hatColor: '#ffd23f' }), 'bounce', 'Jump, jump, jump!', ['#ffb3c8', '#e3344a'], 'hop', { size: .9 }),
  pigpip: R('Baby Pip Pig', 'Oink oink! I am baby Pip! Dino!', b => critter(b, { fur: '#ffb3c8', top: '#3d7bd9', legs: '#ffb3c8', feet: '#7a4a3a', ears: 'pig', snout: 'pig', snoutColor: '#ff9ab5', tail: 'curl' }), 'twirl', 'Oink! Oink! Spin!', ['#ffb3c8', '#3d7bd9'], 'hop', { size: .72 }),
  // the toy doctor and her plush patients (Toy Town)
  toydoctor: R('Doctor Daisy', 'Hello! I am Doctor Daisy! I make toys feel better!', b => person(b, { skin: '#9a6a4a', hair: '#3b2418', top: '#b49cff', bottom: '#ff9fc8', jacket: '#ffffff', style: 'buns', belt: '#ffffff', shoes: '#ff9fc8', iris: '#2a1a10', lips: '#c0506a' }), 'sparkle', 'All better! Sparkle, sparkle!', ['#ffffff', '#b49cff']),
  plushelephant: R('Ellie the Plush Elephant', 'Hello! I am Ellie! I help Doctor Daisy!', b => critter(b, { fur: '#b8a6e8', top: '#ffffff', stripes: '#e3344a', legs: '#b8a6e8', ears: 'big', earColor: '#cbbdf2', snout: 'trunk', cap: '#ffffff', glasses: '#e3344a', h: .95 }), 'hug', 'A soft elephant hug!', ['#b8a6e8', '#e3344a']),
  plushdino: R('Rexy the Plush Dino', 'Rawr! I am Rexy! A very friendly dinosaur!', b => critter(b, { fur: '#6ad38a', top: '#6ad38a', legs: '#6ad38a', belly: '#d8f5c4', ears: 'none', snout: 'long', snoutColor: '#6ad38a', tail: 'dino', spikes: '#ffd23f' }), 'bounce', 'Rawr! Stomp, stomp!', ['#6ad38a', '#ffd23f']),
  plushgiraffe: R('Tilly the Plush Giraffe', 'Hello! I am Tilly! I can see everything from up here!', b => critter(b, { fur: '#ffd36a', top: '#ffd36a', legs: '#ffd36a', ears: 'horns', snout: 'long', snoutColor: '#ffe7a6', neck: .3, spots: '#d98a3a', h: .9 }), 'twirl', 'Tall twirl!', ['#ffd36a', '#d98a3a']),
  // the little wheel robot (Lab Gardens)
  wheelbot: R('Beepo the Robot', 'Beep boop! I am Beepo! I roll on one wheel!', wheelBot, 'twirl', 'Beep beep! Spin!', ['#fff4e6', '#5cf2c4'], 'slide', { v: .7 }),
  // fluffy rainbow bunnies (Balloon Hills)
  fluffviolet: R('Violet Fluff Bunny', 'Hi! I am Violet! I am soft and fluffy!', b => fluffBunny(b, { fur: '#9d6af0', bow: '#ff6fa5' }), 'bounce', 'Fluffy hop!', ['#9d6af0', '#ff6fa5'], 'bounce'),
  fluffrose: R('Rose Fluff Bunny', 'Hello! I am Rose! Let’s hop together!', b => fluffBunny(b, { fur: '#e85ad0' }), 'twirl', 'Hop and spin!', ['#e85ad0', '#ffffff'], 'bounce'),
  fluffsunny: R('Sunny Fluff Bunny', 'Hi! I am Sunny! I am as bright as the sun!', b => fluffBunny(b, { fur: '#ff9a2a' }), 'sparkle', 'Sunny sparkles!', ['#ff9a2a', '#ffd23f'], 'bounce'),
  fluffmint: R('Mint Fluff Bunny', 'Hello! I am Mint! I am the littlest bunny!', b => fluffBunny(b, { fur: '#6ad36a' }), 'bounce', 'Little hop!', ['#6ad36a', '#ffffff'], 'bounce', { size: .8 }),
  fluffsky: R('Sky Fluff Bunny', 'Hi! I am Sky! My ears flop down!', b => fluffBunny(b, { fur: '#6ac8f0', floppy: true }), 'hug', 'A fluffy hug!', ['#6ac8f0', '#ffffff'], 'bounce'),
};

export const STORY_FRIEND_HOMES_2 = [
  { kind: 'monfuzzle', district: 'toytown', x: 618.5, z: -4.2 }, { kind: 'monbopsy', district: 'toytown', x: 620.5, z: -4.4 },
  { kind: 'monziggy', district: 'toytown', x: 622.5, z: -4.2 }, { kind: 'monplum', district: 'toytown', x: 625, z: -4.4 },
  { kind: 'rescuesparky', district: 'farm', x: -475.5, z: -3.9 }, { kind: 'rescuedigger', district: 'farm', x: -481, z: -4.2 },
  { kind: 'rescuezoom', district: 'farm', x: -494.5, z: -3.9 }, { kind: 'rescuemo', district: 'farm', x: -496.5, z: -4.2 },
  { kind: 'rescuesplash', district: 'farm', x: -498.5, z: -3.9 },
  { kind: 'explorerwalrus', district: 'seaside', x: -52.5, z: -4.2 }, { kind: 'explorerotter', district: 'seaside', x: -54.5, z: -4.0 },
  { kind: 'explorerturtle', district: 'seaside', x: -56.5, z: -4.2 },
  { kind: 'seastar', district: 'seaside', x: -85.5, z: -3.9 }, { kind: 'seacrab', district: 'seaside', x: -91.5, z: -4.0 },
  { kind: 'seaocto', district: 'seaside', x: -88.5, z: -4.2 }, { kind: 'seasnail', district: 'seaside', x: -60, z: -3.8 },
  { kind: 'pigpapa', district: 'farm', x: -516.5, z: -4.2 }, { kind: 'pigmama', district: 'farm', x: -518.5, z: -4.3 },
  { kind: 'pigpoppy', district: 'farm', x: -520.5, z: -3.9 }, { kind: 'pigpip', district: 'farm', x: -526.5, z: -4.0 },
  { kind: 'toydoctor', district: 'toytown', x: 640, z: -4.2 }, { kind: 'plushelephant', district: 'toytown', x: 642, z: -4.5 },
  { kind: 'plushdino', district: 'toytown', x: 648.5, z: -4.2 }, { kind: 'plushgiraffe', district: 'toytown', x: 650.5, z: -4.4 },
  { kind: 'wheelbot', district: 'labgarden', x: 731, z: -3.9 },
  { kind: 'fluffviolet', district: 'hills', x: -760, z: -3.9 }, { kind: 'fluffrose', district: 'hills', x: -765.5, z: -4.2 },
  { kind: 'fluffsunny', district: 'hills', x: -767.5, z: -3.9 }, { kind: 'fluffmint', district: 'hills', x: -769.5, z: -4.1 },
  { kind: 'fluffsky', district: 'hills', x: -771.5, z: -3.9 },
];
