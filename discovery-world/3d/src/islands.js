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
];
export const ISLAND = Object.fromEntries(ISLANDS.map(d => [d.id, d]));
export const isIsland = id => !!ISLAND[id];
