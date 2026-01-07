import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "collabexercises",
    resource_type: "auto", // aceita imagens, pdfs, zip, etc
  }),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80MB por ficheiro (ajusta se quiseres)
  },
});

export default upload;
