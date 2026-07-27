import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.json({ success: true, data: { customers: [], loans: [], payments: [] } });
      return;
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { aadhaar: { contains: q } },
        ],
      },
      take: 5,
    });

    const loans = await prisma.loan.findMany({
      where: {
        OR: [
          { loanNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        customer: { select: { name: true } },
      },
      take: 5,
    });

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { receiptNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        loan: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      take: 5,
    });

    // Also search ornaments by type
    const ornaments = await prisma.ornament.findMany({
      where: {
        type: { contains: q, mode: "insensitive" },
      },
      include: {
        loan: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        customers: customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, customerNumber: c.customerNumber })),
        loans: loans.map(l => ({ id: l.id, loanNumber: l.loanNumber, customerName: l.customer.name, amount: l.loanAmount })),
        payments: payments.map(p => ({ id: p.id, receiptNumber: p.receiptNumber, customerName: p.loan.customer.name, amount: p.amount })),
        ornaments: ornaments.map(o => ({ id: o.id, type: o.type, loanNumber: o.loan.loanNumber, customerName: o.loan.customer.name })),
      },
    });
  } catch (error) {
    next(error);
  }
}
