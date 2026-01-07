import Activity from "../models/Activity.js";

export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);

    const items = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "name username email avatar") // ajusta campos do teu User
      .populate("exercise", "title subject difficulty createdAt");

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load activity", error: err.message });
  }
};
