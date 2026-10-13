'use strict';

const { Telegraf } = require('telegraf');
const { commandPayload, errorMessage } = require('./commands');

function createBot(token, ai) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }
  if (!ai || typeof ai.answer !== 'function' || typeof ai.image !== 'function') {
    throw new TypeError('An AI service is required');
  }

  const bot = new Telegraf(token);
  bot.start((ctx) => ctx.reply('Hi! Use /ask <question> or /image <description>.'));
  bot.help((ctx) => ctx.reply(
    '/ask <question> — ask the AI a question\n/image <description> — generate an image'
  ));

  bot.command('ask', async (ctx) => {
    const prompt = commandPayload(ctx.message?.text, 'ask');
    if (!prompt) return ctx.reply('Usage: /ask What is a hash map?');
    try {
      await ctx.sendChatAction('typing');
      const reply = await ai.answer(prompt);
      // Telegram's sendMessage limit is 4096 characters.
      return ctx.reply(reply.slice(0, 4096));
    } catch (err) {
      console.error('Text request failed:', err?.status || err?.code || 'unknown');
      return ctx.reply(errorMessage(err));
    }
  });

  bot.command('image', async (ctx) => {
    const prompt = commandPayload(ctx.message?.text, 'image');
    if (!prompt) return ctx.reply('Usage: /image a neon city at night');
    try {
      await ctx.sendChatAction('upload_photo');
      const image = await ai.image(prompt);
      return ctx.replyWithPhoto({ source: image, filename: 'generated.png' });
    } catch (err) {
      console.error('Image request failed:', err?.status || err?.code || 'unknown');
      return ctx.reply(errorMessage(err));
    }
  });

  return bot;
}
module.exports = { createBot };
