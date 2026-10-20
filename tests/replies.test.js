'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { splitTelegramReply, LIMIT, MAX_PARTS, NOTICE } = require('../src/replies');

test('short responses use one Telegram message', () => {
  assert.deepEqual(splitTelegramReply('Hello!'), ['Hello!']);
});

test('long responses are split without losing text', () => {
  const text = 'A'.repeat(9000);
  const parts = splitTelegramReply(text);
  assert.equal(parts.length, 3);
  assert.ok(parts.every((part) => part.length <= LIMIT));
  assert.equal(parts.join(''), text);
});

test('never splits an emoji surrogate pair at the 4096-character boundary', () => {
  const text = 'x'.repeat(LIMIT - 1) + '😊' + 'y'.repeat(5);
  const parts = splitTelegramReply(text);
  assert.equal(parts[0], 'x'.repeat(LIMIT - 1));
  assert.equal(parts[1], '😊' + 'y'.repeat(5));
  assert.equal(parts.join(''), text);
});

test('caps extreme responses and visibly indicates the truncation', () => {
  const parts = splitTelegramReply('x'.repeat(100_000));
  assert.equal(parts.length, MAX_PARTS);
  assert.ok(parts.every((part) => part.length <= LIMIT));
  assert.ok(parts.at(-1).endsWith(NOTICE));
});

test('rejects empty and non-text responses', () => {
  assert.throws(() => splitTelegramReply(''), TypeError);
  assert.throws(() => splitTelegramReply(undefined), TypeError);
});
