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
| 15 | Ocean Pier: plank seams and edge trim on the deck, eight pilings with rope wraps and caps, three brass mooring cleats, a striped bait shack with a counter and buckets, and four lamp posts | `5761fce` | 21 tests, build 9,957 KB, paired screenshots, audit clean, `pier-detail` measured |
| 16 | Balloon Hills: three moored balloons with striped envelopes, baskets, ropes and stakes, two bunting lines, wildflower drifts along the path, and two pale terrace shelves behind the hills | `633068f` | 21 tests, build 9,960 KB, paired screenshots, audit clean, `hills-detail` measured |
| 17 | Adventure Trail: sagging rope handrails and ties on the bridge, two stratified rock cliffs, a waterfall with plunge basin and mist, and a plank lookout deck with a rope rail | `27f6b8d` | 21 tests, build 9,963 KB, paired screenshots, audit clean, `trail-detail` measured |
| 18 | Playhouse: a curtained stage with an open gap, backdrop, valance, rail and six footlights; a prop chest; a cushioned reading nook with pillows and a book box; two lower lanterns | `462b80b` | 21 tests, build 9,964 KB, screenshots, audit clean, `playhouse-detail` measured |
| 19 | Studio: an easel wall (two easels, drying rack with pegged and leaning canvases), a pottery wheel with four finished pots, and a paint-splattered workbench with brush jar and palette | this commit | 21 tests, build 9,967 KB, screenshots, audit clean, `studio-detail` measured |

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
- **Bait shack** at x −545.5, **set back to z −5.7** (a follow-up fix: at z −4.5 its counter, awning and posts reached
  into the walking lane). Timber body with corner posts, a counter and shelf proud of the front face, a red-and-cream
  striped awning on two posts, two buckets and a bait crate. Clear of the fishing rod (x −552), tide pool (x −566)
  and crates (x −594).
- **Four lamp posts**: one on the shore, three down the outer deck edge, each with a warm glass box and a dark cap.
- Cost: **4 meshes / 3,996 triangles**, no collision entries, no new tap targets. First render was corrected before
  commit: the counter and awning had been placed inside the shack body and were invisible. Re-captured afterwards
  from x −556 (deck planking, pilings, cleats, lamps) and x −541 (set-back shack), because the requested x −600/−650
  views look down the beach rather than at the pier itself.

### Stage 16 — Balloon Hills: moored balloons, bunting and flowers

- **Three moored balloons** (x −747, −769, −792) with two-colour banded envelopes, wicker baskets, four ropes each and a
  ground stake, sized smaller than the flyable balloon so it still reads as the one you ride.
- **Two bunting lines** between timber poles (x −726.5…−732.2 and −757.5…−763.8) with 11 flags each, hung on a sagging
  rope — clear of the goats and the echo rock.
- **Wildflower drifts** along the path (three rows): merged stems plus an instanced bloom per flower, 200+ flowers in
  six colours, skipping the flyable balloon, kites, slide hill, goats, echo rock and long-legs drawing.
- **Two terrace shelves** behind the hills: pale flat-topped steps that layer over the existing green bumps.
- Cost: **6 meshes / 10,616 triangles**, no collision entries, no new tap targets. The first render had black flower
  heads (instanced colours on geometry without a colour attribute) and was fixed before commit.

### Stage 17 — Adventure Trail: rails, cliffs, waterfall and a lookout deck

- **Bridge handrails**: posts with caps at both ends of the deck, a sagging rope in six segments per side, and vertical
  rope ties every 1.8 m. The deck planks and the stream crossing are untouched.
- **Two stratified cliffs** behind the path (x 460 and x 508): lumpy rock shoulders with dark stratum lines and two
  fallen boulders at each foot — the first pass used stacked boxes, which read as grey steps and was rebuilt.
- **Waterfall** at x 459.4: a two-layer water sheet with a plunge basin ringed in stone and nine mist puffs. It was
  moved proud of the cliff face (z −9.05) after the first capture showed the rock swallowing the sheet.
- **Lookout deck** at x 484.6 on the top rock, behind the telescope: six planks, two bearers, four posts and a rope rail.
- Cost: **5 meshes / 2,512 triangles**, no collision entries, no new tap targets.

### Stage 18 — Playhouse: stage, footlights and a reading nook

- **Stage** (x −13.6, back wall): a low plank platform, a timber rail and valance, two pleated maroon curtain panels with
  an open gap between them, a pale backdrop in the gap, and six warm footlights in little holders. The first attempt had
  the panels meeting in the middle (a solid curtain wall that also hid the toy shelf) and was rebuilt open.
- **Prop chest** with a brass lid band and clasp at x 29.5.
- **Reading nook** at x 33.5: a soft base, a cushion, three throw pillows and a low book box with four board books.
- **Two lower lanterns** over the stage and the nook, hanging on long cords.
- Cost: `playhouse-detail` now **17 meshes / 3,588 triangles**, no collision entries, no new tap targets. The nook was
  first placed at x 6.5/z 5 (behind the camera in the house view) and moved into the visible back wall run.

### Stage 19 — Studio: easels, pottery wheel and workbench

- **Easel wall** (x 74–82, against the studio wall): two A-frame easels with boards and wet paintings, a rail with two
  pegged canvases and three canvases leaning in a drying row.
- **Pottery wheel** at x 71.4 with a splash pan, a stool and four finished pots on a drying board.
- **Workbench** at x 84.6: top, legs, a shelf, a brush jar with four brushes and a palette, with paint splats on the top
  and on the floor around it.
