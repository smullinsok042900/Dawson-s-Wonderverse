# Play Together: a world you share

2–4 people on different phones, tablets or computers play in one **private family room**. It is not just markers any
more: everyone plays in the **same world**.

## What is shared (build 56)

- **Each other's creatures** walk, jump and ride where they really are, with a coloured ring under them and a gem over
  their head. Others are drawn about 150 ms in the past, between two received positions, so movement is smooth.
- **The Block Builder wall** in the Creative Meadow: blocks placed or rubbed out on one device appear on every device,
  so you can build one tower together and climb on what a friend built.
- **The big paint wall** in the Studio: every line a friend paints appears on your wall as they paint it, and 🗑️ clears
  it for everyone.
- **Pets**: each player's pets follow them, and are drawn walking behind them on the other devices too.
- **A 👋 wave**: a picture and a sound, nothing to read. No chat, no names, no text of any kind.
- **The room keeps its world** in the database when everybody leaves, so the tower and the painting are still there the
  next time the same room code is used.

What stays **yours on your device**: your saves, star bits, gems, crown and wand, pets you made, learning progress,
adventures and rewards. A room never changes those. The one exception is what the world itself shows: blocks and paint
lines that are shared are kept in your own saved world too, so they are still there after you leave the room.

## How it works

- The game stays on GitHub Pages (same link). Rooms use **Firebase Realtime Database** (Google) with anonymous sign-in:
  each device gets a private random id; no email, name or password.
- Rooms live under `dw3/rooms/<CODE>`: `players` (where everyone is), `objects` (what everyone built or painted) and
  `events` (a wave, removed again after half a minute). A path of the game's own, so an older game's rooms can never
  collide with these.
- Every value the database can carry is small and checked by the code (`src/shared.js`) **and** by the database rules:
  a number of a block, a short coloured line on the wall, or a wave. A room cannot carry text or chat.
- Firebase's code is a separate file (`mp-firebase.js`, about 310 KB) that is **only downloaded when someone presses
  Create or Join**. Solo and offline play load nothing new and behave exactly as before.
- The family's Firebase project is already set up in `src/mp-config.js`. Its values are public by design (they end up in
  the game page); what protects the rooms is the database's rules.

## The one thing left to do once: paste the rules

1. Go to **console.firebase.google.com** and open the project (`dawsons-world`).
2. **Build → Realtime Database**. If there is no database yet: **Create Database**, pick a location near you, **Start in
   locked mode**.
3. Open the database's **Rules** tab, select everything and replace it with the **whole** contents of
   [`firebase-rules.json`](firebase-rules.json) (it is in this folder, next to this file). Press **Publish**.
4. **Build → Authentication → Sign-in method → Anonymous → Enable** (if it is not on already).
5. **Authentication → Settings → Authorized domains**: make sure `smullinsok042900.github.io` is there.
6. If you ever make a new Firebase project, put its `apiKey`, `authDomain`, `databaseURL`, `projectId` and `appId` into
   `src/mp-config.js` and paste the same rules into the new database.

What the rules do: only a signed-in game device can read a room, and only if it knows its four-letter code; each device
can write only its own player entry; a room holds at most 4 players; and `objects`/`events` only accept the three small
shared shapes (a block, a paint batch of at most 24 lines, a wave). Text is refused.

## Cost and free limits (Firebase "Spark" plan: free, no credit card)

| Limit | Free amount | What it means here |
|---|---|---|
| Players connected at once | 100 | far more than one family needs |
| Data downloaded per month | 10 GB | 4 players use about 10–20 MB per hour together, so hundreds of hours a month |
| Data stored | 1 GB | a room keeps up to 200 blocks, 60 paint batches and 40 waves: a few hundred KB at most |

If the free limit were ever reached, the rooms would simply stop working until the next month: Firebase does not charge
on the Spark plan.

## Testing on two real devices

1. Make sure both devices have the newest game: open the game, then ⚙️ → Performance Test → Copy Test Results. The
   first line shows the build: it must be **56 or later**.
2. On device 1, tap **👫**, then the big **🏠✨** button. Four big animal pictures appear (e.g. 🐶🦊🐸🐮), and the voice
   says them.
3. On device 2, tap **👫**, then the big **🔑👫** button, and press the same four animal pictures in the same order.
4. Both see each other: the other player's creature has a **coloured ring** under it and a **coloured gem** over its
   head. Walk and jump on one device and watch the other.
5. **Build together:** go to the Block Builder (map → Creative Meadow, x ≈ 208). Build a few blocks; they appear on the
   other device, and you can climb on them there too.
6. **Paint together:** go to the Studio's big wall (x ≈ 61). Draw with a finger; the lines appear on the other device
   as you draw. Tap 🗑️: the wall is clean on both.
7. **Pets:** make a pet in the Pet Workshop. The other device sees it walking behind you.
8. **Wave:** tap 👫 → 👋. The other device hears a chime and sees sparkles and a waving hand over you.
9. **Leave and come back:** tap 👫 → 🚪 on one device. The other sees the friend go, but the tower and painting stay in
   the room. Joining the same four pictures again shows them again.
10. Try it on **cellular**: turn Wi-Fi off on one device. Lock the screen for a minute and unlock: the game reconnects by
    itself (a "Connected again!" message).

## Notes for the next build

- The colouring pictures, the karts, the train and the rest of the world are still each device's own; the two shared
  places are the Block Builder wall and the paint wall.
- Paint is shared live while you are in the room. A picture painted before you joined stays on your own device (it is
  part of your saved world) and is not uploaded.


## If a room says "no" (troubleshooting)

The game no longer closes when a room is refused: it says a picture message instead. If it shows **🔒 The room service
said no**:

1. Open the game with `?mpcheck` on the end of the link (`…/discovery-world/3d/?mpcheck`). A white page of lines
   appears: the project and database it uses, whether anonymous sign-in worked, and what Firebase answered for a read
   and a write. Those lines say exactly what is wrong — send them in the chat.
2. The usual cause is that the rules were not published on **the database the game uses**. Compare the `database:` line
   of `?mpcheck` with **Realtime Database** in the console: they must be the same address, and that database's **Rules**
   tab must hold the whole of `firebase-rules.json` (press **Publish**; a red error means it was not accepted).
   - If publishing the full rules gives an error, paste [`firebase-rules-simple.json`](firebase-rules-simple.json)
     instead: it allows any signed-in device to read and write inside a room, and nothing else. It is less strict
     (no size/shape limits at the database), but the game itself still only ever sends the small checked values, and it
     is enough for a private family room.
   - If `?mpcheck` says `read room players: error — Permission denied` while `sign-in: OK`, the rules are not on that
     database yet (this is exactly the state to fix). Be sure the paste goes into **Realtime Database → Rules** of the
     project named on the `project:` line — not **Firestore**, which is a different product with its own Rules tab.
3. The next usual cause: anonymous sign-in is off (Build → Authentication → Sign-in method → Anonymous → Enable), or
   `smullinsok042900.github.io` is missing from Authentication → Settings → Authorized domains.
