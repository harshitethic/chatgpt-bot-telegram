const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false)
    const { connection } = await mongoose.connect(process.env.URI);
    logger.log(`Database connected `);
  } catch (error) {}
};

module.exports = connectDB;
