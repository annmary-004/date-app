const express = require("express");
const router = express.Router();
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

// Get users for swiping
router.get("/swipe/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    // Users not already liked or matched, and not self, and not blocked
    const interactedIds = [
      ...(currentUser.likes || []),
      ...(currentUser.matches || []),
      ...(currentUser.blockedUsers || []),
      currentUser._id
    ];
    
    // Also exclude users who have blocked the current user
    const pool = await User.find({ 
      _id: { $nin: interactedIds },
      blockedUsers: { $ne: currentUser._id }
    }).select("-password");
    res.json(pool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user matches
router.get("/matches/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "matches",
      "name image bio age gender lookingFor occupation education city height interests sexualOrientation showMe exercise drinking smoking kids"
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user profile
router.get("/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");
        if(!user) return res.status(404).json({ msg: "User doesn't exist" });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update onboarding/profile details
router.put("/profile/:userId", async (req, res) => {
  try {
    const allowed = [
      "age",
      "gender",
      "sexualOrientation",
      "showMe",
      "lookingFor",
      "occupation",
      "education",
      "city",
      "height",
      "exercise",
      "drinking",
      "smoking",
      "kids",
      "bio",
      "interests"
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (typeof updates.age === "string") {
      const ageNum = parseInt(updates.age, 10);
      updates.age = Number.isFinite(ageNum) ? ageNum : undefined;
    }

    if (typeof updates.interests === "string") {
      updates.interests = updates.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
    }

    updates.profileCompleted = true;

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true
    }).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/settings/:userId", async (req, res) => {
  try {
    const allowed = [
      "distancePreference",
      "minAgePreference",
      "maxAgePreference",
      "showOnlineStatus",
      "pushNotifications",
      "emailNotifications",
      "incognitoMode"
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    ["distancePreference", "minAgePreference", "maxAgePreference"].forEach((key) => {
      if (updates[key] !== undefined) {
        const num = parseInt(updates[key], 10);
        if (Number.isFinite(num)) updates[key] = num;
      }
    });

    if (
      updates.minAgePreference !== undefined &&
      updates.maxAgePreference !== undefined &&
      updates.minAgePreference > updates.maxAgePreference
    ) {
      return res.status(400).json({ error: "Min age cannot be greater than max age" });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true
    }).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change Password
const bcrypt = require("bcryptjs");
router.put("/password/:userId", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect current password" });

    if (newPassword.length < 6) return res.status(400).json({ error: "Password too short" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    
    res.json({ msg: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Block a user
router.put("/block/:userId", async (req, res) => {
  try {
    const { targetId } = req.body;
    if (!targetId) return res.status(400).json({ error: "Target user ID required" });

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { blockedUsers: targetId } },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock a user
router.delete("/block/:userId/:targetId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { blockedUsers: req.params.targetId } },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blocked users
router.get("/blocked/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("blockedUsers", "name image");
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json(user.blockedUsers || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload photos
router.post("/photos/:userId", upload.array("images", 6), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newImages = req.files.map(f => `http://localhost:5000/uploads/${f.filename}`);
    
    // Combine existing images (or single image) with new ones
    let currentImages = user.images && user.images.length > 0 
      ? user.images 
      : (user.image ? [user.image] : []);
      
    // Max 6 images
    const combined = [...currentImages, ...newImages].slice(0, 6);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { images: combined, image: combined[0] || "" },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a photo
router.delete("/photos/:userId", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    let currentImages = user.images && user.images.length > 0 
      ? user.images 
      : (user.image ? [user.image] : []);

    const updatedImages = currentImages.filter(img => img !== imageUrl);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { images: updatedImages, image: updatedImages[0] || "" },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
