const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  userId: { type: String },
  username: { type: String },
  name: {
    type: String,
  },
  useCount: { type: Number },
  language_code: { type: String },
  is_premium_user: { type: Boolean, default: false },
  groups: { type: Array },
});

module.exports = mongoose.model("Users", Schema);
