# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PropTrendAnalyzerTW is a Taiwan real estate news analysis frontend application that displays property news summaries with trend analysis charts. The app supports filtering, pagination, and keyword trend visualization.

## Development Commands

### Running the Application
```bash
node server.js           # Start Express server on port 3000
```

### Data Management
```bash
node convert-csv.js      # Convert CSV data to JSON format for the application
```

## Architecture Overview

### Frontend Architecture
- **Pure Frontend Stack**: HTML + CSS + JavaScript (no build process)
- **UI Framework**: Bootstrap 4.5.2 for responsive design
- **Charts**: Chart.js for trend visualization
- **Data Loading**: Fetch API for dynamic JSON loading
- **Storage**: IndexedDB for client-side data persistence

### Backend Architecture
- **Server**: Simple Express.js server serving static files
- **API**: Single endpoint `/api/data-files` to list available data files
- **Data Storage**: JSON files in `/data` directory

### Key Components

#### Data Flow
1. `data.js` - Central data management, loads from IndexedDB or JSON files
2. `scripts.js` - Main application logic, UI rendering, and interactions
3. `convert-csv.js` - Data transformation from CSV to JSON format
4. `csv-uploader.js` - Client-side CSV upload and IndexedDB management

#### Data Structure
- Articles stored with metadata: title, author, content, keywords, trends
- Trend predictions: 上漲/下跌/平穩/無相關/無法判斷 (up/down/stable/unrelated/unknown)
- Monthly data segmentation for performance optimization

### File Organization
```
/
├── index.html          # Main application page
├── style.css           # Application styles
├── scripts.js          # Core frontend logic
├── data.js             # Data loading and management
├── csv-uploader.js     # CSV upload functionality
├── convert-csv.js      # Server-side data conversion
├── server.js           # Express server
└── data/               # JSON data files (created by convert-csv.js)
```

### Data Management Workflow
1. Raw data in `sample_data.csv` with columns: title, author, fullText, url, tag, publisher, keywords, summary, date, 預期走向, 理由
2. Run `node convert-csv.js` to process CSV into JSON files in `/data` directory
3. Frontend loads from IndexedDB first, falls back to JSON files
4. Client-side CSV upload stores directly to IndexedDB

### Key Technical Patterns
- **Progressive Loading**: Check IndexedDB → load JSON files → initialize UI
- **Error Handling**: Comprehensive try-catch in data loading with fallbacks
- **Performance**: Monthly data chunking, lazy loading, pagination
- **Localization**: Traditional Chinese interface and data structures

## Development Notes

- No build process required - direct file editing and refresh
- Data updates require running `convert-csv.js` after CSV changes
- IndexedDB takes precedence over JSON files for data loading
- Server mainly serves static files; core logic is client-side