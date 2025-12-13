import mongoose from "mongoose";

const ExerciseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject: { type: String, required: true, trim: true }, // "Math", "Programming"...
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Exercise", ExerciseSchema);
