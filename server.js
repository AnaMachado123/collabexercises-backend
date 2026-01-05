import "./src/config/env.js"; 

import mongoose from "mongoose";
import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // opcional (mas ótimo): falha logo em vez de bufferizar
    mongoose.set("bufferCommands", false);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // error handler deve estar antes do listen (mas depois das routes no app.js)
    app.use((err, req, res, next) => {
      console.error("GLOBAL ERROR:", err);

      res.status(err.status || 500).json({
        message: err.message || "Internal server error",
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

startServer();
