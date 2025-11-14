// csv-uploader.js
// 處理 CSV 檔案的上傳和轉換

// 初始化 IndexedDB
const dbName = 'articlesDatabase';
const storeName = 'articlesStore';
let db;

// 打開或創建 IndexedDB 數據庫
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = function(event) {
            console.error('IndexedDB 錯誤:', event.target.error);
            reject('無法打開數據庫');
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('數據庫連接成功');
            resolve(db);
        };
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
                console.log('創建數據存儲');
            }
        };
    });
}

// 保存文章數據到 IndexedDB
function saveArticlesToDB(articles) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // 清除現有數據
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = function() {
            console.log('清除現有數據');
            
            // 批量添加新數據
            let count = 0;
            articles.forEach(article => {
                const request = store.add(article);
                request.onsuccess = function() {
                    count++;
                    if (count === articles.length) {
                        resolve(count);
                    }
                };
                request.onerror = function(event) {
                    console.error('添加文章錯誤:', event.target.error);
                };
            });
        };
        
        clearRequest.onerror = function(event) {
            console.error('清除數據錯誤:', event.target.error);
            reject('清除數據失敗');
        };
        
        transaction.onerror = function(event) {
            console.error('事務錯誤:', event.target.error);
            reject('保存數據失敗');
        };
    });
}

// 從 IndexedDB 獲取所有文章
function getArticlesFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        
        request.onerror = function(event) {
            console.error('獲取數據錯誤:', event.target.error);
            reject('獲取數據失敗');
        };
    });
}

// 清除 IndexedDB 中的所有數據
function clearArticlesDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('數據庫未初始化');
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = function() {
            console.log('數據庫已清空');
            resolve();
        };
        
        request.onerror = function(event) {
            console.error('清除數據庫錯誤:', event.target.error);
            reject('清除數據失敗');
        };
    });
}

// 檢查數據庫中是否有文章
async function hasArticlesInDB() {
    try {
        const articles = await getArticlesFromDB();
        return articles && articles.length > 0;
    } catch (error) {
        console.error('檢查數據庫錯誤:', error);
        return false;
    }
}

