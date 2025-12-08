// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   userName: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   profilePic: {
//     type: String,
//     default: "/home.jpg", // default public image path
//   },
//   friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   FSessionCount: { type: Number, default: 0 },
// });

// export default mongoose.model("User", userSchema);

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  profilePic: {
    type: String,
    default: "/home.jpg",
  },

  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  FSessionCount: { type: Number, default: 0 },

  // New fields
  petID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    default: null, // user may not own a pet yet
  },

  currency: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("User", userSchema);
