import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
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
      default: "",
    },
    attachments: [
      {
        url: String,
        publicId: String,
        originalName: String,
        mimetype: String,
        size: Number,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
