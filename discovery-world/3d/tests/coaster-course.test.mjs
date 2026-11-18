// (build 69) The giant Moon coaster's course: continuous, never runs into itself, clear of the ground, the activities and
// the mountain, over 4 km long and over 150 m tall, with loops and corkscrews (see coaster-course-check.mjs).
import test from 'node:test'; import assert from 'node:assert/strict'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
test('the giant Moon coaster course is continuous, clear and connected', () => {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL('./coaster-course-check.mjs', import.meta.url))], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  assert.match(out, /COURSE OK/, out);
});
