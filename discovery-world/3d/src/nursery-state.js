// No wall-clock needs: friends are always safe when the game is closed.
export const COLORS=['#ff91b5','#ffd478','#8fd8bc','#91c9f7','#b7a1ed','#fff4df'];
export const PETS=[
 {id:'pip',name:'Pip',color:'#ffc1a0',accent:'#ee9278',food:'🍓',trait:'Pip loves berries and bouncing!',shape:'ears'},
 {id:'moss',name:'Moss',color:'#a6dfbd',accent:'#66ad87',food:'🥕',trait:'Moss loves carrots and gentle brushing!',shape:'leaves'},
 {id:'twinkle',name:'Twinkle',color:'#cfb4ed',accent:'#9a7bc9',food:'🍎',trait:'Twinkle loves apples and playing catch!',shape:'stars'}
];
const CARE=['feed','bath','brush','play'];
const color=v=>COLORS.includes(v)?v:COLORS[0];
const coord=v=>Number.isFinite(v)&&v>=0&&v<=200;
export function cleanDesign(raw){
 const marks=[];
 for(const m of (Array.isArray(raw?.marks)?raw.marks:[]).slice(0,80)){
  if(!m||!COLORS.includes(m.color))continue;
  if(['star','heart','flower'].includes(m.type)&&coord(m.x)&&coord(m.y))marks.push({type:m.type,x:m.x,y:m.y,color:m.color});
  else if(m.type==='line'&&Array.isArray(m.points)){
   const points=m.points.slice(0,100).filter(p=>Array.isArray(p)&&p.length===2&&p.every(coord)).map(p=>p.slice());
   if(points.length)marks.push({type:'line',points,color:m.color});
  }
 }
 return {color:color(raw?.color),marks};
}
export function createNursery(raw){
 const s={v:1,selected:Number.isInteger(raw?.selected)&&raw.selected>=0&&raw.selected<3?raw.selected:0,pets:[]};
 for(let i=0;i<3;i++){
  const r=raw?.pets?.[i],prev=s.pets[i-1];
  const unlocked=i===0||prev.hatched&&CARE.every(a=>prev.care.includes(a));
  const taps=unlocked&&Number.isInteger(r?.taps)?Math.max(0,Math.min(3,r.taps)):0;
  s.pets.push({unlocked,hatched:taps===3,taps,care:taps===3?CARE.filter(a=>Array.isArray(r?.care)&&r.care.includes(a)):[],asleep:taps===3&&r?.asleep===true,blanket:cleanDesign(r?.blanket),outfit:cleanDesign(r?.outfit),room:COLORS.includes(r?.room)?r.room:COLORS[i+1]});
 }
 if(!s.pets[s.selected].unlocked)s.selected=0;
 return s;
}
export function hatchPet(s,i){const p=s.pets[i];if(!p?.unlocked||p.hatched)return false;p.taps++;p.hatched=p.taps===3;return true;}
export function carePet(s,i,action){
 const p=s.pets[i];if(!p?.hatched||![...CARE,'sleep','wake'].includes(action))return false;
 if(action==='sleep'){p.asleep=true;return true;}p.asleep=false;
 if(CARE.includes(action)&&!p.care.includes(action))p.care.push(action);
 if(i<2&&CARE.every(a=>p.care.includes(a)))s.pets[i+1].unlocked=true;
 return true;
}
export function applyDesign(s,i,kind,raw){const p=s.pets[i];if(!p?.hatched||!['blanket','outfit'].includes(kind))return false;p[kind]=cleanDesign(raw);return true;}
