// Measured proof that the new mountains are real geometry, not a painted shape.
// The height field is exported on its own (src/terrain.js → ridgeField), so this test can sample it exactly as the
// mesh builder does and report the elevation figures the game is actually built from.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-terrain-'));
let T;
try {
  await build({ entryPoints: [join(root, 'src/terrain.js')], bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'terrain.mjs'), logLevel: 'silent' });
  T = await import(pathToFileURL(join(temp, 'terrain.mjs')).href);
} finally { await rm(temp, { recursive: true, force: true }); }

const range = () => T.ridgeField({ x0: -100, x1: 100, zFront: -12, zBack: -50, h: 20, seed: 3 });

test('a mountain range rises to real peaks and falls into real valleys', () => {
  const H = range();
  const sample = [];
  for (let x = -60; x <= 60; x += 2) for (let z = -12; z >= -48; z -= 1) sample.push(H(x, z));
  const peak = Math.max(...sample), low = Math.min(...sample);
  assert.ok(peak > 10, `the highest summit is ${peak.toFixed(1)} m`);
  assert.ok(peak - low > 8, `peak-to-valley relief is ${(peak - low).toFixed(1)} m`);
  // a range is many summits and saddles, not one smooth lump: the skyline must go up and down along its length
  const skyline = [];
  for (let x = -60; x <= 60; x += 2) { let m = 0; for (let z = -16; z >= -48; z -= .5) m = Math.max(m, H(x, z)); skyline.push(m); }
  const high = Math.max(...skyline), lowCol = Math.min(...skyline);
  assert.ok(high - lowCol > 6, `the skyline varies by ${(high - lowCol).toFixed(1)} m along the range`);
});

test('the ground the park stands on stays exactly flat at y = 0', () => {
  const H = range();
  for (const z of [-6, -10.5, -12, -13.4, -14, -15]) assert.equal(H(150, z), 0, `flat at z ${z}`);
  for (const x of [-60, -20, 0, 37, 90]) assert.equal(H(x, -13), 0, `flat at x ${x}`);
  assert.ok(H(0, -16) >= 0, 'behind the flat strip the ground only rises');
});

test('the face is steep just behind the flat strip and eases afterwards', () => {
  const H = range();
  const maxX = () => { let bx = 0, best = -1; for (let x = -60; x <= 60; x += .5) { const y = H(x, -30); if (y > best) { best = y; bx = x; } } return bx; };
  const x = maxX();
  const near = H(x, -16), far = H(x, -44);
  assert.ok(near > .5, `the front face already climbs to ${near.toFixed(2)} m within 4 m of the flat strip`);
  assert.ok(far > near, 'the range keeps rising behind its front face');
});

test('every range fades out at both ends instead of stopping like a wall', () => {
  const H = range();
  const column = x => { let m = 0; for (let z = -14; z >= -48; z -= .5) m = Math.max(m, H(x, z)); return m; };
  assert.ok(column(0) > column(-98) * 3, 'the middle is much higher than the far end');
  assert.ok(column(0) > column(98) * 3, 'the middle is much higher than the near end');
});
