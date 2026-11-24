# Graphics, collision and performance overhaul — progress

Working repository: `smullinsok042900/dawsons-world-test` (this repo). The original
`Dawson-s-Wonderverse` repository is read-only for this work and has not been modified.

## Status summary

| Phase | State |
|---|---|
| 1. Audit of rendering / placement / performance systems | **Done for the shared engine** (renderer, world, nature, water, assets, perf). Per-environment visual audit still outstanding. |
| 2. Shared engine improvements | **First stage done and verified**: collision spatial index, scene auditor, texture filtering, water ripple/reflection upgrade. |
| 3. Per-environment visual overhaul | **Started**: Playhouse, Park, Castle front, Castle throne room and Dino Valley detail added (5 of 26 areas). |
| 4. Geometry / collision corrections | **Tooling done and run**; confirmed issues not yet fixed (see audit results). |
| 5. Performance optimisation | **Collision indexing done**; renderer/LOD tuning outstanding. |
| 6. Verification | Unit tests (17) + build + headless load/audit run pass. Full browser suite is not re-run every stage (35 min of software WebGL). |

## Verified metrics (headless Chromium, software WebGL — relative only)

| Measure | Before | After first stage |
|---|---|---|
| Draw calls / triangles at spawn | 196 / 319,110 | 290 / 470,384 (same build content; camera settled later) |
| Shader programs | 115 | 116 |
| Textures with anisotropic filtering | 0 (device supports 16) | 140 textures / 623 materials at 8× |
| Collision candidates evaluated | every solid + platform, every physics step | 97 candidates for 97 queries (~1 per query) |
| Build output | 9,893 KB | 9,899 KB |
| Page errors | 0 | 0 |

Software SwiftShader frame times (~1.2 fps) are **not** representative of phones and are only
useful for before/after comparisons of the same scene. The first stage changed 3 water materials
and 140 texture samplers, so draw calls and triangles are unchanged by design (the spawn stats
differ only because the camera/slices had settled further when measured).

### Water upgrade (implemented, numerically verified, not visually confirmed on a device)

`earthkit.makeSea` now keeps UVs and adds a generated seamless ripple normal map that scrolls
across each sea (own texture clone per sea, own material clone), with roughness 0.07,
metalness 0.28 and envMapIntensity 1.35 so the sky reflection and sun highlight read on the
surface. This affects all four water bodies (two seas, the stream, the pier sea). No screenshot
was captured: headless software WebGL cannot screenshot this scene within a usable timeout, so
the visual result is unverified until it is looked at on a real device.

## What the auditor found, and the triage (build 122)

- **z-fighting: 0** confirmed opaque coplanar surfaces.
- **collision entries: clean** — 12 solids, 108 platforms, 0 malformed, 0 duplicates,
  0 heavy overlaps.
- **duplicates: 0 after triage.** The 6 reported meshes were **fur shells**: `fur.js` adds 5–8
  `SkinnedMesh` shells per furry creature, all sharing the creature's geometry and transform,
  each with its own fur material. A live probe confirmed the group's parent chain ended in a
  skinned creature, not scenery. The auditor now ignores skinned meshes, sprites, points/lines
  and the off-world shader-rehearsal group (y ≈ −60). No meshes needed moving or deleting.
- **floor-cutting candidates: triaged, none moved.** A live probe listed every candidate with
  position, size and parent: 11 wide sphere masses at x 430–897 (rolling hills, deliberately
  sunk), the headland at x −158, the sky domes (800 m / 1040 m spheres), the slide tube and its
  torus ring, the ball-pit shell and the underground shaft wall. All are intentional terrain or
  structures. The auditor now skips wide terrain masses and any mesh marked
  `userData.grounded`; the new boulders use that flag. Remaining candidates are the same known
  intentional hills.

## Stage 2: Playhouse and Park detail (implemented, measured)

New `src/scenery-detail.js`, called from `world.js`; additive only, no collision entries, no
changes to gameplay. `?nodetail` disables it for measurement.

- **Playhouse:** a 3.3 m woven play rug, 72 bunting flags across the ceiling, three hanging
  paper lanterns with cords.
- **Park:** 190 wildflowers in two drifts (instanced stems + instanced flower heads with
  per-instance colours), 3 sculpted boulder clusters (9 rocks merged into one mesh), and six
  lamp posts with glowing globes (merged posts + instanced globes).

Measured by toggling only the new groups' visibility in one loaded scene (the only reliable
method here — different page loads vary by ±300k triangles because grass/slice streaming
settles differently):

| Area | Added meshes | Added triangles (geometry) | In-scene Δ draw calls | In-scene Δ triangles |
|---|---|---|---|---|
| Playhouse | 8 | 1,376 | **+3** | **+488** |
| Park | 5 | 48,692 | **+6** | **+51,368** |

Park triangles rise ~7% for ~190 flowers, 9 boulders and 6 lamps; draw calls rise by 6 because
merged/instanced geometry keeps the additions to a handful of batches. Playhouse is +3 calls.

## Stage 3: Princess Castle and Dino Valley (implemented, measured)

Both live in `kingdom.js`; the detail builders are in `scenery-detail.js` and are wired with the
same `?nodetail` switch, so the A/B measurement is repeatable.

- **Castle:** two formal parterre beds (gravel tray, trimmed hedge border) with 24 rose bushes and
  72 blooms, four stone urns with flowering tops flanking the walk, and a string of 11 warm
  lanterns along the front.
