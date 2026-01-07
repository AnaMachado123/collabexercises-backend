
import { Router } from "express";
import { getRecentActivity } from "../controllers/activity.controller.js";

// ✅ no teu projeto o nome é "protect"
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protect, getRecentActivity);

export default router;
