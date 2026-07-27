import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_JWT_SECRET } from "../middleware/auth.middleware.js";

export interface CustomerJWTPayload {
  id: string;
  customerNumber: string;
  name: string;
  email: string;
  phone: string;
  role: "Customer";
}

export const JWTService = {
  generateCustomerTokens(customer: { id: string; customerNumber: string; name: string; email: string; phone: string }) {
    const payload: CustomerJWTPayload = {
      id: customer.id,
      customerNumber: customer.customerNumber,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: "Customer",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign({ id: customer.id, role: "Customer" }, REFRESH_JWT_SECRET, { expiresIn: "7d" });

    return { token, refreshToken };
  },

  verifyToken(token: string): CustomerJWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as CustomerJWTPayload;
    } catch {
      return null;
    }
  },

  verifyRefreshToken(token: string): { id: string; role: string } | null {
    try {
      return jwt.verify(token, REFRESH_JWT_SECRET) as { id: string; role: string };
    } catch {
      return null;
    }
  },
};
