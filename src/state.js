import {CARD_BY_ID,emptyPlan} from './data.js';
import {evaluate} from './rules.js';
import {deal,swap} from './deck.js';
export function createGame(rng=Math.random,session=0){return {phase:'intro',...deal(rng),retired:[],plan:emptyPlan(),swaps:2,spirit:3,talk:'ready',previous:null,pending:null,outcome:null,notice:'',session};}
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;};
export function transition(state,action,rng=Math.random){
 if(action.type==='RESTART')return createGame(rng,state.session+1);
 if(action.type==='INTRO_DONE')return state.phase==='intro'?{...state,phase:'planning'}:state;
 if(action.type==='REACTION_DONE'){
  if(state.phase!=='reaction'||!state.pending)return state;
  const p=state.pending;return {...state,spirit:p.spirit,talk:p.talk,outcome:p.outcome,phase:p.outcome?'result':'planning',previous:{plan:p.plan,evaluation:p.evaluation},pending:null,notice:p.outcome?'':'客戶提出了意見。調整方案，再試一次。'};
 }
 if(state.phase!=='planning')return state;
 const reject=notice=>({...state,notice});
 switch(action.type){
  case 'ARM_TALK':return state.talk==='ready'?{...state,talk:'armed',notice:'已準備話術：下次有效提案即使被退回，也不損失精神。'}:state;
  case 'SWAP':return swap(state,action.cardId,rng);
  case 'PLACE':case 'REMOVE':{
   const {target,index,cardId}=action;
   if(!['slot','link'].includes(target)||!Number.isInteger(index)||index<0||index>2)return reject('請選擇有效的行程位置。');
   const field=target==='slot'?'slots':'links',plan=structuredClone(state.plan),old=plan[field][index];
   if(action.type==='REMOVE')return old?{...state,plan:{...plan,[field]:plan[field].map((id,i)=>i===index?null:id)},hand:[...state.hand,old],notice:'已撤回手牌。'}:state;
   if(!state.hand.includes(cardId)||!CARD_BY_ID[cardId])return reject('這張牌不在手牌中。');
   plan[field][index]=cardId;if(!evaluate(plan).valid)return reject('這張牌不適合這個時段，請選擇亮起的位置。');
   return {...state,plan,hand:[...state.hand.filter(id=>id!==cardId),...(old?[old]:[])],notice:'已更新安排；數值是預估，提交前可自由修改。'};
  }
  case 'SUBMIT':{
   const evaluation=evaluate(state.plan);
   if(!evaluation.valid||!evaluation.complete)return reject('請先安排上午景點、午餐與下午活動，再提交提案。');
   const spirit=evaluation.success||state.talk==='armed'?state.spirit:Math.max(0,state.spirit-1);
   const outcome=evaluation.success?'won':spirit===0?'lost':null;
   const pending=freeze({plan:structuredClone(state.plan),evaluation,spirit,talk:state.talk==='armed'?'spent':state.talk,outcome});
   return {...state,phase:'reaction',pending,notice:''};
  }
  default:return state;
 }
}
