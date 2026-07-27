import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { AuditService } from "../services/audit.service.js";
import { NotificationService } from "../services/notification.service.js";

export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          companyName: "Vyas Finance",
          companyAddress: "MG Road, Bengaluru, KA 560001",
          contactNumber: "+91 98450 00000",
          defaultInterestRate: 12.0,
          defaultGoldRate: 6000.0,
          reminderDays: 10,
          loanPrefix: "GL",
          receiptPrefix: "RCPT",
          theme: "light",
        },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = req.body;
    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        contactNumber: data.contactNumber,
        defaultInterestRate: Number(data.defaultInterestRate) || 12.0,
        defaultGoldRate: Number(data.defaultGoldRate) || 6000.0,
        reminderDays: Number(data.reminderDays) || 10,
        loanPrefix: data.loanPrefix,
        receiptPrefix: data.receiptPrefix,
        theme: data.theme || "light",
      },
      create: {
        id: "default",
        companyName: data.companyName || "Vyas Finance",
        companyAddress: data.companyAddress || "MG Road, Bengaluru, KA 560001",
        contactNumber: data.contactNumber || "+91 98450 00000",
        defaultInterestRate: Number(data.defaultInterestRate) || 12.0,
        defaultGoldRate: Number(data.defaultGoldRate) || 6000.0,
        reminderDays: Number(data.reminderDays) || 10,
        loanPrefix: data.loanPrefix || "GL",
        receiptPrefix: data.receiptPrefix || "RCPT",
        theme: data.theme || "light",
      },
    });

    // Write audit log
    await AuditService.log(
      "Settings",
      "Settings Updated",
      "default",
      `Company settings updated. Name: ${settings.companyName}`
    );

    // Create notification
    await NotificationService.createNotification(
      "Settings Updated",
      "System configurations and branch settings have been updated.",
      "settings_updated"
    );

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}
