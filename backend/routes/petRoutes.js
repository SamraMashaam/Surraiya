import express from "express";
import {
  createPet,
  getPet,
  updatePet,
  deletePet,
  equipAccessory,
  unequipAccessory
} from "../controllers/petController.js";

const router = express.Router();

/* =====================================================
   PET CRUD
===================================================== */

// Create pet and assign to user
// POST /api/pets/
router.post("/", createPet);

// Get a single pet
// GET /api/pets/:id
router.get("/:id", getPet);

// Update a pet (rarely used)
// PUT /api/pets/:id
router.put("/:id", updatePet);

// Delete pet
// DELETE /api/pets/:id
router.delete("/:id", deletePet);

/* =====================================================
   ACCESSORY EQUIP / UNEQUIP
===================================================== */

// Equip accessory to correct slot (head/neck/tail automatically)
// POST /api/pets/:id/equip
// body: { userId, accessory }
router.post("/:id/equip", equipAccessory);

// Unequip an accessory
// POST /api/pets/:id/unequip
// body: { userId, accessory }
router.post("/:id/unequip", unequipAccessory);

export default router;
