import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {mount} from '../src/main.js';import {solutions} from '../src/rules.js';
const manifest={background:'assets/art/office.png',portraits:Object.fromEntries(['calm','doubt','angry','happy','interested'].map(k=>[k,`assets/art/customer-${k}.png`])),cards:{}};
function setup(){const dom=new JSDOM('<main id="game"></main>',{url:'http://test.invalid'});const root=dom.window.document.querySelector('#game');dom.window.localStorage.setItem('lifespire-settings','{"muted":true,"reducedMotion":true}');const app=mount(root,{manifest,rng:()=>0});return {dom,root,app};}
function click(root,selector){const b=root.querySelector(selector);assert.ok(b,selector);b.click();}
test('DOM flow from menu through arrangement to successful result and restart',()=>{
 const {root,app}=setup();click(root,'[data-action="start"]');for(let i=0;i<3;i++)click(root,'[data-action="advance"]');
 assert.equal(root.querySelector('.game-stage').dataset.phase,'planning');
 const hand=[...root.querySelectorAll('[data-action="select"]')].map(b=>b.dataset.cardId);assert.equal(hand.length,6);
 const plan=solutions(hand)[0];
 for(let i=0;i<3;i++){click(root,`[data-card-id="${plan.slots[i]}"]`);click(root,`[data-action="place"][data-target="slot"][data-index="${i}"]`);}
 for(let i=0;i<3;i++)if(plan.links[i]){click(root,`[data-card-id="${plan.links[i]}"]`);click(root,`[data-action="place"][data-target="link"][data-index="${i}"]`);}
 click(root,'[data-action="submit"]');assert.equal(root.querySelector('.game-stage').dataset.phase,'reaction');
 click(root,'[data-action="advance"]');assert.match(root.textContent,/提案成交/);
 click(root,'[data-action="restart"]');assert.equal(root.querySelector('.game-stage').dataset.phase,'intro');app.dispose();
});
test('escape clears selection, repeated space cannot skip and preferences survive restart',()=>{
 const {root,dom,app}=setup();click(root,'[data-action="start"]');const first=root.querySelector('#dialogue-text').textContent;
 root.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'Space',repeat:true,bubbles:true}));assert.equal(root.querySelector('#dialogue-text').textContent,first);
 for(let i=0;i<3;i++)click(root,'[data-action="advance"]');click(root,'[data-action="select"]');
 root.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(root.querySelectorAll('.card.selected').length,0);
 click(root,'[data-action="restart"]');assert.equal(root.querySelector('[data-action="motion"]').getAttribute('aria-pressed'),'true');app.dispose();
});
test('missing and malformed asset manifest leave the game playable with a warning',async()=>{
 const {boot}=await import('../src/main.js');
 for(const fetcher of [async()=>{throw Error('offline')},async()=>({ok:true,json:async()=>null}),async()=>({ok:true,json:async()=>({portraits:[]})})]){
  const dom=new JSDOM('<main id="game"></main>',{url:'http://test.invalid'});const root=dom.window.document.querySelector('#game');
  const app=await boot(root,fetcher);assert.ok(root.querySelector('[data-action="start"]'));assert.match(root.querySelector('#asset-notice').textContent,/素材/);app.dispose();
 }
});
test('three rejected submissions reach failure and restart restores the encounter',()=>{
 const {root,app}=setup();click(root,'[data-action="start"]');for(let i=0;i<3;i++)click(root,'[data-action="advance"]');
 for(const [index,id] of ['temple','bento','shopping'].entries()){click(root,`[data-card-id="${id}"]`);click(root,`[data-action="place"][data-target="slot"][data-index="${index}"]`);}
 for(let n=0;n<3;n++){click(root,'[data-action="submit"]');for(let i=0;i<2;i++)click(root,'[data-action="advance"]');}
 assert.match(root.textContent,/企劃精神耗盡/);click(root,'[data-action="restart"]');for(let i=0;i<3;i++)click(root,'[data-action="advance"]');
 assert.equal(root.querySelectorAll('[data-action="select"]').length,6);assert.equal(root.querySelector('.spirit').getAttribute('aria-label'),'3 格精神');app.dispose();
});
test('missing image reports a warning and the needs sheet restores focus',()=>{
 const {root,dom,app}=setup();root.querySelector('.office').dispatchEvent(new dom.window.Event('error'));
 assert.match(root.querySelector('#asset-notice').textContent,/素材載入失敗/);
 click(root,'[data-action="needs"]');assert.equal(dom.window.document.activeElement.dataset.action,'close-needs');
 root.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(dom.window.document.activeElement.dataset.action,'needs');
 assert.match(root.querySelector('#asset-notice').textContent,/素材載入失敗/);app.dispose();
});
