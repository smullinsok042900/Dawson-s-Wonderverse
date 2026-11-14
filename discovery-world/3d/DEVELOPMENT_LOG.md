# Dawson's Discovery World 3D — development log

Completed changes and how each was tested, newest first. Each checkpoint says what was verified, how, and on what (desktop
browser vs. a real iPhone). The routine and rules are in `CLAUDE.md`; unfinished work is in `NEXT_TASKS.md`; measurements
are in `PERFORMANCE_LOG.md`.

## Checkpoint: build41 — 3D pet nursery, creative play and world improvements

- Three original nursery pets hatch through picture-led play. Feeding, bathing, brushing, catch, optional bedtime, per-pet room colors, saved outfits and blankets use the same sculpted 3D pets, toy materials and real furnishings as the existing game. No declining needs, waiting or absence penalties.
- A shared viewport moves the existing renderer into native playrooms and restores it on close. World simulation pauses; cache and input ownership remain separate. Artwork is saved compactly and applied to actual fabric and framed surfaces.
- All41 learning activities use native 3D toys while retaining levels, demonstrations, voice, rewards and interaction targets. Physical world animals, fish, shells, gems, flowers and prizes are native cached single-draw models. Picture navigation, clues and editable artwork remain interfaces/surfaces.
- Fixed saved-builder removal after scene reparenting, hidden/detached targets receiving taps, temporary-resource cleanup, feeding visibility, repeated/stale learning rewards, demo progress, drag/paint cancellation, overlapping drop targets, X phonics, calm toy motion and scaled tablet HUD overlap.
- Core rendering/creature work reductions and eight-view performance measurements are recorded in PERFORMANCE_LOG.md. Results vary by view; no universal speedup or physical-iPhone result is claimed.
- Verification on desktop software rendering:
  - Full world sweep: **158/159 assertions passed**, with no console errors/warnings. The remaining fixed-duration stair hold stopped at k≈.992 before the top. A targeted real-touch rerun passed the exact null-stair/y=4.4 criterion, plus partway stop and downstairs checks, using bounded condition-based holds. Game JavaScript was unchanged; the subsequent HUD-only correction retained the identical compiled JavaScript hash. The original full report is retained honestly in tests/TEST_RESULTS.json; resolution is in tests/BUILD41_TARGETED_RESULTS.json.
  - Native nursery browser checks passed for hatching, all care, 3D snack dragging, real mouse/touch drawing, blankets/outfits, sleep/wake, reload with old collections, four nursery layouts and home entry.
  - All41 native learning scenes passed, including distinct model semantics, calm motion, actual hidden/detached raycasts and renderer restoration.
  - Both existing adventure integration/regression suites passed.11 changed HUD viewport layouts passed; these were viewport resizing checks, not eleven separate device identities or physical-device results.
  -24 state/audio/render-work unit cases passed, plus builder/model-swap regressions,337 one-draw model checks,58 distinctions and learning source contracts.
- One offline build41 bundle, cachev41 and previous published backup retained. The user merges the single release PR; real-iPhone playtesting remains a follow-up.

## Checkpoint: build 40 — connected adventures, one release

