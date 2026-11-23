# PROGRESS — Dawson's World 3D graphics & performance overhaul

Repository: `smullinsok042900/dawsons-world-test` · branch `main` · game root `discovery-world/3d`.
Every completed stage is committed and pushed to `main` automatically.

## Pull request (draft, mandatory checkpoint)

The original game repository keeps its own history, so verified work reaches it only through one
draft pull request — never a push to `main`.

- **PR #104** → https://github.com/smullinsok042900/Dawson-s-Wonderverse/pull/104
  (`feature/full-3d-overhaul` → `main`, draft, updated in place for every stage)
- The branch is based on the original `main` (`9449914`). The sync copies only the overhaul paths
  (`discovery-world/3d/src|tests|tools`, `package.json`, `package-lock.json`, `PROGRESS.md`,
  `docs/GRAPHICS_OVERHAUL_PROGRESS.md`), so the original backups, workflows and other files stay untouched.
- **How to sync after a stage:** push this repo's `main`, then run the `Sync the 3D overhaul` workflow on
  `feature/full-3d-overhaul` (Actions → Sync the 3D overhaul → Run workflow). It copies those paths, runs
  `tests/scene-audit.test.mjs` and `tests/spatial.test.mjs`, rebuilds `discovery-world/3d/index.html` with
  `build.mjs`, and commits to the PR branch. The PR then updates itself.
- **Verified 2026-11-23:** the PR's `index.html` blob is identical to this repo's build (`33903e8`),
  19 files changed, draft, `main` unchanged. After stage 10 the branch head is `8466076`, `index.html`
  10,181,127 bytes (same as the local build) and `PROGRESS.md` blob `110d639`.

## Tooling available in the cloud workspace (assessed 2026-11-23, no assets changed)

- **glTF-Transform CLI 4.5.1** — installed as a devDependency (`@gltf-transform/cli`) and verified against the
  game's own models: `npx gltf-transform inspect src/assets/castle.glb` reads meshopt-compressed GLBs, and
  `etc1s` re-encodes them.
- **KTX-Software `ktx` v4.4.2** — installed user-space at `~/ktx/bin` (no root needed). With it on `PATH`,
  `npx gltf-transform etc1s src/assets/tree_0.glb out.glb` produced a valid `KHR_texture_basisu` file: both
  512×512 textures became ETC1S `image/ktx2` (52.3 KB and 45.0 KB, down from 174.8 KB each). Re-apply
  `meshopt` afterwards: `etc1s` first decodes the existing meshopt buffers (the CLI warns about that).
- **Blender 4.2.3 LTS** — not preinstalled and no root (`sudo` blocked, apt lists unusable). The official
  portable tarball runs headless in this workspace: `~/blender-4.2.3-linux-x64/blender --version` prints the
  version when started with
  `LD_LIBRARY_PATH="$HOME/blibs/usr/lib/x86_64-linux-gnu:$HOME/.browser-libs/usr/lib/x86_64-linux-gnu:$HOME/.browser-libs/usr/lib:$HOME/blender-4.2.3-linux-x64"`.
  The two missing libraries Blender needs were extracted user-space from `libsm6` and `libice6` debs into
  `~/blibs`; the rest come from the Chromium library bundle. The repo's existing
  `tools/blender/build_landmarks.py` can therefore be run on a CPU-only machine.
- **KTX2 runtime in the game: not wired yet.** three r187 ships `KTX2Loader` and the Basis transcoder
  (`node_modules/three/examples/jsm/libs/basis/`), but `src/assets.js` only sets the meshopt decoder, and no
  shipped asset uses KTX2. An isolated headless harness that loaded the compressed tree failed with a
  transcoder URL/worker error, so runtime KTX2 loading is **unverified** and no game asset was changed.
- **Device support (documented, not measured here):** KTX2/Basis needs WebGL2, which iOS Safari 15+ and
  current Android Chrome provide; the transcoder must be served over https (GitHub Pages is fine, `file://` is
  not), so any KTX2 adoption needs a URL base plus a fallback path for offline/local play.
- **Other tools worth considering:** `three-mesh-bvh` (fast raycasts/collision), Draco (alternative to meshopt),
  `sharp` for texture resizing before encoding, and Blender's glTF exporter for rebuilt landmarks. None installed.

## Completed stages

