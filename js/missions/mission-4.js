/* MISSION 4 — THE VISUALIZATION VAULT: choosing, reading, auditing and building charts (Chart.js). */
window.DL = window.DL || {}; DL.missions = DL.missions || [];
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui, st = DL.stats, C = DL.comp, M = DL.data.months;
  const CHART_OPTS = [{ id: 'line', label: 'Line chart' }, { id: 'bar', label: 'Bar chart' }, { id: 'pie', label: 'Pie chart' }, { id: 'hist', label: 'Histogram' }, { id: 'scatter', label: 'Scatter plot' }];
  const CHART_NAME = { line: 'Line chart', bar: 'Bar chart', pie: 'Pie chart', hist: 'Histogram', scatter: 'Scatter plot' };
  const distinct = (rng, n, lo, hi) => { const s = new Set(); while (s.size < n) s.add(rng.int(lo, hi)); return rng.shuffle([...s]); };
  function histo(values, w) {
    const lo = Math.floor(Math.min.apply(null, values) / w) * w, hi = Math.floor(Math.max.apply(null, values) / w) * w, labels = [], counts = [];
    for (let b = lo; b <= hi; b += w) { labels.push(b + '–' + (b + w - 1)); counts.push(values.filter(v => v >= b && v < b + w).length); }
    return { labels, counts };
  }

  DL.missions.push({
    id: 'm4', number: 4, icon: 'chart', title: 'The Visualization Vault', difficulty: 'Intermediate', concept: 'Data visualization',
    description: 'An attacker hid an access code inside the analytics dashboard. Choose, read and audit charts to crack the vault.',
    closing: 'You cracked the vault by <b>matching charts to data</b>, reading them accurately, spotting misleading designs and building your own.',
    report(sh) {
      const r = sh.m4 || {};
      return h('div', { class: 'callout' }, h('div', { class: 'panel-title', text: 'Chart selection & interpretation summary' }),
        h('ul', null, (r.matches || []).map(m => h('li', null, h('b', { text: m[0] + ' → ' }), m[1])), h('li', null, h('b', { text: 'Vault code: ' }), h('span', { class: 'mono', text: r.code || '–' }))),
        h('p', { class: 'muted', text: 'Rules: line = change over time · bar = compare categories · histogram = distribution of one numeric variable · scatter = relationship between two numeric variables · pie = parts of a whole (few slices).' }));
    },
    challenges: [
      /* ---------- C1 chart forge ---------- */
      {
        id: 'm4c1', kind: 'standard', mechanic: 'Sandbox: chart forge', title: 'Level 1 — Chart forge',
        story: 'The city council sends three data requests. Build the chart that makes the answer obvious.',
        intro: 'Different questions need different charts. Try chart types on the real data and watch the <b>council\'s reaction</b> — when a chart confuses them, you will hear it. Publish only when the chart makes the point.',
        objective: 'Publish a clear chart for <b>3 council requests</b>. Experiment freely — only publishing a confusing chart costs XP.',
        hints: ['Ask what the question is: change over time? compare categories? shape of one variable? relationship of two variables? parts of a whole?', 'A histogram groups ONE numeric variable into bins; a scatter plot needs TWO numeric variables.'],
        setup(rng) {
          const kinds = rng.sample(['time', 'cat', 'dist', 'rel', 'parts'], 3);
          const mk = k => {
            if (k === 'time') return { k, ask: 'Show how monthly sales changed over the year.', best: 'line', labels: M, values: Array.from({ length: 12 }, (_, i) => Math.round(120 + i * 9 + rng.normal(0, 8))), name: 'Monthly sales' };
            if (k === 'cat') return { k, ask: 'Compare sales across product categories.', best: 'bar', labels: ['Laptops', 'Phones', 'Tablets', 'Cameras', 'Audio'], values: distinct(rng, 5, 20, 90), name: 'Sales by category' };
            if (k === 'dist') return { k, ask: 'Show how the exam marks of 150 students are distributed.', best: 'hist', raw: Array.from({ length: 150 }, () => Math.max(20, Math.min(100, Math.round(rng.normal(62, 14))))), name: 'Exam marks' };
            if (k === 'rel') return { k, ask: 'Is there a relationship between height and weight?', best: 'scatter', pts: Array.from({ length: 25 }, () => { const hh = rng.int(150, 190); return { x: hh, y: Math.round(-45 + 0.65 * hh + rng.normal(0, 4)) }; }), name: 'Height vs weight' };
            const raw = [rng.int(38, 50), rng.int(20, 28), rng.int(12, 18)]; raw.push(100 - raw[0] - raw[1] - raw[2]); return { k: 'parts', ask: 'Show each company\'s share of the market (shares add to 100%).', best: 'pie', labels: ['Alpha', 'Beta', 'Gamma', 'Delta'], values: raw, name: 'Market share' };
          };
          return { orders: kinds.map(mk) };
        },
        render(root, d, api) {
          const REACT = { time: { bar: 'I see separate boxes per month, but I cannot feel the flow of change.', pie: 'A pie of months? What am I supposed to read from it?', hist: 'Why are months being grouped into bins?', scatter: 'Which axis is time? Hard to follow.' },
            cat: { line: 'A line suggests the categories are connected in time. They are not.', pie: 'Hmm, readable, but comparing five slices by angle is hard — and they are not parts of one whole.', hist: 'Bins of categories? That makes no sense.', scatter: 'Points with no meaningful x-axis...' },
            dist: { line: 'A line through individual marks does not show how they are distributed.', bar: 'One bar per student? I cannot see the overall shape.', pie: 'A pie of marks? Useless.', scatter: 'A cloud with no relationship to look for. Where is the distribution?' },
            rel: { line: 'Connecting people with a line is meaningless.', bar: 'Bars of weight, but where is the height link?', pie: 'Slices of weight tell me nothing about height.', hist: 'This shows only one variable, not how they relate.' },
            parts: { line: 'A line suggests change over time. These are shares of one whole.', bar: 'Readable, but it does not show the "whole market" idea well.', hist: 'Bins? These are four companies.', scatter: 'Points are not helpful for four shares.' } };
          const GOOD = { line: 'Now I can see the trend through the year.', bar: 'Easy to compare categories side by side.', hist: 'I can see the shape of the marks — where most students fall.', scatter: 'I can see that taller people tend to weigh more.', pie: 'Clear: each slice is a share of the whole market.' };
          const box = h('div'); root.appendChild(box); let ri = 0; const picks = [];
          function spec(o, t) {
            const L = (labels, data, extra) => Object.assign({ title: o.name, labels, datasets: [{ label: 'Value', data, color: '#50E3E6' }], legend: false }, extra || {});
            const vals = o.values || (o.raw ? o.raw.slice(0, 15) : o.pts.slice(0, 10).map(p => p.y)), labs = o.labels || vals.map((_, i) => '#' + (i + 1));
            if (t === 'scatter') return L(null, o.pts || (o.raw ? o.raw.slice(0, 40) : o.values).map((y, i) => ({ x: i + 1, y })), { type: 'scatter', xTitle: o.pts ? 'Height (cm)' : 'Index', yTitle: o.pts ? 'Weight (kg)' : 'Value' });
            if (t === 'hist') { const hb = histo(o.raw || o.values || o.pts.map(p => p.y), o.raw ? 10 : o.values ? 40 : 10); return L(hb.labels, hb.counts, { type: 'bar', barGap: false, xTitle: 'Bin', yTitle: 'Frequency' }); }
            if (t === 'pie') return L(labs.slice(0, 8), vals.slice(0, 8), { type: 'pie' });
            return L(labs, vals, { type: t, yMin: 0 });
          }
          function order() {
            const o = d.orders[ri]; let chosen = null, chart = null; DL.ui.clear(box);
            const cb = DL.charts.box('Chart for: ' + o.ask); const bubble = h('div', { class: 'bubble', role: 'status', text: 'Council: "Waiting for your chart…"' }), holder = h('div'); holder.hidden = true; holder.appendChild(cb.wrap);
            const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Chart type' }, CHART_OPTS.map(c => h('button', { type: 'button', 'aria-pressed': 'false', onclick: e => {
              chosen = c.id; seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); holder.hidden = false; if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, spec(o, c.id));
              const good = c.id === o.best; bubble.className = 'bubble' + (good ? ' good' : ''); bubble.textContent = 'Council: "' + (good ? GOOD[c.id] : REACT[o.k][c.id]) + '"'; DL.ui.announce(bubble.textContent); DL.sound.play('click'); } }, c.label)));
            box.append(h('div', { class: 'tag cyan', text: 'Request ' + (ri + 1) + ' of 3' }), h('div', { class: 'callout', style: { margin: '8px 0' } }, h('b', { text: 'REQUEST: ' }), o.ask, h('div', { class: 'muted', text: 'Data: ' + o.name })), seg, bubble, holder,
              h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
                if (!chosen) return api.note('warn', 'Pick a chart type first.');
                if (chosen !== o.best) return api.wrong('The council sent it back: "' + REACT[o.k][chosen] + '"');
                picks.push([o.name, CHART_NAME[chosen]]); if (ri < 2) { api.stepOk('Published! ' + GOOD[chosen]); ri++; setTimeout(order, 900); } else { api.shared.m4 = Object.assign(api.shared.m4 || {}, { matches: picks }); api.correct('All three charts approved by the council.'); }
              } }, icon('chart'), 'Publish chart')));
          }
          order();
        },
        explain: '<b>Line</b> = trend over time. <b>Bar</b> = compare categories. <b>Histogram</b> = distribution of one numeric variable. <b>Scatter</b> = relationship between two numeric variables. <b>Pie</b> = parts of a whole (only with a few slices). The wrong chart still draws — it just hides the answer.',
        insight: { concept: 'Choosing a chart', short: 'match the chart to the question the data should answer.', text: 'The right chart makes the pattern obvious: line for time trends, bar for categories, histogram for distributions, scatter for relationships, pie for parts of a whole.', real: 'A newsroom uses a line chart for the pandemic trend but a bar chart to compare cases across states.' }
      },
      /* ---------- C2 interpret ---------- */
      {
        id: 'm4c2', kind: 'practical', mechanic: 'Click on the chart', title: 'Interpret the graphs',
        story: 'Alerts flooded the city dashboard this year.',
        intro: 'Reading a chart means extracting the highest and lowest values, the changes between points and the overall trend.',
        objective: 'Answer four questions about the charts. For the first two, click the correct bar.',
        hints: ['The tallest bar is the highest value; the shortest is the lowest.', 'For the biggest rise, compare each month with the one before it.'],
        setup(rng) {
          const months = M.slice(0, 8), vals = distinct(rng, 8, 20, 95), up = rng.chance(.5), start = rng.int(20, 50), slope = rng.int(3, 5) * (up ? 1 : -1);
          const trend = Array.from({ length: 10 }, (_, i) => Math.round(start + 40 + slope * i + rng.normal(0, 2)));
          const rises = vals.slice(1).map((v, i) => v - vals[i]);
          return { months, vals, trend, up, rises };
        },
        render(root, d, api) {
          const box = h('div'), q = h('div'); root.appendChild(box); root.appendChild(q);
          const cb = DL.charts.box('Bar chart of security alerts per month'); box.appendChild(cb.wrap);
          let handler = () => {}; const hi = d.vals.indexOf(Math.max.apply(null, d.vals)), lo = d.vals.indexOf(Math.min.apply(null, d.vals));
          DL.charts.render(cb.canvas, { type: 'bar', labels: d.months, datasets: [{ label: 'Alerts', data: d.vals, color: '#6B8CFF' }], xTitle: 'Month', yTitle: 'Alerts', legend: false, yMin: 0, onClick: (di, i) => handler(i) });
          const prompt = t => { DL.ui.clear(q); q.appendChild(h('div', { class: 'panel-title', style: { marginTop: '12px' }, text: t })); };
          function q1() { prompt('Question 1 of 4 — click the bar with the HIGHEST value'); handler = i => { if (i === hi) { api.stepOk('Highest: ' + d.months[hi] + ' (' + d.vals[hi] + ').'); q2(); } else api.wrong('That bar is not the tallest.'); }; }
          function q2() { prompt('Question 2 of 4 — click the bar with the LOWEST value'); handler = i => { if (i === lo) { api.stepOk('Lowest: ' + d.months[lo] + ' (' + d.vals[lo] + ').'); q3(); } else api.wrong('That bar is not the shortest.'); }; }
          function q3() {
            handler = () => {}; prompt('Question 3 of 4 — between which two consecutive months did alerts RISE the most?');
            const pairs = d.months.slice(1).map((m, i) => ({ id: String(i), label: d.months[i] + ' → ' + m })), best = d.rises.indexOf(Math.max.apply(null, d.rises));
            const sel = h('select', { 'aria-label': 'Largest rise' }, h('option', { value: '', text: 'Choose…' }), pairs.map(p => h('option', { value: p.id, text: p.label })));
            q.appendChild(h('div', { class: 'answer-row' }, h('div', { class: 'field' }, sel), h('button', { class: 'btn primary', type: 'button', onclick: () => { if (sel.value === '') return api.note('warn', 'Choose a pair of months.'); if (+sel.value === best) { sel.disabled = true; api.stepOk('The biggest rise was ' + pairs[best].label + ' (+' + d.rises[best] + ').'); q4(); } else api.wrong('Compare each month with the previous one. Remember: a <b>rise</b> means the later bar is taller than the earlier bar.'); } }, icon('check'), 'Check')));
          }
          function q4() {
            DL.ui.clear(box); box.appendChild(h('div', { class: 'tag cyan', text: 'Line chart · 10 weeks' })); const cb2 = DL.charts.box('Line chart of weekly alerts'); box.appendChild(cb2.wrap);
            DL.charts.render(cb2.canvas, { type: 'line', labels: d.trend.map((_, i) => 'W' + (i + 1)), datasets: [{ label: 'Weekly alerts', data: d.trend, color: '#50E3E6' }], xTitle: 'Week', yTitle: 'Alerts', legend: false });
            prompt('Question 4 of 4 — what is the overall TREND of weekly alerts?');
            const qq = C.choice({ label: 'Overall trend', options: [{ id: 'up', label: 'Increasing' }, { id: 'down', label: 'Decreasing' }, { id: 'flat', label: 'No clear trend' }], checkLabel: 'Submit',
              onSubmit(a) { const slope = st.slope(d.trend), truth = Math.abs(slope) < 0.8 ? 'flat' : slope > 0 ? 'up' : 'down'; if (a === truth) { qq.lock(); api.correct('Trend: ' + (truth === 'up' ? 'increasing' : 'decreasing') + ' (slope ≈ ' + st.round(slope, 1) + ' alerts per week).'); } else api.wrong('Compare the left end of the line with the right end, and look at the overall direction.'); } });
            q.appendChild(qq.el);
          }
          q1();
        },
        explain: 'You extracted maxima and minima from a bar chart, computed differences between neighbouring points, and read the overall direction of a line chart (here confirmed by the slope of a fitted line).',
        insight: { concept: 'Interpreting graphs', short: 'read extremes, changes and trends from charts.', text: 'Always check axis labels and units, then look for highest/lowest values, differences between categories, and the direction of change over time.', real: 'Hospital managers read admission trend lines to plan staffing for the next month.' }
      },
      /* ---------- C3 lie factor ---------- */
      {
        id: 'm4c3', kind: 'standard', mechanic: 'Chart repair + Lie Factor meter', title: 'Level 3 — Fix the lying charts',
        story: 'The attacker altered three dashboard charts to mislead the council.',
        intro: 'A chart can be technically accurate yet mislead. The <b>Lie Factor</b> compares how big a difference <i>looks</i> with how big it really is: 1.0 is honest. Repair each chart until it is honest.',
        objective: 'Repair <b>3 charts</b>: (1) restore the axis, (2) put the months back in order, (3) switch to an honest scale.',
        hints: ['A bar chart should start at zero because bar length encodes the value.', 'Time must run left to right in order. Click two month buttons to swap them.', 'A logarithmic axis makes 100× differences look small.'],
        setup(rng) {
          const k = rng.int(90, 96), sat = [k, k + 2, k + 4], visits = Array.from({ length: 6 }, (_, i) => 100 + i * 40 + rng.int(-5, 5)), logv = rng.shuffle([rng.int(8, 15), rng.int(60, 90), rng.int(500, 900), rng.int(5000, 9000)]);
          return { sat, visits, order: (() => { let o; do { o = rng.shuffle([0, 1, 2, 3, 4, 5]); } while (o.every((v, i) => v === i)); return o; })(), logv };
        },
        render(root, d, api) {
          const box = h('div'); root.appendChild(box); let ri = 0;
          const lf = (vis, act) => { const r = Math.max.apply(null, vis) / Math.min.apply(null, vis), a = Math.max.apply(null, act) / Math.min.apply(null, act); return r / a; };
          const lfEl = () => h('div', { class: 'kv' });
          function r1() {
            const vals = d.sat, vmin = Math.min.apply(null, vals); let ymin = vmin - 1, chart = null; const cb = DL.charts.box('Bar chart with adjustable y-axis'), info = h('div', { class: 'mono', role: 'status' });
            const slider = h('input', { type: 'range', min: 0, max: vmin - 1, step: 1, value: ymin, 'aria-label': 'Y-axis starts at' });
            function draw() { const L = lf(vals.map(v => v - ymin), vals); if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, { type: 'bar', noAnim: true, labels: ['North', 'Central', 'South'], datasets: [{ label: '%', data: vals, color: L > 1.1 ? '#FF7185' : '#5CE1A3' }], yMin: ymin, yMax: 100, title: 'Customer satisfaction (%)', legend: false }); info.textContent = 'Axis starts at ' + ymin + ' · Lie Factor = ' + L.toFixed(1) + (L <= 1.1 ? ' — HONEST' : ' — exaggerating the differences'); return L; }
            slider.addEventListener('input', () => { ymin = +slider.value; draw(); });
            slider.addEventListener('change', () => { if (draw() <= 1.1) { slider.disabled = true; api.stepOk('Honest! With the axis at ' + ymin + ' the bars show the real, small differences.'); ri = 1; setTimeout(play, 1000); } });
            DL.ui.clear(box).append(h('div', { class: 'tag cyan', text: 'Chart 1 of 3 · truncated axis' }), cb.wrap, h('div', { class: 'field' }, h('label', { text: 'Y-axis starts at' }), slider), info); draw();
          }
          function r2() {
            let order = d.order.slice(), chart = null; const cb = DL.charts.box('Line chart of monthly visits'), info = h('div', { class: 'mono', role: 'status' }), btns = h('div', { class: 'tool-row' }); let first = null;
            const inv = () => { let c = 0; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (order[i] > order[j]) c++; return c; };
            function draw() { if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, { type: 'line', noAnim: true, labels: order.map(i => M[i]), datasets: [{ label: 'Visits', data: order.map(i => d.visits[i]), color: inv() ? '#FF7185' : '#5CE1A3' }], title: 'Website visits per month', legend: false, yMin: 0 });
              info.textContent = 'Months out of order: ' + inv() + (inv() ? ' — the trend is hidden' : ' — the steady growth is visible!'); DL.ui.clear(btns); order.forEach((m, pos) => btns.appendChild(h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(first === pos), onclick: () => { if (first === null) first = pos; else { [order[first], order[pos]] = [order[pos], order[first]]; first = null; draw(); if (!inv()) { api.stepOk('Chronological order restored — the growth is obvious.'); ri = 2; setTimeout(play, 1000); } } draw0(); } }, M[m]))); }
            const draw0 = () => { btns.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(first === i))); };
            DL.ui.clear(box).append(h('div', { class: 'tag cyan', text: 'Chart 2 of 3 · month labels scrambled' }), cb.wrap, h('p', { class: 'muted', text: 'Click two months to swap them.' }), btns, info); draw();
          }
          function r3() {
            let log = true, chart = null; const cb = DL.charts.box('Bar chart of alerts by district'), info = h('div', { class: 'mono', role: 'status' }), vals = d.logv;
            const tog = h('button', { class: 'btn', type: 'button', onclick: () => { log = !log; draw(); if (!log) { api.correct('Linear scale: the real differences are now visible (Lie Factor 1.0).'); tog.disabled = true; } } }, icon('chart'), 'Toggle axis scale');
            function draw() { const vis = log ? vals.map(v => Math.log10(v)) : vals, L = lf(vis, vals); if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, { type: 'bar', noAnim: true, labels: ['A', 'B', 'C', 'D'], datasets: [{ label: 'Alerts', data: vals, color: log ? '#FF7185' : '#5CE1A3' }], yLog: log, yMin: log ? 1 : 0, title: 'Alerts by district (' + (log ? 'logarithmic' : 'linear') + ' axis)', legend: false, yTitle: 'Alerts' }); info.textContent = 'Axis: ' + (log ? 'LOGARITHMIC' : 'linear') + ' · Lie Factor = ' + L.toFixed(2) + (L < 0.9 ? ' — understating the differences' : ' — HONEST'); }
            DL.ui.clear(box).append(h('div', { class: 'tag cyan', text: 'Chart 3 of 3 · unannounced log scale' }), cb.wrap, info, h('div', { class: 'answer-row' }, tog)); draw();
          }
          function play() { [r1, r2, r3][ri](); }
          play();
        },
        explain: '<b>Truncated axis</b>: bar <i>length</i> encodes value, so starting the axis near the data multiplies small differences (Lie Factor ≫ 1). <b>Scrambled labels</b>: time must run in order. <b>Unannounced log scale</b>: equal steps mean ×10, not +10 — differences look smaller than they are.',
        insight: { concept: 'Misleading visualizations', short: 'axes, labels and scales can distort the message.', text: 'Truncated axes, disordered labels and unusual scales can exaggerate or hide patterns. Honest charts start bars at zero, order time correctly and state the scale. The Lie Factor measures the distortion.', real: 'Regulators check company reports for charts whose axes exaggerate profit growth.' }
      },
      /* ---------- C4 build ---------- */
      {
        id: 'm4c4', kind: 'practical', mechanic: 'Build a chart', title: 'Build a visualization',
        story: 'The council has sent you a request. Generate the right chart for the dashboard.',
        intro: 'You will choose <b>which dataset</b> answers the request and <b>which chart</b> communicates it best. Try combinations — the chart is generated live with Chart.js.',
        objective: 'Select the correct dataset and chart type for the brief, then submit it to the dashboard.',
        hints: ['Re-read the brief: is it about change over time, comparing groups, the shape of the data, or a relationship?', 'Try a wrong combination and look at the result — a good chart should make the answer obvious.'],
        setup(rng) {
          const demand = Array.from({ length: 12 }, (_, i) => Math.round(300 + 80 * Math.sin((i - 2) / 12 * 2 * Math.PI) + rng.normal(0, 12)));
          const inc = distinct(rng, 6, 15, 120), marks = Array.from({ length: 150 }, () => Math.max(20, Math.min(100, Math.round(rng.normal(62, 14)))));
          const pts = Array.from({ length: 25 }, () => { const t = rng.int(15, 40); return { x: t, y: Math.round(180 + 8 * t + rng.normal(0, 18)) }; }).sort((a, b) => a.x - b.x);
          const sets = [
            { id: 'demand', name: 'Monthly electricity demand (MWh)', desc: '12 months, one value per month', kind: 'series', labels: M, values: demand },
            { id: 'incidents', name: 'Incidents per district', desc: '6 districts, one total each', kind: 'series', labels: DL.pools.DISTRICTS, values: inc },
            { id: 'marks', name: 'Exam marks (150 students)', desc: 'One mark per student', kind: 'dist', values: marks },
            { id: 'tempenergy', name: 'Daily temperature vs energy use', desc: '25 days, two numeric columns', kind: 'xy', pts }
          ];
          const briefs = [
            { text: 'Show how electricity demand changed through the year.', ds: 'demand', type: 'line' },
            { text: 'Compare the number of incidents across the six districts.', ds: 'incidents', type: 'bar' },
            { text: 'Show how exam marks are distributed across students.', ds: 'marks', type: 'hist' },
            { text: 'Does warmer weather go with higher energy use?', ds: 'tempenergy', type: 'scatter' }
          ];
          return { sets, brief: rng.pick(briefs) };
        },
        render(root, d, api) {
          let chosenDs = null, chosenType = '', chart = null, generated = false;
          root.appendChild(h('div', { class: 'callout' }, h('b', { text: 'BRIEF: ' }), d.brief.text));
          const dsBox = h('div', { class: 'checks', role: 'radiogroup', 'aria-label': 'Dataset', style: { marginTop: '10px' } }, d.sets.map(s => h('label', { class: 'check' }, h('input', { type: 'radio', name: 'dsel', onchange: () => { chosenDs = s.id; } }), h('span', null, h('b', { text: s.name }), h('br'), h('small', { class: 'muted', text: s.desc })))));
          const typeSel = h('select', { 'aria-label': 'Chart type', onchange: e => { chosenType = e.target.value; } }, h('option', { value: '', text: 'Choose a chart…' }), CHART_OPTS.map(o => h('option', { value: o.id, text: o.label })));
          const cb = DL.charts.box('Generated chart'); const holder = h('div'); holder.hidden = true; holder.appendChild(cb.wrap);
          function spec(ds, t) {
            const L = (title, labels, data, extra) => Object.assign({ title, labels, datasets: [{ label: 'Value', data, color: '#50E3E6' }], legend: false }, extra || {});
            const valsOf = () => (ds.kind === 'xy' ? ds.pts.map(p => p.y) : ds.values), labsOf = () => (ds.kind === 'series' ? ds.labels : ds.kind === 'dist' ? ds.values.slice(0, 20).map((_, i) => 'S' + (i + 1)) : ds.pts.slice(0, 12).map(p => p.x + '°'));
            const v = ds.kind === 'dist' ? ds.values.slice(0, 20) : ds.kind === 'xy' ? ds.pts.slice(0, 12).map(p => p.y) : ds.values;
            if (t === 'scatter') { const pts = ds.kind === 'xy' ? ds.pts : (ds.kind === 'dist' ? ds.values.slice(0, 40) : ds.values).map((y, i) => ({ x: i + 1, y })); return L(ds.name, null, pts, { type: 'scatter', xTitle: ds.kind === 'xy' ? 'Temperature (°C)' : 'Index', yTitle: ds.kind === 'xy' ? 'Energy use' : 'Value' }); }
            if (t === 'hist') { const hb = histo(valsOf(), ds.kind === 'dist' ? 10 : ds.kind === 'xy' ? 50 : 50); return L(ds.name, hb.labels, hb.counts, { type: 'bar', barGap: false, xTitle: 'Bin', yTitle: 'Frequency' }); }
            if (t === 'pie') return L(ds.name, labsOf().slice(0, 8), v.slice(0, 8), { type: 'pie' });
            return L(ds.name, labsOf(), v, { type: t, yMin: 0, yTitle: 'Value' });
          }
          const msg = h('div', { class: 'sr-live-note', role: 'status' });
          root.appendChild(h('div', { class: 'panel-title', style: { marginTop: '12px' }, text: '1 · Choose the dataset' })); root.appendChild(dsBox);
          root.appendChild(h('div', { class: 'panel-title', style: { marginTop: '12px' }, text: '2 · Choose the chart' }));
          root.appendChild(h('div', { class: 'answer-row' }, h('div', { class: 'field' }, typeSel),
            h('button', { class: 'btn', type: 'button', onclick: () => { if (!chosenDs || !chosenType) return api.note('warn', 'Pick a dataset and a chart type first.'); const ds = d.sets.find(s => s.id === chosenDs); holder.hidden = false; if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, spec(ds, chosenType)); generated = true; msg.textContent = 'Chart generated: ' + CHART_NAME[chosenType] + ' of ' + ds.name; } }, icon('chart'), 'Generate chart'),
            h('button', { class: 'btn primary', type: 'button', onclick: () => {
              if (!generated) return api.note('warn', 'Generate the chart first, then inspect it.');
              if (chosenDs !== d.brief.ds) return api.wrong('The chart is drawn, but this dataset does not answer the brief. Re-read what the council is asking.');
              if (chosenType !== d.brief.type) return api.wrong('Right dataset, but this chart type does not communicate the answer well. Think about the question being asked.');
              api.correct('The council can read the answer at a glance.');
            } }, icon('check'), 'Submit to dashboard')));
          root.appendChild(msg); root.appendChild(holder);
        },
        explain: 'Each dataset has a natural chart: a <b>time series → line</b>, <b>categories → bar</b>, <b>one numeric variable\'s distribution → histogram</b>, <b>two numeric variables → scatter</b>. Mismatched pairs still draw, but they hide or invent patterns.',
        insight: { concept: 'Building a visualization', short: 'dataset + question → the right chart.', text: 'Building a chart is a design decision: pick the variables that answer the question, then the chart type that shows them honestly, with titles and axis labels.', real: 'Analysts at a utility company plot demand against temperature to forecast winter loads.' }
      },
      /* ---------- C5 vault code ---------- */
      {
        id: 'm4c5', kind: 'practical', mechanic: 'Multi-step chart reading', title: 'Reveal the hidden code',
        story: 'The vault will open only with a three-part access code hidden in the dashboard charts.',
        intro: 'Each part of the code comes from correctly reading a chart. Read carefully — the code is derived from the data.',
        objective: 'Part 1: click the district with the most incidents. Part 2: click the peak month for that district. Part 3: read the largest slice of the pie. Then enter the full code.',
        hints: ['Each part of the code appears only after a correct reading. Part 1 uses the first three letters of the district name; Part 2 is the month number; Part 3 is a percentage.', 'For the pie chart: hover or tap the biggest slice to see its value.'],
        setup(rng) {
          const dists = rng.sample(DL.pools.DISTRICTS, 5), inc = distinct(rng, 5, 20, 90), top = inc.indexOf(Math.max.apply(null, inc));
          const monthly = distinct(rng, 12, 10, 90), peak = monthly.indexOf(Math.max.apply(null, monthly));
          let raw, guard = 0;
          do { const top2 = rng.int(38, 52), a = rng.int(20, 30), b = rng.int(10, Math.min(22, 100 - top2 - a - 5)), c = 100 - top2 - a - b; raw = [top2, a, b, c]; guard++; }
          while (guard < 50 && (new Set(raw).size < 4 || Math.min.apply(null, raw) < 5 || raw[0] <= Math.max(raw[1], raw[2], raw[3]) + 1));
          return { dists, inc, top, monthly, peak, pie: rng.shuffle(raw), sectors: rng.shuffle(['Hardware', 'Network', 'Software', 'Human error']) };
        },
        render(root, d, api) {
          const code = [null, null, null], topName = d.dists[d.top], c1 = topName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), c2 = String(d.peak + 1).padStart(2, '0'), c3 = String(Math.max.apply(null, d.pie));
          const vault = h('div', { class: 'vault', role: 'status', 'aria-label': 'Access code' });
          function drawVault() { DL.ui.clear(vault); code.forEach((c, i) => vault.appendChild(h('span', { class: 'seg-code' + (c ? ' open' : ''), text: c || '🔒 ' + (i + 1) }))); }
          drawVault(); root.appendChild(vault);
          const box = h('div'), foot = h('div'); root.appendChild(box); root.appendChild(foot);
          function part1() {
            const cb = DL.charts.box('Bar chart: incidents per district'); DL.ui.clear(box).append(h('div', { class: 'panel-title', text: 'Part 1 — click the district with the MOST incidents' }), cb.wrap);
            DL.charts.render(cb.canvas, { type: 'bar', labels: d.dists, datasets: [{ label: 'Incidents', data: d.inc, color: '#6B8CFF' }], yMin: 0, legend: false, yTitle: 'Incidents', onClick: (di, i) => { if (i === d.top) { code[0] = c1; drawVault(); api.stepOk('Code part 1 revealed: ' + c1 + ' (first three letters of ' + topName + ').'); part2(); } else api.wrong('That district is not the highest. Compare the bar heights.'); } });
          }
          function part2() {
            const cb = DL.charts.box('Line chart: monthly incidents in ' + topName); DL.ui.clear(box).append(h('div', { class: 'panel-title', text: 'Part 2 — click the PEAK month for ' + topName }), cb.wrap);
            DL.charts.render(cb.canvas, { type: 'line', labels: M, datasets: [{ label: topName, data: d.monthly, color: '#50E3E6' }], legend: false, yTitle: 'Incidents', xTitle: 'Month', onClick: (di, i) => { if (i === d.peak) { code[1] = c2; drawVault(); api.stepOk('Code part 2 revealed: ' + c2 + ' (' + M[d.peak] + ' is month ' + (d.peak + 1) + ').'); part3(); } else api.wrong('That is not the highest point of the line.'); } });
          }
          function part3() {
            const cb = DL.charts.box('Pie chart: share of incident causes (%)'); const ans = C.numField('Largest slice (%)', { placeholder: '%' });
            DL.ui.clear(box).append(h('div', { class: 'panel-title', text: 'Part 3 — what percentage does the LARGEST slice represent? (hover/tap slices)' }), cb.wrap,
              h('details', null, h('summary', { text: 'Show data table' }), C.table({ columns: [{ key: 's', label: 'Cause' }, { key: 'v', label: '%' }], rows: d.sectors.map((s, i) => ({ s, v: String(d.pie[i]) })), label: 'Pie data' }).el),
              h('div', { class: 'answer-row' }, ans.el, h('button', { class: 'btn primary', type: 'button', onclick: () => { if (ans.value() === +c3) { code[2] = c3; drawVault(); api.stepOk('Code part 3 revealed: ' + c3 + '. Now enter the complete code.'); final(); } else api.wrong('That is not the percentage of the largest slice. Compare the slices, then read its value.'); } }, icon('check'), 'Reveal part 3')));
            DL.charts.render(cb.canvas, { type: 'pie', labels: d.sectors, datasets: [{ label: '%', data: d.pie }], pieUnit: '%', title: 'Causes of incidents (%)' });
          }
          function final() {
            DL.ui.clear(box); const inp = h('input', { type: 'text', class: 'mono', 'aria-label': 'Full access code', placeholder: 'XXX-00-00', maxlength: '14' });
            box.appendChild(h('div', { class: 'panel-title', text: 'Enter the complete access code to open the vault' }));
            box.appendChild(h('div', { class: 'answer-row' }, h('div', { class: 'field' }, inp), h('button', { class: 'btn primary', type: 'button', onclick: () => {
              const want = c1 + '-' + c2 + '-' + c3, got = inp.value.toUpperCase().replace(/\s+/g, '');
              if (got === want) { api.shared.m4 = Object.assign(api.shared.m4 || {}, { code: want }); api.correct('VAULT OPEN. Access code: ' + want); }
              else api.note('warn', 'The code does not open the vault. Combine the three revealed parts with hyphens, e.g. ABC-01-23.');
            } }, icon('lock'), 'Open vault')));
          }
          part1();
        },
        explain: 'The code was impossible to guess: each part came from reading a different chart type — a <b>bar chart</b> (compare categories), a <b>line chart</b> (find a peak in time) and a <b>pie chart</b> (parts of a whole).',
        insight: { concept: 'Reading values from different chart types', short: 'each chart type answers a different kind of question.', text: 'Strong chart readers check titles, axes, units and legends first, then extract the exact values that answer the question.', real: 'Security analysts read dashboards to find the busiest system, the peak attack time and the biggest cause of incidents.' }
      }
    ]
  });
})(window.DL);
