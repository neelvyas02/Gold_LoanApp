import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  restoreCustomer,
} from "../controllers/customer.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getCustomers);
router.get("/:id", authMiddleware, getCustomerById);
router.post("/", authMiddleware, createCustomer);
router.put("/:id", authMiddleware, updateCustomer);
router.patch("/:id/archive", authMiddleware, archiveCustomer);
router.patch("/:id/restore", authMiddleware, restoreCustomer);

export default router;
