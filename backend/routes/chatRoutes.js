const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// GET chat history between two users
router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort("timestamp");
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// POST save a new message
router.post("/", async (req, res) => {
  const { sender, receiver, text } = req.body;
  try {
    const message = await Message.create({ sender, receiver, text });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

module.exports = router;
