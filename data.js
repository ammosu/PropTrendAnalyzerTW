// data.js
// 動態載入文章數據

// 初始化空的文章數據陣列
let articlesData = [];

// 初始化趨勢數據
let trendData = {
  labels: [],
  data: []
};

// 載入文章數據
async function loadArticlesData() {
  try {
    // 首先載入元數據以獲取可用月份
    const metadataResponse = await fetch('data/metadata.json');
    const metadata = await metadataResponse.json();
    
    // 載入所有文章數據
    const response = await fetch('data/all_articles.json');
    articlesData = await response.json();
    
    // 計算關鍵詞趨勢
    calculateTrendData();
    
    // 觸發頁面初始化
    if (typeof initializePage === 'function') {
      initializePage();
    }
    
    console.log(`成功載入 ${articlesData.length} 篇文章`);
  } catch (error) {
    console.error('載入文章數據時發生錯誤:', error);
    // 如果載入失敗，顯示錯誤訊息
    document.getElementById('articles').innerHTML = `
      <div class="col-12 text-center">
        <div class="alert alert-danger">
          載入數據時發生錯誤。請稍後再試。
        </div>
      </div>
    `;
  }
}

// 計算關鍵詞趨勢數據
function calculateTrendData() {
  const keywordCounts = {};
  
  articlesData.forEach(article => {
    article.keywords.forEach(keyword => {
      if (keywordCounts[keyword]) {
        keywordCounts[keyword]++;
      } else {
        keywordCounts[keyword] = 1;
      }
    });
  });
  
  trendData = {
    labels: Object.keys(keywordCounts),
    data: Object.values(keywordCounts)
  };
}

// 按月份載入文章數據
async function loadArticlesByMonth(yearMonth) {
  try {
    const response = await fetch(`data/articles_${yearMonth}.json`);
    return await response.json();
  } catch (error) {
    console.error(`載入 ${yearMonth} 月份數據時發生錯誤:`, error);
    return [];
  }
}

// 頁面載入時自動載入數據
document.addEventListener('DOMContentLoaded', loadArticlesData);

// 提供一個初始化頁面的函數，在數據載入完成後調用
function initializePage() {
  // 這個函數將在 scripts.js 中定義
  // 用於在數據載入完成後初始化頁面元素
  if (typeof renderArticles === 'function') {
    renderArticles(1); // 渲染第一頁文章
  }
  
  if (typeof renderPagination === 'function') {
    renderPagination(); // 渲染分頁
  }
  
  if (typeof renderTrendChart === 'function') {
    // 獲取第一個月份
    const firstMonth = articlesData.length > 0 
      ? new Date(articlesData[0].date).toISOString().substring(0, 7)
      : null;
      
    if (firstMonth) {
      renderTrendChart(firstMonth); // 渲染趨勢圖
    }
  }
  
  if (typeof renderExpectedTrendChart === 'function') {
    renderExpectedTrendChart(); // 渲染預期趨勢圖
  }
}