- **Dino Valley:** 95 ferns (one merged frond, instanced), three mossy boulder clusters merged into
  one mesh, a fallen log with moss and six mushrooms, and eight three-toed footprints along the
  path.

**Measurement method (changed in this stage).** Reading `renderer.info` while the game loop runs
is not reliable here: at ~1.2 fps under software WebGL a reading spans half a second, and slice
merging/grass streaming changes the totals between reads (Dino Valley read 156 vs 227 calls purely
from stream timing). Each group is now measured with two explicit single-frame renders, one with
the group visible and one without, `renderer.info.reset()` before each:

| Area | Added meshes (batches) | Added triangles | Δ draw calls | Δ triangles |
|---|---|---|---|---|
| Playhouse | 8 | 1,376 | **+3** | **+488** |
| Park | 5 | 48,692 | **+5** | **+48,692** |
| Castle | 7 | 13,660 | **+7** | **+13,660** |
| Dino Valley | 5 | 3,960 | **+5** | **+3,960** |
| Castle throne room | 6 | 7,312 | **+6** | **+7,312** |
| Toy Town | 3 | 5,012 | **+3** | **+5,012** |

Park/Playhouse were re-measured with the same method, so all four rows are comparable. (The
earlier Park reading of +6 calls included one stream-timing artefact.) Each batch adds exactly one
draw call, and the triangle delta equals the group's geometry exactly.

## Stage 4: the throne room (implemented, measured)

`buildCastleInteriorDetail` in `scenery-detail.js`, called from `kingdom.js` with the interior's own
origin (`CI.ox`, x 2000), so everything is placed in throne-room coordinates:

- velvet ropes lining the carpet aisle: 10 gold posts and 32 sagging rope segments (posts merged,
  ropes merged — the ropes are built with a small point-to-point cylinder helper);
- four potted palms against the back wall (pot, lip, trunk and seven fronds per palm, all merged);
- four velvet banners with gold rails and crests above the stained glass;
- six wrapped party gifts with ribbons and bows behind the cake (merged with vertex colours);
- twelve candle flames on the throne steps (one instanced mesh).

Measured the same single-frame way, from inside the room: **+6 draw calls, +7,312 triangles**, exactly
the group's geometry.

While measuring, the audit reported two coplanar pairs in the room: the existing carpet at y .012
and its gold trim at y .014 — a 2 mm gap, which can flicker at this scale. The trim now sits at
y .022. The audit for the room is now **0 duplicates, 0 z-fighting, collisions clean**.

## Stage 5: Toy Town (implemented, measured)

Streamed district (built only when you come near), so the detail is appended as a district builder in
`expansion.js` and added to the district group — it unloads with the district.

- an overturned toy box behind the path spilling eight alphabet blocks;
- seven giant toy balls along the near edge of the path (one instanced mesh, per-instance colour);
- four spinning tops (base, body, stem and knob merged into one mesh).

Single-frame measurement: **+3 draw calls, +5,012 triangles**. Audit clean (0 duplicates, 0 z-fighting,
collision entries clean), 0 page errors.

## Stage 6: lighting, atmosphere, vegetation and rail clearance (world-wide)

This stage changes the look of **every** environment rather than adding more small props.

- **Tone mapping:** Neutral → **ACES filmic** with exposure 1.02. Pastels keep their hue but gain
  contrast and depth; highlights roll off instead of clipping.
- **Key light:** warmer sun (`#ffeed4`, intensity 3.05), hemisphere raised to .78, shadow blur radius
  4 → 5.5. Shadows now read as soft shapes rather than hard stickers.
- **Atmosphere:** fog pushed from 55–190 m to **72–250 m** in a lavender tint, so the mid-ground keeps
  its colour and the far hills gain depth without hazing the play area.
- **Dinosaur skin:** Dottie's material gained a procedural pebbled normal map (5×4 repeat, .5 scale),
  so the body catches the sun with scale bumps instead of reading as smooth plastic.
- **Dino Valley vegetation:** the flat/conifer-looking ferns were replaced with lush broad-leaf jungle
  plants (two rings of oval leaves on a stem, 10 leaves per plant, 95 instanced).
- **Playhouse (indoor):** three soft play mats and a low toy shelf holding 14 colourful books, merged
  into one mesh.

### Rail clearance fixes (no attraction removed)

The train line runs at **z = 3.2** and its corridor is z 2.2–4.3. Several decorations sat inside it:

| Object | Was | Now |
|---|---|---|
| Playhouse woven rug | z 3.3 (on the rails) | z 5.55 |
| Park lamp posts | z +2.9 | z +5.15 / −2.9 alternating |
| Castle parterre beds | z 2.7–5.7 (straddled the rails) | z 4.9–7.1 |
| Castle urns | z 2.15 | z 1.9 |
| Toy Town giant balls | z 4.2–5.0 (ball reached the rails) | z 5.75–6.3 |
| Toy Town tops | z 4.8–5.0 | z 5.8–6.0 |
| Dino foreground plants | from z 3.6 | from z 4.85 |
| Dino footprints | z 1.35 (walking lane) | z 1.95 |

### Cost

Lighting, tone mapping and fog add **no draw calls and no geometry**. Vegetation stays a single
instanced batch (about +8k triangles total); the playhouse furniture is **+1 batch** (~0.5k triangles).
The adaptive quality system (mobile starts at level 1, measured frame times adjust) is untouched.

### Before / after screenshots

Captured in the cloud browser at 1280×720 in `docs/screenshots/stage6/`: `before-*.jpg` and
`after-*.jpg` for playhouse, park, castle, dino, throne and toytown. Same camera positions.

