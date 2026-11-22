import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(existsSync(join(root, 'src/craft-animals.js')), 'all ten family crafts need 3D models');
const temp = await mkdtemp(join(tmpdir(), 'family-craft-animals-'));
let CRAFT_ANIMALS, makeBatch, shinyMat;
try {
  await build({ stdin: { contents: `export { CRAFT_ANIMALS } from './src/craft-animals.js';export { makeBatch,shinyMat } from './src/spacekit.js';`, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'models.mjs'), logLevel: 'silent' });
  ({ CRAFT_ANIMALS, makeBatch, shinyMat } = await import(pathToFileURL(join(temp, 'models.mjs'))));
} finally { await rm(temp, { recursive: true, force: true }); }
const keys = ['craftorangescribble','craftyellowcat','craftseatedpanda','craftdadduck','craftgreenscribble','craftpatchpuppy','craftrainbowcorgi','craftstandingpanda','craftsweetraccoon','craftorangefox'];
const meshes = Object.fromEntries(keys.map(key => { const b = makeBatch(); CRAFT_ANIMALS[key].build(b); const m = b.mesh(shinyMat());m.updateMatrixWorld(true);return [key,m]; }));
const vertices = m => { const p=m.geometry.attributes.position,c=m.geometry.attributes.color;return Array.from({length:p.count},(_,i)=>({x:p.getX(i),y:p.getY(i),z:p.getZ(i),color:new THREE.Color(c.getX(i),c.getY(i),c.getZ(i))})); };
const ink = (p,hex) => { const c=new THREE.Color(hex);return Math.hypot(p.color.r-c.r,p.color.g-c.g,p.color.b-c.b)<.035; };
function front(m,x,y){const h=new THREE.Raycaster(new THREE.Vector3(x,y,3),new THREE.Vector3(0,0,-1)).intersectObject(m)[0];assert.ok(h,'actual solid front surface');return {color:new THREE.Color().fromBufferAttribute(m.geometry.attributes.color,h.face.a)};}

