/* Original sound effects synthesised with the Web Audio API (no audio files, no licensing issues).
   Sound is OFF by default and only starts after the player enables it. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  let ctx = null;
  function ac() {
    if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { ctx = new A(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, vol) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SFX = {
    click() { tone(620, 0, 0.05, 'square', 0.04); },
    correct() { tone(523, 0, 0.12, 'triangle'); tone(659, 0.1, 0.12, 'triangle'); tone(784, 0.2, 0.2, 'triangle'); },
    wrong() { tone(180, 0, 0.22, 'sawtooth', 0.06); },
    unlock() { [392, 523, 659, 880].forEach((f, i) => tone(f, i * 0.09, 0.15, 'sine')); },
    achievement() { [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.1, 0.22, 'triangle', 0.09)); },
    complete() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.2, 'triangle', 0.09)); }
  };
  DL.sound = {
    enabled() { return DL.state.get().settings.sound; },
    play(name) { if (!DL.state.get().settings.sound) return; try { SFX[name] && SFX[name](); } catch (e) { /* ignore audio errors */ } },
    set(on) { DL.state.get().settings.sound = !!on; DL.state.save(); if (on) { ac(); SFX.click(); } }
  };
})(window.DL);
