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
import { makeBatch, shinyMat } from './spacekit.js';

const GEO = { ball: new THREE.SphereGeometry(1, 11, 8), cone: new THREE.ConeGeometry(1, 1, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 8), tor: new THREE.TorusGeometry(1, .22, 6, 14) }; // (light: about 150 triangles a ball)
const starGeo = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: true, bevelThickness: .18, bevelSize: .14, bevelSegments: 2 }); g.center(); return g; })();
// two cute eyes with shines, at height y, spread s, looking toward +z, size r
const eyes = (b, y, s, z, r = .07, col = '#2b1d3d') => { for (const k of [-1, 1]) { b.put(GEO.ball, k * s, y, z, col, [r, r * 1.15, r * .6]); b.put(GEO.ball, k * s + r * .3, y + r * .35, z + r * .45, '#ffffff', r * .35); } };
const cheeks = (b, y, s, z) => { for (const k of [-1, 1]) b.put(GEO.ball, k * s, y, z, '#ff9fc8', [.05, .03, .02]); };
const smile = (b, y, z, w = .06) => b.put(GEO.tor, 0, y, z, '#2b1d3d', [w, w, .3], [0, 0, Math.PI]);

// ---------- the species: shape (built facing +z, standing on y = 0), movement, sound, and what tapping does ----------
//   move: hop | float | roll | slide | bounce;  pet: befriendable;  where: spoken when it is still to be found
export const SPECIES = {
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
};
export const PET_KINDS = Object.keys(SPECIES).filter(k => SPECIES[k].pet);

