/**
 * BookmarkManager.js - 書籤管理模組
 *
 * 負責文章書籤/收藏功能的管理
 * 使用 localStorage 進行持久化儲存
 *
 * @class BookmarkManager
 */
class BookmarkManager {
    /**
     * 建立 BookmarkManager 實例
     * @constructor
     */
    constructor() {
        this.storageKey = 'propTrendBookmarks';
        this.bookmarks = this.loadBookmarks();
    }

    /**
     * 從 localStorage 載入書籤
     * @returns {Set} 書籤 ID 集合
     */
    loadBookmarks() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return new Set(parsed);
            }
        } catch (error) {
            console.error('載入書籤失敗:', error);
        }
        return new Set();
    }

    /**
     * 儲存書籤到 localStorage
     */
    saveBookmarks() {
        try {
            const bookmarksArray = Array.from(this.bookmarks);
            localStorage.setItem(this.storageKey, JSON.stringify(bookmarksArray));
        } catch (error) {
            console.error('儲存書籤失敗:', error);
        }
    }

    /**
     * 檢查文章是否已收藏
     * @param {number} articleId - 文章 ID
     * @returns {boolean}
     */
    isBookmarked(articleId) {
        return this.bookmarks.has(articleId);
    }

    /**
     * 切換書籤狀態
     * @param {number} articleId - 文章 ID
     * @returns {boolean} 新的書籤狀態
     */
    toggleBookmark(articleId) {
        if (this.bookmarks.has(articleId)) {
            this.bookmarks.delete(articleId);
        } else {
            this.bookmarks.add(articleId);
        }
        this.saveBookmarks();
        return this.bookmarks.has(articleId);
    }

    /**
     * 新增書籤
     * @param {number} articleId - 文章 ID
     */
    addBookmark(articleId) {
        this.bookmarks.add(articleId);
        this.saveBookmarks();
    }

    /**
     * 移除書籤
     * @param {number} articleId - 文章 ID
     */
    removeBookmark(articleId) {
        this.bookmarks.delete(articleId);
        this.saveBookmarks();
    }

    /**
     * 取得所有書籤
     * @returns {Array} 書籤 ID 陣列
     */
    getAllBookmarks() {
        return Array.from(this.bookmarks);
    }

    /**
     * 取得書籤數量
     * @returns {number}
     */
    getBookmarkCount() {
        return this.bookmarks.size;
    }

    /**
     * 清除所有書籤
     */
    clearAllBookmarks() {
        this.bookmarks.clear();
        this.saveBookmarks();
    }

    /**
     * 篩選已收藏的文章
     * @param {Array} articles - 文章陣列
     * @returns {Array} 已收藏的文章陣列
     */
    filterBookmarkedArticles(articles) {
        return articles.filter(article => this.isBookmarked(article.id));
    }

    /**
     * 顯示書籤操作的 Toast 通知
     * @param {boolean} isBookmarked - 是否已收藏
     * @param {string} title - 文章標題
     */
    showToast(isBookmarked, title) {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                bottom: auto !important;
                left: auto !important;
                z-index: 10000 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-end !important;
                gap: 8px !important;
                pointer-events: none !important;
                width: auto !important;
                height: auto !important;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'animate__animated animate__fadeInRight';

        const bgColor = isBookmarked ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)';
        const borderColor = isBookmarked ? '#F59E0B' : '#6B7280';
        const iconColor = isBookmarked ? '#F59E0B' : '#6B7280';
        const icon = isBookmarked ? 'fa-bookmark' : 'fa-bookmark';
        const message = isBookmarked ? '已加入收藏' : '已取消收藏';

        toast.style.cssText = `
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 10px 14px !important;
            min-width: 160px !important;
            max-width: 280px !important;
            height: auto !important;
            background: linear-gradient(135deg, ${bgColor} 0%, #fff 100%) !important;
            border-left: 4px solid ${borderColor} !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            pointer-events: all !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            color: #1e293b !important;
        `;

        const displayTitle = title.length > 20 ? title.substring(0, 17) + '...' : title;

        toast.innerHTML = `
            <i class="fas ${icon}" style="color: ${iconColor}; font-size: 1rem; flex-shrink: 0;"></i>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // 2 秒後自動移除
        setTimeout(() => {
            toast.classList.remove('animate__fadeInRight');
            toast.classList.add('animate__fadeOutRight');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
                if (toastContainer.children.length === 0 && document.body.contains(toastContainer)) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, 2000);
    }
}

// 導出供其他模組使用
window.BookmarkManager = BookmarkManager;
