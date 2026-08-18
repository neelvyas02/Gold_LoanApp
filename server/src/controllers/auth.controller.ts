import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { EmailService } from "../services/email.service.js";
import { AuditService } from "../services/audit.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, requiredRole } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: "Username and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid username or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, message: "Invalid username or password" });
      return;
    }

    // Role check if requiredRole is provided
    if (requiredRole) {
      const normalizedReqRole = requiredRole.toLowerCase();
      const userRole = (user.role || "").toLowerCase();

      if (normalizedReqRole === "admin" && userRole !== "admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. This account does not have Admin privileges. Please use Staff Login.",
        });
        return;
      }

      if (
        (normalizedReqRole === "staff" || normalizedReqRole === "employee") &&
        userRole !== "employee" &&
        userRole !== "staff" &&
        userRole !== "admin"
      ) {
        res.status(403).json({
          success: false,
          message: "Access denied. This account does not have Staff access.",
        });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Step 1: Request Password Reset OTP for Admin/Employee
 * Always returns a generic response to protect against account enumeration.
 */
export async function adminForgotPassword(req: Request, res: Response, next: NextFunction) {
  const genericResponse = {
    success: true,
    message: "If an account exists for this email address, a password reset OTP has been sent.",
  };

  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.trim()) {
      res.json(genericResponse);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.json(genericResponse);
      return;
    }

    // Find User by email and ensure role is Admin or Employee
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: { in: ["Admin", "Employee"] },
      },
    });

    if (!user) {
      // Do not reveal account non-existence
      res.json(genericResponse);
      return;
    }

    // Invalidate any previous unverified OTPs for this user
    await prisma.userOTP.updateMany({
      where: { userId: user.id, verified: false },
      data: { verified: true },
    });

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create UserOTP record
    await prisma.userOTP.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // Dispatch OTP email via Resend asynchronously (never log raw OTP)
    try {
      await EmailService.sendAdminPasswordResetEmail(normalizedEmail, otp);
    } catch (sendErr) {
      console.error("[AdminAuth] Resend email dispatch failed:", sendErr);
    }

    // Write Audit Log
    await AuditService.log(
      "Auth",
      "ADMIN_PASSWORD_RESET_REQUESTED",
      user.id,
      "Admin/Employee password reset OTP requested",
      user.id,
      user.role
    );

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * Step 2: Verify 6-digit OTP
 */
