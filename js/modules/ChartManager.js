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

        const trendColors = {
            "上漲": {
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)'
            },
            "下跌": {
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)'
            },
            "平穩": {
                backgroundColor: 'rgba(255, 205, 86, 0.7)',
                borderColor: 'rgba(255, 205, 86, 1)'
            },
            "無相關": {
                backgroundColor: 'rgba(201, 203, 207, 0.7)',
                borderColor: 'rgba(201, 203, 207, 1)'
            },
            "無法判斷": {
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)'
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
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw} 篇`;
                            }
                        }
                    }
                }
            }
        });
        
        this.stateManager.setExpectedTrendChart(chart);
        this.uiComponents.hideLoading();
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

        const gradientColors = [
            'rgba(52, 152, 219, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(52, 73, 94, 0.8)',
            'rgba(22, 160, 133, 0.8)',
            'rgba(39, 174, 96, 0.8)',
            'rgba(41, 128, 185, 0.8)',
            'rgba(142, 68, 173, 0.8)',
            'rgba(44, 62, 80, 0.8)',
            'rgba(26, 188, 156, 0.8)'
        ];

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
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `出現次數: ${context.raw}`;
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

        // 準備資料集
        const datasets = selectedMonths.map((month, index) => {
            const colors = [
                'rgba(52, 152, 219, 0.7)',
                'rgba(46, 204, 113, 0.7)',
                'rgba(155, 89, 182, 0.7)',
                'rgba(231, 76, 60, 0.7)',
                'rgba(243, 156, 18, 0.7)'
            ];
            const borderColors = colors.map(c => c.replace('0.7', '1'));

            return {
                label: this.utilities.formatMonthDisplay(month),
                data: topKeywords.map(keyword => monthKeywordCounts[month][keyword] || 0),
                backgroundColor: colors[index % colors.length],
                borderColor: borderColors[index % borderColors.length],
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
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
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

        // 為每個關鍵詞準備資料集（折線圖）
        const colors = [
            '#3498db', '#2ecc71', '#9b59b6', '#e74c3c',
            '#f39c12', '#1abc9c', '#34495e', '#e67e22'
        ];

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
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
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

    // 重置圖表縮放
    resetChartZoom() {
        const chart = this.stateManager.getState('trendChart');
        if (chart && chart.resetZoom) {
            chart.resetZoom();
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

        // 生成顏色函數（使用漸層色）
        const colors = [
            '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'
        ];

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
}

// 導出供其他模組使用
window.ChartManager = ChartManager;