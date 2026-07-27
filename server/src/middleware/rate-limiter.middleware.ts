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
  keyGenerator: (req) => {
    const email = req.body?.email || req.body?.identifier;
    if (email && typeof email === "string") {
      return `otp_${email.toLowerCase().trim()}`;
    }
    const rawIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
    return rawIp;
  },
});
