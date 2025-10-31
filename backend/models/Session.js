const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: false },
  inactivityThreshold: { type: Number, default: 5 },
  startedAt: { type: Date },
  lastActivityAt: { type: Date }
});

module.exports = mongoose.model("Session", sessionSchema);