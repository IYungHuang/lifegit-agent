# Steam First Encounter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution method awaits user selection.

**Goal:** 完成一場有原創漫畫角色演出、可解隨機手牌與行程取捨的單人旅行社接案遊戲。

**Architecture:** 保留 HTML 入口，將 1060 行左右的既有混合原型替換為本機 CSS 與 JavaScript modules。純規則產生預覽及提交結果，狀態機控制操作權限，視圖與演出消費狀態。先完成可測試核心，再整合正式美術，不加入框架或大型引擎。

**Tech Stack:** HTML、CSS、原生 JavaScript ES modules、Node.js 22 內建 `node:test` 與 `assert/strict`、本機圖片與 Web Audio 短音效。執行環境已找到 Node 22.23.1；無產品套件依賴。

**Spec:** [已核准設計稿](../specs/2026-10-06-steam-first-encounter-design.md)。2026-10-06 使用者已核准完整規格，本計畫已核准並選擇直接施工。

## Global Constraints

- 工作分支：`codex/steam-travel-game`；不修改或合併網頁工具版。
- 「每案起手 6 張、換牌 2 次，發牌須保證基本可解。」
- 「首場只有一位主客戶、一個旅行社接待場景、三個可編排行程區與一個固定晚餐終點。」
- 「總花費不超過 ¥12,000；最終疲勞不超過 6。」10:00 開始，18:30 為抵達上限，等於上限可成交。
- 「企劃精神初始 3 格。」一次固定話術可免除一次完整不合格提交的精神損失。
- 「最低驗收視窗為 1280 × 720，同時檢查 1920 × 1080。」
- 「支援滑鼠點選與鍵盤 Tab、Enter、Escape；拖曳不是必要操作。」
- 「占位素材不能通過最終視覺驗收。」背景、五種表情、十二張卡圖均須完成。
- 「新增素材與依賴本機載入，移除遊戲啟動對 CDN 字體、Tailwind 與照片服務的依賴。」
- 不做多人、完整爬塔、存檔、Steam SDK 或發行封裝；實際上架適配另案處理。

## Review Focus

1. 非法或重複卡牌 ID、錯誤槽位：拒絕整次操作，不能造成卡片複製或遺失。Task 1、3。
2. 換牌耗盡或沒有可解替代：保留牌、牌池與次數，清楚提示。Task 2、3。
3. 完成邊界與休息順序：恰好 18:30、¥12,000、疲勞 6 應成功；休息不能儲存負疲勞。Task 1。
4. 對話未結束時重啟、雙擊、長按空白：不能重複結算或讓舊回呼污染新案。Task 3、5。
5. 音效被拒絕、設定儲存失敗、素材缺失：核心流程仍可操作，錯誤不造成黑屏。Task 4、5、6。

## Files and Contracts

| 檔案 | 責任 |
|---|---|
| `index.html` | 入口、主場景與可及性骨架，移除舊 CDN、內嵌邏輯與多人介面 |
| `styles/game.css` | 票券介面、角色劇場、兩種焦點布局、響應式與 reduced motion |
| `src/data.js` | 案件、12 張卡、交通矩陣、開場台詞 |
| `src/rules.js` | 驗證安排、純評估器、列舉可解安排 |
| `src/deck.js` | 保證可解的發牌與換牌 |
| `src/state.js` | 純狀態轉移、單次提交與結案 |
| `src/dialogue.js` | 評估差異轉為表情與台詞 |
| `src/presentation.js` | 可取消打字演出、設定讀寫、Web Audio |
| `src/view.js` | DOM 呈現、鍵盤焦點、卡牌與槽位互動 |
| `src/main.js` | 初始化、事件分派、串接演出與狀態 |
| `assets/art/` | 背景、五張客戶表情、十二張卡圖 |
| `assets/fonts/` | 本機繁體中文字體與授權文字 |
| `assets/manifest.json`、`assets/SOURCES.md` | 素材路徑、來源、生成方式、授權紀錄 |
| `tests/{rules,deck,state,dialogue,presentation,assets}.test.mjs` | 行為測試，使用 Node 內建 runner |
| `package.json` | `type: module`、`test: node --test`，不新增 runtime dependencies |
| `docs/steam-playtest.md`、`README.md` | 可重現試玩驗收與執行說明 |

