import test from 'node:test';import assert from 'node:assert/strict';import {createPresenter,readSettings,writeSettings,createSound} from '../src/presentation.js';
const line={text:'第一句',expression:'calm',targets:[]};
test('dispose invalidates stale callbacks; advance completes then moves once',()=>{
 const queue=[];let done=0,text='';const p=createPresenter({schedule:fn=>(queue.push(fn),queue.length),cancel:()=>{},onText:t=>text=t,onLine:()=>{},onDone:()=>done++});
 p.play([line],{reducedMotion:false});p.dispose();for(const fn of queue.splice(0))fn();assert.equal(done,0);
 p.play([line],{reducedMotion:false});p.advance();assert.equal(text,'第一句');assert.equal(done,0);p.advance();p.advance();assert.equal(done,1);
 for(const fn of queue.splice(0))fn();assert.equal(done,1);
});
test('reduced motion schedules no typing; new play cancels old text',()=>{
 let calls=0;const p=createPresenter({schedule:()=>calls++,cancel:()=>{},onText:()=>{},onLine:()=>{},onDone:()=>{}});
 p.play([line],{reducedMotion:true});assert.equal(calls,0);
});
test('bad or denied storage retains safe defaults',()=>{
 assert.deepEqual(readSettings({getItem:()=>'{broken'}),{muted:false,reducedMotion:false});
 assert.doesNotThrow(()=>writeSettings({setItem:()=>{throw Error('denied')}},{muted:true,reducedMotion:true}));
 assert.deepEqual(readSettings({getItem:()=>'{"muted":"false","reducedMotion":true}'}),{muted:false,reducedMotion:true});
});
test('denied audio activation never throws',async()=>{
 const sound=createSound(()=>({resume:()=>Promise.reject(Error('denied')),close:()=>Promise.resolve()}));await assert.doesNotReject(()=>sound.unlock());assert.doesNotThrow(()=>sound.play('paper'));sound.dispose();
});
test('enabling reduced motion also applies to subsequent dialogue lines',()=>{
 let schedules=0,text='';const p=createPresenter({schedule:()=>++schedules,cancel:()=>{},onText:t=>text=t,onLine:()=>{},onDone:()=>{}});
 p.play([line,{...line,text:'第二句'}],{reducedMotion:false});p.setReducedMotion(true);const before=schedules;
 assert.equal(text,'第一句');p.advance();assert.equal(text,'第二句');assert.equal(schedules,before);p.dispose();
});
