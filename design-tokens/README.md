# Design Tokens

整個應用程式的色票單一真相 (single source of truth)。

## 結構

```
design-tokens/
  tokens.json          ← 唯一需要編輯的檔案
scripts/
  build-tokens.js      ← 編譯器（純 Node、無依賴）
css/
  tokens.css           ← 自動產生：CSS variables
js/modules/
  Tokens.js            ← 自動產生：window.DesignTokens
```

## 換主題（最常見的操作）

1. 編輯 `design-tokens/tokens.json`，只改 `themes.light` / `themes.dark` 的色票
2. 跑 `npm run build:tokens`
3. 瀏覽器重整即可看到效果（無需碰任何 .css / .js）

## 運作機制

- **CSS 端**：`style.css` 以 `@import 'css/tokens.css'` 引入產生的色票，所有 `var(--primary)`、`var(--bg-secondary)` 等都從這裡來。
- **Alpha 變體**：每個 `alphaTokens` 內列出的 token（預設：`primary` / `secondary` / `shadow`）都會自動展開為 `--primary-a05` ~ `--primary-a85`。CSS 內若要做半透明色，請寫 `var(--primary-a20)` 而非 `rgba(...)`。
- **JS 端**：`window.DesignTokens.color('primary')`、`window.DesignTokens.withAlpha('primary', 0.3)` 取色，會跟著 `<html data-theme>` 自動切 light/dark。
- **產出檔頭部都有「DO NOT EDIT」註解** — 不要直接改 `css/tokens.css` 或 `js/modules/Tokens.js`，改了會被下次 build 覆蓋。

## 新增 token

在 `tokens.json` 的 `themes.light` 與 `themes.dark` 都加上同名 key，跑 `build:tokens` 即可在 CSS 用 `var(--your-token)`、JS 用 `DesignTokens.color('your-token')`。
