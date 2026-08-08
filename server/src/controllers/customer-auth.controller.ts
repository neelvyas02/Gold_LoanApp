import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import { EmailService } from "../services/email.service.js";
import { OTPService } from "../services/otp.service.js";
import { JWTService } from "../services/jwt.service.js";

async function recordAuditLog(
  module: string,
  action: string,
  description: string,
  performerId?: string,
  performerRole?: string,
  req?: Request
) {
  try {
    const ipAddress = req ? ((req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null) : null;
    await prisma.auditLog.create({
      data: {
        module,
        action,
        description,
        performerId: performerId || null,
        performerRole: performerRole || "Customer",
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

export const CustomerAuthController = {
  /**
   * 1. Send Activation OTP
   * POST /api/customer/auth/send-activation-otp
   * Input: { email: string }
   */
  async sendActivationOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, identifier, mobile } = req.body;
      const targetEmail = (email || identifier || "").trim();

      if (!targetEmail) {
        res.status(400).json({
          success: false,
          message: "Email address is required.",
        });
        return;
      }

      // Check database by email or mobile phone
      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: [
            { email: { equals: targetEmail, mode: "insensitive" } },
            ...(mobile ? [{ phone: mobile.trim() }] : []),
          ],
        },
      });

      // CASE A: Email Not Found
      if (!customer) {
        res.status(404).json({
          success: false,
          message: "No customer found with this email address. Please enter the email address registered by your branch or contact your branch for assistance.",
        });
        return;
      }

      // Customer Account Disabled / Inactive
      if (customer.isActive === false) {
        res.status(403).json({
          success: false,
          message: "Customer account has been disabled. Please contact your branch.",
        });
        return;
      }

      // CASE B: Account Already Activated
      if (customer.isActivated === true) {
        res.status(400).json({
          success: false,
          message: "Account already activated. Please login instead.",
        });
        return;
      }

      // CASE C: Valid Customer -> Generate OTP, Hash OTP, Save to DB, Dispatch Resend Email TO customer
      const otp = await OTPService.generateAndStoreOTP(customer.id, customer.email, "ACTIVATE");
      await EmailService.sendOTPEmail(customer.email, otp, customer.name);

      await recordAuditLog("AUTH", "OTP_SENT", `Activation OTP sent to ${customer.email}`, customer.id, "Customer", req);

      res.json({
        success: true,
        message: "An OTP has been sent to your registered email address.",
        data: {
          customerName: customer.name,
          email: customer.email,
        },
      });
    } catch (error: any) {
      if (error.message && error.message.includes("Please wait")) {
        res.status(429).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  },

  /**
   * 2. Verify OTP Endpoint
   * POST /api/customer/auth/verify-otp
   * Input: { email: string, otp: string, purpose?: string }
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, purpose } = req.body;

      if (!email || !otp) {
        res.status(400).json({ success: false, message: "Email and OTP are required." });
        return;
      }

      const otpPurpose = (purpose || "ACTIVATE") as "ACTIVATE" | "RESET_PASSWORD";
      const result = await OTPService.verifyOTP(email.trim(), otp.trim(), otpPurpose);

      await recordAuditLog("AUTH", "OTP_VERIFIED", `OTP verified for email ${email}`, result.customerId, "Customer", req);

      res.json({
        success: true,
        message: "OTP verified successfully.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Invalid OTP code.",
      });
    }
  },

  /**
   * 3. Activate Account & Set Password
   * POST /api/customer/auth/activate
   * Input: { email: string, password: string, confirmPassword?: string, otp?: string }
   */
  async activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, confirmPassword, otp } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: "Email and Password are required." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        res.status(400).json({ success: false, message: "Password and confirm password do not match." });
        return;
      }

      const customer = await prisma.customer.findFirst({
        where: {
          email: { equals: email.trim(), mode: "insensitive" },
          isArchived: false,
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "No customer found with this email address." });
        return;
      }

      if (customer.isActive === false) {
        res.status(403).json({ success: false, message: "Customer account has been disabled. Please contact your branch." });
        return;
      }

      if (customer.isActivated) {
        res.status(400).json({ success: false, message: "Account already activated. Please login instead." });
        return;
      }

      // If OTP is provided, verify it first against ACTIVATE purpose
      if (otp) {
        await OTPService.verifyOTP(customer.email, otp.trim(), "ACTIVATE");
      }

      // Hash password using bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      // Update Customer table in DB
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordHash,
          isActivated: true,
        },
      });

      // Keep CustomerAuth table synced if present
      await prisma.customerAuth.upsert({
        where: { customerId: customer.id },
        create: {
          customerId: customer.id,
          passwordHash,
          isActivated: true,
          isActive: true,
        },
        update: {
          passwordHash,
          isActivated: true,
          isActive: true,
        },
      });

      // Invalidate any remaining activation OTPs
      await prisma.emailOTP.updateMany({
        where: {
          customerId: customer.id,
          purpose: "ACTIVATE",
          verified: false,
        },
        data: { verified: true },
      });

      await recordAuditLog("AUTH", "ACCOUNT_ACTIVATED", `Account activated for customer ${customer.email}`, customer.id, "Customer", req);

      // Send Welcome Email asynchronously via Resend
      EmailService.sendWelcomeEmail(customer.email, customer.name).catch(console.error);

      // Generate JWT Access & Refresh Tokens
      const tokens = JWTService.generateCustomerTokens({
        id: updatedCustomer.id,
        customerNumber: updatedCustomer.customerNumber,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
      });

      res.json({
        success: true,
        message: "Account activated successfully. Redirecting to dashboard...",
        data: {
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          customer: {
            id: updatedCustomer.id,
            customerNumber: updatedCustomer.customerNumber,
            name: updatedCustomer.name,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  },

  /**
   * 4. Customer Login (Supports Email OR Mobile + Password)
   * POST /api/customer/auth/login
   * Input: { identifier: string, password: string }
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({ success: false, message: "Email/Mobile Number and Password are required." });
        return;
      }

      const cleanIdentifier = identifier.trim();
      const isEmail = cleanIdentifier.includes("@");

      // Search Customer by Email OR Mobile Phone
      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: isEmail
            ? [{ email: { equals: cleanIdentifier, mode: "insensitive" } }]
            : [
                { phone: cleanIdentifier },
                { customerNumber: { equals: cleanIdentifier, mode: "insensitive" } },
              ],
        },
      });

      if (!customer) {
        await recordAuditLog("AUTH", "LOGIN_FAILED", `Login failed for identifier ${cleanIdentifier}: User not found`, undefined, "Customer", req);
        res.status(401).json({ success: false, message: "Invalid email/mobile number or password." });
        return;
      }

      if (customer.isActive === false) {
        await recordAuditLog("AUTH", "LOGIN_FAILED", `Login failed for ${customer.email}: Account disabled`, customer.id, "Customer", req);
        res.status(403).json({ success: false, message: "Customer account has been disabled. Please contact your branch." });
        return;
      }

      if (customer.isActivated === false || !customer.passwordHash) {
        res.status(400).json({ success: false, message: "Account is not activated yet. Please activate your account first." });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);

      if (!isPasswordValid) {
        await recordAuditLog("AUTH", "LOGIN_FAILED", `Login failed for ${customer.email}: Wrong password`, customer.id, "Customer", req);
        res.status(401).json({ success: false, message: "Invalid email/mobile number or password." });
        return;
      }

      // Audit Log Success
      await recordAuditLog("AUTH", "LOGIN_SUCCESS", `Customer ${customer.email} logged in successfully`, customer.id, "Customer", req);

      // Generate JWT Tokens
      const tokens = JWTService.generateCustomerTokens({
        id: customer.id,
        customerNumber: customer.customerNumber,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });

      res.json({
        success: true,
        message: `Welcome back, ${customer.name}!`,
        data: {
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          customer: {
            id: customer.id,
            customerNumber: customer.customerNumber,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 5. Forgot Password - Send OTP
   * POST /api/customer/auth/forgot-password
   * Input: { email: string } or { identifier: string }
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, identifier } = req.body;
      const targetEmail = (email || identifier || "").trim();

      if (!targetEmail) {
        res.status(400).json({ success: false, message: "Please enter your registered email address or mobile number." });
        return;
      }

      const isEmail = targetEmail.includes("@");

      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: isEmail
            ? [{ email: { equals: targetEmail, mode: "insensitive" } }]
            : [{ phone: targetEmail }, { customerNumber: { equals: targetEmail, mode: "insensitive" } }],
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "No customer account found with the provided details." });
        return;
      }

      if (customer.isActive === false) {
        res.status(403).json({ success: false, message: "Customer account has been disabled. Please contact your branch." });
        return;
      }

      if (customer.isActivated === false) {
        res.status(400).json({ success: false, message: "Account is not activated yet. Please activate your account first." });
        return;
      }

      const otp = await OTPService.generateAndStoreOTP(customer.id, customer.email, "RESET_PASSWORD");
      await EmailService.sendPasswordResetEmail(customer.email, otp, customer.name);

      await recordAuditLog("AUTH", "OTP_SENT", `Password reset OTP sent to ${customer.email}`, customer.id, "Customer", req);

      res.json({
        success: true,
        message: "An OTP has been sent to your registered email address for password reset.",
        data: {
          email: customer.email,
        },
      });
    } catch (error: any) {
      if (error.message && error.message.includes("Please wait")) {
        res.status(429).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  },

  /**
   * 6. Reset Password
   * POST /api/customer/auth/reset-password
   * Input: { email: string, otp: string, newPassword: string, confirmPassword?: string }
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, identifier, otp, newPassword, confirmPassword } = req.body;
      const targetEmail = (email || identifier || "").trim();

      if (!targetEmail || !otp || !newPassword) {
        res.status(400).json({ success: false, message: "Email/Identifier, OTP, and new password are required." });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
        return;
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({ success: false, message: "New password and confirm password do not match." });
        return;
      }

      const isEmail = targetEmail.includes("@");

      const customer = await prisma.customer.findFirst({
        where: {
          isArchived: false,
          OR: isEmail
            ? [{ email: { equals: targetEmail, mode: "insensitive" } }]
            : [{ phone: targetEmail }],
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "No customer account found." });
        return;
      }

      // Verify OTP code specifically for RESET_PASSWORD purpose
      await OTPService.verifyOTP(customer.email, otp.trim(), "RESET_PASSWORD");

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update Customer table
      await prisma.customer.update({
        where: { id: customer.id },
        data: { passwordHash },
      });

      // Also sync CustomerAuth table
      await prisma.customerAuth.upsert({
        where: { customerId: customer.id },
        create: {
          customerId: customer.id,
          passwordHash,
          isActivated: true,
          isActive: true,
        },
        update: {
          passwordHash,
        },
      });

      // Invalidate any remaining reset OTPs
      await prisma.emailOTP.updateMany({
        where: {
          customerId: customer.id,
          purpose: "RESET_PASSWORD",
          verified: false,
        },
        data: { verified: true },
      });

      await recordAuditLog("AUTH", "PASSWORD_RESET", `Password reset successfully for ${customer.email}`, customer.id, "Customer", req);

      res.json({
        success: true,
        message: "Password reset successfully! Please log in with your new password.",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to reset password." });
    }
  },

  /**
   * Refresh Token Endpoint
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(401).json({ success: false, message: "Refresh token is required." });
        return;
      }

      const decoded = JWTService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
        return;
      }

      const customer = await prisma.customer.findUnique({ where: { id: decoded.id } });
      if (!customer || !customer.isActive) {
        res.status(401).json({ success: false, message: "Customer account inactive or not found." });
        return;
      }

      const tokens = JWTService.generateCustomerTokens({
        id: customer.id,
        customerNumber: customer.customerNumber,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });

      res.json({
        success: true,
        data: {
          token: tokens.token,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout Endpoint
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    res.json({ success: true, message: "Logged out successfully." });
  },

  /**
   * Send OTP alias method
   */
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    return CustomerAuthController.sendActivationOtp(req, res, next);
  },
};
