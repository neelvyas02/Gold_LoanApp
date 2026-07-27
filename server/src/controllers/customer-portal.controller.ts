import type { Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { deleteOldFile } from "../middleware/upload.middleware.js";

async function generateTicketNumber(): Promise<string> {
  const lastTicket = await prisma.supportTicket.findFirst({
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  if (!lastTicket) return "TKT0001";
  const numericPart = parseInt(lastTicket.ticketNumber.replace("TKT", ""), 10);
  return `TKT${String(numericPart + 1).padStart(4, "0")}`;
}

async function recordAuditLog(module: string, action: string, description: string, performerId?: string, req?: AuthenticatedRequest) {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || null) : null;
    await prisma.auditLog.create({
      data: {
        module,
        action,
        description,
        performerId: performerId || null,
        performerRole: "Customer",
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Audit log recording error:", err);
  }
}

export const CustomerPortalController = {
  // 1. Get Profile
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          documents: true,
          auth: {
            select: {
              isVerified: true,
              isActive: true,
              lastLogin: true,
            },
          },
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer profile not found" });
        return;
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Update Profile
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { alternatePhone, address, email } = req.body;
      let newProfilePhoto: string | undefined = undefined;

      // Handle uploaded file if present
      if (req.file) {
        newProfilePhoto = `/uploads/profiles/${req.file.filename}`;

        // Fetch existing profile photo to delete old file
        const currentCustomer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { profilePhoto: true },
        });

        if (currentCustomer?.profilePhoto) {
          deleteOldFile(currentCustomer.profilePhoto);
        }
      }

      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          alternatePhone: alternatePhone !== undefined ? alternatePhone : undefined,
          address: address !== undefined ? address : undefined,
          email: email !== undefined ? email : undefined,
          profilePhoto: newProfilePhoto !== undefined ? newProfilePhoto : undefined,
        },
      });

      await recordAuditLog("CUSTOMER_PORTAL", "PROFILE_UPDATE", `Customer ${customer.customerNumber} updated profile details`, customerId, req);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Dashboard Metrics
  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          loans: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      const activeLoans = customer.loans.filter((l) => l.status !== "Closed");
      const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;

      const activeLoanCount = activeLoans.length;
      const outstandingBalance = activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
      const interestDue = activeLoans.reduce((sum, l) => sum + l.totalInterest, 0);
      const totalPaid = customer.loans.reduce((sum, l) => {
        return sum + l.payments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0);

      // Last payment
      const allPayments = customer.loans.flatMap((l) => l.payments);
      allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastPayment = allPayments.length > 0 ? allPayments[0] : null;

      // Filter customer notifications
      const loanNumbers = customer.loans.map((l) => l.loanNumber);
      const customerNameLower = customer.name.toLowerCase();
      const customerNumberLower = customer.customerNumber.toLowerCase();

      const allNotifs = await prisma.notification.findMany({
        where: {
          OR: [
            { customerId: customer.id },
            { customerId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const recentNotifications = allNotifs.filter((n) => {
        if (n.customerId === customer.id) return true;
        const msg = n.message.toLowerCase();
        return (
          msg.includes(customerNameLower) ||
          msg.includes(customerNumberLower) ||
          loanNumbers.some((ln) => msg.includes(ln.toLowerCase()))
        );
      });

      res.json({
        success: true,
        data: {
          activeLoanCount,
          activeLoanStatus: activeLoan ? activeLoan.status : "No Active Loan",
          outstandingBalance,
          interestDue,
          nextPaymentDue: activeLoan ? activeLoan.loanClosingDate : null,
          loanClosingDate: activeLoan ? activeLoan.loanClosingDate : null,
          totalPaid,
          lastPayment,
          recentNotifications,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Get Loans
  async getLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const loans = await prisma.loan.findMany({
        where: { customerId },
        include: {
          ornaments: {
            include: {
              photos: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: loans,
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Get Payments
  async getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const payments = await prisma.payment.findMany({
        where: {
          loan: {
            customerId,
          },
        },
        include: {
          loan: {
            select: {
              loanNumber: true,
              outstandingBalance: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  },

  // 6. Get Documents
  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const documents = await prisma.document.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  },

  // 7. Get Ornaments
  async getOrnaments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const ornaments = await prisma.ornament.findMany({
        where: {
          loan: {
            customerId,
          },
        },
        include: {
          photos: true,
          loan: {
            select: {
              loanNumber: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: ornaments,
      });
    } catch (error) {
      next(error);
    }
  },

  // 8. Notifications
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { loans: true },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      const loanNumbers = customer.loans.map((l) => l.loanNumber);
      const customerNameLower = customer.name.toLowerCase();
      const customerNumberLower = customer.customerNumber.toLowerCase();

      const allNotifs = await prisma.notification.findMany({
        where: {
          OR: [
            { customerId: customer.id },
            { customerId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const filtered = allNotifs.filter((n) => {
        if (n.customerId === customer.id) return true;
        const msg = n.message.toLowerCase();
        return (
          msg.includes(customerNameLower) ||
          msg.includes(customerNumberLower) ||
          loanNumbers.some((ln) => msg.includes(ln.toLowerCase()))
        );
      });

      res.json({
        success: true,
        data: filtered,
      });
    } catch (error) {
      next(error);
    }
  },

  // 9. Mark Notification Read
  async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.notification.update({
        where: { id: id as string },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({
        success: true,
        message: "Notification marked as read",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // 10. Mark All Read
  async markAllNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      await prisma.notification.updateMany({
        where: {
          OR: [
            { customerId },
            { customerId: null },
          ],
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  },

  // 11. Delete Notification
  async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.notification.delete({
        where: { id: id as string },
      });
      res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // 12. Get Support Tickets
  async getSupportTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const tickets = await prisma.supportTicket.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  },

  // 13. Submit Support Ticket
  async submitSupportTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { category, subject, description, message } = req.body;
      const ticketDescription = description || message;

      if (!category || !subject || !ticketDescription) {
        res.status(400).json({ success: false, message: "Category, subject, and description are required" });
        return;
      }

      const ticketNumber = await generateTicketNumber();

      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          customerId,
          category,
          subject,
          description: ticketDescription,
          status: "Open",
        },
      });

      await recordAuditLog("SUPPORT_TICKET", "TICKET_CREATED", `Created ticket ${ticketNumber}: ${subject}`, customerId, req);

      res.status(201).json({
        success: true,
        message: "Support ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  },

  // 14. Change Password
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: "Current and new passwords are required" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
        return;
      }

      const customerAuth = await prisma.customerAuth.findUnique({
        where: { customerId },
      });

      if (!customerAuth) {
        res.status(404).json({ success: false, message: "Customer authentication record not found" });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, customerAuth.passwordHash);
      if (!isValid) {
        res.status(400).json({ success: false, message: "Invalid current password" });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.customerAuth.update({
        where: { customerId },
        data: { passwordHash: hashedPassword },
      });

      await recordAuditLog("CUSTOMER_PORTAL", "PASSWORD_CHANGED", "Customer changed account password", customerId, req);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
