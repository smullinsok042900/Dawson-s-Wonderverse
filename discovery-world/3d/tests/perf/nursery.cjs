// Measure complete render callbacks, including BOTH shadow phases. The older
// snapshot harness can sample a shadow frame in one build and a plain frame in
// the other. Instrumentation lives here, never in the shipped game.
const {chromium}=require('playwright');const path=require('path');
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const file of process.argv.slice(2)){
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
   let seed=123456;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
   window.__sample=null;window.__longTasks=[];
   new PerformanceObserver(l=>{if(__sample)for(const e of l.getEntries())__longTasks.push(e.duration);}).observe({type:'longtask',buffered:false});
   const raf=window.requestAnimationFrame.bind(window);
   window.requestAnimationFrame=fn=>raf(t=>{const renderer=window.__DDW3?.renderer,before=renderer?.info.render.frame,start=performance.now();fn(t);const ms=performance.now()-start;if(__sample&&renderer&&before!==renderer.info.render.frame)__sample.push({ms,calls:renderer.info.render.calls,tris:renderer.info.render.triangles,progs:renderer.info.programs.length});});
  });
  const started=Date.now();await p.goto('file://'+path.resolve(file)+'?hq');await p.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:600000});const loadMs=Date.now()-started;await p.locator('#playBtn').tap();
  const out={file,loadMs,views:{}};
  for(const[name,x]of [['park',150],['creatures',238],['castle',398],['home',1012],['woods',-220],['farm',-480],['pier',-580],['toyTown',600]]){
   await p.evaluate(x=>{__DDW3.teleport(x);if(x<0||x>428&&x<1000)__DDW3.G.expansion.buildNow(x);__DDW3.keys.left=__DDW3.keys.right=false;},x);
   const r=await p.evaluate(()=>new Promise(resolve=>{let warm=0;function poll(){if(++warm===9){__sample=[];__longTasks=[];}if(__sample?.length>=16){const frames=__sample;__sample=null;resolve({frames,longTasks:__longTasks});return;}requestAnimationFrame(poll);}requestAnimationFrame(poll);}));
   const frames=r.frames;out.views[name]={meanWorkMs:+(frames.reduce((n,f)=>n+f.ms,0)/frames.length).toFixed(2),maxWorkMs:+Math.max(...frames.map(f=>f.ms)).toFixed(2),calls:[...new Set(frames.map(f=>f.calls))].sort((a,b)=>a-b),triangles:[Math.min(...frames.map(f=>f.tris)),Math.max(...frames.map(f=>f.tris))],programs:[...new Set(frames.map(f=>f.progs))],longTasks:r.longTasks.map(Math.round),samples:frames};
  }
  if(await p.evaluate(()=>!!__DDW3.G.nursery)){
   await p.evaluate(()=>__DDW3.G.nursery.open());const start=await p.evaluate(()=>__DDW3.player.x);await p.waitForTimeout(1000);out.nurseryPausesWorld=start===await p.evaluate(()=>__DDW3.player.x)&&await p.evaluate(()=>__DDW3.G.playroom.scene!==__DDW3.G.scene);await p.evaluate(()=>__DDW3.G.nursery.close());
  }
  out.errors=errors;console.log(JSON.stringify(out));await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
