/*
  TWM V2 — Floating Command Dock (Phase 2)
  Destinations are role-specific and locked:
  Client:   Home, Markets, Trade, Services, Me            (03_SHARED_FRONTEND_ARCHITECTURE.md)
  Employee: My Day, CRM, Applications, Tasks, More
  Admin:    Command Centre, Team, Sales & CRM, Applications Review, Compliance, More
  No permanent sidebar. Dock must never bleed across roles (46-file package, 17_NAVIGATION...).
*/
const TWM_DOCK_DESTINATIONS = {
  client: [
    { id: 'home', label: 'Home' },
    { id: 'markets', label: 'Markets' },
    { id: 'trade', label: 'Trade' },
    { id: 'services', label: 'Services' },
    { id: 'me', label: 'Me' },
  ],
  employee: [
    { id: 'myday', label: 'My Day' },
    { id: 'crm', label: 'CRM' },
    { id: 'applications', label: 'Applications' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'more', label: 'More' },
  ],
  admin: [
    { id: 'command-centre', label: 'Command Centre' },
    { id: 'team', label: 'Team' },
    { id: 'sales-crm', label: 'Sales & CRM' },
    { id: 'applications-review', label: 'Applications Review' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'more', label: 'More' },
  ],
};

const TwmDock = (() => {
  function render(dockEl, role, activeDestination, onSelect) {
    dockEl.innerHTML = '';
    dockEl.classList.add('twm-glass');
    dockEl.style.setProperty('--twm-role-accent', `var(--twm-role-${role}-accent)`);
    const destinations = TWM_DOCK_DESTINATIONS[role] || [];

    destinations.forEach((dest) => {
      const btn = document.createElement('button');
      btn.className = 'twm-dock__item';
      btn.setAttribute('aria-current', String(dest.id === activeDestination));
      btn.innerHTML = `<span class="twm-dock__dot"></span><span>${dest.label}</span>`;
      btn.addEventListener('click', () => onSelect(dest.id));
      dockEl.appendChild(btn);
    });
  }

  return { render, destinations: TWM_DOCK_DESTINATIONS };
})();
