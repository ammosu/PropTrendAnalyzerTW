// server.js - Simple Express server for PropTrendAnalyzerTW

// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// 安全標頭中間件 (必須在其他中間件之前)
app.use((req, res, next) => {
    // 內容安全政策（與 index.html 的 meta CSP 保持一致）
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' https://code.jquery.com https://cdn.jsdelivr.net https://stackpath.bootstrapcdn.com; " +
        "style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
        "img-src 'self' data: blob: https:; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "connect-src 'self'; " +
        "frame-src 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "upgrade-insecure-requests;"
    );
    
    // 其他安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // 移除服務器標識
    res.removeHeader('X-Powered-By');
    
    next();
});

// Middleware to parse JSON and URL-encoded data (無大小限制)
app.use(express.json({ limit: '1gb' })); // 設定較大的限制
app.use(express.urlencoded({ extended: true, limit: '1gb' })); // 設定較大的限制

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Optional: API endpoint to get available data files
app.get('/api/data-files', (req, res) => {
  const dataDir = path.join(__dirname, 'data');
  
  try {
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: `/data/${file}`
        }));
      
      res.json({ success: true, files });
    } else {
      res.json({ success: false, message: 'Data directory not found', files: [] });
    }
  } catch (error) {
    console.error('Error reading data directory:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${__dirname}`);
});