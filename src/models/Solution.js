import mongoose from "mongoose";

const SolutionSchema = new mongoose.Schema(
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Solution", SolutionSchema);
