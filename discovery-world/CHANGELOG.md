# Changelog — Dawson's Discovery World

## Milestone 1 · build 4 — "all one world, merged together"
Previous build backed up as `backups/M1_build3_index.html`.
- **Removed the area-name banner** that labelled "Mega Playhouse / Imagination Studio / Wonder Lab / Adventure Park". It made the one world feel like four places.
- **No area owns a colour scheme any more.** The backdrop colours drift and repeat every ~3200 units along the whole world.
- **Distant landmarks of every theme are mixed along the whole length** (play towers, giant pencils, lab flasks, circus tents, wheels, balloons) instead of being grouped by theme.
- **Every theme appears everywhere:**
  - paint splats on the floor all along the world
  - party bunting across the Studio, Lab and Park
  - turning gears on every background column (they spin faster when powered)
  - bubble tubes in the Playhouse, Lab and Park
  - a new **rope bridge** joining the Wonder Engine walkway to the magnet deck
- **Painting is no longer only "the Studio":** two new paintable easels out in the park (by the Ferris wheel and by the carousel). Every painting is saved on its own surface.

## Milestone 1 · build 3 — art-direction pass to match the target screenshots
Target images saved in `docs/art_reference/`. Previous build backed up as `backups/M1_build2_index.html`.
- **Pip redesigned as the fairy-kit hero:** big pointed ears with rainbow inner fluff; gold goggles; glitter fairy wings (two pairs, veins, sparkles); a big rainbow fox-tail plume; speckled fur; cream chest fluff; white paws with toe beans; cheek tufts; a heart cheek mark; a rainbow forelock. It's the same attached rig and animations as before.
- **New storybook eyes for all three:** large glossy gradient iris, layered highlights and a twinkle, a thick upper lash line with flicks at the outer corner. Pip has violet eyes, Zuzu blue, Jelly magenta.
- **Closer camera:** creatures are drawn 18% bigger and the view is 11% tighter, so a creature is now ~37% of screen height. The camera also rises when she climbs or bounces.
- **Premium look:**
  - glowing party-bulb strings and marquee bulbs on every machine
  - gold-trimmed glossy machines
  - a glass-conservatory backdrop: arched lattice windows, gold-capped columns, a pink balcony with railings, a rich interior wall
  - hanging ivy and glass bubble tubes
  - a glossy tiled floor with light reflections and the creature's mirror reflection
- **NEW ride, the Carousel** (Adventure Park, after the coaster): a 2.5-D turning carousel with a unicorn, a bunny, a pony and a pink unicorn. Mounts gallop up and down and pass in front of and behind the centre column. She rides one at seat scale and a little tune plays; JUMP hops off. With power it spins faster and all its lights come on. The world is extended to 6300 and the whoosh-tube door moved to the new far end.
- **HUD restyled to the targets:**
  - bubbly rainbow logo
  - star counter pill
  - gold-ringed round creature portraits
  - round pink sound button
  - area-name banner that slides in as you enter each part of the one world
  - glossy arrow pill for moving
  - big round JUMP button
  - new **PAW button** (does the nearest/most useful thing, so no aiming is needed)
  - glossy tile paint palette
- **Deliberately NOT copied from the targets:** the coin/gem counters with "+" buttons (they read as purchases), the "Lv 12" badge and the row of hearts (they read as lives you can lose). These conflict with the brief: no purchases, no losing.
- **Performance:** the soft backdrop renders at half resolution. Bulbs are pre-rendered sprites. **Adaptive resolution** lowers pixel density step by step if frames run slow.
- **Fixes found while testing:** the tickle area is now a body circle, so a bigger creature no longer blocks taps on the wheel or carousel. The hint hand never covers the creature's face. The trampoline was re-tuned for the closer camera.

## Milestone 1 · build 2 (this checkpoint)
Built on Prototype 01 (kept untouched in `backups/`). The same world layout, rides and save data carry over, and old saves migrate automatically.

### Creatures (new rigs; same cast)
- **Pip, a rainbow fluff-bun.** One merged silhouette for legs, body, head and ears (two-pass inking means no floating parts). Legs swing from the hips with a real stride and foot lift. Arms swing opposite to the legs. Ears and the rainbow tail lag behind on springs. Moth wings flap in the air. Double jump is a somersault.
- **Zuzu, a hovering star sprite.** Her two lower star points are her feet and step while she moves, and her side points are arms that wave. An antenna curl is rooted on the crown tip. She has a glow aura, a comet trail of real past positions, and a twirl on double jump.
- **Jelly, a soft-body jelly blob.** An 18-point spring ring that really jiggles and lags behind fast moves, with a cap so it stays recognisable. Tentacle feet and antennae are attached to points on the deforming body. Jelly hops instead of walking. The body is translucent, with drifting glitter and a heartbeat core.
- All three share: squash and stretch (stretch on take-off, squash on landing), lean into movement, blinking, eyes that track motion, mouths for each state (grin, "o" on jump, wobble on landing), tap-to-tickle reactions, seated poses on rides, and a contact shadow that stays on the floor.
- Chooser buttons and the title screen use the real animated rigs instead of emoji.

### World
- World extended from 5200 to 5800 units, still one continuous world. The sky, hills and floor blend gradually from Playhouse pink to Studio sunshine to Lab teal to Park sunset.
- Five depth layers: sky with light rays, two hill bands, distant landmarks from every theme (towers, pencils, flasks, tents, a far wheel, balloons), a mid-layer play-centre arch frame, and a new foreground layer that slides past in front.
- Redrawn machines and props with visible state: paint buckets, a glass mixing bowl, a pipe, a bubble tank, the Wonder Engine (funnel, 6-cell battery, meshing gears, lever, a face that wakes up), a magnet arm, the Star Launch Pad, a lit Ferris wheel, a coaster with stations and a train, and the whoosh tube.
- Depth tricks: the creature wades *into* the ball pit, sits *in* gondolas and coaster cars, and floats *inside* the giant bubble.
- Six hidden secret stars, reached by double jumps, bubble rides, the wheel, the coaster and the tube.

### Interaction chain (all real state, all saved)
Buckets → bowl (real pigment-style mixing, e.g. blue + yellow = green) → SPIN → paint travels the pipe → bubble tank → coloured bubbles + a rideable giant bubble → bubbles drift into the funnel → 6-cell battery in your colours → lever → power pulse down the cable → the Star Launcher wakes, the wheel and coaster lights turn on, the coaster runs and is painted in *your* mixed colour, and the magnet gets strong enough to pull every ball.
Plain (unpainted) bubbles don't charge the engine. A picture hint shows the missing paint, so no reading is needed.

### Play & controls
- New moves: walk off the tower onto the slide, which follows its curve; whoosh tube from the park back to the ball pit; giant-bubble ride, steerable with ◀ ▶, pops on JUMP; launcher flight; balls bounce off the trampoline, collide with each other and get kicked by the creature.
- A pointing-hand hint (no words) shows the nearest thing not yet tried, or the next step of the chain.
- HUD: compact top bar, portrait buttons, SVG icons, bigger move/jump buttons. The paint palette sits bottom-centre and only appears near the wall, with your mixed colour as a swatch and an undo button.
- Focus loss, app switching and page-hide release held buttons, pause the game and save. Rendering resolution is capped for older phones.

### Save
- New `v2` save adds paint mix, tank, battery, power, magnet, secret stars and sound. It validates everything and falls back to safe defaults on corrupt data. The `v1` save from Prototype 01 is migrated.
