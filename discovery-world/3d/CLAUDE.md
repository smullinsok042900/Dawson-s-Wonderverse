# Dawson's Discovery World 3D — permanent development instructions

A 3D exploring game for Dawson, a 5-year-old who **cannot read yet**. It is played on an iPhone as a Home Screen app
(GitHub Pages: `https://smullinsok042900.github.io/Dawson-s-Wonderverse/discovery-world/3d/`).

This folder is separate from "Dawson's Wonderverse" (the rest of the repository). Never change files outside `discovery-world/`.

## Non-negotiable rules
- **The game must never get slower.** Measure before and after every change (`PERFORMANCE_LOG.md`). If a change makes any
  measured view slower, adds long tasks or freezes, or adds new shader programs on walking into an area, fix it or drop it.
  Performance, freezes and loading come before new features.
- **Never claim iPhone results from desktop tests.** Say "desktop (software rendering)" for anything measured here.
- **Content:**
  - no reading needed: pictures, sounds and the spoken voice only;
  - no losing, no timers, no ads, no accounts, no purchases, no paid services;
  - original creatures only (no copies of existing games or characters).
- **Never lose progress or features:** saves (localStorage `world`), pets, gems, crown and wand must survive every update.
  Never delete backups.
- **Git:**
  - Work on the session's development branch.
  - Never force-push, never merge your own PR, never commit model names.
  - Ship each verified milestone as a PR to `main`; the user merges.
  - If the branch's PR was merged, restart the branch from `origin/main` first.

## Architecture (`src/`, bundled by `build.mjs` with esbuild into ONE offline `index.html`, about 8.7 MB; Three.js r187)
| File | What it holds |
|---|---|
| `main.js` | Scene, camera, input, save and load, HUD, map, 🏠, 🐾 panel, train strip, adaptive graphics (`applyGfx`, levels 0–5), resize (real canvas size, checked every frame), freeze prevention (`warmAreas`, `compileAll`, `warmObjects`, `compileGroup`/`warmGroup`), scenery slices (24 m groups shown near the camera; objects that move must have `userData.dynamic = true`), test hooks `window.__DDW3` |
| `expansion.js` | Streamed districts (`DISTRICTS`, built part by part within 3.5 ms/frame, from 95 m away; unloaded at 190 m), gems, pals, tunnels. Uses shared materials `G.W.M`, so it adds no new shaders. |
| `train.js` | `STATIONS` (18, x -392 … 892), automatic trips (`goTo`, express up to 36 m/s), `call`, `seatAt` |
| `world.js` | Ground zones, path, rails |
| `nature.js` | Trees, grass, LOD (meshoptimizer) |
| `life.js` | Creature agents (wandering, following, detach when far) |
| `friends.js` | Buddies (Biscuit…), pets, followers |
| `kingdom.js` | Dino Kingdom, castle, crown and wand |
| `learn.js` | Toy-style learning games (tiers 1–3) |
| `voice.js` | Speech |
| `perf.js` | In-game monitor and Performance Test |
| `sculpt.js`, `fur.js`, `creatures.js` | Sculpted creatures |
| `post.js` | Post-processing (`post.lite` on weaker devices) |

- **URL flags:**
  - `?test`: light test mode;
  - `?hq`: no adaptive quality;
  - `?perf`: show the monitor;
  - `?nopost`: no post-processing.
- **Service worker:** `sw.js`.

## The routine for every development session
1. **Start:** `git fetch origin main`. If the development branch's last PR was merged, recreate the branch from `origin/main`.
   Then `cd discovery-world/3d && npm ci` (if `node_modules` is missing) and `node build.mjs`.
2. **Read the docs:** read `NEXT_TASKS.md`, the top of `DEVELOPMENT_LOG.md` and `PERFORMANCE_LOG.md`. Check open PRs and
   the user's latest messages and reports.
3. **Pick and baseline:** pick the highest-priority task you can do without the user. Copy the current `index.html` to
   `../backups/3D_buildNN_index.html` (the next build number) before changing anything.
4. **Make the change**, keeping it small enough to verify in one session.
5. **Measure** before and after with `tests/perf/*.cjs` (always pass the old and new html). Record the numbers in
   `PERFORMANCE_LOG.md`.
6. **Full test:** `NODE_PATH=$(npm root -g) node tests/smoke3d.cjs` (about 35 min, 150+ checks). Run it **alone**, with
   no other browser work at the same time. It rewrites `screenshots/*.jpg`; commit them. Every check must pass.
   - If a check fails, find out whether it is the game or the test. Never weaken a check to get green.
   - Add checks for new features.
7. **Update the docs:**
   - `DEVELOPMENT_LOG.md`: a new checkpoint at the top (what, how verified, desktop vs. iPhone);
   - `NEXT_TASKS.md`;
   - `README.md`: a short section for the build.
8. **Ship:**
   - Commit (`Build NN: …`) and push the development branch.
   - Open a PR to `main` in plain language for a parent: what changes for Dawson, and what was measured.
   - Publish the build to the Claude artifact preview (slug `76274fac-f61d-4a91-a0b6-16979be6f5ec`).
9. **Next task:** continue with the next one if time allows. Leave the branch committed and pushed at the end
   (recoverable state).

## Testing notes
- **Playwright:** the browser is pre-installed. Use `NODE_PATH=$(npm root -g)` and launch Chromium with
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- **The test browser renders at about 1–2 fps,** so per-frame movement is large. Anything timing-based must wait for a
  condition (`waitFor`), not a fixed sleep.
- **Characters walk about:** tap them where they are (`tapChar` in the smoke test), not at fixed coordinates.
