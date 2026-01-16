/**
 * SearchManager - 增強搜尋功能管理器
 * 負責處理全文搜尋、搜尋建議、搜尋歷史和結果高亮顯示
 */

class SearchManager {
    constructor(stateManager, utilities) {
        this.stateManager = stateManager;
        this.utilities = utilities;

        // 搜尋歷史配置
        this.maxHistoryItems = 10;
        this.historyStorageKey = 'searchHistory';

        // 搜尋選項預設值
        this.searchOptions = {
            scopes: ['title', 'summary', 'fullText', 'keywords'],
            caseSensitive: false,
            exactMatch: false
        };

        // 當前搜尋狀態
        this.currentSearchTerm = '';
        this.searchResults = [];

        this.init();
    }

    /**
     * 初始化搜尋管理器
     */
    init() {
        this.initializeElements();
        this.loadSearchOptions();
        this.attachEventListeners();
        this.loadPopularKeywords();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        this.searchInput = document.getElementById('keyword-filter');
        this.searchClearBtn = document.getElementById('search-clear-btn');
        this.searchSuggestions = document.getElementById('search-suggestions');
        this.searchHistorySection = document.getElementById('search-history-section');
        this.searchHistoryList = document.getElementById('search-history-list');
        this.searchPopularList = document.getElementById('search-popular-list');
        this.searchClearHistory = document.getElementById('search-clear-history');

        // 搜尋選項
        this.searchScopeOptions = document.querySelectorAll('.search-scope-option');
        this.searchCaseSensitive = document.getElementById('search-case-sensitive');
        this.searchExactMatch = document.getElementById('search-exact-match');
    }

    /**
     * 載入搜尋選項
     */
    loadSearchOptions() {
        try {
            const savedOptions = localStorage.getItem('searchOptions');
            if (savedOptions) {
                const options = JSON.parse(savedOptions);
                this.searchOptions = { ...this.searchOptions, ...options };

                // 應用儲存的選項到UI
                this.applyOptionsToUI();
            }
        } catch (error) {
            console.error('載入搜尋選項失敗:', error);
        }
    }

    /**
     * 應用搜尋選項到UI
     */
    applyOptionsToUI() {
        // 設定搜尋範圍
        this.searchScopeOptions.forEach(checkbox => {
            checkbox.checked = this.searchOptions.scopes.includes(checkbox.value);
        });

        // 設定其他選項
        if (this.searchCaseSensitive) {
            this.searchCaseSensitive.checked = this.searchOptions.caseSensitive;
        }
        if (this.searchExactMatch) {
            this.searchExactMatch.checked = this.searchOptions.exactMatch;
        }
    }

    /**
     * 儲存搜尋選項
     */
    saveSearchOptions() {
        try {
            localStorage.setItem('searchOptions', JSON.stringify(this.searchOptions));
        } catch (error) {
            console.error('儲存搜尋選項失敗:', error);
        }
    }

