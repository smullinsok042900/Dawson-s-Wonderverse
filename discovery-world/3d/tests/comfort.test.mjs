import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const moduleAt = async path => import('data:text/javascript;base64,' + Buffer.from(await readFile(new URL(path, import.meta.url))).toString('base64'));
const { normalizeComfort, initComfort } = await moduleAt('../src/comfort.js');
const { Sound } = await moduleAt('../src/audio.js');
test('comfort defaults and reduced motion are validated without mutating saves', () => {
  assert.deepEqual(normalizeComfort(null, false), { speech:true, music:true, effects:true, calm:false, relaxed:false });
  assert.equal(normalizeComfort({}, true).calm, true);
  const raw = { speech:false, music:'false', effects:0, calm:false, relaxed:true, other:42 };
  assert.deepEqual(normalizeComfort(raw, true), { speech:false, music:true, effects:true, calm:false, relaxed:true });
  assert.equal(raw.other, 42);
});
test('music and effect routing are independent and master mute wins', () => {
  const originalEnsure = Sound.ensure;
  let calls = 0;
  Sound.ensure = () => { calls++; return null; };
  Sound.on = true; Sound.effectsEnabled = false; Sound.musicEnabled = true;
  Sound.tone(); Sound.noise(); assert.equal(calls, 0);
  Sound.withMusic(() => Sound.bell(440)); assert.equal(calls, 3);
  Sound.musicEnabled = false; Sound.effectsEnabled = true;
  Sound.withMusic(() => Sound.tone()); assert.equal(calls, 3);
  Sound.tone(); assert.equal(calls, 4);
  Sound.on = false; Sound.tone(); Sound.withMusic(() => Sound.tone()); assert.equal(calls, 4);
  Sound.on = true; Sound.musicEnabled = true;
  assert.throws(() => Sound.withMusic(() => { throw Error('test'); }));
  assert.equal(Sound._musicChannel, false);
  Sound.ensure = originalEnsure;
});

test('initialization applies validated settings without saving and changes persist', () => {
  const classes = new Map();
  globalThis.document = { documentElement: { classList: { toggle: (key, value) => classes.set(key, value) } } };
  globalThis.matchMedia = () => ({ matches: true });
  const world = {}, sound = { on: false }; let saves = 0, stops = 0, notified;
  const panel = initComfort({ world, Sound: sound, voice: { stop: () => stops++ }, G: { onComfortChange: value => notified = value }, save: () => saves++ });
  assert.equal(saves, 0); assert.equal(world.comfort.calm, true); assert.equal(classes.get('calm'), true);
  panel.apply({ ...world.comfort, music: false, speech: false, calm: false });
  assert.equal(saves, 1); assert.equal(stops, 1); assert.equal(sound.musicEnabled, false);
  assert.equal(sound.effectsEnabled, true); assert.equal(sound.on, false);
  assert.equal(classes.get('calm'), false); assert.equal(notified, world.comfort);
  delete globalThis.document; delete globalThis.matchMedia;
});
