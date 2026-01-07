import Activity from "../models/Activity.js";

export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const items = await Activity.find({ createdAt: { $gte: cutoff } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "name email")
      .populate("exercise", "title subject difficulty createdAt")
      .populate("comment", "text createdAt")
      .populate("solution", "text createdAt");

    return res.json(items);
  } catch (err) {
    console.error("GET ACTIVITY ERROR:", err);
    return res.status(500).json({ message: "Failed to load activity" });
  }
};
