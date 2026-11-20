# Living creatures and collectible pets on every planet: the permanent checklist

The family's request (2026-11-19): every destination full of unique, animated, interactive characters and creatures, and
5–10 discoverable pets per destination that Dawson can befriend (one easy picture interaction), collect, and choose to
have follow her across the whole solar system. Nothing may make the game slower (measure before and after every step).

Work through it one destination per build, from the first row that is not DONE. Each row: inspect what is there, add the
characters and pets, give them behaviours and reactions, befriending and collection, followers across planets, the
multiplayer view, its own browser test, a speed A/B, the full smoke test, then mark the row here.

## The shared systems (first, once)
| # | System | State | Notes |
|---|---|---|---|
| S1 | A creature species table: shape, movement style (hop, float, waddle, roll, flutter), face, idle acts, home planet | DONE (build 107) | `src/planet-life.js` `SPECIES`: one painted mesh per creature (shared shape, shared material), hop / float / roll / slide / bounce, breathing. | Reuse the sculpted-creature pieces and the shared painted material; one draw call per creature where possible. |
| S2 | A lightweight behaviour machine: wander, look, wave at her, react to taps, rest/sleep, play with a neighbour | STARTED (build 107) | Wander near home, turn to her, wave and greet when she comes near, tap reactions, character games (catch-me, light the way to a hidden pet, bounce together). Only creatures within 45 m move. Still to do: sleeping, playing with each other. | Full updates only near the camera; far ones frozen (state kept, mesh hidden); a fixed budget per frame. |
| S3 | Discovering and befriending: tap → big picture buttons (pet ✋, hug 🤗, treat 🍓, play ⚽) → it joins the collection | DONE (build 107) | One happy moment and the pet is hers (saved). | Spoken guidance, no reading. One positive interaction is enough. |
| S4 | The collection (🐾 panel): every discovered pet; undiscovered ones as silhouettes; tap to choose up to 3–5 followers | DONE (build 107) | The planet pets join the Earth pals in 🐾 with real pictures (`tools/make-pet-pictures.cjs`); still-to-find ones are silhouettes; at most 4 follow at once. | Keep the pet maker's pets; save `world.found` (ids) and the chosen followers. Old saves keep working. |
| S5 | Followers on every planet: rebuilt after the rocket lands, spaced, catching up, idle acts, playing with each other | DONE (build 107) | All her friends (Earth pals too) now come along to the planets in the rocket (they used to wait on Earth). | Followers are built from the species table; never lost across planets or a reload. |
| S6 | Play Together: each player's followers shown on the others' screens; world creatures react to every player nearby | TODO | Followers already travel in the player state (`ps`); extend it with species ids (rules: string length). |

## Destinations
| # | Destination | Characters (examples) | Pets (5–10) | State |
|---|---|---|---|---|
| 1 | The Moon | Rocky (rolling moon rock: catch-me), Lumi (lantern sprite: lights the way to a hidden pet), Boing (spring hopper: bounce together) | Moonpup, Hopscotch, Stardrop, Dustbun, Orbit, Glimmer Snail | DONE (build 107) |
| 2 | Mars | rocky rollers, a dust-sprite band | crystal pets, dune hoppers | TODO |
| 3 | Mercury | glowing pebble folk | tiny crystal pets, warm ember puffs | TODO |
| 4 | Venus | floating cloud people | mist puffs, sunset flutterbies | TODO |
| 5 | Jupiter | storm sprites | balloon pets, cloud lambs | TODO |
| 6 | Saturn | ring dancers | sparkle comets, star fish | TODO |
| 7 | Uranus | frost sprites | snowflake pets, ice pups | TODO |
| 8 | Neptune | wind whirlers | glowing blue floaters | TODO |
| 9 | Pluto | snowball folk | frost fluffs, snowball pups | TODO |
| 10 | Earth | woodland puffballs and fantasy animals (beside the existing pals) | woodland pets | TODO |

## Rules
- Original creatures only; each species its own shape and movement (not a recolour).
- Picture and voice only; no losing; no timers.
- A creature on a planet is built only while she is there (`PLANET_EXTRA`), and freed when she flies away.
- Measure (desktop, software rendering) before and after each destination; never claim iPhone results.
