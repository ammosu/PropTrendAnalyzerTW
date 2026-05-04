// IconHelper.js — Lucide SVG sprite helpers
// Sprite is inlined at top of <body> in index.html.
// Usage:
//   const el = IconHelper.make('check-circle');           // returns <svg class="icon">…</svg>
//   IconHelper.set(existingEl, 'x-circle');               // swap icon on existing host
//   el.innerHTML = IconHelper.html('newspaper', 'me-2');  // build markup string
(function () {
    const NS = 'http://www.w3.org/2000/svg';
    const XLINK = 'http://www.w3.org/1999/xlink';

    function make(name, extraClass) {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', extraClass ? 'icon ' + extraClass : 'icon');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS(NS, 'use');
        use.setAttributeNS(XLINK, 'xlink:href', '#icon-' + name);
        use.setAttribute('href', '#icon-' + name);
        svg.appendChild(use);
        return svg;
    }

    function html(name, extraClass) {
        const cls = extraClass ? 'icon ' + extraClass : 'icon';
        return '<svg class="' + cls + '" aria-hidden="true"><use href="#icon-' + name + '"></use></svg>';
    }

    function set(el, name) {
        if (!el) return null;
        // Existing SVG: just swap href on inner <use>
        if (el.namespaceURI === NS && el.tagName.toLowerCase() === 'svg') {
            const useEl = el.querySelector('use');
            if (useEl) {
                useEl.setAttribute('href', '#icon-' + name);
                useEl.setAttributeNS(XLINK, 'xlink:href', '#icon-' + name);
            }
            return el;
        }
        // Otherwise replace the element with a fresh SVG icon, preserving any extra classes
        const extraClasses = (el.getAttribute && el.getAttribute('class')) || '';
        const cleaned = extraClasses
            .split(/\s+/)
            .filter(c => c && !/^fa[srlb]?$/.test(c) && !c.startsWith('fa-') && c !== 'icon')
            .join(' ');
        const newSvg = make(name, cleaned);
        if (el.parentNode) el.parentNode.replaceChild(newSvg, el);
        return newSvg;
    }

    window.IconHelper = { make, html, set };
})();
