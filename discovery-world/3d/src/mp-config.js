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
