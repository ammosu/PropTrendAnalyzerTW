# PropTrendAnalyzerTW UI 改進實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修復三個 Bug、強化視覺設計（字型/配色/深色模式）、新增關鍵詞雲互動、雙端時間滑桿與洞察摘要區塊。

**Architecture:** 三條獨立線路依序合併：Bug 修復 → 功能擴充 → 視覺設計。所有改動均在現有模組架構（`js/modules/`）內進行，不新增模組檔案。

**Tech Stack:** Vanilla JS (ES6 class)、Chart.js、Bootstrap 4.5、WordCloud2.js、CSS Custom Properties、Google Fonts

---

## 影響檔案總覽

| 檔案 | 變更類型 | 說明 |
|------|---------|------|
| `js/App.js` | 修改 | 修復 filtered-count、新增詞雲點擊事件綁定 |
| `js/modules/ChartManager.js` | 修改 | 修復 mini trend chart bug、新增 `switchToKeyword()`、雙端滑桿渲染 |
| `js/modules/UIComponents.js` | 修改 | 新增 `renderInsights()` |
| `js/modules/StateManager.js` | 修改 | 新增 `insightData` 狀態 |
| `csv-uploader.js` | 修改 | 計算 insightData、修復 doughnut 初始值 |
| `index.html` | 修改 | 新增洞察摘要區塊 HTML、雙端滑桿 HTML、Google Fonts |
| `style.css` | 修改 | clamp 字型、字型變數、配色變數、深色模式補強、滑桿樣式、卡片精緻化 |

---

## Phase 1：Bug 修復

---

### Task 1：修復文章列表「共 0 篇」

**Files:**
- Modify: `js/App.js:568-572`（`handleFilteredArticlesChanged` 函數）

- [ ] **Step 1：確認目前 bug**

開啟瀏覽器至 `http://localhost:3000`，上傳 CSV 後確認下方列表顯示「共 0 篇」。

- [ ] **Step 2：修改 `handleFilteredArticlesChanged`**

找到 `js/App.js` 第 568 行 `handleFilteredArticlesChanged()` 函數，將：

```js
handleFilteredArticlesChanged() {
    const filteredArticlesData = this.stateManager.getState('filteredArticlesData');
    console.log(`過濾後的文章數量: ${filteredArticlesData.length}`);
}
```

改為：

```js
handleFilteredArticlesChanged() {
    const filteredArticlesData = this.stateManager.getState('filteredArticlesData');
    console.log(`過濾後的文章數量: ${filteredArticlesData.length}`);
    if (this.eventHandlers) {
        this.eventHandlers.updateFilterResultCount(filteredArticlesData.length);
    }
}
```

- [ ] **Step 3：驗證**

重新整理頁面並上傳 CSV，確認「共 N 篇」顯示正確文章數量。

- [ ] **Step 4：Commit**

```bash
git add js/App.js
git commit -m "fix: 修復文章列表篩選結果數量顯示為 0"
```

---

### Task 2：修復市場趨勢迷你圓餅圖全灰

**Files:**
- Modify: `js/modules/ChartManager.js:1530`（`renderMiniTrendChart` 函數）

- [ ] **Step 1：確認 bug**

上傳 CSV 後，觀察「數據總覽」中「市場趨勢」卡片，確認圓圈呈灰色無資料。

- [ ] **Step 2：修改欄位名稱**

找到 `js/modules/ChartManager.js` 的 `renderMiniTrendChart()` 函數（約第 1511 行），將：

```js
filteredArticlesData.forEach(article => {
    const trend = article.trend || "無法判斷";
    if (trendCounts.hasOwnProperty(trend)) {
        trendCounts[trend]++;
    }
});
```

改為：

```js
filteredArticlesData.forEach(article => {
    const trend = article.expectedMarketTrend || "無法判斷";
    if (trendCounts.hasOwnProperty(trend)) {
        trendCounts[trend]++;
    }
});
```

- [ ] **Step 3：驗證**

重新整理並上傳 CSV，確認市場趨勢圓餅圖出現上漲（綠）/下跌（紅）/平穩（黃）等顏色分佈。

- [ ] **Step 4：Commit**

```bash
git add js/modules/ChartManager.js
git commit -m "fix: 修復市場趨勢迷你圖使用錯誤欄位名稱 trend -> expectedMarketTrend"
```

