const {chromium}=require('playwright');
const assert=require('node:assert/strict');const path=require('path');
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve(process.env.NURSERY_HTML||'index.html')+'?test');await page.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:240000});await page.locator('#playBtn').click();
 assert.equal(await page.locator('#nurseryBtn').count(),1,'nursery entry exists');
 await page.locator('#nurseryBtn').click();assert.equal(await page.evaluate(()=>__DDW3.G.activityOpen),true);
 await page.locator('#nurseryEgg').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'nurseryEgg');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets[0].hatched),true);
 await page.locator('[data-care-tool="feed"]').click();await page.locator('[data-food="🍓"]').click();await page.locator('#nurseryFriend').click();
 for(const a of ['bath','brush','play']){await page.locator(`[data-care-tool="${a}"]`).click();await page.locator('#nurseryFriend').click();}
 assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets[1].unlocked),true);
 await page.screenshot({path:'screenshots/nursery-care.jpg',timeout:240000});
 await page.locator('#nurseryCreate').click();await page.locator('[data-design-kind="outfit"]').click();await page.locator('[data-ink="2"]').click();
 await page.locator('#nurseryCanvas').tap({position:{x:85,y:85}});await page.locator('#nurseryApply').click();
 assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets[0].outfit.marks[0].color),'#8fd8bc');
 await page.locator('[data-design-kind="blanket"]').click();await page.locator('[data-stamp="line"]').click();await page.locator('#nurseryCanvas').scrollIntoViewIfNeeded();const r=await page.locator('#nurseryCanvas').boundingBox();
 await page.mouse.move(r.x+30,r.y+30);await page.mouse.down();await page.mouse.move(r.x+100,r.y+110,{steps:5});await page.mouse.up();await page.locator('#nurseryApply').click();
 assert.ok(await page.evaluate(()=>__DDW3.world.nursery.pets[0].blanket.marks[0].points.length>2));
 await page.screenshot({path:'screenshots/nursery-studio.jpg',timeout:240000});
 await page.locator('[data-npage="care"]').click();await page.locator('[data-care-tool="sleep"]').click();await page.locator('#nurseryFriend').click();
 assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets[0].asleep),true);
 assert.ok(await page.evaluate(()=>{const m=__DDW3.G.nursery.room.scene.getObjectByName('nursery-blanket');return m?.visible&&m.material.map?.isCanvasTexture;}),'own blanket is an actual textured 3D mesh');
 assert.ok(await page.evaluate(()=>{const r=__DDW3.G.nursery.room;r.scene.updateMatrixWorld(true);return r.pet.B.head.getWorldPosition(new __DDW3.THREE.Vector3()).z<-1.25;}),'head remains above pillow beyond blanket edge');await page.screenshot({path:'screenshots/nursery-bedtime.jpg',timeout:240000});
 await page.locator('[data-nursery-pet="1"]').click();for(let i=0;i<3;i++)await page.locator('#nurseryEgg').click();
 assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets[1].outfit.marks.length),0);
 // A real drag from food tray to friend must feed exactly the selected pet.
 await page.locator('[data-food="🥕"]').click();assert.equal(await page.evaluate(()=>__DDW3.G.nursery.room.scene.getObjectByName('nursery-food:🥕').visible),true);const food=await page.locator('[data-food="🥕"]').boundingBox(),friend=await page.locator('#nurseryFriend').boundingBox();
 await page.mouse.move(food.x+24,food.y+24);await page.mouse.down();await page.mouse.move(friend.x+friend.width/2,friend.y+friend.height/2,{steps:8});assert.ok(await page.evaluate(()=>Math.abs(__DDW3.G.nursery.room.scene.getObjectByName('nursery-food:🥕').position.x-.85)>.1),'3D food follows the finger');await page.mouse.up();
 assert.ok(await page.evaluate(()=>__DDW3.world.nursery.pets[1].care.includes('feed')));
 await page.locator('#nurseryClose').click();assert.equal(await page.evaluate(()=>__DDW3.G.activityOpen),false);assert.equal(await page.locator('body>#game').count(),1,'game canvas returns to the world');
 // Preserve old collection fields while nursery data is saved and loaded through the actual game.
 await page.evaluate(()=>{__DDW3.world.crown=true;__DDW3.world.wand=true;__DDW3.G.adventures.event({type:'sea',id:'octopus'});__DDW3.G.nursery.open();});
 await page.locator('[data-care-tool="play"]').click();await page.locator('#nurseryFriend').click();await page.locator('#nurseryClose').click();
 await page.reload();await page.waitForFunction(()=>window.__DDW3&&document.querySelector('#loading.done'),null,{timeout:240000});await page.locator('#playBtn').click();
 const s=await page.evaluate(()=>({n:__DDW3.world.nursery,crown:__DDW3.world.crown,wand:__DDW3.world.wand,sea:__DDW3.world.adventures.events.includes('sea_octopus')}));
 assert.ok(s.crown&&s.wand&&s.sea);assert.equal(s.n.pets[0].asleep,true);assert.equal(s.n.pets[0].outfit.marks.length,1);assert.ok(s.n.pets[0].blanket.marks[0].points.length>2);assert.equal(s.n.pets[1].hatched,true);
 await page.locator('#nurseryBtn').click();await page.locator('[data-nursery-pet="0"]').click();await page.locator('#nurseryFriend').click();assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets[0].asleep),false);
 for(const size of [{width:375,height:667},{width:667,height:375},{width:390,height:844},{width:768,height:1024}]){
  await page.setViewportSize(size);await page.locator('[data-npage="studio"]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);for(const box of await page.locator('[data-ink]').all()){const r=await box.boundingBox();assert.ok(r.width>=48&&r.height>=48,'palette targets at least48px');}
  const apply=page.locator('#nurseryApply');await apply.scrollIntoViewIfNeeded();assert.equal(await apply.isVisible(),true);
  const b=await apply.boundingBox();assert.ok(b.width>=48&&b.height>=48);await apply.click();await page.locator('[data-npage="care"]').click();assert.ok(await page.locator('[data-room-color]').first().isVisible(),'room colors available');
 }
 await page.setViewportSize({width:375,height:667});await page.screenshot({path:'screenshots/nursery-phone.jpg',timeout:240000});
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.querySelector('#nurseryPanel').contains(document.activeElement)),true);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__DDW3.G.activityOpen),false);assert.equal(await page.locator('body>#game').count(),1,'game canvas returns to the world');
 await page.setViewportSize({width:844,height:390});await page.locator('#adventureBtn').click();await page.locator('[data-page="gallery"]').click();await page.locator('[data-open-nursery="true"]').click();assert.equal(await page.locator('#nurseryPanel').isVisible(),true);
 assert.equal(await page.locator('#adventurePanel').isVisible(),false);
 await page.locator('[data-nursery-pet="1"]').click();for(const a of ['bath','brush']){await page.locator(`[data-care-tool="${a}"]`).click();await page.locator('#nurseryFriend').click();}
 await page.locator('[data-nursery-pet="2"]').click();for(let i=0;i<3;i++)await page.locator('#nurseryEgg').click();assert.equal(await page.evaluate(()=>__DDW3.world.nursery.pets.every(p=>p.hatched)),true);
 assert.equal(await page.locator('.nursery-care-progress').innerText().then(t=>t.includes('🥚')),false);
 await page.locator('#nurseryCreate').click();await page.locator('[data-stamp="line"]').click();await page.locator('#nurseryCanvas').scrollIntoViewIfNeeded();const box=await page.locator('#nurseryCanvas').boundingBox();const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+30,y:box.y+30,id:1}]});for(let n=1;n<=5;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+30+n*15,y:box.y+30+n*15,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.locator('#nurseryApply').click();assert.ok(await page.evaluate(()=>__DDW3.world.nursery.pets[2].blanket.marks[0].points.length>2),'actual touch draws');
 await page.locator('[data-npage="care"]').click();await page.evaluate(()=>__DDW3.G.comfort.apply({...__DDW3.world.comfort,calm:true}));assert.equal(await page.evaluate(()=>__DDW3.world.comfort.calm),true);assert.equal(await page.locator('#nurseryPanel #game').count(),1,'existing game renderer is reused');
 await page.locator('#nurseryClose').click();
 for(const size of [{width:667,height:375},{width:844,height:390}]){await page.setViewportSize(size);const overlap=await page.evaluate(()=>{const a=document.querySelector('#upperLeft').getBoundingClientRect(),b=document.querySelector('#upperRight').getBoundingClientRect();return a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert.equal(overlap,false,'HUD groups do not overlap');}assert.deepEqual(errors,[]);console.log('PASS nursery hatching, four care activities, drag feeding, designs, bedtime, legacy saves, four screens and home gallery entry');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
