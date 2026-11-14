// Real Three.js scene tests without a browser or WebGL renderer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
function load(source, suffix = '') {
  const filename = path.resolve(__dirname, '../src', source);
  const bundled = esbuild.buildSync({stdin: {contents: fs.readFileSync(filename, 'utf8') + suffix, resolveDir: path.dirname(filename), sourcefile: filename}, loader:{'.jpg':'dataurl','.glb':'dataurl'}, bundle:true, platform:'node', format:'cjs', write:false});
  const mod = {exports:{}};
  new Function('require','module','exports',bundled.outputFiles[0].text)(require, mod, mod.exports);
  return mod.exports;
}
global.location = {search:'?noassets'};
const noop = () => {};
const context = new Proxy({}, {get: (o,k) => k === 'isPointInPath' ? () => false : ['getImageData','createImageData'].includes(k) ? (...args) => ({data:new Uint8ClampedArray((args.at(-2)||128)*(args.at(-1)||128)*4)}) : noop, set: () => true});
global.document = {createElement: () => ({width:0,height:0,getContext: () => context})};
global.Path2D = class {rect(){} arc(){} ellipse(){} closePath(){} moveTo(){} lineTo(){}};
const {buildMeadow, BUILD, ERASE} = load('meadow.js');
const THREE = require('three');
const scene = new THREE.Scene(), world = {build:Array(50).fill(-1),paintColor:'#ff4f9a'};
world.build[0] = 0; world.build[1] = 1;
const G = {platforms:[],interact:[]};
const taps=[];
const meadow=buildMeadow(G,{scene,world,Sound:{pop:noop,tone:noop},burst:noop,discover:noop,saveSoon:noop,tap:(mesh, fn)=>{mesh.userData.tap=fn;taps.push(mesh);}});
meadow.restored();
const blocks=()=>{const found=[];scene.traverse(o=>{if(o.userData.blockType!==undefined) found.push(o);});return found;};
assert.equal(blocks().length,2);
assert(blocks().every(b=>b.userData.dynamic),'saved blocks stay outside static scenery slices');
const old=blocks().find(b=>b.userData.blockType===0), unchanged=blocks().find(b=>b.userData.blockType===1);
// Simulate the old startup reparenting: erasing must work under any parent.
const slice=new THREE.Group();scene.add(slice);slice.add(old);
world.buildType=ERASE;
taps[0].userData.tap({point:new THREE.Vector3(BUILD.x0+.6,.5,BUILD.z)});
assert.equal(old.parent,null,'saved mesh is removed from its actual parent');
assert.equal(blocks().length,1);
assert.equal(blocks()[0],unchanged,'editing one cell preserves other GPU objects');
assert.equal(G.platforms.filter(p=>p.builder).length,1);
world.buildType=2;
taps[0].userData.tap({point:new THREE.Vector3(BUILD.x0+.6,.5,BUILD.z)});
assert.equal(blocks().length,2);
assert.equal(G.platforms.filter(p=>p.builder).length,2);
assert.equal(world.build[0],2);
console.log('PASS: saved builder erases reparented meshes and preserves unchanged cells/platforms');
if(fs.existsSync(path.resolve(__dirname,'../src/toy-models.js'))){
 const {physicalToy,setToySymbol}=load('expansion.js','\nexport {physicalToy,setToySymbol};\n');
 const toy=physicalToy('🐴',1.4), originalScale=toy.scale.clone(), handler=()=>{};
 toy.userData.tap=handler;toy.position.set(-420,1.1,-3.1);toy.visible=false;
 setToySymbol(toy,'🐄');
 assert.equal(toy.userData.tap,handler);assert(toy.scale.equals(originalScale));assert.equal(toy.position.x,-420);assert.equal(toy.visible,false);
 let meshes=0;toy.traverse(o=>{assert(!o.isSprite);if(o.isMesh)meshes++;});assert(meshes>0);
 console.log('PASS: changing physical animals preserves gameplay transforms and input');
}
