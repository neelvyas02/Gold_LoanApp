import { Router } from "express";
import {
  login,
  adminForgotPassword,
  adminVerifyOtp,
  adminResendOtp,
  adminResetPassword,
} from "../controllers/auth.controller.js";
import {
  authRateLimiter,
  adminForgotLimiter,
  adminOtpVerifyLimiter,
  adminResetLimiter,
} from "../middleware/rate-limiter.middleware.js";

const router = Router();

router.post("/login", authRateLimiter, login);

// Admin / Employee Password Reset Flow
router.post("/forgot-password", adminForgotLimiter, adminForgotPassword);
router.post("/verify-otp", adminOtpVerifyLimiter, adminVerifyOtp);
router.post("/resend-otp", adminForgotLimiter, adminResendOtp);
router.post("/reset-password", adminResetLimiter, adminResetPassword);

export default router;
