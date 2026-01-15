// src/app.js
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import savedRoutes from "./routes/saved.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import solutionRoutes from "./routes/solution.routes.js";

const app = express();

// 🔥 (Opcional mas recomendado) se estiveres em Render/Proxy
app.set("trust proxy", 1);

// ======= CORS (ANTES DAS ROTAS) =======
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // permite requests sem origin (Postman/healthchecks)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  })
);

// ======= BODY PARSER =======
app.use(express.json());

// ======= ROUTES =======
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api", uploadRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/solutions", solutionRoutes);

// ======= 404 =======
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ======= GLOBAL ERROR HANDLER =======
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  // erro típico do CORS
  if (String(err.message || "").includes("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

export default app;
