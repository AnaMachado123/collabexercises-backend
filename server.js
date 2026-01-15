// server.js
import "./src/config/env.js"; // mantém o dotenv.config() se usas

import mongoose from "mongoose";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

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

    // ======= Allowed origins =======
    // usado para Socket.IO (no Express já está no app.js)
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
    ].filter(Boolean);

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

    // ======= Health check =======
    // (Render gosta disto)
    server.on("request", (req, res) => {
      // nothing: app handles routes
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
