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

## 3D build 35: 🚜 Happy Farm

- **A new area: the Happy Farm,** past Frosty Peaks at the far left end of the world. The train goes there (🚜 station), and it is on the 🗺️ map.
- **11 things to do,** with no reading needed:
  - a barn where animals pop out and say hello;
  - a hen whose eggs you count (and chicks hatch);
  - a rainbow sheep that says her colour;
  - a haystack to climb and bounce on;
  - carrots to plant, grow and pull up;
  - an apple tree to count apples from;
  - a spinning windmill;
  - a duck family;
  - a tractor that drives;
  - muddy piglets;
  - cows.
- **2 more gems** (16 in all).
- **A new pet: Truffle the piglet 🐷.** Tap her three times to make friends.
- **Speed:** walking into the farm loads no new shaders and causes no stalls, and the rest of the game is as fast as before. Measured on a desktop test computer, not an iPhone.

## 3D build 34: the express train

- Picture trips on the train to far-away stations now go **express**, up to 36 m/s instead of 20. End to end, the line takes about 42 s instead of about 68 s. Short hops are unchanged.
- Measured before and after on the test computer, both full trips: no long stalls (before: one of 50 ms). Every area was finished building before the train reached it.

## 3D build 33: the crown is back (plus a wand), and graphics that recover from a 30 fps cap

**From the first real iPhone report (build 26, iPhone, iOS 18.7):**

| What | Result | What it means |
|---|---|---|
| Freezes over 250 ms | none | the house freeze is gone on the phone |
| Worst frame (whole session) | 128 ms | only one frame over 100 ms |
| Moving between areas | 133–334 ms | entering and leaving the house about 134 ms each |
| Start-up | 7.0 s | playable after 7 s |
| Frame rate everywhere | a flat 30 fps (1% low 23–27) | the same in the heaviest view (926k triangles) and the lightest (239k), so the phone was capping the game at 30 fps (iPhone Low Power Mode does this). It was not running out of power. |
| Graphics level | 5 of 5, the lowest; drawing 759×351 on a screen that can show about 2,500×1,170 | the automatic graphics had dropped to the lowest level in an earlier session and remembered it. Under a 30 fps cap nothing could ever bring it back up, so the picture was blurrier than it needed to be, with no speed gained. |

**Fixes:**
- **Old settings forgotten:** the saved graphics level uses a new key, so a level stuck in an older build is forgotten. Phones start at level 1 again.
- **The game measures its own work per frame** (JavaScript and drawing commands).
- **Stepping back up under the cap:** when frames are capped at a steady 30 fps and each frame needs well under its 33 ms (under 9 ms, for 20 s), quality steps back up one level, then again 20 s later.
- **Stepping down if needed:** if a level makes frames uneven, the existing slow check steps back down and won't retry it for a minute.
- **The performance report** now also shows that frame work time, and whether sound is on. The report's voice line showed 0 sentences spoken, which most likely means sound was off.

