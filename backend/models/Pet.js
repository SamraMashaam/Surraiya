const mongoose = require("mongoose");
const petSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  petType: { type: String, required: true }, // cat, dog, snake
  baseSprite: { type: String, required: true }, // add this!

  ownedAccessories: {
    head: [{ type: String }],
    neck: [{ type: String }],
    tail: [{ type: String }]
  },

  equippedAccessories: {
    head: { type: String, default: null },
    neck: { type: String, default: null },
    tail: { type: String, default: null }
  }
});

module.exports = mongoose.model("Pet", petSchema);