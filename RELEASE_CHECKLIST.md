# RELEASE CHECKLIST — Dawson's World 3D overhaul

PR: **#104** https://github.com/smullinsok042900/Dawson-s-Wonderverse/pull/104 (draft until every box is true)
Build root: `discovery-world/3d`

## Build and tests

- [ ] `npm ci` clean install from the committed lockfile (no dependency upgrades to make it pass)
- [ ] `npm run build` succeeds and writes `index.html`
- [ ] `node tests/scene-audit.test.mjs` — all tests pass
- [ ] `node tests/spatial.test.mjs` — all tests pass
- [ ] Headless load of the built game: 0 page errors, no "Oops" overlay at every changed area
- [ ] `window.__DDW3.audit()` at each stage's positions: 0 z-fighting, 0 malformed solids/platforms,
      0 heavy overlaps; any duplicates/buried entries explained (character face spheres, terrain masses)

## Graphics coverage

- [ ] Every Earth district has a completed geometry pass (stage list in `DEVELOPMENT_ROADMAP.md`)
- [ ] Every planet/moon has a completed geometry + material pass
- [ ] Characters, creatures and pets have had the material/shape pass
- [ ] Before/after screenshots exist for every stage under `discovery-world/3d/docs/screenshots/`
- [ ] Visual identity preserved: colourful, child-friendly, no frightening redesigns

## Gameplay preservation

- [ ] Rides: carousel, Ferris wheel, Dottie's back/slide, train, zip line, paper plane, rocket
- [ ] Attractions and minigames still respond to taps and the PAW control
- [ ] Save/load still restores stickers, shells, gallery, pets/followers, adventures and wearables
- [ ] Multiplayer (Firebase) code paths unchanged and still bundled
- [ ] No collision/platform entry removed or malformed by the overhaul
- [ ] Touch controls, camera and HUD layout verified at phone sizes

## Performance

- [ ] Per-district draw-call and triangle cost recorded with the harness probes
- [ ] No stage increases draws without justification; new scenery merged or instanced
- [ ] Texture memory and compression reviewed (KTX2/Basis optional, must keep a fallback path)
- [ ] Real-device run on iPhone Safari **and** Android Chrome; frame rate and loading recorded
- [ ] Simulated (software WebGL) numbers labelled as such — never presented as device performance

## Pull request

- [ ] Branch `feature/full-3d-overhaul` in the **original** repository is based on its latest `main`
- [ ] PR contains only overhaul paths; original backups, workflows and unrelated files untouched
- [ ] PR description lists completed stages, remaining work, test results and evidence links
- [ ] Branch rebuilt on the runner (`index.html` matches the verified build) and PR head confirmed
- [ ] Latest original `main` merged/rebased into the branch with conflicts resolved safely
- [ ] `DEVELOPMENT_ROADMAP.md`, `PROGRESS.md`, `NEXT_TASKS.md` and this checklist accurate
- [ ] PR is **not** merged; approval requested from the repository owner

## Sign-off

- [ ] Owner reviewed the draft PR and approved merging
