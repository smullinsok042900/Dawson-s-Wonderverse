# Dawson's Discovery World 3D — performance log

Rule: the game must never get slower. Measure before and after every change on identical scenarios and add a row here.
**Desktop numbers come from a software-rendered browser and are NOT iPhone numbers.** Only the in-game report from the
real iPhone (⚙️ → Performance Test → Copy Test Results) counts as an iPhone measurement.

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
