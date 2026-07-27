import { z } from "zod";
import { OrnamentSchema } from "./ornament.validation.js";

export { OrnamentSchema };

export const LoanCreateSchema = z.object({
  loanAmount: z.number().positive("Loan amount must be greater than zero"),
  interestRate: z.number().nonnegative("Interest rate cannot be negative"),
  loanDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  loanType: z.string().min(1, "Loan type is required"),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
}).refine((data) => {
  const loan = new Date(data.loanDate);
  const closing = new Date(data.maturityDate);
  return closing >= loan;
}, {
  message: "Closing Date cannot be earlier than the Loan Date",
  path: ["maturityDate"],
});

export const CustomerCreateSchema = z.object({
  name: z.string().min(1, "Customer Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
  aadhaar: z.string().regex(/^\d{12}$/, "Invalid Aadhaar Number."),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number."),
  alternatePhone: z.string().regex(/^\d{10}$/, "Alternate phone must be 10 digits").optional().nullable().or(z.literal("")),
  dob: z.string().optional().nullable().or(z.literal("")),
  occupation: z.string().optional().nullable().or(z.literal("")),
  nomineeName: z.string().optional().nullable().or(z.literal("")),
  nomineePhone: z.string().optional().nullable().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  aadhaarDocument: z.string().optional().nullable(),
  panDocument: z.string().optional().nullable(),
  loan: LoanCreateSchema.optional(),
  ornaments: z.array(OrnamentSchema).optional(),
  documents: z.array(z.object({
    documentType: z.string(),
    fileName: z.string(),
    filePath: z.string(),
  })).optional(),
});

export const CustomerUpdateSchema = z.object({
  name: z.string().min(1, "Customer Name is required").optional(),
  phone: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits").optional(),
  email: z.string().email("Please enter a valid email address.").optional(),
  aadhaar: z.string().regex(/^\d{12}$/, "Invalid Aadhaar Number.").optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number.").optional(),
  alternatePhone: z.string().regex(/^\d{10}$/).optional().nullable().or(z.literal("")),
  address: z.string().optional(),
  aadhaarDocument: z.string().optional().nullable(),
  panDocument: z.string().optional().nullable(),
});
