// ===================================================================
// worldcheck.js (build 59): a whole-world inspection pass, for the overhaul.
//
// Open the game with ?worldcheck and it walks the world itself: it looks for the problem classes that cannot be seen by
// reading the code — two activities in one spot, platforms and solids with broken sizes, activity spots with nothing to
// stand on, static meshes buried under the ground, objects with broken transforms — and then measures the renderer at
// every area. The report is plain text on screen and in the console, so a grown-up can read it to the developer.
//
// It is inspection only: it never changes the world, never saves and does nothing without the flag.
// ===================================================================
import * as THREE from 'three';

export async function runWorldCheck({ G, player, renderer, scene, teleport }) {
  const box = document.createElement('pre'); box.id = 'mpCheck'; document.body.appendChild(box);
  const lines = [], show = t => { lines.push(t); box.textContent = lines.join('\n'); console.log('[worldcheck]', t); };
  const raf = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
  show('World check — build ' + (G.build || '?'));
  show('(inspection only: nothing here changes or saves the game)');

  // ---------- what stands where ----------
  const found = [];
  const add = (kind, text) => found.push(kind + ': ' + text);
  const I = G.interact || [], P = G.platforms || [], S = G.solids || [];
  const label = o => o.disc || o.icon || o.action || '?';
  for (let i = 0; i < I.length; i++) for (let j = i + 1; j < I.length; j++) {
    const A = I[i], B = I[j];
    if ((A.layer || '') !== (B.layer || '')) continue;
    if (Math.abs(A.x - B.x) < .3 && Math.abs((A.y || 0) - (B.y || 0)) < .3) add('two activities in one spot', `${label(A)} + ${label(B)} at x=${A.x.toFixed(1)}`);
  }
  for (const z of P) {
    if (!(z.b > z.a)) add('platform has no width', `x ${z.a}..${z.b}, y ${z.y}`);
    if (!Number.isFinite(z.y)) add('platform height is not a number', JSON.stringify(z));
  }
  for (const s of S) {
    if (!(s.b > s.a)) add('solid has no width', `x ${s.a}..${s.b}, top ${s.top}`);
    if (!(s.top > (s.bottom ?? 0))) add('solid has no height', `x ${s.a}..${s.b}, top ${s.top}`);
  }
  for (const it of I) {
    const y = it.y || 0, layer = it.layer || '';
    if (y <= .6 || layer === 'in' || layer === 'castle' || layer === 'space' || layer === 'sea') continue;
    const stand = P.some(z => (z.layer || '') === layer && it.x >= z.a - .2 && it.x <= z.b + .2 && Math.abs(z.y - y) < .35);
    if (!stand) add('activity with nothing to stand on', `${label(it)} at x=${it.x.toFixed(1)} y=${y.toFixed(1)}`);
  }

  // ---------- meshes: buried, oversized, broken ----------
  const buried = [], broken = [];
  let meshes = 0, zeroScale = 0;
  const bb = new THREE.Box3(), centre = new THREE.Vector3();
  scene.traverse(o => {
    if (!o.isMesh) return;
    if (o.userData.dynamic) return; // (things that move are placed every frame)
    const p = o.getWorldPosition(centre);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) { broken.push((o.name || o.type) + ' has a broken position'); return; }
    meshes++;
    if (o.scale.x === 0 || o.scale.y === 0 || o.scale.z === 0) zeroScale++;
    if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
    bb.setFromObject(o); if (bb.isEmpty()) return; bb.getCenter(centre);
    if (Math.abs(centre.x) < 990 && centre.y > -2.5 && bb.max.y < -.08) buried.push(`${o.name || o.type} at x=${centre.x.toFixed(1)} y=${centre.y.toFixed(2)} z=${centre.z.toFixed(2)}`);
    const h = bb.max.y - bb.min.y;
    if (h > 60) broken.push(`${o.name || o.type} is ${h.toFixed(0)} m tall at x=${centre.x.toFixed(0)}`);
  });

  show('--- the world as built ---');
  show(`${meshes} static meshes checked, ${I.length} activity spots, ${P.length} platforms, ${S.length} solids`);
  show(`${found.length} placement problems, ${buried.length} buried meshes, ${broken.length} broken meshes, ${zeroScale} with a zero scale`);
  const sample = (title, list) => { if (!list.length) return; show(title + ` (${list.length}):`); list.slice(0, 12).forEach(t => show('  • ' + t)); if (list.length > 12) show(`  … and ${list.length - 12} more`); };
  sample('placement problems', found);
  sample('buried under the ground', buried);
  sample('broken meshes', broken);

  // ---------- what it costs to draw, area by area ----------
  const STOPS = [[1, 'start'], [8, 'ball pit'], [20, 'slide'], [34, 'trampoline'], [60, 'studio'], [100, 'lab'], [137, 'park entrance'], [160, 'ferris wheel'], [199, 'fluffkin house'], [208, 'block builder'], [236, 'creative meadow'], [300, 'adventure trail'], [398, 'castle front'], [441, 'trail far'], [561, 'toy town'], [620, 'toy town far'], [686, 'rocket pad'], [801, 'art plaza'], [900, 'far right'], [1008, 'fluffkin house in'], [2010, 'castle inside'], [-86, 'beach'], [-262, 'woods'], [-392, 'frosty peaks'], [-470, 'happy farm'], [-600, 'ocean pier'], [-740, 'balloon hills']];
  show('--- drawing cost at each area ---');
  let maxCalls = 0, maxTris = 0, worst = '';
  for (const [x, name] of STOPS) {
    try {
      teleport(x, 0);
      await raf();
      const r = renderer.info.render;
      if (r.calls > maxCalls) { maxCalls = r.calls; worst = name + ' (x=' + x + ')'; }
      maxTris = Math.max(maxTris, r.triangles);
      show(`${name} x=${x}: ${r.calls} draw calls, ${(r.triangles / 1000).toFixed(0)}k triangles`);
    } catch (e) { show(`${name} x=${x}: could not be measured (${e.message})`); }
  }
  show(`heaviest view: ${worst} with ${maxCalls} draw calls; most triangles: ${(maxTris / 1000).toFixed(0)}k`);
  show('planets (Moon, Mars, Pluto…) are not toured by this pass yet');
  show('done — a grown-up can send these lines to the developer');
}
