import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventureState, emitAdventure, ADVENTURES, nextCatch, replayAdventure } from '../src/adventure-state.js';

test('old saves seed only proven achievements and preserve unrelated fields', () => {
 const old={disc:new Set(['shells','fishing']),fluffs:['home'],crown:true,wand:true};
 const s=createAdventureState(null,old);
 assert.ok(s.events.includes('beach_clue')); assert.ok(!s.events.includes('fish_caught'));
 assert.ok(s.events.includes('fluff_home')); assert.equal(old.crown,true); assert.equal(old.wand,true);
 assert.ok(!s.events.includes('treasure_dug'));
});
test('malformed adventure saves default safely, bound data and reject invented rewards',()=>{
 const s=createAdventureState({events:['fish_caught','bogus',null],rewards:['pirate','bogus'],active:'bogus', catches:-8, gallery:[{kind:'bogus'}]});
 assert.deepEqual(s.events,['fish_caught']); assert.deepEqual(s.rewards,[]); assert.equal(s.active,null); assert.equal(s.catches,0); assert.deepEqual(s.gallery,[]);
});
test('pier accepts out of order discovery and grants its souvenir exactly once',()=>{
 const s=createAdventureState();
 for(const id of ['treasure_dug','fish_caught','beach_clue']) emitAdventure(s,{type:'activity',id});
 assert.ok(!s.rewards.includes('pirate'));
 let result=emitAdventure(s,{type:'activity',id:'tide_found'});
 assert.ok(result.rewards.includes('pirate')); assert.ok(s.completed.includes('pier'));
 result=emitAdventure(s,{type:'activity',id:'tide_found'}); assert.equal(result.changed,false); assert.deepEqual(result.rewards,[]);
 assert.equal(s.rewards.filter(x=>x==='pirate').length,1);
});
test('replay has fresh steps without erasing permanent discoveries or duplicating prizes',()=>{
 const s=createAdventureState(); for(const step of ADVENTURES.pier.steps)emitAdventure(s,{type:'activity',id:step.event});
 replayAdventure(s,'pier'); assert.equal(s.active,'pier'); assert.deepEqual(s.replay.events,[]);
 for(const step of ADVENTURES.pier.steps)emitAdventure(s,{type:'activity',id:step.event});
 assert.equal(s.replay,null); assert.equal(s.rewards.filter(x=>x==='pirate').length,1);
 assert.ok(s.events.includes('tide_found'));
});
test('catch cycle guarantees a fish and clue and survives JSON reload',()=>{
 let s=createAdventureState(); const catches=[];
 for(let i=0;i<8;i++){catches.push(nextCatch(s));s=createAdventureState(JSON.parse(JSON.stringify(s)));}
 assert.deepEqual(catches.slice(0,4),['fish','boot','shell','bottle']); assert.equal(s.catches,8);
});
test('learning unlocks the right lasting changes without depending on a companion',()=>{
 const s=createAdventureState(); emitAdventure(s,{type:'learn',id:'colors'}); emitAdventure(s,{type:'learn',id:'count'}); emitAdventure(s,{type:'learn',id:'pattern'});
 assert.ok(s.events.includes('learn_colors')); assert.ok(s.events.includes('learn_count')); assert.ok(s.events.includes('learn_pattern'));
});
test('all adventure steps have pictures, replayable speech and reachable destinations',()=>{
 for(const q of Object.values(ADVENTURES))for(const step of q.steps){assert.ok(step.icon);assert.ok(step.say);assert.ok(Number.isFinite(step.x));}
});
test('inherited object names cannot become adventure ids',()=>{
 for(const id of ['constructor','toString','__proto__']){
  const s=createAdventureState({active:id,replay:{id,events:[]},introSeen:true});
  assert.equal(s.active,null);assert.equal(replayAdventure(s,id),false);
 }
});
