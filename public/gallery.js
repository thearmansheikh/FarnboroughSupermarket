// Accessible photo viewer: uses a native modal <dialog> (focus trap, Esc to close, background inert),
// adds arrow-key navigation and returns focus to the photo that opened it.
(function () {
  const dialog = document.getElementById('lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const image = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  const status = document.getElementById('lightbox-status');
  const placeholder = image.getAttribute('src');
  const triggers = Array.from(document.querySelectorAll('[data-gallery-open]'));
  let current = 0;
  let opener = null;

  function show(index) {
    current = (index + triggers.length) % triggers.length;
    const trigger = triggers[current];
    image.src = trigger.dataset.full;
    image.alt = trigger.dataset.alt;
    caption.textContent = trigger.dataset.alt;
    status.textContent = 'Photo ' + (current + 1) + ' of ' + triggers.length;
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => {
      opener = trigger;
      show(index);
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => show(current + 1));
  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  // Clicking the dark backdrop closes the viewer.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    image.src = placeholder;
    if (opener) opener.focus();
  });
})();
