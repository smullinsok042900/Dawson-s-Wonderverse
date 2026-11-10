# Audit of Prototype 01 (before any changes)

Source: `backups/Prototype01_ORIGINAL_untouched.html` (45,403 bytes, SHA-256 `3221cceeb7ca93768dc0b6181cae32caec48155703727f49cabb6b820221c41f`, byte-identical to the uploaded file and to the copy inside `DiscoveryWorld_Claude_Files_NEW.zip`).
The hosted copy (`project32440.websitepublisher.ai`) could not be reached from the build sandbox (DNS lookup failed), so the attached file was treated as the canonical code.

## Confirmed working (by code reading and a baseline Chromium run with no console errors)
- A single 5200-unit side-scrolling world with a follow camera and culling.
- Pip, Zuzu and Jelly selectable; left/right hold buttons, jump + double jump, keyboard fallback.
- Draggable balls, a paint wall that saves strokes, a trampoline, tap-to-slide, Ferris-wheel and coaster rides.
- localStorage save of the creature, x position, strokes, discoveries and three on/off flags.

## Verified shortcomings (what this milestone addressed)
| Area | Problem found |
|---|---|
| Creatures | Each creature was separate ellipses with independent sine wobbles. Pip's feet slid side to side without stepping. Ears, wings and tail moved on fixed timers. There was no change of pose for jumping, falling or landing, and no squash on landing. Zuzu was a static star that bobbed. Jelly's "squish" was a fixed sine wave. |
| Interactions | The mixer, lab lever and magnet only flipped a flag, and the mixer colour was used nowhere else. No machine affected another one. |
| Rides | The slide teleported the player. On the wheel and coaster the creature was drawn full-size and standing, with no seat or car. |
| Depth | Flat parallax and one floor colour along the whole world. The creature was never drawn *inside* anything (ball pit, gondola). |
| UI | The creature chooser was a large box covering the right side of the play view. Controls and chooser used emoji. The text hint banner collided with the toast and assumed a child who can read. |
| Robustness | No pause handling when the app goes to the background. The save never recorded machine chain state. |
