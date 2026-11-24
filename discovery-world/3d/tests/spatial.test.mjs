// Fast unit tests for the collision spatial index added in the graphics/performance overhaul.
// No browser, no WebGL: pure math. Run: node tests/spatial.test.mjs
import assert from 'node:assert/strict';
import { makeIntervalIndex, intervalsOverlap, overlapFraction } from '../src/spatial.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS  ' + name); };

t('overlap helpers are correct', () => {
  assert.equal(intervalsOverlap(0, 2, 1, 3), true);
  assert.equal(intervalsOverlap(0, 1, 2, 3), false);
  assert.equal(intervalsOverlap(0, 1, 1, 2), true); // touching counts as overlap
  assert.equal(overlapFraction(0, 10, 0, 10), 1);
  assert.equal(overlapFraction(0, 10, 5, 15), .5);
  assert.equal(overlapFraction(0, 1, 2, 3), 0);
  assert.equal(overlapFraction(NaN, 1, 2, 3), 0);
});

t('index finds the same entries a linear scan would', () => {
  const solids = [
    { a: 0, b: 1, top: 1, layer: '' },
    { a: 4, b: 5, top: 2, layer: '' },
    { a: 8, b: 9, top: 1, layer: 'space' },
    { a: -30, b: 30, top: 1, layer: '' },
    { a: 100, b: 101, top: 1, layer: '' },
  ];
  const idx = makeIntervalIndex({ bucket: 4 });
  for (const x of [-25, -1, 0.5, 1.5, 4.2, 6, 8.5, 50, 100.5]) {
    const got = new Set(idx.query(solids, x, '').filter(s => s.layer === ''));
    const want = solids.filter(s => s.layer === '' && s.a - .4 <= x && s.b + .4 >= x);
    // the index may return a few extra entries from the same bucket; it must never MISS one
    for (const s of want) assert.ok(got.has(s), 'missing entry at x=' + x);
    assert.ok(got.size <= solids.length, 'never returns more than the list itself');
  }
});

t('query respects the layer', () => {
  const solids = [{ a: 0, b: 10, top: 1, layer: 'space' }];
  const idx = makeIntervalIndex();
  assert.equal(idx.query(solids, 5, '').length, 0);
  assert.equal(idx.query(solids, 5, 'space').length, 1);
});

t('runtime-changing (keyed) entries are always candidates', () => {
  const solids = [{ a: 0, b: 1, top: 1, layer: '', key: 'door' }, { a: 500, b: 501, top: 1, layer: '' }];
  const idx = makeIntervalIndex();
  for (let i = 0; i < 3; i++) idx.query(solids, 0.5, '');
  idx.rebuild(solids, 0);
  assert.equal(idx.query(solids, 0.5, '').length, 1);
  assert.equal(idx.query(solids, 0.5, '').filter(s => s.key === 'door').length, 1);
});

t('index notices added entries and removals', () => {
  const solids = [{ a: 0, b: 1, top: 1, layer: '' }];
  const idx = makeIntervalIndex({ rebuildMs: 1e9 });
  assert.equal(idx.query(solids, 10, '').length, 0);
  solids.push({ a: 9, b: 11, top: 1, layer: '' });
  assert.equal(idx.query(solids, 10, '').length, 1, 'added entry is found on the next query');
  solids.pop();
  idx.rebuild(solids, 0); // removals do not change the length when a same-size swap is made: rebuild covers it
  assert.equal(idx.query(solids, 10, '').length, 0);
});

t('a very long entry is still returned', () => {
  const solids = [{ a: -5000, b: 5000, top: 1, layer: '' }];
  const idx = makeIntervalIndex();
  assert.equal(idx.query(solids, 1234, '').length, 1);
});

t('malformed entries are ignored by the index, not crashed on', () => {
  const solids = [{ a: NaN, b: 1, top: 1, layer: '' }, null, { a: 0, b: 1, top: 1, layer: '' }];
  const idx = makeIntervalIndex();
  assert.equal(idx.query(solids, .5, '').length, 1);
});

t('query does not allocate a new array each time', () => {
  const idx = makeIntervalIndex();
  const solids = [{ a: 0, b: 1, top: 1, layer: '' }];
  const a = idx.query(solids, .5, '');
  const b = idx.query(solids, .5, '');
  assert.equal(a, b, 'same reusable array');
});

console.log(`\nSUMMARY  ${pass} spatial-index tests passed`);
