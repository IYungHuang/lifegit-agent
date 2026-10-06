import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,emptyPlan} from '../src/data.js';
import {solutions} from '../src/rules.js';
import {openingHands,deal,swapOptions,swap} from '../src/deck.js';
const all=CARDS.map(c=>c.id);
test('every opening hand and every allowed swap remains solvable',()=>{
 const hands=openingHands();assert.ok(hands.length>10);
 for(const hand of hands){
  assert.equal(new Set(hand).size,6);assert.ok(solutions(hand).length);
  const s={hand,reserve:all.filter(id=>!hand.includes(id)),retired:[],swaps:2,plan:emptyPlan()};
  for(const old of hand)for(const replacement of swapOptions(s,old))assert.ok(solutions(hand.filter(id=>id!==old).concat(replacement)).length);
 }
});
test('empty pool, exhausted swaps and assigned cards preserve resources',()=>{
 const s={hand:['temple','bento','cafe'],reserve:[],retired:[],swaps:2,plan:emptyPlan()};
 assert.equal(swap(s,'temple').swaps,2);assert.deepEqual(swap(s,'temple').hand,s.hand);
 assert.deepEqual(swapOptions({...s,reserve:['tower'],swaps:0},'temple'),[]);
 assert.deepEqual(swapOptions({...s,plan:{slots:['park',null,null],links:[null,null,null]}},'park'),[]);
});
test('deals at random extremes and repeated swaps conserve 12 cards',()=>{
 for(const random of [()=>0,()=>0.999999]){
  let s={...deal(random),retired:[],swaps:2,plan:emptyPlan()};assert.equal(s.hand.length,6);
  for(let i=0;i<2;i++) {const old=s.hand.find(id=>swapOptions(s,id).length);assert.ok(old);s=swap(s,old,random);}
  assert.equal(s.swaps,0);assert.equal(new Set([...s.hand,...s.reserve,...s.retired]).size,12);
  assert.equal(s.retired.length,2);assert.ok(solutions(s.hand).length);
 }
});
