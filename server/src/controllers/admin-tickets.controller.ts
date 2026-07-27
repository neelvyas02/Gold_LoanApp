import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

async function recordAuditLog(module: string, action: string, description: string, performerId?: string, performerRole?: string, req?: Request) {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || null) : null;
    await prisma.auditLog.create({
      data: {
        module,
        action,
        description,
        performerId: performerId || null,
        performerRole: performerRole || "Admin",
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Audit log recording error:", err);
  }
}

export const AdminTicketsController = {
  // 1. Get all tickets with filtering and search
  async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const whereClause: any = {};

      if (status && typeof status === "string" && status !== "all") {
        whereClause.status = status;
      }

      if (search && typeof search === "string" && search.trim() !== "") {
        const query = search.trim().toLowerCase();
        whereClause.OR = [
          { ticketNumber: { contains: query, mode: "insensitive" } },
          { subject: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          {
            customer: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { customerNumber: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        ];
      }

      const tickets = await prisma.supportTicket.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              customerNumber: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
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

  // 2. Reply to ticket and update status
  async updateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminReply } = req.body;

      const updated = await prisma.supportTicket.update({
        where: { id: id as string },
        data: {
          status: typeof status === "string" ? status : undefined,
          adminReply: typeof adminReply === "string" ? adminReply : undefined,
        },
        include: {
          customer: {
            select: {
              id: true,
              customerNumber: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Create notification for the customer if reply is added
      if (adminReply && typeof adminReply === "string") {
        await prisma.notification.create({
          data: {
            title: `Reply to Ticket ${updated.ticketNumber}`,
            message: `Admin replied: "${adminReply.substring(0, 100)}${adminReply.length > 100 ? "..." : ""}"`,
            type: "ticket_reply",
            priority: "high",
            actionUrl: "/portal/support",
            customerId: updated.customerId,
          },
        });
      }

      await recordAuditLog(
        "ADMIN_SUPPORT",
        "TICKET_REPLY",
        `Admin updated ticket ${updated.ticketNumber} status to ${updated.status}`,
        req.user?.id,
        req.user?.role || "Admin",
        req
      );

      res.json({
        success: true,
        message: "Support ticket updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Get customers list for Admin
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await prisma.customer.findMany({
        include: {
          auth: {
            select: {
              isVerified: true,
              isActive: true,
              lastLogin: true,
            },
          },
          loans: {
            select: { id: true, loanNumber: true, status: true, outstandingBalance: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Get customer detail for Admin
  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await prisma.customer.findUnique({
        where: { id: id as string },
        include: {
          auth: {
            select: {
              isVerified: true,
              isActive: true,
              lastLogin: true,
              failedAttempts: true,
              lockedUntil: true,
            },
          },
          loans: {
            include: {
              ornaments: true,
              payments: true,
            },
          },
          documents: true,
          tickets: true,
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
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
};
