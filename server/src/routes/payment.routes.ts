import { Router } from "express";
import {
  getPayments,
  createPayment,
  reversePayment,
} from "../controllers/payment.controller.js";
import { authMiddleware, requireAdminOrEmployee } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware, requireAdminOrEmployee);

router.get("/", getPayments);
router.post("/", createPayment);
router.patch("/:receiptNo/reverse", reversePayment);

export default router;
