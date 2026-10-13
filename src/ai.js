'use strict';

/**
 * Isolate OpenAI API calls so command handlers can be tested without making
 * network requests or creating real Telegram/OpenAI credentials.
 */
function normalizePrompt(input) {
  if (typeof input !== 'string') return '';
  return input.trim();
}

function assertPrompt(input) {
  const prompt = normalizePrompt(input);
  if (!prompt) throw new TypeError('A non-empty prompt is required');
  if (prompt.length > 4000) throw new RangeError('Prompt must be at most 4000 characters');
  return prompt;
}

function createAiService(client, options = {}) {
  if (!client || typeof client.responses?.create !== 'function' ||
      typeof client.images?.generate !== 'function') {
    throw new TypeError('A compatible OpenAI client is required');
  }

  const textModel = options.textModel || 'gpt-4.1-mini';
  const imageModel = options.imageModel || 'gpt-image-1';

  return {
    async answer(question) {
      const response = await client.responses.create({
        model: textModel,
        input: assertPrompt(question),
      });
      const result = response?.output_text?.trim();
      if (!result) throw new Error('The model returned no text');
      return result;
    },

    async image(description) {
      const response = await client.images.generate({
        model: imageModel,
        prompt: assertPrompt(description),
        size: '1024x1024',
      });
      const base64 = response?.data?.[0]?.b64_json;
      if (!base64 || typeof base64 !== 'string') {
        throw new Error('The image API returned no image data');
      }
      return Buffer.from(base64, 'base64');
    },
  };
}

module.exports = { assertPrompt, normalizePrompt, createAiService };
