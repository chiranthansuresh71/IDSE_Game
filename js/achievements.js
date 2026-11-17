/* Achievement badges. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const LIST = [
    { id: 'FIRST_CLUE', name: 'FIRST CLUE', desc: 'Complete your first puzzle.', icon: 'search' },
    { id: 'CLEAN_DATA', name: 'CLEAN DATA', desc: 'Successfully complete Mission 2.', icon: 'filter' },
    { id: 'PATTERN_MASTER', name: 'PATTERN MASTER', desc: 'Identify all required statistical patterns (Mission 3).', icon: 'target' },
    { id: 'VIS_EXPERT', name: 'VISUALIZATION EXPERT', desc: 'Complete the visualization mission.', icon: 'chart' },
    { id: 'PREDICTION_PRO', name: 'PREDICTION PRO', desc: 'Complete the prediction mission.', icon: 'cpu' },
    { id: 'PERFECT', name: 'PERFECT INVESTIGATION', desc: 'Complete a mission with no wrong answers and no hints.', icon: 'star' },
    { id: 'MASTER_DETECTIVE', name: 'MASTER DETECTIVE', desc: 'Complete all five missions and the final mystery.', icon: 'trophy' }
  ];
  function unlock(id) {
    const S = DL.state.get(); if (S.achievements[id]) return;
    S.achievements[id] = Date.now(); DL.state.save();
    const a = LIST.find(x => x.id === id);
    DL.ui.toast('Achievement unlocked: ' + a.name, a.desc, 'ach', 5000); DL.ui.announce('Achievement unlocked: ' + a.name); DL.sound.play('achievement');
  }
  DL.achievements = {
    LIST,
    check(ev) {
      const S = DL.state.get(), done = DL.state.isCompleted;
      if (S.stats.correct >= 1) unlock('FIRST_CLUE');
      if (done('m2')) unlock('CLEAN_DATA');
      if (done('m3')) unlock('PATTERN_MASTER');
      if (done('m4')) unlock('VIS_EXPERT');
      if (done('m5')) unlock('PREDICTION_PRO');
      if (ev && ev.perfect) unlock('PERFECT');
      if (DL.state.completedCount() === 5 && S.final.done) unlock('MASTER_DETECTIVE');
    },
    earned: () => Object.keys(DL.state.get().achievements).length
  };
})(window.DL);
