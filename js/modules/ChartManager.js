/**
 * ChartManager.js - 圖表管理模組
 *
 * 使用 Chart.js 管理所有圖表渲染，包含關鍵詞趨勢圖與市場趨勢圖
 *
 * @class ChartManager
 * @description 圖表渲染與管理，支援動態切換圖表類型
 */
class ChartManager {
    /**
     * 建立 ChartManager 實例
     * @constructor
     * @param {StateManager} stateManager - 狀態管理器實例
     * @param {UIComponents} uiComponents - UI 元件實例
     */
    constructor(stateManager, uiComponents) {
        this.stateManager = stateManager;
        this.uiComponents = uiComponents;
        this.utilities = window.Utilities;
        this._initThemeObserver();
    }

    /**
     * 監聽 <html data-theme> 變化，主題切換時重繪可見的文字雲。
     * （文字雲色票依主題分組，但 canvas 是一次性繪製，需手動重繪。）
     */
    _initThemeObserver() {
        if (!('MutationObserver' in window)) return;
        this._themeObserver = new MutationObserver(() => {
            this.applyChartThemeDefaults();
            const container = document.getElementById('keywordCloudContainer');
            if (container && container.style.display !== 'none' && container.offsetParent !== null) {
                this.renderKeywordCloud();
            }
            // 長條／趨勢圖的刻度與圖例色也是繪製當下取的，主題切換後重畫
            if (this.stateManager.getState('expectedTrendChart')) this.renderExpectedTrendChart();
            const singleMode = document.getElementById('single-month-mode');
            if (singleMode?.classList.contains('active') && this.renderCurrentKeywordRange) this.renderCurrentKeywordRange();
        });
        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    // Chart.js 未指定顏色的文字（圖例、刻度）跟著主題，深色底才讀得到
    applyChartThemeDefaults() {
        if (typeof Chart === 'undefined' || !window.DesignTokens) return;
        Chart.defaults.color = window.DesignTokens.color('text-secondary');
        Chart.defaults.borderColor = window.DesignTokens.withAlpha('text-muted', 0.2);
    }

    // 渲染預期趨勢圖表
    renderExpectedTrendChart(chartType = null) {
        this.applyChartThemeDefaults();
        this.uiComponents.showLoading('正在生成市場趨勢分佈圖表...');

        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const currentChartType = chartType || this.stateManager.getState('currentChartType') || 'bar';
        const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');

        // 如果過濾資料為空，嘗試使用原始資料
        if (!filteredArticlesData || filteredArticlesData.length === 0) {
            const articlesData = this.stateManager.getState('articlesData');
            if (articlesData && articlesData.length > 0) {
                console.log('使用原始文章資料渲染圖表');
                filteredArticlesData = articlesData;
            } else {
                console.warn('沒有可用的文章資料，無法渲染預期趨勢圖表');
                this.showEmptyChart('expectedTrendChart', '無可用的趨勢資料');
                this.uiComponents.hideLoading();
                return;
            }
        }

        const months = this.utilities.getMonthRange(filteredArticlesData);
        const trendCountsPerMonth = {};
        const trendTypes = ["上漲", "下跌", "平穩", "無相關", "無法判斷"];

        months.forEach(month => {
            trendCountsPerMonth[month] = {
                "上漲": 0,
                "下跌": 0,
                "平穩": 0,
                "無相關": 0,
                "無法判斷": 0
            };
        });

        filteredArticlesData.forEach(article => {
            const articleDate = new Date(article.date);
            const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;

            if (trendCountsPerMonth[articleYearMonth] && trendCountsPerMonth[articleYearMonth][article.expectedMarketTrend] !== undefined) {
                trendCountsPerMonth[articleYearMonth][article.expectedMarketTrend]++;
            }
        });

        const formattedLabels = months.map(month => this.utilities.formatMonthDisplay(month));

        // 使用 Constants 定義的專業配色方案
        const trendColors = {
            "上漲": {
                backgroundColor: Constants.COLORS.TREND.UP + 'B3',
                borderColor: Constants.COLORS.TREND.UP
            },
            "下跌": {
                backgroundColor: Constants.COLORS.TREND.DOWN + 'B3',
                borderColor: Constants.COLORS.TREND.DOWN
            },
            "平穩": {
                backgroundColor: Constants.COLORS.TREND.STABLE + 'B3',
                borderColor: Constants.COLORS.TREND.STABLE
            },
            "無相關": {
                backgroundColor: Constants.COLORS.TREND.UNRELATED + 'B3',
                borderColor: Constants.COLORS.TREND.UNRELATED
            },
            "無法判斷": {
                backgroundColor: Constants.COLORS.TREND.UNKNOWN + 'B3',
                borderColor: Constants.COLORS.TREND.UNKNOWN
            }
        };

        const existingChart = this.stateManager.getState('expectedTrendChart');
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = document.getElementById('expectedTrendChart').getContext('2d');
        let chart;

        // 根據圖表類型選擇不同的渲染方式
        if (currentChartType === 'doughnut') {
            // 儲存資料供滑桿使用
            this.doughnutData = { trendTypes, trendColors, trendCountsPerMonth, months, formattedLabels, chartAnimationDuration };
            this.initDoughnutMonthSlider(months, formattedLabels);
            this.showDoughnutControls(true);

            // 預設顯示全部月份
            const selectedMonth = this.stateManager.getState('doughnutSelectedMonth');
            chart = this.renderDoughnutChart(ctx, trendTypes, trendColors, trendCountsPerMonth, months, chartAnimationDuration, selectedMonth);
        } else {
            this.showDoughnutControls(false);
            if (currentChartType === 'percentage') {
                chart = this.renderPercentageChart(ctx, trendTypes, trendColors, trendCountsPerMonth, months, formattedLabels, chartAnimationDuration);
            } else {
                chart = this.renderTimeSeriesChart(ctx, currentChartType, trendTypes, trendColors, trendCountsPerMonth, months, formattedLabels, chartAnimationDuration);
            }
        }

        this.stateManager.setExpectedTrendChart(chart);
        this.stateManager.updateState('currentChartType', currentChartType);
        this.updateChartDescription(currentChartType);
        this.uiComponents.hideLoading();
    }

    // 顯示/隱藏甜甜圈圖控制項
    showDoughnutControls(show) {
        const controls = document.getElementById('doughnut-month-controls');
        if (controls) {
            controls.style.display = show ? 'block' : 'none';
        }
    }

    // 初始化雙端時間滑桿
    initializeDualRangeSlider(months, formattedLabels) {
        // Guard: 檢查月份資料
        if (!months || months.length === 0) {
            console.warn('initializeDualRangeSlider: 沒有月份資料');
            return;
        }

        let startInput = document.getElementById('range-start');
        let endInput = document.getElementById('range-end');
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
            const leftPct = maxIdx > 0 ? (s / maxIdx) * 100 : 0;
            const rightPct = maxIdx > 0 ? 100 - (e / maxIdx) * 100 : 0;
            fill.style.left = `${leftPct}%`;
            fill.style.right = `${rightPct}%`;
            if (startLabel) startLabel.textContent = formattedLabels[s] || '-';
            if (endLabel) endLabel.textContent = formattedLabels[e] || '-';
        };

        updateFill();

        const onRangeChange = () => {
            let s = parseInt(startInput.value);
            let e = parseInt(endInput.value);
            if (s > e) {
                const temp = s;
                s = e;
                e = temp;
                startInput.value = s;
                endInput.value = e;
            }
            updateFill();
            this.renderTrendChart(months[s], months[e]);
        };

        // 移除舊的事件監聽器（用 cloneNode 取代節點）
        const newStartInput = startInput.cloneNode(true);
        startInput.parentNode.replaceChild(newStartInput, startInput);
        startInput = newStartInput;

        const newEndInput = endInput.cloneNode(true);
        endInput.parentNode.replaceChild(newEndInput, endInput);
        endInput = newEndInput;

        startInput.addEventListener('input', onRangeChange);
        endInput.addEventListener('input', onRangeChange);

        // 供「期間排行」模式切回時重繪目前滑桿範圍
        this.renderCurrentKeywordRange = () => {
            this.renderTrendChart(months[parseInt(startInput.value)], months[parseInt(endInput.value)]);
        };

        // 快速按鈕：先移除舊的事件監聽器，再重新綁定
        document.querySelectorAll('.quick-range-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });

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
                this.renderTrendChart(months[startIdx], months[endIdx]);
            });
        });
    }

    // 初始化甜甜圈圖月份滑桿
    initDoughnutMonthSlider(months, formattedLabels) {
        const slider = document.getElementById('doughnut-month-slider');
        const monthLabel = document.getElementById('doughnut-selected-month');
        const showAllBtn = document.getElementById('doughnut-show-all');

        if (!slider || !monthLabel) return;

        // 設定滑桿範圍（0 = 全部，1-n = 各月份）
        slider.min = 0;
        slider.max = months.length;
        slider.value = 0;

        // 更新標籤
        this.updateDoughnutMonthLabel(0, formattedLabels);

        // 設定「顯示全部」按鈕狀態
        if (showAllBtn) {
            showAllBtn.classList.add('active');
        }
    }

    // 更新甜甜圈圖月份標籤
    updateDoughnutMonthLabel(value, formattedLabels) {
        const monthLabel = document.getElementById('doughnut-selected-month');
        const showAllBtn = document.getElementById('doughnut-show-all');

        if (!monthLabel) return;

        if (value === 0 || value === '0') {
            monthLabel.textContent = '全部月份';
            if (showAllBtn) showAllBtn.classList.add('active');
        } else {
            const index = parseInt(value) - 1;
            monthLabel.textContent = formattedLabels[index] || '';
            if (showAllBtn) showAllBtn.classList.remove('active');
        }
    }

    // 更新甜甜圈圖（供滑桿呼叫）
    updateDoughnutByMonth(monthIndex) {
        if (!this.doughnutData) return;

        const { trendTypes, trendColors, trendCountsPerMonth, months, formattedLabels, chartAnimationDuration } = this.doughnutData;
        const selectedMonth = monthIndex === 0 ? null : months[monthIndex - 1];
        const monthLabel = monthIndex === 0 ? null : formattedLabels[monthIndex - 1];

        this.updateDoughnutMonthLabel(monthIndex, formattedLabels);
        this.stateManager.updateState('doughnutSelectedMonth', selectedMonth);

        const existingChart = this.stateManager.getState('expectedTrendChart');
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = document.getElementById('expectedTrendChart').getContext('2d');
        const chart = this.renderDoughnutChart(ctx, trendTypes, trendColors, trendCountsPerMonth, months, chartAnimationDuration, selectedMonth);

        this.stateManager.setExpectedTrendChart(chart);
        this.updateChartDescription('doughnut', monthLabel);
    }

    // 渲染時間序列圖表（長條圖、折線圖、面積圖）
    renderTimeSeriesChart(ctx, chartType, trendTypes, trendColors, trendCountsPerMonth, months, formattedLabels, chartAnimationDuration) {
        const isStacked = chartType === 'bar' || chartType === 'area';
        const actualChartType = chartType === 'area' ? 'line' : chartType;

        const trendDatasets = trendTypes.map(trend => {
            return {
                label: trend,
                data: months.map(month => trendCountsPerMonth[month][trend]),
                backgroundColor: trendColors[trend].backgroundColor,
                borderColor: trendColors[trend].borderColor,
                borderWidth: chartType === 'area' ? 2 : 1,
                fill: chartType === 'area' ? 'origin' : (chartType === 'bar'),
                tension: 0.3,
                pointRadius: chartType === 'line' ? 4 : (chartType === 'area' ? 2 : 0),
                pointHoverRadius: chartType === 'line' ? 6 : (chartType === 'area' ? 4 : 0),
                pointBackgroundColor: trendColors[trend].borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            };
        });

        return new Chart(ctx, {
            type: actualChartType,
            data: {
                labels: formattedLabels,
                datasets: trendDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: chartAnimationDuration,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        stacked: isStacked,
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                    },
                    y: {
                        stacked: isStacked,
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { font: { size: 12 } }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { font: { size: 14, weight: 'bold' }, padding: 15 }
                    },
                    tooltip: this.getTooltipConfig()
                },
                onClick: (event, elements) => {
                    this.handleTrendChartClick(event, elements, months, formattedLabels);
                }
            }
        });
    }

    // 渲染百分比堆疊圖表
    renderPercentageChart(ctx, trendTypes, trendColors, trendCountsPerMonth, months, formattedLabels, chartAnimationDuration) {
        // 計算每月總數和百分比
        const percentageData = {};
        months.forEach(month => {
            const total = trendTypes.reduce((sum, trend) => sum + trendCountsPerMonth[month][trend], 0);
            percentageData[month] = {};
            trendTypes.forEach(trend => {
                percentageData[month][trend] = total > 0 ? (trendCountsPerMonth[month][trend] / total * 100) : 0;
            });
        });

        const trendDatasets = trendTypes.map(trend => {
            return {
                label: trend,
                data: months.map(month => percentageData[month][trend]),
                backgroundColor: trendColors[trend].backgroundColor,
                borderColor: trendColors[trend].borderColor,
                borderWidth: 1
            };
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: trendDatasets
            },
            options: {
                onClick: (event, elements) => {
                    this.handleTrendChartClick(event, elements, months, formattedLabels);
                },
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: chartAnimationDuration,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            font: { size: 12 },
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { font: { size: 14, weight: 'bold' }, padding: 15 }
                    },
                    tooltip: {
                        ...this.getTooltipConfig(),
                        callbacks: {
                            title: tooltipItems => tooltipItems[0].label,
                            label: context => {
                                const label = context.dataset.label || '';
                                const value = context.raw.toFixed(1);
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 渲染甜甜圈圖表
    renderDoughnutChart(ctx, trendTypes, trendColors, trendCountsPerMonth, months, chartAnimationDuration, selectedMonth = null) {
        // 根據是否選擇特定月份來計算資料
        const totalCounts = {};
        if (selectedMonth && trendCountsPerMonth[selectedMonth]) {
            // 顯示特定月份
            trendTypes.forEach(trend => {
                totalCounts[trend] = trendCountsPerMonth[selectedMonth][trend];
            });
        } else {
            // 合併所有月份的資料
            trendTypes.forEach(trend => {
                totalCounts[trend] = months.reduce((sum, month) => sum + trendCountsPerMonth[month][trend], 0);
            });
        }

        const data = trendTypes.map(trend => totalCounts[trend]);
        const backgroundColors = trendTypes.map(trend => trendColors[trend].backgroundColor);
        const borderColors = trendTypes.map(trend => trendColors[trend].borderColor);

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: trendTypes,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                onClick: (_event, elements) => {
                    if (!elements || elements.length === 0) return;
                    const trend = trendTypes[elements[0].index];
                    this.applyTrendFilter(selectedMonth, trend);
                },
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: chartAnimationDuration,
                    easing: 'easeOutQuart'
                },
                cutout: '55%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            padding: 15,
                            generateLabels: chart => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor[i],
                                        lineWidth: 2,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        ...this.getTooltipConfig(),
                        callbacks: {
                            label: context => {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} 篇 (${percentage}%)`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: chart => {
                    const { ctx, width, height } = chart;
                    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    ctx.save();
                    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1e293b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(total, width / 2, height / 2 - 10);
                    ctx.font = '14px "Noto Sans TC", sans-serif';
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748b';
                    ctx.fillText('篇新聞', width / 2, height / 2 + 15);
                    ctx.restore();
                }
            }]
        });
    }

    // 取得通用 tooltip 設定
    getTooltipConfig() {
        return {
            enabled: true,
            backgroundColor: window.DesignTokens.withAlpha('bg-primary', 0.95),
            titleFont: { size: 15, weight: '600', family: "'Noto Sans TC', sans-serif" },
            bodyFont: { size: 14, family: "'Noto Sans TC', sans-serif" },
            padding: 14,
            cornerRadius: 8,
            borderColor: window.DesignTokens.withAlpha('primary', 0.5),
            borderWidth: 1,
            displayColors: true,
            boxPadding: 6
        };
    }

    // 更新圖表說明文字
    updateChartDescription(chartType, monthLabel = null) {
        const descEl = document.getElementById('expected-trend-description');
        if (!descEl) return;

        let description;
        if (chartType === 'doughnut') {
            if (monthLabel) {
                description = `甜甜圈圖顯示 ${monthLabel} 各趨勢類型的分佈；點區塊可篩選該月該走向的新聞`;
            } else {
                description = '甜甜圈圖顯示所選期間內各趨勢類型的整體分佈，拖動滑桿可查看各月份變化；點區塊可篩選該走向的新聞';
            }
        } else {
            const descriptions = {
                'bar': '堆疊長條圖顯示每月各趨勢類型的新聞數量',
                'line': '折線圖顯示各趨勢類型隨時間的變化趨勢',
                'area': '堆疊面積圖呈現各趨勢類型的累積變化',
                'percentage': '百分比圖顯示每月各趨勢類型的佔比分佈'
            };
            description = (descriptions[chartType] || descriptions['bar']) + '；點圖中區塊可篩選該月該走向的新聞';
        }

        descEl.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#icon-info"></use></svg> ${description}`;
    }

    // 處理趨勢圖表點擊事件：點某月某走向的區塊 → 全頁篩選該月份＋該走向
    handleTrendChartClick(_event, elements, months) {
        if (!elements || elements.length === 0) return;

        const chart = this.stateManager.getState('expectedTrendChart');
        if (!chart) return;

        const { datasetIndex, index } = elements[0];
        const trend = chart.data.datasets[datasetIndex] && chart.data.datasets[datasetIndex].label;
        this.applyTrendFilter(months[index], trend);
    }

    // 套用「月份＋走向」條件：月份寫進日期範圍，走向加成可移除的標籤，都是全頁條件
    applyTrendFilter(month, trend) {
        const eventHandlers = window.App && window.App.eventHandlers;
        if (!eventHandlers || !trend) return;

        if (month) {
            const [year, monthNum] = month.split('-').map(Number);
            const pad = (n) => String(n).padStart(2, '0');
            const lastDay = new Date(year, monthNum, 0).getDate();
            // 不用 toISOString：它會轉成 UTC，台灣時間月初會變成前一天
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            if (startDateInput) startDateInput.value = `${year}-${pad(monthNum)}-01`;
            if (endDateInput) endDateInput.value = `${year}-${pad(monthNum)}-${pad(lastDay)}`;
            eventHandlers.clearQuickDateSelection();
        }

        this.stateManager.updateState('selectedTrend', trend);
        eventHandlers.filterArticles();

        const count = (this.stateManager.getState('filteredArticlesData') || []).length;
        const monthText = month ? `${this.utilities.formatMonthDisplay(month)}・` : '';
        this.showChartClickToast(`已篩選「${monthText}${trend}」，共 ${count.toLocaleString()} 篇`);
    }

    // 渲染關鍵詞趨勢圖表（單月模式）
    // 期間關鍵詞排行：startMonth..endMonth（YYYY-MM，含頭尾）；只給一個月份即單月
    renderTrendChart(selectedMonth, endMonth = null) {
        if (!selectedMonth) {
            console.warn('未提供月份參數，無法渲染趨勢圖表');
            return;
        }

        this.uiComponents.showLoading('正在生成關鍵詞趨勢圖表...');

        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');

        // 如果過濾資料為空，嘗試使用原始資料
        if (!filteredArticlesData || filteredArticlesData.length === 0) {
            const articlesData = this.stateManager.getState('articlesData');
            if (articlesData && articlesData.length > 0) {
                filteredArticlesData = articlesData;
            }
        }

        const keywordCounts = {};

        const rangeEnd = endMonth || selectedMonth;
        const filteredArticles = filteredArticlesData.filter(article => {
            const articleDate = new Date(article.date);
            const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;
            return articleYearMonth >= selectedMonth && articleYearMonth <= rangeEnd;
        });
        const periodLabel = rangeEnd === selectedMonth
            ? this.utilities.formatMonthDisplay(selectedMonth)
            : `${this.utilities.formatMonthDisplay(selectedMonth)} – ${this.utilities.formatMonthDisplay(rangeEnd)}`;
        this.updateKeywordPeriod(`${periodLabel}・${filteredArticles.length.toLocaleString()} 篇新聞・提及篇數前 10 名`);

        filteredArticles.forEach(article => {
            // 同一篇重複的關鍵詞只算一次（單位是「提及篇數」）
            new Set(article.keywords).forEach(keyword => {
                if (keywordCounts[keyword]) {
                    keywordCounts[keyword]++;
                } else {
                    keywordCounts[keyword] = 1;
                }
            });
        });

        if (Object.keys(keywordCounts).length === 0) {
            const existingChart = this.stateManager.getState('trendChart');
            if (existingChart) {
                existingChart.destroy();
            }

            this.showEmptyChart('trend', '此月份無關鍵詞資料');
            this.uiComponents.hideLoading();
            return;
        }

        const sortedKeywordCounts = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = sortedKeywordCounts.map(entry => entry[0]);
        const data = sortedKeywordCounts.map(entry => entry[1]);

        const existingChart = this.stateManager.getState('trendChart');
        if (existingChart) {
            existingChart.destroy();
        }

        // 同類資料使用單一主色，靠長度與排序傳達資訊（金融分析慣例）
        const ctx = document.getElementById('trend').getContext('2d');
        const primaryColor = window.DesignTokens.color('primary');
        const backgroundColors = data.map(() => primaryColor);
        const borderColors = backgroundColors;
        const hoverBackgroundColors = data.map(() => window.DesignTokens.color('primary-hover'));

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `提及篇數（${periodLabel}）`,
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 0,
                    borderRadius: 2,
                    hoverBackgroundColor: hoverBackgroundColors,
                    hoverBorderColor: borderColors,
                    hoverBorderWidth: 0,
                    barPercentage: 0.7,
                    categoryPercentage: 0.85
                }]
            },
            plugins: [ChartManager.barValueLabelPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: chartAnimationDuration,
                    easing: 'easeOutQuart'
                },
                // 水平長條：長詞不必斜排，數值標在條末
                indexAxis: 'y',
                layout: { padding: { right: 36 } },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '提及新聞數（篇；一篇可含多個關鍵詞）',
                            color: window.DesignTokens.color('text-muted'),
                            font: { size: 13 }
                        },
                        grid: {
                            color: window.DesignTokens.withAlpha('shadow', 0.06),
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 12 },
                            color: window.DesignTokens.color('text-muted'),
                            precision: 0
                        }
                    },
                    y: {
                        grid: { display: false, drawBorder: false },
                        ticks: {
                            font: { size: 14 },
                            color: window.DesignTokens.color('text-primary'),
                            autoSkip: false
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: window.DesignTokens.withAlpha('bg-primary', 0.95),
                        titleFont: {
                            size: 15,
                            weight: '600',
                            family: "'Noto Sans TC', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            family: "'Noto Sans TC', sans-serif"
                        },
                        footerFont: {
                            size: 13,
                            weight: '500'
                        },
                        padding: 14,
                        cornerRadius: 8,
                        borderColor: window.DesignTokens.withAlpha('primary', 0.5),
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `提及篇數：${context.raw} 篇`;
                            },
                            footer: function(context) {
                                const totalCounts = context[0].chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = ((context[0].raw / totalCounts) * 100).toFixed(1);
                                return `\n佔比: ${percentage}%\n\n點擊以篩選此關鍵詞`;
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        limits: {
                            x: {min: 0, max: 'original'}
                        }
                    }
                },
                onClick: (event, elements) => {
                    this.handleKeywordChartClick(event, elements, labels);
                }
            }
        });

        this.stateManager.setTrendChart(chart);
        this.uiComponents.hideLoading();
    }

    // 關鍵詞排行標題下的期間說明
    updateKeywordPeriod(text) {
        const el = document.getElementById('keyword-trend-period');
        if (el) el.textContent = text;
    }

    // 處理關鍵詞圖表點擊事件
    handleKeywordChartClick(_event, elements, labels) {
        if (!elements || elements.length === 0) return;

        const clickedElement = elements[0];
        const keyword = labels[clickedElement.index];

        if (!keyword) return;

        this.applyKeywordFilter(keyword);
    }

    // 關鍵詞條件：作用於整頁，與其他篩選條件同時生效；再點同一個詞即取消
    applyKeywordFilter(keyword, { toggle = false } = {}) {
        const current = this.stateManager.getState('selectedCloudKeyword');
        const next = toggle && current === keyword ? null : keyword;
        this.stateManager.updateState('selectedCloudKeyword', next);

        const eventHandlers = window.App && window.App.eventHandlers;
        if (eventHandlers) eventHandlers.filterArticles();

        if (next) {
            const count = (this.stateManager.getState('filteredArticlesData') || []).length;
            this.showChartClickToast(`已加入篩選「關鍵詞：${next}」，共 ${count.toLocaleString()} 篇`);
        } else {
            this.showChartClickToast('已移除關鍵詞篩選');
        }
    }

    // 顯示圖表點擊提示 Toast
    showChartClickToast(message) {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                bottom: auto !important;
                left: auto !important;
                z-index: 10000 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-end !important;
                gap: 8px !important;
                pointer-events: none !important;
                width: auto !important;
                height: auto !important;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'animate__animated animate__fadeInRight';
        toast.style.cssText = `
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 10px 14px !important;
            min-width: 160px !important;
            max-width: 320px !important;
            height: auto !important;
            background: ${window.DesignTokens.withAlpha('primary', 0.10)} !important;
            border-left: 4px solid ${window.DesignTokens.color('primary')} !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            pointer-events: all !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            color: #1e293b !important;
        `;

        toast.innerHTML = `
            <svg class="icon" aria-hidden="true"><use href="#icon-filter"></use></svg>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // 2.5 秒後自動移除
        setTimeout(() => {
            toast.classList.remove('animate__fadeInRight');
            toast.classList.add('animate__fadeOutRight');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
                if (toastContainer.children.length === 0 && document.body.contains(toastContainer)) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, 2500);
    }

    // 渲染多月份比較圖表
    renderMultiMonthComparisonChart(selectedMonths) {
        this.updateKeywordPeriod(`${selectedMonths.map(m => this.utilities.formatMonthDisplay(m)).join('、')}・各月提及篇數比較`);
        if (!selectedMonths || selectedMonths.length === 0) {
            console.warn('未提供月份列表，無法渲染多月比較圖表');
            return;
        }

        this.uiComponents.showLoading('正在生成多月比較圖表...');

        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');

        if (!filteredArticlesData || filteredArticlesData.length === 0) {
            const articlesData = this.stateManager.getState('articlesData');
            if (articlesData && articlesData.length > 0) {
                filteredArticlesData = articlesData;
            }
        }

        // 收集所有選定月份的關鍵詞
        const allKeywords = new Set();
        const monthKeywordCounts = {};

        selectedMonths.forEach(month => {
            monthKeywordCounts[month] = {};

            const monthArticles = filteredArticlesData.filter(article => {
                const articleDate = new Date(article.date);
                const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;
                return articleYearMonth === month;
            });

            monthArticles.forEach(article => {
                // 同一篇只算一次，單位與期間排行一致（提及篇數）
                new Set(article.keywords).forEach(keyword => {
                    allKeywords.add(keyword);
                    monthKeywordCounts[month][keyword] = (monthKeywordCounts[month][keyword] || 0) + 1;
                });
            });
        });

        // 找出前 10 個最熱門的關鍵詞（跨所有月份）
        const keywordTotalCounts = {};
        Array.from(allKeywords).forEach(keyword => {
            keywordTotalCounts[keyword] = selectedMonths.reduce((sum, month) => {
                return sum + (monthKeywordCounts[month][keyword] || 0);
            }, 0);
        });

        const topKeywords = Object.entries(keywordTotalCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(entry => entry[0]);

        if (topKeywords.length === 0) {
            const existingChart = this.stateManager.getState('trendChart');
            if (existingChart) {
                existingChart.destroy();
            }
            this.showEmptyChart('trend', '選定月份無關鍵詞資料');
            this.uiComponents.hideLoading();
            return;
        }

        // 月份有先後順序：用主色由淺到深，越新的月份越深
        const sortedMonths = [...selectedMonths].sort();
        const datasets = sortedMonths.map((month, index) => {
            const alpha = sortedMonths.length === 1 ? 1 : 0.3 + 0.7 * index / (sortedMonths.length - 1);

            return {
                label: this.utilities.formatMonthDisplay(month),
                data: topKeywords.map(keyword => monthKeywordCounts[month][keyword] || 0),
                backgroundColor: window.DesignTokens.withAlpha('primary', alpha),
                borderWidth: 0,
                borderRadius: 2
            };
        });

        const existingChart = this.stateManager.getState('trendChart');
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = document.getElementById('trend').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topKeywords,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: chartAnimationDuration,
                    easing: 'easeOutQuart'
                },
                // 水平長條，與期間排行一致；長詞不必斜排
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '提及新聞數（篇）',
                            color: window.DesignTokens.color('text-muted'),
                            font: { size: 13 }
                        },
                        grid: {
                            color: window.DesignTokens.withAlpha('shadow', 0.06),
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 12 },
                            color: window.DesignTokens.color('text-muted'),
                            precision: 0
                        }
                    },
                    y: {
                        grid: { display: false, drawBorder: false },
                        ticks: {
                            font: { size: 14 },
                            color: window.DesignTokens.color('text-primary'),
                            autoSkip: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: window.DesignTokens.withAlpha('bg-primary', 0.95),
                        titleFont: {
                            size: 15,
                            weight: '600',
                            family: "'Noto Sans TC', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            family: "'Noto Sans TC', sans-serif"
                        },
                        padding: 14,
                        cornerRadius: 8,
                        borderColor: window.DesignTokens.withAlpha('primary', 0.5),
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw} 篇`;
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        limits: {
                            x: {min: 0, max: 'original'}
                        }
                    }
                }
            }
        });

        this.stateManager.setTrendChart(chart);
        this.uiComponents.hideLoading();

        // 更新說明文字
        const descriptionText = document.getElementById('trend-description-text');
        if (descriptionText) {
            descriptionText.textContent = `此圖表比較選定 ${selectedMonths.length} 個月份的關鍵詞趨勢`;
        }
    }

    // 渲染時間範圍趨勢圖表
    renderTimeRangeTrendChart(startMonth, endMonth) {
        this.updateKeywordPeriod(`${this.utilities.formatMonthDisplay(startMonth)} – ${this.utilities.formatMonthDisplay(endMonth)}・熱門關鍵詞逐月變化`);
        if (!startMonth || !endMonth) {
            console.warn('未提供起始或結束月份，無法渲染時間範圍圖表');
            return;
        }

        this.uiComponents.showLoading('正在生成時間範圍趨勢圖表...');

        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');

        if (!filteredArticlesData || filteredArticlesData.length === 0) {
            const articlesData = this.stateManager.getState('articlesData');
            if (articlesData && articlesData.length > 0) {
                filteredArticlesData = articlesData;
            }
        }

        // 生成月份範圍
        const allMonths = this.utilities.getMonthRange(filteredArticlesData);
        const startIdx = allMonths.indexOf(startMonth);
        const endIdx = allMonths.indexOf(endMonth);

        if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
            console.error('無效的月份範圍');
            this.uiComponents.hideLoading();
            return;
        }

        const selectedMonths = allMonths.slice(startIdx, endIdx + 1);

        // 收集每個月的前 5 個關鍵詞，並追蹤跨月份
        const keywordsByMonth = {};
        const allKeywords = new Set();

        selectedMonths.forEach(month => {
            keywordsByMonth[month] = {};

            const monthArticles = filteredArticlesData.filter(article => {
                const articleDate = new Date(article.date);
                const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;
                return articleYearMonth === month;
            });

            monthArticles.forEach(article => {
                article.keywords.forEach(keyword => {
                    allKeywords.add(keyword);
                    keywordsByMonth[month][keyword] = (keywordsByMonth[month][keyword] || 0) + 1;
                });
            });
        });

        // 找出整個時間範圍內前 8 個最熱門的關鍵詞
        const keywordTotalCounts = {};
        Array.from(allKeywords).forEach(keyword => {
            keywordTotalCounts[keyword] = selectedMonths.reduce((sum, month) => {
                return sum + (keywordsByMonth[month][keyword] || 0);
            }, 0);
        });

        const topKeywords = Object.entries(keywordTotalCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(entry => entry[0]);

        if (topKeywords.length === 0) {
            const existingChart = this.stateManager.getState('trendChart');
            if (existingChart) {
                existingChart.destroy();
            }
            this.showEmptyChart('trend', '選定時間範圍無關鍵詞資料');
            this.uiComponents.hideLoading();
            return;
        }

        // 使用 Constants 定義的專業配色方案（折線圖）
        const colors = Constants.COLORS.CHART_GRADIENT.slice(0, 8);

        const datasets = topKeywords.map((keyword, index) => {
            return {
                label: keyword,
                data: selectedMonths.map(month => keywordsByMonth[month][keyword] || 0),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '30',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: colors[index % colors.length],
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            };
        });

        const existingChart = this.stateManager.getState('trendChart');
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = document.getElementById('trend').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: selectedMonths.map(m => this.utilities.formatMonthDisplay(m)),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: chartAnimationDuration,
                    easing: 'easeOutQuart'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.03)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: window.DesignTokens.withAlpha('bg-primary', 0.95),
                        titleFont: {
                            size: 15,
                            weight: '600',
                            family: "'Noto Sans TC', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            family: "'Noto Sans TC', sans-serif"
                        },
                        padding: 14,
                        cornerRadius: 8,
                        borderColor: window.DesignTokens.withAlpha('primary', 0.5),
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw} 次`;
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy',
                        },
                        limits: {
                            y: {min: 0, max: 'original'}
                        }
                    }
                }
            }
        });

        this.stateManager.setTrendChart(chart);
        this.uiComponents.hideLoading();

        // 更新說明文字
        const descriptionText = document.getElementById('trend-description-text');
        if (descriptionText) {
            descriptionText.textContent = `此圖表顯示 ${this.utilities.formatMonthDisplay(startMonth)} 至 ${this.utilities.formatMonthDisplay(endMonth)} 期間的關鍵詞趨勢變化`;
        }
    }

    // 重置圖表縮放（增強視覺反饋）
    resetChartZoom() {
        const chart = this.stateManager.getState('trendChart');
        if (chart && chart.resetZoom) {
            // 添加過渡動畫
            chart.resetZoom('default');

            // 視覺反饋：顯示重置成功訊息
            const resetButton = document.getElementById('resetZoom');
            if (resetButton) {
                const originalText = resetButton.innerHTML;
                resetButton.innerHTML = '<svg class="icon me-1" aria-hidden="true"><use href="#icon-check"></use></svg> 已重置';
                resetButton.classList.add('btn-success');
                resetButton.classList.remove('btn-outline-secondary');

                // 1秒後恢復原狀
                setTimeout(() => {
                    resetButton.innerHTML = originalText;
                    resetButton.classList.remove('btn-success');
                    resetButton.classList.add('btn-outline-secondary');
                }, 1000);
            }

            console.log('圖表縮放已重置');
        } else {
            console.warn('圖表不存在或不支援縮放重置功能');
        }
    }

    // 顯示空圖表提示
    showEmptyChart(canvasId, message) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
    }

    // 切換圖表類型
    toggleChartType() {
        this.uiComponents.showLoading('正在切換圖表類型...');

        const newType = this.stateManager.toggleChartType();

        const toggleButton = document.getElementById('toggleChartType');
        if (toggleButton) {
            toggleButton.innerHTML = newType === 'bar' ?
                '<svg class="icon me-1" aria-hidden="true"><use href="#icon-arrow-right-left"></use></svg> 切換到折線圖' :
                '<svg class="icon me-1" aria-hidden="true"><use href="#icon-arrow-right-left"></use></svg> 切換到柱狀圖';

            toggleButton.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                toggleButton.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        }

        setTimeout(() => {
            this.renderExpectedTrendChart();
            this.uiComponents.hideLoading();
        }, 300);
    }

    // 渲染關鍵詞文字雲
    renderKeywordCloud(topN = 50) {
        this.uiComponents.showLoading('正在生成關鍵詞文字雲...');

        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');

        // 如果過濾資料為空，嘗試使用原始資料
        if (!filteredArticlesData || filteredArticlesData.length === 0) {
            const articlesData = this.stateManager.getState('articlesData');
            if (articlesData && articlesData.length > 0) {
                console.log('使用原始文章資料渲染文字雲');
                filteredArticlesData = articlesData;
            } else {
                console.warn('沒有可用的文章資料，無法渲染文字雲');
                this.showEmptyWordCloud('無可用的關鍵詞資料');
                this.uiComponents.hideLoading();
                return;
            }
        }

        // 統計各關鍵詞的提及篇數（同一篇只算一次）
        const keywordCounts = {};

        filteredArticlesData.forEach(article => {
            if (article.keywords && Array.isArray(article.keywords)) {
                new Set(article.keywords).forEach(keyword => {
                    if (keyword && keyword.trim()) {
                        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
                    }
                });
            }
        });

        if (Object.keys(keywordCounts).length === 0) {
            this.showEmptyWordCloud('此篩選條件無關鍵詞資料');
            this.uiComponents.hideLoading();
            return;
        }

        // 排序並取前 N 個關鍵詞
        const sortedKeywords = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN);

        // 準備文字雲資料格式：[['關鍵詞', 權重], ...]
        const wordCloudData = sortedKeywords.map(([keyword, count]) => [keyword, count]);

        // 同步渲染下方 Top 15 排行表格
        this.renderKeywordRankTable(sortedKeywords, filteredArticlesData.length);

        // 檢查是否載入了 WordCloud
        if (typeof WordCloud === 'undefined') {
            console.error('WordCloud 庫未載入');
            this.showEmptyWordCloud('文字雲庫載入失敗');
            this.uiComponents.hideLoading();
            return;
        }

        // 取得 canvas 元素
        const canvas = document.getElementById('keywordCloudCanvas');
        if (!canvas) {
            console.error('找不到文字雲 canvas 元素');
            this.uiComponents.hideLoading();
            return;
        }

        // canvas 尺寸跟著容器（與 Top 15 並排時欄寬變窄，固定 800×500 會被裁切）
        const box = canvas.parentElement;
        if (box && box.clientWidth > 0) {
            const cs = getComputedStyle(box);
            const w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            const h = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
            if (w > 0 && h > 0) {
                canvas.width = Math.round(w);
                canvas.height = Math.round(h);
            }
        }

        // 清空 canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 文字雲色票：依主題自動切換，必須與容器底色保持可讀對比
        const colors = window.DesignTokens.wordcloudPalette();
        const highlightColor = window.DesignTokens.color('warning');

        const selectedKeyword = this.stateManager.getState('selectedCloudKeyword') || null;

        // 渲染文字雲
        WordCloud(canvas, {
            list: wordCloudData,
            gridSize: Math.round(16 * canvas.width / 1024),
            weightFactor: function(size) {
                // 根據 canvas 大小動態調整權重
                return Math.pow(size, 0.5) * canvas.width / 40;
            },
            fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
            color: function(word) {
                if (selectedKeyword && word === selectedKeyword) return highlightColor;
                return colors[Math.floor(Math.random() * colors.length)];
            },
            rotateRatio: 0.3,
            rotationSteps: 2,
            backgroundColor: 'transparent',
            minSize: 12,
            drawOutOfBound: false,
            shrinkToFit: true,
            // 點詞：加入全頁關鍵詞篩選（wordcloud2 只提供 click 回呼，不會發 DOM 事件）
            click: (item) => {
                if (item && item[0]) this.applyKeywordFilter(item[0], { toggle: true });
            },
            hover: (item) => {
                canvas.style.cursor = item ? 'pointer' : '';
            }
        });

        console.log(`文字雲渲染完成，包含 ${wordCloudData.length} 個關鍵詞`);
        this.uiComponents.hideLoading();
    }

    // 顯示空文字雲提示
    showEmptyWordCloud(message) {
        const canvas = document.getElementById('keywordCloudCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '18px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    /**
     * 將 Hex 顏色轉換為 RGBA 格式
     * @param {string} hex - Hex 顏色碼 (例如: '#6366F1')
     * @param {number} alpha - 透明度 (0-1)
     * @returns {string} RGBA 顏色字串
     */
    hexToRgba(hex, alpha) {
        // 移除 # 符號
        hex = hex.replace('#', '');

        // 轉換為 RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 在文字雲下方渲染 Top 15 關鍵詞排行表格（雙呈現提升資訊密度）
     */
    renderKeywordRankTable(sortedKeywords, articleCount) {
        const tbody = document.getElementById('keyword-rank-tbody');
        if (!tbody) return;

        const top = sortedKeywords.slice(0, 15);
        if (top.length === 0) { tbody.innerHTML = ''; return; }

        // 占比的分母是目前篩選後的新聞篇數（不隨文字雲顯示數量改變）
        const total = articleCount || 0;
        const max = top[0][1];
        const sanitize = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

        tbody.innerHTML = top.map(([word, count], i) => {
            const pct = total > 0 ? (count / total * 100).toFixed(1) : '0.0';
            const barW = max > 0 ? (count / max * 100) : 0;
            return `
                <tr data-keyword="${sanitize(word)}" tabindex="0" role="button" aria-label="篩選關鍵詞 ${sanitize(word)}">
                    <td class="rank-col">${i + 1}</td>
                    <td class="word-col">${sanitize(word)}</td>
                    <td class="num-col">${count}</td>
                    <td class="num-col">${pct}%</td>
                    <td class="bar-col"><span class="rank-bar" style="width:${barW}%"></span></td>
                </tr>
            `;
        }).join('');

        // 點擊一列即等同點文字雲：加入全頁關鍵詞篩選，再點一次取消
        if (!tbody._wired) {
            tbody.addEventListener('click', (e) => {
                const tr = e.target.closest('tr[data-keyword]');
                if (!tr) return;
                this._applyKeywordFilterFromTable(tr.dataset.keyword);
            });
            tbody.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const tr = e.target.closest('tr[data-keyword]');
                if (!tr) return;
                e.preventDefault();
                this._applyKeywordFilterFromTable(tr.dataset.keyword);
            });
            tbody._wired = true;
        }
    }

    _applyKeywordFilterFromTable(keyword) {
        if (!keyword) return;
        this.applyKeywordFilter(keyword, { toggle: true });
    }
}

// Bar chart 數值標籤 plugin（直接寫在柱頂，金融分析慣例）
ChartManager.barValueLabelPlugin = {
    id: 'barValueLabel',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        if (!data.datasets || !data.datasets[0]) return;
        const meta = chart.getDatasetMeta(0);
        if (!meta || meta.hidden) return;
        const values = data.datasets[0].data;
        const color = (window.DesignTokens && window.DesignTokens.color('text-primary')) || '#0F172A';
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = '500 13px "DM Mono", "Noto Sans TC", monospace';
        const horizontal = chart.options.indexAxis === 'y';
        ctx.textAlign = horizontal ? 'left' : 'center';
        ctx.textBaseline = horizontal ? 'middle' : 'bottom';
        meta.data.forEach((bar, i) => {
            const v = values[i];
            if (v == null) return;
            if (horizontal) ctx.fillText(String(v), bar.x + 6, bar.y);
            else ctx.fillText(String(v), bar.x, bar.y - 6);
        });
        ctx.restore();
    }
};

// 導出供其他模組使用
window.ChartManager = ChartManager;