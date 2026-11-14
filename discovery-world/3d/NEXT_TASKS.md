# Dawson's Discovery World 3D — next tasks

Prioritized unfinished work, highest first. Take the top item that can be done without the user. When a task is done,
remove it here and record it in `DEVELOPMENT_LOG.md`. Add new findings (bugs, ideas, measurements that look wrong) as you go.

## Waiting for the user
- **Build 41 native 3D nursery, learning and world props on the real iPhone:** try hatching, dragging snacks, sponge/brush rubs, finger drawing, applying a blanket/outfit, bedtime, closing and reopening. Check voice and calm mode. Desktop verification is recorded separately.
- **Build 40 on the real iPhone:** check the compass menu, saved adventures/book/gallery, calm learning, separate audio controls and the performance report. Desktop verification is recorded in DEVELOPMENT_LOG.md.
- **Is Low Power Mode on?** (asked after the build 36 report: a flat 30 fps everywhere). If not, look for another 30 fps cap.
- **iPhone report after build 39:** expect no 4↔5 bounce under the cap, graphics settling at the best level, the real build number in the title, and no background time counted as a freeze.
- **iPhone report #2:** ask for the in-game ⚙️ → Performance Test → Copy Test Results, with Low Power Mode off, after
  tapping "Test the voice". It shows whether the graphics level recovers (build 33), the real frame rate, and whether speech plays.
- **Confirm the squish fix (build 34b)** on the iPhone Home Screen app after turning the phone.
- **Real-device check of build 36** on the iPhone (and any iPad or Android device the family has): buttons, panels, framing, full screen on Android/iPad, the ⚙️ graphics modes. Emulation passed 10/10, but that is not a real device.

## 1. Performance first (the game must not get slower)
- **Loading:** about 27 s on the software-rendering test machine (`tests/perf/ba.cjs`). Most of it is the whole-world draw
  rehearsal that prevents freezes. Spread it across the first seconds of play in small pieces (keep the freeze checks at 0).
- **The park and creature area are the heaviest views:** about 710k–735k triangles, 165–244 draw calls. Candidates:
  - more instancing for repeated park props;
  - low-detail versions of far creatures;
  - fewer fur shells on far creatures.
- **Draw calls:** checked after build 37. The park's biggest group is the carousel: sculpted ponies that blink and breathe on skeletons, plus the Blender carousel, so it can't be merged cheaply. The creature area's cost is the creatures. Your own creature costs about 39 draw calls everywhere (body parts, eyes, fur shells): a candidate for a lighter far-camera version.
- **Draw calls, next targets** (the castle front is merged in build 37; run `tests/perf/calls.cjs index.html X` to find more): merge other static clusters the same way. In the castle view, the remaining big groups are at x 398 (39 meshes) and x 403 (30 meshes; probably characters, so check before merging).
- **Occasional 50–60 ms long tasks on train trips** at varying places (x −317, 347, 458–463 in different runs). Investigated after build 37: no district building step takes more than 8.8 ms (measured with temporary per-step timing), and the rehearsal draw of a new district takes 1–7 ms. Likely garbage collection or test-machine noise. Next step: a CPU profile across a whole trip, looking for allocation spikes.

## 2. World expansion (streamed districts in `src/expansion.js`)
- **New regions to the left** (x < -536; the 🚜 farm is done in build 35): rainbow mountain and a dinosaur jungle (Ocean Pier and connected adventures are complete). Each needs:
  - a train station (extend `TRAIN.x0` and `STATIONS`);
  - a map picture;
  - gems;
  - 6+ unique picture-only activities.
- **Indoor spaces:** a hidden playroom and a toy-workshop interior (a new layer), with a door in the world, built only when entered.
- **More secret tunnels** (Woods ↔ Toy Town is done), and a picture "tunnel map" once one is found.

## 3. Creatures and pets
- **A pal in the Adventure Trail;** pals react to each other (wave, play) when two follow you.
- **Idle variety:** sitting, sniffing, looking at you.
- **Followers step aside when you turn round.**

## 4. Graphics, animation, controls
- Low-detail trees for the far background hills.
- Softer sea shading.
- Nicer station platforms.

## Known issues
- **Two real 309–339 ms freezes** in the iPhone session (build 36), place unknown. The report should say where: add the player's x and layer to each freeze in `perf.js`.
- **One 835 ms long task** on a train trip (desktop, x 202) that did not reproduce.
- **The test browser is very slow** (software 3D), so a few smoke checks are timing-sensitive. Run the full test alone,
  and tap moving characters where they are (use `tapChar` or re-aim), never at fixed spots.
