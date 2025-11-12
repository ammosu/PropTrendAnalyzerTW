// UIComponents.js - UI 元件模組
class UIComponents {
    constructor(stateManager) {
        this.stateManager = stateManager;
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
        articlesContainer.innerHTML = '';

        if (currentArticles.length === 0) {
            const noArticlesMessage = document.createElement('div');
            noArticlesMessage.className = 'col-12 text-center py-5';
            noArticlesMessage.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle fa-2x mb-3"></i>
                    <h4>沒有符合條件的文章</h4>
                    <p>請嘗試調整篩選條件或上傳更多數據。</p>
                </div>
            `;
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
        
        const imageUrl = `https://picsum.photos/seed/${article.title.substring(0, 10) || article.id || Math.floor(Math.random() * 1000)}/600/400`;
        
        const keywordsHtml = article.keywords.slice(0, 3).map(keyword => 
            `<span class="badge badge-pill badge-light mr-1 mb-1">${this.escapeHtml(keyword)}</span>`
        ).join('');
        
        let trendBadgeClass = 'badge-secondary';
        if (article.expectedMarketTrend === '上漲') {
            trendBadgeClass = 'badge-success';
        } else if (article.expectedMarketTrend === '下跌') {
            trendBadgeClass = 'badge-danger';
        } else if (article.expectedMarketTrend === '平穩') {
            trendBadgeClass = 'badge-info';
        }
        
        const publisherLink = article.url ? 
            `<a href="${this.escapeHtml(article.url)}" target="_blank">${this.escapeHtml(article.publisher)}</a>` : 
            this.escapeHtml(article.publisher);
        
        const expectedTrend = article.expectedMarketTrend ? 
            `<span class="badge ${trendBadgeClass} trend-badge">${this.escapeHtml(article.expectedMarketTrend)}</span>` : '';
        
        articleCard.innerHTML = `
            <div class="card shadow-sm h-100">
                <div class="card-img-container">
                    <img src="${imageUrl}" class="card-img-top" alt="新聞圖片" loading="lazy">
                    <div class="card-img-overlay-top">
                        <span class="badge badge-primary">${this.escapeHtml(article.publisher)}</span>
                        ${expectedTrend}
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${this.escapeHtml(article.title)}</h5>
                    <p class="card-text flex-grow-1">${this.escapeHtml(article.summary.length > 100 ? article.summary.substring(0, 100) + '...' : article.summary)}</p>
                    <div class="mt-2 mb-2">
                        ${keywordsHtml}
                    </div>
                    <div class="card-footer bg-transparent border-0 p-0">
                        <p class="text-muted mb-2">
                            <i class="far fa-calendar-alt"></i> ${this.formatDate(article.date)}
                            ${article.author ? `<span class="ml-2"><i class="far fa-user"></i> ${this.escapeHtml(article.author)}</span>` : ''}
                        </p>
                        <a href="#" class="btn btn-primary btn-block" onclick="event.preventDefault(); window.UIManager.showArticleDetails(${article.id})">
                            <i class="fas fa-book-open"></i> 閱讀更多
                        </a>
                    </div>
                </div>
            </div>
        `;
        
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
        paginationDiv.innerHTML = '';

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
            const expectedTrend = article.expectedMarketTrend ? 
                `<p class="text-muted">預期趨勢：${this.escapeHtml(article.expectedMarketTrend)}</p>` : '';

            const formattedFullText = this.formatArticleContent(article.fullText);

            const modalHtml = `
                <div class="modal fade" id="articleModal" tabindex="-1" role="dialog" aria-labelledby="articleModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="articleModalLabel">${this.escapeHtml(article.title)}</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <p>${formattedFullText}</p>
                                <p class="text-muted">發布時間：${this.escapeHtml(article.date)} | 作者：${this.escapeHtml(article.author)} | 發布單位：${article.url ? `<a href="${this.escapeHtml(article.url)}" target="_blank">${this.escapeHtml(article.publisher)}</a>` : this.escapeHtml(article.publisher)}</p>
                                ${expectedTrend}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">關閉</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            $('#articleModal').modal('show');

            $('#articleModal').on('hidden.bs.modal', function () {
                document.getElementById('articleModal').remove();
            });
        }
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
        return this.escapeHtml(content.replace(/_x000D_/g, '<br>').replace(/\r\n|\n/g, '<br>'));
    }
}

// 導出供其他模組使用
window.UIComponents = UIComponents;