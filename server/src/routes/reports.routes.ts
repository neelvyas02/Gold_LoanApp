import { Router } from "express";
import {
  getCustomersReport,
  getLoansReport,
  getPaymentsReport,
  getOutstandingReport,
  getOverdueReport,
} from "../controllers/reports.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/customers", authMiddleware, getCustomersReport);
router.get("/loans", authMiddleware, getLoansReport);
router.get("/payments", authMiddleware, getPaymentsReport);
router.get("/outstanding", authMiddleware, getOutstandingReport);
router.get("/overdue", authMiddleware, getOverdueReport);

export default router;
