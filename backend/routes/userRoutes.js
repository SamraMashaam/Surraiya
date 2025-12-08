import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  buyPet,
  buyAccessory,
  updateCurrency
} from "../controllers/userController.js";

const router = express.Router();

/* =====================================================
   BASIC USER CRUD
===================================================== */

// Create user
router.post("/", createUser);

// Get all users
router.get("/", getUsers);

// Get one user
router.get("/:id", getUserById);

// Update user (generic)
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

/* =====================================================
   SHOP-SPECIFIC ROUTES
===================================================== */

/**
 * BUY PET
 * POST /api/users/:userId/buy-pet
 * body: { petId, cost }
 */
router.post("/:userId/buy-pet", buyPet);

/**
 * BUY ACCESSORY
 * POST /api/users/:userId/buy-accessory
 * body: { cost }
 */
router.post("/:userId/buy-accessory", buyAccessory);

/**
 * UPDATE CURRENCY (reward/admin)
 * PUT /api/users/:userId/currency
 * body: { amount }
 */
router.put("/:userId/currency", updateCurrency);

export default router;