## Merge helper instead of hand-written loops

`scenery-detail.js` had three hand-written merge loops (flower heads, boulders, lamp posts) that
concatenated positions/normals/colours and re-based indices by hand. They now call the project's
existing `mergeGeometries` helper through one `mergeParts()` wrapper that disposes the pieces and
degrades to `null` instead of throwing. Output geometry is identical (same triangle counts); the
file is ~80 lines shorter and every later builder reuses the same helper.

## Environment inventory (for the visual pass)

Earth: Playhouse, Imagination Studio, Wonder Lab, Adventure Park, creature area, Dino Valley,
Princess Castle, Adventure Trail, Toy Town, Lab Gardens, Art Plaza, Ocean Pier, Happy Farm,
Frosty Peaks, Whispering Woods, Sunny Seaside, Balloon Hills.
Other worlds: Sky Kingdom, Underground caves, Fluffkin House interior, Moon, Mercury, Venus,
Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.

Upgraded so far: **Playhouse** and **Park** (Stage 2 detail above). All other areas still need
 their individual geometry/material pass.

## How to verify a change

```bash
cd discovery-world/3d
node tests/spatial.test.mjs        # 8 tests, <1 s
node tests/scene-audit.test.mjs    # 9 tests, <1 s
npm run build                      # writes index.html
```

In a browser: `window.__DDW3.audit()` returns the geometry/placement report; `?perf` shows the
in-game performance monitor.

## Immediate continuation plan (next session)

1. Audit is clean; keep running `window.__DDW3.audit()` after each area and fix real findings.
2. Continue Phase 3 in this order: Playhouse (detail done, materials/terrain next) → Park (detail
   done) → Castle → Dino Valley →
   Toy Town → seaside/ocean → each planet (Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
   Neptune, Pluto).
4. For each area: add geometry detail (terrain relief, rocks, vegetation), PBR material work, and
   record before/after draw calls and triangles in this file.
5. Profile on a real iPhone/Android before claiming frame-rate targets; software WebGL cannot
   establish 30/60 FPS.

## Stage 8 — foreground models rebuilt (Dottie, broad leaves, Ferris wheel, carousel, castle facade)

Scope: the largest objects the camera actually looks at, rebuilt as geometry rather than decorated.

- **Dottie:** body lofted through 10 cross-sections (flattened walkable back kept at y 3.45), belly→flank→back
  vertex colours in one mesh; lathe-turned legs with knee bulge, padded feet and three clawed toes; 12 dorsal
  scutes; brow ridges, nostrils, jaw and crest on the head. Old body sphere + belly ball + 5 spots removed.
- **Broad-leaf plants:** new `broadLeafGeometry()` (cupped blade, midrib, drooping tip, base→tip colour, UVs for
  the vein normal map). 85 instanced jungle plants, 512 tris each (was 124). Palms: ringed trunk + 9 arching
  fronds, one mesh each (was 6 flat capsules per palm).
- **Ferris wheel:** A-frame with bracing and feet, double rim cage tied every 36°, 20 spokes per face, flanged
  bolted hub, and 10 detailed gondolas. 37 meshes → 14, 14,080 → 24,708 tris.
- **Carousel:** blanket, padded saddle, cantle/pommel, leathers, stirrups and brass pole collars per pony,
  merged to one mesh per pony (+6 meshes, +8,640 tris). Seat height unchanged.
- **Castle facade:** plinth, base course, four pilasters, nine voussoirs + keystone, window architraves with
  sills/hoods/mullions, string course, eleven turned balcony balusters. Static, so it merges: +1 material draw.

Evidence: `docs/screenshots/stage8/` — before/after pairs at x 404 (Castle), 600 (Toy Town), 368 (Dino Valley),
150 (Park), 1280×720, same camera. Audit clean (0 duplicates, 0 z-fighting, collision 0 malformed/0 heavy
overlaps). No FPS claim: software WebGL only.

## Stage 9 — Lab Gardens: glazed greenhouses, real beds, a potting lab

Scope: the district's three bare pastel half-spheres and an empty lawn.

- **Greenhouses are buildings:** drum wall with footing course, six scaled hoop ribs, sill ring and brass finial;
  framed arched door (jambs, half-round arch, panelled leaf with porthole, brass handle, stone threshold) built
  outside the pane so nothing intersects it. The panes are now genuinely glazed (`opacity .26`, `depthWrite false`,
  `renderOrder 3`), so the interior reads.
- **Beds with depth:** five exterior beds between the domes and two raised beds inside each dome — stone kerbs
  proud of the grass, soil recessed 9 cm, two soil ridges, rows of three-leaf sprouts with blooms. Interior beds
  raised to 1.02 m so planting shows above the drum through the glass.
- **Edging:** picket fences (posts, two rails, pickets) around three beds.
- **Potting lab:** two-tier bench, lathed beaker with lip/spout, second beaker, conical flask (each with liquid),
  five-tube wooden rack, microscope, and a copper supply pipe with elbows, collars, floor stands and a spoked
  brass valve wheel.
- **Cost:** 5 meshes / 28,320 triangles / +4 draw calls, one streamed group (`labgarden-detail`).

Evidence: `docs/screenshots/stage9/` — `before-labgarden.png` (stage-8 build) / `after-labgarden.png` at x 695,
`after-labbench.png` at x 771, `close-dome.png`, `close-bench.png`, and `rides/` (Dottie's back and slide, carousel
seat front/side). Audit clean (0 duplicates, 0 z-fighting, 0 malformed / 0 heavy collision entries). Ride sweep
found one real placement bug: the Ferris wheel seat sat 0.59 m above the stage-8 gondola bench and now sits on it.
No FPS claim: software WebGL only.