// 處理 CSV 數據，轉換為應用程式所需的格式（安全版本）
function processCSVData(csvData) {
    if (!Array.isArray(csvData) || csvData.length === 0) {
        throw new Error('CSV 數據格式無效或為空');
    }
    
    // 檢查記錄數量限制（如果設定了限制）
    if (UPLOAD_CONFIG.maxRecords > 0 && csvData.length > UPLOAD_CONFIG.maxRecords) {
        throw new Error(`記錄數量超過限制 (${UPLOAD_CONFIG.maxRecords})`);
    }
    
    return csvData.map((item, index) => {
        // 處理關鍵詞
        let keywords = [];
        if (item.keywords) {
            try {
                // 嘗試解析關鍵詞字串
                if (item.keywords.startsWith('[') && item.keywords.endsWith(']')) {
                    // 如果是 JSON 格式的陣列
                    const cleanedStr = item.keywords.replace(/'/g, '"'); // 將單引號替換為雙引號以便 JSON 解析
                    keywords = JSON.parse(cleanedStr);
                } else {
                    // 否則按逗號分割
                    keywords = item.keywords.split(',').map(k => k.trim());
                }
            } catch (e) {
                console.warn(`無法解析文章 ${index} 的關鍵詞，嘗試其他方法`);
                // 嘗試使用更寬泛的正則表達式提取關鍵詞
                try {
                    // 先處理特殊字符
                    let cleanKeywords = item.keywords
                        .replace(/'/g, '"')  // 單引號轉雙引號
                        .replace(/'/g, '"')  // 智能單引號轉雙引號
                        .replace(/'/g, '"')  // 另一種智能單引號
                        .replace(/"/g, '"')  // 智能雙引號轉標準雙引號
                        .replace(/"/g, '"'); // 另一種智能雙引號
                    
                    // 如果還是解析失敗，嘗試手動分割
                    if (cleanKeywords.startsWith('[') && cleanKeywords.endsWith(']')) {
                        keywords = JSON.parse(cleanKeywords);
                    } else {
                        // 使用正則表達式提取被引號包圍的內容
                        const matches = item.keywords.match(/["'](.*?)["']/g);
                        if (matches) {
                            keywords = matches.map(m => m.replace(/["']/g, '').trim());
                        } else {
                            // 最後嘗試：按逗號分割
                            keywords = item.keywords.split(',').map(k => k.trim().replace(/^['"]|['"]$/g, ''));
                        }
                    }
                } catch (e2) {
                    console.warn(`文章 ${index} 的關鍵詞處理失敗，使用空陣列`);
                    keywords = [];
                }
            }
        }
        
        // 確定預期市場趨勢
        let expectedMarketTrend = "無法判斷";
        if (item['預期走向']) {
            expectedMarketTrend = item['預期走向'];
        }
        
        // 安全地清理所有字段
        const safeTitle = sanitizeField(item.title || '', 200);
        const safeSummary = sanitizeField(item.summary || '', 500);
        const safePublisher = sanitizeField(item.publisher || '', 100);
        const safeAuthor = sanitizeField(item.author || '', 100);
        const safeFullText = sanitizeField(item.fullText || '', 5000);
        const safeExpectedTrend = sanitizeField(expectedMarketTrend, 50);
        
        // 驗證和清理 URL
        let safeUrl = '';
        if (item.url && typeof item.url === 'string') {
            try {
                const url = new URL(item.url);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    safeUrl = url.toString();
                }
            } catch (e) {
                console.warn(`無效的 URL: ${item.url}`);
            }
        }
        
        // 生成安全的圖片 URL - 使用 SVG 避免外部依賴
        const titleHash = generateHashFromString(safeTitle || 'default');
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        const bgColor = colors[titleHash % colors.length];
        
        let svgContent;
        try {
            svgContent = generateRealEstateSVG(bgColor, '#ffffff', safeTitle);
        } catch (error) {
            console.warn('SVG 生成失敗，使用簡單圖片:', error);
            // 簡單的後備 SVG
            svgContent = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${bgColor}"/>
                <rect x="150" y="80" width="100" height="60" fill="#ffffff" opacity="0.2"/>
                <polygon points="140,80 200,50 260,80" fill="#ffffff" opacity="0.3"/>
                <text x="200" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">房地產新聞</text>
                <text x="200" y="180" font-family="Arial, sans-serif" font-size="10" fill="#ffffff" text-anchor="middle" opacity="0.8">${(safeTitle || '').substring(0, 20)}...</text>
            </svg>`;
        }
        
        const safeImageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;
        
        // 返回格式化的安全文章數據
        return {
            id: index,
            title: safeTitle,
            summary: safeSummary,
            keywords: keywords, // 關鍵詞已在上面處理
            date: item.date || '', // 日期格式驗證可以在後續加強
            publisher: safePublisher,
            author: safeAuthor,
            fullText: safeFullText,
            expectedMarketTrend: safeExpectedTrend,
            url: safeUrl,
            imageUrl: safeImageUrl
        };
    });
}

// 文件上傳配置
const UPLOAD_CONFIG = {
    maxFileSize: 0, // 0 = 無檔案大小限制
    allowedMimeTypes: ['text/csv', 'application/csv', 'text/plain'],
    allowedExtensions: ['.csv'],
    maxRecords: 0, // 0 = 無記錄數限制
    maxFieldLength: 10000 // 增加字段長度限制以支持大型文檔
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 等待安全工具載入
        await waitForSecurityUtils();
        
        // 初始化數據庫
        await initDB();
        
        // 綁定上傳表單提交事件
        const uploadForm = document.getElementById('csv-upload-form');
        const uploadStatus = document.getElementById('upload-status');
        
        if (uploadForm) {
            uploadForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const fileInput = document.getElementById('csv-file');
                const file = fileInput.files[0];
                
                try {
                    // 安全驗證上傳的文件
                    await validateUploadedFile(file);
                    
                    // 顯示驗證成功並開始處理
                    showUploadStatus('正在驗證和處理檔案...', 'info');
                    
                } catch (error) {
                    showUploadStatus(error.message, 'danger');
                    return;
                }
                
                // 使用 PapaParse 解析 CSV 檔案
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async function(results) {
                        if (results.errors.length > 0) {
                            const errorMsg = results.errors[0].message || '未知解析錯誤';
                            showUploadStatus(`CSV解析錯誤：${errorMsg}`, 'danger');
                            return;
                        }
                        
                        try {
                            showUploadStatus('正在處理數據...', 'info');
                            
                            // 轉換 CSV 數據為應用程式所需的格式
                            const articlesData = processCSVData(results.data);
                            
                            showUploadStatus('正在保存到數據庫...', 'info');
                            
                            // 保存到 IndexedDB
                            const count = await saveArticlesToDB(articlesData);
                            
                            // 設置文章數據
                            setArticlesData(articlesData);
                            
                            // 確保月份滑桿寬度調整（如果函數存在）
                            if (typeof adjustSliderWidth === 'function') {
                                const months = getMonthRange(articlesData);
                                if (months && months.length > 0) {
                                    adjustSliderWidth(months.length);
                                }
                            }
                            
                            // 創建成功訊息和清除按鈕
                            showSuccessWithClearButton(count);
                            
                            // 清空檔案輸入
                            fileInput.value = '';
                            
                        } catch (error) {
                            console.error('處理CSV數據時發生錯誤:', error);
                            const errorMsg = error.message || error.toString();
                            showUploadStatus(`處理數據時發生錯誤：${errorMsg}`, 'danger');
                        }
                    },
                    error: function(error) {
                        console.error('CSV解析錯誤:', error);
                        const errorMsg = error.message || error.toString();
                        showUploadStatus(`CSV解析錯誤：${errorMsg}`, 'danger');
                    }
                });
            });
        }
        
        // 檢查是否有已存儲的數據
        const hasData = await hasArticlesInDB();
        if (hasData) {
            const articles = await getArticlesFromDB();
            if (uploadStatus) {
                showDatabaseLoadedStatus(articles.length);
            }
        }
    } catch (error) {
        console.error('初始化錯誤:', error);
        const uploadStatus = document.getElementById('upload-status');
        if (uploadStatus) {
            const errorMsg = error.message || error.toString();
            showUploadStatus(`初始化錯誤：${errorMsg}`, 'danger');
        }
    }
});

// 等待安全工具載入
function waitForSecurityUtils() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.SecurityUtils) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 50);
        
        // 5秒後放棄等待
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('SecurityUtils 載入超時，將使用基本安全措施');
            resolve();
        }, 5000);
    });
}

// 安全驗證文件
async function validateUploadedFile(file) {
    // 基本檢查
    if (!file) {
        throw new Error('請選擇一個檔案');
    }
    
    // 文件大小檢查（如果設定了限制）
    if (UPLOAD_CONFIG.maxFileSize > 0 && file.size > UPLOAD_CONFIG.maxFileSize) {
        throw new Error(`檔案大小超過限制 (${(UPLOAD_CONFIG.maxFileSize / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    // 文件類型檢查
    const fileName = file.name.toLowerCase();
    const hasValidExtension = UPLOAD_CONFIG.allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
        throw new Error('只允許上傳 CSV 格式的檔案');
    }
    
    // MIME 類型檢查（如果可用）
    if (file.type && !UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
        throw new Error('檔案類型不符合要求');
    }
    
    // 檢查檔案內容
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                
                // 檢查檔案是否包含危險內容
                if (containsDangerousContent(content)) {
                    reject(new Error('檔案內容包含不安全的內容'));
                    return;
                }
                
                // 檢查檔案記錄數（如果設定了限制）
                const lines = content.split('\n').filter(line => line.trim());
                if (UPLOAD_CONFIG.maxRecords > 0 && lines.length > UPLOAD_CONFIG.maxRecords) {
                    reject(new Error(`檔案記錄數超過限制 (${UPLOAD_CONFIG.maxRecords})`));
                    return;
                }
                
                resolve(true);
            } catch (error) {
                reject(new Error('檔案內容無法讀取'));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('檔案讀取失敗'));
        };
        
        // 只讀取檔案的一部分來檢查
        const blob = file.slice(0, Math.min(file.size, 1024 * 100)); // 最多讀取 100KB
        reader.readAsText(blob);
    });
}

// 檢查內容是否包含危險內容
function containsDangerousContent(content) {
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe\b/i,
        /<object\b/i,
        /<embed\b/i,
        /data:text\/html/i,
        /data:application\/javascript/i,
        /<link\b.*?rel\s*=\s*["']stylesheet["']/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(content));
}

// 安全地清理和驗證數據字段
function sanitizeField(value, maxLength = UPLOAD_CONFIG.maxFieldLength) {
    if (typeof value !== 'string') {
        return '';
    }
    
    // 移除危險字符
    let cleaned = value
        .replace(/[<>]/g, '') // 移除尖括號
        .replace(/javascript:/gi, '') // 移除 javascript: 協議
        .replace(/on\w+=/gi, '') // 移除事件處理器
        .trim();
    
    // 限制長度
    if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength);
        console.warn(`字段內容過長，已截斷至 ${maxLength} 個字符`);
    }
    
    return cleaned;
}

// 安全地顯示上傳狀態
function showUploadStatus(message, type = 'info') {
    const uploadStatus = document.getElementById('upload-status');
    if (!uploadStatus) return;
    
    // 清空現有內容
    while (uploadStatus.firstChild) {
        uploadStatus.removeChild(uploadStatus.firstChild);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    
    const icon = document.createElement('i');
    switch (type) {
        case 'success':
            icon.className = 'fas fa-check-circle';
            break;
        case 'danger':
            icon.className = 'fas fa-times-circle';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            break;
        default:
            icon.className = 'fas fa-spinner fa-spin';
    }
    
    alertDiv.appendChild(icon);
    alertDiv.appendChild(document.createTextNode(' ' + message));
    
    uploadStatus.appendChild(alertDiv);
}

// 安全地顯示成功訊息並添加清除按鈕
function showSuccessWithClearButton(count) {
    const uploadStatus = document.getElementById('upload-status');
    if (!uploadStatus) return;
    
    // 清空現有內容
    while (uploadStatus.firstChild) {
        uploadStatus.removeChild(uploadStatus.firstChild);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';
    alertDiv.appendChild(icon);
    
    const successText = document.createTextNode(` 成功處理 ${count} 篇文章。`);
    alertDiv.appendChild(successText);
    
    // 創建清除按鈕
    const clearButton = document.createElement('button');
    clearButton.id = 'clear-data';
    clearButton.className = 'btn btn-sm btn-outline-danger ml-2';
    clearButton.textContent = '清除數據';
    
    // 安全的事件處理
    clearButton.addEventListener('click', async function() {
        if (!confirm('確定要清除所有數據嗎？此操作無法撤銷。')) {
            return;
        }
        
        try {
            showUploadStatus('正在清除數據...', 'info');
            await clearArticlesDB();
            showUploadStatus('數據已清除，頁面即將重新載入...', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('清除數據錯誤:', error);
            showUploadStatus(`清除數據失敗: ${error.message || error}`, 'danger');
        }
    });
    
    alertDiv.appendChild(clearButton);
    uploadStatus.appendChild(alertDiv);
}

// 顯示數據庫已載入狀態
function showDatabaseLoadedStatus(count) {
    const uploadStatus = document.getElementById('upload-status');
    if (!uploadStatus) return;
    
    // 清空現有內容
    while (uploadStatus.firstChild) {
        uploadStatus.removeChild(uploadStatus.firstChild);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-info-circle';
    alertDiv.appendChild(icon);
    
    const infoText = document.createTextNode(` 已從數據庫載入 ${count} 篇文章。`);
    alertDiv.appendChild(infoText);
    
    // 創建清除按鈕
    const clearButton = document.createElement('button');
    clearButton.className = 'btn btn-sm btn-outline-danger ml-2';
    clearButton.textContent = '清除數據';
    
    // 安全的事件處理
    clearButton.addEventListener('click', async function() {
        if (!confirm('確定要清除所有數據嗎？此操作無法撤銷。')) {
            return;
        }
        
        try {
            showUploadStatus('正在清除數據...', 'info');
            await clearArticlesDB();
            showUploadStatus('數據已清除，頁面即將重新載入...', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('清除數據錯誤:', error);
            showUploadStatus(`清除數據失敗: ${error.message || error}`, 'danger');
        }
    });
    
    alertDiv.appendChild(clearButton);
    uploadStatus.appendChild(alertDiv);
}

// 生成字符串哈希值
function generateHashFromString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 轉換為32位整數
    }
    return Math.abs(hash);
}

// 從 scripts.js 引入 getMonthRange 函數
function getMonthRange(articles) {
    if (!articles || articles.length === 0) {
        return [];
    }
    
    // 過濾無效日期
    const validArticles = articles.filter(article => article.date && !isNaN(new Date(article.date).getTime()));
    
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

// 生成房地產主題的 SVG 圖片
function generateRealEstateSVG(bgColor, textColor, title) {
    const titleHash = generateHashFromString(title);
    const houseVariant = titleHash % 4; // 4種不同的房子樣式
    
    // 調色函數
    function lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                     (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                     (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    function darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + 
                     (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 + 
                     (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    // 選擇房子圖案
    let houseElement = '';
    const lightColor = lightenColor(bgColor, 20);
    const darkColor = darkenColor(bgColor, 20);
    
    switch (houseVariant) {
        case 0: // 現代公寓
            houseElement = `
                <!-- 公寓建築 -->
                <rect x="120" y="80" width="160" height="90" fill="${lightColor}" stroke="${darkColor}" stroke-width="2"/>
                <rect x="130" y="90" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="165" y="90" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="200" y="90" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="235" y="90" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="130" y="125" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="165" y="125" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="200" y="125" width="25" height="25" fill="${textColor}" opacity="0.3"/>
                <rect x="235" y="125" width="25" height="25" fill="${textColor}" opacity="0.3"/>
            `;
            break;
        case 1: // 傳統住宅
            houseElement = `
                <!-- 房子屋頂 -->
                <polygon points="120,100 200,60 280,100" fill="${darkColor}"/>
                <!-- 房子主體 -->
                <rect x="140" y="100" width="120" height="70" fill="${lightColor}" stroke="${darkColor}" stroke-width="2"/>
                <!-- 門 -->
                <rect x="180" y="140" width="40" height="30" fill="${darkColor}"/>
                <!-- 窗戶 -->
                <rect x="150" y="115" width="20" height="20" fill="${textColor}" opacity="0.3"/>
                <rect x="230" y="115" width="20" height="20" fill="${textColor}" opacity="0.3"/>
            `;
            break;
        case 2: // 摩天大樓
            houseElement = `
                <!-- 大樓主體 -->
                <rect x="160" y="40" width="80" height="130" fill="${lightColor}" stroke="${darkColor}" stroke-width="2"/>
                <!-- 窗戶網格 -->
                <rect x="170" y="50" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="186" y="50" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="202" y="50" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="218" y="50" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="170" y="66" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="186" y="66" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="202" y="66" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="218" y="66" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="170" y="82" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="186" y="82" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="202" y="82" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <rect x="218" y="82" width="12" height="12" fill="${textColor}" opacity="0.3"/>
                <!-- 天線 -->
                <rect x="198" y="30" width="4" height="20" fill="${darkColor}"/>
            `;
            break;
        case 3: // 別墅
            houseElement = `
                <!-- 主屋屋頂 -->
                <polygon points="110,90 180,50 250,90" fill="${darkColor}"/>
                <!-- 主屋 -->
                <rect x="130" y="90" width="100" height="80" fill="${lightColor}" stroke="${darkColor}" stroke-width="2"/>
                <!-- 側翼屋頂 -->
                <polygon points="250,100 300,75 330,100" fill="${darkColor}"/>
                <!-- 側翼 -->
                <rect x="250" y="100" width="80" height="70" fill="${lightColor}" stroke="${darkColor}" stroke-width="2"/>
                <!-- 門 -->
                <rect x="165" y="140" width="30" height="30" fill="${darkColor}"/>
                <!-- 窗戶 -->
                <rect x="145" y="110" width="15" height="15" fill="${textColor}" opacity="0.3"/>
                <rect x="200" y="110" width="15" height="15" fill="${textColor}" opacity="0.3"/>
                <rect x="270" y="115" width="15" height="15" fill="${textColor}" opacity="0.3"/>
            `;
            break;
    }
    
    return `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <!-- 背景 -->
        <rect width="100%" height="100%" fill="${bgColor}"/>
        
        <!-- 地面 -->
        <rect x="0" y="170" width="400" height="30" fill="${darkColor}" opacity="0.3"/>
        
        <!-- 房地產圖形 -->
        ${houseElement}
        
        <!-- 標題文字 -->
        <text x="200" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle">房地產新聞</text>
        
        <!-- 文章標題縮略 -->
        <text x="200" y="195" font-family="Arial, sans-serif" font-size="10" fill="${textColor}" text-anchor="middle" opacity="0.8">${title.substring(0, 20)}${title.length > 20 ? '...' : ''}</text>
    </svg>`;
}

// 導出函數供其他模塊使用
window.csvUploader = {
    getArticlesFromDB,
    clearArticlesDB,
    hasArticlesInDB
};