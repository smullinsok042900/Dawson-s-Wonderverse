// ===================================================================
// planet-life.js (build 107): LIVING CREATURES ON THE PLANETS, and PETS to befriend there.
//
// One small species table for every destination: each creature is ONE mesh (its painted shape, made once and shared),
// with its own way of moving (hop, float, roll, slide, bounce), breathing, looking round, turning to her, waving when
// she comes near, and a reaction when tapped. Characters have a little activity she can join; PETS can be befriended
// with four big picture buttons (✋ pat, 🤗 hug, 🍓 treat, ⚽ play): one happy moment and the pet is hers for good. A
// befriended pet joins the 🐾 friends (the same collection as the Earth pals) and can follow her everywhere.
// Cheap: one draw call per creature, the shared painted material (no new shader); creatures are built with their planet
// and freed with it; only creatures near the camera move (a few per frame); nothing is sent between phones.
// ===================================================================
import * as THREE from 'three';
import { makeBatch, shinyMat, lifeMat } from './spacekit.js';
import { CHALK_FRIENDS } from './chalk-friends.js';
import { MARKER_FRIENDS } from './marker-friends.js';
import { DOODLE_FRIENDS } from './doodle-friends.js';
import { KEEPSAKE_FRIENDS } from './keepsake-friends.js';
import { STORY_FRIENDS } from './story-friends.js';
import { STORY_FRIENDS_2 } from './story-friends-2.js';
import { FAMILY } from './family.js';
import { CRAFT_FRIENDS } from './craft-friends.js';

const GEO = { box: new THREE.BoxGeometry(1, 1, 1), ball: new THREE.SphereGeometry(1, 11, 8), cone: new THREE.ConeGeometry(1, 1, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 8), tor: new THREE.TorusGeometry(1, .22, 5, 12), ballS: new THREE.SphereGeometry(1, 8, 6), dot: new THREE.SphereGeometry(1, 6, 4) }; // (light: about 150 triangles a big ball; build 117: small balls use fewer (80), tiny ones (eyes, spots) far fewer (36))
const starGeo = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: true, bevelThickness: .18, bevelSize: .14, bevelSegments: 2 }); g.center(); return g; })();
// two cute eyes with shines, at height y, spread s, looking toward +z, size r
const eyes = (b, y, s, z, r = .07, col = '#2b1d3d') => { for (const k of [-1, 1]) { b.put(GEO.ball, k * s, y, z, col, [r, r * 1.15, r * .6]); b.put(GEO.ball, k * s + r * .3, y + r * .35, z + r * .45, '#ffffff', r * .35); } };
const cheeks = (b, y, s, z) => { for (const k of [-1, 1]) b.put(GEO.ball, k * s, y, z, '#ff9fc8', [.05, .03, .02]); };
const smile = (b, y, z, w = .06) => b.put(GEO.tor, 0, y, z, '#2b1d3d', [w, w, .3], [0, 0, Math.PI]);

