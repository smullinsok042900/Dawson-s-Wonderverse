# Dawson's Discovery World 3D — performance log

Rule: the game must never get slower. Measure before and after every change on identical scenarios and add a row here.
**Desktop numbers come from a software-rendered browser and are NOT iPhone numbers.** Only the in-game report from the
real iPhone (⚙️ → Performance Test → Copy Test Results) counts as an iPhone measurement.




## Build 115 (Neptune creatures)
Desktop, software rendering; `pplanet.cjs neptune` (spots +60, +95, +150, +186, +320), builds 114 and 115, eight rounds (medians): +95 177 → 182 ms (three creatures in view: +4 draw calls, +6 k triangles), +150 174.5 → 173.5, +186 165.5 → 165, +320 130 → 133.5 (+2 draw calls); +60 is the landing spot (160–560 ms on both), not compared. Memory the same (shapes 1,320–1,338, textures 139–148). The creatures' own cost is about 1–2 ms each where they are in view, as on the other planets.

## Build 114 (Uranus creatures)
Desktop, software rendering; `pplanet.cjs uranus` (spots +60, +95, +185, +270, +320), builds 113 and 114, four rounds (medians): +95 144 → 149 ms, +185 190 → 189.5, +270 156.5 → 156.75, +320 123 → 129; two to four more draw calls where creatures are in view, +4 k triangles; +60 is the landing spot (210–560 ms on both), not compared. Memory the same (shapes 1,330–1,338, textures 148).

## Build 113 (Saturn creatures)
Desktop, software rendering; `pplanet.cjs saturn` (spots +60, +95, +320 added), builds 112 and 113, four rounds: +95 169 → 171 ms, +150 163 → 162, +240 143 → 139, +320 131 → 135; two to four more draw calls where creatures are in view.

## Build 112 (Jupiter creatures)
Desktop, software rendering; `pplanet.cjs jupiter` (spots +30, +60, +90, +150, +205, +320), four rounds each of build 111 / build 112 without the creatures / build 112: +60 223 / 223 / 213 ms, +90 215 / 221 / 226 (three creatures in view: +4 draw calls), +150 206 / 211 / 218, +205 194 / 201 / 203, +320 149 / 167 / 173 (+30 is the landing spot, 200–670 ms, not compared). The copy without creatures drifts as much at places with no creature, so the creatures' own cost is about 5 ms where three are in view.

## Build 111 (buttons moved; friendship panel)
Desktop, software rendering; `ba.cjs`, builds 110 and 111, both orders: script ms per frame park 12.2 → 11.8, creatures 10.1 → 9.3, castle 12.2 → 14.1 (each spreads several ms between runs; the change is buttons and styles only); 115 shader programs in both. In a Play Together room the page answered as fast as build 110 (1,455–1,480 vs 1,180–1,360 round trips a second).

## Build 110 (Venus creatures)
Desktop, software rendering; `pplanet.cjs venus` (spots +60, +100, +270 added), builds 109 and 110, both orders: +60 142 → 148 ms, +100 123 → 117, +160 168 → 168, +270 116 → 114; each spot spreads about 30 ms between runs; two to four more draw calls where creatures are in view.

## Build 109 (Mercury creatures)
Desktop, software rendering; `pplanet.cjs mercury` (spots +60 and +100 added for the landing), builds 108 and 109, both orders, after spreading the creatures out: +60 137 → 129 ms, +100 114 → 118 (two creatures in view: +3–4 draw calls), +150 167 → 172 (nothing changed there: this is the spread of the measurement), +180 136 → 136. The first placement (creatures 12 m apart) measured +100 118 → 132 with +5 draw calls, so they were spread to about 15 m and two moved to the open ground before the funhouse.

## Build 108 (Mars creatures)
Desktop, software rendering; `pplanet.cjs mars`, builds 107 and 108, both orders: +125 144 → 133 ms (one 211 ms outlier on build 107 left out), +140 138 → 136, +221 132 → 131, +276 119 → 119; one more draw call where a creature is in view, +2 k triangles. A first version with creature shadows measured +125 138 → 143 and +140 135 → 137, so the creatures no longer cast shadows.

## Build 107 (the memory leak fixed; Moon creatures)
Desktop, software rendering. **Memory while switching friends** (`renderer.info.memory`, shapes/textures): build 106 1,334/113 at the start → 1,385/157 after opening 👗 and three rounds through all the friends (it kept growing); build 107 1,324/109 → 1,332/114 and then flat. Planet trips (Moon, Mars, Venus and home, twice): shapes back to 1,334 at home each time. Speed (builds 106 and 107, both orders, run alone): Moon +30 130 → 127 ms, +50 126 → 121, +79 126 → 122 (one or two more draw calls where creatures are in view; triangles +3–5 k); Earth (`ba.cjs`) park 11.0 → 11.6 ms of script, creatures 10.6 → 9.3, castle 14.9 → 13.0, 115 shader programs in both, and less memory at the end of the run (shapes 1,378 → 1,365, textures 168 → 164).

## Build 106 (magic bubbles)
Desktop, software rendering; `ba.cjs`, builds 105 and 106, four rounds each in both orders. Script ms per frame (average and range): park 11.1 (10.4–12.1) → 11.4 (10.4–12.9); creatures 9.4 (8.3–10.7) → 8.5 (7.5–9.5); castle 10.5 (9.1–11.7) → 12.1 (10.7–12.9); shader programs 115 → 115; the same draw calls. Outside a room the new per-frame code was timed directly (200,000 calls): bubbles 0.016 µs a frame, the room update 0.010 µs, so the castle reading is noise, not the new code. In a room: one bubble is one mesh with the shared see-through material (no new shader); at most 8, reused.