**The princesses' crown, and a new wand.** You reported that the princesses no longer gave a crown and a wand.
- **The crown (my bug, from build 25's scenery slices).** The crown floating over your head was created near the castle, so it was put into the castle's 24 m scenery slice. Slices more than 50 m away are taken off the screen, so the crown vanished as soon as you walked away. The same thing hid two other things that follow you: **your own soft shadow** (filed at the Playhouse) and **the bouncing PAW hint**. All three are now marked as moving things, never scenery.
- **New check:** a test now looks for anything inside a scenery slice that is far from that slice, i.e. something that moved. Only things that bob in place remain (the dive ring, the secret star, the underground gems).
- **The wand.** Princess Luna only ever waved her wand and made the fountain sparkle; she never gave one. **Now she gives you a magic wand**, which is saved, floats at your side, and sprinkles sparkles as you go.
- **Checked with real taps on both princesses:** the crown and the wand show at the castle, the park, the Playhouse, the seaside and Toy Town, and after a reload.

## 3D build 32: three more pets and a secret tunnel

- **Three new pals to befriend** (three taps each), one in each neighbourhood on the right. That makes 6 pals in all, shown in 🐾 My Pets.
  - **Bolt the toy robot** (Toy Town): rolls on wheels, with a blinking antenna light.
  - **Hoppy the frog** (by the Lab Gardens pond).
  - **Kiwi the parrot** (Art Plaza): flies along beside you, flapping.
- **A secret tunnel:** a cave mouth half-hidden behind bushes in the Whispering Woods, with its other end in Toy Town. Tap it, or PAW next to it, and you whoosh right across the world. The place you arrive at is built at once.
- **Checked:**
  - all three pals befriend and follow;
  - 0 new shader programs;
  - the tunnel works both ways (Woods → Toy Town x 614, and back to x -230), and Toy Town is built on arrival.
- **Test fixes:**
  - **Map and train pictures:** the test now finds them by their picture instead of their position in the list. Adding Frosty Peaks had shifted the order.
  - **Biscuit:** tapped from his left, so your following pets can't stand in front of him.

## 3D build 31: Frosty Peaks, a My Pets panel, and a whole-world bug sweep

**Bug sweep (automated, both directions over the whole outdoor world):** Dawson never got stuck and there were no console errors. The only detours were the intended rides (slides, lift, ball pit).

**❄️ Frosty Peaks (x -272 to -404).** Still further left, past the woods:
- a sledding hill: climb the snowy steps, tap the sled and whoosh down;
- a snowman to build, one part per tap (three snowballs, a carrot nose, a hat), which melts away to build again;
- a snowball toss at a target;
- a frozen pond: run onto it and let go, and you glide;
- an igloo that glows warm inside (and hot cocoa);
- the northern lights: tap the star and coloured ribbons dance in the sky;
- waddling penguins that flap when tapped;
- Pebble the penguin, a new pal to befriend;
- gently falling snow while you are there.

Also new:
- **Gems:** 2 more (14 in all).
- **Train:** extended to a ❄️ station.
- **Map:** a ❄️ picture.

**🐾 My Pets** (top left): your befriended friends in big pictures. Tap one to bring it along (💖) or send it home to wait (🏠). Friends you haven't met yet show as ❓, and tapping one tells you where to find them. Following friends now walk in front of the path, each in its own spot, so they don't overlap the workshop pets or each other.

**Measured (desktop, iPhone size):**
- **Walking into Frosty Peaks:** 0 long tasks, 0 new shaders.
- **Activities:** all 10 tappables work.
- **Sled:** slides from the top (4.5 m) to the ground.
- **Ice:** you glide 2 m after letting go.

**DEVLOG.md** (since renamed DEVELOPMENT_LOG.md, with NEXT_TASKS.md, PERFORMANCE_LOG.md and CLAUDE.md) now holds the verification routine, each checkpoint, the known issues and the backlog, so development can resume from the newest checkpoint.

## 3D build 30: the train fixed and running the whole world, a seaside and a forest, and pets to befriend

**Train: problems found in the code and fixed**
- **A sudden jump when turning round.** To change direction the train moved its whole body 4.5 m in one frame. It now simply drives backwards when it needs to, so it never teleports.
- **It popped into existence.** When called, it appeared 26 m away even if that spot was on screen. Now, within 40 m it drives over to you; from further away it appears 26 m out, which is off screen.
- **It didn't go everywhere.** The track ended at the castle (x 422). It now runs the whole world, from x -270 to 904. There are 17 stations, including 5 new ones for the new neighbourhoods (🌉 🧸 🚀 🖍️ 🌈) and 3 to the left (🏖️ 🌲 🦊).
- **Too hard for a five-year-old.** You had to hold ▶ all the way. Now:
  - When you sit in the stopped train, a **strip of station pictures** appears.
  - Tap one and the train **drives itself there**, speeding up and slowing down smoothly at up to 20 m/s, then **you hop off by yourself** onto the platform.
  - Holding ▶ or ◀ still lets you drive it yourself, and PAW still hops off anywhere.
- **Wheels and facing.** The wheels turn the right way when going backwards. Your creature and the camera look the way the train is moving.
- **Less work per frame.** Station bells are only updated while they are swinging.

**Measured (desktop, iPhone screen size, software rendering):**
- **Full route, home → 🌈 end and back home:** both trips arrived and dropped you off.
- **Streaming:** the neighbourhoods were built ahead of the train and taken down behind it.
- **Stalls:** two 50 ms long tasks on the whole route; none on the way back.
- **No teleports:** the biggest move in one frame was 5 m, which is top speed during one slow test-machine frame.
- **Calling from far away:** the train appeared 24 m from the camera (off screen).

**The world grows to the LEFT too: two new regions (x -20 to -268)**

| Region | Activities |
|---|---|
| 🏖️ Sunny Seaside | an ice cream stand (stack strawberry, vanilla, mint and chocolate scoops, then eat it) · a sandcastle that grows with each tap, until a wave washes it away to build again · dancing crabs · 6 seashells to collect (remembered) · a lighthouse with steps up to the balcony and a spinning light · a sailing boat (ring the bell on the pier) · a kite that flies high · seagulls · the sea, gently bobbing, with a foam line |
| 🌲 Whispering Woods | a forest of trees behind the path · a campfire you light, with a marshmallow to toast · a hollow log where a different animal peeks out each time · a berry bush (pick and count six berries into a basket) · leaf piles that fly up when you run through · a creek with stepping logs to hop across · a jar of fireflies that dance · paw prints leading to the fox den · a 🏠 home sign at the end |

- **Pets to befriend and keep:** **Pinchy the crab** at the seaside and **Rusty the fox cub** in the woods.
  - Tap one three times to make friends.
  - It joins your collection, which is saved, and follows you everywhere, including through map jumps.
  - Tap it to send it home to wait; tap it at home to bring it again.
- **4 more gems:** lighthouse balcony, pier, creek log and fox den, for 12 in all.
- **Map and train:** the picture map now has 12 places, and both new regions have train stations.

**Measured:**
- **Walking from the Playhouse to the end of the woods:** 0 long tasks and 0 new shader programs.
- **Activities:** all 32 tappable things in the two regions ran with no errors.
- **Saving:** shells, gems and pets survive a reload.

**Bugs found and fixed while testing:**
- **Gems on the left side could never be collected.** The gem check only ran on the right side.
- **The new areas' progress didn't survive a reload properly.** Loading a save replaced the data object the new areas were using, so after a reload, collected gems came back, followers were not restored, and new finds would not have been saved. Loading now fills in the same object, and the new areas refresh their gems and pets from the save.
- **The hollow log would have needed a new double-sided shader.** It is now a closed log with a dark hole.

**Tests:** full suite **147/147** (on the final build of this update). 5 new checks:
- the 🗺️ map opens;
- a map picture takes you there and builds the place at once;
- 🏠 takes you home;
- picking a station picture drives you there and you hop off;
- befriending Pinchy.

Test fixes:
- **Ferris wheel:** the check now waits for the wheel to rise instead of a fixed 2.5 s. On the slow test browser it reached 1.48–1.8 m in that time; checked directly, the wheel lifts you to 11 m in 6 s.
- **Character taps:** the Painter Bunny, Drummer Frog, penguin and owl are now tapped from their left side, aiming at where each character really is. Your following pets and balloons trail behind you, so they can't stand in front. They sometimes did, and the tap rightly went to the pet, which made these checks fail at random.

**Still to do:**
- **Interiors:** new indoor spaces.
- **Tunnels:** secret tunnels between regions.
- **Pets:** more befriendable pets, and choosing which ones follow.
- **Regions:** more regions (the left side can keep growing).
- **iPhone measurements:** frame rate, loading time and memory need your phone's Performance Test report.

## 3D build 29: the world more than doubles, with four new neighbourhoods and 23 new activities

**What's new:** past the castle's rainbow gate (x 422), the outdoor world now continues to x 902, so it is more than twice as long. There are four new connected neighbourhoods, one extending each district:

| Neighbourhood | Where (x) | Activities |
|---|---|---|
| 🌉 Adventure Trail (Adventure Park) | 428–548 | stream and wooden bridge (splash through the water) · climbing rocks up to a lookout with a telescope · 3 treasure chests with a random surprise · a crystal cave where you tap the crystals to make them glow |
| 🧸 Toy Town (Mega Playhouse) | 548–668 | musical floor (every step plays a note) · block tower (press the button to drop blocks; too tall and it crashes) · bounce park (3 trampolines, each higher) · ball cannon into a hoop · seesaw that tips when you stand on it · catch the balloons floating up |
| 🔬 Lab Gardens (Wonder Lab) | 668–788 | colour-changing pond with a jumping fish · bubble fountain · lamp that makes shadow animals on a wall · rocket launch · water fountains · magnet crane (the metal can sticks, the apple doesn't) |
| 🖍️ Art Plaza (Imagination Studio) | 788–902 | sticker wall (stickers are saved and stay there) · spin art · drum, bells and rainbow xylophone · light mixer (red, green and blue lamps on a white statue) · a friend to pet and feed · hide and seek behind bushes · rainbow portal home |

**Also:**
- **Gem hunt:** 8 hidden 💎 gems across the new neighbourhoods. Some are on the path, some up high (the lookout, the trampolines, above the seesaw). Walk into one to collect it.
- **Signposts** with each neighbourhood's picture.
- **Scenery:** hills behind the outdoor neighbourhoods, trees, lawn, the cobblestone path and a floor rail all the way along.

Each activity is one tap, one walk or one jump, with a spoken line, a big reaction and nothing to read. Most can also be used with the PAW button. There's no way to fail.

**Easy to get around:**
- **🗺️ map** (top left): big picture buttons for 10 places, each with its name spoken: 🏠 home, Playhouse, Studio, Wonder Lab, Adventure Park, castle, and the four new neighbourhoods. Tap one and you are there, and the place you're nearest is highlighted.
- **🏠 home** (top left): one tap takes you to the Fluffkin House.

**Streaming (no extra load at start-up or while playing):**
- **Always present:** only the light parts (ground, path, hills, trees, signposts and gems).
- **Built when you come near:** each neighbourhood's toys and activities, starting about 95 m away.
  - At most about 3.5 ms of building per frame, so the game never stalls.
  - Shaders are prepared in the background before it appears.
  - When you travel straight into a neighbourhood with the map, it is built immediately.
- **Taken down when you go far away** (more than 190 m): its own shapes and pictures are freed, and taps and PAW points are removed.
- **Kept in the save, not the scene:** what you did there (gems, stickers, chests opened, balloons caught).
- **Shared materials and shapes:** everything reuses the world's.

**Measured (desktop, iPhone screen size and identity; not an iPhone):**
- **Drawing cost:** the new neighbourhoods draw 108k–336k triangles and 69–85 draw calls per frame. The original park draws 567k–792k triangles and 189–272 calls, so the new areas are the lightest in the world.
- **Shader programs:** 100 in the real (non-test) game, before and after visiting all four new neighbourhoods. No new shaders means no first-visit freeze.
- **Streaming:** walking from x 436 to 902, each neighbourhood was ready before you reached it. The ones behind you were taken down 190 m later. Tapping 🏠 unloaded all four.
- **Activities:** every one in all four neighbourhoods ran with no errors; 19 of their discoveries were triggered in the test.
- **Saving:** gems, stickers and chests survived a reload.

**Not done yet (honest list):**
- **Interiors:** no new indoor spaces (hidden playrooms, multi-floor playhouse rooms) or secret tunnels between areas.
- **Creatures:** no new cooperative creature games beyond pet, feed and hide and seek.
- **Activity count:** this milestone adds 23 world activities. With the existing world toys and the 41 learning games, the game passes 50 distinct things to do. But the expansion's own target of 50 new activities is not reached.
- **iPhone:** frame rate and loading on a real iPhone have not been measured.

### Build 29b: the freezes found and fixed (before adding any more content)

**Rule from here on:** each expansion is measured against the version before it in identical scenarios, and a regression is fixed before more content is added. The scripts are `ba.cjs` (before/after), `house2.cjs` (stalls at transitions), `walknew.cjs` (stalls on a walk from the valley through the Dino Kingdom and castle into the new area) and `soak.cjs` (60 trips around the whole world).

**Expansion vs the build before it (identical scenarios):**
- **Start-up:** 17.9 s vs 14.3 s.
- **Shader programs:** 100 in both.
- **New neighbourhoods:** 117k–342k triangles and 85–97 draw calls. That is the lightest part of the world; the park is 520k–750k triangles and 180–270 calls.
- **Map jump into a new neighbourhood:** no stall.
- **Streaming in while walking:** no stall after the fixes below.

**The freezes were already there before the expansion, and are now fixed.** Long stalls are measured with the browser's long-task timer, on the iPhone screen size and identity, with software rendering:

| Moment | Before | After |
|---|---|---|
| Entering the house | 2.8–3.5 s | **0** |
| Leaving the house | 0.7–0.9 s | **0** |
| Walking into the Dino Kingdom and past the castle | 4 stalls of 1.0–2.7 s (x 353, 381, 387, 405) | **0** |
| Upstairs, castle inside, underground | 0 | 0 |

**Causes:**
1. **Loading rehearsed into the wrong kind of picture buffer.** Loading draws the world once so nothing is drawn for the first time during play. But that rehearsal drew into a small plain buffer, while the game draws into a 4× anti-aliased buffer with a depth texture. The graphics driver (also on iPhone, where WebGL runs on Metal) prepares a separate drawing setup for each kind of buffer. So the real setups were still made on first sight: entering the house froze.
   - **Fix:** the rehearsal now draws into a tiny buffer of exactly the same kind.
2. **Only a few spots were rehearsed.** Things that only appear near you (trees, bushes, grass, fur) and creatures that are off the scene because they are far away were drawn for the first time mid-walk, along with their shadow shaders.
   - **Fix:** loading now draws one of every kind of thing, including its shadow, over the whole world, the house, the castle rooms and the underground.
3. **Late creature shaders were finished on first draw.** Creatures sculpted in the background arrive after loading. Their shaders were prepared, but the driver only finishes a shader the first time it is used, which was 2 s in the middle of the walk into the Dino Kingdom.
   - **Fix:** each newly arrived creature is drawn once right away, out of sight (camera layer 5, tiny buffer).
   - Far-away creatures that are off the scene are now included when shaders are prepared.
4. **A tap right after travelling could miss a character**, because far characters were only put back on the scene at the next update.
   - **Fix:** they are put back the moment you arrive.

**Cost:** the extra loading work made loading on the software-rendering test machine about 22–25 s instead of 14 s. That machine has no graphics chip, and an iPhone draws this much faster. The real loading time on the phone is in the in-game report.

**Long session:**
- **Test:** 6 rounds of travelling to all 10 map places and home (60 trips).
- **Shapes in graphics memory:** exactly 1,441 every round.
- **Shader programs:** 101 every round.
- **Tappable things and PAW points:** constant (105 and 66). Unloaded neighbourhoods leave nothing behind.
- **JS memory:** 107–117 MB with no upward trend.
- **Textures:** 156 → 160. These are the shared emoji pictures, made once each, from a fixed set.

## 3D build 28: about a third less drawing work every frame

**Why:** the game was still laggy. A per-object count of what is drawn each frame, on an iPhone-sized screen, showed where the work goes:
- **Trees:** each one is about 66,000 triangles, drawn twice (once on screen and once into the shadow map). The bushes, at 9,000 triangles, also cast shadows.
- **Creatures:** every sculpted creature was about 28,000 triangles. Furry ones are drawn 5–6 extra times as fur layers, so your own creature alone was about 170,000 triangles per frame.
- **Grass:** about 124,000 triangles.

**Changes:**
- **Trees and bushes get low-detail copies, made while loading** with meshoptimizer's simplifier (about 55 KB of code, no extra model files):
  - Shadows always come from the low-detail copy, which has about a third of the triangles. A soft shadow looks the same.
  - On phones, trees and bushes more than 16 m away are shown low-detail.
  - The copies share the original vertex data and materials, so there are no new shaders and memory use barely changes.
- **Creatures are simplified to about 40% of their triangles** as they are made. Their outline moves by less than half a percent of their size, and colours, skinning and fur are unchanged.
  - Your own creature, which is made before the simplifier has loaded, is simplified as soon as the simplifier is ready.
  - The fur layers share the body, so they shrink with it.
- **Grass on phones:** 40% fewer clumps. They are in random order, so the rest stay evenly spread.
- **Phones start on lighter shadows** (graphics level 1: 1024 px, redrawn every 3rd frame) instead of waiting to lag first. The automatic graphics still steps up after smooth play and down when the phone struggles. "Reset automatic graphics" returns a phone to level 1.

**Measured (desktop, iPhone screen size and browser identity, software rendering; triangles per frame including shadows):**

| Area | Build 27 | Build 28 | Change |
|---|---|---|---|
| Park | 924k | 568k | −39% |
| Creature area | 1,146k | 796k | −31% |
| Valley | 1,003k | 711k | −29% |
| Castle | 835k | 604k | −28% |

- Shader programs are unchanged: 99–100.
- Side-by-side screenshots of the same views look the same.
- Making the low-detail trees took 137–184 ms during loading on this machine; a phone will take longer.

**Not measured:** the real frame rate on an iPhone. The in-game Performance Test (hold ⚙️) measures that.

**Also in build 28 (fixes):**
- **The ⚙️ grown-ups' button opens on iPhone.** Holding a finger on it made Safari start its own long-press gesture, which cancels the touch, and the old code treated that as "finger lifted". Now only a real lift ends the hold, which takes 0.7 s. A quick tap shows a small "✋ Hold ⚙️ (grown-ups)" hint.
- **🗑️ Start over (erase all progress)** in the grown-ups' panel. It needs two taps: the first changes it to "Tap again to erase everything", which resets after 4 s. The game then reloads fresh.
- **Home Screen app updates arrive at once.** The offline helper now always asks whether the page has changed, instead of using a copy up to 10 minutes old.

## 3D build 27: learning games rebuilt as simple toys, with three learning levels

**Why:** the learning games still felt like a school quiz. They had too many choices, several rules at once, spelling, and categories, and one screen showed a happy face beside a question about a grumpy one. They are rebuilt around the way young children play: tap, drag, match, count, discover. There is one skill and one action at a time, and every question has a right answer that is on screen.

**Three learning levels (a grown-up chooses: hold ⚙️):**

| Level | For | What it includes |
|---|---|---|
| 1 Super Easy (default) | ages 3–4 | Two big choices; matching identical things; counting 1–3; colors **or** shapes, never both; letters only as "find the same one"; no reading or spelling |
| 2 Learning More | developing preschool skills | 3 choices; counting to 5 and number cards; two-color patterns; letter names and sounds; easy sorting |
| 3 Kindergarten Ready | getting ready for school | Bigger counting; phonics; three-letter words; adding with pictures; harder patterns; feelings stories |

- The game **never moves her up a level by itself**.
- Inside a level each game ramps very gently, for example from 1–2 things to 1–3.
- Each corner shows only the games for the chosen level.
- Stars and progress are kept.

**How every game behaves:**
- **Instructions:** one short spoken instruction, such as "Let's count! Tap each one.", "Find blue!", "Match it!" or "Feed me!". 🔊 repeats it.
- **"Watch me" hand:**
  - It plays the first two times a game is opened at each level.
  - It only ever touches the right thing.
  - It sits below what it points at, so it never hides it.
  - A tap skips it; 👆 replays it.
- **Help when she's quiet:** after 8 s the instruction is repeated and the right thing wiggles; after 15 s the hand points; after 28 s the demo plays again.
- **Gentle mistakes:** a wrong tap gets a wiggle and a kind spoken hint, with unlimited tries. After two tries the right one glows; after three the hand points.
- **Reactions:** things bounce, pop, glow and make sounds; each turn ends with confetti, and each round with a dancing critter and a star. A round is 3 short turns at Level 1 (4 at Levels 2 and 3), about 10–30 seconds each.
- **Pictures:** original pictures are drawn in code: critters, animated faces, balls, bubbles, buckets, cups, shapes and puzzle pictures.

**The games at Level 1:**
- **Numbers:**
  - **Let's count:** tap 1–3 critters; each one bounces and the voice counts.
  - **Same number:** find the group with the same amount.
  - **Cookies for the critter:** "Give me two cookies!" Drag cookies to its mouth and it counts them.
- **Letters:**
  - **Find the same letter**, with two big letters to choose from.
  - **Letter puzzle:** drag the letter onto its outline.
- **Colors and shapes:**
  - **Find the color:** a big sample ball and two balls to choose from.
  - **Shape sorter:** drag each shape into its hole.
  - **Pop the bubbles.**
  - **Color buckets:** drag balls into the bucket of the same color.
  - **Mix the paint.**
- **Puzzles:**
  - **Match it:** drag the duck onto the duck.
  - **Find mommy:** the baby animal's big mommy.
  - **Where is it?** A toy goes under one of two cups.
  - **Picture puzzle** in 2 pieces.
  - **Match the cards:** 2 pairs, shown face up first.
- **Science:** Tap and see (lamp, cloud, ball, egg, present, seed), sink or float, magnet, grow a flower.
- **Music:**
  - **Animal sounds:** tap animals to hear them.
  - **Music band:** drum, bell, trumpet, guitar, shaker, piano.
  - **Copy me:** one note, two pads.
  - **Paint.**
- **Feelings and me:**
  - **Feelings:** "This face is happy. Find happy!", with the same face among two.
  - **Feed the critter:** it shows the food it wants in a thought bubble.

**Levels 2 and 3 add:**
- Number cards.
- Number train and adding with pictures.
- Letter names, sounds and phonics; rhymes; building three-letter words with guide letters.
- Patterns and the odd one out.
- Sorting into categories; small to big.
- Weather, day and night, heavy and light, animal homes.
- Things we use; being kind; staying safe; first, next, last.

**The voice (`src/voice.js`)** is shared by the whole game. It is fixed for mobile Safari:
- The first tap unlocks it.
- It waits a moment after cancelling a sentence before speaking.
- It keeps sentences from being cut off and resumes after the app was in the background.
- It picks a natural voice.
- If sound was off, 🔊 turns it back on.
- The grown-ups' panel has **🗣️ Test the voice**, and the performance report has a **Voice** line (voices found, the one used, sentences started and finished, errors).

**Checks:** `learning.audit()` checks every game at every level it is offered:
- a spoken instruction, short at Level 1;
- something to do with a right answer on screen;
- no more than 3 choices at Level 1;
- no words to read.

The tests play every game at all three levels with a recording speech engine: 97 play-throughs, every game completed (each earns its star, except Paint, which has none by design), with no words on screen and no errors. The full game test passed 140/140, including 4 new learning-game checks.

**Speed:** the games are an overlay with the 3D world paused, CSS animations and tiny inline drawings; there are no new files to download.

## 3D build 26: iPhone performance tools and automatic graphics

**Why:** the game is played on an iPhone, but it can only be tested here in a desktop browser with software rendering. This build adds tools that measure the game on the real phone and produce a report to paste back into the chat.

**Grown-ups' settings (⚙️ at the top right):**
- **Hold the ⚙️ for one second** to open it, so a quick tap from a child does nothing.
- **📊 Monitor:** a small box in the bottom-left corner. It shows:
  - FPS now, average and 1% low, plus the worst frame.
  - Frames over 50 ms, and freezes over 250 ms.
  - The last loading time between areas.
  - Render size in pixels, device pixel ratio, render scale and graphics level.
  - Draw calls and triangles.
  - JS memory, only where the browser reports it. Safari doesn't.
- **▶ Performance Test (about 30 s):** the game plays itself through seven parts:
  1. Walking in the park.
  2. The busy creature area.
  3. Walking at the castle.
  4. Going into the house.
  5. Walking inside the house.
  6. Leaving the house.
  7. Walking in the studio.

  Sound is muted while it runs, and taps are blocked so they can't disturb it. It never saves. Afterwards it puts you back where you were, with the same discoveries, star bits and Fluffkins.
- **📋 Copy Test Results:** copies a readable report. If copying is blocked, the report is selected in a text box so it can be copied by hand. The report includes:
  - The browser and device.
  - Screen size, pixel ratio and render size.
  - The GPU name, where available.
  - Start-up time.
  - For each part of the test: average FPS, 1% low, worst frame, number of slow frames, draw calls and triangles.
  - Loading times between areas, freezes, and any automatic graphics changes.
- **↺ Reset automatic graphics** goes back to full quality.

**Cost of the monitor:** a few numbers per frame are written into a fixed buffer, with no allocations. The text box is redrawn twice a second, and only while it is switched on.

**Automatic graphics (6 levels, remembered on the device):**

| Level | What changes |
|---|---|
| 0 | Full quality |
| 1 | Lighter shadows (1024 px, redrawn every 3rd frame) |
| 2 | Lite effects (no 4× anti-aliasing buffer, no glow) |
| 3 | Resolution −12% |
| 4 | Resolution −24% |
| 5 | Smallest shadows, resolution −30% |

- It steps down only after sustained slowness: about 2.5 s under ~48 fps, with at least 4 s between changes.
- It steps back up after 30 s of smooth play, and never retries a level that failed within the last minute.
- It ignores a steady 30 fps cap (iPhone Low Power Mode), which is not lag.
- Measured: changing level compiles **no** new shaders (97 programs before and after every level), so a change can't cause a freeze.

**Faster drawing:** 520 flowers, 490 party lights and 471 train-track sleepers were each one instanced group spread over the whole world. An instanced group is shown or hidden as a whole, so all of them were drawn every frame, on screen or not. They are now cut into 24 m chunks that are hidden when off screen. In the park view that is about 260k fewer triangles per frame (1.15M → 0.89M); in the creature area about 230k fewer (1.52M → 1.29M).

**Measured here (desktop, software rendering, not an iPhone):**
- The test runs from start to finish, restores the position and discoveries exactly, and leaves the save unchanged.
- Copying works.
- Full smoke test: **136/136 checks passed**, no console errors.
- A quick tap doesn't open the panel; holding does.

The FPS numbers here (1–3 fps) come from CPU-only rendering and say nothing about the phone. **The iPhone report is what counts.**

## 3D build 25: lighter every frame, snappier controls, and the Learning Corners
Backup of build 24: `backups/3D_build24_index.html`. Measurements come from desktop Chromium with software WebGL, emulating a phone screen. That is not a physical iPhone.

**Performance: what the profiles showed, and the fixes**
- **CPU-side per-frame cost:** three.js walked about 3,650 objects every frame (positions, culling, shadow pass), most of them far off-screen.
  - **Scenery slices:** still scenery is grouped into 24 m slices along the world, and slices out of view are taken off the scene, so they are not walked at all. Anything that moves about is never sliced: the train, the baby Fluffkins, followers and creatures.
  - **Far creatures:** creatures far from the camera (more than 60 m) leave the scene, so their skeletons (about 50 bones each) are not updated. They come back when you approach, and a creature that starts following you always stays.

| | build 24 | build 25 |
|---|---|---|
| objects walked per frame (park) | 3,654 | 1,360 |
| objects walked per frame (castle) | 3,655 | 1,174 |
| scene matrix update | 0.83 ms | 0.29 ms |
| game JavaScript over 8 s of play | 226 ms | 136 ms |
| frustum/projection work over 8 s | 168 ms | 68 ms |

- **Controls that felt sluggish:**
  - Snappier start and stop: ground acceleration 40 → 62, air 22 → 30, top speed 5.2 → 5.8.
  - The camera follows more tightly (rate 5 → 8), and its look-ahead swings faster after a turn (1.6 → 3), so the controls don't feel delayed.
  - Touch input had no browser delay to remove: the viewport and `touch-action` were already right.
- **Remembered quality:** the automatic quality steps are now remembered on the device. A phone that needed lighter graphics starts with them next time instead of lagging until it adapts again. A device that runs smoothly for 25 s steps quality back up.
- **The bottleneck (honest):** drawing (GPU work), not game logic. JavaScript is about 4–5 ms per frame in the test browser, and creatures cost 0.03 ms. On a slow phone the adaptive quality is the safety net.

**The Learning Corners (`src/learn.js`)**
- **Where:** seven signposts in the park and the valley: 🔢 numbers, 🔤 letters, 🎨 colors & shapes, 🧠 thinking, 🔬 science, 🎵 music & art, 😊 feelings & me. Tap a sign, or press PAW beside it.
- **How it stays light:**
  - Each game is a 2D layer of big buttons over the game; there are no new 3D scenes or renderers.
  - The 3D world pauses completely while a game is open, so it costs almost nothing.
  - A game is built when opened and cleared when closed. Measured opening times are 2–19 ms.
- **Made for a 5-year-old:**
  - Every instruction is spoken, and the 🔊 button says it again. There are pictures, not words.
  - Big tap targets and one-tap answers, with no timers and no failure screens.
  - A wrong tap gets a gentle wiggle and a spoken hint; after two tries the right answer glows.
  - Rounds of 5 steps; each finished round gives a ⭐ and makes the next round a little harder.
  - Progress is saved with the game.
- **The 33 activities:**
  - Numbers: count by tapping each thing, find the number, more or fewer, the missing number on the train, add and take away.
  - Letters: big and small letters, find the letter, first sounds, rhyme time, build a three-letter word.
  - Colors & shapes: find the color, mix the paint (discover new colors), find the shape, what comes next (patterns), which is different.
  - Thinking: memory cards, small to big, what belongs.
  - Science: sink or float (an experiment), magnet magic, heavy or light, dress for the weather, day and night, animal homes, grow a flower (water and sunshine).
  - Music & art: copy the music (rhythm), play music (four instruments), paint a picture.
  - Feelings & me: how do they feel, being kind, what do we use, safe choices, what comes first (routines).
- **Tested** (automated, through the real touch interface):
  - Tapping a 3D sign opens its corner and pauses the world; closing resumes it.
  - All 33 activities were played through: every round finished and gave its star, the free-play ones respond, progress was saved, and there were no errors.

## 3D build 24: the house freeze fixed at its cause, plus measured performance repairs
Backup of build 23: `backups/3D_build23_index.html`. Every number below is from desktop Chromium with software WebGL (SwiftShader), emulating a phone-sized touch screen. That is not a physical iPhone, and real-device frame rates were not measured.

**The freeze when entering the house: reproduced, found, fixed**
- **Reproduced:** the first entry into the house compiled **20 shader programs at once** (a 3.5 s block in the test browser). The first trip underground compiled 22 (2.7 s), and first visits to other places compiled 8–15.
- **Cause 1 (my build 22 change):** the house and underground lamps were switched on and off by area. In three.js, changing the number of lights forces every material to recompile its shader.
  - **Fix:** a fixed pool of 3 lamps is always in the scene. It moves to the nearest lamps of the area you are in, fading smoothly, and is dark outdoors. The light count never changes, so nothing recompiles, and outdoors it costs 3 lights instead of the original 10.
- **Cause 2:** shaders were compiled the first time something came into view. The start-up compile was also for the wrong target (straight to the screen instead of the post-processing picture), so it never matched.
  - **Fix:** everything is now compiled for the real target, including far-away grass, trees and fur hidden by distance culling.
  - Creatures sculpted a moment later are compiled as they arrive, and the model files are compiled as soon as they load.
  - While the loading screen shows, each area (the house upstairs and downstairs, underground, the clouds, the castle and its interior) is drawn once into a tiny invisible picture. The graphics driver then finishes every shader and uploads every texture and mesh before play starts.
- **Cause 3:** three.js's shader error check makes the browser wait for each shader on first use. It is now off in the real game and on in test mode, so errors are still caught.
- **Result** (enter and exit the house 3 times, then underground):

| | build 23 | build 24 |
|---|---|---|
| shaders compiled entering the house the first time | 20 (3.5 s block) | 0 (no long task) |
| shaders compiled going underground the first time | 22 (2.7 s block) | 0 (no long task) |
| long tasks during 6 house entries/exits | 4 | 0 |
| shader programs after a full tour | 137 | 101 |

**Other measured problems fixed**
- **Leak:** every speech bubble created and uploaded a new texture that was never freed (creatures show more bubbles since build 23). Bubble pictures are now made once and reused, and bubble materials are disposed. In a 3-lap continuous-play test, textures now stay flat at 117 (build 23 kept climbing).
- **Released balloons:** they were never freed and stayed in the list of tappable objects forever, so every tap got slower. They are now freed and removed.
- **Shadows:** the sun never moves and most shadow casters stand still, so the shadow map is redrawn every other frame. Work per frame, all passes, averaged over 30 real frames:

| view | calls (23 → 24) | triangles (23 → 24) |
|---|---|---|
| carousel | 349 → 304 | 1.60M → 1.38M |
| park | 276 → 244 | 1.70M → 1.48M |
| dinosaur | 301 → 225 | 1.34M → 1.16M |
| castle | 608 → 479 | 0.98M → 0.90M |

- **Phones only:** 571 materials had a faint clear-coat. That is a whole second gloss layer in the shader for very little visible difference, so on phones it is turned off and three.js compiles the cheaper shader. The trade-off is a little less gloss on toys; fluffy sheen materials are unchanged.
- **Profiled JavaScript:** about 7.5 ms per frame during play in the test browser, with 3 ms of garbage collection over 8 s. The creature system costs 0.03 ms per frame. JavaScript is not the bottleneck; drawing is. The automatic quality system (`adapt()`) still lowers resolution and then switches post-processing off if a device can't keep 45 fps.

**Start-up:** about the same as build 23 in the test browser (first start about 16 s, versus 13.8 s; second start about 15 s). The area pre-drawing adds a little on a CPU renderer; on a phone's GPU, eight tiny 32x16-pixel draws should be cheap.

**Test report:** full smoke test **136/136**, no console errors.

**Limits (honest)**
- The test browser draws on the CPU. It can show stalls, shader compiles, leaks and the amount of work per frame, but not real iPhone frame rates. Median frame times there stayed within noise.
- Frame rate, frame pacing and the house transition still need checking on a real iPhone.

## 3D build 23: living creatures, kid-friendly controls, faster start-up
Backup of build 22: `backups/3D_build22_index.html`.

**Creatures (`src/life.js`, a shared behaviour system)**
- **Species profiles:** each creature moves in its own way:
  - hop: pets, bunny, frog
  - trot: puppy, unicorn, baby Tops
  - skip: lamb
  - walk: fox, hedgehog, princesses
  - waddle: bear, penguin, beaver
  - fly: fairy
  - perch: owl
  - slide: snail
- **Personalities:** every creature has its own speed, bounce, turn rate, stride and personality (curiosity, energy, sleepiness), randomised a little per creature.
- **States:** one small state machine for every creature: idle, look around, wander, investigate, sit, sleep (💤, waking up with a stretch when you come close), come over curious (❓😊👋), play, react, get tapped, and follow you.
- **Steering:**
  - Smooth acceleration and arrival.
  - Separation, so creatures never bunch up or walk through each other or you.
  - Trees are obstacles, and creatures turn gradually instead of snapping.
- **Gaits:**
  - Driven by the distance actually travelled, so feet don't slide.
  - They move the real leg bones: quadruped diagonal trot, biped walk, skip and hop.
  - Head turns to look at you or at points of interest, the tail wags when happy, hops land with a squash, and waddlers rock.
  - Contact shadows stay on the ground while creatures hop.
- **Reactions:**
  - When you jump nearby, nearby creatures hop too (your followers one after another).
  - Tapping a creature makes it face you, jump for joy, and penguins and princesses spin.
- **Followers:**
  - They walk in a loose, staggered line behind you and catch up when you run (speed scales with distance and your speed).
  - When you stop, they settle and each one does its own thing (sit, look around, a happy hop, a 💖).
  - A friend you ask to stay wanders around the place where you left it.
  - If you run far ahead of a follower, it pops back to you with a ✨ instead of sliding.
- **Cost:** 0.02–0.03 ms per frame for all 15 creatures (measured). Creatures near the camera update every frame, further ones every third frame, and far ones not at all. Nothing is allocated per frame.
- **Measured** (test browser, about 21 s of play):
  - Nearby creatures cycled through idle, look, wander, play, sit and sleep, and stayed within their home radius, with no invalid positions.
  - Followers kept at least 0.83 m apart with no teleporting, and settled (sit, look) when the player stopped.

**Controls for a 5-year-old**
- **Arrow pad:** it keeps the 4-way arrows asked for in build 9, but now steers like a joystick. Put a thumb on any arrow and slide it around the pad to change direction without lifting.
  - The middle of the pad is a small dead zone.
  - "Up" (go in / stairs) needs a clearly upward thumb, so a sideways slide never goes through a door by accident.
- **Tap to walk:** tap the ground and you walk there. It stops on arrival, if something is in the way, or when an arrow is pressed.
- **Forgiving taps:** if a tap misses, the game checks a ring around the finger (22 and 44 px) for something to tap. A tap 34 px beside the Balloon Bear still gets a balloon (tested).
- **Tap feedback:** every successful tap gives a little bounce, a sparkle where you tapped, and a soft pop.
- **Spoken messages:** every message is also spoken with the phone's built-in voice (emoji removed), so a child who can't read yet hears what happened. It's silent when the sound button is off.
- **Already forgiving:** double jump (a second jump in the air), jumping just after walking off an edge, and no failure screens.

**Start-up (measured, desktop Chromium with software WebGL emulating a phone; relative only)**
- **Cause 1:** a profile showed 8.5 s spent reading back procedural texture canvases from the GPU (`getImageData`). These canvases now live in CPU memory (`willReadFrequently`), so the read-back cost is gone, and the normal-map loop is a tight typed-array loop.
- **Cause 2:** the title-screen pictures were rendered at every start (about 2–4 s, including sculpting two characters you aren't playing). They are now drawn once, saved on the device, and shown instantly at every later start. On the very first start they are drawn just after the game becomes playable.
- **Cause 3:** procedural textures drew every shape 5–9 times for wrap-around. The extra copies are now drawn only near tile edges.
- **Results:**

| measure | build 22 | build 23 |
|---|---|---|
| page ready (DOMContentLoaded) | 15.4 s | 7.0 s |
| playable, first start | 17.4 s | 13.1 s |
| longest main-thread block, first start | 10.2 s | 4.0 s |
| total main-thread blocking, second start | 10.9 s | 5.1 s |

- **Frame time:** unchanged from build 22 within noise.

**Test report:** full smoke test **136/136** in headless Chromium with software WebGL, no console errors. Changes needed along the way:
- Buddies waiting to be met now stay within 1 m of their meeting spot.
- The tests tap moving creatures where they actually are, as a child would.
- Followers keep up more closely when you run (the pet was 3.2 m behind while running, now 2.6 m).
- The dino-egg check now stands on the side where your friends trail away from the egg.
- Tried and reverted: a rule that let taps go past friends who follow you to whatever is behind them. It stopped you tapping your own pet in front of the Pet Workshop. The thing in front gets the tap; if a pet is in the way, tapping it just makes it wave and stay.

**Not done yet (honest)**
- **Fluffkins:** the baby Fluffkins (the six you rescue) still use their own simple follow code. They are not yet on the new behaviour system.
- **Camera:** it was not changed in this build. It already follows smoothly with frame-rate-independent easing, steps back at the castle, and the game is a side view with no walls between the camera and the player.
- **Shader compiling:** about 3.8 s in the test browser, 58 programs. It is the largest remaining start-up cost.
- **Not tested on a physical iPhone:** frame rate, the spoken voice and start-up time there still need checking.

## 3D build 22: smoother on phones, plus a Blender-modelled castle and carousel
Backup of build 21: `backups/3D_build21_index.html`.

**Lag and slowness: what was costing the most, and the fixes**
- **Render size:** phones rendered at 1.7x (about 950k pixels per frame). They now render at 1.5x (about 740k). `adapt()` still lowers it further if frames drop.
- **Point lights:** 10 underground and indoor point lights were evaluated for every lit pixel everywhere in the world. Each is now switched on only in its own area (underground or the indoor room).
- **Screen-space AO:** on phones the GTAO pass is off. The new Blender assets carry baked ambient occlusion instead. Desktop keeps GTAO.
- **Distance culling:** grass chunks beyond 44 m, bush chunks beyond 52 m and trees beyond 60 m are no longer drawn.
- **Fur:** fur shells are only drawn on creatures within 14 m of the camera. Phones use 5 shells instead of 8.
- **Phone budgets:** grass is thinned to 1,150 clumps per chunk, the shadow map is 1536 px, and the shape-smoothing budget is 120k triangles.
- **Measured frame time** (relative only: software WebGL emulating an iPhone at 844x390 @3x):

| view | build 21 | build 22 | change |
|---|---|---|---|
| carousel | 3.13 s | 1.50 s | −52% |
| park | 3.97 s | 2.26 s | −43% |
| dinosaur | 4.85 s | 2.64 s | −46% |
| castle | 4.25 s | 2.19 s | −48% |

Real-phone frame times will be far lower; only the relative change means something.

**Blender-modelled landmarks** (`tools/blender/build_landmarks.py`)
- **Castle:**
  - Keep: a brick keep on a stone plinth with a cornice, battlements front and back, and a gabled hall roof.
  - Two great towers (same footprint, so the climbing roses still fit) with corbelled tops, flared tile spires, gold finials, pennants and glowing arched windows in stone frames.
  - A central tower with a pink spire.
  - Two tall back towers for depth.
  - Side wings with battlements and turrets.
  - Every hard edge is bevelled; towers and spires are lathe-turned profiles.
  - UV set 0 is world-scale, so bricks and roof tiles are one size everywhere. UV set 1 carries a Cycles-baked AO lightmap.
  - The door you tap, the balcony, windows, banners, princesses and dance floor are unchanged.
- **Carousel:**
  - A stepped platform with a scalloped skirt, a lilac step and a gold rim.
  - A fluted centre column with mirror panels.
  - A striped, gently domed canopy with a scalloped valance, gold trim, finial and flag.
  - Gold poles now reach the canopy. The ponies, riding and spinning work as before.
- **Materials:** these models are lit with the game's own material set (bricks, stone, roof tiles, gold), so they match everything else.
- **Fallback:** the old shapes remain for the light test mode and if loading fails.
- **Size:** `index.html` is now 8.3 MB.

**Tested and reverted:** I capped physics catch-up at 4 steps per frame to stop a "lag spiral". Measured, a physics step costs only about 0.2–0.4 ms, so the cap saved nothing. It also made the game run in slow motion whenever frames dropped (9 movement checks failed), so it was reverted.

**Test report:** full smoke test **136/136** in headless Chromium with software WebGL, no console errors. The pet-tap check now aims only once the pet has stopped walking; it had failed intermittently because a moving pet could walk out from under the tap in the slow test browser. Not tested on a physical iPhone.

Pictures: `screenshots/compare_b22.jpg` (castle wide, castle side angle, castle gameplay view, carousel close-up, carousel gameplay view).

## 3D build 21: plush fur, seated eyes, and the test failures fixed at the root
Backup of build 20: `backups/3D_build20_index.html`.

**Fur: the old technique had reached its limit, so it was replaced**
- **Why:** shell fur that keeps or discards tiny procedural dots can't be anti-aliased. Each hair is about one pixel wide, so it either sparkles or, faded down as in build 20, still leaves speckle and a noisy bright fringe on the silhouette.
- **`src/fur.js` is now texture-based plush fur:**
  - A tileable "fibre height" map holds 2,600 round strands, each tallest in its middle. It is sampled in 3D (triplanar) on the creature's rest-pose surface, so there are no UV seams and fibres move with the body.
  - Each shell keeps only strands taller than its own height, so strands taper towards the tips.
  - Fibres come from a mipmapped texture, so they average out smoothly with distance instead of aliasing.
  - Edges use alpha-to-coverage on the 4x anti-aliased picture: smooth, with no transparency-sorting problems and no dark overlaps.
  - Gentle root-to-tip shading (90% to 104%), 8 shells instead of 10.
- **Result:** clean, soft plush at every distance. Compare the fur at 1:1 pixels in `screenshots/compare_b21_fur.jpg`.

**Eyes:** Pip's eyeballs are seated 2.3 cm deeper in the head, so the face surface wraps them like sockets. From the side they no longer stick out of the head's outline.

**Test failures, root cause:** all three remaining failures came from one real game problem.
- Since the closer camera (build 14), the sky whale floated at the very top edge of the screen. The tap aimed at it landed on the HUD, and it hit the sound button, which then made both sound checks start with sound off.
- The whale now swims 2.7 m lower, between the cloud floor and the high clouds: fully in view, and easy for Dawson to tap.
- The sound check now also verifies the toggle whatever the starting state.

**Test report:** full smoke test **136/136** in headless Chromium with software WebGL, no console errors. Not tested on a physical iPhone.

Pictures: `screenshots/compare_b21.jpg` (close-up, alternate angle, extreme close-up and gameplay view, build 20 vs 21) and `screenshots/compare_b21_fur.jpg`.

## 3D build 20: clean, cohesive, noise-free rendering (no new content)
Backup of build 19: `backups/3D_build19_index.html`.

**Audit: what was making the picture look noisy and inconsistent**
- **Fur speckle:** each hair was a hard keep-or-discard dot about 4 mm wide. At play distance that is about one pixel, so pixels flipped randomly between bright tips and dark roots (60% to 112% brightness). That produced grain when still and shimmer when moving.
- **Sharpening:** the build 18 sharpening pass amplified exactly that fur grain, plus leaf and texture noise.
- **Two art styles at once:** the path and bricks were the most "photoreal" surfaces (deep grey mortar, strong relief, high stone-to-stone contrast), set next to soft toy-like objects.
- **Confetti foliage:** grass roots at 40% vs tips at 102% brightness, clump colours far apart, and per-leaf colour jitter on the trees all read as noise at a distance.
- **Visible tiling:** the path, lawn and walls repeated identical 3–4 m tiles.
- **Depth precision:** the camera's near plane was 0.1 m with a far plane of 600 m, which risked z-fighting on wall details 2 cm apart.
- **Shade:** with a strong 3.1 sun and weak fill, white objects in shade (the carousel ponies) went grey.

**Fixes (code-level)**
- **`src/fur.js`:** anti-aliased fur. The shader measures each hair's on-screen size (`fwidth`). As hairs approach pixel size they become thicker, softer and lower-contrast, like a texture's mipmap, so fur reads as plush instead of grain. Root-to-tip shading is gentler (84% to 105%).
- **`src/post.js`:** sharpening removed; anti-aliasing and dithering kept.
- **`tools/textures/make_cobble.py` and `make_bricks.py`:** regenerated softer. Lighter, narrower mortar, gentler relief and AO, stone and brick tones closer together, almost no specks. The path is now warm pastel stone.
- **`src/refine.js` `macroVariation()`:** a world-space anti-tiling shader (two octaves of smooth noise) on the path, lawn and castle walls, so repeats don't line up visibly.
- **`src/nature.js`:**
  - Grass has gentler root-to-tip shading and colours close to the lawn.
  - Distant grass sinks smoothly into the lawn (26–44 m) instead of shimmering.
- **`src/assets.js`:** leaves are pulled 35% toward the crown's average colour. The baked shading stays and the confetti noise goes.
- **`src/main.js`:**
  - Camera near plane 0.3 (3x depth precision).
  - Softer light balance: sun 2.85, hemisphere 0.7, environment 0.55. Shade is no longer grey, and nothing gets washed out.

**Measured** (same camera positions; "detail" = high-frequency energy, which here is mostly noise)

| view | detail (noise) | dark pixels | near-white |
|---|---|---|---|
| Pip close-up | 10.4 → 5.8 | 5.6% → 2.6% | 1.5% → 1.7% |
| park | 11.9 → 9.3 | 4.2% → 2.7% | 13.0% → 13.3% |
| carousel | 9.5 → 6.8 | 2.1% → 1.0% | 2.1% → 2.9% |
| castle | 8.6 → 7.0 | 2.8% → 1.4% | 8.5% → 8.6% |

Pictures: `screenshots/compare_b20.jpg` and `screenshots/compare_b20_fur.jpg` (fur at 1:1 pixels).

**Test report:** full smoke test 133/136 in headless Chromium with software WebGL, no console errors. Not tested on a physical iPhone. The 3 misses:
- "Tap the sky whale" also fails on build 17.
- Two sound-button checks failed because an earlier world tap had already landed on the sound button in the HUD, so sound was off when they started. Run on their own, they pass. The test now checks that a tap flips the setting and a second tap flips it back.

## 3D build 19: a real asset pipeline (Blender-modelled trees and bushes, tool-made texture sets)
Nothing new was added to play. What's already there now uses real model and texture files instead of shapes generated in game code. The backup of build 17 is `backups/3D_build17_index.html`; build 18 is in git.

**Environment investigation**
- **Engine:** Three.js r187 (WebGL 2), bundled by esbuild into one offline `index.html`.
- **glTF/GLB:** three.js includes `GLTFLoader` and the meshopt decoder, and the bundler now embeds `.glb` and `.jpg` files. The game loads real GLB models in build 19.
- **Blender: available.** The Blender 5.3 Python module (`pip install bpy==5.3.0`, from PyPI, which this environment can reach) runs headless, including Cycles baking and the glTF exporter. Python 3.13 with numpy and Pillow is available for texture tools. `@gltf-transform/cli` (npm) compresses the GLBs.
- **Reachable sources:** npm, PyPI and raw GitHub. Poly Haven, ambientCG, Kenney and Quaternius are blocked. The CC0 package `@pmndrs/assets` (npm) contains 18 Poly Haven HDRIs. I tried its "park" HDRI as the environment light and measured it against the tuned sky environment. It made the castle brighter (near-white 14% to 21%), so it was not used.
- **Local assets:** there were no model or texture files in the project before this build. Everything was generated in game code.
- **What was limiting quality:** every model was assembled at run time from primitives (spheres, cylinders, cards), and every texture was drawn on a small canvas. There was no offline modelling, no baking, and no real texture sets.

**What build 19 adds**
- **`tools/blender/build_assets.py`** models and bakes, with a fixed seed so rebuilds are identical:
  - **3 trees.** Each trunk and branch system is a single smooth organic mesh (a branching skeleton through Blender's Skin and Subdivision modifiers, with root flare). It is UV-unwrapped, with bark colour and a bark normal map baked from procedural bark shaders, plus Cycles ambient occlusion baked into the bark (the leaves shade it).
  - **Tree crowns:** 4,200 individual curved leaf meshes per tree (real leaf shapes with a midrib fold, no cut-out cards). Path-traced AO and per-leaf colour are baked into the vertex colours, and "foliage normals" make light wrap around the crown.
  - **2 bushes** made the same way (1,100 leaves each), with AO baked against the ground.
- **`tools/textures/make_cobble.py`** makes a seamless cobblestone set (exact periodic Voronoi with domain warping): colour, normal and roughness at 1024px. Stones have rounded worn rims, a gentle dome, per-stone colour, grain and mortar AO. It replaces the "bubble" path.
- **`tools/textures/make_bricks.py`** makes a seamless castle-brick set: rose bricks with per-brick tone, worn rounded edges, chips, recessed mortar and AO, as colour, normal and roughness maps. It replaces the almost-white canvas bricks.
- **`src/assets.js`** loads and decodes the files (meshopt). Leaves get a shared material with gentle wind sway and double-sided lighting without dark flipped backs. Bushes are instanced in chunks, so off-screen ones aren't drawn. The old procedural versions remain for the light test mode (`?test`) and as a fallback if loading fails.
- **Castle dance floor:** the tiles are a pearly tint of their own light-up colour instead of glare-white.
- **Size:** the GLBs total 3.3 MB (meshopt-compressed from 10.7 MB) and the textures 0.8 MB. `index.html` is about 6.4 MB.
- **Rendering cost** (triangles in view, same camera; build 19 vs the same build with the old procedural trees):

| view | triangles | draw calls |
|---|---|---|
| park | 1.92M vs 1.63M | 278 vs 363 |
| carousel | 1.70M vs 1.69M | 339 vs 394 |
| dinosaur | 1.35M vs 1.36M | 296 vs 290 |
| castle | 1.05M vs 1.33M | 608 vs 610 |

Most triangles are the grass, as before.

**Measured** (same camera positions, HUD excluded)

| view | near-white (17 → 18 → 19) | contrast (std) | detail |
|---|---|---|---|
| park | 26% → 4% → 3% | 0.17 → 0.21 → 0.21 | 8.6 → 10.6 → 11.1 |
| castle | 38% → 15% → 8% | 0.12 → 0.19 → 0.22 | 4.0 → 6.4 → 8.9 |

Pictures: `screenshots/compare_b19_1.jpg`, `screenshots/compare_b19_2.jpg` (17 / 18 / 19 side by side) and `screenshots/compare_b19_closeups.jpg`.

**Rebuilding the assets**
```
pip install bpy==5.3.0
python3 tools/blender/build_assets.py /tmp/assets            # trees + bushes (about 1 minute)
npx @gltf-transform/cli meshopt /tmp/assets/tree_0.glb src/assets/tree_0.glb   # (each GLB)
python3 tools/textures/make_cobble.py src/assets && python3 tools/textures/make_bricks.py src/assets
node build.mjs
```

**Limits that remain (honest)**
- The characters (Pip, Zuzu, Jelly, critters, princesses) are still sculpted in game code (SDF sculpting, about 2 cm detail). Rebuilding them in Blender with their bones, fur and animations is a bigger job, and the next candidate.
- Other props (rides, castle trim, dinosaurs, kart, train) are still built from shapes in game code. The same Blender pipeline can now be used for them, one at a time.
- Professional asset libraries are blocked here, so these assets are made by me with Blender and tools rather than downloaded.
- **Test report:** full smoke test 134/136 (headless Chromium, software WebGL, no console errors). The two misses:
  - "Tap the sky whale" also fails on build 17 when the test browser is busy.
  - "The Ferris wheel lifts you up" is a 2.5-second wall-clock check. Run on its own, it passes on build 19 (y=1.8, needs more than 1.5) and on build 17 (y=2.0).
- Not tested on a physical iPhone. Load and frame time on a real phone, with a 6.4 MB page and about 1.5–1.9M triangles in view, still need checking. `adapt()` lowers resolution and then turns effects off if frames drop.

## 3D build 18: lighting pipeline correction and fidelity upgrade (audit first, then fixes)
Nothing new was added; this build makes what's already there render properly. The backup of build 17 is `backups/3D_build17_index.html`.

**Audit: why the picture looked washed out** (measured by switching each light on alone at the same camera position)
- The scene's environment (reflection) lighting was a bright *indoor studio* environment (`RoomEnvironment`) at 0.62. On its own it lit the park to an average brightness of 0.68, brighter than the sun (0.36). That light comes from every direction, casts no shadows and is unaffected by AO, so it filled every shadow and pushed pastel colours past white.
- Bloom started at 0.92, below ordinary sunlit pastel surfaces, so large areas glowed and bled together (the haze).
- Fog started at 26 m (build 17), hazing the middle distance.
- Double-sided grass blades and leaf cards had their normals flipped on the back face (three.js default). Half of all blades and leaves therefore faced "down" and rendered dark, which made the harsh, jagged grass.
- Grass and tree colours were saturated lime (grass up to S 0.75, L 0.6, with tips boosted 1.17x).
- A few canvas textures were not marked sRGB, so they displayed too light.

**Fixes**
- **Lighting rig:** a sky-only environment (blue above, warm horizon, olive ground bounce) at 0.5, hemisphere 0.55, sun 3.1 warm, rim 0.55, exposure 0.95. Key to fill is about 3:1, so objects have form and visible shadows.
- **Bloom** only above 1.5 (true glow: sparkles, lamps, glints), at half the previous strength.
- **Fog** pushed back to 55–190 m. No artificial saturation boost; contrast now comes from the lighting.
- **Final pass:** mild contrast-adaptive sharpening (crisper textures, gentle on hard edges) and dithering (no banding in the sky or soft gradients).
- **AO:** GTAO radius increased (0.7 to 1.1) for stronger contact shading where things meet.
- **Vegetation:**
  - Grass blades are lit the same on both sides, with darker roots (natural self-shadowing) and soft varied normals.
  - A cohesive meadow palette for lawn, grass, bushes, hedges and trees.
  - Tree leaf cards are lit as part of a round crown.
  - A new leaf-cluster texture (overlapping leaves with shady gaps, plus matching gentle bumps) for bushes, hedges and tree crowns, replacing a strong random-blob bump map.
  - Crown normals softened toward the round shape.
- **Geometry and textures (`src/refine.js`):** a one-time pass at load. Untouched primitives get more segments, biggest and most visible first, within a triangle budget of 250k on phones. Remaining sharp boxes get bevelled edges (most boxes were already rounded). All textures get 8x anisotropic filtering, colour textures are marked sRGB, and gloss is capped (minimum roughness 0.3, clearcoat at most 0.5). This run's result: 19 boxes bevelled, 98 spheres and 34 cylinders/cones smoothed, 4 textures colour-fixed, 94 materials de-glossed.

**Measured (same 6 camera positions, HUD excluded, 0–1 scale)**

| view | brightness before → after | near-white pixels | contrast (std) |
|---|---|---|---|
| studio | 0.75 → 0.63 | 18% → 13% | 0.15 → 0.20 |
| carousel | 0.81 → 0.65 | 28% → 3% | 0.15 → 0.17 |
| park | 0.78 → 0.60 | 26% → 4% | 0.17 → 0.21 |
| Balloon Bear | 0.79 → 0.63 | 19% → 4% | 0.14 → 0.17 |
| dinosaur | 0.81 → 0.62 | 32% → 4% | 0.16 → 0.18 |
| castle | 0.84 → 0.71 | 38% → 15% | 0.12 → 0.19 |

Before/after: `screenshots/compare_b18_1.jpg` and `screenshots/compare_b18_2.jpg`.

**Limits (honest)**
- Asset sites (Poly Haven, Quaternius, Kenney) are blocked from the build environment, so models and textures stay procedural (sculpted or canvas-generated).
- The geometry pass refines simple shapes only. The sculpted characters and custom shapes are unchanged in this build.
- The castle front faces the sun head-on and is built from pale pastels, so it stays the lightest scene.
- Screenshots come from headless Chromium with software WebGL. Not tested on a physical iPhone.

## 3D build 17: professional picture pipeline (rendering overhaul)
This build improves how everything already in the game is drawn. It adds no new content.
- **HDR rendering:** the world is drawn into a high-range picture with 4x anti-aliasing, then tone-mapped (Neutral) and colour-managed in one final pass.
- **Bloom:** sparkles, glowing windows and sunlit highlights get a soft glow. Only the brightest things glow, blurred at quarter size so it stays cheap.
- **Colour grade:** slightly richer colour, a soft contrast curve, warm highlights, cool shadows and a gentle vignette.
- **Ambient occlusion:** soft shading where things meet the ground or each other (GTAO at half size). It reuses the depth picture, so the world is not drawn twice.
- **Shadows:** 2048px shadow maps with a tighter shadow box around the player, so shadows are sharper. The sun is snapped to shadow texels so shadow edges no longer shimmer as you walk.
- **Materials:** every toy-like material gets a fine surface-detail normal map and slightly rougher, softer clearcoat. That makes things look less like shiny plastic.
- **Atmosphere:** softer, deeper pink-lilac distance haze.
- **Smoother motion:** the character and camera are interpolated between physics steps, and the camera uses frame-rate-independent smoothing. Movement looks smooth on 60Hz and 120Hz screens, and the camera keeps up when frames drop.
- **iPhone performance:** if frames drop, the game first lowers resolution a little, then turns off the extra effects, then lowers resolution further (60fps target, 30fps floor).
- Before/after: `screenshots/compare_b17.jpg`.
- Saves, controls and all gameplay are unchanged.
- **Fixed during testing:** a code comment had swallowed the shadow bias settings (now restored). The camera was lagging when frames dropped (it now uses frame-rate-independent smoothing).
- **Test report:** full smoke test 135/136 in headless Chromium with software WebGL. The miss was "hold ▶ to drive the train": the train moved 0.3 instead of 0.5 in 0.9 s because the test browser runs only a few frames a second. Build 16 drives the train the same distance over the same number of frames. With a 2.5 s hold, the train section passes 6/6. Not tested on a physical iPhone.

## 3D build 16: a softer, more magical look (benchmark: the park, Pip and the castle)
- **Sparkly eyes on every character:**
  - Big patterned irises with fine fibres, a dark rim and a soft inner glow.
  - Three film-style catchlights that stay put while the iris and pupil glance around naturally.
  - A softer eyeball, and bigger, more appealing eyes for Pip.
- **Grass:** short, soft, rounded stylized blades in varied fresh greens with sunny tips, denser and brighter.
- **Rolling meadow:** gentle mounds behind the path, flat where rides and buildings stand. The lawn, grass, flowers, bushes, rocks and trees all follow the ground.
- **Fuller, softer trees:** big lumpy leafy canopies over the branches, with a fringe of leaf cards.
- **Park pieces rebuilt:**
  - **Ferris wheel ticket booth:** a panelled kiosk with a framed window, counter, striped scalloped awning, light bulbs and a sign.
  - **Bouncy toadstool:** a proper shape, with a stem skirt, gills and raised spots.
  - **Carousel:** sculpted ponies with golden horns, colourful manes and saddles.
- **The Princess Castle front**, which used to be a plain pink wall:
  - Pastel stone-brick walls and towers, scalloped roof tiles, steps up to a golden arched door, and a balcony with railings.
  - Arched windows with frames, shutters and flower boxes, a rose window, banners and lanterns.
  - Climbing roses up the towers, trimmed hedges and topiary.
  - The camera steps back and looks up near the castle so you can see all of it.
- **Soft contact shadows** under every friend, pet and buddy.
- **Camera and controls:** the camera is a little closer, so characters show better. The controls and top buttons are a little smaller, and still big for small fingers.
- **Screenshots:** `screenshots/compare_castle.jpg` and `compare_park2.jpg` are before and after. `pip_eyes_b16.jpg` and `park_carousel_b16.jpg` show the new eyes and carousel.

## 3D build 15: benchmark character and environment (graphics overhaul, stage 3)
- **Benchmark character: the Mechanic Fox** (`foxSpec` in `src/critterkit.js`). It's designed from fox anatomy instead of the shared round body:
  - a slim upright body, a deep chest with a white ruff, a long tapering snout with a bare black nose
  - big pointed ears with dark tips (two bones each, with an ear flick now and then), cheek tufts and brow ridges
  - eyes sitting in carved sockets with relaxed eyelids
  - dark "gloves" with fingers, legs that bend like a fox's (thigh, shin and long foot with toes), and a four-bone bushy tail with a white tip
  - about 45 sculpted parts on 26 bones
- **Real fur** (`src/fur.js`, "shell fur"):
  - Each furry body is drawn in several stacked layers; each layer keeps only the dots where a hair passes through.
  - The result is thousands of soft hairs that bend with the skeleton, are darker at the roots and lighter at the tips, and droop slightly.
  - Hairs are scattered (no grid pattern), and bare parts (noses, eyes) have none.
  - On: the fox (10 layers), Pip (9) and every furry friend and pet (6).
- **Benchmark environment: the outdoor park, meadow and valley** (`src/nature.js`):
  - **Real grass:** clumps of individual curved blades, darker at the roots, that sway in the wind. It's split into chunks so grass off screen isn't drawn.
  - **Real trees:** grown like a tree, with a trunk that splits into branches and twigs (with root flare and bark). Layered clusters of real leaf shapes cast dappled shadows.
  - **Natural rocks**, plus woven fabric and brushed metal materials for the fox's cap and wrench.
- **Performance:** skinned characters and fur are now culled when off screen, with a safety margin for waving arms and tails.
- **Screenshots:** `screenshots/compare_park.jpg` and `screenshots/compare_fox.jpg` are before and after. `fox_closeup_front_34_side.jpg` and `pip_fur_front_34_side.jpg` show each from the front, three-quarter and side.

## 3D build 14: the characters rebuilt as real 3D models (graphics overhaul, stages 1-2)
- **What changed and why:** every character used to be a stack of separate balls and capsules moved one by one. That's why limbs could look detached and faces looked painted on.
  - Now each one is **one seamless sculpted body on a real skeleton**.
  - Arms, legs, ears, tails, star points and feelers bend smoothly and always stay attached.
- **How the models are made** (`src/sculpt.js`), with no model files to download, because this setup can't reach asset sites:
  - Each body is described as smooth shapes that melt together like clay (signed distance fields with smooth union).
  - It is turned into one mesh with Surface Nets, with every point snapped exactly onto the surface.
  - Normals come from the field, and colour regions are soft (tummies, inner ears, paw pads, blush, smile lines).
  - **Skin weights** bind the mesh to the bones.
  - Friends and animals are sculpted in a background **Web Worker**, so loading never stutters.
- **Real eyes everywhere:** a white eyeball, a patterned iris with a pupil, a glossy see-through cornea that catches the light, and upper and lower **eyelids** that blink and squint when happy. There's also an open laughing mouth with a tongue.
- **Pip, Zuzu and Jelly** (`src/characters.js`):
  - **Pip:** a plush fairy bunny with a defined head and neck, chubby cheeks, floppy-tipped ears (two bones each), round paws and padded feet. Goggles sit on her forehead, and she has veined fairy wings and a curled rainbow tail.
  - **Zuzu:** a puffy 3D star whose lower points are its legs and side points its arms.
  - **Jelly:** a glossy jelly with four little feet, springy two-part feelers and a glowing core.
  - **Animation is bone by bone:** walking legs with flat feet, arms swinging the opposite way, hips and spine twist, breathing, head turns, springy ears, a wagging tail, waving, hopping, tucking up in the air, and a wiggly tickle.
- **All the friends rebuilt the same way** (`src/critterkit.js`): Balloon Bear, Painter Bunny, Drummer Frog, Penguin, Sleepy Owl, Builder Beaver, Rainbow Unicorn, Hedgehog and Mechanic Fox.
  - Also every pet design, Biscuit the puppy, Pom the woolly lamb, the baby dinos, Tops the triceratops, both princesses and the baby Fluffkins.
  - They all blink, breathe, wiggle their ears and wag their tails, and they keep their accessories and everything they do when tapped.
- Saves, customization (colours, pets) and every interaction are unchanged.

## 3D build 13: much more detailed, realistic graphics
- **Soft natural shadows (ambient occlusion):** corners, the spots under creatures and the gaps between things get soft shading, like real light.
  - It reuses the depth picture the game already makes and runs at half size, so it stays light.
  - If a device can't keep up, it switches itself off first, before anything else is lowered.
- **Anti-aliasing:** edges are smoother.
- **Rim light:** a cool light from behind outlines everything, so shapes look rounder.
- **Real surfaces, all drawn in code** (still one offline file, no image downloads):
  - The park, meadow, marble area and dino valley are a grassy lawn with blades and little flowers in the texture.
  - A cobblestone path with stone edges runs through them.
  - The playhouse, studio and lab walls have plaster texture.
  - The trees have bark, and fuller, leafy tops with eight clumps instead of four.
  - Furry characters and critters have a soft velvety surface.
- **More detail everywhere:**
  - More grass tufts (3,600), darker at the roots and lighter at the tips.
  - About 500 flowers and 80 leafy bushes scattered over the lawns, kept off rides and paths.

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
