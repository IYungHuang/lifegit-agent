import test from 'node:test';import assert from 'node:assert/strict';import {buildDialogue} from '../src/dialogue.js';import {evaluate} from '../src/rules.js';
const good={slots:['temple','bento','cafe'],links:[null,null,null]};
const bad={slots:['shopping','eel','park'],links:[null,null,null]};
test('objection follows actual issues and no imaginary praise',()=>{
 const lines=buildDialogue(null,{evaluation:evaluate(bad),plan:bad,spirit:2,outcome:null});
 assert.ok(lines.some(l=>l.targets.includes('total-fatigue')));assert.ok(!lines.some(l=>/不用走/.test(l.text)));
});
test('resolved fatigue without transport change uses general praise',()=>{
 const lines=buildDialogue({plan:bad,evaluation:evaluate(bad)},{plan:good,evaluation:evaluate(good),outcome:'won'});
 assert.ok(lines.some(l=>/休息|輕鬆/.test(l.text)));assert.ok(!lines.some(l=>/不用走/.test(l.text)));
});
test('lost result identifies unresolved conditions and success has three ratings',()=>{
 const lost=buildDialogue(null,{plan:bad,evaluation:evaluate(bad),outcome:'lost'});assert.ok(lost.at(-1).text.includes('下次'));
 const ratings=[];for(const wishes of [{photo:false,rest:false},{photo:true,rest:false},{photo:true,rest:true}])ratings.push(buildDialogue(null,{plan:good,evaluation:{...evaluate(good),wishes},outcome:'won'}).at(-1).text);
 assert.equal(new Set(ratings).size,3);
});
