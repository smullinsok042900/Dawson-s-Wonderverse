// (build 52) Firebase for PLAY TOGETHER, built into its own small file (mp-firebase.js) that is only downloaded when
// someone presses Create or Join: solo players never load it, and the main game file stays the same size.
export * as appMod from 'firebase/app';
export * as authMod from 'firebase/auth';
export * as dbMod from 'firebase/database';
