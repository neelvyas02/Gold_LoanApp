import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { LoanService } from "../services/loan.service.js";

function mapLoan(loan: any) {
  if (!loan) return null;
  return {
    ...loan,
    balance: loan.outstandingBalance,
    maturityDate: loan.loanClosingDate,
  };
}

export async function getCustomersReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.customer.findMany({
      include: {
        loans: { select: { id: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getLoansReport(req: Request, res: Response, next: NextFunction) {
  try {
    await LoanService.updateLoanStatuses();
    const data = await prisma.loan.findMany({
      include: {
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: data.map(mapLoan) });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentsReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.payment.findMany({
      include: {
        loan: {
          include: {
            customer: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const mapped = data.map((p: any) => ({
      ...p,
      loan: p.loan ? mapLoan(p.loan) : null
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
}

export async function getOutstandingReport(req: Request, res: Response, next: NextFunction) {
  try {
    await LoanService.updateLoanStatuses();
    const data = await prisma.loan.findMany({
      where: {
        status: { in: ["Active", "Due Soon", "Overdue"] },
        outstandingBalance: { gt: 0 }
      },
      include: {
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: data.map(mapLoan) });
  } catch (error) {
    next(error);
  }
}

export async function getOverdueReport(req: Request, res: Response, next: NextFunction) {
  try {
    await LoanService.updateLoanStatuses();
    const data = await prisma.loan.findMany({
      where: {
        status: "Overdue"
      },
      include: {
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: data.map(mapLoan) });
  } catch (error) {
    next(error);
  }
}
