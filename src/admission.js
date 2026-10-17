'use strict';

const WINDOW_MS = 60 * 60 * 1000;

function boundedSetting(value, fallback, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new Error('Invalid bot usage-limit configuration');
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > maximum) {
    throw new Error('Invalid bot usage-limit configuration');
  }
  return number;
}

function limitsFromEnv(env = process.env) {
  return {
    textPerHour: boundedSetting(env.BOT_MAX_TEXT_PER_HOUR, 5, 100),
    imagesPerHour: boundedSetting(env.BOT_MAX_IMAGES_PER_HOUR, 1, 10),
    globalConcurrent: boundedSetting(env.BOT_MAX_CONCURRENT, 3, 16),
    trackedUsers: boundedSetting(env.BOT_MAX_TRACKED_USERS, 4096, 65536),
  };
}

function createRequestLimiter(options = {}) {
  const {
    textPerHour = 5,
    imagesPerHour = 1,
    globalConcurrent = 3,
    trackedUsers = 4096,
    now = Date.now,
  } = options;

  for (const [value, max] of [
    [textPerHour, 100], [imagesPerHour, 10],
    [globalConcurrent, 16], [trackedUsers, 65536],
  ]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > max) {
      throw new Error('Invalid bot usage-limit configuration');
    }
  }
  if (typeof now !== 'function') throw new TypeError('Clock must be a function');

  const users = new Map();
  let active = 0;

  function pruneIdle(cutoff) {
    for (const [id, entry] of users) {
      if (!entry.active && entry.text.every((x) => x <= cutoff) &&
          entry.image.every((x) => x <= cutoff)) {
        users.delete(id);
      }
    }
  }

  return {
    acquire(id, kind) {
      if (!Number.isSafeInteger(id) || id <= 0 ||
          (kind !== 'text' && kind !== 'image')) {
        return { allowed: false, reason: 'invalid' };
      }
      const timestamp = now();
      if (!Number.isFinite(timestamp)) return { allowed: false, reason: 'invalid' };
      const cutoff = timestamp - WINDOW_MS;
      const existing = users.get(id);
      if (existing?.active) return { allowed: false, reason: 'active' };
      if (active >= globalConcurrent) return { allowed: false, reason: 'busy' };

      if (!existing && users.size >= trackedUsers) pruneIdle(cutoff);
      if (!existing && users.size >= trackedUsers) {
        return { allowed: false, reason: 'capacity' };
      }
      const entry = existing || { text: [], image: [], active: false };
      entry.text = entry.text.filter((x) => x > cutoff);
      entry.image = entry.image.filter((x) => x > cutoff);
      const requests = entry[kind];
      if (requests.length >= (kind === 'text' ? textPerHour : imagesPerHour)) {
        return { allowed: false, reason: 'rate' };
      }
      if (!existing) users.set(id, entry);
      requests.push(timestamp); // Billed at admission even if upstream fails.
      entry.active = true;
      active++;
      let released = false;
      return {
        allowed: true,
        release() {
          if (released) return;
          released = true;
          entry.active = false;
          active--;
        },
      };
    },
  };
}

module.exports = { createRequestLimiter, limitsFromEnv };
