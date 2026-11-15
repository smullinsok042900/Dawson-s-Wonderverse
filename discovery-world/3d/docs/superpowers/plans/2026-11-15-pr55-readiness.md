# PR #55 readiness implementation plan

> **For agentic workers:** Use the systematic-debugging and test-driven-development workflows; the primary agent integrates and verifies the fixes.

**Goal:** Resolve the observed performance stalls and smoke failures, then make PR #55 reviewable with fresh evidence.

**Architecture:** Prepare shader variants before play, retaining small representative materials so unloading planets does not discard their shader programs. Generate expensive planet scenery in bounded scheduled slices; keep the current planet until the destination is ready. Keep the smoke assertions and synchronize interactions with observed gameplay/render state.

**Tech Stack:** JavaScript, Three.js r187, esbuild, node:test, Playwright/Chromium.

**Spec:** User request “Then fix it”; existing performance and verification requirements in `../../../CLAUDE.md`.

## Constraints and review focus

Preserve saves, activities, graphics and streamed planet cleanup. No force pushes or merging the PR. Desktop SwiftShader results are not iPhone measurements. Cover shader retention across revisits, cancellation during preparation, interleaved batch transforms, expanded areas, and actual pet touch targets.

### 1. Smoke synchronization

- [x] Reproduce pet touch behavior independently and inspect slide exit semantics.
- [x] Update `tests/smoke3d.cjs` to wait for a completed landing and a settled rendered pet; preserve assertions and continue reporting after a missing target.
- [x] Run the full suite alone and retain the generated results/screenshots.

### 2. Bounded planet construction

- [x] Add node regressions for sliced work scheduling, cancellation, exact geometry/texture output and transform isolation.
- [x] Implement `runInSlices(iterator, options): Promise` in `src/stream-work.js` with a 3.5 ms slice budget.
- [x] Add compatible generator helpers in `spacekit.js`; adapt `space.js` build/preparation and `main.js` arrival to await readiness.
- [x] Verify node tests and browser travel/cleanup, including cancellation and expanded areas.

### 3. Shader preparation

- [x] Run `tests/perf/planet-shaders.cjs` against the unchanged build and identify missing shader variants.
- [x] Rehearse representative variants in the actual rendering target before play, including sky, dust, transparent and double-sided effects. Retain the representatives across planet unloading.
- [x] Require no new shader variants or shader readiness waits in the regression probe; compare identical performance scenarios against the saved baseline.

### 4. Integration and delivery

- [x] Run build, node tests, learning/world regressions, performance comparison and full smoke suite.
- [x] Review final diff; update build/readiness docs and PR description with measured evidence.
- [x] Commit and push to the existing PR branch; confirm GitHub merge status without merging.
