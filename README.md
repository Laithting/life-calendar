# 一生日歷

把一生畫成一格一週的格子，提醒自己把握當下。

網站：https://laithting.github.io/life-calendar/

## 功能

- 一生的格子，可以切換週、月、年、今年 365 天
- 彩繪牆：每週寫一則回顧，做成一塊 16×16、10 色的像素磁磚；可以自己畫（畫筆、油漆桶、上一步），也可以依文字自動挑圖案生成
- 週視圖可以放大，寫過回顧的週直接顯示那塊磁磚
- 人生階段上色、人生願望清單、重要日子倒數、里程碑
- 和重要的人的時間：估算還能一起過幾次春節、見幾次面
- 備份與匯入（JSON 檔）
- 繁體中文／English、深色／淺色主題
- 可以加到手機主畫面，離線也能用
- 手機桌面小工具：iPhone 用 Scriptable，Android 用 KWGT（設定說明在 `widget.html`）
- 每週提醒：網站可以加到 Google 日曆或下載 .ics；App 用手機通知
- 鍵盤操作：格子可以用方向鍵移動、Enter 打開
- Android App（`android/`），附原生桌面小工具，打包與上架說明見 [APP.md](APP.md)

所有資料只存在瀏覽器的 localStorage（App 版另外存一份在手機的原生儲存空間），不會上傳。隱私權政策：`docs/privacy.html`。

## 檔案

- `docs/`：網站本體，GitHub Pages 從這裡發佈
  - `index.html`、`style.css`、`app.js`：主程式
  - `tiles.js`：磁磚引擎（調色盤、圖案、依文字生成）
  - `widget.html`、`scriptable.js`：手機小工具的設定頁和 iPhone 小工具程式
  - `sw.js`、`manifest.webmanifest`、`icons/`：加到主畫面與離線使用
- `一生日歷.html`：Claude Artifact 版本，由 `python tools/build_artifact.py` 從 `docs/` 產生
- `tools/make_icons.py`：產生 App 圖示
- `tools/tile_sheet.js`：檢查磁磚圖案並輸出總覽圖（`node tools/tile_sheet.js`）

## 更新網站

修改 `docs/` 裡的檔案後：

1. 把 `docs/sw.js` 裡的 `CACHE` 版本號加一，已經加到主畫面的人才會拿到新版。
2. 執行 `python tools/build_artifact.py` 更新 Artifact 版本。
3. commit 並 push，GitHub Pages 大約一分鐘後更新。
