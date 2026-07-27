import { Router } from "express";
import {
  getPayments,
  createPayment,
  reversePayment,
} from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getPayments);
router.post("/", authMiddleware, createPayment);
router.patch("/:receiptNo/reverse", authMiddleware, reversePayment);

export default router;
