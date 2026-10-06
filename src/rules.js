import {CARDS,CASE,TRAVEL} from './data.js';
/** Evaluate sequential activity/travel costs. Partial plans never connect across gaps. */
export function evaluate(plan,cards=CARDS,caseData=CASE,travel=TRAVEL){
 const e={complete:false,valid:true,success:false,cost:0,arrival:caseData.start,fatigue:0,wishes:{photo:false,rest:false},issues:[]};
 const invalid=()=>({...e,valid:false,issues:[{code:'invalid',targets:[]}]});
 if(!plan||!Array.isArray(plan.slots)||!Array.isArray(plan.links)||plan.slots.length!==3||plan.links.length!==3)return invalid();
 const byId=Object.fromEntries(cards.map(c=>[c.id,c]));
 const seen=new Set();
 for(const [kind,ids] of Object.entries(plan)){
  if(!['slots','links'].includes(kind))continue;
  for(let i=0;i<3;i++){
   const id=ids[i];if(id===null)continue;
   const c=byId[id];
   if(!c||seen.has(id))return invalid();
   seen.add(id);
   const allowed=kind==='links'?['transport']:i===0?['sight']:i===1?['meal']:['sight','rest'];
   if(!allowed.includes(c.kind))return invalid();
  }
 }
 e.complete=plan.slots.every(Boolean);
 for(let i=0;i<3;i++){
  const c=byId[plan.slots[i]];if(!c){e.issues.push({code:'missing',targets:[`slot-${i}`]});continue;}
  e.cost+=c.cost;e.arrival+=c.minutes;e.fatigue=Math.max(0,e.fatigue+c.fatigue);
  e.wishes.photo ||= c.tags.includes('photo');e.wishes.rest ||= c.tags.includes('rest');
  const next=i===2?caseData.dinnerArea:byId[plan.slots[i+1]]?.area;
  if(next){const connection=byId[plan.links[i]]||travel[c.area]?.[next];if(!connection)return invalid();
   e.cost+=connection.cost;e.arrival+=connection.minutes;e.fatigue=Math.max(0,e.fatigue+connection.fatigue);}
 }
 if(e.arrival>caseData.deadline)e.issues.push({code:'late',targets:['total-time']});
 if(e.cost>caseData.budget)e.issues.push({code:'budget',targets:['total-cost']});
 if(e.fatigue>caseData.fatigueLimit)e.issues.push({code:'fatigue',targets:['total-fatigue']});
 e.success=e.complete&&e.issues.length===0;return e;
}
/** Enumerates legal arrangements; no repeated card or duplicated transport. */
export function solutions(ids,cards=CARDS,caseData=CASE,travel=TRAVEL){
 const available=cards.filter(c=>ids.includes(c.id));
 const sights=available.filter(c=>c.kind==='sight'),meals=available.filter(c=>c.kind==='meal'),afternoons=available.filter(c=>['sight','rest'].includes(c.kind));
 const transport=[null,...available.filter(c=>c.kind==='transport').map(c=>c.id)],out=[];
 for(const a of sights)for(const b of meals)for(const c of afternoons){
  if(a.id===c.id)continue;
  for(const x of transport)for(const y of transport)for(const z of transport){
   const used=[x,y,z].filter(Boolean);if(new Set(used).size!==used.length)continue;
   const p={slots:[a.id,b.id,c.id],links:[x,y,z]};if(evaluate(p,cards,caseData,travel).success)out.push(p);
  }
 }return out;
}
