import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getMySolutions } from "../controllers/solution.controller.js";

const router = Router();

router.get("/mine", protect, getMySolutions);

export default router;