| # | Stage | Commit | Verified |
|---|---|---|---|
| 1 | Collision interval index, scene auditor, texture anisotropy, sea ripples/reflections | `a54ac79` | 8 spatial + 10 audit tests, build, headless load |
| 2 | Playhouse & Park detail; audit false positives resolved (fur shells, terrain masses) | `77cb5d2` | 12 audit + 8 spatial tests, build, audit clean, in-scene A/B |
| 3 | Castle front & Dino Valley detail; `mergeGeometries` helper; auditor ignores merged slabs | `dfc92f6` | 21 tests, build, single-frame A/B, audit clean |
| 4 | Castle throne room detail; carpet trim raised above z-fight range | `0246790` | 21 tests, build, single-frame A/B, room audit clean |
| 5 | Toy Town detail (toy-box spill, giant balls, spinning tops) | `039752b` | 21 tests, build, single-frame A/B |
| 6 | World-wide lighting/atmosphere, dino skin & vegetation, playhouse furniture, rail-clearing fixes | `35f321c` | 21 tests, build, screenshots, 0 page errors |
| 7 | Sculpted hill/mountain geometry, fractured layered rocks, top-bar overflow fix, rail-corridor sweep | `9fc41c7` | 21 tests, build, 2 paired screenshots, toolbar measured |
| 8 | Real geometry on the foreground models: Dottie, broad-leaf plants, Ferris wheel, carousel ponies, castle facade | `5c899a8` | 21 tests, build, 8 paired screenshots (castle, Toy Town, Dino Valley, Park), audit clean, per-model geometry measured |
| 9 | Lab Gardens: glazed greenhouses on drum walls with doors and ribs, raised beds with soil depth, edging fences, potting bench with lathed glassware and copper plumbing; ride/climb placement sweep; capture harness committed | `be0db6b` | 21 tests, build, paired screenshots (Lab Gardens), 5 close-ups, 4 ride close-ups, audit clean, `labgarden-detail` measured |
| 10 | Art Plaza gallery yard: paint-splattered paving, four kerbed planters, two easels and a drying rack with painted canvases, paint pots and brushes, bunting on poles across the plaza | `e6107b5` | 21 tests, build 9,942 KB, paired screenshots, audit clean, `artplaza-detail` measured |
| 11 | Sunny Seaside shoreline: five striped parasols with towels and beach balls, dune grass along the back of the sand, driftwood; clear of the lighthouse, pier and crab walk | `8959495` | 21 tests, build 9,945 KB, paired screenshots, audit clean, `seaside-detail` measured |
| 12 | Whispering Woods forest: nine trees with tapered two-tone trunks, limbs and four overlapping leaf-textured crowns with a leaf-card fringe, a fern understory along the path, and a swept campfire clearing with bench logs and a woodpile | `112bedb` | 21 tests, build 9,949 KB, paired screenshots, audit clean, `woods-detail` measured |
| 13 | Frosty Peaks: four snow-capped rock shoulders behind the district, snow-loaded pines, an ice arch, and wind drifts along both sides of the path that step around the pond, igloo, hill and snowman | `922e463` | 21 tests, build 9,952 KB, paired screenshots, audit clean, `frosty-detail` measured |
| 14 | Happy Farm: fenced paddock along the back of the path with gates at the barn and windmill, four crop rows of cabbages and carrots, six round hay bales, and a louvred cupola with a weathervane on the barn roof | `dee1653` | 21 tests, build 9,955 KB, paired screenshots, audit clean, `farm-detail` measured |
| 15 | Ocean Pier: plank seams and edge trim on the deck, eight pilings with rope wraps and caps, three brass mooring cleats, a striped bait shack with a counter and buckets, and four lamp posts | this commit | 21 tests, build 9,957 KB, paired screenshots, audit clean, `pier-detail` measured |

## Graphics improvements

- **Water:** sea material gained a ripple normal map and reflections; texture quality pass sets anisotropy on ground/detail textures.
- **Playhouse:** woven play rug, 72 bunting flags across the ceiling, three hanging paper lanterns.
- **Park:** 190 wildflowers in two drifts (instanced stems and colour-varied heads), 3 boulder clusters (9 rocks, one mesh), six lamp posts with glowing globes.
- **Castle front:** two formal parterre beds (gravel tray, trimmed hedge border), 24 rose bushes and 72 blooms, four stone urns with flowers, 11 warm lanterns along the front.
- **Dino Valley:** 95 ferns, three mossy boulder clusters (one mesh), a mossy fallen log with mushrooms, eight three-toed footprints.
- **Castle throne room:** velvet ropes (10 posts, 32 sagging segments), four potted palms, four velvet banners with gold rails, six wrapped party gifts, twelve candle flames on the throne steps.
- **Toy Town:** overturned toy box spilling 8 alphabet blocks, 7 giant toy balls along the near path, 4 spinning tops.

All additions are additive decoration: no collision entries, no changes to rides, taps, saves or child-friendly controls. `?nodetail` disables them for measurement.

### Stage 6 — world-wide look (no prop-by-prop additions)

- **Filmic tone mapping (ACES)** with exposure 1.02, warmer key light, stronger hemisphere fill and a
  softer shadow radius — every environment gains contrast and shape.
- **Atmosphere**: fog moved back to 72–250 m in lavender, giving distance depth without hazing play.
- **Dottie** now has a procedural pebbled normal map, so her skin reads as scaly rather than smooth.
- **Dino Valley vegetation** replaced with broad-leaf jungle plants (instanced, 95).
- **Playhouse** gained soft play mats and a toy shelf with 14 books.
- **Rail clearance**: the playhouse rug, park lamps, castle beds/urns and Toy Town balls/tops no longer
  intersect the train corridor at z 3.2. See the table in `discovery-world/3d/docs/GRAPHICS_OVERHAUL_PROGRESS.md`.
- **Before/after screenshots**: `discovery-world/3d/docs/screenshots/stage6/` (six paired scenes).

### Stage 7 — real geometry in the landscape (not another decoration pass)

- **Hills rebuilt as landforms.** The Adventure Park backdrop used to be 29 smooth spheres squashed flat
  (`scale.y = .6`) with one flat colour each. Each is now a displaced sphere: three octaves of ridge noise on
  the radius, a flattened base, baked vertex colours (grass gradient, dry stony crowns, rock scars, shaded
  feet) and a generated 128 px normal map. All 29 are merged into **one mesh**: 2 draw calls for the whole
  backdrop where there were 29 meshes.
