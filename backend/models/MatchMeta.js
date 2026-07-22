const mongoose = require("mongoose");

const matchMetaSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  matchedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MatchMeta", matchMetaSchema);
