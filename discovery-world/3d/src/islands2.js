// ===================================================================
// islands2.js (build 156, the family's request: "create more islands"): three more islands of the open ocean, each reached
// by boat (ocean.js), each a normal place of the planets engine (its landing ground here, its areas in PLANET_EXTRA):
//   🌋 VOLCANO ISLAND: black sand, a big smoking volcano behind; a warm bubbling hot spring; a lava-rock climb up to a
//      lookout (tap the telescope: the volcano puffs rainbow smoke) and the rock slide back down; the geyser that shoots
//      her up high to a star.
//   🐢 TURTLE BEACH: turtle nests (tap one: baby turtles hatch and waddle to the sea, one, two, three); a ride on the big
//      sea turtle's back along the shore, past starfish stars; a sandcastle she builds tower by tower.
//   💎 TREASURE COVE: an old wrecked boat and a treasure map (tap it: three red crosses appear); dig at each cross (tap
//      three times) and a chest pops up; the third is the big treasure; tide-pool stepping stones and a lookout rock.
// Everything is batched in the shared paint (a few meshes per area); no new shaders.
// ===================================================================
import * as THREE from 'three';
import * as K from './spacekit.js';
import { pathRide, star } from './upside.js';
import { buildVolcanoCoaster } from './volcano-coaster.js';
import { LAGOON, VOLCANO } from './volcano-course.js';

const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 14), SPH = new THREE.SphereGeometry(1, 14, 10), CONE = new THREE.ConeGeometry(1, 1, 14), LEAF = new THREE.SphereGeometry(1, 8, 6);
for (const g of [BOX, CYL, SPH, CONE, LEAF]) g.userData.shared = true;
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
const palm = (b, x, z, h = 5) => { b.put(CYL, x, h / 2, z, '#a07a4a', [.22, h, .22], [0, 0, .1]); for (let i = 0; i < 6; i++) b.put(LEAF, x + .3 + Math.cos(i) * 1.2, h + .1, z + Math.sin(i), '#4fcf6a', [1.4, .2, .45], [0, i, -.35]); };
const kitOf = c => ({ add: c.add, Sound: c.Sound, api: c.api, tapIt: c.tapIt, U: c.U, P: c.P, G: c.G, say: c.say, disc: id => c.api.discover && c.api.discover(id) });

// a sandy start by the sea, then the island's own ground; sea along the back
function* ground(c, sand, land, hills = 6, dig = null) {
  const { matte, X, PW, MID, props } = c;
  const H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 180, nz: 60,
    height: (x, z) => (K.fbm2(x * .05, z * .05, 3) - .5) * .5 + K.sstep(-12, -40, z) * K.fbm2(x * .03 + 3, z * .03, 3) * hills - (dig ? dig(x, z) : 0),
    color: (x, z, h, ny, o) => { const s = K.sstep(X + 16, X + 4, x); K.ramp(land, .3 + K.fbm2(x * .2, z * .2, 3) * .5, o); if (s > 0) o.lerp(K.col(sand), s); o.multiplyScalar(.85 + .2 * ny); } });
  props.put(BOX, X - 30, -.05, -6, '#2f8fd8', [60, .1, 40]); // the sea behind her boat
  return H;
}

