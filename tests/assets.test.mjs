import test from 'node:test';import assert from 'node:assert/strict';import {readFile,stat} from 'node:fs/promises';import {CARDS} from '../src/data.js';
test('all final artwork and font are local files',async()=>{
 const m=JSON.parse(await readFile('assets/manifest.json','utf8'));
 assert.deepEqual(Object.keys(m.portraits).sort(),['angry','calm','doubt','happy','interested']);assert.deepEqual(Object.keys(m.cards).sort(),CARDS.map(c=>c.id).sort());
 for(const path of [m.background,m.font,...Object.values(m.portraits),...Object.values(m.cards)]){assert.ok(path.startsWith('assets/'));assert.ok((await stat(path)).size>0);}
 assert.match(await readFile('assets/fonts/OFL.txt','utf8'),/SIL OPEN FONT LICENSE/);
});
test('entrypoint and styles contain no external runtime assets',async()=>{
 for(const path of ['index.html','styles/game.css'])assert.doesNotMatch(await readFile(path,'utf8'),/https?:\/\//);
});
test('essential route and card metadata use readable minimum sizes',async()=>{
 const css=await readFile('styles/game.css','utf8');
 // Inspect every base/override declaration for the essential metadata selectors.
 for(const selector of ['.route-link small','.card-kicker','.card-kicker>span']){
  const blocks=[...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(m=>m[1].split(',').map(s=>s.trim()).includes(selector));
  assert.ok(blocks.length);
  for(const [, , declarations] of blocks){const match=declarations.match(/font-size:(\d+)px/);if(match)assert.ok(Number(match[1])>=12,`${selector} is ${match[1]}px`);}
 }
});
