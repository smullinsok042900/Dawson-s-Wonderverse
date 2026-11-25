// (build 128) Original story friends: a pop-star trio, a big stripy cat, a snow family and ten puppies.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-story-friends-'));
let STORY_FRIENDS, STORY_FRIEND_HOMES, SPECIES, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { STORY_FRIENDS, STORY_FRIEND_HOMES } from './src/story-friends.js'; export { SPECIES } from './src/planet-life.js'; export { makeBatch, shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'error' });
  ({ STORY_FRIENDS, STORY_FRIEND_HOMES, SPECIES, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = Object.keys(STORY_FRIENDS);

test('eighteen story friends: Earth residents with a greeting and a playful response, all registered', () => {
  assert.equal(keys.length, 18);
  assert.equal(keys.filter(k => k.startsWith('pup')).length, 10);
  const actions = new Set(['twirl', 'bounce', 'sing', 'sparkle', 'hug']);
  for (const k of keys) {
    const s = STORY_FRIENDS[k];
    assert.equal(SPECIES[k], s, `${k} is in SPECIES`);
    assert.equal(s.planet, 'earth'); assert.ok(!s.pet);
    assert.match(s.voice, /Hello|Hi|Woof|Awoo|Sniff|Snort/); assert.ok(s.voice.length < 110);
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
});
