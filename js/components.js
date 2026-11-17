/* Reusable interactive components shared by all missions. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui;
  const comp = {};

  comp.parseNum = function (s) {
    if (typeof s === 'number') return s;
    const t = String(s == null ? '' : s).trim().replace(/,/g, '').replace(/%$/, '');
    if (t === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
    return parseFloat(t);
  };
  comp.close = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 0.05 : tol);

  /* ---- numeric field ---- */
  comp.numField = function (label, opts) {
    opts = opts || {};
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    const input = h('input', { id, type: 'text', inputmode: 'decimal', class: 'mono', placeholder: opts.placeholder || '', autocomplete: 'off', 'aria-label': label, size: opts.size || 10 });
    const el = h('div', { class: 'field' }, h('label', { for: id, text: label }), input);
    return { el, input, value: () => comp.parseNum(input.value), raw: () => input.value, disable: d => { input.disabled = d; } };
  };

  /* ---- data table ---- */
  comp.table = function (spec) {
    const wrap = h('div', { class: 'table-wrap', role: 'region', 'aria-label': spec.label || 'Dataset', tabindex: '0' });
    function build() {
      const t = h('table', { class: 'data' });
      if (spec.caption) t.appendChild(h('caption', { class: 'sr-only', text: spec.caption }));
      if (spec.rowHeader) { /* leading column header */ }
      const head = h('tr'); if (spec.lead) head.appendChild(h('th', { text: spec.lead.label || '' }));
      spec.columns.forEach(c => head.appendChild(h('th', { scope: 'col', text: c.label || c.key })));
      t.appendChild(h('thead', null, head));
      const body = h('tbody');
      spec.rows.forEach((row, i) => {
        if (row == null) return;
        const cls = ['']; if (spec.rowClass) cls.push(spec.rowClass(i, row) || '');
        const tr = h('tr', { class: cls.join(' ') });
        if (spec.onRow) {
          tr.classList.add('selectable'); tr.setAttribute('tabindex', '0'); tr.setAttribute('aria-selected', String(/\bsel\b/.test(tr.className)));
          const fire = () => spec.onRow(i, row);
          tr.addEventListener('click', fire);
          tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
        }
        if (spec.lead) tr.appendChild(h('td', null, spec.lead.render(i, row)));
        spec.columns.forEach(c => {
          const raw = row[c.key]; const empty = raw === '' || raw == null;
          const ccls = []; if (empty && !spec.cellRender) ccls.push('empty'); if (spec.cellClass) ccls.push(spec.cellClass(i, c.key, row) || '');
          const td = h('td', { class: ccls.join(' ') });
          if (spec.cellRender) { const r = spec.cellRender(i, c.key, row); if (r !== undefined) { td.append(r.nodeType ? r : document.createTextNode(String(r))); } else td.textContent = empty ? '—' : raw; }
          else td.textContent = empty ? '(empty)' : raw;
          if (spec.onCell) {
            td.classList.add('cellbtn'); td.setAttribute('tabindex', '0'); td.setAttribute('role', 'button');
            td.setAttribute('aria-label', c.label + ' of row ' + (i + 1) + ': ' + (empty ? 'empty' : raw) + (/\bflag\b/.test(td.className) ? ', flagged' : ''));
            const fire = () => spec.onCell(i, c.key, row);
            td.addEventListener('click', fire); td.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
          }
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      t.appendChild(body); return t;
    }
    const api = { el: wrap, refresh() { const sx = wrap.scrollLeft; DL.ui.clear(wrap).appendChild(build()); wrap.scrollLeft = sx; } };
    api.refresh(); return api;
  };

  /* ---- drag-and-drop / click-to-place classifier ---- */
  comp.classify = function (spec) {
    const place = {}; spec.items.forEach(i => { place[i.id] = null; });
    let selected = null, locked = false;
    const chips = {}, drops = {};
    const msg = h('div', { class: 'sr-live-note', role: 'status' });
    const pool = h('div', { class: 'pool', 'aria-label': 'Unsorted items' });
    pool.addEventListener('dragover', e => { if (!locked) e.preventDefault(); });
    pool.addEventListener('drop', e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (chips[id]) move(id, null); });
    function setSel(id) {
      selected = id; Object.keys(chips).forEach(k => chips[k].setAttribute('aria-pressed', String(k === id)));
      msg.textContent = id ? 'Selected "' + chips[id].dataset.label + '". Now choose a category.' : '';
    }
    function move(id, b) {
      if (locked) return; place[id] = b; const c = chips[id]; c.classList.remove('ok', 'no'); const m = c.querySelector('.mark'); if (m) m.remove();
      (b ? drops[b] : pool).appendChild(c); setSel(null);
      DL.ui.announce('"' + c.dataset.label + '" placed in ' + (b ? spec.buckets.find(x => x.id === b).label : 'the unsorted pool'));
      DL.sound.play('click');
    }
    spec.items.forEach(it => {
      const c = h('button', { type: 'button', class: 'chip', draggable: 'true', 'aria-pressed': 'false', 'data-label': it.label }, it.label);
      c.dataset.id = it.id; chips[it.id] = c;
      c.addEventListener('dragstart', e => { if (locked) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', it.id); e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
      c.addEventListener('click', () => { if (!locked) setSel(selected === it.id ? null : it.id); });
      pool.appendChild(c);
    });
    const bucketsEl = h('div', { class: 'buckets' }, spec.buckets.map(b => {
      const drop = h('div', { class: 'drop', 'aria-label': b.label + ' items' }); drops[b.id] = drop;
      const box = h('div', { class: 'bucket', 'data-bucket': b.id }, h('h4', null, b.label, h('small', { text: b.desc || '' })), drop,
        h('button', { type: 'button', class: 'btn small', onclick: () => { if (selected) move(selected, b.id); else msg.textContent = 'Pick an item first, then choose a category (or drag it here).'; } }, 'Place selected here'));
      box.addEventListener('dragover', e => { if (!locked) { e.preventDefault(); box.classList.add('over'); } });
      box.addEventListener('dragleave', () => box.classList.remove('over'));
      box.addEventListener('drop', e => { e.preventDefault(); box.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); if (chips[id]) move(id, b.id); });
      return box;
    }));
    const btn = h('button', { type: 'button', class: 'btn primary', onclick: () => {
      if (locked) return;
      if (spec.items.some(i => place[i.id] == null)) { msg.textContent = 'Place every item in a category before checking.'; DL.ui.announce('Place every item before checking.'); return; }
      const wrong = spec.items.filter(i => place[i.id] !== i.bucket).map(i => i.id);
      spec.items.forEach(i => { const c = chips[i.id]; c.classList.remove('ok', 'no'); const m = c.querySelector('.mark'); if (m) m.remove(); const bad = wrong.indexOf(i.id) >= 0; c.classList.add(bad ? 'no' : 'ok'); c.prepend(h('span', { class: 'mark', 'aria-hidden': 'true', text: bad ? '✗' : '✓' })); c.setAttribute('aria-label', i.label + (bad ? ' — incorrect' : ' — correct')); });
      if (!wrong.length) { locked = true; btn.disabled = true; spec.items.forEach(i => { chips[i.id].draggable = false; }); }
      spec.onSubmit({ ok: !wrong.length, wrong, total: spec.items.length });
    } }, icon('check'), spec.checkLabel || 'Check classification');
    const el = h('div', null, h('div', { class: 'panel-title', text: 'Unsorted evidence' }), pool, bucketsEl, h('div', { class: 'answer-row' }, btn), msg);
    return { el, lock() { locked = true; btn.disabled = true; } };
  };

  /* ---- one decision per row (segmented buttons or select) ---- */
  comp.rows = function (spec) {
    const val = {}, rowEls = {}; let locked = {};
    const msg = h('div', { class: 'sr-live-note', role: 'status' });
    const list = h('div', { class: 'row-opts' }, spec.rows.map(r => {
      const id = 'r' + Math.random().toString(36).slice(2, 8);
      let ctl;
      if (spec.select) {
        ctl = h('select', { id, 'aria-label': r.label + ' — choose', onchange: e => { val[r.id] = e.target.value || null; clearMark(r.id); } }, h('option', { value: '', text: 'Choose…' }), spec.options.map(o => h('option', { value: o.id, text: o.label })));
      } else {
        ctl = h('div', { class: 'seg', role: 'group', 'aria-label': r.label });
        spec.options.forEach(o => ctl.appendChild(h('button', { type: 'button', 'aria-pressed': 'false', onclick: e => { if (locked[r.id]) return; val[r.id] = o.id; ctl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); clearMark(r.id); DL.sound.play('click'); } }, o.label)));
      }
      const row = h('div', { class: 'orow' }, h('div', { class: 'lbl' }, r.label, r.sub ? h('small', { text: r.sub }) : null), ctl);
      rowEls[r.id] = { row, ctl }; return row;
    }));
    function clearMark(id) { const r = rowEls[id].row; r.classList.remove('no'); const m = r.querySelector('.rm'); if (m) m.remove(); }
    const btn = h('button', { type: 'button', class: 'btn primary', onclick: () => {
      if (spec.rows.some(r => !val[r.id])) { msg.textContent = 'Make a choice for every row first.'; DL.ui.announce('Make a choice for every row first.'); return; }
      const wrong = [];
      spec.rows.forEach(r => {
        if (locked[r.id]) return; const el = rowEls[r.id].row; clearMark(r.id); el.classList.remove('ok');
        const bad = val[r.id] !== r.answer;
        if (bad) { wrong.push(r.id); el.classList.add('no'); el.appendChild(h('span', { class: 'rm tag red', text: '✗ not quite' })); }
        else { el.classList.add('ok'); locked[r.id] = true; el.appendChild(h('span', { class: 'rm tag green', text: '✓ correct' })); rowEls[r.id].ctl.querySelectorAll('button,select').forEach(b => { b.disabled = true; }); if (rowEls[r.id].ctl.tagName === 'SELECT') rowEls[r.id].ctl.disabled = true; }
      });
      if (!wrong.length) btn.disabled = true;
      spec.onSubmit({ ok: !wrong.length, wrong, total: spec.rows.length });
    } }, icon('check'), spec.checkLabel || 'Check answers');
    return { el: h('div', null, list, h('div', { class: 'answer-row' }, btn), msg), lock() { btn.disabled = true; } };
  };

  /* ---- multi-select checklist ---- */
  comp.checks = function (spec) {
    const boxes = {};
    const list = h('div', { class: 'checks', role: 'group', 'aria-label': spec.label || 'Options' }, spec.items.map(it => {
      const cb = h('input', { type: 'checkbox', id: 'c' + Math.random().toString(36).slice(2, 8) }); boxes[it.id] = cb;
      return h('label', { class: 'check', for: cb.id }, cb, h('span', null, it.label));
    }));
    const btn = h('button', { type: 'button', class: 'btn primary', onclick: () => {
      const chosen = spec.items.filter(i => boxes[i.id].checked).map(i => i.id);
      if (!chosen.length) { DL.ui.announce('Select at least one option.'); return; }
      const wrong = spec.items.filter(i => boxes[i.id].checked !== !!i.correct).map(i => i.id);
      spec.onSubmit({ ok: !wrong.length, wrong, chosen });
    } }, icon('check'), spec.checkLabel || 'Submit selection');
    return { el: h('div', null, list, h('div', { class: 'answer-row' }, btn)), lock() { btn.disabled = true; Object.values(boxes).forEach(b => { b.disabled = true; }); }, boxes };
  };

  /* ---- single-choice radio list ---- */
  comp.choice = function (spec) {
    const name = 'q' + Math.random().toString(36).slice(2, 8); let chosen = null;
    const list = h('div', { class: 'checks', role: 'radiogroup', 'aria-label': spec.label || 'Choose one' }, spec.options.map(o => {
      const r = h('input', { type: 'radio', name, value: o.id, onchange: () => { chosen = o.id; } });
      return h('label', { class: 'check' }, r, h('span', null, o.label));
    }));
    const btn = h('button', { type: 'button', class: 'btn primary', onclick: () => { if (!chosen) { DL.ui.announce('Choose an answer first.'); return; } spec.onSubmit(chosen); } }, icon('check'), spec.checkLabel || 'Submit');
    return { el: h('div', null, list, h('div', { class: 'answer-row' }, btn)), lock() { btn.disabled = true; list.querySelectorAll('input').forEach(i => { i.disabled = true; }); } };
  };

  /* ---- SVG number line with optional marker (used for mean / median) ---- */
  comp.numberLine = function (values, marker, label) {
    const NS = 'http://www.w3.org/2000/svg', W = 560, H = 80, pad = 24;
    const mn = Math.min.apply(null, values.concat(marker == null ? [] : [marker])), mx = Math.max.apply(null, values.concat(marker == null ? [] : [marker]));
    const x = v => pad + (v - mn) / ((mx - mn) || 1) * (W - 2 * pad);
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 ' + W + ' ' + H); s.setAttribute('role', 'img'); s.setAttribute('aria-label', label || 'Number line'); s.style.width = '100%'; s.style.maxWidth = '620px';
    let inner = '<line x1="' + pad + '" y1="52" x2="' + (W - pad) + '" y2="52" stroke="#3a5578" stroke-width="2"/>';
    const seen = {};
    values.forEach(v => { seen[v] = (seen[v] || 0) + 1; inner += '<circle cx="' + x(v) + '" cy="' + (52 - 11 * seen[v] + 3) + '" r="5" fill="#6B8CFF"/>'; });
    [mn, mx].forEach(v => { inner += '<text x="' + x(v) + '" y="74" fill="#8DA2BD" font-size="11" text-anchor="middle" font-family="DM Mono,monospace">' + (+v.toFixed(2)) + '</text>'; });
    if (marker != null) inner += '<polygon points="' + x(marker) + ',54 ' + (x(marker) - 7) + ',68 ' + (x(marker) + 7) + ',68" fill="#5CE1A3"/><text x="' + x(marker) + '" y="14" fill="#5CE1A3" font-size="12" text-anchor="middle" font-family="DM Mono,monospace">' + (label || '') + ' ' + (+marker.toFixed(2)) + '</text>';
    s.innerHTML = inner; return s;
  };

  /* ---- mini horizontal bars (for imputation experiment) ---- */
  comp.bars = function (rows, max) {
    return h('div', { class: 'bars' }, rows.map(r => h('div', { class: 'bar-row' + (r.cls ? ' ' + r.cls : '') }, h('span', { text: r.label }), h('div', { class: 'track' }, h('i', { style: { width: Math.max(2, 100 * r.value / max) + '%' } })), h('span', { text: String(r.text != null ? r.text : r.value) }))));
  };

  DL.comp = comp;
})(window.DL);
