/* Game engine: runs a mission challenge-by-challenge, applies scoring, hints, persistence and completion. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui;
  const S = () => DL.state.get();
  let cur = null; // { m, run, t0 }

  /* ---------- navigation ---------- */
  DL.nav = {
    show(name) {
      ['welcome', 'dashboard', 'mission', 'victory'].forEach(n => { const el = document.getElementById('screen-' + n); if (el) { el.hidden = n !== name; if (n === name) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); } } });
      window.scrollTo(0, 0);
      const app = document.getElementById('app'); if (app && app.focus) app.focus({ preventScroll: true });
    }
  };

  function getMission(id) { return id === 'final' ? DL.finalMission : (DL.missions || []).find(m => m.id === id); }
  DL.getMission = getMission;

  /* ---------- starting / leaving ---------- */
  function newRun() { return { seed: DL.rand.newSeed(), idx: 0, done: {}, score: 0, wrong: 0, hints: 0, hinted: {}, hintLevel: {}, shared: {}, correctCount: 0, ms: 0 }; }

  function startMission(id, fresh) {
    const m = getMission(id);
    if (!m || !DL.state.isUnlocked(id)) { DL.ui.toast('Locked', 'Complete the previous investigation first.', 'bad'); return; }
    let run = S().progress[id];
    if (fresh || !run) { run = S().progress[id] = newRun(); }
    const firstOpen = m.challenges.findIndex(c => !run.done[c.id]);
    run.idx = firstOpen === -1 ? m.challenges.length - 1 : firstOpen;
    cur = { m, run, t0: Date.now() };
    DL.state.save(); renderMission(); DL.nav.show('mission');
    DL.ui.announce('Mission ' + (m.number || 'final') + ': ' + m.title + ' started.');
  }

  function flushTime() { if (cur) { const d = Date.now() - cur.t0; S().stats.playMs += d; cur.run.ms = (cur.run.ms || 0) + d; cur.t0 = Date.now(); } }
  function leaveMission() { flushTime(); DL.state.save(); cur = null; DL.dashboard.render(); DL.nav.show('dashboard'); }

  /* ---------- rendering ---------- */
  function updateHeader() {
    if (!cur) return;
    const sc = document.getElementById('run-score'); if (sc) sc.textContent = cur.run.score;
    const pips = document.getElementById('pips');
    if (pips) { DL.ui.clear(pips); cur.m.challenges.forEach((c, i) => pips.appendChild(h('span', { class: 'pip' + (cur.run.done[c.id] ? ' done' : i === cur.run.idx ? ' cur' : ''), title: c.title }))); pips.setAttribute('aria-label', 'Challenge ' + (cur.run.idx + 1) + ' of ' + cur.m.challenges.length); }
  }

  function renderMission() {
    const root = document.getElementById('screen-mission'); DL.ui.clear(root);
    const { m } = cur;
    root.appendChild(h('div', { class: 'mission-head' },
      h('button', { class: 'btn small', type: 'button', onclick: leaveMission }, icon('left'), 'Dashboard'),
      h('div', null, h('div', { class: 'rank', text: m.number ? 'Mission ' + m.number : 'Final investigation' }), h('h2', { text: m.title })),
      h('div', { class: 'pips', id: 'pips', role: 'img' }),
      h('div', { class: 'score-box', 'aria-live': 'off' }, h('span', { class: 'muted', text: 'RUN XP' }), h('b', { id: 'run-score', text: '0' }))));
    root.appendChild(h('div', { id: 'challenge-root' }));
    renderChallenge();
  }

  function renderChallenge() {
    const { m, run } = cur; const ch = m.challenges[run.idx];
    const root = document.getElementById('challenge-root'); DL.ui.clear(root); updateHeader();
    const rng = DL.rand.make(run.seed + DL.rand.hashStr(ch.id));
    let solved = !!run.done[ch.id];
    const fb = h('div', { id: 'fb', role: 'status', 'aria-live': 'polite' });
    const work = h('div', { class: 'work' });
    const result = h('div');
    const hintBox = h('div');

    function feedback(kind, text) {
      DL.ui.clear(fb);
      if (!text) return;
      const ic = kind === 'ok' ? 'check' : kind === 'bad' ? 'x' : kind === 'warn' ? 'alert' : 'info';
      fb.appendChild(h('div', { class: 'feedback ' + kind }, icon(ic), h('div', { html: text })));
      DL.ui.announce((kind === 'ok' ? 'Correct. ' : kind === 'bad' ? 'Incorrect. ' : '') + text.replace(/<[^>]+>/g, ''));
    }

    const api = {
      rng, shared: run.shared, work, isSolved: () => solved,
      feedback,
      wrong(text) {
        if (solved) return;
        run.wrong++; S().stats.wrong++; run.score = Math.max(0, run.score + DL.scoring.POINTS.wrong);
        DL.state.save(); updateHeader(); work.classList.remove('shake'); void work.offsetWidth; work.classList.add('shake');
        feedback('bad', (text || 'Not quite.') + ' <span class="mono muted">(' + DL.scoring.POINTS.wrong + ' XP)</span>'); DL.sound.play('wrong');
      },
      note(kind, text) { if (!solved) feedback(kind || 'info', text); },
      stepOk(text) { if (solved) return; feedback('ok', text); DL.sound.play('correct'); },
      save() { DL.state.save(); },
      correct(text, opts) {
        if (solved) return; opts = opts || {}; solved = true;
        const factor = opts.factor == null ? 1 : opts.factor;
        const base = Math.round(DL.scoring.base(ch.kind) * factor);
        const bonus = run.hinted[ch.id] || factor < 1 ? 0 : DL.scoring.POINTS.noHint;
        const pts = base + bonus;
        run.score += pts; run.done[ch.id] = { pts, hint: !!run.hinted[ch.id] }; run.correctCount++; S().stats.correct++; S().insights[ch.id] = true;
        DL.state.save(); DL.achievements.check();
        feedback('ok', (text || 'Correct!') + ' <span class="mono"><b>+' + pts + ' XP</b>' + (bonus ? ' (includes +' + bonus + ' no-hint bonus)' : '') + '</span>');
        work.classList.add('glow-ok'); DL.sound.play('correct'); DL.ui.floatXP('+' + pts + ' XP', work); updateHeader();
        showResult(opts.explainExtra);
      }
    };

    function showResult(extra) {
      DL.ui.clear(result); hintBox.hidden = true;
      const last = run.idx >= m.challenges.length - 1;
      if (ch.explain) result.appendChild(h('div', { class: 'callout', style: { marginTop: '14px' } }, h('div', { class: 'panel-title' }, icon('book'), 'Why this works'), h('div', { html: typeof ch.explain === 'function' ? ch.explain(run.shared) : ch.explain }), extra || null));
      if (ch.insight) result.appendChild(h('div', { class: 'insight pop' }, h('div', { class: 'kicker', text: 'Concept unlocked' }), h('h3', { text: ch.insight.concept }), h('div', { html: ch.insight.text }), ch.insight.real ? h('div', { class: 'real' }, h('b', { text: 'REAL-WORLD APPLICATION: ' }), ch.insight.real) : null));
      result.appendChild(h('div', { class: 'answer-row', style: { marginTop: '16px' } }, h('button', { class: 'btn primary', type: 'button', id: 'btn-next', onclick: () => { if (last) completeMission(); else { run.idx++; DL.state.save(); renderChallenge(); window.scrollTo(0, 0); } } }, last ? 'Complete investigation' : 'Next challenge', icon('right'))));
      const nb = document.getElementById('btn-next'); if (nb) nb.focus({ preventScroll: false });
    }

    /* hint system */
    function renderHints() {
      DL.ui.clear(hintBox); if (solved || !(ch.hints && ch.hints.length)) return;
      const lvl = run.hintLevel[ch.id] || 0;
      hintBox.appendChild(h('button', { class: 'btn small', type: 'button', disabled: lvl >= ch.hints.length, onclick: () => {
        const l = run.hintLevel[ch.id] || 0; if (l >= ch.hints.length) return;
        run.hintLevel[ch.id] = l + 1; run.hinted[ch.id] = true; run.hints++; S().stats.hints++; run.score = Math.max(0, run.score + DL.scoring.POINTS.hint);
        DL.state.save(); updateHeader(); renderHints(); DL.ui.announce('Hint: ' + ch.hints[l]); DL.sound.play('click');
      } }, icon('bulb'), lvl >= ch.hints.length ? 'No more hints' : (lvl ? 'Another hint' : 'Need a hint?') + ' (' + DL.scoring.POINTS.hint + ' XP)'));
      for (let i = 0; i < lvl; i++) hintBox.appendChild(h('div', { class: 'hint-panel' }, h('h4', { text: 'Hint ' + (i + 1) }), h('div', { html: ch.hints[i] })));
    }

    const kindTag = ch.kind === 'practical' ? h('span', { class: 'tag purple', text: 'Practical task · 150 XP' }) : h('span', { class: 'tag cyan', text: 'Puzzle · 100 XP' });
    const panel = h('article', { class: 'panel challenge', 'aria-labelledby': 'ch-title' },
      h('div', null,
        h('div', { class: 'row', style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' } },
          h('span', { class: 'tag', text: 'Challenge ' + (run.idx + 1) + ' / ' + m.challenges.length }), h('span', { class: 'tag amber', text: ch.mechanic || '' }), kindTag),
        h('h3', { id: 'ch-title', text: ch.title }),
        ch.story ? h('p', { class: 'story-line', text: ch.story }) : null,
        h('p', { html: ch.intro }),
        h('div', { class: 'objective' }, h('b', { text: 'OBJECTIVE · ' }), h('span', { html: ch.objective })),
        ch.instructions ? h('p', { class: 'muted', html: ch.instructions }) : null),
      work, fb, hintBox, result);
    root.appendChild(panel);

    if (solved) { work.appendChild(h('p', { class: 'muted', text: 'You already solved this challenge in this run.' })); showResult(); feedback('ok', 'Challenge already solved.'); return; }
    let data; try { data = ch.setup ? ch.setup(rng, run.shared) : {}; ch.render(work, data, api); }
    catch (e) { console.error(e); work.appendChild(h('div', { class: 'feedback bad' }, icon('alert'), 'This challenge could not load. Return to the dashboard and try again.')); }
    renderHints(); DL.state.save();
  }

  /* ---------- completion ---------- */
  function completeMission() {
    flushTime();
    const { m, run } = cur, id = m.id; const S0 = S();
    const wasDone = DL.state.isCompleted(id), unlockedBefore = DL.state.completedCount();
    run.score += DL.scoring.POINTS.completion;
    const perfect = run.wrong === 0 && run.hints === 0;
    if (id === 'final') { S0.final.done = true; S0.final.best = Math.max(S0.final.best, run.score); }
    else {
      const rec = S0.missions[id] || { completed: false, best: 0, attempts: 0, perfect: false };
      rec.completed = true; rec.best = Math.max(rec.best, run.score); rec.attempts++; rec.perfect = rec.perfect || perfect; S0.missions[id] = rec;
    }
    DL.state.unlock();
    const finished = { m, run: JSON.parse(JSON.stringify(run)), perfect, firstTime: !wasDone };
    delete S0.progress[id]; DL.state.save(); cur = null;
    DL.achievements.check({ perfect });
    DL.sound.play('complete');
    if (id !== 'final' && DL.state.completedCount() > unlockedBefore) {
      if (id === 'm5') DL.ui.toast('Final investigation unlocked', 'Combine everything you learned to solve the case.', 'ok', 5000);
      else DL.ui.toast('Mission unlocked', 'Investigation ' + (m.number + 1) + ' is now available.', 'ok', 4500);
      DL.sound.play('unlock');
    }
    if (id === 'final') DL.victory.render(finished); else renderReport(finished);
  }

  function renderReport(f) {
    const { m, run } = f, root = document.getElementById('screen-mission'); DL.ui.clear(root);
    const max = DL.scoring.maxForMission(m);
    const nextId = m.number && m.number < 5 ? 'm' + (m.number + 1) : (m.number === 5 ? 'final' : null);
    root.appendChild(h('div', { class: 'panel report pop' },
      h('div', { class: 'rank', text: 'Case report · Mission ' + m.number }), h('h2', { text: m.title + ' — CASE CLOSED' }),
      h('p', { html: m.closing || 'Investigation complete.' }),
      h('div', { class: 'report-grid' },
        stat(run.score + ' / ' + max, 'Mission score'), stat(run.correctCount, 'Challenges solved'), stat(run.wrong, 'Wrong attempts'), stat(run.hints, 'Hints used'), stat(DL.ui.fmtTime(run.ms || 0), 'Time')),
      f.perfect ? h('p', { class: 'tag purple', text: '★ Perfect investigation — no mistakes, no hints' }) : null,
      m.report ? m.report(run.shared) : null,
      h('div', { class: 'panel-title', style: { marginTop: '18px' } }, 'Concepts unlocked'),
      h('ul', null, m.challenges.map(c => c.insight ? h('li', null, h('b', { text: c.insight.concept + ': ' }), c.insight.short || '') : null)),
      !f.firstTime ? h('p', { class: 'muted', text: 'Replay note: your best score is kept and the completion bonus is only counted once.' }) : null,
      h('div', { class: 'answer-row' },
        nextId && DL.state.isUnlocked(nextId) ? h('button', { class: 'btn primary', type: 'button', onclick: () => startMission(nextId, false) }, nextId === 'final' ? 'Begin final investigation' : 'Next mission', icon('right')) : null,
        h('button', { class: 'btn', type: 'button', onclick: () => { DL.dashboard.render(); DL.nav.show('dashboard'); } }, 'Back to dashboard'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => startMission(m.id, true) }, icon('reset'), 'Replay (new data)'))));
    DL.nav.show('mission'); DL.ui.announce('Mission complete. Case report ready.');
  }
  function stat(v, l) { return h('div', { class: 'stat' }, h('b', { text: String(v) }), h('span', { text: l })); }

  DL.engine = { startMission, leaveMission, getMission, stat };
})(window.DL);