- **A distant mountain range behind them** — 8 ridged, snow-capped peaks at z ≈ −136…−160, cool blue with
  pale caps and aerial haze; one merged mesh, one draw call. The horizon now has layers (hills → peaks → sky)
  instead of a row of blobs.
- **Rocks are fractured stone now.** `makeRock` gained a broken-ledge displacement (plane-like fractures plus
  scree grain), strata colour bands, moss on upward faces and darker wet feet, all as baked vertex colours on
  the existing icosahedron — no extra material, texture or draw call. This upgrades every rock on every planet.
- **Top bar no longer runs off the screen.** The old `@media (min-width:900px){#upperRight{max-width:none;flex-wrap:nowrap}}`
  let the right-hand cluster overflow past the viewport edge (the settings gear was clipped in the Dino Valley
  shot). The cluster is now width-capped at every size, and pills/creature tiles shrink in two steps (≤1500 px,
  ≤1150 px). Measured bounding boxes: right edge sits 10 px inside the viewport at 1440×900, 1280×720,
  1152×648, 1024×576, 820×480 and 700×400 (overflow −10 px everywhere).
- **Train-corridor sweep.** A browser-side audit walked every mesh in the built world, took world-space
  bounding boxes and flagged anything crossing z 2.6–3.8 below y 2.6: 70 boxes. Every one resolves to a known
  legitimate fixture or a bounding-box artefact — buffer stops at both ends (x −798 / 904), station canopy at
  the park stop (x 334), platform/bench clusters at the home stop, the low grass band at z 3.75–4.55
  (22 cm tall, outside the rails), and the merged `dino-detail` batch whose single box spans both sides while
  its individual plants do not. **No prop stands on the rails.** The audit is bounding-box based, so thin
  diagonal geometry can still produce false positives; it does not replace a run of the train.
- **Before/after**: `discovery-world/3d/docs/screenshots/stage7/` — `before-park.jpg` / `after-park.png` and
  `before-dino.jpg` / `after-dino.png`, identical teleports (x 150, x 368), 1280×720, same lighting. The
  "before" files are the committed stage-6 build; "after" is this build.

### Stage 8 — the foreground models are real models now

The backdrop got its landforms in stage 7; this stage rebuilds the things the camera actually looks at.

- **Dottie the long-neck is a lofted creature, not a stack of spheres.** Her body is a single mesh through ten
  real cross-sections (heavy hips, narrow waist, deep chest, shoulders), resampled three times per section for a
  smooth silhouette. The top is kept flat at y 3.45 so the existing walking platform and the neck slide still line
  up exactly; the cream belly blends into the teal flanks and the darker back as vertex colour, so the separate
  belly sphere and the five stuck-on flavour spots are gone. Her legs are lathe-turned columns with a knee bulge,
  a padded foot and **three clawed toes each** (one merged mesh, one draw call, replacing four cylinders and four
  balls). Twelve dorsal scutes run along the spine and three flank bumps sit where the old spots were. The head
  gained brow ridges over the eyes, nostrils, a rounded jaw under the muzzle and a crest scute — all merged.
- **Broad leaves have thickness, a midrib and an arch.** New `broadLeafGeometry()` in `scenery-detail.js` lofts
  each blade through a grid of vertices: tapered base, fullest a third along, pointed tip, cupped edges, a raised
  centre rib and a tip that droops below the stalk, with a base-to-tip colour gradient and UVs so the existing
  leaf-vein normal map works. The 85 jungle plants in Dino Valley use it (still one instanced mesh, one draw
  call), and the five palm ferns were rebuilt as a ringed tapered trunk plus nine arching fronds each — one mesh
  per palm instead of six flat capsules.
- **The Ferris wheel is a structure, not a disc.** It now has an A-frame with two cross beams, diagonal bracing
  and cast foot plates; **two parallel rims tied together every 36°** so the wheel is a cage with depth; 20 tapered
  spokes per face; a bolted hub with two flanges and six axle bolts; and ten gondolas with a bevelled cab, deep
  tinted windows, a padded bench, a gold foot bar, a scalloped roof with a brass rim and a real hanger arm.
  The whole ride is 3 merged structure meshes + 10 gondola meshes (13 draws) where the flat version needed 37
  separate meshes. It is split so the wheel group still rotates and every gondola still hangs upright and carries
  its seat — the ride logic is untouched.
- **Carousel ponies are saddled.** Each pony gained a draped blanket, a padded saddle with a raised cantle and
  pommel, stirrups hanging on leathers and brass collars on its pole — one merged mesh per pony, so +6 draws in
  total, and the seat height (1.36) the ride uses is unchanged.
- **The castle facade has depth.** A moulded plinth and base course, four engaged pilasters with bases, caps and
  a carved band, a ring of nine stone voussoirs with a keystone over the door, projecting architraves on all four
  windows (jambs, sills, hoods, cross mullions), a slim string course under the battlements, and the balcony's
  plain sticks replaced by eleven turned balusters. Everything is static, so the existing material-batch merge
  folds it in; the new stonework adds exactly **one material / one draw call** (about 53 small bevelled pieces).
  The battlements, banners, rose window, flower boxes and climbing roses are untouched and still visible.

### Stage 9 — Lab Gardens: a real garden, not three bare domes

- **The greenhouses are buildings now.** Each glass half-sphere sits on a drum wall with a stone footing course,
  six external hoop ribs (scaled with the dome), a sill ring and a brass finial. The front carries a framed
  **arched door** — sage jambs, a half-round arch, a panelled leaf with a porthole window and a brass handle, and
  a stone threshold — standing just outside the glass, so no part of it intersects the pane.
