/* Entry point: welcome screen, intro sequence, routing. */
(function (DL) {
  'use strict';
  const { h } = DL.ui;
  const $ = id => document.getElementById(id);

  const INTRO = [
    ['alert', 'NOVACORE SYSTEM ALERT'],
    ['p', 'An unidentified breach has corrupted Nova City\'s central database.'],
    ['p', 'Thousands of records are unreliable. Critical predictions are failing.'],
    ['p', 'Your mission is to investigate the corrupted datasets, uncover the hidden patterns, and restore the system.'],
    ['p', 'Welcome to the Data Investigation Unit.']
  ];

  function playIntro(done) {
    const reduce = DL.state.get().settings.reducedMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const box = h('div', { class: 'intro-box' });
    const sr = h('div', { class: 'sr-only' }, INTRO.map(l => h('p', { text: l[1] })));
    const overlay = h('div', { class: 'intro-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Introduction' }, sr, box);
    let finished = false, timers = [];
    function finish() { if (finished) return; finished = true; timers.forEach(clearTimeout); overlay.remove(); done(); }
    overlay.appendChild(h('button', { class: 'btn small skip', type: 'button', onclick: finish }, 'Skip intro'));
    document.body.appendChild(overlay); overlay.querySelector('button').focus();
    const els = INTRO.map(l => { const e = l[0] === 'alert' ? h('div', { class: 'alert', 'aria-hidden': 'true' }, DL.ui.icon('alert'), '') : h('p', { 'aria-hidden': 'true' }); box.appendChild(e); return e; });
    if (reduce) { INTRO.forEach((l, i) => { els[i].append(l[1]); }); box.appendChild(h('button', { class: 'btn primary', type: 'button', onclick: finish }, 'Enter the unit')); return; }
    let i = 0;
    (function line() {
      if (finished) return; if (i >= INTRO.length) { timers.push(setTimeout(finish, 1100)); return; }
      const text = INTRO[i][1], el = els[i], span = document.createTextNode(''); el.append(span); el.classList.add('cursor'); let c = 0;
      (function type() { if (finished) return; span.nodeValue = text.slice(0, ++c); if (c < text.length) timers.push(setTimeout(type, 18)); else { el.classList.remove('cursor'); i++; timers.push(setTimeout(line, 550)); } })();
    })();
  }

  function begin(name) {
    DL.state.setName(name); DL.dashboard.applySettings();
    const go = () => { DL.dashboard.render(); DL.nav.show('dashboard'); };
    if (!DL.state.get().introSeen) { DL.state.get().introSeen = true; DL.state.save(); playIntro(go); } else go();
  }

  function init() {
    DL.dashboard.applySettings(); DL.ui.startParticles();
    const form = $('start-form'), input = $('player-name'), err = $('name-err');
    $('btn-howto').addEventListener('click', DL.dashboard.howTo);
    const sbtn = $('btn-sound-welcome');
    const syncSound = () => { const on = DL.state.get().settings.sound; sbtn.textContent = 'Sound: ' + (on ? 'on' : 'off'); sbtn.setAttribute('aria-pressed', String(on)); };
    sbtn.addEventListener('click', () => { DL.sound.set(!DL.state.get().settings.sound); syncSound(); }); syncSound();
    form.addEventListener('submit', e => {
      e.preventDefault(); const n = DL.state.cleanName(input.value);
      if (!n) { err.textContent = 'Please enter a detective name (letters, numbers or spaces).'; input.focus(); return; }
      err.textContent = ''; DL.sound.play('click'); begin(n);
    });
    if (DL.state.hasPlayer()) { input.value = DL.state.get().player.name; DL.dashboard.render(); DL.nav.show('dashboard'); } else DL.nav.show('welcome');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.DL);
