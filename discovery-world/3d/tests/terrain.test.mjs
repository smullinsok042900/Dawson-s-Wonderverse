// Measured proof that the landscape is real geometry — and that it is a landscape you look ACROSS (low rolling ground
// near the path, peaks far back with sky above), not a wall 12 m behind the player.
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

const range = () => T.ridgeField({ x0: -130, x1: 130, zFront: -12, zBack: -120, h: 13, seed: 3 });

test('the landscape rises to real peaks far back and falls into real valleys', () => {
  const H = range();
  const sample = [];
  for (let x = -90; x <= 90; x += 2) for (let z = -12; z >= -118; z -= 1) sample.push(H(x, z));
  const peak = Math.max(...sample), low = Math.min(...sample);
  assert.ok(peak > 6, `the highest summit is ${peak.toFixed(1)} m`);
  assert.ok(peak - low > 4, `relief is ${(peak - low).toFixed(1)} m`);
  // a range is many summits and saddles, not one smooth lump
  const skyline = [];
  for (let x = -90; x <= 90; x += 2) { let m = 0; for (let z = -60; z >= -118; z -= .5) m = Math.max(m, H(x, z)); skyline.push(m); }
  assert.ok(Math.max(...skyline) - Math.min(...skyline) > 1.5, 'the skyline goes up and down along the range');
});

test('the ground the world stands on stays flat, and the meadow behind it stays LOW', () => {
  const H = range();
  for (const z of [-6, -10.5, -12, -13.4, -14, -15]) assert.equal(H(150, z), 0, `flat at z ${z}`);
  // a low foreground is what keeps the sky visible above the hills with this fixed third-person camera
  let near = 0;
  for (let x = -90; x <= 90; x += 2) for (let z = -15.5; z >= -30; z -= .5) near = Math.max(near, H(x, z));
  assert.ok(near < 6, `the ground within 18 m behind the path stays below 6 m (it is ${near.toFixed(1)} m)`);
  let mid = 0;
  for (let x = -90; x <= 90; x += 2) for (let z = -30.5; z >= -60; z -= .5) mid = Math.max(mid, H(x, z));
  assert.ok(mid >= near, 'the landscape keeps rising as it goes back');
});

test('every range fades out at both ends instead of stopping like a wall', () => {
  const H = range();
  const column = x => { let m = 0; for (let z = -14; z >= -118; z -= .5) m = Math.max(m, H(x, z)); return m; };
  assert.ok(column(0) > column(-128) * 3, 'the middle is much higher than the far end');
  assert.ok(column(0) > column(128) * 3, 'the middle is much higher than the near end');
});
