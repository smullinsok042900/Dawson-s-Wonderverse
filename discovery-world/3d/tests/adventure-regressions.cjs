const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('path');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await b.newContext({viewport:{width:640,height:360},hasTouch:true,isMobile:true});const p=await context.newPage();const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 await p.addInitScript(()=>localStorage.setItem('dawsons-discovery-world-3d-v1',JSON.stringify({v:1,fluffs:Array(6).fill('home'),crown:true,wand:true,adventures:{introSeen:true,active:'science',events:['woods_listen']},comfort:{calm:true}})));
 await p.goto('file://'+path.resolve('index.html')+'?test');await p.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:240000});await p.locator('#playBtn').click();
 assert.equal(await p.evaluate(()=>{const fn=__DDW3.G.interact.find(i=>i.action==='Open home gallery').run;return __DDW3.G.taps.some(o=>o.userData.tap===fn);}),false,'detached home gallery cannot intercept outdoor taps');
 assert.ok(await p.locator('#adventureObjective').isVisible(),'saved guide resumes');
 await p.locator('#adventureBtn').click();await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>__DDW3.keys.down===true),false);
 await p.locator('[data-quest="rescue"]').click();await p.getByRole('button',{name:'Play this adventure again',exact:true}).click();
 for(const name of ['We walked through Wonderverse!','We found a little friend!','We brought the Fluffkin home!'])await p.getByRole('button',{name,exact:true}).click();
 assert.equal(await p.evaluate(()=>__DDW3.world.adventures.replay),null);assert.equal(await p.evaluate(()=>__DDW3.fluffs.every(f=>f.state==='home')),true);assert.equal(await p.evaluate(()=>__DDW3.world.adventures.rewards.filter(r=>r==='nest').length),1);
 await p.locator('#adventureClose').click();
 await p.evaluate(()=>{__DDW3.teleport(80);__DDW3.G.adventures.event({type:'activity',id:'art_saved'});__DDW3.G.adventures.start('art');});await p.locator('#objectivePicture').click();
 assert.ok(await p.evaluate(()=>__DDW3.world.adventures.events.includes('gallery_visit')),'home guidance completes visit');await p.locator('#adventureClose').click();
 const run=async id=>{await p.evaluate(id=>{const L=__DDW3.G.learning;__DDW3.world.learn[id]={level:1,stars:0,d1:2};L.run(L.activities.find(a=>a.id===id));},id);};
 await run('bubbles');await p.waitForSelector('#learn .lbub');
 assert.ok(await p.locator('#learn .lbub').first().evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'calm bubbles are onscreen');await p.locator('#learn .lbub').first().dispatchEvent('pointerdown');assert.ok(await p.locator('#learn .lbub.popped').count());await p.evaluate(()=>__DDW3.G.learning.close());
 await run('float');await p.locator('#learn .lopt[data-i="0"]').dispatchEvent('pointerdown');assert.equal(await p.locator('#learn .ldropit').evaluate(el=>getComputedStyle(el).top==='-60px'),false);await p.evaluate(()=>__DDW3.G.learning.close());
 await run('magnet');await p.locator('#learn .lopt[data-i="0"]').dispatchEvent('pointerdown');assert.equal(await p.locator('#learn .lpull').evaluate(el=>getComputedStyle(el).left),'70px');await p.evaluate(()=>__DDW3.G.learning.close());
 await p.evaluate(()=>{__DDW3.G.comfort.apply({...__DDW3.world.comfort,music:false,effects:true});window.__channels=[];window.__musicChannels=[];const S=__DDW3.Sound;window.__origTone=S.tone;S.tone=function(){__channels.push(this.channelEnabled());__musicChannels.push(this._musicChannel);};});
 await run('band');await p.locator('#learn .linst').first().dispatchEvent('pointerdown');assert.equal(await p.evaluate(()=>__channels[0]),false);await p.evaluate(()=>__DDW3.G.learning.close());
 for(const id of ['hedgehog','frog','penguin','musicbox','cake']){
  const channels=await p.evaluate(id=>{__channels.length=0;__musicChannels.length=0;const it=__DDW3.G.interact.find(i=>i.disc===id);if(!it)throw new Error('Missing musical toy '+id);it.run();return __channels.filter((v,i)=>__musicChannels[i]);},id);
  assert.ok(channels.length>0,'music scheduled for '+id);assert.ok(channels.every(v=>!v),'music toggle gates '+id);
 }
 await p.evaluate(()=>{__DDW3.Sound.tone=__origTone;});
 await p.evaluate(()=>{__DDW3.teleport(-201);__DDW3.G.expansion.buildNow(-201);});await p.waitForFunction(()=>!!__DDW3.G.interact.find(i=>i.disc==='woods_found'),null,{timeout:60000});await p.evaluate(()=>__DDW3.G.doAction());assert.ok(await p.evaluate(()=>__DDW3.world.adventures.events.includes('woods_found')),'saved owl listening survives reload');
 await p.evaluate(()=>{__DDW3.G.adventures.event({type:'learn',id:'pattern'});__DDW3.teleport(1012);__DDW3.G.updateAdventureWorld();});
 const before=await p.evaluate(()=>{__DDW3.G.comfort.apply({...__DDW3.world.comfort,calm:false});__DDW3.G.updateAdventureWorld();return __DDW3.G.scene.getObjectByName('adventure-home').children[4].position.x;});
 await p.waitForFunction(x=>{__DDW3.G.updateAdventureWorld();return Math.abs(__DDW3.G.scene.getObjectByName('adventure-home').children[4].position.x-x)>.01;},before,{timeout:30000});
 await p.evaluate(()=>{__DDW3.teleport(8);__DDW3.G.updateAdventureWorld();});assert.equal(await p.evaluate(()=>!!__DDW3.G.scene.getObjectByName('adventure-home')),false,'far home display detaches');
 await p.evaluate(()=>__DDW3.G.adventures.start('science'));assert.ok(await p.locator('#adventureObjective button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;})),'guide controls stay finger-sized');await p.evaluate(()=>__DDW3.teleport(60));await p.waitForFunction(()=>document.querySelector('#paintTools.show'),null,{timeout:30000});assert.equal(await p.locator('#adventureObjective').isVisible(),false,'guide never covers the paint swatches on a small phone');
 await p.locator('#adventureBtn').click();await p.screenshot({path:'screenshots/adventures-small-phone.jpg'});
 assert.deepEqual(errors,[]);console.log('PASS guide restoration, rescue story, home routing, calm learning, music routing, woods persistence and train activation');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
