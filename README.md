# 房市新聞摘要與趨勢分析

本專案是一個前端應用程式，用於顯示房地產新聞摘要並提供趨勢分析圖表。使用者可以透過篩選功能過濾新聞內容，並查看熱門關鍵詞的趨勢變化。此應用程式支援分頁、關鍵字篩選、以及跳轉至指定頁碼的功能，提供簡潔易用的新聞瀏覽介面。

## 專案結構

```
PropTrendAnalyzerTW/
├── index.html          # 主要HTML頁面
├── style.css           # 樣式表
├── scripts.js          # 主要JavaScript功能
├── data.js             # 資料載入邏輯
├── data/               # 資料檔案目錄
│   ├── metadata.json   # 中繼資料（總文章數、可用月份等）
│   ├── all_articles.json # 所有文章資料
│   └── articles_YYYY-MM.json # 按月份分割的文章資料
├── convert-csv.js      # CSV轉JSON工具
└── sample_data.csv     # 原始CSV資料
```

## 資料管理

本專案使用JSON格式存儲文章資料，以提高可維護性和擴展性。資料檔案存放在`data/`目錄下。

### 資料檔案說明

- `metadata.json`: 包含中繼資料，如總文章數、可用月份列表等
- `all_articles.json`: 包含所有文章的完整資料
- `articles_YYYY-MM.json`: 按月份分割的文章資料，例如`articles_2023-04.json`

### 新增資料

要新增文章資料，請按照以下步驟操作：

1. 將新的文章資料新增到`sample_data.csv`檔案中，保持相同的欄位結構
2. 執行資料轉換工具：

```bash
node convert-csv.js
```

3. 轉換工具會自動更新`data/`目錄下的所有JSON檔案

### CSV格式說明

`sample_data.csv`檔案應包含以下欄位：

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
- 使用Bootstrap 4.5.2提供基本UI元件
- 使用Chart.js實現資料視覺化
- 使用Fetch API動態載入資料

## 資料載入流程

1. 頁面載入時，`data.js`中的`loadArticlesData()`函數被呼叫
2. 該函數首先載入`metadata.json`取得中繼資料
3. 然後載入`all_articles.json`取得所有文章資料
4. 資料載入完成後，呼叫`initializePage()`函數初始化頁面
5. 頁面元素（文章列表、分頁、圖表等）被算繪

## 最佳化說明

本專案採用了以下最佳化措施：

1. **資料分離**: 將資料從程式碼中分離，存儲在獨立的JSON檔案中
2. **按月份分割**: 資料按月份分割，便於按需載入
3. **動態載入**: 使用Fetch API動態載入資料，減少初始載入時間
4. **錯誤處理**: 新增了完善的錯誤處理機制，提高應用程式穩定性
