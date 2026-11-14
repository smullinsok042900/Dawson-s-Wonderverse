Learning toys use the shared WebGL renderer through `initLearning3D`.
All 41 activities retain their existing DOM hit targets, data attributes, voice,
rewards, demonstrations and saved progress. Original art helpers declare semantic
model symbols; dynamically changing glyphs, cards, apparatus and puzzle pieces
are synchronized by the adapter. Picture puzzles use CPU-cropped solid relief
geometry, not image textures. The paint canvas remains a drawing interface.

Integration: pass `G` in the initLearning API after creating `G.playroom`.
The adapter mounts the shared canvas behind the overlay controls, updates actual
model positions using live interaction rectangles, and unmounts on close. Shared
model geometry/materials are never disposed; cropped puzzle geometries are owned
and disposed by the adapter. No second WebGL context is created.

Also corrected: non-eaten feeding props, repeated mixture stars, stale free-game
rewards across activity changes/closing, band demo progress, cancelled drags,
cancelled paint strokes, nearest overlapping drop targets, X phonics, narrow-screen
grids and play layouts.

Verification performed without launching a browser: JavaScript syntax checks and
`node tests/unit/learning-contract.cjs` (source-level regression contracts).
These checks do not establish visual correctness, frame performance, iPhone
behavior, or browser interaction coverage. Run the required baseline/current
performance comparisons and the full smoke suite before shipping.
