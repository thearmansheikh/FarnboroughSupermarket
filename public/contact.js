// Contact form: the form is a normal HTML form that posts to FormSubmit and works without JavaScript.
// This script only adds friendly inline validation and a "Sending..." state.
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('contact-form-status');
  const button = form.querySelector('[type="submit"]');
  const idleLabel = button.textContent;
  const fields = Array.from(form.querySelectorAll('input[name="name"], input[name="email"], textarea[name="message"]'));

  // Replace the browser's pop-up bubbles with messages we can announce to screen readers.
  form.setAttribute('novalidate', '');

  function message(field) {
    const v = field.validity;
    const label = field.name === 'name' ? 'your name' : field.name === 'email' ? 'your email address' : 'your message';
    if (v.valueMissing) return 'Please enter ' + label + '.';
    if (v.typeMismatch) return 'Please enter a valid email address, like name@example.com.';
    if (v.tooShort) return 'Please write a little more (at least ' + field.minLength + ' characters).';
    if (v.tooLong) return 'Please keep this under ' + field.maxLength + ' characters.';
    return '';
  }

  function showError(field, text) {
    const error = document.getElementById(field.id + '-error');
    field.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (!error) return;
    error.textContent = text;
    error.hidden = !text;
  }

  fields.forEach((field) => {
    field.addEventListener('blur', () => field.value && showError(field, message(field)));
    field.addEventListener('input', () => field.getAttribute('aria-invalid') === 'true' && showError(field, message(field)));
  });

  function setStatus(text) {
    status.textContent = text;
    status.classList.toggle('hidden', !text);
  }

  form.addEventListener('submit', (event) => {
    const problems = fields.filter((field) => message(field));
    fields.forEach((field) => showError(field, message(field)));

    if (problems.length) {
      event.preventDefault();
      setStatus(problems.length === 1 ? 'Please fix the highlighted field.' : 'Please fix the ' + problems.length + ' highlighted fields.');
      problems[0].focus();
      return;
    }

    // Valid: let the browser post the form. Disable the button so it cannot be sent twice.
    setStatus('Sending your enquiry...');
    button.disabled = true;
    button.textContent = 'Sending...';
  });

  // Coming back with the Back button should not leave the form stuck on "Sending...".
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    button.disabled = false;
    button.textContent = idleLabel;
    setStatus('');
  });
})();

// Google Maps loads only after the visitor clicks "Load map" or allows the Maps category.
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
    iframe.className = 'map-frame';
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