- **The domes are really glazed** (`opacity .26`, `depthWrite false`, `renderOrder 3`) instead of a solid pastel
  shell, so what is inside is the point: two raised beds per dome, kerb walls, sunken dark soil and rows of tall
  planting with coloured blooms, seen through the panes.
- **Beds have real depth.** Five beds fill the gaps between the domes: stone kerb walls proud of the grass, soil
  recessed 9 cm below the rim (a visible edge, not a brown plane), two soil ridges and rows of three-leaf sprouts
  with blooms. Interior beds are raised to 1.02 m so the planting shows above the drum through the glass.
- **Picket fencing** edges three of the beds (posts, two rails, closely spaced pickets) so the beds read as a
  garden rather than boxes on a lawn.
- **A potting bench that reads as a lab.** Two-tier wooden bench with glassware built as real lathes — a beaker
  with a wall, lip and spout, a second smaller beaker, a conical flask — each holding coloured liquid; a wooden
  test-tube rack with five tubes and five liquids; a microscope (foot, arm, angled tube, eyepiece, stage); and a
  **copper supply pipe** with elbow bends, collars, floor stands and a spoked brass valve wheel running from the
  bench to the far greenhouse.
- Everything static merges into three vertex-coloured meshes (paint, glass, copper); leaves and blooms are two
  instanced meshes. The district gains **4 draw calls**, and the whole detail is one streamed group
  (`labgarden-detail`) built with the rest of the neighbourhood, so nothing is added to the always-loaded pass.

### Ride and climb placement sweep (before stage 9 turned the page)

Close-ups in `discovery-world/3d/docs/screenshots/stage9/rides/`, 1100×800, software WebGL, camera pinned with
`G.camOverride`:

- **Dottie's back and neck slide — no regression.** The walking platform is still exactly y 3.45, the lofted body
  clamps its vertices to 3.435 (a 1.5 cm tolerance under the feet), the dorsal scutes sit 12 cm below the surface,
  the tail steps still meet the back edge and the slide still starts at y 3.45 / x 379.45. `dino-back.png` and
  `dino-side.png` show her standing on the back with no clipping.
- **Carousel seat — no regression.** Seat height is unchanged at 1.36, now on the stage-8 saddle pad (top 1.32);
  her feet land between the cantle (x −0.30) and the pommel (x +0.27), the pole passes in front of her legs and
  the stirrups hang below her feet. `carousel-ride.png` / `carousel-front.png`.
- **Ferris wheel seat — one real placement bug found and fixed.** The seat was at y −0.35 inside the stage-8 cab,
  but the new bench top is at −0.94, so the rider floated 0.59 m above the bench and passed through the roof.
  The seat now sits on the bench at (0, −0.94, 0.26), which also puts her inside the cab instead of through its
  roof. The gondola is still a closed cabin, so on the ride she is mostly hidden inside it; opening the sides is
  left as a later art choice, not a regression from stage 8.

### Stage 10 — Art Plaza: a gallery yard

Art Plaza's activities were already good; the district around them was a flat chequered floor with the props in a row.

- **Paint-splattered paving.** A procedurally drawn splat sheet (96 ellipses in six paint colours with flung droplets)
  lies on the paving in the open lane, semi-transparent and polygon-offset, so the plaza reads as a place where paint
  happens rather than a showroom.
- **Four kerbed stone planters** sit in the gaps between the activities (x 813.4, 823.6, 868, 883.6): a tapered stone
  drum, a proud rim, recessed soil and a small flowering planting, placed clear of every tap target and of the lane.
- **Two easels** (x 827, 884.4) with splayed legs, a back leg, a ledge and a painting resting on it, each canvas a
  different procedurally painted abstract with a white gallery border.
- **A drying rack** (x 866.2) with two posts, a rail, three pegged canvases and clothespins, angled just behind the
  props so its paintings read above the floor line.
- **Paint pots and a brush jar** at the edge of the lane (x 830.6–833.1): four colour-topped pots with brushes leaning
  out of them and a glass jar of four more.
- **Bunting** on two poles (x 811.6 and 893.4, 3.55 m) with a sagging rope and 26 fabric flags in the six paint
  colours, high enough to clear the statue (2.7 m) and every tap target.
- Everything static is merged into one painted mesh and one fabric mesh, the flowers are two instanced meshes and each
  painting is a small textured plane: **10 meshes / 4,262 triangles** for the whole yard, and no collision entries.

### Stage 11 — Sunny Seaside: a shoreline, not a sand strip

- **Five striped parasols** (x −26, −43, −79, −106, −143, at z −4.2 … −4.8): a pale timber pole with a base
  plate, a twelve-panel cone canopy where every other panel takes the parasol's own colour, a cream rim ring and a
  brass finial. Each one is placed in a gap between the district's activities.
- **A towel and a beach ball** beside every parasol: the towel has a cream end stripe, the ball is a six-gore
  painted sphere. Both sit on the sand, clear of the walking lane.
- **Dune grass** along the back of the beach (z ≈ −7.25, x −147…−23, every 1.55 m): three arched blades per tuft in
  one instanced mesh, skipping the lighthouse steps and the pier approach.
