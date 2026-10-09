// Offers are rendered at build time. This only hides offers that have expired since the last build.
(function () {
  const list = document.getElementById('offers-list');
  const empty = document.getElementById('offers-empty');
  if (!list || !empty) return;

  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type) => parts.find((entry) => entry.type === type).value;
  const today = part('year') + '-' + part('month') + '-' + part('day');

  list.querySelectorAll('[data-valid-until]').forEach((card) => {
    if (card.dataset.validUntil < today) card.remove();
  });

  empty.hidden = list.children.length > 0;
})();
