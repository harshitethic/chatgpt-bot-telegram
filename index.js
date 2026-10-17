'use strict';

require('dotenv').config();
const OpenAI = require('openai');
const { createAiService } = require('./src/ai');
const { createBot } = require('./src/bot');
const { limitsFromEnv } = require('./src/admission');

function start(env = process.env) {
  if (!env.OPENAI_API_KEY || !env.TELEGRAM_BOT_TOKEN) {
    throw new Error(
      'Missing OPENAI_API_KEY or TELEGRAM_BOT_TOKEN. Copy .env.example to .env and set both.'
    );
  }

  const limits = limitsFromEnv(env);
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const ai = createAiService(client, {
    textModel: env.OPENAI_TEXT_MODEL,
    imageModel: env.OPENAI_IMAGE_MODEL,
  });
  const bot = createBot(env.TELEGRAM_BOT_TOKEN, ai, { limits });
  bot.launch().catch((err) => {
    console.error('Unable to start Telegram bot:', err?.code || err?.message || 'unknown');
    process.exitCode = 1;
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  return bot;
}

if (require.main === module) {
  try { start(); }
  catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
module.exports = { start };
