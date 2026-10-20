# 一生日歷

把一生畫成一格一週的格子，提醒自己把握當下。

網站：https://laithting.github.io/life-calendar/

## 功能

- 一生的格子，可以切換週、月、年、今年 365 天
- 彩繪牆：每週寫一則回顧，選顏色和圖樣，或自己畫 9×9 的像素圖，做成一塊磁磚
- 人生階段上色、人生願望清單、重要日子倒數、里程碑
- 和重要的人的時間：估算還能一起過幾次春節、見幾次面
- 備份與匯入（JSON 檔）
- 繁體中文／English、深色／淺色主題
- 可以加到手機主畫面，離線也能用
- 手機桌面小工具：iPhone 用 Scriptable，Android 用 KWGT（設定說明在 `widget.html`）

所有資料只存在瀏覽器的 localStorage，不會上傳。

## 檔案

- `docs/`：網站本體，GitHub Pages 從這裡發佈
  - `index.html`、`style.css`、`app.js`：主程式
  - `widget.html`、`scriptable.js`：手機小工具的設定頁和 iPhone 小工具程式
  - `sw.js`、`manifest.webmanifest`、`icons/`：加到主畫面與離線使用
- `一生日歷.html`：Claude Artifact 版本，由 `python tools/build_artifact.py` 從 `docs/` 產生
- `tools/make_icons.py`：產生 App 圖示

## 更新網站

修改 `docs/` 裡的檔案後：

1. 把 `docs/sw.js` 裡的 `CACHE` 版本號加一，已經加到主畫面的人才會拿到新版。
2. 執行 `python tools/build_artifact.py` 更新 Artifact 版本。
3. commit 並 push，GitHub Pages 大約一分鐘後更新。
