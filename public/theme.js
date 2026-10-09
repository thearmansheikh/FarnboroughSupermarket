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

  // Mobile menu: a button that opens a list of links. Esc closes it and returns focus to the button, and while
  // it is open Tab stays inside the button and the menu links.
  function setUpMenu() {
    const button = document.querySelector('[data-nav-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!button || !menu) return;

    const isOpen = () => !menu.classList.contains('hidden');

    function setOpen(open) {
      menu.classList.toggle('hidden', !open);
      menu.classList.toggle('flex', open);
      button.setAttribute('aria-expanded', String(open));
    }

    button.addEventListener('click', () => {
      setOpen(!isOpen());
      if (isOpen()) menu.querySelector('a').focus();
    });

    document.addEventListener('keydown', (event) => {
      if (!isOpen()) return;

      if (event.key === 'Escape') {
        setOpen(false);
        button.focus();
        return;
      }

      if (event.key !== 'Tab') return;
      const stops = [button, ...menu.querySelectorAll('a')];
      const first = stops[0];
      const last = stops[stops.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Leaving the mobile layout (for example rotating a tablet) closes the menu.
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  // Cookie choices: Accept all and Reject optional are equally easy to use, and the banner takes focus when it appears.
  function setUpCookieNotice() {
    let consent = readCookieConsent();
    let opener = null;

    const notice = document.createElement('div');
    notice.className = 'cookie-notice';
    notice.setAttribute('role', 'dialog');
    notice.setAttribute('aria-modal', 'false');
    notice.setAttribute('aria-labelledby', 'cookie-title');
    notice.hidden = Boolean(consent);
    notice.innerHTML = `
      <div class="cookie-notice__content">
        <p class="cookie-notice__title" id="cookie-title" tabindex="-1">Your cookie choices</p>
        <p class="cookie-notice__copy">We use essential browser storage for site preferences. The map connects to Google only after you load it or allow the Maps category. <a href="/privacy">Privacy details</a></p>
      </div>
      <div class="cookie-notice__actions">
        <button type="button" class="cookie-notice__button" data-cookie-accept-all>Accept all</button>
        <button type="button" class="cookie-notice__button" data-cookie-reject>Reject optional</button>
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

    const focusNotice = () => notice.querySelector('#cookie-title').focus({ preventScroll: true });

    function openCookieSettings(event) {
      opener = event && event.currentTarget ? event.currentTarget : null;
      consent = readCookieConsent() || consent;
      notice.querySelector('[data-cookie-analytics]').checked = Boolean(consent && consent.analytics);
      notice.querySelector('[data-cookie-marketing]').checked = Boolean(consent && consent.marketing);
      notice.querySelector('[data-cookie-maps]').checked = Boolean(consent && consent.maps);
      notice.querySelector('.cookie-preferences').open = false;
      notice.hidden = false;
      focusNotice();
    }

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
      if (opener) opener.focus();
      opener = null;
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

    document.body.append(notice);
    if (!notice.hidden) focusNotice();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setUpMenu();
    setUpCookieNotice();
  });
})();
