require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const {
  getImage,
  getChat,
  getPythonExplanaton,
  correctEngish,
} = require("./Helper/functions");
const { Telegraf } = require("telegraf");
const { default: axios } = require("axios");
// const express = require("express");
// const app = express();

const configuration = new Configuration({
  apiKey: process.env.API,
});
const openai = new OpenAIApi(configuration);
module.exports = openai;

const bot = new Telegraf(process.env.TG_API);
bot.start((ctx) => {
  ctx.reply(
    "Welcome , You can ask anything from me\n\nThis bot can perform the following command \n /image -> to create image from text \n /ask -> ask anything from me \n /en -> to correct your grammer "
  );
  console.log("Bot started");
});

bot.help((ctx) => {
  ctx.reply(
    "This bot can perform following commands \n /image -> to create image from text \n /ask -> ank anything from me \n /en -> To fix grammar in your sentence "
  );
});

// bot.on('text',async(ctx)=>{
//   console.log(ctx)
// })

// Image command
bot.command("image", async (ctx) => {
  const text = ctx.message.text?.replace("/image", "")?.trim().toLowerCase();
  console.log(text);
  if (text) {
    const res = await getImage(text);

    if (res) {
      ctx.sendChatAction("upload_photo");
      // ctx.sendPhoto(res);
      // ctx.telegram.sendPhoto()
      ctx.telegram.sendPhoto(ctx.message.chat.id, res, {
        reply_to_message_id: ctx.message.message_id,
      });
    }else{
      ctx.telegram.sendMessage(ctx.message.chat.id, "I can't generate image for this text", {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "You have to give some description after /image",
      {
        reply_to_message_id: ctx.message.message_id,
      }
    );
  }
});

// Chat command

bot.command("ask", async (ctx) => {
  const text = ctx.message.text?.replace("/ask", "")?.trim().toLowerCase();
  console.log(text);
  console.log(ctx.from)

  if (text) {
    ctx.sendChatAction("typing");
    const res = await getChat(text);
    if (res) {
      ctx.telegram.sendMessage(ctx.message.chat.id, res, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "Please ask anything after /ask",
      {
        reply_to_message_id: ctx.message.message_id,
      }
    );
  }
});
bot.command("en", async (ctx) => {
  const text = ctx.message.text?.replace("/en", "")?.trim().toLowerCase();
  console.log(text);

  if (text) {
    ctx.sendChatAction("typing");
    const res = await correctEngish(text);
    if (res) {
      ctx.telegram.sendMessage(ctx.message.chat.id, res, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "Please ask anything after /en",
      {
        reply_to_message_id: ctx.message.message_id,
      }
    );
  }
});
bot.command("yo", async (ctx) => {
  const text = ctx.message.text?.replace("/yo", "")?.trim().toLowerCase();
  console.log(text);

  const ress = await axios.get("https://api.yomomma.info/");
  console.log(ress.data?.joke);

  ctx.sendChatAction("typing");

  if (ress.data?.joke) {
    ctx.telegram.sendMessage(ctx.message.chat.id, ress.data?.joke, {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});

bot.launch();
