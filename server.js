const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { initializeSocket } = require("./services/socket");

const PORT = process.env.PORT || 3001;

//req db connection
require("./config/db.connections");

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// DEFAULT
app.get("/api/v1/", (req, res) => {
  const today = new Date();
  res.send(`
    <h1>Hello! This is the Nasheeds All Night backend API</h1>
    <p>Thanks for using our app</p>
    <p>${today}</p>
  `);
});

const routes = require("./routes");
const server = http.createServer(app);
const io = initializeSocket(server);

app.set("io", io);

app.use("/api/v1/live-session", routes.liveSession);
app.use("/api/v1/nasheed", routes.nasheed);
app.use("/api/v1/slideshow", routes.slideshow);
app.use("/api/v1/user", routes.user);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io };
