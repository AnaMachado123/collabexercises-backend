import "./src/config/env.js"; // 👈 PRIMEIRO

import mongoose from "mongoose";
import app from "./src/app.js";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
