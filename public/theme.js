(function () {
  const root = document.documentElement;

  document.addEventListener('DOMContentLoaded', () => {
    root.dataset.theme = 'light';
    root.classList.remove('dark');
    document.body.classList.remove('theme-dark', 'theme-light');

    try {
      localStorage.setItem('farnborough-theme', 'light');
    } catch (error) {
      // Ignore storage issues.
    }

    document.querySelectorAll('[data-nav-toggle]').forEach((button) => {
      const menu = document.querySelector('[data-mobile-menu]');
      if (!menu) return;

      button.addEventListener('click', () => {
        const isVisible = !menu.classList.contains('hidden');
        menu.classList.toggle('hidden', isVisible);
        menu.classList.toggle('flex', !isVisible);
        button.setAttribute('aria-expanded', String(!isVisible));
      });
    });
  });
})();
