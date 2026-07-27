import { Router } from "express";
import { getReminders } from "../controllers/reminder.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getReminders);

export default router;
