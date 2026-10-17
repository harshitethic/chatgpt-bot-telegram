'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createBot } = require('../src/bot');
const { Telegram } = require('telegraf');

function update(number, userId, command) {
  const entity = command.split(' ', 1)[0];
  return {
    update_id: number,
    message: {
      message_id: number,
      date: 1600000000 + number,
      chat: { id: userId, type: 'private', first_name: 'Fixture' },
      from: { id: userId, is_bot: false, first_name: 'Fixture' },
      text: command,
      entities: [{ offset: 0, length: entity.length, type: 'bot_command' }],
    },
  };
}

function fixture(t, ai, limits) {
  const bot = createBot('1234:TEST', ai, { limits });
  bot.botInfo = { id: 1234, is_bot: true, username: 'FixtureBot', first_name: 'Fixture' };
  const messages = [];
  t.mock.method(Telegram.prototype, 'callApi', async (method, payload) => {
    messages.push({ method, payload });
    return { message_id: messages.length, date: 1600000001, chat: payload.chat_id };
  });
  return { bot, messages };
}

test('real Telegram handler refuses duplicate paid requests during an active one', async (t) => {
  let start, finish;
  const entered = new Promise((resolve) => { start = resolve; });
  const running = new Promise((resolve) => { finish = resolve; });
  let textCalls = 0;
  let imageCalls = 0;
  const { bot, messages } = fixture(t, {
    answer: async () => { textCalls++; start(); await running; return 'done'; },
    image: async () => { imageCalls++; return Buffer.from('image'); },
  }, { textPerHour: 1, imagesPerHour: 1, globalConcurrent: 1 });

  const first = bot.handleUpdate(update(1, 42, '/ask explain maps'));
  await entered;
  await bot.handleUpdate(update(2, 42, '/image a landscape'));
  assert.equal(textCalls, 1);
  assert.equal(imageCalls, 0);
  assert.equal(messages.at(-1).method, 'sendMessage');
  assert.match(messages.at(-1).payload.text, /previous AI request/);

  finish();
  await first;
  assert.equal(messages.at(-1).payload.text, 'done');
  await bot.handleUpdate(update(3, 42, '/ask explain queues'));
  assert.equal(textCalls, 1);
  assert.match(messages.at(-1).payload.text, /Hourly limit/);
  await bot.handleUpdate(update(4, 42, '/image a landscape'));
  assert.equal(imageCalls, 1);
  assert.ok(messages.some((message) => message.method === 'sendPhoto'));
});

test('invalid or oversized inputs and invalid Telegram identity do not invoke paid API', async (t) => {
  let called = 0;
  const { bot, messages } = fixture(t, {
    answer: async () => { called++; return 'ok'; },
    image: async () => { called++; return Buffer.from('image'); },
  }, { textPerHour: 1, imagesPerHour: 1, globalConcurrent: 1 });
  await bot.handleUpdate(update(1, 42, '/ask ' + 'x'.repeat(4001)));
  assert.match(messages.at(-1).payload.text, /4,000/);
  await bot.handleUpdate(update(2, 42, '/ask'));
  assert.match(messages.at(-1).payload.text, /Usage/);
  const noUser = update(3, 42, '/ask secret');
  delete noUser.message.from;
  await bot.handleUpdate(noUser);
  assert.match(messages.at(-1).payload.text, /Cannot verify/);
  assert.equal(called, 0);
});

test('global concurrency saturation rejects another user and releases after failure', async (t) => {
  let entered, release;
  const started = new Promise((resolve) => { entered = resolve; });
  const pending = new Promise((resolve) => { release = resolve; });
  const { bot, messages } = fixture(t, {
    answer: async () => { entered(); await pending; throw new Error('PRIVATE_UPSTREAM_TOKEN'); },
    image: async () => Buffer.from('image'),
  }, { textPerHour: 1, imagesPerHour: 1, globalConcurrent: 1 });
  const first = bot.handleUpdate(update(1, 1, '/ask some question'));
  await started;
  await bot.handleUpdate(update(2, 2, '/ask another question'));
  assert.match(messages.at(-1).payload.text, /bot is busy/);
  release();
  await first;
  assert.doesNotMatch(messages.at(-1).payload.text, /PRIVATE_UPSTREAM_TOKEN/);
  // A failed upstream attempt still consumes its hourly credit.
  await bot.handleUpdate(update(4, 1, '/ask retry after failure'));
  assert.match(messages.at(-1).payload.text, /Hourly limit/);
  await bot.handleUpdate(update(3, 2, '/image test'));
  assert.ok(messages.some((x) => x.method === 'sendPhoto'));
});