---

### Task 3：修復統計卡片數字截斷 + Y 軸整數顯示

**Files:**
- Modify: `style.css`（`.stat-value` 規則）
- Modify: `js/modules/ChartManager.js`（關鍵詞趨勢圖 Y 軸設定，約第 625 行）

- [ ] **Step 1：修復 stat-value CSS**

在 `style.css` 中找到 `.stat-value` 規則，加入 `font-size: clamp` 並移除固定大小（搜尋 `.stat-value`，通常有 `font-size: 2rem` 或類似設定）：

```css
.stat-value {
    font-size: clamp(1.1rem, 2.5vw, 2rem);
    font-weight: 700;
    line-height: 1.2;
    overflow: visible;
    white-space: nowrap;
}
```

- [ ] **Step 2：修復 Y 軸顯示整數**

在 `js/modules/ChartManager.js` 找到關鍵詞趨勢圖的 Y 軸設定（`renderTrendChart` 函數內約第 625 行），將 `ticks` 區塊改為：

```js
ticks: {
    font: { size: 12 },
    precision: 0,
    stepSize: 1
}
```

- [ ] **Step 3：驗證**

重新整理，確認：
- 統計卡片 4 位以上數字（如 41474）完整顯示不截斷
- 關鍵詞趨勢圖 Y 軸只顯示整數（1, 2, 3...）而非小數

- [ ] **Step 4：Commit**

```bash
git add style.css js/modules/ChartManager.js
git commit -m "fix: 修復統計卡片數字截斷與 Y 軸顯示整數"
```

---

## Phase 2：功能擴充

---

### Task 4：新增 insightData 狀態與計算邏輯

**Files:**
- Modify: `js/modules/StateManager.js`（新增 `insightData` 初始狀態）
- Modify: `csv-uploader.js`（新增 `computeInsightData` 函數）

- [ ] **Step 1：StateManager 新增 insightData 初始值**

在 `js/modules/StateManager.js` 找到 `initialState` 物件（搜尋 `articlesData`），新增：

```js
insightData: null,
```

- [ ] **Step 2：新增 computeInsightData 函數到 csv-uploader.js**

在 `csv-uploader.js` 底部（`window.csvUploader` 定義之前）新增：

```js
function computeInsightData(articles) {
    if (!articles || articles.length === 0) return null;

    // Top 5 關鍵詞
    const keywordCounts = {};
    articles.forEach(article => {
        if (article.keywords && Array.isArray(article.keywords)) {
            article.keywords.forEach(kw => {
                if (kw) keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
            });
        }
    });
    const topKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));
    const maxKeywordCount = topKeywords[0]?.count || 1;

    // 趨勢走向分佈
    const trendCounts = { "上漲": 0, "下跌": 0, "平穩": 0, "無相關": 0, "無法判斷": 0 };
    articles.forEach(article => {
        const trend = article.expectedMarketTrend || "無法判斷";
        if (trendCounts.hasOwnProperty(trend)) trendCounts[trend]++;
    });

    // 高峰月份
    const monthlyCounts = {};
    articles.forEach(article => {
        const d = new Date(article.date);
        if (!isNaN(d)) {
            const ym = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyCounts[ym] = (monthlyCounts[ym] || 0) + 1;
        }
    });
    const peakEntry = Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1])[0];
    const peakMonth = peakEntry ? { month: peakEntry[0], count: peakEntry[1] } : null;

    // 近期方向（最近 3 個月 vs 整體上漲比例）
    const sortedMonths = Object.keys(monthlyCounts).sort();
    const recentMonths = sortedMonths.slice(-3);
    const recentArticles = articles.filter(article => {
        const d = new Date(article.date);
        if (isNaN(d)) return false;
        const ym = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        return recentMonths.includes(ym);
    });
    const recentUpRate = recentArticles.length > 0
        ? recentArticles.filter(a => a.expectedMarketTrend === "上漲").length / recentArticles.length
        : 0;
    const overallUpRate = articles.length > 0
        ? trendCounts["上漲"] / articles.length
        : 0;
    const recentTrend = recentUpRate > overallUpRate ? "升溫" : "趨緩";

    return { topKeywords, maxKeywordCount, trendCounts, peakMonth, recentTrend, recentUpRate, overallUpRate };
}
```

