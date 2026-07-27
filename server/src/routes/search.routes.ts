import { Router } from "express";
import { search } from "../controllers/search.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, search);

export default router;
