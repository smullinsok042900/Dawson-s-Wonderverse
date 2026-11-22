// The new family keepsakes use the real species registry, models and NPC update loop.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-family-friends-'));
let SPECIES, PET_KINDS, creatureMesh, populate, FAMILY_FRIEND_HOMES;
try {
  await build({ stdin: { contents: `export { SPECIES, PET_KINDS, creatureMesh, populate } from './src/planet-life.js'; export { FAMILY_FRIEND_HOMES } from './src/family-friend-homes.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'life.mjs'), logLevel: 'silent' });
  ({ SPECIES, PET_KINDS, creatureMesh, populate, FAMILY_FRIEND_HOMES } = await import(pathToFileURL(join(temp, 'life.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }

const requiredKinds = ['doodleantenna', 'doodleantennatwin', 'doodlebean', 'doodlewide', 'doodledroopy', 'doodletaper', 'doodlebox', 'doodleloop', 'doodleleaf', 'keepsakesnow', 'doodletuft', 'doodletall', 'doodleears', 'doodleflower', 'keepsakeballoon', 'keepsakechalk'];
const kinds = FAMILY_FRIEND_HOMES.map(h => h.kind);
function fixture(kind) {
  const P = { x: 10, y: 0, z: 0, vy: 0, layer: '' }, group = new THREE.Group(), taps = new Map(), messages = [], bursts = [], tones = [], U = [];
  const k = { P, G: {}, X: 0, layer: '', add: g => group.add(g), U,
    Sound: { giggle() {}, chime() {}, tone: (...args) => tones.push(args) }, say: (...args) => messages.push(args),
    api: { burst: (...args) => bursts.push(args) }, tapIt: (g, run, x, id) => taps.set(id, run) };
  const residents = populate(k, [[kind, 10, -3.6]]);
  assert.equal(residents.length, 1, kind + ' spawns through the existing resident system');
  return { P, resident: residents[0], messages, bursts, tones, step: (dt, t) => U.forEach(update => update(dt, t)),
    tap: () => { const run = taps.get('pal_' + kind); assert.ok(run, 'registered as a world resident'); run(); } };
}

test('the family references produce one district home per intended character, including the requested twins', () => {
  assert.equal(FAMILY_FRIEND_HOMES.length, 16);
  assert.deepEqual([...kinds].sort(), [...requiredKinds].sort(), 'all sixteen requested characters have homes');
  assert.equal(new Set(FAMILY_FRIEND_HOMES.map(h => h.source)).size, 16, 'each reference photo has its own character');
  assert.equal(new Set(kinds).size, kinds.length, 'every intended character has one home');
  for (const home of FAMILY_FRIEND_HOMES) {
    const sp = SPECIES[home.kind]; assert.ok(sp, home.kind + ' is registered');
    assert.equal(sp.planet, 'earth'); assert.ok(!sp.pet && !PET_KINDS.includes(home.kind));
    assert.match(sp.voice, /hello|hi/i); assert.ok(sp.voice.length < 140);
    assert.ok(sp.name && home.district && home.source && home.landmark, 'parent can identify the character and its home');
    assert.ok(Number.isFinite(home.x) && Number.isFinite(home.z) && home.z < -1.5, 'resident stands beside the path');
    assert.ok(sp.r >= 1 && sp.r <= 1.2 && sp.v <= .65, 'small wander range keeps nearby activities clear');
  }
});

test('all new models share the existing single-mesh paint and cached geometry', () => {
  let existingPaint;
  creatureMesh('puffball').traverse(o => { if (o.isMesh) existingPaint = o.material; });
  for (const kind of kinds) {
    const a = creatureMesh(kind), b = creatureMesh(kind), meshes = [], again = [];
    assert.ok(a && b, kind + ' has solid geometry'); a.traverse(o => { if (o.isMesh) meshes.push(o); }); b.traverse(o => { if (o.isMesh) again.push(o); });
    assert.equal(meshes.length, 1); assert.equal(meshes[0].geometry, again[0].geometry); assert.equal(meshes[0].material, existingPaint);
    assert.equal(meshes[0].castShadow, false); assert.equal(meshes[0].material.map, null); assert.equal(meshes[0].geometry.userData.shared, true);
    assert.equal(a.userData.dynamic, true);
  }
});

test('each new resident greets, speaks its invitation, and plays its declared activity', () => {
  const actions = new Set();
  for (const kind of kinds) {
    const sp = SPECIES[kind], f = fixture(kind); f.step(.016, 0);
    assert.ok(f.messages.some(([line]) => line.includes(sp.name) && line.includes(sp.voice)), kind + ' speaks its welcome nearby');
    f.messages.length = 0; f.bursts.length = 0; f.tap();
    assert.ok(f.messages.some(([line, aloud]) => line.includes(sp.play.line) && aloud === true), kind + ' speaks the activity invitation');
    assert.ok(f.bursts.length > 0 && f.resident.act > 0, kind + ' responds visibly'); actions.add(sp.play.action);
    const beforeYaw = f.resident.g.rotation.y;
    if (sp.play.action === 'twirl') { assert.ok(f.resident.twirl > 0); f.step(.1, .3); assert.ok(Math.abs(f.resident.g.rotation.y - beforeYaw) > .5, 'twirl actually turns the character'); }
    else if (sp.play.action === 'bounce') { assert.ok(f.resident.bounceBig > 0); f.step(.05, .3); assert.ok(f.resident.g.userData.body.position.y > .5, 'bounce actually lifts the character'); }
    else if (sp.play.action === 'sing') { assert.ok(f.tones.length >= 3, 'song schedules several audible notes'); }
    else if (sp.play.action === 'sparkle') { assert.ok(f.bursts.some(args => sp.play.colors.every(color => args[3].includes(color))), 'sparkles use the drawing colors'); }
    else if (sp.play.action === 'hug') { assert.ok(f.bursts.some(args => Math.abs(args[0] - f.P.x) < .01), 'hug reaches the player'); }
    else assert.fail('unknown interaction: ' + sp.play.action);
    f.step(.05, .5); assert.ok(f.resident.g.userData.body.position.y > 0, kind + ' has happy movement');
    assert.ok(!f.resident.gone, 'interaction keeps this resident in the world');
  }
  assert.ok(actions.size >= 4, 'the collection includes several kinds of play');
});
