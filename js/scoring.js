/* Scoring rules and ranks. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const POINTS = { standard: 100, practical: 150, noHint: 25, completion: 100, wrong: -10, hint: -20 };
  // Rank thresholds are a share of the maximum possible XP, so they stay correct if missions are added/changed.
  const RANKS = [
    { name: 'Data Trainee', share: 0 }, { name: 'Data Explorer', share: 0.12 }, { name: 'Data Analyst', share: 0.30 },
    { name: 'Data Specialist', share: 0.55 }, { name: 'Master Data Detective', share: 0.80 }
  ];
  const scoring = {
    POINTS,
    base: kind => (kind === 'practical' ? POINTS.practical : POINTS.standard),
    maxForMission(m) { return m.challenges.reduce((s, c) => s + scoring.base(c.kind) + POINTS.noHint, 0) + POINTS.completion; },
    allMissions() { return (DL.missions || []).concat(DL.finalMission ? [DL.finalMission] : []); },
    maxTotal() { return scoring.allMissions().reduce((s, m) => s + scoring.maxForMission(m), 0); },
    ranks() { const mx = scoring.maxTotal(); return RANKS.map(r => ({ name: r.name, min: Math.round(r.share * mx / 10) * 10 })); },
    rankFor(xp) {
      const rs = scoring.ranks(); let i = 0; rs.forEach((r, k) => { if (xp >= r.min) i = k; });
      return { name: rs[i].name, index: i, min: rs[i].min, next: rs[i + 1] || null };
    }
  };
  DL.scoring = scoring;
})(window.DL);
