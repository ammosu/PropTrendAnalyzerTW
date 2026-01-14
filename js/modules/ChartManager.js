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
    }

    // 渲染預期趨勢圖表
    renderExpectedTrendChart() {
        this.uiComponents.showLoading('正在生成市場趨勢分佈圖表...');
        
        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const currentChartType = this.stateManager.getState('currentChartType');
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
                backgroundColor: Constants.COLORS.TREND.UP + 'B3', // 70% 不透明度
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

        const trendDatasets = ["上漲", "下跌", "平穩", "無相關", "無法判斷"].map(trend => {
            return {
                label: trend,
                data: months.map(month => trendCountsPerMonth[month][trend]),
                backgroundColor: trendColors[trend].backgroundColor,
                borderColor: trendColors[trend].borderColor,
                borderWidth: 1,
                fill: currentChartType === 'bar',
                tension: 0.2,
                pointRadius: currentChartType === 'line' ? 4 : 0,
                pointHoverRadius: currentChartType === 'line' ? 6 : 0,
                pointBackgroundColor: trendColors[trend].borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            };
        });

        const existingChart = this.stateManager.getState('expectedTrendChart');
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = document.getElementById('expectedTrendChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: currentChartType,
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
                        stacked: currentChartType === 'bar',
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: { 
                        stacked: currentChartType === 'bar', 
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
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
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',  /* 使用主題深色 */
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
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(tooltipItems) {
                                return `📅 ${tooltipItems[0].label}`;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                const emoji = label === '上漲' ? '📈' :
                                             label === '下跌' ? '📉' :
                                             label === '平穩' ? '➡️' :
                                             label === '無相關' ? '❓' : '🔍';
                                return `${emoji} ${label}: ${value} 篇`;
                            },
                            footer: function(tooltipItems) {
                                const total = tooltipItems.reduce((sum, item) => sum + item.raw, 0);
                                return `\n總計: ${total} 篇新聞\n\n💡 點擊以篩選此趨勢類型`;
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    this.handleTrendChartClick(event, elements, months, formattedLabels);
                }
            }
        });

        this.stateManager.setExpectedTrendChart(chart);
        this.uiComponents.hideLoading();
    }

    // 處理趨勢圖表點擊事件
    handleTrendChartClick(event, elements, months, formattedLabels) {
        if (!elements || elements.length === 0) return;

        const clickedElement = elements[0];
        const chart = this.stateManager.getState('expectedTrendChart');

        if (!chart) return;

        const datasetIndex = clickedElement.datasetIndex;
        const dataIndex = clickedElement.index;

        const trendType = chart.data.datasets[datasetIndex].label;
        const month = months[dataIndex];
        const formattedMonth = formattedLabels[dataIndex];

        // 創建並顯示趨勢篩選提示
        this.showChartClickToast(`已篩選：${formattedMonth} 的「${trendType}」趨勢`);

        // 設定日期範圍篩選（選定月份）
        this.applyMonthFilter(month);

        // 滾動到新聞列表
        this.scrollToNewsSection();
    }

    // 套用月份篩選
    applyMonthFilter(month) {
        if (!month) return;

        // 計算月份的起始和結束日期
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0); // 該月最後一天

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // 更新日期篩選輸入框
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');

        if (startDateInput && endDateInput) {
            startDateInput.value = startDateStr;
            endDateInput.value = endDateStr;

            // 觸發篩選
            if (window.app && window.app.eventHandlers) {
                window.app.eventHandlers.filterArticles();
            }
        }
    }

    // 渲染關鍵詞趨勢圖表（單月模式）
    renderTrendChart(selectedMonth) {
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

        const filteredArticles = filteredArticlesData.filter(article => {
            const articleDate = new Date(article.date);
            const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;
            return articleYearMonth === selectedMonth;
        });

        filteredArticles.forEach(article => {
            article.keywords.forEach(keyword => {
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

        // 使用 Constants 定義的專業漸層配色方案
        const gradientColors = Constants.COLORS.CHART_GRADIENT.map(color =>
            this.hexToRgba(color, 0.8)
        );

        const ctx = document.getElementById('trend').getContext('2d');

        const backgroundColors = data.map((_, index) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, gradientColors[index % gradientColors.length]);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
            return gradient;
        });

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `關鍵詞出現次數 (${this.utilities.formatMonthDisplay(selectedMonth)})`,
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: gradientColors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: gradientColors.map(color => color.replace('0.8', '0.9')),
                    hoverBorderColor: gradientColors.map(color => color.replace('0.8', '1')),
                    hoverBorderWidth: 2
                }]
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
                            display: false
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
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return `🔑 ${context[0].label}`;
                            },
                            label: function(context) {
                                return `出現次數: ${context.raw} 次`;
                            },
                            footer: function(context) {
                                const totalCounts = context[0].chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = ((context[0].raw / totalCounts) * 100).toFixed(1);
                                return `\n佔比: ${percentage}%\n\n💡 點擊以篩選此關鍵詞`;
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
                },
                onClick: (event, elements) => {
                    this.handleKeywordChartClick(event, elements, labels);
                }
            }
        });

        this.stateManager.setTrendChart(chart);
        this.uiComponents.hideLoading();
    }

    // 處理關鍵詞圖表點擊事件
    handleKeywordChartClick(event, elements, labels) {
        if (!elements || elements.length === 0) return;

        const clickedElement = elements[0];
        const keyword = labels[clickedElement.index];

        if (!keyword) return;

        // 更新關鍵字篩選輸入框
        const keywordFilter = document.getElementById('keyword-filter');
        if (keywordFilter) {
            keywordFilter.value = keyword;
            keywordFilter.focus();

            // 觸發篩選
            if (window.app && window.app.eventHandlers) {
                window.app.eventHandlers.filterArticles();
            }

            // 顯示提示
            this.showChartClickToast(`已篩選關鍵詞：${keyword}`);

            // 滾動到新聞列表
            this.scrollToNewsSection();
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
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, #fff 100%) !important;
            border-left: 4px solid #3B82F6 !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            pointer-events: all !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            color: #1e293b !important;
        `;

        toast.innerHTML = `
            <i class="fas fa-filter" style="color: #3B82F6; font-size: 1rem; flex-shrink: 0;"></i>
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

    // 滾動到新聞列表區塊
    scrollToNewsSection() {
        const newsContent = document.getElementById('news-content');
        const toggleButton = document.getElementById('toggle-news-button');

        // 如果新聞內容是摺疊的，先展開
        if (newsContent && !newsContent.classList.contains('show')) {
            if (typeof $ !== 'undefined') {
                $(newsContent).collapse('show');
            }
        }

        // 滾動到新聞區塊
        setTimeout(() => {
            const filterOptions = document.getElementById('filter-options');
            if (filterOptions) {
                filterOptions.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    // 渲染多月份比較圖表
    renderMultiMonthComparisonChart(selectedMonths) {
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
                article.keywords.forEach(keyword => {
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

        // 使用 Constants 定義的專業配色方案（多月比較）
        const colorPalette = Constants.COLORS.CHART_GRADIENT.slice(0, 5);
        const datasets = selectedMonths.map((month, index) => {
            const backgroundColor = this.hexToRgba(colorPalette[index % colorPalette.length], 0.7);
            const borderColor = colorPalette[index % colorPalette.length];

            return {
                label: this.utilities.formatMonthDisplay(month),
                data: topKeywords.map(keyword => monthKeywordCounts[month][keyword] || 0),
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 2
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
                            display: false
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
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(context) {
                                return `🔑 ${context[0].label}`;
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
            descriptionText.textContent = `此圖表比較選定 ${selectedMonths.length} 個月份的關鍵詞趨勢`;
        }
    }

    // 渲染時間範圍趨勢圖表
    renderTimeRangeTrendChart(startMonth, endMonth) {
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
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(context) {
                                return `📅 ${context[0].label}`;
                            },
                            label: function(context) {
                                const emoji = '🔑';
                                return `${emoji} ${context.dataset.label}: ${context.raw} 次`;
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
                resetButton.innerHTML = '<i class="fas fa-check me-1"></i> 已重置';
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
                '<i class="fas fa-exchange-alt me-1"></i> 切換到折線圖' :
                '<i class="fas fa-exchange-alt me-1"></i> 切換到柱狀圖';

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

        // 統計所有關鍵詞出現次數
        const keywordCounts = {};

        filteredArticlesData.forEach(article => {
            if (article.keywords && Array.isArray(article.keywords)) {
                article.keywords.forEach(keyword => {
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

        // 清空 canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 使用 Constants 定義的專業配色方案（文字雲）
        const colors = Constants.COLORS.CHART_GRADIENT;

        // 渲染文字雲
        WordCloud(canvas, {
            list: wordCloudData,
            gridSize: Math.round(16 * canvas.width / 1024),
            weightFactor: function(size) {
                // 根據 canvas 大小動態調整權重
                return Math.pow(size, 0.5) * canvas.width / 40;
            },
            fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
            color: function() {
                return colors[Math.floor(Math.random() * colors.length)];
            },
            rotateRatio: 0.3,
            rotationSteps: 2,
            backgroundColor: 'transparent',
            minSize: 12,
            drawOutOfBound: false,
            shrinkToFit: true
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
}

// 導出供其他模組使用
window.ChartManager = ChartManager;