## Build 105 (the dress-up menu; the coaster tunnel camera)
Desktop, software rendering. Earth (`ba.cjs`, builds 104 and 105, both orders): script ms per frame park 13.8 → 12.8, creatures 11.0 → 11.5, castle 13.4 → 13.6; 115 shader programs in both. Moon (`pplanet.cjs`, two rounds): +30 274 and 174 → 183 and 163 ms (the 274 is noise), +50 180 and 160 → 159 and 162, +79 178 and 161 → 160 and 161; draw calls the same (67/73/69). The accessory pictures are built into the game (84 KB), so opening 👗 draws nothing new. A first version that drew the coaster's mouth darkness as its own mesh cost one draw call on the Moon; it was put back into the coaster's single mesh.

## Build 104 (the Venus log ride together)
Desktop, software rendering; `pplanet.cjs venus`, builds 103 and 104, four rounds each in both orders. ms per frame (average) / draw calls: +160 216 → 218 / 76; +190 221 → 226 / 93–94 (each build ranges about 15 ms at these spots: 218–227 and 221–233). +131 is the first spot after landing (291–625) and is not compared. The new code runs only inside a Play Together room.

## Build 103 (riding the Earth train together)
Desktop, software rendering; `tests/perf/ba.cjs`, builds 102 and 103, four rounds each in both orders. Script ms per frame (average): park 14.4 → 15.6 (each build ranges 12.8–17.4), creatures 10.3 → 10.3, castle 14.2 → 14.6; shader programs 115 → 115; draw calls and triangles the same; no new long tasks. The new code runs only inside a Play Together room.

## Build 102 (four more friends)
Desktop, software rendering; builds 101 and 102 alternately, twice each: Moon +30 204 → 207 ms, +50 176 → 176, +79 170 → 168; draw calls the same. New friends' pictures (first time only): the first about 11 s on this software renderer (preparing the friends' materials), then about 1 s each, one per frame. Background sculpting was measured at 5–11 s per picture and dropped.

## Build 101 (dress-up and four new friends)
Desktop, software rendering; `pplanet.cjs`, builds 100 and 101 alternately, four times each on a quiet machine. Moon +30 199 → 197 ms, +50 175 → 174, +79 173 → 177; draw calls and triangles the same. Worn things: one draw call each, only while worn. Opening 👗: 6 ms; the first time only, each new friend's picture costs one pause of about 0.6–0.85 s while it is sculpted (one per frame; then kept).

## Build 100 (Moon coaster fixes and the station near the rocket; shared rides)
Desktop, software rendering; `pplanet.cjs`, builds 99 and 100 alternately, twice each. ms per frame / draw calls: Moon +30 249 / 67–83 → 210 / 67; +50 179 / 74 → 182 / 73; +79 (the new station) 176 / 64 → 186 / 69 (runs 168 → 174 and 183 → 198: noise); +150 193 / 86 → 200 / 86. (+20 is the first spot after landing and varies too much: 655 → 606.) Shared rides cost nothing when not in a room; in a room, a few small records per ride.

## Build 99 (rotating mirror walls in the Mercury maze)
Desktop, software rendering; `pplanet.cjs`, builds 98 and 99 alternately, four times each. Mercury +180 (maze): 245, 243, 270, 296 → 231, 318, 235, 215 ms (average 264 → 250); draw calls 77–78 → 78–79. (+150 is the first spot after arriving and varies too much to compare.)

## Build 98 (the loop-the-loop on Saturn's outer ring)
Desktop, software rendering; `pplanet.cjs`, builds 97 and 98 alternately, twice each. ms per frame / draw calls: Saturn +240 168 / 78 → 158 / 78; +280 140 / 73 → 148 / 73 (the two runs: 141 → 143 and 139 → 153; same draw calls, +1k triangles, counted as noise).

## Build 97 (the ice tunnel doors on Uranus)
Desktop, software rendering; `pplanet.cjs`, builds 96 and 97 alternately, twice each (this machine measured slower overall today, so compare within the row). ms per frame / draw calls: Uranus +196 (palace) 219 / 73 → 216 / 74; +270 184 / 64 → 182 / 64; +306 156 / 64 → 159 / 64.

## Build 96 (the 📷 camera button on the sky dive)
Desktop, software rendering; `pplanet.cjs`, builds 95 and 96 alternately, twice each. ms per frame / draw calls: Neptune +150 193 / 71 → 192 / 70; +158 194 / 67 → 186 / 67; +186 187 / 64 → 176 / 64. (The button is part of the page, not the 3D scene.)

## Build 95 (the giant bungee tower)
Desktop, software rendering; `pplanet.cjs`, builds 94 and 95 alternately, twice each. ms per frame / draw calls: Neptune +150 187 / 69 → 188 / 70; +158 186 / 67 → 187 / 67; +186 (bungee) 177 / 64 → 176 / 64.

## Build 94 (the winding ice trail on Uranus)
Desktop, software rendering, 844 × 390; `pplanet.cjs`, builds 93 and 94 alternately, twice each. ms per frame / draw calls (averages):

