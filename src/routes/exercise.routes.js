import express from "express";
const router = express.Router();

import {
  createExercise,
  getExercises,
  getExerciseById,
  getMyExercises, 
  getMySavedExercises,
  toggleSaveExercise,
  isExerciseSaved,
  getExerciseComments,
  createExerciseComment,
  getExerciseSolutions,
  createExerciseSolution,
} from "../controllers/exercise.controller.js";

// 🔐 auth → named export
import { protect } from "../middlewares/auth.middleware.js";

// ☁️ upload → default export
import uploadMiddleware from "../middlewares/upload.middleware.js";

/* =========================
   EXERCISES
   ========================= */
router.post("/", protect, uploadMiddleware.single("file"), createExercise);
router.get("/", getExercises);
router.get("/saved", protect, getMySavedExercises);
router.get("/mine", protect, getMyExercises);
router.get("/:id", getExerciseById);


/* =========================
   SAVES / BOOKMARKS
   ========================= */
router.post("/:id/save-toggle", protect, toggleSaveExercise);
router.get("/:id/is-saved", protect, isExerciseSaved);

/* =========================
   COMMENTS
   ========================= */
router.get("/:id/comments", getExerciseComments);
router.post(
  "/:id/comments",
  protect,
  uploadMiddleware.array("files"),
  createExerciseComment
);

/* =========================
   SOLUTIONS
   ========================= */
router.get("/:id/solutions", getExerciseSolutions);
router.post(
  "/:id/solutions",
  protect,
  uploadMiddleware.array("files"),
  createExerciseSolution
);

export default router;
