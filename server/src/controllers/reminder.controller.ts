import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { LoanService } from "../services/loan.service.js";

export async function getReminders(req: Request, res: Response, next: NextFunction) {
  try {
    await LoanService.updateLoanStatuses();
    
    const today = new Date();
    
    // Find all active/due soon/overdue loans
    const loans = await prisma.loan.findMany({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
      },
      include: {
        customer: true,
      },
    });

    const upcomingDues = loans.map((l) => {
      const closingDate = new Date(l.loanClosingDate);
      const diffTime = closingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        name: l.customer.name,
        loan: l.loanNumber,
        days: diffDays,
        amount: l.outstandingBalance,
        phone: l.customer.phone,
      };
    });

    res.json({ success: true, data: upcomingDues });
  } catch (error) {
    next(error);
  }
}
