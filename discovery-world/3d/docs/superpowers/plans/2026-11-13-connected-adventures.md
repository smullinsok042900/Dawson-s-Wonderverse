# Connected Adventures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship the approved connected adventures as one release.
**Architecture:** Pure adventure-state module plus DOM adventure/book/gallery panels; semantic events connect existing game systems. Shared-material regional activities and a centralized comfort layer preserve streaming and saves.
**Tech Stack:** Existing JavaScript, Three.js, esbuild, Node test runner, Playwright.
**Spec:** ../specs/2026-11-13-connected-adventures-design.md

## Global Constraints
- No reading required, losing, deadlines, accounts, purchases, or paid services.
- Preserve all existing save fields and features, storage key and backups.
- Modify only discovery-world. Reuse render materials; measure desktop software rendering before and after. Never claim real iPhone verification.
- Deliver one release, no merge.

## Review Focus
- Old/malformed saves must retain unrelated progress and safely default new data.
- Out-of-order/repeated events must not block adventures or duplicate rewards.
- Closing an overlay or switching apps must release controls and resume correctly.
- Audio disabled still allows visible clues and replayable objective pictures.
- Tiny landscape screens must fit all new controls and panels.

### Task 1: Adventure state and persistence
**Files:** src/adventure-state.js, tests/adventures.test.mjs; main.js save/restore hooks.
**Interfaces:** createAdventureState(raw, legacy), emitAdventure(state,event), ADVENTURES, CREATURE_BOOK. JSON-only optional adventure save.
- [ ] Write node tests for malformed saves, event order, duplicate reward, replay, old-save seeds and deterministic catch cycle; watch fail.
- [ ] Implement validated bounded state, adventure catalog, known discoveries and reward effects.
- [ ] Run node --test tests/adventures.test.mjs; expect pass.

### Task 2: Adventure panels and connections
**Files:** src/adventures.js, main.js, learn.js, style.css.
**Interfaces:** initAdventures({world,player,G,voice,Sound,save,travel,learning,fluffs}) returns event/start/open/update/refresh; world.adventures is serialized by main.
- [ ] Add browser integration test for panel pause/close, rescue guide, book silhouettes, gallery persistence and new-save round trip; watch fail.
- [ ] Add event hooks to rescue/discover/learning; optional tutorials and companion home; reward world displays using existing resources; picture/voice UI and gallery snapshots.
- [ ] Run browser integration test and state tests; expect pass.

### Task 3: Regional activities and navigation
**Files:** expansion.js, adventures.js, main.js map, tests/adventures-browser.cjs.
**Interfaces:** api.event(type,payload) forwards semantic events, no parsing messages; activity run targets use explicit IDs.
- [ ] Extend integration tests for pier catches/quest, snow friend, woods visual sound hunt, farming/science/art; watch fail.
- [ ] Add bounded catch variation, persistent sea discoveries, clues, snow building, woods search, companion reactions; illustrate destination tiles.
- [ ] Run targeted integration and state tests; expect pass.

### Task 4: Comfort and accessible interaction
**Files:** src/comfort.js, audio.js, main.js, learn.js, style.css.
**Interfaces:** initComfort({world,Sound,voice,G,save}), world.comfort; effect/music routing with master mute; explicit replay bypasses calm reminder suppression.
- [ ] Test persisted audio/calm/relaxed settings and contextual target matches; watch fail.
- [ ] Add settings UI, reduced particles/flashes/CSS motion, relaxed interaction/jump assistance and contextual paw indicator.
- [ ] Run state/browser and layout checks; expect pass.

### Task 5: Release verification
**Files:** index.html, sw.js, README.md, NEXT_TASKS.md, DEVELOPMENT_LOG.md, PERFORMANCE_LOG.md; tests as above.
- [ ] Build, run before/after perf scripts against backed-up HTML, inspect results and fix regressions.
- [ ] Run full smoke suite alone, device tests, new integration tests and inspect accepted screenshots.
- [ ] Independent final review and fixes, rebuild and repeat affected checks.
- [ ] Update docs with measured results, commit branch and attempt authorized PR delivery if authenticated tooling permits.
