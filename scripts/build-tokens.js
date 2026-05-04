#!/usr/bin/env node
/**
 * Token Compiler
 *
 * 從 design-tokens/tokens.json 產出：
 *   - css/tokens.css         (CSS custom properties，含 alpha 變體)
 *   - js/modules/Tokens.js   (window.DesignTokens 物件，給 Chart 等 JS 使用)
 *
 * 用法： node scripts/build-tokens.js   或   npm run build:tokens
 *
 * 修改色票時請只改 tokens.json 然後重跑此腳本。CSS 與 JS 會同步更新。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'design-tokens', 'tokens.json');
const CSS_OUT = path.join(ROOT, 'css', 'tokens.css');
const JS_OUT  = path.join(ROOT, 'js', 'modules', 'Tokens.js');

const tokens = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const hexToRgbChannels = hex => {
    const h = hex.replace('#', '');
    const v = h.length === 3
        ? h.split('').map(c => parseInt(c + c, 16))
        : [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    return v.join(' ');
};

const renderThemeBlock = (selector, vars, alphaTokens, alphaSteps) => {
    const lines = [`${selector} {`];
    for (const [key, value] of Object.entries(vars)) {
        lines.push(`    --${key}: ${value};`);
        if (alphaTokens.includes(key)) {
            lines.push(`    --${key}-rgb: ${hexToRgbChannels(value)};`);
        }
    }
    lines.push('');
    for (const tk of alphaTokens) {
        if (!(tk in vars)) continue;
        for (const step of alphaSteps) {
            const pad = String(step).padStart(2, '0');
            lines.push(`    --${tk}-a${pad}: rgb(var(--${tk}-rgb) / ${(step / 100).toFixed(2)});`);
        }
    }
    lines.push('}');
    return lines.join('\n');
};

// === build CSS ===
const { themes, alphaTokens, alphaSteps } = tokens;
const cssParts = [
    '/* ============================================================',
    '   Auto-generated from design-tokens/tokens.json — DO NOT EDIT.',
    '   Run `npm run build:tokens` after editing tokens.json.',
    '   ============================================================ */',
    '',
    renderThemeBlock(':root', themes.light, alphaTokens, alphaSteps),
    '',
    renderThemeBlock('[data-theme="dark"]', themes.dark, alphaTokens, alphaSteps),
    ''
];
fs.mkdirSync(path.dirname(CSS_OUT), { recursive: true });
fs.writeFileSync(CSS_OUT, cssParts.join('\n'));

// === build JS ===
const jsPayload = {
    light:     themes.light,
    dark:      themes.dark,
    palette:   tokens.palette.values,
    chartBars: tokens.chartBars.values,
    wordcloud: tokens.wordcloud,
    alphaSteps
};

const jsBody = `/* ============================================================
   Auto-generated from design-tokens/tokens.json — DO NOT EDIT.
   Run \`npm run build:tokens\` after editing tokens.json.
   ============================================================ */

(function (global) {
    const data = ${JSON.stringify(jsPayload, null, 4)};

    /** 取得目前主題（依 <html data-theme> 自動切換） */
    function current() {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        return data[theme];
    }

    /** 取單一 token 的 hex（依目前主題）。範例： color('primary') */
    function color(name) {
        return current()[name] || '#000';
    }

    /** 取 rgba 字串。範例： withAlpha('primary', 0.1)  →  'rgba(156, 175, 170, 0.1)' */
    function withAlpha(name, alpha) {
        const hex = color(name);
        const h = hex.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    /** 取文字雲色票（依當前主題自動切換）。 */
    function wordcloudPalette() {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        return data.wordcloud[theme];
    }

    global.DesignTokens = Object.assign({}, data, { current, color, withAlpha, wordcloudPalette });
})(window);
`;

fs.mkdirSync(path.dirname(JS_OUT), { recursive: true });
fs.writeFileSync(JS_OUT, jsBody);

console.log('✓ tokens compiled');
console.log('  →', path.relative(ROOT, CSS_OUT));
console.log('  →', path.relative(ROOT, JS_OUT));
