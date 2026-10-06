# LifeGit：非工程師的任務版本與狀態機 AI 系統規格

## 核心設計理念
讓非軟體工程背景的普通使用者，不必理解 `commit`、`branch`、`rebase` 等晦澀術語，卻能完整享有 Git 的「狀態管理、探索自由度與抗崩潰能力」，使 AI Agent 真正具備跟隨情境動態調整的領航能力。

---

## 狀態機映射矩陣 (Mental Model Mapping)

| 軟體工程概念 | 生活任務轉化名稱 | 家庭旅行情境實例 | Agent 在該節點的運算行為 |
| :--- | :--- | :--- | :--- |
| **Commit** | **🔒 鎖定里程碑 (Snapshot)** | Day 1~2 機票與上野飯店確認 | 凍結此段 Context 為不可變約束（Hard Constraint），後續行程不得任意篡改。 |
| **Branch** | **🌿 平行時空方案 (Fork)** | Day 3 台場鋼彈 vs 橫濱麵包超人 | 複製現有基底，各自獨立推演交通、步行步數與預算，互不污染。 |
| **Diff** | **⚖️ 決策對照表 (Diff Matrix)** | 比較「台場」與「橫濱」的代價 | 提煉核心指標（車程差 20m、步數少 2200 步、幼兒滿意度），輔助爸媽快速做決策。 |
| **Merge** | **✅ 採納定案 (Adopt / Merge)** | 決定去橫濱麵包超人 | 將選定分支的節點鏈接回主幹，未選方案封存為備用草稿。 |
| **Shadow Branch** | **☂️ 影子備案 (Fallback)** | Day 3 晴天戶外 vs 雨天池袋水族館 | 平行掛載，共享前後硬約束，條件滿足（下雨）時一鍵無縫無痛啟用。 |
| **Hotfix / Rebase** | **🚨 現場急救重排 (Hotfix)** | 14:15 二寶突發發燒斷電大哭 | 鎖定 18:30 不可取消的燒肉訂位，修剪下午步行行程，平移插入計程車與飯店休養。 |

---

## 本地互動原型資訊
- **本機即時預覽 URL**：[http://localhost:8080](http://localhost:8080)
- **檔案路徑**：[`/Users/appgongyong/family-travel-git-agent/index.html`](file:///Users/appgongyong/family-travel-git-agent/index.html)
