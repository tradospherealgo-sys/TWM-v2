/*
  TWM V2 — Adaptive Hybrid Stage (Phase 2)
  Overview: all panels shown at equal weight.
  Focus: selected panel expands in place; rest of stage dims to 20% opacity
         (--twm-stage-focus-dim-opacity, locked identically across every screen
         in 04/05/06 interface files).
  Immersive: single panel takes the full stage; dock minimizes.
*/
const TwmStage = (() => {
  let currentMode = 'overview';
  let dockEl = null;

  function init(dock) {
    dockEl = dock;
  }

  function render(stageEl, panels, mode = 'overview', focusedId = null) {
    currentMode = mode;
    stageEl.className = 'twm-stage__grid twm-stage ' +
      (mode === 'focus' ? 'twm-stage--focus' : mode === 'immersive' ? 'twm-stage--immersive' : '');
    stageEl.innerHTML = '';

    panels.forEach((panel) => {
      const panelEl = document.createElement('section');
      panelEl.className = 'twm-stage__panel twm-glass twm-panel';
      panelEl.dataset.panelId = panel.id;
      if (mode === 'focus' && panel.id === focusedId) panelEl.classList.add('twm-stage__panel--focused');
      if (mode === 'immersive' && panel.id === focusedId) panelEl.classList.add('twm-stage__panel--immersive');

      const title = document.createElement('div');
      title.className = 'twm-panel__title';
      title.textContent = panel.title;
      panelEl.appendChild(title);

      if (panel.render) {
        const body = document.createElement('div');
        panel.render(body);
        panelEl.appendChild(body);
      }

      if (panel.onFocus && mode === 'overview') {
        panelEl.style.cursor = 'pointer';
        panelEl.addEventListener('click', () => panel.onFocus());
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
