/* MISSION 5 — THE PREDICTION PROTOCOL: features/target, classification vs regression, a transparent model, train/test, accuracy. */
window.DL = window.DL || {}; DL.missions = DL.missions || [];
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui, st = DL.stats, C = DL.comp, D = DL.data;
  const FL = { study: 'Study hours', att: 'Attendance %', prev: 'Previous marks' };
  const FEATS = ['study', 'att', 'prev'];
  const kv = (v, l) => h('div', null, h('b', { text: String(v) }), h('span', { text: l }));
  const getAll = (rng, sh) => { if (!sh.all) sh.all = D.performance(rng, 30); return sh.all; };
  const pct = v => Math.round(v * 100);
  const KF = { study: 'study', att: 'att', prev: 'prev', id: 'idn', result: 'res' };
  function knnPredict(train, row, k, feats, scale) {
    const d = train.map(t => ({ t, d: feats.reduce((a, f) => a + ((t[f] - row[f]) / scale[f]) ** 2, 0) })).sort((a, b) => a.d - b.d).slice(0, k);
    const pass = d.filter(x => x.t.result === 'Pass').length; return pass * 2 === d.length ? d[0].t.result : (pass * 2 > d.length ? 'Pass' : 'Fail');
  }
  const scaleOf = (rows, feats) => { const o = {}; feats.forEach(f => { const v = rows.map(r => r[f]); o[f] = (Math.max.apply(null, v) - Math.min.apply(null, v)) || 1; }); return o; };

  function bestRule(sh) { return sh.rule && FEATS.indexOf(sh.rule.feature) >= 0 ? sh.rule : (b => ({ feature: b.feature, thr: b.thr }))(D.bestStump(sh.all.slice(0, 20))); }

  DL.missions.push({
    id: 'm5', number: 5, icon: 'cpu', title: 'The Prediction Protocol', difficulty: 'Intermediate–Advanced', concept: 'Machine learning basics',
    description: 'The city\'s forecasts are failing. Examine historical data and build a transparent prediction rule.',
    closing: 'You built, tested and evaluated a real prediction rule on data it had never seen. <b>The prediction system is restored</b> — but the investigation is not over: something caused the original failure.',
    report(sh) {
      const r = sh.m5 || {};
      return h('div', { class: 'callout' }, h('div', { class: 'panel-title', text: 'Prediction system status: RESTORED' }), h('div', { class: 'kv' },
        kv(r.rule || '–', 'Rule built'), kv(r.train != null ? r.train + '%' : '–', 'Training accuracy'), kv(r.test != null ? r.test + '%' : '–', 'Test accuracy')),
        h('p', { class: 'muted', text: 'Test accuracy on unseen students is the honest estimate of performance — training accuracy alone can be over-optimistic.' }));
    },
    challenges: [
      /* ---------- C1 feature lab ---------- */
      {
        id: 'm5c1', kind: 'practical', mechanic: 'Model lab: choose inputs', title: 'Level 1 — Feature lab',
        story: 'The prediction engine is offline. Wire up its inputs from the student records and watch how well it predicts.',
        intro: 'In supervised learning the model uses <b>features</b> (inputs) to predict a <b>target</b> (the outcome). Switch columns on or off as model inputs and watch the live accuracy of a nearest-neighbour model (tested by leaving each student out in turn). Some columns help, some are useless, and one is a trap.',
        objective: 'Reach the target accuracy using <b>honest, useful inputs only</b>, then deploy the model.',
        hints: ['Which column is the thing you want to predict? Feeding it to the model as an input is cheating.', 'A student ID is just a label — does switching it on ever help?'],
        setup(rng, sh) { const all = getAll(rng, sh).map((r, i) => Object.assign({}, r, { idn: i + 1, res: r.result === 'Pass' ? 1 : 0 })); const feats = ['study', 'att', 'prev'], subsets = []; for (let m = 1; m < 8; m++) subsets.push(feats.filter((f, i) => m & (1 << i))); return { all, subsets }; },
        render(root, d, api) {
          const loo = fs => { if (!fs.length) return 0; const sc = scaleOf(d.all, fs); let ok = 0; d.all.forEach((r, i) => { if (knnPredict(d.all.filter((_, j) => j !== i), r, 3, fs, sc) === r.result) ok++; }); return ok / d.all.length; };
          const best = Math.max.apply(null, d.subsets.map(loo)), target = Math.max(60, Math.floor(best * 100) - 7), on = new Set();
          const COLS = [['study', 'Study Hours'], ['att', 'Attendance'], ['prev', 'Previous Marks'], ['idn', 'Student ID'], ['res', 'Final Result']];
          root.appendChild(DL.comp.table({ label: 'Student records', columns: [{ key: 'id', label: 'Student ID' }, { key: 'study', label: 'Study Hours' }, { key: 'att', label: 'Attendance' }, { key: 'prev', label: 'Previous Marks' }, { key: 'result', label: 'Final Result' }], rows: d.all.slice(0, 5).map(r => ({ id: r.id, study: String(r.study), att: String(r.att), prev: String(r.prev), result: r.result })) }).el);
          const meter = h('div', { class: 'meter' }, h('i', { style: { width: '0%' } })), info = h('div', { class: 'bubble', role: 'status' }), stat = h('div', { class: 'kv' });
          const toggles = h('div', { class: 'tool-row', role: 'group', 'aria-label': 'Model inputs', style: { margin: '10px 0' } }, COLS.map(([k, l]) => h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: e => { on.has(k) ? on.delete(k) : on.add(k); e.currentTarget.setAttribute('aria-pressed', String(on.has(k))); upd(); DL.sound.play('click'); } }, l)));
          function accNow() { return loo([...on].map(k => KF[k] === 'idn' ? 'idn' : KF[k] === 'res' ? 'res' : k)); }
          function upd() {
            const fs = [...on]; const acc = fs.length ? accNow() : 0; meter.firstChild.style.width = pct(acc) + '%';
            DL.ui.clear(stat).append(h('div', null, h('b', { text: pct(acc) + '%' }), h('span', { text: 'Live model accuracy' })), h('div', null, h('b', { text: target + '%' }), h('span', { text: 'Target' })), h('div', null, h('b', { text: String(fs.length) }), h('span', { text: 'Inputs switched on' })));
            let msg = 'Switch columns on to feed the model.', good = false;
            if (on.has('res')) msg = '⚠ TOO GOOD TO BE TRUE: you gave the model the answer (Final Result) as an input — that is data leakage. A real model must predict it from other columns.';
            else if (on.has('idn')) msg = 'Student ID is only a label. It carries no information about passing, and it can only add noise.';
            else if (fs.length) { good = acc * 100 >= target; msg = good ? 'Strong, honest model. Deploy it!' : 'Useful inputs help — but not every input helps equally. Try other combinations.'; }
            info.className = 'bubble' + (good ? ' good' : ''); info.textContent = msg;
          }
          root.appendChild(h('div', { class: 'panel-title', style: { marginTop: '12px' }, text: 'Model inputs (toggle each column)' })); root.appendChild(toggles); root.appendChild(meter); root.appendChild(stat); root.appendChild(info);
          root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            if (!on.size) return api.note('warn', 'Switch on at least one input.');
            if (on.has('res')) return api.wrong('Deployment blocked: the model uses the <b>target</b> (Final Result) as an input. It looks perfect only because it was handed the answer.');
            if (on.has('idn')) return api.wrong('Deployment blocked: <b>Student ID</b> is just an identifier, not a feature.');
            const acc = pct(accNow()); if (acc < target) return api.wrong('The model scores ' + acc + '%, below the target of ' + target + '%. Try adding or swapping useful inputs.');
            api.correct('Model deployed with ' + acc + '% accuracy using: ' + [...on].map(k => COLS.find(c => c[0] === k)[1]).join(', ') + '. Target variable: Final Result.');
          } }, icon('cpu'), 'Deploy model'))); upd();
        },
        explain: 'The <b>target</b> is Final Result — what we want to predict. The <b>features</b> are measurable inputs (study hours, attendance, previous marks). An ID labels a row but says nothing about the student, and using the target as an input is <b>data leakage</b>: a deceptively perfect score that fails in real life.',
        insight: { concept: 'Features and target variable', short: 'features are inputs; the target is what we predict.', text: 'Supervised learning learns from examples where the correct target is known. Features are the measurable inputs; the target variable is the outcome to predict. Never let the target leak into the inputs.', real: 'A bank predicts loan default (target) from income, age and credit history (features) — not from the "defaulted" flag itself.' }
      },
      /* ---------- C2 classification vs regression ---------- */
      {
        id: 'm5c2', kind: 'standard', mechanic: 'Arcade: sorting conveyor', title: 'Level 2 — Classification or regression?',
        story: 'Forecasting requests pour in. Each needs the right kind of model.',
        intro: '<b>Classification</b> predicts a category or label (Pass/Fail, spam/not spam). <b>Regression</b> predicts a number (marks, price, temperature).',
        objective: 'Route <b>10 prediction tasks</b> to the right model type.',
        hints: ['Is the answer a label from a short list, or a number on a scale?', '"Whether…" and "which type…" are classification; "how much / how many" are regression.'],
        render(root, d, api) {
          const T = [['Predict whether a student passes or fails', 'c'], ['Predict whether an email is spam', 'c'], ['Predict whether a patient has a disease (yes/no)', 'c'], ['Predict which species a flower belongs to', 'c'], ['Predict whether a customer will cancel', 'c'], ['Predict a student\'s examination marks', 'r'], ['Predict the price of a house', 'r'], ['Predict tomorrow\'s temperature', 'r'], ['Predict a taxi fare', 'r'], ['Predict units sold next week', 'r']];
          DL.arcade.conveyor(root, { title: 'Forecast desk', brief: 'Send label-predicting tasks to <b>Classification</b> and number-predicting tasks to <b>Regression</b>.', goal: 10, fall: 8500, minFall: 5000,
            bins: [{ id: 'c', label: 'Classification', desc: 'predict a category' }, { id: 'r', label: 'Regression', desc: 'predict a number' }],
            next(rng) { const x = rng.pick(T); return { label: x[0], bin: x[1], why: x[1] === 'c' ? 'The answer is a category/label → Classification.' : 'The answer is a number on a scale → Regression.' }; } }, api);
        },
        explain: 'The <b>type of target</b> decides the task. Pass/Fail is a category → classification. Examination marks are numbers → regression. The same student dataset can support either, depending on what you predict.',
        insight: { concept: 'Classification vs regression', short: 'classification predicts labels; regression predicts numbers.', text: 'Classification outputs a class (spam / not spam). Regression outputs a continuous value (a house price). Choosing correctly decides the algorithm and the metric.', real: 'Hospitals use classification for "disease or not" and regression for predicting length of stay.' }
      },
      /* ---------- C3 make a prediction (rule tuner) ---------- */
      {
        id: 'm5c3', kind: 'practical', mechanic: 'Build a prediction rule', title: 'Make a prediction',
        story: 'No black boxes: you will build a transparent decision rule from 20 historical students.',
        intro: 'A <b>decision rule</b> predicts <i>Pass</i> when one feature is at least a chosen threshold, otherwise <i>Fail</i>. The data decides which feature and threshold work best — this is the idea behind a simple decision tree.',
        objective: 'Choose a feature and move the threshold to reach the target <b>training accuracy</b>. Then lock in your rule. (Exploring is free; only locking in costs XP if it misses.)',
        hints: ['Try each feature. Which one separates the green Pass points (top) from the red Fail points (bottom) most cleanly?', 'Move the threshold to where most Fail points are to the left of the line and most Pass points to the right.'],
        setup(rng, sh) { const all = getAll(rng, sh), train = all.slice(0, 20), best = D.bestStump(train); return { train, best, target: Math.max(70, Math.floor(best.acc * 100) - 5) }; },
        render(root, d, api) {
          let feature = 'att', thr = 0, chart = null;
          const rng = fn => { const v = d.train.map(r => r[fn]); return { lo: Math.min.apply(null, v), hi: Math.max.apply(null, v) }; };
          const sel = h('select', { 'aria-label': 'Feature to split on', onchange: e => { feature = e.target.value; setSlider(); draw(); } }, FEATS.map(f => h('option', { value: f, text: FL[f], selected: f === 'att' ? true : null })));
          const slider = h('input', { type: 'range', 'aria-label': 'Threshold', oninput: e => { thr = +e.target.value; draw(); } });
          const out = h('div'), rule = h('div', { class: 'formula' }), cb = DL.charts.box('Training students: feature value against Pass or Fail');
          function setSlider() { const r = rng(feature), step = feature === 'study' ? 0.1 : 1; slider.min = Math.floor(r.lo); slider.max = Math.ceil(r.hi); slider.step = step; thr = +slider.min; slider.value = thr; }
          function draw() {
            const acc = D.stumpAccuracy(d.train, feature, thr); let tp = 0, fp = 0, tn = 0, fn = 0;
            d.train.forEach(r => { const p = r[feature] >= thr ? 'Pass' : 'Fail'; if (p === 'Pass' && r.result === 'Pass') tp++; else if (p === 'Pass') fp++; else if (r.result === 'Fail') tn++; else fn++; });
            rule.textContent = 'IF ' + FL[feature] + ' ≥ ' + thr + ' THEN predict Pass ELSE predict Fail';
            DL.ui.clear(out).append(h('div', { class: 'kv' }, kv(pct(acc) + '%', 'Training accuracy'), kv(d.target + '%', 'Target accuracy'), kv(tp + tn + ' / ' + d.train.length, 'Correct predictions'), kv(fp + ' / ' + fn, 'False Pass / missed Pass')));
            if (chart) chart.destroy();
            const pass = d.train.map((r, i) => ({ x: r[feature], y: 1 + ((i % 5) - 2) * 0.05, r })), fail = d.train.map((r, i) => ({ x: r[feature], y: 0 + ((i % 5) - 2) * 0.05, r }));
            chart = DL.charts.render(cb.canvas, { type: 'scatter', noAnim: true, legend: true, xTitle: FL[feature], yTitle: 'Pass (top) / Fail (bottom)', yMin: -0.4, yMax: 1.4, datasets: [
              { label: 'Passed', data: pass.filter(p => p.r.result === 'Pass'), color: '#5CE1A3', radius: 6 }, { label: 'Failed', data: fail.filter(p => p.r.result === 'Fail'), color: '#FF7185', radius: 6 },
              { label: 'Threshold', data: [{ x: thr, y: -0.4 }, { x: thr, y: 1.4 }], line: true, color: '#FFCA70' }] });
          }
          setSlider();
          root.appendChild(h('div', { class: 'answer-row' }, h('div', { class: 'field' }, h('label', { text: 'Feature' }), sel), h('div', { class: 'field' }, h('label', { text: 'Threshold' }), slider)));
          root.appendChild(rule); root.appendChild(cb.wrap); root.appendChild(out);
          root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            const acc = pct(D.stumpAccuracy(d.train, feature, thr));
            if (acc < d.target) return api.wrong('Training accuracy is ' + acc + '%, below the target of ' + d.target + '%. Try another feature or move the threshold.');
            api.shared.rule = { feature, thr }; api.shared.m5 = Object.assign(api.shared.m5 || {}, { rule: FL[feature] + ' ≥ ' + thr, train: acc });
            api.correct('Rule locked in: ' + FL[feature] + ' ≥ ' + thr + ' gives ' + acc + '% accuracy on the training data.');
          } }, icon('check'), 'Lock in rule')));
          draw();
        },
        explain: 'You built a tiny <b>supervised learning</b> model by hand: the data tells you which feature separates the classes best and where to place the threshold. It is transparent — you can read the rule — unlike a random guess.',
        insight: { concept: 'Making predictions from data', short: 'a model learns a rule that maps features to the target.', text: 'Learning from data means choosing a rule (or model) that fits historical examples. Decision rules and nearest-neighbour methods are simple, explainable starting points.', real: 'Weather services learn rules from decades of past observations to forecast tomorrow.' }
      },
      /* ---------- C4 overfit lab ---------- */
      {
        id: 'm5c4', kind: 'practical', mechanic: 'Experiment: train/test + overfitting', title: 'Level 4 — The overfit lab',
        story: 'A model that memorises the past can look perfect — and still fail tomorrow.',
        intro: 'Data is split into a <b>training set</b> (20 students the model learns from) and a <b>test set</b> (10 hidden students). A nearest-neighbour model has a dial <b>k</b>: with k = 1 it practically memorises each training student. Slide k and watch both accuracy curves.',
        objective: 'Find the k whose <b>test accuracy</b> is the best, then lock it in.',
        hints: ['Look at the TEST line, not the training line. Training accuracy at k = 1 is perfect — is that useful?', 'Slide through k = 1…15 and note where the test line peaks.'],
        setup(rng, sh) { const all = getAll(rng, sh), order = rng.shuffle(all.map((_, i) => i)); return { train: order.slice(0, 20).map(i => all[i]), test: order.slice(20).map(i => all[i]) }; },
        render(root, d, api) {
          const feats = ['study', 'att', 'prev'], sc = scaleOf(d.train.concat(d.test), feats), acc = (rows, k) => rows.filter(r => knnPredict(d.train, r, k, feats, sc) === r.result).length / rows.length;
          const ks = Array.from({ length: 15 }, (_, i) => i + 1), tr = ks.map(k => pct(acc(d.train, k))), te = ks.map(k => pct(acc(d.test, k))), bestTest = Math.max.apply(null, te);
          let k = 1, chart = null; const cb = DL.charts.box('Training and test accuracy for each k'), info = h('div', { class: 'kv' }), msg = h('div', { class: 'bubble', role: 'status' });
          const slider = h('input', { type: 'range', min: 1, max: 15, step: 1, value: 1, 'aria-label': 'k (neighbours)' });
          const split = h('div', { class: 'split', 'aria-label': '20 training students, 10 test students' }, d.train.map(() => h('i')), d.test.map(() => h('i', { class: 'test' })));
          function draw() {
            if (chart) chart.destroy(); chart = DL.charts.render(cb.canvas, { type: 'line', noAnim: true, labels: ks.map(String), xTitle: 'k (number of neighbours)', yTitle: 'Accuracy %', yMin: 0, yMax: 100, datasets: [{ label: 'Training accuracy', data: tr, color: '#6B8CFF' }, { label: 'Test accuracy', data: te, color: '#FFCA70' }] });
            DL.ui.clear(info).append(h('div', null, h('b', { text: 'k = ' + k }), h('span', { text: 'Current setting' })), h('div', null, h('b', { text: tr[k - 1] + '%' }), h('span', { text: 'Training accuracy' })), h('div', null, h('b', { text: te[k - 1] + '%' }), h('span', { text: 'Test accuracy (unseen)' })), h('div', null, h('b', { text: (tr[k - 1] - te[k - 1]) + ' pts' }), h('span', { text: 'Gap (overfitting)' })));
            msg.textContent = k === 1 ? 'k = 1: the model memorises every training student — perfect on training, shaky on new students.' : tr[k - 1] - te[k - 1] > 15 ? 'Big gap between training and test: the model is overfitting.' : 'Smaller gap: the model is generalising better.';
          }
          slider.addEventListener('input', () => { k = +slider.value; draw(); });
          root.appendChild(h('div', { class: 'panel-title', text: 'Data split (blue = training, amber = test)' })); root.appendChild(split); root.appendChild(cb.wrap); root.appendChild(h('div', { class: 'field', style: { marginTop: '10px' } }, h('label', { text: 'k (neighbours)' }), slider)); root.appendChild(info); root.appendChild(msg);
          root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            if (te[k - 1] < bestTest) return api.wrong('With k = ' + k + ' the test accuracy is ' + te[k - 1] + '%, but another k scores higher on the unseen students. Follow the amber line.');
            api.correct('Locked in k = ' + k + ' with ' + te[k - 1] + '% test accuracy. Training accuracy (' + tr[k - 1] + '%) is not the number that matters.');
          } }, icon('check'), 'Lock in k'))); draw();
        },
        explain: 'At k = 1 the model remembers every training student, so training accuracy is perfect — but on <b>unseen</b> students it does worse: <b>overfitting</b>. Only the <b>test set</b> shows how the model will behave on new data, which is why we keep it hidden during training.',
        insight: { concept: 'Training vs testing data', short: 'train on one part of the data and test on unseen data.', text: 'Splitting data into training and test sets lets you measure how well a model generalises. Evaluating on training data alone rewards memorisation (overfitting).', real: 'Before a spam filter is deployed it is tested on emails it never saw during training.' }
      },
      /* ---------- C5 evaluate ---------- */
      {
        id: 'm5c5', kind: 'practical', mechanic: 'Evaluate predictions', title: 'Evaluate the prediction',
        story: 'Time to audit your own rule on 10 students it has never seen.',
        intro: '<b>Accuracy</b> is the share of predictions that were correct.',
        objective: 'Count the correct predictions in the table, then calculate the accuracy percentage.',
        hints: ['Count the rows where Predicted equals Actual.', 'Accuracy = correct ÷ total × 100.'],
        setup(rng, sh) { getAll(rng, sh); return {}; },
        render(root, d, api) {
          const sh = api.shared, all = sh.all, test = all.slice(20), rule = bestRule(sh), pred = r => (r[rule.feature] >= rule.thr ? 'Pass' : 'Fail');
          const right = test.filter(r => pred(r) === r.result).length, trainAcc = pct(D.stumpAccuracy(all.slice(0, 20), rule.feature, rule.thr)), acc = pct(right / test.length);
          root.appendChild(h('div', { class: 'formula', text: 'Rule: IF ' + FL[rule.feature] + ' ≥ ' + rule.thr + ' THEN Pass ELSE Fail' }));
          root.appendChild(C.table({ label: 'Test students and predictions', columns: [{ key: 'id', label: 'Student' }, { key: 'v', label: FL[rule.feature] }, { key: 'p', label: 'Predicted' }, { key: 'a', label: 'Actual' }], rows: test.map(r => ({ id: r.id, v: String(r[rule.feature]), p: pred(r), a: r.result })) }).el);
          root.appendChild(h('div', { class: 'formula', text: 'Accuracy = Correct Predictions / Total Predictions × 100' }));
          const c = C.numField('Correct predictions', { size: 8 }), a = C.numField('Accuracy (%)', { size: 8 });
          root.appendChild(h('div', { class: 'answer-row' }, c.el, a.el, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            if (isNaN(c.value()) || isNaN(a.value())) return api.note('warn', 'Enter both numbers first.');
            if (c.value() !== right) return api.wrong('Recount: compare Predicted with Actual row by row. There are ' + test.length + ' students in total.');
            if (!C.close(a.value(), 100 * right / test.length, 0.6)) return api.wrong('Correct count is right. Now divide by the total (' + test.length + ') and multiply by 100.');
            api.shared.m5 = Object.assign(api.shared.m5 || {}, { test: acc, rule: FL[rule.feature] + ' ≥ ' + rule.thr, train: trainAcc });
            const fn = test.filter(r => pred(r) === 'Fail' && r.result === 'Pass').length, fp = test.filter(r => pred(r) === 'Pass' && r.result === 'Fail').length;
            api.correct('Accuracy = ' + right + ' / ' + test.length + ' × 100 = ' + acc + '%.', { explainExtra: h('div', null, h('div', { class: 'kv' }, kv(trainAcc + '%', 'Training accuracy'), kv(acc + '%', 'Test accuracy'), kv(fp, 'False "Pass" predictions'), kv(fn, 'Missed "Pass" students')), h('p', { class: 'muted', text: 'Accuracy alone hides which kind of mistake the model makes — always look at the errors too.' })) });
          } }, icon('check'), 'Check')));
        },
        explain: 'Accuracy is the simplest evaluation metric: correct predictions divided by all predictions. Compare the <b>test accuracy</b> with the training accuracy — a big gap is a warning sign. With small test sets, accuracy can swing a lot.',
        insight: { concept: 'Prediction accuracy', short: 'accuracy = correct ÷ total × 100, measured on unseen data.', text: 'Accuracy summarises how often a model is right. Always measure it on test data and look at the types of errors, not just the percentage.', real: 'A hospital would not trust a diagnostic model on accuracy alone; missing a real illness is far costlier than a false alarm.' }
      }
    ]
  });
})(window.DL);
