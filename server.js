// server.js - Simple Express server for PropTrendAnalyzerTW

// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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