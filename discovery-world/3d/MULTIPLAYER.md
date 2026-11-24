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

## Talking together (build 62): live voices

Players in the same room can **talk to each other through the phone's microphone**, like a phone call, while they play:
no typing, no chat, no recorded messages and no other app.

- **Off until a grown-up allows it.** Hold ⚙️, then **🎤 Talking … On** (each device). Without it, the 🎤 in the room
  shows a 🔒 and the microphone is never touched.
- **Then, in the room (👫):** tap the big **🎤▶**. The phone asks for the microphone once (tap **Allow**). From then on
  just talk; there is nothing to hold down.
- **🎤 next to 👫** (only while talking is on): one tap mutes (🔇, red) and unmutes. Its little red light means the
  microphone is live; it glows green while you speak.
- **A friend who speaks** shows a 🗣️ over their head, and their dot in the room panel lights up.
- **Volume:** 🔈 🔉 🔊 in the room panel (remembered). Game sounds keep playing alongside the voices.
- **Don't want to hear someone?** Tap their dot in the room panel: 🚫. The call between you two ends (neither hears the
  other). Tap again to undo.
- **🎤✖** turns talking off; **🚪** leaving the room turns it off too; a grown-up's ⚙️ **Off** stops it at once. A page
  reload or update always starts with talking off again.
- **Headphones and Bluetooth:** used automatically when the phone switches to them.

### How it works and what is private
- Each pair of players in the room has one **WebRTC** call (at most 4 players, so at most 3 calls per device). The
  sound goes directly between the devices when it can, encrypted (DTLS-SRTP, always on in WebRTC), as **Opus** voice
  (mono, about 32 kbit/s, with loss recovery and silence suppression).
- The calls are set up through the room itself: a tiny private "inbox" per player (`dw3/rooms/<CODE>/sig/<id>`). The
  rules allow writing to it **only by players who are in that room**, and reading it **only by its owner**. Messages
  are deleted as soon as they are read. Who has talking on is `voice/<id>` (just `true`).
- **Nothing is recorded or stored.** The audio is never written anywhere; it only exists in the live call.
- Cost: about 4 KB/s per friend in each direction while someone speaks, much less in silence. The voice work runs on
  a small timer (about 7 times a second) and inside the browser's own audio engine, never in the game's drawing loop.

### One thing to do once: paste the NEW rules
**Recommended: the full rules.** The simple rules also let talking work, but with them any signed-in device that knows
the room's four pictures could read the call messages; the full rules allow each inbox to be read only by its owner.
Talking needs the updated [`firebase-rules.json`](firebase-rules.json) (it adds `voice` and `sig`). Paste it exactly
as in step 3 below and press **Publish**. Until then, everything else still works, and the 🎤 says the room service said
no. `?mpcheck` shows two new lines: `write talking` and `write call message` must both say `allowed`.

### Different networks (TURN): optional, recommended for phones on mobile data
Two devices on the same Wi-Fi, or at home on most internet connections, connect with the free public **STUN** servers
already in `src/mp-config.js`. Some networks (many mobile carriers, school or office Wi-Fi) block direct calls; then a
**TURN relay** is needed, which passes on the (still encrypted) audio. Without one, talking on those networks may not
connect, while the rest of Play Together still works. Free choice that needs no server of your own:
1. Make a free account at **metered.ca** → **TURN Server** (the free plan includes 20 GB a month; one hour of two
   people talking uses about 30 MB).
2. Create an app; copy its **API key**. The credentials URL looks like
   `https://<your-app>.metered.live/api/v1/turn/credentials?apiKey=<key>`.
3. Put it in `src/mp-config.js` as `turnCredentialsUrl: '…'` (or ask Claude to). This key only lets the game use
   your relay; it cannot read anything.

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

## Shared rides (build 100): the rocket you fly in TOGETHER

Everyone in the room uses **the same rocket** on each launch pad:

- **Climb in** (tap the rocket): you take the next free seat (click-click: seatbelt on) and **your face shows in your own
  round window** of the rocket, on every friend's screen.
- **The first one in picks the planet** (the big pictures). Friends who climb in after see that planet on their big
  button, and press it when they are ready (✋).
- **The pilot's big button starts ONE countdown for everybody.** If a friend has not pressed ready after a short wait,
  the rocket goes anyway (nobody is stuck). Every passenger's phone flies the same rocket at the same moment, to the
  same planet, lands together, and everyone climbs out side by side.
