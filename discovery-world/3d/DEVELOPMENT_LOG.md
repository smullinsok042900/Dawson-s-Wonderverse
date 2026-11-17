# Dawson's Discovery World 3D — development log

Completed changes and how each was tested, newest first. Each checkpoint says what was verified, how, and on what (desktop
browser vs. a real iPhone). The routine and rules are in `CLAUDE.md`; unfinished work is in `NEXT_TASKS.md`; measurements
are in `PERFORMANCE_LOG.md`.

## Checkpoint: build 67 — an ice castle and a skating rink on Uranus; a funhouse mirror maze on Mercury
- **The family asked** for an ice castle and an ice skating rink on Uranus, and a funhouse mirror maze on Mercury. Both planets are now big places (330 m, `PLANET_EXTRA`).
- **Uranus, area 2: the ice castle:**
  - towers with pointed roofs, battlements with icicles and frosty windows;
  - steps up to a long rampart; walk off its right end and you whoosh down a see-through ice slide.
- **Uranus, area 3: the skating rink:**
  - a big oval rink with a fence, and three snowy skaters gliding round;
  - walk onto the ice, then let go: you keep gliding (measured 7.9 m) and leave sparkles.
- **Mercury, area 2: the funhouse mirror maze:**
  - a striped funhouse entrance and a hall with seven big mirrors that show YOUR character, funnily changed (tall, wide, tiny, giant, wobbly, upside down, squiggly);
  - one copy of your character is moved to the mirror you stand at;
  - three mirror doors stand across the way at an angle; they are solid until you tap them, then they spin up and open;
  - a golden star waits at the end.
- **Game change** (`main.js`): the planets can make a copy of your character (`makeCreature`, `creatureKind` in the space api).
- **Verified (desktop, software rendering):**
  - Uranus: slid down from the rampart; glided 7.9 m after letting go.
  - Mercury: a door stopped her at +17.4 m (door at +18); the doors opened and she reached the star; the stretched reflection is visible in the screenshots.
  - no page errors; new smoke checks. **Full smoke test, run alone: 219/219.**

## Checkpoint: build 66 — bounce castles on Pluto; a playground and a super-duper tall slide on Jupiter
- **The family asked** for super bouncy bounce castles on Pluto, and a playground and a super tall crazy slide on Jupiter.
- **Pluto and Jupiter are now big places (330 m)** through `planets.js` (`PLANET_EXTRA`), like the Moon and Mars. Their new areas are built as you walk near and freed when you fly away.
- **Pluto, area 2: three inflatable bounce castles** (pink, blue, giant rainbow):
  - walk onto the floor and you bounce by yourself, again and again; walk off the edge to stop;
  - with Pluto's tiny gravity the bounces reach about 6.5 m, 11.5 m and 18.5 m (measured), and you float down slowly; the floor squashes when you land;
  - Pluto's area 3 has icy spires and a sign back to the rocket.
- **Jupiter, area 2: the playground** (all by tapping, since Jupiter's strong gravity only allows tiny hops):
  - two swings that go higher and higher (about 10 s);
  - a merry-go-round you ride round and round;
  - a seesaw with a teddy;
  - a wobbly rocket spring-rider.
- **Jupiter, area 3: the super-duper tall crazy slide:**
  - a 30 m striped tower with a glass lift;
  - a see-through rainbow tube that spirals three times round the tower, then drops, corkscrews and wiggles about 90 m to the path, up to 13 m/s;
  - you cannot hop out of the lift.
- **Game changes** (`main.js`): slides can be given a faster top speed (`G.startSlide(path, { vmax, acc })`); rides marked `noExit` ignore PAW; the planets drive their own small rides (swing, merry-go-round, lift).
- **Cost:** only on those planets, only while those areas are built:
  - Pluto: 2 meshes per castle;
  - Jupiter: about 14 (the slide tube, the posts and tower as one mesh, the glass, the lift, the playground pieces batched).
- **Verified (desktop, software rendering):**
  - bounce heights measured;
  - a swing ride, and a lift-and-slide ride (top 30.1 m, slid to the end, about 23 s);
  - screenshots; no page errors;
  - new smoke checks for both planets. **Full smoke test, run alone: 208/208.**

## Checkpoint: build 65 — a giant roller coaster on the Moon
- **The family asked** for a giant roller coaster on the Moon.
- **Where:** in the Moon's crater valley (area 2), with the station by the path at +96 m (between the moon rocks and the end of the area). Tap the car, or PAW at the station.
- **The track** (about 330 m, built in `planets.js` `moonCoaster`):
  - a clicking chain lift up to about 17 m, then a big drop and a camel-back hill;
  - a full loop-the-loop (a little corkscrewed, so the track never meets itself) and bunny hops;
  - then a swoop round behind and a long return back to the station;
  - two pink rails, white ties and purple posts; ties and posts are one mesh.
- **The ride** (`main.js` `G.startCoaster`, `coasterRide`):
  - the chain lift is steady, then the speed comes from the height you have dropped (fast down the drop, slower over the hills, up to 15 m/s);
  - the car follows the track and turns over in the loop, and your character tilts with it (upside down at the top);
  - PAW cannot drop you out mid-air; the camera follows you behind the scenery;
  - at the end you step out at the station ("Tap the car to go again!").
- **Cost:** only on the Moon, only while its crater valley is built: about 12 draw calls (rails 2, ties and posts 1, car 1, station 8 small boxes).
- **Verified:** a ride in the test browser (desktop, software rendering) reached 16.9 m, went upside down at the loop's top and ended at the station, with no page errors; screenshots. A new smoke check rides it end to end. **Full smoke test, run alone: 199/199.**

## Checkpoint: build 64 — fixes from the family's 16 phone screenshots
- **Pictures the family disliked:**
  - (The station picture discs were removed for a moment by mistake; the family meant the colouring pictures. They are back.)
  - **The floating 👂** in the Whispering Woods is now a little wooden birdhouse on a post. Tapping it plays the owl call as before.
  - **The pier whale** was a flat grey blob. It is now a friendly blue whale with a pale belly, eyes and a tail fluke that waves; tapping it still spouts.
- **Overlaps:**
  - **Rocket:** its pad sat on the colour pond and over the path. The rocket moved 686 → 693, further back, and the pond moved back from the path.
  - **Toy Town:** the balloon basket stood in front of a house (balloons rose up its wall); it is now in the gap between houses (x 651.5).
  - **Farm:** the tractor is further from the fence.
  - **Stream bridge:** it is now a planked wooden bridge with edge beams (one mesh). The stream is as wide as the bridge, so no water shows on the path beside it, and the stepping stones are further upstream.
- **Looked odd:**
  - **The ice pond** is an oval, not a hard-edged rectangle.
  - **The shadow wall** has a purple frame and shows a bunny shadow from the start.
  - **The spin-art wheel** has paint and a pink rim from the start.
  - **The sticker wall** has soft polka dots.
- **The map (🗺️) shows real pictures:**
  - every place's button is a small real picture of that place (the house, the slide tower, the Ferris wheel, the castle, the hot-air balloon, the sailboat, the red barn, the igloo, the fox's burrow, the lighthouse, the bridge, Toy Town, the rocket…), with its emoji in the corner; it used to be the same generic drawing for many places;
  - the pictures are made by `tools/make-map-thumbs.cjs` and built into the game (`src/map-thumbs.js`, 16 pictures, 131 KB); re-run it when a place changes a lot.
