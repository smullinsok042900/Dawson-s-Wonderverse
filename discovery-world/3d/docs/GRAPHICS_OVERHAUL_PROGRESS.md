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

Next: Ocean Pier, Balloon Hills, Adventure Trail, Playhouse,
then the planets in order Moon → … → Pluto, then character/pet material polish.
