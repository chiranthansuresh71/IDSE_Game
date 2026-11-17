/* UI helpers: element builder, icons, toasts, modals, screen-reader announcements. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const ui = {};

  ui.h = function (tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      const v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  };
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(x => append(el, x)); return; }
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  const h = ui.h;
  ui.clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  ui.$ = (sel, root) => (root || document).querySelector(sel);
  ui.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---- icons (inline SVG, Lucide-style strokes) ---- */
  const ICONS = {
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V22h16"/>',
    flag: '<path d="M4 22V4M4 4h14l-2 4 2 4H4"/>'
  };
  ui.icon = function (name, cls) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'icon ' + (cls || '')); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.innerHTML = ICONS[name] || ICONS.info; return s;
  };

  /* ---- announcements & toasts ---- */
  ui.announce = function (msg) {
    const r = document.getElementById('sr-live'); if (!r) return;
    r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 30);
  };
  ui.toast = function (title, body, kind, ms) {
    const root = document.getElementById('toast-root'); if (!root) return;
    const t = h('div', { class: 'toast ' + (kind || ''), role: 'status' }, h('b', { text: title }), body ? h('span', { text: body }) : null);
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 450); }, ms || 3800);
  };
  ui.floatXP = function (text, anchor) {
    const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0 };
    const d = h('div', { class: 'xp-float', text, 'aria-hidden': 'true', style: { left: (r.left + r.width / 2 - 30) + 'px', top: (r.top - 10) + 'px' } });
    document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
  };

  /* ---- modal ---- */
  ui.modal = function (opts) {
    const root = document.getElementById('modal-root');
    const prev = document.activeElement;
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); if (opts.onClose) opts.onClose(); };
    const onKey = e => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') { // simple focus trap
        const f = back.querySelectorAll('button,input,select,[href],[tabindex]:not([tabindex="-1"])'); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const actions = h('div', { class: 'actions' });
    (opts.actions || [{ label: 'Close', primary: true }]).forEach(a => {
      actions.appendChild(h('button', { class: 'btn ' + (a.primary ? 'primary' : a.danger ? 'danger' : ''), type: 'button', onclick: () => { const keep = a.onClick ? a.onClick() === false : false; if (!keep) close(); } }, a.label));
    });
    const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title }, h('h2', null, opts.icon ? ui.icon(opts.icon) : null, opts.title), opts.body, actions);
    const back = h('div', { class: 'modal-back', onclick: e => { if (e.target === back) close(); } }, modal);
    root.appendChild(back); document.addEventListener('keydown', onKey);
    const f = modal.querySelector('input,button'); if (f) f.focus();
    return { close, el: modal };
  };
  ui.confirm = function (title, text, okLabel, onOk, danger) {
    return ui.modal({ title, icon: 'alert', body: h('p', { text }), actions: [{ label: 'Cancel' }, { label: okLabel, primary: !danger, danger: !!danger, onClick: onOk }] });
  };

  ui.fmtTime = ms => { const s = Math.round(ms / 1000), m = Math.floor(s / 60); return m + 'm ' + String(s % 60).padStart(2, '0') + 's'; };
  ui.pct = (a, b) => (b ? Math.round(100 * a / b) : 0);

  /* ---- background particles (lightweight) ---- */
  ui.startParticles = function () {
    const cv = document.getElementById('bg-canvas'); if (!cv || !cv.getContext) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = cv.getContext('2d'); let w, hh, pts = [];
    const size = () => { w = cv.width = window.innerWidth; hh = cv.height = window.innerHeight; pts = Array.from({ length: Math.min(46, Math.floor(w / 28)) }, () => ({ x: Math.random() * w, y: Math.random() * hh, v: .15 + Math.random() * .35, r: 1 + Math.random() * 1.6, t: Math.random() > .5 ? '1' : '0' })); };
    size(); window.addEventListener('resize', size);
    c.font = '12px DM Mono, monospace';
    (function frame() {
      if (document.body.classList.contains('reduce-motion')) { c.clearRect(0, 0, w, hh); setTimeout(frame, 1000); return; }
      c.clearRect(0, 0, w, hh);
      pts.forEach(p => { p.y -= p.v; if (p.y < -10) { p.y = hh + 10; p.x = Math.random() * w; } c.fillStyle = 'rgba(80,227,230,.35)'; c.fillText(p.t, p.x, p.y); });
      requestAnimationFrame(frame);
    })();
  };

  DL.ui = ui;
})(window.DL);
