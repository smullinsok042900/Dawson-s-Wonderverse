import { ADVENTURES, CREATURE_BOOK, REWARDS, createAdventureState, emitAdventure, replayAdventure, nextCatch } from './adventure-state.js';

// Small original destination drawings, kept in the offline bundle (no external images).
export function destinationArt(icon, index=0) {
 const water=['🌊','🏖️'].includes(icon),snow=icon==='❄️';
 const sky=water?'#c9efff':snow?'#e9f6ff':'#e9dcff',ground=water?'#76c9ed':snow?'#fbfdff':'#b3dc9b';
 const building=['🏠','🏰','🎪','🧸','🎨','🖍️'].includes(icon);
 const body=building?`<rect x="29" y="35" width="46" height="39" rx="7" fill="${index%2?'#ffbc79':'#b79be7'}"/><path d="M22 37L52 14 82 37Z" fill="#f47aa8"/><rect x="44" y="50" width="15" height="24" rx="6" fill="#fff3c9"/>`:water?'<path d="M8 62Q24 51 40 62T72 62T104 62" fill="none" stroke="#fff" stroke-width="4"/><path d="M37 51h43l-7 9H44Z" fill="#a3724f"/><path d="M58 17v34h21Z" fill="#fff6ce"/>':'<path d="M20 65L39 25 59 65Z" fill="#629f76"/><path d="M51 66L72 14 95 66Z" fill="#83b68b"/><path d="M71 15l-8 20h16Z" fill="#fff7e5"/>';
 return `<svg viewBox="0 0 104 84" aria-hidden="true"><rect width="104" height="84" rx="16" fill="${sky}"/><circle cx="84" cy="16" r="9" fill="#ffda79"/><path d="M0 59Q25 45 53 61T104 55V84H0Z" fill="${ground}"/>${body}<text x="18" y="35" font-size="25">${icon}</text></svg>`;
}

