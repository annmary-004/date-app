const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, default: "" },
  messageType: { type: String, enum: ["text", "image", "video", "voice", "location"], default: "text" },
  mediaUrl: { type: String, default: "" },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
