// EventHandlers.js - 事件處理模組
class EventHandlers {
    constructor(stateManager, uiComponents, chartManager, utilities) {
        this.stateManager = stateManager;
        this.uiComponents = uiComponents;
        this.chartManager = chartManager;
        this.utilities = utilities;
        this.cache = window.CacheManager;
        this.constants = window.Constants;
        this.validator = window.Validator;

        this.initializeEventListeners();
    }

    // 初始化所有事件監聽器
    initializeEventListeners() {
        this.initializeFilterEvents();
        this.initializeNavigationEvents();
        this.initializeChartEvents();
        this.initializeContentToggleEvents();
        this.initializeSliderEvents();
        this.initializeFileUploadLabel();
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
            startDateEl.addEventListener('change', this.utilities.debounce(() => this.filterArticles(), this.constants.UI.DATE_FILTER_DEBOUNCE));
        }
        if (endDateEl) {
            endDateEl.addEventListener('change', this.utilities.debounce(() => this.filterArticles(), this.constants.UI.DATE_FILTER_DEBOUNCE));
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
        const toggleChartTypeBtn = document.getElementById('toggleChartType');

        if (showKeywordTrendBtn) {
            showKeywordTrendBtn.addEventListener('click', (e) => this.handleShowKeywordTrend(e));
        }
        if (showExpectedTrendBtn) {
            showExpectedTrendBtn.addEventListener('click', (e) => this.handleShowExpectedTrend(e));
        }
        if (toggleChartTypeBtn) {
            toggleChartTypeBtn.addEventListener('click', () => this.chartManager.toggleChartType());
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

        this.uiComponents.renderArticles(1);
        this.uiComponents.renderPagination();

        this.initializeMonthSlider();
        this.chartManager.renderExpectedTrendChart();
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
        
        if (!keywordTrendContainer || !expectedTrendContainer) return;
        
        this.uiComponents.showLoading('正在載入關鍵詞趨勢分析...');
        
        setTimeout(() => {
            if (expectedTrendContainer.style.display !== 'none') {
                this.switchChartContainers(expectedTrendContainer, keywordTrendContainer, () => {
                    this.updateChartButtons(event.target, 'showExpectedTrend');
                    this.restoreMonthSliderState();
                });
            } else {
                this.showChartContainer(keywordTrendContainer);
                this.updateChartButtons(event.target, 'showExpectedTrend');
                this.adjustSliderForKeywordTrend();
            }
        }, 300);
    }

    // 處理顯示預期趨勢
    handleShowExpectedTrend(event) {
        const keywordTrendContainer = document.getElementById('keywordTrendContainer');
        const expectedTrendContainer = document.getElementById('expectedTrendContainer');
        
        if (!keywordTrendContainer || !expectedTrendContainer) return;
        
        this.uiComponents.showLoading('正在載入市場趨勢分佈...');
        
        this.saveCurrentMonthSliderState();
        
        setTimeout(() => {
            if (keywordTrendContainer.style.display !== 'none') {
                this.switchChartContainers(keywordTrendContainer, expectedTrendContainer, () => {
                    this.updateChartButtons(event.target, 'showKeywordTrend');
                    this.chartManager.renderExpectedTrendChart();
                });
            } else {
                this.showChartContainer(expectedTrendContainer);
                this.updateChartButtons(event.target, 'showKeywordTrend');
                this.chartManager.renderExpectedTrendChart();
            }
        }, 300);
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
    updateChartButtons(activeButton, inactiveButtonId) {
        activeButton.classList.add('btn-primary');
        activeButton.classList.remove('btn-secondary');
        
        const inactiveButton = document.getElementById(inactiveButtonId);
        if (inactiveButton) {
            inactiveButton.classList.add('btn-secondary');
            inactiveButton.classList.remove('btn-primary');
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
        toggleButton.appendChild(icon);
        toggleButton.appendChild(document.createTextNode(' 隱藏新聞內容'));
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
        toggleButton.appendChild(icon);
        toggleButton.appendChild(document.createTextNode(' 顯示新聞內容'));
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
            selectedMonthLabel.textContent = months[monthSlider.value];
            this.chartManager.renderTrendChart(months[monthSlider.value]);
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
}

// 導出供其他模組使用
window.EventHandlers = EventHandlers;