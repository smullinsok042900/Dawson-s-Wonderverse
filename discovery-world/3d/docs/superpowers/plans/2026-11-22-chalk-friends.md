# Chalk Friends Implementation Plan

**Goal:** Add both of the daughter's drawings as interactive 3D world residents.
**Architecture:** Two procedural painted toy models use planet-life's existing species registry, merged shared geometry, greeting/tapping reactions and district lifecycle. No avatar or pet registration.
**Tech stack:** Three.js, esbuild, node:test, Playwright.
**Spec:** ../specs/2026-11-22-chalk-friends-design.md

## Constraints
- Offline, picture/sound/spoken interaction; preserve saves and existing features.
- One mesh per creature, shared existing material, no new shader variant, no shadow pass.
- Photos remain outside the public repository; descriptive temporary names.
- Development branch and PR; user merges. Desktop results are not iPhone results.

## Review focus
- Both new NPCs stream out and back exactly once, with old interactions removed.
- Existing avatar and pet choices remain unchanged.
- Actual pointer taps and paw activate the intended resident rather than nearby toys.
- Mesh geometry is finite, bounded and shared, and captures the distinctive drawings.
- Existing saved progress survives interaction and reload; no shader growth on revisit.

## Task 1: Models and existing NPC reactions
- [x] Add failing tests in tests/chalk-friends.test.mjs for two non-pet Earth species, finite/low-cost/shared meshes, spoken greetings and distinct twirl/copy reactions using populate.
- [x] Implement src/chalk-friends.js model definitions; register them and tap reactions in src/planet-life.js. Reuse existing c.twirl/c.copy behavior.
- [x] Run focused node tests and inspect rendered models from multiple angles.

## Task 2: District integration and browser verification
- [x] Add failing focused browser checks in tests/chalk-friends.cjs for spawning, actual touch/paw, distinct reactions, no duplicates on unload/revisit, save reload and unchanged avatar choices.
- [x] Add lifeHere calls to Toy Town (chalkgreen,587,-4.2) and Art Plaza (chalkpink,827,-2.7) in src/expansion.js. Add matching icon metadata if needed using existing toy emoji.
- [x] Preserve build119 baseline and ../backups/3D_build120_index.html; increment GAME_BUILD to 120, build offline index.html and version.json.
- [x] Run focused browser checks; capture close-ups and in-world screenshots; measure old/new at both homes and relevant unchanged views using tests/perf scripts.

## Task 3: Verification and delivery
- [x] Run node --test tests/*.test.mjs, node tests/unit/learning-contract.cjs and node tests/world-regressions.cjs.
- [x] Run npm test (full smoke) alone and resolve failures without weakening checks.
- [x] Update README, DEVELOPMENT_LOG, NEXT_TASKS and PERFORMANCE_LOG with measured evidence and device limitations.
- [x] Obtain independent diff review, commit, push branch and open PR to main. Do not merge.

## Additional task: Five marker residents
- [x] After the first pair's focused browser checks, add src/marker-friends.js with five drawing-based non-pet species and tests/marker-friends.test.mjs with real geometry/face/silhouette checks.
- [x] Register in planet-life and add short existing-system tap activities (song/wave/hug/bounce/sparkles), no new timers or shader types.
- [x] Place one each in seaside/farm/hills/frosty/labgarden according to the spec; extend focused real browser touch/paw/lifecycle checks and full-smoke resident checks to all seven.
- [x] Extend before/after performance comparison to all seven homes, inspect screenshots for fidelity and clarity, and run the final full suite alone on the combined update.
