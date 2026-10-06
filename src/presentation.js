export function createPresenter({schedule=setTimeout,cancel=clearTimeout,onText,onLine,onDone}){
 let lines=[],index=0,position=0,timer=null,generation=0,active=false,reduced=false;
 const stop=()=>{generation++;if(timer!==null)cancel(timer);timer=null;};
 const publish=()=>{onText(lines[index].text.slice(0,position),position>=lines[index].text.length);};
 function type(){const token=generation;timer=schedule(()=>{if(token!==generation||!active)return;position++;publish();if(position<lines[index].text.length)type();},26);}
 function show(){stop();position=reduced?lines[index].text.length:0;onLine(lines[index]);publish();if(!reduced)type();}
 return {
  play(next,settings={}){stop();lines=next;index=0;active=lines.length>0;reduced=!!settings.reducedMotion;if(active)show();else onDone();},
  advance(){if(!active)return;if(position<lines[index].text.length){stop();position=lines[index].text.length;publish();return;}
   index++;if(index<lines.length)show();else{stop();active=false;onDone();}},
  setReducedMotion(value){reduced=!!value;if(reduced&&active){stop();position=lines[index].text.length;publish();}},
  dispose(){stop();active=false;}
 };
}
export function readSettings(storage){try{const v=JSON.parse(storage?.getItem('lifespire-settings')||'{}');return {muted:v?.muted===true,reducedMotion:v?.reducedMotion===true};}catch{return {muted:false,reducedMotion:false};}}
export function writeSettings(storage,settings){try{storage?.setItem('lifespire-settings',JSON.stringify(settings));}catch{/* In-memory preferences remain effective. */}}
export function createSound(factory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()){
 let ctx=null,ready=false,muted=false;
 return {
  async unlock(){try{ctx ||= factory();await ctx.resume();ready=true;}catch{ready=false;}},
  play(kind){if(!ready||muted||!ctx)return;try{
   const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=kind==='paper'?'triangle':'sine';
   oscillator.frequency.setValueAtTime(kind==='win'?660:kind==='dialogue'?330:180,ctx.currentTime);
   gain.gain.setValueAtTime(0.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1);
   oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+0.11);
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }catch{/* Audio is optional. */}},
  setMuted(value){muted=value;},
  dispose(){ready=false;try{const closing=ctx?.close();closing?.catch(()=>{});}catch{}ctx=null;}
 };
}