## Stage 10 — Art Plaza gallery yard

- **Paving:** a procedural paint-splat sheet (96 ellipses, six colours, flung droplets) laid on the paving in the open
  lane, transparent with a polygon offset, so it never z-fights the floor.
- **Planters:** four tapered kerbed stone planters with a proud rim, recessed soil and a flowering planting, in the gaps
  between the activities (x 813.4, 823.6, 868, 883.6) — clear of every tap target and the walking lane.
- **Easels:** two A-frame easels (splayed front legs, back leg, ledge) at x 827 and 884.4, each with a different
  procedurally painted canvas and a white gallery border.
- **Drying rack:** two posts, a rail, three pegged canvases with clothespins at x 866.2.
- **Paint pots and brush jar:** four colour-topped pots with leaning brushes and a glass jar holding four more.
- **Bunting:** two 3.55 m poles (x 811.6, 893.4), a sagging rope and 26 fabric flags in the paint colours, above the
  statue and every tap target.
- **Cost:** 10 meshes / 4,262 triangles / +10 draw calls, one streamed group (`artplaza-detail`), no collision entries.

Evidence: `docs/screenshots/stage10/` — `before-artplaza.png` and `before-artplaza-wide.png` (stage-9 build at x 850 and
815), `after-artplaza.png`, `after-artplaza-wide.png` (planters, easel), `after-artplaza-rack.png` (drying rack, paint
pots). Audit at x 815/850/868: 0 z-fighting, solids 12 and platforms 108 all well formed, the 6 reported duplicates are
the character's face spheres. Headless load: 0 page errors, no "Oops". No FPS claim: software WebGL only.

## Stage 11 — Sunny Seaside shoreline

- **Parasols:** five pale-timber poles (x −26, −43, −79, −106, −143) with twelve-panel alternating cone canopies,
  cream rim rings, brass finials and base plates, each in a gap between the district's activities.
- **Beach furniture:** a striped towel and a six-gore painted beach ball beside every parasol.
- **Dune grass:** 1.55 m spacing along z ≈ −7.25 from x −147 to −23, three arched instanced blades per tuft, clear of
  the lighthouse steps and the pier approach.
- **Driftwood:** weathered trunk, broken branch and splinter at x ≈ −57.
- **Cost:** 4 meshes / 8,064 triangles / +4 draw calls, one streamed group (`seaside-detail`), no collision entries.

Evidence: `docs/screenshots/stage11/` — `before-seaside.png`, `before-seaside-pier.png` (stage-10 build) and
`after-seaside.png` (x −43), `after-seaside-pier.png` (x −100). Audit at x −43/−100/−143: 0 z-fighting, solids 12 and
platforms 108–111 all well formed; the 6 duplicates are the character's face spheres. Headless load: 0 page errors.
No FPS claim: software WebGL only.

## Stage 12 — Whispering Woods forest and clearing

- **Nine trees** (x −157 … −266) with tapered two-tone trunks, three limbs each and four stacked crown clumps so the
  canopy meets overhead; placed clear of the hollow log, birdhouse, hidden owl and tunnel mouth.
- **Fern understory** in three rows beside the path, four instanced blades per tuft.
- **Campfire clearing** at x −165: swept earth disc under the stone ring, two half-log benches and a four-log woodpile,
  all scenery with no new tap targets.
- **Crown fix:** the first crowns were smooth tinted icosahedra and read as blobs, with one clump floating apart.
  They now use lumpy meshes with the engine's leaf-detail map + normal map and 44 instanced leaf cards per tree,
  and the four clumps overlap inside the lower crown radius so none detaches.
- **Cost:** 5 meshes / 31,688 triangles / +5 draw calls, one streamed group (`woods-detail`), no collision entries.

Evidence: `docs/screenshots/stage12/` — `before-woods.png`, `before-woods-west.png` (stage-11 build) and
`after-woods.png` (x −200), `after-woods-west.png` (x −250). Audit: 0 page errors, 6 duplicates (character face
spheres), 1 z-fighting seam at x −200 that the stage-11 baseline also shows, buried 10 vs 8 baseline, solids 12 and
platforms 111 well formed. Capture now goes through CDP `Page.captureScreenshot` because `page.screenshot` times out
under software WebGL. No FPS claim.

## Stage 13 — Frosty Peaks ridgeline and drifts

- **Ridgeline** at z −15.4: four faceted rock shoulders with thick snow caps and an ice peak.
- **Seven snow-loaded pines** with three cone tiers each and a snow cone over every tier.
- **Ice arch** at x −372 (two clear-ice piers, half-torus apex, icicle), placed clear of pond, igloo and penguins.
- **Wind drifts**: instanced white mounds both sides of the path, skipping pond, igloo, sledding hill/steps, snowman
  and snowball target.
- **Cost:** 5 meshes / 16,428 triangles / +5 draw calls, one streamed group (`frosty-detail`), no collision entries.

Evidence: `docs/screenshots/stage13/` — before (stage-12 build) and after at x −320 and −370. The first render was
corrected before commit (dark drifts from a missing vertex-colour attribute; an oversized bare ridge). Audit at both
positions: z-fighting 0, solids 12, platforms 115, 0 page errors. No FPS claim.

## Stage 14 — Happy Farm paddock and cupola

