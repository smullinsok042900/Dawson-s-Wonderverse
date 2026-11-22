// The family's two sidewalk drawings, filled out as solid painted toy creatures.
// Their distinctive outlines are geometry, not photos or billboards. Each builder feeds the existing one-mesh NPC batch.
import * as THREE from 'three';

const BALL = new THREE.SphereGeometry(1, 12, 9);
const SMALL = new THREE.SphereGeometry(1, 8, 6);
const DOT = new THREE.SphereGeometry(1, 6, 4);
const LEG = new THREE.CapsuleGeometry(1, 3, 3, 8);
const SPIKE = new THREE.ConeGeometry(1, 1, 4);
const SMILE = new THREE.TorusGeometry(1, .08, 5, 14, Math.PI);
const PINK = '#db91cf', PINK_LIGHT = '#f2b9e3', INK = '#643e69';
const GREEN = '#b4d958', GREEN_LIGHT = '#d6ed91', GREEN_DARK = '#648b35';

// Tapered rounded chalk strokes make the tails without a chain of separate spheres or draw calls.
function stroke(points, radii, segments = 16) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, segments, 1, 6, false), p = geometry.attributes.position;
  const center = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, s = t * (radii.length - 1), lo = Math.min(radii.length - 2, Math.floor(s));
    const radius = THREE.MathUtils.lerp(radii[lo], radii[lo + 1], s - lo); curve.getPointAt(t, center);
    for (let j = 0; j <= 6; j++) {
      const n = i * 7 + j;
      p.setXYZ(n, center.x + (p.getX(n) - center.x) * radius, center.y + (p.getY(n) - center.y) * radius, center.z + (p.getZ(n) - center.z) * radius);
    }
  }
  geometry.computeVertexNormals(); return geometry;
}
const PINK_TAIL = stroke([[-.22, .83, -.13], [-.48, .53, -.20], [-.81, .38, -.23], [-1.13, .43, -.18], [-1.22, .66, -.10], [-1.12, .85, -.04]], [.15, .12, .09, .035], 18);
const GREEN_BASE = stroke([[.02, .72, -.05], [.05, .42, -.11], [-.08, .18, -.27], [-.35, .13, -.43], [-.51, .18, -.49]], [.23, .21, .15, .07], 12);
const TOOTH = (() => {
  const shape = new THREE.Shape(); shape.moveTo(-.065, .07); shape.lineTo(.065, .07); shape.lineTo(0, -.09); shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .05, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 1, steps: 1 }).translate(0, 0, -.025);
})();
const SNOUT = (() => {
  const shape = new THREE.Shape(); shape.moveTo(.05, .18); shape.lineTo(.61, .14); shape.lineTo(.87, -.01); shape.lineTo(.72, -.16); shape.lineTo(.15, -.13); shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .34, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 1, steps: 1 }).translate(0, 0, -.17);
})();
const CHEEK = stroke(Array.from({ length: 15 }, (_, i) => { const a = .22 * Math.PI + i / 14 * 1.58 * Math.PI; return [0, Math.sin(a) * .22, Math.cos(a) * .26]; }), [.018, .018], 14);

function eye(b, x, y, z, scale = 1) {
  b.put(SMALL, x, y, z, '#fffdf9', [.115 * scale, .145 * scale, .055 * scale]);
  b.put(SMALL, x + .018 * scale, y - .01 * scale, z + .048 * scale, INK, [.053 * scale, .084 * scale, .025 * scale]);
  b.put(DOT, x + .031 * scale, y + .028 * scale, z + .071 * scale, '#ffffff', .017 * scale);
}
function buildPink(b) {
  // Upright rounded body and the drawing's two long narrow, rounded legs.
  b.put(BALL, 0, .87, 0, PINK, [.32, .44, .28]);
  b.put(SMALL, 0, .83, .21, PINK_LIGHT, [.22, .29, .075]);
  for (const s of [-1, 1]) {
    b.put(LEG, s * .205, .28, .025, PINK, [.078, .105, .08], [0, 0, -s * .10]);
    b.put(SMALL, s * .23, .065, .09, PINK_LIGHT, [.105, .065, .16]);
    b.put(SMALL, s * .32, .88, .015, PINK, [.105, .22, .10], [0, 0, s * .3]);
  }
  b.put(PINK_TAIL, 0, 0, 0, PINK);
  b.put(DOT, -1.12, .85, -.04, PINK, .036);
  // The big head, oval eyes, wide smile and exactly two little downward teeth.
  b.put(BALL, 0, 1.4, .015, PINK, [.48, .43, .34]);
  eye(b, -.185, 1.53, .318); eye(b, .185, 1.53, .318);
  b.put(SMILE, 0, 1.31, .343, INK, [.26, .17, .25], [0, 0, Math.PI]);
  for (const s of [-1, 1]) b.put(TOOTH, s * .125, 1.16, .375, '#fffdf9');
}
function buildGreen(b) {
  // The much smaller curved body/base makes the oversized head recognizable from the chalk outline.
  b.put(GREEN_BASE, 0, 0, 0, GREEN);
  b.put(SMALL, -.51, .18, -.49, GREEN, .07); // close the rounded end of the drawing's single curved base
  b.put(BALL, 0, .77, -.005, GREEN, [.235, .37, .24]);
  b.put(BALL, 0, 1.38, 0, GREEN, [.49, .43, .40]);
  b.put(SNOUT, 0, 1.4, 0, GREEN, 1, [0, -Math.PI / 2, 0]);
  // The large C-shaped cheek contour and two backward-pointing spikes are in the drawing.
  for (const s of [-1, 1]) {
    b.put(SMALL, s * .32, 1.19, .09, GREEN_LIGHT, [.15, .25, .29]);
    b.put(CHEEK, s * .467, 1.19, .09, GREEN_DARK);
  }
  for (const [y, z, length] of [[1.61, -.40, .29], [1.34, -.43, .27]]) b.put(SPIKE, 0, y, z, GREEN, [.15, length, .13], [-Math.PI / 2, 0, 0]);
  eye(b, -.205, 1.60, .343, .82); eye(b, .205, 1.60, .343, .82);
  b.put(SMILE, 0, 1.30, .85, GREEN_DARK, [.15, .075, .20], [Math.PI / 4, 0, Math.PI]); // follow the snout's sloping front surface
}

export const CHALK_FRIENDS = {
  chalkpink: { name: 'Pink Chalk Friend', planet: 'earth', move: 'hop', v: .65, r: 1.2, size: 1, hopH: .10,
    emoji: '🖍️', voice: 'Hello! Your drawing came to life! Tap me and let’s twirl!', build: buildPink },
  chalkgreen: { name: 'Green Chalk Friend', planet: 'earth', move: 'hop', v: .8, r: 1.2, copyRange: 1.2, size: 1, hopH: .14,
    emoji: '🖍️', voice: 'Hello! Your drawing came to life! Let’s play copycat!', build: buildGreen },
};