- Cost: `studio-detail` **4 meshes / 1,222 triangles**, no collision entries, no new tap targets. The first pass had
  paintings that covered only a corner of each board (they read as sticky notes) and a bench standing behind an existing
  cylinder, so both were reworked.

### Stage 20 — Wonder Lab: glassware, specimens and microscope

- **Glass-tube bench** (x 101.6–105.6, against the lab wall): a burner tripod with a real cone of flame heating a small
  flask of green liquid, two large round-bottom flasks in pink and blue liquid joined by a glass bridge tube with
  bubbles rising in both, and a rack of five test tubes in coloured liquid.
- **Specimen shelves** at x 110.7: a three-tier wooden unit of glass jars, each with a lid and a coloured specimen
  inside.
- **Microscope table** at x 121: a heavy bench with a complete optical microscope (base, pillar, arm, tilted body tube
  and eyepiece, three objectives, a stage with a glass slide, mirror and paired focus knobs), a slide box and a
  three-legged stool drawn up to it.
- **Glass-front cabinet** at x 128 with two more tiers of jars and a pinned butterfly in a little frame.
- Cost: `lab-detail` **6 meshes / 10,332 triangles**, no collision entries, no new tap targets. The first pass had flasks
  too small to read from the path and an empty right half of the bench, so the glassware was enlarged and the tripod,
  bridge tube and test-tube rack added.

### Stage 21 — the Moon: crater rims, ejecta rays and layered regolith

- **Crater rims**: 37 more craters (34 small pits plus three young ray craters beside the walkway), each with a raised,
  brightened crest; the giant coaster crater and the existing valley craters keep their shape and collision.
- **Ejecta rays**: ten young craters throw pale radial rays out across the maria, fading with distance. They are painted
  into the terrain colour with an angular-noise mask, so they add no geometry.
- **Layered regolith**: four grey strata banded by height and noise, dark basalt maria blended over them, thin dark
  layers in the crater walls and pale fresh material on the crests and rays.
- **Detailed surface**: 54 extra pebbles between the boulders, finer two-scale mottling and small pits.
- Cost: Moon ground mesh **1 mesh / 25,904 triangles** (21,584 before the 54 pebbles), no new collision entries or tap
  targets. Two passes were rejected by looking at the captures: a pale palette washed the rays out under the Moon's
  3.5-strength sunlight, and a ground-hugging ribbon mesh for the rays draped over crater walls as floating white
  shards; the final version paints the rays into the regolith instead.

### Stage 22 — Mercury: crater rims, ejecta rays and layered regolith

- **Terrain resolution raised for Mercury only**: `terrainSteps` runs at `nx 224, nz 88` for this place (about 0.5 m
  between columns near the path). At the default 128x54 grid the cells were 1-2 m wide, so every rim was averaged
  away and the surface rendered as smooth dunes. Cost: ground mesh **1 mesh / 51,464 triangles** (25,864 before);
  no new collision entries or tap targets.
- **Two wide, shallow showpiece basins** beside the walkway (r 13 at x+34 and r 9 at x+76, 2.6 m and 2 m deep, rims
  only 0.5 m). A deep, steep crater is invisible from the game's 2.5 m walking camera: its own near rim hides the bowl,
  which is why earlier deep/tall-rim versions read as banks.
- **One-time crater overlook**: the first time the player comes within 24 m of the first basin (and no other camera
  override is active) the camera eases into a 6 s oblique shot of the bowl and back again, with a spoken line. It is
  gated on `G.mercuryCraterSeen`, so later passes use the ordinary walking camera - the evidence set includes the same
  spot revisited after the reveal to show that.
- **Ejecta rays that read from the walking camera**: wider angular mask (about 3.2 lobes per turn instead of the old 4.2
  with a tighter threshold), a 0.9 white blend, dark lanes between them, and a reach of 5 r from the two showpieces (2.1 r
  from the other ray craters). The bright fresh rim ring was narrowed to 0.88-1.5 r so the plain around it stays dark
  enough for the pale streaks to stand out.
- **Soft rim ring**: floor and rim colours blend over wide gradients (about 0.2-0.3 r of ramp) rather than hard bands,
  so the stepped edge the earlier build showed is gone.
- **Regolith**: four dark warm-grey strata banded by height, dark smooth plains, thin dark wall layers, bright volatile
  hollows and 46 extra pebbles. Mercury's sun was eased from 3.9 to 2.9 so bright rims and rays are not clipped.
- `tools/capture.cjs` gained `--cam '{"pos":[dx,y,z],"look":[dx,y,z]}'` (a pinned inspection camera relative to the
  place start), kept for model and terrain inspection; the stage-22 evidence itself uses the normal walking camera.

Evidence in `docs/screenshots/stage22/`, all from the normal camera: `mercury-crater.png` (the one-time overlook on
first approach), `mercury-rays.png` (walking past the second basin, with the dark bowl and pale rays), `mercury-rays-again.png`
(the same spot after the reveal, back on the walking camera) and `mercury-plains.png`.

Audit at x 8, 14, 22 and 38: **z-fighting 0, 0, 0, 1**; the x-38 sample is the pre-existing pair of ground planes 2.9 cm
apart at y 0.029 (the same class as the stage-12 x -200 sample). Solids 12 and platforms 108, none malformed, 0 page
errors. No FPS claim.

