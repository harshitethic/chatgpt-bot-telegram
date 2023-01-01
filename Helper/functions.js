const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.API,
});

const openai = new OpenAIApi(configuration);

// Generate image from prompt
const getImage = async (text) => {
  try {
    const response = await openai.createImage({
      prompt: text,
      n: 1,
      size: "512x512",
    });

    return response.data.data[0].url;
  } catch (error) {
    console.log(error);
  }
};
// Generate answer from prompt
const getChat = async (text) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      temperature: 0,
      max_tokens: 500,
    });

    return response.data.choices[0].text;
  } catch (error) {
    console.log(error);
  }
};

// Convert to standard english
const correctEngish = async (text) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Correct this to standard English: /n${text}`,
      temperature: 0,
      max_tokens: 1000,
     
    });

    return response.data.choices[0].text;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { openai, getImage, getChat, correctEngish };
