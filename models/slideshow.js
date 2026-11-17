const mongoose = require("mongoose");

const formattingRangeSchema = new mongoose.Schema(
  {
    start: { type: Number, required: true, min: 0 },
    end: { type: Number, required: true, min: 1 },
    styles: {
      bold: { type: Boolean, default: false },
      italic: { type: Boolean, default: false },
      underline: { type: Boolean, default: false },
      fontSize: {
        type: Number,
        default: 1,
        min: 0.5,
        max: 3,
      },
    },
  },
  { _id: false },
);

const slideBlockSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["stanza", "refrain"] },
  stanzaId: {
    type: String,
    required: function () {
      return this.type === "stanza";
    },
  },
  refrainId: {
    type: String,
    required: function () {
      return this.type === "refrain";
    },
  },
  lineIds: {
    type: [String],
    required: true,
    validate: {
      validator: (ids) => Array.isArray(ids) && ids.length > 0,
      message: "A slideshow block must contain at least one line",
    },
  },
});
const customLineSchema = new mongoose.Schema(
  {
    arab: { type: String, default: "" },
    rom: { type: String, default: "" },
    eng: { type: String, default: "" },

    language: {
      type: String,
      enum: ["ar", "ur"],
      default: "ar",
    },

    formatting: {
      arab: {
        type: [formattingRangeSchema],
        default: [],
      },
      rom: {
        type: [formattingRangeSchema],
        default: [],
      },
      eng: {
        type: [formattingRangeSchema],
        default: [],
      },
    },
  },
  { _id: true },
);
const slideSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["nasheed", "custom"],
    default: "nasheed",
    required: true,
  },
  showTitleIntro: { type: Boolean, default: false },
  nasheedId: {
    type: String,
    required: function () {
      return this.type === "nasheed";
    },
  },
  layout: {
    type: String,
    enum: ["arab-rom-eng", "arab-eng", "arab-rom", "arab"],
    default: "arab-rom-eng",
  },
  blocks: { type: [slideBlockSchema], default: [] },
  title: {
    type: String,
    trim: true,
    required: function () {
      return this.type === "custom";
    },
  },
  lines: { type: [customLineSchema], default: [] },
});
slideSchema.pre("validate", function (next) {
  if (this.type === "nasheed" && !this.blocks.length)
    this.invalidate("blocks", "A nasheed slide must have at least one block");
  if (this.type === "custom") {
    if (!this.lines.length)
      this.invalidate("lines", "A custom slide must have at least one line");
    this.lines.forEach((line, index) => {
      if (
        ![line.arab, line.rom, line.eng].some(
          (value) => typeof value === "string" && value.trim(),
        )
      )
        this.invalidate(
          `lines.${index}`,
          "Each custom line needs text in at least one language",
        );
    });
  }
  next();
});
const slideshowSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
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
  { timestamps: true },
);
module.exports = mongoose.model("Slideshow", slideshowSchema);
