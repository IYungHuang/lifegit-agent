import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,CASE,TRAVEL} from '../src/data.js';
import {evaluate,solutions} from '../src/rules.js';
const plan={slots:['temple','bento','cafe'],links:[null,null,null]};
test('ordered costs, time, fatigue and inclusive limits',()=>{
 const e=evaluate(plan);assert.deepEqual([e.cost,e.arrival,e.fatigue],[2300,835,2]);assert.equal(e.success,true);
 assert.equal(evaluate(plan,CARDS,{...CASE,budget:2300,deadline:835,fatigueLimit:2},TRAVEL).success,true);
 for(const change of [{budget:2299},{deadline:834},{fatigueLimit:1}])assert.equal(evaluate(plan,CARDS,{...CASE,...change},TRAVEL).success,false);
});
test('invalid IDs, duplicates, shape and kinds cannot succeed',()=>{
 for(const p of [{...plan,slots:['temple','temple','cafe']},{...plan,links:['taxi','taxi',null]},{...plan,slots:['unknown','bento','cafe']},{...plan,slots:['cafe','bento','temple']},{slots:[],links:[]}])assert.equal(evaluate(p).valid,false);
});
test('missing slots block submission, transport replaces rather than adds',()=>{
 assert.equal(evaluate({...plan,slots:[null,'bento','cafe']}).complete,false);
 const e=evaluate({...plan,links:['taxi',null,null]}); assert.deepEqual([e.cost,e.arrival,e.fatigue],[5800,840,1]);
});
test('rest floors fatigue before subsequent travel',()=>{
 const cards=CARDS.map(c=>c.id==='cafe'?{...c,fatigue:-30}:c);
 assert.equal(evaluate(plan,cards).fatigue,1);
});
test('issues retain priority and solutions contain only valid arrangements',()=>{
 const e=evaluate(plan,CARDS,{...CASE,deadline:601,budget:0,fatigueLimit:0},TRAVEL);
 assert.deepEqual(e.issues.map(i=>i.code),['late','budget','fatigue']);
 const solved=solutions(['temple','bento','cafe','taxi']);assert.ok(solved.length);
 for(const p of solved)assert.equal(evaluate(p).success,true);
});