- **Driftwood** at x ≈ −57: a weathered trunk, a broken branch and a raised splinter, clear of the crab walk.
- Everything static is merged into three meshes (timber, fabric, balls) plus one instanced grass mesh: **4 meshes /
  8,064 triangles**, no collision entries and no tap targets changed.

### Stage 12 — Whispering Woods: trunks, canopy layers and a clearing

- **Nine real trees** between the path and the back row (x −157 … −266): a tapered trunk in two bark tones, three
  limbs at different heights and angles, and four overlapping crowns stacked so neighbouring crowns meet into a
  canopy. Placed clear of the hollow log, birdhouse, hidden owl and tunnel mouth.
- **Crown fix (same stage):** the first pass used smooth vertex-tinted icosahedra, which read as plastic blobs and
  left one crown floating apart. The crowns are now lumpy meshes carrying the engine's own leaf-detail map and
  normal map (the same material recipe its trees use), tinted through vertex colours, with **44 leaf cards per
  tree** fringing each crown. The four clumps overlap inside the lower crown's radius, so nothing detaches.
- **Fern understory** on both sides of the path: three rows at z −5.1/−5.9/−6.7, four arched blades per tuft in one
  instanced mesh, skipping the six interactive props.
- **Campfire clearing** at x −165: a swept earth disc (r 2.35) under the existing stone ring, two half-log benches
  with pale cut ends, and a four-log woodpile. No new tap targets — all of it is scenery.
- Everything merges into **5 meshes / 31,688 triangles** (timber, crowns, leaf cards, ferns, earth disc), no
  collision entries.

### Stage 13 — Frosty Peaks: ridges, drifting snow and an ice arch

- **Ridgeline** at z −15.4: four faceted rock shoulders with a thick snow cap, a small cap on the outer shoulder and
  an ice peak, so the district has a horizon instead of ending flat.
- **Seven snow-loaded pines** between ridge and path: tapered trunks, three stacked cone tiers each, with a white
  snow cone over every tier.
- **Ice arch** at x −372: two clear-ice piers, a half-torus apex and an icicle, clear of the pond, igloo and penguins.
- **Wind drifts**: instanced white mounds along z −3.15 and −5.75 from x −400 to −276, stepping around the frozen
  pond, the igloo, the sledding hill and steps, the snowman and the snowball target.
- Cost: **5 meshes / 16,428 triangles**, no collision entries. First render was corrected before commit: the drifts
  were dark (instanced geometry had no vertex-colour attribute) and the ridge read as one oversized bare boulder.

### Stage 14 — Happy Farm: paddock, crops, bales and a cupola

- **Fenced paddock** at z −6.9 from x −530 to −408: posts every 2.6 m with two rails between them, left open at the
  barn yard (x −426…−414) and the windmill (x −507…−499) so it reads as a working field, not a wall.
- **Four crop rows** behind the fence: two rows of cabbages (three overlapping leafy heads each) alternating with two
  rows of carrots (orange shoulder plus five green fronds). Rows have deliberate gaps so they are not mechanical, and
  the strip behind the barn is skipped.
- **Six round hay bales** in the far field (x −521…−434), each a lying cylinder with pale cut ends.
- **Barn cupola**: cream louvred drum with a base plate, dark vent panels, a red cap, a steel spindle and a
  weathervane arrow — sitting on the roof peak, clear of the interactive barn doors.
- Cost: **5 meshes / 66,116 triangles**, no collision entries, no new tap targets.

### Stage 15 — Ocean Pier: planking, pilings and a bait shack

- **Deck detail**: a seam line every 0.42 m across the full deck, edge trim beams down both sides with short braces,
  so the deck reads as planks instead of one block. Nothing added below the walking surface, so collision is unchanged.
- **Eight pilings** along the deck edges with caps and two rope wraps each, plus **three brass mooring cleats** on the
  outer edge.
- **Bait shack** on the shore at x −545.5: timber body with corner posts, a counter and shelf proud of the front face,
  a red-and-cream striped awning on two posts, two buckets and a bait crate beside it. Placed clear of the fishing
  rod (x −552), tide pool (x −566) and crates (x −594).
- **Four lamp posts**: one on the shore, three down the outer deck edge, each with a warm glass box and a dark cap.
- Cost: **4 meshes / 3,996 triangles**, no collision entries, no new tap targets. First render was corrected before
  commit: the counter and awning had been placed inside the shack body and were invisible.

### Measured cost (single-frame A/B, same camera, group visibility only)

| Area | Batches | Geometry triangles | Δ draw calls | Δ triangles |
|---|---|---|---|---|
| Playhouse | 8 | 1,376 | +3 | +488 |
| Park | 5 | 48,692 | +5 | +48,692 |
| Castle front | 7 | 13,660 | +7 | +13,660 |
| Dino Valley | 5 | 3,960 | +5 | +3,960 |
| Castle throne room | 6 | 7,312 | +6 | +7,312 |
| Toy Town | 3 | 5,012 | +3 | +5,012 |

Method: two explicit `renderer.render()` calls with `renderer.info.reset()` between them, group visible then hidden. Reading `renderer.info` while the frame loop runs is unreliable at ~1.2 fps under software WebGL — slice merging and grass streaming change totals between reads, and produced inverted results in earlier runs.

### Stage 8 measured cost (whole object groups, same probe on both builds)

