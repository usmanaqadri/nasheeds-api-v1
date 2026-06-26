const mongoose = require("mongoose");

const slideSchema = new mongoose.Schema(
  {
    nasheedId: { type: String, required: true },
    verseIndexes: [{ type: Number, required: true }],
    layout: {
      type: String,
      required: true,
      enum: ["arab-rom-eng", "arab-eng", "arab-rom", "arab"],
    },
  },
  { _id: false }
);

const slideshowSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    creatorId: { type: String, required: true },
    slides: {
      type: [slideSchema],
      required: true,
      validate: {
        validator: (slides) => Array.isArray(slides) && slides.length > 0,
        message: "A slideshow must include at least one slide",
      },
    },
  },
  { timestamps: true }
);

const Slideshow = mongoose.model("Slideshow", slideshowSchema);

module.exports = Slideshow;
