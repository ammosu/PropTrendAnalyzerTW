# 房市新聞摘要與趨勢分析

本專案是一個前端應用程式，用於顯示房地產新聞摘要並提供趨勢分析圖表。使用者可以透過篩選功能過濾新聞內容，並查看熱門關鍵詞的趨勢變化。此應用程式支援分頁、關鍵字篩選、以及跳轉至指定頁碼的功能，提供簡潔易用的新聞瀏覽介面。

## 專案結構

```
PropTrendAnalyzerTW/
├── index.html          # 主要HTML頁面
├── style.css           # 樣式表
├── scripts.js          # 主要JavaScript功能
├── data.js             # 數據載入邏輯
├── data/               # 數據文件目錄
│   ├── metadata.json   # 元數據（總文章數、可用月份等）
│   ├── all_articles.json # 所有文章數據
│   └── articles_YYYY-MM.json # 按月份分割的文章數據
├── convert-csv.js      # CSV轉JSON工具
└── sample_data.csv     # 原始CSV數據
```

## 數據管理

本專案使用JSON格式存儲文章數據，以提高可維護性和擴展性。數據文件存放在`data/`目錄下。

### 數據文件說明

- `metadata.json`: 包含元數據，如總文章數、可用月份列表等
- `all_articles.json`: 包含所有文章的完整數據
- `articles_YYYY-MM.json`: 按月份分割的文章數據，例如`articles_2023-04.json`

### 添加新數據

要添加新的文章數據，請按照以下步驟操作：

1. 將新的文章數據添加到`sample_data.csv`文件中，保持相同的列結構
2. 運行數據轉換工具：

```bash
node convert-csv.js
```

3. 轉換工具會自動更新`data/`目錄下的所有JSON文件

### CSV格式說明

`sample_data.csv`文件應包含以下列：

- `title`: 文章標題
- `author`: 作者
- `fullText`: 文章全文
- `url`: 文章URL
- `tag`: 標籤
- `publisher`: 發布媒體
- `keywords`: 關鍵詞（格式為`['關鍵詞1', '關鍵詞2', ...]`）
- `summary`: 文章摘要
- `date`: 發布日期（格式為`YYYY-MM-DD`）
- `預期走向`: 預期市場趨勢（上漲、下跌、平穩、無相關、無法判斷）
- `理由`: 預期走向的理由

## 技術實現

- 前端使用純HTML、CSS和JavaScript實現
- 使用Bootstrap 4.5.2提供基本UI組件
- 使用Chart.js實現數據可視化
- 使用Fetch API動態載入數據

## 數據載入流程

1. 頁面載入時，`data.js`中的`loadArticlesData()`函數被調用
2. 該函數首先載入`metadata.json`取得元數據
3. 然後載入`all_articles.json`取得所有文章數據
4. 數據載入完成後，調用`initializePage()`函數初始化頁面
5. 頁面元素（文章列表、分頁、圖表等）被渲染

## 優化說明

本專案採用了以下優化措施：

1. **數據分離**: 將數據從代碼中分離，存儲在獨立的JSON文件中
2. **按月份分割**: 數據按月份分割，便於按需載入
3. **動態載入**: 使用Fetch API動態載入數據，減少初始載入時間
4. **錯誤處理**: 添加了完善的錯誤處理機制，提高應用穩定性
