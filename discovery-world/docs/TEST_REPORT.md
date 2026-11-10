# Test report — Milestone 3, build 9

**Tool:** Playwright with headless Chromium on Linux, running the built `index.html` from disk.
**Viewport:** 844×390 CSS px (the size of a landscape iPhone 14/15), `hasTouch`, `isMobile`, device pixel ratio 2.
**Input:** real Chrome DevTools touch events (`Input.dispatchTouchEvent`) for holds, multi-touch and drags, plus Playwright `touchscreen.tap` for taps. These are the same pointer and touch events the game receives on a phone.
**Script:** `tests/smoke.cjs`. Raw results: `tests/TEST_RESULTS.json`. Screenshots: `screenshots/`.

## Result: 111 / 111 checks passed, no console errors

The build 9 door fix added four checks: PAW at a door goes in, PAW inside comes back out, the bridge door leads down to the caves, and the cave door leads back up.

Build 9 added four checks:
- the style button opens the panel
- colour, pattern and extras change
- ✓ closes the panel
- reload keeps the style

Frame timing after adaptive resolution: median 16.7 ms at 0.70 density (headless software rendering, not an iPhone).

Build 8 added 13 checks:
- hatch drop into the tunnels
- Pet Maker buttons, then the lever hatches a pet
- crawling with the pet following
- find a Star Baby
- Block Builder places blocks, which become platforms
- ladder back up
- Star Baby delivered to the Star Nest
- going inside the Peekaboo House, playing the piano, coming back out
- reload keeps the pet and the building

Frame timing: the adaptive resolution settled at 0.70 pixel density in headless software rendering (median 16.7 ms). That is not an iPhone measurement.

Build 7 added 15 checks:
- music drums, and star bits collected while playing
- climb all 5 Sky Tower levels with repeated JUMP
- find a Fluffkin, giant slide entry and landing
- swing ride, then fling off with JUMP
- seesaw shoots its ball through the hoop
- peekaboo window
- bring a Fluffkin home
- train ride across to the far station
- confetti cannon launch
- dance floor

Bugs the new tests caught (all fixed):
- jumping off a swing instantly re-boarded it
- the creature kicked the seesaw ball backwards as it launched
- air drag made the seesaw shot fall short
- from the lift, the dispenser button was off-screen

Build 6 added five checks:
- dispenser balls roll down the ramps into the paddle wheel
- 5 balls raise the lift fully
- the lift carries the creature up
- walk onto the balcony and get star 8
- tap the xylophone

The new tests caught two real machine bugs, both fixed: the ball spawned beside the first ramp and bounced off backwards, and the gap at the end of ramp 2 was narrower than a ball, so balls got stuck.

Build 5 added ten checks:
- climb the net, which ends on the high beam
- walk the sky bridge and get secret star 7
- walk off the lookout onto the zipline, which drops you by the mixer
- tap the ladder, which ends on the engine walkway
- stamp a heart and a star sticker
- undo removes the last sticker
- stickers survive a reload

Build 4 added three checks: the paint palette appears at the park easel, finger-painting on that easel works, and the easel painting survives a reload on the right surface.

Build 3 added three checks: tap the carousel to ride, JUMP off the carousel, and the PAW button boards the nearest ride. The move/jump/paw buttons now measure ≥ 60 px.

| # | What was tested | Result |
|---|---|---|
| 1 | Title screen shows; LET'S PLAY hides it | PASS |
| 2 | HUD buttons fully on screen and not overlapping at 844×390; move/jump/paw buttons ≥ 60 px | PASS (w×h: [[76,62],[76,62],[82,82],[62,62]]) |
| 3 | Hold ▶ moves continuously; releasing stops; hold ◀ moves | PASS |
| 4 | Jump, double jump in mid-air, landing | PASS |
| 5 | **Multi-touch:** hold ▶ with one finger while tapping the world with another | PASS |
| 6 | Select Zuzu, Jelly, Pip (screenshot of each running) | PASS |
| 7 | Tap the creature → reaction | PASS |
| 8 | Drag and throw a ball | PASS |
| 9 | Palette appears near the wall; 3 strokes in 3 colours | PASS |
| 10 | Walk onto the trampoline → bounce | PASS |
| 11 | Tap slide → ride the slide path → can move again afterwards | PASS |
| 12 | **Full chain:** pour blue + yellow → SPIN → green (#3cc46e) → pipe → tank (2 units) → green bubbles → funnel → battery 6/6 → lever → POWER | PASS |
| 13 | Magnet pulls the metal balls | PASS |
| 14 | Powered Star Launcher launches you across the park | PASS (lands ≈ x 4250) |
| 15 | Ferris wheel ride + jump off; coaster full ride + drop-off; whoosh tube back to the ball pit; giant-bubble ride + jump to pop | PASS |
| 16 | Sound off / on | PASS |
| 17 | Window blur while holding ▶ releases movement | PASS |
| 18 | Reload keeps creature, paintings, discoveries, power/battery/mix state and position | PASS |
| 19 | Corrupt save is ignored safely; old Prototype 01 save migrates | PASS |
| 20 | Frame timing after adaptive resolution (headless software rendering) | median 16.7 ms at 0.85 pixel density. Before the optimisations it was 33 ms: the build-3 art pushed headless Chromium just past 60 fps. |
| 21 | Portrait 390×844 shows the "turn sideways" tip | PASS |

## Bugs the tests caught (and that are now fixed)
- A loose ball resting in front of the SPIN wheel stole the tap. Machine buttons now have priority.
- The creature's tickle hit box was too tall. Standing on the Ferris-wheel deck made it cover the wheel, so taps never started the ride. The box is smaller now and checked after machine buttons.
- After a launch, mid-air braking stopped the creature after ≈280 units. Momentum is now kept unless the child steers.

## Build 3 bugs caught by the tests (fixed)
- The bigger creature's tickle area covered the wheel hub and carousel, so taps went to the creature. It is now a circle on the body.
- The build-3 visuals dropped headless frame rate to 30 fps. Fixed with a half-resolution backdrop, pre-rendered bulb sprites and adaptive resolution.

## NOT tested
- **No physical iPhone or real Safari/WebKit.** Chromium emulation is not iPhone Safari. iOS audio unlock, the notch/safe-area insets, Safari's toolbar resizing, and real 60 fps on older iPhones are all unverified.
- Playwright's WebKit build is not installed in this sandbox, so no WebKit run either.
- The headless frame timing above is a desktop CPU figure. It is not an iPhone performance measurement.
- No accessibility audit, and no hearing check of the sounds (the sandbox has no audio output). Sound was checked for code paths and errors only.
- Long play sessions (memory over hours) were not tested.
