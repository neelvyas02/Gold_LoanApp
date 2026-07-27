import { Router } from "express";
import {
  getLoans,
  getLoanByNo,
  createLoan,
  closeLoan,
} from "../controllers/loan.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getLoans);
router.get("/:loanNo", authMiddleware, getLoanByNo);
router.post("/", authMiddleware, createLoan);
router.patch("/:loanNo/close", authMiddleware, closeLoan);

export default router;
