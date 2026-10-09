// Offers are rendered at build time. This only hides offers that have expired since the last build.
(function () {
  const list = document.getElementById('offers-list');
  const empty = document.getElementById('offers-empty');
  if (!list || !empty) return;

  // Today's date in UK time without the browser time-zone formatter (slow to build on phones). British Summer Time runs from
  // 01:00 UTC on the last Sunday of March to 01:00 UTC on the last Sunday of October.
  function lastSundayUtc(year, month) {
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    return Date.UTC(year, month, lastDay.getUTCDate() - lastDay.getUTCDay(), 1);
  }

  const timestamp = Date.now();
  const year = new Date(timestamp).getUTCFullYear();
  const summer = timestamp >= lastSundayUtc(year, 2) && timestamp < lastSundayUtc(year, 9);
  const today = new Date(timestamp + (summer ? 3600000 : 0)).toISOString().slice(0, 10);

  list.querySelectorAll('[data-valid-until]').forEach((card) => {
    if (card.dataset.validUntil < today) card.remove();
  });

  empty.hidden = list.children.length > 0;
})();
