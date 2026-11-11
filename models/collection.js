const mongoose = require("mongoose");
const { Schema } = mongoose;

const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["tariqa", "theme", "other"],
      default: "other",
    },

    description: {
      type: String,
      default: "",
    },

    history: {
      type: String,
      default: "",
    },

    founder: {
      type: String,
      default: "",
    },

    origin: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Collection", collectionSchema);
