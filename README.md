# 房市新聞摘要與趨勢分析

台灣房地產市場新聞分析工具，提供智慧化的新聞摘要、趨勢分析圖表與關鍵詞追蹤功能。本應用程式採用現代化的前端架構，支援離線資料儲存、深色模式、完整的無障礙性支援，以及豐富的資料視覺化功能。

[![GitHub](https://img.shields.io/badge/GitHub-PropTrendAnalyzerTW-blue)](https://github.com/ammosu/PropTrendAnalyzerTW)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)

## 目錄

- [專案特色](#專案特色)
- [專案架構](#專案架構)
- [快速開始](#快速開始)
- [功能說明](#功能說明)
- [資料管理](#資料管理)
- [技術實現](#技術實現)
- [模組說明](#模組說明)
- [安全性](#安全性)
- [無障礙性](#無障礙性)
- [開發指南](#開發指南)

## 專案特色

### 核心功能
- 📊 **多樣化圖表** - 支援市場趨勢圖、關鍵詞趨勢圖、詞雲圖等多種視覺化呈現
- 📁 **彈性資料來源** - 支援客戶端 CSV 上傳與伺服器端 JSON 資料載入
- 💾 **離線儲存** - 使用 IndexedDB 本地儲存，支援離線瀏覽
- 🔍 **智慧篩選** - 關鍵字搜尋、日期範圍篩選、趨勢類型篩選
- 📅 **快速日期篩選** - 一鍵篩選近 7 天、30 天、90 天或自訂範圍
- 📱 **響應式設計** - 完美支援桌面、平板與行動裝置

### 使用者體驗
- 🌓 **深色模式** - 支援淺色/深色主題切換，保護眼睛
- 🎨 **檢視模式** - 卡片檢視/列表檢視靈活切換
- ♿ **無障礙性** - 完整的鍵盤導航與螢幕閱讀器支援（WCAG 2.1 AA 等級）
- ⚡ **效能最佳化** - 分頁載入、快取機制、延遲載入

### 安全性
- 🔒 **內容安全政策 (CSP)** - 防止 XSS 攻擊
- ✅ **輸入驗證** - 嚴格的資料驗證與清理
- 🛡️ **安全標頭** - X-Frame-Options、X-Content-Type-Options 等

## 專案架構

```
PropTrendAnalyzerTW/
├── index.html              # 主要 HTML 頁面
├── style.css               # 全域樣式表
├── server.js               # Express 伺服器
├── package.json            # 專案設定與相依套件
│
├── js/
│   ├── App.js              # 主應用程式控制器
│   └── modules/            # 核心模組
│       ├── StateManager.js         # 狀態管理
│       ├── UIComponents.js         # UI 元件渲染
│       ├── ChartManager.js         # 圖表管理
│       ├── EventHandlers.js        # 事件處理
│       ├── AccessibilityManager.js # 無障礙性管理
│       ├── ErrorHandler.js         # 錯誤處理
│       ├── SecurityUtils.js        # 安全工具
│       ├── Validator.js            # 資料驗證
│       ├── Utilities.js            # 工具函數
│       ├── CacheManager.js         # 快取管理
│       └── Constants.js            # 常數定義
│
├── data/                   # 資料檔案目錄
│   ├── metadata.json       # 中繼資料
│   ├── all_articles.json   # 所有文章資料
│   └── articles_YYYY-MM.json # 按月份分割的資料
│
├── data.js                 # 資料載入邏輯（向後相容）
├── csv-uploader.js         # 客戶端 CSV 上傳處理
├── convert-csv.js          # 伺服器端 CSV 轉 JSON 工具
└── sample_data.csv         # 範例 CSV 資料

assets/                     # 靜態資源（圖示、favicon 等）
```

## 快速開始

### 環境需求

- Node.js 12.x 或以上版本
- 現代瀏覽器（支援 ES6、IndexedDB、CSS Grid）

### 安裝步驟

1. **複製專案**
```bash
git clone https://github.com/ammosu/PropTrendAnalyzerTW.git
cd PropTrendAnalyzerTW
```

2. **安裝相依套件**
```bash
npm install
```

3. **啟動伺服器**
```bash
node server.js
```

4. **開啟瀏覽器**
```
http://localhost:3000
```

### 使用方式

#### 方式一：上傳 CSV 檔案（推薦）
1. 開啟應用程式後，點選「上傳 CSV 資料」區塊
2. 選擇包含新聞資料的 CSV 檔案
3. 等待處理完成，資料會自動儲存到 IndexedDB
4. 開始瀏覽與分析新聞資料

#### 方式二：使用伺服器資料
1. 將 CSV 資料放入 `sample_data.csv`
2. 執行轉換工具：
```bash
node convert-csv.js
```
3. 重新整理頁面即可載入資料

## 功能說明

### 1. 新聞瀏覽

- **分頁顯示**：每頁顯示 10 筆新聞，支援頁碼跳轉
- **卡片/列表檢視**：兩種檢視模式自由切換
- **文章詳情**：展開查看完整內容、關鍵詞、預期走向與理由

### 2. 篩選與搜尋

- **關鍵字搜尋**：支援標題、內容、關鍵詞的全文搜尋
- **快速日期篩選**：
  - 近 7 天
  - 近 30 天
  - 近 90 天
  - 自訂日期範圍
- **趨勢篩選**：依市場預期走向篩選（上漲、下跌、平穩等）

### 3. 資料視覺化

#### 市場趨勢圖
- 顯示不同時期的市場預期走向分佈
- 支援長條圖、折線圖切換
- 顏色編碼：上漲（綠）、下跌（紅）、平穩（藍）、無相關（灰）、無法判斷（黃）

#### 關鍵詞趨勢圖
- 追蹤熱門關鍵詞隨時間的出現頻率
- 支援長條圖、折線圖切換
- 自動選取前 10 名熱門關鍵詞

#### 詞雲圖
- 視覺化呈現關鍵詞重要性
- 字體大小對應出現頻率
- 互動式顯示，滑鼠懸停顯示詳細資訊

### 4. 深色模式

- 一鍵切換淺色/深色主題
- 自動記憶使用者偏好（存於 localStorage）
- 所有元件包含圖表都完整支援深色模式

### 5. 無障礙性功能

- **鍵盤導航**：完整支援 Tab、Enter、Escape 等按鍵操作
- **螢幕閱讀器**：所有互動元素都有適當的 ARIA 標籤
- **跳過導航連結**：快速跳至主要內容
- **焦點管理**：清晰的焦點指示與邏輯順序
- **語意化 HTML**：使用正確的標籤結構

## 資料管理

### 資料來源

本應用程式支援兩種資料來源：

1. **IndexedDB**（優先）：客戶端上傳的 CSV 資料
2. **JSON 檔案**（備援）：伺服器端預先轉換的資料

資料載入優先順序：IndexedDB → JSON 檔案

### CSV 檔案格式

上傳的 CSV 檔案應包含以下欄位：

| 欄位名稱 | 說明 | 範例 |
|---------|------|------|
| `title` | 文章標題 | 央行降息，房市回溫？ |
| `author` | 作者 | 張三 |
| `fullText` | 文章全文 | 央行宣布降息一碼... |
| `url` | 文章網址 | https://example.com/article/123 |
| `tag` | 標籤 | 政策 |
| `publisher` | 發布媒體 | 經濟日報 |
| `keywords` | 關鍵詞 | ['央行', '降息', '房市'] |
| `summary` | 摘要 | 央行降息可能帶動... |
| `date` | 發布日期 | 2024-03-15 |
| `預期走向` | 市場預期 | 上漲 / 下跌 / 平穩 / 無相關 / 無法判斷 |
| `理由` | 預期理由 | 降息通常有利於... |

### 新增資料

#### 客戶端上傳（推薦）

1. 準備符合格式的 CSV 檔案
2. 在網頁上點選「上傳 CSV 資料」
3. 選擇檔案並上傳
4. 系統會自動驗證、處理並儲存到 IndexedDB

**限制**：
- 單一檔案最大 1GB
- 必須是 UTF-8 編碼
- 必須包含所有必要欄位

#### 伺服器端轉換

1. 將新資料新增到 `sample_data.csv`
2. 執行轉換指令：
```bash
node convert-csv.js
```
3. 工具會自動：
   - 驗證資料格式
   - 生成 `metadata.json`
   - 生成 `all_articles.json`
   - 按月份分割生成 `articles_YYYY-MM.json`

### 資料結構

#### metadata.json
```json
{
  "totalArticles": 1500,
  "availableMonths": ["2024-01", "2024-02", "2024-03"],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-03-31"
  }
}
```

#### 文章資料格式
```json
{
  "id": "article_1",
  "title": "央行降息，房市回溫？",
  "author": "張三",
  "fullText": "...",
  "url": "https://...",
  "tag": "政策",
  "publisher": "經濟日報",
  "keywords": ["央行", "降息", "房市"],
  "summary": "...",
  "date": "2024-03-15",
  "預期走向": "上漲",
  "理由": "..."
}
```

## 技術實現

### 前端技術棧

- **核心**：原生 JavaScript (ES6+)，無框架依賴
- **UI 框架**：Bootstrap 4.5.2
- **圖表函式庫**：Chart.js 3.9.1
- **圖示**：Font Awesome 6.4.0
- **字型**：Noto Sans TC（Google Fonts）
- **動畫**：Animate.css 4.1.1

### 後端技術棧

- **伺服器**：Express.js 4.21.2
- **CSV 處理**：csv-parser 3.2.0
- **執行環境**：Node.js 12+

### 瀏覽器 API

- **IndexedDB**：本地資料儲存
- **Fetch API**：非同步資料載入
- **LocalStorage**：使用者偏好設定
- **Intersection Observer**：延遲載入最佳化

### 架構模式

- **模組化設計**：關注點分離，每個模組負責單一職責
- **狀態管理**：集中式狀態管理與訂閱機制
- **事件驅動**：解耦的事件處理系統
- **依賴注入**：模組間透過建構子注入依賴

## 模組說明

### StateManager（狀態管理器）
負責管理應用程式的全域狀態，提供訂閱機制讓其他模組監聽狀態變化。

**主要狀態**：
- `articlesData`：所有文章資料
- `filteredArticlesData`：篩選後的文章
- `currentPage`：當前頁碼
- `viewMode`：檢視模式（card/list）
- `darkMode`：深色模式開關
- `currentChartType`：當前圖表類型

### UIComponents（UI 元件）
負責所有 UI 元件的渲染與更新。

**主要功能**：
- 文章列表渲染（卡片/列表模式）
- 分頁控制項渲染
- 載入動畫與錯誤訊息顯示
- 統計資訊更新

### ChartManager（圖表管理器）
管理所有圖表的建立、更新與銷毀。

**支援圖表類型**：
- 市場趨勢圖（長條圖/折線圖）
- 關鍵詞趨勢圖（長條圖/折線圖）
- 詞雲圖

### EventHandlers（事件處理器）
處理所有使用者互動事件。

**處理事件**：
- 篩選與搜尋
- 分頁切換
- 檢視模式切換
- 圖表類型切換
- 深色模式切換

### AccessibilityManager（無障礙性管理器）
提供完整的無障礙性支援。

**功能**：
- 鍵盤導航管理
- 焦點管理
- ARIA 屬性動態更新
- 螢幕閱讀器公告

### Validator（驗證器）
驗證與清理使用者輸入及 CSV 資料。

**驗證項目**：
- CSV 檔案格式與大小
- 必要欄位檢查
- 資料類型驗證
- XSS 防護

### SecurityUtils（安全工具）
提供安全相關的工具函數。

**功能**：
- HTML 跳脫
- URL 驗證
- 輸入清理

### ErrorHandler（錯誤處理器）
集中處理與記錄應用程式錯誤。

**功能**：
- 錯誤分類與記錄
- 使用者友善的錯誤訊息
- 錯誤回報機制

### CacheManager（快取管理器）
管理資料快取以提升效能。

**功能**：
- 記憶體快取
- 快取失效策略
- 快取清理

### Utilities（工具函數）
提供通用的工具函數。

**功能**：
- 日期格式化
- 資料排序與分組
- 防抖與節流

## 安全性

### 內容安全政策 (CSP)

應用程式實施嚴格的 CSP，限制資源載入來源：

```
default-src 'self';
script-src 'self' https://code.jquery.com https://cdn.jsdelivr.net https://stackpath.bootstrapcdn.com;
style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com https://cdnjs.cloudflare.com https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
connect-src 'self';
frame-src 'none';
object-src 'none';
```

### 輸入驗證

所有使用者輸入都經過嚴格驗證：
- CSV 檔案大小與格式檢查
- 欄位類型與範圍驗證
- HTML 特殊字元跳脫
- URL 格式驗證

### 安全標頭

伺服器設定多重安全標頭：
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 資料清理

- 使用 `DOMPurify`（透過 SecurityUtils）清理 HTML
- 防止 SQL Injection（雖然無資料庫，但驗證邏輯已建立）
- 防止 XSS 攻擊

## 無障礙性

本應用程式遵循 WCAG 2.1 AA 等級標準。

### 鍵盤導航

| 按鍵 | 功能 |
|------|------|
| `Tab` | 移至下一個可聚焦元素 |
| `Shift+Tab` | 移至上一個可聚焦元素 |
| `Enter` | 啟動按鈕或連結 |
| `Space` | 啟動按鈕或切換核取方塊 |
| `Escape` | 關閉對話框或摺疊展開內容 |
| `↑/↓` | 在列表中導航（未來實作） |

### ARIA 支援

- 所有互動元素都有適當的 `role` 屬性
- 使用 `aria-label` 和 `aria-labelledby` 提供描述
- 使用 `aria-live` 區域公告動態內容變化
- 使用 `aria-expanded` 指示展開/摺疊狀態

### 視覺輔助

- 所有圖示都有 `aria-hidden="true"` 並搭配文字說明
- 充足的色彩對比度（符合 AA 等級）
- 清晰的焦點指示器
- 可放大至 200% 不失去功能

### 螢幕閱讀器

- 語意化的 HTML 結構
- 跳過導航連結
- 頁面區域標記（`<header>`, `<main>`, `<nav>`, `<section>`）
- 動態內容更新公告

## 開發指南

### 新增功能

1. 在 `js/modules/` 建立新模組
2. 遵循現有的類別結構與命名慣例
3. 在 `index.html` 中引入模組
4. 在 `App.js` 中初始化模組

### 程式碼風格

- 使用 ES6+ 語法
- 類別與函數使用清晰的註解
- 遵循單一職責原則
- 保持函數簡短（< 50 行）

### 測試

目前專案使用手動測試，未來計畫整合：
- Jest 進行單元測試
- Cypress 進行端對端測試
- Lighthouse 進行效能與無障礙性稽核

### 除錯

開啟瀏覽器開發者工具：
1. **Console**：查看應用程式記錄
2. **Application > IndexedDB**：檢視本地儲存資料
3. **Network**：監控資料載入
4. **Performance**：分析效能瓶頸

### 效能最佳化建議

- 大型資料集使用虛擬捲動
- 圖表使用 requestAnimationFrame
- 圖片使用延遲載入
- 使用 Web Workers 處理大量資料

## 常見問題

### Q: 如何清除已上傳的資料？
A: 開啟瀏覽器開發者工具 → Application → IndexedDB → articlesDatabase，手動刪除資料。未來版本會新增「清除資料」按鈕。

### Q: 支援哪些瀏覽器？
A: 支援所有現代瀏覽器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）。需要支援 ES6、IndexedDB、CSS Grid。

### Q: 可以匯出資料嗎？
A: 目前版本尚未提供匯出功能，計畫在未來版本新增 JSON/CSV 匯出功能。

### Q: 如何更改每頁顯示的文章數量？
A: 在 `js/modules/Constants.js` 中修改 `ARTICLES_PER_PAGE` 常數。

### Q: 圖表不顯示怎麼辦？
A: 檢查：
1. 是否有資料載入
2. 瀏覽器 Console 是否有錯誤訊息
3. 嘗試切換圖表類型
4. 清除快取並重新整理

## 授權條款

本專案採用 ISC 授權條款。詳見 [LICENSE](LICENSE) 檔案。

## 貢獻

歡迎提交 Issue 或 Pull Request！

### 貢獻流程

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'feat: 新增某個很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 提交訊息格式

請遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

- `feat:` 新功能
- `fix:` 錯誤修復
- `docs:` 文件更新
- `style:` 程式碼格式調整
- `refactor:` 重構
- `perf:` 效能改善
- `test:` 測試相關
- `chore:` 建置或輔助工具變更

## 聯絡方式

- 專案網址：[https://github.com/ammosu/PropTrendAnalyzerTW](https://github.com/ammosu/PropTrendAnalyzerTW)
- Issue 回報：[https://github.com/ammosu/PropTrendAnalyzerTW/issues](https://github.com/ammosu/PropTrendAnalyzerTW/issues)

## 致謝

- [Bootstrap](https://getbootstrap.com/) - UI 框架
- [Chart.js](https://www.chartjs.org/) - 圖表函式庫
- [Font Awesome](https://fontawesome.com/) - 圖示集
- [Google Fonts](https://fonts.google.com/) - Noto Sans TC 字型
- [Animate.css](https://animate.style/) - CSS 動畫函式庫

---

**PropTrendAnalyzerTW** - 讓房市趨勢一目了然 📊🏠
