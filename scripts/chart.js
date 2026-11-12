/*
  TWM V2 — shared chart / data-visualization primitive (Phase 1 deliverable, P1-21)
  Honesty rule: never fabricates data. Every function renders the standard
  .twm-state-empty disclosure when given no/zero series instead of inventing
  a placeholder chart. Callers pass real data (or nothing); this module never
  generates its own numbers.
*/
const TwmChart = (() => {
  function emptyState(label) {
    return `<div class="twm-state-empty">${label || 'No data yet.'}</div>`;
  }

  // Line/sparkline — used for index/price trend strips (Markets) and session P&L.
  function sparkline(series, opts = {}) {
    if (!series || series.length < 2) return emptyState(opts.emptyLabel);
    const width = opts.width || 320;
    const height = opts.height || 72;
    const pad = 6;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = (width - pad * 2) / (series.length - 1);
    const points = series.map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - (v - min) / range);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const stroke = opts.color || 'var(--twm-accent-cyan)';
    return `<svg class="twm-chart twm-chart--sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${opts.ariaLabel || 'trend chart'}">
      <polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  // Column/bar chart — used for stage-sequence counts (Sales & CRM pipeline).
  function columns(data, opts = {}) {
    if (!data || !data.length || !data.some(d => d.value > 0)) return emptyState(opts.emptyLabel);
    const max = Math.max(...data.map(d => d.value), 1);
    return `<div class="twm-chart twm-chart--columns" role="img" aria-label="${opts.ariaLabel || 'bar chart'}">
      ${data.map(d => `<div class="twm-chart__col">
        <div class="twm-chart__bar" style="height:${Math.max(2, Math.round((d.value / max) * 100))}%"></div>
        <div class="twm-chart__label">${d.label}</div>
        <div class="twm-chart__value twm-num">${d.value}</div>
      </div>`).join('')}
    </div>`;
  }

  // Horizontal funnel — used for the Sales & CRM pipeline visualization (P5-36).
  function funnel(stages, opts = {}) {
    const total = (stages || []).reduce((s, x) => s + (x.count || 0), 0);
    if (!total) return emptyState(opts.emptyLabel || 'No pipeline data yet.');
    const max = Math.max(...stages.map(s => s.count), 1);
    return `<div class="twm-chart twm-chart--funnel" role="img" aria-label="${opts.ariaLabel || 'pipeline funnel'}">
      ${stages.map(s => `<div class="twm-chart__funnel-row">
        <span class="twm-chart__funnel-label">${s.label}</span>
        <div class="twm-chart__funnel-track"><div class="twm-chart__funnel-fill" style="width:${Math.round((s.count / max) * 100)}%"></div></div>
        <span class="twm-num">${s.count}</span>
      </div>`).join('')}
    </div>`;
  }

  return { sparkline, columns, funnel, emptyState };
})();
window.TwmChart = TwmChart;
