import { Router } from "express";
import { getNotifications, markAsRead } from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/read/:id", authMiddleware, markAsRead);

export default router;
