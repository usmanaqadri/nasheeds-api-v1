const mongoose = require("mongoose");
const crypto = require("crypto");

const liveSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(3).toString("hex"),
    },
    slideshowId: { type: String, required: true },
    leaderUserId: { type: String, required: true },
    currentSlideIndex: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, required: true, default: true },
    startedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

module.exports = LiveSession;
