/*
  TWM V2 — Adaptive Hybrid Stage (Phase 2)
  Overview: all panels shown at equal weight.
  Focus: selected panel expands in place; rest of stage dims to 20% opacity
         (--twm-stage-focus-dim-opacity, locked identically across every screen
         in 04/05/06 interface files).
  Immersive: single panel takes the full stage; dock minimizes.

  Also hosts the "Fully Customizable (Option C)" personalisation mechanism
  (03_SHARED_FRONTEND_ARCHITECTURE.md): drag-to-reorder, resize-within-bounds,
  show/hide widgets, save/restore layout per role+destination, one-click
  restore-default. Built once here — app-wide, not duplicated per role — since
  the spec names it identically for Client/Employee/Admin overview grids.
  Applies to Overview mode only; Focus/Immersive are single/dimmed-panel views,
  not a widget grid, so customization doesn't apply there.
*/
const TwmStage = (() => {
  let currentMode = 'overview';
  let dockEl = null;
  let customizeMode = false;

  function init(dock) {
    dockEl = dock;
  }

  function loadLayout(key) {
    if (!key) return null;
    try { return JSON.parse(localStorage.getItem('twm-layout:' + key) || 'null'); } catch (e) { return null; }
  }
  function saveLayout(key, layout) {
    if (!key) return;
    localStorage.setItem('twm-layout:' + key, JSON.stringify(layout));
  }
  function clearLayout(key) {
    if (!key) return;
    localStorage.removeItem('twm-layout:' + key);
  }

  function applyLayout(panels, layout) {
    if (!layout) return panels.slice();
    const order = layout.order || [];
    const hidden = new Set(layout.hidden || []);
    const byId = {};
    panels.forEach((p) => { byId[p.id] = p; });
    const ordered = order.map((id) => byId[id]).filter(Boolean);
    panels.forEach((p) => { if (!order.includes(p.id)) ordered.push(p); });
    return ordered.filter((p) => !hidden.has(p.id));
  }

  function renderCustomizeBar(layoutKey, hiddenCount, rerender) {
    const bar = document.createElement('div');
    bar.className = 'twm-stage__customize-bar';
    bar.innerHTML = `<button type="button" class="twm-btn twm-btn--secondary twm-stage__customize-toggle">${customizeMode ? 'Done customizing' : 'Customize layout'}</button>
      ${customizeMode ? `<button type="button" class="twm-btn twm-btn--secondary twm-stage__restore-default">Restore default</button>` : ''}
      ${!customizeMode && hiddenCount ? `<span class="twm-chip">${hiddenCount} widget${hiddenCount > 1 ? 's' : ''} hidden</span>` : ''}`;
    bar.querySelector('.twm-stage__customize-toggle').addEventListener('click', () => {
      customizeMode = !customizeMode;
      rerender();
    });
    const restoreBtn = bar.querySelector('.twm-stage__restore-default');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        clearLayout(layoutKey);
        customizeMode = false;
        rerender();
      });
    }
    return bar;
  }

  function render(stageEl, panels, mode = 'overview', focusedId = null, routeContext = null) {
    currentMode = mode;
    const layoutKey = routeContext ? routeContext.role + '/' + routeContext.destination : null;
    stageEl.className = 'twm-stage__grid twm-stage ' +
      (mode === 'focus' ? 'twm-stage--focus' : mode === 'immersive' ? 'twm-stage--immersive' : '');
    stageEl.innerHTML = '';

    const customizable = mode === 'overview' && !!layoutKey;
    const layout = customizable ? loadLayout(layoutKey) : null;
    const visiblePanels = customizable ? applyLayout(panels, layout) : panels;
    const hiddenCount = customizable && layout ? (layout.hidden || []).filter((id) => panels.some((p) => p.id === id)).length : 0;
    const rerender = () => render(stageEl, panels, mode, focusedId, layoutKey);

    if (customizable) {
      stageEl.appendChild(renderCustomizeBar(layoutKey, hiddenCount, rerender));
    }

    visiblePanels.forEach((panel) => {
      const panelEl = document.createElement('section');
      panelEl.className = 'twm-stage__panel twm-glass twm-panel';
      panelEl.dataset.panelId = panel.id;
      if (mode === 'focus' && panel.id === focusedId) panelEl.classList.add('twm-stage__panel--focused');
      if (mode === 'immersive' && panel.id === focusedId) panelEl.classList.add('twm-stage__panel--immersive');

      const span = layout && layout.spans && layout.spans[panel.id];
      if (customizable && span) panelEl.style.gridColumn = `span ${span}`;

      if (customizable && customizeMode) {
        panelEl.classList.add('twm-stage__panel--customizing');
        panelEl.draggable = true;
        panelEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', panel.id);
        });
        panelEl.addEventListener('dragover', (e) => e.preventDefault());
        panelEl.addEventListener('drop', (e) => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData('text/plain');
          if (!draggedId || draggedId === panel.id) return;
          const visibleIds = visiblePanels.map((p) => p.id);
          const from = visibleIds.indexOf(draggedId);
          const to = visibleIds.indexOf(panel.id);
          if (from === -1 || to === -1) return;
          visibleIds.splice(to, 0, visibleIds.splice(from, 1)[0]);
          const fullOrder = visibleIds.concat(panels.map((p) => p.id).filter((id) => !visibleIds.includes(id)));
          saveLayout(layoutKey, Object.assign({}, layout, { order: fullOrder }));
          rerender();
        });

        const toolbar = document.createElement('div');
        toolbar.className = 'twm-panel__customize-toolbar';
        toolbar.innerHTML = `<span class="twm-drag-handle" title="Drag to reorder">⠿</span>
          <button type="button" class="twm-btn twm-btn--secondary twm-panel__resize-btn" title="Cycle widget width">⤢</button>
          <button type="button" class="twm-btn twm-btn--secondary twm-panel__hide-btn" title="Hide widget">✕</button>`;
        toolbar.querySelector('.twm-panel__resize-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const spans = Object.assign({}, layout && layout.spans);
          const current = spans[panel.id] || 1;
          spans[panel.id] = current >= 3 ? 1 : current + 1;
          saveLayout(layoutKey, Object.assign({}, layout, { spans }));
          rerender();
        });
        toolbar.querySelector('.twm-panel__hide-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const hidden = ((layout && layout.hidden) || []).concat(panel.id);
          saveLayout(layoutKey, Object.assign({}, layout, { hidden }));
          rerender();
        });
        panelEl.appendChild(toolbar);
      }

      const title = document.createElement('div');
      title.className = 'twm-panel__title';
      title.textContent = panel.title;
      panelEl.appendChild(title);

      // H-2 fix: a generic, reusable path from Focus to Immersive. Any panel can
      // opt in with `panel.immersive = true`; when it is the focused panel, an
      // explicit "Open full view" control reaches Immersive via a normal
      // 3-argument navigate — the same mechanism Employee/Admin's More hubs use,
      // now available to every role instead of being Employee/Admin-only.
      if (mode === 'focus' && panel.id === focusedId && panel.immersive && routeContext) {
        const expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'twm-btn twm-btn--secondary twm-panel__expand-btn';
        expandBtn.textContent = 'Open full view';
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          TwmRouter.navigate(routeContext.role, routeContext.destination, panel.id);
        });
        panelEl.appendChild(expandBtn);
      }

      if (panel.render) {
        const body = document.createElement('div');
        panel.render(body);
        panelEl.appendChild(body);
      }

      if (panel.onFocus && mode === 'overview' && !customizeMode) {
        panelEl.style.cursor = 'pointer';
        // H-1 event-bubbling sub-case: a click on any nested interactive control
        // (e.g. "Connect SMC Account") bubbles up to this listener too. Ignore it
        // here so only a click on the panel chrome itself enters Focus mode.
        panelEl.addEventListener('click', (e) => {
          if (e.target.closest('button, a, input, select, textarea, [role="button"], [role="tab"]')) return;
          panel.onFocus();
        });
      }

      if (panel.disclosure) {
        const strip = document.createElement('div');
        strip.className = 'twm-disclosure-strip';
        strip.textContent = panel.disclosure;
        panelEl.appendChild(strip);
      }

      stageEl.appendChild(panelEl);
    });

    if (dockEl) {
      dockEl.classList.toggle('twm-dock--minimized', mode === 'immersive');
    }
  }

  return { init, render, get mode() { return currentMode; } };
})();
