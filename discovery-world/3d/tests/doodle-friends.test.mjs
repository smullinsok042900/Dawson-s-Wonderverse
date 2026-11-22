// The nine new outline drawings are solid toys, with their ink details on the visible front.
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
assert.ok(existsSync(join(root, 'src/doodle-friends.js')), 'the nine outline drawings need real 3D models');
const temp = await mkdtemp(join(tmpdir(), 'discovery-doodle-friends-'));
let DOODLE_FRIENDS, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { DOODLE_FRIENDS } from './src/doodle-friends.js'; export { makeBatch, shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'silent' });
  ({ DOODLE_FRIENDS, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = ['doodleantenna', 'doodlebean', 'doodlewide', 'doodletaper', 'doodlebox', 'doodleloop', 'doodleleaf', 'doodleantennatwin', 'doodledroopy'];
const meshes = Object.fromEntries(keys.map(key => {
  const b = makeBatch(); DOODLE_FRIENDS[key].build(b);
  const m = b.mesh(shinyMat()); m.updateMatrixWorld(true); return [key, m];
}));
const vertices = mesh => {
  const p = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color;
  return Array.from({ length: p.count }, (_, i) => ({ x: p.getX(i), y: p.getY(i), z: p.getZ(i), color: new THREE.Color(c.getX(i), c.getY(i), c.getZ(i)) }));
};
const paint = (p, hex) => { const c = new THREE.Color(hex); return Math.hypot(p.color.r - c.r, p.color.g - c.g, p.color.b - c.b) < .03; };
function front(mesh, x, y) {
  const hit = new THREE.Raycaster(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1)).intersectObject(mesh)[0];
  assert.ok(hit, 'drawn feature has an actual solid front');
  return { color: new THREE.Color().fromBufferAttribute(mesh.geometry.attributes.color, hit.face.a) };
}

test('all nine drawings are spoken world residents with a reusable play response', () => {
  assert.deepEqual(Object.keys(DOODLE_FRIENDS), keys);
  for (const [key, s] of Object.entries(DOODLE_FRIENDS)) {
    assert.equal(s.planet, 'earth', key); assert.ok(!s.pet); assert.equal(s.size, 1);
    assert.ok(s.r >= 1 && s.r <= 1.2 && s.v <= .65); assert.equal(s.emoji, '🖍️');
    assert.match(s.voice, /Hello|Hi/); assert.ok(s.voice.length < 110);
    assert.ok(['twirl', 'bounce', 'sing', 'sparkle', 'hug'].includes(s.play.action));
    assert.ok(s.play.line.length > 8 && s.play.line.length < 100); assert.ok(s.play.colors.length >= 2);
  }
});

test('every outline is one thick, bounded painted mesh within the mobile triangle budget', () => {
  for (const [key, mesh] of Object.entries(meshes)) {
    assert.equal(mesh.material, shinyMat()); assert.equal(mesh.material.map, null);
    for (const a of ['position', 'normal', 'color']) assert.ok(Array.from(mesh.geometry.attributes[a].array).every(Number.isFinite), `${key}: finite ${a}`);
    const box = new THREE.Box3().setFromObject(mesh), size = box.getSize(new THREE.Vector3());
    assert.ok(box.min.y >= -.015, `${key} stands on the ground`);
    assert.ok(size.y >= 1.4 && size.y <= 2.2, `${key} is the other residents' size`);
    assert.ok(size.x <= 2.7 && size.z >= .35 && size.z <= .9, `${key} is a solid toy beside the path`);
    assert.ok(mesh.geometry.index.count / 3 <= 3000, `${key} stays below 3000 triangles`);
    assert.ok(vertices(mesh).filter(p => paint(p, '#fff6df')).length > 50, `${key} retains unfilled paper as pale toy paint`);
  }
});

test('antenna twin keeps the feelers, smiling face and broad loop feet', () => {
  const m = meshes.doodleantenna, v = vertices(m), ink = '#684268';
  assert.ok(v.some(p => p.y > 1.93 && p.x < -.1) && v.some(p => p.y > 1.85 && p.x > .1), 'two unequal antennae');
  assert.ok(v.some(p => p.y < .18 && p.x < -.75) && v.some(p => p.y < .18 && p.x > .75), 'wide loop base');
  assert.ok(paint(front(m, -.13, 1.13), ink)); assert.ok(paint(front(m, 0, .83), ink), 'visible U smile');
});

test('the pink-paper twins remain related but have different heights, silhouettes and bases', () => {
  const a = meshes.doodleantenna, b = meshes.doodleantennatwin;
  const first = new THREE.Box3().setFromObject(a), twin = new THREE.Box3().setFromObject(b);
  assert.ok(twin.max.y > first.max.y + .1, 'second drawing is the taller twin');
  assert.ok(twin.max.x - twin.min.x > first.max.x - first.min.x + .1, 'continuous sled is wider than loop feet');
  assert.ok(paint(front(b, 0, .87), '#684268'), 'taller twin has her own raised smile');
  assert.ok(paint(front(b, -.30, 1.53), '#fff6df'), 'straighter taller body has a pale upper shoulder');
  assert.match(DOODLE_FRIENDS.doodleantenna.voice, /twin/); assert.match(DOODLE_FRIENDS.doodleantennatwin.voice, /twin/);
});

test('pink bean retains its lower left indentation, bent feet and smile', () => {
  const m = meshes.doodlebean, v = vertices(m), ink = '#d779a7';
  assert.ok(v.some(p => p.x < -.75 && p.y > .8) && v.some(p => p.x > .75 && p.y > 1), 'long side arms');
  assert.ok(paint(front(m, -.15, 1.28), ink)); assert.ok(paint(front(m, .04, .94), ink), 'smile follows pale front');
  const ray = new THREE.Raycaster(new THREE.Vector3(-.38, .56, 3), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(m).length, 0, 'kidney-shaped lower left notch stays open');
});

test('brown twin preserves straight wide ears, extended arms and its drawn frown', () => {
  const m = meshes.doodlewide, v = vertices(m), ink = '#78615f';
  assert.ok(v.some(p => p.x < -1.1 && p.y > 1.6) && v.some(p => p.x > 1.1 && p.y > 1.6), 'wide upper ear strokes');
  assert.ok(v.filter(p => p.x < -.7 || p.x > .7).every(p => p.y < 1.7), 'original twin has low straight ears');
  assert.ok(v.some(p => p.x < -1.15 && p.y < 1.35) && v.some(p => p.x > 1.15 && p.y < 1.35), 'separate outstretched arms');
  assert.ok(paint(front(m, 0, 1.02), ink), 'downturned mouth remains visible');
});

test('the other brown twin has arching unequal ears, a cheek notch and the same frown', () => {
  const m = meshes.doodledroopy, v = vertices(m), ink = '#78615f';
  assert.ok(v.some(p => p.x < -.4 && p.y > 1.85), 'left ear arches higher than the first twin');
  assert.ok(v.filter(p => p.x > .55).every(p => p.y < 1.8), 'right ear hangs lower');
  assert.ok(paint(front(m, 0, 1.03), ink), 'second downturned mouth is visible');
  assert.ok(paint(front(m, .29, 1.02), ink), 'inward cheek crease follows the other drawing');
  const a = new THREE.Box3().setFromObject(meshes.doodlewide), b = new THREE.Box3().setFromObject(m);
  assert.ok(b.max.y > a.max.y + .1, 'ear silhouettes remain different');
  assert.match(DOODLE_FRIENDS.doodlewide.voice, /twin/); assert.match(DOODLE_FRIENDS.doodledroopy.voice, /twin/);
});

test('taper friend retains the huge head, hanging mouth loops and triangular lower mark', () => {
  const m = meshes.doodletaper, v = vertices(m), ink = '#d3816b';
  assert.ok(v.filter(p => p.y > 1.3 && Math.abs(p.x) > .5).length > 20, 'broad oversized head');
  assert.ok(v.filter(p => p.y > .3 && p.y < .7).every(p => Math.abs(p.x) < .5), 'narrow lower body');
  assert.ok(paint(front(m, -.09, .99), ink), 'left dangling loop');
  assert.ok(paint(front(m, 0, .31), ink), 'triangle point on the lower body');
});

test('blue square keeps its rounded box body and two long vertical eye strokes', () => {
  const m = meshes.doodlebox, ink = '#719ec6';
  assert.ok(paint(front(m, -.17, 1.25), ink)); assert.ok(paint(front(m, .19, 1.27), ink));
  assert.ok(paint(front(m, 0, .94), ink), 'shallow smile');
  assert.ok(paint(front(m, .38, 1.53), '#fff6df'), 'square upper shoulder remains solid and pale');
});

test('loop-eyed friend keeps asymmetric spiral eyes, raised hands and the top curl', () => {
  const m = meshes.doodleloop, v = vertices(m), ink = '#81869c';
  assert.ok(v.some(p => p.x < -.85 && p.y > 1.3) && v.some(p => p.x > .85 && p.y > 1.3), 'raised arms');
  assert.ok(paint(front(m, -.30, 1.28), ink), 'left eye loop');
  assert.ok(paint(front(m, .34, 1.28), ink), 'larger right eye loop');
  assert.ok(paint(front(m, -.12, 1.65), ink), 'top hair curl');
});

test('leaf friend keeps its pointed leaning silhouette and long separated legs', () => {
  const m = meshes.doodleleaf, v = vertices(m), ink = '#c79a64';
  assert.ok(v.some(p => p.x < -.43 && p.y > 1.83), 'pointed upper left tip');
  const low = v.filter(p => p.y < .5);
  assert.ok(low.some(p => p.x < -.1) && low.some(p => p.x > .1), 'two long legs');
  assert.ok(paint(front(m, -.15, 1.53), ink)); assert.ok(paint(front(m, .08, 1.31), ink), 'flat drawn mouth');
});
