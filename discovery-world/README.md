# Dawson's Discovery World

One giant, continuous, close-up side-scrolling play world for Dawson (age 5). It blends the **Mega Playhouse → Imagination Studio → Wonder Lab → Adventure Park** with no levels, menus or loading. Three original fantasy creatures to play as: **Pip, Zuzu and Jelly**.

> This is a separate project from *Dawson's Wonderverse*. It lives in its own `discovery-world/` folder and shares no code or assets with it.

## Play it
- **Play link (Claude artifact, private to you until you share it):** https://claude.ai/artifact/JoGYy6YGuMyDgESituRf6X. Open it on the iPhone while signed in to claude.ai and turn the phone sideways. In the artifact viewer, saving progress may be blocked by the viewer's sandbox. The game keeps working, but it may forget progress between visits.
- **Single file:** `index.html` is fully self-contained (no internet, accounts, API keys or downloads needed). Open it in any modern browser.
- **Free public HTTPS hosting with saving (recommended for the iPhone):** see "Free hosting" below.

## Controls (no reading needed)
- ◀ ▶ hold to walk · ⬆ jump (tap again in the air to double jump)
- Touch everything: drag and throw balls, paint the wall with a finger, tap buckets, SPIN, the bubble button, the lever, the magnet, the launch pad, the wheel, the coaster and the rainbow door. Tap your creature to tickle it.
- The white pointing hand shows something new to try.
- Keyboard on a computer: arrows / A D, Space to jump, 1 2 3 to switch creature.

## The big chain to discover
Pour two paints into the bowl → SPIN → the new colour flows down the pipe → press the bubble button → coloured bubbles float into the Wonder Engine's funnel → when all 6 battery cells are full, pull the lever → POWER! The Star Launch Pad wakes up (stand on it), the wheel and coaster light up, the coaster train is painted in your colour, and the magnet grabs every ball. Also try: the giant bubble ride, the slide off the tower, the whoosh tube at the far right end, and the 6 hidden secret stars.

## Folder map
| Path | What it is |
|---|---|
| `index.html` | **The game**: the built single-file version to play or host |
| `src/js/00_core.js` | constants, drawing helpers, colour mixing, sound, particles |
| `src/js/10_creatures.js` | Pip / Zuzu / Jelly rigs and animation |
| `src/js/20_state.js` | world layout, platforms, save / restore / migration |
| `src/js/30_scenery.js` | parallax backdrop and every prop / machine / ride drawing |
| `src/js/40_systems.js` | physics, rides, the interaction chain, tap targets |
| `src/js/50_input_ui.js` | touch / keyboard input, HUD |
| `src/js/60_main.js` | render order, hint hand, game loop, boot |
| `src/style.css`, `src/index.template.html` | page layout and HUD |
| `build.mjs` | joins `src/` into `index.html` (Node.js, no packages) |
| `tests/smoke.cjs` | automated browser test (Playwright) → `tests/TEST_RESULTS.json`, `screenshots/` |
| `backups/` | the original game (unchanged) and the playable file of every earlier build |
| `releases/` | (not stored in git) full backup zips are sent in the chat with each build, to keep the website small |
| `docs/` | audit, test report, the original design brief |
| `CHANGELOG.md` | what changed in each milestone |

## Editing
1. Edit files in `src/`.
2. `node build.mjs` → regenerates `index.html`.
3. `node tests/smoke.cjs` → runs the 54-check browser test (needs Playwright + Chromium installed).

## Free hosting (no cost)
**GitHub Pages:** in this repository on github.com go to **Settings → Pages**. Under "Build and deployment", choose *Deploy from a branch*, pick the branch that contains this folder and `/ (root)`, then press Save. After a minute the game will be at
`https://<your-github-name>.github.io/<repo-name>/discovery-world/`.
Open that on the iPhone in Safari. Optionally use Share → *Add to Home Screen* to give it its own icon. Saving works there because it's a normal website.
(Note: on a free GitHub plan, Pages needs a public repository.)

**Not recommended:** opening the `.html` straight from the iPhone Files app. iOS often shows it as text or blocks the scripts.
