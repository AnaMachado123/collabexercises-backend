import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createExercise,
  getExercises,
  getExerciseById,
} from "../controllers/exercise.controller.js";

const router = express.Router();

router.get("/", getExercises);
router.get("/:id", getExerciseById);
router.post("/", protect, createExercise); // 🔒

export default router;
