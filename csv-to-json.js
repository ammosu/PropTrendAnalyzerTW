// csv-to-json.js
// Script to convert CSV data to JSON format

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvFilePath = path.join(__dirname, 'sample_data.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Warning: Line ${i + 1} has ${values.length} values, expected ${headers.length}`);
      continue;
    }
    
    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      entry[headers[j]] = values[j];
    }
    result.push(entry);
  }
  
  return result;
}

// Parse a single CSV line, handling quoted values with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Convert CSV data to JSON
const rawData = parseCSV(csvData);

// Transform data to match the expected format
const articlesData = rawData.map((item, index) => {
  // Extract keywords from the keywords field (assuming it's a string with keywords in brackets)
  const keywordsStr = item.keywords || '';
  const keywordsMatch = keywordsStr.match(/\['([^']*)'(?:,\s*'([^']*)')*\]/);
  
  let keywords = [];
  if (keywordsMatch) {
    // Extract all matches including the first capturing group and any additional ones
    keywords = keywordsMatch[0]
      .replace(/\[|\]/g, '') // Remove brackets
      .split(',')
      .map(k => k.trim().replace(/^'|'$/g, '')); // Remove quotes and trim
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

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

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
