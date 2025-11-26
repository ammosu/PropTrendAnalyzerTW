/**
 * StateManager.js - 狀態管理模組
 *
 * 採用觀察者模式管理應用程式全域狀態，提供狀態訂閱與通知機制
 *
 * @class StateManager
 * @description 集中管理應用程式狀態，包括文章資料、分頁、圖表實例等
 */
class StateManager {
    /**
     * 建立 StateManager 實例
     * @constructor
     * @description 初始化狀態物件與訂閱者列表，從 Constants 載入預設值
     */
    constructor() {
        const constants = window.Constants;

        /**
         * 應用程式狀態物件
         * @type {Object}
         * @property {Array} articlesData - 所有文章資料
         * @property {Array} filteredArticlesData - 過濾後的文章資料
         * @property {number} currentPage - 當前頁碼
         * @property {number} articlesPerPage - 每頁文章數量
         * @property {Chart|null} trendChart - 關鍵詞趨勢圖表實例
         * @property {Chart|null} expectedTrendChart - 市場趨勢圖表實例
         * @property {string} currentChartType - 當前圖表類型 ('bar' | 'line')
         * @property {number} chartAnimationDuration - 圖表動畫持續時間（毫秒）
         * @property {Object|null} savedMonthSliderState - 儲存的月份滑桿狀態
         */
        this.state = {
            articlesData: [],
            filteredArticlesData: [],
            currentPage: constants.STATE.INITIAL_PAGE,
            articlesPerPage: constants.PAGINATION.ARTICLES_PER_PAGE,
            trendChart: null,
            expectedTrendChart: null,
            currentChartType: constants.STATE.DEFAULT_CHART_TYPE,
            chartAnimationDuration: constants.STATE.DEFAULT_ANIMATION_DURATION,
            savedMonthSliderState: null,
            viewMode: 'card', // 'card' 或 'list'
            darkMode: false // 深色模式狀態
        };

        /**
         * 狀態變化訂閱者列表
         * @type {Array<Function>}
         */
        this.subscribers = [];
    }

    /**
     * 訂閱狀態變化
     * @param {Function} callback - 狀態變化時的回調函數
     * @description 當狀態更新時，回調函數會被呼叫並傳入 (stateKey, newValue, oldValue)
     * @example
     * stateManager.subscribe((key, newValue, oldValue) => {
     *   console.log(`${key} 從 ${oldValue} 變更為 ${newValue}`);
     * });
     */
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    /**
     * 通知所有訂閱者狀態已變更
     * @param {string} stateKey - 變更的狀態鍵名
     * @param {*} newValue - 新的狀態值
     * @param {*} oldValue - 舊的狀態值
     * @private
     */
    notify(stateKey, newValue, oldValue) {
        this.subscribers.forEach(callback => {
            callback(stateKey, newValue, oldValue);
        });
    }

    /**
     * 更新狀態並通知訂閱者
     * @param {string} key - 要更新的狀態鍵名
     * @param {*} value - 新的狀態值
     * @description 更新指定的狀態，並通知所有訂閱者
     */
    updateState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }

    /**
     * 取得狀態值
     * @param {string} [key] - 狀態鍵名（選填）
     * @returns {*} 指定的狀態值，或整個狀態物件（若未提供 key）
     * @example
     * const page = stateManager.getState('currentPage'); // 取得當前頁碼
     * const allState = stateManager.getState(); // 取得所有狀態
     */
    getState(key) {
        return key ? this.state[key] : this.state;
    }

    /**
     * 設定文章資料
     * @param {Array<Object>} data - 文章資料陣列
     * @description 設定原始文章資料與過濾後的文章資料（初始時兩者相同）
     * @example
     * stateManager.setArticlesData([
     *   { id: 1, title: '房市新聞', date: '2024-01-15', ... }
     * ]);
     */
    setArticlesData(data) {
        this.updateState('articlesData', [...data]);
        this.updateState('filteredArticlesData', [...data]);
        console.log(`StateManager: 設定 ${data.length} 篇文章`);
    }

    /**
     * 設定過濾後的文章資料
     * @param {Array<Object>} data - 過濾後的文章資料陣列
     * @description 更新過濾結果，不影響原始文章資料
     */
    setFilteredArticles(data) {
        this.updateState('filteredArticlesData', [...data]);
    }

    /**
     * 設定當前頁碼
     * @param {number} page - 頁碼（從 1 開始）
     */
    setCurrentPage(page) {
        this.updateState('currentPage', page);
    }

    /**
     * 設定關鍵詞趨勢圖表實例
     * @param {Chart} chart - Chart.js 圖表實例
     */
    setTrendChart(chart) {
        this.updateState('trendChart', chart);
    }

    /**
     * 設定市場趨勢圖表實例
     * @param {Chart} chart - Chart.js 圖表實例
     */
    setExpectedTrendChart(chart) {
        this.updateState('expectedTrendChart', chart);
    }

    /**
     * 切換圖表類型
     * @returns {string} 新的圖表類型 ('bar' | 'line')
     * @description 在長條圖與折線圖之間切換
     * @example
     * const newType = stateManager.toggleChartType(); // 'bar' <-> 'line'
     */
    toggleChartType() {
        const currentType = this.state.currentChartType;
        const newType = currentType === 'bar' ? 'line' : 'bar';
        this.updateState('currentChartType', newType);
        return newType;
    }

    /**
     * 儲存月份滑桿狀態
     * @param {number} value - 滑桿值（索引）
     * @param {string} month - 月份字串（如 '2024-01'）
     * @description 用於在切換圖表時保存與恢復滑桿位置
     */
    saveMonthSliderState(value, month) {
        this.updateState('savedMonthSliderState', { value, month });
    }

    /**
     * 設定檢視模式
     * @param {string} mode - 檢視模式 ('card' | 'list')
     * @description 切換文章顯示為卡片檢視或列表檢視
     */
    setViewMode(mode) {
        if (mode === 'card' || mode === 'list') {
            this.updateState('viewMode', mode);
            // 儲存到 localStorage
            try {
                localStorage.setItem('viewMode', mode);
            } catch (e) {
                console.warn('無法儲存檢視模式偏好:', e);
            }
        }
    }

    /**
     * 重置所有狀態為初始值
     * @description 清空所有文章資料、圖表實例，恢復預設設定
     */
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
            savedMonthSliderState: null,
            viewMode: 'card'
        };
        this.notify('reset', this.state, null);
    }
}

// 創建單例實例
const stateManager = new StateManager();

// 導出供其他模組使用
window.StateManager = stateManager;