| Model | Before | After | Change |
|---|---|---|---|
| Ferris wheel (`G.wheel.group`, incl. 10 gondolas) | 37 meshes / 14,080 tris | 14 meshes / 24,708 tris | **−23 meshes**, +10,628 tris |
| Carousel (`G.carousel.group`, incl. 6 pony kits) | 97 meshes / 113,972 tris | 103 meshes / 122,612 tris | +6 meshes, +8,640 tris |
| Dino Valley ferns (85 instanced plants) | 124 tris each / 10,540 total | 512 tris each / 43,520 total | +32,980 tris, **same 1 draw call** |
| Castle facade stonework | — | ~53 pieces in 1 new material batch | **+1 draw call** |

Probe: traverse the named group on the running game and sum `index.count/3` (× instance count for
`InstancedMesh`), run against both the committed stage-7 build and this build in the same headless session.
Scene-level totals (e.g. 198 calls / 393 k tris at the castle) are **not** used as an A/B: slice streaming and
LOD depend on the live player state, so they move between runs by more than the models changed.

### Stage 15 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `pier-detail` timber (deck seams, trim, pilings, shack, lamps) | 1 | — |
| `pier-detail` rope wraps | 1 | — |
| `pier-detail` metal (cleats, lamp fittings) | 1 | — |
| `pier-detail` awning cloth | 1 | — |
| **Total** | **4** | **3,996** |

### Stage 14 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `farm-detail` timber (fence, vents) | 1 | — |
| `farm-detail` crops (cabbages, carrots, fronds) | 1 | — |
| `farm-detail` straw bales | 1 | — |
| `farm-detail` painted cupola | 1 | — |
| `farm-detail` weathervane steel | 1 | — |
| **Total** | **5** | **66,116** |

### Stage 13 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `frosty-detail` rock shoulders | 1 | — |
| `frosty-detail` snow caps and pile | 1 | — |
| `frosty-detail` pines | 1 | — |
| `frosty-detail` ice arch | 1 | — |
| `frosty-detail` drifts (instanced) | 1 | — |
| **Total** | **5** | **16,428** |

### Stage 12 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `woods-detail` timber (trunks, limbs, benches, woodpile) | 1 | — |
| `woods-detail` crowns (36 textured lumpy clumps) | 1 | — |
| `woods-detail` leaf cards (396 instanced) | 1 | — |
| `woods-detail` ferns (instanced, 4 blades per tuft) | 1 | — |
| `woods-detail` clearing earth disc | 1 | — |
| **Total** | **5** | **31,688** |

### Stage 11 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `seaside-detail` timber (poles, base plates, driftwood) | 1 | — |
| `seaside-detail` fabric (canopies, rims, towels) | 1 | — |
| `seaside-detail` beach balls (5 merged painted spheres) | 1 | — |
| `seaside-detail` dune grass (instanced, 3 blades per tuft) | 1 | — |
| **Total** | **4** | **8,064** |

### Stage 10 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `artplaza-detail` painted wood/stone (planters, easels, rack, poles, paint pots) | 1 | — |
| `artplaza-detail` fabric (26 bunting flags) | 1 | — |
| paving decal | 1 | — |
| paintings (5 textured planes) | 5 | — |
| flowers: leaves (instanced, 72) and blooms (instanced, 24) | 2 | — |
| **Total** | **10** | **4,262** |

### Stage 9 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `labgarden-detail` (paint: domes' walls, ribs, doors, beds, fences, bench, microscope, rack) | 1 | 9,284 |
| `labgarden-detail` glassware (lathed beakers/flask/tubes) | 1 | 772 |
| `labgarden-detail` copper pipework | 1 | 740 |
| `labgarden-detail` leaves (instanced, 606 leaves) | 1 | 14,544 |
| `labgarden-detail` blooms (instanced, 101 blooms) | 1 | 2,020 |
| **Total** | **5 meshes** | **28,320** |

The greenhouse panes were already in the district (3 meshes); they were re-materialled, not duplicated. Whole-scene
reads at x 695 were 90 calls / 332–407 k triangles across runs (streaming and the transparent pass move the total),
which is why the named-group probe is the number quoted here.

## Overlapping objects, duplicates and collision problems

- **The 6 "duplicate meshes" near the slide tower were fur shells**, not duplicated scenery: `fur.js` adds 5–8 `SkinnedMesh` shells per furry creature sharing one geometry and transform. Nothing was moved. The auditor now skips skinned meshes, sprites, points/lines and the off-world rehearsal group.
- **15 "floor-cutting spheres" were intentional terrain/structures**: 11 wide hill masses (x 430–897), the headland at x −158, the sky domes, the slide tube and torus, the ball-pit shell and the shaft wall. Nothing was moved; the auditor now skips wide terrain masses and `userData.grounded` props.
- **Z-fighting at the castle dance floor** was a bounding-box false positive: slice merging combines neighbouring dance tiles into one wide mesh whose box overlaps its neighbours although the surfaces never touch. The auditor now compares only true planes (height < 0.02 m); a regression test covers it.
- **Carpet vs gold trim in the throne room** were 2 mm apart and could flicker; the trim was raised to y 0.022.
- **Collision:** 12 solids and 108 platforms audit with 0 malformed, 0 duplicate and 0 heavy-overlap entries. Movement now queries an interval index instead of scanning every solid/platform each frame.

## Speed and performance

