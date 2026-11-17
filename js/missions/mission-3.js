/* MISSION 3 — THE HIDDEN PATTERN: exploratory data analysis (mean, median, mode, outliers, correlation). */
window.DL = window.DL || {}; DL.missions = DL.missions || [];
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui, st = DL.stats, C = DL.comp;
  const tiles = (vals, cls) => h('div', { class: 'tiles' }, vals.map(v => h('span', { class: 'tile ' + (cls || ''), style: { cursor: 'default' }, text: String(v) })));
  const kv = (v, l) => h('div', null, h('b', { text: String(v) }), h('span', { text: l }));

  DL.missions.push({
    id: 'm3', number: 3, icon: 'search', title: 'The Hidden Pattern', difficulty: 'Intermediate', concept: 'Exploratory data analysis (EDA)',
    description: 'Nova City\'s sensor network is producing suspicious readings. Use statistics to expose abnormal activity.',
    closing: 'You investigated the sensor network with the core tools of <b>exploratory data analysis</b>: centre, spread, unusual values and relationships.',
    report(sh) {
      const r = sh.m3 || {};
      return h('div', { class: 'callout' }, h('div', { class: 'panel-title', text: 'Your EDA report' }), h('div', { class: 'kv' },
        kv(r.mean != null ? r.mean : '–', 'Mean computed'), kv(r.median != null ? r.median : '–', 'Median computed'), kv(r.mode || '–', 'Mode(s) found'), kv(r.outlier != null ? r.outlier : '–', 'Outlier flagged'), kv(r.rs ? r.rs.join(' / ') : '–', 'Correlations (r)')),
        h('p', { class: 'muted', text: 'Findings: the outlier was flagged for investigation (not auto-deleted); the median stayed stable while the mean moved; and correlation was interpreted without assuming causation.' }));
    },
    challenges: [
      /* ---------- C1 mean: balance beam ---------- */
      {
        id: 'm3c1', kind: 'standard', mechanic: 'Physics toy: balance beam', title: 'Level 1 — Balance the beam',
        story: 'Sensor 7 logged overnight readings. Each reading is a weight sitting on a beam.',
        intro: 'The <b>mean</b> is the <b>balance point</b> of the data. Slide the pivot under the beam until it stays level — then see what the number is. Then a rogue reading arrives…',
        objective: 'Balance the beam (hold it level for a second) in <b>both rounds</b>.',
        hints: ['If the beam tips right, more weight is to the right of the pivot: move the pivot to the right.', 'The balance point equals the sum of all readings divided by how many there are.'],
        setup(rng) { const n = rng.int(5, 7), vals = Array.from({ length: n }, () => rng.int(8, 64)); return { vals, rogue: Math.max.apply(null, vals) + rng.int(55, 80) }; },
        render(root, d, api) {
          const NS = 'http://www.w3.org/2000/svg'; let round = 0, timer = null;
          const box = h('div'); root.appendChild(box);
          function play() {
            const vals = round ? d.vals.concat([d.rogue]) : d.vals, mean = st.mean(vals), lo = Math.min.apply(null, d.vals) - 5, hi = Math.max.apply(null, d.vals.concat([d.rogue])) + 5, W = 600, x = v => 30 + (v - lo) / (hi - lo) * (W - 60), tol = (hi - lo) * 0.012;
            const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 20 600 190'); svg.style.maxHeight = '240px'; svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Balance beam with data weights');
            const beam = document.createElementNS(NS, 'g'); const tri = document.createElementNS(NS, 'polygon'); tri.setAttribute('fill', '#FFCA70'); svg.appendChild(beam); svg.appendChild(tri);
            const seen = {}; let inner = '<rect x="20" y="128" width="560" height="8" rx="3" fill="#6B8CFF"/>';
            vals.slice().sort((a, b) => a - b).forEach(v => { seen[v] = (seen[v] || 0) + 1; const rogue = round && v === d.rogue; inner += '<circle cx="' + x(v) + '" cy="' + (118 - (seen[v] - 1) * 18) + '" r="9" fill="' + (rogue ? '#FF7185' : '#50E3E6') + '"/><text x="' + x(v) + '" y="' + (122 - (seen[v] - 1) * 18) + '" font-size="9" text-anchor="middle" fill="#04101f" font-family="DM Mono,monospace">' + v + '</text>'; });
            beam.innerHTML = inner;
            const slider = h('input', { type: 'range', min: lo, max: hi, step: 0.1, value: lo, 'aria-label': 'Pivot position' }), info = h('div', { class: 'mono', role: 'status' }), res = h('div');
            function upd() {
              const p = +slider.value, tilt = Math.max(-7, Math.min(7, (mean - p) / (hi - lo) * 35));
              beam.setAttribute('transform', 'rotate(' + tilt.toFixed(1) + ' ' + x(p) + ' 132)'); tri.setAttribute('points', x(p) + ',134 ' + (x(p) - 14) + ',172 ' + (x(p) + 14) + ',172');
              const level = Math.abs(mean - p) <= tol; info.textContent = 'Pivot at ' + p.toFixed(1) + ' · ' + (level ? 'LEVEL — hold it…' : mean > p ? 'tilting right: move the pivot right' : 'tilting left: move the pivot left');
              clearTimeout(timer); if (level) timer = setTimeout(() => { if (Math.abs(mean - +slider.value) <= tol) done(); }, 900);
            }
            function done() {
              slider.disabled = true; const m = st.round(mean, 2);
              if (round === 0) { api.shared.m3 = Object.assign(api.shared.m3 || {}, { mean: m }); api.stepOk('Balanced at ' + m + '! That balance point is Mean = Sum / Count = ' + st.sum(vals) + ' / ' + vals.length + '. Now a rogue reading arrives…'); round = 1; setTimeout(play, 1200); }
              else api.correct('Balanced at ' + m + ' — the extreme reading dragged the mean from ' + st.round(st.mean(d.vals), 1) + ' to ' + m + '.');
            }
            DL.ui.clear(box).append(h('div', { class: 'tag cyan', text: 'Round ' + (round + 1) + ' of 2' + (round ? ' · rogue reading ' + d.rogue : '') }), h('div', { class: 'formula', text: 'Mean = Sum of all values / Number of values' }), h('div', { class: 'beam-wrap' }, svg), h('div', { class: 'field' }, h('label', { text: 'Move the pivot' }), slider), info, res);
            slider.addEventListener('input', upd); upd();
          }
          play();
        },
        explain: 'The beam only balances at the <b>mean</b>, because the mean is the point where the "pull" of values on the left equals the pull on the right. A single extreme value drags the balance point towards it — a first hint that the mean is sensitive to outliers.',
        insight: { concept: 'Mean (average)', short: 'the balance point: sum of values ÷ number of values.', text: 'The mean summarises a dataset with a single central number. Formula: <span class="mono">Mean = Σx / n</span>. It uses every value, so extremes pull it.', real: 'A city computes the mean daily temperature to compare months.' }
      },
      /* ---------- C2 median: split the crowd ---------- */
      {
        id: 'm3c2', kind: 'practical', mechanic: 'Sort + split the crowd', title: 'Level 2 — Split the crowd',
        story: 'The anomaly detector needs a robust "typical" value.',
        intro: 'The <b>median</b> is the value that splits the <b>sorted</b> data into two equal halves. First sort the readings, then slide the divider until the left and right crowds are the same size. With an even count the divider sits <i>between</i> two readings.',
        objective: 'Round 1 (7 readings) and Round 2 (6 readings): sort, then balance the crowd sizes and release the slider.',
        hints: ['Median only works on sorted data — press Sort first.', 'Odd count: the divider sits ON the middle reading. Even count: it sits BETWEEN the two middle readings, and the median is their average.'],
        setup(rng) { const gen = n => Array.from({ length: n }, () => rng.int(5, 60)); return { rounds: [gen(7), gen(6)] }; },
        render(root, d, api) {
          const box = h('div'); root.appendChild(box); let ri = 0;
          function round() {
            const vals = d.rounds[ri].slice(), n = vals.length, even = n % 2 === 0, sorted = vals.slice().sort((a, b) => a - b); let isSorted = false;
            const strip = h('div', { class: 'tiles' }), info = h('div', { class: 'mono', role: 'status' });
            const slider = h('input', { type: 'range', min: 0, max: 2 * n, step: 1, value: 0, disabled: true, 'aria-label': 'Divider position', onchange: onRelease, oninput: draw });
            const sortBtn = h('button', { class: 'btn', type: 'button', onclick: () => { isSorted = true; slider.disabled = false; sortBtn.disabled = true; DL.sound.play('click'); draw(); } }, icon('filter'), 'Sort the data');
            function split(p) { if (p % 2) { const k = (p - 1) / 2; return { left: k, right: n - k - 1, on: k }; } return { left: p / 2, right: n - p / 2, on: -1 }; }
            function draw() {
              const arr = isSorted ? sorted : vals, p = +slider.value, sp = split(p); DL.ui.clear(strip);
              arr.forEach((v, i) => { let style = {}; if (isSorted) { const leftSide = sp.on >= 0 ? i < sp.on : i < p / 2; style = i === sp.on ? { borderColor: '#FFCA70', background: '#ffca7033' } : leftSide ? { borderColor: '#6B8CFF', background: '#6b8cff22' } : { borderColor: '#5CE1A3', background: '#5ce1a322' }; } strip.appendChild(h('span', { class: 'tile', style: Object.assign({ cursor: 'default' }, style), text: String(v) })); if (isSorted && sp.on < 0 && i === p / 2 - 1) strip.appendChild(h('span', { class: 'mono', style: { alignSelf: 'center', color: 'var(--amber)', fontSize: '26px' }, text: '|' })); });
              info.textContent = isSorted ? 'Left crowd: ' + sp.left + ' · Right crowd: ' + sp.right + (sp.left === sp.right ? ' — EQUAL! release the slider.' : '') : 'The data is unsorted — sort it first.';
            }
            function onRelease() {
              const sp = split(+slider.value); if (sp.left !== sp.right) return api.note('info', 'The crowds are not equal yet (' + sp.left + ' vs ' + sp.right + '). Keep sliding.');
              const med = even ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
              if (ri === 0) { ri = 1; api.stepOk('Balanced! The divider sits on ' + med + ' — the middle value of an odd-sized list. Now an even-sized list.'); setTimeout(round, 900); }
              else { api.shared.m3 = Object.assign(api.shared.m3 || {}, { median: med }); api.correct('Median = (' + sorted[n / 2 - 1] + ' + ' + sorted[n / 2] + ') / 2 = ' + med + '. With an even count the median is the average of the two middle values.'); }
            }
            DL.ui.clear(box).append(h('div', { class: 'tag cyan', text: 'Round ' + (ri + 1) + ' of 2 · ' + n + ' readings (' + (even ? 'even' : 'odd') + ')' }), strip, h('div', { class: 'answer-row' }, sortBtn, h('div', { class: 'field' }, h('label', { text: 'Divider' }), slider)), info); draw();
          }
          round();
        },
        explain: 'Sorting puts values in order; the median is defined by <b>position</b>, not by the order in which readings were recorded. Odd n → the middle value. Even n → the mean of the two middle values. Unlike the mean, one extreme value barely moves it.',
        insight: { concept: 'Median', short: 'the middle value of sorted data; robust to extremes.', text: 'The median splits sorted data into two equal halves and is not pulled by extreme values.', real: 'Governments report <b>median</b> household income because a few billionaires would inflate the mean.' }
      },
      /* ---------- C3 mode: tally ---------- */
      {
        id: 'm3c3', kind: 'standard', mechanic: 'Arcade: tally race', title: 'Level 3 — Tally race: find the mode',
        story: 'Alert codes stream in. Which one keeps repeating?',
        intro: 'The <b>mode</b> is the most frequent value. Tally each incoming alert code by sending it to its tower, then pick the tallest tower(s). A dataset can have one mode, several modes, or none.',
        objective: 'Round 1: tally the stream, then select the mode. Round 2: this stream has <b>two</b> modes — select both.',
        hints: ['Watch which tower grows tallest.', 'Round 2: two towers end up equally tall — select both.'],
        setup(rng) {
          const pool = rng.sample([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 6);
          const r1 = [pool[0], pool[0], pool[0], pool[0], pool[1], pool[1], pool[2], pool[3], pool[4], pool[5]], r2 = [pool[0], pool[0], pool[0], pool[1], pool[1], pool[1], pool[2], pool[2], pool[3], pool[4], pool[5]];
          return { rounds: [rng.shuffle(r1), rng.shuffle(r2)] };
        },
        render(root, d, api) {
          const box = h('div'); root.appendChild(box); let ri = 0;
          function round() {
            const vals = d.rounds[ri], keys = Object.keys(st.freq(vals)).map(Number).sort((a, b) => a - b), want = st.modes(vals), fr = st.freq(vals), sel = new Set(); DL.ui.clear(box);
            box.appendChild(h('div', { class: 'tag cyan', text: 'Round ' + (ri + 1) + ' of 2' }));
            const arena = h('div'); box.appendChild(arena);
            const sub = Object.assign({}, api, { correct: () => phase2() });
            DL.arcade.conveyor(arena, { title: 'Tally race', brief: 'Send each alert code to its own tower to tally it.', goal: vals.length, fall: 9000, minFall: 6000, bins: keys.map(k => ({ id: String(k), label: String(k), desc: 'tower' })),
              next(rng, i) { const v = vals[i % vals.length]; return { label: 'Alert code ' + v, bin: String(v), why: 'Code ' + v + ' tallied.' }; } }, sub);
            function phase2() {
              DL.ui.clear(arena); const max = Math.max.apply(null, keys.map(k => fr[k]));
              const towers = h('div', { class: 'towers', role: 'group', 'aria-label': 'Tally towers: select the mode' }, keys.map(k => { const col = h('div', { class: 'col', style: { height: (fr[k] / max * 120) + 'px' } }); const t = h('button', { type: 'button', class: 'tower chip', 'aria-pressed': 'false', onclick: () => { sel.has(k) ? sel.delete(k) : sel.add(k); t.setAttribute('aria-pressed', String(sel.has(k))); t.classList.toggle('sel', sel.has(k)); } }, col, h('span', { text: String(k) }), h('small', { text: '×' + fr[k] })); return t; }));
              arena.append(h('div', { class: 'panel-title', text: ri ? 'Select BOTH modes' : 'Select the mode (tallest tower)' }), towers, h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
                const got = [...sel].sort((a, b) => a - b); if (!got.length) return api.note('warn', 'Select a tower first.');
                if (got.length !== want.length || got.some((v, i) => v !== want[i])) return api.wrong(ri ? 'This stream is <b>bimodal</b>: two towers tie for tallest. Select both.' : 'That is not the tallest tower.');
                if (ri === 0) { ri = 1; api.stepOk('Mode = ' + want[0] + ' (seen ' + fr[want[0]] + ' times). Round 2 next.'); setTimeout(round, 800); }
                else { api.shared.m3 = Object.assign(api.shared.m3 || {}, { mode: want.join(' & ') }); api.correct('Modes = ' + want.join(' and ') + ' — a bimodal dataset.'); }
              } }, icon('check'), 'Lock mode')));
            }
          }
          round();
        },
        explain: 'The mode is the only average that also works for <b>categorical</b> data (most common colour, city or category). Two values tying for the highest frequency make the data <b>bimodal</b>; if every value appears once there is no mode.',
        insight: { concept: 'Mode', short: 'the most frequent value (there can be several).', text: 'The mode shows what is most common. It is useful for categories and discrete data.', real: 'A shop looks at the modal shoe size sold to decide which size to stock the most.' }
      },
      /* ---------- C4 outlier ---------- */
      {
        id: 'm3c4', kind: 'practical', mechanic: 'Click a chart point', title: 'Identify the outlier',
        story: 'One sensor reading looks wrong. Is it a fault — or a real event?',
        intro: 'An <b>outlier</b> is an observation far away from the rest of the data. It may be an error, or a rare but real event.',
        objective: 'Click the suspicious point on the scatter plot (or use the table below). Then decide what to do with it.',
        hints: ['Look for the one point that is far from the cluster of similar values.', 'Outliers are investigated, not blindly deleted. They can reveal sensor faults or genuinely important events.'],
        setup(rng) {
          const n = 14, base = rng.int(11, 15), vals = Array.from({ length: n }, () => base + rng.int(-2, 2)), at = rng.int(1, n - 2); vals[at] = rng.int(80, 99);
          return { vals, at };
        },
        render(root, d, api) {
          const pts = d.vals.map((v, i) => ({ x: i + 1, y: v })); let chart = null, found = false;
          const cb = DL.charts.box('Scatter plot of sensor readings over time'); root.appendChild(cb.wrap);
          function draw() {
            if (chart) chart.destroy();
            chart = DL.charts.render(cb.canvas, { type: 'scatter', datasets: [{ label: 'Reading', data: pts, colors: pts.map((p, i) => (found && i === d.at ? '#FF7185' : '#50E3E6')), radius: 6 }], xTitle: 'Reading number (time order)', yTitle: 'Sensor value', legend: false, onClick: found ? null : (di, i) => choose(i) });
          }
          function choose(i) {
            if (found) return;
            if (i !== d.at) return api.wrong('Reading #' + (i + 1) + ' (value ' + d.vals[i] + ') sits close to the other readings. Look for a point far from the cluster.');
            found = true; draw(); api.shared.m3 = Object.assign(api.shared.m3 || {}, { outlier: d.vals[d.at] });
            api.stepOk('Outlier found: reading #' + (d.at + 1) + ' = ' + d.vals[d.at] + '. Now compare the statistics with and without it.'); step2();
          }
          draw();
          const det = h('details', { style: { marginTop: '10px' } }, h('summary', { text: 'Prefer a table / keyboard? Open the readings list' }),
            C.table({ columns: [{ key: 'n', label: '#' }, { key: 'v', label: 'Value' }, { key: 'a', label: 'Action' }], rows: d.vals.map((v, i) => ({ n: String(i + 1), v: String(v) })), label: 'Readings', cellRender: (i, k, r) => (k === 'a' ? h('button', { class: 'btn small', type: 'button', onclick: () => choose(i) }, 'Flag as outlier') : r[k]) }).el);
          root.appendChild(det);
          const after = h('div'); root.appendChild(after);
          function step2() {
            const all = d.vals, without = all.filter((_, i) => i !== d.at), f = st.iqrFences(without);
            after.appendChild(h('div', { class: 'panel-title', style: { marginTop: '14px' }, text: 'Effect of the outlier' }));
            after.appendChild(h('div', { class: 'kv' }, kv(st.round(st.mean(all), 1), 'Mean WITH outlier'), kv(st.round(st.mean(without), 1), 'Mean WITHOUT'), kv(st.median(all), 'Median WITH outlier'), kv(st.median(without), 'Median WITHOUT'), kv('> ' + st.round(f.hi, 1), 'IQR upper fence')));
            after.appendChild(h('p', { class: 'muted', text: 'The mean jumped, the median barely moved: the median is robust to outliers. The point is far above the IQR fence (Q3 + 1.5×IQR).' }));
            after.appendChild(h('div', { class: 'panel-title', text: 'What should an investigator do with this reading?' }));
            const q = C.choice({ label: 'Decision', options: [
              { id: 'del', label: 'Delete it automatically — outliers are always mistakes.' },
              { id: 'inv', label: 'Investigate it (sensor fault? typo? genuine event?) and then decide how to treat it.' },
              { id: 'mean', label: 'Silently replace it with the mean so the chart looks tidy.' }], checkLabel: 'Submit decision',
              onSubmit(a) { if (a === 'inv') { q.lock(); api.correct('Correct — investigate first.'); } else api.wrong(a === 'del' ? 'Deleting automatically could throw away a real emergency signal.' : 'Hiding the value without checking changes the data without evidence.'); } });
            after.appendChild(q.el);
          }
        },
        explain: 'An outlier can be a <b>data error</b> (sensor fault, typo) or a <b>rare real event</b> (a genuine spike). Because it may be important, it is investigated and documented before any deletion. Note how it moved the mean but hardly the median.',
        insight: { concept: 'Outliers', short: 'unusual values should be investigated, not automatically deleted.', text: 'An outlier is an observation unusually far from others (one rule of thumb: beyond Q1 − 1.5×IQR or Q3 + 1.5×IQR). It may be an error or a valuable signal.', real: 'Credit-card companies treat an unusually large purchase as an outlier worth checking — it may be fraud.' }
      },
      /* ---------- C5 correlation: match the cloud ---------- */
      {
        id: 'm3c5', kind: 'standard', mechanic: 'Match the cloud + confounder lab', title: 'Level 5 — Match the cloud',
        story: 'Are two sensors related — and does one cause the other?',
        intro: '<b>Correlation</b> measures how two variables move together (Pearson r from −1 to +1). Tune the <b>r dial</b> until your point cloud matches the target cloud. Then investigate a famous trap: correlation vs causation.',
        objective: 'Match the target cloud in <b>3 rounds</b> (hold the match for a second), then solve the ice-cream mystery.',
        hints: ['Positive r: points rise left to right. Negative r: they fall. Near 0: a shapeless cloud.', 'In the lab, colour the points by temperature and compare the correlation inside each group.'],
        setup(rng) {
          const z = () => Array.from({ length: 30 }, () => rng.normal(0, 1)), mk = r => { const x = z(), e = z(); return { x, e, y: x.map((xi, i) => r * xi + Math.sqrt(1 - r * r) * e[i]) }; };
          const targets = rng.shuffle([0.92, -0.78, 0.05]).map(r => { const c = mk(r); return { c, r: st.pearson(c.x, c.y) }; });
          const mine = targets.map(() => ({ x: z(), e: z() }));
          const temp = Array.from({ length: 30 }, () => rng.int(15, 40)), ice = temp.map(t => Math.round(20 + 4 * t + rng.normal(0, 14))), acc = temp.map(t => Math.max(0, Math.round(1 + 0.45 * t + rng.normal(0, 3))));
          return { targets, mine, temp, ice, acc };
        },
        render(root, d, api) {
          const box = h('div'); root.appendChild(box); let ri = 0, timer = null; const rs = [];
          const pts = (x, y) => x.map((v, i) => ({ x: +v.toFixed(2), y: +y[i].toFixed(2) }));
          function round() {
            const T = d.targets[ri], M = d.mine[ri]; let r = 0, c1 = null, c2 = null;
            const cb1 = DL.charts.box('Target cloud', true), cb2 = DL.charts.box('Your cloud', true), meter = h('div', { class: 'meter' }, h('i', { style: { width: '0%' } })), info = h('div', { class: 'mono', role: 'status' });
            const dial = h('input', { type: 'range', min: -1, max: 1, step: 0.01, value: 0, 'aria-label': 'Correlation dial r' });
            function draw() {
              const y = M.x.map((xi, i) => r * xi + Math.sqrt(1 - r * r) * M.e[i]), mr = st.pearson(M.x, y), diff = Math.abs(mr - T.r);
              if (c2) c2.destroy(); c2 = DL.charts.render(cb2.canvas, { type: 'scatter', noAnim: true, legend: false, title: 'Your cloud', datasets: [{ label: 'You', data: pts(M.x, y), color: '#A78BFA' }] });
              meter.firstChild.style.width = Math.max(0, 100 - diff / 0.6 * 100) + '%'; info.textContent = 'Your cloud: r = ' + mr.toFixed(2) + ' · match ' + Math.round(Math.max(0, 100 - diff / 0.6 * 100)) + '%' + (diff <= 0.1 ? ' — LOCKING ON…' : '');
              clearTimeout(timer); if (diff <= 0.1) timer = setTimeout(() => { const yy = M.x.map((xi, i) => r * xi + Math.sqrt(1 - r * r) * M.e[i]); if (Math.abs(st.pearson(M.x, yy) - T.r) <= 0.1) matched(T.r); }, 900);
            }
            c1 = DL.charts.render(cb1.canvas, { type: 'scatter', legend: false, title: 'Target cloud (r hidden)', datasets: [{ label: 'Target', data: pts(T.c.x, T.c.y), color: '#50E3E6' }] });
            DL.ui.clear(box).append(h('div', { class: 'tag cyan', text: 'Round ' + (ri + 1) + ' of 3' }), h('div', { class: 'two-col' }, cb1.wrap, cb2.wrap), h('div', { class: 'field' }, h('label', { text: 'r dial: −1 ↔ +1' }), dial), meter, info);
            dial.addEventListener('input', () => { r = +dial.value; draw(); }); draw();
            function matched(tr) { dial.disabled = true; rs.push(st.round(tr, 2)); if (ri < 2) { api.stepOk('Match! The target had r = ' + st.round(tr, 2) + '.'); ri++; setTimeout(round, 1000); } else { api.stepOk('Match! The target had r = ' + st.round(tr, 2) + '. Now the confounder lab.'); api.shared.m3 = Object.assign(api.shared.m3 || {}, { rs }); setTimeout(lab, 1000); } }
          }
          function lab() {
            const hot = d.temp.map(t => t >= 28), rAll = st.pearson(d.ice, d.acc), sub = h => { const i = d.temp.map((t, k) => k).filter(k => hot[k] === h); return i.length > 3 ? st.pearson(i.map(k => d.ice[k]), i.map(k => d.acc[k])) : 0; };
            const cb = DL.charts.box('Ice-cream sales against pool accidents'); let coloured = false, chart = null; const info = h('div', { class: 'mono', role: 'status' });
            function draw() { if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, { type: 'scatter', noAnim: true, xTitle: 'Ice-cream sales', yTitle: 'Pool accidents', legend: coloured, datasets: coloured ? [{ label: 'Hot days (≥28°C)', data: d.ice.map((v, k) => hot[k] ? { x: v, y: d.acc[k] } : null).filter(Boolean), color: '#FF7185' }, { label: 'Mild days', data: d.ice.map((v, k) => !hot[k] ? { x: v, y: d.acc[k] } : null).filter(Boolean), color: '#50E3E6' }] : [{ label: 'Days', data: d.ice.map((v, k) => ({ x: v, y: d.acc[k] })), color: '#A78BFA' }] }); info.textContent = 'Overall r = ' + rAll.toFixed(2) + (coloured ? ' · inside hot days r = ' + sub(true).toFixed(2) + ' · inside mild days r = ' + sub(false).toFixed(2) : ''); }
            DL.ui.clear(box).append(h('div', { class: 'tag purple', text: 'Confounder lab' }), h('p', { text: 'Ice-cream sales and pool accidents are strongly correlated. Does ice cream cause accidents? Investigate, then give your verdict.' }), cb.wrap, info,
              h('div', { class: 'answer-row' }, h('button', { class: 'btn', type: 'button', onclick: () => { coloured = !coloured; draw(); } }, icon('eye'), 'Colour by temperature')),
              h('div', { class: 'panel-title', style: { marginTop: '12px' }, text: 'Your verdict' }), h('div', { class: 'tool-row' }, h('button', { class: 'btn', type: 'button', onclick: () => api.wrong('If ice cream caused accidents, the link would stay strong within hot days too. Look at the colour groups: it mostly vanishes.') }, 'Ice cream causes accidents'), h('button', { class: 'btn primary', type: 'button', onclick: () => api.correct('Hot weather drives both ice-cream sales and swimming — a hidden third factor (confounder). Correlation does not imply causation.') }, 'A hidden factor (weather) drives both'))); draw();
          }
          round();
        },
        explain: 'You read direction and strength of relationships by matching clouds to r. In the lab the strong overall correlation largely disappears inside each temperature group: hot weather (a <b>confounder</b>) drives both ice-cream sales and swimming accidents. Correlation is not causation.',
        insight: { concept: 'Correlation (not causation)', short: 'correlation shows association, not cause.', text: 'Pearson r measures the strength and direction of a linear relationship (−1 to +1). A strong correlation can arise from coincidence or a hidden third variable.', real: 'Doctors do not conclude that a vitamin cures a disease just because vitamin-takers are healthier — healthier people may simply take more vitamins.' }
      }
    ]
  });
})(window.DL);
