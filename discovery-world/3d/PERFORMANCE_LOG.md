# Dawson's Discovery World 3D — performance log

Rule: the game must never get slower. Measure before and after every change on identical scenarios and add a row here.
**Desktop numbers come from a software-rendered browser and are NOT iPhone numbers.** Only the in-game report from the
real iPhone (⚙️ → Performance Test → Copy Test Results) counts as an iPhone measurement.

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

## Real iPhone reports
- **Build 26:**
  - no freezes over 250 ms; worst frame 128 ms;
  - house transitions about 134 ms; start-up 7 s;
  - a flat 30 fps (likely Low Power Mode), with graphics stuck at the lowest level (fixed in build 33);
  - voice: 0 sentences started (sound status unknown; now reported).
- **Build 33/34:** not yet received.

## Known performance problems
- Loading is long because of the whole-world rehearsal (see NEXT_TASKS).
- The park and creature area are the heaviest views; the castle has the most draw calls.
