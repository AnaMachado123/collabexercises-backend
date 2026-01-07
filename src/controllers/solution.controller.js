import Solution from "../models/Solution.js";

const getUserId = (req) => req.user?._id || req.user?.id;

export const getMySolutions = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const items = await Solution.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("exercise", "title subject difficulty createdAt");

    return res.json(items);
  } catch (err) {
    console.error("GET MY SOLUTIONS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch my solutions" });
  }
};
