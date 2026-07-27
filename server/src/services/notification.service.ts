import { prisma } from "../config/prisma.js";

export class NotificationService {
  static async getNotifications() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);
    const tenDaysStr = tenDaysFromNow.toISOString().split("T")[0];

    // Scan loans to generate dynamic alerts
    const loans = await prisma.loan.findMany({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
      },
      include: {
        customer: true,
      },
    });

    for (const loan of loans) {
      const closingDate = new Date(loan.loanClosingDate);
      const diffTime = closingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Overdue
        const id = `OVERDUE-${loan.loanNumber}`;
        const exists = await prisma.notification.findUnique({ where: { id } });
        if (!exists) {
          await prisma.notification.create({
            data: {
              id,
              title: "Loan Overdue",
              message: `Loan ${loan.loanNumber} for ${loan.customer.name} is overdue by ${Math.abs(diffDays)} days.`,
              type: "overdue",
            },
          });
        }
      } else if (diffDays === 1) {
        // Due Tomorrow
        const id = `DUE-TOMORROW-${loan.loanNumber}`;
        const exists = await prisma.notification.findUnique({ where: { id } });
        if (!exists) {
          await prisma.notification.create({
            data: {
              id,
              title: "Loan Due Tomorrow",
              message: `Loan ${loan.loanNumber} for ${loan.customer.name} is due tomorrow.`,
              type: "due_1",
            },
          });
        }
      } else if (diffDays <= 5) {
        // Due in 5 Days
        const id = `DUE-5-${loan.loanNumber}`;
        const exists = await prisma.notification.findUnique({ where: { id } });
        if (!exists) {
          await prisma.notification.create({
            data: {
              id,
              title: "Loan Due in 5 Days",
              message: `Loan ${loan.loanNumber} for ${loan.customer.name} is due in 5 days.`,
              type: "due_5",
            },
          });
        }
      } else if (diffDays <= 10) {
        // Due in 10 Days
        const id = `DUE-10-${loan.loanNumber}`;
        const exists = await prisma.notification.findUnique({ where: { id } });
        if (!exists) {
          await prisma.notification.create({
            data: {
              id,
              title: "Loan Due in 10 Days",
              message: `Loan ${loan.loanNumber} for ${loan.customer.name} is due in 10 days.`,
              type: "due_10",
            },
          });
        }
      }
    }

    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async createNotification(title: string, message: string, type: string) {
    try {
      return await prisma.notification.create({
        data: {
          title,
          message,
          type,
        },
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }
}
