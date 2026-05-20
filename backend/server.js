require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://date-app-frontend.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith(".vercel.app") || 
                      origin.startsWith("http://localhost:");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/match", require("./routes/matchRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/user", require("./routes/userRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("API running ");
});
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: corsOptions.origin,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});