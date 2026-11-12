// ===================================================================
// post.js: the picture pipeline (build 13, upgraded in build 17).
//   1. The world is drawn into an off-screen HDR picture (4x anti-aliasing
//      and a depth buffer).
//   2. GTAO ambient occlusion: soft natural shading where things meet, at
//      half size, reusing the depth buffer (no second drawing of the world).
//   3. A light BLOOM: only the brightest things (sparkles, glowing windows,
//      lanterns, sunlit highlights) get a soft glow, blurred at quarter size.
//   4. A FINAL pass: tone mapping, a gentle colour grade (richer colour,
//      soft contrast, warm highlights and cool shadows) and a soft vignette.
//   If the device can't keep up, adapt() in main.js lowers the resolution
//   first, then switches this off and draws straight to the screen.
// ===================================================================
import * as THREE from 'three';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

export function makePost(renderer, scene, camera, { mobile }) {
  const depth = new THREE.DepthTexture(1, 1); depth.type = THREE.UnsignedIntType;
  const rtScene = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4, depthTexture: depth, depthBuffer: true });
  const rtAO = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const rtB1 = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }), rtB2 = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const gtao = new GTAOPass(scene, camera, 1, 1, { depthTexture: depth });
  gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 1;
  gtao.updateGtaoMaterial({ radius: 1.1, distanceExponent: 1.3, thickness: 1.4, scale: 1.25, samples: mobile ? 8 : 12, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: mobile ? 8 : 12 });

  // bloom: keep only what is brighter than white, then blur it (quarter size)
  const bright = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, uThresh: { value: 1.5 } }, vertexShader: vert,
    fragmentShader: 'uniform sampler2D tIn; uniform float uThresh; varying vec2 vUv; void main(){ vec3 c = texture2D(tIn, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(uThresh, uThresh + .6, l), 1.); }' }));
  const blurMat = new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vert,
    fragmentShader: 'uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv; void main(){ vec3 c = texture2D(tIn, vUv).rgb * .227; c += (texture2D(tIn, vUv + uDir * 1.385).rgb + texture2D(tIn, vUv - uDir * 1.385).rgb) * .316; c += (texture2D(tIn, vUv + uDir * 3.231).rgb + texture2D(tIn, vUv - uDir * 3.231).rgb) * .07; gl_FragColor = vec4(c, 1.); }' });
  const blur = new FullScreenQuad(blurMat);

  // final: tone mapping + colour grade + dithering, written straight to the screen
  // (build 18: no artificial saturation boost; contrast comes from the lighting now. A light
  //  contrast-adaptive sharpen keeps textures crisp, and a tiny dither removes banding in the sky.)
  const finalMat = new THREE.ShaderMaterial({
    uniforms: { tIn: { value: null }, tBloom: { value: null }, uBloom: { value: .16 }, toneMappingExposure: { value: 1 }, uContrast: { value: 1.05 }, uVig: { value: .14 }, uTexel: { value: new THREE.Vector2(1, 1) }, uSharp: { value: .2 } },
    vertexShader: vert,
    fragmentShader: `
      uniform sampler2D tIn; uniform sampler2D tBloom; uniform float uBloom; uniform float uContrast; uniform float uVig; uniform vec2 uTexel; uniform float uSharp; varying vec2 vUv;
      // (three.js adds the tone mapping and colour space functions to every ShaderMaterial)
      vec3 tm(vec3 c){ return NeutralToneMapping(c); }
      float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
      void main(){
        vec3 c = tm(texture2D(tIn, vUv).rgb); // (build 20: no sharpening: it amplified fur grain, leaf noise and texture shimmer)
        c += tm(texture2D(tBloom, vUv).rgb) * uBloom; // glow (only from truly bright things)
        float l = luma(c);
        vec3 g = sRGBTransferOETF(vec4(clamp(c, 0., 1.), 1.)).rgb;
        g = (g - .5) * uContrast + .5;                                   // a gentle contrast lift
        g += vec3(.010, .004, -.006) * smoothstep(.5, 1., l);            // warm highlights
        g += vec3(-.004, -.001, .010) * (1. - smoothstep(0., .3, l));     // cool shadows
        float d = length(vUv - .5); g *= 1. - uVig * smoothstep(.4, .9, d);
        g += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255.; // dither: no banding
        gl_FragColor = vec4(clamp(g, 0., 1.), 1.);
      }` });
  const fin = new FullScreenQuad(finalMat);
  const post = {
    enabled: true,
    setSize(w, h, dpr) {
      const W = Math.max(1, Math.floor(w * dpr)), H = Math.max(1, Math.floor(h * dpr));
      rtScene.setSize(W, H); rtAO.setSize(W, H);
      gtao.setSize(Math.max(1, W >> 1), Math.max(1, H >> 1)); // AO at half size
      finalMat.uniforms.uTexel.value.set(1 / W, 1 / H); const bw = Math.max(1, W >> 2), bh = Math.max(1, H >> 2); rtB1.setSize(bw, bh); rtB2.setSize(bw, bh); post.bt = [1 / bw, 1 / bh];
    },
    render() {
      renderer.setRenderTarget(rtScene); renderer.clear(); renderer.render(scene, camera);
      gtao.render(renderer, rtAO, rtScene);
      // bloom at quarter size: bright pass, then a horizontal and a vertical blur, twice
      bright.material.uniforms.tIn.value = rtAO.texture; renderer.setRenderTarget(rtB1); bright.render(renderer);
      for (let i = 0; i < 2; i++) {
        blurMat.uniforms.tIn.value = rtB1.texture; blurMat.uniforms.uDir.value.set(post.bt[0] * (1 + i), 0); renderer.setRenderTarget(rtB2); blur.render(renderer);
        blurMat.uniforms.tIn.value = rtB2.texture; blurMat.uniforms.uDir.value.set(0, post.bt[1] * (1 + i)); renderer.setRenderTarget(rtB1); blur.render(renderer);
      }
      finalMat.uniforms.tIn.value = rtAO.texture; finalMat.uniforms.tBloom.value = rtB1.texture; finalMat.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
      renderer.setRenderTarget(null); fin.render(renderer);
    },
    gtao, finalMat,
  };
  return post;
}