- Eleven optional picture adventures connect Fluffkin rescue, companions, learning, regional activities, art and Ocean Pier treasure. Progress and rewards are saved by stable event IDs; repeated/out-of-order discoveries cannot duplicate prizes.
- A picture/voice discovery book records sea creatures and places. Home and Art Plaza galleries keep compact painting and building previews, with saved souvenirs and a cushion choice. The pattern reward starts a small moving train in the house.
- Regional additions include an owl search with visible and audible clues, persistent snow friend, varied deterministic fishing catches, reusable shell clue, harvest/feeding milestones, sea discoveries and learning flowers.
- Illustrated map destinations show discovered activity pictures. The paw prompt shares its target selection with the indicator. Optional guide controls are at least 44 px and hide while creative tool trays are visible.
- Independent voice/music/effect settings, calm effects and gentle controls retain the existing master mute. Calm bubble, float/sink and magnet activities retain static visible outcomes. Musical creatures, castle toys and marble bins use the music channel.
- Existing save key and fields remain intact. Completed rescues can retell their story through pictures without resetting rescued babies. A detached home display is removed from both scene traversal and outdoor tap targets.
- Verified on desktop Chromium / SwiftShader (not an actual iPhone):
  - Full existing game smoke suite: **159/159**, no console errors or warnings, including old save/reload, creatures, rides, painting, building, farm, pier and learning checks.
  - Final focused adventure integration and regression suites passed after the home-display, music-routing and narrow-screen follow-ups. They check real activity callbacks, save reload, guide restoration, rescue replay, home routing, calm learning, music sources, woodland persistence, train movement and creative tray access.
  - Pure adventure state **8/8** and comfort/audio **3/3** tests passed.
  - **11 unique emulated screen sizes** passed. An older-iPad screenshot exceeded the device harness's original 30 s capture allowance; its rerun with the same 240 s screenshot allowance as the smoke harness passed every unchanged game/layout/touch assertion. Device results are in `screenshots/devices/RESULTS.json`.
  - Before/after performance and earned-reward measurements recorded in PERFORMANCE_LOG.md and tests/PERFORMANCE_BUILD40.json. Shader count remains 101; far home display detaches.
- Built to one offline HTML file; service-worker cache version is build 40. Previous published HTML retained in backups.
- After merging the newer main: rebuilt the HTML; reran all 11 unit checks, both focused adventure browser suites, and all three graphics-cap scenarios successfully on desktop Chromium.
- Delivery: repository access is now installed and the combined release is uploaded as PR #46. Latest main fixes for the iPhone graphics cap are retained; the PR is left for the user to merge.


## Checkpoint: build 39 — fixes from the first real iPhone report of the new builds
- **The report (iPhone, iOS 18.7, Home Screen app, build 36, 844×390 at 3×):**
  - start-up 3.8–4.8 s; moving between areas 130–300 ms; worst test frames 38–78 ms; frame work 7.7–8 ms;
  - a flat 30 fps everywhere (even the light house interior), so the phone is capping it. Likely Low Power Mode; the user has been asked.
  - Voice works: the sound button was off, and "Test the voice" spoke and finished a sentence.
- **Fixed:**
  1. **Time in the background no longer counts as a frame.** The report showed a "10,412 ms freeze": the app was in the background while the results were copied.
  2. **A 30 fps cap is recognised by trying.**
     - On the iPhone, the automatic graphics went 4→5→4 under the cap: a worse picture for nothing.
     - Now, when frames are at about 30 fps and seem slow, the picture drops to the lowest level for 6 s. If even that isn't faster, it is a cap: back to the previous level, no more lowering while the cap lasts, and the build 33 "room to spare" rule may raise the quality.
     - If it IS faster, the device really is slow: one level lower than before, and the "room to spare" rule is switched off (it measures CPU time only).
  3. **The report shows the real build number** (it always said "build 26").
- **Verified (desktop):** `tests/perf/capcheck.cjs` feeds recorded frame times to the automatic graphics:
  - (A) a jumpy 30 fps cap like the iPhone's: one 6 s test, then the best picture (level 0);
  - (B) a genuinely slow device (22 fps): steps down to level 5;
  - (C) a GPU-bound device at 30 fps that is faster when lowered: test, then level 3 (60 fps).
  - The first versions of this logic failed (C) twice; both were fixed before this checkpoint.
  - `ba.cjs` runs with adaptive quality off, so it can't show this change.
  - The full smoke test result is recorded in the commit after this entry.
- **Build 38 (🌊 Ocean Pier) after merge:** full smoke test 159/159, device test 10/10.

## Checkpoint: build 38 — 🌊 Ocean Pier (merged as #44)
- New district (x -668 to -536) with 7 activities (fishing, tide pool, musical buoys, dolphin, treasure, sailboat, whale), crates and gems g17–g18, Splash the seal 🦭, and a 🌊 station (20 stations).
- Walking in: 0 long tasks, programs 101 → 101, 71 calls and 104k triangles.
- `ba.cjs` 37 → 38: no slower. Full smoke test 159/159; device test 10/10.
- An 835 ms long task happened once on a train trip (x 202) and did not reproduce in 2 more runs of each build: on the task list.

