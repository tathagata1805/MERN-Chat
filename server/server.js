const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");
const User = require("./models/UserModel");
const Message = require("./models/MessageModel");
const rooms = ["General", "Tech", "Finance", "Business"];
const cors = require("cors");
const {
  getLastMessagesFromRoom,
  sortRoomMessagesByDate,
} = require("./libs/helpers");

// EXPRESS MIDDLEWARES
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/users", userRoutes);
require("./connection");

// MIDDLEWARES
app.use(cors);
const server = require("http").createServer(app);
const PORT = process.env.PORT || 5001;
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// SOCKET CONFIGURATION
io.on("connection", (socket) => {
  socket.on("new-user", async () => {
    const members = await User.find();
    io.emit("new-user", members);
  });

  socket.on("join-room", async (newRoom, previousRoom) => {
    socket.join(newRoom);
    socket.leave(previousRoom);
    let roomMessages = await getLastMessagesFromRoom(newRoom);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    socket.emit("room-messages", roomMessages);
  });

  socket.on("message-room", async (room, content, sender, time, date) => {
    const newMessage = await Message.create({
      content,
      from: sender,
      time,
      date,
      to: room,
    });
    let roomMessages = await getLastMessagesFromRoom(room);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    // sending message to room
    io.to(room).emit("room-messages", roomMessages);
    socket.broadcast.emit("notifications", room);
  });

  // LOGOUT ROUTE AND FUNCTION
  app.delete("/logout", async (req, res) => {
    try {
      const { _id, newMessages } = req.body;
      const user = await User.findById(_id);
      user.status = "offline";
      user.newMessages = newMessages;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit("new-user", members);
      res.status(200).send();
    } catch (e) {
      console.log(e);
      res.status(400).send();
    }
  });
});

app.get("/rooms", (req, res) => {
  res.json(rooms);
});

// PROD CONFIG
if (process.env.NODE_ENV == "production") {
  app.use(express.static("client/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

// SERVER CONFIGURATION
server.listen(PORT, () => {
  console.log(`Server listening to PORT: ${PORT}`);
});