共同資料契約使用 JavaScript JSDoc，以下形狀保持跨任務一致：

```js
// Card: { id, name, kind: 'sight'|'meal'|'rest'|'transport',
//   area?: 'asakusa'|'ueno'|'oshiage', minutes, cost, fatigue, tags: string[] }
// Plan: { slots: [string|null, string|null, string|null],
//   links: [string|null, string|null, string|null] }
// Issue: { code: 'invalid'|'missing'|'late'|'budget'|'fatigue', targets: string[] }
// Evaluation: { complete, valid, success, cost, arrival, fatigue,
//   wishes: { photo: boolean, rest: boolean }, issues: Issue[] }
// target IDs: slot-0..2, link-0..2, total-time, total-cost, total-fatigue
// State: { phase:'intro'|'planning'|'reaction'|'result', hand:string[],
//   reserve:string[], retired:string[], plan:Plan, swaps:number, spirit:number,
//   talk:'ready'|'armed'|'spent', previous:null|{plan:Plan,evaluation:Evaluation},
//   pending:null|{plan:Plan,evaluation:Evaluation,spirit:number,talk:string,outcome:null|'won'|'lost'},
//   outcome:null|'won'|'lost', notice:string, session:number }
// Settings: { muted:boolean, reducedMotion:boolean }
```

## Task 1: 行程資料與純規則

**Files:** Create `package.json`, `src/data.js`, `src/rules.js`, `tests/rules.test.mjs`。

**Interfaces:** 輸出 `CARDS`, `CASE`, `TRAVEL`；`evaluate(plan, cards=CARDS, caseData=CASE, travel=TRAVEL): Evaluation`；`solutions(ids, cards=CARDS, caseData=CASE, travel=TRAVEL): Plan[]`。`solutions` 列舉合法三活動排列與現有交通卡在三段上的不重複安排。

- [ ] 以以下資料建立可驗證基準；數值是已核准範圍內的首輪平衡設定。

| id | 類型 | 區域 | 分鐘 | 花費 | 疲勞 | 標籤 |
|---|---|---|---:|---:|---:|---|
| temple | sight | asakusa | 90 | 0 | 2 | photo |
| park | sight | ueno | 100 | 600 | 3 | photo |
| tower | sight | oshiage | 100 | 3000 | 1 | photo |
| shopping | sight | ueno | 240 | 6500 | 5 | shopping |
| bento | meal | asakusa | 45 | 1200 | 0 | meal |
| eel | meal | ueno | 100 | 4000 | 1 | meal |
| lunch | meal | oshiage | 60 | 1800 | 0 | meal |
| cafe | rest | asakusa | 60 | 900 | -3 | rest |
| bench | rest | ueno | 40 | 0 | -2 | rest |
| lounge | rest | oshiage | 75 | 2000 | -4 | rest |
| taxi | transport | — | 15 | 3500 | 0 | transport |
| car | transport | — | 10 | 6000 | 0 | transport |

`CASE = { start:600, deadline:1110, budget:12000, fatigueLimit:6, dinnerArea:'oshiage' }`。交通矩陣：同區 `{minutes:10,cost:0,fatigue:1}`；淺草／上野 `{minutes:30,cost:250,fatigue:2}`；淺草／押上 `{minutes:20,cost:200,fatigue:1}`；上野／押上 `{minutes:40,cost:300,fatigue:2}`。所有雙向值相同，交通牌可替代任一連接。

