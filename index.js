require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const { getImage, getChat } = require('./Helper/functions');
const { Telegraf } = require('telegraf');
const { usersAllowed } = require('./users');

const configuration = new Configuration({
  apiKey: process.env.API,
});
const openai = new OpenAIApi(configuration);
module.exports = openai;

const bot = new Telegraf(process.env.TG_API);
const notAllowed = '🚫 No estás autorizado a usar este bot.';
const functionNotAvailable = '😕 Esta función está deshabilitada por el momento, pero pronto...😉';
bot.start(ctx => ctx.reply('🤩 Bienvenido, soy el bot de ChatGPT para Telegram 💪; me puedes preguntar lo que quieras, pero no seas demasiado ambiguo ni genérico. Tampoco hagas preguntas muy largas. No recuerdo la conversación; solo respondo una pregunta a la vez así que no trates de "conversar" conmigo, porque no lo haré 😒. Envía /ask y luego tu pregunta.'));

bot.help(ctx => {
  ctx.reply('This bot can perform the following command \n /image -> to create image from text 🖼 \n /ask -> ask anything from me 🤓');
});

// Image command
bot.command('image', async ctx => {
  const text = ctx.message.text?.replace('/image', '')?.trim().toLowerCase();
  //Get the user ID and compare with the Telegram ID in the env
  const userId = ctx.message.from.id;
  const userAllowed = usersAllowed.find(user => user == userId);
  if (!userAllowed) {
    ctx.telegram.sendMessage(ctx.message.chat.id, notAllowed, {
      reply_to_message_id: ctx.message.message_id,
    });
    return;
  }
  ctx.telegram.sendMessage(ctx.message.chat.id, functionNotAvailable, {
    reply_to_message_id: ctx.message.message_id,
  });
  return;
  //Esto estará deshabilitado porque por el momento no vamos a brindar la posibilidad de buscar imágenes, además de que deja mucho qué deseas la API.
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
  const userAllowed = usersAllowed.find(user => user == userId);
  if (!userAllowed) {
    ctx.telegram.sendMessage(ctx.message.chat.id, notAllowed, {
      reply_to_message_id: ctx.message.message_id,
    });
    return;
  }
  if (text) {
    ctx.sendChatAction('typing');
    console.log(`User ${ctx.message.from.first_name} asked: ${text}`);
    const res = await getChat(text);
    if (res) {
      ctx.telegram.sendMessage(ctx.message.chat.id, res, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Por favor, pregunta algo después del comando /ask', {
      reply_to_message_id: ctx.message.message_id,
    });

    //  reply("Please ask anything after /ask");
  }
});

bot.launch();
console.log('🚀 Bot started...');
