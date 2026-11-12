/*
  TWM V2 — hash router (Phase 2)
  Route shape: #/<role>/<destination>/<panelId?>
  This is a frontend-prototype router only. It does not perform authentication
  or authorization — role selection here is a dev-preview convenience, not a
  security boundary (see 07_FRONTEND_TECHNICAL_SPEC.md "Frontend honesty requirements").
*/
const TwmRouter = (() => {
  let listeners = [];

  function parse() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const [role, destination, panel] = hash.split('/').filter(Boolean);
    return {
      role: role || 'client',
      destination: destination || null,
      panel: panel || null,
    };
  }

  function navigate(role, destination, panel) {
    const parts = [role, destination, panel].filter(Boolean);
    window.location.hash = '/' + parts.join('/');
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  window.addEventListener('hashchange', () => {
    const route = parse();
    listeners.forEach((fn) => fn(route));
  });

  return { parse, navigate, onChange };
})();
