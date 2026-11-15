// Real planet construction and travel, without WebGL or unrelated world normal-map painting.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-space-lifecycle-'));
let initSpace;
try {
  await build({ entryPoints: [join(root, 'src/space.js')], bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'space.mjs'), logLevel: 'silent', plugins: [{ name: 'native-space-lifecycle', setup(b) {
    b.onResolve({ filter: /^\//, namespace: 'space-test' }, args => ({ path: args.path, namespace: 'file' }));
    // Keep the production material factory and geometries; only unrelated normal-map canvases are omitted.
    b.onResolve({ filter: /^\.\/nature\.js$/ }, () => ({ path: 'normal-maps', namespace: 'space-test' }));
    b.onLoad({ filter: /^normal-maps$/, namespace: 'space-test' }, () => ({ contents: 'export const microNormal = () => null; export const plushNormal = () => null;' }));
    b.onResolve({ filter: /^\.\/stream-work\.js$/ }, () => ({ path: 'stream-work', namespace: 'space-test' }));
    b.onLoad({ filter: /^stream-work$/, namespace: 'space-test' }, () => ({ contents: `import { runInSlices as real } from ${JSON.stringify(join(root, 'src/stream-work.js'))}; export const runInSlices = (iterator, options) => real(iterator, { ...options, budget: 0, schedule: fn => setImmediate(fn) });` }));
  } }] });
  ({ initSpace } = await import(pathToFileURL(join(temp, 'space.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }

const noop = () => {};
const canvasDocument = { createElement: () => ({ getContext: () => ({
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: noop,
  createRadialGradient: () => ({ addColorStop: noop }), fillRect: noop,
}) }) };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
async function until(predicate, message) {
  for (let turn = 0; turn < 10000; turn++) { if (predicate()) return; await nextTurn(); }
  assert.fail(message);
}
function fixture(compile = async () => {}) {
  const player = { x: 0, y: 0, z: 0, layer: 'earth', grounded: true };
  const G = { taps: [], interact: [], platforms: [], rockets: {}, W: {} };
  const scene = new THREE.Scene();
  const space = initSpace(G, {
    scene, player, compile, Sound: { chime: noop, whoosh: noop }, camX: () => player.x, camY: () => player.y,
    calm: () => false, toast: noop, discover: noop, burst: noop, flash: noop, snap: noop, light: noop,
    keysHeld: () => false, home: () => { player.layer = 'earth'; player.x = player.y = player.z = 0; },
    registerRocket: (id, group, window, x, layer, y) => { G.rockets[id] = { group, window, x, layer, y }; },
  });
  return { space, player, G, scene };
}
async function withCanvas(run) {
  const previous = globalThis.document; globalThis.document = canvasDocument;
  try { await run(); } finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}

test('travel keeps the current planet until destination compilation is ready, then frees the old one', () => withCanvas(async () => {
  const gate = deferred(); let compiling = false;
  const f = fixture(g => { if (g.name === 'space:mars') { compiling = true; return gate.promise; } });
  await f.space.goTo(1); // Mercury.
  const originalX = f.player.x;
  const trip = f.space.goTo(3); // Mars.
  assert.equal(f.space.here(), 'mercury'); assert.equal(f.player.layer, 'space'); assert.equal(f.player.x, originalX);
  await until(() => compiling, 'Mars should finish construction and start compilation');
  assert.equal(f.space.here(), 'mercury'); assert.equal(f.player.x, originalX);
  assert.equal(f.space.groups.mercury.visible, true); assert.equal(f.space.groups.mars.visible, false);
  gate.resolve(); assert.equal(await trip, true);
  assert.equal(f.space.here(), 'mars'); assert.equal(f.player.layer, 'space');
  assert.deepEqual(Object.keys(f.space.groups), ['mars']); assert.deepEqual(Object.keys(f.G.rockets), ['mars']);
  f.space.goHome();
}));

test('going home aborts partial preparation and cleans registered interactions without a late arrival', () => withCanvas(async () => {
  const f = fixture();
  const trip = f.space.goTo(0); // Moon, stopped after rocket registration but before the final alien/build steps.
  await until(() => !!f.G.rockets.moon, 'partial Moon construction should register its rocket');
  assert.ok(f.G.taps.length > 0); assert.ok(f.G.interact.length > 0);
  f.space.goHome();
  assert.equal(await trip, false);
  for (let i = 0; i < 5; i++) await nextTurn();
  assert.equal(f.player.layer, 'earth'); assert.equal(f.space.here(), null);
  assert.deepEqual(Object.keys(f.space.groups), []); assert.deepEqual(Object.keys(f.G.rockets), []);
  assert.equal(f.G.taps.length, 0); assert.equal(f.G.interact.length, 0); assert.equal(f.G.platforms.length, 0);
  assert.equal(f.scene.children.filter(o => o.name.startsWith('space:')).length, 0);
}));

test('the last interleaved destination request wins and leaves one planet in memory', () => withCanvas(async () => {
  const f = fixture();
  const first = f.space.goTo(1), last = f.space.goTo(3);
  assert.equal(await last, true); assert.equal(await first, false);
  assert.equal(f.space.here(), 'mars'); assert.equal(f.player.layer, 'space');
  assert.deepEqual(Object.keys(f.space.groups), ['mars']); assert.deepEqual(Object.keys(f.G.rockets), ['mars']);
  f.space.goHome();
}));

test('a failed destination compilation rejects travel and a new request can retry it', () => withCanvas(async () => {
  const failure = new Error('compile test failure'); let attempts = 0;
  const f = fixture(() => { attempts++; if (attempts === 1) throw failure; });
  await assert.rejects(f.space.goTo(1), error => error === failure);
  assert.equal(f.player.layer, 'earth'); assert.equal(f.space.here(), null);
  assert.equal(await f.space.goTo(1), true);
  assert.equal(attempts, 2); assert.equal(f.space.here(), 'mercury');
  assert.deepEqual(Object.keys(f.space.groups), ['mercury']);
  f.space.goHome();
}));

test('map travel cancels a destination before its first construction task without moving the player', () => withCanvas(async () => {
  const f = fixture(); f.player.x = 77;
  const trip = f.space.goTo(1);
  f.space.cancel();
  f.player.x = 190; // The actual map destination is assigned by the caller.
  assert.equal(await trip, false);
  for (let i = 0; i < 5; i++) await nextTurn();
  assert.equal(f.player.x, 190); assert.equal(f.player.layer, 'earth');
  assert.deepEqual(Object.keys(f.space.groups), []);
  assert.equal(f.G.taps.length, 0); assert.equal(f.G.interact.length, 0);
}));

test('unloading ring planets disposes their private ring textures and preserves cached sky textures', () => withCanvas(async () => {
  const f = fixture();
  for (const index of [5, 6]) { // Saturn and Uranus have private canvas-painted rings.
    await f.space.goTo(index);
    const group = f.space.groups[f.space.here()], maps = new Set(), rings = new Set(), disposed = new Set();
    group.traverse(o => {
      if (o.material?.map) {
        maps.add(o.material.map);
        if (o.geometry?.type === 'RingGeometry') rings.add(o.material.map);
      }
    });
    assert.equal(rings.size, 1, 'the planet has its own painted ring image');
    assert.ok(maps.size > 1, 'shared sky maps are present alongside the rings');
    for (const texture of maps) texture.addEventListener('dispose', () => disposed.add(texture));
    f.space.goHome();
    assert.deepEqual(disposed, rings, 'free ring images without disposing cached moons/glows');
  }
}));

test('constructing ice crystals does not emit geometry conversion warnings', () => withCanvas(async () => {
  const f = fixture(), warnings = [], original = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try { await f.space.goTo(6); f.space.goHome(); }
  finally { console.warn = original; }
  assert.deepEqual(warnings, [], 'already non-indexed crystal geometry needs no conversion');
}));
