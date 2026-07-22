const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  const userId = req.headers["user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/admin/stats
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    
    // Active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({
      role: "user",
      lastLogin: { $gte: today }
    });

    res.json({
      totalUsers,
      activeToday
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
