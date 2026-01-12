import SavedExercise from "../models/SavedExercise.js";
import Comment from "../models/Comment.js";
import Exercise from "../models/Exercise.js";
import Solution from "../models/Solution.js";

const getUserId = (req) => req.user?._id || req.user?.id;

export const getMySolutions = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const items = await Solution.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("exercise", "title subject difficulty createdAt attachments")
      .lean();

    const itemsWithCounts = await Promise.all(
      items.map(async (sol) => {
        const exId = sol.exercise?._id;
        if (!exId) return sol;

        const [commentsCount, solutionsCount, savesCount] = await Promise.all([
          Comment.countDocuments({ exercise: exId }),
          Solution.countDocuments({ exercise: exId }),
          SavedExercise.countDocuments({ exercise: exId }),
        ]);

        return {
          ...sol,
          filesCount: Array.isArray(sol.attachments) ? sol.attachments.length : 0,
          exercise: {
            ...sol.exercise,
            commentsCount,
            solutionsCount,
            savesCount,
            filesCount: Array.isArray(sol.exercise.attachments) ? sol.exercise.attachments.length : 0,
          },
        };
      })
    );

    return res.json(itemsWithCounts);
  } catch (err) {
    console.error("GET MY SOLUTIONS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch my solutions" });
  }
};
