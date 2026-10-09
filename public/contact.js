const contactForm = document.getElementById('contact-form');

if (contactForm) {
  const status = document.getElementById('contact-form-status');
  const submitButton = contactForm.querySelector('[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    status.classList.remove('hidden');
    status.textContent = 'Sending your enquiry...';
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
      const action = contactForm.getAttribute('action');
      const endpointPrefix = 'https://formsubmit.co/';
      if (!action || !action.startsWith(endpointPrefix) || action === endpointPrefix || /[{}]/.test(action)) {
        throw new Error('The FormSubmit alias has not been configured.');
      }

      const endpoint = action.replace(endpointPrefix, `${endpointPrefix}ajax/`);
      const formValues = Object.fromEntries(new FormData(contactForm).entries());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formValues)
      });
      const result = await response.json();

      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error(result.message || 'The enquiry could not be sent.');
      }

      window.location.assign('/thank-you');
    } catch (error) {
      status.textContent = `We could not send your enquiry just now. ${contactForm.dataset.fallback || ''}`.trim();
      submitButton.disabled = false;
      submitButton.textContent = 'Send enquiry';
    }
  });
}

(function () {
  const mapPlaceholder = document.querySelector('[data-map-placeholder]');
  const mapFrameContainer = document.querySelector('[data-map-frame]');
  const mapLoadButton = document.querySelector('[data-map-load]');
  const mapStatus = document.querySelector('[data-map-status]');
  const consentKey = 'farnborough-cookie-consent-v2';
  const mapUrl = mapFrameContainer ? mapFrameContainer.dataset.mapSrc : '';

  if (!mapPlaceholder || !mapFrameContainer || !mapLoadButton) return;

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(consentKey) || 'null');
    } catch (error) {
      return null;
    }
  }

  function loadMap() {
    if (mapFrameContainer.firstElementChild) return;
    const iframe = document.createElement('iframe');
    iframe.title = 'Map to Farnborough Supermarket';
    iframe.src = mapUrl;
    iframe.width = '100%';
    iframe.height = '420';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.setAttribute('allowfullscreen', '');
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    mapFrameContainer.append(iframe);
    mapFrameContainer.classList.remove('hidden');
    mapPlaceholder.classList.add('hidden');
  }

  function unloadMap() {
    mapFrameContainer.replaceChildren();
    mapFrameContainer.classList.add('hidden');
    mapPlaceholder.classList.remove('hidden');
  }

  mapLoadButton.addEventListener('click', () => {
    const consent = getConsent() || { essential: true, analytics: false, marketing: false };
    consent.maps = true;
    try {
      localStorage.setItem(consentKey, JSON.stringify(consent));
    } catch (error) {
      if (mapStatus) {
        mapStatus.textContent = 'The map will load for this visit, but your choice could not be saved.';
        mapStatus.classList.remove('hidden');
      }
    }
    loadMap();
  });

  window.addEventListener('farnborough-cookie-consent-updated', (event) => {
    if (event.detail.maps) loadMap();
    else unloadMap();
  });

  if (getConsent()?.maps === true) loadMap();
})();