- **The rocket's planet picker:** every planet is painted on a starry tile (Earth with land and clouds; cratered Moon, Mercury and Pluto with its heart; Mars with its ice cap; swirly Venus; Jupiter's bands and red spot; Saturn's and Uranus's rings; streaky Neptune) with its name under it, instead of a plain coloured ball. Drawn once on a small canvas when the picker first opens.
- **From the family's second set of 7 screenshots:**
  - **Grass and flowers** no longer grow on the path or the train track (both are kept clear).
  - **The colouring easels** (the "castle and rainbow" and "butterfly" pictures):
    - each part is now coloured then outlined in turn, so lines of hidden parts no longer show through;
    - the butterfly has real curved wings and antennae instead of overlapping ovals;
    - the colourable parts are the same, so saved colours stay.
  - **Trees inside rainbow arches:** the trees at 138 and 200 are moved back. The arch at 135 is removed: it stood half in the Wonder Lab's wall, with a bush in it.
  - **The Puzzles learning spot** shows a 🧩 puzzle piece instead of a pink 🧠 brain.
- **Cost:** the whale and the birdhouse are one mesh each (the whale's tail is a second); the 36 station discs are gone. Draw calls at the changed places are the same as build 63 (pier 66, woods 78, Frosty 78, trail 79, Lab 80 vs 84) and lower in the park and Studio.
- **Verified:** screenshots of every place (desktop, software rendering), no page errors; node checks 50/50; learning contracts. **Full smoke test, run alone on the final build: 198/198.** Smoke checks follow the moved rocket (PAW at x 692; landing at 695.5); the sky-whale tap is patient (it swims).

## Checkpoint: build 63 — zoomed out to see whole activities
- **The family asked** to zoom out more, to see more and do every activity.
- **Camera:**
  - 9 → 12.5 m away, 2.15 → 2.9 m up, aimed 1.95 m up instead of 1.15;
  - whole houses with roofs, the whole Block Builder wall, the top of the paint wall, the Ferris wheel and the hill steps now fit;
  - a little less of the train track shows.
- **Paying for the wider view:**
  - each sky cloud is one mesh (was 5);
  - the park kiosk is merged (32 pieces → a few);
  - inside each scenery slice, still pieces that look exactly alike and cannot be tapped are drawn as one mesh (607 pieces → 108 merged meshes);
  - a safety net (twice a second) restores the original pieces of a group the moment the game moves, hides, re-colours or reshapes one. On a walk through the world 10 groups were restored this way;
  - `?nomerge` turns merging off for comparison.
- **Measured (desktop, software rendering; `tests/perf/calls.cjs`, draw calls per frame, build 62b → 63):**

  | Spot | Build 62b | Build 63 |
  |---|---|---|
  | Park | 181 | 183 |
  | Studio | 131 | 149 |
  | Wonder Lab | 127 | 121 |
  | Castle | 188 | 195 |
  | Toy Town | 65 | 69 |
  | Frosty Peaks | 71 | 79 |

- **`tests/perf/ba.cjs`, build 62b → 63:**

  | Measure | Build 62b | Build 63 |
  |---|---|---|
  | Load | 31.0 s | 28.3 s |
  | Longest start-up stall | 21.7 s | 16.4 s |
  | Park, script ms/frame | 14.1 | 17.2 |
  | Creatures, script ms/frame | 12.8 | 9.2 |
  | Castle, script ms/frame | 17.8 | 15.4 |
  | Memory | 137 MB | 152 MB |

  - No long tasks in any view, and the map jump lost its 73 ms task. Shader programs are the same (114).
  - The extra memory is the original pieces, kept for the safety net.
- **Full smoke test, run alone: 198/198.**
- **Not yet tried on the iPhone.** Watch the Studio and Frosty Peaks: they draw the most extra. The adaptive graphics still lower quality by themselves if a phone runs slowly.

## Checkpoint: build 62b — overlaps from the family's video
- **The family sent a 6-minute screen recording** of the whole world on their phone and asked to fix everything that is messed up or drawn into something else. Every frame was reviewed at full size (one every 4 s).
- **Fixed:**
  - **Your character's things:**
    - the crown now sits ON the head (it floated above it);
    - the wand is held at the side (it floated 0.7 m away);
    - the balloons hang on short strings just above the head (they flew 3 m up, behind the buttons at the top).
  - **Start:** "Loading the 3D world…" no longer shows through the title card.
  - **Studio:**
    - the giant rainbow slide's exit ended inside the first xylophone keys; it now ends just before them;
    - the rainbow arch at x 51 had one foot in the sky ladder and half of it behind the paint wall; it is removed (the arches at 92 and 135 stay).
  - **Adventure Park:** the ABC learning spot stood under the Ferris wheel's leg. It is now in the clear gap beside the Fluffkin House (x 182).
  - **Race track:** its front kerb ran onto the path; the oval sits 1 m further back.
  - **Seaside:** the little boat was moored inside the pier's end; it is anchored 1.6 m further out.
  - **Gems:** three gems were lined up in front of the pier end, the igloo door and the tractor; they are moved beside them.
  - **Frosty Peaks:** the ice pond stuck out past the path towards the track (now trimmed). The sled-hill steps are icy blue, not grey boxes.
  - **Balloon Hills:** the hill's steps are wooden, not green boxes poking out of the green hill.
  - **West end:** the pink buffer at the end of the track merged with the pink first rainbow step; the buffers are wood-coloured now.
  - **Adventure Trail stream:** the water stops before the track, and the bridge has one railing at the back (the front one stood over the rails on screen).
  - **Toy Town tunnel:** it is centred in the gap between the houses. Build 61 had moved it the wrong way, into a house. The floating 🕳️ sign is gone: it showed as a black blob over the cave.
  - **🏠 markers in the world removed** (the family asked): the 🏠 signs at the ends of the Whispering Woods, Frosty Peaks, the farm, Ocean Pier and Balloon Hills, and the rainbow 🏠 portal at the end of the Art Plaza. The 🏠 button (top left) and the map take you home.
- **Not changed:**
  - Dawson steers the sky whale herself, so flying through the cloud castle is her choice.
  - When floating down from the whale near the Fluffkin House, the camera shows the house wall for about two seconds before catching up. That is a camera follow issue, noted in NEXT_TASKS.
- **Verified:** screenshots of every fixed place (desktop, software rendering, phone-sized screen, character with crown, wand and three balloons), no page errors; node checks 50/50, learning contracts. FULL_SMOKE_HERE

## Checkpoint: build 62 — Talk Together: live voices in Play Together
- **The family asked** for real, live voice between players of a multiplayer room (no text, no recorded messages, no other app), child-safe, on iPhone/iPad Safari and Android Chrome, without slowing the game.
- **What it is** (`src/voicechat.js`, wired into `src/multiplayer.js`):
  - **The call:** a WebRTC call between each pair of players in the room (a mesh: at most 3 calls per device). The audio is Opus (mono, ~32 kbit/s, FEC, DTX), always encrypted (DTLS-SRTP). Echo cancellation, noise suppression and automatic gain come from the browser.
  - **Call set-up:** through the room's own connection: `voice/<id>` (who has talking on) and a private inbox `sig/<id>` per player. The test relay forwards the same messages only inside one room.
  - **Controls:**
    - off by default; a grown-up allows it in ⚙️ (held): **🎤 Talking … On**;
    - in the room panel: 🎤▶ turns it on (the only moment the microphone is asked for); 🔈🔉🔊 volume (remembered); 🎤✖ turns it off;
    - beside 👫: a 🎤 button with a live red light, one tap mutes (🔇);
    - tap a friend's dot to block them (🚫): the call between you ends both ways, and their device stops calling until you undo it.
  - **Speaking lights:** a 🗣️ over a friend who talks, their dot glows in the panel, and my own 🎤 glows green. They are read from WebRTC's own audio level on a 150 ms timer, never in the frame loop.
  - **Repairs:**
    - a call in trouble gets an ICE restart after 3 s, and a new call after 12 s;
    - a friend who drops out of the room for a moment keeps the call (8 s grace);
    - a microphone taken away (phone call, background) is taken back when the game returns;
    - a reloaded game starts with talking off again.
  - **iPhone/iPad volume:** these ignore an audio element's volume, so the in-game volume goes through a Web Audio gain there. It falls back to the plain element if that stays silent.
  - **Nothing is recorded or stored.**
- **Database rules** (`firebase-rules.json`):
  - New `voice` and `sig` sections: only players in the room may write, and only the owner may read an inbox.
  - **Fixed an old mistake:** the build 56 rules used `numChildren()`, which Firebase rules do not have, so the full rules could never be published. The 24-line paint limit now uses the line numbers.
  - Checked on Firebase's own Realtime Database emulator: `tests/firebase-rules.emulator.mjs`, **26/26**.
- **Verified (desktop Chromium, software rendering, separate browser sessions with simulated microphones):** `tests/voicechat.cjs`, 34 checks: the live call connects in under a second; two-way Opus audio (packets and real sound level both ways); the voice plays out loud; speaking lights; mute → the friend hears true silence (level 0.0000), unmute → sound again; volume; blocking (and its messages ignored), unblocking; a stranger in another room can not reach the call; the room connection dropping while the voices keep flowing; a page reload and reconnecting; three players each hearing the other two; leaving, 🎤✖ and the grown-up switch all stop the microphone; the voice timer costs 0.16 ms per check; nothing in the save; no page errors. Final run: **34/34**. Also `node --test` (voicechat.test.mjs and all others) and the existing `tests/multiplayer.cjs`.
- **Also fixed in build 62 (found by the full smoke test, both older than this build):**
  - On a phone the top-right buttons wrap onto two rows since the fourth character (build 59). That caused two problems:
    - the Block Builder's tray sat under 🔊 and ⚙️, which hid its red block;
    - the empty corner of the button row swallowed taps on the world beneath (the sleepy owl could not be tapped).
  - Now only the buttons themselves catch taps. The block tray is a two-row strip placed just below the buttons, so it reaches neither 🔊/⚙️ nor the jump button.
- **Full smoke test, run alone on the final build: 198/198 passed** (screenshots and `tests/TEST_RESULTS.json` committed).
- **Smoke test updates (not weakened):**
  - The mechanic fox is tapped where it lives since build 60.
  - The Play Together check now expects 👫 to be shown, since the room service was set up in build 56. It still checks that nothing connects or downloads on its own, and that talking is off.
  - One narrow console exception: Chromium's own GPU-driver note "GPU stall due to ReadPixels". It comes from the character portraits' one-time readback at start-up (build 56, the Android fix). A better fix (asynchronous readback) is in NEXT_TASKS.
- **NOT yet tried on real phones or across different networks.** Two devices on the same home Wi-Fi should connect with the built-in STUN servers. Phones on mobile data or strict Wi-Fi may need the optional TURN relay (MULTIPLAYER.md, "Different networks").

## Checkpoint: build 61 — overlapping graphics fixed across the game
- **The family asked** to go through the whole game and fix every place where graphics overlap.
- **How they were found:** a new screenshot tour, every 16 m from x −826 to 940, plus the house (both floors), the castle, underground, the Sky Kingdom, the underwater world and the planets.
- **Fixed:**
  - **Ocean Pier (x −669 and −535):** the sea ended in straight cut edges at both ends. Grassy headlands now hide them, like the beach one.
  - **The Whispering Woods fox burrow (x −263):** gem g12 sat inside the burrow, on top of the fox. It is moved to x −259.5. Saved gems keep their id, so nothing is lost.
  - **The secret tunnels:** the floating 🕳️ sign touched the top of the rock dome. It now bobs clear above it.
  - **The Toy Town tunnel (x 612)** was pushed into the corner of a house and against the ball cannon. It is moved to x 609.6, and the tunnel from the woods arrives there.
  - **The learning spots** (🔢 🔤 🎨 🧩 🔬 🎵 🙂): the yellow "tap here" ring was drawn stacked in front of the spot's own glowing ring, so there were two rings on top of each other. Only the spot's own ring shows now.
- **Verified:** before and after screenshots of each place (desktop, software rendering), with no page errors.
- **Not yet tried on the real iPhone.**

## Checkpoint: restore (2026-11-16) — back to build 59 plus build 60; builds 61–77 undone
- **The family asked** to undo the graphics changes made by another session after build 59 (builds 61–77: terrain and mountains, instanced park trees, moving water surfaces, box collision and others, then a partial rollback that served a frozen copy of build 59 from `discovery-world/play59/`). They also asked to keep this chat's build 60.
- **Done as a normal merge (no history rewritten):**
  - `discovery-world/3d` is exactly build 60: build 59 plus the build 60 fixes (fireplace, water off the track, beach headland, fox, light eyes).
  - The files builds 61–77 added (`collision.js`, `terrain.js`, `worldcheck.js` and their tests) are removed.
  - The automatic rebuild (`.github/workflows/build-3d.yml`) is back as it was at build 59.
  - `discovery-world/index.html` points to `3d/` again.
- **Kept:** all backups (including `3D_build74_before_collision_repair_index.html`) and the `play59/` folder, so any Home Screen icon saved with that address still opens. That copy stays on build 59.
- **To find builds 61–77 again,** see the commits between `adcca07` and `3dbcd61` on `main`.

## Checkpoint: build 60 — graphics fixes from a whole-game tour, and a lighter carousel and critters
- **How the problems were found:** a screenshot tour of the whole game (`tour.cjs` in the session; every 20 m across the world, inside the house and castle, underground, the underwater world, the Sky Kingdom and every planet).
- **Fixed:**
  - **The fireplace:** the flames floated in front of a solid block, half a metre off centre. It is now a real fireplace: pillars, a mantel shelf, a dark recessed firebox with a softly flickering glow, two crossed logs and a stone hearth. The flames stand on the logs inside the opening and flicker up from their base.
  - **Water and ice over the train track:** the woods creek (x −226), the Frosty Peaks ice pond (x −361) and the Adventure Trail stream (x 450) all ran over the rails and the strip in front. They now stop just before the track.
  - **The beach's sea** ended in a hard straight cut where the woods begin (x −156). A grassy headland now hides the end.
  - **The fox** wandered into the wall of the pink building beside it. Its home is moved a little away.
- **Faster:**
  - The carousel ponies and the nine wandering critters now use light eyes (4 parts per eye instead of 8: no cornea gloss layer, one catchlight instead of three, no lower lid). These eyes are small on screen there, and they still blink and glance. Your own character, pets and following buddies keep the full eyes.
  - Measured: the carousel draws 126 → 78 parts, each critter 8 fewer, and the park view 230 → 198 draw calls per frame (desktop, software rendering; see PERFORMANCE_LOG).
- **Not yet tried on the real iPhone.**

## Checkpoint: build 59 — Sprout, a fourth main character
- **The family asked** for a fourth character, since up to four players can play together now and there were only three.
- **Sprout** (`characters.js`, `sproutSpec`) is an original leaf sprite:
  - a round, velvety mint-green body (the same kind of soft material as Pip's, so no new shader);
  - two leaf ears that point up like sprouting leaves and spring when it hops;
  - big violet eyes that blink and glance, like the others;
  - a pink flower on a stem on top of its head, which sways as it walks and spins when it jumps or giggles;
  - a curly leaf tail, rosy cheeks and a smile.
- One sculpted body on its own skeleton, like Pip, Zuzu and Jelly, with its own walk (a bouncy step, swinging arms, the flower swaying after everything else) and the same waves, looks and hops when idle.
- **Choosing it:**
  - It appears on the title screen and in the top bar (four pictures).
  - Its picture is drawn by the game like the others (the Android picture fix reads four pictures now).
  - Saves remember it, the 🎨 colour styles work for it, and its jumps are between Pip's and Zuzu's.
- **Multiplayer:** others see Sprout. A game that receives a character it doesn't know (an older or newer build) shows Pip instead of breaking.
- **Verified (desktop, software rendering):**
  - Screenshots of the title screen, standing and jumping.
  - No page errors, and no new shader programs (150 before and after choosing it, in `?test`).
  - Unit tests 47/47 and learning contracts 41/41.
  - Browser tests: see the PR.
- **Not yet tried on the real iPhone.**

## Checkpoint: build 58 and earlier (another session): see below

## Checkpoint: build 56 — Play Together, a world you share
- **The family asked** for multiplayer to become a truly shared world, not just player-position markers. The Firebase
  project they made is now in the game.
- **What the room shares (`src/multiplayer.js`, new `src/shared.js`):**
  - **the players** (build 55): each other's creatures, colours, pets;
  - **the Block Builder wall**: a block placed or erased on one device is written as `objects/b<i>` and applied on the
    others; remote blocks are noted and the wall is rebuilt once a frame (never one rebuild per block);
  - **the big paint wall**: finger lines are batched (at most 24 lines, sent about three times a second) as
    `objects/s<id>`, drawn on the other devices in the same wall coordinates, and 🗑️ writes a clear that erases the room's
    strokes for everyone;
  - **pets**: each player's pet recipes travel in their own player entry (`ps`), and up to two of a friend's pets walk
    behind them on your device;
  - **a 👋 wave**: an `events` entry, removed again after half a minute, shown as sparkles, a sound and a waving hand.
- **The room keeps its world:** objects are not deleted when a player leaves, so the tower and painting are still there
  when the same four-animal code is used again. Paint strokes are capped (60 batches, oldest dropped for everyone).
- **Small and safe:** `src/shared.js` holds every limit and check (block cell/type, paint colour and line, pet recipe, a
  wave) and `tests/shared.test.mjs` checks them without a browser. `firebase-rules.json` checks the same things again in
  the database: only the three small shapes are accepted, text is refused, each device writes only its own player entry,
  rooms hold at most 4. Rooms live under `dw3/rooms/<CODE>`, so an older game's rooms cannot collide.
- **Config:** `src/mp-config.js` now holds the family's Firebase project (the same values an earlier Copilot change had
  put in the 2D game, which has since been removed), so the 👫 button is no longer hidden. The database rules still have
  to be pasted once (`MULTIPLAYER.md`, step 3).
- **The build is now made on GitHub:** this environment has no terminal, so `.github/workflows/build-3d.yml` runs
  `npm ci` and `node build.mjs` when the 3D source changes, commits the rebuilt `index.html`, `mp-firebase.js` and
  `version.json`, and Pages publishes them. The service-worker cache name is now `dawsons-world-v56`.
- **How verified (and what is NOT):**
  - the pure rules were written to be checked by `tests/shared.test.mjs` (runs in the workflow; `continue-on-error`, so
    a failing check cannot stop the build);
  - `tests/multiplayer.cjs` gained four checks for the shared world (a block and a paint line crossing between two
    browsers, and a wave);
  - **not run here:** no browser and no Node in this environment, so neither the Node checks nor the two-browser test nor
    the smoke suite were run against this build. **Not measured:** no performance numbers (see below). They must be run
    on a machine with Node and Playwright, and then on two real devices as `MULTIPLAYER.md` says.
- **Performance safeguards (not measured):** with no room nothing is created at all (same code path as before, the only
  additions are no-op hooks); remote pets are limited to 2; a friend's arriving blocks cause at most one wall rebuild
  per frame; paint arrives in batches; nothing new is drawn per frame when alone.

## Checkpoint: build 58 — a refused room can no longer close the game; `?mpcheck`
- **Reported:** creating a room showed the purple "Oops! … Permission denied" screen. A Firebase rejection was reaching
  the page's unhandled-rejection handler, which replaces the whole game with that box.
- **Fix (`src/multiplayer.js`):** joining is wrapped (both around the transport's join and around the whole join), so a
  refusal speaks/shows a picture message and returns to the room panel; a small classifier names the likely cause
  (rules not pasted, sign-in off, no internet). Playing alone is untouched.
- **New `?mpcheck`:** a troubleshooting page inside the game. It prints the project and database address, whether
  anonymous sign-in works, and the result — with Firebase's own code and message — of reading `dw3`, reading a room's
  players, and writing a player and a block; the test room `AAAA` is removed afterwards. Nothing happens without the
  flag, and it is not part of normal play.
- **Rules simplified (`firebase-rules.json`):** the wildcard-key `matches()` checks were cosmetic; they are gone (key
  length and the data shapes are still enforced), so the ruleset is less likely to be refused when pasted.
- **Not verified here:** no browser or Node, so this was not run. An unauthenticated probe of the live database returns
  "Permission denied", which the rules intend — the signed-in `?mpcheck` result is what will show the real cause.
- **What `?mpcheck` showed on the live site (build 58):** project and database address match `src/mp-config.js`, and
  `sign-in: OK` (anonymous sign-in works), but every read and write under `dw3/rooms` returns `PERMISSION_DENIED`. So
  the published rules on that database are not the ones in `firebase-rules.json` (never applied, applied to Firestore,
  or applied to another instance). `firebase-rules-simple.json` was added as a minimal, hard-to-reject paste for that
  case; the full rules can follow once rooms work.

## Checkpoint: build 57 — Android/Pixel rendering fixes (PR #56 by zyzil)
- **Reported:** on a Pixel 10 Pro XL the character-selection pictures were blank and movement sometimes produced a black
  flash.
- **Portraits (`src/main.js` `renderPortraits`):** each of the three pictures is now read straight out of the WebGL
  drawing buffer with `gl.readPixels` (the old copy of the main canvas could come back empty on Android), its rows are
  flipped into the same 128×128 ImageData and encoded as before. Empty reads and a lost context are rejected, the render
  target, viewport, scissor and shadow state are restored in `finally`, and the pictures use the independent cache key
  `ddw3-portraits-readback-v1`, so pictures cached blank by the old path regenerate.
- **Black frames (`requestResize`/`checkSize`):** a resize clears the canvas, and the adaptive-quality step ran at the
  end of a frame — after the picture had been drawn. Window/visualViewport/orientation/visibility/ResizeObserver and
  quality changes now queue a single resize and apply it at the start of the next frame (boot sizing stays immediate; a
  queued request waits while the 3D playroom is open). Shadows, antialiasing, shaders, post-processing and the quality
  profiles are unchanged.
- **Tests:** `tests/android-rendering.cjs` added (portrait identity, empty-read recovery, rotation, adaptive resize,
  coalescing, playroom deferral, save preservation); `tests/smoke3d.cjs` now waits for the slide exit's intentional hop
  to reach the floor before its **unchanged** landing assertion.
- **Measured by the contributor (desktop, software rendering):** mixed timings, including slower samples and long
  tasks; warm-cache creature/castle draw calls and triangles match exactly; no new shader programs and no in-view
  resizes; full smoke 195/195 on their branch. **The parent tried the fork on the Pixel and reported it looks good.**
  Quantitative Pixel/iPhone performance was not measured, and this merged build was not re-run here.
- **How it was merged:** PR #56 was based on build 50, so it conflicted with main. `src/main.js` merged cleanly with the
  build 55/56 shared-world changes; the only conflicts were this documentation, the generated `index.html` (taken as
  build 56 and rebuilt from the merged sources by the build workflow) and one smoke-test wait line (the PR's). The
  combined build is **build 57**, so phones already on 56 update themselves.

## Checkpoint: build 55 — Play Together (online multiplayer, private family rooms)
- **The family asked** for 2–4 players on different devices and networks to see each other in the world.
- **How it works (`src/multiplayer.js`):**
  - The 👫 button opens big picture buttons: 🏠✨ Create and 🔑👫 Join.
  - **Create** makes a room whose code is four animal pictures (12 animals, 20,736 codes). The voice reads them out.
  - **Join** shows a 12-picture keypad; pressing the same four pictures joins.
  - ↩️ joins the last room again. 🚪 leaves.
  - No public lobby, no chat, no names.
- **The other players:**
  - Each other player's own creature walks, jumps and rides where they really are, drawn about 150 ms in the past between two received positions (interpolation), so movement is smooth.
  - Each player has one of four colours: a ring under them and a gem over their head.
  - Others are drawn and animated only in the same place as you (outside, house, same planet) and within 80 m.
- **What is shared:** movement only (position, facing, on the ground or riding, which creature, colour), 8 times a second while moving and every 2 s when still. Saves, pets, creations and rewards stay on each device; nothing is written to the saved game.
- **Connection problems:**
  - Phones lose and regain connections: the game says so, and puts you back in the room when it reconnects.
  - A player who vanishes is removed (Firebase on disconnect; otherwise after 20 s of silence).
  - After a reload, for example the automatic update from build 51b, the game rejoins the same room by itself.
  - A full room (4) politely says no.
- **Backend:**
  - **Firebase Realtime Database** with anonymous sign-in. The family chose it: free Spark plan, no card, works on cellular.
  - Firebase's code is a separate file, `mp-firebase.js` (314 KB), downloaded only on Create or Join. The game file stays the same size (8,971 KB), and solo and offline play are unchanged.
  - Until `src/mp-config.js` is filled in, the 👫 button is hidden.
  - Setup, security rules (rooms of at most 4, small number fields only), costs and two-device testing are in `MULTIPLAYER.md`.
- **The ⚙️ panel now shows the build number.**
- **Verified (desktop, software rendering), with two independent browsers (separate storage) through a local stand-in relay (`tests/mp-relay.cjs`, `tests/multiplayer.cjs`):**
  - create and join by the pictures;
  - each sees the other, smooth walking with no backward steps, jumping, different colours;
  - a dropped connection comes back in the room;
  - four players together (with light stand-in clients); a fifth is told the room is full;
  - closing the game removes the player for the others;
  - 🚪 leave, ↩️ rejoin, and rejoin by itself after a reload;
  - nothing in the save; no page errors.
- **Not yet verified:** the real Firebase service (this test machine cannot reach it, and the project does not exist yet) and real devices. The two-device steps are in `MULTIPLAYER.md`.

## Checkpoint: build 54 — Earth graphics, second batch: crates, hay bales, boulders, a rippling stream (2026-11-15)
- **The climbing stacks were plain blocks.** Now (`src/earthkit.js`, each stack ONE painted mesh):
  - Ocean Pier: planked wooden crates with frames, a diagonal brace and corner bolts (`crates`);
  - Happy Farm: straw-streaked hay bales tied with two cords, loose straw sticking out (`hayBales`);
  - Balloon Hills and the Adventure Trail lookout: lumpy boulders with cracks and a flat mossy top (`boulders`).
  - Every stack uses exactly the old boxes' sizes and places, so the steps you stand on (`c.plat`) have not moved.
- **The Adventure Trail stream** ripples and shades from pale to deep (`makeSea`), instead of a flat blue slab.
- **Verified (desktop, software rendering):** before/after tour screenshots, no page errors; full smoke test result recorded below when it finishes.
- **Not yet tried on the real iPhone.**

## Checkpoint: build 53 — Earth graphics, first batch: real Toy Town houses and a sea that moves (2026-11-15)
- **Why:** a tour of every district (28 stops, screenshots) showed the middle of the world is polished, while the outer districts still had placeholder shapes: Toy Town's houses were plain coloured blocks with a pyramid on top, and every sea was a flat blue sheet.
- **Toy Town houses** (`src/earthkit.js`, `toyHouses`): walls that darken towards the ground, a ridged roof with overhanging eaves painted in rows of tiles, a chimney, a framed door with a round window, a knob, a step and a striped awning, windows with cross bars, shutters and flower boxes, a flag on some. All nine houses are ONE mesh (painted colours), replacing 18 meshes. A little smoke rises from the chimneys while you are near.
- **The sea** (`makeSea`; the beach at x −86 and the Ocean Pier): pale shallows with foam at the shore, turquoise, then deep blue far out, with rolling waves that catch the sunlight. About a thousand points are moved each frame, only while the camera is near.
- **No new shaders when walking in:** both use the painted materials already compiled during loading (`warmPaint`). The shader count is the same at every stop of the tour (149; it was 148: one more is compiled during LOADING because the beach sea is part of the world from the start).
- **Verified (desktop, software rendering):** tour screenshots of Toy Town, the beach and the pier before and after; no page errors. Full smoke test, run alone on the final build: **195/195 passed**, no console errors or warnings.
- **Not done yet (next batches):** see `NEXT_TASKS.md`, "Earth graphics".
- **Not yet tried on the real iPhone.**

## Checkpoint: build 51b — updates arrive by themselves on the Home Screen app (2026-11-15)
- **The family's report:** the iPhone still showed build 48 while builds 49–51 were published. Cause: an iPhone Home Screen app is not reloaded when opened again; iOS brings the same running page back from the background, so the page check in `sw.js` never ran. (Separately, the Pages deployment of PR #55 failed and #57 fixed it: build 51 went live at 03:30 UTC on 2026-11-15.)
- **Fix:** `build.mjs` writes `version.json` (`{"build":"51b"}`). At start-up and each time the game returns to the front (`visibilitychange`, `pageshow`), `checkForUpdate` in `main.js` fetches it uncached; if the published build differs, it saves and reloads. It reloads at most once per published build (remembered in `sessionStorage`), and never without storage, offline, from a file, or inside a frame. The service-worker cache name is now `dawsons-world-v51b`.
- **Each build must keep `GAME_BUILD` unique** (the check compares it with `version.json`, which the build writes from it).
- **Verified (desktop, local web server, Playwright):** same build: no reload; newer build published: one reload; asked again: no second reload; no page errors. Node checks pass. The full smoke test was NOT run for this change (no gameplay code changed). **Not yet confirmed on the iPhone:** the phone must load this build once the old way (close the app fully and reopen) before the check exists there.

## Checkpoint: build 51 — smoother planet preparation and reliable flight cancellation (2026-11-15)
- Kept the planet graphics and build 50's larger Moon/Mars. Terrain and sky textures now build in scheduled slices instead of blocking a countdown or arrival in one large task. Golden geometry/pixel checks preserve their appearance.
- Startup rehearses planet sky, dust, sky bodies, rings, transparent ice and lightning materials in the rendering pipeline. Small resident representatives retain the shader programs when planets are freed. Loading no longer finishes before rehearsal completes, including the delayed startup compile pass and first-use metadata.
- Private Saturn/Uranus ring textures are disposed on unloading; shared painted skies and warm shader materials remain available for reuse.
- Flights await destination readiness. Home/map travel aborts pending construction and delayed flight callbacks, reveals Dawson and releases the launch lock. Failed preparation is cleaned up and can be retried.
- Fixed the smoke synchronization: the slide check waits for the intentional exit bounce to land; pet taps wait for three distinct settled animation frames and aim at the rendered pet. Assertions are retained, and a missing waiting pet is reported without aborting the rest of the suite.
- Verified on desktop: 40 Node checks; 41 learning contracts; saved-world regressions; shader regression across all nine planets and expanded activities (zero new variants, zero shader waits, no page errors); real controls for Home/map cancellation, direct-flight cancellation and retry after preparation failure. Each flight recovery check subsequently reached the real Moon.
- Performance: see `PERFORMANCE_LOG.md` for before/after timings and repeat profiling. These are SwiftShader desktop results, not physical iPhone measurements.
- Save lifecycle regression: valid reload retains pets, crown, wand and a progress marker; same-context and isolated corrupted saves start fresh; saving recovers without page errors. The full smoke corruption case now isolates its storage context, verifies the injected seed and waits for the ready screen instead of a fixed delay.
- Removed a redundant non-indexed conversion from Uranus crystals, preserving geometry and eliminating console warnings; a regression captures warnings during their construction.
- Full smoke suite run alone on the final rebuilt artifact: **195/195 passed**, including expanded Moon/Mars, actual rocket controls, save corruption recovery and zero console errors/warnings. Updated `tests/TEST_RESULTS.json` and all smoke screenshots. PR #55 remains open for the user to merge; physical iPhone confirmation is pending.

## Checkpoint: PR #55 conflict resolution — graphics work remains unfinished
- Merged main `02de466` into the planet graphics branch, preserving both the sculpted scenery and build 50's 330 m Moon/Mars, streamed areas, countdown preparation, distant-alien sleeping and departure cleanup.
- Adapted expanded aliens and rocket signs to the sculpted models. Expanded terrain covers the longer worlds; Mars sunset changes the shader sky through an explicit color callback. Shared painted materials survive unloading, and per-planet sky references are released.
- Regenerated the offline `index.html`; retained build number 50 from main. This checkpoint does not publish the graphics overhaul or merge PR #55 into main.
- Verified: build; all six `tests/*.test.mjs` files; learning contracts (41 activities); saved-builder/creature world regressions; independent review; focused desktop software-rendered browser check of all nine planets, expanded activities, rocket signs and cleanup on Earth (no page errors).
- Performance: before/after measurements are recorded in `PERFORMANCE_LOG.md`. Shader pauses and worse measured timings remain; this is not a performance-approved release or a physical iPhone result.
- Full smoke suite attempted alone: 42 checks passed, two failed (slide landing and pet tap), then the test aborted at `tests/smoke3d.cjs:142` because no waiting pet was found before accessing its `root`. These checks and the pet implementation are unchanged from main; no claim is made that they pass on either baseline. This checkpoint has no full smoke-test clearance. The focused planet integration check passed separately.

## Checkpoint: build 50 — bigger planets (the Moon and Mars first), only the current planet in memory
- **The family asked** for much bigger planets with many more activities, and above all no extra lag. This build changes the system first, then expands two places.
- **The planet system (`space.js`, new `planets.js`):**
  - Places are now up to 330 m long instead of 110 (places are 400 m apart).
  - Each new area is built only when she walks within 70 m of it, in small steps over several frames (terrain, then the activities, then shader compile, then shown).
  - When she flies away, the whole planet is freed: meshes, materials, tap targets, PAW targets and floors. Only the planet she is on is ever in memory.
  - The destination planet is built during the 3-2-1 countdown, not on arrival.
  - Aliens far from her (over 45 m) rest and cost nothing.
  - New scenery uses two shared unit shapes (a ball and a box), scaled.
  - A little rocket sign at the start of each new area takes her back to her rocket.
- **🌕 The Moon:**
  - **Crater Valley:** a giant crater with a bouncy middle (low-gravity bounce), and a pretend explorer station with a dish that "calls Earth" (a radio message takes about 1 s).
  - **Moon phases toy:** each tap moves the shadow: new, crescent, half, full.
  - **Collecting:** moon rocks for a sample box, counted.
  - **Moon Mountains:** big steps up to a star.
  - **Hidden cave:** glowing crystals light up when she walks by and sing when tapped (said to be pretend).
  - **Shape sorting:** round, square and triangle rocks into matching holes.
  - **The moon buggy** (real astronauts drove one).
  - **Footprints** stay in the moon dust wherever she walks (one instanced mesh of 40 prints; no wind on the Moon).
  - More Moonbeam aliens.
- **🔴 Mars:**
  - **Canyon Country:** two mesas to climb, with a view and the Valles Marineris fact.
  - **Five rocks that say what they are:** rust, layers, volcano, ice, river-rounded.
  - **An ice cave** (real Mars has underground ice).
  - **A blue sunset:** tap the sun and the sky turns blue (true on Mars).
  - **The Explorer Station** (said to be pretend): a door that opens, and a greenhouse where tapping the pots grows plants up to a tomato.
  - **The Ingenuity helicopter** flies.
  - **Count Mars's two moons.**
  - **A flag trail:** red, yellow, green, blue, in order, with unlimited retries.
  - More Marslings.
- **Verified (desktop, software rendering):**
  - No page errors.
  - Shader programs unchanged (138 in `?test`).
  - Every new activity reports its discovery.
  - She can walk up the Moon mountain (to 7 m) and the Mars mesa (6 m) by holding ▶.
  - After flying to Mars, the Moon is gone from memory.
  - New smoke checks: length, activities, one planet in memory, rocket signs.
- **Not yet tried on the real iPhone.**

## Checkpoint: build 49 — 🎈 Balloon Hills, a new region past the pier
- **A new streamed district** (`builders.hills`, x −800 to −668). Map tile 🎈, train station 🎈 at x −788, gems g19 (hilltop) and g20.
- **Activities (pictures, sounds and voice only):**
  - **Hot-air balloon:** tap or PAW, and it puffs up and floats gently back down. The camera steps back and looks up to watch (`G.camPull`, `G.camLift`).
  - **Kites:** tap one and it loops the loop.
  - **Grassy hill:** climb the steps and PAW on the rainbow mat at the top to slide down. Gem on the top.
  - **Mountain goat:** each tap is one hop up the rocks, counted aloud ("Hop! One!", "Two!", "Three!").
  - **Echo rock:** hello comes back softer and softer (loud and soft).
  - **Wind chimes:** long tubes sing low, short tubes sing high. PAW rings them all, low to high.
  - **Dandelions:** tap and the seeds blow away on the wind; they grow back.
  - A 🏠 sign takes you home.
- **The world end moved:**
  - The left rainbow stairs and Sky Kingdom gate moved from x −666 to −798 (`EXP.xMin` −698 → −830).
  - Train line `TRAIN.x0` −666 → −798.
  - Ground, path and the pink kerb extend to −836.
  - Saves restore up to −794.
- **Fixed on the way:** PAW at the top of the Frosty Peaks sledding hill never started the sled. PAW only reaches things within 3 m of her height, and the sled counted as ground level while she stood 4.8 m up. The sled and the new hill mat now carry their real height.
- **Investigated (performance): the "walk into the Adventure Trail" long task.** A CPU profile of that walk (`tests/perf` style, 200 µs sampling) found no JavaScript run longer than about 18 ms, while the browser reported a 70 ms task at x 454. So the time is not spent in the game's code; most likely it is the software renderer (SwiftShader) waiting on itself. Recorded in NEXT_TASKS; no change made.
- **Verified (desktop, software rendering):**
  - Every activity, the slide by PAW, the 🎈 station first on the line and the moved sky gate, all checked in a browser.
  - No page errors.
  - Screenshots of each spot.
  - New smoke-test checks (map, the six activities, the slide, station, sky gate).
- **Short screens:** the extra map picture and train station did not fit on 320 px tall phones. A short-screen layout fixes it (6 map columns, 44 px station buttons, the smallest comfortable touch size).
- **Test fixes (not game bugs):** Biscuit can stand behind the slide's tube for several seconds (more tries); the unicorn wanders (tap it where it is).
- **Full smoke test 189/189, devices 11/11** (desktop emulation).
- **Not yet tried on the real iPhone.**

## Checkpoint: build 48 — climb into the rocket, the big red button, a real lift-off
- **The bug the family found:** PAW at the rocket blew bubbles. The Lab Gardens rocket (build 45) was placed at x 698, exactly on the bubble fountain. Both had PAW targets at 698, and the fountain's came first in the list. The rocket and its pad now stand at x 686, between the frog pal (678) and the fountain. `ROCKET_PAD` follows it, so flying home lands at 688.5.
- **The rocket ride** is a new ride type in `main.js`, `P.ride = { type: 'rocket', phase }`:
  - **board:** she walks to the door, hops in and disappears. Her portrait shows in the round window as a sprite; the sprite shader is already warmed, so it needs no new shader. Crown, wand and pets stay behind (`G.playerHidden`).
  - **in:** the planet pictures appear. Picking one shows `#blastBtn`, a big pulsing red button with the chosen planet as a badge, and the voice says "Press the big red button!". PAW also presses it. JUMP or ✖ climbs out.
  - **count:** a three-second 3-2-1 with rumble (shake), smoke from the pad and the flame flickering on.
  - **lift:** the rocket accelerates up on a two-cone flame with sparks and smoke. The camera rides up with it, pulled back a little (`G.camLift`, `camT.rk`).
  - **land:** at the destination the rocket starts 26 m up and slows to a gentle touchdown with its flame and a puff of smoke. Then she climbs out beside it.
  - The timing uses the wall clock, so a slow screen doesn't stretch the ride.
- **Every rocket registers itself:** Earth's in `expansion.js`, each planet's in `space.js` (`registerRocket`; it is marked dynamic so scenery slicing never hides it). Because of this the same ride works from every planet. If no rocket is near (the old test path), the picker still flies you straight there.
- **Verified (desktop, software rendering):**
  - A scripted run of PAW → in → Mars → red button → countdown → lift → landing → out → fly home → ✖ climbs out: no page errors, shader programs unchanged (103 at real settings, 138 in `?test`), and no slow shader waits measured around the flight.
  - Screenshots at frozen moments of the countdown, lift-off, high flight and Moon landing.
  - The button sits beside the rocket and overlaps no control at 844×390 or 1024×768.
- **Smoke test:** new checks cover PAW entering the rocket (not bubbles), the red button appearing without flying, and the countdown then lift-off; plus landing and climbing out on the Moon. The planet tests now wait for the ride to finish (`flyTo`).
- **Also from the family's screenshots:**
  - **Uranus Rollers sank half into the ground.** The cube spun around its bottom edge. It now turns about its own middle and rises onto its corner as it tips (height = 0.4·(|cos θ|+|sin θ|) + 0.05), so it rolls like a real box. The antenna was removed: it would poke into the ground upside down. Measured: the lowest point over 10 s of rolling stays 0.05 m above the ground.
  - **Crooked farm roofs:** the barn, the chicken coop and the pink stand at x −35 had the same bug as the house roof (turned, then squashed along the wrong axis). They are now turned in the geometry first. Their base corners were checked numerically: true rectangles (barn 7.1 × 4.4 m over a 7 × 4 m barn).
  - **The crown and wand floated high above her on the whale:** she is drawn smaller on rides. They now follow her drawn body, its position and size (`G.playerBody`).
- **Test fixes (the game was not at fault):**
  - The marble-ramp tap check now waits until the camera has stopped moving.
  - The rocket check reads the phases the game itself ran (`G.rkLog`), because the slow test browser can skip the short test-mode countdown between frames.
- **Not yet tried on the real iPhone.**

## Checkpoint: build 47 — every planet its own place, with aliens; builds 46 fixes
- **The family asked** to land on the gas giants too, with fitting activities and different aliens.
  - The gas giants now have walkable swirly cloud ground in their own colours. The voice says, kindly, that each is really made of gas; gravity is still the real 1-bar value.
  - Every place has its own sky colour.
- **Aliens**, one kind per planet: Moonbeams (one-eyed hoppers), Sizzlers (spiky, sunglasses), Floaties (jellyfish), Marslings (three-eyed), Bloonies (balloons), Ringlets (spinning, ringed), Rollers (cubes rolling sideways), Windies (wisps), Heartlings (hearts). Tap one and it greets you with its own sound.
- **Activities that fit each planet:**
  - Moon: flag, five moon rocks to count, Earth.
  - Mercury: the sizzling Sun, a day/night button.
  - Venus: erupting volcanoes, a thermometer.
  - Mars: the driving rover, a dust devil, Olympus Mons.
  - Jupiter: the Great Red Spot, lightning, counting its four big moons.
  - Saturn: ring-ice stepping stones, the hexagon storm, the rings.
  - Uranus: a ball rolling on its side, diamond rain.
  - Neptune: a windsock and gusts that push you, Triton's geyser.
  - Pluto: the slippery icy heart, Charon.
- **Build 46:**
  - **The flying whale vanished:** it had been filed into a scenery section, which is hidden far from the camera. It is now marked as moving. Reproduced on build 45 after flying 160 m; fixed.
  - **The house roof was crooked from above:** the scale was applied before the 45° turn. The turn is now baked into the shape.
- **Verified (desktop):**
  - Full smoke test 180/180 (new: every planet has its alien and 2+ activities; the whale stays in the scene while flying).
  - Device test 11/11; unit tests 25/25; programs 103.
  - Jupiter's hop is measured by the game every physics step (a slow test frame could miss it).

## Checkpoint: build 45 — a warmer voice, and a rocket to the planets with real gravity
- **Voice:**
  - Picks the most natural installed voice: Premium, then Enhanced (on iPhone the quality is in the voice id), then kid-friendly names (Zoe, Ava, Nicky, Samantha…), never "compact".
  - Natural pitch (1.04, a little brighter on excited sentences, 1.1) instead of 1.15, which made synthetic voices sound more robotic; an unhurried pace (0.9–0.96); "..." becomes a pause.
  - ⚙️ lists the installed voices: tap one to hear "Hi Dawson! Let's go and play!" (remembered).
  - The panel tells grown-ups how to download the free Ava/Zoe (Premium) voices on the iPhone.
  - Real device check needed: voices differ per phone.
- **The space rocket** (`src/space.js`):
  - **Launch pad:** in the Lab Gardens (x 698). Tap the rocket or PAW for a picture menu: Earth (home), the Moon, Mercury, Venus, Mars, Jupiter, Saturn (with rings), Uranus, Neptune and Pluto.
  - **Each place:** its own scene at x 5000 + 200·i, built on first visit and hidden otherwise:
    - Moon: craters, Earth in the sky and a flag.
    - Mercury: the Sun huge in the sky.
    - Venus: a hazy yellow sky.
    - Mars: red dust and a rover to tap.
    - Gas giants: a floating platform in the clouds, with cloud bands below, the Great Red Spot, and Saturn's rings.
    - Pluto: the white heart and Charon.
  - **Every place:** a striped metre pole, and the voice reports each new jump height.
  - **Real gravity:** game gravity × (g / 9.81), with g = Moon 1.62, Mercury 3.70, Venus 8.87, Mars 3.71, Jupiter 24.79, Saturn 10.44, Uranus 8.69, Neptune 11.15, Pluto 0.62 m/s². For the gas giants g is at the 1-bar cloud tops; they have no surface, and the voice says you're on a floating platform.
  - **Measured jump heights** (same jump): Earth 1.7 m, Moon 11.1, Mars and Mercury 4.8, Pluto 29, Jupiter 0.5, Saturn 1.5, Venus 1.8, Uranus 2.0, Neptune 1.4 m.
  - **Earth** in the menu flies you home to the launch pad.
  - No console errors; programs 103.
- **Build 44** (speed fixes from the real iPhone report) passed 172/172 and 11/11, and ships together with this build.

## Checkpoint: build 44 — fixes from the real iPhone report (build 43)
- **The report:**
  - The flat 30 fps cap is gone (likely Low Power Mode before): castle, house and studio 56–60 fps, but park 44 and creature area 40 fps at the lightest level.
  - Frame work was only 4 ms, so the graphics chip is the limit.
  - One 274 ms freeze "(Art Plaza)"; area changes 59–108 ms; the pool works on the phone.
- **The lightest graphics levels (4–5) now draw less:**
  - trees go to their simple shape beyond 8 m (was 16);
  - no fur layers at all;
  - grass drawn at 70% / 50% of the phone amount.
  - Desktop triangles at level 5 (build 43 → 44): park 560k → 436k (−22%), creatures 669k → 469k (−30%), castle 476k → 404k.
  - Screenshots look nearly the same.
- **The Art Plaza freeze (caused in build 43):**
  - Removing the neighbourhood signposts meant nothing drew a picture sprite early, so the first one met in play (the 🏠 at the Art Plaza end) waited for its shader (`getProgramParameter`, 550 ms on desktop).
  - The start-up rehearsal now draws one sprite (and the sky stairs).
  - Verified: walking 760 → the stairs has 0 long tasks.
  - The new `tests/perf/shaderwaits.cjs` checks the whole train line, the sky, the pool and the underwater world: no shader waits anywhere.
- **The report shows the real build number** (build 43 still said 42).

## Checkpoint: build 43 — the family's list
1. **Camera zoomed out:** CAM_DIST 7.6 → 9.0, plus an automatic pull-back at the Block Builder (like the castle's), so the whole 12 × 5 m wall is on screen. Before, the top rows were cut off.
2. **No more activity signs:**
   - The 7 Learning Corner signposts are now **play spots**: a glowing, sparkling ring on the ground with the corner's 3D toy floating and turning above it. Tapping still opens the games.
   - The floating yellow cone (it covered things) is replaced by a glowing **"stand here" circle** on the path.
   - **Every activity nearby twinkles** now and then (shared particles).
   - The neighbourhood signposts are removed (the map and train show every place).
   - Train-station signs are smaller and lower.
3. **A real seesaw** (Toy Town, x 638): the near end dips down so you can step on; it rocks you between about 0.2 and 1.9 m with a teddy on the other end; JUMP at the top is a super bounce (reached 5.9 m).
4. **The world ends climb into the sky:**
   - **Rainbow stairs:** both ends (x 908 → 932 and −666 → −690) have 24 rainbow cloud steps (0.4 m, walkable) up to a landing at 9.6 m. A rainbow gate there takes you to the Sky Kingdom. The world is a little wider (EXP −698 … 940); saved positions are never restored inside the stairs.
   - **A bigger Sky Kingdom:** the cloud path runs on from x 8 to 45.6. New activities: the moon (tap it and 10 stars light up, counted), cloud sheep (rain, then a rainbow), colour balloons (pop one and it says its colour), and bouncy clouds up to a high cloud with a star. No new star bits, because saved star bits are stored by list position.
5. **Steer the sky whale:**
   - ◀ ▶ / sideways drag fly it anywhere over the world (11 m/s); ▲ ▼ fly higher and lower (6–32 m). Areas stream in as you fly.
   - ▲ no longer throws you off; JUMP hops off and you float down gently (fall speed capped).
   - The camera pulls back and looks down while flying.
   - After a long flight the whale swims home out of sight.
6. **The deep pool and the underwater world** (`src/sea.js`):
   - A Splash Pool next to the beach (x −12 to −4). Tap it to dive into a deep tiled pool (its own place at x 3000+, built on first dive, hidden otherwise).
   - Swim down; a tunnel at the bottom leads into a 120 m underwater world: colour coral, 4 fish schools, a sea turtle, an octopus that squirts ink, glowing jellyfish, a shipwreck with a treasure chest (count 5 pearls), a clam, dolphins, a big whale far away, starfish, crabs, a shrimp, seaweed and bubbles.
   - Swim up to the top of the pool to climb out.
- **Merged-code lessons:**
  - `c.sprite` is now `c.toy` (3D toy models).
  - Every emoji in `expansion.js`, `learn.js` and now `sea.js` needs a toy model; the test caught 💕, 🗺️, 🪸 and 🏊, even inside comments and messages.
  - `G.sea` is the beach's sea plane, so the underwater world is `G.deepSea`.
- **Verified (desktop):**
  - Every feature by script: builder wall fits; seesaw heights 0.17 → 1.88 and a 5.9 m bounce; both stairs climbed and the gate → sky; whale flew 43 m right and up to 25 m, ▲ kept the ride, JUMP → float; pool → tunnel → all 10 sea activities → climb out, with shader programs 104 → 104.
  - `ba.cjs` 42 → 43, two runs each: park 10.9 → 11.1, creatures 8.7 → 9.6, castle 8.7 → 9.7 ms average. Each view was faster in one run and slower in the other: within noise. 0 long tasks; programs 102 → 102.
  - Unit tests 25/25 (the toy-model test now also scans `sea.js`).

## Checkpoint: build 42 — freezes say where; Clover the goat; friends play together (built on top of builds 40 and 41 from main)
- **The performance report says where each freeze over 250 ms happened:** the place name (Park, Toy Town, Ocean Pier…), the house, castle or underground, any ride, or a learning game. The build 36 iPhone report had two real 309–339 ms freezes with no location.
  - Verified (desktop): two deliberate 400 ms freezes are reported as "(Ocean Pier)" and "(in the house)". Other examples seen: "Park", "Playhouse, riding the slide".
- **Clover the mountain goat 🐐** lives on the Adventure Trail (x 494), the only neighbourhood that had no pal. Three taps to befriend; follows you; appears in 🐾 (9 pals); the save accepts `goat`.
  - Verified (desktop): befriends and follows to the park; no console errors. Shader programs on that route are 103 with and without Clover (build 39 gives the same 103), so no new shaders.
- The report's build number is 42.
- **Friends who follow you play together:** when two or more pals follow you and you stand still, now and then two neighbours face each other and hop, with hearts and a giggle (no new objects or shaders).

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
