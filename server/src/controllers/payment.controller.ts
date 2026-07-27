import type { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service.js";
import { PaymentCreateSchema } from "../validations/payment.validation.js";

export async function getPayments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { loanNo } = req.query;
    const payments = await PaymentService.getPayments(loanNo as string);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedData = PaymentCreateSchema.parse(req.body);
    const payment = await PaymentService.addPayment(validatedData);
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

export async function reversePayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const receiptNo = req.params.receiptNo as string;
    const payment = await PaymentService.reversePayment(receiptNo);
    res.json({
      success: true,
      message: "Payment reversed successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}
