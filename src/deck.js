import {CARDS} from './data.js';
import {solutions} from './rules.js';
const all=CARDS.map(c=>c.id),cache=new Map();
const key=ids=>[...new Set(ids)].sort().join(',');
const solvable=ids=>{const k=key(ids);if(!cache.has(k))cache.set(k,solutions(ids).length>0);return cache.get(k);};
const seeds=solutions(all.filter(id=>!['taxi','car'].includes(id))).map(p=>p.slots);
const pick=(list,rng)=>list[Math.min(list.length-1,Math.max(0,Math.floor(rng()*list.length)))];
function shuffle(ids,rng){const out=[...ids];for(let i=out.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(rng()*(i+1))));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function openingHands(){
 const map=new Map();for(const seed of seeds){const rest=all.filter(id=>!seed.includes(id));
  for(let a=0;a<rest.length;a++)for(let b=a+1;b<rest.length;b++)for(let c=b+1;c<rest.length;c++){
   const ids=[...seed,rest[a],rest[b],rest[c]].sort();map.set(key(ids),ids);
  }
 }return [...map.values()];
}
export function deal(rng=Math.random){
 const seed=pick(seeds,rng),rest=shuffle(all.filter(id=>!seed.includes(id)),rng);
 return {hand:shuffle([...seed,...rest.slice(0,3)],rng),reserve:rest.slice(3)};
}
export function swapOptions(state,cardId){
 if(state.swaps<=0||!state.hand.includes(cardId))return [];
 const assigned=[...state.plan.slots,...state.plan.links].filter(Boolean);
 if(assigned.includes(cardId))return [];
 const owned=[...state.hand.filter(id=>id!==cardId),...assigned];
 return state.reserve.filter(id=>solvable([...owned,id]));
}
export function swap(state,cardId,rng=Math.random){
 const options=swapOptions(state,cardId);if(!options.length)return {...state,notice:'沒有可用的替換方案；換牌次數保留。'};
 const next=pick(options,rng);
 return {...state,hand:state.hand.map(id=>id===cardId?next:id),reserve:state.reserve.filter(id=>id!==next),retired:[...state.retired,cardId],swaps:state.swaps-1,notice:'已換一張新提案，仍保留可成交的安排。'};
}
