# Dawson's Discovery World 3D — next tasks

Prioritized unfinished work, highest first. Take the top item that can be done without the user. When a task is done,
remove it here and record it in `DEVELOPMENT_LOG.md`. Add new findings (bugs, ideas, measurements that look wrong) as you go.

## Waiting for the user
- **iPhone report #2:** ask for the in-game ⚙️ → Performance Test → Copy Test Results, with Low Power Mode off, after
  tapping "Test the voice". It shows whether the graphics level recovers (build 33), the real frame rate, and whether speech plays.
- **Confirm the squish fix (build 34b)** on the iPhone Home Screen app after turning the phone.

## 1. Performance first (the game must not get slower)
- **Loading:** about 27 s on the software-rendering test machine (`tests/perf/ba.cjs`). Most of it is the whole-world draw
  rehearsal that prevents freezes. Spread it across the first seconds of play in small pieces (keep the freeze checks at 0).
- **The park and creature area are the heaviest views:** about 710k–735k triangles, 165–244 draw calls. Candidates:
  - more instancing for repeated park props;
  - low-detail versions of far creatures;
  - fewer fur shells on far creatures.
- **Castle:** 351 draw calls (the most); merge static castle parts that share a material.

## 2. World expansion (streamed districts in `src/expansion.js`)
- **New regions to the left** (x < -404): an ocean pier, a farm, rainbow mountain. Each needs:
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
- **The test browser is very slow** (software 3D), so a few smoke checks are timing-sensitive. Run the full test alone,
  and tap moving characters where they are (use `tapChar` or re-aim), never at fixed spots.
