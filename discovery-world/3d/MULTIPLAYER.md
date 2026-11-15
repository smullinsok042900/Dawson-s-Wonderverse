# Play Together (multiplayer): setup and testing

2–4 people on different phones, tablets or computers play in one **private family room**: they see each other's
creatures walking and jumping around the world. Works on Wi-Fi and cellular. Each device keeps its own saves, pets,
creations and rewards: only movement is shared. No public lobby, no chat, no names.

## How it works
- The game stays on GitHub Pages (same link). The rooms use **Firebase Realtime Database** (Google), with anonymous
  sign-in: each device gets a private random ID; no email, name or password.
- Firebase's code is in a separate file (`mp-firebase.js`, ~310 KB) that is **only downloaded when someone presses
  Create or Join**. Solo and offline play load nothing new.
- Until `src/mp-config.js` is filled in, the 👫 button is hidden and the game is exactly as before.

## Cost and free limits (Firebase "Spark" plan: free, no credit card)
| Limit | Free amount | What it means here |
|---|---|---|
| Players connected at once | 100 | far more than one family needs |
| Data downloaded per month | 10 GB | 4 players use about 10 MB per hour together, so hundreds of hours a month |
| Data stored | 1 GB | rooms hold only positions and are removed when everyone leaves |

If the free limit were ever reached, the rooms would simply stop working until the next month: Firebase does not charge
on the Spark plan.

## One-time setup (a grown-up, about 5 minutes)
1. Go to **console.firebase.google.com** and sign in with a Google account.
2. **Add project**: any name (e.g. `dawsons-world`); turn Google Analytics **off**; **Create project**.
3. **Build → Realtime Database → Create Database**: pick a location near you; **Start in locked mode**.
4. Open the database's **Rules** tab, replace everything with the rules below, then **Publish**.
5. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
6. **Authentication → Settings → Authorized domains → Add domain**: `smullinsok042900.github.io`.
7. **⚙️ Project settings → Your apps → `</>` (Web)**: give it a nickname, **Register app** (no Hosting), and copy the
   `firebaseConfig` values (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`). These are public by design.
8. Put them in `src/mp-config.js` (or send them to the developer) and rebuild.

### Security rules (paste in step 4)
```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "rooms": {
      "$code": {
        ".validate": "$code.matches(/^[ABCDEFGHJKMN]{4}$/)",
        "players": {
          ".read": "auth != null",
          "$uid": {
            ".write": "auth != null && auth.uid === $uid && (data.exists() || !newData.exists() || data.parent().numChildren() < 4)",
            ".validate": "newData.hasChildren(['x', 'y', 'z', 't']) && newData.child('x').isNumber() && newData.child('y').isNumber() && newData.child('z').isNumber()",
            "x": { ".validate": "newData.val() > -2000 && newData.val() < 9000" },
            "y": { ".validate": "newData.val() > -100 && newData.val() < 200" },
            "z": { ".validate": "newData.val() > -100 && newData.val() < 100" },
            "f": { ".validate": "newData.val() === 1 || newData.val() === -1" },
            "g": { ".validate": "newData.isBoolean()" },
            "r": { ".validate": "newData.isBoolean()" },
            "h": { ".validate": "newData.isBoolean()" },
            "l": { ".validate": "newData.isString() && newData.val().length < 12" },
            "c": { ".validate": "newData.isString() && newData.val().length < 12" },
            "k": { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() < 4" },
            "t": { ".validate": "newData.val() === now" },
            "$other": { ".validate": false }
          }
        }
      }
    }
  }
}
```
What they do: only signed-in game devices can see a room, and only if they know its code. Each device can write only
its own entry. A room holds at most 4 players. Only small position values are accepted: no text, no chat.

## Testing on two real devices
1. Make sure both devices have the newest game: open the game, then ⚙️ → Performance Test → Copy Test Results. The
   first line shows the build: it must be **52 or later**.
2. On device 1, tap **👫**, then the big **🏠✨** button. Four big animal pictures appear (e.g. 🐶🦊🐸🐮), and the voice
   says them.
3. On device 2, tap **👫**, then the big **🔑👫** button, and press the same four animal pictures in the same order.
4. Both see each other: the other player's creature has a **coloured ring** under it and a **coloured gem** over its
   head. Walk and jump on one device and watch the other.
5. Try it on **cellular**: turn Wi-Fi off on one device. Lock the screen for a minute and unlock: the game reconnects
   by itself (a "Connected again!" message).
6. Tap **👫 → 🚪** to leave. The other device sees the friend go. **↩️** with the pictures joins the same room again.

The other player is only shown when you are in the same place (outside, inside the house, on the same planet) and
within about 80 m, so the game only draws what you can actually see.
