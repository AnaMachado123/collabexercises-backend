import mongoose from "mongoose";

const solutionSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,      // ✅ evita texto só com espaços
      default: "",
    },

    attachments: {
      type: [
        {
          url: { type: String },
          publicId: { type: String },
          originalName: { type: String },
          mimetype: { type: String },
          size: { type: Number },
        },
      ],
      default: [],     // ✅ nunca undefined
    },
  },
  { timestamps: true }
);

export default mongoose.model("Solution", solutionSchema);