// ---------- the species: shape (built facing +z, standing on y = 0), movement, sound, and what tapping does ----------
//   move: hop | float | roll | slide | bounce;  pet: befriendable;  where: spoken when it is still to be found
export const SPECIES = {
  ...CHALK_FRIENDS, // The family's drawings are world residents, never selectable avatars or collectible pets.
  ...MARKER_FRIENDS,
  ...DOODLE_FRIENDS,
  ...KEEPSAKE_FRIENDS,
  ...FAMILY, // (build 130) Dawson and her family
  ...STORY_FRIENDS_2, // (build 129) monsters, rescue pups, sea friends, pig family, toy doctor, robot, fluffy bunnies
  ...STORY_FRIENDS, // (build 128) original singers, stripy cat, snow family and puppies
  ...CRAFT_FRIENDS,
  // ---- THE MOON: characters ----
  rocky: { name: 'Rocky', planet: 'moon', move: 'roll', v: 1.4, r: 3, size: 1, voice: 'Rumble rumble!',
    build: b => { b.put(GEO.ball, 0, .55, 0, '#b4b4c2', [.58, .52, .55]); for (const [x, y, z, s] of [[-.32, .82, .2, .12], [.3, .4, .38, .1], [.12, .95, -.2, .14], [-.4, .35, -.2, .11]]) b.put(GEO.ball, x, y, z, '#9a9aa8', [s, s * .6, s]); eyes(b, .66, .17, .48, .085); cheeks(b, .5, .3, .46); smile(b, .47, .5, .07); } },
  lumi: { name: 'Lumi', planet: 'moon', move: 'float', v: 1.6, r: 4, size: .8, hover: 1.6, voice: 'Twinkle twinkle!',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#fff3a6', .42); b.put(GEO.ball, 0, 0, 0, '#ffd23f', .3); for (const k of [-1, 1]) b.put(GEO.ball, k * .42, .12, -.05, '#dff4ff', [.26, .12, .04], [0, k * .3, k * .5]); b.put(GEO.cone, 0, .5, 0, '#ffe36e', [.06, .2, .06]); b.put(GEO.ball, 0, .64, 0, '#ffffff', .06); eyes(b, .06, .13, .38, .07); smile(b, -.07, .4, .05); } },
  boing: { name: 'Boing', planet: 'moon', move: 'bounce', v: 1, r: 2, size: 1.1, voice: 'Boing boing!',
    build: b => { for (const k of [-1, 1]) { b.put(GEO.tor, k * .2, .14, 0, '#9fe6ff', [.12, .12, .5], [Math.PI / 2, 0, 0]); b.put(GEO.tor, k * .2, .28, 0, '#9fe6ff', [.12, .12, .5], [Math.PI / 2, 0, 0]); b.put(GEO.ball, k * .2, .04, .06, '#62b8e8', [.16, .06, .22]); }
      b.put(GEO.ball, 0, .78, 0, '#c9a6ff', [.42, .45, .4]); b.put(GEO.ball, 0, .64, .2, '#efe2ff', [.26, .24, .2]); for (const k of [-1, 1]) b.put(GEO.cone, k * .18, 1.24, 0, '#c9a6ff', [.07, .26, .07], [0, 0, -k * .2]); eyes(b, .9, .15, .36, .08); cheeks(b, .76, .28, .33); smile(b, .74, .39, .06); } },
  // ---- THE MOON: pets ----
  moonpup: { name: 'Moonpup', planet: 'moon', pet: true, move: 'hop', v: 2, r: 2.5, size: .92, voice: 'Arf arf!', where: 'on the Moon', emoji: '🐶',
    build: b => { b.put(GEO.ball, 0, .38, -.05, '#f4f1ff', [.32, .28, .4]); b.put(GEO.ball, 0, .68, .26, '#f4f1ff', [.28, .26, .26]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .25, .66, .2, '#c9b6ff', [.08, .2, .1], [0, 0, k * .4]); b.put(GEO.ball, k * .16, .1, .14, '#e6e0ff', .1); b.put(GEO.ball, k * .16, .1, -.22, '#e6e0ff', .1); }
      b.put(GEO.ball, 0, .62, .5, '#ffb3d0', [.06, .045, .04]); b.put(GEO.tor, 0, .6, -.48, '#ffe36e', [.16, .16, .6], [0, Math.PI / 2, 0]); eyes(b, .74, .1, .48, .06); cheeks(b, .62, .18, .46); } },
  craterhop: { name: 'Hopscotch', planet: 'moon', pet: true, move: 'hop', v: 2.2, r: 3, size: .86, hopH: .5, voice: 'Hop hop!', where: 'in the crater', emoji: '🐸',
    build: b => { b.put(GEO.ball, 0, .42, 0, '#b9b9c9', [.34, .3, .3]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .2, .08, .1, '#8a8a9c', [.16, .07, .26]); b.put(GEO.cyl, k * .1, .76, 0, '#8a8a9c', [.02, .2, .02]); b.put(GEO.ball, k * .1, .88, 0, '#ff9fc8', .06); }
      for (const [x, y] of [[-.15, .55], [.18, .3], [.05, .2]]) b.put(GEO.ball, x, y, .27, '#a2a2b4', .05); eyes(b, .5, .12, .27, .075); smile(b, .36, .3, .05); } },
  stardrop: { name: 'Stardrop', planet: 'moon', pet: true, move: 'float', v: 1.8, r: 3, size: .74, hover: 1.2, voice: 'Ting!', where: 'up in the sky', emoji: '⭐',
    build: b => { b.put(starGeo, 0, 0, 0, '#ffd23f', [.42, .42, .42]); eyes(b, .05, .12, .17, .055); cheeks(b, -.06, .2, .16); smile(b, -.06, .18, .04); } },
  dustbun: { name: 'Dustbun', planet: 'moon', pet: true, move: 'hop', v: 1.7, r: 2, size: .8, voice: 'Puff!', where: 'near the moon base', emoji: '🐰',
    build: b => { for (const [x, y, z, s] of [[0, .36, 0, .32], [-.18, .3, .1, .2], [.18, .3, .1, .2], [0, .5, -.05, .24], [-.14, .48, -.12, .18], [.15, .46, -.14, .18]]) b.put(GEO.ball, x, y, z, '#d9cdf2', s);
      for (const k of [-1, 1]) b.put(GEO.ball, k * .12, .82, -.02, '#e9dfff', [.07, .26, .06], [0, 0, -k * .25]); b.put(GEO.ball, 0, .42, .32, '#ffffff', .1); eyes(b, .5, .1, .3, .055); b.put(GEO.ball, 0, .43, .36, '#ff8fb8', .03); } },
  orbiter: { name: 'Orbit', planet: 'moon', pet: true, move: 'float', v: 1.5, r: 2, size: .74, hover: 1, voice: 'Wheee!', where: 'by the big telescope', emoji: '🪐',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#5aa8ff', .34); b.put(GEO.ball, 0, -.06, .1, '#9fd2ff', [.24, .2, .26]); b.put(GEO.tor, 0, 0, 0, '#ffd6f4', [.56, .56, .35], [Math.PI / 2 - .75, 0, .25]);
      for (const a of [0, 2.1, 4.2]) b.put(GEO.ball, Math.cos(a) * .56, Math.sin(a) * .38, Math.sin(a) * .38, ['#ffe36e', '#ff9fc8', '#c9a6ff'][Math.round(a / 2.1)], .07); eyes(b, .06, .12, .3, .06); smile(b, -.06, .32, .04); } },
  glowsnail: { name: 'Glimmer Snail', planet: 'moon', pet: true, move: 'slide', v: .35, r: 1.5, size: .82, voice: 'Hellooo!', where: 'in a quiet corner', emoji: '🐌',
    build: b => { b.put(GEO.ball, 0, .1, .05, '#d6ffe9', [.22, .1, .5]); b.put(GEO.ball, 0, .3, .42, '#d6ffe9', [.14, .16, .14]); for (const k of [-1, 1]) { b.put(GEO.cyl, k * .06, .5, .44, '#b8f0d4', [.015, .14, .015]); b.put(GEO.ball, k * .06, .58, .44, '#62f0c8', .03); }
      for (let i = 0; i < 4; i++) b.put(GEO.tor, 0, .38 - i * .02, -.08, ['#62f0ff', '#9fe6ff', '#c9a6ff', '#ff9fd8'][i], [.28 - i * .06, .28 - i * .06, 1.2], [0, Math.PI / 2, 0]); eyes(b, .34, .07, .55, .04); } },
  // ---- MARS: characters ----
  dusty: { name: 'Dusty', planet: 'mars', move: 'float', v: 1.8, r: 4, size: .9, hover: .7, voice: 'Whoosh whoosh!',
    build: b => { for (let i = 0; i < 5; i++) b.put(GEO.tor, 0, i * .17, 0, ['#e8a070', '#f0b888', '#f8d0a8', '#f0b888', '#e8a070'][i], [.18 + i * .07, .18 + i * .07, .7], [Math.PI / 2, 0, i * .4]); b.put(GEO.ball, 0, .88, 0, '#ffd8b0', .3); eyes(b, .92, .11, .27, .065); cheeks(b, .8, .2, .26); smile(b, .79, .29, .05); } },
  drummer: { name: 'Bongo', planet: 'mars', move: 'none', v: 0, r: 0, size: 1, voice: 'Boom boom tap!',
    build: b => { b.put(GEO.ball, 0, .7, 0, '#c8653f', [.45, .5, .42]); b.put(GEO.ball, 0, .62, .25, '#e88a5c', [.3, .3, .2]); for (const k of [-1, 1]) { b.put(GEO.cyl, k * .55, .35, .2, '#ffd23f', [.2, .32, .2]); b.put(GEO.cyl, k * .55, .52, .2, '#fff6e0', [.21, .02, .21]); b.put(GEO.cyl, k * .38, .72, .32, '#8a3a1f', [.03, .3, .03], [.6, 0, -k * .7]); b.put(GEO.ball, k * .2, .08, .1, '#a84a2a', [.16, .08, .22]); }
      b.put(GEO.cone, 0, 1.24, 0, '#ff8a3c', [.08, .2, .08]); eyes(b, .86, .15, .38, .08); cheeks(b, .72, .28, .36); smile(b, .7, .41, .07); } },
  crystalkid: { name: 'Chime', planet: 'mars', move: 'hop', v: 1.2, r: 2.5, size: 1, hopH: .15, voice: 'Ting ting ting!',
    build: b => { b.put(GEO.ball, 0, .5, 0, '#ff9fc8', [.32, .42, .3]); for (const [x, y, z, h, c] of [[0, .95, 0, .35, '#ff6fd8'], [-.2, .85, -.05, .25, '#c9a6ff'], [.2, .85, -.05, .25, '#62f0ff'], [-.1, .78, -.2, .2, '#ffe36e'], [.12, .8, -.18, .22, '#7dffb0']]) b.put(GEO.cone, x, y, z, c, [.08, h, .08], [-.2, 0, x * 1.4]);
      for (const k of [-1, 1]) b.put(GEO.ball, k * .14, .1, .05, '#e07aa8', [.1, .08, .14]); eyes(b, .6, .11, .28, .065); smile(b, .46, .3, .05); } },
  // ---- MARS: pets ----
  dunehop: { name: 'Sandy', planet: 'mars', pet: true, move: 'hop', v: 2.2, r: 3, size: .9, hopH: .35, voice: 'Yip yip!', where: 'in the red dunes', emoji: '🦊',
    build: b => { b.put(GEO.ball, 0, .36, -.05, '#f0a060', [.28, .26, .36]); b.put(GEO.ball, 0, .62, .22, '#f0a060', [.24, .22, .22]); b.put(GEO.ball, 0, .56, .4, '#fff0e0', [.1, .08, .08]); for (const k of [-1, 1]) { b.put(GEO.cone, k * .17, .92, .16, '#f0a060', [.12, .34, .05], [0, 0, -k * .35]); b.put(GEO.cone, k * .17, .9, .18, '#ffd0d8', [.07, .24, .03], [0, 0, -k * .35]); b.put(GEO.ball, k * .14, .08, .1, '#e08a4a', .09); }
      b.put(GEO.ball, 0, .5, -.45, '#fff0e0', [.1, .1, .2]); b.put(GEO.ball, 0, .58, .47, '#3a2030', .035); eyes(b, .68, .1, .4, .06); } },
  rubypup: { name: 'Ruby', planet: 'mars', pet: true, move: 'hop', v: 2, r: 2.5, size: .9, voice: 'Arf! Sparkle!', where: 'near the red cliffs', emoji: '🐕',
    build: b => { b.put(GEO.ball, 0, .36, -.05, '#d86a4a', [.3, .26, .4]); b.put(GEO.ball, 0, .64, .26, '#d86a4a', [.26, .25, .25]); b.put(GEO.ball, 0, .56, .46, '#f8c0a8', [.11, .08, .08]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .24, .7, .18, '#a84a2a', [.08, .16, .1], [0, 0, k * .5]); b.put(GEO.ball, k * .16, .1, .14, '#c85a3a', .1); b.put(GEO.ball, k * .16, .1, -.24, '#c85a3a', .1); }
      for (const [z, h] of [[.08, .2], [-.12, .24], [-.32, .18]]) b.put(GEO.cone, 0, .64 + h / 2, z, '#ff3f6a', [.07, h, .07]); eyes(b, .72, .1, .48, .06); cheeks(b, .6, .18, .45); } },
  pebbleturtle: { name: 'Pebbles', planet: 'mars', pet: true, move: 'slide', v: .5, r: 2, size: .95, voice: 'Hello, slowly!', where: 'by the big rocks', emoji: '🐢',
    build: b => { b.put(GEO.ball, 0, .26, 0, '#7fe0a0', [.36, .2, .42]); b.put(GEO.ball, 0, .3, .44, '#9ff0b8', [.14, .13, .14]); for (const [x, z] of [[-.25, .25], [.25, .25], [-.25, -.25], [.25, -.25]]) b.put(GEO.ball, x, .08, z, '#9ff0b8', [.09, .08, .1]);
      b.put(GEO.ball, 0, .38, -.02, '#b8573a', [.34, .2, .38]); for (const [x, z, c] of [[0, 0, '#ffd23f'], [-.16, .12, '#62f0ff'], [.16, .12, '#ff6fd8'], [-.14, -.16, '#c9a6ff'], [.14, -.16, '#7dffb0']]) b.put(GEO.ball, x, .55, z, c, [.07, .05, .07]); eyes(b, .36, .07, .56, .04); } },
  emberbug: { name: 'Ember', planet: 'mars', pet: true, move: 'float', v: 1.6, r: 3, size: .8, hover: .7, voice: 'Bzzz, glow!', where: 'near the cave', emoji: '🐞',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#ff6a3c', [.3, .22, .34]); b.put(GEO.ball, 0, .02, .02, '#ffd23f', [.04, .2, .3]); for (const [x, z] of [[-.15, .1], [.15, .1], [-.13, -.14], [.13, -.14]]) b.put(GEO.ball, x, .18, z, '#3a1a1a', .06);
      b.put(GEO.ball, 0, .02, .32, '#3a1a1a', [.16, .14, .12]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .3, .16, -.02, '#fff3d6', [.2, .03, .12], [0, 0, k * .4]); b.put(GEO.cyl, k * .06, .2, .4, '#3a1a1a', [.012, .14, .012], [.5, 0, 0]); } eyes(b, .06, .07, .42, .045, '#ffffff'); } },
  marsmoth: { name: 'Dusk', planet: 'mars', pet: true, move: 'float', v: 1.4, r: 2.5, size: .85, hover: 1.1, voice: 'Flutter flutter!', where: 'by the glass dome', emoji: '🦋',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#c9a6ff', [.12, .12, .3]); b.put(GEO.ball, 0, .02, .28, '#e9dfff', .13); for (const k of [-1, 1]) { b.put(GEO.ball, k * .3, .08, .05, '#ffb36e', [.28, .03, .2], [0, k * .2, k * .3]); b.put(GEO.ball, k * .26, .02, -.18, '#ff8fb0', [.2, .03, .14], [0, -k * .2, k * .2]); b.put(GEO.ball, k * .3, .1, .06, '#fff3d6', .05); b.put(GEO.cyl, k * .06, .2, .36, '#9a7ad8', [.01, .16, .01], [.4, 0, -k * .3]); b.put(GEO.ball, k * .09, .28, .4, '#ffd23f', .03); }
      eyes(b, .06, .06, .38, .04); } },
  sandsnake: { name: 'Wiggles', planet: 'mars', pet: true, move: 'slide', v: .8, r: 2.5, size: .9, voice: 'Wiggle wiggle!', where: 'in the soft sand', emoji: '🐛',
    build: b => { for (let i = 0; i < 6; i++) b.put(GEO.ball, Math.sin(i * 1.1) * .08, .14, .3 - i * .17, ['#ffb36e', '#ffd23f', '#ffb36e', '#ffd23f', '#ffb36e', '#ffd23f'][i], .16 - i * .012); b.put(GEO.ball, 0, .2, .42, '#ffc888', .17); for (const k of [-1, 1]) b.put(GEO.cyl, k * .07, .4, .44, '#e08a4a', [.012, .12, .012]); eyes(b, .26, .07, .56, .045); smile(b, .16, .57, .035); } },
  // ---- MERCURY: characters ----
  mirrormo: { name: 'Mo', planet: 'mercury', move: 'hop', v: 2.6, r: 0, size: 1, hopH: .2, voice: 'Copy you! Copy you!',
    build: b => { b.put(GEO.ball, 0, .55, 0, '#d8e4f4', [.36, .44, .3]); b.put(GEO.ball, 0, .6, .18, '#f4f8ff', [.26, .32, .16]); b.put(GEO.ball, -.1, .74, .3, '#ffffff', [.06, .1, .02]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .15, .08, .05, '#a8b8d0', [.1, .08, .14]); b.put(GEO.ball, k * .38, .55, 0, '#c8d4e8', [.08, .16, .08], [0, 0, k * .5]); }
      b.put(GEO.tor, 0, 1.06, 0, '#ffd23f', [.12, .12, .5], [Math.PI / 2, 0, 0]); eyes(b, .66, .13, .3, .07); cheeks(b, .52, .24, .28); smile(b, .5, .31, .05); } },
  sunny: { name: 'Sunny', planet: 'mercury', move: 'none', v: 0, r: 0, size: 1, voice: 'Sunshine for you!',
    build: b => { b.put(GEO.cyl, 0, .4, 0, '#7fe0a0', [.05, .8, .05]); for (const k of [-1, 1]) b.put(GEO.ball, k * .16, .35, 0, '#7fe0a0', [.14, .04, .07], [0, 0, k * .4]); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; b.put(GEO.ball, Math.cos(a) * .3, .95 + Math.sin(a) * .3, 0, i % 2 ? '#ffd23f' : '#ffb000', [.12, .07, .04], [0, 0, a]); }
      b.put(GEO.ball, 0, .95, .02, '#ff9a2e', [.2, .2, .08]); eyes(b, 1, .07, .09, .045); smile(b, .9, .1, .04); } },
  pebblefolk: { name: 'Pip-Pebble', planet: 'mercury', move: 'hop', v: 1.4, r: 3, size: 1, hopH: .12, voice: 'Clickety clack!',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#9a8a7a', [.32, .3, .3]); b.put(GEO.ball, 0, .72, 0, '#b8a898', [.24, .22, .22]); b.put(GEO.ball, 0, 1.0, 0, '#d8c8b8', [.14, .12, .14]); for (const [x, y, z] of [[.2, .4, .2], [-.18, .25, .22], [.1, .78, .18]]) b.put(GEO.ball, x, y, z, '#ffb36e', .05);
      eyes(b, .76, .09, .2, .055); smile(b, .66, .21, .04); } },
  // ---- MERCURY: pets ----
  cinderpuff: { name: 'Cinder', planet: 'mercury', pet: true, move: 'float', v: 1.6, r: 2.5, size: .8, hover: .8, voice: 'Toasty!', where: 'near the warm rocks', emoji: '🔥',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#ff8a3c', .3); b.put(GEO.ball, 0, -.04, .06, '#ffd23f', [.22, .2, .22]); for (const [x, y] of [[0, .32], [-.14, .26], [.14, .26]]) b.put(GEO.cone, x, y, -.02, '#ff6a3c', [.07, .18, .07]); eyes(b, .04, .1, .27, .05); cheeks(b, -.06, .17, .25); smile(b, -.08, .28, .04); } },
  quartzkit: { name: 'Quartz', planet: 'mercury', pet: true, move: 'hop', v: 2, r: 2.5, size: .9, voice: 'Mew, sparkle!', where: 'by the shiny stones', emoji: '🐱',
    build: b => { b.put(GEO.ball, 0, .34, -.05, '#e8e0ff', [.28, .24, .36]); b.put(GEO.ball, 0, .62, .22, '#f4f0ff', [.24, .22, .22]); for (const k of [-1, 1]) { b.put(GEO.cone, k * .15, .86, .2, '#c9a6ff', [.08, .16, .06], [0, 0, -k * .3]); b.put(GEO.ball, k * .14, .08, .12, '#d8ccff', .09); b.put(GEO.ball, k * .14, .08, -.24, '#d8ccff', .09); b.put(GEO.cyl, k * .16, .54, .42, '#c9a6ff', [.005, .14, .005], [0, 0, Math.PI / 2 + k * .2]); }
      b.put(GEO.cone, 0, .58, -.5, '#c9a6ff', [.06, .3, .06], [-1, 0, 0]); b.put(GEO.ball, 0, .56, .42, '#ffb3d0', .03); eyes(b, .66, .1, .41, .06, '#5a3ab0'); } },
  glowpebble: { name: 'Glow', planet: 'mercury', pet: true, move: 'roll', v: 1.2, r: 2, size: .7, voice: 'Bloop bloop!', where: 'on the stony path', emoji: '🪨',
    build: b => { b.put(GEO.ball, 0, .32, 0, '#ffe9a8', [.34, .3, .32]); b.put(GEO.ball, .12, .48, .12, '#fff8e0', [.1, .06, .08]); eyes(b, .38, .11, .3, .06); cheeks(b, .26, .2, .29); smile(b, .25, .32, .05); } },
  flicker: { name: 'Flicker', planet: 'mercury', pet: true, move: 'float', v: 1.8, r: 3, size: .75, hover: .6, voice: 'Zip zap!', where: 'flying round the funhouse', emoji: '✨',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#ffd23f', [.18, .16, .26]); b.put(GEO.ball, 0, 0, -.24, '#fff3a6', [.16, .14, .16]); b.put(GEO.ball, 0, .02, .24, '#3a2a1a', .13); for (const k of [-1, 1]) { b.put(GEO.ball, k * .2, .14, 0, '#dff4ff', [.18, .02, .1], [0, 0, k * .5]); b.put(GEO.cyl, k * .05, .14, .3, '#3a2a1a', [.01, .12, .01], [.5, 0, 0]); } eyes(b, .04, .06, .34, .04, '#ffffff'); } },
  sparkmouse: { name: 'Sparky', planet: 'mercury', pet: true, move: 'hop', v: 2.6, r: 3, size: .75, hopH: .18, voice: 'Squeak squeak!', where: 'near the funhouse door', emoji: '🐭',
    build: b => { b.put(GEO.ball, 0, .26, 0, '#b8c8e0', [.22, .2, .3]); b.put(GEO.ball, 0, .34, .28, '#c8d8f0', [.16, .15, .18]); b.put(GEO.ball, 0, .32, .46, '#ff9fc8', .035); for (const k of [-1, 1]) { b.put(GEO.ball, k * .15, .5, .22, '#d8e4f8', [.11, .11, .03]); b.put(GEO.ball, k * .15, .5, .23, '#ffc8dc', [.07, .07, .02]); }
      for (let i = 0; i < 4; i++) b.put(GEO.ball, Math.sin(i) * .05, .2 + i * .04, -.32 - i * .1, ['#ffe36e', '#ff9a2e', '#ffe36e', '#ffffff'][i], .05 - i * .006); eyes(b, .38, .08, .4, .045); } },
  lanternowl: { name: 'Blink', planet: 'mercury', pet: true, move: 'float', v: 1.2, r: 2, size: .85, hover: .9, voice: 'Hoo hoo, glow!', where: 'at the end of the funhouse', emoji: '🦉',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#c8a070', [.3, .34, .28]); b.put(GEO.ball, 0, -.06, .14, '#fff3c8', [.2, .22, .16]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .13, .12, .24, '#fff8e0', .1); b.put(GEO.cone, k * .16, .36, 0, '#a07a4a', [.06, .14, .06], [0, 0, -k * .3]); b.put(GEO.ball, k * .3, -.02, 0, '#a07a4a', [.08, .22, .14], [0, 0, k * .3]); }
      b.put(GEO.cone, 0, .02, .3, '#ffb000', [.04, .08, .04], [Math.PI, 0, 0]); b.put(GEO.ball, 0, -.42, 0, '#ffe36e', [.08, .1, .08]); eyes(b, .12, .13, .32, .055); } },
  // ---- VENUS: characters ----
  nimbus: { name: 'Nimbus', planet: 'venus', move: 'float', v: 1.2, r: 3, size: 1, hover: 1.4, voice: 'Pitter patter!',
    build: b => { for (const [x, y, z, r] of [[0, 0, 0, .42], [-.36, -.06, 0, .3], [.36, -.06, 0, .3], [-.18, .2, -.05, .3], [.2, .22, -.05, .28]]) b.put(GEO.ball, x, y, z, '#fff6fb', r); b.put(GEO.ball, 0, -.1, .2, '#ffe8f2', [.32, .22, .2]);
      for (const k of [-1, 0, 1]) b.put(GEO.ball, k * .22, -.5 - Math.abs(k) * .05, .05, '#9fd8ff', [.05, .09, .05]); eyes(b, 0, .13, .38, .065); cheeks(b, -.12, .24, .36); smile(b, -.13, .4, .05); } },
  puffo: { name: 'Puffo', planet: 'venus', move: 'hop', v: 1.6, r: 3, size: .9, hopH: .2, voice: 'Peekaboo!',
    build: b => { for (const [x, y, z, r] of [[0, .4, 0, .34], [-.2, .3, .08, .2], [.2, .3, .08, .2], [0, .66, -.04, .22]]) b.put(GEO.ball, x, y, z, '#f4d8ff', r); for (const k of [-1, 1]) b.put(GEO.ball, k * .14, .08, .08, '#e2c0f4', [.1, .07, .12]); eyes(b, .48, .11, .32, .065); cheeks(b, .36, .2, .31); b.put(GEO.ball, 0, .34, .33, '#c26aa8', [.05, .04, .02]); } },
  coral: { name: 'Coral', planet: 'venus', move: 'hop', v: 1, r: 2, size: 1, hopH: .1, voice: 'La la laaa!',
    build: b => { b.put(GEO.cone, 0, .45, 0, '#ff9a6e', [.36, .9, .36]); b.put(GEO.ball, 0, 1.02, 0, '#ffc8a0', .26); for (let i = 0; i < 6; i++) { const a = -1.2 + i * .48; b.put(GEO.ball, Math.sin(a) * .3, 1.3 + Math.cos(a) * .12, -.05, ['#ff6f9a', '#ffb36e', '#ffd23f', '#ff6f9a', '#ffb36e', '#ffd23f'][i], [.08, .14, .06], [0, 0, -a]); }
      for (const k of [-1, 1]) b.put(GEO.ball, k * .3, .6, .05, '#ffb38a', [.07, .2, .07], [0, 0, k * .6]); eyes(b, 1.06, .09, .23, .055); b.put(GEO.ball, 0, .94, .25, '#c2405a', [.06, .07, .03]); } },
  // ---- VENUS: pets ----
  mistlamb: { name: 'Fluff', planet: 'venus', pet: true, move: 'hop', v: 1.8, r: 2.5, size: .9, voice: 'Baa, puff!', where: 'in the soft mist', emoji: '🐑',
    build: b => { for (const [x, y, z, r] of [[0, .4, 0, .28], [-.16, .42, .14, .18], [.16, .42, .14, .18], [-.16, .42, -.16, .18], [.16, .42, -.16, .18], [0, .55, 0, .2]]) b.put(GEO.ball, x, y, z, '#fffaff', r); b.put(GEO.ball, 0, .5, .32, '#ffd8e8', [.15, .14, .12]);
      for (const k of [-1, 1]) { b.put(GEO.ball, k * .16, .52, .3, '#ffc0d8', [.08, .04, .06], [0, 0, k * .6]); for (const z of [.14, -.16]) b.put(GEO.cyl, k * .13, .12, z, '#ffd8e8', [.04, .24, .04]); } eyes(b, .54, .07, .43, .04); } },
  sunsetfly: { name: 'Flutter', planet: 'venus', pet: true, move: 'float', v: 1.6, r: 3, size: .85, hover: 1.2, voice: 'Flit flit!', where: 'among the clouds', emoji: '🦋',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#7a4a8a', [.07, .07, .24]); b.put(GEO.ball, 0, .02, .22, '#9a6aaa', .09); for (const k of [-1, 1]) { b.put(GEO.ball, k * .26, .06, .06, '#ff9a6e', [.24, .03, .2], [0, k * .2, k * .3]); b.put(GEO.ball, k * .22, 0, -.14, '#ff6f9a', [.17, .03, .14], [0, -k * .2, k * .2]); b.put(GEO.ball, k * .28, .08, .08, '#ffd23f', .05); b.put(GEO.cyl, k * .05, .14, .3, '#7a4a8a', [.01, .14, .01], [.5, 0, -k * .3]); } eyes(b, .04, .05, .29, .03, '#ffffff'); } },
  cloudkit: { name: 'Wisp', planet: 'venus', pet: true, move: 'float', v: 1.6, r: 2.5, size: .85, hover: .5, voice: 'Purr puff!', where: 'near the log ride', emoji: '🐱',
    build: b => { for (const [x, y, z, r] of [[0, .3, -.05, .26], [-.12, .25, -.2, .18], [.12, .25, -.2, .18]]) b.put(GEO.ball, x, y, z, '#ffffff', r); b.put(GEO.ball, 0, .5, .2, '#ffffff', .22); for (const k of [-1, 1]) { b.put(GEO.cone, k * .13, .72, .2, '#ffe8f6', [.07, .14, .05], [0, 0, -k * .3]); b.put(GEO.cyl, k * .14, .44, .38, '#e8d8f0', [.005, .12, .005], [0, 0, Math.PI / 2 + k * .2]); }
      b.put(GEO.ball, 0, .36, -.42, '#ffffff', [.12, .12, .14]); b.put(GEO.ball, 0, .46, .4, '#ffb3d0', .03); eyes(b, .54, .09, .38, .055, '#4a6ab0'); } },
  airfish: { name: 'Bubbles', planet: 'venus', pet: true, move: 'float', v: 1.4, r: 3, size: .85, hover: 1, voice: 'Blub blub!', where: 'swimming in the sky', emoji: '🐠',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#ffb36e', [.2, .24, .3]); b.put(GEO.cone, 0, 0, -.38, '#ff6f9a', [.18, .2, .04], [Math.PI / 2, 0, Math.PI / 2]); b.put(GEO.cone, 0, .26, -.02, '#ff6f9a', [.05, .14, .12]); for (const k of [-1, 1]) b.put(GEO.ball, k * .2, -.06, .02, '#ffd23f', [.03, .08, .1], [0, k * .4, 0]);
      b.put(GEO.ball, 0, -.06, .1, '#ffe8c8', [.14, .14, .2]); eyes(b, .06, .12, .22, .05); smile(b, -.06, .29, .03); } },
  dewdrop: { name: 'Drip', planet: 'venus', pet: true, move: 'hop', v: 1.6, r: 2, size: .7, hopH: .3, voice: 'Plip plop!', where: 'by the splash pool', emoji: '💧',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#7fd8ff', [.3, .3, .3]); b.put(GEO.cone, 0, .66, 0, '#7fd8ff', [.18, .34, .18]); b.put(GEO.ball, -.1, .44, .2, '#e0f8ff', [.06, .1, .03]); eyes(b, .34, .1, .28, .055); cheeks(b, .24, .18, .27); smile(b, .22, .29, .04); } },
  puffbird: { name: 'Puffin', planet: 'venus', pet: true, move: 'hop', v: 2, r: 3, size: .8, hopH: .25, voice: 'Tweet tweet!', where: 'on the high clouds', emoji: '🐦',
    build: b => { b.put(GEO.ball, 0, .34, 0, '#6ac8ff', [.3, .3, .28]); b.put(GEO.ball, 0, .3, .12, '#fff3d6', [.22, .22, .18]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .28, .36, -.02, '#3aa0e0', [.06, .16, .14], [0, 0, k * .3]); b.put(GEO.cyl, k * .1, .04, .04, '#ffb000', [.02, .08, .02]); }
      b.put(GEO.cone, 0, .38, .32, '#ffb000', [.06, .12, .06], [Math.PI / 2, 0, 0]); b.put(GEO.cone, 0, .66, -.05, '#3aa0e0', [.05, .14, .05], [-.3, 0, 0]); eyes(b, .46, .1, .25, .05); } },
  // ---- JUPITER: characters ----
  zappy: { name: 'Zappy', planet: 'jupiter', move: 'float', v: 2, r: 4, size: .9, hover: 1.3, voice: 'Zip zap!',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#6a7ad8', [.3, .28, .3]); for (const [x, y, z, r] of [[-.2, .14, -.05, .2], [.2, .14, -.05, .2], [0, .26, -.08, .2]]) b.put(GEO.ball, x, y, z, '#8a98e8', r); for (const k of [-1, 1]) b.put(GEO.cone, k * .12, -.34, 0, '#ffe36e', [.05, .2, .05], [0, 0, k * .4 + Math.PI]);
      b.put(GEO.cone, 0, .5, 0, '#ffe36e', [.06, .2, .06], [0, 0, .5]); eyes(b, .04, .1, .27, .06, '#ffffff'); smile(b, -.08, .29, .04); } },
  swirly: { name: 'Swirly', planet: 'jupiter', move: 'hop', v: 1.4, r: 3, size: 1, hopH: .12, voice: 'Round and round!',
    build: b => { b.put(GEO.ball, 0, .45, 0, '#e8925a', [.4, .36, .38]); for (let i = 0; i < 3; i++) b.put(GEO.tor, 0, .45, .12 + i * .06, ['#c2502a', '#f0b080', '#ff6a3c'][i], [.3 - i * .08, .3 - i * .08, .4]); for (const k of [-1, 1]) b.put(GEO.ball, k * .2, .08, .06, '#c87040', [.12, .08, .14]);
      eyes(b, .62, .12, .34, .06); smile(b, .5, .36, .045); } },
  bigpuff: { name: 'Big Puff', planet: 'jupiter', move: 'float', v: .8, r: 3, size: 1.5, hover: 2.4, voice: 'Hellooo, little one!',
    build: b => { for (const [x, y, z, r] of [[0, 0, 0, .5], [-.45, -.05, 0, .36], [.45, -.05, 0, .36], [-.22, .26, -.06, .34], [.24, .28, -.06, .32], [0, -.2, .1, .4]]) b.put(GEO.ball, x, y, z, '#fff8f0', r); for (const k of [-1, 1]) b.put(GEO.ball, k * .68, -.05, -.05, '#fff0e0', [.18, .08, .14], [0, 0, k * .4]);
      eyes(b, .06, .14, .46, .07); cheeks(b, -.08, .27, .44); smile(b, -.1, .48, .06); } },
  // ---- JUPITER: pets ----
  balloonpup: { name: 'Bobble', planet: 'jupiter', pet: true, move: 'float', v: 1.8, r: 2.5, size: .85, hover: .9, voice: 'Squeak arf!', where: 'floating near the swings', emoji: '🎈',
    build: b => { b.put(GEO.ball, 0, 0, -.05, '#ff6fae', [.24, .22, .3]); b.put(GEO.ball, 0, .14, .24, '#ff8fc0', .2); for (const k of [-1, 1]) { b.put(GEO.ball, k * .16, .3, .2, '#ff6fae', [.07, .14, .07]); b.put(GEO.ball, k * .12, -.2, .1, '#ff6fae', .07); b.put(GEO.ball, k * .12, -.2, -.2, '#ff6fae', .07); }
      b.put(GEO.ball, 0, .1, -.4, '#ff6fae', [.06, .06, .1]); b.put(GEO.cyl, 0, -.4, -.05, '#ffffff', [.006, .4, .006]); b.put(GEO.ball, -.06, .2, .34, '#ffffff', [.04, .06, .02]); eyes(b, .18, .08, .38, .045); } },
  jellyfloat: { name: 'Wobble', planet: 'jupiter', pet: true, move: 'float', v: 1.2, r: 2.5, size: .85, hover: 1.1, voice: 'Wibble wobble!', where: 'drifting in the clouds', emoji: '🪼',
    build: b => { b.put(GEO.ball, 0, .1, 0, '#c9a6ff', [.3, .24, .3]); b.put(GEO.ball, 0, .02, 0, '#e2d0ff', [.28, .1, .28]); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.put(GEO.cyl, Math.cos(a) * .16, -.22, Math.sin(a) * .16, ['#ff9fd8', '#9fd8ff', '#c9a6ff', '#ffe36e', '#7fe0a0'][i], [.02, .34, .02]); } eyes(b, .14, .1, .27, .05); smile(b, .04, .29, .035); } },
  thunderchick: { name: 'Bolt', planet: 'jupiter', pet: true, move: 'hop', v: 2.4, r: 3, size: .75, hopH: .3, voice: 'Peep peep zap!', where: 'by the big slide', emoji: '🐥',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#ffe36e', [.26, .26, .24]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .24, .32, -.02, '#ffd23f', [.05, .12, .1], [0, 0, k * .4]); b.put(GEO.cyl, k * .08, .04, .02, '#ff9a2e', [.02, .08, .02]); }
      b.put(GEO.cone, 0, .3, .26, '#ff9a2e', [.05, .1, .05], [Math.PI / 2, 0, 0]); for (const [x, h] of [[-.06, .16], [.04, .22]]) b.put(GEO.cone, x, .6 + h / 2, 0, '#5aa8ff', [.04, h, .03], [0, 0, x * 4]); eyes(b, .38, .09, .21, .045); } },
  cloudcub: { name: 'Nimbo', planet: 'jupiter', pet: true, move: 'hop', v: 1.6, r: 2.5, size: .9, hopH: .12, voice: 'Grr, cuddle!', where: 'on the cloud islands', emoji: '🐻',
    build: b => { for (const [x, y, z, r] of [[0, .32, 0, .28], [0, .62, .1, .22], [-.16, .8, .08, .08], [.16, .8, .08, .08], [-.16, .1, .1, .1], [.16, .1, .1, .1], [-.22, .4, .12, .09], [.22, .4, .12, .09]]) b.put(GEO.ball, x, y, z, '#f4f8ff', r); b.put(GEO.ball, 0, .56, .28, '#dfe8ff', [.1, .08, .06]); b.put(GEO.ball, 0, .6, .32, '#3a3a5a', .03); eyes(b, .68, .08, .27, .04); } },
  windkite: { name: 'Kite', planet: 'jupiter', pet: true, move: 'float', v: 2, r: 3, size: .85, hover: 1.4, voice: 'Whee, wind!', where: 'high on the lookout', emoji: '🪁',
    build: b => { b.put(GEO.box || GEO.ball, 0, 0, 0, '#ff6f9a', [.32, .32, .03], [0, 0, Math.PI / 4]); b.put(GEO.ball, 0, 0, .02, '#ffd23f', [.12, .12, .02]); for (let i = 0; i < 4; i++) b.put(GEO.ball, Math.sin(i * 1.3) * .05, -.32 - i * .12, 0, ['#5aa8ff', '#7fe0a0', '#ffe36e', '#ff9fd8'][i], [.05, .03, .02]); eyes(b, .05, .07, .05, .04); smile(b, -.06, .06, .03); } },
  windbunny: { name: 'Gusty', planet: 'jupiter', pet: true, move: 'hop', v: 2.2, r: 3, size: .8, hopH: .32, voice: 'Hop, whoosh!', where: 'by the rocket', emoji: '🐇',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#d8f0ff', [.24, .24, .28]); b.put(GEO.ball, 0, .56, .14, '#e8f8ff', .2); for (const k of [-1, 1]) { b.put(GEO.ball, k * .09, .9, .1, '#b8e0ff', [.05, .2, .04], [0, 0, -k * .5]); b.put(GEO.ball, k * .12, .06, .14, '#b8e0ff', [.07, .05, .1]); } b.put(GEO.ball, 0, .3, -.28, '#ffffff', .09);
      for (const k of [-1, 1]) b.put(GEO.tor, k * .3, .62, 0, '#ffffff', [.08, .08, .2], [0, Math.PI / 2, 0]); eyes(b, .6, .08, .31, .045); b.put(GEO.ball, 0, .52, .33, '#ff9fc8', .025); } },
  // ---- SATURN: characters ----
  ringo: { name: 'Ringo', planet: 'saturn', move: 'hop', v: 1.2, r: 2.5, size: 1, hopH: .14, voice: 'Hula hoop!',
    build: b => { b.put(GEO.ball, 0, .6, 0, '#ffd8a0', [.3, .42, .28]); b.put(GEO.ball, 0, 1.08, 0, '#ffe8c0', .24); b.put(GEO.tor, 0, .55, 0, '#c9a6ff', [.48, .48, .5], [Math.PI / 2, 0, 0]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .12, .14, .05, '#e8b880', [.1, .14, .12]); b.put(GEO.ball, k * .34, .8, 0, '#ffd8a0', [.07, .18, .07], [0, 0, k * .9]); }
      eyes(b, 1.12, .09, .21, .05); cheeks(b, 1.02, .15, .2); smile(b, 1, .23, .04); } },
  shimmer: { name: 'Shimmer', planet: 'saturn', move: 'float', v: 1.5, r: 3, size: .85, hover: 1.5, voice: 'Make a wish!',
    build: b => { b.put(starGeo, 0, 0, 0, '#fff3a6', [.36, .36, .36]); b.put(GEO.ball, 0, 0, -.1, '#ffd23f', .2); for (let i = 0; i < 3; i++) b.put(GEO.ball, -.3 - i * .14, -.04 - i * .05, -.12, ['#ffffff', '#c9a6ff', '#9fd8ff'][i], .07 - i * .015); eyes(b, .04, .11, .18, .05); smile(b, -.07, .18, .035); } },
  zoomer: { name: 'Zoomer', planet: 'saturn', move: 'roll', v: 2.4, r: 3, size: .9, voice: 'Vroom vroom!',
    build: b => { b.put(GEO.ball, 0, .36, 0, '#5aa8ff', [.36, .32, .4]); b.put(GEO.ball, 0, .5, .12, '#cfefff', [.2, .14, .16]); for (const k of [-1, 1]) for (const z of [-.24, .24]) b.put(GEO.cyl, k * .3, .14, z, '#3a3a5a', [.13, .06, .13], [0, 0, Math.PI / 2]);
      b.put(GEO.cone, 0, .7, -.1, '#ff6f9a', [.05, .16, .05]); eyes(b, .5, .1, .34, .055); smile(b, .38, .38, .04); } },
  // ---- SATURN: pets ----
  halopup: { name: 'Halo', planet: 'saturn', pet: true, move: 'hop', v: 2, r: 2.5, size: .9, voice: 'Arf, sparkle!', where: 'near the landing', emoji: '😇',
    build: b => { b.put(GEO.ball, 0, .36, -.05, '#fff3d6', [.3, .26, .38]); b.put(GEO.ball, 0, .64, .24, '#fff3d6', [.25, .24, .24]); b.put(GEO.ball, 0, .58, .44, '#ffe0b0', [.1, .08, .08]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .24, .64, .2, '#ffc880', [.08, .18, .1], [0, 0, k * .5]); b.put(GEO.ball, k * .16, .1, .14, '#ffe8c0', .1); b.put(GEO.ball, k * .16, .1, -.24, '#ffe8c0', .1); }
      b.put(GEO.tor, 0, 1.0, .2, '#ffd23f', [.18, .18, .4], [Math.PI / 2, 0, 0]); eyes(b, .7, .1, .46, .06); cheeks(b, .6, .18, .44); } },
  cometkit: { name: 'Streak', planet: 'saturn', pet: true, move: 'hop', v: 2.6, r: 3, size: .85, hopH: .2, voice: 'Yip, zoom!', where: 'by the Star Blaster', emoji: '🦊',
    build: b => { b.put(GEO.ball, 0, .34, -.05, '#ff9a5a', [.26, .24, .34]); b.put(GEO.ball, 0, .6, .22, '#ff9a5a', [.22, .21, .21]); b.put(GEO.ball, 0, .52, .4, '#ffffff', [.09, .07, .08]); for (const k of [-1, 1]) { b.put(GEO.cone, k * .14, .84, .2, '#ff9a5a', [.07, .18, .05], [0, 0, -k * .3]); b.put(GEO.ball, k * .14, .08, .12, '#e87a3a', .08); }
      for (let i = 0; i < 4; i++) b.put(GEO.ball, Math.sin(i * .8) * .04, .44 + i * .05, -.42 - i * .14, ['#ffd23f', '#ffffff', '#c9a6ff', '#9fd8ff'][i], .12 - i * .02); b.put(GEO.ball, 0, .56, .46, '#3a2030', .03); eyes(b, .66, .09, .38, .05); } },
  skystar: { name: 'Starla', planet: 'saturn', pet: true, move: 'float', v: 1.4, r: 2.5, size: .8, hover: .9, voice: 'Twinkle!', where: 'among the rings', emoji: '⭐',
    build: b => { b.put(starGeo, 0, 0, 0, '#ff9fc8', [.42, .42, .3]); for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * Math.PI * 2 / 5; b.put(GEO.ball, Math.cos(a) * .26, Math.sin(a) * .26, .1, '#ffd8ec', .04); } eyes(b, .06, .1, .14, .05); smile(b, -.06, .15, .035); } },
  icechip: { name: 'Chip', planet: 'saturn', pet: true, move: 'hop', v: 1.8, r: 2.5, size: .85, voice: 'Mew, clink!', where: 'on the icy ring rocks', emoji: '🐱',
    build: b => { b.put(GEO.box, 0, .3, 0, '#dff4ff', [.42, .4, .44], [0, .3, 0]); b.put(GEO.box, 0, .62, .1, '#e8f8ff', [.34, .3, .3], [0, -.2, 0]); for (const k of [-1, 1]) { b.put(GEO.cone, k * .12, .86, .1, '#c8e8ff', [.07, .14, .05]); b.put(GEO.cyl, k * .14, .56, .3, '#9fc8e8', [.005, .12, .005], [0, 0, Math.PI / 2 + k * .2]); } b.put(GEO.ball, 0, .56, .28, '#ffb3d0', .025); eyes(b, .66, .08, .26, .05, '#3a6ab0'); } },
  ringbird: { name: 'Loop', planet: 'saturn', pet: true, move: 'hop', v: 2, r: 3, size: .8, hopH: .25, voice: 'Tweet, loop!', where: 'by the Ring Raceway', emoji: '🐦',
    build: b => { b.put(GEO.ball, 0, .34, 0, '#c9a6ff', [.26, .28, .26]); b.put(GEO.ball, 0, .3, .12, '#f0e8ff', [.18, .2, .16]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .26, .36, -.02, '#a07ad8', [.06, .14, .12], [0, 0, k * .3]); b.put(GEO.cyl, k * .08, .05, .03, '#ffb000', [.02, .08, .02]); }
      b.put(GEO.cone, 0, .38, .3, '#ffb000', [.05, .1, .05], [Math.PI / 2, 0, 0]); b.put(GEO.tor, 0, .4, -.36, '#ffd23f', [.16, .16, .3], [0, Math.PI / 2, 0]); eyes(b, .46, .09, .23, .045); } },
  gemmouse: { name: 'Gem', planet: 'saturn', pet: true, move: 'hop', v: 2.4, r: 3, size: .8, hopH: .16, voice: 'Squeak, shine!', where: 'by the rocket', emoji: '🐭',
    build: b => { b.put(GEO.ball, 0, .26, 0, '#f0d8c0', [.22, .2, .3]); b.put(GEO.ball, 0, .34, .28, '#f8e4d0', [.16, .15, .18]); b.put(GEO.ball, 0, .32, .46, '#ff9fc8', .035); for (const k of [-1, 1]) b.put(GEO.ball, k * .15, .52, .22, ['#62f0ff', '#ff6fd8'][(k + 1) / 2], [.1, .1, .04]);
      b.put(GEO.cyl, 0, .2, -.42, '#e8c8a8', [.012, .3, .012], [1.2, 0, 0]); eyes(b, .38, .08, .4, .045); } },
  // ---- URANUS: characters ----
  frosty: { name: 'Frosty', planet: 'uranus', move: 'float', v: 1.4, r: 3, size: .9, hover: 1.2, voice: 'Brr, sparkle!',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#dff4ff', .3); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.put(GEO.cone, Math.cos(a) * .36, Math.sin(a) * .36, -.04, '#9fe6ff', [.05, .2, .05], [0, 0, a - Math.PI / 2]); } eyes(b, .04, .1, .27, .055, '#3a6ab0'); cheeks(b, -.06, .18, .25); smile(b, -.08, .28, .04); } },
  skatey: { name: 'Skatey', planet: 'uranus', move: 'roll', v: 2, r: 3, size: .95, voice: 'Wheee, glide!',
    build: b => { b.put(GEO.ball, 0, .5, 0, '#3a4a6a', [.3, .38, .28]); b.put(GEO.ball, 0, .46, .14, '#ffffff', [.22, .3, .18]); b.put(GEO.ball, 0, .9, 0, '#3a4a6a', .2); b.put(GEO.cone, 0, .88, .2, '#ffb000', [.05, .1, .05], [Math.PI / 2, 0, 0]); b.put(GEO.tor, 0, .76, 0, '#ff4f6a', [.2, .2, .5], [Math.PI / 2, 0, 0]);
      for (const k of [-1, 1]) { b.put(GEO.box, k * .1, .04, .06, '#c8d8e8', [.06, .02, .3]); b.put(GEO.ball, k * .1, .1, .04, '#ffb000', [.08, .05, .1]); } eyes(b, .96, .07, .17, .04); } },
  snowman: { name: 'Brrr', planet: 'uranus', move: 'none', v: 0, r: 0, size: 1, voice: 'Achoo!',
    build: b => { b.put(GEO.ball, 0, .38, 0, '#ffffff', .4); b.put(GEO.ball, 0, .92, 0, '#ffffff', .3); b.put(GEO.ball, 0, 1.36, 0, '#ffffff', .22); b.put(GEO.cone, 0, 1.36, .26, '#ff9a2e', [.04, .16, .04], [Math.PI / 2, 0, 0]); b.put(GEO.tor, 0, 1.18, 0, '#5aa8ff', [.2, .2, .5], [Math.PI / 2, 0, 0]);
      b.put(GEO.cyl, 0, 1.62, 0, '#3a2a5a', [.16, .14, .16]); for (const y of [.8, .95]) b.put(GEO.ball, 0, y, .29, '#3a2a5a', .03); for (const k of [-1, 1]) b.put(GEO.cyl, k * .42, .95, 0, '#8a5a3a', [.02, .32, .02], [0, 0, k * 1]); eyes(b, 1.42, .08, .19, .035); smile(b, 1.28, .2, .05); } },
  // ---- URANUS: pets ----
  icepup: { name: 'Flurry', planet: 'uranus', pet: true, move: 'hop', v: 2, r: 2.5, size: .9, voice: 'Arf, brrr!', where: 'by the ice castle', emoji: '🐶',
    build: b => { b.put(GEO.ball, 0, .36, -.05, '#e0f4ff', [.3, .26, .38]); b.put(GEO.ball, 0, .64, .24, '#e0f4ff', [.25, .24, .24]); b.put(GEO.ball, 0, .58, .44, '#c0e0f8', [.1, .08, .08]); for (const k of [-1, 1]) { b.put(GEO.cone, k * .16, .88, .2, '#9fd8ff', [.08, .16, .05], [0, 0, -k * .3]); b.put(GEO.ball, k * .16, .1, .14, '#c8e8ff', .1); b.put(GEO.ball, k * .16, .1, -.24, '#c8e8ff', .1); }
      b.put(GEO.ball, 0, .62, .48, '#3a5a8a', .035); b.put(GEO.cone, 0, .5, -.45, '#9fd8ff', [.06, .2, .06], [-1, 0, 0]); eyes(b, .7, .1, .46, .06); } },
  snowflake: { name: 'Flake', planet: 'uranus', pet: true, move: 'float', v: 1.3, r: 2.5, size: .8, hover: 1, voice: 'Tinkle!', where: 'floating over the rink', emoji: '❄️',
    build: b => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.put(GEO.box, Math.cos(a) * .2, Math.sin(a) * .2, 0, '#dff4ff', [.42, .06, .04], [0, 0, a]); b.put(GEO.box, Math.cos(a) * .32, Math.sin(a) * .32, 0, '#ffffff', [.04, .14, .04], [0, 0, a]); } b.put(GEO.ball, 0, 0, .02, '#ffffff', [.16, .16, .08]); eyes(b, .04, .06, .08, .035); smile(b, -.04, .1, .025); } },
  polarcub: { name: 'Polar', planet: 'uranus', pet: true, move: 'hop', v: 1.6, r: 2.5, size: .9, hopH: .12, voice: 'Grr, snow!', where: 'in the snow', emoji: '🐻‍❄️',
    build: b => { b.put(GEO.ball, 0, .34, -.04, '#ffffff', [.3, .28, .36]); b.put(GEO.ball, 0, .64, .2, '#ffffff', .24); for (const k of [-1, 1]) { b.put(GEO.ball, k * .17, .84, .16, '#ffffff', .08); b.put(GEO.ball, k * .17, .84, .18, '#ffd8e8', .045); b.put(GEO.ball, k * .17, .1, .14, '#f0f4f8', .11); b.put(GEO.ball, k * .17, .1, -.22, '#f0f4f8', .11); }
      b.put(GEO.ball, 0, .58, .42, '#f0f4f8', [.11, .09, .08]); b.put(GEO.ball, 0, .62, .48, '#2a2a3a', .035); eyes(b, .72, .09, .4, .05); } },
  babypenguin: { name: 'Slider', planet: 'uranus', pet: true, move: 'hop', v: 1.4, r: 2.5, size: .8, hopH: .08, voice: 'Squeak squeak!', where: 'near the skating rink', emoji: '🐧',
    build: b => { b.put(GEO.ball, 0, .36, 0, '#4a5a7a', [.26, .34, .24]); b.put(GEO.ball, 0, .34, .1, '#ffffff', [.18, .26, .16]); b.put(GEO.ball, 0, .7, 0, '#4a5a7a', .2); b.put(GEO.ball, 0, .66, .12, '#ffffff', [.14, .12, .1]); b.put(GEO.cone, 0, .66, .24, '#ffb000', [.04, .08, .04], [Math.PI / 2, 0, 0]);
      for (const k of [-1, 1]) { b.put(GEO.ball, k * .26, .38, 0, '#4a5a7a', [.05, .16, .1], [0, 0, k * .3]); b.put(GEO.ball, k * .1, .04, .08, '#ffb000', [.07, .03, .1]); } eyes(b, .74, .07, .17, .035); } },
  sealpup: { name: 'Mitten', planet: 'uranus', pet: true, move: 'slide', v: .9, r: 2.5, size: .9, voice: 'Ar ar!', where: 'by the frozen pond', emoji: '🦭',
    build: b => { b.put(GEO.ball, 0, .2, -.1, '#e8eef8', [.24, .2, .42]); b.put(GEO.ball, 0, .36, .26, '#f4f8ff', .2); b.put(GEO.ball, 0, .32, .44, '#ffffff', [.09, .07, .06]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .22, .08, .14, '#d8e4f4', [.12, .03, .07], [0, k * .5, 0]); b.put(GEO.cyl, k * .06, .32, .48, '#c8d4e4', [.005, .1, .005], [0, 0, Math.PI / 2 + k * .3]); }
      b.put(GEO.ball, 0, .14, -.52, '#d8e4f4', [.16, .03, .08]); b.put(GEO.ball, 0, .36, .5, '#2a2a3a', .03); eyes(b, .42, .09, .4, .055); } },
  icefly: { name: 'Tinsel', planet: 'uranus', pet: true, move: 'float', v: 1.8, r: 3, size: .8, hover: 1.1, voice: 'Bzz, shimmer!', where: 'by the ice tunnels', emoji: '🪰',
    build: b => { for (let i = 0; i < 4; i++) b.put(GEO.ball, 0, 0, .12 - i * .12, ['#62c8ff', '#7fd8ff', '#9fe6ff', '#c8f0ff'][i], .08 - i * .01); b.put(GEO.ball, 0, .02, .22, '#62c8ff', .1); for (const k of [-1, 1]) for (const z of [.06, -.08]) b.put(GEO.ball, k * .22, .08, z, '#e8f8ff', [.2, .02, .06], [0, k * .2, 0]);
      eyes(b, .06, .06, .3, .04); } },
  // ---- NEPTUNE: characters (build 115) ----
  whirly: { name: 'Whirly', planet: 'neptune', move: 'float', v: 1.8, r: 3, size: .95, hover: .5, voice: 'Whoosh whoosh!',
    build: b => { for (let i = 0; i < 5; i++) b.put(GEO.tor, Math.sin(i * 1.3) * .04, .12 + i * .2, 0, ['#cfe0ff', '#b0ccff', '#8fb4ff', '#6f9cff', '#5a88f0'][i], [.1 + i * .07, .1 + i * .07, .5], [Math.PI / 2, 0, 0]);
      b.put(GEO.ball, 0, 1.2, 0, '#e8f0ff', .26); eyes(b, 1.26, .09, .22, .05, '#2440b0'); cheeks(b, 1.16, .16, .22); smile(b, 1.1, .24, .04); } },
  glowjelly: { name: 'Bloop', planet: 'neptune', move: 'float', v: .9, r: 2.5, size: 1.1, hover: 1.4, voice: 'Bloop bloop, glow!',
    build: b => { b.put(GEO.ball, 0, .1, 0, '#62c8ff', [.42, .3, .42]); b.put(GEO.ball, 0, .02, 0, '#bff0ff', [.34, .2, .34]); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.put(GEO.cyl, Math.cos(a) * .22, -.3, Math.sin(a) * .22, ['#9fe6ff', '#c9a6ff', '#ff9fd8'][i % 3], [.025, .5, .025], [Math.sin(a) * .15, 0, Math.cos(a) * .15]); }
      for (let i = 0; i < 5; i++) b.put(GEO.ball, Math.cos(i * 1.26) * .3, .22, Math.sin(i * 1.26) * .3, '#ffffff', .035); eyes(b, .14, .11, .4, .055, '#12308a'); smile(b, .02, .4, .04); } },
  windwhale: { name: 'Echo', planet: 'neptune', move: 'float', v: 1, r: 3, size: 1.1, hover: 1.3, voice: 'Ooo-weee-ooo!',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#3a6ae8', [.36, .32, .62]); b.put(GEO.ball, 0, -.1, .06, '#cfe0ff', [.28, .2, .5]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .34, -.1, .12, '#2f58d0', [.2, .04, .1], [0, k * .4, k * -.4]); b.put(GEO.ball, k * .16, .02, -.78, '#2f58d0', [.18, .04, .1], [0, k * .5, 0]); }
      b.put(GEO.cone, 0, .02, -.6, '#3a6ae8', [.12, .3, .1], [-Math.PI / 2, 0, 0]); b.put(GEO.ball, 0, .34, -.1, '#9fd8ff', .05); eyes(b, .08, .2, .52, .05); cheeks(b, -.04, .26, .5); smile(b, -.1, .3, .05); } },
  // ---- NEPTUNE: pets (glowing blue floaters, a wind puppy, a wave bunny and a storm kitten) ----
  gloworb: { name: 'Glowbe', planet: 'neptune', pet: true, move: 'float', v: 1.4, r: 2.5, size: .8, hover: 1, voice: 'Hum, glow!', where: 'near the landing', emoji: '🔵',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#62a8ff', .26); b.put(GEO.ball, 0, 0, 0, '#bfe0ff', [.3, .06, .3]); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; b.put(GEO.ball, Math.cos(a) * .4, Math.sin(a) * .18, Math.sin(a) * .2, '#e8f4ff', .05); } eyes(b, .04, .08, .23, .045, '#12308a'); smile(b, -.06, .23, .03); } },
  bluejelly: { name: 'Drifty', planet: 'neptune', pet: true, move: 'float', v: 1, r: 2.5, size: .8, hover: 1.1, voice: 'Wibble!', where: 'drifting in the wind', emoji: '🪼',
    build: b => { b.put(GEO.ball, 0, .1, 0, '#7f9cff', [.26, .2, .26]); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4; b.put(GEO.cyl, Math.cos(a) * .12, -.16, Math.sin(a) * .12, '#c9d8ff', [.02, .32, .02]); } b.put(GEO.ball, 0, .2, .1, '#e0e8ff', .06); eyes(b, .08, .08, .24, .04); cheeks(b, .02, .13, .22); } },
  windpup: { name: 'Breezy', planet: 'neptune', pet: true, move: 'hop', v: 2.4, r: 3, size: .9, voice: 'Arf, whoosh!', where: 'by the windsock', emoji: '🐶',
    build: b => { b.put(GEO.ball, 0, .36, -.05, '#8fb4ff', [.3, .26, .38]); b.put(GEO.ball, 0, .64, .24, '#a8c4ff', [.25, .24, .24]); b.put(GEO.ball, 0, .58, .44, '#e0e8ff', [.1, .08, .08]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .2, .74, .02, '#5a82f0', [.07, .08, .24], [-.5, 0, k * .3]); b.put(GEO.ball, k * .16, .1, .14, '#cfe0ff', .1); b.put(GEO.ball, k * .16, .1, -.24, '#cfe0ff', .1); }
      b.put(GEO.ball, 0, .62, .48, '#1a2a5a', .035); b.put(GEO.ball, 0, .5, -.46, '#ffffff', [.08, .08, .16], [-.6, 0, 0]); eyes(b, .7, .1, .46, .06); } },
  seadragon: { name: 'Swish', planet: 'neptune', pet: true, move: 'float', v: 1.6, r: 3, size: .85, hover: .9, voice: 'Swish swish!', where: 'by the icy geyser', emoji: '🐉',
    build: b => { for (let i = 0; i < 5; i++) b.put(GEO.ball, 0, Math.sin(i * 1.2) * .08, .24 - i * .16, ['#4ad8d0', '#3ac8d8', '#3ab0e0', '#4a98e8', '#5a82f0'][i], .15 - i * .02); b.put(GEO.ball, 0, .1, .36, '#5ae8d8', [.14, .13, .16]); b.put(GEO.ball, 0, .06, .5, '#bff8f0', [.07, .05, .06]);
      for (let i = 0; i < 4; i++) b.put(GEO.cone, 0, .18 + Math.sin(i * 1.2) * .08, .18 - i * .16, '#ffd23f', [.035, .09, .035]); for (const k of [-1, 1]) b.put(GEO.ball, k * .16, .04, .12, '#bff8f0', [.12, .02, .06], [0, k * .4, 0]); eyes(b, .16, .08, .44, .04); } },
  wavebun: { name: 'Ripple', planet: 'neptune', pet: true, move: 'hop', v: 2.2, r: 3, size: .8, hopH: .3, voice: 'Boing, splish!', where: 'past the Big Sky Dive', emoji: '🐰',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#9fd8ff', [.26, .26, .3]); b.put(GEO.ball, 0, .58, .14, '#b8e4ff', .2); for (const k of [-1, 1]) { b.put(GEO.ball, k * .09, .86, .1, '#9fd8ff', [.06, .22, .05], [0, 0, k * -.25]); b.put(GEO.ball, k * .09, .86, .12, '#ffffff', [.03, .16, .03], [0, 0, k * -.25]); b.put(GEO.ball, k * .13, .06, .14, '#e0f4ff', .08); }
      b.put(GEO.ball, 0, .3, -.32, '#ffffff', .1); b.put(GEO.ball, 0, .55, .34, '#ff9fc8', .03); eyes(b, .62, .08, .3, .045); } },
  stormcat: { name: 'Misty', planet: 'neptune', pet: true, move: 'hop', v: 2, r: 2.5, size: .85, hopH: .14, voice: 'Mew, rumble!', where: 'by the rocket', emoji: '🐱',
    build: b => { b.put(GEO.ball, 0, .3, -.04, '#6a7ab8', [.26, .24, .34]); b.put(GEO.ball, 0, .6, .18, '#7a8ac8', .22); for (const k of [-1, 1]) { b.put(GEO.cone, k * .12, .84, .16, '#6a7ab8', [.07, .14, .05]); b.put(GEO.ball, k * .14, .08, .12, '#cfd8ff', .08); b.put(GEO.cyl, k * .14, .54, .38, '#e0e8ff', [.005, .12, .005], [0, 0, Math.PI / 2 + k * .2]); }
      b.put(GEO.cyl, 0, .5, -.38, '#6a7ab8', [.03, .36, .03], [-.8, 0, 0]); b.put(GEO.ball, 0, .74, -.6, '#ffe36e', .05); b.put(GEO.ball, 0, .55, .38, '#ffb3d0', .025); eyes(b, .66, .08, .36, .05, '#ffd23f'); } },
  // ---- (build 131) THE UPSIDE-DOWN WORLD: pets (a bunny that floats upside down, a jelly drop that drips UP) ----
  flipbun: { name: 'Topsy', planet: 'upside', pet: true, move: 'float', v: 1.4, r: 2.5, size: .8, hover: 1.1, voice: 'Boing! Down is up!', where: 'in Upside-Down Town', emoji: '🐰',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#e8d8ff', [.27, .27, .3]); b.put(GEO.ball, 0, .02, .1, '#f4ecff', .2); for (const k of [-1, 1]) { b.put(GEO.ball, k * .09, -.24, .08, '#e8d8ff', [.06, .2, .05], [0, 0, k * .25]); b.put(GEO.ball, k * .09, -.24, .1, '#ffb3e6', [.03, .14, .03], [0, 0, k * .25]); b.put(GEO.ball, k * .13, .55, .12, '#d0c0ff', .08); }
      b.put(GEO.ball, 0, .3, -.32, '#ffffff', .1); eyes(b, -.02, .08, .27, .045); cheeks(b, .08, .15, .25); } },
  dropsy: { name: 'Dropsy', planet: 'upside', pet: true, move: 'float', v: 1.6, r: 2.5, size: .75, hover: 1.3, voice: 'Blip! I drip UP!', where: 'under the hanging castle', emoji: '💧',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#7fe0ff', [.3, .3, .3]); b.put(GEO.cone, 0, .38, 0, '#7fe0ff', [.2, .4, .2]); b.put(GEO.ball, -.1, .08, .2, '#e0fbff', .07); eyes(b, -.02, .1, .26, .05); cheeks(b, -.12, .17, .24); smile(b, -.12, .27, .04); } },
  // ---- (build 132) THE GIANT TOY UNIVERSE: pets (a wind-up mouse with its key, and a puppy made of toy blocks) ----
  windmouse: { name: 'Clicky', planet: 'toy', pet: true, move: 'slide', v: 1.6, r: 2.5, size: .8, voice: 'Click click, squeak!', where: 'by the toy train', emoji: '🐭',
    build: b => { b.put(GEO.ball, 0, .26, 0, '#c0c4d4', [.24, .22, .36]); b.put(GEO.ball, 0, .34, .3, '#c0c4d4', [.16, .15, .16]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .13, .52, .26, '#ffb3d0', [.09, .09, .03]); b.put(GEO.ball, k * .13, .06, .16, '#8a8ea0', .06); b.put(GEO.ball, k * .13, .06, -.18, '#8a8ea0', .06); }
      b.put(GEO.ball, 0, .34, .46, '#ff6f9a', .035); b.put(GEO.cyl, 0, .55, -.1, '#ffd23f', [.03, .3, .03]); b.put(GEO.cyl, 0, .72, -.1, '#ffd23f', [.14, .03, .14], [Math.PI / 2, 0, 0]); b.put(GEO.cyl, 0, .2, -.42, '#c0c4d4', [.02, .3, .02], [Math.PI / 2.4, 0, 0]); eyes(b, .4, .07, .43, .04); } },
  blockpup: { name: 'Blocky', planet: 'toy', pet: true, move: 'hop', v: 2, r: 2.5, size: .85, voice: 'Arf! Clack clack!', where: 'near the train station', emoji: '🐶',
    build: b => { b.put(GEO.box, 0, .38, -.05, '#ffd23f', [.42, .34, .56]); b.put(GEO.box, 0, .66, .26, '#ff4f6a', [.34, .32, .3]); b.put(GEO.box, 0, .6, .45, '#fff3c4', [.18, .14, .12]); b.put(GEO.ball, 0, .64, .52, '#2a2333', .035);
      for (const k of [-1, 1]) { b.put(GEO.box, k * .2, .84, .22, '#4fb0ff', [.08, .18, .12]); b.put(GEO.box, k * .14, .1, .14, '#5fd36a', [.12, .2, .12]); b.put(GEO.box, k * .14, .1, -.22, '#5fd36a', [.12, .2, .12]); } b.put(GEO.box, 0, .5, -.38, '#b07cff', [.08, .08, .22]); eyes(b, .72, .09, .42, .045); } },
  // ---- (build 133) THE BUBBLE UNIVERSE: pets (a little fish that swims in its own bubble, and a soap-foam puppy) ----
  bubblefish: { name: 'Glub', planet: 'bubble', pet: true, move: 'float', v: 1.4, r: 2.5, size: .8, hover: 1.2, voice: 'Glub glub, bloop!', where: 'by the bubble houses', emoji: '🐟',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#ff9a5c', [.26, .2, .14]); b.put(GEO.cone, -.3, 0, 0, '#ffd23f', [.13, .2, .06], [0, 0, Math.PI / 2]); b.put(GEO.ball, .02, .16, 0, '#ffd23f', [.12, .06, .03]); b.put(GEO.ball, .14, .05, .1, '#ffffff', .05); b.put(GEO.ball, .16, .05, .14, '#2a2333', .028); b.put(GEO.ball, .2, -.06, .1, '#ff6f9a', .025); } },
  foamy: { name: 'Foamy', planet: 'bubble', pet: true, move: 'bounce', v: 1.6, r: 2.5, size: .85, voice: 'Arf! Fluffy foam!', where: 'near the bubble slide', emoji: '🐶',
    build: b => { for (let i = 0; i < 9; i++) { const a = i * 2.4; b.put(GEO.ball, Math.cos(a) * .2, .32 + Math.sin(i * 1.7) * .12, Math.sin(a) * .18, '#ffffff', .16); } b.put(GEO.ball, 0, .62, .2, '#ffffff', .2); for (const k of [-1, 1]) { b.put(GEO.ball, k * .17, .7, .16, '#e8f4ff', [.07, .14, .07]); b.put(GEO.ball, k * .1, .08, .12, '#f0f8ff', .07); }
      b.put(GEO.ball, 0, .58, .4, '#ff9ad8', .035); b.put(GEO.ball, .25, .9, 0, '#c8e8ff', .06); b.put(GEO.ball, -.2, 1, -.1, '#ffc8e8', .045); eyes(b, .68, .08, .37, .045); } },
  // ---- (build 136) THE SQUISHY JELLY WORLD: pets (a wobbly gummy bear and a little jelly blob) ----
  gummybear: { name: 'Gummy', planet: 'jelly', pet: true, move: 'hop', v: 1.8, r: 2.5, size: .8, hopH: .3, voice: 'Wibble wobble!', where: 'near the wobbly bridge', emoji: '🐻',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#ff6f4f', [.26, .3, .22]); b.put(GEO.ball, 0, .66, .04, '#ff6f4f', .22); for (const k of [-1, 1]) { b.put(GEO.ball, k * .16, .84, 0, '#ff6f4f', .08); b.put(GEO.ball, k * .22, .36, .06, '#ff6f4f', [.08, .14, .08]); b.put(GEO.ball, k * .12, .04, .05, '#ff6f4f', [.1, .07, .12]); }
      b.put(GEO.ball, 0, .6, .22, '#ff9a80', [.1, .07, .06]); b.put(GEO.ball, 0, .62, .27, '#2a2333', .03); b.put(GEO.ball, -.1, .8, .14, '#ffd0c0', .05); eyes(b, .7, .08, .2, .04); } },
  jellyblob: { name: 'Wiggle', planet: 'jelly', pet: true, move: 'bounce', v: 1.6, r: 2.5, size: .8, voice: 'Blorp! Jiggle jiggle!', where: 'by the jelly tower', emoji: '⭐',
    build: b => { b.put(GEO.ball, 0, .26, 0, '#7fe05a', [.32, .26, .3]); b.put(GEO.ball, 0, .5, 0, '#9ff07a', [.18, .14, .16]); b.put(GEO.ball, -.12, .38, .22, '#e0ffd0', .05); eyes(b, .34, .1, .26, .05); smile(b, .2, .29, .05); } },
  // ---- (build 137) THE WACKY GRAVITY WORLD: pets (a zooming spring bug and a fox who floats) ----
  zoomzoom: { name: 'Zoom', planet: 'wacky', pet: true, move: 'bounce', v: 1.8, r: 2.5, size: .8, voice: 'Zoom zoom! Boing!', where: 'by the gravity wheel', emoji: '🐞',
    build: b => { b.put(GEO.ball, 0, .34, 0, '#ff9a2e', [.3, .24, .32]); b.put(GEO.ball, 0, .36, .02, '#2a2333', [.04, .25, .33]); for (const q of [[-.14, .44, .14], [.14, .44, .14], [-.16, .32, -.12], [.12, .3, -.1]]) b.put(GEO.ball, ...q, '#2a2333', .05);
      b.put(GEO.ball, 0, .5, .26, '#4fd8c8', .16); for (const k of [-1, 1]) { b.put(GEO.ball, k * .08, .74, .3, '#4fd8c8', [.02, .12, .02]); b.put(GEO.ball, k * .1, .86, .3, '#ffd23f', .045); b.put(GEO.ball, k * .16, .08, 0, '#b07cff', [.05, .08, .05]); } eyes(b, .54, .07, .4, .04); smile(b, .44, .41, .04); } },
  floatyfox: { name: 'Floaty', planet: 'wacky', pet: true, move: 'float', v: 1.2, r: 2.5, size: .85, hover: 1, voice: 'Wheee! I can float!', where: 'floating near the flip corridor', emoji: '🦊',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#b07cff', [.24, .22, .3]); b.put(GEO.ball, 0, .56, .2, '#b07cff', .2); b.put(GEO.ball, 0, .5, .38, '#ffffff', [.1, .07, .08]); b.put(GEO.ball, 0, .52, .45, '#2a2333', .03);
      for (const k of [-1, 1]) { b.put(GEO.cone, k * .12, .78, .18, '#b07cff', [.07, .14, .05]); b.put(GEO.ball, k * .14, .12, .1, '#c8b8ff', .06); } b.put(GEO.ball, 0, .36, -.36, '#4fd8c8', [.12, .12, .2]); b.put(GEO.ball, 0, .4, -.52, '#ffffff', .07); eyes(b, .6, .08, .36, .04); } },
  // ---- PLUTO: characters (build 116) ----
  snowballkid: { name: 'Snowy', planet: 'pluto', move: 'hop', v: 1.6, r: 3, size: 1, hopH: .2, voice: 'Snowball fight!',
    build: b => { b.put(GEO.ball, 0, .34, 0, '#f4f8ff', .34); b.put(GEO.ball, 0, .82, 0, '#ffffff', .26); b.put(GEO.ball, 0, 1.06, 0, '#ff6f9a', [.24, .12, .24]); b.put(GEO.ball, 0, 1.2, 0, '#ffffff', .07); b.put(GEO.tor, 0, .62, 0, '#ff6f9a', [.18, .18, .5], [Math.PI / 2, 0, 0]);
      for (const k of [-1, 1]) { b.put(GEO.ball, k * .36, .5, .04, '#f4f8ff', [.1, .1, .1]); b.put(GEO.ball, k * .4, .5, .04, '#ff6f9a', .07); } eyes(b, .88, .08, .23, .045); cheeks(b, .8, .15, .22); smile(b, .74, .25, .04); } },
  heartling: { name: 'Lovey', planet: 'pluto', move: 'float', v: 1.2, r: 3, size: .9, hover: 1.1, voice: 'I love you!',
    build: b => { for (const k of [-1, 1]) b.put(GEO.ball, k * .15, .1, 0, '#ff9fc8', [.22, .22, .18]); b.put(GEO.cone, 0, -.14, 0, '#ff9fc8', [.3, .38, .17], [Math.PI, 0, 0]); b.put(GEO.ball, 0, .02, .06, '#ffd8ec', [.2, .18, .14]);
      for (let i = 0; i < 4; i++) b.put(GEO.ball, Math.cos(i * 1.57) * .42, .1 + Math.sin(i * 1.57) * .3, -.05, '#ffffff', .035); eyes(b, .1, .09, .2, .045); smile(b, -.02, .21, .035); } },
  charondot: { name: 'Dot', planet: 'pluto', move: 'roll', v: 2, r: 3, size: .85, voice: 'Dance with me!',
    build: b => { b.put(GEO.ball, 0, .4, 0, '#b8a8a0', .38); b.put(GEO.ball, 0, .66, -.04, '#8a3a30', [.3, .14, .3]); for (let i = 0; i < 4; i++) b.put(GEO.ball, Math.cos(i * 2.1) * .3, .3 + (i % 2) * .14, Math.sin(i * 2.1) * .2 + .1, '#9a8a80', .07);
      eyes(b, .48, .1, .34, .055); cheeks(b, .38, .2, .32); smile(b, .32, .36, .04); } },
  // ---- PLUTO: pets (frost fluffs and snowball pups) ----
  frostfluff: { name: 'Fuzzy', planet: 'pluto', pet: true, move: 'bounce', v: 1.4, r: 2.5, size: .8, voice: 'Fluff fluff!', where: 'near the landing', emoji: '⚪',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#f4f8ff', .28); for (let i = 0; i < 10; i++) { const a = i * 2.4, y = .3 + Math.cos(i * 1.7) * .22; b.put(GEO.ball, Math.cos(a) * .24, y, Math.sin(a) * .2, i % 2 ? '#ffffff' : '#e0ecff', .1); } eyes(b, .36, .08, .27, .05); cheeks(b, .28, .15, .26); } },
  snowpup: { name: 'Snowball', planet: 'pluto', pet: true, move: 'hop', v: 2, r: 2.5, size: .9, voice: 'Arf arf, snow!', where: 'by the bouncy castles', emoji: '🐶',
    build: b => { b.put(GEO.ball, 0, .34, -.04, '#ffffff', .3); b.put(GEO.ball, 0, .66, .22, '#ffffff', .24); b.put(GEO.ball, 0, .6, .42, '#f0f4fa', [.1, .08, .08]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .22, .72, .14, '#ffd0e0', [.07, .16, .07], [0, 0, k * .4]); b.put(GEO.ball, k * .16, .08, .14, '#f0f4fa', .1); b.put(GEO.ball, k * .16, .08, -.22, '#f0f4fa', .1); }
      b.put(GEO.ball, 0, .64, .48, '#3a2a3a', .035); b.put(GEO.ball, 0, .4, -.36, '#ffffff', .1); b.put(GEO.tor, 0, .5, .18, '#5aa8ff', [.16, .16, .4], [Math.PI / 2, 0, 0]); eyes(b, .72, .1, .44, .055); } },
  heartbun: { name: 'Cuddles', planet: 'pluto', pet: true, move: 'hop', v: 2, r: 3, size: .8, hopH: .3, voice: 'Boing, cuddle!', where: 'by the big ice heart', emoji: '🐰',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#fff0f6', [.26, .26, .3]); b.put(GEO.ball, 0, .58, .14, '#fff4f8', .2); for (const k of [-1, 1]) { b.put(GEO.ball, k * .09, .86, .1, '#fff0f6', [.06, .22, .05], [0, 0, k * -.25]); b.put(GEO.ball, k * .09, .86, .12, '#ffb3d0', [.03, .16, .03], [0, 0, k * -.25]); b.put(GEO.ball, k * .13, .06, .14, '#ffe0ec', .08);
        b.put(GEO.ball, k * .05, .34, .26, '#ff6f9a', .05); } b.put(GEO.cone, 0, .28, .27, '#ff6f9a', [.07, .07, .04], [Math.PI, 0, 0]); b.put(GEO.ball, 0, .3, -.32, '#ffffff', .1); eyes(b, .62, .08, .3, .045); } },
  icehamster: { name: 'Nibbles', planet: 'pluto', pet: true, move: 'hop', v: 2.2, r: 2.5, size: .75, hopH: .1, voice: 'Squeak, nibble!', where: 'by the squish maze', emoji: '🐹',
    build: b => { b.put(GEO.ball, 0, .28, 0, '#f2c8a8', [.3, .27, .32]); b.put(GEO.ball, 0, .24, .12, '#fff4ec', [.22, .2, .22]); for (const k of [-1, 1]) { b.put(GEO.ball, k * .2, .52, .06, '#f2c8a8', .08); b.put(GEO.ball, k * .2, .52, .08, '#ffc0d0', .045); b.put(GEO.ball, k * .16, .3, .26, '#ffe0d0', .07); }
      b.put(GEO.ball, 0, .34, .32, '#ff9fb8', .03); b.put(GEO.ball, 0, .14, .32, '#dff4ff', [.08, .06, .05]); eyes(b, .4, .1, .27, .045); } },
  icesquirrel: { name: 'Nutty', planet: 'pluto', pet: true, move: 'hop', v: 2.6, r: 3, size: .8, hopH: .26, voice: 'Chitter chatter!', where: 'among the ice spires', emoji: '🐿️',
    build: b => { b.put(GEO.ball, 0, .3, 0, '#c8b8d8', [.2, .26, .2]); b.put(GEO.ball, 0, .58, .06, '#d8c8e8', .17); b.put(GEO.ball, 0, .28, .12, '#f4f0ff', [.13, .18, .1]); for (const k of [-1, 1]) { b.put(GEO.cone, k * .1, .78, .04, '#c8b8d8', [.05, .1, .04]); b.put(GEO.ball, k * .1, .06, .06, '#b8a8c8', .07); }
      b.put(GEO.ball, 0, .5, -.28, '#dcd0ff', [.16, .3, .14], [-.4, 0, 0]); b.put(GEO.ball, 0, .78, -.36, '#f4f0ff', .1); b.put(GEO.ball, 0, .3, .24, '#9fd8ff', [.07, .08, .06]); eyes(b, .6, .07, .17, .04); } },
  babyyak: { name: 'Yaki', planet: 'pluto', pet: true, move: 'hop', v: 1.2, r: 2.5, size: .95, hopH: .08, voice: 'Mooo, fluffy!', where: 'by the inflatable park', emoji: '🐂',
    build: b => { b.put(GEO.ball, 0, .38, -.04, '#d8c0a8', [.32, .3, .4]); for (let i = 0; i < 6; i++) b.put(GEO.ball, (i % 3 - 1) * .2, .2, -.2 + Math.floor(i / 3) * .3, '#c8a888', [.14, .2, .14]); b.put(GEO.ball, 0, .56, .34, '#e8d4c0', .2); b.put(GEO.ball, 0, .5, .5, '#f4e0d0', [.12, .09, .08]);
      for (const k of [-1, 1]) { b.put(GEO.cone, k * .16, .78, .34, '#fff4d8', [.04, .14, .04], [0, 0, -k * .6]); b.put(GEO.ball, k * .14, .06, .2, '#a88868', .07); b.put(GEO.ball, k * .14, .06, -.24, '#a88868', .07); } b.put(GEO.ball, 0, .74, .34, '#c8a888', [.14, .07, .1]); eyes(b, .62, .1, .5, .05); } },
  // ---- EARTH (the Whispering Woods): characters (build 117) ----
  puffball: { name: 'Puffy', planet: 'earth', move: 'float', v: 1, r: 2.5, size: 1, hover: .9, voice: 'Pfff, wish!',
    build: b => { b.put(GEO.ball, 0, 0, 0, '#fffbe8', .3); for (let i = 0; i < 14; i++) { const a = i * 2.4, e = Math.acos(1 - 2 * (i + .5) / 14); const x = Math.sin(e) * Math.cos(a), y = Math.cos(e), z = Math.sin(e) * Math.sin(a); b.put(GEO.ball, x * .36, y * .36, z * .36, '#ffffff', .07); }
      b.put(GEO.cyl, 0, -.6, 0, '#7fc86a', [.025, .6, .025]); b.put(GEO.ball, .1, -.66, 0, '#7fc86a', [.12, .03, .06], [0, 0, .5]); eyes(b, .04, .09, .28, .05); cheeks(b, -.04, .16, .26); smile(b, -.08, .3, .035); } },
  shroomy: { name: 'Shroomy', planet: 'earth', move: 'bounce', v: 1.2, r: 2.5, size: 1, voice: 'Bounce on me!',
    build: b => { b.put(GEO.cyl, 0, .3, 0, '#fff4e0', [.2, .3, .2]); b.put(GEO.ball, 0, .66, 0, '#ff5a5a', [.48, .3, .48]); for (let i = 0; i < 6; i++) { const a = i * 1.05; b.put(GEO.ball, Math.cos(a) * .3, .84 - (i % 2) * .06, Math.sin(a) * .3, '#ffffff', .07); } b.put(GEO.ball, 0, .94, 0, '#ffffff', .08);
      for (const k of [-1, 1]) b.put(GEO.ball, k * .1, .02, .06, '#f0e0c8', [.09, .05, .12]); eyes(b, .36, .08, .2, .045); cheeks(b, .28, .15, .19); smile(b, .24, .21, .035); } },
  twiggy: { name: 'Twiggy', planet: 'earth', move: 'hop', v: 1.2, r: 2.5, size: 1.05, hopH: .12, voice: 'Grow, grow, grow!',
    build: b => { b.put(GEO.cyl, 0, .45, 0, '#9a6a3a', [.22, .45, .22]); b.put(GEO.cyl, 0, .92, 0, '#b07a4a', [.24, .03, .24]); for (let i = 0; i < 5; i++) b.put(GEO.cyl, 0, .92, 0, '#8a5a2a', [.19 - i * .035, .031, .19 - i * .035]); b.put(GEO.ball, 0, 1.1, 0, '#5fc86a', [.3, .2, .3]); b.put(GEO.ball, .14, 1.24, .08, '#ff9fd8', .07);
      for (const k of [-1, 1]) { b.put(GEO.cyl, k * .3, .62, 0, '#8a5a2a', [.03, .22, .03], [0, 0, k * .9]); b.put(GEO.ball, k * .42, .74, 0, '#7fd87a', .07); b.put(GEO.ball, k * .1, .04, .06, '#7a4a2a', [.08, .05, .12]); } eyes(b, .62, .08, .22, .05); smile(b, .48, .23, .045); } },
  // ---- EARTH: woodland pets and a fantasy foal ----
  hedgehog: { name: 'Prickles', planet: 'earth', pet: true, move: 'hop', v: 1.4, r: 2.5, size: .8, hopH: .06, voice: 'Snuffle snuffle!', where: 'in the Whispering Woods', emoji: '🦔',
    build: b => { b.put(GEO.ball, 0, .24, -.04, '#8a6a4a', [.3, .24, .32]); for (let i = 0; i < 14; i++) { const a = i * 2.4, e = .3 + (i % 5) * .25; b.put(GEO.cone, Math.cos(a) * Math.sin(e) * .26, .26 + Math.cos(e) * .22, -.06 + Math.sin(a) * Math.sin(e) * .26 - .04, '#6a4a2a', [.05, .16, .05], [Math.sin(a) * e, 0, -Math.cos(a) * e]); }
      b.put(GEO.ball, 0, .2, .24, '#f0d8b8', [.17, .14, .16]); b.put(GEO.cone, 0, .18, .42, '#f0d8b8', [.07, .14, .07], [Math.PI / 2, 0, 0]); b.put(GEO.ball, 0, .18, .5, '#2a1a1a', .035); eyes(b, .26, .08, .36, .04); } },
  fawn: { name: 'Dewey', planet: 'earth', pet: true, move: 'hop', v: 2, r: 3, size: .95, hopH: .2, voice: 'Mew, leap!', where: 'by the creek', emoji: '🦌',
    build: b => { b.put(GEO.ball, 0, .56, -.04, '#c8885a', [.22, .2, .36]); for (let i = 0; i < 5; i++) b.put(GEO.ball, (i % 2 ? .1 : -.1), .64, -.24 + i * .1, '#fff4e8', .035); b.put(GEO.ball, 0, .9, .26, '#c8885a', .17); b.put(GEO.ball, 0, .84, .42, '#e8c8a8', [.09, .07, .09]); b.put(GEO.ball, 0, .86, .5, '#2a1a1a', .03);
      for (const k of [-1, 1]) { b.put(GEO.ball, k * .17, 1.04, .2, '#c8885a', [.06, .12, .04], [0, 0, k * .8]); for (const z of [.18, -.24]) b.put(GEO.cyl, k * .12, .22, z, '#a8683a', [.035, .22, .035]); } b.put(GEO.ball, 0, .64, -.4, '#fff4e8', .06); eyes(b, .96, .08, .38, .05); } },
  ladybug: { name: 'Dotty', planet: 'earth', pet: true, move: 'hop', v: 1.6, r: 2.5, size: .7, hopH: .05, voice: 'Tick tick, hello!', where: 'on the berry bushes', emoji: '🐞',
    build: b => { b.put(GEO.ball, 0, .2, -.02, '#ff3a3a', [.3, .2, .34]); b.put(GEO.box, 0, .4, -.02, '#2a1a1a', [.02, .02, .6]); for (const [x, z] of [[-.14, .08], [.14, .08], [-.16, -.14], [.16, -.14], [0, -.26]]) b.put(GEO.ball, x, .36, z, '#2a1a1a', .06);
      b.put(GEO.ball, 0, .18, .32, '#2a1a1a', .14); for (const k of [-1, 1]) b.put(GEO.cyl, k * .06, .36, .4, '#2a1a1a', [.01, .14, .01], [.4, 0, k * .4]); eyes(b, .22, .07, .44, .045); } },
  raccoonkit: { name: 'Bandit', planet: 'earth', pet: true, move: 'hop', v: 2, r: 2.5, size: .85, hopH: .12, voice: 'Chirr, peekaboo!', where: 'near the foxes\' den', emoji: '🦝',
    build: b => { b.put(GEO.ball, 0, .32, -.04, '#9a9aa4', [.26, .24, .32]); b.put(GEO.ball, 0, .6, .18, '#a8a8b0', .22); b.put(GEO.ball, 0, .6, .34, '#3a3a44', [.2, .07, .08]); b.put(GEO.ball, 0, .52, .38, '#ffffff', [.09, .07, .08]); b.put(GEO.ball, 0, .54, .46, '#2a2a2a', .03);
      for (const k of [-1, 1]) { b.put(GEO.cone, k * .14, .82, .14, '#7a7a84', [.07, .12, .05]); b.put(GEO.ball, k * .14, .08, .12, '#5a5a64', .08); } for (let i = 0; i < 4; i++) b.put(GEO.ball, 0, .36 + i * .06, -.38 - i * .1, i % 2 ? '#3a3a44' : '#c8c8d0', .1); eyes(b, .62, .08, .38, .045); } },
  otterpup: { name: 'Splashy', planet: 'earth', pet: true, move: 'slide', v: 1.2, r: 2.5, size: .85, voice: 'Squeak, splash!', where: 'by the creek', emoji: '🦦',
    build: b => { b.put(GEO.ball, 0, .2, -.06, '#8a5a3a', [.2, .18, .42]); b.put(GEO.ball, 0, .3, .32, '#9a6a4a', .18); b.put(GEO.ball, 0, .26, .46, '#e8c8a8', [.1, .08, .06]); b.put(GEO.ball, 0, .3, .52, '#2a1a1a', .03); b.put(GEO.ball, 0, .14, .1, '#e8c8a8', [.14, .1, .26]);
      for (const k of [-1, 1]) { b.put(GEO.ball, k * .14, .44, .28, '#7a4a2a', .04); b.put(GEO.ball, k * .18, .06, .16, '#7a4a2a', [.07, .04, .08]); } b.put(GEO.cone, 0, .14, -.6, '#8a5a3a', [.08, .3, .05], [-Math.PI / 2, 0, 0]); eyes(b, .38, .08, .44, .045); } },
  unicornfoal: { name: 'Sparkle', planet: 'earth', pet: true, move: 'hop', v: 1.8, r: 3, size: .95, hopH: .18, voice: 'Neigh, sparkle!', where: 'on Balloon Hills', emoji: '🦄',
    build: b => { b.put(GEO.ball, 0, .56, -.04, '#ffffff', [.24, .22, .36]); b.put(GEO.ball, 0, .9, .26, '#ffffff', .18); b.put(GEO.ball, 0, .84, .44, '#ffe8f4', [.1, .08, .1]); b.put(GEO.cone, 0, 1.14, .3, '#ffd23f', [.04, .22, .04], [.3, 0, 0]);
      for (let i = 0; i < 4; i++) b.put(GEO.ball, 0, 1.02 - i * .1, .1 - i * .08, ['#ff9fd8', '#c9a6ff', '#9fd8ff', '#7fe0a0'][i], .08); for (const k of [-1, 1]) { b.put(GEO.cone, k * .1, 1.08, .18, '#ffffff', [.04, .08, .03]); for (const z of [.18, -.24]) b.put(GEO.cyl, k * .12, .22, z, '#fff4fa', [.04, .22, .04]); }
      for (let i = 0; i < 3; i++) b.put(GEO.ball, 0, .6 - i * .08, -.42 - i * .06, ['#ff9fd8', '#c9a6ff', '#9fd8ff'][i], .08); eyes(b, .96, .08, .38, .05); cheeks(b, .86, .14, .38); } },
};
export const PET_KINDS = Object.keys(SPECIES).filter(k => SPECIES[k].pet);

