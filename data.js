// data.js
// 文章數據
const articlesData = [
  {
    "title": "主要城市房價飆升",
    "summary": "過去一年中，主要城市的房地產市場經歷了顯著的價格上漲。",
    "keywords": ["房地產", "價格上漲", "主要城市", "專家", "市場"],
    "date": "2024-10-01",
    "publisher": "自由時報",
    "author": "張三",
    "fullText": "過去一年中，主要城市的房地產市場經歷了顯著的價格上漲，這引起了社會各界的廣泛關注。專家分析認為，這主要是由於經濟增長和市場需求增加所致，政府也在考慮採取措施來穩定市場。",
    "imageUrl": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7"
  },
  {
    "title": "新住房政策出台",
    "summary": "政府發布新住房政策，旨在控制市場過熱，保障居民需求。",
    "keywords": ["住房政策", "政府", "市場過熱", "居民需求", "控制"],
    "date": "2024-09-28",
    "publisher": "聯合報",
    "author": "李四",
    "fullText": "政府近日發布了一項新的住房政策，目的是為了控制房地產市場過熱的現象，確保居民的住房需求得到有效保障。這項政策包括對投機性購房行為的限制以及增加住房供應等多方面的措施。",
    "imageUrl": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
  },
  {
    "title": "貸款利率調整對房市的影響",
    "summary": "近期貸款利率的調整可能會對房地產市場需求產生影響。",
    "keywords": ["貸款利率", "房地產市場", "需求", "調整", "影響"],
    "date": "2024-09-25",
    "publisher": "經濟日報",
    "author": "王五",
    "fullText": "貸款利率的上調對房地產市場產生了直接影響，許多潛在購房者因為貸款成本的增加而推遲了購房計劃。專家表示，這可能會導致房地產市場需求的短期下降，但從長遠來看，這有助於市場的健康發展。",
    "imageUrl": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853"
  }
];

// 初始趨勢數據計算
const keywordCounts = {};
articlesData.forEach(article => {
  article.keywords.forEach(keyword => {
    if (keywordCounts[keyword]) {
      keywordCounts[keyword]++;
    } else {
      keywordCounts[keyword] = 1;
    }
  });
});

const trendData = {
  labels: Object.keys(keywordCounts),
  data: Object.values(keywordCounts)
};
