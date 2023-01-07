const mongoose = require("mongoose");

const mongoDB = process.env.MONGODB_URI;

mongoose.set("strictQuery", false);
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on("connected", () => console.log("DB connected... 🎉🎉🎉"));
db.on("error", (err) => console.log(err.message));
db.on("disconnected", () => console.log("mongoose disconnected"));
