'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequestLimiter, limitsFromEnv } = require('../src/admission');

test('per-user text and image hourly windows are independent and expire', () => {
  let now = 0;
  const limiter = createRequestLimiter({
    now: () => now, textPerHour: 2, imagesPerHour: 1, globalConcurrent: 2,
  });
  for (const kind of ['text', 'text', 'image']) {
    const ticket = limiter.acquire(42, kind);
    assert.equal(ticket.allowed, true, kind);
    ticket.release();
  }
  assert.equal(limiter.acquire(42, 'text').reason, 'rate');
  assert.equal(limiter.acquire(42, 'image').reason, 'rate');
  const other = limiter.acquire(43, 'text');
  assert.equal(other.allowed, true);
  other.release();
  now = 60 * 60 * 1000 + 1;
  const reopened = limiter.acquire(42, 'image');
  assert.equal(reopened.allowed, true);
  reopened.release();
});

test('one active request per user across commands and global capacity three', () => {
  const limiter = createRequestLimiter({ globalConcurrent: 3 });
  const a = limiter.acquire(1, 'text');
  const b = limiter.acquire(2, 'image');
  const c = limiter.acquire(3, 'text');
  assert.equal(a.allowed, true);
  assert.equal(b.allowed, true);
  assert.equal(c.allowed, true);
  assert.equal(limiter.acquire(1, 'image').reason, 'active');
  assert.equal(limiter.acquire(4, 'text').reason, 'busy');
  a.release();
  a.release(); // idempotent even if finally/cleanup path repeats.
  assert.equal(limiter.acquire(4, 'text').allowed, true);
  b.release();
  c.release();
});

test('limits cap tracked identities and prune expired idle entries', () => {
  let now = 5;
  const limiter = createRequestLimiter({
    now: () => now, trackedUsers: 2, globalConcurrent: 3,
  });
  const a = limiter.acquire(1, 'text');
  const b = limiter.acquire(2, 'text');
  assert.equal(limiter.acquire(3, 'text').reason, 'capacity');
  a.release();
  b.release();
  assert.equal(limiter.acquire(3, 'text').reason, 'capacity');
  now += 3600001;
  const c = limiter.acquire(3, 'text');
  assert.equal(c.allowed, true);
  c.release();
});

test('missing, invalid identities and invalid kinds fail closed', () => {
  const limiter = createRequestLimiter();
  for (const id of [undefined, null, '', 'garbage', -1, 0, NaN, 1.2]) {
    assert.equal(limiter.acquire(id, 'text').reason, 'invalid');
  }
  assert.equal(limiter.acquire(2, 'unknown').reason, 'invalid');
});

test('config validates all budgets and never treats zero or nonsense as unlimited', () => {
  assert.deepEqual(limitsFromEnv({}), {
    textPerHour: 5, imagesPerHour: 1, globalConcurrent: 3, trackedUsers: 4096,
  });
  assert.deepEqual(limitsFromEnv({
    BOT_MAX_TEXT_PER_HOUR: '4',
    BOT_MAX_IMAGES_PER_HOUR: '2',
    BOT_MAX_CONCURRENT: '1',
    BOT_MAX_TRACKED_USERS: '8',
  }), { textPerHour: 4, imagesPerHour: 2, globalConcurrent: 1, trackedUsers: 8 });
  for (const [key, value] of [
    ['BOT_MAX_TEXT_PER_HOUR', '0'],
    ['BOT_MAX_IMAGES_PER_HOUR', '9999'],
    ['BOT_MAX_CONCURRENT', 'NaN'],
    ['BOT_MAX_TRACKED_USERS', '-5'],
  ]) {
    assert.throws(() => limitsFromEnv({ [key]: value }), /configuration/);
  }
});

test('entrypoint refuses invalid usage budgets before creating a network bot', () => {
  const { start } = require('../index');
  assert.throws(() => start({
    OPENAI_API_KEY: 'fake_for_offline_test',
    TELEGRAM_BOT_TOKEN: '11111:fake_for_offline_test',
    BOT_MAX_IMAGES_PER_HOUR: '0',
  }), /configuration/);
});
