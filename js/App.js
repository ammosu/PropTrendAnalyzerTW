// App.js - 主應用程式控制器
class App {
    constructor() {
        this.stateManager = null;
        this.uiComponents = null;
        this.chartManager = null;
        this.eventHandlers = null;
        this.utilities = null;
        this.accessibilityManager = null;
        this.isInitialized = false;

        this.initialize();
    }

    // 初始化應用程式
    async initialize() {
        try {
            console.log('初始化 PropTrendAnalyzerTW 應用程式...');
            
            // 等待 DOM 載入完成
            if (document.readyState === 'loading') {
                await this.waitForDOMContentLoaded();
            }
            
            // 初始化模組
            this.initializeModules();
            
            // 設定全域引用供向後相容
            this.setupGlobalReferences();
            
            // 初始化應用程式狀態
            await this.initializeAppState();
            
            // 訂閱狀態變化
            this.subscribeToStateChanges();
            
            this.isInitialized = true;
            console.log('應用程式初始化完成');
            
            // 觸發初始頁面載入
            this.initializePage();
            
        } catch (error) {
            console.error('應用程式初始化失敗:', error);
            this.showInitializationError(error);
        }
    }

    // 等待 DOM 內容載入完成
    waitForDOMContentLoaded() {
        return new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    // 初始化所有模組
    initializeModules() {
        // 檢查依賴是否已載入
        if (typeof StateManager === 'undefined' ||
            typeof UIComponents === 'undefined' ||
            typeof ChartManager === 'undefined' ||
            typeof EventHandlers === 'undefined' ||
            typeof Utilities === 'undefined' ||
            typeof AccessibilityManager === 'undefined') {
            throw new Error('必要的模組尚未載入完成');
        }

        // 初始化模組實例
        this.stateManager = window.StateManager;
        this.utilities = window.Utilities;

        // 從 localStorage 載入檢視模式偏好
        this.loadViewModePreference();

        // 從 localStorage 載入深色模式偏好
        this.loadDarkModePreference();

        // 初始化無障礙性管理器
        this.accessibilityManager = new AccessibilityManager(this.stateManager);

        // 初始化匯出管理器
        this.exportManager = new ExportManager(this.stateManager);

        // 初始化 UI 元件和圖表管理器
        this.uiComponents = new UIComponents(this.stateManager);
        this.chartManager = new ChartManager(this.stateManager, this.uiComponents);
        this.eventHandlers = new EventHandlers(
            this.stateManager,
            this.uiComponents,
            this.chartManager,
            this.utilities
        );

        // 將無障礙性管理器設定到需要的模組
        this.uiComponents.setAccessibilityManager(this.accessibilityManager);
        this.eventHandlers.setAccessibilityManager(this.accessibilityManager);

        // 初始化匯出功能事件監聽器
        this.initializeExportFeatures();

        // 同步深色模式按鈕狀態
        this.syncDarkModeButton();

        console.log('所有模組初始化完成（包含無障礙性管理器）');
    }

    // 同步深色模式按鈕狀態
    syncDarkModeButton() {
        const isDarkMode = this.stateManager.getState('darkMode');
        if (isDarkMode && this.eventHandlers) {
            // 確保按鈕狀態與已載入的偏好一致
            this.eventHandlers.applyDarkMode(isDarkMode);
        }
    }

    // 載入檢視模式偏好
    loadViewModePreference() {
        try {
            const savedViewMode = localStorage.getItem('viewMode');
            if (savedViewMode === 'card' || savedViewMode === 'list') {
                this.stateManager.state.viewMode = savedViewMode;
                console.log(`載入檢視模式偏好: ${savedViewMode}`);
            }
        } catch (e) {
            console.warn('無法載入檢視模式偏好:', e);
        }
    }

    // 載入深色模式偏好
    loadDarkModePreference() {
        try {
            const savedDarkMode = localStorage.getItem('darkMode');
            const isDarkMode = savedDarkMode === 'true';

            // 更新狀態
            this.stateManager.state.darkMode = isDarkMode;

            // 立即應用深色模式（在 EventHandlers 初始化之前）
            if (isDarkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
                console.log('載入深色模式偏好: 開啟');
            } else {
                console.log('載入深色模式偏好: 關閉');
            }
        } catch (e) {
            console.warn('無法載入深色模式偏好:', e);
        }
    }

    // 設定全域引用供向後相容
    setupGlobalReferences() {
        // 供 HTML 中的 onclick 事件使用
        window.UIManager = {
            showArticleDetails: (id) => this.uiComponents.showArticleDetails(id)
        };

        // 供其他舊代碼使用的全域函數
        window.initializePage = () => this.initializePage();
        window.renderArticles = (page) => this.uiComponents.renderArticles(page);
        window.renderPagination = () => this.uiComponents.renderPagination();
        window.showLoading = (message) => this.uiComponents.showLoading(message);
        window.hideLoading = () => this.uiComponents.hideLoading();
        window.renderTrendChart = (month) => this.chartManager.renderTrendChart(month);
        window.renderExpectedTrendChart = () => this.chartManager.renderExpectedTrendChart();
        
        console.log('全域引用設定完成');
    }

    // 初始化應用程式狀態
    async initializeAppState() {
        // 等待一小段時間讓 data.js 有機會載入
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 嘗試從 data.js 載入資料
        if (typeof articlesData !== 'undefined' && articlesData.length > 0) {
            this.stateManager.setArticlesData(articlesData);
            console.log(`從 data.js 載入 ${articlesData.length} 篇文章`);
        } else {
            console.log('等待資料載入...');
            // 設定一個監聽器來等待資料載入
            this.waitForDataLoading();
        }
    }

    // 等待資料載入的監聽器
    waitForDataLoading() {
        const checkInterval = setInterval(() => {
            if (typeof articlesData !== 'undefined' && articlesData.length > 0) {
                clearInterval(checkInterval);
                this.stateManager.setArticlesData(articlesData);
                console.log(`延遲載入 ${articlesData.length} 篇文章`);
                // 確保設定初始過濾資料
                this.stateManager.setFilteredArticles([...articlesData]);
                // 重新初始化頁面
                this.initializePage();
            }
        }, 100);

        // 10秒後停止等待
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    // 訂閱狀態變化
    subscribeToStateChanges() {
        this.stateManager.subscribe((stateKey, newValue, oldValue) => {
            // 只記錄重要的狀態變更，避免過多 console 訊息
            const importantStates = ['articlesData', 'filteredArticlesData'];
            if (importantStates.includes(stateKey)) {
                console.log(`狀態變更: ${stateKey}`, {
                    count: Array.isArray(newValue) ? newValue.length : 'N/A'
                });
            }

            // 根據狀態變化執行相應操作
            switch (stateKey) {
                case 'articlesData':
                    if (newValue && newValue.length > 0) {
                        this.handleArticlesDataLoaded();
                    }
                    break;
                case 'filteredArticlesData':
                    this.handleFilteredArticlesChanged();
                    break;
                case 'currentPage':
                    this.handlePageChanged();
                    break;
            }
        });
    }

    // 處理文章資料載入完成
    handleArticlesDataLoaded() {
        console.log('文章資料載入完成，更新 UI');

        // 初始化篩選器
        this.initializeFilters();

        // 初始化新聞內容切換狀態
        this.initializeNewsContentState();

        // 更新資料統計
        this.updateDataStatistics();

        // 初始化匯出功能
        this.initializeExportButtons();
    }

    // 更新資料統計
    updateDataStatistics() {
        const articlesData = this.stateManager.getState('articlesData');
        if (articlesData && articlesData.length > 0 && window.csvUploader) {
            window.csvUploader.updateDataSummary(articlesData);
        }

        // 更新篩選結果數量
        const filteredData = this.stateManager.getState('filteredArticlesData');
        if (filteredData && this.eventHandlers) {
            this.eventHandlers.updateFilterResultCount(filteredData.length);
        }
    }

    // 初始化匯出功能事件監聽器
    initializeExportFeatures() {
        // CSV 匯出
        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                const articles = this.stateManager.getState('filteredArticlesData') || [];
                this.exportManager.exportToCSV(articles, '篩選後的房市新聞');
            });
        }