### Stage 23 — Venus: layered cloud deck and volcanic plains

- **Terrain resolution raised for Venus**: `terrainSteps` runs at `nx 240, nz 90` for this place (about 1.8 m between
  columns) instead of the shared grid, so the plains can carry landforms instead of averaging into smooth dunes.
  Cost: ground mesh **1 mesh / 49,660 triangles**; whole place **35 meshes / 129,200 triangles** at the approach.
- **Real Venus landforms on the shared unit shapes**: eight flat-topped pancake domes (5-9 m across, 3.4-5.4 m tall)
  beside the walkway, ten cinder cones, four blocky **tessera highlands** (26-40 m across, 9-17 m tall) on the horizon,
  stacked lava-flow aprons around the three volcanoes, and **branching lava channels** cut 3.2 m into the ground.
- **Readable surface detail**: every colour feature is at least ~4 m across so the vertex grid can carry it - dark
  basalt flow lobes with pale flow fronts, pale tessera blocks with dark fractures between them, bright sunlit dome
  tops against dark skirts, shaded channels with glowing orange seams, sulphur streaks and thin dark strata. Eleven
  sulphur fumaroles with glowing mouths stand along the path.
- **Layered cloud deck**: three translucent sheets of cloud at 9 m, 16 m and 26 m (opacity 0.42, one shared material
  created once), each a continuous run of overlapping billows rather than separate puffs, drifting at 0.55, 0.95 and
  1.5 m/s and wrapping around the place, so the approach reads as stacked cloud layers with the far volcano pushing
  through them.
- Iterations rejected after inspecting captures: solid opaque puffs that read as flying saucers, and high-frequency
  colour noise that the 1.8 m grid averaged back into a plain slope (replaced with 4-20 m features).

Evidence in `docs/screenshots/stage23/`, from the planet approach and the walkway: `venus-approach.png` (the three
cloud sheets over the plains), `venus-plains.png` (the near volcano with the glowing lava river and terraced
highlands) and `venus-domes.png` (dome country and fumaroles beside the path).

Audit at x 12, 40, 70 and 120: **z-fighting 0** at all four, solids 12 and platforms 108, none malformed, 0 page
errors. No FPS claim.

### Venus measured cost, and what was trimmed

Measured on the stage-23 build at the planet approach (x 40, normal walking camera, one explicit
`renderer.render()` with `renderer.info`, per-mesh breakdown over the `space:venus` group):

| Item | Before | After |
|---|---|---|
| Draw calls in the frame | 57 | **57** |
| Triangles in the frame | 133,830 | **113,622** |
| Whole Venus place | 35 meshes / 129,200 tris | 35 meshes / **108,992** tris |
| The six translucent cloud sheets | 43,200 tris | **22,992** tris |
| Ground mesh (unchanged) | 49,660 tris | 49,660 tris |

The clouds were the only heavy item: 360 low-poly billow spheres at 120 triangles each. Each cluster now
uses three wider billows instead of four, and the two far sheets (100 m and 170 m out) use an 8x5 ball (64
triangles) instead of the 10x7 one, which is indistinguishable at that distance. Same six meshes, same six
draw calls, same deck silhouette. The ground is 1 mesh and 1 draw call and stays at full detail.

### Stage 24 — Mars: layered dust haze and readable rock fields

- **Resolution**: `terrainSteps` runs at `nx 220, nz 84` for Mars (about 2 m between columns near the walkway),
  so the far ground can hold canyons and stepped buttes instead of one smooth dune wall. Ground mesh **1 mesh /
  59,440 triangles**; whole place **41 meshes / 101,562 triangles** at the approach; the frame at the approach is
  **54 draw calls / 101,516 triangles** (the extra streamed sections add meshes later, as before).
- **Canyons and buttes**: two canyons cut 9 m and 7 m into the plains (the near rim about 40 m out), and three
  stepped buttes beside the path - four flat terraces each, 6.5-12 m across and 5-9 m tall - so the ground has a
  landmark with readable rock faces.
- **Layered ochre palette**: four-stop banded canyon and butte walls, dark basalt fields, pale wind-blown drift dust,
  ochre layers across the dune slopes, a shaded canyon floor and soft wind streaks, all anchored on the ochre base.
- **Rock fields**: ten clusters of four to seven stacked, dust-capped boulders (lighter caps on the up faces), each
  with a six-stone grit apron, alongside 80 scattered rocks and 8 front rocks. The clusters read as groups with
  contact shadows instead of an even scatter.
- **Layered dust haze**: three translucent sheets of fine dust at 1.7 m, 3.8 m and 6.6 m (one shared material,
  opacity 0.27) drifting at 0.5, 0.85 and 1.25 m/s and wrapping around the place, so the far ground fades away in
  layers instead of ending on a hard silhouette.
- **Rover and dust devil kept working**: their code is unchanged; a live check tapped both and let 2.6 s of the
  running loop pass, and 18 objects moved (the rover group drove 2.46 m and turned, the dust-devil segments swayed
  0.14-0.39 m and turned), with 0 page errors.
- First capture rejected after inspection: the canyon sat too far back to read, the wall strata and haze were too
  subtle, and the boulder clusters looked like the old even scatter. Moved the near canyon to a rim about 40 m out,
  strengthened the steep-wall palette and the haze opacity, and enlarged the clusters with pale dust caps.

