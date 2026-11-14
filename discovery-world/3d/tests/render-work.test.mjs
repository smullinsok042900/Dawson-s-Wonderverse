import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';

async function sourceModule(path) {
  const source = (await readFile(new URL(path, import.meta.url), 'utf8')).replace(/from '([^']+)'/g, (_, specifier) => `from '${import.meta.resolve(specifier)}'`);
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const { makeLife } = await sourceModule('../src/life.js');
const { makePost } = await sourceModule('../src/post.js');
const player = { x: 0, y: 0, z: 0, facing: 1 };
const context = { trailAt: () => [0, 0, 0], playerStill: 0, armBusy: () => false };
function creature(life, parent, x, z = 0) {
  const root = new THREE.Group(); root.position.set(x, 0, z); parent.add(root);
  return life.add({ root, species: 'owl' });
}

test('life keeps radial LOD boundaries, detached wake and follower restoration', () => {
  const camera = new THREE.PerspectiveCamera(), scene = new THREE.Scene(), life = makeLife({ camera });
  const edge = creature(life, scene, 36, 48), far = creature(life, scene, 36.001, 48);
  const paused = creature(life, scene, 49), pausedTimer = paused.timer;
  life.update(.01, 0, player, context);
  assert.equal(edge.root.parent, scene); assert.equal(far.root.parent, null);
  assert.equal(paused.timer, pausedTimer);
  camera.position.set(36.001, 0, 48); life.wake(); assert.equal(far.root.parent, scene);
  camera.position.set(0, 0, 0); life.update(.01, .01, player, context); assert.equal(far.root.parent, null);
  life.setFollower(far, true); assert.equal(far.root.parent, scene);
  life.update(.01, .02, player, context); assert.equal(far.root.parent, scene);
});

test('mid-distance agents retain three-frame cadence and accumulated delta', () => {
  const camera = new THREE.PerspectiveCamera(), scene = new THREE.Scene(), life = makeLife({ camera });
  const near = creature(life, scene, 22), mid = creature(life, scene, 22.001);
  mid.seed = 0; const startNear = near.timer, startMid = mid.timer;
  life.update(.01, .01, player, context); life.update(.01, .02, player, context);
  assert.equal(mid.timer, startMid); assert.ok(Math.abs(near.timer - (startNear - .02)) < 1e-12);
  life.update(.01, .03, player, context);
  assert.ok(Math.abs(mid.timer - (startMid - .03)) < 1e-12); assert.equal(mid.accum, 0);
});

test('detached creatures require no distance square roots on subsequent frames', () => {
  const life = makeLife({ camera: new THREE.PerspectiveCamera() }), scene = new THREE.Scene();
  for (let i = 0; i < 100; i++) creature(life, scene, 100 + i);
  const hypot = Math.hypot; let calls = 0;
  try {
    Math.hypot = (...args) => { calls++; return hypot(...args); };
    for (let frame = 0; frame < 10; frame++) life.update(.01, frame / 100, player, context);
  } finally { Math.hypot = hypot; }
  assert.equal(calls, 0); assert.ok(life.agents.every(a => a.detached));
});

test('post scene targets clear once automatically, with explicit fallback for each disabled flag', () => {
  for (const lite of [false, true]) for (const disabled of [null, 'autoClear', 'autoClearColor', 'autoClearDepth', 'autoClearStencil']) {
    let clears = 0, sceneRenders = 0;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
    const renderer = { autoClear: true, autoClearColor: true, autoClearDepth: true, autoClearStencil: true, toneMappingExposure: 1,
      setRenderTarget() {}, clear() { clears++; }, render(object) { if (object === scene) sceneRenders++; } };
    if (disabled) renderer[disabled] = false;
    const post = makePost(renderer, scene, camera, { mobile: true }); post.lite = lite; post.setSize(100, 100, 1); post.render();
    assert.equal(sceneRenders, 1); assert.equal(clears, disabled ? 1 : 0, `${lite ? 'lite' : 'full'} / ${disabled}`);
  }
});
