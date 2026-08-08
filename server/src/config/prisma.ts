import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Always resolve the root project directory .env
const rootEnv = path.resolve(process.cwd(), "../.env");
const cwdEnv = path.resolve(process.cwd(), ".env");
const directRootEnv = "C:\\Users\\nutan\\OneDrive\\Desktop\\GoldApp\\Gold_LoanApp\\.env";

if (fs.existsSync(directRootEnv)) {
  dotenv.config({ path: directRootEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
}
dotenv.config();

export const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL
    ? {
        db: {
          url: process.env.DATABASE_URL,
        },
      }
    : undefined,
  log: ["query", "info", "warn", "error"],
});
