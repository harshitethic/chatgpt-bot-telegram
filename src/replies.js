'use strict';

const LIMIT = 4096;
const MAX_PARTS = 4;
const NOTICE = '\n\n[Reply shortened after four messages.]';

function splitTelegramReply(text) {
  if (typeof text !== 'string' || !text.length) throw new TypeError('Text is required');
  const parts = [];
  let offset = 0;
  while (offset < text.length && parts.length < MAX_PARTS) {
    const last = parts.length === MAX_PARTS - 1;
    const truncating = last && text.length - offset > LIMIT;
    const cap = LIMIT - (truncating ? NOTICE.length : 0);
    let end = Math.min(text.length, offset + cap);
    if (end < text.length) {
      const lastCode = text.charCodeAt(end - 1);
      if (lastCode >= 0xD800 && lastCode <= 0xDBFF) end--;
    }
    const slice = text.slice(offset, end);
    parts.push(slice + (last && end < text.length ? NOTICE : ''));
    offset = end;
  }
  return parts;
}

module.exports = { splitTelegramReply, LIMIT, MAX_PARTS, NOTICE };
