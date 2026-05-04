/* ============================================================
   Auto-generated from design-tokens/tokens.json — DO NOT EDIT.
   Run `npm run build:tokens` after editing tokens.json.
   ============================================================ */

(function (global) {
    const data = {
    "light": {
        "primary": "#1C4D8D",
        "primary-hover": "#0F2854",
        "primary-light": "#4988C4",
        "primary-dark": "#0F2854",
        "secondary": "#4988C4",
        "secondary-light": "#BDE8F5",
        "secondary-dark": "#1C4D8D",
        "bg-primary": "#FFFFFF",
        "bg-secondary": "#F0F8FC",
        "bg-tertiary": "#BDE8F5",
        "text-primary": "#0F2854",
        "text-secondary": "#1C4D8D",
        "text-muted": "#5A6B82",
        "border-color": "#BDE8F5",
        "border-light": "#DDEEF7",
        "info": "#4988C4",
        "success": "#2D7A5F",
        "warning": "#D97706",
        "danger": "#C84141",
        "trend-up": "#2D7A5F",
        "trend-down": "#C84141",
        "trend-stable": "#4988C4",
        "trend-none": "#94A3B8",
        "shadow": "#0F2854"
    },
    "dark": {
        "primary": "#4988C4",
        "primary-hover": "#6BA0D4",
        "primary-light": "#BDE8F5",
        "primary-dark": "#1C4D8D",
        "secondary": "#BDE8F5",
        "secondary-light": "#DDEEF7",
        "secondary-dark": "#4988C4",
        "bg-primary": "#0F2854",
        "bg-secondary": "#15355E",
        "bg-tertiary": "#1C4D8D",
        "text-primary": "#BDE8F5",
        "text-secondary": "#DDEEF7",
        "text-muted": "#7DA3C5",
        "border-color": "#1C4D8D",
        "border-light": "#2A5BA0",
        "info": "#6BA0D4",
        "success": "#4ADE80",
        "warning": "#FBBF24",
        "danger": "#F87171",
        "trend-up": "#4ADE80",
        "trend-down": "#F87171",
        "trend-stable": "#6BA0D4",
        "trend-none": "#6B7B91",
        "shadow": "#000000"
    },
    "palette": [
        "#1C4D8D",
        "#4988C4",
        "#BDE8F5",
        "#0F2854",
        "#7DA3C5",
        "#5A6B82",
        "#DDEEF7"
    ],
    "chartBars": [
        "#F5D2D2",
        "#F8F7BA",
        "#BDE3C3",
        "#A3CCDA"
    ],
    "wordcloud": {
        "$comment": "文字雲色票（依主題分組）。必須與 .wordcloud-container 底色形成可讀對比（建議 ≥4.5:1）。",
        "light": [
            "#0F2854",
            "#1C4D8D",
            "#3A5478",
            "#1F3A6B",
            "#264273"
        ],
        "dark": [
            "#FFFFFF",
            "#BDE8F5",
            "#DDEEF7",
            "#E8F3FA",
            "#C8E0F0"
        ]
    },
    "alphaSteps": [
        5,
        8,
        10,
        12,
        15,
        18,
        20,
        25,
        30,
        40,
        50,
        60,
        70,
        85
    ]
};

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
