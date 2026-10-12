# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PropTrendAnalyzerTW is a Taiwan real estate news analysis frontend application that displays property news summaries with trend analysis charts. The app supports filtering, pagination, keyword trend visualization, bookmarks, and data export.

## Development Commands

```bash
npm install            # Install dependencies (first time setup)
node server.js         # Start Express server on port 3000
node convert-csv.js    # Convert CSV data to JSON format for the application
```

## Architecture Overview

### Tech Stack
- **Frontend**: Pure HTML + CSS + JavaScript (ES6+), no build process
- **UI Framework**: Bootstrap 4.5.2
- **Charts**: Chart.js 3.9.1
- **Storage**: IndexedDB for client-side data persistence
- **Server**: Express.js serving static files

### Module System

The application uses a modular architecture in `js/modules/`. All modules are loaded via script tags in `index.html` and initialized by `js/App.js`.

**Core Modules:**
- `StateManager.js` - Centralized state management with pub/sub pattern
- `UIComponents.js` - UI rendering (article cards, pagination, stats)
- `ChartManager.js` - Chart.js chart creation and updates
- `EventHandlers.js` - User interaction event handling
- `SearchManager.js` - Search functionality with multiple search modes

**Support Modules:**
- `BookmarkManager.js` - Article bookmarking (localStorage)
- `ExportManager.js` - Data export (JSON, CSV, PDF)
- `AccessibilityManager.js` - Keyboard navigation and ARIA support
- `CacheManager.js` - Data caching layer
- `Validator.js` - Input and file validation
- `SecurityUtils.js` - XSS prevention, HTML sanitization
- `ErrorHandler.js` - Centralized error handling
- `Utilities.js` - Date formatting, debounce, sorting helpers
- `Constants.js` - Configuration constants

### Data Flow

1. **Data Loading**: `csv-uploader.js` handles CSV upload → IndexedDB storage
2. **State**: `StateManager` holds all app state (articles, filters, pagination)
3. **Rendering**: State changes trigger `UIComponents` re-renders
4. **Charts**: `ChartManager` subscribes to state for chart updates

### Data Sources (Priority Order)

1. **IndexedDB** - Client-uploaded CSV data (takes precedence)
2. **JSON files** - Server-side data in `/data` directory (fallback)

### CSV Data Structure

Required columns: `title`, `author`, `fullText`, `url`, `tag`, `publisher`, `keywords`, `summary`, `date`, `預期走向`, `理由`

Trend values (預期走向): `上漲`, `下跌`, `平穩`, `無相關`, `無法判斷`

### Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main SPA page, loads all modules |
| `style.css` | All styles including dark mode (`[data-theme="dark"]`) |
| `js/App.js` | Application bootstrap and module initialization |
| `csv-uploader.js` | CSV parsing, IndexedDB operations |
| `data.js` | Legacy data loading (backward compatibility) |
| `server.js` | Express server with CSP headers |

## Development Notes

- No build process - edit files and refresh browser
- CSS uses custom properties (`--primary`, `--bg-primary`, etc.) defined in `:root`
- Dark mode: Toggle `data-theme="dark"` on `<html>`, override styles with `[data-theme="dark"]` selector
- Scripts are loaded in dependency order at end of `index.html`
- Test data available: `test_data.csv` (can be loaded via UI)
- Colors live only in `design-tokens/tokens.json`; run `npm run build:tokens` to regenerate `css/tokens.css` and `js/modules/Tokens.js` (never edit those by hand). In JS use `window.DesignTokens.color()` / `withAlpha()`

## Intentional UI Decisions (don't revert)

- The filter bar (`#filter-options`) is page-global and sits right below the header: stat cards, insights, all three charts and the news list follow `filteredArticlesData`. Every filter change goes through `EventHandlers.filterArticles()` → `applyFilterResult()`
- Clicking a word cloud word, a Top 15 row or a keyword bar adds a 「關鍵詞」 condition (`selectedCloudKeyword`) that ANDs with the other filters and shows as a removable tag. wordcloud2 has no DOM click event — use its `click` option
- Clicking a segment of the 市場趨勢 chart sets the date range to that month and adds a 「走向」 condition (`selectedTrend`); doughnut slices add the 走向 only (plus the month if one is selected)
- The three charts are stacked (no tabs) with an anchor nav (`#section-nav`); each chart card has its own 「匯出 PNG」. Chart-local month ranges only affect that chart
- Sort, view mode and news export live in the news section header, not the filter bar. The news list is shown by default (no collapse toggle)
- On mobile, 更多篩選 opens as a bottom sheet; it filters live (no apply button). `.container` drops `backdrop-filter` on mobile so the fixed sheet anchors to the viewport
- The 數據總覽 preview cards and the floating upload button were removed; upload lives in the page header (`#upload-fab`)
- Keyword charts count 提及篇數: a keyword is counted once per article. 期間排行 aggregates the whole selected month range; 期間排行 and 多月比較 use horizontal bars
- 無相關 has its own `trend-unrelated` token (distinct from 平穩)
- Insights show no standing summary sentence; numbers shown side by side must add up from their displayed rounded values
