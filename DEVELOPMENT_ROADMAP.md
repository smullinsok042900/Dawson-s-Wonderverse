# DEVELOPMENT ROADMAP — Dawson's World 3D overhaul

Development repository: `smullinsok042900/dawsons-world-test` (branch `main`)
Original game repository: `smullinsok042900/Dawson-s-Wonderverse` (never written directly)
Draft pull request: **#104** → https://github.com/smullinsok042900/Dawson-s-Wonderverse/pull/104

Last verified commit: `22ffb14` (stage 10 synced into the PR; branch head `8466076`)
Game root: `discovery-world/3d` · build: `npm run build` → one `index.html`

## How work is delivered

1. Implement one stage in `discovery-world/3d/src`.
2. `npm run build`; `node tests/scene-audit.test.mjs`; `node tests/spatial.test.mjs`.
3. Capture paired before/after shots with the committed harness (`tools/capture.cjs`).
4. Run `window.__DDW3.audit()` at the new stage's positions; record duplicates/z-fighting/solids/platforms.
5. Update `PROGRESS.md`, `docs/GRAPHICS_OVERHAUL_PROGRESS.md`, this roadmap and `NEXT_TASKS.md`.
6. Commit and push to `dawsons-world-test/main`.
7. Run the `Sync the 3D overhaul` workflow on `feature/full-3d-overhaul`; the PR branch is filled from
   the verified build, tests + `build.mjs` run on the runner, and the same PR updates.

## Phase 1 — Earth districts (in progress)

| # | District | Status | Notes |
|---|---|---|---|
| 1 | Playhouse | done (stage 2/6) | rug, bunting, lanterns, play mats, toy shelf |
| 2 | Park | done (stages 2/7) | wildflowers, boulders, lamps, sculpted hills + mountain range |
| 3 | Castle front + throne room | done (stages 3/4/8) | parterres, urns, lanterns, ropes, banners, facade depth |
| 4 | Dino Valley | done (stages 3/6/8) | broad-leaf jungle, fallen log, footprints, lofted Dottie, palms |
| 5 | Toy Town | done (stages 5/8) | toy-box spill, balls, tops, rebuilt Ferris wheel + carousel |
| 6 | Lab Gardens | done (stage 9) | glazed greenhouses, beds, fences, potting lab, copper pipe |
| 7 | Art Plaza | done (stage 10) | painted paving, planters, easels, drying rack, paint pots, bunting |
| 8 | Sunny Seaside | **next** | surf/wet sand, umbrellas + towels, pier railing + lamps, gulls, beach balls |
| 9 | Whispering Woods | todo | layered canopy, trunks with bark, undergrowth, campfire surround |
| 10 | Frosty Peaks | todo | snow/ice materials, drifts, ice columns, wind-shaped rock |
| 11 | Happy Farm | todo | crop rows with real plants, fences, barn timber, hay |
| 12 | Ocean Pier | todo | plank depth, pilings, crates, buoys, gulls |
| 13 | Balloon Hills | todo | terraced hills, balloon clusters, launch platform |
| 14 | Adventure Trail | todo | zip-line towers/trolley detail, chests, trail markers |
| 15 | Home / Studio / Wonder Lab | todo | interiors: furniture geometry, wall trim, instruments |

## Phase 2 — planets and moons

Order: Moon → Mercury → Venus → Mars → Jupiter → Saturn → Uranus → Pluto (plus Earth orbit/sky stairs).
Per planet: crater rims + ejecta, layered regolith vertex colours, ring geometry, cloud bands, horizon
atmosphere, attraction structures. Reuse the loft / vertex-colour / merge helpers from stages 7–8.

## Phase 3 — characters, creatures, pets

Material and shape pass only (no rig changes): fur-shell tuning, eye highlights, bevels on hard edges,
shared materials, LOD for far followers. Preserve every animation, pet behaviour and save field.

## Phase 4 — collision, placement and regression checks

- Keep the scene audit (`src/scene-audit.js`) as the placement gate for every stage.
- Sweep rides/vehicles after model changes (seat heights, gondola cabins, carousel saddles) as in stage 9.
- Add a regression check for each confirmed defect class so it cannot silently return.
- Bounding-box audits still produce known false positives (terrain masses, merged batches); document them.

## Phase 5 — performance on phones

- Collision interval index done (stage 1). Keep new scenery merged or instanced (1 draw per batch).
- Measure per-group geometry cost with the harness; never quote whole-scene totals (streaming).
- Remaining work: draw-call budget per district, texture sizes/compression, LOD for distant scenery,
  shader warm-up, and a real-device pass on iPhone Safari and Android Chrome. No FPS claim without hardware.

## Phase 6 — tooling (assessed 2026-11-23)

- glTF-Transform CLI 4.5.1 installed as a devDependency; reads and rewrites the game's meshopt GLBs.
- KTX-Software `ktx` v4.4.2 installed under `~/ktx/bin`; `gltf-transform etc1s` produces KHR_texture_basisu.
- Blender 4.2.3 LTS runs headless from `~/blender-4.2.3-linux-x64` with user-space X libs (see PROGRESS.md).
- Not yet wired into the game: KTX2 runtime loading, texture compression of shipped assets, Blender rebuilds.

## Phase 7 — release

See `RELEASE_CHECKLIST.md`. The PR stays a draft and is never merged without explicit approval.
