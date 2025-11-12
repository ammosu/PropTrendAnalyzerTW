// Utilities.js - 工具函數模組
class Utilities {
    constructor() {}

    // 防抖動函數 - 優化性能
    debounce(func, wait) {
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

    // 節流函數
    throttle(func, wait) {
        let timeout;
        let previous = 0;
        
        return function() {
            const context = this;
            const args = arguments;
            const now = Date.now();
            
            if (now - previous > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                func.apply(context, args);
                previous = now;
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    func.apply(context, args);
                    previous = Date.now();
                }, wait - (now - previous));
            }
        };
    }

    // 深拷貝函數
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
        return obj;
    }

    // 轉義 HTML 以防止 XSS 攻擊
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 格式化日期
    formatDate(dateString) {
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

    // 格式化月份顯示
    formatMonthDisplay(yearMonth) {
        if (!yearMonth) return '';
        
        try {
            const [year, month] = yearMonth.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long'
            });
        } catch (e) {
            return yearMonth;
        }
    }

    // 格式化文章內容
    formatArticleContent(content) {
        if (!content) return '';
        // 先轉義 HTML，然後替換換行符
        const escaped = this.escapeHtml(content);
        return escaped.replace(/_x000D_/g, '<br>').replace(/\r\n|\n/g, '<br>');
    }

    // 獲取月份範圍
    getMonthRange(articles) {
        if (!articles || articles.length === 0) {
            return [];
        }
        
        // 過濾無效日期
        const validArticles = articles.filter(article => 
            article.date && !isNaN(new Date(article.date).getTime())
        );
        
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

    // 驗證日期格式
    isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    // 驗證電子郵件格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 驗證 URL 格式
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // 截斷文字並加省略號
    truncateText(text, maxLength, ellipsis = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + ellipsis;
    }

    // 移除 HTML 標籤
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // 計算陣列的平均值
    average(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        const sum = numbers.reduce((acc, num) => acc + (parseFloat(num) || 0), 0);
        return sum / numbers.length;
    }

    // 計算陣列的總和
    sum(numbers) {
        if (!Array.isArray(numbers)) return 0;
        return numbers.reduce((acc, num) => acc + (parseFloat(num) || 0), 0);
    }

    // 獲取陣列中的最大值
    max(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return null;
        return Math.max(...numbers.map(num => parseFloat(num) || 0));
    }

    // 獲取陣列中的最小值
    min(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return null;
        return Math.min(...numbers.map(num => parseFloat(num) || 0));
    }

    // 隨機生成指定長度的字串
    generateRandomString(length = 10) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // 格式化檔案大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 檢查是否為行動裝置
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 檢查是否支援本地儲存
    isLocalStorageSupported() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    // 安全的本地儲存設定
    setLocalStorage(key, value) {
        if (!this.isLocalStorageSupported()) return false;
        
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('設定本地儲存失敗:', error);
            return false;
        }
    }

    // 安全的本地儲存讀取
    getLocalStorage(key, defaultValue = null) {
        if (!this.isLocalStorageSupported()) return defaultValue;
        
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('讀取本地儲存失敗:', error);
            return defaultValue;
        }
    }

    // 移除本地儲存項目
    removeLocalStorage(key) {
        if (!this.isLocalStorageSupported()) return false;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('移除本地儲存失敗:', error);
            return false;
        }
    }

    // 顏色轉換：十六進位轉 RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // 顏色轉換：RGB 轉十六進位
    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    // 等待指定時間
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 重試機制
    async retry(fn, maxAttempts = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`嘗試 ${attempt}/${maxAttempts} 失敗:`, error.message);
                
                if (attempt < maxAttempts) {
                    await this.sleep(delay * attempt);
                }
            }
        }
        
        throw lastError;
    }
}

// 創建單例實例
const utilities = new Utilities();

// 導出供其他模組使用
window.Utilities = utilities;