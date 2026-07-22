const mongoose = require("mongoose");

const atlasUri = "mongodb+srv://ann:vOpI80znvlUPeOhu@cluster0.gk3wl1u.mongodb.net/date-app?retryWrites=true&w=majority&appName=Cluster0";
const localUri = "mongodb://127.0.0.1:27017/date-app";

console.log("Testing Atlas connection...");
mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("Atlas connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Atlas failed:", err.message);
    console.log("Testing local connection...");
    mongoose.disconnect().then(() => {
      mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 })
        .then(() => {
          console.log("Local MongoDB connected successfully!");
          process.exit(0);
        })
        .catch(err2 => {
          console.error("Local MongoDB failed too:", err2.message);
          process.exit(1);
        });
    });
  });