Evidence in `docs/screenshots/stage24/`, normal walking camera: `mars-approach.png` (haze layers and the canyon
behind the rocket), `mars-rover-dustdevil.png` (rover at the frame edge, the dust devil, boulder clusters and a haze
band across the ground) and `mars-canyon.png` (stepped butte, terraced mesas and the second haze layer).

Audit at x 12, 40, 70 and 120: **z-fighting 0** at all four, solids 12, platforms 108/126/126/126, 0 malformed,
0 duplicate or heavy-overlap solids, 0 page errors. No FPS claim.

### Venus re-checked after the cloud trim

Re-captured Venus after the trim at the planet approach and at two walking-camera spots
(`docs/screenshots/venus-recheck/`): **57 draw calls / 113,622 triangles** at the approach, **60 / 109,098** walking the
plains and **57 / 122,010** further along. The three sheets still read as one continuous bank of cream cloud in all
three views, so nothing was restored on the near sheet. Evidence only, no FPS claim.

### Stage 25 — Jupiter: banded depth, a layered Great Red Spot, readable moons

- **Banded deck with real depth**: Jupiter alone runs `nx 168, nz 62` (ground mesh **1 mesh / 20,832 triangles**, up
  from 12,000) with its own six-colour belt/zone palette, warped so no band is straight. The deck's height follows the
  bands - soft ridges on the zones, troughs on the belts, lumpy cloud tops behind and a banked far deck - so the belts
  recede in layers.
- **Cloud banks in rows**: fifteen random five-puff heaps became four band-aligned rows of wide, half-buried domes (18
  banks), each row flatter and larger than the one in front, so the belts show through to the horizon. Whole place
  **45 meshes / 96,216 triangles** at the approach (was 36 / 86,048), frame **58 draw calls / 98,754 triangles**.
- **Great Red Spot**: four layered parts instead of one decal - a raised pale foam collar, a brick-red ring with two
  bright spiral arms, a pale inner ring and a deep dark eye, domed and turning at different speeds - plus two raised
  spiral arcs standing out of the bowl and five small counter-spinning eddies. Frame at the storm **68 draw calls /
  99,228 triangles**.
- **Readable moons**: all four are painted at a 256 map (was 128), closer and larger (Io 5.6, Europa 4.8, Ganymede 7.0,
  Callisto 6.0 m radius, 125 m out) and carry a little of their own light (emissive map, 0.5), so the side turned away
  from the sun still shows Io's sulphur blotches, Europa's cracks, Ganymede's bright patches and Callisto's pale
  craters. A tap check ran the Great Red Spot, moon-count and lightning interactions with 0 page errors and four moons
  present.
- **Wisps**: Jupiter's two drifting wisp layers sit lower and rounder, so they read as streaks on the deck instead of
  floating plates.
- Rejected after inspection: a flat-decal storm (read as a smear on the ground) and pancake-shaped cloud banks that
  floated above the deck.

Evidence in `docs/screenshots/stage25/`, normal walking camera plus one look-up camera: `jupiter-approach.png`
(belts and zones running past the rocket), `jupiter-bands.png` (banded ridges receding, cloud banks in rows),
`jupiter-redspot.png` (the layered storm beside the path) and `jupiter-moons.png` (three moon discs with their own
surfaces).

Audit at x 12, 44, 72 and 120: **z-fighting 0** at all four, solids 12, platforms 108/113/113/113, 0 malformed,
0 duplicate or heavy-overlap solids, 0 page errors. No FPS claim.

### Stage 26 — Saturn: banded rings, a banded deck with depth, a readable hexagon

- **Rings with real gaps and banding**: the single 128-segment annulus with a 256-px alpha strip became four separate
  220-segment annuli - the faint C ring (190-226), the bright B ring (231-272), the A ring (279-301) and the thin F
  ring (306-310) - so the Cassini division between B and A is open sky, not painted transparency. The shared strip is
  1024 px with one-pixel ringlets, a narrow division inside B, the Encke gap inside A and a soft F ring; each band
  keeps its own opacity, and the tap target and the "millions of pieces of ice" fact moved to the B ring.
- **Banded deck with depth**: Saturn now uses Jupiter's banded-deck code at `nx 150, nz 58` (ground mesh **1 mesh /
  17,400 triangles**, up from 12,000) with its own gold palette, wind combs, curls and oval storms. The deck's height
  follows the belts and zones - weaker and lower than Jupiter's - and the twelve random five-puff heaps became three
  band-aligned rows of half-buried domes, so the belts recede instead of being covered by blobs.
- **Hexagon storm**: the four flat 16 cm hexagon plates became a five-tier stepped hexagonal vortex with real walls,
  2.2 m tall, alternating cream and amber tiers, a dark skirt at each tier's foot and foam caps on the corners, with a
  dark hexagonal eye on top. The tiers counter-rotate (faster when tapped) and the storm now reads from the walking
  camera instead of looking like a gold platter.
- **Wisps**: Saturn's drifting wisp layers sit low on the deck as thin streaks, so nothing floats like a plate.
- Rejected after inspection: the first tier palette was all cream (the steps vanished into the cream deck) and the
  first hexagon was still four flat plates.

Evidence in `docs/screenshots/stage26/`, normal walking camera: `saturn-approach.png` (the ring arch with its
banding and divisions), `saturn-bands.png` (a broad belt and cream zones across the deck) and `saturn-hexagon.png`
(the stepped hexagonal storm beside the path).

