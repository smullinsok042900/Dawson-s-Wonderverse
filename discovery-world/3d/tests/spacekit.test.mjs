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

test('crater height and shade remain exact inside and outside the early distance check', () => {
  function previous(cr, x, z) {
    const dx = x - cr.x, dz = z - cr.z, d = Math.sqrt(dx * dx + dz * dz) / cr.r;
    if (d > 2.2) { cr.s = 0; return 0; }
    const rim = Math.exp(-((d - 1) * (d - 1)) / .045), bowl = d < 1 ? d * d - 1 : 0, mid = cr.peak ? Math.exp(-d * d / .03) * .35 : 0;
    cr.s = rim * .9 + bowl * .8 + (d > 1 ? Math.exp(-(d - 1) * 2.2) * .35 : 0) + dx / cr.r * Math.exp(-((d - .72) * (d - .72)) / .07) * 1.1;
    return cr.r * (cr.depth ?? .3) * (bowl + mid) + cr.r * (cr.rim ?? .12) * rim;
  }
  for (const r of [1.6, 3, 6.5, 11]) for (const d of [0, .72, 1, 2.2 - 1e-14, 2.2, 2.2 + 1e-14, 3, 100]) {
    const a = { x: 5000, z: -10, r, peak: true }, b = { ...a }, x = a.x + d * r;
    assert.equal(K.craterH(a, x, -10), previous(b, x, -10)); assert.equal(a.s, b.s);
  }
});