    /**
     * 綁定事件監聽器
     */
    attachEventListeners() {
        if (!this.searchInput) return;

        // 搜尋輸入事件
        this.searchInput.addEventListener('focus', () => this.showSuggestions());
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // 點擊外部關閉建議
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });

        // 清除搜尋按鈕
        if (this.searchClearBtn) {
            this.searchClearBtn.addEventListener('click', () => this.clearSearch());
        }

        // 清除歷史按鈕
        if (this.searchClearHistory) {
            this.searchClearHistory.addEventListener('click', () => this.clearHistory());
        }

        // 搜尋範圍選項
        this.searchScopeOptions.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSearchScopes();
            });
        });

        // 搜尋選項
        if (this.searchCaseSensitive) {
            this.searchCaseSensitive.addEventListener('change', (e) => {
                this.searchOptions.caseSensitive = e.target.checked;
                this.saveSearchOptions();
                if (this.currentSearchTerm) {
                    this.performSearch(this.currentSearchTerm);
                }
            });
        }

        if (this.searchExactMatch) {
            this.searchExactMatch.addEventListener('change', (e) => {
                this.searchOptions.exactMatch = e.target.checked;
                this.saveSearchOptions();
                if (this.currentSearchTerm) {
                    this.performSearch(this.currentSearchTerm);
                }
            });
        }

        // 鍵盤導航
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // 防止搜尋選項dropdown內部點擊時關閉
        const searchOptionsDropdown = document.querySelector('.search-options-dropdown');
        if (searchOptionsDropdown) {
            searchOptionsDropdown.addEventListener('click', (e) => {
                // 只有點擊checkbox或label時不關閉dropdown
                const isCheckboxOrLabel = e.target.closest('.custom-control-input, .custom-control-label');
                if (isCheckboxOrLabel) {
                    e.stopPropagation();
                }
            });
        }
    }

    /**
     * 處理搜尋輸入
     */
    handleSearchInput(value) {
        const trimmedValue = value.trim();

        // 顯示/隱藏清除按鈕
        if (this.searchClearBtn) {
            this.searchClearBtn.style.display = trimmedValue ? 'block' : 'none';
        }

        if (trimmedValue) {
            this.showSuggestions();
            this.updateSuggestions(trimmedValue);
        } else {
            this.currentSearchTerm = '';
            this.showSuggestions();
            this.renderHistory();
        }
    }

    /**
     * 執行搜尋
     */
    performSearch(searchTerm) {
        if (!searchTerm) return [];

        this.currentSearchTerm = searchTerm;
        const articlesData = this.stateManager.getState('articlesData');

        if (!articlesData || articlesData.length === 0) {
            return [];
        }

        const results = articlesData.filter(article => {
            return this.matchesSearch(article, searchTerm);
        });

        // 儲存搜尋歷史
        this.addToHistory(searchTerm);

        // 隱藏建議
        this.hideSuggestions();

        return results;
    }

    /**
     * 檢查文章是否匹配搜尋條件
     */
    matchesSearch(article, searchTerm) {
        const term = this.searchOptions.caseSensitive ? searchTerm : searchTerm.toLowerCase();

        for (const scope of this.searchOptions.scopes) {
            let content = '';

            if (scope === 'keywords' && Array.isArray(article.keywords)) {
                content = article.keywords.join(' ');
            } else if (article[scope]) {
                content = article[scope];
            }

            if (!content) continue;

            const searchContent = this.searchOptions.caseSensitive ? content : content.toLowerCase();

            if (this.searchOptions.exactMatch) {
                // 完全匹配
                if (scope === 'keywords') {
                    const keywords = this.searchOptions.caseSensitive
                        ? article.keywords
                        : article.keywords.map(k => k.toLowerCase());
                    if (keywords.includes(term)) {
                        return true;
                    }
                } else if (searchContent === term) {
                    return true;
                }
            } else {
                // 部分匹配
                if (searchContent.includes(term)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 高亮顯示搜尋結果
     */
    highlightSearchResults(text, searchTerm) {
        if (!searchTerm || !text) return text;

        const flags = this.searchOptions.caseSensitive ? 'g' : 'gi';
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedTerm, flags);

        return text.replace(regex, match => `<span class="search-highlight">${match}</span>`);
    }

    /**
     * 更新搜尋範圍
     */
    updateSearchScopes() {
        this.searchOptions.scopes = Array.from(this.searchScopeOptions)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        this.saveSearchOptions();

        // 如果有當前搜尋，重新執行
        if (this.currentSearchTerm) {
            this.performSearch(this.currentSearchTerm);
        }
    }

    /**
     * 顯示搜尋建議
     */
    showSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'block';

            if (!this.currentSearchTerm) {
                this.renderHistory();
            }
        }
    }

    /**
     * 隱藏搜尋建議
     */
    hideSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'none';
        }
    }

    /**
     * 更新搜尋建議
     */
    updateSuggestions(searchTerm) {
        // 過濾熱門關鍵詞
        const popularKeywords = this.getPopularKeywords();
        const filteredKeywords = popularKeywords.filter(kw =>
            kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderPopularKeywords(filteredKeywords.slice(0, 5));
    }

    /**
     * 渲染搜尋歷史
     */
    renderHistory() {
        const history = this.getHistory();

        if (history.length === 0) {
            this.searchHistorySection.style.display = 'none';
            return;
        }

        this.searchHistorySection.style.display = 'block';
        this.searchHistoryList.innerHTML = history.map(term => `
            <div class="search-suggestion-item" data-term="${this.utilities.escapeHtml(term)}">
                <span class="search-suggestion-icon"><i class="fas fa-history"></i></span>
                <span class="search-suggestion-text">${this.utilities.escapeHtml(term)}</span>
                <button class="search-suggestion-remove" data-action="remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // 綁定點擊事件
        this.searchHistoryList.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('[data-action="remove"]')) {
                    e.stopPropagation();
                    this.removeFromHistory(item.dataset.term);
                    this.renderHistory();
                } else {
                    this.selectSuggestion(item.dataset.term);
                }
            });
        });
    }

    /**
     * 載入熱門關鍵詞
     */
    loadPopularKeywords() {
        const articlesData = this.stateManager.getState('articlesData');

        if (!articlesData || articlesData.length === 0) {
            return;
        }

        // 計算關鍵詞頻率
        const keywordCounts = {};
        articlesData.forEach(article => {
            if (article.keywords && Array.isArray(article.keywords)) {
                article.keywords.forEach(keyword => {
                    keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
                });
            }
        });

        // 排序並取前10個
        const popularKeywords = Object.entries(keywordCounts)
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        this.stateManager.setState('popularKeywords', popularKeywords);
        this.renderPopularKeywords(popularKeywords);
    }

    /**
     * 取得熱門關鍵詞
     */
    getPopularKeywords() {
        return this.stateManager.getState('popularKeywords') || [];
    }

    /**
     * 渲染熱門關鍵詞
     */
    renderPopularKeywords(keywords) {
        if (!this.searchPopularList) return;

        if (keywords.length === 0) {
            this.searchPopularList.innerHTML = '<div class="px-3 py-2 text-muted" style="font-size: 0.9rem;">無熱門關鍵詞</div>';
            return;
        }

        this.searchPopularList.innerHTML = keywords.map(({ keyword, count }) => `
            <div class="search-suggestion-item" data-term="${this.utilities.escapeHtml(keyword)}">
                <span class="search-suggestion-icon"><i class="fas fa-fire"></i></span>
                <span class="search-suggestion-text">${this.utilities.escapeHtml(keyword)}</span>
                <span class="search-suggestion-count">${count}</span>
            </div>
        `).join('');

        // 綁定點擊事件
        this.searchPopularList.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(item.dataset.term);
            });
        });
    }

    /**
     * 選擇建議項目
     */
    selectSuggestion(term) {
        if (this.searchInput) {
            this.searchInput.value = term;
            this.searchInput.dispatchEvent(new Event('input'));
            this.searchInput.focus();
        }
    }

    /**
     * 清除搜尋
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.dispatchEvent(new Event('input'));
            this.searchInput.focus();
        }
        this.currentSearchTerm = '';
    }

    /**
     * 取得搜尋歷史
     */
    getHistory() {
        try {
            const history = localStorage.getItem(this.historyStorageKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('讀取搜尋歷史失敗:', error);
            return [];
        }
    }

    /**
     * 新增到搜尋歷史
     */
    addToHistory(term) {
        if (!term) return;

        try {
            let history = this.getHistory();

            // 移除重複項目
            history = history.filter(item => item !== term);

            // 加到最前面
            history.unshift(term);

            // 限制數量
            history = history.slice(0, this.maxHistoryItems);

            localStorage.setItem(this.historyStorageKey, JSON.stringify(history));
        } catch (error) {
            console.error('儲存搜尋歷史失敗:', error);
        }
    }

    /**
     * 從歷史移除項目
     */
    removeFromHistory(term) {
        try {
            let history = this.getHistory();
            history = history.filter(item => item !== term);
            localStorage.setItem(this.historyStorageKey, JSON.stringify(history));
        } catch (error) {
            console.error('移除搜尋歷史失敗:', error);
        }
    }

    /**
     * 清除搜尋歷史
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.historyStorageKey);
            this.renderHistory();
        } catch (error) {
            console.error('清除搜尋歷史失敗:', error);
        }
    }

    /**
     * 處理鍵盤導航
     */
    handleKeyboardNavigation(e) {
        const suggestions = this.searchSuggestions;
        if (!suggestions || suggestions.style.display === 'none') return;

        const items = suggestions.querySelectorAll('.search-suggestion-item');
        if (items.length === 0) return;

        const currentIndex = Array.from(items).findIndex(item =>
            item.classList.contains('keyboard-focus')
        );

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNextSuggestion(items, currentIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusPreviousSuggestion(items, currentIndex);
                break;
            case 'Enter':
                if (currentIndex >= 0) {
                    e.preventDefault();
                    items[currentIndex].click();
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.hideSuggestions();
                break;
        }
    }

    /**
     * 聚焦下一個建議
     */
    focusNextSuggestion(items, currentIndex) {
        items.forEach(item => item.classList.remove('keyboard-focus'));

        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].classList.add('keyboard-focus');
        items[nextIndex].scrollIntoView({ block: 'nearest' });
    }

    /**
     * 聚焦上一個建議
     */
    focusPreviousSuggestion(items, currentIndex) {
        items.forEach(item => item.classList.remove('keyboard-focus'));

        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].classList.add('keyboard-focus');
        items[prevIndex].scrollIntoView({ block: 'nearest' });
    }

    /**
     * 取得當前搜尋詞
     */
    getCurrentSearchTerm() {
        return this.currentSearchTerm;
    }

    /**
     * 重置搜尋狀態
     */
    reset() {
        this.currentSearchTerm = '';
        this.searchResults = [];
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        if (this.searchClearBtn) {
            this.searchClearBtn.style.display = 'none';
        }
        this.hideSuggestions();
    }
}

// 導出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}
