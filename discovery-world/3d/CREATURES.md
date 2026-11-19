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
| S1 | A creature species table: shape, movement style (hop, float, waddle, roll, flutter), face, idle acts, home planet | TODO | Reuse the sculpted-creature pieces and the shared painted material; one draw call per creature where possible. |
| S2 | A lightweight behaviour machine: wander, look, wave at her, react to taps, rest/sleep, play with a neighbour | TODO | Full updates only near the camera; far ones frozen (state kept, mesh hidden); a fixed budget per frame. |
| S3 | Discovering and befriending: tap → big picture buttons (pet ✋, hug 🤗, treat 🍓, play ⚽) → it joins the collection | TODO | Spoken guidance, no reading. One positive interaction is enough. |
| S4 | The collection (🐾 panel): every discovered pet; undiscovered ones as silhouettes; tap to choose up to 3–5 followers | TODO | Keep the pet maker's pets; save `world.found` (ids) and the chosen followers. Old saves keep working. |
| S5 | Followers on every planet: rebuilt after the rocket lands, spaced, catching up, idle acts, playing with each other | TODO | Followers are built from the species table; never lost across planets or a reload. |
| S6 | Play Together: each player's followers shown on the others' screens; world creatures react to every player nearby | TODO | Followers already travel in the player state (`ps`); extend it with species ids (rules: string length). |

## Destinations
| # | Destination | Characters (examples) | Pets (5–10) | State |
|---|---|---|---|---|
| 1 | The Moon | moon-rock pals, a lunar lamplighter | glowing moon pups, bouncing crater hoppers | TODO |
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
