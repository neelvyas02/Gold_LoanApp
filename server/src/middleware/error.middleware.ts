import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Backend Error:", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Prisma unique constraint errors
  if (err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target || "field"} already exists.`,
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}
