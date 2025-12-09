import express from "express";
import User from "../models/User.js";
import Pet from "../models/Pet.js";

const router = express.Router();

/* -------------------- Helper: Cost Logic -------------------- */
function getPetCost(user) {
  return user.petID ? 250 : 0; // first pet → free
}

function getAccessoryCost() {
  return 100;
}

function getAccessoryNode(filename) {
  if (filename.startsWith("hat_")) return "head";
  if (filename.startsWith("bow_")) return "neck";
  return "tail";
}


/* -------------------- BUY PET -------------------- */
router.post("/buy/pet", async (req, res) => {
  try {
    const { userId, petType, baseSprite } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Cost depends on whether user already has a pet
    const cost = getPetCost(user);
    console.log("cost: ",cost);

    if (user.currency < cost) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    // Deduct currency (unless cost is zero)
    user.currency -= cost;

    let pet;
    if (!user.petID) {
      // First-time: create a new Pet document
      pet = await Pet.create({
        petType,
        baseSprite,
        equippedAccessories: { head: null, neck: null, tail: null },
        owner: user._id
      });

      user.petID = pet._id;
      await user.save();
    } else {
      // User already has a pet → update existing
      pet = await Pet.findByIdAndUpdate(
        user.petID,
        { petType, baseSprite },
        { new: true }
      );
      await user.save();
    }

    res.json({
      message: cost === 0 ? "First pet chosen!" : "Pet purchased!",
      pet,
      currency: user.currency,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/equip/pet", async (req, res) => {
  try {
    const { userId, petType, baseSprite } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let pet;
    if (!user.petID) {
      return res.json({
      message: "User doesn't have a pet"
    });
    } else {
      pet = await Pet.findByIdAndUpdate(
        user.petID,
        { petType, baseSprite },
        { new: true }
      );
    }
    console.log("Pet Equipped: ", pet)
    res.json({
      message: "Pet Equipped!",
      pet
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- BUY ACCESSORY -------------------- */
router.post("/buy/accessory", async (req, res) => {
  try {
    const { userId, accessory } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pet = await Pet.findById(user.petID);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const cost = getAccessoryCost();

    // Determine which category it belongs to → head, neck, or tail
    const category = getAccessoryNode(accessory);

    // Check if already owned
    if (pet.ownedAccessories[category].includes(accessory)) {
      return res.status(400).json({ error: "You already own this accessory" });
    }

    // Check money
    if (user.currency < cost) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    // Deduct cost
    user.currency -= cost;

    // Add to owned array
    pet.ownedAccessories[category].push(accessory);

    await user.save();
    await pet.save();

    res.json({
      message: "Accessory purchased!",
      accessory,
      currency: user.currency,
      pet
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* -------------------- EQUIP ACCESSORY -------------------- */
router.post("/equip/accessory/:petId", async (req, res) => {
  try {
    const { userId, accessory } = req.body;
    const { petId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const category = getAccessoryNode(accessory);

    if (!pet.ownedAccessories[category].includes(accessory)) {
      return res.status(400).json({ error: "Accessory not owned" });
    }

    if (!category) {
      return res.status(400).json({ error: "Invalid accessory format" });
    }

    if (!Array.isArray(pet.equippedAccessories[category])) {
      pet.equippedAccessories[category] = [];
    }

    // Push into array
    pet.equippedAccessories[category].push(accessory);
    await pet.save();

    res.json({ message: "Equipped!", pet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- UNEQUIP ACCESSORY -------------------- */
router.post("/unequip/accessory/:petId", async (req, res) => {
  try {
    const { accessory } = req.body;
    const { petId } = req.params;

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const category = getAccessoryNode(accessory);

    if (!pet.ownedAccessories[category].includes(accessory)) {
      return res.status(400).json({ error: "Accessory not owned" });
    }

    if (!category) {
      return res.status(400).json({ error: "Invalid accessory format" });
    }

    // only remove if currently equipped
    if (!pet.equippedAccessories[category].includes(accessory)) {
      return res.status(400).json({ error: "Accessory not currently equipped" });
    }

    pet.equippedAccessories[category] = [];
    await pet.save();

    res.json({ message: "Unequipped!", pet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- GET SHOP DATA (recommended) -------------------- */
// frontend can use this to know what is owned, equipped, coin count, etc.
router.get("/status/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("petId");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      currency: user.currency,
      ownedAccessories: user.ownedAccessories,
      petId: user.petId?._id || null,
      equipped: user.petId?.equippedAccessories || {},
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