- [ ] 先寫失敗測試，包含確切基準與門檻覆寫：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, CASE, TRAVEL } from '../src/data.js';
import { evaluate, solutions } from '../src/rules.js';
const plan = { slots:['temple','bento','cafe'], links:[null,null,null] };
test('ordered fatigue and inclusive limits', () => {
  const e = evaluate(plan);
  assert.deepEqual([e.cost,e.arrival,e.fatigue], [2300,835,2]);
  assert.equal(e.success,true);
  assert.equal(evaluate(plan,CARDS,{...CASE,budget:2300,deadline:835,fatigueLimit:2},TRAVEL).success,true);
  for (const change of [{budget:2299},{deadline:834},{fatigueLimit:1}])
    assert.equal(evaluate(plan,CARDS,{...CASE,...change},TRAVEL).success,false);
});
test('invalid and duplicated cards never succeed', () => {
  assert.equal(evaluate({...plan,slots:['temple','temple','cafe']}).valid,false);
  assert.equal(evaluate({...plan,links:['taxi','taxi',null]}).valid,false);
  assert.equal(evaluate({...plan,slots:['unknown','bento','cafe']}).valid,false);
  assert.ok(solutions(['temple','bento','cafe']).length > 0);
});
```

- [ ] 執行 `node --test tests/rules.test.mjs`，確認尚缺模組的失敗。
- [ ] 實作驗證：未知 ID、重複 ID、活動類型錯誤、link 使用非交通牌回傳 `valid:false`；缺格回傳 `complete:false`。任何 invalid 或 missing 評估皆 `success:false`。不完整行程只顯示暫估，不憑空加入跨缺格交通。
- [ ] 實作依序運算，避免將負疲勞與後續移動直接相抵：

```js
fatigue = Math.max(0, fatigue + activity.fatigue);
// 接續有目的地的連接；末活動目的地固定為晚餐。
fatigue = Math.max(0, fatigue + connection.fatigue);
```

完整有效安排以 `arrival <= deadline && cost <= budget && fatigue <= fatigueLimit` 決定成功；issues 按 late、budget、fatigue 排序。額外願望由活動 tags 計算。聚合超標 target 指向總量，局部可歸因時追加相關 slot/link。
- [ ] 加入疲勞早降至零再移動、交通替換、缺格與三種超標同時發生的測試。枚舉 `solutions` 時只用同一 `evaluate` 判定成功，並檢查每個回傳值。
- [ ] 重跑此測試，通過後提交 `feat: add itinerary rules and first encounter data`。

## Task 2: 保證可解的牌池

**Files:** Create `src/deck.js`, `tests/deck.test.mjs`。

**Interfaces:** 消費 `solutions(ids)`；輸出 `openingHands(): string[][]`（去重、排序的合法 6 張集合）、`deal(rng=Math.random): {hand,reserve}`、`swapOptions(state, cardId): string[]`、`swap(state,cardId,rng=Math.random): State`。隨機來源注入測試；必須先在可解三活動種子中抽取，再補三張並洗牌。

- [ ] 先寫失敗測試，遍歷而非只抽幾次：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { openingHands, deal, swapOptions, swap } from '../src/deck.js';
import { solutions } from '../src/rules.js';
test('every producible hand and swap preserves a solution', () => {
  for (const hand of openingHands()) {
    assert.equal(new Set(hand).size,6);
    assert.ok(solutions(hand).length);
    const reserve = ['temple','park','tower','shopping','bento','eel','lunch','cafe','bench','lounge','taxi','car'].filter(id=>!hand.includes(id));
    const s = {hand,reserve,retired:[],swaps:2,plan:{slots:[null,null,null],links:[null,null,null]}};
    for (const old of hand) for (const replacement of swapOptions(s,old))
      assert.ok(solutions(hand.filter(id=>id!==old).concat(replacement)).length);
  }
});
test('no reserve leaves resources unchanged', () => {
  const s = {hand:['temple','bento','cafe'],reserve:[],retired:[],swaps:2,plan:{slots:[null,null,null],links:[null,null,null]}};
  const next=swap(s,'temple',()=>0);
  assert.deepEqual(next.hand,s.hand);
  assert.equal(next.swaps,2);
  assert.match(next.notice,/無|沒有/);
});
```

- [ ] 執行 `node --test tests/deck.test.mjs`，確認失敗。
- [ ] 以完整卡池 `solutions` 篩選 links 全空的三活動種子。枚舉所有可補足的三張形成 `openingHands`；`deal` 按種子與補牌流程抽取，不從任意 6 張反覆碰運氣。以排序後 ID 組作為解集合快取鍵。
- [ ] `swapOptions` 合併 hand、slots、links 為現有資源，移除指定未安排卡，逐一測試 reserve 候選。`swap` 成功才將舊卡送 retired 並扣一次；不合法請求只改 notice，保留其他值。
- [ ] 加入零次數、選取已安排卡、連續兩次換牌、牌池 ID 守恆，以及亂數 0 和接近 1 的發牌測試；重跑 Task 1、2 測試。
- [ ] 提交 `feat: guarantee solvable opening hands and swaps`。

