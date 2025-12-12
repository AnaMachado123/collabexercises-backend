import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getMe = (req, res) => {
  res.json(req.user);
};

export const updateMe = async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  ).select("-password");

  res.json(user);
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password incorrect" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully" });
};

export const deleteMe = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: "Account deleted" });
};
