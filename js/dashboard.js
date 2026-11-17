/* Dashboard, settings, how-to-play, knowledge review and victory screens. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui;
  const S = () => DL.state.get();
  const dash = {};

  const STATUS_LABEL = { AVAILABLE: 'AVAILABLE', PROGRESS: 'IN PROGRESS', COMPLETED: 'COMPLETED', LOCKED: 'LOCKED' };

  function howToBody() {
    return h('div', null,
      h('p', { text: 'You are a junior data scientist in the Nova City Data Investigation Unit. Each investigation teaches a data science idea through a hands-on task.' }),
      h('ol', { class: 'howto-list' },
        h('li', null, h('b', { text: 'Pick a mission' }), ' on the dashboard. Mission 1 is open; finishing a mission unlocks the next one.'),
        h('li', null, h('b', { text: 'Solve each challenge.' }), ' Drag items into categories (or tap an item, then tap a category), click table rows or cells, edit cells like a spreadsheet, click chart points, type calculations, or tune a prediction rule.'),
        h('li', null, h('b', { text: 'Wrong answer?' }), ' You lose 10 XP but can try again. The game will not simply give you the answer.'),
        h('li', null, h('b', { text: 'Stuck?' }), ' A hint costs 20 XP. Solving without hints earns +25 bonus XP.'),
        h('li', null, h('b', { text: 'Learn.' }), ' After each puzzle a Learning Insight card explains the concept and where it is used in the real world.'),
        h('li', null, h('b', { text: 'Replay any time.' }), ' Data is generated fresh each replay, so you must really do the analysis. Your best score is kept and bonuses are never counted twice.'),
        h('li', null, h('b', { text: 'Progress is saved' }), ' in your browser (LocalStorage). No account is needed.')),
      h('p', { class: 'muted', text: 'Scoring: puzzle +100 XP · practical task +150 XP · no-hint bonus +25 XP · mission completion +100 XP · wrong attempt −10 XP · hint −20 XP.' }));
  }
  dash.howTo = () => DL.ui.modal({ title: 'How to play', icon: 'help', body: howToBody() });

  dash.settings = function () {
    const sound = h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(S().settings.sound), onclick: e => { DL.sound.set(!S().settings.sound); e.currentTarget.setAttribute('aria-pressed', String(S().settings.sound)); e.currentTarget.textContent = S().settings.sound ? 'On' : 'Off'; } }, S().settings.sound ? 'On' : 'Off');
    const motion = h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(S().settings.reducedMotion), onclick: e => { S().settings.reducedMotion = !S().settings.reducedMotion; DL.state.save(); applySettings(); e.currentTarget.setAttribute('aria-pressed', String(S().settings.reducedMotion)); e.currentTarget.textContent = S().settings.reducedMotion ? 'On' : 'Off'; } }, S().settings.reducedMotion ? 'On' : 'Off');
    const nameIn = h('input', { type: 'text', maxlength: '20', class: 'mono', value: S().player.name, 'aria-label': 'Detective name' });
    const body = h('div', null,
      h('div', { class: 'switch-row' }, h('span', null, h('b', { text: 'Sound effects' }), h('br'), h('small', { class: 'muted', text: 'Off by default. Original synthesised sounds.' })), sound),
      h('div', { class: 'switch-row' }, h('span', null, h('b', { text: 'Reduce motion' }), h('br'), h('small', { class: 'muted', text: 'Also follows your system setting.' })), motion),
      h('div', { class: 'field', style: { marginTop: '12px' } }, h('label', { text: 'Detective name (progress is kept)' }), nameIn),
      h('div', { class: 'switch-row' }, h('span', null, h('b', { text: 'Reset all progress' }), h('br'), h('small', { class: 'muted', text: 'Deletes XP, missions and achievements.' })), h('button', { class: 'btn small danger', type: 'button', onclick: () => dash.confirmReset() }, icon('reset'), 'Reset')));
    DL.ui.modal({ title: 'Settings', icon: 'settings', body, actions: [{ label: 'Save & close', primary: true, onClick: () => { const n = DL.state.cleanName(nameIn.value); if (n) { DL.state.setName(n); dash.render(); } } }] });
  };

  dash.confirmReset = function () {
    DL.ui.confirm('Reset all progress?', 'This permanently deletes your XP, completed missions, achievements and settings on this device. This cannot be undone.', 'Yes, reset everything', () => {
      DL.state.reset(); applySettings(); document.getElementById('player-name').value = ''; DL.nav.show('welcome'); DL.ui.toast('Progress reset', 'Starting fresh.', '');
    }, true);
  };

  dash.review = function () {
    const ins = S().insights; const body = h('div'); let n = 0;
    DL.scoring.allMissions().forEach(m => {
      const cards = m.challenges.filter(c => ins[c.id] && c.insight);
      if (!cards.length) return;
      body.appendChild(h('h3', { text: (m.number ? 'Mission ' + m.number + ' · ' : 'Final · ') + m.title }));
      cards.forEach(c => { n++; body.appendChild(h('div', { class: 'insight' }, h('div', { class: 'kicker', text: 'Concept unlocked' }), h('h3', { text: c.insight.concept }), h('div', { html: c.insight.text }), c.insight.real ? h('div', { class: 'real' }, h('b', { text: 'REAL-WORLD APPLICATION: ' }), c.insight.real) : null)); });
    });
    if (!n) body.appendChild(h('p', { class: 'muted', text: 'No concepts unlocked yet. Solve a challenge and its Learning Insight appears here.' }));
    DL.ui.modal({ title: 'Case files — review knowledge', icon: 'book', body });
  };

  function applySettings() { document.body.classList.toggle('reduce-motion', !!S().settings.reducedMotion); }
  dash.applySettings = applySettings;

  function nextTarget() {
    const ids = DL.state.MISSION_IDS;
    let id = ids.find(i => DL.state.status(i) === 'PROGRESS') || ids.find(i => DL.state.status(i) === 'AVAILABLE');
    if (!id && DL.state.isUnlocked('final') && !DL.state.isCompleted('final')) id = 'final';
    return id;
  }

  dash.render = function () {
    const root = document.getElementById('screen-dashboard'); DL.ui.clear(root);
    const xp = DL.state.totalXP(), rank = DL.scoring.rankFor(xp), done = DL.state.completedCount();
    const overall = Math.round(100 * (done + (S().final.done ? 1 : 0)) / 6);
    const toNext = rank.next ? Math.round(100 * (xp - rank.min) / (rank.next.min - rank.min)) : 100;
    const target = nextTarget();

    root.appendChild(h('header', { class: 'topbar' },
      h('div', { class: 'brand' }, h('img', { src: 'assets/images/logo.svg', alt: '', width: 34, height: 34 }), h('span', { text: 'DATA LOCKDOWN' })),
      h('nav', { class: 'top-actions', 'aria-label': 'Game menu' },
        h('button', { class: 'btn small', type: 'button', onclick: dash.review }, icon('book'), 'Case files'),
        h('button', { class: 'btn small', type: 'button', onclick: dash.howTo }, icon('help'), 'How to play'),
        h('button', { class: 'btn small', type: 'button', onclick: dash.settings }, icon('settings'), 'Settings'))));

    root.appendChild(h('section', { class: 'profile', 'aria-label': 'Player profile' },
      h('div', { class: 'panel' },
        h('div', { class: 'panel-title' }, icon('user'), 'Agent profile'),
        h('div', { class: 'name', text: S().player.name || 'Detective' }),
        h('div', { class: 'rank', text: 'Rank: ' + rank.name }),
        h('div', { class: 'rank-bar' }, h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(toNext), 'aria-label': 'Progress to next rank' }, h('i', { style: { width: toNext + '%' } })),
          h('small', { class: 'muted mono', text: rank.next ? (rank.next.min - xp) + ' XP to ' + rank.next.name : 'Highest rank reached' })),
        h('div', { class: 'stats' }, stat(xp, 'Total XP'), stat(done + '/5', 'Missions'), stat(DL.achievements.earned() + '/' + DL.achievements.LIST.length, 'Badges'))),
      h('div', { class: 'panel' },
        h('div', { class: 'panel-title' }, icon('target'), 'Investigation progress'),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(overall), 'aria-label': 'Overall progress' }, h('i', { style: { width: overall + '%' } })),
        h('p', { class: 'mono', style: { margin: '8px 0 14px' }, text: overall + '% of the case solved' }),
        target ? h('button', { class: 'btn primary', type: 'button', onclick: () => DL.engine.startMission(target, false) }, icon('play'), (DL.state.status(target) === 'PROGRESS' ? 'Continue investigation' : target === 'final' ? 'Begin final investigation' : 'Start next investigation'))
          : h('button', { class: 'btn', type: 'button', onclick: dash.review }, icon('book'), 'Review knowledge'))));

    root.appendChild(h('h2', { class: 'section-title' }, icon('database'), 'Investigations'));
    const grid = h('div', { class: 'missions' });
    DL.missions.forEach((m, i) => grid.appendChild(missionCard(m, i)));
    root.appendChild(grid);

    // final mystery card
    const F = DL.finalMission, fst = DL.state.status('final');
    root.appendChild(h('h2', { class: 'section-title' }, icon('shield'), 'Final mystery'));
    root.appendChild(h('div', { class: 'panel final-card' + (fst === 'LOCKED' ? ' locked' : '') },
      h('div', null, h('h3', { text: F.title }), h('p', { class: 'muted', style: { margin: 0 }, text: fst === 'LOCKED' ? 'Locked — complete all five investigations to open the final case.' : F.description }),
        h('div', { style: { marginTop: '8px' } }, h('span', { class: 'status ' + fst, text: STATUS_LABEL[fst] }), ' ', h('span', { class: 'tag', text: 'Best: ' + DL.state.bestScore('final') + ' XP' }))),
      h('div', { class: 'foot', style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
        fst === 'LOCKED' ? h('button', { class: 'btn', disabled: true }, icon('lock'), 'Locked')
          : [h('button', { class: 'btn primary', type: 'button', onclick: () => DL.engine.startMission('final', fst === 'COMPLETED') }, fst === 'PROGRESS' ? 'Resume' : fst === 'COMPLETED' ? 'Replay' : 'Begin', icon('right')),
            fst === 'PROGRESS' ? h('button', { class: 'btn ghost', type: 'button', onclick: () => DL.engine.startMission('final', true) }, 'Restart') : null])));

    // achievements
    root.appendChild(h('h2', { class: 'section-title' }, icon('award'), 'Achievements'));
    root.appendChild(h('div', { class: 'badges' }, DL.achievements.LIST.map(a => {
      const got = S().achievements[a.id];
      return h('div', { class: 'badge' + (got ? ' earned' : ''), 'aria-label': a.name + (got ? ' — earned' : ' — locked') }, h('div', { class: 'bic' }, icon(got ? a.icon : 'lock')), h('div', null, h('b', { text: a.name }), h('small', { text: a.desc }), h('small', { class: got ? 'mono' : 'mono', style: { color: got ? 'var(--purple)' : 'var(--text2)' }, text: got ? 'EARNED' : 'LOCKED' })));
    })));
    root.appendChild(h('p', { class: 'muted mono', style: { marginTop: '28px', textAlign: 'center' }, text: 'Max possible XP: ' + DL.scoring.maxTotal() + ' · progress is stored only in this browser' }));
  };

  function stat(v, l) { return h('div', { class: 'stat' }, h('b', { text: String(v) }), h('span', { text: l })); }

  function missionCard(m, i) {
    const st = DL.state.status(m.id), locked = st === 'LOCKED', best = DL.state.bestScore(m.id), hasRun = !!S().progress[m.id];
    const foot = h('div', { class: 'foot' });
    if (locked) foot.appendChild(h('button', { class: 'btn', disabled: true, 'aria-label': 'Mission ' + m.number + ' locked' }, icon('lock'), 'Complete Mission ' + (m.number - 1)));
    else if (st === 'COMPLETED') {
      foot.appendChild(h('button', { class: 'btn primary', type: 'button', onclick: () => DL.engine.startMission(m.id, !hasRun) }, icon('reset'), hasRun ? 'Resume replay' : 'Replay'));
      if (hasRun) foot.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => DL.engine.startMission(m.id, true) }, 'New replay'));
    } else {
      foot.appendChild(h('button', { class: 'btn primary', type: 'button', onclick: () => DL.engine.startMission(m.id, false) }, icon('play'), st === 'PROGRESS' ? 'Resume' : 'Start'));
      if (st === 'PROGRESS') foot.appendChild(h('button', { class: 'btn ghost small', type: 'button', onclick: () => DL.engine.startMission(m.id, true) }, 'Restart'));
    }
    return h('article', { class: 'panel mcard ' + (locked ? 'locked ' : '') + (st === 'COMPLETED' ? 'completed' : ''), 'aria-label': 'Mission ' + m.number + ': ' + m.title },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, h('div', { class: 'mic' }, icon(locked ? 'lock' : st === 'COMPLETED' ? 'check' : m.icon)), h('span', { class: 'status ' + st, text: STATUS_LABEL[st] })),
      h('div', { class: 'num', text: 'MISSION ' + String(m.number).padStart(2, '0') }), h('h3', { text: m.title }), h('p', { class: 'muted', style: { margin: 0 }, text: m.description }),
      h('div', { class: 'row' }, h('span', { class: 'tag cyan', text: m.concept }), h('span', { class: 'tag amber', text: m.difficulty }), h('span', { class: 'tag', text: m.challenges.length + ' challenges' })),
      h('div', { class: 'mono muted', text: 'Best score: ' + best + ' / ' + DL.scoring.maxForMission(m) }), foot);
  }

  DL.dashboard = dash;

  /* ---------- victory ---------- */
  DL.victory = {
    render(f) {
      const root = document.getElementById('screen-victory'); DL.ui.clear(root);
      const xp = DL.state.totalXP(), rank = DL.scoring.rankFor(xp), st = S().stats, acc = DL.ui.pct(st.correct, st.correct + st.wrong);
      const concepts = []; DL.scoring.allMissions().forEach(m => m.challenges.forEach(c => { if (S().insights[c.id] && c.insight) concepts.push(c.insight.concept); }));
      const ach = DL.achievements.LIST.filter(a => S().achievements[a.id]);
      root.appendChild(h('div', { class: 'victory pop' },
        h('img', { src: 'assets/images/logo.svg', alt: '', width: 90, height: 90 }),
        h('h1', { text: 'NOVA CITY RESTORED' }), h('div', { class: 'vsub', text: 'YOU CRACKED THE DATA MYSTERY.' }),
        h('div', { class: 'panel', style: { margin: '24px auto', maxWidth: '760px', textAlign: 'left' } },
          h('div', { class: 'report-grid' }, stat(xp, 'Final score (XP)'), stat(DL.state.completedCount() + ' / 5', 'Missions completed'), stat(acc + '%', 'Accuracy'), stat(DL.ui.fmtTime(st.playMs), 'Time taken'), stat(rank.name, 'Final rank')),
          h('div', { class: 'panel-title', text: 'Achievements earned' }),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' } }, ach.map(a => h('span', { class: 'tag purple', text: a.name }))),
          h('div', { class: 'panel-title', text: 'Concepts mastered (' + concepts.length + ')' }),
          h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, concepts.map(c => h('span', { class: 'tag cyan', text: c })))),
        h('div', { class: 'answer-row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn primary', type: 'button', onclick: () => DL.ui.confirm('Replay the whole game?', 'This clears your progress and starts again from Mission 1 (your name is kept).', 'Replay game', () => { const n = S().player.name; DL.state.reset(); DL.state.setName(n); applySettings(); dash.render(); DL.nav.show('dashboard'); }, true) }, icon('reset'), 'Replay game'),
          h('button', { class: 'btn', type: 'button', onclick: dash.review }, icon('book'), 'Review knowledge'),
          h('button', { class: 'btn', type: 'button', onclick: () => { dash.render(); DL.nav.show('dashboard'); } }, 'Return to dashboard'))));
      DL.nav.show('victory'); DL.ui.announce('Nova City restored. You cracked the data mystery.');
    }
  };
})(window.DL);