## Task 3: 案件狀態與提交鎖定

**Files:** Create `src/state.js`, `tests/state.test.mjs`。

**Interfaces:** `createGame(rng=Math.random,session=0): State`；`transition(state,action,rng=Math.random): State`。Action 類型為 `INTRO_DONE`, `PLACE {cardId,target:'slot'|'link',index}`, `REMOVE {target,index}`, `SWAP {cardId}`, `ARM_TALK`, `SUBMIT`, `REACTION_DONE`, `RESTART`。

- [ ] 先寫失敗測試，用可重現初始 hand 與既有可行 plan：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,transition} from '../src/state.js';
test('submit locks once; replay cannot settle twice',()=>{
 let s={...createGame(()=>0),phase:'planning',hand:['park','tower','taxi'],
   plan:{slots:['temple','bento','cafe'],links:[null,null,null]}};
 s=transition(s,{type:'SUBMIT'});
 assert.equal(s.phase,'reaction');
 assert.deepEqual(transition(s,{type:'SUBMIT'}),s);
 s=transition(s,{type:'REACTION_DONE'});
 assert.equal(s.outcome,'won');
 assert.deepEqual(transition(s,{type:'REACTION_DONE'}),s);
});
```

- [ ] 執行 `node --test tests/state.test.mjs`，確認失敗。
- [ ] 開場建立 6 張手牌、2 次換牌、3 精神、空行程。PLACE 僅 planning 可用，檢查手牌持有、類型與 index；被替換牌回手。REMOVE 返回手牌。未變更資源的非法 action 附提示。
- [ ] SUBMIT 驗證完整與合法才建立 pending（plan、evaluation 深拷貝並凍結），切 reaction。成功優先於精神扣除；失敗且 talk armed 則免扣，否則 spirit - 1。armed 在有效提交後成為 spent，缺格不消耗。REACTION_DONE 才發布 pending 數值、previous 快照與結案結果。
- [ ] RESTART 從任意階段重置並使 session + 1。未知 action 回傳原狀態；settings 由演出層保留。
- [ ] 增補缺格不扣、spirit=1 成交、三次失敗破局、話術免扣一次、非法 index、錯型 card、替換撤回守恆、重啟清空 pending 的測試，通過後提交 `feat: add encounter state transitions`。

## Task 4: 正式漫畫素材與本機資源

**Files:** Create `assets/art/office.png`, `assets/art/customer-{calm,doubt,angry,interested,happy}.png`, `assets/art/cards/{temple,park,tower,shopping,bento,eel,lunch,cafe,bench,lounge,taxi,car}.png`, `assets/fonts/`, `assets/manifest.json`, `assets/SOURCES.md`, `tests/assets.test.mjs`。

**Interfaces:** manifest 形狀 `{background:string,portraits:{calm,doubt,angry,interested,happy},cards:{[cardId]:string},font:string}`；所有值為相對專案根目錄的本機檔案路徑。

- [ ] 執行階段先讀 imagegen 技能。用 image generation 工具建立原創素材，禁止以 Emoji、網路照片或臨時方塊交差。先產生 calm 立繪，後續四表情以該立繪為參考編輯，保持服裝、髮型、尺度與透明背景。
- [ ] 共用美術提示：暖米色紙張、墨藍描線、珊瑚紅重點；誇張職場漫畫，清楚剪影、平塗陰影，避免奇幻金框與像素風。角色是休假上班族，五表情對應平靜、懷疑、抗議、心動、滿意；背景留出桌面與對話負空間。卡圖不含生成文字，文字由 UI 呈現。
- [ ] 背景、角色、卡圖分批生成並逐張視覺檢查，確保無殘缺肢體、表情錯配或不一致邊框。生成服務若阻擋，記錄缺件，繼續其他任務但不能宣稱美術驗收完成。
- [ ] 從官方來源取得可再散布繁體字體與授權檔，記錄版本、網址、授權；不使用無法確認授權的本機字體拷貝。`SOURCES.md` 記錄每批圖片的生成工具、日期與用途，不宣稱已完成法務審查。
- [ ] 寫檔案完整性測試：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {CARDS} from '../src/data.js';
test('all final art is local and present',async()=>{
 const m=JSON.parse(await readFile('assets/manifest.json','utf8'));
 assert.deepEqual(Object.keys(m.portraits).sort(),['angry','calm','doubt','happy','interested']);
 assert.deepEqual(Object.keys(m.cards).sort(),CARDS.map(c=>c.id).sort());
 for(const path of [m.background,m.font,...Object.values(m.portraits),...Object.values(m.cards)]){
  assert.ok(path.startsWith('assets/'));
  assert.ok((await stat(path)).size>0);
 }
});
```