Audit at x 12, 44, 72 and 120: **z-fighting 0** at all four, solids 12, platforms 113, 0 malformed, 0 duplicate or
heavy-overlap solids, 0 page errors. No FPS claim.

### Stage 27 — Uranus: narrow rings with real gaps, a banded deck with depth

- **Rings with real gaps**: the single 128-segment disc painted with five alpha bands became eight separate
  200-segment annuli - rings 6, 5 and 4, then alpha, beta, gamma, delta and the wide, bright epsilon ring - so every gap
  between them is real open sky instead of a painted lane. The shared strip grew from 128 px to 1024 px of ringlet
  grain mapped across each ring's own width, with soft edges and its own opacity per ring; the wide epsilon ring is the
  new tap target and explains that Uranus has 13 narrow rings. The rings stay upright in the sky (Uranus is tipped right
  over on its side) and the tilt was opened slightly so the gaps read.
- **Banded deck with depth**: Uranus now shares the banded-deck code at `nx 150, nz 58` (ground mesh **1 mesh / 17,400
  triangles**, up from 12,000) with its own ice-blue palette, wind combs, curls and small oval storms. Its belts are the
  shallowest of the three (height strength .62 against Saturn's .8 and Jupiter's 1), so the deck reads as banded and
  ridged without losing the calm look of the real ice giant.
- **Cloud banks and wisps**: the seven random five-puff heaps became three band-aligned rows of half-buried domes, so
  the belts recede instead of being buried, and the wisp layers lie low on the deck as thin streaks.
- **Kept working**: the rolling planet and the diamond cloud were re-tapped after the change. The ball travelled 13.95 m
  and turned 18.6 rad - exactly the distance divided by its 0.75 m radius, so it still rolls without sliding - and the
  gems spawned and fell, with 0 page errors.

Evidence in `docs/screenshots/stage27/`, normal walking camera: `uranus-approach.png` (the ring arch cut into separate
rings above the deck), `uranus-deck.png` (a teal belt against pale zones with the ridged horizon behind) and
`uranus-rings.png` (the full upright ring system).

Audit at x 12, 44, 72 and 120: **z-fighting 0** at all four, solids 12, platforms 108/114/114/114, 0 malformed,
0 duplicate or heavy-overlap solids, 0 page errors. No FPS claim.

### Stage 28 — Neptune: a banded deck with depth, and the Great Dark Spot kept readable

- **Banded deck with depth**: Neptune now shares the banded-deck code at `nx 150, nz 58` (ground mesh **1 mesh / 17,400
  triangles**, up from 12,000) with its own deep-blue palette, wind combs, curls and oval storms - the strongest belts of
  the four (height strength .9 against Jupiter's 1). The banked far deck rises behind the ridges, so the deck recedes in
  layers instead of rolling as one smooth sheet.
- **Cloud banks and wisps**: the ten random five-puff heaps became four band-aligned rows of half-buried domes, and the
  wisp layers lie low on the deck as thin streaks, still driven at Neptune's fast speed.
- **The Great Dark Spot, visible from the walk**: the storm used to be a painted oval about 62 m out, where only a
  look-out camera could find it - at walking height a flat decal is seen almost edge-on and vanishes. It is now a raised
  stepped vortex beside the walkway at offset 110: a thin pale rampart, three rings each lower and darker than the one
  outside it, the cloud drawn out into two spiral arms with a shadow on every inner wall, a dark eye, and two pale arms
  standing out of the funnel, each turning at its own speed. It sits over its painted oval on the banded deck, so the
  storm keeps a wide dark reach (darkest deck vertices luminance 0.021 against a 0.213 median), and it reads as a funnel
  rather than a dark puddle from the normal walking camera, and is tappable.
- **The plateau, measured on a frozen frame**: the calm plateau under the storm is real and it stays, but two of its
  retunes were effectively no-ops, and pixel-diffing separate browser runs cannot show that - two runs of the *same*
  build differ by 523,963 pixels because the clouds drift. The A/B therefore stops the frame loop, renders one camera
  twice, and swaps the plateau on and off in place by dividing the deck heights by its factor; the control is exact
  (0 pixels between two renders of one state). Measured against that, at the walking camera x 99: a 24 m x 7 m falloff
  moved 60 of 8,909 deck vertices by at most 9.7 cm and changed **0 pixels**; 42 m x 20 m reached only 989 pixels (max
  channel difference 78, a thin crest line); the shipped 70 m x 38 m clearing moves 1,599 vertices by up to 3.68 m and
  changes **38,874 pixels** (4.2% of the frame, max 150). It blends the ridges down to a 0.35 m shelf and is gated by
  `sstep(-7, -13, z)`, which is exactly 0 within 7 m of the walkway, so the path cannot be raised. (The earlier
  13,700-pixel figure came from the pre-fix look-out camera and is superseded by these measurements.)
- **Kept working**: the windsock's gust still pushes the player (3.79 m in 1.6 s) and the wind-ride button still blows
  for the swings (windBlow 3.48 with the empty swings lifted), with 0 page errors.

Evidence in `docs/screenshots/stage28/`: `neptune-approach.png` and `neptune-deck.png` (the banded, ridged deck with
its banked far deck behind), and `neptune-dark-spot.png` (the storm from the normal walking camera at x 99, beside the
player, with its pale collar and dark bowl).

Audit at x 12, 44, 72 and 99: **z-fighting 0**, solids 12, platforms 108, 0 malformed, 0 duplicate or heavy-overlap
solids, 0 page errors. One run earlier flagged a pair of streamed scenery planes 1.8 cm apart at x 44; it did not
reproduce in two reruns, so it is a streaming artefact rather than a deck regression. No FPS claim.

### Stage 29 — Pluto: a layered surface with depth, and the heart plain kept playable

- **A real terrain grid**: the ground went from the default 128x54 sheet to `nx 208, nz 82` (about 2 m columns where you
  walk), so the scarps, the plain edges and the ice peaks are carried by geometry instead of being averaged away. Ground
  mesh **1 mesh / 40,772 triangles**; the walkway strip and the ice-slide lane still measure exactly flat (largest
  deviation 0.000 m across 57 lane vertices).
- **The heart plain, with depth**: Pluto's nitrogen-ice plain (Sputnik Planitia) is now a **heart-shaped basin 6.2 m deep
  with a 3.2 m raised tholin rim** on open ground at x +205 (z -34, 30x28 m), on its own shelf 12 m off the heart-glacier
  mountain rather than inside it. The outline is the glacier's own bezier heart, sampled to 64 points and turned into a
  signed-distance field, so the two lobes, the top notch and the point drive both the height and the colour, and a dark
  tholin line follows the rim. Its near edge stops at z -6, so the walkway itself stays flat.
- **Checked from above, then fixed**: a pinned top-down camera showed the first basin as an *oval* - the implicit curve
  `(u^2+w^2-1)^3 - u^2 w^3` has no notch at these proportions - and its old centre sat inside the heart-glacier
  mountain's smooth-face suppression, which punched out the upper half. Moving the plain to x +205 and re-cutting it with
  the bezier outline fixed both: the same pinned camera now reads a heart, with both lobes, the notch and the point
  visible (`heart-top.png`), and the surrounding tholin crust grades into the plains instead of hiding it. Terrain relief now spans -5.85 m (plain floor)
  to +36.5 m (the ice mountains beyond), where the old sheet had one jagged ridge band and a flat painted patch.
- **Layered surface**: a tholin-stained crust with stacked frost strata exposed on the scarps, a dark tholin stain, the
  bright ice plain floor with polygonal convection cells and darker lanes between them, a tholin rim around the plain,
  and bright ice with crevasse shadows on the high ground. All colour features sit at 5-40 m scales, so the new grid can
  resolve them.
- **The ice mountains**: three angular peaks (14/17/12 m of relief over 30-38 m radii) stand beyond the plain, built from
  a sharpened ridge function rather than smooth domes, with strata and crevasses in their flanks.
- **Kept working**: the bounce castles still launch the player (standing on a 0.48 m pad at 0.54 m, the pad threw them to
  vy **4.07** and y 1.11), a squish-maze wall still squishes (**4 walls to 3** on tap), the picture-matching game is built
  (`G.plutoMatch` present), and the heart's slippery ice lane still slides (coasting **0.35 m** against 0.22 m off the lane
  from the same speed). The heart glacier, Charon and every tap still work, with 0 page errors.

