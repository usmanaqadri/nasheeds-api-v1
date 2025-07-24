const mongoose = require("mongoose");

// CREATE SCHEMA
const nasheedSchema = new mongoose.Schema({
  arabTitle: { type: String, required: true, unique: true },
  engTitle: { type: String, required: true },
  arab: [{ type: String, required: true }],
  rom: [{ type: String }],
  eng: [{ type: String, required: true }],
  footnotes: [
    {
      verseIndex: { type: Number, required: true },
      range: { type: [Number], required: true },
      content: { type: String, required: true },
    },
  ],
  isPublic: { type: Boolean, required: true },
  creatorId: { type: String, required: true },
});

// CREATE MODEL
const Nasheed = mongoose.model("Nasheed", nasheedSchema);

module.exports = Nasheed;