- [ ] **Step 3：在資料處理完成後呼叫並儲存**

在 `csv-uploader.js` 的 `updateDataSummary` 函數結尾（約第 905 行，publishers 計算後），新增：

```js
// 計算洞察資料
if (window.app && window.app.stateManager) {
    const insight = computeInsightData(articles);
    window.app.stateManager.updateState('insightData', insight);
}
```

- [ ] **Step 4：Commit**

```bash
git add js/modules/StateManager.js csv-uploader.js
git commit -m "feat: 新增 insightData 狀態計算（Top5 關鍵詞、趨勢分佈、高峰月份、近期方向）"
```

---

### Task 5：新增洞察摘要 HTML 區塊與渲染函數

**Files:**
- Modify: `index.html`（新增洞察摘要 section）
- Modify: `js/modules/UIComponents.js`（新增 `renderInsights` 方法）
- Modify: `js/App.js`（在 `handleArticlesDataLoaded` 中呼叫 `renderInsights`）

- [ ] **Step 1：在 index.html 新增洞察摘要 HTML**

找到 `index.html` 中 `id="stats-section"` 或統計卡片區塊結尾（搜尋 `stat-card stat-card-purple`）的 `</section>` 標籤後，新增：

```html
<!-- 洞察摘要區塊 -->
<section id="insights-section" class="mb-4" style="display:none;" aria-labelledby="insights-heading">
    <div class="card insights-card">
        <div class="card-header bg-primary text-white d-flex align-items-center">
            <i class="fas fa-lightbulb mr-2" aria-hidden="true"></i>
            <h5 id="insights-heading" class="mb-0">本期洞察</h5>
        </div>
        <div class="card-body" id="insights-content">
            <!-- 由 UIComponents.renderInsights() 動態填入 -->
        </div>
    </div>
</section>
```

- [ ] **Step 2：在 UIComponents.js 新增 renderInsights 方法**

在 `js/modules/UIComponents.js` 的 class 中，任意方法後新增：

```js
renderInsights(insightData) {
    const section = document.getElementById('insights-section');
    const content = document.getElementById('insights-content');
    if (!section || !content || !insightData) return;

    section.style.display = 'block';

    const { topKeywords, maxKeywordCount, trendCounts, peakMonth, recentTrend, recentUpRate, overallUpRate } = insightData;

    // Top 5 關鍵詞橫條圖
    const keywordRows = topKeywords.map(({ keyword, count }) => {
        const pct = Math.round((count / maxKeywordCount) * 100);
        return `<div class="insight-keyword-row mb-2">
            <div class="d-flex justify-content-between mb-1">
                <span class="insight-keyword-label">${this.securityUtils.escapeHtml(keyword)}</span>
                <span class="insight-keyword-count text-muted">${count}</span>
            </div>
            <div class="insight-bar-bg">
                <div class="insight-bar-fill" style="width:${pct}%"></div>
            </div>
        </div>`;
    }).join('');

    // 趨勢分佈
    const total = Object.values(trendCounts).reduce((a, b) => a + b, 0);
    const trendHtml = [
        { key: '上漲', cls: 'trend-up' },
        { key: '下跌', cls: 'trend-down' },
        { key: '平穩', cls: 'trend-stable' }
    ].map(({ key, cls }) => {
        const count = trendCounts[key] || 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        return `<span class="insight-trend-badge ${cls}">${key} ${count} 篇 (${pct}%)</span>`;
    }).join('');

    // 高峰月份
    const peakHtml = peakMonth
        ? `<span class="insight-peak">資料高峰：${this.securityUtils.escapeHtml(peakMonth.month)}（${peakMonth.count} 篇）</span>`
        : '';

    // 近期方向
    const recentPct = (recentUpRate * 100).toFixed(1);
    const overallPct = (overallUpRate * 100).toFixed(1);
    const trendIcon = recentTrend === '升溫' ? '↑' : '→';
    const trendCls = recentTrend === '升溫' ? 'trend-up' : 'trend-stable';
    const recentHtml = `<span class="insight-recent ${trendCls}">近 3 個月上漲 ${recentPct}%（整體 ${overallPct}%）— 趨勢${recentTrend} ${trendIcon}</span>`;

    content.innerHTML = `
        <div class="insights-grid">
            <div class="insight-block">
                <div class="insight-block-title"><i class="fas fa-fire mr-1"></i>Top 5 熱門關鍵詞</div>
                ${keywordRows}
            </div>
            <div class="insight-block">
                <div class="insight-block-title"><i class="fas fa-chart-pie mr-1"></i>趨勢走向分佈</div>
                <div class="insight-trend-badges">${trendHtml}</div>
                <div class="mt-3">${peakHtml}</div>
                <div class="mt-2">${recentHtml}</div>
            </div>
        </div>`;
}
```

