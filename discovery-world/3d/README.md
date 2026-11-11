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

## Test report (builds 9 to 11)
The automated test is Playwright, headless Chromium, software WebGL, on an 844x390 touch screen. It is **not** a physical iPhone.
- The last full run passed **123 of 125** checks. It covers the arrow pad, train, Marble Machine, Dino Valley, Princess Castle, multiple pets and followers, plus everything from earlier builds.
- The 2 misses, both fixed:
  - **Boarding the train:** the check read your position one frame before you were moved into the seat. Boarding now puts you straight into the seat, and I re-checked it on its own.
  - **Bottom of the stairs:** the check didn't wait for the landing to finish in the slow test browser. The check now waits.
- Real bugs these test runs caught and fixed:
  - Tapping a dino egg did nothing (the hidden baby caught the tap).
  - The hatched baby couldn't be tapped (the hidden shell caught the tap).
  - The top Marble Machine ramps were under the buttons at the top of the screen.
  - The station signs could be off-screen.

## 3D build 11: more pets, and friends who follow you
- **More than one pet:** the Pet Workshop lever now makes up to **5 pets**, each one designed with the buttons. They all follow you.
- **New friends you can meet.** Tap them and they come with you everywhere (saved):
  - **Biscuit the puppy:** near the start, by the slide.
  - **Pom the fluffy lamb:** in the Adventure Park.
  - **Twinkle the glowing fairy:** by the Fluffkin House. She flies beside you.
  - **Baby dinos:** once hatched, tap one and it follows you too.
- Everyone who follows you walks in a little line behind you. Tap any of them for a trick.
- Older saves with one pet keep their pet.

## 3D build 10: Dino Valley and the Princess Castle
The world now goes past the Marble Machine into two new areas, and the train has two new stations (🦕 and 👑).
- **Dino Valley** (dinosaurs added by request; all characters are original):
  - **Dottie, the giant long-neck dinosaur:** she's grazing on flowers.
    - Walk right and you climb her tail by yourself, cross her back, and slide down her long neck.
    - Tap her and she hums.
  - **Dino egg nest:** tap an egg and it wobbles and hatches a baby dino that hops about and squeaks. They stay hatched.
  - **Tops the little horned dino** talks with picture bubbles. Tap him and he stomps (the screen gives a little shake).
- **Princess Castle** (princesses added by request):
  - A pink castle with towers, waving flags, glowing windows and a big door that swings open.
  - **Princess Rosie** gives your creature a floating golden crown. It's saved.
  - **Princess Luna** waves her wand and the royal fountain sprays sparkles.
  - **Light-up dance floor:** every tile you step on glows and plays a note, and the princesses dance while you're on it.
- **Fixes:**
  - The sky now moves with you, so it never goes black at the far end.
  - Station signs are lower, so they never hide your creature.
  - The Marble Machine is lower, so its top ramps aren't under the buttons at the top of the screen.

## 3D build 9: arrow buttons are back, the Wonder Express train, the Marble Machine
- **Arrow buttons are back** (by request): a ◀ ▶ ▲ ▼ arrow pad at the bottom left replaces drag-to-move.
  - Hold ◀ ▶ to walk at a normal speed.
  - ▲ jumps, goes in doors, climbs stairs and the rope ladder, and swims up (hold it).
  - ▼ dives in the ball pit, goes down, parks the kart and gets off the train.
  - Touching the screen anywhere else is just a tap.
- **The Wonder Express:** a little steam train with a smiley face runs along the front of the whole world.
  - There are seven stations, each with a picture sign: 🏠 🎨 🧪 🎠 🧱 🏎️ 🔮
  - Tap a station sign (or PAW by it) and the train chugs in, puffing smoke, and you hop into the blue carriage.
  - It drives itself and stops at every station ("ding ding!").
  - While it is stopped, hold ◀ or ▶ to go that way, or PAW / ▼ to hop off. JUMP toots the whistle.
- **The Marble Machine:** a new sky-blue area past the race track, so the world is bigger.
  - Tap the board and a shiny marble drops from the top.
  - Marbles bounce off golden pegs and roll down coloured ramps.
  - Tap a ramp to flip it and send the marbles a different way.
  - Eight music bins at the bottom each ring their own note and light up. It's a music toy you design, with no winning or losing.
- **More realistic look:**
  - The floor tiles now have rounded edges and grout lines that catch the light (a normal map).
  - There are soft shadows where the walls meet the floor and the ceiling trim.
  - More hills, trees and grass in the new area.

## 3D build 8: Kart Garage, race track, more realistic look
- **Kart Garage** past the Creative Meadow:
  - Three big buttons change your kart's colour, its shape (bug, rocket or bubble) and its wheels, and the kart spins on a turntable.
  - A **Mechanic Fox** talks to you.
  - Saved.
