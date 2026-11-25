// (build 130) Dawson and her family as toy characters (Dawson, Mom, Dad, Aunt Ayla, Gigi, Grandpa and Buck the dog).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-family-'));
let FIRST_HOMES, SECOND_HOMES, STORY_FRIENDS, STORY_FRIEND_HOMES, FAMILY_FRIEND_HOMES, CRAFT_FRIEND_HOMES, SPECIES, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { FAMILY as STORY_FRIENDS, FAMILY_HOMES as STORY_FRIEND_HOMES } from './src/family.js'; export { STORY_FRIEND_HOMES as FIRST_HOMES } from './src/story-friends.js'; export { STORY_FRIEND_HOMES_2 as SECOND_HOMES } from './src/story-friends-2.js'; export { FAMILY_FRIEND_HOMES } from './src/family-friend-homes.js'; export { CRAFT_FRIEND_HOMES } from './src/craft-friend-homes.js'; export { SPECIES } from './src/planet-life.js'; export { makeBatch, shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'error' });
  ({ FIRST_HOMES, SECOND_HOMES, STORY_FRIENDS, STORY_FRIEND_HOMES, FAMILY_FRIEND_HOMES, CRAFT_FRIEND_HOMES, SPECIES, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = Object.keys(STORY_FRIENDS);

test('the family: Earth residents with a greeting and a playful response, all registered', () => {
  assert.equal(keys.length, 7);
  assert.deepEqual(keys.map(k => STORY_FRIENDS[k].name), ['Dawson', 'Dad', 'Mom', 'Aunt Ayla', 'Gigi', 'Grandpa', 'Buck the Dog']);
  const actions = new Set(['twirl', 'bounce', 'sing', 'sparkle', 'hug']);
  for (const k of keys) {
    const s = STORY_FRIENDS[k];
    assert.equal(SPECIES[k], s, `${k} is in SPECIES`);
    assert.equal(s.planet, 'earth'); assert.ok(!s.pet);
    assert.match(s.voice, /Dawson/); assert.match(s.voice, /Hello|Hi|Woof/); assert.ok(s.voice.length < 110);
    assert.ok(actions.has(s.play.action)); assert.ok(s.play.line.length < 100);
    assert.ok(s.play.colors.every(c => /^#[\da-f]{6}$/i.test(c)));
  }
});

test('each one is a finite painted solid on the ground, light enough (≤ 3600 triangles)', () => {
  for (const k of keys) {
    const b = makeBatch(); STORY_FRIENDS[k].build(b); const m = b.mesh(shinyMat()); m.updateMatrixWorld(true);
    assert.equal(m.material, shinyMat());
    for (const attr of ['position', 'normal', 'color']) assert.ok(Array.from(m.geometry.attributes[attr].array).every(Number.isFinite), `${k}: finite ${attr}`);
    assert.ok(m.geometry.index.count / 3 <= 3600, `${k}: ${m.geometry.index.count / 3} triangles`);
    const bb = new THREE.Box3().setFromObject(m), size = bb.getSize(new THREE.Vector3());
    assert.ok(bb.min.y >= -.02 && bb.min.y < .05, `${k}: stands on the ground (${bb.min.y})`);
    assert.ok(size.y >= .7 && size.y <= 1.9 && size.x <= 1.3 && size.z <= 1.8, `${k}: size ${size.toArray()}`);
  }
});

test('every friend has exactly one home, behind her path and apart from the others', () => {
  assert.deepEqual(STORY_FRIEND_HOMES.map(h => h.kind).sort(), [...keys].sort());
  for (const h of STORY_FRIEND_HOMES) assert.ok(h.z <= -3.5 && h.z >= -5, `${h.kind}: z ${h.z}`);
  for (const a of STORY_FRIEND_HOMES) for (const c of STORY_FRIEND_HOMES) if (a !== c) assert.ok(Math.hypot(a.x - c.x, a.z - c.z) >= 1.4, `${a.kind} and ${c.kind} too close`);
  // and well away from every resident who already lived there (the family's friends and the fixed residents in expansion.js)
  const src = readFileSync(join(root, 'src/expansion.js'), 'utf8');
  const fixed = [...src.matchAll(/lifeHere\(c, \[\['(\w+)', (-?[\d.]+), (-?[\d.]+)\]/g)].map(m => ({ kind: m[1], x: +m[2], z: +m[3] }));
  const residents = [...FIRST_HOMES, ...SECOND_HOMES, ...FAMILY_FRIEND_HOMES, ...CRAFT_FRIEND_HOMES.filter(h => h.planet === 'earth'), ...fixed];
  assert.ok(fixed.length >= 8 && residents.length >= 20);
  for (const a of STORY_FRIEND_HOMES) for (const c of residents) assert.ok(Math.hypot(a.x - c.x, a.z - c.z) >= 5 + (STORY_FRIENDS[a.kind].r ?? 1.1), `${a.kind} is too close to ${c.kind}`); // (build 136: 5 m plus how far it wanders, so a walking friend never ends up nearest to an older friend's 🐾) // (5 m: the PAW button picks the nearest friend)
});

test('no story friend stands on an activity (its 🐾 spot would take the activity\'s place)', () => {
  // tests/activity-spots.json: every activity's 🐾 spot per district, read from the running game (build 129); refresh it when activities move
  const spots = JSON.parse(readFileSync(join(root, 'tests/activity-spots.json'), 'utf8'));
  for (const h of STORY_FRIEND_HOMES) for (const x of spots[h.district] || []) assert.ok(Math.abs(h.x - x) >= 2.5, `${h.kind} at ${h.x} stands on the activity at ${x}`);
});
