import {createNurseryRoom} from './nursery-room3d.js';
import {PETS,COLORS,createNursery,hatchPet,carePet,applyDesign,cleanDesign} from './nursery-state.js';

const star=(x,y,r=10)=>Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.45:r;return `${x+Math.cos(a)*d},${y+Math.sin(a)*d}`;}).join(' ');
function marksSVG(art){return art.marks.map(m=>m.type==='line'?`<polyline points="${m.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${m.color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`:m.type==='star'?`<polygon points="${star(m.x,m.y)}" fill="${m.color}"/>`:m.type==='heart'?`<path d="M0 5C-19-9-9-20 0-10C9-20 19-9 0 5" transform="translate(${m.x} ${m.y})" fill="${m.color}"/>`:`<g transform="translate(${m.x} ${m.y})" fill="${m.color}">${[0,72,144,216,288].map(a=>`<ellipse cy="-7" rx="5" ry="8" transform="rotate(${a})"/>`).join('')}<circle r="4" fill="#fff4df"/></g>`).join('');}

export function initNursery({world,G,Sound,voice,save}){
 world.nursery=createNursery(world.nursery);
 const state=()=>world.nursery,pet=()=>state().pets[state().selected];
 let room=null,roomHost=null;
 let page='care',tool='feed',food='🍓',feedback='',spoken='',lastFocus=null,kind='blanket',draft=null,ink=COLORS[4],stamp='star',stroke=null,careHits=0,lastPoint=null;
 const root=document.createElement('div');root.id='nurseryPanel';root.hidden=true;
 root.innerHTML='<section class="nursery-card" role="dialog" aria-modal="true" aria-label="Pet nursery and creative studio"><header class="nursery-header"><div class="nursery-title"><span>🥚</span><strong>Little Wonders</strong><small>Pet nursery & creative studio</small></div><nav><button data-npage="care" aria-label="Pet nursery">🧸</button><button data-npage="studio" aria-label="Creative studio">🎨</button><button id="nurseryRepeat" aria-label="Hear instructions again">🔊</button><button id="nurseryClose" aria-label="Close nursery">✖</button></nav></header><div id="nurseryPets" role="group" aria-label="Your three pets"></div><div id="nurseryContent"></div><footer><span id="nurserySpeech" aria-live="polite"></span></footer></section>';
 document.body.appendChild(root);
 const content=root.querySelector('#nurseryContent'),pets=root.querySelector('#nurseryPets'),speech=root.querySelector('#nurserySpeech');
 const btn=document.createElement('button');btn.id='nurseryBtn';btn.className='pill';btn.setAttribute('aria-label','Pet nursery and creative studio');btn.textContent='🥚';document.querySelector('#upperLeft').appendChild(btn);
 const focusRoom=()=>{if(!root.hidden&&!root.contains(document.activeElement))(content.querySelector('#nurseryEgg,#nurseryFriend')||root.querySelector('#nurseryClose')).focus({preventScroll:true});};
 const on=(el,fn)=>el.addEventListener('click',e=>{e.stopPropagation();Sound.unlocked=true;fn(e);if(!root.hidden&&!root.contains(document.activeElement)){const replacement=el.id?root.querySelector('#'+el.id):[...root.querySelectorAll('button')].find(b=>Object.keys(el.dataset).length&&Object.entries(el.dataset).every(([k,v])=>b.dataset[k]===v));(replacement||content.querySelector('#nurseryEgg,#nurseryFriend')||root.querySelector('#nurseryClose')).focus({preventScroll:true});}});
 document.addEventListener('focusin',e=>{if(!root.hidden&&!root.contains(e.target))root.querySelector('#nurseryClose').focus({preventScroll:true});});
 function say(text){spoken=text;speech.textContent=text;voice.speak(text);}
 function button(icon,label,fn,parent,attrs={}){const b=document.createElement('button');b.innerHTML=icon;b.setAttribute('aria-label',label);for(const[k,v]of Object.entries(attrs))b.dataset[k]=v;on(b,fn);parent.appendChild(b);return b;}
 function open(){if(G.activityOpen||!G.started?.())return;lastFocus=document.activeElement;G.closePanels?.();G.setModalOpen(true);page='care';feedback='';root.hidden=false;render();root.querySelector('#nurseryClose').focus({preventScroll:true});}
 function close(){if(root.hidden)return;stroke=null;room?.hold(null);G.playroom.unmount();roomHost=null;root.hidden=true;G.setModalOpen(false);voice.stop();lastFocus?.focus?.();}
 function showRoom(host,options={}){if(!room)room=createNurseryRoom({G,world});room.show({index:state().selected,pet:pet(),pose:tool,food,...options});if(roomHost!==host||!G.playroom.active()){G.playroom.mount(host,{scene:room.scene,camera:room.camera,update:room.update});roomHost=host;}}
 function renderPets(){pets.replaceChildren();state().pets.forEach((p,i)=>{const icon=p.hatched?'🐾':p.unlocked?'🥚':'🔒';const b=button(`<span class="nursery-pet-choice" style="background:${PETS[i].color}">${icon}</span><span>${p.hatched?PETS[i].name:p.unlocked?'✨':'♡'}</span>`,p.hatched?PETS[i].name:p.unlocked?'Hatch '+PETS[i].name:'Discover another egg',()=>{if(!p.unlocked){say('Feed, wash, brush and play with your friend to find this egg!');return;}state().selected=i;page='care';tool='feed';food=PETS[i].food;feedback='';save();render();},pets,{nurseryPet:i});b.setAttribute('aria-pressed',String(state().selected===i));b.classList.toggle('locked',!p.unlocked);});}

 function render(){renderPets();for(const b of root.querySelectorAll('[data-npage]'))b.setAttribute('aria-pressed',String(b.dataset.npage===page));content.replaceChildren();if(!pet().hatched)renderEgg();else if(page==='studio')renderStudio();else renderCare();}
 function renderEgg(){const p=pet();content.innerHTML=`<div class="nursery-hatch-room nursery-3d-room"><button id="nurseryEgg" class="nursery-3d-touch" aria-label="Tap egg to hatch your pet"></button><div class="nursery-dots">${[0,1,2].map(i=>`<span>${i<p.taps?'✨':'○'}</span>`).join('')}</div></div>`;showRoom(content.querySelector('.nursery-hatch-room'));on(content.querySelector('#nurseryEgg'),()=>{if(hatchPet(state(),state().selected)){save();Sound.chime();render();if(p.hatched)say(`Hello, ${PETS[state().selected].name}! ${PETS[state().selected].trait} Choose a snack, or paint something for your friend!`);}});say('A little friend is inside! Tap the egg three times to say hello.');}

 function renderCare(){
  const p=pet(),d=PETS[state().selected];
  content.innerHTML=`<div class="nursery-care-layout"><div class="nursery-room nursery-3d-room"><button id="nurseryFriend" class="nursery-friend nursery-3d-touch" aria-label="${p.asleep?'Wake':'Play with'} ${d.name}"></button><div id="nurseryReaction" aria-hidden="true">${feedback|| (p.asleep?'🌙':'♡')}</div><div id="nurseryHeld" aria-hidden="true"></div></div><aside class="nursery-care-tools"><div id="nurseryCareTools" class="nursery-tool-row"></div><div id="nurseryChoices" class="nursery-tool-row"></div><div class="nursery-care-progress" aria-label="Care activities completed">${['feed','bath','brush','play'].map((a,i)=>`<span class="${p.care.includes(a)?'done':''}">${['🍓','🛁','🪮','⚽'][i]}${p.care.includes(a)?'✓':''}</span>`).join('')}<span>${state().selected<2?'→🥚':'💕'}</span></div><button id="nurseryCreate" class="nursery-create" aria-label="Create a blanket or outfit">🎨 ✨ 🧣</button><div id="nurseryRoomColors" class="nursery-tool-row" aria-label="Room colors"></div></aside></div>`;
  showRoom(content.querySelector('.nursery-room'));
  const tools=content.querySelector('#nurseryCareTools');
  for(const [id,icon,label]of [['feed','🍓','Feed'],['bath','🛁','Bubble bath'],['brush','🪮','Brush'],['play','⚽','Play catch'],['sleep','🌙','Bedtime']]){const b=button(icon,label,()=>{if(p.asleep&&id!=='sleep')carePet(state(),state().selected,'wake');tool=id;careHits=0;feedback='';save();renderCare();say(instruction());},tools,{careTool:id});b.setAttribute('aria-pressed',String(tool===id));}
  const choices=content.querySelector('#nurseryChoices');
  if(tool==='feed')for(const f of ['🍓','🥕','🍎']){const b=button(f,'Feed '+({'🍓':'berry','🥕':'carrot','🍎':'apple'})[f],()=>{food=f;renderCare();say('Bring the snack to your friend. Tap or drag it!');},choices,{food:f});b.setAttribute('aria-pressed',String(food===f));makeDraggable(b);}
  else {const b=button(({bath:'🧽',brush:'🪮',play:'⚽',sleep:p.asleep?'☀️':'🛏️'})[tool],p.asleep?'Wake pet':'Use '+tool,()=>perform(),choices,{careUse:tool});makeDraggable(b);}
  buttonRoomColors(content.querySelector('#nurseryRoomColors'));
  on(content.querySelector('#nurseryCreate'),()=>{page='studio';render();});
  const friend=content.querySelector('#nurseryFriend');
  on(friend,()=>perform());
  friend.addEventListener('pointerdown',e=>{if(!['bath','brush'].includes(tool))return;e.preventDefault();friend.setPointerCapture(e.pointerId);careHits=0;lastPoint=[e.clientX,e.clientY];});
  friend.addEventListener('pointermove',e=>{if(!friend.hasPointerCapture(e.pointerId)||!lastPoint)return;if(Math.hypot(e.clientX-lastPoint[0],e.clientY-lastPoint[1])>10){careHits++;lastPoint=[e.clientX,e.clientY];holdAt(e);if(careHits>=3){lastPoint=null;perform();}}});
  friend.addEventListener('pointerup',()=>{lastPoint=null;room?.hold(null);});friend.addEventListener('pointercancel',()=>{lastPoint=null;room?.hold(null);});
  say(instruction());
 }
 function buttonRoomColors(parent){for(const [i,c]of COLORS.entries()){const b=button('','Room color '+(i+1),()=>{pet().room=c;save();renderCare();say('A cosy new color for your room!');},parent,{roomColor:i});b.style.background=c;b.setAttribute('aria-pressed',String(pet().room===c));}}
 function instruction(){if(pet().asleep)return 'Snuggled in your own blanket! Tap your friend to wake up any time.';return {feed:`${PETS[state().selected].name} loves ${PETS[state().selected].food==='🍓'?'berries':PETS[state().selected].food==='🥕'?'carrots':'apples'}! Choose a snack and tap or drag it to your friend.`,bath:'Rub the sponge over your friend, or tap for a bubble bath!',brush:'Rub the brush over your friend, or tap for a gentle brushing!',play:'Tap your friend or bring the ball over to play catch!',sleep:'Tap your friend to tuck them into the blanket you made!'}[tool];}
 function perform(){
  const p=pet(),i=state().selected,nextWas=state().pets[i+1]?.unlocked;
  if(p.asleep){carePet(state(),i,'wake');feedback='☀️ 💕';}
  else {carePet(state(),i,tool);feedback=({feed:food===PETS[i].food?'😋 💕':'😋',bath:'🫧 ✨',brush:'✨ 💕',play:'⚽ 🌟',sleep:'🌙 💤'})[tool];}
  save();Sound.giggle();renderPets();renderCare();focusRoom();
  if(!nextWas&&state().pets[i+1]?.unlocked){say('You found another egg! Tap the new egg above to meet your next friend!');Sound.chime();}
  else say(p.asleep?'All tucked in, under your own creation. Sweet dreams!':tool==='feed'&&food===PETS[i].food?`Yummy! That is ${PETS[i].name}'s favorite snack!`:tool==='play'?`${PETS[i].name} caught the ball! Play again!`:tool==='bath'?'Pop, pop! A lovely bubbly bath!':tool==='brush'?'Soft and fluffy! Your friend loves that!':'Hello, little friend!');
 }
 function holdAt(e){const r=content.querySelector('.nursery-room')?.getBoundingClientRect();if(r)room?.hold({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height});}
 function makeDraggable(b){let start=null,dragged=false;
  b.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];dragged=false;if(b.dataset.food){food=b.dataset.food;showRoom(content.querySelector('.nursery-room'));}b.setPointerCapture(e.pointerId);});
  b.addEventListener('pointermove',e=>{if(!start)return;if(Math.hypot(e.clientX-start[0],e.clientY-start[1])>10)dragged=true;if(dragged)holdAt(e);});
  b.addEventListener('pointerup',e=>{if(!start)return;start=null;room?.hold(null);if(!dragged)return;e.preventDefault();e.stopPropagation();const r=content.querySelector('#nurseryFriend').getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){if(b.dataset.food)food=b.dataset.food;perform();}else renderCare();});
  b.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopImmediatePropagation();dragged=false;}},true);
  b.addEventListener('pointercancel',()=>{start=null;room?.hold(null);renderCare();});
 }
 function renderStudio(){
  draft=cleanDesign(pet()[kind]);stroke=null;
  content.innerHTML=`<div class="nursery-studio-layout"><aside><div class="nursery-tool-row" id="nurseryKinds"></div><div class="nursery-tool-row" id="nurseryPalette"></div><div class="nursery-tool-row" id="nurseryStamps"></div><div class="nursery-tool-row" id="nurseryArtActions"></div></aside><div class="nursery-art-paper"><svg id="nurseryCanvas" viewBox="0 0 200 200" role="img" aria-label="Draw and stamp your pet design" tabindex="0"></svg></div><div class="nursery-preview"><div id="nurseryPreview" class="nursery-preview3d"></div><button id="nurseryApply" aria-label="Give your creation to your pet">✅ 🎁</button><div id="nurseryDesignStatus" aria-live="polite"></div></div></div>`;
  for(const [k,icon]of [['blanket','🛏️'],['outfit','🧣']]){const b=button(icon,'Design '+k,()=>{kind=k;renderStudio();},content.querySelector('#nurseryKinds'),{designKind:k});b.setAttribute('aria-pressed',String(k===kind));}
  for(const [i,c]of COLORS.entries()){const b=button('','Paint color '+(i+1),()=>{ink=c;for(const q of content.querySelectorAll('[data-ink]'))q.setAttribute('aria-pressed',String(+q.dataset.ink===i));say('Color chosen. Draw or stamp on the paper!');},content.querySelector('#nurseryPalette'),{ink:i});b.style.background=c;b.setAttribute('aria-pressed',String(c===ink));}
  for(const [s,icon]of [['star','⭐'],['heart','♥'],['flower','🌼'],['line','🖍️']]){const b=button(icon,s==='line'?'Freehand drawing':'Stamp '+s,()=>{stamp=s;for(const q of content.querySelectorAll('[data-stamp]'))q.setAttribute('aria-pressed',String(q.dataset.stamp===s));say(s==='line'?'Draw with your finger!':'Tap the paper to place a '+s+'!');},content.querySelector('#nurseryStamps'),{stamp:s});b.setAttribute('aria-pressed',String(s===stamp));}
  button('↶','Undo last mark',()=>{draft.marks.pop();drawArt();},content.querySelector('#nurseryArtActions'),{artAction:'undo'});
  button('🧽','Clear this design',()=>{draft.marks=[];drawArt();},content.querySelector('#nurseryArtActions'),{artAction:'clear'});
  button('🪣','Fill background with selected color',()=>{draft.color=ink;drawArt();},content.querySelector('#nurseryArtActions'),{artAction:'fill'});
  on(content.querySelector('#nurseryApply'),()=>{applyDesign(state(),state().selected,kind,draft);save();Sound.chime();content.querySelector('#nurseryDesignStatus').textContent='✅';say(kind==='blanket'?'Your blanket is on the wall and ready for bedtime! Tap the teddy to tuck your friend in.':'Your friend is wearing the outfit you made!');});
  const svg=content.querySelector('#nurseryCanvas');
  function point(e){const r=svg.getBoundingClientRect();return [Math.max(0,Math.min(200,(e.clientX-r.left)/r.width*200)),Math.max(0,Math.min(200,(e.clientY-r.top)/r.height*200))];}
  svg.addEventListener('pointerdown',e=>{e.preventDefault();svg.focus({preventScroll:true});Sound.unlocked=true;if(draft.marks.length>=80){say('Your picture is full! Undo a mark or give it to your friend.');return;}const [x,y]=point(e);if(stamp==='line'){stroke={type:'line',points:[[x,y],[x+.01>200?200:x+.01,y]],color:ink};draft.marks.push(stroke);svg.setPointerCapture(e.pointerId);}else draft.marks.push({type:stamp,x,y,color:ink});drawArt();});
  svg.addEventListener('pointermove',e=>{if(!stroke||!svg.hasPointerCapture(e.pointerId)||stroke.points.length>=100)return;const p=point(e),last=stroke.points.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])<2)return;stroke.points.push(p);drawArt();});
  svg.addEventListener('pointerup',()=>{stroke=null;});svg.addEventListener('pointercancel',()=>{stroke=null;});
  svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(draft.marks.length<80){draft.marks.push(stamp==='line'?{type:'line',points:[[65,100],[135,100]],color:ink}:{type:stamp,x:100,y:100,color:ink});drawArt();}}});
  drawArt();say('Choose a blanket or outfit. Pick colors, draw or stamp, then tap the gift to give it to your friend!');
 }
 function drawArt(){const svg=content.querySelector('#nurseryCanvas');svg.innerHTML=`<rect width="200" height="200" rx="7" fill="${draft.color}"/>${marksSVG(draft)}`;showRoom(content.querySelector('#nurseryPreview'),{design:draft,kind});const status=content.querySelector('#nurseryDesignStatus');if(status)status.textContent='';}
 on(btn,open);on(root.querySelector('#nurseryClose'),close);on(root.querySelector('#nurseryRepeat'),()=>voice.speak(spoken));
 for(const b of root.querySelectorAll('[data-npage]'))on(b,()=>{page=b.dataset.npage;feedback='';render();});
 root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const focusable=[...root.querySelectorAll('button,[tabindex="0"]')].filter(b=>!b.disabled&&b.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus({preventScroll:true});}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus({preventScroll:true});}}});
 return {open,close,state,get room(){return room;}};
}