Evidence in `docs/screenshots/stage29/`: `pluto-approach.png` (the landing pad under the layered peaks),
`pluto-heart-plain.png` (the ice basin with its bright floor and banked rim beside the player), `pluto-heart.png`
(the heart glacier on the slope, the ice blocks across the plain and the mountain walls behind), plus `heart-top.png`
and `heart-wide.png`, the pinned-camera views straight down onto the heart plain.

Audit at x 12, 60 and 205 (the heart plain): **z-fighting 0** at all three, solids 12/16/16, platforms 108/111/120,
0 malformed, 0 duplicate or heavy-overlap solids, 0 page errors. A pair of streamed scenery planes was flagged once at
x 60; it did not reproduce in three later runs, so it is a streaming artefact rather than a terrain or basin regression. Frames: 56 calls / 87,378 triangles at the approach, 58 / 86,160 on the plain and 61 / 89,000 at
the heart; whole place 30 meshes / 73,354 triangles at the approach. No FPS claim.

### Stage 30 — Characters and pets: their own soft toy paint

- **Their own material**: every character and pet now draws with a new `lifeMat()` - vertex-coloured, roughness 0.58,
  metalness 0 - instead of the glossy machinery paint (roughness 0.34, metalness 0.08) it shared with rockets and ice.
  The hard white specular hotspot that read as a plastic blob at phone distance is gone, with the same single shader
  program and the same one draw call per creature.
- **Shading tried, then reverted**: a top-lit gradient baked into each species' shared mesh was built and measured (948
  vertices on `frostfluff`, median luminance 0.857 against 0.016 for the eye paint), then removed during release
  validation: the chalk, marker, doodle, keepsake and craft families are drawings whose exact paint colours are part of
  their design and are asserted by `tests/chalk-friends.test.mjs`, so shading must not edit vertex colours. The soft look
  therefore comes from the material alone, and true shading via a baked ambient-occlusion map (which leaves the paint
  untouched) is scheduled for stage 31.
- **Kept working**: all 11 character and pet taps on Pluto still resolve (`pet_frostfluff`, `pal_snowballkid`,
  `pal_heartling`, `pet_heartbun`, `pal_charondot`, ...), a `pal_heartling` tap runs with no error, and the hop, float,
  roll and breathe animations are untouched (no rig change). Frames unchanged at 56 calls / 87,378 triangles on the plain.

