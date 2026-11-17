/* DATA LOCKDOWN — random generators, statistics helpers and dataset factories.
   Everything the game validates is COMPUTED from generated data (nothing is a hard-coded answer). */
window.DL = window.DL || {};
(function (DL) {
  'use strict';

  /* ---------- seeded random number generator (mulberry32) ---------- */
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function make(seed) {
    let a = (seed >>> 0) || 1;
    const next = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = { next };
    r.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    r.float = (lo, hi, dp) => { const v = lo + next() * (hi - lo); return dp == null ? v : +v.toFixed(dp); };
    r.pick = arr => arr[Math.floor(next() * arr.length)];
    r.shuffle = arr => { const a2 = arr.slice(); for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
    r.sample = (arr, n) => r.shuffle(arr).slice(0, n);
    r.normal = (mean, sd) => { let u = 0, v = 0; while (u === 0) u = next(); while (v === 0) v = next(); return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    r.chance = p => next() < p;
    return r;
  }
  DL.rand = { make, hashStr, newSeed: () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0 };

  /* ---------- statistics ---------- */
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => sum(a) / a.length;
  const sortedNum = a => a.slice().sort((x, y) => x - y);
  function median(a) { const s = sortedNum(a), n = s.length, m = Math.floor(n / 2); return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function modes(a) {
    const c = {}; a.forEach(x => c[x] = (c[x] || 0) + 1);
    const mx = Math.max.apply(null, Object.values(c));
    if (mx === 1) return [];
    return Object.keys(c).filter(k => c[k] === mx).map(Number).sort((x, y) => x - y);
  }
  function freq(a) { const c = {}; a.forEach(x => c[x] = (c[x] || 0) + 1); return c; }
  function quantile(a, q) { const s = sortedNum(a), pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos); return s[lo] + (s[hi] - s[lo]) * (pos - lo); }
  function iqrFences(a) { const q1 = quantile(a, .25), q3 = quantile(a, .75), iqr = q3 - q1; return { q1, q3, iqr, lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr }; }
  function pearson(x, y) {
    const mx = mean(x), my = mean(y); let nu = 0, dx = 0, dy = 0;
    for (let i = 0; i < x.length; i++) { nu += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
    return dx && dy ? nu / Math.sqrt(dx * dy) : 0;
  }
  function slope(y) { const x = y.map((_, i) => i); const mx = mean(x), my = mean(y); let nu = 0, de = 0; x.forEach((xi, i) => { nu += (xi - mx) * (y[i] - my); de += (xi - mx) ** 2; }); return nu / de; }
  const round = (v, dp) => { const f = Math.pow(10, dp == null ? 0 : dp); return Math.round(v * f) / f; };
  DL.stats = { sum, mean, median, modes, freq, quantile, iqrFences, pearson, slope, round, sortedNum };

  /* ---------- text pools ---------- */
  const NAMES = ['Arun', 'Priya', 'Kavin', 'Meena', 'Ravi', 'Divya', 'Karthik', 'Sneha', 'Vikram', 'Anita', 'Rahul', 'Lakshmi', 'Suresh', 'Nisha', 'Imran', 'Farah', 'Deepak', 'Pooja', 'Naveen', 'Harini', 'Ganesh', 'Swathi', 'Tarun', 'Keerthi'];
  const CITIES = ['Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Trichy', 'Vellore', 'Erode', 'Tirunelveli'];
  const DISTRICTS = ['North Quay', 'Old Harbour', 'Tech Park', 'Green Belt', 'Riverside', 'Central Hub'];
  DL.pools = { NAMES, CITIES, DISTRICTS };

  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  DL.numberToWords = function (n) {
    if (n < 10) return ONES[n]; if (n < 20) return TEENS[n - 10];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    return String(n);
  };

  /* ---------- dataset factories ---------- */
  DL.data = {};

  // Student table used by Mission 2
  DL.data.students = function (rng, n, startId) {
    const names = rng.sample(NAMES, n);
    return names.map((name, i) => ({
      ID: String((startId || 101) + i), Name: name, Age: String(rng.int(18, 22)),
      Marks: String(rng.int(48, 98)), Attendance: String(rng.int(62, 99))
    }));
  };

  // Student performance data used by Mission 5 (target is generated from a noisy hidden rule)
  DL.data.performance = function (rng, n) {
    const rows = [];
    for (let i = 0; i < n; i++) {
      const study = rng.float(1, 10, 1);
      const att = rng.int(55, 100);
      const prev = Math.max(25, Math.min(98, Math.round(rng.normal(40 + study * 4.5, 9))));
      const score = 0.60 * (study - 5.5) / 2.6 + 0.22 * (att - 78) / 13 + 0.25 * (prev - 62) / 14 + rng.normal(0, 0.35);
      rows.push({ id: 'S' + String(i + 1).padStart(3, '0'), study, att, prev, result: score > 0 ? 'Pass' : 'Fail' });
    }
    return rows;
  };

  // Best single-feature threshold rule ("decision stump"): predict Pass when value >= threshold
  DL.data.stumpAccuracy = function (rows, feature, thr) {
    let ok = 0; rows.forEach(r => { if ((r[feature] >= thr ? 'Pass' : 'Fail') === r.result) ok++; });
    return rows.length ? ok / rows.length : 0;
  };
  DL.data.bestStump = function (rows, features) {
    let best = { acc: -1, feature: null, thr: 0 };
    (features || ['study', 'att', 'prev']).forEach(f => {
      const vals = Array.from(new Set(rows.map(r => r[f]))).sort((a, b) => a - b);
      vals.forEach(v => { const acc = DL.data.stumpAccuracy(rows, f, v); if (acc > best.acc) best = { acc, feature: f, thr: v }; });
    });
    return best;
  };
  // 1-nearest-neighbour "memoriser" with min-max scaling
  DL.data.nearest = function (train, row) {
    const f = ['study', 'att', 'prev'];
    const rng = {}; f.forEach(k => { const v = train.map(r => r[k]); rng[k] = [Math.min.apply(null, v), Math.max.apply(null, v) || 1]; });
    let best = null, bd = Infinity;
    train.forEach(t => {
      let d = 0; f.forEach(k => { const sp = (rng[k][1] - rng[k][0]) || 1; d += (((t[k] - row[k]) / sp) ** 2); });
      if (d < bd) { bd = d; best = t; }
    });
    return best.result;
  };

  // Example data for Mission 4 (visual datasets)
  DL.data.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

})(window.DL);