## Checkpoint: build 37 — the castle draws much less
- **Castle front merged:** 162 still, untapped parts of the build 16 castle front (steps, railings, shutters, flower boxes, climbing roses, hedges, topiary, lanterns, rose window, banners) are merged into one shape per *look-alike* material.
  - The code made a new material object for every part, so the parts are grouped by what the material looks like: type, colours, roughness, textures and so on.
  - The castle group goes from 213 meshes to 67. No new shaders, because the materials are the same.
- **Verified (desktop, software rendering):**
  - `tests/perf/calls.cjs` at x 398: 221 → 163 draw calls per frame (castle group 89 → 31).
  - `tests/perf/ba.cjs` 36 → 37:
    - castle calls 562 → 319; script ms/frame park 13.2 → 11.2, creatures 10.6 → 8.9, castle 11.8 → 9.9;
    - 0 long tasks; geometries 1514 → 1372; programs 101.
  - Before/after screenshots of the castle front show the same parts.
  - Full smoke test 155/155.

## Checkpoint: build 36 — one game for every phone and tablet (Apple and Android)
- **Screen fitting:**
  - The picture is drawn at the canvas's real on-screen size: no stretching (build 34b), with a ResizeObserver plus a twice-a-second safety check.
  - **Camera:** on screens squarer than about 2:1 (iPads are 4:3), the vertical view angle opens part of the way (38° → about 47–49°), so the sides stay in view instead of looking zoomed in. Phones are unchanged.
  - **Pixel budget:** the picture is drawn at no more than 1.0 M pixels on phones, 1.6 M on tablets and 3 M on desktops (Performance mode: 60% of that). Phones are already under it; dense tablet screens no longer draw 2–3× a phone's pixels.
- **Interface:**
  - `--ui` scale: 1 on phones (never smaller), up to 1.35 on tablets. Controls use transforms, so the arrow pad's direction maths still works.
  - Top buttons are at least 46 px. On narrow phones the right-hand group wraps onto a second row instead of running off the screen.
  - The 🗺️ and 🐾 panels size their tiles from the screen's width and height and wrap; the grown-ups' panel, title card and memory cards fit short screens.
  - The title label is hidden on touch screens (the bigger tablet buttons covered it).
  - The station strip wraps instead of scrolling (pictures past the edge were unreachable by touch) and opens below the top buttons.
  - The "turn me sideways" picture shows on every touch screen held upright, including tablets.
- **Platform:**
  - Full screen and a landscape lock where the browser allows them (Android Chrome, iPad Safari; not iPhone Safari, where the Home Screen app is the full-screen way). PLAY asks for full screen on touch devices in a browser tab; there is a ⛶ button in ⚙️.
  - Sound resumes after a call or an app switch on iPhone (the 'interrupted' state).
  - Every button is released when the app is hidden.
  - Device detection: iPad (which reports itself as a Mac), Android tablet vs phone, Home Screen app.
- **⚙️ Graphics:** Auto (measured frame times, as before) or a fixed Quality, Balanced or Performance mode, remembered on the device.
- **Verified (desktop Chromium emulation only — real iPhones, iPads and Android devices still need testing):**
  - `tests/devices.cjs` covers 10 screens: iPhone SE, iPhone 15, iPhone 15 Pro Max, iPad 7, iPad Pro 11, Pixel 5, Galaxy S9+, Galaxy Tab S4, a 640×360 Android and a 21:9 Android. **10/10 pass:**
    - the picture fills the screen unstretched;
    - every button is on screen, at least 45 px, with no overlaps;
    - the map, pets and station panels fit, including next to the top buttons;
    - holding ▶ walks, letting go stops, and JUMP jumps;
    - held upright, the "turn sideways" picture shows.
    - The first run found real phone problems (buttons 34–42 px, ⚙️ off screen on narrow phones); those were fixed. Looking at the screenshots found two more (the covered title label on tablets, the strip covering the second button row); those were fixed and the test now checks them.
  - `tests/perf/ba.cjs` 35 → 36, side by side: script ms/frame park 14.3 → 10.0, creatures 16.1 → 8.2, castle 12.9 → 12.2 (run-to-run noise is about ±4 ms on this machine); 0 long tasks; programs 101; memory unchanged.

