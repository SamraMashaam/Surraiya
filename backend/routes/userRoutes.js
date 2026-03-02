import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  buyPet,
  buyAccessory,
  updateCurrency,
  addMoodEntry
} from "../controllers/userController.js";

const router = express.Router();


router.post("/", createUser);


router.get("/", getUsers);


router.get("/:id", getUserById);


router.put("/:id", updateUser);


router.delete("/:id", deleteUser);


router.post("/:userId/buy-pet", buyPet);


router.post("/:userId/buy-accessory", buyAccessory);


router.put("/:userId/currency", updateCurrency);
router.post("/:id/mood", addMoodEntry);

export default router;
