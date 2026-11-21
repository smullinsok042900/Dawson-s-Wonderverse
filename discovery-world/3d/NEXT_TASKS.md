# Dawson's Discovery World 3D — next tasks

Prioritized unfinished work, highest first. Take the top item that can be done without the user. When a task is done,
remove it here and record it in `DEVELOPMENT_LOG.md`. Add new findings (bugs, ideas, measurements that look wrong) as you go.

## Creatures and pets (CREATURES.md): every destination DONE (builds 107–117)
Still open there: S2 (creatures sleeping and playing with each other) and S6 (Play Together: show each player's followers on the
others' screens). Earth's woods frames spread ±50 ms between runs on desktop: pool many rounds before judging a change there.

## The attraction checklist
`ATTRACTIONS.md` is the permanent list (the family's request, 2026-11-18). Work through it from the first row that is not DONE.
- Pluto's rainbow tower (`plutoRainbowTower`, build 92) is switched off: make it lighter (it was 7–15 % slower in view), then turn it on.

## Speed found in the 2026-11-18 measurements (do these first)
Desktop, software rendering; milliseconds per frame, build 69 (before) → build 72/73:

| Spot | Build 69 | Now |
|---|---|---|
| Mercury: Hall of Infinite Mirrors (+231) | 130 | 198 |
| Mercury: other funhouse rooms (+260 to +310) | | +15 to +28% |
| Jupiter: busiest spots (+150 to +205) | | +7 to +14% |

- **Mercury's Hall of Infinite Mirrors:**
  - the mirror copy of her character is about 55 draw calls (the maze's mirrors cost the same, as they have since build 67: spot +150 has 114 calls);
  - next: a lighter "mirror double" (one merged mesh made from the character: no fur and no separate parts), used by the maze and the hall.
- **Jupiter:** merging still pieces in 30 m zones changed nothing (most pieces are tappable or moving). Next: shared hit boxes for taps, so the visible pieces can merge.

## THE FAMILY'S GAME-WIDE REQUEST (2026-11-18): every attraction up to the Moon coaster / Jupiter playground standard
Bigger, more interactive (steer, jump, climb, choose routes, collect, secrets), each planet unique, easy for a 5-year-old who cannot read,
and NEVER slower. Work through this list one item per cycle (inspect, fix, expand, interact, test, measure, checkpoint):
1. **Speed first.**
   - Jupiter's busiest new spots were 10–20% slower in build 70. Build 72 thins the slides; measure again.
   - Then measure Mercury, Venus, Pluto, Uranus, Saturn, Neptune and Mars (spots on the walking line, build N−1 against N: `pplanet.cjs`-style).
   - Fix any view that got slower.
2. **Mercury:** the mirror maze itself (area 2) is still the build 67 hall:
   - make it a real maze with branching corridors, rotating mirror walls, hidden doors and coloured light per section;
   - connect it into the funhouse;
   - add more funhouse rooms (a crawl tunnel, a forced-perspective hallway).
3. **Earth:** inspect every activity and district.
   - Go through the Toy Town / Art Plaza / farm / pier / hills / trail / Sky Kingdom attractions.
   - Bring the biggest ones up to standard: more levels, routes and interactions.
4. **Saturn:** the raceway is still one ring (3 laps, lanes, boosts, stars, 2 jump ramps).
   - Add a second (outer) ring route chosen by lane at a fork, a tunnel, and a loop.
   - Add free-drive and easy-race modes as two big picture buttons.
5. **Uranus:**
   - Ice Palace: add a second floor of rooms, a frozen bookcase secret passage, and an underground ice tunnel network.
   - Rink: add steering in depth (z) and winding ice trails beyond the oval.
6. **Neptune:** bungee: pick a gentle or a big cord (two jumping boards). Sky dive: more cloud routes and floating platforms.
7. **Mars:** more climbing routes (a second wall with a cave tunnel through it), and a bigger trampoline network.
8. **Pluto:** more inflatable structures (a second tower, an inflatable maze, a matching game).
9. **Venus:** a branching route on the flume (left or right at a fork), and better animated water (scrolling foam, waterfalls).
10. **Moon / Jupiter:** polish (keep as the benchmarks).

## Build 70 follow-ups (do first)
- Run the full smoke test on build 70 and fix anything it finds.
- Jupiter speed: the busiest new spots (x +150 to +205) measured about 10–20% slower than build 69 (desktop). Try:
  - hiding far zones by distance;
  - lighter slides (fewer segments; this was tried but not yet committed);
  - fewer ball-pit balls.
- Measure Mercury the same way (`/tmp` script `pplanet.cjs mercury`).
- Queued family requests:
  - Uranus: an explorable ice castle and a big skating area;
  - Neptune: a controllable bungee and skydive;
  - Mars: a big climbing wall with real climbing, and a trampoline park;
  - Pluto: a huge inflatable park;
  - Venus: a giant log flume;
  - Saturn: a giant launch ride and a drivable ring racetrack.

## Giant Moon coaster (build 69): check on the real iPhone
- Ride it from start to end on the iPhone: is it smooth all the way, especially the spiral lift, the tunnel and the cave? Use ⚙️ → Performance Test at the Moon station.
- Does the first-visit camera sweep (6.5 s) feel good, or too long?
- The coaster fills the Moon's 330 × 170 m area. If the Moon grows, the course (`src/coaster-course.js`, checked by `tests/coaster-course-check.mjs`) can grow with it.

## Shader gate: one clearcoat variant at Jupiter, Saturn and Neptune (since builds 66–68)
`tests/perf/planet-shaders.cjs` reports a `physical` (clearcoat) program compiled on arrival at these planets, rendered outside the main scene (output `srgb`, not the post target), probably a creature or portrait made for a ride. Find it and prepare it at start (`warmPaint` in `main.js`), measured. No wait was measured in build 69's run.

## Talk Together (build 62): needs the family
- Paste the NEW `firebase-rules.json` (Realtime Database → Rules → Publish). `?mpcheck` must say `allowed` for `write talking` and `write call message`.
- Try talking on two real devices (iPhone Safari + another phone): same Wi-Fi first, then one on mobile data. If mobile data does not connect, set up the free TURN relay (MULTIPLAYER.md) and put its URL in `src/mp-config.js`.
- On the iPhone, check that the voices come out of the loudspeaker (not the earpiece), and that game sounds still play.

## Camera after floating down from the whale
In the family's video (3:50), jumping off the whale above the Fluffkin House let the camera show the house wall for about 2 s while it caught up. Make the camera follow height faster while floating (`P.floaty`), measured. (2026-11-17: tried to reproduce in the test browser, but at its 1–2 frames a second she lands within half a second and the camera is fine; it needs a real phone, or a test that steps the game at 60 frames a second, before changing the camera.)

## Character portraits: read back without a GPU stall
The portraits (build 56) are drawn once at start-up and read with a synchronous `gl.readPixels`. Chromium logs "GPU stall due to ReadPixels" (the smoke test makes this one exception). Try `renderer.readRenderTargetPixelsAsync` into a render target, measured on the Pixel and iPhone. It must not undo the Android fix.

## PR #55: build 51 verified, ready for review
The planet graphics branch now includes main through build 50 and the build 51 flight/preparation fixes. PR #55 remains open; the user reviews and merges it.
- Sculpted planet scenery and the 330 m Moon/Mars are retained. Construction is sliced into short tasks, shaders are rehearsed before play, cancelled flights cannot move or hide Dawson later, and private ring textures are freed on departure.
- Desktop focused checks pass: 40 Node checks, 41 learning contracts, saved-world regressions, flight cancellation/retry, save reload/corruption, all nine planets and expanded activities, zero new shader variants/waits, and stable ring texture counts on repeat visits. See `DEVELOPMENT_LOG.md` and `PERFORMANCE_LOG.md` for limits and measurements.
- Final full smoke suite passed **195/195**, run alone, including save corruption recovery and zero console errors/warnings. Results and screenshots are committed with the build.
- Physical iPhone confirmation and future Earth graphics work remain separate tasks.

## Earth graphics (the graphics chat; build 53 onward)
A tour of every district found these still looking like placeholders. Do them in batches, each merged into one painted mesh (`earthkit.js`), measured and smoke-tested:
- **Water that is still a flat slab:** the duck pond and the Lab Gardens pond (the sea and the trail stream are done).
- **White patches on tree tops** in the woods, the farm and Frosty Peaks (x −160, −262, −524): check whether it is meant to be snow or blossom, or a fault in the far-tree model.
- **Art Plaza (x 801–930):** huge blank boards and plain round bushes.
- **Frosty Peaks (x −392):** very bare; snow drifts, icicles, pine trees.
- **Far hills** in the outer districts are single smooth blobs: add tree lines or layered ridges.
- Then the remaining toys built from plain cylinders and boxes (`c.cyl` is used 56 times in `expansion.js`).

## Waiting for the user
- **Build 59 Sprout on the real iPhone:** does Sprout's picture appear on the title screen, and is it smooth to play as?
- **Play Together, a world you share (build 56): paste the database rules once** (`firebase-rules.json`, step 3 of
  `MULTIPLAYER.md`), check that anonymous sign-in is on, then test on two real devices: build together, paint together,
  see a friend's pets, wave, leave and rejoin (the room keeps its world). The first push runs the new GitHub build.
- **Voice between phones on different networks needs a relay (TURN) server** (`VOICE_CONFIG.turn` in `src/mp-config.js` is empty): asked the family (2026-11-20) about a free Metered account. Also: `tests/voicechat.cjs`'s sound-level checks sometimes miss the once-a-second test beep on a slow machine (any build): sample for longer.
- **Paste the database rules once more (build 106: magic bubbles):** `firebase-rules.json` into the Firebase console.
- **Two real phones in one room (builds 100–106):** the shared rocket, the Moon coaster together, the outfit, and the Earth
  train together (one drives, the other taps the train at the station, ride, get off together), and the Venus log ride
  together (build 104). Desktop tests pass; never tried on phones.
- Multiplayer still to share: other multi-seat rides (Jupiter's rides, the Saturn karts); hugs, high-fives, dancing; co-op activities;
  the colouring pictures, karts, seeing a friend's creation in other
  places (nursery, art gallery), and a "friend is here" picture on the map.
- **Rooms refused ("Permission denied") on the phone (build 58):** open `…/discovery-world/3d/?mpcheck` and send the
  lines it shows — they name the database address, whether sign-in worked, and which read or write was refused.
- **Android/Pixel (PR #56, now build 57):** the parent's Pixel check looked good. After the next deploy, re-check the
  three character pictures, turning the phone, and a quality step on the Pixel — and the same on the iPhone.
- **Build 51 planet graphics and travel on the real iPhone:** try the countdown, all planets, Home/map during flight, and returning to a planet. Check startup and any visible pause with the in-game Performance Test. Desktop software-rendering results are recorded separately.
- **Build 50 bigger Moon and Mars on the real iPhone:** walk right to the end; any stutter when a new area appears? Use ⚙️ → Performance Test there.
- **Build 49 Balloon Hills on the real iPhone:** is the balloon fun to watch (the camera steps back), and can she reach the hill slide by PAW?
- **Build 48 rocket ride on the real iPhone:** PAW at the rocket, pick a planet, press the red button. Is the lift-off smooth (no freeze when the flame first appears) and is the button easy to press? Is her face visible in the window?
- **Build 41 native 3D nursery, learning and world props on the real iPhone:** try hatching, dragging snacks, sponge/brush rubs, finger drawing, applying a blanket/outfit, bedtime, closing and reopening. Check voice and calm mode. Desktop verification is recorded separately.
- **Build 40 on the real iPhone:** check the compass menu, saved adventures/book/gallery, calm learning, separate audio controls and the performance report. Desktop verification is recorded in DEVELOPMENT_LOG.md.
- **Is Low Power Mode on?** (asked after the build 36 report: a flat 30 fps everywhere). If not, look for another 30 fps cap.
- **iPhone report after build 39:** expect no 4↔5 bounce under the cap, graphics settling at the best level, the real build number in the title, and no background time counted as a freeze.
- **iPhone report #2:** ask for the in-game ⚙️ → Performance Test → Copy Test Results, with Low Power Mode off, after
  tapping "Test the voice". It shows whether the graphics level recovers (build 33), the real frame rate, and whether speech plays.
- **Confirm the squish fix (build 34b)** on the iPhone Home Screen app after turning the phone.
- **Real-device check of build 36** on the iPhone (and any iPad or Android device the family has): buttons, panels, framing, full screen on Android/iPad, the ⚙️ graphics modes. Emulation passed 10/10, but that is not a real device.

## 0. Bigger planets (the family's request, build 50 onward)
- Build 50's larger Moon/Mars are integrated into PR #55 together with build 51's planet graphics/travel fixes. Finish that PR's verification before expanding more planets.
- The untested larger Mercury/Pluto work is preserved in `docs/wip/build51_mercury_pluto.patch`. Its historical build number now collides with this PR: rebase/review it as build 55 or later, then build and test it before use. Do not apply it as part of PR #55.
- Done: the system (areas built when near, planets freed when you leave), the Moon and Mars (two new areas each).
- **Next, two per build, same pattern** (add to `PLANET_EXTRA` in `planets.js`; measure with `tests/perf/planets.cjs OLD NEW`):
  - **Mercury:** crater fields, light and shadow, a rock-shape matching game.
  - **Venus:** pretend floating cloud platforms and a cloud maze.
  - **Jupiter:** pretend storm platforms, wind and pattern toys, size comparisons.
  - **Saturn:** ring stations, ice sorting, an orbit toy.
  - **Uranus:** a tilt toy, rotation games.
  - **Neptune:** wind and air-current toys.
  - **Pluto:** ice caves, texture matching, the heart as a landmark.
- Later: a picture map for each planet (needs the user to try the big planets first).

## 1. Performance first (the game must not get slower)
- Make the randomized30fps/GPU diagnostic deterministic and investigate its C=0 versus C=3 variation. The actual adaptation code is unchanged from published main; build41 does not claim to resolve that inherited ambiguity.
- **Loading:** about 27 s on the software-rendering test machine (`tests/perf/ba.cjs`). Most of it is the whole-world draw
  rehearsal that prevents freezes. Spread it across the first seconds of play in small pieces (keep the freeze checks at 0).
- **The park and creature area are the heaviest views:** about 710k–735k triangles, 165–244 draw calls. Candidates:
  - more instancing for repeated park props;
  - low-detail versions of far creatures;
  - fewer fur shells on far creatures.
- **Draw calls:** checked after build 37. The park's biggest group is the carousel: sculpted ponies that blink and breathe on skeletons, plus the Blender carousel, so it can't be merged cheaply. The creature area's cost is the creatures. Your own creature costs about 39 draw calls everywhere (body parts, eyes, fur shells): a candidate for a lighter far-camera version.
- **Draw calls, next targets** (the castle front is merged in build 37; run `tests/perf/calls.cjs index.html X` to find more): merge other static clusters the same way. In the castle view, the remaining big groups are at x 398 (39 meshes) and x 403 (30 meshes; probably characters, so check before merging).
- **The x ≈ 454–462 long task (55–79 ms) on the walk into the Adventure Trail:** a CPU profile (build 49) shows no JavaScript run over about 18 ms there. The time is outside the game's code, probably the software renderer. Check whether the real iPhone ever reports a freeze there before doing more.
- **Occasional 50–60 ms long tasks on train trips** at varying places (x −317, 347, 458–463 in different runs). Investigated after build 37: no district building step takes more than 8.8 ms (measured with temporary per-step timing), and the rehearsal draw of a new district takes 1–7 ms. Likely garbage collection or test-machine noise. Next step: a CPU profile across a whole trip, looking for allocation spikes.

## 2. World expansion (streamed districts in `src/expansion.js`)
- **New regions to the left** (🎈 Balloon Hills done in build 49, at x −800 to −668): a dinosaur jungle next (the stairs, `EXP.xMin`, `TRAIN.x0`, `ZONES`, the path, the kerb and the save clamp move with each new region). Each needs:
  - a train station (extend `TRAIN.x0` and `STATIONS`);
  - a map picture;
  - gems;
  - 6+ unique picture-only activities.
- **Indoor spaces:** a hidden playroom and a toy-workshop interior (a new layer), with a door in the world, built only when entered.
- **More secret tunnels** (Woods ↔ Toy Town is done), and a picture "tunnel map" once one is found.

## 3. Creatures and pets
- **Pals react to each other** (wave, play) when two follow you. (The Adventure Trail pal, Clover the goat, was added in build 40.)
- **Idle variety:** sitting, sniffing, looking at you.
- **Followers step aside when you turn round.**

## 4. Graphics, animation, controls
- Low-detail trees for the far background hills.
- Softer sea shading.
- Nicer station platforms.

## Known issues
- **Two real 309–339 ms freezes** in the iPhone session (build 36), place unknown. From build 40 the report names the place: ask for a new report and fix what it shows.
- **One 835 ms long task** on a train trip (desktop, x 202) that did not reproduce.
- **The test browser is very slow** (software 3D), so a few smoke checks are timing-sensitive. Run the full test alone,
  and tap moving characters where they are (use `tapChar` or re-aim), never at fixed spots.
