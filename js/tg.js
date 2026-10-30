/* Turns whatever the admin typed (phone, @username, or t.me link) into a Telegram link. */
window.TG = (function () {
  function url(raw, text) {
    raw = String(raw || '').trim();
    if (!raw) return '';
    let u;
    if (/^https?:\/\//i.test(raw)) u = raw;
    else if (/^t\.me\//i.test(raw)) u = 'https://' + raw;
    else if (/^\+?[\d\s\-().]{7,}$/.test(raw)) {
      let d = raw.replace(/[^\d+]/g, '');
      if (d[0] === '+') d = d.slice(1);
      else if (d[0] === '0') d = '62' + d.slice(1); // local Indonesian format -> +62
      return 'https://t.me/+' + d; // phone links cannot carry a prefilled message
    } else u = 'https://t.me/' + raw.replace(/^@/, '');
    // prefilled message works for username links only
    if (text && /^https:\/\/t\.me\/[A-Za-z0-9_]{4,}$/i.test(u)) u += '?text=' + encodeURIComponent(text);
    return u;
  }
  return { url };
})();
