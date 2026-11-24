// Fast unit tests for the automated scene/placement auditor (no browser, no WebGL).
// Run: node tests/scene-audit.test.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { auditScene } from '../src/scene-audit.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS  ' + name); };
const mesh = (geo, pos = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
  m.position.set(...pos);
  return m;
};

t('a clean scene reports no problems', () => {
  const scene = new THREE.Scene();
  scene.add(mesh(new THREE.BoxGeometry(2, 2, 2), [0, 1, 0]));
  scene.add(mesh(new THREE.BoxGeometry(1, 1, 1), [5, .5, 0]));
  const r = auditScene({ scene, solids: [{ a: 0, b: 2, top: 1, layer: '' }], platforms: [{ a: 0, b: 2, y: 1, layer: '' }] });
  assert.equal(r.duplicates.count, 0);
  assert.equal(r.zfight.count, 0);
  assert.equal(r.buried.count, 0);
  assert.equal(r.solids.malformed.length, 0);
  assert.equal(r.solids.duplicates.length, 0);
});

t('the same mesh twice at the same transform is a duplicate', () => {
  const scene = new THREE.Scene();
  const geo = new THREE.BoxGeometry(2, 2, 2);
  scene.add(mesh(geo, [0, 1, 0])); scene.add(mesh(geo, [0, 1, 0]));
  const r = auditScene({ scene });
  assert.equal(r.duplicates.count, 1);
});

t('two large coplanar horizontal surfaces are z-fighting candidates', () => {
  const scene = new THREE.Scene();
  const y = .006;
  const a = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial()); a.rotation.x = -Math.PI / 2; a.position.set(0, y, 0);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial()); b.rotation.x = -Math.PI / 2; b.position.set(.5, y + .0005, .5);
  scene.add(a, b);
  const r = auditScene({ scene });
  assert.equal(r.zfight.count, 1);
});

t('stacked surfaces far enough apart are not reported', () => {
  const scene = new THREE.Scene();
  const a = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial()); a.rotation.x = -Math.PI / 2; a.position.y = 0;
  const b = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial()); b.rotation.x = -Math.PI / 2; b.position.y = .05;
  scene.add(a, b);
  assert.equal(auditScene({ scene }).zfight.count, 0);
});

t('raised slabs whose boxes overlap are not flat z-fight surfaces', () => {
  const scene = new THREE.Scene();
  const a = mesh(new THREE.BoxGeometry(6, .06, 2), [0, .03, 0]);
  const b = mesh(new THREE.BoxGeometry(2, .06, 2), [1, .03, 0]);
  scene.add(a, b);
  assert.equal(auditScene({ scene }).zfight.count, 0);
});

t('fur shells (skinned meshes sharing one geometry) are not duplicates', () => {
  const scene = new THREE.Scene();
  const geo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 6; i++) { const m = mesh(geo, [0, .5, 0]); m.isSkinnedMesh = true; scene.add(m); }
  assert.equal(auditScene({ scene }).duplicates.count, 0);
});

t('wide flat hill masses are not reported as props cutting the floor', () => {
  const scene = new THREE.Scene();
  const hill = mesh(new THREE.SphereGeometry(1, 12, 8), [0, -3, 0]);
  hill.scale.set(30, 10, 14); hill.updateMatrixWorld(true);
  scene.add(hill);
  assert.equal(auditScene({ scene }).buried.count, 0);
});

t('two instanced sets sharing a geometry are not duplicates', () => {
  const scene = new THREE.Scene();
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const a = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial(), 3);
  const b = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial(), 4);
  scene.add(a, b);
  assert.equal(auditScene({ scene }).duplicates.count, 0);
});

t('a prop cutting into the floor is reported, wholly underground content is exempt', () => {
  const scene = new THREE.Scene();
  scene.add(mesh(new THREE.BoxGeometry(1, 1, 1), [0, 0, 0])); // half above, half below the floor
  const under = new THREE.Group(); under.name = 'underground-caves'; scene.add(under);
  under.add(mesh(new THREE.BoxGeometry(1, 1, 1), [0, 0, 0]));
  assert.equal(auditScene({ scene }).buried.count, 1);
});

t('shadow-only proxies and transparent decals are not reported', () => {
  const scene = new THREE.Scene();
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const a = mesh(geo, [0, .5, 0]);
  const b = mesh(geo, [0, .5, 0]); b.layers.set(1); b.castShadow = true; // deliberate shadow proxy
  const decalMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  const d1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), decalMat); d1.rotation.x = -Math.PI / 2; d1.position.y = .012;
  const d2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), decalMat); d2.rotation.x = -Math.PI / 2; d2.position.y = .0125;
  scene.add(a, b, d1, d2);
  const r = auditScene({ scene });
  assert.equal(r.duplicates.count, 0);
  assert.equal(r.zfight.count, 0);
});

t('malformed and duplicate collision entries are reported', () => {
  const scene = new THREE.Scene();
  const r = auditScene({
    scene,
    solids: [
      { a: 1, b: 2, top: 1, layer: '' },
      { a: 1, b: 2, top: 1, layer: '' },
      { a: 3, b: 2, top: 1, layer: '' },
      { a: NaN, b: 9, top: 1, layer: '' },
    ],
    platforms: [{ a: 2, b: 1, y: 1, layer: '' }],
  });
  assert.equal(r.solids.duplicates.length, 1);
  assert.equal(r.solids.malformed.length, 2);
  assert.equal(r.platforms.malformed.length, 1);
});

t('heavy overlaps are reported only for the same layer', () => {
  const scene = new THREE.Scene();
  const r = auditScene({
    scene,
    solids: [
      { a: 0, b: 4, top: 2, layer: '' },
      { a: 0.1, b: 4, top: 2, layer: '' },
      { a: 0, b: 4, top: 2, layer: 'space' },
    ],
  });
  assert.equal(r.solids.heavyOverlaps.length, 1);
});

t('the report is JSON-serialisable (safe to save or send)', () => {
  const scene = new THREE.Scene();
  scene.add(mesh(new THREE.BoxGeometry(1, 1, 1), [0, .5, 0]));
  const r = auditScene({ scene, solids: [{ a: 0, b: 1, top: 1, layer: '' }] });
  const s = JSON.stringify(r);
  assert.ok(s.length > 10);
  assert.equal(JSON.parse(s).scene.meshes, 1);
});

console.log(`\nSUMMARY  ${pass} scene-audit tests passed`);
