/* Arcade engine: a real-time "sorting conveyor" mini-game used by several levels.
   Items slide down a belt; the player routes the front item to the right bin (click or keys 1-9).
   Wrong routes / missed items damage System Integrity; reaching the goal wins the level. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui;
  DL.arcade = {};

  DL.arcade.conveyor = function (root, spec, api) {
    const S = { integrity: spec.lives || 3, correct: 0, wrong: 0, combo: 0, bestCombo: 0, items: [], fall: spec.fall || 9000, spawned: 0, running: false, over: false };
    const relaxed = () => document.body.classList.contains('reduce-motion') || relaxedBtn.getAttribute('aria-pressed') === 'true';
    const lane = h('div', { class: 'lane', role: 'group', 'aria-label': 'Conveyor belt: the lowest item is the active one' });
    const pips = h('div', { class: 'pips-hp', 'aria-label': 'System integrity' });
    const prog = h('div', { class: 'progress' }, h('i', { style: { width: '0%' } }));
    const comboEl = h('b', { class: 'mono', text: 'x0' }), accEl = h('b', { class: 'mono', text: '–' }), cntEl = h('b', { class: 'mono', text: '0 / ' + spec.goal });
    const ticker = h('div', { class: 'ticker', role: 'status', 'aria-live': 'polite', text: spec.tip || 'Route the lowest item to the correct bin.' });
    const relaxedBtn = h('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': 'false', onclick: e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? 'Relaxed mode: on' : 'Relaxed mode (no timer)'; } }, 'Relaxed mode (no timer)');
    const overlay = h('div', { class: 'lane-overlay' });
    const bins = h('div', { class: 'bins', style: { gridTemplateColumns: 'repeat(' + spec.bins.length + ',1fr)' } }, spec.bins.map((b, i) => h('button', { class: 'bin', type: 'button', 'data-bin': b.id, 'aria-label': b.label + ' (key ' + (i + 1) + ')', onclick: () => press(b.id) }, h('kbd', { text: String(i + 1) }), h('span', { class: 'bl', text: b.label }), b.desc ? h('small', { text: b.desc }) : null)));
    lane.appendChild(overlay);
    root.appendChild(h('div', { class: 'arcade' },
      h('div', { class: 'hud' }, h('div', null, h('small', { class: 'muted', text: 'SYSTEM INTEGRITY' }), pips), h('div', null, h('small', { class: 'muted', text: 'COMBO' }), comboEl), h('div', null, h('small', { class: 'muted', text: 'ACCURACY' }), accEl), h('div', null, h('small', { class: 'muted', text: 'PROCESSED' }), cntEl)),
      prog, lane, ticker, bins, h('div', { class: 'answer-row' }, relaxedBtn)));

    function hud() {
      DL.ui.clear(pips); for (let i = 0; i < (spec.lives || 3); i++) pips.appendChild(h('span', { class: 'hp' + (i < S.integrity ? '' : ' lost') }, icon('shield')));
      comboEl.textContent = 'x' + S.combo; const tot = S.correct + S.wrong; accEl.textContent = tot ? Math.round(100 * S.correct / tot) + '%' : '–'; cntEl.textContent = S.correct + ' / ' + spec.goal; prog.firstChild.style.width = Math.min(100, 100 * S.correct / spec.goal) + '%';
    }
    function say(kind, text) { ticker.className = 'ticker ' + kind; ticker.textContent = text; }
    function showOverlay(title, text, label, fn) { DL.ui.clear(overlay); overlay.hidden = false; overlay.append(h('div', { class: 'ov-box' }, h('h3', { text: title }), h('p', { html: text }), h('button', { class: 'btn primary', type: 'button', onclick: fn, id: 'arcade-go' }, icon('play'), label))); const g = overlay.querySelector('button'); if (g) g.focus({ preventScroll: true }); }
    function start() { overlay.hidden = true; S.running = true; S.items.forEach(i => i.el.remove()); S.items = []; S.integrity = spec.lives || 3; S.correct = 0; S.wrong = 0; S.combo = 0; S.spawned = 0; S.fall = spec.fall || 9000; S.over = false; say('', spec.tip || ''); hud(); last = performance.now(); }
    function spawn() {
      const data = spec.next(api.rng, S.spawned++); const el = h('div', { class: 'fall-item' }, h('span', { class: 'fi-main', text: data.label }), data.sub ? h('small', { text: data.sub }) : null);
      lane.appendChild(el); S.items.push({ el, y: 0, data }); markFront();
    }
    function markFront() { S.items.forEach((it, i) => it.el.classList.toggle('front', i === 0)); }
    function flash(cls) { lane.classList.remove('flash-ok', 'flash-bad'); void lane.offsetWidth; lane.classList.add(cls); }
    function dmg() { S.integrity--; S.combo = 0; hud(); if (S.integrity <= 0) lose(); }
    function press(binId) {
      if (!S.running || S.over || !S.items.length) return; const it = S.items.shift(), ok = it.data.bin === binId; it.el.remove(); markFront();
      if (ok) { S.correct++; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); S.fall = Math.max(spec.minFall || 4200, S.fall * 0.965); flash('flash-ok'); say('ok', '✓ ' + it.data.why); DL.sound.play('click'); }
      else { S.wrong++; flash('flash-bad'); say('bad', '✗ ' + it.data.label + ' — ' + it.data.why); DL.sound.play('wrong'); dmg(); }
      hud(); if (S.correct >= spec.goal && !S.over) win();
    }
    function win() { S.over = true; S.running = false; const tot = S.correct + S.wrong; cleanup(); api.correct('Level cleared! ' + S.correct + ' items routed, accuracy ' + Math.round(100 * S.correct / tot) + '%, best combo x' + S.bestCombo + '.'); }
    function lose() { S.over = true; S.running = false; S.items.forEach(i => i.el.remove()); S.items = []; api.wrong('System integrity failed.'); showOverlay('CONTAINMENT FAILED', 'Too many corrupted routings. Read the ticker messages — they explain each rule. Try again!', 'Retry level', start); }
    let last = 0, raf = 0;
    function cleanup() { document.removeEventListener('keydown', onKey); cancelAnimationFrame(raf); }
    function onKey(e) { if (!root.isConnected) { cleanup(); return; } if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; const n = parseInt(e.key, 10); if (n >= 1 && n <= spec.bins.length) { e.preventDefault(); press(spec.bins[n - 1].id); } }
    document.addEventListener('keydown', onKey);
    function frame(t) {
      if (!root.isConnected) { cleanup(); return; }
      const dt = Math.min(80, t - last); last = t;
      if (S.running && !S.over) {
        const rel = relaxed(), laneH = lane.clientHeight || 260;
        if (rel) { if (!S.items.length && S.spawned < spec.goal + 40) spawn(); S.items.forEach((it, i) => { it.y = 0.55 - i * 0.0; }); }
        else {
          if ((S.items.length === 0 || S.items[S.items.length - 1].y > 0.42) && S.items.length < 3) spawn();
          for (let i = S.items.length - 1; i >= 0; i--) { const it = S.items[i]; it.y += dt / S.fall; if (it.y >= 1) { S.items.splice(i, 1); it.el.remove(); markFront(); say('bad', 'Missed: ' + it.data.label + ' — ' + it.data.why); DL.sound.play('wrong'); dmg(); if (S.over) break; } }
        }
        S.items.forEach(it => { it.el.style.top = (it.y * (laneH - 56)) + 'px'; });
      }
      raf = requestAnimationFrame(frame);
    }
    hud(); showOverlay(spec.title || 'Ready?', spec.brief || '', 'Start', start); raf = requestAnimationFrame(frame);
    root.__arcade = { front: () => (S.items[0] ? S.items[0].data : null), press, state: S, start };
  };
})(window.DL);
