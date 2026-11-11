const mongoose = require("mongoose");
const { Schema } = mongoose;

// A single line of lyrics
const lineSchema = new Schema({
  arab: { type: String, required: true },
  rom: { type: String, default: "" },
  eng: { type: String, default: "" },
});

// A stanza contains one or more lines
const stanzaSchema = new Schema({
  lines: {
    type: [lineSchema],
    required: true,
    validate: {
      validator: (lines) => lines.length > 0,
      message: "A stanza must contain at least one line",
    },
  },
});

// Refrain references existing lyrics
const refrainSchema = new Schema({
  name: { type: String, default: "Chorus" },
  stanzaId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  lineIds: [
    {
      type: Schema.Types.ObjectId,
    },
  ],
});

// Default performance order
const sequenceItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["stanza", "refrain"],
      required: true,
    },
    stanzaId: { type: Schema.Types.ObjectId },
    refrainId: { type: Schema.Types.ObjectId },
  },
  { _id: false },
);

// Footnotes reference a particular line
const footnoteSchema = new Schema({
  lineId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  range: {
    type: [Number],
    default: undefined,
  },
  content: {
    type: String,
    required: true,
  },
});

// Audio synchronization
const timingCueSchema = new Schema({
  stanzaId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  lineId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  startMs: {
    type: Number,
    required: true,
    min: 0,
  },
  endMs: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Individual recordings/performances
const recordingSchema = new Schema({
  performer: {
    type: String,
    required: true,
  },
  title: String,
  audioUrl: {
    type: String,
    required: true,
  },
  timingCues: {
    type: [timingCueSchema],
    default: [],
  },
});

// Main Nasheed V2 schema
const nasheedV2Schema = new Schema(
  {
    arabTitle: {
      type: String,
      required: true,
      unique: true,
    },
    engTitle: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      required: true,
    },

    stanzas: {
      type: [stanzaSchema],
      default: [],
    },

    refrains: {
      type: [refrainSchema],
      default: [],
    },

    sequence: {
      type: [sequenceItemSchema],
      default: [],
    },

    footnotes: {
      type: [footnoteSchema],
      default: [],
    },

    recordings: {
      type: [recordingSchema],
      default: [],
    },

    poet: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    language: {
      type: String,
      trim: true,
      default: "ar",
    },

    performers: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    alternateTitles: {
      type: [String],
      default: [],
    },

    isPublic: {
      type: Boolean,
      required: true,
      default: false,
    },

    creatorId: {
      type: String,
      required: true,
    },

    schemaVersion: {
      type: Number,
      default: 2,
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

// Explicitly use a separate MongoDB collection
const NasheedV2 = mongoose.model("NasheedV2", nasheedV2Schema, "nasheeds_v2");

module.exports = NasheedV2;
