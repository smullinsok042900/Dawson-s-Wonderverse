# Dawson's Discovery World 3D — next tasks

Prioritized unfinished work, highest first. Take the top item that can be done without the user. When a task is done,
remove it here and record it in `DEVELOPMENT_LOG.md`. Add new findings (bugs, ideas, measurements that look wrong) as you go.

## Waiting for the user
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
- **RESUME HERE (session ended, 2026-11-14):**
  1. **Build 50 is in this branch.** Its first full smoke run passed 194/195. The one failure ("moon: missing mooncave") is fixed: PAW at the moon cave now counts as finding it. Rerun `node tests/smoke3d.cjs` to confirm 195/195, then run devices and `tests/perf/planets.cjs 3D_build49_index.html index.html`. Update the PR and publish the artifact.
  2. **Build 51 (bigger Mercury and Pluto) is written but untested.** It is saved as `docs/wip/build51_mercury_pluto.patch`. Apply it with `git am docs/wip/build51_mercury_pluto.patch` (from the repository root), then build, check in the browser, add smoke checks like build 50's, and test.
  3. **The family asked a second Claude chat to do the graphics overhaul.** Do not do the graphics overhaul here (the user asked this chat to drop it).
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
