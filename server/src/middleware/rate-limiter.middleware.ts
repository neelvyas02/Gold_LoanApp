import rateLimit from "express-rate-limit";

// General auth endpoint rate limiter: max 20 requests per 1-minute window
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict OTP dispatch rate limiter: max 5 requests per hour
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Maximum OTP request limit exceeded (5 requests per hour). Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    keyGeneratorIpFallback: false,
    xForwardedForHeader: false,
  },
  keyGenerator: (req) => {
    const email = req.body?.email || req.body?.identifier;
    if (email && typeof email === "string" && email.trim()) {
      return `otp_${email.toLowerCase().trim()}`;
    }
  },
});

// Strict Admin OTP Request Rate Limiter: max 5 requests per 15 mins per IP & Email combination
export const adminForgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password recovery requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const email = req.body?.email;
    const normalizedEmail = email && typeof email === "string" ? email.toLowerCase().trim() : "unknown";
    return `admin_forgot_${ip}_${normalizedEmail}`;
  },
});

// Admin OTP Verification Rate Limiter: max 10 attempts per 15 mins per IP & Email
export const adminOtpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const email = req.body?.email;
    const normalizedEmail = email && typeof email === "string" ? email.toLowerCase().trim() : "unknown";
    return `admin_verify_${ip}_${normalizedEmail}`;
  },
});

// Admin Password Reset Rate Limiter: max 5 attempts per 15 mins per IP
export const adminResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    return `admin_reset_${ip}`;
  },
});
