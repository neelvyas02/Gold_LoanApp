import { Router } from "express";
import { CustomerPortalController } from "../controllers/customer-portal.controller.js";
import { authMiddleware, requireCustomer } from "../middleware/auth.middleware.js";
import { uploadProfilePhoto } from "../middleware/upload.middleware.js";

const router = Router();

// Protected Customer Routes
router.use(authMiddleware as any, requireCustomer as any);

router.get("/profile", CustomerPortalController.getProfile);
router.put("/profile", uploadProfilePhoto.single("profilePhoto"), CustomerPortalController.updateProfile);

router.get("/dashboard", CustomerPortalController.getDashboard);
router.get("/loans", CustomerPortalController.getLoans);
router.get("/payments", CustomerPortalController.getPayments);
router.get("/documents", CustomerPortalController.getDocuments);
router.get("/ornaments", CustomerPortalController.getOrnaments);

router.get("/notifications", CustomerPortalController.getNotifications);
router.patch("/notifications/:id/read", CustomerPortalController.markNotificationRead);
router.patch("/notifications/read-all", CustomerPortalController.markAllNotificationsRead);
router.delete("/notifications/:id", CustomerPortalController.deleteNotification);

router.get("/support", CustomerPortalController.getSupportTickets);
router.post("/support", CustomerPortalController.submitSupportTicket);

router.put("/password", CustomerPortalController.changePassword);
router.put("/change-password", CustomerPortalController.changePassword); // Alias for compatibility

export default router;
