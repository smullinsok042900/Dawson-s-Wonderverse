// ===================================================================
// space.js (build 45): THE SPACE ROCKET. From the launch pad in the Lab Gardens, Dawson flies to the Moon, Mercury,
// Venus, Mars, Jupiter, Saturn, Uranus, Neptune or Pluto, and back home to Earth.
//
// GRAVITY IS REAL (relative to Earth): each place uses its real surface gravity, so a jump goes as many times higher
// (and lasts as many times longer) as it really would: about 6x on the Moon, 16x on Pluto, and only 0.4x on Jupiter.
// The game's Earth gravity is tuned for play (24 units/s² with a 9.4 m/s jump), so each place multiplies it by
// (its gravity / Earth's 9.81 m/s²). Values: NASA planetary fact sheets (surface; for the gas giants, the cloud tops
// at 1 bar, where scientists measure their gravity).
//
// Jupiter, Saturn, Uranus and Neptune are really made of gas. At the family's request (build 47) you land on each one's
// own walkable swirly clouds, in its own colours; the voice still says, kindly, that the planet is really made of gas.
// Their gravity is the real value at the cloud tops (1 bar). Every place has its own sky, its own activities that fit the
// planet, and its own kind of alien. Everything is pictures and spoken words. Each place is built the first time you
// visit and hidden when you leave, so it costs nothing anywhere else; materials are the world's shared toy materials.
// ===================================================================
import * as THREE from 'three';
import { toy } from './creatures.js';
import * as K from './spacekit.js';
import { runInSlices } from './stream-work.js';
import { PLANET_EXTRA, placeWidth, SECTION } from './planets.js';
import { BIG_CRATER } from './coaster-course.js';
import { DIMENSIONS, DIM } from './dimensions.js';
import { upsideLanding } from './upside.js';
import { toyLanding } from './toy.js';
import { bubbleLanding } from './bubble.js';

export const SPACE = { ox: 5000, gap: 400, w: 110 };
let venusCloudMat = null, venusCloudFar = null; // (stage 23/24) Venus's shared cloud material, and a coarser ball for its far sheets
let marsHazeMat = null, marsHazeGeo = null;       // (stage 24) Mars's shared dust-haze material and ball // (build 50: places are up to 330 m long now (planets.js): 400 m apart)
// [id, picture colours for the menu, gravity m/s², gas giant?, what the voice says when you arrive]
export const PLACES = [
  ['moon', ['#e8e8ec', '#9a9aa6'], 1.62, false, "The Moon! There's not much gravity here, so you can jump about six times higher. Look, there's Earth!"],
  ['mercury', ['#c9b8a6', '#7a6a5c'], 3.70, false, "Mercury, the planet closest to the Sun! It's small and rocky. Jump! You go about two and a half times higher."],
  ['venus', ['#ffe0a0', '#d9a24a'], 8.87, false, "Venus! It's covered in thick yellow clouds and it's very, very hot. Its gravity is almost like Earth's."],
  ['mars', ['#ff8a5c', '#b2462a'], 3.71, false, "Mars, the red planet! Its dust is red like rust. Jump! You go about two and a half times higher."],
  ['jupiter', ['#f0d2a8', '#c0763a'], 24.79, true, "Jupiter, the biggest planet! Jupiter is really made of gas, but in our game you can walk on its swirly clouds. The gravity is so strong you can only do tiny hops!"],
  ['saturn', ['#f5e2a8', '#cfa860'], 10.44, true, "Saturn, the planet with the beautiful rings! Saturn is really made of gas, but in our game you can walk on its golden clouds. Its gravity is about like Earth's."],
  ['uranus', ['#b8f0f0', '#5ac8d8'], 8.69, true, "Uranus, the ice giant that spins on its side! It's really made of gas and ice, but in our game you can walk on its blue-green clouds."],
  ['neptune', ['#7fa8ff', '#2f4fd0'], 11.15, true, "Neptune, the windy blue planet, far, far away! It's really made of gas and ice, but in our game you can walk on its deep blue clouds."],
  ['pluto', ['#f0dcc8', '#a8806a'], 0.62, false, "Pluto, far out in the cold! It's tiny and icy, with a big heart shape. Jump! You go about sixteen times higher and float down slowly."],
  // (build 126) THE SUN: really a giant ball of super hot glowing gas with no ground at all. Here, clearly made-up, magic
  // golden platforms float safely above it, with a light, floaty pull (not a real value: there is nowhere to stand).
  ['sun', ['#fff3b0', '#ff9a1a'], 4.9, false, "The Sun! It's our star, a gigantic ball of super hot glowing gas, with no ground at all. In our game, magic golden platforms float safely high above it. Jump! You float down gently here."],
];
for (const d of DIMENSIONS) PLACES.push([d.id, d.colors, d.gravity, false, d.hello, { dim: true }]); // (build 131) the dimensions behind the wormholes (not in the rocket menu)
export const EARTH_G = 9.81;

// ---------- (build 49) how each place LOOKS: its sky, its light, its haze and what drifts in the air ----------
// sky: colours from the top down to the horizon, stars (0…1), the sun's glow, drifting haze bands
// light: [sun colour, strength], [light from the sky, light bounced off the ground, strength], haze [colour, from, to]
const LOOK = {
  moon: { sky: { top: '#000003', mid: '#01020a', hor: '#04050d', low: '#000000', stars: 1, sunDir: [-.8, .3, -.5], sunCol: '#ffffff', glow: [60, .12, 0] },
    sun: ['#ffffff', 3.5], hemi: ['#5a6690', '#3a3a44', .5], fog: ['#0a0b12', 400, 2000], env: .1, rim: ['#9ab4ff', .5], sunOff: [-15, 10, 8] },
  mercury: { sky: { top: '#000002', mid: '#050208', hor: '#12080a', low: '#000000', stars: .9, sunDir: [.16, .1, -1], sunCol: '#ffcf80', glow: [10, .5, 0] },
    sun: ['#fff0d0', 2.9], hemi: ['#7a5a40', '#4a3020', .5], fog: ['#1a0e0a', 300, 1800], env: .1, rim: ['#ffb060', 1.1], sunOff: [-9, 9, 10],
    dust: { color: '#ffb060', size: .1, opacity: .7, add: true, box: [44, 7, 22], vel: [.15, .5, 0], sway: .3, n: 44 } },
  venus: { sky: { top: '#7a4c14', mid: '#d0902e', hor: '#f4c96a', stars: 0, sunDir: [-.3, .35, -.9], sunCol: '#fff0c0', glow: [3, .28, 0], band: '#fff2b8', bandK: .55, wind: .035 },
    sun: ['#ffd9a0', 1.9], hemi: ['#ffdc90', '#9a4a1c', 1.15], fog: ['#eab85c', 16, 125], env: .22, rim: ['#ffb040', .9],
    dust: { color: '#ffa040', size: .13, opacity: .85, add: true, box: [46, 9, 24], vel: [.5, .7, 0], sway: .6, n: 64 } },
  mars: { sky: { top: '#a8805e', mid: '#d6a274', hor: '#f3cda4', stars: 0, sunDir: [.55, .11, -.83], sunCol: '#a8d0ff', glow: [26, .55, 1.6] },
    sun: ['#ffe2c4', 2.7], hemi: ['#f4c4a0', '#a8502c', .85], fog: ['#ecc096', 42, 235], env: .2, rim: ['#ffc8a0', .6], sunOff: [-12, 12, 9],
    dust: { color: '#f0c098', size: .11, opacity: .55, box: [48, 6, 24], vel: [1.6, .05, 0], sway: .5, n: 80 } },
  jupiter: { sky: { top: '#120904', mid: '#7c4a24', hor: '#eebc88', stars: .45, sunDir: [-.5, .2, -.8], sunCol: '#fff0d0', glow: [14, .3, .8], band: '#fff0dc', bandK: .6, wind: .05, aurora: '#b03aa0' },
    sun: ['#fff0d8', 2.3], hemi: ['#ffe4c4', '#c47a40', 1.2], fog: ['#e6b480', 46, 240], env: .25, rim: ['#ffd0a0', .7],
    dust: { color: '#fff0dc', size: .7, opacity: .16, box: [50, 5, 22], vel: [1.2, 0, 0], sway: .25, n: 34 } },
  saturn: { sky: { top: '#070604', mid: '#2e2616', hor: '#d9bc78', stars: .5, sunDir: [.4, .25, -.85], sunCol: '#fff6d8', glow: [14, .3, .8], band: '#fff8dc', bandK: .16, wind: .03 },
    sun: ['#fff4d8', 2.4], hemi: ['#fff0c8', '#c8a050', 1.2], fog: ['#f0dca0', 46, 250], env: .25, rim: ['#ffe8b0', .7],
    dust: { color: '#ffffff', size: .12, opacity: .9, add: true, box: [46, 12, 24], vel: [.2, -.5, 0], sway: .35, n: 70 } },
  uranus: { sky: { top: '#03191e', mid: '#2a8a94', hor: '#bdf3f3', stars: .4, sunDir: [-.4, .3, -.85], sunCol: '#e8ffff', glow: [16, .25, .6], band: '#e6ffff', bandK: .22, wind: .02 },
    sun: ['#e8ffff', 2.3], hemi: ['#dcffff', '#4fa8b0', 1.2], fog: ['#a6e6ea', 36, 215], env: .28, rim: ['#c8ffff', .7],
    dust: { color: '#ffffff', size: .1, opacity: .85, add: true, box: [46, 12, 24], vel: [.9, .35, 0], sway: .4, n: 70 } },
  neptune: { sky: { top: '#010414', mid: '#102c84', hor: '#5e8ef2', stars: .7, sunDir: [.3, .3, -.9], sunCol: '#dfe8ff', glow: [20, .2, .6], band: '#d6e4ff', bandK: .45, wind: .16 },
    sun: ['#dfe8ff', 2.0], hemi: ['#b0caff', '#2444b8', 1.25], fog: ['#4670dc', 40, 225], env: .25, rim: ['#a8c8ff', .9],
    dust: { color: '#ffffff', size: .09, opacity: .7, add: true, box: [50, 7, 24], vel: [7, .1, 0], sway: .5, n: 90 } },
  sun: { sky: { top: '#ff7a1a', mid: '#ffae4a', hor: '#fff1b8', low: '#ffd070', stars: 0, sunDir: [0, -.35, -1], sunCol: '#fff6d0', glow: [2.4, .5, 0], band: '#fff6c8', bandK: .22, wind: .03 },
    sun: ['#fff2d4', 2.2], hemi: ['#ffe2a0', '#ff7a1a', 1.35], fog: ['#ffb45e', 70, 290], env: .22, rim: ['#ffd080', 1.0],
    dust: { color: '#ffe08a', size: .12, opacity: .8, add: true, box: [46, 10, 24], vel: [.2, 1.3, 0], sway: .5, n: 60 } },
  pluto: { sky: { top: '#000004', mid: '#050816', hor: '#1c2c52', low: '#0c1226', stars: 1, sunDir: [-.42, .1, -.9], sunCol: '#ffffff', glow: [400, 0, 2.6] },
    sun: ['#eef2ff', 2.3], hemi: ['#8a9cd0', '#6a4a44', .85], fog: ['#141c34', 120, 900], env: .12, rim: ['#8fb0ff', .9], sunOff: [-14, 9, 9],
    dust: { color: '#eaf2ff', size: .09, opacity: .7, box: [46, 10, 24], vel: [.25, -.3, 0], sway: .3, n: 56 } },
};
for (const d of DIMENSIONS) LOOK[d.id] = d.look; // (build 131) each dimension's own sky and light
const CLOUDS = { jupiter: ['#f3d6ae', '#c57a40', '#ebb680', '#fff1de', '#b96a3a'], saturn: ['#f6e3aa', '#e6c676', '#fff4d2', '#d8b268', '#f0d898'], uranus: ['#bdf1f1', '#93e2ea', '#dbfcfc', '#74d2dc', '#aeecee'], neptune: ['#5c86f2', '#2f4fd0', '#84a8ff', '#2440b0', '#4a70e4'] };

