const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.route('**/*', r => (r.request().url().startsWith('http://localhost') ? r.continue() : r.abort()));
  const url = 'http://localhost:8765/index.html';
  const load = async () => { await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(300); await page.addScriptTag({ path: 'solvers.js' }); };
  const log = (...a) => console.log(...a);
  await load();
  await page.fill('#player-name', 'Tester'); await page.click('#btn-start'); await page.waitForTimeout(300); await page.click('.intro-overlay .skip'); await page.waitForTimeout(300);

  // ---- scoring + persistence checks on M1C1 (arcade level)
  await page.evaluate(() => DL.engine.startMission('m1', true));
  await page.waitForTimeout(200);
  const sc = () => page.evaluate(() => DL.state.get().progress.m1 && DL.state.get().progress.m1.score);
  await page.click('#arcade-go'); await page.waitForTimeout(200);
  // wrong routing: send front item to a wrong bin -> -10 floor at 0? (score starts 0; wrong counter must increment)
  await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.__arcade); const A = el.__arcade; const f = A.front(); const bins = [...document.querySelectorAll('.bin')].map(b => b.dataset.bin).filter(Boolean); const wrong = bins.find(x => x !== f.bin); A.press(wrong); });
  await page.waitForTimeout(100);
  log('arcade wrong routing: integrity lost, score floor (expect >=0):', await sc(), 'run wrong counter:', await page.evaluate(() => DL.state.get().progress.m1.wrong));
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Need a hint')).click());
  log('hints (expect 1):', await page.evaluate(() => DL.state.get().progress.m1.hints));
  await load(); log('after reload status m1:', await page.evaluate(() => DL.state.status('m1')), 'run hints:', await page.evaluate(() => DL.state.get().progress.m1.hints));
  await page.evaluate(() => DL.engine.startMission('m1', false)); await page.waitForTimeout(200);
  log('resumed hint level persisted:', await page.evaluate(() => DL.state.get().progress.m1.hintLevel.m1c1));

  async function playMission(mid) {
    if (mid !== 'm1' || true) await page.evaluate(id => { const s = DL.state.get().progress[id]; if (!s) DL.engine.startMission(id, false); }, mid);
    await page.waitForTimeout(150);
    const n = await page.evaluate(id => DL.getMission(id).challenges.length, mid);
    for (let k = 0; k < n; k++) {
      const r = await page.evaluate(id => window.__solveCurrent(id), mid);
      if (!r.solved) { log('  !! NOT SOLVED', r); await page.screenshot({ path: 'fail_' + r.id + '.png', fullPage: true }); return false; }
      log('  solved', r.id, 'delta', r.scoreDelta);
      await page.evaluate(() => window.__next()); await page.waitForTimeout(200);
    }
    return true;
  }
  for (const mid of ['m1', 'm2', 'm3', 'm4', 'm5', 'final']) {
    log('=== playing', mid);
    const ok = await playMission(mid); if (!ok) break;
    if (mid !== 'final') { await page.screenshot({ path: 'report_' + mid + '.png' }); await page.evaluate(() => { DL.dashboard.render(); DL.nav.show('dashboard'); }); }
    log('  totalXP', await page.evaluate(() => DL.state.totalXP()), 'statuses', await page.evaluate(() => DL.state.MISSION_IDS.map(i => DL.state.status(i)).join(',')));
  }
  await page.screenshot({ path: 'victory.png', fullPage: true });
  log('final done:', await page.evaluate(() => DL.state.get().final.done), 'achievements:', await page.evaluate(() => Object.keys(DL.state.get().achievements).join(',')));
  const xp1 = await page.evaluate(() => DL.state.totalXP());
  // reload: persisted
  await load(); log('after reload XP', await page.evaluate(() => DL.state.totalXP()), 'victory? dashboard visible:', await page.isVisible('#screen-dashboard'));
  // replay M1 -> no double bonus
  await page.evaluate(() => DL.engine.startMission('m1', true)); await playMission('m1');
  log('XP before replay', xp1, 'after replay', await page.evaluate(() => DL.state.totalXP()), '(must not exceed max)', await page.evaluate(() => DL.scoring.maxTotal()));
  // corrupted storage
  await page.evaluate(() => localStorage.setItem('dataLockdown.save.v1', '{"player":{"name":"<b>x"},"missions":{"m1":{"completed":"yes","best":"NaN"}},"progress":5'));
  await load(); log('corrupt save -> welcome visible:', await page.isVisible('#screen-welcome'));
  await page.evaluate(() => localStorage.setItem('dataLockdown.save.v1', JSON.stringify({ player: { name: '<script>alert(1)</script>A' }, missions: { m1: { completed: true, best: 300 }, m3: { completed: true, best: 9 } }, progress: { m2: { done: 'bad' } } })));
  await load(); log('sanitized state:', await page.evaluate(() => JSON.stringify({ n: DL.state.get().player.name, u: DL.state.get().unlocked, xp: DL.state.totalXP() })));
  // reset
  await page.evaluate(() => DL.state.reset()); log('after reset XP', await page.evaluate(() => DL.state.totalXP()));
  console.log('ERRORS:', JSON.stringify(errs, null, 1));
  await b.close();
})();