| Spot | Build 93 | Build 94, first try (ribbon, many banks) | Build 94, shipped |
|---|---|---|---|
| Uranus +196 (palace) | 199 / 73 | 191 / 73 | 194 / 73 |
| Uranus +270 (rink) | 163 / 63 | 167 / 66 | 167 / 64 |
| Uranus +306 (trail start) | 135 / 61 | 145 / 66 | 139 / 64 |

## Build 93 (sky dive wind gusts, the flume's crystal-cave fork)
Desktop, software rendering, 844 × 390; `pplanet.cjs`, builds 92 and 93 alternately, twice each. ms per frame / draw calls (averages):

| Spot | Build 92 | Build 93 |
|---|---|---|
| Neptune +150 | 186 / 69 | 186 / 69 |
| Neptune +158 | 190 / 67 | 186 / 67 |
| Neptune +186 | 176 / 65 | 175 / 65 |
| Venus +160 | 202 / 74 | 198 / 76 |
| Venus +190 | 219 / 91 | 215 / 94 |

## Build 92 (bungee balloons, double swing, trampoline switch, splash game, rainbow wall)
Desktop, software rendering, 844 × 390; `pplanet.cjs`, builds 91 and 92 run alternately (2 runs each for Neptune and Venus). Each cell: ms per frame / draw calls; the first spot after arriving varies a lot, so it is left out.

| Spot | Build 91 | Build 92 |
|---|---|---|
| Neptune +150 (wind swings) | 181 / 65 | 186 / 69 |
| Neptune +158 (double swing) | 176 / 63 | 181 / 67 |
| Neptune +186 (bungee) | 172 / 65 | 175 / 65 (balloons are hidden until the ride) |
| Mars +221 (trampoline switch) | 169 / 74 | 176 / 76 |
| Mars +276 (rainbow wall) | 152 / 69 | 157 / 70 (low-detail handholds, no stars, no shadow; first try was 163 / 72) |
| Venus +160 (rapids) | 199 / 69 | 204 / 75 |
| Venus +190 | 219 / 86 | 216 / 91 |
| Pluto +199 / +211 (rainbow tower) | 189 / 178 | 203 / 204 → tower **switched off** in build 92 |

## Build 69 (the giant Moon coaster)
Desktop, software rendering (SwiftShader), iPhone-sized 844 × 390 view. `cperf4.cjs` (Moon station view 12 s, boarding, 20 s of riding), build 68 and build 69 run alternately, twice each:

| Measure | Build 68 | Build 69 |
|---|---|---|
| Station: median frame | 144.5 / 145.7 ms | 144.5 / 127.8 ms |
| Station: draw calls | 75 | 68 |
| Station: triangles | 94k | 80k |
| Boarding (tap until 2 frames) | 343 / 204 ms | 210 / 195 ms |
| Ride: median frame | 140.5 / 143.3 ms | 150.4 / 139.1 ms |
| Ride: long tasks | 0 | 0 |

- **The ride view is not the same view:** build 69 looks across the whole Moon from up to 227 m; build 68 rode 32 m high. Its average (145 against 142 ms) is within the run-to-run noise.
- **Before the speed work,** the first build 69 was 194 against 138 ms at the station. The coaster's own cost was found by hiding its parts in one page; the fixes are in `DEVELOPMENT_LOG.md`.
- **`tests/perf/planet-shaders.cjs`:**

  | Measure | Build 68 | Build 69 |
  |---|---|---|
  | Shader waits | 3 (1678, 80 and 249 ms) | **0** |
  | New Moon shaders | 0 | 0 |

  - Before the material fix, build 69 had a 2.2 s wait on landing on the Moon.
  - The gate still reports one clearcoat shader variant at Jupiter, Saturn and Neptune, as in build 68 (from the build 66–68 rides). It is drawn outside the main scene and caused no measured wait (see `NEXT_TASKS.md`).

## Build 63 (zoomed-out camera)
- **Draw calls (`calls.cjs`), build 62b → 63:**

  | Spot | Build 62b | Build 63 |
  |---|---|---|
  | Park | 181 | 183 |
  | Studio | 131 | 149 |
  | Lab | 127 | 121 |
  | Castle | 188 | 195 |
  | Toy Town | 65 | 69 |
  | Frosty Peaks | 71 | 79 |

  Before the merging, the same zoom cost: park 221, Studio 168, castle 231.
- **`ba.cjs`, build 62b → 63:**

  | Measure | Build 62b | Build 63 |
  |---|---|---|
  | Load | 31.0 s | 28.3 s |
  | Park, script ms/frame | 14.1 | 17.2 |
  | Creatures, script ms/frame | 12.8 | 9.2 |
  | Castle, script ms/frame | 17.8 | 15.4 |
  | Heap | 137 MB | 152 MB |

  No long tasks; the shader programs are the same.
- **Watch on the iPhone:** the Studio (+14% draws) and Frosty Peaks (+11%).