- [ ] **Step 3：在 App.js 的 handleArticlesDataLoaded 中呼叫**

找到 `js/App.js` 的 `handleArticlesDataLoaded()` 函數，在 `this.updateDataStatistics()` 呼叫後新增：

```js
// 渲染洞察摘要
setTimeout(() => {
    const insightData = this.stateManager.getState('insightData');
    if (insightData && this.uiComponents) {
        this.uiComponents.renderInsights(insightData);
    }
}, 200);
```

- [ ] **Step 4：驗證**

上傳 CSV 後確認統計卡片下方出現「本期洞察」區塊，包含 Top 5 橫條圖、趨勢分佈標籤、高峰月份與近期方向。

- [ ] **Step 5：Commit**

```bash
git add index.html js/modules/UIComponents.js js/App.js
git commit -m "feat: 新增本期洞察摘要區塊（Top5 關鍵詞、趨勢分佈、高峰月份、近期方向）"
```

---

### Task 6：關鍵詞雲點擊互動

**Files:**
- Modify: `js/modules/ChartManager.js`（新增 `switchToKeyword` 方法、詞雲 wordclicked 事件）
- Modify: `js/App.js`（新增詞雲點擊狀態追蹤與清除邏輯）

- [ ] **Step 1：在 ChartManager 的 renderKeywordCloud 加入點擊事件**

在 `js/modules/ChartManager.js` 的 `renderKeywordCloud` 函數中，找到 `WordCloud(canvas, {...})` 呼叫，在其之前儲存已選關鍵詞狀態、之後加入 `wordclicked` 事件：

```js
// 儲存現有選中狀態
const selectedKeyword = this.stateManager.getState('selectedCloudKeyword') || null;

WordCloud(canvas, {
    list: wordCloudData,
    gridSize: Math.round(16 * canvas.width / 1024),
    weightFactor: function(size) {
        return Math.pow(size, 0.5) * canvas.width / 40;
    },
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
    color: function(word) {
        if (selectedKeyword && word === selectedKeyword) return '#f59e0b';
        return colors[Math.floor(Math.random() * colors.length)];
    },
    rotateRatio: 0.3,
    rotationSteps: 2,
    backgroundColor: 'transparent',
    minSize: 12,
    drawOutOfBound: false,
    shrinkToFit: true
});

// 點擊詞雲關鍵詞
canvas.removeEventListener('wordclicked', canvas._wordClickHandler);
canvas._wordClickHandler = (e) => {
    const word = e.detail[0];
    const current = this.stateManager.getState('selectedCloudKeyword');
    const next = current === word ? null : word;
    this.stateManager.updateState('selectedCloudKeyword', next);
    this.switchToKeyword(next);
};
canvas.addEventListener('wordclicked', canvas._wordClickHandler);
```

- [ ] **Step 2：在 ChartManager 新增 switchToKeyword 方法**

在 `ChartManager` class 中（`renderKeywordCloud` 函數之前）新增：

```js
switchToKeyword(keyword) {
    if (!keyword) {
        // 清除篩選：還原為全部文章
        if (window.app && window.app.eventHandlers) {
            window.app.eventHandlers.filterArticles();
        }
        // 重新渲染詞雲（清除高亮）
        this.renderKeywordCloud();
        return;
    }

    // 篩選包含此關鍵詞的文章
    const articlesData = this.stateManager.getState('articlesData') || [];
    const filtered = articlesData.filter(article =>
        article.keywords && Array.isArray(article.keywords) && article.keywords.includes(keyword)
    );
    this.stateManager.setFilteredArticles(filtered);
    if (window.app && window.app.eventHandlers) {
        window.app.eventHandlers.updateFilterResultCount(filtered.length);
    }
    if (window.app && window.app.uiComponents) {
        window.app.uiComponents.renderArticles(1);
        window.app.uiComponents.renderPagination();
    }

    // 切換趨勢圖到「多月比較」模式，只顯示此關鍵詞
    this.renderKeywordTrendForSingleKeyword(keyword);

    // 重新渲染詞雲（加入高亮）
    this.renderKeywordCloud();
}
```