- **Fenced paddock** (z −6.9, x −530…−408) with two rails and gates at the barn yard and windmill.
- **Four crop rows**: alternating cabbages and carrots behind the fence, with deliberate gaps and the barn strip skipped.
- **Six round hay bales** with pale cut ends in the far field.
- **Barn cupola** with dark louvred vents, red cap, steel spindle and weathervane arrow on the roof peak.
- **Cost:** 5 meshes / 66,116 triangles / +5 draw calls, one streamed group (`farm-detail`), no collision entries.

Evidence: `docs/screenshots/stage14/` — before (stage-13 build) and after at x −470 and −500, plus a barn shot at
x −424 confirming the cupola placement. Audit at −470/−500: z-fighting 0, solids 12, platforms 114, 0 page errors.
No FPS claim.

## Stage 15 — Ocean Pier deck and bait shack

- **Deck**: seam line every 0.42 m, edge trim with braces, so the deck reads as planks. Collision unchanged.
- **Eight pilings** with caps and two rope wraps each, plus three brass mooring cleats.
- **Bait shack** at x −545.5, set back to z −5.7 after a follow-up fix (its counter/awning reached into the walking
  lane at z −4.5): timber body, counter and shelf proud of the front, striped awning on posts, buckets and a bait crate.
- **Four lamp posts**, three down the outer deck edge.
- **Cost:** 4 meshes / 3,996 triangles / +4 draw calls, one streamed group (`pier-detail`), no collision entries.

Evidence: `docs/screenshots/stage15/` — before (stage-14 build) and after at x −600 and −650 as requested, plus
x −556 (deck planking, pilings, cleats, lamps) and x −541 (set-back shack), since the x −600/−650 views face along the
beach rather than the pier. The first render buried the counter and awning inside the shack body; corrected
before commit. Audit at −600/−650: z-fighting 0, solids 12, platforms 114, 0 page errors. No FPS claim.

## Stage 16 — Balloon Hills balloons, bunting and flowers

- **Three moored balloons** (x −747, −769, −792): banded envelopes, wicker baskets, four ropes and a ground stake each.
- **Two bunting lines** on sagging rope between timber poles, 11 flags each, clear of the goats and echo rock.
- **Wildflower drifts** in three rows along the path: merged stems with an instanced bloom each, six colours, skipping the
  flyable balloon, kites, slide hill, goats, echo rock and long-legs drawing.
- **Two terrace shelves** behind the hills, laid over the existing green bumps.
- **Cost:** 6 meshes / 10,616 triangles / +6 draw calls, one streamed group (`hills-detail`), no collision entries.

Evidence: `docs/screenshots/stage16/` — before (stage-15 build) and after at x −720 and −760. The first render had
black flower heads (instanced colours on geometry without a colour attribute); fixed before commit. Audit at −720/−760:
z-fighting 0, solids 12, platforms 115, 0 page errors. No FPS claim.

## Stage 17 — Adventure Trail rails, cliffs and waterfall

- **Bridge handrails**: end posts with caps, sagging rope in six segments per side and vertical ties every 1.8 m.
- **Two stratified cliffs** (x 460, x 508): lumpy rock shoulders with dark stratum lines and fallen boulders. The first
  pass used stacked boxes (grey steps) and was rebuilt as rock.
- **Waterfall** at x 459.4: two-layer water sheet, stone-ringed plunge basin and nine mist puffs; moved proud of the
  cliff face after the first capture showed the rock swallowing it.
- **Lookout deck** at x 484.6 behind the telescope: six planks, two bearers, four posts and a rope rail.
- **Cost:** 5 meshes / 2,512 triangles / +5 draw calls, one streamed group (`trail-detail`), no collision entries.

Evidence: `docs/screenshots/stage17/` — before (stage-16 build) and after at x 470 and 520. Audit at 470/520: z-fighting 0,
solids 12, platforms 119, 0 page errors. No FPS claim.

## Stage 18 — Playhouse stage and reading nook

- **Stage** at x −13.6: platform, rail, valance, two pleated curtain panels with an open gap and backdrop, six footlights.
  Rebuilt after the first pass closed the gap and hid the toy shelf.
- **Prop chest**, **reading nook** (base, cushion, three pillows, book box) and two lower lanterns.
- **Cost:** `playhouse-detail` 17 meshes / 3,588 triangles, no collision entries.
- Bridge handrails were separately verified at x 450 and needed no change.

Evidence: `docs/screenshots/stage18/` (stage at x −13, nook at x 32, plus the earlier wide shots) and
`docs/screenshots/stage17/after-trail-bridge-rails.png`. Audit at −13/32: z-fighting 0, solids 12, platforms 108, 0 page
errors. No FPS claim.

## Stage 19 — Studio easels, pottery and workbench

- **Easel wall**: two A-frame easels with boards and wet paintings, a peg rail with two canvases and three leaning in a
  drying row. The first pass left the painting covering a corner of each board; enlarged to fill it.
- **Pottery wheel**, splash pan, stool, four finished pots on a drying board.
- **Workbench** with shelf, brush jar, palette and paint splats on the top and floor; moved off the existing cylinder.
- **Cost:** `studio-detail` 4 meshes / 1,222 triangles, no collision entries.

Evidence: `docs/screenshots/stage19/` (x 62, x 80 and a bench view at x 84). Audit at 62/80: z-fighting 0, solids 12,
platforms 108, 0 page errors. No FPS claim.

## Stage 20 — Wonder Lab glassware, specimens and microscope

- **Glass-tube bench** (x 101.6–105.6): burner tripod with a flame cone under a small flask, two large round-bottom
  flasks in pink and blue liquid linked by a glass bridge tube, bubbles rising in both, and a rack of five test tubes.
