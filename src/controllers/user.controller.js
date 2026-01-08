import User from "../models/User.js";
import bcrypt from "bcryptjs";

import Exercise from "../models/Exercise.js";
import Solution from "../models/Solution.js";
import SavedExercise from "../models/SavedExercise.js";

const getUserId = (req) => req.user?._id;

async function buildMeResponse(userDoc) {
  const userId = userDoc._id;

  // ⚠️ Ajusta os campos se os teus schemas não forem "user"
  const [exercises, solutions, saved] = await Promise.all([
    Exercise.countDocuments({ createdBy: userId }),
    Solution.countDocuments({ user: userId }),
    SavedExercise.countDocuments({ user: userId }),
  ]);

  const memberSince = userDoc.createdAt
    ? new Date(userDoc.createdAt).getFullYear().toString()
    : "2025";

  return {
    ...userDoc.toObject(),
    memberSince,
    stats: { exercises, solutions, saved },
  };
}

export const getMe = async (req, res) => {
  try {
    const me = await buildMeResponse(req.user);
    res.json(me);
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile data" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      getUserId(req),
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    const me = await buildMeResponse(user);
    res.json(me);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password incorrect" });
  }

  const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!passwordPolicy.test(newPassword)) {
    return res.status(400).json({
      message:
        "New password must be 8+ characters and include at least 1 letter and 1 number.",
    });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully" });
};

export const deleteMe = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: "Account deleted" });
};
