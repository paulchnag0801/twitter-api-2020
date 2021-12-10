if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;
const passport = require("./config/passport");

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowEI03: true,
  },
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

httpServer.listen(port, () =>
  console.log(`SimpleTwitter app listening on port ${port}!`)
);

io.on("connection", (socket) => {
  console.log(socket);
  console.log(">>>>connection to server now");
});

require("./routes")(app, passport);
module.exports = app;

// socket.emit("connection", "I am online");
