import { Router } from "express";
import { AdminTicketsController } from "../controllers/admin-tickets.controller.js";
import { authMiddleware, requireAdminOrEmployee } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all admin routes
router.use(authMiddleware as any, requireAdminOrEmployee as any);

// Support tickets routes
router.get("/tickets", AdminTicketsController.getTickets);
router.patch("/tickets/:id", AdminTicketsController.updateTicket);

// Customer management inspection routes for Admin
router.get("/customers", AdminTicketsController.getCustomers);
router.get("/customer/:id", AdminTicketsController.getCustomerById);

export default router;
