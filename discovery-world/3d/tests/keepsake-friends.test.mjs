// Seven unique keepsake/drawing residents; repeated photos are represented only once.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(existsSync(join(root, 'src/keepsake-friends.js')), 'the seven unique keepsakes need solid 3D models');
const temp = await mkdtemp(join(tmpdir(), 'discovery-keepsake-friends-'));
let KEEPSAKE_FRIENDS, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { KEEPSAKE_FRIENDS } from './src/keepsake-friends.js'; export { makeBatch, shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'silent' });
  ({ KEEPSAKE_FRIENDS, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = ['keepsakesnow', 'doodletuft', 'doodletall', 'doodleears', 'doodleflower', 'keepsakeballoon', 'keepsakechalk'];
const meshes = Object.fromEntries(keys.map(key => {
  const batch = makeBatch(); KEEPSAKE_FRIENDS[key].build(batch);
  const mesh = batch.mesh(shinyMat()); mesh.updateMatrixWorld(true); return [key, mesh];
}));
const vertices = mesh => {
  const p = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color;
  return Array.from({ length: p.count }, (_, i) => ({ x: p.getX(i), y: p.getY(i), z: p.getZ(i), color: new THREE.Color(c.getX(i), c.getY(i), c.getZ(i)) }));
};
const nearPaint = (p, hex, distance = .04) => { const c = new THREE.Color(hex); return Math.hypot(p.color.r - c.r, p.color.g - c.g, p.color.b - c.b) < distance; };
function frontPaint(mesh, x, y) {
  const hit = new THREE.Raycaster(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1)).intersectObject(mesh)[0];
  assert.ok(hit, 'feature has a solid front surface');
  return { color: new THREE.Color().fromBufferAttribute(mesh.geometry.attributes.color, hit.face.a) };
}

test('seven unique keepsakes are Earth residents with short greetings and playable responses', () => {
  assert.deepEqual(Object.keys(KEEPSAKE_FRIENDS), keys);
  const actions = new Set(['twirl', 'bounce', 'sing', 'sparkle', 'hug']);
  for (const key of keys) {
    const s = KEEPSAKE_FRIENDS[key];
    assert.equal(s.planet, 'earth'); assert.ok(!s.pet); assert.equal(s.size, 1); assert.equal(s.emoji, '🖍️');
    assert.ok(s.r >= 1 && s.r <= 1.2 && s.v <= .65);
    assert.match(s.voice, /Hello|Hi/); assert.ok(s.voice.length < 110);
    assert.ok(actions.has(s.play.action)); assert.ok(s.play.line.length < 100); assert.ok(s.play.colors.every(c => /^#[\da-f]{6}$/i.test(c)));
  }
});

test('each keepsake is one finite painted solid, bounded and below 3000 triangles', () => {
  for (const [key, mesh] of Object.entries(meshes)) {
    assert.equal(mesh.material, shinyMat()); assert.equal(mesh.material.map, null);
    for (const attr of ['position', 'normal', 'color']) assert.ok(Array.from(mesh.geometry.attributes[attr].array).every(Number.isFinite), `${key}: finite ${attr}`);
    assert.ok(mesh.geometry.index.count / 3 <= 3000, `${key}: ${mesh.geometry.index.count / 3} triangles`);
    const bounds = new THREE.Box3().setFromObject(mesh), size = bounds.getSize(new THREE.Vector3());
    assert.ok(bounds.min.y >= -.02 && size.y >= 1.4 && size.y <= 2.2, `${key}: height ${size.y}, floor ${bounds.min.y}`);
    assert.ok(size.x <= 2.7 && size.z >= .3 && size.z <= 1.3, `${key}: true volume fitting beside the path`);
  }
});

test('snow keeps three stacked balls, raised snow arms, flat snow hat and straight stick mouth', () => {
  const mesh = meshes.keepsakesnow, v = vertices(mesh);
  for (const y of [.42, .97, 1.48]) assert.ok(nearPaint(frontPaint(mesh, 0, y), '#f6f5e9'));
  assert.ok(v.some(p => p.x < -.45 && p.y > 1.5) && v.some(p => p.x > .45 && p.y > 1.5), 'both snow arms raised');
  assert.ok(v.some(p => Math.abs(p.x) > .35 && p.y > 1.8), 'broad flat hat rim');
  for (const [x, y] of [[0, 1.77], [.37, 1.80], [-.37, 1.80], [.23, 1.97], [-.23, 1.97]]) assert.ok(nearPaint(frontPaint(mesh, x, y), '#f6f5e9'), 'blocky snow hat has filled corners and joins the head');
  for (const side of [-1, 1]) for (const [x, y] of [[.39, 1.12], [.46, 1.36], [.49, 1.56]]) assert.ok(nearPaint(frontPaint(mesh, side * x, y), '#f6f5e9'), 'raised snow-arm joints remain filled');
  assert.ok(nearPaint(frontPaint(mesh, 0, 1.40), '#4d473f'), 'straight mouth stays visible');
});

test('tuft friend keeps green head tufts, beard and a tall brush held in a flower-shaped hand', () => {
  const mesh = meshes.doodletuft, v = vertices(mesh);
  assert.ok(v.filter(p => p.x < -.65 && p.y > 1.25 && nearPaint(p, '#378e55')).length > 40, 'tall green brush');
  assert.ok(v.some(p => p.x > .35 && p.y > 1 && nearPaint(p, '#378e55')), 'right tuft');
  assert.ok(v.some(p => Math.abs(p.x) < .2 && p.y < .55 && nearPaint(p, '#378e55')), 'green beard');
  assert.ok(v.some(p => p.x < -.7 && p.y < 1.05 && nearPaint(p, '#fff6df')), 'flower hand retains pale lobes');
  assert.ok(nearPaint(frontPaint(mesh, -.11, .85), '#856a4a'), 'small dot eye visible');
});

test('tall blue friend keeps the long tapered body, upper eye marks, middle dots and low smile', () => {
  const mesh = meshes.doodletall, v = vertices(mesh), ink = '#354db0';
  assert.ok(v.filter(p => p.y > 1.7).every(p => Math.abs(p.x) < .35), 'top is narrower than belly');
  assert.ok(v.some(p => p.x < -.75) && v.some(p => p.x > .75), 'long sideways arms');
  for (const [x, y] of [[-.13, 1.29], [.13, 1.22], [-.07, 1.01], [.08, 1.01], [0, .69]]) assert.ok(nearPaint(frontPaint(mesh, x, y), ink), `ink ${x},${y} visible`);
});

test('big-eared friend keeps unequal ears, swept crest and angular asymmetric eyes', () => {
  const mesh = meshes.doodleears, v = vertices(mesh), ink = '#375768';
  const left = v.filter(p => p.x < -.38 && p.y > 1.5), right = v.filter(p => p.x > .38 && p.y > 1.2 && p.y < 1.8);
  assert.ok(left.length > 30 && right.length > 30);
  assert.ok(Math.max(...left.map(p => p.y)) > Math.max(...right.map(p => p.y)) + .1, 'long left ear is taller than round right ear');
  assert.ok(v.some(p => p.x > .25 && p.y > 1.9), 'swept top crescent');
  assert.ok(nearPaint(frontPaint(mesh, -.23, 1.11), ink) && nearPaint(frontPaint(mesh, .17, .99), ink), 'pupils visible in unequal angular eyes');
  assert.ok(nearPaint(frontPaint(mesh, -.06, .61), ink), 'small smile visible');
});

test('flower friend has a solid lobed head and blue bands across its separate trapezoid body', () => {
  const mesh = meshes.doodleflower, v = vertices(mesh), ink = '#6c9fc1';
  assert.ok(v.filter(p => p.y > 1.1 && Math.abs(p.x) > .4).length > 80, 'wide scalloped head');
  assert.ok(v.some(p => p.y < .3 && p.z > .15 && nearPaint(p, ink)), 'lowest diagonal band');
  assert.ok(nearPaint(frontPaint(mesh, -.03, 1.32), ink), 'head smile visible');
  assert.ok(nearPaint(frontPaint(mesh, 0, .52), ink), 'middle body band visible');
});

test('yellow balloon retains unequal eyes, little stars, forehead loop, smile and tied knot', () => {
  const mesh = meshes.keepsakeballoon, v = vertices(mesh), ink = '#684185';
  assert.ok(v.filter(p => nearPaint(p, '#f3db25')).length > 100, 'yellow balloon surface');
  assert.ok(v.some(p => p.y < .45 && nearPaint(p, '#f3db25')), 'tied yellow knot');
  assert.ok(v.filter(p => p.y > 1.45 && nearPaint(p, ink)).length > 50, 'forehead loop and upper star');
  assert.ok(v.filter(p => p.x > .27 && p.y < 1.1 && nearPaint(p, ink)).length > 20, 'star at large eye edge');
  assert.ok(nearPaint(frontPaint(mesh, .21, 1.12), ink), 'large eye central pupil visible');
  assert.ok(nearPaint(frontPaint(mesh, 0, .76), ink), 'smile sits on balloon surface');
});

test('chalk person retains long tan hair, purple shirt with yellow/pink patch and cyan shorts', () => {
  const mesh = meshes.keepsakechalk, v = vertices(mesh);
  assert.ok(v.some(p => p.x < -.2 && p.y > 1.2 && nearPaint(p, '#ac866e')) && v.some(p => p.x > .2 && p.y > 1.2 && nearPaint(p, '#ac866e')), 'long hair on both sides');
  assert.ok(nearPaint(frontPaint(mesh, 0, 1.10), '#eadc70'), 'yellow shirt patch');
  assert.ok(nearPaint(frontPaint(mesh, .15, 1.10), '#db95be'), 'pink patch frame');
  assert.ok(v.some(p => p.y > 1 && nearPaint(p, '#a791d6')), 'purple shirt');
  assert.ok(v.some(p => p.y < .85 && nearPaint(p, '#48bce2')), 'cyan shorts');
  assert.ok(v.some(p => p.x < -.7) && v.some(p => p.x > .7), 'outstretched arms');
  assert.ok(nearPaint(frontPaint(mesh, 0, 1.62), '#edf5eb'), 'chalk smile visible');
  assert.ok(nearPaint(frontPaint(mesh, .60, 1.25), '#d4b69e') && nearPaint(frontPaint(mesh, .20, .30), '#d4b69e'), 'arms and legs share the face skin tone');
});
