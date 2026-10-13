'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePrompt, assertPrompt, createAiService } = require('../src/ai');
const { commandPayload, errorMessage } = require('../src/commands');
const { createBot } = require('../src/bot');

test('prompt normalization trims whitespace and preserves casing', () => {
  assert.equal(normalizePrompt('  Hello World  '), 'Hello World');
  assert.equal(normalizePrompt(null), '');
  assert.throws(() => assertPrompt('   '), TypeError);
  assert.throws(() => assertPrompt('x'.repeat(4001)), RangeError);
});

test('command parser supports bot mentions without swallowing prose', () => {
  assert.equal(commandPayload('/ask@My_Bot   Hello World', 'ask'), 'Hello World');
  assert.equal(commandPayload('/ask a question', 'ask'), 'a question');
  assert.equal(commandPayload('/ask', 'ask'), '');
  assert.equal(commandPayload('Hello /ask a question', 'ask'), '');
  assert.equal(commandPayload('/asking unrelated', 'ask'), '');
});

test('text generation uses current Responses API and selected model', async () => {
  const requests = [];
  const client = {
    responses: { create: async (r) => { requests.push(r); return { output_text: '  Done  ' }; } },
    images: { generate: async () => ({ data: [{ b64_json: 'aGk=' }] }) },
  };
  const ai = createAiService(client, { textModel: 'test-text' });
  assert.equal(await ai.answer('  Input  '), 'Done');
  assert.deepEqual(requests, [{ model: 'test-text', input: 'Input' }]);
});

test('empty AI output fails rather than sending an empty Telegram message', async () => {
  const client = {
    responses: { create: async () => ({ output_text: '' }) },
    images: { generate: async () => ({ data: [] }) },
  };
  const ai = createAiService(client);
  await assert.rejects(() => ai.answer('hello'), /no text/);
  await assert.rejects(() => ai.image('hello'), /no image/);
});

test('image output is decoded into a buffer', async () => {
  const client = {
    responses: { create: async () => ({ output_text: 'ok' }) },
    images: { generate: async (r) => {
      assert.equal(r.model, 'gpt-image-1');
      return { data: [{ b64_json: 'aGk=' }] };
    } },
  };
  const ai = createAiService(client);
  assert.equal((await ai.image('a tree')).toString(), 'hi');
});

test('service and bot reject missing dependencies', () => {
  assert.throws(() => createAiService({}), /compatible OpenAI client/);
  assert.throws(() => createBot('', { answer() {}, image() {} }), /TOKEN/);
  assert.equal(errorMessage(new RangeError('too long')).includes('4,000'), true);
  assert.equal(errorMessage(new Error('secret-token')).includes('secret-token'), false);
});
