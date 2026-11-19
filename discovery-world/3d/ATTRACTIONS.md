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
| 4 | Mercury | Carnival funhouse | PLAYABLE (+15 to +28%) | Build 80: THE CRAWL TUNNEL (ground, 300–306): a low rainbow tunnel she really crawls through (`G.crawlZone` hook in main.js), with lights and a surprise at the end (`mercury-funhouse` checks it). Next: a forced-perspective hallway; speed. |
| 5 | Earth | Every district's activities | TODO | Audit Toy Town, Art Plaza, farm, pier, hills, trail and the Sky Kingdom. Bring the biggest up to standard. |
| 6 | Saturn | Ring Raceway | PLAYABLE | Build 75: the OUTER RING ROUTE: stay on the outside lane at the glowing fork gate to take a second ring for half a lap, through a star tunnel, with its own stars (`saturn-rides` 5/5: taken 3 times, 7 stars). Also: you drive it, with lanes, boosts, 2 jump ramps and friendly racers. Desktop speed is unchanged (+2 draw calls). Build 88: FREE DRIVE: a big star pad beside the kart: no racers, no laps, drive as long as you like, JUMP brings you back (`saturn-rides` checks it). Next: a loop on the outer ring. |
| 7 | Saturn | Star Blaster (60 m) | PLAYABLE | Build 84: CAMERA VIEWS: ▶ during the ride shows the whole tower, ◀ goes back close (`saturn-rides` checks it). Also: JUMP spins it faster for a higher blast (a gentle ride without presses), and stars to catch. Next: a picture button for gentle / wild. |
| 8 | Uranus | Ice Palace | PLAYABLE | Build 81: UPSTAIRS: the snowflake workshop, the frozen bookcase that slides away when you tap the snowflake switch, and the secret music room with five ice bells (`parks` checks it). +4 draw calls upstairs (194 against 179 ms on desktop, partly noise). Next: an underground ice tunnel network. |
| 9 | Uranus | Skating rink | PLAYABLE | Build 85: STEER ACROSS THE ICE: ▲ glides you away across the oval and ▼ back (a `G.iceZ` hook in main.js; Uranus only), as well as ◀ ▶ gliding, hoops, stars and musical ice (`parks` checks it). Next: winding ice trails beyond the oval. |
| 10 | Neptune | Bungee | PLAYABLE | Build 76: two jumping boards: ◀ the GENTLE one (short cord, lowest point 13.8 m) or ▶ the BIG one (long cord, 8.5 m). JUMP when ready, steer for stars, JUMP at the bottom to bounce higher (`control-rides` checks it). Next: a bigger tower, and a rebound game with targets. |
| 11 | Neptune | Big Sky Dive | PLAYABLE | Build 79: three FLOATING CLOUD ISLANDS (46, 33, 21 m): land on one, walk about, then JUMP to dive on; plus a second line of golden hoops (`control-rides` checks it). No extra draw calls (part of the sky mesh); desktop frame time unchanged. Next: wind gusts that push you, and a picture button for the camera view. |
| 12 | Mars | Climbing wall (30 m) | PLAYABLE | Build 83: THE CAVE TUNNEL: from the first ledge, tap the cave mouth and crawl through the rock to a new ledge on the other side, with a cave gem (`control-rides` checks it). A second way across. Next: a second wall. |
| 13 | Mars | Trampoline park | PLAYABLE | Build 86: THE CANYON TRAMPOLINE between the two mesas (area 2): hold ▲ to bounce 11 m, up onto the mesa tops, through a hoop, with 3 stars (`control-rides` checks it). +5–8 draw calls there; desktop frame times within the noise. Also the 3 trampolines by the climbing wall. Next: a BOUNCE RACE along the canyon (a row of 5 trampolines from mesa to mesa; land on each in turn for a star), and a gentle/high picture switch. |
| 14 | Pluto | Inflatable park | PLAYABLE | Build 78: the PUFFY PICTURE-MATCHING GAME (6 cards, 3 pairs; wrong pairs turn back; win → party, reshuffle; `parks` checks it). Each card is one mesh: +8 draw calls; desktop frame time within the noise. Next: a second tower and an inflatable maze. |
| 15 | Venus | Log flume (3× longer) | PLAYABLE | Build 77: THE WATERFALL SHORTCUT: steer ◀ at the glowing fork on the high channel and the log drops down a waterfall chute to the rapids (42 s against 49 s the long way; `venus-flume` 4/4 checks both routes). +2 draw calls (the next spot is the same; +6% at +190 is within the noise). Build 87: FLOWING WATER: a painted water texture with foam streaks that scrolls downstream (no new shader; the texture is freed with the planet); same speed or slightly faster (-1 draw call); stars are picked up even on slow phones. Next: a RAPIDS SPLASH GAME (water jets along the rapids you aim with ◀ ▶ and fire with JUMP at floating targets), and a second branch through the crystal cave (left or right). |
| 16 | Moon | Giant coaster | DONE (benchmark) | Polish only. |
| 17 | Neptune | Wind swings | PLAYABLE | Build 82: YOU pump the swing with JUMP (the wind helps a little); when it is really high, JUMP at the top of a forward swing lets go and you fly onto the soft cloud cushion (`control-rides` checks it; the smoke check pumps it too). +1 draw call; the spot past the swings measures the same. Next: a WIND BUTTON (tap the big fan picture: a strong gust pushes everyone's swing), and a second swing set with a double swing for two. |
| 18 | Venus / Mars / others | Older small activities (rocks, geysers, alien games) | TODO | Inspect each one; expand the best ones. |

Measurements so far: `PERFORMANCE_LOG.md` and `DEVELOPMENT_LOG.md` (builds 69–73).
