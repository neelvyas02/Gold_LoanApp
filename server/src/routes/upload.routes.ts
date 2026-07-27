import { Router } from "express";
import { uploadDocument, uploadOrnament } from "../controllers/upload.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/document", authMiddleware, upload.single("document"), uploadDocument);
router.post("/ornament", authMiddleware, upload.single("ornament"), uploadOrnament);

export default router;
