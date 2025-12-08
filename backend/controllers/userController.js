import User from "../models/User.js";
import Pet from "../models/Pet.js";

/* -------------------------------------------------------
   CREATE USER
------------------------------------------------------- */
export const createUser = async (req, res) => {
  try {
    const user = new User({
      ...req.body,
      petID: null,   // starts without pet
      currency: 0
    });

    await user.save();
    res.status(201).json(user);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------------------------------------------
   READ ALL USERS
------------------------------------------------------- */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("petID");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------------------------------------------
   READ ONE USER
------------------------------------------------------- */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("petID");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------------------------------------------
   UPDATE USER (generic)
------------------------------------------------------- */
export const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("petID");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------------------------------------------
   DELETE USER
------------------------------------------------------- */
export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =======================================================
   EXTRA SHOP-RELATED ROUTES
======================================================= */

/* -------------------------------------------------------
   1. BUY PET → deduct currency + assign petID
------------------------------------------------------- */
export const buyPet = async (req, res) => {
  try {
    const userID = req.params.userId;
    const { petId, cost } = req.body; // cost sent from frontend

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.petID)
      return res.status(400).json({ error: "User already owns a pet" });

    if (user.currency < cost)
      return res.status(400).json({ error: "Not enough currency" });

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    user.currency -= cost;
    user.petID = petId;
    await user.save();

    res.json({ message: "Pet purchased", user });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------------------------------------------
   2. BUY ACCESSORY → deduct currency only
------------------------------------------------------- */
export const buyAccessory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cost } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.currency < cost)
      return res.status(400).json({ error: "Not enough currency" });

    user.currency -= cost;
    await user.save();

    res.json({ message: "Accessory purchased", user });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------------------------------------------
   3. MODIFY CURRENCY (admin or rewards)
------------------------------------------------------- */
export const updateCurrency = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.currency = req.body.amount;
    await user.save();

    res.json({ message: "Currency updated", user });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
