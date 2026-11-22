// Real merged geometry: the family's craft pictures and coloring marks stay recognizable from the front and sides.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'discovery-craft-coloring-'));
let CRAFT_COLORING, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { CRAFT_COLORING } from './src/craft-coloring.js'; export { makeBatch, shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'silent' });
  ({ CRAFT_COLORING, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }

const keys = ['craftcrownpuppy', 'craftheartleopard', 'craftbucketghost', 'craftbonepanda', 'craftpinkpony', 'craftflowerpegasus', 'craftbeeorange', 'craftbeepurple', 'craftbeepale', 'craftscribbleshark'];
const meshes = Object.fromEntries(keys.map(key => {
  const b = makeBatch(); CRAFT_COLORING[key].build(b);
  const mesh = b.mesh(shinyMat()); mesh.updateMatrixWorld(true); return [key, mesh];
}));
const vertices = mesh => {
  const p = mesh.geometry.attributes.position, c = mesh.geometry.attributes.color;
  return Array.from({ length: p.count }, (_, i) => ({ x: p.getX(i), y: p.getY(i), z: p.getZ(i), color: new THREE.Color(c.getX(i), c.getY(i), c.getZ(i)) }));
};
const painted = (p, hex) => { const c = new THREE.Color(hex); return Math.hypot(p.color.r - c.r, p.color.g - c.g, p.color.b - c.b) < .04; };
const front = (key, x, y) => {
  const mesh = meshes[key], ray = new THREE.Raycaster(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(mesh)[0]; assert.ok(hit, `${key} has a real surface at the face feature`);
  return { color: new THREE.Color().fromBufferAttribute(mesh.geometry.attributes.color, hit.face.a) };
};
// Count oriented surface crossings up to a point inside the actual baked mesh.
// Overlapping toy parts add their winding counts, so an overlap cannot cancel as it would with an odd/even test.
function fillsJoint(key, x, y) {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const probe = new THREE.Mesh(meshes[key].geometry, material); probe.updateMatrixWorld(true);
  const hits = new THREE.Raycaster(new THREE.Vector3(x, y, -2), new THREE.Vector3(0, 0, 1)).intersectObject(probe);
  material.dispose();
  return hits.filter(h => h.point.z < 0).reduce((winding, h) => winding + (h.face.normal.z < 0 ? 1 : -1), 0) > 0;
}

test('ten individual world residents have spoken invitations and reuse the existing little games', () => {
  assert.deepEqual(Object.keys(CRAFT_COLORING), keys);
  const names = new Set();
  for (const key of keys) {
    const s = CRAFT_COLORING[key]; assert.equal(s.planet, 'earth'); assert.ok(!s.pet); assert.equal(s.size, 1);
    assert.ok(s.r >= 1 && s.r <= 1.1 && s.v <= .55); assert.equal(s.emoji, '🖍️');
    assert.match(s.voice, /Hello|Hi/); assert.ok(s.voice.length < 120); assert.ok(!names.has(s.name)); names.add(s.name);
    assert.ok(['twirl', 'bounce', 'sing', 'sparkle', 'hug'].includes(s.play.action));
    assert.ok(s.play.line.length > 8 && s.play.colors.length >= 2);
    if (s.play.action === 'bounce') assert.equal(s.move, 'bounce', 'a jumping game must really lift the resident');
    if (s.move === 'float') assert.ok(s.hover > 0 && s.hover <= .25, 'the tall ghost floats gently beside the path');
  }
});

test('every craft is a bounded solid in one painted mesh, without textures or a shadow pass', () => {
  for (const [key, mesh] of Object.entries(meshes)) {
    assert.equal(mesh.material, shinyMat()); assert.equal(mesh.material.map, null); assert.equal(mesh.castShadow, false);
    for (const a of ['position', 'normal', 'color']) assert.ok(Array.from(mesh.geometry.attributes[a].array).every(Number.isFinite), `${key}: finite ${a}`);
    assert.ok(mesh.geometry.index.count / 3 <= 4000, `${key}: at most 4,000 triangles`);
    const box = new THREE.Box3().setFromObject(mesh), size = box.getSize(new THREE.Vector3());
    assert.ok(box.min.y >= -.025, `${key} stands above the ground`);
    assert.ok(size.y >= 1.5 && size.y <= 2.2, `${key}: height ${size.y}`);
    assert.ok(size.x <= 2.7 && size.z >= .4 && size.z <= 1.7, `${key} is a volume that fits beside a path`);
    assert.equal(mesh.geometry.attributes.color.count, mesh.geometry.attributes.position.count);
  }
});

test('panda head joins the torso through the former gap instead of floating above it', () => {
  for (const x of [-.06, 0, .06]) {
    for (const y of [.76, .79, .83, .87, .91, .95]) assert.ok(fillsJoint('craftbonepanda', x, y), `solid panda neck at x=${x}, y=${y}`);
  }
});

test('the other animal heads overlap their torsos with a solid neck core, rather than touching at one tip', () => {
  const joints = [
    ['craftcrownpuppy', .82, .98], ['craftheartleopard', .865, 1.015],
    ['craftpinkpony', .76, 1.01], ['craftflowerpegasus', .76, 1.01],
    ['craftbeeorange', .82, 1.12], ['craftbeepurple', .82, 1.12], ['craftbeepale', .82, 1.12],
  ];
  for (const [key, low, high] of joints) {
    for (const x of [-.06, .06]) for (let y = low; y <= high; y += .025) assert.ok(fillsJoint(key, x, y), `${key}: connected joint at x=${x}, y=${y.toFixed(3)}`);
  }
});

test('crowned puppy keeps its green floppy ears, gold crown and paw medal, white belly, and held hamster', () => {
  const v = vertices(meshes.craftcrownpuppy);
  assert.ok(v.filter(p => p.y > 1.78 && painted(p, '#f2c343')).length > 20, 'yellow crown above the head');
  assert.ok(v.filter(p => Math.abs(p.x) > .35 && p.y > 1.4 && painted(p, '#719d72')).length > 20, 'green floppy ears');
  assert.ok(painted(front('craftcrownpuppy', 0, .55), '#fff5dd'), 'white belly faces the player');
  assert.ok(v.some(p => p.y > .75 && p.y < 1 && p.z > .28 && painted(p, '#f2c343')), 'gold collar medal');
  assert.ok(v.filter(p => p.x > .5 && p.y < .7 && painted(p, '#df984d')).length > 25, 'tiny orange hamster remains in the raised hand');
  assert.ok(painted(front('craftcrownpuppy', -.24, 1.41), '#3b3448'), 'left dark eye remains visible over the face patches');
});

test('leopard has two red heart eyes, spots, pale muzzle and a curling spotted tail', () => {
  const v = vertices(meshes.craftheartleopard);
  for (const x of [-.23, .23]) assert.ok(painted(front('craftheartleopard', x, 1.48), '#e9546f'), 'red heart eye is visible');
  assert.ok(v.filter(p => p.y > 1.6 && painted(p, '#a96d4b')).length > 25, 'brown forehead spots');
  assert.ok(v.some(p => p.x > .7 && p.y > .45 && painted(p, '#edbf55')), 'tail curls up beside the body');
  assert.ok(painted(front('craftheartleopard', 0, 1.13), '#3b3448'), 'joyful mouth is on the front of the pale muzzle');
});

test('friendly ghost has purple eyes and a real orange candy bucket beneath its smile', () => {
  const v = vertices(meshes.craftbucketghost);
  for (const x of [-.19, .19]) assert.ok(painted(front('craftbucketghost', x, 1.55), '#694da4'), 'purple eye is visible');
  assert.ok(painted(front('craftbucketghost', 0, 1.29), '#3b3448'), 'open smiling mouth is visible');
  assert.ok(painted(front('craftbucketghost', 0, 1.105), '#3b3448'), 'bucket handle stays in front of the ghost body');
  assert.ok(v.filter(p => p.y < .86 && p.z > .35 && painted(p, '#ed8e35')).length > 30, 'round pumpkin bucket has depth');
  assert.ok(v.some(p => p.y > .85 && p.y < 1.08 && p.z > .35 && painted(p, '#c982be')), 'candy protrudes from the bucket');
  assert.ok(v.filter(p => p.y < .2 && painted(p, '#fff5dd')).length > 30, 'flowing ghost hem rests above the ground');
});

test('panda preserves dark ears and paws, pink toe pads, and the dotted red bone across its lower face', () => {
  const v = vertices(meshes.craftbonepanda);
  assert.ok(v.filter(p => p.y > 1.65 && Math.abs(p.x) > .3 && painted(p, '#3b3448')).length > 25, 'two dark ears');
  assert.ok(v.filter(p => p.y < .2 && painted(p, '#ed93ad')).length > 25, 'pink foot pads and toe pads');
  assert.ok(painted(front('craftbonepanda', .20, 1.08), '#e9546f'), 'red bone is visible below the nose');
  assert.ok(v.filter(p => p.y > 1.03 && p.y < 1.18 && p.z > .39 && painted(p, '#fff5dd')).length > 15, 'white dots on the bone');
  assert.ok(painted(front('craftbonepanda', -.22, 1.47), '#3b3448'), 'large dark eye remains visible');
});

test('the two ponies retain different body colors, rainbow manes and the pegasus flower crown and wings', () => {
  const pink = vertices(meshes.craftpinkpony), white = vertices(meshes.craftflowerpegasus);
  assert.ok(painted(front('craftpinkpony', 0, .65), '#ed93ad'), 'first pony has a pink body');
  assert.ok(painted(front('craftflowerpegasus', 0, .65), '#fff5dd'), 'winged pony has a pale body');
  for (const v of [pink, white]) {
    for (const color of ['#6d9fc4', '#f2ce68', '#c982be']) assert.ok(v.some(p => p.y > 1.5 && painted(p, color)), 'rainbow forelock color ' + color);
  }
  assert.ok(white.filter(p => Math.abs(p.x) > .65 && p.y > .7 && p.y < 1.2 && painted(p, '#fff5dd')).length > 30, 'two substantial white feather wings');
  for (const color of ['#6d9fc4', '#e9546f', '#ed8e35', '#9474b6']) assert.ok(white.some(p => p.y > 1.9 && painted(p, color)), 'each flower crown color remains visible');
  assert.ok(painted(front('craftpinkpony', -.21, 1.28), '#498d76'), 'green eye of the pink pony');
  assert.ok(painted(front('craftflowerpegasus', -.21, 1.28), '#edbf55'), 'gold eye of the pegasus');
});

test('all three bees keep their individual coloring, striped solid bodies, wing veins and antenna tips', () => {
  const cases = [
    ['craftbeeorange', '#375a62', '#ed8e35', '#c982be', '#ed8e35'],
    ['craftbeepurple', '#edbf55', '#a678bf', '#679577', '#375a62'],
    ['craftbeepale', '#fff5dd', '#fff5dd', '#fff5dd', '#f2ce68'],
  ];
  for (const [key, head, body, legs, tips] of cases) {
    const v = vertices(meshes[key]);
    assert.ok(v.filter(p => p.y > 1 && p.y < 1.6 && painted(p, head)).length > 35, key + ': its own head color');
    assert.ok(v.some(p => p.y < .95 && Math.abs(p.x) < .32 && painted(p, body)), key + ': its own body color');
    assert.ok(v.filter(p => p.y < .95 && Math.abs(p.x) < .4 && painted(p, '#3b3448')).length > 25, key + ': dark belly stripes');
    assert.ok(v.some(p => p.y < .25 && Math.abs(p.x) > .2 && painted(p, legs)), key + ': matching legs');
    assert.ok(v.filter(p => p.y > 1.8 && painted(p, tips)).length > 20, key + ': two colored antenna tips');
    assert.ok(v.some(p => Math.abs(p.x) > .5 && p.y > 1.3 && painted(p, '#3b3448')), key + ': visible wing veins');
    assert.ok(painted(front(key, 0, 1.12), '#3b3448'), key + ': small smile remains visible');
  }
  assert.notDeepEqual(Array.from(meshes.craftbeeorange.geometry.attributes.color.array), Array.from(meshes.craftbeepurple.geometry.attributes.color.array), 'colored bees remain separate species');
});

test('original scribble shark retains white volume, dark-blue fins, rainbow marks, unequal eyes and a toothy joyful smile', () => {
  const v = vertices(meshes.craftscribbleshark), blue = '#354ea0';
  assert.ok(v.filter(p => Math.abs(p.x) > .62 && painted(p, blue)).length > 35, 'two dark-blue side fins');
  assert.ok(v.some(p => p.y > 1.65 && painted(p, blue)), 'dark-blue dorsal fin');
  for (const color of ['#60a9c6', '#dfba4f', '#649469', '#cf84a7']) assert.ok(v.some(p => p.z > .3 && painted(p, color)), 'scribble color is visible on the solid shark: ' + color);
  assert.ok(painted(front('craftscribbleshark', 0, .85), '#3b3448'), 'open smiling mouth faces the player');
  assert.ok(v.filter(p => p.y > .66 && p.y < 1.06 && p.z > .45 && painted(p, '#fff5dd')).length > 15, 'little pale teeth stay visible');
  const left = v.filter(p => p.x < -.06 && p.y > 1.15 && p.z > .4 && painted(p, '#3b3448'));
  const right = v.filter(p => p.x > .06 && p.y > 1.15 && p.z > .4 && painted(p, '#3b3448'));
  assert.ok(left.length > 10 && right.length > 10);
  assert.ok(Math.max(...right.map(p => p.y)) - Math.min(...right.map(p => p.y)) > Math.max(...left.map(p => p.y)) - Math.min(...left.map(p => p.y)), 'eyes keep unequal sizes');
  assert.doesNotMatch(CRAFT_COLORING.craftscribbleshark.name + CRAFT_COLORING.craftscribbleshark.voice, /baby shark|pinkfong/i);
});
