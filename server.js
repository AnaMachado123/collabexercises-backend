import "./src/config/env.js";

import mongoose from "mongoose";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    mongoose.set("bufferCommands", false);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // ✅ cria server HTTP (em vez de app.listen direto)
    const server = http.createServer(app);

    // ✅ liga Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
      },
    });

    // ✅ deixa o io acessível nos controllers via req.app.get("io")
    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    // error handler (mantém)
    app.use((err, req, res, next) => {
      console.error("GLOBAL ERROR:", err);

      res.status(err.status || 500).json({
        message: err.message || "Internal server error",
      });
    });

    // ✅ agora faz listen no server HTTP
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

startServer();
