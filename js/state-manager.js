/* Game state: single source of truth, persisted to LocalStorage after every change. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const MISSION_IDS = ['m1', 'm2', 'm3', 'm4', 'm5'];

  function defaults() {
    return {
      v: 1, player: { name: '' }, settings: { sound: false, reducedMotion: false },
      unlocked: ['m1'], missions: {}, progress: {}, achievements: {}, insights: {},
      final: { unlocked: false, done: false, best: 0 },
      stats: { correct: 0, wrong: 0, hints: 0, playMs: 0 }, introSeen: false
    };
  }
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

  function cleanName(s) { return String(s == null ? '' : s).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 20); }

  // Rebuild a valid state from untrusted saved data.
  function sanitize(raw) {
    const S = defaults();
    if (!isObj(raw)) return S;
    if (isObj(raw.player)) S.player.name = cleanName(raw.player.name);
    if (isObj(raw.settings)) { S.settings.sound = raw.settings.sound === true; S.settings.reducedMotion = raw.settings.reducedMotion === true; }
    if (isObj(raw.missions)) MISSION_IDS.forEach(id => {
      const m = raw.missions[id]; if (!isObj(m)) return;
      S.missions[id] = { completed: m.completed === true, best: Math.max(0, num(m.best, 0)), attempts: Math.max(0, num(m.attempts, 0)), perfect: m.perfect === true };
    });
    if (isObj(raw.progress)) MISSION_IDS.concat('final').forEach(id => {
      const p = raw.progress[id]; if (!isObj(p) || !isObj(p.done)) return;
      S.progress[id] = {
        seed: num(p.seed, 1) >>> 0, idx: Math.max(0, Math.floor(num(p.idx, 0))), done: p.done,
        score: Math.max(0, num(p.score, 0)), wrong: Math.max(0, num(p.wrong, 0)), hints: Math.max(0, num(p.hints, 0)),
        hinted: isObj(p.hinted) ? p.hinted : {}, hintLevel: isObj(p.hintLevel) ? p.hintLevel : {}, shared: isObj(p.shared) ? p.shared : {},
        correctCount: Math.max(0, num(p.correctCount, 0)), ms: Math.max(0, num(p.ms, 0))
      };
    });
    if (isObj(raw.achievements)) Object.keys(raw.achievements).forEach(k => { if (typeof k === 'string' && k.length < 40) S.achievements[k] = num(raw.achievements[k], Date.now()); });
    if (isObj(raw.insights)) Object.keys(raw.insights).forEach(k => { if (k.length < 40 && raw.insights[k] === true) S.insights[k] = true; });
    if (isObj(raw.final)) S.final = { unlocked: raw.final.unlocked === true, done: raw.final.done === true, best: Math.max(0, num(raw.final.best, 0)) };
    if (isObj(raw.stats)) Object.keys(S.stats).forEach(k => { S.stats[k] = Math.max(0, num(raw.stats[k], 0)); });
    S.introSeen = raw.introSeen === true;
    // derive unlocked list from completion so it can never be inconsistent
    S.unlocked = ['m1'];
    MISSION_IDS.forEach((id, i) => { if (S.missions[id] && S.missions[id].completed && MISSION_IDS[i + 1]) S.unlocked.push(MISSION_IDS[i + 1]); });
    S.final.unlocked = MISSION_IDS.every(id => S.missions[id] && S.missions[id].completed);
    return S;
  }

  let S = sanitize(DL.storage.load());
  const subs = [];

  const api = {
    MISSION_IDS,
    cleanName,
    get() { return S; },
    save() { DL.storage.save(S); subs.forEach(fn => fn(S)); },
    subscribe(fn) { subs.push(fn); },
    hasPlayer() { return !!S.player.name; },
    setName(n) { S.player.name = cleanName(n); api.save(); },
    reset() { S = defaults(); DL.storage.clear(); subs.forEach(fn => fn(S)); },
    isUnlocked(id) { return id === 'final' ? S.final.unlocked : S.unlocked.indexOf(id) >= 0; },
    isCompleted(id) { return id === 'final' ? S.final.done : !!(S.missions[id] && S.missions[id].completed); },
    completedCount() { return MISSION_IDS.filter(api.isCompleted).length; },
    totalXP() { return MISSION_IDS.reduce((s, id) => s + (S.missions[id] ? S.missions[id].best : 0), 0) + S.final.best; },
    status(id) {
      if (!api.isUnlocked(id)) return 'LOCKED';
      if (api.isCompleted(id)) return 'COMPLETED';
      const p = S.progress[id];
      return p && (p.idx > 0 || Object.keys(p.done).length) ? 'PROGRESS' : 'AVAILABLE';
    },
    bestScore(id) { return id === 'final' ? S.final.best : (S.missions[id] ? S.missions[id].best : 0); },
    unlock() { // recompute after completion
      S.unlocked = ['m1'];
      MISSION_IDS.forEach((id, i) => { if (api.isCompleted(id) && MISSION_IDS[i + 1]) S.unlocked.push(MISSION_IDS[i + 1]); });
      S.final.unlocked = MISSION_IDS.every(api.isCompleted);
    },
    sanitize
  };
  DL.state = api;
})(window.DL);
