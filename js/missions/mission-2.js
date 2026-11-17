/* MISSION 2 — THE CORRUPTED DATABASE: duplicates, missing values, inconsistent data, full cleaning task. */
window.DL = window.DL || {}; DL.missions = DL.missions || [];
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui, st = DL.stats, C = DL.comp;
  const COLS = [{ key: 'ID' }, { key: 'Name' }, { key: 'Age' }, { key: 'Marks' }, { key: 'Attendance', label: 'Attendance %' }];
  const FIELDS = ['ID', 'Name', 'Age', 'Marks', 'Attendance'];
  const strip = r => { const o = {}; FIELDS.forEach(k => { o[k] = r[k]; }); return o; };
  const stdev = a => { const m = st.mean(a); return Math.sqrt(st.mean(a.map(x => (x - m) ** 2))); };

  DL.missions.push({
    id: 'm2', number: 2, icon: 'filter', title: 'The Corrupted Database', difficulty: 'Beginner–Intermediate', concept: 'Data cleaning & preprocessing',
    description: 'The city\'s education records are inconsistent. Repair the dataset before it is used for official analysis.',
    closing: 'The education database is clean and validated. Garbage in, garbage out: <b>every later analysis depends on the quality of the data you cleaned</b> here.',
    report(sh) {
      const r = sh.m2 || {};
      return h('div', { class: 'callout' }, h('div', { class: 'panel-title', text: 'Errors detected and corrected' }), h('div', { class: 'kv' },
        kv(r.dupes != null ? r.dupes : '–', 'Duplicate rows flagged'), kv(r.missing != null ? r.missing : '–', 'Missing cells detected'), kv(r.inconsistent != null ? r.inconsistent : '–', 'Inconsistent entries fixed'),
        kv(r.fixed != null ? r.fixed + '/' + r.total : '–', 'Errors repaired in final dataset'), kv(r.acc != null ? r.acc + '%' : '–', 'Repair accuracy')));
    },
    challenges: [
      /* ---------- C1 duplicates ---------- */
      {
        id: 'm2c1', kind: 'standard', mechanic: 'Row selection', title: 'Find the duplicate records',
        story: 'The enrolment system saved some students twice.',
        intro: 'A <b>duplicate record</b> is the same real-world entry stored more than once. Duplicates double-count people and distort averages and totals.',
        objective: 'Click the rows that are <b>redundant copies</b> (keep exactly one copy of each duplicated student). Then press Flag duplicates.',
        hints: ['A duplicate matches in every column, including the ID.', 'Two different students can share a name and age. Compare the ID and marks before flagging.'],
        setup(rng) {
          const base = DL.data.students(rng, 8, 101).map((r, i) => Object.assign(r, { _u: 'u' + i }));
          const src = rng.sample([0, 1, 2, 3, 4, 5, 6, 7], 3), dupSrc = src.slice(0, 2), decoySrc = src[2];
          let rows = base.slice();
          const decoy = Object.assign({}, base[decoySrc], { ID: '109', _u: 'decoy', Marks: String(((+base[decoySrc].Marks - 48 + rng.int(5, 20)) % 50) + 48) });
          rows.splice(rng.int(0, rows.length), 0, decoy);
          dupSrc.forEach((s, gi) => { const orig = rows.findIndex(r => r._u === 'u' + s); rows.splice(rng.int(orig + 1, rows.length), 0, Object.assign({}, base[s], { _u: 'u' + s + '_c', _g: 'g' + gi })); rows[rows.findIndex(r => r._u === 'u' + s)]._g = 'g' + gi; });
          return { rows };
        },
        render(root, d, api) {
          const sel = new Set(); let t;
          t = C.table({ columns: COLS, rows: d.rows, label: 'Student records', rowClass: i => (sel.has(i) ? 'sel' : ''), onRow: i => { sel.has(i) ? sel.delete(i) : sel.add(i); t.refresh(); DL.sound.play('click'); } });
          root.appendChild(t.el);
          root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            const groups = {}; d.rows.forEach((r, i) => { if (r._g) (groups[r._g] = groups[r._g] || []).push(i); });
            const flaggedNonDup = [...sel].filter(i => !d.rows[i]._g);
            const missed = Object.values(groups).filter(g => g.filter(i => sel.has(i)).length === 0).length;
            const both = Object.values(groups).filter(g => g.filter(i => sel.has(i)).length === 2).length;
            if (!sel.size) return api.note('warn', 'Select at least one row first.');
            if (flaggedNonDup.length) return api.wrong('At least one flagged row is not an exact duplicate. Compare <b>every</b> column, including ID.');
            if (both) return api.wrong('You flagged both copies of a record — that would delete the student completely. Keep one copy.');
            if (missed) return api.wrong('Good flags so far, but at least one duplicate is still hiding in the table.');
            api.shared.m2 = Object.assign(api.shared.m2 || {}, { dupes: Object.keys(groups).length }); api.correct('Both duplicates found, and the look-alike student was correctly left alone.');
          } }, icon('flag'), 'Flag duplicates')));
        },
        explain: 'Real duplicates repeat the <b>whole record</b>, including the unique ID. A different ID with the same name is a different student, so the decoy row must be kept. Always check the key (ID) before deleting.',
        insight: { concept: 'Duplicate records', short: 'identical records inflate counts and bias averages.', text: 'Duplicates appear when data is merged or entered twice. De-duplicate using a unique key and compare all fields before deleting.', real: 'Hospitals de-duplicate patient records so one person does not receive two different medical histories.' }
      },
      /* ---------- C2 missing values (lab) ---------- */
      {
        id: 'm2c2', kind: 'practical', mechanic: 'Data lab + auditor', title: 'Missing values lab',
        story: 'The city must publish the class-average report today — but some marks are blank.',
        intro: 'A <b>missing value</b> is a field with no recorded data. You must choose how to handle it, because the choice changes the numbers the city publishes. Then an <b>auditor</b> compares your report with the real data.',
        objective: 'Phase 1: find the empty cells (click them). Phase 2: fix the missing <b>Marks</b> using the lab tools and publish a report the auditor accepts.',
        hints: ['Look for cells that show (empty). They can be in Age, Marks or Attendance.', 'Try every tool and watch the live class average and spread. Which fix invents scores nobody earned?'],
        setup(rng) {
          const full = DL.data.students(rng, 10, 301), rows = full.map(strip);
          const cells = []; const marksRows = rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 2); marksRows.forEach(i => cells.push([i, 'Marks']));
          const others = rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => marksRows.indexOf(i) < 0), 2); cells.push([others[0], 'Age'], [others[1], 'Attendance']);
          cells.forEach(([i, k]) => { rows[i][k] = ''; });
          return { rows, full, blanks: new Set(cells.map(c => c[0] + '|' + c[1])) };
        },
        render(root, d, api) {
          const flagged = new Set(); let t, stage = 1, tool = null;
          const partB = h('div'); let work = d.rows.map(r => Object.assign({}, r)), filled = new Set();
          t = C.table({ columns: COLS, rows: d.rows, label: 'Attendance register', cellClass: (i, k) => (flagged.has(i + '|' + k) ? 'flag' : ''), onCell: (i, k) => { if (stage !== 1) return; const key = i + '|' + k; flagged.has(key) ? flagged.delete(key) : flagged.add(key); t.refresh(); DL.sound.play('click'); } });
          root.appendChild(h('div', { class: 'panel-title', text: 'Phase 1 — find the empty cells' })); root.appendChild(t.el);
          const btnA = h('button', { class: 'btn primary', type: 'button', onclick: () => {
            const exact = flagged.size === d.blanks.size && [...flagged].every(k => d.blanks.has(k));
            if (!flagged.size) return api.note('warn', 'Click the empty cells to flag them first.');
            if ([...flagged].some(k => !d.blanks.has(k))) return api.wrong('One of your flagged cells actually contains a value. Only flag cells that show (empty).');
            if (!exact) return api.wrong('You found some, but at least one empty cell is still unflagged.');
            stage = 2; btnA.disabled = true; api.shared.m2 = Object.assign(api.shared.m2 || {}, { missing: d.blanks.size });
            api.stepOk('All ' + d.blanks.size + ' missing cells found. The Marks lab is now open.'); lab();
          } }, icon('search'), 'Scan: confirm missing cells');
          root.appendChild(h('div', { class: 'answer-row' }, btnA)); root.appendChild(partB);
          function lab() {
            const obs = d.rows.map(r => r.Marks).filter(v => v !== '').map(Number), fullMarks = d.full.map(r => +r.Marks);
            const panel = h('div'), tableBox = h('div');
            const nums = () => work.filter(r => r.Marks !== '').map(r => +r.Marks);
            function show() {
              const v = nums(), blanks = work.filter(r => r.Marks === '').length; let tt;
              tt = C.table({ columns: COLS, rows: work, label: 'Working register', cellClass: (i, k, r) => (k === 'Marks' && filled.has(r.ID) ? 'flag' : '') }); DL.ui.clear(tableBox).appendChild(tt.el);
              DL.ui.clear(panel).append(h('div', { class: 'kv' }, kv(st.round(st.mean(v), 1), 'Reported class average'), kv(st.round(stdev(v), 1), 'Reported spread (sd)'), kv(blanks, 'Marks still blank'), kv(work.length, 'Rows in report')));
            }
            const apply = id => {
              work = d.rows.map(r => Object.assign({}, r)); filled = new Set(); tool = id;
              const fillv = id === 'zero' ? 0 : id === 'mean' ? st.round(st.mean(obs), 0) : id === 'median' ? st.median(obs) : null;
              if (id === 'drop') work = work.filter(r => r.Marks !== ''); else if (fillv !== null) work.forEach(r => { if (r.Marks === '') { r.Marks = String(fillv); filled.add(r.ID); } });
              show(); DL.sound.play('click');
            };
            partB.appendChild(h('div', { class: 'panel-title', style: { marginTop: '16px' }, text: 'Phase 2 — Marks lab (try each tool; the live numbers change)' }));
            partB.appendChild(h('div', { class: 'tool-row' }, [['zero', 'Fill blanks with 0'], ['mean', 'Fill with mean'], ['median', 'Fill with median'], ['drop', 'Drop those rows'], ['none', 'Reset']].map(([id, l]) => h('button', { class: 'btn small', type: 'button', onclick: () => (id === 'none' ? (tool = null, work = d.rows.map(r => Object.assign({}, r)), filled = new Set(), show()) : apply(id)) }, l))));
            partB.appendChild(panel); partB.appendChild(tableBox);
            partB.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
              if (work.some(r => r.Marks === '')) return api.wrong('The auditor refuses a report with blank marks. Apply a fix first.');
              const v = nums(), avg = st.mean(v), sd = stdev(v), tAvg = st.mean(fullMarks), tSd = stdev(fullMarks);
              const zeroErr = Math.abs(tAvg - st.mean(d.rows.map(r => (r.Marks === '' ? 0 : +r.Marks)))), tol = Math.max(2.5, 0.75 * zeroErr); if (Math.abs(avg - tAvg) > tol) return api.wrong('AUDITOR REJECTED: you reported an average of <b>' + st.round(avg, 1) + '</b> (spread ' + st.round(sd, 1) + '), but the real data has average <b>' + st.round(tAvg, 1) + '</b> (spread ' + st.round(tSd, 1) + '). A blank mark is unknown, not zero.');
              api.correct('AUDITOR APPROVED: reported ' + st.round(avg, 1) + ' vs true ' + st.round(tAvg, 1) + '. Mean/median imputation or dropping a few rows keeps the report honest.');
            } }, icon('check'), 'Publish report to the city'))); show();
          }
        },
        explain: 'Filling blanks with 0 claims those students scored zero, so the average collapses and the spread explodes. <b>Mean/median imputation</b> keeps the average sensible, <b>dropping</b> works when few rows are affected, and <b>collecting the real value</b> from the source is best. The right choice depends on how much is missing and why.',
        insight: { concept: 'Missing values', short: 'handle blanks deliberately: collect, remove or impute — never assume zero.', text: 'Missing values can bias results. Options: collect the true value, remove the record (if justified), or <b>impute</b> with a statistic such as the mean or median.', real: 'Weather stations that lose a sensor reading fill short gaps from nearby readings instead of recording 0 °C.' }
      },
      /* ---------- C3 inconsistent ---------- */
      {
        id: 'm2c3', kind: 'practical', mechanic: 'Spreadsheet editing', title: 'Correct inconsistent data',
        story: 'Teachers typed marks in different formats.',
        intro: '<b>Inconsistent data</b> means the same kind of value written in different ways (for example "ninety" or "85%" in a column of plain numbers). Software cannot average text.',
        objective: 'Find the entries that are not plain numbers and replace them with the verified value from the paper register.',
        hints: ['Scan the Marks column: every cell should be a plain whole number.', 'Do not guess. Look up the student in the verified register on the right.'],
        setup(rng) {
          const names = rng.sample(DL.pools.NAMES, 7), truth = names.map(() => rng.int(55, 98));
          const [a, b] = rng.sample([0, 1, 2, 3, 4, 5, 6], 2);
          const raw = truth.map(String); raw[a] = DL.numberToWords(truth[a]); raw[b] = truth[b] + '%';
          return { names, truth, raw };
        },
        render(root, d, api) {
          const inputs = d.names.map((n, i) => h('input', { type: 'text', class: 'mono', value: d.raw[i], 'aria-label': 'Marks for ' + n, inputmode: 'text' }));
          const rows = d.names.map((n, i) => ({ Student: n, Marks: '' }));
          const t = C.table({ columns: [{ key: 'Student' }, { key: 'Marks', label: 'Marks (editable)' }], rows, label: 'Marks to correct', cellRender: (i, k, r) => (k === 'Marks' ? inputs[i] : r[k]) });
          const reg = C.table({ columns: [{ key: 'Student' }, { key: 'Marks', label: 'Verified marks' }], rows: d.names.map((n, i) => ({ Student: n, Marks: String(d.truth[i]) })), label: 'Verified paper register' });
          root.appendChild(h('div', { class: 'two-col' }, h('div', null, h('div', { class: 'panel-title', text: 'Corrupted marks sheet' }), t.el), h('div', null, h('div', { class: 'panel-title', text: 'Paper register (trusted source)' }), reg.el)));
          root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            const vals = inputs.map(i => i.value.trim()), notNum = vals.filter(v => !/^\d+$/.test(v)).length;
            const mismatched = vals.filter((v, i) => /^\d+$/.test(v) && +v !== d.truth[i]).length;
            inputs.forEach((inp, i) => { inp.style.borderColor = ''; });
            if (notNum) return api.wrong(notNum + ' entr' + (notNum > 1 ? 'ies are' : 'y is') + ' still not a plain number. Software cannot calculate with words or symbols.');
            if (mismatched) return api.wrong('All entries are numbers now, but ' + mismatched + ' value(s) do not match the verified register. Check them against the paper record.');
            api.shared.m2 = Object.assign(api.shared.m2 || {}, { inconsistent: d.raw.filter((v, i) => v !== String(d.truth[i])).length });
            api.correct('Marks are now consistent and match the register.');
          } }, icon('check'), 'Validate marks')));
        },
        explain: 'Data <b>validation</b> checks that values follow the expected format and range. You verified the intended value against a trusted source instead of guessing — guessing can silently introduce new errors.',
        insight: { concept: 'Data validation & consistent formats', short: 'all values in a column must share one format and be verified.', text: 'Validation rules (type, format, range) catch errors such as "ninety" in a numeric column. Fix them using a trusted source, not by guessing.', real: 'Online forms reject a phone number with letters in it — that is data validation at the point of entry.' }
      },
      /* ---------- C4 full repair ---------- */
      {
        id: 'm2c4', kind: 'practical', mechanic: 'Spreadsheet repair', title: 'Repair the dataset',
        story: 'This is the live education table. Fix it before the city uses it for official analysis.',
        intro: 'Now combine everything. The table contains duplicates, an unusable record, missing cells and invalid values. A paper archive can fix some problems; for others you must decide.',
        objective: 'Remove duplicate/unusable rows, fix missing and invalid cells, leave good data untouched, then submit. You have 3 submissions.',
        instructions: 'Tick a row and press <b>Remove selected rows</b> to delete it. Edit any cell directly. Valid ranges: Age 15–60, Marks 0–100, Attendance 0–100.',
        hints: ['Archive entries give true values for some IDs. If the archive has nothing for a missing number, impute using the column statistics shown below the table.', 'A row with only an ID and no other data cannot be repaired — remove it. Do not change cells that are already correct.'],
        setup(rng) {
          const base = DL.data.students(rng, 12, 201).map((r, i) => Object.assign(r, { _u: 'u' + i }));
          const clean = {}; base.forEach(r => { clean[r._u] = strip(r); });
          const idx = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
          const [dupA, dupB, emp, missM, missA, invM, invA] = idx;
          const rows = base.map(r => Object.assign({}, r));
          const archive = [];
          ['Name', 'Age', 'Marks', 'Attendance'].forEach(k => { rows[emp][k] = ''; }); archive.push('ID ' + rows[emp].ID + ' — no record found in archive');
          rows[missM].Marks = ''; archive.push('ID ' + rows[missM].ID + ' — Marks: ' + clean[rows[missM]._u].Marks);
          rows[missA].Attendance = ''; archive.push('ID ' + rows[missA].ID + ' — Attendance: not found in archive');
          rows[invM].Marks = String(+clean[rows[invM]._u].Marks * 10); archive.push('ID ' + rows[invM].ID + ' — Marks: ' + clean[rows[invM]._u].Marks);
          rows[invA].Age = '-' + clean[rows[invA]._u].Age; archive.push('ID ' + rows[invA].ID + ' — Age: ' + clean[rows[invA]._u].Age);
          rows[dupA]._g = 'g1'; rows[dupB]._g = 'g2';
          const work = rows.slice();
          [[dupA, 'g1'], [dupB, 'g2']].forEach(([s, g]) => { const at = rng.int(work.findIndex(r => r._u === rows[s]._u) + 1, work.length); work.splice(at, 0, Object.assign({}, rows[s], { _u: rows[s]._u + '_c', _g: g })); });
          const validAtt = base.filter((r, i) => i !== missA).map(r => +r.Attendance);
          return { work, clean, archive: rng.shuffle(archive), uid: { emp: rows[emp]._u, missM: rows[missM]._u, missA: rows[missA]._u, invM: rows[invM]._u, invA: rows[invA]._u }, attMean: st.mean(validAtt), attMed: st.median(validAtt), baseCount: base.length };
        },
        render(root, d, api) {
          const original = JSON.parse(JSON.stringify(d.work)); let work = d.work, selected = new Set(), attempts = 0, bestAcc = 0, t;
          const U = d.uid, TOTAL = 7;
          const statBox = h('div', { class: 'callout' });
          function stats() {
            const alive = work.filter(r => !r._del), nums = (k, lo, hi) => alive.map(r => r[k]).filter(v => /^\d+$/.test(String(v).trim()) && +v >= lo && +v <= hi).map(Number);
            const m = nums('Marks', 0, 100), a = nums('Attendance', 0, 100);
            DL.ui.clear(statBox).append(h('div', { class: 'panel-title', text: 'Column statistics (valid values only)' }), h('div', { class: 'kv' }, kv(m.length ? st.round(st.mean(m), 1) : '–', 'Marks mean'), kv(m.length ? st.median(m) : '–', 'Marks median'), kv(a.length ? st.round(st.mean(a), 1) : '–', 'Attendance mean'), kv(a.length ? st.median(a) : '–', 'Attendance median')));
          }
          function mk() {
            t = C.table({ columns: COLS, rows: work.map(r => (r._del ? null : r)), label: 'Dataset to repair', lead: { label: 'Select', render: (i, r) => h('input', { type: 'checkbox', checked: selected.has(r._u) ? true : null, 'aria-label': 'Select row with ID ' + r.ID, onchange: e => { e.target.checked ? selected.add(r._u) : selected.delete(r._u); } }) },
              cellRender: (i, k, r) => { const inp = h('input', { type: 'text', class: 'mono', value: r[k], 'aria-label': k + ' for row ID ' + r.ID }); inp.addEventListener('input', () => { r[k] = inp.value; stats(); }); return inp; } });
            DL.ui.clear(holder).appendChild(t.el);
          }
          const holder = h('div');
          root.appendChild(h('div', { class: 'callout' }, h('div', { class: 'panel-title', text: 'Paper archive lookups' }), h('ul', { style: { margin: 0, paddingLeft: '18px' }, class: 'mono' }, d.archive.map(a => h('li', { text: a })))));
          root.appendChild(h('div', { class: 'panel-title', style: { marginTop: '12px' }, text: 'Working dataset' })); root.appendChild(holder); mk();
          const progress = h('div', { class: 'muted mono', role: 'status', text: 'Submissions used: 0 / 3' });
          root.appendChild(h('div', { class: 'answer-row' },
            h('button', { class: 'btn', type: 'button', onclick: () => { work.forEach(r => { if (selected.has(r._u)) r._del = true; }); selected = new Set(); mk(); stats(); DL.sound.play('click'); } }, icon('x'), 'Remove selected rows'),
            h('button', { class: 'btn ghost', type: 'button', onclick: () => { work = JSON.parse(JSON.stringify(original)); selected = new Set(); mk(); stats(); } }, icon('reset'), 'Undo all changes'),
            h('button', { class: 'btn primary', type: 'button', onclick: submit }, icon('check'), 'Submit cleaned dataset')));
          root.appendChild(statBox); root.appendChild(progress); stats();

          function evaluate() {
            const alive = work.filter(r => !r._del); let fixed = 0, coll = 0; const rem = { duplicates: 0, missing: 0, invalid: 0 };
            ['g1', 'g2'].forEach(g => { const n = alive.filter(r => r._g === g).length; if (n === 1) fixed++; else { rem.duplicates++; if (n === 0) coll++; } });
            if (!alive.some(r => r._u === U.emp)) fixed++; else rem.duplicates++;
            work.forEach(r => { if (r._del && !r._g && r._u !== U.emp) coll++; });
            alive.forEach(r => {
              const base = r._u.replace('_c', ''); if (r._u === U.emp) return; const cl = d.clean[base];
              FIELDS.forEach(k => {
                const v = String(r[k]).trim();
                if (r._u === U.missM && k === 'Marks') { if (v === cl.Marks) fixed++; else rem.missing++; }
                else if (r._u === U.invM && k === 'Marks') { if (v === cl.Marks) fixed++; else rem.invalid++; }
                else if (r._u === U.invA && k === 'Age') { if (v === cl.Age) fixed++; else rem.invalid++; }
                else if (r._u === U.missA && k === 'Attendance') { const n = /^\d+$/.test(v) ? +v : NaN; if (!isNaN(n) && n >= 0 && n <= 100 && (Math.abs(n - d.attMean) <= 2 || Math.abs(n - d.attMed) <= 2)) fixed++; else rem.missing++; }
                else if (v !== cl[k]) coll++;
              });
            });
            return { fixed, coll, rem, acc: Math.max(0, fixed - coll) / TOTAL };
          }
          function diffView(res) {
            const cleanedRows = work.filter(r => !r._del);
            return h('div', { style: { marginTop: '12px' } }, h('div', { class: 'panel-title', text: 'Original vs cleaned' }), h('div', { class: 'two-col' },
              h('div', null, h('small', { class: 'muted', text: 'Original (' + original.length + ' rows)' }), C.table({ columns: COLS, rows: original, label: 'Original dataset' }).el),
              h('div', null, h('small', { class: 'muted', text: 'Cleaned (' + cleanedRows.length + ' rows)' }), C.table({ columns: COLS, rows: cleanedRows, label: 'Cleaned dataset' }).el)));
          }
          function submit() {
            attempts++; const r = evaluate(); bestAcc = Math.max(bestAcc, r.acc); progress.textContent = 'Submissions used: ' + attempts + ' / 3';
            const finish = (full) => { api.shared.m2 = Object.assign(api.shared.m2 || {}, { fixed: r.fixed, total: TOTAL, acc: Math.round(r.acc * 100) });
              api.correct(full ? 'Dataset fully repaired — 7 of 7 problems fixed with no collateral damage.' : 'Maximum submissions reached. Final repair accuracy: ' + Math.round(bestAcc * 100) + '%.', { factor: full ? 1 : bestAcc, explainExtra: diffView(r) }); };
            if (r.acc === 1) return finish(true);
            const msg = r.fixed + ' of ' + TOTAL + ' problems fixed' + (r.coll ? ', but ' + r.coll + ' good cell(s)/row(s) were changed or deleted by mistake' : '') + '. Still unresolved — duplicates/unusable rows: ' + r.rem.duplicates + ', missing values: ' + r.rem.missing + ', invalid values: ' + r.rem.invalid + '.';
            if (attempts >= 3) { api.note('warn', msg); return finish(false); }
            api.wrong(msg);
          }
        },
        explain: 'You applied the whole cleaning pipeline: <b>de-duplicate</b>, <b>remove unusable rows</b>, <b>collect</b> missing values from a source, <b>impute</b> when no source exists, and <b>validate ranges</b>. Good cleaning also avoids changing correct data.',
        insight: { concept: 'Data cleaning', short: 'detect and correct inaccurate, incomplete, duplicated or inconsistent data.', text: 'Data cleaning is the process of detecting and correcting inaccurate, incomplete, duplicated, or inconsistent data. It typically takes more time than modelling itself.', real: 'Hospitals clean patient records before analysing health information to improve data quality and reduce errors.' }
      }
    ]
  });
  function kv(v, l) { return h('div', null, h('b', { text: String(v) }), h('span', { text: l })); }
})(window.DL);
