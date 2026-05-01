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
    const user = await User.create({
      name,
      email,
      password: hashed,
      bio,
      image: imagePath,
      profileCompleted: false
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

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  const safe = user.toObject();
  delete safe.password;
  res.json({ token, user: safe });
});

module.exports = router;