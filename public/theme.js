(function () {
  const root = document.documentElement;
  const cookieNoticeKey = 'farnborough-cookie-notice';

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

    let noticeDismissed = false;
    try {
      noticeDismissed = localStorage.getItem(cookieNoticeKey) === 'dismissed';
    } catch (error) {
      // Keep the notice available when browser storage is disabled.
    }

    if (!noticeDismissed) {
      const notice = document.createElement('aside');
      notice.className = 'cookie-notice';
      notice.setAttribute('aria-label', 'Cookie and storage notice');
      notice.innerHTML = `
        <p class="cookie-notice__copy">We use essential browser storage to remember this notice and your preferences. We don't use advertising or analytics cookies. <a href="privacy.html">Privacy details</a></p>
        <button type="button" class="cookie-notice__button">Accept</button>
      `;
      notice.querySelector('button').addEventListener('click', () => {
        try {
          localStorage.setItem(cookieNoticeKey, 'dismissed');
        } catch (error) {
          // Dismiss the notice for this page even when storage is disabled.
        }
        notice.remove();
      });
      document.body.append(notice);
    }
  });
})();
