import * as THREE from 'three';
import { litPlayroom } from './playroom3d.js';
import { makeToyModel } from './toy-models.js';

// The old DOM remains the interaction contract, including demonstration drags.
// Artwork is replaced by solid native meshes in the game's existing renderer.
export function initLearning3D(G, root, stage) {
  const host = document.createElement('div'); host.className = 'learning-viewport'; root.prepend(host);
  const style = document.createElement('style'); style.textContent = `
#learn{background:#edf4fa!important;isolation:isolate}
#learn .learning-viewport{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;position:absolute!important}
#learn .learning-viewport canvas{position:absolute;inset:0;width:100%;height:100%}
#learn .lstage{background:transparent}#learn>.lbar,#learn>.lstage,#learn>.ldots{z-index:1}
#learn [data-lmodel]{opacity:0!important}
#learn .lopt,#learn .lthing,#learn .lpiece,#learn .lhole,#learn .lslot,#learn .lcar,#learn .lcard,#learn .lpad,#learn .ltank,#learn .lwater,#learn .lbowl,#learn .lmixc,#learn .lframe{background:transparent!important;border-color:transparent!important;box-shadow:none!important}
#learn .lletter,#learn .lnum,#learn .lcar,#learn .lslot,#learn .lcard span,#learn .ldropit,#learn .lpull{color:transparent!important;-webkit-text-stroke:0!important}
#learn .lcards{grid-template-columns:repeat(4,minmax(0,1fr));width:min(95%,560px);gap:8px}
#learn .lcards .lcard{min-width:0;width:100%;height:clamp(48px,15vw,88px)}
#learn .lcards.c12,#learn .lcards.c14,#learn .lcards.c16{grid-template-columns:repeat(4,minmax(0,1fr))}
#learn .lholes{gap:8px;max-width:98%;flex-wrap:wrap}
#learn .lopts{gap:10px;max-width:98%}
#learn .lopt{min-width:min(24vw,110px);min-height:84px;padding:4px}
#learn .lopts.wide .lopt{min-width:min(39vw,240px)}
#learn .lcause{width:96%;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#learn .lcause .lopt{min-width:0}
#learn .lpads.p3{grid-template-columns:repeat(3,minmax(0,1fr));width:95%}
#learn .ldropg.feed{gap:10px}#learn .ldropg.feed .lpieces{max-height:none;flex-direction:row}
#learn .lpattern{gap:2px;max-width:98%}#learn .lpattern svg{max-width:10vw}
#learn .ltrain{gap:2px;font-size:32px}#learn .lcar{width:min(16vw,70px)}
#learn .lpieces{gap:8px}#learn .lpiece{min-width:60px;min-height:60px}
#learn .lslots{gap:6px}#learn .lslot{min-width:min(18vw,70px)}
`; document.head.append(style);
  const scene = litPlayroom(G, 0xedf4fa);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 3000); camera.position.set(0,0,1000);
  const objects = new Map(); let mounted = false, dirty = true, width = 1, height = 1;
  const observer = new MutationObserver(() => { dirty = true; });
  observer.observe(stage, { childList:true, subtree:true, attributes:true, characterData:true });
  const assign = (el, symbol, color) => { if (!el.dataset.lmodel) { el.dataset.lmodel = symbol; if(color) el.dataset.lcolor=color; } };
  function describe() {
    // Text glyphs are physical blocks; emoji changes in cause/effect are live.
    stage.querySelectorAll('.le').forEach(el => { if (el.dataset.lmodel !== el.textContent) el.dataset.lmodel = el.textContent; });
    stage.querySelectorAll('.lletter,.lnum,.lcar,.lslot,.ldropit,.lpull').forEach(el => {
      if(el.querySelector('[data-lmodel]')) return;
      const text = el.textContent.trim(); if(text) { if(el.dataset.lmodel!==text) el.dataset.lmodel=text; }
      else if(el.matches('.lslot')) assign(el,'socket');
    });
    stage.querySelectorAll('.lcard').forEach(el => { const symbol = el.classList.contains('up') ? el.dataset.f : 'card'; if(el.dataset.lmodel!==symbol)el.dataset.lmodel=symbol; });
    stage.querySelectorAll('.lpad').forEach(el => assign(el,'ball',el.style.background));
    stage.querySelectorAll('.ldotsn i').forEach(el => assign(el,'dot','#ffc94d'));
    stage.querySelectorAll('.ltank').forEach(el => assign(el,'tank'));
    stage.querySelectorAll('.lmixc').forEach(el => { assign(el,'bowl'); const c=el.style.background; if(c&&el.dataset.lcolor!==c)el.dataset.lcolor=c; });
    stage.querySelectorAll('.lpot').forEach(el => { if(!el.querySelector('[data-lmodel]'))assign(el,'pot'); });
    // Each picture puzzle piece is a miniature sculptural relief, clipped by
    // its original puzzle coordinates rather than an SVG texture on a plane.
    stage.querySelectorAll('.ldropg.puzzle svg').forEach(el => { assign(el,'puzzle'); const picture=el.innerHTML.includes('polygon')?'house':el.innerHTML.includes('M50 13')?'critter':'flower'; if(el.dataset.lpicture!==picture)el.dataset.lpicture=picture; });
  }
  function construct(el) {
    let symbol = el.dataset.lmodel;
    const group = new THREE.Group();
    if(symbol==='puzzle') {
      const vb=el.getAttribute('viewBox').split(/\s+/).map(Number), [x,y,w,h]=vb;
      const subject=makeToyModel(el.dataset.lpicture==='house'?'🏠':el.dataset.lpicture==='critter'?'critter':'🌷');
      // A solid base and clipped volumetric subject make each piece physical.
      const base=makeToyModel('square',{color:'#bee4f7'}); base.scale.set(1,1,.12); group.add(base);
      subject.scale.set(200/w,200/h,.6); subject.position.set((100-x-w/2)/w, -(100-y-h/2)/h,.12);
      subject.updateMatrixWorld(true);
      const relief = new THREE.Group();
      subject.traverse(o => { if(!o.isMesh)return;
        const geom=o.geometry.index?o.geometry.toNonIndexed():o.geometry;
        const attr=geom.getAttribute('position'), out=[];
        const bounds=[[0,1,-.5],[0,-1,-.5],[1,1,-.5],[1,-1,-.5]];
        for(let i=0;i<attr.count;i+=3){
          let poly=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(attr,i+j).applyMatrix4(o.matrixWorld));
          for(const [axis,sign,edge] of bounds){const next=[];
            for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],da=(axis?a.y:a.x)*sign-edge,db=(axis?b.y:b.x)*sign-edge;
              if(da>=0)next.push(a);if((da>=0)!==(db>=0))next.push(a.clone().lerp(b,da/(da-db)));}
            poly=next;if(!poly.length)break;
          }
          for(let j=1;j+1<poly.length;j++)for(const v of [poly[0],poly[j],poly[j+1]])out.push(v.x,v.y,v.z);
        }
        if(out.length){const cropped=new THREE.BufferGeometry();cropped.setAttribute('position',new THREE.Float32BufferAttribute(out,3));cropped.computeVertexNormals();const mesh=new THREE.Mesh(cropped,o.material);mesh.userData.learningOwnedGeometry=true;relief.add(mesh);}
        if(geom!==o.geometry)geom.dispose();
      });group.add(relief);
    } else group.add(makeToyModel(symbol,{ color:el.dataset.lcolor || undefined }));
    return group;
  }
  const release = model => { scene.remove(model);model.traverse(o=>{if(o.userData.learningOwnedGeometry)o.geometry.dispose();}); };
  function sync() {
    if(dirty) { describe(); dirty=false; }
    const nodes = new Set(stage.querySelectorAll('[data-lmodel]'));
    for(const [el,entry] of objects)if(!nodes.has(el)){release(entry.model);objects.delete(el);}
    const rr=root.getBoundingClientRect();
    for(const el of nodes){
      const signature=el.dataset.lmodel+'|'+el.dataset.lcolor+'|'+el.dataset.lpicture;
      let entry=objects.get(el);
      if(!entry||entry.signature!==signature){if(entry)release(entry.model);const model=construct(el);entry={model,signature};objects.set(el,entry);scene.add(model);}
      const r=el.getBoundingClientRect(); const hidden=el.closest('.eaten,.popped')||!r.width||!r.height;
      const card=el.closest('.lcard'); entry.model.visible=!hidden&&(!card||el===card);
      if(!entry.model.visible)continue;
      const parent=el.closest('.lpiece,.lopt,.lpad,.lthing,.lcard,.lcup');
      const shrink=el.closest('.lfaint') ? .9 : 1;
      const s=Math.min(r.width,r.height)*shrink;
      entry.model.position.set(r.left-rr.left+r.width/2-width/2,height/2-(r.top-rr.top+r.height/2), el.closest('.lpiece')?60:el.matches('.ltank')?-100:10);
      entry.model.scale.set(s,s,s*.65); entry.model.rotation.set(.10,-.14,0);
      if(parent?.classList.contains('lit'))entry.model.scale.multiplyScalar(1.12);
      if(parent?.classList.contains('boing'))entry.model.position.z+=8*Math.sin(performance.now()*.02);
    }
  }
  function resize(w,h){width=w;height=h;camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();dirty=true;}
  return {mount(){if(mounted||!G?.playroom)return;mounted=true;G.playroom.mount(host,{scene,camera,resize,update(){sync();}});dirty=true;},close(){if(!mounted)return;mounted=false;G.playroom.unmount();for(const {model} of objects.values())release(model);objects.clear();}};
}
