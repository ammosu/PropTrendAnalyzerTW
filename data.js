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
    // 檢查是否有已上傳的數據（從IndexedDB載入）
    if (window.csvUploader && typeof window.csvUploader.hasArticlesInDB === 'function') {
      try {
        const hasData = await window.csvUploader.hasArticlesInDB();
        if (hasData) {
          articlesData = await window.csvUploader.getArticlesFromDB();
          window.articlesData = articlesData; // 確保全域存取
          console.log(`從IndexedDB載入 ${articlesData.length} 篇文章`);
          
          // 計算關鍵詞趨勢
          calculateTrendData();
          
          // 觸發頁面初始化
          if (typeof initializePage === 'function') {
            initializePage();
          }
          
          return;
        }
      } catch (dbError) {
        console.warn('從IndexedDB載入數據失敗:', dbError);
      }
    }
    
    // 如果沒有上傳的數據，嘗試從預設位置載入
    try {
      // 首先載入元數據以獲取可用月份
      const metadataResponse = await fetch('data/metadata.json');
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
      }
      
      // 載入所有文章數據
      const response = await fetch('data/all_articles.json');
      if (response.ok) {
        articlesData = await response.json();
        window.articlesData = articlesData; // 確保全域存取
      } else {
        throw new Error(`HTTP ${response.status}: 無法載入 data/all_articles.json`);
      }
      
      // 計算關鍵詞趨勢
      calculateTrendData();
      
      // 觸發頁面初始化
      if (typeof initializePage === 'function') {
        initializePage();
      }
      
      console.log(`成功載入 ${articlesData.length} 篇文章`);
    } catch (fetchError) {
      console.warn('無法從預設位置載入數據:', fetchError);
      
      // 如果沒有預設數據，顯示上傳提示
      const uploadStatus = document.getElementById('upload-status');
      if (uploadStatus) {
        uploadStatus.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i> 尚未載入任何數據。請上傳CSV檔案以開始分析。
          </div>
        `;
      }
      
      // 初始化空數據
      articlesData = [];
      
      // 仍然初始化頁面，但會顯示空內容
      if (typeof initializePage === 'function') {
        initializePage();
      }
    }
  } catch (error) {
    console.error('載入文章數據時發生錯誤:', error);
    // 如果載入失敗，顯示錯誤訊息
    const articlesElement = document.getElementById('articles');
    if (articlesElement) {
      articlesElement.innerHTML = `
        <div class="col-12 text-center">
          <div class="alert alert-danger">
            載入數據時發生錯誤。請稍後再試。
          </div>
        </div>
      `;
    }
  }
}

// 設置上傳的文章數據
function setArticlesData(data) {
  articlesData = data;
  
  // 確保全域存取
  window.articlesData = data;
  
  // 同步到 StateManager（如果存在）
  if (window.App && window.App.setArticlesData) {
    window.App.setArticlesData(data);
  }
  
  // 計算關鍵詞趨勢
  calculateTrendData();
  
  // 重新初始化頁面
  if (typeof initializePage === 'function') {
    initializePage();
  }
  
  // 確保月份滑桿寬度調整（如果函數存在）
  if (typeof adjustSliderWidth === 'function') {
    const months = getMonthRange(articlesData);
    if (months && months.length > 0) {
      adjustSliderWidth(months.length);
    }
  }
  
  console.log(`成功設置 ${articlesData.length} 篇文章`);
  return articlesData.length;
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
