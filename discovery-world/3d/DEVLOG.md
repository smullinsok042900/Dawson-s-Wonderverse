# Dawson's Discovery World 3D — development log and backlog

This file lets any future session resume from the newest verified checkpoint. Newest entries come first. Every
checkpoint lists what was verified, and how, and what is still known to be wrong.

## How to verify a checkpoint (the routine)

1. `node build.mjs`: builds the single offline `index.html`.
2. `NODE_PATH=$(npm root -g) node tests/smoke3d.cjs`: the full game test (about 35 min). Run it ALONE on the machine; other browser work makes its timing-sensitive checks flaky.
3. Performance, before and after, on identical scenarios (scratch scripts kept in the session scratchpad; recreate as needed):
   - `ba.cjs`: loading; per-frame script time, triangles, calls and long tasks in the park, the creature area and the castle; house in and out; walking into new areas; map jump; memory.
   - `walknew.cjs`: long tasks on a walk from the valley through the Dino Kingdom.
   - `train_test.cjs`: the full train route both ways (jumps per frame, long tasks, streaming).
   - `soak.cjs`: 60 map trips; geometry, program, texture, tap and heap counts must stay flat.
   - `sweep.cjs`: walks the whole outdoor world both ways; reports stuck spots and console errors.
4. Desktop results are NOT iPhone results. The real numbers come from the in-game ⚙️ → Performance Test → Copy Test Results.
5. Before a big change, keep a rollback copy in `../backups/3D_buildNN_index.html`.

## Checkpoint: build 34 (current)
- **Express train:** picture trips longer than about 280 m speed up to 36 m/s (was always 20). The whole line takes about 42 s of game time, down from about 68 s. Short trips are unchanged.
- **Verified (desktop, `train_test2.cjs`, before → after):**
  - trip home → 🌈: top speed 20 → 36 m/s, long tasks 1 (50 ms) → 0;
  - whole line 🌈 → ❄️: long tasks 0 → 0;
  - frames where you were within 25 m of an area that had not finished building: 0 → 0, on both trips.
  - On a phone each frame moves the train less and builds the same amount, so streaming has more margin there than on the test machine.

## Checkpoint: build 33
- **First real iPhone report (build 26):** no freezes, house about 134 ms, start-up 7 s. A flat 30 fps cap (most likely Low Power Mode), but the graphics were stuck at the lowest level.
  - **Fixed:** the stale level is forgotten (new key), and quality steps back up when capped with room to spare (frame work < 9 ms for 20 s).
- **Crown bug (introduced in build 25):** the crown, your shadow and the PAW hint were filed into scenery slices and hidden far from where they were made.
  - **Fixed:** they are marked dynamic.
  - **New test:** checks that no mover sits in a slice.
- **Luna gives a magic wand** (saved).
- **To verify next:** the iPhone report after this build. Expect a graphics level below 5 and frame work in ms. Ask for Low Power Mode off, to see the uncapped fps.

## Checkpoint: build 32
- **Added:**
  - Bolt the robot, Hoppy the frog and Kiwi the parrot (6 pals in all).
  - The secret tunnel Woods ↔ Toy Town.
- **Verified (desktop):** all three befriend and follow; 0 new shaders; the tunnel works both ways and builds the destination on arrival.
- **Tests:** map and station pictures are found by emoji; Biscuit is tapped from his left.
- **Full test:** the result is recorded in the commit after this entry.

## Checkpoint: build 31

**Added**
- **❄️ Frosty Peaks** (x -272 to -404) has 9 activities:
  - a sledding hill: climb the steps, tap the sled, slide down (it reuses the slide ride);
  - a snowman to build in 5 taps;
  - snowball toss at a target;
  - a slippery ice pond you glide across;
  - an igloo that glows warm;
  - northern lights;
  - waddling penguins;
  - Pebble the penguin pal;
  - falling snow.
- **Gems:** 2 more (14 total).
- **Train:** extended to x -402, with a ❄️ station.
- **🐾 My Pets panel:** shows each befriended friend. Tap to bring it along (💖) or send it home (🏠); friends not met yet show as ❓.
- **Followers:** they now walk in front of the path, each in its own spot, so they no longer overlap the workshop pets or each other.

**Verified (desktop)**
- **Bug sweep** over the whole world, both ways: never stuck, no console errors. The only detours were the intended slides, lift and ball pit.
- **Walk into Frosty Peaks:** 0 long tasks, 0 new shader programs.
- **Activities:** all 10 tappables run without errors.
- **Sled:** slides from y 4.5 at x -332 to the ground at x -345.
- **Ice:** you glide 2.1 m after letting go.
- **Pets panel:** toggles following.

## Checkpoint: build 30 (merged as #37)
- **Train:** runs the whole world with 17 stations, a picture strip and automatic trips; no teleport turn-arounds or pop-ins.
- **New regions:** 🏖️ Sunny Seaside and 🌲 Whispering Woods.
- **Pets:** Pinchy and Rusty.
- **Fixes:** left-side gems couldn't be collected; reloading lost progress in the new areas.
- **Full test:** 147/147.

## Checkpoint: build 29b (merged as #36)
- **Freezes fixed:** entering the house (2.9 s → 0), the Dino Kingdom and the castle (four 1–2.7 s stalls → 0). Causes: shader and driver rehearsal into the wrong kind of buffer, too few rehearsal spots, and late creatures.
- **New neighbourhoods:** four streamed neighbourhoods to the right with 23 activities, the 🗺️ map and 🏠 home.

## Known issues
- **iPhone numbers:** frame rate, loading and memory on a real iPhone are not measured yet; waiting for the in-game report.
- **Loading time:** about 22 s on the software-rendering test machine, because of the whole-world draw rehearsal. Expected to be much faster on an iPhone, but unverified.
- **The test browser is very slow** (software 3D), so a few checks are timing-sensitive. Run the test alone.

## Backlog (highest priority first)
1. **iPhone report #2 (after build 33):** check that the graphics level recovers, read the frame work time, and ask for a run with Low Power Mode off to see real headroom.
2. **Indoor spaces:** a hidden playroom and a toy workshop interior (new layer) with a door in the world, built when entered.
3. **Shortcuts:** the first secret tunnel (Woods ↔ Toy Town) is done. Next: more tunnels, and a hidden "tunnel map" picture once one is found.
4. ~~More pets on the right side~~ (done in build 32). Next: a pal in the Adventure Trail, and pals reacting to each other.
5. **Creature polish:** idle variety (sitting, sniffing, looking at you), and followers stepping aside when you turn round.
6. **More regions to the left:** ocean pier, farm, rainbow mountain. Each needs a train station, a map picture, gems and its own unique activities.
7. **Graphics:** low-detail trees for the far background hills, softer sea shading, nicer station platforms.
8. **Loading:** spread the whole-world rehearsal across the first seconds of play, in small pieces, instead of all before the start.