// =================== 🌋 VOLCANO ISLAND ===================
export function* volcanoLanding(c) {
  const { props, X, MID, add, U, P, say, Sound, api } = c, k = kitOf(c);
  // (build 164) the island's ground has the LAGOON dug into it (the coaster dives into it); THE VOLCANO itself is the coaster's
  //  hollow volcano (volcano-coaster.js), built with the island
  const dig = (x, z) => { const d = Math.hypot(x - (X + LAGOON.cx), z - LAGOON.cz) / (LAGOON.r + 4); return d < 1 ? (LAGOON.depth + 2) * (1 - d * d) : 0; };
  const H = yield* ground(c, '#3a3540', ['#4a4450', '#5a6a4a', '#6a7a4a'], 4, dig); yield;
  c.G.volcanoX = X + VOLCANO.cx; const glow = { scale: { setScalar() { } } };
  for (const x of [X + 3, X + 12]) palm(props, x, -5);
  for (let i = 0; i < 30; i++) props.put(SPH, X + 18 + i * 10 + (i % 3) * 2, .3, -4 - (i % 4) * 2, ['#2a2630', '#3a3540', '#4a4450'][i % 3], [.9, .5, .7]); // lava rocks
  // THE HOT SPRING (x +28 to +36): warm water, steam; walk in or tap it
  props.put(CYL, X + 32, -.02, -1.6, '#7fd0e8', [3.6, .1, 2.2]); for (let i = 0; i < 10; i++) props.put(SPH, X + 32 + Math.cos(i * .63) * 3.7, .15, -1.6 + Math.sin(i * .63) * 2.3, '#4a4450', .35);
  let told = false; const soak = () => { Sound.whoosh && Sound.whoosh(); api.burst(X + 32, .6, -1.6, ['#ffffff', '#bfe8ff'], 14, 1.6); say('♨️ A warm hot spring! The volcano warms the water. Ahhh!'); k.disc('hotspring'); };
  c.G.interact.push({ x: X + 32, y: 0, layer: 'space', icon: '♨️', action: 'Warm hot spring', hintY: 2, run: soak });
  U.push((dt, t) => { if (Math.random() < dt * 4) api.burst(X + 31 + Math.random() * 2, .4, -1.6, ['#ffffff', '#e8f4ff'], 1, .8); glow.scale.setScalar(1 + Math.sin(t * 2) * .05);
    if (Math.random() < dt * 1.5) api.burst(X + VOLCANO.cx + (Math.random() - .5) * 8, VOLCANO.h + 2, VOLCANO.cz, ['#bfbfc8', '#e8e8f0', '#9a9aa8'], 2, 3);
    const inSpring = P.layer === 'space' && Math.abs(P.x - (X + 32)) < 3 && P.y < .5; if (inSpring && !told) { told = true; soak(); } if (!inSpring) told = false; });
  // three lava-rock stepping stones with stars (x +50 to +66)
  const sb = K.makeBatch(); for (const [j, x] of [X + 50, X + 56, X + 62].entries()) { sb.put(CYL, x, (.6 + j * .7) / 2, -1, '#3a3540', [1.3, .6 + j * .7, 1.1]); c.G.platforms.push({ a: x - 1.3, b: x + 1.3, y: .6 + j * .7, layer: 'space', z: -1, step: true, stepMax: .8 }); star(k, sb, x, 1.9 + j * .7, 'lavastar' + j); }
  add(sb.mesh(K.shinyMat()));
  return H;
}
function lookout(k) { // area 2: THE LAVA-ROCK CLIMB, THE LOOKOUT and THE ROCK SLIDE
  const s = k.s0, b = K.makeBatch(), P = k.P;
  for (let j = 0; j < 10; j++) { const x = s + 10 + j * 1.6, y = .7 * (j + 1); b.put(BOX, x, y / 2, -1.2, j % 2 ? '#4a4450' : '#3a3540', [1.6, y, 2]); k.plat(x - .8, x + .8, y, { z: -1.2, step: true, stepMax: .8 }); }
  const TOP = 7, tx = s + 27; b.put(BOX, tx + 2, TOP / 2, -1.2, '#3a3540', [5, TOP, 2.4]); k.plat(s + 25.2, tx + 4.5, TOP, { z: -1.2, step: true, stepMax: .8 });
  b.put(CYL, tx + 1, TOP + .6, -1.6, '#8a5a3a', [.06, 1.2, .06]); b.put(CYL, tx + 1, TOP + 1.25, -1.6, '#ffd23f', [.14, .7, .14], [0, 0, 1.2]); // the telescope
  // THE ROCK SLIDE: a smooth grey chute from the lookout back down to the ground
  const sp = [[tx + 4.5, TOP], [tx + 9, TOP - 2.4], [tx + 15, 2.2], [tx + 21, .1]];
  for (let i = 0; i < 24; i++) { const u = i / 23, a = Math.floor(u * 3), f = u * 3 - a, p0 = sp[Math.min(3, a)], p1 = sp[Math.min(3, a + 1)]; b.put(BOX, p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f - .25, -1.3, '#8a8f98', [1.2, .2, 1.6]); }
  let rumble = 0; const look = () => { rumble = 4; k.Sound.tone(60, 1.4, 'sawtooth', .04, .8); k.say('🔭 Look! The volcano is puffing rainbow smoke! Rumble rumble!', true); k.disc && k.disc('volcanolook'); };
  k.G.interact.push({ x: tx + 1, y: TOP, layer: 'space', icon: '🔭', action: 'Look at the volcano', hintY: 2.4, run: look }); { const hit = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ visible: false })); hit.scale.set(1, 1.6, 1); hit.position.set(tx + 1, TOP + 1, -1.6); k.add(hit); k.tapIt(hit, look); }
  let sliding = false; const slide = () => { if (sliding || P.ride) return; sliding = true; k.Sound.whoosh && k.Sound.whoosh(); k.say('🌋 The rock slide! Wheee!', true); pathRide(k, sp, { z: -1.3, speed: 8, done: () => { sliding = false; k.disc && k.disc('rockslide'); } }); };
  k.G.interact.push({ x: tx + 4, y: TOP, layer: 'space', icon: '🛝', action: 'Rock slide!', hintY: 2.4, run: slide });
  k.U.push((dt, t) => { if (!sliding && P.grounded && !P.ride && Math.abs(P.y - TOP) < .15 && P.x > tx + 3.6 && P.vx > .5) slide();
    if (rumble > 0) { rumble -= dt; if (Math.random() < dt * 20) k.api.burst((k.G.volcanoX || s) + (Math.random() - .5) * 10, VOLCANO.h + 3, VOLCANO.cz, ['#ff4f6a', '#ffd23f', '#4fb0ff', '#3fc65a', '#b07cff'], 3, 4); } });
  star(k, b, s + 18, 6.4, 'climbstar'); star(k, b, tx + 12, 4.6, 'slidestar');
  k.add(b.mesh(K.shinyMat()));
}
function geyser(k) { // area 3: THE GEYSER: tap it (or step on it) and it shoots her up high to a star
  const s = k.s0, b = K.makeBatch(), P = k.P, gx = s + 30;
  b.put(CYL, gx, .1, -1, '#4a4450', [1.4, .2, 1.4]); b.put(CYL, gx, .12, -1, '#7fd0e8', [.9, .2, .9]);
  for (let i = 0; i < 8; i++) b.put(SPH, gx + Math.cos(i * .8) * 1.6, .2, -1 + Math.sin(i * .8) * 1, '#3a3540', .35);
  let cool = 0; const blow = () => { if (cool > 0 || P.ride) return; cool = 2.5; k.Sound.whoosh && k.Sound.whoosh(); k.say('💦 WHOOSH! The geyser shoots you up high!', true); k.disc && k.disc('geyser');
    P.x = gx; P.y = Math.max(P.y, .3); pathRide(k, [[gx, .4], [gx, 7], [gx, 13], [gx + 1.2, 13.4]], { z: -1, speed: 9, done: () => { P.floaty = true; P.vy = 0; P.grounded = false; } }); }; // (up on the water jet, past the star; then she floats down gently)
  k.G.interact.push({ x: gx, y: 0, layer: 'space', icon: '💦', action: 'Geyser!', hintY: 2.4, run: blow });
  k.U.push((dt, t) => { cool = Math.max(0, cool - dt); if (Math.random() < (cool > 0 ? dt * 40 : dt * 3)) k.api.burst(gx + (Math.random() - .5) * .6, cool > 0 ? 2 + Math.random() * 10 : .4, -1, ['#ffffff', '#bfe8ff'], 2, cool > 0 ? 2 : .8);
    if (!cool && P.layer === 'space' && P.grounded && !P.ride && Math.abs(P.x - gx) < .7) blow(); });
  star(k, b, gx, 12, 'geyserstar'); for (const x of [s + 60, s + 75]) palm(b, x, -4);
  k.add(b.mesh(K.shinyMat())); k.rocketSign(s + 100);
}
export const volcanoworld = { all(k) { buildVolcanoCoaster(k); }, sections: [k => lookout(k), k => geyser(k)] }; // (build 164) THE VOLCANO ROLLER COASTER, built with the island

