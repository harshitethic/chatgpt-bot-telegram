require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const { getImage, getChat } = require('./Helper/functions');
const { Telegraf } = require('telegraf');

const configuration = new Configuration({
  apiKey: process.env.API,
});
const openai = new OpenAIApi(configuration);
module.exports = openai;

const bot = new Telegraf(process.env.TG_API);
const notAllowed = 'You are not allowed to use this bot.';
bot.start(ctx => ctx.reply('Welcome, You can ask anything from me. Type /help if you want to know more'));

bot.help(ctx => {
  ctx.reply('This bot can perform the following command \n /image -> to create image from text 🖼 \n /ask -> ask anything from me 🤓');
});

// Image command
bot.command('image', async ctx => {
  const text = ctx.message.text?.replace('/image', '')?.trim().toLowerCase();
  //Get the user ID and compare with the Telegram ID in the env
  const userId = ctx.message.from.id;
  const userAllowed = process.env.TELEGRAM_ID;
  if (userAllowed && userId != userAllowed) {
    ctx.telegram.sendMessage(ctx.message.chat.id, notAllowed, {
      reply_to_message_id: ctx.message.message_id,
    });
    return;
  }
  if (text) {
    const res = await getImage(text);

    if (res) {
      ctx.sendChatAction('upload_photo');
      // ctx.sendPhoto(res);
      // ctx.telegram.sendPhoto()
      ctx.telegram.sendPhoto(ctx.message.chat.id, res, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    ctx.telegram.sendMessage(ctx.message.chat.id, 'You have to give some description after /image', {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});

// Chat command

bot.command('ask', async ctx => {
  const text = ctx.message.text?.replace('/ask', '')?.trim().toLowerCase();
  const userId = ctx.message.from.id;
  const userAllowed = process.env.TELEGRAM_ID;
  if (userAllowed && userId != userAllowed) {
    ctx.telegram.sendMessage(ctx.message.chat.id, notAllowed, {
      reply_to_message_id: ctx.message.message_id,
    });
    return;
  }
  if (text) {
    ctx.sendChatAction('typing');
    const res = await getChat(text);
    if (res) {
      ctx.telegram.sendMessage(ctx.message.chat.id, res, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Please ask anything after /ask', {
      reply_to_message_id: ctx.message.message_id,
    });

    //  reply("Please ask anything after /ask");
  }
});

bot.launch();
console.log('🚀 Bot started...');