Evidence in `docs/screenshots/stage30/`: `character-closeup.png` (Heartling close up - rounded body, soft matte finish,
with the snowball character behind) and `characters.png` / `pets.png` (the walking camera at x 24 and x 12). Audit at
x 12, 60 and 205: z-fighting 0, solids 12/16/16, platforms 108/111/120, 0 malformed, 0 duplicate or heavy-overlap
solids, 0 page errors. No FPS claim.

### Interim release checkpoint (2026-11-24)

Release validation found and fixed a **stage 28 regression**: the Neptune storm clearing read `spot[0]`/`spot[1]` inside
the height function shared by all four gas giants, where `spot` is null for Jupiter, Saturn and Uranus, so those three
planets threw while building (`Cannot read properties of null`) and `tests/space-lifecycle.test.mjs` failed. The clearing
is now gated on Neptune (`spot ? ... : 0`); Jupiter, Saturn and Uranus build and capture again (57/64/71 draw calls,
96,250/82,398/81,730 triangles, 0 page errors) and their audits are clean (z-fighting 0, solids 12, platforms
108/113/108). The stage 30 vertex-colour bake was removed for the same reason (see above). All 20 native suites pass, the
phone-viewport checks pass, and PR #104 is frozen as an interim release awaiting review.

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

### Stage 17 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `trail-detail` timber (posts, deck planks) | 1 | — |
| `trail-detail` rope (rails, ties) | 1 | — |
| `trail-detail` rock (cliffs, boulders) | 1 | — |
| `trail-detail` water (sheet, basin) | 1 | — |
| `trail-detail` mist puffs | 1 | — |
| **Total** | **5** | **2,512** |

### Stage 16 measured cost (streamed district group)

| Group | Meshes | Triangles |
|---|---|---|
| `hills-detail` timber (baskets, poles, stakes) | 1 | — |
| `hills-detail` cloth (envelopes, flags) | 1 | — |
| `hills-detail` ropes and tethers | 1 | — |
| `hills-detail` flower stems | 1 | — |
| `hills-detail` terrace shelves | 1 | — |
| `hills-detail` instanced blooms | 1 | — |
| **Total** | **6** | **10,616** |

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
- **Draw calls:** every new decoration batch is merged or instanced — one draw call per batch. All sixteen detailed areas together add **82 draw calls and 224,932 triangles**.
- **Stage 7 landscape:** 29 hills + 8 mountains = **2 meshes / 2 draw calls / 51,140 triangles**, replacing 29 separate hill meshes (27 fewer draw calls for the backdrop). Single-frame read at the park: 199 draw calls, 382,430 triangles total. Rocks gained their new detail inside existing geometry (0 extra calls, 0 extra textures).
- **Texture cost:** anisotropy set once per texture on load, no per-frame work.
- **Scene audit:** runs only on demand (`window.__DDW3.audit()` or `?audit`), never in the frame loop.
- **Not measured on real hardware.** The headless environment renders at ~1.2 fps in software; frame-time comparisons there are not representative of a phone or desktop GPU, so no speed-up claim is made from them.

## Test results (latest run)

- `node tests/spatial.test.mjs` — 8/8 pass.
- `node tests/scene-audit.test.mjs` — 13/13 pass.
- `npm run build` — succeeds, `index.html` 9,967 KB.
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
- Model probe (`hills-detail`): **6 meshes / 10,616 triangles**.
- Audit at x −720 and −760, stage 16 build: **z-fighting 0**, duplicates 6 (character face spheres), solids 12 and
  platforms 114 all well formed, 0 page errors.
- Model probe (`trail-detail`): **5 meshes / 2,512 triangles**.
- Audit at x 470 and 520, stage 17 build: **z-fighting 0**, duplicates 6, solids 12 and platforms 119 all well formed,
  0 page errors.
- Model probe (`playhouse-detail`): **17 meshes / 3,588 triangles**.
- Audit at x −13 and 32, stage 18 build: **z-fighting 0**, solids 12 and platforms 108 all well formed, 0 page errors.
- Bridge handrails verified with a dedicated capture at x 450: posts, sagging rope and ties read correctly and the
  waterfall is visible on the cliff; no fix was needed.
- Model probe (`studio-detail`): **4 meshes / 1,222 triangles**.
- Audit at x 62 and 80, stage 19 build: **z-fighting 0**, solids 12 and platforms 108 all well formed, 0 page errors.
- Model probe (`lab-detail`): **6 meshes / 10,332 triangles**.
- Audit at x 100 and 118, stage 20 build: **z-fighting 0**, solids 12 and platforms 104 all well formed, 0 page errors.
- Model probe (`ground`, Moon): **1 mesh / 25,904 triangles**.
- Moon audit at x 12, 20, 44 and 78 (`node tools/audit.cjs --place moon 12 20 44 78`), stage 21 build: **z-fighting 0**,
  solids 12 and platforms 108/110 all well formed, 0 page errors.
- Model probe (`ground`, Mercury): **1 mesh / 51,464 triangles** (224x88 terrain grid).
- Mercury audit at x 8, 14, 22 and 38 (`node tools/audit.cjs --place mercury 8 14 22 38`), stage 22 build: z-fighting
  0/0/0/1 (the x-38 one is the pre-existing ground-plane seam pair at y 0.029), solids 12 and platforms 108 all well
  formed, 0 page errors.
