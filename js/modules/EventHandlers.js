/**
 * EventHandlers.js - 事件處理模組
 *
 * 統一管理所有使用者互動事件，包含篩選、分頁、圖表切換等
 *
 * @class EventHandlers
 * @description 事件處理層，連接 UI 互動與業務邏輯
 */
class EventHandlers {
    /**
     * 建立 EventHandlers 實例
     * @constructor
     * @param {StateManager} stateManager - 狀態管理器實例
     * @param {UIComponents} uiComponents - UI 元件實例
     * @param {ChartManager} chartManager - 圖表管理器實例
     * @param {Utilities} utilities - 工具函數實例
     * @param {SearchManager} searchManager - 搜尋管理器實例
     */
    constructor(stateManager, uiComponents, chartManager, utilities, searchManager) {
        this.stateManager = stateManager;
        this.uiComponents = uiComponents;
        this.chartManager = chartManager;
        this.utilities = utilities;
        this.searchManager = searchManager;
        this.cache = window.CacheManager;
        this.constants = window.Constants;
        this.validator = window.Validator;
        this.accessibilityManager = null;

        this.initializeEventListeners();
    }

    /**
     * 設定無障礙性管理器
     * @param {AccessibilityManager} accessibilityManager - 無障礙性管理器實例
     */
    setAccessibilityManager(accessibilityManager) {
        this.accessibilityManager = accessibilityManager;
    }

    // 初始化所有事件監聽器
    initializeEventListeners() {
        this.initializeFilterEvents();
        this.initializeQuickDateFilters();
        this.initializeViewModeToggle();
        this.initializeDarkModeToggle();
        this.initializeNavigationEvents();
        this.initializeChartEvents();
        this.initializeFileUploadLabel();
        this.initializeTrendModeToggle();
    }

