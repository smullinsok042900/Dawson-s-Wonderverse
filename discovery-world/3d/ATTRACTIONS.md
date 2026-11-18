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
| 1 | Mercury | Hall of Infinite Mirrors + maze mirrors | PLAYABLE | Hall (build 73): a live picture of her on the glass, refreshed every 3rd frame, instead of a 2nd character. 120 → 83 draw calls; frame time the same on desktop. Next: use the same picture for the maze's 7 funny mirrors. |
| 2 | Jupiter | Sky Playground | PLAYABLE (+7 to +14% at +150 to +205) | Shared invisible tap boxes so the visible pieces can merge; fewer meshes. |
| 3 | Mercury | Mirror maze (area 2) | TODO | It is still the build 67 hall. Make it a real maze: branching corridors, rotating mirror walls, hidden doors, coloured light per section, and a link into the funhouse. |
| 4 | Mercury | Carnival funhouse | PLAYABLE (+15 to +28%) | More rooms: a crawl tunnel and a forced-perspective hallway. Speed. |
| 5 | Earth | Every district's activities | TODO | Audit Toy Town, Art Plaza, farm, pier, hills, trail and the Sky Kingdom. Bring the biggest up to standard. |
| 6 | Saturn | Ring Raceway | PLAYABLE | Add an outer ring route chosen at a fork, a tunnel and a loop, and free-drive / easy-race buttons. |
| 7 | Saturn | Star Blaster (60 m) | PLAYABLE | Camera view buttons; a "gentle" picture button. |
| 8 | Uranus | Ice Palace | PLAYABLE | A second floor of rooms, a frozen-bookcase secret passage and an underground tunnel network. |
| 9 | Uranus | Skating rink | PLAYABLE | Steering in depth (z), and winding ice trails beyond the oval. |
| 10 | Neptune | Bungee | PLAYABLE | Gentle or big cord (two boards). |
| 11 | Neptune | Big Sky Dive | PLAYABLE | More cloud routes and floating platforms. |
| 12 | Mars | Climbing wall (30 m) | PLAYABLE | A second wall with a cave tunnel through it; route choices. |
| 13 | Mars | Trampoline park | PLAYABLE | More trampolines and a bouncing route along the canyon. |
| 14 | Pluto | Inflatable park | PLAYABLE | A second tower, an inflatable maze and a matching game. |
| 15 | Venus | Log flume (3× longer) | PLAYABLE | A branching route at a fork; animated water (foam, waterfalls). |
| 16 | Moon | Giant coaster | DONE (benchmark) | Polish only. |
| 17 | Neptune | Wind swings | TODO | Inspect against the standard. |
| 18 | Venus / Mars / others | Older small activities (rocks, geysers, alien games) | TODO | Inspect each one; expand the best ones. |

Measurements so far: `PERFORMANCE_LOG.md` and `DEVELOPMENT_LOG.md` (builds 69–73).