// =================== 🐢 TURTLE BEACH ===================
export function* turtleLanding(c) {
  const { props, X, add, U, say, Sound, api } = c, k = kitOf(c);
  const H = yield* ground(c, '#f0d8a0', ['#f0d8a0', '#e8cc90', '#d8e8a0'], 3); yield;
  for (const [x, z] of [[X + 2, -5], [X + 14, -6], [X + 40, -6.5], [X + 70, -6]]) palm(props, x, z, 5 + (x % 3));
  // THE TURTLE NESTS (x +28, +44, +60): tap one and three baby turtles hatch and waddle down to the sea
  const babyM = new THREE.MeshStandardMaterial({ color: '#3f8f4a', roughness: .6 }), nests = [X + 28, X + 44, X + 60].map((x, i) => {
    props.put(SPH, x, 0, -2.2, '#e8cc90', [.9, .3, .7]); for (let j = 0; j < 3; j++) props.put(SPH, x - .3 + j * .3, .22, -2.2, '#ffffff', .14);
    const babies = [0, 1, 2].map(j => { const m = new THREE.Mesh(SPH, babyM); m.scale.set(.22, .1, .26); m.visible = false; m.userData.dynamic = true; add(m); return m; });
    return { x, i, babies, t: -1 }; });
  let hatched = 0; const hatch = q => { if (q.t >= 0) return; q.t = 0; Sound.twinkle ? Sound.twinkle() : Sound.chime(); say('🐢 Crack crack! Baby turtles! One, two, three! Off they go to the sea!'); k.disc('turtlenest'); if (++hatched === 3) { k.disc('turtlehatch'); setTimeout(() => say('🐢 All the baby turtles are safe in the sea! Hooray!'), 2500); } };
  for (const q of nests) c.G.interact.push({ x: q.x, y: 0, layer: 'space', icon: '🥚', action: 'Turtle nest', hintY: 1.6, need: () => q.t < 0, run: () => hatch(q) });
  U.push(dt => { for (const q of nests) { if (q.t < 0) continue; q.t += dt; for (const [j, m] of q.babies.entries()) { const u = Math.max(0, Math.min(1, (q.t - j * .4) / 4)); m.visible = u > 0 && u < 1; m.position.set(q.x - .3 + j * .3 + Math.sin(q.t * 8 + j) * .08, .08, -2.2 - u * 9); m.rotation.y = Math.PI; } } });
  return H;
}
function turtleRide(k) { // area 2: THE BIG SEA TURTLE: she rides on its back along the shore, past starfish stars
  const s = k.s0, b = K.makeBatch(), P = k.P, tx = s + 10;
  b.put(BOX, s + 45, -.03, -3.5, '#4fb0e8', [80, .06, 3]); // the shallow water along the shore
  const turtle = new THREE.Group(); turtle.position.set(tx, 0, -2.6); turtle.userData.dynamic = true; k.add(turtle);
  { const tb = K.makeBatch(); tb.put(SPH, 0, .55, 0, '#3f8f4a', [1.6, .55, 1.1]); for (let i = 0; i < 6; i++) tb.put(SPH, Math.cos(i) * .7, .85, Math.sin(i) * .5, '#5fbf5a', [.4, .12, .32]); tb.put(SPH, 1.7, .55, 0, '#7fbf6a', [.42, .36, .36]); tb.put(SPH, 1.95, .65, .2, '#2a2a38', .06); tb.put(SPH, 1.95, .65, -.2, '#2a2a38', .06);
    for (const [x, z] of [[.9, .9], [.9, -.9], [-.9, .9], [-.9, -.9]]) tb.put(SPH, x, .3, z, '#7fbf6a', [.45, .12, .25]); turtle.add(tb.mesh(K.shinyMat())); }
  const path = [[tx, 1.2], [tx + 15, 1.5], [tx + 30, 1.1], [tx + 45, 1.6], [tx + 60, 1.2], [tx + 72, 1.2]];
  let riding = false; const ride = () => { if (riding || P.ride) return; riding = true; k.Sound.whoosh && k.Sound.whoosh(); k.say('🐢 Hop on the big sea turtle! Off we swim along the shore! Catch the starfish!', true);
    pathRide(k, path, { z: -2.4, speed: 4.5, done: () => { riding = false; P.y = 0; k.say('🐢 Thank you, big turtle! What a ride!', true); k.disc && k.disc('turtleride'); } }); };
  k.G.interact.push({ x: tx, y: 0, layer: 'space', icon: '🐢', action: 'Ride the turtle!', hintY: 2.4, run: ride }); k.tapIt(turtle, ride);
  k.U.push((dt, t) => { if (riding) { turtle.position.set(P.x, -.55 + Math.sin(t * 3) * .05, -2.6); turtle.rotation.z = Math.sin(t * 2) * .05; } else { turtle.position.set(tx, Math.sin(t * 1.5) * .03, -2.6); turtle.rotation.z = 0; } });
  for (const [i, x] of [tx + 15, tx + 32, tx + 50].entries()) star(k, b, x, 2.5, 'starfish' + i);
  k.add(b.mesh(K.shinyMat()));
}
function sandcastle(k) { // area 3: THE SANDCASTLE: tap it and it grows, tower by tower
  const s = k.s0, b = K.makeBatch(), cx = s + 30, parts = [];
  const add = (geo, x, y, z, col, sc) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: .9 })); m.position.set(x, y, z); m.scale.set(...sc); m.visible = false; k.add(m); parts.push(m); };
  add(BOX, cx, .4, -2.6, '#e8cc90', [3, .8, 1.6]); for (const dx of [-1.4, 1.4]) { add(CYL, cx + dx, 1.1, -2.6, '#e8cc90', [.45, 1.4, .45]); } add(CYL, cx, 1.5, -2.6, '#e8cc90', [.6, 1.4, .6]); add(CONE, cx, 2.6, -2.6, '#ff4f6a', [.4, .7, .4]);
  let n = 0; const build = () => { if (n >= parts.length) { k.say('🏰 Your sandcastle is finished! A flag on top!', true); return; } parts[n++].visible = true; k.Sound.tone ? k.Sound.tone(392 + n * 60, .15, 'triangle', .05, 1.2) : k.Sound.click(); k.api.burst(cx, 1, -2.6, ['#f0d8a0', '#ffffff'], 8, 1.4);
    k.say(n < parts.length ? `🏰 Pat pat! The sandcastle grows! ${NUM[n]}!` : '🏰 Your sandcastle is finished! A flag on top!', true); if (n === parts.length) k.disc && k.disc('sandcastle'); };
  k.G.interact.push({ x: cx, y: 0, layer: 'space', icon: '🏰', action: 'Build the sandcastle', hintY: 3, run: build });
  const pile = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: '#e8cc90', roughness: .9 })); pile.scale.set(1.2, .4, .8); pile.position.set(cx - 3, 0, -2.4); k.add(pile); k.tapIt(pile, build);
  b.put(CYL, cx - 3.4, .3, -2.2, '#ff4f6a', [.3, .5, .3]); b.put(CYL, cx - 3.4, .62, -2.2, '#ffd23f', [.04, .3, .04]); // a little bucket and spade
  for (const [i, x] of [s + 50, s + 64, s + 80].entries()) star(k, b, x, 1.4, 'shellstar' + i);
  k.add(b.mesh(K.shinyMat())); k.rocketSign(s + 100);
}
export const turtleworld = { sections: [k => turtleRide(k), k => sandcastle(k)] };

