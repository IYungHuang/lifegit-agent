const objection={
 late:'晚餐都訂好了，你還要我遲到？休假不是障礙賽。',
 budget:'等等，這是一天的預算，還是我的年終獎金？',
 fatigue:'你把這叫休息？我的手錶會以為我在逃難。'
};
export function buildDialogue(previous,pending){
 const e=pending.evaluation,lines=[];
 if(previous){
  const old=previous.evaluation;
  const resolved=old.issues.filter(i=>!e.issues.some(j=>j.code===i.code));
  if(resolved.some(i=>i.code==='fatigue')){
   const transportChanged=pending.plan.links.some((id,i)=>id&&id!==previous.plan.links[i]);
   lines.push({text:transportChanged&&e.fatigue<old.fatigue?'這段不用走了？好，你終於開始理解休假了。':'終於能好好休息了。這個安排，輕鬆多了。',expression:'interested',targets:['total-fatigue']});
  }else if(resolved.some(i=>i.code==='budget'))lines.push({text:'這個價格可以。我的荷包也需要休假。',expression:'interested',targets:['total-cost']});
  else if(resolved.some(i=>i.code==='late'))lines.push({text:'這次趕得上晚餐了。總算不用邊跑邊吃。',expression:'interested',targets:['total-time']});
 }
 if(e.success){
  const score=Number(e.wishes.photo)+Number(e.wishes.rest);
  lines.push({text:['好，至少能順利走完。下次再幫我多安排一點驚喜吧。','不錯，總算有一點度假的樣子了。就照這份走。','有照片、有休息，晚餐還不會遲到？成交！這才叫放假。'][score],expression:'happy',targets:[]});
 }else{
  const issue=e.issues.find(i=>objection[i.code]);
  lines.push({text:objection[issue?.code]||'這份安排還沒完成，再幫我看一下吧。',expression:'angry',targets:issue?.targets||[]});
  lines.push({text:pending.outcome==='lost'?'算了，我先回去冷靜一下。下次，記得留點時間給休假。':'我不是不想玩，只是不想回來之後，還要再請一天假。',expression:'doubt',targets:issue?.targets||[]});
 }return lines;
}
