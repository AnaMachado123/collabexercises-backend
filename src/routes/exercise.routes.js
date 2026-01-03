import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import {
  createExercise,
  getExercises,
  getExerciseById,
} from "../controllers/exercise.controller.js";

const router = express.Router();

router.get("/", getExercises);
router.get("/:id", getExerciseById);
router.post("/", protect, upload.array("files"), createExercise);

export default router;
