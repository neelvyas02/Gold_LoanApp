import { z } from "zod";
import { OrnamentSchema } from "./ornament.validation.js";

export const LoanCreateExistingSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  loanAmount: z.number().positive("Loan amount must be greater than zero"),
  interestRate: z.number().nonnegative("Interest rate cannot be negative"),
  loanDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  loanType: z.string().min(1, "Loan type is required"),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  ornaments: z.array(OrnamentSchema).min(1, "At least one ornament must be pledged"),
}).refine((data) => {
  const loan = new Date(data.loanDate);
  const closing = new Date(data.maturityDate);
  return closing >= loan;
}, {
  message: "Closing Date cannot be earlier than the Loan Date",
  path: ["maturityDate"],
}).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closing = new Date(data.maturityDate);
  closing.setHours(0, 0, 0, 0);
  return closing >= today;
}, {
  message: "Closing Date cannot be in the past",
  path: ["maturityDate"],
});

export const LoanUpdateSchema = z.object({
  loanAmount: z.number().positive().optional(),
  interestRate: z.number().nonnegative().optional(),
  loanDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  loanType: z.string().min(1).optional(),
  status: z.enum(["Active", "Due Soon", "Overdue", "Closed"]).optional(),
});
