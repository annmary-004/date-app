const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// REGISTER
router.post("/register", upload.single("image"), async (req, res) => {
  const {
    name,
    email,
    password,
    bio
  } = req.body;

  const imagePath = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";

  const hashed = await bcrypt.hash(password, 10);

  try {
    const role = email === "annmarygeorgy18@gmail.com" ? "admin" : "user";
    const user = await User.create({
      name,
      email,
      password: hashed,
      bio,
      image: imagePath,
      profileCompleted: false,
      role,
      lastLogin: new Date()
    });
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ msg: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ msg: "Wrong password" });

  user.lastLogin = new Date();
  // Also retroactively assign admin if they registered earlier
  if (user.email === "annmarygeorgy18@gmail.com" && user.role !== "admin") {
    user.role = "admin";
  }
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  const safe = user.toObject();
  delete safe.password;
  res.json({ token, user: safe });
});

// GOOGLE AUTH
router.post("/google", async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "No access token provided" });
  }

  try {
    // Verify the token with Google
    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error("Google API error:", googleRes.status, errorText);
      return res.status(400).json({ error: "Invalid Google token" });
    }

    const payload = await googleRes.json();
    console.log("Google user info:", payload.email, payload.name);
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: "Google account does not provide an email address." });
    }

    let user = await User.findOne({ email });
    const role = email === "annmarygeorgy18@gmail.com" ? "admin" : "user";

    if (!user) {
      const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashed = await bcrypt.hash(dummyPassword, 10);
      user = await User.create({
        name: name || "Google User",
        email,
        password: hashed,
        image: picture || "",
        profileCompleted: false,
        role,
        lastLogin: new Date()
      });
      console.log("New Google user created:", email);
    } else {
      user.lastLogin = new Date();
      if (user.email === "annmarygeorgy18@gmail.com" && user.role !== "admin") {
        user.role = "admin";
      }
      await user.save();
      console.log("Existing Google user found:", email);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const safe = user.toObject();
    delete safe.password;
    res.json({ token, user: safe });
  } catch (e) {
    console.error("Google auth error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;