const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Report = require("../models/Report");
const MatchMeta = require("../models/MatchMeta");
const Message = require("../models/Message");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey123";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "dummysecretkey123";

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
});

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

    const isPremium = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();
    const activeMatches = [];

    for (let match of user.matches) {
      const matchMeta = await MatchMeta.findOne({ users: { $all: [user._id, match._id] } });
      let matchObj = match.toObject();

      if (matchMeta) {
        matchObj.matchedAt = matchMeta.matchedAt; // expose matchedAt for frontend timer

        const msSinceMatch = Date.now() - new Date(matchMeta.matchedAt).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (msSinceMatch > oneDayMs) {
          // Check if any messages exist between them
          const hasMessaged = await Message.exists({
            $or: [
              { sender: user._id, receiver: match._id },
              { sender: match._id, receiver: user._id }
            ]
          });

          if (!hasMessaged) {
            // Show as expired to everyone — premium can unlock, free sees locked state
            matchObj.isExpired = true;
            if (!isPremium) {
              activeMatches.push(matchObj);
              continue; // Still show but as locked
            }
          }
        }
      }
      activeMatches.push(matchObj);
    }

    res.json(activeMatches);
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

const subscriptionPlans = {
  weekly: { days: 7, price: 150 },
  monthly: { days: 30, price: 199 },
  yearly: { days: 365, price: 2999 }
};

router.post("/subscribe/:userId", async (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || !keyId.startsWith('rzp_')) {
      return res.status(500).json({ error: "Razorpay is not configured. Please contact support." });
    }

    const { plan } = req.body;
    if (!subscriptionPlans[plan]) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const receiptId = `sub_${user._id.toString().slice(-10)}_${Math.floor(Date.now() / 1000)}`;
    const order = await razorpay.orders.create({
      amount: subscriptionPlans[plan].price * 100,
      currency: "INR",
      receipt: receiptId,
      payment_capture: 1,
      notes: {
        plan,
        userId: user._id.toString()
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('SUBSCRIBE ROUTE ERROR', error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-payment/:userId", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ error: "Payment details are required" });
    }

    if (!subscriptionPlans[plan]) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const now = new Date();
    const currentExpiry = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now ? user.subscriptionExpiresAt : now;
    const expiresAt = new Date(currentExpiry);
    expiresAt.setDate(expiresAt.getDate() + subscriptionPlans[plan].days);

    user.subscriptionPlan = plan;
    user.subscriptionExpiresAt = expiresAt;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct Subscription Route (Instant payment checkout without Razorpay KYC requirement)
router.post("/direct-subscribe/:userId", async (req, res) => {
  try {
    const { plan } = req.body;
    if (!subscriptionPlans[plan]) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const now = new Date();
    const currentExpiry = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now ? new Date(user.subscriptionExpiresAt) : now;
    const expiresAt = new Date(currentExpiry);
    expiresAt.setDate(expiresAt.getDate() + subscriptionPlans[plan].days);

    user.subscriptionPlan = plan;
    user.subscriptionExpiresAt = expiresAt;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json(safeUser);
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
router.post("/photos/:userId", upload.array("images", 20), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Simulated AI Face Check & Fake Photo blocking
    const fakeKeywords = ["fake_photo", "blank_face", "fake_image"];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        const lowerName = f.originalname.toLowerCase();
        const isFake = fakeKeywords.some(keyword => lowerName.includes(keyword));
        if (isFake) {
          return res.status(400).json({ error: "AI Scan Failed: Fake or unclear photo detected. Please upload a genuine photo showing your face clearly." });
        }
      }
    }

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

    // Enforce 1 photo minimum limit
    if (currentImages.length <= 1) {
      return res.status(400).json({ error: "You must maintain at least 1 photo." });
    }

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

// Safety: Block User
router.post("/block", async (req, res) => {
  const { userId, targetId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.blockedUsers.includes(targetId)) {
      user.blockedUsers.push(targetId);
    }
    
    // Remove from matches and likes if they exist
    user.matches = user.matches.filter(id => id.toString() !== targetId);
    user.likes = user.likes.filter(id => id.toString() !== targetId);
    await user.save();

    // Also remove user from target's matches and likes
    const target = await User.findById(targetId);
    if (target) {
      target.matches = target.matches.filter(id => id.toString() !== userId);
      target.likes = target.likes.filter(id => id.toString() !== userId);
      await target.save();
    }

    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Safety: Unmatch User
router.post("/unmatch", async (req, res) => {
  const { userId, targetId } = req.body;
  try {
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    
    if (user) {
      user.matches = user.matches.filter(id => id.toString() !== targetId);
      await user.save();
    }
    if (target) {
      target.matches = target.matches.filter(id => id.toString() !== userId);
      await target.save();
    }
    res.json({ success: true, message: "Unmatched successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Safety: Report User
router.post("/report", async (req, res) => {
  const { reporter, reported, reason } = req.body;
  try {
    await Report.create({ reporter, reported, reason });
    res.json({ success: true, message: "Report submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account - full cleanup
router.delete("/account/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Remove this user from all other users' matches, likes, blockedUsers
    await User.updateMany(
      { $or: [{ matches: userId }, { likes: userId }, { blockedUsers: userId }] },
      { $pull: { matches: userId, likes: userId, blockedUsers: userId } }
    );

    // 2. Delete all messages sent/received by this user
    const Message = require("../models/Message");
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    // 3. Delete all match metas involving this user
    await MatchMeta.deleteMany({ users: userId });

    // 4. Delete all reports by/about this user
    await Report.deleteMany({ $or: [{ reporter: userId }, { reported: userId }] });

    // 5. Finally delete the user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
