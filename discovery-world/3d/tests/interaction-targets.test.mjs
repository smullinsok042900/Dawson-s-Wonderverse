import test from 'node:test';import assert from 'node:assert/strict';
import {isVisibleTarget} from '../src/interaction-targets.js';
test('hidden ancestors and detached objects cannot receive world taps',()=>{const scene={visible:true,parent:null},parent={visible:true,parent:scene},mesh={visible:true,parent};assert.equal(isVisibleTarget(mesh,scene),true);parent.visible=false;assert.equal(isVisibleTarget(mesh,scene),false);parent.visible=true;parent.parent=null;assert.equal(isVisibleTarget(mesh,scene),false);});
test('invisible materials can remain intentional interaction surfaces',()=>{const scene={visible:true,parent:null},mesh={visible:true,parent:scene,material:{visible:false}};assert.equal(isVisibleTarget(mesh,scene),true);});