export function initAdventures({world,player,G,voice,Sound,save,saveSoon=save,travel,learning,fluffs,comfort,release,pause,cheer}) {
 world.adventures=createAdventureState(world.adventures,{...world,fluffs});
 const state=()=>world.adventures;
 let lastFocus=null,currentPage='quests',walkStart=null,lastVisit='',currentStep='',guide=!!world.adventures.active;
 const root=document.createElement('div');root.id='adventurePanel';root.hidden=true;
 root.innerHTML='<section class="adv-card" role="dialog" aria-modal="true" aria-label="Adventures and discoveries"><header><nav><button data-page="quests" aria-label="Adventures">🧭</button><button data-page="book" aria-label="Discovery book">📖</button><button data-page="gallery" aria-label="Home gallery">🏠</button><button data-page="comfort" aria-label="Comfort settings">⚙️</button></nav><button id="adventureClose" aria-label="Close">✖</button></header><div id="advContent"></div><div id="advSpeech" aria-live="polite"></div></section>';
 document.body.appendChild(root);
 const content=root.querySelector('#advContent'),speech=root.querySelector('#advSpeech');
 const btn=document.createElement('button');btn.id='adventureBtn';btn.className='pill';btn.setAttribute('aria-label','Adventures and discovery book');btn.textContent='🧭';document.querySelector('#upperLeft').appendChild(btn);
 const objective=document.createElement('div');objective.id='adventureObjective';objective.hidden=true;objective.innerHTML='<button id="objectivePicture" aria-label="Current adventure"></button><button id="objectiveRepeat" aria-label="Hear the next step">🔊</button><button id="objectiveShow" aria-label="Show me">👆</button><button id="objectiveHide" aria-label="Hide adventure guide">✖</button>';document.body.appendChild(objective);
 const hand=document.createElement('div');hand.id='adventureGuide';hand.hidden=true;hand.setAttribute('aria-hidden','true');hand.textContent='👆';document.body.appendChild(hand);
 const say=text=>{speech.textContent=text;voice.speak(text);};
 const listen=(el,fn)=>el.addEventListener('click',e=>{e.stopPropagation();Sound.unlocked=true;fn();});
 function close(){if(root.hidden)return;root.hidden=true;release();pause(false);lastFocus?.focus?.();}
 function open(page='quests'){if(G.activityOpen&&root.hidden)return;lastFocus=document.activeElement;release();pause(true);currentPage=page;root.hidden=false;render();root.querySelector('#adventureClose').focus();}
 function render(){
  for(const b of root.querySelectorAll('[data-page]'))b.setAttribute('aria-pressed',String(b.dataset.page===currentPage));
  content.replaceChildren();
  if(currentPage==='quests')renderQuests();else if(currentPage==='book')renderBook();else renderGallery();
 }
 function tile(html,label,fn,attrs={}){const b=document.createElement('button');b.className='adv-tile';b.innerHTML=html;b.setAttribute('aria-label',label);for(const[k,v]of Object.entries(attrs))b.dataset[k]=v;listen(b,fn);content.appendChild(b);return b;}
 function renderQuests(){
  for(const[id,q]of Object.entries(ADVENTURES)){const done=state().completed.includes(id);tile(`<span>${q.icon}</span><small>${done?'✅':'○'.repeat(q.steps.length)}</small>`,q.name,()=>{start(id);renderQuestsDetail(id);},{quest:id});}
  say('Choose a picture for an adventure. You can explore any time!');
 }
 function renderQuestsDetail(id){
  const q=ADVENTURES[id];content.replaceChildren();content.classList.add('adv-detail');
  const events=state().replay?.id===id?state().replay.events:state().events;
  for(const st of q.steps)tile(`<span>${st.icon}</span><small>${events.includes(st.event)?'✅':'○'}</small>`,st.say,()=>say(st.say));
  tile('▶','Start exploring',close);tile('🔁','Play this adventure again',()=>{replayAdventure(state(),id);guide=true;save();refreshObjective();if(id==='rescue'&&fluffs.every(f=>f.state==='home'))renderRescueStory();else renderQuestsDetail(id);});
  say(nextStep()?.say||'You did it! Your souvenir is at home. Play again any time.');
 }
 function renderRescueStory(){
  content.replaceChildren();
  const captions=['We walked through Wonderverse!','We found a little friend!','We brought the Fluffkin home!'];
  for(const [i,st]of ADVENTURES.rescue.steps.entries())tile(`<span>${st.icon}</span>`,captions[i],()=>{event({type:'activity',id:st.event});say(captions[i]);});
  say('All the babies are safe at home. Tap the pictures to tell their rescue story again!');
 }
 function renderBook(){
  for(const c of CREATURE_BOOK){const found=state().events.includes('sea_'+c.id);const b=tile(`<span>${c.icon}</span><small>${found?'🔊':'❔'}</small>`,found?c.name:'Find '+c.name,()=>{say(found?`${c.name}. ${c.fact}`:`Look for ${c.name} at the pier. Tap the tide pool or the sea creatures.`);if(found){b.classList.remove('adv-wiggle');void b.offsetWidth;b.classList.add('adv-wiggle');}},{sea:c.id});b.classList.toggle('unknown',!found);}
  const places=[['home','🏠',190],['playhouse','🎪',8],['studio','🎨',62],['lab','🔬',100],['park','🎡',160],['castle','🏰',398],...G.expansion.districts.map(d=>[d.id,d.icon,d.home])];
  for(const[id,icon,x]of places){const found=state().events.includes('visit_'+id);const b=tile(destinationArt(icon),found?'Visit '+id:'Discover '+id,()=>{say(found?'You discovered this place. Explore it again!':'Follow the map picture to discover this place.');},{place:id});b.classList.toggle('unknown',!found);}
  say('Your discoveries! Tap a picture to hear about it. Shady pictures are waiting to be found.');
 }
 function saveArt(kind){
  if((kind==='paint'&&!world.painted)||(kind==='build'&&!(world.build||[]).some(v=>v>=0))){say(kind==='paint'?'Paint a picture in the Studio first!':'Build something at the Block Builder first!');return;}
  let item;if(kind==='paint'){const canvas=G.paint.canvas,thumb=document.createElement('canvas');thumb.width=256;thumb.height=128;thumb.getContext('2d').drawImage(canvas,0,0,256,128);item={kind,image:thumb.toDataURL('image/jpeg',.7)};}else item={kind,blocks:(world.build||[]).slice()};
  state().gallery=state().gallery.filter(g=>g.kind!==kind).concat(item).slice(-8);event({type:'activity',id:'art_saved'});save();renderGallery();say('Your creation is in your home gallery!');
 }
 function renderGallery(){
  content.replaceChildren();
  tile('🥚 🎨','Pet nursery and creative studio',()=>{close();G.nursery?.open();},{openNursery:'true'});
  for(const r of state().rewards)tile(`<span>${REWARDS[r][0]}</span><small>🔊</small>`,REWARDS[r][1],()=>say('You earned your '+REWARDS[r][1]+'!'),{reward:r});
  for(const g of state().gallery){const b=tile(g.kind==='paint'?'<img alt="Your saved painting">':`<span class="adv-block-preview">${(g.blocks.length?g.blocks:Array(20).fill(-1)).slice(0,180).map(v=>`<i style="background:${v<0?'#eee7fa':['#ff7ab8','#8fb9ff','#ffd46b','#8cdaa2'][v%4]}"></i>`).join('')}</span>`,g.kind==='paint'?'Your saved painting':'Your saved building',()=>say('You made this!'),{galleryKind:g.kind});if(g.kind==='paint')b.querySelector('img').src=g.image;}
  tile('🎨 ➕ 🖼️','Display my painting',()=>saveArt('paint'),{saveArt:'paint'});tile('🧱 ➕ 🖼️','Display my building',()=>saveArt('build'),{saveArt:'build'});
  tile('🛏️','Choose a cushion',()=>renderFurnish());
  say('Your home treasures and creations. Tap paint or blocks to display what you made.');
 }
 function renderFurnish(){content.replaceChildren();for(const[name,color]of [['pink','#ff9acb'],['blue','#91cfff'],['green','#a5e6b5']]){const b=tile('<span>🛏️</span>','A '+name+' cushion',()=>{state().cushion=name;event({type:'activity',id:'furnish'});save();say('A cosy '+name+' cushion for your friend!');},{cushion:name});b.style.background=color;}say('Choose a cosy cushion for the home nook!');}
 function nextStep(){const s=state(),q=ADVENTURES[s.active];if(!q)return null;const events=s.replay?.id===s.active?s.replay.events:s.events;return q.steps.find(st=>!events.includes(st.event));}
 function start(id){if(!Object.prototype.hasOwnProperty.call(ADVENTURES,id))return;if(state().active!==id)state().replay=null;state().active=id;guide=true;save();refreshObjective();}
 function refreshObjective(){const st=nextStep();objective.hidden=!guide||!st;objective.querySelector('#objectivePicture').textContent=st?.icon||'✅';objective.querySelector('#objectivePicture').setAttribute('aria-label',st?.say||'Adventure complete');if(st&&currentStep!==st.event){currentStep=st.event;if(!world.comfort?.calm&&root.hidden)say(st.say);}G.refreshAdventureWorld?.();}
 let guideTimer;
 function showMe(){const st=nextStep();if(!st)return;say(st.say);clearTimeout(guideTimer);hand.hidden=false;const control=st.event==='walk'?document.querySelector('#rightBtn'):document.querySelector('#pawBtn');const rect=control.getBoundingClientRect();hand.style.left=rect.left+rect.width/2+'px';hand.style.top=Math.max(4,rect.top-42)+'px';guideTimer=setTimeout(()=>{hand.hidden=true;},3500);}
 function action(){const st=nextStep();if(!st)return;if(st.event==='fluff_found'){const f=fluffs.find(f=>f.state==='wait');if(f){travel(['🐣','a little friend',f.hx-2]);say('Walk close to the baby Fluffkin to say hello!');showMe();return;}}if(st.panel==='gallery'){if(st.event==='gallery_visit'&&player.layer!=='in'&&Math.abs(player.x-800)>=100)travel(['🏠','your home gallery',190]);open('gallery');if(player.layer==='in'||Math.abs(player.x-190)<15||Math.abs(player.x-800)<100)event({type:'activity',id:'gallery_visit'});return;}if(st.panel==='furnish'){if(player.layer!=='in'&&Math.abs(player.x-190)>15)travel(['🏠','your home nook',190]);open('gallery');renderFurnish();return;}if(st.panel==='pattern'){open('quests');renderPattern();return;}if(st.learn){if(G.activityOpen)return;release();learning.run(learning.activities.find(a=>a.id===st.learn));return;}if(st.event!=='walk')travel([st.icon,'your next adventure stop',st.x]);say(st.say);showMe();}
 function renderPattern(){close();release();learning.run(learning.activities.find(a=>a.id==='pattern'));}

 function event(e){if(G.perfTest)return {changed:false,rewards:[]};const result=emitAdventure(state(),e);if(result.changed){saveSoon();if(!root.hidden&&currentPage==='book')render();refreshObjective();}if(result.rewards.length){Sound.chime();cheer?.();if(root.hidden)say('You did it! A new treasure is waiting at home!');}if(['activity','sea','learn'].includes(e.type))G.reactCompanions?.(e);return result;}
 function update(){
  if(!G.started?.())return;
  G.updateAdventureWorld?.();
  if(walkStart===null)walkStart=player.x;if((!state().events.includes('walk')||(state().replay?.id==='rescue'&&!state().replay.events.includes('walk')))&&Math.abs(player.x-walkStart)>1.5&&Math.abs(player.vx)>.2)event({type:'activity',id:'walk'});
  const region=player.layer==='in'?'home':G.expansion.districts.find(d=>player.x>=d.x0&&player.x<=d.x1)?.id|| (Math.abs(player.x-190)<12?'home':Math.abs(player.x-62)<15?'studio':Math.abs(player.x-100)<15?'lab':player.x<45?'playhouse':player.x<180?'park':player.x>370?'castle':'');
  if(region&&(region!==lastVisit||(state().replay&&ADVENTURES[state().replay.id].steps.some(st=>st.event==='visit_'+region)&&!state().replay.events.includes('visit_'+region)))){lastVisit=region;event({type:'activity',id:'visit_'+region});}
 }
 listen(btn,()=>open());listen(root.querySelector('#adventureClose'),close);
 for(const b of root.querySelectorAll('[data-page]'))listen(b,()=>{content.classList.remove('adv-detail');if(b.dataset.page==='comfort'){close();comfort.open();return;}currentPage=b.dataset.page;render();if(currentPage==='gallery'&&(player.layer==='in'||Math.abs(player.x-190)<15||Math.abs(player.x-800)<100))event({type:'activity',id:'gallery_visit'});});
 listen(objective.querySelector('#objectivePicture'),action);listen(objective.querySelector('#objectiveRepeat'),()=>{const st=nextStep();if(st)say(st.say);});listen(objective.querySelector('#objectiveShow'),showMe);listen(objective.querySelector('#objectiveHide'),()=>{guide=false;state().active=null;save();objective.hidden=true;hand.hidden=true;});
 root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')];const first=buttons[0],last=buttons[buttons.length - 1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 root.addEventListener('click',e=>{if(e.target===root)close();});
 refreshObjective();
 return {event,start,open,close,update,refresh:refreshObjective,nextStep,catch:()=>{const result=nextCatch(state());saveSoon();return result;},intro(){if(!state().introSeen){state().introSeen=true;start(fluffs.some(f=>f.state!=='home')?'rescue':'companion');save();}},gallery(){open('gallery');if(player.layer==='in'||Math.abs(player.x-190)<15||Math.abs(player.x-800)<100)event({type:'activity',id:'gallery_visit'});},state};
}
