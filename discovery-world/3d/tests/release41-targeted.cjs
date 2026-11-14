// Fast verification of the corrected real-touch stair checks and the changed
// HUD at eleven viewport sizes. This is NOT eleven device-identity emulations.
const {chromium,devices}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const cdp=await ctx.newCDPSession(p);
 await p.goto('file://'+path.resolve('index.html')+'?test');await p.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:240000});await p.locator('#playBtn').tap();
 const frames=n=>p.evaluate(n=>new Promise(resolve=>{let i=0;function f(){if(++i>=n)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);}),n);
 const state=()=>p.evaluate(()=>({stair:__DDW3.player.stair?.k??null,y:__DDW3.player.y,grounded:__DDW3.player.grounded}));
 async function holdUntil(sel,condition){const r=await p.locator(sel).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});try{await p.waitForFunction(condition,null,{polling:'raf',timeout:20000});}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}}
 await p.evaluate(()=>__DDW3.teleport(1022.6));await frames(4);await p.locator('#pawBtn').tap();assert.equal((await state()).stair,0);
 await holdUntil('#rightBtn',()=>__DDW3.player.stair?.k>.35);let s=await state();assert.ok(s.stair>.2&&s.stair<.95);const mid=s.stair;await frames(3);assert.equal((await state()).stair,mid,'release stops halfway');
 await holdUntil('#rightBtn',()=>!__DDW3.player.stair&&Math.abs(__DDW3.player.y-4.4)<.01);const upstairs=await state();assert.equal(upstairs.stair,null);assert.ok(Math.abs(upstairs.y-4.4)<.01);console.log('PASS real-touch upstairs floor check (same null-stair and y=4.4 requirement)');
 await p.evaluate(()=>__DDW3.teleport(1028.2,4.4));await frames(4);await p.waitForFunction(()=>__DDW3.player.grounded);await p.locator('#pawBtn').tap();await holdUntil('#leftBtn',()=>!__DDW3.player.stair&&__DDW3.player.y===0);const downstairs=await state();assert.equal(downstairs.stair,null);assert.equal(downstairs.y,0);console.log('PASS real-touch partial stop and downstairs checks');
 const layouts=[];const sizes=[['small iPhone',568,320],['typical iPhone',844,390],['large iPhone',932,430],['iPad',1024,768],['iPad Pro',1194,834],['Pixel',851,393],['Galaxy phone',740,360],['Galaxy tablet',1280,800],['small Android',640,360],['SE 2022',667,375],['extra wide',960,412]];
 await p.evaluate(()=>__DDW3.teleport(150));
 for(const[name,width,height]of sizes){await p.setViewportSize({width,height});await frames(3);const r=await p.evaluate(()=>{
  const canvas=document.querySelector('#game'),cr=canvas.getBoundingClientRect();const btn=[...document.querySelectorAll('#brand,#upperLeft .pill,#upperRight>*,#leftBtn,#rightBtn,#upBtn,#downBtn,#jumpBtn,#pawBtn')].map(e=>{const r=e.getBoundingClientRect();return{id:e.id||e.className,x:r.left,y:r.top,w:r.width,h:r.height};}).filter(r=>r.w&&r.h);
  const problems=[];for(const b of btn){if(b.x < -1||b.y < -1||b.x+b.w>innerWidth+1||b.y+b.h>innerHeight+1)problems.push(b.id+' offscreen');if(!/creatureChoice|chooser|brand/.test(b.id)&&Math.min(b.w,b.h)<44)problems.push(b.id+' too small');}
  for(let i=0;i<btn.length;i++)for(let j=i+1;j<btn.length;j++){const a=btn[i],b=btn[j];if(/chooser/.test(a.id)||/chooser/.test(b.id))continue;if(/^(left|right|up|down)Btn$/.test(a.id)&&/^(left|right|up|down)Btn$/.test(b.id))continue;const dx=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),dy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(dx>2&&dy>2)problems.push(a.id+' overlaps '+b.id);}
  return{problems,buttons:btn.length,canvasFits:Math.abs(cr.width-innerWidth)<1&&Math.abs(cr.height-innerHeight)<1,aspectFits:Math.abs(canvas.width/canvas.height-cr.width/cr.height)<.03};
 });assert.deepEqual(r.problems,[],name);assert.ok(r.canvasFits&&r.aspectFits,name+' canvas fits without stretching');layouts.push({name,width,height,...r});console.log('PASS viewport '+name+' '+width+'x'+height);}
 assert.deepEqual(errors,[]);fs.writeFileSync('tests/BUILD41_TARGETED_RESULTS.json',JSON.stringify({environment:'desktop Chromium touch viewport resizing; NOT physical devices or separate device identities',stairs:{partway:mid,upstairs,downstairs,passed:true},layouts,errors},null,2));await browser.close();console.log('PASS targeted stair regression and 11 viewport layouts');
})().catch(e=>{console.error(e);process.exit(1);});
