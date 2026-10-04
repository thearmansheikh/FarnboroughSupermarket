(function () {
  const root = document.documentElement;
  const storageKey = 'farnborough-theme';

  const getStoredTheme = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (error) {
      // Ignore storage issues and fall back to system preference.
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    root.dataset.theme = theme;
    root.classList.toggle('dark', isDark);
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('theme-light', !isDark);

    document.querySelectorAll('[data-theme-icon]').forEach((icon) => {
      icon.textContent = isDark ? '☀️' : '🌙';
    });

    document.querySelectorAll('[data-theme-label]').forEach((label) => {
      label.textContent = isDark ? 'Light mode' : 'Dark mode';
    });

    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Ignore storage issues.
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getStoredTheme());

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
      });
    });

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
