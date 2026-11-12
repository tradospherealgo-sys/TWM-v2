/*
  TWM V2 — Shared Application Shell bootstrap (Phase 2)
  Wires: identity/context header, role-aware workspace resolver, dock,
  Adaptive Hybrid Stage, Admin ⌘K palette, AI Companion/Copilot FAB.

  Role resolution here is a DEV-PREVIEW CONVENIENCE ONLY (hash-based role switch).
  It is not authentication. Real role resolution is a backend concern, out of
  this frontend-only phase (07_FRONTEND_TECHNICAL_SPEC.md).
*/
(function () {
  const CONTENT = {
    client: window.TwmClientContent,
    employee: window.TwmEmployeeContent,
    admin: window.TwmAdminContent,
  };

  const ROLE_LABEL = { client: 'Client', employee: 'Employee', admin: 'Admin' };

  const appEl = document.getElementById('twm-app');
  const headerEl = document.getElementById('twm-header');
  const breadcrumbEl = document.getElementById('twm-breadcrumbs');
  const stageEl = document.getElementById('twm-stage');
  const dockEl = document.getElementById('twm-dock');

  TwmStage.init(dockEl);

  let focusState = { mode: 'overview', focusedId: null };

  function renderHeader(route) {
    headerEl.innerHTML = '';

    const brand = document.createElement('div');
    brand.className = 'twm-header__brand';
    brand.innerHTML = `<span>TWM</span><span class="twm-header__role-chip">${ROLE_LABEL[route.role]} workspace</span>`;
    headerEl.appendChild(brand);

    const actions = document.createElement('div');
    actions.className = 'twm-header__actions';

    // Dev-preview role switch — explicitly labelled as a prototype control, not real auth.
    const roleSelect = document.createElement('select');
    roleSelect.className = 'twm-input';
    roleSelect.style.minWidth = '160px';
    roleSelect.title = 'Prototype preview only — not a real sign-in';
    ['client', 'employee', 'admin'].forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = `Preview as: ${ROLE_LABEL[r]}`;
      if (r === route.role) opt.selected = true;
      roleSelect.appendChild(opt);
    });
    roleSelect.addEventListener('change', (e) => {
      const destinations = TwmDock.destinations[e.target.value];
      TwmRouter.navigate(e.target.value, destinations[0].id);
    });
    actions.appendChild(roleSelect);

    if (route.role === 'admin') {
      const cmdkBtn = document.createElement('button');
      cmdkBtn.className = 'twm-btn twm-btn--secondary';
      cmdkBtn.textContent = '⌘K';
      cmdkBtn.title = 'Admin command palette — supplementary layer on top of the Dock';
      cmdkBtn.addEventListener('click', openCommandPalette);
      actions.appendChild(cmdkBtn);
    }

    headerEl.appendChild(actions);
  }

  function renderBreadcrumbs(route, screen) {
    breadcrumbEl.innerHTML = '';
    // Breadcrumbs are an Admin-only supplementary layer (03_SHARED_FRONTEND_ARCHITECTURE.md).
    if (route.role !== 'admin') {
      breadcrumbEl.style.display = 'none';
      return;
    }
    breadcrumbEl.style.display = 'flex';
    const trail = screen && screen.breadcrumb ? screen.breadcrumb : [ROLE_LABEL[route.role]];
    trail.forEach((t, i) => {
      const span = document.createElement('span');
      span.textContent = t + (i < trail.length - 1 ? ' /' : '');
      breadcrumbEl.appendChild(span);
    });
  }

  function setFocus(mode, focusedId) {
    focusState = { mode, focusedId };
    renderRoute(TwmRouter.parse());
  }
  window.TwmSetFocus = setFocus;
  // Exposed so fixed-chrome controls (e.g. Trade's Practice|Live tab, CRM's Leads|Customers
  // segmented control) can trigger a re-render after mutating their own module-level state,
  // without that state living in the router (it isn't a navigable destination).
  window.TwmForceRender = () => renderRoute(TwmRouter.parse());

  // H-1 fix: focusState must reset on EVERY path that changes role/destination
  // (direct hash edit, back/forward, ⌘K, More-hub deep-links, Command Centre tile
  // clicks), not only the Dock's own click handler. Tracking the last rendered
  // route key and comparing it here covers every path uniformly, because every
  // path ends up calling renderRoute via TwmRouter.onChange or TwmSetFocus.
  let lastRouteKey = null;

  function renderRoute(route) {
    const content = CONTENT[route.role];
    if (!content) return;

    const destinations = TwmDock.destinations[route.role];
    const activeDestination = route.destination || destinations[0].id;
    if (!route.destination) {
      TwmRouter.navigate(route.role, activeDestination);
      return;
    }

    const routeKey = route.role + '/' + activeDestination;
    if (routeKey !== lastRouteKey) {
      focusState = { mode: 'overview', focusedId: null };
    }
    lastRouteKey = routeKey;

    const screen = content.getScreen(activeDestination, route.panel);
    renderHeader(route);
    renderBreadcrumbs(route, screen);

    const panels = (screen && screen.panels) || [{
      id: 'empty',
      title: screen ? screen.title : 'Not found',
      render: (el) => { el.innerHTML = '<div class="twm-state-empty">Nothing here yet.</div>'; },
    }];

    const mode = route.panel ? 'immersive' : focusState.mode;
    const focusedId = route.panel || focusState.focusedId;
    TwmStage.render(stageEl, panels, mode, focusedId);

    TwmDock.render(dockEl, route.role, activeDestination, (destId) => {
      focusState = { mode: 'overview', focusedId: null };
      TwmRouter.navigate(route.role, destId);
    });
  }

  function openCommandPalette() {
    const backdrop = document.createElement('div');
    backdrop.className = 'twm-cmdk-backdrop';
    backdrop.innerHTML = `
      <div class="twm-cmdk twm-glass twm-panel">
        <div class="twm-panel__title">Admin command palette</div>
        <input class="twm-input" placeholder="Jump to a destination…" autofocus>
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:4px;">
          ${TwmDock.destinations.admin.map(d => `<button class="twm-btn twm-btn--secondary" data-dest="${d.id}" style="justify-content:flex-start">${d.label}</button>`).join('')}
        </div>
        <p style="font-size:12px;color:var(--twm-text-muted);margin-top:12px">
          Supplementary power-user layer on top of the Dock — routes only to destinations the current role can reach.
        </p>
      </div>`;
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
    backdrop.querySelectorAll('[data-dest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        TwmRouter.navigate('admin', btn.dataset.dest);
        backdrop.remove();
      });
    });
    document.body.appendChild(backdrop);
    backdrop.querySelector('input').focus();
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const route = TwmRouter.parse();
      if (route.role === 'admin') {
        e.preventDefault();
        openCommandPalette();
      }
    }
  });

  TwmRouter.onChange(renderRoute);
  renderRoute(TwmRouter.parse());
})();