- **Specimen shelves** at x 110.7 (three tiers of lidded jars with coloured specimens) and a **glass-front cabinet** at
  x 128 with two more tiers and a pinned butterfly in a frame.
- **Microscope table** at x 121: base, pillar, arm, tilted body tube, eyepiece, three objectives, stage with a slide,
  mirror and focus knobs, plus a slide box and a stool.
- **Cost:** `lab-detail` 6 meshes / 10,332 triangles, no collision entries. The first pass had flasks too small to read
  from the path, so the glassware was enlarged and the tripod, bridge and test-tube rack added.

Evidence: `docs/screenshots/stage20/` (x 100 and x 118). Audit at 100/118: z-fighting 0, solids 12, platforms 104, 0 page
errors. No FPS claim.

## Stage 21 — the Moon: crater rims, ejecta rays and layered regolith

- **Crater rims**: 37 new craters (34 small pits, three young ray craters beside the walkway) with raised, brightened
  crests, on top of the existing valley and coaster craters (whose shape is unchanged).
- **Ejecta rays**: ten young craters cast pale radial rays across the maria, painted into the terrain colour with an
  angular-noise mask, so they cost no extra geometry.
- **Layered regolith**: four grey strata banded by height, dark basalt maria, thin dark layers in the walls and pale
  fresh material on crests and rays; 54 extra pebbles and finer mottling for surface detail.
- **Cost:** Moon ground mesh 1 mesh / 25,904 triangles (21,584 before the pebbles), no new collision entries.
- **Iteration:** a pale palette washed the rays out under the 3.5-strength sun, and a ground-hugging ribbon mesh for the
  rays draped over crater walls as floating white shards. Both were rejected from the captures; the final version paints
  the rays into the regolith.

Evidence: `docs/screenshots/stage21/` (approach at x 12, rays at x 20, station at x 44, valley at x 78, all captured with
`--place moon`). Audit at 12/20/44/78: z-fighting 0, solids 12, platforms 108/110, 0 page errors. No FPS claim.

## Stage 22 — Mercury: crater rims, ejecta rays and layered regolith

- **Resolution**: Mercury's ground uses a 224x88 grid (about 0.5 m columns near the path) because the default 128x54 grid
  averaged every crater rim into a dune. Ground mesh: 1 mesh / 51,464 triangles, no new collision.
- **Showpieces you can see during play**: two wide shallow basins (r 13 and r 9, 2.6 m and 2 m deep, 0.5 m rims); deep
  craters are invisible from the 2.5 m walking camera because their near rim hides the bowl.
- **One-time crater overlook**: on the first approach within 24 m (and with no other camera override running) the camera
  eases into a 6 s oblique view of the bowl and back, once per session (`G.mercuryCraterSeen`); later passes keep the
  ordinary walking camera.
- **Rays that read while walking**: wider angular lobes, a 0.9 white blend, dark lanes between rays, 5 r reach from the
  showpieces and 2.1 r from the rest; the rim ring narrowed to 0.88-1.5 r so the surrounding plain stays dark.
- **Soft rim ring**: floor and rim blend over 0.2-0.3 r gradients, removing the stepped edge.
- **Regolith**: four dark warm-grey strata, smooth plains, thin dark wall layers, volatile hollows, 46 pebbles; the Sun's
  strength eased from 3.9 to 2.9 so rims and rays are not clipped.
- Iterations rejected after inspecting captures: broad bright blankets (cream wash), tall rims (hid their bowls), deep
  basins (same), a near-uniform dark palette (no contrast), long rays on every crater (covered the map), a permanent
  camera hijack (replaced by the one-time reveal), an over-wide rim ring that washed the plain out, and two overlook
  framings (too close, then too steep).

Evidence: `docs/screenshots/stage22/` from the normal walking camera (including the same spot revisited after the
reveal). Audit at 8/14/22/38: z-fighting 0/0/0/1 (the one is the pre-existing y 0.029 plane pair), 0 malformed solids
or platforms, 0 page errors. No FPS claim.

## Stage 23 — Venus: layered cloud deck and volcanic plains

- **Resolution**: a 240x90 grid (about 1.8 m columns) so the plains carry landforms; ground mesh 1 mesh / 49,660
  triangles, whole place 35 meshes / 129,200 triangles at the approach.
- **Landforms**: eight pancake domes, ten cinder cones, four tessera highlands, stacked flow aprons around the
  volcanoes and lava channels cut 3.2 m into the ground.
- **Surface detail that survives the vertex grid**: flow lobes with pale fronts, pale tessera blocks with dark
  fractures, bright dome tops over dark skirts, glowing channel seams, sulphur streaks and eleven fumaroles along
  the path - all at 4-20 m scales.
- **Cloud deck**: three translucent billowed sheets at 9/16/26 m drifting at different speeds and wrapping, with the
  far volcano breaking through them; one shared material for all three.
- Rejected after inspection: opaque puffs (flying saucers) and high-frequency colour noise (averaged back to a plain).

Evidence: `docs/screenshots/stage23/`. Audit at 12/40/70/120: z-fighting 0, 0 malformed solids or platforms, 0 page
errors. No FPS claim.

## Stage 24 — Mars: layered dust haze and readable rock fields

- **Venus measured, then trimmed**: at the approach the frame was 57 draw calls / 133,830 triangles, with the six
  translucent cloud sheets alone at 43,200 triangles. Three wider billows per cluster instead of four, plus an 8x5
  ball for the two far sheets, brings the clouds to 22,992 and the frame to 113,622 (same six meshes, same six draw
  calls, same silhouette).
