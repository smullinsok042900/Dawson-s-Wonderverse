# Changelog — Dawson's Discovery World

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
