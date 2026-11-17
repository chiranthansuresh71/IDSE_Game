/* FINAL MYSTERY — combines all five missions: evidence → cause, pipeline order, final audit. */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui, st = DL.stats, C = DL.comp;
  const CAUSES = [{ id: 'wrong', label: 'Incorrect records' }, { id: 'missing', label: 'Missing information' }, { id: 'dups', label: 'Unchecked duplicates' }, { id: 'stats', label: 'Misinterpreted statistics' }, { id: 'viz', label: 'Misleading visualizations' }, { id: 'valid', label: 'Poorly validated predictions' }];
  const EV = [
    ['Marks column contains "ninety" and the value 950', 'wrong'], ['An age of -4 was recorded for a student', 'wrong'], ['Attendance 640% appears in the register', 'wrong'],
    ['Blank attendance cells were silently filled with 0', 'missing'], ['Half the income column is empty and nobody noticed', 'missing'], ['Rows with missing marks were ignored without telling anyone', 'missing'],
    ['ID 102 appears twice, so one student counts double', 'dups'], ['The same sensor reading was uploaded three times', 'dups'], ['Two identical customer rows inflated the sales total', 'dups'],
    ['The report quoted a mean of 31, but one faulty reading (95) distorted it', 'stats'], ['A mean salary was reported although a few huge salaries skew the data', 'stats'], ['A correlation was reported as proof one thing causes the other', 'stats'],
    ['A bar chart whose y-axis started at 95 made a 2% gap look huge', 'viz'], ['Months on a line chart were shuffled so the trend vanished', 'viz'], ['An unannounced log axis hid a 100x difference', 'viz'],
    ['The model reported 100% accuracy measured on its own training data', 'valid'], ['A model was never tested on any unseen students', 'valid'], ['The target (Final Result) was used as an input to the model', 'valid']
  ];
  const WHY = { wrong: 'Impossible values = incorrect records.', missing: 'Gaps in the data = missing information.', dups: 'Repeated rows = unchecked duplicates.', stats: 'Summary misread = misinterpreted statistics.', viz: 'Distorted chart = misleading visualization.', valid: 'Untested/leaky model = poorly validated predictions.' };
  const STAGES = ['Collect the data and identify each field\'s type', 'Clean it: remove duplicates, handle missing and invalid values', 'Explore it with statistics (mean, median, outliers, correlation)', 'Visualize it honestly to communicate the patterns', 'Split into training and test data, then build a model', 'Evaluate the model on unseen test data'];
  const NEEDS = [[1, 0, 'Cleaning without first collecting and typing the data: there is nothing reliable to clean.'], [2, 1, 'Statistics were computed on <b>dirty data</b> (duplicates, blanks, invalid values) — the mean is distorted.'], [3, 2, 'Charts were drawn before the patterns were explored — you do not yet know what the chart should show.'], [4, 1, 'The model was trained on <b>dirty data</b> — garbage in, garbage out.'], [5, 4, 'Evaluation happened before any train/test split — the model was scored on data it had already seen, so the accuracy is inflated.'], [0, -1, '']];

  DL.finalMission = {
    id: 'final', title: 'The Final Mystery', icon: 'shield', difficulty: 'Expert', concept: 'Everything combined',
    description: 'Who breached Nova City? Review the evidence from all five investigations and name the true cause of the failure.',
    challenges: [
      {
        id: 'f1', kind: 'practical', mechanic: 'Arcade: evidence sorting', title: 'Stage 1 — Trace every clue to its cause',
        story: 'Evidence from all five investigations floods in. There is no outside hacker in the logs.',
        intro: 'Each clue points to one poor data practice. Send every clue to the cause that produced it — before the system integrity runs out. Use the number keys 1–6 on a keyboard.',
        objective: 'Route <b>14 clues</b> to the right cause.',
        hints: ['Think back: which mission did each clue come from?', 'Zero-filled blanks → missing information; the same ID twice → duplicates; one extreme value distorting a mean → misinterpreted statistics.'],
        render(root, d, api) {
          DL.arcade.conveyor(root, { title: 'Evidence desk', brief: 'Each clue was caused by one of six poor data practices. Send it to the right one.', goal: 14, fall: 11000, minFall: 6500, lives: 4,
            bins: CAUSES.map(c => ({ id: c.id, label: c.label, desc: '' })),
            next(rng) { const x = rng.pick(EV); return { label: x[0], bin: x[1], why: WHY[x[1]] }; } }, api);
        },
        explain: 'Each failure had a different fingerprint: <b>wrong values</b>, <b>missing data</b>, <b>duplicates</b>, <b>misread statistics</b>, <b>misleading charts</b> and <b>unvalidated predictions</b>.',
        insight: { concept: 'Data quality chain', short: 'small data-quality problems compound into big failures.', text: 'A single bad practice may be harmless, but a chain of them — wrong records, missing data, duplicates, misread statistics, misleading charts and unvalidated models — can take down a whole system.', real: 'Many real-world analytics failures are traced back to data quality issues, not to the algorithms.' }
      },
      {
        id: 'f2', kind: 'practical', mechanic: 'Simulation: run the pipeline', title: 'Stage 2 — Rebuild the pipeline and run it',
        story: 'To prevent another failure, NovaCore needs a reliable workflow. Test your design in the simulator.',
        intro: 'Arrange the six stages, then press <b>Run pipeline</b>. The simulator executes your stages in order and shows exactly what breaks. Iterate until the run is fault-free.',
        objective: 'Get a pipeline run with <b>0 faults</b>.',
        hints: ['The simulator tells you which earlier stage a failing stage was missing.', 'Evaluation needs a test set to exist first; statistics need clean data.'],
        setup(rng) { let order; do { order = rng.shuffle(STAGES.map((_, i) => i)); } while (order.every((v, i) => v === i)); return { order }; },
        render(root, d, api) {
          let order = d.order.slice(); const list = h('ol', { class: 'reorder' }), log = h('div', { class: 'report-doc', role: 'status', 'aria-live': 'polite' });
          const run = () => { const done = new Set(), out = []; let faults = 0;
            order.forEach(s => { const need = NEEDS.find(n => n[0] === s && n[1] >= 0); let ok = true; if (need && !done.has(need[1])) { ok = false; faults++; out.push({ ok, text: STAGES[s].split(':')[0] + ' — ' + need[2] }); } else out.push({ ok, text: STAGES[s].split(':')[0] + ' — ran correctly.' }); done.add(s); });
            return { out, faults }; };
          function draw() {
            DL.ui.clear(list);
            order.forEach((v, pos) => list.appendChild(h('li', null, h('b', { class: 'mono', text: String(pos + 1) }), h('span', { text: STAGES[v] }),
              h('button', { class: 'btn small', type: 'button', disabled: pos === 0, 'aria-label': 'Move up: ' + STAGES[v], onclick: () => { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; draw(); } }, icon('up')),
              h('button', { class: 'btn small', type: 'button', disabled: pos === order.length - 1, 'aria-label': 'Move down: ' + STAGES[v], onclick: () => { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; draw(); } }, icon('down')))));
          }
          draw(); root.appendChild(list); root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            const r = run(); DL.ui.clear(log); r.out.forEach(l => log.appendChild(h('div', { class: l.ok ? 'ok' : 'bad', html: (l.ok ? '✓ ' : '✗ ') + l.text })));
            log.appendChild(h('div', { class: 'mono', style: { marginTop: '8px' }, text: 'Faults: ' + r.faults }));
            if (!r.faults) api.correct('The pipeline ran with 0 faults.'); else api.wrong(r.faults + ' fault(s) in the run — read the log and rearrange.');
          } }, icon('cpu'), 'Run pipeline'))); root.appendChild(log);
        },
        explain: 'Data science is a <b>pipeline</b>: understand → clean → explore → visualize → model → evaluate. Each stage depends on earlier ones: dirty data poisons statistics and models, and evaluation needs held-out test data.',
        insight: { concept: 'The data science workflow', short: 'understand → clean → explore → visualize → model → evaluate.', text: 'Following the workflow in order prevents errors from silently flowing into the final model.', real: 'Data teams in industry spend most of their time on the first three stages before any model is built.' }
      },
      {
        id: 'f3', kind: 'practical', mechanic: 'Spot the flaws', title: 'Stage 3 — Audit the official report',
        story: 'One last document remains: the report that convinced the council to trust the system.',
        intro: 'Read the report and <b>tap every flawed claim</b>. Flawed claims reveal why they are wrong. Accusing a sound claim costs XP, so use what you learned.',
        objective: 'Find <b>all 4 flawed claims</b> in the report.',
        hints: ['Re-check each claim against what you learned: mean vs median, axis starting points, training vs test accuracy, correlation vs causation.', 'Some statements sound technical but are simply untrue (for example, "charts must always be pie charts").'],
        setup(rng) { const inc = Array.from({ length: 9 }, () => rng.int(28, 62)); inc.push(rng.int(700, 950)); return { inc: rng.shuffle(inc) }; },
        render(root, d, api) {
          const mean = Math.round(st.mean(d.inc)), med = st.median(d.inc), found = new Set();
          root.appendChild(h('div', { class: 'callout' }, h('b', { text: 'Official report excerpt. ' }), 'Household incomes sampled (in thousand ₹): ', h('span', { class: 'mono', text: d.inc.join(', ') })));
          const items = [
            { id: 'a', bad: true, label: 'The "typical" income is ₹' + mean + 'k (the mean).', why: 'One extreme income inflates the mean; the median (₹' + med + 'k) is more representative.' },
            { id: 'b', bad: true, label: 'A bar chart compares two districts (satisfaction 96% vs 98%) with a y-axis starting at 95.', why: 'A truncated axis makes a 2-point gap look enormous (Lie Factor ≫ 1).' },
            { id: 'c', bad: true, label: 'The prediction model reached 98% accuracy — measured on the same data it was trained on.', why: 'Accuracy must be measured on unseen test data; training accuracy rewards memorisation.' },
            { id: 'd', bad: true, label: 'New bus lanes caused fewer accidents, because the two trends are correlated.', why: 'Correlation does not prove causation; a hidden factor could drive both.' },
            { id: 'e', bad: false, label: 'The dataset has more than ten rows, so any analysis of it is invalid.', why: '' },
            { id: 'f', bad: false, label: 'Charts must always be pie charts to be honest.', why: '' },
            { id: 'g', bad: false, label: 'Using the median instead of the mean is always an error.', why: '' }
          ];
          const status = h('div', { class: 'mono', role: 'status', text: 'Flaws found: 0 / 4' }), list = h('div', { class: 'report-doc' });
          DL.rand.make(d.inc[0] * 7 + 3).shuffle(items).forEach(it => { const b = h('button', { type: 'button', class: 'hot', onclick: () => {
            if (b.classList.contains('found') || b.classList.contains('safe')) return;
            if (!it.bad) { b.classList.add('safe'); return api.wrong('That claim is actually sound — false alarm.'); }
            b.classList.add('found'); found.add(it.id); b.after(h('div', { class: 'callout', style: { margin: '4px 0 10px' }, html: '<b>FLAW:</b> ' + it.why })); DL.sound.play('correct'); status.textContent = 'Flaws found: ' + found.size + ' / 4';
            if (found.size === 4) api.correct('Audit complete — all four flawed practices found, with no false alarms left.'); else api.stepOk('Flaw found!'); } }, it.label); list.appendChild(h('p', null, b)); });
          root.appendChild(list); root.appendChild(status);
        },
        explain: '<b>The truth:</b> Nova City\'s system was never hacked from outside. It failed because of a chain of poor data practices — incorrect records, missing information, unchecked duplicates, misinterpreted statistics, misleading visualizations and poorly validated predictions. Good data practice would have prevented every one of them.',
        insight: { concept: 'Critical evaluation of data claims', short: 'question averages, charts, accuracy figures and causal claims.', text: 'Before trusting an analysis, ask: Is the data clean? Is the average representative? Are the axes honest? Was the model tested on unseen data? Does correlation really show a cause?', real: 'Auditors and journalists use exactly these questions to fact-check statistics in public reports.' }
      }
    ]
  };
})(window.DL);
