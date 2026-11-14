# Pet Nursery Implementation Plan

Goal: ship the approved nursery and creative studio as one mergeable release.
Architecture: pure validated nursery state plus an event-driven SVG/DOM playroom, integrated with existing pause/save/voice hooks.
Spec: ../specs/2026-11-14-pet-nursery-design.md

Constraints: no paid services, no timers or declining needs, original creatures, no new world shaders, preserve existing saves, only discovery-world files.
Review focus: malformed saves, stuck input across modals, narrow landscape layout, draw cancellation, art surviving reload.

- [x] Task 1: Create tests/nursery.test.mjs against src/nursery-state.js. Verify first egg, three-tap hatch, care-gated next eggs, independent pets, safe load and bounded art. Observe failure; implement and run units.
- [x] Task 2: Create tests/nursery-browser.cjs exercising real touch controls and legacy save preservation. Observe missing nursery failure. Implement src/nursery.js, styles and main save/pause integration. Add home entry, build 41 and cache bump. Verify actual drawing/apply/sleep/reload and screen sizes.
- [ ] Task 3: Run fixed-view baseline/new performance sequentially and all existing tests. Review branch, record measurements/screenshots in logs and README, commit and open one PR. Never merge it.

Execution ledger: approved scope comes from user's “Do that” after the nursery proposal. Routine implementation choices are delegated by that request; proceed without another approval loop. Existing world and nursery pets remain separate collections so original pets are preserved.

Task 1 complete: seven state tests pass, including a red-to-green malformed locked-selection regression. Existing eight adventure and three audio checks pass.
Review: focus restoration, voice stop, landscape color access, palette target size, third-pet reward indicator and HUD reservation corrected. Canvas clipping traced using elementFromPoint and fixed with sticky paper/preview; pet framing corrected for landscape.

Task 2 complete: actual browser checks pass for keyboard hatching, all three pets, care, drag feeding, mouse/touch drawing, designs on pet, sleep/wake, reload with existing crown/wand/discoveries, four nursery layouts, calm mode and home-gallery entry. Browser review screenshots inspected. Task 3 sequential validation is running; do not open another browser until it completes.
