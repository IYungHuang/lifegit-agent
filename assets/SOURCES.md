# 素材來源

## 原創遊戲插畫

`art/office.png`、`art/customer-*.png` 與 `art/cards/*.png` 於 2026-10-06 使用 OpenAI imagegen 工具生成，作為 LifeSpire Steam 原型的遊戲素材。角色五表情以 calm 原稿作為同一人物參考。共同美術方向為墨藍描線、暖米色紙張、青綠與珊瑚色的職場漫画。未使用外部角色、照片或玩家上傳圖片。

長椅及專車卡重製以排除不符東京場景的建築與車標。圖片為虛構化插畫，不是景點實景照片。生成紀錄不等於已完成商業發行的素材法務審查。

## 字體

Noto Sans TC variable font，由 Google Fonts 官方儲存庫於 2026-10-06 取得。

- 字體來源：https://github.com/google/fonts/tree/main/ofl/notosanstc
- 原檔：`NotoSansTC[wght].ttf`，本機以 `NotoSansTC.ttf` 儲存，未修改字型內容。
- 授權：SIL Open Font License 1.1，完整授權與著作權資訊見 `fonts/OFL.txt`。

## 音效與介面

紙張、對話與成交提示由 `src/presentation.js` 的 Web Audio oscillator 即時合成，不依賴音訊檔案。票券邊框、折頁、資源符號與選取狀態由本專案 HTML/CSS 繪製。
