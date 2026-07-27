import { Router } from "express";
import { CustomerAuthController } from "../controllers/customer-auth.controller.js";
import { authRateLimiter, otpRateLimiter } from "../middleware/rate-limiter.middleware.js";

const router = Router();

// Account Activation Routes (Branch Onboarded Customers)
router.post("/send-activation-otp", otpRateLimiter, CustomerAuthController.sendActivationOtp);
router.post("/activate", authRateLimiter, CustomerAuthController.activateAccount);

// Public Authentication Routes
router.post("/login", authRateLimiter, CustomerAuthController.login);
router.post("/refresh", CustomerAuthController.refresh);
router.post("/logout", CustomerAuthController.logout);
router.post("/send-otp", otpRateLimiter, CustomerAuthController.sendOtp);
router.post("/verify-otp", CustomerAuthController.verifyOtp);
router.post("/forgot-password", otpRateLimiter, CustomerAuthController.forgotPassword);
router.post("/reset-password", CustomerAuthController.resetPassword);

export default router;
