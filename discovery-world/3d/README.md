# Dawson's Discovery World 3D (3D build 1)

This is the full rebuild of Dawson's Discovery World in real 3D. It is a **separate version**: the 2D game in `../` is untouched and still works. The last 2D build before the rebuild was saved as `../releases/DawsonsDiscoveryWorld_build11_SAVED.html`.

Play: open `index.html`. It is one self-contained file and works offline. Once merged, it is also on GitHub Pages at `…/discovery-world/3d/`.

## What's in 3D build 1
It is one connected 3D world that you walk through from left to right. There are no levels and no loading screens.

- **Characters** are real 3D models made from smooth, glossy shapes:
  - **Pip:** fluffy fairy bunny with goggles, wings and a rainbow tail
  - **Zuzu:** shiny star with orbiting baby stars
  - **Jelly:** wobbly see-through jelly
- **How they move:** walking, squash and stretch, springy ears and tails, and blinking. They turn to face where they walk, and wiggle when tickled.
- **Mega Playhouse:** ball pit (the balls move when you walk through them; tap to splash), steps up to a twisty slide, trampoline, climbing blocks, and a secret star.
- **Imagination Studio:** a giant wall you finger-paint on (8 colours plus rainbow; saved), and a walk-on xylophone.
- **Wonder Lab:** a bubble machine (jump into the bubbles to pop them), colour buckets (tap two to mix the bubble colour), spring pads up to a high shelf, and glow orbs.
- **Adventure Park:** a carousel with fantasy mounts, a Ferris wheel, a bouncy mushroom up to a tree branch, hills and trees.
- **Fluffkin rescue:** six lost baby Fluffkins follow you once you find them. Take them into the Fluffkin House and they sleep in their own beds upstairs.
- **Fluffkin House (walk inside):**
  - Living room with a bouncy sofa, a fireplace and a toy drum.
  - Stairs you walk yourself: tap the bubble or press PAW to step on, then use ◀ ▶.
  - Upstairs nursery with six beds and a spinning mobile.
- **Star bits** to collect everywhere. Picture bubbles show doors and stairs, and a golden arrow points at things not yet tried.
- **Controls:** move ◀ ▶, JUMP (double jump), PAW (do the nearest thing), and tapping things directly. iPhone landscape, large buttons, no reading needed.
- No losing, timers, ads, accounts or purchases. Saves automatically on the device.

### Not rebuilt in 3D yet
These are planned for later 3D builds:
- the Peekaboo House
- the Cloud Kingdom
- the underground tunnels
- the Pet Maker and Block Builder
- the marble machine
- the train
- the critter friends
- Star Babies
- creature styles

## Free tools
- [Three.js](https://threejs.org) (MIT licence) for the 3D.
- [esbuild](https://esbuild.github.io) (MIT licence) to bundle everything into one file.

No paid services are used.

## Build and test
```
npm install          # three + esbuild (free)
npm run build        # writes index.html
npm test             # 48 automated checks in headless Chromium
```

`?test` runs a light mode (lower resolution, no shadows) that is used only by the automated tests, because the test browser has no graphics card. `?hq` turns off the automatic quality lowering, for screenshots.

## Test report (3D build 1)
**Result:** 48/48 checks passed, with no console errors or warnings.

**Setup:** Playwright headless Chromium at 844×390 with touch input. WebGL ran in software (SwiftShader), so it was very slow (about 2–3 frames per second). That speed says nothing about a real iPhone.

**What the checks cover:**
- title screen and buttons
- walking, jumping, double jump and multi-touch
- creature switching and tickling
- ball pit, slide, trampoline
- finger-painting, xylophone
- colour mixing, bubbles, spring pad
- carousel and Ferris wheel rides
- collecting star bits
- finding a Fluffkin and bringing it home
- going inside the house, walking the stairs both ways, the ceiling, leaving the house
- sound on and off
- saving after a reload, ignoring a broken save
- the portrait "turn sideways" tip

**Problems found while testing:**
- **Fixed:** you couldn't walk onto the trampoline or the spring pads.
- **Test-only:** in the very slow software renderer, two real taps on JUMP can't land inside one jump. The double-jump check therefore sends its second tap on the next frame.

**Not tested:**
- **No physical iPhone or Safari test.** Speed, heat and battery use on a real iPhone are unknown. The game lowers its resolution automatically if it runs slowly.
