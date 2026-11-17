// Injected into the page: a "bot" that recomputes each challenge's data from the stored seed and plays it through the real UI.
(function () {
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const setv = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const btn = (txt, root) => $$('button', root || document).find(b => b.textContent.trim().includes(txt));
  const btnExact = (txt, root) => $$('button', root || document).find(b => b.textContent.trim() === txt);
  const work = () => $('#challenge-root .work');
  const clickPoint = (cv, di, i) => { const p = cv.__chart.center(di, i), r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + p.x, clientY: r.top + p.y })); };
  const DLx = window.DL, st = DLx.stats;

  function classify(items) {
    items.forEach(it => { const chip = $$('.chip').find(c => c.dataset.label === it.label); chip.click(); $('.bucket[data-bucket="' + it.bucket + '"] > button').click(); });
    btn('Check classification').click();
  }
  const rowsEls = () => $$('.orow');
  const pear = (x, y) => st.pearson(x, y);
  async function arcade() { const el = $$('*').find(e => e.__arcade); const go = document.getElementById('arcade-go'); go.click(); const A = el.__arcade, t0 = Date.now(); while (!A.state.over && Date.now() - t0 < 150000) { const f = A.front(); if (f) A.press(f.bin); await sleep(12); } }
  const cap = s => s[0].toUpperCase() + s.slice(1);

  const S = {
    async m1c1() { await arcade(); },
    async m1c2() { await arcade(); },
    async m1c3() { await arcade(); },
    async m1c4(d) { $$('.orow select', work()).forEach((sel, i) => setv(sel, d.cols[i].type)); btn('Run import test').click(); },
    async m2c1(d) {
      const rows = $$('tr.selectable'); const seen = {};
      d.rows.forEach((r, i) => { if (r._g) { if (seen[r._g]) rows[i].click(); seen[r._g] = 1; } });
      btn('Flag duplicates').click();
    },
    async m2c2(d) {
      const ci = { ID: 0, Name: 1, Age: 2, Marks: 3, Attendance: 4 }, trs = $$('tbody tr', $$('table', work())[0]);
      [...d.blanks].forEach(k => { const [i, c] = k.split('|'); trs[+i].children[ci[c]].click(); });
      btn('Scan: confirm missing cells').click(); await sleep(60); btnExact('Fill with median').click(); await sleep(40); btn('Publish report').click();
    },
    async m2c3(d) { const inputs = $$('table input', work()).slice(0, d.names.length); inputs.forEach((inp, i) => setv(inp, String(d.truth[i]))); btn('Validate marks').click(); },
    async m2c4(d) {
      const U = d.uid; const trs = () => $$('tbody tr', work());
      d.work.forEach((r, i) => { if (r._u.endsWith('_c') || r._u === U.emp) trs()[i].querySelector('input[type=checkbox]').click(); });
      btnExact('Remove selected rows').click(); await sleep(30);
      const alive = d.work.filter(r => !(r._u.endsWith('_c') || r._u === U.emp)); const T = trs();
      alive.forEach((r, i) => { const inps = $$('td input', T[i]); // [ID, Name, Age, Marks, Attendance] (checkbox is in lead cell too)
        const cells = $$('td', T[i]).slice(1).map(td => td.querySelector('input'));
        if (r._u === U.missM || r._u === U.invM) setv(cells[3], d.clean[r._u].Marks);
        if (r._u === U.invA) setv(cells[2], d.clean[r._u].Age);
        if (r._u === U.missA) setv(cells[4], String(Math.round(d.attMed)));
      });
      btn('Submit cleaned dataset').click();
    },
    async m3c1(d) {
      for (let r = 0; r < 2; r++) { const vals = r ? d.vals.concat([d.rogue]) : d.vals; setv($('input[type=range]', work()), String(st.mean(vals))); await sleep(r ? 1300 : 2400); }
    },
    async m3c2(d) {
      for (let r = 0; r < 2; r++) { const n = d.rounds[r].length; btn('Sort the data').click(); await sleep(30); setv($('input[type=range]', work()), String(n)); await sleep(r ? 200 : 1200); }
    },
    async m3c3(d) {
      for (let r = 0; r < 2; r++) { await arcade(); await sleep(60); const modes = st.modes(d.rounds[r]); modes.forEach(m => { $$('.tower', work()).find(t => t.querySelector('span').textContent === String(m)).click(); }); btn('Lock mode').click(); await sleep(r ? 150 : 1100); }
    },
    async m3c4(d) { $$('button', work()).filter(b => b.textContent === 'Flag as outlier')[d.at].click(); await sleep(60); $$('input[type=radio]', work())[1].click(); btn('Submit decision').click(); },
    async m3c5(d) {
      for (let r = 0; r < 3; r++) { const T = d.targets[r], M = d.mine[r]; let best = 0, bd = 9; for (let k = -100; k <= 100; k++) { const rr = k / 100, y = M.x.map((x, i) => rr * x + Math.sqrt(1 - rr * rr) * M.e[i]), df = Math.abs(pear(M.x, y) - T.r); if (df < bd) { bd = df; best = rr; } }
        setv($('input[type=range]', work()), String(best)); await sleep(2300); }
      await sleep(300); btn('A hidden factor').click();
    },
    async m4c1(d) {
      const N = { line: 'Line chart', bar: 'Bar chart', pie: 'Pie chart', hist: 'Histogram', scatter: 'Scatter plot' };
      for (let r = 0; r < 3; r++) { btnExact(N[d.orders[r].best], work()).click(); await sleep(60); btn('Publish chart').click(); await sleep(r < 2 ? 1300 : 100); }
    },
    async m4c2(d) {
      let cv = $('canvas', work()); const hi = d.vals.indexOf(Math.max(...d.vals)), lo = d.vals.indexOf(Math.min(...d.vals));
      clickPoint(cv, 0, hi); await sleep(30); clickPoint(cv, 0, lo); await sleep(30);
      const best = d.rises.indexOf(Math.max(...d.rises)); setv($('select', work()), String(best)); btnExact('Check').click(); await sleep(80);
      const slope = st.slope(d.trend), truth = Math.abs(slope) < 0.8 ? 2 : slope > 0 ? 0 : 1; $$('input[type=radio]', work())[truth].click(); btnExact('Submit').click();
    },
    async m4c3(d) {
      setv($('input[type=range]', work()), '0'); await sleep(1400);
      const order = d.order.slice(); const M = DLx.data.months;
      for (let pos = 0; pos < 6; pos++) { const j = order.indexOf(pos); if (j !== pos) { $$('.tool-row button', work())[pos].click(); await sleep(20); $$('.tool-row button', work())[j].click(); await sleep(20); [order[pos], order[j]] = [order[j], order[pos]]; } }
      await sleep(1400); btn('Toggle axis scale').click();
    },
    async m4c4(d) { $$('input[type=radio]', work())[d.sets.findIndex(s => s.id === d.brief.ds)].click(); setv($('select', work()), d.brief.type); btn('Generate chart').click(); await sleep(50); btn('Submit to dashboard').click(); },
    async m4c5(d) {
      clickPoint($('canvas', work()), 0, d.top); await sleep(40); clickPoint($('canvas', work()), 0, d.peak); await sleep(40);
      setv($('.answer-row input', work()), String(Math.max(...d.pie))); btn('Reveal part 3').click(); await sleep(40);
      const c1 = d.dists[d.top].replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), c2 = String(d.peak + 1).padStart(2, '0');
      setv($('input[type=text]', work()), c1 + '-' + c2 + '-' + Math.max(...d.pie)); btn('Open vault').click();
    },
    async m5c1() {
      const chips = () => $$('.tool-row .chip', work()).slice(0, 3), acc = () => parseInt($('.kv b', work()).textContent); let best = -1, bm = 1, cur = 0;
      for (let m = 1; m < 8; m++) { for (let b = 0; b < 3; b++) { if (((m >> b) & 1) !== ((cur >> b) & 1)) chips()[b].click(); } cur = m; await sleep(20); const a = acc(); if (a > best) { best = a; bm = m; } }
      for (let b = 0; b < 3; b++) { if (((bm >> b) & 1) !== ((cur >> b) & 1)) chips()[b].click(); } await sleep(30); btn('Deploy model').click();
    },
    async m5c2() { await arcade(); },
    async m5c3(d) { const sel = $('select', work()); setv(sel, d.best.feature); setv($('input[type=range]', work()), String(d.best.thr)); btn('Lock in rule').click(); },
    async m5c4() {
      const sl = $('input[type=range]', work()); let best = -1, bk = 1;
      for (let k = 1; k <= 15; k++) { setv(sl, String(k)); await sleep(15); const a = parseInt($$('.kv b', work())[2].textContent); if (a > best) { best = a; bk = k; } }
      setv(sl, String(bk)); await sleep(20); btn('Lock in k').click();
    },
    async m5c5(d, sh) {
      const rule = sh.rule, test = sh.all.slice(20), right = test.filter(r => ((r[rule.feature] >= rule.thr) ? 'Pass' : 'Fail') === r.result).length;
      const ins = $$('.answer-row input', work()); setv(ins[0], String(right)); setv(ins[1], String(Math.round(100 * right / test.length))); btnExact('Check').click();
    },
    async f1() { await arcade(); },
    async f2() {
      const T = ['Collect the data', 'Clean it', 'Explore it', 'Visualize it', 'Split into training', 'Evaluate the model'];
      for (let t = 0; t < 6; t++) { for (let g = 0; g < 8; g++) { const lis = $$('.reorder li'); const pos = lis.findIndex(li => li.textContent.includes(T[t])); if (pos <= t) break; lis[pos].querySelector('button').click(); } }
      btn('Run pipeline').click();
    },
    async f3() { ['"typical" income', 'y-axis starting at 95', 'same data it was trained on', 'caused fewer accidents'].forEach(k => { $$('.hot', work()).find(b => b.textContent.includes(k)).click(); }); },
  };

  window.__solveCurrent = async function (mid, opts) {
    opts = opts || {};
    const run = DLx.state.get().progress[mid], m = DLx.getMission(mid), ch = m.challenges[run.idx];
    const rng = DLx.rand.make(run.seed + DLx.rand.hashStr(ch.id)); const d = ch.setup ? ch.setup(rng, run.shared) : {};
    const before = run.score;
    await S[ch.id](d, run.shared); await sleep(120);
    return { id: ch.id, solved: !!DLx.state.get().progress[mid].done[ch.id], scoreDelta: DLx.state.get().progress[mid].score - before };
  };
  window.__next = () => { const b = document.getElementById('btn-next'); if (b) { b.click(); return true; } return false; };
})();
