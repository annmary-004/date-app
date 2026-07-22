const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
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

// GET chat history between two users
router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const senderUser = await User.findById(user1);
    const receiverUser = await User.findById(user2);
    
    if (!senderUser || !receiverUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if they are matched
    const senderMatches = senderUser.matches.map(id => id.toString());
    if (!senderMatches.includes(user2.toString())) {
      return res.status(403).json({ error: "Access denied. Not matched." });
    }

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
router.post("/", upload.single("media"), async (req, res) => {
  const { sender, receiver, text } = req.body;
  try {
    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);
    
    if (!senderUser || !receiverUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Strict Check: Must be mutually matched
    const senderMatches = senderUser.matches.map(id => id.toString());
    const receiverMatches = receiverUser.matches.map(id => id.toString());

    if (!senderMatches.includes(receiver.toString()) || !receiverMatches.includes(sender.toString())) {
      return res.status(403).json({ error: "You can only chat with mutually matched users." });
    }

    // Chat validity check: Expiration after 2 days
    const firstMessage = await Message.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort("timestamp");

    if (firstMessage) {
      const msSinceFirstMessage = Date.now() - new Date(firstMessage.timestamp).getTime();
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000; // 5 days expiration
      if (msSinceFirstMessage > fiveDaysMs) {
        const isSubscriptionActive = senderUser.subscriptionExpiresAt && new Date(senderUser.subscriptionExpiresAt) > new Date();
        if (!isSubscriptionActive) {
          return res.status(403).json({ error: "Chat expired after 5 days. Subscribe to continue." });
        }
      }
    }

    const mediaUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";
    const type = req.body.messageType || "text";

    const message = await Message.create({ 
      sender, 
      receiver, 
      text: text || "", 
      messageType: type,
      mediaUrl 
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to save message" });
  }
});


// PUT edit a message (5 mins limit)
router.put("/:msgId", async (req, res) => {
  try {
    const { text } = req.body;
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    const msDiff = Date.now() - new Date(msg.timestamp).getTime();
    if (msDiff > 5 * 60 * 1000) {
      return res.status(403).json({ error: "Cannot edit message after 5 minutes" });
    }

    msg.text = text;
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();
    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: "Failed to edit message" });
  }
});

// DELETE soft delete a message (DISABLED)
router.delete("/:msgId", async (req, res) => {
  return res.status(403).json({ error: "Message deletion is not allowed on Heartly." });
});

module.exports = router;
