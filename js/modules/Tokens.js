/* ============================================================
   Auto-generated from design-tokens/tokens.json — DO NOT EDIT.
   Run `npm run build:tokens` after editing tokens.json.
   ============================================================ */

(function (global) {
    const data = {
    "light": {
        "primary": "#9CAFAA",
        "primary-hover": "#7E948E",
        "primary-light": "#B8C7C2",
        "primary-dark": "#6B807B",
        "secondary": "#D6A99D",
        "secondary-light": "#E5C2B7",
        "secondary-dark": "#B58C7F",
        "bg-primary": "#FFFDF5",
        "bg-secondary": "#FBF3D5",
        "bg-tertiary": "#D6DAC8",
        "text-primary": "#2F3A35",
        "text-secondary": "#4A554F",
        "text-muted": "#7B847F",
        "border-color": "#D6DAC8",
        "border-light": "#E8EBE0",
        "info": "#9CAFAA",
        "success": "#6B9080",
        "warning": "#C9A66B",
        "danger": "#C57B57",
        "trend-up": "#6B9080",
        "trend-down": "#C57B57",
        "trend-stable": "#9CAFAA",
        "trend-none": "#B5B0A8",
        "shadow": "#4A554F"
    },
    "dark": {
        "primary": "#B8C7C2",
        "primary-hover": "#9CAFAA",
        "primary-light": "#D0DBD7",
        "primary-dark": "#7E948E",
        "secondary": "#E5C2B7",
        "secondary-light": "#F0D6CC",
        "secondary-dark": "#D6A99D",
        "bg-primary": "#2F3A35",
        "bg-secondary": "#3A4742",
        "bg-tertiary": "#4A554F",
        "text-primary": "#FBF3D5",
        "text-secondary": "#D6DAC8",
        "text-muted": "#9CAFAA",
        "border-color": "#4A554F",
        "border-light": "#5C6862",
        "info": "#B8C7C2",
        "success": "#8FB39E",
        "warning": "#D6BB87",
        "danger": "#D69876",
        "trend-up": "#8FB39E",
        "trend-down": "#D69876",
        "trend-stable": "#B8C7C2",
        "trend-none": "#8A8580",
        "shadow": "#000000"
    },
    "palette": [
        "#9CAFAA",
        "#D6A99D",
        "#D6DAC8",
        "#FBF3D5",
        "#7E948E",
        "#B58C7F",
        "#4A554F"
    ],
    "chartBars": [
        "#F5D2D2",
        "#F8F7BA",
        "#BDE3C3",
        "#A3CCDA"
    ],
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

    global.DesignTokens = Object.assign({}, data, { current, color, withAlpha });
})(window);