## Build 62 (Talk Together: live voice)
- **Solo play (talking off), build 61 vs 62, `tests/perf/ba.cjs`,** run twice with the order swapped (desktop, software rendering):

  | View | Run 1 (61 → 62) | Run 2 (62 first; 61 → 62) |
  |---|---|---|
  | Park, draw calls | 197 → 261 | 277 → 271 |
  | Park, script ms/frame | 12.1 → 13.5 | 13.3 → 13.2 |
  | Creatures, script ms/frame | 10.1 → 10.2 | 9.2 → 8.5 |
  | Castle, script ms/frame | 9.2 → 11.5 | 11.4 → 12.4 |

  - The same build 61 park view measured 197 and 277 calls in the two runs, so this view's numbers depend on what had streamed in at that moment, not on the build. Within each run, build 62 is equal or a little better.
  - No long tasks in any view. Memory is 142–145 MB on both builds, with the same shader programs (114).
  - In solo play the voice code adds nothing: no meshes, no timer, and the Firebase code is still only loaded on Create/Join.
- **With talking on** (`tests/voicechat.cjs`, desktop):
  - the voice timer (speaking lights and repairs, about 7 times a second, never in the frame loop) costs **0.16 ms per check** on average;
  - the audio is Opus at about 32 kbit/s per friend (≈4 KB/s), much less in silence (DTX);
  - the per-frame work is only placing a 🗣️ sprite over a friend who talks.

## Build 61 (overlap fixes)
- Adds 2 low-detail spheres (the pier headlands, Ocean Pier district only, built and freed with it) and no new materials or shaders. Everything else only moves existing things, or hides the extra hint ring at learning spots (one fewer ring drawn there). Not measured separately: the change is too small to show.

## Build 60 — lighter carousel and critters (desktop, software rendering; `ba.cjs 3D_build59 index.html`, plus `calls.cjs` and a per-object count)
| View | Draw calls 59 → 60 | Triangles 59 → 60 | Script ms/frame 59 → 60 | Long tasks |
|---|---|---|---|---|
| Park | 300 → 197 | 791k → 549k | 11.5 → 15.9 | 0 → 0 |
| Creature area | 290 → 232 | 960k → 863k | 12.1 → 13.9 | 0 → 0 |
| Castle | 181 → 206 | 312k → 324k | 9.0 → 10.9 | 0 → 0 |

- **Deterministic counts** (the view counts above move as animals wander):
  - the carousel draws 126 → 78 parts;
  - each critter with light eyes: 8 fewer (e.g. bear 26 → 18, unicorn 35 → 27);
  - `calls.cjs` park, averaged over 6 frames: 230 → 198.
- **No change in shader programs:** 114 → 114.
- Script ms/frame differences are within this machine's known ±4 ms noise. No claim of faster frames is made from them; the drawing work (draw calls, triangles) is what went down.
- One 69 ms long task on the walk into the trail (the known x ≈ 455 spot, not in the game's code).
- **Not measured on the real iPhone.**

## Build 56 — Play Together: a shared world (NOT MEASURED)

**No numbers for this build.** It was written where there is no browser and no Node, so nothing could be run. These are
the expectations to measure with `tests/perf/*.cjs` (old `index.html` vs. the rebuilt one) before it is called verified:

- **Playing alone (no room):** no change is expected. The shared-world hooks are empty functions until a room starts, and
  the one extra call per painted line returns at once. Measure the park, the studio wall and the Meadow anyway.
- **In a room, standing still:** the only new work per frame is one string compare of the player's own state (already
  there in build 55) and, per other player, one pet-list compare (`syncPeerPets`) that returns immediately when their
  pets have not changed. A friend's pets (at most 2) add their usual draw calls/triangles and are only drawn when their
  owner is on screen.
- **In a room, building together:** a friend's arriving blocks are noted and the wall is rebuilt **once per frame**, not
  once per block. A rebuild recreates only the meshes whose cell changed (plus the stand-on platforms); the block
  materials are the ones created at startup, so no new shader programs.
- **In a room, painting together:** one write per 24 lines or per third of a second, whichever comes first; the drawing
  itself is the same 2D canvas work as before (once per received batch).
- **Waves:** one small write, removed again after 30 s; nothing per frame.

**To do:** run `tests/perf/calls.cjs`, `tests/perf/ba.cjs` and a two-client `tests/multiplayer.cjs` on a machine with Node
and Playwright, record the numbers here, then confirm on two real devices. Until then this build has no performance
clearance.

