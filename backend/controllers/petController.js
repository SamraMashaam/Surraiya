import Pet from "../models/Pet.js";
import User from "../models/User.js";

/* -------------------- Helpers -------------------- */

// determine accessory category based on filename
function getAccessoryCategory(filename) {
  if (filename.startsWith("hat_")) return "head";
  if (filename.startsWith("bow_")) return "neck";
  if (filename.startsWith("tail_")) return "tail";
  return null;
}

/* -------------------- CRUD -------------------- */

// Create a pet AND assign it to the user
export const createPet = async (req, res) => {
  try {
    const { userId, petType, baseSprite } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newPet = await Pet.create({
      petType,
      baseSprite,
      equippedAccessories: { head: null, neck: null, tail: null },
      owner: user._id
    });

    // Assign as user's active pet
    user.petId = newPet._id;
    await user.save();

    return res.status(201).json(newPet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a pet
export const getPet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ error: "Pet not found" });
    res.json(pet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update pet (rarely used)
export const updatePet = async (req, res) => {
  try {
    const updatedPet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPet) return res.status(404).json({ error: "Pet not found" });
    res.json(updatedPet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete pet
export const deletePet = async (req, res) => {
  try {
    const deleted = await Pet.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Pet not found" });

    // also remove from user
    await User.updateMany({ petId: req.params.id }, { $unset: { petId: 1 } });

    res.json({ message: "Pet deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- EQUIP / UNEQUIP LOGIC -------------------- */

// Equip an accessory
export const equipAccessory = async (req, res) => {
  try {
    const { userId, accessory } = req.body;
    const petID = req.params.id;

    const category = getAccessoryCategory(accessory);
    if (!category)
      return res.status(400).json({ error: "Invalid accessory name format" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pet = await Pet.findById(petID);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    // must be owned
    if (!user.ownedAccessories.includes(accessory))
      return res.status(403).json({ error: "Accessory not owned" });

    // equip
    pet.equippedAccessories[category] = accessory;
    await pet.save();

    res.json({ message: "Accessory equipped", pet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unequip an accessory
export const unequipAccessory = async (req, res) => {
  try {
    const { userId, accessory } = req.body;
    const petID = req.params.id;

    const category = getAccessoryCategory(accessory);
    if (!category)
      return res.status(400).json({ error: "Invalid accessory name format" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pet = await Pet.findById(petID);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    // only unequip if currently equipped
    if (pet.equippedAccessories[category] !== accessory)
      return res.status(400).json({ error: "Accessory not currently equipped" });

    // unequip
    pet.equippedAccessories[category] = null;
    await pet.save();

    res.json({ message: "Accessory unequipped", pet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
