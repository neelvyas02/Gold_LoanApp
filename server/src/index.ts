import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dashboardRouter from "./routes/dashboard.routes.js";
import customerRouter from "./routes/customer.routes.js";
import loanRouter from "./routes/loan.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import authRouter from "./routes/auth.routes.js";
import searchRouter from "./routes/search.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import reportsRouter from "./routes/reports.routes.js";
import reminderRouter from "./routes/reminder.routes.js";
import customerAuthRouter from "./routes/customer-auth.routes.js";
import customerPortalRouter from "./routes/customer-portal.routes.js";
import adminTicketsRouter from "./routes/admin-tickets.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config(); // fallback to current directory

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: true, // Reflect request origin dynamically to support any client developer port
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Resolve static paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = process.env.UPLOAD_PATH || "uploads/";
app.use("/uploads", express.static(path.resolve(uploadPath)));

// API Routes
app.use("/api/dashboard", dashboardRouter);
app.use("/api/customers", customerRouter);
app.use("/api/loans", loanRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/search", searchRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/reminders", reminderRouter);

// Customer Portal Dedicated Routes
app.use("/api/customer/auth", customerAuthRouter);
app.use("/api/customer", customerPortalRouter);
app.use("/api/customer-portal", customerPortalRouter); // Alias

// Admin Inspection & Ticket Routes
app.use("/api/admin", adminTicketsRouter);
app.use("/api/admin/tickets", adminTicketsRouter); // Alias

// Base route
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Global Error Handler
app.use(errorMiddleware);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Vyas Finance Server running on http://localhost:${PORT}`);
});
