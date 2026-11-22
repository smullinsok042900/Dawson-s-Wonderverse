// Real registry, merged meshes and resident behavior for the next collection of family artwork.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-craft-friends-'));
let SPECIES, PET_KINDS, creatureMesh, populate, CRAFT_FRIENDS, CRAFT_FRIEND_HOMES;
try {
  await build({ stdin: { contents: `export { SPECIES, PET_KINDS, creatureMesh, populate } from './src/planet-life.js'; export { CRAFT_FRIENDS } from './src/craft-friends.js'; export { CRAFT_FRIEND_HOMES } from './src/craft-friend-homes.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'life.mjs'), logLevel: 'silent' });
  ({ SPECIES, PET_KINDS, creatureMesh, populate, CRAFT_FRIENDS, CRAFT_FRIEND_HOMES } = await import(pathToFileURL(join(temp, 'life.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const kinds = CRAFT_FRIEND_HOMES.map(h => h.kind);
const planets = ['moon', 'mercury', 'mars', 'venus', 'saturn', 'uranus', 'neptune', 'pluto'];

function fixture(kind) {
  const sp = SPECIES[kind], layer = sp.planet === 'earth' ? '' : 'space', X = layer ? 10000 : 0;
  const P = { x: X + 10, y: 0, z: 0, vy: 0, layer }, group = new THREE.Group(), taps = new Map(), messages = [], bursts = [], tones = [], U = [];
  const k = { P, G: {}, X, layer, ground: () => 0, add: g => group.add(g), U,
    Sound: { giggle() {}, chime() {}, tone: (...args) => tones.push(args) }, say: (...args) => messages.push(args),
    api: { burst: (...args) => bursts.push(args) }, tapIt: (g, run, x, id) => taps.set(id, run) };
  const residents = populate(k, [[kind, 10, -.8]]);
  assert.equal(residents.length, 1, kind + ' spawns through the existing resident system');
  return { P, resident: residents[0], messages, bursts, tones, step: (dt, t) => U.forEach(update => update(dt, t)),
    tap: () => { const run = taps.get('pal_' + kind); assert.ok(run, 'registered as a world resident'); run(); } };
}

test('thirty artwork characters have one home each, including all figures on the shared sheets', () => {
  assert.equal(CRAFT_FRIEND_HOMES.length, 30);
  assert.deepEqual([...kinds].sort(), Object.keys(CRAFT_FRIENDS).sort(), 'every model has exactly one world home');
  assert.equal(new Set(kinds).size, 30, 'no duplicate resident keys');
  assert.equal(new Set(CRAFT_FRIEND_HOMES.map(h => h.source)).size, 27, 'twenty-seven distinct photos include the two-figure and three-bee sheets');
  assert.equal(CRAFT_FRIEND_HOMES.filter(h => h.planet === 'earth').length, 6);
  for (const planet of planets) assert.equal(CRAFT_FRIEND_HOMES.filter(h => h.planet === planet).length, 3, 'three residents on ' + planet);
  assert.equal(CRAFT_FRIEND_HOMES.filter(h => h.planet === 'jupiter').length, 0, 'the busy Jupiter playground has no added residents');
  for (const h of CRAFT_FRIEND_HOMES) {
    const sp = SPECIES[h.kind]; assert.equal(sp, CRAFT_FRIENDS[h.kind], h.kind + ' is registered with its actual model');
    assert.equal(sp.planet, h.planet); assert.ok(!sp.pet && !PET_KINDS.includes(h.kind));
    assert.ok(sp.name && h.source && h.landmark && (h.planet !== 'earth' || h.district), 'descriptive name and findable home');
    assert.ok(Number.isFinite(h.x) && Number.isFinite(h.z));
    assert.match(sp.voice, /hello|hi/i); assert.ok(sp.voice.length < 140);
    assert.ok(sp.r >= .5 && sp.r <= 1.2 && sp.v <= .65, 'a small home range avoids nearby attractions');
    assert.ok(['twirl', 'bounce', 'sing', 'sparkle', 'hug'].includes(sp.play.action));
    assert.ok(sp.play.line.length > 8 && sp.play.line.length < 140);
  }
});

test('all thirty residents use one finite painted mesh with the shared material and cached geometry', () => {
  let existingPaint; creatureMesh('puffball').traverse(o => { if (o.isMesh) existingPaint = o.material; });
  for (const kind of kinds) {
    const a = creatureMesh(kind), b = creatureMesh(kind), meshes = [], again = [];
    assert.ok(a && b, kind + ' has real solid geometry'); a.traverse(o => { if (o.isMesh) meshes.push(o); }); b.traverse(o => { if (o.isMesh) again.push(o); });
    assert.equal(meshes.length, 1, kind + ' uses one draw call');
    const mesh = meshes[0], geometry = mesh.geometry;
    assert.equal(geometry, again[0].geometry); assert.equal(mesh.material, existingPaint);
    assert.equal(mesh.castShadow, false); assert.equal(mesh.material.map, null); assert.equal(geometry.userData.shared, true);
    assert.equal(a.userData.dynamic, true);
    for (const name of ['position', 'normal', 'color']) assert.ok(Array.from(geometry.attributes[name].array).every(Number.isFinite), kind + ': finite ' + name);
    assert.ok(geometry.index.count / 3 < 4000, kind + ' stays below 4000 triangles');
    a.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(a), size = bounds.getSize(new THREE.Vector3());
    assert.ok(bounds.min.y >= -.05 && size.y >= 1.1 && size.y <= 2.5, kind + ' fits the other residents');
    assert.ok(size.x <= 3 && size.z <= 2, kind + ' fits beside the path');
  }
});

test('every artwork resident greets and performs its declared activity on its own world layer', () => {
  const actions = new Set();
  for (const kind of kinds) {
    const sp = SPECIES[kind], f = fixture(kind); f.step(.016, 0);
    assert.ok(f.messages.some(([line]) => line.includes(sp.name) && line.includes(sp.voice)), kind + ' speaks its nearby welcome');
    f.messages.length = 0; f.bursts.length = 0; f.tap();
    assert.ok(f.messages.some(([line, aloud]) => line.includes(sp.play.line) && aloud === true), kind + ' speaks its invitation');
    assert.ok(f.bursts.length > 0 && f.resident.act > 0, kind + ' responds visibly'); actions.add(sp.play.action);
    const beforeYaw = f.resident.g.rotation.y;
    if (sp.play.action === 'twirl') { assert.ok(f.resident.twirl > 0); f.step(.1, .3); assert.ok(Math.abs(f.resident.g.rotation.y - beforeYaw) > .5, 'twirl actually turns the resident'); }
    else if (sp.play.action === 'bounce') { assert.ok(f.resident.bounceBig > 0); f.step(.05, .3); assert.ok(f.resident.g.userData.body.position.y > .5, 'bounce actually lifts the resident'); }
    else if (sp.play.action === 'sing') assert.ok(f.tones.length >= 3, 'a song schedules several audible notes');
    else if (sp.play.action === 'sparkle') assert.ok(f.bursts.some(args => sp.play.colors.every(color => args[3].includes(color))), 'sparkles use the artwork colors');
    else if (sp.play.action === 'hug') assert.ok(f.bursts.some(args => Math.abs(args[0] - f.P.x) < .01), 'a hug reaches the player');
    f.step(.05, .5); assert.ok(f.resident.g.userData.body.position.y > 0, kind + ' moves happily');
    assert.ok(!f.resident.gone, 'the resident stays in the world');
    f.P.layer = f.P.layer === 'space' ? '' : 'space'; f.step(.05, .6);
    assert.equal(f.resident.g.visible, false, 'a resident is hidden while the player is on another world layer');
  }
  assert.ok(actions.size >= 4, 'the collection includes several kinds of play');
});
