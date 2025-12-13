import Exercise from "../models/Exercise.js";

// POST /api/exercises  (🔒)
export const createExercise = async (req, res) => {
  try {
    const { title, description, subject, difficulty, tags } = req.body;

    if (!title || !description || !subject) {
      return res.status(400).json({ message: "title, description and subject are required" });
    }

    const exercise = await Exercise.create({
      title,
      description,
      subject,
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user._id, // vem do auth middleware
    });

    return res.status(201).json(exercise);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/exercises
export const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(exercises);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/exercises/:id
export const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate("createdBy", "name email");
    if (!exercise) return res.status(404).json({ message: "Exercise not found" });

    return res.json(exercise);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
