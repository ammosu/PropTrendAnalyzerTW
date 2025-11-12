// ChartManager.js - 圖表管理模組
class ChartManager {
    constructor(stateManager, uiComponents) {
        this.stateManager = stateManager;
        this.uiComponents = uiComponents;
    }

    // 渲染預期趨勢圖表
    renderExpectedTrendChart() {
        this.uiComponents.showLoading('正在生成市場趨勢分佈圖表...');
        
        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const currentChartType = this.stateManager.getState('currentChartType');
        const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');
        
        // 如果過濾數據為空，嘗試使用原始數據
        if (!filteredArticlesData || filteredArticlesData.length === 0) {
            const articlesData = this.stateManager.getState('articlesData');
            if (articlesData && articlesData.length > 0) {
                console.log('使用原始文章數據渲染圖表');
                filteredArticlesData = articlesData;
            } else {
                console.warn('沒有可用的文章數據，無法渲染預期趨勢圖表');
                this.showEmptyChart('expectedTrendChart', '無可用的趨勢數據');
                this.uiComponents.hideLoading();
                return;
            }
        }
        
        const months = this.getMonthRange(filteredArticlesData);
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

        const formattedLabels = months.map(month => this.formatMonthDisplay(month));

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

    // 渲染關鍵詞趨勢圖表
    renderTrendChart(selectedMonth) {
        if (!selectedMonth) {
            console.warn('未提供月份參數，無法渲染趨勢圖表');
            return;
        }
        
        this.uiComponents.showLoading('正在生成關鍵詞趨勢圖表...');
        
        let filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const chartAnimationDuration = this.stateManager.getState('chartAnimationDuration');
        
        // 如果過濾數據為空，嘗試使用原始數據
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
            
            this.showEmptyChart('trend', '此月份無關鍵詞數據');
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
                    label: `關鍵詞出現次數 (${this.formatMonthDisplay(selectedMonth)})`,
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
                    }
                }
            }
        });
        
        this.stateManager.setTrendChart(chart);
        this.uiComponents.hideLoading();
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

    // 工具函數：獲取月份範圍
    getMonthRange(articles) {
        if (!articles || articles.length === 0) {
            return [];
        }
        
        const validArticles = articles.filter(article => article.date && !isNaN(new Date(article.date).getTime()));
        
        if (validArticles.length === 0) {
            return [];
        }
        
        const dates = validArticles.map(article => new Date(article.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        const months = [];
        let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

        while (currentDate <= maxDate) {
            const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            months.push(yearMonth);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return months;
    }

    // 工具函數：格式化月份顯示
    formatMonthDisplay(yearMonth) {
        if (!yearMonth) return '';
        
        const [year, month] = yearMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long'
        });
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
}

// 導出供其他模組使用
window.ChartManager = ChartManager;