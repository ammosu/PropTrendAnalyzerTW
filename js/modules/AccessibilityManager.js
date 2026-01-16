/**
 * AccessibilityManager.js - 無障礙性管理模組
 *
 * 提供鍵盤導航、焦點管理、ARIA 實時更新等無障礙性功能
 *
 * @class AccessibilityManager
 * @description 管理應用程式的無障礙性功能，包括鍵盤快捷鍵、焦點陷阱等
 */
class AccessibilityManager {
    /**
     * 建立 AccessibilityManager 實例
     * @constructor
     * @param {StateManager} stateManager - 狀態管理器實例
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.modalFocusTrap = null;
        this.previousFocusedElement = null;

        this.initializeKeyboardNavigation();
        this.initializeAriaLiveRegions();
    }

    /**
     * 初始化鍵盤導航
     */
    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyPress(event);
        });

        console.log('AccessibilityManager: 鍵盤導航已初始化');
    }

    /**
     * 處理全域鍵盤事件
     * @param {KeyboardEvent} event - 鍵盤事件
     */
    handleGlobalKeyPress(event) {
        // Escape 鍵關閉 Modal
        if (event.key === 'Escape') {
            this.handleEscapeKey(event);
        }

        // 快捷鍵：Ctrl/Cmd + K 跳轉到搜尋
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.focusSearchInput();
        }

        // 快捷鍵：Ctrl/Cmd + / 顯示快捷鍵幫助
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            this.showKeyboardShortcutsHelp();
        }
    }

    /**
     * 處理 Escape 鍵
     * @param {KeyboardEvent} event - 鍵盤事件
     */
    handleEscapeKey(event) {
        // 關閉打開的 Modal
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const closeButton = openModal.querySelector('[data-dismiss="modal"]');
            if (closeButton) {
                closeButton.click();
            }
        }

        // 關閉展開的折疊區域
        const expandedCollapse = document.querySelector('.collapse.show');
        if (expandedCollapse) {
            const toggleButton = document.querySelector(`[data-target="#${expandedCollapse.id}"]`);
            if (toggleButton) {
                toggleButton.click();
            }
        }
    }

    /**
     * 聚焦到搜尋輸入框
     */
    focusSearchInput() {
        const keywordFilter = document.getElementById('keyword-filter');
        if (keywordFilter) {
            keywordFilter.focus();
            this.announceToScreenReader('已聚焦到關鍵字搜尋框');
        }
    }

    /**
     * 顯示鍵盤快捷鍵幫助
     */
    showKeyboardShortcutsHelp() {
        const shortcuts = [
            { keys: 'Ctrl/Cmd + K', description: '跳轉到搜尋' },
            { keys: 'Ctrl/Cmd + /', description: '顯示快捷鍵幫助' },
            { keys: 'Escape', description: '關閉彈出視窗或折疊區域' },
            { keys: 'Tab', description: '前往下一個元素' },
            { keys: 'Shift + Tab', description: '前往上一個元素' },
            { keys: 'Enter', description: '啟動按鈕或連結' },
            { keys: 'Space', description: '啟動按鈕' },
            { keys: '方向鍵', description: '調整滑桿或選擇選項' }
        ];

        let helpText = '鍵盤快捷鍵：\n\n';
        shortcuts.forEach(shortcut => {
            helpText += `${shortcut.keys}: ${shortcut.description}\n`;
        });

        alert(helpText);
    }

    /**
     * 初始化 ARIA 實時區域
     */
    initializeAriaLiveRegions() {
        // 確保上傳狀態區域有 aria-live 屬性
        const uploadStatus = document.getElementById('upload-status');
        if (uploadStatus && !uploadStatus.hasAttribute('aria-live')) {
            uploadStatus.setAttribute('aria-live', 'polite');
            uploadStatus.setAttribute('aria-atomic', 'true');
        }

        // 確保選定月份標籤有 aria-live 屬性
        const selectedMonth = document.getElementById('selected-month');
        if (selectedMonth && !selectedMonth.hasAttribute('aria-live')) {
            selectedMonth.setAttribute('aria-live', 'polite');
            selectedMonth.setAttribute('aria-atomic', 'true');
        }

        // 確保文章容器有 aria-busy 屬性
        const articlesContainer = document.getElementById('articles');
        if (articlesContainer && !articlesContainer.hasAttribute('aria-busy')) {
            articlesContainer.setAttribute('aria-busy', 'false');
        }

        console.log('AccessibilityManager: ARIA 實時區域已初始化');
    }

    /**
     * 向螢幕閱讀器宣告訊息
     * @param {string} message - 要宣告的訊息
     * @param {string} priority - 優先級 ('polite' 或 'assertive')
     */
    announceToScreenReader(message, priority = 'polite') {
        // 創建或取得 aria-live 區域
        let liveRegion = document.getElementById('aria-live-region');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('role', 'status');
            document.body.appendChild(liveRegion);
        }

        // 設定優先級
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');

        // 清空後再設定內容，確保螢幕閱讀器會讀取
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    }

    /**
     * 設定焦點陷阱（用於 Modal）
     * @param {HTMLElement} container - 要限制焦點的容器元素
     */
    setupFocusTrap(container) {
        if (!container) return;

        // 儲存當前聚焦的元素
        this.previousFocusedElement = document.activeElement;

        // 取得所有可聚焦元素
        const focusableElements = container.querySelectorAll(this.focusableElements);
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // 移除舊的監聽器
        if (this.modalFocusTrap) {
            container.removeEventListener('keydown', this.modalFocusTrap);
        }

        // 創建新的焦點陷阱監聽器
        this.modalFocusTrap = (event) => {
            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        event.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastFocusable) {
                        event.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        };

        container.addEventListener('keydown', this.modalFocusTrap);

        // 聚焦到第一個可聚焦元素
        setTimeout(() => {
            firstFocusable.focus();
        }, 100);
    }

    /**
     * 移除焦點陷阱
     * @param {HTMLElement} container - 要移除焦點陷阱的容器元素
     */
    removeFocusTrap(container) {
        if (!container || !this.modalFocusTrap) return;

        container.removeEventListener('keydown', this.modalFocusTrap);
        this.modalFocusTrap = null;

        // 恢復之前聚焦的元素
        if (this.previousFocusedElement) {
            setTimeout(() => {
                this.previousFocusedElement.focus();
                this.previousFocusedElement = null;
            }, 100);
        }
    }

    /**
     * 更新文章容器的載入狀態
     * @param {boolean} isLoading - 是否正在載入
     */
    updateArticlesLoadingState(isLoading) {
        const articlesContainer = document.getElementById('articles');
        if (articlesContainer) {
            articlesContainer.setAttribute('aria-busy', isLoading.toString());

            if (isLoading) {
                this.announceToScreenReader('正在載入文章...');
            } else {
                const articleCount = articlesContainer.children.length;
                this.announceToScreenReader(`已載入 ${articleCount} 篇文章`);
            }
        }
    }

    /**
     * 更新分頁導航的 ARIA 屬性
     * @param {number} currentPage - 當前頁碼
     * @param {number} totalPages - 總頁數
     */
    updatePaginationAria(currentPage, totalPages) {
        // 更新所有分頁按鈕的 aria-current 屬性
        const paginationButtons = document.querySelectorAll('.pagination button');
        paginationButtons.forEach(button => {
            if (button.textContent.trim() === currentPage.toString()) {
                button.setAttribute('aria-current', 'page');
                button.setAttribute('aria-label', `目前在第 ${currentPage} 頁，共 ${totalPages} 頁`);
            } else {
                button.removeAttribute('aria-current');
            }
        });

        this.announceToScreenReader(`已切換到第 ${currentPage} 頁，共 ${totalPages} 頁`);
    }

    /**
     * 更新圖表按鈕的 aria-pressed 屬性
     * @param {string} activeButtonId - 啟用的按鈕 ID
     */
    updateChartButtonsAria(activeButtonId) {
        const buttonIds = ['showKeywordTrend', 'showExpectedTrend', 'showKeywordCloud'];

        buttonIds.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const isActive = activeButtonId === buttonId;
                button.setAttribute('aria-pressed', isActive.toString());
                if (isActive) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    /**
     * 更新月份滑動器的 ARIA 屬性
     * @param {number} value - 當前值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @param {string} monthText - 月份文字
     */
    updateMonthSliderAria(value, min, max, monthText) {
        const slider = document.getElementById('month-slider');
        if (slider) {
            slider.setAttribute('aria-valuenow', value.toString());
            slider.setAttribute('aria-valuemin', min.toString());
            slider.setAttribute('aria-valuemax', max.toString());
            slider.setAttribute('aria-valuetext', monthText);
        }
    }

    /**
     * 更新新聞內容切換按鈕的 ARIA 屬性
     * @param {boolean} isExpanded - 是否展開
     */
    updateNewsToggleAria(isExpanded) {
        const toggleButton = document.getElementById('toggle-news-button');
        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', isExpanded.toString());

            const message = isExpanded ? '新聞內容已展開' : '新聞內容已收合';
            this.announceToScreenReader(message);
        }
    }

    /**
     * 確保所有圖示都有 aria-hidden 屬性
     */
    ensureIconsAreHidden() {
        const icons = document.querySelectorAll('i.fas, i.far, i.fab');
        icons.forEach(icon => {
            if (!icon.hasAttribute('aria-hidden')) {
                icon.setAttribute('aria-hidden', 'true');
            }
        });
    }

    /**
     * 取得元素的完整無障礙描述
     * @param {HTMLElement} element - 要分析的元素
     * @returns {Object} - 無障礙性資訊
     */
    getAccessibilityInfo(element) {
        if (!element) return null;

        return {
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
            ariaLabelledBy: element.getAttribute('aria-labelledby'),
            ariaDescribedBy: element.getAttribute('aria-describedby'),
            ariaHidden: element.getAttribute('aria-hidden'),
            tabIndex: element.getAttribute('tabindex'),
            isFocusable: element.matches(this.focusableElements)
        };
    }

    /**
     * 驗證元素的無障礙性
     * @param {HTMLElement} element - 要驗證的元素
     * @returns {Array} - 無障礙性問題列表
     */
    validateAccessibility(element) {
        const issues = [];

        // 檢查互動元素是否有可訪問的名稱
        if (element.matches('button, a, input, select, textarea')) {
            const hasAccessibleName = element.getAttribute('aria-label') ||
                                     element.getAttribute('aria-labelledby') ||
                                     element.textContent.trim() ||
                                     element.getAttribute('title');

            if (!hasAccessibleName) {
                issues.push('互動元素缺少可訪問的名稱');
            }
        }

        // 檢查圖片是否有 alt 文字
        if (element.tagName === 'IMG') {
            if (!element.hasAttribute('alt')) {
                issues.push('圖片缺少 alt 屬性');
            }
        }

        // 檢查表單輸入是否有標籤
        if (element.matches('input, select, textarea')) {
            const hasLabel = element.getAttribute('aria-label') ||
                           element.getAttribute('aria-labelledby') ||
                           document.querySelector(`label[for="${element.id}"]`);

            if (!hasLabel) {
                issues.push('表單輸入缺少標籤');
            }
        }

        return issues;
    }
}

// 導出供其他模組使用
window.AccessibilityManager = AccessibilityManager;

console.log('AccessibilityManager 模組已載入');
