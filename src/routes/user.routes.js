import express from "express";
import {
  getMe,
  updateMe,
  updatePassword,
  deleteMe
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.patch("/me/password", protect, updatePassword);
router.delete("/me", protect, deleteMe);

export default router;