- **Resolution**: a 220x84 grid (about 2 m columns near the walkway) so the far ground carries canyons and stepped
  buttes; ground mesh 1 mesh / 59,440 triangles, whole place 41 meshes / 101,562 triangles at the approach.
- **Landforms**: two canyons cut 9 m and 7 m into the plains with the near rim about 40 m out, and three stepped
  buttes (four flat terraces, 6.5-12 m across, 5-9 m tall) beside the path.
- **Layered ochre palette**: banded walls, dark basalt fields, pale drift dust, ochre layers on the dune slopes, a
  shaded canyon floor and soft wind streaks.
- **Rock fields**: ten clusters of four to seven stacked, dust-capped boulders with a grit apron, plus the existing
  scattered stones and front rocks.
- **Dust haze**: three translucent sheets at 1.7/3.8/6.6 m (opacity 0.27) drifting at different speeds and wrapping,
  so the far ground fades in layers.
- **Rover and dust devil unchanged and re-verified**: tapping both and letting the loop run moved 18 objects (rover
  2.46 m and turned, dust-devil segments swayed and turned), 0 page errors.
- Rejected after inspection: the first canyon was too far back to read, strata/haze too subtle, clusters too scattered.

Evidence: `docs/screenshots/stage24/` (approach, rover/dust devil, canyon). Audit at 12/40/70/120: z-fighting 0,
0 malformed, 0 duplicate or heavy-overlap solids, 0 page errors. No FPS claim.

### Venus re-checked after the trim

Re-captured the trimmed deck at the planet approach and at two walking-camera spots (`docs/screenshots/venus-recheck/`):
57 draw calls / 113,622 triangles at the approach, 60 / 109,098 while walking the deck and 57 / 122,010 further along.
The three sheets still read as a continuous bank of cream cloud in both views, so no detail was restored on the near
sheet. Evidence only, no FPS claim.

## Stage 25 — Jupiter: banded depth, a layered Great Red Spot, readable moons

- **Banded deck with real depth**: Jupiter alone uses a 168x62 grid (20,832-triangle ground mesh, up from 12,000) and
  its own six-colour belt/zone palette warped so no band is straight. The deck's height now follows the bands: soft
  ridges along the zones, troughs along the belts, plus lumpy cloud tops and a banked far deck. The bands therefore
  recede in layers instead of lying flat.
- **Cloud banks in rows**: fifteen random five-puff heaps became four band-aligned rows of wide, half-buried domes
  (18 banks), each row flatter and larger than the one in front, so the belts show through to the horizon. Whole place
  45 meshes / 96,216 triangles at the approach (was 36 / 86,048); the frame is 58 draw calls / 98,754 triangles.
- **Great Red Spot**: four layered parts instead of one decal - a raised pale foam collar, a brick-red ring with two
  bright spiral arms, a pale inner ring and a deep dark eye, all domed and turning at different speeds, plus two raised
  spiral arcs that stand out of the bowl and five small counter-spinning eddies. The storm reads as a deep whirl in the
  deck from the walking camera (68 draw calls at that spot).
- **Readable moons**: all four are painted at a 256 map (was 128), moved closer and larger (Io 5.6, Europa 4.8,
  Ganymede 7.0, Callisto 6.0 m radius, 125 m out) and given a little of their own light (emissive map at 0.5), so the
  far side away from the sun still shows Io's sulphur blotches, Europa's cracks, Ganymede's bright patches and
  Callisto's pale craters. A tap check ran the Great Red Spot, moon-count and lightning interactions: no errors, four
  moons present.
- **Wisps**: Jupiter's two drifting wisp layers sit lower and rounder, so they read as streaks on the deck.
- Rejected after inspection: a flat decal storm (read as a smear), pancake-shaped cloud banks that floated, and moons
  at 128 px hidden behind the storm towers.

Evidence: `docs/screenshots/stage25/` (approach, bands, red spot, moons look-up). Audit at 12/44/72/120: z-fighting 0,
solids 12, platforms 108/113/113/113, 0 malformed, duplicate or heavy-overlap entries, 0 page errors. No FPS claim.

## Stage 26 — Saturn: banded rings, a banded deck with depth, a readable hexagon

- **Rings with real gaps and banding**: one 128-segment annulus with a 256-px alpha strip became four separate
  220-segment annuli — the faint C ring, the bright B ring, the A ring and the thin F ring — so the Cassini division
  between B and A is open sky rather than painted transparency. The shared strip is 1024 px with fine one-pixel
  ringlets, a narrow division inside B, the Encke gap in A and a soft F ring; each band keeps its own opacity.