// one shared painted shape per species (made the first time it is needed, then reused)
const SHAPES = {};
// (stage 30) the residents' paint stays exactly as authored - the chalk, marker, doodle, keepsake and craft families are
// drawings, so their colours are part of the design and are asserted by tests. The soft look therefore comes from their
// own material only (lifeMat), never from editing vertex colours.
export function creatureMesh(kind) {
  const sp = SPECIES[kind]; if (!sp) return null;
  if (!SHAPES[kind]) { const b = makeBatch(), put = b.put.bind(b); b.put = (geo, x, y, z, col, sc, ...rest) => { if (geo === GEO.ball) { const m = Array.isArray(sc) ? Math.max(...sc) : sc; geo = m <= .075 ? GEO.dot : m <= .16 ? GEO.ballS : GEO.ball; } return put(geo, x, y, z, col, sc, ...rest); }; /* (build 117: lighter shapes, the same look) */ sp.build(b); SHAPES[kind] = b.geometry ? b.geometry() : b.mesh(shinyMat()).geometry; SHAPES[kind].userData.shared = true; }
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const m = new THREE.Mesh(SHAPES[kind], lifeMat()); m.castShadow = false; /* (build 108: no shadow pass: cheaper) */ m.scale.setScalar(sp.size || 1); body.add(m);
  g.userData.body = body; g.userData.kind = kind; g.userData.dynamic = true; return g;
}
// how a pet moves while following her (the 🐾 friends call this every frame)
export function animate(kind, g, t, moving) {
  const sp = SPECIES[kind], body = g.userData.body; if (!sp || !body) return; const ph = (g.userData.ph ??= Math.random() * 6);
  const breathe = 1 + Math.sin(t * 2.2 + ph) * .03; body.scale.set(1 / Math.sqrt(breathe), breathe, 1 / Math.sqrt(breathe));
  if (sp.move === 'float') body.position.y = (sp.hover || 1) + Math.sin(t * 2 + ph) * .12;
  else if (sp.move === 'hop' || sp.move === 'bounce') body.position.y = moving ? Math.abs(Math.sin(t * (sp.move === 'bounce' ? 7 : 10) + ph)) * (sp.hopH || .25) : 0;
  else if (sp.move === 'roll') { body.rotation.x = moving ? body.rotation.x + .12 : body.rotation.x * .9; body.position.y = 0; }
  else body.position.y = 0;
  if (sp.move === 'float') body.rotation.z = Math.sin(t * 1.6 + ph) * .12;
}

