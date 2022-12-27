const mongoose = require("mongoose");
require("dotenv").config();

// DB CONNECTION
mongoose.connect(
  "mongodb+srv://tathagata010:tathagata010@cluster0.qjqks5x.mongodb.net/?retryWrites=true&w=majority",
  () => {
    console.log("Connected to Database");
  }
);
