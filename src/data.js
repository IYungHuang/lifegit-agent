/** All travel values are fictional game balancing data, not travel advice. */
export const CASE=Object.freeze({start:600,deadline:1110,budget:12000,fatigueLimit:6,dinnerArea:'oshiage'});
export const AREAS={asakusa:'淺草',ueno:'上野',oshiage:'押上'};
const rows=[
 ['temple','淺草散步','sight','asakusa',90,0,2,['photo'],'雷門前，留一張真的有放假的照片。'],
 ['park','上野公園','sight','ueno',100,600,3,['photo'],'樹蔭很好，步數也很可觀。'],
 ['tower','晴空塔展望台','sight','oshiage',100,3000,1,['photo'],'搭電梯，把整座城市收進照片。'],
 ['shopping','阿美橫町大採購','sight','ueno',240,6500,5,['shopping'],'荷包與雙腿，一起接受考驗。'],
 ['bento','街角便當','meal','asakusa',45,1200,0,['meal'],'坐下來吃飯，才算真的有吃飯。'],
 ['eel','名店鰻魚飯','meal','ueno',100,4000,1,['meal'],'排隊也算行程的一部分。'],
 ['lunch','河畔午間套餐','meal','oshiage',60,1800,0,['meal'],'好好吃一餐，不用搶時間。'],
 ['cafe','喫茶店放空','rest','asakusa',60,900,-3,['rest'],'本時段唯一任務：什麼都不做。'],
 ['bench','公園長椅','rest','ueno',40,0,-2,['rest'],'免費的座位，無價的安靜。'],
 ['lounge','景觀休息室','rest','oshiage',75,2000,-4,['rest'],'城市很忙，你可以不用。'],
 ['taxi','計程車接送','transport',null,15,3500,0,['transport'],'把這一段路，交給四個輪子。'],
 ['car','專車禮遇','transport',null,10,6000,0,['transport'],'少一點奔波，多一點預算。']
];
export const CARDS=Object.freeze(rows.map(([id,name,kind,area,minutes,cost,fatigue,tags,description])=>Object.freeze({id,name,kind,area,minutes,cost,fatigue,tags:Object.freeze(tags),description})));
export const CARD_BY_ID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
const same={minutes:10,cost:0,fatigue:1},au={minutes:30,cost:250,fatigue:2},ao={minutes:20,cost:200,fatigue:1},uo={minutes:40,cost:300,fatigue:2};
export const TRAVEL={asakusa:{asakusa:same,ueno:au,oshiage:ao},ueno:{asakusa:au,ueno:same,oshiage:uo},oshiage:{asakusa:ao,ueno:uo,oshiage:same}};
export const INTRO=[
 {text:'我這次只要求兩件事：玩得精彩，回來不要更累。',expression:'calm',targets:[]},
 {text:'假好不容易請下來了。拜託，別把我的休假排成另一份工作。',expression:'doubt',targets:[]},
 {text:'晚上六點半，押上的晚餐已經訂好了。其他的，就交給你了。',expression:'interested',targets:['dinner']}
];
export const emptyPlan=()=>({slots:[null,null,null],links:[null,null,null]});