- **Collision queries:** `src/spatial.js` interval index replaces linear scans in `updatePlayer`/`groundUnder`; 8 unit tests cover filtering, ordering and overlap fraction.
- **Draw calls:** every new decoration batch is merged or instanced — one draw call per batch. All twelve detailed areas together add **62 draw calls and 206,994 triangles**.
- **Stage 7 landscape:** 29 hills + 8 mountains = **2 meshes / 2 draw calls / 51,140 triangles**, replacing 29 separate hill meshes (27 fewer draw calls for the backdrop). Single-frame read at the park: 199 draw calls, 382,430 triangles total. Rocks gained their new detail inside existing geometry (0 extra calls, 0 extra textures).
- **Texture cost:** anisotropy set once per texture on load, no per-frame work.
- **Scene audit:** runs only on demand (`window.__DDW3.audit()` or `?audit`), never in the frame loop.
- **Not measured on real hardware.** The headless environment renders at ~1.2 fps in software; frame-time comparisons there are not representative of a phone or desktop GPU, so no speed-up claim is made from them.

## Test results (latest run)

- `node tests/spatial.test.mjs` — 8/8 pass.
- `node tests/scene-audit.test.mjs` — 13/13 pass.
- `npm run build` — succeeds, `index.html` 9,957 KB.
- Headless load (Chromium headless shell + SwiftShader), stage 9 build — **0 page errors, no "Oops" fallback** at x 695 (Lab Gardens) and 771 (potting bench); the ride sweep also loaded cleanly at the carousel, the Ferris wheel and Dino Valley.
- Headless load, stage 10 build — **0 page errors, no "Oops" fallback** at x 815, 850 and 868 (Art Plaza).
- Stage 9 screenshots: 1280×720, dpr 1, `before-labgarden.png` (stage-8 build) and `after-labgarden.png` (this build) at x 695, `after-labbench.png` at x 771, `close-dome.png` and `close-bench.png` from a pinned inspection camera, and four ride/climb close-ups in `rides/`. Camera settle is waited on for every shot.
- Stage 10 screenshots in `docs/screenshots/stage10/`: `before-artplaza.png`, `before-artplaza-wide.png` (stage-9 build, x 850 / 815), `after-artplaza.png` (x 850), `after-artplaza-wide.png` (x 815, planters and easel) and `after-artplaza-rack.png` (x 868, drying rack and paint pots).
- Audit (`window.__DDW3.audit()`) at x 724, stage 9 build: **duplicates 0, z-fighting 0**; solids 12 (0 malformed / 0 duplicate / 0 heavy overlaps); platforms 115 (0 malformed). `buried` reports 3–5 bounding-box candidates (the same intentional hills/terrain class as stages 7–8); the report exposes only geometry type names, so individual attribution is not possible from the JSON.
- Audit at x 815, 850 and 868, stage 10 build: **duplicates 6, z-fighting 0**; the six are the little character face spheres at local (0.06, 0.5, 0.1) — pre-existing, not scenery. Solids 12 (0 malformed / 0 duplicate / 0 heavy overlaps); platforms 108 (0 malformed); `buried` 3.
- Model probe (`labgarden-detail`): **5 meshes / 28,320 triangles** (paint 9,284, glassware 772, copper 740, leaves 14,544 across 606 instances, blooms 2,020 across 101).
- Model probe (`artplaza-detail`): **10 meshes / 4,262 triangles** (merged wood/stone, fabric flags, paving decal, five canvases, instanced leaves and blooms).
- Model probe (`seaside-detail`): **4 meshes / 8,064 triangles**.
- Model probe (`woods-detail`): **5 meshes / 31,688 triangles** (after the crown fix).
- Model probe (`frosty-detail`): **5 meshes / 16,428 triangles**.
- Model probe (`farm-detail`): **5 meshes / 66,116 triangles**.
- Model probe (`pier-detail`): **4 meshes / 3,996 triangles**.
- Audit at x −600 and −650, stage 15 build: **z-fighting 0**, duplicates 6 (character face spheres), solids 12 and
  platforms 114 all well formed, 0 page errors. Extra shots at x −552 and −541 confirmed the deck trim, pilings,
  cleats, lamps and the corrected bait-shack frontage.
- Audit at x −470 and −500, stage 14 build: **z-fighting 0**, duplicates 6 (character face spheres), solids 12 and
  platforms 114 all well formed, 0 page errors. A third shot at x −424 confirmed the cupola sits on the barn roof peak.
- Audit at x −320 and −370, stage 13 build: **z-fighting 0**, duplicates 6 (character face spheres), solids 12 and
  platforms 115 all well formed, 0 page errors.
- Audit at x −200 and −250, stage 12 build: duplicates 6 (character face spheres, unchanged), **z-fighting 1 at x −200**
  (a pre-existing ground-plane seam at y 0.029 — the stage-11 baseline shows the same one), buried 10 vs 8 baseline
  (same terrain artefacts, none in the woods), solids 12 and platforms 111 all well formed, 0 page errors.
- Audit at x −43, −100 and −143, stage 11 build: **duplicates 6** (the character face spheres), **z-fighting 0**;
  solids 12 (0 malformed); platforms 108 at x −43 and 111 at x −100/−143 (0 malformed); `buried` 3–7 (known terrain class).

## Remaining issues and unverified work

