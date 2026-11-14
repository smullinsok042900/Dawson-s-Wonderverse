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


## Expanded execution ledger

User correction: replace illustrated nursery with native 3D matching existing game. User additions: audit/convert other flat gameplay, fix issues, and improve speed and toy-like realism. All remain one release.

- Native shared renderer viewport: src/playroom3d.js, main pause/resize integration; no second context or screenshot facade.
- Native furnished nursery scene: src/nursery-room3d.js; saved art is texture only on real fabric/frames.
- All41 learning toys: src/learning-3d.js with semantic descriptors in learn.js; retain event targets and demos.
- World physical props: expansion.js uses cached single-draw native models; sign sprites remain legitimate UI.
- Model library: toy-models.js + permanent tests, original solid glyphs with distinct lowercase, semantic coverage, bounded cache, single vertex-color batch.
- Core fixes: interaction-targets.js; meadow dynamic/incremental blocks; life and post exact-appearance work reductions.

Initial3D nursery browser passed. Whole-learning browser revealed ❓ fallback; model author correcting placeholders + sad/scared face distinction from final review. Final review also found selected-food/drag feedback mismatch; root fixed room food selection and ray-projected 3D held tools, added actual browser checks. Current code requires rebuild and rerun focused3D+nursery suites, then performance baseline/current, all existing adventure suites, devices and full smoke. No browser tests may run concurrently. Old prototype commit29934db exists but has NOT been pushed; final3D changes still uncommitted. PR not created yet.

Final native checks: 24 unit cases (7 nursery,8 adventure,3 audio,2 visible-target,4 render-work) passed, plus saved builder/model-swap regressions,337 bounded single-draw semantic models and58 distinctions (including all15 feeling pairs and26 letter cases), and41-activity source contracts. Review findings fixed: selected snack propagates to3Dmodel, 3D props ray-project under finger, scared/sad distinct and sleeping face closed. Browser release pipeline started from final8830KB build with pipefail; session68141. It runs nursery → all41learning → fullsmoke → adventure regressions/integration → capscenarios → pairedbefore/afterperformance →11devices sequentially. Logs /tmp/release41-*.log. Do not launch another browser while session68141 runs.

Final nursery and all41nativelearning browsers passed. First fullsmoke run found the initial right-walk fixed600ms hold advanced only1 cappedphysicsframe (1.2→2.5m); no missinginput. Replaced only that fixed wait with bounded movement condition while realtouch remainsheld. Same >2m distance assertion retained, per CLAUDE condition-based testing requirement. Interrupted first fullsmoke to restart immediately; no other browseractive.

Final review follow-up: actual browser motion test reproduced perpetual3Dbobbing after a tap even in calm mode (boingclass remains afterCSSanimation ends). Removed redundant manual z-sine; native meshes already follow actual CSS hitboxanimation, whichcalm disables. Redtest /tmp/release41-motion-red.log. Restart all41learning then fullworld/remainingvalidation from finalrebuiltartifact. No further featurework.
