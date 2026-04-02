# PropTrendAnalyzerTW UI 改進設計規格

**日期**: 2026-04-02  
**範圍**: Bug 修復 + 視覺設計精緻化 + 功能擴充  
**實作策略**: 方案三 — 分模組並行，合併順序：Bug → 功能 → 視覺

---

## 一、Bug 修復

### 1.1 統計卡片數字截斷
- **問題**: `.stat-value` 固定字體大小，5 位數（如 41474）超出卡片寬度被截斷
- **修法**: 使用 `font-size: clamp(1.2rem, 3vw, 2rem)` 自動縮放，確保任意位數都能完整顯示
- **檔案**: `style.css` → `.stat-value`

### 1.2 市場趨勢圓餅圖空白
- **問題**: `ChartManager` 渲染 doughnut 圖時需要 `doughnutSelectedMonth` 狀態，但資料初次載入時該值未設定，導致圖表跳過渲染
- **修法**: 在 `csv-uploader.js` 的資料處理完成後，自動設定最新月份為 `doughnutSelectedMonth` 預設值，再觸發圖表渲染
- **檔案**: `csv-uploader.js`、`js/modules/ChartManager.js`

### 1.3 文章列表「共 0 篇」
- **問題**: `filtered-count` DOM 元素只在 `EventHandlers.applyFilters()` 中更新，但初次載入走 `App.initializePage()` 直接設定 `filteredArticles`，未觸發 `updateFilterResultCount()`
- **修法**: 在 `App.initializePage()` 的 `setFilteredArticles()` 呼叫後，補呼叫 `eventHandlers.updateFilterResultCount(articles.length)`
- **檔案**: `js/App.js`

---

## 二、視覺設計

### 2.1 字型引入
從 Google Fonts 引入：
- **Noto Sans TC** (`wght@400;500;700`) — 中文內文、UI 標籤
- **DM Sans** (`wght@400;500;700`) — 英文標題、按鈕
- **DM Mono** (`wght@400;500`) — 數字統計值（tabular figures）

CSS 套用方式：
```css
:root {
  --font-body: 'Noto Sans TC', sans-serif;
  --font-display: 'DM Sans', 'Noto Sans TC', sans-serif;
  --font-mono: 'DM Mono', monospace;
}

body { font-family: var(--font-body); }
h1, h2, h3, h4, h5, .stat-value { font-family: var(--font-display); }
.stat-value { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```

### 2.2 配色精緻化
保留藍色主調，改為三層藍色變數：
```css
:root {
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --primary: var(--blue-500);
  --primary-hover: var(--blue-600);
  --primary-light: var(--blue-400);
}
```

趨勢語意色（淺色/深色模式共用）：
```css
--trend-up:     #16a34a;   /* 上漲 — 綠 */
--trend-down:   #dc2626;   /* 下跌 — 紅 */
--trend-stable: #64748b;   /* 平穩 — 灰藍 */
--trend-none:   #94a3b8;   /* 無相關/無法判斷 */
```

### 2.3 深色模式補強
補齊以下元素的 `[data-theme="dark"]` 覆蓋樣式：
- 統計卡片背景與邊框
- 圖表 tooltip 背景
- 篩選區塊 select/input
- 洞察摘要卡片（新增）
- 雙端滑桿軌道顏色

### 2.4 細節精緻化
- 卡片加 `box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)`
- 按鈕加 `transition: all 0.15s ease` hover 效果
- 統計數字字重 700、字距 `-0.02em`
- 卡片 `border-radius` 統一為 `12px`

---

## 三、功能擴充

### 3.1 關鍵詞雲互動
**互動行為**：
- 詞雲每個詞加 `cursor: pointer`、hover 加亮（`filter: brightness(1.2)`）
- 點擊後：
  1. 呼叫 `EventHandlers.filterByKeyword(keyword)` 更新 `filteredArticlesData`，文章列表重新渲染
  2. 呼叫 `ChartManager.switchToKeyword(keyword)` 切換趨勢圖到該詞的多月時間序列
- 選中狀態：被選中的詞顯示底線 + 邊框，未選中時點擊清除篩選
- **檔案**: `js/modules/ChartManager.js`（新增 `switchToKeyword`）、`js/App.js`（詞雲點擊事件綁定）

### 3.2 雙端時間滑桿 + 快速按鈕
**雙端滑桿**：
- 使用兩個 `<input type="range">` 疊加，純 CSS + JS 實作，不引入額外套件
- 滑桿下方顯示選取區間標籤：`2022/01 ～ 2024/06`
- 範圍變更後觸發圖表重新渲染

**快速按鈕**（加在圖表區塊上方）：
- `近 3 個月` / `近 6 個月` / `近 1 年` / `全部`
- 樣式與文章列表現有快速按鈕一致（`btn btn-sm btn-outline-primary`）
- 點擊後自動更新雙端滑桿位置 + 觸發圖表更新

**影響範圍**: 雙端滑桿只控制**關鍵詞趨勢圖**（取代現有單月滑桿）；市場趨勢 doughnut 圖保留現有獨立單月滑桿不變  
**檔案**: `index.html`（HTML 結構）、`style.css`（雙端滑桿樣式）、`js/modules/ChartManager.js`（接收時間範圍參數）

### 3.3 洞察摘要區塊
新增「本期洞察」卡片，位置：統計數字卡片下方、數據總覽上方。

**包含內容**：
1. **Top 5 關鍵詞**：依出現頻率排序，每個詞附小橫條圖（純 CSS width %）
2. **趨勢走向分佈**：上漲 N 篇 / 下跌 N 篇 / 平穩 N 篇，使用語意色標示
3. **高峰月份**：自動計算文章最多的月份，顯示「資料高峰：YYYY/MM（N 篇）」
4. **近期方向**：最近 3 個月上漲比例 vs 整體平均，若高於平均則顯示「趨勢升溫 ↑」，否則「趨勢趨緩 →」

**資料計算**：在 `csv-uploader.js` 資料處理完成後計算，存入 `StateManager`（新增 `insightData` 狀態）  
**渲染**：`UIComponents.renderInsights(insightData)` 新增方法  
**檔案**: `js/modules/UIComponents.js`、`js/modules/StateManager.js`、`csv-uploader.js`、`index.html`

---

## 實作合併順序

1. **Bug 修復線**（影響：`App.js`、`csv-uploader.js`、`ChartManager.js`、`style.css`）
2. **功能擴充線**（影響：`App.js`、`ChartManager.js`、`UIComponents.js`、`StateManager.js`、`index.html`）
3. **視覺設計線**（影響：`style.css`、`index.html` 字型引入）— 最後合，避免被覆蓋

---

## 不在本次範圍

- 後端 API 變更
- 新增資料來源
- 效能優化（IndexedDB 分頁快取等）
- 匯出功能改動
