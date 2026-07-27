import { prisma } from "../config/prisma.js";
import { generateReceiptNumber } from "../utils/generateReceiptNumber.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "./notification.service.js";

export class PaymentService {
  static async getPayments(loanNo?: string) {
    const whereClause: any = {};
    if (loanNo) {
      // Find by loan UUID or loan number
      whereClause.loan = {
        OR: [
          { id: loanNo },
          { loanNumber: loanNo },
        ],
      };
    }

    return prisma.payment.findMany({
      where: whereClause,
      include: {
        loan: {
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async addPayment(payload: any) {
    const { loanId, paymentDate, amount, paymentMode, remarks } = payload;
    const receiptNumber = await generateReceiptNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Fetch loan (first by database UUID, then try by loanNumber)
      let loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { customer: true },
      });

      if (!loan) {
        loan = await tx.loan.findUnique({
          where: { loanNumber: loanId },
          include: { customer: true },
        });
      }

      if (!loan) {
        throw new Error(`Loan ${loanId} not found`);
      }

      // 2. Create Payment
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          loanId: loan.id,
          amount,
          paymentDate,
          paymentMode,
          remarks,
        },
      });

      // 3. Update Loan Balance
      const newBalance = Math.max(0, loan.outstandingBalance - amount);
      const isClosed = newBalance <= 0.01;

      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: {
          outstandingBalance: newBalance,
          status: isClosed ? "Closed" : loan.status,
        },
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          module: "Payment",
          action: "Payment Recorded",
          referenceId: payment.id,
          description: `Payment of ₹${amount} received for loan ${loan.loanNumber}. Receipt: ${receiptNumber}.`,
        },
      });

      // 5. Create Notification
      await tx.notification.create({
        data: {
          title: "Payment Recorded",
          message: `Payment of ₹${amount} received for Loan ${loan.loanNumber}.`,
          type: "payment_success",
        },
      });

      if (isClosed) {
        // Loan closed audit & notification
        await tx.auditLog.create({
          data: {
            module: "Loan",
            action: "Loan Closed",
            referenceId: loan.id,
            description: `Loan ${loan.loanNumber} closed as balance is now zero.`,
          },
        });

        await tx.notification.create({
          data: {
            title: "Loan Closed",
            message: `Loan ${loan.loanNumber} for customer ${loan.customer.name} has been closed.`,
            type: "loan_closed",
          },
        });
      }

      return payment;
    });
  }

  static async reversePayment(receiptNumber: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch payment
      const payment = await tx.payment.findUnique({
        where: { receiptNumber },
        include: {
          loan: {
            include: { customer: true },
          },
        },
      });

      if (!payment) {
        throw new Error(`Payment with receipt ${receiptNumber} not found`);
      }

      // 2. Add amount back to loan balance
      const newBalance = payment.loan.outstandingBalance + payment.amount;
      const isReopened = payment.loan.status === "Closed" && newBalance > 0.01;

      await tx.loan.update({
        where: { id: payment.loanId },
        data: {
          outstandingBalance: newBalance,
          status: isReopened ? "Active" : payment.loan.status,
        },
      });

      // 3. Delete Payment
      await tx.payment.delete({
        where: { receiptNumber },
      });

      // 4. Log Audit
      await tx.auditLog.create({
        data: {
          module: "Payment",
          action: "Payment Reversed",
          referenceId: payment.id,
          description: `Payment Receipt ${receiptNumber} (Amount: ₹${payment.amount}) was reversed/voided.`,
        },
      });

      // 5. Notification
      await tx.notification.create({
        data: {
          title: "Payment Reversed",
          message: `Payment receipt ${receiptNumber} of ₹${payment.amount} has been voided.`,
          type: "payment_reversed",
        },
      });

      return payment;
    });
  }
}