- [ ] `node --test tests/assets.test.mjs` 通過並完成視覺檢查後，提交 `feat: add original comic encounter assets`。

## Task 5: 對話、演出取消與偏好

**Files:** Create `src/dialogue.js`, `src/presentation.js`, `tests/dialogue.test.mjs`, `tests/presentation.test.mjs`。

**Interfaces:** `buildDialogue(previous,pending): {text,expression,targets}[]`；`createPresenter({schedule,cancel,onText,onLine,onDone}): {play(lines,{reducedMotion}),advance(),dispose()}`，schedule 與 cancel 使用與 setTimeout/clearTimeout 相同契約。`readSettings(storage): Settings`、`writeSettings(storage,settings): void`；`createSound(): {unlock(),play(kind),setMuted(value),dispose()}`。

- [ ] 先加入質疑正確性測試：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDialogue} from '../src/dialogue.js';
test('only resolved issues receive praise',()=>{
 const e={complete:true,valid:true,success:false,cost:13000,arrival:900,fatigue:7,wishes:{photo:true,rest:false},issues:[{code:'budget',targets:['total-cost']},{code:'fatigue',targets:['total-fatigue']}]};
 const lines=buildDialogue(null,{evaluation:e,plan:{slots:[],links:[]},spirit:2,outcome:null});
 assert.ok(lines.some(l=>l.targets.includes('total-cost')));
 assert.ok(!lines.some(l=>/不用走|省力/.test(l.text)));
});
```

- [ ] 執行上述測試並確認缺模組失敗；建立 late、budget、fatigue、成交評價 0/1/2、破局台詞表，遵守 issues 優先序。previous 比較只稱讚已解除條件；交通稱讚還需 links 有變且疲勞確實下降，否則用一般改善台詞。
- [ ] Presenter 使用世代編號及單一 timer。`dispose` 或新 play 清除 timer 並增加世代；回呼執行前檢查世代。advance 在未完成句子時只補全文，完成後才換句；最後一句結束只呼叫 onDone 一次。
- [ ] 以注入排程器測試取消後舊回呼無效：

```js
const queue=[]; let done=0;
const p=createPresenter({schedule:fn=>(queue.push(fn),queue.length),cancel:()=>{},onText:()=>{},onLine:()=>{},onDone:()=>done++});
p.play([{text:'第一句',expression:'calm',targets:[]}],{reducedMotion:false});
p.dispose();
for(const fn of queue.splice(0)) fn();
assert.equal(done,0);
```

- [ ] 加入 advance 兩階段、最後句重複 advance、reducedMotion 無 timer、缺 previous、改善疲勞但仍超預算的測試。事件層忽略 KeyboardEvent.repeat，避免長按跳完整段。
- [ ] 設定 JSON 無效或 storage 拋錯時回預設／記憶體值。Web Audio 僅首次操作 unlock，resume 拒絕必須捕捉；muted 阻止發聲。以注入或可替換音訊邊界測試拒絕不拋到 UI。
- [ ] 通過相關測試，提交 `feat: add reactive dialogue and cancellable presentation`。

## Task 6: 接待桌介面整合與驗收

**Files:** Replace `index.html`; create `styles/game.css`, `src/view.js`, `src/main.js`, `docs/steam-playtest.md`; update `README.md`。

**Interfaces:** `render(root,state,evaluation,settings,manifest,dispatch): void`；`mount(root,{rng=Math.random}={}): {dispose()}`。DOM 使用 `data-card-id`、`data-target`、`data-index` 與原生 button；所有規則值來自 evaluate，不在 view 計算。

- [ ] 入口使用本機 CSS 與 module，保留 `<html lang="zh-TW">`；建立固定舞台、HUD、客戶、行程、手牌、對話與結案區。以 scene class 切換焦點，不用全螢幕 modal 遮住爭議位置。

```html
<link rel="stylesheet" href="styles/game.css">
<main id="game" aria-label="旅行社接案"></main>
<script type="module" src="src/main.js"></script>
```

```css
.game-stage { min-height: 100dvh; display: grid; grid-template-rows: auto minmax(0,1fr) auto; }
button:focus-visible { outline: 3px solid #183848; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] 主色採暖紙色、墨藍與珊瑚紅，文字正文至少 16px。六張手牌可一眼掃讀，不用極端扇形遮字。選卡顯示合法位置文字與輪廓；Escape 取消選取、關閉需求面板；撤回按鈕不與放置點擊冒泡衝突。
- [ ] 初始顯示開始接案；開場 dialogue 完成發送 INTRO_DONE。SUBMIT 後依 pending 建立 dialogue，onDone 發送 REACTION_DONE。重啟先 dispose 舊 presenter，再更新 session；onDone 帶 session 檢查。render 後維持同一語義控制項焦點，對話結束返回提交或結案按鈕。
- [ ] 發牌、提交或換牌不依賴動畫結束事件。採事件委派與 textContent 填入台詞。視覺字串完整顯示後再更新 aria-live，避免逐字朗讀。
- [ ] 本機載入 manifest；圖片錯誤顯示「素材載入失敗」與文字替代，開發仍可操作。資源問題必須留在驗收記錄，不以 fallback 宣稱完成。
- [ ] `docs/steam-playtest.md` 記錄實際驗收日期、視窗、結果及必要截圖路徑。執行下列人工案例：

| 案例 | 必須觀察到 |
|---|---|
| 初次開始 → 開場 → 安排 | 原創背景與角色，6 張牌，需求清楚 |
| 鍵盤完成可行方案 | Tab / Enter 可安排與撤回；Escape 可取消 |
| 調整交通後提交 | 預覽與結算一致，角色只稱讚真實改善 |
| 連續失敗與話術 | 未用話術三次失敗破局；一次話術只免扣一次 |
| 快速雙擊提交、長按空白 | 單次結算，不略過整段，不重複扣值 |
| 打字中重新接案 | 舊台詞與結算不再出現 |
| 靜音、減少動態、儲存拒絕 | 可玩、偏好有效、無未處理錯誤 |
| 1280 × 720 / 1920 × 1080 / 窄視窗 | 必要文字可讀，桌機無整頁捲動或遮擋，窄版可重排 |
| 外網中斷下重新載入本機頁面 | 所有必要素材正常，核心流程可走完 |
| 缺失圖片與音訊拒絕 | 清楚替代提示，核心互動不中斷 |

- [ ] 使用當前工具允許的瀏覽器來源驗收；本對話先前 `file://` 已被瀏覽器政策阻擋，不以其他表面或間接方式繞過。若仍無獲准預覽來源，完成可做的單元與資源檢查，列出尚待使用者實機驗證的畫面案例，不宣稱視覺驗收通過。
- [ ] 更新 README：Steam 版定位、玩法、Node 測試命令、本機 HTTP 預覽指令 `python3 -m http.server 8080`、不含 Steam 發行封裝。這是使用者自行啟動的執行說明，不代表本次已獲准繞過瀏覽器限制。
- [ ] 執行 `node --test`、`git diff --check`，確認入口無 CDN 引用。對人工發現的錯誤，只補有意義的回歸測試，不替樣式細節建立脆弱測試。
- [ ] 提交 `feat: integrate comic travel encounter interface`。記錄通過項、未完成項與實際限制；不自動推送或建立 PR，除非執行時獲得相應授權。

## Completion and Handoff

六項任務完成並通過規格八項驗收才可稱首場完成。素材缺失、未實機檢查或尚有不可解手牌時皆須明列未完成。依選定執行方法進行最終審查，修正具體問題後重跑受影響檢查。

建議採本對話直接施工：規則、狀態、演出與畫面共享緊密介面，先保持單一實作者連續理解，再做整體審查。另一選項是逐任務子代理實作與審查；由使用者選擇後啟動。

## Execution Record

2026-10-06：六項任務的程式與素材已實作。30 項測試通過，獨立審查三項 P2 已修正。實際瀏覽器、兩種桌機解析度與音效驗收尚未完成；詳見 `docs/steam-playtest.md`。購物卡耗時已依實測由 180 調整為 240 分鐘。
