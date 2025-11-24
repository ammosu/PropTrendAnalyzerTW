// UIComponents.js - UI 元件模組
class UIComponents {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.securityUtils = window.SecurityUtils;
    }

    // 顯示載入動畫
    showLoading(message = '載入中...') {
        if (document.getElementById('loading-overlay')) {
            document.getElementById('loading-message').textContent = message;
            document.getElementById('loading-overlay').style.display = 'flex';
            return;
        }
        
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            flex-direction: column;
        `;
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = `
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #3498db;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        `;
        
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'loading-message';
        loadingMessage.textContent = message;
        loadingMessage.style.cssText = `
            color: #3498db;
            font-weight: bold;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        loadingOverlay.appendChild(spinner);
        loadingOverlay.appendChild(loadingMessage);
        document.body.appendChild(loadingOverlay);
    }

    // 隱藏載入動畫
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }

    // 渲染文章列表
    renderArticles(page) {
        this.showLoading('正在載入文章...');
        
        const articlesPerPage = this.stateManager.getState('articlesPerPage');
        const filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        
        const start = (page - 1) * articlesPerPage;
        const end = start + articlesPerPage;
        const currentArticles = filteredArticlesData.slice(start, end);
        const articlesContainer = document.getElementById('articles');
        // 安全地清空容器
        while (articlesContainer.firstChild) {
            articlesContainer.removeChild(articlesContainer.firstChild);
        }

        if (currentArticles.length === 0) {
            const noArticlesMessage = this.createNoArticlesMessage();
            articlesContainer.appendChild(noArticlesMessage);
            this.hideLoading();
            return;
        }

        const fragment = document.createDocumentFragment();
        
        currentArticles.forEach((article, index) => {
            const articleCard = this.createArticleCard(article, index);
            fragment.appendChild(articleCard);
        });
        
        articlesContainer.appendChild(fragment);
        setTimeout(() => this.hideLoading(), 500);
    }

    // 創建文章卡片
    createArticleCard(article, index) {
        const articleCard = document.createElement('div');
        articleCard.className = 'col-md-4 mb-4';
        
        // 直接使用安全的卡片創建方法
        const secureCard = this.createSecureArticleCard(article, index);
        articleCard.appendChild(secureCard);
        
        setTimeout(() => {
            articleCard.classList.add('animate__animated', 'animate__fadeIn');
            articleCard.style.animationDelay = `${index * 0.1}s`;
        }, 10);
        
        return articleCard;
    }

    // 渲染分頁
    renderPagination() {
        const filteredArticlesData = this.stateManager.getState('filteredArticlesData');
        const articlesPerPage = this.stateManager.getState('articlesPerPage');
        const currentPage = this.stateManager.getState('currentPage');
        
        const totalPages = Math.ceil(filteredArticlesData.length / articlesPerPage);
        const paginationDiv = document.getElementById('pagination');
        // 安全地清空分頁容器
        while (paginationDiv.firstChild) {
            paginationDiv.removeChild(paginationDiv.firstChild);
        }

        const maxVisiblePages = 5;
        let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
        let endPage = startPage + maxVisiblePages - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        if (startPage > 1) {
            const firstPageButton = this.createPaginationButton('1', 1, false);
            paginationDiv.appendChild(firstPageButton);
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.className = 'mx-2';
                paginationDiv.appendChild(dots);
            }
        }

        if (currentPage > 1) {
            const prevButton = this.createPaginationButton('上一頁', currentPage - 1, false);
            paginationDiv.appendChild(prevButton);
        }

        for (let i = startPage; i <= endPage; i++) {
            const button = this.createPaginationButton(i.toString(), i, i === currentPage);
            paginationDiv.appendChild(button);
        }

        if (currentPage < totalPages) {
            const nextButton = this.createPaginationButton('下一頁', currentPage + 1, false);
            paginationDiv.appendChild(nextButton);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.className = 'mx-2';
                paginationDiv.appendChild(dots);
            }
            const lastPageButton = this.createPaginationButton(totalPages.toString(), totalPages, false);
            paginationDiv.appendChild(lastPageButton);
        }
    }

    // 創建分頁按鈕
    createPaginationButton(text, page, isActive) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `btn btn-secondary mx-1 ${isActive ? 'active' : ''}`;
        button.addEventListener('click', () => {
            this.stateManager.setCurrentPage(page);
            this.renderArticles(page);
            this.renderPagination();
        });
        return button;
    }

    // 顯示文章詳情
    showArticleDetails(articleId) {
        const articlesData = this.stateManager.getState('articlesData');
        const article = articlesData.find(a => a.id === articleId);
        
        if (article) {
            // 使用安全的 DOM 創建方式
            const modal = this.createArticleModal(article);
            document.body.appendChild(modal);
            
            // 顯示 Modal
            $(modal).modal('show');
            
            // 設定關閉事件
            $(modal).on('hidden.bs.modal', function () {
                modal.remove();
            });
        }
    }

    // 創建安全的文章 Modal
    createArticleModal(article) {
        // 創建 Modal 結構
        const modal = this.securityUtils.createSafeElement('div', {
            class: 'modal fade',
            id: 'articleModal',
            tabindex: '-1',
            role: 'dialog',
            'aria-labelledby': 'articleModalLabel',
            'aria-hidden': 'true'
        });

        const modalDialog = this.securityUtils.createSafeElement('div', { 
            class: 'modal-dialog modal-lg',
            role: 'document' 
        });

        const modalContent = this.securityUtils.createSafeElement('div', { class: 'modal-content' });

        // Modal Header
        const modalHeader = this.securityUtils.createSafeElement('div', { class: 'modal-header' });
        const modalTitle = this.securityUtils.createSafeElement('h5', { 
            class: 'modal-title',
            id: 'articleModalLabel' 
        }, article.title);

        const closeButton = this.securityUtils.createSafeElement('button', {
            type: 'button',
            class: 'close',
            'data-dismiss': 'modal',
            'aria-label': 'Close'
        });
        const closeSpan = this.securityUtils.createSafeElement('span', { 'aria-hidden': 'true' }, '×');
        closeButton.appendChild(closeSpan);

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        // Modal Body
        const modalBody = this.securityUtils.createSafeElement('div', { class: 'modal-body' });
        
        // 文章內容 - 使用安全的 HTML 渲染
        const contentDiv = this.securityUtils.createSafeElement('div', { class: 'article-content mb-4' });
        const formattedContent = this.formatArticleContent(article.fullText);

        // 安全地設定 HTML 內容 - 使用 DOMParser
        if (this.securityUtils && this.securityUtils.sanitizeHtml) {
            const sanitizedContent = this.securityUtils.sanitizeHtml(formattedContent);
            const parser = new DOMParser();
            const doc = parser.parseFromString(sanitizedContent, 'text/html');
            while (doc.body.firstChild) {
                contentDiv.appendChild(doc.body.firstChild);
            }
        } else {
            contentDiv.textContent = article.fullText;
        }

        modalBody.appendChild(contentDiv);

        // 文章資訊
        const metaInfo = this.securityUtils.createSafeElement('div', { class: 'article-meta text-muted border-top pt-3' });

        const dateInfo = this.securityUtils.createSafeElement('p', { class: 'mb-2' });
        const dateIcon = this.securityUtils.createSafeElement('i', { class: 'far fa-calendar-alt' });
        dateInfo.appendChild(dateIcon);
        dateInfo.appendChild(document.createTextNode(' 發布時間：' + article.date));

        const authorInfo = this.securityUtils.createSafeElement('p', { class: 'mb-2' });
        const authorIcon = this.securityUtils.createSafeElement('i', { class: 'far fa-user' });
        authorInfo.appendChild(authorIcon);
        authorInfo.appendChild(document.createTextNode(' 作者：' + article.author));

        const publisherInfo = this.securityUtils.createSafeElement('p', { class: 'mb-2' });
        const publisherIcon = this.securityUtils.createSafeElement('i', { class: 'fas fa-newspaper' });
        publisherInfo.appendChild(publisherIcon);
        publisherInfo.appendChild(document.createTextNode(' 發布單位：'));
        if (article.url) {
            const link = this.securityUtils.createSafeElement('a', {
                href: article.url,
                target: '_blank',
                rel: 'noopener noreferrer'
            }, article.publisher);
            publisherInfo.appendChild(link);
        } else {
            publisherInfo.appendChild(document.createTextNode(article.publisher));
        }

        metaInfo.appendChild(dateInfo);
        metaInfo.appendChild(authorInfo);
        metaInfo.appendChild(publisherInfo);

        // 預期趨勢
        if (article.expectedMarketTrend) {
            const trendInfo = this.securityUtils.createSafeElement('p', { class: 'mb-0' });
            const trendIcon = this.securityUtils.createSafeElement('i', { class: 'fas fa-chart-line' });
            trendInfo.appendChild(trendIcon);
            trendInfo.appendChild(document.createTextNode(' 預期趨勢：'));

            const trendBadgeClass = this.getTrendBadgeClass(article.expectedMarketTrend);
            const trendBadge = this.securityUtils.createSafeElement('span', {
                class: `badge ${trendBadgeClass}`
            }, article.expectedMarketTrend);
            trendInfo.appendChild(trendBadge);
            metaInfo.appendChild(trendInfo);
        }

        modalBody.appendChild(metaInfo);

        // Modal Footer
        const modalFooter = this.securityUtils.createSafeElement('div', { class: 'modal-footer' });
        const closeBtn = this.securityUtils.createSafeElement('button', {
            type: 'button',
            class: 'btn btn-secondary',
            'data-dismiss': 'modal'
        }, '關閉');
        modalFooter.appendChild(closeBtn);

        // 組裝 Modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalDialog.appendChild(modalContent);
        modal.appendChild(modalDialog);

        return modal;
    }

    // 工具函數：轉義 HTML 以防止 XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 工具函數：格式化日期
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    // 工具函數：格式化文章內容
    formatArticleContent(content) {
        if (!content) return '';
        
        // 使用 SecurityUtils 安全地處理 HTML
        if (this.securityUtils && this.securityUtils.sanitizeHtml) {
            // 首先處理常見的換行符和特殊字符
            let processedContent = content
                .replace(/_x000D_/g, '<br>')  // 替換特殊換行符
                .replace(/\r\n/g, '<br>')     // Windows 換行符
                .replace(/\n/g, '<br>')       // Unix 換行符
                .replace(/<br><br>/g, '<br>') // 避免過多的空行
                .replace(/<br>\s*<br>/g, '<br>'); // 清理連續的 br 標籤
            
            // 使用安全的 HTML 處理
            return this.securityUtils.sanitizeHtml(processedContent);
        } else {
            // 如果 SecurityUtils 不可用，則使用安全的文本處理
            return this.escapeHtml(content)
                .replace(/_x000D_/g, '<br>')
                .replace(/\r\n/g, '<br>')
                .replace(/\n/g, '<br>');
        }
    }

    // 取得趨勢徽章類別
    getTrendBadgeClass(expectedTrend) {
        if (expectedTrend === '上漲') {
            return 'badge-success';
        } else if (expectedTrend === '下跌') {
            return 'badge-danger';
        } else if (expectedTrend === '平穩') {
            return 'badge-info';
        }
        return 'badge-secondary'; // 預設
    }

    // 生成字符串哈希值
    generateHashFromString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為32位整數
        }
        return Math.abs(hash);
    }

    // 創建安全的無文章訊息
    createNoArticlesMessage() {
        const container = this.securityUtils.createSafeElement('div', { class: 'col-12 text-center py-5' });
        const alert = this.securityUtils.createSafeElement('div', { class: 'alert alert-info' });
        const icon = this.securityUtils.createSafeElement('i', { class: 'fas fa-info-circle fa-2x mb-3' });
        const title = this.securityUtils.createSafeElement('h4', {}, '沒有符合條件的文章');
        const text = this.securityUtils.createSafeElement('p', {}, '請嘗試調整篩選條件或上傳更多資料。');
        
        alert.appendChild(icon);
        alert.appendChild(title);
        alert.appendChild(text);
        container.appendChild(alert);
        
        return container;
    }

    // 創建安全的文章卡片
    createSecureArticleCard(article, index) {
        const cardContainer = this.securityUtils.createSafeElement('div', { class: 'card shadow-sm h-100' });
        
        // 圖片容器
        const imgContainer = this.createImageContainer(article, index);
        cardContainer.appendChild(imgContainer);
        
        // 卡片主體
        const cardBody = this.createCardBody(article);
        cardContainer.appendChild(cardBody);
        
        return cardContainer;
    }

    // 創建圖片容器
    createImageContainer(article, index) {
        const imgContainer = this.securityUtils.createSafeElement('div', { class: 'card-img-container' });
        
        // 圖片 - 使用 SVG 預設圖片以避免外部服務依賴
        let imageUrl;
        if (article.imageUrl) {
            imageUrl = article.imageUrl;
        } else {
            // 根據文章標題生成顏色
            const titleHash = this.generateHashFromString(article.title || '預設');
            const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
            const bgColor = colors[titleHash % colors.length];
            const textColor = '#ffffff';
            
            // 生成帶有房子圖形的 SVG 圖片
            let svgContent;
            try {
                svgContent = this.generateRealEstateSVG(bgColor, textColor, article.title || '');
            } catch (error) {
                console.warn('SVG 生成失敗，使用簡單圖片:', error);
                // 簡單的後備 SVG
                svgContent = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="${bgColor}"/>
                    <rect x="150" y="80" width="100" height="60" fill="${textColor}" opacity="0.2"/>
                    <polygon points="140,80 200,50 260,80" fill="${textColor}" opacity="0.3"/>
                    <text x="200" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle">房地產新聞</text>
                    <text x="200" y="180" font-family="Arial, sans-serif" font-size="10" fill="${textColor}" text-anchor="middle" opacity="0.8">${(article.title || '').substring(0, 20)}...</text>
                </svg>`;
            }
            
            imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`;
        }
        const safeImageUrl = this.securityUtils.sanitizeUrl(imageUrl);
        if (safeImageUrl) {
            const img = this.securityUtils.createSafeElement('img', {
                src: safeImageUrl,
                class: 'card-img-top',
                alt: '新聞圖片',
                loading: 'lazy'
            });
            
            // 圖片載入失敗時的處理
            img.addEventListener('error', () => {
                // 使用純色背景替代
                img.style.backgroundColor = '#f8f9fa';
                img.style.display = 'flex';
                img.style.alignItems = 'center';
                img.style.justifyContent = 'center';
                img.style.color = '#6c757d';
                img.style.fontSize = '14px';
                img.alt = '圖片載入失敗';
                // 設定一個房地產主題的預設圖片
                const fallbackSVG = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#dee2e6"/>
                    <rect x="150" y="60" width="100" height="80" fill="#6c757d" opacity="0.5"/>
                    <polygon points="140,60 200,30 260,60" fill="#495057"/>
                    <rect x="175" y="100" width="20" height="20" fill="#ffffff" opacity="0.7"/>
                    <rect x="205" y="100" width="20" height="20" fill="#ffffff" opacity="0.7"/>
                    <rect x="185" y="120" width="30" height="20" fill="#495057"/>
                    <text x="200" y="170" font-family="Arial" font-size="12" fill="#6c757d" text-anchor="middle">房地產新聞</text>
                </svg>`;
                img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(fallbackSVG);
            });
            
            imgContainer.appendChild(img);
        }
        
        // 覆蓋層
        const overlay = this.securityUtils.createSafeElement('div', { class: 'card-img-overlay-top' });
        
        // 發布者標籤
        const publisherBadge = this.securityUtils.createSafeElement('span', { class: 'badge badge-primary' }, article.publisher || '');
        overlay.appendChild(publisherBadge);
        
        // 趨勢標籤
        if (article.expectedMarketTrend) {
            const trendBadgeClass = this.getTrendBadgeClass(article.expectedMarketTrend);
            const trendBadge = this.securityUtils.createSafeElement('span', { 
                class: `badge ${trendBadgeClass} trend-badge` 
            }, article.expectedMarketTrend);
            overlay.appendChild(trendBadge);
        }
        
        imgContainer.appendChild(overlay);
        return imgContainer;
    }

    // 創建卡片主體
    createCardBody(article) {
        const cardBody = this.securityUtils.createSafeElement('div', { class: 'card-body d-flex flex-column' });
        
        // 標題
        const title = this.securityUtils.createSafeElement('h5', { class: 'card-title' }, article.title || '');
        cardBody.appendChild(title);
        
        // 摘要
        const summaryText = article.summary ? 
            (article.summary.length > 100 ? article.summary.substring(0, 100) + '...' : article.summary) : '';
        const summary = this.securityUtils.createSafeElement('p', { class: 'card-text flex-grow-1' }, summaryText);
        cardBody.appendChild(summary);
        
        // 關鍵詞
        if (article.keywords && article.keywords.length > 0) {
            const keywordsContainer = this.createKeywordsContainer(article.keywords);
            cardBody.appendChild(keywordsContainer);
        }
        
        // 頁腳
        const footer = this.createCardFooter(article);
        cardBody.appendChild(footer);
        
        return cardBody;
    }

    // 創建關鍵詞容器
    createKeywordsContainer(keywords) {
        const container = this.securityUtils.createSafeElement('div', { class: 'mt-2 mb-2' });
        
        keywords.forEach(keyword => {
            const badge = this.securityUtils.createSafeElement('span', { 
                class: 'badge badge-pill badge-light mr-1 mb-1' 
            }, keyword);
            container.appendChild(badge);
        });
        
        return container;
    }

    // 創建卡片頁腳
    createCardFooter(article) {
        const footer = this.securityUtils.createSafeElement('div', { class: 'card-footer bg-transparent border-0 p-0' });
        
        // 日期和作者信息
        const infoContainer = this.securityUtils.createSafeElement('p', { class: 'text-muted mb-2' });
        
        const dateIcon = this.securityUtils.createSafeElement('i', { class: 'far fa-calendar-alt' });
        infoContainer.appendChild(dateIcon);
        
        const dateText = document.createTextNode(` ${this.formatDate(article.date)}`);
        infoContainer.appendChild(dateText);
        
        if (article.author) {
            const authorIcon = this.securityUtils.createSafeElement('i', { class: 'far fa-user' });
            const authorSpan = this.securityUtils.createSafeElement('span', { class: 'ml-2' });
            authorSpan.appendChild(authorIcon);
            authorSpan.appendChild(document.createTextNode(` ${article.author}`));
            infoContainer.appendChild(authorSpan);
        }
        
        footer.appendChild(infoContainer);
        
        // 閱讀更多按鈕
        const readMoreBtn = this.securityUtils.createSafeElement('button', { 
            class: 'btn btn-primary btn-block',
            type: 'button',
            'data-article-id': article.id
        });
        
        const btnIcon = this.securityUtils.createSafeElement('i', { class: 'fas fa-book-open' });
        readMoreBtn.appendChild(btnIcon);
        readMoreBtn.appendChild(document.createTextNode(' 閱讀更多'));
        
        // 安全的事件處理
        readMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.UIManager && window.UIManager.showArticleDetails) {
                window.UIManager.showArticleDetails(article.id);
            }
        });
        
        footer.appendChild(readMoreBtn);
        return footer;
    }

    // 生成房地產主題的 SVG 圖片
    generateRealEstateSVG(bgColor, textColor, title) {
        const titleHash = this.generateHashFromString(title);
        const houseVariant = titleHash % 4; // 4種不同的房子樣式
        
        // 選擇房子圖案
        let houseElement = '';
        const lightColor = this.lightenColor(bgColor, 20);
        const darkColor = this.darkenColor(bgColor, 20);
        
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

    // 調亮顏色
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                     (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                     (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // 調暗顏色
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + 
                     (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 + 
                     (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
}

// 導出供其他模組使用
window.UIComponents = UIComponents;