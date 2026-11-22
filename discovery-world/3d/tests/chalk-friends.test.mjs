// Real NPC meshes and behavior, without a browser, WebGL, or substituted production modules.
// Removing either registration/model, its drawing-specific silhouette, or its tap branch must fail these checks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-chalk-friends-'));
let SPECIES, PET_KINDS, creatureMesh, populate;
try {
  await build({ entryPoints: [join(root, 'src/planet-life.js')], bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'life.mjs'), logLevel: 'silent' });
  ({ SPECIES, PET_KINDS, creatureMesh, populate } = await import(pathToFileURL(join(temp, 'life.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const kinds = ['chalkpink', 'chalkgreen'];
const markerActivities = [
  ['drawingblue', /sing|la la/i], ['drawingwave', /wave|twirl/i],
  ['drawinglonglegs', /hug|friend/i], ['drawingteal', /jump|boing/i], ['drawingscribble', /sparkle|color/i],
];
function meshFor(kind) {
  const root = creatureMesh(kind);
  assert.ok(root, `${kind} is a real 3D creature`);
  const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
  assert.equal(meshes.length, 1, `${kind} uses one draw call`);
  return { root, mesh: meshes[0] };
}
function fixture(kind) {
  const P = { x: 10, y: 0, z: 0, vy: 0, layer: '' }, group = new THREE.Group(), taps = new Map(), messages = [], bursts = [], U = [], discoveries = [];
  const k = { P, G: {}, X: 0, layer: '', add: g => group.add(g), U,
    Sound: { giggle() {}, chime() {}, tone() {} },
    say: message => messages.push(message), disc: id => discoveries.push(id),
    api: { burst: (...args) => bursts.push(args) },
    tapIt: (g, run, x, id) => taps.set(id, run) };
  const residents = populate(k, [[kind, 10, -2.7]]);
  assert.equal(residents.length, 1, `${kind} lives in the world`);
  const resident = residents[0];
  const step = (dt, t) => U.forEach(update => update(dt, t));
  return { P, group, resident, messages, bursts, discoveries, step, tap: () => { const run = taps.get('pal_' + kind); assert.ok(run, 'registered as a world NPC, not a pet'); run(); } };
}

test('both drawings are named Earth residents with a small home range, not collectible pets', () => {
  for (const [i, kind] of kinds.entries()) {
    const species = SPECIES[kind]; assert.ok(species, `${kind} is registered`);
    assert.equal(species.name, ['Pink Chalk Friend', 'Green Chalk Friend'][i]);
    assert.equal(species.planet, 'earth'); assert.ok(!species.pet);
    assert.ok(species.r >= 1.2 && species.r <= 1.5); assert.ok(!PET_KINDS.includes(kind));
  }
});

test('chalk residents have bounded, finite, cached solid painted meshes without textures or shadows', () => {
  const existingMaterial = meshFor('puffball').mesh.material;
  for (const kind of kinds) {
    const a = meshFor(kind), b = meshFor(kind);
    assert.notEqual(a.root, b.root); assert.equal(a.mesh.geometry, b.mesh.geometry); assert.equal(a.mesh.material, existingMaterial);
    assert.equal(a.mesh.castShadow, false); assert.equal(a.mesh.material.map, null); assert.equal(a.mesh.material.vertexColors, true);
    assert.equal(a.root.userData.dynamic, true); assert.equal(a.mesh.geometry.userData.shared, true);
    const geometry = a.mesh.geometry;
    for (const name of ['position', 'normal', 'color']) assert.ok(Array.from(geometry.attributes[name].array).every(Number.isFinite), `${kind} finite ${name}`);
    assert.ok(geometry.index.count / 3 < 4000, `${kind} stays below 4000 triangles`);
    a.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(a.root), size = box.getSize(new THREE.Vector3());
    assert.ok(box.min.y >= -.03 && size.y >= 1.65 && size.y <= 2.1, `${kind} stands at NPC scale: ${size.y}`);
    assert.ok(size.x < 2 && size.z < 2, `${kind} fits beside the path`);
  }
});

test('pink retains the drawing’s long left-curving tail, separated long legs and two downward teeth', () => {
  const { mesh } = meshFor('chalkpink'), p = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color;
  const leftFoot = [], rightFoot = [], leftTooth = [], rightTooth = [], tail = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < .45 && Math.abs(x) < .45) (x < 0 ? leftFoot : rightFoot).push(y);
    if (x < -.95 && y < .95) tail.push(x);
    if (y > 1.02 && y < 1.23 && z > .3 && c.getX(i) > .9 && c.getY(i) > .9 && c.getZ(i) > .9) (x < 0 ? leftTooth : rightTooth).push(x);
  }
  assert.ok(tail.length > 10, 'long curved tail is part of the solid model');
  assert.ok(leftFoot.length > 10 && rightFoot.length > 10, 'two long narrow legs reach the ground');
  assert.ok(leftTooth.length > 5 && rightTooth.length > 5, 'two pale teeth sit below the smiling face');
});

test('green retains its oversized head, forward pointed snout and rear head spikes', () => {
  const { mesh } = meshFor('chalkgreen'), p = mesh.geometry.attributes.position;
  const head = [], body = [], nose = [], spikes = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > 1) head.push(x); if (y > .4 && y < .8) body.push(x);
    if (y > 1.1 && z > .72) nose.push(z);
    if (y > 1.15 && z < -.47) spikes.push(z);
  }
  assert.ok(Math.max(...head) - Math.min(...head) > (Math.max(...body) - Math.min(...body)) * 1.4, 'head is much wider than the narrow body');
  assert.ok(nose.length > 5, 'projecting angular snout'); assert.ok(spikes.length > 5, 'backward-pointing spikes');
});

