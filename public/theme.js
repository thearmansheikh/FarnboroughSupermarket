(function () {
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
    document.querySelectorAll('[data-nav-toggle]').forEach((button) => {
      const menu = document.querySelector('[data-mobile-menu]');
      if (!menu) return;

      function setMenuOpen(open) {
        menu.classList.toggle('hidden', !open);
        menu.classList.toggle('flex', open);
        button.setAttribute('aria-expanded', String(open));
      }

      button.addEventListener('click', () => setMenuOpen(menu.classList.contains('hidden')));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
          setMenuOpen(false);
          button.focus();
        }
      });
    });

    let consent = readCookieConsent();
    const notice = document.createElement('aside');
    notice.className = 'cookie-notice';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-label', 'Cookie preferences');
    notice.hidden = Boolean(consent);
    notice.innerHTML = `
      <div class="cookie-notice__content">
        <p class="cookie-notice__title">Your cookie choices</p>
        <p class="cookie-notice__copy">We use essential browser storage for site preferences. The map connects to Google only after you load it or allow the Maps category. <a href="/privacy">Privacy details</a></p>
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
          <label class="cookie-preferences__row">
            <span><strong>Maps</strong><small>Allow the Google Maps embed to load automatically.</small></span>
            <input type="checkbox" data-cookie-maps />
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
    function openCookieSettings() {
      consent = readCookieConsent() || consent;
      notice.querySelector('[data-cookie-analytics]').checked = Boolean(consent && consent.analytics);
      notice.querySelector('[data-cookie-marketing]').checked = Boolean(consent && consent.marketing);
      notice.querySelector('[data-cookie-maps]').checked = Boolean(consent && consent.maps);
      notice.querySelector('.cookie-preferences').open = false;
      notice.hidden = false;
      settingsButton.hidden = true;
      notice.querySelector('[data-cookie-accept-all]').focus();
    }

    settingsButton.addEventListener('click', openCookieSettings);
    document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
      button.addEventListener('click', openCookieSettings);
    });

    function saveConsent(analytics, marketing, maps) {
      consent = { essential: true, analytics, marketing, maps };
      try {
        localStorage.setItem(cookieConsentKey, JSON.stringify(consent));
      } catch (error) {
        // Keep the current page usable when browser storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent('farnborough-cookie-consent-updated', { detail: consent }));
      notice.hidden = true;
      settingsButton.hidden = false;
    }

    notice.querySelector('[data-cookie-accept-all]').addEventListener('click', () => saveConsent(true, true, true));
    notice.querySelector('[data-cookie-reject]').addEventListener('click', () => saveConsent(false, false, false));
    notice.querySelector('[data-cookie-save]').addEventListener('click', () => {
      saveConsent(
        notice.querySelector('[data-cookie-analytics]').checked,
        notice.querySelector('[data-cookie-marketing]').checked,
        notice.querySelector('[data-cookie-maps]').checked
      );
    });

    document.body.append(notice, settingsButton);
  });
})();
