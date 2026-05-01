const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  bio: String,
  image: String,
  images: [{ type: String }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  age: { type: Number },
  gender: { type: String, default: "" },
  lookingFor: { type: String, default: "" },
  occupation: { type: String, default: "" },
  education: { type: String, default: "" },
  city: { type: String, default: "" },
  height: { type: String, default: "" },
  interests: [{ type: String }],

  sexualOrientation: { type: String, default: "" },
  showMe: { type: String, default: "" },
  exercise: { type: String, default: "" },
  drinking: { type: String, default: "" },
  smoking: { type: String, default: "" },
  kids: { type: String, default: "" },
  profileCompleted: { type: Boolean, default: false },
  distancePreference: { type: Number, default: 30 },
  minAgePreference: { type: Number, default: 18 },
  maxAgePreference: { type: Number, default: 40 },
  showOnlineStatus: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: false },
  incognitoMode: { type: Boolean, default: false },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("User", userSchema);