import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';
const root = resolve(import.meta.dirname, '..');
assert.ok(existsSync(join(root, 'src/craft-fantasy.js')), 'ten reference characters need real 3D models');
const temp = await mkdtemp(join(tmpdir(), 'craft-fantasy-'));
let CRAFT_FANTASY, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { CRAFT_FANTASY } from './src/craft-fantasy.js';export {makeBatch,shinyMat} from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'silent' });
  ({ CRAFT_FANTASY, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = ['craftbuttonbunny','craftnoodleunicorn','craftbutterflyunicorn','craftpartykitten','craftbluemanepony','craftwingedbow','craftcloudmonkey','craftheadphonedragon','craftheartpumpkin','craftheartghost'];
const meshes = Object.fromEntries(keys.map(k => { const b=makeBatch();CRAFT_FANTASY[k].build(b);const m=b.mesh(shinyMat());m.updateMatrixWorld(true);return [k,m]; }));
const vertices = m => {const p=m.geometry.attributes.position,c=m.geometry.attributes.color;return Array.from({length:p.count},(_,i)=>({x:p.getX(i),y:p.getY(i),z:p.getZ(i),color:new THREE.Color(c.getX(i),c.getY(i),c.getZ(i))}));};
const paint = (p,hex) => { const c=new THREE.Color(hex);return Math.hypot(c.r-p.color.r,c.g-p.color.g,c.b-p.color.b)<.04; };
function front(m,x,y){const hit=new THREE.Raycaster(new THREE.Vector3(x,y,3),new THREE.Vector3(0,0,-1)).intersectObject(m)[0];assert.ok(hit,`solid front at ${x},${y}`);return {color:new THREE.Color().fromBufferAttribute(m.geometry.attributes.color,hit.face.a),z:hit.point.z};}

test('all ten are world residents, with spoken interaction and no pet/avatar role',()=>{
 assert.deepEqual(Object.keys(CRAFT_FANTASY),keys);
 for(const s of Object.values(CRAFT_FANTASY)){assert.equal(s.planet,'earth');assert.ok(!s.pet);assert.equal(s.size,1);assert.equal(s.emoji,'🖍️');assert.ok(s.r>=1&&s.r<=1.1&&s.v<=.55);assert.match(s.voice,/Hi|Hello/);assert.ok(s.voice.length<110);assert.ok(['twirl','bounce','sing','sparkle','hug'].includes(s.play.action));if(s.play.action==='bounce')assert.equal(s.move,'bounce');assert.ok(s.play.colors.every(c=>/^#[a-f\d]{6}$/i.test(c)));}
});
test('all models are one finite shared painted solid within the mobile geometry budget',()=>{
 for(const [key,m]of Object.entries(meshes)){assert.equal(m.material,shinyMat());assert.equal(m.material.map,null);for(const a of ['position','normal','color'])assert.ok(Array.from(m.geometry.attributes[a].array).every(Number.isFinite),key+' finite '+a);assert.ok(m.geometry.index.count/3<=3000,key+' triangles '+m.geometry.index.count/3);const b=new THREE.Box3().setFromObject(m),s=b.getSize(new THREE.Vector3());assert.ok(b.min.y>=-.02&&s.y>=1.5&&s.y<=2.2,key+' height '+s.y);assert.ok(s.x<=2.7&&s.z>=.3&&s.z<=1.4,key+' width/depth');}
});
test('button bunny preserves mismatched stitched/glossy eyes, tall pink-lined ears and pink tummy',()=>{
 const m=meshes.craftbuttonbunny,v=vertices(m);assert.ok(paint(front(m,-.21,1.45),'#f3c5dc'),'cross-stitch visible');assert.ok(paint(front(m,.21,1.45),'#f4ddf0'),'glossy eye center glint');assert.ok(v.some(p=>p.y>2&&paint(p,'#e78fb4')));assert.ok(paint(front(m,0,.58),'#eec4e0'));assert.ok(v.some(p=>p.x>.25&&p.y>.65&&p.y<1),'raised right arm');
});
test('noodle unicorn keeps coral horn, rainbow mane, ice cream, cup and paired chopsticks',()=>{
 const m=meshes.craftnoodleunicorn,v=vertices(m);assert.ok(v.some(p=>p.y>1.9&&paint(p,'#ed8e90')));for(const c of ['#65bad0','#edd06e','#d981b9'])assert.ok(v.some(p=>paint(p,c)));assert.ok(v.some(p=>p.x<-.25&&p.y<.8&&paint(p,'#add5b8')),'mint ice cream');assert.ok(v.some(p=>p.x>.3&&p.y<.8&&paint(p,'#edc45e')),'yellow noodle cup');assert.ok(v.some(p=>p.x>.3&&p.y>.8&&paint(p,'#a94d54')),'chopsticks');assert.ok(front(m,.20,.57).z>.22&&front(m,-.36,.58).z>.22,'hands reach forward to held food');
});
test('butterfly unicorn has blue horn, pastel forelock, butterfly ornament and seated pink hooves',()=>{
 const m=meshes.craftbutterflyunicorn,v=vertices(m);assert.ok(v.some(p=>p.y>1.95&&paint(p,'#5c8dcc')));assert.ok(v.filter(p=>p.x>.1&&p.y>1.7&&paint(p,'#e8c670')).length>20);assert.ok(v.some(p=>p.y<.25&&paint(p,'#c58cc3')));assert.ok(paint(front(m,-.21,1.45),'#f4ddf0'));
});
test('party kitten has dotted red cone hat, huge ears, paw pads and fluffy chest',()=>{
 const m=meshes.craftpartykitten,v=vertices(m);assert.ok(v.some(p=>p.y>1.8&&paint(p,'#d85c65')));assert.ok(v.some(p=>p.y>2&&paint(p,'#e9cf6c')));assert.ok(v.some(p=>Math.abs(p.x)>.45&&p.y>1.5));assert.ok(v.some(p=>p.y>.65&&p.y<1&&Math.abs(p.x)>.2&&paint(p,'#d78fae')),'raised paw pads');assert.ok(paint(front(m,0,.70),'#fff0d5'),'cream fluffy bib');
});
test('blue-mane pony remains hornless, with long blue/pink hair, blue eyes and broad pink hooves',()=>{
 const m=meshes.craftbluemanepony,v=vertices(m);assert.ok(v.filter(p=>p.y>1.8&&Math.abs(p.x)<.1).every(p=>!paint(p,'#5c8dcc')),'no blue horn');for(const c of ['#629fd8','#8d7bcc','#d981b9'])assert.ok(v.some(p=>paint(p,c)));assert.ok(paint(front(m,-.21,1.45),'#f4ddf0'));assert.ok(v.some(p=>p.y<.25&&paint(p,'#c58cc3')));
});
test('winged bow friend retains feather wings, blue bow, horn, blue tail and bold black muzzle',()=>{
 const m=meshes.craftwingedbow,v=vertices(m);assert.ok(v.some(p=>p.x<-.6&&p.y>.5&&paint(p,'#fff0d5'))&&v.some(p=>p.x>.6&&p.y>.5&&paint(p,'#fff0d5')),'two pale wings');assert.ok(v.some(p=>p.y>1.7&&paint(p,'#438cc0')),'forehead bow');assert.ok(v.some(p=>p.y>1.95&&paint(p,'#8b8bc5')),'horn');assert.ok(paint(front(m,0,1.18),'#343248'),'large black nose visible');assert.ok(v.some(p=>p.y<.6&&p.x>.3&&paint(p,'#65bad0')),'blue curled tail');
});
test('cloud monkey keeps spiral eye, forehead cloud, long tail and held blue heart balloon',()=>{
 const m=meshes.craftcloudmonkey,v=vertices(m);assert.ok(paint(front(m,-.21,1.45),'#3b2c4e'),'spiral center visible');assert.ok(v.some(p=>Math.abs(p.x)<.3&&p.y>1.8&&paint(p,'#edc7e1')),'cloud ornament');assert.ok(v.some(p=>p.x>.65&&p.y>1&&paint(p,'#548fd8')),'blue heart balloon');assert.ok(v.some(p=>p.x>.70&&p.y>1.1&&paint(p,'#79556c')),'string reaches the heart balloon knot');assert.ok(v.some(p=>p.x>.5&&p.y<.8&&paint(p,'#be7b66')),'curved tail');
});
test('headphone dragon has lavender headset, large side fins, striped belly, claws and tipped tail',()=>{
 const m=meshes.craftheadphonedragon,v=vertices(m);assert.ok(v.some(p=>Math.abs(p.x)>.5&&p.y>1.3&&paint(p,'#a59ad4')),'headphone cups');assert.ok(v.some(p=>p.y>1.8&&paint(p,'#e487ae')),'headband');assert.ok(v.some(p=>Math.abs(p.x)>.5&&paint(p,'#dc84ae')),'pink side fins');assert.ok(paint(front(m,0,.57),'#c3b6e3'),'lavender belly');for(const side of [-1,1])assert.ok(paint(front(m,side*.40,1.23),'#e99ebd'),'both cheek dots sit in front of the box-shaped head');assert.ok(v.some(p=>p.x>.6&&p.y>.6&&paint(p,'#8176b6')),'leafy tail tip');assert.ok(v.some(p=>p.y<.3&&paint(p,'#fff0d5')),'white claws');
});
test('heart pumpkin has orange ribs, brown stem, yellow tendrils and two dark heart eyes',()=>{
 const m=meshes.craftheartpumpkin,v=vertices(m);assert.ok(v.some(p=>p.y>1.3&&paint(p,'#986544')));assert.ok(v.some(p=>p.y>1.1&&paint(p,'#d7c65d')));assert.ok(v.filter(p=>paint(p,'#d79c4e')).length>80);assert.ok(paint(front(m,-.23,.98),'#36313b')&&paint(front(m,.23,.98),'#36313b'));assert.ok(paint(front(m,0,.70),'#5d8dac'),'blue triangular nose');
});
test('heart ghost is separate, with a wavy solid hem, magenta heart eyes and blue eyebrows',()=>{
 const m=meshes.craftheartghost,v=vertices(m);assert.ok(v.some(p=>p.y<.3&&paint(p,'#ad4d7a')),'outlined draped hem');assert.ok(paint(front(m,-.20,1.34),'#ae496f')&&paint(front(m,.20,1.34),'#ae496f'),'filled magenta heart eyes');assert.ok(v.some(p=>p.y>1.5&&paint(p,'#5d8dac')));assert.ok(paint(front(m,0,.95),'#36313b')&&paint(front(m,0,1.07),'#ae496f'),'open mouth with magenta interior');assert.ok(v.some(p=>p.x<-.55)&&v.some(p=>p.x>.55),'outstretched arms');
});
