import { z } from "zod";

export const DocumentUploadSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
  documentType: z.enum(["Aadhaar", "PAN", "Driving Licence", "Voter ID", "Passport"], {
    errorMap: () => ({ message: "Invalid document type." }),
  }),
});

export const OrnamentPhotoUploadSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
});
