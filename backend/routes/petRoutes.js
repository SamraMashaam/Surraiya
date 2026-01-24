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



router.post("/", createPet);

router.get("/:id", getPet);


router.put("/:id", updatePet);

router.delete("/:id", deletePet);


router.post("/:id/equip", equipAccessory);


router.post("/:id/unequip", unequipAccessory);

export default router;