- [ ] **Step 3：在 ChartManager 新增 renderKeywordTrendForSingleKeyword 方法**

在 `switchToKeyword` 方法之後新增：

```js
renderKeywordTrendForSingleKeyword(keyword) {
    const articlesData = this.stateManager.getState('articlesData') || [];
    const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');

    const monthlyCounts = {};
    articlesData.forEach(article => {
        if (article.keywords && article.keywords.includes(keyword)) {
            const d = new Date(article.date);
            if (!isNaN(d)) {
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyCounts[ym] = (monthlyCounts[ym] || 0) + 1;
            }
        }
    });

    const months = Object.keys(monthlyCounts).sort();
    const labels = months.map(m => this.utilities.formatMonthDisplay(m));
    const data = months.map(m => monthlyCounts[m]);

    const existingChart = this.stateManager.getState('trendChart');
    if (existingChart) existingChart.destroy();

    const ctx = document.getElementById('trend').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `「${keyword}」出現次數`,
                data,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: chartAnimationDuration, easing: 'easeOutQuart' },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 } },
                x: { ticks: { maxRotation: 45, minRotation: 45 } }
            },
            plugins: {
                legend: { display: true },
                tooltip: { callbacks: { label: ctx => ` 出現 ${ctx.raw} 次` } }
            }
        }
    });
    this.stateManager.setState && this.stateManager.setState('trendChart', chart);
    if (this.stateManager.setTrendChart) this.stateManager.setTrendChart(chart);
}
```

- [ ] **Step 4：驗證**

上傳 CSV，切換到關鍵詞雲分頁，點擊任一關鍵詞（如「房價」），確認：
- 詞雲中該詞顏色變為橘黃色高亮
- 下方文章列表篩選為包含「房價」的文章
- 趨勢圖切換為該關鍵詞的月別時間序列

再點一次同一個詞，確認篩選清除、恢復原始狀態。

- [ ] **Step 5：Commit**

```bash
git add js/modules/ChartManager.js js/App.js
git commit -m "feat: 關鍵詞雲點擊互動——同步篩選文章與趨勢圖時間序列"
```

---

### Task 7：雙端時間滑桿 + 快速按鈕

**Files:**
- Modify: `index.html`（替換現有月份滑桿為雙端滑桿結構）
- Modify: `style.css`（雙端滑桿樣式）
- Modify: `js/modules/ChartManager.js`（`initializeMonthSlider` 改為雙端滑桿邏輯）
- Modify: `js/modules/EventHandlers.js`（`initializeMonthSlider` 呼叫更新）

- [ ] **Step 1：在 index.html 替換月份滑桿 HTML**

找到 `index.html` 中 `id="month-slider"` 所在的 `.month-slider-container` 區塊（約第 263 行），將整個 `<div class="month-slider-container">...</div>` 替換為：

```html
<!-- 關鍵詞趨勢圖 — 時間範圍控制（雙端滑桿） -->
<div id="keyword-trend-controls" class="mb-3">
    <!-- 快速時間按鈕 -->
    <div class="d-flex flex-wrap mb-2" id="quick-range-buttons">
        <button class="btn btn-sm btn-outline-primary quick-range-btn mr-1 mb-1" data-range="3">近 3 個月</button>
        <button class="btn btn-sm btn-outline-primary quick-range-btn mr-1 mb-1" data-range="6">近 6 個月</button>
        <button class="btn btn-sm btn-outline-primary quick-range-btn mr-1 mb-1" data-range="12">近 1 年</button>
        <button class="btn btn-sm btn-outline-primary quick-range-btn active mb-1" data-range="all">全部</button>
    </div>
    <!-- 雙端滑桿 -->
    <div class="dual-range-wrapper" id="dual-range-wrapper">
        <div class="dual-range-track">
            <div class="dual-range-fill" id="dual-range-fill"></div>
        </div>
        <input type="range" id="range-start" class="dual-range-input" min="0" max="100" value="0" step="1">
        <input type="range" id="range-end" class="dual-range-input" min="0" max="100" value="100" step="1">
    </div>
    <div class="d-flex justify-content-between mt-1">
        <span class="dual-range-label" id="range-start-label">-</span>
        <span class="dual-range-label" id="range-end-label">-</span>
    </div>
</div>
```