    // 初始化檔案上傳標籤
    initializeFileUploadLabel() {
        const fileInput = document.querySelector('.custom-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                const fileName = this.value.split('\\').pop();
                const label = this.nextElementSibling;
                if (label && label.classList.contains('custom-file-label')) {
                    label.textContent = fileName || '選擇檔案...';
                }
            });
        }
    }

    // 初始化篩選相關事件
    initializeFilterEvents() {
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const keywordFilterEl = document.getElementById('keyword-filter');
        const sortFieldEl = document.getElementById('sort-field');
        const sortDirectionBtn = document.getElementById('sort-direction-btn');

        if (startDateEl) {
            startDateEl.addEventListener('change', this.utilities.debounce(() => {
                this.clearQuickDateSelection();
                this.filterArticles();
            }, this.constants.UI.DATE_FILTER_DEBOUNCE));
        }
        if (endDateEl) {
            endDateEl.addEventListener('change', this.utilities.debounce(() => {
                this.clearQuickDateSelection();
                this.filterArticles();
            }, this.constants.UI.DATE_FILTER_DEBOUNCE));
        }
        if (keywordFilterEl) {
            keywordFilterEl.addEventListener('input', this.utilities.debounce(() => this.filterArticles(), this.constants.UI.DEBOUNCE_DELAY));
        }
        if (sortFieldEl) {
            sortFieldEl.addEventListener('change', () => this.filterArticles());
        }
        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('click', () => {
                this.toggleSortDirection();
                this.filterArticles();
            });
        }

        // 媒體篩選按鈕
        document.querySelectorAll('.media-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.filterArticles());
        });

        // 清除所有篩選按鈕
        const clearAllBtn = document.getElementById('clear-all-filters-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllFilters());
        }

    }

    // 初始化快速日期篩選
    initializeQuickDateFilters() {
        const quickDateButtons = document.querySelectorAll('.quick-date-btn');

        quickDateButtons.forEach(button => {
            button.addEventListener('click', () => {
                const range = button.dataset.range;
                this.applyQuickDateFilter(range);

                // 更新按鈕選中狀態
                quickDateButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    // 應用快速日期篩選
    applyQuickDateFilter(range) {
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');

        if (!startDateEl || !endDateEl) return;

        const today = new Date();
        const dateRange = this.calculateDateRange(range, today);

        if (dateRange) {
            startDateEl.value = dateRange.start;
            endDateEl.value = dateRange.end;
        } else {
            // "全部" 選項 - 清空日期
            startDateEl.value = '';
            endDateEl.value = '';
        }

        // 觸發篩選
        this.filterArticles();
    }

    // 計算日期範圍
    calculateDateRange(range, today) {
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const endDate = formatDate(today);
        let startDate;

        switch (range) {
            case 'last1Month':
                // 最近1個月
                const last1Month = new Date(today);
                last1Month.setMonth(today.getMonth() - 1);
                startDate = formatDate(last1Month);
                break;

            case 'last3Months':
                // 最近3個月
                const last3Months = new Date(today);
                last3Months.setMonth(today.getMonth() - 3);
                startDate = formatDate(last3Months);
                break;

            case 'last6Months':
                // 最近6個月
                const last6Months = new Date(today);
                last6Months.setMonth(today.getMonth() - 6);
                startDate = formatDate(last6Months);
                break;

            case 'last1Year':
                // 最近1年
                const last1Year = new Date(today);
                last1Year.setFullYear(today.getFullYear() - 1);
                startDate = formatDate(last1Year);
                break;

            case 'all':
                // 全部 - 返回 null 表示清空
                return null;

            default:
                return null;
        }

        return { start: startDate, end: endDate };
    }

    // 清除快速日期選擇狀態
    clearQuickDateSelection() {
        document.querySelectorAll('.quick-date-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // 初始化檢視模式切換
    initializeViewModeToggle() {
        const cardViewBtn = document.getElementById('view-mode-card');
        const listViewBtn = document.getElementById('view-mode-list');

        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => {
                this.switchViewMode('card');
            });
        }

        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.switchViewMode('list');
            });
        }
    }

    // 切換檢視模式
    switchViewMode(mode) {
        const cardViewBtn = document.getElementById('view-mode-card');
        const listViewBtn = document.getElementById('view-mode-list');

        // 更新按鈕狀態
        if (mode === 'card') {
            cardViewBtn?.classList.add('active');
            listViewBtn?.classList.remove('active');
        } else {
            listViewBtn?.classList.add('active');
            cardViewBtn?.classList.remove('active');
        }

        // 更新狀態
        this.stateManager.setViewMode(mode);

        // 重新渲染當前頁面
        const currentPage = this.stateManager.getState('currentPage');
        this.uiComponents.renderArticles(currentPage);
    }

    // 初始化深色模式切換
    initializeDarkModeToggle() {
        const darkModeToggle = document.getElementById('dark-mode-toggle');

        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
    }

    // 切換深色模式
    toggleDarkMode() {
        const currentDarkMode = this.stateManager.getState('darkMode');
        const newDarkMode = !currentDarkMode;

        // 更新狀態
        this.stateManager.updateState('darkMode', newDarkMode);

        // 應用深色模式
        this.applyDarkMode(newDarkMode);

        // 保存到 localStorage
        try {
            localStorage.setItem('darkMode', newDarkMode ? 'true' : 'false');
        } catch (e) {
            console.warn('無法保存深色模式偏好:', e);
        }

        console.log(`深色模式已${newDarkMode ? '開啟' : '關閉'}`);
    }

    // 應用深色模式
    applyDarkMode(isDark) {
        const htmlElement = document.documentElement;
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const icon = darkModeToggle?.querySelector('svg.icon');
        const text = darkModeToggle?.querySelector('.dark-mode-text');

        if (isDark) {
            // 啟用深色模式
            htmlElement.setAttribute('data-theme', 'dark');
            window.IconHelper.set(icon, 'sun');
            if (text) {
                text.textContent = '淺色模式';
            }
            if (darkModeToggle) {
                darkModeToggle.setAttribute('aria-label', '切換為淺色模式');
                darkModeToggle.setAttribute('title', '切換為淺色模式');
            }
        } else {
            // 停用深色模式
            htmlElement.removeAttribute('data-theme');
            window.IconHelper.set(icon, 'moon');
            if (text) {
                text.textContent = '深色模式';
            }
            if (darkModeToggle) {
                darkModeToggle.setAttribute('aria-label', '切換為深色模式');
                darkModeToggle.setAttribute('title', '切換為深色模式');
            }
        }
    }

    // 初始化導航相關事件
    initializeNavigationEvents() {
        const jumpButton = document.getElementById('jump-button');
        if (jumpButton) {
            jumpButton.addEventListener('click', () => this.handlePageJump());
        }
    }

    // 初始化圖表相關事件
    initializeChartEvents() {
        const cloudSizeSlider = document.getElementById('cloud-size-slider');

        if (cloudSizeSlider) {
            cloudSizeSlider.addEventListener('input', (e) => this.handleCloudSizeChange(e));
        }

        // 市場趨勢圖表呈現方式
        const chartTypeSelect = document.getElementById('chart-type-select');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', (e) => this.handleChartTypeChange(e));
        }

        // 甜甜圈圖月份滑桿
        this.initDoughnutSliderEvents();
    }

    // 初始化甜甜圈圖滑桿事件
    initDoughnutSliderEvents() {
        const slider = document.getElementById('doughnut-month-slider');
        const prevBtn = document.getElementById('doughnut-prev-month');
        const nextBtn = document.getElementById('doughnut-next-month');
        const showAllBtn = document.getElementById('doughnut-show-all');

        if (slider) {
            slider.addEventListener('input', (e) => {
                this.chartManager.updateDoughnutByMonth(parseInt(e.target.value));
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const slider = document.getElementById('doughnut-month-slider');
                if (slider && parseInt(slider.value) > parseInt(slider.min)) {
                    slider.value = parseInt(slider.value) - 1;
                    this.chartManager.updateDoughnutByMonth(parseInt(slider.value));
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const slider = document.getElementById('doughnut-month-slider');
                if (slider && parseInt(slider.value) < parseInt(slider.max)) {
                    slider.value = parseInt(slider.value) + 1;
                    this.chartManager.updateDoughnutByMonth(parseInt(slider.value));
                }
            });
        }

        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                const slider = document.getElementById('doughnut-month-slider');
                if (slider) {
                    slider.value = 0;
                    this.chartManager.updateDoughnutByMonth(0);
                }
            });
        }
    }

    // 處理圖表類型切換
    handleChartTypeChange(event) {
        const chartType = event.target.value;

        // 渲染新的圖表類型
        this.chartManager.renderExpectedTrendChart(chartType);
    }

    // 初始化滑桿事件
    // 篩選文章
    filterArticles() {
        const articlesData = this.stateManager.getState('articlesData');

        if (!articlesData || articlesData.length === 0) {
            return;
        }

        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const keywordFilterEl = document.getElementById('keyword-filter');
        const sortFieldEl = document.getElementById('sort-field');
        const sortDirectionBtn = document.getElementById('sort-direction-btn');

        const startDate = startDateEl ? startDateEl.value : '';
        const endDate = endDateEl ? endDateEl.value : '';
        const keyword = keywordFilterEl ? keywordFilterEl.value.trim().toLowerCase() : '';
        const selectedMedia = Array.from(document.querySelectorAll('.media-filter:checked')).map(el => el.value);
        const sortField = sortFieldEl ? sortFieldEl.value : 'date';
        const sortDirection = sortDirectionBtn ? sortDirectionBtn.dataset.direction : 'desc';
        // 點文字雲／關鍵詞長條加入的關鍵詞條件（與其他條件 AND）
        const cloudKeyword = this.stateManager.getState('selectedCloudKeyword') || '';

        // 驗證日期輸入
        if (startDate && !this.validator.isValidDate(startDate)) {
            this.showFilterError('開始日期格式無效');
            return;
        }
        if (endDate && !this.validator.isValidDate(endDate)) {
            this.showFilterError('結束日期格式無效');
            return;
        }

        // 驗證關鍵詞長度
        if (keyword) {
            const keywordResult = this.validator.validateKeyword(keyword);
            if (!keywordResult.valid) {
                this.showFilterError(keywordResult.error);
                return;
            }
        }

        // 生成快取鍵
        const filterParams = {
            startDate,
            endDate,
            keyword,
            cloudKeyword,
            selectedMedia: selectedMedia.sort(),
            sortField,
            sortDirection,
            dataHash: articlesData.length // 簡單的資料版本檢查
        };

        const cacheKey = this.cache.generateKey('filter', filterParams);

        // 檢查快取
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            this.applyFilterResult(cachedResult, { startDate, endDate, keyword, cloudKeyword, selectedMedia });
            return;
        }

        // 執行篩選
        const startDateObj = startDate ? new Date(startDate) : null;
        const endDateObj = endDate ? new Date(endDate) : null;

        const filteredArticles = articlesData.filter(article => {
            const articleDate = new Date(article.date);

            // 日期篩選邏輯修復
            let matchesDate = true;
            if (startDateObj && !isNaN(startDateObj.getTime())) {
                matchesDate = matchesDate && articleDate >= startDateObj;
            }
            if (endDateObj && !isNaN(endDateObj.getTime())) {
                matchesDate = matchesDate && articleDate <= endDateObj;
            }

            // 使用 SearchManager 進行關鍵字搜尋
            const matchesKeyword = keyword ?
                this.searchManager.matchesSearch(article, keyword) : true;
            const matchesMedia = selectedMedia.length === 0 || selectedMedia.includes(article.publisher);
            const matchesCloudKeyword = !cloudKeyword ||
                (Array.isArray(article.keywords) && article.keywords.includes(cloudKeyword));

            return matchesDate && matchesKeyword && matchesMedia && matchesCloudKeyword;
        });

        // 應用排序
        this.sortArticles(filteredArticles, sortField, sortDirection, keyword);

        // 存入快取（TTL 設為 5 分鐘）
        this.cache.set(cacheKey, filteredArticles, this.constants.CACHE.FILTER_TTL);

        this.applyFilterResult(filteredArticles, { startDate, endDate, keyword, cloudKeyword, selectedMedia });
    }

    // 套用篩選結果：篩選作用於整頁——統計、洞察、三張圖表與新聞列表一起更新
    applyFilterResult(articles, filters) {
        let result = articles;

        // 只看收藏（收藏會變動，不進快取）
        const bookmarkManager = window.bookmarkManager;
        if (this.stateManager.getState('bookmarkFilterActive') && bookmarkManager) {
            result = bookmarkManager.filterBookmarkedArticles(result);
        }

        this.stateManager.setFilteredArticles(result);
        this.stateManager.setCurrentPage(1);

        this.updateFilterResultCount(result.length);
        this.updateFilterTags(filters);

        this.uiComponents.renderArticles(1);
        this.uiComponents.renderPagination();

        this.updateSummaryForFilter(result);

        if (result.length === 0) {
            this.showEmptyCharts('此篩選條件沒有新聞');
            return;
        }

        this.initializeMonthSlider();
        this.chartManager.renderExpectedTrendChart();
        const cloudSize = document.getElementById('cloud-size-slider');
        this.chartManager.renderKeywordCloud(cloudSize ? parseInt(cloudSize.value) : undefined);
    }

    // 概況卡與洞察跟著篩選結果更新
    updateSummaryForFilter(articles) {
        if (articles.length === 0) {
            ['total-articles-count', 'keywords-count', 'publishers-count'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
            });
            const range = document.getElementById('date-range-display');
            if (range) range.textContent = '–';
            const content = document.getElementById('insights-content');
            if (content) content.innerHTML = '<p class="insights-empty">此篩選條件沒有新聞，請調整或清除篩選。</p>';
            const period = document.getElementById('insights-period');
            if (period) period.textContent = '';
            return;
        }
        if (window.csvUploader && window.csvUploader.updateDataSummary) {
            window.csvUploader.updateDataSummary(articles);
            const insightData = this.stateManager.getState('insightData');
            if (insightData) this.uiComponents.renderInsights(insightData);
        }
    }

    // 篩選結果為空時，三張圖表都改顯示提示，不退回顯示全部資料
    showEmptyCharts(message) {
        [['trendChart', 'trend'], ['expectedTrendChart', 'expectedTrendChart']].forEach(([key, canvasId]) => {
            const chart = this.stateManager.getState(key);
            if (chart) {
                chart.destroy();
                this.stateManager.updateState(key, null);
            }
            this.chartManager.showEmptyChart(canvasId, message);
        });
        this.chartManager.updateKeywordPeriod(message);
        if (this.chartManager.showEmptyWordCloud) this.chartManager.showEmptyWordCloud(message);
        const tbody = document.getElementById('keyword-rank-tbody');
        if (tbody) tbody.innerHTML = '';
    }

    updateFilterResultCount(count) {
        const newsCount = document.getElementById('news-count');
        if (newsCount) newsCount.textContent = count.toLocaleString();
        const countElement = document.getElementById('filtered-count');
        if (countElement) {
            countElement.textContent = count;

            // 添加動畫效果
            const badge = document.getElementById('filter-result-count');
            if (badge) {
                badge.classList.remove('pulse');
                // 強制重繪
                void badge.offsetWidth;
                badge.classList.add('pulse');
            }
        }
    }

    // 更新篩選標籤
    updateFilterTags(filters) {
        const tagsContainer = document.getElementById('active-filters-tags');
        const clearAllBtn = document.getElementById('clear-all-filters-btn');
        if (!tagsContainer) return;

        // 清空現有標籤
        while (tagsContainer.firstChild) {
            tagsContainer.removeChild(tagsContainer.firstChild);
        }

        let hasActiveFilters = false;

        // 日期篩選標籤
        if (filters.startDate) {
            this.addFilterTag(tagsContainer, '起始日期', filters.startDate, () => {
                document.getElementById('start-date').value = '';
                this.filterArticles();
            });
            hasActiveFilters = true;
        }

        if (filters.endDate) {
            this.addFilterTag(tagsContainer, '結束日期', filters.endDate, () => {
                document.getElementById('end-date').value = '';
                this.filterArticles();
            });
            hasActiveFilters = true;
        }

        // 關鍵字篩選標籤
        if (filters.keyword) {
            this.addFilterTag(tagsContainer, '關鍵字', filters.keyword, () => {
                document.getElementById('keyword-filter').value = '';
                this.filterArticles();
            });
            hasActiveFilters = true;
        }

        // 關鍵詞條件（點文字雲或關鍵詞長條加入）
        if (filters.cloudKeyword) {
            this.addFilterTag(tagsContainer, '關鍵詞', filters.cloudKeyword, () => {
                this.stateManager.updateState('selectedCloudKeyword', null);
                this.filterArticles();
            });
            hasActiveFilters = true;
        }

        // 媒體篩選標籤：如果有篩選（不是全選），顯示摘要標籤
        if (filters.selectedMedia && filters.selectedMedia.length > 0) {
            const allMediaCheckboxes = document.querySelectorAll('.media-filter');
            const allMediaCount = allMediaCheckboxes.length;

            // 只有在部分選擇時才顯示標籤（提示用戶在進階篩選中調整）
            if (filters.selectedMedia.length < allMediaCount) {
                this.addFilterTag(
                    tagsContainer,
                    '媒體篩選',
                    `已選 ${filters.selectedMedia.length}/${allMediaCount}`,
                    () => {
                        // 點擊移除時，全選所有媒體
                        document.querySelectorAll('.media-filter').forEach(cb => cb.checked = true);
                        this.filterArticles();
                    }
                );
                hasActiveFilters = true;
            }
        }

        // 有條件時才顯示標籤列（原本容器一直是 display:none，標籤看不到）
        const tagsWrap = document.getElementById('active-filters-container');
        if (tagsWrap) tagsWrap.style.display = hasActiveFilters ? 'flex' : 'none';

        // 顯示或隱藏「清除全部」按鈕
        if (clearAllBtn) {
            clearAllBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
        }
    }

    // 添加篩選標籤
    addFilterTag(container, label, value, onRemove) {
        const tag = document.createElement('span');
        tag.className = 'filter-tag';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = `${label}: ${value}`;
        tag.appendChild(labelSpan);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'filter-tag-remove';
        removeBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-x"></use></svg>';
        removeBtn.title = '移除此篩選條件';
        removeBtn.setAttribute('aria-label', `移除${label}篩選條件`);
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
        });

        tag.appendChild(removeBtn);
        container.appendChild(tag);
    }

    // 清除所有篩選條件
    clearAllFilters() {
        // 清除日期篩選
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        if (startDateEl) startDateEl.value = '';
        if (endDateEl) endDateEl.value = '';

        // 清除關鍵字篩選
        const keywordFilterEl = document.getElementById('keyword-filter');
        if (keywordFilterEl) keywordFilterEl.value = '';

        // 全選所有媒體
        document.querySelectorAll('.media-filter').forEach(cb => cb.checked = true);

        // 清除關鍵詞條件
        this.stateManager.updateState('selectedCloudKeyword', null);

        // 清除快速日期選擇
        this.clearQuickDateSelection();

        // 重新套用篩選
        this.filterArticles();
    }

    /**
     * 計算文章與搜尋詞的相關性分數
     * @param {Object} article - 文章物件
     * @param {string} searchTerm - 搜尋詞
     * @returns {number} - 相關性分數（越高越相關）
     */
    calculateRelevanceScore(article, searchTerm) {
        let score = 0;
        const term = searchTerm.toLowerCase();

        // 標題匹配（權重最高：50分）
        if (article.title && article.title.toLowerCase().includes(term)) {
            score += 50;
            // 完全匹配額外加分
            if (article.title.toLowerCase() === term) {
                score += 25;
            }
        }

        // 摘要匹配（權重：30分）
        if (article.summary && article.summary.toLowerCase().includes(term)) {
            score += 30;
        }

        // 關鍵詞匹配（權重：20分）
        if (article.keywords && Array.isArray(article.keywords)) {
            const matchedKeywords = article.keywords.filter(kw =>
                kw.toLowerCase().includes(term)
            );
            score += matchedKeywords.length * 20;

            // 完全匹配的關鍵詞額外加分
            if (article.keywords.some(kw => kw.toLowerCase() === term)) {
                score += 30;
            }
        }

        // 內文匹配（權重：10分）
        if (article.fullText && article.fullText.toLowerCase().includes(term)) {
            score += 10;
            // 計算出現次數（每次額外加1分，最多加10分）
            const occurrences = (article.fullText.toLowerCase().match(new RegExp(term, 'g')) || []).length;
            score += Math.min(occurrences, 10);
        }

        return score;
    }

    /**
     * 切換排序方向
     */
    toggleSortDirection() {
        const sortDirectionBtn = document.getElementById('sort-direction-btn');
        if (!sortDirectionBtn) return;

        const currentDirection = sortDirectionBtn.dataset.direction;
        const newDirection = currentDirection === 'desc' ? 'asc' : 'desc';

        sortDirectionBtn.dataset.direction = newDirection;

        // 更新圖示
        const icon = sortDirectionBtn.querySelector('svg.icon');
        if (icon) {
            if (newDirection === 'asc') {
                window.IconHelper.set(icon, 'sort-asc');
                sortDirectionBtn.title = '升序排列';
            } else {
                window.IconHelper.set(icon, 'sort-desc');
                sortDirectionBtn.title = '降序排列';
            }
        }
        const label = sortDirectionBtn.querySelector('.sort-direction-label');
        if (label) label.textContent = newDirection === 'asc' ? '遞增' : '遞減';
    }

    /**
     * 排序文章陣列
     * @param {Array} articles - 要排序的文章陣列
     * @param {string} sortField - 排序欄位
     * @param {string} sortDirection - 排序方向 ('asc' 或 'desc')
     * @param {string} keyword - 搜尋關鍵字（用於相關性排序）
     */
    sortArticles(articles, sortField, sortDirection, keyword = '') {
        const multiplier = sortDirection === 'desc' ? -1 : 1;

        articles.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'date':
                    comparison = new Date(b.date) - new Date(a.date);
                    break;

                case 'title':
                    comparison = a.title.localeCompare(b.title, 'zh-TW');
                    break;

                case 'publisher':
                    const publisherA = a.publisher || '';
                    const publisherB = b.publisher || '';
                    comparison = publisherA.localeCompare(publisherB, 'zh-TW');
                    break;

                case 'keywords-count':
                    const countA = Array.isArray(a.keywords) ? a.keywords.length : 0;
                    const countB = Array.isArray(b.keywords) ? b.keywords.length : 0;
                    comparison = countB - countA;
                    break;

                case 'trend':
                    // 預期走向排序：上漲 > 平穩 > 下跌 > 無相關 > 無法判斷
                    const trendOrder = {
                        '上漲': 5,
                        '平穩': 4,
                        '下跌': 3,
                        '無相關': 2,
                        '無法判斷': 1
                    };
                    const trendA = trendOrder[a['預期走向']] || 0;
                    const trendB = trendOrder[b['預期走向']] || 0;
                    comparison = trendB - trendA;
                    break;

                case 'relevance':
                    if (keyword) {
                        const scoreA = this.calculateRelevanceScore(a, keyword);
                        const scoreB = this.calculateRelevanceScore(b, keyword);
                        comparison = scoreB - scoreA;
                    } else {
                        // 如果沒有搜尋關鍵字，改用日期排序
                        comparison = new Date(b.date) - new Date(a.date);
                    }
                    break;

                default:
                    comparison = 0;
            }

            // 應用排序方向（相關性排序不受方向影響，始終降序）
            if (sortField === 'relevance') {
                return comparison;
            }
            return comparison * multiplier;
        });
    }

    // 處理頁面跳轉
    handlePageJump() {
        const jumpPageEl = document.getElementById('jump-page');
        const filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const articlesPerPage = this.stateManager.getState('articlesPerPage');

        if (!jumpPageEl) return;

        const maxPage = Math.ceil(filteredArticlesData.length / articlesPerPage);

        // 使用 Validator 驗證頁碼
        const validationResult = this.validator.validatePageNumber(jumpPageEl.value, maxPage);

        if (validationResult.valid) {
            const jumpPage = validationResult.value;
            this.stateManager.setCurrentPage(jumpPage);

            document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' });

            this.uiComponents.showLoading('正在載入頁面...');

            setTimeout(() => {
                this.uiComponents.renderArticles(jumpPage);
                this.uiComponents.renderPagination();
                this.uiComponents.hideLoading();
            }, 300);
        } else {
            this.showJumpPageError(maxPage, jumpPageEl, validationResult.error);
        }
    }

    // 顯示頁面跳轉錯誤
    showJumpPageError(maxPage, jumpPageEl, customError = null) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-warning mt-2';

        const icon = window.IconHelper.make('alert-triangle');
        errorMessage.appendChild(icon);

        const message = customError || `請輸入有效的頁碼（1-${maxPage}）！`;
        errorMessage.appendChild(document.createTextNode(` ${message}`));

        const container = jumpPageEl.closest('.form-row');
        if (!container) return;

        const existingError = container.querySelector('.alert');
        if (existingError) {
            existingError.remove();
        }

        container.appendChild(errorMessage);

        setTimeout(() => {
            errorMessage.style.opacity = '0';
            errorMessage.style.transition = 'opacity 0.5s';
            setTimeout(() => errorMessage.remove(), 500);
        }, 3000);
    }

    // 顯示篩選錯誤
    showFilterError(message) {
        const filtersContainer = document.querySelector('.filters');
        if (!filtersContainer) return;

        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-warning mt-2';

        const icon = window.IconHelper.make('alert-triangle');
        errorMessage.appendChild(icon);
        errorMessage.appendChild(document.createTextNode(` ${message}`));

        const existingError = filtersContainer.querySelector('.alert');
        if (existingError) {
            existingError.remove();
        }

        filtersContainer.appendChild(errorMessage);

        setTimeout(() => {
            errorMessage.style.opacity = '0';
            errorMessage.style.transition = 'opacity 0.5s';
            setTimeout(() => errorMessage.remove(), 500);
        }, 3000);
    }

    // 處理文字雲大小變更
    handleCloudSizeChange(event) {
        const value = event.target.value;
        const valueDisplay = document.getElementById('cloud-size-value');

        if (valueDisplay) {
            valueDisplay.textContent = value;
        }

        // 使用防抖來避免過於頻繁的重新渲染
        clearTimeout(this.cloudSizeChangeTimeout);
        this.cloudSizeChangeTimeout = setTimeout(() => {
            this.chartManager.renderKeywordCloud(parseInt(value));
        }, 500);
    }

    // 處理下一個月
    // 初始化月份滑桿
    initializeMonthSlider() {
        const filteredData = this.stateManager.getState('filteredArticlesData');
        const articlesData = this.stateManager.getState('articlesData');
        const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);

        if (months.length === 0) {
            console.warn('沒有可用的月份資料');
            return;
        }

        const formattedLabels = months.map(m => this.utilities.formatMonthDisplay(m));

        // 使用雙端滑桿
        this.chartManager.initializeDualRangeSlider(months, formattedLabels);

        // 初始渲染：預設「全部」期間
        this.chartManager.renderTrendChart(months[0], months[months.length - 1]);
    }

    // 根據月份數量動態調整滑桿寬度
    // 初始化趨勢模式切換
    initializeTrendModeToggle() {
        const singleMonthBtn = document.getElementById('single-month-mode');
        const multiMonthBtn = document.getElementById('multi-month-mode');
        const timeRangeBtn = document.getElementById('time-range-mode');
        const resetZoomBtn = document.getElementById('reset-chart-zoom');

        if (singleMonthBtn) {
            singleMonthBtn.addEventListener('click', () => this.switchTrendMode('single'));
        }
        if (multiMonthBtn) {
            multiMonthBtn.addEventListener('click', () => this.switchTrendMode('multi'));
        }
        if (timeRangeBtn) {
            timeRangeBtn.addEventListener('click', () => this.switchTrendMode('range'));
        }
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => this.chartManager.resetChartZoom());
        }

        // 多月選擇相關事件
        const applyMultiMonthBtn = document.getElementById('apply-multi-month');
        const clearMonthSelectionBtn = document.getElementById('clear-month-selection');

        if (applyMultiMonthBtn) {
            applyMultiMonthBtn.addEventListener('click', () => this.applyMultiMonthComparison());
        }
        if (clearMonthSelectionBtn) {
            clearMonthSelectionBtn.addEventListener('click', () => this.clearMonthSelection());
        }

        // 時間範圍相關事件
        const applyTimeRangeBtn = document.getElementById('apply-time-range');
        if (applyTimeRangeBtn) {
            applyTimeRangeBtn.addEventListener('click', () => this.applyTimeRangeFilter());
        }
    }

    // 切換趨勢模式
    switchTrendMode(mode) {
        const singleMonthControls = document.getElementById('keyword-trend-controls');
        const multiMonthControls = document.getElementById('multi-month-controls');
        const timeRangeControls = document.getElementById('time-range-controls');

        const singleMonthBtn = document.getElementById('single-month-mode');
        const multiMonthBtn = document.getElementById('multi-month-mode');
        const timeRangeBtn = document.getElementById('time-range-mode');

        // 隱藏所有控制區
        if (singleMonthControls) singleMonthControls.style.display = 'none';
        if (multiMonthControls) multiMonthControls.style.display = 'none';
        if (timeRangeControls) timeRangeControls.style.display = 'none';

        // 移除所有按鈕的活動狀態
        singleMonthBtn?.classList.remove('active');
        multiMonthBtn?.classList.remove('active');
        timeRangeBtn?.classList.remove('active');

        [singleMonthBtn, multiMonthBtn, timeRangeBtn].forEach(b => b?.setAttribute('aria-pressed', 'false'));
        ({ single: singleMonthBtn, multi: multiMonthBtn, range: timeRangeBtn })[mode]?.setAttribute('aria-pressed', 'true');

        // 根據模式顯示相應控制區
        switch (mode) {
            case 'single':
                if (singleMonthControls) singleMonthControls.style.display = 'block';
                singleMonthBtn?.classList.add('active');
                // 恢復期間排行（目前滑桿範圍）
                if (this.chartManager.renderCurrentKeywordRange) this.chartManager.renderCurrentKeywordRange();
                break;

            case 'multi':
                if (multiMonthControls) multiMonthControls.style.display = 'block';
                multiMonthBtn?.classList.add('active');
                // 生成月份複選框
                this.generateMonthCheckboxes();
                break;

            case 'range':
                if (timeRangeControls) timeRangeControls.style.display = 'block';
                timeRangeBtn?.classList.add('active');
                // 填充時間範圍下拉選單
                this.populateTimeRangeSelectors();
                break;
        }
    }

    // 生成月份複選框
    generateMonthCheckboxes() {
        const container = document.getElementById('month-checkboxes');
        if (!container) return;

        const filteredData = this.stateManager.getState('filteredArticlesData');
        const articlesData = this.stateManager.getState('articlesData');
        const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);

        if (!months || months.length === 0) {
            container.innerHTML = '<p class="text-muted">目前沒有可用的月份資料</p>';
            return;
        }

        // 清空容器
        container.innerHTML = '';

        // 為每個月份創建複選框
        months.forEach(month => {
            const item = document.createElement('div');
            item.className = 'month-checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `month-${month}`;
            checkbox.value = month;
            checkbox.className = 'month-checkbox';

            const label = document.createElement('label');
            label.htmlFor = `month-${month}`;
            label.className = 'month-checkbox-label';
            label.textContent = this.utilities.formatMonthDisplay(month);

            // 限制最多選擇 5 個月份
            checkbox.addEventListener('change', (e) => {
                const checkedCount = container.querySelectorAll('.month-checkbox:checked').length;
                if (checkedCount > 5) {
                    e.target.checked = false;
                    alert('最多只能選擇 5 個月份進行比較');
                }
            });

            item.appendChild(checkbox);
            item.appendChild(label);
            container.appendChild(item);
        });
    }

    // 套用多月比較
    applyMultiMonthComparison() {
        const container = document.getElementById('month-checkboxes');
        if (!container) return;

        const checkedBoxes = container.querySelectorAll('.month-checkbox:checked');
        const selectedMonths = Array.from(checkedBoxes).map(cb => cb.value);

        if (selectedMonths.length === 0) {
            alert('請至少選擇一個月份');
            return;
        }

        if (selectedMonths.length === 1) {
            // 如果只選擇一個月份，使用單月圖表
            this.chartManager.renderTrendChart(selectedMonths[0]);

            // 更新說明文字
            const descriptionText = document.getElementById('trend-description-text');
            if (descriptionText) {
                descriptionText.textContent = '點擊長條可篩選含該關鍵詞的新聞';
            }
        } else {
            // 多個月份使用比較圖表
            this.chartManager.renderMultiMonthComparisonChart(selectedMonths);
        }
    }

    // 清除月份選擇
    clearMonthSelection() {
        const container = document.getElementById('month-checkboxes');
        if (!container) return;

        const checkboxes = container.querySelectorAll('.month-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
    }

    // 填充時間範圍選擇器
    populateTimeRangeSelectors() {
        const startSelect = document.getElementById('trend-start-month');
        const endSelect = document.getElementById('trend-end-month');

        if (!startSelect || !endSelect) return;

        const filteredData = this.stateManager.getState('filteredArticlesData');
        const articlesData = this.stateManager.getState('articlesData');
        const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);

        if (!months || months.length === 0) {
            startSelect.innerHTML = '<option value="">沒有可用資料</option>';
            endSelect.innerHTML = '<option value="">沒有可用資料</option>';
            return;
        }

        // 清空現有選項
        startSelect.innerHTML = '<option value="">請選擇...</option>';
        endSelect.innerHTML = '<option value="">請選擇...</option>';

        // 添加月份選項
        months.forEach(month => {
            const startOption = document.createElement('option');
            startOption.value = month;
            startOption.textContent = this.utilities.formatMonthDisplay(month);
            startSelect.appendChild(startOption);

            const endOption = document.createElement('option');
            endOption.value = month;
            endOption.textContent = this.utilities.formatMonthDisplay(month);
            endSelect.appendChild(endOption);
        });

        // 預設選擇第一個和最後一個月份
        if (months.length > 0) {
            startSelect.value = months[0];
            endSelect.value = months[months.length - 1];
        }
    }

    // 套用時間範圍篩選
    applyTimeRangeFilter() {
        const startSelect = document.getElementById('trend-start-month');
        const endSelect = document.getElementById('trend-end-month');

        if (!startSelect || !endSelect) return;

        const startMonth = startSelect.value;
        const endMonth = endSelect.value;

        if (!startMonth || !endMonth) {
            alert('請選擇起始和結束月份');
            return;
        }

        this.chartManager.renderTimeRangeTrendChart(startMonth, endMonth);
    }
}

// 導出供其他模組使用
window.EventHandlers = EventHandlers;