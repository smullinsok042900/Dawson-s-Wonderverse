// (build 56) The rules of PLAY TOGETHER's shared world, checked without a browser.
import test from 'node:test'; import assert from 'node:assert/strict';
import { LIMITS, isCode, codeFromPics, picsFromCode, petRecipe, petKey, recipeFromKey, paintColour, paintSegment, makePaintBatch, sanitizeObject, sanitizeEvent } from '../src/shared.js';

test('a room code is four animal letters, and turns back into the same pictures', () => {
  assert.equal(isCode('ABCD'), true);
  const pics = [3, 0, 11, 7];
  assert.equal(codeFromPics(pics), 'DANH');
  assert.deepEqual(picsFromCode('DANH'), pics);
  for (const bad of ['', 'ABC', 'ABCDE', 'abcd', 'ABIO', null, 42]) assert.equal(isCode(bad), false);
});

test('a pet recipe is always one the Pet Workshop can build', () => {
  assert.deepEqual(petRecipe({ col: 9, ears: -2, tail: 'x', pat: 1.6 }), { col: 6, ears: 0, tail: 0, pat: 2 });
  const key = petKey({ col: 2, ears: 3, tail: 1, pat: 0 });
  assert.equal(key, '2310');
  assert.deepEqual(recipeFromKey(key), { col: 2, ears: 3, tail: 1, pat: 0 });
  assert.equal(recipeFromKey('9999'), null);
});

test('paint colours from another device are only plain colours, the rainbow hue or the eraser', () => {
  assert.equal(paintColour('#FF4F9A'), '#ff4f9a');
  assert.equal(paintColour('hsl(120,90%,60%)'), 'hsl(120,90%,60%)');
  assert.equal(paintColour('erase'), 'erase');
  assert.equal(paintColour('hello, I am a stranger'), '#ff4f9a');
});

test('a paint line is kept inside the wall, whatever it was sent with', () => {
  assert.deepEqual(paintSegment([0.2, 0.4], { x: 3, y: -1 }, '#ffd23f', 500), { a: [0.2, 0.4], b: [1, 0], c: '#ffd23f', w: 60 });
  assert.equal(paintSegment(null, [0, 0], '#fff', 26), null);
});

test('painting is sent in batches, not one network write per finger move', () => {
  const sent = []; const batch = makePaintBatch(segs => sent.push(segs), { every: 320, max: 25 });
  batch.add({ a: [0, 0], b: [0.1, 0.1], c: '#ff4f9a', w: 26 }, 1000);
  batch.add({ a: [0.1, 0.1], b: [0.2, 0.2], c: '#ff4f9a', w: 26 }, 1100);
  assert.equal(batch.pending(), 2); assert.equal(sent.length, 0);
  batch.add({ a: [0.2, 0.2], b: [0.3, 0.3], c: '#ff4f9a', w: 26 }, 1400); // (a third of a second later)
  assert.equal(sent.length, 1); assert.equal(sent[0].length, 3);
  assert.equal(batch.pending(), 0);
});

test('only the three small shared things are accepted from the database, and never anything else', () => {
  assert.deepEqual(sanitizeObject({ t: 'b', i: 12, v: 3, by: 'x' }), { t: 'b', i: 12, v: 3 });
  assert.deepEqual(sanitizeObject({ t: 'x', by: 'x' }), { t: 'x' });
  assert.deepEqual(sanitizeObject({ t: 's', segs: [{ a: [0, 0], b: [1, 1], c: '#3d9bff', w: 26 }] }), { t: 's', segs: [{ a: [0, 0], b: [1, 1], c: '#3d9bff', w: 26 }] });
  assert.equal(sanitizeObject({ t: 'b', i: 999, v: 1 }), null);            // (off the wall)
  assert.equal(sanitizeObject({ t: 'b', i: 3, v: 200 }), null);            // (not a block)
  assert.equal(sanitizeObject({ t: 's', segs: [] }), null);                // (nothing to draw)
  assert.equal(sanitizeObject({ t: 'chat', text: 'hello' }), null);        // (no chat, ever)
  assert.equal(sanitizeObject('hello'), null);
});

test('a wave is the only moment a room shares', () => {
  assert.deepEqual(sanitizeEvent({ t: 'wave', by: 'abc', at: 12 }), { t: 'wave', by: 'abc', at: 12 });
  assert.equal(sanitizeEvent({ t: 'say', text: 'hello' }), null);
  assert.equal(sanitizeEvent(null), null);
  assert.equal(LIMITS.remotePets < LIMITS.pets, true);
});
