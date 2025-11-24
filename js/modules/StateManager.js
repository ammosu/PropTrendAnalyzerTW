// StateManager.js - 狀態管理模組
class StateManager {
    constructor() {
        const constants = window.Constants;

        this.state = {
            articlesData: [],
            filteredArticlesData: [],
            currentPage: constants.STATE.INITIAL_PAGE,
            articlesPerPage: constants.PAGINATION.ARTICLES_PER_PAGE,
            trendChart: null,
            expectedTrendChart: null,
            currentChartType: constants.STATE.DEFAULT_CHART_TYPE,
            chartAnimationDuration: constants.STATE.DEFAULT_ANIMATION_DURATION,
            savedMonthSliderState: null
        };

        this.subscribers = [];
    }

    // 訂閱狀態變化
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    // 通知所有訂閱者
    notify(stateKey, newValue, oldValue) {
        this.subscribers.forEach(callback => {
            callback(stateKey, newValue, oldValue);
        });
    }

    // 更新狀態
    updateState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }

    // 取得狀態
    getState(key) {
        return key ? this.state[key] : this.state;
    }

    // 設定文章資料
    setArticlesData(data) {
        this.updateState('articlesData', [...data]);
        this.updateState('filteredArticlesData', [...data]);
        console.log(`StateManager: 設定 ${data.length} 篇文章`);
    }

    // 設定過濾後的文章資料
    setFilteredArticles(data) {
        this.updateState('filteredArticlesData', [...data]);
    }

    // 設定當前頁碼
    setCurrentPage(page) {
        this.updateState('currentPage', page);
    }

    // 設定圖表實例
    setTrendChart(chart) {
        this.updateState('trendChart', chart);
    }

    setExpectedTrendChart(chart) {
        this.updateState('expectedTrendChart', chart);
    }

    // 切換圖表類型
    toggleChartType() {
        const currentType = this.state.currentChartType;
        const newType = currentType === 'bar' ? 'line' : 'bar';
        this.updateState('currentChartType', newType);
        return newType;
    }

    // 儲存月份滑桿狀態
    saveMonthSliderState(value, month) {
        this.updateState('savedMonthSliderState', { value, month });
    }

    // 重置狀態
    reset() {
        this.state = {
            articlesData: [],
            filteredArticlesData: [],
            currentPage: 1,
            articlesPerPage: 6,
            trendChart: null,
            expectedTrendChart: null,
            currentChartType: 'bar',
            chartAnimationDuration: 800,
            savedMonthSliderState: null
        };
        this.notify('reset', this.state, null);
    }
}

// 創建單例實例
const stateManager = new StateManager();

// 導出供其他模組使用
window.StateManager = stateManager;