test('green’s smile is visible on the snout surface at both corners and the bottom', () => {
  const { root } = meshFor('chalkgreen'); root.updateMatrixWorld(true);
  const mouthPaint = new THREE.Color('#648b35'), ray = new THREE.Raycaster();
  // Visible smile landmarks, approached from the front of the whole solid creature.
  // Testing the combined mesh ensures the mouth cannot pass while buried behind the snout.
  for (const [x, y] of [[-.147, 1.291], [.147, 1.291], [0, 1.247]]) {
    ray.set(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(root, true)[0]; assert.ok(hit, `front surface at ${x},${y}`);
    const paint = new THREE.Color().fromBufferAttribute(hit.object.geometry.attributes.color, hit.face.a);
    assert.ok(Math.abs(paint.r - mouthPaint.r) < 1e-6 && Math.abs(paint.g - mouthPaint.g) < 1e-6 && Math.abs(paint.b - mouthPaint.b) < 1e-6,
      `the visible surface at smile landmark ${x},${y} is dark mouth paint, not the covering green snout`);
  }
});

test('both world residents greet her nearby and respond with welcoming speech and visible effects', () => {
  for (const kind of kinds) {
    const f = fixture(kind); f.step(.016, 0);
    assert.ok(f.messages.some(message => message.includes(SPECIES[kind].name) && /hello|hi|draw/i.test(message)), 'spoken welcoming greeting');
    f.messages.length = 0; f.tap();
    assert.ok(f.messages.some(message => /twirl|dance|copy|jump/i.test(message)), 'spoken invitation to play');
    assert.ok(f.bursts.length > 0); assert.ok(f.resident.act > 0);
    f.step(.05, .5); assert.ok(f.resident.g.userData.body.position.y > 0, 'visible happy movement');
  }
});

test('pink twirls while green copies walking and jumps using the existing NPC state machine', () => {
  const pink = fixture('chalkpink'); pink.step(.016, 0); pink.tap();
  assert.ok(pink.resident.twirl > 0); assert.ok(!pink.resident.copy);
  const before = pink.resident.g.rotation.y; pink.step(.1, .1);
  assert.notEqual(pink.resident.g.rotation.y, before, 'pink actually turns');
  const green = fixture('chalkgreen'); green.step(.016, 0); green.tap();
  assert.ok(green.resident.copy > 0); assert.ok(!green.resident.twirl);
  green.P.x = 12; green.step(.1, .2); assert.ok(green.resident.tx < green.resident.x0, 'green mirrors a step to the right');
  green.P.vy = 5; green.step(.05, .3); assert.equal(green.resident.hopd, 1, 'green notices her jump');
  assert.ok(green.resident.g.userData.body.position.y > 0, 'green jumps visibly');
});

test('the five marker drawings are world NPCs with spoken tap activities, never pets or avatars', () => {
  for (const [kind, words] of markerActivities) {
    assert.ok(SPECIES[kind], `${kind} is registered as a world resident`);
    assert.equal(SPECIES[kind].planet, 'earth'); assert.ok(!PET_KINDS.includes(kind));
    const f = fixture(kind); f.step(.016, 0); f.tap();
    assert.ok(f.messages.some(message => words.test(message)), `${kind} invites her to its activity`);
    assert.ok(f.bursts.length > 0 && f.resident.act > 0, `${kind} has visible feedback`);
    if (kind === 'drawingteal') { assert.ok(f.resident.bounceBig > 0); f.step(.05, .3); assert.ok(f.resident.g.userData.body.position.y > .5, 'teal friend jumps high'); }
    if (kind === 'drawingwave') assert.ok(f.resident.twirl > 0, 'waving friend twirls');
  }
});

test('green’s copycat game stays within its small home range while Mo keeps his existing reach', () => {
  const green = fixture('chalkgreen'); green.step(.016, 0); green.tap(); green.P.x = 17;
  green.step(.1, .1);
  assert.ok(Math.abs(green.resident.tx - green.resident.x0) <= SPECIES.chalkgreen.r, 'green cannot copy a step into the neighboring toy activities');
  for (let i = 0; i < 30; i++) green.step(.1, .2 + i * .1);
  assert.ok(Math.abs(green.resident.x - green.resident.x0) <= SPECIES.chalkgreen.r, 'green actually stays near home throughout copycat');
  const mo = fixture('mirrormo'); mo.step(.016, 0); mo.tap(); mo.P.x = 17; mo.step(.1, .1);
  assert.ok(Math.abs(mo.resident.tx - 5.8) < 1e-6, 'Mo keeps the full original mirrored walking range');
});
