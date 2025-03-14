// scripts.js

const articlesPerPage = 6;
let currentPage = 1;
let filteredArticlesData = [];
let trendChart = null;

// 頁面初始化函數，在數據載入完成後調用
function initializePage() {
    // 初始化過濾後的文章數據
    filteredArticlesData = [...articlesData];
    
    // 渲染頁面元素
    renderArticles(currentPage);
    renderPagination();
    
    // 初始化月份滑桿
    initializeMonthSlider();
    
    // 初始化預期趨勢圖表
    renderExpectedTrendChart();
    
    // 應用初始篩選
    filterArticles();
    
    console.log('頁面初始化完成');
}

document.addEventListener('DOMContentLoaded', function() {
    // 自動篩選監聽器
    document.getElementById('start-date').addEventListener('change', filterArticles);
    document.getElementById('end-date').addEventListener('change', filterArticles);
    document.getElementById('keyword-filter').addEventListener('input', filterArticles);
    document.getElementById('sort-options').addEventListener('change', filterArticles);

    // 媒體篩選按鈕監聽器
    document.querySelectorAll('.media-filter').forEach(checkbox => {
        checkbox.addEventListener('change', filterArticles);
    });

    // 綁定跳轉按鈕事件
    const jumpButton = document.getElementById('jump-button');
    jumpButton.addEventListener('click', function() {
        const jumpPage = parseInt(document.getElementById('jump-page').value, 10);
        if (!isNaN(jumpPage) && jumpPage >= 1 && jumpPage <= Math.ceil(filteredArticlesData.length / articlesPerPage)) {
            currentPage = jumpPage;
            renderArticles(currentPage);
            renderPagination();
        } else {
            alert('請輸入有效的頁碼！');
        }
    });
});

// 綁定顯示/隱藏新聞內容按鈕事件
document.addEventListener('DOMContentLoaded', function() {
    const toggleNewsButton = document.getElementById('toggle-news-button');
    const newsContent = document.getElementById('news-content');

    toggleNewsButton.addEventListener('click', function() {
        newsContent.classList.toggle('collapse');
    });

    // 確保頁面初次載入時只顯示分析部分
    newsContent.classList.add('collapse');
});

document.getElementById('showKeywordTrend').addEventListener('click', function() {
    // 顯示關鍵詞趨勢分析圖表，隱藏每月預期市場趨勢分佈圖表
    const keywordTrendContainer = document.getElementById('keywordTrendContainer');
    const expectedTrendContainer = document.getElementById('expectedTrendContainer');
    
    keywordTrendContainer.style.display = 'block';
    expectedTrendContainer.style.display = 'none';

    // 添加淡入效果
    keywordTrendContainer.classList.add('fade-in');
    expectedTrendContainer.classList.remove('fade-in');
    
    // 更新按鈕樣式
    this.classList.add('btn-primary');
    this.classList.remove('btn-secondary');
    document.getElementById('showExpectedTrend').classList.add('btn-secondary');
    document.getElementById('showExpectedTrend').classList.remove('btn-primary');
});

document.getElementById('showExpectedTrend').addEventListener('click', function() {
    // 顯示每月預期市場趨勢分佈圖表，隱藏關鍵詞趨勢分析圖表
    const keywordTrendContainer = document.getElementById('keywordTrendContainer');
    const expectedTrendContainer = document.getElementById('expectedTrendContainer');
    
    keywordTrendContainer.style.display = 'none';
    expectedTrendContainer.style.display = 'block';

    // 添加淡入效果
    expectedTrendContainer.classList.add('fade-in');
    keywordTrendContainer.classList.remove('fade-in');
    
    // 更新按鈕樣式
    this.classList.add('btn-primary');
    this.classList.remove('btn-secondary');
    document.getElementById('showKeywordTrend').classList.add('btn-secondary');
    document.getElementById('showKeywordTrend').classList.remove('btn-primary');
});

function renderArticles(page) {
    const start = (page - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const currentArticles = filteredArticlesData.slice(start, end);
    const articlesContainer = document.getElementById('articles');
    articlesContainer.innerHTML = '';

    currentArticles.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.className = 'col-md-4';
        const imageUrl = `https://picsum.photos/seed/${article.id || Math.floor(Math.random() * 1000)}/600/400`;
        const keywords = article.keywords.slice(0, 3).join(', ');
        const publisherLink = article.url ? `<a href="${article.url}" target="_blank">${article.publisher}</a>` : article.publisher;
        const expectedTrend = article.expectedMarketTrend ? `<p class="text-muted">預期趨勢：${article.expectedMarketTrend}</p>` : '';
        articleCard.innerHTML = `
            <div class="card shadow-sm">
                <img src="${imageUrl}" class="card-img-top" alt="新聞圖片">
                <div class="card-body">
                    <h5 class="card-title">${article.title}</h5>
                    <p class="card-text">${article.summary.length > 100 ? article.summary.substring(0, 100) + '...' : article.summary}</p>
                    <p class="text-muted">發布時間：${article.date} | 作者：${article.author} | 發布單位：${publisherLink}</p>
                    <p class="text-muted">關鍵詞：${keywords}</p>
                    ${expectedTrend}
                    <a href="#" class="btn btn-primary" onclick="showArticleDetails(${article.id})">閱讀更多</a>
                </div>
            </div>
        `;
        articlesContainer.appendChild(articleCard);
    });
}

// 計算最小和最大月份範圍
function getMonthRange(articles) {
    if (!articles || articles.length === 0) {
        return [];
    }
    
    const dates = articles.map(article => new Date(article.date));
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

let expectedTrendChart = null;
let currentChartType = 'bar'; // 初始圖表類型為 bar

document.getElementById('toggleChartType').addEventListener('click', function() {
    // 切換圖表類型
    currentChartType = currentChartType === 'bar' ? 'line' : 'bar';
    
    // 更新按鈕文字
    this.textContent = currentChartType === 'bar' ? '切換到折線圖' : '切換到柱狀圖';
    
    // 重新渲染圖表
    renderExpectedTrendChart();
});

function renderExpectedTrendChart() {
    if (!filteredArticlesData || filteredArticlesData.length === 0) {
        console.warn('沒有可用的文章數據，無法渲染預期趨勢圖表');
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

    // 準備圖表數據
    const labels = months;
    const trendDatasets = ["上漲", "下跌", "平穩", "無相關", "無法判斷"].map((trend, index) => {
        return {
            label: trend,
            data: months.map(month => trendCountsPerMonth[month][trend]),
            backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 205, 86, 0.7)',
                'rgba(201, 203, 207, 0.7)',
                'rgba(54, 162, 235, 0.7)'
            ][index],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(201, 203, 207, 1)',
                'rgba(54, 162, 235, 1)'
            ][index],
            fill: currentChartType === 'bar', // 折線圖時不填充
            tension: 0.1 // 折線圖平滑度
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
            labels: labels,
            datasets: trendDatasets
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: currentChartType === 'bar' },
                y: { 
                    stacked: currentChartType === 'bar', 
                    beginAtZero: true 
                }
            },
            plugins: {
                legend: { display: true }
            }
        }
    });
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

    const ctx = document.getElementById('trend').getContext('2d');
    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `關鍵詞出現次數 (${selectedMonth})`,
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
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
