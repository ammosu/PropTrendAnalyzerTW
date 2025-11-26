/**
 * ErrorHandler.js - 統一錯誤處理機制
 *
 * 集中管理應用程式錯誤，提供錯誤記錄、報告與處理功能
 *
 * @class ErrorHandler
 * @description 全域錯誤處理器，支援錯誤隊列與批量報告
 */
class ErrorHandler {
    /**
     * 建立 ErrorHandler 實例
     * @constructor
     */
    constructor() {
        this.errorQueue = [];
        this.isReporting = false;
        this.maxQueueSize = 100;
        this.securityUtils = null;
        
        this.setupGlobalErrorHandlers();
        this.initializeSecurityUtils();
    }

    // 初始化安全工具
    async initializeSecurityUtils() {
        // 等待 SecurityUtils 載入
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.SecurityUtils && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.SecurityUtils) {
            this.securityUtils = window.SecurityUtils;
            console.log('ErrorHandler: SecurityUtils 已連線');
        } else {
            console.warn('ErrorHandler: SecurityUtils 載入超時，使用基本錯誤處理');
        }
    }

    // 設定全域錯誤處理器
    setupGlobalErrorHandlers() {
        // JavaScript 錯誤處理
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Promise 拒絕處理
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || event.reason?.toString() || 'Unknown promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // 資源載入錯誤處理
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                // 只記錄關鍵資源的載入錯誤，跳過圖片錯誤
                const isImageError = event.target.tagName === 'IMG';
                const isCriticalResource = event.target.tagName === 'SCRIPT' || 
                                         event.target.tagName === 'LINK' ||
                                         (event.target.tagName === 'IMG' && event.target.classList.contains('critical'));
                
                if (isCriticalResource) {
                    this.handleError({
                        type: 'Resource Load Error',
                        message: `Failed to load critical resource: ${event.target.src || event.target.href}`,
                        element: event.target.tagName,
                        timestamp: new Date().toISOString()
                    });
                } else if (!isImageError) {
                    // 非圖片的其他資源錯誤也記錄，但不顯示給用戶
                    this.handleError({
                        type: 'Resource Load Error',
                        message: `Failed to load resource: ${event.target.src || event.target.href}`,
                        element: event.target.tagName,
                        timestamp: new Date().toISOString()
                    }, '', false); // 不顯示給用戶
                }
            }
        }, true);
    }

    // 主要錯誤處理函數
    handleError(errorInfo, context = '', showToUser = true) {
        try {
            // 清理錯誤資訊
            const cleanErrorInfo = this.sanitizeErrorInfo(errorInfo);
            
            // 記錄錯誤
            this.logError(cleanErrorInfo, context);
            
            // 添加到錯誤隊列
            this.addToErrorQueue(cleanErrorInfo);
            
            // 向用戶顯示友好錯誤資訊
            if (showToUser) {
                this.showUserFriendlyError(cleanErrorInfo);
            }
            
            // 可選：報告錯誤到服務器
            this.queueErrorReport(cleanErrorInfo);
            
        } catch (handlerError) {
            // 錯誤處理器本身出錯
            console.error('ErrorHandler 處理錯誤時發生問題:', handlerError);
        }
    }

    // 清理錯誤資訊
    sanitizeErrorInfo(errorInfo) {
        const sanitized = {};
        
        // 基本字段清理
        if (errorInfo.type) {
            sanitized.type = this.sanitizeString(errorInfo.type, 100);
        }
        
        if (errorInfo.message) {
            sanitized.message = this.sanitizeString(errorInfo.message, 500);
        }
        
        if (errorInfo.filename) {
            sanitized.filename = this.sanitizeString(errorInfo.filename, 200);
        }
        
        if (errorInfo.stack) {
            // 清理堆疊追蹤，移除敏感資訊
            sanitized.stack = this.sanitizeStackTrace(errorInfo.stack);
        }
        
        // 添加其他安全字段
        sanitized.timestamp = errorInfo.timestamp || new Date().toISOString();
        sanitized.userAgent = this.sanitizeString(navigator.userAgent, 200);
        sanitized.url = this.sanitizeString(window.location.href, 300);
        
        return sanitized;
    }

    // 清理字符串
    sanitizeString(str, maxLength = 500) {
        if (typeof str !== 'string') {
            return '';
        }
        
        // 移除潛在的敏感資訊
        let cleaned = str
            .replace(/password[=:]\s*[^\s&]+/gi, 'password=[REDACTED]')
            .replace(/token[=:]\s*[^\s&]+/gi, 'token=[REDACTED]')
            .replace(/key[=:]\s*[^\s&]+/gi, 'key=[REDACTED]')
            .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=[REDACTED]');
        
        // 使用 SecurityUtils 進行進一步清理（如果可用）
        if (this.securityUtils) {
            cleaned = this.securityUtils.escapeHtml(cleaned);
        }
        
        // 限制長度
        if (cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength) + '...';
        }
        
        return cleaned;
    }

    // 清理堆疊追蹤
    sanitizeStackTrace(stack) {
        if (typeof stack !== 'string') {
            return '';
        }
        
        // 移除絕對路徑，只保留相對路徑
        return stack
            .replace(/https?:\/\/[^\/]+\//g, '/')
            .replace(/file:\/\/[^\/]+\//g, '/')
            .substring(0, 2000); // 限制堆疊追蹤長度
    }

    // 記錄錯誤
    logError(errorInfo, context) {
        const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
        
        if (context) {
            console.error(`${logMessage} (Context: ${context})`);
        } else {
            console.error(logMessage);
        }
        
        if (errorInfo.stack) {
            console.error('Stack trace:', errorInfo.stack);
        }
    }

    // 添加到錯誤隊列
    addToErrorQueue(errorInfo) {
        this.errorQueue.push(errorInfo);
        
        // 限制隊列大小
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    // 向用戶顯示友好錯誤資訊
    showUserFriendlyError(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        this.showErrorToast(userMessage, 'error');
    }

    // 取得用戶友好的錯誤資訊
    getUserFriendlyMessage(errorInfo) {
        const errorTypeMap = {
            'NetworkError': '網路連線發生問題，請檢查網路設定後重試',
            'QuotaExceededError': '儲存空間不足，請清理瀏覽器資料後重試',
            'SecurityError': '安全性限制，請確保使用 HTTPS 連線',
            'TypeError': '資料格式錯誤，請檢查輸入內容',
            'ReferenceError': '功能載入失敗，請重新整理頁面',
            'Resource Load Error': '資源載入失敗，請重新整理頁面',
            'Unhandled Promise Rejection': '操作失敗，請稍後再試'
        };
        
        // 檢查錯誤類型
        for (const [errorType, message] of Object.entries(errorTypeMap)) {
            if (errorInfo.type?.includes(errorType) || errorInfo.message?.includes(errorType)) {
                return message;
            }
        }
        
        // 檢查特定錯誤模式
        if (errorInfo.message?.includes('fetch')) {
            return '網路請求失敗，請檢查網路連線';
        }
        
        if (errorInfo.message?.includes('parse') || errorInfo.message?.includes('JSON')) {
            return '資料解析失敗，請檢查檔案格式';
        }
        
        if (errorInfo.message?.includes('permission') || errorInfo.message?.includes('denied')) {
            return '權限不足，請檢查瀏覽器設定';
        }
        
        // 預設錯誤資訊
        return '發生未預期的錯誤，請稍後再試或重新整理頁面';
    }

    // 顯示錯誤提示
    showErrorToast(message, type = 'error') {
        // 移除現有的錯誤提示
        const existingToasts = document.querySelectorAll('.error-toast');
        existingToasts.forEach(toast => toast.remove());
        
        // 創建新的錯誤提示
        const toast = document.createElement('div');
        toast.className = `error-toast alert alert-${type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const icon = document.createElement('i');
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-exclamation-triangle';
        
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'close';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => toast.remove();
        
        toast.appendChild(icon);
        toast.appendChild(document.createTextNode(' ' + message));
        toast.appendChild(closeButton);
        
        document.body.appendChild(toast);
        
        // 自動移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 8000);
    }

    // 隊列錯誤報告（可選功能）
    queueErrorReport(errorInfo) {
        // 這裡可以實現向服務器報告錯誤的邏輯
        // 例如：發送到錯誤追蹤服務
        if (this.shouldReportError(errorInfo)) {
            console.log('錯誤已記錄供後續分析:', {
                type: errorInfo.type,
                message: errorInfo.message,
                timestamp: errorInfo.timestamp
            });
        }
    }

    // 判斷是否應該報告錯誤
    shouldReportError(errorInfo) {
        // 避免報告重複錯誤
        const isDuplicate = this.errorQueue.some((error, index) => 
            index < this.errorQueue.length - 1 && 
            error.message === errorInfo.message &&
            error.type === errorInfo.type
        );
        
        return !isDuplicate;
    }

    // 取得錯誤統計
    getErrorStats() {
        const stats = {
            totalErrors: this.errorQueue.length,
            errorTypes: {},
            recentErrors: this.errorQueue.slice(-10)
        };
        
        this.errorQueue.forEach(error => {
            stats.errorTypes[error.type] = (stats.errorTypes[error.type] || 0) + 1;
        });
        
        return stats;
    }

    // 清理錯誤隊列
    clearErrorQueue() {
        this.errorQueue = [];
        console.log('錯誤隊列已清理');
    }
}

// 創建全域實例
const errorHandler = new ErrorHandler();

// 導出供其他模組使用
window.ErrorHandler = errorHandler;

// 提供便利方法
window.reportError = (error, context) => {
    errorHandler.handleError({
        type: 'Manual Report',
        message: error.message || error.toString(),
        stack: error.stack,
        timestamp: new Date().toISOString()
    }, context);
};

console.log('ErrorHandler 已初始化');