test('ten distinct crafts have spoken greetings and world play without becoming pets',()=>{
  assert.deepEqual(Object.keys(CRAFT_ANIMALS),keys);
  for(const s of Object.values(CRAFT_ANIMALS)){assert.equal(s.planet,'earth');assert.ok(!s.pet);assert.equal(s.emoji,'🖍️');assert.equal(s.size,1);assert.ok(s.r>=1&&s.r<=1.1&&s.v<=.55);assert.match(s.voice,/Hello|Hi/);assert.ok(s.voice.length<115);assert.ok(['twirl','bounce','sing','sparkle','hug'].includes(s.play.action));if(s.play.action==='bounce')assert.equal(s.move,'bounce');assert.ok(s.play.colors.length>=2);}
  assert.equal(CRAFT_ANIMALS.craftdadduck.name,'Dad Duck');
});
test('all crafts are finite rounded painted solids within the mobile budget',()=>{
  for(const [key,m] of Object.entries(meshes)){assert.equal(m.material,shinyMat());assert.equal(m.material.map,null);for(const attr of ['position','normal','color'])assert.ok(Array.from(m.geometry.attributes[attr].array).every(Number.isFinite),`${key} finite ${attr}`);const b=new THREE.Box3().setFromObject(m),s=b.getSize(new THREE.Vector3());assert.ok(b.min.y>=-.015,`${key} feet on ground`);assert.ok(s.y>=1.5&&s.y<=2.2,`${key} fits resident height`);assert.ok(s.x<=2.7&&s.z>=.55&&s.z<=1.7,`${key} has real volume`);assert.ok(m.geometry.index.count/3<=4000,`${key} triangle budget`);assert.ok(m.geometry.attributes.color.count===m.geometry.attributes.position.count);}
});
test('orange scribble preserves diagonal orange marks, long feelers, dark loop eyes and smile',()=>{
  const m=meshes.craftorangescribble,v=vertices(m);assert.ok(v.filter(p=>p.z>.25&&ink(p,'#dd9a5e')).length>100);assert.ok(v.some(p=>p.y>1.85&&p.x<-.15)&&v.some(p=>p.y>1.85&&p.x>.15));assert.ok(ink(front(m,-.22,1.15),'#51434a'));assert.ok(ink(front(m,0,.72),'#51434a'));
});
test('yellow cat keeps its X eye, lash eye, pink cheeks and large pointed ears',()=>{
  const m=meshes.craftyellowcat,v=vertices(m);assert.ok(ink(front(m,-.23,1.35),'#fff5e7'),'X crosses left button eye');assert.ok(v.filter(p=>p.x>.1&&p.y>1.45&&ink(p,'#513b46')).length>15,'lashes');assert.ok(v.some(p=>p.y>1.95&&p.x<-.4)&&v.some(p=>p.y>1.95&&p.x>.4));assert.ok(ink(front(m,-.43,1.08),'#e988aa'));
});
test('seated and standing pandas retain different silhouettes, paw pads and eye stickers',()=>{
  const seated=meshes.craftseatedpanda,standing=meshes.craftstandingpanda,a=vertices(seated),b=vertices(standing);assert.ok(a.filter(p=>p.y<.35&&p.z>.25&&ink(p,'#e898b6')).length>40,'seated paws face forward');assert.ok(b.some(p=>p.x<-.55&&p.y>.6)&&b.some(p=>p.x>.55&&p.y>.6),'standing outstretched arms');assert.ok(ink(front(seated,.24,1.30),'#896b6d'),'plain right eye patch');assert.ok(ink(front(standing,0,1.02),'#ed88a9'),'standing tongue');
});
test('Dad Duck retains purple head, broad peach bill, moustache, goatee, tie and two held props',()=>{
  const m=meshes.craftdadduck,v=vertices(m);assert.ok(ink(front(m,0,1.08),'#674b45'),'moustache on bill');assert.ok(v.filter(p=>p.y>.7&&p.y<1&&p.z>.4&&ink(p,'#674b45')).length>15,'goatee');assert.ok(ink(front(m,0,.57),'#d667a0'),'pink necktie');assert.ok(v.some(p=>p.x<-.72&&p.y>.7&&ink(p,'#f0d6ae')),'ramen packet');assert.ok(v.some(p=>p.x>.72&&p.y>.7&&ink(p,'#f7f1df')),'coffee cup');assert.ok(v.some(p=>p.y>1.9&&ink(p,'#9468c9')),'head tuft');
});
test('Dad Duck holds his coffee cup with actual overlapping wing geometry',()=>{
  const m=meshes.craftdadduck,material=m.material;
  m.material=material.clone();m.material.side=THREE.DoubleSide;
  try{
    // A horizontal slice through both solids must overlap in depth and width, not merely in a front projection.
    const ray=new THREE.Raycaster(new THREE.Vector3(0,.78,.045),new THREE.Vector3(1,0,0));
    const hits=ray.intersectObject(m).map(h=>({x:h.point.x,color:new THREE.Color().fromBufferAttribute(m.geometry.attributes.color,h.face.a)}));
    const wing=hits.filter(p=>ink(p,'#f0d6ae')),cup=hits.filter(p=>ink(p,'#f7f1df'));
    assert.ok(wing.length>=2&&cup.length>=2,'slice passes through both the wing and coffee cup');
    assert.ok(Math.min(...cup.map(p=>p.x))<Math.max(...wing.map(p=>p.x))-.01,'cup overlaps the wing by at least a centimetre');
  }finally{m.material.dispose();m.material=material;}
  for(let i=0;i<=9;i++)front(m,.72+i*.02,.78);
});
test('green scribble keeps crayon colors, irregular rim curls and a visible lower smile',()=>{
  const m=meshes.craftgreenscribble,v=vertices(m);assert.ok(v.filter(p=>p.z>.2&&ink(p,'#598157')).length>90);assert.ok(v.filter(p=>p.z>.2&&ink(p,'#433a8c')).length>90);assert.ok(v.some(p=>p.y>1.75&&Math.abs(p.x)>.25),'rim curls');assert.ok(ink(front(m,0,.65),'#51434a'),'smile visible over scribbles');
});
test('patch puppy has floppy orange ears and its blue fang-and-tongue muzzle',()=>{
  const m=meshes.craftpatchpuppy,v=vertices(m);assert.ok(ink(front(m,0,1.0),'#8c9edb'),'blue muzzle');assert.ok(v.filter(p=>p.y>.85&&p.y<1.05&&p.z>.5&&ink(p,'#fff5e7')).length>20,'two small white fangs');assert.ok(ink(front(m,0,.90),'#ed88a9'),'pink tongue');assert.ok(v.some(p=>p.x<-.6&&p.y>1.5&&ink(p,'#e99656')),'floppy ear');assert.ok(v.some(p=>p.x<-.5&&p.y>.5&&p.y<.8&&ink(p,'#fff5e7')),'outstretched pale-tipped arm');assert.ok(v.filter(p=>p.x<-.3&&p.y<.4).every(p=>p.y>.08),'left foot is kicked up');
});
test('rainbow corgi keeps horn, huge ears, white bib and collar bell',()=>{
  const m=meshes.craftrainbowcorgi,v=vertices(m);assert.ok(v.some(p=>p.y>2.0&&Math.abs(p.x)<.1&&ink(p,'#be81c2')),'central horn');assert.ok(v.some(p=>p.y>1.9&&p.x<-.55)&&v.some(p=>p.y>1.9&&p.x>.55),'huge ears');assert.ok(ink(front(m,0,.48),'#fff5e7'),'white fluffy bib');assert.ok(v.some(p=>p.y>.62&&p.y<.83&&p.z>.3&&ink(p,'#efc55f')),'gold collar bell');
});
test('sweet raccoon keeps striped tail, cupcake belly, sweets and balloon',()=>{
  const m=meshes.craftsweetraccoon,v=vertices(m);assert.ok(ink(front(m,0,.40),'#ed88a9'),'cupcake case on belly');assert.ok(v.some(p=>p.x<-.55&&p.y<.9&&ink(p,'#796b74'))&&v.some(p=>p.x<-.55&&p.y<.9&&ink(p,'#e1d8cf')),'striped tail');assert.ok(v.some(p=>p.x>.8&&p.y>1.1&&ink(p,'#efc55f')),'held balloon');assert.ok(v.some(p=>p.x<-.8&&p.y>.8&&ink(p,'#be81c2')),'held sweets');
});
test('orange fox keeps spiral eye, pig snout, heart belly and cream-tipped tail',()=>{
  const m=meshes.craftorangefox,v=vertices(m);assert.ok(ink(front(m,0,1.10),'#ed88a9'),'pig snout');assert.ok(ink(front(m,0,.42),'#ed88a9'),'heart belly');assert.ok(v.some(p=>p.x>.7&&ink(p,'#fff5e7')),'pale tail tip');assert.ok(ink(front(m,-.23,1.4),'#efcbd5'),'pale spiral on dark eye');
});
