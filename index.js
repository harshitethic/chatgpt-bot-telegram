require("dotenv").config();
const { Telegraf } = require("telegraf");

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.API,
});
const openai = new OpenAIApi(configuration);

const bot = new Telegraf(process.env.TG_API);
bot.start((ctx) => ctx.reply("Welcome , You can ask anything from me"));

bot.on("text", async (ctx) => {
  try {
    if (ctx.message.text) {
      ctx.sendChatAction("typing");
      
      const res = await generateText(ctx.message.text);

      if (res.image) {
        ctx.sendPhoto(res.imageUrl);
      }
      console.log(res);
      console.log(ctx.message.text);
      console.log(ctx.message.from);

      await ctx.reply(res);
    }
  } catch (error) {}
});

const generateText = async (slackText) => {
  if (slackText.startsWith("/img")) {
    const text = slackText?.replace("/img", "")?.trim().toLowerCase();

    const response = await openai.createImage({
      prompt: text,
      n: 1,
      size: "512x512",
    });
    const obj = {
      image: true,
      imageUrl: response.data.data[0].url,
    };
    return obj;
  }
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: slackText,
      temperature: 0,

      max_tokens: 1000,
    });

    return response.data.choices[0].text;
  } catch (error) {
    console.log(error);
  }
};

bot.launch();
