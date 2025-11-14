// SecurityUtils.js - 安全性工具模組
class SecurityUtils {
    constructor() {
        this.ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];
        this.ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:'];
        this.MAX_STRING_LENGTH = 1000;
    }

    /**
     * 增強的 HTML 轉義函數
     * @param {string} str - 要轉義的字符串
     * @returns {string} - 轉義後的安全字符串
     */
    escapeHtml(str) {
        if (typeof str !== 'string') {
            return '';
        }
        
        if (str.length > this.MAX_STRING_LENGTH) {
            console.warn('字符串長度超過安全限制，將被截斷');
            str = str.substring(0, this.MAX_STRING_LENGTH);
        }

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 清理和驗證 HTML 內容
     * @param {string} html - 要清理的 HTML
     * @returns {string} - 清理後的安全 HTML
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') {
            return '';
        }

        // 創建臨時 DOM 元素來解析 HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // 遞迴清理所有節點
        this._sanitizeNode(temp);

        return temp.innerHTML;
    }

    /**
     * 遞迴清理 DOM 節點
     * @private
     */
    _sanitizeNode(node) {
        const nodesToRemove = [];

        // 檢查所有子節點
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];

            if (child.nodeType === Node.ELEMENT_NODE) {
                // 檢查標籤是否允許
                if (!this.ALLOWED_HTML_TAGS.includes(child.tagName.toLowerCase())) {
                    // 保留文字內容，移除標籤
                    const textNode = document.createTextNode(child.textContent);
                    node.insertBefore(textNode, child);
                    nodesToRemove.push(child);
                    continue;
                }

                // 移除所有屬性（防止事件處理器和樣式注入）
                const attributes = Array.from(child.attributes);
                attributes.forEach(attr => {
                    child.removeAttribute(attr.name);
                });

                // 遞迴處理子節點
                this._sanitizeNode(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
                // 檢查文字節點是否包含潛在的腳本
                if (this._containsScript(child.textContent)) {
                    child.textContent = this.escapeHtml(child.textContent);
                }
            } else {
                // 移除其他類型的節點（如註釋、CDATA等）
                nodesToRemove.push(child);
            }
        }

        // 移除標記為刪除的節點
        nodesToRemove.forEach(node => node.remove());
    }

    /**
     * 檢查文字是否包含腳本內容
     * @private
     */
    _containsScript(text) {
        const scriptPatterns = [
            /javascript:/i,
            /on\w+\s*=/i,
            /<script/i,
            /<\/script/i,
            /data:text\/html/i,
            /data:application\/javascript/i
        ];

        return scriptPatterns.some(pattern => pattern.test(text));
    }

    /**
     * 驗證和清理 URL
     * @param {string} url - 要驗證的 URL
     * @returns {string|null} - 清理後的安全 URL 或 null
     */
    sanitizeUrl(url) {
        if (typeof url !== 'string' || !url.trim()) {
            return null;
        }

        try {
            const parsedUrl = new URL(url.trim());
            
            // 檢查協議是否允許
            if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
                console.warn('不允許的 URL 協議:', parsedUrl.protocol);
                return null;
            }

            // 移除潛在的危險參數
            parsedUrl.searchParams.delete('javascript');
            parsedUrl.searchParams.delete('data');

            return parsedUrl.toString();
        } catch (error) {
            console.warn('無效的 URL 格式:', url);
            return null;
        }
    }

    /**
     * 驗證檔案類型
     * @param {File} file - 要驗證的檔案
     * @returns {boolean} - 檔案是否安全
     */
    validateFileType(file) {
        const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
        const allowedExtensions = ['.csv', '.txt'];

        // 檢查 MIME 類型
        if (!allowedTypes.includes(file.type)) {
            return false;
        }

        // 檢查副檔名
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        return hasValidExtension;
    }

    /**
     * 驗證檔案大小
     * @param {File} file - 要驗證的檔案
     * @param {number} maxSize - 最大大小（位元組）
     * @returns {boolean} - 檔案大小是否符合要求
     */
    validateFileSize(file, maxSize = 10 * 1024 * 1024) { // 預設 10MB
        return file.size <= maxSize;
    }

    /**
     * 檢查檔案內容是否安全
     * @param {string} content - 檔案內容
     * @returns {boolean} - 內容是否安全
     */
    validateFileContent(content) {
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /data:text\/html/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 安全地創建 DOM 元素
     * @param {string} tagName - 標籤名稱
     * @param {Object} attributes - 屬性對象
     * @param {string} textContent - 文字內容
     * @returns {HTMLElement} - 創建的元素
     */
    createSafeElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        
        // 安全地設置屬性
        Object.keys(attributes).forEach(key => {
            const value = attributes[key];
            if (key === 'href' && value) {
                const safeUrl = this.sanitizeUrl(value);
                if (safeUrl) {
                    element.setAttribute(key, safeUrl);
                }
            } else if (typeof value === 'string') {
                element.setAttribute(key, this.escapeHtml(value));
            }
        });

        // 安全地設置文字內容
        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * 安全地更新元素內容
     * @param {HTMLElement} element - 要更新的元素
     * @param {string} content - 新內容
     * @param {boolean} isHTML - 是否為 HTML 內容
     */
    updateElementContent(element, content, isHTML = false) {
        if (!element || typeof content !== 'string') {
            return;
        }

        if (isHTML) {
            element.innerHTML = this.sanitizeHtml(content);
        } else {
            element.textContent = content;
        }
    }

    /**
     * 生成安全的隨機 ID
     * @param {string} prefix - ID 前綴
     * @returns {string} - 安全的隨機 ID
     */
    generateSafeId(prefix = 'safe') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }
}

// 創建全域實例
const securityUtils = new SecurityUtils();

// 導出供其他模組使用
window.SecurityUtils = securityUtils;