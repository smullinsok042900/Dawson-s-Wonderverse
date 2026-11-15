// CPU geometry and paint checks, with canvas storage only; no browser or GL.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-spacekit-'));
let K;
try {
  await build({ entryPoints: [join(root, 'src/spacekit.js')], bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'kit.mjs'), logLevel: 'silent' });
  K = await import(pathToFileURL(join(temp, 'kit.mjs')));
} finally { await rm(temp, { recursive: true, force: true }); }

// Canvas only stores the actual production-generated pixels for inspection.
const canvasDocument = { createElement: () => ({ getContext() { return {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  putImageData: im => { this.pixels = im.data; },
}; } }) };
const drain = iterator => { let n; do { n = iterator.next(); } while (!n.done); return n.value; };
const hash = a => { const normalized = a.map(v => v === 0 ? 0 : v); return createHash('sha256').update(Buffer.from(normalized.buffer, normalized.byteOffset, normalized.byteLength)).digest('hex'); };
const config = () => ({ cx: 5055, nx: 17, nz: 11,
  height: (x, z) => K.fbm2(x * .05, z * .05, 4) * 3 - 1,
  color: (x, z, h, ny, out) => K.ramp(['#8d8d99', '#c3c3cc', '#e6e6ec'], K.noise2(x, z) + h * .03 + ny * .1, out),
});

test('terrain preparation yields bounded vertex work and preserves the original ground and paint', () => {
  assert.equal(typeof K.terrainSteps, 'function', 'terrain must support incremental preparation');
  const batch = K.makeBatch(), cfg = config(); let calls = 0;
  const color = cfg.color; cfg.color = (...args) => { calls++; color(...args); };
  const iterator = K.terrainSteps(batch, cfg); let n, yields = 0;
  do { const before = calls; n = iterator.next(); assert.ok(calls - before <= 128, 'at most 128 vertex paints per step'); yields++; } while (!n.done);
  assert.ok(yields > cfg.nz * 2, 'terrain building and painting both yield');
  const g = batch.geometry();
  const expected = { position: '4f69b8c7c384426e9631506e5da7006305c6260adee69c4facc056375b3a8179', normal: 'f52ec8ccc7c9d4caa881d32e1cd66897e002b7025b2fc324b142db9620719463', color: 'e12993c2e25180d330f8a20c33cd3fce341a34a8a2d5e5b34cd0c7106874a9b9' };
  for (const [key, fingerprint] of Object.entries(expected)) assert.equal(hash(g.attributes[key].array), fingerprint, key + ' matches pre-streaming geometry');
  assert.equal(hash(g.index.array), 'a35b65a2b3841428e5802b46a30e46f7532fa5daf1fa85bfeb58cd687d4ac583');
  const sync = K.makeBatch(); const H = K.terrain(sync, config());
  for (const key of Object.keys(expected)) assert.deepEqual(sync.geometry().attributes[key].array, g.attributes[key].array);
  assert.equal(H(5050, 0), 0); assert.equal(n.value(5050, -20), H(5050, -20));
});

test('the flat walking strip does not evaluate expensive scenery heights', () => {
  let calls = 0; const batch = K.makeBatch();
  const H = K.terrain(batch, { ...config(), nx: 1, nz: 1, zFar: 0, height: () => { calls++; return 4; } });
  assert.equal(calls, 0); assert.equal(H(0, 1), 0); assert.equal(calls, 0);
  assert.equal(H(0, -20), 4); assert.equal(calls, 1);
});

test('interleaved batch work cannot change a suspended geometry transform or paint', () => {
  const source = new THREE.SphereGeometry(1, 24, 16), matrix = new THREE.Matrix4().makeScale(2, 3, 4);
  matrix.setPosition(5, 6, 7);
  const expected = K.makeBatch(); expected.add(source, matrix, '#ff3366');
  const actual = K.makeBatch(); assert.equal(typeof actual.addSteps, 'function');
  const pending = actual.addSteps(source, matrix, '#ff3366'); assert.equal(pending.next().done, false);
  matrix.makeScale(9, 8, 7);
  const other = K.makeBatch(); other.put(source, 10, 20, 30, '#3377ff', [7, 2, 1], [.3, .5, .7]);
  drain(pending);
  const a = actual.geometry(), e = expected.geometry();
  for (const key of ['position', 'normal', 'color']) assert.deepEqual(a.attributes[key].array, e.attributes[key].array, key);
  assert.deepEqual(a.index.array, e.index.array);
});

test('painted sky bodies yield and retain their original pixels and shared texture cache', () => {
  assert.equal(typeof K.skyBodySteps, 'function', 'sky painting must support incremental preparation');
  const previousDocument = globalThis.document; globalThis.document = canvasDocument;
  try {
  const goldens = { earth: 'b8cdb704221f64440c1bad6b9bdde1d2dd25143433a640622d685c3968f48333', europa: '4c0ca5c6daca92f5920c68cb1912c8fbbd82a5eb43e10b83896e7d94f5825e55', triton: 'c1c2ba1ace6699f5152dceaa3d8c359e9991d460ecf6587c18881a3d1407f084' };
  for (const [kind, expected] of Object.entries(goldens)) {
    const iterator = K.skyBodySteps(kind, 5, { size: 64 }); let n, yields = 0;
    do { n = iterator.next(); yields++; } while (!n.done);
    assert.ok(yields >= 16, 'paint chunks contain at most 128 pixels');
    assert.equal(hash(n.value.material.map.image.pixels), expected, kind);
    assert.equal(K.skyBody(kind, 3).material.map, n.value.material.map, 'shared texture survives synchronous calls');
    assert.equal(n.value.userData.dynamic, true);
  }
  } finally { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; }
});

test('a crater is a real hole: a flat floor, a steep wall and a raised rim', () => {
  const at = (cr, d) => K.craterH(cr, cr.x + d * cr.r, cr.z);
  const flat = { x: 5000, z: -10, r: 6, depth: .3, rim: .15 };
  const floor = at(flat, 0), wall = at(flat, .9), rim = at(flat, 1), out = at(flat, 2.1), far = at(flat, 5);
  assert.ok(floor < -6 * .3 * .55, 'the floor is a real depression: ' + floor.toFixed(2) + ' m');
  assert.ok(rim > 6 * .15 * .9, 'the rim stands above the plain: ' + rim.toFixed(2) + ' m');
  assert.ok(wall > floor + 1, 'the wall climbs from the floor up to the rim');
  assert.ok(Math.abs(out) < rim * .5, 'outside the rim the ground settles back down');
  assert.equal(far, 0, 'far away a crater changes nothing at all');
  const floorEdge = at(flat, .12);
  assert.ok(Math.abs(floorEdge - floor) < 6 * .3 * .2, 'the middle is a flat floor, not a point');
  const peaked = { ...flat, peak: true };
  assert.ok(at(peaked, 0) > floor, 'a big crater keeps a central peak above its floor');
  const a = { ...flat }, b = { ...flat };
  assert.equal(K.craterH(a, 5001, -10), K.craterH(b, 5001, -10));
  assert.equal(a.s, b.s);
});
