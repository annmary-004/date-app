const mongoose = require("mongoose");
const User = require("./models/User");
const MatchMeta = require("./models/MatchMeta");

async function checkAndCreateTestMatch() {
  await mongoose.connect("mongodb+srv://ann:vOpI80znvlUPeOhu@cluster0.gk3wl1u.mongodb.net/date-app?retryWrites=true&w=majority&appName=Cluster0");
  
  const users = await User.find({});
  console.log(`Found ${users.length} total users.`);

  if (users.length < 2) {
    console.log("Creating a test match user...");
    const testMatchUser = await User.create({
      name: "Alex Riviera",
      email: "alex.demo@heartly.app",
      password: "password123",
      age: 24,
      gender: "Man",
      showMe: "Women",
      bio: "Coffee enthusiast, musician, and traveler 🎸☕",
      occupation: "Music Producer",
      city: "Kochi",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600"
      ],
      profileCompleted: true
    });
    users.push(testMatchUser);
  }

  const currentUser = users[0];
  const otherUser = users[1] || users[0];

  console.log(`Matching user ${currentUser.name} (${currentUser._id}) with ${otherUser.name} (${otherUser._id})...`);

  // Ensure mutual match
  if (!currentUser.matches.includes(otherUser._id)) {
    currentUser.matches.push(otherUser._id);
    await currentUser.save();
  }
  if (!otherUser.matches.includes(currentUser._id)) {
    otherUser.matches.push(currentUser._id);
    await otherUser.save();
  }

  // Create MatchMeta if not exists
  let meta = await MatchMeta.findOne({ users: { $all: [currentUser._id, otherUser._id] } });
  if (!meta) {
    meta = await MatchMeta.create({ users: [currentUser._id, otherUser._id], matchedAt: new Date() });
  }

  console.log("Match successfully set up! Match ID:", otherUser._id);
  process.exit(0);
}

checkAndCreateTestMatch().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
