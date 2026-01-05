import express from "express";
const router = express.Router();

import { protect } from "../middlewares/auth.middleware.js";
import SavedExercise from "../models/SavedExercise.js";

router.get("/mine", protect, async (req, res) => {
  try {
    const saved = await SavedExercise.find({ user: req.user._id })
      .populate({
        path: "exercise",
        populate: { path: "createdBy", select: "name email" },
      })
      .sort({ createdAt: -1 });

    const exercises = saved.map((s) => s.exercise).filter(Boolean);
    res.json(exercises);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to fetch saved" });
  }
});

export default router;
