import {INTRO,CARDS} from './data.js';
import {evaluate} from './rules.js';
import {createGame,transition} from './state.js';
import {buildDialogue} from './dialogue.js';
import {createPresenter,createSound,readSettings,writeSettings} from './presentation.js';
import {render} from './view.js';
export function mount(root,{rng=Math.random,manifest,assetWarning=''}={}){
 const win=root.ownerDocument.defaultView;let storage;try{storage=win.localStorage;}catch{}
 let settings=readSettings(storage);if(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)settings.reducedMotion=true;
 let state=createGame(rng),disposed=false,presenter=null;
 const sound=createSound(()=>new (win.AudioContext||win.webkitAudioContext)());sound.setMuted(settings.muted);
 const ui={started:false,selected:null,showNeeds:false,expression:'calm',dialogueText:'',dialogueDone:false,targets:[],assetWarning};
 const paint=()=>{if(!disposed)render(root,state,evaluate(state.plan),settings,manifest,ui);};
 const focus=action=>root.querySelector(`[data-action="${action}"]`)?.focus({preventScroll:true});
 function dialogue(lines){
  presenter?.dispose();const session=state.session;
  presenter=createPresenter({
   onLine(line){ui.expression=line.expression;ui.targets=line.targets;ui.dialogueText='';ui.dialogueDone=false;paint();sound.play('dialogue');focus('advance');},
   onText(text,done){if(disposed||session!==state.session)return;ui.dialogueText=text;ui.dialogueDone=done;const p=root.querySelector('#dialogue-text');if(p)p.textContent=text;const live=root.querySelector('#dialogue-live');if(live&&done)live.textContent=text;},
   onDone(){if(disposed||session!==state.session)return;const ending=state.pending?.outcome;state=transition(state,{type:state.phase==='intro'?'INTRO_DONE':'REACTION_DONE'},rng);ui.targets=[];paint();if(ending==='won')sound.play('win');focus(state.phase==='result'?'restart':'submit');}
  });presenter.play(lines,settings);
 }
 function dispatch(action){
  const next=transition(state,action,rng);if(next===state)return;
  state=next;ui.selected=null;paint();
  if(action.type==='RESTART'){presenter?.dispose();ui.started=true;ui.expression='calm';ui.targets=[];ui.showNeeds=false;dialogue(INTRO);}
  else if(state.phase==='reaction')dialogue(buildDialogue(state.previous,state.pending));
  else if(action.type==='PLACE'){sound.play('paper');focus('submit');}
 }
 function click(event){
  const b=event.target.closest('button[data-action]');if(!b||!root.contains(b)||b.disabled)return;
  void sound.unlock();const action=b.dataset.action;
  if(ui.showNeeds&&!['close-needs'].includes(action))return;
  switch(action){
   case 'start':ui.started=true;dialogue(INTRO);break;
   case 'advance':presenter?.advance();break;
   case 'select':if(state.phase==='planning'){ui.selected=ui.selected===b.dataset.cardId?null:b.dataset.cardId;paint();}break;
   case 'cancel':ui.selected=null;paint();break;
   case 'place':if(ui.selected)dispatch({type:'PLACE',cardId:ui.selected,target:b.dataset.target,index:Number(b.dataset.index)});break;
   case 'remove':dispatch({type:'REMOVE',target:b.dataset.target,index:Number(b.dataset.index)});break;
   case 'swap':if(ui.selected)dispatch({type:'SWAP',cardId:ui.selected});break;
   case 'talk':dispatch({type:'ARM_TALK'});break;
   case 'submit':dispatch({type:'SUBMIT'});break;
   case 'restart':dispatch({type:'RESTART'});break;
   case 'needs':ui.showNeeds=true;paint();focus('close-needs');break;
   case 'close-needs':ui.showNeeds=false;paint();focus('needs');break;
   case 'mute':settings.muted=!settings.muted;sound.setMuted(settings.muted);writeSettings(storage,settings);paint();break;
   case 'motion':settings.reducedMotion=!settings.reducedMotion;writeSettings(storage,settings);paint();presenter?.setReducedMotion(settings.reducedMotion);break;
  }
 }
 function key(event){
  if(event.repeat&&(event.code==='Space'||event.key==='Enter')){event.preventDefault();return;}
  if(event.key==='Escape'){event.preventDefault();if(ui.showNeeds){ui.showNeeds=false;paint();focus('needs');}else{ui.selected=null;paint();}return;}
  if(ui.showNeeds&&event.key==='Tab'){const close=root.querySelector('[data-action="close-needs"]');event.preventDefault();close?.focus();return;}
  if(event.code==='Space'&&ui.started&&!ui.showNeeds&&['intro','reaction'].includes(state.phase)){
   // Space on settings buttons keeps its normal activation semantics.
   const focused=root.ownerDocument.activeElement;
   if(focused?.closest('nav'))return;
   event.preventDefault();presenter?.advance();
  }
 }
 function error(event){if(event.target.tagName==='IMG'){event.target.hidden=true;const n=root.querySelector('#asset-notice');ui.assetWarning='素材載入失敗；文字與操作仍可使用。';if(n)n.textContent=ui.assetWarning;}}
 root.addEventListener('click',click);root.addEventListener('keydown',key);root.addEventListener('error',error,true);paint();
 return {dispose(){disposed=true;presenter?.dispose();sound.dispose();root.removeEventListener('click',click);root.removeEventListener('keydown',key);root.removeEventListener('error',error,true);}};
}
/** Asset metadata is optional: missing files never disable the game rules. */
export async function boot(root,fetcher=globalThis.fetch){
 const defaults={background:'assets/art/office.png',portraits:Object.fromEntries(['calm','doubt','angry','interested','happy'].map(k=>[k,`assets/art/customer-${k}.png`])),cards:Object.fromEntries(CARDS.map(c=>[c.id,`assets/art/cards/${c.id}.png`]))};
 let manifest=defaults,assetWarning='';
 try{
  const response=await fetcher('assets/manifest.json');if(!response.ok)throw Error('missing');
  const data=await response.json();
  const local=path=>typeof path==='string'&&path.startsWith('assets/')&&!path.includes('..');
  if(!data||!local(data.background)||!Object.keys(defaults.portraits).every(k=>local(data.portraits?.[k]))||!CARDS.every(c=>local(data.cards?.[c.id])))throw Error('invalid');
  manifest=data;
 }catch{assetWarning='素材清單載入失敗，已使用本機預設路徑；遊戲仍可操作。';}
 return mount(root,{manifest,assetWarning});
}
if(typeof document!=='undefined'){
 const root=document.querySelector('#game');if(root)void boot(root);
}
