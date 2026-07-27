import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { generateNumericOTP } from "../utils/otpGenerator.js";
import type { OTPPurpose } from "@prisma/client";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
const MAX_ATTEMPTS = 5;

export const OTPService = {
  /**
   * Generates a crypto-secure 6-digit OTP, hashes it, and saves it to the EmailOTP table.
   * Returns the unhashed OTP to be sent via email service.
   */
  async generateAndStoreOTP(customerId: string, email: string, purpose: OTPPurpose = "ACTIVATE"): Promise<string> {
    const otp = generateNumericOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate existing active OTPs for this email and purpose
    await prisma.emailOTP.updateMany({
      where: {
        email,
        purpose,
        verified: false,
      },
      data: {
        verified: true,
      },
    });

    // Create new OTP record
    await prisma.emailOTP.create({
      data: {
        customerId,
        email,
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
   * Verifies an OTP against stored otpHash for a given email and purpose.
   * Checks expiration, verified status, and enforces max 5 attempt limit.
   */
  async verifyOTP(email: string, otp: string, purpose: OTPPurpose = "ACTIVATE"): Promise<{ success: boolean; customerId: string }> {
    const activeOTP = await prisma.emailOTP.findFirst({
      where: {
        email,
        purpose,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeOTP) {
      throw new Error("No active OTP found or OTP has already been used. Please request a new OTP.");
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
      throw new Error("OTP has expired. Please request a new OTP.");
    }

    const isMatch = await bcrypt.compare(otp.trim(), activeOTP.otpHash);

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

    // Mark OTP as verified (single use)
    await prisma.emailOTP.update({
      where: { id: activeOTP.id },
      data: { verified: true },
    });

    return { success: true, customerId: activeOTP.customerId };
  },

  /**
   * Cleans up expired OTP records from the database.
   */
  async deleteExpiredOTPs(): Promise<number> {
    const result = await prisma.emailOTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // older than 24 hours
        },
      },
    });
    return result.count;
  },
};
