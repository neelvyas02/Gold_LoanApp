import type { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service.js";

export async function getDashboardStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await DashboardService.getStats();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
