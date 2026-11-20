// dispose.js (build 107): FREE a creature that is put away (her old friend after switching, a friend's model in Play
// Together, the models drawn for the 👗 pictures). Taking a model out of the scene does not free what it holds on the
// graphics chip: its shapes and its pictures stayed there for the whole game, and piled up each time she switched
// friends (measured: +44 textures and +51 shapes after three rounds of the friends). That memory slows a phone down.
// Shared things (cached eye and mouth shapes, the eye pictures, accessory shapes, pet shapes) are marked `shared` and
// kept. Materials are not disposed (their shader programs stay ready, so switching back never pauses).
const TEX = ['map', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'bumpMap', 'clearcoatMap', 'clearcoatNormalMap', 'sheenColorMap', 'iridescenceMap', 'transmissionMap', 'specularMap'];
export function freeObject(root) {
  if (!root) return; const seen = new Set();
  root.traverse(o => {
    const g = o.geometry; if (g && !seen.has(g) && !(g.userData && g.userData.shared)) { seen.add(g); g.dispose(); }
    if (o.isSkinnedMesh && o.skeleton && !seen.has(o.skeleton)) { seen.add(o.skeleton); o.skeleton.dispose(); } // (its bone texture)
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) for (const k of TEX) { const t = m[k]; if (t && t.isTexture && !seen.has(t) && !(t.userData && t.userData.shared)) { seen.add(t); t.dispose(); } }
  });
}
// after the new model has been drawn (two frames), so nothing it shares is uploaded twice and no shader is rebuilt
export const freeLater = root => requestAnimationFrame(() => requestAnimationFrame(() => freeObject(root)));
