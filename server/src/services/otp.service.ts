import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { generateNumericOTP } from "../utils/otpGenerator.js";
import type { OTPPurpose } from "@prisma/client";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export const OTPService = {
  /**
   * Generates a crypto-secure 6-digit OTP, enforces 60s cooldown, invalidates old OTPs,
   * hashes the OTP, and saves it to the EmailOTP table.
   * Returns the unhashed OTP only to be sent via the Resend email service.
   */
  async generateAndStoreOTP(customerId: string, email: string, purpose: OTPPurpose = "ACTIVATE"): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();

    // Check 60-second cooldown for the same email and purpose
    const recentOTP = await prisma.emailOTP.findFirst({
      where: {
        email: cleanEmail,
        purpose,
        createdAt: {
          gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentOTP) {
      const elapsedSeconds = Math.floor((Date.now() - recentOTP.createdAt.getTime()) / 1000);
      const remainingSeconds = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
    }

    const otp = generateNumericOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate existing active OTPs for this email and purpose
    await prisma.emailOTP.updateMany({
      where: {
        email: cleanEmail,
        purpose,
        verified: false,
      },
      data: {
        verified: true,
      },
    });

    // Create new OTP record in PostgreSQL via Prisma
    await prisma.emailOTP.create({
      data: {
        customerId,
        email: cleanEmail,
        otpHash,
        purpose,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    return otp;
  },

  /**
   * Verifies an OTP against stored otpHash for a given email and specific purpose.
   * Enforces purpose matching, expiration, single-use verified status, and max 5 failed attempts.
   */
  async verifyOTP(email: string, otp: string, purpose: OTPPurpose = "ACTIVATE"): Promise<{ success: boolean; customerId: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      throw new Error("OTP code must be exactly 6 numeric digits.");
    }

    // Find the latest active (unverified) OTP for this email AND exact purpose
    const activeOTP = await prisma.emailOTP.findFirst({
      where: {
        email: cleanEmail,
        purpose,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeOTP) {
      throw new Error("Invalid OTP code or OTP has expired/already been used. Please request a new OTP.");
    }

    if (activeOTP.purpose !== purpose) {
      throw new Error(`This OTP cannot be used for ${purpose === "ACTIVATE" ? "account activation" : "password reset"}.`);
    }

    if (activeOTP.attempts >= MAX_ATTEMPTS) {
      // Invalidate OTP due to excessive failed attempts
      await prisma.emailOTP.update({
        where: { id: activeOTP.id },
        data: { verified: true },
      });
      throw new Error("Maximum verification attempts exceeded (5/5). Please request a new OTP.");
    }

    if (new Date() > activeOTP.expiresAt) {
      // Invalidate expired OTP
      await prisma.emailOTP.update({
        where: { id: activeOTP.id },
        data: { verified: true },
      });
      throw new Error("OTP has expired. Please request a new OTP.");
    }

    const isMatch = await bcrypt.compare(cleanOtp, activeOTP.otpHash);

    if (!isMatch) {
      const newAttempts = activeOTP.attempts + 1;
      await prisma.emailOTP.update({
        where: { id: activeOTP.id },
        data: { attempts: newAttempts },
      });

      const remaining = MAX_ATTEMPTS - newAttempts;
      if (remaining <= 0) {
        await prisma.emailOTP.update({
          where: { id: activeOTP.id },
          data: { verified: true },
        });
        throw new Error("Invalid OTP code. Maximum verification attempts exceeded. Please request a new OTP.");
      }
      throw new Error(`Invalid OTP code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`);
    }

    // Mark OTP as verified (single-use: prevents replay attacks)
    await prisma.emailOTP.update({
      where: { id: activeOTP.id },
      data: { verified: true },
    });

    return { success: true, customerId: activeOTP.customerId };
  },

  /**
   * Cleans up expired OTP records older than 24 hours.
   */
  async deleteExpiredOTPs(): Promise<number> {
    const result = await prisma.emailOTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    return result.count;
  },
};
