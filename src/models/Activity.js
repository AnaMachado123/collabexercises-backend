import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["exercise_created", "solution_added", "comment_added", "exercise_saved"],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", ActivitySchema);
