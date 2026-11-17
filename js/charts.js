/* Chart wrapper. Uses Chart.js when it is loaded; otherwise falls back to a small built-in canvas renderer
   (bar / line / scatter / pie) so the game still works without internet access.
   spec = { type:'bar'|'line'|'scatter'|'pie', labels:[], datasets:[{label, data, colors?, color?, line?:bool, radius?}],
            title, xTitle, yTitle, yMin, yMax, yLog, legend, onClick(datasetIndex, index), barGap:boolean } */
window.DL = window.DL || {};
(function (DL) {
  'use strict';
  const PAL = ['#50E3E6', '#6B8CFF', '#A78BFA', '#5CE1A3', '#FFCA70', '#FF7185'];
  const GRID = '#263B57', TXT = '#8DA2BD';
  DL.chartPalette = PAL;

  function niceTicks(min, max, n) {
    if (min === max) { max = min + 1; }
    const span = max - min, step0 = span / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag, step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
    for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }

  /* ---------------- fallback renderer ---------------- */
  function mini(canvas, spec) {
    const ctx = canvas.getContext('2d'); let hits = [], alive = true, S = spec;
    function color(ds, i) { return (ds.colors && ds.colors[i]) || ds.color || PAL[i % PAL.length]; }
    function draw() {
      if (!alive) return;
      const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 600, h = canvas.clientHeight || 280;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h); hits = [];
      ctx.font = '12px DM Mono, monospace'; ctx.fillStyle = TXT; ctx.strokeStyle = GRID; ctx.textBaseline = 'middle';
      if (S.title) { ctx.fillStyle = '#EDF5FF'; ctx.textAlign = 'center'; ctx.font = '600 14px Space Grotesk, sans-serif'; ctx.fillText(S.title, w / 2, 14); ctx.font = '12px DM Mono, monospace'; }
      if (S.type === 'pie') return drawPie(w, h);
      const pad = { l: 54, r: 14, t: S.title ? 32 : 12, b: S.xTitle ? 52 : 34 };
      if (S.datasets.length > 1 && S.legend !== false) pad.t += 16;
      const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      const isXY = S.type === 'scatter';
      let xs = [], ys = [];
      S.datasets.forEach(ds => ds.data.forEach((d, i) => { if (isXY) { xs.push(d.x); ys.push(d.y); } else ys.push(d); }));
      let yMin = S.yMin != null ? S.yMin : Math.min(0, Math.min.apply(null, ys)), yMax = S.yMax != null ? S.yMax : Math.max.apply(null, ys);
      if (S.type === 'line' && S.yMin == null) yMin = Math.min.apply(null, ys) - (Math.max.apply(null, ys) - Math.min.apply(null, ys)) * .1;
      if (isXY && S.yMin == null) yMin = Math.min.apply(null, ys) - (Math.max.apply(null, ys) - Math.min.apply(null, ys)) * .1;
      const log = !!S.yLog; if (log) { yMin = Math.max(1, S.yMin || 1); }
      const yt = log ? [1, 10, 100, 1000, 10000, 100000].filter(v => v <= Math.max(yMax, 10) * 10) : niceTicks(yMin, yMax, 5);
      if (!log) { yMin = S.yMin != null ? S.yMin : yt[0]; yMax = S.yMax != null ? S.yMax : yt[yt.length - 1]; } else { yMax = yt[yt.length - 1]; }
      const fy = v => { const t = log ? (Math.log10(Math.max(v, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) : (v - yMin) / ((yMax - yMin) || 1); return pad.t + ph - t * ph; };
      // y axis
      ctx.textAlign = 'right';
      yt.forEach(v => { if (v < yMin - 1e-9 || v > yMax + 1e-9) return; const y = fy(v); ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); ctx.fillStyle = TXT; ctx.fillText(String(+v.toFixed(2)), pad.l - 6, y); });
      let fx, xt = [];
      if (isXY) {
        let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs); xt = niceTicks(x0, x1, 6); x0 = xt[0]; x1 = xt[xt.length - 1];
        fx = v => pad.l + (v - x0) / ((x1 - x0) || 1) * pw;
        ctx.textAlign = 'center'; xt.forEach(v => { ctx.fillStyle = TXT; ctx.fillText(String(+v.toFixed(2)), fx(v), pad.t + ph + 14); });
      } else {
        const n = S.labels.length, bw = pw / n; fx = i => pad.l + bw * (i + .5);
        ctx.textAlign = 'center'; const every = Math.ceil(n / Math.max(1, Math.floor(pw / 46)));
        S.labels.forEach((l, i) => { if (i % every === 0) { ctx.fillStyle = TXT; ctx.fillText(String(l).slice(0, 10), fx(i), pad.t + ph + 14); } });
      }
      ctx.strokeStyle = '#3a5578'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(w - pad.r, pad.t + ph); ctx.stroke();
      if (S.xTitle) { ctx.fillStyle = TXT; ctx.textAlign = 'center'; ctx.fillText(S.xTitle, pad.l + pw / 2, h - 10); }
      if (S.yTitle) { ctx.save(); ctx.translate(12, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = TXT; ctx.fillText(S.yTitle, 0, 0); ctx.restore(); }
      const nds = S.datasets.length;
      S.datasets.forEach((ds, di) => {
        if (S.type === 'bar') {
          const n = S.labels.length, slot = pw / n, gap = S.barGap === false ? 0 : slot * .2, bw = (slot - gap) / nds;
          ds.data.forEach((v, i) => { const x = pad.l + slot * i + gap / 2 + bw * di, y = fy(v), base = fy(yMin); ctx.fillStyle = color(ds, i); ctx.fillRect(x, y, bw, base - y); hits.push({ k: 'r', x, y, w: bw, h: base - y, di, i }); });
        } else if (S.type === 'line') {
          ctx.strokeStyle = color(ds, di); ctx.lineWidth = 2; ctx.beginPath(); ds.data.forEach((v, i) => { const x = fx(i), y = fy(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.lineWidth = 1;
          ds.data.forEach((v, i) => { const x = fx(i), y = fy(v); ctx.fillStyle = color(ds, di); ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); hits.push({ k: 'c', x, y, r: 12, di, i }); });
        } else { // scatter
          if (ds.line) { ctx.strokeStyle = ds.color || PAL[4]; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.beginPath(); ds.data.forEach((d, i) => { const x = fx(d.x), y = fy(d.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; return; }
          ds.data.forEach((d, i) => { const x = fx(d.x), y = fy(d.y), rr = (ds.radius || 5); ctx.fillStyle = color(ds, i); ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); hits.push({ k: 'c', x, y, r: Math.max(12, rr + 6), di, i }); });
        }
      });
      if (nds > 1 && S.legend !== false) { let lx = pad.l; ctx.textAlign = 'left'; S.datasets.forEach((ds, di) => { if (ds.line) return; ctx.fillStyle = color(ds, di); ctx.fillRect(lx, pad.t - 18, 10, 10); ctx.fillStyle = TXT; ctx.fillText(ds.label || '', lx + 14, pad.t - 13); lx += 24 + (ds.label || '').length * 7.5; }); }
    }
    function drawPie(w, h) {
      const ds = S.datasets[0], tot = ds.data.reduce((a, b) => a + b, 0), cx = w * .38, cy = h / 2 + (S.title ? 10 : 0), R = Math.min(w * .3, h / 2 - (S.title ? 30 : 12));
      let a0 = -Math.PI / 2;
      ds.data.forEach((v, i) => {
        const a1 = a0 + v / tot * Math.PI * 2; ctx.fillStyle = color(ds, i); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#0a1322'; ctx.stroke();
        const am = (a0 + a1) / 2; ctx.fillStyle = '#04101f'; ctx.textAlign = 'center'; ctx.font = '600 12px DM Mono, monospace'; ctx.fillText(String(v) + (S.pieUnit || ''), cx + Math.cos(am) * R * .65, cy + Math.sin(am) * R * .65);
        hits.push({ k: 'p', cx, cy, R, a0, a1, di: 0, i }); a0 = a1;
      });
      ctx.font = '12px DM Mono, monospace'; ctx.textAlign = 'left';
      S.labels.forEach((l, i) => { const y = cy - R + 10 + i * 22; ctx.fillStyle = color(ds, i); ctx.fillRect(w * .68, y - 6, 12, 12); ctx.fillStyle = '#EDF5FF'; ctx.fillText(l, w * .68 + 18, y); });
    }
    function onClick(e) {
      if (!S.onClick) return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 1e9;
      hits.forEach(hh => {
        if (hh.k === 'r' && x >= hh.x && x <= hh.x + hh.w && y >= hh.y - 2 && y <= hh.y + hh.h + 2) { best = hh; bd = 0; }
        else if (hh.k === 'c') { const d = Math.hypot(x - hh.x, y - hh.y); if (d <= hh.r && d < bd) { best = hh; bd = d; } }
        else if (hh.k === 'p') { const d = Math.hypot(x - hh.cx, y - hh.cy); let a = Math.atan2(y - hh.cy, x - hh.cx); if (a < -Math.PI / 2) a += Math.PI * 2; if (d <= hh.R && a >= hh.a0 && a <= hh.a1) { best = hh; bd = 0; } }
      });
      if (best) S.onClick(best.di, best.i);
    }
    canvas.addEventListener('click', onClick); canvas.style.cursor = spec.onClick ? 'pointer' : 'default';
    let ro = null; if (window.ResizeObserver) { ro = new ResizeObserver(() => draw()); ro.observe(canvas); } else window.addEventListener('resize', draw);
    draw();
    function center(di, i) { const hh = hits.find(k => k.di === di && k.i === i); if (!hh) return null; if (hh.k === 'r') return { x: hh.x + hh.w / 2, y: hh.y + hh.h / 2 }; if (hh.k === 'c') return { x: hh.x, y: hh.y }; const am = (hh.a0 + hh.a1) / 2; return { x: hh.cx + Math.cos(am) * hh.R * .65, y: hh.cy + Math.sin(am) * hh.R * .65 }; }
    return { destroy() { alive = false; if (ro) ro.disconnect(); canvas.removeEventListener('click', onClick); }, engine: 'fallback', center };
  }

  /* ---------------- Chart.js adapter ---------------- */
  function chartjs(canvas, spec) {
    const C = window.Chart; C.defaults.color = TXT; C.defaults.borderColor = GRID; C.defaults.font.family = "'DM Mono', monospace";
    const isPie = spec.type === 'pie', isXY = spec.type === 'scatter';
    const datasets = spec.datasets.map((ds, di) => {
      const col = ds.colors || ds.color || PAL[di % PAL.length];
      const base = { label: ds.label || '', data: ds.data };
      if (ds.line) return Object.assign(base, { type: 'line', showLine: true, borderColor: ds.color || PAL[4], borderDash: [6, 4], pointRadius: 0, borderWidth: 2 });
      if (isPie) return Object.assign(base, { backgroundColor: ds.colors || PAL, borderColor: '#0a1322' });
      if (spec.type === 'bar') return Object.assign(base, { backgroundColor: col, borderWidth: 0, categoryPercentage: spec.barGap === false ? 1 : 0.8, barPercentage: spec.barGap === false ? 1 : 0.9 });
      if (spec.type === 'line') return Object.assign(base, { borderColor: col, backgroundColor: col, pointRadius: 4, pointHitRadius: 14, tension: 0.15 });
      return Object.assign(base, { backgroundColor: col, borderColor: col, pointRadius: ds.radius || 5, pointHitRadius: 14, pointHoverRadius: 8 });
    });
    const scales = isPie ? {} : {
      x: Object.assign({ grid: { color: GRID }, title: { display: !!spec.xTitle, text: spec.xTitle || '' } }, isXY ? { type: 'linear' } : {}),
      y: { grid: { color: GRID }, type: spec.yLog ? 'logarithmic' : 'linear', min: spec.yMin, max: spec.yMax, title: { display: !!spec.yTitle, text: spec.yTitle || '' } }
    };
    const chart = new C(canvas, {
      type: spec.type, data: { labels: spec.labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: (spec.noAnim || document.body.classList.contains('reduce-motion')) ? false : { duration: 500 },
        interaction: { mode: 'nearest', intersect: true },
        plugins: { title: { display: !!spec.title, text: spec.title || '', color: '#EDF5FF', font: { size: 14, family: "'Space Grotesk', sans-serif" } }, legend: { display: spec.legend != null ? spec.legend : (spec.datasets.filter(d => !d.line).length > 1 || isPie), labels: { color: TXT } } },
        scales,
        onClick: (evt, els) => { if (spec.onClick && els.length) spec.onClick(els[0].datasetIndex, els[0].index); }
      }
    });
    canvas.style.cursor = spec.onClick ? 'pointer' : 'default';
    return { destroy() { chart.destroy(); }, engine: 'chartjs' };
  }

  DL.charts = {
    render(canvas, spec) {
      let c = null;
      if (window.Chart) { try { c = chartjs(canvas, spec); } catch (e) { c = null; /* fall through to fallback */ } }
      if (!c) c = mini(canvas, spec);
      canvas.__chart = c; return c;
    },
    // Convenience: build a chart box (canvas wrapper) with an accessible label
    box(label, short) {
      const cv = DL.ui.h('canvas', { role: 'img', 'aria-label': label });
      return { wrap: DL.ui.h('div', { class: 'chart-box' + (short ? ' short' : '') }, cv), canvas: cv };
    }
  };
})(window.DL);
