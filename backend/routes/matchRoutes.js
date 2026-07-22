const express = require("express");
const router = express.Router();
const User = require("../models/User");
const MatchMeta = require("../models/MatchMeta");

router.post("/like", async (req, res) => {
  const { userId, targetId } = req.body;

  const user = await User.findById(userId);
  const target = await User.findById(targetId);

  if (!user.likes.includes(targetId)) {
    user.likes.push(targetId);
    await user.save();
  }

  const isUserPremium = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();
  const isTargetPremium = target.subscriptionExpiresAt && new Date(target.subscriptionExpiresAt) > new Date();

  if (target.likes.includes(userId)) {
    if (!user.matches.includes(targetId)) {
      // Enforce 25 matches limit for free users
      if (!isUserPremium && user.matches.length >= 25) {
        return res.status(400).json({ error: "Match Limit Reached: Free accounts can have a maximum of 25 matches. Please upgrade to Premium to unlock unlimited matches!" });
      }
      if (!isTargetPremium && target.matches.length >= 25) {
        return res.status(400).json({ error: "Could not match. The other user has reached the maximum free match limit." });
      }

      user.matches.push(targetId);
      target.matches.push(userId);

      await user.save();
      await target.save();

      // Log match time
      await MatchMeta.create({ users: [userId, targetId] });
    }

    return res.json({ match: true });
  }

  res.json({ match: false });
});

module.exports = router;