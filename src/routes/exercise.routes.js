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
  createExerciseSolution, // ✅ FALTAVA
  updateExercise,
  deleteExercise,
} from "../controllers/exercise.controller.js";

// 🔐 auth
import { protect } from "../middlewares/auth.middleware.js";

// ☁️ upload
import uploadMiddleware from "../middlewares/upload.middleware.js";

/* =========================
   EXERCISES
   ========================= */
// ✅ files opcionais (não obriga a enviar)
router.post("/", protect, uploadMiddleware.array("files", 10), createExercise);

router.get("/", getExercises);

router.get("/saved", protect, getMySavedExercises);
router.get("/mine", protect, getMyExercises);

router.put("/:id", protect, uploadMiddleware.array("files", 10), updateExercise);
router.delete("/:id", protect, deleteExercise);

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
  uploadMiddleware.array("files", 10),
  createExerciseComment
);

/* =========================
   SOLUTIONS
   ========================= */
router.get("/:id/solutions", getExerciseSolutions);
router.post(
  "/:id/solutions",
  protect,
  uploadMiddleware.array("files", 10),
  createExerciseSolution
);

export default router;
