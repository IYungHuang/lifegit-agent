import {CARD_BY_ID,AREAS,CASE,TRAVEL} from './data.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const yen=n=>`¥${n.toLocaleString('en-US')}`;
const kinds={sight:'景點',meal:'餐飲',rest:'休息',transport:'交通'};
const fatigue=n=>n<0?`回復 ${-n}`:`疲勞 +${n}`;
const button=(label,action,attrs='',className='')=>`<button type="button" class="${className}" data-action="${action}" data-key="${action}" ${attrs}>${label}</button>`;
const errors={late:'晚餐會遲到',budget:'預算超支',fatigue:'客戶太累',missing:'行程尚未完成',invalid:'安排無效'};
export function render(root,state,e,settings,manifest,ui){
 const previousFocus=root.ownerDocument.activeElement?.getAttribute('data-key');
 const planning=state.phase==='planning',speaking=ui.started&&['intro','reaction'].includes(state.phase),selected=CARD_BY_ID[ui.selected];
 const can=(target,index)=>planning&&selected&&(target==='link'?selected.kind==='transport':index===0?selected.kind==='sight':index===1?selected.kind==='meal':['sight','rest'].includes(selected.kind));
 const emphasis=id=>ui.targets?.includes(id)?' questioned':'';
 function slot(index){const c=CARD_BY_ID[state.plan.slots[index]],legal=can('slot',index);return `<article class="route-stop ${c?'filled':''} ${legal?'legal':''}${emphasis(`slot-${index}`)}" id="slot-${index}">
 <span class="stop-label">${['01　上午','02　午餐','03　下午'][index]}</span>
 <button class="slot-place" type="button" data-action="place" data-key="slot-${index}" data-target="slot" data-index="${index}" ${!legal?'disabled':''}>
 ${c?`<strong>${esc(c.name)}</strong><span>${AREAS[c.area]} · ${c.minutes} 分鐘</span><span>${yen(c.cost)} · ${fatigue(c.fatigue)}</span>`:`<strong class="empty-mark">＋</strong><span>${['安排景點','安排午餐','景點或休息'][index]}</span>`}
 ${legal?'<small>放在這裡 ↓</small>':''}</button>
 ${c&&planning?`<button class="remove" type="button" aria-label="撤回${esc(c.name)}" data-action="remove" data-key="remove-slot-${index}" data-target="slot" data-index="${index}">撤回 ↩</button>`:''}</article>`;}
 function link(index){const c=CARD_BY_ID[state.plan.links[index]],legal=can('link',index),from=CARD_BY_ID[state.plan.slots[index]]?.area,to=index===2?CASE.dinnerArea:CARD_BY_ID[state.plan.slots[index+1]]?.area;
 const travel=c||(from&&to?TRAVEL[from][to]:null);
 return `<div class="route-link ${legal?'legal':''}${emphasis(`link-${index}`)}" id="link-${index}"><button type="button" data-action="place" data-key="link-${index}" data-target="link" data-index="${index}" ${!legal?'disabled':''}><span class="link-arrow">→</span><span>${c?esc(c.name):'一般交通'}</span><small>${travel?`${travel.minutes}分 · ${yen(travel.cost)} · 疲勞 ${travel.fatigue}`:'待安排'}${legal?' · 可放置':''}</small></button>${c&&planning?`<button class="remove" type="button" aria-label="撤回${esc(c.name)}" data-action="remove" data-key="remove-link-${index}" data-target="link" data-index="${index}">撤回</button>`:''}</div>`;}
 function card(id){const c=CARD_BY_ID[id];return `<button type="button" title="${esc(c.description)}" class="card ${c.kind} ${ui.selected===id?'selected':''}" data-action="select" data-card-id="${id}" data-key="card-${id}" aria-pressed="${ui.selected===id}" ${!planning?'disabled':''}>
 <span class="card-kicker">${kinds[c.kind]} <span>${c.area?AREAS[c.area]:'替代一段移動'}</span></span>
 <img src="${esc(manifest.cards[id]||`assets/art/cards/${id}.png`)}" alt="" class="card-art">
 <strong>${esc(c.name)}</strong><span class="card-stats">${c.minutes} 分 · ${yen(c.cost)}</span>
 <span class="card-effect">${fatigue(c.fatigue)}${c.tags.includes('photo')?' · 拍照':''}${c.kind==='rest'?' · 休息':''}</span>
 </button>`;}
 const score=Number(e.wishes.photo)+Number(e.wishes.rest);
 root.innerHTML=`<div class="game-stage ${speaking?'speaking':''} ${!ui.started?'menu':''} ${state.phase==='result'?'finished':''} ${settings.reducedMotion?'reduced-motion':''}" data-phase="${state.phase}">
 <img class="office" src="${esc(manifest.background)}" alt="旅行社接待室"><div class="scene-shade"></div>
 <header class="hud"><div class="brand"><span class="brand-mark">L.</span><div><b>LIFESPIRE</b><span>好好放假旅行社</span></div></div>
 <div class="hud-resource"><span>企劃精神</span><b class="spirit" aria-label="${state.spirit} 格精神">${'◆'.repeat(state.spirit)}${'◇'.repeat(3-state.spirit)}</b></div>
 <div class="hud-resource${emphasis('total-cost')}" id="total-cost"><span>剩餘預算${!e.complete?' · 暫估':''}</span><b class="${e.cost>CASE.budget?'danger':''}">${yen(CASE.budget-e.cost)}</b></div>
 <div class="hud-resource${emphasis('total-time')}" id="total-time"><span>預估抵達${!e.complete?' · 未排完':''}</span><b class="${e.arrival>CASE.deadline?'danger':''}">${clock(e.arrival)} <small>/ 18:30</small></b></div>
 <nav aria-label="遊戲設定">${button('需求','needs',`aria-expanded="${ui.showNeeds}"`)}${button(settings.muted?'音效：關':'音效：開','mute',`aria-pressed="${settings.muted}"`)}${button('減少動態','motion',`aria-pressed="${settings.reducedMotion}"`)}${ui.started?button('重新接案','restart'):''}</nav></header>
 <section class="theater" aria-label="客戶接待">
 <div class="case-heading"><span class="eyebrow">CASE 001 · TOKYO</span><h1>這次，<br>我只想好好放假。</h1><p>一份行程，拯救一位快沒電的上班族。</p></div>
 <figure class="customer"><img id="customer-portrait" src="${esc(manifest.portraits[ui.expression||'calm'])}" alt="客戶阿哲：${{calm:'平靜',doubt:'懷疑',angry:'抗議',interested:'心動',happy:'滿意'}[ui.expression||'calm']}"><figcaption><b>阿哲</b><span>終於請到假的上班族</span></figcaption></figure>
 ${!ui.started?`<div class="welcome"><span class="stamp">本日第一位客人</span><h2>安排旅行。<br>也安排一點喘息。</h2><p>抽取提案、排出行程，<br>在客戶的嘆氣聲中保住你的精神。</p>${button('開始接案　→','start','','primary')}<small>單人試玩 · 每次接案都有不同手牌</small></div>`:''}
 ${planning?`<aside class="brief-note"><span>客戶的小小心願</span><b>「有照片，也有休息。」</b><p>先選手牌，再點亮起的位置。<br>提交前，可隨時撤回重排。</p></aside>`:''}
 ${speaking?`<section class="dialogue" aria-label="客戶對話"><div class="speaker-label">阿哲 <span>／ 客戶</span></div><p id="dialogue-text">${esc(ui.dialogueText||'')}</p><span id="dialogue-live" class="sr-only" aria-live="polite">${ui.dialogueDone?esc(ui.dialogueText||''):''}</span>${button('繼續　▸','advance','aria-label="顯示完整台詞或繼續對話"','advance')}<small>空白鍵 / 點擊繼續</small></section>`:''}
 ${state.phase==='result'?`<section class="result-sheet"><span class="stamp">${state.outcome==='won'?'APPROVED':'TRY AGAIN'}</span><h2>${state.outcome==='won'?'提案成交！':'這案，先緩一緩。'}</h2><p>${state.outcome==='won'?['順利成行','有點心動','完美假期'][score]:'企劃精神耗盡。休息一下，再接下一案。'}</p><div class="result-details"><span>行程花費 <b>${yen(e.cost)}</b></span><span>抵達晚餐 <b>${clock(e.arrival)}</b></span><span>旅程疲勞 <b>${e.fatigue} / 6</b></span></div><p>${state.outcome==='won'?`額外願望：${score} / 2 達成`:`待改善：${e.issues.map(i=>errors[i.code]).join('、')}`}</p>${button('重新接案　→','restart','','primary')}</section>`:''}
 </section>
 <section class="desk ${!ui.started?'desk-hidden':''}" aria-label="行程與提案">
 <div class="journey"><div class="journey-heading"><div><span class="eyebrow">YOUR ITINERARY</span><h2>東京・一日休假提案</h2></div><div class="fatigue-meter${emphasis('total-fatigue')}" id="total-fatigue">疲勞 <b class="${e.fatigue>6?'danger':''}">${e.fatigue} / 6</b><span>${e.wishes.photo?'✓':'○'} 拍照　${e.wishes.rest?'✓':'○'} 休息</span></div></div>
 <div class="route">${[0,1,2].map(i=>slot(i)+link(i)).join('')}<article class="dinner route-stop" id="dinner"><span class="stop-label">04　晚餐 · 已訂位</span><strong>押上景觀晚餐</strong><span>18:30 前抵達</span><small>已預付 · 不可移動</small><span class="dinner-seal">予約済</span></article></div></div>
 <div class="hand-toolbar"><span><b>你的提案</b> <small>${state.hand.length} 張手牌</small></span><span class="selection-hint">${selected?`已選：${esc(selected.name)} · 點亮起的位置`:'選一張牌，讓假期成形。'}</span><div>${button('取消選取','cancel',!selected||!planning?'disabled':'')}${button(`換牌 ${state.swaps}/2`,'swap',!selected||!planning||state.swaps===0?'disabled':'')}</div></div>
 <div class="hand" aria-label="手牌">${state.hand.map(card).join('')}${!state.hand.length?'<p>所有提案都已放上桌。</p>':''}</div>
 <footer class="action-bar"><p id="notice" role="status">${esc(state.notice||'上午景點 → 午餐 → 下午活動 → 準時吃晚餐。')}</p><div>${button(state.talk==='ready'?'話術：讓我再調整一下':state.talk==='armed'?'話術已準備 ✓':'話術已用完','talk',!planning||state.talk!=='ready'?'disabled':'','secondary')}${button('提交提案　→','submit',!planning?'disabled':'','primary')}</div></footer>
 </section>
 ${ui.showNeeds?`<aside class="needs-panel" role="dialog" aria-modal="true" aria-labelledby="needs-title"><div><span class="eyebrow">CLIENT BRIEF</span>${button('關閉 ×','close-needs')}</div><h2 id="needs-title">阿哲的委託</h2><p>「我想玩得精彩，<br>但回來不要更累。」</p><ul><li>上午景點、午餐、下午活動都要安排</li><li>當日花費 ≤ ¥12,000</li><li>旅程疲勞 ≤ 6</li><li>18:30 前抵達押上晚餐</li></ul><h3>額外心願</h3><p>至少拍一張好照片，也留一段休息。</p><h3>企劃小抄</h3><p>兩次換牌機會。交通牌放在行程之間，替換一般交通。每次不合格提案扣一格精神；話術可免扣一次。</p><p>當前檢查：${e.success?'全部必要條件達成':[...new Set(e.issues.map(i=>errors[i.code]))].join('、')}</p></aside>`:''}
 <div id="asset-notice" role="status">${esc(ui.assetWarning||'')}</div></div>`;
 if(ui.showNeeds){for(const child of root.querySelector('.game-stage').children)if(!child.classList.contains('needs-panel'))child.inert=true;}
 if(previousFocus){const focus=[...root.querySelectorAll('[data-key]')].find(el=>el.dataset.key===previousFocus&&!el.disabled);focus?.focus({preventScroll:true});}
}
