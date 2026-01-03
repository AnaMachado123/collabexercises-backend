import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },       // 🔑 link público
    publicId: { type: String, required: true }, // 🔑 cloudinary id
    originalName: String,
    mimetype: String,
  },
  { _id: false }
);


const ExerciseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    tags: [{ type: String, trim: true }],

    attachments: [AttachmentSchema], // ✅ AGORA EXISTE

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exercise", ExerciseSchema);
