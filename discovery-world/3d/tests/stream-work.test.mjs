import test from 'node:test';
import assert from 'node:assert/strict';
import { runInSlices } from '../src/stream-work.js';

function clock() {
  const pending = []; let time = 0;
  return { pending, now: () => time, schedule: fn => pending.push(fn), advance: ms => { time += ms; }, tick: () => pending.shift()?.() };
}

test('construction yields to other browser tasks after its time budget', async () => {
  const c = clock(), done = [];
  const task = runInSlices((function* () { for (let i = 0; i < 5; i++) { done.push(i); c.advance(2); yield; } return 'ready'; })(), { now: c.now, schedule: c.schedule, budget: 3.5 });
  assert.deepEqual(done, [], 'first construction also runs in a scheduled task');
  c.tick(); assert.deepEqual(done, [0, 1]);
  assert.equal(c.pending.length, 1);
  while (c.pending.length) c.tick();
  assert.equal(await task, 'ready'); assert.deepEqual(done, [0, 1, 2, 3, 4]);
});

test('cancelled destination stops building and closes its generator', async () => {
  const c = clock(), controller = new AbortController(); let built = 0, cleaned = false;
  const task = runInSlices((function* () { try { while (true) { built++; c.advance(4); yield; } } finally { cleaned = true; } })(), { now: c.now, schedule: c.schedule, signal: controller.signal });
  c.tick(); assert.equal(built, 1); controller.abort();
  await assert.rejects(task, { name: 'AbortError' });
  while (c.pending.length) c.tick();
  assert.equal(built, 1); assert.equal(cleaned, true);
});

test('failed construction reports the cause instead of leaving readiness pending', async () => {
  const c = clock();
  const task = runInSlices((function* () { yield; throw new Error('terrain failed'); })(), { now: c.now, schedule: c.schedule });
  c.tick(); await assert.rejects(task, /terrain failed/);
});
