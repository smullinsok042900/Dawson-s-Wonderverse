// Source contracts supplement browser coverage; no WebGL context needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const s = fs.readFileSync('src/learn.js','utf8');
const adapter = fs.readFileSync('src/learning-3d.js','utf8');
assert.equal((s.match(/act\(\{ id:/g)||[]).length,41,'retain all activities');
for (const kind of ['critter','ball','bubble','bucket','cup','face-']) assert(s.includes('data-lmodel="'+kind),kind+' has a 3D descriptor');
assert(s.includes("X: ['xylophone'"),'include X in phonics pool');
assert(s.includes("h.querySelector('.lin.eaten') || h"),'feed destinations own placed pieces');
assert(s.includes('seen.size === 3 && !rewarded'),'mixture completion awarded once');
assert(s.includes("session === freeSession && root.classList.contains('on')"),'late rewards checked against owning session');
assert(s.includes("ev.type === 'pointercancel'"),'cancelled drag cannot place');
assert(s.includes("'pointercancel', 'lostpointercapture'"),'drawing cancellation ends stroke');
assert(s.includes('candidates.sort'),'overlapping drop targets resolve by distance');
assert(adapter.includes('makeToyModel(')&&adapter.includes('G.playroom.mount('),'shared 3D viewport used');
assert(!adapter.includes('new THREE.WebGLRenderer'),'never allocate second renderer');
assert(adapter.includes('cropped.computeVertexNormals()'),'puzzle pieces contain cropped solid relief');
console.log('Learning contracts: 41 activities and 3D/lifecycle regression contracts passed');
