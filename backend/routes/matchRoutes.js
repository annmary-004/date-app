const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/like", async (req, res) => {
  const { userId, targetId } = req.body;

  const user = await User.findById(userId);
  const target = await User.findById(targetId);

  if (!user.likes.includes(targetId)) {
    user.likes.push(targetId);
    await user.save();
  }

  if (target.likes.includes(userId)) {
    user.matches.push(targetId);
    target.matches.push(userId);

    await user.save();
    await target.save();

    return res.json({ match: true });
  }

  res.json({ match: false });
});

module.exports = router;