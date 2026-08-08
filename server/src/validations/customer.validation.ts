import { z } from "zod";
import { OrnamentSchema } from "./ornament.validation.js";

export { OrnamentSchema };

export const LoanCreateSchema = z
  .object({
    loanAmount: z.number().positive("Loan amount must be greater than zero"),
    interestRate: z.number().nonnegative("Interest rate cannot be negative"),
    loanDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    loanType: z.string().min(1, "Loan type is required"),
    maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  })
  .refine(
    (data) => {
      const loan = new Date(data.loanDate);
      const closing = new Date(data.maturityDate);
      return closing >= loan;
    },
    {
      message: "Closing Date cannot be earlier than the Loan Date.",
      path: ["maturityDate"],
    }
  )
  .refine(
    (data) => {
      const closing = new Date(data.maturityDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return closing >= today;
    },
    {
      message: "Closing Date cannot be in the past.",
      path: ["maturityDate"],
    }
  );

export const CustomerCreateSchema = z
  .object({
    name: z.string().min(1, "Customer Name is required").min(3, "Full name must be at least 3 characters long"),
    phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
    email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
    aadhaar: z.string().regex(/^\d{12}$/, "Invalid Aadhaar Number (must be 12 digits)."),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number format (e.g. ABCDE1234F)."),
    alternatePhone: z
      .string()
      .regex(/^\d{10}$/, "Alternate phone must be 10 digits")
      .optional()
      .nullable()
      .or(z.literal("")),
    dob: z
      .string()
      .min(1, "Date of Birth is required")
      .refine(
        (val) => {
          if (!val) return false;
          const dobDate = new Date(val);
          const today = new Date();
          return dobDate < today;
        },
        { message: "Date of Birth cannot be in the future." }
      ),
    occupation: z.string().optional().nullable().or(z.literal("")),
    nomineeName: z.string().optional().nullable().or(z.literal("")),
    nomineePhone: z.string().optional().nullable().or(z.literal("")),
    address: z.string().min(1, "Address is required"),
    aadhaarDocument: z.string().optional().nullable().or(z.literal("")),
    panDocument: z.string().optional().nullable().or(z.literal("")),
    loan: LoanCreateSchema.optional(),
    ornaments: z.array(OrnamentSchema).optional(),
    documents: z
      .array(
        z.object({
          documentType: z.string(),
          fileName: z.string(),
          filePath: z.string(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.alternatePhone && data.alternatePhone.trim() !== "") {
        return data.phone.trim() !== data.alternatePhone.trim();
      }
      return true;
    },
    {
      message: "Primary phone and alternate phone numbers cannot be identical.",
      path: ["alternatePhone"],
    }
  );

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
