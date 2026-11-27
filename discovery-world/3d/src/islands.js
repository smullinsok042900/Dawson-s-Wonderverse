// ===================================================================
// islands.js (build 145, the family's request): THE ISLANDS of the open ocean. She climbs into the boat at the beach, sails
// the ocean (ocean.js) and lands on islands to explore. Each island is a normal place of the planets engine (like the
// dimensions): its landing ground in space.js, its areas in PLANET_EXTRA (planets.js), built when she lands and freed
// when she sails away. On an island there is a dock with her sailboat instead of a rocket pad.
//
// To add an island: one entry here (its look, its place on the sea, its creatures) + its areas + its landing ground.
// ===================================================================
export const ISLANDS = [
  {
    id: 'jungle', icon: '🌴', name: 'Jungle Island',
    colors: ['#3fbf5a', '#1f7a3a'],
    gravity: 9.81, // (normal: it is on Earth)
    hello: 'Jungle Island! Tall trees, swinging vines, a rushing river and a waterfall. Let’s explore!',
    sea: [520, -380], // where it lies on the ocean (metres from Home Harbour)
    r: 60,            // its size on the ocean
    look: {
      sky: { top: '#5ab8ff', mid: '#9fd8ff', hor: '#e8f8ff', low: '#d8f4e8', stars: 0, sunDir: [.3, .6, -.7], sunCol: '#fff6d8', glow: [5, .5, .2], band: '#ffffff', bandK: .15, wind: .02 },
      sun: ['#fff4d8', 2.6], hemi: ['#e8fff0', '#6fbf6a', 1.3], fog: ['#cfeedd', 90, 320], env: .35, rim: ['#fff8e0', .6],
    },
    alien: { name: 'Monkeys', body: '#a8743a', eye: 2, ant: 0, shape: 'classic', move: 'hop', note: 520, hi: 'Ooh ooh ah ah! We are the jungle monkeys! Come and play in the trees!', iris: '#3a2a1a' },
  },
  // (build 156, the family's request: "create more islands")
  {
    id: 'volcano', icon: '🌋', name: 'Volcano Island', colors: ['#5a5058', '#ff8a1e'], gravity: 9.81,
    hello: 'Volcano Island! Black sand, a warm hot spring, and a big smoking volcano. Let’s explore!',
    sea: [-540, -400], r: 55,
    look: { sky: { top: '#6a8ad8', mid: '#b8a8d8', hor: '#ffd8b8', low: '#e8c8b8', stars: 0, sunDir: [.3, .6, -.7], sunCol: '#ffe8c8', glow: [5, .5, .2], band: '#ffffff', bandK: .15, wind: .02 },
      sun: ['#ffe8d0', 2.5], hemi: ['#ffe8e0', '#6a5a5a', 1.25], fog: ['#e8d0c8', 90, 320], env: .35, rim: ['#ffd8b0', .6] },
    alien: { name: 'Lava Lizards', body: '#ff7a3a', eye: 2, ant: 0, shape: 'classic', move: 'hop', note: 440, hi: 'Hiss hiss! We are the friendly lava lizards! The rocks are warm here!', iris: '#3a2a1a' },
  },
  {
    id: 'turtle', icon: '🐢', name: 'Turtle Beach', colors: ['#f0d8a0', '#3f8f4a'], gravity: 9.81,
    hello: 'Turtle Beach! Soft sand, turtle nests, and a big sea turtle who gives rides. Let’s explore!',
    sea: [400, 430], r: 50,
    look: { sky: { top: '#4ab0ff', mid: '#8fd4ff', hor: '#f0fbff', low: '#f8f0d8', stars: 0, sunDir: [.3, .6, -.7], sunCol: '#fff8e0', glow: [5, .5, .2], band: '#ffffff', bandK: .15, wind: .02 },
      sun: ['#fff8e8', 2.7], hemi: ['#f0fbff', '#d8c890', 1.3], fog: ['#e0f4f8', 90, 320], env: .35, rim: ['#fff8e0', .6] },
    alien: { name: 'Crabs', body: '#ff6a4a', eye: 2, ant: 2, shape: 'classic', move: 'hop', note: 600, hi: 'Click click! We are the beach crabs! Watch out for the baby turtles!', iris: '#2a2a38' },
  },
  {
    id: 'cove', icon: '💎', name: 'Treasure Cove', colors: ['#8a8070', '#ffd23f'], gravity: 9.81,
    hello: 'Treasure Cove! An old boat, big rocks, and a treasure map. Let’s find the treasure!',
    sea: [-430, 420], r: 50,
    look: { sky: { top: '#5a9ae8', mid: '#9fc8f0', hor: '#f0f4ff', low: '#e8e4d8', stars: 0, sunDir: [.3, .6, -.7], sunCol: '#fff4e0', glow: [5, .5, .2], band: '#ffffff', bandK: .15, wind: .02 },
      sun: ['#fff4e0', 2.6], hemi: ['#eef4ff', '#8a8070', 1.3], fog: ['#dce8f0', 90, 320], env: .35, rim: ['#fff4e0', .6] },
    alien: { name: 'Parrots', body: '#3fc65a', eye: 2, ant: 0, shape: 'classic', move: 'hop', note: 700, hi: 'Squawk! We are the cove parrots! We know where the treasure is!', iris: '#2a2a38' },
  },
];
export const ISLAND = Object.fromEntries(ISLANDS.map(d => [d.id, d]));
export const isIsland = id => !!ISLAND[id];
