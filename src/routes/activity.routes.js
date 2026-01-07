
import { Router } from "express";
import { getRecentActivity } from "../controllers/activity.controller.js";


import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protect, getRecentActivity);

export default router;
