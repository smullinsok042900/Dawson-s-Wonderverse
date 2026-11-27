// ===================================================================
// volcano-course.js (build 164, the family's request): THE VOLCANO ISLAND ROLLER COASTER's course and its world's measures.
// Built with the same track builder as the Moon coaster (coaster-course.js: straights, banked turns, spiral lifts, drops,
// loops, corkscrews, anchors), so it is one continuous, connected track: the station, up round the OUTSIDE of the volcano,
// in through a hole in its side, down round the inside of the lava chamber and through a lava tunnel, out through a hole on
// the far side, a dive into the lagoon, a glass tunnel under the water, up and out, a loop, a corkscrew, home.
// Flags: S station, L chain lift, V inside the volcano, W under the water, B booster.
// All x are metres from the island's start (X); the volcano and the lagoon below are where the island draws them.
// ===================================================================
export const VSTATION = { dx: 80, z: -2.4, y: .9 };
export const VOLCANO = { cx: 195, cz: -150, r0: 58, h: 55, rTop: 14, wall: 4 };   // the hollow volcano (outer cone)
export const LAGOON = { cx: 300, cz: -150, r: 44, depth: 16 };                      // the lagoon dug into the island
// the volcano's outer radius at height y (a cone from r0 at the ground to rTop at the rim)
export const volR = y => VOLCANO.rTop + (VOLCANO.r0 - VOLCANO.rTop) * Math.max(0, Math.min(1, 1 - y / VOLCANO.h));
export const VCOURSE = [
  ['S', 6, 0, 'S'],
  ['T', 9, -180, 1, .4],                                   // leave the station, turn round behind it
  ['AT', 120, 8, -60, 90],                                 // a long sweep out towards the volcano
  ['AT', 133, 12, -150, 90],                               // to the volcano's foot
  ['H', 62, -1.25, 62, 'L', .2],                           // THE GIANT CLIMB: a spiral lift round the OUTSIDE of the volcano, 74 m up
  ['S', 14, 0],                                            // the crest: the whole island and the sea below
  ['AT', 213, 30, -150, 270],                              // THE DIVE through the hole in the volcano's side, into the lava chamber
  ['H', 18, -1.5, -22, 'V', .25],                          // round and down inside the chamber, over the lava lake
  ['S', 10, 0, 'V'],                                       // into the lava tunnel
  ['AT', 256, 7, -150, 0],                                 // through the tunnel and out of the hole on the far side
  ['S', 16, -17, ''],                                      // THE DROP into the lagoon
  ['S', 8, 0, 'W'], ['T', 16, -90, 0, .3, 'W'], ['S', 10, 0, 'W'], // UNDER THE WATER, in a glass tunnel
  ['S', 30, 16, ''],                                       // up and out of the water
  ['S', 20, 0, 'B'],                                       // BOOSTER
  ['L', 13, -1], ['S', 20, 0],                             // LOOP-THE-LOOP
  ['T', 14, -90, 0, .5],                                   // round towards home
  ['C', 40, 3.5],                                          // CORKSCREW
  ['AT', 150, 6, -24, 180],
  ['GOHOME'],                                              // back into the station
];