        // JSON 匯出
        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                const articles = this.stateManager.getState('filteredArticlesData') || [];
                this.exportManager.exportToJSON(articles, '篩選後的房市新聞');
            });
        }

        // 匯出關鍵詞趨勢圖
        const exportChartKeywordBtn = document.getElementById('export-chart-keyword-btn');
        if (exportChartKeywordBtn) {
            exportChartKeywordBtn.addEventListener('click', () => {
                this.exportManager.exportChartAsImage('trend', '關鍵詞趨勢圖');
            });
        }

        // 匯出市場趨勢圖
        const exportChartTrendBtn = document.getElementById('export-chart-trend-btn');
        if (exportChartTrendBtn) {
            exportChartTrendBtn.addEventListener('click', () => {
                this.exportManager.exportChartAsImage('expectedTrendChart', '市場趨勢圖');
            });
        }

        // 匯出文字雲圖
        const exportChartCloudBtn = document.getElementById('export-chart-cloud-btn');
        if (exportChartCloudBtn) {
            exportChartCloudBtn.addEventListener('click', () => {
                this.exportManager.exportChartAsImage('keywordCloudCanvas', '關鍵詞文字雲');
            });
        }

        // 匯出完整報表
        const exportFullReportBtn = document.getElementById('export-full-report-btn');
        if (exportFullReportBtn) {
            exportFullReportBtn.addEventListener('click', () => {
                const articles = this.stateManager.getState('filteredArticlesData') || [];
                const chartIds = ['trend', 'expectedTrendChart', 'keywordCloudCanvas'];
                this.exportManager.exportFullReport(articles, chartIds);
            });
        }

        console.log('匯出功能事件監聽器已初始化');
    }

    // 初始化匯出按鈕（相容舊方法）
    initializeExportButtons() {
        // 已合併到 initializeExportFeatures
    }

    // 處理過濾後文章變化
    handleFilteredArticlesChanged() {
        const filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        console.log(`過濾後的文章數量: ${filteredArticlesData.length}`);
    }

    // 處理頁面變化
    handlePageChanged() {
        const currentPage = this.stateManager.getState('currentPage');
        console.log(`切換到第 ${currentPage} 頁`);
    }

    // 初始化頁面
    initializePage() {
        if (!this.isInitialized) {
            // 靜默等待初始化完成
            setTimeout(() => this.initializePage(), 100);
            return;
        }

        console.log('開始初始化頁面...');
        
        this.uiComponents.showLoading('正在初始化頁面...');
        
        let articlesData = this.stateManager.getState('articlesData');
        
        // 如果 StateManager 中沒有資料，檢查全域變數
        if ((!articlesData || articlesData.length === 0) && typeof window.articlesData !== 'undefined' && window.articlesData.length > 0) {
            console.log('從全域變數同步資料到 StateManager');
            this.stateManager.setArticlesData(window.articlesData);
            articlesData = window.articlesData;
        }
        
        if (!articlesData || articlesData.length === 0) {
            console.log('沒有文章資料，顯示空狀態');
            this.showEmptyState();
            this.uiComponents.hideLoading();
            return;
        }
        
        // 初始化過濾後的文章資料
        this.stateManager.setFilteredArticles(articlesData);
        
        // 顯示所有資料相關區塊
        this.showDataDependentSections();

        // 渲染頁面元素
        setTimeout(() => {
            // 直接設定初始的過濾資料，避免空篩選
            this.stateManager.setFilteredArticles([...articlesData]);

            this.uiComponents.renderArticles(1);
            this.uiComponents.renderPagination();

            // 初始化月份滑桿
            this.eventHandlers.initializeMonthSlider();

            // 初始化預期趨勢圖表
            this.chartManager.renderExpectedTrendChart();

            // 隱藏載入動畫
            this.uiComponents.hideLoading();

            console.log('頁面初始化完成');
        }, 500);
    }

    // 顯示空狀態
    showEmptyState() {
        // 隱藏所有資料相關的區塊
        this.hideDataDependentSections();

        const articlesContainer = document.getElementById('articles');
        if (articlesContainer) {
            articlesContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle fa-2x mb-3"></i>
                        <h4>尚未載入任何資料</h4>
                        <p>請上傳 CSV 檔案或檢查資料載入狀況。</p>
                    </div>
                </div>
            `;
        }
    }

    // 隱藏所有資料相關的區塊
    hideDataDependentSections() {
        const sections = document.querySelectorAll('.data-dependent-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        console.log('已隱藏所有資料相關區塊');
    }

    // 顯示所有資料相關的區塊
    showDataDependentSections() {
        const sections = document.querySelectorAll('.data-dependent-section');
        sections.forEach(section => {
            // 特殊處理：expectedTrendContainer 和 keywordCloudContainer 預設不顯示（由頁籤切換控制）
            if (section.id === 'expectedTrendContainer' || section.id === 'keywordCloudContainer') {
                return; // 保持隱藏狀態
            }
            // 使用 block 來顯示區塊元素
            section.style.display = 'block';
        });
        console.log('已顯示所有資料相關區塊（保持圖表頁籤切換邏輯）');
    }

    // 初始化篩選器
    initializeFilters() {
        const articlesData = this.stateManager.getState('articlesData');
        
        // 設定日期範圍
        if (articlesData.length > 0) {
            const dates = articlesData.map(article => new Date(article.date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            const startDateEl = document.getElementById('start-date');
            const endDateEl = document.getElementById('end-date');
            
            if (startDateEl && endDateEl) {
                startDateEl.min = minDate.toISOString().split('T')[0];
                startDateEl.max = maxDate.toISOString().split('T')[0];
                endDateEl.min = minDate.toISOString().split('T')[0];
                endDateEl.max = maxDate.toISOString().split('T')[0];
            }
        }
        
        // 初始化媒體篩選選項
        this.initializeMediaFilters();
    }

    // 初始化媒體篩選器
    initializeMediaFilters() {
        const articlesData = this.stateManager.getState('articlesData');
        const publishers = [...new Set(articlesData.map(article => article.publisher))];
        
        const mediaFilterContainer = document.querySelector('.media-filters');
        if (mediaFilterContainer && publishers.length > 0) {
            const checkboxes = publishers.map(publisher => `
                <div class="form-check form-check-inline">
                    <input class="form-check-input media-filter" type="checkbox" value="${this.utilities.escapeHtml(publisher)}" id="media-${publisher}">
                    <label class="form-check-label" for="media-${publisher}">
                        ${this.utilities.escapeHtml(publisher)}
                    </label>
                </div>
            `).join('');
            
            mediaFilterContainer.innerHTML = checkboxes;
            
            // 重新綁定事件
            document.querySelectorAll('.media-filter').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.eventHandlers.filterArticles());
            });
        }

        // 同步檢視模式按鈕狀態
        this.syncViewModeButtons();
    }

    // 同步檢視模式按鈕狀態
    syncViewModeButtons() {
        const viewMode = this.stateManager.getState('viewMode');
        const cardViewBtn = document.getElementById('view-mode-card');
        const listViewBtn = document.getElementById('view-mode-list');

        if (cardViewBtn && listViewBtn) {
            if (viewMode === 'list') {
                cardViewBtn.classList.remove('active');
                listViewBtn.classList.add('active');
            } else {
                cardViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            }
        }
    }

    // 初始化新聞內容切換狀態
    initializeNewsContentState() {
        const newsContent = document.getElementById('news-content');
        if (newsContent) {
            // 確保頁面初次載入時只顯示分析部分
            newsContent.classList.add('collapse');
        }
    }

    // 顯示初始化錯誤
    showInitializationError(error) {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger mt-4">
                    <h4><i class="fas fa-exclamation-triangle"></i> 應用程式初始化失敗</h4>
                    <p>錯誤訊息：${this.utilities ? this.utilities.escapeHtml(error.message) : error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> 重新載入頁面
                    </button>
                </div>
            `;
        }
    }

    // 設定文章資料（供外部調用）
    setArticlesData(data) {
        if (this.isInitialized && this.stateManager) {
            this.stateManager.setArticlesData(data);
            // 立即觸發頁面重新渲染
            setTimeout(() => {
                this.initializePage();
            }, 100);
            console.log(`App: 設定並重新渲染 ${data.length} 篇文章`);
            return true;
        }
        console.warn('應用程式尚未初始化，無法設定文章資料');
        return false;
    }

    // 取得應用程式狀態
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            articlesCount: this.stateManager?.getState('articlesData')?.length || 0,
            filteredCount: this.stateManager?.getState('filteredArticlesData')?.length || 0,
            currentPage: this.stateManager?.getState('currentPage') || 1
        };
    }

    // 重置應用程式
    reset() {
        if (this.stateManager) {
            this.stateManager.reset();
        }
        this.initializePage();
    }
}

// 創建應用程式實例
const app = new App();

// 導出供全域使用
window.App = app;

// 供向後相容的全域函數
window.setArticlesData = (data) => app.setArticlesData(data);