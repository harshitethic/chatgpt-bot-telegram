const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  groupId: { type: String },
  title: {
    type: String,
  },
});

module.exports = mongoose.model("Groups", Schema);
