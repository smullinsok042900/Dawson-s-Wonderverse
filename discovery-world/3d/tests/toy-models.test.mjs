// Native geometry/semantic checks; no browser, GL context, canvas, or asset loading.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temp=await mkdtemp(join(tmpdir(),'discovery-toys-'));
try {
  const source=await readFile(join(root,'src/toy-models.js'),'utf8');
  assert.match(source,/import\s*\{\s*toy\s*\}\s*from\s*['"]\.\/creatures\.js/,'Use the actual world toy material factory');
  // Only the material factory is replaced: its production import pulls in world
  // canvas normal maps and GLB loading. The full model-building code is tested.
  await build({entryPoints:[join(root,'src/toy-models.js')],bundle:true,platform:'node',format:'esm',outfile:join(temp,'models.mjs'),logLevel:'silent',plugins:[{name:'native-material',setup(b){b.onResolve({filter:/^\.\/creatures\.js$/},()=>({path:'toy-material',namespace:'native-material'}));b.onLoad({filter:/.*/,namespace:'native-material'},()=>({contents:"import * as THREE from 'three'; export const toy=(color,o={})=>new THREE.MeshPhysicalMaterial({color,roughness:o.r,clearcoat:o.cc*.45});",resolveDir:root}));}}]});
  const {makeToyModel}=await import(pathToFileURL(join(temp,'models.mjs')));
  const symbols=[...new Set((await Promise.all(['src/learn.js','src/expansion.js','src/sea.js'].map(f=>readFile(join(root,f),'utf8')))).flatMap(s=>s.match(/[\u{1f000}-\u{1ffff}\u2600-\u27ff]/gu))),...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+−-=×÷/→←↔<>!.…:',...'10 ball bubble bucket cup critter critter-open face-happy face-sad face-grumpy face-surprised face-scared face-sleepy circle square triangle star heart rectangle oval diamond tank bowl magnet pot card train socket dot'.split(' ')];
  const hud=new Set();
  for(const s of symbols){
    const g=makeToyModel(s),copy=makeToyModel(s);assert.notEqual(g,copy);assert.equal(g.children.length,1,s+' must use one draw');assert.equal(g.children[0].geometry,copy.children[0].geometry,s+' shares geometry');assert.equal(g.children[0].material,copy.children[0].material,s+' shares material');assert.ok(g.children[0].material.vertexColors,s+' keeps baked paint colors');
    g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g),size=b.getSize(new THREE.Vector3());assert.ok(Math.abs(Math.max(size.x,size.y,size.z)-1)<1e-5,s+' dimensions');assert.ok(b.getCenter(new THREE.Vector3()).length()<1e-5,s+' center');g.traverse(m=>{assert.ok(!m.isSprite);assert.ok(!m.material?.map);});assert.ok(g.userData.toyKind!=='fallback'||hud.has(s),'semantic coverage '+s);
    copy.position.x=10;assert.equal(g.position.x,0,'independent transforms');
  }
  function fingerprint(s){const a=makeToyModel(s).children[0].geometry.attributes;return ['position','color'].map(k=>Array.from(a[k].array).map(v=>v.toFixed(3)).join(',')).join('|');}
  const pairs=[['+','−'],['+','='],['×','÷'],['→','←'],['?','+'],['🎼','🎹'],['🔑','📎'],['🔑','🔩'],['🤝','🏃'],['🙏','🙉'],['😝','🤗'],['🚸','🚦'],['⛑','👑'],['🎂','🍦'],['star','A'],['tank','T'],['face-sad','face-happy']];
  const feelings=['happy','sad','grumpy','surprised','scared','sleepy'];for(let i=0;i<feelings.length;i++)for(let j=i+1;j<feelings.length;j++)pairs.push(['face-'+feelings[i],'face-'+feelings[j]]);
  for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')pairs.push([ch,ch.toLowerCase()]);
  for(const [a,b] of pairs)assert.notEqual(fingerprint(a),fingerprint(b),`Meaningful geometry/paint distinction: ${a} vs ${b}`);
  assert.equal(makeToyModel('?').userData.toyKind,'?');
  assert.notEqual(makeToyModel('❓').userData.toyKind,'fallback');
  assert.equal(makeToyModel('🐿️').children[0].geometry,makeToyModel('🐿').children[0].geometry,'variation selector uses same prototype');
  console.log(`Passed: ${symbols.length} normalized cached solid toys; one draw each; ${pairs.length} semantic/case distinctions.`);
} finally {await rm(temp,{recursive:true,force:true});}
