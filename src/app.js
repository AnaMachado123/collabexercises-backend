import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";


const app = express();

// 🔥 MIDDLEWARES (ordem importa)
app.use(cors());
app.use(express.json());

// 🔁 ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/exercises", exerciseRoutes);


export default app;
