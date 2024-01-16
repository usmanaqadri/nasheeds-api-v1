const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");

const file = fs.readFileSync("./FF6E48860567030E2DCF7295B5A99399.txt");

const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN =
  process.env.NODE_ENV === "dev"
    ? "http://localhost:3000"
    : process.env.FRONTEND_ORIGIN;
//req db connection
require("./config/db.connections");

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

app.get(
  "/.well-known/pki-validation/FF6E48860567030E2DCF7295B5A99399.txt",
  (req, res) => {
    res.sendFile(
      "/home/ubuntu/nasheeds-api-v1/FF6E48860567030E2DCF7295B5A99399.txt"
    );
  }
);

const routes = require("./routes");
app.use("/nasheed", routes.nasheed);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
