// Constants.js - 全域常量定義
const Constants = {
    // 分頁相關
    PAGINATION: {
        ARTICLES_PER_PAGE: 6,          // 每頁顯示的文章數量
        MAX_VISIBLE_PAGES: 5,          // 分頁控制項最多顯示的頁碼數量
    },

    // 圖表相關
    CHART: {
        ANIMATION_DURATION: 800,       // 圖表動畫持續時間 (毫秒)
        TOP_KEYWORDS_COUNT: 10,        // 關鍵詞趨勢圖顯示的關鍵詞數量
        DEFAULT_TYPE: 'bar',           // 預設圖表類型
    },

    // 快取相關
    CACHE: {
        MAX_SIZE: 50,                  // 快取最大容量
        FILTER_TTL: 5 * 60 * 1000,     // 篩選快取過期時間 (5 分鐘)
        CLEANUP_INTERVAL: 5 * 60 * 1000, // 自動清理間隔 (5 分鐘)
    },

    // 錯誤處理相關
    ERROR: {
        MAX_QUEUE_SIZE: 100,           // 錯誤隊列最大容量
        RETENTION_TIME: 3600000,       // 錯誤保留時間 (1 小時)
    },

    // UI 相關
    UI: {
        LOADING_MIN_DURATION: 300,     // 最小載入顯示時間 (毫秒)
        DEBOUNCE_DELAY: 500,           // 輸入防抖延遲 (毫秒)
        DATE_FILTER_DEBOUNCE: 300,     // 日期篩選防抖延遲 (毫秒)
        FADE_DURATION: 500,            // 淡入淡出動畫時間 (毫秒)
        ERROR_MESSAGE_DURATION: 3000,  // 錯誤訊息顯示時間 (毫秒)
    },

    // 顏色相關
    COLORS: {
        // 預設調色盤 (用於 SVG 圖片生成)
        PALETTE: [
            '#3498db',  // 藍色
            '#e74c3c',  // 紅色
            '#2ecc71',  // 綠色
            '#f39c12',  // 橙色
            '#9b59b6',  // 紫色
            '#1abc9c',  // 青色
            '#34495e'   // 深灰色
        ],

        // 趨勢標籤顏色
        TREND: {
            UP: '#28a745',              // 上漲 (綠色)
            DOWN: '#dc3545',            // 下跌 (紅色)
            STABLE: '#17a2b8',          // 平穩 (藍色)
            UNRELATED: '#6c757d',       // 無相關 (灰色)
            UNKNOWN: '#ffc107',         // 無法判斷 (黃色)
        },
    },

    // 滑桿寬度配置 (根據月份數量)
    SLIDER: {
        WIDTH_BY_MONTH_COUNT: [
            { maxMonths: 3, width: '30%' },
            { maxMonths: 6, width: '45%' },
            { maxMonths: 12, width: '60%' },
            { maxMonths: 24, width: '75%' },
            { maxMonths: Infinity, width: '85%' },
        ],
    },

    // 文字截斷長度
    TEXT: {
        SUMMARY_MAX_LENGTH: 100,       // 摘要最大長度
        TITLE_MAX_LENGTH: 50,          // 標題最大長度 (SVG)
        MAX_LINE_LENGTH: 2000,         // 單行最大字元數
    },

    // Bootstrap CSS 類別
    CSS_CLASSES: {
        ARTICLE_CARD_COLUMN: 'col-md-4 mb-4',
        BADGE_SUCCESS: 'badge-success',
        BADGE_DANGER: 'badge-danger',
        BADGE_INFO: 'badge-info',
        BADGE_SECONDARY: 'badge-secondary',
        BADGE_WARNING: 'badge-warning',
        BADGE_PRIMARY: 'badge-primary',
    },

    // API 端點 (預留給未來使用)
    API: {
        DATA_FILES: '/api/data-files',
    },

    // 狀態管理初始值
    STATE: {
        INITIAL_PAGE: 1,
        DEFAULT_CHART_TYPE: 'bar',
        DEFAULT_ANIMATION_DURATION: 800,
    },

    // 驗證規則
    VALIDATION: {
        MAX_FILE_SIZE: 100 * 1024 * 1024,  // 100MB
        ALLOWED_FILE_TYPES: ['.csv'],
        MIN_KEYWORD_LENGTH: 1,
        MAX_KEYWORD_LENGTH: 50,
    },

    // 正則表達式
    REGEX: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        URL: /^https?:\/\/.+/,
        DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
    },

    // 預期市場趨勢選項
    MARKET_TRENDS: {
        UP: '上漲',
        DOWN: '下跌',
        STABLE: '平穩',
        UNRELATED: '無相關',
        UNKNOWN: '無法判斷',
    },
};

// 凍結物件，防止意外修改
Object.freeze(Constants);
Object.freeze(Constants.PAGINATION);
Object.freeze(Constants.CHART);
Object.freeze(Constants.CACHE);
Object.freeze(Constants.ERROR);
Object.freeze(Constants.UI);
Object.freeze(Constants.COLORS);
Object.freeze(Constants.COLORS.PALETTE);
Object.freeze(Constants.COLORS.TREND);
Object.freeze(Constants.SLIDER);
Object.freeze(Constants.TEXT);
Object.freeze(Constants.CSS_CLASSES);
Object.freeze(Constants.API);
Object.freeze(Constants.STATE);
Object.freeze(Constants.VALIDATION);
Object.freeze(Constants.REGEX);
Object.freeze(Constants.MARKET_TRENDS);

// 導出供其他模組使用
window.Constants = Constants;
