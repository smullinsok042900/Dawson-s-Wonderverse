// Fixed views, plus reward activation: desktop software rendering only.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const file of process.argv.slice(2)){
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(p);await cdp.send('Performance.enable');
  await p.addInitScript(()=>{let seed=123456;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};});
  await p.goto('file://'+path.resolve(file)+'?hq');await p.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:600000});await p.locator('#playBtn').tap();
  const results={file,seed:123456,views:{}};
  for(const [name,x]of [['park',150],['creatures',238],['castle',398],['home',1012]]){
   await p.evaluate(x=>{__DDW3.teleport(x);__DDW3.keys.left=__DDW3.keys.right=false;},x);
   await p.evaluate(()=>new Promise(resolve=>{let n=0;function f(){if(++n===4)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);}));
   const before=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='ScriptDuration').value;
   await p.evaluate(()=>new Promise(resolve=>{let n=0;function f(){if(++n===8)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);}));
   const after=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='ScriptDuration').value;
   results.views[name]=await p.evaluate(ms=>({scriptMsPerFrame:+(ms/8).toFixed(2),...__DDW3.info()}),(after-before)*1000);
  }
  if(await p.evaluate(()=>!!__DDW3.G.adventures)){
   const before=await p.evaluate(()=>__DDW3.info().progs);
   await p.evaluate(()=>{for(const id of ['walk','fluff_found','fluff_home','visit_woods','learn_count','furnish','learn_colors','learn_plant','learn_pattern','seed_planted','carrot_harvest','feed_friend','woods_listen','woods_found','snow_rolled','snow_built','learn_float','learn_magnet','art_saved','gallery_visit','tide_found','fish_caught','beach_clue','treasure_dug'])__DDW3.G.adventures.event({type:'activity',id});});
   for(const color of ['pink','blue','green']){await p.evaluate(color=>{__DDW3.world.adventures.cushion=color;__DDW3.G.refreshAdventureWorld();},color);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
   results.earnedHome={programsBefore:before,...await p.evaluate(()=>__DDW3.info())};
   await p.screenshot({path:'screenshots/adventures-home-world.jpg',timeout:240000});
   await p.evaluate(()=>__DDW3.teleport(150));await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));results.farHomeDetached=await p.evaluate(()=>!__DDW3.G.scene.getObjectByName('adventure-home'));
  }
  results.errors=errors;console.log(JSON.stringify(results,null,2));await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
