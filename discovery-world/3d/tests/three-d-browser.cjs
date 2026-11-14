const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('path');
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.resolve('index.html')+'?test');await p.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:240000});await p.locator('#playBtn').tap();
 const semantics=[];const acts=await p.evaluate(()=>__DDW3.G.learning.activities.map(a=>({id:a.id,tier:a.tiers[0]})));
 for(const a of acts){
  await p.evaluate(a=>{const D=__DDW3;D.world.learnTier=a.tier;D.world.learn[a.id]={level:1,stars:0,d1:2,d2:2,d3:2};D.G.learning.run(D.G.learning.activities.find(x=>x.id===a.id));},a);
  await p.evaluate(()=>new Promise(resolve=>{let n=0;function f(){if(++n===4)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);}));
  const r=await p.evaluate(()=>{const G=__DDW3.G;let meshes=0,sprites=0,fallback=[];G.playroom.scene.traverse(o=>{if(o.isMesh)meshes++;if(o.isSprite)sprites++;if(o.userData.toyKind==='fallback')fallback.push(o.userData.toySymbol);});return{meshes,sprites,fallback,canvas:!!document.querySelector('#learn #game'),targets:document.querySelectorAll('#learn .lstage [data-lmodel]').length};});
  assert.ok(r.meshes>0,a.id+' has actual 3D meshes');assert.equal(r.sprites,0,a.id+' has no picture sprites');assert.ok(r.canvas,a.id+' reuses world renderer');assert.ok(r.targets>0,a.id+' has modelled targets');if(r.fallback.length)semantics.push([a.id,r.fallback]);
  if(['count','shapes','feelings','puzzle','float'].includes(a.id))await p.screenshot({path:'screenshots/3d-learning-'+a.id+'.jpg',timeout:240000});
  await p.locator('#learn .lx').tap();assert.equal(await p.evaluate(()=>__DDW3.G.playroom.active()),false);assert.equal(await p.locator('body>#game').count(),1);
  console.log((r.fallback.length?'REVIEW':'PASS')+' 3D learning '+a.id+' ('+r.meshes+' mesh batches)');
 }
 // Removed/hidden targets cannot participate in the real scene raycast.
 const filtered=await p.evaluate(()=>{const D=__DDW3,mesh=new D.THREE.Mesh(new D.THREE.SphereGeometry(1),new D.THREE.MeshBasicMaterial());mesh.name='hidden-regression-target';mesh.position.set(D.player.x,1,4);mesh.userData.tap=()=>{};D.G.scene.add(mesh);D.G.taps.push(mesh);mesh.updateMatrixWorld(true);const pt=D.toScreen(mesh.position.x,mesh.position.y,mesh.position.z);const has=()=>D.pick(pt.x,pt.y).some(h=>h[4]==='hidden-regression-target');const visible=has();mesh.visible=false;const hidden=has();mesh.visible=true;mesh.removeFromParent();const detached=has();D.G.taps.splice(D.G.taps.indexOf(mesh),1);mesh.geometry.dispose();mesh.material.dispose();return{visible,hidden,detached};});
 assert.deepEqual(filtered,{visible:true,hidden:false,detached:false},'actual raycast respects hidden and detached targets');
 assert.deepEqual(semantics,[],'every learning model has correct semantics');assert.deepEqual(errors,[]);console.log('PASS all 41 native 3D learning activities and renderer restoration');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
