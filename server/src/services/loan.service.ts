import { prisma } from "../config/prisma.js";
import { generateLoanNumber } from "../utils/generateLoanNumber.js";
import { calculateInterest } from "../utils/calculateInterest.js";
import { calculateMaturity } from "../utils/calculateMaturity.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "./notification.service.js";

export class LoanService {
  static async updateLoanStatuses() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);
    const tenDaysStr = tenDaysFromNow.toISOString().split("T")[0];

    const loans = await prisma.loan.findMany({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
      },
    });

    for (const loan of loans) {
      let newStatus = "Active";
      if (loan.loanClosingDate < todayStr) {
        newStatus = "Overdue";
      } else if (loan.loanClosingDate <= tenDaysStr) {
        newStatus = "Due Soon";
      }

      if (loan.status !== newStatus) {
        await prisma.loan.update({
          where: { id: loan.id },
          data: { status: newStatus },
        });
      }
    }
  }

  static async getLoans() {
    await this.updateLoanStatuses();
    const loans = await prisma.loan.findMany({
      include: {
        customer: {
          select: { name: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return loans.map(l => ({
      ...l,
      balance: l.outstandingBalance,
      maturityDate: l.loanClosingDate,
    }));
  }

  static async getLoanByNo(loanNo: string) {
    await this.updateLoanStatuses();
    
    // First try by database UUID, then try by loanNumber
    let loan = await prisma.loan.findUnique({
      where: { id: loanNo },
      include: {
        customer: true,
        ornaments: {
          include: { photos: true },
        },
        payments: true,
      },
    });

    if (!loan) {
      loan = await prisma.loan.findUnique({
        where: { loanNumber: loanNo },
        include: {
          customer: true,
          ornaments: {
            include: { photos: true },
          },
          payments: true,
        },
      });
    }

    if (!loan) return null;
    return {
      ...loan,
      balance: loan.outstandingBalance,
      maturityDate: loan.loanClosingDate,
    };
  }

  static async createLoan(payload: any) {
    const { customerId, loanAmount, interestRate, loanDate, loanType, maturityDate, ornaments } = payload;
    const loanNumber = await generateLoanNumber();

    const rate = interestRate || 12;
    const loanDateVal = new Date(loanDate);
    const closingDateVal = new Date(maturityDate);
    const diffTime = closingDateVal.getTime() - loanDateVal.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const loanTenure = diffTime > 0 ? Math.max(1, Math.round(diffDays / 30.44)) : 12;

    const totalInterest = calculateInterest(loanAmount, rate, loanTenure);
    const totalPayable = loanAmount + totalInterest;
    const outstandingBalance = totalPayable;

    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          loanNumber,
          customerId,
          loanAmount,
          interestRate: rate,
          loanDate,
          loanClosingDate: maturityDate,
          loanTenure,
          totalInterest,
          totalPayable,
          outstandingBalance,
          status: "Active",
          loanType: loanType || "regular",
        },
        include: {
          customer: true,
        },
      });

      if (ornaments && ornaments.length > 0) {
        for (const o of ornaments) {
          const createdOrnament = await tx.ornament.create({
            data: {
              loanId: loan.id,
              type: o.category.toLowerCase() === "other" ? (o.customOrnamentName || "Other") : o.category,
              category: o.category,
              customOrnamentName: o.category.toLowerCase() === "other" ? o.customOrnamentName : null,
              pieces: o.pieces || 1,
              grossWeight: o.grossWeight,
              netWeight: o.netWeight,
              purity: o.purity,
              stoneWeight: o.stoneWeight || 0,
              estimatedValue: o.estimatedValue,
              remarks: o.remarks,
            },
          });

          if (o.photos && o.photos.length > 0) {
            for (const path of o.photos) {
              const parts = path.split("/");
              const fileName = parts[parts.length - 1];
              await tx.ornamentPhoto.create({
                data: {
                  ornamentId: createdOrnament.id,
                  fileName,
                  filePath: path,
                },
              });
            }
          }
        }
      }

      await tx.auditLog.create({
        data: {
          module: "Loan",
          action: "Loan Created",
          referenceId: loan.id,
          description: `Loan ${loanNumber} of amount ₹${loanAmount} created for customer ${loan.customer.name}.`,
        },
      });

      return {
        ...loan,
        balance: loan.outstandingBalance,
        maturityDate: loan.loanClosingDate,
      };
    });
  }

  static async closeLoan(id: string) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!loan) {
        throw new Error(`Loan ${id} not found`);
      }

      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          status: "Closed",
          outstandingBalance: 0,
        },
      });

      // Log Audit
      await tx.auditLog.create({
        data: {
          module: "Loan",
          action: "Loan Closed",
          referenceId: id,
          description: `Loan ${loan.loanNumber} for customer ${loan.customer.name} has been closed.`,
        },
      });

      // Create Notification
      await tx.notification.create({
        data: {
          title: "Loan Closed",
          message: `Loan ${loan.loanNumber} for customer ${loan.customer.name} has been closed.`,
          type: "loan_closed",
        },
      });

      return {
        ...updatedLoan,
        balance: updatedLoan.outstandingBalance,
        maturityDate: updatedLoan.loanClosingDate,
      };
    });
  }
}
