import { z } from "zod";

export const PaymentCreateSchema = z.object({
  loanId: z.string().min(1, "Loan ID is required"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  amount: z.number().positive("Payment amount must be greater than zero"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  remarks: z.string().optional().nullable(),
});
