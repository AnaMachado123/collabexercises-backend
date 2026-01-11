// server.js
import "./src/config/env.js"; // mantém o dotenv.config() se usas

import mongoose from "mongoose";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

// opcional: health check (render gosta)
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

async function startServer() {
  try {
    // ======= Validar env vars =======
    const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
    const missing = required.filter((k) => !process.env[k]);

    if (missing.length) {
      console.error("❌ Missing env vars:", missing.join(", "));
      process.exit(1);
    }

    // ======= Mongo =======
    mongoose.set("bufferCommands", false);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // ======= CORS (API) =======
    // Permite Vercel + localhost
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
    ].filter(Boolean);

    app.use(
      cors({
        origin: (origin, cb) => {
          // permite requests sem origin (Postman/Render checks)
          if (!origin) return cb(null, true);
          if (allowedOrigins.includes(origin)) return cb(null, true);
          return cb(new Error(`CORS blocked for origin: ${origin}`), false);
        },
        credentials: true,
      })
    );

    // ======= HTTP Server =======
    const server = http.createServer(app);

    // ======= Socket.IO =======
    const io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // disponibiliza io nos controllers: req.app.get("io")
    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    // ======= Error handler =======
    app.use((err, req, res, next) => {
      console.error("GLOBAL ERROR:", err);

      res.status(err.status || 500).json({
        message: err.message || "Internal server error",
      });
    });

    // ======= Listen =======
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server start failed:", err);
    process.exit(1);
  }
}

startServer();
