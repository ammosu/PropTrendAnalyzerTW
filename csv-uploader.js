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

// 處理 CSV 數據，轉換為應用程式所需的格式
function processCSVData(csvData) {
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
                console.warn(`無法解析文章 ${index} 的關鍵詞: ${item.keywords}`);
                // 嘗試使用正則表達式提取關鍵詞
                const matches = item.keywords.match(/'([^']+)'/g);
                if (matches) {
                    keywords = matches.map(m => m.replace(/'/g, '').trim());
                }
            }
        }
        
        // 確定預期市場趨勢
        let expectedMarketTrend = "無法判斷";
        if (item['預期走向']) {
            expectedMarketTrend = item['預期走向'];
        }
        
        // 返回格式化的文章數據
        return {
            id: index,
            title: item.title || '',
            summary: item.summary || '',
            keywords: keywords,
            date: item.date || '',
            publisher: item.publisher || '',
            author: item.author || '',
            fullText: item.fullText || '',
            expectedMarketTrend: expectedMarketTrend,
            url: item.url || '',
            imageUrl: item.imageUrl || `https://source.unsplash.com/random/400x200?property,${index}` // 隨機房地產相關圖片
        };
    });
}

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    try {
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
                
                if (!file) {
                    uploadStatus.innerHTML = `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i> 請選擇一個CSV檔案。
                        </div>
                    `;
                    return;
                }
                
                // 顯示上傳中狀態
                uploadStatus.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-spinner fa-spin"></i> 正在處理CSV檔案，請稍候...
                    </div>
                `;
                
                // 使用 PapaParse 解析 CSV 檔案
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async function(results) {
                        if (results.errors.length > 0) {
                            // 顯示解析錯誤
                            uploadStatus.innerHTML = `
                                <div class="alert alert-danger">
                                    <i class="fas fa-times-circle"></i> CSV解析錯誤：${results.errors[0].message}
                                </div>
                            `;
                            return;
                        }
                        
                        try {
                            // 轉換 CSV 數據為應用程式所需的格式
                            const articlesData = processCSVData(results.data);
                            
                            // 保存到 IndexedDB
                            const count = await saveArticlesToDB(articlesData);
                            
                            // 設置文章數據
                            setArticlesData(articlesData);
                            
                            // 顯示成功訊息
                            uploadStatus.innerHTML = `
                                <div class="alert alert-success">
                                    <i class="fas fa-check-circle"></i> 成功處理 ${count} 篇文章。
                                    <button id="clear-data" class="btn btn-sm btn-outline-danger ml-2">清除數據</button>
                                </div>
                            `;
                            
                            // 綁定清除數據按鈕
                            document.getElementById('clear-data').addEventListener('click', async function() {
                                try {
                                    await clearArticlesDB();
                                    location.reload(); // 重新載入頁面
                                } catch (error) {
                                    console.error('清除數據錯誤:', error);
                                    alert('清除數據失敗: ' + error);
                                }
                            });
                            
                            // 清空檔案輸入
                            fileInput.value = '';
                        } catch (error) {
                            console.error('處理CSV數據時發生錯誤:', error);
                            uploadStatus.innerHTML = `
                                <div class="alert alert-danger">
                                    <i class="fas fa-times-circle"></i> 處理CSV數據時發生錯誤：${error.message || error}
                                </div>
                            `;
                        }
                    },
                    error: function(error) {
                        console.error('CSV解析錯誤:', error);
                        uploadStatus.innerHTML = `
                            <div class="alert alert-danger">
                                <i class="fas fa-times-circle"></i> CSV解析錯誤：${error.message}
                            </div>
                        `;
                    }
                });
            });
        }
        
        // 檢查是否有已存儲的數據
        const hasData = await hasArticlesInDB();
        if (hasData) {
            const articles = await getArticlesFromDB();
            if (uploadStatus) {
                uploadStatus.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> 已從數據庫載入 ${articles.length} 篇文章。
                        <button id="clear-data" class="btn btn-sm btn-outline-danger ml-2">清除數據</button>
                    </div>
                `;
                
                // 綁定清除數據按鈕
                document.getElementById('clear-data').addEventListener('click', async function() {
                    try {
                        await clearArticlesDB();
                        location.reload(); // 重新載入頁面
                    } catch (error) {
                        console.error('清除數據錯誤:', error);
                        alert('清除數據失敗: ' + error);
                    }
                });
            }
        }
    } catch (error) {
        console.error('初始化錯誤:', error);
        const uploadStatus = document.getElementById('upload-status');
        if (uploadStatus) {
            uploadStatus.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle"></i> 初始化錯誤：${error.message || error}
                </div>
            `;
        }
    }
});

// 導出函數供其他模塊使用
window.csvUploader = {
    getArticlesFromDB,
    clearArticlesDB,
    hasArticlesInDB
};