/**
 * ExportManager.js - 匯出管理模組
 *
 * 負責處理資料匯出功能，包含 CSV、JSON 和圖表匯出
 *
 * @class ExportManager
 * @description 資料匯出管理器，支援多種格式匯出
 */
class ExportManager {
    /**
     * 建立 ExportManager 實例
     * @constructor
     * @param {StateManager} stateManager - 狀態管理器實例
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.constants = window.Constants;
    }

    /**
     * 匯出為 CSV 格式
     * @param {Array} articles - 要匯出的文章陣列
     * @param {string} filename - 檔案名稱（不含副檔名）
     */
    exportToCSV(articles, filename = '房市新聞資料') {
        if (!articles || articles.length === 0) {
            this.showToast('沒有資料可匯出', 'warning');
            return;
        }

        try {
            // 定義 CSV 欄位
            const headers = [
                'title', 'author', 'fullText', 'url', 'tag',
                'publisher', 'keywords', 'summary', 'date',
                '預期走向', '理由'
            ];

            // 建立 CSV 標頭
            const csvHeaders = headers.join(',');

            // 轉換資料為 CSV 格式
            const csvRows = articles.map(article => {
                return headers.map(header => {
                    let value = article[header] || '';

                    // 處理陣列（關鍵詞）
                    if (Array.isArray(value)) {
                        value = value.join('; ');
                    }

                    // 處理包含逗號、換行或引號的值
                    if (typeof value === 'string') {
                        value = value.replace(/"/g, '""'); // 跳脫引號
                        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                            value = `"${value}"`;
                        }
                    }

                    return value;
                }).join(',');
            });

            // 組合完整 CSV
            const csvContent = [csvHeaders, ...csvRows].join('\n');

            // 新增 BOM 以支援 Excel 正確顯示中文
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

            // 產生時間戳記
            const timestamp = this.getTimestamp();
            const fullFilename = `${filename}_${timestamp}.csv`;

            // 下載檔案
            this.downloadFile(blob, fullFilename);
            this.showToast(`已成功匯出 ${articles.length} 筆資料`, 'success');
        } catch (error) {
            console.error('CSV 匯出失敗:', error);
            this.showToast('匯出失敗，請稍後再試', 'error');
        }
    }

    /**
     * 匯出為 JSON 格式
     * @param {Array} articles - 要匯出的文章陣列
     * @param {string} filename - 檔案名稱（不含副檔名）
     */
    exportToJSON(articles, filename = '房市新聞資料') {
        if (!articles || articles.length === 0) {
            this.showToast('沒有資料可匯出', 'warning');
            return;
        }

        try {
            // 建立完整的匯出資料結構
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalArticles: articles.length,
                    dateRange: this.getDateRange(articles),
                    application: 'PropTrendAnalyzerTW',
                    version: '1.0'
                },
                articles: articles
            };

            // 轉換為 JSON 字串（格式化）
            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

            // 產生時間戳記
            const timestamp = this.getTimestamp();
            const fullFilename = `${filename}_${timestamp}.json`;

            // 下載檔案
            this.downloadFile(blob, fullFilename);
            this.showToast(`已成功匯出 ${articles.length} 筆資料`, 'success');
        } catch (error) {
            console.error('JSON 匯出失敗:', error);
            this.showToast('匯出失敗，請稍後再試', 'error');
        }
    }

    /**
     * 匯出圖表為圖片
     * @param {string} chartId - 圖表元素的 ID
     * @param {string} filename - 檔案名稱（不含副檔名）
     */
    exportChartAsImage(chartId, filename = '圖表') {
        const canvas = document.getElementById(chartId);
        if (!canvas) {
            this.showToast('找不到圖表元素', 'error');
            return;
        }

        try {
            // 轉換 canvas 為 PNG 圖片
            canvas.toBlob((blob) => {
                if (!blob) {
                    this.showToast('圖表匯出失敗', 'error');
                    return;
                }

                // 產生時間戳記
                const timestamp = this.getTimestamp();
                const fullFilename = `${filename}_${timestamp}.png`;

                // 下載檔案
                this.downloadFile(blob, fullFilename);
                this.showToast('圖表已成功匯出', 'success');
            });
        } catch (error) {
            console.error('圖表匯出失敗:', error);
            this.showToast('圖表匯出失敗，請稍後再試', 'error');
        }
    }

    /**
     * 匯出完整報表（包含資料與圖表）
     * @param {Array} articles - 文章資料
     * @param {Array} chartIds - 要匯出的圖表 ID 陣列
     */
    async exportFullReport(articles, chartIds = []) {
        if (!articles || articles.length === 0) {
            this.showToast('沒有資料可匯出', 'warning');
            return;
        }

        try {
            // 顯示載入狀態
            this.showToast('正在產生報表...', 'info');

            // 匯出 JSON 資料
            this.exportToJSON(articles, '完整報表_資料');

            // 匯出所有圖表
            for (const chartId of chartIds) {
                const chartName = this.getChartName(chartId);
                await this.exportChartAsImage(chartId, `完整報表_${chartName}`);
                // 延遲以避免瀏覽器阻擋多次下載
                await this.sleep(300);
            }

            this.showToast('完整報表已成功匯出', 'success');
        } catch (error) {
            console.error('報表匯出失敗:', error);
            this.showToast('報表匯出失敗，請稍後再試', 'error');
        }
    }

    /**
     * 取得圖表名稱
     * @param {string} chartId - 圖表 ID
     * @returns {string} 圖表名稱
     */
    getChartName(chartId) {
        const nameMap = {
            'trend': '關鍵詞趨勢分析',
            'expectedTrendChart': '每月預期市場趨勢分佈',
            'keywordCloudCanvas': '關鍵詞文字雲'
        };
        return nameMap[chartId] || chartId;
    }

    /**
     * 取得資料日期範圍
     * @param {Array} articles - 文章陣列
     * @returns {Object} 日期範圍物件
     */
    getDateRange(articles) {
        if (!articles || articles.length === 0) {
            return { start: null, end: null };
        }

        const dates = articles
            .map(a => a.date)
            .filter(d => d)
            .sort();

        return {
            start: dates[0] || null,
            end: dates[dates.length - 1] || null
        };
    }

    /**
     * 取得時間戳記字串
     * @returns {string} 格式化的時間戳記
     */
    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    /**
     * 下載檔案
     * @param {Blob} blob - 檔案內容
     * @param {string} filename - 檔案名稱
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 釋放 URL 物件
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * 顯示 Toast 通知
     * @param {string} message - 訊息內容
     * @param {string} type - 訊息類型 (success/warning/error/info)
     */
    showToast(message, type = 'info') {
        // 檢查是否已存在 toast 容器
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // 建立 toast 元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate__animated animate__fadeInRight`;

        // 圖示對應
        const iconMap = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${iconMap[type]}" aria-hidden="true"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // 3 秒後自動移除
        setTimeout(() => {
            toast.classList.remove('animate__fadeInRight');
            toast.classList.add('animate__fadeOutRight');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
                // 如果沒有其他 toast，移除容器
                if (toastContainer.children.length === 0) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 延遲函數
     * @param {number} ms - 延遲毫秒數
     * @returns {Promise} Promise
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 全域匯出
window.ExportManager = ExportManager;
