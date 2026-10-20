'use strict';

const { Telegraf } = require('telegraf');
const { commandPayload, errorMessage } = require('./commands');
const { assertPrompt } = require('./ai');
const { splitTelegramReply } = require('./replies');
const { createRequestLimiter } = require('./admission');

function createBot(token, ai, options = {}) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }
  if (!ai || typeof ai.answer !== 'function' || typeof ai.image !== 'function') {
    throw new TypeError('An AI service is required');
  }

  const limiter = options.limiter || createRequestLimiter(options.limits);
  const bot = new Telegraf(token);

  async function guardedRequest(ctx, kind, prompt) {
    // Validate locally before consuming an allowance or invoking the provider.
    try {
      assertPrompt(prompt);
    } catch (err) {
      return ctx.reply(errorMessage(err));
    }
    const ticket = limiter.acquire(ctx.from?.id, kind);
    if (!ticket.allowed) {
      const messages = {
        rate: 'Hourly limit reached for this command. Please try again later.',
        active: 'Your previous AI request is still running. Try again shortly.',
        busy: 'The bot is busy. Please try again shortly.',
        capacity: 'The bot has reached its usage capacity. Please try again later.',
        invalid: 'Cannot verify your Telegram user ID for this request.',
      };
      return ctx.reply(messages[ticket.reason] || 'Request unavailable.');
    }
    try {
      await ctx.sendChatAction(kind === 'text' ? 'typing' : 'upload_photo');
      if (kind === 'text') {
        const reply = await ai.answer(prompt);
        let sent;
        for (const part of splitTelegramReply(reply)) {
          sent = await ctx.reply(part);
        }
        return sent;
      }
      const image = await ai.image(prompt);
      return await ctx.replyWithPhoto({ source: image, filename: 'generated.png' });
    } catch (err) {
      console.error('AI request failed:', err?.status || err?.code || 'unknown');
      return await ctx.reply(errorMessage(err));
    } finally {
      ticket.release();
    }
  }
  bot.start((ctx) => ctx.reply('Hi! Use /ask <question> or /image <description>.'));
  bot.help((ctx) => ctx.reply(
    '/ask <question> — ask the AI a question\n/image <description> — generate an image'
  ));

  bot.command('ask', (ctx) => {
    const prompt = commandPayload(ctx.message?.text, 'ask');
    if (!prompt) return ctx.reply('Usage: /ask What is a hash map?');
    return guardedRequest(ctx, 'text', prompt);
  });

  bot.command('image', (ctx) => {
    const prompt = commandPayload(ctx.message?.text, 'image');
    if (!prompt) return ctx.reply('Usage: /image a neon city at night');
    return guardedRequest(ctx, 'image', prompt);
  });

  return bot;
}
module.exports = { createBot };
