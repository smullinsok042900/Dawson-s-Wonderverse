import * as THREE from 'three';

// A single WebGL context serves the world AND its playrooms. Moving the canvas
// avoids second-context memory, texture readbacks and a flat screenshot facade.
export function createPlayroomViewport({renderer,G}){
 const canvas=renderer.domElement;
 let current=null,raf=0,observer=null,saved=null,last=0,time=0;
 const style=document.createElement('style');style.textContent='#game.playroom-canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:0;pointer-events:none!important}.playroom-host{position:relative;overflow:hidden;isolation:isolate}';document.head.appendChild(style);
 function unmount(){
  if(!current)return;cancelAnimationFrame(raf);observer?.disconnect();observer=null;
  const restore=saved;current=null;saved=null;
  canvas.classList.remove('playroom-canvas');
  if(restore.next?.parentNode===restore.parent)restore.parent.insertBefore(canvas,restore.next);else restore.parent.appendChild(canvas);
  renderer.setPixelRatio(restore.ratio);renderer.setSize(restore.size.x,restore.size.y,false);renderer.setViewport(restore.viewport);renderer.setScissorTest(false);
  renderer.shadowMap.enabled=restore.shadows;renderer.shadowMap.autoUpdate=restore.autoShadows;renderer.shadowMap.needsUpdate=true;
 }
 function mount(host,options){
  unmount();saved={parent:canvas.parentNode,next:canvas.nextSibling,size:renderer.getSize(new THREE.Vector2()),ratio:renderer.getPixelRatio(),viewport:renderer.getViewport(new THREE.Vector4()),shadows:renderer.shadowMap.enabled,autoShadows:renderer.shadowMap.autoUpdate};
  current={host,...options};host.classList.add('playroom-host');canvas.classList.add('playroom-canvas');host.prepend(canvas);last=0;time=0;
  function resize(){if(!current)return;const r=host.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));renderer.setPixelRatio(Math.min(saved.ratio,1.5));renderer.setSize(w,h,false);renderer.setViewport(0,0,w,h);renderer.setScissorTest(false);if(options.camera.isPerspectiveCamera){options.camera.aspect=w/h;options.camera.updateProjectionMatrix();}options.resize?.(w,h);renderer.shadowMap.needsUpdate=true;}
  observer=new ResizeObserver(resize);observer.observe(host);resize();renderer.shadowMap.autoUpdate=false;
  let frame=0;
  function draw(now){if(!current)return;const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;time+=dt;if(canvas.parentNode!==host)host.prepend(canvas);options.update?.(dt,time);renderer.shadowMap.needsUpdate=(frame++%4===0);renderer.info.reset();renderer.render(options.scene,options.camera);raf=requestAnimationFrame(draw);}
  raf=requestAnimationFrame(draw);
 }
 return {mount,unmount,active:()=>!!current,get scene(){return current?.scene;},get camera(){return current?.camera;}};
}
export function litPlayroom(G,background='#e9d8f6'){
 const s=new THREE.Scene();s.background=new THREE.Color(background);s.environment=G.scene.environment;s.environmentIntensity=G.scene.environmentIntensity;
 s.add(new THREE.HemisphereLight('#e4ecff','#8f8a6a',.7));
 const sun=new THREE.DirectionalLight('#fff0d8',2.85);sun.position.set(-3,6,5);s.add(sun);
 const rim=new THREE.DirectionalLight('#d6e4ff',.55);rim.position.set(4,3,-3);s.add(rim);
 return s;
}
