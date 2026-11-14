// JSON-only adventure progress. No renderer, DOM, clocks or randomness.
const step = (event, icon, say, x, extra = {}) => ({ event, icon, say, x, ...extra });
export const ADVENTURES = {
 rescue: { icon: '🐣', name: 'A little friend', reward: 'nest', steps: [step('walk','👣','Hold an arrow to walk. Follow the little footprints!',5),step('fluff_found','🐣','Find a baby Fluffkin. Walk close to say hello!',40),step('fluff_home','🏠','Take your little friend to the Fluffkin House!',190)] },
 companion: { icon:'💖',name:'A home for a friend',reward:'cushion',steps:[step('visit_woods','🌲','Visit the woods with a friend, or explore on your own!',-158),step('learn_count','🌱','Count seeds to grow something for home!',118,{learn:'count'}),step('furnish','🛏️','Choose a cosy cushion for the home nook!',190,{panel:'furnish'})] },
 rainbow: {icon:'🌈',name:'Rainbow helper',reward:'rainbow',steps:[step('learn_colors','🎨','Match the colours to make a rainbow!',214,{learn:'colors'})]},
 garden: {icon:'🌻',name:'Little gardener',reward:'garden',steps:[step('learn_count','🔢','Count seeds for the garden!',118,{learn:'count'}),step('learn_plant','🌱','Help a plant grow!',306,{learn:'plant'})]},
 train: {icon:'🚂',name:'Pattern express',reward:'train',steps:[step('learn_pattern','🔴','Finish the colour pattern to start the toy train!',214,{panel:'pattern'})]},
 farm: {icon:'🚜',name:'Farm picnic',reward:'basket',steps:[step('seed_planted','🌱','Plant a seed in the farm vegetable patch!',-478),step('carrot_harvest','🥕','Help the carrot grow, then pull it up!',-478),step('feed_friend','🍪','Take a snack to the hungry friend in Art Plaza!',879)]},
 woods: {icon:'🦉',name:'Who is calling?',reward:'owl',steps:[step('woods_listen','👂','Listen to the call, or follow the glowing owl picture!',-187),step('woods_found','🦉','Follow the owl pictures and find the hidden friend!',-201)]},
 snow: {icon:'⛄',name:'Snow friend',reward:'snow',steps:[step('snow_rolled','⚪','Roll a snowball beside the snow pile!',-302),step('snow_built','⛄','Tap the snow pile to build a snow friend!',-300)]},
 science: {icon:'🔬',name:'Wonder gardener',reward:'flower',steps:[step('learn_float','🛁','Try things in water. What will float?',306,{learn:'float'}),step('learn_magnet','🧲','Discover what a magnet can pick up!',306,{learn:'magnet'}),step('learn_plant','🌱','Grow a flower for the garden!',306,{learn:'plant'})]},
 art: {icon:'🎨',name:'My own gallery',reward:'frame',steps:[step('art_saved','🖼️','Paint or build, then put your creation in the gallery!',62,{panel:'gallery'}),step('gallery_visit','🏠','Visit your gallery at home or Art Plaza!',190,{panel:'gallery'})]},
 pier: {icon:'🌊',name:'Pier explorer',reward:'pirate',steps:[step('tide_found','🐙','Look in the tide pool for a little sea creature!',-566),step('fish_caught','🎣','Tap the fishing rod to catch a fish!',-552),step('beach_clue','🐚','Look for a shell clue on Sunny Seaside!',-106),step('treasure_dug','❌','Find the cross at the pier and dig for treasure!',-620)]},
};
export const CREATURE_BOOK = [
 ['crab','🦀','Crab','Crabs have ten legs, including their claws.'],['starfish','⭐','Sea star','Sea stars use tiny tube feet to move.'],['octopus','🐙','Octopus','An octopus has eight arms.'],['jellyfish','🪼','Jellyfish','Jellyfish have no bones.'],['snail','🐌','Sea snail','A sea snail carries a shell.'],['shrimp','🦐','Shrimp','Shrimp have long feelers called antennae.'],['puffer','🐡','Puffer fish','Puffer fish can puff up to look bigger.'],['bluefish','🐟','Blue fish','Fish use gills to breathe in water.'],['yellowfish','🐠','Yellow fish','Fish use their fins to steer.'],['dolphin','🐬','Dolphin','Dolphins breathe air at the surface.'],['whale','🐳','Whale','Whales breathe air through blowholes.'],
].map(([id,icon,name,fact])=>({id,icon,name,fact}));
export const REWARDS = {nest:['🪺','Fluffkin nest'],cushion:['🛏️','Cosy cushion'],rainbow:['🌈','Rainbow decoration'],garden:['🌻','Seed garden'],train:['🚂','Toy train'],basket:['🧺','Picnic basket'],owl:['🦉','Woodland owl'],snow:['⛄','Snow friend'],flower:['🌷','Wonder flower'],frame:['🖼️','Artist frame'],pirate:['🚩','Pirate flag']};
const allowed = new Set(Object.values(ADVENTURES).flatMap(q=>q.steps.map(s=>s.event)));
for(const e of ['visit_pier','visit_farm','visit_frosty','visit_seaside','visit_trail','visit_toytown','visit_labgarden','visit_artplaza','visit_home','visit_park','visit_studio','visit_lab','visit_castle','visit_playhouse','learn_float','learn_magnet','learn_plant'])allowed.add(e);
for(const c of CREATURE_BOOK)allowed.add('sea_'+c.id);
const record = v => v && typeof v==='object'&&!Array.isArray(v)?v:{};
const cleanEvents = a => Array.isArray(a)?[...new Set(a.filter(x=>allowed.has(x)))]:[];
export function createAdventureState(raw, legacy={}) {
 const r=record(raw),s={v:1,events:cleanEvents(r.events),completed:[],rewards:[],active:Object.prototype.hasOwnProperty.call(ADVENTURES,r.active)?r.active:null,replay:null,catches:Number.isSafeInteger(r.catches)&&r.catches>=0?Math.min(1e6,r.catches):0,gallery:[],cushion:['pink','blue','green'].includes(r.cushion)?r.cushion:'pink',introSeen:r.introSeen===true};
 if(Array.isArray(r.gallery))s.gallery=r.gallery.slice(0,8).flatMap(g=>{if(!g||!['paint','build'].includes(g.kind))return[];if(g.kind==='paint'&&typeof g.image==='string'&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(g.image)&&g.image.length<250000)return[{kind:'paint',image:g.image}];if(g.kind==='build'&&Array.isArray(g.blocks)&&g.blocks.length<=300&&g.blocks.every(v=>Number.isInteger(v)&&v>=-1&&v<100))return[{kind:'build',blocks:g.blocks.slice()}];return[];});
 const disc=legacy.disc instanceof Set?legacy.disc:new Set(Array.isArray(legacy.disc)?legacy.disc:[]);
 const seeds={shells:'beach_clue',tidepool:'tide_found',fluffhome:'fluff_home',fluffkin:'fluff_found',feedfriend:'feed_friend'};
 for(const [id,event]of Object.entries(seeds))if(disc.has(id)&&!s.events.includes(event))s.events.push(event);
 if((legacy.fluffs||[]).some(f=>(typeof f==='string'?f:f.state)==='home'))for(const e of ['walk','fluff_found','fluff_home'])if(!s.events.includes(e))s.events.push(e);
 for(const [id,p]of Object.entries(record(legacy.learn)))if(p&&p.stars>0&&allowed.has('learn_'+id)&&!s.events.includes('learn_'+id))s.events.push('learn_'+id);
 settle(s);
 if(r.replay&&Object.prototype.hasOwnProperty.call(ADVENTURES,r.replay.id)&&s.completed.includes(r.replay.id))s.replay={id:r.replay.id,events:cleanEvents(r.replay.events)};
 return s;
}
function settle(s){const rewards=[];for(const [id,q]of Object.entries(ADVENTURES))if(q.steps.every(st=>s.events.includes(st.event))&&!s.completed.includes(id)){s.completed.push(id);if(!s.rewards.includes(q.reward)){s.rewards.push(q.reward);rewards.push(q.reward);}}return rewards;}
export function emitAdventure(s,event){
 const id=event.type==='learn'?'learn_'+event.id:event.type==='sea'?'sea_'+event.id:event.id;
 if(!allowed.has(id))return{changed:false,rewards:[]};
 let changed=false;if(!s.events.includes(id)){s.events.push(id);changed=true;}
 if(s.replay&&ADVENTURES[s.replay.id].steps.some(st=>st.event===id)&&!s.replay.events.includes(id)){s.replay.events.push(id);changed=true;if(ADVENTURES[s.replay.id].steps.every(st=>s.replay.events.includes(st.event)))s.replay=null;}
 const rewards=settle(s);return{changed,rewards};
}
export function replayAdventure(s,id){if(!Object.prototype.hasOwnProperty.call(ADVENTURES,id))return false;s.active=id;s.replay=s.completed.includes(id)?{id,events:[]}:null;return true;}
export function nextCatch(s){const result=['fish','boot','shell','bottle'][s.catches%4];s.catches=(s.catches+1)%1000000;return result;}