export async function adminVerifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp || typeof email !== "string" || typeof otp !== "string") {
      res.status(400).json({ success: false, message: "Email and 6-digit OTP code are required." });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      res.status(400).json({ success: false, message: "Invalid OTP format. Must be a 6-digit number." });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: { in: ["Admin", "Employee"] },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP." });
      return;
    }

    // Find latest active OTP record
    const latestOtp = await prisma.userOTP.findFirst({
      where: {
        userId: user.id,
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      res.status(400).json({ success: false, message: "No active OTP request found. Please request a new code." });
      return;
    }

    // Check expiration
    if (new Date() > new Date(latestOtp.expiresAt)) {
      res.status(400).json({ success: false, message: "OTP has expired. Please request a new code." });
      return;
    }

    // Check attempt limits
    if (latestOtp.attempts >= 5) {
      res.status(400).json({ success: false, message: "Maximum verification attempts exceeded. Please request a new OTP." });
      return;
    }

    // Verify bcrypt hash
    const isOtpValid = await bcrypt.compare(cleanOtp, latestOtp.otpHash);
    if (!isOtpValid) {
      await prisma.userOTP.update({
        where: { id: latestOtp.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = 4 - latestOtp.attempts;
      res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
          : "Maximum verification attempts exceeded. Please request a new OTP.",
      });
      return;
    }

    // OTP is valid! Generate cryptographically secure random reset token (raw 64-char hex)
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any previous reset tokens for this user
    await prisma.userOTP.updateMany({
      where: { userId: user.id, id: { not: latestOtp.id } },
      data: { resetTokenUsed: true },
    });

    // Mark OTP as verified and store SHA-256 resetTokenHash
    await prisma.userOTP.update({
      where: { id: latestOtp.id },
      data: {
        verified: true,
        resetTokenHash,
        resetTokenExpires,
        resetTokenUsed: false,
      },
    });

    // Write Audit Log
    await AuditService.log(
      "Auth",
      "ADMIN_PASSWORD_OTP_VERIFIED",
      user.id,
      "Admin/Employee OTP verified successfully",
      user.id,
      user.role
    );

    // Return raw reset token ONCE to client
    res.json({
      success: true,
      message: "OTP verified successfully.",
      data: {
        resetToken: rawResetToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend OTP with 60-second cooldown
 */
export async function adminResendOtp(req: Request, res: Response, next: NextFunction) {
  const genericResponse = {
    success: true,
    message: "If an account exists for this email address, a new OTP code has been sent.",
  };

  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.trim()) {
      res.json(genericResponse);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: { in: ["Admin", "Employee"] },
      },
    });

    if (!user) {
      res.json(genericResponse);
      return;
    }

    // Check 60-second cooldown against latest OTP creation
    const latestOtp = await prisma.userOTP.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (latestOtp) {
      const timeSinceLastOtp = (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeSinceLastOtp)} seconds before requesting a new OTP.`,
        });
        return;
      }
    }

    // Invalidate previous unverified OTPs
    await prisma.userOTP.updateMany({
      where: { userId: user.id, verified: false },
      data: { verified: true },
    });

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.userOTP.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    try {
      await EmailService.sendAdminPasswordResetEmail(normalizedEmail, otp);
    } catch (sendErr) {
      console.error("[AdminAuth] Resend OTP email failed:", sendErr);
    }

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * Step 3: Atomic Password Reset using SHA-256 hashed reset token
 */
export async function adminResetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      res.status(400).json({ success: false, message: "Reset token, new password, and confirmation password are required." });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, message: "New password and confirmation password do not match." });
      return;
    }

    // Password policy validation: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!minLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      res.status(400).json({
        success: false,
        message: "Password does not meet requirements: Minimum 8 characters, with uppercase, lowercase, number, and special character.",
      });
      return;
    }

    // Hash supplied reset token using SHA-256
    const resetTokenHash = crypto.createHash("sha256").update(resetToken.trim()).digest("hex");

    // Locate matching reset record
    const otpRecord = await prisma.userOTP.findUnique({
      where: { resetTokenHash },
      include: { user: true },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: "Invalid or expired password reset authorization token." });
      return;
    }

    if (otpRecord.resetTokenUsed) {
      res.status(400).json({ success: false, message: "This password reset token has already been used." });
      return;
    }

    if (!otpRecord.verified) {
      res.status(400).json({ success: false, message: "OTP verification is required before resetting password." });
      return;
    }

    if (!otpRecord.resetTokenExpires || new Date() > new Date(otpRecord.resetTokenExpires)) {
      res.status(400).json({ success: false, message: "Password reset token has expired. Please restart recovery." });
      return;
    }

    // Role check: Admin or Employee only
    if (!["Admin", "Employee"].includes(otpRecord.user.role)) {
      res.status(403).json({ success: false, message: "Forbidden account recovery access." });
      return;
    }

    // Hash new password using bcrypt (10 rounds)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Execute ATOMIC Prisma transaction
    await prisma.$transaction([
      // 1. Update user password
      prisma.user.update({
        where: { id: otpRecord.userId },
        data: { password: newPasswordHash },
      }),
      // 2. Consume reset token
      prisma.userOTP.update({
        where: { id: otpRecord.id },
        data: { resetTokenUsed: true },
      }),
      // 3. Invalidate any remaining active reset tokens/OTPs for this user
      prisma.userOTP.updateMany({
        where: { userId: otpRecord.userId, resetTokenUsed: false },
        data: { resetTokenUsed: true, verified: true },
      }),
    ]);

    // Audit log (Never log password or reset token)
    await AuditService.log(
      "Auth",
      "ADMIN_PASSWORD_CHANGED",
      otpRecord.userId,
      "Admin/Employee password reset successfully changed",
      otpRecord.userId,
      otpRecord.user.role
    );

    res.json({
      success: true,
      message: "Password changed successfully. Please log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}