## Checkpoint: build 35 — 🚜 Happy Farm
- **New region: 🚜 Happy Farm** (x -536 to -404, left of Frosty Peaks). Streamed like the other districts, with shared materials only. 11 picture-only activities:
  - **Barn:** the doors open and an animal says hello (horse, cow, goat, sheep, rooster, with its sound and name).
  - **Hen:** lays eggs; count to five and the chicks hatch.
  - **Rainbow sheep:** her wool changes colour and she says the colour.
  - **Haystack:** climb the bales and bounce on top; gem g15 floats above it.
  - **Vegetable patch:** seed → sprout → carrot → pull it up, and count.
  - **Apple tree:** apples drop into the basket; count to five.
  - **Windmill:** tap it to make it spin.
  - **Duck pond:** the ducklings follow their mother in a line.
  - **Toy tractor:** drives across the field and back.
  - **Mud puddle with piglets,** and cows mooing in the field.
  - **Gem g16** at the end of the path.
- **New pal: Truffle the piglet 🐷.** Three taps to befriend; follows you; appears in 🐾. The save accepts the new `pig` key.
- **Train:** the line is extended to x -534 with a 🚜 station (19 stations). The map gets 🚜 automatically from `DISTRICTS`.
- **Ground:** a lawn zone, the cobble path, the front rail and a few trees behind the fields.
- **Bug fixed:** Frosty Peaks' falling snow followed you onto the farm. It now only falls in Frosty Peaks.
- **Test fix:** the first walking check now waits for frames to settle. It failed once (1.9 m vs. more than 2) in the first seconds after start-up on the slow test machine.
- **Verified (desktop, software rendering):**
  - Walking into the farm from Frosty Peaks: 0 long tasks; shader programs 101 → 101; 90 draw calls, 270k triangles.
  - `tests/perf/ba.cjs` 34c → 35: script ms/frame unchanged (park 13.5 → 13.7, creatures 11.9 → 11.4, castle 13.2 → 14.0, all within run-to-run noise); 0 long tasks everywhere; memory 121 → 122 MB, programs 101 → 101.
  - Train to 🚜: whole line arrives, 19 picture tiles, 0 frames near an unbuilt district.
  - Screenshots of the barn, pigs, sheep, windmill and tractor look right.

## Checkpoint: build 34c (user request)
- **Removed the big pink wall** at x -1.5, by the train at the start of the playhouse (requested with a screenshot). It was the old left edge of the world. The world now continues left and the train runs through there, so it only blocked the view.
  - It was scenery only (no collision, nothing referenced it).
  - **Verified (desktop):** the view by the train is clear; walking left from x 1 reaches x -14 with no errors.

## Checkpoint: build 34b (urgent fix)
- **"Squished" picture on iPhone (reported with a screenshot):** when the phone turned, Safari could still report the upright size. The game then drew a tall picture and stretched it across the wide screen, so it looked blocky, zoomed in and too wide.
  - **Fix:** the picture is now sized from the canvas's real size on screen. It is rechecked every frame (a cheap comparison) and on orientation and visual-viewport changes.
  - **Reproduced and verified (desktop):** the browser was made to report the stale upright size after turning. Build 34 drew 292×633 onto an 844×390 screen; 34b draws 633×292.
- **Measuring scripts** are now kept in `tests/perf/` (`ba`, `walknew`, `train`, `soak`, `sweep`, `house2`, `movers`, `chunkchk`), so later sessions can reuse them. Run them from `discovery-world/3d` with the html file as the argument.

## Checkpoint: build 34
- **Express train:** picture trips longer than about 280 m speed up to 36 m/s (was always 20). The whole line takes about 42 s of game time, down from about 68 s. Short trips are unchanged.
- **Verified (desktop, `tests/perf/train.cjs`, before → after):**
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