// =================== 💎 TREASURE COVE ===================
export function* coveLanding(c) {
  const { props, X, U, say, Sound, add } = c, k = kitOf(c);
  const H = yield* ground(c, '#e8d4a0', ['#8a8070', '#9a9080', '#7a8a6a'], 8); yield;
  for (let i = 0; i < 26; i++) props.put(SPH, X + 16 + i * 12 + (i % 3) * 3, .6, -6 - (i % 3) * 3, ['#7a7068', '#8a8078', '#6a6058'][i % 3], [2.2, 1.6, 1.8]); // the cove's big rocks
  // the old wrecked boat on the sand, tipped over, and the TREASURE MAP on a post
  props.put(SPH, X + 24, .5, -4.2, '#8a5a3a', [3.4, 1.1, 1.3]); props.put(BOX, X + 24, 1.4, -4.2, '#a8743a', [5.6, .14, 1.9], [0, 0, .12]); props.put(CYL, X + 24.6, 2.8, -4.2, '#6a4a2a', [.1, 3, .1], [0, 0, .5]);
  props.put(CYL, X + 30, .7, -2, '#8a5a3a', [.08, 1.4, .08]);
  const map = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: '#f3e0b0', roughness: .8 })); map.scale.set(1, .7, .05); map.position.set(X + 30, 1.6, -1.95); add(map);
  const xm = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: '#d8202a' })); xm.scale.set(.25, .05, .02); xm.position.set(X + 30.2, 1.6, -1.9); xm.rotation.z = .8; add(xm); const xm2 = xm.clone(); xm2.rotation.z = -.8; add(xm2);
  const read = () => { Sound.chime(); say('🗺️ A treasure map! Three red crosses mark the treasure. Walk along the cove and dig at each cross!'); k.disc('treasuremap'); c.G.coveMap = true; };
  c.G.interact.push({ x: X + 30, y: 0, layer: 'space', icon: '🗺️', action: 'Treasure map', hintY: 2.6, run: read }); c.tapIt(map, read);
  U.push((dt, t) => { map.rotation.y = Math.sin(t * 1.5) * .05; });
  return H;
}
function digs(k) { // area 2: DIG AT THE THREE CROSSES: tap a cross three times and a chest pops up; the third is the big treasure
  const s = k.s0, P = k.P, chestM = new THREE.MeshStandardMaterial({ color: '#b8742e', roughness: .6 }), goldM = new THREE.MeshBasicMaterial({ color: '#ffd23f' }), crossM = new THREE.MeshBasicMaterial({ color: '#d8202a' });
  let found = 0; const spots = [s + 20, s + 45, s + 70].map((x, i) => {
    const mound = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: '#e8d4a0', roughness: .95 })); mound.scale.set(.8, .3, .6); mound.position.set(x, 0, -2.2); k.add(mound);
    const c1 = new THREE.Mesh(BOX, crossM); c1.scale.set(1, .04, .18); c1.position.set(x, .31, -2.2); c1.rotation.y = .8; k.add(c1); const c2 = c1.clone(); c2.rotation.y = -.8; k.add(c2);
    const chest = new THREE.Group(); chest.position.set(x, -1, -2.2); k.add(chest); const cb = new THREE.Mesh(BOX, chestM); cb.scale.set(1, .6, .7); cb.position.y = .3; chest.add(cb); const lid = new THREE.Mesh(BOX, goldM); lid.scale.set(1.04, .12, .74); lid.position.y = .66; chest.add(lid); chest.visible = false;
    const q = { x, i, n: 0, open: false, chest, mound, c1, c2 }; return q; });
  const dig = q => { if (q.open) { k.say('💰 Shiny treasure!', true); return; } q.n++; k.Sound.click(); k.api.burst(q.x, .4, -2.2, ['#e8d4a0', '#c8b080'], 8, 1.6); q.mound.scale.y = .3 - q.n * .08;
    if (q.n < 3) { k.say(`⛏️ Dig, dig! ${NUM[q.n]}...`, true); return; } q.open = true; q.chest.visible = true; q.c1.visible = q.c2.visible = false; found++; k.Sound.chime(); k.api.burst(q.x, 1, -2.2, ['#ffd23f', '#ffffff', '#ff4f8a', '#9fe6ff'], 24, 2.6);
    k.say(found < 3 ? `💰 A treasure chest! Gold coins! That is ${NUM[found]}. Find the next red cross!` : '💎 The BIG treasure! Gems and gold! You found all the treasure in the cove!', true); k.disc && k.disc(found < 3 ? 'covechest' : 'covetreasure'); };
  for (const q of spots) { k.G.interact.push({ x: q.x, y: 0, layer: 'space', icon: '⛏️', action: 'Dig here!', hintY: 1.8, run: () => dig(q) }); k.tapIt(q.mound, () => dig(q)); }
  k.U.push(dt => { for (const q of spots) if (q.open && q.chest.position.y < 0) q.chest.position.y = Math.min(0, q.chest.position.y + dt * 2); });
  void P;
}
function tidepools(k) { // area 3: tide-pool stepping stones and a lookout rock with a star on top
  const s = k.s0, b = K.makeBatch();
  b.put(BOX, s + 30, -.03, -1.6, '#5fc0f0', [20, .06, 4]);
  for (const [j, x] of [s + 22, s + 26, s + 30, s + 34, s + 38].entries()) { const y = .4 + (j % 2) * .2; b.put(CYL, x, y / 2, -1.2, '#8a8078', [1.1, y, 1]); k.plat(x - 1.1, x + 1.1, y, { z: -1.2, step: true, stepMax: .8 }); }
  for (let j = 0; j < 6; j++) { const x = s + 50 + j * 1.6, y = .7 * (j + 1); b.put(SPH, x, y - .5, -1.4, '#7a7068', [1.1, .6, 1.1]); k.plat(x - .8, x + .8, y, { z: -1.4, step: true, stepMax: .8 }); }
  star(k, b, s + 30, 1.8, 'tidestar'); star(k, b, s + 58, 5.8, 'lookoutstar');
  k.add(b.mesh(K.shinyMat())); k.rocketSign(s + 100);
}
export const coveworld = { sections: [k => digs(k), k => tidepools(k)] };
