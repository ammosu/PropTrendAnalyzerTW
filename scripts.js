// scripts.js - 增強版

// 全局變數
const articlesPerPage = 6;
let currentPage = 1;
let filteredArticlesData = [];
let trendChart = null;
let chartAnimationDuration = 800; // 圖表動畫持續時間

// 頁面初始化函數，在數據載入完成後調用
function initializePage() {
    // 顯示載入動畫
    showLoading('正在初始化頁面...');
    
    // 初始化過濾後的文章數據
    filteredArticlesData = [...articlesData];
    
    // 渲染頁面元素
    setTimeout(() => {
        renderArticles(currentPage);
        renderPagination();
        
        // 初始化月份滑桿
        initializeMonthSlider();
        
        // 初始化預期趨勢圖表
        renderExpectedTrendChart();
        
        // 應用初始篩選
        filterArticles();
        
        // 隱藏載入動畫
        hideLoading();
        
        console.log('頁面初始化完成');
    }, 500); // 短暫延遲以顯示載入動畫
}

// 顯示載入動畫
function showLoading(message = '載入中...') {
    // 檢查是否已存在載入動畫元素
    if (document.getElementById('loading-overlay')) {
        document.getElementById('loading-message').textContent = message;
        document.getElementById('loading-overlay').style.display = 'flex';
        return;
    }
    
    // 創建載入動畫元素
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        flex-direction: column;
    `;
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.cssText = `
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #3498db;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    `;
    
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loading-message';
    loadingMessage.textContent = message;
    loadingMessage.style.cssText = `
        color: #3498db;
        font-weight: bold;
    `;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
    loadingOverlay.appendChild(spinner);
    loadingOverlay.appendChild(loadingMessage);
    document.body.appendChild(loadingOverlay);
}

