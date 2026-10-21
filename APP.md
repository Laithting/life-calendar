# 一生日歷 App：打包與上架說明

App 用 [Capacitor](https://capacitorjs.com/) 把 `docs/` 裡的網站包成 Android 和 iPhone App，另外加上這些原生功能：

- **Android 桌面小工具**：週數、一生進度和格子。拉高後會改成一格一週的格子，每小時和每天午夜後自動更新。
- **每週提醒通知**：在 App 的「手機」區塊開啟，時間可以自己選，由手機本機排程。
- **匯出備份**：用手機的分享選單，把備份檔存到雲端硬碟或傳給自己。
- **資料保護**：資料同時存一份在原生儲存空間；系統清掉網頁資料時會自動還原。

套件 ID：`com.lifecalendar.app`（上架後不能再改）

## 專案結構

| 位置 | 內容 |
| --- | --- |
| `docs/` | 網站本體，App 也用同一份 |
| `capacitor.config.json` | App 名稱、套件 ID、外掛設定 |
| `android/` | Android 專案（在 Android Studio 打開這個資料夾） |
| `android/app/src/main/java/com/lifecalendar/app/` | `LifeWidgetProvider.java`（桌面小工具）、`LifeWidgetPlugin.java`（網頁和小工具之間的橋樑） |
| `ios/` | iPhone 專案（要在 Mac 上用 Xcode 打開） |
| `tools/make_android_res.py` | 產生 Android 圖示與啟動畫面 |

## 修改網站後更新 App

```bash
npx cap sync
```

這會把 `docs/` 複製進 Android 和 iPhone 專案。

## 打包 Android 測試版（APK）

需要先準備好：

- **Android Studio**：第一次打開時要跑完設定精靈，把 Android SDK 裝好。
- **Java 21**：Capacitor 的外掛規定用 Java 21 編譯。Android Studio 內建的是 Java 25，不能直接用，要另外安裝 Microsoft OpenJDK 21（`winget install --id Microsoft.OpenJDK.21 -e`）。

這個專案另外做了兩個設定：

- **Gradle 9.1.0**：`android/gradle/wrapper/gradle-wrapper.properties` 從 Capacitor 預設的 8.14.3 升級。這樣就算 Android Studio 用內建的 Java 25 執行 Gradle，也能透過 toolchain 自動找到 Java 21 來編譯。
- **`android.overridePathCheck=true`**：寫在 `android/gradle.properties`。專案路徑裡有中文，Android 的建置工具在 Windows 上預設會拒絕建置。

在 PowerShell 打包：

```powershell
npx cap sync android
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\android\gradlew.bat -p android assembleDebug
```

注意：

- 這一步要在一般的終端機裡跑，Gradle 需要開本機連線。
- 第一次建置會自動下載 SDK Platform 36 和其他需要的套件，大約要幾分鐘。

產生的檔案在 `android/app/build/outputs/apk/debug/app-debug.apk`。

裝到手機：

- **方法一**：把 APK 傳到手機（例如用 Google 雲端硬碟或 LINE 傳給自己），在手機上點開安裝。第一次會要求你允許「安裝不明來源的應用程式」。
- **方法二**：手機開啟「開發人員選項 → USB 偵錯」，用 USB 線接上電腦，然後在 Android Studio 按 Run。

## 上架 Google Play

1. **開發者帳號**：到 [Google Play Console](https://play.google.com/console) 註冊，一次性費用 US$25，需要驗證身分。
2. **簽署金鑰**：在 Android Studio 選 Build → Generate Signed App Bundle，建立上傳金鑰（keystore）。
   - **金鑰檔和密碼一定要備份好**，弄丟就沒辦法更新 App。
   - 不要把金鑰放進 git。
3. **打包**：產生 `.aab` 檔。
4. **商店資料**：
   - App 名稱、簡短說明、完整說明
   - 圖示 512×512：可以用 `docs/icons/icon-512.png`
   - 宣傳圖 1024×500
   - 至少 2 張手機截圖
   - 隱私權政策網址：https://laithting.github.io/life-calendar/privacy.html
5. **資料安全問卷**：App 不蒐集、也不分享任何資料，照實填寫「不蒐集資料」。
6. **封閉測試**：2023 年 11 月之後註冊的個人帳號，正式上架前要先找至少 12 位測試者，連續 14 天參與封閉測試。這個規定可能會變，送審前請以 Play Console 上的說明為準。

## iPhone 版

iPhone App 一定要在 Mac 上用 Xcode 打包，並且需要 [Apple Developer Program](https://developer.apple.com/programs/)（每年 US$99）。

```bash
npx cap sync ios
npx cap open ios
```

在 Xcode 裡：

1. 選 App target → Signing & Capabilities，把 Team 設成你的開發者帳號。
2. 接上 iPhone 按 Run 測試。
3. 要上架時，選 Product → Archive，再上傳到 App Store Connect。

目前 iPhone 版已經有每週提醒通知和分享匯出，但**還沒有原生的 iPhone 桌面小工具**。原因是 iOS 小工具要用 Swift 和 WidgetKit 另外寫一個 extension，而且需要在 Mac 上建置和測試。在這之前，iPhone 使用者可以先用網站上的 Scriptable 小工具。

Apple 審核規定 4.2（最低功能要求）會退回「只是把網站包起來」的 App。iPhone 版上架前，最好先把原生小工具補上，讓 App 有網站做不到的功能。

## 更換圖示

修改 `tools/make_icons.py` 裡的顏色或圖案，然後執行：

```bash
python tools/make_icons.py --app
python tools/make_android_res.py
```