- [ ] **Step 2：在 style.css 新增雙端滑桿樣式**

在 `style.css` 末尾新增：

```css
/* === 雙端時間滑桿 === */
.dual-range-wrapper {
    position: relative;
    height: 40px;
    display: flex;
    align-items: center;
}

.dual-range-track {
    position: absolute;
    width: 100%;
    height: 6px;
    background: var(--border-color, #dee2e6);
    border-radius: 3px;
    z-index: 1;
}

.dual-range-fill {
    position: absolute;
    height: 100%;
    background: var(--primary, #3b82f6);
    border-radius: 3px;
}

.dual-range-input {
    position: absolute;
    width: 100%;
    height: 6px;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    pointer-events: none;
    z-index: 2;
}

.dual-range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary, #3b82f6);
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    cursor: pointer;
    pointer-events: all;
    transition: transform 0.1s ease;
}

.dual-range-input::-webkit-slider-thumb:hover {
    transform: scale(1.2);
}

.dual-range-input::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary, #3b82f6);
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    cursor: pointer;
    pointer-events: all;
}

.dual-range-label {
    font-size: 0.8rem;
    color: var(--text-muted, #6c757d);
    font-weight: 500;
}

.quick-range-btn.active {
    background: var(--primary, #3b82f6);
    color: #fff;
    border-color: var(--primary, #3b82f6);
}

/* 深色模式 */
[data-theme="dark"] .dual-range-track {
    background: rgba(255,255,255,0.15);
}

[data-theme="dark"] .dual-range-label {
    color: rgba(255,255,255,0.6);
}
```

- [ ] **Step 3：在 ChartManager 新增 initializeDualRangeSlider 方法**

在 `js/modules/ChartManager.js` 中找到 `initDoughnutMonthSlider` 方法，**之前**新增：

```js
initializeDualRangeSlider(months, formattedLabels) {
    const startInput = document.getElementById('range-start');
    const endInput = document.getElementById('range-end');
    const fill = document.getElementById('dual-range-fill');
    const startLabel = document.getElementById('range-start-label');
    const endLabel = document.getElementById('range-end-label');
    const wrapper = document.getElementById('dual-range-wrapper');

    if (!startInput || !endInput || !wrapper) return;

    const maxIdx = months.length - 1;
    startInput.max = maxIdx;
    endInput.max = maxIdx;
    startInput.value = 0;
    endInput.value = maxIdx;

    const updateFill = () => {
        const s = parseInt(startInput.value);
        const e = parseInt(endInput.value);
        const leftPct = (s / maxIdx) * 100;
        const rightPct = 100 - (e / maxIdx) * 100;
        fill.style.left = `${leftPct}%`;
        fill.style.right = `${rightPct}%`;
        startLabel.textContent = formattedLabels[s] || '-';
        endLabel.textContent = formattedLabels[e] || '-';
    };

    updateFill();

    const onRangeChange = () => {
        let s = parseInt(startInput.value);
        let e = parseInt(endInput.value);
        if (s > e) { s = e; startInput.value = s; }
        updateFill();

        const selectedMonths = months.slice(s, e + 1);
        this.stateManager.updateState('trendMonthRange', { start: months[s], end: months[e] });
        // 觸發圖表重新渲染
        const currentSelectedMonth = months[s];
        this.renderTrendChart(currentSelectedMonth);
    };

    startInput.addEventListener('input', onRangeChange);
    endInput.addEventListener('input', onRangeChange);

    // 快速按鈕
    document.querySelectorAll('.quick-range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quick-range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const range = btn.dataset.range;
            const endIdx = maxIdx;
            let startIdx = 0;

            if (range !== 'all') {
                const n = parseInt(range);
                startIdx = Math.max(0, endIdx - n + 1);
            }

            startInput.value = startIdx;
            endInput.value = endIdx;
            updateFill();

            const selectedMonths = months.slice(startIdx, endIdx + 1);
            this.stateManager.updateState('trendMonthRange', { start: months[startIdx], end: months[endIdx] });
            this.renderTrendChart(months[endIdx]);
        });
    });
}
```

