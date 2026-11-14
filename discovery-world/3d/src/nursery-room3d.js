import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildPet } from './friends.js';
import { toy } from './creatures.js';
import { fabricMat } from './nature.js';
import { setLids } from './characters.js';
import { litPlayroom } from './playroom3d.js';
import { makeToyModel } from './toy-models.js';

const RECIPES = [{col:5,ears:0,tail:0,pat:0},{col:4,ears:1,tail:1,pat:2},{col:3,ears:3,tail:2,pat:1}];
const COLORS = ['#ff9a6b','#7be08a','#a98cff'];
const FOODS = ['🍓','🥕','🍎'];

// Artwork is ink on actual fabric and framed paper. Pets, furniture and care
// toys are meshes, with the same sculpted bodies and materials as the world.
function paintDesign(ctx, design) {
  ctx.clearRect(0,0,256,256);ctx.fillStyle=design?.color || '#ff91b5';ctx.fillRect(0,0,256,256);
  ctx.save();ctx.scale(1.28,1.28);ctx.lineCap='round';ctx.lineJoin='round';
  for(const mark of design?.marks || []) {
    ctx.fillStyle=mark.color || '#fff4df';ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=7;
    ctx.beginPath();
    if(mark.type==='line') {
      for(const [i,p] of (mark.points || []).entries()) i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);
      ctx.stroke();continue;
    }
    ctx.save();ctx.translate(mark.x || 0,mark.y || 0);
    if(mark.type==='star') {
      for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?7:17;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
    } else if(mark.type==='heart') {
      ctx.moveTo(0,5);ctx.bezierCurveTo(-19,-9,-9,-20,0,-10);ctx.bezierCurveTo(9,-20,19,-9,0,5);ctx.fill();
    } else if(mark.type==='flower') {
      for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);ctx.beginPath();ctx.ellipse(0,-7,5,8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.fillStyle='#fff4df';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function createNurseryRoom({G,world}) {
  const scene=litPlayroom(G,'#e9d8f6');scene.name='nursery-room3d';
  const keyLight=scene.children.find(o=>o.isDirectionalLight);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);Object.assign(keyLight.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.2,far:18});keyLight.shadow.bias=-.0003;keyLight.shadow.normalBias=.025;
  const camera=new THREE.PerspectiveCamera(38,1,.1,40);
  const geometryCache=new Map(), materialCache=new Map();
  const localMaterials=new Set(),localTextures=new Set();
  const material=(color,fabric=false)=>{const key=color+(fabric?'fabric':'toy');if(!materialCache.has(key)){const m=fabric?fabricMat(color):toy(color,{r:.55,cc:.25});materialCache.set(key,m);localMaterials.add(m);}return materialCache.get(key);};
  const rounded=(w,h,d,r=.08)=>{const key=[w,h,d,r].join(':');if(!geometryCache.has(key))geometryCache.set(key,new RoundedBoxGeometry(w,h,d,2,r));return geometryCache.get(key);};
  const sphere=new THREE.SphereGeometry(1,20,14);geometryCache.set('sphere',sphere);
  function mesh(geometry,mat,x,y,z,parent=scene){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(x,y,z,w,h,d,color,r=.08,parent=scene,fabric=false)=>mesh(rounded(w,h,d,Math.min(r,w/3,h/3,d/3)),material(color,fabric),x,y,z,parent);
  function ball(x,y,z,r,color,parent=scene){const m=mesh(sphere,material(color),x,y,z,parent);m.scale.setScalar(r);return m;}
  function model(symbol,size,x,y,z,parent=scene){const m=makeToyModel(symbol);m.scale.setScalar(size);m.position.set(x,y,z);parent.add(m);return m;}
  function fabricSurface(){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;localTextures.add(texture);const mat=fabricMat('#ffffff');mat.map=texture;localMaterials.add(mat);let key='';return {mat,texture,update(design){const next=JSON.stringify(design || {});if(next===key)return;key=next;paintDesign(ctx,design);texture.needsUpdate=true;}};}
  const blanketArt=fabricSurface(),outfitArt=fabricSurface();

  // A real open dollhouse room: beveled timber planks, skirting and plaster.
  for(let i=0;i<12;i++)box(-3.85+i*.7,-.1,.05,.685,.18,6.2,i%3===0?'#dba775':i%3===1?'#e5b887':'#eac399',.025);
  const backWall=box(0,1.9,-2.85,8.5,4.1,.2,'#eddbf1',.025);
  box(-4.15,1.9,0,.18,4.1,5.7,'#e2d6f1',.025);
  box(0,.12,-2.7,8.1,.2,.12,'#fff6e8',.025);box(-4,.12,0,.12,.2,5.5,'#fff6e8',.025);
  // Recessed blue window with actual wood mullions and a deep sill.
  box(2.25,2.45,-2.66,2.15,1.9,.16,'#fff5e4',.06);
  box(2.25,2.45,-2.55,1.89,1.64,.06,'#a9ddef',.02);
  box(2.25,2.45,-2.48,.075,1.68,.08,'#fff5e4',.018);box(2.25,2.45,-2.48,1.9,.075,.08,'#fff5e4',.018);
  box(2.25,1.5,-2.4,2.4,.13,.43,'#fff5e4',.035);
  model('☀️',.42,2.8,2.9,-2.49);model('☁️',.56,1.85,2.75,-2.48);
  for(const x of [1.05,3.45])box(x,2.45,-2.38,.3,2.1,.15,'#e9b4cd',.05,scene,true);

  // Child-height shelving and solid toys make the setting belong to the world.
  box(-2.9,.59,-1.9,1.55,1.15,.65,'#c4936c',.06);
  for(const y of [.28,.7])box(-2.9,y,-1.51,1.33,.32,.12,'#f4dbc0',.025);
  for(const x of [-3.1,-2.7])ball(x,.7,-1.41,.045,'#b98de0');
  model('🧸',.58,-2.95,1.48,-1.9);model('🌷',.56,2.3,1.85,-2.28);
  box(2.75,.42,-.95,1.2,.75,.75,'#f6d599',.08);box(2.75,.83,-.95,1.3,.14,.83,'#fff1d6',.05);
  model('📖',.48,2.68,1.1,-.93);
  const rug=mesh(new THREE.CylinderGeometry(1.95,1.95,.045,40),material('#c4b2de',true),0,.025,.75);geometryCache.set('rug',rug.geometry);rug.scale.z=.74;

  // Bed has a timber frame, soft mattress, pillow and a thick draped blanket.
  const bed=new THREE.Group();bed.name='nursery-bed';scene.add(bed);
  box(0,.45,-.9,2.15,.2,2.55,'#c69a76',.08,bed);
  for(const x of [-.92,.92])for(const z of [-1.95,.2])box(x,.22,z,.17,.43,.17,'#ba8d67',.04,bed);
  box(0,.68,-.9,2.02,.3,2.38,'#fff1dd',.13,bed,true);
  box(0,.95,-2.12,2.17,1.05,.16,'#cfa7db',.06,bed);
  for(const x of [-1,1])ball(x,1.53,-2.12,.105,'#f5d781',bed);
  box(0,.93,-1.67,1.18,.19,.61,'#fff8ed',.085,bed,true);
  const blanket=mesh(rounded(1.8,.15,1.55,.07),blanketArt.mat,0,1.34,-.39,bed);blanket.name='nursery-blanket';
  // A turned-down fabric hem adds real depth rather than an illustration.
  const hem=mesh(rounded(1.83,.11,.23,.045),blanketArt.mat,0,1.395,-1.1,bed);
  // Framed creation on the wall uses the very same saved blanket texture.
  box(-.55,2.66,-2.65,1.65,1.22,.14,'#bc8b62',.04);
  const artwork=mesh(new THREE.PlaneGeometry(1.43,1.01),blanketArt.mat,-.55,2.66,-2.565);geometryCache.set('artwork',artwork.geometry);artwork.name='nursery-framed-creation';

  const petStage=new THREE.Group();scene.add(petStage);
  const petCache=new Map();let selected=null,selectedIndex=0,current=null,sleeping=false,eggMode=false,currentPose='feed';
  function getPet(index){if(!petCache.has(index)){const p=buildPet(RECIPES[index],1.9);p.root.name='nursery-pet';p.root.userData.nurseryIndex=index;
    // A full-depth sewn garment wraps the same plush body used in the world.
    const shirt=new THREE.Group();shirt.name='nursery-outfit';
    const shirtGeo=new THREE.CylinderGeometry(.185,.212,.235,24,1,true);geometryCache.set('shirt:'+index,shirtGeo);
    const garment=mesh(shirtGeo,outfitArt.mat,0,.36,.006,shirt);garment.rotation.y=Math.PI;
    for(const x of [-.205,.205]){const sleeve=mesh(rounded(.13,.16,.19,.04),outfitArt.mat,x,.4,.005,shirt);sleeve.rotation.z=x>0?-.35:.35;}
    p.body.add(shirt);p.shirt=shirt;petCache.set(index,p);}return petCache.get(index);}

  // The egg is a native 3D shell; cracks and spots follow its curved front.
  const eggGroup=new THREE.Group();eggGroup.name='nursery-egg';scene.add(eggGroup);eggGroup.position.set(0,.08,.85);
  const eggMat=material(COLORS[0]);const egg=mesh(sphere,eggMat,0,.9,0,eggGroup);egg.scale.set(.63,.86,.56);
  const spots=[];for(const [x,y,r] of [[-.24,1.15,.1],[.24,.72,.12],[-.22,.45,.075]]){const z=.56*Math.sqrt(Math.max(.08,1-(x/.63)**2-((y-.9)/.86)**2));const spot=ball(x,y,z,r,'#fff4df',eggGroup);spot.scale.z=.35;spots.push(spot);}
  const cracks=[];const crackPoints=[[-.01,1.68],[-.16,1.36],[.12,1.13],[-.12,.88],[.13,.65],[-.02,.25]];
  for(let i=0;i<crackPoints.length-1;i++){const points=crackPoints.slice(i,i+2).map(([x,y])=>new THREE.Vector3(x,y,.015+.56*Math.sqrt(Math.max(.01,1-(x/.63)**2-((y-.9)/.86)**2))));const geometry=new THREE.TubeGeometry(new THREE.LineCurve3(...points),1,.014,5,false);geometryCache.set('crack:'+i,geometry);const c=mesh(geometry,material('#8b638e'),0,0,0,eggGroup);c.visible=false;cracks.push(c);}
  const eggNest=model('🪺',1.65,0,.12,.85);

  // Reusable care props. Each pose has real objects with independent transforms.
  const props=new Map();for(const id of ['feed','bath','brush','play','sleep']){const group=new THREE.Group();group.name='nursery-care:'+id;scene.add(group);props.set(id,group);}
  const foods=FOODS.map((food,i)=>{const m=model(food,.55,.85,.92,1.22,props.get('feed'));m.name='nursery-food:'+food;return m;});
  model('bowl',.67,.95,.25,1.12,props.get('feed'));
  const tub=props.get('bath');
  box(0,.27,1.0,2.15,.4,1.12,'#94cee5',.16,tub);
  box(0,.49,1.0,2.0,.08,.95,'#c5ecf3',.035,tub);
  for(const x of [-1.04,1.04])box(x,.56,1.0,.16,.42,1.13,'#fff2e7',.06,tub);
  for(const z of [.46,1.54])box(0,.56,z,2.15,.4,.14,'#fff2e7',.06,tub);
  const sponge=model('🧽',.47,.84,1.12,1.18,tub);model('🧼',.38,1.45,.24,1.05,tub);
  const bubbles=[];for(let i=0;i<6;i++){const b=model('🫧',.14+(i%3)*.055,(i%3-1)*.49,.8+Math.floor(i/3)*.5,1.35,tub);b.userData.baseY=b.position.y;bubbles.push(b);}
  const brush=model('brush',.65,.78,1.28,1.1,props.get('brush'));brush.rotation.z=-.5;
  const playBall=model('⚽',.58,.85,.42,1.3,props.get('play'));
  model('🌙',.5,1.55,1.85,-1.4,props.get('sleep'));
  for(const group of props.values())group.visible=false;
  const reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  const heldRay=new THREE.Raycaster(),heldNdc=new THREE.Vector2(),heldPoint=new THREE.Vector3(),heldPlane=new THREE.Plane(new THREE.Vector3(0,0,1),-1.25);
  const heldBases=new Map([...foods,sponge,brush,playBall].map(o=>[o,o.position.clone()]));
  let held=null,selectedFood=FOODS[0];
  const heldObject=()=>currentPose==='feed'?foods[FOODS.indexOf(selectedFood)]:currentPose==='bath'?sponge:currentPose==='brush'?brush:currentPose==='play'?playBall:null;
  function applyHeld(){const obj=heldObject();if(!held||!obj)return;camera.updateMatrixWorld();heldNdc.set(held.x*2-1,1-held.y*2);heldRay.setFromCamera(heldNdc,camera);if(heldRay.ray.intersectPlane(heldPlane,heldPoint)){obj.parent.worldToLocal(heldPoint);obj.position.copy(heldPoint);}}
  function hold(point){held=point;if(!point){for(const [obj,base]of heldBases)obj.position.copy(base);}else applyHeld();}
  let disposed=false,lastAspect=0;
  function show({index=0,pet,pose='feed',design=null,kind='blanket',food=FOODS[index]}){
    if(disposed||!pet)return;
    selectedIndex=Math.max(0,Math.min(2,index|0));current=pet;currentPose=pose;selectedFood=FOODS.includes(food)?food:FOODS[selectedIndex];hold(null);
    sleeping=!!pet.hatched&&(design?kind==='blanket':!!pet.asleep);eggMode=!pet.hatched;
    backWall.material=material(pet.room || '#eddbf1');
    blanketArt.update(design&&kind==='blanket'?design:pet.blanket);
    outfitArt.update(design&&kind==='outfit'?design:pet.outfit);
    const next=eggMode?null:getPet(selectedIndex);if(selected!==next){selected?.root.removeFromParent();selected=next;if(selected)petStage.add(selected.root);}
    if(selected){selected.shirt.visible=!sleeping&&pose!=='bath';selected.root.rotation.set(sleeping?-Math.PI/2:0,0,0);selected.root.position.set(0,sleeping?1.08:pose==='bath'?.28:.06,sleeping?-.28:1.0);}
    eggGroup.visible=eggMode;eggNest.visible=eggMode;egg.material=material(COLORS[selectedIndex]);
    cracks.forEach((c,i)=>{c.visible=eggMode&&(pet.taps>1||pet.taps===1&&i<3);});
    blanket.visible=hem.visible=sleeping;for(const [id,group] of props)group.visible=!eggMode&&(sleeping?id==='sleep':id===pose&&pose!=='sleep');
    foods.forEach((food,i)=>{food.visible=FOODS[i]===selectedFood;});
    update(0,0);
  }
  function update(dt,t){
    if(disposed)return;
    if(lastAspect!==camera.aspect){lastAspect=camera.aspect;const distance=Math.max(6.5,4.1/Math.max(.35,camera.aspect));camera.position.set(distance*.1,1.25+distance*.32,distance);camera.lookAt(0,1.15,-.1);camera.updateProjectionMatrix();}
    const quiet=!!world.comfort?.calm||!!world.comfort?.reducedMotion||!!reducedMotion?.matches;
    const time=quiet?0:t;
    if(selected){selected.tick(quiet?0:dt,time,false);if(sleeping){selected.root.position.y=1.08+(quiet?0:Math.sin(t*1.8)*.012);selected.B.head.traverse(o=>{if(o.userData.upper&&o.userData.lower)setLids(o,0,0);});selected.B.head.rotation.y=0;selected.B.head.rotation.x=.2;}else{selected.root.position.y=(currentPose==='bath'?.28:.06)+(quiet?0:Math.sin(t*2.1)*.018);if(!quiet&&currentPose==='play'){selected.B.armL.rotation.z=-.35+Math.sin(t*3)*.15;selected.B.armR.rotation.z=.35-Math.sin(t*3)*.15;}}}
    eggGroup.rotation.z=eggMode&&current?.taps&&!quiet?Math.sin(t*4)*.045*current.taps:0;
    playBall.position.y=.42+(quiet?0:Math.abs(Math.sin(t*2.4))*.55);playBall.rotation.y=time*.7;
    sponge.position.y=1.12+(quiet?0:Math.sin(t*2.2)*.12);sponge.rotation.z=quiet?0:Math.sin(t*1.5)*.3;
    brush.rotation.z=-.5+(quiet?0:Math.sin(t*3)*.18);
    for(const [i,b] of bubbles.entries())b.position.y=b.userData.baseY+(quiet?0:Math.sin(t*1.5+i)*.13);
    applyHeld();
  }
  update(0,0);
  return {scene,camera,show,hold,update,get pet(){return selected;},dispose(){if(disposed)return;disposed=true;scene.clear();for(const g of geometryCache.values())g.dispose();for(const m of localMaterials)m.dispose();for(const texture of localTextures)texture.dispose();petCache.clear();}};
}
