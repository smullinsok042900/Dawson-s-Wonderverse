# Planet attractions: the permanent checklist (the family's request, 2026-11-18)

**The standard.** The Moon coaster (build 69) and the Jupiter Sky Playground (build 70) are the minimum for:
- scale: several levels, routes and sections, big from a distance;
- interactivity: Dawson steers, climbs, jumps, chooses and collects;
- finish: every part works from start to end, with its own test.

**Speed.** An attraction is only DONE when its spots measure no slower than before it (desktop A/B, milliseconds per frame) and the full smoke test passes. The real iPhone is checked separately by the family.

**How to work through it.**
1. Take the first row that is not DONE.
2. Inspect it, fix bugs, expand it and add controls.
3. Run its own test (`tests/*.cjs`) and the speed A/B (`/tmp` script `pplanet.cjs`, or a new spot list).
4. Run the full smoke test alone.
5. Update this file and the 3 logs, then commit, push and open a PR.
6. Go straight on to the next row.

**Status values:**
- **DONE**: meets the standard and is measured;
- **PLAYABLE**: works and is tested, but is short of the standard or slower;
- **TODO**: not started.

| # | Planet | Attraction | Status | What is left |
|---|---|---|---|---|
| 1 | Mercury | Hall of Infinite Mirrors + maze mirrors | DONE (speed) | Build 73: both use a live picture of her (refreshed every 3rd frame) instead of a 2nd character. Hall: 120 → 83 draw calls; maze: 110 → 72 draw calls and 94k → 67k triangles. Desktop frame times are within the noise. |
| 2 | Jupiter | Sky Playground | PLAYABLE (+7 to +14% at +150 to +205) | Merging still pieces (with or without invisible tap targets) saves only 1–3 draw calls, so the extra calls come from separate moving or positioned pieces (bubbles, chest, balloon, buttons, the swings, the seesaw...). Next: list the meshes in view at +185 with their draw counts (`renderer.info`), then cut the biggest. |
| 3 | Mercury | Mirror maze (area 2) | PLAYABLE | Build 74: coloured light per section; the UPPER MIRROR GALLERY (a 2nd route over the doors, reached by the one-tap mirror stairs); the LIGHT-BEAM PUZZLE (turn 3 mirrors) that opens a HIDDEN MIRROR DOOR to a treasure; a path of lights to the funhouse (`tests/mercury-maze.cjs` 5/5). Costs about 5 extra draw calls near the puzzle; desktop frame times are within the noise. Next: branching corridors and rotating mirror walls on the ground route. |
| 4 | Mercury | Carnival funhouse | PLAYABLE (+15 to +28%) | More rooms: a crawl tunnel and a forced-perspective hallway. Speed. |
| 5 | Earth | Every district's activities | TODO | Audit Toy Town, Art Plaza, farm, pier, hills, trail and the Sky Kingdom. Bring the biggest up to standard. |
| 6 | Saturn | Ring Raceway | PLAYABLE | Build 75: the OUTER RING ROUTE: stay on the outside lane at the glowing fork gate to take a second ring for half a lap, through a star tunnel, with its own stars (`saturn-rides` 5/5: taken 3 times, 7 stars). Also: you drive it, with lanes, boosts, 2 jump ramps and friendly racers. Desktop speed is unchanged (+2 draw calls). Next: free-drive / easy-race picture buttons, a loop. |
| 7 | Saturn | Star Blaster (60 m) | PLAYABLE | Camera view buttons; a "gentle" picture button. |
| 8 | Uranus | Ice Palace | PLAYABLE | A second floor of rooms, a frozen-bookcase secret passage and an underground tunnel network. |
| 9 | Uranus | Skating rink | PLAYABLE | Steering in depth (z), and winding ice trails beyond the oval. |
| 10 | Neptune | Bungee | PLAYABLE | Build 76: two jumping boards: ◀ the GENTLE one (short cord, lowest point 13.8 m) or ▶ the BIG one (long cord, 8.5 m). JUMP when ready, steer for stars, JUMP at the bottom to bounce higher (`control-rides` checks it). Next: a bigger tower, and a rebound game with targets. |
| 11 | Neptune | Big Sky Dive | PLAYABLE | More cloud routes and floating platforms. |
| 12 | Mars | Climbing wall (30 m) | PLAYABLE | A second wall with a cave tunnel through it; route choices. |
| 13 | Mars | Trampoline park | PLAYABLE | More trampolines and a bouncing route along the canyon. |
| 14 | Pluto | Inflatable park | PLAYABLE | A second tower, an inflatable maze and a matching game. |
| 15 | Venus | Log flume (3× longer) | PLAYABLE | Build 77: THE WATERFALL SHORTCUT: steer ◀ at the glowing fork on the high channel and the log drops down a waterfall chute to the rapids (42 s against 49 s the long way; `venus-flume` 4/4 checks both routes). +2 draw calls (the next spot is the same; +6% at +190 is within the noise). Next: animated water (foam, flowing stripes). |
| 16 | Moon | Giant coaster | DONE (benchmark) | Polish only. |
| 17 | Neptune | Wind swings | TODO | Inspect against the standard. |
| 18 | Venus / Mars / others | Older small activities (rocks, geysers, alien games) | TODO | Inspect each one; expand the best ones. |

Measurements so far: `PERFORMANCE_LOG.md` and `DEVELOPMENT_LOG.md` (builds 69–73).
