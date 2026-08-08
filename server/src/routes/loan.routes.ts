import { Router } from "express";
import {
  getLoans,
  getLoanByNo,
  createLoan,
  closeLoan,
} from "../controllers/loan.controller.js";
import { authMiddleware, requireAdminOrEmployee } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware, requireAdminOrEmployee);

router.get("/", getLoans);
router.get("/:loanNo", getLoanByNo);
router.post("/", createLoan);
router.patch("/:loanNo/close", closeLoan);

export default router;
