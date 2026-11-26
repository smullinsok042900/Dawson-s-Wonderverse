# Dawson's Discovery World 3D — development log

Completed changes and how each was tested, newest first. Each checkpoint says what was verified, how, and on what (desktop
browser vs. a real iPhone). The routine and rules are in `CLAUDE.md`; unfinished work is in `NEXT_TASKS.md`; measurements
are in `PERFORMANCE_LOG.md`.



## Checkpoint: build 137 — THE WACKY GRAVITY WORLD (the fifth dimension)
A fifth 🌀 wormhole (purple, teal and orange) leads to **the Wacky Gravity World** (`src/wacky.js`), where gravity changes from
place to place. One small new rule in `main.js`: `G.gravScale` (how strong gravity is here), next to build 131's `G.gravSign`
(which way it pulls). Each zone shows its colour (blue = floaty, purple = up, orange = flip), and the voice says what it does
the first time. Leaving the world puts gravity back to normal (`gravSign`, `gravScale`, `flipK`, `camLift`).
- **Moon-bounce meadow:** gravity almost gone (0.22): one jump goes about 7.6 m up, across bobbing floating rocks to a star.
- **The anti-gravity lift:** a purple column floats her up to a sky platform (12 m) and stops pushing once she is up (the first
  test found she bobbed in the column forever: fixed); a slide back down.
- **The flip corridor:** orange stripes flip gravity, so she falls up and walks on the ceiling head down; the next one flips her back.
- **The gravity wheel:** a giant ring she rides all the way round, upside down at the top.
- **The floating obstacle course** (low gravity, platforms that move sideways and up and down, carrying her) and **the gravity
  well**, a swirly pad that launches her about 18 m up in floaty gravity (four stars on the way).
- Creatures: the Zoomers; pets **Zoom** (a spring bug) and **Floaty** (a fox who floats).
- **Wormhole arrival:** the world now starts building under the warp swirl, and the swirl stays until the frames settle
  (0.9–4 s; never more than 8 s waiting for the build). Measured: the frames under the swirl stay light, but the biggest seen
  frame (about 5 s later, when she steps out of the rocket) is unchanged: see PERFORMANCE_LOG and NEXT_TASKS.
- Tests: `multiverse.cjs` 63/63 (11 new wacky checks), unit tests 142/142. Desktop, software rendering; not tried on the iPhone.

## Checkpoint: build 136 — THE SQUISHY JELLY WORLD (the fourth dimension)
A fourth 🌀 wormhole (pink, orange and green) leads to **the Squishy Jelly World** (`src/jelly.js`): a candy floor with jam
swirls and sugar sparkles, jelly-bean trees, and everything made of shiny jelly that SQUISHES and WOBBLES when she lands on it
(each piece squashes and jiggles back: a cheap scale wobble, no soft-body physics; one shared material per colour).
- **Jelly hills** to bounce across; a **giant jelly cube** that wobbles and giggles when tapped.
- **The wobbly bridge** over a jam river: each piece sags under her and jiggles, carrying her with it.
- **The jelly tower** to climb (stacked jellies) and **the jelly slide** down. The test found two problems, both fixed: at a
  slow frame rate a step could be skipped (the steps now touch and each can lift her two steps), and the slide started past the
  end of the top step, so walking on dropped her off the tower (now the slide starts on the top step itself).
- **The giant jelly trampoline park** (each bouncier than the last, stars higher and higher) and **the squishy jelly house** to
  walk into (a jelly sofa and a jelly bed; they only catch her while she is inside).
- Creatures: the Wobblers; pets **Gummy** (a gummy bear) and **Wiggle** (a jelly blob).
- Tests: `multiverse.cjs` 52/52 (10 new jelly checks).
- The first full smoke run (344/345) caught **Beepo the robot** (it rolls about) wandering close enough to the green scribble
  friend in Lab Gardens that the 🐾 picked Beepo: the 5 m rule did not allow for friends that wander. Now every new friend
  stands **5 m plus how far it wanders** from every older one (all three friend tests check it); 12 friends moved a little
  (Beepo, the rescue pups and the pig family along the farm, Waffles, Twinkle, Rosa). **Full smoke test after the fix: 345/345** (desktop, software rendering).

## Checkpoint: build 135 — the family's requests: fly up and down, toy fixes, the bubble house, the castle inside, HER OWN BRICK HOUSE
- **Open space: ⏫ ⏬** (hold to fly up or down; shown while flying). The wormholes float above and below the planets, so
  without these only the map could reach them.
- **Toy Universe:** the giant balls are **solid** (she bumps into them and jumps on top; before, she walked through them); the
  **wind-up train's engine and wagons are separate cars**, each sitting on the track and tilting with it, so the train climbs
  over the block bridge (before, it was one stiff piece that stayed straight).
- **Dawson's own brick house** (`src/lego.js`): tap the pile of giant bricks → the building screen: a 12 × 7 grid (the front of
  her house), 6 brick colours, a 🪟 window, the 🚪 door (she puts it on herself, along the bottom) and a 🧽 eraser. ✅ and the
  house stands in the world, built from her design: front wall, back wall (her own pattern, seen from inside), side walls in her
  favourite colour, a roof. With a door, 🚪 takes her inside (the front wall turns see-through, like a dollhouse) and out again.
  The design is kept on the device. Each wall is one instanced mesh.
- **The upside-down castle can be entered**: walking along the sky land into it she steps inside, upside down; the front is open
  like a dollhouse; for her the rooms stand the right way up (a throne, a long table, a chandelier); she hops up to a shelf
  with a treasure chest and a star.
- **Bubble Universe:** bubbles are **more visible** (a stronger, bluer film and a bright shine spot on each) and **the Big Bubble
  House**: a giant see-through bubble to walk into, three floors joined by stairs (a bouncy sofa, a bubble lamp, a fishbowl
  bubble, a bubble bed to bounce on), a lookout with a telescope and a star, and a slide out.
- Tests: `multiverse.cjs` 42/42 (new: ⏫ lifts the rocket; a ball stops her; the cars tilt on the bridge; she climbs the bubble
  house floor by floor; she walks into the castle and hops to its shelf; she builds her house by tapping the real building
  screen, goes in through her door and comes back out).
