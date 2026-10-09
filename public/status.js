// Live "Open now / Closed" status in UK time, and today's special-hours banner.
// Without JavaScript the page simply shows the normal opening hours.
(function () {
  const body = document.body;
  const normalOpens = body.dataset.opens;
  const normalCloses = body.dataset.closes;
  if (!normalOpens || !normalCloses) return;

  function labelFor(time) {
    const parts = time.split(':').map(Number);
    const suffix = parts[0] >= 12 ? 'pm' : 'am';
    const hour = parts[0] % 12 || 12;
    return parts[1] ? hour + ':' + String(parts[1]).padStart(2, '0') + suffix : hour + suffix;
  }

  function minutesOf(time) {
    const parts = time.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }

  function now() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type).value;
    return { date: get('year') + '-' + get('month') + '-' + get('day'), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function update() {
    const current = now();
    let opens = normalOpens;
    let closes = normalCloses;
    let closedToday = false;
    let note = '';

    // Special hours for today (a bank holiday, for example) replace the normal hours.
    document.querySelectorAll('[data-special]').forEach((banner) => {
      const active = banner.dataset.from <= current.date && current.date <= banner.dataset.to;
      banner.hidden = !active;
      if (!active) return;
      note = banner.dataset.label;
      if (banner.dataset.closed === 'true') closedToday = true;
      else {
        opens = banner.dataset.opens;
        closes = banner.dataset.closes;
      }
    });

    let text;
    let state;
    if (closedToday) {
      text = 'Closed today' + (note ? ' · ' + note : '');
      state = 'closed';
    } else if (current.minutes >= minutesOf(opens) && current.minutes < minutesOf(closes)) {
      text = 'Open now · closes ' + labelFor(closes);
      state = 'open';
    } else {
      text = 'Closed · opens ' + labelFor(current.minutes < minutesOf(opens) ? opens : normalOpens);
      state = 'closed';
    }

    document.querySelectorAll('[data-open-status]').forEach((element) => {
      element.textContent = text;
      const wrapper = element.closest('[data-open-wrapper]');
      if (!wrapper) return;
      wrapper.dataset.state = state;
      wrapper.hidden = false;
    });
  }

  update();
  setInterval(update, 60000);
})();
