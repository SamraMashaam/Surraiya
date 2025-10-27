import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: {
    type: String,
    default: "/home.jpg", // default public image path
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  FSessionCount: { type: Number, default: 0 },
});

export default mongoose.model("User", userSchema);
