// src/app.js
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import savedRoutes from "./routes/saved.routes.js";
import activityRoutes from "./routes/activity.routes.js";
const app = express();

// MIDDLEWARES
app.use(cors());

// ⚠️ Importante: express.json só serve para JSON
// Upload é multipart/form-data e vai pelo multer, então isto pode ficar.
app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api", uploadRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/activity", activityRoutes);


// ✅ rota de teste cloudinary


export default app;
