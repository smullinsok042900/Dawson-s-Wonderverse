// Measured tests for the player's collision system (build 75). Pure maths: no browser, no GL.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeCollision, PLAYER_R, PLAYER_H } from '../src/collision.js';

const wall = (c, x0, x1, top = 4, z0 = -1, z1 = 1) => c.add({ x0, x1, z0, z1, top });

test('a player cannot walk through a wall from either side', () => {
  const c = makeCollision(); wall(c, 10, 11);
  const right = c.moveX(5, 20, 0, 0);
  assert.ok(right.x <= 10 - PLAYER_R + 1e-6, `walking right stops at the face (x ${right.x.toFixed(2)})`);
  assert.ok(right.hit, 'the wall is reported as a hit');
  const left = c.moveX(20, 5, 0, 0);
  assert.ok(left.x >= 11 + PLAYER_R - 1e-6, `walking left stops at the other face (x ${left.x.toFixed(2)})`);
  assert.ok(left.hit);
});

test('a fast frame cannot tunnel through a thin wall', () => {
  const c = makeCollision(); wall(c, 100, 100.4, 4, -1, 1);
  const r = c.moveX(60, 140, 0, 0); // 80 m in one step
  assert.ok(r.x <= 100 - PLAYER_R + 1e-4, `a 0.4 m wall still stops a 80 m step (x ${r.x.toFixed(2)})`);
});

test('you walk in front of and behind objects, not through them, because collision has depth', () => {
  const c = makeCollision(); wall(c, 10, 11, 4, -3, -2);
  assert.equal(c.moveX(5, 20, 0, 0).hit, null, 'on the path (z 0) the object at z −3…−2 is not in the way');
  assert.ok(c.moveX(5, 20, -2.5, 0).hit, 'at z −2.5 the same object blocks');
});

test('low obstacles can be hopped over, high ones cannot', () => {
  const c = makeCollision();
  c.add({ x0: 10, x1: 11, z0: -1, z1: 1, top: 0.8 });
  assert.ok(c.moveX(5, 20, 0, 0).hit, 'at ground level the low box blocks');
  assert.equal(c.moveX(5, 20, 0, 1.2).hit, null, 'jumped above it, the player passes over');
  c.add({ x0: 20, x1: 21, z0: -1, z1: 1, top: 6 });
  assert.ok(c.moveX(15, 30, 0, 3).hit, 'a tall box still blocks even when jumping');
});

test('a ceiling is respected: you cannot walk through the space under a raised box', () => {
  const c = makeCollision();
  c.add({ x0: 10, x1: 11, z0: -1, z1: 1, top: 3, bottom: 2 });
  assert.equal(c.moveX(5, 20, 0, 0).hit, null, 'walking under a raised box is allowed');
  assert.ok(c.moveX(5, 20, 0, 1.9).hit, 'standing inside its span blocks');
});

test('layers keep the underground and the planets apart', () => {
  const c = makeCollision();
  c.add({ x0: 10, x1: 11, z0: -1, z1: 1, top: 4, layer: 'space' });
  assert.equal(c.moveX(5, 20, 0, 0, PLAYER_R, PLAYER_H, '').hit, null, 'a planet wall does not block in the world');
  assert.ok(c.moveX(5, 20, 0, 0, PLAYER_R, PLAYER_H, 'space').hit, 'and it does block on the planet');
});

test('a player already inside a box can walk out (no trapping)', () => {
  const c = makeCollision(); wall(c, 10, 11);
  const r = c.moveX(10.5, 20, 0, 0);
  assert.ok(r.x > 10.5, 'they move freely out of the box');
});

test('the box list can be cleaned up when a streamed area unloads', () => {
  const c = makeCollision();
  c.add({ x0: 10, x1: 11, z0: -1, z1: 1, top: 4, tag: 'space:mars' });
  c.add({ x0: 20, x1: 21, z0: -1, z1: 1, top: 4, tag: 'world' });
  assert.equal(c.count(), 2);
  c.removeTag('space:mars');
  assert.equal(c.count(), 1);
  assert.equal(c.moveX(5, 30, 0, 0).hit.x0, 20, 'only the world wall remains');
});
