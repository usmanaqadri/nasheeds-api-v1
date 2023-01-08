const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:3000/nasheeds-all-night";

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ origin: FRONTEND_ORIGIN, methods: ["GET", "POST", "PUT", "DELETE"] })
);

// DEFAULT
app.get("/", (req, res) => {
  const today = new Date();
  res.send(`
    <h1>Hello! This is the Nasheeds All Night backend API</h1>
    <p>Thanks for using our app</p>
    <p>${today}</p>
  `);
});

//req db connection
require("./config/db.connections");

const routes = require("./routes");
app.use("/nasheed", routes.nasheed);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