- **Build 135b** (the bubble speed fix, PR #117): `multiverse.cjs` 42/42 and **full smoke test 345/345** (desktop, software rendering).

## Checkpoint: build 134 — FRIENDS' ROCKETS IN OPEN SPACE REALLY SHOW (family report)
The family saw that in Play Together, friends in open space could not see each other's rockets. Cause: build 127 sent the
rocket in a new player field, `dk`; the family's Firebase database only accepts it after the rules are published again, and
until then the game (on purpose, so nothing else breaks) leaves it out — so the rocket never arrived. The test relay accepts
any field, so the tests could not see it. Fix: the rocket now rides in the pets text (`~x,y,z,turn`, under 60 letters), a field
every version of the rules accepts; receivers read it from there (or from `dk`). No rules change needed. Pets are not sent
while in open space (they wait in the rocket there anyway).
- `space-together.cjs` 7/7, with a new check that from open space only the fields of the older rules are sent (it would
  have failed on builds 127–133).

## Checkpoint: build 133 — THE BUBBLE UNIVERSE (the third dimension)
A third 🌀 wormhole (soft white, blue and pink) leads to **the Bubble Universe** (`src/bubble.js`): foam hills, giant bubbles
resting on the foam and drifting up through a pastel sky, and a very light, floaty pull (3.2 m/s², made-up).
- **Ride INSIDE a giant bubble**: tap the bubble blower; the arrows steer the bubble (it drifts gently up by itself), JUMP pops
  it and she floats softly down. Stars hang high up where only a bubble can reach.
- **Bubble trampolines** (they squish), **bubble houses** on giant bubbles that bob up and down — their floors really move and
  carry her — up to a cloud with a star, and **the bubble slide** (a soapy see-through tube) all the way down.
- **The bubble bus**: a giant bubble that floats her over three floating islands to the far stop.
- **The bubble pop garden**: walk into the little bubbles to pop them, each with its own note. The test found that at a slow
  frame rate a fast step skipped bubbles, and half of them were too high to reach: they are lower now and the touch is
  checked along the whole step (so a slow phone never misses one).
- One see-through material for every bubble; the still ones are batched. Creatures: the Bloopers; pets **Glub** (a fish in its
  own bubble) and **Foamy** (a soap-foam puppy).
- Tests: `multiverse.cjs` 33/33 (10 new bubble checks, with the real arrow keys and JUMP). **Full smoke test: 345/345** (desktop, software rendering).

## Checkpoint: build 132 — THE GIANT TOY UNIVERSE (the second dimension)
A second 🌀 wormhole (yellow, red and blue) leads to **the Giant Toy Universe** (`src/toy.js`): she is the size of a toy mouse,
the ground is a huge play mat, crayons stand like trees, a giant teddy and a toy house stand far away. It is one more entry in
`dimensions.js` (its own look, a bouncy 7 m/s² pull, the Tinkers) — the registry made this a plug-in.
- **Giant block towers**: each block is a real step, so she climbs them by walking, to a lookout with a star.
- **Giant bouncy balls**: land on one and it bounces her to the next (each a different note); the push is aimed at the
  next ball's middle (the first version fell short between the 2nd and 3rd: the test caught it).
- **The giant wind-up key**: tap it and a clockwork parade (duck, drum, mouse) marches across the mat.
- **The wind-up toy train she DRIVES**: ▶ faster, ◀ slower and backwards, over a block bridge, collecting stars.
- **The block mountain** to climb, with **the giant toy slide** all the way down; **the wooden toy coaster**; **the spinning top**;
  **the jack-in-the-box** that bounces her up to a shelf of giant toys.
- Pets: **Clicky** (a wind-up mouse with its key) and **Blocky** (a puppy made of toy blocks).
- Tests: `multiverse.cjs` 23/23 (the Upside-Down World's 14 and 9 for the toys, using real held arrow keys for climbing and driving). **Full smoke test: 345/345** (desktop, software rendering).

## Checkpoint: build 131 — THE MULTIVERSE BEGINS: WORMHOLES and THE UPSIDE-DOWN WORLD
The family's big request: wormholes in open space that lead to wild other dimensions. Phases 1 and 2 are done:
- **The dimension registry** (`src/dimensions.js`): each dimension is one entry (its look, gravity, wormhole place and colours,
  creatures) + its areas module (PLANET_EXTRA) + its landing ground (space.js). It streams like a planet: only one dimension
  is in memory, each area is built when she walks near it, all of it is freed when she flies away. Dimensions are not in the
  rocket menu (still 12 pictures); they are reached through wormholes.
- **Wormholes** (deepspace.js): a giant soft spiral (one small shader: no flashing, it never draws the other world), a
  glowing rim, a halo and a ring of sparks. A 🌀 picture on the 🗺️ map; the autopilot glides right in; flying into it starts a
  warp swirl over the screen, and she arrives. Home: the rocket menu, as from any planet.
- **The Upside-Down World** (`src/upside.js`, 330 m): over the meadow hangs a whole land upside down, 10.5 m up: grass, trees,
  houses, hills and mountains hanging down, a river flowing along the sky, a waterfall that falls UP.
  - **Gravity really flips** (main.js): `G.gravSign` turns gravity UP; `ceil` surfaces are landed on from below; jumps and
    small steps work mirrored; her figure turns over; no ground shadow; the camera stays upright and eases lower. Glowing ⬆️
    arrows make her fall up, ⬇️ arrows float her gently down. Help: a soft speed limit, never lost off the ends, the voice explains.
  - **Upside-Down Town** (hanging houses with porch ledges and stars), **the Hanging Castle** (towers point down: hop down
    four ledges to the star at the tip), **two-way islands** (stand on top or underneath; a bouncy pad below),
    **the Gravity Slide** (from the sky land to the meadow, turning her the right way up), **the Flip Coaster** (it loops up
    onto the sky land and races along it upside down), **the Sky Playground** (bouncy clouds: bounce down, fall back up).
  - Creatures: **Flipsies**; pets **Topsy** (an upside-down bunny) and **Dropsy** (a jelly drop that drips up).
- Picture check: the sky land was too high to see from the meadow (15 m): lowered to 10.5 m, everything scaled with it; the
  thick front edge that covered the view from up there became a thin grassy rim.
- Tests: `multiverse.cjs` 14/14; **full smoke test: 345/345** (its planet checks now visit the Upside-Down World too: aliens,
  activities, a 330 m place, only it kept in memory). Desktop, software rendering.

## Checkpoint: build 130 — DAWSON AND HER FAMILY
From the family's pictures (the photographs are not in the game; only colours, hair, glasses and clothes), built as round toys
like the story friends (`src/family.js`; the person builder gained glasses, beards, long, short and combed hair, a coloring
book and two little hero toys). They live together on the Adventure Trail, just past the zip line, and greet her by name:
- **Dawson** (ponytail, black long-sleeve top, red leggings, a hero toy in each hand), **Mom** (long dark hair, clear glasses,
  maroon plaid flannel over a black top, grey joggers, a coloring book), **Dad** (strawberry-blond hair, big beard, maroon
  T-shirt, grey sweatpants), **Aunt Ayla** (golden hair, lilac dress, mint cardigan), **Gigi** (short dark hair, blue T-shirt,
  long cream skirt), **Grandpa** (combed dark hair, black glasses, beard, navy jacket over a light blue shirt, jeans) and
  **Buck the Dog** (tan and black, floppy ears, a pink bandana).
- Each one speaks to Dawson ("Hi Dawson! It is Dad! I love you so much!") and plays when tapped (hug, twirl, sparkle, bounce).
- Placed clear of the trail's activity spots (read from the running game; `tests/activity-spots.json` now also lists the
  trail, the woods and the pier) and of every older friend; Grandpa was moved off the zip-line pole after a picture check.
- Tests: `family.test.mjs` 4/4; all 142 unit tests pass. **Full smoke test: 345/345** (desktop, software rendering).

## Checkpoint: build 129 — THIRTY MORE STORY FRIENDS (the family's second set of pictures)
Again original friends in the spirit of the shows in the pictures (the real characters belong to other companies), built
as round toys in the creature batch (`src/story-friends-2.js`, sharing build 128's parts):
- **Toy Town:** four fuzzy neighbourhood monsters (Fuzzle, Bopsy, tall Ziggy with antennae, Plum with a flower), and a toy
  clinic: Doctor Daisy in her white coat with Ellie the plush elephant (nurse cap), Rexy the plush dino and Tilly the plush giraffe.
- **Happy Farm:** a rescue pup team with helmets, hats, goggles and vests (Sparky the fire pup, Digger the builder, Zoom the
  pilot, Medic Mo, Splash the water pup), and a pig family (Papa with glasses, Mama, Poppy with a bow, baby Pip).
- **Sunny Seaside:** sea explorers in sailor hats (Captain Wally the walrus, Pip the otter, Shelly the turtle) and seaside
  friends (Twinkle the starfish, Pinchy the crab, Ollie the octopus in a sunhat, Shimmer the snail).
- **Lab Gardens:** Beepo, a little robot on one wheel with a screen face. **Balloon Hills:** five fluffy rainbow bunnies.
- 1,000–3,000 triangles each, one mesh, the shared creature material. Rescue pups use new hat and vest options of the puppy builder.
- Tests: `story-friends-2.test.mjs` 3/3 (it found Papa and Mama Pig on top of the purple bee friend and Beepo next to the green
  scribble friend: moved); all 136 unit tests pass; a picture tour of every home found Ollie inside the lighthouse (moved).
  The first smoke run failed the big-eared seaside friend's PAW check: the PAW button picks the nearest friend, and Ollie
  stood 4 m away. Every story friend (both batches) now stands at least 5 m from every older resident, and both tests
  check it (moved: Ollie, Twinkle, Pinchy, Shimmer, and from build 128 Princess Crystal, Snowball Buddy, Waffles and Pepper).
  The next smoke run failed the farm and Balloon Hills activity checks: some friends stood exactly on an activity's 🐾 spot
  (Sparky on the carrots, Zoom on the apples, Papa Pig on the ducks, Rose on the wind chimes), so the 🐾 picked the friend.
  Every activity spot was read from the running game (`tests/activity-spots.json`) and every story friend now stands at
  least 2.5 m from one (26 small moves); both friend tests check it. **Full smoke test after the fix: 345/345** (desktop, software rendering).

## Checkpoint: build 128 — EIGHTEEN NEW STORY FRIENDS; build 127 (open space together) included
The family sent pictures of characters Dawson loves from films and shows. Those belong to other companies, so (with the
family's OK) these are **original friends in the same spirit**, built as round toys like the drawing friends (`src/story-friends.js`):
- **Art Plaza, a pop-star trio:** Juno (purple braid, yellow jacket, microphone), Rosa (long pink ponytail) and Mina (dark buns).
- **Toy Town:** Grinny the Stripy Cat, a big blue-violet cat with a wide happy grin and a tiny top hat; Fluffy the pink poodle and Waffles the pug.
- **Frosty Peaks, a snow family:** Princess Crystal (ice-blue gown, snowflake wand), Snowball Buddy (a classic snowman with a
  scarf and bobble hat), Pinecone the Reindeer, Rowan the Mountain Guide and Blizzard the Husky.
- **Happy Farm and Balloon Hills, more puppies:** Skipper (blue), Ginger (red), Dotty (spots), Noodle (long), Patch (sheep pup), Sunny (golden) and Pepper (beagle).
- Each says hello when she comes near and plays when tapped (sing, twirl, bounce, sparkle, hug). One painted solid each
  (2,300–3,500 triangles, the same shared material: no new shader), streamed with its district like the drawing friends.
- Tests: `story-friends.test.mjs` 3/3 (all registered, finite, on the ground, under 3,600 triangles, one home each, apart);
  all 133 unit tests pass; a picture tour of every home (moved: the princess stood behind the big ice block, the cat by the crates).
  The first full smoke run (344/345) caught the princess standing on the family's snow sculpture friend, so its tap check
  failed; she and two singers (next to the orange scribble friend) were moved, and the unit test now checks every new home
  against every resident who already lived there (≥ 2.5 m). **Full smoke test after the move: 345/345** (desktop, software rendering).

### Build 127 — OPEN SPACE TOGETHER (friends' rockets and spacewalks) and pets on spacewalks
- **Play Together in open space:** friends in one room who fly up into 🌌 see each other's **rockets** out there (gliding
  smoothly between updates), and a friend on a spacewalk floats beside their rocket as themselves; back in the rocket, only
  the rocket shows. Friends are shown within 300 m in space (80 m along the path on the ground, as before).
- **How it is sent:** the rocket goes as one short text `dk` ("x,y,z,turn"), checked on arrival to be exactly four numbers;
  while out there, her own place is sent as a half-size offset from her rocket, so every number stays inside the database's
  limits (the tether keeps a spacewalker within 110 m). `firebase-rules.json` adds `dk` (text under 60 letters; the family
  must publish the rules once more, MULTIPLAYER.md). With older rules a phone in space simply drops `dk` and is not seen
  until it lands; nothing else changes.
- **Pets:** her chosen friend floats along on spacewalks in its own little bubble, never far away (the voice says so once),
  and waits in the rocket otherwise.
- Tests (desktop, software rendering): `space-together` 6/6 (two browsers, test relay with 120 ms delay), `open-space`
  24/24 (+ the pet check), Firebase rules emulator test adds two `dk` cases (not run here: no emulator).

## Checkpoint: build 126 — OPEN SPACE (fly the rocket, spacewalks, Star Station) and THE SUN; build 125's fixes included
The family's big request: make space itself a place to explore, let her get out of the rocket and float about, and make the Sun a destination with huge attractions. This build does the first verified phases of it.
- **🌌 Open space** (new `src/deepspace.js`): the first picture in the rocket menu. After blast-off she flies the rocket herself in a 3D solar system: ◀ ▶ steer, ▲ faster, ▼ slower (arcade flight, never stuck: a soft push keeps her out of planets, and the edge of the solar system turns her back). The **picture map** (🗺️) lists every planet, the Moon, Pluto, the Sun, Star Station, the hoop trail, the comet and the asteroid belt; tapping one starts the **autopilot**, which flies faster the farther the goal is (seconds, never minutes) and slows down on arrival; touching the arrows takes over again. Close to a planet, **🛬 lands** on it (the normal landing on its pad); from any planet's rocket, 🌌 goes back up, starting beside that planet.
- **Spacewalks:** 🧑‍🚀 lets her out in a **bubble helmet with a little jetpack**. The arrows float her about (relative to the camera, which stays close behind her), JUMP floats up, ⬇️ floats down; she slows down by herself (automatic stabilising) and turns to face where she drifts. A kind invisible tether: far from the rocket she drifts back toward it, and very far away she is brought back. 🚀 takes her back inside in one tap. No fuel, no air, nothing to lose.
- **Things to find:** **Star Station** near Earth (a big ring station with windows, solar panels and a glowing docking bay; 🛰️ docks and lets her out to collect 12 floating stars), **star jellies** (clearly made-up friendly space creatures that drift over when she floats near), the **hoop trail** near Mars (8 giant glowing hoops to fly through), a **comet** going round the Sun with its tail always pointing away from the Sun (and a spoken fact), and the **asteroid belt**, where sparkly **space crystals** float among the rocks to collect.
- **How it stays light:** a scaled solar system (hundreds of metres, not millions of km). The camera keeps its 600 m far plane: anything farther than 430 m is drawn pulled in to 430 m and shrunk in proportion, so it looks the same size (the skybox trick) and no huge distances reach the depth buffer. The asteroid belt is 32 sectors and only those near her are built (one painted mesh each, at most one new sector a frame). Everything out there is built in small slices during the blast-off and freed when she lands; the planet pictures are small canvas paintings made once.
- **☀️ The Sun** (new destination; `src/sun.js` and space.js): really a ball of super hot gas, so (clearly made-up, and the voice says so) magic golden platforms float above it, with a light floaty pull. Below: the slowly boiling surface (one small animated shader, soft and not too bright), giant pulsing prominences, rising embers, and the **Sunnies** (sunglasses!). Area 2: the **Sunspot Bounce Park** (six sunspot trampolines climbing up and down on golden pillars, floating discs, a secret super-bounce cloud with a hidden star, a twisty slide) and the **Solar Flare Coaster** (lift hill to 17 m, a big drop, a loop through a glowing flare arch, a camel hill; the car follows her round). Area 3: the **Solar Flare Launch Tower** (26 m: gentle mode with ▲ ▼, or the red button for BLAST mode), **Solar Wind Surfing** (a hoverboard on two glowing wind streams; ▲ ▼ switch streams; they split apart and join again; stars and rings), and the **Solar Light Lab** (a prism that makes a rainbow, a lamp that makes shadows long or short, a solar panel that spins a fan, ice that melts in the sunlight). All spoken, all pictures.
- **More of the family's pictures (planets):** the Moon's grey steps and its two crater blocks, the Mars canyon steps and mesa, and Pluto's inflatable pillars stand just behind her path now (she steps back onto them); Pluto's big trampoline stands back so its front roll no longer hides her feet; the Uranus Ice Palace balcony pillars stand back out of her path; the Uranus rink's top rail goes round the back only (the full loop crossed her path twice at knee height) and no fence post stands in her path.
- Fixed while testing: a landing from open space used the normal arrival code, which needs the rocket she left in; that rocket's place is freed while she is far away, so the landing failed. Open space now has its own landing. A tap on a map picture can never also press a button underneath.
- Tests (desktop, software rendering): `open-space` 23/23, `sun` 17/17; smoke: the rocket menu now has 12 pictures (+ 🌌 and the Sun). **Full smoke test: 345/345** (desktop, software rendering; it includes build 125's changes, so build 125 is shipped inside 126). Speed: see PERFORMANCE_LOG. Nothing here has been tried on an iPhone yet.

## Checkpoint: build 125 — fixes from the family's sixteen pictures
- **Barn:** the little door picture that floated high on the wall is gone; the barn has a real hayloft door with a white cross. Each door's white rail now slides with its door, so the animal that comes out never stands behind a rail left floating in the doorway. PAW still opens the barn.
- **Sled run (Frosty Peaks) and hill slide (Balloon Hills):** she used to slide down through empty air. Each now has a real chute along its path (a U-shaped trough with thickness, its floor exactly under her feet), on posts down to the ground: icy blue on the snow, pink on the hill.
- **Boats:** both boats sat on plain rounded boxes ("a slab on the water"); they have real hulls now (a curved, raised bow and a sloped stern) with a white rim.
- **Haystack:** the straw top hung off the side of the bales like a flat floating disc; it is a straw mound sitting on the top bale.
- **Playhouse:** the twisty tube slide came out through the brown toy chest; the chest stands beside the exit now. The little stage and the toy shelf stood over the Splash Pool; the stage is narrower and fits in the corner beside the pool, and the shelf is along the back wall past it.
- **Under the playhouse:** the pink heart sign that floated above the pet-maker's glass dome stands on a gold stalk on the dome; the machine's lever box stood inside the ring of stars and is moved just outside it (the smoke test's two lever taps follow it).
- **Lab Gardens:** trees grew through the greenhouse domes; no tree is planted inside a greenhouse now.
- **Moon (the family: "the character walks through the roller coaster platform"):** the station platform is solid underfoot; she steps up onto it.
- Checked on desktop: the shadow screen shows a dark shadow (the family's picture showed a colour turtle, from before build 123's fix). The fountain basin in one picture is not in the current game (the pictures were taken on an older version).

## Checkpoint: build 124 — drawing friends as round 3D toys, a walk-in Ferris wheel, no walking through steps
- The family asked for the drawing friends added by the other tool (builds 120–122) to be "actual 3D good characters". Twenty of them were flat paper cut-outs or balls with stick arms and line eyes; they are rebuilt as plush toys, keeping each drawing's own outline, colours, faces, ears, feet, names, homes, voices and play actions.
- **New `src/plush.js`:** `puff` turns a drawing's outline into a round pillowy body with exactly that silhouette (thin parts stay thin from the side) and a lighter tummy; `eye` makes shiny 3D eyes (white, big pupil, two sparkles, optional soft lid); `limb` makes chunky tapered arms, legs, ears and antennae with round mitten hands or bobbles; `boot`, `drawOn` (a smile or brow drawn on the round surface) and `blush`.
- **The nine doodle friends** (both pairs of twins, the pink bean, blue square, spiral eyes, orange big head, orange leaf): soft bodies in the drawing's crayon colour with a darker stitched seam, shiny eyes (the spiral eyes keep their spirals on white eye balls; the big orange friend's sleepy dashes became eyes with soft lids), chunky arms and legs with boots, floppy plush ears, loop feet and the sled as round runners, the frowns kept.
- **Keepsake friends** (green tuft, tall blue, big ears, flower): shiny eyes, chunky limbs, the flower's striped pot and the big-eared friend's bent ear are round instead of flat slabs; the tall friend is a light blue toy. **Marker friends** (blue, waving, long legs, teal, scribble): chunky arms, legs and antennae; the blue friend has shiny navy eyes. **Orange and green scribble friends:** shiny eyes inside the drawn loops, chunky legs with boots, bobble antennae, a tinted body.
- Still one painted mesh per creature with the shared material: no new draw calls and no new shader. Shapes went from 1,170–2,520 to 1,430–3,800 triangles (trimmed after the first version measured up to 5,240).
- **Ferris wheel (the family asked: she should really get into each car):** the cars are open now (floor, back wall, side windows, a low front rail, corner posts, roof) and big enough for her to stand in; the wheel stands a metre higher so the bottom car reaches the ground. Pressing the wheel turns the nearest car down to the ground and stops; she walks over and hops in, rides all the way round, and the wheel stops again for her to hop out. JUMP near the ground steps out; higher up the wheel hurries her car down (it used to drop her from the sky). The cars hang in front of the rim on a pin, never through it.
- **Things she walked through (the family: "solid appearing objects that the character walks through"):** a new desktop scan casts rays across her path every half metre along all of Earth. Every climbing set stood half in her path: the Balloon Hills wooden steps, the Frosty Peaks ice steps, the farm hay bales, the pier crates, the trail's climbing rocks and the Toy Town giant blocks. They stand just behind her path now (she walks in front of them) and she steps back onto them as she climbs (platform depth), with the telescope, slide mat, sled and paper plane moved with them. Five push buttons (rocket, fountains, light mixing, block tower) moved back too. The other hits were intentional (gems she collects, the ball pit she falls into, stepping stumps).
- **Floating activities removed (the family: "Dawson never uses them and they are plain and boring"):** the seven learning spots along the main street (a glowing pad with a toy floating above it) are gone, with their paw targets. The family then showed which screens they meant: the learning-game screens (a big 3D toy with two or four choices, and plain white cards on the iPhone). Nothing opens them now. Five quests used them; their steps are now places in the world (rainbow: Art Plaza; little gardener: Lab Gardens and the farm seed patch; toy train trip: ride to Toy Town; wonder gardener: the science lab and Lab Gardens; a home for a friend: woods and the cushion). Quest rewards are worked out from the steps each time the game loads, so each changed quest keeps its old steps (`was`): a quest already finished with the learning games stays finished and keeps its reward. The old `learn_*` events stay valid in saved games. The game code in `learn.js` is still there (and still tested) but nothing reaches it; it can be deleted in a later build.
- The leaf friend got a round hip where its long legs join the body, so tapping the middle of the friend touches it (the full smoke test caught a tap there slipping between the legs and reaching the craft bear behind), and small dark centres in its pupils (its light ochre crayon left the eyes looking blank).
- **Unit tests for the drawing friends** (`doodle-`, `keepsake-`, `marker-friends.test.mjs`): every identity check is kept (silhouettes, the twins' differences, smiles, frowns, curls, triangle marks, spiral eyes, ears, budgets of 3,000 and 3,500 triangles). The friends were fitted to them: the mouths, marks and pupils are drawn in each drawing's exact crayon colour and at its original places, and the shapes were trimmed to the budgets. Only the three "pale unfilled paper" checks changed, because that look is what the family asked to replace: they now check that the body is soft toy fabric in a lighter shade of the drawing's own crayon. The tests also caught that the puffed bodies' fronts faced inward (the camera saw the inside of the back half); fixed.
- Desktop (software rendering) checks: close-up pictures from three sides of all twenty friends; Ferris wheel boarding pictures; pictures of every moved set; a ray scan of all nine planets found nothing in her path (pictures of the Moon, Mars and Jupiter agree); toy-glider, trail-zip and world regressions pass; native unit tests 130/130 (including the saved-quest tests), the learning contracts (41 activities) and `adventure-regressions` pass; `adventures-browser` stops at its map-picture check (`.mpT svg`), which fails on build 123 too (a pre-existing test problem, noted in NEXT_TASKS); new smoke checks (boarding the wheel, standing on the car floor, JUMP steps out, no learning spots left). **Full smoke test: 345/345** (desktop, software rendering). Speed: see PERFORMANCE_LOG (no slower). Not yet seen on the iPhone.

## Checkpoint: build 123 — fixes from the family's iPhone pictures (on top of the 3D overhaul, builds 120–122)
- **Pets:** on a ride (Ferris wheel, carousel, zip line, paper plane...) they wait on the ground and run after her when she gets off; when she jumps they stay where she last stood (they used to float in the air beside or under her).
- **Zip line:** her hands are on the handle (it hung a metre above her head); the stars moved to match.
- **Shadow screen (Lab Gardens):** the shadows are dark on the iPhone too (Safari ignores canvas filters, so it showed colour pictures).
- **Train stops:** the platform stands beside the track with one yellow edge line (the pink and yellow tiles lay over the rail and looked like a keyboard).
- **Seesaw (Toy Town):** stands behind the path, so she walks past it instead of through the plank; she steps back onto it to ride.
- **Magnet crane:** the magnet hangs on a rope.
- **Dottie the dinosaur:** the "me" learning corner (a floating toy) stood where she lowers her head and stuck out of her neck; moved to x 393.6.
- **Meadow:** the two picture signs high above the block wall and the colouring board are gone (one showed behind the top buttons like a broken button).
- The Ferris wheel fix written first (rod, canopy, open basket) was dropped: the overhaul (builds 120–122, PR #104) had already rebuilt the wheel and its gondolas, and its version is kept.
- Tests (desktop, software rendering): `trail-zip` (its speed check now compares the ride's own speed; the old one measured wall-clock time at 1–2 frames a second): all passed. Speed: see PERFORMANCE_LOG. **Full smoke test: 342/342** (the first two runs: 341/342 — console warnings from the overhaul's scenery code giving plain materials sheen and clearcoat, removed; then the desktop ReadPixels driver note in a longer form the test's filter missed, filter widened for that ending only). Not tried on an iPhone.
- Still to look at (asked the family): which learning game showed plain white cards on the iPhone (every game shows its pictures on desktop); the little door high on the barn; the 3D learning pictures follow the world's adaptive sharpness (blocky letters on a busy phone).

## Checkpoint: build 122 — thirty further family creations, forty-six additions together
- **The next thirty creations are real 3D world friends:** decorated animals, Dad Duck, ponies, three separately colored bees, a friendly shark, and separate pumpkin/ghost figures. Three exact photo reuploads share one character each; twenty-seven unique later photos yield thirty principal figures. Both confirmed pairs of twins from build 121 remain separate, and the original seven drawing friends keep their homes.
- Six new residents live on Earth; three each live in the expanded areas of the Moon, Mercury, Mars, Venus, Saturn, Uranus, Neptune and Pluto. Jupiter's busy playground has no added residents. Planet homes build through `PLANET_EXTRA.sections`, use whole-planet offsets, and free their taps/updates with the planet. One home manifest supplies placement, registry destination, verification and the parent guide.
- Each added resident is one cached painted mesh using the existing material, no image/texture and no shadow pass. Models range from 1,296 to 3,280 triangles. Their existing-system greetings, dances, songs, bounces, hugs and sparkles need no new animation timers or user menus. Original photos stay outside the repository.
- **Desktop software-rendering verification so far:** 128/128 native checks, learning contracts (41 activities), both world regressions, all thirty actual touch/PAW/greeting/reaction checks, and the complete cleanup/revisit/shared-resource/choice/save/reload tour pass. All forty-six additions have been visually compared with their references. Review fixed the cup/wing join, two neck joins, dragon cheeks and clear inspection portraits; normal world captures retain the player.
- A Playwright locator tap stalled during input processing on a character that had already passed. The diagnostic used the same actual touchscreen route as model taps, checked `elementFromPoint` to ensure the paw really receives the touch, and retained the strict activity assertion; both the targeted check and complete thirty-character tour pass. No gameplay workaround was added.
- **Full desktop gameplay suite: passed on GitHub Actions** (`full-gameplay`, 60m 13s, Chromium/SwiftShader software rendering on a hosted Ubuntu runner), on the commit before the benchmark and documentation commits, which change no game code. The build-120 versus build-122 performance audit runs as the opt-in `performance-audit` job over all forty-six homes, with matched shown/hidden rounds in one unchanged scene and area-entry shader audits. No physical iPhone result is claimed. `FAMILY_FRIENDS.md` locates all fifty-three family friends, including the original seven. `3D_build122_index.html` preserves the preceding build-121 checkpoint.

## Checkpoint: build 121 — sixteen more family creations, including two pairs of twins
- All sixteen references become solid painted world residents: nine paper figures, the snow sculpture, yellow balloon, chalk person and the remaining asymmetric drawings. The two pink-paper figures and two brown long-eared figures are **separate twins**, as the family confirmed; both pairs live beside the Adventure Trail bridge.
- Each resident uses one cached merged mesh, shared paint, no texture and no shadow pass, with an existing dance, bounce, song, hug or sparkle reaction. Homes stream with nine Earth districts. The original seven friends, player choices and pets stay intact. `FAMILY_FRIENDS.md` gives their landmarks and rendered close-ups; original photos remain outside the repository.
- Desktop software-rendering verification: **90/90 native checks**, learning contracts (41 activities), both world regressions, and all sixteen actual touch/PAW/greeting/movement checks pass. The focused tour also passes unload/revisit, shader reuse, unchanged choices, saved progress and reload. Render review corrected the snow figure's connected blocky hat/arms and raised the Big-Eared Friend's inspection camera above a foreground crab's party hat.
- The test originally stood closer to the train station than the pink twin, so its approach now comes from the twin side. The save check also now preserves newly collected gems: the tour legitimately collects g8, and verifies the complete pre-reload gem list survives reload while retaining all earlier gems.
- This is the first source checkpoint of the family's queued batch. Full gameplay and before/after performance verification will cover the combined build 122 before its PR is marked ready. No physical iPhone result is claimed.

## Checkpoint: build 120 — seven of her own drawings come to life
- **Two chalk drawings and five marker drawings are now world residents:** Pink Chalk Friend twirls in Art Plaza;
  Green Chalk Friend plays copycat in Toy Town; Blue Drawing Friend sings at Sunny Seaside; Waving Drawing Friend
  waves and twirls on Happy Farm; Long-Legged Drawing Friend gives a gentle hug on Balloon Hills; Teal Drawing Friend
  jumps in Frosty Peaks; Scribble Drawing Friend makes colorful sparkles in Lab Gardens. They greet her nearby, turn
  toward her and respond to screen taps and the big paw. Descriptive names are temporary; the daughter has not named
  the first two yet. Their unusual eyes, teeth, tails, limbs, fingers, tummy doodle and pink whiskers are real geometry.
- **Same world-creature system, no new avatar or pet entries:** two focused model modules feed `planet-life.js`'s
  existing one-mesh/shared-paint batching and speech/reactions; each is owned, streamed and freed by its district.
  Green's copying stays within 1.2 m of home, clear of Toy Town's tower; Mo retains his original copying range. No
  save-format changes, new shader features, image downloads, paid services or new per-frame subsystem. Private source
  photographs stay outside the public repository. Build 119 is preserved in the pre-change build-120 backup.
- **Drawing and geometry review:** fixed the green creature's detached extra feet, open base tip and buried mouth;
  preserved its single curved base and placed the smile on the snout. Connected the waving friend's palm/feet.
  Actual-geometry raycasts check face visibility. All seven close-ups were inspected against the drawings. Two
  independent reviews found no blocking source/lifecycle/save issues.
- **Verified on desktop, software rendering:** 67/67 native checks, 41 learning contracts and both saved-world scene
  regressions passed. The focused real-game browser check passes all seven greetings, actual screen taps and paw
  actions, distinct movement, no collectible-pet panel, unloading/revisiting without duplicate residents/targets, shader
  reuse, unchanged player choices and saved progress after reload. Screenshots are included. Required native checks
  also exposed older missing ladder/knot/parachute toys and a missing Bézier method in the test fixture; fixed without
  weakening assertions. GitHub's native checks and build also passed.
- **Performance:** before/after measurements cover all seven homes and an unchanged park view; an additional same-scene
  farm check did not reproduce the unmatched-scene slowdown. Every shader creation was before the first area visit,
  with none on entering any of the seven areas. Exact timings, long-task observations and limits are in `PERFORMANCE_LOG.md` and
  the two build-120 JSON reports. No physical iPhone results are claimed.
- **Full smoke: 250/250 passed**, run alone in desktop Chromium/SwiftShader, including all fourteen new-resident checks
  and zero console errors/warnings. Its first run passed the new-resident checks but the old fixed 700 ms slide hold
  stopped at x=23.1, before the unchanged
  x>23.2 ride trigger. The test now uses its existing bounded, real-touch `holdUntil` helper and keeps both slide-start
  and original landing assertions. A focused real-touch retest passes start and landing (x=32.2, y=0); no game code
  changed for this automation timing correction.

## Checkpoint: build 119 — Toy Town's paper-plane glider
- **THE PAPER-PLANE GLIDER** (`ATTRACTIONS.md` row 5, Earth: the second district): at the end of Toy Town, four giant toy blocks make stairs (3.2 m wide each: one easy hop to the next); at the top she taps the big paper plane and glides back over the town. **▲ pulls up (slower), ▼ dives (faster)**, nothing held is a gentle glide down; six stars at different heights ("All six stars!"); she lands softly wherever the glide ends (the musical floor if she stays up long enough), or **JUMP hops off** and she floats down. A different kind of ride from the zip line: she chooses her own height and path.
- Tests (desktop, software rendering): `toy-glider` (new): she climbs the four blocks one hop at a time; tapping the plane starts the flight; ▲ climbs and slows, ▼ dives and speeds up; she lands in Toy Town; JUMP hops off and she floats down: all passed. (A first version had 2.2 m blocks; at the test's low frame rate a hop flew past the first block, so they were made as wide as the lookout rocks.) Shader programs after walking Toy Town: 147 in builds 118 and 119. Speed: see PERFORMANCE_LOG. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 118 — the Adventure Trail zip line (the Earth audit begins)
- **THE ZIP LINE** (`ATTRACTIONS.md` row 5, Earth: the first district brought up to standard): from the top lookout rock she jumps up onto a new wooden tower (one rock-step higher), grabs the red handle and rides a 40 m cable down over the treasure chests to a soft landing mat. **Hold ▶ to zoom, ◀ to slow down** (it never stops); **▲ lifts her legs for the high stars, ▼ stretches down for the low ones** (five stars, high and low in turn: she has to steer to catch them all; "All five stars!"); **JUMP lets go** and she floats down gently.
- Earth places can now use the arrow pad as a joystick (`api.stick`, the same as the planet rides), and a ride steered with the arrows (`ride.stick`) is not ended by ▲ (on Earth, ▲ used to mean "jump", which let go of the handle; found by the new test).
- The audit of the other districts: Toy Town has six activities (musical floor, block tower, bounce park, ball cannon, seesaw, balloons); the Adventure Trail had the fewest (a stream, the lookout rocks, three chests, the crystal cave) and no ride, so it came first.
- Tests (desktop, software rendering): `trail-zip` (new): she can jump from the lookout rock onto the tower; the handle starts the ride; ▶ is faster than ◀; ▲ steers and does not let go; the ride ends on the mat past the chests; JUMP lets go and she never falls faster than 3 m/s: all passed. Shader programs after walking the trail: 147 in builds 117 and 118 (a first version drew the stars as one instanced mesh and made one new shader, so they use the shared paint now). Speed: see PERFORMANCE_LOG. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 117 — living creatures and pets on Earth; lighter creature shapes; shared paint kept
- **THE WHISPERING WOODS ARE ALIVE** (the tenth and last destination of `CREATURES.md`): **Puffy**, a dandelion puffball who blows wishing seeds; **Shroomy**, a bouncing mushroom (tap: bounce high together); **Twiggy**, a little walking tree stump who makes flowers bloom around her. **Pets:** Prickles (a hedgehog), Dewey (a fawn), Dotty (a ladybug), Bandit (a raccoon kit), Splashy (an otter pup) in the woods, and **Sparkle**, a unicorn foal, on Balloon Hills. Built with the woods (and the hills) as she walks near, and freed with them; beside the existing Earth pals (Rusty the fox and the others).
- The creature system now works in Earth's places too (`lifeHere` in `expansion.js` gives a district's kit to `populate`); the 🐾 sheet has 60 pictures; Earth pets say "tap them" instead of "fly there in the rocket".
- **Lighter creature shapes (all planets):** small balls use fewer triangles and tiny details (eyes, spots) far fewer: the same look (pictures compared), 40–70 % fewer triangles a creature (Puffy 3,588 → 1,106).
- **Shared paint kept (an older problem found while doing this):** when she walked away from an Earth place, the game freed the shared paint used by many things (bridge, rocket, creatures), so it had to be rebuilt on the way back. Now shared paint and shared shapes are kept.
- First version measured slower where three woods creatures were on screen at once, so they are now 15 m apart (at most two in view) and Sparkle moved to the hills.
- Tests (desktop, software rendering): `earth-life`: all eight in the woods; Shroomy bounces; Sparkle on Balloon Hills, befriended with 🍓, follows her through the woods and to the park; walking far away and back rebuilds the woods with no doubles and no errors: all passed. Speed (Earth, builds 116 and 117, 22 samples per spot): woods −160 668.5 → 669.5 ms, −185 615 → 588, −211 573.5 → 581.5, −240 621 → 627, −255 634 → 649 (one or two more draw calls; each spot spreads ±50 ms between runs); Balloon Hills −740 234.5 → 236, −748 237 → 237.5, −756 239.5 → 236.5. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 116 — living creatures and pets on Pluto
- **PLUTO IS ALIVE** (the ninth destination of `CREATURES.md`): **Snowy**, a snowball kid who lobs a soft snowball at her ("Splat! Hee hee!"); **Lovey**, a little heart sprite who sends her hearts with a heartbeat; **Dot**, a tiny Charon moon who dances round and round her (Pluto and Charon dance around each other). **Pets** (frost fluffs and snowball pups): Fuzzy (a bouncing frost fluff), Snowball (a snow puppy with a blue collar), Cuddles (a bunny with a pink heart), Nibbles (an ice hamster), Nutty (an ice squirrel), Yaki (a fluffy baby yak). Seven near the landing (none on the ice-slide plain), two at the far end.
- The 🐾 pet-picture sheet grew to 54 pictures.
- Tests (desktop, software rendering): `pluto-life`: all nine there; Dot dances round her; Cuddles befriended with ✋ follows her on Pluto and home: all passed. Speed (Pluto, builds 115 and 116, eight rounds; spots +30, +60, +95, +320 added): +60 163.5 → 166.5 ms, +95 155.5 → 158.5, +199 181 → 183, +320 183 → 189.5 (two more draw calls where the far-end pets are in view); +30 is the landing spot (185–590 ms), not compared. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 115 — living creatures and pets on Neptune
- **NEPTUNE IS ALIVE** (the eighth destination of `CREATURES.md`): **Whirly**, a little whirlwind of blue rings who whirls the wind around her; **Bloop**, a big glowing jellyfish who flashes five colours with rising notes; **Echo**, a whale calf who sings a low whale song and then blows a spout. **Pets** (glowing blue floaters and friends): Glowbe (a glowing orb with little moons), Drifty (a small blue jellyfish), Breezy (a wind puppy with blown-back ears), Swish (a little sea dragon), Ripple (a wave bunny), Misty (a storm kitten with a lightning-yellow tail tip). Seven near the landing (none at the windsock or the icy geyser), two at the far end.
- Tests (desktop, software rendering): `neptune-life`: all nine there; Whirly whirls; Breezy befriended with ⚽ follows her on Neptune and home: all passed. Speed (Neptune, builds 114 and 115, eight rounds; spots +60, +95, +320 added): +95 177 → 182 ms (three creatures in view, four more draw calls), +150 174.5 → 173.5, +186 165.5 → 165, +320 130 → 133.5 (two more draw calls); +60 is the landing spot (160–560 ms), not compared. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 114 — living creatures and pets on Uranus
- **URANUS IS ALIVE** (the seventh destination of `CREATURES.md`): **Frosty**, a frost sprite who makes it snow around her when tapped; **Skatey**, an ice skater who twirls on the ice and then plays catch-me; **Brrr**, a shivery snowman who wobbles, sniffs and goes "ACHOO!" in a puff of snow. **Pets:** Flurry (an ice puppy), Flake (a floating snowflake), Polar (a polar bear cub), Slider (a baby penguin who slides on his tummy), Mitten (a seal pup), Tinsel (an icy firefly). Seven near the landing, about 15 m apart, two at the far end.
- Tests (desktop, software rendering): `uranus-life`: all nine there; Skatey twirls; Polar befriended with 🤗 follows her on Uranus and home: all passed. Speed (Uranus, builds 113 and 114, four rounds; spots +95, +185, +270, +320): +95 144 → 149 ms, +185 190 → 189.5, +270 156.5 → 156.75, +320 123 → 129 (two to four more draw calls where creatures are in view; +60 is the landing spot, 210–560 ms, not compared). **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 113 — living creatures and pets on Saturn
- **SATURN IS ALIVE** (the sixth destination of `CREATURES.md`): **Ringo**, a ring dancer who spins his hula hoop and dances (a twirl and a note) each time she jumps near him; **Shimmer**, a star sprite who sends a shooting star across the sky ("Make a wish!"); **Zoomer**, a little racer who plays catch-me. **Pets:** Halo (a puppy with a golden ring), Streak (a comet fox kit), Starla (a sky starfish), Chip (an ice-block kitten from the rings), Loop (a bird with a ring tail), Gem (a mouse with jewel ears). Seven near the landing, two at the far end.
- Tests (desktop, software rendering): `saturn-life`: all nine there; Ringo dances; Halo befriended with ✋ follows her on Saturn and home: all passed. Speed (Saturn, builds 112 and 113, four rounds; spots +60, +95, +320 added): +95 169 → 171 ms, +150 163 → 162, +240 143 → 139, +320 131 → 135 (two to four more draw calls where creatures are in view; +60 is the landing spot, 170–540 ms, not compared). **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 112 — living creatures and pets on Jupiter
- **JUPITER IS ALIVE** (the fifth destination of `CREATURES.md`): **Zappy**, a storm sprite (tap: a little lightning flash and a friendly rumble); **Swirly**, a red-spot swirl who spins round and round; **Big Puff**, a huge gentle cloud who floats over and gives her a puffy hug. **Pets:** Bobble (a balloon puppy), Wobble (a floating jelly), Bolt (a thunder chick), Nimbo (a cloud bear cub), Kite (a kite creature), Gusty (a wind bunny). Seven near the landing, two at the far end: none in the busy Sky Playground (Jupiter is the heaviest planet to draw).
- Tests (desktop, software rendering): `jupiter-life`: all nine there; Swirly spins; Bolt befriended with 🍓 follows her on Jupiter and home: all passed. Speed (Jupiter, four rounds each of build 111, build 112 and build 112 without the creatures): +60 223 / 223 / 213 ms, +90 215 / 221 / 226 (three creatures in view, four more draw calls), +150 206 / 211 / 218, +205 194 / 201 / 203, +320 149 / 167 / 173; the copy without creatures moves as much as build 112 at the places with no creature, so those differences are the measurement's drift; the creatures' own cost is about 5 ms where three are in view. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 111 — the big buttons out of the way; a clear microphone button
- **🏁, 🫧 and 💥 (the family's report):** the 🏁 (off the coaster) and the 🫧 (blow a bubble) sat at the top right, over ⚙️ and 🔊 when the top buttons wrap onto several rows on a phone. Now they (and the 💥 that pops your own bubble) sit in the bottom row, just left of 🐾, placed from where 🐾 really is (and again when the screen turns). Only one shows at a time (no 🫧 while riding; 💥 replaces 🫧 while she is in a bubble). The 💥 is the 🫧's size (bigger, it touched the adventure tab on small phones).
- **Talking:** the family's picture showed the voice button as 🔇: her own microphone was switched off, so her friend could not hear her (one tap turns it on). That speaker looked like "sound off". Now the button always shows 🎤, with a red line through it when the microphone is off, and the spoken message says so; if a friend talks while her microphone is off, a voice reminds her to tap 🎤 (at most once a minute). Between phones that are not on the same Wi-Fi, calls also need a relay (TURN) server, which the game does not have yet (`VOICE_CONFIG.turn` is empty): asked the family.
- Tests (desktop, software rendering): `buttons-layout` (new): on three phone sizes in a room, 🫧, 🏁 and 💥 are on screen and overlap no other visible button; the voice button shows 🎤: all passed. `bubbles-together` all passed. `voicechat`: 34/34 on build 111 in a quiet run; its sound-level checks (they sample a once-a-second test beep) sometimes miss it on any build (build 110 also failed two of them once), noted in NEXT_TASKS. **Full smoke test: 236/236.** Not tried on an iPhone.
- **Found by the full test and fixed:** the pet-friendship panel (✋ 🤗 🍓 ⚽) stayed open if she walked away, and a closed panel slid off the bottom of the screen but still caught taps: it covered the 🏁 in its new place. Now it sits above the bottom buttons, closes by itself (walking away, a ride, flying off, or after 12 s), and a closed panel lets every tap through. Speed (Earth, builds 110 and 111, both orders): park 12.2 → 11.8 ms of script, creatures 10.1 → 9.3, castle 12.2 → 14.1 (each spreads several ms; the change is buttons and styles only); 115 shader programs in both.

## Checkpoint: build 110 — living creatures and pets on Venus
- **VENUS IS ALIVE** (the fourth destination of `CREATURES.md`): **Nimbus**, a cloud person: tap for a sparkly shower and then a rainbow; **Puffo**, a mist creature who plays peekaboo (vanishes in a puff and pops up a few steps away, "Here I am!"); **Coral**, a sunset singer (five notes). **Pets:** Fluff (a mist lamb), Flutter (a sunset butterfly), Wisp (a cloud kitten), Bubbles (an air fish), Drip (a dewdrop), Puffin (a round sky-bird). Seven near the landing, about 15 m apart, two past the log ride.
- Tests (desktop, software rendering): `venus-life`: all nine there; Puffo hides and pops up elsewhere; Drip befriended with 🤗 follows her on Venus and home: all passed. Speed (Venus, builds 109 and 110, both orders; spots +60, +100, +270 added where the creatures are): +60 142 → 148 ms, +100 123 → 117, +160 168 → 168, +270 116 → 114 (each spot spreads about 30 ms; two to four more draw calls where creatures are in view). **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 109 — living creatures and pets on Mercury
- **MERCURY IS ALIVE** (the third destination of `CREATURES.md`): **Mo**, a shiny mirror creature: tap him and he copies her (she walks one way, he walks the other like a mirror, and he jumps when she jumps); **Sunny**, a sun-flower sprite who spins and shines; **Pip-Pebble**, a pebble person who makes a trail of stepping stones sparkle with rising notes. **Pets:** Cinder (a warm ember puff), Quartz (a crystal kitten), Glow (a glowing pebble), Flicker (a fire beetle), Sparky (a comet mouse), Blink (a lantern owl). Seven near the landing, spread about 15 m apart, and two on the open ground before the funhouse (a first placement, 12 m apart, put three in view at once and was measured slower).
- Tests (desktop, software rendering): `mercury-life`: all nine there; Mo copies her; Sunny spins; Quartz befriended with ✋ follows her on Mercury and home to Earth: all passed. Speed (Mercury, builds 108 and 109, both orders): +60 137 → 129 ms, +100 114 → 118 (two creatures in view, three or four more draw calls), +150 167 → 172 (no creature there: the measurement's own spread), +180 136 → 136. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 108 — living creatures and pets on Mars
- **MARS IS ALIVE** (the second destination of `CREATURES.md`): **Dusty**, a dust sprite who spins a little dust twirl when tapped; **Bongo**, a rock drummer: tap him and he plays a beat, then drums along each time she jumps near him; **Chime**, a crystal kid who sings four notes with coloured sparkles. **Pets:** Sandy (a big-eared dune hopper), Ruby (a puppy with a red crystal back), Pebbles (a turtle with a gem shell), Ember (a glowing beetle), Dusk (a moth), Wiggles (a sand worm). Built with each area of Mars as she walks, and freed with it.
- Befriended like the Moon pets (✋ 🤗 🍓 ⚽); they join 🐾 with real pictures and follow her everywhere.
- **Speed:** the creatures no longer cast shadows (their shadow pass cost a few milliseconds where one stood in view; measured). The Moon's creatures too.
- Tests (desktop, software rendering): `mars-life`: all nine there; Dusty spins; Bongo drums along when she jumps; Sandy befriended with ⚽ follows her on Mars and home to Earth: all passed. `moon-life` again: all passed. Speed (Mars, builds 107 and 108, both orders): +125 144 → 133 ms, +140 138 → 136, +221 132 → 131, +276 119 → 119 (one more draw call where a creature is in view). **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 107 — the lag fix (a memory leak), living creatures and pets on the Moon; pets come along everywhere
- **THE LAG (the family's report, "very laggy"):** a creature that was put away was taken out of the scene but never freed: her old friend after switching friends (which the dress-up menu invites), the models drawn for the 👗 pictures, and a friend's model in Play Together. Their shapes, their pictures and their bone textures stayed on the graphics chip for the whole game. Measured (desktop): three rounds through the friends left +51 shapes and +44 textures behind, every round more. Now they are freed (`src/dispose.js`), a moment after the new one is drawn (no shader is rebuilt, no pause); shared things (eye and mouth shapes, eye pictures, accessory and pet shapes) are kept. After the fix the same three rounds leave nothing behind (shapes 1,332 → 1,332, textures 114 → 114). Trips between planets were checked too: memory goes back down at home (one texture per trip, the rocket). Desktop frame times had not changed between builds 102 and 106, so the slowdown on the phone came from this growing memory, not from a slower frame. Not yet confirmed on the iPhone.
- **THE MOON IS ALIVE** (the first destination of `CREATURES.md`): three characters and six pets, each its own shape and way of moving, built with the Moon and freed with it.
  - **Rocky**, a rolling moon rock: tap him and he plays catch-me (rolls away, giggling). **Lumi**, a little lantern sprite: tap her and she lights up the stars and floats off to show you a hidden pet. **Boing**, a spring hopper: tap him and he bounces high ("jump with me!").
  - **Pets:** Moonpup (a glowing moon puppy), Hopscotch (a crater hopper), Stardrop (a floating star), Dustbun (a fluffy dust bunny), Orbit (a little planet with a ring of moons), Glimmer Snail (a snail with a glowing shell).
  - Every creature breathes, wanders near its home, turns to look at her, waves and says hello when she comes close, and wiggles and hops when tapped.
- **MAKING FRIENDS:** tap a pet: four big picture buttons (✋ pat, 🤗 hug, 🍓 treat, ⚽ play, and ✖ not now). One happy moment, a burst of hearts, and the pet is hers for good (saved).
- **🐾 FRIENDS:** the planet pets join the Earth pals in the 🐾 panel with real pictures made from their shapes (`tools/make-pet-pictures.cjs`); pets still to find are silhouettes. At most four friends follow at once (tap one to send it home, another to bring it).
- **PETS COME ALONG EVERYWHERE:** her following friends, the Earth pals too, now ride in the rocket and walk beside her on every planet (before, they waited on Earth). After a reload they are still hers, and a befriended pet is not waiting on its planet a second time.
- Cheap: one draw call per creature, the shared painted material (no new shader), light shapes (about 150 triangles a ball); only creatures within 45 m move.
- Tests (desktop, software rendering): `moon-life`: all nine creatures there; tap Rocky (he rolls away); Moonpup befriended with 🤗 and following on the Moon and home on Earth; 🐾 shows its picture and silhouettes; reload keeps it (and no second Moonpup); four at most: all passed. Speed (builds 106 and 107, both orders): Moon +30 130 → 127 ms, +50 126 → 121, +79 126 → 122 (one or two more draw calls where creatures are in view); Earth the same, with less memory. Also passed with the fix: `dressup`, `dress-together`, `multiplayer` 20/20, `bubbles-together`. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 106 — magic bubbles in Play Together
- **🫧 BLOW A BUBBLE** (a big button, only in a room): your friend puffs, and a shimmering rainbow bubble floats to the nearest friend (aim assist: the nearest one in front, else the nearest; forgiving). It grows round them, lifts them about four heights into the air, swaying; they wiggle inside; they can steer it a little with ◀ ▶; a big 💥 (or JUMP) pops it at once, otherwise it pops by itself after about 6 seconds. POP: a burst of little bubbles and sparkles, a fall, a soft bounce, dizzy stars and a cheer. Everyone in the room sees the same thing.
- **Sync:** one event per bubble (`{ t: 'bubble', by, to }`) and `b: 1` in the trapped player's own state; the trapped player's own phone moves them, so the float, the pop, the fall and the landing travel as the positions that are sent anyway. Remote bubbles are drawn round the friend's model and pop when their flag goes.
- **Fair and safe:** a 3 s wait between bubbles; 8 s safe after landing; never on rides, in the rocket, indoors or under water; the 🫧 switch in the room panel turns bubbles off for that phone. The Firebase rules have the new event type and field (publish them once more; until then the database refuses bubbles and nothing else changes).
- **Cheap:** one shared sphere painted with rainbow colours and the shared see-through material (no new shader); at most 8 bubble meshes, reused; nothing runs outside a room.
- Fixed on the way (found in the pictures): the 💥 button first sat over the floating character (moved to the right); the camera first used the rocket's framing and lost her above it (now the normal camera follows her up).
- Tests (desktop, software rendering): `bubbles-together` (two browsers, 120 ms network delay): no 🫧 outside a room; both see 🫧 in the room; A's bubble traps B; B floats above 4 m and A sees B up there in the bubble; B's 💥 pops it, A sees the pop, B lands and walks on; B safe straight after; B traps A, whose bubble pops by itself, A lands; no bubbles on the train; the 🫧 switch: all passed. `multiplayer` 20/20, `shared` 7/7. Speed (Earth, `ba.cjs`, builds 105 and 106, four rounds each in both orders): script ms per frame park 11.1 → 11.4, creatures 9.4 → 8.5, castle 10.5 → 12.1 (each build ranges about 3 ms there); 115 shader programs in both; the same draw calls. The new code that runs every frame outside a room was timed on its own: 0.016 µs (bubbles) and 0.010 µs (the room update), so the castle difference is the measurement's own noise. **Full smoke test: 236/236.** Not tried on two real phones yet.

## Checkpoint: build 105 — a dress-up menu that makes sense, and the Moon coaster's tunnel and cave camera
- **THE DRESS-UP MENU, redone like a children's dress-up game (the family's request):**
  - every button shows a REAL PICTURE of the thing it puts on, made from that thing's own 3D model (`tools/make-accessory-pictures.cjs` → `src/accessory-pictures.js`, 84 KB, built into the game; nothing is drawn while she plays). Before, the bow and the bow tie had the same 🎀, and several pictures were emojis that did not match;
  - six picture shelves: hats and crowns, bows and headbands, glasses and goggles, necklaces and scarves, wings and capes, other things. A shelf shows only its own things, and only the ones that fit this friend; a shelf with nothing that fits is not shown (no greyed buttons);
  - one tap wears it at once (a sparkle on the friend and a happy sound); the card glows gold with a green ✔; a second tap takes it off; the red ✖ button takes everything off; the big green ✔ closes; saved for each friend;
  - surprises not found yet show their picture greyed with a 🎁; a tap says where to find it ("Find it on the Moon!");
  - her friend is shown close up on the free right side of the screen (the camera comes close, and nothing in the world between the camera and her friend is drawn while dressing); swipe there to turn her round; the walking buttons hide while dressing;
  - three pictures were improved after looking at them: the tiara has a sparkling crest of gems, the flower crown bigger flowers, the party hat slim stripes (it looked like a cake). These are the real models, so they look better worn too.
- **THE MOON COASTER'S TUNNEL AND CAVE (the family's report, "both tunnels"):** pictures taken all the way into and out of both found four faults, all fixed:
  - inside, the camera's position shared a scratch vector with the look-ahead point, so it flew to just in front of the train and showed walls and supports (no train);
  - going in, the camera trailed 11 m behind, outside the rock or above the ground while the train was already inside: now it waits at the opening and follows in;
  - coming out, the high camera came back while the train was still inside the stone mouth, and on the steep climb out of the cave the camera was lifted out through the wall: now it follows until the train is out, and closer on the climb;
  - the dark disc that makes each mouth look dark from outside stood in the camera's way: the camera now waits just past it (the train is out of sight for about 0.2 s as it goes into the rock, like going into a tunnel).
- Tests (desktop, software rendering): `dressup` redone thing by thing: all 23 pictures present and different; on all twelve friends every thing on every shelf shows its own picture, one tap wears exactly it on the right bone (and marks it), a second tap takes it off, a whole outfit is worn together and fits (hat above the eyes, glasses at the eyes, necklace below, nothing huge); the red button; surprises; reload; the layout on an iPhone, a small Android phone and an iPad (fits, buttons ≥ 48 px, her friend beside the panel and not hidden by anything); ✔ closes. `dress-together`; tunnel and cave pictures (into and out of both). Speed (builds 104 and 105, both orders): Earth park 13.8 → 12.8 ms of script per frame, creatures 11.0 → 11.5, castle 13.4 → 13.6, 115 shader programs in both; Moon (two runs each) +30 274 and 174 → 183 and 163 ms (the 274 is noise), +50 180 and 160 → 159 and 162, +79 178 and 161 → 160 and 161, the same draw calls (a first try that drew the mouth darkness as its own mesh cost one draw call there, so it was put back in the coaster's mesh). **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 104 — the Venus log ride together (Play Together)
- **The log holds two.** Standing at the log station when a friend sets off, you hop in behind them (or tap the log while it is out); you ride the whole flume together (the waterfall shortcut and the crystal cave too, wherever the friend steers) and get out together at the end. A friend who stays at the station sees the log carry its riders. While a friend has the log, tapping it says to wait and hop in next time (a voice line).
- **Nothing new is sent or stored:** a friend on the log is known from where they are (on the water channel) and their riding flag. No new database rules. Outside a room the new code does not run; riding alone, the log is exactly as before (one extra check when you tap it).
- Also fixed the Venus flume test's crystal-cave check: the course grew since build 93 and the test steered ◀ too late for the cave fork (it now steers right after the first fork). The game was fine (the cave fork is at 49 % of the ride).
- Tests (desktop, software rendering): `log-together` (two browsers, the relay with 120 ms of network delay): one room; both at the Venus log station; A sets off and B hops in behind; on the way B's log carries A (0.25 m) with B in the seat behind, and A sees B in the seat behind; they get out together; no page errors: all passed. `venus-flume` (riding alone: the long way round, steering and stars, the waterfall shortcut, the splash game, the crystal cave): all passed.
- Speed (Venus, `pplanet.cjs`, builds 103 and 104, four rounds each in both orders): +160 216 → 218 ms, +190 221 → 226 (each build spreads about 15 ms there); the same draw calls. (+131, the first spot after landing, varies 291–625 and is not compared.) **Full smoke test: 236/236.** Not tried on two real phones yet.

## Checkpoint: build 103 — riding the Earth train together (Play Together)
- **The train is one shared train in a room.** When a friend gets on and drives (picks a station), every other screen moves its own train to the driver's seat, so it is the same train everywhere. Friends at the station tap the train (or its station) to hop on as PASSENGERS, in their own seats behind the driver (up to three); a passenger's tap while it is moving says "wait for the train to stop" (a picture voice line). Each one sees the others in their seats. When the driver gets off, the passengers get off with them at the same station.
- **Nothing new is sent or stored:** a friend on the train is known from what the room already carries (the riding flag, the train's height and track). No new database rules. Outside a room the new code does not run (the room update stops at its first line); in single-player the train has one extra check per frame.
- Tests (desktop, software rendering): `train-together` (two browsers, the relay with 120 ms of network delay): one room; A gets on and B's train follows A; B hops on in the seat behind; on the way B rides in its seat on the same train (on B's screen the train is where A is) and A sees B snapped into the seat behind; both get off at the 🌈 station; no page errors: all passed. The two test pages run at 1–2 fps a second apart, so the check compares each screen with itself in one frame.
- Speed (Earth, `ba.cjs`, builds 102 and 103, four rounds each, both orders): script ms per frame park 14.4 → 15.6, creatures 10.3 → 10.3, castle 14.2 → 14.6 (both builds range 12.8–17.4 in the park); 115 shader programs in both; the same draw calls. **Full smoke test: 236/236.** Not tried on two real phones yet.

## Checkpoint: build 102 — four more friends (twelve in all)
- **GLIMMER** a soft lavender crystal friend with glowing crystal shards on its head and back; **POMPOM** a round fluffy ball on big floppy feet with a tuft on top (bounces everywhere); **BIBBLE** a tall bean with huge round dish ears and curly antennae (waddles, ears flapping); **COSMO** a tiny deep-blue cosmic friend painted with stars and a swirl, with a gold planet ring round its middle. Each has its fitting points for dress-up.
- Tried and dropped: sculpting new friends in the background workers. It made each new friend's picture take 5–11 s to draw instead of about 1 s (measured), so the pictures are drawn one per frame as in build 101.
- Tests (desktop, software rendering): `dressup` on all twelve friends (every slot on the right bone, hats above the eyes, glasses at the eyes, 🧺, reload, surprises): all passed, with pictures. Speed (Moon, builds 101 and 102 alternately): +30 204 → 207 ms, +50 176 → 176, +79 170 → 168, the same draw calls. **Full smoke test: 236/236.** Not tried on an iPhone.

## Checkpoint: build 101 — dress-up and four new friends
- **DRESS-UP (👗):** big picture buttons only. Pick a friend; then 🎩 head, 👓 face, 🧣 neck, 🦋 back; one tap wears a thing, another tap takes it off; 🧺 takes everything off; swipe on the right to turn her round. Saved for each friend separately (and kept after a reload: the save loader checks every item).
  - 22 things to wear: crown, tiara, bow, party hat, flower crown, top hat, star headband, unicorn horn, space helmet; sunglasses, heart glasses, star glasses, round glasses, goggles, a mask; scarf, pearl necklace, bow tie, medal; butterfly wings, cape, backpack, rocket pack.
  - Five are SURPRISES found on planets (wrapped 🎁 until then): the helmet on the Moon, the star headband on Saturn, the flower crown on Pluto, the wings on Neptune, the rocket pack on Mars.
  - Each friend has its own FITTING POINTS (a bone, a place, a size and a tilt for each slot), so a hat sits on each head and glasses on each pair of eyes, and everything moves with her (it hangs from her bones). A friend with no sensible place for a slot does not offer it (its picture is greyed).
  - Each thing is one small mesh with the game's shared material (one draw call each, only while worn; no new shader).
- **FOUR NEW FRIENDS**, sculpted in the same way as the first four, each with its own shape, face and movement: **Puffle** the little cloud (floats, dangling raindrop feet), **Luna** the moon (soft craters, a star on an antenna, a crescent tail, floaty hops), **Bloop** the rainbow gumdrop (squishes and bounces), **Zip** the comet (a long swept tail that streams behind, leans into its zooms). They are sculpted only when someone picks them or the dress-up pictures need them (one per frame, then kept).
- **Play Together:** friends see your friend and your outfit (a short code in your player state). Rooms whose rules are older than build 101 refuse the field: the game then simply stops sending it (nothing else breaks). `firebase-rules.json` has the new field.
- Tests (desktop, software rendering): `dressup` (all eight friends: every slot on the right bone, the hat above the eyes, the glasses within 2 cm of the eyes; 🧺; reload; surprises) all passed, with a picture of each friend dressed (`screenshots/dress-*.jpg`); `dress-together` (two browsers: B sees A as Bloop in a crown and sunglasses, and sees the glasses come off) all passed.
- **Full smoke test: 236/236.** Desktop speed (Moon, builds 100 and 101 alternately, four times each): +30 199 → 197 ms, +50 175 → 174, +79 173 → 177, the same draw calls (an earlier run that looked slower was taken while a build was running at the same time).
- Measured: opening the panel 6 ms; the first time, each new friend's picture costs one pause of about 0.6–0.85 s on this desktop while it is sculpted (once; then kept). Next: sculpt in a background worker so there is no pause at all.

## Checkpoint: build 100 — the Moon coaster fixed, the station near the rocket, and the first SHARED rides (Play Together)
- **The Moon coaster (the family's report):**
  - "Some parts view it from under the cart": a ride probe (every frame of the whole 4.7 km ride) found the camera below the cart in 242 of 2,471 frames on build 99 (in the loop-the-loops and inside the mountain tunnel). Fixed: inside the tunnel and cave the camera never looks up from under the cart, and the smoothed camera never drops below it. Build 100: 0 frames (closest 0.9 m above her). The full smoke test now checks it on every run.
  - "It goes through solid structures": the probe found the train never touches anything, but the tunnel and the cave were drawn from the inside only, so from outside the train dived straight into bare rock (the mountain) and bare ground (the cave). Fixed: stone TUNNEL MOUTHS with a dark opening at the four places the track goes in and comes out (screenshots before and after); the camera now follows the track down into the tunnel and the cave before the entrance.
  - THE STATION moved from x 206 to x 80 (the rocket is at x 8): the first straight was shortened by the same 126 m so the rest of the track is unchanged, the lift climbs 5.5 m more, and the way home sweeps round behind the activities. The offline course check passes (clear of itself by 5 m, clear of the ground and the activities, out of the mountain).
- **SHARED RIDES (Play Together), the first step of the multiplayer upgrade:**
  - A new part of the room, `live`: one small record per vehicle (pilot, boarding or going, the planet, the start time on the room's one clock) and one per player's seat; both disappear by themselves when their player disconnects. Both transports (Firebase and the test relay) carry it; the relay can add network delay for tests.
  - **The shared rocket:** climb into the same rocket, each in your own seat with your face in your own window; the first one in picks the planet; the others press ✋ ready; ONE countdown for everybody; every passenger flies, lands and climbs out together, side by side; friends on the pad watch it go; a seat that disconnects frees itself. `rocket-together` (two browsers, 120 ms delay each way): lift-off within 0.22 s, landing within 0.04 s, all passed.
  - **The Moon coaster together:** standing on the platform when a friend's train sets off, you hop on in the next seat; each sees the other in their seat on the same train; while you watch, your train follows your friends. `coaster-together` all passed.
  - `firebase-rules.json` has the new `live` rules (`MULTIPLAYER.md` explains). Until the family publishes them, shared rides do not appear and everything else in a room works as before. The existing `multiplayer` test: 20/20.
- **Pluto: THE PUFFY SQUISH MAZE** (`parks` checks it). Bug found and fixed: the prize counted if she had ever been past it; it now counts only when she walks in through the walls.
- **Full smoke test: 236/236** (with the new check: the camera never under the cart, over the whole ride).
- Desktop (software rendering) speed: Moon the same (see `PERFORMANCE_LOG.md`). Not tried on an iPhone or with live Firebase.

## Checkpoint: build 99 — rotating mirror walls in the Mercury maze
- **Mercury mirror maze: TWO ROTATING MIRROR WALLS** on the ground route. They turn slowly round and round; while a wall faces her it blocks the way (a solid), then it turns side-on and she walks through. No timer: it opens again every few seconds, and a voice says to wait for the gap (`mercury-maze` all passed: blocked for a moment, then through both).
- Bug found and fixed before shipping: a wall counted as "passed" if she was ever to the right of it (for example after being moved there); it now counts only when she walks through it from the left.
- **Full smoke test: 236/236.**
- Desktop (software rendering) speed: Mercury maze spot 264 → 250 ms (4 runs each), +1 draw call (see `PERFORMANCE_LOG.md`). Not tried on an iPhone.

## Checkpoint: build 98 — a loop-the-loop on Saturn's outer ring
- **Saturn Ring Raceway: THE LOOP-THE-LOOP.** Near the end of the outer ring route, after its last star, the kart rides right round a glowing loop (with sparkles and a chime), then carries on round the ring (`saturn-rides` all passed: the outer route 3 times, 3 loops).
- **Full smoke test: 236/236.**
- Desktop (software rendering) speed: Saturn the same, draw calls unchanged (see `PERFORMANCE_LOG.md`). Not tried on an iPhone.

## Checkpoint: build 97 — the ice tunnel doors in the Uranus palace
- **Uranus Ice Palace: THE ICE TUNNEL DOORS.** Three round ice doors, each with its own picture: ❄️ on the palace ground floor, ⭐ upstairs, 🌙 out by the skating rink. Tap one: she dives into the ice tunnel (whoosh, sparkles, an echoing chime) and pops out of the next door (`parks`: ❄️ → ⭐ → 🌙 → ❄️, all passed).
- The game is seen from the side, so a tunnel behind the palace wall could not be seen; the tunnels are a short ride between doors instead of rooms to walk.
- **Full smoke test: 236/236.**
- Desktop (software rendering) speed: Uranus within the noise of build 96 (see `PERFORMANCE_LOG.md`). Not tried on an iPhone.

## Checkpoint: build 96 — the 📷 camera button on the sky dive
- **Neptune sky dive: THE 📷 PICTURE BUTTON.** It appears only during the sky dive (the joystick steers and JUMP opens the parachute, so the view needs its own button). Tap it for a HIGH VIEW looking down at her and the landing target; tap again (🔍) for the close view. It hides itself when the dive ends, however it ends (`control-rides` all passed).
- Found by the test and fixed: the first version only changed the view while falling (the waiting part of the ride returns early); the view is now set at the start of every ride step.
- **Full smoke test: 236/236.** Desktop speed: Neptune the same or slightly faster than build 95.
- Desktop (software rendering) only; not tried on an iPhone.

## Checkpoint: build 95 — the giant bungee tower
- **Neptune bungee: THE GIANT TOWER.** 10 m more on top (34 m) with its own red jumping board. On the top board, push ▲ to climb up to it; JUMP for a long fall (lowest point about 8 m), bounces, then she is lowered down (`control-rides` all passed).
- Bug found and fixed before shipping: the text used to insert the giant-jump code also matched in the sky dive, so a copy landed there and froze the sky dive at the top (`giant is not defined`). Found by the ride test; the copy is removed.
- **Full smoke test: 236/236.**
- Desktop (software rendering) speed: Neptune the same as build 94 (the tower pieces are part of the tower mesh). Not tried on an iPhone.

## Checkpoint: build 94 — the winding ice trail on Uranus
- **Uranus rink: THE WINDING ICE TRAIL.** Tap the snowflake gate at the rink's east end. She skates a long trail that winds far behind the rink and back, under six glowing ice arches that chime as she passes; ▶ faster, ◀ slower, JUMP hops (`parks`: 20 m back, top speed 9 m/s, all six arches).
- Speed: the first version (a flat ice ribbon over the ground and many snow banks) was 8–12 % slower where the trail is in view on desktop. It was slimmed three times: one mesh, thin arches, no ribbon (Uranus's ground is icy already), a few snow banks. Now within the noise (see `PERFORMANCE_LOG.md`).
- **Full smoke test: 236/236.**
- Test: the Pluto rainbow tower checks print SKIP while that tower is switched off, instead of failing.
- Desktop (software rendering) only; not tried on an iPhone.

## Checkpoint: build 93 — sky dive wind gusts, the flume's crystal-cave fork
- **Neptune sky dive: WIND GUSTS.** Three bands of white wind streaks; diving through one pushes her sideways, and she steers against it (`control-rides` all passed: 3 gusts, then a bullseye).
- **Venus flume: THE CRYSTAL-CAVE FORK.** Steer ◀ at the second arch, after the rapids, to ride through a sparkling crystal cave behind the mountain (`venus-flume` 6/6).
  - Bug found and fixed: on the fast rapids one big step (a slow frame) could jump right over the fork's narrow window, so the steering was never checked. Both forks now trigger on the first step at or past their arch.
  - The splash targets moved onto the rapids before the fork, with the last one on the right, so aiming at them never sends the log into the cave by accident.
  - Test fix: the flume test pressed JUMP only between 3.0 and 3.2 s of the ride (a window that can be skipped at 1–2 fps); it now presses once at the first frame after 3 s.
- **Full smoke test: 236/236.**
- Desktop (software rendering) speed: Neptune and Venus the same as build 92 (see `PERFORMANCE_LOG.md`). Not tried on an iPhone.

## Checkpoint: build 92 — bungee balloons, double swing, trampoline switch, splash game, rainbow wall
- **Builds 73–91** are recorded row by row in `ATTRACTIONS.md` (each with its own test and full smoke result).
- **Build 92** (desktop, software rendering; not tried on an iPhone):
  - Neptune bungee: THE REBOUND GAME. After the first bounce, three balloons appear around the cord's end; steer ◀ ▶ and bounce to pop them (`control-rides`: 3 popped).
  - Neptune: THE DOUBLE SWING. A wide seat shared with a little Neptune friend; JUMP pumps it higher; swing high together (`control-rides`: 1.15 rad).
  - Mars trampoline park: THE GENTLE / HIGH PICTURE SWITCH (feather or rocket). On the feather a bounce reaches 4.3 m, even holding ▲; on the rocket 30.7 m (`control-rides`).
  - Mars, area 3: THE RAINBOW WALL. A second climbing wall (16 m); the bell rings at the top, then the ZIP LINE takes her down to a landing mat (`control-rides`).
  - Venus flume: THE RAPIDS SPLASH GAME. Five targets beside the rapids; steer toward one and press JUMP to splash it (`venus-flume`: 5 of 5).
  - Pluto: a second tower (the rainbow tower with a spiral slide) is written and passes its tests, but is switched OFF. It was 7–15 % slower where it is in view, even after three rounds of trimming.
  - Test fix: the wind button check waits for the next frame instead of a fixed 300 ms (the test browser runs at 1–2 fps).
  - **Build 92 full smoke test: 236/236** (Biscuit's check passed this time).
  - Build 91 full smoke test: 233/236. All 3 failures come from one missed test tap on Biscuit; a separate run shows tapping him works.

## Checkpoint: build 72 — Saturn jump ramps, lighter Jupiter slides, smoke checks for the build 71 rides
- **Build 71** (merged in PRs #76 and #77):
  - Neptune: the bungee you control, and the Big Sky Dive;
  - Mars: the 30 m climbing wall climbed with the joystick, and the trampoline park;
  - Saturn: a 60 m Star Blaster, spun up with JUMP; the Ring Raceway you drive;
  - Venus: a log flume three times longer, steered;
  - Pluto: the inflatable park;
  - Uranus: the Ice Palace and a bigger rink.
  - Ride tests: `control-rides` 11/11, `saturn-rides` 5/5, `venus-flume` 3/3, `parks` 14/14.
  - Full smoke test **234/236**. The two failures were old checks for the build 68 versions of the Star Blaster (no JUMP presses) and the Mars trampoline (the old cliff edge). Both checks are updated in build 72 to test the new behaviour just as strictly.
- **Build 72:**
  - Saturn: two jump ramps on the outside lane (`saturn-rides` 5/5, 3 jumps in a race);
  - Jupiter: lighter slide half-pipes (8 sides; 120/160/260 segments).
- **Jupiter speed** (desktop, software rendering; average of 2 alternating runs; ms per frame):

  | Spot | Build 69 | Build 72 |
  |---|---|---|
  | +125 | 178 | 180 |
  | +150 | 163 | 176 |
  | +185 | 147 | 167 (build 70: +24%) |
  | +205 | 151 | 161 |
  | +240 | 170 | 167 |
  | +260 | 170 | 175 |
  | +300 | 160 | 151 |

  Still slower around +150 to +205: about 10 more draw calls. In NEXT_TASKS.
- **Not on the iPhone yet.**

## Checkpoint: build 70 — Jupiter Sky Playground, Mercury carnival funhouse, pink line removed
- **New modules:** `src/jupiter-world.js` and `src/mercury-funhouse.js`, built in the planets' areas 2–3 and freed when she leaves. The full list is in README.md.
- **Game changes:**
  - `P.sizeMul` (the giant-and-tiny room; it only applies on a planet);
  - the Jupiter super slide is now an open rainbow half-pipe (no extra shader, cheaper to draw);
  - the pink kerb along the front of the Earth world was removed (the family's screenshot).
- **Verified (desktop, software rendering):**
  - `tests/jupiter-world.cjs` **20/20**: the stairs and bridge; the launch pad onto the high island; the Candy slide; the musical floor; the ball pit; the elevator; bubbles; the secret; the colour game; bounce targets; the Floaty Bubble and its stars; the wind fan; the telescope; the Great Red Spot Slide through all 7 hoops; the Twister; a travel balloon; and that walking along the ground still reaches the old playground.
  - `tests/mercury-funhouse.cjs` **17/17**: every room, both lifts, the stairs, the slide and all six stars.
- **Speed (Jupiter, build 69 → 70):**
  - the spots with lots of new things in view are about 10–20% slower;
  - the others are the same or faster.
  - Recorded in NEXT_TASKS for the next build.
- **Full smoke test:** not run yet for this build (the family asked for it now); run it next.

## Checkpoint: build 69 — the GIANT Moon roller coaster
- **The family asked** for the Moon coaster to be made absolutely massive (10–20× bigger, hundreds of metres tall, minutes long), with a giant climb and first drop, loops, corkscrews, spirals, a mountain tunnel, a crater drop, a glowing cave, high sections and a finale. It had to work perfectly, be easy for a 5-year-old, and not make the game slower.
- **How big:**
  - the new course is **4.73 km long**: about 8× the build 68 coaster and about 14× the original (build 65);
  - **3 min 14 s** per ride at normal speed; the track tops out at **227 m** and dives to **22 m below** the ground;
  - it fills the whole Moon (330 × 170 m), which is the limit for now; the course can grow when the Moon does.
- **The ride, in order:**
  1. the station, then a spiral lift climbing round a 240 m glowing lunar spire;
  2. the 195 m first drop, loop 1 and a camel hill;
  3. a tunnel through a new lunar mountain, then corkscrew 1;
  4. a booster and a climbing turn to a high viewpoint;
  5. a plunge into a new enormous crater, out again, loop 2;
  6. a spiral descent and the glowing purple crystal cave underground;
  7. loop 3 and corkscrew 2 with camel hills;
  8. a long high run across the whole Moon;
  9. a finale spiral and corkscrew 3 back into the station.
- **How it is made** (`src/coaster-course.js`, `src/moon-coaster.js`):
  - **The course:** pieces plus fixed anchor points, sampled once every 0.5 m (position, direction, banking and speed) in about 8 ms.
  - **Every frame:** nothing is recalculated; the train only looks up the cached samples.
  - **Speed:** comes from height (energy), so it is slow over the tops and fast at the bottoms (11–34 m/s), with gentle brakes into the station.
  - **The structure (spine, towers, spire, mountain, station):** built in slices of 4 ms per frame, one mesh in all.
  - **Rails and ties:** streamed in 120 m pieces near her (2 while walking, 3 while riding; at most one piece built every 0.2 s), and freed again behind.
  - **Tunnel and cave walls:** drawn only when the camera is near them.
- **Riding:**
  - one tap on any car (or 🐾) boards; 🏁 gets off at any moment, at the station;
  - the chase camera is smoothed and sits low inside the tunnel and cave;
  - calm mode rides it at 62% speed;
  - no shaking or flashing; the first Moon visit shows a 6.5 s camera sweep of the whole coaster.
- **Speed work in this build** (desktop software rendering): the first version made the Moon station frames about 35% slower. Fixes:
  - **Painted light:** the whole structure is drawn with one cheap unlit material whose light and shade are painted into its colours;
  - **Less geometry:** half as many towers, no diagonal braces, a lighter spine, fewer beads and lighter rails;
  - **No new shaders:** the tunnel and cave walls are turned inside out instead of needing a new shader;
  - **Shader warmed at start:** the shared material is prepared on the loading screen, so landing on the Moon no longer has a shader pause (2.2 s before the fix).
- **Also fixed:** the Mars climbing wall's code (build 68) had been deleted by mistake while this coaster was being built (Mars would have stopped with an error). It is restored exactly as it was, and the planet shader check caught it.
- **Verified (desktop, software rendering):**
  - **Course check** (`tests/coaster-course-check.mjs`, also run by `node --test`): no gaps; never closer than 5.16 m to itself; clear of the ground, the activities and the mountain; 272 upside-down samples.
  - **A real browser ride from start to end:**
    - she reaches 227 m and −22 m and loops upside down;
    - she passes the booster, cave, crater, lift and tunnel sections;
    - she never goes backwards or jumps, and the camera stays near her;
    - she ends at the station and the camera is freed;
    - 🏁 works mid-ride, and the map works mid-ride.
  - **Full smoke test (run alone): 236/236 passed**, including the whole-ride coaster check (227 m top, −22 m bottom, loops, every section, back at the station) and the 🏁 skip.
  - **Not yet tried on the real iPhone.**

## Checkpoint: build 68 — Neptune: wind swings, bungee jumping and a skydiving chamber
- **The family asked** for swings the wind helps push, bungee jumping and a skydiving simulation chamber on Neptune. Neptune is now a big place (330 m).
- **Area 2, wind swings:**
  - three swings on a tall frame, a windsock, and white wind streaks blowing across;
  - tap a swing and the gusts push you higher and higher (measured up to 1.25 rad, about 72°), then it slows and you hop off.
- **Area 2, bungee tower:**
  - a 24 m tower with a lift and a jumping board;
  - the lift goes up, you walk out, "three, two, one, JUMP", and you fall upside down on a stretchy pink cord;
  - you bounce a few times, then are lowered gently to the ground (cannot hop out mid-air).
- **Area 3, skydiving chamber:**
  - a glass wind tunnel with a big spinning fan and rushing air;
  - you float in a skydiving pose, bobbing and turning; tap again to zoom higher;
  - after about 15 s the fan slows and you float down to the floor.
- **Game change:** any ride can tilt your character (`ride.roll`), not only the coaster.
- **Also in build 68 (asked while it was being tested):**
  - **The Moon roller coaster is much bigger, crazier and faster:**
    - a 32 m lift (was 16 m) and a giant drop;
    - TWO loop-the-loops, a camel hill, a turnaround, speed hills and a corkscrew helix;
    - top speed about 21.5 m/s (was 15); the lift itself climbs faster.
  - **Venus: a giant log ride:**
    - sit in a hollow log at the station; it floats up a lift to 18 m and winds along a high wooden water channel;
    - then it plunges down a giant drop into the splash pool: SPLAAASH (a big spray);
    - you step out by the pool and tap the log to ride again;
    - Venus is now a big place (330 m); the water is said to be pretend (real Venus is far too hot).
  - **Saturn: the Star Blaster:**
    - a 38 m striped tower with a ring of seats;
    - it spins faster and faster, shoots you up the tower ("WHOOOOSH"), hangs, drops you back down with a bounce, then slows to a stop.
  - **Saturn: the Ring Raceway:**
    - a giant Saturn hangs in the sky with real-looking ring bands, ice chunks and a racetrack round its rings (red and white kerbs, a chequered line);
    - a rocket kart on a launch pad flies you up, races two laps (hold ► to go faster), and flies you back down;
    - Saturn is now a big place (330 m).
  - **Mars: a giant climbing wall and a giant trampoline:**
    - a 22 m red rock cliff with colourful handholds and safety ropes at the end of the crater valley;
    - tap it (or PAW): she climbs up its front, faster while you hold ▲; at the top a flag and a cheer;
    - walk off the right edge and you fall onto a giant trampoline that keeps bouncing you about 12 m high (Mars gravity is low); walk off to stop;
    - measured: reached 22.3 m, then bounces of 18, 11.7 and 11.7 m.
    - (a mix-up found in the test ride: the ride was first named like the Sky Kingdom rope ladder, so the game moved her as if she were on the ladder; now named `rockclimb`.)
  - **Measured (Saturn test rides):** Star Blaster top 35.3 m at full spin; race 2 laps, top 43.5 m, 22 m/s; no page errors.
  - **Measured in test rides:** coaster top 33.1 m and 21.5 m/s; log ride top 18.8 m, top speed 17 m/s, splash; no page errors.
- **Rocket bug fixed** (found by the full smoke test): if a planet was chosen while she was still climbing into the rocket, the choice was quietly ignored and the rocket never left. The rocket now remembers it and blasts off as soon as she is inside. Verified: PAW at the rocket, choose the Moon at once, and she arrives.
- **A mistake found by the test ride:** a `//` comment in the middle of a line turned the rest of the line into a comment, so the skydiver did not move. Now fixed.
- **Verified (desktop, software rendering):** all three rides end to end, no page errors, screenshots; new smoke checks. **Full smoke test, run alone on the final build: 235/235.**

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
