import { prisma } from "../config/prisma.js";
import { LoanService } from "./loan.service.js";

export class DashboardService {
  static async getStats() {
    await LoanService.updateLoanStatuses();

    const todayStr = new Date().toISOString().split("T")[0];

    // Today's Loans
    const todayLoans = await prisma.loan.findMany({
      where: {
        loanDate: todayStr,
      },
      select: {
        loanAmount: true,
      },
    });
    const todayLoansAmt = todayLoans.reduce((sum, l) => sum + l.loanAmount, 0);

    // Today's Collections
    const todayPayments = await prisma.payment.findMany({
      where: {
        paymentDate: todayStr,
      },
      select: {
        amount: true,
      },
    });
    const todayCollAmt = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    // Active Loans Count
    const activeLoansCount = await prisma.loan.count({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
      },
    });

    // Due Soon Count
    const dueSoonCount = await prisma.loan.count({
      where: {
        status: "Due Soon",
      },
    });

    // Overdue Count
    const overdueCount = await prisma.loan.count({
      where: {
        status: "Overdue",
      },
    });

    // Outstanding Balance
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
      },
      select: {
        outstandingBalance: true,
      },
    });
    const outstandingBalance = activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);

    // Interest Earned
    const allLoans = await prisma.loan.findMany({
      select: {
        loanAmount: true,
        interestRate: true,
      },
    });
    const interestEarned = allLoans.reduce((sum, l) => sum + (l.loanAmount * l.interestRate / 100), 0);

    // Recent Payments
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        loan: {
          select: {
            loanNumber: true,
            customer: { select: { name: true } },
          },
        },
      },
    });

    // Recent Loans
    const recentLoans = await prisma.loan.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, id: true } }
      }
    });

    // Dynamic Chart Data for the last 6 months (aggregated in Lakhs)
    const chart = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const startOfMonth = new Date(y, m, 1).toISOString().split("T")[0];
      const endOfMonth = new Date(y, m + 1, 0).toISOString().split("T")[0];

      // Disbursed
      const disbursedLoans = await prisma.loan.findMany({
        where: {
          loanDate: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { loanAmount: true }
      });
      const disbursedVal = disbursedLoans.reduce((sum, l) => sum + l.loanAmount, 0) / 100000; // in Lakhs

      // Collected
      const collectedPayments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { amount: true }
      });
      const collectedVal = collectedPayments.reduce((sum, p) => sum + p.amount, 0) / 100000; // in Lakhs

      chart.push({
        m: monthNames[m],
        v: disbursedVal,
        collected: collectedVal
      });
    }

    // Upcoming dues list (due soon/overdue) for reminders/dashboard cards
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(new Date().getDate() + 10);
    const tenDaysStr = tenDaysFromNow.toISOString().split("T")[0];

    const dueSoonLoans = await prisma.loan.findMany({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
        loanClosingDate: { lte: tenDaysStr },
      },
      include: {
        customer: { select: { name: true } },
      },
    });

    const upcomingDues = dueSoonLoans.map((l) => {
      const closingDate = new Date(l.loanClosingDate);
      const diffTime = closingDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        name: l.customer.name,
        loan: l.loanNumber,
        days: diffDays,
        amount: l.outstandingBalance,
      };
    });

    return {
      todayDisbursed: todayLoansAmt,
      todayCollected: todayCollAmt,
      activeLoans: activeLoansCount,
      dueSoon: dueSoonCount,
      overdue: overdueCount,
      outstandingBalance,
      interestEarned,
      recentLoans: recentLoans.map((l) => ({
        id: l.customer.id,
        name: l.customer.name,
        amount: l.loanAmount,
        status: l.status,
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        rcpt: p.receiptNumber,
        loan: p.loan.loanNumber,
        cust: p.loan.customer.name,
        amount: p.amount,
        date: p.paymentDate,
      })),
      upcomingDues,
      chart,
    };
  }
}
