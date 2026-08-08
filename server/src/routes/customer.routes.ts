import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  restoreCustomer,
} from "../controllers/customer.controller.js";
import { authMiddleware, requireAdminOrEmployee } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware, requireAdminOrEmployee);

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.patch("/:id/archive", archiveCustomer);
router.patch("/:id/restore", restoreCustomer);

export default router;
