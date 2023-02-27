const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.API,
});

const openai = new OpenAIApi(configuration);

const getImage = async text => {
  console.log('Getting image for criteria: ', text);
  try {
    const response = await openai.createImage({
      prompt: text,
      n: 1,
      size: '512x512',
    });

    return response.data.data[0].url;
  } catch (error) {
    console.log(error);
  }
};

const getChat = async text => {
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: text,
      temperature: 0.8,
      max_tokens: 3800,
    });

    return response.data.choices[0].text;
  } catch (error) {
    //Print the error message
    console.error(error);
  }
};
module.exports = { openai, getImage, getChat };