// ---------- creatures living on a planet (called from that planet's builder: built and freed with it) ----------
// spots: [[kind, x, z], ...] (x from the planet's start). k: the planet kit (add, U, tapIt, say, Sound, P, G, api, X, ground)
export function populate(k, spots) {
  const P = k.P, G = k.G, list = [];
  for (const [kind, dx, z] of spots) {
    const sp = SPECIES[kind]; if (!sp) continue;
    if (sp.pet && G.expansion && G.expansion.isPal && G.expansion.isPal(kind)) continue; // (already her friend: it is with her, or waits in 🐾)
    const g = creatureMesh(kind), x0 = k.X + dx; g.position.set(x0, 0, z); k.add(g);
    const c = { kind, sp, g, x0, home0: x0, z0: z, x: x0, z, tx: x0, tz: z, rest: 1 + Math.random() * 3, greeted: false, act: 0, look: 0, gone: false };
    k.tapIt(g, () => tapped(c), x0, sp.pet ? 'pet_' + kind : 'pal_' + kind); list.push(c);
  }
  const gY = (x, z) => (k.ground ? k.ground(x, z) : 0);
  function tapped(c) {
    if (c.gone) return; c.act = 1.2; k.Sound.giggle && k.Sound.giggle(); k.api.burst(c.g.position.x, c.g.position.y + 1, c.g.position.z, ['#ffffff', '#ffe36e', '#ff9fd8'], 12, 2);
    if (c.sp.pet) { befriend(k, c); return; }
    // the characters' little games
    if (c.sp.play) {
      // Family creations reuse the residents' existing motions, sounds and short-lived particles.
      const play = c.sp.play;
      k.say(`🖍️ ${play.line}`, true);
      if (play.action === 'twirl') { c.twirl = 2.5; k.Sound.chime && k.Sound.chime(); }
      else if (play.action === 'bounce') c.bounceBig = 2.2;
      else if (play.action === 'sing') [523, 659, 784, 659].forEach((f, i) => k.Sound.tone(f, .22, 'sine', .05, 1, i * .22));
      else {
        const hug = play.action === 'hug';
        k.api.burst(hug ? P.x : c.x, (hug ? P.y : c.g.position.y) + 1, hug ? (P.z || 0) : c.z,
          play.colors || ['#ff9fc8', '#ffe36e', '#ffffff'], 16, 1.6);
        k.Sound.chime && k.Sound.chime();
      }
    }
    else if (c.kind === 'chalkpink') { k.say('🖍️ Hello, friend! Let’s twirl and dance together!', true); c.twirl = 2.5; k.Sound.chime && k.Sound.chime(); }
    else if (c.kind === 'chalkgreen') { k.say('🖍️ Let’s play copycat! Walk and jump, and I’ll copy you!', true); c.copy = 12; }
    else if (c.kind === 'drawingblue') { k.say('🖍️ Let’s sing together! La la la!', true); [523, 659, 784, 659].forEach((f, i) => k.Sound.tone(f, .22, 'sine', .05, 1, i * .22)); c.act = 1.8; }
    else if (c.kind === 'drawingwave') { k.say('🖍️ Wave, wave! Let’s wave and twirl together!', true); c.twirl = 2.5; }
    else if (c.kind === 'drawinglonglegs') { k.say('🖍️ A big gentle hug for my friend! Hello, hello!', true); k.api.burst(P.x, P.y + 1, P.z || 0, ['#ff9fc8', '#ffffff', '#a7d8ad'], 16, 1.6); c.act = 1.8; }
    else if (c.kind === 'drawingteal') { k.say('🖍️ Boing, boing! Let’s jump together!', true); c.bounceBig = 2.2; }
    else if (c.kind === 'drawingscribble') { k.say('🖍️ Pink, green, and gold! Happy colorful sparkles!', true); k.api.burst(c.x, c.g.position.y + 1, c.z + .3, ['#dc66aa', '#b4d958', '#ffe36e', '#ffffff'], 20, 2); k.Sound.chime && k.Sound.chime(); c.act = 1.8; }
    else if (c.kind === 'rocky') { k.say(`🪨 ${c.sp.voice} Catch me if you can!`, true); c.tx = c.x + (P.x < c.x ? 8 : -8); c.run = 3; }
    else if (c.kind === 'lumi') { k.say('✨ Lumi lights up the stars for you!', true); for (let i = 0; i < 8; i++) k.api.burst(c.x + (i - 4) * 1.4, 3 + Math.sin(i) * 1.5, c.z - 1, ['#fff3a6', '#ffffff', '#9fe6ff'], 6, 1.4); k.Sound.chime && k.Sound.chime();
      const hidden = list.find(q => q.sp.pet && !q.gone && Math.abs(q.x - c.x) < 60); if (hidden) { c.tx = hidden.x - 1.5; c.lead = hidden; setTimeout(() => k.say(`✨ Look! ${hidden.sp.name} is over here!`, true), 1600); } }
    else if (c.kind === 'boing') { k.say('🦘 Boing boing! Jump with me!', true); c.bounceBig = 2.2; }
    else if (c.kind === 'mirrormo') { k.say('🪞 Copy you! Walk and jump, and Mo does it too!', true); c.copy = 12; }
    else if (c.kind === 'sunny') { k.say('🌻 Sunny shines for you!', true); c.spin = 2; for (let i = 0; i < 10; i++) k.api.burst(c.x + Math.cos(i * .63) * 1.2, 1.4 + Math.sin(i * .63) * 1.2, c.z, ['#ffd23f', '#ffffff', '#ff9a2e'], 3, 1.2); k.Sound.chime && k.Sound.chime(); }
    else if (c.kind === 'pebblefolk') { k.say('✨ Clickety clack! The stones sparkle!', true); for (let i = 1; i <= 6; i++) setTimeout(() => { k.api.burst(c.x + (P.x > c.x ? i : -i) * 1.2, .15, 0, ['#ffe9a8', '#ffffff', '#ffb36e'], 8, 1.3); k.Sound.tone(360 + i * 70, .1, 'triangle', .05, 1.2); }, i * 160); }
    else if (c.kind === 'nimbus') { k.say('🌦️ Pitter patter! A sparkly shower, and a rainbow!', true); for (let i = 0; i < 10; i++) setTimeout(() => k.api.burst(c.x + (Math.random() - .5) * 2.4, c.g.position.y + .6, c.z, ['#9fd8ff', '#ffffff'], 3, .9), i * 120); setTimeout(() => { for (let j = 0; j < 7; j++) k.api.burst(c.x - 3 + j, 2.6 + Math.sin(j / 6 * Math.PI) * 1.4, c.z - 1, [['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fd8'][j]], 6, .8); k.Sound.chime && k.Sound.chime(); }, 1300); }
    else if (c.kind === 'puffo') { k.say('🙈 Peekaboo! Where did Puffo go?', true); c.g.visible = false; c.hideT = 2.2; c.x = c.x0 = c.x + (c.x > c.home0 ? -1 : 1) * (3 + Math.random() * 2); c.tx = c.x; c.rest = 3; /* (a new hiding place: it stays near there) */ k.api.burst(c.g.position.x, .5, c.z, ['#f4d8ff', '#ffffff'], 18, 2); }
    else if (c.kind === 'coral') { k.say('🎤 La la laaa! Coral sings a sunset song!', true); [392, 440, 523, 659, 523].forEach((f, i) => setTimeout(() => { k.Sound.tone(f, .35, 'sine', .06, 1); c.act = .3; }, i * 300)); }
    else if (c.kind === 'zappy') { k.say('⚡ Zip zap! A little lightning flash!', true); k.api.burst(c.x, c.g.position.y + .2, c.z, ['#ffe36e', '#ffffff', '#9fd8ff'], 30, 3.5); k.Sound.tone(90, .5, 'sawtooth', .05, .4); setTimeout(() => k.Sound.tone(70, .6, 'triangle', .05, .3), 200); c.act = 1; }
    else if (c.kind === 'swirly') { k.say('🌀 Round and round! Swirly spins!', true); c.twirl = 2.5; k.Sound.whoosh && k.Sound.whoosh(); }
    else if (c.kind === 'bigpuff') { k.say('☁️ Big Puff gives you a soft, puffy hug!', true); for (let i = 0; i < 4; i++) setTimeout(() => k.api.burst(P.x, P.y + 1 + i * .3, P.z || 0, ['#ffffff', '#fff0f8', '#ffd1ec'], 10, 1.6), i * 160); c.tx = P.x; c.act = 1.2; }
    else if (c.kind === 'ringo') { k.say('💃 Hula hoop! Jump, and Ringo dances with you!', true); c.twirl = 2.5; c.band = 8; }
    else if (c.kind === 'shimmer') { k.say('🌠 A shooting star! Make a wish!', true); for (let i = 0; i < 12; i++) setTimeout(() => k.api.burst(c.x - 8 + i * 1.4, 7 - i * .35, c.z - 3, ['#ffffff', '#fff3a6', '#c9a6ff'], 4, .8), i * 70); k.Sound.chime && k.Sound.chime(); }
    else if (c.kind === 'zoomer') { k.say('🏎️ Vroom vroom! Race me!', true); c.tx = c.x + (P.x < c.x ? 9 : -9); c.run = 3; }
    else if (c.kind === 'frosty') { k.say('❄️ Brr, sparkle! Frosty makes it snow!', true); for (let i = 0; i < 14; i++) setTimeout(() => k.api.burst(P.x + (Math.random() - .5) * 6, 4 + Math.random() * 2, (P.z || 0) - 1, ['#ffffff', '#dff4ff'], 3, .5), i * 110); k.Sound.chime && k.Sound.chime(); }
    else if (c.kind === 'skatey') { k.say('⛸️ Wheee! Skatey twirls on the ice!', true); c.twirl = 2.5; c.tx = c.x + (P.x < c.x ? 4 : -4); c.run = 1.5; }
    else if (c.kind === 'snowman') { k.say('🤧 Ah... ah... ACHOO! A puff of snow!', true); setTimeout(() => { k.api.burst(c.x, 1.4, c.z + .5, ['#ffffff', '#dff4ff'], 30, 3); k.Sound.whoosh && k.Sound.whoosh(); c.act = 1; }, 900); }
    else if (c.kind === 'whirly') { k.say('🌪️ Whoosh whoosh! Whirly whirls the wind around you!', true); c.twirl = 3; k.Sound.whoosh && k.Sound.whoosh(); for (let i = 0; i < 12; i++) setTimeout(() => { const a = i * .9; k.api.burst(P.x + Math.cos(a) * 1.6, P.y + .4 + i * .18, (P.z || 0) + Math.sin(a) * 1.6, ['#ffffff', '#cfe0ff', '#9fd8ff'], 3, .8); }, i * 90); }
    else if (c.kind === 'glowjelly') { k.say('🪼 Bloop bloop! Bloop glows all the colours!', true); ['#62c8ff', '#c9a6ff', '#ff9fd8', '#7dffb0', '#ffe36e'].forEach((col, i) => setTimeout(() => { k.api.burst(c.x, c.g.position.y + .3, c.z, [col, '#ffffff'], 14, 1.8); k.Sound.tone(440 + i * 110, .22, 'sine', .05, 1); c.act = .4; }, i * 260)); }
    else if (c.kind === 'windwhale') { k.say('🐋 Ooo-weee-ooo! Echo sings a whale song!', true); [196, 247, 165, 220].forEach((f, i) => setTimeout(() => { k.Sound.tone(f, .7, 'sine', .07, .6); c.act = .5; }, i * 520)); setTimeout(() => { for (let i = 0; i < 6; i++) setTimeout(() => k.api.burst(c.x, c.g.position.y + .6 + i * .25, c.z, ['#ffffff', '#cfefff', '#9fd8ff'], 5, 1), i * 80); }, 2200); }
    else if (c.kind === 'snowballkid') { k.say('⛄ Snowball fight! Here comes a soft one!', true); for (let i = 0; i <= 8; i++) setTimeout(() => { const f = i / 8; k.api.burst(c.x + (P.x - c.x) * f, 1 + Math.sin(f * Math.PI) * 2.4 + (P.y - .2) * f, c.z + ((P.z || 0) - c.z) * f, ['#ffffff'], 2, .3); if (i === 8) { k.api.burst(P.x, P.y + 1, P.z || 0, ['#ffffff', '#e0ecff'], 22, 2.4); k.Sound.whoosh && k.Sound.whoosh(); k.say('😄 Splat! Hee hee!', false); } }, i * 70); }
    else if (c.kind === 'heartling') { k.say('💗 I love you! Lovey sends you hearts!', true); c.twirl = 2.5; for (let i = 0; i < 6; i++) setTimeout(() => { k.api.burst(c.x + (Math.random() - .5) * 2, c.g.position.y + .5 + i * .2, c.z, ['#ff6f9a', '#ff9fc8', '#ffffff'], 6, 1); if (i < 4) k.Sound.tone(i % 2 ? 98 : 82, .14, 'sine', .08, .5); }, i * 220); }
    else if (c.kind === 'charondot') { k.say('🌑 Dance with me! Pluto and Charon dance round and round!', true); c.orbit = 6; k.Sound.chime && k.Sound.chime(); }
    else if (c.kind === 'puffball') { k.say('🌬️ Pfff! Puffy blows wishing seeds for you!', true); c.act = 1.2; for (let i = 0; i < 12; i++) setTimeout(() => k.api.burst(c.x + i * .5 * (P.x > c.x ? -1 : 1), c.g.position.y + .4 + i * .15, c.z + .5, ['#ffffff', '#fffbe8'], 2, .4), i * 120); k.Sound.whoosh && k.Sound.whoosh(); }
    else if (c.kind === 'shroomy') { k.say('🍄 Boing boing! Jump with Shroomy!', true); c.bounceBig = 2.2; }
    else if (c.kind === 'twiggy') { k.say('🌸 Grow, grow, grow! Twiggy makes flowers bloom!', true); for (let i = 0; i < 7; i++) setTimeout(() => { k.api.burst(P.x + (i - 3) * .9, .2, (P.z || 0) - .6, [['#ff9fd8', '#ffe36e', '#c9a6ff', '#ffffff', '#ff6f9a', '#9fd8ff', '#7fe0a0'][i], '#7fd87a'], 8, 1.2); k.Sound.tone(523 + i * 60, .12, 'triangle', .04, 1.2); }, i * 140); c.act = 1; }
    else if (c.kind === 'dusty') { k.say('🌪️ Whoosh! Dusty makes a little dust twirl!', true); c.twirl = 2.5; for (let i = 0; i < 6; i++) setTimeout(() => k.api.burst(c.x, .3 + i * .4, c.z, ['#f0b888', '#f8d0a8', '#ffffff'], 6, 1.4), i * 150); }
    else if (c.kind === 'drummer') { k.say('🥁 Boom boom tap! Jump and Bongo plays along!', true); c.band = 8; [0, 1, 2, 3].forEach(i => setTimeout(() => { k.Sound.tone(i % 2 ? 160 : 110, .14, 'triangle', .09, .5); c.act = .4; }, i * 260)); }
    else if (c.kind === 'crystalkid') { k.say('🎶 Ting ting! Chime sings for you!', true); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => { k.Sound.tone(f, .3, 'sine', .06, 1); k.api.burst(c.x, 1.3 + i * .2, c.z, ['#ff6fd8', '#62f0ff', '#ffe36e', '#7dffb0'][i], 6, 1.2); }, i * 220)); }
    else k.say(`😊 ${c.sp.voice}`, true);
  }
  // only creatures near the camera move; a few at a time
  k.U.push((dt, t) => {
    for (const c of list) {
      if (c.gone) continue; const far = Math.abs(c.x - P.x) > 45 || P.layer !== (k.layer ?? 'space'); c.g.visible = !far; if (far) continue;
      const sp = c.sp, near = Math.abs(P.x - c.x) < 4 && Math.abs(P.y - (c.g.position.y)) < 3;
      if (near && !c.greeted) { c.greeted = true; c.act = Math.max(c.act, .8); k.say(sp.pet ? `${sp.emoji || '💖'} ${sp.name} waves at you! Tap to make friends!` : `👋 ${sp.name}: ${sp.voice}`, false); }
      if (!near && Math.abs(P.x - c.x) > 10) c.greeted = false;
      c.act = Math.max(0, c.act - dt); c.run = Math.max(0, (c.run || 0) - dt);
      // wander: pick a new spot near home now and then (or run / lead when asked)
      if (!c.run && !c.lead && (c.rest -= dt) < 0) { c.rest = 2 + Math.random() * 4; c.tx = c.x0 + (Math.random() - .5) * 2 * sp.r; c.tz = c.z0 + (Math.random() - .5) * .8; }
      if (c.lead && Math.abs(c.x - c.tx) < .4 && Math.abs(P.x - c.x) < 4) { c.lead = null; c.x0 = c.x; }
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz), v = sp.v * (c.run ? 2.5 : 1), moving = d > .15 && sp.move !== 'none';
      if (moving) { const s = Math.min(d, v * dt) / d; c.x += dx * s; c.z += dz * s; }
      const face = near && !moving ? Math.atan2(P.x - c.x, 2.5 - c.z) : moving ? Math.atan2(dx, dz) : c.yaw ?? 0; c.yaw = (c.yaw ?? 0) + (((face - (c.yaw ?? 0) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 5);
      const g = c.g; g.position.set(c.x, gY(c.x, c.z), c.z); g.rotation.y = c.yaw;
      animate(c.kind, g, t, moving);
      if (sp.move === 'bounce') { const hb = c.bounceBig > 0 ? 1.6 : .25; if (c.bounceBig > 0) c.bounceBig -= dt; g.userData.body.position.y = Math.abs(Math.sin(t * (c.bounceBig > 0 ? 4 : 6))) * hb; if (c.bounceBig > 0 && P.vy > 3 && near) { c.bounceBig = 2.2; } }
      if (c.band > 0) { c.band -= dt; if (near && P.vy > 3 && !c.beat) { c.beat = 1; if (c.kind === 'ringo') { c.twirl = 1.2; k.Sound.tone(520 + Math.random() * 200, .12, 'sine', .07, 1); } else k.Sound.tone(130 + Math.random() * 60, .12, 'triangle', .09, .5); c.act = .4; /* (Ringo twirls along; Bongo drums) */ k.api.burst(c.x, 1, c.z + .3, ['#ffd23f', '#ffffff'], 6, 1.2); } if (P.vy <= 0) c.beat = 0; } /* (Bongo drums along to her jumps) */
      if (c.copy > 0) { c.copy -= dt; if (Math.abs(P.x - c.x0) < 8) { const r = sp.copyRange ?? Infinity; c.tx = c.x0 + Math.max(-r, Math.min(r, -(P.x - c.x0) * .6)); c.rest = 1; } if (P.vy > 3 && !c.hopd) { c.hopd = 1; c.act = .5; } if (P.vy <= 0) c.hopd = 0; } /* (Mo copies her: mirrored walking, jumping when she jumps) */
      if (c.spin > 0) { c.spin -= dt; g.userData.body.rotation.z = (2 - c.spin) * 8; } else if (c.kind === 'sunny') g.userData.body.rotation.z = Math.sin(t * 1.2) * .08;
      if (c.hideT > 0) { c.hideT -= dt; g.visible = c.hideT <= 0; if (c.hideT <= 0) { k.api.burst(c.x, .5, c.z, ['#f4d8ff', '#ffffff'], 18, 2); k.say('🎉 Here I am!', false); c.act = 1; } } /* (Puffo's hide-and-seek) */
      if (c.orbit > 0) { c.orbit -= dt; const a = t * 2.2; c.tx = P.x + Math.cos(a) * 2.2; c.tz = Math.min(-1.2, (P.z || 0) - 1.8 + Math.sin(a) * .8); c.run = .3; c.rest = 1; if (Math.random() < dt * 3) k.api.burst(c.x, .3, c.z, ['#c9a6ff', '#ffffff'], 2, .6); } /* (Dot dances round her, like Charon round Pluto) */
      if (c.twirl > 0) { c.twirl -= dt; g.rotation.y = c.yaw + (2.5 - c.twirl) * 12; } /* (a spin) */
      if (c.act > 0) { g.userData.body.position.y += Math.abs(Math.sin(c.act * 9)) * .35; g.rotation.y += Math.sin(c.act * 14) * .4; } // (a happy wiggle and hop)
      else if (near) g.userData.body.rotation.z = Math.sin(t * 9) * .1; // (a little wave)
    }
  });
  return list;
}

