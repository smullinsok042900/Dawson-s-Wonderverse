// The five marker drawings, tested as actual merged 3D geometry without a browser.
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
assert.ok(existsSync(join(root, 'src/marker-friends.js')), 'the five marker drawings need real 3D species models');
const temp = await mkdtemp(join(tmpdir(), 'discovery-marker-friends-'));
let MARKER_FRIENDS, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { MARKER_FRIENDS } from './src/marker-friends.js'; export { makeBatch, shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'silent' });
  ({ MARKER_FRIENDS, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = ['drawingblue', 'drawingwave', 'drawinglonglegs', 'drawingteal', 'drawingscribble'];
const meshes = Object.fromEntries(keys.map(key => {
  const batch = makeBatch(); assert.ok(MARKER_FRIENDS[key], key + ' has a 3D model'); MARKER_FRIENDS[key].build(batch);
  const mesh = batch.mesh(shinyMat()); mesh.updateMatrixWorld(true); return [key, mesh];
}));
const bounds = mesh => new THREE.Box3().setFromObject(mesh);
const vertices = mesh => {
  const p = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color;
  return Array.from({ length: p.count }, (_, i) => ({ x: p.getX(i), y: p.getY(i), z: p.getZ(i), color: new THREE.Color(c.getX(i), c.getY(i), c.getZ(i)) }));
};
const nearPaint = (p, hex, distance = .04) => { const c = new THREE.Color(hex); return Math.hypot(p.color.r - c.r, p.color.g - c.g, p.color.b - c.b) < distance; };
function frontPaint(mesh, x, y) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(mesh)[0]; assert.ok(hit, 'feature has a solid front surface');
  return { color: new THREE.Color().fromBufferAttribute(mesh.geometry.attributes.color, hit.face.a) };
}

test('all five drawings are Earth residents with descriptive names and short spoken greetings', () => {
  assert.deepEqual(Object.keys(MARKER_FRIENDS), keys);
  const names = ['Blue Drawing Friend', 'Waving Drawing Friend', 'Long-Legged Drawing Friend', 'Teal Drawing Friend', 'Scribble Drawing Friend'];
  for (const [i, key] of keys.entries()) {
    const s = MARKER_FRIENDS[key]; assert.equal(s.name, names[i]); assert.equal(s.planet, 'earth'); assert.ok(!s.pet);
    assert.ok(s.v <= .8 && s.r >= 1 && s.r <= 1.2); assert.equal(s.size, 1);
    assert.match(s.voice, /Hello|Hi/); assert.ok(s.voice.length < 110);
  }
});

test('each drawing is one finite, bounded, inexpensive painted solid using the shared material', () => {
  for (const [key, mesh] of Object.entries(meshes)) {
    assert.equal(mesh.material, shinyMat()); assert.equal(mesh.material.map, null);
    for (const attribute of ['position', 'normal', 'color']) assert.ok(Array.from(mesh.geometry.attributes[attribute].array).every(Number.isFinite), `${key}: finite ${attribute}`);
    assert.ok(mesh.geometry.index.count / 3 < 3500, key + ' is below 3500 triangles');
    const b = bounds(mesh), size = b.getSize(new THREE.Vector3());
    assert.ok(b.min.y >= -.02, key + ' stands on the ground'); assert.ok(size.y >= 1.25 && size.y <= 2.1, key + ' fits the other NPCs');
    assert.ok(size.x <= 2.5 && size.z <= 1.5, key + ' fits beside the path');
    assert.ok(mesh.geometry.attributes.color.count === mesh.geometry.attributes.position.count);
  }
});

test('blue keeps the wide domed body, dark upper band, unequal eyes and short legs', () => {
  const v = vertices(meshes.drawingblue), b = bounds(meshes.drawingblue), ink = '#304eaa';
  assert.ok(b.max.x - b.min.x > 1.8, 'long sideways arms');
  assert.ok(nearPaint(frontPaint(meshes.drawingblue, 0, 1.36), ink), 'upper curved band is visible over the body');
  assert.ok(nearPaint(frontPaint(meshes.drawingblue, -.22, 1.02), ink), 'left dark eye is visible');
  assert.ok(nearPaint(frontPaint(meshes.drawingblue, .18, 1.055), ink), 'larger right dark eye is visible');
  assert.ok(v.some(p => p.y < .2 && p.x < -.12) && v.some(p => p.y < .2 && p.x > .12), 'two short legs');
});

test('waving friend retains green/yellow finger loops and green pupils on a pale body', () => {
  const v = vertices(meshes.drawingwave);
  assert.ok(v.filter(p => p.x < -.65 && nearPaint(p, '#74b788')).length > 20, 'green loops around raised left fingers');
  assert.ok(v.filter(p => p.x > .65 && nearPaint(p, '#f2d765')).length > 20, 'yellow loops around right fingers');
  assert.ok(v.filter(p => p.z > .25 && Math.abs(p.x) < .4 && nearPaint(p, '#74b788')).length > 5, 'green pupils');
  assert.ok(v.filter(p => nearPaint(p, '#fff6df')).length > 40, 'orange paper was not mistaken for body coloring');
});

test('long-legged friend has long thin separated legs and very long horizontal arms', () => {
  const v = vertices(meshes.drawinglonglegs), b = bounds(meshes.drawinglonglegs);
  const lower = v.filter(p => p.y < .8);
  assert.ok(lower.length > 50 && lower.every(p => Math.abs(p.x) < .3), 'narrow vertical legs');
  assert.ok(lower.some(p => p.x < -.07) && lower.some(p => p.x > .07), 'two separated legs');
  assert.ok(b.max.x - b.min.x > 2.1, 'wide horizontal arm strokes');
  assert.equal(MARKER_FRIENDS.drawinglonglegs.move, 'slide');
});

test('teal retains the X mouth, yellow side curves and the small tummy drawing', () => {
  const v = vertices(meshes.drawingteal), teal = '#356b70';
  assert.ok(nearPaint(frontPaint(meshes.drawingteal, 0, 1.29), teal), 'crossed mouth is visible on the front of the head');
  assert.ok(v.filter(p => p.y < .65 && Math.abs(p.x) > .25 && nearPaint(p, '#e7cf69')).length > 20, 'yellow curves beside the torso');
  assert.ok(v.filter(p => p.y > .3 && p.y < .7 && p.z > .14 && nearPaint(p, teal)).length > 25, 'small figure preserved as tummy decoration');
  assert.equal(MARKER_FRIENDS.drawingteal.move, 'bounce');
});

test('scribble friend preserves asymmetric eyes, a pink fan and the oversize right shoe', () => {
  const v = vertices(meshes.drawingscribble);
  assert.ok(v.filter(p => p.y > 1.1 && p.x > 0 && p.z > .25 && nearPaint(p, '#dc66aa')).length > 30, 'pink outline around the right eye');
  assert.ok(v.filter(p => p.y > .6 && p.y < 1.15 && p.z > .25 && nearPaint(p, '#dc66aa')).length > 45, 'fan of pink strokes below the face');
  const footLeft = v.filter(p => p.y < .22 && p.x < 0), footRight = v.filter(p => p.y < .22 && p.x > 0);
  assert.ok(Math.max(...footRight.map(p => p.x)) > Math.abs(Math.min(...footLeft.map(p => p.x))) * 1.3, 'large rounded right shoe');
});
