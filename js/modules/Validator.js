// Validator.js - 輸入驗證模組
class Validator {
    constructor() {
        this.constants = window.Constants;
    }

    // ==================== 通用驗證方法 ====================

    /**
     * 驗證值是否存在且非空
     * @param {*} value - 要驗證的值
     * @returns {boolean}
     */
    isRequired(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    }

    /**
     * 驗證值是否為指定類型
     * @param {*} value - 要驗證的值
     * @param {string} type - 期望的類型（'string', 'number', 'boolean', 'array', 'object'）
     * @returns {boolean}
     */
    isType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return false;
        }
    }

    // ==================== 數字驗證 ====================

    /**
     * 驗證是否為有效數字
     * @param {*} value - 要驗證的值
     * @returns {boolean}
     */
    isNumber(value) {
        if (typeof value === 'number') return !isNaN(value) && isFinite(value);
        if (typeof value === 'string') {
            const num = parseFloat(value);
            return !isNaN(num) && isFinite(num);
        }
        return false;
    }

    /**
     * 驗證是否為整數
     * @param {*} value - 要驗證的值
     * @returns {boolean}
     */
    isInteger(value) {
        if (!this.isNumber(value)) return false;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return Number.isInteger(num);
    }

    /**
     * 驗證數字是否在指定範圍內
     * @param {number} value - 要驗證的數字
     * @param {number} min - 最小值（包含）
     * @param {number} max - 最大值（包含）
     * @returns {boolean}
     */
    isInRange(value, min, max) {
        if (!this.isNumber(value)) return false;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num >= min && num <= max;
    }

    /**
     * 驗證是否為正數
     * @param {*} value - 要驗證的值
     * @returns {boolean}
     */
    isPositive(value) {
        return this.isNumber(value) && parseFloat(value) > 0;
    }

    /**
     * 驗證是否為非負數
     * @param {*} value - 要驗證的值
     * @returns {boolean}
     */
    isNonNegative(value) {
        return this.isNumber(value) && parseFloat(value) >= 0;
    }

    // ==================== 字串驗證 ====================

    /**
     * 驗證字串長度是否在指定範圍內
     * @param {string} value - 要驗證的字串
     * @param {number} min - 最小長度
     * @param {number} max - 最大長度
     * @returns {boolean}
     */
    isLengthInRange(value, min, max) {
        if (typeof value !== 'string') return false;
        return value.length >= min && value.length <= max;
    }

    /**
     * 驗證字串是否符合正則表達式
     * @param {string} value - 要驗證的字串
     * @param {RegExp} pattern - 正則表達式
     * @returns {boolean}
     */
    matchesPattern(value, pattern) {
        if (typeof value !== 'string') return false;
        return pattern.test(value);
    }

    /**
     * 驗證字串是否不含危險字符
     * @param {string} value - 要驗證的字串
     * @returns {boolean}
     */
    isSafeString(value) {
        if (typeof value !== 'string') return false;

        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe\b/i,
            /<object\b/i,
            /<embed\b/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(value));
    }

    // ==================== 日期驗證 ====================

    /**
     * 驗證是否為有效日期
     * @param {*} value - 要驗證的值
     * @returns {boolean}
     */
    isValidDate(value) {
        if (!value) return false;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * 驗證日期格式是否為 YYYY-MM-DD
     * @param {string} value - 要驗證的日期字串
     * @returns {boolean}
     */
    isDateFormat(value) {
        if (typeof value !== 'string') return false;
        if (!this.constants) return /^\d{4}-\d{2}-\d{2}$/.test(value);
        return this.constants.REGEX.DATE_FORMAT.test(value);
    }

    /**
     * 驗證日期是否在指定範圍內
     * @param {string|Date} value - 要驗證的日期
     * @param {string|Date} start - 開始日期
     * @param {string|Date} end - 結束日期
     * @returns {boolean}
     */
    isDateInRange(value, start, end) {
        if (!this.isValidDate(value)) return false;

        const date = new Date(value);
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;

        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;

        return true;
    }

    // ==================== URL 驗證 ====================

    /**
     * 驗證是否為有效 URL
     * @param {string} value - 要驗證的 URL
     * @returns {boolean}
     */
    isValidUrl(value) {
        if (typeof value !== 'string') return false;

        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * 驗證是否符合 URL 正則表達式
     * @param {string} value - 要驗證的 URL
     * @returns {boolean}
     */
    isUrlPattern(value) {
        if (typeof value !== 'string') return false;
        if (!this.constants) return /^https?:\/\/.+/.test(value);
        return this.constants.REGEX.URL.test(value);
    }

    // ==================== Email 驗證 ====================

    /**
     * 驗證是否為有效 Email
     * @param {string} value - 要驗證的 Email
     * @returns {boolean}
     */
    isValidEmail(value) {
        if (typeof value !== 'string') return false;
        if (!this.constants) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        return this.constants.REGEX.EMAIL.test(value);
    }

    // ==================== 檔案驗證 ====================

    /**
     * 驗證檔案大小是否在限制內
     * @param {File} file - 要驗證的檔案
     * @param {number} maxSize - 最大檔案大小（bytes）
     * @returns {Object} { valid: boolean, error: string }
     */
    validateFileSize(file, maxSize = null) {
        if (!file) {
            return { valid: false, error: '未提供檔案' };
        }

        const limit = maxSize || (this.constants ? this.constants.VALIDATION.MAX_FILE_SIZE : 100 * 1024 * 1024);

        if (limit > 0 && file.size > limit) {
            return {
                valid: false,
                error: `檔案大小超過限制 (${(limit / 1024 / 1024).toFixed(1)}MB)`
            };
        }

        return { valid: true, error: null };
    }

    /**
     * 驗證檔案類型是否允許
     * @param {File} file - 要驗證的檔案
     * @param {Array<string>} allowedTypes - 允許的檔案類型陣列
     * @returns {Object} { valid: boolean, error: string }
     */
    validateFileType(file, allowedTypes = null) {
        if (!file) {
            return { valid: false, error: '未提供檔案' };
        }

        const allowed = allowedTypes || (this.constants ? this.constants.VALIDATION.ALLOWED_FILE_TYPES : ['.csv']);
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowed.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
            return {
                valid: false,
                error: `只允許上傳 ${allowed.join(', ')} 格式的檔案`
            };
        }

        return { valid: true, error: null };
    }

    /**
     * 完整的檔案驗證（大小 + 類型）
     * @param {File} file - 要驗證的檔案
     * @param {Object} options - 選項 { maxSize, allowedTypes }
     * @returns {Object} { valid: boolean, error: string }
     */
    validateFile(file, options = {}) {
        // 驗證檔案大小
        const sizeResult = this.validateFileSize(file, options.maxSize);
        if (!sizeResult.valid) return sizeResult;

        // 驗證檔案類型
        const typeResult = this.validateFileType(file, options.allowedTypes);
        if (!typeResult.valid) return typeResult;

        return { valid: true, error: null };
    }

    // ==================== 關鍵詞驗證 ====================

    /**
     * 驗證關鍵詞
     * @param {string} keyword - 要驗證的關鍵詞
     * @returns {Object} { valid: boolean, error: string }
     */
    validateKeyword(keyword) {
        if (!keyword || typeof keyword !== 'string') {
            return { valid: false, error: '關鍵詞必須是字串' };
        }

        const trimmed = keyword.trim();
        const minLen = this.constants ? this.constants.VALIDATION.MIN_KEYWORD_LENGTH : 1;
        const maxLen = this.constants ? this.constants.VALIDATION.MAX_KEYWORD_LENGTH : 50;

        if (trimmed.length < minLen) {
            return { valid: false, error: `關鍵詞長度至少需要 ${minLen} 個字元` };
        }

        if (trimmed.length > maxLen) {
            return { valid: false, error: `關鍵詞長度不能超過 ${maxLen} 個字元` };
        }

        // 檢查是否含有危險字符
        if (!this.isSafeString(trimmed)) {
            return { valid: false, error: '關鍵詞包含不安全的字元' };
        }

        return { valid: true, error: null, value: trimmed };
    }

    // ==================== 分頁驗證 ====================

    /**
     * 驗證頁碼
     * @param {*} pageNumber - 要驗證的頁碼
     * @param {number} maxPage - 最大頁碼
     * @returns {Object} { valid: boolean, error: string, value: number }
     */
    validatePageNumber(pageNumber, maxPage) {
        // 檢查是否為數字
        if (!this.isNumber(pageNumber)) {
            return { valid: false, error: '頁碼必須是數字', value: null };
        }

        const page = typeof pageNumber === 'string' ? parseInt(pageNumber, 10) : pageNumber;

        // 檢查是否為整數
        if (!Number.isInteger(page)) {
            return { valid: false, error: '頁碼必須是整數', value: null };
        }

        // 檢查範圍
        if (page < 1) {
            return { valid: false, error: '頁碼不能小於 1', value: null };
        }

        if (maxPage && page > maxPage) {
            return { valid: false, error: `頁碼不能超過 ${maxPage}`, value: null };
        }

        return { valid: true, error: null, value: page };
    }

    // ==================== 文章數據驗證 ====================

    /**
     * 驗證文章標題
     * @param {string} title - 文章標題
     * @returns {Object} { valid: boolean, error: string }
     */
    validateArticleTitle(title) {
        if (!this.isRequired(title)) {
            return { valid: false, error: '文章標題不能為空' };
        }

        if (!this.isLengthInRange(title, 1, 200)) {
            return { valid: false, error: '文章標題長度應在 1-200 字元之間' };
        }

        if (!this.isSafeString(title)) {
            return { valid: false, error: '文章標題包含不安全的字元' };
        }

        return { valid: true, error: null };
    }

    /**
     * 驗證文章內容
     * @param {string} content - 文章內容
     * @param {number} maxLength - 最大長度
     * @returns {Object} { valid: boolean, error: string }
     */
    validateArticleContent(content, maxLength = 10000) {
        if (!content || typeof content !== 'string') {
            return { valid: false, error: '文章內容必須是字串' };
        }

        if (content.length > maxLength) {
            return { valid: false, error: `文章內容長度不能超過 ${maxLength} 字元` };
        }

        return { valid: true, error: null };
    }

    /**
     * 驗證市場趨勢
     * @param {string} trend - 市場趨勢
     * @returns {Object} { valid: boolean, error: string }
     */
    validateMarketTrend(trend) {
        if (!trend || typeof trend !== 'string') {
            return { valid: false, error: '市場趨勢必須是字串' };
        }

        const validTrends = this.constants
            ? Object.values(this.constants.MARKET_TRENDS)
            : ['上漲', '下跌', '平穩', '無相關', '無法判斷'];

        if (!validTrends.includes(trend)) {
            return { valid: false, error: `無效的市場趨勢：${trend}` };
        }

        return { valid: true, error: null };
    }

    /**
     * 驗證完整的文章對象
     * @param {Object} article - 文章對象
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validateArticle(article) {
        const errors = [];

        // 驗證標題
        const titleResult = this.validateArticleTitle(article.title);
        if (!titleResult.valid) errors.push(titleResult.error);

        // 驗證日期
        if (article.date && !this.isValidDate(article.date)) {
            errors.push('無效的文章日期');
        }

        // 驗證 URL（如果存在）
        if (article.url && !this.isValidUrl(article.url)) {
            errors.push('無效的文章 URL');
        }

        // 驗證市場趨勢（如果存在）
        if (article.expectedMarketTrend) {
            const trendResult = this.validateMarketTrend(article.expectedMarketTrend);
            if (!trendResult.valid) errors.push(trendResult.error);
        }

        // 驗證關鍵詞（如果存在）
        if (article.keywords && Array.isArray(article.keywords)) {
            article.keywords.forEach((keyword, index) => {
                const keywordResult = this.validateKeyword(keyword);
                if (!keywordResult.valid) {
                    errors.push(`關鍵詞 ${index + 1}: ${keywordResult.error}`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // ==================== 批量驗證 ====================

    /**
     * 批量驗證多個規則
     * @param {*} value - 要驗證的值
     * @param {Array<Object>} rules - 規則陣列 [{ method: 'isRequired' }, { method: 'isEmail' }]
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validateWithRules(value, rules) {
        const errors = [];

        for (const rule of rules) {
            const method = rule.method;
            const args = rule.args || [];

            if (typeof this[method] !== 'function') {
                console.warn(`驗證方法不存在: ${method}`);
                continue;
            }

            const result = this[method](value, ...args);

            // 如果結果是物件（包含 valid 和 error）
            if (typeof result === 'object' && result.hasOwnProperty('valid')) {
                if (!result.valid) {
                    errors.push(result.error || rule.message || `驗證失敗: ${method}`);
                }
            }
            // 如果結果是布林值
            else if (typeof result === 'boolean') {
                if (!result) {
                    errors.push(rule.message || `驗證失敗: ${method}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// 創建單例實例
const validator = new Validator();

// 導出供其他模組使用
window.Validator = validator;