export function initSpace(G, api) {
  const { scene, Sound, player: P } = api;
  const built = {}, groups = {}, preparing = {}, controllers = {}; let navigation = 0, here = null, jumpTop = 0, jumpFrom = 0, told = {}, boost = 0;
  const say = (m, speak) => api.toast(m, speak), disc = (id, m) => api.discover(id, m), calm = () => !!(api.calm && api.calm());
  const sky = K.makeSky(); scene.add(sky.mesh);
  const dust = K.makeDust(96); scene.add(dust.points);
  const placeX = i => SPACE.ox + i * SPACE.gap;
  const ups = {}, skies = {}; // per place: little animations (run only while you're there); things in the sky that stay far away
  const T3 = new THREE.Color();

  function* build(i) {
    const [id, , , gas] = PLACES[i], X = placeX(i), PW = placeWidth(id), MID = X + PW / 2, g = new THREE.Group(); g.name = 'space:' + id; g.userData.dynamic = true; groups[id] = g; g.visible = false;
    const U = ups[id] = [], SK = skies[id] = [];
    const add = o => { g.add(o); return o; };
    const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return add(m); };
    const tapIt = (obj, fn, x, id2) => { obj.traverse(o => { if (o.isMesh || o.isSprite) o.userData.tap = fn; }); G.taps.push(obj); if (id2) G.interact.push({ x, y: 0, layer: 'space', disc: id2, run: fn, hintY: 2.4 }); return obj; };
    const fact = (m, d) => { say(m, true); if (d) disc(d); };
    /** a thing made of many painted shapes, as ONE mesh */
    const model = (fn, mat = K.shinyMat(), shadow = true) => { const b = K.makeBatch(); fn(b); const m = b.mesh(mat); m.castShadow = shadow; return m; };
    /** a thing far away in the sky: it follows the camera, so it never slides past like something near */
    const inSky = (o, x, y, z) => { o.position.set(x, y, z); o.userData.dynamic = true; SK.push([o, x, y]); return add(o); };
    const matte = K.makeBatch(), props = K.makeBatch(), soft = K.makeBatch();
    let H = () => 0;
    const R = (k, a = 0, b = 1) => a + K.hash2(k * 12.9898 + i * 3.7, k * 78.233 + 1.3) * (b - a); // repeatable "random"
    function* rocks(n, { x0 = X - 30, x1 = X + PW + 30, z0 = -4, z1 = -32, s0 = .18, s1 = .7, colors, sharp = 0, seed = 0, batch = matte, sink = .25 }) {
      for (let k = 0; k < n; k++) { const x = R(k + seed, x0, x1), z = z0 + (z1 - z0) * Math.pow(R(k + seed + .5), 1.6), s = s0 + (s1 - s0) * Math.pow(R(k + seed + .25), 2.2) * (1 + (-z) * .03), sh = R(k + seed + .7, .75, 1.1);
        const c0 = K.ramp(colors, R(k + seed + .9), new THREE.Color());
        batch.put(K.rockGeo(k, sharp, s < .5 || z < -22), x, H(x, z) + s * (.45 - sink), z, (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.62 + .5 * Math.max(0, ny) + .12 * K.noise3(px * 4, py * 4, pz * 4)); }, [s * R(k + seed + .3, .8, 1.4), s * sh, s], [0, R(k + seed + .1) * 6.28, 0]); yield; }
    };
    // a few big stones right at the front edge of the picture give it depth
    function* frontRocks(colors, n = 7, sharp = 0) { yield* rocks(n, { z0: 4.6, z1: 6.6, s0: .25, s1: .6, colors, sharp, seed: 400 }); }

    // ================= the ground and scenery of each place =================
    yield;
    if (id === 'moon') {
      // (stage 21) a detailed regolith: young craters that throw bright ejecta rays out across the maria,
      // raised rim crests, layered grey strata banded by height, and a scatter of small pits between the big ones
      const cr = []; for (let k = 0; k < 30; k++) { const z = -9 - Math.pow(R(k + 50), 1.4) * 105, r = 1.6 + R(k + 60) * 2.4 + (-z) * .06; cr.push({ x: R(k + 70, X - 70, X + 180), z, r, depth: .34, rim: .13, peak: r > 6, ray: R(k + 80) > .58, rayK: .55 + R(k + 90) * .5 }); }
      cr.push({ x: X + BIG_CRATER.dx, z: BIG_CRATER.z, r: BIG_CRATER.r, depth: BIG_CRATER.depth, rim: BIG_CRATER.rim }, /* (build 69: the giant coaster's crater) */ { x: X + 61, z: -15, r: 6.5, depth: .3, rim: .15, peak: true, ray: true, rayK: .9 }, { x: X + 24, z: -11, r: 3.4, depth: .3, rim: .14 }, { x: X + 88, z: -10.5, r: 3, depth: .32, rim: .14 });
      // (stage 21) three young ray craters right beside the walkway, so the ejecta rays are seen on the way past
      cr.push({ x: X + 26, z: -13, r: 5.2, depth: .3, rim: .18, peak: true, ray: true, rayK: 1.3 }, { x: X + 52, z: -18, r: 4.2, depth: .3, rim: .17, peak: true, ray: true, rayK: 1.15 }, { x: X + 96, z: -14, r: 3.6, depth: .32, rim: .16, ray: true, rayK: 1.1 });
      for (let k = 0; k < 34; k++) { const z = -6.2 - Math.pow(R(k + 140), 1.25) * 70, r = .4 + R(k + 150) * 1.25; cr.push({ x: R(k + 160, X - 60, X + 190), z, r, depth: .3, rim: .12 }); }
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, height: (x, z) => { let h = (K.fbm2(x * .05, z * .05, 4) - .5) * 1.3 + K.sstep(-60, -150, z) * (K.fbm2(x * .017 + 3, z * .017, 3) * 22 - 5); for (const c of cr) h += K.craterH(c, x, z); return h; },
        color: (x, z, h, ny, o) => { let s = 0, ray = 0, crest = 0, blanket = 0;
          for (const c of cr) { K.craterH(c, x, z); s += c.s; const dx = x - c.x, dz = z - c.z, d = Math.sqrt(dx * dx + dz * dz) / c.r;
            if (d < 2.4) blanket += (1 - d / 2.4) * .3;                                                       // bright ejecta blanket
            if (d > .7 && d < 1.45) { const q = 1 - Math.abs(d - 1.02) / .45; if (q > 0) crest = Math.max(crest, q * q); } // the uplifted rim crest
            if (c.ray && d > .85 && d < 5) { const a = Math.atan2(dz, dx); ray += K.sstep(.4, .66, K.noise2(a * 5.5 + c.x * .3, c.z * .11)) * Math.pow(1 - (d - .85) / 4.15, 1.3) * c.rayK; } } // radial ejecta rays
          const mare = K.sstep(.5, .4, K.fbm2(x * .021 + 9, z * .021 + 2, 3)), n = K.fbm2(x * .9, z * .9, 3), fine = K.fbm2(x * 2.6, z * 2.6, 2), pit = K.sstep(.74, .8, K.noise2(x * .8 + 5, z * .8)) * K.sstep(-5.5, -3, z);
          const band = Math.sin(h * 3.1 + K.noise2(x * .13, z * .13) * 2.4 + n * 1.2) * .5 + .5;              // regolith strata, stacked by height
          K.ramp(['#3d3d47', '#5f5f6b', '#8e8e9b', '#6d6d7a'], .22 + n * .44 + fine * .16 + Math.max(0, h) * .025, o);
          o.lerp(K.col('#232330'), mare * (.5 + band * .18));                                                  // dark basalt maria
          o.lerp(K.col('#ffffff'), Math.min(.85, crest * .34 + blanket * .14 + ray * .85));                      // fresh crest and rays
          o.lerp(K.col('#1d1d26'), K.sstep(.3, 0, band) * .14);                                               // thin dark layers in the walls
          o.multiplyScalar((.8 + .25 * ny) * Math.max(.45, Math.min(1.3, 1 + s * .22)) * (1 - pit * .13)); } });
      yield* rocks(70, { colors: ['#8f8f9b', '#c9c9d2'], s1: .6 }); yield* frontRocks(['#70707c', '#a9a9b4']);
      yield* rocks(54, { colors: ['#a8a8b4', '#e2e2ea', '#8a8a96'], s0: .1, s1: .3, z0: -3, z1: -22, seed: 1200, sink: .35 }); // (stage 21) fine pebbles between the boulders

      // the Moon lander: gold foil body on four legs, with a dish, a ladder and a little engine bell
      const lx = X + 33, lz = -8.2, ly = H(lx, lz); props.put(K.lathe([[0, 1.75], [1.05, 1.75], [1.25, 1.5], [1.25, .95], [1.0, .7], [0, .7]], 8), lx, ly, lz, '#e0a83a');
      props.put(K.lathe([[0, 2.95], [.5, 2.9], [.85, 2.55], [.9, 2.0], [.75, 1.75], [0, 1.75]], 10), lx, ly, lz, '#d9dce6'); props.put(K.lathe([[.2, .72], [.3, .5], [.5, .22], [.44, .22], [.2, .6]], 12), lx, ly, lz, '#5a5f6e');
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .78, cx2 = Math.cos(a), cz2 = Math.sin(a); props.put(K.geo.cyl(8), lx + cx2 * 1.55, ly + .75, lz + cz2 * 1.55, '#c9cdd8', [.05, 1.75, .05], [cz2 * .62, 0, -cx2 * .62]); props.put(K.geo.cyl(8), lx + cx2 * 1.35, ly + 1.05, lz + cz2 * 1.35, '#c9cdd8', [.035, .9, .035], [cz2 * -.9, 0, cx2 * .9]); props.put(K.lathe([[0, .1], [.3, .08], [.36, 0], [0, 0]], 12), lx + cx2 * 2.08, ly + .0, lz + cz2 * 2.08, '#e0a83a'); }
      props.put(K.lathe([[0, 0], [.2, .03], [.42, .16], [.5, .3]], 14), lx + .5, ly + 3.25, lz + .2, '#f2f4fa', 1, [.5, 0, -.5]); props.put(K.geo.cyl(6), lx + .42, ly + 3.0, lz + .15, '#c9cdd8', [.03, .5, .03]);
      for (let k = 0; k < 4; k++) props.put(K.geo.box(), lx - .1, ly + .25 + k * .3, lz + 1.5, '#c9cdd8', [.5, .05, .06]); for (const s of [-1, 1]) props.put(K.geo.box(), lx - .1 + s * .25, ly + .7, lz + 1.5, '#c9cdd8', [.05, 1.3, .05]);
      // Earth, hanging over the hills
      const e = inSky((yield* K.skyBodySteps('earth', 10, { size: 512 })), MID + 6, 10.5, -190), eg = inSky(K.glow('#5aa0ff', 46, .34), MID + 6, 10.5, -196); U.push(dt => { e.rotation.y += dt * .03; }); e.rotation.z = .4;
      tapIt(e, () => fact('🌍 That blue planet is Earth: our home! Wave hello!', 'moonearth'));
      // plant a flag: the pole grows out of the ground and the flag unrolls
      const fg = new THREE.Group(); fg.position.set(X + 40, 0, -2.6); add(fg); const base = new THREE.Mesh(K.lathe([[0, .14], [.16, .12], [.24, 0], [0, 0]], 14), toy('#c9cdd8', { r: .4, m: .4 })); fg.add(base);
      const poleG = new THREE.CylinderGeometry(.045, .045, 2.7, 10); poleG.translate(0, 1.35, 0); const pole = new THREE.Mesh(poleG, toy('#f2f4fa', { r: .3, m: .5 })); pole.scale.y = .04; fg.add(pole);
      const flagG = new THREE.PlaneGeometry(1.15, .72, 10, 4); flagG.translate(.6, 0, 0); const flag = new THREE.Mesh(flagG, toy('#ff4f6a', { r: .6 })); flag.material.side = THREE.DoubleSide; flag.position.y = 2.3; flag.visible = false; fg.add(flag); const star = new THREE.Mesh(new THREE.CircleGeometry(.17, 5), toy('#ffe36e', { em: '#ffd23f', ei: .4 })); star.position.set(.6, 2.3, .02); star.visible = false; fg.add(star);
      const f0 = flagG.attributes.position.array.slice(); let up = 0;
      tapIt(fg, () => { if (up) return; up = .001; Sound.chime(); fact('🚩 You planted a flag on the Moon!', 'moonflag'); }, X + 40, 'moonflag');
      U.push((dt, t) => { if (!up) return; if (up < 1) { up = Math.min(1, up + dt * .9); pole.scale.y = .04 + .96 * up; flag.visible = star.visible = up > .55; flag.scale.x = star.scale.x = K.sstep(.55, 1, up); }
        const a = flagG.attributes.position; for (let k = 0; k < a.count; k++) a.setZ(k, Math.sin(f0[k * 3] * 4 - t * 2.2) * .05 * f0[k * 3]); a.needsUpdate = true; }); // (a gentle ripple, as if it was just set swinging)
      // five moon rocks to count
      let got = 0; const rs = []; for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(K.rockGeo(k + 1, 1), toy(['#d6d6e0', '#c2c6d6', '#e2dcd2', '#c9c9d4', '#d0d8e2'][k], { r: .5, cc: .6 })); r.scale.setScalar(.34); r.position.set(X + 48 + k * 3.2, .3, -1.4); r.castShadow = true; add(r); rs.push(r); let pop = 0;
        tapIt(r, () => { if (!r.visible || pop) return; pop = .001; got++; Sound.pop ? Sound.pop() : Sound.click(); api.burst(r.position.x, .5, -1.4, ['#ffffff', '#e6e6ec', '#ffe36e'], 8, 2); say(`🪨 ${['', 'One', 'Two', 'Three', 'Four', 'Five'][got]} moon rock${got > 1 ? 's' : ''}!`, true); disc('moonrocks'); if (got === 5) setTimeout(() => { got = 0; rs.forEach(q => { q.visible = true; q.scale.setScalar(.34); q.position.y = .3; }); }, 6000); }, k === 0 ? X + 48 : null, k === 0 ? 'moonrocks' : null);
        U.push((dt, t) => { if (pop) { pop += dt * 3; r.position.y = .3 + Math.sin(Math.min(1, pop) * Math.PI) * 1.2; r.scale.setScalar(.34 * (1 - K.sstep(.5, 1, pop))); r.rotation.y += dt * 9; if (pop >= 1) { pop = 0; r.visible = false; } } else r.rotation.y = Math.sin(t * .8 + k) * .25; }); }
    }
    yield;
    if (id === 'mercury') {
      // (stage 22) the same treatment as the Moon, in Mercury's warm greys: young craters that throw ejecta rays,
      // raised bright rim crests, layered regolith strata, and bright volatile hollows on some crater floors
      const cr = []; for (let k = 0; k < 40; k++) { const z = -8.5 - Math.pow(R(k + 50), 1.3) * 100, r = 1.3 + R(k + 60) * 2.2 + (-z) * .05; cr.push({ x: R(k + 70, X - 70, X + 180), z, r: r * 1.5, depth: .46, rim: .09, ray: R(k + 80) > .7, rayK: .7 + R(k + 90) * .5 }); }
      const iceCrater = { x: X + 78, z: -12.5, r: 4.6, depth: .46, rim: .1 }; cr.push(iceCrater);
      for (let k = 0; k < 34; k++) { const z = -6.2 - Math.pow(R(k + 140), 1.25) * 70, r = .4 + R(k + 150) * 1.25; cr.push({ x: R(k + 160, X - 60, X + 190), z, r, depth: .4, rim: .08 }); }
      // (stage 22b) two big young craters right beside the walkway: 5 m deep bowls with 2.5 m rims and long ejecta rays
      // (stage 22c) two wide, shallow basins beside the walkway: a low near rim you can look over and a raised far wall,
      // so the walking camera sees into the bowl instead of only its outside bank
      cr.push({ x: X + 34, z: -10.5, r: 13, depth: .2, rim: .04, ray: true, rayK: 1.5, big: 1 },
              { x: X + 76, z: -11, r: 9, depth: .22, rim: .045, ray: true, rayK: 1.3, big: 1 });
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 224, nz: 88, height: (x, z) => { let h = (K.fbm2(x * .07, z * .07, 4) - .5) * 3.6 + K.sstep(.47, .53, K.fbm2(x * .011 + 4, z * .034 + 5, 3)) * 2.6 * K.sstep(-14, -34, z) * K.sstep(-90, -60, z) + K.sstep(-70, -160, z) * K.ridge2(x * .016, z * .016, 4) * 9; for (const c of cr) { h += K.craterH(c, x, z); if (c.farWall) { const d = Math.hypot(x - c.x, z - c.z) / c.r, away = Math.max(0, (c.z - z) / c.r); h += c.farWall * Math.exp(-Math.pow((d - 1) / .85, 2)) * Math.min(1, away * 1.4); } } return h; },
        color: (x, z, h, ny, o) => { let s = 0, ray = 0, crest = 0, blanket = 0, hollow = 0, floor = 0, bowl = 0, ring = 0, gap = 0;
          for (const c of cr) { K.craterH(c, x, z); s += c.s; const dx = x - c.x, dz = z - c.z, d = Math.sqrt(dx * dx + dz * dz) / c.r;
            if (d < 1) floor = Math.max(floor, (1 - d * d) * .9);                                              // the shaded bowl floor
            if (c.big) { bowl = Math.max(bowl, K.sstep(1.15, .35, d)); ring = Math.max(ring, K.sstep(.88, 1.1, d) * K.sstep(1.5, 1.22, d)); } // the two showpieces read from the path: soft dark bowl, wide soft bright rim
            if (d < 2.4) blanket = Math.max(blanket, (1 - d / 2.4) * .3);                                 // bright ejecta blanket (nearest rim wins)
            if (d > .62 && d < 1.62) { const q = 1 - Math.abs(d - 1.02) / .6; if (q > 0) crest = Math.max(crest, q * q); } // the uplifted rim crest
            if (d < .95) hollow = Math.max(hollow, K.sstep(.56, .8, K.noise2(x * .45 + c.x, z * .45 + c.z)) * (1 - d) * 1.4); // bright volatile hollows
            const rayTo = c.big ? 5 : 2.1;                                                                     // only the two young showpieces throw long rays
            if (c.ray && d > 1 && d < rayTo) { const a = Math.atan2(dz, dx), m = K.noise2(a * 3.2 + c.x * .3, c.z * .11), fall = Math.pow(1 - (d - 1) / (rayTo - 1), 1);
              ray = Math.min(1.2, ray + K.sstep(.48, .68, m) * fall * c.rayK * (c.big ? 1 : .55));
              if (c.big) gap = Math.max(gap, K.sstep(.44, .22, m) * fall); } } // ejecta rays, with dark lanes between
          const plains = K.sstep(.5, .4, K.fbm2(x * .02 + 3, z * .02 + 7, 3)), n = K.fbm2(x * .85, z * .85, 3), fine = K.fbm2(x * 2.7, z * 2.7, 2);
          const band = Math.sin(h * 3.3 + K.noise2(x * .14, z * .14) * 2.2 + n) * .5 + .5;                    // regolith strata
          K.ramp(['#1b1815', '#262320', '#332e29', '#2a2723'], .2 + n * .44 + fine * .16 + Math.max(0, h) * .02, o);
          o.lerp(K.col('#1e1a17'), plains * (.5 + band * .2));                                                 // dark smooth plains
          o.lerp(K.col('#241f1c'), Math.min(.8, gap * .7));                                                  // the dark lanes between the rays
          o.lerp(K.col('#3a342d'), Math.min(.8, bowl * .78));                                                  // the showpieces' bowls: dark, shaded floor
          o.lerp(K.col('#ffffff'), Math.min(.95, crest * .18 + blanket * .05 + ray * .9 + hollow * .14 + ray * .9 + ring * .55)); // bright crests, rays, hollows and fresh rims
          o.lerp(K.col('#181513'), K.sstep(.3, 0, band) * .16);                                               // thin dark layers in the walls
          o.multiplyScalar((.7 + .34 * ny) * Math.max(.42, Math.min(1.5, 1 + s * .55)) * (1 - floor * .3)); } });
      yield* rocks(80, { colors: ['#4f4439', '#a08a72'], sharp: 1, s1: .75 }); yield* frontRocks(['#3f362e', '#75644f'], 7, 1);
      yield* rocks(46, { colors: ['#6a5c4e', '#b0a08c'], s0: .1, s1: .3, z0: -3, z1: -22, seed: 1300, sink: .35 }); // (stage 22) fine pebbles
      // ice hiding in a crater that the Sun never reaches (there really is ice on Mercury!)
      { const c = iceCrater, y = H(c.x, c.z); props.put(K.geo.cyl(24), c.x, y + .12, c.z, '#dff3ff', [c.r * .55, .1, c.r * .5]); for (let k = 0; k < 9; k++) { const a = k * .7, r = c.r * (.15 + R(k + 5) * .3); props.put(K.rockGeo(k, 1), c.x + Math.cos(a) * r, y + .3, c.z + Math.sin(a) * r, k % 2 ? '#e8f8ff' : '#bfe6ff', [.3, .5 + R(k) * .8, .3], [R(k) * .4, k, R(k + 2) * .4]); } }
      // the huge Sun, with a glowing crown
      const sx = MID + 30, sy = 17, sz = -210; const sun = inSky((yield* K.skyBodySteps('sunface', 26, { emissive: true })), sx, sy, sz), g1 = inSky(K.glow('#ffd070', 120, .8), sx, sy, sz - 4), g2 = inSky(K.glow('#ff9a3c', 260, .4), sx, sy, sz - 6); let hot = 0;
      tapIt(sun, () => { hot = 2; Sound.noise && Sound.noise(.8, 1200, 300, .04); fact('☀️ Sizzle! The Sun looks HUGE from Mercury: it\'s the closest planet to the Sun!', 'mercurysun'); }, X + 58, 'mercurysun');
      U.push((dt, t) => { hot = Math.max(0, hot - dt); const k = 1 + Math.sin(t * 2) * .015 + hot * .06; sun.scale.setScalar(k); sun.rotation.y += dt * .02; g1.scale.setScalar(120 * (1 + Math.sin(t * 1.3) * .04 + hot * .15)); g2.scale.setScalar(260 * (1 + Math.sin(t * .7 + 1) * .06 + hot * .2)); });
      // the day and night button: a big glowing dome on a stand
      const bg = new THREE.Group(); bg.position.set(X + 44, 0, -2.4); add(bg); bg.add(model(b => { b.put(K.lathe([[0, .5], [.62, .5], [.7, .42], [.74, .1], [.84, 0], [0, 0]], 24), 0, 0, 0, '#8a8fa0'); b.put(K.geo.torus(.1), 0, .5, 0, '#ffd23f', [.6, .6, .6], [Math.PI / 2, 0, 0]); }));
      const dome = new THREE.Mesh(K.lathe([[0, .42], [.2, .4], [.38, .3], [.5, .14], [.54, 0]], 20), toy('#ff9a2e', { em: '#ff7a00', ei: .7, r: .3 })); dome.position.y = .5; bg.add(dome); let night = 0, push = 0;
      tapIt(bg, () => { night = night ? 0 : 1; push = 1; Sound.click(); sun.visible = g1.visible = g2.visible = !night; dome.material.color.set(night ? '#5a7cff' : '#ff9a2e'); dome.material.emissive.set(night ? '#2f4fd0' : '#ff7a00');
        api.light(night ? { ...LOOK.mercury, sun: ['#8fa8ff', .8], hemi: ['#3a4a80', '#1a1a2a', .55], rim: ['#6a8cff', .5] } : LOOK.mercury); sky.set(night ? { ...LOOK.mercury.sky, sunCol: '#000000', hor: '#03040c', stars: 1.2 } : LOOK.mercury.sky); dust.points.visible = !night;
        fact(night ? '🌙 Night on Mercury: it gets VERY cold!' : '☀️ Day on Mercury: it gets VERY hot!', 'mercurynight'); }, X + 44, 'mercurynight');
      U.push(dt => { push = Math.max(0, push - dt * 4); dome.position.y = .5 - Math.sin(push * Math.PI) * .12; });

      // (stage 22c) THE CRATER OVERLOOK: a one-time reveal the first time you walk up to the big crater
      { const cx = X + 34, cz = -10.5, PL = G.player; let show = -1;
        U.push(dt => {
          if (!PL) return;
          if (show < 0) {
            if (!G.mercuryCraterSeen && !PL.ride && (!G.camOverride || G.camOverride.overlook) &&
              Math.hypot(PL.x - cx, (PL.z || 0) - cz) < 24) {
              show = 0; G.mercuryCraterSeen = 1;
              fact('🕳️ Look at that giant crater! Mercury is covered in craters.', 'mercurycrater');
            } else { if (G.camOverride && G.camOverride.overlook) G.camOverride = null; return; }
          }
          show += dt;
          if (show >= 6) { G.camOverride = null; show = -2; return; }
          const a = Math.min(1, show / 1.1), b = Math.min(1, Math.max(0, (6 - show) / 1.1)), w = Math.min(a, b), e = w * w * (3 - 2 * w);
          const px = PL.x, py = PL.y + 3.2, pz = 9.5, tp = [cx - 18, 9, 10], tl = [cx - 2, PL.y - 2, cz];
          G.camOverride = { overlook: 1, pos: [px + (tp[0] - px) * e, py + (tp[1] - py) * e, pz + (tp[2] - pz) * e],
            look: [px + (tl[0] - px) * e, (PL.y + 1) + (tl[1] - PL.y - 1) * e, (PL.z || 0) + (tl[2] - (PL.z || 0)) * e] };
        }); }
      g.userData.leave = () => { if (night) { night = 0; sun.visible = g1.visible = g2.visible = true; dome.material.color.set('#ff9a2e'); dome.material.emissive.set('#ff7a00'); } };
    }
    yield;
    if (id === 'venus') {
      const river = z => MID + 22 + Math.sin(z * .16) * 9 + Math.sin(z * .05 + 1) * 14; // a lava river winding down from the far volcano
      const VOL = [[MID + 10, -150, 80, 36], [X - 20, -95, 34, 16], [X + 128, -80, 30, 15]];
      // (stage 23) the volcanic plains get real Venus landforms on the shared unit shapes: flat-topped pancake domes,
      // small cinder cones, blocky tessera highlands and branching lava channels cut into the ground
      const DOMES = [], CONES = [], TESS = [];
      for (let k = 0; k < 8; k++) DOMES.push([X + 4 + k * 21 + R(k + 300) * 8, -12 - R(k + 310) * 16, 5 + R(k + 320) * 4, 3.4 + R(k + 330) * 2]);
      for (let k = 0; k < 10; k++) CONES.push([X - 26 + k * 19 + R(k + 340) * 10, -22 - R(k + 350) * 40, 1.8 + R(k + 360) * 1.8, 1.8 + R(k + 370) * 2.2]);
      for (let k = 0; k < 4; k++) TESS.push([X - 30 + k * 78 + R(k + 380) * 26, -78 - R(k + 390) * 55, 26 + R(k + 400) * 14, 9 + R(k + 410) * 8]);
      const chan = (x, z) => K.sstep(.58, .9, K.ridge2(x * .022 + 4, z * .011, 3)) * K.sstep(-8, -20, z);   // branching lava channels
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, flatZ: -4.4, nx: 240, nz: 90,
        height: (x, z) => { let h = (K.fbm2(x * .05, z * .05, 4) - .5) * 4 + K.ridge2(x * .11, z * .11, 3) * 1.1;
          h += (K.fbm2(x * .016 + 2, z * .016 + 5, 3) - .5) * 9 * K.sstep(-14, -34, z);                       // broad volcanic swells
          for (const [vx, vz, r, hh] of VOL) { const d = Math.hypot(x - vx, z - vz) / r; if (d < 1) h += hh * Math.pow(1 - d, 1.5) - hh * .5 * Math.exp(-d * d / .004);
            if (d > .3 && d < 1.9) h += hh * .07 * Math.pow(1 - (d - .3) / 1.6, 2) * (1 + .45 * Math.sin(d * 10 + x * .06)); } // stacked flow aprons
          for (const [dx2, dz2, dr, dh] of DOMES) { const d = Math.hypot(x - dx2, z - dz2) / dr; if (d < 1) h += dh * K.sstep(1.02, .82, d) * (1 + .05 * Math.sin(Math.atan2(z - dz2, x - dx2) * 6)); } // pancake domes: flat tops, steep sides
          for (const [cx2, cz2, cr, ch] of CONES) { const d = Math.hypot(x - cx2, z - cz2) / cr; if (d < 1) h += ch * Math.pow(1 - d, 1.7); }
          for (const [tx2, tz2, tr, th] of TESS) { const d = Math.hypot(x - tx2, z - tz2) / tr; if (d < 1.4) h += th * K.sstep(1.2, .45, d) * (.55 + .55 * K.ridge2(x * .06, z * .06, 3)); } // tessera highlands
          h -= chan(x, z) * 3.2;                                                                              // lava channels cut into the plains
          const rd = Math.abs(x - river(z)); h -= Math.exp(-rd * rd / 5) * 1.1 * K.sstep(-9, -16, z); return h; },
        color: (x, z, h, ny, o) => { // every colour feature here is at least ~4 m across, so the 1.8 m vertex grid can carry it
          const n = K.fbm2(x * .16, z * .16, 3), fine = K.fbm2(x * .42, z * .42, 2), crack = K.sstep(.78, .95, K.ridge2(x * .18, z * .18, 2)), near = K.sstep(-16, -6, z) * K.sstep(.72, .9, K.ridge2(x * .3 + 2, z * .22, 2)), rd = Math.abs(x - river(z)), hot = Math.exp(-rd * rd / 14) * K.sstep(-8, -15, z), ch = chan(x, z);
          const lv = K.fbm2(x * .028 + 3, z * .028 + 9, 3), lobe = K.sstep(.52, .6, lv), lobeEdge = K.sstep(.5, .555, lv) * K.sstep(.62, .565, lv);  // big lava-flow lobes with bright flow fronts
          let tw = 0, dw = 0; for (const [tx2, tz2, tr] of TESS) tw = Math.max(tw, K.sstep(1, .6, Math.hypot(x - tx2, z - tz2) / tr));   // tessera blocks
          for (const [dx2, dz2, dr] of DOMES) dw = Math.max(dw, K.sstep(1.25, .95, Math.hypot(x - dx2, z - dz2) / dr));                    // the domes' steep skirts
          const band = Math.sin(h * 2.4 + K.noise2(x * .06, z * .06) * 2) * .5 + .5;
          K.ramp(['#33231c', '#6b4830', '#a8763f', '#d9a64e'], .22 + n * .46 + fine * .12 + (1 - ny) * .18, o);
          o.lerp(K.col('#241a14'), lobe * .5);                                                                 // dark basalt between the flows
          o.lerp(K.col('#8c5f36'), lobeEdge * .45);                                                            // pale flow fronts
          o.lerp(K.col('#efdcb4'), tw * (.44 + crack * .16));                                                   // pale tessera blocks
          o.lerp(K.col('#3a281e'), tw * crack * .65);                                                          // the fractures between them
          o.lerp(K.col('#c9924e'), dw * K.sstep(.9, .45, ny) * .45);                                            // the steep dome skirts
          o.lerp(K.col('#e8cf9c'), dw * K.sstep(.8, .96, ny) * .4);                                             // their flat, pale tops
          o.lerp(K.col('#1c110c'), Math.min(.8, ch * .85));                                                     // shaded lava channels
          o.lerp(K.col('#ff7a1c'), Math.min(.9, hot * .55 + ch * K.sstep(.78, .92, K.ridge2(x * .022 + 4, z * .011, 3)) * .5 + crack * .08 + dw * .12));
          o.lerp(K.col('#f2d98c'), K.sstep(.62, .8, K.noise2(x * .03, z * .2)) * .3);                           // sulphur streaks
          o.lerp(K.col('#1a100b'), near * .4); o.lerp(K.col('#ff8a2a'), near * .22);                             // the walkway's own cracked, glowing crust
          o.lerp(K.col('#1a120e'), K.sstep(.3, 0, band) * .12);                                                // thin dark layers
          o.multiplyScalar((.72 + .32 * ny) * (1 - crack * .3) * (1 - ch * .12)); } });
      yield* rocks(60, { colors: ['#2a1c18', '#6b4830'], sharp: 1, s1: .8 }); yield* frontRocks(['#2a1c18', '#5a3c28'], 7, 1);
      // glowing lava: the river, and the pools on top of the two near volcanoes (one mesh, softly pulsing)
      const lavaM = toy('#ff7a1a', { em: '#ff4a00', ei: 1.5, r: .6 });
      { const pos = [], idx = []; let n = 0; for (let z = -15; z >= -118; z -= 2.5) { const x = river(z), w = .9 + (-z) * .02, y = H(x, z) + .28; pos.push(x - w, y, z, x + w, y, z); if (n) { const a = n * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } n++; }
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setIndex(idx); lg.computeVertexNormals(); const lava = mesh(lg, lavaM); lava.userData.lava = 1; U.push((dt, t) => { lavaM.emissiveIntensity = 1.35 + Math.sin(t * 1.6) * .3; }); }
      // (stage 23) THE CLOUD DECK: three translucent sheets of cloud stacked at different heights and drifting at
      // different speeds, each a continuous run of billows rather than separate puffs, so they read as a deck
      venusCloudMat ||= new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: .42, roughness: 1, metalness: 0, depthWrite: false });
      venusCloudFar ||= new THREE.SphereGeometry(1, 8, 5); // (stage 24) the two far sheets use a coarser ball: 64 tris instead of 120, no different at 100+ m
      for (const [zz, yy, sc, n, tint, sp] of [[-40, 9, 1.2, 17, '#fff2cc', .55], [-100, 16, 2.2, 15, '#ffe0a8', .95], [-170, 26, 3.4, 13, '#ffcb80', 1.5]]) {
        const ball = sc > 1.5 ? venusCloudFar : K.geo.sph(1), row = () => model(b => { for (let k = 0; k < n; k++) { const x = X - 70 + k * (PW + 140) / (n - 1), z2 = zz + (R(k + 3 + zz) - .5) * 10 * sc, c0 = K.col('#fbebc6').lerp(K.col(tint), R(k + 7 + zz) * .6);
          for (let q = 0; q < 3; q++) { const r = sc * (.9 + R(k * 4 + q + zz) * .7), hgt = r * (.5 + R(k * 7 + q) * .55); // (stage 24: 3 wider billows instead of 4: 43,200 -> 22,992 tris)
            b.put(ball, x + (q - 1) * r * 1.3, R(k + q + zz) * r * .45, z2 + R(k + q + 2 + zz) * 3 * sc, (px, py, pz, nx, ny, nz, o2) => { o2.copy(c0).multiplyScalar(.76 + .32 * Math.max(0, ny)); }, [r * 2.0, hgt, r * 1.25]); } } }, venusCloudMat, false);
        const m = add(row()); m.position.set(0, yy, zz); m.userData.dynamic = true; m.renderOrder = 2;
        const m2 = add(row()); m2.position.set(-(PW + 140), yy, zz); m2.userData.dynamic = true; m2.renderOrder = 2;
        U.push(dt => { for (const q of [m, m2]) { q.position.x += dt * sp; if (q.position.x > PW + 140) q.position.x -= (PW + 140) * 2; } });
      }
      // (stage 23) fumaroles beside the walkway: low sulphur cones with a glowing mouth, so the ground by the path has
      // its own volcanic detail instead of a bare slope
      for (let k = 0; k < 11; k++) { const vx = X + 6 + k * 29 + R(k + 500) * 12, vz = -6.5 - R(k + 510) * 7, vy = H(vx, vz), sc = .5 + R(k + 520) * .55;
        props.put(K.lathe([[0, .1], [.5, .08], [.72, 0]], 12), vx, vy + .02, vz, '#c8a86a', [sc, sc * 1.1, sc]);
        props.put(K.geo.cyl(10), vx, vy + .13 * sc, vz, '#ff8a2a', [sc * .26, .04, sc * .26]);
        const gl = K.glow('#ff9a3c', 1.6 * sc, .5); gl.position.set(vx, vy + .16, vz); add(gl);
        U.push((dt, t) => { gl.scale.setScalar(1.6 * sc * (1 + Math.sin(t * 2.1 + k) * .12)); if (Math.random() < dt * .5) api.burst(vx, vy + .3, vz, ['#e8d2a0', '#ffb060'], 1, .5); }); }
      for (const [x, k] of [[X + 40, 0], [X + 66, 1]]) { const vz = -9.5, vg = new THREE.Group(); vg.position.set(x, H(x, vz) - .3, vz); add(vg);
        vg.add(model(b => { const cone = K.lathe([[0, 5.3], [.55, 5.25], [.95, 5.75], [1.25, 5.6], [1.8, 4.5], [2.6, 3.0], [3.7, 1.5], [5.2, .45], [6.6, 0]], 28), p = cone.attributes.position; for (let q = 0; q < p.count; q++) { const px = p.getX(q), py = p.getY(q), pz = p.getZ(q), n = 1 + (K.fbm3(px * .6 + k * 9, py * .6, pz * .6, 3) - .5) * .32 * K.sstep(5.7, 3, py); p.setXYZ(q, px * n, py, pz * n); } cone.computeVertexNormals();
          b.add(cone, null, (px, py, pz, nx, ny, nz, o) => { const a = Math.atan2(pz, px), flow = K.sstep(.8, .93, K.noise2(a * 2.2 + k * 5, 1)) * K.sstep(.6, 5.6, py); K.ramp(['#3a251c', '#5c3b28', '#7d5132'], K.fbm3(px * .8, py * .8, pz * .8, 3) + py * .04, o).multiplyScalar(.75 + .3 * ny); o.lerp(K.col('#ff6a1c'), flow * .85 + K.sstep(5, 5.7, py) * .5); }); }, K.paintMat(), false));
        const pool = new THREE.Mesh(new THREE.CircleGeometry(.62, 16), lavaM); pool.rotation.x = -Math.PI / 2; pool.position.y = 5.32; vg.add(pool); const gl = K.glow('#ff7a2a', 5, .55); gl.position.y = 6; vg.add(gl); let erupt = 0;
        tapIt(vg, () => { erupt = 3; Sound.noise && Sound.noise(1, 120, 600, .06); G.shake = Math.max(G.shake || 0, .35); fact('🌋 Boom! Venus has lots of volcanoes!', 'venusvolcano'); }, x, k === 0 ? 'venusvolcano' : null);
        U.push((dt, t) => { gl.scale.setScalar(5 + Math.sin(t * 2 + k) * .6 + (erupt > 0 ? 4 : 0)); if (Math.random() < dt * 1.2) api.burst(x, vg.position.y + 5.6, vz, ['#8a7a6a', '#b8a890'], 1, .6); if (erupt <= 0) return; erupt -= dt; if (Math.random() < dt * 34) api.burst(x + (Math.random() - .5), vg.position.y + 5.6, vz, ['#ff6a2a', '#ffd23f', '#ff3a00'], 3, 4.2); }); }
      // the thermometer: a glass tube with a red bulb; tap it and the red climbs to the top
      const tg = new THREE.Group(); tg.position.set(X + 52, 0, -2.2); add(tg); tg.add(model(b => { b.put(K.lathe([[0, .22], [.5, .2], [.62, 0], [0, 0]], 20), 0, 0, 0, '#8a8fa0'); b.put(K.geo.box(), 0, 1.9, -.16, '#fff8e8', [.9, 3.3, .1]); for (let k = 0; k < 9; k++) b.put(K.geo.box(), .26, .95 + k * .28, -.1, k % 4 === 0 ? '#ff4f4f' : '#6a7080', [k % 4 === 0 ? .26 : .16, .035, .04]); b.put(K.geo.sph(), 0, .52, 0, '#ff2a2a', .3); }));
      const glass = new THREE.Mesh(new THREE.CapsuleGeometry(.14, 2.5, 6, 14), toy('#ffffff', { opacity: .35, r: .1 })); glass.position.y = 2.0; tg.add(glass);
      const redG = new THREE.CylinderGeometry(.085, .085, 1, 12); redG.translate(0, .5, 0); const red = new THREE.Mesh(redG, toy('#ff2a2a', { em: '#ff2a2a', ei: .7 })); red.position.y = .7; red.scale.y = .3; tg.add(red); let heat = 0;
      tapIt(tg, () => { heat = .001; Sound.tone(300, .6, 'sine', .04, 3); fact('🌡️ Venus is the hottest planet: even hotter than an oven!', 'venusheat'); }, X + 52, 'venusheat');
      U.push((dt, t) => { if (heat) { heat = Math.min(1, heat + dt * .5); red.scale.y = .3 + heat * 2.2; if (heat >= 1 && Math.random() < dt * 6) api.burst(X + 52, 3.4, -2.2, ['#ff6a2a', '#ffd23f'], 1, .8); } });
      // far lightning inside the thick clouds (not in calm mode)
      let nextZap = 5; U.push((dt, t) => { nextZap -= dt; if (nextZap < 0) { nextZap = 6 + Math.random() * 8; if (!calm()) boost = .5; } });
    }
    yield;
    if (id === 'mars') {
      const mons = [MID + 40, -205, 120, 34];
      // (stage 24) THE CANYONS: one long canyon with a branch, cut 11 m and 7 m into the far plains, so the ground has
      // layered walls and a flat shaded floor instead of an even slope
      const can1 = x => -50 + Math.sin(x * .022) * 9 + Math.sin(x * .0075 + 2) * 7, can2 = x => -96 + Math.sin(x * .021 + 1) * 12;
      const canyon = (x, z) => { const w1 = 11 + 4 * Math.sin(x * .04), w2 = 9 + 3 * Math.sin(x * .05 + 3), far = K.sstep(-14, -26, z);
        return far * (9 * K.sstep(1, .5, Math.abs(z - can1(x)) / w1) + 7 * K.sstep(1, .5, Math.abs(z - can2(x)) / w2)); };
      // three stepped buttes beside the walkway: a landmark you can see the shape of, with four flat rock terraces
      const BUTTES = [[X + 32, -26, 9, 7], [X + 92, -40, 12, 9], [X + 150, -22, 6.5, 5]];
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, zFar: -215, nx: 220, nz: 84, height: (x, z) => { const n = K.fbm2(x * .03, z * .03, 4), far = K.sstep(-5, -22, z); let h = (n - .5) * 5 * far + Math.pow(Math.sin(x * .33 + n * 9 + z * .12) * .5 + .5, 2.2) * .8 * far * K.sstep(-60, -30, z);
          const m = K.fbm2(x * .021 + 7, z * .021 + 3, 3), mesa = K.sstep(.565, .6, m) * K.sstep(-20, -42, z) * K.sstep(-150, -110, z); h += mesa * (8 + m * 9 + K.noise2(x * .5, z * .5) * .5);
          for (const [bx, bz, br, bh] of BUTTES) { const d = Math.hypot(x - bx, (z - bz) * 1.35) / br; if (d < 1.25) h += bh * Math.min(1, Math.ceil(K.sstep(1.2, .35, d) * 4.2) / 4.2) * (.72 + .28 * K.noise2(x * .5, z * .5)); } // (four terraces)
          h -= canyon(x, z);
          const d = Math.hypot(x - mons[0], (z - mons[1]) * 1.6) / mons[2]; if (d < 1) h += mons[3] * Math.pow(1 - d, 1.2) * (1 - .3 * Math.exp(-d * d / .012)); return h; },
        color: (x, z, h, ny, o) => { // (stage 24) a layered ochre palette: banded walls, dark basalt, pale drift dust
          const n = K.fbm2(x * .5, z * .5, 3), big = K.fbm2(x * .028 + 3, z * .028 + 8, 3), steep = K.sstep(.94, .7, ny);
          const band = Math.sin(h * 2.4 + K.noise2(x * .05, z * .05) * 1.2) * .5 + .5, layer = K.sstep(.6, .96, Math.sin(h * 1.5 + big * 4) * .5 + .5);
          const drift = K.sstep(.62, .9, ny) * K.sstep(.42, .62, K.noise2(x * .06, z * .14)), can = canyon(x, z) / 9;
          K.ramp(['#8f3b20', '#c45a2e', '#e08c54', '#f2b684'], .22 + n * .4 + big * .24 + Math.min(.2, Math.max(0, h) * .018), o);
          o.lerp(K.col('#5e2a20'), K.sstep(.56, .44, big) * .55);                                            // dark basalt fields
          o.lerp(K.col('#f8dcb8'), drift * .55);                                                             // pale wind-blown dust
          o.lerp(K.col('#c96a3c'), layer * .3);                                                              // ochre layers across the dunes
          if (steep > .02) o.lerp(K.ramp(['#6e2a1a', '#e08a52', '#f6c89c', '#b8542e'], band, T3), steep * .9); // the banded canyon and butte walls
          o.lerp(K.col('#2e140e'), Math.min(.65, can * .4));                                                 // the deep canyon floor
          o.multiplyScalar((.74 + .32 * ny) * (.94 + .1 * K.noise2(x * .02, z * .4))); } });                  // (soft wind streaks)
      yield* rocks(80, { colors: ['#4a2a22', '#8f4a30', '#b8603a'], sharp: 1, s1: .7 }); yield* frontRocks(['#4a2a22', '#8f4a30'], 8, 1);
      // (stage 24) ROCK FIELDS: clusters of stacked, dust-capped boulders with a grit apron, so the rock field reads as
      // groups of shapes with contact shadows instead of an even scatter of stones
      for (let c = 0; c < 10; c++) { const cx = X + 6 + c * 33 + R(c + 600) * 14, cz = -6.6 - R(c + 610) * 22, n = 4 + (R(c + 620) * 4 | 0), sc = .62 + R(c + 630) * .7;
        for (let k = 0; k < n; k++) { const a = R(c * 7 + k, 0, 6.283), rr = R(c * 7 + k + .5) * sc * 2.2, sx = cx + Math.cos(a) * rr, sz = cz + Math.sin(a) * rr, s = sc * (.5 + R(c * 13 + k + .25) * .8), c0 = K.ramp(['#3a201a', '#7a3a26', '#b8603a'], R(c * 5 + k + .7), new THREE.Color());
          matte.put(K.rockGeo(c * 5 + k, 1, s < .5), sx, H(sx, sz) + s * (.3 + k * .12), sz, (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.72 + .35 * Math.max(0, ny)); o.lerp(T3.set('#f5d6b0'), Math.max(0, ny) * .42); }, [s, s * R(c + k, .7, 1), s], [R(k + c) * .5, R(k + c + 1) * 6.28, R(k + c + 2) * .4]); }
        for (let k = 0; k < 6; k++) { const a = R(c * 3 + k, 0, 6.283), rr = sc * (.8 + R(c * 3 + k + .5) * 2.4), s = .09 + R(k + c * 9) * .14, sx = cx + Math.cos(a) * rr, sz = cz + Math.sin(a) * rr; // (the grit apron)
          matte.put(K.rockGeo(c + k + 40, 1, 1), sx, H(sx, sz) + s * .25, sz, '#8a4a30', [s, s * .7, s]); }
        yield; }
      // (stage 24) DUST HAZE: three low wide sheets of fine dust stacked at different heights and drifting at different
      // speeds, so the far ground fades away in layers instead of ending on a hard line
      marsHazeMat ||= new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: .27, roughness: 1, metalness: 0, depthWrite: false });
      marsHazeGeo ||= new THREE.SphereGeometry(1, 8, 5);
      for (const [zz, yy, sc, n, tint, sp] of [[-20, 1.7, 1.4, 8, '#fbe0bc', .5], [-62, 3.8, 2.4, 7, '#f4cfa6', .85], [-120, 6.6, 4.2, 6, '#ecc49a', 1.25]]) {
        const sheet = () => model(b => { for (let k = 0; k < n; k++) { const x = X - 90 + k * (PW + 180) / (n - 1), z2 = zz + (R(k + 4 + zz) - .5) * 14 * sc, c0 = K.col('#fbe2c2').lerp(K.col(tint), R(k + 9 + zz) * .6);
          for (let q = 0; q < 2; q++) { const r = sc * (1.1 + R(k * 4 + q + zz) * .8);
            b.put(marsHazeGeo, x + (q - .5) * r * 1.4, R(k + q + zz) * r * .3, z2 + R(k + q + 2 + zz) * 4 * sc, (px, py, pz, nx, ny, nz, o2) => { o2.copy(c0).multiplyScalar(.8 + .26 * Math.max(0, ny)); }, [r * 2.6, r * .38, r * 1.6]); } } }, marsHazeMat, false);
        const m = add(sheet()); m.position.set(0, yy, zz); m.userData.dynamic = true; m.renderOrder = 2;
        const m2 = add(sheet()); m2.position.set(-(PW + 180), yy, zz); m2.userData.dynamic = true; m2.renderOrder = 2;
        U.push(dt => { for (const q of [m, m2]) { q.position.x += dt * sp; if (q.position.x > PW + 180) q.position.x -= (PW + 180) * 2; } }); }
      yield;
      tapIt(inSky(new THREE.Mesh(new THREE.SphereGeometry(30, 8, 6), new THREE.MeshBasicMaterial({ visible: false })), mons[0], 22, mons[1] + 40), () => fact('🌋 That\'s Olympus Mons: the biggest volcano in the whole solar system!', 'marsvolcano')); skies[id].pop(); // (an unseen tap target over the real mountain; it stays put)
      G.interact.push({ x: X + 78, y: 0, layer: 'space', disc: 'marsvolcano', run: () => fact('🌋 That\'s Olympus Mons: the biggest volcano in the whole solar system!', 'marsvolcano'), hintY: 2.4 });
      // the two little moons, Phobos and Deimos
      for (const [x, y, s, kk] of [[MID - 30, 20, 2.6, 2], [MID + 62, 24, 1.5, 4]]) { const m = inSky(model(b => b.put(K.rockGeo(kk), 0, 0, 0, (px, py, pz, nx, ny, nz, o) => { o.copy(K.col('#9a8878')).multiplyScalar(.7 + .5 * K.fbm3(px * 2, py * 2, pz * 2, 3)); }, [1.3, 1, 1]), K.paintMat(), false), x, y, -170); m.scale.setScalar(s); m.material = m.material.clone(); m.material.fog = false; U.push(dt => { m.rotation.y += dt * .1; }); }
      // the rover: six wheels that really turn, a deck of solar cells, a mast with camera "eyes", a dish and an arm
      const rv = new THREE.Group(); rv.position.set(X + 46, 0, -3); add(rv);
      const body = model(b => { b.put(K.roundBox(2.1, .42, 1.2, .1), 0, .86, 0, '#eef0f6'); b.put(K.roundBox(2.3, .06, 1.5, .02, 1), 0, 1.11, 0, '#20307a'); for (let k = -3; k <= 3; k++) b.put(K.geo.box(), k * .31, 1.145, 0, '#5a7cff', [.02, .02, 1.42]); for (const zz of [-.36, .36]) b.put(K.geo.box(), 0, 1.145, zz, '#5a7cff', [2.22, .02, .02]);
        b.put(K.geo.cyl(10), .72, 1.75, .25, '#d9dce6', [.05, 1.3, .05]); b.put(K.roundBox(.62, .3, .34, .08), .72, 2.5, .25, '#f6f7fb'); for (const s of [-1, 1]) { b.put(K.geo.cyl(14), .72 + s * .16, 2.5, .43, '#2b2b3a', [.1, .06, .1], [Math.PI / 2, 0, 0]); b.put(K.geo.sph(1), .72 + s * .16, 2.5, .465, '#6fd0ff', .06); }
        b.put(K.lathe([[0, 0], [.16, .02], [.34, .12], [.4, .24]], 14), -.75, 1.75, -.2, '#f2f4fa', 1, [.5, 0, .5]); b.put(K.geo.cyl(6), -.75, 1.45, -.2, '#c9cdd8', [.03, .6, .03]);
        b.put(K.geo.cyl(8), 1.25, .95, .35, '#c9cdd8', [.045, .8, .045], [0, 0, -1.1]); b.put(K.geo.cyl(8), 1.72, .9, .35, '#c9cdd8', [.04, .6, .04], [0, 0, .5]); b.put(K.geo.sph(1), 1.86, .64, .35, '#ffd23f', .09);
        for (const zz of [-.72, .72]) { b.put(K.geo.cyl(8), -.42, .55, zz, '#8a8fa0', [.05, 1.0, .05], [0, 0, 1.05]); b.put(K.geo.cyl(8), .45, .55, zz, '#8a8fa0', [.05, 1.0, .05], [0, 0, -1.05]); } });
      rv.add(body);
      const wheelG = (() => { const b = K.makeBatch(), tyre = new THREE.CylinderGeometry(.3, .3, .24, 18); tyre.rotateX(Math.PI / 2); b.add(tyre, null, '#33343f'); const hub = new THREE.CylinderGeometry(.14, .14, .26, 10); hub.rotateX(Math.PI / 2); b.add(hub, null, '#c9cdd8'); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; b.put(K.geo.box(), Math.cos(a) * .3, Math.sin(a) * .3, 0, '#1e1f28', [.1, .06, .26], [0, 0, a + Math.PI / 2]); } return b.geometry(); })();
      const wheels = []; for (const [x, z] of [[-.82, -.72], [0, -.72], [.82, -.72], [-.82, .72], [0, .72], [.82, .72]]) { const w = new THREE.Mesh(wheelG, K.shinyMat()); w.position.set(x, .33, z); w.castShadow = true; rv.add(w); wheels.push(w); } let drive = 0;
      tapIt(rv, () => { if (drive) return; drive = .001; Sound.tone(500, .3, 'square', .03, 1.4); fact('🤖 Beep beep! The rover drives across Mars to explore!', 'rover'); }, X + 46, 'rover');
      U.push((dt, t) => { body.position.y = drive ? Math.sin(t * 17) * .012 + Math.sin(t * 7.3) * .012 : 0; if (!drive) return; drive += dt; const back = drive >= 4.4, k = drive < 4 ? drive / 4 : drive < 4.4 ? 1 : drive < 8.4 ? 1 - (drive - 4.4) / 4 : 0, e = k * k * (3 - 2 * k), px = rv.position.x; rv.position.x = X + 46 + e * 12;
        const turn = drive < 4 ? 0 : Math.min(1, (drive - 4) / .4); rv.rotation.y = turn * Math.PI; const v = (rv.position.x - px) * (back ? -1 : 1); for (const w of wheels) w.rotation.z -= v / .3; // (the wheels turn exactly as far as it drives: no sliding)
        if (Math.abs(v) > .001 && Math.random() < dt * 9) api.burst(rv.position.x - (back ? -1 : 1), .2, -3, ['#c86a40', '#e89a6a'], 1, .8); if (drive > 8.8) { drive = 0; rv.rotation.y = 0; rv.position.x = X + 46; } });
      // the dust devil: a see-through twirling funnel of red dust
      const dd = new THREE.Group(); dd.position.set(X + 64, 0, -2.6); add(dd); const ddM = toy('#e0946a', { opacity: .34, r: 1 }); ddM.side = THREE.DoubleSide; ddM.depthWrite = false; const segs = [];
      for (let k = 0; k < 4; k++) { const fg2 = new THREE.CylinderGeometry(.34 + (k + 1) * .26, .34 + k * .26, .85, 16, 1, true), p = fg2.attributes.position; for (let q = 0; q < p.count; q++) p.setX(q, p.getX(q) * (1 + .12 * Math.sin(Math.atan2(p.getZ(q), p.getX(q)) * 3))); const s = new THREE.Mesh(fg2, ddM); s.position.y = .45 + k * .82; dd.add(s); segs.push(s); } let swirl = 0;
      tapIt(dd, () => { swirl = 4; Sound.noise && Sound.noise(1.2, 300, 900, .04); fact('🌪️ A dust devil! Twirly winds blow the red dust around on Mars.', 'dustdevil'); }, X + 64, 'dustdevil');
      U.push((dt, t) => { swirl = Math.max(0, swirl - dt); dd.position.x = X + 64 + Math.sin(t * .4) * 2; segs.forEach((s, k) => { s.rotation.y += dt * (2.2 + k * .6 + swirl * 5); s.position.x = Math.sin(t * 2.2 + k * .9) * .09 * (k + 1); s.position.z = Math.cos(t * 1.7 + k * .9) * .06 * (k + 1); }); dd.scale.setScalar(1 + Math.min(1, swirl) * .35); if (Math.random() < dt * (3 + swirl * 8)) api.burst(dd.position.x, .15, -2.6, ['#c86a40', '#e89a6a'], 1, 1.2); });
    }
    yield;
    if (gas) {
      // ---------- the gas giants: you walk on a soft deck of cloud, with hills of cloud, towers of cloud and drifting wisps ----------
      const BD = CLOUDS[id], amp = { jupiter: 1, saturn: .6, uranus: .34, neptune: .75 }[id];
      const bandAt = (x, z, o) => { const v = z * .085 + (K.fbm2(x * .028, z * .028, 3) - .5) * 5.5 + Math.sin(x * .045 + z * .02) * .7, t = ((v % BD.length) + BD.length) % BD.length, k = Math.floor(t); return o.copy(K.col(BD[k])).lerp(K.col(BD[(k + 1) % BD.length]), K.sstep(.25, .75, t - k)); };
      // (stage 28) the Great Dark Spot is painted on the deck beside the walkway, under its raised vortex (built below), so
      // the storm has both a wide dark reach on the banded deck and a shape that reads from the walking camera
      const spot = id === 'neptune' ? [X + 110, -9, 22, 8] : null;
      // (stage 28) the Great Dark Spot is painted onto the banded deck as well as the plain one: a deep navy oval with a
      // pale rim of drawn-out cloud, so the storm still reads now that Neptune's deck carries the shared band colours
      const spotPaint = spot ? (x, z, o) => { const d = Math.hypot((x - spot[0]) / spot[2], (z - spot[1]) / spot[3]);
        o.lerp(K.col('#0b1544'), K.sstep(1, .7, d) * .88); o.lerp(K.col('#eaf2ff'), K.sstep(.12, 0, Math.abs(d - 1.12)) * .72); } : null;
      // (stage 25-27) THE BANDED DECKS of Jupiter, Saturn and Uranus carry height as well as colour: pale zones and darker
      // belts, each with wind combs, whorls and small oval storms, and the deck rises into soft ridges along a zone and
      // sinks into a belt, so the clouds recede in real layers instead of lying flat. Saturn's belts are lower and softer,
      // and Uranus's are shallower and bluer still, so its deck stays the calm ice giant it is.
      const pal = id === 'jupiter' ? ['#fff3de', '#c3733e', '#f8e0ba', '#9e4c26', '#fdeed6', '#cf8a4a']
        : id === 'saturn' ? ['#fff8de', '#d8ac54', '#fbeec2', '#b98c3a', '#fdf3d0', '#d2a656']
        : id === 'uranus' ? ['#eafdfd', '#6fd2e2', '#cdf6f8', '#44b4cb', '#ddfbfb', '#8ee1ec']
        : id === 'neptune' ? ['#8fb0ff', '#2f4fd0', '#a8c4ff', '#2440b0', '#6f94ff', '#3a5cd8'] : null;
      const BS = id === 'jupiter' ? 1 : id === 'saturn' ? .8 : id === 'uranus' ? .62 : .9, BC = 1;                      // (height strength, contrast)
      const bandV = (x, z) => z * .1 + (K.fbm2(x * .019 + 1, z * .03, 3) - .5) * 7 + Math.sin(x * .042 + z * .015) * 1.2; // (a warped, wavy band coordinate)
      const bandH = (x, z) => { const w = (K.fbm2(x * .018 + 3, z * .03, 3) - .5) * 2, ridge = Math.pow(Math.sin(z * .12 + w * 2.6) * .5 + .5, 1.7), fine = Math.sin(z * .31 + w * 4 + x * .01) * .5 + .5, depth = .35 + .85 * K.sstep(-18, -60, z);
        const h = K.sstep(-11, -20, z) * depth * (ridge * 5.2 + fine * 1.1 + 1.2) * BS                                 // the ridges themselves
          + K.sstep(-30, -80, z) * (K.fbm2(x * .08, z * .12, 3) - .5) * 3 * BS                                           // lumpy cloud tops behind them
          + K.sstep(-52, -150, z) * Math.pow(K.fbm2(x * .02 + 5, z * .02, 3), 1.6) * (id === 'jupiter' ? 34 : id === 'saturn' ? 18 : id === 'uranus' ? 12 : 22); // the far deck, banked up
        // (stage 28) the calm plateau under the Great Dark Spot: inside its footprint the ridges are blended down to a
        // low flat shelf, so the storm sits in a calm clearing instead of being cut by a crest. The deck within 20 m of
        // the walkway is almost level already (a 24x7 pass moved 0.1 m and no pixel at all, a 42x20 one only a thin
        // crest line), so the clearing has to reach 70 m by 38 m back to where the ridge crests are 4-5 m tall, and it
        // is gated off within 7 m of the path, so the walkway itself is left exactly as flat as it was
        const q = spot ? Math.exp(-Math.pow((x - spot[0]) / 70, 2) - Math.pow((z - spot[1]) / 38, 2)) * K.sstep(-7, -13, z) : 0; // (only Neptune has a storm clearing; Jupiter, Saturn and Uranus keep the plain banded deck)
        return h * (1 - .92 * q) + .35 * q; };
      const bandCol = (x, z, h, ny, o) => {
        const v = bandV(x, z), t = ((v % 6) + 6) % 6, k = Math.floor(t);
        o.copy(K.col(pal[k])).lerp(K.col(pal[(k + 1) % 6]), K.sstep(.3, .7, t - k));                                    // crisp belt and zone edges
        const comb = K.sstep(.6, .82, K.noise2(x * .05, z * .34)), curl = K.sstep(.55, .8, K.noise2(x * .028 + 7, z * .06 + 2));
        o.lerp(K.col('#ffffff'), comb * .38 * BC); o.lerp(K.col(id === 'jupiter' ? '#8c3f1c' : id === 'saturn' ? '#a98a52' : id === 'uranus' ? '#4f9fb0' : '#1a3488'), curl * .2 * BC); // (white combs, darker curls)
        const ov = K.fbm2(x * .016 + 9, z * .05 + 4, 2);                                                                // small oval storms lying in the belts
        o.lerp(K.col(id === 'jupiter' ? '#7a2e12' : id === 'saturn' ? '#bd9a58' : id === 'uranus' ? '#3f93a6' : '#15296e'), K.sstep(.66, .9, ov) * .45 * BC); o.lerp(K.col(id === 'jupiter' || id === 'saturn' ? '#fff6dc' : id === 'uranus' ? '#e8ffff' : '#dbe8ff'), K.sstep(.9, .97, ov) * .42);
        o.multiplyScalar(.74 + .2 * ny + .12 * K.sstep(-1, 4, h)); }                                                    // (the ridges catch the light)
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, flatZ: id === 'jupiter' ? -11.5 : id === 'saturn' ? -11 : id === 'uranus' ? -10.5 : -11, blend: 6, nx: id === 'jupiter' ? 168 : id === 'saturn' || id === 'uranus' || id === 'neptune' ? 150 : 120, nz: id === 'jupiter' ? 62 : id === 'saturn' || id === 'uranus' || id === 'neptune' ? 58 : 50, height: pal ? bandH : (x, z) => { const n = K.fbm2(x * .055, z * .08, 4), b = Math.pow(K.noise2(x * .2 + 3, z * .24), 2); return amp * ((n - .35) * 4.2 + b * 1.5 + K.sstep(-45, -150, z) * Math.pow(K.fbm2(x * .02 + 5, z * .02, 3), 1.6) * (id === 'jupiter' || id === 'neptune' ? 46 : 20)); },
        color: (x, z, h, ny, o) => { if (pal) { bandCol(x, z, h, ny, o); if (spotPaint) spotPaint(x, z, o); return o; }
          bandAt(x, z, o); const streak = id === 'neptune' ? K.sstep(.66, .8, K.noise2(x * .035 + 2, z * .55)) : K.sstep(.7, .86, K.noise2(x * .05, z * .4)) * .4; o.lerp(K.col('#ffffff'), streak * .6);
          o.multiplyScalar(.78 + .16 * ny + .12 * K.sstep(-.5, 3 * amp, h)); } });
      // puffs of cloud heaped on the deck, and tall storm towers far away
      const puff = (batch, x, y, z, r, k, tint = 0) => { const c0 = bandAt(x, z, new THREE.Color()).lerp(K.col('#ffffff'), .25 + tint); batch.put(K.geo.sph(r > 5 ? 2 : 1), x, y, z, (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.74 + .3 * Math.max(0, ny)); }, [r * (1.1 + R(k) * .5), r * (.62 + R(k + 1) * .25), r]); };
      if (id === 'jupiter' || id === 'saturn' || id === 'uranus' || id === 'neptune') { // (stage 25-28) the cloud banks sit in band-aligned rows, wide and low
        // with gaps between them, so the zones and belts below show through and recede; every row behind is larger and lower
        const rows = id === 'jupiter' || id === 'neptune' ? 4 : 3, gapZ = id === 'jupiter' ? 12.5 : id === 'saturn' ? 14 : id === 'uranus' ? 15 : 13;
        let sd = 40;
        for (let row = 0; row < rows; row++) { const z0 = -16 - row * gapZ, n = 6 - row, sc0 = 1.05 + row * .42;
          for (let k = 0; k < n; k++) { const x = X - 24 + (k + .5) * (PW + 48) / n + R(sd++) * 8, z = z0 + (R(sd++) - .5) * 4.5, s = sc0 * (1 + R(sd++) * .55), c0 = bandAt(x, z, new THREE.Color()).lerp(K.col('#ffffff'), .3);
            for (let q = 0; q < 3; q++) { const bx = x + (q - 1) * s * 1.35, bz = z + (R(sd++) - .5) * s * .8, r = s * (.5 + R(sd++) * .3), by = H(bx, bz) + r * .22;             // (each dome sits on the deck, half buried, so no cloud floats)
              soft.put(K.geo.sph(1), bx, by, bz, (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.76 + .3 * Math.max(0, ny)); }, [r * 2.1, r * 1.1, r * 1.35]); } } }
      }
      yield;
    if (id === 'jupiter' || id === 'neptune') for (let k = 0; k < 5; k++) { const x = X - 60 + k * 56 + R(k + 30) * 20, z = -95 - R(k + 31) * 60, s = 7 + R(k + 32) * 5, y = H(x, z); for (let q = 0; q < 6; q++) { const up = q / 5; puff(soft, x + (R(k * 9 + q) - .5) * s * (1.8 - up), y + up * s * 2.6, z + (R(k * 9 + q + 3) - .5) * s, s * (1 - up * .35), k * 11 + q, up * .3); } for (let q = 0; q < 3; q++) puff(soft, x + (q - 1) * s * 1.3, y + s * 2.9, z, s * .9, k * 13 + q, .35); } // (a flat anvil top, like a real storm cloud)
      for (let k = 0; k < 6; k++) { const x = R(k + 400, X, X + 110), z = 4.8 + R(k + 401) * 1.6, s = .55 + R(k + 402) * .5; for (let q = 0; q < 3; q++) puff(soft, x + (q - 1) * s, -.1 + (q === 1 ? .25 : 0), z, s * (q === 1 ? 1 : .75), k * 3 + q, .1); }
      // wisps that really drift along in the wind: two layers, one mesh each
      const speed = { jupiter: 1.3, saturn: .8, uranus: .45, neptune: 5.5 }[id];
      // (stage 25/26: Jupiter's and Saturn's wisps sit lower and rounder, so they read as streaks lying on the deck)
      const lowWisp = id === 'jupiter' || id === 'saturn' || id === 'uranus' || id === 'neptune';
      for (const [zz, yy, n, sc, sp] of lowWisp ? [[-13, .16, 9, 1, 1], [-34, .42, 9, 2.4, .6]] : [[-13, .5, 9, 1, 1], [-34, 1.6, 9, 2.4, .6]]) { const span = 190, w = model(b => { for (let k = 0; k < n; k++) { const x = k / n * span + R(k + zz) * 8, z2 = (R(k + 1 + zz) - .5) * 9 * sc, c0 = new THREE.Color(BD[(k + 3) % BD.length]).lerp(K.col('#ffffff'), id === 'neptune' ? .85 : .5); for (let q = 0; q < 3; q++) b.put(K.geo.sph(1), x + (q - 1) * 1.5 * sc, R(k + q) * .3 * sc, z2, (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.78 + .28 * Math.max(0, ny)); }, [(id === 'neptune' ? 3.4 : 1.9) * sc * (q === 1 ? 1 : .7), (lowWisp ? .5 : .42) * sc * (q === 1 ? 1 : .7), .9 * sc]); } }, K.softMat(), false);
        w.position.set(X - 40, yy, zz); w.userData.dynamic = true; add(w); const w2 = w.clone(); w2.position.x = X - 40 - span; add(w2); U.push(dt => { for (const m of [w, w2]) { m.position.x += dt * speed * sp; if (m.position.x > X - 40 + span) m.position.x -= span * 2; } }); }
    }
    yield;
    if (id === 'jupiter') {
      // (stage 25) the Great Red Spot, as a layered whirl: a pale foam collar, a broad brick-red ring with spiral arms, a
      // bright inner ring and a dark eye, each raised into a shallow dome and turning at its own speed, so it reads as a
      // deep storm sunk into the cloud deck rather than a flat red patch
      const sp = new THREE.Group(); sp.position.set(X + 52, .04, -6.5); add(sp);
      const vortex = (r0, r1, seg, hf, cf) => { const g = new THREE.RingGeometry(r0, r1, 72, seg); g.rotateX(-Math.PI / 2);
        const p = g.attributes.position; for (let q = 0; q < p.count; q++) { const px = p.getX(q), pz = p.getZ(q), r = Math.hypot(px, pz), a = Math.atan2(pz, px);
          p.setY(q, hf(r) + .04 * Math.sin(a * 3 + r * 9)); } g.computeVertexNormals();                                          // (a shaped, faintly rippled surface)
        return model(b => b.add(g, null, (px, py, pz, nx, ny, nz, o) => cf(Math.hypot(px, pz), Math.atan2(pz, px), py, o)), K.softMat(), false); };
      const collar = vortex(1.34, 2.0, 4, r => .62 - (r - 1.34) * .5, (r, a, y, o) => { const n = K.noise2(Math.cos(a) * 5 + 3, Math.sin(a) * 5), f = Math.sin(a * 7 + r * 14) * .5 + .5;
        o.copy(K.col('#ffe9c6')).lerp(K.col('#ffffff'), K.sstep(.4, .9, n + f * .3) * .7); o.lerp(K.col('#d98f58'), K.sstep(.35, .1, n) * .45); }); // (a raised foam rampart)
      const arms = vortex(.5, 1.42, 8, r => .08 + (r - .5) * .5, (r, a, y, o) => { const s = Math.sin(a * 2 + r * 8 - .9) * .5 + .5, f2 = Math.sin(a * 6 - r * 13) * .5 + .5;
        K.ramp(['#701a0c', '#b5341a', '#e66232', '#ffa46c'], .14 + s * .48 + f2 * .16 + r * .08, o);                    // (two bright spiral arms wound through the red ring)
        o.lerp(K.col('#ffe4c4'), K.sstep(.9, 1, s) * .6); });                                                          // (pale cloud drawn out along the arms)
      const eye = vortex(.02, .54, 6, r => .05 + .02 * Math.sin(r * 12), (r, a, y, o) => { o.copy(K.col('#4a120c')).lerp(K.col('#7e2416'), Math.sin(a * 3 + r * 9) * .5 + .5);
        o.lerp(K.col('#f2d0a8'), K.sstep(.3, 0, Math.abs(r - .32)) * .5); });                                          // (a pale ring around the deep dark eye)
      sp.add(collar, arms, eye);
      // two raised spiral arms standing a little out of the bowl, so the swirl reads in silhouette as well as in colour
      const swirls = []; for (const [rr, th, arc, y0, col] of [[1.08, .13, Math.PI * 1.55, .3, '#ffe0bc'], [.8, .11, Math.PI * 1.35, .22, '#ff9c66']]) {
        const tg = new THREE.TorusGeometry(rr, th, 6, 26, arc); tg.rotateX(-Math.PI / 2);
        const sw = model(b => b.add(tg, null, col), K.softMat(), false); sw.position.y = y0; sp.add(sw); swirls.push(sw); }
      sp.scale.set(3.0, 1, 2.0); let spin = 0;
      // five small eddies trailing around the storm, spinning the other way
      const eddies = []; for (const [ea, er, es] of [[2.5, 2.05, .36], [2.9, 2.25, .28], [3.35, 1.95, .32], [3.75, 2.15, .24], [4.1, 1.85, .28]]) {
        const ed = vortex(.08, 1, 3, r => .05 * (1 - r), (r, a, y, o) => { o.copy(K.col('#c25630')).lerp(K.col('#f0a074'), Math.sin(a * 2 + r * 5) * .5 + .5);
          o.lerp(K.col('#f8e2c0'), K.sstep(.5, .9, Math.sin(a * 3) * .5 + .5) * .4); });
        ed.position.set(X + 52 + Math.cos(ea) * er * 3.0, .04, -6.5 + Math.sin(ea) * er * 2.0); ed.scale.setScalar(es); add(ed); eddies.push(ed); }
      tapIt(sp, () => { spin = 4; Sound.noise && Sound.noise(1.2, 200, 700, .05); fact('🌀 The Great Red Spot: a giant storm bigger than our whole Earth!', 'redspot'); }, X + 52, 'redspot');
      U.push((dt, t) => { spin = Math.max(0, spin - dt); const kk = 1 + Math.min(1, spin) * .07;
        arms.rotation.y -= dt * (.18 + spin * 2.6); eye.rotation.y += dt * (.3 + spin * 3.4); collar.rotation.y -= dt * (.11 + spin * 1.8);
        swirls[0].rotation.y -= dt * (.26 + spin * 2.2); swirls[1].rotation.y += dt * (.34 + spin * 2.8); swirls.forEach((sw, q) => { sw.position.y = (q ? .22 : .3) + Math.sin(t * 1.4 + q) * .04; });
        sp.scale.set(3.0 * kk, 1, 2.0 * kk); eddies.forEach((ed, q) => { ed.rotation.y += dt * (q % 2 ? -.5 : .5) * (.7 + spin); });
        if (spin > 0 && Math.random() < dt * 12) api.burst(X + 52 + (Math.random() - .5) * 6, .5, -6.5, ['#f2a078', '#fff0dc', '#d8573a'], 1, 1.5); });
      // the thunder cloud: dark and heavy, it bobs, and a jagged bolt flashes down from it
      const cg = new THREE.Group(); cg.position.set(X + 66, 6, -4); add(cg); cg.add(model(b => { for (const [x, y, z, r] of [[0, 0, 0, 1.25], [-1.2, -.15, .1, .95], [1.25, -.1, 0, 1.0], [-.5, .55, -.2, .9], [.6, .6, .1, .85], [0, -.35, .3, 1.0], [-1.9, -.3, 0, .6], [1.95, -.3, 0, .6]]) b.put(K.geo.sph(2), x, y, z, (px, py, pz, nx, ny, nz, o) => { o.copy(K.col('#6a5a7c')).multiplyScalar(.62 + .5 * Math.max(0, ny)); }, [r, r * .82, r * .9]); }, K.softMat(), false));
      const bolt = (() => { const s = new THREE.Shape(), pts = [[.1, 0], [.55, 0], [.12, -1.9], [.5, -1.9], [-.05, -3.9], [.28, -3.9], [-.35, -5.9], [-.1, -3.5], [-.42, -3.5], [-.02, -1.5], [-.4, -1.5]]; s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); const e = new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: false }); const m = new THREE.Mesh(e, toy('#fff6a0', { em: '#fff3a0', ei: 1.8 })); m.material.fog = false; return m; })(); bolt.position.set(0, -.4, .2); bolt.visible = false; cg.add(bolt); const bgl = K.glow('#fff3a0', 9, .0); bgl.position.set(0, -3, .1); cg.add(bgl); let zap = 0;
      tapIt(cg, () => { zap = .55; boost = calm() ? .15 : .8; Sound.noise && Sound.noise(.4, 2000, 200, .06); fact('⚡ Zap! Jupiter has huge lightning storms!', 'jupiterzap'); }, X + 66, 'jupiterzap');
      U.push((dt, t) => { cg.position.y = 6 + Math.sin(t * .9) * .18; if (zap > 0) { zap -= dt; bolt.visible = zap > 0 && (calm() || Math.sin(zap * 60) > -.3); bolt.scale.x = zap > .3 ? 1 : -1; bgl.material.opacity = Math.max(0, zap) * 1.2; if (zap <= 0) { bolt.visible = false; bgl.material.opacity = 0; api.burst(X + 66, .2, -3.8, ['#fff6a0', '#ffffff'], 6, 2); } } });
      // (stage 25) the four big moons, painted at twice the detail (a 256 map) and larger in the sky, so each one's own
      // surface reads: Io's sulphur blotches and dark volcanoes, Europa's rust-red cracks, Ganymede's bright patches,
      // Callisto's pale craters. Each hangs a little lower and turns slowly, showing its whole face as it goes
      const moons = []; for (const [kind, r, x, y] of [['io', 5.6, MID - 66, 40], ['europa', 4.8, MID - 24, 47], ['ganymede', 7.0, MID + 24, 42], ['callisto', 6.0, MID + 68, 49]]) moons.push(inSky((yield* K.skyBodySteps(kind, r, { size: 256 })), x, y, -125)); let counted = 0;
      moons.forEach((m, k) => { let b2 = 0; m.rotation.z = k % 2 ? .2 : -.16; m.material.emissiveMap = m.material.map; m.material.emissive.set('#ffffff'); m.material.emissiveIntensity = .5; // (a little of its own light, so the far side away from the sun still shows its surface)
        tapIt(m, () => { counted = counted % 4 + 1; b2 = 1; Sound.tone(500 + counted * 100, .15, 'sine', .05, 1.2); say(`🌕 ${['', 'One', 'Two', 'Three', 'Four'][counted]}!${counted === 4 ? ' Jupiter\'s four big moons!' : ''}`, true); disc('jupitermoons'); }, k === 0 ? X + 34 : null, k === 0 ? 'jupitermoons' : null); U.push(dt => { b2 = Math.max(0, b2 - dt * 2); m.scale.setScalar(1 + Math.sin(b2 * 9) * b2 * .3); m.rotation.y += dt * .09; }); });
    }
    yield;
    if (id === 'saturn') {
      // the rings: a giant shining arch of ice across the whole sky, with the dark gap in it
      const ringTex = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 8; const c = cv.getContext('2d');
        for (let x = 0; x < 1024; x++) { const u = x / 1023, n = K.noise2(u * 90, 1) * .5 + K.noise2(u * 26, 3) * .34 + K.noise2(u * 300, 7) * .16, fine = Math.sin(u * 430) * .5 + .5;
          let a = (.34 + n * .66) * K.sstep(0, .04, u) * K.sstep(1, .955, u);
          if (u > .665 && u < .735) a *= .06;                                                                         // (the Cassini division: nearly empty)
          if (u > .845 && u < .858) a *= .16;                                                                          // (the Encke gap: one thin dark lane)
          if (u < .3) a *= .55;                                                                                        // (the faint inner C ring)
          if (u > .95) a *= .45;                                                                                       // (the thin outer F ring)
          a *= .8 + fine * .2;                                                                                         // (fine ringlets, a pixel wide)
          const v = 202 + n * 52 + fine * 10; c.fillStyle = `rgba(${v | 0},${(v * .97) | 0},${(v * .86) | 0},${a.toFixed(3)})`; c.fillRect(x, 0, 1, 8); }
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
      (g.userData.ownedTextures ||= []).push(ringTex);
      // (stage 26) four separate 220-segment annuli instead of one 128-segment disc, so the divisions between the bands
      // are real open sky rather than painted alpha: the faint C ring, the bright B ring, the A ring with its Encke gap,
      // and the thin F ring outside them
      let ringB = null;
      for (const [r0, r1, op] of [[190, 226, .55], [231, 272, 1], [279, 301, .85], [306, 310, .45]]) {
        const rq = new THREE.RingGeometry(r0, r1, 220, 2); { const p = rq.attributes.position, uv = rq.attributes.uv;
          for (let q = 0; q < p.count; q++) uv.setXY(q, (Math.hypot(p.getX(q), p.getY(q)) - 190) / 120, .5); }
        const rm = inSky(new THREE.Mesh(rq, new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, fog: false })), MID + 20, -168, -330);
        rm.rotation.set(-.2, 0, .1); rm.renderOrder = -5; if (r0 === 231) ringB = rm;
      }
      tapIt(ringB, () => fact('💍 Saturn\'s rings are made of millions of pieces of ice and rock!', 'saturnrings')); G.interact.push({ x: X + 30, y: 0, layer: 'space', disc: 'saturnrings', run: () => fact('💍 Saturn\'s rings are made of millions of pieces of ice and rock!', 'saturnrings'), hintY: 3 });
      inSky((yield* K.skyBodySteps('titan', 3.4, { size: 128 })), MID - 46, 15, -165); inSky(K.glow('#ffb050', 13, .3), MID - 46, 15, -168); inSky((yield* K.skyBodySteps('grey', 1.3, { size: 128 })), MID + 60, 11, -165);
      // five lumps of ring ice to hop along: clear, sparkling crystals that slowly turn
      const iceM = K.shinyMat(); let hops = 0;
      for (let k = 0; k < 5; k++) { const x = X + 38 + k * 2.6, y = .6 + (k % 2) * .5, ice = model(b => { b.put(K.rockGeo(k + 1, 1), 0, 0, 0, (px, py, pz, nx, ny, nz, o) => { K.ramp(['#9fdcff', '#e6f6ff', '#ffffff'], .5 + ny * .4 + nx * .2, o); }, [.62, .5, .58]); b.put(K.rockGeo(k + 2, 1), .1, .42, 0, '#f4fcff', [.3, .34, .3]); }, iceM); ice.position.set(x, y, -1.2); add(ice); G.platforms.push({ a: x - .5, b: x + .5, y: 1.1 + (k % 2) * .5, layer: 'space', z: -1.2 }); let ping = 0;
        tapIt(ice, () => { hops++; ping = 1; Sound.tone(800 + k * 100, .1, 'triangle', .04, 1.3); api.burst(x, y + .5, -1.2, ['#ffffff', '#cfefff'], 5, 1.6); say(`🧊 Ice from Saturn's rings! ${['', 'One', 'Two', 'Three', 'Four', 'Five'][Math.min(5, k + 1)]}!`, true); disc('saturnice'); }, k === 0 ? x : null, k === 0 ? 'saturnice' : null);
        U.push((dt, t) => { ice.rotation.y += dt * (.6 + ping * 6); ping = Math.max(0, ping - dt * 1.5); ice.scale.setScalar(1 + Math.sin(ping * 10) * ping * .2); }); }
      // (stage 26) the six-sided storm: a stepped hexagonal vortex with real walls - five bands, each turning against the
      // one outside it - foam caps on the corners and a dark eye in the middle, so it reads as a storm from the path
      const hx = new THREE.Group(); hx.position.set(X + 62, .04, -5.2); add(hx); const hexes = [];
      const HT = [[4.0, .58, '#ffeec2'], [3.3, .52, '#b98a3c'], [2.7, .46, '#f6dc9c'], [2.15, .42, '#a97b30'], [1.65, .38, '#e6c478']];
      let hy = 0;
      for (let k = 0; k < HT.length; k++) { const [r, hh, col] = HT[k], top = r * .82;
        const m = model(b => { b.add(new THREE.CylinderGeometry(top, r, hh, 6, 1, false), null, (px, py, pz, nx, ny, nz, o) => {
          const a = Math.atan2(pz, px), band = Math.sin(a * 3 + py * 14) * .5 + .5;                                  // (banded sides, so the walls read)
          o.copy(K.col(col)).lerp(K.col('#fff3cc'), Math.max(0, ny) * .32 + band * .16); o.multiplyScalar(.8 + .24 * Math.max(0, ny)); });
          { const skirt = new THREE.CylinderGeometry(r * 1.03, r * 1.03, .08, 6, 1, true); skirt.translate(0, -hh * .5 + .04, 0); b.add(skirt, null, '#7c5c2c'); } // (a dark skirt at each step, so the tiers read apart)
          for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3 + Math.PI / 6; b.put(K.geo.sph(1), Math.cos(a) * top * .96, hh * .5, Math.sin(a) * top * .96, '#fff8e0', [r * .2, .13, r * .15], [0, -a, 0]); } }, K.softMat(), false); // (foam caps on the corners)
        m.position.y = hy + hh * .5; hy += hh * .94; hx.add(m); hexes.push(m); }
      { const eye = model(b => b.add(new THREE.CylinderGeometry(.42, .78, .5, 6, 1, false), null, (px, py, pz, nx, ny, nz, o) => { o.copy(K.col('#6e6048')).lerp(K.col('#241f1a'), Math.max(0, 1 - ny) * .9); }), K.softMat(), false);
        eye.position.y = hy + .16; hx.add(eye); }                                                                    // (the dark eye of the storm, above the stepped walls)
      let hs = 0;
      tapIt(hx, () => { hs = 4; Sound.noise && Sound.noise(1, 250, 800, .04); fact('⬡ A six-sided storm! Saturn has a hexagon-shaped storm at its top.', 'saturnhex'); }, X + 62, 'saturnhex');
      U.push(dt => { hs = Math.max(0, hs - dt); hexes.forEach((m, k) => { m.rotation.y += dt * (k % 2 ? -1 : 1) * (.18 + k * .07 + hs * 1.2); }); });
    }
    yield;
    if (id === 'uranus') {
      // tall ice-diamond spires standing in the mist
      for (let k = 0; k < 16; k++) { const x = R(k + 90, X - 20, X + 130), z = -8 - Math.pow(R(k + 91), 1.4) * 60, s = (.5 + R(k + 92) * 1.1) * (1 + (-z) * .035), y = H(x, z), c0 = K.ramp(['#8fe8f2', '#e6ffff', '#ffffff'], R(k + 93), new THREE.Color()); const dia = new THREE.OctahedronGeometry(1, 0); dia.computeVertexNormals(); dia.deleteAttribute('uv');
        for (let q = 0; q < 3; q++) props.put(dia, x + (q - 1) * s * .8, y + s * (q === 1 ? 1.9 : 1.1), z + (q === 1 ? 0 : .4 * s), (px, py, pz, nx, ny, nz, o) => { o.copy(c0).multiplyScalar(.7 + .4 * Math.max(0, nx * -.5 + ny * .6 + nz * .5)); }, [s * (q === 1 ? .6 : .4), s * (q === 1 ? 2.2 : 1.3), s * (q === 1 ? .6 : .4)], [0, R(k + q) * 3, (q - 1) * .25]); }
      // (stage 27) the rings stand upright in the sky, because Uranus is tipped right over on its side, and they are EIGHT
      // narrow annuli rather than one painted disc: rings 6, 5, 4, alpha, beta, gamma, delta and the wide epsilon ring,
      // so every gap between them is real open sky, over a 1024-px strip of ringlet grain. The wide, bright epsilon ring
      // is the tap target.
      const ringTex = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 8; const c = cv.getContext('2d');
        for (let x = 0; x < 1024; x++) { const u = x / 1023, n = K.noise2(u * 70, 5) * .5 + K.noise2(u * 210, 9) * .32 + K.noise2(u * 640, 3) * .18, fine = Math.sin(u * 520) * .5 + .5;
          const a = (.5 + n * .5) * K.sstep(0, .035, u) * K.sstep(1, .965, u) * (.72 + fine * .28);                    // (grain across each ring, fading at both edges)
          const v = 210 + n * 40 + fine * 8; c.fillStyle = `rgba(${v | 0},${(v * .99) | 0},${(v * .97) | 0},${a.toFixed(3)})`; c.fillRect(x, 0, 1, 8); }
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
      (g.userData.ownedTextures ||= []).push(ringTex);
      let ringEps = null;
      for (const [r0, r1, op] of [[171.2, 171.8, .34], [173.4, 173.9, .3], [175.6, 176.4, .42], [179, 180.2, .52], [182.6, 184.2, .72], [187.6, 188.2, .46], [190.5, 191.6, .58], [197, 204, .92]]) {
        const rq = new THREE.RingGeometry(r0, r1, 200, 1);                                                            // (each ring maps the grain across its own width)
        const rm = inSky(new THREE.Mesh(rq, new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, fog: false })), MID - 4, -40, -330);
        rm.rotation.set(0, .98, .12); rm.renderOrder = -5; if (r0 === 197) ringEps = rm;
      }
      tapIt(ringEps, () => fact('💍 Uranus has 13 narrow rings, and it spins tipped over on its side!', 'uranusrings'), X + 34, 'uranusrings');
      inSky((yield* K.skyBodySteps('miranda', 2.6, { size: 128 })), MID + 44, 14, -160); inSky((yield* K.skyBodySteps('grey', 1.6, { size: 128 })), MID - 52, 18, -160);
      // the rolling planet toy: a striped ball with its own ring, tipped on its side
      const roll = new THREE.Group(); roll.position.set(X + 44, .75, -2); add(roll); roll.add(model(b => { b.put(K.geo.sph(), 0, 0, 0, (px, py, pz, nx, ny, nz, o) => { K.ramp(['#6fd8e0', '#b8f4f4', '#8fe4ea', '#d8fcfc', '#7fdce4'], pz * .65 + .5, o); }, .75); const rg = new THREE.RingGeometry(.95, 1.3, 40, 1); b.add(rg, null, '#ffffff'); const rg2 = rg.clone(); rg2.rotateY(Math.PI); b.add(rg2, null, '#e6ffff'); for (const s of [-1, 1]) b.put(K.geo.sph(1), 0, 0, s * .76, '#ffd23f', .09); })); let rv2 = 0;
      tapIt(roll, () => { rv2 = 6; Sound.boing(); fact('🎳 Uranus spins tipped over on its side, so it rolls like a ball!', 'uranusroll'); }, X + 44, 'uranusroll');
      U.push((dt, t) => { if (rv2 > 0) { rv2 = Math.max(0, rv2 - dt * 1.2); const nx2 = Math.min(X + 90, roll.position.x + rv2 * dt), d = nx2 - roll.position.x; roll.position.x = nx2; roll.rotation.z -= d / .75; } else if (roll.position.x > X + 44.01) { const d = Math.min(dt * 3, roll.position.x - (X + 44)); roll.position.x -= d; roll.rotation.z += d / .75; } }); // (it rolls back home afterwards, turning exactly as far as it travels)
      // the diamond cloud: tap it and sparkling diamonds rain down
      const dcg = new THREE.Group(); dcg.position.set(X + 62, 6, -3); add(dcg); dcg.add(model(b => { for (const [x, y, z, r] of [[0, 0, 0, 1.2], [-1.15, -.12, 0, .9], [1.2, -.1, 0, .95], [-.45, .5, -.1, .85], [.55, .55, .1, .8], [0, -.3, .3, .95]]) b.put(K.geo.sph(2), x, y, z, (px, py, pz, nx, ny, nz, o) => { o.copy(K.col('#e2fdfd')).multiplyScalar(.72 + .32 * Math.max(0, ny)); }, [r, r * .8, r * .9]); }, K.softMat(), false));
      const gemG = new THREE.OctahedronGeometry(.16, 0), gemM = toy('#eaffff', { r: .05, cc: 1, em: '#9fe8ff', ei: .5 }), gems = []; for (let k = 0; k < 10; k++) { const m = mesh(gemG, gemM, X + 62, 5, -3); m.visible = false; m.scale.y = 1.4; gems.push(m); } let rain = 0, drop = 0;
      tapIt(dcg, () => { rain = 3.2; Sound.twinkle ? Sound.twinkle() : Sound.chime(); fact('💎 Sparkle! Scientists think it might rain diamonds deep inside Uranus!', 'diamondrain'); }, X + 62, 'diamondrain');
      U.push((dt, t) => { dcg.position.y = 6 + Math.sin(t * .8) * .16; dcg.scale.setScalar(1 + (rain > 2.8 ? Math.sin((3.2 - rain) * 16) * .08 : 0)); if (rain > 0) { rain -= dt; drop -= dt; if (drop <= 0) { drop = .16; const m = gems.find(q => !q.visible); if (m) { m.visible = true; m.position.set(X + 60.6 + Math.random() * 2.8, 5.2, -3 + (Math.random() - .5)); m.userData.v = 0; } } }
        for (const m of gems) if (m.visible) { m.userData.v += 9 * dt; m.position.y -= m.userData.v * dt; m.rotation.y += dt * 7; if (m.position.y < .15) { m.visible = false; api.burst(m.position.x, .2, m.position.z, ['#ffffff', '#cfefff', '#9fe8ff'], 3, 1.4); Sound.tone && Math.random() < .5 && Sound.tone(1400 + Math.random() * 600, .06, 'sine', .02, 1.2); } } });
    }
    yield;
    if (id === 'neptune') {
      // (stage 28) THE GREAT DARK SPOT, raised out of the deck beside the walkway: a pale collar of drawn-out cloud around a
      // deep navy bowl with a dark eye, each turn at its own speed. A painted oval alone is invisible at walking height - it
      // is seen almost edge-on - so the storm needs a shape that stands up, the way Jupiter's red spot does.
      const spn = new THREE.Group(); spn.position.set(X + 110, .04, -6.2); add(spn);
      const ringG = (r0, r1, seg, hf, cf) => { const g = new THREE.RingGeometry(r0, r1, 72, seg); g.rotateX(-Math.PI / 2);
        const p = g.attributes.position; for (let q = 0; q < p.count; q++) { const px = p.getX(q), pz = p.getZ(q), r = Math.hypot(px, pz), a = Math.atan2(pz, px);
          p.setY(q, hf(r) + .03 * Math.sin(a * 4 + r * 7)); } g.computeVertexNormals();                                 // (a faintly rippled, shaped surface)
        return model(b => b.add(g, null, (px, py, pz, nx, ny, nz, o) => cf(Math.hypot(px, pz), Math.atan2(pz, px), py, o)), K.softMat(), false); };
      const collar = ringG(1.12, 1.4, 3, r => .56 - (r - 1.12) * 1.9, (r, a, y, o) => { const n = K.noise2(Math.cos(a) * 5 + 2, Math.sin(a) * 5);
        o.copy(K.col('#cfe4ff')).lerp(K.col('#ffffff'), K.sstep(.45, .92, n) * .55); o.lerp(K.col('#7fa4ff'), K.sstep(.5, .12, n) * .55); }); // (a thin pale rampart)
      // three stepped rings, each one lower and darker than the one outside it, with the cloud drawn out into two spiral
      // arms and the inner wall of every step in shadow: the storm reads as a funnel instead of a dark puddle
      const steps = [];
      for (const [r0, r1, h0, h1, cols] of [[.88, 1.12, .34, .2, ['#1d4490', '#2f62b4']], [.6, .88, .19, .13, ['#102463', '#1d4490']], [.3, .6, .12, .08, ['#071030', '#102463']]]) {
        steps.push(ringG(r0, r1, 3, r => h1 + (h0 - h1) * (r1 - r) / (r1 - r0), (r, a, y, o) => {
          const sp = Math.sin(a * 2 + r * 9) * .5 + .5;
          K.ramp(cols, .2 + sp * .55, o); o.lerp(K.col('#cfe4ff'), K.sstep(.88, .99, sp) * .34);
          o.lerp(K.col('#050a20'), K.sstep(.09, 0, y) * .4); }));
      }
      const eye = ringG(.02, .3, 4, () => .03, (r, a, y, o) => { o.copy(K.col('#04081c')).lerp(K.col('#0a1a4a'), r * .8); });
      spn.add(collar, ...steps, eye); spn.scale.set(4.2, 1, 2.9); let spin = 0;
      // two pale spiral arms standing out of the bowl, so the swirl reads in silhouette from walking height as well as in colour
      const arms = []; for (const [rr, th, arc, y0, col] of [[.95, .075, Math.PI * 1.7, .34, '#f2f8ff'], [.64, .06, Math.PI * 1.45, .24, '#bcd2ff']]) {
        const tg = new THREE.TorusGeometry(rr, th, 6, 30, arc); tg.rotateX(-Math.PI / 2);
        const sw = model(b => b.add(tg, null, col), K.softMat(), false); sw.position.y = y0; spn.add(sw); arms.push(sw); }
      tapIt(spn, () => { spin = 4; Sound.noise && Sound.noise(1.2, 180, 620, .05); fact('🌀 The Great Dark Spot! A storm as wide as our whole Earth.', 'greatdarkspot'); }, X + 110, 'greatdarkspot');
      U.push((dt, t) => { spin = Math.max(0, spin - dt); collar.rotation.y += dt * (.1 + spin * 1.6);
        steps.forEach((s, k) => { s.rotation.y += dt * (k % 2 ? -.2 : .2) * (1 + spin * 2); });
        eye.rotation.y -= dt * (.3 + spin * 3); spn.position.y = .04 + Math.sin(t * .5) * .03;
        arms[0].rotation.y -= dt * (.24 + spin * 2.2); arms[1].rotation.y += dt * (.32 + spin * 2.6); arms.forEach((a2, q) => { a2.position.y = (q ? .24 : .34) + Math.sin(t * 1.3 + q) * .03; });
        if (spin > 0 && Math.random() < dt * 10) api.burst(X + 110 + (Math.random() - .5) * 7, .5, -7, ['#8fb0ff', '#eaf2ff', '#2f62b4'], 1, 1.4); });
      const tr = inSky((yield* K.skyBodySteps('triton', 8.5, { size: 256 })), MID - 30, 38, -175); U.push(dt => { tr.rotation.y += dt * .02; });
      // the windsock: a striped sock on a pole that streams out and flaps in the wind
      const sock = new THREE.Group(); sock.position.set(X + 44, 0, -2.4); add(sock); sock.add(model(b => { b.put(K.lathe([[0, .16], [.2, .14], [.3, 0], [0, 0]], 14), 0, 0, 0, '#8a8fa0'); b.put(K.geo.cyl(10), 0, 1.3, 0, '#f2f4fa', [.05, 2.6, .05]); b.put(K.geo.torus(.12, 16), .12, 2.5, 0, '#ffd23f', [.34, .34, .34], [0, Math.PI / 2, 0]); }));
      const links = []; let par = sock; for (let k = 0; k < 5; k++) { const lg = new THREE.Group(); lg.position.set(k ? .46 : .14, k ? 0 : 2.5, 0); par.add(lg); const r0 = .33 - k * .045, r1 = .33 - (k + 1) * .045, sg2 = new THREE.CylinderGeometry(r1, r0, .46, 14, 1, true); sg2.rotateZ(-Math.PI / 2); sg2.translate(.23, 0, 0); const m = new THREE.Mesh(sg2, toy(k % 2 ? '#ffffff' : '#ff7a2a', { r: .7 })); m.material.side = THREE.DoubleSide; lg.add(m); links.push(lg); par = lg; } let gust = 0;
      tapIt(sock, () => { gust = 3; Sound.noise && Sound.noise(1.5, 300, 1200, .05); fact('💨 Whoosh! Neptune has the fastest winds of any planet!', 'neptunewind'); }, X + 44, 'neptunewind');
      U.push((dt, t) => { links.forEach((l, k) => { l.rotation.z = (k ? 0 : -.1) + Math.sin(t * (7 + gust * 3) - k * .9) * (.07 + k * .02) - (k ? .05 : .22) * (1 - Math.min(1, .55 + gust)); l.rotation.y = Math.sin(t * 5 - k * 1.1) * .06; });
        if (gust > 0) { gust -= dt; if (P.grounded) P.x = Math.min(X + PW - 2, P.x + dt * 2.5); if (Math.random() < dt * 20) api.burst(P.x - 3, 1 + Math.random() * 2, 0, ['#ffffff', '#cfe0ff'], 1, 2); } });
      // the icy geyser: a cracked mound of pinkish ice with a vent; tap it and a tall plume shoots up
      const gx = X + 64, gz = -3, gy = new THREE.Group(); gy.position.set(gx, 0, gz); add(gy); gy.add(model(b => { b.put(K.lathe([[0, .62], [.2, .66], [.34, .6], [.6, .36], [1.0, .14], [1.35, 0]], 20), 0, 0, 0, (px, py, pz, nx, ny, nz, o) => { K.ramp(['#f2d6d6', '#e6f2ff', '#ffffff'], K.fbm3(px * 2, py * 2, pz * 2, 3) + py * .4, o); }); b.put(K.geo.cyl(12), 0, .62, 0, '#3a4a78', [.17, .06, .17]); for (let k = 0; k < 6; k++) b.put(K.rockGeo(k, 1), Math.cos(k * 1.1) * 1.25, .12, Math.sin(k * 1.1) * 1.0, k % 2 ? '#e6f2ff' : '#f2d6d6', [.22, .3, .22]); }));
      const plG = new THREE.CylinderGeometry(.5, .13, 1, 14, 1, true); plG.translate(0, .5, 0); const plume = new THREE.Mesh(plG, toy('#eaf6ff', { opacity: .42, r: 1 })); plume.material.depthWrite = false; plume.material.side = THREE.DoubleSide; plume.position.y = .64; plume.visible = false; gy.add(plume); let spout = 0;
      tapIt(gy, () => { spout = 3; Sound.noise && Sound.noise(1, 600, 2400, .04); fact('⛲ An icy geyser! On Neptune\'s moon Triton, icy fountains shoot up.', 'triton'); }, gx, 'triton');
      U.push((dt, t) => { if (spout > 0) { spout -= dt; const k = Math.min(1, (3 - spout) * 3) * Math.min(1, spout * 2.5); plume.visible = true; plume.scale.set(1 + Math.sin(t * 20) * .08, k * (5 + Math.sin(t * 13) * .4), 1 + Math.cos(t * 17) * .08); if (Math.random() < dt * 30) api.burst(gx + (Math.random() - .5) * .5, .7 + k * (3 + Math.random() * 2.4), gz, ['#ffffff', '#cfefff'], 2, 1.5); } else if (plume.visible) plume.visible = false; else if (Math.random() < dt * .8) api.burst(gx, .7, gz, ['#ffffff', '#e6f2ff'], 1, .5); }); // (a little puff of steam now and then, so you can see it is alive)
    }
    yield;
    if (id === 'pluto') {
      const hc = X + 44, face = (x, z) => Math.min(10, Math.max(0, (-41 - z) * .72)) * Math.exp(-Math.pow((x - hc) / 21, 4)); // the broad smooth mountain face that carries the heart
      // (stage 29) THE HEART PLAIN: the heart-shaped basin of nitrogen ice (Pluto's Sputnik Planitia) is cut about 4.5 m
      // into the crust and ringed by a raised tholin rim, with ice mountains standing beyond it, so the plain has edges and
      // depth the walking camera can see instead of being a flat painted patch. The depth is gated off within 8 m of the
      // walkway, and the terrain grid carries it at nx 208 / nz 82, about 2 m columns where you walk.
      // (stage 30) the plain's outline is the SAME bezier heart as the ice glacier, sampled once and measured with a signed
      // distance: the implicit heart curve I first used came out as a plain oval from above, so the basin never read as a
      // heart. It stands in open ground at x 205 so nothing else sits in the basin, and the walkway keeps its own flat strip.
      const PX = X + 205, PZ = -34, PRX = 30, PRZ = 28;
      const HP = (() => { const s = new THREE.Shape(); s.moveTo(0, -1); s.bezierCurveTo(-1.75, .15, -1.15, 1.35, 0, .62); s.bezierCurveTo(1.15, 1.35, 1.75, .15, 0, -1);
        return s.getPoints(64).map(p => [p.x, p.y]); })();
      const heartSD = (x, z) => { const u = (x - PX) / PRX, v = -(z - PZ) / PRZ;                                  // metres outside the outline
        let best = 1e9, inside = false;
        for (let i = 0, j = HP.length - 1; i < HP.length; j = i++) {
          const xi = HP[i][0], yi = HP[i][1], xj = HP[j][0], yj = HP[j][1], ex = xj - xi, ey = yj - yi;
          const t = Math.max(0, Math.min(1, ((u - xi) * ex + (v - yi) * ey) / (ex * ex + ey * ey || 1e-9)));
          const dx = u - (xi + ex * t), dy = v - (yi + ey * t);
          best = Math.min(best, dx * dx + dy * dy);
          if ((yi > v) !== (yj > v) && u < ex * (v - yi) / (ey || 1e-9) + xi) inside = !inside; }
        return (inside ? -1 : 1) * Math.sqrt(best) * PRZ; };
      const plain = (x, z) => { const sd = heartSD(x, z);
        return -6.2 * K.sstep(1.4, -1.4, sd) + 3.2 * K.sstep(3.6, .6, Math.abs(sd)); };                          // (a bowl with a banked rim)
      const MTS = [[PX - 58, -92, 32, 11], [PX + 2, -104, 38, 14], [PX + 56, -90, 29, 10]];                     // (the ice mountains beyond the plain)
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, nx: 208, nz: 82, height: (x, z) => { const fm = Math.exp(-Math.pow((x - hc) / 26, 4)) * K.sstep(-34, -42, z); const jag = K.sstep(-20, -52, z) * Math.pow(K.ridge2(x * .03 + 2, z * .03, 4), 2.2) * 30;
          let h = (K.fbm2(x * .06, z * .06, 4) - .5) * 3 + jag * (1 - fm) + face(x, z) + K.sstep(-70, -150, z) * 10 * fm;
          h += plain(x, z) * (1 - fm);
          for (const [mx, mz, mr, mh] of MTS) { const d = Math.hypot((x - mx) / mr, (z - mz) / (mr * .85)); if (d < 1.4) h += mh * Math.pow(Math.max(0, 1 - d), 1.35) * (.52 + .62 * Math.pow(K.ridge2(x * .062, z * .062, 3), 1.4)); } // (angular ice peaks, not smooth drifts)
          return h; },
        color: (x, z, h, ny, o) => { // (stage 29) a layered surface: tholin-stained crust, frost strata stacked by height on
          const n = K.fbm2(x * .5, z * .5, 3), dark = K.sstep(.52, .42, K.fbm2(x * .02 + 6, z * .02 + 1, 3)), big = K.fbm2(x * .028 + 4, z * .028 + 9, 3);
          const strata = Math.sin(h * 2.2 + (K.noise2(x * .07, z * .07) - .5) * 2.4) * .5 + .5;                 // every frost layer the scarps expose
          const icy = K.sstep(6.5, 15, h + n * 3) * K.sstep(.4, .78, ny + n * .2);                                // bright ice on the high ground
          const crev = K.sstep(.56, .84, K.ridge2(x * .1 + 2, z * .1, 2));                                        // crevasse shadows in the ice
          const sd = heartSD(x, z), inPlain = K.sstep(1.4, -1.4, sd);
          const cell = K.sstep(.56, .82, K.ridge2(x * .085, z * .085, 2)), thaw = K.sstep(.5, .88, K.noise2(x * .06 + 3, z * .06));
          K.ramp(['#8f6a58', '#c39a80', '#e8cfb8'], .18 + n * .55 + big * .22, o);                                // tholin-stained crust
          o.lerp(K.col('#6a4438'), dark * .5);
          o.lerp(K.col('#7a4a3c'), strata * K.sstep(.93, .66, ny) * .5);                                          // stacked strata on the scarps
          o.lerp(K.col('#dfe9f6'), inPlain * (.72 + thaw * .18));                                                 // the nitrogen-ice plain floor
          o.lerp(K.col('#f7fbff'), inPlain * cell * .5);                                                          // bright polygon centres
          o.lerp(K.col('#93827c'), inPlain * (1 - cell) * .34);                                                   // dark tholin lanes between them
          o.lerp(K.col('#a8896f'), K.sstep(3.6, .6, Math.abs(sd)) * .6);                                           // the raised tholin rim around the plain
          o.lerp(K.col('#5e4232'), K.sstep(1.5, .2, Math.abs(sd)) * .45);                                          // a dark tholin edge along the outline
          o.lerp(K.ramp(['#bcd4f2', '#f4f8ff'], n, T3), icy * .9);
          o.lerp(K.col('#6a5040'), icy * crev * .42);                                                             // dark crevasses and rock showing through
          const lane = K.sstep(1, 0, Math.hypot((x - (X + 44.5)) / 7.6, (z + .6) / 3.9)); if (lane > 0) { const cell = K.sstep(.42, .5, Math.abs(K.noise2(x * .7, z * .7) - .5) * 2 + .3); o.lerp(K.ramp(['#cfe2f6', '#ffffff'], cell, T3), Math.min(1, lane * 3)); }
          o.multiplyScalar(.74 + .32 * ny); } });
      yield* rocks(60, { colors: ['#7a4a3c', '#c9b0a0', '#e6eefa'], sharp: 1, s1: .7 }); yield* frontRocks(['#5a3a30', '#a88a7a'], 7, 1);
      yield* rocks(26, { z0: -6, z1: -30, s0: .4, s1: 1.3, colors: ['#bcd4f2', '#ffffff'], sharp: 1, seed: 800, batch: props, sink: .1 }); // (shiny blocks of water ice)
      // THE HEART: a huge heart-shaped glacier of bright ice lying on the mountain (Pluto's real heart is a giant plain of ice)
      { const s = new THREE.Shape(); s.moveTo(0, -1); s.bezierCurveTo(-1.75, .15, -1.15, 1.35, 0, .62); s.bezierCurveTo(1.15, 1.35, 1.75, .15, 0, -1); const hg = new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelSize: .08, bevelThickness: .07, bevelSegments: 3, curveSegments: 22 }); hg.deleteAttribute('uv');
        const heart = model(b => b.add(hg, null, (px, py, pz, nx, ny, nz, o) => { const cell = K.sstep(.4, .5, Math.abs(K.noise2(px * 5, py * 5) - .5) * 2 + .3); K.ramp(['#dcecff', '#ffffff'], cell * .6 + py * .2 + .3, o); if (px > .1) o.lerp(K.col('#cfe0f6'), .35); }), K.shinyMat(), false);
        const ang = Math.atan(.72), HY = 4.6, zc = -41 - HY / .72, HS = 4.3; heart.material = heart.material.clone(); heart.material.emissive.set('#93a6cc'); heart.material.emissiveIntensity = .45; heart.scale.set(HS, HS * 1.15, 2.5); heart.rotation.x = -(Math.PI / 2 - ang); heart.position.set(hc, HY + .25, zc + .2); add(heart); let hb = 0;
        tapIt(heart, () => { hb = 1; Sound.chime(); fact('💗 Pluto has a giant heart made of ice! It is as big as a whole country.', 'plutoheart'); });
        U.push((dt, t) => { hb = Math.max(0, hb - dt); const k = 1 + Math.sin(hb * 12) * hb * .06; heart.scale.set(HS * k, HS * 1.15 * k, 2.5); }); }
      // the slippery ice plain to slide across (a glossy sheet on the ground)
      { const sheet = model(b => { const cgG = new THREE.CircleGeometry(1, 40); cgG.rotateX(-Math.PI / 2); b.add(cgG, null, (px, py, pz, nx, ny, nz, o) => { K.ramp(['#d4e6fa', '#ffffff'], K.noise2(px * 4, pz * 4), o); }); }, K.shinyMat(), false); sheet.scale.set(7.3, 1, 3.6); sheet.position.set(X + 44.5, .015, -.6); sheet.material = sheet.material.clone(); sheet.material.transparent = true; sheet.material.opacity = .55; sheet.material.roughness = .12; add(sheet); }
      const heart = (dt) => { const on = P.layer === 'space' && P.grounded && P.x > X + 37.5 && P.x < X + 51.5; if (on && Math.abs(P.vx) > 1 && !(api.keysHeld && api.keysHeld())) { P.x += P.vx * dt * .6; if (Math.random() < dt * 14) api.burst(P.x, .1, 0, ['#ffffff', '#dcecff'], 1, .7); if (!told.slide) { told.slide = 1; fact('⛸️ Wheee! Pluto\'s big heart is made of ice: it\'s slippery!', 'plutoheart'); } } }; U.push(heart);
      G.interact.push({ x: X + 44, y: 0, layer: 'space', disc: 'plutoheart', run: () => fact('💗 Pluto\'s big heart is a giant plain of ice. Run across and slide!', 'plutoheart'), hintY: 1 });
      // Charon, Pluto's big moon with its dark red cap, and the Sun: only a very bright star from this far away
      const charon = inSky((yield* K.skyBodySteps('charon', 15, { size: 256 })), MID + 44, 14, -200); charon.rotation.z = -.5; U.push(dt => { charon.rotation.y += dt * .015; });
      tapIt(charon, () => fact('🌑 That\'s Charon, Pluto\'s moon! They dance around each other.', 'charon'), X + 70, 'charon');
      inSky(K.glow('#ffffff', 9, 1), MID - 86, 17, -180); inSky(K.glow('#bcd0ff', 34, .35), MID - 86, 17, -182);
    }
    if (id === 'bubble') H = yield* bubbleLanding({ K, matte, props, soft, X, PW, MID, g, add, model, tapIt, U, fact, say, G, P, api, Sound, inSky }); // (build 133) the Bubble Universe
    if (id === 'toy') H = yield* toyLanding({ K, matte, props, soft, X, PW, MID, g, add, model, tapIt, U, fact, say, G, P, api, Sound, inSky }); // (build 132) the Giant Toy Universe
    if (id === 'upside') H = yield* upsideLanding({ K, matte, props, soft, X, PW, MID, g, add, model, tapIt, U, fact, say, G, P, api, Sound, inSky }); // (build 131) the Upside-Down World
    if (id === 'sun') {
      // (build 126) golden platforms floating over the glowing surface: the walkway and a broad golden terrace, then the edge,
      // and far below the bright, slowly boiling surface of the Sun (an animated picture, not real heat!) with giant flares
      H = yield* K.terrainSteps(matte, { cx: MID, wNear: PW + 100, flatZ: -4.6, nx: 200, nz: 70,
        height: (x, z) => { const terrace = K.sstep(-11, -16, z), isle = Math.max(0, 1 - Math.hypot((K.fbm2(x * .02, z * .02, 2) - .5) * 6, 0)) * K.sstep(-30, -45, z);
          return -14 * terrace + isle * 9 * K.sstep(.45, .7, K.fbm2(x * .03 + 4, z * .03, 3)) + (K.fbm2(x * .12, z * .12, 3) - .5) * .4; },
        color: (x, z, h, ny, o) => { const n = K.fbm2(x * .5, z * .5, 3), tile = (Math.floor(x * .5) + Math.floor(z * .5)) & 1;
          if (h > -3) { K.ramp(['#e8a030', '#ffcf5a', '#fff0a8'], .35 + n * .4 + tile * .1, o); o.multiplyScalar(.82 + .26 * ny); }
          else { K.ramp(['#ff5a10', '#ff9a2a', '#ffe070'], K.fbm2(x * .08, z * .08, 4), o); } } });
      // the boiling surface far below: one big sheet with a small animated shader (soft, slow and not too bright)
      const surf = new THREE.Mesh(new THREE.PlaneGeometry(900, 420, 1, 1), new THREE.ShaderMaterial({ fog: false, uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `precision mediump float; uniform float uTime; varying vec2 vU;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
          void main(){ vec2 p = vU * .06; float a = n(p + vec2(uTime * .05, 0.)) * .6 + n(p * 2.3 - vec2(0., uTime * .07)) * .3 + n(p * 5.1 + uTime * .03) * .1;
            float cells = smoothstep(.35, .75, a); vec3 c = mix(vec3(1., .42, .05), vec3(1., .86, .42), cells); c = mix(c, vec3(1., .97, .78), smoothstep(.8, .95, a) * .6);
            gl_FragColor = vec4(c * .95, 1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }` }));
      surf.rotation.x = -Math.PI / 2; surf.position.set(MID, -16, -170); add(surf); U.push((dt, t) => { surf.material.uniforms.uTime.value = t; });
      // giant solar prominences: glowing loops of gas rising from the surface, gently pulsing (far away, so they stay put)
      for (let k = 0; k < 5; k++) { const arc = new THREE.Mesh(new THREE.TorusGeometry(14 + k * 4, 2.2 - k * .2, 10, 48, Math.PI), new THREE.MeshBasicMaterial({ color: k % 2 ? '#ffb040' : '#ff7a20', transparent: true, opacity: .75, fog: false, depthWrite: false }));
        inSky(arc, MID - 140 + k * 70, -10, -150 - (k % 3) * 25); arc.rotation.y = (k % 2 ? .3 : -.3); U.push((dt, t) => { const s2 = 1 + Math.sin(t * .5 + k) * .06; arc.scale.set(s2, s2 * (1 + Math.sin(t * .35 + k * 2) * .1), s2); arc.material.opacity = .62 + Math.sin(t * .8 + k) * .12; }); }
      for (let k = 0; k < 6; k++) inSky(K.glow(k % 2 ? '#ffe08a' : '#ffb040', 60 + k * 10, .35), MID - 150 + k * 60, -6, -160);
      tapIt(surf, () => fact('☀️ The Sun is a giant ball of glowing gas, so hot that nothing can stand on it. Our magic platforms keep us safe!', 'sunsurface'));
      G.interact.push({ x: X + 44, y: 0, layer: 'space', disc: 'sunfacts', run: () => fact('☀️ The Sun is a star! It gives Earth light and warmth. A million Earths could fit inside it!', 'sunfacts'), hintY: 1 });
      yield* rocks(26, { colors: ['#ffcf5a', '#ffe9a0'], s0: .2, s1: .5, z0: -3, z1: -10, batch: props, seed: 900 });
    }
    // a shooting star now and then, where there is no air to hide the stars
    yield;
    if (id === 'moon' || id === 'mercury' || id === 'pluto') { const st = inSky(K.glow('#ffffff', 1, 0), MID, 20, -170); st.scale.set(14, .5, 1); let next = 3, life = 0, vx = 0, sx = 0;
      U.push(dt => { if (life > 0) { life -= dt; sx += vx * dt; st.userData.off = sx; st.position.y -= dt * 7; st.material.opacity = Math.sin(Math.min(1, life / .9) * Math.PI); if (life <= 0) st.material.opacity = 0; } else if ((next -= dt) < 0) { next = 5 + Math.random() * 7; life = .9; vx = 55; sx = (Math.random() - .7) * 90; st.material.rotation = -.12; const e = SK.find(q => q[0] === st); e[2] = 14 + Math.random() * 10; st.position.y = e[2]; } }); }

    // ================= the same on every planet: landing pad, rocket, jump pole, aliens =================
    const rx = X + 8, rz = -2.4;
    props.put(K.lathe([[0, .1], [2.2, .1], [2.5, .04], [2.6, 0], [0, 0]], 36), rx, 0, rz, (px, py, pz, nx, ny, nz, o) => { const r = Math.hypot(px - rx, pz - rz), a = Math.atan2(pz - rz, px - rx); o.copy(K.col(r > 2.2 ? '#6a7080' : r > 1.85 && r < 2.1 ? (Math.sin(a * 12) > 0 ? '#ffd23f' : '#33343f') : r < .5 ? '#ff4f9a' : '#9aa0b0')); });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .78; props.put(K.geo.cyl(10), rx + Math.cos(a) * 2.45, .16, rz + Math.sin(a) * 2.45, '#33343f', [.11, .3, .11]); props.put(K.geo.sph(1), rx + Math.cos(a) * 2.45, .36, rz + Math.sin(a) * 2.45, k % 2 ? '#7dffb0' : '#ff7a7a', .1); }
    const rk = new THREE.Group(); rk.position.set(rx, 0, rz); add(rk);
    rk.add(model(b => { for (const [geo2, c2, x, y, z, s, rot] of K.rocketParts()) b.put(geo2, x, y - .42, z, c2, s, rot); }));
    const rwin = new THREE.Mesh(K.rocketGlass(), toy('#9fe6ff', { em: '#9fe6ff', ei: .5, r: .1 })); rwin.position.set(0, 3.18, .72); rwin.scale.z = .6; rk.add(rwin); rk.userData.win = rwin;
    api.registerRocket && api.registerRocket(id, rk, rwin, rx, 'space', 0); rk.traverse(o => { if (o.isMesh) o.userData.tap = () => api.openPicker(); }); G.taps.push(rk);
    G.interact.push({ x: rx, y: 0, layer: 'space', disc: 'space_' + id, run: () => api.openPicker(), hintY: 4.6 });
    U.push((dt, t) => { rwin.material.emissiveIntensity = .45 + Math.sin(t * 3) * .2; });
    // the jump pole: one stripe for every metre, so you can see how high you jumped
    for (let m = 0; m < 30; m++) props.put(K.geo.cyl(10), X + 20, m + .5, -1.6, m % 2 ? '#ffffff' : '#ff4f9a', [.13, 1, .13]); props.put(K.geo.sph(1), X + 20, 30.15, -1.6, '#ffd23f', .26); props.put(K.lathe([[0, .2], [.3, .16], [.42, 0], [0, 0]], 14), X + 20, 0, -1.6, '#8a8fa0'); for (let m = 5; m < 30; m += 5) props.put(K.geo.torus(.25, 14), X + 20, m, -1.6, '#ffd23f', [.2, .2, .2], [Math.PI / 2, 0, 0]);

    // ---------- the ALIENS: a different kind on every planet; tap one and it says hello in its own voice ----------
    const AL = {
      moon: { name: 'Moonbeams', body: '#f4f6ff', eye: 1, ant: 1, shape: 'blob', move: 'hop', note: 900, hi: 'Bloop bloop! We hop SO high on the Moon!', iris: '#5a7cff' },
      mercury: { name: 'Sizzlers', body: '#ff9a2e', eye: 2, ant: 2, shape: 'spiky', move: 'scurry', note: 700, hi: 'Tsss tsss! It is hot here, so we wear sunglasses!', shades: 1, iris: '#7a3a1a' },
      venus: { name: 'Floaties', body: '#ffe36e', eye: 2, ant: 0, shape: 'jelly', move: 'float', note: 520, hi: 'Wooo! We float in the thick yellow clouds!', iris: '#c0562a' },
      mars: { name: 'Marslings', body: '#5fd36a', eye: 3, ant: 2, shape: 'classic', move: 'walk', note: 640, hi: 'Greetings, Earthling! Welcome to the red planet!', iris: '#1f7a3a' },
      jupiter: { name: 'Bloonies', body: '#ff9a5c', eye: 2, ant: 1, shape: 'balloon', move: 'float', note: 300, hi: 'Boom boom! We are big balloons from the biggest planet!', iris: '#8a3a1a' },
      saturn: { name: 'Ringlets', body: '#c9a6ff', eye: 2, ant: 0, shape: 'ringed', move: 'spin', note: 760, hi: 'Wheee! We spin like Saturn\'s rings!', iris: '#5a2fb0' },
      uranus: { name: 'Rollers', body: '#4fd8d0', eye: 2, ant: 0, shape: 'cube', move: 'roll', note: 580, hi: 'Roll roll! On Uranus everything rolls on its side!', iris: '#0a6a70' },
      neptune: { name: 'Windies', body: '#5a82f0', eye: 2, ant: 0, shape: 'wisp', move: 'swoosh', note: 450, hi: 'Whoosh! The wind is so fast on Neptune!', iris: '#12308a' },
      sun: { name: 'Sunnies', body: '#ffcf3a', eye: 2, ant: 2, shape: 'spiky', move: 'float', note: 820, hi: 'Hello! We are Sunnies! We wear sunglasses because the Sun is SO bright!', shades: 1, iris: '#a0521a' },
      pluto: { name: 'Heartlings', body: '#ff9fd2', eye: 2, ant: 2, shape: 'heart', move: 'hop', note: 1000, hi: 'Hello, friend! We love our big icy heart!', iris: '#b02a7a' },
    }[id] || DIM[id]?.alien; // (build 131) a dimension brings its own creatures
    const placeAlien = (x0, z0, k, interactId = null) => { const a = alien(AL, k); a.position.set(x0, 0, z0); add(a); let boing = 0, blink = 2 + k, px = x0, air = 0; const b = a.userData.body, lids = a.userData.lids, ants = a.userData.ants;
      tapIt(a, () => { boing = 1; Sound.tone(AL.note, .12, 'sine', .05, 1.4); Sound.tone(AL.note * 1.25, .12, 'sine', .05, 1.3, .14); api.burst(a.position.x, a.position.y + 1.5, z0, ['#ffffff', '#ffe36e', AL.body], 6, 2); say(`👽 ${AL.hi}`, true); disc('alien_' + id, `Meet the aliens on every planet!`); }, x0, interactId);
      U.push((dt, t) => { if (Math.abs(P.x - x0) > 45 && !boing) return; boing = Math.max(0, boing - dt * 1.5); const ph = t * 1.3 + k * 2; let sq = 0; // sq: squash (+) and stretch (-), so nothing moves like a stiff toy
        if (AL.move === 'hop') { const s = Math.sin(ph * 1.5), y = Math.abs(s) * (id === 'moon' ? 1.6 : 1.2); a.position.y = y; sq = y < .18 ? (.18 - y) * 1.6 : -Math.min(.14, Math.abs(Math.cos(ph * 1.5)) * .14); if (y < .05 && air > .3 && Math.random() < .5) api.burst(x0, .1, z0, id === 'moon' ? ['#c3c3cc', '#e6e6ec'] : ['#ffffff', '#dcecff'], 2, .7); air = y; }
        if (AL.move === 'float') { a.position.y = 1 + Math.sin(ph) * .4; sq = Math.cos(ph) * .07; a.position.x = x0 + Math.sin(ph * .37) * 1.2; b.rotation.z = Math.sin(ph * .8) * .08; }
        if (AL.move === 'walk' || AL.move === 'scurry') { a.position.x = x0 + Math.sin(ph * (AL.move === 'scurry' ? 1.6 : .5)) * 2.5; b.position.y = Math.abs(Math.sin(ph * 6)) * .08; b.rotation.z = Math.sin(ph * 6) * .06; }
        if (AL.move === 'spin') { a.rotation.y += dt * 3; a.position.y = .15 + Math.sin(ph * 2) * .12; }
        if (AL.move === 'roll') { a.position.x = x0 + Math.sin(ph * .6) * 3; const r = -(a.position.x - x0) * 1.96; b.rotation.z = r; b.position.y = .4 * (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r))) + .05; } // (build 48: it turns about its own middle and rises onto its corner, like a real box rolling; it used to swing half into the ground)
        if (AL.move === 'swoosh') { a.position.x = x0 + Math.sin(ph * .9) * 4; a.position.y = .8 + Math.sin(ph * 2) * .3; b.rotation.z = -Math.cos(ph * .9) * .25; }
        const vx = (a.position.x - px) / Math.max(dt, .001); if (AL.move !== 'spin' && AL.move !== 'roll') { const want = Math.abs(vx) > .15 ? Math.sign(vx) * .7 : Math.max(-.6, Math.min(.6, (P.x - a.position.x) * .12)); a.rotation.y += (want - a.rotation.y) * Math.min(1, dt * 5); } px = a.position.x; // (they turn the way they walk, and look at you when they stand)
        const pop = 1 + Math.sin(boing * 12) * boing * .25; a.scale.set(pop * (1 + sq), pop * (1 - sq), pop * (1 + sq));
        if (lids) { blink -= dt; if (blink < 0) blink = 2.5 + Math.random() * 3; lids.visible = blink < .13; }
        for (let q = 0; q < ants.length; q++) ants[q].rotation.z = (ants.length === 1 ? 0 : q ? -.25 : .25) + Math.sin(t * 3 + q * 2 + k) * .18 - Math.max(-.4, Math.min(.4, vx * .12)); }); };
    for (let k = 0; k < 3; k++) { placeAlien(X + 30 + k * 22, -2 - (k % 2) * 1.5, k, k === 0 ? "alien_" + id : null); yield; }

    // ---------- put it together: three still meshes (matte ground, shiny things, soft clouds) ----------
    const ground = matte.mesh(K.paintMat()); ground.name = 'ground'; add(ground); yield;
    if (props.count()) { const m = props.mesh(K.shinyMat()); m.castShadow = true; add(m); } yield;
    if (soft.count()) add(soft.mesh(K.softMat()));
    g.traverse(o => { o.userData.dynamic = true; });
    g.userData.tris = matte.count() + props.count() + soft.count();
    // (build 50) the toolkit the new areas use (planets.js), and anything that spans the whole planet (Moon footprints)
    kits[id] = { X, g, add, tapIt, fact, say, disc, Sound, U, P, G, api, ground: (x, z) => (typeof H === 'function' ? H(x, z) : 0), /* (build 69) */ setSkyColor: color => sky.set({ ...LOOK[id].sky, mid: "#" + color.getHexString(), hor: "#" + color.getHexString() }), placeAlien: (x, z, k) => placeAlien(x, z, k, null) };
    secs[id] = [true]; if (PLANET_EXTRA[id] && PLANET_EXTRA[id].all) PLANET_EXTRA[id].all(areaKit(id, 0, g));
    scene.add(g); return g;
  }
  // ---------- (build 50) BIGGER PLANETS: each new area is built when you walk near it, and a whole planet is freed when
  // you fly away (so only the place you are on is ever in memory). Shapes come from shared unit geometries. ----------
  const kits = {}, secs = {}, UNIT_BALL = new THREE.SphereGeometry(1, 24, 16), UNIT_BOX = new THREE.BoxGeometry(1, 1, 1); UNIT_BALL.userData.shared = UNIT_BOX.userData.shared = true;
  function areaKit(id, s, sub) {
    const K = kits[id], X = K.X, add = o => { sub.add(o); return o; }, { tapIt, U, say, disc } = K;
    const sball = (x, y, z, sx, sy, sz, c, o = {}) => { const m = new THREE.Mesh(UNIT_BALL, toy(c, o)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return add(m); };
    const sbox = (x, y, z, w, h, d, c, o = {}) => { const m = new THREE.Mesh(UNIT_BOX, toy(c, o)); m.position.set(x, y + h / 2, z); m.scale.set(w, h, d); return add(m); };
    const plat = (a, b, y, o = {}) => G.platforms.push({ a, b, y, layer: 'space', z: -1.2, ...o });
    const rocketSign = x => { const g2 = new THREE.Group(); g2.position.set(x, 0, -1.8); add(g2); const post = new THREE.Mesh(UNIT_BOX, toy('#ffffff', { r: .5 })); post.scale.set(.12, 1.4, .12); post.position.y = .7; g2.add(post);
      const mini = new THREE.Group(); mini.scale.setScalar(.22); mini.position.y = 1.4; g2.add(mini); rocketModel(mini); const back = () => { const r = G.rockets[id]; if (!r) return; api.flash(); P.x = r.x + 2.5; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; api.snap(); Sound.whoosh(); say('🚀 Back to the rocket!', true); disc('rocketback', '🚀 Tap a little rocket sign to go back to your rocket.'); };
      tapIt(g2, back); G.interact.push({ x, y: 0, layer: 'space', run: back, hintY: 2.4, icon: '🚀', action: 'Back to the rocket' }); U.push((dt, t) => { mini.rotation.y = t; mini.position.y = 1.4 + Math.sin(t * 2) * .08; }); };
    return { ...K, s0: X + s * SECTION, g: sub, add, sball, sbox, plat, rocketSign };
  }
  function rocketModel(rk) {
    const batch = K.makeBatch();
    for (const [geometry, color, x, y, z, scale, rotation] of K.rocketParts()) batch.put(geometry, x, y - .42, z, color, scale, rotation);
    rk.add(batch.mesh(K.shinyMat()));
  }
  const areaSteps = []; // (build 50: a new area is made over several frames, one small step each, never all at once)
  function buildArea(id, s) {
    const K = kits[id], sub = new THREE.Group(); sub.name = `space:${id}:${s}`; sub.userData.dynamic = true; const k = areaKit(id, s, sub), X0 = k.s0;
    areaSteps.push(() => {
    // the ground features every area shares (rocky places: soft craters and scattered rocks, from the shared shapes)
    const [, [, c2], , gas] = PLACES[PLACES.findIndex(p => p[0] === id)];
    if (!gas) { for (let j = 0; j < 9; j++) k.sball(X0 + 8 + j * 11.5 + (j % 3) * 2, -.15, -6 - (j % 3) * 2.6, 1.2 + (j % 3) * .6, .22, 1.2 + (j % 3) * .6, c2, { r: .95 }); for (let j = 0; j < 8; j++) k.sball(X0 + 12 + j * 12.5, .2, -7.5 - (j % 2) * 3, .35 + (j % 3) * .2, .28 + (j % 3) * .15, .35 + (j % 3) * .2, c2, { r: .9 }); }
    }, () => PLANET_EXTRA[id].sections[s - 1](k),
    () => { if (kits[id] !== K) return; sub.traverse(o => { if (o.isMesh) o.castShadow = false; }); api.compile && api.compile(sub); },
    () => { if (kits[id] !== K) return; K.g.add(sub); });
  }
  function unbuild(id) {
    controllers[id]?.abort(); delete controllers[id]; delete preparing[id];
    const g = groups[id]; if (!g) return; if (g.userData.leave) g.userData.leave(); const i = PLACES.findIndex(p => p[0] === id), X = placeX(i), X2 = X + placeWidth(id);
    const mine = new Set(); g.traverse(o => mine.add(o));
    for (let k = G.taps.length - 1; k >= 0; k--) if (mine.has(G.taps[k])) G.taps.splice(k, 1);
    for (let k = G.interact.length - 1; k >= 0; k--) { const it = G.interact[k]; if (it.layer === 'space' && it.x >= X - 30 && it.x <= X2 + 30) G.interact.splice(k, 1); }
    for (let k = G.platforms.length - 1; k >= 0; k--) { const it = G.platforms[k]; if (it.layer === 'space' && it.a >= X - 30 && it.b <= X2 + 30) G.platforms.splice(k, 1); }
    g.parent && g.parent.remove(g); g.traverse(o => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m !== K.paintMat() && m !== K.shinyMat() && m !== K.softMat() && m !== K.glowMat()) m.dispose(); }); });
    for (const texture of g.userData.ownedTextures || []) texture.dispose();
    areaSteps.length = 0; delete groups[id]; delete ups[id]; delete skies[id]; delete kits[id]; delete secs[id]; built[id] = false; if (G.rockets) delete G.rockets[id];
  }
  const unbuildOthers = keep => { for (const k of new Set([...Object.keys(groups), ...Object.keys(preparing)])) if (k !== keep) unbuild(k); };

  // an alien sculpted from smooth painted shapes (one mesh), with shiny eyes that blink and feelers that wobble.
  // Each planet's kind looks and moves differently.
  function alien(A, k) {
    const a = new THREE.Group(), body = new THREE.Group(); a.add(body); a.userData.body = body; a.userData.ants = [];
    const base = new THREE.Color(A.body), dark = base.clone().multiplyScalar(.72), lite = base.clone().lerp(new THREE.Color('#ffffff'), .55), b = K.makeBatch(), lb = K.makeBatch();
    const skin = (px, py, pz, nx, ny, nz, o) => { o.copy(base).lerp(lite, K.sstep(.1, .9, nz) * .35).multiplyScalar(.82 + .22 * Math.max(0, ny)); };
    const S = (r, x, y, z, c = skin, s) => b.put(K.geo.sph(r > .25 ? 2 : 1), x, y, z, c, s ? [r * s[0], r * s[1], r * s[2]] : r);
    let headY = .9, faceZ = .42, eyeR = A.eye === 1 ? .2 : .115;
    const feet = (y = .07, w = .2) => { for (const s of [-1, 1]) S(.13, s * w, y, .06, '#' + dark.getHexString(), [1, .6, 1.5]); };
    const arms = (y, w) => { for (const s of [-1, 1]) S(.09, s * w, y, .05, skin, [1, 1.7, 1]); };
    if (A.shape === 'blob') { S(.56, 0, .6, 0, skin, [1, .95, .92]); S(.38, 0, .42, .12, '#ffffff', [1, .8, .7]); feet(); arms(.55, .58); for (let q = 0; q < 5; q++) S(.07, Math.cos(q * 2.3) * .4, .75 + Math.sin(q * 1.7) * .25, -.3 - (q % 2) * .1, '#c9d2ff'); headY = .78; faceZ = .47; }
    else if (A.shape === 'heart') { const s = new THREE.Shape(); s.moveTo(0, -.52); s.bezierCurveTo(-.95, .08, -.62, .78, 0, .36); s.bezierCurveTo(.62, .78, .95, .08, 0, -.52); const hg = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: true, bevelSize: .15, bevelThickness: .17, bevelSegments: 5, curveSegments: 16 }); hg.deleteAttribute('uv'); hg.translate(0, .78, -.11); b.add(hg, null, skin); feet(.07, .17); arms(.6, .68); headY = .86; faceZ = .29; }
    else if (A.shape === 'spiky') { S(.47, 0, .52, 0); for (let q = 0; q < 16; q++) { const u = (q + .5) / 16, th = Math.acos(1 - u * 1.25), ph = q * 2.4, dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = -Math.abs(Math.sin(th) * Math.sin(ph)) - .12, l = Math.hypot(dx, dy, dz); const cg = new THREE.ConeGeometry(.085, .34, 8); cg.translate(0, .17, 0); const q4 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / l, dy / l, dz / l)), m = new THREE.Matrix4().compose(new THREE.Vector3(dx / l * .43, .52 + dy / l * .43, dz / l * .43), q4, new THREE.Vector3(1, 1, 1)); b.add(cg, m, q % 2 ? '#ffd23f' : '#' + dark.getHexString()); } feet(.07, .2); headY = .58; faceZ = .45; }
    else if (A.shape === 'jelly') { b.put(K.lathe([[0, .52], [.2, .5], [.38, .4], [.5, .22], [.56, .02], [.5, -.06], [.42, 0], [.3, .04], [0, .06]], 24), 0, .78, 0, skin); for (let q = 0; q < 6; q++) { const an = q / 6 * 6.283, r = .34; for (let j = 0; j < 3; j++) S(.06 - j * .008, Math.cos(an) * (r + Math.sin(j * 1.3 + q) * .04), .68 - j * .16, Math.sin(an) * r * .8, j % 2 ? '#fff6b0' : skin, [1, 1.5, 1]); } for (let q = 0; q < 6; q++) S(.05, Math.cos(q * 1.9) * .3, 1.12 + Math.sin(q) * .06, -.2 + Math.sin(q * 1.9) * .2, '#fff6b0'); headY = .98; faceZ = .47; }
    else if (A.shape === 'classic') { S(.3, 0, .52, 0, skin, [1, 1.25, .85]); S(.2, 0, .5, .16, '#' + lite.getHexString(), [1, 1.2, .6]); S(.44, 0, 1.22, 0, skin, [1.12, .92, 1]); feet(.07, .15); arms(.6, .36); headY = 1.26; faceZ = .4; eyeR = .1; }
    else if (A.shape === 'balloon') { b.put(K.geo.sph(), 0, 1.02, 0, (px, py, pz, nx, ny, nz, o) => { K.ramp(['#c8703a', '#ffb07a', '#fff0dc', '#ff9a5c', '#d8573a', '#ffb07a'], py * .72 - .25 + Math.sin(px * 6) * .02, o); o.multiplyScalar(.84 + .2 * Math.max(0, ny)); }, [.72, .7, .7]); b.put(K.geo.cone(10), 0, .28, 0, '#' + dark.getHexString(), [.1, .14, .1], [Math.PI, 0, 0]); b.put(K.geo.cyl(6), 0, .12, 0, '#ffffff', [.012, .26, .012]); headY = 1.1; faceZ = .69; eyeR = .12; }
    else if (A.shape === 'ringed') { S(.46, 0, .62, 0); const rg = new THREE.RingGeometry(.6, .92, 36, 1); rg.rotateX(-Math.PI / 2 + .3); b.put(rg, 0, .62, 0, '#ffd23f'); const rg2 = new THREE.RingGeometry(.6, .92, 36, 1); rg2.rotateX(Math.PI / 2 + .3); b.put(rg2, 0, .62, 0, '#ffb84a'); feet(.1, .16); headY = .7; faceZ = .44; }
    else if (A.shape === 'cube') { b.put(K.roundBox(.82, .82, .82, .16, 3), 0, .45, 0, skin); for (const [x, y] of [[-.22, .2], [.22, .2], [0, .7]]) S(.05, x, y, .41, '#' + lite.getHexString(), [1, 1, .3]); headY = .55; faceZ = .41; }
    else if (A.shape === 'wisp') { b.put(K.lathe([[0, .42], [.2, .38], [.36, .22], [.42, 0], [.36, -.2], [.2, -.34], [0, -.4]], 20), 0, .55, 0, skin); for (let q = 0; q < 4; q++) S(.26 - q * .055, -.42 - q * .3, .5 - q * .04 + Math.sin(q * 1.4) * .08, 0, q % 2 ? '#' + lite.getHexString() : skin, [1.5, .8, .8]); S(.1, -.2, .92, 0, '#' + lite.getHexString(), [1.6, .6, .8]); headY = .62; faceZ = .41; }
    // the face: big shiny eyes, a little smile, rosy cheeks
    const ex = A.eye === 1 ? [0] : A.eye === 2 ? [-.17, .17] : [-.25, 0, .25];
    for (const x of ex) { const y = headY + (A.eye === 3 && x === 0 ? .1 : 0), z = faceZ - Math.abs(x) * .18; S(eyeR, x, y, z, '#ffffff'); S(eyeR * .64, x, y, z + eyeR * .5, A.iris, [1, 1, .6]); S(eyeR * .36, x, y, z + eyeR * .76, '#1c1230', [1, 1, .5]); S(eyeR * .17, x + eyeR * .22, y + eyeR * .26, z + eyeR * .92, '#ffffff');
      lb.put(K.geo.sph(1), x, y, z + eyeR * .12, '#' + dark.getHexString(), [eyeR * 1.08, eyeR * 1.08, eyeR * 1.02]); }
    if (!A.shades) { const sg = new THREE.TorusGeometry(.11, .022, 6, 12, Math.PI); sg.rotateZ(Math.PI); b.put(sg, 0, headY - eyeR * 1.35 + .02, faceZ + .03, '#5a2038'); for (const s of [-1, 1]) S(.06, s * (ex[ex.length - 1] + eyeR + .09), headY - eyeR * .9, faceZ - .08, '#ff8fb0', [1, .6, .4]); }
    else { for (const x of ex) b.put(K.roundBox(.3, .2, .06, .05, 2), x, headY, faceZ + .08, '#1c1230'); b.put(K.geo.box(), 0, headY + .04, faceZ + .08, '#1c1230', [.12, .04, .04]); for (const x of ex) S(.03, x - .06, headY + .04, faceZ + .12, '#ffffff'); const sg = new THREE.TorusGeometry(.1, .022, 6, 12, Math.PI); sg.rotateZ(Math.PI); b.put(sg, 0, headY - .2, faceZ + .02, '#5a2038'); }
    const m = b.mesh(K.softMat()); m.castShadow = true; body.add(m);
    if (!A.shades && lb.count()) { const l = lb.mesh(K.softMat()); l.visible = false; body.add(l); a.userData.lids = l; }
    // feelers: a thin stalk with a glowing bobble, hinged at the head so they can wobble
    for (let q = 0; q < A.ant; q++) { const x = A.ant === 1 ? 0 : (q ? .17 : -.17), ag = new THREE.Group(); ag.position.set(x, headY + (A.shape === 'classic' ? .34 : A.shape === 'heart' ? .2 : .38), 0); const am = K.makeBatch(); am.put(K.geo.cyl(6), 0, .2, 0, '#' + dark.getHexString(), [.022, .4, .022]); am.put(K.geo.sph(1), 0, .43, 0, '#ffd23f', .075); ag.add(am.mesh(K.softMat())); ag.rotation.z = (A.ant === 1 ? 0 : q ? -.25 : .25); body.add(ag); a.userData.ants.push(ag); }
    if (A.shape === 'cube') { body.children.forEach(o => { o.position.y -= .45; }); body.position.y = .45; } // (the cube's middle is the body's pivot, for rolling)
    return a;
  }

  // ---------- flying ----------
  async function goTo(i) {
    const request = ++navigation;
    try { await prepare(PLACES[i][0]); } catch (error) { if (error.name === 'AbortError') return false; throw error; }
    if (request !== navigation) return false;
    unbuildOthers(PLACES[i][0]);
    const [id, , grav, gas, hello] = PLACES[i]; if (here && here !== id && groups[here]?.userData.leave) groups[here].userData.leave();
    here = id; G.spaceG = grav / EARTH_G;
    G.spaceBounds = [placeX(i) + 1, placeX(i) + placeWidth(id) - 1];
    api.flash(); P.ride = null; P.layer = 'space'; P.x = placeX(i) + 12; P.y = 0; P.z = 0; P.vx = P.vy = 0; P.grounded = true; P.jumps = 0; jumpTop = 0;
    show(); api.snap(); Sound.chime();
    say(`🚀 ${hello}`, true); disc('space_' + id); disc('space'); told = {}; return true;
  }
  // (build 50) build the place you are flying to during the countdown, so arriving does not stop the game
  function prepare(id) {
    const i = PLACES.findIndex(p => p[0] === id);
    if (i < 0 || built[id]) return Promise.resolve();
    if (preparing[id]) return preparing[id];
    const controller = controllers[id] = new AbortController();
    const task = runInSlices(build(i), { signal: controller.signal })
      .then(async g => {
        if (controller.signal.aborted) return;
        await api.compile?.(g);
        if (!controller.signal.aborted) built[id] = true;
      }).catch(error => {
        if (controllers[id] === controller) unbuild(id);
        throw error;
      });
    preparing[id] = task;
    // A cancelled countdown can abandon preparation before goTo starts awaiting it.
    task.catch(() => {});
    return task;
  }
  function cancel() { ++navigation; unbuildOthers(here); }
  /** (build 126) leave the planet without going home (into open space) */
  function hideAll() { ++navigation; if (here && groups[here]?.userData.leave) groups[here].userData.leave(); here = null; G.spaceG = 1; unbuildOthers(null); show(); }
  function goHome() { ++navigation; if (here && groups[here]?.userData.leave) groups[here].userData.leave(); here = null; G.spaceG = 1; api.home(); unbuildOthers(null); show(); }
  let lit = null;
  function show() {
    if (P.layer === 'deep') { for (const k in groups) groups[k].visible = false; sky.mesh.visible = false; dust.set(null); lit = undefined; return; } // (build 126) open space owns the sky and light
    const on = P.layer === 'space';
    for (const k in groups) groups[k].visible = on && k === here;
    sky.mesh.visible = on;
    const L = on ? LOOK[here] : null;
    if (L !== lit) { lit = L; api.light && api.light(L); if (L) { sky.set(L.sky); dust.set(calm() && L.dust ? { ...L.dust, n: Math.round((L.dust.n ?? 96) / 3) } : L.dust, api.camX(), P.y); } else dust.set(null); }
  }
  // the jump report: after each big jump, how high you went (the real gravity makes the difference)
  function update(dt, t) {
    if (P.layer !== 'space') { if (here) { if (groups[here]?.userData.leave) groups[here].userData.leave(); here = null; G.spaceG = 1; show(); unbuildOthers(null); } return; }
    const i = PLACES.findIndex(p => p[0] === here); if (i < 0) return;
    const X = placeX(i), MID = X + placeWidth(here) / 2, cx = api.camX(), cy = api.camY ? api.camY() : P.y;
    sky.mesh.position.set(cx, cy, 0); sky.U.uTime.value = t;
    for (const s of skies[here] || []) { s[0].position.x = s[1] + (cx - MID) * .93 + (s[0].userData.off || 0); if (!s[0].userData.off) s[0].position.y = s[2] + cy * .9; }
    dust.update(dt, t, cx, cy);
    if (boost > 0) { boost = Math.max(0, boost - dt * 2.5); api.boost && api.boost(boost); }
    if (!P.grounded) jumpTop = Math.max(jumpTop, P.y);
    else if (jumpTop > .05) { const h = jumpTop; jumpTop = 0; G.spaceLastJump = h; /* (measured every physics step: a Jupiter hop lasts a third of a second) */ if (h > 1.2) api.burst(P.x, .1, 0, ['#ffffff', '#e6e6ec'], Math.min(10, 3 + h), 1.6); /* (a puff of dust where you land) */ if (h < .3) return; if (!told[Math.round(h)]) { told[Math.round(h)] = 1; const m = Math.round(h * 10) / 10; say(m >= 1 ? `⭐ You jumped ${m >= 3 ? Math.round(m) : m} metres high!` : '⭐ A tiny hop! Gravity is very strong here!', true); disc('spacejump', 'Jump on each planet: the gravity is different everywhere!'); } }
    for (const u of ups[here] || []) u(dt, t);
    // (build 50) build the next area of a big planet when you get within 70 m of it
    if (areaSteps.length) areaSteps.shift()();
    else if (PLANET_EXTRA[here] && secs[here]) for (let s = 1; s <= PLANET_EXTRA[here].sections.length; s++) if (!secs[here][s] && P.x > X + s * SECTION - 70) { secs[here][s] = true; buildArea(here, s); break; }
  }
  return { goTo, goHome, hideAll, cancel, update, prepare, places: PLACES, here: () => here, look: LOOK, groups, warmup: [sky.mesh, dust.points] };
}
