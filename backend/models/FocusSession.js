import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // can be linked to userId in User model
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  isActive: { type: Boolean, default: false },
  duration: { type: Number, default: 0 }, // in minutes or seconds
}, { timestamps: true });

const FocusSession = mongoose.model("FocusSession", focusSessionSchema);
export default FocusSession;