- [ ] **Step 4：在 EventHandlers.initializeMonthSlider 中改呼叫新方法**

找到 `js/modules/EventHandlers.js` 第 1268 行的 `initializeMonthSlider()` 函數，將函數內容替換為：

```js
initializeMonthSlider() {
    const filteredData = this.stateManager.getState('filteredArticlesData');
    const articlesData = this.stateManager.getState('articlesData');
    const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);

    if (months.length === 0) {
        console.warn('沒有可用的月份資料');
        return;
    }

    const formattedLabels = months.map(m => this.utilities.formatMonthDisplay(m));

    // 改用雙端滑桿
    this.chartManager.initializeDualRangeSlider(months, formattedLabels);

    // 初始渲染最新月份
    this.chartManager.renderTrendChart(months[months.length - 1]);
}
```

- [ ] **Step 5：驗證**

上傳 CSV 後確認：
- 關鍵詞趨勢圖上方出現快速按鈕（近 3 個月、近 6 個月、近 1 年、全部）
- 雙端滑桿可拖動，下方顯示選取的起訖月份標籤
- 點擊「近 1 年」後，滑桿自動移動到對應位置

- [ ] **Step 6：Commit**

```bash
git add index.html style.css js/modules/ChartManager.js js/modules/EventHandlers.js
git commit -m "feat: 新增雙端時間滑桿與快速時間範圍按鈕"
```

---

## Phase 3：視覺設計

---

### Task 8：引入 Google Fonts 與字型 CSS 變數

**Files:**
- Modify: `index.html`（新增 Google Fonts `<link>`）
- Modify: `style.css`（新增字型 CSS 變數並套用）

- [ ] **Step 1：在 index.html 的 `<head>` 加入 Google Fonts**

找到 `index.html` 的 `</head>` 之前，加入：

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2：在 style.css 的 `:root` 新增字型變數**

找到 `style.css` 的 `:root { ... }` 區塊，新增：

```css
--font-body: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
--font-display: 'DM Sans', 'Noto Sans TC', sans-serif;
--font-mono: 'DM Mono', monospace;
```

- [ ] **Step 3：套用字型**

在 `style.css` 的 `body` 規則中，將 `font-family` 改為 `var(--font-body)`：

```css
body {
    font-family: var(--font-body);
}
```

找到標題相關規則（`h1, h2, h3, h4, h5`），加入：

```css
h1, h2, h3, h4, h5, .card-header, .btn {
    font-family: var(--font-display);
}
```

找到 `.stat-value`，加入：

```css
.stat-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
}
```

- [ ] **Step 4：驗證**

重新整理頁面（需要網路連線），確認標題文字變為 DM Sans、中文內文為 Noto Sans TC、統計數字使用等寬字型。

- [ ] **Step 5：Commit**

```bash
git add index.html style.css
git commit -m "feat: 引入 Google Fonts（DM Sans、Noto Sans TC、DM Mono）"
```

---

### Task 9：配色精緻化與趨勢語意色

**Files:**
- Modify: `style.css`（新增藍色三層變數、趨勢語意色變數、套用至相關元素）

- [ ] **Step 1：在 style.css `:root` 新增配色變數**

在 `:root { ... }` 中補充：

```css
/* 三層藍色 */
--blue-400: #60a5fa;
--blue-500: #3b82f6;
--blue-600: #2563eb;
--primary: var(--blue-500);
--primary-hover: var(--blue-600);
--primary-light: var(--blue-400);

/* 趨勢語意色 */
--trend-up:     #16a34a;
--trend-down:   #dc2626;
--trend-stable: #64748b;
--trend-none:   #94a3b8;
```

- [ ] **Step 2：更新 `.btn-primary` 與 `.bg-primary` 使用新變數**

找到 `style.css` 中所有 `#007bff` 或 `#0056b3`（Bootstrap 預設藍），替換為 `var(--primary)` 和 `var(--primary-hover)`：