- **Real-device performance** (phones, low-end tablets) is still unknown; only geometry/draw-call cost is measured. No FPS claim is made. Stage 9 adds 28.3 k triangles to one streamed district (5 draws), the largest single-district addition so far, so it is the first thing to trim if a phone struggles.
- The audit only sees built scene slices, so counts depend on where the player is standing; sample labels are generic geometry names.
- Stage 8 screenshots were captured with a headless Chromium that has **no emoji font**, so HUD icons are blank tiles in the evidence PNGs. Layout, camera framing and 3D content are unaffected; install `fonts-noto-color-emoji` before the next capture if a pretty HUD is needed.
- The headless renderer runs in software (SwiftShader) at roughly 1 fps; it is used for framing and geometry evidence, never for frame-rate claims.
- Narrow Dino Valley camera at x 368 cuts Dottie's head/neck off at the right edge (same framing as the stage-7 baseline, kept deliberately for comparison). A second camera at x 384 would show the whole animal.
- The `?nodetail` A/B switch covers the stage 2–7 detail groups, not the stage 8 model rebuilds (those are in-place replacements, measured by group probe instead).
- Remaining rail-corridor checks are bounding-box based, not a visual pass with the train running.
- The Ferris gondola is a closed cabin: the rider now stands correctly on its bench (seat at −0.94) but is still
  mostly hidden inside it during the ride. Opening the sides is an art decision for a later pass, not a bug.
- 12 of 26 areas still have no geometry pass; no planet has had one yet.

## Resuming after an interruption (exact steps)

Build and verify (takes ~1 min + ~1 min):

```bash
cd discovery-world/3d
npm ci                       # lockfile is committed; never upgrade deps to restore them
npm run build                # writes index.html (~9.9 MB, committed)
node tests/scene-audit.test.mjs && node tests/spatial.test.mjs
```

Headless capture (the harness is committed; `npm ci` already installs its only dependency, Playwright):

```bash
cd discovery-world/3d
npx playwright install chromium-headless-shell    # one-off ~90 MB browser download, never committed
node tools/capture.cjs docs/screenshots/stage9 '[["after-labgarden",695],["after-labbench",771]]' \
  --probes '{"lab":"D.scene.getObjectByName(\"labgarden-detail\")"}'
```

On a bare Linux VM add the browser's system libraries with `npx playwright install-deps chromium` (the
`LD_LIBRARY_PATH` export used on this VM is only needed when those libraries live outside the default path).
Probe expressions are evaluated with `D` = `window.__DDW3`, so `D.G.wheel.group` or
`D.scene.getObjectByName('dino-detail')`; they run after every shot because streamed detail groups only exist
once the player is near. `WARMUP`, `SETTLE`, `WIDTH`, `HEIGHT`, `HTML` and `LOG` are documented in the file
header. The harness waits for the Blender landmark GLBs and until the camera stops easing before each shot.

For a "before" image, build the previous commit elsewhere and point `HTML=` at it:

```bash
rm -rf /tmp/before && mkdir -p /tmp/before
git archive <commit> discovery-world/3d | tar -x -C /tmp/before
ln -s "$PWD/discovery-world/3d/node_modules" /tmp/before/discovery-world/3d/node_modules
(cd /tmp/before/discovery-world/3d && npm run build)
HTML=/tmp/before/discovery-world/3d/index.html node discovery-world/3d/tools/capture.cjs docs/screenshots/stage9 '[["before-castle",404]]'
```

## In progress / next (stage 11 onward)

0. **Art Plaza — done (stage 10)** and **Sunny Seaside — done (stage 11):** parasols, towels, beach balls, dune
   grass and driftwood; 4 meshes / 8,064 triangles, audit clean, evidence in `docs/screenshots/stage11/`.
1. **Whispering Woods — done (stage 12):** nine trees with limbs and four-layer crowns, fern understory, campfire
   clearing; 4 meshes / 22,256 triangles, evidence in `docs/screenshots/stage12/`.
2. **Frosty Peaks — done (stage 13):** snow-capped ridgeline, snow-loaded pines, ice arch, wind drifts;
   5 meshes / 16,428 triangles, evidence in `docs/screenshots/stage13/`.
3. **Happy Farm — done (stage 14):** fenced paddock, four crop rows, six round bales, barn cupola and weathervane;
   5 meshes / 66,116 triangles, evidence in `docs/screenshots/stage14/`.
4. **Ocean Pier — done (stage 15):** deck planking and trim, eight rope-wrapped pilings, three cleats, a striped bait
   shack and four lamps; 4 meshes / 3,996 triangles, evidence in `docs/screenshots/stage15/`.
5. **Balloon Hills** (next): layered hill terraces, moored balloons with baskets, bunting between poles and
   wildflower drifts; capture before/after at x −720 and −760, run the audit, then sync the PR.
6. Then the planets.
3. **Planets** in order Moon → Mercury → Venus → Mars → Jupiter → Saturn → Uranus → Pluto: crater rims and ejecta
   rays, layered regolith colours, ring geometry, cloud bands; reuse the loft/vertex-colour helpers from stage 7/8.
4. **Characters and pets:** material/shape pass only (no rig changes) — fur shell tuning, eye catches, bevels.
5. Re-capture with an emoji font installed so the HUD in the evidence PNGs is complete.
6. Then run a real-device pass (iPhone Safari / Android Chrome) before any frame-rate claim.

Each stage: implement, build, run both test files, capture a paired screenshot set with the harness above,
run the audit, update this file, commit and `cloud_git push` to `main` of `dawsons-world-test` only — never to
the original repository's `main`. Then run the `Sync the 3D overhaul` workflow on `feature/full-3d-overhaul`
(Actions → Sync the 3D overhaul → Run workflow) and confirm PR #104's head commit and files moved.
