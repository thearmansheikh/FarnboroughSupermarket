(function () {
  const root = document.documentElement;
  const cookieConsentKey = 'farnborough-cookie-consent-v2';

  function readCookieConsent() {
    try {
      const consent = JSON.parse(localStorage.getItem(cookieConsentKey) || 'null');
      if (consent && consent.essential === true) return consent;
    } catch (error) {
      // Keep the notice visible when browser storage is unavailable.
    }
    return null;
  }

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

    let consent = readCookieConsent();
    const notice = document.createElement('aside');
    notice.className = 'cookie-notice';
    notice.setAttribute('aria-label', 'Cookie preferences');
    notice.hidden = Boolean(consent);
    notice.innerHTML = `
      <div class="cookie-notice__content">
        <p class="cookie-notice__title">Your cookie choices</p>
        <p class="cookie-notice__copy">We use essential browser storage for site preferences. We don't currently use analytics or advertising cookies. Choose whether to allow optional categories. <a href="privacy.html">Privacy details</a></p>
      </div>
      <div class="cookie-notice__actions">
        <button type="button" class="cookie-notice__button" data-cookie-accept-all>Accept all</button>
        <button type="button" class="cookie-notice__button cookie-notice__button--secondary" data-cookie-reject>Reject optional</button>
      </div>
      <details class="cookie-preferences">
        <summary>Manage preferences</summary>
        <div class="cookie-preferences__panel">
          <label class="cookie-preferences__row">
            <span><strong>Essential</strong><small>Always active for core site functions.</small></span>
            <input type="checkbox" checked disabled aria-label="Essential storage is always active" />
          </label>
          <label class="cookie-preferences__row">
            <span><strong>Analytics</strong><small>Allow analytics cookies if added to the site.</small></span>
            <input type="checkbox" data-cookie-analytics />
          </label>
          <label class="cookie-preferences__row">
            <span><strong>Marketing</strong><small>Allow advertising cookies if added to the site.</small></span>
            <input type="checkbox" data-cookie-marketing />
          </label>
          <button type="button" class="cookie-notice__button" data-cookie-save>Save preferences</button>
        </div>
      </details>
    `;

    const settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'cookie-settings-trigger';
    settingsButton.textContent = 'Cookie settings';
    settingsButton.hidden = !consent;
    settingsButton.addEventListener('click', () => {
      notice.querySelector('[data-cookie-analytics]').checked = Boolean(consent && consent.analytics);
      notice.querySelector('[data-cookie-marketing]').checked = Boolean(consent && consent.marketing);
      notice.hidden = false;
      settingsButton.hidden = true;
    });

    function saveConsent(analytics, marketing) {
      consent = { essential: true, analytics, marketing };
      try {
        localStorage.setItem(cookieConsentKey, JSON.stringify(consent));
      } catch (error) {
        // Keep the current page usable when browser storage is unavailable.
      }
      notice.hidden = true;
      settingsButton.hidden = false;
    }

    notice.querySelector('[data-cookie-accept-all]').addEventListener('click', () => saveConsent(true, true));
    notice.querySelector('[data-cookie-reject]').addEventListener('click', () => saveConsent(false, false));
    notice.querySelector('[data-cookie-save]').addEventListener('click', () => {
      saveConsent(
        notice.querySelector('[data-cookie-analytics]').checked,
        notice.querySelector('[data-cookie-marketing]').checked
      );
    });

    document.body.append(notice, settingsButton);
  });
})();