// ---------- making friends with a pet: four big picture buttons ----------
let panel = null, cur = null;
function befriend(k, c) {
  if (!panel) {
    const st = document.createElement('style'); st.textContent = `#befriend{position:fixed;left:50%;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 104px);transform:translateX(-50%) translateY(140%);transition:transform .22s;z-index:34;display:flex;gap:12px;padding:12px 14px;background:linear-gradient(160deg,#fffdf6,#ffe8f6);border:5px solid #fff;border-radius:30px;box-shadow:0 8px 0 #c26a9a55,0 18px 40px #29104c66}
#befriend:not(.show){visibility:hidden;pointer-events:none;transition:transform .22s,visibility 0s .22s} /* (closed: it lets every tap through) */
#befriend.show{transform:translateX(-50%) translateY(0)}#befriend button{border:none;width:clamp(64px,17vh,86px);height:clamp(64px,17vh,86px);border-radius:24px;background:#fff;box-shadow:0 5px 0 #f0b6d6;font-size:clamp(36px,10vh,50px);padding:0}
#befriend button.x{background:#efe4ff;box-shadow:0 5px 0 #c9b6e8;font-size:30px;width:56px}`; document.head.appendChild(st);
    panel = document.createElement('div'); panel.id = 'befriend'; panel.innerHTML = ['✋', '🤗', '🍓', '⚽'].map((e, i) => `<button data-a="${i}" aria-label="${['pat', 'hug', 'treat', 'play'][i]}">${e}</button>`).join('') + '<button class="x" data-a="x" aria-label="not now">✖</button>'; document.body.appendChild(panel);
    panel.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (cur) cur(b.dataset.a); }));
  }
  const sp = c.sp; k.say(`${sp.emoji || '💖'} ${sp.name}! Pat it, hug it, give it a treat, or play!`, true);
  panel.classList.add('show');
  // (build 111) it closes by itself: she walks away from the pet, gets on a ride or flies off, or after a while (it never
  //  stays over the screen, covering other buttons)
  const P = k.P, t0 = performance.now(), watch = () => { if (!cur) return; if (Math.abs(P.x - c.g.position.x) > 5 || P.ride || P.layer !== (k.layer ?? 'space') || performance.now() - t0 > 12000) { panel.classList.remove('show'); cur = null; return; } requestAnimationFrame(watch); }; requestAnimationFrame(watch);
  cur = a => {
    panel.classList.remove('show'); cur = null; if (a === 'x') return;
    const g = c.g, x = g.position.x, y = g.position.y, z = g.position.z;
    if (a === '2') k.api.burst(x, y + 1, z + .3, ['#ff4f6a', '#7fe0a0', '#ffffff'], 14, 1.6); // (a strawberry treat)
    if (a === '3') { for (let i = 0; i < 4; i++) setTimeout(() => k.api.burst(x + (i - 1.5) * .6, .5 + (i % 2) * .8, z + .5, ['#ffffff', '#ff6a3c'], 6, 1.2), i * 180); } // (a bouncing ball)
    k.api.burst(x, y + 1.2, z, ['#ff6fae', '#ffd1ec', '#ffffff', '#ffe36e'], 26, 2.6); k.Sound.chime && k.Sound.chime(); k.Sound.giggle && k.Sound.giggle(); c.act = 2;
    const E = k.G.expansion, on = E && E.befriend ? E.befriend(c.kind) : false;
    k.say(`💖 ${sp.name} loves you! ${on ? 'It is coming with you everywhere!' : 'It is waiting in your 🐾 friends: tap 🐾 to bring it along!'}`, true); k.disc && k.disc('pet_' + c.kind);
    setTimeout(() => { c.gone = true; if (c.g.parent) c.g.parent.remove(c.g); }, 900); // (it goes to her: the follower appears beside her)
  };
}
