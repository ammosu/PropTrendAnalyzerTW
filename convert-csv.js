// convert-csv.js
// A more robust script to convert CSV data to JSON format using csv-parser

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const results = [];

// Parse CSV file
fs.createReadStream('sample_data.csv')
  .pipe(csv())
  .on('data', (data) => {
    // Process each row
    results.push(data);
  })
  .on('end', () => {
    // Transform data to match the expected format
    const articlesData = results.map((item, index) => {
      // Extract keywords from the keywords field
      const keywordsStr = item.keywords || '';
      let keywords = [];
      
      try {
        // Try to parse keywords as a JSON array if it looks like one
        if (keywordsStr.startsWith('[') && keywordsStr.endsWith(']')) {
          const cleanedStr = keywordsStr.replace(/'/g, '"'); // Replace single quotes with double quotes for JSON parsing
          keywords = JSON.parse(cleanedStr);
        } else {
          // Otherwise, split by commas
          keywords = keywordsStr.split(',').map(k => k.trim());
        }
      } catch (e) {
        console.warn(`Warning: Could not parse keywords for item ${index}: ${keywordsStr}`);
        // Fallback: try to extract keywords using regex
        const matches = keywordsStr.match(/'([^']+)'/g);
        if (matches) {
          keywords = matches.map(m => m.replace(/'/g, '').trim());
        }
      }
      
      // Determine expected market trend
      let expectedMarketTrend = "無法判斷";
      if (item['預期走向']) {
        expectedMarketTrend = item['預期走向'];
      }
      
      return {
        id: index, // Add an ID for each article
        title: item.title || '',
        summary: item.summary || '',
        keywords: keywords,
        date: item.date || '',
        publisher: item.publisher || '',
        author: item.author || '',
        fullText: item.fullText || '',
        expectedMarketTrend: expectedMarketTrend,
        url: item.url || '',
        imageUrl: `https://source.unsplash.com/random/400x200?property,${index}` // Random property-related image
      };
    });

    // Group articles by year-month
    const articlesByMonth = {};

    articlesData.forEach(article => {
      if (!article.date) return;
      
      const date = new Date(article.date);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!articlesByMonth[yearMonth]) {
        articlesByMonth[yearMonth] = [];
      }
      
      articlesByMonth[yearMonth].push(article);
    });

    // Write all articles to a single file
    fs.writeFileSync(
      path.join(dataDir, 'all_articles.json'),
      JSON.stringify(articlesData, null, 2)
    );

    // Write articles by month to separate files
    for (const yearMonth in articlesByMonth) {
      fs.writeFileSync(
        path.join(dataDir, `articles_${yearMonth}.json`),
        JSON.stringify(articlesByMonth[yearMonth], null, 2)
      );
    }

    // Create an index file with metadata
    const months = Object.keys(articlesByMonth).sort();
    const metadata = {
      totalArticles: articlesData.length,
      availableMonths: months,
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(dataDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`Converted ${articlesData.length} articles to JSON`);
    console.log(`Data files saved to ${dataDir}`);
    console.log(`Available months: ${months.join(', ')}`);
  });