- **Race track:** tap the checkered flag to drive round a big oval track with kerbs, cones and a start/finish arch. Slide right to go faster and left to slow down. JUMP hops, and PAW (or sliding down) parks. There's confetti every lap. The camera follows you round the track.
- **More realistic graphics:**
  - Shiny things now reflect a soft sky (blue above, pink at the horizon and a bright sun) mixed with studio light.
  - Thousands of grass tufts sway in the breeze across the park, meadow and track area.
  - More hills and trees around the track.
  - A bloom glow was tried and left out. It washed the colours out, and it is too heavy for phones.

## 3D build 7: the Creative Meadow (a bigger world), talking friends, colours
- **Easier purple shelf in the Lab:** the second spring pad bounces higher and gently pushes you onto the shelf, so the purple Fluffkin is easy to reach in one bounce. The shelf is also wider.
- **The world is bigger:** the new **Creative Meadow** comes after the Fluffkin House, through a pastel arch.
  - **Block Builder:** a building wall 10 blocks wide and 5 high. Pick a block in the tray: 6 colours, window, door, roof, star, heart, or the sponge to erase. Then tap where it goes. Build houses, stairs and towers. **You can climb on what you build.** Saved.
  - **Colouring Corner:** two big colouring pictures, a rainbow castle and a butterfly. Pick a colour and tap a part to fill it. Saved.
  - **New friends:** Builder Beaver, Rainbow Unicorn (sprinkles rainbow sparkles), Hedgehog (plays a guitar song), and a little Snail that crawls about and hides in its shell.
- **Every friend talks:** they say hello with a 👋 bubble when you come near. When tapped, they "say" something in a picture speech bubble (emoji, no reading) with a cute babbling voice.
- **Customize your creature:** the new paint-palette button opens a panel to choose your creature's colour (8 per creature) and switch on a **sparkle trail**. Saved.

## Home-screen app: "Dawson's Discovery World" (full screen, works offline)
On the iPhone, open https://smullinsok042900.github.io/Dawson-s-Wonderverse/discovery-world/3d/ in **Safari**. Tap the **Share** button (the square with an arrow), then **Add to Home Screen**, then **Add**.

The icon is called **Dawson's World** and shows Pip. It opens full screen with no Safari bars, and keeps a copy on the phone so it works without internet. New versions download automatically when online.

Technically, it is a web app manifest (`manifest.webmanifest`), app icons, and a small offline helper (`sw.js`). There is nothing to buy and no App Store needed.

## 3D build 6: the Cloud Kingdom (the world goes up)
- **A rope ladder** next to the climbing blocks climbs into the sky. Slide a finger up or down to climb, or tap JUMP to climb a step. Slide hard sideways to let go. There are star bits on the way up.
- **The Cloud Kingdom** above the Playhouse and Studio:
  - A long fluffy cloud path, with **bouncy cloud puffs** (pink and blue) that bounce you up to two high clouds.
  - A **rainbow castle** with towers, flags and glowing windows.
  - A giant friendly **sky whale** that sings and sprays sparkles when tapped.
  - Star bits everywhere.
- **The giant corkscrew rainbow slide:** walk off the end of the cloud path, or tap the slide. You spiral down inside a see-through rainbow tube and land on the xylophone.
- The sun's shadows follow you up into the sky.
- The Painter Bunny moved to the start of the paint wall, to make room for the slide.

## 3D build 5: Pet Workshop, friendly critters, balloons, sparkles
- **Pet Workshop** in the underground Cave Hall:
  - Tap the four big buttons to choose colour, ears, tail and pattern. The pet spins in the glass dome so you can see it.
  - Pull the lever: an egg drops, wobbles and hatches.
  - **Your pet follows you everywhere** and does a trick when tapped. It is saved.
- **Friendly critters** wave when you come near, and each does something when tapped:
  - **Balloon Bear** (start of the park) gives you a balloon that floats along with you on a string. Tap again for a new colour. It is saved.
  - **Painter Bunny** (next to the big wall) paints a heart, a star, a rainbow or a smiley on the wall.
  - **Drummer Frog** (end of the Studio) plays the drum.
  - **Dancing Penguin** (in the Lab) spins and sings.
  - **Sleepy Owl** (on a tree in the park) wakes up and hoots.
- **Sparkles:** magic sparkles float gently in the air.

## 3D build 4: drag your finger to move (no arrow buttons)
- **Moving:** put a finger anywhere on the left half of the screen and slide it the way to go. A joystick ring appears under the finger.
  - **Sideways:** walks. A small slide walks slowly and a bigger slide walks normally. It is never faster than walking.
  - **Up:** jumps, goes in through a door, goes up the stairs or the glass lift, and swims up. Hold it up to keep swimming.
  - **Down:** dives into the deep part of the ball pit, and goes down the stairs or the lift.
  - **Quick tap:** a touch that doesn't slide still taps whatever is there.
- **Buttons:** JUMP and PAW stay on the right. On the keyboard, the arrow keys still work.
- **Fixed:** a code typo had been skipping the sun's shadow settings, so shadows are now set up properly.

