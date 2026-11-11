// ===================================================================
// post.js: 3D build 13, the "more realistic" picture.
//   The world is drawn into an off-screen HDR picture (with anti-aliasing and
//   a depth buffer), then:
//   • GTAO ambient occlusion adds the soft natural shadows where things meet:
//     under creatures, in corners, between blocks, under the trees.
//     It reuses the depth buffer (no second drawing of the world), at half
//     size, so it stays light enough for phones.
//   • OutputPass does the tone mapping and colour conversion.
//   If the device can't keep up, adapt() in main.js switches this off and the
//   game draws straight to the screen like before.
// ===================================================================
import * as THREE from 'three';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export function makePost(renderer, scene, camera, { mobile }) {
  const size = new THREE.Vector2();
  const depth = new THREE.DepthTexture(1, 1); depth.type = THREE.UnsignedIntType;
  const rtScene = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: mobile ? 2 : 4, depthTexture: depth, depthBuffer: true });
  rtScene.texture.colorSpace = THREE.LinearSRGBColorSpace;
  const rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const gtao = new GTAOPass(scene, camera, 1, 1, { depthTexture: depth });
  gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 1;
  gtao.updateGtaoMaterial({ radius: .8, distanceExponent: 1.3, thickness: 1.4, scale: 1.3, samples: mobile ? 8 : 12, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: mobile ? 8 : 12 });
  const out = new OutputPass();
  const post = {
    enabled: true,
    setSize(w, h, dpr) {
      const W = Math.max(1, Math.floor(w * dpr)), H = Math.max(1, Math.floor(h * dpr));
      rtScene.setSize(W, H); rtAO.setSize(W, H);
      gtao.setSize(Math.max(1, W >> 1), Math.max(1, H >> 1)); // AO at half size (much cheaper, still soft)
      out.setSize(W, H);
    },
    render() {
      renderer.getSize(size);
      renderer.setRenderTarget(rtScene); renderer.clear(); renderer.render(scene, camera);
      gtao.render(renderer, rtAO, rtScene);
      out.renderToScreen = true; out.render(renderer, null, rtAO);
      renderer.setRenderTarget(null);
    },
    gtao,
  };
  return post;
}