// 隱藏載入動畫
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 顯示初始載入動畫
    showLoading('正在載入應用程式...');
    
    // 自動篩選監聽器 - 使用防抖動函數優化性能
    document.getElementById('start-date').addEventListener('change', debounce(filterArticles, 300));
    document.getElementById('end-date').addEventListener('change', debounce(filterArticles, 300));
    document.getElementById('keyword-filter').addEventListener('input', debounce(filterArticles, 500));
    document.getElementById('sort-options').addEventListener('change', filterArticles);

    // 媒體篩選按鈕監聽器
    document.querySelectorAll('.media-filter').forEach(checkbox => {
        checkbox.addEventListener('change', filterArticles);
    });

    // 綁定跳轉按鈕事件
    const jumpButton = document.getElementById('jump-button');
    jumpButton.addEventListener('click', function() {
        const jumpPage = parseInt(document.getElementById('jump-page').value, 10);
        const maxPage = Math.ceil(filteredArticlesData.length / articlesPerPage);
        
        if (!isNaN(jumpPage) && jumpPage >= 1 && jumpPage <= maxPage) {
            currentPage = jumpPage;
            
            // 添加平滑滾動到文章區域
            document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
            
            // 顯示載入動畫
            showLoading('正在載入頁面...');
            
            setTimeout(() => {
                renderArticles(currentPage);
                renderPagination();
                hideLoading();
            }, 300);
        } else {
            // 使用更友好的錯誤提示
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-warning mt-2';
            errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> 請輸入有效的頁碼（1-${maxPage}）！`;
            
            const container = document.getElementById('jump-button').closest('.form-row');
            
            // 移除任何現有的錯誤訊息
            const existingError = container.querySelector('.alert');
            if (existingError) {
                existingError.remove();
            }
            
            container.appendChild(errorMessage);
            
            // 3秒後自動移除錯誤訊息
            setTimeout(() => {
                errorMessage.style.opacity = '0';
                errorMessage.style.transition = 'opacity 0.5s';
                setTimeout(() => errorMessage.remove(), 500);
            }, 3000);
        }
    });
    
    // 防抖動函數 - 優化性能
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});

// 綁定顯示/隱藏新聞內容按鈕事件
document.addEventListener('DOMContentLoaded', function() {
    const toggleNewsButton = document.getElementById('toggle-news-button');
    const newsContent = document.getElementById('news-content');

    toggleNewsButton.addEventListener('click', function() {
        if (newsContent.classList.contains('collapse')) {
            // 顯示新聞內容
            newsContent.classList.remove('collapse');
            newsContent.style.maxHeight = '0';
            newsContent.style.overflow = 'hidden';
            newsContent.style.transition = 'max-height 0.5s ease-in-out';
            
            // 使用 setTimeout 確保過渡效果正常運作
            setTimeout(() => {
                newsContent.style.maxHeight = newsContent.scrollHeight + 'px';
                
                // 平滑滾動到新聞內容區域
                setTimeout(() => {
                    newsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // 完成過渡後移除限制
                    setTimeout(() => {
                        newsContent.style.maxHeight = '';
                        newsContent.style.overflow = '';
                    }, 500);
                }, 300);
            }, 10);
            
            // 更新按鈕文字
            toggleNewsButton.innerHTML = '<i class="fas fa-times-circle"></i> 隱藏新聞內容';
        } else {
            // 隱藏新聞內容
            newsContent.style.maxHeight = newsContent.scrollHeight + 'px';
            newsContent.style.overflow = 'hidden';
            newsContent.style.transition = 'max-height 0.5s ease-in-out';
            
            // 使用 setTimeout 確保過渡效果正常運作
            setTimeout(() => {
                newsContent.style.maxHeight = '0';
                
                // 完成過渡後添加 collapse 類
                setTimeout(() => {
                    newsContent.classList.add('collapse');
                    newsContent.style.maxHeight = '';
                    newsContent.style.overflow = '';
                }, 500);
            }, 10);
            
            // 更新按鈕文字
            toggleNewsButton.innerHTML = '<i class="fas fa-newspaper"></i> 顯示新聞內容';
        }
    });

    // 確保頁面初次載入時只顯示分析部分
    newsContent.classList.add('collapse');
});

document.getElementById('showKeywordTrend').addEventListener('click', function() {
    // 顯示關鍵詞趨勢分析圖表，隱藏每月預期市場趨勢分佈圖表
    const keywordTrendContainer = document.getElementById('keywordTrendContainer');
    const expectedTrendContainer = document.getElementById('expectedTrendContainer');
    
    // 顯示載入動畫
    showLoading('正在載入關鍵詞趨勢分析...');
    
    // 使用 setTimeout 創建平滑過渡
    setTimeout(() => {
        // 先淡出當前顯示的圖表
        if (expectedTrendContainer.style.display !== 'none') {
            expectedTrendContainer.classList.add('animate__animated', 'animate__fadeOut');
            
            setTimeout(() => {
                expectedTrendContainer.style.display = 'none';
                expectedTrendContainer.classList.remove('animate__animated', 'animate__fadeOut');
                
                // 然後淡入要顯示的圖表
                keywordTrendContainer.style.display = 'block';
                keywordTrendContainer.classList.add('animate__animated', 'animate__fadeIn');
                
                // 更新按鈕樣式
                this.classList.add('btn-primary');
                this.classList.remove('btn-secondary');
                document.getElementById('showExpectedTrend').classList.add('btn-secondary');
                document.getElementById('showExpectedTrend').classList.remove('btn-primary');
                
                // 隱藏載入動畫
                hideLoading();
                
                // 重新渲染圖表以確保正確顯示
                if (trendChart) {
                    setTimeout(() => {
                        const currentMonth = document.getElementById('selected-month').textContent;
                        renderTrendChart(currentMonth);
                    }, 100);
                }
            }, 300);
        } else {
            keywordTrendContainer.style.display = 'block';
            keywordTrendContainer.classList.add('animate__animated', 'animate__fadeIn');
            
            // 更新按鈕樣式
            this.classList.add('btn-primary');
            this.classList.remove('btn-secondary');
            document.getElementById('showExpectedTrend').classList.add('btn-secondary');
            document.getElementById('showExpectedTrend').classList.remove('btn-primary');
            
            // 隱藏載入動畫
            hideLoading();
        }
    }, 300);
});

document.getElementById('showExpectedTrend').addEventListener('click', function() {
    // 顯示每月預期市場趨勢分佈圖表，隱藏關鍵詞趨勢分析圖表
    const keywordTrendContainer = document.getElementById('keywordTrendContainer');
    const expectedTrendContainer = document.getElementById('expectedTrendContainer');
    
    // 顯示載入動畫
    showLoading('正在載入市場趨勢分佈...');
    
    // 使用 setTimeout 創建平滑過渡
    setTimeout(() => {
        // 先淡出當前顯示的圖表
        if (keywordTrendContainer.style.display !== 'none') {
            keywordTrendContainer.classList.add('animate__animated', 'animate__fadeOut');
            
            setTimeout(() => {
                keywordTrendContainer.style.display = 'none';
                keywordTrendContainer.classList.remove('animate__animated', 'animate__fadeOut');
                
                // 然後淡入要顯示的圖表
                expectedTrendContainer.style.display = 'block';
                expectedTrendContainer.classList.add('animate__animated', 'animate__fadeIn');
                
                // 更新按鈕樣式
                this.classList.add('btn-primary');
                this.classList.remove('btn-secondary');
                document.getElementById('showKeywordTrend').classList.add('btn-secondary');
                document.getElementById('showKeywordTrend').classList.remove('btn-primary');
                
                // 隱藏載入動畫
                hideLoading();
                
                // 重新渲染圖表以確保正確顯示
                setTimeout(() => {
                    renderExpectedTrendChart();
                }, 100);
            }, 300);
        } else {
            expectedTrendContainer.style.display = 'block';
            expectedTrendContainer.classList.add('animate__animated', 'animate__fadeIn');
            
            // 更新按鈕樣式
            this.classList.add('btn-primary');
            this.classList.remove('btn-secondary');
            document.getElementById('showKeywordTrend').classList.add('btn-secondary');
            document.getElementById('showKeywordTrend').classList.remove('btn-primary');
            
            // 隱藏載入動畫
            hideLoading();
        }
    }, 300);
});

function renderArticles(page) {
    // 顯示載入動畫
    showLoading('正在載入文章...');
    
    const start = (page - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const currentArticles = filteredArticlesData.slice(start, end);
    const articlesContainer = document.getElementById('articles');
    articlesContainer.innerHTML = '';

    // 如果沒有文章，顯示提示訊息
    if (currentArticles.length === 0) {
        const noArticlesMessage = document.createElement('div');
        noArticlesMessage.className = 'col-12 text-center py-5';
        noArticlesMessage.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h4>沒有符合條件的文章</h4>
                <p>請嘗試調整篩選條件或上傳更多數據。</p>
            </div>
        `;
        articlesContainer.appendChild(noArticlesMessage);
        hideLoading();
        return;
    }

    // 使用 DocumentFragment 優化性能
    const fragment = document.createDocumentFragment();
    
    currentArticles.forEach((article, index) => {
        const articleCard = document.createElement('div');
        articleCard.className = 'col-md-4 mb-4';
        
        // 使用更好的隨機圖片生成方式，確保每篇文章有獨特但一致的圖片
        const imageUrl = `https://picsum.photos/seed/${article.title.substring(0, 10) || article.id || Math.floor(Math.random() * 1000)}/600/400`;
        
        // 限制關鍵詞顯示數量並添加標籤樣式
        const keywordsHtml = article.keywords.slice(0, 3).map(keyword => 
            `<span class="badge badge-pill badge-light mr-1 mb-1">${keyword}</span>`
        ).join('');
        
        // 根據預期趨勢設置不同的顏色
        let trendBadgeClass = 'badge-secondary';
        if (article.expectedMarketTrend === '上漲') {
            trendBadgeClass = 'badge-success';
        } else if (article.expectedMarketTrend === '下跌') {
            trendBadgeClass = 'badge-danger';
        } else if (article.expectedMarketTrend === '平穩') {
            trendBadgeClass = 'badge-info';
        }
        
        const publisherLink = article.url ? `<a href="${article.url}" target="_blank">${article.publisher}</a>` : article.publisher;
        const expectedTrend = article.expectedMarketTrend ? 
            `<span class="badge ${trendBadgeClass} trend-badge">${article.expectedMarketTrend}</span>` : '';
        
        articleCard.innerHTML = `
            <div class="card shadow-sm h-100">
                <div class="card-img-container">
                    <img src="${imageUrl}" class="card-img-top" alt="新聞圖片" loading="lazy">
                    <div class="card-img-overlay-top">
                        <span class="badge badge-primary">${article.publisher}</span>
                        ${expectedTrend}
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${article.title}</h5>
                    <p class="card-text flex-grow-1">${article.summary.length > 100 ? article.summary.substring(0, 100) + '...' : article.summary}</p>
                    <div class="mt-2 mb-2">
                        ${keywordsHtml}
                    </div>
                    <div class="card-footer bg-transparent border-0 p-0">
                        <p class="text-muted mb-2">
                            <i class="far fa-calendar-alt"></i> ${formatDate(article.date)}
                            ${article.author ? `<span class="ml-2"><i class="far fa-user"></i> ${article.author}</span>` : ''}
                        </p>
                        <a href="#" class="btn btn-primary btn-block" onclick="event.preventDefault(); showArticleDetails(${article.id})">
                            <i class="fas fa-book-open"></i> 閱讀更多
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // 添加延遲載入動畫
        setTimeout(() => {
            articleCard.classList.add('animate__animated', 'animate__fadeIn');
            articleCard.style.animationDelay = `${index * 0.1}s`;
        }, 10);
        
        fragment.appendChild(articleCard);
    });
    
    articlesContainer.appendChild(fragment);
    
    // 隱藏載入動畫
    setTimeout(hideLoading, 500);
}

// 格式化日期顯示
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// 計算最小和最大月份範圍
function getMonthRange(articles) {
    if (!articles || articles.length === 0) {
        return [];
    }
    
    // 過濾無效日期
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

// 格式化月份顯示
function formatMonthDisplay(yearMonth) {
    if (!yearMonth) return '';
    
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long'
    });
}

let expectedTrendChart = null;
let currentChartType = 'bar'; // 初始圖表類型為 bar

document.getElementById('toggleChartType').addEventListener('click', function() {
    // 顯示載入動畫
    showLoading('正在切換圖表類型...');
    
    // 切換圖表類型
    currentChartType = currentChartType === 'bar' ? 'line' : 'bar';
    
    // 更新按鈕文字和圖標
    this.innerHTML = currentChartType === 'bar' ? 
        '<i class="fas fa-exchange-alt me-1"></i> 切換到折線圖' : 
        '<i class="fas fa-exchange-alt me-1"></i> 切換到柱狀圖';
    
    // 添加按鈕動畫效果
    this.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        this.classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
    
    // 重新渲染圖表
    setTimeout(() => {
        renderExpectedTrendChart();
        hideLoading();
    }, 300);
});

function renderExpectedTrendChart() {
    // 顯示載入動畫
    showLoading('正在生成市場趨勢分佈圖表...');
    
    if (!filteredArticlesData || filteredArticlesData.length === 0) {
        console.warn('沒有可用的文章數據，無法渲染預期趨勢圖表');
        
        // 顯示無數據提示
        const ctx = document.getElementById('expectedTrendChart').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('無可用的趨勢數據', ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        hideLoading();
        return;
    }
    
    const months = getMonthRange(filteredArticlesData);
    const trendCountsPerMonth = {};

    // 初始化每月的五種「預期趨勢」計數
    months.forEach(month => {
        trendCountsPerMonth[month] = {
            "上漲": 0,
            "下跌": 0,
            "平穩": 0,
            "無相關": 0,
            "無法判斷": 0
        };
    });

    // 遍歷所有文章，統計每月的「預期趨勢」
    filteredArticlesData.forEach(article => {
        const articleDate = new Date(article.date);
        const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (trendCountsPerMonth[articleYearMonth] && trendCountsPerMonth[articleYearMonth][article.expectedMarketTrend] !== undefined) {
            trendCountsPerMonth[articleYearMonth][article.expectedMarketTrend]++;
        }
    });

    // 格式化月份標籤
    const formattedLabels = months.map(month => formatMonthDisplay(month));

    // 準備圖表數據
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
            fill: currentChartType === 'bar', // 折線圖時不填充
            tension: 0.2, // 折線圖平滑度
            pointRadius: currentChartType === 'line' ? 4 : 0,
            pointHoverRadius: currentChartType === 'line' ? 6 : 0,
            pointBackgroundColor: trendColors[trend].borderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        };
    });

    // 如果已存在圖表，則銷毀它以便重新繪製
    if (expectedTrendChart) {
        expectedTrendChart.destroy();
    }

    // 繪製圖表（根據 currentChartType 決定圖表類型）
    const ctx = document.getElementById('expectedTrendChart').getContext('2d');
    expectedTrendChart = new Chart(ctx, {
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
    
    // 隱藏載入動畫
    hideLoading();
}

// 初始化月份滑桿
function initializeMonthSlider() {
    const months = getMonthRange(filteredArticlesData.length > 0 ? filteredArticlesData : articlesData);
    if (months.length === 0) {
        console.warn('沒有可用的月份數據');
        return;
    }
    
    const monthSlider = document.getElementById('month-slider');
    const selectedMonthLabel = document.getElementById('selected-month');
    const prevButton = document.getElementById('prev-month');
    const nextButton = document.getElementById('next-month');

    monthSlider.min = 0;
    monthSlider.max = months.length - 1;
    monthSlider.value = 0;
    selectedMonthLabel.textContent = months[monthSlider.value];

    monthSlider.addEventListener('input', function() {
        selectedMonthLabel.textContent = months[monthSlider.value];
        renderTrendChart(months[monthSlider.value]);
    });

    prevButton.addEventListener('click', function() {
        if (monthSlider.value > 0) {
            monthSlider.value--;
            selectedMonthLabel.textContent = months[monthSlider.value];
            renderTrendChart(months[monthSlider.value]);
        }
    });

    nextButton.addEventListener('click', function() {
        if (monthSlider.value < months.length - 1) {
            monthSlider.value++;
            selectedMonthLabel.textContent = months[monthSlider.value];
            renderTrendChart(months[monthSlider.value]);
        }
    });

    // 初始渲染
    renderTrendChart(months[monthSlider.value]);
}

function renderTrendChart(selectedMonth) {
    if (!selectedMonth) {
        console.warn('未提供月份參數，無法渲染趨勢圖表');
        return;
    }
    
    // 顯示載入動畫
    showLoading('正在生成關鍵詞趨勢圖表...');
    
    const keywordCounts = {};

    // 使用篩選後的 `filteredArticlesData`，確保資料動態更新
    const filteredArticles = filteredArticlesData.filter(article => {
        const articleDate = new Date(article.date);
        const articleYearMonth = `${articleDate.getFullYear()}-${String(articleDate.getMonth() + 1).padStart(2, '0')}`;
        return articleYearMonth === selectedMonth;
    });

    // 統計該月份的關鍵詞出現次數
    filteredArticles.forEach(article => {
        article.keywords.forEach(keyword => {
            if (keywordCounts[keyword]) {
                keywordCounts[keyword]++;
            } else {
                keywordCounts[keyword] = 1;
            }
        });
    });

    // 如果該月份的數據為空，則清空趨勢圖
    if (Object.keys(keywordCounts).length === 0) {
        if (trendChart) {
            trendChart.destroy();
        }
        
        // 顯示無數據提示
        const ctx = document.getElementById('trend').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('此月份無關鍵詞數據', ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        hideLoading();
        return; // 不繪製空的圖表
    }

    // 取出出現次數最多的前10個關鍵詞
    const sortedKeywordCounts = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = sortedKeywordCounts.map(entry => entry[0]);
    const data = sortedKeywordCounts.map(entry => entry[1]);

    // 每次重新繪製圖表，先清除舊的圖表
    if (trendChart) {
        trendChart.destroy();
    }

    // 使用漸變色
    const gradientColors = [
        'rgba(52, 152, 219, 0.8)',  // 藍色
        'rgba(46, 204, 113, 0.8)',  // 綠色
        'rgba(155, 89, 182, 0.8)',  // 紫色
        'rgba(52, 73, 94, 0.8)',    // 深藍色
        'rgba(22, 160, 133, 0.8)',  // 青色
        'rgba(39, 174, 96, 0.8)',   // 深綠色
        'rgba(41, 128, 185, 0.8)',  // 另一種藍色
        'rgba(142, 68, 173, 0.8)',  // 另一種紫色
        'rgba(44, 62, 80, 0.8)',    // 深灰藍色
        'rgba(26, 188, 156, 0.8)'   // 淺綠色
    ];

    const ctx = document.getElementById('trend').getContext('2d');
    
    // 創建漸變背景
    const backgroundColors = data.map((_, index) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, gradientColors[index % gradientColors.length]);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        return gradient;
    });

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `關鍵詞出現次數 (${formatMonthDisplay(selectedMonth)})`,
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
    
    // 隱藏載入動畫
    hideLoading();
}

function getFilteredArticles() {
    if (!articlesData || articlesData.length === 0) {
        return [];
    }
    
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    const keyword = document.getElementById('keyword-filter').value.trim().toLowerCase();
    const selectedMedia = Array.from(document.querySelectorAll('.media-filter:checked')).map(el => el.value);

    // 返回符合條件的文章列表
    return articlesData.filter(article => {
        const articleDate = new Date(article.date);
        const matchesDate = (!isNaN(startDate) ? articleDate >= startDate : true) && (!isNaN(endDate) ? articleDate <= endDate : true);
        const matchesKeyword = keyword ? article.keywords.some(kw => kw.toLowerCase().includes(keyword)) : true;
        const matchesMedia = selectedMedia.length === 0 || selectedMedia.includes(article.publisher);

        return matchesDate && matchesKeyword && matchesMedia;
    });
}

function filterArticles() {
    // 使用通用篩選邏輯更新 `filteredArticlesData`
    filteredArticlesData = getFilteredArticles();

    // 獲取排序選項並應用排序
    const sortOption = document.getElementById('sort-options').value;
    filteredArticlesData.sort((a, b) => {
        if (sortOption === 'date-desc') {
            return new Date(b.date) - new Date(a.date); // 最新到最舊
        } else if (sortOption === 'date-asc') {
            return new Date(a.date) - new Date(b.date); // 最舊到最新
        } else if (sortOption === 'title-asc') {
            return a.title.localeCompare(b.title); // 名稱 A 到 Z
        } else if (sortOption === 'title-desc') {
            return b.title.localeCompare(a.title); // 名稱 Z 到 A
        }
        return 0;
    });

    // 重新渲染文章列表
    currentPage = 1;
    renderArticles(currentPage);
    renderPagination();
    
    // 重新初始化月份滑桿，以反映篩選後的日期範圍
    initializeMonthSlider();
    
    // 更新每月預期市場趨勢分佈圖表
    renderExpectedTrendChart();
}

document.getElementById('sort-options').addEventListener('change', filterArticles);

function renderPagination() {
    const totalPages = Math.ceil(filteredArticlesData.length / articlesPerPage);
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    // 定義頁簽顯示範圍
    const maxVisiblePages = 5;
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = startPage + maxVisiblePages - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.textContent = '1';
        firstPageButton.className = 'btn btn-secondary mx-1';
        firstPageButton.addEventListener('click', () => {
            currentPage = 1;
            renderArticles(currentPage);
            renderPagination();
        });
        paginationDiv.appendChild(firstPageButton);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            paginationDiv.appendChild(dots);
        }
    }

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '上一頁';
        prevButton.className = 'btn btn-secondary mx-1';
        prevButton.addEventListener('click', () => {
            currentPage--;
            renderArticles(currentPage);
            renderPagination();
        });
        paginationDiv.appendChild(prevButton);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = `btn btn-secondary mx-1 ${i === currentPage ? 'active' : ''}`;
        button.addEventListener('click', () => {
            currentPage = i;
            renderArticles(currentPage);
            renderPagination();
        });
        paginationDiv.appendChild(button);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = '下一頁';
        nextButton.className = 'btn btn-secondary mx-1';
        nextButton.addEventListener('click', () => {
            currentPage++;
            renderArticles(currentPage);
            renderPagination();
        });
        paginationDiv.appendChild(nextButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            paginationDiv.appendChild(dots);
        }
        const lastPageButton = document.createElement('button');
        lastPageButton.textContent = totalPages;
        lastPageButton.className = 'btn btn-secondary mx-1';
        lastPageButton.addEventListener('click', () => {
            currentPage = totalPages;
            renderArticles(currentPage);
            renderPagination();
        });
        paginationDiv.appendChild(lastPageButton);
    }
}

function formatArticleContent(content) {
    if (!content) return '';
    return content.replace(/_x000D_/g, '<br>').replace(/\r\n|\n/g, '<br>');
}

function showArticleDetails(articleId) {
    const article = articlesData.find(a => a.id === articleId);
    if (article) {
        const expectedTrend = article.expectedMarketTrend ? `<p class="text-muted">預期趨勢：${article.expectedMarketTrend}</p>` : '';

        // 使用 formatArticleContent 處理 fullText
        const formattedFullText = formatArticleContent(article.fullText);

        const modalHtml = `
            <div class="modal fade" id="articleModal" tabindex="-1" role="dialog" aria-labelledby="articleModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="articleModalLabel">${article.title}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>${formattedFullText}</p>
                            <p class="text-muted">發布時間：${article.date} | 作者：${article.author} | 發布單位：${article.url ? `<a href="${article.url}" target="_blank">${article.publisher}</a>` : article.publisher}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">關閉</button>
                        </div>
                    </div>
                </div>
            </div>`;

        // Append modal to body and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        $('#articleModal').modal('show');

        // Remove modal from DOM after it's closed
        $('#articleModal').on('hidden.bs.modal', function () {
            document.getElementById('articleModal').remove();
        });
    }
}
