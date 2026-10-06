import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,transition} from '../src/state.js';
const good={slots:['temple','bento','cafe'],links:[null,null,null]};
const bad={slots:['shopping','eel','park'],links:[null,null,null]};
const setup=plan=>({...createGame(()=>0),phase:'planning',plan,hand:['tower','taxi','car']});
test('submit locks and settles exactly once',()=>{
 let s=transition(setup(good),{type:'SUBMIT'});assert.equal(s.phase,'reaction');assert.deepEqual(transition(s,{type:'SUBMIT'}),s);
 s=transition(s,{type:'REACTION_DONE'});assert.equal(s.outcome,'won');assert.deepEqual(transition(s,{type:'REACTION_DONE'}),s);
});
test('missing does not charge; success at last spirit wins',()=>{
 let s=transition(createGame(()=>0),{type:'INTRO_DONE'});s=transition(s,{type:'ARM_TALK'});s=transition(s,{type:'SUBMIT'});
 assert.equal(s.spirit,3);assert.equal(s.talk,'armed');assert.equal(s.phase,'planning');
 s=transition({...setup(good),spirit:1},{type:'SUBMIT'});assert.equal(s.pending.outcome,'won');
});
test('three failures lose; talk shields only one submission',()=>{
 let s=setup(bad);s=transition(s,{type:'ARM_TALK'});
 for(let i=0;i<4;i++){s=transition(s,{type:'SUBMIT'});s=transition(s,{type:'REACTION_DONE'});assert.equal(s.spirit,3-i);}
 assert.equal(s.outcome,'lost');assert.equal(s.talk,'spent');
});
test('placement and removal conserve cards; bad targets do not mutate resources',()=>{
 let s={...createGame(()=>0),phase:'planning',hand:['temple','bento','cafe','tower','taxi','car']};
 s=transition(s,{type:'PLACE',cardId:'temple',target:'slot',index:0});
 s=transition(s,{type:'PLACE',cardId:'tower',target:'slot',index:0});assert.ok(s.hand.includes('temple'));
 for(const action of [{type:'PLACE',cardId:'bento',target:'slot',index:8},{type:'PLACE',cardId:'bento',target:'slot',index:0},{type:'PLACE',cardId:'ghost',target:'link',index:0}]){
  const n=transition(s,action);assert.deepEqual(n.plan,s.plan);assert.deepEqual(n.hand,s.hand);
 }
 s=transition(s,{type:'REMOVE',target:'slot',index:0});assert.equal(s.hand.length,6);assert.equal(new Set(s.hand).size,6);
});
test('restart clears pending and advances session; frozen snapshot cannot be altered',()=>{
 const s=transition(setup(bad),{type:'SUBMIT'});assert.ok(Object.isFrozen(s.pending.plan.slots));
 const next=transition(s,{type:'RESTART'},()=>0);assert.equal(next.pending,null);assert.equal(next.session,s.session+1);assert.equal(next.spirit,3);
});
