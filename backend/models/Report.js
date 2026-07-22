const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, default: "Inappropriate behavior" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", reportSchema);
