/* MISSION 1 — THE MISSING RECORDS: data types, discrete/continuous, structured/unstructured (arcade levels) + schema import lab. */
window.DL = window.DL || {}; DL.missions = DL.missions || [];
(function (DL) {
  'use strict';
  const { h, icon } = DL.ui, P = DL.pools;
  const TYPE_OPTS = [{ id: 'num-d', label: 'Numerical · discrete' }, { id: 'num-c', label: 'Numerical · continuous' }, { id: 'cat', label: 'Categorical' }, { id: 'bool', label: 'Boolean' }, { id: 'text', label: 'Text' }];
  const TYPE_NAME = { 'num-d': 'integer', 'num-c': 'decimal', cat: 'category', bool: 'boolean', text: 'text' };

  const FIELDS = [
    { n: 'Age', bin: 'numerical', v: r => r.int(18, 60), why: 'Age is a number you can do arithmetic on → Numerical.' },
    { n: 'Temperature', bin: 'numerical', v: r => r.float(26, 38, 1).toFixed(1), why: 'A measured quantity you can average → Numerical.' },
    { n: 'MonthlyBill', bin: 'numerical', v: r => r.float(300, 2400, 2), why: 'Money amounts are numbers → Numerical.' },
    { n: 'City', bin: 'categorical', v: r => r.pick(P.CITIES), why: 'City comes from a limited set of repeating labels (groups) → Categorical.' },
    { n: 'BloodGroup', bin: 'categorical', v: r => r.pick(['A+', 'B+', 'O+', 'AB-']), why: 'A fixed set of named groups → Categorical.' },
    { n: 'Department', bin: 'categorical', v: r => r.pick(['Health', 'Transport', 'Water', 'Power']), why: 'Named groups that repeat → Categorical.' },
    { n: 'IsRegistered', bin: 'boolean', v: r => r.pick(['TRUE', 'FALSE']), why: 'Only two possible values, TRUE/FALSE → Boolean.' },
    { n: 'HasVoted', bin: 'boolean', v: r => r.pick(['TRUE', 'FALSE']), why: 'Yes/no state → Boolean.' },
    { n: 'StudentName', bin: 'text', v: r => r.pick(P.NAMES), why: 'A name is free-form and almost unique to each person → Text (an identifier, not a group).' },
    { n: 'ComplaintNote', bin: 'text', v: r => '"' + r.pick(['Street light broken', 'Water supply cut', 'Pothole near school']) + '"', why: 'Free-form sentences → Text.' }
  ];
  const DISCRETE = [['Number of students in a classroom', 'd'], ['Height of a student', 'c'], ['Number of vehicles', 'd'], ['Temperature', 'c'], ['Goals scored in a match', 'd'], ['Books in the library', 'd'], ['Time to run 100 m', 'c'], ['Rainfall in a day', 'c'], ['Weight of a parcel', 'c'], ['Siblings a student has', 'd'], ['Phone calls received today', 'd'], ['Distance travelled to work', 'c']];
  const STRUCT = [['Spreadsheet records', 's'], ['Photographs', 'u'], ['Audio recordings', 'u'], ['Database tables', 's'], ['Written reports', 'u'], ['Bank transaction table', 's'], ['CCTV video footage', 'u'], ['CSV of sensor readings', 's'], ['Social-media posts', 'u'], ['Student marks sheet', 's'], ['Voice-mail messages', 'u'], ['Inventory table', 's']];

  DL.missions.push({
    id: 'm1', number: 1, icon: 'database', title: 'The Missing Records', difficulty: 'Beginner', concept: 'Data types & representation',
    description: 'Recovered records are flooding the intake belt. Route them fast and rebuild the resident database.',
    closing: 'You rebuilt the resident database by routing and typing every field. Knowing <b>what kind of data you hold</b> decides which statistics, charts and models are valid later on.',
    report() {
      return h('div', { class: 'callout' }, h('div', { class: 'panel-title', text: 'What you restored' }),
        h('ul', null, h('li', { text: 'Numerical (discrete counts, continuous measurements), categorical, boolean and text data.' }), h('li', { text: 'Structured data (rows/columns) versus unstructured data (images, audio, reports).' }), h('li', { text: 'A typed schema that survives an import test.' })));
    },
    challenges: [
      {
        id: 'm1c1', kind: 'standard', mechanic: 'Arcade: sorting conveyor', title: 'Level 1 — Data type conveyor',
        story: 'Records from the breach are arriving faster than the team can label them.',
        intro: 'Every field holds a <b>type</b> of data: Numerical, Categorical, Boolean or Text. Route each field to the right bin. Each decision explains itself in the ticker — learn the rules as you play.',
        objective: 'Route <b>12 fields</b> correctly before System Integrity runs out. Use the bins or keys 1–4.',
        hints: ['Ask: can I do maths with it? Is it one of a small set of repeating labels? Only two values? Or free words?', 'Names and notes are Text; City and BloodGroup are Categorical (groups).'],
        render(root, d, api) {
          let last = -1;
          DL.arcade.conveyor(root, { title: 'Data type conveyor', brief: 'Fields slide down the belt. Send the <b>lowest</b> one to its data type. You have 3 integrity points.', goal: 12, fall: 10000, minFall: 5200,
            bins: [{ id: 'numerical', label: 'Numerical', desc: 'maths works' }, { id: 'categorical', label: 'Categorical', desc: 'repeating groups' }, { id: 'boolean', label: 'Boolean', desc: 'TRUE / FALSE' }, { id: 'text', label: 'Text', desc: 'free words' }],
            next(rng, i) { let k; do { k = rng.int(0, FIELDS.length - 1); } while (k === last); last = k; const f = FIELDS[k]; return { label: f.n + ': ' + f.v(rng), bin: f.bin, why: f.why }; } }, api);
        },
        explain: '<b>Numerical</b> values are measured or counted, so arithmetic makes sense. <b>Categorical</b> values come from a limited set of groups that repeat. <b>Boolean</b> has only two states. <b>Text</b> is free-form (a name is an identifier, not a group).',
        insight: { concept: 'Data types', short: 'numerical, categorical, boolean and text data behave differently.', text: 'A data type tells software and analysts how a value may be used. You can average numerical data, count categories, test booleans, and search text.', real: 'Hospitals store age (numerical), blood group (categorical), insured (boolean) and doctor notes (text) differently so each can be analysed correctly.' }
      },
      {
        id: 'm1c2', kind: 'standard', mechanic: 'Arcade: sorting conveyor', title: 'Level 2 — Count or measure?',
        story: 'The sensor room mixes counts and measurements.',
        intro: '<b>Discrete</b> data is counted in whole units. <b>Continuous</b> data is measured and can take any value in a range (including decimals). The belt is faster now.',
        objective: 'Route <b>10 examples</b> correctly.',
        hints: ['Can the value be 2.5 of something? If you cannot have half of it, it is counted (discrete).', 'Things measured with an instrument (ruler, thermometer, clock) are continuous.'],
        render(root, d, api) {
          const why = { d: ' is counted in whole units → Discrete.', c: ' is measured and can take any value in a range → Continuous.' };
          DL.arcade.conveyor(root, { title: 'Count or measure?', brief: 'Send counted things to <b>Discrete</b> and measured things to <b>Continuous</b>.', goal: 10, fall: 8500, minFall: 4800,
            bins: [{ id: 'd', label: 'Discrete', desc: 'counted' }, { id: 'c', label: 'Continuous', desc: 'measured' }],
            next(rng) { const x = rng.pick(DISCRETE); return { label: x[0], bin: x[1], why: x[0] + why[x[1]] }; } }, api);
        },
        explain: 'Counts (students, vehicles, goals) are <b>discrete</b>: there is no 2.5 vehicles. Measurements (height, temperature, time) are <b>continuous</b>: between 170 cm and 171 cm there are infinitely many possible heights.',
        insight: { concept: 'Discrete vs continuous data', short: 'counts are discrete; measurements are continuous.', text: 'Discrete data is counted; continuous data is measured. The distinction guides which chart (bar vs histogram) and statistics you use.', real: 'A traffic department counts vehicles (discrete) but records their speed (continuous).' }
      },
      {
        id: 'm1c3', kind: 'standard', mechanic: 'Arcade: sorting conveyor', title: 'Level 3 — Structured or unstructured?',
        story: 'Recovered files are piling up in the evidence room.',
        intro: '<b>Structured</b> data fits rows and columns with a fixed schema. <b>Unstructured</b> data (images, sound, free text) has no predefined table layout and needs extra processing before analysis.',
        objective: 'Route <b>10 files</b> correctly. Combo streaks speed up the belt!',
        hints: ['Could you open it in a spreadsheet and sort by a column? Then it is structured.', 'Pictures, sounds and free-flowing documents have no rows and columns by themselves.'],
        render(root, d, api) {
          const why = { s: ' has a fixed row/column schema → Structured.', u: ' has no fixed table layout; it must be processed first → Unstructured.' };
          DL.arcade.conveyor(root, { title: 'Evidence room', brief: 'Sort each file as <b>Structured</b> or <b>Unstructured</b>.', goal: 10, fall: 8000, minFall: 4500,
            bins: [{ id: 's', label: 'Structured', desc: 'rows & columns' }, { id: 'u', label: 'Unstructured', desc: 'free form' }],
            next(rng) { const x = rng.pick(STRUCT); return { label: x[0], bin: x[1], why: x[0] + why[x[1]] }; } }, api);
        },
        explain: 'Spreadsheets and database tables are <b>structured</b>. Photos, audio and written reports hold information in a free form; to analyse them you first extract features (words, pixels, sound patterns).',
        insight: { concept: 'Structured vs unstructured data', short: 'structured data has a fixed row/column schema; unstructured does not.', text: 'Most of the world\'s data is unstructured. It must be converted (text → word counts, images → pixel features) before classic analysis.', real: 'Banks analyse transaction tables directly but need text-mining for customer emails.' }
      },
      {
        id: 'm1c4', kind: 'practical', mechanic: 'Import test lab', title: 'Level 4 — Rebuild the database',
        story: 'The recovered table has lost its schema. The database import will test every column you define.',
        intro: 'A dataset is a table: each <b>row</b> is a record and each <b>column</b> is a field with one type. Choose a type per column and press <b>Run import test</b>. The database tries to load the real values and reports what breaks.',
        objective: 'Pass the import test with <b>every column green</b>. Experiment freely — failed imports cost nothing, but read the reports!',
        hints: ['Each failed column tells you why it failed. Use that to choose a better type.', 'Whole-number counts are discrete; measurements with decimals are continuous.'],
        setup(rng) {
          const n = 5, names = rng.sample(P.NAMES, n);
          const fixed = [{ key: 'Name', type: 'text', gen: i => names[i] }, { key: 'Age', type: 'num-d', gen: () => rng.int(19, 70) }, { key: 'District', type: 'cat', gen: () => rng.pick(P.DISTRICTS) }, { key: 'Registered', type: 'bool', gen: () => rng.pick(['TRUE', 'FALSE']) }];
          const extra = rng.sample([{ key: 'Height_cm', type: 'num-c', gen: () => rng.float(150, 190, 1).toFixed(1) }, { key: 'Monthly_Bill', type: 'num-c', gen: () => rng.float(300, 2400, 2).toFixed(2) }, { key: 'Children', type: 'num-d', gen: () => rng.int(0, 4) }, { key: 'BloodGroup', type: 'cat', gen: () => rng.pick(['A+', 'B+', 'O+', 'AB+']) }], 2);
          const cols = rng.shuffle(fixed.concat(extra));
          return { cols, rows: Array.from({ length: n }, (_, i) => { const o = {}; cols.forEach(c => { o[c.key] = String(c.gen(i)); }); return o; }) };
        },
        render(root, d, api) {
          root.appendChild(DL.comp.table({ columns: d.cols.map(c => ({ key: c.key })), rows: d.rows, label: 'Recovered resident records' }).el);
          const choice = {}, out = h('div'), isNum = v => /^-?\d+(\.\d+)?$/.test(v), isInt = v => /^-?\d+$/.test(v);
          const list = h('div', { class: 'row-opts', style: { marginTop: '12px' } }, d.cols.map(c => h('div', { class: 'orow' }, h('div', { class: 'lbl' }, c.key, h('small', { text: 'e.g. ' + d.rows.slice(0, 3).map(r => r[c.key]).join(', ') })),
            h('select', { 'aria-label': 'Type of ' + c.key, onchange: e => { choice[c.key] = e.target.value; } }, h('option', { value: '', text: 'Choose type…' }), TYPE_OPTS.map(o => h('option', { value: o.id, text: o.label }))))));
          function test(c, t) {
            const vals = d.rows.map(r => r[c.key]), truth = c.type, num = x => x === 'num-d' || x === 'num-c';
            if (!t) return { s: 'warn', m: 'No type chosen — the database refuses columns without a type.' };
            if (t === truth) return { s: 'ok', m: 'Imported ' + vals.length + ' values as ' + TYPE_NAME[t] + '.' };
            if (num(t) && !num(truth)) { const bad = vals.find(v => !isNum(v)); return { s: 'err', m: 'Import failed: "' + bad + '" is not a number.' }; }
            if (t === 'num-d' && truth === 'num-c') { const bad = vals.find(v => !isInt(v)); return { s: 'err', m: 'Import failed: "' + bad + '" has decimals, so it cannot be a whole-number count.' }; }
            if (t === 'num-c' && truth === 'num-d') return { s: 'warn', m: 'Imported, but every value is a whole count (' + vals.slice(0, 3).join(', ') + '…). Counted data is discrete.' };
            if (t === 'bool' && truth !== 'bool') return { s: 'err', m: 'Import failed: "' + vals[0] + '" is not TRUE/FALSE.' };
            if (truth === 'bool') return { s: 'warn', m: 'Imported, but only TRUE/FALSE appear — that is a Boolean, which allows logical tests.' };
            if (num(truth)) return { s: 'warn', m: 'Stored as words: AVERAGE(' + c.key + ') fails and sorting treats "100" before "25".' };
            if (truth === 'cat' && t === 'text') return { s: 'warn', m: 'Values repeat — it is a group. As Categorical you can count rows per group.' };
            if (truth === 'text' && t === 'cat') return { s: 'warn', m: 'Almost every value is unique — it cannot form groups. That is free Text.' };
            return { s: 'warn', m: 'Type does not match the data.' };
          }
          root.appendChild(list); root.appendChild(h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
            const res = d.cols.map(c => test(c, choice[c.key])); DL.ui.clear(out);
            out.appendChild(h('div', { class: 'panel-title', text: 'Import report' })); res.forEach((r, i) => out.appendChild(h('div', { class: 'feedback ' + (r.s === 'ok' ? 'ok' : r.s === 'err' ? 'bad' : 'warn') }, icon(r.s === 'ok' ? 'check' : r.s === 'err' ? 'x' : 'alert'), h('div', null, h('b', { text: d.cols[i].key + ': ' }), r.m))));
            const ok = res.every(r => r.s === 'ok'); DL.sound.play(ok ? 'correct' : 'wrong');
            if (ok) api.correct('Import successful — the database is restored.', { explainExtra: h('pre', { class: 'formula' }, 'TABLE Residents (\n' + d.cols.map(c => '  ' + c.key + ': ' + TYPE_NAME[c.type]).join(',\n') + '\n)') });
            else api.note('warn', res.filter(r => r.s !== 'ok').length + ' column(s) still need work. Read the report and adjust.');
          } }, icon('database'), 'Run import test'))); root.appendChild(out);
        },
        explain: 'Each column holds <b>one</b> type of data. Names are text, District is categorical, Registered is boolean, counts are discrete numbers and measurements are continuous numbers. A wrong type breaks calculations later.',
        insight: { concept: 'Data representation (rows, columns, schema)', short: 'a dataset is a table of records and typed fields.', text: 'A <b>record</b> is one row; a <b>field</b> is one column. A <b>schema</b> lists every field and its type so data can be stored and validated.', real: 'When a company imports a CSV into a database it first defines the schema — otherwise numbers get stored as text and calculations fail.' }
      }
    ]
  });
})(window.DL);
