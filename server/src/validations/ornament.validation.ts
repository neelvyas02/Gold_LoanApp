import { z } from "zod";

export const OrnamentSchema = z.object({
  category: z.string().min(1, "Category is required"),
  customOrnamentName: z.string().optional().nullable(),
  pieces: z.number().int().positive("Pieces must be at least 1").optional().default(1),
  grossWeight: z.number().positive("Gross weight must be greater than zero"),
  netWeight: z.number().positive("Net weight must be greater than zero"),
  purity: z.string().min(1, "Purity is required"),
  stoneWeight: z.number().nonnegative().optional().default(0),
  estimatedValue: z.number().positive("Estimated value must be greater than zero"),
  remarks: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
  type: z.string().optional(), // kept for compatibility
}).refine((data) => {
  if (data.category.toLowerCase() === "other") {
    return !!data.customOrnamentName && data.customOrnamentName.trim().length > 0;
  }
  return true;
}, {
  message: "Please enter a custom ornament name",
  path: ["customOrnamentName"],
}).refine((data) => data.netWeight <= data.grossWeight, {
  message: "Net weight cannot exceed gross weight",
  path: ["netWeight"],
});