- **Friends who stay on the pad** watch the rocket lift off; on the other planet, friends there see it come down.
- **Disconnecting:** a seat (or a pilot) that loses the connection is removed by the database itself, so the others are
  never stuck. Climbing out (✖ or JUMP) before the countdown gives your seat back.
- **The Moon coaster:** friends standing on the station platform when the train sets off hop on in the next seats, and
  each one sees the others in their seats on the same train.
- **The Earth train (build 103):** when a friend drives the train, it is the same train on every screen. Tap it at the
  station to hop on in a seat behind them (up to three friends); you ride together and get off together. Nothing new is
  sent, so it needs no new rules.
- **The Venus log ride (build 104):** the log holds two. Standing at the log station when a friend sets off, you hop in
  behind them (or tap the log); you ride the whole flume together and get out together. No new rules either.

**Needs the new rules (once):** shared rides use a new part of the room, `live`. Until the rules below are published
again, the shared rocket simply does not appear (each phone flies its own rocket, as before) and everything else in a
room works exactly as it did. After publishing, it works at once (no update needed on the phones).

## Open space together (build 127)
Friends in one room who fly up into open space (🌌) see each other's **rockets** out there, gliding smoothly, and a friend on a
**spacewalk** floating beside their rocket, as themselves. Each player sends their rocket as one short text, `dk`
(`"x,y,z,turn"`), and, while out there, their own place as a half-size offset from that rocket (so every number stays
inside the database's limits; the tether keeps a spacewalker within 110 m). **Needs the rules once more:** paste the
updated [`firebase-rules.json`](firebase-rules.json) (it adds `dk`, a text under 60 letters) and press **Publish**. Until then
a phone in open space is not accepted by the room while it is out there (it shows again as soon as it lands); everything
else works as before. The simple rules need no change. Test: `node tests/space-together.cjs`.

## Magic bubbles (build 106)
- In a room there is a big 🫧 button. Tap it and your friend blows a rainbow bubble at the nearest friend (it aims for
  you: no aiming needed; if nobody is near, the bubble just floats off and pops).
- The friend it reaches is lifted up inside the bubble, swaying, about four of their own heights; they can steer it a
  little with ◀ ▶, and tap the big 💥 (or JUMP) to pop it at once. Otherwise it pops by itself after a few seconds.
  Pop: a burst of little bubbles, a fall, a soft bounce and dizzy stars. No damage, nothing lost.
- Fair play: a short wait between bubbles; after landing you cannot be bubbled again for a while; no bubbles on rides,
  in the rocket, indoors or under water; and the 🫧 in the room panel switches bubbles off on this phone (crossed out =
  off: nobody can bubble you, and your own 🫧 button hides).
- What is sent: one tiny event when a bubble is blown (who, at whom), and `b: 1` in your player state while you are inside
  a bubble. Your own phone moves you, so everyone sees the same float through the positions already sent.
- **Needs the rules once more** (the event type `bubble` and the `b` field). Until they are published again, bubbles are
  simply refused by the database: nothing else in a room changes.

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
(Build 100) `live` holds the shared rides: each player may write only their **own** seat (`s_<their id>`: which vehicle,
which seat, ready or not); a vehicle record (`f_…`: who is the pilot, boarding or going, the planet, the start time) may
be written only by its pilot, and anyone in the room may clear one away. Both are removed by the database when their
player disconnects, and only small numbers and short words are accepted.

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

- The colouring pictures, the karts and the rest of the world are still each device's own; the two shared
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
   - (Build 62 fixed a mistake in the full rules: before, Firebase refused to publish them with *No such method/property
     'numChildren'*. They are now checked on Firebase's own database emulator: `tests/firebase-rules.emulator.mjs`.)
   - If publishing the full rules gives an error, paste [`firebase-rules-simple.json`](firebase-rules-simple.json)
     instead: it allows any signed-in device to read and write inside a room, and nothing else. It is less strict
     (no size/shape limits at the database), but the game itself still only ever sends the small checked values, and it
     is enough for a private family room.
   - If `?mpcheck` says `read room players: error — Permission denied` while `sign-in: OK`, the rules are not on that
     database yet (this is exactly the state to fix). Be sure the paste goes into **Realtime Database → Rules** of the
     project named on the `project:` line — not **Firestore**, which is a different product with its own Rules tab.
3. The next usual cause: anonymous sign-in is off (Build → Authentication → Sign-in method → Anonymous → Enable), or
   `smullinsok042900.github.io` is missing from Authentication → Settings → Authorized domains.
