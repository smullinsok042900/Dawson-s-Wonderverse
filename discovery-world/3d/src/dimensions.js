// ===================================================================
// dimensions.js (build 131): THE MULTIVERSE REGISTRY. Every other dimension is a place reached through a WORMHOLE in open
// space (deepspace.js). Each one is a normal place of the planets engine (space.js + its own areas module), so it streams
// the same way: built as she arrives, each area built when she walks near it, everything freed when she flies away. Only
// one dimension is ever in memory, and a wormhole never draws its destination (it is a swirl, not a window).
//
// To add a dimension: one entry here (its look, gravity, wormhole and creatures) + its areas module in PLANET_EXTRA
// (planets.js) + its landing ground (space.js, by id). Planned next: see NEXT_TASKS.md, "THE MULTIVERSE".
// ===================================================================
export const DIMENSIONS = [
  {
    id: 'upside', icon: '🙃', name: 'the Upside-Down World',
    colors: ['#d6b8ff', '#6a3ad0'],
    gravity: 6.5, // a soft, floaty pull (made-up: this is a magic dimension)
    hello: 'Whoa! The Upside-Down World! Look up: there is land in the sky, with trees and houses hanging down! Step on a glowing arrow to fall UP and walk on the ceiling!',
    // where its wormhole swirls in open space: [angle round the Sun, distance, height]; and its colours
    wormhole: { at: [1.15, 730, 70], colors: ['#b07cff', '#4fe0e0', '#ff6fd8'] },
    look: {
      sky: { top: '#2a1a6a', mid: '#7a5ae0', hor: '#ffc8f0', low: '#ffe0f4', stars: .5, sunDir: [.2, -.6, -.8], sunCol: '#fff0ff', glow: [8, .4, .4], band: '#ffe8ff', bandK: .3, wind: .02 },
      sun: ['#fff4ff', 2.2], hemi: ['#ffe0ff', '#a080ff', 1.3], fog: ['#c8a8f0', 70, 300], env: .25, rim: ['#ffc8ff', .8],
    },
    alien: { name: 'Flipsies', body: '#9be8ff', eye: 2, ant: 2, shape: 'jelly', move: 'float', note: 680, hi: 'Hi hi! We are Flipsies! Down is up and up is down here!', iris: '#5a2fb0' },
  },
  {
    id: 'toy', icon: '🧸', name: 'the Giant Toy Universe',
    colors: ['#ffd23f', '#ff4f6a'],
    gravity: 7, // a bouncy, floaty toy-room pull (made-up)
    hello: 'The Giant Toy Universe! You are as small as a toy mouse, and every toy is ENORMOUS! Climb the giant blocks, bounce on the giant balls, and drive the wind-up train!',
    wormhole: { at: [3.3, 900, -50], colors: ['#ffd23f', '#ff4f6a', '#4fb0ff'] },
    look: {
      sky: { top: '#7ac8ff', mid: '#bfe6ff', hor: '#fff4d8', low: '#ffe8c0', stars: 0, sunDir: [.3, .5, -.8], sunCol: '#fff8e0', glow: [4, .4, .2] },
      sun: ['#fff8e8', 2.6], hemi: ['#fff0d8', '#ffb880', 1.3], fog: ['#fff0d8', 130, 380], env: .25, rim: ['#fff0c0', .6],
    },
    alien: { name: 'Tinkers', body: '#ff9a2e', eye: 2, ant: 1, shape: 'cube', move: 'walk', note: 740, hi: 'Tick tock! We are Tinkers, the wind-up toy people! Wind us up and watch us go!', iris: '#2a2333' },
  },
];
export const DIM = Object.fromEntries(DIMENSIONS.map(d => [d.id, d]));
export const isDimension = id => !!DIM[id];