```css
.btn-primary {
    background-color: var(--primary);
    border-color: var(--primary);
    transition: all 0.15s ease;
}
.btn-primary:hover {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
}
```

- [ ] **Step 3：新增趨勢語意色 CSS 類別**

```css
.trend-up    { color: var(--trend-up); }
.trend-down  { color: var(--trend-down); }
.trend-stable { color: var(--trend-stable); }
.trend-none  { color: var(--trend-none); }

.insight-trend-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 600;
    margin-right: 6px;
    margin-bottom: 4px;
}
.insight-trend-badge.trend-up    { background: rgba(22,163,74,0.12); color: var(--trend-up); }
.insight-trend-badge.trend-down  { background: rgba(220,38,38,0.12); color: var(--trend-down); }
.insight-trend-badge.trend-stable { background: rgba(100,116,139,0.12); color: var(--trend-stable); }
```

- [ ] **Step 4：Commit**

```bash
git add style.css
git commit -m "feat: 精緻化配色變數與新增趨勢語意色 CSS 類別"
```

---

### Task 10：卡片精緻化與深色模式補強

**Files:**
- Modify: `style.css`（卡片 shadow/radius、按鈕 transition、深色模式補強）

- [ ] **Step 1：更新卡片樣式**

找到 `style.css` 的 `.card` 規則（或 `.stat-card`），更新：

```css
.card {
    border-radius: 12px;
    border: 1px solid var(--border-color, #e5e7eb);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s ease;
}

.card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06);
}

.stat-card {
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
}
```

- [ ] **Step 2：補強深色模式 — 卡片與 tooltip**

在 `style.css` 中找到 `[data-theme="dark"]` 區塊，補充：

```css
[data-theme="dark"] .card {
    background: #1e293b;
    border-color: rgba(255,255,255,0.08);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
}

[data-theme="dark"] .stat-card {
    background: #1e293b;
    border-color: rgba(255,255,255,0.08);
}

[data-theme="dark"] .insight-trend-badge.trend-up {
    background: rgba(22,163,74,0.2);
}
[data-theme="dark"] .insight-trend-badge.trend-down {
    background: rgba(220,38,38,0.2);
}
[data-theme="dark"] .insight-trend-badge.trend-stable {
    background: rgba(100,116,139,0.2);
}
```

- [ ] **Step 3：新增洞察摘要區塊樣式**

```css
/* === 洞察摘要 === */
.insights-card .card-body { padding: 1.25rem; }

.insights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

@media (max-width: 576px) {
    .insights-grid { grid-template-columns: 1fr; }
}

.insight-block-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--primary);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.insight-keyword-label {
    font-size: 0.875rem;
    font-weight: 500;
}

.insight-keyword-count {
    font-family: var(--font-mono);
    font-size: 0.8rem;
}

.insight-bar-bg {
    height: 6px;
    background: var(--border-color, #e5e7eb);
    border-radius: 3px;
    overflow: hidden;
}

.insight-bar-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 3px;
    transition: width 0.6s ease;
}

.insight-peak,
.insight-recent {
    font-size: 0.85rem;
    font-weight: 500;
}

[data-theme="dark"] .insight-bar-bg {
    background: rgba(255,255,255,0.1);
}
```

- [ ] **Step 4：驗證**

切換深色模式，確認卡片背景、洞察摘要、趨勢標籤在深色模式下正確顯示。

- [ ] **Step 5：Commit**

```bash
git add style.css
git commit -m "feat: 卡片精緻化（shadow/radius）與深色模式補強"
```

---

## 完成後驗證清單

- [ ] 上傳 CSV 後「共 N 篇」顯示正確數量
- [ ] 市場趨勢迷你圓餅圖出現顏色分佈（非全灰）
- [ ] 統計卡片 5 位數完整顯示（如 41474）
- [ ] Y 軸只顯示整數刻度
- [ ] 「本期洞察」區塊顯示 Top5、趨勢分佈、高峰月份
- [ ] 點擊詞雲關鍵詞 → 文章列表篩選 + 趨勢圖更新
- [ ] 雙端滑桿可操作，快速按鈕功能正常
- [ ] 字型正確套用（DM Sans 標題、Noto Sans TC 內文、DM Mono 數字）
- [ ] 深色模式下所有元素顯示正常