- Ground geometry sample around the showpiece crater: 197 vertices with the bowl floor at -4.75 m and the outer rim at
  +1.9 m, `vertexColors: true`, 0 page errors; a scene raycast through the pinned overhead camera hits the bowl at
  y -3.6 m at the centre and y 0 on the surrounding plain.
- The capture and audit harnesses now take `--place <id>` (stage 21), which flies to a space place and treats the shot
  coordinates as offsets from where that place starts.
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
- 8 of 26 areas still have no geometry pass; the Moon and Mercury now have one (stages 21-22), the other planets do not yet.

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
5. **Balloon Hills — done (stage 16):** three moored balloons, two bunting lines, wildflower drifts and terrace
   shelves; 6 meshes / 10,616 triangles, evidence in `docs/screenshots/stage16/`.
6. **Adventure Trail — done (stage 17):** bridge handrails, two stratified cliffs, waterfall with basin and mist, and
   a lookout deck; 5 meshes / 2,512 triangles, evidence in `docs/screenshots/stage17/`.
7. **Playhouse — done (stage 18):** curtained stage with footlights, prop chest, reading nook and two lanterns;
   17 meshes / 3,588 triangles, evidence in `docs/screenshots/stage18/`.
8. **Studio — done (stage 19):** easel wall with drying canvases, pottery wheel with finished pots, paint-splattered
   workbench; 4 meshes / 1,222 triangles, evidence in `docs/screenshots/stage19/`.
9. **Wonder Lab — done (stage 20):** glass-tube bench with burner tripod, bubbling flasks and test tubes, three-tier
   specimen shelves, microscope table with stool, glass cabinet; 6 meshes / 10,332 triangles, evidence in
   `docs/screenshots/stage20/`.
10. **The Moon — done (stage 21):** crater rims with bright ejecta rays, layered regolith colours and a detailed
    surface (37 new craters, 54 pebbles); 25,904-triangle ground mesh, evidence in `docs/screenshots/stage21/`.
11. **Mercury — done (stage 22):** 224x88 terrain grid, two shallow showpiece basins, a one-time camera overlook on
    first approach, softened bright rims, dark floors, wider ejecta rays with dark lanes, layered regolith, volatile
    hollows, 37 new craters and 46 pebbles; 51,464-triangle ground mesh, evidence in `docs/screenshots/stage22/`.
12. **Venus — done (stage 23):** 240x90 terrain grid, three drifting translucent cloud sheets, pancake domes, cinder
    cones, tessera highlands, branching lava channels and glowing fumaroles, with the volcanic-plain palette; 49,660
    triangle ground mesh, evidence in `docs/screenshots/stage23/`.
13. **Mars — done (stage 24):** 220x84 terrain grid, two canyons with a rim about 40 m out, three stepped terraced
    buttes, layered ochre palette, ten dust-capped boulder clusters with grit aprons, three drifting haze sheets;
    59,440-triangle ground mesh, rover and dust devil re-verified, evidence in `docs/screenshots/stage24/`.
14. **Jupiter — done (stage 25):** 168x62 banded deck whose height follows the belts and zones, four rows of
    band-aligned cloud banks, a four-layer domed Great Red Spot with raised spiral arcs and five eddies, four moons
    painted at 256 with their own light;     20,832-triangle ground mesh, evidence in `docs/screenshots/stage25/`.
15. **Saturn — done (stage 26):** four separate 220-segment ring annuli with real Cassini and Encke gaps over a
    1024-px banding strip, a 150x58 banded deck whose height follows the belts and zones, three rows of band-aligned
    cloud banks, and a five-tier stepped hexagonal storm with dark skirts and foam caps; 17,400-triangle ground mesh,
    evidence in `docs/screenshots/stage26/`.
16. **Uranus — done (stage 27):** eight separate 200-segment ring annuli (rings 6, 5, 4, alpha, beta, gamma, delta and
    the wide epsilon ring) with real gaps over 1024-px ringlet grain, a 150x58 banded deck with the shallowest belts of
    the three gas giants, three band-aligned rows of cloud banks and low wisp streaks; 17,400-triangle ground mesh, the
    rolling planet and diamond rain re-verified, evidence in `docs/screenshots/stage27/`.
17. **Neptune — done (stage 28):** a 150x58 banded deck with the strongest belts of the four and a banked far deck, four
    band-aligned rows of cloud banks, low wisp streaks, the Great Dark Spot repainted over the bands on a calm plateau,
    and the windsock gust and wind-ride button re-verified; 17,400-triangle ground mesh, evidence in
    `docs/screenshots/stage28/`. Pluto is next.
3. **Planets** in order Moon → Mercury → Venus → Mars → Jupiter → Saturn → Uranus → Pluto: crater rims and ejecta
   rays, layered regolith colours, ring geometry, cloud bands; reuse the loft/vertex-colour helpers from stage 7/8.
4. **Characters and pets:** material/shape pass only (no rig changes) — fur shell tuning, eye catches, bevels.
5. Re-capture with an emoji font installed so the HUD in the evidence PNGs is complete.
6. Then run a real-device pass (iPhone Safari / Android Chrome) before any frame-rate claim.

Each stage: implement, build, run both test files, capture a paired screenshot set with the harness above,
run the audit, update this file, commit and `cloud_git push` to `main` of `dawsons-world-test` only — never to
the original repository's `main`. Then run the `Sync the 3D overhaul` workflow on `feature/full-3d-overhaul`
(Actions → Sync the 3D overhaul → Run workflow) and confirm PR #104's head commit and files moved.
