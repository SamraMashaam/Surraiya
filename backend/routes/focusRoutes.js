import express from "express";
import {
  createFocusSession,
  getSessions,
  getSessionsByUser,
  updateSession,
  deleteSession,
} from "../controllers/focusController.js";

const router = express.Router();

router.post("/", createFocusSession);
router.get("/", getSessions);
router.get("/user/:userId", getSessionsByUser);
router.put("/:id", updateSession);
router.delete("/:id", deleteSession);

export default router;
