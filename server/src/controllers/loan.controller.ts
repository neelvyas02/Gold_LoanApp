import type { Request, Response, NextFunction } from "express";
import { LoanService } from "../services/loan.service.js";
import { LoanCreateExistingSchema, LoanUpdateSchema } from "../validations/loan.validation.js";

export async function getLoans(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const loans = await LoanService.getLoans();
    res.json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
}

export async function getLoanByNo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const loanNo = req.params.loanNo as string;
    const loan = await LoanService.getLoanByNo(loanNo);
    if (!loan) {
      res.status(404).json({ success: false, message: "Loan not found" });
      return;
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
}

export async function createLoan(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedData = LoanCreateExistingSchema.parse(req.body);
    const loan = await LoanService.createLoan(validatedData);
    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: loan,
    });
  } catch (error) {
    next(error);
  }
}

export async function closeLoan(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const loanNo = req.params.loanNo as string;
    const loan = await LoanService.closeLoan(loanNo);
    res.json({
      success: true,
      message: "Loan closed successfully",
      data: loan,
    });
  } catch (error) {
    next(error);
  }
}
