// BSCompat.js — 取代 jQuery + bootstrap.js 中我們有用到的部分（modal / collapse / dropdown / buttons-group）
// 不模擬完整 BS API，只提供本專案 callsite 需要的最小集合。
(function () {
    'use strict';

    function emit(el, name) {
        el.dispatchEvent(new CustomEvent(name, { bubbles: true }));
    }

    // ==================== Modal ====================
    let openModalCount = 0;

    function ensureBackdrop() {
        let bd = document.querySelector('.modal-backdrop');
        if (!bd) {
            bd = document.createElement('div');
            bd.className = 'modal-backdrop fade show';
            document.body.appendChild(bd);
        }
        return bd;
    }

    const Modal = {
        show(el) {
            if (!el || el.classList.contains('show')) return;
            ensureBackdrop();
            document.body.classList.add('modal-open');
            el.style.display = 'block';
            el.setAttribute('aria-hidden', 'false');
            // reflow before adding .show 讓 fade transition 生效
            // eslint-disable-next-line no-unused-expressions
            el.offsetHeight;
            el.classList.add('show');
            openModalCount++;
            emit(el, 'shown.bs.modal');
        },
        hide(el) {
            if (!el || !el.classList.contains('show')) return;
            el.classList.remove('show');
            el.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                el.style.display = 'none';
                openModalCount = Math.max(0, openModalCount - 1);
                if (openModalCount === 0) {
                    document.body.classList.remove('modal-open');
                    const bd = document.querySelector('.modal-backdrop');
                    if (bd) bd.remove();
                }
                emit(el, 'hidden.bs.modal');
            }, 150);
        }
    };

    // 點背景或 [data-dismiss="modal"] 關閉
    document.addEventListener('click', (e) => {
        const dismissEl = e.target.closest('[data-dismiss="modal"]');
        if (dismissEl) {
            const m = dismissEl.closest('.modal');
            if (m) Modal.hide(m);
            return;
        }
        if (e.target.classList && e.target.classList.contains('modal') && e.target.classList.contains('show')) {
            Modal.hide(e.target);
        }
    });

    // ESC 關閉最上層 modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const open = document.querySelector('.modal.show');
            if (open) Modal.hide(open);
        }
    });

    // ==================== Collapse ====================
    const COLLAPSE_DURATION = 350;

    function settleAfter(el, fn) {
        let done = false;
        const finish = () => { if (done) return; done = true; el.removeEventListener('transitionend', finish); fn(); };
        el.addEventListener('transitionend', finish);
        setTimeout(finish, COLLAPSE_DURATION + 50); // fallback：若 transitionend 沒觸發（瀏覽器或 CSS 缺 transition）
    }

    const Collapse = {
        show(el) {
            if (!el || el.classList.contains('show')) return;
            el.classList.remove('collapse');
            el.classList.add('collapsing');
            el.style.height = '0px';
            const target = el.scrollHeight + 'px';
            el.getBoundingClientRect(); // force reflow
            el.style.height = target;
            settleAfter(el, () => {
                el.classList.remove('collapsing');
                el.classList.add('collapse', 'show');
                el.style.height = '';
                emit(el, 'shown.bs.collapse');
            });
        },
        hide(el) {
            if (!el || !el.classList.contains('show')) return;
            el.style.height = el.scrollHeight + 'px';
            el.getBoundingClientRect();
            el.classList.remove('show', 'collapse');
            el.classList.add('collapsing');
            el.style.height = '0px';
            settleAfter(el, () => {
                el.classList.remove('collapsing');
                el.classList.add('collapse');
                el.style.height = '';
                emit(el, 'hidden.bs.collapse');
            });
        },
        toggle(el) {
            if (!el) return;
            if (el.classList.contains('show')) Collapse.hide(el);
            else Collapse.show(el);
        }
    };

    // [data-toggle="collapse"] 自動綁定
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-toggle="collapse"]');
        if (!trigger) return;
        e.preventDefault();
        const targetSel = trigger.getAttribute('data-target') || trigger.getAttribute('href');
        if (!targetSel) return;
        const target = document.querySelector(targetSel);
        if (!target) return;
        Collapse.toggle(target);
        const expanded = target.classList.contains('show') || target.classList.contains('collapsing');
        trigger.setAttribute('aria-expanded', String(expanded));
    });

    // ==================== Dropdown ====================
    function closeAllDropdowns(except) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            if (menu !== except) {
                menu.classList.remove('show');
                const parent = menu.closest('.dropdown, .btn-group');
                if (parent) parent.classList.remove('show');
                const trigger = parent?.querySelector('[data-toggle="dropdown"]');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-toggle="dropdown"]');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            const parent = trigger.closest('.dropdown, .btn-group');
            const menu = parent?.querySelector('.dropdown-menu');
            if (!menu) return;
            const wasOpen = menu.classList.contains('show');
            closeAllDropdowns(wasOpen ? null : menu);
            if (!wasOpen) {
                menu.classList.add('show');
                parent.classList.add('show');
                trigger.setAttribute('aria-expanded', 'true');
            } else {
                menu.classList.remove('show');
                parent.classList.remove('show');
                trigger.setAttribute('aria-expanded', 'false');
            }
            return;
        }
        // 點外部關閉
        if (!e.target.closest('.dropdown-menu')) {
            closeAllDropdowns(null);
        }
    });

    // ==================== Buttons (data-toggle="buttons") ====================
    // BS4 .btn-group-toggle 內的 label.btn 包 input checkbox/radio：點 label 切換 input 的 checked + .active
    document.addEventListener('click', (e) => {
        const label = e.target.closest('[data-toggle="buttons"] label.btn');
        if (!label) return;
        const input = label.querySelector('input[type="checkbox"], input[type="radio"]');
        if (!input) return;
        // 讓 label 點擊預設行為觸發 input 的 click 即可，再同步 .active class
        // 用 setTimeout 等待 input 狀態更新
        setTimeout(() => {
            if (input.type === 'radio') {
                // group 內所有 label 移 active
                const group = label.closest('[data-toggle="buttons"]');
                group.querySelectorAll('label.btn.active').forEach(l => l.classList.remove('active'));
                if (input.checked) label.classList.add('active');
            } else {
                label.classList.toggle('active', input.checked);
            }
        }, 0);
    });

    // ==================== 公開 API ====================
    window.BSCompat = { Modal, Collapse, closeAllDropdowns };
})();
