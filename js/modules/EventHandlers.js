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
     */
    constructor(stateManager, uiComponents, chartManager, utilities) {
        this.stateManager = stateManager;
        this.uiComponents = uiComponents;
        this.chartManager = chartManager;
        this.utilities = utilities;
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
        this.initializeContentToggleEvents();
        this.initializeSliderEvents();
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
        const sortOptionsEl = document.getElementById('sort-options');

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
        if (sortOptionsEl) {
            sortOptionsEl.addEventListener('change', () => this.filterArticles());
        }

        // 媒體篩選按鈕
        document.querySelectorAll('.media-filter').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.filterArticles());
        });
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
        const icon = darkModeToggle?.querySelector('i');
        const text = darkModeToggle?.querySelector('.dark-mode-text');

        if (isDark) {
            // 啟用深色模式
            htmlElement.setAttribute('data-theme', 'dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
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
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
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
        const showKeywordTrendBtn = document.getElementById('showKeywordTrend');
        const showExpectedTrendBtn = document.getElementById('showExpectedTrend');
        const showKeywordCloudBtn = document.getElementById('showKeywordCloud');
        const toggleChartTypeBtn = document.getElementById('toggleChartType');
        const cloudSizeSlider = document.getElementById('cloud-size-slider');

        if (showKeywordTrendBtn) {
            showKeywordTrendBtn.addEventListener('click', (e) => this.handleShowKeywordTrend(e));
        }
        if (showExpectedTrendBtn) {
            showExpectedTrendBtn.addEventListener('click', (e) => this.handleShowExpectedTrend(e));
        }
        if (showKeywordCloudBtn) {
            showKeywordCloudBtn.addEventListener('click', (e) => this.handleShowKeywordCloud(e));
        }
        if (toggleChartTypeBtn) {
            toggleChartTypeBtn.addEventListener('click', () => this.chartManager.toggleChartType());
        }
        if (cloudSizeSlider) {
            cloudSizeSlider.addEventListener('input', (e) => this.handleCloudSizeChange(e));
        }
    }

    // 初始化內容切換事件
    initializeContentToggleEvents() {
        const toggleNewsButton = document.getElementById('toggle-news-button');
        if (toggleNewsButton) {
            toggleNewsButton.addEventListener('click', () => this.handleNewsToggle());
        }
    }

    // 初始化滑桿事件
    initializeSliderEvents() {
        const monthSlider = document.getElementById('month-slider');
        const prevButton = document.getElementById('prev-month');
        const nextButton = document.getElementById('next-month');

        if (monthSlider) {
            monthSlider.addEventListener('input', () => this.handleSliderChange());
        }
        if (prevButton) {
            prevButton.addEventListener('click', () => this.handlePrevMonth());
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => this.handleNextMonth());
        }
    }

    // 篩選文章
    filterArticles() {
        const articlesData = this.stateManager.getState('articlesData');

        if (!articlesData || articlesData.length === 0) {
            return;
        }

        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const keywordFilterEl = document.getElementById('keyword-filter');
        const sortOptionsEl = document.getElementById('sort-options');

        const startDate = startDateEl ? startDateEl.value : '';
        const endDate = endDateEl ? endDateEl.value : '';
        const keyword = keywordFilterEl ? keywordFilterEl.value.trim().toLowerCase() : '';
        const selectedMedia = Array.from(document.querySelectorAll('.media-filter:checked')).map(el => el.value);
        const sortOption = sortOptionsEl ? sortOptionsEl.value : 'date-desc';

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
            selectedMedia: selectedMedia.sort(),
            sortOption,
            dataHash: articlesData.length // 簡單的資料版本檢查
        };

        const cacheKey = this.cache.generateKey('filter', filterParams);

        // 檢查快取
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            console.log('使用快取的篩選結果');
            this.stateManager.setFilteredArticles(cachedResult);
            this.stateManager.setCurrentPage(1);

            // 更新篩選結果數量和標籤（即使使用快取也要更新）
            this.updateFilterResultCount(cachedResult.length);
            this.updateFilterTags({
                startDate,
                endDate,
                keyword,
                selectedMedia
            });

            this.uiComponents.renderArticles(1);
            this.uiComponents.renderPagination();
            this.initializeMonthSlider();
            this.chartManager.renderExpectedTrendChart();
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

            const matchesKeyword = keyword ?
                (article.keywords && Array.isArray(article.keywords) && article.keywords.some(kw => kw.toLowerCase().includes(keyword))) : true;
            const matchesMedia = selectedMedia.length === 0 || selectedMedia.includes(article.publisher);

            return matchesDate && matchesKeyword && matchesMedia;
        });

        // 應用排序
        filteredArticles.sort((a, b) => {
            if (sortOption === 'date-desc') {
                return new Date(b.date) - new Date(a.date);
            } else if (sortOption === 'date-asc') {
                return new Date(a.date) - new Date(b.date);
            } else if (sortOption === 'title-asc') {
                return a.title.localeCompare(b.title);
            } else if (sortOption === 'title-desc') {
                return b.title.localeCompare(a.title);
            }
            return 0;
        });

        // 存入快取（TTL 設為 5 分鐘）
        this.cache.set(cacheKey, filteredArticles, this.constants.CACHE.FILTER_TTL);

        this.stateManager.setFilteredArticles(filteredArticles);
        this.stateManager.setCurrentPage(1);

        // 更新篩選結果數量
        this.updateFilterResultCount(filteredArticles.length);

        // 更新篩選標籤
        this.updateFilterTags({
            startDate,
            endDate,
            keyword,
            selectedMedia
        });

        this.uiComponents.renderArticles(1);
        this.uiComponents.renderPagination();

        this.initializeMonthSlider();
        this.chartManager.renderExpectedTrendChart();
    }

    // 更新篩選結果數量顯示
    updateFilterResultCount(count) {
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
        if (!tagsContainer) return;

        // 清空現有標籤
        while (tagsContainer.firstChild) {
            tagsContainer.removeChild(tagsContainer.firstChild);
        }

        // 日期篩選標籤
        if (filters.startDate) {
            this.addFilterTag(tagsContainer, '起始日期', filters.startDate, () => {
                document.getElementById('start-date').value = '';
                this.filterArticles();
            });
        }

        if (filters.endDate) {
            this.addFilterTag(tagsContainer, '結束日期', filters.endDate, () => {
                document.getElementById('end-date').value = '';
                this.filterArticles();
            });
        }

        // 關鍵字篩選標籤
        if (filters.keyword) {
            this.addFilterTag(tagsContainer, '關鍵字', filters.keyword, () => {
                document.getElementById('keyword-filter').value = '';
                this.filterArticles();
            });
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
                    `已選 ${filters.selectedMedia.length}/${allMediaCount}（在進階篩選中調整）`,
                    () => {
                        // 點擊移除時，全選所有媒體
                        document.querySelectorAll('.media-filter').forEach(cb => cb.checked = true);
                        this.filterArticles();
                    }
                );
            }
        }
    }

    // 添加篩選標籤
    addFilterTag(container, label, value, onRemove) {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = `${label}: ${value}`;
        tag.appendChild(labelSpan);

        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-filter';
        removeIcon.textContent = '×';
        removeIcon.title = '移除此篩選條件';
        removeIcon.addEventListener('click', onRemove);

        tag.appendChild(removeIcon);
        container.appendChild(tag);
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

        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
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

        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
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

    // 處理顯示關鍵詞趨勢
    handleShowKeywordTrend(event) {
        const keywordTrendContainer = document.getElementById('keywordTrendContainer');
        const expectedTrendContainer = document.getElementById('expectedTrendContainer');
        const keywordCloudContainer = document.getElementById('keywordCloudContainer');

        if (!keywordTrendContainer || !expectedTrendContainer) return;

        this.uiComponents.showLoading('正在載入關鍵詞趨勢分析...');

        setTimeout(() => {
            // 隱藏其他容器
            if (keywordCloudContainer && keywordCloudContainer.style.display !== 'none') {
                keywordCloudContainer.style.display = 'none';
            }

            if (expectedTrendContainer.style.display !== 'none') {
                this.switchChartContainers(expectedTrendContainer, keywordTrendContainer, () => {
                    this.updateChartButtons(event.target, 'showExpectedTrend', 'showKeywordCloud');
                    this.restoreMonthSliderState();
                });
            } else {
                this.showChartContainer(keywordTrendContainer);
                this.updateChartButtons(event.target, 'showExpectedTrend', 'showKeywordCloud');
                this.adjustSliderForKeywordTrend();
            }
        }, 300);
    }

    // 處理顯示預期趨勢
    handleShowExpectedTrend(event) {
        const keywordTrendContainer = document.getElementById('keywordTrendContainer');
        const expectedTrendContainer = document.getElementById('expectedTrendContainer');
        const keywordCloudContainer = document.getElementById('keywordCloudContainer');

        if (!keywordTrendContainer || !expectedTrendContainer) return;

        this.uiComponents.showLoading('正在載入市場趨勢分佈...');

        this.saveCurrentMonthSliderState();

        setTimeout(() => {
            // 隱藏其他容器
            if (keywordCloudContainer && keywordCloudContainer.style.display !== 'none') {
                keywordCloudContainer.style.display = 'none';
            }

            if (keywordTrendContainer.style.display !== 'none') {
                this.switchChartContainers(keywordTrendContainer, expectedTrendContainer, () => {
                    this.updateChartButtons(event.target, 'showKeywordTrend', 'showKeywordCloud');
                    this.chartManager.renderExpectedTrendChart();
                });
            } else {
                this.showChartContainer(expectedTrendContainer);
                this.updateChartButtons(event.target, 'showKeywordTrend', 'showKeywordCloud');
                this.chartManager.renderExpectedTrendChart();
            }
        }, 300);
    }

    // 處理顯示關鍵詞文字雲
    handleShowKeywordCloud(event) {
        const keywordTrendContainer = document.getElementById('keywordTrendContainer');
        const expectedTrendContainer = document.getElementById('expectedTrendContainer');
        const keywordCloudContainer = document.getElementById('keywordCloudContainer');

        if (!keywordCloudContainer) return;

        this.uiComponents.showLoading('正在載入關鍵詞文字雲...');

        this.saveCurrentMonthSliderState();

        setTimeout(() => {
            // 隱藏其他容器
            if (keywordTrendContainer && keywordTrendContainer.style.display !== 'none') {
                keywordTrendContainer.style.display = 'none';
            }
            if (expectedTrendContainer && expectedTrendContainer.style.display !== 'none') {
                expectedTrendContainer.style.display = 'none';
            }

            // 顯示文字雲容器
            this.showChartContainer(keywordCloudContainer);
            this.updateChartButtons(event.target, 'showKeywordTrend', 'showExpectedTrend');

            // 取得當前滑桿值
            const cloudSizeSlider = document.getElementById('cloud-size-slider');
            const topN = cloudSizeSlider ? parseInt(cloudSizeSlider.value) : 50;

            // 渲染文字雲
            this.chartManager.renderKeywordCloud(topN);
        }, 300);
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

    // 切換圖表容器
    switchChartContainers(hideContainer, showContainer, callback) {
        hideContainer.classList.add('animate__animated', 'animate__fadeOut');
        
        setTimeout(() => {
            hideContainer.style.display = 'none';
            hideContainer.classList.remove('animate__animated', 'animate__fadeOut');
            
            showContainer.style.display = 'block';
            showContainer.classList.add('animate__animated', 'animate__fadeIn');
            
            this.uiComponents.hideLoading();
            
            if (callback) {
                setTimeout(callback, 100);
            }
        }, 300);
    }

    // 顯示圖表容器
    showChartContainer(container) {
        container.style.display = 'block';
        container.classList.add('animate__animated', 'animate__fadeIn');
        this.uiComponents.hideLoading();
    }

    // 更新圖表按鈕狀態
    updateChartButtons(activeButton, ...inactiveButtonIds) {
        // 添加活躍狀態
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-pressed', 'true');

        // 移除所有不活躍按鈕的活躍狀態
        inactiveButtonIds.forEach(buttonId => {
            const inactiveButton = document.getElementById(buttonId);
            if (inactiveButton) {
                inactiveButton.classList.remove('active');
                inactiveButton.setAttribute('aria-pressed', 'false');
            }
        });

        // 更新 ARIA 屬性
        if (this.accessibilityManager) {
            this.accessibilityManager.updateChartButtonsAria(activeButton.id);
        }
    }

    // 儲存當前月份滑桿狀態
    saveCurrentMonthSliderState() {
        const monthSlider = document.getElementById('month-slider');
        const selectedMonth = document.getElementById('selected-month');
        
        if (monthSlider && selectedMonth) {
            this.stateManager.saveMonthSliderState(monthSlider.value, selectedMonth.textContent);
        }
    }

    // 恢復月份滑桿狀態
    restoreMonthSliderState() {
        const savedState = this.stateManager.getState('savedMonthSliderState');
        
        if (savedState) {
            const monthSlider = document.getElementById('month-slider');
            const selectedMonthLabel = document.getElementById('selected-month');
            
            if (monthSlider && selectedMonthLabel) {
                const filteredData = this.stateManager.getState('filteredArticlesData');
                const articlesData = this.stateManager.getState('articlesData');
                const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);
                
                if (months && months.length > 0) {
                    this.adjustSliderWidth(months.length);
                    
                    if (savedState.value <= monthSlider.max) {
                        monthSlider.value = savedState.value;
                        selectedMonthLabel.textContent = savedState.month;
                    }
                }
                
                this.chartManager.renderTrendChart(selectedMonthLabel.textContent);
            }
        }
    }

    // 調整關鍵詞趨勢的滑桿
    adjustSliderForKeywordTrend() {
        const filteredData = this.stateManager.getState('filteredArticlesData');
        const articlesData = this.stateManager.getState('articlesData');
        const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);
        
        if (months && months.length > 0) {
            this.adjustSliderWidth(months.length);
        }
        
        this.uiComponents.hideLoading();
    }

    // 處理新聞內容切換
    handleNewsToggle() {
        const toggleNewsButton = document.getElementById('toggle-news-button');
        const newsContent = document.getElementById('news-content');
        
        if (!toggleNewsButton || !newsContent) return;
        
        if (newsContent.classList.contains('collapse')) {
            this.showNewsContent(newsContent, toggleNewsButton);
        } else {
            this.hideNewsContent(newsContent, toggleNewsButton);
        }
    }

    // 顯示新聞內容
    showNewsContent(newsContent, toggleButton) {
        newsContent.classList.remove('collapse');
        newsContent.style.maxHeight = '0';
        newsContent.style.overflow = 'hidden';
        newsContent.style.transition = 'max-height 0.5s ease-in-out';

        setTimeout(() => {
            newsContent.style.maxHeight = newsContent.scrollHeight + 'px';

            setTimeout(() => {
                newsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });

                setTimeout(() => {
                    newsContent.style.maxHeight = '';
                    newsContent.style.overflow = '';
                }, 500);
            }, 300);
        }, 10);

        // 安全地更新按鈕內容
        while (toggleButton.firstChild) {
            toggleButton.removeChild(toggleButton.firstChild);
        }
        const icon = document.createElement('i');
        icon.className = 'fas fa-times-circle';
        icon.setAttribute('aria-hidden', 'true');
        toggleButton.appendChild(icon);
        toggleButton.appendChild(document.createTextNode(' 隱藏新聞內容'));

        // 更新 ARIA 屬性
        if (this.accessibilityManager) {
            this.accessibilityManager.updateNewsToggleAria(true);
        }
    }

    // 隱藏新聞內容
    hideNewsContent(newsContent, toggleButton) {
        newsContent.style.maxHeight = newsContent.scrollHeight + 'px';
        newsContent.style.overflow = 'hidden';
        newsContent.style.transition = 'max-height 0.5s ease-in-out';

        setTimeout(() => {
            newsContent.style.maxHeight = '0';

            setTimeout(() => {
                newsContent.classList.add('collapse');
                newsContent.style.maxHeight = '';
                newsContent.style.overflow = '';
            }, 500);
        }, 10);

        // 安全地更新按鈕內容
        while (toggleButton.firstChild) {
            toggleButton.removeChild(toggleButton.firstChild);
        }
        const icon = document.createElement('i');
        icon.className = 'fas fa-newspaper';
        icon.setAttribute('aria-hidden', 'true');
        toggleButton.appendChild(icon);
        toggleButton.appendChild(document.createTextNode(' 顯示新聞內容'));

        // 更新 ARIA 屬性
        if (this.accessibilityManager) {
            this.accessibilityManager.updateNewsToggleAria(false);
        }
    }

    // 處理滑桿變化
    handleSliderChange() {
        const monthSlider = document.getElementById('month-slider');
        const selectedMonthLabel = document.getElementById('selected-month');

        if (!monthSlider || !selectedMonthLabel) return;

        const filteredData = this.stateManager.getState('filteredArticlesData');
        const articlesData = this.stateManager.getState('articlesData');
        const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);

        if (months && months.length > monthSlider.value) {
            const monthText = months[monthSlider.value];
            const formattedMonth = this.utilities.formatMonthDisplay(monthText);

            selectedMonthLabel.textContent = formattedMonth;
            this.chartManager.renderTrendChart(monthText);

            // 更新月份滑動器的 ARIA 屬性
            if (this.accessibilityManager) {
                this.accessibilityManager.updateMonthSliderAria(
                    parseInt(monthSlider.value),
                    0,
                    parseInt(monthSlider.max),
                    formattedMonth
                );
            }
        }
    }

    // 處理上一個月
    handlePrevMonth() {
        const monthSlider = document.getElementById('month-slider');
        if (monthSlider && monthSlider.value > 0) {
            monthSlider.value--;
            this.handleSliderChange();
        }
    }

    // 處理下一個月
    handleNextMonth() {
        const monthSlider = document.getElementById('month-slider');
        if (monthSlider && monthSlider.value < monthSlider.max) {
            monthSlider.value++;
            this.handleSliderChange();
        }
    }

    // 初始化月份滑桿
    initializeMonthSlider() {
        const filteredData = this.stateManager.getState('filteredArticlesData');
        const articlesData = this.stateManager.getState('articlesData');
        const months = this.utilities.getMonthRange(filteredData.length > 0 ? filteredData : articlesData);
        
        if (months.length === 0) {
            console.warn('沒有可用的月份資料');
            return;
        }
        
        const monthSlider = document.getElementById('month-slider');
        const selectedMonthLabel = document.getElementById('selected-month');
        
        if (!monthSlider || !selectedMonthLabel) return;
        
        this.adjustSliderWidth(months.length);

        monthSlider.min = 0;
        monthSlider.max = months.length - 1;
        monthSlider.value = 0;
        selectedMonthLabel.textContent = months[monthSlider.value];

        this.chartManager.renderTrendChart(months[monthSlider.value]);
    }

    // 根據月份數量動態調整滑桿寬度
    adjustSliderWidth(monthCount) {
        const monthSlider = document.getElementById('month-slider');
        if (!monthSlider) return;

        let width;

        if (monthCount <= 3) {
            width = '30%';
        } else if (monthCount <= 6) {
            width = '45%';
        } else if (monthCount <= 12) {
            width = '60%';
        } else if (monthCount <= 24) {
            width = '75%';
        } else {
            width = '85%';
        }

        monthSlider.style.width = width;
        console.log(`根據 ${monthCount} 個月份調整滑桿寬度為 ${width}`);
    }

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
        const singleMonthControls = document.getElementById('single-month-controls');
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

        // 根據模式顯示相應控制區
        switch (mode) {
            case 'single':
                if (singleMonthControls) singleMonthControls.style.display = 'block';
                singleMonthBtn?.classList.add('active');
                // 恢復單月圖表
                this.handleSliderChange();
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
                descriptionText.textContent = `此圖表顯示選定月份中出現頻率最高的關鍵詞`;
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