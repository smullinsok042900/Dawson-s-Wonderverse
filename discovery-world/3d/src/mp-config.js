// (build 56) Firebase settings for PLAY TOGETHER (multiplayer). These values are public by design: they end up in the
// game page anyway. What protects the rooms is the database's security rules (see MULTIPLAYER.md and firebase-rules.json).
//
// The family's free Firebase project. Sign-in is anonymous only: each device gets a private random id, with no email,
// name or password. Replace these values (and paste the matching rules) only if you ever make a new project.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDM4aXQa_Q2z1945Fs3h1kAtHYip9wnyu0',
  authDomain: 'dawsons-world.firebaseapp.com',
  databaseURL: 'https://dawsons-world-default-rtdb.firebaseio.com',
  projectId: 'dawsons-world',
  appId: '1:793284371423:web:106e2901cd55a0021fda6a',
};

// (build 62) TALK TOGETHER (voice): how two devices find a way to each other.
// - STUN (free, public, no account): enough for most homes and many phone networks.
// - TURN (a relay for the networks that block direct calls, e.g. some mobile carriers and school/office Wi-Fi): optional.
//   Either list fixed TURN servers in `turn`, or give `turnCredentialsUrl` (a URL that returns a JSON list of ICE servers,
//   e.g. a free Metered.ca "Open Relay" app: https://<yourapp>.metered.live/api/v1/turn/credentials?apiKey=<key>).
//   See MULTIPLAYER.md, "Talking". The audio is encrypted end to end: a TURN relay only passes it on and cannot listen.
export const VOICE_CONFIG = {
  stun: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'],
  turn: [], // e.g. [{ urls: 'turn:global.relay.metered.ca:443?transport=tcp', username: '…', credential: '…' }]
  turnCredentialsUrl: '',
};
