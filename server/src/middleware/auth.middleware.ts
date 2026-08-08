import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || "your_refresh_secret_key";

export interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    username: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication token required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
      return;
    }
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "Customer") {
    res.status(403).json({ success: false, message: "Access denied. Customer account required." });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "Admin") {
    res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    return;
  }
  next();
}

export function requireAdminOrEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "Admin" && req.user?.role !== "Employee") {
    res.status(403).json({ success: false, message: "Access denied. Admin or Employee privileges required." });
    return;
  }
  next();
}

export { JWT_SECRET, REFRESH_JWT_SECRET };