- **Banded deck with depth, like Jupiter's**: Saturn now shares Jupiter's banded-deck code at 150x58 (ground mesh
  17,400 triangles, up from 12,000) with its own gold palette, wind combs, curls and oval storms. The deck's height
  follows the belts and zones (weaker and lower than Jupiter's), and twelve random cloud heaps became three
  band-aligned rows of half-buried domes, so the belts recede instead of being covered.
- **Hexagon storm**: the four flat 16 cm hexagon plates became a five-tier stepped hexagonal vortex with real walls,
  2.2 m tall and alternating cream and amber tiers, each with a dark skirt at its foot and foam caps on the corners,
  plus a dark hexagonal eye on top. It now reads as a storm from the walking camera (the tiers counter-rotate, faster
  when tapped).
- **Wisps**: Saturn's drifting wisp layers sit low on the deck as thin streaks, so nothing floats like a plate.
- Rejected after inspection: one pass with cream tiers (the steps vanished into the cream deck) and a first hexagon
  at four flat 16 cm plates that looked like a gold platter.

Evidence: `docs/screenshots/stage26/` (approach, bands, hexagon). Audit at 12/44/72/120: z-fighting 0, solids 12,
platforms 113, 0 malformed, duplicate or heavy-overlap entries, 0 page errors. No FPS claim.

## Stage 27 — Uranus: narrow rings with real gaps, a banded deck with depth

- **Rings with real gaps**: the single 128-segment disc painted with five alpha bands became eight separate
  200-segment annuli - rings 6, 5 and 4, then alpha, beta, gamma, delta and the wide, bright epsilon ring - so every
  gap between them is real open sky instead of a painted lane. The shared strip grew from 128 px to 1024 px of ringlet
  grain, mapped across each ring's own width, with soft edges and its own opacity per ring; the wide epsilon ring is the
  new tap target and explains that Uranus has 13 narrow rings. The rings stay upright in the sky, because Uranus is
  tipped right over on its side, and the tilt was opened slightly so the gaps read.
- **Banded deck with depth**: Uranus now shares the banded-deck code at 150x58 (ground mesh 17,400 triangles, up from
  12,000) with its own ice-blue palette, wind combs, curls and small oval storms. Its belts are the shallowest of the
  three (height strength .62 against Saturn's .8 and Jupiter's 1), so the deck reads as banded and ridged without
  losing the calm look of the real ice giant.
- **Cloud banks and wisps**: the seven random five-puff heaps became three band-aligned rows of half-buried domes, so
  the belts recede instead of being buried, and the wisp layers lie low on the deck as thin streaks.
- **Kept working**: the rolling planet and the diamond cloud were re-tapped after the change - the ball travelled
  13.95 m and turned 18.6 rad (exactly its 0.75 m radius), and the gems spawned and fell, with 0 page errors.

Evidence: `docs/screenshots/stage27/` (approach, deck, rings). Audit at 12/44/72/120: z-fighting 0, solids 12,
platforms 108/114/114/114, 0 malformed, duplicate or heavy-overlap entries, 0 page errors. No FPS claim.

## Stage 28 — Neptune: a banded deck with depth, and the Great Dark Spot kept readable

- **Banded deck with depth**: Neptune now shares the banded-deck code at 150x58 (ground mesh 17,400 triangles, up from
  12,000) with its own deep-blue palette, wind combs, curls and oval storms, and the strongest belts of the four (height
  strength .9 against Jupiter's 1). The banked far deck rises behind the ridges, so the deck recedes in layers instead
  of rolling as one smooth sheet.
- **Cloud banks and wisps**: the ten random five-puff heaps became four band-aligned rows of half-buried domes, and the
  wisp layers lie low on the deck as thin streaks, driven at their fast Neptune speed.
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

Evidence: `docs/screenshots/stage28/` (approach, deck, and the storm on the walking camera). Audit at 12/44/72/99:
z-fighting 0, solids 12, platforms 108, 0 malformed, duplicate or heavy-overlap entries, 0 page errors (one run flagged
a pair of streamed scenery planes 1.8 cm apart at x 44; it did not reproduce in two reruns). No FPS claim.

## Stage 29 — Pluto: a layered surface with depth, and the heart plain kept playable

- **A real terrain grid**: the ground went from the default 128x54 sheet to 208x82 (about 2 m columns where you walk), so
  scarps, plain edges and ice peaks are carried by geometry instead of averaged away: ground mesh **40,772 triangles**,
  while the walkway and the ice-slide lane still measure exactly flat (largest deviation 0.000 m over 57 lane vertices).
- **The heart plain, with depth**: Pluto's nitrogen-ice plain is now a heart-shaped basin **6.2 m deep with a 3.2 m raised
  tholin rim**, cut from the crust with an implicit heart outline and gated by `sstep(-8, -16, z)` so nothing within 8 m
  of the walkway changes height. Relief now runs from -5.85 m on the plain floor to +36.5 m at the ice mountains, where
  the old sheet had one ridge band and a flat painted patch.
- **Layered surface**: tholin-stained crust with stacked frost strata on the scarps, a dark tholin stain, the bright ice
  floor with polygonal convection cells and darker lanes between them, a tholin rim around the plain, and bright ice with
  crevasse shadows on the high ground - all at 5-40 m scales, so the new grid can resolve every one.
- **The ice mountains**: three angular peaks (14/17/12 m over 30-38 m radii) built from a sharpened ridge function, so
  they read as crags rather than smooth drifts.
- **Kept working**: the bounce castles still launch the player (a 0.48 m pad threw them to vy **4.07**), a squish wall
  still squishes (**4 walls to 3**), the matching game is built (`G.plutoMatch`), and the heart's ice lane still slides
  (**0.35 m** coast against 0.22 m off the lane), with 0 page errors.

Evidence: `docs/screenshots/stage29/` (approach, heart plain, heart). Audit at 12/60/120/200: z-fighting 0 at 60/120/200,
solids 12/16/16/16, platforms 108/111/111/120, 0 malformed, duplicate or heavy-overlap entries, 0 page errors (one run
flagged a pair of streamed scenery planes 3 cm apart at x 12; it did not reproduce in two reruns). Frames 56 calls /
87,378 tris at the approach, 58 / 86,160 on the plain, 61 / 89,000 at the heart. No FPS claim.

Next: the character/pet material pass.