## 3D build 3: tube slide, nothing to walk through, livelier creatures, better graphics
- **A real tube slide:** a big see-through rainbow tube. The creature whooshes down inside it and pops out at the bottom.
- **Nothing blocks the way back any more:** the slide tower, its steps and the paint-jar tower stand just behind the path. You jump up onto them, and you can always walk past them. The glass lift also moved behind the path.
- **Livelier creatures:**
  - Much bigger squish and stretch. Jelly is very squishy: it flattens when it lands and bounces as it walks.
  - Tickling makes them hop, spin, flap and giggle.
  - When you stand still, they wave, twirl, jiggle, hop or look at you.
  - They cheer when you discover something.
- **Graphics:**
  - Smooth edges on phones.
  - Soft shadow edges.
  - A soft shadow under the creature that shrinks as it jumps.
  - Shading where things touch the floor.
  - Glowing halos around the party lights.
  - Floor tiles with grout and sheen.
  - No gap under the floor inside the house.

## 3D build 2: the secret underground (through the ball pit)
- **Part of the ball pit is now really deep.** You walk into it (or press PAW or tap the arrow bubble) and plunge in with a splash. You sink slowly through the balls, and **JUMP swims up**. You can climb back out at the top.
- **At the bottom is a secret underground world** under the Playhouse, shown as a cut-away below the floor. From left to right:
  - **Cave Hall:** a pile of spilled balls and a glowing bounce mushroom. Climb or jump onto it and it pops you back up into the ball shaft, then you swim to the top. Sinking in from above gives you a soft landing instead.
  - **Crystal Cave:** seven crystals that sing when you walk past or tap them.
  - **Crawl Tunnel:** a low tunnel where the creature crawls automatically.
  - **Gem Room:** rocky ledges, sparkly gems to tap, and one of the six lost Fluffkins.
  - **Glass Lift:** tap it, its bubble, or PAW to ride up to the Studio floor, and back down again.
- Star bits are hidden all through the caves.
- **Solid things:** low steps and edges you hop up onto by yourself, tall things block you, and big rides and machines stand just behind the path.

## 3D build 1b: loading fixes (after "the 3D won't load")
- **Lighter start on phones:** 1.5× resolution instead of 2×, no extra anti-aliasing, and a smaller shadow map. The game still lowers its resolution further by itself if it runs slowly.
- **One 3D drawing surface only:** the character pictures on the title screen used to be drawn with a second, temporary 3D surface. iPhones handle that badly. They are now drawn with the game's own.
- **Loading screen:** a "Loading the 3D world…" screen shows while the 3D shapes get ready.
- **Error box:** if the 3D world still can't start, a box appears saying "Oops!" with the exact error message and a **Try again** button. Please send a photo of that message so it can be fixed. The same box appears if the phone resets the 3D graphics, for example when it's low on memory.
- **Tickle fix:** tapping your creature now always tickles it, even when it stands in the ball pit behind the balls.

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
**Result:** 104/104 checks passed (3D build 8). New checks cover the kart buttons, driving, hopping, a lap, parking, the fox, and the kart design surviving a reload. Earlier: 96/96 (3D build 7). New checks cover:
- one bounce landing on the purple shelf
- the block tray, placing, stacking and erasing blocks, and standing on them
- the colour palette and filling a colouring picture
- the unicorn's speech bubble and the hedgehog
- choosing a creature colour and the sparkle trail
- reloading with your building, colouring and colours still there

One real bug was caught and fixed: the block tray sat over the bottom row of the building wall, so tapping that row picked a block instead of placing one. The tray is now a small grid on the right side. Earlier: 84/84 (3D build 6). New checks: climbing the rope ladder, bouncing on the cloud puffs, the sky whale, and the giant rainbow slide. One real bug was caught and fixed: when two surfaces overlapped, you landed on the lower one, so the cloud puffs didn't bounce. Earlier: 79/79 (3D build 5). New checks cover the Pet Workshop buttons, hatching a pet, the pet following you, the pet's trick, the Balloon Bear, the Painter Bunny, the frog, penguin and owl, and reloading with your pet and balloon still there. Earlier: 69/69 (3D build 4). Movement now uses finger slides, plus checks for a slide up to jump, a gentle slide walking slowly, and a slide down to dive. Earlier: 66/66 (3D build 3). It includes checks for walking back past the slide tower and for Jelly squishing on landing. Earlier: 65/65 (3D build 2), with no console errors or warnings. New checks cover diving, swimming, sinking to the underground, the bounce mushroom, swimming back out, the singing crystals, crawling through the tunnel, the underground Fluffkin, the glass lift both ways, and the solid objects.

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
- **Fixed:** the bounce mushroom sat right under the ball shaft, so sinking in bounced you straight back up forever. Sinking in now lands softly and slides you off the mushroom.
- **Fixed:** walking straight across the deep part let you hop out the far side before you sank. You now plunge in and move more slowly through the balls.
- **Test-only:** in the very slow software renderer, two real taps on JUMP can't land inside one jump. The double-jump check therefore sends its second tap on the next frame.

**Not tested:**
- **No physical iPhone or Safari test.** Speed, heat and battery use on a real iPhone are unknown. The game lowers its resolution automatically if it runs slowly.
