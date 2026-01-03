import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

router.post("/upload-test", upload.single("files"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "collabexercises",
        resource_type: "auto",
      }
    );

    return res.json({
      message: "Upload success",
      url: result.secure_url,
      type: result.resource_type,
    });
  } catch (error) {
    console.error("UPLOAD TEST ERROR:", error);
    return res.status(500).json({ message: "Upload failed" });
  }
});

export default router;