- **Android portrait readback and frame-safe resizing (PR #56, build 57), reported by the contributor
  (desktop, software rendering):** mixed timings, including slower samples and long tasks; warm-cache creature/castle
  draw calls and triangles match exactly; no new shader programs and no in-view resizes. The Pixel check was visual
  only. **Not re-measured for this merge** — re-run `tests/perf/calls.cjs` and `tests/perf/ba.cjs` before calling it
  verified.

## Build 54 — crates, hay bales, boulders, stream (desktop, software rendering; one frame at each stop, `?test`)
| Stop | Draw calls before → 54 | Triangles before → 54 | Shader programs |
|---|---|---|---|
| Pier crates (x −600) | 60 (build 53) → 58 | 49k → 49k | 149 → 149 |
| Farm hay (x −470) | 122 (build 51) → 106 | 88k → 80k | 148 → 149 |
| Balloon Hills rocks (x −740) | 61 (build 51) → 58 | 58k → 57k | 148 → 149 |
| Trail stream (x 441) | 117 (build 51) → 134 | 78k → 87k | 148 → 148 |

- Each stack went from 3–4 meshes to one, and the stream is one mesh as before.
- **The trail stream stop reads higher (117 → 134 draw calls) and I have not explained it.** The change there replaces meshes one for one or fewer, so I expect the difference is creatures walking into view in that single frame, but that is not confirmed. Re-measure with `tests/perf/calls.cjs` (averaged frames) before relying on it.
- No new shader programs on walking in. Frame time and long tasks were not measured for this build.

## Build 53 — Toy Town houses and moving sea (desktop, software rendering; one frame at each stop, `?test`)
| Stop | Draw calls 51 → 53 | Triangles 51 → 53 | Shader programs |
|---|---|---|---|
| Toy Town (x 561) | 80 → 76 | 59k → 75k | 148 → 149 |
| Toy Town (x 620) | 70 → 65 | 53k → 83k (measured before the houses were lightened; not re-measured) | 148 → 149 |
| Beach (x −40) | 89 → 88 | 60k → 57k | 148 → 149 |
| Pier (x −600) | 60 → 60 | 48k → 49k | 148 → 149 |
| Pier (x −656) | 72 → 72 | 59k → 60k | 148 → 149 |

- Draw calls go down or stay level. Toy Town draws about 16k more triangles (the houses have real windows and doors now); for scale, the park view draws about 870k on the iPhone report.
- The one extra shader program is compiled while the loading screen shows, not on walking anywhere.
- **Not measured for this build:** script time per frame and long tasks (`tests/perf/ba.cjs`). Characters walking in and out of view change single-frame counts by a few draw calls.

## Build 51 — planet preparation fixes (desktop, software rendering; 2026-11-15)

Initial diagnostic compared the saved pre-fix merged PR (`5c2dd42`) with an intermediate build 51 candidate using identical `tests/perf/space.cjs` scenarios (844×390 touch viewport, Chromium/SwiftShader). No physical iPhone speed is claimed.

| Place | Script ms/frame before → after | Arrival longest task before → after | Walking longest task before → after |
|---|---:|---:|---:|
| Moon | 18.6 → 13.6 | 0 → 85 ms | 52 → 0 ms |
| Mercury | 16.7 → 9.9 | 1506 → 0 ms | 0 → 0 ms |
| Venus | 83.0 → 10.7 | 0 → 0 ms | 657 → 0 ms |
| Mars | 10.1 → 11.8 | 611 → 0 ms | 0 → 0 ms |
| Jupiter | 9.6 → 7.7 | 1195 → 0 ms | 0 → 0 ms |
| Saturn | 6.6 → 15.7 | 1234 → 0 ms | 0 → 0 ms |
| Uranus | 9.8 → 12.5 | 1110 → 65 ms | 0 → 0 ms |
| Neptune | 8.2 → 14.9 | 663 → 0 ms | 0 → 67 ms |
| Pluto | 11.8 → 7.5 | 2078 → 0 ms | 0 → 0 ms |

- Mean script time: **19.4 → 11.6 ms/frame**. The per-place samples contain only 8–10 frames; individual increases need repeat comparison rather than being called improvements.
- Final memory: geometries **1382 → 1379**, textures **163 → 164** (one 1-pixel warmup texture), heap **145 → 132 MB**, programs **108 → 113** (resident representatives prevent repeated program disposal/creation). No page errors in either build.
- `tests/perf/planet-shaders.cjs`: the original merged build introduced eight distinct shader variants (20 per-visit additions) and 13 shader readiness waits, up to 4241 ms. The fixed build traversed all nine planets and expanded activities with **zero added variants, zero readiness waits, zero page errors**.
- A separate CPU-profiled fixed-build pass over all nine planets recorded one 52 ms Moon frame, dominated by Three.js rendering/material setup, and no other long tasks. It did not reproduce the multi-second shader waits. This does not claim a browser-wide zero-long-task guarantee.
- Node construction checks preserve exact terrain geometry, painted pixels and transform isolation. Warm terrain chunks measured at most 2.04 ms; 512-pixel Earth painting chunks at most 3.69 ms; cold normal calculation around 12 ms. The scheduler yields between chunks at a nominal 3.5 ms budget.
- The six-second moving diagnostic reaches different positions at low frame rates (physics advances at most 0.25 simulated seconds per rendered frame). Its per-view numbers are not the steady-view regression gate.
- Final fixed-view comparison (`space-steady.cjs`, final build first, original merged PR second; 32 measured rendered frames after 8 warm frames, fixed player/camera, matching draw-call/triangle/shadow signatures):

| Place | Mean complete-frame script time before → final | Median before → final | Matched work coverage |
|---|---:|---:|---:|
| Saturn | 12.71 → 8.77 ms | 9.60 → 7.40 ms | 96.9–100% |
| Uranus | 11.47 → 10.16 ms | 8.05 → 6.95 ms | 100% |
| Neptune | 11.26 → 11.06 ms | 8.05 → 7.15 ms | 100% |

These include actual shadow and plain frames. Browser timing has outliers: p95 before/final was 35.8/13.6 ms (Saturn), 37.9/33.7 ms (Uranus), 33.1/40.1 ms (Neptune). No claim of an absolute zero-long-frame guarantee is made.
- The final shader gate also returns to Earth and revisits Saturn/Uranus twice: **zero shader waits**, **zero page errors**, and GPU texture count **165 → 165**. It caught a delayed compile pass that created foliage programs after startup; every compile pass now completes first-use metadata and startup waits for pending compilation. Private ring textures are disposed while shared sky textures remain cached.
- Final `tests/perf/planets.cjs index.html` completed all nine planets, end-to-end Moon/Mars exploration, and Earth return: **zero slow shader waits**; two long tasks, 58 ms at Uranus x7506 and 82 ms at the Earth pad x689. Final memory: 1399 geometries, 170 textures, 111 programs, 133 MB heap. The 2117 ms maximum frame gap reflects this slow software-rendered run and is not an iPhone result.

## PR #55 conflict-resolution merge — work in progress (desktop, software rendering)

Compared PR head `537497d` with its integration of main `02de466` using `tests/perf/space.cjs` on identical 844×390 touch viewports, Chromium/SwiftShader. This is a conflict-resolution checkpoint, not a performance-approved release or an iPhone result.

| Measure | Original PR | Combined branch |
|---|---:|---:|
| Mean script ms/frame | 13.3 | 23.1 |
| Largest arrival long task | 1126 ms | 2319 ms |
| Largest walking long task | 53 ms | 654 ms |
| Final geometries | 1451 | 1379 |
| Final textures | 160 | 163 |
| Final shader programs | 111 | 108 |
| JavaScript page errors | 0 | 0 |

The combined branch loads expanded Moon/Mars areas and frees other planets, which the original PR did not. Its first-use shader pauses remain unresolved and these measurements do not pass the performance gate. Keep the graphics overhaul work in progress; investigate and warm the new shader variants before publishing it. The merge preserves the existing task notes rather than claiming the graphics work is complete.

## Build 49 — Balloon Hills (desktop, software rendering; `ba.cjs 3D_build48_index.html index.html`, run twice)
| View | Script ms/frame 48 → 49, run 1 | run 2 | Long tasks |
|---|---|---|---|
| Park | 14.3 → 14.3 | 13.0 → 15.6 | 0 |
| Creature area | 9.7 → 14.7 | 13.0 → 10.6 | 0 |
| Castle | 12.5 → 13.3 | 10.5 → 13.5 | 0 |
| Map jump to Art Plaza | 0 → one 70 ms task | 0 → 0 | |
| Walk into new areas | 0 → 0 | 0 → one 54 ms task (x ≈ 462, the known spot) | |

- Differences flip direction between the two identical runs (e.g. the creature area was slower in run 1 and faster in run 2), so they are this machine's noise. Build 49 changes nothing in these views; Balloon Hills is 1 km away and only built when you get near.
- Memory: geometries 1499 → 1460, textures 162 → 164, **shader programs 103 → 103**, heap 134 → 138 MB.
- Balloon Hills: no page errors, no slow shader waits, no new shader programs when walking in (browser check).
- Screens: the 16th map picture and 21st station did not fit on 320 px tall phones (iPhone SE, Galaxy S9+, Pixel 5). Fixed with a short-screen layout (6 map columns, 44 px station buttons). Devices test 11/11.

## Build 48 — rocket ride (desktop, software rendering; `ba.cjs 3D_build47_index.html index.html`, then `calls.cjs`)
| View | Script ms/frame 47 → 48 | Long tasks | Notes |
|---|---|---|---|
| Park | 13.5 → 13.7 | 0 → 0 | |
| Creature area | 12.4 → 13.1 | 0 → 0 | |
| Castle | 17.9 → 12.1 | 0 → 0 | |
| Walk into new areas | – | 1 → 1 (55 → 79 ms) | the known x ≈ 462 task (on the task list since build 33) |

- **Other measurements:**
  - house in and out: 0 long tasks; map jump: 0;
  - memory 132 → 133 MB; geometries 1498 → 1500; textures 162 → 161; **shader programs 103 → 103**;
  - loading 30.7 → 26.1 s (machine noise, not a real improvement).
- **Park draw calls:** `ba.cjs`'s one-frame count read 195 → 294, but the park did not change. `calls.cjs`, averaged over 6 real frames, gives **237 → 244** (creatures walking in and out of view). Lab Gardens: 73 → 74.
- **The rocket ride itself** (scripted PAW → in → red button → countdown → lift-off → landing → out, `getProgramParameter` timing):
  - no slow shader waits;
  - no new shader programs: the flame uses the shared toy shader, and the window face is a sprite, already warmed;
  - it adds two small hidden flame cones per rocket, plus the face sprite while you sit inside.

## Build 41 — native 3D pets, learning and world toys

Paired desktop Chromium / SwiftShader measurements use `tests/perf/nursery.cjs`, fixed seed123456, identical touch viewport844×390 and HQ settings, and16 complete rendered callbacks per view. Both shadow phases are included: an earlier single-frame snapshot can compare a plain frame with a shadow frame and give misleading draw-count differences. No other browser ran concurrently.

| View | Median callback work ms, previous →41 | Mean callback work ms, previous →41 |
|---|---|---|
| park | 13.75 → 12.45 | 17.36 → 12.17 |
| creatures | 7.30 → 10.40 | 7.92 → 12.71 |
| castle | 11.80 → 10.45 | 14.02 → 15.84 |
| home | 5.25 → 5.25 | 6.99 → 5.41 |
| woods | 5.45 → 5.25 | 5.67 → 7.89 |
| farm | 7.10 → 6.30 | 10.64 → 8.19 |
| pier | 7.95 → 5.35 | 7.92 → 5.38 |
| toyTown | 5.35 → 5.55 | 5.45 → 7.17 |

- Loading: **28.63 →28.35 seconds** on this software renderer. This small difference is within run-to-run variation.
- Results are mixed by view. Creature-area median rose3.10ms and mean rose4.79ms, including a42.1ms sample; castle and woods also had higher means despite lower medians. Park, home, farm and pier means fell. These short measurements do not establish a uniform speedup or real iPhone FPS. Median changes across the eight views range from−2.60 to+3.10ms, within the previously documented roughly±4ms software-rendering variation.
- Baseline shader count was101. The new shared vertex-color toy shader is warmed before play; the count stayed **102 across all eight views**, with no new programs appearing on travel between measured areas.
- The new measurement recorded **zero long tasks** in all sampled views; the baseline recorded one51ms castle task. This does not prove every possible transition is stall-free.
- Physical toys use one cached mesh batch each; native checks covered337 symbols and58 semantic/case distinctions. New 3D geometry adds detail compared with the previous picture sprites. Recorded call ranges and triangle counts are retained in `tests/PERFORMANCE_BUILD41.json`.
- Nursery rendering pauses exploration and reuses the existing WebGL renderer; the benchmark confirmed the world stays paused while its scene is open. There is no second WebGL context or screenshot facade.
- Appearance-preserving core work reductions: far-creature distance checks avoid square roots (1,000→0 calls in the native test), per-agent helper allocations are removed, and the post pipeline avoids duplicate scene clearing.15-species/300-frame behavior snapshots matched. Temporary world props release owned resources; shared toy resources are cached.

The randomized graphics diagnostic returned A=0/cap-locked, B=5, C=0 on this run. C has returned3 on other runs. Its random frame-time fixture needs a deterministic follow-up; automatic-quality decision code is byte-for-byte unchanged from published main. No claim is made that this release fixes every GPU/cap distinction. Actual iPhone performance remains to be checked.

## Build 40 — connected adventures (desktop software rendering only)

Final comparison used the previous published HTML retained at `../backups/3D_build40_before_connected_adventures.html` and the rebuilt release. No other browser tests ran during these measurements.

`tests/perf/adventures.cjs`, fixed views, identical random seed 123456:

| View | Script ms/frame, previous → build 40 | Draw calls, previous → build 40 |
|---|---|---|
| park | 10.96 → 12.42 | 221 → 217 |
| creatures | 11.18 → 11.97 | 168 → 168 |
| castle | 11.26 → 8.83 | 172 → 172 |
| home | 8.48 → 8.81 | 96 → 99 |

These small script-time differences are within the roughly ±4 ms run-to-run variation already documented for this software-rendering machine; they are not real iPhone FPS measurements. The castle sample improved; the other fixed samples differed by 0.33–1.46 ms/frame. No consistent slowdown beyond that measurement variation was observed.

- Shader programs stayed **101** in both builds, including after all eleven home rewards appeared and all three cushion colours were selected.
- Fully earned home: **131 calls, 125,662 triangles**, versus the new empty-home view's 99 calls / 106,846 triangles. Extra decorations therefore have a drawing cost in the house; the entire display detaches outside the house, including its tap target.
- `tests/perf/ba.cjs`: loading **31.7 → 27.4 s**; final heap **121 MB**. Walking samples advanced different distances on this slow renderer, so fixed-view samples above are the more comparable result.
- Active measured JS long tasks in the new walking pass: one **53 ms** at the castle and one **62 ms** on map travel. Other measured walking, house entry/exit and streaming scenarios had zero. Short 50–60 ms tasks were also observed in earlier baseline runs; this release does not claim to eliminate them. Startup shader rehearsal is measured separately.
- No browser page errors in either fixed-view run. Full raw measurements: `tests/PERFORMANCE_BUILD40.json`.
- Actual iPhone performance remains to be measured on the device.

## How to measure (from `discovery-world/3d`)
Prefix every command with `NODE_PATH=$(npm root -g)`, e.g. `NODE_PATH=$(npm root -g) node tests/perf/ba.cjs index.html`.

| Script | What it measures |
|---|---|
| `node tests/perf/ba.cjs OLD.html NEW.html` | Loading, script ms per frame, triangles, draw calls and long tasks (park, creatures, castle); house in and out; walk into new areas; map jump; per-district cost; memory |
| `node tests/perf/train.cjs FILE.html` | Train trips (top speed, seat jumps, long tasks, unbuilt-district frames) |
| `node tests/perf/walknew.cjs FILE.html` | Long tasks on a walk through the Dino Kingdom |
| `node tests/perf/soak.cjs FILE.html` | 60 map trips; geometry, program, texture, tap and heap counts must stay flat |
| `node tests/perf/sweep.cjs FILE.html` | Walks the whole world both ways (stuck spots, console errors) |
| `node tests/perf/house2.cjs FILE.html` | Entering and leaving the house |
| `node tests/perf/chunkchk.cjs FILE.html` | Nothing that moves sits inside a scenery chunk |

Keep the previous build's file (`../backups/3D_buildNN_index.html`) to compare against.

## Baseline: build 34 (desktop, software rendering, iPhone-sized screen, `tests/perf/ba.cjs`)
| View | Script ms/frame | Triangles | Draw calls | Long tasks |
|---|---|---|---|---|
| Park | 13.8 | 735k | 244 | 0 |
| Creature area | 11.3 | 713k | 165 | 0 |
| Castle | 15.3 | 289k | 351 | 0 |
| Trail district | – | 295k | 73 | – |
| Toy Town | – | 127k | 97 | – |
| Lab Garden | – | 290k | 94 | – |
| Art Plaza | – | 106k | 76 | – |

- **Other measurements:**
  - house in and out: 0 long tasks;
  - walking into new areas: 0;
  - map jump: 0.
- **Loading:** 27.0 s on this machine.
- **Memory:** heap 121 MB, 1518 geometries, 169 textures, 101 shader programs.
- **Train (build 34):** 0 long tasks on both full trips; 0 frames near an unbuilt district.

## Build 35 (Happy Farm) vs 34c (desktop, software rendering, `tests/perf/ba.cjs t34c.html t35.html`)
| View | Script ms/frame 34c → 35 | Long tasks | Notes |
|---|---|---|---|
| Park | 13.5 → 13.7 | 0 → 0 | |
| Creature area | 11.9 → 11.4 | 0 → 0 | |
| Castle | 13.2 → 14.0 | 0 → 0 | |
| Walk into the farm (new) | – | 0 | 90 calls, 270k triangles, shader programs 101 → 101 |

- **Other measurements:**
  - house in and out: 0 long tasks;
  - map jump: 0;
  - memory 121 → 122 MB; geometries 1514 → 1516; textures 170 → 172; programs 101 → 101.
- **Loading:** 31.4 s → 26.5 s. The machine is noisy; this is not a real improvement.
- **Measurement noise:** triangle and draw-call counts at a fixed spot vary a lot between runs, because creatures wander in and out of view. For example, the castle's calls were 543 in this 34c run but 351 in the build 34 baseline. Compare script ms and long tasks, and use `tests/perf/calls.cjs` for per-object breakdowns.
- **Train (whole line to 🚜):** 0 unbuilt-district frames. On the trip to 🌈, one 55 ms long task at x 462 (build 33 had a 50 ms one at x 458), so it is not new; it is on the task list.

## Build 36 (screen fitting) vs 35 (desktop, software rendering, `ba.cjs t35b.html t36b.html`, side by side)
| View | Script ms/frame 35 → 36 | Long tasks |
|---|---|---|
| Park | 14.3 → 10.0 | 0 → 0 |
| Creature area | 16.1 → 8.2 | 0 → 0 |
| Castle | 12.9 → 12.2 | 0 → 0 |

- House, walking into new areas, map jump: 0 long tasks. Memory 122 → 121 MB; programs 101 → 101.
- **Noise:** the same build 35 measured 11.4 ms (creatures) in one run and 16.1 ms in another, so only large, repeated differences mean anything. An earlier build 36 run measured creatures at 13.9 ms. Out of caution, the per-frame size check was replaced by a ResizeObserver, plus a check twice a second.
- **Pixel budget (new):** drawn pixels are capped at 1.0 M (phones), 1.6 M (tablets) and 3 M (desktop). In emulation an iPad 7 draws 864×648 in test mode. A real iPad Pro would otherwise draw at about 2.0 × 0.75 of 2388×1668 ≈ 2.2 M pixels per frame, with post-processing on top.

## Build 37 (castle merge) vs 36 (desktop, software rendering)
- **Castle view:** 221 → 163 draw calls per frame (`calls.cjs`, real frames averaged over 6), and 562 → 319 in `ba.cjs`'s count.
- **Script ms/frame:** park 13.2 → 11.2, creatures 10.6 → 8.9, castle 11.8 → 9.9.
- **Long tasks:** 0. Build 36 had one 50 ms task walking into the Adventure Trail (the known x ≈ 460 one).
- **Memory:** geometries 1514 → 1372; heap 122 MB; programs 101.

## Real iPhone reports
- **Build 26:**
  - no freezes over 250 ms; worst frame 128 ms;
  - house transitions about 134 ms; start-up 7 s;
  - a flat 30 fps (likely Low Power Mode), with graphics stuck at the lowest level (fixed in build 33);
  - voice: 0 sentences started (sound status unknown; now reported).
- **Build 36 (Home Screen app, 844×390 at 3×, two runs):**
  - start-up 3.8–4.8 s;
  - every scene a flat 30 fps (1% lows 20–27);
  - test worst frames 38–78 ms;
  - moving between areas 130–301 ms;
  - frame work 7.7–8.0 ms;
  - draw calls 83–364, triangles 61k–1014k;
  - voice works (sound was off).
  - Automatic graphics: 4→5 (30 fps) and 5→4 (room to spare): the bounce fixed in build 39.
  - The "10,412 ms freeze" was time in the background (fixed in build 39); real freezes in the session: 309 and 339 ms, place unknown.

## Real iPhone report: build 43 (Home Screen app, 844×390 at 3×)
- **Frame rates:**
  - Park 44 fps (1% low 32), creature area 40 (30), castle 56 (42), house 59–60, studio 59.
  - Graphics level 5; frame work 4.2 ms, so the GPU is the limit.
- **Start-up:** 4.5 s.
- **Moving between areas:** 59–108 ms.
- **Freezes:** one 274 ms freeze "(Art Plaza)", fixed in build 44.
- **Build 44 response:** less grass, earlier simple trees and no fur at levels 4–5 (park −22%, creatures −30% triangles on desktop at level 5).

## Known performance problems
- Loading is long because of the whole-world rehearsal (see NEXT_TASKS).
- The park and creature area are the heaviest views; the castle has the most draw calls.
