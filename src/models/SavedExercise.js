import mongoose from "mongoose";

const savedExerciseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
  },
  { timestamps: true }
);

// um user só pode guardar 1x o mesmo exercício
savedExerciseSchema.index({ user: 1, exercise: 1 }, { unique: true });

export default mongoose.model("SavedExercise", savedExerciseSchema);