// one shared painted shape per species (made the first time it is needed, then reused)
const SHAPES = {};
export function creatureMesh(kind) {
  const sp = SPECIES[kind]; if (!sp) return null;
  if (!SHAPES[kind]) { const b = makeBatch(); sp.build(b); SHAPES[kind] = b.geometry ? b.geometry() : b.mesh(shinyMat()).geometry; SHAPES[kind].userData.shared = true; }
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const m = new THREE.Mesh(SHAPES[kind], shinyMat()); m.castShadow = false; /* (build 108: no shadow pass: cheaper) */ m.scale.setScalar(sp.size || 1); body.add(m);
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
    if (c.kind === 'rocky') { k.say(`🪨 ${c.sp.voice} Catch me if you can!`, true); c.tx = c.x + (P.x < c.x ? 8 : -8); c.run = 3; }
    else if (c.kind === 'lumi') { k.say('✨ Lumi lights up the stars for you!', true); for (let i = 0; i < 8; i++) k.api.burst(c.x + (i - 4) * 1.4, 3 + Math.sin(i) * 1.5, c.z - 1, ['#fff3a6', '#ffffff', '#9fe6ff'], 6, 1.4); k.Sound.chime && k.Sound.chime();
      const hidden = list.find(q => q.sp.pet && !q.gone && Math.abs(q.x - c.x) < 60); if (hidden) { c.tx = hidden.x - 1.5; c.lead = hidden; setTimeout(() => k.say(`✨ Look! ${hidden.sp.name} is over here!`, true), 1600); } }
    else if (c.kind === 'boing') { k.say('🦘 Boing boing! Jump with me!', true); c.bounceBig = 2.2; }
    else if (c.kind === 'mirrormo') { k.say('🪞 Copy you! Walk and jump, and Mo does it too!', true); c.copy = 12; }
    else if (c.kind === 'sunny') { k.say('🌻 Sunny shines for you!', true); c.spin = 2; for (let i = 0; i < 10; i++) k.api.burst(c.x + Math.cos(i * .63) * 1.2, 1.4 + Math.sin(i * .63) * 1.2, c.z, ['#ffd23f', '#ffffff', '#ff9a2e'], 3, 1.2); k.Sound.chime && k.Sound.chime(); }
    else if (c.kind === 'pebblefolk') { k.say('✨ Clickety clack! The stones sparkle!', true); for (let i = 1; i <= 6; i++) setTimeout(() => { k.api.burst(c.x + (P.x > c.x ? i : -i) * 1.2, .15, 0, ['#ffe9a8', '#ffffff', '#ffb36e'], 8, 1.3); k.Sound.tone(360 + i * 70, .1, 'triangle', .05, 1.2); }, i * 160); }
    else if (c.kind === 'nimbus') { k.say('🌦️ Pitter patter! A sparkly shower, and a rainbow!', true); for (let i = 0; i < 10; i++) setTimeout(() => k.api.burst(c.x + (Math.random() - .5) * 2.4, c.g.position.y + .6, c.z, ['#9fd8ff', '#ffffff'], 3, .9), i * 120); setTimeout(() => { for (let j = 0; j < 7; j++) k.api.burst(c.x - 3 + j, 2.6 + Math.sin(j / 6 * Math.PI) * 1.4, c.z - 1, [['#ff4f6a', '#ff9a2e', '#ffd23f', '#7fe0a0', '#5aa8ff', '#9b6cff', '#ff6fd8'][j]], 6, .8); k.Sound.chime && k.Sound.chime(); }, 1300); }
    else if (c.kind === 'puffo') { k.say('🙈 Peekaboo! Where did Puffo go?', true); c.g.visible = false; c.hideT = 2.2; c.x = c.x0 = c.x + (c.x > c.home0 ? -1 : 1) * (3 + Math.random() * 2); c.tx = c.x; c.rest = 3; /* (a new hiding place: it stays near there) */ k.api.burst(c.g.position.x, .5, c.z, ['#f4d8ff', '#ffffff'], 18, 2); }
    else if (c.kind === 'coral') { k.say('🎤 La la laaa! Coral sings a sunset song!', true); [392, 440, 523, 659, 523].forEach((f, i) => setTimeout(() => { k.Sound.tone(f, .35, 'sine', .06, 1); c.act = .3; }, i * 300)); }
    else if (c.kind === 'dusty') { k.say('🌪️ Whoosh! Dusty makes a little dust twirl!', true); c.twirl = 2.5; for (let i = 0; i < 6; i++) setTimeout(() => k.api.burst(c.x, .3 + i * .4, c.z, ['#f0b888', '#f8d0a8', '#ffffff'], 6, 1.4), i * 150); }
    else if (c.kind === 'drummer') { k.say('🥁 Boom boom tap! Jump and Bongo plays along!', true); c.band = 8; [0, 1, 2, 3].forEach(i => setTimeout(() => { k.Sound.tone(i % 2 ? 160 : 110, .14, 'triangle', .09, .5); c.act = .4; }, i * 260)); }
    else if (c.kind === 'crystalkid') { k.say('🎶 Ting ting! Chime sings for you!', true); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => { k.Sound.tone(f, .3, 'sine', .06, 1); k.api.burst(c.x, 1.3 + i * .2, c.z, ['#ff6fd8', '#62f0ff', '#ffe36e', '#7dffb0'][i], 6, 1.2); }, i * 220)); }
    else k.say(`😊 ${c.sp.voice}`, true);
  }
  // only creatures near the camera move; a few at a time
  k.U.push((dt, t) => {
    for (const c of list) {
      if (c.gone) continue; const far = Math.abs(c.x - P.x) > 45 || P.layer !== 'space'; c.g.visible = !far; if (far) continue;
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
      if (c.band > 0) { c.band -= dt; if (near && P.vy > 3 && !c.beat) { c.beat = 1; k.Sound.tone(130 + Math.random() * 60, .12, 'triangle', .09, .5); c.act = .4; k.api.burst(c.x, 1, c.z + .3, ['#ffd23f', '#ffffff'], 6, 1.2); } if (P.vy <= 0) c.beat = 0; } /* (Bongo drums along to her jumps) */
      if (c.copy > 0) { c.copy -= dt; if (Math.abs(P.x - c.x0) < 8) { c.tx = c.x0 - (P.x - c.x0) * .6; c.rest = 1; } if (P.vy > 3 && !c.hopd) { c.hopd = 1; c.act = .5; } if (P.vy <= 0) c.hopd = 0; } /* (Mo copies her: mirrored walking, jumping when she jumps) */
      if (c.spin > 0) { c.spin -= dt; g.userData.body.rotation.z = (2 - c.spin) * 8; } else if (c.kind === 'sunny') g.userData.body.rotation.z = Math.sin(t * 1.2) * .08;
      if (c.hideT > 0) { c.hideT -= dt; g.visible = c.hideT <= 0; if (c.hideT <= 0) { k.api.burst(c.x, .5, c.z, ['#f4d8ff', '#ffffff'], 18, 2); k.say('🎉 Here I am!', false); c.act = 1; } } /* (Puffo's hide-and-seek) */
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
  const P = k.P, t0 = performance.now(), watch = () => { if (!cur) return; if (Math.abs(P.x - c.g.position.x) > 5 || P.ride || P.layer !== 'space' || performance.now() - t0 > 12000) { panel.classList.remove('show'); cur = null; return; } requestAnimationFrame(watch); }; requestAnimationFrame(watch);
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
